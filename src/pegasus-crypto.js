const import_key = (master_password) => {
  return crypto.subtle.importKey("raw", master_password, "PBKDF2", false, ["deriveKey"]);
};

const derive_key = (master_key, salt) => {
  var algo = {
    name: "PBKDF2",
    salt: salt,
    iterations: 550000,
    hash: "SHA-512"
  };

  return crypto.subtle.deriveKey(algo, master_key, {name: "HMAC", hash: "SHA-512"}, false, ["sign"]); 
};

const sign_key = (derived_key, salt) => {
  return crypto.subtle.sign({name: "HMAC", hash: "SHA-512"}, derived_key, salt);
};

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
  var rng = new Math.seedrandom(String.fromCharCode.apply(null, new Uint8Array(signature)));
  for(var i = 0; i < length; i++) {
    pass = pass + chars[Math.floor(rng() * chars.length)];
  }

  return pass;
};

module.exports = {
  import_key,
  derive_key,
  sign_key,
  render_pass
};