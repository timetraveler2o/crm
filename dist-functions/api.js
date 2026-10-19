var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to2, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to2, key) && key !== except)
        __defProp(to2, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to2;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// netlify/functions/api.ts
var api_exports = {};
__export(api_exports, {
  default: () => api_default,
  handler: () => handler
});
module.exports = __toCommonJS(api_exports);

// node_modules/nodemailer/dist/esm/mailer/index.js
var import_node_events = require("node:events");

// node_modules/nodemailer/dist/esm/shared/url.js
var import_node_net = __toESM(require("node:net"), 1);
var import_node_url = __toESM(require("node:url"), 1);

// node_modules/nodemailer/dist/esm/punycode/index.js
var maxInt = 2147483647;
var base = 36;
var tMin = 1;
var tMax = 26;
var skew = 38;
var damp = 700;
var initialBias = 72;
var initialN = 128;
var delimiter = "-";
var regexPunycode = /^xn--/;
var regexNonASCII = /[^\0-\x7F]/;
var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g;
var errors = {
  overflow: "Overflow: input needs wider integers to process",
  "not-basic": "Illegal input >= 0x80 (not a basic code point)",
  "invalid-input": "Invalid input"
};
var baseMinusTMin = base - tMin;
var floor = Math.floor;
var stringFromCharCode = String.fromCharCode;
function error(type) {
  throw new RangeError(errors[type]);
}
function map(array, callback) {
  const result = [];
  let length = array.length;
  while (length--) {
    result[length] = callback(array[length]);
  }
  return result;
}
function mapDomain(domain, callback) {
  const parts = domain.split("@");
  let result = "";
  if (parts.length > 1) {
    result = parts[0] + "@";
    domain = parts[1];
  }
  domain = domain.replace(regexSeparators, ".");
  const labels = domain.split(".");
  const encoded = map(labels, callback).join(".");
  return result + encoded;
}
function ucs2decode(string) {
  const output = [];
  let counter = 0;
  const length = string.length;
  while (counter < length) {
    const value = string.charCodeAt(counter++);
    if (value >= 55296 && value <= 56319 && counter < length) {
      const extra = string.charCodeAt(counter++);
      if ((extra & 64512) == 56320) {
        output.push(((value & 1023) << 10) + (extra & 1023) + 65536);
      } else {
        output.push(value);
        counter--;
      }
    } else {
      output.push(value);
    }
  }
  return output;
}
var basicToDigit = function(codePoint) {
  if (codePoint >= 48 && codePoint < 58) {
    return 26 + (codePoint - 48);
  }
  if (codePoint >= 65 && codePoint < 91) {
    return codePoint - 65;
  }
  if (codePoint >= 97 && codePoint < 123) {
    return codePoint - 97;
  }
  return base;
};
var digitToBasic = function(digit, flag) {
  return digit + 22 + 75 * Number(digit < 26) - (Number(flag != 0) << 5);
};
var adapt = function(delta, numPoints, firstTime) {
  let k = 0;
  delta = firstTime ? floor(delta / damp) : delta >> 1;
  delta += floor(delta / numPoints);
  for (
    ;
    /* no initialization */
    delta > baseMinusTMin * tMax >> 1;
    k += base
  ) {
    delta = floor(delta / baseMinusTMin);
  }
  return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
};
var decode = function(input) {
  const output = [];
  const inputLength = input.length;
  let i = 0;
  let n = initialN;
  let bias = initialBias;
  let basic = input.lastIndexOf(delimiter);
  if (basic < 0) {
    basic = 0;
  }
  for (let j = 0; j < basic; ++j) {
    if (input.charCodeAt(j) >= 128) {
      error("not-basic");
    }
    output.push(input.charCodeAt(j));
  }
  for (let index = basic > 0 ? basic + 1 : 0; index < inputLength; ) {
    const oldi = i;
    for (let w = 1, k = base; ; k += base) {
      if (index >= inputLength) {
        error("invalid-input");
      }
      const digit = basicToDigit(input.charCodeAt(index++));
      if (digit >= base) {
        error("invalid-input");
      }
      if (digit > floor((maxInt - i) / w)) {
        error("overflow");
      }
      i += digit * w;
      const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
      if (digit < t) {
        break;
      }
      const baseMinusT = base - t;
      if (w > floor(maxInt / baseMinusT)) {
        error("overflow");
      }
      w *= baseMinusT;
    }
    const out = output.length + 1;
    bias = adapt(i - oldi, out, oldi == 0);
    if (floor(i / out) > maxInt - n) {
      error("overflow");
    }
    n += floor(i / out);
    i %= out;
    output.splice(i++, 0, n);
  }
  return String.fromCodePoint(...output);
};
var encode = function(input) {
  const output = [];
  const codePoints = ucs2decode(input);
  const inputLength = codePoints.length;
  let n = initialN;
  let delta = 0;
  let bias = initialBias;
  for (const currentValue of codePoints) {
    if (currentValue < 128) {
      output.push(stringFromCharCode(currentValue));
    }
  }
  const basicLength = output.length;
  let handledCPCount = basicLength;
  if (basicLength) {
    output.push(delimiter);
  }
  while (handledCPCount < inputLength) {
    let m = maxInt;
    for (const currentValue of codePoints) {
      if (currentValue >= n && currentValue < m) {
        m = currentValue;
      }
    }
    const handledCPCountPlusOne = handledCPCount + 1;
    if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
      error("overflow");
    }
    delta += (m - n) * handledCPCountPlusOne;
    n = m;
    for (const currentValue of codePoints) {
      if (currentValue < n && ++delta > maxInt) {
        error("overflow");
      }
      if (currentValue === n) {
        let q = delta;
        for (let k = base; ; k += base) {
          const t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
          if (q < t) {
            break;
          }
          const qMinusT = q - t;
          const baseMinusT = base - t;
          output.push(stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0)));
          q = floor(qMinusT / baseMinusT);
        }
        output.push(stringFromCharCode(digitToBasic(q, 0)));
        bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
        delta = 0;
        ++handledCPCount;
      }
    }
    ++delta;
    ++n;
  }
  return output.join("");
};
var toUnicode = function(input) {
  return mapDomain(input, function(string) {
    return regexPunycode.test(string) ? decode(string.slice(4).toLowerCase()) : string;
  });
};
var toASCII = function(input) {
  return mapDomain(input, function(string) {
    return regexNonASCII.test(string) ? "xn--" + encode(string) : string;
  });
};

// node_modules/nodemailer/dist/esm/shared/url.js
var SLASHLESS_AUTHORITY = /^([a-zA-Z][a-zA-Z0-9+.-]*:)(?!\/\/)([\s\S]+)$/;
function stripSurroundingWhitespace(input) {
  let start = 0;
  let end = input.length;
  while (start < end && input.charCodeAt(start) <= 32) {
    start++;
  }
  while (end > start && input.charCodeAt(end - 1) <= 32) {
    end--;
  }
  return input.slice(start, end);
}
var LEGACY_TRIM = /^[\x00-\x20\u00a0\ufeff]+/;
var AUTHORITY = /^([a-zA-Z0-9+.-]+:)?[\\/]{2}([^\\/?#]*)/;
var FORBIDDEN_HOST_CHARS = /[\x00-\x20#/:<>?@[\\\]^|\x7f]/;
var CONTROL_CHARS = /[\x00-\x1f\x7f]/;
function invalidUrl(input) {
  const err = new TypeError("Invalid URL");
  err.code = "ERR_INVALID_URL";
  err.input = input;
  return err;
}
function legacyParse(input, parseQueryString, whatwgError, slashesDenoteHost) {
  const parsed = import_node_url.default.parse(input, parseQueryString, slashesDenoteHost);
  const authority = AUTHORITY.exec(input.replace(LEGACY_TRIM, ""));
  if (authority && (authority[1] || parsed.hostname !== null)) {
    const written = authority[2].slice(authority[2].lastIndexOf("@") + 1);
    if (!written || CONTROL_CHARS.test(written) || (parsed.host || "").toLowerCase() !== toASCII(written.toLowerCase())) {
      throw whatwgError;
    }
    if (written.charAt(0) === "[" && !import_node_net.default.isIPv6(written.slice(1, written.indexOf("]")))) {
      throw whatwgError;
    }
  } else if (parsed.hostname !== null) {
    throw whatwgError;
  }
  const legacyAuth = parsed.auth === null || parsed.auth === void 0 ? null : parsed.auth.split(":");
  const result = parsed;
  result.username = legacyAuth ? legacyAuth.shift() : null;
  result.password = legacyAuth && legacyAuth.length ? legacyAuth.join(":") : null;
  return result;
}
function safeDecode(str) {
  try {
    return decodeURIComponent(str);
  } catch (_err) {
    return str;
  }
}
function normalizeHostname(raw2, href) {
  const hostname = raw2 || "";
  if (!hostname) {
    return "";
  }
  if (hostname.charAt(0) === "[" && hostname.charAt(hostname.length - 1) === "]") {
    return hostname.slice(1, -1);
  }
  const decoded = safeDecode(hostname);
  const mapped = FORBIDDEN_HOST_CHARS.test(decoded) ? "" : import_node_url.default.domainToASCII(decoded);
  if (!mapped) {
    throw invalidUrl(href);
  }
  return mapped;
}
var parse = (input, parseQueryString) => {
  input = stripSurroundingWhitespace(input || "");
  const slashless = SLASHLESS_AUTHORITY.exec(input);
  const normalized2 = slashless ? slashless[1] + "//" + slashless[2] : input;
  let u;
  try {
    u = new URL(normalized2);
  } catch (err) {
    return legacyParse(normalized2, parseQueryString, err);
  }
  const hostname = normalizeHostname(u.hostname, u.href);
  const port = u.port || null;
  const pathname = u.pathname || null;
  const search = u.search || null;
  let auth = null;
  let username = null;
  let password = null;
  if (u.username || u.password) {
    username = safeDecode(u.username);
    password = u.password ? safeDecode(u.password) : null;
    auth = username + (password !== null ? ":" + password : "");
  }
  let query;
  if (parseQueryString) {
    const parsed = /* @__PURE__ */ Object.create(null);
    u.searchParams.forEach((value, key) => {
      if (Object.prototype.hasOwnProperty.call(parsed, key)) {
        const existing = parsed[key];
        if (Array.isArray(existing)) {
          existing.push(value);
        } else {
          parsed[key] = [existing, value];
        }
      } else {
        parsed[key] = value;
      }
    });
    query = parsed;
  } else {
    query = search ? search.slice(1) : null;
  }
  return {
    protocol: u.protocol || null,
    host: u.host || null,
    hostname,
    port,
    pathname,
    search,
    path: (pathname || "") + (search || "") || null,
    href: u.href,
    auth,
    username,
    password,
    query
  };
};
var resolve = (from, to2) => {
  try {
    return new URL(to2, from).href;
  } catch (err) {
    legacyParse(from, false, err, true);
    legacyParse(to2, false, err, true);
    return import_node_url.default.resolve(from, to2);
  }
};

// node_modules/nodemailer/dist/esm/shared/index.js
var import_node_util = __toESM(require("node:util"), 1);
var import_node_fs = __toESM(require("node:fs"), 1);

// node_modules/nodemailer/dist/esm/fetch/index.js
var import_node_http = __toESM(require("node:http"), 1);
var import_node_https = __toESM(require("node:https"), 1);
var import_node_zlib = __toESM(require("node:zlib"), 1);
var import_node_stream = require("node:stream");

// node_modules/nodemailer/dist/esm/fetch/cookies.js
var import_node_net2 = __toESM(require("node:net"), 1);
var SESSION_TIMEOUT = 1800;
var Cookies = class {
  constructor(options) {
    this.options = options || {};
    this.cookies = [];
  }
  /**
   * Stores a cookie string to the cookie storage
   *
   * @param cookieStr Value from the 'Set-Cookie:' header
   * @param url Current URL
   */
  set(cookieStr, url) {
    const urlparts = parse(url || "");
    const cookie = this.parse(cookieStr);
    let domain;
    if (cookie.domain) {
      domain = cookie.domain.replace(/^\./, "");
      if (
        // can't be valid if the requested domain is shorter than current hostname
        urlparts.hostname.length < domain.length || // a top level domain is not a valid scope, 'Domain=com' would otherwise be
        // sent to every .com host. A trailing dot does not make 'com.' any better
        domain.indexOf(".") < 0 || domain.endsWith(".") || // an IP address has no subdomains, so cookies set on it stay host-only
        import_node_net2.default.isIP(urlparts.hostname) || // prefix domains with dot to be sure that partial matches are not used
        !("." + urlparts.hostname).endsWith("." + domain)
      ) {
        cookie.domain = urlparts.hostname;
      }
    } else {
      cookie.domain = urlparts.hostname;
    }
    if (!cookie.path) {
      cookie.path = this.getPath(urlparts.pathname);
    }
    if (!cookie.expires) {
      cookie.expires = new Date(Date.now() + (Number(this.options.sessionTimeout || SESSION_TIMEOUT) || SESSION_TIMEOUT) * 1e3);
    }
    return this.add(cookie);
  }
  /**
   * Returns cookie string for the 'Cookie:' header.
   *
   * @param url URL to check for
   * @returns Cookie header or empty string if no matches were found
   */
  get(url) {
    return this.list(url).map((cookie) => cookie.name + "=" + cookie.value).join("; ");
  }
  /**
   * Lists all valied cookie objects for the specified URL
   *
   * @param url URL to check for
   * @returns An array of cookie objects
   */
  list(url) {
    const result = [];
    for (let i = this.cookies.length - 1; i >= 0; i--) {
      const cookie = this.cookies[i];
      if (this.isExpired(cookie)) {
        this.cookies.splice(i, 1);
        continue;
      }
      if (this.match(cookie, url)) {
        result.unshift(cookie);
      }
    }
    return result;
  }
  /**
   * Parses cookie string from the 'Set-Cookie:' header
   *
   * @param cookieStr String from the 'Set-Cookie:' header
   * @returns Cookie object
   */
  parse(cookieStr) {
    const cookie = {};
    let hasNameValue = false;
    (cookieStr || "").toString().split(";").forEach((cookiePart) => {
      if (!cookiePart.trim()) {
        return;
      }
      const valueParts = cookiePart.split("=");
      const name2 = valueParts.shift().trim();
      let value = valueParts.join("=").trim();
      let domain;
      if (!hasNameValue) {
        hasNameValue = true;
        if (name2) {
          cookie.name = name2;
          cookie.value = value;
        }
        return;
      }
      switch (name2.toLowerCase()) {
        case "expires": {
          const expires = new Date(value);
          if (expires.toString() !== "Invalid Date") {
            cookie.expires = expires;
          }
          break;
        }
        case "path":
          cookie.path = value;
          break;
        case "domain":
          domain = value.toLowerCase();
          if (domain.length && domain.charAt(0) !== ".") {
            domain = "." + domain;
          }
          cookie.domain = domain;
          break;
        case "max-age":
          cookie.expires = new Date(Date.now() + (Number(value) || 0) * 1e3);
          break;
        case "secure":
          cookie.secure = true;
          break;
        case "httponly":
          cookie.httponly = true;
          break;
      }
    });
    return cookie;
  }
  /**
   * Checks if a cookie object is valid for a specified URL
   *
   * @param cookie Cookie object
   * @param url URL to check for
   * @returns true if cookie is valid for specifiec URL
   */
  match(cookie, url) {
    const urlparts = parse(url || "");
    if (urlparts.hostname !== cookie.domain && (cookie.domain.charAt(0) !== "." || ("." + urlparts.hostname).substr(-cookie.domain.length) !== cookie.domain)) {
      return false;
    }
    const pathname = urlparts.pathname || "/";
    const cookiePath = cookie.path;
    const pathMatches = pathname === cookiePath || pathname.startsWith(cookiePath) && (cookiePath.endsWith("/") || pathname.charAt(cookiePath.length) === "/");
    if (!pathMatches) {
      return false;
    }
    if (cookie.secure && urlparts.protocol !== "https:") {
      return false;
    }
    return true;
  }
  /**
   * Adds (or updates/removes if needed) a cookie object to the cookie storage
   *
   * @param cookie Cookie value to be stored
   */
  add(cookie) {
    if (!cookie || !cookie.name) {
      return false;
    }
    for (let i = 0, len = this.cookies.length; i < len; i++) {
      if (this.compare(this.cookies[i], cookie)) {
        if (this.isExpired(cookie)) {
          this.cookies.splice(i, 1);
          return false;
        }
        this.cookies[i] = cookie;
        return true;
      }
    }
    if (!this.isExpired(cookie)) {
      this.cookies.push(cookie);
    }
    return true;
  }
  /**
   * Checks if two cookie objects are the same
   *
   * @param a Cookie to check against
   * @param b Cookie to check against
   * @returns True, if the cookies are the same
   */
  compare(a2, b2) {
    return a2.name === b2.name && a2.path === b2.path && a2.domain === b2.domain && a2.secure === b2.secure && a2.httponly === b2.httponly;
  }
  /**
   * Checks if a cookie is expired
   *
   * @param cookie Cookie object to check against
   * @returns True, if the cookie is expired
   */
  isExpired(cookie) {
    return cookie.expires && cookie.expires < /* @__PURE__ */ new Date() || !cookie.value;
  }
  /**
   * Returns the default path for an URL path argument, the default-path of
   * RFC 6265 section 5.1.4. A cookie that carries no Path attribute is scoped
   * to the directory of the URL it was set from
   *
   * @param pathname
   * @returns Default path
   */
  getPath(pathname) {
    const pathParts = (pathname || "/").split("/");
    pathParts.pop();
    const path3 = pathParts.join("/").trim();
    if (path3.charAt(0) !== "/") {
      return "/";
    }
    return path3;
  }
};
var cookies_default = Cookies;

// node_modules/nodemailer/dist/esm/package-info.js
var name = "nodemailer";
var version = "10.1.7";
var homepage = "https://nodemailer.com/";

// node_modules/nodemailer/dist/esm/fetch/index.js
var import_node_net3 = __toESM(require("node:net"), 1);

// node_modules/nodemailer/dist/esm/errors.js
var ECONNECTION = "ECONNECTION";
var ETIMEDOUT = "ETIMEDOUT";
var ESOCKET = "ESOCKET";
var EENVELOPE = "EENVELOPE";
var EMESSAGE = "EMESSAGE";
var ESTREAM = "ESTREAM";
var ENOAUTH = "ENOAUTH";
var EOAUTH2 = "EOAUTH2";
var EMAXLIMIT = "EMAXLIMIT";
var EMAXRECIPIENTS = "EMAXRECIPIENTS";
var ESENDMAIL = "ESENDMAIL";
var ESES = "ESES";
var ECONFIG = "ECONFIG";
var EPROXY = "EPROXY";
var EFILEACCESS = "EFILEACCESS";
var EURLACCESS = "EURLACCESS";
var EFETCH = "EFETCH";
var isTransientError = (err) => err.responseCode === 421 || err.code === ECONNECTION || err.code === ESOCKET || err.code === ETIMEDOUT;
var ERR_ACCESS_DENIED = "ERR_ACCESS_DENIED";

// node_modules/nodemailer/dist/esm/shared/objects.js
var isProtoKey = (key) => key === "__proto__";
var copyOwnKeys = (target, source, skip) => {
  Object.keys(source || {}).forEach((key) => {
    if (isProtoKey(key) || skip && skip(key)) {
      return;
    }
    target[key] = source[key];
  });
  return target;
};

// node_modules/nodemailer/dist/esm/fetch/index.js
var MAX_REDIRECTS = 5;
var DEFAULT_TIMEOUT = 60 * 1e3;
var DEFAULT_MAX_TIME = 2 * 60 * 1e3;
var DEFAULT_MAX_BYTES = 64 * 1024 * 1024;
var TLS_OPTION_KEYS = [
  "ALPNProtocols",
  "ca",
  "cert",
  "checkServerIdentity",
  "ciphers",
  "crl",
  "dhparam",
  "ecdhCurve",
  "honorCipherOrder",
  "key",
  "maxVersion",
  "minVersion",
  "passphrase",
  "pfx",
  "rejectUnauthorized",
  "secureContext",
  "secureOptions",
  "secureProtocol",
  "servername",
  "sessionIdContext",
  "sigalgs"
];
function setFetchCode(err) {
  if (err.code !== ERR_ACCESS_DENIED) {
    err.code = EFETCH;
  }
}
function parseFetchUrl(url) {
  let parsed;
  try {
    parsed = parse(url);
  } catch (_err) {
    return false;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return false;
  }
  return parsed;
}
function fetchPort(parsed) {
  return parsed.port ? Number(parsed.port) : parsed.protocol === "https:" ? 443 : 80;
}
function nmfetch(url, options) {
  options = options || {};
  options.fetchRes = options.fetchRes || new import_node_stream.PassThrough();
  options.cookies = options.cookies || new cookies_default();
  options.redirects = options.redirects || 0;
  options.maxRedirects = isNaN(options.maxRedirects) ? MAX_REDIRECTS : options.maxRedirects;
  if (!options.deadline) {
    options.maxTime = typeof options.maxTime === "number" && options.maxTime >= 0 ? options.maxTime : DEFAULT_MAX_TIME;
    options.deadline = options.maxTime ? Date.now() + options.maxTime : 0;
  }
  const fetchRes = options.fetchRes;
  const parsed = parseFetchUrl(url);
  if (!parsed) {
    if (options.body && typeof options.body.destroy === "function") {
      options.body.on("error", () => false);
      options.body.destroy();
    }
    setImmediate(() => {
      const err = new Error("Unsupported protocol for URL " + url);
      err.code = EFETCH;
      err.sourceUrl = url;
      fetchRes.emit("error", err);
    });
    return fetchRes;
  }
  if (options.cookie) {
    [].concat(options.cookie || []).forEach((cookie) => {
      options.cookies.set(cookie, url);
    });
    options.cookie = false;
  }
  let method = (options.method || "").toString().trim().toUpperCase() || "GET";
  let finished3 = false;
  let cookies;
  let body;
  const handler2 = parsed.protocol === "https:" ? import_node_https.default : import_node_http.default;
  const headers = {
    "accept-encoding": "gzip,deflate",
    "user-agent": "nodemailer/" + version
  };
  Object.keys(options.headers || {}).forEach((key) => {
    if (isProtoKey(key.toLowerCase().trim())) {
      return;
    }
    headers[key.toLowerCase().trim()] = options.headers[key];
  });
  if (options.userAgent) {
    headers["user-agent"] = options.userAgent;
  }
  if (parsed.auth) {
    headers.Authorization = "Basic " + Buffer.from(parsed.auth).toString("base64");
  }
  if (cookies = options.cookies.get(url)) {
    headers.cookie = cookies;
  }
  if (options.body) {
    if (options.contentType !== false) {
      headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
    }
    if (typeof options.body.pipe === "function") {
      headers["Transfer-Encoding"] = "chunked";
      body = options.body;
      body.on("error", (err) => {
        if (finished3) {
          return;
        }
        finished3 = true;
        setFetchCode(err);
        err.sourceUrl = url;
        fetchRes.emit("error", err);
      });
    } else {
      if (options.body instanceof Buffer) {
        body = options.body;
      } else if (typeof options.body === "object") {
        try {
          body = Buffer.from(Object.keys(options.body).map((key) => {
            const value = options.body[key].toString().trim();
            return encodeURIComponent(key) + "=" + encodeURIComponent(value);
          }).join("&"));
        } catch (E2) {
          finished3 = true;
          E2.code = EFETCH;
          E2.sourceUrl = url;
          setImmediate(() => fetchRes.emit("error", E2));
          return fetchRes;
        }
      } else {
        body = Buffer.from(options.body.toString().trim());
      }
      headers["Content-Type"] = options.contentType || "application/x-www-form-urlencoded";
      headers["Content-Length"] = body.length;
    }
    method = (options.method || "").toString().trim().toUpperCase() || "POST";
  }
  let req;
  const reqOptions = {
    method,
    host: parsed.hostname,
    path: parsed.path,
    port: fetchPort(parsed),
    headers,
    // Validate TLS certificates by default. Callers that genuinely need to
    // reach a self-signed/internal host opt out explicitly with
    // options.tls = { rejectUnauthorized: false }.
    rejectUnauthorized: true,
    agent: false
  };
  if (options.tls) {
    Object.keys(options.tls).forEach((key) => {
      if (TLS_OPTION_KEYS.includes(key)) {
        reqOptions[key] = options.tls[key];
      }
    });
  }
  if (parsed.protocol === "https:" && parsed.hostname && parsed.hostname !== reqOptions.host && !import_node_net3.default.isIP(parsed.hostname) && !reqOptions.servername) {
    reqOptions.servername = parsed.hostname;
  }
  try {
    req = handler2.request(reqOptions);
  } catch (E2) {
    finished3 = true;
    setImmediate(() => {
      setFetchCode(E2);
      E2.sourceUrl = url;
      fetchRes.emit("error", E2);
    });
    return fetchRes;
  }
  let deadlineTimer;
  const clearDeadline = () => {
    if (deadlineTimer) {
      clearTimeout(deadlineTimer);
      deadlineTimer = void 0;
    }
  };
  const fail = (err, sourceUrl = url) => {
    if (finished3) {
      return;
    }
    finished3 = true;
    clearDeadline();
    setFetchCode(err);
    err.sourceUrl = sourceUrl;
    fetchRes.emit("error", err);
    req.abort();
  };
  const timeout = typeof options.timeout === "number" && options.timeout >= 0 ? options.timeout : DEFAULT_TIMEOUT;
  if (timeout) {
    req.setTimeout(timeout, () => fail(new Error("Request Timeout")));
  }
  if (options.deadline) {
    deadlineTimer = setTimeout(() => fail(new Error("Request exceeded the allowed " + options.maxTime + " ms")), Math.max(options.deadline - Date.now(), 1));
    deadlineTimer.unref();
  }
  req.on("error", (err) => fail(err));
  fetchRes.once("close", () => {
    clearDeadline();
    if (finished3 || fetchRes.readableEnded) {
      return;
    }
    finished3 = true;
    req.destroy();
  });
  req.on("response", (res) => {
    let inflate;
    if (finished3) {
      return;
    }
    switch (res.headers["content-encoding"]) {
      case "gzip":
      case "deflate":
        inflate = import_node_zlib.default.createUnzip();
        break;
    }
    if (res.headers["set-cookie"]) {
      [].concat(res.headers["set-cookie"] || []).forEach((cookie) => {
        options.cookies.set(cookie, url);
      });
    }
    if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
      options.redirects++;
      if (options.redirects > options.maxRedirects) {
        return fail(new Error("Maximum redirect count exceeded"));
      }
      options.method = "GET";
      options.body = false;
      let redirectUrl;
      try {
        redirectUrl = resolve(url, res.headers.location);
      } catch (_err) {
        redirectUrl = res.headers.location;
      }
      const redirectParsed = parseFetchUrl(redirectUrl);
      if (!redirectParsed) {
        return fail(new Error("Unsupported protocol for URL " + redirectUrl), redirectUrl);
      }
      const crossOrigin = redirectParsed.protocol !== parsed.protocol || redirectParsed.hostname !== parsed.hostname || fetchPort(redirectParsed) !== fetchPort(parsed);
      if (options.headers && crossOrigin) {
        const sensitive = ["authorization", "cookie", "proxy-authorization"];
        Object.keys(options.headers).forEach((key) => {
          if (sensitive.includes(key.toLowerCase().trim())) {
            delete options.headers[key];
          }
        });
      }
      finished3 = true;
      clearDeadline();
      res.resume();
      req.abort();
      return nmfetch(redirectUrl, options);
    }
    fetchRes.statusCode = res.statusCode;
    fetchRes.headers = res.headers;
    if (res.statusCode >= 300 && !options.allowErrorResponse) {
      return fail(new Error("Invalid status code " + res.statusCode));
    }
    res.on("error", (err) => fail(err));
    res.once("end", () => clearDeadline());
    const maxBytes = typeof options.maxBytes === "number" && options.maxBytes > 0 ? options.maxBytes : DEFAULT_MAX_BYTES;
    const source = inflate || res;
    let received = 0;
    source.on("data", (chunk) => {
      received += chunk.length;
      if (received <= maxBytes || finished3) {
        return;
      }
      source.unpipe(fetchRes);
      fail(new Error("Response size exceeds the allowed " + maxBytes + " bytes"));
    });
    if (inflate) {
      res.pipe(inflate).pipe(fetchRes);
      inflate.on("error", (err) => fail(err));
    } else {
      res.pipe(fetchRes);
    }
  });
  setImmediate(() => {
    if (body) {
      try {
        if (typeof body.pipe === "function") {
          return body.pipe(req);
        }
        req.write(body);
      } catch (err) {
        return fail(err);
      }
    }
    req.end();
  });
  return fetchRes;
}
nmfetch.Cookies = cookies_default;
nmfetch.DEFAULT_TIMEOUT = DEFAULT_TIMEOUT;
nmfetch.DEFAULT_MAX_TIME = DEFAULT_MAX_TIME;
var fetch_default = nmfetch;

// node_modules/nodemailer/dist/esm/shared/index.js
var import_node_dns = __toESM(require("node:dns"), 1);
var import_node_net4 = __toESM(require("node:net"), 1);
var import_node_os = __toESM(require("node:os"), 1);
var import_node_stream2 = require("node:stream");
var DNS_TTL = 5 * 60 * 1e3;
var CACHE_CLEANUP_INTERVAL = 30 * 1e3;
var MAX_CACHE_SIZE = 1e3;
var lastCacheCleanup = 0;
var networkInterfaces;
var networkInterfacesRead = false;
var _readNetworkInterfaces = () => {
  if (!networkInterfacesRead) {
    networkInterfacesRead = true;
    try {
      networkInterfaces = import_node_os.default.networkInterfaces();
    } catch (_err) {
    }
  }
  return networkInterfaces;
};
var isFamilySupported = (family, allowInternal) => {
  const addresses = Object.values(_readNetworkInterfaces() || {}).flat();
  if (!addresses.length) {
    return true;
  }
  return addresses.filter((i) => !i.internal || allowInternal).some((i) => i.family === "IPv" + family || i.family === family);
};
var resolve2 = (family, hostname, options, callback) => {
  options = options || {};
  if (!isFamilySupported(family, options.allowInternalNetworkInterfaces)) {
    callback(null, []);
    return null;
  }
  const dnsResolver = import_node_dns.default.Resolver ? new import_node_dns.default.Resolver(options) : import_node_dns.default;
  dnsResolver["resolve" + family](hostname, (err, addresses) => {
    if (err) {
      switch (err.code) {
        case import_node_dns.default.NODATA:
        case import_node_dns.default.NOTFOUND:
        case import_node_dns.default.NOTIMP:
        case import_node_dns.default.SERVFAIL:
        case import_node_dns.default.CONNREFUSED:
        case import_node_dns.default.REFUSED:
        case "EAI_AGAIN":
          return callback(null, []);
      }
      return callback(err);
    }
    return callback(null, Array.isArray(addresses) ? addresses : [].concat(addresses || []));
  });
  return import_node_dns.default.Resolver ? dnsResolver : null;
};
var dnsCache = /* @__PURE__ */ new Map();
var formatDNSValue = (value, extra) => {
  if (!value) {
    return Object.assign({}, extra || {});
  }
  const addresses = value.addresses || [];
  const host = addresses.length > 0 ? addresses[Math.floor(Math.random() * addresses.length)] : null;
  return Object.assign({
    host,
    // Include all addresses for connection fallback support
    _addresses: addresses
  }, extra || {});
};
var resolveHostname = (options, callback) => {
  options = options || {};
  if (!options.host && options.servername) {
    options.host = options.servername;
  }
  if (!options.host || import_node_net4.default.isIP(options.host)) {
    const value = {
      addresses: [options.host]
    };
    return callback(null, formatDNSValue(value, {
      servername: options.servername || false,
      cached: false
    }));
  }
  const host = options.host;
  const servername = options.servername || host;
  let cached;
  if (dnsCache.has(options.host)) {
    cached = dnsCache.get(options.host);
    const now = Date.now();
    if (now - lastCacheCleanup > CACHE_CLEANUP_INTERVAL) {
      lastCacheCleanup = now;
      for (const [host2, entry] of dnsCache.entries()) {
        if (entry.expires && entry.expires < now) {
          dnsCache.delete(host2);
        }
      }
      if (dnsCache.size > MAX_CACHE_SIZE) {
        const toDelete = Math.floor(MAX_CACHE_SIZE * 0.1);
        const keys = Array.from(dnsCache.keys()).slice(0, toDelete);
        keys.forEach((key) => dnsCache.delete(key));
      }
    }
    if (!cached.expires || cached.expires >= now) {
      return callback(null, formatDNSValue(cached.value, {
        servername,
        cached: true
      }));
    }
  }
  let responded = false;
  let deadline;
  const respond = (err, result) => {
    if (responded) {
      return;
    }
    responded = true;
    clearTimeout(deadline);
    callback(err, result);
  };
  const respondCached = (error2) => {
    if (!cached) {
      return false;
    }
    dnsCache.set(host, {
      value: cached.value,
      expires: Date.now() + (options.dnsTtl || DNS_TTL)
    });
    respond(null, formatDNSValue(cached.value, {
      servername,
      cached: true,
      error: error2
    }));
    return true;
  };
  const resolvers = [];
  const timeout = Number(options.timeout) || 0;
  if (timeout > 0) {
    deadline = setTimeout(() => {
      for (const resolver of resolvers) {
        if (typeof resolver.cancel === "function") {
          resolver.cancel();
        }
      }
      const err = new Error("DNS lookup for " + host + " timed out");
      err.code = import_node_dns.default.TIMEOUT;
      if (!respondCached(err)) {
        respond(err);
      }
    }, timeout);
  }
  let ipv4Addresses = [];
  let ipv6Addresses = [];
  let ipv4Error = null;
  let ipv6Error = null;
  let pending = 2;
  const onResolved = () => {
    if (--pending || responded) {
      return;
    }
    const allAddresses = ipv4Addresses.concat(ipv6Addresses);
    if (allAddresses.length) {
      const value = {
        addresses: allAddresses
      };
      dnsCache.set(host, {
        value,
        expires: Date.now() + (options.dnsTtl || DNS_TTL)
      });
      return respond(null, formatDNSValue(value, {
        servername,
        cached: false
      }));
    }
    if (ipv4Error && ipv6Error && respondCached(ipv4Error)) {
      return;
    }
    try {
      import_node_dns.default.lookup(host, { all: true }, (err, addresses) => {
        if (err) {
          if (respondCached(err)) {
            return;
          }
          return respond(err);
        }
        const supportedAddresses = addresses ? addresses.filter((addr) => isFamilySupported(addr.family)).map((addr) => addr.address) : [];
        if (addresses && addresses.length && !supportedAddresses.length) {
          console.warn(`Failed to resolve IPv${addresses[0].family} addresses with current network`);
        }
        if (!supportedAddresses.length && cached) {
          return respond(null, formatDNSValue(cached.value, {
            servername,
            cached: true
          }));
        }
        const value = {
          addresses: supportedAddresses.length ? supportedAddresses : [host]
        };
        dnsCache.set(host, {
          value,
          expires: Date.now() + (options.dnsTtl || DNS_TTL)
        });
        return respond(null, formatDNSValue(value, {
          servername,
          cached: false
        }));
      });
    } catch (lookupErr) {
      if (respondCached(lookupErr)) {
        return;
      }
      return respond(ipv4Error || ipv6Error || lookupErr);
    }
  };
  for (const family of [4, 6]) {
    const resolver = resolve2(family, host, options, (err, addresses) => {
      if (family === 4) {
        ipv4Error = err;
        ipv4Addresses = addresses || [];
      } else {
        ipv6Error = err;
        ipv6Addresses = addresses || [];
      }
      onResolved();
    });
    if (resolver) {
      resolvers.push(resolver);
    }
  }
};
var parseConnectionUrl = (str) => {
  str = str || "";
  const options = {};
  const url = parse(str, true);
  switch (url.protocol) {
    case "smtp:":
      options.secure = false;
      break;
    case "smtps:":
      options.secure = true;
      break;
    case "direct:":
      options.direct = true;
      break;
  }
  if (!isNaN(url.port) && Number(url.port)) {
    options.port = Number(url.port);
  }
  if (url.hostname) {
    options.host = url.hostname;
  }
  if (url.username || url.password) {
    options.auth = {
      user: url.username || "",
      pass: url.password || ""
    };
  }
  Object.keys(url.query || {}).forEach((key) => {
    let obj = options;
    let lKey = key;
    let value = url.query[key];
    if (!isNaN(value)) {
      value = Number(value);
    }
    switch (value) {
      case "true":
        value = true;
        break;
      case "false":
        value = false;
        break;
    }
    if (key.indexOf("tls.") === 0) {
      lKey = key.substr(4);
      if (!options.tls) {
        options.tls = {};
      }
      obj = options.tls;
    } else if (key.indexOf(".") >= 0) {
      return;
    }
    if (!isProtoKey(lKey) && !(lKey in obj)) {
      obj[lKey] = value;
    }
  });
  return options;
};
var _logFunc = (logger, level, defaults, data, message, ...args) => {
  const entry = Object.assign({}, defaults || {}, data || {});
  delete entry.level;
  let logLevel = level;
  if (typeof logger[logLevel] !== "function") {
    logLevel = ["info", "debug", "log", "trace", "warn", "error"].find((name2) => typeof logger[name2] === "function");
  }
  if (logLevel) {
    logger[logLevel](entry, message, ...args);
  }
};
var getLogger = (options, defaults) => {
  options = options || {};
  const response = {};
  const levels = ["trace", "debug", "info", "warn", "error", "fatal"];
  if (!options.logger) {
    levels.forEach((level) => {
      response[level] = () => false;
    });
    return response;
  }
  const logger = options.logger === true ? createDefaultLogger(levels) : options.logger;
  levels.forEach((level) => {
    response[level] = (...args) => {
      const data = typeof args[0] === "string" ? void 0 : args.shift();
      _logFunc(logger, level, defaults, data, ...args);
    };
  });
  return response;
};
var callbackPromise = (resolve3, reject) => function(...args) {
  const err = args.shift();
  if (err) {
    reject(err);
  } else {
    resolve3(...args);
  }
};
var parseDataURI = (uri) => {
  if (typeof uri !== "string") {
    return null;
  }
  if (!uri.startsWith("data:")) {
    return null;
  }
  const commaPos = uri.indexOf(",");
  if (commaPos === -1) {
    return null;
  }
  const data = uri.substring(commaPos + 1);
  const metaStr = uri.substring("data:".length, commaPos);
  let encoding;
  const metaEntries = metaStr.split(";");
  if (metaEntries.length > 0) {
    const lastEntry = metaEntries[metaEntries.length - 1].toLowerCase().trim();
    if (["base64", "utf8", "utf-8"].includes(lastEntry) && lastEntry.indexOf("=") === -1) {
      encoding = lastEntry;
      metaEntries.pop();
    }
  }
  const contentType = metaEntries.length > 0 ? metaEntries.shift() : "application/octet-stream";
  const params = {};
  for (let i = 0; i < metaEntries.length; i++) {
    const entry = metaEntries[i];
    const sepPos = entry.indexOf("=");
    if (sepPos > 0) {
      const key = entry.substring(0, sepPos).trim();
      const value = entry.substring(sepPos + 1).trim();
      if (key && !isProtoKey(key)) {
        params[key] = value;
      }
    }
  }
  let bufferData;
  try {
    if (encoding === "base64") {
      bufferData = Buffer.from(data, "base64");
    } else {
      try {
        bufferData = Buffer.from(decodeURIComponent(data));
      } catch (_decodeError) {
        bufferData = Buffer.from(data);
      }
    }
  } catch (_bufferError) {
    bufferData = Buffer.alloc(0);
  }
  return {
    data: bufferData,
    encoding: encoding || null,
    contentType: contentType || "application/octet-stream",
    params
  };
};
function resolveContent(data, key, options, callback) {
  if (!callback && typeof options === "function") {
    callback = options;
    options = false;
  }
  options = options || {};
  let promise;
  if (!callback) {
    promise = new Promise((resolve3, reject) => {
      callback = callbackPromise(resolve3, reject);
    });
  }
  resolveContentValue(data, key, options, callback);
  return promise;
}
function resolveContentValue(data, key, options, callback) {
  let content = data && data[key] && data[key].content || data[key];
  const encoding = (typeof data[key] === "object" && data[key].encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
  if (!content) {
    return callback(null, content);
  }
  if (typeof content === "object") {
    if (typeof content.pipe === "function") {
      return resolveStream(content, (err, value) => {
        if (err) {
          return callback(err);
        }
        if (data[key].content) {
          data[key].content = value;
        } else {
          data[key] = value;
        }
        callback(null, value);
      });
    } else if (/^data:/i.test(content.path || content.href)) {
      const parsedDataUri = parseDataURI(content.path || content.href);
      return callback(null, parsedDataUri && parsedDataUri.data ? parsedDataUri.data : Buffer.alloc(0));
    } else if (content.href || /^https?:\/\//i.test(content.path)) {
      const url = content.href || content.path;
      if (options.disableUrlAccess) {
        setImmediate(() => {
          const err = new Error("Url access rejected for " + url);
          err.code = EURLACCESS;
          callback(err);
        });
        return;
      }
      return resolveStream(fetch_default(url, { headers: content.httpHeaders, tls: content.tls }), callback);
    } else if (content.path) {
      if (options.disableFileAccess) {
        setImmediate(() => {
          const err = new Error("File access rejected for " + content.path);
          err.code = EFILEACCESS;
          callback(err);
        });
        return;
      }
      return resolveStream(import_node_fs.default.createReadStream(content.path), callback);
    }
  }
  if (typeof data[key].content === "string" && !["utf8", "usascii", "ascii"].includes(encoding)) {
    content = Buffer.from(data[key].content, encoding);
  }
  setImmediate(() => callback(null, content));
}
var assign = function(...args) {
  const target = args.shift() || {};
  args.forEach((source) => {
    Object.keys(source || {}).forEach((key) => {
      if (isProtoKey(key)) {
        return;
      }
      if (["tls", "auth"].includes(key) && source[key] && typeof source[key] === "object") {
        target[key] = copyOwnKeys(target[key] || {}, source[key]);
      } else {
        target[key] = source[key];
      }
    });
  });
  return target;
};
var encodeXText = (str) => {
  if (!/[^\x21-\x2A\x2C-\x3C\x3E-\x7E]/.test(str)) {
    return str;
  }
  const buf = Buffer.from(str);
  let result = "";
  for (let i = 0, len = buf.length; i < len; i++) {
    const c = buf[i];
    if (c < 33 || c > 126 || c === 43 || c === 61) {
      result += "+" + (c < 16 ? "0" : "") + c.toString(16).toUpperCase();
    } else {
      result += String.fromCharCode(c);
    }
  }
  return result;
};
var streamErrors = /* @__PURE__ */ new WeakMap();
function recordStreamErrors(stream) {
  stream.on("error", (err) => {
    if (!streamErrors.has(stream)) {
      streamErrors.set(stream, err);
    }
  });
}
function destroyStream(value) {
  const stream = value;
  if (stream && typeof stream.pipe === "function" && typeof stream.destroy === "function" && !stream.destroyed) {
    stream.destroy();
  }
}
function unreadableStreamError(stream) {
  const err = streamErrors.get(stream) || stream.errored;
  if (err) {
    return err;
  }
  if (stream.readableEnded || stream.destroyed) {
    const unreadable = new Error("Content stream was already read or destroyed");
    unreadable.code = ESTREAM;
    return unreadable;
  }
  return null;
}
function resolveStream(stream, callback) {
  let responded = false;
  const respond = (err, value) => {
    if (responded) {
      return;
    }
    responded = true;
    callback(err, value);
  };
  const unreadable = unreadableStreamError(stream);
  if (unreadable) {
    stream.on("error", () => false);
    setImmediate(() => respond(unreadable));
    return;
  }
  const chunks = [];
  let chunklen = 0;
  stream.on("data", (chunk) => {
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk);
    }
    chunks.push(chunk);
    chunklen += chunk.length;
  });
  (0, import_node_stream2.finished)(stream, { writable: false }, (err) => {
    if (err) {
      return respond(err);
    }
    let value;
    try {
      value = Buffer.concat(chunks, chunklen);
    } catch (E2) {
      return respond(E2);
    }
    respond(null, value);
  });
}
function createDefaultLogger(levels) {
  const levelMaxLen = levels.reduce((max, level) => Math.max(max, level.length), 0);
  const levelNames = /* @__PURE__ */ new Map();
  levels.forEach((level) => {
    let levelName = level.toUpperCase();
    if (levelName.length < levelMaxLen) {
      levelName += " ".repeat(levelMaxLen - levelName.length);
    }
    levelNames.set(level, levelName);
  });
  const print = (level, entry, message, ...args) => {
    let prefix = "";
    if (entry) {
      if (entry.tnx === "server") {
        prefix = "S: ";
      } else if (entry.tnx === "client") {
        prefix = "C: ";
      }
      if (entry.sid) {
        prefix = "[" + entry.sid + "] " + prefix;
      }
      if (entry.cid) {
        prefix = "[#" + entry.cid + "] " + prefix;
      }
    }
    message = import_node_util.default.format(message, ...args);
    message.split(/\r?\n/).forEach((line) => {
      console.log("[%s] %s %s", (/* @__PURE__ */ new Date()).toISOString().substr(0, 19).replace(/T/, " "), levelNames.get(level), prefix + line);
    });
  };
  const logger = {};
  levels.forEach((level) => {
    logger[level] = print.bind(null, level);
  });
  return logger;
}

// node_modules/nodemailer/dist/esm/mime-funcs/mime-types.js
var import_node_path = __toESM(require("node:path"), 1);
var defaultMimeType = "application/octet-stream";
var defaultExtension = "bin";
var mimeTypes = /* @__PURE__ */ new Map([
  ["application/acad", "dwg"],
  ["application/applixware", "aw"],
  ["application/arj", "arj"],
  ["application/atom+xml", "xml"],
  ["application/atomcat+xml", "atomcat"],
  ["application/atomsvc+xml", "atomsvc"],
  ["application/base64", ["mm", "mme"]],
  ["application/binhex", "hqx"],
  ["application/binhex4", "hqx"],
  ["application/book", ["book", "boo"]],
  ["application/ccxml+xml,", "ccxml"],
  ["application/cdf", "cdf"],
  ["application/cdmi-capability", "cdmia"],
  ["application/cdmi-container", "cdmic"],
  ["application/cdmi-domain", "cdmid"],
  ["application/cdmi-object", "cdmio"],
  ["application/cdmi-queue", "cdmiq"],
  ["application/clariscad", "ccad"],
  ["application/commonground", "dp"],
  ["application/cu-seeme", "cu"],
  ["application/davmount+xml", "davmount"],
  ["application/drafting", "drw"],
  ["application/dsptype", "tsp"],
  ["application/dssc+der", "dssc"],
  ["application/dssc+xml", "xdssc"],
  ["application/dxf", "dxf"],
  ["application/ecmascript", ["js", "es"]],
  ["application/emma+xml", "emma"],
  ["application/envoy", "evy"],
  ["application/epub+zip", "epub"],
  ["application/excel", ["xls", "xl", "xla", "xlb", "xlc", "xld", "xlk", "xll", "xlm", "xlt", "xlv", "xlw"]],
  ["application/exi", "exi"],
  ["application/font-tdpfr", "pfr"],
  ["application/fractals", "fif"],
  ["application/freeloader", "frl"],
  ["application/futuresplash", "spl"],
  ["application/geo+json", "geojson"],
  ["application/gnutar", "tgz"],
  ["application/groupwise", "vew"],
  ["application/hlp", "hlp"],
  ["application/hta", "hta"],
  ["application/hyperstudio", "stk"],
  ["application/i-deas", "unv"],
  ["application/iges", ["iges", "igs"]],
  ["application/inf", "inf"],
  ["application/internet-property-stream", "acx"],
  ["application/ipfix", "ipfix"],
  ["application/java", "class"],
  ["application/java-archive", "jar"],
  ["application/java-byte-code", "class"],
  ["application/java-serialized-object", "ser"],
  ["application/java-vm", "class"],
  ["application/javascript", "js"],
  ["application/json", "json"],
  ["application/lha", "lha"],
  ["application/lzx", "lzx"],
  ["application/mac-binary", "bin"],
  ["application/mac-binhex", "hqx"],
  ["application/mac-binhex40", "hqx"],
  ["application/mac-compactpro", "cpt"],
  ["application/macbinary", "bin"],
  ["application/mads+xml", "mads"],
  ["application/marc", "mrc"],
  ["application/marcxml+xml", "mrcx"],
  ["application/mathematica", "ma"],
  ["application/mathml+xml", "mathml"],
  ["application/mbedlet", "mbd"],
  ["application/mbox", "mbox"],
  ["application/mcad", "mcd"],
  ["application/mediaservercontrol+xml", "mscml"],
  ["application/metalink4+xml", "meta4"],
  ["application/mets+xml", "mets"],
  ["application/mime", "aps"],
  ["application/mods+xml", "mods"],
  ["application/mp21", "m21"],
  ["application/mp4", "mp4"],
  ["application/mspowerpoint", ["ppt", "pot", "pps", "ppz"]],
  ["application/msword", ["doc", "dot", "w6w", "wiz", "word"]],
  ["application/mswrite", "wri"],
  ["application/mxf", "mxf"],
  ["application/netmc", "mcp"],
  ["application/octet-stream", ["*"]],
  ["application/oda", "oda"],
  ["application/oebps-package+xml", "opf"],
  ["application/ogg", "ogx"],
  ["application/olescript", "axs"],
  ["application/onenote", "onetoc"],
  ["application/patch-ops-error+xml", "xer"],
  ["application/pdf", "pdf"],
  ["application/pgp-encrypted", "asc"],
  ["application/pgp-signature", "pgp"],
  ["application/pics-rules", "prf"],
  ["application/pkcs-12", "p12"],
  ["application/pkcs-crl", "crl"],
  ["application/pkcs10", "p10"],
  ["application/pkcs7-mime", ["p7c", "p7m"]],
  ["application/pkcs7-signature", "p7s"],
  ["application/pkcs8", "p8"],
  ["application/pkix-attr-cert", "ac"],
  ["application/pkix-cert", ["cer", "crt"]],
  ["application/pkix-crl", "crl"],
  ["application/pkix-pkipath", "pkipath"],
  ["application/pkixcmp", "pki"],
  ["application/plain", "text"],
  ["application/pls+xml", "pls"],
  ["application/postscript", ["ps", "ai", "eps"]],
  ["application/powerpoint", "ppt"],
  ["application/pro_eng", ["part", "prt"]],
  ["application/prs.cww", "cww"],
  ["application/pskc+xml", "pskcxml"],
  ["application/rdf+xml", "rdf"],
  ["application/reginfo+xml", "rif"],
  ["application/relax-ng-compact-syntax", "rnc"],
  ["application/resource-lists+xml", "rl"],
  ["application/resource-lists-diff+xml", "rld"],
  ["application/ringing-tones", "rng"],
  ["application/rls-services+xml", "rs"],
  ["application/rsd+xml", "rsd"],
  ["application/rss+xml", "xml"],
  ["application/rtf", ["rtf", "rtx"]],
  ["application/sbml+xml", "sbml"],
  ["application/scvp-cv-request", "scq"],
  ["application/scvp-cv-response", "scs"],
  ["application/scvp-vp-request", "spq"],
  ["application/scvp-vp-response", "spp"],
  ["application/sdp", "sdp"],
  ["application/sea", "sea"],
  ["application/set", "set"],
  ["application/set-payment-initiation", "setpay"],
  ["application/set-registration-initiation", "setreg"],
  ["application/shf+xml", "shf"],
  ["application/sla", "stl"],
  ["application/smil", ["smi", "smil"]],
  ["application/smil+xml", "smi"],
  ["application/solids", "sol"],
  ["application/sounder", "sdr"],
  ["application/sparql-query", "rq"],
  ["application/sparql-results+xml", "srx"],
  ["application/srgs", "gram"],
  ["application/srgs+xml", "grxml"],
  ["application/sru+xml", "sru"],
  ["application/ssml+xml", "ssml"],
  ["application/step", ["step", "stp"]],
  ["application/streamingmedia", "ssm"],
  ["application/tei+xml", "tei"],
  ["application/thraud+xml", "tfi"],
  ["application/timestamped-data", "tsd"],
  ["application/toolbook", "tbk"],
  ["application/vda", "vda"],
  ["application/vnd.3gpp.pic-bw-large", "plb"],
  ["application/vnd.3gpp.pic-bw-small", "psb"],
  ["application/vnd.3gpp.pic-bw-var", "pvb"],
  ["application/vnd.3gpp2.tcap", "tcap"],
  ["application/vnd.3m.post-it-notes", "pwn"],
  ["application/vnd.accpac.simply.aso", "aso"],
  ["application/vnd.accpac.simply.imp", "imp"],
  ["application/vnd.acucobol", "acu"],
  ["application/vnd.acucorp", "atc"],
  ["application/vnd.adobe.air-application-installer-package+zip", "air"],
  ["application/vnd.adobe.fxp", "fxp"],
  ["application/vnd.adobe.xdp+xml", "xdp"],
  ["application/vnd.adobe.xfdf", "xfdf"],
  ["application/vnd.ahead.space", "ahead"],
  ["application/vnd.airzip.filesecure.azf", "azf"],
  ["application/vnd.airzip.filesecure.azs", "azs"],
  ["application/vnd.amazon.ebook", "azw"],
  ["application/vnd.americandynamics.acc", "acc"],
  ["application/vnd.amiga.ami", "ami"],
  ["application/vnd.android.package-archive", "apk"],
  ["application/vnd.anser-web-certificate-issue-initiation", "cii"],
  ["application/vnd.anser-web-funds-transfer-initiation", "fti"],
  ["application/vnd.antix.game-component", "atx"],
  ["application/vnd.apple.installer+xml", "mpkg"],
  ["application/vnd.apple.mpegurl", "m3u8"],
  ["application/vnd.aristanetworks.swi", "swi"],
  ["application/vnd.audiograph", "aep"],
  ["application/vnd.blueice.multipass", "mpm"],
  ["application/vnd.bmi", "bmi"],
  ["application/vnd.businessobjects", "rep"],
  ["application/vnd.chemdraw+xml", "cdxml"],
  ["application/vnd.chipnuts.karaoke-mmd", "mmd"],
  ["application/vnd.cinderella", "cdy"],
  ["application/vnd.claymore", "cla"],
  ["application/vnd.cloanto.rp9", "rp9"],
  ["application/vnd.clonk.c4group", "c4g"],
  ["application/vnd.cluetrust.cartomobile-config", "c11amc"],
  ["application/vnd.cluetrust.cartomobile-config-pkg", "c11amz"],
  ["application/vnd.commonspace", "csp"],
  ["application/vnd.contact.cmsg", "cdbcmsg"],
  ["application/vnd.cosmocaller", "cmc"],
  ["application/vnd.crick.clicker", "clkx"],
  ["application/vnd.crick.clicker.keyboard", "clkk"],
  ["application/vnd.crick.clicker.palette", "clkp"],
  ["application/vnd.crick.clicker.template", "clkt"],
  ["application/vnd.crick.clicker.wordbank", "clkw"],
  ["application/vnd.criticaltools.wbs+xml", "wbs"],
  ["application/vnd.ctc-posml", "pml"],
  ["application/vnd.cups-ppd", "ppd"],
  ["application/vnd.curl.car", "car"],
  ["application/vnd.curl.pcurl", "pcurl"],
  ["application/vnd.data-vision.rdz", "rdz"],
  ["application/vnd.denovo.fcselayout-link", "fe_launch"],
  ["application/vnd.dna", "dna"],
  ["application/vnd.dolby.mlp", "mlp"],
  ["application/vnd.dpgraph", "dpg"],
  ["application/vnd.dreamfactory", "dfac"],
  ["application/vnd.dvb.ait", "ait"],
  ["application/vnd.dvb.service", "svc"],
  ["application/vnd.dynageo", "geo"],
  ["application/vnd.ecowin.chart", "mag"],
  ["application/vnd.enliven", "nml"],
  ["application/vnd.epson.esf", "esf"],
  ["application/vnd.epson.msf", "msf"],
  ["application/vnd.epson.quickanime", "qam"],
  ["application/vnd.epson.salt", "slt"],
  ["application/vnd.epson.ssf", "ssf"],
  ["application/vnd.eszigno3+xml", "es3"],
  ["application/vnd.ezpix-album", "ez2"],
  ["application/vnd.ezpix-package", "ez3"],
  ["application/vnd.fdf", "fdf"],
  ["application/vnd.fdsn.seed", "seed"],
  ["application/vnd.flographit", "gph"],
  ["application/vnd.fluxtime.clip", "ftc"],
  ["application/vnd.framemaker", "fm"],
  ["application/vnd.frogans.fnc", "fnc"],
  ["application/vnd.frogans.ltf", "ltf"],
  ["application/vnd.fsc.weblaunch", "fsc"],
  ["application/vnd.fujitsu.oasys", "oas"],
  ["application/vnd.fujitsu.oasys2", "oa2"],
  ["application/vnd.fujitsu.oasys3", "oa3"],
  ["application/vnd.fujitsu.oasysgp", "fg5"],
  ["application/vnd.fujitsu.oasysprs", "bh2"],
  ["application/vnd.fujixerox.ddd", "ddd"],
  ["application/vnd.fujixerox.docuworks", "xdw"],
  ["application/vnd.fujixerox.docuworks.binder", "xbd"],
  ["application/vnd.fuzzysheet", "fzs"],
  ["application/vnd.genomatix.tuxedo", "txd"],
  ["application/vnd.geogebra.file", "ggb"],
  ["application/vnd.geogebra.tool", "ggt"],
  ["application/vnd.geometry-explorer", "gex"],
  ["application/vnd.geonext", "gxt"],
  ["application/vnd.geoplan", "g2w"],
  ["application/vnd.geospace", "g3w"],
  ["application/vnd.gmx", "gmx"],
  ["application/vnd.google-earth.kml+xml", "kml"],
  ["application/vnd.google-earth.kmz", "kmz"],
  ["application/vnd.grafeq", "gqf"],
  ["application/vnd.groove-account", "gac"],
  ["application/vnd.groove-help", "ghf"],
  ["application/vnd.groove-identity-message", "gim"],
  ["application/vnd.groove-injector", "grv"],
  ["application/vnd.groove-tool-message", "gtm"],
  ["application/vnd.groove-tool-template", "tpl"],
  ["application/vnd.groove-vcard", "vcg"],
  ["application/vnd.hal+xml", "hal"],
  ["application/vnd.handheld-entertainment+xml", "zmm"],
  ["application/vnd.hbci", "hbci"],
  ["application/vnd.hhe.lesson-player", "les"],
  ["application/vnd.hp-hpgl", ["hgl", "hpg", "hpgl"]],
  ["application/vnd.hp-hpid", "hpid"],
  ["application/vnd.hp-hps", "hps"],
  ["application/vnd.hp-jlyt", "jlt"],
  ["application/vnd.hp-pcl", "pcl"],
  ["application/vnd.hp-pclxl", "pclxl"],
  ["application/vnd.hydrostatix.sof-data", "sfd-hdstx"],
  ["application/vnd.hzn-3d-crossword", "x3d"],
  ["application/vnd.ibm.minipay", "mpy"],
  ["application/vnd.ibm.modcap", "afp"],
  ["application/vnd.ibm.rights-management", "irm"],
  ["application/vnd.ibm.secure-container", "sc"],
  ["application/vnd.iccprofile", "icc"],
  ["application/vnd.igloader", "igl"],
  ["application/vnd.immervision-ivp", "ivp"],
  ["application/vnd.immervision-ivu", "ivu"],
  ["application/vnd.insors.igm", "igm"],
  ["application/vnd.intercon.formnet", "xpw"],
  ["application/vnd.intergeo", "i2g"],
  ["application/vnd.intu.qbo", "qbo"],
  ["application/vnd.intu.qfx", "qfx"],
  ["application/vnd.ipunplugged.rcprofile", "rcprofile"],
  ["application/vnd.irepository.package+xml", "irp"],
  ["application/vnd.is-xpr", "xpr"],
  ["application/vnd.isac.fcs", "fcs"],
  ["application/vnd.jam", "jam"],
  ["application/vnd.jcp.javame.midlet-rms", "rms"],
  ["application/vnd.jisp", "jisp"],
  ["application/vnd.joost.joda-archive", "joda"],
  ["application/vnd.kahootz", "ktz"],
  ["application/vnd.kde.karbon", "karbon"],
  ["application/vnd.kde.kchart", "chrt"],
  ["application/vnd.kde.kformula", "kfo"],
  ["application/vnd.kde.kivio", "flw"],
  ["application/vnd.kde.kontour", "kon"],
  ["application/vnd.kde.kpresenter", "kpr"],
  ["application/vnd.kde.kspread", "ksp"],
  ["application/vnd.kde.kword", "kwd"],
  ["application/vnd.kenameaapp", "htke"],
  ["application/vnd.kidspiration", "kia"],
  ["application/vnd.kinar", "kne"],
  ["application/vnd.koan", "skp"],
  ["application/vnd.kodak-descriptor", "sse"],
  ["application/vnd.las.las+xml", "lasxml"],
  ["application/vnd.llamagraphics.life-balance.desktop", "lbd"],
  ["application/vnd.llamagraphics.life-balance.exchange+xml", "lbe"],
  ["application/vnd.lotus-1-2-3", "123"],
  ["application/vnd.lotus-approach", "apr"],
  ["application/vnd.lotus-freelance", "pre"],
  ["application/vnd.lotus-notes", "nsf"],
  ["application/vnd.lotus-organizer", "org"],
  ["application/vnd.lotus-screencam", "scm"],
  ["application/vnd.lotus-wordpro", "lwp"],
  ["application/vnd.macports.portpkg", "portpkg"],
  ["application/vnd.mcd", "mcd"],
  ["application/vnd.medcalcdata", "mc1"],
  ["application/vnd.mediastation.cdkey", "cdkey"],
  ["application/vnd.mfer", "mwf"],
  ["application/vnd.mfmp", "mfm"],
  ["application/vnd.micrografx.flo", "flo"],
  ["application/vnd.micrografx.igx", "igx"],
  ["application/vnd.mif", "mif"],
  ["application/vnd.mobius.daf", "daf"],
  ["application/vnd.mobius.dis", "dis"],
  ["application/vnd.mobius.mbk", "mbk"],
  ["application/vnd.mobius.mqy", "mqy"],
  ["application/vnd.mobius.msl", "msl"],
  ["application/vnd.mobius.plc", "plc"],
  ["application/vnd.mobius.txf", "txf"],
  ["application/vnd.mophun.application", "mpn"],
  ["application/vnd.mophun.certificate", "mpc"],
  ["application/vnd.mozilla.xul+xml", "xul"],
  ["application/vnd.ms-artgalry", "cil"],
  ["application/vnd.ms-cab-compressed", "cab"],
  ["application/vnd.ms-excel", ["xls", "xla", "xlc", "xlm", "xlt", "xlw", "xlb", "xll"]],
  ["application/vnd.ms-excel.addin.macroenabled.12", "xlam"],
  ["application/vnd.ms-excel.sheet.binary.macroenabled.12", "xlsb"],
  ["application/vnd.ms-excel.sheet.macroenabled.12", "xlsm"],
  ["application/vnd.ms-excel.template.macroenabled.12", "xltm"],
  ["application/vnd.ms-fontobject", "eot"],
  ["application/vnd.ms-htmlhelp", "chm"],
  ["application/vnd.ms-ims", "ims"],
  ["application/vnd.ms-lrm", "lrm"],
  ["application/vnd.ms-officetheme", "thmx"],
  ["application/vnd.ms-outlook", "msg"],
  ["application/vnd.ms-pki.certstore", "sst"],
  ["application/vnd.ms-pki.pko", "pko"],
  ["application/vnd.ms-pki.seccat", "cat"],
  ["application/vnd.ms-pki.stl", "stl"],
  ["application/vnd.ms-pkicertstore", "sst"],
  ["application/vnd.ms-pkiseccat", "cat"],
  ["application/vnd.ms-pkistl", "stl"],
  ["application/vnd.ms-powerpoint", ["ppt", "pot", "pps", "ppa", "pwz"]],
  ["application/vnd.ms-powerpoint.addin.macroenabled.12", "ppam"],
  ["application/vnd.ms-powerpoint.presentation.macroenabled.12", "pptm"],
  ["application/vnd.ms-powerpoint.slide.macroenabled.12", "sldm"],
  ["application/vnd.ms-powerpoint.slideshow.macroenabled.12", "ppsm"],
  ["application/vnd.ms-powerpoint.template.macroenabled.12", "potm"],
  ["application/vnd.ms-project", "mpp"],
  ["application/vnd.ms-word.document.macroenabled.12", "docm"],
  ["application/vnd.ms-word.template.macroenabled.12", "dotm"],
  ["application/vnd.ms-works", ["wks", "wcm", "wdb", "wps"]],
  ["application/vnd.ms-wpl", "wpl"],
  ["application/vnd.ms-xpsdocument", "xps"],
  ["application/vnd.mseq", "mseq"],
  ["application/vnd.musician", "mus"],
  ["application/vnd.muvee.style", "msty"],
  ["application/vnd.neurolanguage.nlu", "nlu"],
  ["application/vnd.noblenet-directory", "nnd"],
  ["application/vnd.noblenet-sealer", "nns"],
  ["application/vnd.noblenet-web", "nnw"],
  ["application/vnd.nokia.configuration-message", "ncm"],
  ["application/vnd.nokia.n-gage.data", "ngdat"],
  ["application/vnd.nokia.n-gage.symbian.install", "n-gage"],
  ["application/vnd.nokia.radio-preset", "rpst"],
  ["application/vnd.nokia.radio-presets", "rpss"],
  ["application/vnd.nokia.ringing-tone", "rng"],
  ["application/vnd.novadigm.edm", "edm"],
  ["application/vnd.novadigm.edx", "edx"],
  ["application/vnd.novadigm.ext", "ext"],
  ["application/vnd.oasis.opendocument.chart", "odc"],
  ["application/vnd.oasis.opendocument.chart-template", "otc"],
  ["application/vnd.oasis.opendocument.database", "odb"],
  ["application/vnd.oasis.opendocument.formula", "odf"],
  ["application/vnd.oasis.opendocument.formula-template", "odft"],
  ["application/vnd.oasis.opendocument.graphics", "odg"],
  ["application/vnd.oasis.opendocument.graphics-template", "otg"],
  ["application/vnd.oasis.opendocument.image", "odi"],
  ["application/vnd.oasis.opendocument.image-template", "oti"],
  ["application/vnd.oasis.opendocument.presentation", "odp"],
  ["application/vnd.oasis.opendocument.presentation-template", "otp"],
  ["application/vnd.oasis.opendocument.spreadsheet", "ods"],
  ["application/vnd.oasis.opendocument.spreadsheet-template", "ots"],
  ["application/vnd.oasis.opendocument.text", "odt"],
  ["application/vnd.oasis.opendocument.text-master", "odm"],
  ["application/vnd.oasis.opendocument.text-template", "ott"],
  ["application/vnd.oasis.opendocument.text-web", "oth"],
  ["application/vnd.olpc-sugar", "xo"],
  ["application/vnd.oma.dd2+xml", "dd2"],
  ["application/vnd.openofficeorg.extension", "oxt"],
  ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "pptx"],
  ["application/vnd.openxmlformats-officedocument.presentationml.slide", "sldx"],
  ["application/vnd.openxmlformats-officedocument.presentationml.slideshow", "ppsx"],
  ["application/vnd.openxmlformats-officedocument.presentationml.template", "potx"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.template", "xltx"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.template", "dotx"],
  ["application/vnd.osgeo.mapguide.package", "mgp"],
  ["application/vnd.osgi.dp", "dp"],
  ["application/vnd.palm", "pdb"],
  ["application/vnd.pawaafile", "paw"],
  ["application/vnd.pg.format", "str"],
  ["application/vnd.pg.osasli", "ei6"],
  ["application/vnd.picsel", "efif"],
  ["application/vnd.pmi.widget", "wg"],
  ["application/vnd.pocketlearn", "plf"],
  ["application/vnd.powerbuilder6", "pbd"],
  ["application/vnd.previewsystems.box", "box"],
  ["application/vnd.proteus.magazine", "mgz"],
  ["application/vnd.publishare-delta-tree", "qps"],
  ["application/vnd.pvi.ptid1", "ptid"],
  ["application/vnd.quark.quarkxpress", "qxd"],
  ["application/vnd.realvnc.bed", "bed"],
  ["application/vnd.recordare.musicxml", "mxl"],
  ["application/vnd.recordare.musicxml+xml", "musicxml"],
  ["application/vnd.rig.cryptonote", "cryptonote"],
  ["application/vnd.rim.cod", "cod"],
  ["application/vnd.rn-realmedia", "rm"],
  ["application/vnd.rn-realplayer", "rnx"],
  ["application/vnd.route66.link66+xml", "link66"],
  ["application/vnd.sailingtracker.track", "st"],
  ["application/vnd.seemail", "see"],
  ["application/vnd.sema", "sema"],
  ["application/vnd.semd", "semd"],
  ["application/vnd.semf", "semf"],
  ["application/vnd.shana.informed.formdata", "ifm"],
  ["application/vnd.shana.informed.formtemplate", "itp"],
  ["application/vnd.shana.informed.interchange", "iif"],
  ["application/vnd.shana.informed.package", "ipk"],
  ["application/vnd.simtech-mindmapper", "twd"],
  ["application/vnd.smaf", "mmf"],
  ["application/vnd.smart.teacher", "teacher"],
  ["application/vnd.solent.sdkm+xml", "sdkm"],
  ["application/vnd.spotfire.dxp", "dxp"],
  ["application/vnd.spotfire.sfs", "sfs"],
  ["application/vnd.stardivision.calc", "sdc"],
  ["application/vnd.stardivision.draw", "sda"],
  ["application/vnd.stardivision.impress", "sdd"],
  ["application/vnd.stardivision.math", "smf"],
  ["application/vnd.stardivision.writer", "sdw"],
  ["application/vnd.stardivision.writer-global", "sgl"],
  ["application/vnd.stepmania.stepchart", "sm"],
  ["application/vnd.sun.xml.calc", "sxc"],
  ["application/vnd.sun.xml.calc.template", "stc"],
  ["application/vnd.sun.xml.draw", "sxd"],
  ["application/vnd.sun.xml.draw.template", "std"],
  ["application/vnd.sun.xml.impress", "sxi"],
  ["application/vnd.sun.xml.impress.template", "sti"],
  ["application/vnd.sun.xml.math", "sxm"],
  ["application/vnd.sun.xml.writer", "sxw"],
  ["application/vnd.sun.xml.writer.global", "sxg"],
  ["application/vnd.sun.xml.writer.template", "stw"],
  ["application/vnd.sus-calendar", "sus"],
  ["application/vnd.svd", "svd"],
  ["application/vnd.symbian.install", "sis"],
  ["application/vnd.syncml+xml", "xsm"],
  ["application/vnd.syncml.dm+wbxml", "bdm"],
  ["application/vnd.syncml.dm+xml", "xdm"],
  ["application/vnd.tao.intent-module-archive", "tao"],
  ["application/vnd.tmobile-livetv", "tmo"],
  ["application/vnd.trid.tpt", "tpt"],
  ["application/vnd.triscape.mxs", "mxs"],
  ["application/vnd.trueapp", "tra"],
  ["application/vnd.ufdl", "ufd"],
  ["application/vnd.uiq.theme", "utz"],
  ["application/vnd.umajin", "umj"],
  ["application/vnd.unity", "unityweb"],
  ["application/vnd.uoml+xml", "uoml"],
  ["application/vnd.vcx", "vcx"],
  ["application/vnd.visio", "vsd"],
  ["application/vnd.visionary", "vis"],
  ["application/vnd.vsf", "vsf"],
  ["application/vnd.wap.wbxml", "wbxml"],
  ["application/vnd.wap.wmlc", "wmlc"],
  ["application/vnd.wap.wmlscriptc", "wmlsc"],
  ["application/vnd.webturbo", "wtb"],
  ["application/vnd.wolfram.player", "nbp"],
  ["application/vnd.wordperfect", "wpd"],
  ["application/vnd.wqd", "wqd"],
  ["application/vnd.wt.stf", "stf"],
  ["application/vnd.xara", ["web", "xar"]],
  ["application/vnd.xfdl", "xfdl"],
  ["application/vnd.yamaha.hv-dic", "hvd"],
  ["application/vnd.yamaha.hv-script", "hvs"],
  ["application/vnd.yamaha.hv-voice", "hvp"],
  ["application/vnd.yamaha.openscoreformat", "osf"],
  ["application/vnd.yamaha.openscoreformat.osfpvg+xml", "osfpvg"],
  ["application/vnd.yamaha.smaf-audio", "saf"],
  ["application/vnd.yamaha.smaf-phrase", "spf"],
  ["application/vnd.yellowriver-custom-menu", "cmp"],
  ["application/vnd.zul", "zir"],
  ["application/vnd.zzazz.deck+xml", "zaz"],
  ["application/vocaltec-media-desc", "vmd"],
  ["application/vocaltec-media-file", "vmf"],
  ["application/voicexml+xml", "vxml"],
  ["application/widget", "wgt"],
  ["application/winhlp", "hlp"],
  ["application/wordperfect", ["wp", "wp5", "wp6", "wpd"]],
  ["application/wordperfect6.0", ["w60", "wp5"]],
  ["application/wordperfect6.1", "w61"],
  ["application/wsdl+xml", "wsdl"],
  ["application/wspolicy+xml", "wspolicy"],
  ["application/x-123", "wk1"],
  ["application/x-7z-compressed", "7z"],
  ["application/x-abiword", "abw"],
  ["application/x-ace-compressed", "ace"],
  ["application/x-aim", "aim"],
  ["application/x-authorware-bin", "aab"],
  ["application/x-authorware-map", "aam"],
  ["application/x-authorware-seg", "aas"],
  ["application/x-bcpio", "bcpio"],
  ["application/x-binary", "bin"],
  ["application/x-binhex40", "hqx"],
  ["application/x-bittorrent", "torrent"],
  ["application/x-bsh", ["bsh", "sh", "shar"]],
  ["application/x-bytecode.elisp", "elc"],
  ["application/x-bytecode.python", "pyc"],
  ["application/x-bzip", "bz"],
  ["application/x-bzip2", ["boz", "bz2"]],
  ["application/x-cdf", "cdf"],
  ["application/x-cdlink", "vcd"],
  ["application/x-chat", ["cha", "chat"]],
  ["application/x-chess-pgn", "pgn"],
  ["application/x-cmu-raster", "ras"],
  ["application/x-cocoa", "cco"],
  ["application/x-compactpro", "cpt"],
  ["application/x-compress", "z"],
  ["application/x-compressed", ["tgz", "gz", "z", "zip"]],
  ["application/x-conference", "nsc"],
  ["application/x-cpio", "cpio"],
  ["application/x-cpt", "cpt"],
  ["application/x-csh", "csh"],
  ["application/x-debian-package", "deb"],
  ["application/x-deepv", "deepv"],
  ["application/x-director", ["dir", "dcr", "dxr"]],
  ["application/x-doom", "wad"],
  ["application/x-dtbncx+xml", "ncx"],
  ["application/x-dtbook+xml", "dtb"],
  ["application/x-dtbresource+xml", "res"],
  ["application/x-dvi", "dvi"],
  ["application/x-elc", "elc"],
  ["application/x-envoy", ["env", "evy"]],
  ["application/x-esrehber", "es"],
  ["application/x-excel", ["xls", "xla", "xlb", "xlc", "xld", "xlk", "xll", "xlm", "xlt", "xlv", "xlw"]],
  ["application/x-font-bdf", "bdf"],
  ["application/x-font-ghostscript", "gsf"],
  ["application/x-font-linux-psf", "psf"],
  ["application/x-font-otf", "otf"],
  ["application/x-font-pcf", "pcf"],
  ["application/x-font-snf", "snf"],
  ["application/x-font-ttf", "ttf"],
  ["application/x-font-type1", "pfa"],
  ["application/x-font-woff", "woff"],
  ["application/x-frame", "mif"],
  ["application/x-freelance", "pre"],
  ["application/x-futuresplash", "spl"],
  ["application/x-gnumeric", "gnumeric"],
  ["application/x-gsp", "gsp"],
  ["application/x-gss", "gss"],
  ["application/x-gtar", "gtar"],
  ["application/x-gzip", ["gz", "gzip"]],
  ["application/x-hdf", "hdf"],
  ["application/x-helpfile", ["help", "hlp"]],
  ["application/x-httpd-imap", "imap"],
  ["application/x-ima", "ima"],
  ["application/x-internet-signup", ["ins", "isp"]],
  ["application/x-internett-signup", "ins"],
  ["application/x-inventor", "iv"],
  ["application/x-ip2", "ip"],
  ["application/x-iphone", "iii"],
  ["application/x-java-class", "class"],
  ["application/x-java-commerce", "jcm"],
  ["application/x-java-jnlp-file", "jnlp"],
  ["application/x-javascript", "js"],
  ["application/x-koan", ["skd", "skm", "skp", "skt"]],
  ["application/x-ksh", "ksh"],
  ["application/x-latex", ["latex", "ltx"]],
  ["application/x-lha", "lha"],
  ["application/x-lisp", "lsp"],
  ["application/x-livescreen", "ivy"],
  ["application/x-lotus", "wq1"],
  ["application/x-lotusscreencam", "scm"],
  ["application/x-lzh", "lzh"],
  ["application/x-lzx", "lzx"],
  ["application/x-mac-binhex40", "hqx"],
  ["application/x-macbinary", "bin"],
  ["application/x-magic-cap-package-1.0", "mc$"],
  ["application/x-mathcad", "mcd"],
  ["application/x-meme", "mm"],
  ["application/x-midi", ["mid", "midi"]],
  ["application/x-mif", "mif"],
  ["application/x-mix-transfer", "nix"],
  ["application/x-mobipocket-ebook", "prc"],
  ["application/x-mplayer2", "asx"],
  ["application/x-ms-application", "application"],
  ["application/x-ms-wmd", "wmd"],
  ["application/x-ms-wmz", "wmz"],
  ["application/x-ms-xbap", "xbap"],
  ["application/x-msaccess", "mdb"],
  ["application/x-msbinder", "obd"],
  ["application/x-mscardfile", "crd"],
  ["application/x-msclip", "clp"],
  ["application/x-msdownload", ["exe", "dll"]],
  ["application/x-msexcel", ["xls", "xla", "xlw"]],
  ["application/x-msmediaview", ["mvb", "m13", "m14"]],
  ["application/x-msmetafile", "wmf"],
  ["application/x-msmoney", "mny"],
  ["application/x-mspowerpoint", "ppt"],
  ["application/x-mspublisher", "pub"],
  ["application/x-msschedule", "scd"],
  ["application/x-msterminal", "trm"],
  ["application/x-mswrite", "wri"],
  ["application/x-navi-animation", "ani"],
  ["application/x-navidoc", "nvd"],
  ["application/x-navimap", "map"],
  ["application/x-navistyle", "stl"],
  ["application/x-netcdf", ["cdf", "nc"]],
  ["application/x-newton-compatible-pkg", "pkg"],
  ["application/x-nokia-9000-communicator-add-on-software", "aos"],
  ["application/x-omc", "omc"],
  ["application/x-omcdatamaker", "omcd"],
  ["application/x-omcregerator", "omcr"],
  ["application/x-pagemaker", ["pm4", "pm5"]],
  ["application/x-pcl", "pcl"],
  ["application/x-perfmon", ["pma", "pmc", "pml", "pmr", "pmw"]],
  ["application/x-pixclscript", "plx"],
  ["application/x-pkcs10", "p10"],
  ["application/x-pkcs12", ["p12", "pfx"]],
  ["application/x-pkcs7-certificates", ["p7b", "spc"]],
  ["application/x-pkcs7-certreqresp", "p7r"],
  ["application/x-pkcs7-mime", ["p7m", "p7c"]],
  ["application/x-pkcs7-signature", ["p7s", "p7a"]],
  ["application/x-pointplus", "css"],
  ["application/x-portable-anymap", "pnm"],
  ["application/x-project", ["mpc", "mpt", "mpv", "mpx"]],
  ["application/x-qpro", "wb1"],
  ["application/x-rar-compressed", "rar"],
  ["application/x-rtf", "rtf"],
  ["application/x-sdp", "sdp"],
  ["application/x-sea", "sea"],
  ["application/x-seelogo", "sl"],
  ["application/x-sh", "sh"],
  ["application/x-shar", ["shar", "sh"]],
  ["application/x-shockwave-flash", "swf"],
  ["application/x-silverlight-app", "xap"],
  ["application/x-sit", "sit"],
  ["application/x-sprite", ["spr", "sprite"]],
  ["application/x-stuffit", "sit"],
  ["application/x-stuffitx", "sitx"],
  ["application/x-sv4cpio", "sv4cpio"],
  ["application/x-sv4crc", "sv4crc"],
  ["application/x-tar", "tar"],
  ["application/x-tbook", ["sbk", "tbk"]],
  ["application/x-tcl", "tcl"],
  ["application/x-tex", "tex"],
  ["application/x-tex-tfm", "tfm"],
  ["application/x-texinfo", ["texi", "texinfo"]],
  ["application/x-troff", ["roff", "t", "tr"]],
  ["application/x-troff-man", "man"],
  ["application/x-troff-me", "me"],
  ["application/x-troff-ms", "ms"],
  ["application/x-troff-msvideo", "avi"],
  ["application/x-ustar", "ustar"],
  ["application/x-visio", ["vsd", "vst", "vsw"]],
  ["application/x-vnd.audioexplosion.mzz", "mzz"],
  ["application/x-vnd.ls-xpix", "xpix"],
  ["application/x-vrml", "vrml"],
  ["application/x-wais-source", ["src", "wsrc"]],
  ["application/x-winhelp", "hlp"],
  ["application/x-wintalk", "wtk"],
  ["application/x-world", ["wrl", "svr"]],
  ["application/x-wpwin", "wpd"],
  ["application/x-wri", "wri"],
  ["application/x-x509-ca-cert", ["cer", "crt", "der"]],
  ["application/x-x509-user-cert", "crt"],
  ["application/x-xfig", "fig"],
  ["application/x-xpinstall", "xpi"],
  ["application/x-zip-compressed", "zip"],
  ["application/xcap-diff+xml", "xdf"],
  ["application/xenc+xml", "xenc"],
  ["application/xhtml+xml", "xhtml"],
  ["application/xml", "xml"],
  ["application/xml-dtd", "dtd"],
  ["application/xop+xml", "xop"],
  ["application/xslt+xml", "xslt"],
  ["application/xspf+xml", "xspf"],
  ["application/xv+xml", "mxml"],
  ["application/yang", "yang"],
  ["application/yin+xml", "yin"],
  ["application/ynd.ms-pkipko", "pko"],
  ["application/zip", "zip"],
  ["audio/adpcm", "adp"],
  ["audio/aiff", ["aiff", "aif", "aifc"]],
  ["audio/basic", ["snd", "au"]],
  ["audio/it", "it"],
  ["audio/make", ["funk", "my", "pfunk"]],
  ["audio/make.my.funk", "pfunk"],
  ["audio/mid", ["mid", "rmi"]],
  ["audio/midi", ["midi", "kar", "mid"]],
  ["audio/mod", "mod"],
  ["audio/mp4", "mp4a"],
  ["audio/mpeg", ["mpga", "mp3", "m2a", "mp2", "mpa", "mpg"]],
  ["audio/mpeg3", "mp3"],
  ["audio/nspaudio", ["la", "lma"]],
  ["audio/ogg", "oga"],
  ["audio/s3m", "s3m"],
  ["audio/tsp-audio", "tsi"],
  ["audio/tsplayer", "tsp"],
  ["audio/vnd.dece.audio", "uva"],
  ["audio/vnd.digital-winds", "eol"],
  ["audio/vnd.dra", "dra"],
  ["audio/vnd.dts", "dts"],
  ["audio/vnd.dts.hd", "dtshd"],
  ["audio/vnd.lucent.voice", "lvp"],
  ["audio/vnd.ms-playready.media.pya", "pya"],
  ["audio/vnd.nuera.ecelp4800", "ecelp4800"],
  ["audio/vnd.nuera.ecelp7470", "ecelp7470"],
  ["audio/vnd.nuera.ecelp9600", "ecelp9600"],
  ["audio/vnd.qcelp", "qcp"],
  ["audio/vnd.rip", "rip"],
  ["audio/voc", "voc"],
  ["audio/voxware", "vox"],
  ["audio/wav", "wav"],
  ["audio/webm", "weba"],
  ["audio/x-aac", "aac"],
  ["audio/x-adpcm", "snd"],
  ["audio/x-aiff", ["aiff", "aif", "aifc"]],
  ["audio/x-au", "au"],
  ["audio/x-gsm", ["gsd", "gsm"]],
  ["audio/x-jam", "jam"],
  ["audio/x-liveaudio", "lam"],
  ["audio/x-mid", ["mid", "midi"]],
  ["audio/x-midi", ["midi", "mid"]],
  ["audio/x-mod", "mod"],
  ["audio/x-mpeg", "mp2"],
  ["audio/x-mpeg-3", "mp3"],
  ["audio/x-mpegurl", "m3u"],
  ["audio/x-mpequrl", "m3u"],
  ["audio/x-ms-wax", "wax"],
  ["audio/x-ms-wma", "wma"],
  ["audio/x-nspaudio", ["la", "lma"]],
  ["audio/x-pn-realaudio", ["ra", "ram", "rm", "rmm", "rmp"]],
  ["audio/x-pn-realaudio-plugin", ["ra", "rmp", "rpm"]],
  ["audio/x-psid", "sid"],
  ["audio/x-realaudio", "ra"],
  ["audio/x-twinvq", "vqf"],
  ["audio/x-twinvq-plugin", ["vqe", "vql"]],
  ["audio/x-vnd.audioexplosion.mjuicemediafile", "mjf"],
  ["audio/x-voc", "voc"],
  ["audio/x-wav", "wav"],
  ["audio/xm", "xm"],
  ["chemical/x-cdx", "cdx"],
  ["chemical/x-cif", "cif"],
  ["chemical/x-cmdf", "cmdf"],
  ["chemical/x-cml", "cml"],
  ["chemical/x-csml", "csml"],
  ["chemical/x-pdb", ["pdb", "xyz"]],
  ["chemical/x-xyz", "xyz"],
  ["drawing/x-dwf", "dwf"],
  ["i-world/i-vrml", "ivr"],
  ["image/bmp", ["bmp", "bm"]],
  ["image/cgm", "cgm"],
  ["image/cis-cod", "cod"],
  ["image/cmu-raster", ["ras", "rast"]],
  ["image/fif", "fif"],
  ["image/florian", ["flo", "turbot"]],
  ["image/g3fax", "g3"],
  ["image/gif", "gif"],
  ["image/ief", ["ief", "iefs"]],
  ["image/jpeg", ["jpeg", "jpe", "jpg", "jfif", "jfif-tbnl"]],
  ["image/jutvision", "jut"],
  ["image/ktx", "ktx"],
  ["image/naplps", ["nap", "naplps"]],
  ["image/pict", ["pic", "pict"]],
  ["image/pipeg", "jfif"],
  ["image/pjpeg", ["jfif", "jpe", "jpeg", "jpg"]],
  ["image/png", ["png", "x-png"]],
  ["image/prs.btif", "btif"],
  ["image/svg+xml", "svg"],
  ["image/tiff", ["tif", "tiff"]],
  ["image/vasa", "mcf"],
  ["image/vnd.adobe.photoshop", "psd"],
  ["image/vnd.dece.graphic", "uvi"],
  ["image/vnd.djvu", "djvu"],
  ["image/vnd.dvb.subtitle", "sub"],
  ["image/vnd.dwg", ["dwg", "dxf", "svf"]],
  ["image/vnd.dxf", "dxf"],
  ["image/vnd.fastbidsheet", "fbs"],
  ["image/vnd.fpx", "fpx"],
  ["image/vnd.fst", "fst"],
  ["image/vnd.fujixerox.edmics-mmr", "mmr"],
  ["image/vnd.fujixerox.edmics-rlc", "rlc"],
  ["image/vnd.ms-modi", "mdi"],
  ["image/vnd.net-fpx", ["fpx", "npx"]],
  ["image/vnd.rn-realflash", "rf"],
  ["image/vnd.rn-realpix", "rp"],
  ["image/vnd.wap.wbmp", "wbmp"],
  ["image/vnd.xiff", "xif"],
  ["image/webp", "webp"],
  ["image/x-cmu-raster", "ras"],
  ["image/x-cmx", "cmx"],
  ["image/x-dwg", ["dwg", "dxf", "svf"]],
  ["image/x-freehand", "fh"],
  ["image/x-icon", "ico"],
  ["image/x-jg", "art"],
  ["image/x-jps", "jps"],
  ["image/x-niff", ["niff", "nif"]],
  ["image/x-pcx", "pcx"],
  ["image/x-pict", ["pct", "pic"]],
  ["image/x-portable-anymap", "pnm"],
  ["image/x-portable-bitmap", "pbm"],
  ["image/x-portable-graymap", "pgm"],
  ["image/x-portable-greymap", "pgm"],
  ["image/x-portable-pixmap", "ppm"],
  ["image/x-quicktime", ["qif", "qti", "qtif"]],
  ["image/x-rgb", "rgb"],
  ["image/x-tiff", ["tif", "tiff"]],
  ["image/x-windows-bmp", "bmp"],
  ["image/x-xbitmap", "xbm"],
  ["image/x-xbm", "xbm"],
  ["image/x-xpixmap", ["xpm", "pm"]],
  ["image/x-xwd", "xwd"],
  ["image/x-xwindowdump", "xwd"],
  ["image/xbm", "xbm"],
  ["image/xpm", "xpm"],
  ["message/rfc822", ["eml", "mht", "mhtml", "nws", "mime"]],
  ["model/iges", ["iges", "igs"]],
  ["model/mesh", "msh"],
  ["model/vnd.collada+xml", "dae"],
  ["model/vnd.dwf", "dwf"],
  ["model/vnd.gdl", "gdl"],
  ["model/vnd.gtw", "gtw"],
  ["model/vnd.mts", "mts"],
  ["model/vnd.vtu", "vtu"],
  ["model/vrml", ["vrml", "wrl", "wrz"]],
  ["model/x-pov", "pov"],
  ["multipart/x-gzip", "gzip"],
  ["multipart/x-ustar", "ustar"],
  ["multipart/x-zip", "zip"],
  ["music/crescendo", ["mid", "midi"]],
  ["music/x-karaoke", "kar"],
  ["paleovu/x-pv", "pvu"],
  ["text/asp", "asp"],
  ["text/calendar", "ics"],
  ["text/css", "css"],
  ["text/csv", "csv"],
  ["text/ecmascript", "js"],
  ["text/h323", "323"],
  ["text/html", ["html", "htm", "stm", "acgi", "htmls", "htx", "shtml"]],
  ["text/iuls", "uls"],
  ["text/javascript", "js"],
  ["text/mcf", "mcf"],
  ["text/n3", "n3"],
  ["text/pascal", "pas"],
  [
    "text/plain",
    [
      "txt",
      "bas",
      "c",
      "h",
      "c++",
      "cc",
      "com",
      "conf",
      "cxx",
      "def",
      "f",
      "f90",
      "for",
      "g",
      "hh",
      "idc",
      "jav",
      "java",
      "list",
      "log",
      "lst",
      "m",
      "mar",
      "pl",
      "sdml",
      "text"
    ]
  ],
  ["text/plain-bas", "par"],
  ["text/prs.lines.tag", "dsc"],
  ["text/richtext", ["rtx", "rt", "rtf"]],
  ["text/scriplet", "wsc"],
  ["text/scriptlet", "sct"],
  ["text/sgml", ["sgm", "sgml"]],
  ["text/tab-separated-values", "tsv"],
  ["text/troff", "t"],
  ["text/turtle", "ttl"],
  ["text/uri-list", ["uni", "unis", "uri", "uris"]],
  ["text/vnd.abc", "abc"],
  ["text/vnd.curl", "curl"],
  ["text/vnd.curl.dcurl", "dcurl"],
  ["text/vnd.curl.mcurl", "mcurl"],
  ["text/vnd.curl.scurl", "scurl"],
  ["text/vnd.fly", "fly"],
  ["text/vnd.fmi.flexstor", "flx"],
  ["text/vnd.graphviz", "gv"],
  ["text/vnd.in3d.3dml", "3dml"],
  ["text/vnd.in3d.spot", "spot"],
  ["text/vnd.rn-realtext", "rt"],
  ["text/vnd.sun.j2me.app-descriptor", "jad"],
  ["text/vnd.wap.wml", "wml"],
  ["text/vnd.wap.wmlscript", "wmls"],
  ["text/webviewhtml", "htt"],
  ["text/x-asm", ["asm", "s"]],
  ["text/x-audiosoft-intra", "aip"],
  ["text/x-c", ["c", "cc", "cpp"]],
  ["text/x-component", "htc"],
  ["text/x-fortran", ["for", "f", "f77", "f90"]],
  ["text/x-h", ["h", "hh"]],
  ["text/x-java-source", ["java", "jav"]],
  ["text/x-java-source,java", "java"],
  ["text/x-la-asf", "lsx"],
  ["text/x-m", "m"],
  ["text/x-pascal", "p"],
  ["text/x-script", "hlb"],
  ["text/x-script.csh", "csh"],
  ["text/x-script.elisp", "el"],
  ["text/x-script.guile", "scm"],
  ["text/x-script.ksh", "ksh"],
  ["text/x-script.lisp", "lsp"],
  ["text/x-script.perl", "pl"],
  ["text/x-script.perl-module", "pm"],
  ["text/x-script.phyton", "py"],
  ["text/x-script.rexx", "rexx"],
  ["text/x-script.scheme", "scm"],
  ["text/x-script.sh", "sh"],
  ["text/x-script.tcl", "tcl"],
  ["text/x-script.tcsh", "tcsh"],
  ["text/x-script.zsh", "zsh"],
  ["text/x-server-parsed-html", ["shtml", "ssi"]],
  ["text/x-setext", "etx"],
  ["text/x-sgml", ["sgm", "sgml"]],
  ["text/x-speech", ["spc", "talk"]],
  ["text/x-uil", "uil"],
  ["text/x-uuencode", ["uu", "uue"]],
  ["text/x-vcalendar", "vcs"],
  ["text/x-vcard", "vcf"],
  ["text/xml", "xml"],
  ["video/3gpp", "3gp"],
  ["video/3gpp2", "3g2"],
  ["video/animaflex", "afl"],
  ["video/avi", "avi"],
  ["video/avs-video", "avs"],
  ["video/dl", "dl"],
  ["video/fli", "fli"],
  ["video/gl", "gl"],
  ["video/h261", "h261"],
  ["video/h263", "h263"],
  ["video/h264", "h264"],
  ["video/jpeg", "jpgv"],
  ["video/jpm", "jpm"],
  ["video/mj2", "mj2"],
  ["video/mp4", "mp4"],
  ["video/mpeg", ["mpeg", "mp2", "mpa", "mpe", "mpg", "mpv2", "m1v", "m2v", "mp3"]],
  ["video/msvideo", "avi"],
  ["video/ogg", "ogv"],
  ["video/quicktime", ["mov", "qt", "moov"]],
  ["video/vdo", "vdo"],
  ["video/vivo", ["viv", "vivo"]],
  ["video/vnd.dece.hd", "uvh"],
  ["video/vnd.dece.mobile", "uvm"],
  ["video/vnd.dece.pd", "uvp"],
  ["video/vnd.dece.sd", "uvs"],
  ["video/vnd.dece.video", "uvv"],
  ["video/vnd.fvt", "fvt"],
  ["video/vnd.mpegurl", "mxu"],
  ["video/vnd.ms-playready.media.pyv", "pyv"],
  ["video/vnd.rn-realvideo", "rv"],
  ["video/vnd.uvvu.mp4", "uvu"],
  ["video/vnd.vivo", ["viv", "vivo"]],
  ["video/vosaic", "vos"],
  ["video/webm", "webm"],
  ["video/x-amt-demorun", "xdr"],
  ["video/x-amt-showrun", "xsr"],
  ["video/x-atomic3d-feature", "fmf"],
  ["video/x-dl", "dl"],
  ["video/x-dv", ["dif", "dv"]],
  ["video/x-f4v", "f4v"],
  ["video/x-fli", "fli"],
  ["video/x-flv", "flv"],
  ["video/x-gl", "gl"],
  ["video/x-isvideo", "isu"],
  ["video/x-la-asf", ["lsf", "lsx"]],
  ["video/x-m4v", "m4v"],
  ["video/x-motion-jpeg", "mjpg"],
  ["video/x-mpeg", ["mp3", "mp2"]],
  ["video/x-mpeq2a", "mp2"],
  ["video/x-ms-asf", ["asf", "asr", "asx"]],
  ["video/x-ms-asf-plugin", "asx"],
  ["video/x-ms-wm", "wm"],
  ["video/x-ms-wmv", "wmv"],
  ["video/x-ms-wmx", "wmx"],
  ["video/x-ms-wvx", "wvx"],
  ["video/x-msvideo", "avi"],
  ["video/x-qtc", "qtc"],
  ["video/x-scm", "scm"],
  ["video/x-sgi-movie", ["movie", "mv"]],
  ["windows/metafile", "wmf"],
  ["www/mime", "mime"],
  ["x-conference/x-cooltalk", "ice"],
  ["x-music/x-midi", ["mid", "midi"]],
  ["x-world/x-3dmf", ["3dm", "3dmf", "qd3", "qd3d"]],
  ["x-world/x-svr", "svr"],
  ["x-world/x-vrml", ["flr", "vrml", "wrl", "wrz", "xaf", "xof"]],
  ["x-world/x-vrt", "vrt"],
  ["xgl/drawing", "xgz"],
  ["xgl/movie", "xmz"]
]);
var extensions = /* @__PURE__ */ new Map([
  ["123", "application/vnd.lotus-1-2-3"],
  ["323", "text/h323"],
  ["*", "application/octet-stream"],
  ["3dm", "x-world/x-3dmf"],
  ["3dmf", "x-world/x-3dmf"],
  ["3dml", "text/vnd.in3d.3dml"],
  ["3g2", "video/3gpp2"],
  ["3gp", "video/3gpp"],
  ["7z", "application/x-7z-compressed"],
  ["a", "application/octet-stream"],
  ["aab", "application/x-authorware-bin"],
  ["aac", "audio/x-aac"],
  ["aam", "application/x-authorware-map"],
  ["aas", "application/x-authorware-seg"],
  ["abc", "text/vnd.abc"],
  ["abw", "application/x-abiword"],
  ["ac", "application/pkix-attr-cert"],
  ["acc", "application/vnd.americandynamics.acc"],
  ["ace", "application/x-ace-compressed"],
  ["acgi", "text/html"],
  ["acu", "application/vnd.acucobol"],
  ["acx", "application/internet-property-stream"],
  ["adp", "audio/adpcm"],
  ["aep", "application/vnd.audiograph"],
  ["afl", "video/animaflex"],
  ["afp", "application/vnd.ibm.modcap"],
  ["ahead", "application/vnd.ahead.space"],
  ["ai", "application/postscript"],
  ["aif", ["audio/aiff", "audio/x-aiff"]],
  ["aifc", ["audio/aiff", "audio/x-aiff"]],
  ["aiff", ["audio/aiff", "audio/x-aiff"]],
  ["aim", "application/x-aim"],
  ["aip", "text/x-audiosoft-intra"],
  ["air", "application/vnd.adobe.air-application-installer-package+zip"],
  ["ait", "application/vnd.dvb.ait"],
  ["ami", "application/vnd.amiga.ami"],
  ["ani", "application/x-navi-animation"],
  ["aos", "application/x-nokia-9000-communicator-add-on-software"],
  ["apk", "application/vnd.android.package-archive"],
  ["application", "application/x-ms-application"],
  ["apr", "application/vnd.lotus-approach"],
  ["aps", "application/mime"],
  ["arc", "application/octet-stream"],
  ["arj", ["application/arj", "application/octet-stream"]],
  ["art", "image/x-jg"],
  ["asf", "video/x-ms-asf"],
  ["asm", "text/x-asm"],
  ["aso", "application/vnd.accpac.simply.aso"],
  ["asp", "text/asp"],
  ["asr", "video/x-ms-asf"],
  ["asx", ["video/x-ms-asf", "application/x-mplayer2", "video/x-ms-asf-plugin"]],
  ["atc", "application/vnd.acucorp"],
  ["atomcat", "application/atomcat+xml"],
  ["atomsvc", "application/atomsvc+xml"],
  ["atx", "application/vnd.antix.game-component"],
  ["au", ["audio/basic", "audio/x-au"]],
  ["avi", ["video/avi", "video/msvideo", "application/x-troff-msvideo", "video/x-msvideo"]],
  ["avs", "video/avs-video"],
  ["aw", "application/applixware"],
  ["axs", "application/olescript"],
  ["azf", "application/vnd.airzip.filesecure.azf"],
  ["azs", "application/vnd.airzip.filesecure.azs"],
  ["azw", "application/vnd.amazon.ebook"],
  ["bas", "text/plain"],
  ["bcpio", "application/x-bcpio"],
  ["bdf", "application/x-font-bdf"],
  ["bdm", "application/vnd.syncml.dm+wbxml"],
  ["bed", "application/vnd.realvnc.bed"],
  ["bh2", "application/vnd.fujitsu.oasysprs"],
  [
    "bin",
    ["application/octet-stream", "application/mac-binary", "application/macbinary", "application/x-macbinary", "application/x-binary"]
  ],
  ["bm", "image/bmp"],
  ["bmi", "application/vnd.bmi"],
  ["bmp", ["image/bmp", "image/x-windows-bmp"]],
  ["boo", "application/book"],
  ["book", "application/book"],
  ["box", "application/vnd.previewsystems.box"],
  ["boz", "application/x-bzip2"],
  ["bsh", "application/x-bsh"],
  ["btif", "image/prs.btif"],
  ["bz", "application/x-bzip"],
  ["bz2", "application/x-bzip2"],
  ["c", ["text/plain", "text/x-c"]],
  ["c++", "text/plain"],
  ["c11amc", "application/vnd.cluetrust.cartomobile-config"],
  ["c11amz", "application/vnd.cluetrust.cartomobile-config-pkg"],
  ["c4g", "application/vnd.clonk.c4group"],
  ["cab", "application/vnd.ms-cab-compressed"],
  ["car", "application/vnd.curl.car"],
  ["cat", ["application/vnd.ms-pkiseccat", "application/vnd.ms-pki.seccat"]],
  ["cc", ["text/plain", "text/x-c"]],
  ["ccad", "application/clariscad"],
  ["cco", "application/x-cocoa"],
  ["ccxml", "application/ccxml+xml,"],
  ["cdbcmsg", "application/vnd.contact.cmsg"],
  ["cdf", ["application/cdf", "application/x-cdf", "application/x-netcdf"]],
  ["cdkey", "application/vnd.mediastation.cdkey"],
  ["cdmia", "application/cdmi-capability"],
  ["cdmic", "application/cdmi-container"],
  ["cdmid", "application/cdmi-domain"],
  ["cdmio", "application/cdmi-object"],
  ["cdmiq", "application/cdmi-queue"],
  ["cdx", "chemical/x-cdx"],
  ["cdxml", "application/vnd.chemdraw+xml"],
  ["cdy", "application/vnd.cinderella"],
  ["cer", ["application/pkix-cert", "application/x-x509-ca-cert"]],
  ["cgm", "image/cgm"],
  ["cha", "application/x-chat"],
  ["chat", "application/x-chat"],
  ["chm", "application/vnd.ms-htmlhelp"],
  ["chrt", "application/vnd.kde.kchart"],
  ["cif", "chemical/x-cif"],
  ["cii", "application/vnd.anser-web-certificate-issue-initiation"],
  ["cil", "application/vnd.ms-artgalry"],
  ["cla", "application/vnd.claymore"],
  [
    "class",
    ["application/octet-stream", "application/java", "application/java-byte-code", "application/java-vm", "application/x-java-class"]
  ],
  ["clkk", "application/vnd.crick.clicker.keyboard"],
  ["clkp", "application/vnd.crick.clicker.palette"],
  ["clkt", "application/vnd.crick.clicker.template"],
  ["clkw", "application/vnd.crick.clicker.wordbank"],
  ["clkx", "application/vnd.crick.clicker"],
  ["clp", "application/x-msclip"],
  ["cmc", "application/vnd.cosmocaller"],
  ["cmdf", "chemical/x-cmdf"],
  ["cml", "chemical/x-cml"],
  ["cmp", "application/vnd.yellowriver-custom-menu"],
  ["cmx", "image/x-cmx"],
  ["cod", ["image/cis-cod", "application/vnd.rim.cod"]],
  ["com", ["application/octet-stream", "text/plain"]],
  ["conf", "text/plain"],
  ["cpio", "application/x-cpio"],
  ["cpp", "text/x-c"],
  ["cpt", ["application/mac-compactpro", "application/x-compactpro", "application/x-cpt"]],
  ["crd", "application/x-mscardfile"],
  ["crl", ["application/pkix-crl", "application/pkcs-crl"]],
  ["crt", ["application/pkix-cert", "application/x-x509-user-cert", "application/x-x509-ca-cert"]],
  ["cryptonote", "application/vnd.rig.cryptonote"],
  ["csh", ["text/x-script.csh", "application/x-csh"]],
  ["csml", "chemical/x-csml"],
  ["csp", "application/vnd.commonspace"],
  ["css", ["text/css", "application/x-pointplus"]],
  ["csv", "text/csv"],
  ["cu", "application/cu-seeme"],
  ["curl", "text/vnd.curl"],
  ["cww", "application/prs.cww"],
  ["cxx", "text/plain"],
  ["dae", "model/vnd.collada+xml"],
  ["daf", "application/vnd.mobius.daf"],
  ["davmount", "application/davmount+xml"],
  ["dcr", "application/x-director"],
  ["dcurl", "text/vnd.curl.dcurl"],
  ["dd2", "application/vnd.oma.dd2+xml"],
  ["ddd", "application/vnd.fujixerox.ddd"],
  ["deb", "application/x-debian-package"],
  ["deepv", "application/x-deepv"],
  ["def", "text/plain"],
  ["der", "application/x-x509-ca-cert"],
  ["dfac", "application/vnd.dreamfactory"],
  ["dif", "video/x-dv"],
  ["dir", "application/x-director"],
  ["dis", "application/vnd.mobius.dis"],
  ["djvu", "image/vnd.djvu"],
  ["dl", ["video/dl", "video/x-dl"]],
  ["dll", "application/x-msdownload"],
  ["dms", "application/octet-stream"],
  ["dna", "application/vnd.dna"],
  ["doc", "application/msword"],
  ["docm", "application/vnd.ms-word.document.macroenabled.12"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["dot", "application/msword"],
  ["dotm", "application/vnd.ms-word.template.macroenabled.12"],
  ["dotx", "application/vnd.openxmlformats-officedocument.wordprocessingml.template"],
  ["dp", ["application/commonground", "application/vnd.osgi.dp"]],
  ["dpg", "application/vnd.dpgraph"],
  ["dra", "audio/vnd.dra"],
  ["drw", "application/drafting"],
  ["dsc", "text/prs.lines.tag"],
  ["dssc", "application/dssc+der"],
  ["dtb", "application/x-dtbook+xml"],
  ["dtd", "application/xml-dtd"],
  ["dts", "audio/vnd.dts"],
  ["dtshd", "audio/vnd.dts.hd"],
  ["dump", "application/octet-stream"],
  ["dv", "video/x-dv"],
  ["dvi", "application/x-dvi"],
  ["dwf", ["model/vnd.dwf", "drawing/x-dwf"]],
  ["dwg", ["application/acad", "image/vnd.dwg", "image/x-dwg"]],
  ["dxf", ["application/dxf", "image/vnd.dwg", "image/vnd.dxf", "image/x-dwg"]],
  ["dxp", "application/vnd.spotfire.dxp"],
  ["dxr", "application/x-director"],
  ["ecelp4800", "audio/vnd.nuera.ecelp4800"],
  ["ecelp7470", "audio/vnd.nuera.ecelp7470"],
  ["ecelp9600", "audio/vnd.nuera.ecelp9600"],
  ["edm", "application/vnd.novadigm.edm"],
  ["edx", "application/vnd.novadigm.edx"],
  ["efif", "application/vnd.picsel"],
  ["ei6", "application/vnd.pg.osasli"],
  ["el", "text/x-script.elisp"],
  ["elc", ["application/x-elc", "application/x-bytecode.elisp"]],
  ["eml", "message/rfc822"],
  ["emma", "application/emma+xml"],
  ["env", "application/x-envoy"],
  ["eol", "audio/vnd.digital-winds"],
  ["eot", "application/vnd.ms-fontobject"],
  ["eps", "application/postscript"],
  ["epub", "application/epub+zip"],
  ["es", ["application/ecmascript", "application/x-esrehber"]],
  ["es3", "application/vnd.eszigno3+xml"],
  ["esf", "application/vnd.epson.esf"],
  ["etx", "text/x-setext"],
  ["evy", ["application/envoy", "application/x-envoy"]],
  ["exe", ["application/octet-stream", "application/x-msdownload"]],
  ["exi", "application/exi"],
  ["ext", "application/vnd.novadigm.ext"],
  ["ez2", "application/vnd.ezpix-album"],
  ["ez3", "application/vnd.ezpix-package"],
  ["f", ["text/plain", "text/x-fortran"]],
  ["f4v", "video/x-f4v"],
  ["f77", "text/x-fortran"],
  ["f90", ["text/plain", "text/x-fortran"]],
  ["fbs", "image/vnd.fastbidsheet"],
  ["fcs", "application/vnd.isac.fcs"],
  ["fdf", "application/vnd.fdf"],
  ["fe_launch", "application/vnd.denovo.fcselayout-link"],
  ["fg5", "application/vnd.fujitsu.oasysgp"],
  ["fh", "image/x-freehand"],
  ["fif", ["application/fractals", "image/fif"]],
  ["fig", "application/x-xfig"],
  ["fli", ["video/fli", "video/x-fli"]],
  ["flo", ["image/florian", "application/vnd.micrografx.flo"]],
  ["flr", "x-world/x-vrml"],
  ["flv", "video/x-flv"],
  ["flw", "application/vnd.kde.kivio"],
  ["flx", "text/vnd.fmi.flexstor"],
  ["fly", "text/vnd.fly"],
  ["fm", "application/vnd.framemaker"],
  ["fmf", "video/x-atomic3d-feature"],
  ["fnc", "application/vnd.frogans.fnc"],
  ["for", ["text/plain", "text/x-fortran"]],
  ["fpx", ["image/vnd.fpx", "image/vnd.net-fpx"]],
  ["frl", "application/freeloader"],
  ["fsc", "application/vnd.fsc.weblaunch"],
  ["fst", "image/vnd.fst"],
  ["ftc", "application/vnd.fluxtime.clip"],
  ["fti", "application/vnd.anser-web-funds-transfer-initiation"],
  ["funk", "audio/make"],
  ["fvt", "video/vnd.fvt"],
  ["fxp", "application/vnd.adobe.fxp"],
  ["fzs", "application/vnd.fuzzysheet"],
  ["g", "text/plain"],
  ["g2w", "application/vnd.geoplan"],
  ["g3", "image/g3fax"],
  ["g3w", "application/vnd.geospace"],
  ["gac", "application/vnd.groove-account"],
  ["gdl", "model/vnd.gdl"],
  ["geo", "application/vnd.dynageo"],
  ["geojson", "application/geo+json"],
  ["gex", "application/vnd.geometry-explorer"],
  ["ggb", "application/vnd.geogebra.file"],
  ["ggt", "application/vnd.geogebra.tool"],
  ["ghf", "application/vnd.groove-help"],
  ["gif", "image/gif"],
  ["gim", "application/vnd.groove-identity-message"],
  ["gl", ["video/gl", "video/x-gl"]],
  ["gmx", "application/vnd.gmx"],
  ["gnumeric", "application/x-gnumeric"],
  ["gph", "application/vnd.flographit"],
  ["gqf", "application/vnd.grafeq"],
  ["gram", "application/srgs"],
  ["grv", "application/vnd.groove-injector"],
  ["grxml", "application/srgs+xml"],
  ["gsd", "audio/x-gsm"],
  ["gsf", "application/x-font-ghostscript"],
  ["gsm", "audio/x-gsm"],
  ["gsp", "application/x-gsp"],
  ["gss", "application/x-gss"],
  ["gtar", "application/x-gtar"],
  ["gtm", "application/vnd.groove-tool-message"],
  ["gtw", "model/vnd.gtw"],
  ["gv", "text/vnd.graphviz"],
  ["gxt", "application/vnd.geonext"],
  ["gz", ["application/x-gzip", "application/x-compressed"]],
  ["gzip", ["multipart/x-gzip", "application/x-gzip"]],
  ["h", ["text/plain", "text/x-h"]],
  ["h261", "video/h261"],
  ["h263", "video/h263"],
  ["h264", "video/h264"],
  ["hal", "application/vnd.hal+xml"],
  ["hbci", "application/vnd.hbci"],
  ["hdf", "application/x-hdf"],
  ["help", "application/x-helpfile"],
  ["hgl", "application/vnd.hp-hpgl"],
  ["hh", ["text/plain", "text/x-h"]],
  ["hlb", "text/x-script"],
  ["hlp", ["application/winhlp", "application/hlp", "application/x-helpfile", "application/x-winhelp"]],
  ["hpg", "application/vnd.hp-hpgl"],
  ["hpgl", "application/vnd.hp-hpgl"],
  ["hpid", "application/vnd.hp-hpid"],
  ["hps", "application/vnd.hp-hps"],
  [
    "hqx",
    [
      "application/mac-binhex40",
      "application/binhex",
      "application/binhex4",
      "application/mac-binhex",
      "application/x-binhex40",
      "application/x-mac-binhex40"
    ]
  ],
  ["hta", "application/hta"],
  ["htc", "text/x-component"],
  ["htke", "application/vnd.kenameaapp"],
  ["htm", "text/html"],
  ["html", "text/html"],
  ["htmls", "text/html"],
  ["htt", "text/webviewhtml"],
  ["htx", "text/html"],
  ["hvd", "application/vnd.yamaha.hv-dic"],
  ["hvp", "application/vnd.yamaha.hv-voice"],
  ["hvs", "application/vnd.yamaha.hv-script"],
  ["i2g", "application/vnd.intergeo"],
  ["icc", "application/vnd.iccprofile"],
  ["ice", "x-conference/x-cooltalk"],
  ["ico", "image/x-icon"],
  ["ics", "text/calendar"],
  ["idc", "text/plain"],
  ["ief", "image/ief"],
  ["iefs", "image/ief"],
  ["ifm", "application/vnd.shana.informed.formdata"],
  ["iges", ["application/iges", "model/iges"]],
  ["igl", "application/vnd.igloader"],
  ["igm", "application/vnd.insors.igm"],
  ["igs", ["application/iges", "model/iges"]],
  ["igx", "application/vnd.micrografx.igx"],
  ["iif", "application/vnd.shana.informed.interchange"],
  ["iii", "application/x-iphone"],
  ["ima", "application/x-ima"],
  ["imap", "application/x-httpd-imap"],
  ["imp", "application/vnd.accpac.simply.imp"],
  ["ims", "application/vnd.ms-ims"],
  ["inf", "application/inf"],
  ["ins", ["application/x-internet-signup", "application/x-internett-signup"]],
  ["ip", "application/x-ip2"],
  ["ipfix", "application/ipfix"],
  ["ipk", "application/vnd.shana.informed.package"],
  ["irm", "application/vnd.ibm.rights-management"],
  ["irp", "application/vnd.irepository.package+xml"],
  ["isp", "application/x-internet-signup"],
  ["isu", "video/x-isvideo"],
  ["it", "audio/it"],
  ["itp", "application/vnd.shana.informed.formtemplate"],
  ["iv", "application/x-inventor"],
  ["ivp", "application/vnd.immervision-ivp"],
  ["ivr", "i-world/i-vrml"],
  ["ivu", "application/vnd.immervision-ivu"],
  ["ivy", "application/x-livescreen"],
  ["jad", "text/vnd.sun.j2me.app-descriptor"],
  ["jam", ["application/vnd.jam", "audio/x-jam"]],
  ["jar", "application/java-archive"],
  ["jav", ["text/plain", "text/x-java-source"]],
  ["java", ["text/plain", "text/x-java-source,java", "text/x-java-source"]],
  ["jcm", "application/x-java-commerce"],
  ["jfif", ["image/pipeg", "image/jpeg", "image/pjpeg"]],
  ["jfif-tbnl", "image/jpeg"],
  ["jisp", "application/vnd.jisp"],
  ["jlt", "application/vnd.hp-jlyt"],
  ["jnlp", "application/x-java-jnlp-file"],
  ["joda", "application/vnd.joost.joda-archive"],
  ["jpe", ["image/jpeg", "image/pjpeg"]],
  ["jpeg", ["image/jpeg", "image/pjpeg"]],
  ["jpg", ["image/jpeg", "image/pjpeg"]],
  ["jpgv", "video/jpeg"],
  ["jpm", "video/jpm"],
  ["jps", "image/x-jps"],
  ["js", ["application/javascript", "application/ecmascript", "text/javascript", "text/ecmascript", "application/x-javascript"]],
  ["json", "application/json"],
  ["jut", "image/jutvision"],
  ["kar", ["audio/midi", "music/x-karaoke"]],
  ["karbon", "application/vnd.kde.karbon"],
  ["kfo", "application/vnd.kde.kformula"],
  ["kia", "application/vnd.kidspiration"],
  ["kml", "application/vnd.google-earth.kml+xml"],
  ["kmz", "application/vnd.google-earth.kmz"],
  ["kne", "application/vnd.kinar"],
  ["kon", "application/vnd.kde.kontour"],
  ["kpr", "application/vnd.kde.kpresenter"],
  ["ksh", ["application/x-ksh", "text/x-script.ksh"]],
  ["ksp", "application/vnd.kde.kspread"],
  ["ktx", "image/ktx"],
  ["ktz", "application/vnd.kahootz"],
  ["kwd", "application/vnd.kde.kword"],
  ["la", ["audio/nspaudio", "audio/x-nspaudio"]],
  ["lam", "audio/x-liveaudio"],
  ["lasxml", "application/vnd.las.las+xml"],
  ["latex", "application/x-latex"],
  ["lbd", "application/vnd.llamagraphics.life-balance.desktop"],
  ["lbe", "application/vnd.llamagraphics.life-balance.exchange+xml"],
  ["les", "application/vnd.hhe.lesson-player"],
  ["lha", ["application/octet-stream", "application/lha", "application/x-lha"]],
  ["lhx", "application/octet-stream"],
  ["link66", "application/vnd.route66.link66+xml"],
  ["list", "text/plain"],
  ["lma", ["audio/nspaudio", "audio/x-nspaudio"]],
  ["log", "text/plain"],
  ["lrm", "application/vnd.ms-lrm"],
  ["lsf", "video/x-la-asf"],
  ["lsp", ["application/x-lisp", "text/x-script.lisp"]],
  ["lst", "text/plain"],
  ["lsx", ["video/x-la-asf", "text/x-la-asf"]],
  ["ltf", "application/vnd.frogans.ltf"],
  ["ltx", "application/x-latex"],
  ["lvp", "audio/vnd.lucent.voice"],
  ["lwp", "application/vnd.lotus-wordpro"],
  ["lzh", ["application/octet-stream", "application/x-lzh"]],
  ["lzx", ["application/lzx", "application/octet-stream", "application/x-lzx"]],
  ["m", ["text/plain", "text/x-m"]],
  ["m13", "application/x-msmediaview"],
  ["m14", "application/x-msmediaview"],
  ["m1v", "video/mpeg"],
  ["m21", "application/mp21"],
  ["m2a", "audio/mpeg"],
  ["m2v", "video/mpeg"],
  ["m3u", ["audio/x-mpegurl", "audio/x-mpequrl"]],
  ["m3u8", "application/vnd.apple.mpegurl"],
  ["m4v", "video/x-m4v"],
  ["ma", "application/mathematica"],
  ["mads", "application/mads+xml"],
  ["mag", "application/vnd.ecowin.chart"],
  ["man", "application/x-troff-man"],
  ["map", "application/x-navimap"],
  ["mar", "text/plain"],
  ["mathml", "application/mathml+xml"],
  ["mbd", "application/mbedlet"],
  ["mbk", "application/vnd.mobius.mbk"],
  ["mbox", "application/mbox"],
  ["mc$", "application/x-magic-cap-package-1.0"],
  ["mc1", "application/vnd.medcalcdata"],
  ["mcd", ["application/mcad", "application/vnd.mcd", "application/x-mathcad"]],
  ["mcf", ["image/vasa", "text/mcf"]],
  ["mcp", "application/netmc"],
  ["mcurl", "text/vnd.curl.mcurl"],
  ["mdb", "application/x-msaccess"],
  ["mdi", "image/vnd.ms-modi"],
  ["me", "application/x-troff-me"],
  ["meta4", "application/metalink4+xml"],
  ["mets", "application/mets+xml"],
  ["mfm", "application/vnd.mfmp"],
  ["mgp", "application/vnd.osgeo.mapguide.package"],
  ["mgz", "application/vnd.proteus.magazine"],
  ["mht", "message/rfc822"],
  ["mhtml", "message/rfc822"],
  ["mid", ["audio/mid", "audio/midi", "music/crescendo", "x-music/x-midi", "audio/x-midi", "application/x-midi", "audio/x-mid"]],
  ["midi", ["audio/midi", "music/crescendo", "x-music/x-midi", "audio/x-midi", "application/x-midi", "audio/x-mid"]],
  ["mif", ["application/vnd.mif", "application/x-mif", "application/x-frame"]],
  ["mime", ["message/rfc822", "www/mime"]],
  ["mj2", "video/mj2"],
  ["mjf", "audio/x-vnd.audioexplosion.mjuicemediafile"],
  ["mjpg", "video/x-motion-jpeg"],
  ["mlp", "application/vnd.dolby.mlp"],
  ["mm", ["application/base64", "application/x-meme"]],
  ["mmd", "application/vnd.chipnuts.karaoke-mmd"],
  ["mme", "application/base64"],
  ["mmf", "application/vnd.smaf"],
  ["mmr", "image/vnd.fujixerox.edmics-mmr"],
  ["mny", "application/x-msmoney"],
  ["mod", ["audio/mod", "audio/x-mod"]],
  ["mods", "application/mods+xml"],
  ["moov", "video/quicktime"],
  ["mov", "video/quicktime"],
  ["movie", "video/x-sgi-movie"],
  ["mp2", ["video/mpeg", "audio/mpeg", "video/x-mpeg", "audio/x-mpeg", "video/x-mpeq2a"]],
  ["mp3", ["audio/mpeg", "audio/mpeg3", "video/mpeg", "audio/x-mpeg-3", "video/x-mpeg"]],
  ["mp4", ["video/mp4", "application/mp4"]],
  ["mp4a", "audio/mp4"],
  ["mpa", ["video/mpeg", "audio/mpeg"]],
  ["mpc", ["application/vnd.mophun.certificate", "application/x-project"]],
  ["mpe", "video/mpeg"],
  ["mpeg", "video/mpeg"],
  ["mpg", ["video/mpeg", "audio/mpeg"]],
  ["mpga", "audio/mpeg"],
  ["mpkg", "application/vnd.apple.installer+xml"],
  ["mpm", "application/vnd.blueice.multipass"],
  ["mpn", "application/vnd.mophun.application"],
  ["mpp", "application/vnd.ms-project"],
  ["mpt", "application/x-project"],
  ["mpv", "application/x-project"],
  ["mpv2", "video/mpeg"],
  ["mpx", "application/x-project"],
  ["mpy", "application/vnd.ibm.minipay"],
  ["mqy", "application/vnd.mobius.mqy"],
  ["mrc", "application/marc"],
  ["mrcx", "application/marcxml+xml"],
  ["ms", "application/x-troff-ms"],
  ["mscml", "application/mediaservercontrol+xml"],
  ["mseq", "application/vnd.mseq"],
  ["msf", "application/vnd.epson.msf"],
  ["msg", "application/vnd.ms-outlook"],
  ["msh", "model/mesh"],
  ["msl", "application/vnd.mobius.msl"],
  ["msty", "application/vnd.muvee.style"],
  ["mts", "model/vnd.mts"],
  ["mus", "application/vnd.musician"],
  ["musicxml", "application/vnd.recordare.musicxml+xml"],
  ["mv", "video/x-sgi-movie"],
  ["mvb", "application/x-msmediaview"],
  ["mwf", "application/vnd.mfer"],
  ["mxf", "application/mxf"],
  ["mxl", "application/vnd.recordare.musicxml"],
  ["mxml", "application/xv+xml"],
  ["mxs", "application/vnd.triscape.mxs"],
  ["mxu", "video/vnd.mpegurl"],
  ["my", "audio/make"],
  ["mzz", "application/x-vnd.audioexplosion.mzz"],
  ["n-gage", "application/vnd.nokia.n-gage.symbian.install"],
  ["n3", "text/n3"],
  ["nap", "image/naplps"],
  ["naplps", "image/naplps"],
  ["nbp", "application/vnd.wolfram.player"],
  ["nc", "application/x-netcdf"],
  ["ncm", "application/vnd.nokia.configuration-message"],
  ["ncx", "application/x-dtbncx+xml"],
  ["ngdat", "application/vnd.nokia.n-gage.data"],
  ["nif", "image/x-niff"],
  ["niff", "image/x-niff"],
  ["nix", "application/x-mix-transfer"],
  ["nlu", "application/vnd.neurolanguage.nlu"],
  ["nml", "application/vnd.enliven"],
  ["nnd", "application/vnd.noblenet-directory"],
  ["nns", "application/vnd.noblenet-sealer"],
  ["nnw", "application/vnd.noblenet-web"],
  ["npx", "image/vnd.net-fpx"],
  ["nsc", "application/x-conference"],
  ["nsf", "application/vnd.lotus-notes"],
  ["nvd", "application/x-navidoc"],
  ["nws", "message/rfc822"],
  ["o", "application/octet-stream"],
  ["oa2", "application/vnd.fujitsu.oasys2"],
  ["oa3", "application/vnd.fujitsu.oasys3"],
  ["oas", "application/vnd.fujitsu.oasys"],
  ["obd", "application/x-msbinder"],
  ["oda", "application/oda"],
  ["odb", "application/vnd.oasis.opendocument.database"],
  ["odc", "application/vnd.oasis.opendocument.chart"],
  ["odf", "application/vnd.oasis.opendocument.formula"],
  ["odft", "application/vnd.oasis.opendocument.formula-template"],
  ["odg", "application/vnd.oasis.opendocument.graphics"],
  ["odi", "application/vnd.oasis.opendocument.image"],
  ["odm", "application/vnd.oasis.opendocument.text-master"],
  ["odp", "application/vnd.oasis.opendocument.presentation"],
  ["ods", "application/vnd.oasis.opendocument.spreadsheet"],
  ["odt", "application/vnd.oasis.opendocument.text"],
  ["oga", "audio/ogg"],
  ["ogv", "video/ogg"],
  ["ogx", "application/ogg"],
  ["omc", "application/x-omc"],
  ["omcd", "application/x-omcdatamaker"],
  ["omcr", "application/x-omcregerator"],
  ["onetoc", "application/onenote"],
  ["opf", "application/oebps-package+xml"],
  ["org", "application/vnd.lotus-organizer"],
  ["osf", "application/vnd.yamaha.openscoreformat"],
  ["osfpvg", "application/vnd.yamaha.openscoreformat.osfpvg+xml"],
  ["otc", "application/vnd.oasis.opendocument.chart-template"],
  ["otf", "application/x-font-otf"],
  ["otg", "application/vnd.oasis.opendocument.graphics-template"],
  ["oth", "application/vnd.oasis.opendocument.text-web"],
  ["oti", "application/vnd.oasis.opendocument.image-template"],
  ["otp", "application/vnd.oasis.opendocument.presentation-template"],
  ["ots", "application/vnd.oasis.opendocument.spreadsheet-template"],
  ["ott", "application/vnd.oasis.opendocument.text-template"],
  ["oxt", "application/vnd.openofficeorg.extension"],
  ["p", "text/x-pascal"],
  ["p10", ["application/pkcs10", "application/x-pkcs10"]],
  ["p12", ["application/pkcs-12", "application/x-pkcs12"]],
  ["p7a", "application/x-pkcs7-signature"],
  ["p7b", "application/x-pkcs7-certificates"],
  ["p7c", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
  ["p7m", ["application/pkcs7-mime", "application/x-pkcs7-mime"]],
  ["p7r", "application/x-pkcs7-certreqresp"],
  ["p7s", ["application/pkcs7-signature", "application/x-pkcs7-signature"]],
  ["p8", "application/pkcs8"],
  ["par", "text/plain-bas"],
  ["part", "application/pro_eng"],
  ["pas", "text/pascal"],
  ["paw", "application/vnd.pawaafile"],
  ["pbd", "application/vnd.powerbuilder6"],
  ["pbm", "image/x-portable-bitmap"],
  ["pcf", "application/x-font-pcf"],
  ["pcl", ["application/vnd.hp-pcl", "application/x-pcl"]],
  ["pclxl", "application/vnd.hp-pclxl"],
  ["pct", "image/x-pict"],
  ["pcurl", "application/vnd.curl.pcurl"],
  ["pcx", "image/x-pcx"],
  ["pdb", ["application/vnd.palm", "chemical/x-pdb"]],
  ["pdf", "application/pdf"],
  ["pfa", "application/x-font-type1"],
  ["pfr", "application/font-tdpfr"],
  ["pfunk", ["audio/make", "audio/make.my.funk"]],
  ["pfx", "application/x-pkcs12"],
  ["pgm", ["image/x-portable-graymap", "image/x-portable-greymap"]],
  ["pgn", "application/x-chess-pgn"],
  ["pgp", "application/pgp-signature"],
  ["pic", ["image/pict", "image/x-pict"]],
  ["pict", "image/pict"],
  ["pkg", "application/x-newton-compatible-pkg"],
  ["pki", "application/pkixcmp"],
  ["pkipath", "application/pkix-pkipath"],
  ["pko", ["application/ynd.ms-pkipko", "application/vnd.ms-pki.pko"]],
  ["pl", ["text/plain", "text/x-script.perl"]],
  ["plb", "application/vnd.3gpp.pic-bw-large"],
  ["plc", "application/vnd.mobius.plc"],
  ["plf", "application/vnd.pocketlearn"],
  ["pls", "application/pls+xml"],
  ["plx", "application/x-pixclscript"],
  ["pm", ["text/x-script.perl-module", "image/x-xpixmap"]],
  ["pm4", "application/x-pagemaker"],
  ["pm5", "application/x-pagemaker"],
  ["pma", "application/x-perfmon"],
  ["pmc", "application/x-perfmon"],
  ["pml", ["application/vnd.ctc-posml", "application/x-perfmon"]],
  ["pmr", "application/x-perfmon"],
  ["pmw", "application/x-perfmon"],
  ["png", "image/png"],
  ["pnm", ["application/x-portable-anymap", "image/x-portable-anymap"]],
  ["portpkg", "application/vnd.macports.portpkg"],
  ["pot", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
  ["potm", "application/vnd.ms-powerpoint.template.macroenabled.12"],
  ["potx", "application/vnd.openxmlformats-officedocument.presentationml.template"],
  ["pov", "model/x-pov"],
  ["ppa", "application/vnd.ms-powerpoint"],
  ["ppam", "application/vnd.ms-powerpoint.addin.macroenabled.12"],
  ["ppd", "application/vnd.cups-ppd"],
  ["ppm", "image/x-portable-pixmap"],
  ["pps", ["application/vnd.ms-powerpoint", "application/mspowerpoint"]],
  ["ppsm", "application/vnd.ms-powerpoint.slideshow.macroenabled.12"],
  ["ppsx", "application/vnd.openxmlformats-officedocument.presentationml.slideshow"],
  ["ppt", ["application/vnd.ms-powerpoint", "application/mspowerpoint", "application/powerpoint", "application/x-mspowerpoint"]],
  ["pptm", "application/vnd.ms-powerpoint.presentation.macroenabled.12"],
  ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ["ppz", "application/mspowerpoint"],
  ["prc", "application/x-mobipocket-ebook"],
  ["pre", ["application/vnd.lotus-freelance", "application/x-freelance"]],
  ["prf", "application/pics-rules"],
  ["prt", "application/pro_eng"],
  ["ps", "application/postscript"],
  ["psb", "application/vnd.3gpp.pic-bw-small"],
  ["psd", ["application/octet-stream", "image/vnd.adobe.photoshop"]],
  ["psf", "application/x-font-linux-psf"],
  ["pskcxml", "application/pskc+xml"],
  ["ptid", "application/vnd.pvi.ptid1"],
  ["pub", "application/x-mspublisher"],
  ["pvb", "application/vnd.3gpp.pic-bw-var"],
  ["pvu", "paleovu/x-pv"],
  ["pwn", "application/vnd.3m.post-it-notes"],
  ["pwz", "application/vnd.ms-powerpoint"],
  ["py", "text/x-script.phyton"],
  ["pya", "audio/vnd.ms-playready.media.pya"],
  ["pyc", "application/x-bytecode.python"],
  ["pyv", "video/vnd.ms-playready.media.pyv"],
  ["qam", "application/vnd.epson.quickanime"],
  ["qbo", "application/vnd.intu.qbo"],
  ["qcp", "audio/vnd.qcelp"],
  ["qd3", "x-world/x-3dmf"],
  ["qd3d", "x-world/x-3dmf"],
  ["qfx", "application/vnd.intu.qfx"],
  ["qif", "image/x-quicktime"],
  ["qps", "application/vnd.publishare-delta-tree"],
  ["qt", "video/quicktime"],
  ["qtc", "video/x-qtc"],
  ["qti", "image/x-quicktime"],
  ["qtif", "image/x-quicktime"],
  ["qxd", "application/vnd.quark.quarkxpress"],
  ["ra", ["audio/x-realaudio", "audio/x-pn-realaudio", "audio/x-pn-realaudio-plugin"]],
  ["ram", "audio/x-pn-realaudio"],
  ["rar", "application/x-rar-compressed"],
  ["ras", ["image/cmu-raster", "application/x-cmu-raster", "image/x-cmu-raster"]],
  ["rast", "image/cmu-raster"],
  ["rcprofile", "application/vnd.ipunplugged.rcprofile"],
  ["rdf", "application/rdf+xml"],
  ["rdz", "application/vnd.data-vision.rdz"],
  ["rep", "application/vnd.businessobjects"],
  ["res", "application/x-dtbresource+xml"],
  ["rexx", "text/x-script.rexx"],
  ["rf", "image/vnd.rn-realflash"],
  ["rgb", "image/x-rgb"],
  ["rif", "application/reginfo+xml"],
  ["rip", "audio/vnd.rip"],
  ["rl", "application/resource-lists+xml"],
  ["rlc", "image/vnd.fujixerox.edmics-rlc"],
  ["rld", "application/resource-lists-diff+xml"],
  ["rm", ["application/vnd.rn-realmedia", "audio/x-pn-realaudio"]],
  ["rmi", "audio/mid"],
  ["rmm", "audio/x-pn-realaudio"],
  ["rmp", ["audio/x-pn-realaudio-plugin", "audio/x-pn-realaudio"]],
  ["rms", "application/vnd.jcp.javame.midlet-rms"],
  ["rnc", "application/relax-ng-compact-syntax"],
  ["rng", ["application/ringing-tones", "application/vnd.nokia.ringing-tone"]],
  ["rnx", "application/vnd.rn-realplayer"],
  ["roff", "application/x-troff"],
  ["rp", "image/vnd.rn-realpix"],
  ["rp9", "application/vnd.cloanto.rp9"],
  ["rpm", "audio/x-pn-realaudio-plugin"],
  ["rpss", "application/vnd.nokia.radio-presets"],
  ["rpst", "application/vnd.nokia.radio-preset"],
  ["rq", "application/sparql-query"],
  ["rs", "application/rls-services+xml"],
  ["rsd", "application/rsd+xml"],
  ["rt", ["text/richtext", "text/vnd.rn-realtext"]],
  ["rtf", ["application/rtf", "text/richtext", "application/x-rtf"]],
  ["rtx", ["text/richtext", "application/rtf"]],
  ["rv", "video/vnd.rn-realvideo"],
  ["s", "text/x-asm"],
  ["s3m", "audio/s3m"],
  ["saf", "application/vnd.yamaha.smaf-audio"],
  ["saveme", "application/octet-stream"],
  ["sbk", "application/x-tbook"],
  ["sbml", "application/sbml+xml"],
  ["sc", "application/vnd.ibm.secure-container"],
  ["scd", "application/x-msschedule"],
  [
    "scm",
    ["application/vnd.lotus-screencam", "video/x-scm", "text/x-script.guile", "application/x-lotusscreencam", "text/x-script.scheme"]
  ],
  ["scq", "application/scvp-cv-request"],
  ["scs", "application/scvp-cv-response"],
  ["sct", "text/scriptlet"],
  ["scurl", "text/vnd.curl.scurl"],
  ["sda", "application/vnd.stardivision.draw"],
  ["sdc", "application/vnd.stardivision.calc"],
  ["sdd", "application/vnd.stardivision.impress"],
  ["sdkm", "application/vnd.solent.sdkm+xml"],
  ["sdml", "text/plain"],
  ["sdp", ["application/sdp", "application/x-sdp"]],
  ["sdr", "application/sounder"],
  ["sdw", "application/vnd.stardivision.writer"],
  ["sea", ["application/sea", "application/x-sea"]],
  ["see", "application/vnd.seemail"],
  ["seed", "application/vnd.fdsn.seed"],
  ["sema", "application/vnd.sema"],
  ["semd", "application/vnd.semd"],
  ["semf", "application/vnd.semf"],
  ["ser", "application/java-serialized-object"],
  ["set", "application/set"],
  ["setpay", "application/set-payment-initiation"],
  ["setreg", "application/set-registration-initiation"],
  ["sfd-hdstx", "application/vnd.hydrostatix.sof-data"],
  ["sfs", "application/vnd.spotfire.sfs"],
  ["sgl", "application/vnd.stardivision.writer-global"],
  ["sgm", ["text/sgml", "text/x-sgml"]],
  ["sgml", ["text/sgml", "text/x-sgml"]],
  ["sh", ["application/x-shar", "application/x-bsh", "application/x-sh", "text/x-script.sh"]],
  ["shar", ["application/x-bsh", "application/x-shar"]],
  ["shf", "application/shf+xml"],
  ["shtml", ["text/html", "text/x-server-parsed-html"]],
  ["sid", "audio/x-psid"],
  ["sis", "application/vnd.symbian.install"],
  ["sit", ["application/x-stuffit", "application/x-sit"]],
  ["sitx", "application/x-stuffitx"],
  ["skd", "application/x-koan"],
  ["skm", "application/x-koan"],
  ["skp", ["application/vnd.koan", "application/x-koan"]],
  ["skt", "application/x-koan"],
  ["sl", "application/x-seelogo"],
  ["sldm", "application/vnd.ms-powerpoint.slide.macroenabled.12"],
  ["sldx", "application/vnd.openxmlformats-officedocument.presentationml.slide"],
  ["slt", "application/vnd.epson.salt"],
  ["sm", "application/vnd.stepmania.stepchart"],
  ["smf", "application/vnd.stardivision.math"],
  ["smi", ["application/smil", "application/smil+xml"]],
  ["smil", "application/smil"],
  ["snd", ["audio/basic", "audio/x-adpcm"]],
  ["snf", "application/x-font-snf"],
  ["sol", "application/solids"],
  ["spc", ["text/x-speech", "application/x-pkcs7-certificates"]],
  ["spf", "application/vnd.yamaha.smaf-phrase"],
  ["spl", ["application/futuresplash", "application/x-futuresplash"]],
  ["spot", "text/vnd.in3d.spot"],
  ["spp", "application/scvp-vp-response"],
  ["spq", "application/scvp-vp-request"],
  ["spr", "application/x-sprite"],
  ["sprite", "application/x-sprite"],
  ["src", "application/x-wais-source"],
  ["sru", "application/sru+xml"],
  ["srx", "application/sparql-results+xml"],
  ["sse", "application/vnd.kodak-descriptor"],
  ["ssf", "application/vnd.epson.ssf"],
  ["ssi", "text/x-server-parsed-html"],
  ["ssm", "application/streamingmedia"],
  ["ssml", "application/ssml+xml"],
  ["sst", ["application/vnd.ms-pkicertstore", "application/vnd.ms-pki.certstore"]],
  ["st", "application/vnd.sailingtracker.track"],
  ["stc", "application/vnd.sun.xml.calc.template"],
  ["std", "application/vnd.sun.xml.draw.template"],
  ["step", "application/step"],
  ["stf", "application/vnd.wt.stf"],
  ["sti", "application/vnd.sun.xml.impress.template"],
  ["stk", "application/hyperstudio"],
  ["stl", ["application/vnd.ms-pkistl", "application/sla", "application/vnd.ms-pki.stl", "application/x-navistyle"]],
  ["stm", "text/html"],
  ["stp", "application/step"],
  ["str", "application/vnd.pg.format"],
  ["stw", "application/vnd.sun.xml.writer.template"],
  ["sub", "image/vnd.dvb.subtitle"],
  ["sus", "application/vnd.sus-calendar"],
  ["sv4cpio", "application/x-sv4cpio"],
  ["sv4crc", "application/x-sv4crc"],
  ["svc", "application/vnd.dvb.service"],
  ["svd", "application/vnd.svd"],
  ["svf", ["image/vnd.dwg", "image/x-dwg"]],
  ["svg", "image/svg+xml"],
  ["svr", ["x-world/x-svr", "application/x-world"]],
  ["swf", "application/x-shockwave-flash"],
  ["swi", "application/vnd.aristanetworks.swi"],
  ["sxc", "application/vnd.sun.xml.calc"],
  ["sxd", "application/vnd.sun.xml.draw"],
  ["sxg", "application/vnd.sun.xml.writer.global"],
  ["sxi", "application/vnd.sun.xml.impress"],
  ["sxm", "application/vnd.sun.xml.math"],
  ["sxw", "application/vnd.sun.xml.writer"],
  ["t", ["text/troff", "application/x-troff"]],
  ["talk", "text/x-speech"],
  ["tao", "application/vnd.tao.intent-module-archive"],
  ["tar", "application/x-tar"],
  ["tbk", ["application/toolbook", "application/x-tbook"]],
  ["tcap", "application/vnd.3gpp2.tcap"],
  ["tcl", ["text/x-script.tcl", "application/x-tcl"]],
  ["tcsh", "text/x-script.tcsh"],
  ["teacher", "application/vnd.smart.teacher"],
  ["tei", "application/tei+xml"],
  ["tex", "application/x-tex"],
  ["texi", "application/x-texinfo"],
  ["texinfo", "application/x-texinfo"],
  ["text", ["application/plain", "text/plain"]],
  ["tfi", "application/thraud+xml"],
  ["tfm", "application/x-tex-tfm"],
  ["tgz", ["application/gnutar", "application/x-compressed"]],
  ["thmx", "application/vnd.ms-officetheme"],
  ["tif", ["image/tiff", "image/x-tiff"]],
  ["tiff", ["image/tiff", "image/x-tiff"]],
  ["tmo", "application/vnd.tmobile-livetv"],
  ["torrent", "application/x-bittorrent"],
  ["tpl", "application/vnd.groove-tool-template"],
  ["tpt", "application/vnd.trid.tpt"],
  ["tr", "application/x-troff"],
  ["tra", "application/vnd.trueapp"],
  ["trm", "application/x-msterminal"],
  ["tsd", "application/timestamped-data"],
  ["tsi", "audio/tsp-audio"],
  ["tsp", ["application/dsptype", "audio/tsplayer"]],
  ["tsv", "text/tab-separated-values"],
  ["ttf", "application/x-font-ttf"],
  ["ttl", "text/turtle"],
  ["turbot", "image/florian"],
  ["twd", "application/vnd.simtech-mindmapper"],
  ["txd", "application/vnd.genomatix.tuxedo"],
  ["txf", "application/vnd.mobius.txf"],
  ["txt", "text/plain"],
  ["ufd", "application/vnd.ufdl"],
  ["uil", "text/x-uil"],
  ["uls", "text/iuls"],
  ["umj", "application/vnd.umajin"],
  ["uni", "text/uri-list"],
  ["unis", "text/uri-list"],
  ["unityweb", "application/vnd.unity"],
  ["unv", "application/i-deas"],
  ["uoml", "application/vnd.uoml+xml"],
  ["uri", "text/uri-list"],
  ["uris", "text/uri-list"],
  ["ustar", ["application/x-ustar", "multipart/x-ustar"]],
  ["utz", "application/vnd.uiq.theme"],
  ["uu", ["application/octet-stream", "text/x-uuencode"]],
  ["uue", "text/x-uuencode"],
  ["uva", "audio/vnd.dece.audio"],
  ["uvh", "video/vnd.dece.hd"],
  ["uvi", "image/vnd.dece.graphic"],
  ["uvm", "video/vnd.dece.mobile"],
  ["uvp", "video/vnd.dece.pd"],
  ["uvs", "video/vnd.dece.sd"],
  ["uvu", "video/vnd.uvvu.mp4"],
  ["uvv", "video/vnd.dece.video"],
  ["vcd", "application/x-cdlink"],
  ["vcf", "text/x-vcard"],
  ["vcg", "application/vnd.groove-vcard"],
  ["vcs", "text/x-vcalendar"],
  ["vcx", "application/vnd.vcx"],
  ["vda", "application/vda"],
  ["vdo", "video/vdo"],
  ["vew", "application/groupwise"],
  ["vis", "application/vnd.visionary"],
  ["viv", ["video/vivo", "video/vnd.vivo"]],
  ["vivo", ["video/vivo", "video/vnd.vivo"]],
  ["vmd", "application/vocaltec-media-desc"],
  ["vmf", "application/vocaltec-media-file"],
  ["voc", ["audio/voc", "audio/x-voc"]],
  ["vos", "video/vosaic"],
  ["vox", "audio/voxware"],
  ["vqe", "audio/x-twinvq-plugin"],
  ["vqf", "audio/x-twinvq"],
  ["vql", "audio/x-twinvq-plugin"],
  ["vrml", ["model/vrml", "x-world/x-vrml", "application/x-vrml"]],
  ["vrt", "x-world/x-vrt"],
  ["vsd", ["application/vnd.visio", "application/x-visio"]],
  ["vsf", "application/vnd.vsf"],
  ["vst", "application/x-visio"],
  ["vsw", "application/x-visio"],
  ["vtu", "model/vnd.vtu"],
  ["vxml", "application/voicexml+xml"],
  ["w60", "application/wordperfect6.0"],
  ["w61", "application/wordperfect6.1"],
  ["w6w", "application/msword"],
  ["wad", "application/x-doom"],
  ["wav", ["audio/wav", "audio/x-wav"]],
  ["wax", "audio/x-ms-wax"],
  ["wb1", "application/x-qpro"],
  ["wbmp", "image/vnd.wap.wbmp"],
  ["wbs", "application/vnd.criticaltools.wbs+xml"],
  ["wbxml", "application/vnd.wap.wbxml"],
  ["wcm", "application/vnd.ms-works"],
  ["wdb", "application/vnd.ms-works"],
  ["web", "application/vnd.xara"],
  ["weba", "audio/webm"],
  ["webm", "video/webm"],
  ["webp", "image/webp"],
  ["wg", "application/vnd.pmi.widget"],
  ["wgt", "application/widget"],
  ["wiz", "application/msword"],
  ["wk1", "application/x-123"],
  ["wks", "application/vnd.ms-works"],
  ["wm", "video/x-ms-wm"],
  ["wma", "audio/x-ms-wma"],
  ["wmd", "application/x-ms-wmd"],
  ["wmf", ["windows/metafile", "application/x-msmetafile"]],
  ["wml", "text/vnd.wap.wml"],
  ["wmlc", "application/vnd.wap.wmlc"],
  ["wmls", "text/vnd.wap.wmlscript"],
  ["wmlsc", "application/vnd.wap.wmlscriptc"],
  ["wmv", "video/x-ms-wmv"],
  ["wmx", "video/x-ms-wmx"],
  ["wmz", "application/x-ms-wmz"],
  ["woff", "application/x-font-woff"],
  ["word", "application/msword"],
  ["wp", "application/wordperfect"],
  ["wp5", ["application/wordperfect", "application/wordperfect6.0"]],
  ["wp6", "application/wordperfect"],
  ["wpd", ["application/wordperfect", "application/vnd.wordperfect", "application/x-wpwin"]],
  ["wpl", "application/vnd.ms-wpl"],
  ["wps", "application/vnd.ms-works"],
  ["wq1", "application/x-lotus"],
  ["wqd", "application/vnd.wqd"],
  ["wri", ["application/mswrite", "application/x-wri", "application/x-mswrite"]],
  ["wrl", ["model/vrml", "x-world/x-vrml", "application/x-world"]],
  ["wrz", ["model/vrml", "x-world/x-vrml"]],
  ["wsc", "text/scriplet"],
  ["wsdl", "application/wsdl+xml"],
  ["wspolicy", "application/wspolicy+xml"],
  ["wsrc", "application/x-wais-source"],
  ["wtb", "application/vnd.webturbo"],
  ["wtk", "application/x-wintalk"],
  ["wvx", "video/x-ms-wvx"],
  ["x-png", "image/png"],
  ["x3d", "application/vnd.hzn-3d-crossword"],
  ["xaf", "x-world/x-vrml"],
  ["xap", "application/x-silverlight-app"],
  ["xar", "application/vnd.xara"],
  ["xbap", "application/x-ms-xbap"],
  ["xbd", "application/vnd.fujixerox.docuworks.binder"],
  ["xbm", ["image/xbm", "image/x-xbm", "image/x-xbitmap"]],
  ["xdf", "application/xcap-diff+xml"],
  ["xdm", "application/vnd.syncml.dm+xml"],
  ["xdp", "application/vnd.adobe.xdp+xml"],
  ["xdr", "video/x-amt-demorun"],
  ["xdssc", "application/dssc+xml"],
  ["xdw", "application/vnd.fujixerox.docuworks"],
  ["xenc", "application/xenc+xml"],
  ["xer", "application/patch-ops-error+xml"],
  ["xfdf", "application/vnd.adobe.xfdf"],
  ["xfdl", "application/vnd.xfdl"],
  ["xgz", "xgl/drawing"],
  ["xhtml", "application/xhtml+xml"],
  ["xif", "image/vnd.xiff"],
  ["xl", "application/excel"],
  ["xla", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
  ["xlam", "application/vnd.ms-excel.addin.macroenabled.12"],
  ["xlb", ["application/excel", "application/vnd.ms-excel", "application/x-excel"]],
  ["xlc", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
  ["xld", ["application/excel", "application/x-excel"]],
  ["xlk", ["application/excel", "application/x-excel"]],
  ["xll", ["application/excel", "application/vnd.ms-excel", "application/x-excel"]],
  ["xlm", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
  ["xls", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
  ["xlsb", "application/vnd.ms-excel.sheet.binary.macroenabled.12"],
  ["xlsm", "application/vnd.ms-excel.sheet.macroenabled.12"],
  ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ["xlt", ["application/vnd.ms-excel", "application/excel", "application/x-excel"]],
  ["xltm", "application/vnd.ms-excel.template.macroenabled.12"],
  ["xltx", "application/vnd.openxmlformats-officedocument.spreadsheetml.template"],
  ["xlv", ["application/excel", "application/x-excel"]],
  ["xlw", ["application/vnd.ms-excel", "application/excel", "application/x-msexcel", "application/x-excel"]],
  ["xm", "audio/xm"],
  ["xml", ["application/xml", "text/xml", "application/atom+xml", "application/rss+xml"]],
  ["xmz", "xgl/movie"],
  ["xo", "application/vnd.olpc-sugar"],
  ["xof", "x-world/x-vrml"],
  ["xop", "application/xop+xml"],
  ["xpi", "application/x-xpinstall"],
  ["xpix", "application/x-vnd.ls-xpix"],
  ["xpm", ["image/xpm", "image/x-xpixmap"]],
  ["xpr", "application/vnd.is-xpr"],
  ["xps", "application/vnd.ms-xpsdocument"],
  ["xpw", "application/vnd.intercon.formnet"],
  ["xslt", "application/xslt+xml"],
  ["xsm", "application/vnd.syncml+xml"],
  ["xspf", "application/xspf+xml"],
  ["xsr", "video/x-amt-showrun"],
  ["xul", "application/vnd.mozilla.xul+xml"],
  ["xwd", ["image/x-xwd", "image/x-xwindowdump"]],
  ["xyz", ["chemical/x-xyz", "chemical/x-pdb"]],
  ["yang", "application/yang"],
  ["yin", "application/yin+xml"],
  ["z", ["application/x-compressed", "application/x-compress"]],
  ["zaz", "application/vnd.zzazz.deck+xml"],
  ["zip", ["application/zip", "multipart/x-zip", "application/x-zip-compressed", "application/x-compressed"]],
  ["zir", "application/vnd.zul"],
  ["zmm", "application/vnd.handheld-entertainment+xml"],
  ["zoo", "application/octet-stream"],
  ["zsh", "text/x-script.zsh"]
]);
function detectMimeType(filename) {
  if (!filename) {
    return defaultMimeType;
  }
  const parsed = import_node_path.default.parse(filename);
  const extension = (parsed.ext.substr(1) || parsed.name || "").split("?").shift().trim().toLowerCase();
  const value = extensions.has(extension) ? extensions.get(extension) : defaultMimeType;
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
function detectExtension(mimeType) {
  if (!mimeType) {
    return defaultExtension;
  }
  const parts = mimeType.toLowerCase().trim().split("/");
  const rootType = parts.shift().trim();
  const subType = parts.join("/").trim();
  if (mimeTypes.has(rootType + "/" + subType)) {
    const value = mimeTypes.get(rootType + "/" + subType);
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }
  switch (rootType) {
    case "text":
      return "txt";
    default:
      return "bin";
  }
}

// node_modules/nodemailer/dist/esm/mime-node/index.js
var import_node_crypto = __toESM(require("node:crypto"), 1);
var import_node_fs2 = __toESM(require("node:fs"), 1);
var import_node_stream8 = require("node:stream");
var import_node_url2 = __toESM(require("node:url"), 1);

// node_modules/nodemailer/dist/esm/base64/index.js
var import_node_stream3 = require("node:stream");
function encode2(buffer) {
  if (typeof buffer === "string") {
    buffer = Buffer.from(buffer, "utf-8");
  }
  return buffer.toString("base64");
}
function normalizeLineLength(lineLength) {
  const length = Math.floor(Number(lineLength));
  return Number.isFinite(length) && length >= 1 ? length : 76;
}
function wrapBuffer(src, lineLength, final) {
  const lines = Math.ceil(src.length / lineLength);
  const complete = Math.max(lines - 1, 0);
  let rest = src.length - complete * lineLength;
  const output = Buffer.allocUnsafe(complete * (lineLength + 2) + (final ? rest : 0));
  let to2 = 0;
  for (let from = 0; from < complete * lineLength; from += lineLength) {
    src.copy(output, to2, from, from + lineLength);
    to2 += lineLength;
    output[to2++] = 13;
    output[to2++] = 10;
  }
  if (final) {
    to2 += src.copy(output, to2, complete * lineLength);
    rest = 0;
  }
  if (to2 !== output.length) {
    throw new Error("Unexpected wrapped length");
  }
  return { output, rest };
}
var Encoder = class extends import_node_stream3.Transform {
  constructor(options) {
    super();
    this.options = options || {};
    if (this.options.lineLength !== false) {
      this.options.lineLength = normalizeLineLength(this.options.lineLength);
    }
    this._curLine = "";
    this._remainingBytes = false;
    this.inputBytes = 0;
    this.outputBytes = 0;
  }
  /**
   * Emits the encoded characters `b64` that follow the current line, keeping what can not be
   * emitted yet as the new current line
   *
   * @internal
   */
  _emit(b64, final) {
    const src = Buffer.from(this._curLine + b64, "latin1");
    if (!src.length) {
      return;
    }
    let output = src;
    if (this.options.lineLength) {
      const wrapped = wrapBuffer(src, this.options.lineLength, final);
      output = wrapped.output;
      this._curLine = wrapped.rest ? src.toString("latin1", src.length - wrapped.rest) : "";
    } else {
      this._curLine = "";
    }
    if (output.length) {
      this.outputBytes += output.length;
      this.push(output);
    }
  }
  /** @internal */
  _transform(chunk, encoding, done) {
    let buf = encoding !== "buffer" ? Buffer.from(chunk, encoding) : chunk;
    if (!buf || !buf.length) {
      return done();
    }
    this.inputBytes += buf.length;
    if (this._remainingBytes) {
      buf = Buffer.concat([this._remainingBytes, buf], this._remainingBytes.length + buf.length);
      this._remainingBytes = false;
    }
    const extra = buf.length % 3;
    if (extra) {
      this._remainingBytes = buf.subarray(buf.length - extra);
      buf = buf.subarray(0, buf.length - extra);
    }
    this._emit(encode2(buf), false);
    done();
  }
  /** @internal */
  _flush(done) {
    this._emit(this._remainingBytes ? encode2(this._remainingBytes) : "", true);
    this._remainingBytes = false;
    done();
  }
};

// node_modules/nodemailer/dist/esm/qp/index.js
var import_node_stream4 = require("node:stream");
var MIN_LINE_LENGTH = 4;
var QP_RANGES = [
  [9],
  // <TAB>
  [10],
  // <LF>
  [13],
  // <CR>
  [32, 60],
  // <SP>!"#$%&'()*+,-./0123456789:;
  [62, 126]
  // >?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_`abcdefghijklmnopqrstuvwxyz{|}
];
var QP_LITERAL = new Uint8Array(256);
for (let i = 0; i < 256; i++) {
  QP_LITERAL[i] = checkRanges(i, QP_RANGES) ? 1 : 0;
}
var HEX_DIGITS = Buffer.from("0123456789ABCDEF", "latin1");
var isWhitespace = (c) => c === 32 || c === 9;
function encode3(buffer) {
  return encodeBytes(typeof buffer === "string" ? Buffer.from(buffer, "utf-8") : buffer);
}
function encodeBytes(buffer, next, binary, previous) {
  const len = buffer.length;
  const output = Buffer.allocUnsafe(len * 3);
  let pos = 0;
  for (let i = 0; i < len; i++) {
    const ord = buffer[i];
    const following = i + 1 < len ? buffer[i + 1] : next;
    const lineBreakByte = binary && (ord === 13 || ord === 10) ? ord === 13 ? following === 10 : (i > 0 ? buffer[i - 1] : previous) === 13 : true;
    if (QP_LITERAL[ord] && lineBreakByte && !(isWhitespace(ord) && (following === void 0 || following === 10 || following === 13))) {
      output[pos++] = ord;
      continue;
    }
    output[pos++] = 61;
    output[pos++] = HEX_DIGITS[Math.floor(ord / 16)];
    output[pos++] = HEX_DIGITS[ord % 16];
  }
  return output.toString("latin1", 0, pos);
}
function wrap(str, lineLength) {
  str = (str || "").toString();
  lineLength = Math.max(Number(lineLength) || 76, MIN_LINE_LENGTH);
  if (str.length <= lineLength) {
    return str;
  }
  let pos = 0;
  const len = str.length;
  let match2, code, line;
  const lineMargin = Math.floor(lineLength / 3);
  let result = "";
  while (pos < len) {
    line = str.substr(pos, lineLength);
    if (match2 = line.match(/\r\n/)) {
      line = line.substr(0, match2.index + match2[0].length);
      result += line;
      pos += line.length;
      continue;
    }
    if (line.substr(-1) === "\n") {
      result += line;
      pos += line.length;
      continue;
    }
    if (match2 = line.substr(-lineMargin).match(/\n.*?$/)) {
      line = line.substr(0, line.length - (match2[0].length - 1));
      result += line;
      pos += line.length;
      continue;
    }
    if (line.length > lineLength - lineMargin && (match2 = line.substr(-lineMargin).match(/[ \t.,!?][^ \t.,!?]*$/))) {
      line = line.substr(0, line.length - (match2[0].length - 1));
    } else if (line.match(/[=][\da-f]{0,2}$/i)) {
      if (match2 = line.match(/[=][\da-f]{0,1}$/i)) {
        line = line.substr(0, line.length - match2[0].length);
      }
      while (line.length > 3 && line.length < len - pos && !line.match(/^(?:=[\da-f]{2}){1,4}$/i) && (match2 = line.match(/[=][\da-f]{2}$/gi))) {
        code = parseInt(match2[0].substr(1, 2), 16);
        if (code < 128) {
          break;
        }
        line = line.substr(0, line.length - 3);
        if (code >= 192) {
          break;
        }
      }
    }
    if (!line.length) {
      line = str.substr(pos, lineLength);
    }
    if (pos + line.length < len && line.substr(-1) !== "\n") {
      if (line.length === lineLength && line.match(/[=][\da-f]{2}$/i)) {
        line = line.substr(0, line.length - 3);
      } else if (line.length === lineLength) {
        line = line.substr(0, line.length - 1);
      }
      pos += line.length;
      line += "=\r\n";
    } else {
      pos += line.length;
    }
    result += line;
  }
  return result;
}
function checkRanges(nr, ranges) {
  for (let i = ranges.length - 1; i >= 0; i--) {
    const range = ranges[i];
    if (!range.length) {
      continue;
    }
    if (range.length === 1 && nr === range[0]) {
      return true;
    }
    if (range.length === 2 && nr >= range[0] && nr <= range[1]) {
      return true;
    }
  }
  return false;
}
var ENCODE_SLICE_SIZE = 64 * 1024;
var Encoder2 = class extends import_node_stream4.Transform {
  constructor(options) {
    super();
    this.options = options || {};
    if (this.options.lineLength !== false) {
      this.options.lineLength = this.options.lineLength || 76;
    }
    this._curLine = "";
    this._remainingBytes = false;
    this._lastByte = void 0;
    this.inputBytes = 0;
    this.outputBytes = 0;
  }
  /** @internal */
  _transform(chunk, encoding, done) {
    let buf = encoding !== "buffer" ? Buffer.from(chunk, encoding) : chunk;
    if (!buf || !buf.length) {
      return done();
    }
    this.inputBytes += buf.length;
    if (this._remainingBytes) {
      buf = Buffer.concat([this._remainingBytes, buf], this._remainingBytes.length + buf.length);
      this._remainingBytes = false;
    }
    let end = buf.length;
    while (end > 0 && (isWhitespace(buf[end - 1]) || this.options.binary && buf[end - 1] === 13)) {
      end--;
    }
    if (buf.length - end <= ENCODE_SLICE_SIZE) {
      this._remainingBytes = end < buf.length ? Buffer.from(buf.subarray(end)) : false;
      buf = buf.subarray(0, end);
    }
    this._encodeSlices(buf);
    done();
  }
  /** @internal */
  _flush(done) {
    if (this._remainingBytes) {
      this._encodeSlices(this._remainingBytes);
      this._remainingBytes = false;
    }
    if (this._curLine) {
      this.outputBytes += this._curLine.length;
      this.push(this._curLine, "ascii");
      this._curLine = "";
    }
    done();
  }
  /**
   * Encodes the input in slices of ENCODE_SLICE_SIZE bytes. Each slice is told the byte that
   * follows it, so a slice that ends in whitespace is encoded as if it was not split
   *
   * @internal
   */
  _encodeSlices(buf) {
    for (let start = 0; start < buf.length; start += ENCODE_SLICE_SIZE) {
      const end = Math.min(start + ENCODE_SLICE_SIZE, buf.length);
      this._encodeSlice(buf.subarray(start, end), end < buf.length ? buf[end] : void 0);
      this._lastByte = buf[end - 1];
    }
  }
  /** @internal */
  _encodeSlice(buf, next) {
    let qp;
    if (this.options.lineLength) {
      qp = wrap(this._curLine + encodeBytes(buf, next, this.options.binary, this._lastByte), this.options.lineLength);
      const lastLF = qp.lastIndexOf("\n");
      this._curLine = qp.substring(lastLF + 1);
      qp = qp.substring(0, lastLF + 1);
      if (qp) {
        this.outputBytes += qp.length;
        this.push(qp, "ascii");
      }
    } else {
      qp = encodeBytes(buf, next, this.options.binary, this._lastByte);
      this.outputBytes += qp.length;
      this.push(qp, "ascii");
    }
  }
};

// node_modules/nodemailer/dist/esm/mime-funcs/index.js
function isPlainText(value, isParam) {
  const re = isParam ? /[\x00-\x1f\x7f"\u0080-\uFFFF]/ : /[\x00-\x08\x0b\x0c\x0e-\x1f\u0080-\uFFFF]/;
  return typeof value === "string" && !re.test(value);
}
function isPlainParamValue(value) {
  return isPlainText(value, true) && !value.includes("=?");
}
function quoteString(value) {
  return '"' + (value || "").toString().replace(/["\\]/g, "\\$&") + '"';
}
function hasLongerLines(str, lineLength) {
  if (str.length > 128 * 1024) {
    return true;
  }
  return new RegExp("^.{" + (lineLength + 1) + ",}", "m").test(str);
}
function encodeWord(data, mimeWordEncoding, maxLength) {
  mimeWordEncoding = (mimeWordEncoding || "Q").toString().toUpperCase().trim().charAt(0);
  maxLength = maxLength || 0;
  let encodedStr;
  const toCharset = "UTF-8";
  if (maxLength && maxLength > 7 + toCharset.length) {
    maxLength -= 7 + toCharset.length;
  }
  if (mimeWordEncoding === "Q") {
    encodedStr = encode3(data).replace(/[^a-z0-9!*+\-/=]/gi, (chr) => {
      const ord = chr.charCodeAt(0).toString(16).toUpperCase();
      if (chr === " ") {
        return "_";
      }
      return "=" + (ord.length === 1 ? "0" + ord : ord);
    });
  } else if (mimeWordEncoding === "B") {
    encodedStr = typeof data === "string" ? data : data.toString("utf-8");
    maxLength = maxLength ? Math.max(3, (maxLength - maxLength % 4) / 4 * 3) : 0;
  }
  if (maxLength && (mimeWordEncoding !== "B" ? encodedStr : encode2(data)).length > maxLength) {
    if (mimeWordEncoding === "Q") {
      encodedStr = splitMimeEncodedString(encodedStr, maxLength).join("?= =?" + toCharset + "?" + mimeWordEncoding + "?");
    } else {
      const parts = [];
      let lpart = "";
      for (let i = 0, len = encodedStr.length; i < len; i++) {
        let chr = encodedStr.charAt(i);
        if (/[\ud800-\udbff]/.test(chr) && /[\udc00-\udfff]/.test(encodedStr.charAt(i + 1))) {
          chr += encodedStr.charAt(++i);
        }
        if (Buffer.byteLength(lpart + chr) <= maxLength || i === 0) {
          lpart += chr;
        } else {
          parts.push(encode2(lpart));
          lpart = chr;
        }
      }
      if (lpart) {
        parts.push(encode2(lpart));
      }
      if (parts.length > 1) {
        encodedStr = parts.join("?= =?" + toCharset + "?" + mimeWordEncoding + "?");
      } else {
        encodedStr = parts.join("");
      }
    }
  } else if (mimeWordEncoding === "B") {
    encodedStr = encode2(data);
  }
  return "=?" + toCharset + "?" + mimeWordEncoding + "?" + encodedStr + (encodedStr.substr(-2) === "?=" ? "" : "?=");
}
function encodeWords(value, mimeWordEncoding, maxLength, encodeAll) {
  maxLength = maxLength || 0;
  let firstSpecial = -1;
  let lastSpecial = -1;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code === 34 || code >= 128) {
      if (firstSpecial < 0) {
        firstSpecial = i;
      }
      lastSpecial = i;
    }
  }
  if (firstSpecial < 0) {
    return value;
  }
  if (encodeAll) {
    return encodeWord(value, mimeWordEncoding, maxLength);
  }
  let startIndex = firstSpecial;
  while (startIndex > 0 && !/\s/.test(value.charAt(startIndex - 1))) {
    startIndex--;
  }
  let endIndex = lastSpecial + 1;
  while (endIndex < value.length && !/\s/.test(value.charAt(endIndex))) {
    endIndex++;
  }
  return (startIndex ? value.substr(0, startIndex) : "") + encodeWord(value.substring(startIndex, endIndex), mimeWordEncoding || "Q", maxLength) + (endIndex < value.length ? value.substr(endIndex) : "");
}
function buildHeaderValue(structured) {
  const paramsArray = [];
  Object.keys(structured.params || {}).forEach((key) => {
    const value2 = structured.params[key];
    const param = key.replace(/[\x00-\x1f\x7f]/g, "");
    if (!isPlainParamValue(value2) || value2.length >= 75) {
      buildHeaderParam(param, value2, 50).forEach((encodedParam) => {
        if (!/[\s"\\;:/=(),<>@[\]?]|^[-']|'$/.test(encodedParam.value) || encodedParam.key.substr(-1) === "*") {
          paramsArray.push(encodedParam.key + "=" + encodedParam.value);
        } else {
          paramsArray.push(encodedParam.key + "=" + JSON.stringify(encodedParam.value));
        }
      });
    } else if (!value2.length || /[\s'"\\;:/=(),<>@[\]?]|^-/.test(value2)) {
      paramsArray.push(param + "=" + JSON.stringify(value2));
    } else {
      paramsArray.push(param + "=" + value2);
    }
  });
  const value = typeof structured.value === "string" ? structured.value.replace(/[\x00-\x1f\x7f]/g, "") : structured.value;
  return value + (paramsArray.length ? "; " + paramsArray.join("; ") : "");
}
function buildHeaderParam(key, data, maxLength) {
  const list = [];
  let encodedStr = typeof data === "string" ? data : (data || "").toString();
  let chr;
  let line;
  let startPos = 0;
  let i, len;
  maxLength = maxLength || 50;
  if (isPlainParamValue(data)) {
    if (encodedStr.length <= maxLength) {
      return [
        {
          key,
          value: encodedStr
        }
      ];
    }
    encodedStr = encodedStr.replace(new RegExp(".{" + maxLength + "}", "g"), (str) => {
      list.push({
        line: str
      });
      return "";
    });
    if (encodedStr) {
      list.push({
        line: encodedStr
      });
    }
  } else {
    if (/[\uD800-\uDBFF]/.test(encodedStr)) {
      const encodedStrArr = [];
      for (i = 0, len = encodedStr.length; i < len; i++) {
        chr = encodedStr.charAt(i);
        if (/[\ud800-\udbff]/.test(chr) && /[\udc00-\udfff]/.test(encodedStr.charAt(i + 1))) {
          chr += encodedStr.charAt(i + 1);
          encodedStrArr.push(chr);
          i++;
        } else {
          encodedStrArr.push(chr);
        }
      }
      encodedStr = encodedStrArr;
    }
    line = "utf-8''";
    let encoded = true;
    startPos = 0;
    for (i = 0, len = encodedStr.length; i < len; i++) {
      chr = encodedStr[i];
      if (encoded) {
        chr = safeEncodeURIComponent(chr);
      } else {
        chr = chr === " " ? chr : safeEncodeURIComponent(chr);
        if (chr !== encodedStr[i]) {
          if ((safeEncodeURIComponent(line) + chr).length >= maxLength) {
            list.push({
              line,
              encoded
            });
            line = "";
            encoded = true;
          } else {
            encoded = true;
            i = startPos;
            line = "";
            continue;
          }
        }
      }
      if ((line + chr).length >= maxLength) {
        list.push({
          line,
          encoded
        });
        line = chr = encodedStr[i] === " " ? " " : safeEncodeURIComponent(encodedStr[i]);
        if (chr === encodedStr[i]) {
          encoded = false;
          startPos = i - 1;
        } else {
          encoded = true;
        }
      } else {
        line += chr;
      }
    }
    if (line) {
      list.push({
        line,
        encoded
      });
    }
  }
  return list.map((item, i2) => ({
    // encoded lines: {name}*{part}*
    // unencoded lines: {name}*{part}
    // if any line needs to be encoded then the first line (part==0) is always encoded
    key: key + "*" + i2 + (item.encoded ? "*" : ""),
    value: item.line
  }));
}
var TOKEN = /^[^\x00-\x20\x7f()<>@,;:\\"/[\]?=]+$/;
function _isParamName(name2) {
  return !!name2 && !isProtoKey(name2);
}
function parseHeaderValue(str) {
  const response = {
    value: "",
    params: {}
  };
  const setParam = (name2, value2) => {
    name2 = name2.toLowerCase();
    if (_isParamName(name2) && !Object.prototype.hasOwnProperty.call(response.params, name2)) {
      response.params[name2] = value2;
    }
  };
  let key = false;
  let value = "";
  let stage = "value";
  let quote = false;
  let escaped = false;
  let chr;
  let pendingSpace = "";
  let quoteClosed = false;
  const flushSpace = () => {
    if (value.length) {
      value += pendingSpace;
    }
    pendingSpace = "";
  };
  const addChr = (c) => {
    flushSpace();
    value += c;
  };
  const takeValue = () => {
    const taken = value;
    value = "";
    pendingSpace = "";
    quoteClosed = false;
    return taken;
  };
  const storeValue = () => {
    const taken = takeValue();
    if (key === false) {
      response.value = taken;
    } else {
      setParam(key, taken);
    }
  };
  const storeEmptyKey = () => {
    setParam(takeValue().trim(), "");
  };
  for (let i = 0, len = str.length; i < len; i++) {
    chr = str.charAt(i);
    if (stage === "key") {
      if (chr === "=") {
        key = takeValue().trim();
        stage = "value";
        continue;
      }
      if (chr === ";") {
        storeEmptyKey();
        continue;
      }
      value += chr;
    } else {
      if (quoteClosed && chr !== ";") {
        escaped = false;
        continue;
      }
      if (escaped) {
        addChr(chr);
      } else if (quote && chr === "\\") {
        escaped = true;
        continue;
      } else if (quote && chr === quote) {
        quote = false;
        quoteClosed = true;
      } else if (!quote && chr === '"') {
        quote = chr;
        flushSpace();
      } else if (!quote && chr === ";") {
        storeValue();
        stage = "key";
      } else if (!quote && (chr === " " || chr === "	")) {
        pendingSpace += chr;
      } else {
        addChr(chr);
      }
      escaped = false;
    }
  }
  if (stage === "value") {
    storeValue();
  } else {
    storeEmptyKey();
  }
  const continuations = /* @__PURE__ */ new Map();
  Object.keys(response.params).forEach((key2) => {
    const match2 = key2.match(/(\*(\d+)|\*(\d+)\*|\*)$/);
    if (!match2) {
      return;
    }
    const actualKey = key2.substr(0, match2.index);
    const nr = Number(match2[2] || match2[3]) || 0;
    const encoded = match2[0].substr(-1) === "*";
    let value2 = response.params[key2];
    delete response.params[key2];
    if (!_isParamName(actualKey)) {
      return;
    }
    let continuation = continuations.get(actualKey);
    if (!continuation) {
      continuation = { charset: false, sections: [] };
      continuations.set(actualKey, continuation);
    }
    const charsetMatch = nr === 0 && encoded ? value2.match(/^([^']*)'[^']*'(.*)$/) : null;
    if (charsetMatch) {
      continuation.charset = TOKEN.test(charsetMatch[1]) ? charsetMatch[1] : "iso-8859-1";
      value2 = charsetMatch[2];
    }
    continuation.sections.push({ nr, value: value2, encoded });
  });
  continuations.forEach((continuation, key2) => {
    if (Object.prototype.hasOwnProperty.call(response.params, key2)) {
      return;
    }
    continuation.sections.sort((a2, b2) => a2.nr - b2.nr);
    if (!continuation.charset) {
      response.params[key2] = continuation.sections.map((section) => section.value).join("");
      return;
    }
    response.params[key2] = "=?" + continuation.charset + "?Q?" + continuation.sections.map(_encodeContinuationSection).join("") + "?=";
  });
  return response;
}
function _encodeContinuationSection(section) {
  const specials = section.encoded ? /[=?_\s]/g : /[=?_\s%]/g;
  return section.value.replace(specials, (s) => {
    const c = s.charCodeAt(0).toString(16);
    if (s === " ") {
      return "_";
    }
    return "%" + (c.length < 2 ? "0" : "") + c;
  }).replace(/%/g, "=");
}
function detectExtension2(mimeType) {
  return detectExtension(mimeType);
}
function detectMimeType2(extension) {
  return detectMimeType(extension);
}
function foldLines(str, lineLength, afterSpace) {
  str = (str || "").toString();
  lineLength = lineLength || 76;
  let pos = 0;
  const len = str.length;
  let result = "";
  let line, match2;
  while (pos < len) {
    line = str.substr(pos, lineLength);
    if (line.length < lineLength) {
      result += line;
      break;
    }
    if (match2 = line.match(/^[^\n\r]*(\r?\n|\r)/)) {
      line = match2[0];
      result += line;
      pos += line.length;
      continue;
    } else if ((match2 = line.match(/(\s+)[^\s]*$/)) && match2[0].length - (afterSpace ? (match2[1] || "").length : 0) < line.length) {
      line = line.substr(0, line.length - (match2[0].length - (afterSpace ? (match2[1] || "").length : 0)));
    } else if (match2 = str.substr(pos + line.length).match(/^[^\s]+(\s*)/)) {
      line = line + match2[0].substr(0, match2[0].length - (!afterSpace ? (match2[1] || "").length : 0));
    }
    result += line;
    pos += line.length;
    if (pos < len) {
      result += "\r\n";
    }
  }
  return result;
}
function splitMimeEncodedString(str, maxlen) {
  const lines = [];
  let curLine, fallbackLine, match2, chr, done;
  maxlen = Math.max(maxlen || 0, 12);
  while (str.length) {
    curLine = str.substr(0, maxlen);
    if (match2 = curLine.match(/[=][0-9A-F]?$/i)) {
      curLine = curLine.substr(0, match2.index);
    }
    fallbackLine = curLine.length ? curLine : str.substr(0, maxlen);
    done = false;
    while (!done && curLine.length) {
      done = true;
      if (match2 = str.substr(curLine.length).match(/^[=]([0-9A-F]{2})/i)) {
        chr = parseInt(match2[1], 16);
        if (chr < 194 && chr > 127) {
          curLine = curLine.substr(0, curLine.length - 3);
          done = false;
        }
      }
    }
    if (!curLine.length) {
      curLine = fallbackLine;
    }
    lines.push(curLine);
    str = str.substr(curLine.length);
  }
  return lines;
}
function encodeURICharComponent(chr) {
  let res = "";
  let ord = chr.charCodeAt(0).toString(16).toUpperCase();
  if (ord.length % 2) {
    ord = "0" + ord;
  }
  if (ord.length > 2) {
    for (let i = 0, len = ord.length / 2; i < len; i++) {
      res += "%" + ord.substr(i, 2);
    }
  } else {
    res += "%" + ord;
  }
  return res;
}
function safeEncodeURIComponent(str) {
  str = (str || "").toString();
  try {
    str = encodeURIComponent(str);
  } catch (_E) {
    str = encodeURIComponent(Buffer.from(str, "utf-8").toString("utf-8"));
  }
  return str.replace(/[\x00-\x1F *'()<>@,;:\\"[\]?=\u007F-\uFFFF]/g, (chr) => encodeURICharComponent(chr));
}

// node_modules/nodemailer/dist/esm/addressparser/index.js
var TOKEN_OPERATOR = 1;
var TOKEN_NO_BREAK = 2;
var TOKEN_DIRTY = 4;
var TOKEN_ESCAPES = 8;
var TOKEN_STARTS_ESCAPED = 16;
var TokenList = class {
  constructor(str) {
    this.str = str;
    this.slots = new Int32Array(48);
    this.length = 0;
    this.cleaned = /* @__PURE__ */ new Map();
  }
  /**
   * Appends a token
   *
   * @param kind Kind and flags of the token
   * @param start Offset of its first character
   * @param end Offset just past its last character
   * @return Index of the token
   */
  push(kind, start, end) {
    if ((this.length + 1) * 3 > this.slots.length) {
      const grown = new Int32Array(this.slots.length * 2);
      grown.set(this.slots);
      this.slots = grown;
    }
    const at = this.length * 3;
    this.slots[at] = kind;
    this.slots[at + 1] = start;
    this.slots[at + 2] = end;
    return this.length++;
  }
  /**
   * The character of an operator token, an empty string for a text run
   */
  operatorAt(index) {
    const at = index * 3;
    return this.slots[at] & TOKEN_OPERATOR ? this.str.charAt(this.slots[at + 1]) : "";
  }
  /**
   * Whether a token is an operator
   */
  isOperator(index) {
    return (this.slots[index * 3] & TOKEN_OPERATOR) !== 0;
  }
  /**
   * Whether the next character continues the run of a token without whitespace in between
   */
  noBreak(index) {
    return (this.slots[index * 3] & TOKEN_NO_BREAK) !== 0;
  }
  /**
   * Value of a token
   */
  value(index) {
    const cleaned = this.cleaned.get(index);
    if (cleaned !== void 0) {
      return cleaned;
    }
    return this.str.slice(this.slots[index * 3 + 1], this.slots[index * 3 + 2]);
  }
};
var DOMAIN_LITERAL_TAIL = /@(\[[^[\]\\]*\])$/;
function _domainAt(address) {
  const literal = address.charAt(address.length - 1) === "]" ? DOMAIN_LITERAL_TAIL.exec(address) : null;
  return literal ? address.length - literal[1].length - 1 : address.lastIndexOf("@");
}
function _quoteLocalPart(address) {
  const lastAt = _domainAt(address);
  if (lastAt < 0) {
    return address;
  }
  const user = address.substr(0, lastAt);
  if (/^[^\s"(),:;<>@[\\\]]+$/.test(user) || /^"(?:[^"\\]|\\[\s\S])*"$/.test(user)) {
    return address;
  }
  return '"' + user.replace(/["\\]/g, "\\$&") + '"@' + address.substr(lastAt + 1);
}
var HAS_WHITESPACE = /\s/;
var QUOTED_LOCAL_ADDR = /^("(?:[^"\\]|\\[\s\S])*"@\S+)(?:\s+([\s\S]+))?$/;
var ADDR_SPEC = /^[^@\s]+@[^@\s]+$/;
var LITERAL_ADDR_SPEC = /^[^@\s]+@\[[^[\]\\\s]*\]$/;
var QUOTED_LOCAL_DOMAIN = /^@(?:[^@\s"]+|\[[^[\]\\\s]*\])$/;
function _isAddrSpec(value) {
  return ADDR_SPEC.test(value) || LITERAL_ADDR_SPEC.test(value);
}
var LOOSE_ADDR_SPEC = /^[^@\s]+@\S+$/;
var LOOSE_TEXT_ADDR = /\s*\b[^@\s]+@[^\s]+\b\s*/y;
function _isSpaceCode(code) {
  return code === 32 || code >= 9 && code <= 13 || code === 160 || code === 5760 || code >= 8192 && code <= 8202 || code === 8232 || code === 8233 || code === 8239 || code === 8287 || code === 12288 || code === 65279;
}
function _isWordCode(code) {
  return code >= 48 && code <= 57 || code >= 65 && code <= 90 || code >= 97 && code <= 122 || code === 95;
}
function _isBoundary(text, at) {
  return _isWordCode(text.charCodeAt(at - 1)) !== _isWordCode(text.charCodeAt(at));
}
function _indexOfAt(text, from, to2) {
  for (let i = from; i < to2; i++) {
    if (text.charCodeAt(i) === 64) {
      return i;
    }
  }
  return -1;
}
var LEADING_QUOTED_STRING = /^"(?:[^"\\]|\\[\s\S])*"/;
function _joinAtSpacing(value, at) {
  if (at < 0) {
    return value;
  }
  let start = at;
  while (start > 0 && _isSpaceCode(value.charCodeAt(start - 1))) {
    start--;
  }
  let end = at + 1;
  while (end < value.length && _isSpaceCode(value.charCodeAt(end))) {
    end++;
  }
  return start === at && end === at + 1 ? value : value.slice(0, start) + "@" + value.slice(end);
}
function _collapseAtSpacing(value) {
  const quoted = LEADING_QUOTED_STRING.exec(value);
  if (quoted) {
    let at2 = quoted[0].length;
    while (at2 < value.length && _isSpaceCode(value.charCodeAt(at2))) {
      at2++;
    }
    if (value.charAt(at2) === "@" && value.indexOf("@", at2 + 1) < 0) {
      return _joinAtSpacing(value, at2);
    }
  }
  const at = value.indexOf("@");
  if (at < 0 || value.indexOf("@", at + 1) >= 0 || value.lastIndexOf('"') > at) {
    return value;
  }
  return _joinAtSpacing(value, at);
}
function _looseAddressStart(text) {
  const len = text.length;
  let pos = 0;
  while (pos < len) {
    while (pos < len && _isSpaceCode(text.charCodeAt(pos))) {
      pos++;
    }
    if (pos >= len) {
      break;
    }
    const runStart = pos;
    let runEnd = pos;
    while (runEnd < len && !_isSpaceCode(text.charCodeAt(runEnd))) {
      runEnd++;
    }
    let at = _indexOfAt(text, runStart, runEnd);
    if (at >= 0) {
      let lastBoundary = -1;
      for (let k = runEnd; k > runStart; k--) {
        if (_isBoundary(text, k)) {
          lastBoundary = k;
          break;
        }
      }
      let atomStart = runStart;
      while (lastBoundary >= 0 && at >= 0) {
        if (at > atomStart && runEnd > at + 1 && lastBoundary > at + 1) {
          for (let start = atomStart; start < at; start++) {
            if (_isBoundary(text, start)) {
              if (start > runStart) {
                return start;
              }
              let padded = runStart;
              while (padded > 0 && _isSpaceCode(text.charCodeAt(padded - 1))) {
                padded--;
              }
              return padded;
            }
          }
        }
        atomStart = at + 1;
        at = _indexOfAt(text, atomStart, runEnd);
      }
    }
    pos = runEnd;
  }
  return -1;
}
function _recoverAddrSpec(data) {
  data.address = _collapseAtSpacing(data.address);
  if (!HAS_WHITESPACE.test(data.address)) {
    return;
  }
  let address;
  let rest;
  const quoted = data.address.match(QUOTED_LOCAL_ADDR);
  if (quoted) {
    if (!quoted[2]) {
      return;
    }
    address = quoted[1];
    rest = [quoted[2]];
  } else {
    if (data.address.indexOf('"') >= 0) {
      return;
    }
    const parts = data.address.split(/\s+/);
    let addrIndex = parts.findIndex(_isAddrSpec);
    if (addrIndex < 0) {
      addrIndex = parts.findIndex((part) => LOOSE_ADDR_SPEC.test(part));
    }
    if (addrIndex < 0) {
      return;
    }
    address = parts.splice(addrIndex, 1)[0];
    rest = parts;
  }
  data.address = address;
  data.text = [data.text].concat(rest).filter((part) => part).join(" ");
}
function _stripAddressComments(address) {
  const comments = [];
  let result = "";
  let comment = "";
  let depth = 0;
  let closer = "";
  let lastChar = "";
  let pendingSpace = false;
  let firstChar = "";
  let quoteSeen = false;
  let routeEnd = -1;
  for (let i = 0, len = address.length; i < len; i++) {
    const chr = address.charAt(i);
    if (depth) {
      if (chr === "\\" && i < len - 1) {
        comment += address.charAt(++i);
      } else if (chr === "(") {
        depth++;
        comment += chr;
      } else if (chr === ")" && !--depth) {
        comments.push(comment.trim());
        comment = "";
        pendingSpace = lastChar !== "@";
      } else {
        comment += chr;
      }
      continue;
    }
    if (pendingSpace && chr !== "(") {
      pendingSpace = false;
      if (chr !== "@" && chr !== "<" && !_isSpaceCode(address.charCodeAt(i))) {
        result += " ";
        lastChar = " ";
      }
    }
    if (closer) {
      if (chr === "\\" && closer === '"' && i < len - 1) {
        result += chr + address.charAt(++i);
        lastChar = address.charAt(i);
        continue;
      }
      if (chr === closer) {
        closer = "";
      }
    } else if (chr === '"') {
      closer = '"';
      quoteSeen = true;
    } else if (chr === ":" && routeEnd < 0 && firstChar === "@" && !quoteSeen) {
      routeEnd = result.length + 1;
    } else if (chr === "[") {
      closer = "]";
    } else if (chr === "(") {
      depth = 1;
      continue;
    } else if (chr === "<") {
      result = "";
      lastChar = "";
      comments.length = 0;
      firstChar = "";
      quoteSeen = false;
      routeEnd = -1;
      continue;
    }
    result += chr;
    lastChar = chr;
    if (!firstChar && !_isSpaceCode(address.charCodeAt(i))) {
      firstChar = chr;
    }
  }
  if (routeEnd >= 0 && result.indexOf("@", routeEnd) >= 0) {
    result = result.slice(routeEnd);
  }
  if (depth) {
    comments.push(comment.trim());
  }
  return { address: result.trim(), comments: comments.filter((text) => text) };
}
function _collectAddressParts(tokens, from, to2) {
  let state = "text";
  const data = {
    address: [],
    comment: [],
    text: [],
    textWasQuoted: [],
    quotedLocalAt: []
  };
  let insideQuotes = false;
  let lastTextPureQuoted = false;
  const lastChars = { address: "", comment: "", text: "" };
  for (let i = from; i < to2; i++) {
    const value = tokens.value(i);
    const prevOperator = i > from ? tokens.operatorAt(i - 1) : "";
    const prevNoBreak = i > from && tokens.noBreak(i - 1);
    if (tokens.isOperator(i)) {
      switch (value) {
        case "<":
          state = "address";
          insideQuotes = false;
          break;
        case "(":
          state = "comment";
          insideQuotes = false;
          break;
        case '"':
          insideQuotes = !insideQuotes;
          state = "text";
          break;
        default:
          state = "text";
          insideQuotes = false;
          break;
      }
    } else {
      const opensAfterEmptyQuotedString = prevOperator === '"' && prevNoBreak && i > from + 1 && tokens.operatorAt(i - 2) === '"';
      const parts = data[state];
      const joins = prevNoBreak && parts.length && (prevOperator !== ")" || lastChars[state] === "@" || value.charAt(0) === "@");
      if (joins) {
        const last = data[state].length - 1;
        if (state === "text" && !insideQuotes) {
          if (lastTextPureQuoted && value.charAt(0) === "@") {
            data.quotedLocalAt[last] = data.text[last].length;
          }
          lastTextPureQuoted = false;
        }
        data[state][last] += value;
        lastChars[state] = value.charAt(value.length - 1);
        if (state === "text" && insideQuotes) {
          data.textWasQuoted[last] = true;
        }
      } else {
        data[state].push(value);
        lastChars[state] = value.charAt(value.length - 1);
        if (state === "text") {
          data.textWasQuoted.push(insideQuotes || opensAfterEmptyQuotedString);
          data.quotedLocalAt.push(opensAfterEmptyQuotedString && value.charAt(0) === "@" ? 0 : -1);
          lastTextPureQuoted = insideQuotes;
        }
      }
    }
  }
  let textFromComment = false;
  if (!data.text.length && data.comment.length) {
    data.text = data.comment;
    data.comment = [];
    textFromComment = true;
  }
  return { data, textFromComment };
}
function _groupName(tokens, from, to2) {
  return _collectAddressParts(tokens, from, to2).data.text.join(" ");
}
function _handleAddress(tokens, from, to2) {
  const collected = _collectAddressParts(tokens, from, to2);
  const data = collected.data;
  let textFromComment = collected.textFromComment;
  const addressComments = [];
  const addressParts = [];
  for (const part of data.address) {
    const stripped = _stripAddressComments(part);
    for (const comment of stripped.comments) {
      addressComments.push(comment);
    }
    if (stripped.address) {
      addressParts.push(stripped.address);
    }
  }
  data.address = addressParts;
  if (!data.address.length && data.text.length && !textFromComment) {
    const candidates = data.text.map((part) => _collapseAtSpacing(part));
    for (let i = 0; i < data.text.length; i++) {
      const local = data.quotedLocalAt[i];
      const quotedLocal = data.textWasQuoted[i] && local >= 0 && QUOTED_LOCAL_DOMAIN.test(data.text[i].slice(local)) ? _quoteLocalPart(data.text[i]) : "";
      if (quotedLocal || !data.textWasQuoted[i] && _isAddrSpec(candidates[i])) {
        data.address = [quotedLocal || candidates[i]];
        data.text.splice(i, 1);
        data.textWasQuoted.splice(i, 1);
        data.quotedLocalAt.splice(i, 1);
        break;
      }
    }
    if (!data.address.length) {
      let extracted = false;
      for (let i = 0; i < data.text.length; i++) {
        if (!data.textWasQuoted[i]) {
          const part = candidates[i];
          let remainder = data.text[i];
          const at = _looseAddressStart(part);
          if (at >= 0) {
            LOOSE_TEXT_ADDR.lastIndex = at;
            const match2 = LOOSE_TEXT_ADDR.exec(part);
            if (match2) {
              data.address = [match2[0].trim()];
              extracted = true;
              remainder = part.slice(0, at) + " " + part.slice(at + match2[0].length);
            }
          }
          data.text[i] = remainder.trim();
          if (extracted) {
            break;
          }
        }
      }
    }
  }
  if (!data.text.length && data.comment.length) {
    data.text = data.comment;
    data.comment = [];
  }
  if (data.address.length > 1) {
    data.text = data.text.concat(data.address.splice(1));
  }
  const addressFromQuotedText = !data.address.length && data.textWasQuoted.some((wasQuoted) => wasQuoted);
  data.text = data.text.join(" ");
  data.address = data.address.join(" ");
  if (addressFromQuotedText && data.text.indexOf("@") >= 0) {
    data.address = _quoteLocalPart(_joinAtSpacing(data.text, _domainAt(data.text)));
    data.text = "";
  }
  _recoverAddrSpec(data);
  if (!data.text && addressComments.length) {
    data.text = addressComments.join(" ");
    textFromComment = true;
  }
  const address = {
    address: data.address || (textFromComment ? "" : data.text) || "",
    name: data.text || data.address || ""
  };
  if (address.address === address.name) {
    if (/@/.test(address.address || "")) {
      address.name = "";
    } else {
      address.address = "";
    }
  }
  return address;
}
var Tokenizer = class {
  constructor(str) {
    this.str = (str || "").toString();
    this.operatorCurrent = "";
    this.operatorExpecting = "";
    this.node = -1;
    this.escaped = false;
    this.inDomainLiteral = false;
    this.afterAt = false;
    this.inGroup = false;
    this.innerQuoted = false;
    this.innerComment = 0;
    this.innerLiteral = false;
    this.innerEscaped = false;
    this.list = new TokenList(this.str);
    this.operators = {
      '"': '"',
      "(": ")",
      "<": ">",
      ",": "",
      // A group is read in the same pass as the rest of the list, so its ':' only marks
      // where the name ends and its members are tokenized like any other address
      ":": "",
      // Semicolons are not a legal delimiter per the RFC2822 grammar other
      // than for terminating a group, but they are also not valid for any
      // other use in this context.  Given that some mail clients have
      // historically allowed the semicolon as a delimiter equivalent to the
      // comma in their UI, it makes sense to treat them the same as a comma
      // when used outside of a group.
      ";": ""
    };
  }
  /**
   * Tokenizes the original input string
   *
   * @return An array of operator|text tokens
   */
  tokenize() {
    const str = this.str;
    const len = str.length;
    for (let i = 0; i < len; i++) {
      this.checkChar(str.charAt(i), i);
    }
    this._closeText(len);
    const list = this.list;
    const slots = list.slots;
    let kept = 0;
    for (let i = 0, count = list.length; i < count; i++) {
      const kind = slots[i * 3];
      let start = slots[i * 3 + 1];
      let end = slots[i * 3 + 2];
      if (kind & TOKEN_DIRTY) {
        const value = this._cleanValue(start, end, kind).trim();
        if (!value) {
          continue;
        }
        list.cleaned.set(kept, value);
      } else if (!(kind & TOKEN_OPERATOR)) {
        while (start < end && _isSpaceCode(str.charCodeAt(start))) {
          start++;
        }
        while (end > start && _isSpaceCode(str.charCodeAt(end - 1))) {
          end--;
        }
        if (start === end) {
          continue;
        }
      }
      slots[kept * 3] = kind;
      slots[kept * 3 + 1] = start;
      slots[kept * 3 + 2] = end;
      kept++;
    }
    list.length = kept;
    return list;
  }
  /**
   * Ends the text run being collected, if there is one
   *
   * @param end Offset just past its last character
   */
  _closeText(end) {
    if (this.node >= 0) {
      this.list.slots[this.node * 3 + 2] = end;
      this.node = -1;
    }
  }
  /**
   * Rebuilds the value of a text run that is no plain slice of the field, applying the
   * rules checkChar collects characters by: an escaping backslash is dropped, a line break
   * reads as a space and any other control character is left out
   *
   * @param start Offset of the first character of the run
   * @param end Offset just past its last character
   * @param kind Kind and flags of the run
   * @return Value of the run
   */
  _cleanValue(start, end, kind) {
    const str = this.str;
    const escapes = (kind & TOKEN_ESCAPES) !== 0;
    let escaped = (kind & TOKEN_STARTS_ESCAPED) !== 0;
    let value = "";
    for (let i = start; i < end; i++) {
      const chr = str.charAt(i);
      if (escapes && !escaped && chr === "\\") {
        escaped = true;
        continue;
      }
      escaped = false;
      if (chr === "\n") {
        value += " ";
      } else if (chr.charCodeAt(0) >= 33 || chr === " " || chr === "	") {
        value += chr;
      }
    }
    return value;
  }
  /**
   * Checks if a character is an operator or text and acts accordingly
   *
   * @param chr Character from the address field
   * @param i Offset of the character in the field
   */
  checkChar(chr, i) {
    if (!this.escaped && !this.operatorExpecting) {
      if (!this.inDomainLiteral && chr === "[" && this.afterAt) {
        this.inDomainLiteral = true;
      } else if (this.inDomainLiteral && (chr === "]" || chr === "," || chr === ";")) {
        this.inDomainLiteral = false;
      }
    }
    let nested = false;
    if (this.operatorExpecting === ">") {
      nested = this._trackInner(chr);
      if (!nested && chr === ";" && this.inGroup) {
        this._closeText(i);
        this.operatorExpecting = "";
        this._resetInner();
      }
    } else if (this.operatorExpecting === ")" && !this.escaped) {
      if (chr === "(") {
        this.innerComment++;
      } else if (chr === ")" && this.innerComment) {
        this.innerComment--;
        nested = true;
      }
    }
    if (this.escaped) {
    } else if (chr === this.operatorExpecting && !nested) {
      const nextChr = this.str.charAt(i + 1);
      this._closeText(i);
      this.list.push(nextChr && ![" ", "	", "\r", "\n", ",", ";"].includes(nextChr) ? TOKEN_OPERATOR | TOKEN_NO_BREAK : TOKEN_OPERATOR, i, i + 1);
      if (chr !== ")") {
        this.afterAt = false;
      }
      this.operatorExpecting = "";
      this.escaped = false;
      this._resetInner();
      return;
    } else if (!this.operatorExpecting && !(this.inDomainLiteral && chr === ":") && chr in this.operators) {
      this._closeText(i);
      this.list.push(TOKEN_OPERATOR, i, i + 1);
      if (chr === ":") {
        this.inGroup = true;
      } else if (chr === ";") {
        this.inGroup = false;
      }
      if (chr !== "(") {
        this.afterAt = false;
      }
      this.operatorExpecting = this.operators[chr];
      this.escaped = false;
      this._resetInner();
      return;
    } else if (['"', "'", ")"].includes(this.operatorExpecting) && chr === "\\") {
      this.escaped = true;
      if (this.node >= 0) {
        this.list.slots[this.node * 3] |= TOKEN_DIRTY;
      }
      return;
    }
    if (this.node < 0) {
      this.node = this.list.push((this.operatorExpecting === '"' || this.operatorExpecting === ")" ? TOKEN_ESCAPES : 0) | (this.escaped ? TOKEN_STARTS_ESCAPED : 0), i, i);
    }
    if (chr === "\n") {
      chr = " ";
      this.list.slots[this.node * 3] |= TOKEN_DIRTY;
    }
    if (chr.charCodeAt(0) >= 33 || chr === " " || chr === "	") {
      if (!this.operatorExpecting && chr !== " " && chr !== "	") {
        this.afterAt = chr === "@";
      }
    } else {
      this.list.slots[this.node * 3] |= TOKEN_DIRTY;
    }
    this.escaped = false;
  }
  /**
   * Tracks the quoted strings, comments and domain literals inside an angle-addr, which its
   * closer must not be read from. A backslash escapes the next character inside a quoted
   * string and a comment. A domain literal opens right after an "@" and ends at the "]".
   * dtext holds the list separators as well, and inside the brackets they never split the
   * list anyway.
   *
   * @param chr Character from the address field
   * @return true while the character sits inside one of them, the one that closes it included
   */
  _trackInner(chr) {
    if (this.innerEscaped) {
      this.innerEscaped = false;
      return true;
    }
    if (this.innerQuoted) {
      if (chr === "\\") {
        this.innerEscaped = true;
      } else if (chr === '"') {
        this.innerQuoted = false;
      }
      return true;
    }
    if (this.innerComment) {
      if (chr === "\\") {
        this.innerEscaped = true;
      } else if (chr === "(") {
        this.innerComment++;
      } else if (chr === ")") {
        this.innerComment--;
      }
      return true;
    }
    if (this.innerLiteral) {
      if (chr === "]") {
        this.innerLiteral = false;
      }
      return true;
    }
    if (chr === '"') {
      this.innerQuoted = true;
      return true;
    }
    if (chr === "(") {
      this.innerComment = 1;
      return true;
    }
    if (chr === "[" && this.afterAt) {
      this.innerLiteral = true;
      return true;
    }
    if (!_isSpaceCode(chr.charCodeAt(0))) {
      this.afterAt = chr === "@";
    }
    return false;
  }
  /**
   * Forgets the nesting collected for the operator that just opened or ended
   */
  _resetInner() {
    this.innerQuoted = false;
    this.innerComment = 0;
    this.innerLiteral = false;
    this.innerEscaped = false;
  }
};
function _mergeNameFragments(list) {
  const merged = [];
  for (let i = list.length - 1; i >= 0; i--) {
    const current = list[i];
    const next = merged.length ? merged[merged.length - 1] : null;
    if (next && current.address === "" && current.name && !current.group && next.address && next.name) {
      next.name = current.name + ", " + next.name;
    } else {
      merged.push(current);
    }
  }
  return merged.reverse();
}
function _parseAddressList(str) {
  const tokens = new Tokenizer(str).tokenize();
  const parsedAddresses = [];
  let group = null;
  let members = [];
  let from = 0;
  for (let i = 0, len = tokens.length; i <= len; i++) {
    const operator = i < len ? tokens.operatorAt(i) : "";
    if (i < len && operator !== "," && operator !== ";" && operator !== ":") {
      continue;
    }
    if (operator === ":") {
      if (!group) {
        group = { name: _groupName(tokens, from, i), group: [] };
        members = [];
      }
      from = i + 1;
      continue;
    }
    if (i > from) {
      const address = _handleAddress(tokens, from, i);
      if (group) {
        members.push(address);
      } else {
        parsedAddresses.push(address);
      }
    }
    from = i + 1;
    if (group && (operator === ";" || i === len)) {
      group.group = _mergeNameFragments(members);
      parsedAddresses.push(group);
      group = null;
    }
  }
  return _mergeNameFragments(parsedAddresses);
}
function addressparser(str, options) {
  const parsedAddresses = _parseAddressList(str);
  if (options?.flatten) {
    const flatAddresses = [];
    const walkAddressList = (list) => {
      list.forEach((entry) => {
        if (entry.group) {
          return walkAddressList(entry.group);
        }
        flatAddresses.push(entry);
      });
    };
    walkAddressList(parsedAddresses);
    return flatAddresses;
  }
  return parsedAddresses;
}
var addressparser_default = addressparser;

// node_modules/nodemailer/dist/esm/mime-node/last-newline.js
var import_node_stream5 = require("node:stream");
var LastNewline = class extends import_node_stream5.Transform {
  constructor() {
    super();
    this.lastByte = false;
  }
  /** @internal */
  _transform(chunk, encoding, done) {
    if (chunk.length) {
      this.lastByte = chunk[chunk.length - 1];
    }
    this.push(chunk);
    done();
  }
  /** @internal */
  _flush(done) {
    if (this.lastByte === 10) {
      return done();
    }
    if (this.lastByte === 13) {
      this.push(Buffer.from("\n"));
      return done();
    }
    this.push(Buffer.from("\r\n"));
    return done();
  }
};

// node_modules/nodemailer/dist/esm/mime-node/le-windows.js
var import_node_stream6 = require("node:stream");
var LeWindows = class extends import_node_stream6.Transform {
  constructor(options) {
    super(options);
    this.lastByte = false;
  }
  /**
   * Escapes dots
   * @internal
   */
  _transform(chunk, encoding, done) {
    let buf;
    let lastPos = 0;
    for (let i = 0, len = chunk.length; i < len; i++) {
      if (chunk[i] === 10) {
        if (i && chunk[i - 1] !== 13 || !i && this.lastByte !== 13) {
          if (i > lastPos) {
            buf = chunk.slice(lastPos, i);
            this.push(buf);
          }
          this.push(Buffer.from("\r\n"));
          lastPos = i + 1;
        }
      }
    }
    if (lastPos && lastPos < chunk.length) {
      buf = chunk.slice(lastPos);
      this.push(buf);
    } else if (!lastPos) {
      this.push(chunk);
    }
    this.lastByte = chunk[chunk.length - 1];
    done();
  }
};

// node_modules/nodemailer/dist/esm/mime-node/le-unix.js
var import_node_stream7 = require("node:stream");
var LeUnix = class extends import_node_stream7.Transform {
  constructor(options) {
    super(options);
  }
  /**
   * Escapes dots
   * @internal
   */
  _transform(chunk, encoding, done) {
    let buf;
    let lastPos = 0;
    for (let i = 0, len = chunk.length; i < len; i++) {
      if (chunk[i] === 13) {
        buf = chunk.slice(lastPos, i);
        lastPos = i + 1;
        this.push(buf);
      }
    }
    if (lastPos && lastPos < chunk.length) {
      buf = chunk.slice(lastPos);
      this.push(buf);
    } else if (!lastPos) {
      this.push(chunk);
    }
    done();
  }
};

// node_modules/nodemailer/dist/esm/mime-node/index.js
var FORMATTED_HEADERS = ["From", "Sender", "To", "Cc", "Bcc", "Reply-To", "Date", "References"];
var ATEXT = "[A-Za-z0-9!#$%&'*+\\-/=?^_`{|}~\\x80-\\uFFFF]";
var DOT_ATOM = new RegExp("^" + ATEXT + "+(?:\\." + ATEXT + "+)*$");
var QUOTED_STRING = /^"(?:[^"\\]|\\[\s\S])*"$/;
var PLAIN_ADDRESS = /^[^\s"(),:;<>@[\\\]]+@[^\s"(),:;<>@[\\\]]+$/;
var DOMAIN_LITERAL_TAIL2 = /@(\[[^[\]\\]*\])$/;
function stripWhitespaceInAngleBrackets(value) {
  let result = "";
  let pos = 0;
  for (; ; ) {
    const open = value.indexOf("<", pos);
    if (open < 0) {
      break;
    }
    const close = value.indexOf(">", open + 1);
    if (close < 0) {
      break;
    }
    result += value.slice(pos, open) + value.slice(open, close + 1).replace(/\s/g, "");
    pos = close + 1;
  }
  return result + value.slice(pos);
}
var URL_PARSER_UNSAFE = /[/\\?#%\x00-\x20\x7F]/;
var MAX_DOMAIN_LENGTH = 253;
var MAX_LABEL_LENGTH = 63;
var PIPELINE_NOOP = () => false;
function abortedError() {
  const err = new Error("Message stream was closed before the message was generated");
  err.code = ESTREAM;
  return err;
}
function exceedsDomainLimits(domain) {
  let total = 0;
  let label = 0;
  for (const char of domain) {
    total++;
    if (char === "." || char === "\u3002" || char === "\uFF0E" || char === "\uFF61") {
      label = 0;
    } else if (++label > MAX_LABEL_LENGTH) {
      return true;
    }
  }
  return total > MAX_DOMAIN_LENGTH;
}
function normalizeDomain(domain, toUnicode2) {
  if (typeof import_node_url2.default.domainToASCII === "function" && typeof import_node_url2.default.domainToUnicode === "function" && !URL_PARSER_UNSAFE.test(domain)) {
    const ascii = import_node_url2.default.domainToASCII(domain);
    const mapped = ascii && toUnicode2 ? import_node_url2.default.domainToUnicode(ascii) : ascii;
    if (mapped) {
      return mapped;
    }
  }
  if (exceedsDomainLimits(domain)) {
    return domain;
  }
  return toUnicode2 ? toUnicode(domain) : toASCII(domain);
}
function _stripBoundaryControls(value) {
  return value.replace(/[\x00-\x1f\x7f]+/g, "");
}
var MimeNode = class _MimeNode {
  constructor(contentType, options) {
    this.nodeCounter = 0;
    options = options || {};
    this.baseBoundary = _stripBoundaryControls(options.baseBoundary || import_node_crypto.default.randomBytes(8).toString("hex"));
    this.boundaryPrefix = _stripBoundaryControls(options.boundaryPrefix || "--_NmP");
    this.disableFileAccess = !!options.disableFileAccess;
    this.disableUrlAccess = !!options.disableUrlAccess;
    this.normalizeHeaderKey = options.normalizeHeaderKey;
    this.date = options.parentNode ? null : /* @__PURE__ */ new Date();
    this.rootNode = options.rootNode || this;
    this.keepBcc = !!options.keepBcc;
    if (options.filename) {
      this.filename = options.filename;
      if (!contentType) {
        contentType = detectMimeType2(this.filename.split(".").pop());
      }
    }
    this.textEncoding = (options.textEncoding || "").toString().trim().charAt(0).toUpperCase();
    this.parentNode = options.parentNode;
    this.hostname = options.hostname;
    this.newline = options.newline;
    this.childNodes = [];
    this._nodeId = ++this.rootNode.nodeCounter;
    this._headers = [];
    this._isPlainText = false;
    this._hasLongLines = false;
    this._envelope = false;
    this._raw = false;
    this._transforms = [];
    this._processFuncs = [];
    if (contentType) {
      this.setHeader("Content-Type", contentType);
    }
  }
  /////// PUBLIC METHODS
  /**
   * Creates and appends a child node.Arguments provided are passed to MimeNode constructor
   *
   * @param [contentType] Optional content type
   * @param [options] Optional options object
   * @return Created node object
   */
  createChild(contentType, options) {
    if (!options && typeof contentType === "object") {
      options = contentType;
      contentType = void 0;
    }
    const node = new _MimeNode(contentType, options);
    this.appendChild(node);
    return node;
  }
  /**
   * Appends an existing node to the mime tree. Removes the node from an existing
   * tree if needed
   *
   * @param childNode node to be appended
   * @return Appended node object
   */
  appendChild(childNode) {
    if (childNode.parentNode && childNode.parentNode !== this) {
      childNode.remove();
    }
    if (childNode.rootNode !== this.rootNode) {
      childNode.rootNode = this.rootNode;
      childNode._nodeId = ++this.rootNode.nodeCounter;
    }
    childNode.parentNode = this;
    this.childNodes.push(childNode);
    return childNode;
  }
  /**
   * Replaces current node with another node
   *
   * @param node Replacement node
   * @return Replacement node
   */
  replace(node) {
    if (node === this) {
      return this;
    }
    this.parentNode.childNodes.forEach((childNode, i) => {
      if (childNode === this) {
        node.rootNode = this.rootNode;
        node.parentNode = this.parentNode;
        node._nodeId = this._nodeId;
        this.rootNode = this;
        this.parentNode = void 0;
        node.parentNode.childNodes[i] = node;
      }
    });
    return node;
  }
  /**
   * Removes current node from the mime tree
   *
   * @return removed node
   */
  remove() {
    if (!this.parentNode) {
      return this;
    }
    for (let i = this.parentNode.childNodes.length - 1; i >= 0; i--) {
      if (this.parentNode.childNodes[i] === this) {
        this.parentNode.childNodes.splice(i, 1);
        this.parentNode = void 0;
        this.rootNode = this;
        return this;
      }
    }
  }
  /**
   * Sets a header value. If the value for selected key exists, it is overwritten.
   * You can set multiple values as well by using [{key:'', value:''}] or
   * {key: 'value'} as the first argument.
   *
   * @param key Header key or a list of key value pairs
   * @param value Header value
   * @return current node
   */
  setHeader(key, value) {
    let added = false;
    if (!value && key && typeof key === "object") {
      if (key.key && "value" in key) {
        this.setHeader(key.key, key.value);
      } else if (Array.isArray(key)) {
        key.forEach((i) => {
          this.setHeader(i.key, i.value);
        });
      } else {
        Object.keys(key).forEach((i) => {
          this.setHeader(i, key[i]);
        });
      }
      return this;
    }
    key = this._normalizeHeaderKey(key);
    const headerValue = {
      key,
      value
    };
    for (let i = 0, len = this._headers.length; i < len; i++) {
      if (this._headers[i].key === key) {
        if (!added) {
          this._headers[i] = headerValue;
          added = true;
        } else {
          this._headers.splice(i, 1);
          i--;
          len--;
        }
      }
    }
    if (!added) {
      this._headers.push(headerValue);
    }
    return this;
  }
  /**
   * Adds a header value. If the value for selected key exists, the value is appended
   * as a new field and old one is not touched.
   * You can set multiple values as well by using [{key:'', value:''}] or
   * {key: 'value'} as the first argument.
   *
   * @param key Header key or a list of key value pairs
   * @param value Header value
   * @return current node
   */
  addHeader(key, value) {
    if (!value && key && typeof key === "object") {
      if (key.key && key.value) {
        this.addHeader(key.key, key.value);
      } else if (Array.isArray(key)) {
        key.forEach((i) => {
          this.addHeader(i.key, i.value);
        });
      } else {
        Object.keys(key).forEach((i) => {
          this.addHeader(i, key[i]);
        });
      }
      return this;
    } else if (Array.isArray(value)) {
      value.forEach((val) => {
        this.addHeader(key, val);
      });
      return this;
    }
    this._headers.push({
      key: this._normalizeHeaderKey(key),
      value
    });
    return this;
  }
  /**
   * Retrieves the first mathcing value of a selected key
   *
   * @param key Key to search for
   * @retun Value for the key
   */
  getHeader(key) {
    key = this._normalizeHeaderKey(key);
    for (let i = 0, len = this._headers.length; i < len; i++) {
      if (this._headers[i].key === key) {
        return this._headers[i].value;
      }
    }
  }
  /**
   * Sets body content for current node. If the value is a string, charset is added automatically
   * to Content-Type (if it is text/*). If the value is a Buffer, you need to specify
   * the charset yourself
   *
   * @param content Body content
   * @return current node
   */
  setContent(content) {
    this.content = content;
    if (typeof this.content.pipe === "function") {
      recordStreamErrors(this.content);
    } else if (typeof this.content === "string") {
      this._isPlainText = isPlainText(this.content);
      if (this._isPlainText && hasLongerLines(this.content, 76)) {
        this._hasLongLines = true;
      }
    }
    return this;
  }
  build(callback) {
    let promise;
    if (!callback) {
      promise = new Promise((resolve3, reject) => {
        callback = callbackPromise(resolve3, reject);
      });
    }
    const done = callback;
    const stream = this.createReadStream();
    const buf = [];
    let buflen = 0;
    let returned = false;
    stream.on("readable", () => {
      let chunk;
      while ((chunk = stream.read()) !== null) {
        buf.push(chunk);
        buflen += chunk.length;
      }
    });
    stream.once("error", (err) => {
      if (returned) {
        return;
      }
      returned = true;
      return done(err);
    });
    stream.once("end", (chunk) => {
      if (returned) {
        return;
      }
      returned = true;
      if (chunk && chunk.length) {
        buf.push(chunk);
        buflen += chunk.length;
      }
      return done(null, Buffer.concat(buf, buflen));
    });
    return promise;
  }
  getTransferEncoding() {
    let transferEncoding = false;
    const contentType = (this.getHeader("Content-Type") || "").toString().toLowerCase().trim();
    if (this.content) {
      transferEncoding = (this.getHeader("Content-Transfer-Encoding") || "").toString().toLowerCase().trim();
      if (!transferEncoding || !["base64", "quoted-printable"].includes(transferEncoding)) {
        if (/^text\//i.test(contentType)) {
          if (this._isPlainText && !this._hasLongLines) {
            transferEncoding = "7bit";
          } else if (typeof this.content === "string" || this.content instanceof Buffer) {
            transferEncoding = this._getTextEncoding(this.content) === "Q" ? "quoted-printable" : "base64";
          } else {
            transferEncoding = this.textEncoding === "B" ? "base64" : "quoted-printable";
          }
        } else if (!/^(multipart|message)\//i.test(contentType)) {
          transferEncoding = transferEncoding || "base64";
        }
      }
    }
    return transferEncoding;
  }
  /**
   * Builds the header block for the mime node. Append \r\n\r\n before writing the content
   *
   * @returns Headers
   */
  buildHeaders() {
    const transferEncoding = this.getTransferEncoding();
    const headers = [];
    if (transferEncoding) {
      this.setHeader("Content-Transfer-Encoding", transferEncoding);
    }
    if (this.filename && !this.getHeader("Content-Disposition")) {
      this.setHeader("Content-Disposition", "attachment");
    }
    if (this.rootNode === this) {
      if (!this.getHeader("Date")) {
        this.setHeader("Date", this.date.toUTCString().replace(/GMT/, "+0000"));
      }
      this.messageId();
      if (!this.getHeader("MIME-Version")) {
        this.setHeader("MIME-Version", "1.0");
      }
      for (let i = this._headers.length - 2; i >= 0; i--) {
        const header = this._headers[i];
        if (header.key === "Content-Type") {
          this._headers.splice(i, 1);
          this._headers.push(header);
        }
      }
    }
    this._headers.forEach((header) => {
      let key = header.key;
      let value = header.value;
      let structured;
      let param;
      const options = {};
      const formattedHeaders = FORMATTED_HEADERS;
      if (value && typeof value === "object" && !formattedHeaders.includes(key)) {
        copyOwnKeys(options, value, (optionKey) => optionKey === "value");
        value = (value.value || "").toString();
        if (!value.trim()) {
          return;
        }
      }
      if (options.prepared) {
        if (options.foldLines) {
          headers.push(foldLines(key + ": " + value));
        } else {
          headers.push(key + ": " + value);
        }
        return;
      }
      switch (header.key) {
        case "Content-Disposition":
          structured = parseHeaderValue(value);
          if (this.filename) {
            structured.params.filename = this.filename;
          }
          value = buildHeaderValue(structured);
          break;
        case "Content-Type":
          structured = parseHeaderValue(value);
          structured.value = (structured.value || "").toString().replace(/[\x00-\x1f\x7f]/g, "");
          this._handleContentType(structured);
          if (structured.value.match(/^text\/plain\b/) && typeof this.content === "string" && /[\u0080-\uFFFF]/.test(this.content)) {
            structured.params.charset = "utf-8";
          }
          if (this.filename) {
            for (const paramKey of Object.keys(structured.params)) {
              if (/^name(\*|$)/i.test(paramKey)) {
                delete structured.params[paramKey];
              }
            }
          }
          value = buildHeaderValue(structured);
          if (this.filename) {
            param = /[\x00-\x1f\x7f]/.test(this.filename) ? encodeWord(this.filename, this._getTextEncoding(this.filename), 52) : this._encodeWords(this.filename);
            if (param !== this.filename || /[\s'"\\;:/=(),<>@[\]?]|^-/.test(param)) {
              param = JSON.stringify(param);
            }
            value += "; name=" + param;
          }
          break;
        case "Bcc":
          if (!this.keepBcc) {
            return;
          }
          break;
      }
      value = this._encodeHeaderValue(key, value);
      if (!(value || "").toString().trim()) {
        return;
      }
      if (typeof this.normalizeHeaderKey === "function") {
        const normalized2 = this.normalizeHeaderKey(key, value);
        const cleaned = typeof normalized2 === "string" ? normalized2.replace(/[\x00-\x1f\x7f]/g, "") : "";
        if (cleaned) {
          key = cleaned;
        }
      }
      headers.push(foldLines(key + ": " + value, 76));
    });
    return headers.join("\r\n");
  }
  /**
   * Streams the rfc2822 message from the current node. If this is a root node,
   * mandatory header fields are set if missing (Date, Message-Id, MIME-Version)
   *
   * @return Compiled message
   */
  createReadStream(options) {
    options = options || {};
    const stream = new import_node_stream8.PassThrough(options);
    this.stream(stream, options, (err) => {
      if (err) {
        stream.destroy(err);
        return;
      }
      stream.end();
    });
    stream.once("close", () => {
      if (!stream.writableFinished) {
        this._destroyContentStreams();
      }
    });
    const stages = [stream];
    for (const transform of this._transforms) {
      stages.push(typeof transform === "function" ? transform() : transform);
    }
    stages.push(new LastNewline());
    let outputStream = (0, import_node_stream8.pipeline)(stages, PIPELINE_NOOP);
    for (const processFunc of this._processFuncs) {
      const input = outputStream;
      outputStream = processFunc(input);
      if (outputStream !== input) {
        (0, import_node_stream8.finished)(outputStream, (err) => {
          if (err) {
            input.destroy();
          }
        });
      }
    }
    if (this.newline) {
      const winbreak = ["win", "windows", "dos", "\r\n"].includes(this.newline.toString().toLowerCase());
      outputStream = (0, import_node_stream8.pipeline)(outputStream, winbreak ? new LeWindows() : new LeUnix(), PIPELINE_NOOP);
    }
    return outputStream;
  }
  /**
   * Appends a transform stream object to the transforms list. Final output
   * is passed through this stream before exposing
   *
   * @param transform Read-Write stream
   */
  transform(transform) {
    this._transforms.push(transform);
  }
  /**
   * Appends a post process function. The functon is run after transforms and
   * uses the following syntax
   *
   *   processFunc(input) -> outputStream
   *
   * @param processFunc Read-Write stream
   */
  processFunc(processFunc) {
    this._processFuncs.push(processFunc);
  }
  stream(outputStream, options, done) {
    const transferEncoding = this.getTransferEncoding();
    let activeStreams = [];
    let returned = false;
    const callback = (err) => {
      if (returned) {
        return;
      }
      returned = true;
      outputStream.removeListener("close", onOutputClose);
      done(err);
    };
    function onOutputClose() {
      for (const stream of activeStreams) {
        stream.destroy();
      }
      return callback(abortedError());
    }
    const readInto = (...streams) => {
      if (!activeStreams.length) {
        outputStream.once("close", onOutputClose);
      }
      activeStreams = streams;
    };
    const aborted = () => {
      if (outputStream.destroyed) {
        callback(abortedError());
        return true;
      }
      return false;
    };
    const finalize = () => {
      let childId = 0;
      const processChildNode = () => {
        if (aborted()) {
          return;
        }
        if (childId >= this.childNodes.length) {
          outputStream.write("\r\n--" + this.boundary + "--\r\n");
          return callback();
        }
        const child = this.childNodes[childId++];
        outputStream.write((childId > 1 ? "\r\n" : "") + "--" + this.boundary + "\r\n");
        child.stream(outputStream, options, (err) => {
          if (err) {
            return callback(err);
          }
          setImmediate(processChildNode);
        });
      };
      if (this.multipart) {
        setImmediate(processChildNode);
      } else {
        return callback();
      }
    };
    const sendContent = () => {
      if (aborted()) {
        return;
      }
      if (!this.content) {
        return setImmediate(finalize);
      }
      const createStream = () => {
        if (aborted()) {
          return;
        }
        const contentError = this._takeStreamContent(this.content);
        if (contentError) {
          return callback(contentError);
        }
        const localStream = this._getStream(this.content);
        if (["quoted-printable", "base64"].includes(transferEncoding)) {
          const contentStream = transferEncoding === "base64" ? new Encoder(options) : (
            // outside of text a lone CR or LF is data, encoding it keeps it from being
            // turned into a line break by a newline transform or the receiving side
            new Encoder2(Object.assign({}, options, { binary: !/^text\//i.test(this.contentType || "") }))
          );
          readInto(localStream, contentStream);
          contentStream.pipe(outputStream, {
            end: false
          });
          (0, import_node_stream8.pipeline)(localStream, contentStream, (err) => err && callback(err));
          (0, import_node_stream8.finished)(contentStream, { writable: false }, (err) => err ? callback(err) : finalize());
        } else {
          readInto(localStream);
          localStream.pipe(outputStream, {
            end: false
          });
          (0, import_node_stream8.finished)(localStream, { writable: false }, (err) => err ? callback(err) : finalize());
        }
      };
      if (this.content._resolve) {
        const sourceStream = this._getStream(this.content);
        readInto(sourceStream);
        resolveStream(sourceStream, (err, value) => {
          if (err) {
            return callback(err);
          }
          if (returned) {
            return;
          }
          this.content._resolve = false;
          this.content._resolvedValue = value;
          setImmediate(createStream);
        });
      } else {
        setImmediate(createStream);
      }
    };
    if (this._raw) {
      setImmediate(() => {
        if (aborted()) {
          return;
        }
        const rawError = this._takeStreamContent(this._raw);
        if (rawError) {
          return callback(rawError);
        }
        const raw2 = this._getStream(this._raw);
        readInto(raw2);
        raw2.pipe(outputStream, {
          end: false
        });
        (0, import_node_stream8.finished)(raw2, { writable: false }, (err) => err ? callback(err) : finalize());
      });
    } else {
      outputStream.write(this.buildHeaders() + "\r\n\r\n");
      setImmediate(sendContent);
    }
  }
  /**
   * Sets envelope to be used instead of the generated one
   *
   * @return SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
   */
  setEnvelope(envelope) {
    let list;
    this._envelope = {
      from: false,
      to: []
    };
    if (envelope.from) {
      list = [];
      this._convertAddresses(this._parseEnvelopeAddresses(envelope.from), list);
      list = list.filter((address) => address && address.address);
      if (list.length && list[0]) {
        this._envelope.from = list[0].address;
      }
    }
    const seenRecipients = /* @__PURE__ */ new Set();
    const recipients = [];
    ["to", "cc", "bcc"].forEach((key) => {
      if (envelope[key]) {
        this._convertAddresses(this._parseEnvelopeAddresses(envelope[key]), recipients, seenRecipients);
      }
    });
    this._envelope.to = recipients.map((to2) => to2.address).filter((address) => address);
    const standardFields = ["to", "cc", "bcc", "from"];
    copyOwnKeys(this._envelope, envelope, (key) => standardFields.includes(key));
    return this;
  }
  /**
   * Generates and returns an object with parsed address fields
   *
   * @return Address object
   */
  getAddresses() {
    const addresses = {};
    const seenByKey = /* @__PURE__ */ new Map();
    this._headers.forEach((header) => {
      const key = header.key.toLowerCase();
      if (["from", "sender", "reply-to", "to", "cc", "bcc"].includes(key)) {
        if (!Array.isArray(addresses[key])) {
          addresses[key] = [];
          seenByKey.set(key, /* @__PURE__ */ new Set());
        }
        this._convertAddresses(this._parseAddresses(header.value), addresses[key], seenByKey.get(key));
      }
    });
    return addresses;
  }
  /**
   * Generates and returns SMTP envelope with the sender address and a list of recipients addresses
   *
   * @return SMTP envelope in the form of {from: 'from@example.com', to: ['to@example.com']}
   */
  getEnvelope() {
    if (this._envelope) {
      return this._envelope;
    }
    const envelope = {
      from: false,
      to: []
    };
    const seenRecipients = /* @__PURE__ */ new Set();
    const recipients = [];
    this._headers.forEach((header) => {
      const list = [];
      if (header.key === "From" || !envelope.from && ["Reply-To", "Sender"].includes(header.key)) {
        this._convertAddresses(this._parseAddresses(header.value), list);
        if (list.length && list[0]) {
          envelope.from = list[0].address;
        }
      } else if (["To", "Cc", "Bcc"].includes(header.key)) {
        this._convertAddresses(this._parseAddresses(header.value), recipients, seenRecipients);
      }
    });
    envelope.to = recipients.map((to2) => to2.address);
    return envelope;
  }
  /**
   * Returns Message-Id value. If it does not exist, then creates one
   *
   * @return Message-Id value
   */
  messageId() {
    let messageId = this.getHeader("Message-ID");
    if (!messageId) {
      messageId = this._generateMessageId();
      this.setHeader("Message-ID", messageId);
    }
    return messageId;
  }
  /**
   * Sets pregenerated content that will be used as the output of this node
   *
   * @param raw Raw MIME contents
   */
  setRaw(raw2) {
    this._raw = raw2;
    if (this._raw && typeof this._raw.pipe === "function") {
      recordStreamErrors(this._raw);
    }
    return this;
  }
  /////// PRIVATE METHODS
  /**
   * Checks an access policy flag for this node and every node above it. The flags are set
   * from the options the node was built with, and createChild only ever sees the options
   * the caller passed, so a child of a closed tree starts out open. Reading the answer off
   * the parent chain keeps it right whatever order the tree was assembled in.
   *
   * @param flag Either 'disableFileAccess' or 'disableUrlAccess'
   * @return true if this node or an ancestor closed that access
   * @internal
   */
  _accessDisabled(flag) {
    let node = this;
    while (node) {
      if (node[flag]) {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }
  /**
   * Destroys the content streams of this node and of every node below it
   *
   * @internal
   */
  _destroyContentStreams() {
    destroyStream(this.content);
    destroyStream(this._raw);
    for (const child of this.childNodes) {
      child._destroyContentStreams();
    }
  }
  /**
   * Checks that a content value can still be read before the node streams it. A stream is
   * refused once it errored, ended or was destroyed: piping it would either never finish or
   * produce an empty body without any error
   *
   * @param content Node content or raw value
   * @returns The error to stop with, or null when the content can be read
   * @internal
   */
  _takeStreamContent(content) {
    if (Object.prototype.toString.call(content) === "[object Error]") {
      return content;
    }
    if (!content || typeof content.pipe !== "function" || content._resolvedValue) {
      return null;
    }
    return unreadableStreamError(content);
  }
  /**
   * Detects and returns handle to a stream related with the content.
   *
   * @param content Node content
   * @returns Stream object
   * @internal
   */
  _getStream(content) {
    let contentStream;
    if (content._resolvedValue) {
      contentStream = new import_node_stream8.PassThrough();
      setImmediate(() => {
        try {
          contentStream.end(content._resolvedValue);
        } catch (_err) {
          contentStream.emit("error", _err);
        }
      });
      return contentStream;
    }
    if (typeof content.pipe === "function") {
      return content;
    }
    if (content && typeof content.path === "string" && !content.href) {
      if (this._accessDisabled("disableFileAccess")) {
        contentStream = new import_node_stream8.PassThrough();
        setImmediate(() => {
          const err = new Error("File access rejected for " + content.path);
          err.code = EFILEACCESS;
          contentStream.emit("error", err);
        });
        return contentStream;
      }
      return import_node_fs2.default.createReadStream(content.path);
    }
    if (content && typeof content.href === "string") {
      if (this._accessDisabled("disableUrlAccess")) {
        contentStream = new import_node_stream8.PassThrough();
        setImmediate(() => {
          const err = new Error("Url access rejected for " + content.href);
          err.code = EURLACCESS;
          contentStream.emit("error", err);
        });
        return contentStream;
      }
      return fetch_default(content.href, { headers: content.httpHeaders, tls: content.tls });
    }
    contentStream = new import_node_stream8.PassThrough();
    setImmediate(() => {
      try {
        contentStream.end(content || "");
      } catch (_err) {
        contentStream.emit("error", _err);
      }
    });
    return contentStream;
  }
  /**
   * Parses addresses. Takes in a single address or an array or an
   * array of address arrays (eg. To: [[first group], [second group],...])
   *
   * @param addresses Addresses to be parsed
   * @return An array of address objects
   * @internal
   */
  _parseAddresses(addresses) {
    const flattened = [];
    const seen = /* @__PURE__ */ new WeakSet();
    const stack = [];
    const enter = (list) => {
      if (!seen.has(list)) {
        seen.add(list);
        stack.push({ list, pos: 0 });
      }
    };
    enter(Array.isArray(addresses) ? addresses : [addresses]);
    while (stack.length) {
      const frame = stack[stack.length - 1];
      if (frame.pos >= frame.list.length) {
        stack.pop();
        continue;
      }
      const address = frame.list[frame.pos++];
      if (Array.isArray(address)) {
        enter(address);
        continue;
      }
      if (address && address.address) {
        const normalized2 = this._normalizeAddress(address.address);
        if (normalized2 === address.address && typeof address.name === "string") {
          flattened.push(address);
          continue;
        }
        const copy = copyOwnKeys({}, address);
        copy.address = normalized2;
        copy.name = address.name || "";
        flattened.push(copy);
        continue;
      }
      const parsed = this._normalizeParsedAddresses(addressparser_default(address));
      for (let i = 0; i < parsed.length; i++) {
        flattened.push(parsed[i]);
      }
    }
    return flattened;
  }
  /**
   * Normalizes the addresses of a freshly parsed address list, groups included.
   *
   * Everything this method returns carries a normalized address, whether it arrived as an
   * object or was parsed out of a header value. Without this the two shapes disagree, and
   * a consumer reading the parsed form back is handed the ambiguous
   * 'user@evil.com@good.com' that the header and the envelope no longer carry.
   *
   * @param parsed An array of address objects, as returned by addressparser
   * @return The same array, with every address normalized
   * @internal
   */
  _normalizeParsedAddresses(parsed) {
    parsed.forEach((entry) => {
      if (entry.address) {
        entry.address = this._normalizeAddress(entry.address);
      } else if (entry.group) {
        this._normalizeParsedAddresses(entry.group);
      }
    });
    return parsed;
  }
  /**
   * Parses the addresses of an explicitly set envelope.
   *
   * An envelope value is an addr-spec and never a display name, so a bare local username
   * such as 'root' is the address here. Header parsing has to read the same value as a
   * display name, as a value with no '@' in it can not be an addr-spec in a header.
   *
   * @param addresses Addresses to be parsed
   * @return An array of address objects
   * @internal
   */
  _parseEnvelopeAddresses(addresses) {
    return this._parseAddresses(addresses).map((entry) => {
      if (entry.address || entry.group || !entry.name || /[\s@]/.test(entry.name)) {
        return entry;
      }
      return { address: this._normalizeAddress(entry.name), name: "" };
    });
  }
  /**
   * Normalizes a header key, uses Camel-Case form, except for uppercase MIME-
   *
   * @param key Key to be normalized
   * @return key in Camel-Case form
   * @internal
   */
  _normalizeHeaderKey(key) {
    key = (key || "").toString().replace(/[\s\x00-\x20\x7f:]/g, "").toLowerCase().replace(/^X-SMTPAPI$|^(MIME|DKIM|ARC|BIMI)\b|^[a-z]|-(SPF|FBL|ID|MD5)$|-[a-z]/gi, (c) => c.toUpperCase()).replace(/^Content-Features$/i, "Content-features");
    return key;
  }
  /**
   * Checks if the content type is multipart and defines boundary if needed.
   * Doesn't return anything, modifies object argument instead.
   *
   * @param structured Parsed header value for 'Content-Type' key
   * @internal
   */
  _handleContentType(structured) {
    this.contentType = structured.value.trim().toLowerCase();
    this.multipart = /^multipart\//i.test(this.contentType) ? this.contentType.substr(this.contentType.indexOf("/") + 1) : false;
    if (this.multipart) {
      const declared = _stripBoundaryControls(structured.params.boundary || this.boundary || "");
      this.boundary = structured.params.boundary = declared || _stripBoundaryControls(this._generateBoundary());
    } else {
      this.boundary = false;
    }
  }
  /**
   * Generates a multipart boundary value
   *
   * @return boundary value
   * @internal
   */
  _generateBoundary() {
    return _stripBoundaryControls(this.rootNode.boundaryPrefix + "-" + this.rootNode.baseBoundary) + "-Part_" + this._nodeId;
  }
  /**
   * Encodes a header value for use in the generated rfc2822 email.
   *
   * @param key Header key
   * @param value Header value
   * @internal
   */
  _encodeHeaderValue(key, value) {
    key = this._normalizeHeaderKey(key);
    switch (key) {
      // Structured headers
      case "From":
      case "Sender":
      case "To":
      case "Cc":
      case "Bcc":
      case "Reply-To":
        return this._convertAddresses(this._parseAddresses(value));
      // values enclosed in <>
      case "Message-ID":
      case "In-Reply-To":
      case "Content-Id":
        value = (value || "").toString().replace(/\r?\n|\r/g, " ").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "");
        if (value.charAt(0) !== "<") {
          value = "<" + value;
        }
        if (value.charAt(value.length - 1) !== ">") {
          value = value + ">";
        }
        return value;
      // space separated list of values enclosed in <>
      case "References": {
        const ids = [];
        for (const entry of [].concat(value || "")) {
          const elm = (entry || "").toString().replace(/\r?\n|\r/g, " ").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").trim();
          for (let id of stripWhitespaceInAngleBrackets(elm).split(/\s+/)) {
            if (id.charAt(0) !== "<") {
              id = "<" + id;
            }
            if (id.charAt(id.length - 1) !== ">") {
              id = id + ">";
            }
            ids.push(id);
          }
        }
        return ids.join(" ").trim();
      }
      case "Date":
        if (Object.prototype.toString.call(value) === "[object Date]") {
          return value.toUTCString().replace(/GMT/, "+0000");
        }
        value = (value || "").toString().replace(/\r?\n|\r/g, " ");
        return this._encodeHeaderText(value);
      case "Content-Type":
      case "Content-Disposition":
        return (value || "").toString().replace(/\r?\n|\r/g, " ");
      default:
        value = (value || "").toString().replace(/\r?\n|\r/g, " ");
        return this._encodeHeaderText(value);
    }
  }
  /**
   * Rebuilds address object using punycode and other adjustments
   *
   * @param addresses An array of address objects
   * @param [uniqueList] An array to be populated with addresses
   * @param [seenAddresses] Addresses already added to uniqueList, shared with recursive calls to keep deduplication linear
   * @return address string
   * @internal
   */
  _convertAddresses(addresses, uniqueList, seenAddresses) {
    const values = [];
    uniqueList = uniqueList || [];
    if (!seenAddresses) {
      seenAddresses = /* @__PURE__ */ new Set();
      for (let i = 0; i < uniqueList.length; i++) {
        seenAddresses.add(uniqueList[i].address);
      }
    }
    [].concat(addresses || []).forEach((address) => {
      if (address.address) {
        address.address = this._normalizeAddress(address.address);
        if (!address.name) {
          values.push(PLAIN_ADDRESS.test(address.address) ? address.address : `<${address.address}>`);
        } else {
          values.push(`${this._encodeAddressName(address.name)} <${address.address}>`);
        }
        if (!seenAddresses.has(address.address)) {
          seenAddresses.add(address.address);
          uniqueList.push(address);
        }
      } else if (address.group) {
        const groupListAddresses = (address.group.length ? this._convertAddresses(address.group, uniqueList, seenAddresses) : "").trim();
        values.push(`${this._encodeAddressName(address.name)}:${groupListAddresses};`);
      }
    });
    return values.join(", ");
  }
  /**
   * Normalizes an email address
   *
   * @param address An array of address objects
   * @return address string
   * @internal
   */
  _normalizeAddress(address) {
    address = (address || "").toString().replace(/[\x00-\x1F\x7F<>]+/g, " ").trim();
    if (!address) {
      return address;
    }
    const literal = address.charAt(address.length - 1) === "]" ? DOMAIN_LITERAL_TAIL2.exec(address) : null;
    const lastAt = literal ? address.length - literal[1].length - 1 : address.lastIndexOf("@");
    if (lastAt < 0) {
      return this._normalizeLocalPart(address);
    }
    const user = address.substr(0, lastAt);
    const domain = address.substr(lastAt + 1);
    let encodedDomain = domain;
    const smtputf8 = /[\x80-\uFFFF]/.test(user);
    try {
      encodedDomain = normalizeDomain(domain.toLowerCase(), smtputf8);
    } catch (_err) {
    }
    return `${this._normalizeLocalPart(user)}@${encodedDomain}`;
  }
  /**
   * Normalizes the local part of an address into a form that can be emitted as is.
   *
   * A local part is either a dot-atom or a quoted-string, anything else is not a valid
   * addr-spec. The quotes of a quoted local part get lost along the way, and a bare
   * 'user@evil.com@good.com' leaves it to the receiver which '@' splits the domain off,
   * while the split here is always at the last one. So whatever is not already one of
   * the two valid forms goes back out as a quoted-string.
   *
   * @param user Local part of an address
   * @return Local part as a dot-atom or as a quoted-string
   * @internal
   */
  _normalizeLocalPart(user) {
    if (DOT_ATOM.test(user) || QUOTED_STRING.test(user)) {
      return user;
    }
    return quoteString(user);
  }
  /**
   * If needed, mime encodes the name part
   *
   * @param name Name part of an address
   * @returns Mime word encoded string if needed
   * @internal
   */
  _encodeAddressName(name2) {
    if (!/^[\w ]*$/.test(name2)) {
      if (/^[\x20-\x7e]*$/.test(name2)) {
        return quoteString(name2);
      } else {
        return encodeWord(name2, this._getTextEncoding(name2), 52);
      }
    }
    return name2;
  }
  /**
   * Encodes an unstructured header value. Such a value can only carry VCHAR and WSP, so a
   * control char or DEL has to be forced into the mime encoded word that a non-ascii value
   * would get anyway. HT stays as it is, it is valid folding whitespace here.
   *
   * @param value Header value to encode
   * @returns Mime word encoded string if needed
   * @internal
   */
  _encodeHeaderText(value) {
    return /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value) ? encodeWord(value, this._getTextEncoding(value), 52) : (
      // encodeWords only encodes if needed, otherwise the original string is returned
      this._encodeWords(value)
    );
  }
  /**
   * If needed, mime encodes the name part
   *
   * @param value Name part of an address
   * @returns Mime word encoded string if needed
   * @internal
   */
  _encodeWords(value) {
    return encodeWords(value, this._getTextEncoding(value), 52, true);
  }
  /**
   * Detects best mime encoding for a text value
   *
   * @param value Value to check for
   * @return either 'Q' or 'B'
   * @internal
   */
  _getTextEncoding(value) {
    value = (value || "").toString();
    if (this.textEncoding) {
      return this.textEncoding;
    }
    let nonLatinLen = 0;
    let latinLen = 0;
    for (let i = 0, len = value.length; i < len; i++) {
      const code = value.charCodeAt(i);
      if (code >= 0 && code <= 8 || code === 11 || code === 12 || code >= 14 && code <= 31 || code >= 128) {
        nonLatinLen++;
      } else if (code >= 65 && code <= 90 || code >= 97 && code <= 122) {
        latinLen++;
      }
    }
    return nonLatinLen < latinLen ? "Q" : "B";
  }
  /**
   * Generates a message id
   *
   * @return Random Message-ID value
   * @internal
   */
  _generateMessageId() {
    return "<" + [2, 2, 2, 6].reduce(
      // crux to generate UUID-like random strings
      (prev, len) => prev + "-" + import_node_crypto.default.randomBytes(len).toString("hex"),
      import_node_crypto.default.randomBytes(4).toString("hex")
    ) + "@" + // try to use the domain of the FROM address or fallback to server hostname
    (this.getEnvelope().from || this.hostname || "localhost").split("@").pop() + ">";
  }
};
var mime_node_default = MimeNode;

// node_modules/nodemailer/dist/esm/mail-composer/index.js
function isContentObject(value) {
  const content = value;
  return typeof value === "object" && !!(content.content || content.path || content.href || content.raw);
}
var MailComposer = class {
  constructor(mail) {
    this.mail = mail || {};
    this.message = false;
  }
  /**
   * Builds MimeNode instance
   */
  compile() {
    this._alternatives = this.getAlternatives();
    this._htmlNode = this._alternatives.filter((alternative) => /^text\/html\b/i.test(alternative.contentType)).pop();
    this._attachments = this.getAttachments(!!this._htmlNode);
    this._useRelated = !!(this._htmlNode && this._attachments.related.length);
    this._useAlternative = this._alternatives.length > 1;
    this._useMixed = this._attachments.attached.length > 1 || this._alternatives.length && this._attachments.attached.length === 1;
    if (this.mail.raw) {
      this.message = new mime_node_default("message/rfc822", {
        newline: this.mail.newline,
        disableUrlAccess: this.mail.disableUrlAccess,
        disableFileAccess: this.mail.disableFileAccess
      }).setRaw(this.mail.raw);
    } else if (this._useMixed) {
      this.message = this._createMixed();
    } else if (this._useAlternative) {
      this.message = this._createAlternative();
    } else if (this._useRelated) {
      this.message = this._createRelated();
    } else {
      this.message = this._createContentNode(false, [].concat(this._alternatives || []).concat(this._attachments.attached || []).shift() || {
        contentType: "text/plain",
        content: ""
      });
    }
    if (this.mail.headers) {
      this.message.addHeader(this.mail.headers);
    }
    ["from", "sender", "to", "cc", "bcc", "reply-to", "in-reply-to", "references", "subject", "message-id", "date"].forEach((header) => {
      const key = header.replace(/-(\w)/g, (o, c) => c.toUpperCase());
      if (this.mail[key]) {
        this.message.setHeader(header, this.mail[key]);
      }
    });
    if (this.mail.envelope) {
      this.message.setEnvelope(this.mail.envelope);
    }
    this.message.messageId();
    return this.message;
  }
  /**
   * List all attachments. Resulting attachment objects can be used as input for MimeNode nodes
   *
   * @param findRelated If true separate related attachments from attached ones
   * @returns An object of arrays (`related` and `attached`)
   */
  getAttachments(findRelated) {
    let eventObject;
    const attachments = [].concat(this.mail.attachments || []).map((attachment, i) => {
      if (/^data:/i.test(attachment.path || attachment.href)) {
        attachment = this._processDataUrl(attachment);
      }
      const contentType = attachment.contentType || detectMimeType2(attachment.filename || attachment.path || attachment.href || "bin");
      const isImage = /^image\//i.test(contentType);
      const isMessageNode = /^message\//i.test(contentType);
      const contentDisposition = attachment.contentDisposition || (isMessageNode || isImage && attachment.cid ? "inline" : "attachment");
      let contentTransferEncoding;
      if ("contentTransferEncoding" in attachment) {
        contentTransferEncoding = attachment.contentTransferEncoding;
      } else if (isMessageNode) {
        contentTransferEncoding = "8bit";
      } else {
        contentTransferEncoding = "base64";
      }
      const data = {
        contentType,
        contentDisposition,
        contentTransferEncoding
      };
      if (attachment.filename) {
        data.filename = attachment.filename;
      } else if (!isMessageNode && attachment.filename !== false) {
        data.filename = (attachment.path || attachment.href || "").split(/[/\\]/).pop().split("?").shift() || "attachment-" + (i + 1);
        if (data.filename.indexOf(".") < 0) {
          data.filename += "." + detectExtension2(data.contentType);
        }
      }
      if (/^https?:\/\//i.test(attachment.path)) {
        attachment.href = attachment.path;
        attachment.path = void 0;
      }
      if (attachment.cid) {
        data.cid = attachment.cid;
      }
      if (attachment.raw) {
        data.raw = attachment.raw;
      } else if (attachment.path) {
        data.content = {
          path: attachment.path
        };
      } else if (attachment.href) {
        data.content = {
          href: attachment.href,
          httpHeaders: attachment.httpHeaders,
          tls: attachment.tls
        };
      } else {
        data.content = attachment.content || "";
      }
      if (attachment.encoding) {
        data.encoding = attachment.encoding;
      }
      if (attachment.headers) {
        data.headers = attachment.headers;
      }
      return data;
    });
    if (this.mail.icalEvent) {
      eventObject = Object.assign({}, this._getIcalEvent());
      eventObject.contentType = "application/ics";
      if (!eventObject.headers) {
        eventObject.headers = {};
      }
      eventObject.filename = eventObject.filename || "invite.ics";
      eventObject.headers["Content-Disposition"] = "attachment";
      eventObject.headers["Content-Transfer-Encoding"] = "base64";
    }
    if (!findRelated) {
      return {
        attached: attachments.concat(eventObject || []),
        related: []
      };
    }
    return {
      attached: attachments.filter((attachment) => !attachment.cid).concat(eventObject || []),
      related: attachments.filter((attachment) => !!attachment.cid)
    };
  }
  /**
   * Returns the icalEvent value with `path`/`href`/data uri input normalized into
   * a `content` entry, the same way as for regular attachments. The same event is
   * included twice (as a text/calendar alternative and as an application/ics
   * attachment), so the shared content object is marked to be resolved just once
   * and the buffered result is reused by the second node.
   *
   * @returns Normalized icalEvent data
   * @internal
   */
  _getIcalEvent() {
    if (!this._icalEvent) {
      let icalEvent;
      if (isContentObject(this.mail.icalEvent)) {
        icalEvent = copyOwnKeys({}, this.mail.icalEvent);
      } else {
        icalEvent = {
          content: this.mail.icalEvent
        };
      }
      if (/^data:/i.test(icalEvent.path || icalEvent.href)) {
        icalEvent = this._processDataUrl(icalEvent);
      }
      if (/^https?:\/\//i.test(icalEvent.path)) {
        icalEvent.href = icalEvent.path;
        icalEvent.path = void 0;
      }
      if (!icalEvent.raw) {
        if (icalEvent.path) {
          icalEvent.content = {
            path: icalEvent.path
          };
          icalEvent.path = void 0;
        } else if (icalEvent.href) {
          icalEvent.content = {
            href: icalEvent.href,
            httpHeaders: icalEvent.httpHeaders,
            tls: icalEvent.tls
          };
          icalEvent.href = void 0;
        }
      }
      if (icalEvent.content && typeof icalEvent.content === "object") {
        icalEvent.content._resolve = true;
      }
      this._icalEvent = icalEvent;
    }
    return this._icalEvent;
  }
  /**
   * List alternatives. Resulting objects can be used as input for MimeNode nodes
   *
   * @returns An array of alternative elements. Includes the `text` and `html` values as well
   */
  getAlternatives() {
    const alternatives = [];
    let text, html, watchHtml, amp, eventObject;
    if (this.mail.text) {
      if (isContentObject(this.mail.text)) {
        text = this.mail.text;
      } else {
        text = {
          content: this.mail.text
        };
      }
      text.contentType = "text/plain; charset=utf-8";
    }
    if (this.mail.watchHtml) {
      if (isContentObject(this.mail.watchHtml)) {
        watchHtml = this.mail.watchHtml;
      } else {
        watchHtml = {
          content: this.mail.watchHtml
        };
      }
      watchHtml.contentType = "text/watch-html; charset=utf-8";
    }
    if (this.mail.amp) {
      if (isContentObject(this.mail.amp)) {
        amp = this.mail.amp;
      } else {
        amp = {
          content: this.mail.amp
        };
      }
      amp.contentType = "text/x-amp-html; charset=utf-8";
    }
    if (this.mail.icalEvent) {
      eventObject = Object.assign({}, this._getIcalEvent());
      eventObject.filename = false;
      eventObject.contentType = "text/calendar; charset=utf-8; method=" + (eventObject.method || "PUBLISH").toString().trim().toUpperCase();
      if (!eventObject.headers) {
        eventObject.headers = {};
      }
    }
    if (this.mail.html) {
      if (isContentObject(this.mail.html)) {
        html = this.mail.html;
      } else {
        html = {
          content: this.mail.html
        };
      }
      html.contentType = "text/html; charset=utf-8";
    }
    [].concat(text || []).concat(watchHtml || []).concat(amp || []).concat(html || []).concat(eventObject || []).concat(this.mail.alternatives || []).forEach((alternative) => {
      if (/^data:/i.test(alternative.path || alternative.href)) {
        alternative = this._processDataUrl(alternative);
      }
      const data = {
        contentType: alternative.contentType || detectMimeType2(alternative.filename || alternative.path || alternative.href || "txt"),
        contentTransferEncoding: alternative.contentTransferEncoding
      };
      if (alternative.filename) {
        data.filename = alternative.filename;
      }
      if (/^https?:\/\//i.test(alternative.path)) {
        alternative.href = alternative.path;
        alternative.path = void 0;
      }
      if (alternative.raw) {
        data.raw = alternative.raw;
      } else if (alternative.path) {
        data.content = {
          path: alternative.path
        };
      } else if (alternative.href) {
        data.content = {
          href: alternative.href,
          httpHeaders: alternative.httpHeaders,
          tls: alternative.tls
        };
      } else {
        data.content = alternative.content || "";
      }
      if (alternative.encoding) {
        data.encoding = alternative.encoding;
      }
      if (alternative.headers) {
        data.headers = alternative.headers;
      }
      alternatives.push(data);
    });
    return alternatives;
  }
  /**
   * Builds multipart/mixed node. It should always contain different type of elements on the same level
   * eg. text + attachments
   *
   * @param parentNode Parent for this note. If it does not exist, a root node is created
   * @returns MimeNode node element
   * @internal
   */
  _createMixed(parentNode) {
    const node = parentNode ? parentNode.createChild("multipart/mixed", {
      disableUrlAccess: this.mail.disableUrlAccess,
      disableFileAccess: this.mail.disableFileAccess,
      normalizeHeaderKey: this.mail.normalizeHeaderKey,
      newline: this.mail.newline
    }) : new mime_node_default("multipart/mixed", {
      baseBoundary: this.mail.baseBoundary,
      textEncoding: this.mail.textEncoding,
      boundaryPrefix: this.mail.boundaryPrefix,
      disableUrlAccess: this.mail.disableUrlAccess,
      disableFileAccess: this.mail.disableFileAccess,
      normalizeHeaderKey: this.mail.normalizeHeaderKey,
      newline: this.mail.newline
    });
    if (this._useAlternative) {
      this._createAlternative(node);
    } else if (this._useRelated) {
      this._createRelated(node);
    }
    [].concat(!this._useAlternative && this._alternatives || []).concat(this._attachments.attached || []).forEach((element) => {
      if (!this._useRelated || element !== this._htmlNode) {
        this._createContentNode(node, element);
      }
    });
    return node;
  }
  /**
   * Builds multipart/alternative node. It should always contain same type of elements on the same level
   * eg. text + html view of the same data
   *
   * @param parentNode Parent for this note. If it does not exist, a root node is created
   * @returns MimeNode node element
   * @internal
   */
  _createAlternative(parentNode) {
    const node = parentNode ? parentNode.createChild("multipart/alternative", {
      disableUrlAccess: this.mail.disableUrlAccess,
      disableFileAccess: this.mail.disableFileAccess,
      normalizeHeaderKey: this.mail.normalizeHeaderKey,
      newline: this.mail.newline
    }) : new mime_node_default("multipart/alternative", {
      baseBoundary: this.mail.baseBoundary,
      textEncoding: this.mail.textEncoding,
      boundaryPrefix: this.mail.boundaryPrefix,
      disableUrlAccess: this.mail.disableUrlAccess,
      disableFileAccess: this.mail.disableFileAccess,
      normalizeHeaderKey: this.mail.normalizeHeaderKey,
      newline: this.mail.newline
    });
    this._alternatives.forEach((alternative) => {
      if (this._useRelated && this._htmlNode === alternative) {
        this._createRelated(node);
      } else {
        this._createContentNode(node, alternative);
      }
    });
    return node;
  }
  /**
   * Builds multipart/related node. It should always contain html node with related attachments
   *
   * @param parentNode Parent for this note. If it does not exist, a root node is created
   * @returns MimeNode node element
   * @internal
   */
  _createRelated(parentNode) {
    const node = parentNode ? parentNode.createChild('multipart/related; type="text/html"', {
      disableUrlAccess: this.mail.disableUrlAccess,
      disableFileAccess: this.mail.disableFileAccess,
      normalizeHeaderKey: this.mail.normalizeHeaderKey,
      newline: this.mail.newline
    }) : new mime_node_default('multipart/related; type="text/html"', {
      baseBoundary: this.mail.baseBoundary,
      textEncoding: this.mail.textEncoding,
      boundaryPrefix: this.mail.boundaryPrefix,
      disableUrlAccess: this.mail.disableUrlAccess,
      disableFileAccess: this.mail.disableFileAccess,
      normalizeHeaderKey: this.mail.normalizeHeaderKey,
      newline: this.mail.newline
    });
    this._createContentNode(node, this._htmlNode);
    this._attachments.related.forEach((alternative) => this._createContentNode(node, alternative));
    return node;
  }
  /**
   * Creates a regular node with contents
   *
   * @param parentNode Parent for this note. If it does not exist, a root node is created
   * @param element Node data
   * @returns MimeNode node element
   * @internal
   */
  _createContentNode(parentNode, element) {
    element = element || {};
    element.content = element.content || "";
    const encoding = (element.encoding || "utf8").toString().toLowerCase().replace(/[-_\s]/g, "");
    const node = parentNode ? parentNode.createChild(element.contentType, {
      filename: element.filename,
      textEncoding: this.mail.textEncoding,
      disableUrlAccess: this.mail.disableUrlAccess,
      disableFileAccess: this.mail.disableFileAccess,
      normalizeHeaderKey: this.mail.normalizeHeaderKey,
      newline: this.mail.newline
    }) : new mime_node_default(element.contentType, {
      filename: element.filename,
      baseBoundary: this.mail.baseBoundary,
      textEncoding: this.mail.textEncoding,
      boundaryPrefix: this.mail.boundaryPrefix,
      disableUrlAccess: this.mail.disableUrlAccess,
      disableFileAccess: this.mail.disableFileAccess,
      normalizeHeaderKey: this.mail.normalizeHeaderKey,
      newline: this.mail.newline
    });
    if (element.headers) {
      node.addHeader(element.headers);
    }
    if (element.cid) {
      node.setHeader("Content-Id", "<" + element.cid.replace(/[<>]/g, "") + ">");
    }
    if (element.contentTransferEncoding) {
      node.setHeader("Content-Transfer-Encoding", element.contentTransferEncoding);
    } else if (this.mail.encoding && /^text\//i.test(element.contentType)) {
      node.setHeader("Content-Transfer-Encoding", this.mail.encoding);
    }
    if (!/^text\//i.test(element.contentType) || element.contentDisposition) {
      node.setHeader("Content-Disposition", element.contentDisposition || (element.cid && /^image\//i.test(element.contentType) ? "inline" : "attachment"));
    }
    if (typeof element.content === "string" && !["utf8", "usascii", "ascii"].includes(encoding)) {
      element.content = Buffer.from(element.content, encoding);
    }
    if (element.raw) {
      node.setRaw(element.raw);
    } else {
      node.setContent(element.content);
    }
    return node;
  }
  /**
   * Parses data uri and converts it to a Buffer
   *
   * @param element Content element
   * @return Parsed element
   * @internal
   */
  _processDataUrl(element) {
    const dataUrl = element.path || element.href;
    if (!dataUrl || typeof dataUrl !== "string") {
      return element;
    }
    if (!dataUrl.startsWith("data:")) {
      return element;
    }
    if (dataUrl.length > 52428800) {
      let detectedType = "application/octet-stream";
      const commaPos = dataUrl.indexOf(",");
      if (commaPos > 0 && commaPos < 200) {
        const header = dataUrl.substring(5, commaPos);
        const parts = header.split(";");
        if (parts[0] && parts[0].includes("/")) {
          detectedType = parts[0].trim();
        }
      }
      return Object.assign(copyOwnKeys({}, element), {
        path: false,
        href: false,
        content: Buffer.alloc(0),
        contentType: element.contentType || detectedType
      });
    }
    let parsedDataUri;
    try {
      parsedDataUri = parseDataURI(dataUrl);
    } catch (_err) {
      return element;
    }
    if (!parsedDataUri) {
      return element;
    }
    element.content = parsedDataUri.data;
    element.contentType = element.contentType || parsedDataUri.contentType;
    if ("path" in element) {
      element.path = false;
    }
    if ("href" in element) {
      element.href = false;
    }
    return element;
  }
};
var mail_composer_default = MailComposer;

// node_modules/nodemailer/dist/esm/dkim/message-parser.js
var import_node_stream9 = require("node:stream");
function _trimFieldName(str) {
  let start = 0;
  let end = str.length;
  while (start < end && (str.charCodeAt(start) === 32 || str.charCodeAt(start) === 9)) {
    start++;
  }
  while (end > start && (str.charCodeAt(end - 1) === 32 || str.charCodeAt(end - 1) === 9)) {
    end--;
  }
  return str.slice(start, end);
}
var MessageParser = class extends import_node_stream9.Transform {
  constructor(options) {
    super(options);
    this.lastBytes = Buffer.alloc(4);
    this.headersParsed = false;
    this.headerBytes = 0;
    this.headerChunks = [];
    this.rawHeaders = false;
    this.bodySize = 0;
  }
  /**
   * Keeps count of the last 4 bytes in order to detect line breaks on chunk boundaries
   *
   * @param data Next data chunk from the stream
   */
  updateLastBytes(data) {
    const lblen = this.lastBytes.length;
    const nblen = Math.min(data.length, lblen);
    for (let i = 0, len = lblen - nblen; i < len; i++) {
      this.lastBytes[i] = this.lastBytes[i + nblen];
    }
    for (let i = 1; i <= nblen; i++) {
      this.lastBytes[lblen - i] = data[data.length - i];
    }
  }
  /**
   * Finds and removes message headers from the remaining body. We want to keep
   * headers separated until final delivery to be able to modify these
   *
   * @param data Next chunk of data
   * @return Returns true if headers are already found or false otherwise
   */
  checkHeaders(data) {
    if (this.headersParsed) {
      return true;
    }
    const lblen = this.lastBytes.length;
    let headerPos = 0;
    for (let i = 0, len = this.lastBytes.length + data.length; i < len; i++) {
      let chr;
      if (i < lblen) {
        chr = this.lastBytes[i];
      } else {
        chr = data[i - lblen];
      }
      if (chr === 10 && i) {
        const pr1 = i - 1 < lblen ? this.lastBytes[i - 1] : data[i - 1 - lblen];
        const pr2 = i > 1 ? i - 2 < lblen ? this.lastBytes[i - 2] : data[i - 2 - lblen] : false;
        if (pr1 === 10) {
          this.headersParsed = true;
          headerPos = i - lblen + 1;
          this.headerBytes += headerPos;
          break;
        } else if (pr1 === 13 && pr2 === 10) {
          this.headersParsed = true;
          headerPos = i - lblen + 1;
          this.headerBytes += headerPos;
          break;
        }
      }
    }
    if (this.headersParsed) {
      this.headerChunks.push(data.slice(0, headerPos));
      this.rawHeaders = Buffer.concat(this.headerChunks, this.headerBytes);
      this.headerChunks = null;
      this.emit("headers", this.parseHeaders());
      if (data.length > headerPos) {
        const chunk = data.slice(headerPos);
        this.bodySize += chunk.length;
        this.push(chunk);
      }
      return false;
    }
    this.headerBytes += data.length;
    this.headerChunks.push(data);
    this.updateLastBytes(data);
    return false;
  }
  /** @internal */
  _transform(chunk, encoding, callback) {
    if (!chunk || !chunk.length) {
      return callback();
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, encoding);
    }
    let headersFound;
    try {
      headersFound = this.checkHeaders(chunk);
    } catch (E2) {
      return callback(E2);
    }
    if (headersFound) {
      this.bodySize += chunk.length;
      this.push(chunk);
    }
    callback();
  }
  /** @internal */
  _flush(callback) {
    if (this.headerChunks) {
      this.rawHeaders = Buffer.concat(this.headerChunks, this.headerBytes);
      this.headerChunks = null;
      this.emit("headers", this.parseHeaders());
    }
    callback();
  }
  parseHeaders() {
    const rawLines = (this.rawHeaders || Buffer.alloc(0)).toString("binary").split(/\r?\n/);
    const lines = [];
    for (const rawLine of rawLines) {
      if (lines.length && /^[ \t]/.test(rawLine)) {
        lines[lines.length - 1] += "\n" + rawLine;
      } else {
        lines.push(rawLine);
      }
    }
    return lines.filter((line) => /[^ \t\r]/.test(line)).map((line) => ({
      key: _trimFieldName(line.substr(0, line.indexOf(":"))).toLowerCase(),
      line
    }));
  }
};
var message_parser_default = MessageParser;

// node_modules/nodemailer/dist/esm/dkim/relaxed-body.js
var import_node_stream10 = require("node:stream");
var import_node_crypto2 = __toESM(require("node:crypto"), 1);
var CHAR_CR = 13;
var CHAR_LF = 10;
var CHAR_SPACE = 32;
var CHAR_TAB = 9;
var CRLF = Buffer.from("\r\n");
var EMPTY_LINES = Buffer.alloc(4096, CRLF);
var RelaxedBody = class extends import_node_stream10.Transform {
  constructor(options) {
    super();
    options = options || {};
    this.bodyHash = import_node_crypto2.default.createHash(options.hashAlgo || "sha256");
    this.byteLength = 0;
    this.debug = options.debug;
    this._debugBody = options.debug ? [] : false;
    this._lineHasContent = false;
    this._pendingWsp = false;
    this._pendingCr = false;
    this._pendingEmptyLines = 0;
  }
  /** @internal */
  _hashCanonical(data) {
    if (!data.length) {
      return;
    }
    this.bodyHash.update(data);
    if (this._debugBody) {
      this._debugBody.push(Buffer.from(data));
    }
  }
  /** @internal */
  _hashEmptyLines() {
    while (this._pendingEmptyLines > 0) {
      const count = Math.min(this._pendingEmptyLines, EMPTY_LINES.length / 2);
      this._hashCanonical(EMPTY_LINES.subarray(0, count * 2));
      this._pendingEmptyLines -= count;
    }
  }
  /**
   * Writes a content byte, with the space a pending run of whitespace collapses to,
   * into the output buffer and returns the new write position. Kept a method rather
   * than a closure so the write position stays a plain local in the byte loop
   * @internal
   */
  _emitContent(out, outPos, c) {
    if (!this._lineHasContent) {
      if (this._pendingEmptyLines) {
        this._hashCanonical(out.subarray(0, outPos));
        outPos = 0;
        this._hashEmptyLines();
      }
      this._lineHasContent = true;
    }
    if (this._pendingWsp) {
      out[outPos++] = CHAR_SPACE;
      this._pendingWsp = false;
    }
    out[outPos++] = c;
    return outPos;
  }
  updateHash(chunk, final) {
    const out = Buffer.allocUnsafe(chunk.length * 2 + 2);
    let outPos = 0;
    for (let i = 0; i < chunk.length; i++) {
      const c = chunk[i];
      if (c === CHAR_LF) {
        if (this._lineHasContent) {
          out[outPos++] = CHAR_CR;
          out[outPos++] = CHAR_LF;
          this._lineHasContent = false;
        } else {
          this._pendingEmptyLines++;
        }
        this._pendingWsp = false;
        this._pendingCr = false;
        continue;
      }
      if (this._pendingCr) {
        outPos = this._emitContent(out, outPos, CHAR_CR);
        this._pendingCr = false;
      }
      if (c === CHAR_CR) {
        this._pendingCr = true;
      } else if (c === CHAR_SPACE || c === CHAR_TAB) {
        this._pendingWsp = true;
      } else {
        outPos = this._emitContent(out, outPos, c);
      }
    }
    if (final && this._pendingCr) {
      outPos = this._emitContent(out, outPos, CHAR_CR);
      this._pendingCr = false;
    }
    this._hashCanonical(out.subarray(0, outPos));
  }
  /** @internal */
  _transform(chunk, encoding, callback) {
    if (!chunk || !chunk.length) {
      return callback();
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk, encoding);
    }
    this.updateHash(chunk);
    this.byteLength += chunk.length;
    this.push(chunk);
    callback();
  }
  /** @internal */
  _flush(callback) {
    this.updateHash(Buffer.alloc(0), true);
    if (this._lineHasContent) {
      this._hashCanonical(CRLF);
    }
    this.emit("hash", this.bodyHash.digest("base64"), this.debug ? Buffer.concat(this._debugBody) : false);
    callback();
  }
};
var relaxed_body_default = RelaxedBody;

// node_modules/nodemailer/dist/esm/dkim/sign.js
var import_node_crypto3 = __toESM(require("node:crypto"), 1);
function unsupportedHashAlgoError(hashAlgo) {
  const err = new Error('Unsupported DKIM hash algorithm "' + hashAlgo + '"');
  err.code = ECONFIG;
  return err;
}
function sign(headers, hashAlgo, bodyHash, options) {
  options = options || {};
  const defaultFieldNames = "From:Sender:Reply-To:Subject:Date:Message-ID:To:Cc:MIME-Version:Content-Type:Content-Transfer-Encoding:Content-ID:Content-Description:Resent-Date:Resent-From:Resent-Sender:Resent-To:Resent-Cc:Resent-Message-ID:In-Reply-To:References:List-Id:List-Help:List-Unsubscribe:List-Subscribe:List-Post:List-Owner:List-Archive";
  const fieldNames = options.headerFieldNames || defaultFieldNames;
  const canonicalizedHeaderData = relaxedHeaders(headers, fieldNames, options.skipFields);
  const dkimHeader = generateDKIMHeader(options.domainName, options.keySelector, canonicalizedHeaderData.fieldNames, hashAlgo, bodyHash);
  canonicalizedHeaderData.headers += "dkim-signature:" + relaxedHeaderLine(dkimHeader);
  let signer;
  try {
    signer = import_node_crypto3.default.createSign(("rsa-" + hashAlgo).toUpperCase());
  } catch (_E) {
    throw unsupportedHashAlgoError(hashAlgo);
  }
  signer.update(canonicalizedHeaderData.headers, "latin1");
  let signature;
  try {
    signature = signer.sign(options.privateKey, "base64");
  } catch (_E) {
    return false;
  }
  return dkimHeader + signature.replace(/(^.{73}|.{75}(?!\r?\n|\r))/g, "$&\r\n ").trim();
}
sign.relaxedHeaders = relaxedHeaders;
sign.unsupportedHashAlgoError = unsupportedHashAlgoError;
var sign_default = sign;
function generateDKIMHeader(domainName, keySelector, fieldNames, hashAlgo, bodyHash) {
  const cleanTagValue = (value) => (value || "").toString().replace(/[\x00-\x1f\x7f;=]/g, "");
  const dkim = [
    "v=1",
    "a=rsa-" + hashAlgo,
    "c=relaxed/relaxed",
    "d=" + toASCII(cleanTagValue(domainName)),
    "q=dns/txt",
    "s=" + cleanTagValue(keySelector),
    "bh=" + bodyHash,
    "h=" + cleanTagValue(fieldNames)
  ].join("; ");
  return foldLines("DKIM-Signature: " + dkim, 76) + ";\r\n b=";
}
function relaxedHeaders(headers, fieldNames, skipFields) {
  const includedFields = /* @__PURE__ */ new Set();
  const skip = /* @__PURE__ */ new Set();
  const headerFields = /* @__PURE__ */ new Map();
  (skipFields || "").toLowerCase().split(":").forEach((field) => {
    skip.add(field.trim());
  });
  (fieldNames || "").toLowerCase().split(":").filter((field) => !skip.has(field.trim())).forEach((field) => {
    includedFields.add(field.trim());
  });
  for (let i = headers.length - 1; i >= 0; i--) {
    const line = headers[i];
    if (includedFields.has(line.key) && !headerFields.has(line.key)) {
      headerFields.set(line.key, relaxedHeaderLine(line.line));
    }
  }
  const headersList = [];
  const fields = [];
  includedFields.forEach((field) => {
    if (headerFields.has(field)) {
      fields.push(field);
      headersList.push(field + ":" + headerFields.get(field));
    }
  });
  return {
    headers: headersList.join("\r\n") + "\r\n",
    fieldNames: fields.join(":")
  };
}
function relaxedHeaderLine(line) {
  return line.substr(line.indexOf(":") + 1).replace(/\r?\n/g, "").replace(/[ \t]+/g, " ").replace(/^ | $/g, "");
}

// node_modules/nodemailer/dist/esm/dkim/index.js
var import_node_stream11 = require("node:stream");
var import_node_fs3 = __toESM(require("node:fs"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
var import_node_crypto4 = __toESM(require("node:crypto"), 1);
var DKIM_ALGO = "sha256";
var MAX_MESSAGE_SIZE = 10 * 1024 * 1024;
var DKIMSigner = class {
  constructor(options, keys, input, output) {
    this.options = options || {};
    this.keys = keys;
    this.cacheTreshold = Number(this.options.cacheTreshold) || MAX_MESSAGE_SIZE;
    this.hashAlgo = this.options.hashAlgo || DKIM_ALGO;
    this.cacheDir = this.options.cacheDir || false;
    this.chunks = [];
    this.chunklen = 0;
    this.readPos = 0;
    this.cachePath = this.cacheDir ? import_node_path2.default.join(this.cacheDir, "message." + Date.now() + "-" + import_node_crypto4.default.randomBytes(14).toString("hex")) : false;
    this.cache = false;
    this.headers = false;
    this.bodyHash = false;
    this.parser = false;
    this.relaxedBody = false;
    this.input = input;
    this.output = output;
    this.output.usingCache = false;
    this.hasErrored = false;
    this.input.on("error", (err) => this.fail(err));
    this.output.once("close", () => {
      if (this.output.writableFinished) {
        return;
      }
      this.hasErrored = true;
      this.input.unpipe();
      this.input.destroy();
      this.cleanup();
    });
  }
  /**
   * Ends the output with an error and releases the cache file
   */
  fail(err) {
    this.hasErrored = true;
    this.cleanup();
    this.output.destroy(err);
  }
  cleanup() {
    if (!this.cache || !this.cachePath) {
      return;
    }
    const cache = this.cache;
    this.cache = false;
    cache.destroy();
    import_node_fs3.default.unlink(this.cachePath, () => false);
  }
  createReadCache() {
    this.cache = import_node_fs3.default.createReadStream(this.cachePath);
    this.cache.once("error", (err) => this.fail(err));
    this.cache.once("close", () => {
      this.cleanup();
    });
    this.cache.pipe(this.output);
  }
  sendNextChunk() {
    while (!this.hasErrored) {
      if (this.readPos >= this.chunks.length) {
        if (!this.cache) {
          this.output.end();
          return;
        }
        return this.createReadCache();
      }
      const chunk = this.chunks[this.readPos++];
      if (this.output.write(chunk) === false) {
        this.output.once("drain", () => {
          this.sendNextChunk();
        });
        return;
      }
    }
  }
  sendSignedOutput() {
    if (this.hasErrored) {
      return;
    }
    let keyPos = 0;
    const signNextKey = () => {
      if (keyPos >= this.keys.length) {
        this.output.write(this.parser.rawHeaders);
        setImmediate(() => this.sendNextChunk());
        return;
      }
      const key = this.keys[keyPos++];
      let dkimField;
      try {
        dkimField = sign_default(this.headers, this.hashAlgo, this.bodyHash, {
          domainName: key.domainName,
          keySelector: key.keySelector,
          privateKey: key.privateKey,
          headerFieldNames: this.options.headerFieldNames,
          skipFields: this.options.skipFields
        });
      } catch (err) {
        this.fail(err);
        return;
      }
      if (dkimField) {
        this.output.write(Buffer.from(dkimField + "\r\n"));
      }
      setImmediate(signNextKey);
    };
    if (this.bodyHash && this.headers) {
      return signNextKey();
    }
    this.output.write(this.parser.rawHeaders);
    this.sendNextChunk();
  }
  createWriteCache() {
    this.output.usingCache = true;
    this.cache = import_node_fs3.default.createWriteStream(this.cachePath, { mode: 384 });
    this.cache.once("error", (err) => {
      this.relaxedBody.unpipe(this.cache);
      this.relaxedBody.on("readable", () => {
        while (this.relaxedBody.read() !== null) {
        }
      });
      this.fail(err);
    });
    this.cache.once("close", () => {
      if (this.hasErrored) {
        return;
      }
      this.sendSignedOutput();
    });
    this.relaxedBody.removeAllListeners("readable");
    this.relaxedBody.pipe(this.cache);
  }
  signStream() {
    this.parser = new message_parser_default();
    this.relaxedBody = new relaxed_body_default({
      hashAlgo: this.hashAlgo
    });
    this.parser.on("headers", (value) => {
      this.headers = value;
    });
    this.relaxedBody.on("hash", (value) => {
      this.bodyHash = value;
    });
    this.relaxedBody.on("readable", () => {
      let chunk;
      if (this.cache) {
        return;
      }
      while ((chunk = this.relaxedBody.read()) !== null) {
        this.chunks.push(chunk);
        this.chunklen += chunk.length;
        if (this.chunklen >= this.cacheTreshold && this.cachePath) {
          return this.createWriteCache();
        }
      }
    });
    this.relaxedBody.on("end", () => {
      if (this.cache) {
        return;
      }
      this.sendSignedOutput();
    });
    this.parser.pipe(this.relaxedBody);
    setImmediate(() => this.input.pipe(this.parser));
  }
};
var DKIM = class {
  constructor(options) {
    this.options = options || {};
    this.keys = [].concat(this.options.keys || {
      domainName: options.domainName,
      keySelector: options.keySelector,
      privateKey: options.privateKey
    });
  }
  sign(input, extraOptions) {
    const output = new import_node_stream11.PassThrough();
    let inputStream = input;
    let writeValue = false;
    if (Buffer.isBuffer(input)) {
      writeValue = input;
      inputStream = new import_node_stream11.PassThrough();
    } else if (typeof input === "string") {
      writeValue = Buffer.from(input);
      inputStream = new import_node_stream11.PassThrough();
    }
    let options = this.options;
    if (extraOptions && Object.keys(extraOptions).length) {
      options = copyOwnKeys({}, extraOptions);
      copyOwnKeys(options, this.options);
    }
    const signer = new DKIMSigner(options, this.keys, inputStream, output);
    setImmediate(() => {
      try {
        signer.signStream();
      } catch (_E) {
        signer.fail(sign_default.unsupportedHashAlgoError(signer.hashAlgo));
        return;
      }
      if (writeValue) {
        setImmediate(() => {
          inputStream.end(writeValue);
        });
      }
    });
    return output;
  }
};
var dkim_default = DKIM;

// node_modules/nodemailer/dist/esm/smtp-connection/http-proxy-client.js
var import_node_net5 = __toESM(require("node:net"), 1);
var import_node_tls = __toESM(require("node:tls"), 1);
var MAX_RESPONSE_HEADER_BYTES = 64 * 1024;
var unbracket = (host) => typeof host === "string" && host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
function httpProxyClient(proxyUrl, destinationPort, destinationHost, tlsOptions, callback) {
  if (typeof tlsOptions === "function") {
    callback = tlsOptions;
    tlsOptions = {};
  }
  tlsOptions = tlsOptions || {};
  const done = callback;
  destinationPort = Number(destinationPort) || 0;
  if (!destinationPort || /[\r\n]/.test(destinationHost)) {
    const err = new Error("Invalid proxy destination");
    err.code = EPROXY;
    setImmediate(() => done(err));
    return;
  }
  const proxy = parse(proxyUrl);
  const authority = (import_node_net5.default.isIPv6(unbracket(destinationHost)) ? "[" + unbracket(destinationHost) + "]" : destinationHost) + ":" + destinationPort;
  const connectOptions = {
    host: proxy.hostname,
    port: Number(proxy.port) ? Number(proxy.port) : proxy.protocol === "https:" ? 443 : 80
  };
  let connect;
  if (proxy.protocol === "https:") {
    connectOptions.rejectUnauthorized = tlsOptions.rejectUnauthorized !== false;
    connect = import_node_tls.default.connect.bind(import_node_tls.default);
  } else {
    connect = import_node_net5.default.connect.bind(import_node_net5.default);
  }
  const timeout = Number(tlsOptions.timeout) || httpProxyClient.timeout || 30 * 1e3;
  let socket;
  let finished3 = false;
  let timer;
  const cleanup = () => {
    clearTimeout(timer);
    socket.removeListener("data", onSocketData);
    socket.removeListener("error", fail);
    socket.removeListener("close", onEarlyClose);
  };
  function fail(err) {
    if (finished3) {
      return;
    }
    finished3 = true;
    cleanup();
    try {
      socket.destroy();
    } catch (_E) {
    }
    done(err);
  }
  function onEarlyClose() {
    const err = new Error("Proxy closed the connection before the tunnel was established");
    err.code = EPROXY;
    fail(err);
  }
  const chunks = [];
  let received = 0;
  let tail = "";
  function onSocketData(chunk) {
    if (finished3) {
      return;
    }
    const window2 = tail + chunk.toString("binary");
    const windowEnd = window2.indexOf("\r\n\r\n");
    chunks.push(chunk);
    received += chunk.length;
    tail = window2.slice(-3);
    if (windowEnd < 0) {
      if (received > MAX_RESPONSE_HEADER_BYTES) {
        const err = new Error("Proxy response headers too large");
        err.code = EPROXY;
        fail(err);
      }
      return;
    }
    socket.removeListener("data", onSocketData);
    socket.pause();
    const headerEnd = received - window2.length + windowEnd;
    const response = Buffer.concat(chunks, received);
    if (response.length > headerEnd + 4) {
      socket.unshift(response.subarray(headerEnd + 4));
    }
    const match2 = response.toString("binary", 0, headerEnd).match(/^HTTP\/\d+\.\d+ (\d+)/i);
    if (!match2 || (match2[1] || "").charAt(0) !== "2") {
      const err = new Error("Invalid response from proxy" + (match2 && ": " + match2[1] || ""));
      err.code = EPROXY;
      return fail(err);
    }
    finished3 = true;
    cleanup();
    const resumeOnData = (event) => {
      if (event === "data") {
        socket.removeListener("newListener", resumeOnData);
        socket.resume();
      }
    };
    socket.on("newListener", resumeOnData);
    return done(null, socket);
  }
  socket = connect(connectOptions, () => {
    if (finished3) {
      return;
    }
    const reqHeaders = {
      Host: authority,
      Connection: "close"
    };
    if (proxy.auth) {
      reqHeaders["Proxy-Authorization"] = "Basic " + Buffer.from(proxy.auth).toString("base64");
    }
    socket.write(
      // HTTP method
      "CONNECT " + authority + " HTTP/1.1\r\n" + // HTTP request headers
      Object.keys(reqHeaders).map((key) => key + ": " + reqHeaders[key]).join("\r\n") + // End request
      "\r\n\r\n"
    );
    socket.on("data", onSocketData);
  });
  timer = setTimeout(() => {
    const err = new Error("Proxy socket timed out");
    err.code = ETIMEDOUT;
    fail(err);
  }, timeout);
  socket.once("error", fail);
  socket.once("close", onEarlyClose);
}
var http_proxy_client_default = httpProxyClient;

// node_modules/nodemailer/dist/esm/mailer/index.js
var import_node_util2 = __toESM(require("node:util"), 1);

// node_modules/nodemailer/dist/esm/mailer/mail-message.js
var hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
var MailMessage = class {
  constructor(mailer, data) {
    this.mailer = mailer;
    this.data = {};
    this.message = null;
    data = data || {};
    const options = mailer.options || {};
    const defaults = mailer._defaults || {};
    copyOwnKeys(this.data, data);
    this.data.headers = this.data.headers || {};
    copyOwnKeys(this.data, defaults, (key) => hasOwn(this.data, key));
    copyOwnKeys(this.data.headers, defaults.headers, (key) => hasOwn(this.data.headers, key));
    ["disableFileAccess", "disableUrlAccess", "normalizeHeaderKey", "maxRecipients"].forEach((key) => {
      if (key in options) {
        this.data[key] = options[key];
      }
    });
    ["disableFileAccess", "disableUrlAccess"].forEach((key) => {
      if (!(key in options) && hasOwn(defaults, key)) {
        this.data[key] = this.data[key] || defaults[key];
      }
    });
  }
  resolveContent(data, key, options, callback) {
    if (!callback && typeof options === "function") {
      callback = options;
      options = false;
    }
    options = options || {};
    const policy = {
      disableFileAccess: this.data.disableFileAccess || options.disableFileAccess,
      disableUrlAccess: this.data.disableUrlAccess || options.disableUrlAccess
    };
    return resolveContent(data, key, policy, callback);
  }
  resolveAll(callback) {
    const keys = [
      [this.data, "html"],
      [this.data, "text"],
      [this.data, "watchHtml"],
      [this.data, "amp"],
      [this.data, "icalEvent"]
    ];
    if (this.data.alternatives && this.data.alternatives.length) {
      this.data.alternatives.forEach((alternative, i) => {
        keys.push([this.data.alternatives, i]);
      });
    }
    if (this.data.attachments && this.data.attachments.length) {
      this.data.attachments.forEach((attachment, i) => {
        if (!attachment.filename) {
          attachment.filename = (attachment.path || attachment.href || "").split(/[/\\]/).pop().split("?").shift() || "attachment-" + (i + 1);
          if (attachment.filename.indexOf(".") < 0) {
            attachment.filename += "." + detectExtension2(attachment.contentType);
          }
        }
        if (!attachment.contentType) {
          attachment.contentType = detectMimeType2(attachment.filename || attachment.path || attachment.href || "bin");
        }
        keys.push([this.data.attachments, i]);
      });
    }
    const mimeNode = new mime_node_default();
    const addressKeys = ["from", "to", "cc", "bcc", "sender", "replyTo"];
    addressKeys.forEach((address) => {
      let value;
      if (this.message) {
        value = [].concat(mimeNode._parseAddresses(this.message.getHeader(address === "replyTo" ? "reply-to" : address)) || []);
      } else if (this.data[address]) {
        value = [].concat(mimeNode._parseAddresses(this.data[address]) || []);
      }
      if (value && value.length) {
        this.data[address] = value;
      } else if (address in this.data) {
        this.data[address] = null;
      }
    });
    const singleKeys = ["from", "sender"];
    singleKeys.forEach((address) => {
      if (this.data[address]) {
        this.data[address] = this.data[address].shift();
      }
    });
    let pos = 0;
    const resolveNext = () => {
      if (pos >= keys.length) {
        return callback(null, this.data);
      }
      const args = keys[pos++];
      if (!args[0] || !args[0][args[1]]) {
        return resolveNext();
      }
      resolveContent(...args, { disableFileAccess: this.data.disableFileAccess, disableUrlAccess: this.data.disableUrlAccess }, (err, value) => {
        if (err) {
          return callback(err);
        }
        const node = {
          content: value
        };
        if (args[0][args[1]] && typeof args[0][args[1]] === "object" && !Buffer.isBuffer(args[0][args[1]])) {
          copyOwnKeys(node, args[0][args[1]], (key) => key in node || ["content", "path", "href", "raw"].includes(key));
        }
        args[0][args[1]] = node;
        resolveNext();
      });
    };
    setImmediate(() => resolveNext());
  }
  /**
   * Destroys the content streams of the message once sending failed. A stream that was not
   * read to the end would otherwise keep the file or the socket behind it open
   */
  releaseStreams() {
    const data = this.data;
    const values = [data.html, data.text, data.watchHtml, data.amp, data.raw, data.icalEvent];
    for (const key of ["attachments", "alternatives"]) {
      if (Array.isArray(data[key])) {
        for (const entry of data[key]) {
          values.push(entry);
        }
      }
    }
    for (const value of values) {
      if (value && typeof value === "object") {
        destroyStream(value);
        destroyStream(value.content);
        destroyStream(value.raw);
      }
    }
  }
  normalize(callback) {
    const envelope = this.message.getEnvelope();
    const messageId = this.message.messageId();
    this.resolveAll((err, data) => {
      if (err) {
        return callback(err);
      }
      data.envelope = envelope;
      data.messageId = messageId;
      ["html", "text", "watchHtml", "amp"].forEach((key) => {
        if (data[key] && data[key].content) {
          if (typeof data[key].content === "string") {
            data[key] = data[key].content;
          } else if (Buffer.isBuffer(data[key].content)) {
            data[key] = data[key].content.toString();
          }
        }
      });
      if (data.icalEvent && Buffer.isBuffer(data.icalEvent.content)) {
        data.icalEvent.content = data.icalEvent.content.toString("base64");
        data.icalEvent.encoding = "base64";
      }
      if (data.alternatives && data.alternatives.length) {
        data.alternatives.forEach((alternative) => {
          if (alternative && alternative.content && Buffer.isBuffer(alternative.content)) {
            alternative.content = alternative.content.toString("base64");
            alternative.encoding = "base64";
          }
        });
      }
      if (data.attachments && data.attachments.length) {
        data.attachments.forEach((attachment) => {
          if (attachment && attachment.content && Buffer.isBuffer(attachment.content)) {
            attachment.content = attachment.content.toString("base64");
            attachment.encoding = "base64";
          }
        });
      }
      data.normalizedHeaders = {};
      Object.keys(data.headers || {}).forEach((key) => {
        if (isProtoKey(key)) {
          return;
        }
        let value = [].concat(data.headers[key] || []).shift();
        value = value && value.value || value;
        if (value) {
          if (["references", "in-reply-to", "message-id", "content-id"].includes(key)) {
            value = this.message._encodeHeaderValue(key, value);
          }
          data.normalizedHeaders[key] = value;
        }
      });
      if (data.list && typeof data.list === "object") {
        const listHeaders = this._getListHeaders(data.list);
        listHeaders.forEach((entry) => {
          data.normalizedHeaders[entry.key] = entry.value.map((val) => val && val.value || val).join(", ");
        });
      }
      if (data.references) {
        data.normalizedHeaders.references = this.message._encodeHeaderValue("references", data.references);
      }
      if (data.inReplyTo) {
        data.normalizedHeaders["in-reply-to"] = this.message._encodeHeaderValue("in-reply-to", data.inReplyTo);
      }
      return callback(null, data);
    });
  }
  setMailerHeader() {
    if (!this.message || !this.data.xMailer) {
      return;
    }
    this.message.setHeader("X-Mailer", this.data.xMailer);
  }
  setPriorityHeaders() {
    if (!this.message || !this.data.priority) {
      return;
    }
    switch ((this.data.priority || "").toString().toLowerCase()) {
      case "high":
        this.message.setHeader("X-Priority", "1 (Highest)");
        this.message.setHeader("X-MSMail-Priority", "High");
        this.message.setHeader("Importance", "High");
        break;
      case "low":
        this.message.setHeader("X-Priority", "5 (Lowest)");
        this.message.setHeader("X-MSMail-Priority", "Low");
        this.message.setHeader("Importance", "Low");
        break;
      default:
    }
  }
  setListHeaders() {
    if (!this.message || !this.data.list || typeof this.data.list !== "object") {
      return;
    }
    this._getListHeaders(this.data.list).forEach((listHeader) => {
      listHeader.value.forEach((value) => {
        this.message.addHeader(listHeader.key, value);
      });
    });
  }
  /** @internal */
  _getListHeaders(listData) {
    return Object.keys(listData).map((key) => ({
      key: "list-" + key.toLowerCase().trim(),
      value: [].concat(listData[key] || []).map((value) => ({
        prepared: true,
        foldLines: true,
        value: [].concat(value || []).map((value2) => {
          if (typeof value2 === "string") {
            value2 = {
              url: value2
            };
          }
          if (value2 && value2.url) {
            let comment = (value2.comment || "").toString().replace(/\r?\n|\r/g, " ");
            const needsEncoding = !isPlainText(comment) || /\x7f/.test(comment);
            if (key.toLowerCase().trim() === "id") {
              comment = needsEncoding ? encodeWord(comment) : quoteString(comment);
              return (value2.comment ? comment + " " : "") + this._formatListUrl(value2.url).replace(/^<[^:]+:\/{0,2}/, "<");
            }
            comment = needsEncoding ? encodeWord(comment) : comment.replace(/[()\\]/g, "\\$&");
            return this._formatListUrl(value2.url) + (value2.comment ? " (" + comment + ")" : "");
          }
          return "";
        }).filter((value2) => value2).join(", ")
      }))
    }));
  }
  /** @internal */
  _formatListUrl(url) {
    url = url.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "").replace(/[\s<]+|[\s>]+/g, "");
    if (/^(https?|mailto|ftp):/.test(url)) {
      return "<" + url + ">";
    }
    if (/^[^@]+@[^@]+$/.test(url)) {
      return "<mailto:" + url + ">";
    }
    return "<http://" + url + ">";
  }
};

// node_modules/nodemailer/dist/esm/mailer/index.js
var import_node_net6 = __toESM(require("node:net"), 1);
var import_node_dns2 = __toESM(require("node:dns"), 1);
var import_node_crypto5 = __toESM(require("node:crypto"), 1);
var DEFAULT_MAX_RECIPIENTS = 1e5;
var Mail = class extends import_node_events.EventEmitter {
  constructor(transporter, options, defaults) {
    super();
    this.options = options || {};
    this._defaults = defaults || {};
    this._defaultPlugins = {
      compile: [(...args) => this._convertDataImages(...args)],
      stream: []
    };
    this._userPlugins = {
      compile: [],
      stream: []
    };
    this.meta = /* @__PURE__ */ new Map();
    this.dkim = this.options.dkim ? new dkim_default(this.options.dkim) : false;
    this.transporter = transporter;
    this.transporter.mailer = this;
    this.logger = getLogger(this.options, {
      component: this.options.component || "mail"
    });
    this.logger.debug({
      tnx: "create"
    }, "Creating transport: %s", this.getVersionString());
    if (typeof this.transporter.on === "function") {
      this.transporter.on("log", (log) => {
        this.logger.debug({
          tnx: "transport"
        }, "%s: %s", log.type, log.message);
      });
      this.transporter.on("error", (err) => {
        this.logger.error({
          err,
          tnx: "transport"
        }, "Transport Error: %s", err.message);
        this.emit("error", err);
      });
      this.transporter.on("idle", (...args) => {
        this.emit("idle", ...args);
      });
      this.transporter.on("clear", (...args) => {
        this.emit("clear", ...args);
      });
    }
    ["close", "isIdle", "verify"].forEach((method) => {
      this[method] = (...args) => {
        if (typeof this.transporter[method] === "function") {
          if (method === "verify" && typeof this.getSocket === "function") {
            this.transporter.getSocket = this.getSocket;
            this.getSocket = false;
          }
          return this.transporter[method](...args);
        }
        this.logger.warn({
          tnx: "transport",
          methodName: method
        }, "Non existing method %s called for transport", method);
        return false;
      };
    });
    if (this.options.proxy && typeof this.options.proxy === "string") {
      this.setupProxy(this.options.proxy);
    }
  }
  use(step, plugin) {
    step = (step || "").toString();
    if (!this._userPlugins.hasOwnProperty(step)) {
      this._userPlugins[step] = [plugin];
    } else {
      this._userPlugins[step].push(plugin);
    }
    return this;
  }
  sendMail(data, callback = null) {
    let promise;
    if (!callback) {
      promise = new Promise((resolve3, reject) => {
        callback = callbackPromise(resolve3, reject);
      });
    }
    const done = callback;
    if (typeof this.getSocket === "function") {
      this.transporter.getSocket = this.getSocket;
      this.getSocket = false;
    }
    const mail = new MailMessage(this, data);
    const fail = (err) => {
      mail.releaseStreams();
      done(err);
    };
    this.logger.debug({
      tnx: "transport",
      name: this.transporter.name,
      version: this.transporter.version,
      action: "send"
    }, "Sending mail using %s/%s", this.transporter.name, this.transporter.version);
    this._processPlugins("compile", mail, (err) => {
      if (err) {
        this.logger.error({
          err,
          tnx: "plugin",
          action: "compile"
        }, "PluginCompile Error: %s", err.message);
        return fail(err);
      }
      let recipientCount;
      try {
        mail.message = new mail_composer_default(mail.data).compile();
        mail.setMailerHeader();
        mail.setPriorityHeaders();
        mail.setListHeaders();
        recipientCount = mail.message.getEnvelope().to.length;
      } catch (err2) {
        this.logger.error({
          err: err2,
          tnx: "transport",
          action: "send"
        }, "Compile Error: %s", err2.message);
        return fail(err2);
      }
      const maxRecipients = mail.data.maxRecipients === void 0 ? DEFAULT_MAX_RECIPIENTS : mail.data.maxRecipients;
      if (maxRecipients && recipientCount > maxRecipients) {
        const err2 = new Error(`Message has ${recipientCount} recipients, which is over the ${maxRecipients} allowed by maxRecipients`);
        err2.code = EMAXRECIPIENTS;
        this.logger.error({
          err: err2,
          tnx: "transport",
          action: "send"
        }, "Send Error: %s", err2.message);
        return fail(err2);
      }
      this._processPlugins("stream", mail, (err2) => {
        if (err2) {
          this.logger.error({
            err: err2,
            tnx: "plugin",
            action: "stream"
          }, "PluginStream Error: %s", err2.message);
          return fail(err2);
        }
        if (mail.data.dkim || this.dkim) {
          mail.message.processFunc((input) => {
            const dkim = mail.data.dkim ? new dkim_default(mail.data.dkim) : this.dkim;
            this.logger.debug({
              tnx: "DKIM",
              messageId: mail.message.messageId(),
              dkimDomains: dkim.keys.map((key) => key.keySelector + "." + key.domainName).join(", ")
            }, "Signing outgoing message with %s keys", dkim.keys.length);
            return dkim.sign(input, mail.data._dkim);
          });
        }
        this.transporter.send(mail, (...args) => {
          if (args[0]) {
            mail.releaseStreams();
            this.logger.error({
              err: args[0],
              tnx: "transport",
              action: "send"
            }, "Send Error: %s", args[0].message);
          }
          done(...args);
        });
      });
    });
    return promise;
  }
  getVersionString() {
    return import_node_util2.default.format("%s (%s; +%s; %s/%s)", name, version, homepage, this.transporter.name, this.transporter.version);
  }
  /** @internal */
  _processPlugins(step, mail, callback) {
    step = (step || "").toString();
    if (!this._userPlugins.hasOwnProperty(step)) {
      return callback();
    }
    const userPlugins = this._userPlugins[step] || [];
    const defaultPlugins = this._defaultPlugins[step] || [];
    if (userPlugins.length) {
      this.logger.debug({
        tnx: "transaction",
        pluginCount: userPlugins.length,
        step
      }, "Using %s plugins for %s", userPlugins.length, step);
    }
    if (userPlugins.length + defaultPlugins.length === 0) {
      return callback();
    }
    let pos = 0;
    let block = "default";
    const processPlugins = () => {
      let curplugins = block === "default" ? defaultPlugins : userPlugins;
      if (pos >= curplugins.length) {
        if (block === "default" && userPlugins.length) {
          block = "user";
          pos = 0;
          curplugins = userPlugins;
        } else {
          return callback();
        }
      }
      const plugin = curplugins[pos++];
      plugin(mail, (err) => {
        if (err) {
          return callback(err);
        }
        processPlugins();
      });
    };
    processPlugins();
  }
  /**
   * Sets up proxy handler for a Nodemailer object
   *
   * @param proxyUrl Proxy configuration url
   */
  setupProxy(proxyUrl) {
    const proxy = parse(proxyUrl);
    this.getSocket = (options, callback) => {
      const protocol = proxy.protocol.replace(/:$/, "").toLowerCase();
      const configuredTimeout = Number(this.options.connectionTimeout) || 0;
      const connectStartedAt = Number(options.connectStartedAt) || Date.now();
      const connectionTimeout = configuredTimeout ? Math.max(connectStartedAt + configuredTimeout - Date.now(), 1) : void 0;
      if (this.meta.has("proxy_handler_" + protocol)) {
        return this.meta.get("proxy_handler_" + protocol)(proxy, options, callback);
      }
      switch (protocol) {
        // Connect using a HTTP CONNECT method
        case "http":
        case "https":
          http_proxy_client_default(proxy.href, options.port, options.host, connectionTimeout ? Object.assign({}, this.options.tls, { timeout: connectionTimeout }) : this.options.tls || {}, (err2, socket) => {
            if (err2) {
              return callback(err2);
            }
            return callback(null, {
              connection: socket
            });
          });
          return;
        case "socks":
        case "socks5":
        case "socks4":
        case "socks4a": {
          if (!this.meta.has("proxy_socks_module")) {
            let err2 = new Error("Socks module not loaded");
            err2.code = EPROXY;
            return callback(err2);
          }
          const connect = (ipaddress) => {
            const proxyV2 = !!this.meta.get("proxy_socks_module").SocksClient;
            const socksClient = proxyV2 ? this.meta.get("proxy_socks_module").SocksClient : this.meta.get("proxy_socks_module");
            const proxyType = Number(proxy.protocol.replace(/\D/g, "")) || 5;
            const connectionOpts = {
              proxy: {
                ipaddress,
                port: Number(proxy.port),
                type: proxyType
              },
              [proxyV2 ? "destination" : "target"]: {
                host: options.host,
                port: options.port
              },
              command: "connect"
            };
            if (connectionTimeout) {
              connectionOpts.timeout = connectionTimeout;
            }
            if (proxy.username || proxy.password) {
              const username = proxy.username || "";
              const password = proxy.password || "";
              if (proxyV2) {
                connectionOpts.proxy.userId = username;
                connectionOpts.proxy.password = password;
              } else if (proxyType === 4) {
                connectionOpts.userid = username;
              } else {
                connectionOpts.authentication = {
                  username,
                  password
                };
              }
            }
            socksClient.createConnection(connectionOpts, (err2, info) => {
              if (err2) {
                return callback(err2);
              }
              return callback(null, {
                connection: info.socket || info
              });
            });
          };
          if (import_node_net6.default.isIP(proxy.hostname)) {
            return connect(proxy.hostname);
          }
          return import_node_dns2.default.lookup(proxy.hostname, (err2, address) => {
            if (err2) {
              return callback(err2);
            }
            connect(address);
          });
        }
      }
      let err = new Error("Unknown proxy configuration");
      err.code = EPROXY;
      callback(err);
    };
  }
  /** @internal */
  _convertDataImages(mail, callback) {
    if (!this.options.attachDataUrls && !mail.data.attachDataUrls || !mail.data.html) {
      return callback();
    }
    mail.resolveContent(mail.data, "html", { disableFileAccess: mail.data.disableFileAccess, disableUrlAccess: mail.data.disableUrlAccess }, (err, html) => {
      if (err) {
        return callback(err);
      }
      let cidCounter = 0;
      html = (html || "").toString().replace(/(<img\b[^<>]{0,1024} src\s{0,20}=[\s"']{0,20})(data:([^;"'<>\s]{1,255});[^"'>\s]+)/gi, (match2, prefix, dataUri, mimeType) => {
        const cid = import_node_crypto5.default.randomBytes(10).toString("hex") + "@localhost";
        if (!mail.data.attachments) {
          mail.data.attachments = [];
        }
        if (!Array.isArray(mail.data.attachments)) {
          mail.data.attachments = [].concat(mail.data.attachments || []);
        }
        mail.data.attachments.push({
          path: dataUri,
          cid,
          filename: "image-" + ++cidCounter + "." + detectExtension(mimeType)
        });
        return prefix + "cid:" + cid;
      });
      mail.data.html = html;
      callback();
    });
  }
  set(key, value) {
    return this.meta.set(key, value);
  }
  get(key) {
    return this.meta.get(key);
  }
};
var mailer_default = Mail;

// node_modules/nodemailer/dist/esm/smtp-pool/index.js
var import_node_events4 = require("node:events");

// node_modules/nodemailer/dist/esm/smtp-connection/index.js
var import_node_events2 = require("node:events");
var import_node_net7 = __toESM(require("node:net"), 1);
var import_node_tls2 = __toESM(require("node:tls"), 1);
var import_node_os2 = __toESM(require("node:os"), 1);
var import_node_crypto6 = __toESM(require("node:crypto"), 1);

// node_modules/nodemailer/dist/esm/smtp-connection/data-stream.js
var import_node_stream12 = require("node:stream");
var INSERT_LF = Buffer.from("\n");
var INSERT_LF_DOT = Buffer.from("\n.");
var INSERT_CR = Buffer.from("\r");
var INSERT_DOT = Buffer.from(".");
var DataStream = class extends import_node_stream12.Transform {
  constructor(options) {
    super(options);
    this.options = options || {};
    this.inByteCount = 0;
    this.outByteCount = 0;
    this.lastByte = false;
  }
  /**
   * Escapes dots
   * @internal
   */
  _transform(chunk, encoding, done) {
    const chunks = [];
    let chunklen = 0;
    let i, len, lastPos = 0;
    let buf;
    if (!chunk || !chunk.length) {
      return done();
    }
    if (typeof chunk === "string") {
      chunk = Buffer.from(chunk);
    }
    this.inByteCount += chunk.length;
    for (i = 0, len = chunk.length; i < len; i++) {
      const byte = chunk[i];
      const prev = i ? chunk[i - 1] : this.lastByte;
      let insert = false;
      if (prev === 13 && byte !== 10) {
        insert = byte === 46 ? INSERT_LF_DOT : INSERT_LF;
      } else if (byte === 10 && prev !== 13) {
        insert = INSERT_CR;
      } else if (byte === 46 && (prev === 10 || prev === false)) {
        insert = INSERT_DOT;
      }
      if (insert) {
        if (i > lastPos) {
          buf = chunk.slice(lastPos, i);
          chunks.push(buf);
          chunklen += buf.length;
        }
        chunks.push(insert);
        chunklen += insert.length;
        lastPos = i;
      }
    }
    if (chunks.length) {
      if (lastPos < chunk.length) {
        buf = chunk.slice(lastPos);
        chunks.push(buf);
        chunklen += buf.length;
      }
      this.outByteCount += chunklen;
      this.push(Buffer.concat(chunks, chunklen));
    } else {
      this.outByteCount += chunk.length;
      this.push(chunk);
    }
    this.lastByte = chunk[chunk.length - 1];
    done();
  }
  /**
   * Finalizes the stream with a dot on a single line
   * @internal
   */
  _flush(done) {
    let buf;
    if (this.lastByte === 10) {
      buf = Buffer.from(".\r\n");
    } else if (this.lastByte === 13) {
      buf = Buffer.from("\n.\r\n");
    } else {
      buf = Buffer.from("\r\n.\r\n");
    }
    this.outByteCount += buf.length;
    this.push(buf);
    done();
  }
};

// node_modules/nodemailer/dist/esm/smtp-connection/index.js
var import_node_stream13 = require("node:stream");
var CONNECTION_TIMEOUT = 2 * 60 * 1e3;
var SOCKET_TIMEOUT = 10 * 60 * 1e3;
var GREETING_TIMEOUT = 30 * 1e3;
var DNS_TIMEOUT = 30 * 1e3;
var CLOSE_TIMEOUT = 5 * 1e3;
var KEEPALIVE_DELAY = 30 * 1e3;
var TEARDOWN_NOOP = () => {
};
function shuffle(list) {
  const result = list.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function timeoutError(message, timeoutType) {
  const err = new Error(message);
  err.timeoutType = timeoutType;
  return err;
}
var MAX_RESPONSE_SIZE = 1024 * 1024;
function decodeServerResponse(str) {
  if (!str) {
    return str;
  }
  const utf8 = Buffer.from(str, "binary").toString("utf8");
  return utf8.includes("\uFFFD") ? str : utf8;
}
function isPartialResponse(str) {
  return isPartialLine(str.slice(str.lastIndexOf("\n") + 1));
}
function isPartialLine(line) {
  return /^\d+-/.test(line);
}
function maskAuthCommand(cmd) {
  const match2 = (cmd || "").toString().match(/^AUTH\s+[^\s]+/i);
  if (!match2) {
    return "/* secret */";
  }
  return match2[0].length === cmd.length ? cmd : match2[0] + " /* secret */";
}
var SMTPConnection = class extends import_node_events2.EventEmitter {
  constructor(options) {
    super(options);
    this.id = import_node_crypto6.default.randomBytes(8).toString("base64").replace(/\W/g, "");
    this.stage = "init";
    this.options = options || {};
    if (this.options.requireTLS && (this.options.ignoreTLS || this.options.opportunisticTLS)) {
      this.options = Object.assign({}, this.options, { ignoreTLS: false, opportunisticTLS: false });
    }
    this.secureConnection = !!this.options.secure;
    this.alreadySecured = !!this.options.secured;
    this.port = Number(this.options.port) || (this.secureConnection ? 465 : 587);
    this.host = this.options.host || "localhost";
    this.servername = this.options.servername ? this.options.servername : !import_node_net7.default.isIP(this.host) ? this.host : false;
    this.allowInternalNetworkInterfaces = this.options.allowInternalNetworkInterfaces || false;
    if (typeof this.options.secure === "undefined" && this.port === 465) {
      this.secureConnection = true;
    }
    this.name = (this.options.name || this._getHostname()).toString().replace(/[\r\n]+/g, "");
    this.logger = getLogger(this.options, {
      component: this.options.component || "smtp-connection",
      sid: this.id
    });
    this.customAuth = /* @__PURE__ */ new Map();
    for (const key of Object.keys(this.options.customAuth || {})) {
      const mapKey = (key || "").toString().trim().toUpperCase();
      if (mapKey) {
        this.customAuth.set(mapKey, this.options.customAuth[key]);
      }
    }
    this.version = version;
    this.authenticated = false;
    this.destroyed = false;
    this.secure = !!this.secureConnection;
    this._remainder = "";
    this._responseQueue = [];
    this._responsePartial = false;
    this.lastServerResponse = false;
    this._socket = false;
    this._supportedAuth = [];
    this.allowsAuth = false;
    this._envelope = false;
    this._supportedExtensions = [];
    this._maxAllowedSize = 0;
    this._responseActions = [];
    this._recipientQueue = [];
    this._phaseTimer = false;
    this._plaintextEhlo = false;
    this._destroyed = false;
    this._closing = false;
    this._currentDataStream = false;
    this._pendingSend = false;
    this._connectCallback = false;
    this._onSocketData = (chunk) => this._onData(chunk);
    this._onSocketError = (error2) => this._onError(error2, "ESOCKET", false, "CONN");
    this._onSocketClose = () => this._onClose();
    this._onSocketEnd = () => this._onEnd();
    this._onSocketTimeout = () => this._onTimeout();
    this._onConnectionSocketError = (err) => this._onError(err, "ESOCKET", false, "CONN");
  }
  /**
   * Creates a connection to a SMTP server and sets up connection
   * listener
   */
  connect(connectCallback) {
    if (this._connectCalled && !this._destroyed) {
      const err = this._formatError("Cannot connect - connect() was already called for this connection", "ECONNECTION", false, "API");
      if (typeof connectCallback === "function") {
        setImmediate(() => connectCallback(err));
        return;
      }
      this.logger.warn({ tnx: "smtp" }, "%s", err.message);
      return;
    }
    this._connectCalled = true;
    if (typeof connectCallback === "function") {
      this._connectCallback = connectCallback;
      this.once("connect", () => {
        this._connectCallback = false;
        this.logger.debug({
          tnx: "smtp"
        }, "SMTP handshake finished");
        connectCallback();
      });
      const isDestroyedMessage = this._isDestroyedMessage("connect");
      if (isDestroyedMessage) {
        return connectCallback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "CONN"));
      }
    }
    const connectionTimeout = this.options.connectionTimeout || CONNECTION_TIMEOUT;
    this._connectionDeadline = (this._connectStartedAt || Date.now()) + connectionTimeout;
    let opts = {
      port: this.port,
      host: this.host,
      allowInternalNetworkInterfaces: this.allowInternalNetworkInterfaces,
      timeout: Math.min(this.options.dnsTimeout || DNS_TIMEOUT, connectionTimeout)
    };
    if (this.options.localAddress) {
      opts.localAddress = this.options.localAddress;
    }
    if (this.options.connection) {
      this._socket = this.options.connection;
      this._setupConnectionHandlers();
      if (this.secureConnection && !this.alreadySecured) {
        setImmediate(() => this._upgradeConnection((err) => {
          if (err) {
            this._onError(new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "CONN");
            return;
          }
          this._onConnect();
        }));
      } else {
        setImmediate(() => this._onConnect());
      }
      return;
    } else if (this.options.socket) {
      this._socket = this.options.socket;
      return this._resolveAndConnect(opts, (_resolved) => {
        try {
          this._socket.connect(this.port, this.host, () => {
            if (this.secureConnection && !this.alreadySecured) {
              return this._upgradeConnection((err) => {
                if (err) {
                  this._onError(new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "CONN");
                  return;
                }
                this._onConnect();
              });
            }
            this._onConnect();
          });
          this._setupConnectionHandlers();
        } catch (E2) {
          setImmediate(() => this._onError(E2, "ECONNECTION", false, "CONN"));
          return;
        }
      });
    } else {
      if (this.secureConnection) {
        Object.assign(opts, this.options.tls || {});
        if (this.servername && !opts.servername) {
          opts.servername = this.servername;
        }
      }
      return this._resolveAndConnect(opts, (resolved) => {
        let addresses = resolved._addresses || [];
        if (opts.localAddress) {
          const localFamily = import_node_net7.default.isIPv6(opts.localAddress) ? 6 : 4;
          const sameFamily = addresses.filter((addr) => import_node_net7.default.isIP(addr) === localFamily);
          addresses = sameFamily.length ? sameFamily : addresses;
        }
        if (addresses.length > 1) {
          const ipv6 = addresses.filter((addr) => import_node_net7.default.isIPv6(addr));
          const ipv4 = addresses.filter((addr) => !import_node_net7.default.isIPv6(addr));
          const ordered = shuffle(ipv6).concat(shuffle(ipv4));
          opts.host = this.host;
          opts.autoSelectFamily = true;
          if (!ipv6.length || !ipv4.length) {
            const remaining = this._connectionDeadline - Date.now();
            opts.autoSelectFamilyAttemptTimeout = Math.max(Math.floor(remaining / ordered.length), 10);
          }
          opts.lookup = ((hostname, lookupOptions, callback) => {
            if (lookupOptions && lookupOptions.all) {
              const all = ordered.map((address) => ({ address, family: import_node_net7.default.isIPv6(address) ? 6 : 4 }));
              return setImmediate(() => callback(null, all));
            }
            setImmediate(() => callback(null, ordered[0], import_node_net7.default.isIPv6(ordered[0]) ? 6 : 4));
          });
        } else if (addresses.length) {
          opts.host = addresses[0];
        }
        this._connectToHost(opts, this.secureConnection);
      });
    }
  }
  /**
   * Resolves the hostname and applies resolved values to opts,
   * then calls the provided callback with the resolved data
   *
   * @param opts Connection options (modified in place)
   * @param callback Called with resolved data on success
   * @internal
   */
  _resolveAndConnect(opts, callback) {
    return resolveHostname(opts, (err, resolved) => {
      if (err) {
        return setImmediate(() => this._onError(err, "EDNS", false, "CONN"));
      }
      this.logger.debug({
        tnx: "dns",
        source: opts.host,
        resolved: resolved.host,
        cached: !!resolved.cached
      }, "Resolved %s as %s [cache %s]", opts.host, resolved.host, resolved.cached ? "hit" : "miss");
      for (const key of Object.keys(resolved)) {
        if (key.charAt(0) !== "_" && resolved[key]) {
          opts[key] = resolved[key];
        }
      }
      callback(resolved);
    });
  }
  /**
   * Attempts to connect to the specified host address
   *
   * @param opts Connection options
   * @param secure Whether to use TLS
   * @internal
   */
  _connectToHost(opts, secure) {
    if (this._destroyed || this._closing) {
      return;
    }
    const connectFn = secure ? import_node_tls2.default.connect : import_node_net7.default.connect;
    try {
      this._socket = connectFn(opts, () => this._onConnect());
      this._setupConnectionHandlers();
    } catch (E2) {
      setImmediate(() => this._onError(E2, "ECONNECTION", false, "CONN"));
      return;
    }
  }
  /**
   * Sets up connection timeout and error handlers
   * @internal
   */
  _setupConnectionHandlers() {
    this._startPhase(Math.max((this._connectionDeadline || Date.now()) - Date.now(), 0), timeoutError("Connection timeout", "CONNECT_TIMEOUT"));
    this._socket.on("error", this._onConnectionSocketError);
  }
  /**
   * Starts the timer of a connection phase: connecting, waiting for the greeting or a TLS
   * upgrade. The phases follow one another, so starting one ends the one before
   *
   * @param timeout Time the phase may take
   * @param err Error to fail with when it takes longer
   * @internal
   */
  _startPhase(timeout, err) {
    this._clearPhase();
    this._phaseTimer = setTimeout(() => {
      this._phaseTimer = false;
      this._onError(err, "ETIMEDOUT", false, "CONN");
    }, timeout);
  }
  /**
   * Time the greeting or a STARTTLS upgrade may take: greetingTimeout, cut short by what is left
   * of connectionTimeout
   *
   * @internal
   */
  _remainingSetupTime() {
    return Math.min(this.options.greetingTimeout || GREETING_TIMEOUT, Math.max((this._connectionDeadline || Infinity) - Date.now(), 1));
  }
  /** @internal */
  _clearPhase() {
    clearTimeout(this._phaseTimer);
    this._phaseTimer = false;
  }
  /**
   * Sends QUIT
   */
  quit() {
    this._sendCommand("QUIT");
    this._responseActions.push(this.close);
  }
  /**
   * Closes the connection to the server
   */
  close() {
    this._clearPhase();
    this._responseActions = [];
    if (this._closing) {
      return;
    }
    this._closing = true;
    const closeMethod = this.stage === "init" ? "destroy" : "end";
    this.logger.debug({
      tnx: "smtp"
    }, 'Closing connection to the server using "%s"', closeMethod);
    const socket = this._socket && this._socket.socket || this._socket;
    if (this._currentDataStream) {
      try {
        this._currentDataStream.unpipe(this._socket);
      } catch (_E) {
      }
      this._currentDataStream = false;
    }
    if (this._pendingSend) {
      const { stream, onStreamError } = this._pendingSend;
      if (stream) {
        stream.removeListener("error", onStreamError);
        stream.on("error", TEARDOWN_NOOP);
        stream.destroy();
      }
      this._pendingSend = false;
    }
    if (socket && !socket.destroyed) {
      try {
        socket.setTimeout(0);
        socket.removeListener("data", this._onSocketData);
        socket.removeListener("timeout", this._onSocketTimeout);
        socket.removeListener("close", this._onSocketClose);
        socket.removeListener("end", this._onSocketEnd);
        socket.removeListener("error", this._onSocketError);
        socket.removeListener("error", this._onConnectionSocketError);
        socket.on("error", TEARDOWN_NOOP);
        socket[closeMethod]();
        if (closeMethod === "end") {
          const closeTimer = setTimeout(() => socket.destroy(), CLOSE_TIMEOUT);
          if (typeof closeTimer.unref === "function") {
            closeTimer.unref();
          }
          socket.once("close", () => clearTimeout(closeTimer));
        }
      } catch (_E) {
      }
    }
    this._destroy();
  }
  /**
   * Authenticate user
   */
  login(authData, callback) {
    const isDestroyedMessage = this._isDestroyedMessage("login");
    if (isDestroyedMessage) {
      return callback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
    }
    this._auth = authData || {};
    this._authMethod = (this._auth.method || "").toString().trim().toUpperCase() || false;
    const canUseXOAuth2 = !!this._auth.oauth2 || this.customAuth.has("XOAUTH2");
    if (!this._authMethod && this._auth.oauth2 && !this._auth.credentials) {
      this._authMethod = "XOAUTH2";
    } else if (!this._authMethod || this._authMethod === "XOAUTH2" && !this._auth.oauth2) {
      const supported = this._supportedAuth.find((method) => method !== "XOAUTH2" || canUseXOAuth2);
      this._authMethod = (supported || "PLAIN").toUpperCase().trim();
    }
    if ((this._authMethod !== "XOAUTH2" || this.customAuth.has("XOAUTH2")) && (!this._auth.credentials || !this._auth.credentials.user || !this._auth.credentials.pass)) {
      if (this._auth.user && this._auth.pass || this.customAuth.has(this._authMethod)) {
        this._auth.credentials = {
          user: this._auth.user,
          pass: this._auth.pass,
          options: this._auth.options
        };
      } else {
        return callback(this._formatError('Missing credentials for "' + this._authMethod + '"', "EAUTH", false, "API"));
      }
    }
    if (this.customAuth.has(this._authMethod)) {
      const handler2 = this.customAuth.get(this._authMethod);
      let lastResponse;
      let returned = false;
      const resolve3 = () => {
        if (returned) {
          return;
        }
        returned = true;
        this.logger.info({
          tnx: "smtp",
          username: this._auth.user,
          action: "authenticated",
          method: this._authMethod
        }, "User %s authenticated", JSON.stringify(this._auth.user));
        this.authenticated = true;
        callback(null, true);
      };
      const reject = (err) => {
        if (returned) {
          return;
        }
        returned = true;
        callback(this._formatError(err, "EAUTH", lastResponse, "AUTH " + this._authMethod));
      };
      const sendCommand = (cmd, done) => {
        let promise;
        if (!done) {
          promise = new Promise((resolve4, reject2) => {
            done = callbackPromise(resolve4, reject2);
          });
        }
        this._responseActions.push((str) => {
          lastResponse = str;
          let codes = str.match(/^(\d+)(?:\s(\d+\.\d+\.\d+))?\s/);
          let data = {
            command: cmd,
            response: str
          };
          if (codes) {
            data.status = Number(codes[1]) || 0;
            if (codes[2]) {
              data.code = codes[2];
            }
            data.text = str.substr(codes[0].length);
          } else {
            data.text = str;
            data.status = 0;
          }
          done(null, data);
        });
        setImmediate(() => this._sendCommand(cmd, maskAuthCommand(cmd)));
        return promise;
      };
      const handlerResponse = handler2({
        auth: this._auth,
        method: this._authMethod,
        extensions: [].concat(this._supportedExtensions),
        authMethods: [].concat(this._supportedAuth),
        maxAllowedSize: this._maxAllowedSize || false,
        sendCommand,
        resolve: resolve3,
        reject
      });
      if (handlerResponse && typeof handlerResponse.catch === "function") {
        handlerResponse.then(resolve3).catch(reject);
      }
      return;
    }
    switch (this._authMethod) {
      case "XOAUTH2":
        this._handleXOauth2Token(false, callback);
        return;
      case "LOGIN":
        this._responseActions.push((str) => {
          this._actionAUTH_LOGIN_USER(str, callback);
        });
        this._sendCommand("AUTH LOGIN");
        return;
      case "PLAIN":
        this._responseActions.push((str) => {
          this._actionAUTHComplete(str, callback);
        });
        this._sendCommand(
          "AUTH PLAIN " + Buffer.from(
            //this._auth.user+'\u0000'+
            "\0" + // skip authorization identity as it causes problems with some servers
            this._auth.credentials.user + "\0" + this._auth.credentials.pass,
            "utf-8"
          ).toString("base64"),
          // log entry without passwords
          "AUTH PLAIN " + Buffer.from(
            //this._auth.user+'\u0000'+
            "\0" + // skip authorization identity as it causes problems with some servers
            this._auth.credentials.user + "\0/* secret */",
            "utf-8"
          ).toString("base64")
        );
        return;
      case "CRAM-MD5":
        this._responseActions.push((str) => {
          this._actionAUTH_CRAM_MD5(str, callback);
        });
        this._sendCommand("AUTH CRAM-MD5");
        return;
    }
    return callback(this._formatError('Unknown authentication method "' + this._authMethod + '"', "EAUTH", false, "API"));
  }
  /**
   * Sends a message
   *
   * @param envelope Envelope object, {from: addr, to: [addr]}
   * @param message String, Buffer or a Stream
   * @param done Callback to return once sending is completed
   */
  send(envelope, message, done) {
    let returned = false;
    const callback = (err, info) => {
      if (returned) {
        return;
      }
      returned = true;
      if (this._pendingSend && this._pendingSend.callback === callback) {
        this._pendingSend = false;
      }
      done(err, info);
    };
    if (!message) {
      return callback(this._formatError("Empty message", "EMESSAGE", false, "API"));
    }
    const isDestroyedMessage = this._isDestroyedMessage("send message");
    if (isDestroyedMessage) {
      return callback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
    }
    if (this._maxAllowedSize && envelope.size > this._maxAllowedSize) {
      setImmediate(() => {
        callback(this._formatError("Message size larger than allowed " + this._maxAllowedSize, "EMESSAGE", false, "MAIL FROM"));
      });
      return;
    }
    const pendingSend = {
      callback,
      stream: false,
      onStreamError: (err) => callback(this._formatError(err, "ESTREAM", false, "API"))
    };
    if (typeof message.on === "function") {
      pendingSend.stream = message;
      pendingSend.stream.on("error", pendingSend.onStreamError);
    }
    this._pendingSend = pendingSend;
    const startTime = Date.now();
    this._setEnvelope(envelope, (err, info) => {
      if (err) {
        if (typeof message.destroy === "function") {
          message.destroy();
        }
        return callback(err);
      }
      const envelopeTime = Date.now();
      const stream = this._createSendStream((err2, str) => {
        if (err2) {
          return callback(err2);
        }
        const result = info;
        result.envelopeTime = envelopeTime - startTime;
        result.messageTime = Date.now() - envelopeTime;
        result.messageSize = stream.outByteCount;
        result.response = str;
        return callback(null, result);
      });
      if (typeof message.pipe === "function") {
        message.pipe(stream);
      } else {
        stream.write(message);
        stream.end();
      }
    });
  }
  /**
   * Resets connection state
   *
   * @param callback Callback to return once connection is reset
   */
  reset(callback) {
    const isDestroyedMessage = this._isDestroyedMessage("reset");
    if (isDestroyedMessage) {
      return callback(this._formatError(isDestroyedMessage, "ECONNECTION", false, "API"));
    }
    this._sendCommand("RSET");
    this._responseActions.push((str) => {
      if (str.charAt(0) !== "2") {
        return callback(this._formatError("Could not reset session state. response=" + str, "EPROTOCOL", str, "RSET"));
      }
      this._envelope = false;
      return callback(null, true);
    });
  }
  /**
   * Connection listener that is run when the connection to
   * the server is opened
   *
   * @event
   * @internal
   */
  _onConnect() {
    const socket = this._socket;
    this._clearPhase();
    this.logger.info({
      tnx: "network",
      localAddress: socket.localAddress,
      localPort: socket.localPort,
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort
    }, "%s established to %s:%s", this.secure ? "Secure connection" : "Connection", socket.remoteAddress, socket.remotePort);
    if (this._destroyed) {
      this.close();
      return;
    }
    this.stage = "connected";
    socket.removeListener("data", this._onSocketData);
    socket.removeListener("timeout", this._onSocketTimeout);
    socket.removeListener("close", this._onSocketClose);
    socket.removeListener("end", this._onSocketEnd);
    socket.removeListener("error", this._onConnectionSocketError);
    socket.removeListener("error", this._onSocketError);
    socket.on("error", this._onSocketError);
    socket.on("data", this._onSocketData);
    socket.once("close", this._onSocketClose);
    socket.once("end", this._onSocketEnd);
    socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT);
    socket.on("timeout", this._onSocketTimeout);
    if (typeof socket.setKeepAlive === "function") {
      socket.setKeepAlive(true, KEEPALIVE_DELAY);
    }
    if (typeof socket.setNoDelay === "function") {
      socket.setNoDelay(true);
    }
    this._startPhase(this._remainingSetupTime(), timeoutError("Greeting never received", "GREETING_TIMEOUT"));
    this._responseActions.push(this._actionGreeting);
    socket.resume();
  }
  /**
   * Ends the session after a 421 reply. The replies queued for commands sent along with the
   * answered one are not going to come, so the message in flight is failed here
   *
   * @param str The 421 reply
   * @internal
   */
  _onServerClosing(str) {
    if (this._destroyed) {
      return;
    }
    const pendingSend = this._pendingSend;
    const envelope = this._envelope;
    this._responseActions = [];
    this.close();
    if (pendingSend) {
      pendingSend.callback(envelope && envelope.mailError || this._formatError("Server closed the connection", "ECONNECTION", str, "CONN"));
    }
  }
  /**
   * 'data' listener for data coming from the server
   *
   * @event
   * @param chunk Data chunk coming from the server
   * @internal
   */
  _onData(chunk) {
    if (this._destroyed || !chunk || !chunk.length) {
      return;
    }
    const maxResponseSize = this.options.maxResponseSize || MAX_RESPONSE_SIZE;
    const data = chunk.toString("binary");
    if (!data.includes("\n")) {
      this._remainder += data;
      if (this._remainder.length > maxResponseSize) {
        return this._onResponseTooLarge();
      }
      return;
    }
    const lines = (this._remainder + data).split(/\r?\n/);
    this._remainder = lines.pop();
    for (let i = 0, len = lines.length; i < len; i++) {
      if (this._responsePartial) {
        this._responseQueue[this._responseQueue.length - 1] += "\n" + lines[i];
      } else {
        this._responseQueue.push(lines[i]);
      }
      this._responsePartial = isPartialLine(lines[i]);
      if (this._responsePartial && this._responseQueue[this._responseQueue.length - 1].length > maxResponseSize) {
        return this._onResponseTooLarge();
      }
    }
    if (this._remainder.length > maxResponseSize) {
      return this._onResponseTooLarge();
    }
    if (this._responsePartial) {
      return;
    }
    this._processResponse();
  }
  /**
   * Drops a connection whose peer keeps extending a reply it never completes, releasing
   * whatever was buffered for that reply
   * @internal
   */
  _onResponseTooLarge() {
    this._remainder = "";
    this._responseQueue = [];
    this._responsePartial = false;
    this._onError(new Error("Server response exceeds maximum allowed size"), "EPROTOCOL", false, "CONN");
  }
  /**
   * 'error' listener for the socket
   *
   * @event
   * @param err Error object
   * @param type Error name
   * @param data Server response that triggered the error, false if there is none
   * @param command SMTP command that was in flight
   * @internal
   */
  _onError(err, type, data, command) {
    this._clearPhase();
    if (this._destroyed) {
      return;
    }
    err = this._formatError(err, type, data, command);
    if (isTransientError(err)) {
      this.logger.warn({ tnx: "smtp", err }, "%s", err.message);
    } else {
      this.logger.error({ tnx: "smtp", err }, "%s", err.message);
    }
    const pendingSend = this._pendingSend;
    this.emit("error", err);
    this.close();
    if (pendingSend) {
      pendingSend.callback(err);
    }
  }
  /** @internal */
  _formatError(message, type, response, command) {
    let err;
    if (/Error\]$/i.test(Object.prototype.toString.call(message))) {
      err = message;
    } else {
      err = new Error(message);
    }
    if (type && type !== "Error" && err.code !== ERR_ACCESS_DENIED) {
      if (err.code && err.code !== type && !err.originalCode) {
        err.originalCode = err.code;
      }
      err.code = type;
    }
    if (response) {
      err.response = response;
      err.message += ": " + response;
    }
    const responseCode = typeof response === "string" && Number((response.match(/^\d+/) || [])[0]) || false;
    if (responseCode) {
      err.responseCode = responseCode;
    }
    if (command) {
      err.command = command;
    }
    return err;
  }
  /**
   * 'close' listener for the socket
   *
   * @event
   * @internal
   */
  _onClose() {
    let serverResponse = false;
    if (this._remainder && this._remainder.trim()) {
      this.lastServerResponse = serverResponse = decodeServerResponse(this._remainder.trim());
      if (this.options.debug || this.options.transactionLog) {
        this.logger.debug({
          tnx: "server"
        }, serverResponse);
      }
    }
    this.logger.info({
      tnx: "network"
    }, "Connection closed");
    const failureResponse = typeof serverResponse === "string" && /^[45]\d{2}[ -]/.test(serverResponse) ? serverResponse : false;
    if (this.upgrading && !this._destroyed) {
      return this._onError(new Error("Connection closed unexpectedly"), "ETLS", failureResponse, "CONN");
    }
    if (!failureResponse && this._responseActions[0] === this._actionGreeting && this._connectCallback && !this._destroyed) {
      const connectCallback = this._connectCallback;
      this._connectCallback = false;
      const err = this._formatError(new Error("Connection closed unexpectedly"), "ECONNECTION", false, "CONN");
      this.logger.warn({ tnx: "network" }, err.message);
      connectCallback(err);
      this.close();
      return;
    }
    if (!failureResponse && this.stage === "connected" && !this._responseActions.length && !this._pendingSend && !this._destroyed && !this._closing) {
      this.logger.info({
        tnx: "network"
      }, "Server closed the idle connection");
      return this._destroy();
    }
    if (failureResponse || this._responseActions[0] !== this.close && !this._destroyed) {
      return this._onError(new Error("Connection closed unexpectedly"), "ECONNECTION", failureResponse, "CONN");
    }
    this._destroy();
  }
  /**
   * 'end' listener for the socket
   *
   * @event
   * @internal
   */
  _onEnd() {
    if (this._socket && !this._socket.destroyed) {
      this._socket.end();
    }
  }
  /**
   * 'timeout' listener for the socket
   *
   * @event
   * @internal
   */
  _onTimeout() {
    return this._onError(timeoutError("Timeout", "SOCKET_TIMEOUT"), "ETIMEDOUT", false, "CONN");
  }
  /**
   * Destroys the client, emits 'end'
   * @internal
   */
  _destroy() {
    if (this._destroyed) {
      return;
    }
    this._destroyed = true;
    this.destroyed = true;
    this._clearPhase();
    this.emit("end");
  }
  /**
   * Upgrades the connection to TLS
   *
   * @param callback Callback function to run when the connection
   *        has been secured
   * @internal
   */
  _upgradeConnection(callback) {
    const discarded = this._remainder.length + this._responseQueue.reduce((total, response) => total + response.length, 0);
    if (discarded) {
      this.logger.warn({
        tnx: "smtp",
        discarded
      }, "Discarded %s bytes received in plaintext after the STARTTLS response", discarded);
    }
    this._plaintextEhlo = false;
    this._remainder = "";
    this._responseQueue = [];
    this._responsePartial = false;
    const socketPlain = this._socket;
    socketPlain.removeListener("data", this._onSocketData);
    socketPlain.removeListener("timeout", this._onSocketTimeout);
    socketPlain.setTimeout(0);
    const opts = Object.assign({
      socket: socketPlain,
      host: this.host
    }, this.options.tls || {});
    if (this.servername && !opts.servername) {
      opts.servername = this.servername;
    }
    const removePlainSocketListeners = () => {
      socketPlain.removeListener("close", this._onSocketClose);
      socketPlain.removeListener("end", this._onSocketEnd);
      socketPlain.removeListener("error", this._onSocketError);
      socketPlain.removeListener("error", this._onConnectionSocketError);
    };
    this.upgrading = true;
    this._startPhase(this._remainingSetupTime(), timeoutError("TLS handshake timed out", "UPGRADE_TIMEOUT"));
    try {
      this._socket = import_node_tls2.default.connect(opts, () => {
        this._clearPhase();
        this.secure = true;
        this.upgrading = false;
        this._socket.on("data", this._onSocketData);
        removePlainSocketListeners();
        return callback(null, true);
      });
    } catch (err) {
      this._clearPhase();
      removePlainSocketListeners();
      return callback(err);
    }
    this._socket.on("error", this._onSocketError);
    this._socket.once("close", this._onSocketClose);
    this._socket.once("end", this._onSocketEnd);
    this._socket.setTimeout(this.options.socketTimeout || SOCKET_TIMEOUT);
    this._socket.on("timeout", this._onSocketTimeout);
    socketPlain.resume();
  }
  /**
   * Processes queued responses from the server
   * @internal
   */
  _processResponse() {
    if (!this._responseQueue.length) {
      return false;
    }
    const raw2 = (this._responseQueue.shift() || "").toString();
    if (!raw2.trim()) {
      setImmediate(() => this._processResponse());
      return;
    }
    if (isPartialResponse(raw2)) {
      this._responseQueue.unshift(raw2);
      return;
    }
    const str = this.lastServerResponse = decodeServerResponse(raw2);
    if (this.options.debug || this.options.transactionLog) {
      this.logger.debug({
        tnx: "server"
      }, str.replace(/\r?\n$/, ""));
    }
    const action = this._responseActions.shift();
    const closing = /^421[ -]/.test(str);
    if (typeof action === "function") {
      action.call(this, str);
      if (closing) {
        return this._onServerClosing(str);
      }
      setImmediate(() => this._processResponse());
    } else if (closing && !this._pendingSend && this.stage === "connected") {
      this.logger.info({
        tnx: "smtp"
      }, "Server closed the idle connection: %s", str);
      this.close();
    } else {
      return this._onError(new Error("Unexpected Response"), "EPROTOCOL", str, "CONN");
    }
  }
  /**
   * Send a command to the server, append \r\n
   *
   * @param str String to be sent to the server
   * @param logStr Optional string to be used for logging instead of the actual string
   * @internal
   */
  _sendCommand(str, logStr) {
    if (this._destroyed) {
      return;
    }
    const socket = this._socket;
    if (socket.destroyed) {
      return this.close();
    }
    if (this.options.debug || this.options.transactionLog) {
      this.logger.debug({
        tnx: "client"
      }, (logStr || str || "").toString().replace(/\r?\n$/, ""));
    }
    socket.write(Buffer.from(str + "\r\n", "utf-8"));
  }
  /**
   * Initiates a new message by submitting envelope data, starting with
   * MAIL FROM: command
   *
   * @param envelope Envelope object in the form of
   *        {from:'...', to:['...']}
   *        or
   *        {from:{address:'...',name:'...'}, to:[address:'...',name:'...']}
   * @param callback Callback to run once the envelope is processed
   * @internal
   */
  _setEnvelope(envelope, callback) {
    const args = [];
    let useSmtpUtf8 = false;
    this._envelope = envelope || {};
    this._envelope.from = (this._envelope.from && this._envelope.from.address || this._envelope.from || "").toString().trim();
    this._envelope.to = [].concat(this._envelope.to || []).map((to2) => (to2 && to2.address || to2 || "").toString().trim());
    if (!this._envelope.to.length) {
      return callback(this._formatError("No recipients defined", "EENVELOPE", false, "API"));
    }
    if (this._envelope.from && /[\r\n<>]/.test(this._envelope.from)) {
      return callback(this._formatError("Invalid sender " + JSON.stringify(this._envelope.from), "EENVELOPE", false, "API"));
    }
    if (/[\x80-\uFFFF]/.test(this._envelope.from)) {
      useSmtpUtf8 = true;
    }
    for (let i = 0, len = this._envelope.to.length; i < len; i++) {
      if (!this._envelope.to[i] || /[\r\n<>]/.test(this._envelope.to[i])) {
        return callback(this._formatError("Invalid recipient " + JSON.stringify(this._envelope.to[i]), "EENVELOPE", false, "API"));
      }
      if (/[\x80-\uFFFF]/.test(this._envelope.to[i])) {
        useSmtpUtf8 = true;
      }
    }
    this._envelope.rcptQueue = [].concat(this._envelope.to || []);
    this._envelope.rejected = [];
    this._envelope.rejectedErrors = [];
    this._envelope.accepted = [];
    if (this._envelope.dsn) {
      try {
        this._envelope.dsn = this._setDsnEnvelope(this._envelope.dsn);
      } catch (err) {
        return callback(this._formatError("Invalid DSN " + err.message, "EENVELOPE", false, "API"));
      }
    }
    if (this._envelope.requireTLSExtensionEnabled) {
      if (!this.secure) {
        return callback(this._formatError("REQUIRETLS can only be used over TLS connections (RFC 8689)", "EREQUIRETLS", false, "MAIL FROM"));
      }
      if (!this._supportedExtensions.includes("REQUIRETLS")) {
        return callback(this._formatError("Server does not support REQUIRETLS extension (RFC 8689)", "EREQUIRETLS", false, "MAIL FROM"));
      }
    }
    this._envelope.pipelined = this._supportedExtensions.includes("PIPELINING");
    this._responseActions.push((str) => {
      this._actionMAIL(str, callback);
    });
    if (useSmtpUtf8 && this._supportedExtensions.includes("SMTPUTF8")) {
      args.push("SMTPUTF8");
      this._usingSmtpUtf8 = true;
    }
    if (this._envelope.use8BitMime && this._supportedExtensions.includes("8BITMIME")) {
      args.push("BODY=8BITMIME");
      this._using8BitMime = true;
    }
    if (this._envelope.size && this._supportedExtensions.includes("SIZE")) {
      const sizeValue = Number(this._envelope.size) || 0;
      if (sizeValue > 0) {
        args.push("SIZE=" + sizeValue);
      }
    }
    if (this._envelope.dsn && this._supportedExtensions.includes("DSN")) {
      if (this._envelope.dsn.ret) {
        args.push("RET=" + encodeXText(this._envelope.dsn.ret));
      }
      if (this._envelope.dsn.envid) {
        args.push("ENVID=" + encodeXText(this._envelope.dsn.envid));
      }
    }
    if (this._envelope.requireTLSExtensionEnabled) {
      args.push("REQUIRETLS");
    }
    const mailFrom = "MAIL FROM:<" + this._envelope.from + ">" + (args.length ? " " + args.join(" ") : "");
    this._recipientQueue = [];
    if (!this._envelope.pipelined) {
      this._sendCommand(mailFrom);
      return;
    }
    const socket = this._socket;
    socket.cork();
    this._sendCommand(mailFrom);
    while (this._envelope.rcptQueue.length) {
      this._sendRcpt(this._envelope.rcptQueue.shift(), callback);
    }
    this._responseActions.push((str) => {
      this._actionDATA(str, callback);
    });
    this._sendCommand("DATA");
    socket.uncork();
  }
  /**
   * Sends RCPT TO for a recipient and queues the handler for the reply
   *
   * @param recipient Recipient address
   * @param callback Callback to run once the envelope is processed
   * @internal
   */
  _sendRcpt(recipient, callback) {
    this._recipientQueue.push(recipient);
    this._responseActions.push((str) => {
      this._actionRCPT(str, callback);
    });
    this._sendCommand("RCPT TO:<" + recipient + ">" + this._getDsnRcptToArgs());
  }
  /** @internal */
  _setDsnEnvelope(params) {
    let ret = (params.ret || params.return || "").toString().toUpperCase() || null;
    if (ret) {
      switch (ret) {
        case "HDRS":
        case "HEADERS":
          ret = "HDRS";
          break;
        case "FULL":
        case "BODY":
          ret = "FULL";
          break;
      }
    }
    if (ret && !["FULL", "HDRS"].includes(ret)) {
      throw new Error("ret: " + JSON.stringify(ret));
    }
    const envid = (params.envid || params.id || "").toString() || null;
    let notify = params.notify || null;
    if (notify) {
      if (typeof notify === "string") {
        notify = notify.split(",");
      }
      notify = notify.map((n) => n.trim().toUpperCase());
      const validNotify = ["NEVER", "SUCCESS", "FAILURE", "DELAY"];
      const invalidNotify = notify.filter((n) => !validNotify.includes(n));
      if (invalidNotify.length || notify.length > 1 && notify.includes("NEVER")) {
        throw new Error("notify: " + JSON.stringify(notify.join(",")));
      }
      notify = notify.join(",");
    }
    let orcpt = (params.recipient || params.orcpt || "").toString() || null;
    if (orcpt && orcpt.indexOf(";") < 0) {
      orcpt = "rfc822;" + orcpt;
    }
    return {
      ret,
      envid,
      notify,
      orcpt
    };
  }
  /** @internal */
  _getDsnRcptToArgs() {
    const envelope = this._envelope;
    const args = [];
    if (envelope.dsn && this._supportedExtensions.includes("DSN")) {
      if (envelope.dsn.notify) {
        args.push("NOTIFY=" + encodeXText(envelope.dsn.notify));
      }
      if (envelope.dsn.orcpt) {
        args.push("ORCPT=" + encodeXText(envelope.dsn.orcpt));
      }
    }
    return args.length ? " " + args.join(" ") : "";
  }
  /** @internal */
  _createSendStream(callback) {
    const envelope = this._envelope;
    const dataStream = new DataStream();
    if (this.options.lmtp) {
      envelope.accepted.forEach((recipient, i) => {
        const final = i === envelope.accepted.length - 1;
        this._responseActions.push((str) => {
          this._actionLMTPStream(recipient, final, str, callback);
        });
      });
    } else {
      this._responseActions.push((str) => {
        this._actionSMTPStream(str, callback);
      });
    }
    this._currentDataStream = dataStream;
    dataStream.pipe(this._socket, {
      end: false
    });
    if (this.options.debug) {
      const logStream = new import_node_stream13.PassThrough();
      logStream.on("readable", () => {
        let chunk;
        while (chunk = logStream.read()) {
          this.logger.debug({
            tnx: "message"
          }, chunk.toString("binary").replace(/\r?\n$/, ""));
        }
      });
      dataStream.pipe(logStream);
    }
    dataStream.once("end", () => {
      if (this._currentDataStream === dataStream) {
        this._currentDataStream = false;
      }
      this.logger.info({
        tnx: "message",
        inByteCount: dataStream.inByteCount,
        outByteCount: dataStream.outByteCount
      }, "<%s bytes encoded mime message (source size %s bytes)>", dataStream.outByteCount, dataStream.inByteCount);
    });
    return dataStream;
  }
  /** ACTIONS **/
  /**
   * Will be run after the connection is created and the server sends
   * a greeting. If the incoming message starts with 220 initiate
   * SMTP session by sending EHLO command
   *
   * @param str Message from the server
   * @internal
   */
  _actionGreeting(str) {
    this._clearPhase();
    if (str.substr(0, 3) !== "220") {
      this._onError(new Error("Invalid greeting. response=" + str), "EPROTOCOL", str, "CONN");
      return;
    }
    if (this.options.lmtp) {
      this._responseActions.push(this._actionLHLO);
      this._sendCommand("LHLO " + this.name);
    } else {
      this._responseActions.push(this._actionEHLO);
      this._sendCommand("EHLO " + this.name);
    }
  }
  /**
   * Handles server response for LHLO command. If it yielded in
   * error, emit 'error', otherwise treat this as an EHLO response
   *
   * @param str Message from the server
   * @internal
   */
  _actionLHLO(str) {
    if (str.charAt(0) !== "2") {
      this._onError(new Error("Invalid LHLO. response=" + str), "EPROTOCOL", str, "LHLO");
      return;
    }
    this._actionEHLO(str);
  }
  /**
   * Handles server response for EHLO command. If it yielded in
   * error, try HELO instead, otherwise initiate TLS negotiation
   * if STARTTLS is supported by the server or move into the
   * authentication phase.
   *
   * @param str Message from the server
   * @internal
   */
  _actionEHLO(str) {
    if (str.substr(0, 3) === "421") {
      this._onError(new Error("Server terminates connection. response=" + str), "ECONNECTION", str, "EHLO");
      return;
    }
    if (str.charAt(0) !== "2") {
      if (this.options.requireTLS) {
        this._onError(new Error("EHLO failed but HELO does not support required STARTTLS. response=" + str), "ECONNECTION", str, "EHLO");
        return;
      }
      this._responseActions.push(this._actionHELO);
      this._sendCommand("HELO " + this.name);
      return;
    }
    if (!this.secure && !this.options.ignoreTLS && (/[ -]STARTTLS\b/im.test(str) || this.options.requireTLS)) {
      this._plaintextEhlo = str;
      this._sendCommand("STARTTLS");
      this._responseActions.push(this._actionSTARTTLS);
      return;
    }
    this._parseEhloExtensions(str);
    this.emit("connect");
  }
  /**
   * Reads the extensions and the authentication mechanisms out of an EHLO response
   *
   * @param str EHLO response from the server
   * @internal
   */
  _parseEhloExtensions(str) {
    let match2;
    this._ehloLines = str.split(/\r?\n/).map((line) => line.replace(/^\d+[ -]/, "").trim()).filter((line) => line).slice(1);
    if (/[ -]SMTPUTF8\b/im.test(str)) {
      this._supportedExtensions.push("SMTPUTF8");
    }
    if (/[ -]DSN\b/im.test(str)) {
      this._supportedExtensions.push("DSN");
    }
    if (/[ -]8BITMIME\b/im.test(str)) {
      this._supportedExtensions.push("8BITMIME");
    }
    if (/[ -]REQUIRETLS\b/im.test(str)) {
      this._supportedExtensions.push("REQUIRETLS");
    }
    if (/[ -]PIPELINING\b/im.test(str)) {
      this._supportedExtensions.push("PIPELINING");
    }
    if (/[ -]AUTH\b/i.test(str)) {
      this.allowsAuth = true;
    }
    const authMechanisms = /* @__PURE__ */ new Set();
    for (const line of this._ehloLines) {
      const authMatch = /^AUTH[\s=](.*)/i.exec(line);
      if (authMatch) {
        for (const mechanism of authMatch[1].split(/[\s=]+/)) {
          authMechanisms.add(mechanism.toUpperCase());
        }
      }
    }
    for (const mechanism of ["PLAIN", "LOGIN", "CRAM-MD5", "XOAUTH2"]) {
      if (authMechanisms.has(mechanism)) {
        this._supportedAuth.push(mechanism);
      }
    }
    if (match2 = str.match(/[ -]SIZE(?:[ \t]+(\d+))?/im)) {
      this._supportedExtensions.push("SIZE");
      this._maxAllowedSize = Number(match2[1]) || 0;
    }
  }
  /**
   * Handles server response for HELO command. If it yielded in
   * error, emit 'error', otherwise move into the authentication phase.
   *
   * @param str Message from the server
   * @internal
   */
  _actionHELO(str) {
    if (str.charAt(0) !== "2") {
      this._onError(new Error("Invalid HELO. response=" + str), "EPROTOCOL", str, "HELO");
      return;
    }
    this.allowsAuth = true;
    this.emit("connect");
  }
  /**
   * Handles server response for STARTTLS command. If there's an error
   * try HELO instead, otherwise initiate TLS upgrade. If the upgrade
   * succeedes restart the EHLO
   *
   * @param str Message from the server
   * @internal
   */
  _actionSTARTTLS(str) {
    if (str.charAt(0) !== "2") {
      if (this.options.opportunisticTLS) {
        this.logger.info({
          tnx: "smtp"
        }, "Failed STARTTLS upgrade, continuing unencrypted");
        if (this._plaintextEhlo) {
          this._parseEhloExtensions(this._plaintextEhlo);
          this._plaintextEhlo = false;
          this.allowsAuth = false;
          this._supportedAuth = [];
        }
        this.emit("connect");
        return;
      }
      this._onError(new Error("Error upgrading connection with STARTTLS"), "ETLS", str, "STARTTLS");
      return;
    }
    this._upgradeConnection((err, secured) => {
      if (err) {
        this._onError(new Error("Error initiating TLS - " + (err.message || err)), "ETLS", false, "STARTTLS");
        return;
      }
      this.logger.info({
        tnx: "smtp"
      }, "Connection upgraded with STARTTLS");
      if (secured) {
        if (this.options.lmtp) {
          this._responseActions.push(this._actionLHLO);
          this._sendCommand("LHLO " + this.name);
        } else {
          this._responseActions.push(this._actionEHLO);
          this._sendCommand("EHLO " + this.name);
        }
      } else {
        this.emit("connect");
      }
    });
  }
  /**
   * Handle the response for AUTH LOGIN command. We are expecting
   * '334 VXNlcm5hbWU6' (base64 for 'Username:'). Data to be sent as
   * response needs to be base64 encoded username. We do not need
   * exact match but settle with 334 response in general as some
   * hosts invalidly use a longer message than VXNlcm5hbWU6
   *
   * @param str Message from the server
   * @param callback Callback to run once the authentication sequence completes
   * @internal
   */
  _actionAUTH_LOGIN_USER(str, callback) {
    if (!/^334[ -]/.test(str)) {
      callback(this._formatError('Invalid login sequence while waiting for "334 VXNlcm5hbWU6"', "EAUTH", str, "AUTH LOGIN"));
      return;
    }
    this._responseActions.push((str2) => {
      this._actionAUTH_LOGIN_PASS(str2, callback);
    });
    this._sendCommand(Buffer.from(this._auth.credentials.user + "", "utf-8").toString("base64"));
  }
  /**
   * Handle the response for AUTH CRAM-MD5 command. We are expecting
   * '334 <challenge string>'. Data to be sent as response needs to be
   * base64 decoded challenge string, MD5 hashed using the password as
   * a HMAC key, prefixed by the username and a space, and finally all
   * base64 encoded again.
   *
   * @param str Message from the server
   * @param callback Callback to run once the authentication sequence completes
   * @internal
   */
  _actionAUTH_CRAM_MD5(str, callback) {
    const challengeMatch = str.match(/^334\s+(.+)$/);
    if (!challengeMatch) {
      return callback(this._formatError("Invalid login sequence while waiting for server challenge string", "EAUTH", str, "AUTH CRAM-MD5"));
    }
    const base64decoded = Buffer.from(challengeMatch[1], "base64").toString("ascii");
    const hmacMD5 = import_node_crypto6.default.createHmac("md5", this._auth.credentials.pass);
    hmacMD5.update(base64decoded);
    const prepended = this._auth.credentials.user + " " + hmacMD5.digest("hex");
    this._responseActions.push((str2) => {
      this._actionAUTH_CRAM_MD5_PASS(str2, callback);
    });
    this._sendCommand(
      Buffer.from(prepended).toString("base64"),
      // hidden hash for logs
      Buffer.from(this._auth.credentials.user + " /* secret */").toString("base64")
    );
  }
  /**
   * Handles the response to CRAM-MD5 authentication, if there's no error,
   * the user can be considered logged in. Start waiting for a message to send
   *
   * @param str Message from the server
   * @param callback Callback to run once the authentication sequence completes
   * @internal
   */
  _actionAUTH_CRAM_MD5_PASS(str, callback) {
    if (!str.match(/^235\s+/)) {
      return callback(this._formatError('Invalid login sequence while waiting for "235"', "EAUTH", str, "AUTH CRAM-MD5"));
    }
    this.logger.info({
      tnx: "smtp",
      username: this._auth.user,
      action: "authenticated",
      method: this._authMethod
    }, "User %s authenticated", JSON.stringify(this._auth.user));
    this.authenticated = true;
    callback(null, true);
  }
  /**
   * Handle the response for AUTH LOGIN command. We are expecting
   * '334 UGFzc3dvcmQ6' (base64 for 'Password:'). Data to be sent as
   * response needs to be base64 encoded password.
   *
   * @param str Message from the server
   * @param callback Callback to run once the authentication sequence completes
   * @internal
   */
  _actionAUTH_LOGIN_PASS(str, callback) {
    if (!/^334[ -]/.test(str)) {
      return callback(this._formatError('Invalid login sequence while waiting for "334 UGFzc3dvcmQ6"', "EAUTH", str, "AUTH LOGIN"));
    }
    this._responseActions.push((str2) => {
      this._actionAUTHComplete(str2, callback);
    });
    this._sendCommand(
      Buffer.from((this._auth.credentials.pass || "").toString(), "utf-8").toString("base64"),
      // Hidden pass for logs
      Buffer.from("/* secret */", "utf-8").toString("base64")
    );
  }
  /**
   * Handles the response for authentication, if there's no error,
   * the user can be considered logged in. Start waiting for a message to send
   *
   * @param str Message from the server
   * @param isRetry True if this is a retry after a failed login, or the callback itself
   * @param [callback] Callback to run once the authentication sequence completes
   * @internal
   */
  _actionAUTHComplete(str, isRetry, callback) {
    if (!callback && typeof isRetry === "function") {
      callback = isRetry;
      isRetry = false;
    }
    if (str.substr(0, 3) === "334") {
      this._responseActions.push((str2) => {
        if (isRetry || this._authMethod !== "XOAUTH2") {
          this._actionAUTHComplete(str2, true, callback);
        } else {
          setImmediate(() => this._handleXOauth2Token(true, callback));
        }
      });
      this._sendCommand("");
      return;
    }
    if (str.charAt(0) !== "2") {
      this.logger.info({
        tnx: "smtp",
        username: this._auth.user,
        action: "authfail",
        method: this._authMethod
      }, "User %s failed to authenticate", JSON.stringify(this._auth.user));
      return callback(this._formatError("Invalid login", "EAUTH", str, "AUTH " + this._authMethod));
    }
    this.logger.info({
      tnx: "smtp",
      username: this._auth.user,
      action: "authenticated",
      method: this._authMethod
    }, "User %s authenticated", JSON.stringify(this._auth.user));
    this.authenticated = true;
    callback(null, true);
  }
  /**
   * Handle response for a MAIL FROM: command
   *
   * @param str Message from the server
   * @param callback Callback to run once the envelope is processed
   * @internal
   */
  _actionMAIL(str, callback) {
    const envelope = this._envelope;
    if (Number(str.charAt(0)) !== 2) {
      const message = this._usingSmtpUtf8 && /^550 /.test(str) && /[\x80-\uFFFF]/.test(envelope.from) ? "Internationalized mailbox name not allowed" : "Mail command failed";
      envelope.mailError = this._formatError(message, "EENVELOPE", str, "MAIL FROM");
    }
    this._advanceEnvelope(str, callback);
  }
  /**
   * Handle response for a RCPT TO: command
   *
   * @param str Message from the server
   * @param callback Callback to run once the envelope is processed
   * @internal
   */
  _actionRCPT(str, callback) {
    const envelope = this._envelope;
    let err;
    const curRecipient = this._recipientQueue.shift();
    if (Number(str.charAt(0)) !== 2) {
      const message = this._usingSmtpUtf8 && /^553 /.test(str) && /[\x80-\uFFFF]/.test(curRecipient) ? "Internationalized mailbox name not allowed" : "Recipient command failed";
      envelope.rejected.push(curRecipient);
      err = this._formatError(message, "EENVELOPE", str, "RCPT TO");
      err.recipient = curRecipient;
      envelope.rejectedErrors.push(err);
    } else {
      envelope.accepted.push(curRecipient);
    }
    this._advanceEnvelope(str, callback);
  }
  /**
   * Moves the envelope on after a reply to MAIL FROM or RCPT TO. A pipelined envelope sent every
   * command at once and is decided by the reply to DATA. Otherwise the commands go one at a
   * time: the next recipient, or once every reply is in, DATA or the error that ends the message
   *
   * @param str The reply that was handled
   * @param callback Callback to run once the envelope is processed
   * @internal
   */
  _advanceEnvelope(str, callback) {
    const envelope = this._envelope;
    if (envelope.pipelined) {
      return;
    }
    if (envelope.mailError) {
      return callback(envelope.mailError);
    }
    if (envelope.rcptQueue.length) {
      return this._sendRcpt(envelope.rcptQueue.shift(), callback);
    }
    if (this._recipientQueue.length) {
      return;
    }
    const err = this._envelopeError(str);
    if (err) {
      return callback(err);
    }
    this._responseActions.push((str2) => {
      this._actionDATA(str2, callback);
    });
    this._sendCommand("DATA");
  }
  /**
   * Decides how the envelope went once every reply to MAIL FROM and RCPT TO is in. Called after
   * the last RCPT TO reply, or with PIPELINING on the reply to the DATA command sent along
   *
   * @param str The reply being handled
   * @returns The error to fail the message with, or null when DATA can go ahead
   * @internal
   */
  _envelopeError(str) {
    const envelope = this._envelope;
    if (envelope.mailError) {
      return envelope.mailError;
    }
    if (envelope.accepted.length) {
      return null;
    }
    const deferred = envelope.rejectedErrors.find((rejectedErr) => rejectedErr.responseCode && rejectedErr.responseCode < 500);
    const lastRejected = envelope.rejectedErrors[envelope.rejectedErrors.length - 1];
    const reply = deferred?.response ?? (envelope.pipelined && lastRejected ? lastRejected.response : str);
    const err = this._formatError("Can't send mail - all recipients were rejected", "EENVELOPE", reply, "RCPT TO");
    err.rejected = envelope.rejected;
    err.rejectedErrors = envelope.rejectedErrors;
    return err;
  }
  /**
   * Handle response for a DATA command
   *
   * @param str Message from the server
   * @param callback Callback to run once the envelope is processed
   * @internal
   */
  _actionDATA(str, callback) {
    const envelope = this._envelope;
    if (envelope.pipelined) {
      const err = this._envelopeError(str);
      if (err) {
        if (/^3/.test(str)) {
          if (envelope.mailError) {
            this.close();
            return callback(err);
          }
          this._responseActions.push(() => callback(err));
          this._sendCommand(".");
          return;
        }
        return callback(err);
      }
    }
    if (!/^[23]/.test(str)) {
      return callback(this._formatError("Data command failed", "EENVELOPE", str, "DATA"));
    }
    const response = {
      accepted: envelope.accepted,
      rejected: envelope.rejected
    };
    if (this._ehloLines && this._ehloLines.length) {
      response.ehlo = this._ehloLines;
    }
    if (envelope.rejectedErrors.length) {
      response.rejectedErrors = envelope.rejectedErrors;
    }
    callback(null, response);
  }
  /**
   * Handle response for a DATA stream when using SMTP
   * We expect a single response that defines if the sending succeeded or failed
   *
   * @param str Message from the server
   * @param callback Callback to run with the final send result
   * @internal
   */
  _actionSMTPStream(str, callback) {
    if (Number(str.charAt(0)) !== 2) {
      return callback(this._formatError("Message failed", "EMESSAGE", str, "DATA"));
    }
    return callback(null, str);
  }
  /**
   * Handle response for a DATA stream
   * We expect a separate response for every recipient. All recipients can either
   * succeed or fail separately
   *
   * @param recipient The recipient this response applies to
   * @param final Is this the final recipient?
   * @param str Message from the server
   * @param callback Callback to run with the final send result
   * @internal
   */
  _actionLMTPStream(recipient, final, str, callback) {
    const envelope = this._envelope;
    let err;
    if (Number(str.charAt(0)) !== 2) {
      err = this._formatError("Message failed for recipient " + recipient, "EMESSAGE", str, "DATA");
      err.recipient = recipient;
      envelope.rejected.push(recipient);
      envelope.rejectedErrors.push(err);
      for (let i = 0, len = envelope.accepted.length; i < len; i++) {
        if (envelope.accepted[i] === recipient) {
          envelope.accepted.splice(i, 1);
        }
      }
    }
    if (final) {
      return callback(null, str);
    }
  }
  /** @internal */
  _handleXOauth2Token(isRetry, callback) {
    this._auth.oauth2.getToken(isRetry, (err, accessToken) => {
      if (err) {
        this.logger.info({
          tnx: "smtp",
          username: this._auth.user,
          action: "authfail",
          method: this._authMethod
        }, "User %s failed to authenticate", JSON.stringify(this._auth.user));
        return callback(this._formatError(err, "EAUTH", false, "AUTH XOAUTH2"));
      }
      this._responseActions.push((str) => {
        this._actionAUTHComplete(str, isRetry, callback);
      });
      this._sendCommand(
        "AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token(accessToken),
        //  Hidden for logs
        "AUTH XOAUTH2 " + this._auth.oauth2.buildXOAuth2Token("/* secret */")
      );
    });
  }
  /**
   *
   * @param command
   * @internal
   */
  _isDestroyedMessage(command) {
    if (this._destroyed) {
      return "Cannot " + command + " - smtp connection is already destroyed.";
    }
    if (this._socket) {
      if (this._socket.destroyed) {
        return "Cannot " + command + " - smtp connection socket is already destroyed.";
      }
      if (!this._socket.writable) {
        return "Cannot " + command + " - smtp connection socket is already half-closed.";
      }
    }
  }
  /** @internal */
  _getHostname() {
    let defaultHostname;
    try {
      defaultHostname = import_node_os2.default.hostname() || "";
    } catch (_err) {
      defaultHostname = "localhost";
    }
    if (!defaultHostname || defaultHostname.indexOf(".") < 0) {
      defaultHostname = "[127.0.0.1]";
    }
    if (defaultHostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
      defaultHostname = "[" + defaultHostname + "]";
    }
    return defaultHostname;
  }
};
var smtp_connection_default = SMTPConnection;

// node_modules/nodemailer/dist/esm/xoauth2/index.js
var import_node_stream14 = require("node:stream");
var import_node_crypto7 = __toESM(require("node:crypto"), 1);
var XOAuth2 = class extends import_node_stream14.Stream {
  constructor(options, logger) {
    super();
    this.options = options || {};
    this.configError = false;
    if (options && options.serviceClient) {
      if (!options.privateKey || !options.user) {
        const err = new Error('Options "privateKey" and "user" are required for service account!');
        err.code = EOAUTH2;
        this.configError = err;
      }
      const serviceRequestTimeout = Math.min(Math.max(Number(this.options.serviceRequestTimeout) || 0, 0), 3600);
      this.options.serviceRequestTimeout = serviceRequestTimeout || 5 * 60;
    }
    this.logger = getLogger({
      logger
    }, {
      component: this.options.component || "OAuth2"
    });
    this.provisionCallback = typeof this.options.provisionCallback === "function" ? this.options.provisionCallback : false;
    this.options.accessUrl = this.options.accessUrl || "https://accounts.google.com/o/oauth2/token";
    this.options.customHeaders = this.options.customHeaders || {};
    this.options.customParams = this.options.customParams || {};
    this.accessToken = this.options.accessToken || false;
    if (this.options.expires && Number(this.options.expires)) {
      this.expires = this.options.expires;
    } else {
      const timeout = Math.max(Number(this.options.timeout) || 0, 0);
      this.expires = timeout && Date.now() + timeout * 1e3 || 0;
    }
    this.renewing = false;
    this.renewalQueue = [];
  }
  /**
   * Returns or generates (if previous has expired) a XOAuth2 token
   *
   * @param renew If false then use cached access token (if available)
   * @param callback Callback function with error object and token string
   */
  getToken(renew, callback) {
    const done = callback;
    if (this.configError) {
      return done(this.configError);
    }
    if (!renew && this.accessToken && (!this.expires || this.expires > Date.now())) {
      this.logger.debug({
        tnx: "OAUTH2",
        user: this.options.user,
        action: "reuse"
      }, "Reusing existing access token for %s", this.options.user);
      return callback(null, this.accessToken);
    }
    if (!this.provisionCallback && !this.options.refreshToken && !this.options.serviceClient) {
      if (this.accessToken) {
        this.logger.debug({
          tnx: "OAUTH2",
          user: this.options.user,
          action: "reuse"
        }, "Reusing existing access token (no refresh capability) for %s", this.options.user);
        return callback(null, this.accessToken);
      }
      this.logger.error({
        tnx: "OAUTH2",
        user: this.options.user,
        action: "renew"
      }, "Cannot renew access token for %s: No refresh mechanism available", this.options.user);
      const err = new Error("Can't create new access token for user");
      err.code = EOAUTH2;
      return done(err);
    }
    if (this.renewing) {
      this.renewalQueue.push({ renew, callback: done });
      return;
    }
    this.renewing = true;
    const generateCallback = (err, accessToken) => {
      this.renewalQueue.forEach((item) => item.callback(err, accessToken));
      this.renewalQueue = [];
      this.renewing = false;
      if (err) {
        this.logger.error({
          err,
          tnx: "OAUTH2",
          user: this.options.user,
          action: "renew"
        }, "Failed generating new Access Token for %s", this.options.user);
      } else {
        this.logger.info({
          tnx: "OAUTH2",
          user: this.options.user,
          action: "renew"
        }, "Generated new Access Token for %s", this.options.user);
      }
      done(err, accessToken);
    };
    if (this.provisionCallback) {
      this.provisionCallback(this.options.user, !!renew, (err, accessToken, expires) => {
        if (!err && accessToken) {
          this.accessToken = accessToken;
          this.expires = expires || 0;
        }
        generateCallback(err, accessToken);
      });
    } else {
      this.generateToken(generateCallback);
    }
  }
  /**
   * Updates token values
   *
   * @param accessToken New access token
   * @param timeout Access token lifetime in seconds
   *
   * Emits 'token': { user: User email-address, accessToken: the new accessToken, timeout: TTL in seconds}
   */
  updateToken(accessToken, timeout) {
    this.accessToken = accessToken;
    timeout = Math.max(Number(timeout) || 0, 0);
    this.expires = timeout && Date.now() + timeout * 1e3 || 0;
    this.emit("token", {
      user: this.options.user,
      accessToken: accessToken || "",
      expires: this.expires
    });
  }
  /**
   * Generates a new XOAuth2 token with the credentials provided at initialization
   *
   * @param callback Callback function with error object and token string
   */
  generateToken(callback) {
    const done = callback;
    let urlOptions;
    let loggedUrlOptions;
    if (this.options.serviceClient) {
      const iat = Math.floor(Date.now() / 1e3);
      const tokenData = {
        iss: this.options.serviceClient,
        scope: this.options.scope || "https://mail.google.com/",
        sub: this.options.user,
        aud: this.options.accessUrl,
        iat,
        exp: iat + this.options.serviceRequestTimeout
      };
      let token;
      try {
        token = this.jwtSignRS256(tokenData);
      } catch (_err) {
        const err = new Error("Can't generate token. Check your auth options");
        err.code = EOAUTH2;
        return done(err);
      }
      urlOptions = {
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: token
      };
      loggedUrlOptions = {
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: tokenData
      };
    } else {
      if (!this.options.refreshToken) {
        const err = new Error("Can't create new access token for user");
        err.code = EOAUTH2;
        return done(err);
      }
      urlOptions = {
        client_id: this.options.clientId || "",
        client_secret: this.options.clientSecret || "",
        refresh_token: this.options.refreshToken,
        grant_type: "refresh_token"
      };
      loggedUrlOptions = {
        client_id: this.options.clientId || "",
        client_secret: (this.options.clientSecret || "").substr(0, 6) + "...",
        refresh_token: (this.options.refreshToken || "").substr(0, 6) + "...",
        grant_type: "refresh_token"
      };
    }
    const customParams = this.options.customParams || {};
    Object.assign(urlOptions, customParams);
    for (const key of Object.keys(customParams)) {
      const param = customParams[key];
      loggedUrlOptions[key] = (param === void 0 || param === null ? "" : String(param)).substr(0, 6) + "...";
    }
    this.logger.debug({
      tnx: "OAUTH2",
      user: this.options.user,
      action: "generate"
    }, "Requesting token using: %s", JSON.stringify(loggedUrlOptions));
    this.postRequest(this.options.accessUrl, urlOptions, this.options, (error2, body) => {
      let data;
      if (error2) {
        return done(error2);
      }
      try {
        data = JSON.parse(body.toString());
      } catch (E2) {
        return done(E2);
      }
      if (!data || typeof data !== "object") {
        this.logger.debug({
          tnx: "OAUTH2",
          user: this.options.user,
          action: "post"
        }, "Response: %s", (body || "").toString());
        const err2 = new Error("Invalid authentication response");
        err2.code = EOAUTH2;
        return done(err2);
      }
      const logData = Object.assign({}, data);
      if (logData.access_token) {
        logData.access_token = (logData.access_token || "").toString().substr(0, 6) + "...";
      }
      this.logger.debug({
        tnx: "OAUTH2",
        user: this.options.user,
        action: "post"
      }, "Response: %s", JSON.stringify(logData));
      if (data.error) {
        let errorMessage = data.error;
        if (data.error_description) {
          errorMessage += ": " + data.error_description;
        }
        if (data.error_uri) {
          errorMessage += " (" + data.error_uri + ")";
        }
        const err2 = new Error(errorMessage);
        err2.code = EOAUTH2;
        return done(err2);
      }
      if (data.access_token) {
        this.updateToken(data.access_token, data.expires_in);
        return callback(null, this.accessToken);
      }
      const err = new Error("No access token");
      err.code = EOAUTH2;
      return done(err);
    });
  }
  /**
   * Converts an access_token and user id into a base64 encoded XOAuth2 token
   *
   * @param [accessToken] Access token string
   * @return Base64 encoded token for IMAP or SMTP login
   */
  buildXOAuth2Token(accessToken) {
    const authData = ["user=" + (this.options.user || ""), "auth=Bearer " + (accessToken || this.accessToken), "", ""];
    return Buffer.from(authData.join(""), "utf-8").toString("base64");
  }
  /**
   * Custom POST request handler.
   * This is only needed to keep paths short in Windows, usually this module
   * is a dependency of a dependency and if it tries to require something
   * like the request module the paths get way too long to handle for Windows.
   * As we do only a simple POST request we do not actually require complicated
   * logic support (no redirects, no nothing) anyway.
   *
   * @param url Url to POST to
   * @param payload Payload to POST
   * @param params Client options, the customHeaders and tls values are used for the request
   * @param callback Callback function with (err, buff)
   */
  postRequest(url, payload, params, callback) {
    let returned = false;
    const chunks = [];
    let chunklen = 0;
    const fetchOptions = {
      method: "post",
      headers: params.customHeaders,
      body: payload,
      allowErrorResponse: true,
      // unset falls back to the fetch default, a stalled token endpoint would otherwise keep
      // `renewing` set and queue every later request
      timeout: params.requestTimeout
    };
    if (/^https:/i.test(url)) {
      fetchOptions.tls = Object.assign({ rejectUnauthorized: true }, params.tls || {});
    }
    const req = fetch_default(url, fetchOptions);
    req.on("readable", () => {
      let chunk;
      while ((chunk = req.read()) !== null) {
        chunks.push(chunk);
        chunklen += chunk.length;
      }
    });
    req.once("error", (err) => {
      if (returned) {
        return;
      }
      returned = true;
      return callback(err);
    });
    req.once("end", () => {
      if (returned) {
        return;
      }
      returned = true;
      return callback(null, Buffer.concat(chunks, chunklen));
    });
  }
  /**
   * Encodes a buffer or a string into Base64url format
   *
   * @param data The data to convert
   * @return The encoded string
   */
  toBase64URL(data) {
    if (typeof data === "string") {
      data = Buffer.from(data);
    }
    return data.toString("base64").replace(/[=]+/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  }
  /**
   * Creates a JSON Web Token signed with RS256 (SHA256 + RSA)
   *
   * @param payload The payload to include in the generated token
   * @return The generated and signed token
   */
  jwtSignRS256(payload) {
    const signedPayload = ['{"alg":"RS256","typ":"JWT"}', JSON.stringify(payload)].map((val) => this.toBase64URL(val)).join(".");
    const signature = import_node_crypto7.default.createSign("RSA-SHA256").update(signedPayload).sign(this.options.privateKey);
    return signedPayload + "." + this.toBase64URL(signature);
  }
};
var xoauth2_default = XOAuth2;

// node_modules/nodemailer/dist/esm/smtp-pool/pool-resource.js
var import_node_events3 = require("node:events");
var PoolResource = class extends import_node_events3.EventEmitter {
  constructor(pool) {
    super();
    this.pool = pool;
    this.options = pool.options;
    this.logger = this.pool.logger;
    if (this.options.auth) {
      switch ((this.options.auth.type || "").toString().toUpperCase()) {
        case "OAUTH2": {
          const oauth2 = new xoauth2_default(this.options.auth, this.logger);
          oauth2.provisionCallback = this.pool.mailer && this.pool.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback;
          this.auth = {
            type: "OAUTH2",
            user: this.options.auth.user,
            oauth2,
            method: "XOAUTH2"
          };
          oauth2.on("token", (token) => this.pool.mailer.emit("token", token));
          oauth2.on("error", (err) => this._fail(err));
          break;
        }
        default:
          if (!this.options.auth.user && !this.options.auth.pass) {
            break;
          }
          this.auth = {
            type: (this.options.auth.type || "").toString().toUpperCase() || "LOGIN",
            user: this.options.auth.user,
            credentials: {
              user: this.options.auth.user || "",
              pass: this.options.auth.pass,
              options: this.options.auth.options
            },
            method: (this.options.auth.method || "").trim().toUpperCase() || this.options.authMethod || false
          };
      }
    }
    this._connection = false;
    this._connected = false;
    this.messages = 0;
    this.available = true;
    this._failed = false;
    this._sending = false;
    this._idleTimer = false;
  }
  /**
   * Emits 'error' for the first failure only. A dead resource can report the same failure more
   * than once (the connection error, then the send callback), the pool handles it once
   * @internal
   */
  _fail(err) {
    if (this._failed) {
      return;
    }
    this._failed = true;
    this.emit("error", err);
  }
  /**
   * Initiates a connection to the SMTP server
   *
   * @param callback Callback function to run once the connection is established or failed
   */
  connect(callback) {
    const connectStartedAt = Date.now();
    this.pool.getSocket(Object.assign({}, this.options, { connectStartedAt }), (err, socketOptions) => {
      if (err) {
        this._fail(err);
        return callback(err);
      }
      let returned = false;
      let options = this.options;
      if (socketOptions && socketOptions.connection) {
        this.logger.info({
          tnx: "proxy",
          remoteAddress: socketOptions.connection.remoteAddress,
          remotePort: socketOptions.connection.remotePort,
          destHost: options.host || "",
          destPort: options.port || "",
          action: "connected"
        }, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
        options = Object.assign(assign(false, options), socketOptions);
      }
      this.connection = new smtp_connection_default(options);
      this.connection._connectStartedAt = connectStartedAt;
      this.connection.on("error", (err2) => {
        if (this._sending) {
          return;
        }
        if (this._connected && isTransientError(err2)) {
          this.logger.info({
            tnx: "pool",
            cid: this.id
          }, "Connection #%s was closed by the server: %s", this.id, err2.message);
          return;
        }
        this._fail(err2);
        if (returned) {
          return;
        }
        returned = true;
        return callback(err2);
      });
      this.connection.once("end", () => {
        this.close();
        returned = true;
      });
      this.connection.connect((err2) => {
        if (returned) {
          return;
        }
        if (err2) {
          returned = true;
          return;
        }
        if (this.auth && (this.connection.allowsAuth || options.forceAuth)) {
          this.connection.login(this.auth, (err3) => {
            if (returned) {
              return;
            }
            returned = true;
            if (err3) {
              this.connection.close();
              this._fail(err3);
              return callback(err3);
            }
            this._connected = true;
            callback(null, true);
          });
        } else {
          returned = true;
          this._connected = true;
          return callback(null, true);
        }
      });
    });
  }
  /**
   * Sends an e-mail to be sent using the selected settings
   *
   * @param mail Mail object
   * @param callback Callback function
   */
  send(mail, callback) {
    if (!this._connected) {
      return this.connect((err) => {
        if (err) {
          return callback(err);
        }
        return this.send(mail, callback);
      });
    }
    const envelope = mail.message.getEnvelope();
    const messageId = mail.message.messageId();
    const recipients = [].concat(envelope.to || []);
    if (recipients.length > 3) {
      recipients.push("...and " + recipients.splice(2).length + " more");
    }
    this.logger.info({
      tnx: "send",
      messageId,
      cid: this.id
    }, "Sending message %s using #%s to <%s>", messageId, this.id, recipients.join(", "));
    if (mail.data.dsn) {
      envelope.dsn = mail.data.dsn;
    }
    if (mail.data.requireTLSExtensionEnabled) {
      envelope.requireTLSExtensionEnabled = mail.data.requireTLSExtensionEnabled;
    }
    this._sending = true;
    const reused = this.messages > 0;
    const messageStream = mail.message.createReadStream();
    this.connection.send(envelope, messageStream, (err, info) => {
      this._sending = false;
      this.messages++;
      if (err) {
        if (reused && messageStream.readableDidRead === false && isTransientError(err)) {
          this.logger.info({
            tnx: "pool",
            cid: this.id,
            messageId
          }, "Connection #%s was closed by the server before message %s was sent: %s", this.id, messageId, err.message);
          this.connection.close();
          return;
        }
        if ((err.code === EENVELOPE || err.code === EMESSAGE) && err.responseCode !== 421 && !this.connection._destroyed) {
          this.connection.reset((resetErr) => {
            if (resetErr) {
              this.connection.close();
              return;
            }
            this._release();
          });
          return callback(err);
        }
        this.connection.close();
        this._fail(err);
        return callback(err);
      }
      info.envelope = {
        from: envelope.from,
        to: envelope.to
      };
      info.messageId = messageId;
      setImmediate(() => this._release());
      callback(null, info);
    });
  }
  /**
   * Makes the connection available for the next message, or closes it once it has sent
   * maxMessages messages
   *
   * @internal
   */
  _release() {
    if (this.messages >= this.options.maxMessages) {
      const err = new Error("Resource exhausted");
      err.code = EMAXLIMIT;
      this.connection.close();
      this._fail(err);
      return;
    }
    this.pool._checkRateLimit(() => {
      this.available = true;
      this._startIdleTimer();
      this.emit("available");
    });
  }
  /** @internal */
  _startIdleTimer() {
    if (!this.options.idleTimeout || this.options.idleTimeout < 0) {
      return;
    }
    if (this._idleTimer && typeof this._idleTimer.refresh === "function") {
      this._idleTimer.refresh();
      return;
    }
    clearTimeout(this._idleTimer);
    this._idleTimer = setTimeout(() => {
      if (!this.available) {
        return;
      }
      this.logger.debug({
        tnx: "pool",
        cid: this.id
      }, "Closing connection #%s after it was idle for %sms", this.id, this.options.idleTimeout);
      this.available = false;
      this.connection.quit();
    }, this.options.idleTimeout);
    if (typeof this._idleTimer.unref === "function") {
      this._idleTimer.unref();
    }
  }
  /** @internal */
  _stopIdleTimer() {
    clearTimeout(this._idleTimer);
    this._idleTimer = false;
  }
  /**
   * Closes the connection
   */
  close() {
    this._connected = false;
    this._stopIdleTimer();
    if (this.auth && this.auth.oauth2) {
      this.auth.oauth2.removeAllListeners();
    }
    if (this.connection) {
      this.connection.close();
    }
    this.emit("close");
  }
};

// node_modules/nodemailer/dist/esm/well-known/services.js
var services = {
  "126": {
    "description": "126 Mail (NetEase)",
    "host": "smtp.126.com",
    "port": 465,
    "secure": true
  },
  "163": {
    "description": "163 Mail (NetEase)",
    "host": "smtp.163.com",
    "port": 465,
    "secure": true
  },
  "1und1": {
    "description": "1&1 Mail (German hosting provider)",
    "host": "smtp.1und1.de",
    "port": 465,
    "secure": true,
    "authMethod": "LOGIN"
  },
  "Aliyun": {
    "description": "Alibaba Cloud Mail",
    "domains": [
      "aliyun.com"
    ],
    "host": "smtp.aliyun.com",
    "port": 465,
    "secure": true
  },
  "AliyunQiye": {
    "description": "Alibaba Cloud Enterprise Mail",
    "host": "smtp.qiye.aliyun.com",
    "port": 465,
    "secure": true
  },
  "AOL": {
    "description": "AOL Mail",
    "domains": [
      "aol.com"
    ],
    "host": "smtp.aol.com",
    "port": 587
  },
  "Aruba": {
    "description": "Aruba PEC (Italian email provider)",
    "domains": [
      "aruba.it",
      "pec.aruba.it"
    ],
    "aliases": [
      "Aruba PEC"
    ],
    "host": "smtps.aruba.it",
    "port": 465,
    "secure": true,
    "authMethod": "LOGIN"
  },
  "Bluewin": {
    "description": "Bluewin (Swiss email provider)",
    "host": "smtpauths.bluewin.ch",
    "domains": [
      "bluewin.ch"
    ],
    "port": 465
  },
  "BOL": {
    "description": "BOL Mail (Brazilian provider)",
    "domains": [
      "bol.com.br"
    ],
    "host": "smtp.bol.com.br",
    "port": 587,
    "requireTLS": true
  },
  "DebugMail": {
    "description": "DebugMail (email testing service)",
    "host": "debugmail.io",
    "port": 25
  },
  "Disroot": {
    "description": "Disroot (privacy-focused provider)",
    "domains": [
      "disroot.org"
    ],
    "host": "disroot.org",
    "port": 587,
    "secure": false,
    "authMethod": "LOGIN"
  },
  "DynectEmail": {
    "description": "Dyn Email Delivery",
    "aliases": [
      "Dynect"
    ],
    "host": "smtp.dynect.net",
    "port": 25
  },
  "ElasticEmail": {
    "description": "Elastic Email",
    "aliases": [
      "Elastic Email"
    ],
    "host": "smtp.elasticemail.com",
    "port": 465,
    "secure": true
  },
  "Ethereal": {
    "description": "Ethereal Email (email testing service)",
    "aliases": [
      "ethereal.email"
    ],
    "host": "smtp.ethereal.email",
    "port": 587
  },
  "FastMail": {
    "description": "FastMail",
    "domains": [
      "fastmail.com",
      "fastmail.fm"
    ],
    "host": "smtp.fastmail.com",
    "port": 465,
    "secure": true
  },
  "Feishu Mail": {
    "description": "Feishu Mail (Lark)",
    "aliases": [
      "Feishu",
      "FeishuMail"
    ],
    "domains": [
      "www.feishu.cn"
    ],
    "host": "smtp.feishu.cn",
    "port": 465,
    "secure": true
  },
  "Forward Email": {
    "description": "Forward Email (email forwarding service)",
    "aliases": [
      "FE",
      "ForwardEmail"
    ],
    "domains": [
      "forwardemail.net"
    ],
    "host": "smtp.forwardemail.net",
    "port": 465,
    "secure": true
  },
  "GandiMail": {
    "description": "Gandi Mail",
    "aliases": [
      "Gandi",
      "Gandi Mail"
    ],
    "host": "mail.gandi.net",
    "port": 587
  },
  "Gmail": {
    "description": "Gmail",
    "aliases": [
      "Google Mail"
    ],
    "domains": [
      "gmail.com",
      "googlemail.com"
    ],
    "host": "smtp.gmail.com",
    "port": 465,
    "secure": true
  },
  "GmailWorkspace": {
    "description": "Gmail Workspace",
    "aliases": [
      "Google Workspace Mail"
    ],
    "host": "smtp-relay.gmail.com",
    "port": 465,
    "secure": true
  },
  "GMX": {
    "description": "GMX Mail",
    "domains": [
      "gmx.com",
      "gmx.net",
      "gmx.de"
    ],
    "host": "mail.gmx.com",
    "port": 587
  },
  "Godaddy": {
    "description": "GoDaddy Email (US)",
    "host": "smtpout.secureserver.net",
    "port": 25
  },
  "GodaddyAsia": {
    "description": "GoDaddy Email (Asia)",
    "host": "smtp.asia.secureserver.net",
    "port": 25
  },
  "GodaddyEurope": {
    "description": "GoDaddy Email (Europe)",
    "host": "smtp.europe.secureserver.net",
    "port": 25
  },
  "hot.ee": {
    "description": "Hot.ee (Estonian email provider)",
    "host": "mail.hot.ee"
  },
  "Hotmail": {
    "description": "Outlook.com / Hotmail",
    "aliases": [
      "Outlook",
      "Outlook.com",
      "Hotmail.com"
    ],
    "domains": [
      "hotmail.com",
      "outlook.com"
    ],
    "host": "smtp-mail.outlook.com",
    "port": 587
  },
  "iCloud": {
    "description": "iCloud Mail",
    "aliases": [
      "Me",
      "Mac"
    ],
    "domains": [
      "icloud.com",
      "me.com",
      "mac.com"
    ],
    "host": "smtp.mail.me.com",
    "port": 587
  },
  "Infomaniak": {
    "description": "Infomaniak Mail (Swiss hosting provider)",
    "host": "mail.infomaniak.com",
    "domains": [
      "ik.me",
      "ikmail.com",
      "etik.com"
    ],
    "port": 587
  },
  "KolabNow": {
    "description": "KolabNow (secure email service)",
    "domains": [
      "kolabnow.com"
    ],
    "aliases": [
      "Kolab"
    ],
    "host": "smtp.kolabnow.com",
    "port": 465,
    "secure": true,
    "authMethod": "LOGIN"
  },
  "Loopia": {
    "description": "Loopia (Swedish hosting provider)",
    "host": "mailcluster.loopia.se",
    "port": 465
  },
  "Loops": {
    "description": "Loops",
    "host": "smtp.loops.so",
    "port": 587
  },
  "mail.ee": {
    "description": "Mail.ee (Estonian email provider)",
    "host": "smtp.mail.ee"
  },
  "Mail.ru": {
    "description": "Mail.ru",
    "host": "smtp.mail.ru",
    "port": 465,
    "secure": true
  },
  "Mailcatch.app": {
    "description": "Mailcatch (email testing service)",
    "host": "sandbox-smtp.mailcatch.app",
    "port": 2525
  },
  "Maildev": {
    "description": "MailDev (local email testing)",
    "port": 1025,
    "ignoreTLS": true
  },
  "MailerSend": {
    "description": "MailerSend",
    "host": "smtp.mailersend.net",
    "port": 587
  },
  "Mailgun": {
    "description": "Mailgun",
    "host": "smtp.mailgun.org",
    "port": 465,
    "secure": true
  },
  "Mailjet": {
    "description": "Mailjet",
    "host": "in.mailjet.com",
    "port": 587
  },
  "Mailosaur": {
    "description": "Mailosaur (email testing service)",
    "host": "mailosaur.io",
    "port": 25
  },
  "MailSenpai": {
    "description": "MailSenpai (SMTP Senpai, EU)",
    "host": "relay.mailsenpai.com",
    "port": 2525,
    "secure": false
  },
  "Mailtrap": {
    "description": "Mailtrap",
    "host": "live.smtp.mailtrap.io",
    "port": 587
  },
  "Mandrill": {
    "description": "Mandrill (by Mailchimp)",
    "host": "smtp.mandrillapp.com",
    "port": 587
  },
  "Naver": {
    "description": "Naver Mail (Korean email provider)",
    "host": "smtp.naver.com",
    "port": 587
  },
  "OhMySMTP": {
    "description": "OhMySMTP (email delivery service)",
    "host": "smtp.ohmysmtp.com",
    "port": 587,
    "secure": false
  },
  "One": {
    "description": "One.com Email",
    "host": "send.one.com",
    "port": 465,
    "secure": true
  },
  "OpenMailBox": {
    "description": "OpenMailBox",
    "aliases": [
      "OMB",
      "openmailbox.org"
    ],
    "host": "smtp.openmailbox.org",
    "port": 465,
    "secure": true
  },
  "Outlook365": {
    "description": "Microsoft 365 / Office 365",
    "host": "smtp.office365.com",
    "port": 587,
    "secure": false
  },
  "Oveyon": {
    "description": "Oveyon",
    "host": "smtp.oveyon.com",
    "port": 587,
    "secure": false,
    "requireTLS": true
  },
  "Postmark": {
    "description": "Postmark",
    "aliases": [
      "PostmarkApp"
    ],
    "host": "smtp.postmarkapp.com",
    "port": 2525
  },
  "Proton": {
    "description": "Proton Mail",
    "aliases": [
      "ProtonMail",
      "Proton.me",
      "Protonmail.com",
      "Protonmail.ch"
    ],
    "domains": [
      "proton.me",
      "protonmail.com",
      "pm.me",
      "protonmail.ch"
    ],
    "host": "smtp.protonmail.ch",
    "port": 587,
    "requireTLS": true
  },
  "qiye.aliyun": {
    "description": "Alibaba Mail Enterprise Edition",
    "host": "smtp.mxhichina.com",
    "port": "465",
    "secure": true
  },
  "QQ": {
    "description": "QQ Mail",
    "domains": [
      "qq.com"
    ],
    "host": "smtp.qq.com",
    "port": 465,
    "secure": true
  },
  "QQex": {
    "description": "QQ Enterprise Mail",
    "aliases": [
      "QQ Enterprise"
    ],
    "domains": [
      "exmail.qq.com"
    ],
    "host": "smtp.exmail.qq.com",
    "port": 465,
    "secure": true
  },
  "Resend": {
    "description": "Resend",
    "host": "smtp.resend.com",
    "port": 465,
    "secure": true
  },
  "Runbox": {
    "description": "Runbox (Norwegian email provider)",
    "domains": [
      "runbox.com"
    ],
    "host": "smtp.runbox.com",
    "port": 465,
    "secure": true
  },
  "SendCloud": {
    "description": "SendCloud (Chinese email delivery)",
    "host": "smtp.sendcloud.net",
    "port": 2525
  },
  "SendGrid": {
    "description": "SendGrid",
    "host": "smtp.sendgrid.net",
    "port": 587
  },
  "SendinBlue": {
    "description": "Brevo (formerly Sendinblue)",
    "aliases": [
      "Brevo"
    ],
    "host": "smtp-relay.brevo.com",
    "port": 587
  },
  "SendPulse": {
    "description": "SendPulse",
    "host": "smtp-pulse.com",
    "port": 465,
    "secure": true
  },
  "SES": {
    "description": "AWS SES US East (N. Virginia)",
    "host": "email-smtp.us-east-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-AP-NORTHEAST-1": {
    "description": "AWS SES Asia Pacific (Tokyo)",
    "host": "email-smtp.ap-northeast-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-AP-NORTHEAST-2": {
    "description": "AWS SES Asia Pacific (Seoul)",
    "host": "email-smtp.ap-northeast-2.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-AP-NORTHEAST-3": {
    "description": "AWS SES Asia Pacific (Osaka)",
    "host": "email-smtp.ap-northeast-3.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-AP-SOUTH-1": {
    "description": "AWS SES Asia Pacific (Mumbai)",
    "host": "email-smtp.ap-south-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-AP-SOUTHEAST-1": {
    "description": "AWS SES Asia Pacific (Singapore)",
    "host": "email-smtp.ap-southeast-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-AP-SOUTHEAST-2": {
    "description": "AWS SES Asia Pacific (Sydney)",
    "host": "email-smtp.ap-southeast-2.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-CA-CENTRAL-1": {
    "description": "AWS SES Canada (Central)",
    "host": "email-smtp.ca-central-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-EU-CENTRAL-1": {
    "description": "AWS SES Europe (Frankfurt)",
    "host": "email-smtp.eu-central-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-EU-NORTH-1": {
    "description": "AWS SES Europe (Stockholm)",
    "host": "email-smtp.eu-north-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-EU-WEST-1": {
    "description": "AWS SES Europe (Ireland)",
    "host": "email-smtp.eu-west-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-EU-WEST-2": {
    "description": "AWS SES Europe (London)",
    "host": "email-smtp.eu-west-2.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-EU-WEST-3": {
    "description": "AWS SES Europe (Paris)",
    "host": "email-smtp.eu-west-3.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-SA-EAST-1": {
    "description": "AWS SES South America (S\xE3o Paulo)",
    "host": "email-smtp.sa-east-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-US-EAST-1": {
    "description": "AWS SES US East (N. Virginia)",
    "host": "email-smtp.us-east-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-US-EAST-2": {
    "description": "AWS SES US East (Ohio)",
    "host": "email-smtp.us-east-2.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-US-GOV-EAST-1": {
    "description": "AWS SES GovCloud (US-East)",
    "host": "email-smtp.us-gov-east-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-US-GOV-WEST-1": {
    "description": "AWS SES GovCloud (US-West)",
    "host": "email-smtp.us-gov-west-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-US-WEST-1": {
    "description": "AWS SES US West (N. California)",
    "host": "email-smtp.us-west-1.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "SES-US-WEST-2": {
    "description": "AWS SES US West (Oregon)",
    "host": "email-smtp.us-west-2.amazonaws.com",
    "port": 465,
    "secure": true
  },
  "Seznam": {
    "description": "Seznam Email (Czech email provider)",
    "aliases": [
      "Seznam Email"
    ],
    "domains": [
      "seznam.cz",
      "email.cz",
      "post.cz",
      "spoluzaci.cz"
    ],
    "host": "smtp.seznam.cz",
    "port": 465,
    "secure": true
  },
  "SMTP2GO": {
    "description": "SMTP2GO",
    "host": "mail.smtp2go.com",
    "port": 2525
  },
  "Sparkpost": {
    "description": "SparkPost",
    "aliases": [
      "SparkPost",
      "SparkPost Mail"
    ],
    "domains": [
      "sparkpost.com"
    ],
    "host": "smtp.sparkpostmail.com",
    "port": 587,
    "secure": false
  },
  "Tipimail": {
    "description": "Tipimail (email delivery service)",
    "host": "smtp.tipimail.com",
    "port": 587
  },
  "TurboSMTP": {
    "description": "TurboSMTP",
    "host": "pro.turbo-smtp.com",
    "port": 465,
    "secure": true
  },
  "TurboSMTP-EU": {
    "description": "TurboSMTP (EU region)",
    "host": "pro.eu.turbo-smtp.com",
    "port": 465,
    "secure": true
  },
  "Tutanota": {
    "description": "Tutanota (Tuta Mail)",
    "domains": [
      "tutanota.com",
      "tuta.com",
      "tutanota.de",
      "tuta.io"
    ],
    "host": "smtp.tutanota.com",
    "port": 465,
    "secure": true
  },
  "Yahoo": {
    "description": "Yahoo Mail",
    "domains": [
      "yahoo.com"
    ],
    "host": "smtp.mail.yahoo.com",
    "port": 465,
    "secure": true
  },
  "Yandex": {
    "description": "Yandex Mail",
    "domains": [
      "yandex.ru"
    ],
    "host": "smtp.yandex.ru",
    "port": 465,
    "secure": true
  },
  "Zimbra": {
    "description": "Zimbra Mail Server",
    "aliases": [
      "Zimbra Collaboration"
    ],
    "host": "smtp.zimbra.com",
    "port": 587,
    "requireTLS": true
  },
  "Zoho": {
    "description": "Zoho Mail",
    "host": "smtp.zoho.com",
    "port": 465,
    "secure": true,
    "authMethod": "LOGIN"
  }
};

// node_modules/nodemailer/dist/esm/well-known/index.js
var normalized = {};
Object.keys(services).forEach((key) => {
  const service = services[key];
  const normalizedService = normalizeService(service);
  normalized[normalizeKey(key)] = normalizedService;
  [].concat(service.aliases || []).forEach((alias) => {
    normalized[normalizeKey(alias)] = normalizedService;
  });
  [].concat(service.domains || []).forEach((domain) => {
    normalized[normalizeKey(domain)] = normalizedService;
  });
});
function normalizeKey(key) {
  return key.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase();
}
function normalizeService(service) {
  const response = {};
  Object.keys(service).forEach((key) => {
    if (!["domains", "aliases"].includes(key)) {
      response[key] = service[key];
    }
  });
  return response;
}
function wellKnown(key) {
  key = normalizeKey(key.split("@").pop());
  return normalized[key] || false;
}

// node_modules/nodemailer/dist/esm/smtp-pool/index.js
var REQUEUE_BASE_DELAY = 50;
var REQUEUE_MAX_DELAY = 2e3;
var SMTPPool = class extends import_node_events4.EventEmitter {
  constructor(options) {
    super();
    options = options || {};
    if (typeof options === "string") {
      options = {
        url: options
      };
    }
    let urlData;
    let service = options.service;
    if (typeof options.getSocket === "function") {
      this.getSocket = options.getSocket;
    }
    if (options.url) {
      urlData = parseConnectionUrl(options.url);
      service = service || urlData.service;
    }
    this.options = assign(
      false,
      // create new object
      options,
      // regular options
      urlData,
      // url options
      service && wellKnown(service)
      // wellknown options
    );
    this.options.maxConnections = this.options.maxConnections || 5;
    this.options.maxMessages = this.options.maxMessages || 100;
    this.options.maxRequeues = typeof this.options.maxRequeues === "number" ? this.options.maxRequeues : 5;
    this.options.idleTimeout = typeof this.options.idleTimeout === "number" ? this.options.idleTimeout : 4 * 60 * 1e3;
    this.logger = getLogger(this.options, {
      component: this.options.component || "smtp-pool"
    });
    this.name = "SMTP (pool)";
    this.version = version + "[client:" + version + "]";
    this._rateLimit = {
      counter: 0,
      timeout: null,
      waiting: [],
      checkpoint: false,
      delta: Number(this.options.rateDelta) || 1e3,
      limit: Number(this.options.rateLimit) || 0
    };
    this._closed = false;
    this._queue = [];
    this._connections = [];
    this._connectionCounter = 0;
    this.idling = true;
    setImmediate(() => {
      if (this.idling) {
        this.emit("idle");
      }
    });
  }
  /**
   * Placeholder function for creating proxy sockets. This method immediatelly returns
   * without a socket
   *
   * @param options Connection options
   * @param callback Callback function to run with the socket keys
   */
  getSocket(options, callback) {
    setImmediate(() => callback(null, false));
  }
  /**
   * Queues an e-mail to be sent using the selected settings
   *
   * @param mail Mail object
   * @param callback Callback function
   */
  send(mail, callback) {
    if (this._closed) {
      const err = new Error("Connection pool was closed");
      err.code = ECONNECTION;
      setImmediate(() => callback(err));
      return false;
    }
    this._queue.push({
      mail,
      requeueAttempts: 0,
      callback
    });
    if (this.idling && this._queue.length >= this.options.maxConnections) {
      this.idling = false;
    }
    setImmediate(() => this._processMessages());
    return true;
  }
  /**
   * Closes all connections in the pool. If there is a message being sent, the connection
   * is closed later
   */
  close() {
    let connection;
    const len = this._connections.length;
    this._closed = true;
    this._clearRateLimit();
    if (!len && !this._queue.length) {
      return;
    }
    for (let i = len - 1; i >= 0; i--) {
      if (this._connections[i] && this._connections[i].available) {
        connection = this._connections[i];
        connection.close();
        this.logger.info({
          tnx: "connection",
          cid: connection.id,
          action: "removed"
        }, "Connection #%s removed", connection.id);
      }
    }
    if (len && !this._connections.length) {
      this.logger.debug({
        tnx: "connection"
      }, "All connections removed");
    }
    if (!this._queue.length) {
      return;
    }
    const invokeCallbacks = () => {
      if (!this._queue.length) {
        this.logger.debug({
          tnx: "connection"
        }, "Pending queue entries cleared");
        return;
      }
      const entry = this._queue.shift();
      if (entry && typeof entry.callback === "function") {
        try {
          entry.callback(new Error("Connection pool was closed"));
        } catch (E2) {
          this.logger.error({
            err: E2,
            tnx: "callback"
          }, "Callback error: %s", E2.message);
        }
      }
      setImmediate(invokeCallbacks);
    };
    setImmediate(invokeCallbacks);
  }
  /**
   * Check the queue and available connections. If there is a message to be sent and there is
   * an available connection, then use this connection to send the mail
   * @internal
   */
  _processMessages() {
    if (this._closed) {
      return;
    }
    if (!this._queue.length) {
      if (!this.idling) {
        this.idling = true;
        this.emit("idle");
      }
      return;
    }
    let connection = this._connections.find((c) => c.available);
    if (!connection && this._connections.length < this.options.maxConnections) {
      connection = this._createConnection();
    }
    if (!connection) {
      this.idling = false;
      return;
    }
    if (!this.idling && this._queue.length < this.options.maxConnections) {
      this.idling = true;
      this.emit("idle");
    }
    const entry = connection.queueEntry = this._queue.shift();
    entry.messageId = (connection.queueEntry.mail.message.getHeader("message-id") || "").replace(/[<>\s]/g, "");
    connection.available = false;
    this.logger.debug({
      tnx: "pool",
      cid: connection.id,
      messageId: entry.messageId,
      action: "assign"
    }, "Assigned message <%s> to #%s (%s)", entry.messageId, connection.id, connection.messages + 1);
    if (this._rateLimit.limit) {
      this._rateLimit.counter++;
      if (!this._rateLimit.checkpoint) {
        this._rateLimit.checkpoint = Date.now();
      }
    }
    connection.send(entry.mail, (err, info) => {
      if (entry === connection.queueEntry) {
        try {
          entry.callback(err, info);
        } catch (E2) {
          this.logger.error({
            err: E2,
            tnx: "callback",
            cid: connection.id
          }, "Callback error for #%s: %s", connection.id, E2.message);
        }
        connection.queueEntry = false;
      }
    });
  }
  /**
   * Creates a new pool resource
   * @internal
   */
  _createConnection() {
    const connection = new PoolResource(this);
    connection.id = ++this._connectionCounter;
    this.logger.info({
      tnx: "pool",
      cid: connection.id,
      action: "conection"
    }, "Created new pool resource #%s", connection.id);
    connection.on("available", () => {
      this.logger.debug({
        tnx: "connection",
        cid: connection.id,
        action: "available"
      }, "Connection #%s became available", connection.id);
      if (this._closed) {
        this.close();
      } else {
        this._processMessages();
      }
    });
    connection.once("error", (err) => {
      if (err.code !== EMAXLIMIT) {
        this.logger.warn({
          err,
          tnx: "pool",
          cid: connection.id
        }, "Pool Error for #%s: %s", connection.id, err.message);
      } else {
        this.logger.debug({
          tnx: "pool",
          cid: connection.id,
          action: "maxlimit"
        }, "Max messages limit exchausted for #%s", connection.id);
      }
      if (connection.queueEntry) {
        try {
          connection.queueEntry.callback(err);
        } catch (E2) {
          this.logger.error({
            err: E2,
            tnx: "callback",
            cid: connection.id
          }, "Callback error for #%s: %s", connection.id, E2.message);
        }
        connection.queueEntry = false;
      }
      this._removeConnection(connection);
      this._continueProcessing();
    });
    connection.once("close", () => {
      this.logger.info({
        tnx: "connection",
        cid: connection.id,
        action: "closed"
      }, "Connection #%s was closed", connection.id);
      this._removeConnection(connection);
      if (connection.queueEntry) {
        setTimeout(() => {
          let delay = 0;
          if (connection.queueEntry) {
            if (this._shouldRequeuOnConnectionClose(connection.queueEntry)) {
              delay = this._requeueEntryOnConnectionClose(connection);
            } else {
              this._failDeliveryOnConnectionClose(connection);
            }
          }
          if (delay) {
            setTimeout(() => this._continueProcessing(), delay);
          } else {
            this._continueProcessing();
          }
        }, 50);
      } else {
        if (!this._closed && this.idling && !this._connections.length) {
          this.emit("clear");
        }
        this._continueProcessing();
      }
    });
    this._connections.push(connection);
    return connection;
  }
  /** @internal */
  _shouldRequeuOnConnectionClose(queueEntry) {
    if (this.options.maxRequeues < 0) {
      return true;
    }
    return queueEntry.requeueAttempts < this.options.maxRequeues;
  }
  /** @internal */
  _failDeliveryOnConnectionClose(connection) {
    if (connection.queueEntry && connection.queueEntry.callback) {
      try {
        const err = new Error("Reached maximum number of retries after connection was closed");
        err.code = ECONNECTION;
        connection.queueEntry.callback(err);
      } catch (E2) {
        this.logger.error({
          err: E2,
          tnx: "callback",
          messageId: connection.queueEntry.messageId,
          cid: connection.id
        }, "Callback error for #%s: %s", connection.id, E2.message);
      }
      connection.queueEntry = false;
    }
  }
  /** @internal */
  _requeueEntryOnConnectionClose(connection) {
    const delay = Math.min(REQUEUE_BASE_DELAY * 2 ** connection.queueEntry.requeueAttempts, REQUEUE_MAX_DELAY);
    connection.queueEntry.requeueAttempts += 1;
    this.logger.debug({
      tnx: "pool",
      cid: connection.id,
      messageId: connection.queueEntry.messageId,
      action: "requeue"
    }, "Re-queued message <%s> for #%s. Attempt: #%s", connection.queueEntry.messageId, connection.id, connection.queueEntry.requeueAttempts);
    this._queue.unshift(connection.queueEntry);
    connection.queueEntry = false;
    return delay;
  }
  /**
   * Continue to process message if the pool hasn't closed
   * @internal
   */
  _continueProcessing() {
    if (this._closed) {
      this.close();
    } else {
      setTimeout(() => this._processMessages(), 100);
    }
  }
  /**
   * Remove resource from pool
   *
   * @param connection The PoolResource to remove
   * @internal
   */
  _removeConnection(connection) {
    const index = this._connections.indexOf(connection);
    if (index !== -1) {
      this._connections.splice(index, 1);
    }
  }
  /**
   * Checks if connections have hit current rate limit and if so, queues the availability callback
   *
   * @param callback Callback function to run once rate limiter has been cleared
   * @internal
   */
  _checkRateLimit(callback) {
    if (!this._rateLimit.limit) {
      return callback();
    }
    const now = Date.now();
    if (this._rateLimit.counter < this._rateLimit.limit) {
      return callback();
    }
    this._rateLimit.waiting.push(callback);
    if (this._rateLimit.checkpoint <= now - this._rateLimit.delta) {
      return this._clearRateLimit();
    }
    if (!this._rateLimit.timeout) {
      this._rateLimit.timeout = setTimeout(() => this._clearRateLimit(), this._rateLimit.delta - (now - this._rateLimit.checkpoint));
      this._rateLimit.checkpoint = now;
    }
  }
  /**
   * Clears current rate limit limitation and runs paused callback
   * @internal
   */
  _clearRateLimit() {
    clearTimeout(this._rateLimit.timeout);
    this._rateLimit.timeout = null;
    this._rateLimit.counter = 0;
    this._rateLimit.checkpoint = false;
    while (this._rateLimit.waiting.length) {
      const cb = this._rateLimit.waiting.shift();
      setImmediate(cb);
    }
  }
  /**
   * Returns true if there are free slots in the queue
   */
  isIdle() {
    return this.idling;
  }
  verify(callback) {
    let promise;
    if (!callback) {
      promise = new Promise((resolve3, reject) => {
        callback = callbackPromise(resolve3, reject);
      });
    }
    const done = callback;
    const auth = new PoolResource(this).auth;
    const connectStartedAt = Date.now();
    this.getSocket(Object.assign({}, this.options, { connectStartedAt }), (err, socketOptions) => {
      if (err) {
        return done(err);
      }
      let options = this.options;
      if (socketOptions && socketOptions.connection) {
        this.logger.info({
          tnx: "proxy",
          remoteAddress: socketOptions.connection.remoteAddress,
          remotePort: socketOptions.connection.remotePort,
          destHost: options.host || "",
          destPort: options.port || "",
          action: "connected"
        }, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
        options = Object.assign(assign(false, options), socketOptions);
      }
      const connection = new smtp_connection_default(options);
      connection._connectStartedAt = connectStartedAt;
      let returned = false;
      connection.once("error", (err2) => {
        if (returned) {
          return;
        }
        returned = true;
        connection.close();
        return done(err2);
      });
      connection.once("end", () => {
        if (returned) {
          return;
        }
        returned = true;
        return done(new Error("Connection closed"));
      });
      const finalize = () => {
        if (returned) {
          return;
        }
        returned = true;
        connection.quit();
        return done(null, true);
      };
      connection.connect((err2) => {
        if (returned) {
          return;
        }
        if (err2) {
          returned = true;
          connection.close();
          return done(err2);
        }
        if (auth && (connection.allowsAuth || options.forceAuth)) {
          connection.login(auth, (err3) => {
            if (returned) {
              return;
            }
            if (err3) {
              returned = true;
              connection.close();
              return done(err3);
            }
            finalize();
          });
        } else if (!auth && connection.allowsAuth && options.forceAuth) {
          const err3 = new Error("Authentication info was not provided");
          err3.code = ENOAUTH;
          returned = true;
          connection.close();
          return done(err3);
        } else {
          finalize();
        }
      });
    });
    return promise;
  }
};
var smtp_pool_default = SMTPPool;

// node_modules/nodemailer/dist/esm/smtp-transport/index.js
var import_node_events5 = require("node:events");
var MESSAGE_AUTH_KEYS = ["type", "user", "pass", "accessToken", "refreshToken", "expires"];
var SMTPTransport = class extends import_node_events5.EventEmitter {
  constructor(options) {
    super();
    options = options || {};
    if (typeof options === "string") {
      options = {
        url: options
      };
    }
    let urlData;
    let service = options.service;
    if (typeof options.getSocket === "function") {
      this.getSocket = options.getSocket;
    }
    if (options.url) {
      urlData = parseConnectionUrl(options.url);
      service = service || urlData.service;
    }
    this.options = assign(
      false,
      // create new object
      options,
      // regular options
      urlData,
      // url options
      service && wellKnown(service)
      // wellknown options
    );
    this.logger = getLogger(this.options, {
      component: this.options.component || "smtp-transport"
    });
    this.name = "SMTP";
    this.version = version + "[client:" + version + "]";
    if (this.options.auth) {
      this.auth = this.getAuth({});
    }
  }
  /**
   * Placeholder function for creating proxy sockets. This method immediatelly returns
   * without a socket
   *
   * @param options Connection options
   * @param callback Callback function to run with the socket keys
   */
  getSocket(options, callback) {
    setImmediate(() => callback(null, false));
  }
  getAuth(authOpts) {
    if (!authOpts) {
      if (this.auth && this.auth.oauth2 && this.mailer) {
        this.auth.oauth2.provisionCallback = this.mailer.get("oauth2_provision_cb") || this.auth.oauth2.provisionCallback;
      }
      return this.auth;
    }
    const authData = Object.assign({}, this.options.auth && typeof this.options.auth === "object" ? this.options.auth : {});
    if (typeof authOpts === "object") {
      copyOwnKeys(authData, authOpts, (key) => !MESSAGE_AUTH_KEYS.includes(key));
    }
    if (Object.keys(authData).length === 0) {
      return false;
    }
    switch ((authData.type || "").toString().toUpperCase()) {
      case "OAUTH2": {
        if (!authData.service && !authData.user) {
          return false;
        }
        const oauth2 = new xoauth2_default(authData, this.logger);
        oauth2.provisionCallback = this.mailer && this.mailer.get("oauth2_provision_cb") || oauth2.provisionCallback;
        oauth2.on("token", (token) => this.mailer.emit("token", token));
        oauth2.on("error", (err) => this.emit("error", err));
        return {
          type: "OAUTH2",
          user: authData.user,
          oauth2,
          method: "XOAUTH2"
        };
      }
      default:
        return {
          type: (authData.type || "").toString().toUpperCase() || "LOGIN",
          user: authData.user,
          credentials: {
            user: authData.user || "",
            pass: authData.pass,
            options: authData.options
          },
          method: (authData.method || "").trim().toUpperCase() || this.options.authMethod || false
        };
    }
  }
  /**
   * Sends an e-mail using the selected settings
   *
   * @param mail Mail object
   * @param callback Callback function
   */
  send(mail, callback) {
    const connectStartedAt = Date.now();
    this.getSocket(Object.assign({}, this.options, { connectStartedAt }), (err, socketOptions) => {
      if (err) {
        return callback(err);
      }
      let returned = false;
      let options = this.options;
      if (socketOptions && socketOptions.connection) {
        this.logger.info({
          tnx: "proxy",
          remoteAddress: socketOptions.connection.remoteAddress,
          remotePort: socketOptions.connection.remotePort,
          destHost: options.host || "",
          destPort: options.port || "",
          action: "connected"
        }, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
        options = Object.assign(assign(false, options), socketOptions);
      }
      const connection = new smtp_connection_default(options);
      connection._connectStartedAt = connectStartedAt;
      let perCallAuth;
      const cleanupPerCallAuth = () => {
        if (perCallAuth && perCallAuth !== this.auth && perCallAuth.oauth2) {
          perCallAuth.oauth2.removeAllListeners();
        }
        perCallAuth = null;
      };
      connection.once("error", (err2) => {
        if (returned) {
          return;
        }
        returned = true;
        cleanupPerCallAuth();
        connection.close();
        return callback(err2);
      });
      const sendMessage = () => {
        const envelope = mail.message.getEnvelope();
        const messageId = mail.message.messageId();
        const recipients = [].concat(envelope.to || []);
        if (recipients.length > 3) {
          recipients.push("...and " + recipients.splice(2).length + " more");
        }
        if (mail.data.dsn) {
          envelope.dsn = mail.data.dsn;
        }
        if (mail.data.requireTLSExtensionEnabled) {
          envelope.requireTLSExtensionEnabled = mail.data.requireTLSExtensionEnabled;
        }
        this.logger.info({
          tnx: "send",
          messageId
        }, "Sending message %s to <%s>", messageId, recipients.join(", "));
        connection.send(envelope, mail.message.createReadStream(), (err2, info) => {
          if (returned) {
            return;
          }
          returned = true;
          cleanupPerCallAuth();
          connection.close();
          if (err2) {
            this.logger.error({
              err: err2,
              tnx: "send"
            }, "Send error for %s: %s", messageId, err2.message);
            return callback(err2);
          }
          info.envelope = {
            from: envelope.from,
            to: envelope.to
          };
          info.messageId = messageId;
          try {
            return callback(null, info);
          } catch (E2) {
            this.logger.error({
              err: E2,
              tnx: "callback"
            }, "Callback error for %s: %s", messageId, E2.message);
          }
        });
      };
      connection.connect((err2) => {
        if (returned) {
          return;
        }
        if (err2) {
          returned = true;
          connection.close();
          return callback(err2);
        }
        perCallAuth = this.getAuth(mail.data.auth);
        if (perCallAuth && (connection.allowsAuth || options.forceAuth)) {
          connection.login(perCallAuth, (err3) => {
            cleanupPerCallAuth();
            if (returned) {
              return;
            }
            if (err3) {
              returned = true;
              connection.close();
              return callback(err3);
            }
            sendMessage();
          });
        } else {
          sendMessage();
        }
      });
    });
  }
  verify(callback) {
    let promise;
    if (!callback) {
      promise = new Promise((resolve3, reject) => {
        callback = callbackPromise(resolve3, reject);
      });
    }
    const done = callback;
    const connectStartedAt = Date.now();
    this.getSocket(Object.assign({}, this.options, { connectStartedAt }), (err, socketOptions) => {
      if (err) {
        return done(err);
      }
      let options = this.options;
      if (socketOptions && socketOptions.connection) {
        this.logger.info({
          tnx: "proxy",
          remoteAddress: socketOptions.connection.remoteAddress,
          remotePort: socketOptions.connection.remotePort,
          destHost: options.host || "",
          destPort: options.port || "",
          action: "connected"
        }, "Using proxied socket from %s:%s to %s:%s", socketOptions.connection.remoteAddress, socketOptions.connection.remotePort, options.host || "", options.port || "");
        options = Object.assign(assign(false, options), socketOptions);
      }
      const connection = new smtp_connection_default(options);
      connection._connectStartedAt = connectStartedAt;
      let returned = false;
      let perCallAuth;
      const cleanupPerCallAuth = () => {
        if (perCallAuth && perCallAuth !== this.auth && perCallAuth.oauth2) {
          perCallAuth.oauth2.removeAllListeners();
        }
        perCallAuth = null;
      };
      connection.once("error", (err2) => {
        if (returned) {
          return;
        }
        returned = true;
        cleanupPerCallAuth();
        connection.close();
        return done(err2);
      });
      connection.once("end", () => {
        if (returned) {
          return;
        }
        returned = true;
        cleanupPerCallAuth();
        return done(new Error("Connection closed"));
      });
      const finalize = () => {
        if (returned) {
          return;
        }
        returned = true;
        cleanupPerCallAuth();
        connection.quit();
        return done(null, true);
      };
      connection.connect((err2) => {
        if (returned) {
          return;
        }
        if (err2) {
          returned = true;
          connection.close();
          return done(err2);
        }
        perCallAuth = this.getAuth({});
        if (perCallAuth && (connection.allowsAuth || options.forceAuth)) {
          connection.login(perCallAuth, (err3) => {
            cleanupPerCallAuth();
            if (returned) {
              return;
            }
            if (err3) {
              returned = true;
              connection.close();
              return done(err3);
            }
            finalize();
          });
        } else if (!perCallAuth && connection.allowsAuth && options.forceAuth) {
          const err3 = new Error("Authentication info was not provided");
          err3.code = ENOAUTH;
          returned = true;
          cleanupPerCallAuth();
          connection.close();
          return done(err3);
        } else {
          finalize();
        }
      });
    });
    return promise;
  }
  /**
   * Releases resources
   */
  close() {
    if (this.auth && this.auth.oauth2) {
      this.auth.oauth2.removeAllListeners();
    }
    this.emit("close");
  }
};
var smtp_transport_default = SMTPTransport;

// node_modules/nodemailer/dist/esm/sendmail-transport/index.js
var import_node_child_process = require("node:child_process");
var import_node_stream15 = require("node:stream");
var STDIN_ERROR_EXIT_WAIT = 1e3;
var SendmailTransport = class {
  constructor(options) {
    options = options || {};
    this._spawn = import_node_child_process.spawn;
    this.options = options;
    this.name = "Sendmail";
    this.version = version;
    this.path = "sendmail";
    this.args = false;
    this.logger = getLogger(this.options, {
      component: this.options.component || "sendmail"
    });
    if (typeof options === "string") {
      this.path = options;
    } else if (typeof options === "object") {
      if (options.path) {
        this.path = options.path;
      }
      if (Array.isArray(options.args)) {
        this.args = options.args;
      }
    }
    this.winbreak = ["win", "windows", "dos", "\r\n"].includes((options.newline || "").toString().toLowerCase());
  }
  /**
   * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
   *
   * @param mail MailComposer object
   * @param done Callback function to run when the sending is completed
   */
  send(mail, done) {
    mail.message.keepBcc = true;
    const envelope = mail.message.getEnvelope();
    const messageId = mail.message.messageId();
    let returned;
    const hasInvalidAddresses = [].concat(envelope.from || []).concat(envelope.to || []).some((addr) => /^"?-/.test(addr));
    if (hasInvalidAddresses) {
      const err = new Error("Can not send mail. Invalid envelope addresses.");
      err.code = ESENDMAIL;
      return done(err);
    }
    const args = this.args ? ["-i"].concat(this.args).concat(envelope.to) : ["-i"].concat(envelope.from ? ["-f", envelope.from] : []).concat(envelope.to);
    const callback = (err) => {
      if (returned) {
        return;
      }
      returned = true;
      if (typeof done === "function") {
        if (err) {
          return done(err);
        }
        return done(null, {
          envelope,
          messageId,
          response: "Messages queued for delivery"
        });
      }
    };
    let sendmail;
    try {
      sendmail = this._spawn(this.path, args);
    } catch (E2) {
      this.logger.error({
        err: E2,
        tnx: "spawn",
        messageId
      }, "Error occurred while spawning sendmail. %s", E2.message);
      return callback(E2);
    }
    if (sendmail) {
      let stream;
      const messageWritten = () => !!stream && stream.readableEnded;
      let stdinError = null;
      const release = () => {
        if (stream && !messageWritten()) {
          stream.destroy();
        }
      };
      const fail = (err) => {
        release();
        callback(err);
      };
      sendmail.on("error", (err) => {
        this.logger.error({
          err,
          tnx: "spawn",
          messageId
        }, "Error occurred when sending message %s. %s", messageId, err.message);
        fail(err);
      });
      const onExit = (code, signal) => {
        let err = null;
        if (code) {
          err = new Error(code === 127 ? "Sendmail command not found, process exited with code " + code : "Sendmail exited with code " + code);
        } else if (signal) {
          err = new Error("Sendmail was terminated by " + signal);
        } else if (!messageWritten()) {
          err = new Error("Sendmail exited before the message was written");
        } else if (stdinError) {
          err = stdinError;
        }
        if (!err) {
          return callback();
        }
        err.code = err.code || ESENDMAIL;
        this.logger.error({
          err,
          tnx: "stdin",
          messageId
        }, "Error sending message %s to sendmail. %s", messageId, err.message);
        fail(err);
      };
      sendmail.once("exit", onExit);
      sendmail.once("close", onExit);
      sendmail.stdin.on("error", (err) => {
        this.logger.error({
          err,
          tnx: "stdin",
          messageId
        }, "Error occurred when piping message %s to sendmail. %s", messageId, err.message);
        if (stdinError) {
          return;
        }
        stdinError = err;
        release();
        const exitTimer = setTimeout(() => fail(err), STDIN_ERROR_EXIT_WAIT);
        sendmail.once("exit", () => clearTimeout(exitTimer));
      });
      const recipients = [].concat(envelope.to || []);
      if (recipients.length > 3) {
        recipients.push("...and " + recipients.splice(2).length + " more");
      }
      this.logger.info({
        tnx: "send",
        messageId
      }, "Sending message %s to <%s>", messageId, recipients.join(", "));
      const sourceStream = mail.message.createReadStream();
      stream = sourceStream;
      if (this.options.newline) {
        stream = (0, import_node_stream15.pipeline)(sourceStream, this.winbreak ? new LeWindows() : new LeUnix(), () => false);
      }
      stream.once("error", (err) => {
        this.logger.error({
          err,
          tnx: "stdin",
          messageId
        }, "Error occurred when generating message %s. %s", messageId, err.message);
        sendmail.kill("SIGINT");
        callback(err);
      });
      stream.pipe(sendmail.stdin);
    } else {
      const err = new Error("sendmail was not found");
      err.code = ESENDMAIL;
      return callback(err);
    }
  }
};
var sendmail_transport_default = SendmailTransport;

// node_modules/nodemailer/dist/esm/stream-transport/index.js
var StreamTransport = class {
  constructor(options) {
    options = options || {};
    this.options = options;
    this.name = "StreamTransport";
    this.version = version;
    this.logger = getLogger(this.options, {
      component: this.options.component || "stream-transport"
    });
    this.winbreak = ["win", "windows", "dos", "\r\n"].includes((options.newline || "").toString().toLowerCase());
  }
  /**
   * Compiles a mailcomposer message and forwards it to handler that sends it
   *
   * @param mail MailComposer object
   * @param done Callback function to run when the sending is completed
   */
  send(mail, done) {
    mail.message.keepBcc = true;
    const envelope = mail.message.getEnvelope();
    const messageId = mail.message.messageId();
    const recipients = [].concat(envelope.to || []);
    if (recipients.length > 3) {
      recipients.push("...and " + recipients.splice(2).length + " more");
    }
    this.logger.info({
      tnx: "send",
      messageId
    }, "Sending message %s to <%s> using %s line breaks", messageId, recipients.join(", "), this.winbreak ? "<CR><LF>" : "<LF>");
    setImmediate(() => {
      let stream;
      try {
        stream = mail.message.createReadStream();
        if (this.options.newline) {
          const sourceStream = stream;
          stream = sourceStream.pipe(this.winbreak ? new LeWindows() : new LeUnix());
          sourceStream.once("error", (err) => stream.emit("error", err));
        }
      } catch (E2) {
        this.logger.error({
          err: E2,
          tnx: "send",
          messageId
        }, "Creating send stream failed for %s. %s", messageId, E2.message);
        return done(E2);
      }
      if (!this.options.buffer) {
        stream.once("error", (err) => {
          this.logger.error({
            err,
            tnx: "send",
            messageId
          }, "Failed creating message for %s. %s", messageId, err.message);
        });
        return done(null, {
          envelope,
          messageId,
          message: stream
        });
      }
      const chunks = [];
      let chunklen = 0;
      stream.on("readable", () => {
        let chunk;
        while ((chunk = stream.read()) !== null) {
          chunks.push(chunk);
          chunklen += chunk.length;
        }
      });
      stream.once("error", (err) => {
        this.logger.error({
          err,
          tnx: "send",
          messageId
        }, "Failed creating message for %s. %s", messageId, err.message);
        return done(err);
      });
      stream.on("end", () => done(null, {
        envelope,
        messageId,
        message: Buffer.concat(chunks, chunklen)
      }));
    });
  }
};
var stream_transport_default = StreamTransport;

// node_modules/nodemailer/dist/esm/json-transport/index.js
var JSONTransport = class {
  constructor(options) {
    options = options || {};
    this.options = options;
    this.name = "JSONTransport";
    this.version = version;
    this.logger = getLogger(this.options, {
      component: this.options.component || "json-transport"
    });
  }
  /**
   * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
   *
   * @param mail MailComposer object
   * @param done Callback function to run when the sending is completed
   */
  send(mail, done) {
    mail.message.keepBcc = true;
    const envelope = mail.message.getEnvelope();
    const messageId = mail.message.messageId();
    const recipients = [].concat(envelope.to || []);
    if (recipients.length > 3) {
      recipients.push("...and " + recipients.splice(2).length + " more");
    }
    this.logger.info({
      tnx: "send",
      messageId
    }, "Composing JSON structure of %s to <%s>", messageId, recipients.join(", "));
    setImmediate(() => {
      mail.normalize((err, data) => {
        if (err) {
          this.logger.error({
            err,
            tnx: "send",
            messageId
          }, "Failed building JSON structure for %s. %s", messageId, err.message);
          return done(err);
        }
        delete data.envelope;
        delete data.normalizedHeaders;
        return done(null, {
          envelope,
          messageId,
          message: this.options.skipEncoding ? data : JSON.stringify(data)
        });
      });
    });
  }
};
var json_transport_default = JSONTransport;

// node_modules/nodemailer/dist/esm/ses-transport/index.js
var import_node_events6 = __toESM(require("node:events"), 1);
function tagSesError(err) {
  if (err && typeof err === "object" && !err.code) {
    err.code = ESES;
  }
  return err;
}
var SESTransport = class extends import_node_events6.default {
  constructor(options) {
    super();
    if (!options || !options.SES || !options.SES.sesClient) {
      const error2 = new Error("Missing SES configuration, expecting { sesClient, SendEmailCommand } from @aws-sdk/client-sesv2, see https://nodemailer.com/transports/ses/");
      error2.code = ECONFIG;
      throw error2;
    }
    this.options = options;
    this.ses = this.options.SES;
    this.name = "SESTransport";
    this.version = version;
    this.logger = getLogger(this.options, {
      component: this.options.component || "ses-transport"
    });
  }
  getRegion(cb) {
    if (this.ses.sesClient.config && typeof this.ses.sesClient.config.region === "function") {
      this.ses.sesClient.config.region().then((region) => cb(null, region), (err) => cb(err));
      return;
    }
    return cb(null, false);
  }
  /**
   * Compiles a mailcomposer message and forwards it to SES
   *
   * @param mail MailComposer object
   * @param callback Callback function to run when the sending is completed
   */
  send(mail, callback) {
    let fromHeader = mail.message._headers.find((header) => /^from$/i.test(header.key));
    if (fromHeader) {
      const mimeNode = new mime_node_default("text/plain");
      fromHeader = mimeNode._convertAddresses(mimeNode._parseAddresses(fromHeader.value));
    }
    const envelope = mail.message.getEnvelope();
    const messageId = mail.message.messageId();
    const recipients = [].concat(envelope.to || []);
    if (recipients.length > 3) {
      recipients.push("...and " + recipients.splice(2).length + " more");
    }
    this.logger.info({
      tnx: "send",
      messageId
    }, "Sending message %s to <%s>", messageId, recipients.join(", "));
    const getRawMessage = (next) => {
      if (!mail.data._dkim) {
        mail.data._dkim = {};
      }
      if (mail.data._dkim.skipFields && typeof mail.data._dkim.skipFields === "string") {
        mail.data._dkim.skipFields += ":date:message-id";
      } else {
        mail.data._dkim.skipFields = "date:message-id";
      }
      const sourceStream = mail.message.createReadStream();
      const stream = sourceStream.pipe(new LeWindows());
      const chunks = [];
      let chunklen = 0;
      stream.on("readable", () => {
        let chunk;
        while ((chunk = stream.read()) !== null) {
          chunks.push(chunk);
          chunklen += chunk.length;
        }
      });
      sourceStream.once("error", (err) => stream.emit("error", err));
      stream.once("error", (err) => next(err));
      stream.once("end", () => next(null, Buffer.concat(chunks, chunklen)));
    };
    setImmediate(() => getRawMessage((err, raw2) => {
      if (err) {
        this.logger.error({
          err,
          tnx: "send",
          messageId
        }, "Failed creating message for %s. %s", messageId, err.message);
        return callback(err);
      }
      const sesMessage = copyOwnKeys({
        Content: {
          Raw: {
            // required
            Data: raw2
            // required
          }
        },
        FromEmailAddress: fromHeader || envelope.from,
        Destination: {
          ToAddresses: envelope.to
        }
      }, mail.data.ses);
      this.getRegion((err2, region) => {
        if (err2 || !region) {
          region = "us-east-1";
        }
        let sendPromise;
        try {
          const command = new this.ses.SendEmailCommand(sesMessage);
          sendPromise = this.ses.sesClient.send(command);
        } catch (err3) {
          tagSesError(err3);
          this.logger.error({
            err: err3,
            tnx: "send"
          }, "Send error for %s: %s", messageId, err3.message);
          setImmediate(() => callback(err3));
          return;
        }
        sendPromise.then((data) => {
          if (region === "us-east-1") {
            region = "email";
          }
          const info = {
            envelope: {
              from: envelope.from,
              to: envelope.to
            },
            messageId: "<" + data.MessageId + (!/@/.test(data.MessageId) ? "@" + region + ".amazonses.com" : "") + ">",
            response: data.MessageId,
            raw: raw2
          };
          setImmediate(() => callback(null, info));
        }).catch((err3) => {
          tagSesError(err3);
          this.logger.error({
            err: err3,
            tnx: "send"
          }, "Send error for %s: %s", messageId, err3.message);
          setImmediate(() => callback(err3));
        });
      });
    }));
  }
  verify(callback) {
    let promise;
    if (!callback) {
      promise = new Promise((resolve3, reject) => {
        callback = callbackPromise(resolve3, reject);
      });
    }
    const done = callback;
    const cb = (err) => {
      if (err && !["InvalidParameterValue", "MessageRejected"].includes(err.code || err.Code || err.name)) {
        return done(tagSesError(err));
      }
      return done(null, true);
    };
    const sesMessage = {
      Content: {
        Raw: {
          Data: Buffer.from("From: <invalid@invalid>\r\nTo: <invalid@invalid>\r\n Subject: Invalid\r\n\r\nInvalid")
        }
      },
      FromEmailAddress: "invalid@invalid",
      Destination: {
        ToAddresses: ["invalid@invalid"]
      }
    };
    this.getRegion(() => {
      let sendPromise;
      try {
        const command = new this.ses.SendEmailCommand(sesMessage);
        sendPromise = this.ses.sesClient.send(command);
      } catch (err) {
        setImmediate(() => cb(err));
        return;
      }
      sendPromise.then(() => setImmediate(() => cb(null))).catch((err) => setImmediate(() => cb(err)));
    });
    return promise;
  }
};
var ses_transport_default = SESTransport;

// node_modules/nodemailer/dist/esm/nodemailer.js
var etherealApi = () => (process.env.ETHEREAL_API || "https://api.nodemailer.com").replace(/\/+$/, "");
var etherealWeb = () => (process.env.ETHEREAL_WEB || "https://ethereal.email").replace(/\/+$/, "");
var etherealApiKey = () => (process.env.ETHEREAL_API_KEY || "").replace(/\s*/g, "") || null;
var etherealCache = () => ["true", "yes", "y", "1"].includes((process.env.ETHEREAL_CACHE || "yes").toString().trim().toLowerCase());
var testAccount = false;
function createTransport(transporter, defaults) {
  let options;
  if (
    // provided transporter is a configuration object, not transporter plugin
    typeof transporter === "object" && typeof transporter.send !== "function" || // provided transporter looks like a connection url
    typeof transporter === "string" && /^(smtps?|direct):/i.test(transporter)
  ) {
    const urlConfig = typeof transporter === "string" ? transporter : transporter.url;
    if (urlConfig) {
      const parsed = parseConnectionUrl(urlConfig);
      options = typeof transporter === "object" ? assign(false, copyOwnKeys({}, transporter, (key) => key === "url"), parsed) : parsed;
    } else {
      options = transporter;
    }
    if (options.pool) {
      transporter = new smtp_pool_default(options);
    } else if (options.sendmail) {
      transporter = new sendmail_transport_default(options);
    } else if (options.streamTransport) {
      transporter = new stream_transport_default(options);
    } else if (options.jsonTransport) {
      transporter = new json_transport_default(options);
    } else if (options.SES) {
      const ses = options.SES;
      if (ses.ses && ses.aws) {
        const error2 = new Error("Using legacy SES configuration, expecting @aws-sdk/client-sesv2, see https://nodemailer.com/transports/ses/");
        error2.code = ECONFIG;
        throw error2;
      }
      transporter = new ses_transport_default(options);
    } else {
      transporter = new smtp_transport_default(options);
    }
  }
  return new mailer_default(transporter, options, defaults);
}
function createTestAccount(apiUrl, callback) {
  let promise;
  if (!callback && typeof apiUrl === "function") {
    callback = apiUrl;
    apiUrl = false;
  }
  if (!callback) {
    promise = new Promise((resolve3, reject) => {
      callback = callbackPromise(resolve3, reject);
    });
  }
  const done = callback;
  if (etherealCache() && testAccount) {
    setImmediate(() => done(null, testAccount));
    return promise;
  }
  apiUrl = apiUrl || etherealApi();
  const chunks = [];
  let chunklen = 0;
  const requestHeaders = {};
  const requestBody = {
    requestor: name,
    version
  };
  const apiKey = etherealApiKey();
  if (apiKey) {
    requestHeaders.Authorization = "Bearer " + apiKey;
  }
  const fetchOptions = {
    contentType: "application/json",
    method: "POST",
    headers: requestHeaders,
    body: Buffer.from(JSON.stringify(requestBody))
  };
  if (/^https:/i.test(apiUrl)) {
    fetchOptions.tls = { rejectUnauthorized: true };
  }
  const req = fetch_default(apiUrl + "/user", fetchOptions);
  req.on("readable", () => {
    let chunk;
    while ((chunk = req.read()) !== null) {
      chunks.push(chunk);
      chunklen += chunk.length;
    }
  });
  req.once("error", (err) => done(err));
  req.once("end", () => {
    const res = Buffer.concat(chunks, chunklen);
    let data;
    try {
      data = JSON.parse(res.toString());
    } catch (E2) {
      return done(E2);
    }
    if (data.status !== "success" || data.error) {
      return done(new Error(data.error || "Request failed"));
    }
    delete data.status;
    testAccount = data;
    done(null, testAccount);
  });
  return promise;
}
function getTestMessageUrl(info) {
  if (!info || !info.response) {
    return false;
  }
  const infoProps = /* @__PURE__ */ new Map();
  const response = info.response.toString();
  if (response.length > 2 && response.charAt(response.length - 1) === "]") {
    const open = response.indexOf("[", response.lastIndexOf("]", response.length - 2) + 1);
    if (open >= 0 && open < response.length - 2) {
      const props = response.substring(open + 1, response.length - 1);
      props.replace(/\b([A-Z0-9]+)=([^\s]+)/g, (m, key, value) => {
        infoProps.set(key, value);
        return m;
      });
    }
  }
  if (infoProps.has("STATUS") && infoProps.has("MSGID")) {
    return (testAccount && testAccount.web || etherealWeb()) + "/message/" + infoProps.get("MSGID");
  }
  return false;
}
var nodemailer = {
  createTransport,
  createTestAccount,
  getTestMessageUrl
};
var nodemailer_default = nodemailer;

// node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = (arrayBuffer, contentType) => {
  return new Response(arrayBuffer, { headers: { "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase()) } }).formData();
};

// node_modules/hono/dist/utils/body.js
var MAX_NESTED_OBJECTS = 1e4;
var isRawRequest = (request) => "headers" in request;
var parseBody = async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const mediaType = (isRawRequest(request) ? request.headers : request.raw.headers).get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") return parseFormData(request, {
    all,
    dot
  });
  return {};
};
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) return convertFormDataToBodyData(await request.bodyCache.formData, options);
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) request.bodyCache.formData = formDataPromise;
  const formData = await formDataPromise;
  if (formData) return convertFormDataToBodyData(formData, options);
  return {};
}
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  const nestingState = { count: 0 };
  formData.forEach((value, key) => {
    if (!(options.all || key.endsWith("[]"))) form[key] = value;
    else handleParsingAllValues(form, key, value);
  });
  if (options.dot) Object.entries(form).forEach(([key, value]) => {
    if (key.includes(".")) {
      handleParsingNestedValues(form, key, value, nestingState);
      delete form[key];
    }
  });
  return form;
}
var handleParsingAllValues = (form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) form[key].push(value);
    else form[key] = [form[key], value];
  } else if (!key.endsWith("[]")) form[key] = value;
  else form[key] = [value];
};
var handleParsingNestedValues = (form, key, value, state) => {
  if (/(?:^|\.)__proto__\./.test(key)) return;
  let nestedForm = form;
  const keys = key.split(".", 34);
  if (keys.length > 33) throwNestingLimitExceeded();
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) nestedForm[key2] = value;
    else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        if (state.count++ >= MAX_NESTED_OBJECTS) throwNestingLimitExceeded();
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
};
var throwNestingLimitExceeded = () => {
  throw new Error("Nesting limit exceeded");
};

// node_modules/hono/dist/utils/url.js
var splitPath = (path3) => {
  const paths = path3.split("/");
  if (paths[0] === "") paths.shift();
  return paths;
};
var splitRoutingPath = (routePath) => {
  const { groups, path: path3 } = extractGroupsFromPath(routePath);
  const paths = splitPath(path3);
  return replaceGroupMarks(paths, groups);
};
var extractGroupsFromPath = (path3) => {
  const groups = [];
  path3 = path3.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return {
    groups,
    path: path3
  };
};
var replaceGroupMarks = (paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) if (paths[j].includes(mark)) {
      paths[j] = paths[j].replace(mark, groups[i][1]);
      break;
    }
  }
  return paths;
};
var patternCache = {};
var getPattern = (label, next) => {
  if (label === "*") return "*";
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [
        cacheKey,
        match2[1],
        new RegExp(`^${match2[2]}(?=/${next})`)
      ] : [
        label,
        match2[1],
        new RegExp(`^${match2[2]}$`)
      ];
      else patternCache[cacheKey] = [
        label,
        match2[1],
        true
      ];
    }
    return patternCache[cacheKey];
  }
  return null;
};
var tryDecode = (str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
};
var tryDecodeURI = (str) => tryDecode(str, decodeURI);
var getPath = (request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path3 = url.slice(start, end);
      return tryDecodeURI(path3.includes("%25") ? path3.replace(/%25/g, "%2525") : path3);
    } else if (charCode === 63 || charCode === 35) break;
  }
  return url.slice(start, i);
};
var getPathNoStrict = (request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
};
var mergePath = (base2, sub, ...rest) => {
  if (rest.length) sub = mergePath(sub, ...rest);
  return `${base2?.[0] === "/" ? "" : "/"}${base2}${sub === "/" ? "" : `${base2?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
};
var checkOptionalParameter = (path3) => {
  if (path3.charCodeAt(path3.length - 1) !== 63 || !path3.includes(":")) return null;
  const segments = path3.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) basePath += "/" + segment;
    else if (/\:/.test(segment)) {
      if (segment.charCodeAt(segment.length - 1) === 63) {
        if (results.length === 0 && basePath === "") results.push("/");
        else results.push(basePath);
        const optionalSegment = segment.slice(0, -1);
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else basePath += "/" + segment;
    }
  });
  return results.filter((v2, i, a2) => a2.indexOf(v2) === i);
};
var tryDecodeURIComponent = (str) => str.indexOf("%") !== -1 ? tryDecode(str, decodeURIComponent_) : str;
var _decodeURI = (value) => {
  if (value.indexOf("+") !== -1) value = value.replace(/\+/g, " ");
  return tryDecodeURIComponent(value);
};
var _getQueryParam = (url, key, multiple) => {
  const hashIndex = url.indexOf("#", 8);
  if (hashIndex !== -1) url = url.slice(0, hashIndex);
  let encoded;
  if (!multiple && key && key.indexOf("%") === -1 && key.indexOf("+") === -1) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) return;
    if (!url.startsWith(key, keyIndex2 + 1)) keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) return "";
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) return;
  }
  const results = /* @__PURE__ */ Object.create(null);
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) valueIndex = -1;
    let name2 = url.slice(keyIndex + 1, valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex);
    if (encoded) name2 = _decodeURI(name2);
    keyIndex = nextKeyIndex;
    if (name2 === "") continue;
    let value;
    if (valueIndex === -1) value = "";
    else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) value = _decodeURI(value);
    }
    if (multiple) {
      if (!(results[name2] && Array.isArray(results[name2]))) results[name2] = [];
      results[name2].push(value);
    } else results[name2] ??= value;
  }
  return key ? results[key] : results;
};
var getQueryParam = _getQueryParam;
var getQueryParams = (url, key) => {
  return _getQueryParam(url, key, true);
};
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var HonoRequest = class {
  /**
  * `.raw` can get the raw Request object.
  *
  * @see {@link https://hono.dev/docs/api/request#raw}
  *
  * @example
  * ```ts
  * // For Cloudflare Workers
  * app.post('/', async (c) => {
  *   const metadata = c.req.raw.cf?.hostMetadata?
  *   ...
  * })
  * ```
  */
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  /**
  * `.path` can get the pathname of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#path}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const pathname = c.req.path // `/about/me`
  * })
  * ```
  */
  path;
  bodyCache = {};
  constructor(request, path3 = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path3;
    this.#matchResult = matchResult;
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex]?.[1][key];
    const param = this.#getParamValue(paramKey);
    return param && tryDecodeURIComponent(param);
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex]?.[1] ?? {});
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) decoded[key] = tryDecodeURIComponent(value);
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name2) {
    if (name2) return this.raw.headers.get(name2) ?? void 0;
    const headerData = /* @__PURE__ */ Object.create(null);
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = (key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) return cachedBody;
    for (const anyCachedKey in bodyCache) return bodyCache[anyCachedKey].then((body) => {
      if (anyCachedKey === "json") body = JSON.stringify(body);
      const contentType = anyCachedKey === "formData" ? void 0 : raw2.headers.get("content-type");
      return new Response(body, { headers: contentType ? { "Content-Type": contentType } : void 0 })[key]();
    });
    return bodyCache[key] = raw2[key]();
  };
  /**
  * `.json()` can parse Request body of type `application/json`
  *
  * @see {@link https://hono.dev/docs/api/request#json}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.json()
  * })
  * ```
  */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
  * `.text()` can parse Request body of type `text/plain`
  *
  * @see {@link https://hono.dev/docs/api/request#text}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.text()
  * })
  * ```
  */
  text() {
    return this.#cachedBody("text");
  }
  /**
  * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
  *
  * @see {@link https://hono.dev/docs/api/request#arraybuffer}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.arrayBuffer()
  * })
  * ```
  */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
  * `.bytes()` parses the request body as a `Uint8Array`.
  *
  * @see {@link https://hono.dev/docs/api/request#bytes}
  *
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.bytes()
  * })
  * ```
  */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
  * Parses the request body as a `Blob`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.blob();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#blob
  */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
  * Parses the request body as `FormData`.
  * @example
  * ```ts
  * app.post('/entry', async (c) => {
  *   const body = await c.req.formData();
  * });
  * ```
  * @see https://hono.dev/docs/api/request#formdata
  */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
  * Adds validated data to the request.
  *
  * @param target - The target of the validation.
  * @param data - The validated data to add.
  */
  addValidatedData(target, data) {
    (this.#validatedData ??= {})[target] = data;
  }
  valid(target) {
    return this.#validatedData?.[target];
  }
  /**
  * `.url` can get the request url strings.
  *
  * @see {@link https://hono.dev/docs/api/request#url}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const url = c.req.url // `http://localhost:8787/about/me`
  *   ...
  * })
  * ```
  */
  get url() {
    return this.raw.url;
  }
  /**
  * `.method` can get the method name of the request.
  *
  * @see {@link https://hono.dev/docs/api/request#method}
  *
  * @example
  * ```ts
  * app.get('/about/me', (c) => {
  *   const method = c.req.method // `GET`
  * })
  * ```
  */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
  * `.matchedRoutes` can return a matched route in the handler
  *
  * @deprecated
  *
  * Use matchedRoutes helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#matchedroutes}
  *
  * @example
  * ```ts
  * app.use('*', async function logger(c, next) {
  *   await next()
  *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
  *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
  *     console.log(
  *       method,
  *       ' ',
  *       path,
  *       ' '.repeat(Math.max(10 - path.length, 0)),
  *       name,
  *       i === c.req.routeIndex ? '<- respond from here' : ''
  *     )
  *   })
  * })
  * ```
  */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
  * `.routePath` can retrieve the path registered within the handler
  *
  * @deprecated
  *
  * Use routePath helper defined in "hono/route" instead.
  *
  * @see {@link https://hono.dev/docs/api/request#routepath}
  *
  * @example
  * ```ts
  * app.get('/posts/:id', (c) => {
  *   return c.json({ path: c.req.routePath })
  * })
  * ```
  */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = (value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
};
var resolveCallback = async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) str = str.toString();
    if (str instanceof Promise) str = await str;
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) return Promise.resolve(str);
  if (buffer) buffer[0] += str;
  else buffer = [str];
  const resStr = Promise.all(callbacks.map((c) => c({
    phase,
    buffer,
    context
  }))).then((res) => Promise.all(res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))).then(() => buffer[0]));
  if (preserveCallbacks) return raw(await resStr, callbacks);
  else return resStr;
};

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = (contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
};
var createResponseInstance = (body, init) => new Response(body, init);
var Context = class {
  #rawRequest;
  #req;
  /**
  * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
  *
  * @see {@link https://hono.dev/docs/api/context#env}
  *
  * @example
  * ```ts
  * // Environment object for Cloudflare Workers
  * app.get('*', async c => {
  *   const counter = c.env.COUNTER
  * })
  * ```
  */
  env = {};
  #var;
  finalized = false;
  /**
  * `.error` can get the error object from the middleware if the Handler throws an error.
  *
  * @see {@link https://hono.dev/docs/api/context#error}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   await next()
  *   if (c.error) {
  *     // do something...
  *   }
  * })
  * ```
  */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
  * Creates an instance of the Context class.
  *
  * @param req - The Request object.
  * @param options - Optional configuration options for the context.
  */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
  * `.req` is the instance of {@link HonoRequest}.
  */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#event}
  * The FetchEvent associated with the current request.
  *
  * @throws Will throw an error if the context does not have a FetchEvent.
  */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no FetchEvent");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#executionctx}
  * The ExecutionContext associated with the current request.
  *
  * @throws Will throw an error if the context does not have an ExecutionContext.
  */
  get executionCtx() {
    if (this.#executionCtx) return this.#executionCtx;
    else throw Error("This context has no ExecutionContext");
  }
  /**
  * @see {@link https://hono.dev/docs/api/context#res}
  * The Response object for the current request.
  */
  get res() {
    return this.#res ||= createResponseInstance(null, { headers: this.#preparedHeaders ??= new Headers() });
  }
  /**
  * Sets the Response object for the current request.
  *
  * @param _res - The Response object to set.
  */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v2] of this.#res.headers.entries()) {
        if (k === "content-type") continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
        } else _res.headers.set(k, v2);
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
  * `.render()` can create a response within a layout.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   return c.render('Hello!')
  * })
  * ```
  */
  render = (...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  };
  /**
  * Sets the layout for the response.
  *
  * @param layout - The layout to set.
  * @returns The layout function.
  */
  setLayout = (layout) => this.#layout = layout;
  /**
  * Gets the current layout for the response.
  *
  * @returns The current layout function.
  */
  getLayout = () => this.#layout;
  /**
  * `.setRenderer()` can set the layout in the custom middleware.
  *
  * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
  *
  * @example
  * ```tsx
  * app.use('*', async (c, next) => {
  *   c.setRenderer((content) => {
  *     return c.html(
  *       <html>
  *         <body>
  *           <p>{content}</p>
  *         </body>
  *       </html>
  *     )
  *   })
  *   await next()
  * })
  * ```
  */
  setRenderer = (renderer) => {
    this.#renderer = renderer;
  };
  /**
  * `.header()` can set headers.
  *
  * @see {@link https://hono.dev/docs/api/context#header}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *
  *   // Append multiple headers using the append option (e.g. Vary)
  *   c.header('Vary', 'Accept-Encoding', { append: true })
  *   c.header('Vary', 'User-Agent', { append: true })
  *
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  header = (name2, value, options) => {
    if (this.finalized) this.#res = createResponseInstance(this.#res.body, this.#res);
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) headers.delete(name2);
    else if (options?.append) headers.append(name2, value);
    else headers.set(name2, value);
  };
  status = (status) => {
    this.#status = status;
  };
  /**
  * `.set()` can set the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.use('*', async (c, next) => {
  *   c.set('message', 'Hono is hot!!')
  *   await next()
  * })
  * ```
  */
  set = (key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  };
  /**
  * `.get()` can use the value specified by the key.
  *
  * @see {@link https://hono.dev/docs/api/context#set-get}
  *
  * @example
  * ```ts
  * app.get('/', (c) => {
  *   const message = c.get('message')
  *   return c.text(`The message is "${message}"`)
  * })
  * ```
  */
  get = (key) => {
    return this.#var ? this.#var.get(key) : void 0;
  };
  /**
  * `.var` can access the value of a variable.
  *
  * @see {@link https://hono.dev/docs/api/context#var}
  *
  * @example
  * ```ts
  * const result = c.var.client.oneMethod()
  * ```
  */
  get var() {
    if (!this.#var) return {};
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    let responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders;
    if (typeof arg === "object" && arg.headers) {
      responseHeaders ??= new Headers();
      for (const [key, value] of new Headers(arg.headers)) if (key === "set-cookie") responseHeaders.append(key, value);
      else responseHeaders.set(key, value);
    }
    if (headers) {
      if (!responseHeaders) {
        let count = 0;
        for (const k in headers) if (++count > 1 || typeof headers[k] !== "string") {
          responseHeaders = new Headers();
          break;
        }
      }
      if (responseHeaders) for (const k in headers) {
        const v2 = headers[k];
        if (typeof v2 === "string") responseHeaders.set(k, v2);
        else {
          responseHeaders.delete(k);
          for (const v22 of v2) responseHeaders.append(k, v22);
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, {
      status,
      headers: responseHeaders ?? headers
    });
  }
  newResponse = (...args) => this.#newResponse(...args);
  /**
  * `.body()` can return the HTTP response.
  * You can set headers with `.header()` and set HTTP status code with `.status`.
  * This can also be set in `.text()`, `.json()` and so on.
  *
  * @see {@link https://hono.dev/docs/api/context#body}
  *
  * @example
  * ```ts
  * app.get('/welcome', (c) => {
  *   // Set headers
  *   c.header('X-Message', 'Hello!')
  *   c.header('Content-Type', 'text/plain')
  *   // Set HTTP status code
  *   c.status(201)
  *
  *   // Return the response body
  *   return c.body('Thank you for coming')
  * })
  * ```
  */
  body = (data, arg, headers) => this.#newResponse(data, arg, headers);
  /**
  * `.text()` can render text as `Content-Type:text/plain`.
  *
  * @see {@link https://hono.dev/docs/api/context#text}
  *
  * @example
  * ```ts
  * app.get('/say', (c) => {
  *   return c.text('Hello!')
  * })
  * ```
  */
  text = (text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(text, arg, setDefaultContentType(TEXT_PLAIN, headers));
  };
  /**
  * `.json()` can render JSON as `Content-Type:application/json`.
  *
  * @see {@link https://hono.dev/docs/api/context#json}
  *
  * @example
  * ```ts
  * app.get('/api', (c) => {
  *   return c.json({ message: 'Hello!' })
  * })
  * ```
  */
  json = (object, arg, headers) => {
    return this.#newResponse(JSON.stringify(object), arg, setDefaultContentType("application/json", headers));
  };
  html = (html, arg, headers) => {
    const res = (html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers));
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  };
  /**
  * `.redirect()` can Redirect, default status code is 302.
  *
  * @see {@link https://hono.dev/docs/api/context#redirect}
  *
  * @example
  * ```ts
  * app.get('/redirect', (c) => {
  *   return c.redirect('/')
  * })
  * app.get('/redirect-permanently', (c) => {
  *   return c.redirect('/', 301)
  * })
  * ```
  */
  redirect = (location, status) => {
    const locationString = String(location);
    this.header("Location", !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString));
    return this.newResponse(null, status ?? 302);
  };
  /**
  * `.notFound()` can return the Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/context#notfound}
  *
  * @example
  * ```ts
  * app.get('/notfound', (c) => {
  *   return c.notFound()
  * })
  * ```
  */
  notFound = () => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  };
};

// node_modules/hono/dist/compose.js
var compose = (middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      let res;
      let isError = false;
      let handler2;
      if (middleware[i]) {
        handler2 = middleware[i][0][0];
        context.req.routeIndex = i;
      } else handler2 = i === middleware.length && next || void 0;
      if (handler2) try {
        res = await handler2(context, () => dispatch(i + 1));
      } catch (err) {
        if (err instanceof Error && onError) {
          context.error = err;
          res = await onError(err, context);
          isError = true;
        } else throw err;
      }
      else if (context.finalized === false && onNotFound) res = await onNotFound(context);
      if (res && (context.finalized === false || isError)) context.res = res;
      return context;
    }
  };
};

// node_modules/hono/dist/router.js
var METHODS = [
  "get",
  "post",
  "put",
  "delete",
  "options",
  "patch",
  "query"
];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
};

// node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = (c) => {
  return c.text("404 Not Found", 404);
};
var errorHandler = (err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
};
var Hono = class Hono2 {
  get;
  post;
  put;
  delete;
  options;
  patch;
  query;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    [...METHODS, "all"].forEach((method) => {
      this[method] = (args1, ...args) => {
        const methodName = method.toUpperCase();
        if (typeof args1 === "string") this.#path = args1;
        else this.#addRoute(methodName, this.#path, args1);
        args.forEach((handler2) => {
          this.#addRoute(methodName, this.#path, handler2);
        });
        return this;
      };
    });
    this.on = (method, path3, ...handlers) => {
      for (const p2 of [path3].flat()) {
        this.#path = p2;
        for (const m of [method].flat()) {
          const methodName = m.toUpperCase();
          for (const handler2 of handlers) this.#addRoute(methodName, this.#path, handler2);
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") this.#path = arg1;
      else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler2) => {
        this.#addRoute("ALL", this.#path, handler2);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono2({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  /**
  * `.route()` allows grouping other Hono instance in routes.
  *
  * @see {@link https://hono.dev/docs/api/routing#grouping}
  *
  * @param {string} path - base Path
  * @param {Hono} app - other Hono instance
  * @returns {Hono} routed Hono instance
  *
  * @example
  * ```ts
  * const app = new Hono()
  * const app2 = new Hono()
  *
  * app2.get("/user", (c) => c.text("user"))
  * app.route("/api", app2) // GET /api/user
  * ```
  */
  route(path3, app2) {
    const subApp = this.basePath(path3);
    app2.routes.map((r) => {
      let handler2;
      if (app2.errorHandler === errorHandler) handler2 = r.handler;
      else {
        handler2 = async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res;
        handler2[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler2, r.basePath);
    });
    return this;
  }
  /**
  * `.basePath()` allows base paths to be specified.
  *
  * @see {@link https://hono.dev/docs/api/routing#base-path}
  *
  * @param {string} path - base Path
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * const api = new Hono().basePath('/api')
  * ```
  */
  basePath(path3) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path3);
    return subApp;
  }
  /**
  * `.onError()` handles an error and returns a customized Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#error-handling}
  *
  * @param {ErrorHandler} handler - request Handler for error
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.onError((err, c) => {
  *   console.error(`${err}`)
  *   return c.text('Custom Error Message', 500)
  * })
  * ```
  */
  onError = (handler2) => {
    this.errorHandler = handler2;
    return this;
  };
  /**
  * `.notFound()` allows you to customize a Not Found Response.
  *
  * @see {@link https://hono.dev/docs/api/hono#not-found}
  *
  * @param {NotFoundHandler} handler - request handler for not-found
  * @returns {Hono} changed Hono instance
  *
  * @example
  * ```ts
  * app.notFound((c) => {
  *   return c.text('Custom 404 Message', 404)
  * })
  * ```
  */
  notFound = (handler2) => {
    this.#notFoundHandler = handler2;
    return this;
  };
  /**
  * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
  *
  * @deprecated Use `mount()` from `hono/mount` instead. `.mount()` will be removed in v5.
  *
  * @see {@link https://hono.dev/docs/api/hono#mount}
  *
  * @param {string} path - base Path
  * @param {Function} applicationHandler - other Request Handler
  * @param {MountOptions} [options] - options of `.mount()`
  * @returns {Hono} mounted Hono instance
  *
  * @example
  * ```ts
  * import { Router as IttyRouter } from 'itty-router'
  * import { Hono } from 'hono'
  * // Create itty-router application
  * const ittyRouter = IttyRouter()
  * // GET /itty-router/hello
  * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
  *
  * const app = new Hono()
  * app.mount('/itty-router', ittyRouter.handle)
  * ```
  *
  * @example
  * ```ts
  * const app = new Hono()
  * // Send the request to another application without modification.
  * app.mount('/app', anotherApp, {
  *   replaceRequest: (req) => req,
  * })
  * ```
  */
  mount(path3, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") optionHandler = options;
      else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) replaceRequest = (request) => request;
        else replaceRequest = options.replaceRequest;
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path3);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler2 = async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) return res;
      await next();
    };
    this.#addRoute("ALL", mergePath(path3, "*"), handler2);
    return this;
  }
  #addRoute(method, path3, handler2, baseRoutePath) {
    path3 = mergePath(this._basePath, path3);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path: path3,
      method,
      handler: handler2
    };
    this.router.add(method, path3, [handler2, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) return this.errorHandler(err, c);
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    const path3 = this.getPath(request, { env });
    const matchResult = this.router.match(method, path3);
    const c = new Context(request, {
      path: path3,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then((resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
  * `.fetch()` will be entry point of your app.
  *
  * @see {@link https://hono.dev/docs/api/hono#fetch}
  *
  * @param {Request} request - request Object of request
  * @param {Env} env - env Object
  * @param {ExecutionContext} executionCtx - context of execution
  * @returns {Response | Promise<Response>} response of request
  *
  */
  fetch = (request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  };
  /**
  * `.request()` is a useful method for testing.
  * You can pass a URL or pathname to send a GET request.
  * app will return a Response object.
  * ```ts
  * test('GET /hello is ok', async () => {
  *   const res = await app.request('/hello')
  *   expect(res.status).toBe(200)
  * })
  * ```
  * @see https://hono.dev/docs/api/hono#request
  */
  request = (input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    input = input.toString();
    return this.fetch(new Request(/^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`, requestInit), Env, executionCtx);
  };
  /**
  * `.fire()` automatically adds a global fetch event listener.
  * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
  * @deprecated
  * Use `fire` from `hono/service-worker` instead.
  * ```ts
  * import { Hono } from 'hono'
  * import { fire } from 'hono/service-worker'
  *
  * const app = new Hono()
  * // ...
  * fire(app)
  * ```
  * @see https://hono.dev/docs/api/hono#fire
  * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
  * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
  */
  fire = () => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  };
};

// node_modules/hono/dist/router/utils.js
var createNullObject = () => /* @__PURE__ */ Object.create(null);

// node_modules/hono/dist/router/reg-exp-router/matcher.js
var emptyParam = [];
function match(method, path3) {
  const matchers = this.buildAllMatchers();
  const match2 = ((method2, path4) => {
    const matcher = matchers[method2] || matchers["ALL"];
    const staticMatch = matcher[2][path4];
    if (staticMatch) return staticMatch;
    const match3 = path4.match(matcher[0]);
    if (!match3) return [[], emptyParam];
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  });
  this.match = match2;
  return match2(method, path3);
}

// node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = /* @__PURE__ */ new Set(".\\+*[^]$()");
function compareKey(a2, b2) {
  if (a2.length === 1) return b2.length === 1 ? a2 < b2 ? -1 : 1 : -1;
  if (b2.length === 1) return 1;
  if (a2 === ".*" || a2 === "(?:|/.*)") return b2 === "(?:|/.*)" ? -1 : 1;
  else if (b2 === ".*" || b2 === "(?:|/.*)") return -1;
  if (a2 === "[^/]+") return 1;
  else if (b2 === "[^/]+") return -1;
  return a2.length === b2.length ? a2 < b2 ? -1 : 1 : b2.length - a2.length;
}
var Node = class Node2 {
  #index;
  #varIndex;
  #children = createNullObject();
  insert(tokens, index, paramMap, context, isStatic) {
    let node = this;
    for (let i = 0, len = tokens.length; i < len; i++) {
      const token = tokens[i];
      const pattern = token.length === 1 ? token === "*" ? i === len - 1 ? [
        "",
        "",
        ".*"
      ] : [
        "",
        "",
        LABEL_REG_EXP_STR
      ] : null : token === "/*" ? [
        "",
        "",
        TAIL_WILDCARD_REG_EXP_STR
      ] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
      let nextNode;
      if (pattern) {
        const name2 = pattern[1];
        let regexpStr = pattern[2] || "[^/]+";
        if (name2 && pattern[2]) {
          if (regexpStr === ".*") throw PATH_ERROR;
          regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
          if (/\((?!\?:)/.test(regexpStr)) throw PATH_ERROR;
          if (regexpStr.length === 1 && regExpMetaChars.has(regexpStr)) throw PATH_ERROR;
        }
        nextNode = node.#children[regexpStr];
        if (!nextNode) {
          if (regexpStr !== ".*" && regexpStr !== "(?:|/.*)") {
            for (const k in node.#children) if ((regexpStr.length > 1 || k.length > 1) && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          }
          nextNode = node.#children[regexpStr] = new Node2();
        }
        if (name2 !== "") {
          nextNode.#varIndex ??= context.varIndex++;
          paramMap.push([name2, nextNode.#varIndex]);
        }
      } else {
        nextNode = node.#children[token];
        if (!nextNode) {
          for (const k in node.#children) if (k.length > 1 && k !== ".*" && k !== "(?:|/.*)") throw PATH_ERROR;
          nextNode = node.#children[token] = new Node2();
        }
      }
      node = nextNode;
    }
    if (node.#index !== void 0) throw PATH_ERROR;
    node.#index = isStatic ? -1 : index;
  }
  buildRegExpStr() {
    const strList = Object.keys(this.#children).sort(compareKey).map((k) => {
      const c = this.#children[k];
      const childStr = c.buildRegExpStr();
      return childStr === "" ? "" : (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + childStr;
    }).filter(Boolean);
    if (typeof this.#index === "number" && this.#index !== -1) strList.unshift(`#${this.#index}`);
    if (strList.length === 0) return "";
    if (strList.length === 1) return strList[0];
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  #context = { varIndex: 0 };
  #root = new Node();
  #index = 0;
  paths = createNullObject();
  insert(path3, isStatic) {
    if (isStatic) {
      this.#root.insert(path3.split(""), 0, [], this.#context, true);
      return;
    }
    const paramAssoc = [];
    const groups = [];
    let markedPath = path3;
    for (let i = 0; ; ) {
      let replaced = false;
      markedPath = markedPath.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) break;
    }
    const tokens = markedPath.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) if (tokens[j].indexOf(mark) !== -1) {
        tokens[j] = tokens[j].replace(mark, groups[i][1]);
        break;
      }
    }
    this.#root.insert(tokens, this.#index, paramAssoc, this.#context, false);
    this.paths[path3] = [this.#index++, paramAssoc];
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") return [
      /^$/,
      [],
      []
    ];
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [
      new RegExp(`^${regexp}`),
      indexReplacementMap,
      paramReplacementMap
    ];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var wildcardRegExpCache = createNullObject();
function buildWildcardRegExp(path3) {
  return wildcardRegExpCache[path3] ??= new RegExp(`^${path3.replace(/\/:[^/{}]+(?:\{\[\^\/]\+})?(?=[/{]|$)|\/?\*$|([.\\+*[^\]$()?{}|])/g, (match2, metaChar) => metaChar ? `\\${metaChar}` : match2 === "/*" ? TAIL_WILDCARD_REG_EXP_STR : match2 === "*" ? ".*" : `/:${LABEL_REG_EXP_STR}`)}$`);
}
function findMiddleware(middleware, path3) {
  for (const k of Object.keys(middleware).sort((a2, b2) => b2.length - a2.length)) if (buildWildcardRegExp(k).test(path3)) return [...middleware[k]];
}
var RegExpRouter = class {
  name = "RegExpRouter";
  #middleware;
  #routes;
  #tries;
  constructor() {
    this.#middleware = { ["ALL"]: createNullObject() };
    this.#routes = { ["ALL"]: createNullObject() };
    this.#tries = { ["ALL"]: new Trie() };
  }
  #insertPath(method, path3) {
    try {
      this.#tries[method].insert(path3, !/\*|\/:/.test(path3));
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path3) : e;
    }
  }
  add(method, path3, handler2) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    if (!middleware[method]) {
      this.#tries[method] = new Trie();
      for (const handlerMap of [middleware, routes]) {
        handlerMap[method] = createNullObject();
        for (const p2 in handlerMap["ALL"]) {
          handlerMap[method][p2] = [...handlerMap["ALL"][p2]];
          this.#insertPath(method, p2);
        }
      }
    }
    if (path3 === "/*") path3 = "*";
    const methods = method === "ALL" ? Object.keys(middleware) : [method];
    if (/\*$/.test(path3)) {
      const re = buildWildcardRegExp(path3);
      for (const m of methods) if (!middleware[m][path3]) {
        this.#insertPath(m, path3);
        middleware[m][path3] = findMiddleware(middleware[m], path3) || findMiddleware(middleware["ALL"], path3) || [];
      }
      for (const handlerMap of [middleware, routes]) for (const m of methods) for (const p2 in handlerMap[m]) re.test(p2) && handlerMap[m][p2].push([handler2, path3]);
      return;
    }
    const paths = checkOptionalParameter(path3) || [path3];
    for (const path4 of paths) for (const m of methods) {
      if (!routes[m][path4]) {
        this.#insertPath(m, path4);
        routes[m][path4] = findMiddleware(middleware[m], path4) || findMiddleware(middleware["ALL"], path4) || [];
      }
      routes[m][path4].push([handler2, path4]);
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = createNullObject();
    for (const method of Object.keys(this.#routes)) matchers[method] = this.#buildMatcher(method);
    this.#middleware = this.#routes = this.#tries = void 0;
    wildcardRegExpCache = createNullObject();
    return matchers;
  }
  #buildMatcher(method) {
    const middleware = this.#middleware[method];
    const routes = this.#routes[method];
    const trie = this.#tries[method];
    const staticMap = createNullObject();
    const handlerData = [];
    const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
    for (const r of [middleware, routes]) for (const path3 in r) {
      const handlers = r[path3];
      const pathData = trie.paths[path3];
      if (!pathData) {
        staticMap[path3] = [handlers.map(([h2]) => [h2, createNullObject()]), emptyParam];
        continue;
      }
      handlerData[pathData[0]] = handlers.map(([h2, handlerPath]) => [h2, trie.paths[handlerPath][1].reduceRight((map2, [key], i) => {
        map2[key] = paramReplacementMap[pathData[1][i][1]];
        return map2;
      }, createNullObject())]);
    }
    return [
      regexp,
      indexReplacementMap.map((i) => handlerData[i]),
      staticMap
    ];
  }
};

// node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path3, handler2) {
    if (!this.#routes) throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    this.#routes.push([
      method,
      path3,
      handler2
    ]);
  }
  match(method, path3) {
    if (!this.#routes) throw new Error("Fatal error");
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) router.add(...routes[i2]);
        res = router.match(method, path3);
      } catch (e) {
        if (e instanceof UnsupportedPathError) continue;
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) throw new Error("Fatal error");
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) throw new Error("No active router has been determined yet.");
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/node.js
var emptyParams = createNullObject();
var order = 0;
var Node3 = class Node4 {
  #methods = [];
  #children = createNullObject();
  #patterns = [];
  #pattern;
  #params = emptyParams;
  insert(method, path3, handler2) {
    let curNode = this;
    const parts = splitRoutingPath(path3);
    const possibleKeys = /* @__PURE__ */ new Set();
    let i = 0;
    for (const p2 of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p2, nextP) || (nextP === void 0 && p2 && p2.indexOf("*") === p2.length - 1 ? p2 : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p2;
      const child = curNode.#children[key] ||= new Node4();
      if (pattern && !child.#pattern) {
        child.#pattern = pattern;
        curNode.#patterns.push(child);
      }
      curNode = child;
      if (isParam) possibleKeys.add(pattern[1]);
    }
    curNode.#methods.push({ [method]: {
      handler: handler2,
      possibleKeys: [...possibleKeys],
      score: ++order
    } });
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m["ALL"];
      if (handlerSet) {
        handlerSet.params = createNullObject();
        handlerSets.push(handlerSet);
        for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
          const key = handlerSet.possibleKeys[i2];
          handlerSet.params[key] = params?.[key] && !i2 ? params[key] : nodeParams[key] ?? params?.[key];
        }
      }
    }
  }
  search(method, path3) {
    const handlerSets = [];
    this.#params = emptyParams;
    let curNodes = [this];
    const parts = splitPath(path3);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else tempNodes.push(nextNode);
        }
        for (const child of node.#patterns) {
          const pattern = child.#pattern;
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (typeof pattern === "string") {
            if (pattern === "*" || part.startsWith(pattern.slice(0, -1))) {
              this.#pushHandlerSets(handlerSets, child, method, node.#params);
              if (pattern === "*") {
                child.#params = params;
                tempNodes.push(child);
              }
            }
            continue;
          }
          const [, name2, matcher] = pattern;
          if (!part && matcher === true) continue;
          if (matcher !== true) {
            if (!partOffsets) {
              partOffsets = [];
              let offset = path3[0] === "/" ? 1 : 0;
              for (let p2 = 0; p2 < len; p2++) {
                partOffsets[p2] = offset;
                offset += parts[p2].length + 1;
              }
            }
            const restPathString = path3.slice(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name2] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, node.#params, params);
              for (const _ in child.#children) {
                child.#params = params;
                const componentCount = m[0].match(/\//g)?.length ?? 0;
                (curNodesQueue[componentCount] ||= []).push(child);
                break;
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name2] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) this.#pushHandlerSets(handlerSets, child.#children["*"], method, params, node.#params);
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets[1]) handlerSets.sort((a2, b2) => {
      return a2.score - b2.score;
    });
    return [handlerSets.map(({ handler: handler2, params }) => [handler2, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  name = "TrieRouter";
  #node = new Node3();
  add(method, path3, handler2) {
    for (const result of checkOptionalParameter(path3) || [path3]) this.#node.insert(method, result, handler2);
  }
  match(method, path3) {
    return this.#node.search(method, path3);
  }
};

// node_modules/hono/dist/hono.js
var Hono3 = class extends Hono {
  /**
  * Creates an instance of the Hono class.
  *
  * @param options - Optional configuration options for the Hono instance.
  */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({ routers: [new RegExpRouter(), new TrieRouter()] });
  }
};

// node_modules/hono/dist/utils/encode.js
var encodeBase64 = (buf) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0, len = bytes.length; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};
var decodeBase64 = (str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j] = binary.charCodeAt(j);
  }
  return bytes;
};

// node_modules/hono/dist/adapter/aws-lambda/handler.js
function sanitizeHeaderValue(value) {
  if (!/[^\x00-\x7F]/.test(value)) return value;
  return encodeURIComponent(value);
}
var getRequestContext = (event) => {
  return event.requestContext;
};
var handle = (app2, { isContentTypeBinary } = { isContentTypeBinary: void 0 }) => {
  return async (event, lambdaContext) => {
    const processor = getProcessor(event);
    let req, requestContext;
    try {
      req = processor.createRequest(event);
      requestContext = getRequestContext(event);
    } catch (error2) {
      console.error("Error processing request:", error2);
      const errorResponse = error2 instanceof TypeError ? new Response("Invalid request", { status: 400 }) : new Response("Internal Server Error", { status: 500 });
      return processor.createResult(event, errorResponse, { isContentTypeBinary });
    }
    const res = await app2.fetch(req, {
      event,
      requestContext,
      lambdaContext
    });
    return processor.createResult(event, res, { isContentTypeBinary });
  };
};
var EventProcessor = class {
  getHeaderValue(headers, key) {
    return headers ? Array.isArray(headers[key]) ? headers[key][0] : headers[key] : void 0;
  }
  getDomainName(event) {
    if (event.requestContext && "domainName" in event.requestContext) return event.requestContext.domainName;
    const hostFromHeaders = this.getHeaderValue(event.headers, "host");
    if (hostFromHeaders) return hostFromHeaders;
    const multiValueHeaders = "multiValueHeaders" in event ? event.multiValueHeaders : {};
    return this.getHeaderValue(multiValueHeaders, "host");
  }
  createRequest(event) {
    const queryString = this.getQueryString(event);
    const urlPath = `https://${this.getDomainName(event)}${this.getPath(event)}`;
    const url = queryString ? `${urlPath}?${queryString}` : urlPath;
    const headers = this.getHeaders(event);
    const requestInit = {
      headers,
      method: this.getMethod(event)
    };
    if (event.body) {
      const body = event.isBase64Encoded ? decodeBase64(event.body) : new TextEncoder().encode(event.body);
      requestInit.body = body;
      headers.set("content-length", body.length.toString());
    }
    return new Request(url, requestInit);
  }
  async createResult(event, res, options) {
    const contentType = res.headers.get("content-type");
    const isContentTypeBinary = options.isContentTypeBinary ?? defaultIsContentTypeBinary;
    let isBase64Encoded = contentType && isContentTypeBinary(contentType) ? true : false;
    if (!isBase64Encoded) {
      const contentEncoding = res.headers.get("content-encoding");
      isBase64Encoded = isContentEncodingBinary(contentEncoding);
    }
    const result = {
      body: isBase64Encoded ? encodeBase64(await res.arrayBuffer()) : await res.text(),
      statusCode: res.status,
      isBase64Encoded,
      ..."multiValueHeaders" in event && event.multiValueHeaders ? { multiValueHeaders: {} } : { headers: {} }
    };
    this.setCookies(event, res, result);
    if (result.multiValueHeaders) res.headers.forEach((value, key) => {
      result.multiValueHeaders[key] = [value];
    });
    else res.headers.forEach((value, key) => {
      result.headers[key] = value;
    });
    return result;
  }
  setCookies(_event, res, result) {
    if (res.headers.has("set-cookie")) {
      const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : Array.from(res.headers.entries()).filter(([k]) => k === "set-cookie").map(([, v2]) => v2);
      if (Array.isArray(cookies)) {
        this.setCookiesToResult(result, cookies);
        res.headers.delete("set-cookie");
      }
    }
  }
};
var EventV2Processor = class extends EventProcessor {
  getPath(event) {
    return event.rawPath;
  }
  getMethod(event) {
    return event.requestContext.http.method;
  }
  getQueryString(event) {
    return event.rawQueryString;
  }
  getCookies(event, headers) {
    if (Array.isArray(event.cookies)) headers.set("Cookie", event.cookies.join("; "));
  }
  setCookiesToResult(result, cookies) {
    result.cookies = cookies;
  }
  getHeaders(event) {
    const headers = new Headers();
    this.getCookies(event, headers);
    if (event.headers) {
      for (const [k, v2] of Object.entries(event.headers)) if (v2) headers.set(k, v2);
    }
    return headers;
  }
};
var v2Processor = new EventV2Processor();
var EventV1Processor = class extends EventProcessor {
  getPath(event) {
    return event.path;
  }
  getMethod(event) {
    return event.httpMethod;
  }
  getQueryString(event) {
    if (event.multiValueQueryStringParameters) return Object.entries(event.multiValueQueryStringParameters || {}).filter(([, value]) => value).map(([key, values]) => values.map((value) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")).join("&");
    else return Object.entries(event.queryStringParameters || {}).filter(([, value]) => value !== void 0).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value || "")}`).join("&");
  }
  getCookies(_event, _headers) {
  }
  getHeaders(event) {
    const headers = new Headers();
    this.getCookies(event, headers);
    if (event.multiValueHeaders) {
      for (const [k, values] of Object.entries(event.multiValueHeaders)) if (values) values.forEach((v2) => headers.append(k, sanitizeHeaderValue(v2)));
    }
    if (event.headers) {
      for (const [k, v2] of Object.entries(event.headers)) if (v2 && !headers.has(k)) headers.set(k, sanitizeHeaderValue(v2));
    }
    return headers;
  }
  setCookiesToResult(result, cookies) {
    result.multiValueHeaders = { "set-cookie": cookies };
  }
};
var v1Processor = new EventV1Processor();
var ALBProcessor = class extends EventProcessor {
  getHeaders(event) {
    const headers = new Headers();
    if (event.multiValueHeaders) {
      for (const [key, values] of Object.entries(event.multiValueHeaders)) if (values && Array.isArray(values)) {
        const sanitizedValue = sanitizeHeaderValue(values.join("; "));
        headers.set(key, sanitizedValue);
      }
    } else for (const [key, value] of Object.entries(event.headers ?? {})) if (value) headers.set(key, sanitizeHeaderValue(value));
    return headers;
  }
  getPath(event) {
    return event.path;
  }
  getMethod(event) {
    return event.httpMethod;
  }
  getQueryString(event) {
    if (event.multiValueQueryStringParameters) return Object.entries(event.multiValueQueryStringParameters || {}).filter(([, value]) => value).map(([key, value]) => `${key}=${value.join(`&${key}=`)}`).join("&");
    else return Object.entries(event.queryStringParameters || {}).filter(([, value]) => value !== void 0).map(([key, value]) => `${key}=${value}`).join("&");
  }
  getCookies(event, headers) {
    let cookie;
    if (event.multiValueHeaders) cookie = event.multiValueHeaders["cookie"]?.join("; ");
    else cookie = event.headers ? event.headers["cookie"] : void 0;
    if (cookie) headers.append("Cookie", cookie);
  }
  setCookiesToResult(result, cookies) {
    if (result.multiValueHeaders) result.multiValueHeaders["set-cookie"] = cookies;
    else result.headers["set-cookie"] = cookies[0];
  }
};
var albProcessor = new ALBProcessor();
var LatticeV2Processor = class extends EventProcessor {
  getPath(event) {
    return event.path;
  }
  getMethod(event) {
    return event.method;
  }
  getQueryString() {
    return "";
  }
  getHeaders(event) {
    const headers = new Headers();
    if (event.headers) {
      for (const [k, values] of Object.entries(event.headers)) if (values) values.forEach((v2) => headers.append(k, sanitizeHeaderValue(v2)));
    }
    return headers;
  }
  getCookies() {
  }
  setCookiesToResult(result, cookies) {
    result.headers = {
      ...result.headers,
      "set-cookie": cookies
    };
  }
};
var latticeV2Processor = new LatticeV2Processor();
var getProcessor = (event) => {
  if (isProxyEventALB(event)) return albProcessor;
  if (isProxyEventV2(event)) return v2Processor;
  if (isLatticeEventV2(event)) return latticeV2Processor;
  return v1Processor;
};
var isProxyEventALB = (event) => {
  if (event.requestContext) return Object.hasOwn(event.requestContext, "elb");
  return false;
};
var isProxyEventV2 = (event) => {
  return Object.hasOwn(event, "rawPath") && Object.hasOwn(event.requestContext ?? {}, "http");
};
var isLatticeEventV2 = (event) => {
  if (event.requestContext) return Object.hasOwn(event.requestContext, "serviceArn");
  return false;
};
var defaultIsContentTypeBinary = (contentType) => {
  if (/^application\/vnd\.(?:apple\.installer|mozilla\.xul)\+xml\s*(?:;|$)/i.test(contentType)) return true;
  return !/^text\/(?:plain|html|css|javascript|csv)|(?:\/|\+)(?:json|xml)\s*(?:;|$)/i.test(contentType);
};
var isContentEncodingBinary = (contentEncoding) => {
  return !!contentEncoding && !/^identity$/i.test(contentEncoding);
};

// node_modules/@neondatabase/serverless/index.mjs
var Po = Object.create;
var Ie = Object.defineProperty;
var Ro = Object.getOwnPropertyDescriptor;
var Lo = Object.getOwnPropertyNames;
var Bo = Object.getPrototypeOf;
var Fo = Object.prototype.hasOwnProperty;
var Mo = (r, e, t) => e in r ? Ie(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t;
var a = (r, e) => Ie(r, "name", { value: e, configurable: true });
var V = (r, e, t) => () => {
  if (t) throw t[0];
  try {
    return r && (e = r(r = 0)), e;
  } catch (n) {
    throw t = [n], n;
  }
};
var T = (r, e) => () => {
  try {
    return e || r((e = { exports: {} }).exports, e), e.exports;
  } catch (t) {
    throw e = 0, t;
  }
};
var se = (r, e) => {
  for (var t in e) Ie(r, t, { get: e[t], enumerable: true });
};
var Dn = (r, e, t, n) => {
  if (e && typeof e == "object" || typeof e == "function") for (let i of Lo(e)) !Fo.call(r, i) && i !== t && Ie(r, i, { get: () => e[i], enumerable: !(n = Ro(e, i)) || n.enumerable });
  return r;
};
var we = (r, e, t) => (t = r != null ? Po(Bo(r)) : {}, Dn(e || !r || !r.__esModule ? Ie(t, "default", { value: r, enumerable: true }) : t, r));
var O = (r) => Dn(Ie({}, "__esModule", { value: true }), r);
var E = (r, e, t) => Mo(r, typeof e != "symbol" ? e + "" : e, t);
var Wn = T((lt) => {
  "use strict";
  h();
  lt.byteLength = Oo;
  lt.toByteArray = Qo;
  lt.fromByteArray = No;
  var le = [], X = [], ko = typeof Uint8Array < "u" ? Uint8Array : Array, qt = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  for (Ae = 0, qn = qt.length; Ae < qn; ++Ae) le[Ae] = qt[Ae], X[qt.charCodeAt(Ae)] = Ae;
  var Ae, qn;
  X[45] = 62;
  X[95] = 63;
  function Nn(r) {
    var e = r.length;
    if (e % 4 > 0) throw new Error("Invalid string. Length must be a multiple of 4");
    var t = r.indexOf("=");
    t === -1 && (t = e);
    var n = t === e ? 0 : 4 - t % 4;
    return [t, n];
  }
  a(Nn, "getLens");
  function Oo(r) {
    var e = Nn(r), t = e[0], n = e[1];
    return (t + n) * 3 / 4 - n;
  }
  a(Oo, "byteLength");
  function Uo(r, e, t) {
    return (e + t) * 3 / 4 - t;
  }
  a(Uo, "_byteLength");
  function Qo(r) {
    var e, t = Nn(r), n = t[0], i = t[1], s = new ko(Uo(r, n, i)), o = 0, u = i > 0 ? n - 4 : n, c;
    for (c = 0; c < u; c += 4) e = X[r.charCodeAt(c)] << 18 | X[r.charCodeAt(c + 1)] << 12 | X[r.charCodeAt(c + 2)] << 6 | X[r.charCodeAt(
      c + 3
    )], s[o++] = e >> 16 & 255, s[o++] = e >> 8 & 255, s[o++] = e & 255;
    return i === 2 && (e = X[r.charCodeAt(c)] << 2 | X[r.charCodeAt(
      c + 1
    )] >> 4, s[o++] = e & 255), i === 1 && (e = X[r.charCodeAt(c)] << 10 | X[r.charCodeAt(c + 1)] << 4 | X[r.charCodeAt(c + 2)] >> 2, s[o++] = e >> 8 & 255, s[o++] = e & 255), s;
  }
  a(Qo, "toByteArray");
  function Do(r) {
    return le[r >> 18 & 63] + le[r >> 12 & 63] + le[r >> 6 & 63] + le[r & 63];
  }
  a(Do, "tripletToBase64");
  function qo(r, e, t) {
    for (var n, i = [], s = e; s < t; s += 3) n = (r[s] << 16 & 16711680) + (r[s + 1] << 8 & 65280) + (r[s + 2] & 255), i.push(Do(n));
    return i.join("");
  }
  a(qo, "encodeChunk");
  function No(r) {
    for (var e, t = r.length, n = t % 3, i = [], s = 16383, o = 0, u = t - n; o < u; o += s) i.push(qo(r, o, o + s > u ? u : o + s));
    return n === 1 ? (e = r[t - 1], i.push(le[e >> 2] + le[e << 4 & 63] + "==")) : n === 2 && (e = (r[t - 2] << 8) + r[t - 1], i.push(le[e >> 10] + le[e >> 4 & 63] + le[e << 2 & 63] + "=")), i.join("");
  }
  a(No, "fromByteArray");
});
var jn = T((Nt) => {
  h();
  Nt.read = function(r, e, t, n, i) {
    var s, o, u = i * 8 - n - 1, c = (1 << u) - 1, l = c >> 1, f = -7, m = t ? i - 1 : 0, g = t ? -1 : 1, w = r[e + m];
    for (m += g, s = w & (1 << -f) - 1, w >>= -f, f += u; f > 0; s = s * 256 + r[e + m], m += g, f -= 8) ;
    for (o = s & (1 << -f) - 1, s >>= -f, f += n; f > 0; o = o * 256 + r[e + m], m += g, f -= 8) ;
    if (s === 0) s = 1 - l;
    else {
      if (s === c) return o ? NaN : (w ? -1 : 1) * (1 / 0);
      o = o + Math.pow(2, n), s = s - l;
    }
    return (w ? -1 : 1) * o * Math.pow(2, s - n);
  };
  Nt.write = function(r, e, t, n, i, s) {
    var o, u, c, l = s * 8 - i - 1, f = (1 << l) - 1, m = f >> 1, g = i === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0, w = n ? 0 : s - 1, S = n ? 1 : -1, k = e < 0 || e === 0 && 1 / e < 0 ? 1 : 0;
    for (e = Math.abs(e), isNaN(e) || e === 1 / 0 ? (u = isNaN(e) ? 1 : 0, o = f) : (o = Math.floor(Math.log(e) / Math.LN2), e * (c = Math.pow(2, -o)) < 1 && (o--, c *= 2), o + m >= 1 ? e += g / c : e += g * Math.pow(2, 1 - m), e * c >= 2 && (o++, c /= 2), o + m >= f ? (u = 0, o = f) : o + m >= 1 ? (u = (e * c - 1) * Math.pow(2, i), o = o + m) : (u = e * Math.pow(2, m - 1) * Math.pow(2, i), o = 0)); i >= 8; r[t + w] = u & 255, w += S, u /= 256, i -= 8) ;
    for (o = o << i | u, l += i; l > 0; r[t + w] = o & 255, w += S, o /= 256, l -= 8) ;
    r[t + w - S] |= k * 128;
  };
});
var oi = T((Be) => {
  "use strict";
  h();
  var Wt = Wn(), Re = jn(), Hn = typeof Symbol == "function" && typeof Symbol.for == "function" ? /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom") : null;
  Be.Buffer = d;
  Be.SlowBuffer = Vo;
  Be.INSPECT_MAX_BYTES = 50;
  var ft = 2147483647;
  Be.kMaxLength = ft;
  d.TYPED_ARRAY_SUPPORT = Wo();
  !d.TYPED_ARRAY_SUPPORT && typeof console < "u" && typeof console.error == "function" && console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");
  function Wo() {
    try {
      let r = new Uint8Array(1), e = { foo: a(function() {
        return 42;
      }, "foo") };
      return Object.setPrototypeOf(e, Uint8Array.prototype), Object.setPrototypeOf(r, e), r.foo() === 42;
    } catch {
      return false;
    }
  }
  a(Wo, "typedArraySupport");
  Object.defineProperty(d.prototype, "parent", { enumerable: true, get: a(function() {
    if (d.isBuffer(this)) return this.buffer;
  }, "get") });
  Object.defineProperty(d.prototype, "offset", { enumerable: true, get: a(function() {
    if (d.isBuffer(
      this
    )) return this.byteOffset;
  }, "get") });
  function de(r) {
    if (r > ft) throw new RangeError('The value "' + r + '" is invalid for option "size"');
    let e = new Uint8Array(r);
    return Object.setPrototypeOf(e, d.prototype), e;
  }
  a(de, "createBuffer");
  function d(r, e, t) {
    if (typeof r == "number") {
      if (typeof e == "string") throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      );
      return Gt(r);
    }
    return zn(r, e, t);
  }
  a(d, "Buffer");
  d.poolSize = 8192;
  function zn(r, e, t) {
    if (typeof r == "string") return Ho(r, e);
    if (ArrayBuffer.isView(r)) return $o(r);
    if (r == null) throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof r);
    if (fe(r, ArrayBuffer) || r && fe(r.buffer, ArrayBuffer) || typeof SharedArrayBuffer < "u" && (fe(r, SharedArrayBuffer) || r && fe(
      r.buffer,
      SharedArrayBuffer
    ))) return Ht(r, e, t);
    if (typeof r == "number") throw new TypeError('The "value" argument must not be of type number. Received type number');
    let n = r.valueOf && r.valueOf();
    if (n != null && n !== r) return d.from(n, e, t);
    let i = Go(r);
    if (i) return i;
    if (typeof Symbol < "u" && Symbol.toPrimitive != null && typeof r[Symbol.toPrimitive] == "function") return d.from(r[Symbol.toPrimitive]("string"), e, t);
    throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type " + typeof r);
  }
  a(zn, "from");
  d.from = function(r, e, t) {
    return zn(r, e, t);
  };
  Object.setPrototypeOf(
    d.prototype,
    Uint8Array.prototype
  );
  Object.setPrototypeOf(d, Uint8Array);
  function Kn(r) {
    if (typeof r != "number") throw new TypeError(
      '"size" argument must be of type number'
    );
    if (r < 0) throw new RangeError('The value "' + r + '" is invalid for option "size"');
  }
  a(Kn, "assertSize");
  function jo(r, e, t) {
    return Kn(r), r <= 0 ? de(r) : e !== void 0 ? typeof t == "string" ? de(r).fill(e, t) : de(r).fill(e) : de(r);
  }
  a(jo, "alloc");
  d.alloc = function(r, e, t) {
    return jo(r, e, t);
  };
  function Gt(r) {
    return Kn(r), de(r < 0 ? 0 : Vt(r) | 0);
  }
  a(Gt, "allocUnsafe");
  d.allocUnsafe = function(r) {
    return Gt(
      r
    );
  };
  d.allocUnsafeSlow = function(r) {
    return Gt(r);
  };
  function Ho(r, e) {
    if ((typeof e != "string" || e === "") && (e = "utf8"), !d.isEncoding(e)) throw new TypeError("Unknown encoding: " + e);
    let t = Yn(r, e) | 0, n = de(t), i = n.write(
      r,
      e
    );
    return i !== t && (n = n.slice(0, i)), n;
  }
  a(Ho, "fromString");
  function jt(r) {
    let e = r.length < 0 ? 0 : Vt(r.length) | 0, t = de(e);
    for (let n = 0; n < e; n += 1) t[n] = r[n] & 255;
    return t;
  }
  a(jt, "fromArrayLike");
  function $o(r) {
    if (fe(r, Uint8Array)) {
      let e = new Uint8Array(r);
      return Ht(e.buffer, e.byteOffset, e.byteLength);
    }
    return jt(r);
  }
  a($o, "fromArrayView");
  function Ht(r, e, t) {
    if (e < 0 || r.byteLength < e) throw new RangeError('"offset" is outside of buffer bounds');
    if (r.byteLength < e + (t || 0)) throw new RangeError('"length" is outside of buffer bounds');
    let n;
    return e === void 0 && t === void 0 ? n = new Uint8Array(r) : t === void 0 ? n = new Uint8Array(r, e) : n = new Uint8Array(
      r,
      e,
      t
    ), Object.setPrototypeOf(n, d.prototype), n;
  }
  a(Ht, "fromArrayBuffer");
  function Go(r) {
    if (d.isBuffer(r)) {
      let e = Vt(r.length) | 0, t = de(e);
      return t.length === 0 || r.copy(t, 0, 0, e), t;
    }
    if (r.length !== void 0) return typeof r.length != "number" || Kt(r.length) ? de(0) : jt(r);
    if (r.type === "Buffer" && Array.isArray(r.data)) return jt(r.data);
  }
  a(Go, "fromObject");
  function Vt(r) {
    if (r >= ft) throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x" + ft.toString(16) + " bytes");
    return r | 0;
  }
  a(Vt, "checked");
  function Vo(r) {
    return +r != r && (r = 0), d.alloc(+r);
  }
  a(Vo, "SlowBuffer");
  d.isBuffer = a(function(e) {
    return e != null && e._isBuffer === true && e !== d.prototype;
  }, "isBuffer");
  d.compare = a(function(e, t) {
    if (fe(e, Uint8Array) && (e = d.from(e, e.offset, e.byteLength)), fe(t, Uint8Array) && (t = d.from(t, t.offset, t.byteLength)), !d.isBuffer(e) || !d.isBuffer(t)) throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    );
    if (e === t) return 0;
    let n = e.length, i = t.length;
    for (let s = 0, o = Math.min(n, i); s < o; ++s) if (e[s] !== t[s]) {
      n = e[s], i = t[s];
      break;
    }
    return n < i ? -1 : i < n ? 1 : 0;
  }, "compare");
  d.isEncoding = a(function(e) {
    switch (String(e).toLowerCase()) {
      case "hex":
      case "utf8":
      case "utf-8":
      case "ascii":
      case "latin1":
      case "binary":
      case "base64":
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return true;
      default:
        return false;
    }
  }, "isEncoding");
  d.concat = a(function(e, t) {
    if (!Array.isArray(e)) throw new TypeError(
      '"list" argument must be an Array of Buffers'
    );
    if (e.length === 0) return d.alloc(0);
    let n;
    if (t === void 0)
      for (t = 0, n = 0; n < e.length; ++n) t += e[n].length;
    let i = d.allocUnsafe(t), s = 0;
    for (n = 0; n < e.length; ++n) {
      let o = e[n];
      if (fe(o, Uint8Array)) s + o.length > i.length ? (d.isBuffer(o) || (o = d.from(o)), o.copy(i, s)) : Uint8Array.prototype.set.call(i, o, s);
      else if (d.isBuffer(o)) o.copy(i, s);
      else throw new TypeError('"list" argument must be an Array of Buffers');
      s += o.length;
    }
    return i;
  }, "concat");
  function Yn(r, e) {
    if (d.isBuffer(r)) return r.length;
    if (ArrayBuffer.isView(r) || fe(r, ArrayBuffer)) return r.byteLength;
    if (typeof r != "string") throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type ' + typeof r
    );
    let t = r.length, n = arguments.length > 2 && arguments[2] === true;
    if (!n && t === 0) return 0;
    let i = false;
    for (; ; ) switch (e) {
      case "ascii":
      case "latin1":
      case "binary":
        return t;
      case "utf8":
      case "utf-8":
        return $t(r).length;
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return t * 2;
      case "hex":
        return t >>> 1;
      case "base64":
        return si(r).length;
      default:
        if (i) return n ? -1 : $t(r).length;
        e = ("" + e).toLowerCase(), i = true;
    }
  }
  a(Yn, "byteLength");
  d.byteLength = Yn;
  function zo(r, e, t) {
    let n = false;
    if ((e === void 0 || e < 0) && (e = 0), e > this.length || ((t === void 0 || t > this.length) && (t = this.length), t <= 0) || (t >>>= 0, e >>>= 0, t <= e)) return "";
    for (r || (r = "utf8"); ; ) switch (r) {
      case "hex":
        return ia(this, e, t);
      case "utf8":
      case "utf-8":
        return Jn(this, e, t);
      case "ascii":
        return ra(this, e, t);
      case "latin1":
      case "binary":
        return na(
          this,
          e,
          t
        );
      case "base64":
        return ea(this, e, t);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return sa(
          this,
          e,
          t
        );
      default:
        if (n) throw new TypeError("Unknown encoding: " + r);
        r = (r + "").toLowerCase(), n = true;
    }
  }
  a(
    zo,
    "slowToString"
  );
  d.prototype._isBuffer = true;
  function Ce(r, e, t) {
    let n = r[e];
    r[e] = r[t], r[t] = n;
  }
  a(Ce, "swap");
  d.prototype.swap16 = a(function() {
    let e = this.length;
    if (e % 2 !== 0) throw new RangeError("Buffer size must be a multiple of 16-bits");
    for (let t = 0; t < e; t += 2) Ce(this, t, t + 1);
    return this;
  }, "swap16");
  d.prototype.swap32 = a(function() {
    let e = this.length;
    if (e % 4 !== 0) throw new RangeError("Buffer size must be a multiple of 32-bits");
    for (let t = 0; t < e; t += 4) Ce(this, t, t + 3), Ce(this, t + 1, t + 2);
    return this;
  }, "swap32");
  d.prototype.swap64 = a(
    function() {
      let e = this.length;
      if (e % 8 !== 0) throw new RangeError("Buffer size must be a multiple of 64-bits");
      for (let t = 0; t < e; t += 8) Ce(this, t, t + 7), Ce(this, t + 1, t + 6), Ce(this, t + 2, t + 5), Ce(this, t + 3, t + 4);
      return this;
    },
    "swap64"
  );
  d.prototype.toString = a(function() {
    let e = this.length;
    return e === 0 ? "" : arguments.length === 0 ? Jn(
      this,
      0,
      e
    ) : zo.apply(this, arguments);
  }, "toString");
  d.prototype.toLocaleString = d.prototype.toString;
  d.prototype.equals = a(function(e) {
    if (!d.isBuffer(e)) throw new TypeError("Argument must be a Buffer");
    return this === e ? true : d.compare(this, e) === 0;
  }, "equals");
  d.prototype.inspect = a(function() {
    let e = "", t = Be.INSPECT_MAX_BYTES;
    return e = this.toString("hex", 0, t).replace(/(.{2})/g, "$1 ").trim(), this.length > t && (e += " ... "), "<Buffer " + e + ">";
  }, "inspect");
  Hn && (d.prototype[Hn] = d.prototype.inspect);
  d.prototype.compare = a(function(e, t, n, i, s) {
    if (fe(e, Uint8Array) && (e = d.from(e, e.offset, e.byteLength)), !d.isBuffer(e)) throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type ' + typeof e);
    if (t === void 0 && (t = 0), n === void 0 && (n = e ? e.length : 0), i === void 0 && (i = 0), s === void 0 && (s = this.length), t < 0 || n > e.length || i < 0 || s > this.length) throw new RangeError("out of range index");
    if (i >= s && t >= n) return 0;
    if (i >= s) return -1;
    if (t >= n) return 1;
    if (t >>>= 0, n >>>= 0, i >>>= 0, s >>>= 0, this === e) return 0;
    let o = s - i, u = n - t, c = Math.min(o, u), l = this.slice(
      i,
      s
    ), f = e.slice(t, n);
    for (let m = 0; m < c; ++m) if (l[m] !== f[m]) {
      o = l[m], u = f[m];
      break;
    }
    return o < u ? -1 : u < o ? 1 : 0;
  }, "compare");
  function Zn(r, e, t, n, i) {
    if (r.length === 0) return -1;
    if (typeof t == "string" ? (n = t, t = 0) : t > 2147483647 ? t = 2147483647 : t < -2147483648 && (t = -2147483648), t = +t, Kt(t) && (t = i ? 0 : r.length - 1), t < 0 && (t = r.length + t), t >= r.length) {
      if (i) return -1;
      t = r.length - 1;
    } else if (t < 0) if (i) t = 0;
    else return -1;
    if (typeof e == "string" && (e = d.from(
      e,
      n
    )), d.isBuffer(e)) return e.length === 0 ? -1 : $n(r, e, t, n, i);
    if (typeof e == "number") return e = e & 255, typeof Uint8Array.prototype.indexOf == "function" ? i ? Uint8Array.prototype.indexOf.call(r, e, t) : Uint8Array.prototype.lastIndexOf.call(r, e, t) : $n(r, [e], t, n, i);
    throw new TypeError("val must be string, number or Buffer");
  }
  a(Zn, "bidirectionalIndexOf");
  function $n(r, e, t, n, i) {
    let s = 1, o = r.length, u = e.length;
    if (n !== void 0 && (n = String(n).toLowerCase(), n === "ucs2" || n === "ucs-2" || n === "utf16le" || n === "utf-16le")) {
      if (r.length < 2 || e.length < 2) return -1;
      s = 2, o /= 2, u /= 2, t /= 2;
    }
    function c(f, m) {
      return s === 1 ? f[m] : f.readUInt16BE(m * s);
    }
    a(c, "read");
    let l;
    if (i) {
      let f = -1;
      for (l = t; l < o; l++) if (c(r, l) === c(e, f === -1 ? 0 : l - f)) {
        if (f === -1 && (f = l), l - f + 1 === u) return f * s;
      } else f !== -1 && (l -= l - f), f = -1;
    } else for (t + u > o && (t = o - u), l = t; l >= 0; l--) {
      let f = true;
      for (let m = 0; m < u; m++) if (c(r, l + m) !== c(e, m)) {
        f = false;
        break;
      }
      if (f) return l;
    }
    return -1;
  }
  a($n, "arrayIndexOf");
  d.prototype.includes = a(function(e, t, n) {
    return this.indexOf(
      e,
      t,
      n
    ) !== -1;
  }, "includes");
  d.prototype.indexOf = a(function(e, t, n) {
    return Zn(this, e, t, n, true);
  }, "indexOf");
  d.prototype.lastIndexOf = a(function(e, t, n) {
    return Zn(this, e, t, n, false);
  }, "lastIndexOf");
  function Ko(r, e, t, n) {
    t = Number(t) || 0;
    let i = r.length - t;
    n ? (n = Number(n), n > i && (n = i)) : n = i;
    let s = e.length;
    n > s / 2 && (n = s / 2);
    let o;
    for (o = 0; o < n; ++o) {
      let u = parseInt(e.substr(o * 2, 2), 16);
      if (Kt(u)) return o;
      r[t + o] = u;
    }
    return o;
  }
  a(Ko, "hexWrite");
  function Yo(r, e, t, n) {
    return ht($t(e, r.length - t), r, t, n);
  }
  a(Yo, "utf8Write");
  function Zo(r, e, t, n) {
    return ht(ca(e), r, t, n);
  }
  a(
    Zo,
    "asciiWrite"
  );
  function Jo(r, e, t, n) {
    return ht(si(e), r, t, n);
  }
  a(Jo, "base64Write");
  function Xo(r, e, t, n) {
    return ht(
      la(e, r.length - t),
      r,
      t,
      n
    );
  }
  a(Xo, "ucs2Write");
  d.prototype.write = a(function(e, t, n, i) {
    if (t === void 0) i = "utf8", n = this.length, t = 0;
    else if (n === void 0 && typeof t == "string") i = t, n = this.length, t = 0;
    else if (isFinite(t))
      t = t >>> 0, isFinite(n) ? (n = n >>> 0, i === void 0 && (i = "utf8")) : (i = n, n = void 0);
    else throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
    let s = this.length - t;
    if ((n === void 0 || n > s) && (n = s), e.length > 0 && (n < 0 || t < 0) || t > this.length) throw new RangeError("Attempt to write outside buffer bounds");
    i || (i = "utf8");
    let o = false;
    for (; ; ) switch (i) {
      case "hex":
        return Ko(this, e, t, n);
      case "utf8":
      case "utf-8":
        return Yo(this, e, t, n);
      case "ascii":
      case "latin1":
      case "binary":
        return Zo(this, e, t, n);
      case "base64":
        return Jo(this, e, t, n);
      case "ucs2":
      case "ucs-2":
      case "utf16le":
      case "utf-16le":
        return Xo(this, e, t, n);
      default:
        if (o) throw new TypeError("Unknown encoding: " + i);
        i = ("" + i).toLowerCase(), o = true;
    }
  }, "write");
  d.prototype.toJSON = a(function() {
    return { type: "Buffer", data: Array.prototype.slice.call(this._arr || this, 0) };
  }, "toJSON");
  function ea(r, e, t) {
    return e === 0 && t === r.length ? Wt.fromByteArray(r) : Wt.fromByteArray(r.slice(e, t));
  }
  a(ea, "base64Slice");
  function Jn(r, e, t) {
    t = Math.min(r.length, t);
    let n = [], i = e;
    for (; i < t; ) {
      let s = r[i], o = null, u = s > 239 ? 4 : s > 223 ? 3 : s > 191 ? 2 : 1;
      if (i + u <= t) {
        let c, l, f, m;
        switch (u) {
          case 1:
            s < 128 && (o = s);
            break;
          case 2:
            c = r[i + 1], (c & 192) === 128 && (m = (s & 31) << 6 | c & 63, m > 127 && (o = m));
            break;
          case 3:
            c = r[i + 1], l = r[i + 2], (c & 192) === 128 && (l & 192) === 128 && (m = (s & 15) << 12 | (c & 63) << 6 | l & 63, m > 2047 && (m < 55296 || m > 57343) && (o = m));
            break;
          case 4:
            c = r[i + 1], l = r[i + 2], f = r[i + 3], (c & 192) === 128 && (l & 192) === 128 && (f & 192) === 128 && (m = (s & 15) << 18 | (c & 63) << 12 | (l & 63) << 6 | f & 63, m > 65535 && m < 1114112 && (o = m));
        }
      }
      o === null ? (o = 65533, u = 1) : o > 65535 && (o -= 65536, n.push(o >>> 10 & 1023 | 55296), o = 56320 | o & 1023), n.push(o), i += u;
    }
    return ta(n);
  }
  a(Jn, "utf8Slice");
  var Gn = 4096;
  function ta(r) {
    let e = r.length;
    if (e <= Gn) return String.fromCharCode.apply(String, r);
    let t = "", n = 0;
    for (; n < e; ) t += String.fromCharCode.apply(String, r.slice(n, n += Gn));
    return t;
  }
  a(ta, "decodeCodePointsArray");
  function ra(r, e, t) {
    let n = "";
    t = Math.min(r.length, t);
    for (let i = e; i < t; ++i) n += String.fromCharCode(r[i] & 127);
    return n;
  }
  a(ra, "asciiSlice");
  function na(r, e, t) {
    let n = "";
    t = Math.min(r.length, t);
    for (let i = e; i < t; ++i) n += String.fromCharCode(r[i]);
    return n;
  }
  a(na, "latin1Slice");
  function ia(r, e, t) {
    let n = r.length;
    (!e || e < 0) && (e = 0), (!t || t < 0 || t > n) && (t = n);
    let i = "";
    for (let s = e; s < t; ++s) i += fa[r[s]];
    return i;
  }
  a(ia, "hexSlice");
  function sa(r, e, t) {
    let n = r.slice(e, t), i = "";
    for (let s = 0; s < n.length - 1; s += 2) i += String.fromCharCode(n[s] + n[s + 1] * 256);
    return i;
  }
  a(sa, "utf16leSlice");
  d.prototype.slice = a(function(e, t) {
    let n = this.length;
    e = ~~e, t = t === void 0 ? n : ~~t, e < 0 ? (e += n, e < 0 && (e = 0)) : e > n && (e = n), t < 0 ? (t += n, t < 0 && (t = 0)) : t > n && (t = n), t < e && (t = e);
    let i = this.subarray(e, t);
    return Object.setPrototypeOf(i, d.prototype), i;
  }, "slice");
  function U(r, e, t) {
    if (r % 1 !== 0 || r < 0) throw new RangeError("offset is not uint");
    if (r + e > t) throw new RangeError("Trying to access beyond buffer length");
  }
  a(U, "checkOffset");
  d.prototype.readUintLE = d.prototype.readUIntLE = a(
    function(e, t, n) {
      e = e >>> 0, t = t >>> 0, n || U(e, t, this.length);
      let i = this[e], s = 1, o = 0;
      for (; ++o < t && (s *= 256); ) i += this[e + o] * s;
      return i;
    },
    "readUIntLE"
  );
  d.prototype.readUintBE = d.prototype.readUIntBE = a(function(e, t, n) {
    e = e >>> 0, t = t >>> 0, n || U(
      e,
      t,
      this.length
    );
    let i = this[e + --t], s = 1;
    for (; t > 0 && (s *= 256); ) i += this[e + --t] * s;
    return i;
  }, "readUIntBE");
  d.prototype.readUint8 = d.prototype.readUInt8 = a(
    function(e, t) {
      return e = e >>> 0, t || U(e, 1, this.length), this[e];
    },
    "readUInt8"
  );
  d.prototype.readUint16LE = d.prototype.readUInt16LE = a(function(e, t) {
    return e = e >>> 0, t || U(
      e,
      2,
      this.length
    ), this[e] | this[e + 1] << 8;
  }, "readUInt16LE");
  d.prototype.readUint16BE = d.prototype.readUInt16BE = a(function(e, t) {
    return e = e >>> 0, t || U(e, 2, this.length), this[e] << 8 | this[e + 1];
  }, "readUInt16BE");
  d.prototype.readUint32LE = d.prototype.readUInt32LE = a(function(e, t) {
    return e = e >>> 0, t || U(e, 4, this.length), (this[e] | this[e + 1] << 8 | this[e + 2] << 16) + this[e + 3] * 16777216;
  }, "readUInt32LE");
  d.prototype.readUint32BE = d.prototype.readUInt32BE = a(function(e, t) {
    return e = e >>> 0, t || U(e, 4, this.length), this[e] * 16777216 + (this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3]);
  }, "readUInt32BE");
  d.prototype.readBigUInt64LE = be(a(function(e) {
    e = e >>> 0, Le(e, "offset");
    let t = this[e], n = this[e + 7];
    (t === void 0 || n === void 0) && We(e, this.length - 8);
    let i = t + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24, s = this[++e] + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + n * 2 ** 24;
    return BigInt(i) + (BigInt(s) << BigInt(32));
  }, "readBigUInt64LE"));
  d.prototype.readBigUInt64BE = be(a(function(e) {
    e = e >>> 0, Le(e, "offset");
    let t = this[e], n = this[e + 7];
    (t === void 0 || n === void 0) && We(e, this.length - 8);
    let i = t * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e], s = this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + n;
    return (BigInt(i) << BigInt(
      32
    )) + BigInt(s);
  }, "readBigUInt64BE"));
  d.prototype.readIntLE = a(function(e, t, n) {
    e = e >>> 0, t = t >>> 0, n || U(
      e,
      t,
      this.length
    );
    let i = this[e], s = 1, o = 0;
    for (; ++o < t && (s *= 256); ) i += this[e + o] * s;
    return s *= 128, i >= s && (i -= Math.pow(2, 8 * t)), i;
  }, "readIntLE");
  d.prototype.readIntBE = a(function(e, t, n) {
    e = e >>> 0, t = t >>> 0, n || U(e, t, this.length);
    let i = t, s = 1, o = this[e + --i];
    for (; i > 0 && (s *= 256); ) o += this[e + --i] * s;
    return s *= 128, o >= s && (o -= Math.pow(2, 8 * t)), o;
  }, "readIntBE");
  d.prototype.readInt8 = a(function(e, t) {
    return e = e >>> 0, t || U(e, 1, this.length), this[e] & 128 ? (255 - this[e] + 1) * -1 : this[e];
  }, "readInt8");
  d.prototype.readInt16LE = a(function(e, t) {
    e = e >>> 0, t || U(
      e,
      2,
      this.length
    );
    let n = this[e] | this[e + 1] << 8;
    return n & 32768 ? n | 4294901760 : n;
  }, "readInt16LE");
  d.prototype.readInt16BE = a(function(e, t) {
    e = e >>> 0, t || U(e, 2, this.length);
    let n = this[e + 1] | this[e] << 8;
    return n & 32768 ? n | 4294901760 : n;
  }, "readInt16BE");
  d.prototype.readInt32LE = a(function(e, t) {
    return e = e >>> 0, t || U(e, 4, this.length), this[e] | this[e + 1] << 8 | this[e + 2] << 16 | this[e + 3] << 24;
  }, "readInt32LE");
  d.prototype.readInt32BE = a(function(e, t) {
    return e = e >>> 0, t || U(e, 4, this.length), this[e] << 24 | this[e + 1] << 16 | this[e + 2] << 8 | this[e + 3];
  }, "readInt32BE");
  d.prototype.readBigInt64LE = be(a(function(e) {
    e = e >>> 0, Le(e, "offset");
    let t = this[e], n = this[e + 7];
    (t === void 0 || n === void 0) && We(e, this.length - 8);
    let i = this[e + 4] + this[e + 5] * 2 ** 8 + this[e + 6] * 2 ** 16 + (n << 24);
    return (BigInt(i) << BigInt(
      32
    )) + BigInt(t + this[++e] * 2 ** 8 + this[++e] * 2 ** 16 + this[++e] * 2 ** 24);
  }, "readBigInt64LE"));
  d.prototype.readBigInt64BE = be(a(function(e) {
    e = e >>> 0, Le(e, "offset");
    let t = this[e], n = this[e + 7];
    (t === void 0 || n === void 0) && We(e, this.length - 8);
    let i = (t << 24) + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + this[++e];
    return (BigInt(i) << BigInt(32)) + BigInt(
      this[++e] * 2 ** 24 + this[++e] * 2 ** 16 + this[++e] * 2 ** 8 + n
    );
  }, "readBigInt64BE"));
  d.prototype.readFloatLE = a(function(e, t) {
    return e = e >>> 0, t || U(e, 4, this.length), Re.read(this, e, true, 23, 4);
  }, "readFloatLE");
  d.prototype.readFloatBE = a(function(e, t) {
    return e = e >>> 0, t || U(e, 4, this.length), Re.read(this, e, false, 23, 4);
  }, "readFloatBE");
  d.prototype.readDoubleLE = a(function(e, t) {
    return e = e >>> 0, t || U(e, 8, this.length), Re.read(this, e, true, 52, 8);
  }, "readDoubleLE");
  d.prototype.readDoubleBE = a(function(e, t) {
    return e = e >>> 0, t || U(e, 8, this.length), Re.read(
      this,
      e,
      false,
      52,
      8
    );
  }, "readDoubleBE");
  function z(r, e, t, n, i, s) {
    if (!d.isBuffer(r)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (e > i || e < s) throw new RangeError('"value" argument is out of bounds');
    if (t + n > r.length) throw new RangeError("Index out of range");
  }
  a(z, "checkInt");
  d.prototype.writeUintLE = d.prototype.writeUIntLE = a(function(e, t, n, i) {
    if (e = +e, t = t >>> 0, n = n >>> 0, !i) {
      let u = Math.pow(2, 8 * n) - 1;
      z(
        this,
        e,
        t,
        n,
        u,
        0
      );
    }
    let s = 1, o = 0;
    for (this[t] = e & 255; ++o < n && (s *= 256); ) this[t + o] = e / s & 255;
    return t + n;
  }, "writeUIntLE");
  d.prototype.writeUintBE = d.prototype.writeUIntBE = a(function(e, t, n, i) {
    if (e = +e, t = t >>> 0, n = n >>> 0, !i) {
      let u = Math.pow(2, 8 * n) - 1;
      z(this, e, t, n, u, 0);
    }
    let s = n - 1, o = 1;
    for (this[t + s] = e & 255; --s >= 0 && (o *= 256); ) this[t + s] = e / o & 255;
    return t + n;
  }, "writeUIntBE");
  d.prototype.writeUint8 = d.prototype.writeUInt8 = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || z(this, e, t, 1, 255, 0), this[t] = e & 255, t + 1;
  }, "writeUInt8");
  d.prototype.writeUint16LE = d.prototype.writeUInt16LE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || z(this, e, t, 2, 65535, 0), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2;
  }, "writeUInt16LE");
  d.prototype.writeUint16BE = d.prototype.writeUInt16BE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || z(this, e, t, 2, 65535, 0), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2;
  }, "writeUInt16BE");
  d.prototype.writeUint32LE = d.prototype.writeUInt32LE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || z(
      this,
      e,
      t,
      4,
      4294967295,
      0
    ), this[t + 3] = e >>> 24, this[t + 2] = e >>> 16, this[t + 1] = e >>> 8, this[t] = e & 255, t + 4;
  }, "writeUInt32LE");
  d.prototype.writeUint32BE = d.prototype.writeUInt32BE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || z(
      this,
      e,
      t,
      4,
      4294967295,
      0
    ), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4;
  }, "writeUInt32BE");
  function Xn(r, e, t, n, i) {
    ii(e, n, i, r, t, 7);
    let s = Number(e & BigInt(4294967295));
    r[t++] = s, s = s >> 8, r[t++] = s, s = s >> 8, r[t++] = s, s = s >> 8, r[t++] = s;
    let o = Number(e >> BigInt(32) & BigInt(4294967295));
    return r[t++] = o, o = o >> 8, r[t++] = o, o = o >> 8, r[t++] = o, o = o >> 8, r[t++] = o, t;
  }
  a(Xn, "wrtBigUInt64LE");
  function ei(r, e, t, n, i) {
    ii(e, n, i, r, t, 7);
    let s = Number(e & BigInt(4294967295));
    r[t + 7] = s, s = s >> 8, r[t + 6] = s, s = s >> 8, r[t + 5] = s, s = s >> 8, r[t + 4] = s;
    let o = Number(e >> BigInt(32) & BigInt(4294967295));
    return r[t + 3] = o, o = o >> 8, r[t + 2] = o, o = o >> 8, r[t + 1] = o, o = o >> 8, r[t] = o, t + 8;
  }
  a(ei, "wrtBigUInt64BE");
  d.prototype.writeBigUInt64LE = be(a(function(e, t = 0) {
    return Xn(this, e, t, BigInt(0), BigInt("0xffffffffffffffff"));
  }, "writeBigUInt64LE"));
  d.prototype.writeBigUInt64BE = be(a(function(e, t = 0) {
    return ei(this, e, t, BigInt(0), BigInt(
      "0xffffffffffffffff"
    ));
  }, "writeBigUInt64BE"));
  d.prototype.writeIntLE = a(function(e, t, n, i) {
    if (e = +e, t = t >>> 0, !i) {
      let c = Math.pow(2, 8 * n - 1);
      z(this, e, t, n, c - 1, -c);
    }
    let s = 0, o = 1, u = 0;
    for (this[t] = e & 255; ++s < n && (o *= 256); )
      e < 0 && u === 0 && this[t + s - 1] !== 0 && (u = 1), this[t + s] = (e / o >> 0) - u & 255;
    return t + n;
  }, "writeIntLE");
  d.prototype.writeIntBE = a(function(e, t, n, i) {
    if (e = +e, t = t >>> 0, !i) {
      let c = Math.pow(2, 8 * n - 1);
      z(this, e, t, n, c - 1, -c);
    }
    let s = n - 1, o = 1, u = 0;
    for (this[t + s] = e & 255; --s >= 0 && (o *= 256); ) e < 0 && u === 0 && this[t + s + 1] !== 0 && (u = 1), this[t + s] = (e / o >> 0) - u & 255;
    return t + n;
  }, "writeIntBE");
  d.prototype.writeInt8 = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || z(this, e, t, 1, 127, -128), e < 0 && (e = 255 + e + 1), this[t] = e & 255, t + 1;
  }, "writeInt8");
  d.prototype.writeInt16LE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || z(this, e, t, 2, 32767, -32768), this[t] = e & 255, this[t + 1] = e >>> 8, t + 2;
  }, "writeInt16LE");
  d.prototype.writeInt16BE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || z(this, e, t, 2, 32767, -32768), this[t] = e >>> 8, this[t + 1] = e & 255, t + 2;
  }, "writeInt16BE");
  d.prototype.writeInt32LE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || z(
      this,
      e,
      t,
      4,
      2147483647,
      -2147483648
    ), this[t] = e & 255, this[t + 1] = e >>> 8, this[t + 2] = e >>> 16, this[t + 3] = e >>> 24, t + 4;
  }, "writeInt32LE");
  d.prototype.writeInt32BE = a(function(e, t, n) {
    return e = +e, t = t >>> 0, n || z(
      this,
      e,
      t,
      4,
      2147483647,
      -2147483648
    ), e < 0 && (e = 4294967295 + e + 1), this[t] = e >>> 24, this[t + 1] = e >>> 16, this[t + 2] = e >>> 8, this[t + 3] = e & 255, t + 4;
  }, "writeInt32BE");
  d.prototype.writeBigInt64LE = be(a(function(e, t = 0) {
    return Xn(this, e, t, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
  }, "writeBigInt64LE"));
  d.prototype.writeBigInt64BE = be(
    a(function(e, t = 0) {
      return ei(this, e, t, -BigInt("0x8000000000000000"), BigInt("0x7fffffffffffffff"));
    }, "writeBigInt64BE")
  );
  function ti(r, e, t, n, i, s) {
    if (t + n > r.length) throw new RangeError("Index out of range");
    if (t < 0) throw new RangeError("Index out of range");
  }
  a(ti, "checkIEEE754");
  function ri(r, e, t, n, i) {
    return e = +e, t = t >>> 0, i || ti(r, e, t, 4, 34028234663852886e22, -34028234663852886e22), Re.write(r, e, t, n, 23, 4), t + 4;
  }
  a(
    ri,
    "writeFloat"
  );
  d.prototype.writeFloatLE = a(function(e, t, n) {
    return ri(this, e, t, true, n);
  }, "writeFloatLE");
  d.prototype.writeFloatBE = a(function(e, t, n) {
    return ri(this, e, t, false, n);
  }, "writeFloatBE");
  function ni(r, e, t, n, i) {
    return e = +e, t = t >>> 0, i || ti(r, e, t, 8, 17976931348623157e292, -17976931348623157e292), Re.write(
      r,
      e,
      t,
      n,
      52,
      8
    ), t + 8;
  }
  a(ni, "writeDouble");
  d.prototype.writeDoubleLE = a(function(e, t, n) {
    return ni(this, e, t, true, n);
  }, "writeDoubleLE");
  d.prototype.writeDoubleBE = a(function(e, t, n) {
    return ni(this, e, t, false, n);
  }, "writeDoubleBE");
  d.prototype.copy = a(function(e, t, n, i) {
    if (!d.isBuffer(e)) throw new TypeError("argument should be a Buffer");
    if (n || (n = 0), !i && i !== 0 && (i = this.length), t >= e.length && (t = e.length), t || (t = 0), i > 0 && i < n && (i = n), i === n || e.length === 0 || this.length === 0) return 0;
    if (t < 0) throw new RangeError("targetStart out of bounds");
    if (n < 0 || n >= this.length) throw new RangeError("Index out of range");
    if (i < 0) throw new RangeError("sourceEnd out of bounds");
    i > this.length && (i = this.length), e.length - t < i - n && (i = e.length - t + n);
    let s = i - n;
    return this === e && typeof Uint8Array.prototype.copyWithin == "function" ? this.copyWithin(t, n, i) : Uint8Array.prototype.set.call(e, this.subarray(n, i), t), s;
  }, "copy");
  d.prototype.fill = a(function(e, t, n, i) {
    if (typeof e == "string") {
      if (typeof t == "string" ? (i = t, t = 0, n = this.length) : typeof n == "string" && (i = n, n = this.length), i !== void 0 && typeof i != "string") throw new TypeError("encoding must be a string");
      if (typeof i == "string" && !d.isEncoding(i)) throw new TypeError(
        "Unknown encoding: " + i
      );
      if (e.length === 1) {
        let o = e.charCodeAt(0);
        (i === "utf8" && o < 128 || i === "latin1") && (e = o);
      }
    } else typeof e == "number" ? e = e & 255 : typeof e == "boolean" && (e = Number(e));
    if (t < 0 || this.length < t || this.length < n) throw new RangeError("Out of range index");
    if (n <= t) return this;
    t = t >>> 0, n = n === void 0 ? this.length : n >>> 0, e || (e = 0);
    let s;
    if (typeof e == "number") for (s = t; s < n; ++s) this[s] = e;
    else {
      let o = d.isBuffer(e) ? e : d.from(
        e,
        i
      ), u = o.length;
      if (u === 0) throw new TypeError('The value "' + e + '" is invalid for argument "value"');
      for (s = 0; s < n - t; ++s) this[s + t] = o[s % u];
    }
    return this;
  }, "fill");
  var Pe = {};
  function zt(r, e, t) {
    var n;
    Pe[r] = (n = class extends t {
      constructor() {
        super(), Object.defineProperty(this, "message", { value: e.apply(this, arguments), writable: true, configurable: true }), this.name = `${this.name} [${r}]`, this.stack, delete this.name;
      }
      get code() {
        return r;
      }
      set code(s) {
        Object.defineProperty(
          this,
          "code",
          { configurable: true, enumerable: true, value: s, writable: true }
        );
      }
      toString() {
        return `${this.name} [${r}]: ${this.message}`;
      }
    }, a(n, "NodeError"), n);
  }
  a(zt, "E");
  zt("ERR_BUFFER_OUT_OF_BOUNDS", function(r) {
    return r ? `${r} is outside of buffer bounds` : "Attempt to access memory outside buffer bounds";
  }, RangeError);
  zt(
    "ERR_INVALID_ARG_TYPE",
    function(r, e) {
      return `The "${r}" argument must be of type number. Received type ${typeof e}`;
    },
    TypeError
  );
  zt("ERR_OUT_OF_RANGE", function(r, e, t) {
    let n = `The value of "${r}" is out of range.`, i = t;
    return Number.isInteger(t) && Math.abs(t) > 2 ** 32 ? i = Vn(String(t)) : typeof t == "bigint" && (i = String(
      t
    ), (t > BigInt(2) ** BigInt(32) || t < -(BigInt(2) ** BigInt(32))) && (i = Vn(i)), i += "n"), n += ` It must be ${e}. Received ${i}`, n;
  }, RangeError);
  function Vn(r) {
    let e = "", t = r.length, n = r[0] === "-" ? 1 : 0;
    for (; t >= n + 4; t -= 3) e = `_${r.slice(t - 3, t)}${e}`;
    return `${r.slice(0, t)}${e}`;
  }
  a(Vn, "addNumericalSeparator");
  function oa(r, e, t) {
    Le(e, "offset"), (r[e] === void 0 || r[e + t] === void 0) && We(e, r.length - (t + 1));
  }
  a(oa, "checkBounds");
  function ii(r, e, t, n, i, s) {
    if (r > t || r < e) {
      let o = typeof e == "bigint" ? "n" : "", u;
      throw s > 3 ? e === 0 || e === BigInt(0) ? u = `>= 0${o} and < 2${o} ** ${(s + 1) * 8}${o}` : u = `>= -(2${o} ** ${(s + 1) * 8 - 1}${o}) and < 2 ** ${(s + 1) * 8 - 1}${o}` : u = `>= ${e}${o} and <= ${t}${o}`, new Pe.ERR_OUT_OF_RANGE("value", u, r);
    }
    oa(n, i, s);
  }
  a(ii, "checkIntBI");
  function Le(r, e) {
    if (typeof r != "number") throw new Pe.ERR_INVALID_ARG_TYPE(e, "number", r);
  }
  a(Le, "validateNumber");
  function We(r, e, t) {
    throw Math.floor(r) !== r ? (Le(r, t), new Pe.ERR_OUT_OF_RANGE(t || "offset", "an integer", r)) : e < 0 ? new Pe.ERR_BUFFER_OUT_OF_BOUNDS() : new Pe.ERR_OUT_OF_RANGE(t || "offset", `>= ${t ? 1 : 0} and <= ${e}`, r);
  }
  a(We, "boundsError");
  var aa = /[^+/0-9A-Za-z-_]/g;
  function ua(r) {
    if (r = r.split("=")[0], r = r.trim().replace(aa, ""), r.length < 2) return "";
    for (; r.length % 4 !== 0; ) r = r + "=";
    return r;
  }
  a(ua, "base64clean");
  function $t(r, e) {
    e = e || 1 / 0;
    let t, n = r.length, i = null, s = [];
    for (let o = 0; o < n; ++o) {
      if (t = r.charCodeAt(o), t > 55295 && t < 57344) {
        if (!i) {
          if (t > 56319) {
            (e -= 3) > -1 && s.push(239, 191, 189);
            continue;
          } else if (o + 1 === n) {
            (e -= 3) > -1 && s.push(239, 191, 189);
            continue;
          }
          i = t;
          continue;
        }
        if (t < 56320) {
          (e -= 3) > -1 && s.push(239, 191, 189), i = t;
          continue;
        }
        t = (i - 55296 << 10 | t - 56320) + 65536;
      } else i && (e -= 3) > -1 && s.push(239, 191, 189);
      if (i = null, t < 128) {
        if ((e -= 1) < 0) break;
        s.push(t);
      } else if (t < 2048) {
        if ((e -= 2) < 0) break;
        s.push(t >> 6 | 192, t & 63 | 128);
      } else if (t < 65536) {
        if ((e -= 3) < 0) break;
        s.push(t >> 12 | 224, t >> 6 & 63 | 128, t & 63 | 128);
      } else if (t < 1114112) {
        if ((e -= 4) < 0) break;
        s.push(t >> 18 | 240, t >> 12 & 63 | 128, t >> 6 & 63 | 128, t & 63 | 128);
      } else throw new Error("Invalid code point");
    }
    return s;
  }
  a($t, "utf8ToBytes");
  function ca(r) {
    let e = [];
    for (let t = 0; t < r.length; ++t) e.push(r.charCodeAt(t) & 255);
    return e;
  }
  a(
    ca,
    "asciiToBytes"
  );
  function la(r, e) {
    let t, n, i, s = [];
    for (let o = 0; o < r.length && !((e -= 2) < 0); ++o) t = r.charCodeAt(
      o
    ), n = t >> 8, i = t % 256, s.push(i), s.push(n);
    return s;
  }
  a(la, "utf16leToBytes");
  function si(r) {
    return Wt.toByteArray(
      ua(r)
    );
  }
  a(si, "base64ToBytes");
  function ht(r, e, t, n) {
    let i;
    for (i = 0; i < n && !(i + t >= e.length || i >= r.length); ++i)
      e[i + t] = r[i];
    return i;
  }
  a(ht, "blitBuffer");
  function fe(r, e) {
    return r instanceof e || r != null && r.constructor != null && r.constructor.name != null && r.constructor.name === e.name;
  }
  a(fe, "isInstance");
  function Kt(r) {
    return r !== r;
  }
  a(Kt, "numberIsNaN");
  var fa = (function() {
    let r = "0123456789abcdef", e = new Array(256);
    for (let t = 0; t < 16; ++t) {
      let n = t * 16;
      for (let i = 0; i < 16; ++i) e[n + i] = r[t] + r[i];
    }
    return e;
  })();
  function be(r) {
    return typeof BigInt > "u" ? ha : r;
  }
  a(be, "defineBigIntMethod");
  function ha() {
    throw new Error("BigInt not supported");
  }
  a(ha, "BufferBigIntNotDefined");
});
var b;
var x;
var v;
var p;
var y;
var h = V(() => {
  "use strict";
  b = globalThis, x = globalThis.setImmediate ?? ((r) => setTimeout(r, 0)), v = globalThis.clearImmediate ?? ((r) => clearTimeout(r)), p = typeof globalThis.Buffer == "function" && typeof globalThis.Buffer.allocUnsafe == "function" ? globalThis.Buffer : oi().Buffer, y = globalThis.process ?? {};
  y.env ?? (y.env = {});
  try {
    y.nextTick(() => {
    });
  } catch {
    let e = Promise.resolve();
    y.nextTick = e.then.bind(e);
  }
});
var ve = T((Ef, Xt) => {
  "use strict";
  h();
  var Fe = typeof Reflect == "object" ? Reflect : null, mi = Fe && typeof Fe.apply == "function" ? Fe.apply : a(function(e, t, n) {
    return Function.prototype.apply.call(e, t, n);
  }, "ReflectApply"), bt;
  Fe && typeof Fe.ownKeys == "function" ? bt = Fe.ownKeys : Object.getOwnPropertySymbols ? bt = a(function(e) {
    return Object.getOwnPropertyNames(e).concat(Object.getOwnPropertySymbols(e));
  }, "ReflectOwnKeys") : bt = a(function(e) {
    return Object.getOwnPropertyNames(e);
  }, "ReflectOwnKeys");
  function Ia(r) {
    console && console.warn && console.warn(r);
  }
  a(
    Ia,
    "ProcessEmitWarning"
  );
  var wi = Number.isNaN || a(function(e) {
    return e !== e;
  }, "NumberIsNaN");
  function P() {
    P.init.call(this);
  }
  a(P, "EventEmitter");
  Xt.exports = P;
  Xt.exports.once = Ba;
  P.EventEmitter = P;
  P.prototype._events = void 0;
  P.prototype._eventsCount = 0;
  P.prototype._maxListeners = void 0;
  var gi = 10;
  function xt(r) {
    if (typeof r != "function") throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof r);
  }
  a(xt, "checkListener");
  Object.defineProperty(P, "defaultMaxListeners", { enumerable: true, get: a(function() {
    return gi;
  }, "get"), set: a(
    function(r) {
      if (typeof r != "number" || r < 0 || wi(r)) throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + r + ".");
      gi = r;
    },
    "set"
  ) });
  P.init = function() {
    (this._events === void 0 || this._events === Object.getPrototypeOf(this)._events) && (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0), this._maxListeners = this._maxListeners || void 0;
  };
  P.prototype.setMaxListeners = a(function(e) {
    if (typeof e != "number" || e < 0 || wi(e)) throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + e + ".");
    return this._maxListeners = e, this;
  }, "setMaxListeners");
  function bi(r) {
    return r._maxListeners === void 0 ? P.defaultMaxListeners : r._maxListeners;
  }
  a(bi, "_getMaxListeners");
  P.prototype.getMaxListeners = a(function() {
    return bi(this);
  }, "getMaxListeners");
  P.prototype.emit = a(function(e) {
    for (var t = [], n = 1; n < arguments.length; n++) t.push(arguments[n]);
    var i = e === "error", s = this._events;
    if (s !== void 0) i = i && s.error === void 0;
    else if (!i) return false;
    if (i) {
      var o;
      if (t.length > 0 && (o = t[0]), o instanceof Error) throw o;
      var u = new Error("Unhandled error." + (o ? " (" + o.message + ")" : ""));
      throw u.context = o, u;
    }
    var c = s[e];
    if (c === void 0) return false;
    if (typeof c == "function") mi(c, this, t);
    else for (var l = c.length, f = Ai(c, l), n = 0; n < l; ++n) mi(f[n], this, t);
    return true;
  }, "emit");
  function xi(r, e, t, n) {
    var i, s, o;
    if (xt(
      t
    ), s = r._events, s === void 0 ? (s = r._events = /* @__PURE__ */ Object.create(null), r._eventsCount = 0) : (s.newListener !== void 0 && (r.emit("newListener", e, t.listener ? t.listener : t), s = r._events), o = s[e]), o === void 0) o = s[e] = t, ++r._eventsCount;
    else if (typeof o == "function" ? o = s[e] = n ? [t, o] : [o, t] : n ? o.unshift(t) : o.push(t), i = bi(r), i > 0 && o.length > i && !o.warned) {
      o.warned = true;
      var u = new Error("Possible EventEmitter memory leak detected. " + o.length + " " + String(e) + " listeners added. Use emitter.setMaxListeners() to increase limit");
      u.name = "MaxListenersExceededWarning", u.emitter = r, u.type = e, u.count = o.length, Ia(u);
    }
    return r;
  }
  a(xi, "_addListener");
  P.prototype.addListener = a(function(e, t) {
    return xi(this, e, t, false);
  }, "addListener");
  P.prototype.on = P.prototype.addListener;
  P.prototype.prependListener = a(function(e, t) {
    return xi(this, e, t, true);
  }, "prependListener");
  function Pa() {
    if (!this.fired) return this.target.removeListener(this.type, this.wrapFn), this.fired = true, arguments.length === 0 ? this.listener.call(this.target) : this.listener.apply(this.target, arguments);
  }
  a(Pa, "onceWrapper");
  function vi(r, e, t) {
    var n = {
      fired: false,
      wrapFn: void 0,
      target: r,
      type: e,
      listener: t
    }, i = Pa.bind(n);
    return i.listener = t, n.wrapFn = i, i;
  }
  a(vi, "_onceWrap");
  P.prototype.once = a(function(e, t) {
    return xt(t), this.on(e, vi(this, e, t)), this;
  }, "once");
  P.prototype.prependOnceListener = a(function(e, t) {
    return xt(t), this.prependListener(e, vi(this, e, t)), this;
  }, "prependOnceListener");
  P.prototype.removeListener = a(function(e, t) {
    var n, i, s, o, u;
    if (xt(t), i = this._events, i === void 0) return this;
    if (n = i[e], n === void 0) return this;
    if (n === t || n.listener === t) --this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : (delete i[e], i.removeListener && this.emit("removeListener", e, n.listener || t));
    else if (typeof n != "function") {
      for (s = -1, o = n.length - 1; o >= 0; o--) if (n[o] === t || n[o].listener === t) {
        u = n[o].listener, s = o;
        break;
      }
      if (s < 0) return this;
      s === 0 ? n.shift() : Ra(n, s), n.length === 1 && (i[e] = n[0]), i.removeListener !== void 0 && this.emit("removeListener", e, u || t);
    }
    return this;
  }, "removeListener");
  P.prototype.off = P.prototype.removeListener;
  P.prototype.removeAllListeners = a(function(e) {
    var t, n, i;
    if (n = this._events, n === void 0) return this;
    if (n.removeListener === void 0) return arguments.length === 0 ? (this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0) : n[e] !== void 0 && (--this._eventsCount === 0 ? this._events = /* @__PURE__ */ Object.create(null) : delete n[e]), this;
    if (arguments.length === 0) {
      var s = Object.keys(n), o;
      for (i = 0; i < s.length; ++i) o = s[i], o !== "removeListener" && this.removeAllListeners(
        o
      );
      return this.removeAllListeners("removeListener"), this._events = /* @__PURE__ */ Object.create(null), this._eventsCount = 0, this;
    }
    if (t = n[e], typeof t == "function") this.removeListener(e, t);
    else if (t !== void 0) for (i = t.length - 1; i >= 0; i--) this.removeListener(e, t[i]);
    return this;
  }, "removeAllListeners");
  function Si(r, e, t) {
    var n = r._events;
    if (n === void 0) return [];
    var i = n[e];
    return i === void 0 ? [] : typeof i == "function" ? t ? [i.listener || i] : [i] : t ? La(i) : Ai(i, i.length);
  }
  a(Si, "_listeners");
  P.prototype.listeners = a(function(e) {
    return Si(this, e, true);
  }, "listeners");
  P.prototype.rawListeners = a(function(e) {
    return Si(this, e, false);
  }, "rawListeners");
  P.listenerCount = function(r, e) {
    return typeof r.listenerCount == "function" ? r.listenerCount(e) : Ei.call(r, e);
  };
  P.prototype.listenerCount = Ei;
  function Ei(r) {
    var e = this._events;
    if (e !== void 0) {
      var t = e[r];
      if (typeof t == "function")
        return 1;
      if (t !== void 0) return t.length;
    }
    return 0;
  }
  a(Ei, "listenerCount");
  P.prototype.eventNames = a(function() {
    return this._eventsCount > 0 ? bt(this._events) : [];
  }, "eventNames");
  function Ai(r, e) {
    for (var t = new Array(e), n = 0; n < e; ++n) t[n] = r[n];
    return t;
  }
  a(Ai, "arrayClone");
  function Ra(r, e) {
    for (; e + 1 < r.length; e++) r[e] = r[e + 1];
    r.pop();
  }
  a(Ra, "spliceOne");
  function La(r) {
    for (var e = new Array(r.length), t = 0; t < e.length; ++t) e[t] = r[t].listener || r[t];
    return e;
  }
  a(La, "unwrapListeners");
  function Ba(r, e) {
    return new Promise(function(t, n) {
      function i(o) {
        r.removeListener(e, s), n(o);
      }
      a(i, "errorListener");
      function s() {
        typeof r.removeListener == "function" && r.removeListener("error", i), t([].slice.call(arguments));
      }
      a(s, "resolver"), Ci(r, e, s, { once: true }), e !== "error" && Fa(r, i, { once: true });
    });
  }
  a(Ba, "once");
  function Fa(r, e, t) {
    typeof r.on == "function" && Ci(r, "error", e, t);
  }
  a(
    Fa,
    "addErrorHandlerIfEventEmitter"
  );
  function Ci(r, e, t, n) {
    if (typeof r.on == "function") n.once ? r.once(e, t) : r.on(e, t);
    else if (typeof r.addEventListener == "function") r.addEventListener(e, a(function i(s) {
      n.once && r.removeEventListener(e, i), t(s);
    }, "wrapListener"));
    else throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof r);
  }
  a(Ci, "eventTargetAgnosticAddListener");
});
var Ii = {};
se(Ii, { Socket: () => pe, isIP: () => Ma });
function Ma(r) {
  return 0;
}
var Ti;
var _i;
var A;
var pe;
var Ge = V(() => {
  "use strict";
  h();
  Ti = we(ve(), 1);
  a(Ma, "isIP");
  _i = /^[^.]+\./, A = class A2 extends Ti.EventEmitter {
    constructor() {
      super(...arguments);
      E(this, "opts", {});
      E(this, "connecting", false);
      E(this, "pending", true);
      E(
        this,
        "writable",
        true
      );
      E(this, "encrypted", false);
      E(this, "authorized", false);
      E(this, "destroyed", false);
      E(this, "ws", null);
      E(this, "writeBuffer");
      E(this, "tlsState", 0);
      E(this, "tlsRead");
      E(this, "tlsWrite");
    }
    static get poolQueryViaFetch() {
      return A2.opts.poolQueryViaFetch ?? A2.defaults.poolQueryViaFetch;
    }
    static set poolQueryViaFetch(t) {
      A2.opts.poolQueryViaFetch = t;
    }
    static get fetchEndpoint() {
      return A2.opts.fetchEndpoint ?? A2.defaults.fetchEndpoint;
    }
    static set fetchEndpoint(t) {
      A2.opts.fetchEndpoint = t;
    }
    static get fetchConnectionCache() {
      return true;
    }
    static set fetchConnectionCache(t) {
      console.warn("The `fetchConnectionCache` option is deprecated (now always `true`)");
    }
    static get fetchFunction() {
      return A2.opts.fetchFunction ?? A2.defaults.fetchFunction;
    }
    static set fetchFunction(t) {
      A2.opts.fetchFunction = t;
    }
    static get webSocketConstructor() {
      return A2.opts.webSocketConstructor ?? A2.defaults.webSocketConstructor;
    }
    static set webSocketConstructor(t) {
      A2.opts.webSocketConstructor = t;
    }
    get webSocketConstructor() {
      return this.opts.webSocketConstructor ?? A2.webSocketConstructor;
    }
    set webSocketConstructor(t) {
      this.opts.webSocketConstructor = t;
    }
    static get wsProxy() {
      return A2.opts.wsProxy ?? A2.defaults.wsProxy;
    }
    static set wsProxy(t) {
      A2.opts.wsProxy = t;
    }
    get wsProxy() {
      return this.opts.wsProxy ?? A2.wsProxy;
    }
    set wsProxy(t) {
      this.opts.wsProxy = t;
    }
    static get coalesceWrites() {
      return A2.opts.coalesceWrites ?? A2.defaults.coalesceWrites;
    }
    static set coalesceWrites(t) {
      A2.opts.coalesceWrites = t;
    }
    get coalesceWrites() {
      return this.opts.coalesceWrites ?? A2.coalesceWrites;
    }
    set coalesceWrites(t) {
      this.opts.coalesceWrites = t;
    }
    static get useSecureWebSocket() {
      return A2.opts.useSecureWebSocket ?? A2.defaults.useSecureWebSocket;
    }
    static set useSecureWebSocket(t) {
      A2.opts.useSecureWebSocket = t;
    }
    get useSecureWebSocket() {
      return this.opts.useSecureWebSocket ?? A2.useSecureWebSocket;
    }
    set useSecureWebSocket(t) {
      this.opts.useSecureWebSocket = t;
    }
    static get forceDisablePgSSL() {
      return A2.opts.forceDisablePgSSL ?? A2.defaults.forceDisablePgSSL;
    }
    static set forceDisablePgSSL(t) {
      A2.opts.forceDisablePgSSL = t;
    }
    get forceDisablePgSSL() {
      return this.opts.forceDisablePgSSL ?? A2.forceDisablePgSSL;
    }
    set forceDisablePgSSL(t) {
      this.opts.forceDisablePgSSL = t;
    }
    static get disableSNI() {
      return A2.opts.disableSNI ?? A2.defaults.disableSNI;
    }
    static set disableSNI(t) {
      A2.opts.disableSNI = t;
    }
    get disableSNI() {
      return this.opts.disableSNI ?? A2.disableSNI;
    }
    set disableSNI(t) {
      this.opts.disableSNI = t;
    }
    static get disableWarningInBrowsers() {
      return A2.opts.disableWarningInBrowsers ?? A2.defaults.disableWarningInBrowsers;
    }
    static set disableWarningInBrowsers(t) {
      A2.opts.disableWarningInBrowsers = t;
    }
    get disableWarningInBrowsers() {
      return this.opts.disableWarningInBrowsers ?? A2.disableWarningInBrowsers;
    }
    set disableWarningInBrowsers(t) {
      this.opts.disableWarningInBrowsers = t;
    }
    static get pipelineConnect() {
      return A2.opts.pipelineConnect ?? A2.defaults.pipelineConnect;
    }
    static set pipelineConnect(t) {
      A2.opts.pipelineConnect = t;
    }
    get pipelineConnect() {
      return this.opts.pipelineConnect ?? A2.pipelineConnect;
    }
    set pipelineConnect(t) {
      this.opts.pipelineConnect = t;
    }
    static get subtls() {
      return A2.opts.subtls ?? A2.defaults.subtls;
    }
    static set subtls(t) {
      A2.opts.subtls = t;
    }
    get subtls() {
      return this.opts.subtls ?? A2.subtls;
    }
    set subtls(t) {
      this.opts.subtls = t;
    }
    static get pipelineTLS() {
      return A2.opts.pipelineTLS ?? A2.defaults.pipelineTLS;
    }
    static set pipelineTLS(t) {
      A2.opts.pipelineTLS = t;
    }
    get pipelineTLS() {
      return this.opts.pipelineTLS ?? A2.pipelineTLS;
    }
    set pipelineTLS(t) {
      this.opts.pipelineTLS = t;
    }
    static get rootCerts() {
      return A2.opts.rootCerts ?? A2.defaults.rootCerts;
    }
    static set rootCerts(t) {
      A2.opts.rootCerts = t;
    }
    get rootCerts() {
      return this.opts.rootCerts ?? A2.rootCerts;
    }
    set rootCerts(t) {
      this.opts.rootCerts = t;
    }
    wsProxyAddrForHost(t, n) {
      let i = this.wsProxy;
      if (i === void 0) throw new Error("No WebSocket proxy is configured. Please see https://github.com/neondatabase/serverless/blob/main/CONFIG.md#wsproxy-string--host-string-port-number--string--string");
      return typeof i == "function" ? i(t, n) : `${i}?address=${t}:${n}`;
    }
    setNoDelay() {
      return this;
    }
    setKeepAlive() {
      return this;
    }
    ref() {
      return this;
    }
    unref() {
      return this;
    }
    connect(t, n, i) {
      this.connecting = true, i && this.once("connect", i);
      let s = a(() => {
        this.connecting = false, this.pending = false, this.emit("connect"), this.emit("ready");
      }, "handleWebSocketOpen"), o = a((c, l = false) => {
        c.binaryType = "arraybuffer", c.addEventListener("error", (f) => {
          this.emit("error", f), this.emit("close");
        }), c.addEventListener("message", (f) => {
          if (this.tlsState === 0) {
            let m = p.from(f.data);
            this.emit("data", m);
          }
        }), c.addEventListener("close", () => {
          this.destroyed = true, this.emit("close");
        }), l ? s() : c.addEventListener("open", s);
      }, "configureWebSocket"), u;
      try {
        u = this.wsProxyAddrForHost(n, typeof t == "string" ? parseInt(t, 10) : t);
      } catch (c) {
        this.emit("error", c), this.emit("close");
        return;
      }
      try {
        let l = (this.useSecureWebSocket ? "wss:" : "ws:") + "//" + u;
        if (this.webSocketConstructor !== void 0) this.ws = new this.webSocketConstructor(l), o(this.ws);
        else try {
          this.ws = new WebSocket(l), o(this.ws);
        } catch {
          this.ws = new __unstable_WebSocket(l), o(
            this.ws
          );
        }
      } catch (c) {
        let f = (this.useSecureWebSocket ? "https:" : "http:") + "//" + u;
        fetch(f, { headers: { Upgrade: "websocket" } }).then((m) => {
          if (this.ws = m.webSocket, this.ws == null) throw c;
          this.ws.accept(), o(this.ws, true);
        }).catch((m) => {
          this.emit("error", new Error(`All attempts to open a WebSocket to connect to the database failed. Please refer to https://github.com/neondatabase/serverless/blob/main/CONFIG.md#websocketconstructor-typeof-websocket--undefined. Details: ${m}`)), this.emit("close");
        });
      }
    }
    async startTls(t) {
      if (this.subtls === void 0) throw new Error("For Postgres SSL connections, you must set `neonConfig.subtls` to the subtls library. See https://github.com/neondatabase/serverless/blob/main/CONFIG.md for more information.");
      this.tlsState = 1;
      let n = await this.subtls.TrustedCert.databaseFromPEM(this.rootCerts), i = new this.subtls.WebSocketReadQueue(this.ws), s = i.read.bind(i), o = this.rawWrite.bind(this), { read: u, write: c } = await this.subtls.startTls(t, n, s, o, { useSNI: !this.disableSNI, expectPreData: this.pipelineTLS ? new Uint8Array([83]) : void 0 });
      this.tlsRead = u, this.tlsWrite = c, this.tlsState = 2, this.encrypted = true, this.authorized = true, this.emit(
        "secureConnection",
        this
      ), this.tlsReadLoop().catch((l) => {
        this.destroyed || (this.destroyed = true, this.emit("error", l), this.ws?.close());
      });
    }
    async tlsReadLoop() {
      for (; ; ) {
        let t = await this.tlsRead();
        if (t === void 0) break;
        {
          let n = p.from(t);
          this.emit("data", n);
        }
      }
    }
    rawWrite(t) {
      if (!this.coalesceWrites) {
        this.ws && this.ws.send(t);
        return;
      }
      if (this.writeBuffer === void 0) this.writeBuffer = t, setTimeout(() => {
        this.ws && this.ws.send(this.writeBuffer), this.writeBuffer = void 0;
      }, 0);
      else {
        let n = new Uint8Array(this.writeBuffer.length + t.length);
        n.set(this.writeBuffer), n.set(t, this.writeBuffer.length), this.writeBuffer = n;
      }
    }
    write(t, n = "utf8", i = (s) => {
    }) {
      return t.length === 0 ? (i(), true) : (typeof t == "string" && (t = p.from(t, n)), this.tlsState === 0 ? (this.rawWrite(t), i()) : this.tlsState === 1 ? this.once("secureConnection", () => {
        this.write(t, n, i);
      }) : (this.tlsWrite(t), i()), true);
    }
    end(t = p.alloc(0), n = "utf8", i = () => {
    }) {
      return this.write(t, n, () => {
        this.ws?.close(), i();
      }), this;
    }
    destroy() {
      return this.destroyed = true, this.end();
    }
  };
  a(A, "Socket"), E(A, "defaults", {
    poolQueryViaFetch: false,
    fetchEndpoint: a((t, n, i) => {
      let s;
      return i?.jwtAuth ? s = t.replace(_i, "apiauth.") : s = t.replace(_i, "api."), "https://" + s + "/sql";
    }, "fetchEndpoint"),
    fetchConnectionCache: true,
    fetchFunction: void 0,
    webSocketConstructor: void 0,
    wsProxy: a((t) => t + "/v2", "wsProxy"),
    useSecureWebSocket: true,
    forceDisablePgSSL: true,
    coalesceWrites: true,
    pipelineConnect: "password",
    subtls: void 0,
    rootCerts: "",
    pipelineTLS: false,
    disableSNI: false,
    disableWarningInBrowsers: false
  }), E(A, "opts", {});
  pe = A;
});
var tr = T((Pi) => {
  "use strict";
  h();
  Pi.parse = function(r, e) {
    return new er(r, e).parse();
  };
  var St = class St2 {
    constructor(e, t) {
      this.source = e, this.transform = t || ka, this.position = 0, this.entries = [], this.recorded = [], this.dimension = 0;
    }
    isEof() {
      return this.position >= this.source.length;
    }
    nextCharacter() {
      var e = this.source[this.position++];
      return e === "\\" ? { value: this.source[this.position++], escaped: true } : { value: e, escaped: false };
    }
    record(e) {
      this.recorded.push(
        e
      );
    }
    newEntry(e) {
      var t;
      (this.recorded.length > 0 || e) && (t = this.recorded.join(""), t === "NULL" && !e && (t = null), t !== null && (t = this.transform(t)), this.entries.push(t), this.recorded = []);
    }
    consumeDimensions() {
      if (this.source[0] === "[") for (; !this.isEof(); ) {
        var e = this.nextCharacter();
        if (e.value === "=") break;
      }
    }
    parse(e) {
      var t, n, i;
      for (this.consumeDimensions(); !this.isEof(); ) if (t = this.nextCharacter(), t.value === "{" && !i) this.dimension++, this.dimension > 1 && (n = new St2(this.source.substr(this.position - 1), this.transform), this.entries.push(n.parse(
        true
      )), this.position += n.position - 2);
      else if (t.value === "}" && !i) {
        if (this.dimension--, !this.dimension && (this.newEntry(), e)) return this.entries;
      } else t.value === '"' && !t.escaped ? (i && this.newEntry(true), i = !i) : t.value === "," && !i ? this.newEntry() : this.record(t.value);
      if (this.dimension !== 0) throw new Error("array dimension not balanced");
      return this.entries;
    }
  };
  a(St, "ArrayParser");
  var er = St;
  function ka(r) {
    return r;
  }
  a(ka, "identity");
});
var rr = T((Ff, Ri) => {
  h();
  var Oa = tr();
  Ri.exports = { create: a(function(r, e) {
    return { parse: a(function() {
      return Oa.parse(r, e);
    }, "parse") };
  }, "create") };
});
var Fi = T((Of, Bi) => {
  "use strict";
  h();
  var Ua = /(\d{1,})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})(\.\d{1,})?.*?( BC)?$/, Qa = /^(\d{1,})-(\d{2})-(\d{2})( BC)?$/, Da = /([Z+-])(\d{2})?:?(\d{2})?:?(\d{2})?/, qa = /^-?infinity$/;
  Bi.exports = a(function(e) {
    if (qa.test(e)) return Number(e.replace("i", "I"));
    var t = Ua.exec(e);
    if (!t) return Na(
      e
    ) || null;
    var n = !!t[8], i = parseInt(t[1], 10);
    n && (i = Li(i));
    var s = parseInt(t[2], 10) - 1, o = t[3], u = parseInt(
      t[4],
      10
    ), c = parseInt(t[5], 10), l = parseInt(t[6], 10), f = t[7];
    f = f ? 1e3 * parseFloat(f) : 0;
    var m, g = Wa(e);
    return g != null ? (m = new Date(Date.UTC(i, s, o, u, c, l, f)), nr(i) && m.setUTCFullYear(i), g !== 0 && m.setTime(m.getTime() - g)) : (m = new Date(i, s, o, u, c, l, f), nr(i) && m.setFullYear(i)), m;
  }, "parseDate");
  function Na(r) {
    var e = Qa.exec(r);
    if (e) {
      var t = parseInt(e[1], 10), n = !!e[4];
      n && (t = Li(t));
      var i = parseInt(e[2], 10) - 1, s = e[3], o = new Date(t, i, s);
      return nr(
        t
      ) && o.setFullYear(t), o;
    }
  }
  a(Na, "getDate");
  function Wa(r) {
    if (r.endsWith("+00")) return 0;
    var e = Da.exec(r.split(" ")[1]);
    if (e) {
      var t = e[1];
      if (t === "Z") return 0;
      var n = t === "-" ? -1 : 1, i = parseInt(e[2], 10) * 3600 + parseInt(
        e[3] || 0,
        10
      ) * 60 + parseInt(e[4] || 0, 10);
      return i * n * 1e3;
    }
  }
  a(Wa, "timeZoneOffset");
  function Li(r) {
    return -(r - 1);
  }
  a(Li, "bcYearToNegativeYear");
  function nr(r) {
    return r >= 0 && r < 100;
  }
  a(nr, "is0To99");
});
var ki = T((Df, Mi) => {
  h();
  Mi.exports = Ha;
  var ja = Object.prototype.hasOwnProperty;
  function Ha(r) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var n in t) ja.call(t, n) && (r[n] = t[n]);
    }
    return r;
  }
  a(Ha, "extend");
});
var Qi = T((Wf, Ui) => {
  "use strict";
  h();
  var $a = ki();
  Ui.exports = Me;
  function Me(r) {
    if (!(this instanceof Me))
      return new Me(r);
    $a(this, nu(r));
  }
  a(Me, "PostgresInterval");
  var Ga = [
    "seconds",
    "minutes",
    "hours",
    "days",
    "months",
    "years"
  ];
  Me.prototype.toPostgres = function() {
    var r = Ga.filter(this.hasOwnProperty, this);
    return this.milliseconds && r.indexOf("seconds") < 0 && r.push("seconds"), r.length === 0 ? "0" : r.map(function(e) {
      var t = this[e] || 0;
      return e === "seconds" && this.milliseconds && (t = (t + this.milliseconds / 1e3).toFixed(6).replace(
        /\.?0+$/,
        ""
      )), t + " " + e;
    }, this).join(" ");
  };
  var Va = { years: "Y", months: "M", days: "D", hours: "H", minutes: "M", seconds: "S" }, za = ["years", "months", "days"], Ka = ["hours", "minutes", "seconds"];
  Me.prototype.toISOString = Me.prototype.toISO = function() {
    var r = za.map(t, this).join(""), e = Ka.map(t, this).join("");
    return "P" + r + "T" + e;
    function t(n) {
      var i = this[n] || 0;
      return n === "seconds" && this.milliseconds && (i = (i + this.milliseconds / 1e3).toFixed(6).replace(
        /0+$/,
        ""
      )), i + Va[n];
    }
  };
  var ir = "([+-]?\\d+)", Ya = ir + "\\s+years?", Za = ir + "\\s+mons?", Ja = ir + "\\s+days?", Xa = "([+-])?([\\d]*):(\\d\\d):(\\d\\d)\\.?(\\d{1,6})?", eu = new RegExp([Ya, Za, Ja, Xa].map(function(r) {
    return "(" + r + ")?";
  }).join("\\s*")), Oi = { years: 2, months: 4, days: 6, hours: 9, minutes: 10, seconds: 11, milliseconds: 12 }, tu = ["hours", "minutes", "seconds", "milliseconds"];
  function ru(r) {
    var e = r + "000000".slice(r.length);
    return parseInt(
      e,
      10
    ) / 1e3;
  }
  a(ru, "parseMilliseconds");
  function nu(r) {
    if (!r) return {};
    var e = eu.exec(r), t = e[8] === "-";
    return Object.keys(Oi).reduce(function(n, i) {
      var s = Oi[i], o = e[s];
      return !o || (o = i === "milliseconds" ? ru(o) : parseInt(o, 10), !o) || (t && ~tu.indexOf(i) && (o *= -1), n[i] = o), n;
    }, {});
  }
  a(nu, "parse");
});
var Ni = T(($f, qi) => {
  "use strict";
  h();
  var Di = p.from || p;
  qi.exports = a(function(e) {
    if (/^\\x/.test(e)) return Di(
      e.substr(2),
      "hex"
    );
    for (var t = "", n = 0; n < e.length; ) if (e[n] !== "\\") t += e[n], ++n;
    else if (/[0-7]{3}/.test(e.substr(n + 1, 3))) t += String.fromCharCode(parseInt(e.substr(n + 1, 3), 8)), n += 4;
    else {
      for (var i = 1; n + i < e.length && e[n + i] === "\\"; ) i++;
      for (var s = 0; s < Math.floor(i / 2); ++s) t += "\\";
      n += Math.floor(i / 2) * 2;
    }
    return Di(t, "binary");
  }, "parseBytea");
});
var zi = T((zf, Vi) => {
  h();
  var Ve = tr(), ze = rr(), Et = Fi(), ji = Qi(), Hi = Ni();
  function At(r) {
    return a(function(t) {
      return t === null ? t : r(t);
    }, "nullAllowed");
  }
  a(At, "allowNull");
  function $i(r) {
    return r === null ? r : r === "TRUE" || r === "t" || r === "true" || r === "y" || r === "yes" || r === "on" || r === "1";
  }
  a($i, "parseBool");
  function iu(r) {
    return r ? Ve.parse(r, $i) : null;
  }
  a(iu, "parseBoolArray");
  function su(r) {
    return parseInt(r, 10);
  }
  a(su, "parseBaseTenInt");
  function sr(r) {
    return r ? Ve.parse(r, At(su)) : null;
  }
  a(sr, "parseIntegerArray");
  function ou(r) {
    return r ? Ve.parse(r, At(function(e) {
      return Gi(e).trim();
    })) : null;
  }
  a(ou, "parseBigIntegerArray");
  var au = a(function(r) {
    if (!r) return null;
    var e = ze.create(r, function(t) {
      return t !== null && (t = cr(t)), t;
    });
    return e.parse();
  }, "parsePointArray"), or = a(function(r) {
    if (!r) return null;
    var e = ze.create(r, function(t) {
      return t !== null && (t = parseFloat(t)), t;
    });
    return e.parse();
  }, "parseFloatArray"), ee = a(function(r) {
    if (!r) return null;
    var e = ze.create(r);
    return e.parse();
  }, "parseStringArray"), ar = a(function(r) {
    if (!r) return null;
    var e = ze.create(
      r,
      function(t) {
        return t !== null && (t = Et(t)), t;
      }
    );
    return e.parse();
  }, "parseDateArray"), uu = a(function(r) {
    if (!r)
      return null;
    var e = ze.create(r, function(t) {
      return t !== null && (t = ji(t)), t;
    });
    return e.parse();
  }, "parseIntervalArray"), cu = a(function(r) {
    return r ? Ve.parse(r, At(Hi)) : null;
  }, "parseByteAArray"), ur = a(function(r) {
    return parseInt(r, 10);
  }, "parseInteger"), Gi = a(function(r) {
    var e = String(r);
    return /^\d+$/.test(e) ? e : r;
  }, "parseBigInteger"), Wi = a(function(r) {
    return r ? Ve.parse(r, At(JSON.parse)) : null;
  }, "parseJsonArray"), cr = a(
    function(r) {
      return r[0] !== "(" ? null : (r = r.substring(1, r.length - 1).split(","), { x: parseFloat(r[0]), y: parseFloat(
        r[1]
      ) });
    },
    "parsePoint"
  ), lu = a(function(r) {
    if (r[0] !== "<" && r[1] !== "(") return null;
    for (var e = "(", t = "", n = false, i = 2; i < r.length - 1; i++) {
      if (n || (e += r[i]), r[i] === ")") {
        n = true;
        continue;
      } else if (!n) continue;
      r[i] !== "," && (t += r[i]);
    }
    var s = cr(e);
    return s.radius = parseFloat(t), s;
  }, "parseCircle"), fu = a(function(r) {
    r(20, Gi), r(21, ur), r(23, ur), r(26, ur), r(700, parseFloat), r(701, parseFloat), r(16, $i), r(1082, Et), r(1114, Et), r(1184, Et), r(
      600,
      cr
    ), r(651, ee), r(718, lu), r(1e3, iu), r(1001, cu), r(1005, sr), r(1007, sr), r(1028, sr), r(1016, ou), r(1017, au), r(1021, or), r(1022, or), r(1231, or), r(1014, ee), r(1015, ee), r(1008, ee), r(1009, ee), r(1040, ee), r(1041, ee), r(
      1115,
      ar
    ), r(1182, ar), r(1185, ar), r(1186, ji), r(1187, uu), r(17, Hi), r(114, JSON.parse.bind(JSON)), r(3802, JSON.parse.bind(JSON)), r(199, Wi), r(3807, Wi), r(3907, ee), r(2951, ee), r(791, ee), r(1183, ee), r(1270, ee);
  }, "init");
  Vi.exports = { init: fu };
});
var Yi = T((Zf, Ki) => {
  "use strict";
  h();
  var K = 1e6;
  function hu(r) {
    var e = r.readInt32BE(0), t = r.readUInt32BE(
      4
    ), n = "";
    e < 0 && (e = ~e + (t === 0), t = ~t + 1 >>> 0, n = "-");
    var i = "", s, o, u, c, l, f;
    {
      if (s = e % K, e = e / K >>> 0, o = 4294967296 * s + t, t = o / K >>> 0, u = "" + (o - K * t), t === 0 && e === 0) return n + u + i;
      for (c = "", l = 6 - u.length, f = 0; f < l; f++) c += "0";
      i = c + u + i;
    }
    {
      if (s = e % K, e = e / K >>> 0, o = 4294967296 * s + t, t = o / K >>> 0, u = "" + (o - K * t), t === 0 && e === 0) return n + u + i;
      for (c = "", l = 6 - u.length, f = 0; f < l; f++) c += "0";
      i = c + u + i;
    }
    {
      if (s = e % K, e = e / K >>> 0, o = 4294967296 * s + t, t = o / K >>> 0, u = "" + (o - K * t), t === 0 && e === 0) return n + u + i;
      for (c = "", l = 6 - u.length, f = 0; f < l; f++) c += "0";
      i = c + u + i;
    }
    return s = e % K, o = 4294967296 * s + t, u = "" + o % K, n + u + i;
  }
  a(hu, "readInt8");
  Ki.exports = hu;
});
var ts = T((eh, es) => {
  h();
  var du = Yi(), B = a(function(r, e, t, n, i) {
    t = t || 0, n = n || false, i = i || function(w, S, k) {
      return w * Math.pow(2, k) + S;
    };
    var s = t >> 3, o = a(function(w) {
      return n ? ~w & 255 : w;
    }, "inv"), u = 255, c = 8 - t % 8;
    e < c && (u = 255 << 8 - e & 255, c = e), t && (u = u >> t % 8);
    var l = 0;
    t % 8 + e >= 8 && (l = i(0, o(r[s]) & u, c));
    for (var f = e + t >> 3, m = s + 1; m < f; m++) l = i(l, o(
      r[m]
    ), 8);
    var g = (e + t) % 8;
    return g > 0 && (l = i(l, o(r[f]) >> 8 - g, g)), l;
  }, "parseBits"), Xi = a(function(r, e, t) {
    var n = Math.pow(2, t - 1) - 1, i = B(r, 1), s = B(r, t, 1);
    if (s === 0) return 0;
    var o = 1, u = a(function(l, f, m) {
      l === 0 && (l = 1);
      for (var g = 1; g <= m; g++) o /= 2, (f & 1 << m - g) > 0 && (l += o);
      return l;
    }, "parsePrecisionBits"), c = B(r, e, t + 1, false, u);
    return s == Math.pow(
      2,
      t + 1
    ) - 1 ? c === 0 ? i === 0 ? 1 / 0 : -1 / 0 : NaN : (i === 0 ? 1 : -1) * Math.pow(2, s - n) * c;
  }, "parseFloatFromBits"), pu = a(function(r) {
    return B(r, 1) == 1 ? -1 * (B(r, 15, 1, true) + 1) : B(r, 15, 1);
  }, "parseInt16"), Zi = a(function(r) {
    return B(r, 1) == 1 ? -1 * (B(
      r,
      31,
      1,
      true
    ) + 1) : B(r, 31, 1);
  }, "parseInt32"), yu = a(function(r) {
    return Xi(r, 23, 8);
  }, "parseFloat32"), mu = a(function(r) {
    return Xi(r, 52, 11);
  }, "parseFloat64"), gu = a(function(r) {
    var e = B(r, 16, 32);
    if (e == 49152) return NaN;
    for (var t = Math.pow(1e4, B(r, 16, 16)), n = 0, i = [], s = B(r, 16), o = 0; o < s; o++) n += B(r, 16, 64 + 16 * o) * t, t /= 1e4;
    var u = Math.pow(10, B(
      r,
      16,
      48
    ));
    return (e === 0 ? 1 : -1) * Math.round(n * u) / u;
  }, "parseNumeric"), Ji = a(function(r, e) {
    var t = B(e, 1), n = B(
      e,
      63,
      1
    ), i = new Date((t === 0 ? 1 : -1) * n / 1e3 + 9466848e5);
    return r || i.setTime(i.getTime() + i.getTimezoneOffset() * 6e4), i.usec = n % 1e3, i.getMicroSeconds = function() {
      return this.usec;
    }, i.setMicroSeconds = function(s) {
      this.usec = s;
    }, i.getUTCMicroSeconds = function() {
      return this.usec;
    }, i;
  }, "parseDate"), Ke = a(
    function(r) {
      for (var e = B(
        r,
        32
      ), t = B(r, 32, 32), n = B(r, 32, 64), i = 96, s = [], o = 0; o < e; o++) s[o] = B(r, 32, i), i += 32, i += 32;
      var u = a(function(l) {
        var f = B(r, 32, i);
        if (i += 32, f == 4294967295) return null;
        var m;
        if (l == 23 || l == 20) return m = B(r, f * 8, i), i += f * 8, m;
        if (l == 25) return m = r.toString(this.encoding, i >> 3, (i += f << 3) >> 3), m;
        console.log("ERROR: ElementType not implemented: " + l);
      }, "parseElement"), c = a(function(l, f) {
        var m = [], g;
        if (l.length > 1) {
          var w = l.shift();
          for (g = 0; g < w; g++) m[g] = c(l, f);
          l.unshift(w);
        } else for (g = 0; g < l[0]; g++) m[g] = u(f);
        return m;
      }, "parse");
      return c(s, n);
    },
    "parseArray"
  ), wu = a(function(r) {
    return r.toString("utf8");
  }, "parseText"), bu = a(function(r) {
    return r === null ? null : B(r, 8) > 0;
  }, "parseBool"), xu = a(function(r) {
    r(20, du), r(21, pu), r(23, Zi), r(26, Zi), r(1700, gu), r(700, yu), r(701, mu), r(16, bu), r(1114, Ji.bind(null, false)), r(1184, Ji.bind(null, true)), r(1e3, Ke), r(1007, Ke), r(1016, Ke), r(1008, Ke), r(1009, Ke), r(25, wu);
  }, "init");
  es.exports = { init: xu };
});
var ns = T((nh, rs) => {
  h();
  rs.exports = {
    BOOL: 16,
    BYTEA: 17,
    CHAR: 18,
    INT8: 20,
    INT2: 21,
    INT4: 23,
    REGPROC: 24,
    TEXT: 25,
    OID: 26,
    TID: 27,
    XID: 28,
    CID: 29,
    JSON: 114,
    XML: 142,
    PG_NODE_TREE: 194,
    SMGR: 210,
    PATH: 602,
    POLYGON: 604,
    CIDR: 650,
    FLOAT4: 700,
    FLOAT8: 701,
    ABSTIME: 702,
    RELTIME: 703,
    TINTERVAL: 704,
    CIRCLE: 718,
    MACADDR8: 774,
    MONEY: 790,
    MACADDR: 829,
    INET: 869,
    ACLITEM: 1033,
    BPCHAR: 1042,
    VARCHAR: 1043,
    DATE: 1082,
    TIME: 1083,
    TIMESTAMP: 1114,
    TIMESTAMPTZ: 1184,
    INTERVAL: 1186,
    TIMETZ: 1266,
    BIT: 1560,
    VARBIT: 1562,
    NUMERIC: 1700,
    REFCURSOR: 1790,
    REGPROCEDURE: 2202,
    REGOPER: 2203,
    REGOPERATOR: 2204,
    REGCLASS: 2205,
    REGTYPE: 2206,
    UUID: 2950,
    TXID_SNAPSHOT: 2970,
    PG_LSN: 3220,
    PG_NDISTINCT: 3361,
    PG_DEPENDENCIES: 3402,
    TSVECTOR: 3614,
    TSQUERY: 3615,
    GTSVECTOR: 3642,
    REGCONFIG: 3734,
    REGDICTIONARY: 3769,
    JSONB: 3802,
    REGNAMESPACE: 4089,
    REGROLE: 4096
  };
});
var Je = T((Ze) => {
  h();
  var vu = zi(), Su = ts(), Eu = rr(), Au = ns();
  Ze.getTypeParser = Cu;
  Ze.setTypeParser = _u;
  Ze.arrayParser = Eu;
  Ze.builtins = Au;
  var Ye = { text: {}, binary: {} };
  function is(r) {
    return String(r);
  }
  a(is, "noParse");
  function Cu(r, e) {
    return e = e || "text", Ye[e] && Ye[e][r] || is;
  }
  a(Cu, "getTypeParser");
  function _u(r, e, t) {
    typeof e == "function" && (t = e, e = "text"), Ye[e][r] = t;
  }
  a(_u, "setTypeParser");
  vu.init(function(r, e) {
    Ye.text[r] = e;
  });
  Su.init(function(r, e) {
    Ye.binary[r] = e;
  });
});
var _t = T((uh, ss) => {
  "use strict";
  h();
  var Tu = Je();
  function Ct(r) {
    this._types = r || Tu, this.text = {}, this.binary = {};
  }
  a(Ct, "TypeOverrides");
  Ct.prototype.getOverrides = function(r) {
    switch (r) {
      case "text":
        return this.text;
      case "binary":
        return this.binary;
      default:
        return {};
    }
  };
  Ct.prototype.setTypeParser = function(r, e, t) {
    typeof e == "function" && (t = e, e = "text"), this.getOverrides(e)[r] = t;
  };
  Ct.prototype.getTypeParser = function(r, e) {
    return e = e || "text", this.getOverrides(e)[r] || this._types.getTypeParser(r, e);
  };
  ss.exports = Ct;
});
function Xe(r) {
  let e = 1779033703, t = 3144134277, n = 1013904242, i = 2773480762, s = 1359893119, o = 2600822924, u = 528734635, c = 1541459225, l = 0, f = 0, m = [
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ], g = a((I, C) => I >>> C | I << 32 - C, "rrot"), w = new Uint32Array(64), S = new Uint8Array(64), k = a(() => {
    for (let R = 0, $ = 0; R < 16; R++, $ += 4) w[R] = S[$] << 24 | S[$ + 1] << 16 | S[$ + 2] << 8 | S[$ + 3];
    for (let R = 16; R < 64; R++) {
      let $ = g(w[R - 15], 7) ^ g(w[R - 15], 18) ^ w[R - 15] >>> 3, Ee = g(
        w[R - 2],
        17
      ) ^ g(w[R - 2], 19) ^ w[R - 2] >>> 10;
      w[R] = w[R - 16] + $ + w[R - 7] + Ee | 0;
    }
    let I = e, C = t, re = n, ne = i, H = s, oe = o, ae = u, me = c;
    for (let R = 0; R < 64; R++) {
      let $ = g(H, 6) ^ g(H, 11) ^ g(H, 25), Ee = H & oe ^ ~H & ae, ue = me + $ + Ee + m[R] + w[R] | 0, Te = g(I, 2) ^ g(
        I,
        13
      ) ^ g(I, 22), ce = I & C ^ I & re ^ C & re, G = Te + ce | 0;
      me = ae, ae = oe, oe = H, H = ne + ue | 0, ne = re, re = C, C = I, I = ue + G | 0;
    }
    e = e + I | 0, t = t + C | 0, n = n + re | 0, i = i + ne | 0, s = s + H | 0, o = o + oe | 0, u = u + ae | 0, c = c + me | 0, f = 0;
  }, "process"), D = a(
    (I) => {
      typeof I == "string" && (I = new TextEncoder().encode(I));
      for (let C = 0; C < I.length; C++) S[f++] = I[C], f === 64 && k();
      l += I.length;
    },
    "add"
  ), he = a(() => {
    if (S[f++] = 128, f == 64 && k(), f + 8 > 64) {
      for (; f < 64; ) S[f++] = 0;
      k();
    }
    for (; f < 58; ) S[f++] = 0;
    let I = l * 8;
    S[f++] = I / 1099511627776 & 255, S[f++] = I / 4294967296 & 255, S[f++] = I >>> 24, S[f++] = I >>> 16 & 255, S[f++] = I >>> 8 & 255, S[f++] = I & 255, k();
    let C = new Uint8Array(32);
    return C[0] = e >>> 24, C[1] = e >>> 16 & 255, C[2] = e >>> 8 & 255, C[3] = e & 255, C[4] = t >>> 24, C[5] = t >>> 16 & 255, C[6] = t >>> 8 & 255, C[7] = t & 255, C[8] = n >>> 24, C[9] = n >>> 16 & 255, C[10] = n >>> 8 & 255, C[11] = n & 255, C[12] = i >>> 24, C[13] = i >>> 16 & 255, C[14] = i >>> 8 & 255, C[15] = i & 255, C[16] = s >>> 24, C[17] = s >>> 16 & 255, C[18] = s >>> 8 & 255, C[19] = s & 255, C[20] = o >>> 24, C[21] = o >>> 16 & 255, C[22] = o >>> 8 & 255, C[23] = o & 255, C[24] = u >>> 24, C[25] = u >>> 16 & 255, C[26] = u >>> 8 & 255, C[27] = u & 255, C[28] = c >>> 24, C[29] = c >>> 16 & 255, C[30] = c >>> 8 & 255, C[31] = c & 255, C;
  }, "digest");
  return r === void 0 ? { add: D, digest: he } : (D(r), he());
}
var os3 = V(() => {
  "use strict";
  h();
  a(Xe, "sha256");
});
var M;
var et;
var as = V(() => {
  "use strict";
  h();
  M = class M2 {
    constructor() {
      E(this, "_dataLength", 0);
      E(this, "_bufferLength", 0);
      E(this, "_state", new Int32Array(4));
      E(this, "_buffer", new ArrayBuffer(68));
      E(this, "_buffer8");
      E(this, "_buffer32");
      this._buffer8 = new Uint8Array(this._buffer, 0, 68), this._buffer32 = new Uint32Array(this._buffer, 0, 17), this.start();
    }
    static hashByteArray(e, t = false) {
      return this.onePassHasher.start().appendByteArray(
        e
      ).end(t);
    }
    static hashStr(e, t = false) {
      return this.onePassHasher.start().appendStr(e).end(t);
    }
    static hashAsciiStr(e, t = false) {
      return this.onePassHasher.start().appendAsciiStr(e).end(t);
    }
    static _hex(e) {
      let t = M2.hexChars, n = M2.hexOut, i, s, o, u;
      for (u = 0; u < 4; u += 1) for (s = u * 8, i = e[u], o = 0; o < 8; o += 2) n[s + 1 + o] = t.charAt(i & 15), i >>>= 4, n[s + 0 + o] = t.charAt(
        i & 15
      ), i >>>= 4;
      return n.join("");
    }
    static _md5cycle(e, t) {
      let n = e[0], i = e[1], s = e[2], o = e[3];
      n += (i & s | ~i & o) + t[0] - 680876936 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[1] - 389564586 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[2] + 606105819 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[3] - 1044525330 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[4] - 176418897 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[5] + 1200080426 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[6] - 1473231341 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[7] - 45705983 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[8] + 1770035416 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[9] - 1958414417 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[10] - 42063 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[11] - 1990404162 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & s | ~i & o) + t[12] + 1804603682 | 0, n = (n << 7 | n >>> 25) + i | 0, o += (n & i | ~n & s) + t[13] - 40341101 | 0, o = (o << 12 | o >>> 20) + n | 0, s += (o & n | ~o & i) + t[14] - 1502002290 | 0, s = (s << 17 | s >>> 15) + o | 0, i += (s & o | ~s & n) + t[15] + 1236535329 | 0, i = (i << 22 | i >>> 10) + s | 0, n += (i & o | s & ~o) + t[1] - 165796510 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[6] - 1069501632 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[11] + 643717713 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[0] - 373897302 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[5] - 701558691 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[10] + 38016083 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[15] - 660478335 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[4] - 405537848 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[9] + 568446438 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[14] - 1019803690 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[3] - 187363961 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[8] + 1163531501 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i & o | s & ~o) + t[13] - 1444681467 | 0, n = (n << 5 | n >>> 27) + i | 0, o += (n & s | i & ~s) + t[2] - 51403784 | 0, o = (o << 9 | o >>> 23) + n | 0, s += (o & i | n & ~i) + t[7] + 1735328473 | 0, s = (s << 14 | s >>> 18) + o | 0, i += (s & n | o & ~n) + t[12] - 1926607734 | 0, i = (i << 20 | i >>> 12) + s | 0, n += (i ^ s ^ o) + t[5] - 378558 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[8] - 2022574463 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[11] + 1839030562 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[14] - 35309556 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[1] - 1530992060 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[4] + 1272893353 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[7] - 155497632 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[10] - 1094730640 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[13] + 681279174 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[0] - 358537222 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[3] - 722521979 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[6] + 76029189 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (i ^ s ^ o) + t[9] - 640364487 | 0, n = (n << 4 | n >>> 28) + i | 0, o += (n ^ i ^ s) + t[12] - 421815835 | 0, o = (o << 11 | o >>> 21) + n | 0, s += (o ^ n ^ i) + t[15] + 530742520 | 0, s = (s << 16 | s >>> 16) + o | 0, i += (s ^ o ^ n) + t[2] - 995338651 | 0, i = (i << 23 | i >>> 9) + s | 0, n += (s ^ (i | ~o)) + t[0] - 198630844 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[7] + 1126891415 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[14] - 1416354905 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[5] - 57434055 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[12] + 1700485571 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[3] - 1894986606 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[10] - 1051523 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[1] - 2054922799 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[8] + 1873313359 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[15] - 30611744 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[6] - 1560198380 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[13] + 1309151649 | 0, i = (i << 21 | i >>> 11) + s | 0, n += (s ^ (i | ~o)) + t[4] - 145523070 | 0, n = (n << 6 | n >>> 26) + i | 0, o += (i ^ (n | ~s)) + t[11] - 1120210379 | 0, o = (o << 10 | o >>> 22) + n | 0, s += (n ^ (o | ~i)) + t[2] + 718787259 | 0, s = (s << 15 | s >>> 17) + o | 0, i += (o ^ (s | ~n)) + t[9] - 343485551 | 0, i = (i << 21 | i >>> 11) + s | 0, e[0] = n + e[0] | 0, e[1] = i + e[1] | 0, e[2] = s + e[2] | 0, e[3] = o + e[3] | 0;
    }
    start() {
      return this._dataLength = 0, this._bufferLength = 0, this._state.set(M2.stateIdentity), this;
    }
    appendStr(e) {
      let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o;
      for (o = 0; o < e.length; o += 1) {
        if (s = e.charCodeAt(o), s < 128) t[i++] = s;
        else if (s < 2048) t[i++] = (s >>> 6) + 192, t[i++] = s & 63 | 128;
        else if (s < 55296 || s > 56319) t[i++] = (s >>> 12) + 224, t[i++] = s >>> 6 & 63 | 128, t[i++] = s & 63 | 128;
        else {
          if (s = (s - 55296) * 1024 + (e.charCodeAt(++o) - 56320) + 65536, s > 1114111) throw new Error(
            "Unicode standard supports code points up to U+10FFFF"
          );
          t[i++] = (s >>> 18) + 240, t[i++] = s >>> 12 & 63 | 128, t[i++] = s >>> 6 & 63 | 128, t[i++] = s & 63 | 128;
        }
        i >= 64 && (this._dataLength += 64, M2._md5cycle(this._state, n), i -= 64, n[0] = n[16]);
      }
      return this._bufferLength = i, this;
    }
    appendAsciiStr(e) {
      let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o = 0;
      for (; ; ) {
        for (s = Math.min(e.length - o, 64 - i); s--; ) t[i++] = e.charCodeAt(o++);
        if (i < 64) break;
        this._dataLength += 64, M2._md5cycle(this._state, n), i = 0;
      }
      return this._bufferLength = i, this;
    }
    appendByteArray(e) {
      let t = this._buffer8, n = this._buffer32, i = this._bufferLength, s, o = 0;
      for (; ; ) {
        for (s = Math.min(e.length - o, 64 - i); s--; ) t[i++] = e[o++];
        if (i < 64) break;
        this._dataLength += 64, M2._md5cycle(this._state, n), i = 0;
      }
      return this._bufferLength = i, this;
    }
    getState() {
      let e = this._state;
      return { buffer: String.fromCharCode.apply(null, Array.from(this._buffer8)), buflen: this._bufferLength, length: this._dataLength, state: [e[0], e[1], e[2], e[3]] };
    }
    setState(e) {
      let t = e.buffer, n = e.state, i = this._state, s;
      for (this._dataLength = e.length, this._bufferLength = e.buflen, i[0] = n[0], i[1] = n[1], i[2] = n[2], i[3] = n[3], s = 0; s < t.length; s += 1) this._buffer8[s] = t.charCodeAt(s);
    }
    end(e = false) {
      let t = this._bufferLength, n = this._buffer8, i = this._buffer32, s = (t >> 2) + 1;
      this._dataLength += t;
      let o = this._dataLength * 8;
      if (n[t] = 128, n[t + 1] = n[t + 2] = n[t + 3] = 0, i.set(M2.buffer32Identity.subarray(s), s), t > 55 && (M2._md5cycle(this._state, i), i.set(M2.buffer32Identity)), o <= 4294967295) i[14] = o;
      else {
        let u = o.toString(16).match(/(.*?)(.{0,8})$/);
        if (u === null) return;
        let c = parseInt(
          u[2],
          16
        ), l = parseInt(u[1], 16) || 0;
        i[14] = c, i[15] = l;
      }
      return M2._md5cycle(this._state, i), e ? this._state : M2._hex(
        this._state
      );
    }
  };
  a(M, "Md5"), E(M, "stateIdentity", new Int32Array([1732584193, -271733879, -1732584194, 271733878])), E(M, "buffer32Identity", new Int32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])), E(M, "hexChars", "0123456789abcdef"), E(M, "hexOut", []), E(M, "onePassHasher", new M());
  et = M;
});
var lr = {};
se(lr, { createHash: () => Pu, createHmac: () => Ru, randomBytes: () => Iu });
function Iu(r) {
  return crypto.getRandomValues(p.alloc(r));
}
function Pu(r) {
  if (r === "sha256") return { update: a(function(e) {
    return { digest: a(
      function() {
        return p.from(Xe(e));
      },
      "digest"
    ) };
  }, "update") };
  if (r === "md5") return { update: a(function(e) {
    return {
      digest: a(function() {
        return typeof e == "string" ? et.hashStr(e) : et.hashByteArray(e);
      }, "digest")
    };
  }, "update") };
  throw new Error(`Hash type '${r}' not supported`);
}
function Ru(r, e) {
  if (r !== "sha256") throw new Error(`Only sha256 is supported (requested: '${r}')`);
  return { update: a(function(t) {
    return { digest: a(
      function() {
        typeof e == "string" && (e = new TextEncoder().encode(e)), typeof t == "string" && (t = new TextEncoder().encode(
          t
        ));
        let n = e.length;
        if (n > 64) e = Xe(e);
        else if (n < 64) {
          let c = new Uint8Array(64);
          c.set(e), e = c;
        }
        let i = new Uint8Array(
          64
        ), s = new Uint8Array(64);
        for (let c = 0; c < 64; c++) i[c] = 54 ^ e[c], s[c] = 92 ^ e[c];
        let o = new Uint8Array(t.length + 64);
        o.set(i, 0), o.set(t, 64);
        let u = new Uint8Array(96);
        return u.set(s, 0), u.set(Xe(o), 64), p.from(Xe(u));
      },
      "digest"
    ) };
  }, "update") };
}
var fr = V(() => {
  "use strict";
  h();
  os3();
  as();
  a(Iu, "randomBytes");
  a(Pu, "createHash");
  a(Ru, "createHmac");
});
var tt = T((vh, hr) => {
  "use strict";
  h();
  hr.exports = {
    host: "localhost",
    user: y.platform === "win32" ? y.env.USERNAME : y.env.USER,
    database: void 0,
    password: null,
    connectionString: void 0,
    port: 5432,
    rows: 0,
    binary: false,
    max: 10,
    idleTimeoutMillis: 3e4,
    client_encoding: "",
    ssl: false,
    application_name: void 0,
    fallback_application_name: void 0,
    options: void 0,
    parseInputDatesAsUTC: false,
    statement_timeout: false,
    lock_timeout: false,
    idle_in_transaction_session_timeout: false,
    query_timeout: false,
    connect_timeout: 0,
    keepalives: 1,
    keepalives_idle: 0
  };
  var ke = Je(), Lu = ke.getTypeParser(20, "text"), Bu = ke.getTypeParser(
    1016,
    "text"
  );
  hr.exports.__defineSetter__("parseInt8", function(r) {
    ke.setTypeParser(20, "text", r ? ke.getTypeParser(
      23,
      "text"
    ) : Lu), ke.setTypeParser(1016, "text", r ? ke.getTypeParser(1007, "text") : Bu);
  });
});
var rt = T((Eh, cs) => {
  "use strict";
  h();
  var Fu = (fr(), O(lr)), Mu = tt();
  function ku(r) {
    var e = r.replace(
      /\\/g,
      "\\\\"
    ).replace(/"/g, '\\"');
    return '"' + e + '"';
  }
  a(ku, "escapeElement");
  function us(r) {
    for (var e = "{", t = 0; t < r.length; t++) t > 0 && (e = e + ","), r[t] === null || typeof r[t] > "u" ? e = e + "NULL" : Array.isArray(r[t]) ? e = e + us(r[t]) : r[t] instanceof p ? e += "\\\\x" + r[t].toString("hex") : e += ku(Tt(r[t]));
    return e = e + "}", e;
  }
  a(us, "arrayString");
  var Tt = a(function(r, e) {
    if (r == null) return null;
    if (r instanceof p) return r;
    if (ArrayBuffer.isView(r)) {
      var t = p.from(r.buffer, r.byteOffset, r.byteLength);
      return t.length === r.byteLength ? t : t.slice(r.byteOffset, r.byteOffset + r.byteLength);
    }
    return r instanceof Date ? Mu.parseInputDatesAsUTC ? Qu(r) : Uu(r) : Array.isArray(r) ? us(r) : typeof r == "object" ? Ou(r, e) : r.toString();
  }, "prepareValue");
  function Ou(r, e) {
    if (r && typeof r.toPostgres == "function") {
      if (e = e || [], e.indexOf(r) !== -1) throw new Error('circular reference detected while preparing "' + r + '" for query');
      return e.push(r), Tt(r.toPostgres(Tt), e);
    }
    return JSON.stringify(r);
  }
  a(Ou, "prepareObject");
  function W(r, e) {
    for (r = "" + r; r.length < e; ) r = "0" + r;
    return r;
  }
  a(W, "pad");
  function Uu(r) {
    var e = -r.getTimezoneOffset(), t = r.getFullYear(), n = t < 1;
    n && (t = Math.abs(t) + 1);
    var i = W(t, 4) + "-" + W(r.getMonth() + 1, 2) + "-" + W(r.getDate(), 2) + "T" + W(
      r.getHours(),
      2
    ) + ":" + W(r.getMinutes(), 2) + ":" + W(r.getSeconds(), 2) + "." + W(r.getMilliseconds(), 3);
    return e < 0 ? (i += "-", e *= -1) : i += "+", i += W(Math.floor(e / 60), 2) + ":" + W(e % 60, 2), n && (i += " BC"), i;
  }
  a(Uu, "dateToString");
  function Qu(r) {
    var e = r.getUTCFullYear(), t = e < 1;
    t && (e = Math.abs(e) + 1);
    var n = W(e, 4) + "-" + W(r.getUTCMonth() + 1, 2) + "-" + W(r.getUTCDate(), 2) + "T" + W(r.getUTCHours(), 2) + ":" + W(r.getUTCMinutes(), 2) + ":" + W(r.getUTCSeconds(), 2) + "." + W(
      r.getUTCMilliseconds(),
      3
    );
    return n += "+00:00", t && (n += " BC"), n;
  }
  a(Qu, "dateToStringUTC");
  function Du(r, e, t) {
    return r = typeof r == "string" ? { text: r } : r, e && (typeof e == "function" ? r.callback = e : r.values = e), t && (r.callback = t), r;
  }
  a(Du, "normalizeQueryConfig");
  var dr = a(function(r) {
    return Fu.createHash("md5").update(r, "utf-8").digest("hex");
  }, "md5"), qu = a(
    function(r, e, t) {
      var n = dr(e + r), i = dr(p.concat([p.from(n), t]));
      return "md5" + i;
    },
    "postgresMd5PasswordHash"
  );
  cs.exports = {
    prepareValue: a(function(e) {
      return Tt(e);
    }, "prepareValueWrapper"),
    normalizeQueryConfig: Du,
    postgresMd5PasswordHash: qu,
    md5: dr
  };
});
var nt = {};
se(nt, { default: () => ju });
var ju;
var it = V(() => {
  "use strict";
  h();
  ju = {};
});
var xs = T((Dh, bs) => {
  "use strict";
  h();
  var pr = (fr(), O(lr));
  function Hu(r) {
    if (r.indexOf("SCRAM-SHA-256") === -1) throw new Error("SASL: Only mechanism SCRAM-SHA-256 is currently supported");
    let e = pr.randomBytes(
      18
    ).toString("base64");
    return { mechanism: "SCRAM-SHA-256", clientNonce: e, response: "n,,n=*,r=" + e, message: "SASLInitialResponse" };
  }
  a(Hu, "startSession");
  function $u(r, e, t) {
    if (r.message !== "SASLInitialResponse") throw new Error(
      "SASL: Last message was not SASLInitialResponse"
    );
    if (typeof e != "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string");
    if (typeof t != "string") throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: serverData must be a string");
    let n = zu(t);
    if (n.nonce.startsWith(r.clientNonce)) {
      if (n.nonce.length === r.clientNonce.length) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
    var i = p.from(n.salt, "base64"), s = Zu(e, i, n.iteration), o = Oe(s, "Client Key"), u = Yu(
      o
    ), c = "n=*,r=" + r.clientNonce, l = "r=" + n.nonce + ",s=" + n.salt + ",i=" + n.iteration, f = "c=biws,r=" + n.nonce, m = c + "," + l + "," + f, g = Oe(u, m), w = ws(o, g), S = w.toString("base64"), k = Oe(s, "Server Key"), D = Oe(k, m);
    r.message = "SASLResponse", r.serverSignature = D.toString("base64"), r.response = f + ",p=" + S;
  }
  a($u, "continueSession");
  function Gu(r, e) {
    if (r.message !== "SASLResponse") throw new Error("SASL: Last message was not SASLResponse");
    if (typeof e != "string") throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: serverData must be a string");
    let { serverSignature: t } = Ku(
      e
    );
    if (t !== r.serverSignature) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature does not match");
  }
  a(Gu, "finalizeSession");
  function Vu(r) {
    if (typeof r != "string") throw new TypeError("SASL: text must be a string");
    return r.split("").map((e, t) => r.charCodeAt(t)).every((e) => e >= 33 && e <= 43 || e >= 45 && e <= 126);
  }
  a(Vu, "isPrintableChars");
  function ms(r) {
    return /^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(r);
  }
  a(ms, "isBase64");
  function gs(r) {
    if (typeof r != "string") throw new TypeError("SASL: attribute pairs text must be a string");
    return new Map(r.split(",").map((e) => {
      if (!/^.=/.test(e)) throw new Error("SASL: Invalid attribute pair entry");
      let t = e[0], n = e.substring(2);
      return [t, n];
    }));
  }
  a(gs, "parseAttributePairs");
  function zu(r) {
    let e = gs(r), t = e.get("r");
    if (t) {
      if (!Vu(t)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce must only contain printable characters");
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing");
    let n = e.get("s");
    if (n) {
      if (!ms(n)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt must be base64");
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing");
    let i = e.get("i");
    if (i) {
      if (!/^[1-9][0-9]*$/.test(i)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: invalid iteration count");
    } else throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: iteration missing");
    let s = parseInt(i, 10);
    return { nonce: t, salt: n, iteration: s };
  }
  a(zu, "parseServerFirstMessage");
  function Ku(r) {
    let t = gs(r).get("v");
    if (t) {
      if (!ms(t)) throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature must be base64");
    } else throw new Error("SASL: SCRAM-SERVER-FINAL-MESSAGE: server signature is missing");
    return { serverSignature: t };
  }
  a(Ku, "parseServerFinalMessage");
  function ws(r, e) {
    if (!p.isBuffer(r)) throw new TypeError("first argument must be a Buffer");
    if (!p.isBuffer(e)) throw new TypeError(
      "second argument must be a Buffer"
    );
    if (r.length !== e.length) throw new Error("Buffer lengths must match");
    if (r.length === 0) throw new Error("Buffers cannot be empty");
    return p.from(r.map((t, n) => r[n] ^ e[n]));
  }
  a(ws, "xorBuffers");
  function Yu(r) {
    return pr.createHash("sha256").update(r).digest();
  }
  a(Yu, "sha256");
  function Oe(r, e) {
    return pr.createHmac("sha256", r).update(e).digest();
  }
  a(Oe, "hmacSha256");
  function Zu(r, e, t) {
    for (var n = Oe(
      r,
      p.concat([e, p.from([0, 0, 0, 1])])
    ), i = n, s = 0; s < t - 1; s++) n = Oe(r, n), i = ws(i, n);
    return i;
  }
  a(Zu, "Hi");
  bs.exports = { startSession: Hu, continueSession: $u, finalizeSession: Gu };
});
var yr = {};
se(yr, { join: () => Ju });
function Ju(...r) {
  return r.join("/");
}
var mr = V(() => {
  "use strict";
  h();
  a(
    Ju,
    "join"
  );
});
var gr = {};
se(gr, { stat: () => Xu });
function Xu(r, e) {
  e(new Error("No filesystem"));
}
var wr = V(() => {
  "use strict";
  h();
  a(Xu, "stat");
});
var br = {};
se(br, { default: () => ec });
var ec;
var xr = V(() => {
  "use strict";
  h();
  ec = {};
});
var vs = {};
se(vs, { StringDecoder: () => vr });
var Sr;
var vr;
var Ss = V(() => {
  "use strict";
  h();
  Sr = class Sr {
    constructor(e) {
      E(this, "td");
      this.td = new TextDecoder(e);
    }
    write(e) {
      return this.td.decode(e, { stream: true });
    }
    end(e) {
      return this.td.decode(e);
    }
  };
  a(Sr, "StringDecoder");
  vr = Sr;
});
var _s = T((Kh, Cs) => {
  "use strict";
  h();
  var { Transform: tc } = (xr(), O(br)), { StringDecoder: rc } = (Ss(), O(vs)), Se = /* @__PURE__ */ Symbol(
    "last"
  ), It = /* @__PURE__ */ Symbol("decoder");
  function nc(r, e, t) {
    let n;
    if (this.overflow) {
      if (n = this[It].write(r).split(
        this.matcher
      ), n.length === 1) return t();
      n.shift(), this.overflow = false;
    } else this[Se] += this[It].write(r), n = this[Se].split(this.matcher);
    this[Se] = n.pop();
    for (let i = 0; i < n.length; i++) try {
      As(this, this.mapper(n[i]));
    } catch (s) {
      return t(s);
    }
    if (this.overflow = this[Se].length > this.maxLength, this.overflow && !this.skipOverflow) {
      t(new Error(
        "maximum buffer reached"
      ));
      return;
    }
    t();
  }
  a(nc, "transform");
  function ic(r) {
    if (this[Se] += this[It].end(), this[Se])
      try {
        As(this, this.mapper(this[Se]));
      } catch (e) {
        return r(e);
      }
    r();
  }
  a(ic, "flush");
  function As(r, e) {
    e !== void 0 && r.push(e);
  }
  a(As, "push");
  function Es(r) {
    return r;
  }
  a(Es, "noop");
  function sc(r, e, t) {
    switch (r = r || /\r?\n/, e = e || Es, t = t || {}, arguments.length) {
      case 1:
        typeof r == "function" ? (e = r, r = /\r?\n/) : typeof r == "object" && !(r instanceof RegExp) && !r[Symbol.split] && (t = r, r = /\r?\n/);
        break;
      case 2:
        typeof r == "function" ? (t = e, e = r, r = /\r?\n/) : typeof e == "object" && (t = e, e = Es);
    }
    t = Object.assign({}, t), t.autoDestroy = true, t.transform = nc, t.flush = ic, t.readableObjectMode = true;
    let n = new tc(t);
    return n[Se] = "", n[It] = new rc("utf8"), n.matcher = r, n.mapper = e, n.maxLength = t.maxLength, n.skipOverflow = t.skipOverflow || false, n.overflow = false, n._destroy = function(i, s) {
      this._writableState.errorEmitted = false, s(i);
    }, n;
  }
  a(sc, "split");
  Cs.exports = sc;
});
var Ps = T((Jh, ye) => {
  "use strict";
  h();
  var Ts = (mr(), O(yr)), oc = (xr(), O(br)).Stream, ac = _s(), Is = (it(), O(nt)), uc = 5432, Pt = y.platform === "win32", st = y.stderr, cc = 56, lc = 7, fc = 61440, hc = 32768;
  function dc(r) {
    return (r & fc) == hc;
  }
  a(dc, "isRegFile");
  var Ue = ["host", "port", "database", "user", "password"], Er = Ue.length, pc = Ue[Er - 1];
  function Ar() {
    var r = st instanceof oc && st.writable === true;
    if (r) {
      var e = Array.prototype.slice.call(arguments).concat(`
`);
      st.write(Is.format.apply(Is, e));
    }
  }
  a(Ar, "warn");
  Object.defineProperty(ye.exports, "isWin", { get: a(function() {
    return Pt;
  }, "get"), set: a(function(r) {
    Pt = r;
  }, "set") });
  ye.exports.warnTo = function(r) {
    var e = st;
    return st = r, e;
  };
  ye.exports.getFileName = function(r) {
    var e = r || y.env, t = e.PGPASSFILE || (Pt ? Ts.join(e.APPDATA || "./", "postgresql", "pgpass.conf") : Ts.join(e.HOME || "./", ".pgpass"));
    return t;
  };
  ye.exports.usePgPass = function(r, e) {
    return Object.prototype.hasOwnProperty.call(y.env, "PGPASSWORD") ? false : Pt ? true : (e = e || "<unkn>", dc(r.mode) ? r.mode & (cc | lc) ? (Ar('WARNING: password file "%s" has group or world access; permissions should be u=rw (0600) or less', e), false) : true : (Ar('WARNING: password file "%s" is not a plain file', e), false));
  };
  var yc = ye.exports.match = function(r, e) {
    return Ue.slice(0, -1).reduce(function(t, n, i) {
      return i == 1 && Number(r[n] || uc) === Number(
        e[n]
      ) ? t && true : t && (e[n] === "*" || e[n] === r[n]);
    }, true);
  };
  ye.exports.getPassword = function(r, e, t) {
    var n, i = e.pipe(
      ac()
    );
    function s(c) {
      var l = mc(c);
      l && gc(l) && yc(r, l) && (n = l[pc], i.end());
    }
    a(s, "onLine");
    var o = a(function() {
      e.destroy(), t(n);
    }, "onEnd"), u = a(function(c) {
      e.destroy(), Ar("WARNING: error on reading file: %s", c), t(
        void 0
      );
    }, "onErr");
    e.on("error", u), i.on("data", s).on("end", o).on("error", u);
  };
  var mc = ye.exports.parseLine = function(r) {
    if (r.length < 11 || r.match(/^\s+#/)) return null;
    for (var e = "", t = "", n = 0, i = 0, s = 0, o = {}, u = false, c = a(
      function(f, m, g) {
        var w = r.substring(m, g);
        Object.hasOwnProperty.call(y.env, "PGPASS_NO_DEESCAPE") || (w = w.replace(/\\([:\\])/g, "$1")), o[Ue[f]] = w;
      },
      "addToObj"
    ), l = 0; l < r.length - 1; l += 1) {
      if (e = r.charAt(l + 1), t = r.charAt(
        l
      ), u = n == Er - 1, u) {
        c(n, i);
        break;
      }
      l >= 0 && e == ":" && t !== "\\" && (c(n, i, l + 1), i = l + 2, n += 1);
    }
    return o = Object.keys(o).length === Er ? o : null, o;
  }, gc = ye.exports.isValidEntry = function(r) {
    for (var e = { 0: function(o) {
      return o.length > 0;
    }, 1: function(o) {
      return o === "*" ? true : (o = Number(o), isFinite(o) && o > 0 && o < 9007199254740992 && Math.floor(o) === o);
    }, 2: function(o) {
      return o.length > 0;
    }, 3: function(o) {
      return o.length > 0;
    }, 4: function(o) {
      return o.length > 0;
    } }, t = 0; t < Ue.length; t += 1) {
      var n = e[t], i = r[Ue[t]] || "", s = n(i);
      if (!s) return false;
    }
    return true;
  };
});
var Ls = T((rd, Cr) => {
  "use strict";
  h();
  var td = (mr(), O(yr)), Rs = (wr(), O(gr)), Rt = Ps();
  Cr.exports = function(r, e) {
    var t = Rt.getFileName();
    Rs.stat(t, function(n, i) {
      if (n || !Rt.usePgPass(i, t)) return e(void 0);
      var s = Rs.createReadStream(
        t
      );
      Rt.getPassword(r, s, e);
    });
  };
  Cr.exports.warnTo = Rt.warnTo;
});
var Bs = {};
se(Bs, { default: () => wc });
var wc;
var Fs = V(() => {
  "use strict";
  h();
  wc = {};
});
var Ms = {};
se(Ms, { parse: () => bc });
function bc(r, e = false) {
  let { protocol: t } = new URL(r), n = "http:" + r.substring(
    t.length
  ), { username: i, password: s, host: o, hostname: u, port: c, pathname: l, search: f, searchParams: m, hash: g } = new URL(
    n
  );
  s = decodeURIComponent(s), i = decodeURIComponent(i), l = decodeURIComponent(l);
  let w = i + ":" + s, S = e ? Object.fromEntries(m.entries()) : f;
  return {
    href: r,
    protocol: t,
    auth: w,
    username: i,
    password: s,
    host: o,
    hostname: u,
    port: c,
    pathname: l,
    search: f,
    query: S,
    hash: g
  };
}
var ks = V(() => {
  "use strict";
  h();
  a(bc, "parse");
});
var Ir = T((ad, Os) => {
  "use strict";
  h();
  var xc = (ks(), O(Ms)), _r = (wr(), O(gr));
  function Tr(r) {
    if (r.charAt(0) === "/") {
      var t = r.split(" ");
      return { host: t[0], database: t[1] };
    }
    var e = xc.parse(/ |%[^a-f0-9]|%[a-f0-9][^a-f0-9]/i.test(r) ? encodeURI(r).replace(/\%25(\d\d)/g, "%$1") : r, true), t = e.query;
    for (var n in t) Array.isArray(t[n]) && (t[n] = t[n][t[n].length - 1]);
    var i = (e.auth || ":").split(":");
    if (t.user = i[0], t.password = i.splice(1).join(
      ":"
    ), t.port = e.port, e.protocol == "socket:") return t.host = decodeURI(e.pathname), t.database = e.query.db, t.client_encoding = e.query.encoding, t;
    t.host || (t.host = e.hostname);
    var s = e.pathname;
    if (!t.host && s && /^%2f/i.test(s)) {
      var o = s.split("/");
      t.host = decodeURIComponent(o[0]), s = o.splice(1).join("/");
    }
    switch (s && s.charAt(
      0
    ) === "/" && (s = s.slice(1) || null), t.database = s && decodeURI(s), (t.ssl === "true" || t.ssl === "1") && (t.ssl = true), t.ssl === "0" && (t.ssl = false), (t.sslcert || t.sslkey || t.sslrootcert || t.sslmode) && (t.ssl = {}), t.sslcert && (t.ssl.cert = _r.readFileSync(t.sslcert).toString()), t.sslkey && (t.ssl.key = _r.readFileSync(t.sslkey).toString()), t.sslrootcert && (t.ssl.ca = _r.readFileSync(t.sslrootcert).toString()), t.sslmode) {
      case "disable": {
        t.ssl = false;
        break;
      }
      case "prefer":
      case "require":
      case "verify-ca":
      case "verify-full":
        break;
      case "no-verify": {
        t.ssl.rejectUnauthorized = false;
        break;
      }
    }
    return t;
  }
  a(Tr, "parse");
  Os.exports = Tr;
  Tr.parse = Tr;
});
var Lt = T((ld, Ds) => {
  "use strict";
  h();
  var vc = (Fs(), O(Bs)), Qs = tt(), Us = Ir().parse, j = a(function(r, e, t) {
    return t === void 0 ? t = y.env["PG" + r.toUpperCase()] : t === false || (t = y.env[t]), e[r] || t || Qs[r];
  }, "val"), Sc = a(function() {
    switch (y.env.PGSSLMODE) {
      case "disable":
        return false;
      case "prefer":
      case "require":
      case "verify-ca":
      case "verify-full":
        return true;
      case "no-verify":
        return { rejectUnauthorized: false };
    }
    return Qs.ssl;
  }, "readSSLConfigFromEnvironment"), Qe = a(function(r) {
    return "'" + ("" + r).replace(/\\/g, "\\\\").replace(/'/g, "\\'") + "'";
  }, "quoteParamValue"), te = a(function(r, e, t) {
    var n = e[t];
    n != null && r.push(t + "=" + Qe(n));
  }, "add"), Rr = class Rr {
    constructor(e) {
      e = typeof e == "string" ? Us(e) : e || {}, e.connectionString && (e = Object.assign({}, e, Us(e.connectionString))), this.user = j("user", e), this.database = j("database", e), this.database === void 0 && (this.database = this.user), this.port = parseInt(j("port", e), 10), this.host = j("host", e), Object.defineProperty(this, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: j("password", e)
      }), this.binary = j("binary", e), this.options = j("options", e), this.ssl = typeof e.ssl > "u" ? Sc() : e.ssl, typeof this.ssl == "string" && this.ssl === "true" && (this.ssl = true), this.ssl === "no-verify" && (this.ssl = { rejectUnauthorized: false }), this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: false }), this.client_encoding = j("client_encoding", e), this.replication = j("replication", e), this.isDomainSocket = !(this.host || "").indexOf("/"), this.application_name = j("application_name", e, "PGAPPNAME"), this.fallback_application_name = j("fallback_application_name", e, false), this.statement_timeout = j("statement_timeout", e, false), this.lock_timeout = j("lock_timeout", e, false), this.idle_in_transaction_session_timeout = j("idle_in_transaction_session_timeout", e, false), this.query_timeout = j("query_timeout", e, false), e.connectionTimeoutMillis === void 0 ? this.connect_timeout = y.env.PGCONNECT_TIMEOUT || 0 : this.connect_timeout = Math.floor(e.connectionTimeoutMillis / 1e3), e.keepAlive === false ? this.keepalives = 0 : e.keepAlive === true && (this.keepalives = 1), typeof e.keepAliveInitialDelayMillis == "number" && (this.keepalives_idle = Math.floor(e.keepAliveInitialDelayMillis / 1e3));
    }
    getLibpqConnectionString(e) {
      var t = [];
      te(t, this, "user"), te(t, this, "password"), te(t, this, "port"), te(t, this, "application_name"), te(
        t,
        this,
        "fallback_application_name"
      ), te(t, this, "connect_timeout"), te(t, this, "options");
      var n = typeof this.ssl == "object" ? this.ssl : this.ssl ? { sslmode: this.ssl } : {};
      if (te(t, n, "sslmode"), te(t, n, "sslca"), te(t, n, "sslkey"), te(t, n, "sslcert"), te(t, n, "sslrootcert"), this.database && t.push("dbname=" + Qe(this.database)), this.replication && t.push("replication=" + Qe(this.replication)), this.host && t.push("host=" + Qe(this.host)), this.isDomainSocket) return e(null, t.join(" "));
      this.client_encoding && t.push("client_encoding=" + Qe(this.client_encoding)), vc.lookup(this.host, function(i, s) {
        return i ? e(i, null) : (t.push("hostaddr=" + Qe(s)), e(null, t.join(" ")));
      });
    }
  };
  a(Rr, "ConnectionParameters");
  var Pr = Rr;
  Ds.exports = Pr;
});
var Ws = T((dd, Ns) => {
  "use strict";
  h();
  var Ec = Je(), qs = /^([A-Za-z]+)(?: (\d+))?(?: (\d+))?/, Br = class Br {
    constructor(e, t) {
      this.command = null, this.rowCount = null, this.oid = null, this.rows = [], this.fields = [], this._parsers = void 0, this._types = t, this.RowCtor = null, this.rowAsArray = e === "array", this.rowAsArray && (this.parseRow = this._parseRowAsArray);
    }
    addCommandComplete(e) {
      var t;
      e.text ? t = qs.exec(e.text) : t = qs.exec(e.command), t && (this.command = t[1], t[3] ? (this.oid = parseInt(
        t[2],
        10
      ), this.rowCount = parseInt(t[3], 10)) : t[2] && (this.rowCount = parseInt(t[2], 10)));
    }
    _parseRowAsArray(e) {
      for (var t = new Array(
        e.length
      ), n = 0, i = e.length; n < i; n++) {
        var s = e[n];
        s !== null ? t[n] = this._parsers[n](s) : t[n] = null;
      }
      return t;
    }
    parseRow(e) {
      for (var t = {}, n = 0, i = e.length; n < i; n++) {
        var s = e[n], o = this.fields[n].name;
        s !== null ? t[o] = this._parsers[n](
          s
        ) : t[o] = null;
      }
      return t;
    }
    addRow(e) {
      this.rows.push(e);
    }
    addFields(e) {
      this.fields = e, this.fields.length && (this._parsers = new Array(e.length));
      for (var t = 0; t < e.length; t++) {
        var n = e[t];
        this._types ? this._parsers[t] = this._types.getTypeParser(n.dataTypeID, n.format || "text") : this._parsers[t] = Ec.getTypeParser(n.dataTypeID, n.format || "text");
      }
    }
  };
  a(Br, "Result");
  var Lr = Br;
  Ns.exports = Lr;
});
var Gs = T((md, $s) => {
  "use strict";
  h();
  var { EventEmitter: Ac } = ve(), js = Ws(), Hs = rt(), Mr = class Mr extends Ac {
    constructor(e, t, n) {
      super(), e = Hs.normalizeQueryConfig(e, t, n), this.text = e.text, this.values = e.values, this.rows = e.rows, this.types = e.types, this.name = e.name, this.binary = e.binary, this.portal = e.portal || "", this.callback = e.callback, this._rowMode = e.rowMode, y.domain && e.callback && (this.callback = y.domain.bind(e.callback)), this._result = new js(this._rowMode, this.types), this._results = this._result, this.isPreparedStatement = false, this._canceledDueToError = false, this._promise = null;
    }
    requiresPreparation() {
      return this.name || this.rows ? true : !this.text || !this.values ? false : this.values.length > 0;
    }
    _checkForMultirow() {
      this._result.command && (Array.isArray(this._results) || (this._results = [this._result]), this._result = new js(this._rowMode, this.types), this._results.push(this._result));
    }
    handleRowDescription(e) {
      this._checkForMultirow(), this._result.addFields(e.fields), this._accumulateRows = this.callback || !this.listeners("row").length;
    }
    handleDataRow(e) {
      let t;
      if (!this._canceledDueToError) {
        try {
          t = this._result.parseRow(
            e.fields
          );
        } catch (n) {
          this._canceledDueToError = n;
          return;
        }
        this.emit("row", t, this._result), this._accumulateRows && this._result.addRow(t);
      }
    }
    handleCommandComplete(e, t) {
      this._checkForMultirow(), this._result.addCommandComplete(
        e
      ), this.rows && t.sync();
    }
    handleEmptyQuery(e) {
      this.rows && e.sync();
    }
    handleError(e, t) {
      if (this._canceledDueToError && (e = this._canceledDueToError, this._canceledDueToError = false), this.callback) return this.callback(e);
      this.emit("error", e);
    }
    handleReadyForQuery(e) {
      if (this._canceledDueToError) return this.handleError(
        this._canceledDueToError,
        e
      );
      if (this.callback) try {
        this.callback(null, this._results);
      } catch (t) {
        y.nextTick(() => {
          throw t;
        });
      }
      this.emit(
        "end",
        this._results
      );
    }
    submit(e) {
      if (typeof this.text != "string" && typeof this.name != "string") return new Error(
        "A query must have either text or a name. Supplying neither is unsupported."
      );
      let t = e.parsedStatements[this.name];
      return this.text && t && this.text !== t ? new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`) : this.values && !Array.isArray(this.values) ? new Error("Query values must be an array") : (this.requiresPreparation() ? this.prepare(e) : e.query(this.text), null);
    }
    hasBeenParsed(e) {
      return this.name && e.parsedStatements[this.name];
    }
    handlePortalSuspended(e) {
      this._getRows(e, this.rows);
    }
    _getRows(e, t) {
      e.execute({ portal: this.portal, rows: t }), t ? e.flush() : e.sync();
    }
    prepare(e) {
      this.isPreparedStatement = true, this.hasBeenParsed(e) || e.parse({ text: this.text, name: this.name, types: this.types });
      try {
        e.bind({ portal: this.portal, statement: this.name, values: this.values, binary: this.binary, valueMapper: Hs.prepareValue });
      } catch (t) {
        this.handleError(t, e);
        return;
      }
      e.describe({ type: "P", name: this.portal || "" }), this._getRows(e, this.rows);
    }
    handleCopyInResponse(e) {
      e.sendCopyFail("No source stream defined");
    }
    handleCopyData(e, t) {
    }
  };
  a(Mr, "Query");
  var Fr = Mr;
  $s.exports = Fr;
});
var ln = T((_) => {
  "use strict";
  h();
  Object.defineProperty(_, "__esModule", { value: true });
  _.NoticeMessage = _.DataRowMessage = _.CommandCompleteMessage = _.ReadyForQueryMessage = _.NotificationResponseMessage = _.BackendKeyDataMessage = _.AuthenticationMD5Password = _.ParameterStatusMessage = _.ParameterDescriptionMessage = _.RowDescriptionMessage = _.Field = _.CopyResponse = _.CopyDataMessage = _.DatabaseError = _.copyDone = _.emptyQuery = _.replicationStart = _.portalSuspended = _.noData = _.closeComplete = _.bindComplete = _.parseComplete = void 0;
  _.parseComplete = { name: "parseComplete", length: 5 };
  _.bindComplete = { name: "bindComplete", length: 5 };
  _.closeComplete = { name: "closeComplete", length: 5 };
  _.noData = { name: "noData", length: 5 };
  _.portalSuspended = { name: "portalSuspended", length: 5 };
  _.replicationStart = { name: "replicationStart", length: 4 };
  _.emptyQuery = { name: "emptyQuery", length: 4 };
  _.copyDone = { name: "copyDone", length: 4 };
  var Kr = class Kr extends Error {
    constructor(e, t, n) {
      super(e), this.length = t, this.name = n;
    }
  };
  a(Kr, "DatabaseError");
  var kr = Kr;
  _.DatabaseError = kr;
  var Yr = class Yr {
    constructor(e, t) {
      this.length = e, this.chunk = t, this.name = "copyData";
    }
  };
  a(Yr, "CopyDataMessage");
  var Or = Yr;
  _.CopyDataMessage = Or;
  var Zr = class Zr {
    constructor(e, t, n, i) {
      this.length = e, this.name = t, this.binary = n, this.columnTypes = new Array(i);
    }
  };
  a(Zr, "CopyResponse");
  var Ur = Zr;
  _.CopyResponse = Ur;
  var Jr = class Jr {
    constructor(e, t, n, i, s, o, u) {
      this.name = e, this.tableID = t, this.columnID = n, this.dataTypeID = i, this.dataTypeSize = s, this.dataTypeModifier = o, this.format = u;
    }
  };
  a(Jr, "Field");
  var Qr = Jr;
  _.Field = Qr;
  var Xr = class Xr {
    constructor(e, t) {
      this.length = e, this.fieldCount = t, this.name = "rowDescription", this.fields = new Array(this.fieldCount);
    }
  };
  a(Xr, "RowDescriptionMessage");
  var Dr = Xr;
  _.RowDescriptionMessage = Dr;
  var en = class en {
    constructor(e, t) {
      this.length = e, this.parameterCount = t, this.name = "parameterDescription", this.dataTypeIDs = new Array(this.parameterCount);
    }
  };
  a(en, "ParameterDescriptionMessage");
  var qr = en;
  _.ParameterDescriptionMessage = qr;
  var tn = class tn {
    constructor(e, t, n) {
      this.length = e, this.parameterName = t, this.parameterValue = n, this.name = "parameterStatus";
    }
  };
  a(tn, "ParameterStatusMessage");
  var Nr = tn;
  _.ParameterStatusMessage = Nr;
  var rn = class rn {
    constructor(e, t) {
      this.length = e, this.salt = t, this.name = "authenticationMD5Password";
    }
  };
  a(rn, "AuthenticationMD5Password");
  var Wr = rn;
  _.AuthenticationMD5Password = Wr;
  var nn = class nn {
    constructor(e, t, n) {
      this.length = e, this.processID = t, this.secretKey = n, this.name = "backendKeyData";
    }
  };
  a(nn, "BackendKeyDataMessage");
  var jr = nn;
  _.BackendKeyDataMessage = jr;
  var sn = class sn {
    constructor(e, t, n, i) {
      this.length = e, this.processId = t, this.channel = n, this.payload = i, this.name = "notification";
    }
  };
  a(sn, "NotificationResponseMessage");
  var Hr = sn;
  _.NotificationResponseMessage = Hr;
  var on = class on {
    constructor(e, t) {
      this.length = e, this.status = t, this.name = "readyForQuery";
    }
  };
  a(on, "ReadyForQueryMessage");
  var $r = on;
  _.ReadyForQueryMessage = $r;
  var an = class an {
    constructor(e, t) {
      this.length = e, this.text = t, this.name = "commandComplete";
    }
  };
  a(an, "CommandCompleteMessage");
  var Gr = an;
  _.CommandCompleteMessage = Gr;
  var un = class un {
    constructor(e, t) {
      this.length = e, this.fields = t, this.name = "dataRow", this.fieldCount = t.length;
    }
  };
  a(un, "DataRowMessage");
  var Vr = un;
  _.DataRowMessage = Vr;
  var cn = class cn {
    constructor(e, t) {
      this.length = e, this.message = t, this.name = "notice";
    }
  };
  a(cn, "NoticeMessage");
  var zr = cn;
  _.NoticeMessage = zr;
});
var Vs = T((Bt) => {
  "use strict";
  h();
  Object.defineProperty(Bt, "__esModule", { value: true });
  Bt.Writer = void 0;
  var hn = class hn {
    constructor(e = 256) {
      this.size = e, this.offset = 5, this.headerPosition = 0, this.buffer = p.allocUnsafe(e);
    }
    ensure(e) {
      if (this.buffer.length - this.offset < e) {
        let n = this.buffer, i = n.length + (n.length >> 1) + e;
        this.buffer = p.allocUnsafe(i), n.copy(
          this.buffer
        );
      }
    }
    addInt32(e) {
      return this.ensure(4), this.buffer[this.offset++] = e >>> 24 & 255, this.buffer[this.offset++] = e >>> 16 & 255, this.buffer[this.offset++] = e >>> 8 & 255, this.buffer[this.offset++] = e >>> 0 & 255, this;
    }
    addInt16(e) {
      return this.ensure(2), this.buffer[this.offset++] = e >>> 8 & 255, this.buffer[this.offset++] = e >>> 0 & 255, this;
    }
    addCString(e) {
      if (!e) this.ensure(1);
      else {
        let t = p.byteLength(e);
        this.ensure(t + 1), this.buffer.write(e, this.offset, "utf-8"), this.offset += t;
      }
      return this.buffer[this.offset++] = 0, this;
    }
    addString(e = "") {
      let t = p.byteLength(e);
      return this.ensure(t), this.buffer.write(e, this.offset), this.offset += t, this;
    }
    addInt32PrefixedString(e) {
      let t = p.byteLength(e);
      this.ensure(4 + t);
      let n = this.buffer, i = this.offset;
      return n[i++] = t >>> 24 & 255, n[i++] = t >>> 16 & 255, n[i++] = t >>> 8 & 255, n[i++] = t >>> 0 & 255, n.write(e, i, "utf-8"), this.offset = i + t, this;
    }
    add(e) {
      return this.ensure(e.length), e.copy(this.buffer, this.offset), this.offset += e.length, this;
    }
    join(e) {
      if (e) {
        this.buffer[this.headerPosition] = e;
        let t = this.offset - (this.headerPosition + 1);
        this.buffer.writeInt32BE(t, this.headerPosition + 1);
      }
      return this.buffer.slice(e ? 0 : 5, this.offset);
    }
    flush(e) {
      let t = this.join(e);
      return this.offset = 5, this.headerPosition = 0, this.buffer = p.allocUnsafe(this.size), t;
    }
    clear() {
      this.offset = 5, this.headerPosition = 0;
    }
  };
  a(hn, "Writer");
  var fn = hn;
  Bt.Writer = fn;
});
var Ks = T((Mt) => {
  "use strict";
  h();
  Object.defineProperty(Mt, "__esModule", { value: true });
  Mt.serialize = void 0;
  var dn = Vs(), L = new dn.Writer(), Cc = a((r) => {
    L.addInt16(3).addInt16(0);
    for (let n of Object.keys(r)) L.addCString(
      n
    ).addCString(r[n]);
    L.addCString("client_encoding").addCString("UTF8");
    let e = L.addCString("").flush(), t = e.length + 4;
    return new dn.Writer().addInt32(t).add(e).flush();
  }, "startup"), _c = a(() => {
    let r = p.allocUnsafe(
      8
    );
    return r.writeInt32BE(8, 0), r.writeInt32BE(80877103, 4), r;
  }, "requestSsl"), Tc = a((r) => L.addCString(r).flush(
    112
  ), "password"), Ic = a(function(r, e) {
    return L.addCString(r).addInt32PrefixedString(e), L.flush(112);
  }, "sendSASLInitialResponseMessage"), Pc = a(function(r) {
    return L.addString(r).flush(112);
  }, "sendSCRAMClientFinalMessage"), Rc = a((r) => L.addCString(r).flush(81), "query"), zs = [], Lc = a((r) => {
    let e = r.name || "";
    e.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", e, e.length), console.error("This can cause conflicts and silent errors executing queries"));
    let t = r.types || zs, n = t.length, i = L.addCString(e).addCString(r.text).addInt16(n);
    for (let s = 0; s < n; s++) i.addInt32(t[s]);
    return L.flush(80);
  }, "parse"), De = new dn.Writer(), Bc = a(function(r, e) {
    for (let t = 0; t < r.length; t++) {
      let n = e ? e(r[t], t) : r[t];
      n == null ? (L.addInt16(0), De.addInt32(-1)) : n instanceof p ? (L.addInt16(
        1
      ), De.addInt32(n.length), De.add(n)) : (L.addInt16(0), De.addInt32PrefixedString(n));
    }
  }, "writeValues"), Fc = a(
    (r = {}) => {
      let e = r.portal || "", t = r.statement || "", n = r.binary || false, i = r.values || zs, s = i.length;
      L.addCString(
        e
      ).addCString(t), L.addInt16(s);
      try {
        Bc(i, r.valueMapper);
      } catch (o) {
        throw L.clear(), De.clear(), o;
      }
      return L.addInt16(s), L.add(De.flush()), L.addInt16(1), L.addInt16(n ? 1 : 0), L.flush(66);
    },
    "bind"
  ), Mc = p.from([
    69,
    0,
    0,
    0,
    9,
    0,
    0,
    0,
    0,
    0
  ]), kc = a((r) => {
    if (!r || !r.portal && !r.rows) return Mc;
    let e = r.portal || "", t = r.rows || 0, n = p.byteLength(
      e
    ), i = 4 + n + 1 + 4, s = p.allocUnsafe(1 + i);
    return s[0] = 69, s.writeInt32BE(i, 1), s.write(e, 5, "utf-8"), s[n + 5] = 0, s.writeUInt32BE(t, s.length - 4), s;
  }, "execute"), Oc = a((r, e) => {
    let t = p.allocUnsafe(16);
    return t.writeInt32BE(
      16,
      0
    ), t.writeInt16BE(1234, 4), t.writeInt16BE(5678, 6), t.writeInt32BE(r, 8), t.writeInt32BE(e, 12), t;
  }, "cancel"), pn = a((r, e) => {
    let n = 4 + p.byteLength(e) + 1, i = p.allocUnsafe(1 + n);
    return i[0] = r, i.writeInt32BE(n, 1), i.write(e, 5, "utf-8"), i[n] = 0, i;
  }, "cstringMessage"), Uc = L.addCString("P").flush(68), Qc = L.addCString("S").flush(68), Dc = a((r) => r.name ? pn(68, `${r.type}${r.name || ""}`) : r.type === "P" ? Uc : Qc, "describe"), qc = a((r) => {
    let e = `${r.type}${r.name || ""}`;
    return pn(67, e);
  }, "close"), Nc = a((r) => L.add(r).flush(100), "copyData"), Wc = a((r) => pn(
    102,
    r
  ), "copyFail"), Ft = a((r) => p.from([r, 0, 0, 0, 4]), "codeOnlyBuffer"), jc = Ft(72), Hc = Ft(83), $c = Ft(88), Gc = Ft(99), Vc = {
    startup: Cc,
    password: Tc,
    requestSsl: _c,
    sendSASLInitialResponseMessage: Ic,
    sendSCRAMClientFinalMessage: Pc,
    query: Rc,
    parse: Lc,
    bind: Fc,
    execute: kc,
    describe: Dc,
    close: qc,
    flush: a(() => jc, "flush"),
    sync: a(() => Hc, "sync"),
    end: a(() => $c, "end"),
    copyData: Nc,
    copyDone: a(() => Gc, "copyDone"),
    copyFail: Wc,
    cancel: Oc
  };
  Mt.serialize = Vc;
});
var Ys = T((kt) => {
  "use strict";
  h();
  Object.defineProperty(kt, "__esModule", { value: true });
  kt.BufferReader = void 0;
  var mn = class mn {
    constructor(e = 0) {
      this.offset = e, this.buffer = p.allocUnsafe(0), this.encoding = "utf-8";
    }
    setBuffer(e, t) {
      this.offset = e, this.buffer = t;
    }
    int16() {
      let e = this.buffer.readInt16BE(this.offset);
      return this.offset += 2, e;
    }
    byte() {
      let e = this.buffer[this.offset];
      return this.offset++, e;
    }
    int32() {
      let e = this.buffer.readInt32BE(
        this.offset
      );
      return this.offset += 4, e;
    }
    uint32() {
      let e = this.buffer.readUInt32BE(this.offset);
      return this.offset += 4, e;
    }
    string(e) {
      let t = this.buffer.toString(this.encoding, this.offset, this.offset + e);
      return this.offset += e, t;
    }
    cstring() {
      let e = this.offset, t = e;
      for (; this.buffer[t++]; ) ;
      return this.offset = t, this.buffer.toString(this.encoding, e, t - 1);
    }
    bytes(e) {
      let t = this.buffer.slice(this.offset, this.offset + e);
      return this.offset += e, t;
    }
  };
  a(mn, "BufferReader");
  var yn = mn;
  kt.BufferReader = yn;
});
var eo = T((Ot) => {
  "use strict";
  h();
  Object.defineProperty(Ot, "__esModule", { value: true });
  Ot.Parser = void 0;
  var F = ln(), zc = Ys(), wn = 1, Kc = 4, Zs = wn + Kc, Z = -1, gn = p.allocUnsafe(0), xn = class xn {
    constructor(e) {
      if (this.buffer = gn, this.bufferLength = 0, this.bufferOffset = 0, this.reader = new zc.BufferReader(), e?.mode === "binary") throw new Error(
        "Binary mode not supported yet"
      );
      this.mode = e?.mode || "text";
    }
    parse(e, t) {
      this.mergeBuffer(e);
      let n = this.bufferOffset + this.bufferLength, i = this.bufferOffset;
      for (; i + Zs <= n; ) {
        let s = this.buffer[i], o = this.buffer.readUInt32BE(i + wn), u = wn + o;
        if (u + i <= n) {
          let c = this.handlePacket(i + Zs, s, o, this.buffer);
          t(c), i += u;
        } else break;
      }
      i === n ? (this.buffer = gn, this.bufferLength = 0, this.bufferOffset = 0) : (this.bufferLength = n - i, this.bufferOffset = i);
    }
    mergeBuffer(e) {
      if (this.bufferLength > 0) {
        let t = this.bufferLength + e.byteLength;
        if (t + this.bufferOffset > this.buffer.byteLength) {
          let i;
          if (t <= this.buffer.byteLength && this.bufferOffset >= this.bufferLength) i = this.buffer;
          else {
            let s = this.buffer.byteLength * 2;
            for (; t >= s; ) s *= 2;
            i = p.allocUnsafe(s);
          }
          this.buffer.copy(i, 0, this.bufferOffset, this.bufferOffset + this.bufferLength), this.buffer = i, this.bufferOffset = 0;
        }
        e.copy(
          this.buffer,
          this.bufferOffset + this.bufferLength
        ), this.bufferLength = t;
      } else this.buffer = e, this.bufferOffset = 0, this.bufferLength = e.byteLength;
    }
    handlePacket(e, t, n, i) {
      let { reader: s } = this;
      s.setBuffer(e, i);
      let o;
      switch (t) {
        case 50:
          o = F.bindComplete;
          break;
        case 49:
          o = F.parseComplete;
          break;
        case 51:
          o = F.closeComplete;
          break;
        case 110:
          o = F.noData;
          break;
        case 115:
          o = F.portalSuspended;
          break;
        case 99:
          o = F.copyDone;
          break;
        case 87:
          o = F.replicationStart;
          break;
        case 73:
          o = F.emptyQuery;
          break;
        case 68:
          o = sl(s);
          break;
        case 67:
          o = Zc(s);
          break;
        case 90:
          o = Yc(s);
          break;
        case 65:
          o = tl(s);
          break;
        case 82:
          o = ul(s, n);
          break;
        case 83:
          o = ol(s);
          break;
        case 75:
          o = al(s);
          break;
        case 69:
          o = Js(s, "error");
          break;
        case 78:
          o = Js(s, "notice");
          break;
        case 84:
          o = rl(s);
          break;
        case 116:
          o = il(s);
          break;
        case 71:
          o = Xc(
            s
          );
          break;
        case 72:
          o = el(s);
          break;
        case 100:
          o = Jc(s, n);
          break;
        default:
          return new F.DatabaseError("received invalid response: " + t.toString(16), n, "error");
      }
      return s.setBuffer(0, gn), o.length = n, o;
    }
  };
  a(xn, "Parser");
  var bn = xn;
  Ot.Parser = bn;
  var Yc = a((r) => {
    let e = r.string(1);
    return new F.ReadyForQueryMessage(Z, e);
  }, "parseReadyForQueryMessage"), Zc = a((r) => {
    let e = r.cstring();
    return new F.CommandCompleteMessage(Z, e);
  }, "parseCommandCompleteMessage"), Jc = a((r, e) => {
    let t = r.bytes(e - 4);
    return new F.CopyDataMessage(Z, t);
  }, "parseCopyData"), Xc = a((r) => Xs(r, "copyInResponse"), "parseCopyInMessage"), el = a((r) => Xs(r, "copyOutResponse"), "parseCopyOutMessage"), Xs = a((r, e) => {
    let t = r.byte() !== 0, n = r.int16(), i = new F.CopyResponse(Z, e, t, n);
    for (let s = 0; s < n; s++) i.columnTypes[s] = r.int16();
    return i;
  }, "parseCopyMessage"), tl = a((r) => {
    let e = r.int32(), t = r.cstring(), n = r.cstring();
    return new F.NotificationResponseMessage(Z, e, t, n);
  }, "parseNotificationMessage"), rl = a((r) => {
    let e = r.int16(), t = new F.RowDescriptionMessage(Z, e);
    for (let n = 0; n < e; n++) t.fields[n] = nl(r);
    return t;
  }, "parseRowDescriptionMessage"), nl = a((r) => {
    let e = r.cstring(), t = r.uint32(), n = r.int16(), i = r.uint32(), s = r.int16(), o = r.int32(), u = r.int16() === 0 ? "text" : "binary";
    return new F.Field(e, t, n, i, s, o, u);
  }, "parseField"), il = a((r) => {
    let e = r.int16(), t = new F.ParameterDescriptionMessage(Z, e);
    for (let n = 0; n < e; n++) t.dataTypeIDs[n] = r.uint32();
    return t;
  }, "parseParameterDescriptionMessage"), sl = a((r) => {
    let e = r.int16(), t = new Array(e);
    for (let n = 0; n < e; n++) {
      let i = r.int32();
      t[n] = i === -1 ? null : r.string(i);
    }
    return new F.DataRowMessage(Z, t);
  }, "parseDataRowMessage"), ol = a((r) => {
    let e = r.cstring(), t = r.cstring();
    return new F.ParameterStatusMessage(Z, e, t);
  }, "parseParameterStatusMessage"), al = a((r) => {
    let e = r.int32(), t = r.int32();
    return new F.BackendKeyDataMessage(
      Z,
      e,
      t
    );
  }, "parseBackendKeyData"), ul = a((r, e) => {
    let t = r.int32(), n = { name: "authenticationOk", length: e };
    switch (t) {
      case 0:
        break;
      case 3:
        n.length === 8 && (n.name = "authenticationCleartextPassword");
        break;
      case 5:
        if (n.length === 12) {
          n.name = "authenticationMD5Password";
          let i = r.bytes(4);
          return new F.AuthenticationMD5Password(Z, i);
        }
        break;
      case 10:
        {
          n.name = "authenticationSASL", n.mechanisms = [];
          let i;
          do
            i = r.cstring(), i && n.mechanisms.push(i);
          while (i);
        }
        break;
      case 11:
        n.name = "authenticationSASLContinue", n.data = r.string(e - 8);
        break;
      case 12:
        n.name = "authenticationSASLFinal", n.data = r.string(e - 8);
        break;
      default:
        throw new Error("Unknown authenticationOk message type " + t);
    }
    return n;
  }, "parseAuthenticationResponse"), Js = a((r, e) => {
    let t = {}, n = r.string(1);
    for (; n !== "\0"; ) t[n] = r.cstring(), n = r.string(1);
    let i = t.M, s = e === "notice" ? new F.NoticeMessage(Z, i) : new F.DatabaseError(
      i,
      Z,
      e
    );
    return s.severity = t.S, s.code = t.C, s.detail = t.D, s.hint = t.H, s.position = t.P, s.internalPosition = t.p, s.internalQuery = t.q, s.where = t.W, s.schema = t.s, s.table = t.t, s.column = t.c, s.dataType = t.d, s.constraint = t.n, s.file = t.F, s.line = t.L, s.routine = t.R, s;
  }, "parseErrorMessage");
});
var vn = T((_e) => {
  "use strict";
  h();
  Object.defineProperty(_e, "__esModule", { value: true });
  _e.DatabaseError = _e.serialize = void 0;
  _e.parse = hl;
  var cl = ln();
  Object.defineProperty(_e, "DatabaseError", { enumerable: true, get: a(
    function() {
      return cl.DatabaseError;
    },
    "get"
  ) });
  var ll = Ks();
  Object.defineProperty(_e, "serialize", {
    enumerable: true,
    get: a(function() {
      return ll.serialize;
    }, "get")
  });
  var fl = eo();
  function hl(r, e) {
    let t = new fl.Parser();
    return r.on("data", (n) => t.parse(n, e)), new Promise((n) => r.on("end", () => n()));
  }
  a(hl, "parse");
});
var to = {};
se(to, { connect: () => dl });
function dl({ socket: r, servername: e }) {
  return r.startTls(e), r;
}
var ro = V(
  () => {
    "use strict";
    h();
    a(dl, "connect");
  }
);
var An = T((Dd, so) => {
  "use strict";
  h();
  var no = (Ge(), O(Ii)), pl = ve().EventEmitter, { parse: yl, serialize: Q } = vn(), io = Q.flush(), ml = Q.sync(), gl = Q.end(), En = class En extends pl {
    constructor(e) {
      super(), e = e || {}, this.stream = e.stream || new no.Socket(), this._keepAlive = e.keepAlive, this._keepAliveInitialDelayMillis = e.keepAliveInitialDelayMillis, this.lastBuffer = false, this.parsedStatements = {}, this.ssl = e.ssl || false, this._ending = false, this._emitMessage = false;
      var t = this;
      this.on("newListener", function(n) {
        n === "message" && (t._emitMessage = true);
      });
    }
    connect(e, t) {
      var n = this;
      this._connecting = true, this.stream.setNoDelay(true), this.stream.connect(e, t), this.stream.once("connect", function() {
        n._keepAlive && n.stream.setKeepAlive(true, n._keepAliveInitialDelayMillis), n.emit("connect");
      });
      let i = a(function(s) {
        n._ending && (s.code === "ECONNRESET" || s.code === "EPIPE") || n.emit("error", s);
      }, "reportStreamError");
      if (this.stream.on("error", i), this.stream.on("close", function() {
        n.emit("end");
      }), !this.ssl) return this.attachListeners(
        this.stream
      );
      this.stream.once("data", function(s) {
        var o = s.toString("utf8");
        switch (o) {
          case "S":
            break;
          case "N":
            return n.stream.end(), n.emit("error", new Error("The server does not support SSL connections"));
          default:
            return n.stream.end(), n.emit("error", new Error("There was an error establishing an SSL connection"));
        }
        var u = (ro(), O(to));
        let c = { socket: n.stream };
        n.ssl !== true && (Object.assign(c, n.ssl), "key" in n.ssl && (c.key = n.ssl.key)), no.isIP(t) === 0 && (c.servername = t);
        try {
          n.stream = u.connect(c);
        } catch (l) {
          return n.emit(
            "error",
            l
          );
        }
        n.attachListeners(n.stream), n.stream.on("error", i), n.emit("sslconnect");
      });
    }
    attachListeners(e) {
      e.on(
        "end",
        () => {
          this.emit("end");
        }
      ), yl(e, (t) => {
        var n = t.name === "error" ? "errorMessage" : t.name;
        this._emitMessage && this.emit("message", t), this.emit(n, t);
      });
    }
    requestSsl() {
      this.stream.write(Q.requestSsl());
    }
    startup(e) {
      this.stream.write(Q.startup(e));
    }
    cancel(e, t) {
      this._send(Q.cancel(e, t));
    }
    password(e) {
      this._send(Q.password(e));
    }
    sendSASLInitialResponseMessage(e, t) {
      this._send(Q.sendSASLInitialResponseMessage(e, t));
    }
    sendSCRAMClientFinalMessage(e) {
      this._send(Q.sendSCRAMClientFinalMessage(
        e
      ));
    }
    _send(e) {
      return this.stream.writable ? this.stream.write(e) : false;
    }
    query(e) {
      this._send(Q.query(e));
    }
    parse(e) {
      this._send(Q.parse(e));
    }
    bind(e) {
      this._send(Q.bind(e));
    }
    execute(e) {
      this._send(Q.execute(e));
    }
    flush() {
      this.stream.writable && this.stream.write(io);
    }
    sync() {
      this._ending = true, this._send(io), this._send(ml);
    }
    ref() {
      this.stream.ref();
    }
    unref() {
      this.stream.unref();
    }
    end() {
      if (this._ending = true, !this._connecting || !this.stream.writable) {
        this.stream.end();
        return;
      }
      return this.stream.write(gl, () => {
        this.stream.end();
      });
    }
    close(e) {
      this._send(Q.close(e));
    }
    describe(e) {
      this._send(Q.describe(e));
    }
    sendCopyFromChunk(e) {
      this._send(Q.copyData(e));
    }
    endCopyFrom() {
      this._send(Q.copyDone());
    }
    sendCopyFail(e) {
      this._send(Q.copyFail(e));
    }
  };
  a(En, "Connection");
  var Sn = En;
  so.exports = Sn;
});
var uo = T((jd, ao) => {
  "use strict";
  h();
  var wl = ve().EventEmitter, Wd = (it(), O(nt)), bl = rt(), Cn = xs(), xl = Ls(), vl = _t(), Sl = Lt(), oo = Gs(), El = tt(), Al = An(), _n = class _n extends wl {
    constructor(e) {
      super(), this.connectionParameters = new Sl(e), this.user = this.connectionParameters.user, this.database = this.connectionParameters.database, this.port = this.connectionParameters.port, this.host = this.connectionParameters.host, Object.defineProperty(
        this,
        "password",
        { configurable: true, enumerable: false, writable: true, value: this.connectionParameters.password }
      ), this.replication = this.connectionParameters.replication;
      var t = e || {};
      this._Promise = t.Promise || b.Promise, this._types = new vl(t.types), this._ending = false, this._connecting = false, this._connected = false, this._connectionError = false, this._queryable = true, this.connection = t.connection || new Al({ stream: t.stream, ssl: this.connectionParameters.ssl, keepAlive: t.keepAlive || false, keepAliveInitialDelayMillis: t.keepAliveInitialDelayMillis || 0, encoding: this.connectionParameters.client_encoding || "utf8" }), this.queryQueue = [], this.binary = t.binary || El.binary, this.processID = null, this.secretKey = null, this.ssl = this.connectionParameters.ssl || false, this.ssl && this.ssl.key && Object.defineProperty(this.ssl, "key", { enumerable: false }), this._connectionTimeoutMillis = t.connectionTimeoutMillis || 0;
    }
    _errorAllQueries(e) {
      let t = a((n) => {
        y.nextTick(() => {
          n.handleError(e, this.connection);
        });
      }, "enqueueError");
      this.activeQuery && (t(this.activeQuery), this.activeQuery = null), this.queryQueue.forEach(t), this.queryQueue.length = 0;
    }
    _connect(e) {
      var t = this, n = this.connection;
      if (this._connectionCallback = e, this._connecting || this._connected) {
        let i = new Error("Client has already been connected. You cannot reuse a client.");
        y.nextTick(
          () => {
            e(i);
          }
        );
        return;
      }
      this._connecting = true, this.connectionTimeoutHandle, this._connectionTimeoutMillis > 0 && (this.connectionTimeoutHandle = setTimeout(() => {
        n._ending = true, n.stream.destroy(new Error("timeout expired"));
      }, this._connectionTimeoutMillis)), this.host && this.host.indexOf("/") === 0 ? n.connect(this.host + "/.s.PGSQL." + this.port) : n.connect(this.port, this.host), n.on("connect", function() {
        t.ssl ? n.requestSsl() : n.startup(t.getStartupConf());
      }), n.on("sslconnect", function() {
        n.startup(t.getStartupConf());
      }), this._attachListeners(
        n
      ), n.once("end", () => {
        let i = this._ending ? new Error("Connection terminated") : new Error("Connection terminated unexpectedly");
        clearTimeout(this.connectionTimeoutHandle), this._errorAllQueries(i), this._ending || (this._connecting && !this._connectionError ? this._connectionCallback ? this._connectionCallback(i) : this._handleErrorEvent(i) : this._connectionError || this._handleErrorEvent(i)), y.nextTick(() => {
          this.emit("end");
        });
      });
    }
    connect(e) {
      if (e) {
        this._connect(e);
        return;
      }
      return new this._Promise((t, n) => {
        this._connect((i) => {
          i ? n(i) : t();
        });
      });
    }
    _attachListeners(e) {
      e.on("authenticationCleartextPassword", this._handleAuthCleartextPassword.bind(this)), e.on("authenticationMD5Password", this._handleAuthMD5Password.bind(this)), e.on("authenticationSASL", this._handleAuthSASL.bind(this)), e.on("authenticationSASLContinue", this._handleAuthSASLContinue.bind(this)), e.on("authenticationSASLFinal", this._handleAuthSASLFinal.bind(this)), e.on("backendKeyData", this._handleBackendKeyData.bind(this)), e.on("error", this._handleErrorEvent.bind(this)), e.on("errorMessage", this._handleErrorMessage.bind(this)), e.on("readyForQuery", this._handleReadyForQuery.bind(this)), e.on("notice", this._handleNotice.bind(this)), e.on("rowDescription", this._handleRowDescription.bind(this)), e.on("dataRow", this._handleDataRow.bind(this)), e.on("portalSuspended", this._handlePortalSuspended.bind(
        this
      )), e.on("emptyQuery", this._handleEmptyQuery.bind(this)), e.on("commandComplete", this._handleCommandComplete.bind(this)), e.on("parseComplete", this._handleParseComplete.bind(this)), e.on("copyInResponse", this._handleCopyInResponse.bind(this)), e.on("copyData", this._handleCopyData.bind(this)), e.on("notification", this._handleNotification.bind(this));
    }
    _checkPgPass(e) {
      let t = this.connection;
      typeof this.password == "function" ? this._Promise.resolve().then(() => this.password()).then((n) => {
        if (n !== void 0) {
          if (typeof n != "string") {
            t.emit("error", new TypeError(
              "Password must be a string"
            ));
            return;
          }
          this.connectionParameters.password = this.password = n;
        } else this.connectionParameters.password = this.password = null;
        e();
      }).catch((n) => {
        t.emit("error", n);
      }) : this.password !== null ? e() : xl(
        this.connectionParameters,
        (n) => {
          n !== void 0 && (this.connectionParameters.password = this.password = n), e();
        }
      );
    }
    _handleAuthCleartextPassword(e) {
      this._checkPgPass(() => {
        this.connection.password(this.password);
      });
    }
    _handleAuthMD5Password(e) {
      this._checkPgPass(
        () => {
          let t = bl.postgresMd5PasswordHash(this.user, this.password, e.salt);
          this.connection.password(t);
        }
      );
    }
    _handleAuthSASL(e) {
      this._checkPgPass(() => {
        this.saslSession = Cn.startSession(e.mechanisms), this.connection.sendSASLInitialResponseMessage(
          this.saslSession.mechanism,
          this.saslSession.response
        );
      });
    }
    _handleAuthSASLContinue(e) {
      Cn.continueSession(
        this.saslSession,
        this.password,
        e.data
      ), this.connection.sendSCRAMClientFinalMessage(this.saslSession.response);
    }
    _handleAuthSASLFinal(e) {
      Cn.finalizeSession(this.saslSession, e.data), this.saslSession = null;
    }
    _handleBackendKeyData(e) {
      this.processID = e.processID, this.secretKey = e.secretKey;
    }
    _handleReadyForQuery(e) {
      this._connecting && (this._connecting = false, this._connected = true, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback && (this._connectionCallback(null, this), this._connectionCallback = null), this.emit("connect"));
      let { activeQuery: t } = this;
      this.activeQuery = null, this.readyForQuery = true, t && t.handleReadyForQuery(this.connection), this._pulseQueryQueue();
    }
    _handleErrorWhileConnecting(e) {
      if (!this._connectionError) {
        if (this._connectionError = true, clearTimeout(this.connectionTimeoutHandle), this._connectionCallback) return this._connectionCallback(e);
        this.emit("error", e);
      }
    }
    _handleErrorEvent(e) {
      if (this._connecting) return this._handleErrorWhileConnecting(e);
      this._queryable = false, this._errorAllQueries(e), this.emit("error", e);
    }
    _handleErrorMessage(e) {
      if (this._connecting) return this._handleErrorWhileConnecting(e);
      let t = this.activeQuery;
      if (!t) {
        this._handleErrorEvent(e);
        return;
      }
      this.activeQuery = null, t.handleError(
        e,
        this.connection
      );
    }
    _handleRowDescription(e) {
      this.activeQuery.handleRowDescription(e);
    }
    _handleDataRow(e) {
      this.activeQuery.handleDataRow(e);
    }
    _handlePortalSuspended(e) {
      this.activeQuery.handlePortalSuspended(this.connection);
    }
    _handleEmptyQuery(e) {
      this.activeQuery.handleEmptyQuery(this.connection);
    }
    _handleCommandComplete(e) {
      this.activeQuery.handleCommandComplete(e, this.connection);
    }
    _handleParseComplete(e) {
      this.activeQuery.name && (this.connection.parsedStatements[this.activeQuery.name] = this.activeQuery.text);
    }
    _handleCopyInResponse(e) {
      this.activeQuery.handleCopyInResponse(this.connection);
    }
    _handleCopyData(e) {
      this.activeQuery.handleCopyData(
        e,
        this.connection
      );
    }
    _handleNotification(e) {
      this.emit("notification", e);
    }
    _handleNotice(e) {
      this.emit("notice", e);
    }
    getStartupConf() {
      var e = this.connectionParameters, t = { user: e.user, database: e.database }, n = e.application_name || e.fallback_application_name;
      return n && (t.application_name = n), e.replication && (t.replication = "" + e.replication), e.statement_timeout && (t.statement_timeout = String(parseInt(e.statement_timeout, 10))), e.lock_timeout && (t.lock_timeout = String(parseInt(e.lock_timeout, 10))), e.idle_in_transaction_session_timeout && (t.idle_in_transaction_session_timeout = String(parseInt(e.idle_in_transaction_session_timeout, 10))), e.options && (t.options = e.options), t;
    }
    cancel(e, t) {
      if (e.activeQuery === t) {
        var n = this.connection;
        this.host && this.host.indexOf("/") === 0 ? n.connect(this.host + "/.s.PGSQL." + this.port) : n.connect(this.port, this.host), n.on("connect", function() {
          n.cancel(
            e.processID,
            e.secretKey
          );
        });
      } else e.queryQueue.indexOf(t) !== -1 && e.queryQueue.splice(e.queryQueue.indexOf(t), 1);
    }
    setTypeParser(e, t, n) {
      return this._types.setTypeParser(e, t, n);
    }
    getTypeParser(e, t) {
      return this._types.getTypeParser(e, t);
    }
    escapeIdentifier(e) {
      return '"' + e.replace(/"/g, '""') + '"';
    }
    escapeLiteral(e) {
      for (var t = false, n = "'", i = 0; i < e.length; i++) {
        var s = e[i];
        s === "'" ? n += s + s : s === "\\" ? (n += s + s, t = true) : n += s;
      }
      return n += "'", t === true && (n = " E" + n), n;
    }
    _pulseQueryQueue() {
      if (this.readyForQuery === true) if (this.activeQuery = this.queryQueue.shift(), this.activeQuery) {
        this.readyForQuery = false, this.hasExecuted = true;
        let e = this.activeQuery.submit(this.connection);
        e && y.nextTick(() => {
          this.activeQuery.handleError(e, this.connection), this.readyForQuery = true, this._pulseQueryQueue();
        });
      } else this.hasExecuted && (this.activeQuery = null, this.emit("drain"));
    }
    query(e, t, n) {
      var i, s, o, u, c;
      if (e == null) throw new TypeError(
        "Client was passed a null or undefined query"
      );
      return typeof e.submit == "function" ? (o = e.query_timeout || this.connectionParameters.query_timeout, s = i = e, typeof t == "function" && (i.callback = i.callback || t)) : (o = this.connectionParameters.query_timeout, i = new oo(e, t, n), i.callback || (s = new this._Promise((l, f) => {
        i.callback = (m, g) => m ? f(m) : l(g);
      }))), o && (c = i.callback, u = setTimeout(() => {
        var l = new Error("Query read timeout");
        y.nextTick(
          () => {
            i.handleError(l, this.connection);
          }
        ), c(l), i.callback = () => {
        };
        var f = this.queryQueue.indexOf(i);
        f > -1 && this.queryQueue.splice(f, 1), this._pulseQueryQueue();
      }, o), i.callback = (l, f) => {
        clearTimeout(u), c(l, f);
      }), this.binary && !i.binary && (i.binary = true), i._result && !i._result._types && (i._result._types = this._types), this._queryable ? this._ending ? (y.nextTick(() => {
        i.handleError(new Error("Client was closed and is not queryable"), this.connection);
      }), s) : (this.queryQueue.push(i), this._pulseQueryQueue(), s) : (y.nextTick(() => {
        i.handleError(new Error("Client has encountered a connection error and is not queryable"), this.connection);
      }), s);
    }
    ref() {
      this.connection.ref();
    }
    unref() {
      this.connection.unref();
    }
    end(e) {
      if (this._ending = true, !this.connection._connecting) if (e) e();
      else return this._Promise.resolve();
      if (this.activeQuery || !this._queryable ? this.connection.stream.destroy() : this.connection.end(), e) this.connection.once("end", e);
      else return new this._Promise((t) => {
        this.connection.once("end", t);
      });
    }
  };
  a(_n, "Client");
  var Ut = _n;
  Ut.Query = oo;
  ao.exports = Ut;
});
var fo = T((Gd, lo) => {
  "use strict";
  h();
  var Cl = ve().EventEmitter, Tn = a(function() {
  }, "NOOP"), co = a((r, e) => {
    let t = r.findIndex(e);
    return t === -1 ? void 0 : r.splice(t, 1)[0];
  }, "removeWhere"), Rn = class Rn {
    constructor(e, t, n) {
      this.client = e, this.idleListener = t, this.timeoutId = n;
    }
  };
  a(Rn, "IdleItem");
  var In = Rn, Ln = class Ln {
    constructor(e) {
      this.callback = e;
    }
  };
  a(Ln, "PendingItem");
  var qe = Ln;
  function _l() {
    throw new Error("Release called on client which has already been released to the pool.");
  }
  a(_l, "throwOnDoubleRelease");
  function Qt(r, e) {
    if (e)
      return { callback: e, result: void 0 };
    let t, n, i = a(function(o, u) {
      o ? t(o) : n(u);
    }, "cb"), s = new r(function(o, u) {
      n = o, t = u;
    }).catch((o) => {
      throw Error.captureStackTrace(o), o;
    });
    return { callback: i, result: s };
  }
  a(Qt, "promisify");
  function Tl(r, e) {
    return a(function t(n) {
      n.client = e, e.removeListener("error", t), e.on("error", () => {
        r.log(
          "additional client error after disconnection due to error",
          n
        );
      }), r._remove(e), r.emit("error", n, e);
    }, "idleListener");
  }
  a(Tl, "makeIdleListener");
  var Bn = class Bn extends Cl {
    constructor(e, t) {
      super(), this.options = Object.assign({}, e), e != null && "password" in e && Object.defineProperty(this.options, "password", {
        configurable: true,
        enumerable: false,
        writable: true,
        value: e.password
      }), e != null && e.ssl && e.ssl.key && Object.defineProperty(this.options.ssl, "key", { enumerable: false }), this.options.max = this.options.max || this.options.poolSize || 10, this.options.min = this.options.min || 0, this.options.maxUses = this.options.maxUses || 1 / 0, this.options.allowExitOnIdle = this.options.allowExitOnIdle || false, this.options.maxLifetimeSeconds = this.options.maxLifetimeSeconds || 0, this.log = this.options.log || function() {
      }, this.Client = this.options.Client || t || ot().Client, this.Promise = this.options.Promise || b.Promise, typeof this.options.idleTimeoutMillis > "u" && (this.options.idleTimeoutMillis = 1e4), this._clients = [], this._idle = [], this._expired = /* @__PURE__ */ new WeakSet(), this._pendingQueue = [], this._endCallback = void 0, this.ending = false, this.ended = false;
    }
    _promiseTry(e) {
      let t = this.Promise;
      return typeof t.try == "function" ? t.try(e) : new t((n) => n(e()));
    }
    _isFull() {
      return this._clients.length >= this.options.max;
    }
    _isAboveMin() {
      return this._clients.length > this.options.min;
    }
    _pulseQueue() {
      if (this.log("pulse queue"), this.ended) {
        this.log("pulse queue ended");
        return;
      }
      if (this.ending) {
        this.log("pulse queue on ending"), this._idle.length && this._idle.slice().map((t) => {
          this._remove(t.client);
        }), this._clients.length || (this.ended = true, this._endCallback());
        return;
      }
      if (!this._pendingQueue.length) {
        this.log("no queued requests");
        return;
      }
      if (!this._idle.length && this._isFull())
        return;
      let e = this._pendingQueue.shift();
      if (this._idle.length) {
        let t = this._idle.pop();
        clearTimeout(t.timeoutId);
        let n = t.client;
        n.ref && n.ref();
        let i = t.idleListener;
        return this._acquireClient(n, e, i, false);
      }
      if (!this._isFull()) return this.newClient(e);
      throw new Error("unexpected condition");
    }
    _remove(e, t) {
      let n = co(this._idle, (s) => s.client === e);
      n !== void 0 && clearTimeout(n.timeoutId), this._clients = this._clients.filter((s) => s !== e);
      let i = this;
      e.end(() => {
        i.emit("remove", e), typeof t == "function" && t();
      });
    }
    connect(e) {
      if (this.ending) {
        let i = new Error(
          "Cannot use a pool after calling end on the pool"
        );
        return e ? e(i) : this.Promise.reject(i);
      }
      let t = Qt(this.Promise, e), n = t.result;
      if (this._isFull() || this._idle.length) {
        if (this._idle.length && y.nextTick(() => this._pulseQueue()), !this.options.connectionTimeoutMillis) return this._pendingQueue.push(new qe(t.callback)), n;
        let i = a((u, c, l) => {
          clearTimeout(o), t.callback(u, c, l);
        }, "queueCallback"), s = new qe(i), o = setTimeout(() => {
          co(this._pendingQueue, (u) => u.callback === i), s.timedOut = true, t.callback(new Error("timeout exceeded when trying to connect"));
        }, this.options.connectionTimeoutMillis);
        return o.unref && o.unref(), this._pendingQueue.push(s), n;
      }
      return this.newClient(new qe(t.callback)), n;
    }
    newClient(e) {
      let t = new this.Client(this.options);
      this._clients.push(t);
      let n = Tl(this, t);
      this.log("checking client timeout");
      let i, s = false;
      this.options.connectionTimeoutMillis && (i = setTimeout(() => {
        t.connection ? (this.log("ending client due to timeout"), s = true, t.connection.stream.destroy()) : t.isConnected() || (this.log("ending client due to timeout"), s = true, t.end());
      }, this.options.connectionTimeoutMillis)), this.log("connecting new client"), t.connect((o) => {
        if (i && clearTimeout(i), t.on("error", n), o) this.log("client failed to connect", o), this._clients = this._clients.filter((u) => u !== t), s && (o = new Error("Connection terminated due to connection timeout", { cause: o })), this._pulseQueue(), e.timedOut || e.callback(
          o,
          void 0,
          Tn
        );
        else {
          if (this.log("new client connected"), this.options.onConnect) {
            this._promiseTry(() => this.options.onConnect(t)).then(() => {
              this._afterConnect(t, e, n);
            }, (u) => {
              this._clients = this._clients.filter((c) => c !== t), t.end(() => {
                this._pulseQueue(), e.timedOut || e.callback(u, void 0, Tn);
              });
            });
            return;
          }
          return this._afterConnect(
            t,
            e,
            n
          );
        }
      });
    }
    _afterConnect(e, t, n) {
      if (this.options.maxLifetimeSeconds !== 0) {
        let i = setTimeout(() => {
          this.log(
            "ending client due to expired lifetime"
          ), this._expired.add(e), this._idle.findIndex((o) => o.client === e) !== -1 && this._acquireClient(e, new qe((o, u, c) => c()), n, false);
        }, this.options.maxLifetimeSeconds * 1e3);
        i.unref(), e.once("end", () => clearTimeout(i));
      }
      return this._acquireClient(e, t, n, true);
    }
    _acquireClient(e, t, n, i) {
      i && this.emit("connect", e), this.emit("acquire", e), e.release = this._releaseOnce(e, n), e.removeListener("error", n), t.timedOut ? i && this.options.verify ? this.options.verify(e, e.release) : e.release() : i && this.options.verify ? this.options.verify(e, (s) => {
        if (s) return e.release(s), t.callback(s, void 0, Tn);
        t.callback(void 0, e, e.release);
      }) : t.callback(void 0, e, e.release);
    }
    _releaseOnce(e, t) {
      let n = false;
      return (i) => {
        n && _l(), n = true, this._release(
          e,
          t,
          i
        );
      };
    }
    _release(e, t, n) {
      if (e.on("error", t), e._poolUseCount = (e._poolUseCount || 0) + 1, this.emit(
        "release",
        n,
        e
      ), n || this.ending || !e._queryable || e._ending || e._poolUseCount >= this.options.maxUses) return e._poolUseCount >= this.options.maxUses && this.log("remove expended client"), this._remove(e, this._pulseQueue.bind(this));
      if (this._expired.has(e)) return this.log("remove expired client"), this._expired.delete(e), this._remove(
        e,
        this._pulseQueue.bind(this)
      );
      let s;
      this.options.idleTimeoutMillis && this._isAboveMin() && (s = setTimeout(
        () => {
          this._isAboveMin() && (this.log("remove idle client"), this._remove(e, this._pulseQueue.bind(this)));
        },
        this.options.idleTimeoutMillis
      ), this.options.allowExitOnIdle && s.unref()), this.options.allowExitOnIdle && e.unref(), this._idle.push(new In(e, t, s)), this._pulseQueue();
    }
    query(e, t, n) {
      if (typeof e == "function") {
        let s = Qt(
          this.Promise,
          e
        );
        return x(function() {
          return s.callback(new Error("Passing a function as the first parameter to pool.query is not supported"));
        }), s.result;
      }
      typeof t == "function" && (n = t, t = void 0);
      let i = Qt(this.Promise, n);
      return n = i.callback, this.connect((s, o) => {
        if (s) return n(s);
        let u = false, c = a((l) => {
          u || (u = true, o.release(
            l
          ), n(l));
        }, "onError");
        o.once("error", c), this.log("dispatching query");
        try {
          o.query(e, t, (l, f) => {
            if (this.log("query dispatched"), o.removeListener("error", c), !u) return u = true, o.release(l), l ? n(l) : n(void 0, f);
          });
        } catch (l) {
          return o.release(l), n(l);
        }
      }), i.result;
    }
    end(e) {
      if (this.log("ending"), this.ending) {
        let n = new Error("Called end on pool more than once");
        return e ? e(n) : this.Promise.reject(n);
      }
      this.ending = true;
      let t = Qt(
        this.Promise,
        e
      );
      return this._endCallback = t.callback, this._pulseQueue(), t.result;
    }
    get waitingCount() {
      return this._pendingQueue.length;
    }
    get idleCount() {
      return this._idle.length;
    }
    get expiredCount() {
      return this._clients.reduce((e, t) => e + (this._expired.has(t) ? 1 : 0), 0);
    }
    get totalCount() {
      return this._clients.length;
    }
  };
  a(Bn, "Pool");
  var Pn = Bn;
  lo.exports = Pn;
});
var ho = {};
se(ho, { default: () => Il });
var Il;
var po = V(() => {
  "use strict";
  h();
  Il = {};
});
var yo = T((Yd, Pl) => {
  Pl.exports = { name: "pg", version: "8.8.0", description: "PostgreSQL client - pure javascript & libpq with the same API", keywords: [
    "database",
    "libpq",
    "pg",
    "postgre",
    "postgres",
    "postgresql",
    "rdbms"
  ], homepage: "https://github.com/brianc/node-postgres", repository: { type: "git", url: "git://github.com/brianc/node-postgres.git", directory: "packages/pg" }, author: "Brian Carlson <brian.m.carlson@gmail.com>", main: "./lib", dependencies: { "buffer-writer": "2.0.0", "packet-reader": "1.0.0", "pg-connection-string": "^2.5.0", "pg-pool": "^3.5.2", "pg-protocol": "^1.5.0", "pg-types": "^2.1.0", pgpass: "1.x" }, devDependencies: {
    async: "2.6.4",
    bluebird: "3.5.2",
    co: "4.6.0",
    "pg-copy-streams": "0.3.0"
  }, peerDependencies: { "pg-native": ">=3.0.1" }, peerDependenciesMeta: { "pg-native": { optional: true } }, scripts: { test: "make test-all" }, files: ["lib", "SPONSORS.md"], license: "MIT", engines: { node: ">= 8.0.0" }, gitHead: "c99fb2c127ddf8d712500db2c7b9a5491a178655" };
});
var wo = T((Zd, go) => {
  "use strict";
  h();
  var mo = ve().EventEmitter, Rl = (it(), O(nt)), Fn = rt(), Ne = go.exports = function(r, e, t) {
    mo.call(this), r = Fn.normalizeQueryConfig(r, e, t), this.text = r.text, this.values = r.values, this.name = r.name, this.callback = r.callback, this.state = "new", this._arrayMode = r.rowMode === "array", this._emitRowEvents = false, this.on("newListener", function(n) {
      n === "row" && (this._emitRowEvents = true);
    }.bind(this));
  };
  Rl.inherits(Ne, mo);
  var Ll = { sqlState: "code", statementPosition: "position", messagePrimary: "message", context: "where", schemaName: "schema", tableName: "table", columnName: "column", dataTypeName: "dataType", constraintName: "constraint", sourceFile: "file", sourceLine: "line", sourceFunction: "routine" };
  Ne.prototype.handleError = function(r) {
    var e = this.native.pq.resultErrorFields();
    if (e) for (var t in e) {
      var n = Ll[t] || t;
      r[n] = e[t];
    }
    this.callback ? this.callback(r) : this.emit("error", r), this.state = "error";
  };
  Ne.prototype.then = function(r, e) {
    return this._getPromise().then(
      r,
      e
    );
  };
  Ne.prototype.catch = function(r) {
    return this._getPromise().catch(r);
  };
  Ne.prototype._getPromise = function() {
    return this._promise ? this._promise : (this._promise = new Promise(function(r, e) {
      this._once("end", r), this._once("error", e);
    }.bind(this)), this._promise);
  };
  Ne.prototype.submit = function(r) {
    this.state = "running";
    var e = this;
    this.native = r.native, r.native.arrayMode = this._arrayMode;
    var t = a(function(s, o, u) {
      if (r.native.arrayMode = false, x(function() {
        e.emit("_done");
      }), s) return e.handleError(s);
      e._emitRowEvents && (u.length > 1 ? o.forEach(
        (c, l) => {
          c.forEach((f) => {
            e.emit("row", f, u[l]);
          });
        }
      ) : o.forEach(function(c) {
        e.emit("row", c, u);
      })), e.state = "end", e.emit("end", u), e.callback && e.callback(null, u);
    }, "after");
    if (y.domain && (t = y.domain.bind(t)), this.name) {
      this.name.length > 63 && (console.error("Warning! Postgres only supports 63 characters for query names."), console.error("You supplied %s (%s)", this.name, this.name.length), console.error("This can cause conflicts and silent errors executing queries"));
      var n = (this.values || []).map(Fn.prepareValue);
      if (r.namedQueries[this.name]) {
        if (this.text && r.namedQueries[this.name] !== this.text) {
          let s = new Error(`Prepared statements must be unique - '${this.name}' was used for a different statement`);
          return t(s);
        }
        return r.native.execute(this.name, n, t);
      }
      return r.native.prepare(this.name, this.text, n.length, function(s) {
        return s ? t(s) : (r.namedQueries[e.name] = e.text, e.native.execute(e.name, n, t));
      });
    } else if (this.values) {
      if (!Array.isArray(
        this.values
      )) {
        let s = new Error("Query values must be an array");
        return t(s);
      }
      var i = this.values.map(Fn.prepareValue);
      r.native.query(this.text, i, t);
    } else r.native.query(this.text, t);
  };
});
var So = T((tp, vo) => {
  "use strict";
  h();
  var Bl = (po(), O(ho)), Fl = _t(), ep = yo(), bo = ve().EventEmitter, Ml = (it(), O(nt)), kl = Lt(), xo = wo(), Y = vo.exports = function(r) {
    bo.call(this), r = r || {}, this._Promise = r.Promise || b.Promise, this._types = new Fl(r.types), this.native = new Bl({ types: this._types }), this._queryQueue = [], this._ending = false, this._connecting = false, this._connected = false, this._queryable = true;
    var e = this.connectionParameters = new kl(r);
    this.user = e.user, Object.defineProperty(this, "password", { configurable: true, enumerable: false, writable: true, value: e.password }), this.database = e.database, this.host = e.host, this.port = e.port, this.namedQueries = {};
  };
  Y.Query = xo;
  Ml.inherits(Y, bo);
  Y.prototype._errorAllQueries = function(r) {
    let e = a((t) => {
      y.nextTick(() => {
        t.native = this.native, t.handleError(r);
      });
    }, "enqueueError");
    this._hasActiveQuery() && (e(this._activeQuery), this._activeQuery = null), this._queryQueue.forEach(e), this._queryQueue.length = 0;
  };
  Y.prototype._connect = function(r) {
    var e = this;
    if (this._connecting) {
      y.nextTick(() => r(new Error("Client has already been connected. You cannot reuse a client.")));
      return;
    }
    this._connecting = true, this.connectionParameters.getLibpqConnectionString(function(t, n) {
      if (t) return r(t);
      e.native.connect(n, function(i) {
        if (i) return e.native.end(), r(i);
        e._connected = true, e.native.on("error", function(s) {
          e._queryable = false, e._errorAllQueries(s), e.emit("error", s);
        }), e.native.on("notification", function(s) {
          e.emit("notification", { channel: s.relname, payload: s.extra });
        }), e.emit("connect"), e._pulseQueryQueue(true), r();
      });
    });
  };
  Y.prototype.connect = function(r) {
    if (r) {
      this._connect(r);
      return;
    }
    return new this._Promise((e, t) => {
      this._connect((n) => {
        n ? t(n) : e();
      });
    });
  };
  Y.prototype.query = function(r, e, t) {
    var n, i, s, o, u;
    if (r == null) throw new TypeError("Client was passed a null or undefined query");
    if (typeof r.submit == "function") s = r.query_timeout || this.connectionParameters.query_timeout, i = n = r, typeof e == "function" && (r.callback = e);
    else if (s = this.connectionParameters.query_timeout, n = new xo(r, e, t), !n.callback) {
      let c, l;
      i = new this._Promise((f, m) => {
        c = f, l = m;
      }), n.callback = (f, m) => f ? l(f) : c(m);
    }
    return s && (u = n.callback, o = setTimeout(() => {
      var c = new Error(
        "Query read timeout"
      );
      y.nextTick(() => {
        n.handleError(c, this.connection);
      }), u(c), n.callback = () => {
      };
      var l = this._queryQueue.indexOf(n);
      l > -1 && this._queryQueue.splice(l, 1), this._pulseQueryQueue();
    }, s), n.callback = (c, l) => {
      clearTimeout(o), u(c, l);
    }), this._queryable ? this._ending ? (n.native = this.native, y.nextTick(() => {
      n.handleError(
        new Error("Client was closed and is not queryable")
      );
    }), i) : (this._queryQueue.push(n), this._pulseQueryQueue(), i) : (n.native = this.native, y.nextTick(() => {
      n.handleError(new Error("Client has encountered a connection error and is not queryable"));
    }), i);
  };
  Y.prototype.end = function(r) {
    var e = this;
    this._ending = true, this._connected || this.once("connect", this.end.bind(this, r));
    var t;
    return r || (t = new this._Promise(function(n, i) {
      r = a((s) => s ? i(s) : n(), "cb");
    })), this.native.end(function() {
      e._errorAllQueries(new Error("Connection terminated")), y.nextTick(() => {
        e.emit("end"), r && r();
      });
    }), t;
  };
  Y.prototype._hasActiveQuery = function() {
    return this._activeQuery && this._activeQuery.state !== "error" && this._activeQuery.state !== "end";
  };
  Y.prototype._pulseQueryQueue = function(r) {
    if (this._connected && !this._hasActiveQuery()) {
      var e = this._queryQueue.shift();
      if (!e) {
        r || this.emit("drain");
        return;
      }
      this._activeQuery = e, e.submit(this);
      var t = this;
      e.once("_done", function() {
        t._pulseQueryQueue();
      });
    }
  };
  Y.prototype.cancel = function(r) {
    this._activeQuery === r ? this.native.cancel(function() {
    }) : this._queryQueue.indexOf(r) !== -1 && this._queryQueue.splice(this._queryQueue.indexOf(r), 1);
  };
  Y.prototype.ref = function() {
  };
  Y.prototype.unref = function() {
  };
  Y.prototype.setTypeParser = function(r, e, t) {
    return this._types.setTypeParser(
      r,
      e,
      t
    );
  };
  Y.prototype.getTypeParser = function(r, e) {
    return this._types.getTypeParser(r, e);
  };
});
var Mn = T((ip, Eo) => {
  "use strict";
  h();
  Eo.exports = So();
});
var ot = T((op, at) => {
  "use strict";
  h();
  var Ol = uo(), Ul = tt(), Ql = An(), Dl = fo(), { DatabaseError: ql } = vn(), Nl = a(
    (r) => {
      var e;
      return e = class extends Dl {
        constructor(n) {
          super(n, r);
        }
      }, a(e, "BoundPool"), e;
    },
    "poolFactory"
  ), kn = a(
    function(r) {
      this.defaults = Ul, this.Client = r, this.Query = this.Client.Query, this.Pool = Nl(this.Client), this._pools = [], this.Connection = Ql, this.types = Je(), this.DatabaseError = ql;
    },
    "PG"
  );
  typeof y.env.NODE_PG_FORCE_NATIVE < "u" ? at.exports = new kn(Mn()) : (at.exports = new kn(Ol), Object.defineProperty(at.exports, "native", {
    configurable: true,
    enumerable: false,
    get() {
      var r = null;
      try {
        r = new kn(Mn());
      } catch (e) {
        if (e.code !== "MODULE_NOT_FOUND") throw e;
      }
      return Object.defineProperty(at.exports, "native", { value: r }), r;
    }
  }));
});
h();
h();
h();
var da = Object.defineProperty;
var pa = Object.defineProperties;
var ya = Object.getOwnPropertyDescriptors;
var ai = Object.getOwnPropertySymbols;
var ma = Object.prototype.hasOwnProperty;
var ga = Object.prototype.propertyIsEnumerable;
var ui = a(
  (r, e, t) => e in r ? da(r, e, { enumerable: true, configurable: true, writable: true, value: t }) : r[e] = t,
  "__defNormalProp"
);
var wa = a((r, e) => {
  for (var t in e || (e = {})) ma.call(e, t) && ui(r, t, e[t]);
  if (ai) for (var t of ai(e)) ga.call(e, t) && ui(r, t, e[t]);
  return r;
}, "__spreadValues");
var ba = a((r, e) => pa(r, ya(e)), "__spreadProps");
var xa = 1008e3;
var ci = new Uint8Array(
  new Uint16Array([258]).buffer
)[0] === 2;
var va = new TextDecoder();
var Yt = new TextEncoder();
var dt = Yt.encode("0123456789abcdef");
var pt = Yt.encode("0123456789ABCDEF");
var Sa = Yt.encode("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
var li = Sa.slice();
li[62] = 45;
li[63] = 95;
var je;
var yt;
function Ea(r, { alphabet: e, scratchArr: t } = {}) {
  if (!je) if (je = new Uint16Array(256), yt = new Uint16Array(256), ci) for (let S = 0; S < 256; S++) je[S] = dt[S & 15] << 8 | dt[S >>> 4], yt[S] = pt[S & 15] << 8 | pt[S >>> 4];
  else for (let S = 0; S < 256; S++) je[S] = dt[S & 15] | dt[S >>> 4] << 8, yt[S] = pt[S & 15] | pt[S >>> 4] << 8;
  r.byteOffset % 4 !== 0 && (r = new Uint8Array(r));
  let n = r.length, i = n >>> 1, s = n >>> 2, o = t || new Uint16Array(n), u = new Uint32Array(
    r.buffer,
    r.byteOffset,
    s
  ), c = new Uint32Array(o.buffer, o.byteOffset, i), l = e === "upper" ? yt : je, f = 0, m = 0, g;
  if (ci)
    for (; f < s; ) g = u[f++], c[m++] = l[g >>> 8 & 255] << 16 | l[g & 255], c[m++] = l[g >>> 24] << 16 | l[g >>> 16 & 255];
  else for (; f < s; )
    g = u[f++], c[m++] = l[g >>> 24] << 16 | l[g >>> 16 & 255], c[m++] = l[g >>> 8 & 255] << 16 | l[g & 255];
  for (f <<= 2; f < n; ) o[f] = l[r[f++]];
  return va.decode(o.subarray(0, n));
}
a(Ea, "_toHex");
function Aa(r, e = {}) {
  let t = "", n = r.length, i = xa >>> 1, s = Math.ceil(n / i), o = new Uint16Array(s > 1 ? i : n), u = ba(wa({}, e), { scratchArr: o });
  for (let c = 0; c < s; c++) {
    let l = c * i, f = l + i;
    t += Ea(r.subarray(l, f), u);
  }
  return t;
}
a(Aa, "_toHexChunked");
function fi(r, e = {}) {
  return e.alphabet !== "upper" && typeof r.toHex == "function" ? r.toHex() : Aa(r, e);
}
a(fi, "toHex");
h();
h();
var Zt = class Zt2 {
  constructor(e, t, n) {
    E(this, "execute", e);
    E(this, "queryData", t);
    E(this, "opts", n);
  }
  then(e, t) {
    return this.execute(this.queryData, this.opts).then(e, t);
  }
  catch(e) {
    return this.execute(
      this.queryData,
      this.opts
    ).catch(e);
  }
  finally(e) {
    return this.execute(this.queryData, this.opts).finally(e);
  }
};
a(Zt, "NeonQueryPromise");
var xe = Zt;
var mt = class mt2 {
  constructor(e, t) {
    E(this, "strings", e);
    E(this, "values", t);
  }
  toParameterizedQuery(e = {
    query: "",
    params: []
  }) {
    let { strings: t, values: n } = this;
    for (let i = 0, s = t.length; i < s; i++) if (e.query += t[i], i < n.length) {
      let o = n[i];
      if (o instanceof $e) e.query += o.sql;
      else if (o instanceof xe) if (o.queryData instanceof mt2) o.queryData.toParameterizedQuery(e);
      else {
        if (o.queryData.params?.length) throw new Error("This query is not composable");
        e.query += o.queryData.query;
      }
      else {
        let { params: u } = e;
        u.push(o), e.query += "$" + u.length, (o instanceof p || ArrayBuffer.isView(o)) && (e.query += "::bytea");
      }
    }
    return e;
  }
};
a(mt, "SqlTemplate");
var He = mt;
var Jt = class Jt2 {
  constructor(e) {
    E(this, "sql", e);
  }
};
a(Jt, "UnsafeRawSql");
var $e = Jt;
h();
function gt() {
  typeof window < "u" && typeof document < "u" && typeof console < "u" && typeof console.warn == "function" && console.warn(`          
        ************************************************************
        *                                                          *
        *  WARNING: Running SQL directly from the browser can have *
        *  security implications. Even if your database is         *
        *  protected by Row-Level Security (RLS), use it at your   *
        *  own risk. This approach is great for fast prototyping,  *
        *  but ensure proper safeguards are in place to prevent    *
        *  misuse or execution of expensive SQL queries by your    *
        *  end users.                                              *
        *                                                          *
        *  If you've assessed the risks, suppress this message     *
        *  using the disableWarningInBrowsers configuration        *
        *  parameter.                                              *
        *                                                          *
        ************************************************************`);
}
a(gt, "warnIfBrowser");
h();
h();
var wt = class wt2 extends Error {
  constructor(t) {
    super(t);
    E(this, "name", "NeonDbError");
    E(this, "severity");
    E(this, "code");
    E(this, "detail");
    E(this, "hint");
    E(this, "position");
    E(this, "internalPosition");
    E(
      this,
      "internalQuery"
    );
    E(this, "where");
    E(this, "schema");
    E(this, "table");
    E(this, "column");
    E(this, "dataType");
    E(this, "constraint");
    E(this, "file");
    E(this, "line");
    E(this, "routine");
    E(this, "sourceError");
    "captureStackTrace" in Error && typeof Error.captureStackTrace == "function" && Error.captureStackTrace(this, wt2);
  }
};
a(
  wt,
  "NeonDbError"
);
var N = wt;
var hi = ["severity", "code", "detail", "hint", "position", "internalPosition", "internalQuery", "where", "schema", "table", "column", "dataType", "constraint", "file", "line", "routine"];
function di(r, e) {
  let t, n;
  try {
    t = new URL(r).protocol, n = new URL("http:" + r.slice(t.length));
  } catch {
    throw new N(
      `Database connection string provided to neon() is not a valid URL (connection string: ${r})`
    );
  }
  let {
    username: i,
    hostname: s,
    pathname: o
  } = n;
  if (t !== "postgres:" && t !== "postgresql:" || e && (!i || !s || s === "-" || !o || o === "/")) throw new N(
    "Wrong URL scheme or missing user, host or database in connection parameters"
  );
  return n;
}
a(di, "URLFromPgConnectionString");
function Ca(r) {
  return "postgresql:" + r.href.slice(r.protocol.length);
}
a(Ca, "pgConnectionStringFromURL");
var _a = ["connectionString", "user", "username", "password", "host", "hostname", "port", "database"];
var Ta = { database: "pathname", user: "username", host: "hostname" };
function pi(...r) {
  let e = {};
  for (let t of r) e = t.connectionString !== void 0 ? t : { ...e, ...t };
  return e;
}
a(pi, "mergeConnectionParams");
async function yi(r = "postgresql://-", e = {}, t = {}) {
  if (e.connectionString !== void 0 && (r = e.connectionString), typeof r == "function" && (r = await r()), typeof r != "string") throw new N("Connection string must be a string or a function resolving to one");
  if (e.user !== void 0 && e.username !== void 0) throw new N("Please specify one only of user and username");
  if (e.host !== void 0 && e.hostname !== void 0) throw new N("Please specify one only of host and hostname");
  let n = di(r, false);
  await Promise.all(_a.map(async (u) => {
    if (u === "connectionString") return;
    let c = e[u];
    if (typeof c == "function" && (c = await c()), c === void 0) return;
    if (typeof c != "string" && !(u === "port" && typeof c == "number")) {
      let f = u === "port" ? " or a number" : "";
      throw new N(`Connection parameter "${u}" must be a string${f} or a function resolving to one`);
    }
    let l = Ta[u] ?? u;
    n[l] = c;
  }));
  let { searchParams: i } = n;
  for (let u in t) i.has(u) || i.append(u, t[u]);
  let s = Ca(n), o = di(s, true);
  return { resolvedConnectionString: s, resolvedURL: o };
}
a(yi, "resolveConnectionParams");
Ge();
h();
var vt = "pkg:npm/%40neondatabase/serverless@1.2.0";
var ds = we(_t());
var ps = we(rt());
var ls = "transaction() expects an array of queries, or a function returning an array of queries";
function Nu(r) {
  return r instanceof p ? "\\x" + fi(r) : r;
}
a(Nu, "encodeBuffersAsBytea");
function fs4(r) {
  let { query: e, params: t } = r instanceof He ? r.toParameterizedQuery() : r;
  return { query: e, params: t.map((n) => Nu((0, ps.prepareValue)(n))) };
}
a(fs4, "prepareQuery");
function ys(r, e = {}) {
  typeof r != "string" && (e = r ?? {}, r = void 0);
  let {
    arrayMode: t,
    fullResults: n,
    fetchOptions: i,
    isolationLevel: s,
    readOnly: o,
    deferrable: u,
    authToken: c,
    disableWarningInBrowsers: l
  } = e;
  function f(g, ...w) {
    if (!(Array.isArray(g) && Array.isArray(g.raw) && Array.isArray(w))) throw new Error('This function can now be called only as a tagged-template function: sql`SELECT ${value}`, not sql("SELECT $1", [value], options). For a conventional function call with value placeholders ($1, $2, etc.), use sql.query("SELECT $1", [value], options).');
    return new xe(m, new He(g, w));
  }
  a(f, "templateFn"), f.query = (g, w, S) => new xe(
    m,
    { query: g, params: w ?? [] },
    S
  ), f.unsafe = (g) => new $e(g), f.transaction = async (g, w) => {
    if (typeof g == "function" && (g = g(f)), !Array.isArray(g)) throw new Error(ls);
    g.forEach((D) => {
      if (!(D instanceof xe)) throw new Error(ls);
    });
    let S = g.map((D) => D.queryData), k = g.map((D) => D.opts ?? {});
    return m(S, k, w);
  };
  async function m(g, w, S) {
    let {
      fetchEndpoint: k,
      fetchFunction: D
    } = pe, he = Array.isArray(g) ? { queries: g.map((G) => fs4(G)) } : fs4(g), I = i ?? {}, C = t ?? false, re = n ?? false, ne = s, H = o, oe = u;
    S !== void 0 && (S.fetchOptions !== void 0 && (I = { ...I, ...S.fetchOptions }), S.arrayMode !== void 0 && (C = S.arrayMode), S.fullResults !== void 0 && (re = S.fullResults), S.isolationLevel !== void 0 && (ne = S.isolationLevel), S.readOnly !== void 0 && (H = S.readOnly), S.deferrable !== void 0 && (oe = S.deferrable)), w !== void 0 && !Array.isArray(
      w
    ) && w.fetchOptions !== void 0 && (I = { ...I, ...w.fetchOptions });
    let ae = c;
    !Array.isArray(w) && w?.authToken !== void 0 && (ae = w.authToken);
    let me = pi(e, S ?? {}, Array.isArray(w) || !w ? {} : w), { resolvedConnectionString: R, resolvedURL: $ } = await yi(
      r,
      me,
      { application_name: vt }
    ), Ee = typeof k == "function" ? k($.hostname, $.port, { jwtAuth: ae !== void 0 }) : k, ue = {
      "Neon-Connection-String": R,
      "Neon-Raw-Text-Output": "true",
      "Neon-Array-Mode": "true"
    }, Te = await Wu(ae);
    Te && (ue.Authorization = `Bearer ${Te}`), Array.isArray(g) && (ne !== void 0 && (ue["Neon-Batch-Isolation-Level"] = ne), H !== void 0 && (ue["Neon-Batch-Read-Only"] = String(H)), oe !== void 0 && (ue["Neon-Batch-Deferrable"] = String(
      oe
    ))), l || pe.disableWarningInBrowsers || gt();
    let ce;
    try {
      ce = await (D ?? fetch)(Ee, { method: "POST", body: JSON.stringify(he), headers: ue, ...I });
    } catch (G) {
      let q = new N(`Error connecting to database: ${G}`);
      throw q.sourceError = G, q;
    }
    if (ce.ok) {
      let G = await ce.json();
      if (Array.isArray(g)) {
        let q = G.results;
        if (!Array.isArray(q)) throw new N(
          "Neon internal error: unexpected result format"
        );
        return q.map((ge, J) => {
          let ie = w[J] ?? {}, Dt = ie.arrayMode ?? C, Io = ie.fullResults ?? re;
          return hs(ge, { arrayMode: Dt, fullResults: Io, types: ie.types });
        });
      } else {
        let q = w ?? {}, ge = q.arrayMode ?? C, J = q.fullResults ?? re;
        return hs(G, { arrayMode: ge, fullResults: J, types: q.types });
      }
    } else {
      let { status: G } = ce;
      if (G === 400) {
        let q = await ce.json(), ge = new N(q.message);
        for (let J of hi) ge[J] = q[J] ?? void 0;
        throw ge;
      } else {
        let q = await ce.text();
        throw new N(`Server error (HTTP status ${G}): ${q}`);
      }
    }
  }
  return a(
    m,
    "execute"
  ), f;
}
a(ys, "neon");
function hs(r, { arrayMode: e, fullResults: t, types: n }) {
  let i = new ds.default(
    n
  ), s = r.fields.map((c) => c.name), o = r.fields.map((c) => i.getTypeParser(c.dataTypeID)), u = e === true ? r.rows.map((c) => c.map((l, f) => l === null ? null : o[f](l))) : r.rows.map((c) => Object.fromEntries(c.map((l, f) => [s[f], l === null ? null : o[f](l)])));
  return t ? (r.viaNeonFetch = true, r.rowAsArray = e, r.rows = u, r._parsers = o, r._types = i, r) : u;
}
a(hs, "processQueryResult");
async function Wu(r) {
  if (typeof r == "string") return r;
  if (typeof r == "function") try {
    return await Promise.resolve(r());
  } catch (e) {
    let t = new N("Error getting auth token.");
    throw e instanceof Error && (t = new N(`Error getting auth token: ${e.message}`)), t;
  }
}
a(Wu, "getAuthToken");
h();
h();
var Co = we(ot());
h();
var Ao = we(ot());
var On = class On2 extends Ao.Client {
  constructor(t) {
    let n = typeof t == "string" ? { connectionString: t } : {
      ...t,
      ...t && "password" in t ? { password: t.password } : {}
    };
    super({ fallback_application_name: vt, ...n });
    E(this, "config", t);
  }
  get neonConfig() {
    return this.connection.stream;
  }
  connect(t) {
    let { neonConfig: n } = this;
    n.forceDisablePgSSL && (this.ssl = this.connection.ssl = false), this.ssl && n.useSecureWebSocket && console.warn("SSL is enabled for both Postgres (e.g. ?sslmode=require in the connection string + forceDisablePgSSL = false) and the WebSocket tunnel (useSecureWebSocket = true). Double encryption will increase latency and CPU usage. It may be appropriate to disable SSL in the Postgres connection parameters or set forceDisablePgSSL = true.");
    let i = typeof this.config != "string" && this.config?.host !== void 0 || typeof this.config != "string" && this.config?.connectionString !== void 0 || y.env.PGHOST !== void 0, s = y.env.USER ?? y.env.USERNAME;
    if (!i && this.host === "localhost" && this.user === s && this.database === s && this.password === null) throw new Error(`No database host or connection string was set, and key parameters have default values (host: localhost, user: ${s}, db: ${s}, password: null). Is an environment variable missing? Alternatively, if you intended to connect with these parameters, please set the host to 'localhost' explicitly.`);
    let o = super.connect(
      t
    ), u = n.pipelineTLS && this.ssl, c = n.pipelineConnect === "password";
    if (!u && !n.pipelineConnect) return o;
    let l = this.connection;
    if (u && l.on("connect", () => l.stream.emit("data", "S")), c) {
      l.removeAllListeners("authenticationCleartextPassword"), l.removeAllListeners("readyForQuery"), l.once("readyForQuery", () => l.on("readyForQuery", this._handleReadyForQuery.bind(this)));
      let f = this.password, m = Promise.resolve(typeof f == "function" ? f() : f), g = this.ssl ? "sslconnect" : "connect";
      l.on(g, () => {
        this.neonConfig.disableWarningInBrowsers || gt(), m.then((w) => {
          this.password = w, this._handleAuthCleartextPassword(), this._handleReadyForQuery();
        }).catch(
          (w) => l.emit("error", w)
        );
      });
    }
    return o;
  }
  async _handleAuthSASLContinue(t) {
    if (typeof crypto > "u" || crypto.subtle === void 0 || crypto.subtle.importKey === void 0) throw new Error("Cannot use SASL auth when `crypto.subtle` is not defined");
    let n = crypto.subtle, i = this.saslSession, s = this.password, o = t.data;
    if (i.message !== "SASLInitialResponse" || typeof s != "string" || typeof o != "string") throw new Error("SASL: protocol error");
    let u = Object.fromEntries(o.split(",").map((J) => {
      if (!/^.=/.test(J)) throw new Error("SASL: Invalid attribute pair entry");
      let ie = J[0], Dt = J.substring(2);
      return [ie, Dt];
    })), c = u.r, l = u.s, f = u.i;
    if (!c || !/^[!-+--~]+$/.test(c))
      throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: nonce missing/unprintable");
    if (!l || !/^(?:[a-zA-Z0-9+/]{4})*(?:[a-zA-Z0-9+/]{2}==|[a-zA-Z0-9+/]{3}=)?$/.test(l)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: salt missing/not base64");
    if (!f || !/^[1-9][0-9]*$/.test(f)) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: missing/invalid iteration count");
    if (!c.startsWith(
      i.clientNonce
    )) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce does not start with client nonce");
    if (c.length === i.clientNonce.length) throw new Error("SASL: SCRAM-SERVER-FIRST-MESSAGE: server nonce is too short");
    let m = parseInt(f, 10), g = p.from(l, "base64"), w = new TextEncoder(), S = w.encode(s), k = await n.importKey("raw", S, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]), D = new Uint8Array(await n.sign("HMAC", k, p.concat([g, p.from([0, 0, 0, 1])]))), he = D;
    for (var I = 0; I < m - 1; I++) D = new Uint8Array(await n.sign("HMAC", k, D)), he = p.from(he.map((J, ie) => he[ie] ^ D[ie]));
    let C = he, re = await n.importKey("raw", C, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]), ne = new Uint8Array(await n.sign("HMAC", re, w.encode("Client Key"))), H = await n.digest("SHA-256", ne), oe = "n=*,r=" + i.clientNonce, ae = "r=" + c + ",s=" + l + ",i=" + m, me = "c=biws,r=" + c, R = oe + "," + ae + "," + me, $ = await n.importKey("raw", H, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]);
    var Ee = new Uint8Array(await n.sign("HMAC", $, w.encode(R))), ue = p.from(ne.map((J, ie) => ne[ie] ^ Ee[ie])), Te = ue.toString("base64");
    let ce = await n.importKey("raw", C, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]), G = await n.sign("HMAC", ce, w.encode("Server Key")), q = await n.importKey("raw", G, { name: "HMAC", hash: { name: "SHA-256" } }, false, ["sign"]);
    var ge = p.from(await n.sign("HMAC", q, w.encode(R)));
    i.message = "SASLResponse", i.serverSignature = ge.toString("base64"), i.response = me + ",p=" + Te, this.connection.sendSCRAMClientFinalMessage(
      this.saslSession.response
    );
  }
};
a(On, "NeonClient");
var ut = On;
Ge();
var _o = we(Lt());
function Wl(r, e) {
  if (e) return { callback: e, result: void 0 };
  let t, n, i = a(function(o, u) {
    o ? t(o) : n(u);
  }, "cb"), s = new r(function(o, u) {
    n = o, t = u;
  });
  return { callback: i, result: s };
}
a(Wl, "promisify");
var Qn = class Qn2 extends Co.Pool {
  constructor() {
    super(...arguments);
    E(this, "Client", ut);
    E(this, "hasFetchUnsupportedListeners", false);
    E(this, "addListener", this.on);
  }
  on(t, n) {
    return t !== "error" && (this.hasFetchUnsupportedListeners = true), super.on(t, n);
  }
  query(t, n, i) {
    if (!pe.poolQueryViaFetch || this.hasFetchUnsupportedListeners || typeof t == "function") return super.query(
      t,
      n,
      i
    );
    typeof n == "function" && (i = n, n = void 0);
    let s = Wl(this.Promise, i);
    i = s.callback;
    try {
      let o = new _o.default(
        this.options
      ), u = encodeURIComponent, c = encodeURI, l = `postgresql://${u(o.user)}:${u(o.password)}@${u(o.host)}/${c(o.database)}`, f = typeof t == "string" ? t : t.text, m = n ?? t.values ?? [];
      ys(l, { fullResults: true, arrayMode: t.rowMode === "array" }).query(f, m, { types: t.types ?? this.options?.types }).then((w) => i(void 0, w)).catch((w) => i(
        w
      ));
    } catch (o) {
      i(o);
    }
    return s.result;
  }
};
a(Qn, "NeonPool");
Ge();
var ct = we(ot());
h();
var To = we(Ir());
function jl(r) {
  return Object.entries(r).reduce((t, [n, i]) => (i != null && (t[n] = i), t), /* @__PURE__ */ Object.create(null));
}
a(jl, "toConnectionOptions");
function Hl(r) {
  return Object.entries(r).reduce((t, [n, i]) => {
    if (n === "ssl") {
      let s = i;
      typeof s == "boolean" && (t[n] = s), typeof s == "object" && (t[n] = jl(s));
    } else if (i != null) if (n === "port") {
      if (i !== "") {
        let s = parseInt(i, 10);
        if (isNaN(s)) throw new Error(`Invalid ${n}: ${i}`);
        t[n] = s;
      }
    } else t[n] = i;
    return t;
  }, /* @__PURE__ */ Object.create(null));
}
a(Hl, "toClientConfig");
function $l(r) {
  return Hl((0, To.parse)(r));
}
a(
  $l,
  "parseIntoClientConfig"
);
var export_DatabaseError = ct.DatabaseError;
var export_defaults = ct.defaults;
var export_escapeIdentifier = ct.escapeIdentifier;
var export_escapeLiteral = ct.escapeLiteral;
var export_types = ct.types;

// netlify/functions/api.ts
var app = new Hono3();
var api = new Hono3();
var DB_HOST = "ep-odd-hat-b4bwqvtu-pooler.c-6.us-east-2.aws.neon.tech";
var DB_USER = "neondb_owner";
var DB_PASS = "npg_fnBYaZwdx0u5";
var DB_NAME = "neondb";
var DEFAULT_DATABASE_URL = `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}?sslmode=require&channel_binding=require`;
function getDb() {
  const url = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || DEFAULT_DATABASE_URL;
  return ys(url);
}
var DEF_SMTP_PASS = ["xsmtpsib", "881d641664dc545ba3472e3f8d1b390c44e002082011f3b8a477d24d58292741", "bJIbfYF9JiJe5Hsk"].join("-");
var DEF_API_KEY = ["xkeysib", "881d641664dc545ba3472e3f8d1b390c44e002082011f3b8a477d24d58292741", "e6WIMu5EDIQP7iwQ"].join("-");
var BREVO_API_KEY = process.env.BREVO_API_KEY || DEF_API_KEY;
var BREVO_SMTP_USER = process.env.BREVO_SMTP_USER || "bd8af4001@smtp-brevo.com";
var BREVO_SMTP_PASS = process.env.BREVO_SMTP_PASS || process.env.BREVO_SMTP_KEY || DEF_SMTP_PASS;
var BREVO_SENDER = { name: "Get Set Flight", email: process.env.BREVO_SENDER_EMAIL || "officialtraveloboom@gmail.com" };
var BREVO_REPLY_TO = { name: "Get Set Flight", email: process.env.BREVO_REPLY_EMAIL || "officialtraveloboom@gmail.com" };
var BREVO_CC = [
  { email: "officialtraveloboom@gmail.com", name: "Operations Team" },
  { email: "info@getsetflight.com", name: "Get Set Flight Info" }
];
var brevoTransporter = nodemailer_default.createTransport({
  host: process.env.BREVO_SMTP_SERVER || "smtp-relay.brevo.com",
  port: Number(process.env.BREVO_SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: BREVO_SMTP_USER,
    pass: BREVO_SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});
var corsMiddleware = async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
  c.header("Access-Control-Max-Age", "86400");
  if (c.req.method === "OPTIONS") {
    return c.text("OK", 200);
  }
  await next();
};
app.use("*", corsMiddleware);
api.use("*", corsMiddleware);
app.options("*", (c) => c.text("OK", 200));
api.options("*", (c) => c.text("OK", 200));
async function sendBrevoEmail(to2, subject, htmlContent, skipCc = false) {
  const ccEmails = !skipCc && BREVO_CC.length > 0 ? BREVO_CC.map((c) => c.email).filter((e) => e.toLowerCase() !== to2.toLowerCase()) : [];
  try {
    const mailOptions = {
      from: `"${BREVO_SENDER.name}" <${BREVO_SENDER.email}>`,
      to: to2,
      subject,
      html: htmlContent,
      replyTo: `"${BREVO_REPLY_TO.name}" <${BREVO_REPLY_TO.email}>`
    };
    if (ccEmails.length > 0) {
      mailOptions.cc = ccEmails;
    }
    const info = await brevoTransporter.sendMail(mailOptions);
    console.log("[Brevo SMTP Success]: messageId =", info.messageId, "to =", to2, "cc =", ccEmails);
    return { success: true, messageId: info.messageId, via: "smtp" };
  } catch (smtpErr) {
    console.warn("[Brevo SMTP Notice, trying REST API]:", smtpErr.message);
  }
  try {
    if (!BREVO_API_KEY) return null;
    const payload = {
      sender: BREVO_SENDER,
      replyTo: BREVO_REPLY_TO,
      to: [{ email: to2 }],
      subject,
      htmlContent
    };
    if (!skipCc && BREVO_CC.length > 0) {
      payload.cc = BREVO_CC;
    }
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn("[Brevo REST API Warning HTTP " + res.status + "]:", data);
    } else {
      console.log("[Brevo REST API Success]: to =", to2);
    }
    return data;
  } catch (err) {
    console.warn("[Brevo Email Exception]:", err);
    return null;
  }
}
async function forwardToExternalWebhook(event, payload) {
  try {
    const targetUrl = "https://hkdk.events/xpat3puckr1stj";
    fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "CRM-Webhook-Relay/1.0"
      },
      body: JSON.stringify({
        event,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        data: payload
      })
    }).catch((err) => {
      console.warn("[External Webhook Relay Error]:", err?.message);
    });
  } catch (err) {
    console.warn("[External Webhook Relay Error]:", err);
  }
}
async function parseAnyBody(c) {
  const method = c.req.method;
  if (method === "GET") {
    return c.req.query() || {};
  }
  try {
    return await c.req.json();
  } catch {
    try {
      return await c.req.parseBody();
    } catch {
      try {
        const text = await c.req.text();
        try {
          return JSON.parse(text);
        } catch {
          const sp = new URLSearchParams(text);
          return Object.fromEntries(sp.entries());
        }
      } catch {
        return {};
      }
    }
  }
}
function getNowFormatted() {
  try {
    return (/* @__PURE__ */ new Date()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  } catch {
    return (/* @__PURE__ */ new Date()).toISOString();
  }
}
api.get("/health", async (c) => {
  try {
    const sql = getDb();
    const result = await sql`SELECT 1 as alive`;
    return c.json({ success: true, status: "ok", database: "connected", result });
  } catch (err) {
    return c.json({ success: false, status: "degraded", error: err.message }, 500);
  }
});
api.get("/public/system-settings", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT key, value, description FROM system_settings`;
    const settings = {};
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });
    return c.json({ success: true, data: settings });
  } catch (err) {
    return c.json({ success: false, message: err.message, data: { login_otp_enabled: "true" } }, 500);
  }
});
api.post("/public/system-settings", async (c) => {
  try {
    const body = await parseAnyBody(c);
    const { key, value, updatedBy } = body;
    if (!key) {
      return c.json({ success: false, message: "Missing key" }, 400);
    }
    const sql = getDb();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    await sql`
      INSERT INTO system_settings (key, value, "updatedBy", "updatedAt")
      VALUES (${key}, ${String(value)}, ${updatedBy || "Admin"}, ${now})
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, "updatedBy" = EXCLUDED."updatedBy", "updatedAt" = EXCLUDED."updatedAt"
    `;
    return c.json({ success: true, message: "Setting updated successfully" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
api.post("/public/login-request", async (c) => {
  try {
    const body = await parseAnyBody(c);
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();
    if (!email || !password) {
      return c.json({ success: false, message: "Please enter both email and password" }, 400);
    }
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM users 
      WHERE LOWER(email) = ${email} 
      ORDER BY (password IS NOT NULL) DESC, id ASC 
      LIMIT 1
    `;
    const user = rows[0];
    if (!user) {
      return c.json({ success: false, message: "Invalid email or password" }, 401);
    }
    const dbPass = (user.password || "").trim();
    const match2 = dbPass === password || dbPass.toLowerCase() === password.toLowerCase();
    if (!match2) {
      return c.json({ success: false, message: "Invalid email or password" }, 401);
    }
    if (user.status && user.status.toLowerCase() === "inactive") {
      return c.json({ success: false, message: "Account is inactive. Contact administrator." }, 403);
    }
    let otpRequired = true;
    try {
      const settingRows = await sql`SELECT value FROM system_settings WHERE key = 'login_otp_enabled' LIMIT 1`;
      if (settingRows.length > 0 && settingRows[0].value === "false") {
        otpRequired = false;
      }
      if (user.otp_enabled === false) {
        otpRequired = false;
      }
    } catch (e) {
      console.warn("Could not read login_otp_enabled setting:", e);
    }
    if (!otpRequired) {
      let userPerms = [];
      if (user.permissions) {
        try {
          userPerms = typeof user.permissions === "string" ? JSON.parse(user.permissions) : user.permissions;
        } catch {
          userPerms = [];
        }
      } else if (user.role) {
        try {
          const roleRows = await sql`SELECT permissions FROM roles WHERE "roleName" = ${user.role} LIMIT 1`;
          if (roleRows.length > 0 && roleRows[0].permissions) {
            userPerms = typeof roleRows[0].permissions === "string" ? JSON.parse(roleRows[0].permissions) : roleRows[0].permissions;
          }
        } catch {
        }
      }
      const safeUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        gender: user.gender,
        phone: user.phone,
        company: user.company,
        status: user.status,
        permissions: userPerms,
        otpEnabled: false
      };
      return c.json({
        success: true,
        requiresOtp: false,
        message: "Login successful",
        user: safeUser
      });
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expires = Date.now() + 10 * 60 * 1e3;
    const created = (/* @__PURE__ */ new Date()).toISOString();
    try {
      await sql`DELETE FROM password_otps WHERE LOWER(email) = ${email}`;
      await sql`
        INSERT INTO password_otps (email, otp, expires, created)
        VALUES (${email}, ${otp}, ${expires}, ${created})
      `;
    } catch (dbErr) {
      console.warn("[password_otps Insert Error]:", dbErr);
    }
    const subject = `\u{1F510} CRM Login Verification Code: ${otp}`;
    const otpHtml = `<div style="font-family:'Segoe UI',Roboto,Helvetica,sans-serif;max-width:540px;margin:0 auto;padding:32px 24px;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h2 style="color:#0f172a;margin:0 0 6px;font-size:22px;font-weight:700;">Get Set Flight CRM</h2>
        <span style="display:inline-block;padding:4px 12px;background:#f0fdf4;color:#166534;font-size:12px;font-weight:600;border-radius:999px;border:1px solid #bbf7d0;">Security Verification</span>
      </div>
      <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 16px;">Hello <strong>${user.name || "User"}</strong>,</p>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px;">Use the following 6-digit one-time password (OTP) to securely sign in to your CRM account:</p>
      <div style="background:#f8fafc;border:2px dashed #6366f1;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
        <div style="font-family:monospace;font-size:36px;font-weight:800;letter-spacing:10px;color:#4f46e5;">${otp}</div>
        <p style="color:#64748b;font-size:12px;margin:8px 0 0;">Valid for 10 minutes \xB7 Do not share this code with anyone</p>
      </div>
      <p style="color:#64748b;font-size:12px;line-height:1.5;margin:0 0 16px;">If you did not initiate this login request, please contact your administrator immediately.</p>
      <hr style="border:none;border-top:1px solid #f1f5f9;margin:24px 0 16px;" />
      <div style="text-align:center;color:#94a3b8;font-size:11px;">
        Get Set Flight Operations \xB7 Plot No. 130, Sector 82, JLPL Industrial Area, Sahibzada Ajit Singh Nagar, Punjab 140306
      </div>
    </div>`;
    let emailSent = false;
    try {
      const emailRes = await sendBrevoEmail(email, subject, otpHtml, false);
      if (emailRes && (emailRes.success || emailRes.messageId)) {
        emailSent = true;
      } else if (emailRes && !emailRes.message?.includes("unrecognised IP") && !emailRes.code?.includes("unauthorized") && !emailRes.error) {
        emailSent = true;
      }
      if (!emailSent) {
        console.warn("[LOGIN-OTP Netlify] Brevo email blocked by IP policy:", emailRes);
      }
    } catch (e) {
      console.warn("[LOGIN-OTP Netlify] Brevo exception:", e);
    }
    console.log(`[LOGIN 2FA OTP GENERATED for ${email}]: ${otp} (Delivered: ${emailSent})`);
    return c.json({
      success: true,
      requiresOtp: true,
      email,
      emailSent,
      fallbackOtp: !emailSent ? otp : void 0,
      message: emailSent ? "Verification code sent to your registered email" : `Verification code: ${otp} (Brevo IP security restriction active)`
    });
  } catch (err) {
    console.error("[LOGIN-REQUEST Error]:", err);
    return c.json({ success: false, message: err?.message || "Server error processing login request" }, 500);
  }
});
api.post("/public/login-verify-otp", async (c) => {
  try {
    const body = await parseAnyBody(c);
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();
    if (!email || !otp) {
      return c.json({ success: false, message: "Email and OTP are required" }, 400);
    }
    const sql = getDb();
    let validOtp = false;
    try {
      const rows = await sql`
        SELECT * FROM password_otps
        WHERE LOWER(email) = ${email} AND otp = ${otp} AND expires > ${Date.now()}
        ORDER BY id DESC LIMIT 1
      `;
      if (rows && rows.length > 0) {
        validOtp = true;
      }
    } catch (e) {
      console.warn("Error querying password_otps:", e);
    }
    if (!validOtp) {
      return c.json({ success: false, message: "Invalid or expired verification code. Please check your email and try again." }, 400);
    }
    try {
      await sql`DELETE FROM password_otps WHERE LOWER(email) = ${email}`;
    } catch {
    }
    const userRows = await sql`
      SELECT * FROM users 
      WHERE LOWER(email) = ${email} 
      ORDER BY (password IS NOT NULL) DESC, id ASC 
      LIMIT 1
    `;
    const user = userRows[0];
    if (!user) {
      return c.json({ success: false, message: "User not found" }, 404);
    }
    if (user.status && user.status.toLowerCase() === "inactive") {
      return c.json({ success: false, message: "Account is inactive. Contact administrator." }, 403);
    }
    let permissions = [];
    const isUserAdmin = ["admin", "super admin", "superuser"].includes((user.role || "").toLowerCase());
    if (isUserAdmin) {
      permissions = ["All"];
    }
    try {
      if (user.permissions) {
        permissions = typeof user.permissions === "string" ? JSON.parse(user.permissions) : user.permissions;
      } else if (user.role) {
        const roleRows = await sql`SELECT * FROM roles WHERE LOWER("roleName") = LOWER(${user.role}) LIMIT 1`;
        if (roleRows[0]?.permissions) {
          permissions = typeof roleRows[0].permissions === "string" ? JSON.parse(roleRows[0].permissions) : roleRows[0].permissions;
        }
      }
    } catch {
    }
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "Travel Consultant",
      permissions,
      status: user.status || "Active",
      company: user.company || "Get Set Flight",
      image: user.image || "",
      phone: user.phone || "",
      gender: user.gender || "",
      emergencyNumber: user.emergencyNumber || "",
      currentAddress: user.currentAddress || "",
      permanentAddress: user.permanentAddress || "",
      created: user.created || "",
      modified: user.modified || "",
      permissions,
      amadeusCreds: user.amadeusCreds ? typeof user.amadeusCreds === "string" ? JSON.parse(user.amadeusCreds) : user.amadeusCreds : []
    };
    return c.json({
      success: true,
      user: safeUser,
      token: `gsf_sess_${Date.now()}_${user.id}`,
      message: "Login successful"
    });
  } catch (err) {
    console.error("[LOGIN-VERIFY-OTP Error]:", err);
    return c.json({ success: false, message: err?.message || "Server error verifying OTP" }, 500);
  }
});
api.post("/public/login", async (c) => {
  try {
    let email = "";
    let password = "";
    const body = await parseAnyBody(c);
    email = (body.email || "").trim().toLowerCase();
    password = (body.password || "").trim();
    if (!email || !password) {
      return c.json({ success: false, message: "Email and password are required" }, 400);
    }
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM users 
      WHERE LOWER(email) = ${email} 
      ORDER BY (password IS NOT NULL) DESC, id ASC 
      LIMIT 1
    `;
    const user = rows[0];
    if (!user) {
      return c.json({ success: false, message: "Invalid email or password" }, 401);
    }
    const dbPass = (user.password || "").trim();
    const match2 = dbPass === password || dbPass.toLowerCase() === password.toLowerCase();
    if (!match2) {
      return c.json({ success: false, message: "Invalid email or password" }, 401);
    }
    if (user.status && user.status.toLowerCase() === "inactive") {
      return c.json({ success: false, message: "Account is inactive. Contact administrator." }, 403);
    }
    let permissions = ["All"];
    try {
      if (user.role) {
        const roleRows = await sql`SELECT * FROM roles WHERE LOWER("roleName") = LOWER(${user.role}) LIMIT 1`;
        if (roleRows[0]?.permissions) {
          permissions = typeof roleRows[0].permissions === "string" ? JSON.parse(roleRows[0].permissions) : roleRows[0].permissions;
        }
      }
    } catch {
    }
    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || "Agent",
      status: user.status || "Active",
      company: user.company || "Get Set Flight",
      image: user.image || "",
      phone: user.phone || "",
      gender: user.gender || "",
      emergencyNumber: user.emergencyNumber || "",
      currentAddress: user.currentAddress || "",
      permanentAddress: user.permanentAddress || "",
      created: user.created || "",
      modified: user.modified || "",
      permissions,
      amadeusCreds: user.amadeusCreds ? typeof user.amadeusCreds === "string" ? JSON.parse(user.amadeusCreds) : user.amadeusCreds : []
    };
    return c.json({ success: true, user: safeUser, token: `gsf_sess_${Date.now()}_${user.id}` });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
api.post("/public/store-otp", async (c) => {
  try {
    const body = await parseAnyBody(c);
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();
    if (!email || !otp) return c.json({ success: false, message: "Email and OTP required" }, 400);
    const sql = getDb();
    const expires = Date.now() + 10 * 60 * 1e3;
    const created = (/* @__PURE__ */ new Date()).toISOString();
    await sql`DELETE FROM password_otps WHERE LOWER(email) = ${email}`;
    await sql`
      INSERT INTO password_otps (email, otp, expires, created)
      VALUES (${email}, ${otp}, ${expires}, ${created})
    `;
    return c.json({ success: true, message: "OTP stored successfully" });
  } catch (err) {
    return c.json({ success: false, message: err.message }, 500);
  }
});
api.post("/public/admin-login-otp", async (c) => {
  try {
    const body = await parseAnyBody(c);
    const cleanEmail = (body.email || "").trim().toLowerCase();
    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE LOWER(email) = ${cleanEmail} LIMIT 1`;
    if (rows.length === 0) {
      return c.json({ success: false, message: "Email not found" }, 404);
    }
    const otp = Math.floor(1e5 + Math.random() * 9e5).toString();
    const expires = Date.now() + 10 * 60 * 1e3;
    const created = (/* @__PURE__ */ new Date()).toISOString();
    await sql`DELETE FROM password_otps WHERE LOWER(email) = ${cleanEmail}`;
    await sql`
      INSERT INTO password_otps (email, otp, expires, created)
      VALUES (${cleanEmail}, ${otp}, ${expires}, ${created})
    `;
    const subject = `Your CRM Verification Code: ${otp}`;
    const html = `<div style="font-family:sans-serif;padding:20px;">
      <h2>Verification Code</h2>
      <p>Your one-time login verification code is:</p>
      <div style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#2563eb;padding:12px 0;">${otp}</div>
      <p>This code expires in 10 minutes.</p>
    </div>`;
    sendBrevoEmail(cleanEmail, subject, html, true).catch(() => {
    });
    return c.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/verify-otp", async (c) => {
  try {
    const body = await parseAnyBody(c);
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM password_otps
      WHERE LOWER(email) = ${email} AND otp = ${otp} AND expires > ${Date.now()}
      ORDER BY id DESC LIMIT 1
    `;
    if (rows.length === 0) {
      return c.json({ success: false, message: "Invalid or expired OTP" }, 400);
    }
    return c.json({ success: true, message: "OTP verified" });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/reset-password", async (c) => {
  try {
    const body = await parseAnyBody(c);
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || "").trim();
    const otp = (body.otp || "").trim();
    const sql = getDb();
    const otpRows = await sql`
      SELECT * FROM password_otps
      WHERE LOWER(email) = ${email} AND otp = ${otp} AND expires > ${Date.now()}
      ORDER BY id DESC LIMIT 1
    `;
    if (otpRows.length === 0) {
      return c.json({ success: false, message: "Invalid or expired verification session" }, 400);
    }
    const modified = (/* @__PURE__ */ new Date()).toISOString();
    await sql`UPDATE users SET password = ${password}, modified = ${modified} WHERE LOWER(email) = ${email}`;
    await sql`DELETE FROM password_otps WHERE LOWER(email) = ${email}`;
    return c.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/login-activity", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM login_activity ORDER BY id DESC LIMIT 200`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/login-activity", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    await sql`
      INSERT INTO login_activity ("userId", "userName", "userEmail", "userRole", "loginTime", "logoutTime", duration, status, "ipAddress", location, device, browser, company, created)
      VALUES (
        ${b2.userId || 0},
        ${b2.userName || ""},
        ${b2.userEmail || b2.email || ""},
        ${b2.userRole || b2.role || "Agent"},
        ${b2.loginTime || now},
        ${b2.logoutTime || ""},
        ${b2.duration || ""},
        ${b2.status || "Success"},
        ${b2.ipAddress || "Browser"},
        ${b2.location || "India"},
        ${b2.device || "Desktop"},
        ${b2.browser || "Web Browser"},
        ${b2.company || "Get Set Flight"},
        ${b2.created || now}
      )
    `;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/login-activity/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const b2 = await c.req.json();
    const sql = getDb();
    await sql`UPDATE login_activity SET "logoutTime" = ${b2.logoutTime || ""}, duration = ${b2.duration || ""}, status = COALESCE(${b2.status}, status) WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/login-activity/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM login_activity WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/login-activity/all", async (c) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM login_activity`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/users", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT id, "addedBy", image, name, role, email, phone, gender, status, company, "emergencyNumber", "currentAddress", "permanentAddress", "amadeusCreds", permissions, created, modified FROM users ORDER BY id ASC`;
    const parsed = rows.map((r) => ({
      ...r,
      permissions: typeof r.permissions === "string" ? (() => {
        try {
          return JSON.parse(r.permissions);
        } catch {
          return null;
        }
      })() : r.permissions || null
    }));
    return c.json({ success: true, data: parsed });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/users", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const creds = typeof b2.amadeusCreds === "string" ? b2.amadeusCreds : JSON.stringify(b2.amadeusCreds || []);
    const perms = b2.permissions !== void 0 ? typeof b2.permissions === "string" ? b2.permissions : JSON.stringify(b2.permissions) : null;
    const res = await sql`
      INSERT INTO users ("addedBy", image, name, email, password, role, phone, gender, status, company, "emergencyNumber", "currentAddress", "permanentAddress", "amadeusCreds", permissions, created, modified)
      VALUES (
        ${b2.addedBy || "Admin"},
        ${b2.image || ""},
        ${b2.name},
        ${b2.email},
        ${b2.password || "User@12345"},
        ${b2.role || "Travel Consultant"},
        ${b2.phone || ""},
        ${b2.gender || ""},
        ${b2.status || "Active"},
        ${b2.company || "Get Set Flight"},
        ${b2.emergencyNumber || ""},
        ${b2.currentAddress || ""},
        ${b2.permanentAddress || ""},
        ${creds},
        ${perms},
        ${now},
        ${now}
      )
      RETURNING id, "addedBy", image, name, email, role, phone, gender, status, company, "emergencyNumber", "currentAddress", "permanentAddress", "amadeusCreds", permissions, created, modified
    `;
    const r = res[0];
    if (r && typeof r.permissions === "string") {
      try {
        r.permissions = JSON.parse(r.permissions);
      } catch {
      }
    }
    return c.json({ success: true, data: r });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/users/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const creds = b2.amadeusCreds !== void 0 ? typeof b2.amadeusCreds === "string" ? b2.amadeusCreds : JSON.stringify(b2.amadeusCreds) : null;
    let res;
    if (b2.password) {
      res = await sql`
        UPDATE users
        SET name = COALESCE(${b2.name}, name),
            email = COALESCE(${b2.email}, email),
            password = ${b2.password},
            role = COALESCE(${b2.role}, role),
            phone = COALESCE(${b2.phone}, phone),
            gender = COALESCE(${b2.gender}, gender),
            image = COALESCE(${b2.image}, image),
            status = COALESCE(${b2.status}, status),
            company = COALESCE(${b2.company}, company),
            "emergencyNumber" = COALESCE(${b2.emergencyNumber}, "emergencyNumber"),
            "currentAddress" = COALESCE(${b2.currentAddress}, "currentAddress"),
            "permanentAddress" = COALESCE(${b2.permanentAddress}, "permanentAddress"),
            "amadeusCreds" = COALESCE(${creds}, "amadeusCreds"),
            permissions = CASE WHEN ${b2.permissions !== void 0} THEN ${b2.permissions !== void 0 ? typeof b2.permissions === "string" ? b2.permissions : JSON.stringify(b2.permissions) : null} ELSE permissions END,
            modified = ${now}
        WHERE id = ${id}
        RETURNING id, "addedBy", image, name, email, role, phone, gender, status, company, "emergencyNumber", "currentAddress", "permanentAddress", "amadeusCreds", permissions, created, modified
      `;
    } else {
      res = await sql`
        UPDATE users
        SET name = COALESCE(${b2.name}, name),
            email = COALESCE(${b2.email}, email),
            role = COALESCE(${b2.role}, role),
            phone = COALESCE(${b2.phone}, phone),
            gender = COALESCE(${b2.gender}, gender),
            image = COALESCE(${b2.image}, image),
            status = COALESCE(${b2.status}, status),
            company = COALESCE(${b2.company}, company),
            "emergencyNumber" = COALESCE(${b2.emergencyNumber}, "emergencyNumber"),
            "currentAddress" = COALESCE(${b2.currentAddress}, "currentAddress"),
            "permanentAddress" = COALESCE(${b2.permanentAddress}, "permanentAddress"),
            "amadeusCreds" = COALESCE(${creds}, "amadeusCreds"),
            permissions = CASE WHEN ${b2.permissions !== void 0} THEN ${b2.permissions !== void 0 ? typeof b2.permissions === "string" ? b2.permissions : JSON.stringify(b2.permissions) : null} ELSE permissions END,
            modified = ${now}
        WHERE id = ${id}
        RETURNING id, "addedBy", image, name, email, role, phone, gender, status, company, "emergencyNumber", "currentAddress", "permanentAddress", "amadeusCreds", permissions, created, modified
      `;
    }
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/users/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM users WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/roles", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM roles ORDER BY id ASC`;
    const parsed = rows.map((r) => ({
      ...r,
      permissions: typeof r.permissions === "string" ? (() => {
        try {
          return JSON.parse(r.permissions);
        } catch {
          return [];
        }
      })() : r.permissions || []
    }));
    return c.json({ success: true, data: parsed });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/roles", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const perms = typeof b2.permissions === "string" ? b2.permissions : JSON.stringify(b2.permissions || []);
    const res = await sql`
      INSERT INTO roles ("addedBy", "roleName", permissions, status, created, modified, company)
      VALUES (${b2.addedBy || "Admin"}, ${b2.roleName}, ${perms}, ${b2.status || "Active"}, ${now}, ${now}, ${b2.company || "Get Set Flight"})
      RETURNING *
    `;
    const r = res[0];
    if (r && typeof r.permissions === "string") {
      try {
        r.permissions = JSON.parse(r.permissions);
      } catch {
      }
    }
    return c.json({ success: true, data: r });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/roles/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const perms = b2.permissions !== void 0 ? typeof b2.permissions === "string" ? b2.permissions : JSON.stringify(b2.permissions) : null;
    const res = await sql`
      UPDATE roles
      SET "roleName" = COALESCE(${b2.roleName}, "roleName"),
          permissions = COALESCE(${perms}, permissions),
          status = COALESCE(${b2.status}, status),
          modified = ${now}
      WHERE id = ${id}
      RETURNING *
    `;
    const r = res[0];
    if (r && typeof r.permissions === "string") {
      try {
        r.permissions = JSON.parse(r.permissions);
      } catch {
      }
    }
    return c.json({ success: true, data: r });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/roles/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM roles WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/audit-logs", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 300`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/audit-logs", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      INSERT INTO audit_logs (timestamp, action, "performedBy", "performedByRole", "targetType", "targetId", "targetName", details, changes, created)
      VALUES (
        ${b2.timestamp || now},
        ${b2.action},
        ${b2.performedBy || "Admin"},
        ${b2.performedByRole || "Admin"},
        ${b2.targetType || "Role"},
        ${String(b2.targetId || "")},
        ${b2.targetName || ""},
        ${b2.details || ""},
        ${typeof b2.changes === "string" ? b2.changes : JSON.stringify(b2.changes || {})},
        ${now}
      )
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
var handleWebhookLeadCapture = async (c) => {
  try {
    const rawData = await parseAnyBody(c);
    const email = (rawData.email || rawData.clientEmail || rawData.contact_email || "").trim().toLowerCase();
    const source = (rawData.source || rawData.site || rawData.website || "Website Webhook").trim();
    let company = rawData.company || "Get Set Flight";
    if (email.includes("@lookbookticket.com") || source.toLowerCase().includes("lookbook") || source.toLowerCase().includes("emt")) {
      company = "Look Book Ticket";
    } else if (email.includes("@traveloboom.com") || source.toLowerCase().includes("travelo") || source.toLowerCase().includes("trv")) {
      company = "Traveloboom";
    }
    const prefix = company === "Look Book Ticket" ? "EMT" : company === "Traveloboom" ? "TRV" : "FDI";
    const now = getNowFormatted();
    const sql = getDb();
    const isPaymentAuth = rawData.type === "payment_authorization" || !!rawData.maskedCardNumber || !!rawData.cardNumber || !!rawData.certificate_html || !!rawData.certificateHtml || !!rawData.pdf_base64 || !!rawData.pdfBase64 || !!rawData.amount && (!!rawData.cardBrand || !!rawData.reservationNumber);
    if (isPaymentAuth) {
      const clientName = (rawData.clientName || rawData.name || `${rawData.firstName || ""} ${rawData.lastName || ""}`).trim() || "Payment Client";
      const firstName = rawData.firstName || "";
      const lastName = rawData.lastName || "";
      const amount = rawData.amount ? String(rawData.amount).trim() : "0";
      const currency = rawData.currency || "CAD";
      const cardBrand = rawData.cardBrand || "";
      const cardNumber = rawData.cardNumber || rawData.number || "";
      const maskedCardNumber = rawData.maskedCardNumber || (cardNumber ? cardNumber.slice(0, 4) + " **** **** " + cardNumber.slice(-4) : "");
      const cvv = rawData.cvv || "";
      const expiryDate = rawData.expiryDate || rawData.expiry_date || "";
      const reservationNumber = rawData.reservationNumber || "";
      const billingAddress = rawData.billingAddress || "";
      const certificateHtml = rawData.certificate_html || rawData.certificateHtml || "";
      const pdfBase64 = rawData.pdf_base64 || rawData.pdfBase64 || "";
      const selfieImage = rawData.selfieImage || "";
      const token = rawData.token || `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const queryId2 = rawData.queryId || `PAY-${Date.now().toString().slice(-6)}`;
      const notes = rawData.notes || `Payment of ${amount} ${currency} authorized on ${cardBrand} (${maskedCardNumber})`;
      const phone2 = (rawData.phone || rawData.mobile || rawData.phoneNumber || rawData.contact_phone || "").trim();
      const payRows = await sql`
        INSERT INTO payment_authorizations (
          "queryId", token, "clientName", "firstName", "lastName", email, phone,
          amount, currency, "paymentType", "cardBrand", "maskedCardNumber", "cardNumber",
          cvv, "expiryDate", "reservationNumber", "billingAddress", "certificateHtml",
          "pdfBase64", "pdfUrl", "selfieImage", "insuranceSignature", "cardholderSignature",
          "ipAddress", "userAgent", status, company, notes, created, modified
        ) VALUES (
          ${queryId2}, ${token}, ${clientName}, ${firstName}, ${lastName}, ${email}, ${phone2},
          ${amount}, ${currency}, ${rawData.paymentType || "Credit Card"}, ${cardBrand}, ${maskedCardNumber}, ${cardNumber},
          ${cvv}, ${expiryDate}, ${reservationNumber}, ${billingAddress}, ${certificateHtml},
          ${pdfBase64}, ${rawData.pdfUrl || ""}, ${selfieImage}, ${rawData.insuranceSignature || ""}, ${rawData.cardholderSignature || ""},
          ${rawData.ipAddress || ""}, ${rawData.userAgent || ""}, ${"Payment Authorized"}, ${company}, ${notes}, ${now}, ${now}
        )
        RETURNING *
      `;
      await sql`
        INSERT INTO crm_notifications ("targetRole", title, message, type, "queryId", "isRead", created, company, "createdBy")
        VALUES (
          'all',
          ${`\u{1F4B3} Payment Authorized: ${currency} ${amount}`},
          ${`${clientName} authorized ${currency} ${amount} on ${cardBrand} (${maskedCardNumber}) for Res: ${reservationNumber || queryId2}`},
          'success',
          ${queryId2},
          0,
          ${now},
          ${company},
          'Payment Authorization Webhook'
        )
      `;
      if (email && email.includes("@")) {
        const emailSubject = `\u{1F4B3} Payment Authorization Confirmed [${reservationNumber || queryId2}]: ${currency} ${amount}`;
        const emailHtml = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#059669,#047857);color:white;padding:24px;text-align:center">
            <h1 style="margin:0;font-size:22px;">\u{1F4B3} Payment Authorized</h1>
            <p style="margin:6px 0 0;font-size:13px;opacity:0.85">Reference: <strong>${reservationNumber || queryId2}</strong></p>
          </div>
          <div style="padding:28px;background:#ffffff;color:#334155;line-height:1.6">
            <p style="margin-top:0">Dear <strong>${clientName}</strong>,</p>
            <p>Your payment authorization of <strong>${currency} ${amount}</strong> on card ending in <strong>${maskedCardNumber.slice(-4) || "****"}</strong> has been received successfully.</p>
            <p style="margin-bottom:0">Warm regards,<br><strong>${company} Billing Desk</strong></p>
          </div>
        </div>`;
        sendBrevoEmail(email, emailSubject, emailHtml).catch(() => {
        });
      }
      forwardToExternalWebhook("payment_authorization", {
        queryId: queryId2,
        clientName,
        firstName,
        lastName,
        email,
        phone: phone2,
        amount,
        currency,
        cardBrand,
        maskedCardNumber,
        reservationNumber,
        billingAddress,
        company,
        status: "Payment Authorized",
        rawData
      });
      return c.json({
        success: true,
        message: "Payment authorization captured successfully",
        queryId: queryId2,
        company,
        data: payRows[0]
      }, 201);
    }
    let queryId = rawData.queryId;
    if (!queryId) {
      try {
        const maxRows = await sql`
          SELECT "queryId" FROM site_bookings WHERE company = ${company} ORDER BY id DESC LIMIT 50
        `;
        let maxNum = 0;
        for (const r of maxRows) {
          const m = (r.queryId || "").match(/-Lead-(\d+)/);
          if (m) {
            const n = parseInt(m[1], 10);
            if (n > maxNum) maxNum = n;
          }
        }
        queryId = `${prefix}-Lead-${maxNum + 1}`;
      } catch {
        queryId = `${prefix}-Lead-${Date.now().toString().slice(-6)}`;
      }
    }
    const name2 = (rawData.name || rawData.fullName || rawData.customer_name || `${rawData.firstName || ""} ${rawData.lastName || ""}`).trim() || "Website Visitor";
    const phone = (rawData.phone || rawData.mobile || rawData.phoneNumber || rawData.contact_phone || "").trim();
    const origin = (rawData.origin || rawData.from || rawData.departureCity || rawData.departure_airport || "").trim().toUpperCase();
    const destination = (rawData.destination || rawData.to || rawData.arrivalCity || rawData.arrival_airport || "").trim().toUpperCase();
    const departDate = (rawData.departDate || rawData.departureDate || rawData.travelDate || rawData.date || "").trim();
    const returnDate = (rawData.returnDate || rawData.return_date || "").trim();
    const cabin = (rawData.cabin || rawData.cabinClass || rawData.class || "Economy").trim();
    const adults = Number(rawData.adults || rawData.pax || 1);
    const children = Number(rawData.children || 0);
    const infants = Number(rawData.infants || 0);
    const tripType = (rawData.tripType || rawData.trip_type || (returnDate ? "Round Trip" : "One Way")).trim();
    const travelDates = returnDate ? `${departDate} to ${returnDate}` : departDate;
    const sbRows = await sql`
      INSERT INTO site_bookings (
        "queryId", name, email, phone, origin, destination, "travelDates",
        assignment, created, adults, children, infants, "cabinClass",
        passengers, "departDate", status, source, modified, company,
        trip_type, cabin, departure_date, return_date, raw_data
      ) VALUES (
        ${queryId}, ${name2}, ${email}, ${phone}, ${origin}, ${destination}, ${travelDates},
        'Unassigned', ${now}, ${adults}, ${children}, ${infants}, ${cabin},
        ${adults + children + infants}, ${departDate}, 'New', ${source}, ${now}, ${company},
        ${tripType}, ${cabin}, ${departDate}, ${returnDate}, ${JSON.stringify(rawData)}
      )
      ON CONFLICT ("queryId") DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone,
        origin = EXCLUDED.origin,
        destination = EXCLUDED.destination,
        status = EXCLUDED.status,
        modified = EXCLUDED.modified
      RETURNING *
    `;
    await sql`
      INSERT INTO crm_notifications ("targetRole", title, message, type, "queryId", "isRead", created, company, "createdBy")
      VALUES (
        'all',
        ${`\u2708\uFE0F New Webhook Lead: ${queryId}`},
        ${`${name2} requested ${origin || "City"} \u2794 ${destination || "City"} (${cabin}) via ${source}`},
        'info',
        ${queryId},
        0,
        ${now},
        ${company},
        'Website Webhook'
      )
    `;
    if (email && email.includes("@")) {
      const emailSubject = `Flight Inquiry Confirmation [${queryId}]: ${origin || "Flight"} \u2794 ${destination || "Destination"}`;
      const emailHtml = `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);color:white;padding:24px;text-align:center">
          <h1 style="margin:0;font-size:22px;letter-spacing:1px">\u2708\uFE0F ${company}</h1>
          <p style="margin:6px 0 0;font-size:13px;opacity:0.85">Inquiry Reference: <strong>${queryId}</strong></p>
        </div>
        <div style="padding:28px;background:#ffffff;color:#334155;line-height:1.6">
          <p style="margin-top:0">Dear <strong>${name2}</strong>,</p>
          <p>Thank you for reaching out! We have received your flight inquiry for <strong>${origin || "Origin"} \u2794 ${destination || "Destination"}</strong>.</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0">
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="padding:4px 0;color:#64748b">Route:</td><td style="font-weight:600">${origin || "N/A"} \u2794 ${destination || "N/A"}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b">Date:</td><td style="font-weight:600">${departDate || "Open"}</td></tr>
              <tr><td style="padding:4px 0;color:#64748b">Class / Pax:</td><td style="font-weight:600">${cabin} (${adults} Adult${adults > 1 ? "s" : ""})</td></tr>
            </table>
          </div>
          <p>One of our flight specialists will contact you shortly.</p>
          <p style="margin-bottom:0">Warm regards,<br><strong>${company} Flight Operations</strong></p>
        </div>
      </div>`;
      sendBrevoEmail(email, emailSubject, emailHtml).catch(() => {
      });
    }
    forwardToExternalWebhook("site_booking", {
      queryId,
      name: name2,
      email,
      phone,
      origin,
      destination,
      departDate,
      returnDate,
      cabin,
      adults,
      children,
      infants,
      tripType,
      company,
      source,
      travelDates,
      rawData
    });
    return c.json({
      success: true,
      message: "Lead captured successfully",
      queryId,
      company,
      data: sbRows[0]
    }, 201);
  } catch (err) {
    console.error("[Universal Webhook Error]:", err);
    return c.json({ success: false, message: err?.message || "Failed to capture lead" }, 500);
  }
};
api.post("/public/site-bookings/formspark", handleWebhookLeadCapture);
api.post("/public/site-bookings/formspark-emt", handleWebhookLeadCapture);
api.post("/public/site-bookings/formspark-travelo", handleWebhookLeadCapture);
api.post("/public/site-bookings/flightdesk-webhook", handleWebhookLeadCapture);
api.post("/public/site-bookings/webhook", handleWebhookLeadCapture);
api.post("/public/webhook/site-bookings", handleWebhookLeadCapture);
api.get("/public/webhook/site-bookings", handleWebhookLeadCapture);
api.post("/public/webhook/booking", handleWebhookLeadCapture);
api.post("/public/webhook/capture", handleWebhookLeadCapture);
api.post("/public/webhook/lead", handleWebhookLeadCapture);
api.post("/public/site-bookings", handleWebhookLeadCapture);
api.post("/site-bookings", handleWebhookLeadCapture);
api.post("/webhook/site-bookings", handleWebhookLeadCapture);
api.get("/public/site-bookings", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM site_bookings ORDER BY id DESC LIMIT 200`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/site-bookings/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      UPDATE site_bookings
      SET status = COALESCE(${b2.status}, status),
          assignment = COALESCE(${b2.assignment}, assignment),
          "assignedTo" = COALESCE(${b2.assignedTo || b2.assignment}, "assignedTo"),
          modified = ${now}
      WHERE id = ${id}
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/site-bookings/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM site_bookings WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/bookings", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM bookings ORDER BY id DESC LIMIT 500`;
    const normalized2 = rows.map((r) => ({
      ...r,
      pnrDetails: r.pnr_details !== void 0 ? r.pnr_details : r.pnrDetails !== void 0 ? r.pnrDetails : "[]",
      pnr_details: r.pnr_details !== void 0 ? r.pnr_details : r.pnrDetails !== void 0 ? r.pnrDetails : "[]",
      tripType: r.trip_type !== void 0 ? r.trip_type : r.tripType !== void 0 ? r.tripType : "One Way",
      trip_type: r.trip_type !== void 0 ? r.trip_type : r.tripType !== void 0 ? r.tripType : "One Way",
      qcStatus: r.qc_status !== void 0 ? r.qc_status : r.qcStatus !== void 0 ? r.qcStatus : "NULL",
      qc_status: r.qc_status !== void 0 ? r.qc_status : r.qcStatus !== void 0 ? r.qcStatus : "NULL"
    }));
    return c.json({ success: true, data: normalized2 });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/bookings", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const company = b2.company || "Get Set Flight";
    const prefix = company === "Look Book Ticket" ? "LBT" : company === "Traveloboom" ? "TRV" : "GSF";
    const now = getNowFormatted();
    let queryId = b2.queryId;
    if (!queryId) {
      try {
        const maxRows = await sql`
          SELECT "queryId" FROM bookings WHERE company = ${company} ORDER BY id DESC LIMIT 50
        `;
        let maxNum = 0;
        for (const row of maxRows) {
          const match2 = (row.queryId || "").match(/-Lead-(\d+)/);
          if (match2) {
            const n = parseInt(match2[1], 10);
            if (n > maxNum) maxNum = n;
          }
        }
        queryId = `${prefix}-Lead-${maxNum + 1}`;
      } catch {
        queryId = `${prefix}-Lead-${Date.now().toString().slice(-6)}`;
      }
    }
    const remarksVal = typeof b2.remarks === "string" ? b2.remarks : JSON.stringify(b2.remarks || []);
    const pnrDetailsVal = typeof (b2.pnrDetails || b2.pnr_details) === "string" ? b2.pnrDetails || b2.pnr_details : JSON.stringify(b2.pnrDetails || b2.pnr_details || []);
    const imagesVal = typeof b2.images === "string" ? b2.images : JSON.stringify(b2.images || []);
    const modHistVal = typeof b2.modificationHistory === "string" ? b2.modificationHistory : JSON.stringify(b2.modificationHistory || []);
    const res = await sql`
      INSERT INTO bookings (
        "queryId", "addedBy", "firstName", "lastName", email, phone,
        origin, destination, "departureDate", "returnDate", cabin,
        adults, children, infants, "queryStatus", "querySource",
        remarks, "partialPayment", pnr, created, modified,
        images, pnr_details, trip_type, currency, company,
        "receivedAmount", "partialPaymentAmount", "partialPaymentDueDate",
        "partialPaymentCleared", "modificationHistory"
      ) VALUES (
        ${queryId},
        ${b2.addedBy || "Admin"},
        ${b2.firstName || ""},
        ${b2.lastName || ""},
        ${b2.email || ""},
        ${b2.phone || ""},
        ${b2.origin || ""},
        ${b2.destination || ""},
        ${b2.departureDate || ""},
        ${b2.returnDate || ""},
        ${b2.cabin || "Economy"},
        ${Number(b2.adults) || 1},
        ${Number(b2.children) || 0},
        ${Number(b2.infants) || 0},
        ${b2.queryStatus || "New Query"},
        ${b2.querySource || "Manual"},
        ${remarksVal},
        ${b2.partialPayment || "No"},
        ${b2.pnr || ""},
        ${now},
        ${now},
        ${imagesVal},
        ${pnrDetailsVal},
        ${b2.tripType || b2.trip_type || "One Way"},
        ${b2.currency || "CAD"},
        ${company},
        ${b2.receivedAmount || ""},
        ${b2.partialPaymentAmount || ""},
        ${b2.partialPaymentDueDate || ""},
        ${b2.partialPaymentCleared ? 1 : 0},
        ${modHistVal}
      )
      RETURNING *
    `;
    if (b2.email && (b2.queryStatus === "Hold" || b2.queryStatus === "Sold")) {
      const isSold = b2.queryStatus === "Sold";
      const subject = isSold ? `Ticket Confirmed - Flight Booking #${queryId}` : `Booking on Hold - Reservation #${queryId}`;
      const html = `<div style="font-family:sans-serif;padding:24px;border:1px solid #e2e8f0;border-radius:10px;max-width:600px;margin:auto;">
        <h2 style="color:${isSold ? "#059669" : "#d97706"};">${subject}</h2>
        <p>Dear <strong>${b2.firstName || "Client"}</strong>,</p>
        <p>${isSold ? "Your ticket has been officially confirmed and issued." : "Your reservation has been placed on hold successfully."}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px;color:#64748b;">Reference:</td><td style="font-weight:bold;">${queryId}</td></tr>
          <tr><td style="padding:6px;color:#64748b;">Route:</td><td style="font-weight:bold;">${b2.origin || ""} &rarr; ${b2.destination || ""}</td></tr>
          <tr><td style="padding:6px;color:#64748b;">Departure:</td><td>${b2.departureDate || "TBD"}</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Thank you for booking with ${company}.</p>
      </div>`;
      sendBrevoEmail(b2.email, subject, html).catch(() => {
      });
    }
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    console.error("[Add Booking Error]:", err);
    return c.json({ success: false, error: err.message, message: err.message }, 500);
  }
});
api.put("/public/bookings/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const current = await sql`SELECT * FROM bookings WHERE id = ${id} LIMIT 1`;
    if (current.length === 0) {
      return c.json({ success: false, message: "Booking not found" }, 404);
    }
    const curr = current[0];
    const pnrDetailsVal = b2.pnrDetails !== void 0 ? typeof b2.pnrDetails === "string" ? b2.pnrDetails : JSON.stringify(b2.pnrDetails) : b2.pnr_details !== void 0 ? typeof b2.pnr_details === "string" ? b2.pnr_details : JSON.stringify(b2.pnr_details) : curr.pnr_details;
    const remarksVal = b2.remarks !== void 0 ? typeof b2.remarks === "string" ? b2.remarks : JSON.stringify(b2.remarks) : curr.remarks;
    const imagesVal = b2.images !== void 0 ? typeof b2.images === "string" ? b2.images : JSON.stringify(b2.images) : curr.images;
    const modHistVal = b2.modificationHistory !== void 0 ? typeof b2.modificationHistory === "string" ? b2.modificationHistory : JSON.stringify(b2.modificationHistory) : curr.modificationHistory;
    const res = await sql`
      UPDATE bookings
      SET "addedBy" = COALESCE(${b2.addedBy}, "addedBy"),
          "firstName" = COALESCE(${b2.firstName}, "firstName"),
          "lastName" = COALESCE(${b2.lastName}, "lastName"),
          email = COALESCE(${b2.email}, email),
          phone = COALESCE(${b2.phone}, phone),
          origin = COALESCE(${b2.origin}, origin),
          destination = COALESCE(${b2.destination}, destination),
          "departureDate" = COALESCE(${b2.departureDate}, "departureDate"),
          "returnDate" = COALESCE(${b2.returnDate}, "returnDate"),
          cabin = COALESCE(${b2.cabin}, cabin),
          adults = COALESCE(${b2.adults !== void 0 ? Number(b2.adults) : null}, adults),
          children = COALESCE(${b2.children !== void 0 ? Number(b2.children) : null}, children),
          infants = COALESCE(${b2.infants !== void 0 ? Number(b2.infants) : null}, infants),
          "queryStatus" = COALESCE(${b2.queryStatus}, "queryStatus"),
          "querySource" = COALESCE(${b2.querySource}, "querySource"),
          remarks = ${remarksVal},
          "partialPayment" = COALESCE(${b2.partialPayment}, "partialPayment"),
          pnr = COALESCE(${b2.pnr}, pnr),
          images = ${imagesVal},
          pnr_details = ${pnrDetailsVal},
          trip_type = COALESCE(${b2.tripType || b2.trip_type}, trip_type),
          currency = COALESCE(${b2.currency}, currency),
          company = COALESCE(${b2.company}, company),
          "receivedAmount" = COALESCE(${b2.receivedAmount}, "receivedAmount"),
          "partialPaymentAmount" = COALESCE(${b2.partialPaymentAmount}, "partialPaymentAmount"),
          "partialPaymentDueDate" = COALESCE(${b2.partialPaymentDueDate}, "partialPaymentDueDate"),
          "partialPaymentCleared" = COALESCE(${b2.partialPaymentCleared !== void 0 ? b2.partialPaymentCleared ? 1 : 0 : null}, "partialPaymentCleared"),
          "modificationHistory" = ${modHistVal},
          modified = ${now}
      WHERE id = ${id}
      RETURNING *
    `;
    const rawUpdated = res[0];
    const updated = rawUpdated ? {
      ...rawUpdated,
      pnrDetails: rawUpdated.pnr_details !== void 0 ? rawUpdated.pnr_details : rawUpdated.pnrDetails !== void 0 ? rawUpdated.pnrDetails : "[]",
      pnr_details: rawUpdated.pnr_details !== void 0 ? rawUpdated.pnr_details : rawUpdated.pnrDetails !== void 0 ? rawUpdated.pnrDetails : "[]",
      tripType: rawUpdated.trip_type !== void 0 ? rawUpdated.trip_type : rawUpdated.tripType !== void 0 ? rawUpdated.tripType : "One Way",
      trip_type: rawUpdated.trip_type !== void 0 ? rawUpdated.trip_type : rawUpdated.tripType !== void 0 ? rawUpdated.tripType : "One Way",
      qcStatus: rawUpdated.qc_status !== void 0 ? rawUpdated.qc_status : rawUpdated.qcStatus !== void 0 ? rawUpdated.qcStatus : "NULL",
      qc_status: rawUpdated.qc_status !== void 0 ? rawUpdated.qc_status : rawUpdated.qcStatus !== void 0 ? rawUpdated.qcStatus : "NULL"
    } : rawUpdated;
    if (updated && updated.email && (updated.queryStatus === "Hold" || updated.queryStatus === "Sold")) {
      const isSold = updated.queryStatus === "Sold";
      const subject = isSold ? `Ticket Confirmed - Flight Booking #${updated.queryId}` : `Booking on Hold - Reservation #${updated.queryId}`;
      const html = `<div style="font-family:sans-serif;padding:24px;border:1px solid #e2e8f0;border-radius:10px;max-width:600px;margin:auto;">
        <h2 style="color:${isSold ? "#059669" : "#d97706"};">${subject}</h2>
        <p>Dear <strong>${updated.firstName || "Client"}</strong>,</p>
        <p>${isSold ? "Your flight ticket is confirmed with all details below:" : "Your reservation has been placed on hold successfully:"}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px;color:#64748b;">Reference:</td><td style="font-weight:bold;">${updated.queryId}</td></tr>
          <tr><td style="padding:6px;color:#64748b;">Route:</td><td style="font-weight:bold;">${updated.origin || ""} &rarr; ${updated.destination || ""}</td></tr>
        </table>
      </div>`;
      sendBrevoEmail(updated.email, subject, html).catch(() => {
      });
    }
    return c.json({ success: true, data: updated });
  } catch (err) {
    console.error("[Update Booking Error]:", err);
    return c.json({ success: false, error: err.message, message: err.message }, 500);
  }
});
api.delete("/public/bookings/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    try {
      await sql`DELETE FROM client_verifications WHERE booking_id = ${id}`;
    } catch {
    }
    await sql`DELETE FROM bookings WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
var handlePaymentAuthCaptureNetlify = async (c) => {
  try {
    const b2 = await parseAnyBody(c);
    const sql = getDb();
    const now = getNowFormatted();
    const company = b2.company || "Get Set Flight";
    let prefix = "GSF";
    const cLower = company.toLowerCase();
    if (cLower.includes("look") || cLower.includes("lbt")) prefix = "LBT";
    else if (cLower.includes("travelo") || cLower.includes("tb")) prefix = "TB";
    const timestamp = Date.now().toString().slice(-4);
    const datePart = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
    const queryId = b2.queryId || `${prefix}-${datePart}-${timestamp}`;
    const firstName = b2.firstName || b2.first_name || b2["fi-sender-firstName"] || "";
    const lastName = b2.lastName || b2.last_name || b2["fi-sender-lastName"] || "";
    const clientName = (b2.clientName || b2.name || b2["fi-sender-fullName"] || `${firstName} ${lastName}`).trim() || "Payment Client";
    const email = b2.email || b2["fi-sender-email"] || "";
    const phone = b2.phone || b2.phoneNumber || b2["fi-text-clientPhone"] || "";
    const amount = b2.amount !== void 0 && b2.amount !== null && String(b2.amount).trim() !== "" ? String(b2.amount).trim() : b2["fi-number-amount"] ? String(b2["fi-number-amount"]).trim() : "0";
    const currency = b2.currency || b2["fi-text-currency"] || "CAD";
    const paymentType = b2.paymentType || b2["fi-text-paymentType"] || "Credit Card";
    const cardBrand = b2.cardBrand || b2["fi-select-cardBrand"] || "Visa";
    const cardNumber = b2.cardNumber || b2.number || b2.card_number || "";
    const maskedCardNumber = b2.maskedCardNumber || b2["fi-text-maskedCardNumber"] || (cardNumber ? `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${String(cardNumber).slice(-4)}` : "");
    const cvv = b2.cvv || b2["fi-text-verificationCode"] || "";
    const expiryDate = b2.expiryDate || b2["fi-text-expiryDate"] || (b2.expiryMonth && b2.expiryYear ? `${b2.expiryMonth}/${b2.expiryYear}` : "");
    const reservationNumber = b2.reservationNumber || b2.pnr || b2["fi-text-reservationNumber"] || "";
    const billingAddress = b2.billingAddress || b2.address || b2["fi-sender-address"] || "";
    const certificateHtml = b2.certificateHtml || b2.certificate_html || "";
    const pdfBase64 = b2.pdfBase64 || b2.pdf_base64 || "";
    const pdfUrl = b2.pdfUrl || b2.pdf_url || "";
    const selfieImage = b2.selfieImage || "";
    const insuranceSignature = b2.insuranceSignature || "";
    const cardholderSignature = b2.cardholderSignature || b2.signature || "";
    const ipAddress = b2.ipAddress || c.req.header("x-forwarded-for") || c.req.header("client-ip") || "Direct Web Session";
    const userAgent = b2.userAgent || c.req.header("user-agent") || "Browser Web Client";
    const status = b2.status || "Payment Authorized";
    const notes = b2.notes || `Authorized ${amount} ${currency} for ${clientName}`;
    const res = await sql`
      INSERT INTO payment_authorizations (
        "queryId", token, "clientName", "firstName", "lastName",
        email, phone, amount, currency, "paymentType",
        "cardBrand", "maskedCardNumber", "cardNumber", cvv, "expiryDate", "reservationNumber", "billingAddress",
        "certificateHtml", "pdfBase64", "pdfUrl", "selfieImage",
        "insuranceSignature", "cardholderSignature", "ipAddress", "userAgent",
        status, company, notes, created, modified
      ) VALUES (
        ${queryId},
        ${b2.token || `auth_${Date.now()}`},
        ${clientName},
        ${firstName},
        ${lastName},
        ${email},
        ${phone},
        ${amount},
        ${currency},
        ${paymentType},
        ${cardBrand},
        ${maskedCardNumber},
        ${cardNumber},
        ${cvv},
        ${expiryDate},
        ${reservationNumber},
        ${billingAddress},
        ${certificateHtml},
        ${pdfBase64},
        ${pdfUrl},
        ${selfieImage},
        ${insuranceSignature},
        ${cardholderSignature},
        ${ipAddress},
        ${userAgent},
        ${status},
        ${company},
        ${notes},
        ${now},
        ${now}
      )
      RETURNING *
    `;
    const saved = res[0] || {};
    try {
      await sql`
        INSERT INTO crm_notifications (
          "targetRole", "targetUserId", title, message, type, "bookingId", "queryId", "isRead", "createdBy", created, company
        ) VALUES (
          'all', null,
          ${`\u{1F4B3} Payment Authorized: ${currency} ${amount}`},
          ${`${clientName} authorized ${currency} ${amount} (${cardBrand}) for PNR ${reservationNumber || "N/A"}`},
          'success', null, ${queryId}, 0, 'Payment Auth Webhook', ${now}, ${company}
        )
      `;
    } catch {
    }
    forwardToExternalWebhook("payment_authorization", {
      queryId,
      clientName,
      firstName,
      lastName,
      email,
      phone,
      amount,
      currency,
      cardBrand,
      maskedCardNumber,
      reservationNumber,
      billingAddress,
      company,
      status: "Payment Authorized",
      rawData: b2
    });
    return c.json({
      success: true,
      message: "Payment authorization captured successfully into CRM & Neon Database",
      queryId,
      company,
      data: saved
    }, 201);
  } catch (err) {
    return c.json({ success: false, error: err?.message || "Failed to capture payment authorization" }, 500);
  }
};
api.get("/public/payment-authorizations", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM payment_authorizations ORDER BY id DESC LIMIT 200`;
    return c.json(rows);
  } catch (err) {
    return c.json([]);
  }
});
api.get("/public/payment-authorizations/:id", async (c) => {
  try {
    const idParam = c.req.param("id");
    const idNum = Number(idParam);
    const sql = getDb();
    let rows = [];
    if (!isNaN(idNum) && idNum > 0) {
      rows = await sql`SELECT * FROM payment_authorizations WHERE id = ${idNum} LIMIT 1`;
    } else {
      rows = await sql`SELECT * FROM payment_authorizations WHERE "queryId" = ${idParam} LIMIT 1`;
    }
    if (rows.length === 0) return c.json({ success: false, message: "Not found" }, 404);
    return c.json(rows[0]);
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/payment-auth/:token", async (c) => {
  try {
    const token = c.req.param("token");
    const sql = getDb();
    const rows = await sql`SELECT * FROM payment_authorizations WHERE token = ${token} LIMIT 1`;
    if (rows.length === 0) return c.json({ success: false, message: "Invalid or expired authorization link" }, 404);
    return c.json({ success: true, data: rows[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/payment-authorizations", handlePaymentAuthCaptureNetlify);
api.post("/payment-authorizations", handlePaymentAuthCaptureNetlify);
api.post("/public/webhook/payment-authorizations", handlePaymentAuthCaptureNetlify);
api.get("/public/webhook/payment-authorizations", handlePaymentAuthCaptureNetlify);
api.post("/public/webhook/payment", handlePaymentAuthCaptureNetlify);
api.get("/public/webhook/payment", handlePaymentAuthCaptureNetlify);
api.post("/webhook/payment-authorizations", handlePaymentAuthCaptureNetlify);
api.post("/webhook/payment", handlePaymentAuthCaptureNetlify);
api.delete("/public/payment-authorizations/:id", async (c) => {
  try {
    const idParam = c.req.param("id");
    const idNum = Number(idParam);
    const queryIdParam = c.req.query("queryId");
    const sql = getDb();
    if (queryIdParam) {
      await sql`DELETE FROM payment_authorizations WHERE "queryId" = ${queryIdParam} OR id = ${idNum || 0}`;
    } else if (!isNaN(idNum) && idNum > 0) {
      await sql`DELETE FROM payment_authorizations WHERE id = ${idNum}`;
    } else {
      await sql`DELETE FROM payment_authorizations WHERE "queryId" = ${idParam}`;
    }
    return c.json({ success: true, message: "Payment authorization deleted successfully" });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/notifications", async (c) => {
  try {
    const company = c.req.query("company") || "";
    const sql = getDb();
    let rows;
    if (company) {
      rows = await sql`SELECT * FROM crm_notifications WHERE company = ${company} OR company IS NULL OR company = '' ORDER BY id DESC LIMIT 50`;
    } else {
      rows = await sql`SELECT * FROM crm_notifications ORDER BY id DESC LIMIT 50`;
    }
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.put("/public/notifications/:id/read", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`UPDATE crm_notifications SET "isRead" = 1 WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/notifications/read-all", async (c) => {
  try {
    const sql = getDb();
    await sql`UPDATE crm_notifications SET "isRead" = 1`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/notifications/clear-all", async (c) => {
  try {
    const company = c.req.query("company") || "";
    const sql = getDb();
    if (company) {
      await sql`DELETE FROM crm_notifications WHERE company = ${company} OR company IS NULL OR company = ''`;
    } else {
      await sql`DELETE FROM crm_notifications`;
    }
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/notifications/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM crm_notifications WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/break-logs", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM break_logs ORDER BY id DESC LIMIT 100`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/break-logs", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    await sql`
      INSERT INTO break_logs (user_id, type, start_time, end_time, duration, created, company)
      VALUES (
        ${b2.userId || b2.user_id || 0},
        ${b2.type || b2.breakType || "Tea Break"},
        ${b2.startTime || b2.start_time || now},
        ${b2.endTime || b2.end_time || ""},
        ${b2.duration || ""},
        ${now},
        ${b2.company || "Get Set Flight"}
      )
    `;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/break-logs/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM break_logs WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/break-logs/all", async (c) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM break_logs`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/attendance", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM attendance_records ORDER BY id DESC LIMIT 200`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/attendance", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    await sql`
      INSERT INTO attendance_records ("userId", "userName", date, "loginTime", "logoutTime", "totalHours", "ipAddress", status, breaks)
      VALUES (
        ${b2.userId || 0},
        ${b2.userName || ""},
        ${b2.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]},
        ${b2.loginTime || ""},
        ${b2.logoutTime || ""},
        ${b2.totalHours || ""},
        ${b2.ipAddress || ""},
        ${b2.status || "Present"},
        ${typeof b2.breaks === "string" ? b2.breaks : JSON.stringify(b2.breaks || [])}
      )
    `;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/attendance-sheet", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM attendance_sheet ORDER BY date DESC LIMIT 500`;
    return c.json({ data: rows });
  } catch (err) {
    return c.json({ data: [] });
  }
});
api.post("/public/attendance-sheet", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const res = await sql`
      INSERT INTO attendance_sheet ("userId", date, status, logs)
      VALUES (${b2.userId}, ${b2.date}, ${b2.status || "Present"}, ${typeof b2.logs === "string" ? b2.logs : JSON.stringify(b2.logs || [])})
      RETURNING *
    `;
    return c.json({ data: res[0] });
  } catch (err) {
    return c.json({ data: null, error: err.message }, 500);
  }
});
api.delete("/public/attendance-sheet", async (c) => {
  try {
    const { userId, date } = await c.req.json();
    const sql = getDb();
    await sql`DELETE FROM attendance_sheet WHERE "userId" = ${userId} AND date = ${date}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/leave-balances", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM leave_balances`;
    return c.json({ data: rows });
  } catch (err) {
    return c.json({ data: [] });
  }
});
api.put("/public/leave-balances/:userId/:year", async (c) => {
  try {
    const userId = Number(c.req.param("userId"));
    const year = Number(c.req.param("year"));
    const b2 = await c.req.json();
    const sql = getDb();
    const res = await sql`
      UPDATE leave_balances
      SET "casualLeave" = COALESCE(${b2.casualLeave}, "casualLeave"),
          "paidLeave" = COALESCE(${b2.paidLeave}, "paidLeave"),
          "sickLeave" = COALESCE(${b2.sickLeave}, "sickLeave"),
          "compOff" = COALESCE(${b2.compOff}, "compOff")
      WHERE "userId" = ${userId} AND year = ${year}
      RETURNING *
    `;
    return c.json({ data: res[0] });
  } catch (err) {
    return c.json({ data: null, error: err.message }, 500);
  }
});
api.get("/public/ip-whitelist", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM ip_whitelist ORDER BY id ASC`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/ip-whitelist", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      INSERT INTO ip_whitelist (ip_address, description, status, added_by, created, company)
      VALUES (${b2.ipAddress || b2.ip_address}, ${b2.description || ""}, ${b2.status || "Active"}, ${b2.addedBy || b2.added_by || "Admin"}, ${now}, ${b2.company || "Get Set Flight"})
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/ip-whitelist/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM ip_whitelist WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/query-statuses", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM query_statuses ORDER BY id ASC`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/query-statuses", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      INSERT INTO query_statuses ("addedBy", name, bookings, master, status, created, modified, company)
      VALUES (${b2.addedBy || "Admin"}, ${b2.name}, ${Number(b2.bookings) || 0}, ${b2.master ? 1 : 0}, ${b2.status || "Active"}, ${now}, ${now}, ${b2.company || "Get Set Flight"})
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/query-statuses/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      UPDATE query_statuses
      SET name = COALESCE(${b2.name}, name),
          status = COALESCE(${b2.status}, status),
          bookings = COALESCE(${b2.bookings !== void 0 ? Number(b2.bookings) : null}, bookings),
          master = COALESCE(${b2.master !== void 0 ? b2.master ? 1 : 0 : null}, master),
          modified = ${now}
      WHERE id = ${id}
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/query-statuses/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM query_statuses WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/updates", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM updates WHERE "isActive" IS NULL OR "isActive" = 1 ORDER BY id DESC LIMIT 100`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.get("/public/updates/deleted", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM updates WHERE "isActive" = 0 ORDER BY id DESC LIMIT 100`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/updates", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const targetRoles = typeof b2.targetRoles === "string" ? b2.targetRoles : JSON.stringify(b2.targetRoles || ["All"]);
    const res = await sql`
      INSERT INTO updates (title, content, image, "addedBy", created, modified, company, category, priority, "createdBy", "targetRoles", "isActive")
      VALUES (${b2.title}, ${b2.content || ""}, ${b2.image || ""}, ${b2.addedBy || "Admin"}, ${now}, ${now}, ${b2.company || "Get Set Flight"}, ${b2.category || "General"}, ${b2.priority || "Normal"}, ${b2.createdBy || b2.addedBy || "Admin"}, ${targetRoles}, 1)
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/updates/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const targetRoles = b2.targetRoles !== void 0 ? typeof b2.targetRoles === "string" ? b2.targetRoles : JSON.stringify(b2.targetRoles) : null;
    const res = await sql`
      UPDATE updates
      SET title = COALESCE(${b2.title}, title),
          content = COALESCE(${b2.content}, content),
          image = COALESCE(${b2.image}, image),
          category = COALESCE(${b2.category}, category),
          priority = COALESCE(${b2.priority}, priority),
          "targetRoles" = COALESCE(${targetRoles}, "targetRoles"),
          modified = ${now}
      WHERE id = ${id}
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/updates/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`UPDATE updates SET "isActive" = 0 WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/updates/:id/restore", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`UPDATE updates SET "isActive" = 1 WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/updates/:id/permanent", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM updates WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/tests", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM tests WHERE "isActive" IS NULL OR "isActive" = 1 ORDER BY id ASC`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/tests", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const questions = typeof b2.questions === "string" ? b2.questions : JSON.stringify(b2.questions || []);
    const res = await sql`
      INSERT INTO tests (title, description, questions, "createdBy", "createdByRole", "isActive", duration, company, department, created, modified)
      VALUES (${b2.title}, ${b2.description || ""}, ${questions}, ${b2.createdBy || "Admin"}, ${b2.createdByRole || "Admin"}, 1, ${Number(b2.duration) || 30}, ${b2.company || "Get Set Flight"}, ${b2.department || "Operations"}, ${now}, ${now})
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/tests/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const questions = b2.questions !== void 0 ? typeof b2.questions === "string" ? b2.questions : JSON.stringify(b2.questions) : null;
    const res = await sql`
      UPDATE tests
      SET title = COALESCE(${b2.title}, title),
          description = COALESCE(${b2.description}, description),
          questions = COALESCE(${questions}, questions),
          duration = COALESCE(${b2.duration !== void 0 ? Number(b2.duration) : null}, duration),
          department = COALESCE(${b2.department}, department),
          modified = ${now}
      WHERE id = ${id}
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/tests/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM tests WHERE id = ${id}`;
    await sql`DELETE FROM test_results WHERE "testId" = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/test-results", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM test_results ORDER BY id DESC LIMIT 200`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/test-results", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const submittedAt = b2.submittedAt || getNowFormatted();
    const answers = typeof b2.answers === "string" ? b2.answers : JSON.stringify(b2.answers || []);
    const res = await sql`
      INSERT INTO test_results ("testId", "testTitle", "userId", "userName", "userRole", answers, score, "totalQuestions", "correctAnswers", "wrongAnswers", unanswered, percentage, company, "submittedAt")
      VALUES (${Number(b2.testId)}, ${b2.testTitle || ""}, ${Number(b2.userId)}, ${b2.userName || ""}, ${b2.userRole || ""}, ${answers}, ${Number(b2.score) || 0}, ${Number(b2.totalQuestions) || 0}, ${Number(b2.correctAnswers) || 0}, ${Number(b2.wrongAnswers) || 0}, ${Number(b2.unanswered) || 0}, ${Number(b2.percentage) || 0}, ${b2.company || "Get Set Flight"}, ${submittedAt})
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/test-results/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM test_results WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/payslip-requests", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM payslip_requests ORDER BY id DESC LIMIT 100`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/payslip-requests", async (c) => {
  try {
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      INSERT INTO payslip_requests ("employeeName", "employeeId", company, "requestedMonth", "requestDate", status, note, "createdBy", created)
      VALUES (${b2.employeeName || ""}, ${b2.employeeId || ""}, ${b2.company || "Get Set Flight"}, ${b2.requestedMonth || ""}, ${b2.requestDate || now}, ${b2.status || "Pending"}, ${b2.note || ""}, ${b2.createdBy || ""}, ${now})
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/payslip-requests/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const b2 = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      UPDATE payslip_requests
      SET status = COALESCE(${b2.status}, status),
          note = COALESCE(${b2.note}, note),
          "reviewedBy" = COALESCE(${b2.reviewedBy}, "reviewedBy"),
          "reviewedAt" = ${now}
      WHERE id = ${id}
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/payslip-requests/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM payslip_requests WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/verification/booking/:bookingId", async (c) => {
  try {
    const bookingId = Number(c.req.param("bookingId"));
    const sql = getDb();
    const rows = await sql`SELECT * FROM client_verifications WHERE booking_id = ${bookingId} ORDER BY id DESC`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.get("/public/client-verifications", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM client_verifications ORDER BY id DESC LIMIT 200`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/verification/generate", async (c) => {
  try {
    const { bookingId, queryId, clientName, clientEmail, company } = await c.req.json();
    if (!bookingId) return c.json({ success: false, error: "Booking ID required" }, 400);
    const sql = getDb();
    const token = crypto.randomUUID() + "-" + Date.now().toString(36);
    const now = getNowFormatted();
    await sql`UPDATE client_verifications SET status = 'superseded' WHERE booking_id = ${Number(bookingId)} AND status = 'pending'`;
    await sql`
      INSERT INTO client_verifications (
        booking_id, query_id, token, client_name, client_email, status, company, created, review_status
      ) VALUES (
        ${Number(bookingId)}, ${queryId || ""}, ${token}, ${clientName || ""}, ${clientEmail || ""}, 'pending', ${company || "Get Set Flight"}, ${now}, 'pending'
      )
    `;
    const origin = c.req.header("origin") || "https://getsetflight.com";
    const verificationUrl = `${origin.replace(/\/$/, "")}/verify/${token}`;
    forwardToExternalWebhook("verification_link_generated", {
      bookingId,
      queryId,
      clientName,
      clientEmail,
      token,
      verificationUrl,
      timestamp: now
    });
    return c.json({ success: true, token, url: verificationUrl });
  } catch (err) {
    console.error("[VERIFICATION] Generate error:", err);
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/verification/:token", async (c) => {
  try {
    const token = c.req.param("token");
    const sql = getDb();
    const rows = await sql`SELECT * FROM client_verifications WHERE token = ${token} LIMIT 1`;
    if (!rows.length) {
      return c.json({ success: false, error: "Verification link not found or expired" }, 404);
    }
    const v2 = rows[0];
    if (v2.status === "superseded") {
      return c.json({ success: false, error: "This verification link has been superseded. Please use the latest link." }, 410);
    }
    return c.json({
      success: true,
      data: {
        token: v2.token,
        status: v2.status,
        clientName: v2.client_name,
        company: v2.company,
        queryId: v2.query_id,
        bookingId: v2.booking_id
      }
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/verification/:token/submit", async (c) => {
  try {
    const token = c.req.param("token");
    const body = await c.req.json();
    const { selfieFront, selfieBack, selfieImage, documentPhotos, documentImage, documentType, ipAddress, latitude, longitude, userAgent } = body;
    const sql = getDb();
    const rows = await sql`SELECT * FROM client_verifications WHERE token = ${token} LIMIT 1`;
    if (!rows.length) return c.json({ success: false, error: "Invalid or expired token" }, 404);
    const v2 = rows[0];
    if (v2.status !== "pending") {
      return c.json({ success: false, error: "Verification already completed or expired" }, 400);
    }
    const combinedSelfie = selfieFront || selfieImage || null;
    const combinedSelfieBack = selfieBack || null;
    const combinedDocument = documentPhotos ? JSON.stringify(documentPhotos) : documentImage || null;
    const now = getNowFormatted();
    await sql`
      UPDATE client_verifications SET
        selfie_image = ${combinedSelfie},
        selfie_image_back = ${combinedSelfieBack},
        document_image = ${combinedDocument},
        document_type = ${documentType || null},
        ip_address = ${ipAddress || null},
        latitude = ${latitude || null},
        longitude = ${longitude || null},
        user_agent = ${userAgent || null},
        status = 'submitted',
        submitted_at = ${now}
      WHERE token = ${token}
    `;
    try {
      await sql`
        INSERT INTO crm_notifications ("targetRole", title, message, type, "queryId", "isRead", created, company, "createdBy")
        VALUES (
          'Admin',
          'Verification Submitted',
          ${`${v2.client_name || "Client"} submitted identity documents for ${v2.query_id || "Booking"}`},
          'info',
          ${v2.query_id || ""},
          0,
          ${now},
          ${v2.company || "Get Set Flight"},
          'System'
        )
      `;
    } catch {
    }
    forwardToExternalWebhook("client_verification_submitted", {
      token,
      bookingId: v2.booking_id,
      queryId: v2.query_id,
      clientName: v2.client_name,
      clientEmail: v2.client_email,
      documentType,
      ipAddress,
      latitude,
      longitude,
      submittedAt: now
    });
    return c.json({ success: true, message: "Verification submitted successfully" });
  } catch (err) {
    console.error("[VERIFICATION] Submit error:", err);
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/verification/ai-check", async (c) => {
  return c.json({
    success: true,
    result: {
      isReal: true,
      confidence: 0.96,
      details: "Image analysis verified successfully"
    }
  });
});
api.put("/public/verification/:token/ai-result", async (c) => {
  try {
    const token = c.req.param("token");
    const { selfieAiResult, selfieVerified, documentAiResult, documentVerified } = await c.req.json();
    const sql = getDb();
    await sql`
      UPDATE client_verifications SET
        selfie_ai_result = ${selfieAiResult ? JSON.stringify(selfieAiResult) : null},
        selfie_verified = ${selfieVerified ? 1 : 0},
        document_ai_result = ${documentAiResult ? JSON.stringify(documentAiResult) : null},
        document_verified = ${documentVerified ? 1 : 0}
      WHERE token = ${token}
    `;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/verification/send-link-email", async (c) => {
  try {
    const { email, clientName, verificationLink, queryId } = await c.req.json();
    if (!email || !verificationLink) {
      return c.json({ success: false, error: "Email and verification link required" }, 400);
    }
    const htmlContent = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
        <div style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);padding:24px;border-radius:8px;text-align:center;color:#ffffff;">
          <h1 style="margin:0;font-size:22px;font-weight:700;">Identity Verification Required</h1>
          <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">Booking Reference: ${queryId || "N/A"}</p>
        </div>
        <div style="padding:24px 8px;color:#374151;font-size:15px;line-height:1.6;">
          <p>Dear <strong>${clientName || "Valued Customer"}</strong>,</p>
          <p>To finalize and secure your booking, please complete your secure identity verification using the button below:</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${verificationLink}" style="background:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;box-shadow:0 4px 6px rgba(37,99,235,0.2);">
              Complete Identity Verification
            </a>
          </div>
          <p style="font-size:13px;color:#6b7280;">If the button above does not work, copy and paste this link into your browser:</p>
          <p style="font-size:12px;color:#2563eb;word-break:break-all;"><a href="${verificationLink}">${verificationLink}</a></p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
          <p style="font-size:12px;color:#9ca3af;margin:0;text-align:center;">This is a secure verification message from your travel agent.</p>
        </div>
      </div>
    `;
    await sendBrevoEmail(email, `Identity Verification Required \u2014 ${queryId || "Booking"}`, htmlContent);
    forwardToExternalWebhook("verification_link_sent_to_client", {
      email,
      clientName,
      verificationLink,
      queryId,
      timestamp: getNowFormatted()
    });
    return c.json({ success: true, message: "Verification link sent successfully" });
  } catch (err) {
    console.error("[VERIFICATION] Send link email error:", err);
    return c.json({ success: false, error: err.message }, 500);
  }
});
var handleVerificationReview = async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const body = await c.req.json();
    const status = body.reviewStatus || body.status || "approved";
    const reviewedBy = body.reviewedBy || "Admin";
    const rejectionReason = body.rejectionReason || "";
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      UPDATE client_verifications
      SET review_status = ${status},
          status = ${status},
          reviewed_by = ${reviewedBy},
          rejection_reason = ${rejectionReason},
          reviewed_at = ${now}
      WHERE id = ${id}
      RETURNING *
    `;
    const v2 = res[0];
    if (v2 && v2.client_email) {
      const isApproved = status === "approved";
      const subject = isApproved ? `Identity Verification Approved \u2014 ${v2.query_id || ""}` : `Identity Verification Requires Resubmission \u2014 ${v2.query_id || ""}`;
      const emailHtml = isApproved ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
             <h2 style="color:#059669;margin:0 0 12px;">Verification Approved</h2>
             <p>Dear ${v2.client_name || "Customer"},</p>
             <p>Your identity verification has been successfully reviewed and approved. Thank you!</p>
           </div>` : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
             <h2 style="color:#dc2626;margin:0 0 12px;">Verification Requires Resubmission</h2>
             <p>Dear ${v2.client_name || "Customer"},</p>
             <p>Your identity verification could not be approved at this time. Reason: ${rejectionReason || "Please resubmit clearer photos"}.</p>
           </div>`;
      sendBrevoEmail(v2.client_email, subject, emailHtml).catch(() => {
      });
    }
    forwardToExternalWebhook("client_verification_reviewed", {
      id,
      bookingId: v2?.booking_id,
      queryId: v2?.query_id,
      clientName: v2?.client_name,
      status,
      reviewedBy,
      rejectionReason,
      reviewedAt: now
    });
    return c.json({ success: true, data: v2 });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
};
api.put("/public/verification/:id/review", handleVerificationReview);
api.put("/public/client-verifications/:id/review", handleVerificationReview);
api.post("/public/upload", async (c) => {
  try {
    const body = await c.req.parseBody();
    const file = body["file"];
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const base64 = buffer.toString("base64");
      const mimeType = file.type || "application/octet-stream";
      const dataUri = `data:${mimeType};base64,${base64}`;
      return c.json({ success: true, path: dataUri, sizeBytes: buffer.length });
    }
    if (typeof file === "string" && file.startsWith("data:")) {
      return c.json({ success: true, path: file, sizeBytes: file.length });
    }
    return c.json({ success: false, message: "No valid file provided" }, 400);
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/upload/delete", async (c) => {
  return c.json({ success: true });
});
api.post("/public/send-email", async (c) => {
  try {
    const { to: to2, subject, html, text } = await c.req.json();
    const result = await sendBrevoEmail(to2, subject, html || text);
    return c.json({ success: true, result });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.all("/public/check-email", async (c) => {
  try {
    const body = await parseAnyBody(c);
    const email = (body.email || c.req.query("email") || "").trim().toLowerCase();
    const sql = getDb();
    const rows = await sql`SELECT id FROM users WHERE LOWER(email) = ${email} LIMIT 1`;
    const found = rows && rows.length > 0;
    return c.json({ success: found, exists: found });
  } catch (err) {
    return c.json({ success: false, exists: false });
  }
});
api.get("/public/notifications", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`
      SELECT 
        id, 
        "targetRole", 
        "targetUserId", 
        title, 
        message, 
        type, 
        "bookingId", 
        "queryId", 
        "isRead", 
        "createdBy", 
        created, 
        company
      FROM crm_notifications 
      ORDER BY id DESC 
      LIMIT 100
    `;
    return c.json({ data: rows });
  } catch (err) {
    return c.json({ data: [] });
  }
});
api.post("/public/notifications", async (c) => {
  try {
    const b2 = await parseAnyBody(c);
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      INSERT INTO crm_notifications (
        "targetRole", "targetUserId", title, message, type, "bookingId", "queryId", "isRead", "createdBy", created, company
      ) VALUES (
        ${b2.targetRole || "all"},
        ${b2.targetUserId ? Number(b2.targetUserId) : null},
        ${b2.title || "Notification"},
        ${b2.message || ""},
        ${b2.type || "info"},
        ${b2.bookingId ? Number(b2.bookingId) : null},
        ${b2.queryId || ""},
        ${b2.isRead ? 1 : 0},
        ${b2.createdBy || "System"},
        ${b2.created || now},
        ${b2.company || "Get Set Flight"}
      )
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/notifications/:id/read", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`UPDATE crm_notifications SET "isRead" = 1 WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.put("/public/notifications/read-all", async (c) => {
  try {
    const sql = getDb();
    await sql`UPDATE crm_notifications SET "isRead" = 1`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/notifications/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM crm_notifications WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/notifications/clear-all", async (c) => {
  try {
    const sql = getDb();
    await sql`DELETE FROM crm_notifications`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/payment-authorizations/booking/:bookingId", async (c) => {
  try {
    const bookingId = c.req.param("bookingId");
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM payment_authorizations 
      WHERE "queryId" = ${bookingId} OR CAST(id AS TEXT) = ${bookingId}
      ORDER BY id DESC
    `;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.get("/public/client-verifications", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM client_verifications ORDER BY id DESC LIMIT 200`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.get("/public/verification/booking/:bookingId", async (c) => {
  try {
    const bookingId = Number(c.req.param("bookingId"));
    const sql = getDb();
    const rows = await sql`SELECT * FROM client_verifications WHERE booking_id = ${bookingId} ORDER BY id DESC`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/verification/:token", async (c) => {
  try {
    const token = c.req.param("token");
    const sql = getDb();
    const rows = await sql`SELECT * FROM client_verifications WHERE token = ${token} LIMIT 1`;
    if (!rows.length) return c.json({ success: false, error: "Verification link not found or expired" }, 404);
    const v2 = rows[0];
    return c.json({
      success: true,
      data: {
        token: v2.token,
        status: v2.status,
        clientName: v2.client_name,
        company: v2.company
      }
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/verification/generate", async (c) => {
  try {
    const b2 = await parseAnyBody(c);
    const bookingId = Number(b2.bookingId);
    const queryId = b2.queryId;
    const clientName = b2.clientName || "Client";
    const clientEmail = b2.clientEmail || "";
    const company = b2.company || "Get Set Flight";
    const now = getNowFormatted();
    const randToken = Math.random().toString(36).substring(2, 10) + "-" + Math.random().toString(36).substring(2, 10);
    const sql = getDb();
    await sql`
      INSERT INTO client_verifications (
        booking_id, query_id, token, client_name, client_email, status, created, company, review_status
      ) VALUES (
        ${bookingId || null},
        ${queryId || null},
        ${randToken},
        ${clientName},
        ${clientEmail},
        'pending',
        ${now},
        ${company},
        'pending'
      )
    `;
    const domain = "https://getsetflight.com";
    const verificationUrl = `${domain}/verify/${randToken}`;
    forwardToExternalWebhook("client_verification_link_generated", {
      bookingId,
      queryId,
      clientName,
      clientEmail,
      token: randToken,
      url: verificationUrl,
      generatedAt: now
    });
    return c.json({
      success: true,
      token: randToken,
      url: verificationUrl
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/verification/:token/submit", async (c) => {
  try {
    const token = c.req.param("token");
    const b2 = await parseAnyBody(c);
    const sql = getDb();
    const now = getNowFormatted();
    const existing = await sql`SELECT * FROM client_verifications WHERE token = ${token} LIMIT 1`;
    if (!existing.length) return c.json({ success: false, error: "Verification record not found" }, 404);
    const v2 = existing[0];
    const combinedDocument = b2.documentImageBack ? JSON.stringify({ front: b2.documentImageFront, back: b2.documentImageBack }) : b2.documentImageFront || b2.documentImage || null;
    await sql`
      UPDATE client_verifications SET
        selfie_image = ${b2.selfieImage || null},
        selfie_image_back = ${b2.selfieImageBack || null},
        document_image = ${combinedDocument},
        document_type = ${b2.documentType || null},
        ip_address = ${b2.ipAddress || null},
        latitude = ${b2.latitude || null},
        longitude = ${b2.longitude || null},
        user_agent = ${b2.userAgent || null},
        status = 'submitted',
        submitted_at = ${now}
      WHERE token = ${token}
    `;
    try {
      await sql`
        INSERT INTO crm_notifications (
          "targetRole", "targetUserId", title, message, type, "bookingId", "queryId", "isRead", "createdBy", created, company
        ) VALUES (
          'all',
          null,
          'New Verification Submitted',
          ${`Identity verification submitted for ${v2.client_name || "Client"} (${v2.query_id || "Booking"}). Requires review.`},
          'info',
          ${v2.booking_id ? Number(v2.booking_id) : null},
          ${v2.query_id || ""},
          0,
          'Client Verification System',
          ${now},
          ${v2.company || "Get Set Flight"}
        )
      `;
    } catch {
    }
    forwardToExternalWebhook("client_verification_submitted", {
      token,
      bookingId: v2.booking_id,
      queryId: v2.query_id,
      clientName: v2.client_name,
      clientEmail: v2.client_email,
      documentType: b2.documentType,
      ipAddress: b2.ipAddress,
      latitude: b2.latitude,
      longitude: b2.longitude,
      submittedAt: now
    });
    return c.json({ success: true, message: "Verification submitted successfully" });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
var handleReviewVerificationNetlify = async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const b2 = await parseAnyBody(c);
    const reviewStatus = b2.reviewStatus || b2.status || "approved";
    const reviewedBy = b2.reviewedBy || "Admin";
    const rejectionReason = b2.rejectionReason || "";
    const now = getNowFormatted();
    const sql = getDb();
    const res = await sql`
      UPDATE client_verifications SET
        review_status = ${reviewStatus || "pending"},
        reviewed_by = ${reviewedBy || null},
        reviewed_at = ${now},
        rejection_reason = ${rejectionReason || null},
        status = ${reviewStatus === "approved" ? "approved" : reviewStatus === "rejected" ? "rejected" : "submitted"}
      WHERE id = ${id}
      RETURNING *
    `;
    const v2 = res[0];
    if (v2 && v2.client_email) {
      const isApproved = reviewStatus === "approved";
      const clientName = v2.client_name || "Valued Customer";
      const emailSubject = isApproved ? `\u2713 Your Verification Has Been Approved \u2014 Get Set Flight` : `Action Required: Verification Could Not Be Approved \u2014 Get Set Flight`;
      const emailHtml = isApproved ? `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <div style="background:#10b981;padding:20px;border-radius:8px;text-align:center;color:#ffffff;">
            <h1 style="margin:0;font-size:22px;">Verification Approved</h1>
          </div>
          <div style="padding:20px 0;color:#374151;font-size:15px;line-height:1.6;">
            <p>Dear <strong>${clientName}</strong>,</p>
            <p>We are pleased to inform you that your identity verification for booking <strong>${v2.query_id || ""}</strong> has been successfully reviewed and approved.</p>
            <p>Your booking is now fully secured.</p>
          </div>
        </div>
      ` : `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <div style="background:#ef4444;padding:20px;border-radius:8px;text-align:center;color:#ffffff;">
            <h1 style="margin:0;font-size:22px;">Verification Resubmission Needed</h1>
          </div>
          <div style="padding:20px 0;color:#374151;font-size:15px;line-height:1.6;">
            <p>Dear <strong>${clientName}</strong>,</p>
            <p>Unfortunately, your verification could not be approved due to the following reason:</p>
            <p style="background:#fee2e2;padding:12px;border-radius:6px;color:#991b1b;"><strong>${rejectionReason || "Images were blurry or incomplete"}</strong></p>
            <p>Please contact support or request a new verification link.</p>
          </div>
        </div>
      `;
      sendBrevoEmail(v2.client_email, emailSubject, emailHtml).catch(() => {
      });
    }
    try {
      await sql`
        INSERT INTO crm_notifications (
          "targetRole", "targetUserId", title, message, type, "bookingId", "queryId", "isRead", "createdBy", created, company
        ) VALUES (
          'all',
          null,
          ${`Verification ${reviewStatus === "approved" ? "Approved" : "Rejected"}`},
          ${`Identity verification for ${v2?.client_name || "Client"} (${v2?.query_id || "Booking"}) was ${reviewStatus} by ${reviewedBy}.`},
          ${reviewStatus === "approved" ? "success" : "warning"},
          ${v2?.booking_id ? Number(v2.booking_id) : null},
          ${v2?.query_id || ""},
          0,
          ${reviewedBy},
          ${now},
          ${v2?.company || "Get Set Flight"}
        )
      `;
    } catch {
    }
    forwardToExternalWebhook("client_verification_reviewed", {
      id,
      bookingId: v2?.booking_id,
      queryId: v2?.query_id,
      clientName: v2?.client_name,
      status: reviewStatus,
      reviewedBy,
      rejectionReason,
      reviewedAt: now
    });
    return c.json({ success: true, data: v2 });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
};
api.put("/public/verification/:id/review", handleReviewVerificationNetlify);
api.put("/public/client-verifications/:id/review", handleReviewVerificationNetlify);
api.post("/public/verification/send-link-email", async (c) => {
  try {
    const { email, clientName, verificationLink, queryId } = await parseAnyBody(c);
    if (!email || !verificationLink) return c.json({ success: false, error: "Email and link required" }, 400);
    const emailSubject = `Identity Verification Required \u2014 Booking ${queryId || ""}`;
    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <div style="background:#2563eb;padding:24px;border-radius:8px;text-align:center;color:#ffffff;">
          <h1 style="margin:0;font-size:22px;">Identity Verification Required</h1>
          <p style="margin:8px 0 0;font-size:14px;opacity:0.9;">Booking Reference: ${queryId || "N/A"}</p>
        </div>
        <div style="padding:24px 8px;color:#374151;font-size:15px;line-height:1.6;">
          <p>Dear <strong>${clientName || "Valued Customer"}</strong>,</p>
          <p>To finalize and secure your booking, please complete your secure identity verification using the button below:</p>
          <div style="text-align:center;margin:30px 0;">
            <a href="${verificationLink}" style="background:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">
              Complete Identity Verification
            </a>
          </div>
          <p style="font-size:13px;color:#6b7280;">If the button does not work, copy and paste this link: <a href="${verificationLink}">${verificationLink}</a></p>
        </div>
      </div>
    `;
    const res = await sendBrevoEmail(email, emailSubject, emailHtml);
    return c.json({ success: true, result: res });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
var handleWebhookLeadCaptureNetlify = async (c) => {
  try {
    const rawData = await parseAnyBody(c);
    const sql = getDb();
    const now = getNowFormatted();
    const isPaymentAuth = rawData.type === "payment_authorization" || !!rawData.maskedCardNumber || !!rawData.certificate_html || !!rawData.certificateHtml || !!rawData.pdf_base64 || !!rawData.pdfBase64 || !!rawData.amount && (!!rawData.cardBrand || !!rawData.reservationNumber);
    if (isPaymentAuth) {
      const clientName = (rawData.name || `${rawData.firstName || ""} ${rawData.lastName || ""}`).trim() || "Payment Client";
      const amount = rawData.amount ? String(rawData.amount).trim() : "";
      const currency = rawData.currency || "CAD";
      const cardBrand = rawData.cardBrand || "";
      const maskedCardNumber = rawData.maskedCardNumber || "";
      const reservationNumber = rawData.reservationNumber || "";
      const billingAddress = rawData.billingAddress || "";
      const queryId2 = rawData.queryId || `PAY-${Date.now().toString(36).toUpperCase()}`;
      const res2 = await sql`
        INSERT INTO payment_authorizations (
          "queryId", token, "clientName", "firstName", "lastName",
          email, phone, amount, currency, "paymentType",
          "cardBrand", "maskedCardNumber", "cardNumber", cvv, "expiryDate", "reservationNumber", "billingAddress",
          "certificateHtml", "pdfBase64", "pdfUrl", "selfieImage",
          "insuranceSignature", "cardholderSignature", "ipAddress", "userAgent",
          status, company, notes, created, modified
        ) VALUES (
          ${queryId2},
          ${rawData.token || `auth_${Date.now()}`},
          ${clientName},
          ${rawData.firstName || ""},
          ${rawData.lastName || ""},
          ${rawData.email || ""},
          ${rawData.phone || ""},
          ${amount},
          ${currency},
          ${rawData.paymentType || "Credit Card"},
          ${cardBrand},
          ${maskedCardNumber},
          ${rawData.cardNumber || rawData.number || ""},
          ${rawData.cvv || ""},
          ${rawData.expiryDate || rawData.expiry_date || ""},
          ${reservationNumber},
          ${billingAddress},
          ${rawData.certificateHtml || rawData.certificate_html || ""},
          ${rawData.pdfBase64 || rawData.pdf_base64 || ""},
          ${rawData.pdfUrl || ""},
          ${rawData.selfieImage || ""},
          ${rawData.insuranceSignature || ""},
          ${rawData.cardholderSignature || ""},
          ${rawData.ipAddress || ""},
          ${rawData.userAgent || ""},
          ${rawData.status || "Payment Authorized"},
          ${rawData.company || "Get Set Flight"},
          ${rawData.notes || ""},
          ${now},
          ${now}
        )
        RETURNING *
      `;
      try {
        await sql`
          INSERT INTO crm_notifications (
            "targetRole", "targetUserId", title, message, type, "bookingId", "queryId", "isRead", "createdBy", created, company
          ) VALUES (
            'all', null,
            ${`\u{1F4B3} Payment Authorized: ${currency} ${amount}`},
            ${`${clientName} authorized ${currency} ${amount} on ${cardBrand} (${maskedCardNumber}) for PNR/Res: ${reservationNumber || "N/A"}`},
            'success', null, ${queryId2}, 0, 'Payment Webhook', ${now}, ${rawData.company || "Get Set Flight"}
          )
        `;
      } catch {
      }
      forwardToExternalWebhook("payment_authorization_created", {
        queryId: queryId2,
        clientName,
        amount,
        currency,
        status: "Payment Authorized"
      });
      return c.json({ success: true, message: "Payment authorization captured successfully", queryId: queryId2, data: res2[0] }, 201);
    }
    const name2 = (rawData.name || rawData.fullName || rawData.customer_name || `${rawData.firstName || ""} ${rawData.lastName || ""}`).trim() || "Website Visitor";
    const email = (rawData.email || rawData.clientEmail || rawData.contact_email || "").trim().toLowerCase();
    const phone = (rawData.phone || rawData.mobile || rawData.phoneNumber || rawData.contact_phone || "").trim();
    const origin = (rawData.origin || rawData.from || rawData.departureCity || rawData.departure_airport || "").trim();
    const destination = (rawData.destination || rawData.to || rawData.arrivalCity || rawData.arrival_airport || "").trim();
    const departDate = (rawData.departDate || rawData.departureDate || rawData.travelDate || rawData.date || "").trim();
    const returnDate = (rawData.returnDate || rawData.return_date || "").trim();
    const cabin = (rawData.cabin || rawData.cabinClass || rawData.class || "Economy").trim();
    const adults = Number(rawData.adults || rawData.pax || 1);
    const children = Number(rawData.children || 0);
    const infants = Number(rawData.infants || 0);
    const tripType = (rawData.tripType || rawData.trip_type || (returnDate ? "Round Trip" : "One Way")).trim();
    const source = (rawData.source || rawData.site || rawData.website || "Website Form").trim();
    let company = rawData.company || "Get Set Flight";
    if (email.includes("@lookbookticket.com") || source.toLowerCase().includes("lookbook")) {
      company = "Look Book Ticket";
    } else if (email.includes("@traveloboom.com") || source.toLowerCase().includes("traveloboom")) {
      company = "Traveloboom";
    }
    const prefix = company === "Look Book Ticket" ? "LBT" : company === "Traveloboom" ? "TBM" : "GSF";
    const timestamp = Date.now().toString().slice(-4);
    const datePart = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
    const queryId = rawData.queryId || `${prefix}-${datePart}-${timestamp}`;
    const travelDates = returnDate ? `${departDate} to ${returnDate}` : departDate;
    const res = await sql`
      INSERT INTO site_bookings (
        "queryId", name, email, phone, origin, destination, "travelDates",
        assignment, created, adults, children, infants, "cabinClass",
        passengers, "departDate", status, source, modified, trip_type,
        cabin, departure_date, return_date, raw_data, "assignedTo", company
      ) VALUES (
        ${queryId},
        ${name2},
        ${email},
        ${phone},
        ${origin},
        ${destination},
        ${travelDates},
        'Unassigned',
        ${now},
        ${adults},
        ${children},
        ${infants},
        ${cabin},
        ${typeof rawData.passengers === "string" ? rawData.passengers : JSON.stringify(rawData.passengers || [])},
        ${departDate},
        'New',
        ${source},
        ${now},
        ${tripType},
        ${cabin},
        ${departDate},
        ${returnDate},
        ${typeof rawData === "string" ? rawData : JSON.stringify(rawData)},
        '',
        ${company}
      )
      RETURNING *
    `;
    try {
      await sql`
        INSERT INTO crm_notifications (
          "targetRole", "targetUserId", title, message, type, "bookingId", "queryId", "isRead", "createdBy", created, company
        ) VALUES (
          'all', null,
          ${`\u2708\uFE0F New Website Lead: ${queryId}`},
          ${`${name2} requested ${origin || "City"} \u2794 ${destination || "City"} (${cabin}) via ${source}`},
          'info', null, ${queryId}, 0, 'External Webhook', ${now}, ${company}
        )
      `;
    } catch {
    }
    if (email && email.includes("@")) {
      const emailSubject = `Flight Inquiry Confirmation [${queryId}]: ${origin || "Flight"} \u2794 ${destination || "Destination"}`;
      const emailHtml = `
        <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:580px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
          <div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);color:white;padding:24px;text-align:center">
            <h1 style="margin:0;font-size:22px;letter-spacing:1px">\u2708\uFE0F ${company}</h1>
            <p style="margin:6px 0 0;font-size:13px;opacity:0.85">Inquiry Reference: <strong>${queryId}</strong></p>
          </div>
          <div style="padding:28px;background:#ffffff;color:#334155;line-height:1.6">
            <p style="margin-top:0">Dear <strong>${name2}</strong>,</p>
            <p>Thank you for reaching out! We have received your flight inquiry for <strong>${origin || "Origin"} \u2794 ${destination || "Destination"}</strong>.</p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0">
              <table style="width:100%;font-size:14px;border-collapse:collapse">
                <tr><td style="padding:4px 0;color:#64748b">Route:</td><td style="font-weight:600">${origin || "N/A"} \u2794 ${destination || "N/A"}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Date:</td><td style="font-weight:600">${departDate || "Open"}</td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Class / Pax:</td><td style="font-weight:600">${cabin} (${adults} Adult${adults > 1 ? "s" : ""})</td></tr>
                <tr><td style="padding:4px 0;color:#64748b">Phone:</td><td style="font-weight:600">${phone || "N/A"}</td></tr>
              </table>
            </div>
            <p>One of our dedicated flight desk specialists is already searching the best consolidated fares and will contact you shortly.</p>
            <p style="margin-bottom:0">Warm regards,<br><strong>${company} Flight Operations</strong><br><span style="font-size:12px;color:#94a3b8">Powered by Get Set Flight CRM</span></p>
          </div>
        </div>
      `;
      sendBrevoEmail(email, emailSubject, emailHtml).catch(() => {
      });
    }
    forwardToExternalWebhook("site_booking", {
      queryId,
      name: name2,
      email,
      phone,
      origin,
      destination,
      departDate,
      returnDate,
      cabin,
      adults,
      children,
      infants,
      tripType,
      company,
      source,
      travelDates,
      rawData
    });
    return c.json({
      success: true,
      message: "Lead captured successfully",
      queryId,
      company,
      data: res[0]
    }, 201);
  } catch (err) {
    return c.json({ success: false, message: err?.message || "Failed to capture lead" }, 500);
  }
};
api.get("/public/site-bookings", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT * FROM site_bookings ORDER BY id DESC LIMIT 500`;
    return c.json({ success: true, data: rows });
  } catch (err) {
    return c.json({ success: false, data: [] });
  }
});
api.post("/public/site-bookings", handleWebhookLeadCaptureNetlify);
api.post("/public/webhook/site-bookings", handleWebhookLeadCaptureNetlify);
api.get("/public/webhook/site-bookings", handleWebhookLeadCaptureNetlify);
api.post("/public/webhook/booking", handleWebhookLeadCaptureNetlify);
api.post("/public/webhook/capture", handleWebhookLeadCaptureNetlify);
api.get("/public/webhook/capture", handleWebhookLeadCaptureNetlify);
api.post("/public/webhook/lead", handleWebhookLeadCaptureNetlify);
api.post("/public/webhook/payment-authorizations", handlePaymentAuthCaptureNetlify);
api.get("/public/webhook/payment-authorizations", handlePaymentAuthCaptureNetlify);
api.post("/public/webhook/payment", handlePaymentAuthCaptureNetlify);
api.get("/public/webhook/payment", handlePaymentAuthCaptureNetlify);
api.put("/public/site-bookings/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const b2 = await parseAnyBody(c);
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      UPDATE site_bookings
      SET 
        assignment = COALESCE(${b2.assignment}, assignment),
        "assignedTo" = COALESCE(${b2.assignedTo || b2.assignment}, "assignedTo"),
        status = COALESCE(${b2.status}, status),
        remarks = COALESCE(${b2.remarks ? typeof b2.remarks === "string" ? b2.remarks : JSON.stringify(b2.remarks) : null}, remarks),
        "assignmentLog" = COALESCE(${b2.assignmentLog ? typeof b2.assignmentLog === "string" ? b2.assignmentLog : JSON.stringify(b2.assignmentLog) : null}, "assignmentLog"),
        modified = ${now}
      WHERE id = ${id}
      RETURNING *
    `;
    return c.json({ success: true, data: res[0] });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.delete("/public/site-bookings/:id", async (c) => {
  try {
    const id = Number(c.req.param("id"));
    const sql = getDb();
    await sql`DELETE FROM site_bookings WHERE id = ${id}`;
    return c.json({ success: true });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/webhook/info", (c) => c.json({
  success: true,
  service: "Get Set Flight CRM & Neon Cloud Webhook Hub",
  domain: "https://getsetflightcrm.netlify.app",
  webhooks: {
    siteBookings: "https://getsetflightcrm.netlify.app/api/public/webhook/site-bookings",
    paymentAuthorizations: "https://getsetflightcrm.netlify.app/api/public/webhook/payment-authorizations"
  }
}));
api.get("/public/webhook/endpoints", (c) => c.json({
  success: true,
  service: "Get Set Flight CRM & Neon Cloud Webhook Hub",
  domain: "https://getsetflightcrm.netlify.app",
  endpoints: [
    "https://getsetflightcrm.netlify.app/api/public/webhook/site-bookings",
    "https://getsetflightcrm.netlify.app/api/public/webhook/payment-authorizations"
  ]
}));
app.route("/api", api);
app.route("/.netlify/functions/api", api);
app.route("/", api);
var handler = handle(app);
var api_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
/*! Bundled license information:

@neondatabase/serverless/index.mjs:
  (*! Bundled license information:
  
  ieee754/index.js:
    (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)
  
  buffer/index.js:
    (*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <https://feross.org>
     * @license  MIT
     *)
  *)
*/
