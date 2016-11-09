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

const generate_password = () => {
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
}

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('close_button').addEventListener('click', close_window);
  document.getElementById('password').addEventListener('input', password_input);

  generate_story();

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

const password_input = () => {
  if(window.password_timeout) {
    clearTimeout(window.password_timeout);
  }

  window.password_timeout = setTimeout(() => {
    generate_story();
    generate_password();
  }, 500);
};

const icons = [
  "bed",
  "education",
  "hourglass",
  "lock",
  "lamp",
  "piggy-bank",
  "pawn",
  "king",
  "cd",
  "tree-conifer",
  "tower",
  "record",
  "flash",
  "phone",
  "wrench",
  "bullhorn",
  "plane",
  "fire",
  "comment",
  "headphones",
  "home",
  "heart"
];

const generate_story = () => {
  crypt.import_key(new TextEncoder("utf-8").encode(document.getElementById("password").value)).then((key) => {
    return crypt.derive_seed(key);
  }).then((key) => {
    return crypt.export_key(key);
  }).then((bytes) => {
    let rng = new Math.seedrandom(String.fromCharCode.apply(null, new Uint8Array(bytes)));
    var story = document.getElementById("password_story");
    while (story.firstChild) {
        story.removeChild(story.firstChild);
    }

    for(let i = 0; i < 3; i++) {
      let icon = icons[Math.floor(rng() * icons.length)];
      let span = document.createElement('span');
      span.classList.add("glyphicon");
      span.classList.add("mar-horizontal-sm");

      span.classList.add("glyphicon-" + icon);

      story.appendChild(span);
    }
  });
};