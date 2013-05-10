multicast-eventemitter
----------------------

Status: FIXED, now works with NodeJS v0.8.x and v0.10.x.

This package provides a cluster-wide event emitter.  Events sent from any process on any machine on a LAN can be subscribed to by any other process on any other machine.

Multicast is more efficient than broadcast.  If messages were broadcast, then each subscriber would need to discard the the events it wasnt't interested in.  With multicast, this is done by the NIC.

It works efficiently by hashing event names into 24 bits of address space and 15 bits of port number - thus a 1 in half-a-trillion chance of event name collision.

This currently uses plain multicast.  This has the following drawbacks:

1. Messages are limited to about 1.5KB in length - exceeding this *may* produce a parsing error on receivers.

2. It is unreliable (though we receive 100% of sent messages on our LAN - YMMV)

