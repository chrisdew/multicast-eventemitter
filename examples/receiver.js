// Copyright 2011 Thorcom Systems Ltd.  All Rights Reserved.

var mee = require('../lib/multicast-eventemitter');

var emitter = mee.getEmitter();

// subscribe to channelA events
emitter.on('channelA', function(text, time) {
  console.log('message received on channelA:', text, time);
});
