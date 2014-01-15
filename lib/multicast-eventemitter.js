// Copyright 2011 Thorcom Systems Ltd.  All Rights Reserved.

var VERSION_0_8_X = "v0.8.x";
var VERSION_0_10_X = "v0.10.x";
var version = nodeVersion();

/* 
 * This is required because they changed the way that bind works between 0.8.x and 0.10.x
 * I have not yet found a way of writing code which works on both, without this switch.
 */
function nodeVersion() {
  if (process.version.match(/^v0\.8\./)) {
    return VERSION_0_8_X; 
  } else if (process.version.match(/^v0\.10\./)) {
    return VERSION_0_10_X; 
  } else {
    throw 'multicast-eventemitter can only work with NodeJS v0.8.x and v0.10.x';
  }
}

var dgram = require('dgram')
  , util = require('util')
  , hasher = require('./hasher')
  ;


var options = exports.options = {
    'transport': 'multicast' // 'pgm' (zeromq) to follow...
  , 'multicastInterface': undefined
  , 'ttl': 64
  , 'overrides' : {} // should be of form "event_name: { address: 'address', port: port }"
}

var emitter; // singleton


/* 
 * A function to get or create the singleton emitter.
 */
exports.getEmitter = getEmitter;
function getEmitter() {
  if (!emitter) {
    emitter = new MulticastEventEmitter();
  }
  return emitter;
}

/*
 * The constructor.  Perhaps this shouldn't be exported?
 */
exports.MulticastEventEmitter = MulticastEventEmitter;
function MulticastEventEmitter() {
  this.src = getIPv4Address() + '/' + process.pid;
  this.listenersByEvent = {}; // a hash of arrays of functions
  this.serversByEvent = {}; // a hash of bound datagram rx servers
  this.lastSeq = {};  // a hash of last heard sequence number, by src and event
  this.seqByEvent = {};  // a hash of last sent sequence numbers, by event
  this.sender = dgram.createSocket('udp4');
  var that = this;
  this.sender.bind(function() {
    that.sender.setBroadcast(true);
    that.sender.setMulticastTTL(options.ttl);
    that.sender.setMulticastLoopback(true); // needed from inter-process intra-box comms
  });
} 

/*
 * This adds a listener.
 */
MulticastEventEmitter.prototype.addListener = function(event, listener) {
  //console.log('addListener', event, listener);
  if (!this.listenersByEvent[event]) { // make a new multicast listener and an empty array
    this.listenersByEvent[event] = [];
    var hash;
    if (options.overrides[event]) {
      hash = options.overrides[event];
    } else {
      hash = hasher.hash(event);
    }

    // FIXME: add code to cope with hash collisions (should be rare as we have ~39 bits of hash space)
    // create and keep track of udp multicast listening server
    var that = this;
    var server = this.serversByEvent[event] = dgram.createSocket('udp4');

    // work around lack of backwards compatibility of NodeJS v0.10.X re: multicast
    if (version === VERSION_0_10_X) {
      server.bind(hash.port, hash.address, function() {
        server.setMulticastTTL(options.ttl);
        server.addMembership(hash.address, options.multicastInterface);     
        server.setMulticastLoopback(true); // needed from inter-process intra-box comms
        server.on('message', function(msg, rinfo) { that.handleMessage(event, msg, rinfo); });
      });
    } else { // VERSION_0_8_X
      server.bind(hash.port, hash.address);
      server.setMulticastTTL(options.ttl);
      server.addMembership(hash.address, options.multicastInterface);     
      server.setMulticastLoopback(true); // needed from inter-process intra-box comms
      server.on('message', function(msg, rinfo) { that.handleMessage(event, msg, rinfo); });
    }
  }
  this.listenersByEvent[event].push(listener);
}

/*
 * This handles the incoming messages.
 */
MulticastEventEmitter.prototype.handleMessage = function(event, msg, rinfo) {
  //console.log('handleMessage', event, msg, rinfo);
  try {
    var message = JSON.parse(msg.toString('utf8'));
    //if (this.lastSeq[message.src] && CONTINUIE HERE
    if (message.seq) {
     var key = message.src + '/' + event;
     if (!this.lastSeq[key]) this.lastSeq[key] = 0;
     var missed = message.seq - (this.lastSeq[key] + 1);
      if (missed) {
        console.warn(missed, 'messages missed', this.lastSeq[key]);
      } else {
        //console.info(missed, 'messages missed', this.lastSeq[key], key);
      } 
      this.lastSeq[key] = message.seq;
    }
  } catch(e) {
    console.warn('error parsing multicast message:', msg);
  }

  var list = this.listenersByEvent[event];
  //console.log('list', list);
  for (var i in list) {
    var listener = list[i];
    // TODO: should we use nextTick here?
    if (message.args) {
      listener.apply(undefined, message.args);
    } else {
      // If the message doesn't follow the spec, pass it all on.
      // (Needed for legacy apps).
      listener.call(undefined, message);
    }
  }
}

MulticastEventEmitter.prototype.on = MulticastEventEmitter.prototype.addListener;

/*
 * Emit an event.
 */
MulticastEventEmitter.prototype.emit = function(event) { // varargs...
  var args = Array.prototype.slice.call(arguments);
  args.shift(); // don't send the event name as one of the arguments
  //console.log('emit', args);
  if (!this.seqByEvent[event]) this.seqByEvent[event] = 0;
  var hash;
  var message;
  if (options.overrides[event]) {
    hash = options.overrides[event];
    message = new Buffer(JSON.stringify(args[0]));
  } else {
    hash = hasher.hash(event);
    message = new Buffer(JSON.stringify({ event: event, args: args, src: this.src, seq: this.seqByEvent[event]++ }));
  }
  //console.log("this.sender.send(" + message + ", " + 0 + ", " + message.length + ", " + hash.port + ", " +  hash.address + ");");
  this.sender.send(message, 0, message.length, hash.port, hash.address);
}


/*
 * Get the first non-localhost IPv4 address.  
 * This is only used for unique identification (with pid), not comms.
 */
function getIPv4Address() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }

  return '0.0.0.0';
}
