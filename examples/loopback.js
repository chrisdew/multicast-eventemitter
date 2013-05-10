// Copyright 2011 Thorcom Systems Ltd.  All Rights Reserved.

var mee = require('../lib/multicast-eventemitter');

var emitter = mee.getEmitter();

// emit a packet everu second, 
setInterval(function() {
  var now = new Date().getTime();
  console.log('emitting eventA', now);
  emitter.emit('eventA', 'this is eventA', now);
  console.log('emitting eventB', now);
  emitter.emit('eventB', 'this is eventB', now);
}, 1000);

// subscribe to eventB events
emitter.on('eventB', function(text, time) {
  console.log('eventB received...', 'text:', text, 'time:', time);
});

