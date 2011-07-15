// Copyright 2011 Thorcom Systems Ltd.  All Rights Reserved.

var mee = require('../lib/multicast-eventemitter');

var emitter = mee.getEmitter();

// emit a packet everu second, 
setInterval(function() {
  console.log('emitting channelA');
  emitter.emit('channelA', 'this is channel A', new Date().getTime());
  console.log('emitting channelB');
  emitter.emit('channelB', 'this is channel B', new Date().getTime());
}, 1000);
