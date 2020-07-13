const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export const secretPattern = `^[${base32chars}]{16,}$`;

export function hexToBytes(hex) {
  var bytes = [];
  for (var c = 0, C = hex.length; c < C; c += 2) {
    bytes.push(parseInt(hex.substr(c, 2), 16));
  }
  return bytes;
}

export function decToHex(s) {
  return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
}

export function bufToHex(buf) {
  return Array.prototype.map
    .call(new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2))
    .join('');
}

export function hextoBuf(hex) {
  var view = new Uint8Array(hex.length / 2);

  for (var i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }

  return view.buffer;
}

export function base32ToHex(base32) {
  var bits, chunk, hex, i, val;
  bits = '';
  hex = '';
  i = 0;
  while (i < base32.length) {
    val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    bits += leftpad(val.toString(2), 5, '0');
    i++;
  }
  i = 0;
  while (i + 4 <= bits.length) {
    chunk = bits.substr(i, 4);
    hex = hex + parseInt(chunk, 2).toString(16);
    i += 4;
  }
  return hex;
}

export function leftpad(str, len, pad) {
  if (len + 1 >= str.length) {
    str = Array(len + 1 - str.length).join(pad) + str;
  }
  return str;
}

/**
 * This function takes an otpauth:// style key URI and parses it into an object with keys for the
 * various parts of the URI
 *
 * @param {String} uri The otpauth:// uri that you want to parse
 *
 * @return {Object} The parsed URI or null on failure. The URI object looks like this:
 *
 * {
 *  type: 'totp',
 *  label: { issuer: 'ACME Co', account: 'jane@example.com' },
 *  query: {
 *   secret: 'JBSWY3DPEHPK3PXP',
 *   digits: '6'
 *  }
 * }
 *
 * @see <a href="https://github.com/google/google-authenticator/wiki/Key-Uri-Format">otpauth Key URI Format</a>
 */
export function parseKeyUri(uri) {
  // Quick sanity check
  if (typeof uri !== 'string' || uri.length < 7) return null;

  // I would like to just use new URL(), but the behavior is different between node and browsers, so
  // we have to do some of the work manually with regex.
  const parts = /otpauth:\/\/([A-Za-z]+)\/([^?]+)\??(.*)?/i.exec(uri);

  if (!parts || parts.length < 3) {
    return null;
  }

  // eslint-disable-next-line no-unused-vars
  const [fullUri, type, fullLabel] = parts;

  // Sanity check type and label
  if (!type || !fullLabel) {
    return null;
  }

  // Parse the label
  const decodedLabel = decodeURIComponent(fullLabel);

  const labelParts = decodedLabel.split(/: ?/);

  const label =
    labelParts && labelParts.length === 2
      ? { issuer: labelParts[0], account: labelParts[1] }
      : { issuer: '', account: decodedLabel };

  // Parse query string
  const qs = parts[3] ? new URLSearchParams(parts[3]) : [];

  const query = [...qs].reduce((acc, [key, value]) => {
    acc[key] = value;

    return acc;
  }, {});

  // Returned the parsed parts of the URI
  return { type: type.toLowerCase(), label, query };
}
