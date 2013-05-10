// Copyright 2011 Thorcom Systems Ltd.  All Rights Reserved.

var mee = require('../lib/multicast-eventemitter');

var emitter = mee.getEmitter();

// subscribe to eventA events
emitter.on('eventA', function(text, time) {
  console.log('eventA received...', 'text:', text, 'time:', time);
});
