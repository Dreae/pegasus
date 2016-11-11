const string_to_bytes = (str) => {
  let buf = new Uint8Array(str.length);
  for (var i=0; i < str.length; i++) {
    buf[i] = str.charCodeAt(i);
  }

  return buf;
}

const bytes_to_string = (bytes) => {
  return String.fromCharCode.apply(null, new Uint8Array(bytes));
}

module.exports = {
  string_to_bytes,
  bytes_to_string
}