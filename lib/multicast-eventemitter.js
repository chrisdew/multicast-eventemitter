// Copyright 2011 Thorcom Systems Ltd.  All Rights Reserved.

var dgram = require('dgram')
  , util = require('util')
  , hasher = require('./hasher')
  ;


var options = exports.options = {
    'transport': 'multicast' // 'pgm' (zeromq) to follow...
  , 'multicastInteface': undefined
  , 'ttl': 64
}

exports.MulticastEventEmitter = MulticastEventEmitter;
function MulticastEventEmitter() {
  this.listenersByEvent = {}; // a hash of arrays of functions
  this.serversByEvent = {}; // a hash of bound datagram servers
} 

MulticastEventEmitter.prototype.addListener = function(event, listener) {
  console.log('addListener', event, listener);
  if (!this.listenersByEvent[event]) { // make a new multicast listener and an empty array
    this.listenersByEvent[event] = [];
    var hash = hasher.hash(event);

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
  console.log('handleMessage', event, msg, rinfo);
  try {
    var message = JSON.parse(msg.toString('utf8'));
  } catch(e) {
    console.warn('error parsing multicast message:', msg);
  }

  var list = this.listenersByEvent[event];
  console.log('list', list);
  for (var i in list) {
    var listener = list[i];
    // TODO: should we use nextTick here?
    listener.apply(undefined, message.args);
  }
}

MulticastEventEmitter.prototype.on = MulticastEventEmitter.prototype.addListener;

MulticastEventEmitter.prototype.emit = function(event) { // varargs...
  var args = Array.prototype.slice.call(arguments);
  console.log('emit', args);
  var hash = hasher.hash(event);
  var message = new Buffer(JSON.stringify({ event: event, args: args }));
  var socket = dgram.createSocket('udp4');
  socket.addMembership(hash.address, options.multicastInterface);     
  socket.setMulticastTTL(options.ttl);
  socket.setMulticastLoopback(true); // needed from inter-process intra-box comms
  socket.send(message, 0, message.length, hash.port, hash.address);
  socket.close(); // TODO: cache open sockets for reuse?
}


