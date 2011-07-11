// Copyright 2011 Thorcom Systems Ltd.  All Rights Reserved.

var vows = require('vows')
  , assert = require('assert')
  , hasher = require('../lib/hasher')
  ;

var suite = vows.describe('Hasher').addBatch(
  { "Hash 'hello world'"
    : { topic
      : hasher.hash("hello world")
      , "check address"
      : function(topic) { assert.deepEqual(topic.address, "237.94.182.59"); }
      , "check port"
      : function(topic) { assert.deepEqual(topic.port, 25787); }
    }
  , "Hash 'table.update'"
    : { topic
      : hasher.hash("table.update")
      , "check address"
      : function(topic) { assert.deepEqual(topic.address, "237.62.152.15"); }
      , "check port"
      : function(topic) { assert.deepEqual(topic.port, 10076); }
    }
  }
)

suite.export(module);
