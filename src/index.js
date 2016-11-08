const crypt = require("./pegasus-crypto");
const electron = require("electron");

require("../node_modules/materialize-css/dist/js/materialize.min.js");
require("../node_modules/materialize-css/dist/css/materialize.min.css");
require("../node_modules/material-design-icons/iconfont/material-icons.css");

window.close_window = () => {
  electron.remote.getCurrentWindow().close();
};

const gen_pass = (master_pass, site, count) => {
  let encoder = new TextEncoder("utf-8");
  let master_pass_buf = encoder.encoder(master_pass);
  let salt = encoder.encode(site + ":" + count);

  crypt.import_key(master_pass_buf).then((key) => {
    return crypt.derive_key(key, salt);
  }).then((derived_key) => {
    return crypt.sign_key(derived_key, salt);
  }).then((sig) => {
    console.log(crypt.render_pass(sig, true, true, false));
  });
}
