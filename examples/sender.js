// Copyright 2011 Thorcom Systems Ltd.  All Rights Reserved.

var mee = require('../lib/multicast-eventemitter');

var emitter = mee.getEmitter();

// emit a packet everu second, 
setInterval(function() {
  console.log('emitting eventA');
  emitter.emit('eventA', 'this is eventA', new Date().getTime());
  console.log('emitting eventB');
  emitter.emit('eventB', 'this is eventB', new Date().getTime());
}, 1000);
