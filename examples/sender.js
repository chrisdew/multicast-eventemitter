// Copyright 2011 Thorcom Systems Ltd.  All Rights Reserved.

var mee = require('../lib/multicast-eventemitter');

var emitter = new mee.MulticastEventEmitter();

// emit a packet everu second, 
setInterval(function() {
  emitter.emit('channelA', 'this is channel A', new Date().getTime());
  emitter.emit('channelB', 'this is channel B', new Date().getTime());
}, 1000);
