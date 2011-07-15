// Copyright 2011 Thorcom Systems Ltd.  All Rights Reserved.

var dgram = require('dgram')
  , util = require('util')
  , hasher = require('./hasher')
  ;


var options = exports.options = {
    'transport': 'multicast' // 'pgm' (zeromq) to follow...
  , 'multicastInteface': undefined
  , 'ttl': 64
  , 'overrides' : {} // should be of form "event_name: { address: 'address', port: port }"
}

var emitter; // singleton

exports.getEmitter = getEmitter;
function getEmitter() {
  if (!emitter) {
    emitter = new MulticastEventEmitter();
  }
  return emitter;
}

exports.MulticastEventEmitter = MulticastEventEmitter;
function MulticastEventEmitter() {
  this.listenersByEvent = {}; // a hash of arrays of functions
  this.serversByEvent = {}; // a hash of bound datagram servers
  this.lastSeq = {};  // a hash of last heard sequence number, by src
  this.src = Math.random(); // unique id of this sender
  this.seq = 0;
} 

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
    var server = this.serversByEvent = dgram.createSocket('udp4');
    server.addMembership(hash.address, options.multicastInterface);     
    server.setMulticastTTL(options.ttl);
    server.setMulticastLoopback(true); // needed from inter-process intra-box comms
    var that = this;
    server.on('message', function(msg, rinfo) { that.handleMessage(event, msg, rinfo); });
    server.bind(hash.port, hash.address);
  }
  this.listenersByEvent[event].push(listener);
}

MulticastEventEmitter.prototype.handleMessage = function(event, msg, rinfo) {
  //console.log('handleMessage', event, msg, rinfo);
  try {
    var message = JSON.parse(msg.toString('utf8'));
    //if (this.lastSeq[message.src] && CONTINUIE HERE
    if (message.seq) {
      this.lastSeq[message.src] = message.seq;
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

MulticastEventEmitter.prototype.emit = function(event) { // varargs...
  var args = Array.prototype.slice.call(arguments);
  //console.log('emit', args);
  var hash;
  if (options.overrides[event]) {
    hash = options.overrides[event];
  } else {
    hash = hasher.hash(event);
  }
  var message = new Buffer(JSON.stringify({ event: event, args: args, src: this.src, seq: this.seq++ }));
  var socket = dgram.createSocket('udp4');
  socket.addMembership(hash.address, options.multicastInterface);     
  socket.setMulticastTTL(options.ttl);
  socket.setMulticastLoopback(true); // needed from inter-process intra-box comms
  socket.send(message, 0, message.length, hash.port, hash.address);
  socket.close(); // TODO: cache open sockets for reuse?
}


