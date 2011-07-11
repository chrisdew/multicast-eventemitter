multicast-eventemitter
----------------------

*Under heavy development - DO NOT USE IN PRODUCTION*

This package provides a cluster-wide event emitter.  Message sent from any process on any machine on a LAN can be subscibed to by any other process on any other machine.

It works efficiently by hashing event names into 24 bits of address space and 15 bits of port number - thus a 1 in half-a-trillion chance of event name collision.

This currently uses plain multicast.  This has the following drawbacks:
1. Messages are limited to about 1.5KB in length - exceeding this will produce a parsing error on receivers.
2. It is unreliable (we receive 100% of sent messages on our LAN - YMMV)

There are known bugs - see the FIXMEs and TODOs in the code.
