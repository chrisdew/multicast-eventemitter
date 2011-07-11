var crypto = require('crypto');

var options = exports.options = {
    firstOctet: '237'
  , portBase: 1024
  , hashAlgorithm: 'md5'
}

exports.hash = function hash(text) {
  var hash = crypto.createHash(options.hashAlgorithm);
  hash.update(text);
  var bytes = hash.digest('binary'); 
  var addressParts = [options.firstOctet, bytes.charCodeAt(0), bytes.charCodeAt(1), bytes.charCodeAt(2)];
  // bodge any zeros or 255s just in case
  for (var i in addressParts) {
    if (addressParts[i] > 254) { addressParts[i] == 254; }
    if (addressParts[i] < 1) { addressParts[i] == 1; }
  }

  var port = options.portBase + bytes.charCodeAt(3) + 256 * (bytes.charCodeAt(4) % 128);
  return { address: addressParts.join('.'), port: port };
}


