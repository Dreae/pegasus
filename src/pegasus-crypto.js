const putil = require('./util');

const import_key = (master_password) => {
  return crypto.subtle.importKey("raw", master_password, "PBKDF2", false, ["deriveKey"]);
};

const import_signing_key = (key) => {
  return crypto.subtle.importKey("raw", key, {name: "HMAC", hash: "SHA-512"}, false, ["sign"]);
}

const import_encryption_key = (key) => {
  return crypto.subtle.importKey("raw", key.slice(0, 32), {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]);
}

const derive_key = (master_key, salt) => {
  var algo = {
    name: "PBKDF2",
    salt: salt,
    iterations: 550000,
    hash: "SHA-512"
  };

  return crypto.subtle.deriveKey(algo, master_key, {name: "HMAC", hash: "SHA-512"}, true, ["sign"]); 
};

const export_key = (key) => {
  return crypto.subtle.exportKey("raw", key);
};

const derive_seed = (key) => {
  var algo = {
    name: "PBKDF2",
    salt: new TextEncoder("utf-8").encode(""),
    iterations: 100000,
    hash: "SHA-512"
  };

  return crypto.subtle.deriveKey(algo, key, {name: "AES-CTR", length: "256"}, true, ["encrypt"]);
};

const sign = (derived_key, salt) => {
  return crypto.subtle.sign({name: "HMAC", hash: "SHA-512"}, derived_key, salt);
};

const encrypt = (key, iv, cleartext) => {
  return crypto.subtle.encrypt({name: "AES-GCM", iv: iv, tagLength: 128}, key, cleartext);
};

const decrypt = (key, iv, ciphertext) => {
  return crypto.subtle.decrypt({name: "AES-GCM", iv: iv, tagLength: 128}, key, ciphertext);
}

const render_pass = (signature, numbers, symbols, more_symbols, length) => {
  var chars = 'abcdefghijklmnopqrstuvwxyz';
  chars = chars + chars.toUpperCase();

  if(numbers) {
    chars = chars + '1234567890';
  }

  if(symbols) {
    chars = chars + '!@#$%&';
  }

  if(more_symbols) {
    chars = chars + '^*()-_=+/.,><{}[]~|';
  }

  var pass = '';

  // Using: https://github.com/davidbau/seedrandom
  var rng = new Math.seedrandom(putil.bytes_to_string(signature));
  for(var i = 0; i < length; i++) {
    pass = pass + chars[Math.floor(rng() * chars.length)];
  }

  return pass;
};

module.exports = {
  import_key,
  derive_key,
  sign,
  render_pass,
  export_key,
  derive_seed,
  import_encryption_key,
  import_signing_key,
  encrypt,
  decrypt
};