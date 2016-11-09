"use strict";

window.$ = window.jQuery = require('jquery'); 
const crypt = require("./pegasus-crypto");
const Clipboard = require('clipboard');

require('./lib/css/bootstrap.min.css');
require('./lib/js/bootstrap.min.js');
require('seedrandom');


require("file?name=icon-32.png!./icon-32.png");
require("file?name=icon-64.png!./icon-64.png");
require("./style.css");

const close_window = () => {
  window.close();
};

const generate_password = (e) => {
  let master_pass = document.getElementById("password").value;
  let login = document.getElementById("login").value;
  let site = document.getElementById("site").value;
  let count = parseInt(document.getElementById("counter").value);
  let length = parseInt(document.getElementById("length").value);
  let numbers = document.getElementById("numbers").checked;
  let symbols = document.getElementById("symbols").checked;
  let more_symbols = document.getElementById("more_symbols").checked;

  gen_pass(master_pass, site, login, count, length, numbers, symbols, more_symbols).then(function(pass) {
    document.getElementById("gen_pass").value = pass;
  });

  e.preventDefault();
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('close_button').addEventListener('click', close_window);
  document.getElementById('generate_button').addEventListener('click', generate_password);

  new Clipboard("#copy_button");
});

const gen_pass = (master_pass, site, login, count, length, numbers, symbols, more_symbols) => {
  let encoder = new TextEncoder("utf-8");
  let master_pass_buf = encoder.encode(master_pass);
  let salt = encoder.encode(site + "; " + login + ":" + count);

  return crypt.import_key(master_pass_buf).then((key) => {
    return crypt.derive_key(key, salt);
  }).then((derived_key) => {
    return crypt.sign_key(derived_key, salt);
  }).then((sig) => {
    return crypt.render_pass(sig, numbers, symbols, more_symbols, length);
  });
}
