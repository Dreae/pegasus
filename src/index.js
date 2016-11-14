"use strict";

window.$ = window.jQuery = require('jquery'); 
const crypt = require("./pegasus-crypto");
const putil = require('./util');
const Clipboard = require('clipboard');
const equal = require('deep-equal');

require('./lib/css/bootstrap.min.css');
require('./lib/js/bootstrap.min.js');
require('seedrandom/seedrandom.min.js');
require('bootstrap-3-typeahead/bootstrap3-typeahead.min.js')


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
};

const do_login_click = () => {
  let password = document.getElementById("login_password").value;
  let username = document.getElementById("username").value;
  let host = document.getElementById("login_host").value;

  $("#login_error").addClass("hidden");
  do_login(username, password, host).then(() => {
    $("#login-container").toggleClass("hidden");
  }).catch((err) => {
    $("#login_error").removeClass("hidden");
  });
};

const show_login = (e) => {
  $("#login-container").toggleClass("hidden");
  e.preventDefault();
};

const cancel_login_click = (e) => {
  $("#login-container").toggleClass("hidden");
  e.preventDefault();
};

const do_logout_click = () => {
  localStorage.removeItem("__pegasus.credential");
  localStorage.removeItem("__pegasus.host");
  localStorage.removeItem("__pegasus.login");

  $("#login_button").toggleClass("hidden");
  $("#logout_button").toggleClass("hidden");
};

const update_settings = () => {
  return put_settings(window.__pegasus_settings).then(() => {
    init_typeahead(window.__pegasus_settings);
  });
}

const do_save_click = (e) => {
  let settings = gen_settings();
  window.__pegasus_settings = window.__pegasus_settings.filter(set => set.login !== settings.login || set.site !== settings.site);
  window.__pegasus_settings.push(settings);

  update_settings(window.__pegasus_settings).then(() => {
    $("#save_button").addClass("hidden");
  });

  e.preventDefault();
};

const do_delete_click = (e) => {
  let settings = gen_settings();
  window.__pegasus_settings = window.__pegasus_settings.filter(set => set.login !== settings.login || set.site !== settings.site);

  update_settings(window.__pegasus_settings).then(() => {
    $("#delete_button").addClass("hidden");
  });

  e.preventDefault();
};

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('close_button').addEventListener('click', close_window);
  document.getElementById('password').addEventListener('input', password_input);
  document.getElementById('login_button').addEventListener('click', show_login);
  document.getElementById('logout_button').addEventListener('click', do_logout_click);
  document.getElementById('do_login_button').addEventListener('click', do_login_click);
  document.getElementById('cancel_login_button').addEventListener('click', cancel_login_click);
  document.getElementById('save_button').addEventListener('click', do_save_click);
  document.getElementById('delete_button').addEventListener('click', do_delete_click);

  let inputs = document.getElementsByTagName("input");
  for(let i = 0; i < inputs.length; i++) {
    let input = inputs[i];
    if(input.id === 'password') {
      continue;
    }

    if(input.type === "checkbox") {
      input.addEventListener('change', input_changed);
    } else {
      input.addEventListener('input', input_changed);
    }
  }

  new Clipboard("#copy_button");
  if(get_login()) {
    $("#login_button").toggleClass("hidden");
    $("#logout_button").toggleClass("hidden");

    get_settings().then((settings) => {
      window.__pegasus_settings = settings;
      init_typeahead(settings);
    });
  }

  document.getElementById('site').focus();
});

const init_typeahead = (settings) => {
  $('#site').typeahead('destroy')
  $("#site").typeahead({
    source: settings,
    fitToElement: true,
    displayText: (item) => {
      if(item.site) {
        return `${item.site} - ${item.login}`;
      } else {
        return item;
      }
    },
    updater: (item) => {
      apply_settings(item);

      $("#save_button").addClass("hidden");
      $("#delete_button").removeClass("hidden");
      return item.site;
    }
  });
};

const get_login = () => {
  return !!window.localStorage && !!window.localStorage.getItem("__pegasus.credential");
}

const get_settings = () => {
  return new Promise((resolve, reject) => {
    let credential = putil.string_to_bytes(atob(localStorage.getItem("__pegasus.credential")));
    let host = localStorage.getItem("__pegasus.host");
    let login = localStorage.getItem("__pegasus.login");

    crypt.import_signing_key(credential).then((key) => {
      return crypt.sign(key, putil.string_to_bytes(login));
    }).then((signature) => {
      let sig_encoded = encodeURIComponent(btoa(putil.bytes_to_string(signature)));
      $.getJSON(`${host}/api/${sig_encoded}`).done((data) => {
        if(data.data && data.iv) {
          crypt.import_encryption_key(credential).then((key) => {
            let iv = putil.string_to_bytes(atob(data.iv));
            let ciphertext = putil.string_to_bytes(atob(data.data));

            return crypt.decrypt(key, iv, ciphertext);
          }).then((cleartext) => {
            resolve(JSON.parse(putil.bytes_to_string(cleartext)));
          }).catch((err) => {
            reject(err);
          });
        } else {
          resolve([]);
        }
      }).fail((err) => {
        console.log("Setting get failed");
        reject(err);
      });
    }).catch((err) => {
      reject(err);
    });
  });
};

