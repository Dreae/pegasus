const crypt = require("./pegasus-crypto");
const electron = require("electron");

require("../node_modules/materialize-css/dist/js/materialize.min.js");
require("../node_modules/materialize-css/dist/css/materialize.min.css");
require("../node_modules/material-design-icons/iconfont/material-icons.css");

window.close_window = () => {
  electron.remote.getCurrentWindow().close();
};


window.generate_password = () => {
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