const put_settings = (settings) => {
  return new Promise((resolve, reject) => {
    let credential = putil.string_to_bytes(atob(localStorage.getItem("__pegasus.credential")));
    let host = localStorage.getItem("__pegasus.host");
    let login = localStorage.getItem("__pegasus.login");
    let iv = new Uint8Array(128);
    crypto.getRandomValues(iv);

    crypt.import_encryption_key(credential).then((key) => {
      return crypt.encrypt(key, iv, putil.string_to_bytes(JSON.stringify(settings)));
    }).then((ciphertext) => {
      let data = {
        iv: btoa(putil.bytes_to_string(iv)),
        data: btoa(putil.bytes_to_string(ciphertext))
      };

      return crypt.import_signing_key(credential).then((key) => {
        return crypt.sign(key, putil.string_to_bytes(login));
      }).then((signature) => {
        let sig_encoded = encodeURIComponent(btoa(putil.bytes_to_string(signature)));
        $.ajax({
          type: "PUT",
          url: `${host}/api/${sig_encoded}`,
          data: JSON.stringify(data),
          contentType: "application/json"
        }).done(() => {
          resolve();
        }).fail((err) => {
          console.log("Setting update failed");
          reject(err);
        });
      });
    }).catch((err) => {
      reject(err);
    });
  });
};

const do_login = (login, password, host) => {
  return crypt.import_key(putil.string_to_bytes(password)).then((key) => {
    return crypt.derive_key(key, putil.string_to_bytes(login));
  }).then((key) => {
    return crypt.export_key(key);
  }).then((bytes) => {
    let credential = btoa(putil.bytes_to_string(bytes));
    localStorage.setItem("__pegasus.credential", credential);
    localStorage.setItem("__pegasus.login", login);
    localStorage.setItem("__pegasus.host", host);

    return get_settings().then((settings) => {
      window.__pegasus_settings = settings;
      init_typeahead(settings);
    });
  });
};

const apply_settings = (item) => {
  document.getElementById('login').value = item.login;
  document.getElementById('length').value = item.length;
  document.getElementById('counter').value = item.count;
  document.getElementById('numbers').checked = item.numbers;
  document.getElementById('symbols').checked = item.symbols;
  document.getElementById('more_symbols').checked = item.more_symbols;

  document.getElementById('password').focus();
}

const gen_pass = (master_pass, site, login, count, length, numbers, symbols, more_symbols) => {
  let master_pass_buf = putil.string_to_bytes(master_pass);
  let salt = putil.string_to_bytes(site + "; " + login + ":" + count);

  return crypt.import_key(master_pass_buf).then((key) => {
    return crypt.derive_key(key, salt);
  }).then((derived_key) => {
    return crypt.sign(derived_key, salt);
  }).then((sig) => {
    return crypt.render_pass(sig, numbers, symbols, more_symbols, length);
  });
};

const show_save = () => {
  let login = document.getElementById('login').value;
  let site = document.getElementById('site').value;
  if(get_login() && login.length && site.length) {
    let current_setting = window.__pegasus_settings.filter(set => set.site === site && set.login === login);
    if(current_setting.length) {
      $("#delete_button").removeClass("hidden");
    } else {
      $("#delete_button").addClass("hidden");
    }

    if(current_setting.length && equal(current_setting[0], gen_settings())) {
      $("#save_button").addClass("hidden");
    } else {
      $("#save_button").removeClass("hidden");
    }
  } else {
    $("#save_button").addClass("hidden");
  }
};

const gen_settings = () => {
  let login = document.getElementById("login").value;
  let site = document.getElementById("site").value;
  let count = parseInt(document.getElementById("counter").value);
  let length = parseInt(document.getElementById("length").value);
  let numbers = document.getElementById("numbers").checked;
  let symbols = document.getElementById("symbols").checked;
  let more_symbols = document.getElementById("more_symbols").checked;

  return {
    login,
    site,
    count,
    length,
    numbers,
    symbols,
    more_symbols
  };
};

const password_input = () => {
  if(window.password_timeout) {
    clearTimeout(window.password_timeout);
  }

  window.password_timeout = setTimeout(() => {
    generate_story();
    generate_password();
  }, 500);
};

const input_changed = () => {
  if(window.password_timeout) {
    clearTimeout(window.password_timeout);
  }

  if(document.getElementById('password').value.length !== 0) {
    window.password_timeout = setTimeout(() => {
      generate_password();
    }, 500);
  }

  show_save();
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