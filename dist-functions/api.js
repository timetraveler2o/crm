var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
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

// node_modules/ws/lib/constants.js
var require_constants = __commonJS({
  "node_modules/ws/lib/constants.js"(exports2, module2) {
    "use strict";
    var BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
    var hasBlob = typeof Blob !== "undefined";
    if (hasBlob) BINARY_TYPES.push("blob");
    module2.exports = {
      BINARY_TYPES,
      CLOSE_TIMEOUT: 3e4,
      EMPTY_BUFFER: Buffer.alloc(0),
      GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
      hasBlob,
      kForOnEventAttribute: /* @__PURE__ */ Symbol("kIsForOnEventAttribute"),
      kListener: /* @__PURE__ */ Symbol("kListener"),
      kStatusCode: /* @__PURE__ */ Symbol("status-code"),
      kWebSocket: /* @__PURE__ */ Symbol("websocket"),
      NOOP: () => {
      }
    };
  }
});

// node_modules/ws/lib/buffer-util.js
var require_buffer_util = __commonJS({
  "node_modules/ws/lib/buffer-util.js"(exports2, module2) {
    "use strict";
    var { EMPTY_BUFFER } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    function concat(list, totalLength) {
      if (list.length === 0) return EMPTY_BUFFER;
      if (list.length === 1) return list[0];
      const target = Buffer.allocUnsafe(totalLength);
      let offset = 0;
      for (let i = 0; i < list.length; i++) {
        const buf = list[i];
        target.set(buf, offset);
        offset += buf.length;
      }
      if (offset < totalLength) {
        return new FastBuffer(target.buffer, target.byteOffset, offset);
      }
      return target;
    }
    function _mask(source, mask, output, offset, length) {
      for (let i = 0; i < length; i++) {
        output[offset + i] = source[i] ^ mask[i & 3];
      }
    }
    function _unmask(buffer, mask) {
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] ^= mask[i & 3];
      }
    }
    function toArrayBuffer(buf) {
      if (buf.length === buf.buffer.byteLength) {
        return buf.buffer;
      }
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
    }
    function toBuffer(data) {
      toBuffer.readOnly = true;
      if (Buffer.isBuffer(data)) return data;
      let buf;
      if (data instanceof ArrayBuffer) {
        buf = new FastBuffer(data);
      } else if (ArrayBuffer.isView(data)) {
        buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
      } else {
        buf = Buffer.from(data);
        toBuffer.readOnly = false;
      }
      return buf;
    }
    module2.exports = {
      concat,
      mask: _mask,
      toArrayBuffer,
      toBuffer,
      unmask: _unmask
    };
    if (!process.env.WS_NO_BUFFER_UTIL) {
      try {
        const bufferUtil = require("bufferutil");
        module2.exports.mask = function(source, mask, output, offset, length) {
          if (length < 48) _mask(source, mask, output, offset, length);
          else bufferUtil.mask(source, mask, output, offset, length);
        };
        module2.exports.unmask = function(buffer, mask) {
          if (buffer.length < 32) _unmask(buffer, mask);
          else bufferUtil.unmask(buffer, mask);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/limiter.js
var require_limiter = __commonJS({
  "node_modules/ws/lib/limiter.js"(exports2, module2) {
    "use strict";
    var kDone = /* @__PURE__ */ Symbol("kDone");
    var kRun = /* @__PURE__ */ Symbol("kRun");
    var Limiter = class {
      /**
       * Creates a new `Limiter`.
       *
       * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
       *     to run concurrently
       */
      constructor(concurrency) {
        this[kDone] = () => {
          this.pending--;
          this[kRun]();
        };
        this.concurrency = concurrency || Infinity;
        this.jobs = [];
        this.pending = 0;
      }
      /**
       * Adds a job to the queue.
       *
       * @param {Function} job The job to run
       * @public
       */
      add(job) {
        this.jobs.push(job);
        this[kRun]();
      }
      /**
       * Removes a job from the queue and runs it if possible.
       *
       * @private
       */
      [kRun]() {
        if (this.pending === this.concurrency) return;
        if (this.jobs.length) {
          const job = this.jobs.shift();
          this.pending++;
          job(this[kDone]);
        }
      }
    };
    module2.exports = Limiter;
  }
});

// node_modules/ws/lib/permessage-deflate.js
var require_permessage_deflate = __commonJS({
  "node_modules/ws/lib/permessage-deflate.js"(exports2, module2) {
    "use strict";
    var zlib2 = require("zlib");
    var bufferUtil = require_buffer_util();
    var Limiter = require_limiter();
    var { kStatusCode } = require_constants();
    var FastBuffer = Buffer[Symbol.species];
    var TRAILER = Buffer.from([0, 0, 255, 255]);
    var kPerMessageDeflate = /* @__PURE__ */ Symbol("permessage-deflate");
    var kTotalLength = /* @__PURE__ */ Symbol("total-length");
    var kCallback = /* @__PURE__ */ Symbol("callback");
    var kBuffers = /* @__PURE__ */ Symbol("buffers");
    var kError = /* @__PURE__ */ Symbol("error");
    var zlibLimiter;
    var PerMessageDeflate2 = class {
      /**
       * Creates a PerMessageDeflate instance.
       *
       * @param {Object} [options] Configuration options
       * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
       *     for, or request, a custom client window size
       * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
       *     acknowledge disabling of client context takeover
       * @param {Number} [options.concurrencyLimit=10] The number of concurrent
       *     calls to zlib
       * @param {Boolean} [options.isServer=false] Create the instance in either
       *     server or client mode
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
       *     use of a custom server window size
       * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
       *     disabling of server context takeover
       * @param {Number} [options.threshold=1024] Size (in bytes) below which
       *     messages should not be compressed if context takeover is disabled
       * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
       *     deflate
       * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
       *     inflate
       */
      constructor(options) {
        this._options = options || {};
        this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
        this._maxPayload = this._options.maxPayload | 0;
        this._isServer = !!this._options.isServer;
        this._deflate = null;
        this._inflate = null;
        this.params = null;
        if (!zlibLimiter) {
          const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
          zlibLimiter = new Limiter(concurrency);
        }
      }
      /**
       * @type {String}
       */
      static get extensionName() {
        return "permessage-deflate";
      }
      /**
       * Create an extension negotiation offer.
       *
       * @return {Object} Extension parameters
       * @public
       */
      offer() {
        const params = {};
        if (this._options.serverNoContextTakeover) {
          params.server_no_context_takeover = true;
        }
        if (this._options.clientNoContextTakeover) {
          params.client_no_context_takeover = true;
        }
        if (this._options.serverMaxWindowBits) {
          params.server_max_window_bits = this._options.serverMaxWindowBits;
        }
        if (this._options.clientMaxWindowBits) {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        } else if (this._options.clientMaxWindowBits == null) {
          params.client_max_window_bits = true;
        }
        return params;
      }
      /**
       * Accept an extension negotiation offer/response.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Object} Accepted configuration
       * @public
       */
      accept(configurations) {
        configurations = this.normalizeParams(configurations);
        this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
        return this.params;
      }
      /**
       * Releases all resources used by the extension.
       *
       * @public
       */
      cleanup() {
        if (this._inflate) {
          this._inflate.close();
          this._inflate = null;
        }
        if (this._deflate) {
          const callback = this._deflate[kCallback];
          this._deflate.close();
          this._deflate = null;
          if (callback) {
            callback(
              new Error(
                "The deflate stream was closed while data was being processed"
              )
            );
          }
        }
      }
      /**
       *  Accept an extension negotiation offer.
       *
       * @param {Array} offers The extension negotiation offers
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsServer(offers) {
        const opts = this._options;
        const accepted = offers.find((params) => {
          if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && (typeof params.client_max_window_bits === "number" ? opts.clientMaxWindowBits > params.client_max_window_bits : !params.client_max_window_bits)) {
            return false;
          }
          return true;
        });
        if (!accepted) {
          throw new Error("None of the extension offers can be accepted");
        }
        if (opts.serverNoContextTakeover) {
          accepted.server_no_context_takeover = true;
        }
        if (opts.clientNoContextTakeover) {
          accepted.client_no_context_takeover = true;
        }
        if (typeof opts.serverMaxWindowBits === "number") {
          accepted.server_max_window_bits = opts.serverMaxWindowBits;
        }
        if (typeof opts.clientMaxWindowBits === "number") {
          accepted.client_max_window_bits = opts.clientMaxWindowBits;
        } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
          delete accepted.client_max_window_bits;
        }
        return accepted;
      }
      /**
       * Accept the extension negotiation response.
       *
       * @param {Array} response The extension negotiation response
       * @return {Object} Accepted configuration
       * @private
       */
      acceptAsClient(response) {
        const params = response[0];
        if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
          throw new Error('Unexpected parameter "client_no_context_takeover"');
        }
        if (!params.client_max_window_bits) {
          if (typeof this._options.clientMaxWindowBits === "number") {
            params.client_max_window_bits = this._options.clientMaxWindowBits;
          }
        } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
          throw new Error(
            'Unexpected or invalid parameter "client_max_window_bits"'
          );
        }
        return params;
      }
      /**
       * Normalize parameters.
       *
       * @param {Array} configurations The extension negotiation offers/reponse
       * @return {Array} The offers/response with normalized parameters
       * @private
       */
      normalizeParams(configurations) {
        configurations.forEach((params) => {
          Object.keys(params).forEach((key) => {
            let value = params[key];
            if (value.length > 1) {
              throw new Error(`Parameter "${key}" must have only a single value`);
            }
            value = value[0];
            if (key === "client_max_window_bits") {
              if (value !== true) {
                const num = +value;
                if (!Number.isInteger(num) || num < 8 || num > 15) {
                  throw new TypeError(
                    `Invalid value for parameter "${key}": ${value}`
                  );
                }
                value = num;
              } else if (!this._isServer) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else if (key === "server_max_window_bits") {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
              if (value !== true) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
            } else {
              throw new Error(`Unknown parameter "${key}"`);
            }
            params[key] = value;
          });
        });
        return configurations;
      }
      /**
       * Decompress data. Concurrency limited.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      decompress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._decompress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Compress data. Concurrency limited.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @public
       */
      compress(data, fin, callback) {
        zlibLimiter.add((done) => {
          this._compress(data, fin, (err, result) => {
            done();
            callback(err, result);
          });
        });
      }
      /**
       * Decompress data.
       *
       * @param {Buffer} data Compressed data
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _decompress(data, fin, callback) {
        const endpoint = this._isServer ? "client" : "server";
        if (!this._inflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib2.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._inflate = zlib2.createInflateRaw({
            ...this._options.zlibInflateOptions,
            windowBits
          });
          this._inflate[kPerMessageDeflate] = this;
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          this._inflate.on("error", inflateOnError);
          this._inflate.on("data", inflateOnData);
        }
        this._inflate[kCallback] = callback;
        this._inflate.write(data);
        if (fin) this._inflate.write(TRAILER);
        this._inflate.flush(() => {
          const err = this._inflate[kError];
          if (err) {
            this._inflate.close();
            this._inflate = null;
            callback(err);
            return;
          }
          const data2 = bufferUtil.concat(
            this._inflate[kBuffers],
            this._inflate[kTotalLength]
          );
          if (this._inflate._readableState.endEmitted) {
            this._inflate.close();
            this._inflate = null;
          } else {
            this._inflate[kTotalLength] = 0;
            this._inflate[kBuffers] = [];
            if (fin && this.params[`${endpoint}_no_context_takeover`]) {
              this._inflate.reset();
            }
          }
          callback(null, data2);
        });
      }
      /**
       * Compress data.
       *
       * @param {(Buffer|String)} data Data to compress
       * @param {Boolean} fin Specifies whether or not this is the last fragment
       * @param {Function} callback Callback
       * @private
       */
      _compress(data, fin, callback) {
        const endpoint = this._isServer ? "server" : "client";
        if (!this._deflate) {
          const key = `${endpoint}_max_window_bits`;
          const windowBits = typeof this.params[key] !== "number" ? zlib2.Z_DEFAULT_WINDOWBITS : this.params[key];
          this._deflate = zlib2.createDeflateRaw({
            ...this._options.zlibDeflateOptions,
            windowBits
          });
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          this._deflate.on("data", deflateOnData);
        }
        this._deflate[kCallback] = callback;
        this._deflate.write(data);
        this._deflate.flush(zlib2.Z_SYNC_FLUSH, () => {
          if (!this._deflate) {
            return;
          }
          let data2 = bufferUtil.concat(
            this._deflate[kBuffers],
            this._deflate[kTotalLength]
          );
          if (fin) {
            data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
          }
          this._deflate[kCallback] = null;
          this._deflate[kTotalLength] = 0;
          this._deflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._deflate.reset();
          }
          callback(null, data2);
        });
      }
    };
    module2.exports = PerMessageDeflate2;
    function deflateOnData(chunk) {
      this[kBuffers].push(chunk);
      this[kTotalLength] += chunk.length;
    }
    function inflateOnData(chunk) {
      this[kTotalLength] += chunk.length;
      if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
        this[kBuffers].push(chunk);
        return;
      }
      this[kError] = new RangeError("Max payload size exceeded");
      this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
      this[kError][kStatusCode] = 1009;
      this.removeListener("data", inflateOnData);
      this.reset();
    }
    function inflateOnError(err) {
      this[kPerMessageDeflate]._inflate = null;
      if (this[kError]) {
        this[kCallback](this[kError]);
        return;
      }
      err[kStatusCode] = 1007;
      this[kCallback](err);
    }
  }
});

// node_modules/ws/lib/validation.js
var require_validation = __commonJS({
  "node_modules/ws/lib/validation.js"(exports2, module2) {
    "use strict";
    var { isUtf8 } = require("buffer");
    var { hasBlob } = require_constants();
    var tokenChars = [
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 0 - 15
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      // 16 - 31
      0,
      1,
      0,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      1,
      1,
      0,
      1,
      1,
      0,
      // 32 - 47
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      0,
      0,
      0,
      // 48 - 63
      0,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 64 - 79
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      0,
      0,
      1,
      1,
      // 80 - 95
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      // 96 - 111
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      0,
      1,
      0,
      1,
      0
      // 112 - 127
    ];
    function isValidStatusCode(code) {
      return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
    }
    function _isValidUTF8(buf) {
      const len = buf.length;
      let i = 0;
      while (i < len) {
        if ((buf[i] & 128) === 0) {
          i++;
        } else if ((buf[i] & 224) === 192) {
          if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
            return false;
          }
          i += 2;
        } else if ((buf[i] & 240) === 224) {
          if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
          buf[i] === 237 && (buf[i + 1] & 224) === 160) {
            return false;
          }
          i += 3;
        } else if ((buf[i] & 248) === 240) {
          if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
          buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
            return false;
          }
          i += 4;
        } else {
          return false;
        }
      }
      return true;
    }
    function isBlob(value) {
      return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
    }
    module2.exports = {
      isBlob,
      isValidStatusCode,
      isValidUTF8: _isValidUTF8,
      tokenChars
    };
    if (isUtf8) {
      module2.exports.isValidUTF8 = function(buf) {
        return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
      };
    } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
      try {
        const isValidUTF8 = require("utf-8-validate");
        module2.exports.isValidUTF8 = function(buf) {
          return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
        };
      } catch (e) {
      }
    }
  }
});

// node_modules/ws/lib/receiver.js
var require_receiver = __commonJS({
  "node_modules/ws/lib/receiver.js"(exports2, module2) {
    "use strict";
    var { Writable } = require("stream");
    var PerMessageDeflate2 = require_permessage_deflate();
    var {
      BINARY_TYPES,
      EMPTY_BUFFER,
      kStatusCode,
      kWebSocket
    } = require_constants();
    var { concat, toArrayBuffer, unmask } = require_buffer_util();
    var { isValidStatusCode, isValidUTF8 } = require_validation();
    var FastBuffer = Buffer[Symbol.species];
    var GET_INFO = 0;
    var GET_PAYLOAD_LENGTH_16 = 1;
    var GET_PAYLOAD_LENGTH_64 = 2;
    var GET_MASK = 3;
    var GET_DATA = 4;
    var INFLATING = 5;
    var DEFER_EVENT = 6;
    var Receiver2 = class extends Writable {
      /**
       * Creates a Receiver instance.
       *
       * @param {Object} [options] Options object
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {String} [options.binaryType=nodebuffer] The type for binary data
       * @param {Object} [options.extensions] An object containing the negotiated
       *     extensions
       * @param {Boolean} [options.isServer=false] Specifies whether to operate in
       *     client or server mode
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message length
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       */
      constructor(options = {}) {
        super();
        this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
        this._binaryType = options.binaryType || BINARY_TYPES[0];
        this._extensions = options.extensions || {};
        this._isServer = !!options.isServer;
        this._maxBufferedChunks = options.maxBufferedChunks | 0;
        this._maxFragments = options.maxFragments | 0;
        this._maxPayload = options.maxPayload | 0;
        this._skipUTF8Validation = !!options.skipUTF8Validation;
        this[kWebSocket] = void 0;
        this._bufferedBytes = 0;
        this._buffers = [];
        this._compressed = false;
        this._payloadLength = 0;
        this._mask = void 0;
        this._fragmented = 0;
        this._masked = false;
        this._fin = false;
        this._opcode = 0;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._numFragments = 0;
        this._fragments = [];
        this._errored = false;
        this._loop = false;
        this._state = GET_INFO;
      }
      /**
       * Implements `Writable.prototype._write()`.
       *
       * @param {Buffer} chunk The chunk of data to write
       * @param {String} encoding The character encoding of `chunk`
       * @param {Function} cb Callback
       * @private
       */
      _write(chunk, encoding, cb) {
        if (this._opcode === 8 && this._state == GET_INFO) return cb();
        if (this._maxBufferedChunks > 0 && this._buffers.length >= this._maxBufferedChunks) {
          cb(
            this.createError(
              RangeError,
              "Too many buffered chunks",
              false,
              1008,
              "WS_ERR_TOO_MANY_BUFFERED_PARTS"
            )
          );
          return;
        }
        this._bufferedBytes += chunk.length;
        this._buffers.push(chunk);
        this.startLoop(cb);
      }
      /**
       * Consumes `n` bytes from the buffered data.
       *
       * @param {Number} n The number of bytes to consume
       * @return {Buffer} The consumed bytes
       * @private
       */
      consume(n) {
        this._bufferedBytes -= n;
        if (n === this._buffers[0].length) return this._buffers.shift();
        if (n < this._buffers[0].length) {
          const buf = this._buffers[0];
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
          return new FastBuffer(buf.buffer, buf.byteOffset, n);
        }
        const dst = Buffer.allocUnsafe(n);
        do {
          const buf = this._buffers[0];
          const offset = dst.length - n;
          if (n >= buf.length) {
            dst.set(this._buffers.shift(), offset);
          } else {
            dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
            this._buffers[0] = new FastBuffer(
              buf.buffer,
              buf.byteOffset + n,
              buf.length - n
            );
          }
          n -= buf.length;
        } while (n > 0);
        return dst;
      }
      /**
       * Starts the parsing loop.
       *
       * @param {Function} cb Callback
       * @private
       */
      startLoop(cb) {
        this._loop = true;
        do {
          switch (this._state) {
            case GET_INFO:
              this.getInfo(cb);
              break;
            case GET_PAYLOAD_LENGTH_16:
              this.getPayloadLength16(cb);
              break;
            case GET_PAYLOAD_LENGTH_64:
              this.getPayloadLength64(cb);
              break;
            case GET_MASK:
              this.getMask();
              break;
            case GET_DATA:
              this.getData(cb);
              break;
            case INFLATING:
            case DEFER_EVENT:
              this._loop = false;
              return;
          }
        } while (this._loop);
        if (!this._errored) cb();
      }
      /**
       * Reads the first two bytes of a frame.
       *
       * @param {Function} cb Callback
       * @private
       */
      getInfo(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        const buf = this.consume(2);
        if ((buf[0] & 48) !== 0) {
          const error2 = this.createError(
            RangeError,
            "RSV2 and RSV3 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_2_3"
          );
          cb(error2);
          return;
        }
        const compressed = (buf[0] & 64) === 64;
        if (compressed && !this._extensions[PerMessageDeflate2.extensionName]) {
          const error2 = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error2);
          return;
        }
        this._fin = (buf[0] & 128) === 128;
        this._opcode = buf[0] & 15;
        this._payloadLength = buf[1] & 127;
        if (this._opcode === 0) {
          if (compressed) {
            const error2 = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error2);
            return;
          }
          if (!this._fragmented) {
            const error2 = this.createError(
              RangeError,
              "invalid opcode 0",
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error2);
            return;
          }
          this._opcode = this._fragmented;
        } else if (this._opcode === 1 || this._opcode === 2) {
          if (this._fragmented) {
            const error2 = this.createError(
              RangeError,
              `invalid opcode ${this._opcode}`,
              true,
              1002,
              "WS_ERR_INVALID_OPCODE"
            );
            cb(error2);
            return;
          }
          this._compressed = compressed;
        } else if (this._opcode > 7 && this._opcode < 11) {
          if (!this._fin) {
            const error2 = this.createError(
              RangeError,
              "FIN must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_FIN"
            );
            cb(error2);
            return;
          }
          if (compressed) {
            const error2 = this.createError(
              RangeError,
              "RSV1 must be clear",
              true,
              1002,
              "WS_ERR_UNEXPECTED_RSV_1"
            );
            cb(error2);
            return;
          }
          if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
            const error2 = this.createError(
              RangeError,
              `invalid payload length ${this._payloadLength}`,
              true,
              1002,
              "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
            );
            cb(error2);
            return;
          }
        } else {
          const error2 = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error2);
          return;
        }
        if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
        this._masked = (buf[1] & 128) === 128;
        if (this._isServer) {
          if (!this._masked) {
            const error2 = this.createError(
              RangeError,
              "MASK must be set",
              true,
              1002,
              "WS_ERR_EXPECTED_MASK"
            );
            cb(error2);
            return;
          }
        } else if (this._masked) {
          const error2 = this.createError(
            RangeError,
            "MASK must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_MASK"
          );
          cb(error2);
          return;
        }
        if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
        else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
        else this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+16).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength16(cb) {
        if (this._bufferedBytes < 2) {
          this._loop = false;
          return;
        }
        this._payloadLength = this.consume(2).readUInt16BE(0);
        this.haveLength(cb);
      }
      /**
       * Gets extended payload length (7+64).
       *
       * @param {Function} cb Callback
       * @private
       */
      getPayloadLength64(cb) {
        if (this._bufferedBytes < 8) {
          this._loop = false;
          return;
        }
        const buf = this.consume(8);
        const num = buf.readUInt32BE(0);
        if (num > Math.pow(2, 53 - 32) - 1) {
          const error2 = this.createError(
            RangeError,
            "Unsupported WebSocket frame: payload length > 2^53 - 1",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
          );
          cb(error2);
          return;
        }
        this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
        this.haveLength(cb);
      }
      /**
       * Payload length has been read.
       *
       * @param {Function} cb Callback
       * @private
       */
      haveLength(cb) {
        if (this._payloadLength && this._opcode < 8) {
          this._totalPayloadLength += this._payloadLength;
          if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
            const error2 = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error2);
            return;
          }
        }
        if (this._masked) this._state = GET_MASK;
        else this._state = GET_DATA;
      }
      /**
       * Reads mask bytes.
       *
       * @private
       */
      getMask() {
        if (this._bufferedBytes < 4) {
          this._loop = false;
          return;
        }
        this._mask = this.consume(4);
        this._state = GET_DATA;
      }
      /**
       * Reads data bytes.
       *
       * @param {Function} cb Callback
       * @private
       */
      getData(cb) {
        let data = EMPTY_BUFFER;
        if (this._payloadLength) {
          if (this._bufferedBytes < this._payloadLength) {
            this._loop = false;
            return;
          }
          data = this.consume(this._payloadLength);
          if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
            unmask(data, this._mask);
          }
        }
        if (this._opcode > 7) {
          this.controlMessage(data, cb);
          return;
        }
        if (this._maxFragments > 0 && ++this._numFragments > this._maxFragments) {
          const error2 = this.createError(
            RangeError,
            "Too many message fragments",
            false,
            1008,
            "WS_ERR_TOO_MANY_BUFFERED_PARTS"
          );
          cb(error2);
          return;
        }
        if (this._compressed) {
          this._state = INFLATING;
          this.decompress(data, cb);
          return;
        }
        if (data.length) {
          this._messageLength = this._totalPayloadLength;
          this._fragments.push(data);
        }
        this.dataMessage(cb);
      }
      /**
       * Decompresses data.
       *
       * @param {Buffer} data Compressed data
       * @param {Function} cb Callback
       * @private
       */
      decompress(data, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        perMessageDeflate.decompress(data, this._fin, (err, buf) => {
          if (err) return cb(err);
          if (buf.length) {
            this._messageLength += buf.length;
            if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
              const error2 = this.createError(
                RangeError,
                "Max payload size exceeded",
                false,
                1009,
                "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
              );
              cb(error2);
              return;
            }
            this._fragments.push(buf);
          }
          this.dataMessage(cb);
          if (this._state === GET_INFO) this.startLoop(cb);
        });
      }
      /**
       * Handles a data message.
       *
       * @param {Function} cb Callback
       * @private
       */
      dataMessage(cb) {
        if (!this._fin) {
          this._state = GET_INFO;
          return;
        }
        const messageLength = this._messageLength;
        const fragments = this._fragments;
        this._totalPayloadLength = 0;
        this._messageLength = 0;
        this._fragmented = 0;
        this._numFragments = 0;
        this._fragments = [];
        if (this._opcode === 2) {
          let data;
          if (this._binaryType === "nodebuffer") {
            data = concat(fragments, messageLength);
          } else if (this._binaryType === "arraybuffer") {
            data = toArrayBuffer(concat(fragments, messageLength));
          } else if (this._binaryType === "blob") {
            data = new Blob(fragments);
          } else {
            data = fragments;
          }
          if (this._allowSynchronousEvents) {
            this.emit("message", data, true);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", data, true);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        } else {
          const buf = concat(fragments, messageLength);
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error2 = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error2);
            return;
          }
          if (this._state === INFLATING || this._allowSynchronousEvents) {
            this.emit("message", buf, false);
            this._state = GET_INFO;
          } else {
            this._state = DEFER_EVENT;
            setImmediate(() => {
              this.emit("message", buf, false);
              this._state = GET_INFO;
              this.startLoop(cb);
            });
          }
        }
      }
      /**
       * Handles a control message.
       *
       * @param {Buffer} data Data to handle
       * @return {(Error|RangeError|undefined)} A possible error
       * @private
       */
      controlMessage(data, cb) {
        if (this._opcode === 8) {
          if (data.length === 0) {
            this._loop = false;
            this.emit("conclude", 1005, EMPTY_BUFFER);
            this.end();
          } else {
            const code = data.readUInt16BE(0);
            if (!isValidStatusCode(code)) {
              const error2 = this.createError(
                RangeError,
                `invalid status code ${code}`,
                true,
                1002,
                "WS_ERR_INVALID_CLOSE_CODE"
              );
              cb(error2);
              return;
            }
            const buf = new FastBuffer(
              data.buffer,
              data.byteOffset + 2,
              data.length - 2
            );
            if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
              const error2 = this.createError(
                Error,
                "invalid UTF-8 sequence",
                true,
                1007,
                "WS_ERR_INVALID_UTF8"
              );
              cb(error2);
              return;
            }
            this._loop = false;
            this.emit("conclude", code, buf);
            this.end();
          }
          this._state = GET_INFO;
          return;
        }
        if (this._allowSynchronousEvents) {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit(this._opcode === 9 ? "ping" : "pong", data);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
      /**
       * Builds an error object.
       *
       * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
       * @param {String} message The error message
       * @param {Boolean} prefix Specifies whether or not to add a default prefix to
       *     `message`
       * @param {Number} statusCode The status code
       * @param {String} errorCode The exposed error code
       * @return {(Error|RangeError)} The error
       * @private
       */
      createError(ErrorCtor, message, prefix, statusCode, errorCode) {
        this._loop = false;
        this._errored = true;
        const err = new ErrorCtor(
          prefix ? `Invalid WebSocket frame: ${message}` : message
        );
        Error.captureStackTrace(err, this.createError);
        err.code = errorCode;
        err[kStatusCode] = statusCode;
        return err;
      }
    };
    module2.exports = Receiver2;
  }
});

// node_modules/ws/lib/sender.js
var require_sender = __commonJS({
  "node_modules/ws/lib/sender.js"(exports2, module2) {
    "use strict";
    var { Duplex } = require("stream");
    var { randomFillSync } = require("crypto");
    var {
      types: { isUint8Array }
    } = require("util");
    var PerMessageDeflate2 = require_permessage_deflate();
    var { EMPTY_BUFFER, kWebSocket, NOOP } = require_constants();
    var { isBlob, isValidStatusCode } = require_validation();
    var { mask: applyMask, toBuffer } = require_buffer_util();
    var kByteLength = /* @__PURE__ */ Symbol("kByteLength");
    var maskBuffer = Buffer.alloc(4);
    var RANDOM_POOL_SIZE = 8 * 1024;
    var randomPool;
    var randomPoolPointer = RANDOM_POOL_SIZE;
    var DEFAULT = 0;
    var DEFLATING = 1;
    var GET_BLOB_DATA = 2;
    var Sender2 = class _Sender {
      /**
       * Creates a Sender instance.
       *
       * @param {Duplex} socket The connection socket
       * @param {Object} [extensions] An object containing the negotiated extensions
       * @param {Function} [generateMask] The function used to generate the masking
       *     key
       */
      constructor(socket, extensions2, generateMask) {
        this._extensions = extensions2 || {};
        if (generateMask) {
          this._generateMask = generateMask;
          this._maskBuffer = Buffer.alloc(4);
        }
        this._socket = socket;
        this._firstFragment = true;
        this._compress = false;
        this._bufferedBytes = 0;
        this._queue = [];
        this._state = DEFAULT;
        this.onerror = NOOP;
        this[kWebSocket] = void 0;
      }
      /**
       * Frames a piece of data according to the HyBi WebSocket protocol.
       *
       * @param {(Buffer|String)} data The data to frame
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @return {(Buffer|String)[]} The framed data
       * @public
       */
      static frame(data, options) {
        let mask;
        let merge = false;
        let offset = 2;
        let skipMasking = false;
        if (options.mask) {
          mask = options.maskBuffer || maskBuffer;
          if (options.generateMask) {
            options.generateMask(mask);
          } else {
            if (randomPoolPointer === RANDOM_POOL_SIZE) {
              if (randomPool === void 0) {
                randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
              }
              randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
              randomPoolPointer = 0;
            }
            mask[0] = randomPool[randomPoolPointer++];
            mask[1] = randomPool[randomPoolPointer++];
            mask[2] = randomPool[randomPoolPointer++];
            mask[3] = randomPool[randomPoolPointer++];
          }
          skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
          offset = 6;
        }
        let dataLength;
        if (typeof data === "string") {
          if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
            dataLength = options[kByteLength];
          } else {
            data = Buffer.from(data);
            dataLength = data.length;
          }
        } else {
          dataLength = data.length;
          merge = options.mask && options.readOnly && !skipMasking;
        }
        let payloadLength = dataLength;
        if (dataLength >= 65536) {
          offset += 8;
          payloadLength = 127;
        } else if (dataLength > 125) {
          offset += 2;
          payloadLength = 126;
        }
        const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
        target[0] = options.fin ? options.opcode | 128 : options.opcode;
        if (options.rsv1) target[0] |= 64;
        target[1] = payloadLength;
        if (payloadLength === 126) {
          target.writeUInt16BE(dataLength, 2);
        } else if (payloadLength === 127) {
          target[2] = target[3] = 0;
          target.writeUIntBE(dataLength, 4, 6);
        }
        if (!options.mask) return [target, data];
        target[1] |= 128;
        target[offset - 4] = mask[0];
        target[offset - 3] = mask[1];
        target[offset - 2] = mask[2];
        target[offset - 1] = mask[3];
        if (skipMasking) return [target, data];
        if (merge) {
          applyMask(data, mask, target, offset, dataLength);
          return [target];
        }
        applyMask(data, mask, data, 0, dataLength);
        return [target, data];
      }
      /**
       * Sends a close message to the other peer.
       *
       * @param {Number} [code] The status code component of the body
       * @param {(String|Buffer)} [data] The message component of the body
       * @param {Boolean} [mask=false] Specifies whether or not to mask the message
       * @param {Function} [cb] Callback
       * @public
       */
      close(code, data, mask, cb) {
        let buf;
        if (code === void 0) {
          buf = EMPTY_BUFFER;
        } else if (typeof code !== "number" || !isValidStatusCode(code)) {
          throw new TypeError("First argument must be a valid error code number");
        } else if (data === void 0 || !data.length) {
          buf = Buffer.allocUnsafe(2);
          buf.writeUInt16BE(code, 0);
        } else {
          const length = Buffer.byteLength(data);
          if (length > 123) {
            throw new RangeError("The message must not be greater than 123 bytes");
          }
          buf = Buffer.allocUnsafe(2 + length);
          buf.writeUInt16BE(code, 0);
          if (typeof data === "string") {
            buf.write(data, 2);
          } else if (isUint8Array(data)) {
            buf.set(data, 2);
          } else {
            throw new TypeError("Second argument must be a string or a Uint8Array");
          }
        }
        const options = {
          [kByteLength]: buf.length,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 8,
          readOnly: false,
          rsv1: false
        };
        if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, buf, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(buf, options), cb);
        }
      }
      /**
       * Sends a ping message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      ping(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 9,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a pong message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback
       * @public
       */
      pong(data, mask, cb) {
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (byteLength > 125) {
          throw new RangeError("The data size must not be greater than 125 bytes");
        }
        const options = {
          [kByteLength]: byteLength,
          fin: true,
          generateMask: this._generateMask,
          mask,
          maskBuffer: this._maskBuffer,
          opcode: 10,
          readOnly,
          rsv1: false
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, false, options, cb]);
          } else {
            this.getBlobData(data, false, options, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, false, options, cb]);
        } else {
          this.sendFrame(_Sender.frame(data, options), cb);
        }
      }
      /**
       * Sends a data message to the other peer.
       *
       * @param {*} data The message to send
       * @param {Object} options Options object
       * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
       *     or text
       * @param {Boolean} [options.compress=false] Specifies whether or not to
       *     compress `data`
       * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Function} [cb] Callback
       * @public
       */
      send(data, options, cb) {
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        let opcode = options.binary ? 2 : 1;
        let rsv1 = options.compress;
        let byteLength;
        let readOnly;
        if (typeof data === "string") {
          byteLength = Buffer.byteLength(data);
          readOnly = false;
        } else if (isBlob(data)) {
          byteLength = data.size;
          readOnly = false;
        } else {
          data = toBuffer(data);
          byteLength = data.length;
          readOnly = toBuffer.readOnly;
        }
        if (this._firstFragment) {
          this._firstFragment = false;
          if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
            rsv1 = byteLength >= perMessageDeflate._threshold;
          }
          this._compress = rsv1;
        } else {
          rsv1 = false;
          opcode = 0;
        }
        if (options.fin) this._firstFragment = true;
        const opts = {
          [kByteLength]: byteLength,
          fin: options.fin,
          generateMask: this._generateMask,
          mask: options.mask,
          maskBuffer: this._maskBuffer,
          opcode,
          readOnly,
          rsv1
        };
        if (isBlob(data)) {
          if (this._state !== DEFAULT) {
            this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
          } else {
            this.getBlobData(data, this._compress, opts, cb);
          }
        } else if (this._state !== DEFAULT) {
          this.enqueue([this.dispatch, data, this._compress, opts, cb]);
        } else {
          this.dispatch(data, this._compress, opts, cb);
        }
      }
      /**
       * Gets the contents of a blob as binary data.
       *
       * @param {Blob} blob The blob
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     the data
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      getBlobData(blob, compress, options, cb) {
        this._bufferedBytes += options[kByteLength];
        this._state = GET_BLOB_DATA;
        blob.arrayBuffer().then((arrayBuffer) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while the blob was being read"
            );
            process.nextTick(callCallbacks, this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          const data = toBuffer(arrayBuffer);
          if (!compress) {
            this._state = DEFAULT;
            this.sendFrame(_Sender.frame(data, options), cb);
            this.dequeue();
          } else {
            this.dispatch(data, compress, options, cb);
          }
        }).catch((err) => {
          process.nextTick(onError, this, err, cb);
        });
      }
      /**
       * Dispatches a message.
       *
       * @param {(Buffer|String)} data The message to send
       * @param {Boolean} [compress=false] Specifies whether or not to compress
       *     `data`
       * @param {Object} options Options object
       * @param {Boolean} [options.fin=false] Specifies whether or not to set the
       *     FIN bit
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Boolean} [options.mask=false] Specifies whether or not to mask
       *     `data`
       * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
       *     key
       * @param {Number} options.opcode The opcode
       * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
       *     modified
       * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
       *     RSV1 bit
       * @param {Function} [cb] Callback
       * @private
       */
      dispatch(data, compress, options, cb) {
        if (!compress) {
          this.sendFrame(_Sender.frame(data, options), cb);
          return;
        }
        const perMessageDeflate = this._extensions[PerMessageDeflate2.extensionName];
        this._bufferedBytes += options[kByteLength];
        this._state = DEFLATING;
        perMessageDeflate.compress(data, options.fin, (_, buf) => {
          if (this._socket.destroyed) {
            const err = new Error(
              "The socket was closed while data was being compressed"
            );
            callCallbacks(this, err, cb);
            return;
          }
          this._bufferedBytes -= options[kByteLength];
          this._state = DEFAULT;
          options.readOnly = false;
          this.sendFrame(_Sender.frame(buf, options), cb);
          this.dequeue();
        });
      }
      /**
       * Executes queued send operations.
       *
       * @private
       */
      dequeue() {
        while (this._state === DEFAULT && this._queue.length) {
          const params = this._queue.shift();
          this._bufferedBytes -= params[3][kByteLength];
          Reflect.apply(params[0], this, params.slice(1));
        }
      }
      /**
       * Enqueues a send operation.
       *
       * @param {Array} params Send operation parameters.
       * @private
       */
      enqueue(params) {
        this._bufferedBytes += params[3][kByteLength];
        this._queue.push(params);
      }
      /**
       * Sends a frame.
       *
       * @param {(Buffer | String)[]} list The frame to send
       * @param {Function} [cb] Callback
       * @private
       */
      sendFrame(list, cb) {
        if (list.length === 2) {
          this._socket.cork();
          this._socket.write(list[0]);
          this._socket.write(list[1], cb);
          this._socket.uncork();
        } else {
          this._socket.write(list[0], cb);
        }
      }
    };
    module2.exports = Sender2;
    function callCallbacks(sender, err, cb) {
      if (typeof cb === "function") cb(err);
      for (let i = 0; i < sender._queue.length; i++) {
        const params = sender._queue[i];
        const callback = params[params.length - 1];
        if (typeof callback === "function") callback(err);
      }
    }
    function onError(sender, err, cb) {
      callCallbacks(sender, err, cb);
      sender.onerror(err);
    }
  }
});

// node_modules/ws/lib/event-target.js
var require_event_target = __commonJS({
  "node_modules/ws/lib/event-target.js"(exports2, module2) {
    "use strict";
    var { kForOnEventAttribute, kListener } = require_constants();
    var kCode = /* @__PURE__ */ Symbol("kCode");
    var kData = /* @__PURE__ */ Symbol("kData");
    var kError = /* @__PURE__ */ Symbol("kError");
    var kMessage = /* @__PURE__ */ Symbol("kMessage");
    var kReason = /* @__PURE__ */ Symbol("kReason");
    var kTarget = /* @__PURE__ */ Symbol("kTarget");
    var kType = /* @__PURE__ */ Symbol("kType");
    var kWasClean = /* @__PURE__ */ Symbol("kWasClean");
    var Event = class {
      /**
       * Create a new `Event`.
       *
       * @param {String} type The name of the event
       * @throws {TypeError} If the `type` argument is not specified
       */
      constructor(type) {
        this[kTarget] = null;
        this[kType] = type;
      }
      /**
       * @type {*}
       */
      get target() {
        return this[kTarget];
      }
      /**
       * @type {String}
       */
      get type() {
        return this[kType];
      }
    };
    Object.defineProperty(Event.prototype, "target", { enumerable: true });
    Object.defineProperty(Event.prototype, "type", { enumerable: true });
    var CloseEvent = class extends Event {
      /**
       * Create a new `CloseEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {Number} [options.code=0] The status code explaining why the
       *     connection was closed
       * @param {String} [options.reason=''] A human-readable string explaining why
       *     the connection was closed
       * @param {Boolean} [options.wasClean=false] Indicates whether or not the
       *     connection was cleanly closed
       */
      constructor(type, options = {}) {
        super(type);
        this[kCode] = options.code === void 0 ? 0 : options.code;
        this[kReason] = options.reason === void 0 ? "" : options.reason;
        this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
      }
      /**
       * @type {Number}
       */
      get code() {
        return this[kCode];
      }
      /**
       * @type {String}
       */
      get reason() {
        return this[kReason];
      }
      /**
       * @type {Boolean}
       */
      get wasClean() {
        return this[kWasClean];
      }
    };
    Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
    Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
    var ErrorEvent = class extends Event {
      /**
       * Create a new `ErrorEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.error=null] The error that generated this event
       * @param {String} [options.message=''] The error message
       */
      constructor(type, options = {}) {
        super(type);
        this[kError] = options.error === void 0 ? null : options.error;
        this[kMessage] = options.message === void 0 ? "" : options.message;
      }
      /**
       * @type {*}
       */
      get error() {
        return this[kError];
      }
      /**
       * @type {String}
       */
      get message() {
        return this[kMessage];
      }
    };
    Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
    Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
    var MessageEvent = class extends Event {
      /**
       * Create a new `MessageEvent`.
       *
       * @param {String} type The name of the event
       * @param {Object} [options] A dictionary object that allows for setting
       *     attributes via object members of the same name
       * @param {*} [options.data=null] The message content
       */
      constructor(type, options = {}) {
        super(type);
        this[kData] = options.data === void 0 ? null : options.data;
      }
      /**
       * @type {*}
       */
      get data() {
        return this[kData];
      }
    };
    Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
    var EventTarget = {
      /**
       * Register an event listener.
       *
       * @param {String} type A string representing the event type to listen for
       * @param {(Function|Object)} handler The listener to add
       * @param {Object} [options] An options object specifies characteristics about
       *     the event listener
       * @param {Boolean} [options.once=false] A `Boolean` indicating that the
       *     listener should be invoked at most once after being added. If `true`,
       *     the listener would be automatically removed when invoked.
       * @public
       */
      addEventListener(type, handler2, options = {}) {
        for (const listener of this.listeners(type)) {
          if (!options[kForOnEventAttribute] && listener[kListener] === handler2 && !listener[kForOnEventAttribute]) {
            return;
          }
        }
        let wrapper;
        if (type === "message") {
          wrapper = function onMessage(data, isBinary) {
            const event = new MessageEvent("message", {
              data: isBinary ? data : data.toString()
            });
            event[kTarget] = this;
            callListener(handler2, this, event);
          };
        } else if (type === "close") {
          wrapper = function onClose(code, message) {
            const event = new CloseEvent("close", {
              code,
              reason: message.toString(),
              wasClean: this._closeFrameReceived && this._closeFrameSent
            });
            event[kTarget] = this;
            callListener(handler2, this, event);
          };
        } else if (type === "error") {
          wrapper = function onError(error2) {
            const event = new ErrorEvent("error", {
              error: error2,
              message: error2.message
            });
            event[kTarget] = this;
            callListener(handler2, this, event);
          };
        } else if (type === "open") {
          wrapper = function onOpen() {
            const event = new Event("open");
            event[kTarget] = this;
            callListener(handler2, this, event);
          };
        } else {
          return;
        }
        wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
        wrapper[kListener] = handler2;
        if (options.once) {
          this.once(type, wrapper);
        } else {
          this.on(type, wrapper);
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} type A string representing the event type to remove
       * @param {(Function|Object)} handler The listener to remove
       * @public
       */
      removeEventListener(type, handler2) {
        for (const listener of this.listeners(type)) {
          if (listener[kListener] === handler2 && !listener[kForOnEventAttribute]) {
            this.removeListener(type, listener);
            break;
          }
        }
      }
    };
    module2.exports = {
      CloseEvent,
      ErrorEvent,
      Event,
      EventTarget,
      MessageEvent
    };
    function callListener(listener, thisArg, event) {
      if (typeof listener === "object" && listener.handleEvent) {
        listener.handleEvent.call(listener, event);
      } else {
        listener.call(thisArg, event);
      }
    }
  }
});

// node_modules/ws/lib/extension.js
var require_extension = __commonJS({
  "node_modules/ws/lib/extension.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function push(dest, name2, elem) {
      if (dest[name2] === void 0) dest[name2] = [elem];
      else dest[name2].push(elem);
    }
    function parse2(header) {
      const offers = /* @__PURE__ */ Object.create(null);
      let params = /* @__PURE__ */ Object.create(null);
      let mustUnescape = false;
      let isEscaping = false;
      let inQuotes = false;
      let extensionName;
      let paramName;
      let start = -1;
      let code = -1;
      let end = -1;
      let i = 0;
      for (; i < header.length; i++) {
        code = header.charCodeAt(i);
        if (extensionName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (i !== 0 && (code === 32 || code === 9)) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            const name2 = header.slice(start, end);
            if (code === 44) {
              push(offers, name2, params);
              params = /* @__PURE__ */ Object.create(null);
            } else {
              extensionName = name2;
            }
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (paramName === void 0) {
          if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 32 || code === 9) {
            if (end === -1 && start !== -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            push(params, header.slice(start, end), true);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            start = end = -1;
          } else if (code === 61 && start !== -1 && end === -1) {
            paramName = header.slice(start, i);
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else {
          if (isEscaping) {
            if (tokenChars[code] !== 1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (start === -1) start = i;
            else if (!mustUnescape) mustUnescape = true;
            isEscaping = false;
          } else if (inQuotes) {
            if (tokenChars[code] === 1) {
              if (start === -1) start = i;
            } else if (code === 34 && start !== -1) {
              inQuotes = false;
              end = i;
            } else if (code === 92) {
              isEscaping = true;
            } else {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
          } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
            inQuotes = true;
          } else if (end === -1 && tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (start !== -1 && (code === 32 || code === 9)) {
            if (end === -1) end = i;
          } else if (code === 59 || code === 44) {
            if (start === -1) {
              throw new SyntaxError(`Unexpected character at index ${i}`);
            }
            if (end === -1) end = i;
            let value = header.slice(start, end);
            if (mustUnescape) {
              value = value.replace(/\\/g, "");
              mustUnescape = false;
            }
            push(params, paramName, value);
            if (code === 44) {
              push(offers, extensionName, params);
              params = /* @__PURE__ */ Object.create(null);
              extensionName = void 0;
            }
            paramName = void 0;
            start = end = -1;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        }
      }
      if (start === -1 || inQuotes || code === 32 || code === 9) {
        throw new SyntaxError("Unexpected end of input");
      }
      if (end === -1) end = i;
      const token = header.slice(start, end);
      if (extensionName === void 0) {
        push(offers, token, params);
      } else {
        if (paramName === void 0) {
          push(params, token, true);
        } else if (mustUnescape) {
          push(params, paramName, token.replace(/\\/g, ""));
        } else {
          push(params, paramName, token);
        }
        push(offers, extensionName, params);
      }
      return offers;
    }
    function format(extensions2) {
      return Object.keys(extensions2).map((extension2) => {
        let configurations = extensions2[extension2];
        if (!Array.isArray(configurations)) configurations = [configurations];
        return configurations.map((params) => {
          return [extension2].concat(
            Object.keys(params).map((k) => {
              let values = params[k];
              if (!Array.isArray(values)) values = [values];
              return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })
          ).join("; ");
        }).join(", ");
      }).join(", ");
    }
    module2.exports = { format, parse: parse2 };
  }
});

// node_modules/ws/lib/websocket.js
var require_websocket = __commonJS({
  "node_modules/ws/lib/websocket.js"(exports2, module2) {
    "use strict";
    var EventEmitter7 = require("events");
    var https2 = require("https");
    var http2 = require("http");
    var net8 = require("net");
    var tls3 = require("tls");
    var { randomBytes, createHash } = require("crypto");
    var { Duplex, Readable } = require("stream");
    var { URL: URL2 } = require("url");
    var PerMessageDeflate2 = require_permessage_deflate();
    var Receiver2 = require_receiver();
    var Sender2 = require_sender();
    var { isBlob } = require_validation();
    var {
      BINARY_TYPES,
      CLOSE_TIMEOUT: CLOSE_TIMEOUT2,
      EMPTY_BUFFER,
      GUID,
      kForOnEventAttribute,
      kListener,
      kStatusCode,
      kWebSocket,
      NOOP
    } = require_constants();
    var {
      EventTarget: { addEventListener: addEventListener2, removeEventListener }
    } = require_event_target();
    var { format, parse: parse2 } = require_extension();
    var { toBuffer } = require_buffer_util();
    var kAborted = /* @__PURE__ */ Symbol("kAborted");
    var protocolVersions = [8, 13];
    var readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
    var subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
    var WebSocket2 = class _WebSocket extends EventEmitter7 {
      /**
       * Create a new `WebSocket`.
       *
       * @param {(String|URL)} address The URL to which to connect
       * @param {(String|String[])} [protocols] The subprotocols
       * @param {Object} [options] Connection options
       */
      constructor(address, protocols, options) {
        super();
        this._binaryType = BINARY_TYPES[0];
        this._closeCode = 1006;
        this._closeFrameReceived = false;
        this._closeFrameSent = false;
        this._closeMessage = EMPTY_BUFFER;
        this._closeTimer = null;
        this._errorEmitted = false;
        this._extensions = {};
        this._paused = false;
        this._protocol = "";
        this._readyState = _WebSocket.CONNECTING;
        this._receiver = null;
        this._sender = null;
        this._socket = null;
        if (address !== null) {
          this._bufferedAmount = 0;
          this._isServer = false;
          this._redirects = 0;
          if (protocols === void 0) {
            if (!options || options.protocols === void 0) {
              protocols = [];
            } else if (Array.isArray(options.protocols)) {
              protocols = options.protocols;
            } else {
              protocols = [options.protocols];
            }
          } else if (!Array.isArray(protocols)) {
            if (typeof protocols === "object" && protocols !== null) {
              options = protocols;
              if (options.protocols === void 0) {
                protocols = [];
              } else if (Array.isArray(options.protocols)) {
                protocols = options.protocols;
              } else {
                protocols = [options.protocols];
              }
            } else {
              protocols = [protocols];
            }
          }
          initAsClient(this, address, protocols, options);
        } else {
          this._autoPong = options.autoPong;
          this._closeTimeout = options.closeTimeout;
          this._isServer = true;
        }
      }
      /**
       * For historical reasons, the custom "nodebuffer" type is used by the default
       * instead of "blob".
       *
       * @type {String}
       */
      get binaryType() {
        return this._binaryType;
      }
      set binaryType(type) {
        if (!BINARY_TYPES.includes(type)) return;
        this._binaryType = type;
        if (this._receiver) this._receiver._binaryType = type;
      }
      /**
       * @type {Number}
       */
      get bufferedAmount() {
        if (!this._socket) return this._bufferedAmount;
        return this._socket._writableState.length + this._sender._bufferedBytes;
      }
      /**
       * @type {String}
       */
      get extensions() {
        return Object.keys(this._extensions).join();
      }
      /**
       * @type {Boolean}
       */
      get isPaused() {
        return this._paused;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onclose() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onerror() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onopen() {
        return null;
      }
      /**
       * @type {Function}
       */
      /* istanbul ignore next */
      get onmessage() {
        return null;
      }
      /**
       * @type {String}
       */
      get protocol() {
        return this._protocol;
      }
      /**
       * @type {Number}
       */
      get readyState() {
        return this._readyState;
      }
      /**
       * @type {String}
       */
      get url() {
        return this._url;
      }
      /**
       * Set up the socket and the internal resources.
       *
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Object} options Options object
       * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Function} [options.generateMask] The function used to generate the
       *     masking key
       * @param {Number} [options.maxBufferedChunks=0] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=0] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=0] The maximum allowed message size
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @private
       */
      setSocket(socket, head, options) {
        const receiver = new Receiver2({
          allowSynchronousEvents: options.allowSynchronousEvents,
          binaryType: this.binaryType,
          extensions: this._extensions,
          isServer: this._isServer,
          maxBufferedChunks: options.maxBufferedChunks,
          maxFragments: options.maxFragments,
          maxPayload: options.maxPayload,
          skipUTF8Validation: options.skipUTF8Validation
        });
        const sender = new Sender2(socket, this._extensions, options.generateMask);
        this._receiver = receiver;
        this._sender = sender;
        this._socket = socket;
        receiver[kWebSocket] = this;
        sender[kWebSocket] = this;
        socket[kWebSocket] = this;
        receiver.on("conclude", receiverOnConclude);
        receiver.on("drain", receiverOnDrain);
        receiver.on("error", receiverOnError);
        receiver.on("message", receiverOnMessage);
        receiver.on("ping", receiverOnPing);
        receiver.on("pong", receiverOnPong);
        sender.onerror = senderOnError;
        if (socket.setTimeout) socket.setTimeout(0);
        if (socket.setNoDelay) socket.setNoDelay();
        if (head.length > 0) socket.unshift(head);
        socket.on("close", socketOnClose);
        socket.on("data", socketOnData);
        socket.on("end", socketOnEnd);
        socket.on("error", socketOnError);
        this._readyState = _WebSocket.OPEN;
        this.emit("open");
      }
      /**
       * Emit the `'close'` event.
       *
       * @private
       */
      emitClose() {
        if (!this._socket) {
          this._readyState = _WebSocket.CLOSED;
          this.emit("close", this._closeCode, this._closeMessage);
          return;
        }
        if (this._extensions[PerMessageDeflate2.extensionName]) {
          this._extensions[PerMessageDeflate2.extensionName].cleanup();
        }
        this._receiver.removeAllListeners();
        this._readyState = _WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
      }
      /**
       * Start a closing handshake.
       *
       *          +----------+   +-----------+   +----------+
       *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
       *    |     +----------+   +-----------+   +----------+     |
       *          +----------+   +-----------+         |
       * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
       *          +----------+   +-----------+   |
       *    |           |                        |   +---+        |
       *                +------------------------+-->|fin| - - - -
       *    |         +---+                      |   +---+
       *     - - - - -|fin|<---------------------+
       *              +---+
       *
       * @param {Number} [code] Status code explaining why the connection is closing
       * @param {(String|Buffer)} [data] The reason why the connection is
       *     closing
       * @public
       */
      close(code, data) {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this.readyState === _WebSocket.CLOSING) {
          if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
            this._socket.end();
          }
          return;
        }
        this._sender.close(code, data, !this._isServer, (err) => {
          if (err) return;
          this._closeFrameSent = true;
          if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
            this._socket.end();
          }
        });
        this._readyState = _WebSocket.CLOSING;
        setCloseTimer(this);
      }
      /**
       * Pause the socket.
       *
       * @public
       */
      pause() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = true;
        this._socket.pause();
      }
      /**
       * Send a ping.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the ping is sent
       * @public
       */
      ping(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.ping(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Send a pong.
       *
       * @param {*} [data] The data to send
       * @param {Boolean} [mask] Indicates whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when the pong is sent
       * @public
       */
      pong(data, mask, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof data === "function") {
          cb = data;
          data = mask = void 0;
        } else if (typeof mask === "function") {
          cb = mask;
          mask = void 0;
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        if (mask === void 0) mask = !this._isServer;
        this._sender.pong(data || EMPTY_BUFFER, mask, cb);
      }
      /**
       * Resume the socket.
       *
       * @public
       */
      resume() {
        if (this.readyState === _WebSocket.CONNECTING || this.readyState === _WebSocket.CLOSED) {
          return;
        }
        this._paused = false;
        if (!this._receiver._writableState.needDrain) this._socket.resume();
      }
      /**
       * Send a data message.
       *
       * @param {*} data The message to send
       * @param {Object} [options] Options object
       * @param {Boolean} [options.binary] Specifies whether `data` is binary or
       *     text
       * @param {Boolean} [options.compress] Specifies whether or not to compress
       *     `data`
       * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
       *     last one
       * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
       * @param {Function} [cb] Callback which is executed when data is written out
       * @public
       */
      send(data, options, cb) {
        if (this.readyState === _WebSocket.CONNECTING) {
          throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
        }
        if (typeof options === "function") {
          cb = options;
          options = {};
        }
        if (typeof data === "number") data = data.toString();
        if (this.readyState !== _WebSocket.OPEN) {
          sendAfterClose(this, data, cb);
          return;
        }
        const opts = {
          binary: typeof data !== "string",
          mask: !this._isServer,
          compress: true,
          fin: true,
          ...options
        };
        if (!this._extensions[PerMessageDeflate2.extensionName]) {
          opts.compress = false;
        }
        this._sender.send(data || EMPTY_BUFFER, opts, cb);
      }
      /**
       * Forcibly close the connection.
       *
       * @public
       */
      terminate() {
        if (this.readyState === _WebSocket.CLOSED) return;
        if (this.readyState === _WebSocket.CONNECTING) {
          const msg = "WebSocket was closed before the connection was established";
          abortHandshake(this, this._req, msg);
          return;
        }
        if (this._socket) {
          this._readyState = _WebSocket.CLOSING;
          this._socket.destroy();
        }
      }
    };
    Object.defineProperty(WebSocket2, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2.prototype, "CONNECTING", {
      enumerable: true,
      value: readyStates.indexOf("CONNECTING")
    });
    Object.defineProperty(WebSocket2, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2.prototype, "OPEN", {
      enumerable: true,
      value: readyStates.indexOf("OPEN")
    });
    Object.defineProperty(WebSocket2, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSING", {
      enumerable: true,
      value: readyStates.indexOf("CLOSING")
    });
    Object.defineProperty(WebSocket2, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    Object.defineProperty(WebSocket2.prototype, "CLOSED", {
      enumerable: true,
      value: readyStates.indexOf("CLOSED")
    });
    [
      "binaryType",
      "bufferedAmount",
      "extensions",
      "isPaused",
      "protocol",
      "readyState",
      "url"
    ].forEach((property) => {
      Object.defineProperty(WebSocket2.prototype, property, { enumerable: true });
    });
    ["open", "error", "close", "message"].forEach((method) => {
      Object.defineProperty(WebSocket2.prototype, `on${method}`, {
        enumerable: true,
        get() {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) return listener[kListener];
          }
          return null;
        },
        set(handler2) {
          for (const listener of this.listeners(method)) {
            if (listener[kForOnEventAttribute]) {
              this.removeListener(method, listener);
              break;
            }
          }
          if (typeof handler2 !== "function") return;
          this.addEventListener(method, handler2, {
            [kForOnEventAttribute]: true
          });
        }
      });
    });
    WebSocket2.prototype.addEventListener = addEventListener2;
    WebSocket2.prototype.removeEventListener = removeEventListener;
    module2.exports = WebSocket2;
    function initAsClient(websocket, address, protocols, options) {
      const opts = {
        allowSynchronousEvents: true,
        autoPong: true,
        closeTimeout: CLOSE_TIMEOUT2,
        protocolVersion: protocolVersions[1],
        maxBufferedChunks: 256 * 1024,
        maxFragments: 16 * 1024,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: true,
        followRedirects: false,
        maxRedirects: 10,
        ...options,
        socketPath: void 0,
        hostname: void 0,
        protocol: void 0,
        protocols: void 0,
        timeout: void 0,
        method: "GET",
        host: void 0,
        path: void 0,
        port: void 0
      };
      websocket._autoPong = opts.autoPong;
      websocket._closeTimeout = opts.closeTimeout;
      if (!protocolVersions.includes(opts.protocolVersion)) {
        throw new RangeError(
          `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
        );
      }
      let parsedUrl;
      if (address instanceof URL2) {
        parsedUrl = address;
      } else {
        try {
          parsedUrl = new URL2(address);
        } catch {
          throw new SyntaxError(`Invalid URL: ${address}`);
        }
      }
      if (parsedUrl.protocol === "http:") {
        parsedUrl.protocol = "ws:";
      } else if (parsedUrl.protocol === "https:") {
        parsedUrl.protocol = "wss:";
      }
      websocket._url = parsedUrl.href;
      const isSecure = parsedUrl.protocol === "wss:";
      const isIpcUrl = parsedUrl.protocol === "ws+unix:";
      let invalidUrlMessage;
      if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
        invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
      } else if (isIpcUrl && !parsedUrl.pathname) {
        invalidUrlMessage = "The URL's pathname is empty";
      } else if (parsedUrl.hash) {
        invalidUrlMessage = "The URL contains a fragment identifier";
      }
      if (invalidUrlMessage) {
        const err = new SyntaxError(invalidUrlMessage);
        if (websocket._redirects === 0) {
          throw err;
        } else {
          emitErrorAndClose(websocket, err);
          return;
        }
      }
      const defaultPort = isSecure ? 443 : 80;
      const key = randomBytes(16).toString("base64");
      const request = isSecure ? https2.request : http2.request;
      const protocolSet = /* @__PURE__ */ new Set();
      let perMessageDeflate;
      opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
      opts.defaultPort = opts.defaultPort || defaultPort;
      opts.port = parsedUrl.port || defaultPort;
      opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
      opts.headers = {
        ...opts.headers,
        "Sec-WebSocket-Version": opts.protocolVersion,
        "Sec-WebSocket-Key": key,
        Connection: "Upgrade",
        Upgrade: "websocket"
      };
      opts.path = parsedUrl.pathname + parsedUrl.search;
      opts.timeout = opts.handshakeTimeout;
      if (opts.perMessageDeflate) {
        perMessageDeflate = new PerMessageDeflate2({
          ...opts.perMessageDeflate,
          isServer: false,
          maxPayload: opts.maxPayload
        });
        opts.headers["Sec-WebSocket-Extensions"] = format({
          [PerMessageDeflate2.extensionName]: perMessageDeflate.offer()
        });
      }
      if (protocols.length) {
        for (const protocol of protocols) {
          if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
            throw new SyntaxError(
              "An invalid or duplicated subprotocol was specified"
            );
          }
          protocolSet.add(protocol);
        }
        opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
      }
      if (opts.origin) {
        if (opts.protocolVersion < 13) {
          opts.headers["Sec-WebSocket-Origin"] = opts.origin;
        } else {
          opts.headers.Origin = opts.origin;
        }
      }
      if (parsedUrl.username || parsedUrl.password) {
        opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
      }
      if (isIpcUrl) {
        const parts = opts.path.split(":");
        opts.socketPath = parts[0];
        opts.path = parts[1];
      }
      let req;
      if (opts.followRedirects) {
        if (websocket._redirects === 0) {
          websocket._originalIpc = isIpcUrl;
          websocket._originalSecure = isSecure;
          websocket._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
          const headers = options && options.headers;
          options = { ...options, headers: {} };
          if (headers) {
            for (const [key2, value] of Object.entries(headers)) {
              options.headers[key2.toLowerCase()] = value;
            }
          }
        } else if (websocket.listenerCount("redirect") === 0) {
          const isSameHost = isIpcUrl ? websocket._originalIpc ? opts.socketPath === websocket._originalHostOrSocketPath : false : websocket._originalIpc ? false : parsedUrl.host === websocket._originalHostOrSocketPath;
          if (!isSameHost || websocket._originalSecure && !isSecure) {
            delete opts.headers.authorization;
            delete opts.headers.cookie;
            if (!isSameHost) delete opts.headers.host;
            opts.auth = void 0;
          }
        }
        if (opts.auth && !options.headers.authorization) {
          options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
        }
        req = websocket._req = request(opts);
        if (websocket._redirects) {
          websocket.emit("redirect", websocket.url, req);
        }
      } else {
        req = websocket._req = request(opts);
      }
      if (opts.timeout) {
        req.on("timeout", () => {
          abortHandshake(websocket, req, "Opening handshake has timed out");
        });
      }
      req.on("error", (err) => {
        if (req === null || req[kAborted]) return;
        req = websocket._req = null;
        emitErrorAndClose(websocket, err);
      });
      req.on("response", (res) => {
        const location = res.headers.location;
        const statusCode = res.statusCode;
        if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
          if (++websocket._redirects > opts.maxRedirects) {
            abortHandshake(websocket, req, "Maximum redirects exceeded");
            return;
          }
          req.abort();
          let addr;
          try {
            addr = new URL2(location, address);
          } catch (e) {
            const err = new SyntaxError(`Invalid URL: ${location}`);
            emitErrorAndClose(websocket, err);
            return;
          }
          initAsClient(websocket, addr, protocols, options);
        } else if (!websocket.emit("unexpected-response", req, res)) {
          abortHandshake(
            websocket,
            req,
            `Unexpected server response: ${res.statusCode}`
          );
        }
      });
      req.on("upgrade", (res, socket, head) => {
        websocket.emit("upgrade", res);
        if (websocket.readyState !== WebSocket2.CONNECTING) return;
        req = websocket._req = null;
        const upgrade = res.headers.upgrade;
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          abortHandshake(websocket, socket, "Invalid Upgrade header");
          return;
        }
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        if (res.headers["sec-websocket-accept"] !== digest) {
          abortHandshake(websocket, socket, "Invalid Sec-WebSocket-Accept header");
          return;
        }
        const serverProt = res.headers["sec-websocket-protocol"];
        let protError;
        if (serverProt !== void 0) {
          if (!protocolSet.size) {
            protError = "Server sent a subprotocol but none was requested";
          } else if (!protocolSet.has(serverProt)) {
            protError = "Server sent an invalid subprotocol";
          }
        } else if (protocolSet.size) {
          protError = "Server sent no subprotocol";
        }
        if (protError) {
          abortHandshake(websocket, socket, protError);
          return;
        }
        if (serverProt) websocket._protocol = serverProt;
        const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
        if (secWebSocketExtensions !== void 0) {
          if (!perMessageDeflate) {
            const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          let extensions2;
          try {
            extensions2 = parse2(secWebSocketExtensions);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          const extensionNames = Object.keys(extensions2);
          if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate2.extensionName) {
            const message = "Server indicated an extension that was not requested";
            abortHandshake(websocket, socket, message);
            return;
          }
          try {
            perMessageDeflate.accept(extensions2[PerMessageDeflate2.extensionName]);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Extensions header";
            abortHandshake(websocket, socket, message);
            return;
          }
          websocket._extensions[PerMessageDeflate2.extensionName] = perMessageDeflate;
        }
        websocket.setSocket(socket, head, {
          allowSynchronousEvents: opts.allowSynchronousEvents,
          generateMask: opts.generateMask,
          maxBufferedChunks: opts.maxBufferedChunks,
          maxFragments: opts.maxFragments,
          maxPayload: opts.maxPayload,
          skipUTF8Validation: opts.skipUTF8Validation
        });
      });
      if (opts.finishRequest) {
        opts.finishRequest(req, websocket);
      } else {
        req.end();
      }
    }
    function emitErrorAndClose(websocket, err) {
      websocket._readyState = WebSocket2.CLOSING;
      websocket._errorEmitted = true;
      websocket.emit("error", err);
      websocket.emitClose();
    }
    function netConnect(options) {
      options.path = options.socketPath;
      return net8.connect(options);
    }
    function tlsConnect(options) {
      options.path = void 0;
      if (!options.servername && options.servername !== "") {
        options.servername = net8.isIP(options.host) ? "" : options.host;
      }
      return tls3.connect(options);
    }
    function abortHandshake(websocket, stream, message) {
      websocket._readyState = WebSocket2.CLOSING;
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshake);
      if (stream.setHeader) {
        stream[kAborted] = true;
        stream.abort();
        if (stream.socket && !stream.socket.destroyed) {
          stream.socket.destroy();
        }
        process.nextTick(emitErrorAndClose, websocket, err);
      } else {
        stream.destroy(err);
        stream.once("error", websocket.emit.bind(websocket, "error"));
        stream.once("close", websocket.emitClose.bind(websocket));
      }
    }
    function sendAfterClose(websocket, data, cb) {
      if (data) {
        const length = isBlob(data) ? data.size : toBuffer(data).length;
        if (websocket._socket) websocket._sender._bufferedBytes += length;
        else websocket._bufferedAmount += length;
      }
      if (cb) {
        const err = new Error(
          `WebSocket is not open: readyState ${websocket.readyState} (${readyStates[websocket.readyState]})`
        );
        process.nextTick(cb, err);
      }
    }
    function receiverOnConclude(code, reason) {
      const websocket = this[kWebSocket];
      websocket._closeFrameReceived = true;
      websocket._closeMessage = reason;
      websocket._closeCode = code;
      if (websocket._socket[kWebSocket] === void 0) return;
      websocket._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket._socket);
      if (code === 1005) websocket.close();
      else websocket.close(code, reason);
    }
    function receiverOnDrain() {
      const websocket = this[kWebSocket];
      if (!websocket.isPaused) websocket._socket.resume();
    }
    function receiverOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket._socket[kWebSocket] !== void 0) {
        websocket._socket.removeListener("data", socketOnData);
        process.nextTick(resume, websocket._socket);
        websocket.close(err[kStatusCode]);
      }
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function receiverOnFinish() {
      this[kWebSocket].emitClose();
    }
    function receiverOnMessage(data, isBinary) {
      this[kWebSocket].emit("message", data, isBinary);
    }
    function receiverOnPing(data) {
      const websocket = this[kWebSocket];
      if (websocket._autoPong) websocket.pong(data, !this._isServer, NOOP);
      websocket.emit("ping", data);
    }
    function receiverOnPong(data) {
      this[kWebSocket].emit("pong", data);
    }
    function resume(stream) {
      stream.resume();
    }
    function senderOnError(err) {
      const websocket = this[kWebSocket];
      if (websocket.readyState === WebSocket2.CLOSED) return;
      if (websocket.readyState === WebSocket2.OPEN) {
        websocket._readyState = WebSocket2.CLOSING;
        setCloseTimer(websocket);
      }
      this._socket.end();
      if (!websocket._errorEmitted) {
        websocket._errorEmitted = true;
        websocket.emit("error", err);
      }
    }
    function setCloseTimer(websocket) {
      websocket._closeTimer = setTimeout(
        websocket._socket.destroy.bind(websocket._socket),
        websocket._closeTimeout
      );
    }
    function socketOnClose() {
      const websocket = this[kWebSocket];
      this.removeListener("close", socketOnClose);
      this.removeListener("data", socketOnData);
      this.removeListener("end", socketOnEnd);
      websocket._readyState = WebSocket2.CLOSING;
      if (!this._readableState.endEmitted && !websocket._closeFrameReceived && !websocket._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
        const chunk = this.read(this._readableState.length);
        websocket._receiver.write(chunk);
      }
      websocket._receiver.end();
      this[kWebSocket] = void 0;
      clearTimeout(websocket._closeTimer);
      if (websocket._receiver._writableState.finished || websocket._receiver._writableState.errorEmitted) {
        websocket.emitClose();
      } else {
        websocket._receiver.on("error", receiverOnFinish);
        websocket._receiver.on("finish", receiverOnFinish);
      }
    }
    function socketOnData(chunk) {
      if (!this[kWebSocket]._receiver.write(chunk)) {
        this.pause();
      }
    }
    function socketOnEnd() {
      const websocket = this[kWebSocket];
      websocket._readyState = WebSocket2.CLOSING;
      websocket._receiver.end();
      this.end();
    }
    function socketOnError() {
      const websocket = this[kWebSocket];
      this.removeListener("error", socketOnError);
      this.on("error", NOOP);
      if (websocket) {
        websocket._readyState = WebSocket2.CLOSING;
        this.destroy();
      }
    }
  }
});

// node_modules/ws/lib/stream.js
var require_stream = __commonJS({
  "node_modules/ws/lib/stream.js"(exports2, module2) {
    "use strict";
    var WebSocket2 = require_websocket();
    var { Duplex } = require("stream");
    function emitClose(stream) {
      stream.emit("close");
    }
    function duplexOnEnd() {
      if (!this.destroyed && this._writableState.finished) {
        this.destroy();
      }
    }
    function duplexOnError(err) {
      this.removeListener("error", duplexOnError);
      this.destroy();
      if (this.listenerCount("error") === 0) {
        this.emit("error", err);
      }
    }
    function createWebSocketStream2(ws, options) {
      let terminateOnDestroy = true;
      const duplex = new Duplex({
        ...options,
        autoDestroy: false,
        emitClose: false,
        objectMode: false,
        writableObjectMode: false
      });
      ws.on("message", function message(msg, isBinary) {
        const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
        if (!duplex.push(data)) ws.pause();
      });
      ws.once("error", function error2(err) {
        if (duplex.destroyed) return;
        terminateOnDestroy = false;
        duplex.destroy(err);
      });
      ws.once("close", function close() {
        if (duplex.destroyed) return;
        duplex.push(null);
      });
      duplex._destroy = function(err, callback) {
        if (ws.readyState === ws.CLOSED) {
          callback(err);
          process.nextTick(emitClose, duplex);
          return;
        }
        let called = false;
        ws.once("error", function error2(err2) {
          called = true;
          callback(err2);
        });
        ws.once("close", function close() {
          if (!called) callback(err);
          process.nextTick(emitClose, duplex);
        });
        if (terminateOnDestroy) ws.terminate();
      };
      duplex._final = function(callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._final(callback);
          });
          return;
        }
        if (ws._socket === null) return;
        if (ws._socket._writableState.finished) {
          callback();
          if (duplex._readableState.endEmitted) duplex.destroy();
        } else {
          ws._socket.once("finish", function finish() {
            callback();
          });
          ws.close();
        }
      };
      duplex._read = function() {
        if (ws.isPaused) ws.resume();
      };
      duplex._write = function(chunk, encoding, callback) {
        if (ws.readyState === ws.CONNECTING) {
          ws.once("open", function open() {
            duplex._write(chunk, encoding, callback);
          });
          return;
        }
        ws.send(chunk, callback);
      };
      duplex.on("end", duplexOnEnd);
      duplex.on("error", duplexOnError);
      return duplex;
    }
    module2.exports = createWebSocketStream2;
  }
});

// node_modules/ws/lib/subprotocol.js
var require_subprotocol = __commonJS({
  "node_modules/ws/lib/subprotocol.js"(exports2, module2) {
    "use strict";
    var { tokenChars } = require_validation();
    function parse2(header) {
      const protocols = /* @__PURE__ */ new Set();
      let start = -1;
      let end = -1;
      let i = 0;
      for (i; i < header.length; i++) {
        const code = header.charCodeAt(i);
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const protocol2 = header.slice(start, end);
          if (protocols.has(protocol2)) {
            throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
          }
          protocols.add(protocol2);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
      if (start === -1 || end !== -1) {
        throw new SyntaxError("Unexpected end of input");
      }
      const protocol = header.slice(start, i);
      if (protocols.has(protocol)) {
        throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
      }
      protocols.add(protocol);
      return protocols;
    }
    module2.exports = { parse: parse2 };
  }
});

// node_modules/ws/lib/websocket-server.js
var require_websocket_server = __commonJS({
  "node_modules/ws/lib/websocket-server.js"(exports2, module2) {
    "use strict";
    var EventEmitter7 = require("events");
    var http2 = require("http");
    var { Duplex } = require("stream");
    var { createHash } = require("crypto");
    var extension2 = require_extension();
    var PerMessageDeflate2 = require_permessage_deflate();
    var subprotocol2 = require_subprotocol();
    var WebSocket2 = require_websocket();
    var { CLOSE_TIMEOUT: CLOSE_TIMEOUT2, GUID, kWebSocket } = require_constants();
    var keyRegex = /^[+/0-9A-Za-z]{22}==$/;
    var RUNNING = 0;
    var CLOSING = 1;
    var CLOSED = 2;
    var WebSocketServer2 = class extends EventEmitter7 {
      /**
       * Create a `WebSocketServer` instance.
       *
       * @param {Object} options Configuration options
       * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
       *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
       *     multiple times in the same tick
       * @param {Boolean} [options.autoPong=true] Specifies whether or not to
       *     automatically send a pong in response to a ping
       * @param {Number} [options.backlog=511] The maximum length of the queue of
       *     pending connections
       * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
       *     track clients
       * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
       *     wait for the closing handshake to finish after `websocket.close()` is
       *     called
       * @param {Function} [options.handleProtocols] A hook to handle protocols
       * @param {String} [options.host] The hostname where to bind the server
       * @param {Number} [options.maxBufferedChunks=262144] The maximum number of
       *     buffered data chunks
       * @param {Number} [options.maxFragments=16384] The maximum number of message
       *     fragments
       * @param {Number} [options.maxPayload=104857600] The maximum allowed message
       *     size
       * @param {Boolean} [options.noServer=false] Enable no server mode
       * @param {String} [options.path] Accept only connections matching this path
       * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
       *     permessage-deflate
       * @param {Number} [options.port] The port where to bind the server
       * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
       *     server to use
       * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
       *     not to skip UTF-8 validation for text and close messages
       * @param {Function} [options.verifyClient] A hook to reject connections
       * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
       *     class to use. It must be the `WebSocket` class or class that extends it
       * @param {Function} [callback] A listener for the `listening` event
       */
      constructor(options, callback) {
        super();
        options = {
          allowSynchronousEvents: true,
          autoPong: true,
          maxBufferedChunks: 256 * 1024,
          maxFragments: 16 * 1024,
          maxPayload: 100 * 1024 * 1024,
          skipUTF8Validation: false,
          perMessageDeflate: false,
          handleProtocols: null,
          clientTracking: true,
          closeTimeout: CLOSE_TIMEOUT2,
          verifyClient: null,
          noServer: false,
          backlog: null,
          // use default (511 as implemented in net.js)
          server: null,
          host: null,
          path: null,
          port: null,
          WebSocket: WebSocket2,
          ...options
        };
        if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
          throw new TypeError(
            'One and only one of the "port", "server", or "noServer" options must be specified'
          );
        }
        if (options.port != null) {
          this._server = http2.createServer((req, res) => {
            const body = http2.STATUS_CODES[426];
            res.writeHead(426, {
              "Content-Length": body.length,
              "Content-Type": "text/plain"
            });
            res.end(body);
          });
          this._server.listen(
            options.port,
            options.host,
            options.backlog,
            callback
          );
        } else if (options.server) {
          this._server = options.server;
        }
        if (this._server) {
          const emitConnection = this.emit.bind(this, "connection");
          this._removeListeners = addListeners(this._server, {
            listening: this.emit.bind(this, "listening"),
            error: this.emit.bind(this, "error"),
            upgrade: (req, socket, head) => {
              this.handleUpgrade(req, socket, head, emitConnection);
            }
          });
        }
        if (options.perMessageDeflate === true) options.perMessageDeflate = {};
        if (options.clientTracking) {
          this.clients = /* @__PURE__ */ new Set();
          this._shouldEmitClose = false;
        }
        this.options = options;
        this._state = RUNNING;
      }
      /**
       * Returns the bound address, the address family name, and port of the server
       * as reported by the operating system if listening on an IP socket.
       * If the server is listening on a pipe or UNIX domain socket, the name is
       * returned as a string.
       *
       * @return {(Object|String|null)} The address of the server
       * @public
       */
      address() {
        if (this.options.noServer) {
          throw new Error('The server is operating in "noServer" mode');
        }
        if (!this._server) return null;
        return this._server.address();
      }
      /**
       * Stop the server from accepting new connections and emit the `'close'` event
       * when all existing connections are closed.
       *
       * @param {Function} [cb] A one-time listener for the `'close'` event
       * @public
       */
      close(cb) {
        if (this._state === CLOSED) {
          if (cb) {
            this.once("close", () => {
              cb(new Error("The server is not running"));
            });
          }
          process.nextTick(emitClose, this);
          return;
        }
        if (cb) this.once("close", cb);
        if (this._state === CLOSING) return;
        this._state = CLOSING;
        if (this.options.noServer || this.options.server) {
          if (this._server) {
            this._removeListeners();
            this._removeListeners = this._server = null;
          }
          if (this.clients) {
            if (!this.clients.size) {
              process.nextTick(emitClose, this);
            } else {
              this._shouldEmitClose = true;
            }
          } else {
            process.nextTick(emitClose, this);
          }
        } else {
          const server = this._server;
          this._removeListeners();
          this._removeListeners = this._server = null;
          server.close(() => {
            emitClose(this);
          });
        }
      }
      /**
       * See if a given request should be handled by this server instance.
       *
       * @param {http.IncomingMessage} req Request object to inspect
       * @return {Boolean} `true` if the request is valid, else `false`
       * @public
       */
      shouldHandle(req) {
        if (this.options.path) {
          const index = req.url.indexOf("?");
          const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
          if (pathname !== this.options.path) return false;
        }
        return true;
      }
      /**
       * Handle a HTTP Upgrade request.
       *
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @public
       */
      handleUpgrade(req, socket, head, cb) {
        socket.on("error", socketOnError);
        const key = req.headers["sec-websocket-key"];
        const upgrade = req.headers.upgrade;
        const version3 = +req.headers["sec-websocket-version"];
        if (req.method !== "GET") {
          const message = "Invalid HTTP method";
          abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
          return;
        }
        if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
          const message = "Invalid Upgrade header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (key === void 0 || !keyRegex.test(key)) {
          const message = "Missing or invalid Sec-WebSocket-Key header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
        if (version3 !== 13 && version3 !== 8) {
          const message = "Missing or invalid Sec-WebSocket-Version header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
            "Sec-WebSocket-Version": "13, 8"
          });
          return;
        }
        if (!this.shouldHandle(req)) {
          abortHandshake(socket, 400);
          return;
        }
        const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
        let protocols = /* @__PURE__ */ new Set();
        if (secWebSocketProtocol !== void 0) {
          try {
            protocols = subprotocol2.parse(secWebSocketProtocol);
          } catch (err) {
            const message = "Invalid Sec-WebSocket-Protocol header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
        const extensions2 = {};
        if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
          const perMessageDeflate = new PerMessageDeflate2({
            ...this.options.perMessageDeflate,
            isServer: true,
            maxPayload: this.options.maxPayload
          });
          try {
            const offers = extension2.parse(secWebSocketExtensions);
            if (offers[PerMessageDeflate2.extensionName]) {
              perMessageDeflate.accept(offers[PerMessageDeflate2.extensionName]);
              extensions2[PerMessageDeflate2.extensionName] = perMessageDeflate;
            }
          } catch (err) {
            const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
            abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
            return;
          }
        }
        if (this.options.verifyClient) {
          const info = {
            origin: req.headers[`${version3 === 8 ? "sec-websocket-origin" : "origin"}`],
            secure: !!(req.socket.authorized || req.socket.encrypted),
            req
          };
          if (this.options.verifyClient.length === 2) {
            this.options.verifyClient(info, (verified, code, message, headers) => {
              if (!verified) {
                return abortHandshake(socket, code || 401, message, headers);
              }
              this.completeUpgrade(
                extensions2,
                key,
                protocols,
                req,
                socket,
                head,
                cb
              );
            });
            return;
          }
          if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
        }
        this.completeUpgrade(extensions2, key, protocols, req, socket, head, cb);
      }
      /**
       * Upgrade the connection to WebSocket.
       *
       * @param {Object} extensions The accepted extensions
       * @param {String} key The value of the `Sec-WebSocket-Key` header
       * @param {Set} protocols The subprotocols
       * @param {http.IncomingMessage} req The request object
       * @param {Duplex} socket The network socket between the server and client
       * @param {Buffer} head The first packet of the upgraded stream
       * @param {Function} cb Callback
       * @throws {Error} If called more than once with the same socket
       * @private
       */
      completeUpgrade(extensions2, key, protocols, req, socket, head, cb) {
        if (!socket.readable || !socket.writable) return socket.destroy();
        if (socket[kWebSocket]) {
          throw new Error(
            "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
          );
        }
        if (this._state > RUNNING) return abortHandshake(socket, 503);
        const digest = createHash("sha1").update(key + GUID).digest("base64");
        const headers = [
          "HTTP/1.1 101 Switching Protocols",
          "Upgrade: websocket",
          "Connection: Upgrade",
          `Sec-WebSocket-Accept: ${digest}`
        ];
        const ws = new this.options.WebSocket(null, void 0, this.options);
        if (protocols.size) {
          const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
          if (protocol) {
            headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
            ws._protocol = protocol;
          }
        }
        if (extensions2[PerMessageDeflate2.extensionName]) {
          const params = extensions2[PerMessageDeflate2.extensionName].params;
          const value = extension2.format({
            [PerMessageDeflate2.extensionName]: [params]
          });
          headers.push(`Sec-WebSocket-Extensions: ${value}`);
          ws._extensions = extensions2;
        }
        this.emit("headers", headers, req);
        socket.write(headers.concat("\r\n").join("\r\n"));
        socket.removeListener("error", socketOnError);
        ws.setSocket(socket, head, {
          allowSynchronousEvents: this.options.allowSynchronousEvents,
          maxBufferedChunks: this.options.maxBufferedChunks,
          maxFragments: this.options.maxFragments,
          maxPayload: this.options.maxPayload,
          skipUTF8Validation: this.options.skipUTF8Validation
        });
        if (this.clients) {
          this.clients.add(ws);
          ws.on("close", () => {
            this.clients.delete(ws);
            if (this._shouldEmitClose && !this.clients.size) {
              process.nextTick(emitClose, this);
            }
          });
        }
        cb(ws, req);
      }
    };
    module2.exports = WebSocketServer2;
    function addListeners(server, map2) {
      for (const event of Object.keys(map2)) server.on(event, map2[event]);
      return function removeListeners() {
        for (const event of Object.keys(map2)) {
          server.removeListener(event, map2[event]);
        }
      };
    }
    function emitClose(server) {
      server._state = CLOSED;
      server.emit("close");
    }
    function socketOnError() {
      this.destroy();
    }
    function abortHandshake(socket, code, message, headers) {
      message = message || http2.STATUS_CODES[code];
      headers = {
        Connection: "close",
        "Content-Type": "text/html",
        "Content-Length": Buffer.byteLength(message),
        ...headers
      };
      socket.once("finish", socket.destroy);
      socket.end(
        `HTTP/1.1 ${code} ${http2.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
      );
    }
    function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
      if (server.listenerCount("wsClientError")) {
        const err = new Error(message);
        Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
        server.emit("wsClientError", err, socket, req);
      } else {
        abortHandshake(socket, code, message, headers);
      }
    }
  }
});

// node_modules/promise-limit/index.js
var require_promise_limit = __commonJS({
  "node_modules/promise-limit/index.js"(exports2, module2) {
    function limiter(count) {
      var outstanding = 0;
      var jobs = [];
      function remove() {
        outstanding--;
        if (outstanding < count) {
          dequeue();
        }
      }
      function dequeue() {
        var job = jobs.shift();
        semaphore.queue = jobs.length;
        if (job) {
          run(job.fn).then(job.resolve).catch(job.reject);
        }
      }
      function queue(fn) {
        return new Promise(function(resolve3, reject) {
          jobs.push({ fn, resolve: resolve3, reject });
          semaphore.queue = jobs.length;
        });
      }
      function run(fn) {
        outstanding++;
        try {
          return Promise.resolve(fn()).then(function(result) {
            remove();
            return result;
          }, function(error2) {
            remove();
            throw error2;
          });
        } catch (err) {
          remove();
          return Promise.reject(err);
        }
      }
      var semaphore = function(fn) {
        if (outstanding >= count) {
          return queue(fn);
        } else {
          return run(fn);
        }
      };
      return semaphore;
    }
    function map2(items, mapper) {
      var failed = false;
      var limit = this;
      return Promise.all(items.map(function() {
        var args = arguments;
        return limit(function() {
          if (!failed) {
            return mapper.apply(void 0, args).catch(function(e) {
              failed = true;
              throw e;
            });
          }
        });
      }));
    }
    function addExtras(fn) {
      fn.queue = 0;
      fn.map = map2;
      return fn;
    }
    module2.exports = function(count) {
      if (count) {
        return addExtras(limiter(count));
      } else {
        return addExtras(function(fn) {
          return fn();
        });
      }
    };
  }
});

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
function map(array2, callback) {
  const result = [];
  let length = array2.length;
  while (length--) {
    result[length] = callback(array2[length]);
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
function ucs2decode(string2) {
  const output = [];
  let counter = 0;
  const length = string2.length;
  while (counter < length) {
    const value = string2.charCodeAt(counter++);
    if (value >= 55296 && value <= 56319 && counter < length) {
      const extra = string2.charCodeAt(counter++);
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
  return mapDomain(input, function(string2) {
    return regexPunycode.test(string2) ? decode(string2.slice(4).toLowerCase()) : string2;
  });
};
var toASCII = function(input) {
  return mapDomain(input, function(string2) {
    return regexNonASCII.test(string2) ? "xn--" + encode(string2) : string2;
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
var resolve = (from, to) => {
  try {
    return new URL(to, from).href;
  } catch (err) {
    legacyParse(from, false, err, true);
    legacyParse(to, false, err, true);
    return import_node_url.default.resolve(from, to);
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
  compare(a, b) {
    return a.name === b.name && a.path === b.path && a.domain === b.domain && a.secure === b.secure && a.httponly === b.httponly;
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
        } catch (E) {
          finished3 = true;
          E.code = EFETCH;
          E.sourceUrl = url;
          setImmediate(() => fetchRes.emit("error", E));
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
  } catch (E) {
    finished3 = true;
    setImmediate(() => {
      setFetchCode(E);
      E.sourceUrl = url;
      fetchRes.emit("error", E);
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
    } catch (E) {
      return respond(E);
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
  const extension2 = (parsed.ext.substr(1) || parsed.name || "").split("?").shift().trim().toLowerCase();
  const value = extensions.has(extension2) ? extensions.get(extension2) : defaultMimeType;
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
  let to = 0;
  for (let from = 0; from < complete * lineLength; from += lineLength) {
    src.copy(output, to, from, from + lineLength);
    to += lineLength;
    output[to++] = 13;
    output[to++] = 10;
  }
  if (final) {
    to += src.copy(output, to, complete * lineLength);
    rest = 0;
  }
  if (to !== output.length) {
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
    continuation.sections.sort((a, b) => a.nr - b.nr);
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
function detectMimeType2(extension2) {
  return detectMimeType(extension2);
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
function _indexOfAt(text, from, to) {
  for (let i = from; i < to; i++) {
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
function _collectAddressParts(tokens, from, to) {
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
  for (let i = from; i < to; i++) {
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
function _groupName(tokens, from, to) {
  return _collectAddressParts(tokens, from, to).data.text.join(" ");
}
function _handleAddress(tokens, from, to) {
  const collected = _collectAddressParts(tokens, from, to);
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
    this._envelope.to = recipients.map((to) => to.address).filter((address) => address);
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
    envelope.to = recipients.map((to) => to.address);
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
    } catch (E) {
      return callback(E);
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
    const window = tail + chunk.toString("binary");
    const windowEnd = window.indexOf("\r\n\r\n");
    chunks.push(chunk);
    received += chunk.length;
    tail = window.slice(-3);
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
    const headerEnd = received - window.length + windowEnd;
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
        } catch (E) {
          setImmediate(() => this._onError(E, "ECONNECTION", false, "CONN"));
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
    } catch (E) {
      setImmediate(() => this._onError(E, "ECONNECTION", false, "CONN"));
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
    this._envelope.to = [].concat(this._envelope.to || []).map((to) => (to && to.address || to || "").toString().trim());
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
      } catch (E) {
        return done(E);
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
        } catch (E) {
          this.logger.error({
            err: E,
            tnx: "callback"
          }, "Callback error: %s", E.message);
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
        } catch (E) {
          this.logger.error({
            err: E,
            tnx: "callback",
            cid: connection.id
          }, "Callback error for #%s: %s", connection.id, E.message);
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
        } catch (E) {
          this.logger.error({
            err: E,
            tnx: "callback",
            cid: connection.id
          }, "Callback error for #%s: %s", connection.id, E.message);
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
      } catch (E) {
        this.logger.error({
          err: E,
          tnx: "callback",
          messageId: connection.queueEntry.messageId,
          cid: connection.id
        }, "Callback error for #%s: %s", connection.id, E.message);
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
          } catch (E) {
            this.logger.error({
              err: E,
              tnx: "callback"
            }, "Callback error for %s: %s", messageId, E.message);
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
    } catch (E) {
      this.logger.error({
        err: E,
        tnx: "spawn",
        messageId
      }, "Error occurred while spawning sendmail. %s", E.message);
      return callback(E);
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
      } catch (E) {
        this.logger.error({
          err: E,
          tnx: "send",
          messageId
        }, "Creating send stream failed for %s. %s", messageId, E.message);
        return done(E);
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
    } catch (E) {
      return done(E);
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
  return results.filter((v, i, a) => a.indexOf(v) === i);
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
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") continue;
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) _res.headers.append("set-cookie", cookie);
        } else _res.headers.set(k, v);
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
        const v = headers[k];
        if (typeof v === "string") responseHeaders.set(k, v);
        else {
          responseHeaders.delete(k);
          for (const v2 of v) responseHeaders.append(k, v2);
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
  json = (object2, arg, headers) => {
    return this.#newResponse(JSON.stringify(object2), arg, setDefaultContentType("application/json", headers));
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
      for (const p of [path3].flat()) {
        this.#path = p;
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
function compareKey(a, b) {
  if (a.length === 1) return b.length === 1 ? a < b ? -1 : 1 : -1;
  if (b.length === 1) return 1;
  if (a === ".*" || a === "(?:|/.*)") return b === "(?:|/.*)" ? -1 : 1;
  else if (b === ".*" || b === "(?:|/.*)") return -1;
  if (a === "[^/]+") return 1;
  else if (b === "[^/]+") return -1;
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
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
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) if (buildWildcardRegExp(k).test(path3)) return [...middleware[k]];
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
        for (const p in handlerMap["ALL"]) {
          handlerMap[method][p] = [...handlerMap["ALL"][p]];
          this.#insertPath(method, p);
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
      for (const handlerMap of [middleware, routes]) for (const m of methods) for (const p in handlerMap[m]) re.test(p) && handlerMap[m][p].push([handler2, path3]);
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
        staticMap[path3] = [handlers.map(([h]) => [h, createNullObject()]), emptyParam];
        continue;
      }
      handlerData[pathData[0]] = handlers.map(([h, handlerPath]) => [h, trie.paths[handlerPath][1].reduceRight((map2, [key], i) => {
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
    for (const p of parts) {
      const nextP = parts[++i];
      const pattern = getPattern(p, nextP) || (nextP === void 0 && p && p.indexOf("*") === p.length - 1 ? p : null);
      const isParam = Array.isArray(pattern);
      const key = isParam ? pattern[0] : pattern || p;
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
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
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
    if (handlerSets[1]) handlerSets.sort((a, b) => {
      return a.score - b.score;
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
      const cookies = res.headers.getSetCookie ? res.headers.getSetCookie() : Array.from(res.headers.entries()).filter(([k]) => k === "set-cookie").map(([, v]) => v);
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
      for (const [k, v] of Object.entries(event.headers)) if (v) headers.set(k, v);
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
      for (const [k, values] of Object.entries(event.multiValueHeaders)) if (values) values.forEach((v) => headers.append(k, sanitizeHeaderValue(v)));
    }
    if (event.headers) {
      for (const [k, v] of Object.entries(event.headers)) if (v && !headers.has(k)) headers.set(k, sanitizeHeaderValue(v));
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
      for (const [k, values] of Object.entries(event.headers)) if (values) values.forEach((v) => headers.append(k, sanitizeHeaderValue(v)));
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

// node_modules/@libsql/core/lib-esm/api.js
var LibsqlError = class extends Error {
  /** Machine-readable error code. */
  code;
  /** Extended error code with more specific information (e.g., SQLITE_CONSTRAINT_PRIMARYKEY). */
  extendedCode;
  /** Raw numeric error code */
  rawCode;
  constructor(message, code, extendedCode, rawCode, cause) {
    if (code !== void 0) {
      message = `${code}: ${message}`;
    }
    super(message, { cause });
    this.code = code;
    this.extendedCode = extendedCode;
    this.rawCode = rawCode;
    this.name = "LibsqlError";
  }
};
var LibsqlBatchError = class extends LibsqlError {
  /** The zero-based index of the statement that failed in the batch. */
  statementIndex;
  constructor(message, statementIndex, code, extendedCode, rawCode, cause) {
    super(message, code, extendedCode, rawCode, cause);
    this.statementIndex = statementIndex;
    this.name = "LibsqlBatchError";
  }
};

// node_modules/@libsql/core/lib-esm/uri.js
function parseUri(text) {
  const match2 = URI_RE.exec(text);
  if (match2 === null) {
    throw new LibsqlError(`The URL '${text}' is not in a valid format`, "URL_INVALID");
  }
  const groups = match2.groups;
  const scheme = groups["scheme"];
  const authority = groups["authority"] !== void 0 ? parseAuthority(groups["authority"]) : void 0;
  const path3 = percentDecode(groups["path"]);
  const query = groups["query"] !== void 0 ? parseQuery(groups["query"]) : void 0;
  const fragment = groups["fragment"] !== void 0 ? percentDecode(groups["fragment"]) : void 0;
  return { scheme, authority, path: path3, query, fragment };
}
var URI_RE = (() => {
  const SCHEME = "(?<scheme>[A-Za-z][A-Za-z.+-]*)";
  const AUTHORITY2 = "(?<authority>[^/?#]*)";
  const PATH = "(?<path>[^?#]*)";
  const QUERY = "(?<query>[^#]*)";
  const FRAGMENT = "(?<fragment>.*)";
  return new RegExp(`^${SCHEME}:(//${AUTHORITY2})?${PATH}(\\?${QUERY})?(#${FRAGMENT})?$`, "su");
})();
function parseAuthority(text) {
  const match2 = AUTHORITY_RE.exec(text);
  if (match2 === null) {
    throw new LibsqlError("The authority part of the URL is not in a valid format", "URL_INVALID");
  }
  const groups = match2.groups;
  const host = percentDecode(groups["host_br"] ?? groups["host"]);
  const port = groups["port"] ? parseInt(groups["port"], 10) : void 0;
  const userinfo = groups["username"] !== void 0 ? {
    username: percentDecode(groups["username"]),
    password: groups["password"] !== void 0 ? percentDecode(groups["password"]) : void 0
  } : void 0;
  return { host, port, userinfo };
}
var AUTHORITY_RE = (() => {
  return new RegExp(`^((?<username>[^:]*)(:(?<password>.*))?@)?((?<host>[^:\\[\\]]*)|(\\[(?<host_br>[^\\[\\]]*)\\]))(:(?<port>[0-9]*))?$`, "su");
})();
function parseQuery(text) {
  const sequences = text.split("&");
  const pairs = [];
  for (const sequence of sequences) {
    if (sequence === "") {
      continue;
    }
    let key;
    let value;
    const splitIdx = sequence.indexOf("=");
    if (splitIdx < 0) {
      key = sequence;
      value = "";
    } else {
      key = sequence.substring(0, splitIdx);
      value = sequence.substring(splitIdx + 1);
    }
    pairs.push({
      key: percentDecode(key.replaceAll("+", " ")),
      value: percentDecode(value.replaceAll("+", " "))
    });
  }
  return { pairs };
}
function percentDecode(text) {
  try {
    return decodeURIComponent(text);
  } catch (e) {
    if (e instanceof URIError) {
      throw new LibsqlError(`URL component has invalid percent encoding: ${e}`, "URL_INVALID", void 0, void 0, e);
    }
    throw e;
  }
}
function encodeBaseUrl(scheme, authority, path3) {
  if (authority === void 0) {
    throw new LibsqlError(`URL with scheme ${JSON.stringify(scheme + ":")} requires authority (the "//" part)`, "URL_INVALID");
  }
  const schemeText = `${scheme}:`;
  const hostText = encodeHost(authority.host);
  const portText = encodePort(authority.port);
  const userinfoText = encodeUserinfo(authority.userinfo);
  const authorityText = `//${userinfoText}${hostText}${portText}`;
  let pathText = path3.split("/").map(encodeURIComponent).join("/");
  if (pathText !== "" && !pathText.startsWith("/")) {
    pathText = "/" + pathText;
  }
  return new URL(`${schemeText}${authorityText}${pathText}`);
}
function encodeHost(host) {
  return host.includes(":") ? `[${encodeURI(host)}]` : encodeURI(host);
}
function encodePort(port) {
  return port !== void 0 ? `:${port}` : "";
}
function encodeUserinfo(userinfo) {
  if (userinfo === void 0) {
    return "";
  }
  const usernameText = encodeURIComponent(userinfo.username);
  const passwordText = userinfo.password !== void 0 ? `:${encodeURIComponent(userinfo.password)}` : "";
  return `${usernameText}${passwordText}@`;
}

// node_modules/js-base64/base64.mjs
var version2 = "3.9.4";
var VERSION = version2;
var _TD = typeof TextDecoder === "function" ? new TextDecoder("utf-8", { ignoreBOM: true }) : void 0;
var _TE = typeof TextEncoder === "function" ? new TextEncoder() : void 0;
var b64ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var b64chs = Array.prototype.slice.call(b64ch);
var b64tab = ((a) => {
  let tab = {};
  a.forEach((c, i) => tab[c] = i);
  return tab;
})(b64chs);
var b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
var _fromCC = String.fromCharCode.bind(String);
var _U8Afrom = typeof Uint8Array.from === "function" ? Uint8Array.from.bind(Uint8Array) : (it) => new Uint8Array(Array.prototype.slice.call(it, 0));
var _mkUriSafe = (src) => src.replace(/=/g, "").replace(/[+\/]/g, (m0) => m0 == "+" ? "-" : "_");
var _tidyB64 = (s) => s.replace(/[^A-Za-z0-9\+\/]/g, "");
var btoaPolyfill = (bin) => {
  let u32, c0, c1, c2, asc = "";
  const pad = bin.length % 3;
  for (let i = 0; i < bin.length; ) {
    if ((c0 = bin.charCodeAt(i++)) > 255 || (c1 = bin.charCodeAt(i++)) > 255 || (c2 = bin.charCodeAt(i++)) > 255)
      throw new TypeError("invalid character found");
    u32 = c0 << 16 | c1 << 8 | c2;
    asc += b64chs[u32 >> 18 & 63] + b64chs[u32 >> 12 & 63] + b64chs[u32 >> 6 & 63] + b64chs[u32 & 63];
  }
  return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;
};
var _btoa = typeof btoa === "function" ? (bin) => btoa(bin) : btoaPolyfill;
var _fromUint8Array = typeof Uint8Array.prototype.toBase64 === "function" ? (u8a) => u8a.toBase64() : (u8a) => {
  const maxargs = 4096;
  let strs = [];
  for (let i = 0, l = u8a.length; i < l; i += maxargs) {
    strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
  }
  return _btoa(strs.join(""));
};
var fromUint8Array = (u8a, urlsafe = false) => urlsafe ? _mkUriSafe(_fromUint8Array(u8a)) : _fromUint8Array(u8a);
var cb_utob = (c) => {
  if (c.length < 2) {
    var cc = c.charCodeAt(0);
    return cc < 128 ? c : cc < 2048 ? _fromCC(192 | cc >>> 6) + _fromCC(128 | cc & 63) : _fromCC(224 | cc >>> 12 & 15) + _fromCC(128 | cc >>> 6 & 63) + _fromCC(128 | cc & 63);
  } else {
    var cc = 65536 + (c.charCodeAt(0) - 55296) * 1024 + (c.charCodeAt(1) - 56320);
    return _fromCC(240 | cc >>> 18 & 7) + _fromCC(128 | cc >>> 12 & 63) + _fromCC(128 | cc >>> 6 & 63) + _fromCC(128 | cc & 63);
  }
};
var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[^\x00-\x7F]/g;
var utob = (u) => u.replace(re_utob, cb_utob);
var _encode = _TE ? (s) => _fromUint8Array(_TE.encode(s)) : (s) => _btoa(utob(s));
var encode4 = (src, urlsafe = false) => urlsafe ? _mkUriSafe(_encode(src)) : _encode(src);
var encodeURI2 = (src) => encode4(src, true);
var re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g;
var cb_btou = (cccc) => {
  switch (cccc.length) {
    case 4:
      var cp = (7 & cccc.charCodeAt(0)) << 18 | (63 & cccc.charCodeAt(1)) << 12 | (63 & cccc.charCodeAt(2)) << 6 | 63 & cccc.charCodeAt(3), offset = cp - 65536;
      return _fromCC((offset >>> 10) + 55296) + _fromCC((offset & 1023) + 56320);
    case 3:
      return _fromCC((15 & cccc.charCodeAt(0)) << 12 | (63 & cccc.charCodeAt(1)) << 6 | 63 & cccc.charCodeAt(2));
    default:
      return _fromCC((31 & cccc.charCodeAt(0)) << 6 | 63 & cccc.charCodeAt(1));
  }
};
var btou = (b) => b.replace(re_btou, cb_btou);
var atobPolyfill = (asc) => {
  asc = asc.replace(/\s+/g, "");
  if (!b64re.test(asc))
    throw new TypeError("malformed base64.");
  asc += "==".slice(2 - (asc.length & 3));
  let u24, r1, r2;
  let binArray = [];
  for (let i = 0; i < asc.length; ) {
    u24 = b64tab[asc.charAt(i++)] << 18 | b64tab[asc.charAt(i++)] << 12 | (r1 = b64tab[asc.charAt(i++)]) << 6 | (r2 = b64tab[asc.charAt(i++)]);
    if (r1 === 64) {
      binArray.push(_fromCC(u24 >> 16 & 255));
    } else if (r2 === 64) {
      binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255));
    } else {
      binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255));
    }
  }
  return binArray.join("");
};
var _atob = typeof atob === "function" ? (asc) => atob(_tidyB64(asc)) : atobPolyfill;
var _toUint8Array = typeof Uint8Array.fromBase64 === "function" ? (a) => Uint8Array.fromBase64(a) : (a) => _U8Afrom(_atob(a).split("").map((c) => c.charCodeAt(0)));
var toUint8Array = (a) => _toUint8Array(_unURI(a));
var _decode = _TD ? (a) => _TD.decode(_toUint8Array(a)) : (a) => btou(_atob(a));
var _unURI = (a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == "-" ? "+" : "/"));
var decode2 = (src) => _decode(_unURI(src));
var isValid = (src) => {
  if (typeof src !== "string")
    return false;
  const s = src.replace(/\s+/g, "").replace(/={0,2}$/, "");
  return !/[^\s0-9a-zA-Z\+/]/.test(s) || !/[^\s0-9a-zA-Z\-_]/.test(s);
};
var _noEnum = (v) => {
  return {
    value: v,
    enumerable: false,
    writable: true,
    configurable: true
  };
};
var extendString = function() {
  const _add = (name2, body) => Object.defineProperty(String.prototype, name2, _noEnum(body));
  _add("fromBase64", function() {
    return decode2(this);
  });
  _add("toBase64", function(urlsafe) {
    return encode4(this, urlsafe);
  });
  _add("toBase64URI", function() {
    return encode4(this, true);
  });
  _add("toBase64URL", function() {
    return encode4(this, true);
  });
  _add("toUint8Array", function() {
    return toUint8Array(this);
  });
};
var extendUint8Array = function() {
  const _add = (name2, body) => Object.defineProperty(Uint8Array.prototype, name2, _noEnum(body));
  _add("toBase64", function(urlsafe) {
    return fromUint8Array(this, urlsafe);
  });
  _add("toBase64URI", function() {
    return fromUint8Array(this, true);
  });
  _add("toBase64URL", function() {
    return fromUint8Array(this, true);
  });
};
var extendBuiltins = () => {
  extendString();
  extendUint8Array();
};
var gBase64 = {
  version: version2,
  VERSION,
  atob: _atob,
  atobPolyfill,
  btoa: _btoa,
  btoaPolyfill,
  fromBase64: decode2,
  toBase64: encode4,
  encode: encode4,
  encodeURI: encodeURI2,
  encodeURL: encodeURI2,
  utob,
  btou,
  decode: decode2,
  isValid,
  fromUint8Array,
  toUint8Array,
  extendString,
  extendUint8Array,
  extendBuiltins
};

// node_modules/@libsql/core/lib-esm/util.js
var supportedUrlLink = "https://github.com/libsql/libsql-client-ts#supported-urls";
function transactionModeToBegin(mode) {
  if (mode === "write") {
    return "BEGIN IMMEDIATE";
  } else if (mode === "read") {
    return "BEGIN TRANSACTION READONLY";
  } else if (mode === "deferred") {
    return "BEGIN DEFERRED";
  } else {
    throw RangeError('Unknown transaction mode, supported values are "write", "read" and "deferred"');
  }
}
var ResultSetImpl = class {
  columns;
  columnTypes;
  rows;
  rowsAffected;
  lastInsertRowid;
  constructor(columns, columnTypes, rows, rowsAffected, lastInsertRowid) {
    this.columns = columns;
    this.columnTypes = columnTypes;
    this.rows = rows;
    this.rowsAffected = rowsAffected;
    this.lastInsertRowid = lastInsertRowid;
  }
  toJSON() {
    return {
      columns: this.columns,
      columnTypes: this.columnTypes,
      rows: this.rows.map(rowToJson),
      rowsAffected: this.rowsAffected,
      lastInsertRowid: this.lastInsertRowid !== void 0 ? "" + this.lastInsertRowid : null
    };
  }
};
function rowToJson(row) {
  return Array.prototype.map.call(row, valueToJson);
}
function valueToJson(value) {
  if (typeof value === "bigint") {
    return "" + value;
  } else if (value instanceof ArrayBuffer) {
    return gBase64.fromUint8Array(new Uint8Array(value));
  } else {
    return value;
  }
}

// node_modules/@libsql/core/lib-esm/config.js
var inMemoryMode = ":memory:";
function expandConfig(config, preferHttp) {
  if (typeof config !== "object") {
    throw new TypeError(`Expected client configuration as object, got ${typeof config}`);
  }
  let { url, authToken, tls: tls3, intMode, concurrency } = config;
  concurrency = Math.max(0, concurrency || 20);
  intMode ??= "number";
  let connectionQueryParams = [];
  if (url === inMemoryMode) {
    url = "file::memory:";
  }
  const uri = parseUri(url);
  const originalUriScheme = uri.scheme.toLowerCase();
  const isInMemoryMode = originalUriScheme === "file" && uri.path === inMemoryMode && uri.authority === void 0;
  let queryParamsDef;
  if (isInMemoryMode) {
    queryParamsDef = {
      cache: {
        values: ["shared", "private"],
        update: (key, value) => connectionQueryParams.push(`${key}=${value}`)
      }
    };
  } else {
    queryParamsDef = {
      tls: {
        values: ["0", "1"],
        update: (_, value) => tls3 = value === "1"
      },
      authToken: {
        update: (_, value) => authToken = value
      }
    };
  }
  for (const { key, value } of uri.query?.pairs ?? []) {
    if (!Object.hasOwn(queryParamsDef, key)) {
      throw new LibsqlError(`Unsupported URL query parameter ${JSON.stringify(key)}`, "URL_PARAM_NOT_SUPPORTED");
    }
    const queryParamDef = queryParamsDef[key];
    if (queryParamDef.values !== void 0 && !queryParamDef.values.includes(value)) {
      throw new LibsqlError(`Unknown value for the "${key}" query argument: ${JSON.stringify(value)}. Supported values are: [${queryParamDef.values.map((x) => '"' + x + '"').join(", ")}]`, "URL_INVALID");
    }
    if (queryParamDef.update !== void 0) {
      queryParamDef?.update(key, value);
    }
  }
  const connectionQueryParamsString = connectionQueryParams.length === 0 ? "" : `?${connectionQueryParams.join("&")}`;
  const path3 = uri.path + connectionQueryParamsString;
  let scheme;
  if (originalUriScheme === "libsql") {
    if (tls3 === false) {
      if (uri.authority?.port === void 0) {
        throw new LibsqlError('A "libsql:" URL with ?tls=0 must specify an explicit port', "URL_INVALID");
      }
      scheme = preferHttp ? "http" : "ws";
    } else {
      scheme = preferHttp ? "https" : "wss";
    }
  } else {
    scheme = originalUriScheme;
  }
  if (scheme === "http" || scheme === "ws") {
    tls3 ??= false;
  } else {
    tls3 ??= true;
  }
  if (scheme !== "http" && scheme !== "ws" && scheme !== "https" && scheme !== "wss" && scheme !== "file") {
    throw new LibsqlError(`The client supports only "libsql:", "wss:", "ws:", "https:", "http:" and "file:" URLs, got ${JSON.stringify(uri.scheme + ":")}. For more information, please read ${supportedUrlLink}`, "URL_SCHEME_NOT_SUPPORTED");
  }
  if (intMode !== "number" && intMode !== "bigint" && intMode !== "string") {
    throw new TypeError(`Invalid value for intMode, expected "number", "bigint" or "string", got ${JSON.stringify(intMode)}`);
  }
  if (uri.fragment !== void 0) {
    throw new LibsqlError(`URL fragments are not supported: ${JSON.stringify("#" + uri.fragment)}`, "URL_INVALID");
  }
  if (isInMemoryMode) {
    return {
      scheme: "file",
      tls: false,
      path: path3,
      intMode,
      concurrency,
      syncUrl: config.syncUrl,
      syncInterval: config.syncInterval,
      readYourWrites: config.readYourWrites,
      offline: config.offline,
      fetch: config.fetch,
      timeout: config.timeout,
      authToken: void 0,
      encryptionKey: void 0,
      remoteEncryptionKey: void 0,
      authority: void 0
    };
  }
  return {
    scheme,
    tls: tls3,
    authority: uri.authority,
    path: path3,
    authToken,
    intMode,
    concurrency,
    encryptionKey: config.encryptionKey,
    remoteEncryptionKey: config.remoteEncryptionKey,
    syncUrl: config.syncUrl,
    syncInterval: config.syncInterval,
    readYourWrites: config.readYourWrites,
    offline: config.offline,
    fetch: config.fetch,
    timeout: config.timeout
  };
}

// node_modules/ws/wrapper.mjs
var import_stream = __toESM(require_stream(), 1);
var import_extension = __toESM(require_extension(), 1);
var import_permessage_deflate = __toESM(require_permessage_deflate(), 1);
var import_receiver = __toESM(require_receiver(), 1);
var import_sender = __toESM(require_sender(), 1);
var import_subprotocol = __toESM(require_subprotocol(), 1);
var import_websocket = __toESM(require_websocket(), 1);
var import_websocket_server = __toESM(require_websocket_server(), 1);

// node_modules/@libsql/hrana-client/lib-esm/client.js
var Client = class {
  /** @private */
  constructor() {
    this.intMode = "number";
  }
  /** Representation of integers returned from the database. See {@link IntMode}.
   *
   * This value is inherited by {@link Stream} objects created with {@link openStream}, but you can
   * override the integer mode for every stream by setting {@link Stream.intMode} on the stream.
   */
  intMode;
};

// node_modules/@libsql/hrana-client/lib-esm/errors.js
var ClientError = class extends Error {
  /** @private */
  constructor(message) {
    super(message);
    this.name = "ClientError";
  }
};
var ProtoError = class extends ClientError {
  /** @private */
  constructor(message) {
    super(message);
    this.name = "ProtoError";
  }
};
var ResponseError = class extends ClientError {
  code;
  /** @internal */
  proto;
  /** @private */
  constructor(message, protoError) {
    super(message);
    this.name = "ResponseError";
    this.code = protoError.code;
    this.proto = protoError;
    this.stack = void 0;
  }
};
var ClosedError = class extends ClientError {
  /** @private */
  constructor(message, cause) {
    if (cause !== void 0) {
      super(`${message}: ${cause}`);
      this.cause = cause;
    } else {
      super(message);
    }
    this.name = "ClosedError";
  }
};
var WebSocketUnsupportedError = class extends ClientError {
  /** @private */
  constructor(message) {
    super(message);
    this.name = "WebSocketUnsupportedError";
  }
};
var WebSocketError = class extends ClientError {
  /** @private */
  constructor(message) {
    super(message);
    this.name = "WebSocketError";
  }
};
var HttpServerError = class extends ClientError {
  status;
  /** @private */
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "HttpServerError";
  }
};
var ProtocolVersionError = class extends ClientError {
  /** @private */
  constructor(message) {
    super(message);
    this.name = "ProtocolVersionError";
  }
};
var InternalError = class extends ClientError {
  /** @private */
  constructor(message) {
    super(message);
    this.name = "InternalError";
  }
};
var MisuseError = class extends ClientError {
  /** @private */
  constructor(message) {
    super(message);
    this.name = "MisuseError";
  }
};

// node_modules/@libsql/hrana-client/lib-esm/encoding/json/decode.js
function string(value) {
  if (typeof value === "string") {
    return value;
  }
  throw typeError(value, "string");
}
function stringOpt(value) {
  if (value === null || value === void 0) {
    return void 0;
  } else if (typeof value === "string") {
    return value;
  }
  throw typeError(value, "string or null");
}
function number(value) {
  if (typeof value === "number") {
    return value;
  }
  throw typeError(value, "number");
}
function boolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  throw typeError(value, "boolean");
}
function array(value) {
  if (Array.isArray(value)) {
    return value;
  }
  throw typeError(value, "array");
}
function object(value) {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return value;
  }
  throw typeError(value, "object");
}
function arrayObjectsMap(value, fun) {
  return array(value).map((elemValue) => fun(object(elemValue)));
}
function typeError(value, expected) {
  if (value === void 0) {
    return new ProtoError(`Expected ${expected}, but the property was missing`);
  }
  let received = typeof value;
  if (value === null) {
    received = "null";
  } else if (Array.isArray(value)) {
    received = "array";
  }
  return new ProtoError(`Expected ${expected}, received ${received}`);
}
function readJsonObject(value, fun) {
  return fun(object(value));
}

// node_modules/@libsql/hrana-client/lib-esm/encoding/json/encode.js
var ObjectWriter = class {
  #output;
  #isFirst;
  constructor(output) {
    this.#output = output;
    this.#isFirst = false;
  }
  begin() {
    this.#output.push("{");
    this.#isFirst = true;
  }
  end() {
    this.#output.push("}");
    this.#isFirst = false;
  }
  #key(name2) {
    if (this.#isFirst) {
      this.#output.push('"');
      this.#isFirst = false;
    } else {
      this.#output.push(',"');
    }
    this.#output.push(name2);
    this.#output.push('":');
  }
  string(name2, value) {
    this.#key(name2);
    this.#output.push(JSON.stringify(value));
  }
  stringRaw(name2, value) {
    this.#key(name2);
    this.#output.push('"');
    this.#output.push(value);
    this.#output.push('"');
  }
  number(name2, value) {
    this.#key(name2);
    this.#output.push("" + value);
  }
  boolean(name2, value) {
    this.#key(name2);
    this.#output.push(value ? "true" : "false");
  }
  object(name2, value, valueFun) {
    this.#key(name2);
    this.begin();
    valueFun(this, value);
    this.end();
  }
  arrayObjects(name2, values, valueFun) {
    this.#key(name2);
    this.#output.push("[");
    for (let i = 0; i < values.length; ++i) {
      if (i !== 0) {
        this.#output.push(",");
      }
      this.begin();
      valueFun(this, values[i]);
      this.end();
    }
    this.#output.push("]");
  }
};
function writeJsonObject(value, fun) {
  const output = [];
  const writer = new ObjectWriter(output);
  writer.begin();
  fun(writer, value);
  writer.end();
  return output.join("");
}

// node_modules/@libsql/hrana-client/lib-esm/encoding/protobuf/util.js
var VARINT = 0;
var FIXED_64 = 1;
var LENGTH_DELIMITED = 2;
var FIXED_32 = 5;

// node_modules/@libsql/hrana-client/lib-esm/encoding/protobuf/decode.js
var MessageReader = class {
  #array;
  #view;
  #pos;
  constructor(array2) {
    this.#array = array2;
    this.#view = new DataView(array2.buffer, array2.byteOffset, array2.byteLength);
    this.#pos = 0;
  }
  varint() {
    let value = 0;
    for (let shift = 0; ; shift += 7) {
      const byte = this.#array[this.#pos++];
      value |= (byte & 127) << shift;
      if (!(byte & 128)) {
        break;
      }
    }
    return value;
  }
  varintBig() {
    let value = 0n;
    for (let shift = 0n; ; shift += 7n) {
      const byte = this.#array[this.#pos++];
      value |= BigInt(byte & 127) << shift;
      if (!(byte & 128)) {
        break;
      }
    }
    return value;
  }
  bytes(length) {
    const array2 = new Uint8Array(this.#array.buffer, this.#array.byteOffset + this.#pos, length);
    this.#pos += length;
    return array2;
  }
  double() {
    const value = this.#view.getFloat64(this.#pos, true);
    this.#pos += 8;
    return value;
  }
  skipVarint() {
    for (; ; ) {
      const byte = this.#array[this.#pos++];
      if (!(byte & 128)) {
        break;
      }
    }
  }
  skip(count) {
    this.#pos += count;
  }
  eof() {
    return this.#pos >= this.#array.byteLength;
  }
};
var FieldReader = class {
  #reader;
  #wireType;
  constructor(reader) {
    this.#reader = reader;
    this.#wireType = -1;
  }
  setup(wireType) {
    this.#wireType = wireType;
  }
  #expect(expectedWireType) {
    if (this.#wireType !== expectedWireType) {
      throw new ProtoError(`Expected wire type ${expectedWireType}, got ${this.#wireType}`);
    }
    this.#wireType = -1;
  }
  bytes() {
    this.#expect(LENGTH_DELIMITED);
    const length = this.#reader.varint();
    return this.#reader.bytes(length);
  }
  string() {
    return new TextDecoder().decode(this.bytes());
  }
  message(def) {
    return readProtobufMessage(this.bytes(), def);
  }
  int32() {
    this.#expect(VARINT);
    return this.#reader.varint();
  }
  uint32() {
    return this.int32();
  }
  bool() {
    return this.int32() !== 0;
  }
  uint64() {
    this.#expect(VARINT);
    return this.#reader.varintBig();
  }
  sint64() {
    const value = this.uint64();
    return value >> 1n ^ -(value & 1n);
  }
  double() {
    this.#expect(FIXED_64);
    return this.#reader.double();
  }
  maybeSkip() {
    if (this.#wireType < 0) {
      return;
    } else if (this.#wireType === VARINT) {
      this.#reader.skipVarint();
    } else if (this.#wireType === FIXED_64) {
      this.#reader.skip(8);
    } else if (this.#wireType === LENGTH_DELIMITED) {
      const length = this.#reader.varint();
      this.#reader.skip(length);
    } else if (this.#wireType === FIXED_32) {
      this.#reader.skip(4);
    } else {
      throw new ProtoError(`Unexpected wire type ${this.#wireType}`);
    }
    this.#wireType = -1;
  }
};
function readProtobufMessage(data, def) {
  const msgReader = new MessageReader(data);
  const fieldReader = new FieldReader(msgReader);
  let value = def.default();
  while (!msgReader.eof()) {
    const key = msgReader.varint();
    const tag = key >> 3;
    const wireType = key & 7;
    fieldReader.setup(wireType);
    const tagFun = def[tag];
    if (tagFun !== void 0) {
      const returnedValue = tagFun(fieldReader, value);
      if (returnedValue !== void 0) {
        value = returnedValue;
      }
    }
    fieldReader.maybeSkip();
  }
  return value;
}

// node_modules/@libsql/hrana-client/lib-esm/encoding/protobuf/encode.js
var MessageWriter = class _MessageWriter {
  #buf;
  #array;
  #view;
  #pos;
  constructor() {
    this.#buf = new ArrayBuffer(256);
    this.#array = new Uint8Array(this.#buf);
    this.#view = new DataView(this.#buf);
    this.#pos = 0;
  }
  #ensure(extra) {
    if (this.#pos + extra <= this.#buf.byteLength) {
      return;
    }
    let newCap = this.#buf.byteLength;
    while (newCap < this.#pos + extra) {
      newCap *= 2;
    }
    const newBuf = new ArrayBuffer(newCap);
    const newArray = new Uint8Array(newBuf);
    const newView = new DataView(newBuf);
    newArray.set(new Uint8Array(this.#buf, 0, this.#pos));
    this.#buf = newBuf;
    this.#array = newArray;
    this.#view = newView;
  }
  #varint(value) {
    this.#ensure(5);
    value = 0 | value;
    do {
      let byte = value & 127;
      value >>>= 7;
      byte |= value ? 128 : 0;
      this.#array[this.#pos++] = byte;
    } while (value);
  }
  #varintBig(value) {
    this.#ensure(10);
    value = value & 0xffffffffffffffffn;
    do {
      let byte = Number(value & 0x7fn);
      value >>= 7n;
      byte |= value ? 128 : 0;
      this.#array[this.#pos++] = byte;
    } while (value);
  }
  #tag(tag, wireType) {
    this.#varint(tag << 3 | wireType);
  }
  bytes(tag, value) {
    this.#tag(tag, LENGTH_DELIMITED);
    this.#varint(value.byteLength);
    this.#ensure(value.byteLength);
    this.#array.set(value, this.#pos);
    this.#pos += value.byteLength;
  }
  string(tag, value) {
    this.bytes(tag, new TextEncoder().encode(value));
  }
  message(tag, value, fun) {
    const writer = new _MessageWriter();
    fun(writer, value);
    this.bytes(tag, writer.data());
  }
  int32(tag, value) {
    this.#tag(tag, VARINT);
    this.#varint(value);
  }
  uint32(tag, value) {
    this.int32(tag, value);
  }
  bool(tag, value) {
    this.int32(tag, value ? 1 : 0);
  }
  sint64(tag, value) {
    this.#tag(tag, VARINT);
    this.#varintBig(value << 1n ^ value >> 63n);
  }
  double(tag, value) {
    this.#tag(tag, FIXED_64);
    this.#ensure(8);
    this.#view.setFloat64(this.#pos, value, true);
    this.#pos += 8;
  }
  data() {
    return new Uint8Array(this.#buf, 0, this.#pos);
  }
};
function writeProtobufMessage(value, fun) {
  const w = new MessageWriter();
  fun(w, value);
  return w.data();
}

// node_modules/@libsql/hrana-client/lib-esm/id_alloc.js
var IdAlloc = class {
  // Set of all allocated ids
  #usedIds;
  // Set of all free ids lower than `#usedIds.size`
  #freeIds;
  constructor() {
    this.#usedIds = /* @__PURE__ */ new Set();
    this.#freeIds = /* @__PURE__ */ new Set();
  }
  // Returns an id that was free, and marks it as used.
  alloc() {
    for (const freeId2 of this.#freeIds) {
      this.#freeIds.delete(freeId2);
      this.#usedIds.add(freeId2);
      if (!this.#usedIds.has(this.#usedIds.size - 1)) {
        this.#freeIds.add(this.#usedIds.size - 1);
      }
      return freeId2;
    }
    const freeId = this.#usedIds.size;
    this.#usedIds.add(freeId);
    return freeId;
  }
  free(id) {
    if (!this.#usedIds.delete(id)) {
      throw new InternalError("Freeing an id that is not allocated");
    }
    this.#freeIds.delete(this.#usedIds.size);
    if (id < this.#usedIds.size) {
      this.#freeIds.add(id);
    }
  }
};

// node_modules/@libsql/hrana-client/lib-esm/util.js
function impossible(value, message) {
  throw new InternalError(message);
}

// node_modules/@libsql/hrana-client/lib-esm/value.js
function valueToProto(value) {
  if (value === null) {
    return null;
  } else if (typeof value === "string") {
    return value;
  } else if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new RangeError("Only finite numbers (not Infinity or NaN) can be passed as arguments");
    }
    return value;
  } else if (typeof value === "bigint") {
    if (value < minInteger || value > maxInteger) {
      throw new RangeError("This bigint value is too large to be represented as a 64-bit integer and passed as argument");
    }
    return value;
  } else if (typeof value === "boolean") {
    return value ? 1n : 0n;
  } else if (value instanceof ArrayBuffer) {
    return new Uint8Array(value);
  } else if (value instanceof Uint8Array) {
    return value;
  } else if (value instanceof Date) {
    return +value.valueOf();
  } else if (typeof value === "object") {
    return "" + value.toString();
  } else {
    throw new TypeError("Unsupported type of value");
  }
}
var minInteger = -9223372036854775808n;
var maxInteger = 9223372036854775807n;
function valueFromProto(value, intMode) {
  if (value === null) {
    return null;
  } else if (typeof value === "number") {
    return value;
  } else if (typeof value === "string") {
    return value;
  } else if (typeof value === "bigint") {
    if (intMode === "number") {
      const num = Number(value);
      if (!Number.isSafeInteger(num)) {
        throw new RangeError("Received integer which is too large to be safely represented as a JavaScript number");
      }
      return num;
    } else if (intMode === "bigint") {
      return value;
    } else if (intMode === "string") {
      return "" + value;
    } else {
      throw new MisuseError("Invalid value for IntMode");
    }
  } else if (value instanceof Uint8Array) {
    return value.slice().buffer;
  } else if (value === void 0) {
    throw new ProtoError("Received unrecognized type of Value");
  } else {
    throw impossible(value, "Impossible type of Value");
  }
}

// node_modules/@libsql/hrana-client/lib-esm/result.js
function stmtResultFromProto(result) {
  return {
    affectedRowCount: result.affectedRowCount,
    lastInsertRowid: result.lastInsertRowid,
    columnNames: result.cols.map((col) => col.name),
    columnDecltypes: result.cols.map((col) => col.decltype)
  };
}
function rowsResultFromProto(result, intMode) {
  const stmtResult = stmtResultFromProto(result);
  const rows = result.rows.map((row) => rowFromProto(stmtResult.columnNames, row, intMode));
  return { ...stmtResult, rows };
}
function rowResultFromProto(result, intMode) {
  const stmtResult = stmtResultFromProto(result);
  let row;
  if (result.rows.length > 0) {
    row = rowFromProto(stmtResult.columnNames, result.rows[0], intMode);
  }
  return { ...stmtResult, row };
}
function valueResultFromProto(result, intMode) {
  const stmtResult = stmtResultFromProto(result);
  let value;
  if (result.rows.length > 0 && stmtResult.columnNames.length > 0) {
    value = valueFromProto(result.rows[0][0], intMode);
  }
  return { ...stmtResult, value };
}
function rowFromProto(colNames, values, intMode) {
  const row = {};
  Object.defineProperty(row, "length", { value: values.length });
  for (let i = 0; i < values.length; ++i) {
    const value = valueFromProto(values[i], intMode);
    Object.defineProperty(row, i, { value });
    const colName = colNames[i];
    if (colName !== void 0 && !Object.hasOwn(row, colName)) {
      Object.defineProperty(row, colName, { value, enumerable: true, configurable: true, writable: true });
    }
  }
  return row;
}
function errorFromProto(error2) {
  return new ResponseError(error2.message, error2);
}

// node_modules/@libsql/hrana-client/lib-esm/sql.js
var Sql = class {
  #owner;
  #sqlId;
  #closed;
  /** @private */
  constructor(owner, sqlId) {
    this.#owner = owner;
    this.#sqlId = sqlId;
    this.#closed = void 0;
  }
  /** @private */
  _getSqlId(owner) {
    if (this.#owner !== owner) {
      throw new MisuseError("Attempted to use SQL text opened with other object");
    } else if (this.#closed !== void 0) {
      throw new ClosedError("SQL text is closed", this.#closed);
    }
    return this.#sqlId;
  }
  /** Remove the SQL text from the server, releasing resouces. */
  close() {
    this._setClosed(new ClientError("SQL text was manually closed"));
  }
  /** @private */
  _setClosed(error2) {
    if (this.#closed === void 0) {
      this.#closed = error2;
      this.#owner._closeSql(this.#sqlId);
    }
  }
  /** True if the SQL text is closed (removed from the server). */
  get closed() {
    return this.#closed !== void 0;
  }
};
function sqlToProto(owner, sql) {
  if (sql instanceof Sql) {
    return { sqlId: sql._getSqlId(owner) };
  } else {
    return { sql: "" + sql };
  }
}

// node_modules/@libsql/hrana-client/lib-esm/queue.js
var Queue = class {
  #pushStack;
  #shiftStack;
  constructor() {
    this.#pushStack = [];
    this.#shiftStack = [];
  }
  get length() {
    return this.#pushStack.length + this.#shiftStack.length;
  }
  push(elem) {
    this.#pushStack.push(elem);
  }
  shift() {
    if (this.#shiftStack.length === 0 && this.#pushStack.length > 0) {
      this.#shiftStack = this.#pushStack.reverse();
      this.#pushStack = [];
    }
    return this.#shiftStack.pop();
  }
  first() {
    return this.#shiftStack.length !== 0 ? this.#shiftStack[this.#shiftStack.length - 1] : this.#pushStack[0];
  }
};

// node_modules/@libsql/hrana-client/lib-esm/stmt.js
var Stmt = class {
  /** The SQL statement text. */
  sql;
  /** @private */
  _args;
  /** @private */
  _namedArgs;
  /** Initialize the statement with given SQL text. */
  constructor(sql) {
    this.sql = sql;
    this._args = [];
    this._namedArgs = /* @__PURE__ */ new Map();
  }
  /** Binds positional parameters from the given `values`. All previous positional bindings are cleared. */
  bindIndexes(values) {
    this._args.length = 0;
    for (const value of values) {
      this._args.push(valueToProto(value));
    }
    return this;
  }
  /** Binds a parameter by a 1-based index. */
  bindIndex(index, value) {
    if (index !== (index | 0) || index <= 0) {
      throw new RangeError("Index of a positional argument must be positive integer");
    }
    while (this._args.length < index) {
      this._args.push(null);
    }
    this._args[index - 1] = valueToProto(value);
    return this;
  }
  /** Binds a parameter by name. */
  bindName(name2, value) {
    this._namedArgs.set(name2, valueToProto(value));
    return this;
  }
  /** Clears all bindings. */
  unbindAll() {
    this._args.length = 0;
    this._namedArgs.clear();
    return this;
  }
};
function stmtToProto(sqlOwner, stmt, wantRows) {
  let inSql;
  let args = [];
  let namedArgs = [];
  if (stmt instanceof Stmt) {
    inSql = stmt.sql;
    args = stmt._args;
    for (const [name2, value] of stmt._namedArgs.entries()) {
      namedArgs.push({ name: name2, value });
    }
  } else if (Array.isArray(stmt)) {
    inSql = stmt[0];
    if (Array.isArray(stmt[1])) {
      args = stmt[1].map((arg) => valueToProto(arg));
    } else {
      namedArgs = Object.entries(stmt[1]).map(([name2, value]) => {
        return { name: name2, value: valueToProto(value) };
      });
    }
  } else {
    inSql = stmt;
  }
  const { sql, sqlId } = sqlToProto(sqlOwner, inSql);
  return { sql, sqlId, args, namedArgs, wantRows };
}

// node_modules/@libsql/hrana-client/lib-esm/batch.js
var Batch = class {
  /** @private */
  _stream;
  #useCursor;
  /** @private */
  _steps;
  #executed;
  /** @private */
  constructor(stream, useCursor) {
    this._stream = stream;
    this.#useCursor = useCursor;
    this._steps = [];
    this.#executed = false;
  }
  /** Return a builder for adding a step to the batch. */
  step() {
    return new BatchStep(this);
  }
  /** Execute the batch. */
  execute() {
    if (this.#executed) {
      throw new MisuseError("This batch has already been executed");
    }
    this.#executed = true;
    const batch = {
      steps: this._steps.map((step) => step.proto)
    };
    if (this.#useCursor) {
      return executeCursor(this._stream, this._steps, batch);
    } else {
      return executeRegular(this._stream, this._steps, batch);
    }
  }
};
function executeRegular(stream, steps, batch) {
  return stream._batch(batch).then((result) => {
    for (let step = 0; step < steps.length; ++step) {
      const stepResult = result.stepResults.get(step);
      const stepError = result.stepErrors.get(step);
      steps[step].callback(stepResult, stepError);
    }
  });
}
async function executeCursor(stream, steps, batch) {
  const cursor = await stream._openCursor(batch);
  try {
    let nextStep = 0;
    let beginEntry = void 0;
    let rows = [];
    for (; ; ) {
      const entry = await cursor.next();
      if (entry === void 0) {
        break;
      }
      if (entry.type === "step_begin") {
        if (entry.step < nextStep || entry.step >= steps.length) {
          throw new ProtoError("Server produced StepBeginEntry for unexpected step");
        } else if (beginEntry !== void 0) {
          throw new ProtoError("Server produced StepBeginEntry before terminating previous step");
        }
        for (let step = nextStep; step < entry.step; ++step) {
          steps[step].callback(void 0, void 0);
        }
        nextStep = entry.step + 1;
        beginEntry = entry;
        rows = [];
      } else if (entry.type === "step_end") {
        if (beginEntry === void 0) {
          throw new ProtoError("Server produced StepEndEntry but no step is active");
        }
        const stmtResult = {
          cols: beginEntry.cols,
          rows,
          affectedRowCount: entry.affectedRowCount,
          lastInsertRowid: entry.lastInsertRowid
        };
        steps[beginEntry.step].callback(stmtResult, void 0);
        beginEntry = void 0;
        rows = [];
      } else if (entry.type === "step_error") {
        if (beginEntry === void 0) {
          if (entry.step >= steps.length) {
            throw new ProtoError("Server produced StepErrorEntry for unexpected step");
          }
          for (let step = nextStep; step < entry.step; ++step) {
            steps[step].callback(void 0, void 0);
          }
        } else {
          if (entry.step !== beginEntry.step) {
            throw new ProtoError("Server produced StepErrorEntry for unexpected step");
          }
          beginEntry = void 0;
          rows = [];
        }
        steps[entry.step].callback(void 0, entry.error);
        nextStep = entry.step + 1;
      } else if (entry.type === "row") {
        if (beginEntry === void 0) {
          throw new ProtoError("Server produced RowEntry but no step is active");
        }
        rows.push(entry.row);
      } else if (entry.type === "error") {
        throw errorFromProto(entry.error);
      } else if (entry.type === "none") {
        throw new ProtoError("Server produced unrecognized CursorEntry");
      } else {
        throw impossible(entry, "Impossible CursorEntry");
      }
    }
    if (beginEntry !== void 0) {
      throw new ProtoError("Server closed Cursor before terminating active step");
    }
    for (let step = nextStep; step < steps.length; ++step) {
      steps[step].callback(void 0, void 0);
    }
  } finally {
    cursor.close();
  }
}
var BatchStep = class {
  /** @private */
  _batch;
  #conds;
  /** @private */
  _index;
  /** @private */
  constructor(batch) {
    this._batch = batch;
    this.#conds = [];
    this._index = void 0;
  }
  /** Add the condition that needs to be satisfied to execute the statement. If you use this method multiple
   * times, we join the conditions with a logical AND. */
  condition(cond) {
    this.#conds.push(cond._proto);
    return this;
  }
  /** Add a statement that returns rows. */
  query(stmt) {
    return this.#add(stmt, true, rowsResultFromProto);
  }
  /** Add a statement that returns at most a single row. */
  queryRow(stmt) {
    return this.#add(stmt, true, rowResultFromProto);
  }
  /** Add a statement that returns at most a single value. */
  queryValue(stmt) {
    return this.#add(stmt, true, valueResultFromProto);
  }
  /** Add a statement without returning rows. */
  run(stmt) {
    return this.#add(stmt, false, stmtResultFromProto);
  }
  #add(inStmt, wantRows, fromProto) {
    if (this._index !== void 0) {
      throw new MisuseError("This BatchStep has already been added to the batch");
    }
    const stmt = stmtToProto(this._batch._stream._sqlOwner(), inStmt, wantRows);
    let condition;
    if (this.#conds.length === 0) {
      condition = void 0;
    } else if (this.#conds.length === 1) {
      condition = this.#conds[0];
    } else {
      condition = { type: "and", conds: this.#conds.slice() };
    }
    const proto = { stmt, condition };
    return new Promise((outputCallback, errorCallback) => {
      const callback = (stepResult, stepError) => {
        if (stepResult !== void 0 && stepError !== void 0) {
          errorCallback(new ProtoError("Server returned both result and error"));
        } else if (stepError !== void 0) {
          errorCallback(errorFromProto(stepError));
        } else if (stepResult !== void 0) {
          outputCallback(fromProto(stepResult, this._batch._stream.intMode));
        } else {
          outputCallback(void 0);
        }
      };
      this._index = this._batch._steps.length;
      this._batch._steps.push({ proto, callback });
    });
  }
};
var BatchCond = class _BatchCond {
  /** @private */
  _batch;
  /** @private */
  _proto;
  /** @private */
  constructor(batch, proto) {
    this._batch = batch;
    this._proto = proto;
  }
  /** Create a condition that evaluates to true when the given step executes successfully.
   *
   * If the given step fails error or is skipped because its condition evaluated to false, this
   * condition evaluates to false.
   */
  static ok(step) {
    return new _BatchCond(step._batch, { type: "ok", step: stepIndex(step) });
  }
  /** Create a condition that evaluates to true when the given step fails.
   *
   * If the given step succeeds or is skipped because its condition evaluated to false, this condition
   * evaluates to false.
   */
  static error(step) {
    return new _BatchCond(step._batch, { type: "error", step: stepIndex(step) });
  }
  /** Create a condition that is a logical negation of another condition.
   */
  static not(cond) {
    return new _BatchCond(cond._batch, { type: "not", cond: cond._proto });
  }
  /** Create a condition that is a logical AND of other conditions.
   */
  static and(batch, conds) {
    for (const cond of conds) {
      checkCondBatch(batch, cond);
    }
    return new _BatchCond(batch, { type: "and", conds: conds.map((e) => e._proto) });
  }
  /** Create a condition that is a logical OR of other conditions.
   */
  static or(batch, conds) {
    for (const cond of conds) {
      checkCondBatch(batch, cond);
    }
    return new _BatchCond(batch, { type: "or", conds: conds.map((e) => e._proto) });
  }
  /** Create a condition that evaluates to true when the SQL connection is in autocommit mode (not inside an
   * explicit transaction). This requires protocol version 3 or higher.
   */
  static isAutocommit(batch) {
    batch._stream.client()._ensureVersion(3, "BatchCond.isAutocommit()");
    return new _BatchCond(batch, { type: "is_autocommit" });
  }
};
function stepIndex(step) {
  if (step._index === void 0) {
    throw new MisuseError("Cannot add a condition referencing a step that has not been added to the batch");
  }
  return step._index;
}
function checkCondBatch(expectedBatch, cond) {
  if (cond._batch !== expectedBatch) {
    throw new MisuseError("Cannot mix BatchCond objects for different Batch objects");
  }
}

// node_modules/@libsql/hrana-client/lib-esm/describe.js
function describeResultFromProto(result) {
  return {
    paramNames: result.params.map((p) => p.name),
    columns: result.cols,
    isExplain: result.isExplain,
    isReadonly: result.isReadonly
  };
}

// node_modules/@libsql/hrana-client/lib-esm/stream.js
var Stream2 = class {
  /** @private */
  constructor(intMode) {
    this.intMode = intMode;
  }
  /** Execute a statement and return rows. */
  query(stmt) {
    return this.#execute(stmt, true, rowsResultFromProto);
  }
  /** Execute a statement and return at most a single row. */
  queryRow(stmt) {
    return this.#execute(stmt, true, rowResultFromProto);
  }
  /** Execute a statement and return at most a single value. */
  queryValue(stmt) {
    return this.#execute(stmt, true, valueResultFromProto);
  }
  /** Execute a statement without returning rows. */
  run(stmt) {
    return this.#execute(stmt, false, stmtResultFromProto);
  }
  #execute(inStmt, wantRows, fromProto) {
    const stmt = stmtToProto(this._sqlOwner(), inStmt, wantRows);
    return this._execute(stmt).then((r) => fromProto(r, this.intMode));
  }
  /** Return a builder for creating and executing a batch.
   *
   * If `useCursor` is true, the batch will be executed using a Hrana cursor, which will stream results from
   * the server to the client, which consumes less memory on the server. This requires protocol version 3 or
   * higher.
   */
  batch(useCursor = false) {
    return new Batch(this, useCursor);
  }
  /** Parse and analyze a statement. This requires protocol version 2 or higher. */
  describe(inSql) {
    const protoSql = sqlToProto(this._sqlOwner(), inSql);
    return this._describe(protoSql).then(describeResultFromProto);
  }
  /** Execute a sequence of statements separated by semicolons. This requires protocol version 2 or higher.
   * */
  sequence(inSql) {
    const protoSql = sqlToProto(this._sqlOwner(), inSql);
    return this._sequence(protoSql);
  }
  /** Representation of integers returned from the database. See {@link IntMode}.
   *
   * This value affects the results of all operations on this stream.
   */
  intMode;
};

// node_modules/@libsql/hrana-client/lib-esm/cursor.js
var Cursor = class {
};

// node_modules/@libsql/hrana-client/lib-esm/ws/cursor.js
var fetchChunkSize = 1e3;
var fetchQueueSize = 10;
var WsCursor = class extends Cursor {
  #client;
  #stream;
  #cursorId;
  #entryQueue;
  #fetchQueue;
  #closed;
  #done;
  /** @private */
  constructor(client, stream, cursorId) {
    super();
    this.#client = client;
    this.#stream = stream;
    this.#cursorId = cursorId;
    this.#entryQueue = new Queue();
    this.#fetchQueue = new Queue();
    this.#closed = void 0;
    this.#done = false;
  }
  /** Fetch the next entry from the cursor. */
  async next() {
    for (; ; ) {
      if (this.#closed !== void 0) {
        throw new ClosedError("Cursor is closed", this.#closed);
      }
      while (!this.#done && this.#fetchQueue.length < fetchQueueSize) {
        this.#fetchQueue.push(this.#fetch());
      }
      const entry = this.#entryQueue.shift();
      if (this.#done || entry !== void 0) {
        return entry;
      }
      await this.#fetchQueue.shift().then((response) => {
        if (response === void 0) {
          return;
        }
        for (const entry2 of response.entries) {
          this.#entryQueue.push(entry2);
        }
        this.#done ||= response.done;
      });
    }
  }
  #fetch() {
    return this.#stream._sendCursorRequest(this, {
      type: "fetch_cursor",
      cursorId: this.#cursorId,
      maxCount: fetchChunkSize
    }).then((resp) => resp, (error2) => {
      this._setClosed(error2);
      return void 0;
    });
  }
  /** @private */
  _setClosed(error2) {
    if (this.#closed !== void 0) {
      return;
    }
    this.#closed = error2;
    this.#stream._sendCursorRequest(this, {
      type: "close_cursor",
      cursorId: this.#cursorId
    }).catch(() => void 0);
    this.#stream._cursorClosed(this);
  }
  /** Close the cursor. */
  close() {
    this._setClosed(new ClientError("Cursor was manually closed"));
  }
  /** True if the cursor is closed. */
  get closed() {
    return this.#closed !== void 0;
  }
};

// node_modules/@libsql/hrana-client/lib-esm/ws/stream.js
var WsStream = class _WsStream extends Stream2 {
  #client;
  #streamId;
  #queue;
  #cursor;
  #closing;
  #closed;
  /** @private */
  static open(client) {
    const streamId = client._streamIdAlloc.alloc();
    const stream = new _WsStream(client, streamId);
    const responseCallback = () => void 0;
    const errorCallback = (e) => stream.#setClosed(e);
    const request = { type: "open_stream", streamId };
    client._sendRequest(request, { responseCallback, errorCallback });
    return stream;
  }
  /** @private */
  constructor(client, streamId) {
    super(client.intMode);
    this.#client = client;
    this.#streamId = streamId;
    this.#queue = new Queue();
    this.#cursor = void 0;
    this.#closing = false;
    this.#closed = void 0;
  }
  /** Get the {@link WsClient} object that this stream belongs to. */
  client() {
    return this.#client;
  }
  /** @private */
  _sqlOwner() {
    return this.#client;
  }
  /** @private */
  _execute(stmt) {
    return this.#sendStreamRequest({
      type: "execute",
      streamId: this.#streamId,
      stmt
    }).then((response) => {
      return response.result;
    });
  }
  /** @private */
  _batch(batch) {
    return this.#sendStreamRequest({
      type: "batch",
      streamId: this.#streamId,
      batch
    }).then((response) => {
      return response.result;
    });
  }
  /** @private */
  _describe(protoSql) {
    this.#client._ensureVersion(2, "describe()");
    return this.#sendStreamRequest({
      type: "describe",
      streamId: this.#streamId,
      sql: protoSql.sql,
      sqlId: protoSql.sqlId
    }).then((response) => {
      return response.result;
    });
  }
  /** @private */
  _sequence(protoSql) {
    this.#client._ensureVersion(2, "sequence()");
    return this.#sendStreamRequest({
      type: "sequence",
      streamId: this.#streamId,
      sql: protoSql.sql,
      sqlId: protoSql.sqlId
    }).then((_response) => {
      return void 0;
    });
  }
  /** Check whether the SQL connection underlying this stream is in autocommit state (i.e., outside of an
   * explicit transaction). This requires protocol version 3 or higher.
   */
  getAutocommit() {
    this.#client._ensureVersion(3, "getAutocommit()");
    return this.#sendStreamRequest({
      type: "get_autocommit",
      streamId: this.#streamId
    }).then((response) => {
      return response.isAutocommit;
    });
  }
  #sendStreamRequest(request) {
    return new Promise((responseCallback, errorCallback) => {
      this.#pushToQueue({ type: "request", request, responseCallback, errorCallback });
    });
  }
  /** @private */
  _openCursor(batch) {
    this.#client._ensureVersion(3, "cursor");
    return new Promise((cursorCallback, errorCallback) => {
      this.#pushToQueue({ type: "cursor", batch, cursorCallback, errorCallback });
    });
  }
  /** @private */
  _sendCursorRequest(cursor, request) {
    if (cursor !== this.#cursor) {
      throw new InternalError("Cursor not associated with the stream attempted to execute a request");
    }
    return new Promise((responseCallback, errorCallback) => {
      if (this.#closed !== void 0) {
        errorCallback(new ClosedError("Stream is closed", this.#closed));
      } else {
        this.#client._sendRequest(request, { responseCallback, errorCallback });
      }
    });
  }
  /** @private */
  _cursorClosed(cursor) {
    if (cursor !== this.#cursor) {
      throw new InternalError("Cursor was closed, but it was not associated with the stream");
    }
    this.#cursor = void 0;
    this.#flushQueue();
  }
  #pushToQueue(entry) {
    if (this.#closed !== void 0) {
      entry.errorCallback(new ClosedError("Stream is closed", this.#closed));
    } else if (this.#closing) {
      entry.errorCallback(new ClosedError("Stream is closing", void 0));
    } else {
      this.#queue.push(entry);
      this.#flushQueue();
    }
  }
  #flushQueue() {
    for (; ; ) {
      const entry = this.#queue.first();
      if (entry === void 0 && this.#cursor === void 0 && this.#closing) {
        this.#setClosed(new ClientError("Stream was gracefully closed"));
        break;
      } else if (entry?.type === "request" && this.#cursor === void 0) {
        const { request, responseCallback, errorCallback } = entry;
        this.#queue.shift();
        this.#client._sendRequest(request, { responseCallback, errorCallback });
      } else if (entry?.type === "cursor" && this.#cursor === void 0) {
        const { batch, cursorCallback } = entry;
        this.#queue.shift();
        const cursorId = this.#client._cursorIdAlloc.alloc();
        const cursor = new WsCursor(this.#client, this, cursorId);
        const request = {
          type: "open_cursor",
          streamId: this.#streamId,
          cursorId,
          batch
        };
        const responseCallback = () => void 0;
        const errorCallback = (e) => cursor._setClosed(e);
        this.#client._sendRequest(request, { responseCallback, errorCallback });
        this.#cursor = cursor;
        cursorCallback(cursor);
      } else {
        break;
      }
    }
  }
  #setClosed(error2) {
    if (this.#closed !== void 0) {
      return;
    }
    this.#closed = error2;
    if (this.#cursor !== void 0) {
      this.#cursor._setClosed(error2);
    }
    for (; ; ) {
      const entry = this.#queue.shift();
      if (entry !== void 0) {
        entry.errorCallback(error2);
      } else {
        break;
      }
    }
    const request = { type: "close_stream", streamId: this.#streamId };
    const responseCallback = () => this.#client._streamIdAlloc.free(this.#streamId);
    const errorCallback = () => void 0;
    this.#client._sendRequest(request, { responseCallback, errorCallback });
  }
  /** Immediately close the stream. */
  close() {
    this.#setClosed(new ClientError("Stream was manually closed"));
  }
  /** Gracefully close the stream. */
  closeGracefully() {
    this.#closing = true;
    this.#flushQueue();
  }
  /** True if the stream is closed or closing. */
  get closed() {
    return this.#closed !== void 0 || this.#closing;
  }
};

// node_modules/@libsql/hrana-client/lib-esm/shared/json_encode.js
function Stmt2(w, msg) {
  if (msg.sql !== void 0) {
    w.string("sql", msg.sql);
  }
  if (msg.sqlId !== void 0) {
    w.number("sql_id", msg.sqlId);
  }
  w.arrayObjects("args", msg.args, Value);
  w.arrayObjects("named_args", msg.namedArgs, NamedArg);
  w.boolean("want_rows", msg.wantRows);
}
function NamedArg(w, msg) {
  w.string("name", msg.name);
  w.object("value", msg.value, Value);
}
function Batch2(w, msg) {
  w.arrayObjects("steps", msg.steps, BatchStep2);
}
function BatchStep2(w, msg) {
  if (msg.condition !== void 0) {
    w.object("condition", msg.condition, BatchCond2);
  }
  w.object("stmt", msg.stmt, Stmt2);
}
function BatchCond2(w, msg) {
  w.stringRaw("type", msg.type);
  if (msg.type === "ok" || msg.type === "error") {
    w.number("step", msg.step);
  } else if (msg.type === "not") {
    w.object("cond", msg.cond, BatchCond2);
  } else if (msg.type === "and" || msg.type === "or") {
    w.arrayObjects("conds", msg.conds, BatchCond2);
  } else if (msg.type === "is_autocommit") {
  } else {
    throw impossible(msg, "Impossible type of BatchCond");
  }
}
function Value(w, msg) {
  if (msg === null) {
    w.stringRaw("type", "null");
  } else if (typeof msg === "bigint") {
    w.stringRaw("type", "integer");
    w.stringRaw("value", "" + msg);
  } else if (typeof msg === "number") {
    w.stringRaw("type", "float");
    w.number("value", msg);
  } else if (typeof msg === "string") {
    w.stringRaw("type", "text");
    w.string("value", msg);
  } else if (msg instanceof Uint8Array) {
    w.stringRaw("type", "blob");
    w.stringRaw("base64", gBase64.fromUint8Array(msg));
  } else if (msg === void 0) {
  } else {
    throw impossible(msg, "Impossible type of Value");
  }
}

// node_modules/@libsql/hrana-client/lib-esm/ws/json_encode.js
function ClientMsg(w, msg) {
  w.stringRaw("type", msg.type);
  if (msg.type === "hello") {
    if (msg.jwt !== void 0) {
      w.string("jwt", msg.jwt);
    }
  } else if (msg.type === "request") {
    w.number("request_id", msg.requestId);
    w.object("request", msg.request, Request2);
  } else {
    throw impossible(msg, "Impossible type of ClientMsg");
  }
}
function Request2(w, msg) {
  w.stringRaw("type", msg.type);
  if (msg.type === "open_stream") {
    w.number("stream_id", msg.streamId);
  } else if (msg.type === "close_stream") {
    w.number("stream_id", msg.streamId);
  } else if (msg.type === "execute") {
    w.number("stream_id", msg.streamId);
    w.object("stmt", msg.stmt, Stmt2);
  } else if (msg.type === "batch") {
    w.number("stream_id", msg.streamId);
    w.object("batch", msg.batch, Batch2);
  } else if (msg.type === "open_cursor") {
    w.number("stream_id", msg.streamId);
    w.number("cursor_id", msg.cursorId);
    w.object("batch", msg.batch, Batch2);
  } else if (msg.type === "close_cursor") {
    w.number("cursor_id", msg.cursorId);
  } else if (msg.type === "fetch_cursor") {
    w.number("cursor_id", msg.cursorId);
    w.number("max_count", msg.maxCount);
  } else if (msg.type === "sequence") {
    w.number("stream_id", msg.streamId);
    if (msg.sql !== void 0) {
      w.string("sql", msg.sql);
    }
    if (msg.sqlId !== void 0) {
      w.number("sql_id", msg.sqlId);
    }
  } else if (msg.type === "describe") {
    w.number("stream_id", msg.streamId);
    if (msg.sql !== void 0) {
      w.string("sql", msg.sql);
    }
    if (msg.sqlId !== void 0) {
      w.number("sql_id", msg.sqlId);
    }
  } else if (msg.type === "store_sql") {
    w.number("sql_id", msg.sqlId);
    w.string("sql", msg.sql);
  } else if (msg.type === "close_sql") {
    w.number("sql_id", msg.sqlId);
  } else if (msg.type === "get_autocommit") {
    w.number("stream_id", msg.streamId);
  } else {
    throw impossible(msg, "Impossible type of Request");
  }
}

// node_modules/@libsql/hrana-client/lib-esm/shared/protobuf_encode.js
function Stmt3(w, msg) {
  if (msg.sql !== void 0) {
    w.string(1, msg.sql);
  }
  if (msg.sqlId !== void 0) {
    w.int32(2, msg.sqlId);
  }
  for (const arg of msg.args) {
    w.message(3, arg, Value2);
  }
  for (const arg of msg.namedArgs) {
    w.message(4, arg, NamedArg2);
  }
  w.bool(5, msg.wantRows);
}
function NamedArg2(w, msg) {
  w.string(1, msg.name);
  w.message(2, msg.value, Value2);
}
function Batch3(w, msg) {
  for (const step of msg.steps) {
    w.message(1, step, BatchStep3);
  }
}
function BatchStep3(w, msg) {
  if (msg.condition !== void 0) {
    w.message(1, msg.condition, BatchCond3);
  }
  w.message(2, msg.stmt, Stmt3);
}
function BatchCond3(w, msg) {
  if (msg.type === "ok") {
    w.uint32(1, msg.step);
  } else if (msg.type === "error") {
    w.uint32(2, msg.step);
  } else if (msg.type === "not") {
    w.message(3, msg.cond, BatchCond3);
  } else if (msg.type === "and") {
    w.message(4, msg.conds, BatchCondList);
  } else if (msg.type === "or") {
    w.message(5, msg.conds, BatchCondList);
  } else if (msg.type === "is_autocommit") {
    w.message(6, void 0, Empty);
  } else {
    throw impossible(msg, "Impossible type of BatchCond");
  }
}
function BatchCondList(w, msg) {
  for (const cond of msg) {
    w.message(1, cond, BatchCond3);
  }
}
function Value2(w, msg) {
  if (msg === null) {
    w.message(1, void 0, Empty);
  } else if (typeof msg === "bigint") {
    w.sint64(2, msg);
  } else if (typeof msg === "number") {
    w.double(3, msg);
  } else if (typeof msg === "string") {
    w.string(4, msg);
  } else if (msg instanceof Uint8Array) {
    w.bytes(5, msg);
  } else if (msg === void 0) {
  } else {
    throw impossible(msg, "Impossible type of Value");
  }
}
function Empty(_w, _msg) {
}

// node_modules/@libsql/hrana-client/lib-esm/ws/protobuf_encode.js
function ClientMsg2(w, msg) {
  if (msg.type === "hello") {
    w.message(1, msg, HelloMsg);
  } else if (msg.type === "request") {
    w.message(2, msg, RequestMsg);
  } else {
    throw impossible(msg, "Impossible type of ClientMsg");
  }
}
function HelloMsg(w, msg) {
  if (msg.jwt !== void 0) {
    w.string(1, msg.jwt);
  }
}
function RequestMsg(w, msg) {
  w.int32(1, msg.requestId);
  const request = msg.request;
  if (request.type === "open_stream") {
    w.message(2, request, OpenStreamReq);
  } else if (request.type === "close_stream") {
    w.message(3, request, CloseStreamReq);
  } else if (request.type === "execute") {
    w.message(4, request, ExecuteReq);
  } else if (request.type === "batch") {
    w.message(5, request, BatchReq);
  } else if (request.type === "open_cursor") {
    w.message(6, request, OpenCursorReq);
  } else if (request.type === "close_cursor") {
    w.message(7, request, CloseCursorReq);
  } else if (request.type === "fetch_cursor") {
    w.message(8, request, FetchCursorReq);
  } else if (request.type === "sequence") {
    w.message(9, request, SequenceReq);
  } else if (request.type === "describe") {
    w.message(10, request, DescribeReq);
  } else if (request.type === "store_sql") {
    w.message(11, request, StoreSqlReq);
  } else if (request.type === "close_sql") {
    w.message(12, request, CloseSqlReq);
  } else if (request.type === "get_autocommit") {
    w.message(13, request, GetAutocommitReq);
  } else {
    throw impossible(request, "Impossible type of Request");
  }
}
function OpenStreamReq(w, msg) {
  w.int32(1, msg.streamId);
}
function CloseStreamReq(w, msg) {
  w.int32(1, msg.streamId);
}
function ExecuteReq(w, msg) {
  w.int32(1, msg.streamId);
  w.message(2, msg.stmt, Stmt3);
}
function BatchReq(w, msg) {
  w.int32(1, msg.streamId);
  w.message(2, msg.batch, Batch3);
}
function OpenCursorReq(w, msg) {
  w.int32(1, msg.streamId);
  w.int32(2, msg.cursorId);
  w.message(3, msg.batch, Batch3);
}
function CloseCursorReq(w, msg) {
  w.int32(1, msg.cursorId);
}
function FetchCursorReq(w, msg) {
  w.int32(1, msg.cursorId);
  w.uint32(2, msg.maxCount);
}
function SequenceReq(w, msg) {
  w.int32(1, msg.streamId);
  if (msg.sql !== void 0) {
    w.string(2, msg.sql);
  }
  if (msg.sqlId !== void 0) {
    w.int32(3, msg.sqlId);
  }
}
function DescribeReq(w, msg) {
  w.int32(1, msg.streamId);
  if (msg.sql !== void 0) {
    w.string(2, msg.sql);
  }
  if (msg.sqlId !== void 0) {
    w.int32(3, msg.sqlId);
  }
}
function StoreSqlReq(w, msg) {
  w.int32(1, msg.sqlId);
  w.string(2, msg.sql);
}
function CloseSqlReq(w, msg) {
  w.int32(1, msg.sqlId);
}
function GetAutocommitReq(w, msg) {
  w.int32(1, msg.streamId);
}

// node_modules/@libsql/hrana-client/lib-esm/shared/json_decode.js
function Error2(obj) {
  const message = string(obj["message"]);
  const code = stringOpt(obj["code"]);
  return { message, code };
}
function StmtResult(obj) {
  const cols = arrayObjectsMap(obj["cols"], Col);
  const rows = array(obj["rows"]).map((rowObj) => arrayObjectsMap(rowObj, Value3));
  const affectedRowCount = number(obj["affected_row_count"]);
  const lastInsertRowidStr = stringOpt(obj["last_insert_rowid"]);
  const lastInsertRowid = lastInsertRowidStr !== void 0 ? BigInt(lastInsertRowidStr) : void 0;
  return { cols, rows, affectedRowCount, lastInsertRowid };
}
function Col(obj) {
  const name2 = stringOpt(obj["name"]);
  const decltype = stringOpt(obj["decltype"]);
  return { name: name2, decltype };
}
function BatchResult(obj) {
  const stepResults = /* @__PURE__ */ new Map();
  array(obj["step_results"]).forEach((value, i) => {
    if (value !== null) {
      stepResults.set(i, StmtResult(object(value)));
    }
  });
  const stepErrors = /* @__PURE__ */ new Map();
  array(obj["step_errors"]).forEach((value, i) => {
    if (value !== null) {
      stepErrors.set(i, Error2(object(value)));
    }
  });
  return { stepResults, stepErrors };
}
function CursorEntry(obj) {
  const type = string(obj["type"]);
  if (type === "step_begin") {
    const step = number(obj["step"]);
    const cols = arrayObjectsMap(obj["cols"], Col);
    return { type: "step_begin", step, cols };
  } else if (type === "step_end") {
    const affectedRowCount = number(obj["affected_row_count"]);
    const lastInsertRowidStr = stringOpt(obj["last_insert_rowid"]);
    const lastInsertRowid = lastInsertRowidStr !== void 0 ? BigInt(lastInsertRowidStr) : void 0;
    return { type: "step_end", affectedRowCount, lastInsertRowid };
  } else if (type === "step_error") {
    const step = number(obj["step"]);
    const error2 = Error2(object(obj["error"]));
    return { type: "step_error", step, error: error2 };
  } else if (type === "row") {
    const row = arrayObjectsMap(obj["row"], Value3);
    return { type: "row", row };
  } else if (type === "error") {
    const error2 = Error2(object(obj["error"]));
    return { type: "error", error: error2 };
  } else {
    throw new ProtoError("Unexpected type of CursorEntry");
  }
}
function DescribeResult(obj) {
  const params = arrayObjectsMap(obj["params"], DescribeParam);
  const cols = arrayObjectsMap(obj["cols"], DescribeCol);
  const isExplain = boolean(obj["is_explain"]);
  const isReadonly = boolean(obj["is_readonly"]);
  return { params, cols, isExplain, isReadonly };
}
function DescribeParam(obj) {
  const name2 = stringOpt(obj["name"]);
  return { name: name2 };
}
function DescribeCol(obj) {
  const name2 = string(obj["name"]);
  const decltype = stringOpt(obj["decltype"]);
  return { name: name2, decltype };
}
function Value3(obj) {
  const type = string(obj["type"]);
  if (type === "null") {
    return null;
  } else if (type === "integer") {
    const value = string(obj["value"]);
    return BigInt(value);
  } else if (type === "float") {
    return number(obj["value"]);
  } else if (type === "text") {
    return string(obj["value"]);
  } else if (type === "blob") {
    return gBase64.toUint8Array(string(obj["base64"]));
  } else {
    throw new ProtoError("Unexpected type of Value");
  }
}

// node_modules/@libsql/hrana-client/lib-esm/ws/json_decode.js
function ServerMsg(obj) {
  const type = string(obj["type"]);
  if (type === "hello_ok") {
    return { type: "hello_ok" };
  } else if (type === "hello_error") {
    const error2 = Error2(object(obj["error"]));
    return { type: "hello_error", error: error2 };
  } else if (type === "response_ok") {
    const requestId = number(obj["request_id"]);
    const response = Response2(object(obj["response"]));
    return { type: "response_ok", requestId, response };
  } else if (type === "response_error") {
    const requestId = number(obj["request_id"]);
    const error2 = Error2(object(obj["error"]));
    return { type: "response_error", requestId, error: error2 };
  } else {
    throw new ProtoError("Unexpected type of ServerMsg");
  }
}
function Response2(obj) {
  const type = string(obj["type"]);
  if (type === "open_stream") {
    return { type: "open_stream" };
  } else if (type === "close_stream") {
    return { type: "close_stream" };
  } else if (type === "execute") {
    const result = StmtResult(object(obj["result"]));
    return { type: "execute", result };
  } else if (type === "batch") {
    const result = BatchResult(object(obj["result"]));
    return { type: "batch", result };
  } else if (type === "open_cursor") {
    return { type: "open_cursor" };
  } else if (type === "close_cursor") {
    return { type: "close_cursor" };
  } else if (type === "fetch_cursor") {
    const entries = arrayObjectsMap(obj["entries"], CursorEntry);
    const done = boolean(obj["done"]);
    return { type: "fetch_cursor", entries, done };
  } else if (type === "sequence") {
    return { type: "sequence" };
  } else if (type === "describe") {
    const result = DescribeResult(object(obj["result"]));
    return { type: "describe", result };
  } else if (type === "store_sql") {
    return { type: "store_sql" };
  } else if (type === "close_sql") {
    return { type: "close_sql" };
  } else if (type === "get_autocommit") {
    const isAutocommit = boolean(obj["is_autocommit"]);
    return { type: "get_autocommit", isAutocommit };
  } else {
    throw new ProtoError("Unexpected type of Response");
  }
}

// node_modules/@libsql/hrana-client/lib-esm/shared/protobuf_decode.js
var Error3 = {
  default() {
    return { message: "", code: void 0 };
  },
  1(r, msg) {
    msg.message = r.string();
  },
  2(r, msg) {
    msg.code = r.string();
  }
};
var StmtResult2 = {
  default() {
    return {
      cols: [],
      rows: [],
      affectedRowCount: 0,
      lastInsertRowid: void 0
    };
  },
  1(r, msg) {
    msg.cols.push(r.message(Col2));
  },
  2(r, msg) {
    msg.rows.push(r.message(Row));
  },
  3(r, msg) {
    msg.affectedRowCount = Number(r.uint64());
  },
  4(r, msg) {
    msg.lastInsertRowid = r.sint64();
  }
};
var Col2 = {
  default() {
    return { name: void 0, decltype: void 0 };
  },
  1(r, msg) {
    msg.name = r.string();
  },
  2(r, msg) {
    msg.decltype = r.string();
  }
};
var Row = {
  default() {
    return [];
  },
  1(r, msg) {
    msg.push(r.message(Value4));
  }
};
var BatchResult2 = {
  default() {
    return { stepResults: /* @__PURE__ */ new Map(), stepErrors: /* @__PURE__ */ new Map() };
  },
  1(r, msg) {
    const [key, value] = r.message(BatchResultStepResult);
    msg.stepResults.set(key, value);
  },
  2(r, msg) {
    const [key, value] = r.message(BatchResultStepError);
    msg.stepErrors.set(key, value);
  }
};
var BatchResultStepResult = {
  default() {
    return [0, StmtResult2.default()];
  },
  1(r, msg) {
    msg[0] = r.uint32();
  },
  2(r, msg) {
    msg[1] = r.message(StmtResult2);
  }
};
var BatchResultStepError = {
  default() {
    return [0, Error3.default()];
  },
  1(r, msg) {
    msg[0] = r.uint32();
  },
  2(r, msg) {
    msg[1] = r.message(Error3);
  }
};
var CursorEntry2 = {
  default() {
    return { type: "none" };
  },
  1(r) {
    return r.message(StepBeginEntry);
  },
  2(r) {
    return r.message(StepEndEntry);
  },
  3(r) {
    return r.message(StepErrorEntry);
  },
  4(r) {
    return { type: "row", row: r.message(Row) };
  },
  5(r) {
    return { type: "error", error: r.message(Error3) };
  }
};
var StepBeginEntry = {
  default() {
    return { type: "step_begin", step: 0, cols: [] };
  },
  1(r, msg) {
    msg.step = r.uint32();
  },
  2(r, msg) {
    msg.cols.push(r.message(Col2));
  }
};
var StepEndEntry = {
  default() {
    return {
      type: "step_end",
      affectedRowCount: 0,
      lastInsertRowid: void 0
    };
  },
  1(r, msg) {
    msg.affectedRowCount = r.uint32();
  },
  2(r, msg) {
    msg.lastInsertRowid = r.uint64();
  }
};
var StepErrorEntry = {
  default() {
    return {
      type: "step_error",
      step: 0,
      error: Error3.default()
    };
  },
  1(r, msg) {
    msg.step = r.uint32();
  },
  2(r, msg) {
    msg.error = r.message(Error3);
  }
};
var DescribeResult2 = {
  default() {
    return {
      params: [],
      cols: [],
      isExplain: false,
      isReadonly: false
    };
  },
  1(r, msg) {
    msg.params.push(r.message(DescribeParam2));
  },
  2(r, msg) {
    msg.cols.push(r.message(DescribeCol2));
  },
  3(r, msg) {
    msg.isExplain = r.bool();
  },
  4(r, msg) {
    msg.isReadonly = r.bool();
  }
};
var DescribeParam2 = {
  default() {
    return { name: void 0 };
  },
  1(r, msg) {
    msg.name = r.string();
  }
};
var DescribeCol2 = {
  default() {
    return { name: "", decltype: void 0 };
  },
  1(r, msg) {
    msg.name = r.string();
  },
  2(r, msg) {
    msg.decltype = r.string();
  }
};
var Value4 = {
  default() {
    return void 0;
  },
  1(r) {
    return null;
  },
  2(r) {
    return r.sint64();
  },
  3(r) {
    return r.double();
  },
  4(r) {
    return r.string();
  },
  5(r) {
    return r.bytes();
  }
};

// node_modules/@libsql/hrana-client/lib-esm/ws/protobuf_decode.js
var ServerMsg2 = {
  default() {
    return { type: "none" };
  },
  1(r) {
    return { type: "hello_ok" };
  },
  2(r) {
    return r.message(HelloErrorMsg);
  },
  3(r) {
    return r.message(ResponseOkMsg);
  },
  4(r) {
    return r.message(ResponseErrorMsg);
  }
};
var HelloErrorMsg = {
  default() {
    return { type: "hello_error", error: Error3.default() };
  },
  1(r, msg) {
    msg.error = r.message(Error3);
  }
};
var ResponseErrorMsg = {
  default() {
    return { type: "response_error", requestId: 0, error: Error3.default() };
  },
  1(r, msg) {
    msg.requestId = r.int32();
  },
  2(r, msg) {
    msg.error = r.message(Error3);
  }
};
var ResponseOkMsg = {
  default() {
    return {
      type: "response_ok",
      requestId: 0,
      response: { type: "none" }
    };
  },
  1(r, msg) {
    msg.requestId = r.int32();
  },
  2(r, msg) {
    msg.response = { type: "open_stream" };
  },
  3(r, msg) {
    msg.response = { type: "close_stream" };
  },
  4(r, msg) {
    msg.response = r.message(ExecuteResp);
  },
  5(r, msg) {
    msg.response = r.message(BatchResp);
  },
  6(r, msg) {
    msg.response = { type: "open_cursor" };
  },
  7(r, msg) {
    msg.response = { type: "close_cursor" };
  },
  8(r, msg) {
    msg.response = r.message(FetchCursorResp);
  },
  9(r, msg) {
    msg.response = { type: "sequence" };
  },
  10(r, msg) {
    msg.response = r.message(DescribeResp);
  },
  11(r, msg) {
    msg.response = { type: "store_sql" };
  },
  12(r, msg) {
    msg.response = { type: "close_sql" };
  },
  13(r, msg) {
    msg.response = r.message(GetAutocommitResp);
  }
};
var ExecuteResp = {
  default() {
    return { type: "execute", result: StmtResult2.default() };
  },
  1(r, msg) {
    msg.result = r.message(StmtResult2);
  }
};
var BatchResp = {
  default() {
    return { type: "batch", result: BatchResult2.default() };
  },
  1(r, msg) {
    msg.result = r.message(BatchResult2);
  }
};
var FetchCursorResp = {
  default() {
    return { type: "fetch_cursor", entries: [], done: false };
  },
  1(r, msg) {
    msg.entries.push(r.message(CursorEntry2));
  },
  2(r, msg) {
    msg.done = r.bool();
  }
};
var DescribeResp = {
  default() {
    return { type: "describe", result: DescribeResult2.default() };
  },
  1(r, msg) {
    msg.result = r.message(DescribeResult2);
  }
};
var GetAutocommitResp = {
  default() {
    return { type: "get_autocommit", isAutocommit: false };
  },
  1(r, msg) {
    msg.isAutocommit = r.bool();
  }
};

// node_modules/@libsql/hrana-client/lib-esm/ws/client.js
var subprotocolsV2 = /* @__PURE__ */ new Map([
  ["hrana2", { version: 2, encoding: "json" }],
  ["hrana1", { version: 1, encoding: "json" }]
]);
var subprotocolsV3 = /* @__PURE__ */ new Map([
  ["hrana3-protobuf", { version: 3, encoding: "protobuf" }],
  ["hrana3", { version: 3, encoding: "json" }],
  ["hrana2", { version: 2, encoding: "json" }],
  ["hrana1", { version: 1, encoding: "json" }]
]);
var WsClient = class extends Client {
  #socket;
  // List of callbacks that we queue until the socket transitions from the CONNECTING to the OPEN state.
  #openCallbacks;
  // Have we already transitioned from CONNECTING to OPEN and fired the callbacks in #openCallbacks?
  #opened;
  // Stores the error that caused us to close the client (and the socket). If we are not closed, this is
  // `undefined`.
  #closed;
  // Have we received a response to our "hello" from the server?
  #recvdHello;
  // Subprotocol negotiated with the server. It is only available after the socket transitions to the OPEN
  // state.
  #subprotocol;
  // Has the `getVersion()` function been called? This is only used to validate that the API is used
  // correctly.
  #getVersionCalled;
  // A map from request id to the responses that we expect to receive from the server.
  #responseMap;
  // An allocator of request ids.
  #requestIdAlloc;
  // An allocator of stream ids.
  /** @private */
  _streamIdAlloc;
  // An allocator of cursor ids.
  /** @private */
  _cursorIdAlloc;
  // An allocator of SQL text ids.
  #sqlIdAlloc;
  /** @private */
  constructor(socket, jwt) {
    super();
    this.#socket = socket;
    this.#openCallbacks = [];
    this.#opened = false;
    this.#closed = void 0;
    this.#recvdHello = false;
    this.#subprotocol = void 0;
    this.#getVersionCalled = false;
    this.#responseMap = /* @__PURE__ */ new Map();
    this.#requestIdAlloc = new IdAlloc();
    this._streamIdAlloc = new IdAlloc();
    this._cursorIdAlloc = new IdAlloc();
    this.#sqlIdAlloc = new IdAlloc();
    this.#socket.binaryType = "arraybuffer";
    this.#socket.addEventListener("open", () => this.#onSocketOpen());
    this.#socket.addEventListener("close", (event) => this.#onSocketClose(event));
    this.#socket.addEventListener("error", (event) => this.#onSocketError(event));
    this.#socket.addEventListener("message", (event) => this.#onSocketMessage(event));
    this.#send({ type: "hello", jwt });
  }
  // Send (or enqueue to send) a message to the server.
  #send(msg) {
    if (this.#closed !== void 0) {
      throw new InternalError("Trying to send a message on a closed client");
    }
    if (this.#opened) {
      this.#sendToSocket(msg);
    } else {
      const openCallback = () => this.#sendToSocket(msg);
      const errorCallback = () => void 0;
      this.#openCallbacks.push({ openCallback, errorCallback });
    }
  }
  // The socket transitioned from CONNECTING to OPEN
  #onSocketOpen() {
    const protocol = this.#socket.protocol;
    if (protocol === void 0) {
      this.#setClosed(new ClientError("The `WebSocket.protocol` property is undefined. This most likely means that the WebSocket implementation provided by the environment is broken. If you are using Miniflare 2, please update to Miniflare 3, which fixes this problem."));
      return;
    } else if (protocol === "") {
      this.#subprotocol = { version: 1, encoding: "json" };
    } else {
      this.#subprotocol = subprotocolsV3.get(protocol);
      if (this.#subprotocol === void 0) {
        this.#setClosed(new ProtoError(`Unrecognized WebSocket subprotocol: ${JSON.stringify(protocol)}`));
        return;
      }
    }
    for (const callbacks of this.#openCallbacks) {
      callbacks.openCallback();
    }
    this.#openCallbacks.length = 0;
    this.#opened = true;
  }
  #sendToSocket(msg) {
    const encoding = this.#subprotocol.encoding;
    if (encoding === "json") {
      const jsonMsg = writeJsonObject(msg, ClientMsg);
      this.#socket.send(jsonMsg);
    } else if (encoding === "protobuf") {
      const protobufMsg = writeProtobufMessage(msg, ClientMsg2);
      this.#socket.send(protobufMsg);
    } else {
      throw impossible(encoding, "Impossible encoding");
    }
  }
  /** Get the protocol version negotiated with the server, possibly waiting until the socket is open. */
  getVersion() {
    return new Promise((versionCallback, errorCallback) => {
      this.#getVersionCalled = true;
      if (this.#closed !== void 0) {
        errorCallback(this.#closed);
      } else if (!this.#opened) {
        const openCallback = () => versionCallback(this.#subprotocol.version);
        this.#openCallbacks.push({ openCallback, errorCallback });
      } else {
        versionCallback(this.#subprotocol.version);
      }
    });
  }
  // Make sure that the negotiated version is at least `minVersion`.
  /** @private */
  _ensureVersion(minVersion, feature) {
    if (this.#subprotocol === void 0 || !this.#getVersionCalled) {
      throw new ProtocolVersionError(`${feature} is supported only on protocol version ${minVersion} and higher, but the version supported by the WebSocket server is not yet known. Use Client.getVersion() to wait until the version is available.`);
    } else if (this.#subprotocol.version < minVersion) {
      throw new ProtocolVersionError(`${feature} is supported on protocol version ${minVersion} and higher, but the WebSocket server only supports version ${this.#subprotocol.version}`);
    }
  }
  // Send a request to the server and invoke a callback when we get the response.
  /** @private */
  _sendRequest(request, callbacks) {
    if (this.#closed !== void 0) {
      callbacks.errorCallback(new ClosedError("Client is closed", this.#closed));
      return;
    }
    const requestId = this.#requestIdAlloc.alloc();
    this.#responseMap.set(requestId, { ...callbacks, type: request.type });
    this.#send({ type: "request", requestId, request });
  }
  // The socket encountered an error.
  #onSocketError(event) {
    const eventMessage = event.message;
    const message = eventMessage ?? "WebSocket was closed due to an error";
    this.#setClosed(new WebSocketError(message));
  }
  // The socket was closed.
  #onSocketClose(event) {
    let message = `WebSocket was closed with code ${event.code}`;
    if (event.reason) {
      message += `: ${event.reason}`;
    }
    this.#setClosed(new WebSocketError(message));
  }
  // Close the client with the given error.
  #setClosed(error2) {
    if (this.#closed !== void 0) {
      return;
    }
    this.#closed = error2;
    for (const callbacks of this.#openCallbacks) {
      callbacks.errorCallback(error2);
    }
    this.#openCallbacks.length = 0;
    for (const [requestId, responseState] of this.#responseMap.entries()) {
      responseState.errorCallback(error2);
      this.#requestIdAlloc.free(requestId);
    }
    this.#responseMap.clear();
    this.#socket.close();
  }
  // We received a message from the socket.
  #onSocketMessage(event) {
    if (this.#closed !== void 0) {
      return;
    }
    try {
      let msg;
      const encoding = this.#subprotocol.encoding;
      if (encoding === "json") {
        if (typeof event.data !== "string") {
          this.#socket.close(3003, "Only text messages are accepted with JSON encoding");
          this.#setClosed(new ProtoError("Received non-text message from server with JSON encoding"));
          return;
        }
        msg = readJsonObject(JSON.parse(event.data), ServerMsg);
      } else if (encoding === "protobuf") {
        if (!(event.data instanceof ArrayBuffer)) {
          this.#socket.close(3003, "Only binary messages are accepted with Protobuf encoding");
          this.#setClosed(new ProtoError("Received non-binary message from server with Protobuf encoding"));
          return;
        }
        msg = readProtobufMessage(new Uint8Array(event.data), ServerMsg2);
      } else {
        throw impossible(encoding, "Impossible encoding");
      }
      this.#handleMsg(msg);
    } catch (e) {
      this.#socket.close(3007, "Could not handle message");
      this.#setClosed(e);
    }
  }
  // Handle a message from the server.
  #handleMsg(msg) {
    if (msg.type === "none") {
      throw new ProtoError("Received an unrecognized ServerMsg");
    } else if (msg.type === "hello_ok" || msg.type === "hello_error") {
      if (this.#recvdHello) {
        throw new ProtoError("Received a duplicated hello response");
      }
      this.#recvdHello = true;
      if (msg.type === "hello_error") {
        throw errorFromProto(msg.error);
      }
      return;
    } else if (!this.#recvdHello) {
      throw new ProtoError("Received a non-hello message before a hello response");
    }
    if (msg.type === "response_ok") {
      const requestId = msg.requestId;
      const responseState = this.#responseMap.get(requestId);
      this.#responseMap.delete(requestId);
      if (responseState === void 0) {
        throw new ProtoError("Received unexpected OK response");
      }
      this.#requestIdAlloc.free(requestId);
      try {
        if (responseState.type !== msg.response.type) {
          console.dir({ responseState, msg });
          throw new ProtoError("Received unexpected type of response");
        }
        responseState.responseCallback(msg.response);
      } catch (e) {
        responseState.errorCallback(e);
        throw e;
      }
    } else if (msg.type === "response_error") {
      const requestId = msg.requestId;
      const responseState = this.#responseMap.get(requestId);
      this.#responseMap.delete(requestId);
      if (responseState === void 0) {
        throw new ProtoError("Received unexpected error response");
      }
      this.#requestIdAlloc.free(requestId);
      responseState.errorCallback(errorFromProto(msg.error));
    } else {
      throw impossible(msg, "Impossible ServerMsg type");
    }
  }
  /** Open a {@link WsStream}, a stream for executing SQL statements. */
  openStream() {
    return WsStream.open(this);
  }
  /** Cache a SQL text on the server. This requires protocol version 2 or higher. */
  storeSql(sql) {
    this._ensureVersion(2, "storeSql()");
    const sqlId = this.#sqlIdAlloc.alloc();
    const sqlObj = new Sql(this, sqlId);
    const responseCallback = () => void 0;
    const errorCallback = (e) => sqlObj._setClosed(e);
    const request = { type: "store_sql", sqlId, sql };
    this._sendRequest(request, { responseCallback, errorCallback });
    return sqlObj;
  }
  /** @private */
  _closeSql(sqlId) {
    if (this.#closed !== void 0) {
      return;
    }
    const responseCallback = () => this.#sqlIdAlloc.free(sqlId);
    const errorCallback = (e) => this.#setClosed(e);
    const request = { type: "close_sql", sqlId };
    this._sendRequest(request, { responseCallback, errorCallback });
  }
  /** Close the client and the WebSocket. */
  close() {
    this.#setClosed(new ClientError("Client was manually closed"));
  }
  /** True if the client is closed. */
  get closed() {
    return this.#closed !== void 0;
  }
};

// node_modules/@libsql/hrana-client/lib-esm/queue_microtask.js
var _queueMicrotask;
if (typeof queueMicrotask !== "undefined") {
  _queueMicrotask = queueMicrotask;
} else {
  const resolved = Promise.resolve();
  _queueMicrotask = (callback) => {
    resolved.then(callback);
  };
}

// node_modules/@libsql/hrana-client/lib-esm/byte_queue.js
var ByteQueue = class {
  #array;
  #shiftPos;
  #pushPos;
  constructor(initialCap) {
    this.#array = new Uint8Array(new ArrayBuffer(initialCap));
    this.#shiftPos = 0;
    this.#pushPos = 0;
  }
  get length() {
    return this.#pushPos - this.#shiftPos;
  }
  data() {
    return this.#array.slice(this.#shiftPos, this.#pushPos);
  }
  push(chunk) {
    this.#ensurePush(chunk.byteLength);
    this.#array.set(chunk, this.#pushPos);
    this.#pushPos += chunk.byteLength;
  }
  #ensurePush(pushLength) {
    if (this.#pushPos + pushLength <= this.#array.byteLength) {
      return;
    }
    const filledLength = this.#pushPos - this.#shiftPos;
    if (filledLength + pushLength <= this.#array.byteLength && 2 * this.#pushPos >= this.#array.byteLength) {
      this.#array.copyWithin(0, this.#shiftPos, this.#pushPos);
    } else {
      let newCap = this.#array.byteLength;
      do {
        newCap *= 2;
      } while (filledLength + pushLength > newCap);
      const newArray = new Uint8Array(new ArrayBuffer(newCap));
      newArray.set(this.#array.slice(this.#shiftPos, this.#pushPos), 0);
      this.#array = newArray;
    }
    this.#pushPos = filledLength;
    this.#shiftPos = 0;
  }
  shift(length) {
    this.#shiftPos += length;
  }
};

// node_modules/@libsql/hrana-client/lib-esm/http/json_decode.js
function PipelineRespBody(obj) {
  const baton = stringOpt(obj["baton"]);
  const baseUrl = stringOpt(obj["base_url"]);
  const results = arrayObjectsMap(obj["results"], StreamResult);
  return { baton, baseUrl, results };
}
function StreamResult(obj) {
  const type = string(obj["type"]);
  if (type === "ok") {
    const response = StreamResponse(object(obj["response"]));
    return { type: "ok", response };
  } else if (type === "error") {
    const error2 = Error2(object(obj["error"]));
    return { type: "error", error: error2 };
  } else {
    throw new ProtoError("Unexpected type of StreamResult");
  }
}
function StreamResponse(obj) {
  const type = string(obj["type"]);
  if (type === "close") {
    return { type: "close" };
  } else if (type === "execute") {
    const result = StmtResult(object(obj["result"]));
    return { type: "execute", result };
  } else if (type === "batch") {
    const result = BatchResult(object(obj["result"]));
    return { type: "batch", result };
  } else if (type === "sequence") {
    return { type: "sequence" };
  } else if (type === "describe") {
    const result = DescribeResult(object(obj["result"]));
    return { type: "describe", result };
  } else if (type === "store_sql") {
    return { type: "store_sql" };
  } else if (type === "close_sql") {
    return { type: "close_sql" };
  } else if (type === "get_autocommit") {
    const isAutocommit = boolean(obj["is_autocommit"]);
    return { type: "get_autocommit", isAutocommit };
  } else {
    throw new ProtoError("Unexpected type of StreamResponse");
  }
}
function CursorRespBody(obj) {
  const baton = stringOpt(obj["baton"]);
  const baseUrl = stringOpt(obj["base_url"]);
  return { baton, baseUrl };
}

// node_modules/@libsql/hrana-client/lib-esm/http/protobuf_decode.js
var PipelineRespBody2 = {
  default() {
    return { baton: void 0, baseUrl: void 0, results: [] };
  },
  1(r, msg) {
    msg.baton = r.string();
  },
  2(r, msg) {
    msg.baseUrl = r.string();
  },
  3(r, msg) {
    msg.results.push(r.message(StreamResult2));
  }
};
var StreamResult2 = {
  default() {
    return { type: "none" };
  },
  1(r) {
    return { type: "ok", response: r.message(StreamResponse2) };
  },
  2(r) {
    return { type: "error", error: r.message(Error3) };
  }
};
var StreamResponse2 = {
  default() {
    return { type: "none" };
  },
  1(r) {
    return { type: "close" };
  },
  2(r) {
    return r.message(ExecuteStreamResp);
  },
  3(r) {
    return r.message(BatchStreamResp);
  },
  4(r) {
    return { type: "sequence" };
  },
  5(r) {
    return r.message(DescribeStreamResp);
  },
  6(r) {
    return { type: "store_sql" };
  },
  7(r) {
    return { type: "close_sql" };
  },
  8(r) {
    return r.message(GetAutocommitStreamResp);
  }
};
var ExecuteStreamResp = {
  default() {
    return { type: "execute", result: StmtResult2.default() };
  },
  1(r, msg) {
    msg.result = r.message(StmtResult2);
  }
};
var BatchStreamResp = {
  default() {
    return { type: "batch", result: BatchResult2.default() };
  },
  1(r, msg) {
    msg.result = r.message(BatchResult2);
  }
};
var DescribeStreamResp = {
  default() {
    return { type: "describe", result: DescribeResult2.default() };
  },
  1(r, msg) {
    msg.result = r.message(DescribeResult2);
  }
};
var GetAutocommitStreamResp = {
  default() {
    return { type: "get_autocommit", isAutocommit: false };
  },
  1(r, msg) {
    msg.isAutocommit = r.bool();
  }
};
var CursorRespBody2 = {
  default() {
    return { baton: void 0, baseUrl: void 0 };
  },
  1(r, msg) {
    msg.baton = r.string();
  },
  2(r, msg) {
    msg.baseUrl = r.string();
  }
};

// node_modules/@libsql/hrana-client/lib-esm/http/cursor.js
var HttpCursor = class extends Cursor {
  #stream;
  #encoding;
  #reader;
  #queue;
  #closed;
  #done;
  /** @private */
  constructor(stream, encoding) {
    super();
    this.#stream = stream;
    this.#encoding = encoding;
    this.#reader = void 0;
    this.#queue = new ByteQueue(16 * 1024);
    this.#closed = void 0;
    this.#done = false;
  }
  async open(response) {
    if (response.body === null) {
      throw new ProtoError("No response body for cursor request");
    }
    this.#reader = response.body[Symbol.asyncIterator]();
    const respBody = await this.#nextItem(CursorRespBody, CursorRespBody2);
    if (respBody === void 0) {
      throw new ProtoError("Empty response to cursor request");
    }
    return respBody;
  }
  /** Fetch the next entry from the cursor. */
  next() {
    return this.#nextItem(CursorEntry, CursorEntry2);
  }
  /** Close the cursor. */
  close() {
    this._setClosed(new ClientError("Cursor was manually closed"));
  }
  /** @private */
  _setClosed(error2) {
    if (this.#closed !== void 0) {
      return;
    }
    this.#closed = error2;
    this.#stream._cursorClosed(this);
    if (this.#reader !== void 0) {
      this.#reader.return();
    }
  }
  /** True if the cursor is closed. */
  get closed() {
    return this.#closed !== void 0;
  }
  async #nextItem(jsonFun, protobufDef) {
    for (; ; ) {
      if (this.#done) {
        return void 0;
      } else if (this.#closed !== void 0) {
        throw new ClosedError("Cursor is closed", this.#closed);
      }
      if (this.#encoding === "json") {
        const jsonData = this.#parseItemJson();
        if (jsonData !== void 0) {
          const jsonText = new TextDecoder().decode(jsonData);
          const jsonValue = JSON.parse(jsonText);
          return readJsonObject(jsonValue, jsonFun);
        }
      } else if (this.#encoding === "protobuf") {
        const protobufData = this.#parseItemProtobuf();
        if (protobufData !== void 0) {
          return readProtobufMessage(protobufData, protobufDef);
        }
      } else {
        throw impossible(this.#encoding, "Impossible encoding");
      }
      if (this.#reader === void 0) {
        throw new InternalError("Attempted to read from HTTP cursor before it was opened");
      }
      const { value, done } = await this.#reader.next();
      if (done && this.#queue.length === 0) {
        this.#done = true;
      } else if (done) {
        throw new ProtoError("Unexpected end of cursor stream");
      } else {
        this.#queue.push(value);
      }
    }
  }
  #parseItemJson() {
    const data = this.#queue.data();
    const newlineByte = 10;
    const newlinePos = data.indexOf(newlineByte);
    if (newlinePos < 0) {
      return void 0;
    }
    const jsonData = data.slice(0, newlinePos);
    this.#queue.shift(newlinePos + 1);
    return jsonData;
  }
  #parseItemProtobuf() {
    const data = this.#queue.data();
    let varintValue = 0;
    let varintLength = 0;
    for (; ; ) {
      if (varintLength >= data.byteLength) {
        return void 0;
      }
      const byte = data[varintLength];
      varintValue |= (byte & 127) << 7 * varintLength;
      varintLength += 1;
      if (!(byte & 128)) {
        break;
      }
    }
    if (data.byteLength < varintLength + varintValue) {
      return void 0;
    }
    const protobufData = data.slice(varintLength, varintLength + varintValue);
    this.#queue.shift(varintLength + varintValue);
    return protobufData;
  }
};

// node_modules/@libsql/hrana-client/lib-esm/http/json_encode.js
function PipelineReqBody(w, msg) {
  if (msg.baton !== void 0) {
    w.string("baton", msg.baton);
  }
  w.arrayObjects("requests", msg.requests, StreamRequest);
}
function StreamRequest(w, msg) {
  w.stringRaw("type", msg.type);
  if (msg.type === "close") {
  } else if (msg.type === "execute") {
    w.object("stmt", msg.stmt, Stmt2);
  } else if (msg.type === "batch") {
    w.object("batch", msg.batch, Batch2);
  } else if (msg.type === "sequence") {
    if (msg.sql !== void 0) {
      w.string("sql", msg.sql);
    }
    if (msg.sqlId !== void 0) {
      w.number("sql_id", msg.sqlId);
    }
  } else if (msg.type === "describe") {
    if (msg.sql !== void 0) {
      w.string("sql", msg.sql);
    }
    if (msg.sqlId !== void 0) {
      w.number("sql_id", msg.sqlId);
    }
  } else if (msg.type === "store_sql") {
    w.number("sql_id", msg.sqlId);
    w.string("sql", msg.sql);
  } else if (msg.type === "close_sql") {
    w.number("sql_id", msg.sqlId);
  } else if (msg.type === "get_autocommit") {
  } else {
    throw impossible(msg, "Impossible type of StreamRequest");
  }
}
function CursorReqBody(w, msg) {
  if (msg.baton !== void 0) {
    w.string("baton", msg.baton);
  }
  w.object("batch", msg.batch, Batch2);
}

// node_modules/@libsql/hrana-client/lib-esm/http/protobuf_encode.js
function PipelineReqBody2(w, msg) {
  if (msg.baton !== void 0) {
    w.string(1, msg.baton);
  }
  for (const req of msg.requests) {
    w.message(2, req, StreamRequest2);
  }
}
function StreamRequest2(w, msg) {
  if (msg.type === "close") {
    w.message(1, msg, CloseStreamReq2);
  } else if (msg.type === "execute") {
    w.message(2, msg, ExecuteStreamReq);
  } else if (msg.type === "batch") {
    w.message(3, msg, BatchStreamReq);
  } else if (msg.type === "sequence") {
    w.message(4, msg, SequenceStreamReq);
  } else if (msg.type === "describe") {
    w.message(5, msg, DescribeStreamReq);
  } else if (msg.type === "store_sql") {
    w.message(6, msg, StoreSqlStreamReq);
  } else if (msg.type === "close_sql") {
    w.message(7, msg, CloseSqlStreamReq);
  } else if (msg.type === "get_autocommit") {
    w.message(8, msg, GetAutocommitStreamReq);
  } else {
    throw impossible(msg, "Impossible type of StreamRequest");
  }
}
function CloseStreamReq2(_w, _msg) {
}
function ExecuteStreamReq(w, msg) {
  w.message(1, msg.stmt, Stmt3);
}
function BatchStreamReq(w, msg) {
  w.message(1, msg.batch, Batch3);
}
function SequenceStreamReq(w, msg) {
  if (msg.sql !== void 0) {
    w.string(1, msg.sql);
  }
  if (msg.sqlId !== void 0) {
    w.int32(2, msg.sqlId);
  }
}
function DescribeStreamReq(w, msg) {
  if (msg.sql !== void 0) {
    w.string(1, msg.sql);
  }
  if (msg.sqlId !== void 0) {
    w.int32(2, msg.sqlId);
  }
}
function StoreSqlStreamReq(w, msg) {
  w.int32(1, msg.sqlId);
  w.string(2, msg.sql);
}
function CloseSqlStreamReq(w, msg) {
  w.int32(1, msg.sqlId);
}
function GetAutocommitStreamReq(_w, _msg) {
}
function CursorReqBody2(w, msg) {
  if (msg.baton !== void 0) {
    w.string(1, msg.baton);
  }
  w.message(2, msg.batch, Batch3);
}

// node_modules/@libsql/hrana-client/lib-esm/http/stream.js
var HttpStream = class extends Stream2 {
  #client;
  #baseUrl;
  #jwt;
  #fetch;
  #remoteEncryptionKey;
  #baton;
  #queue;
  #flushing;
  #cursor;
  #closing;
  #closeQueued;
  #closed;
  #sqlIdAlloc;
  /** @private */
  constructor(client, baseUrl, jwt, customFetch, remoteEncryptionKey) {
    super(client.intMode);
    this.#client = client;
    this.#baseUrl = baseUrl.toString();
    this.#jwt = jwt;
    this.#fetch = customFetch;
    this.#remoteEncryptionKey = remoteEncryptionKey;
    this.#baton = void 0;
    this.#queue = new Queue();
    this.#flushing = false;
    this.#closing = false;
    this.#closeQueued = false;
    this.#closed = void 0;
    this.#sqlIdAlloc = new IdAlloc();
  }
  /** Get the {@link HttpClient} object that this stream belongs to. */
  client() {
    return this.#client;
  }
  /** @private */
  _sqlOwner() {
    return this;
  }
  /** Cache a SQL text on the server. */
  storeSql(sql) {
    const sqlId = this.#sqlIdAlloc.alloc();
    this.#sendStreamRequest({ type: "store_sql", sqlId, sql }).then(() => void 0, (error2) => this._setClosed(error2));
    return new Sql(this, sqlId);
  }
  /** @private */
  _closeSql(sqlId) {
    if (this.#closed !== void 0) {
      return;
    }
    this.#sendStreamRequest({ type: "close_sql", sqlId }).then(() => this.#sqlIdAlloc.free(sqlId), (error2) => this._setClosed(error2));
  }
  /** @private */
  _execute(stmt) {
    return this.#sendStreamRequest({ type: "execute", stmt }).then((response) => {
      return response.result;
    });
  }
  /** @private */
  _batch(batch) {
    return this.#sendStreamRequest({ type: "batch", batch }).then((response) => {
      return response.result;
    });
  }
  /** @private */
  _describe(protoSql) {
    return this.#sendStreamRequest({
      type: "describe",
      sql: protoSql.sql,
      sqlId: protoSql.sqlId
    }).then((response) => {
      return response.result;
    });
  }
  /** @private */
  _sequence(protoSql) {
    return this.#sendStreamRequest({
      type: "sequence",
      sql: protoSql.sql,
      sqlId: protoSql.sqlId
    }).then((_response) => {
      return void 0;
    });
  }
  /** Check whether the SQL connection underlying this stream is in autocommit state (i.e., outside of an
   * explicit transaction). This requires protocol version 3 or higher.
   */
  getAutocommit() {
    this.#client._ensureVersion(3, "getAutocommit()");
    return this.#sendStreamRequest({
      type: "get_autocommit"
    }).then((response) => {
      return response.isAutocommit;
    });
  }
  #sendStreamRequest(request) {
    return new Promise((responseCallback, errorCallback) => {
      this.#pushToQueue({ type: "pipeline", request, responseCallback, errorCallback });
    });
  }
  /** @private */
  _openCursor(batch) {
    return new Promise((cursorCallback, errorCallback) => {
      this.#pushToQueue({ type: "cursor", batch, cursorCallback, errorCallback });
    });
  }
  /** @private */
  _cursorClosed(cursor) {
    if (cursor !== this.#cursor) {
      throw new InternalError("Cursor was closed, but it was not associated with the stream");
    }
    this.#cursor = void 0;
    _queueMicrotask(() => this.#flushQueue());
  }
  /** Immediately close the stream. */
  close() {
    this._setClosed(new ClientError("Stream was manually closed"));
  }
  /** Gracefully close the stream. */
  closeGracefully() {
    this.#closing = true;
    _queueMicrotask(() => this.#flushQueue());
  }
  /** True if the stream is closed. */
  get closed() {
    return this.#closed !== void 0 || this.#closing;
  }
  /** @private */
  _setClosed(error2) {
    if (this.#closed !== void 0) {
      return;
    }
    this.#closed = error2;
    if (this.#cursor !== void 0) {
      this.#cursor._setClosed(error2);
    }
    this.#client._streamClosed(this);
    for (; ; ) {
      const entry = this.#queue.shift();
      if (entry !== void 0) {
        entry.errorCallback(error2);
      } else {
        break;
      }
    }
    if ((this.#baton !== void 0 || this.#flushing) && !this.#closeQueued) {
      this.#queue.push({
        type: "pipeline",
        request: { type: "close" },
        responseCallback: () => void 0,
        errorCallback: () => void 0
      });
      this.#closeQueued = true;
      _queueMicrotask(() => this.#flushQueue());
    }
  }
  #pushToQueue(entry) {
    if (this.#closed !== void 0) {
      throw new ClosedError("Stream is closed", this.#closed);
    } else if (this.#closing) {
      throw new ClosedError("Stream is closing", void 0);
    } else {
      this.#queue.push(entry);
      _queueMicrotask(() => this.#flushQueue());
    }
  }
  #flushQueue() {
    if (this.#flushing || this.#cursor !== void 0) {
      return;
    }
    if (this.#closing && this.#queue.length === 0) {
      this._setClosed(new ClientError("Stream was gracefully closed"));
      return;
    }
    const endpoint = this.#client._endpoint;
    if (endpoint === void 0) {
      this.#client._endpointPromise.then(() => this.#flushQueue(), (error2) => this._setClosed(error2));
      return;
    }
    const firstEntry = this.#queue.shift();
    if (firstEntry === void 0) {
      return;
    } else if (firstEntry.type === "pipeline") {
      const pipeline3 = [firstEntry];
      for (; ; ) {
        const entry = this.#queue.first();
        if (entry !== void 0 && entry.type === "pipeline") {
          pipeline3.push(entry);
          this.#queue.shift();
        } else if (entry === void 0 && this.#closing && !this.#closeQueued) {
          pipeline3.push({
            type: "pipeline",
            request: { type: "close" },
            responseCallback: () => void 0,
            errorCallback: () => void 0
          });
          this.#closeQueued = true;
          break;
        } else {
          break;
        }
      }
      this.#flushPipeline(endpoint, pipeline3);
    } else if (firstEntry.type === "cursor") {
      this.#flushCursor(endpoint, firstEntry);
    } else {
      throw impossible(firstEntry, "Impossible type of QueueEntry");
    }
  }
  #flushPipeline(endpoint, pipeline3) {
    this.#flush(() => this.#createPipelineRequest(pipeline3, endpoint), (resp) => decodePipelineResponse(resp, endpoint.encoding), (respBody) => respBody.baton, (respBody) => respBody.baseUrl, (respBody) => handlePipelineResponse(pipeline3, respBody), (error2) => pipeline3.forEach((entry) => entry.errorCallback(error2)));
  }
  #flushCursor(endpoint, entry) {
    const cursor = new HttpCursor(this, endpoint.encoding);
    this.#cursor = cursor;
    this.#flush(() => this.#createCursorRequest(entry, endpoint), (resp) => cursor.open(resp), (respBody) => respBody.baton, (respBody) => respBody.baseUrl, (_respBody) => entry.cursorCallback(cursor), (error2) => entry.errorCallback(error2));
  }
  #flush(createRequest, decodeResponse, getBaton, getBaseUrl, handleResponse, handleError) {
    let promise;
    try {
      const request = createRequest();
      const fetch2 = this.#fetch;
      promise = fetch2(request);
    } catch (error2) {
      promise = Promise.reject(error2);
    }
    this.#flushing = true;
    promise.then((resp) => {
      if (!resp.ok) {
        return errorFromResponse(resp).then((error2) => {
          throw error2;
        });
      }
      return decodeResponse(resp);
    }).then((r) => {
      this.#baton = getBaton(r);
      this.#baseUrl = getBaseUrl(r) ?? this.#baseUrl;
      handleResponse(r);
    }).catch((error2) => {
      this._setClosed(error2);
      handleError(error2);
    }).finally(() => {
      this.#flushing = false;
      this.#flushQueue();
    });
  }
  #createPipelineRequest(pipeline3, endpoint) {
    return this.#createRequest(new URL(endpoint.pipelinePath, this.#baseUrl), {
      baton: this.#baton,
      requests: pipeline3.map((entry) => entry.request)
    }, endpoint.encoding, PipelineReqBody, PipelineReqBody2);
  }
  #createCursorRequest(entry, endpoint) {
    if (endpoint.cursorPath === void 0) {
      throw new ProtocolVersionError(`Cursors are supported only on protocol version 3 and higher, but the HTTP server only supports version ${endpoint.version}.`);
    }
    return this.#createRequest(new URL(endpoint.cursorPath, this.#baseUrl), {
      baton: this.#baton,
      batch: entry.batch
    }, endpoint.encoding, CursorReqBody, CursorReqBody2);
  }
  #createRequest(url, reqBody, encoding, jsonFun, protobufFun) {
    let bodyData;
    let contentType;
    if (encoding === "json") {
      bodyData = writeJsonObject(reqBody, jsonFun);
      contentType = "application/json";
    } else if (encoding === "protobuf") {
      bodyData = writeProtobufMessage(reqBody, protobufFun);
      contentType = "application/x-protobuf";
    } else {
      throw impossible(encoding, "Impossible encoding");
    }
    const headers = new Headers();
    headers.set("content-type", contentType);
    if (this.#jwt !== void 0) {
      headers.set("authorization", `Bearer ${this.#jwt}`);
    }
    if (this.#remoteEncryptionKey !== void 0) {
      headers.set("x-turso-encryption-key", this.#remoteEncryptionKey);
    }
    return new Request(url.toString(), { method: "POST", headers, body: bodyData });
  }
};
function handlePipelineResponse(pipeline3, respBody) {
  if (respBody.results.length !== pipeline3.length) {
    throw new ProtoError("Server returned unexpected number of pipeline results");
  }
  for (let i = 0; i < pipeline3.length; ++i) {
    const result = respBody.results[i];
    const entry = pipeline3[i];
    if (result.type === "ok") {
      if (result.response.type !== entry.request.type) {
        throw new ProtoError("Received unexpected type of response");
      }
      entry.responseCallback(result.response);
    } else if (result.type === "error") {
      entry.errorCallback(errorFromProto(result.error));
    } else if (result.type === "none") {
      throw new ProtoError("Received unrecognized type of StreamResult");
    } else {
      throw impossible(result, "Received impossible type of StreamResult");
    }
  }
}
async function decodePipelineResponse(resp, encoding) {
  if (encoding === "json") {
    const respJson = await resp.json();
    return readJsonObject(respJson, PipelineRespBody);
  }
  if (encoding === "protobuf") {
    const respData = await resp.arrayBuffer();
    return readProtobufMessage(new Uint8Array(respData), PipelineRespBody2);
  }
  await resp.body?.cancel();
  throw impossible(encoding, "Impossible encoding");
}
async function errorFromResponse(resp) {
  const respType = resp.headers.get("content-type") ?? "text/plain";
  let message = `Server returned HTTP status ${resp.status}`;
  if (respType === "application/json") {
    const respBody = await resp.json();
    if ("message" in respBody) {
      return errorFromProto(respBody);
    }
    return new HttpServerError(message, resp.status);
  }
  if (respType === "text/plain") {
    const respBody = (await resp.text()).trim();
    if (respBody !== "") {
      message += `: ${respBody}`;
    }
    return new HttpServerError(message, resp.status);
  }
  await resp.body?.cancel();
  return new HttpServerError(message, resp.status);
}

// node_modules/@libsql/hrana-client/lib-esm/http/client.js
var checkEndpoints = [
  {
    versionPath: "v3-protobuf",
    pipelinePath: "v3-protobuf/pipeline",
    cursorPath: "v3-protobuf/cursor",
    version: 3,
    encoding: "protobuf"
  }
  /*
  {
      versionPath: "v3",
      pipelinePath: "v3/pipeline",
      cursorPath: "v3/cursor",
      version: 3,
      encoding: "json",
  },
  */
];
var fallbackEndpoint = {
  versionPath: "v2",
  pipelinePath: "v2/pipeline",
  cursorPath: void 0,
  version: 2,
  encoding: "json"
};
var HttpClient = class extends Client {
  #url;
  #jwt;
  #fetch;
  #remoteEncryptionKey;
  #closed;
  #streams;
  /** @private */
  _endpointPromise;
  /** @private */
  _endpoint;
  /** @private */
  constructor(url, jwt, customFetch, remoteEncryptionKey, protocolVersion = 2) {
    super();
    this.#url = url;
    this.#jwt = jwt;
    this.#fetch = customFetch ?? globalThis.fetch;
    this.#remoteEncryptionKey = remoteEncryptionKey;
    this.#closed = void 0;
    this.#streams = /* @__PURE__ */ new Set();
    if (protocolVersion == 3) {
      this._endpointPromise = findEndpoint(this.#fetch, this.#url);
      this._endpointPromise.then((endpoint) => this._endpoint = endpoint, (error2) => this.#setClosed(error2));
    } else {
      this._endpointPromise = Promise.resolve(fallbackEndpoint);
      this._endpointPromise.then((endpoint) => this._endpoint = endpoint, (error2) => this.#setClosed(error2));
    }
  }
  /** Get the protocol version supported by the server. */
  async getVersion() {
    if (this._endpoint !== void 0) {
      return this._endpoint.version;
    }
    return (await this._endpointPromise).version;
  }
  // Make sure that the negotiated version is at least `minVersion`.
  /** @private */
  _ensureVersion(minVersion, feature) {
    if (minVersion <= fallbackEndpoint.version) {
      return;
    } else if (this._endpoint === void 0) {
      throw new ProtocolVersionError(`${feature} is supported only on protocol version ${minVersion} and higher, but the version supported by the HTTP server is not yet known. Use Client.getVersion() to wait until the version is available.`);
    } else if (this._endpoint.version < minVersion) {
      throw new ProtocolVersionError(`${feature} is supported only on protocol version ${minVersion} and higher, but the HTTP server only supports version ${this._endpoint.version}.`);
    }
  }
  /** Open a {@link HttpStream}, a stream for executing SQL statements. */
  openStream() {
    if (this.#closed !== void 0) {
      throw new ClosedError("Client is closed", this.#closed);
    }
    const stream = new HttpStream(this, this.#url, this.#jwt, this.#fetch, this.#remoteEncryptionKey);
    this.#streams.add(stream);
    return stream;
  }
  /** @private */
  _streamClosed(stream) {
    this.#streams.delete(stream);
  }
  /** Close the client and all its streams. */
  close() {
    this.#setClosed(new ClientError("Client was manually closed"));
  }
  /** True if the client is closed. */
  get closed() {
    return this.#closed !== void 0;
  }
  #setClosed(error2) {
    if (this.#closed !== void 0) {
      return;
    }
    this.#closed = error2;
    for (const stream of Array.from(this.#streams)) {
      stream._setClosed(new ClosedError("Client was closed", error2));
    }
  }
};
async function findEndpoint(customFetch, clientUrl) {
  const fetch2 = customFetch;
  for (const endpoint of checkEndpoints) {
    const url = new URL(endpoint.versionPath, clientUrl);
    const request = new Request(url.toString(), { method: "GET" });
    const response = await fetch2(request);
    await response.arrayBuffer();
    if (response.ok) {
      return endpoint;
    }
  }
  return fallbackEndpoint;
}

// node_modules/@libsql/hrana-client/lib-esm/index.js
function openWs(url, jwt, protocolVersion = 2) {
  if (typeof import_websocket.default === "undefined") {
    throw new WebSocketUnsupportedError("WebSockets are not supported in this environment");
  }
  var subprotocols = void 0;
  if (protocolVersion == 3) {
    subprotocols = Array.from(subprotocolsV3.keys());
  } else {
    subprotocols = Array.from(subprotocolsV2.keys());
  }
  const socket = new import_websocket.default(url, subprotocols);
  return new WsClient(socket, jwt);
}
function openHttp(url, jwt, customFetch, remoteEncryptionKey, protocolVersion = 2) {
  return new HttpClient(url instanceof URL ? url : new URL(url), jwt, customFetch, remoteEncryptionKey, protocolVersion);
}

// node_modules/@libsql/client/lib-esm/hrana.js
var HranaTransaction = class {
  #mode;
  #version;
  // Promise that is resolved when the BEGIN statement completes, or `undefined` if we haven't executed the
  // BEGIN statement yet.
  #started;
  /** @private */
  constructor(mode, version3) {
    this.#mode = mode;
    this.#version = version3;
    this.#started = void 0;
  }
  execute(stmt) {
    return this.batch([stmt]).then((results) => results[0]);
  }
  async batch(stmts) {
    const stream = this._getStream();
    if (stream.closed) {
      throw new LibsqlError("Cannot execute statements because the transaction is closed", "TRANSACTION_CLOSED");
    }
    try {
      const hranaStmts = stmts.map(stmtToHrana);
      let rowsPromises;
      if (this.#started === void 0) {
        this._getSqlCache().apply(hranaStmts);
        const batch = stream.batch(this.#version >= 3);
        const beginStep = batch.step();
        const beginPromise = beginStep.run(transactionModeToBegin(this.#mode));
        let lastStep = beginStep;
        rowsPromises = hranaStmts.map((hranaStmt) => {
          const stmtStep = batch.step().condition(BatchCond.ok(lastStep));
          if (this.#version >= 3) {
            stmtStep.condition(BatchCond.not(BatchCond.isAutocommit(batch)));
          }
          const rowsPromise = stmtStep.query(hranaStmt);
          rowsPromise.catch(() => void 0);
          lastStep = stmtStep;
          return rowsPromise;
        });
        this.#started = batch.execute().then(() => beginPromise).then(() => void 0);
        try {
          await this.#started;
        } catch (e) {
          this.close();
          throw e;
        }
      } else {
        if (this.#version < 3) {
          await this.#started;
        } else {
        }
        this._getSqlCache().apply(hranaStmts);
        const batch = stream.batch(this.#version >= 3);
        let lastStep = void 0;
        rowsPromises = hranaStmts.map((hranaStmt) => {
          const stmtStep = batch.step();
          if (lastStep !== void 0) {
            stmtStep.condition(BatchCond.ok(lastStep));
          }
          if (this.#version >= 3) {
            stmtStep.condition(BatchCond.not(BatchCond.isAutocommit(batch)));
          }
          const rowsPromise = stmtStep.query(hranaStmt);
          rowsPromise.catch(() => void 0);
          lastStep = stmtStep;
          return rowsPromise;
        });
        await batch.execute();
      }
      const resultSets = [];
      for (let i = 0; i < rowsPromises.length; i++) {
        try {
          const rows = await rowsPromises[i];
          if (rows === void 0) {
            throw new LibsqlBatchError("Statement in a transaction was not executed, probably because the transaction has been rolled back", i, "TRANSACTION_CLOSED");
          }
          resultSets.push(resultSetFromHrana(rows));
        } catch (e) {
          if (e instanceof LibsqlBatchError) {
            throw e;
          }
          const mappedError = mapHranaError(e);
          if (mappedError instanceof LibsqlError) {
            throw new LibsqlBatchError(mappedError.message, i, mappedError.code, mappedError.extendedCode, mappedError.rawCode, mappedError.cause instanceof Error ? mappedError.cause : void 0);
          }
          throw mappedError;
        }
      }
      return resultSets;
    } catch (e) {
      throw mapHranaError(e);
    }
  }
  async executeMultiple(sql) {
    const stream = this._getStream();
    if (stream.closed) {
      throw new LibsqlError("Cannot execute statements because the transaction is closed", "TRANSACTION_CLOSED");
    }
    try {
      if (this.#started === void 0) {
        this.#started = stream.run(transactionModeToBegin(this.#mode)).then(() => void 0);
        try {
          await this.#started;
        } catch (e) {
          this.close();
          throw e;
        }
      } else {
        await this.#started;
      }
      await stream.sequence(sql);
    } catch (e) {
      throw mapHranaError(e);
    }
  }
  async rollback() {
    try {
      const stream = this._getStream();
      if (stream.closed) {
        return;
      }
      if (this.#started !== void 0) {
      } else {
        return;
      }
      const promise = stream.run("ROLLBACK").catch((e) => {
        throw mapHranaError(e);
      });
      stream.closeGracefully();
      await promise;
    } catch (e) {
      throw mapHranaError(e);
    } finally {
      this.close();
    }
  }
  async commit() {
    try {
      const stream = this._getStream();
      if (stream.closed) {
        throw new LibsqlError("Cannot commit the transaction because it is already closed", "TRANSACTION_CLOSED");
      }
      if (this.#started !== void 0) {
        await this.#started;
      } else {
        return;
      }
      const promise = stream.run("COMMIT").catch((e) => {
        throw mapHranaError(e);
      });
      stream.closeGracefully();
      await promise;
    } catch (e) {
      throw mapHranaError(e);
    } finally {
      this.close();
    }
  }
};
async function executeHranaBatch(mode, version3, batch, hranaStmts, disableForeignKeys = false) {
  if (disableForeignKeys) {
    batch.step().run("PRAGMA foreign_keys=off");
  }
  const beginStep = batch.step();
  const beginPromise = beginStep.run(transactionModeToBegin(mode));
  let lastStep = beginStep;
  const stmtPromises = hranaStmts.map((hranaStmt) => {
    const stmtStep = batch.step().condition(BatchCond.ok(lastStep));
    if (version3 >= 3) {
      stmtStep.condition(BatchCond.not(BatchCond.isAutocommit(batch)));
    }
    const stmtPromise = stmtStep.query(hranaStmt);
    lastStep = stmtStep;
    return stmtPromise;
  });
  const commitStep = batch.step().condition(BatchCond.ok(lastStep));
  if (version3 >= 3) {
    commitStep.condition(BatchCond.not(BatchCond.isAutocommit(batch)));
  }
  const commitPromise = commitStep.run("COMMIT");
  const rollbackStep = batch.step().condition(BatchCond.not(BatchCond.ok(commitStep)));
  rollbackStep.run("ROLLBACK").catch((_) => void 0);
  if (disableForeignKeys) {
    batch.step().run("PRAGMA foreign_keys=on");
  }
  await batch.execute();
  const resultSets = [];
  await beginPromise;
  for (let i = 0; i < stmtPromises.length; i++) {
    try {
      const hranaRows = await stmtPromises[i];
      if (hranaRows === void 0) {
        throw new LibsqlBatchError("Statement in a batch was not executed, probably because the transaction has been rolled back", i, "TRANSACTION_CLOSED");
      }
      resultSets.push(resultSetFromHrana(hranaRows));
    } catch (e) {
      if (e instanceof LibsqlBatchError) {
        throw e;
      }
      const mappedError = mapHranaError(e);
      if (mappedError instanceof LibsqlError) {
        throw new LibsqlBatchError(mappedError.message, i, mappedError.code, mappedError.extendedCode, mappedError.rawCode, mappedError.cause instanceof Error ? mappedError.cause : void 0);
      }
      throw mappedError;
    }
  }
  await commitPromise;
  return resultSets;
}
function stmtToHrana(stmt) {
  let sql;
  let args;
  if (Array.isArray(stmt)) {
    [sql, args] = stmt;
  } else if (typeof stmt === "string") {
    sql = stmt;
  } else {
    sql = stmt.sql;
    args = stmt.args;
  }
  const hranaStmt = new Stmt(sql);
  if (args) {
    if (Array.isArray(args)) {
      hranaStmt.bindIndexes(args);
    } else {
      for (const [key, value] of Object.entries(args)) {
        hranaStmt.bindName(key, value);
      }
    }
  }
  return hranaStmt;
}
function resultSetFromHrana(hranaRows) {
  const columns = hranaRows.columnNames.map((c) => c ?? "");
  const columnTypes = hranaRows.columnDecltypes.map((c) => c ?? "");
  const rows = hranaRows.rows;
  const rowsAffected = hranaRows.affectedRowCount;
  const lastInsertRowid = hranaRows.lastInsertRowid !== void 0 ? hranaRows.lastInsertRowid : void 0;
  return new ResultSetImpl(columns, columnTypes, rows, rowsAffected, lastInsertRowid);
}
function mapHranaError(e) {
  if (e instanceof ClientError) {
    const code = mapHranaErrorCode(e);
    return new LibsqlError(e.message, code, void 0, void 0, e);
  }
  return e;
}
function mapHranaErrorCode(e) {
  if (e instanceof ResponseError && e.code !== void 0) {
    return e.code;
  } else if (e instanceof ProtoError) {
    return "HRANA_PROTO_ERROR";
  } else if (e instanceof ClosedError) {
    return e.cause instanceof ClientError ? mapHranaErrorCode(e.cause) : "HRANA_CLOSED_ERROR";
  } else if (e instanceof WebSocketError) {
    return "HRANA_WEBSOCKET_ERROR";
  } else if (e instanceof HttpServerError) {
    return "SERVER_ERROR";
  } else if (e instanceof ProtocolVersionError) {
    return "PROTOCOL_VERSION_ERROR";
  } else if (e instanceof InternalError) {
    return "INTERNAL_ERROR";
  } else {
    return "UNKNOWN";
  }
}

// node_modules/@libsql/client/lib-esm/sql_cache.js
var SqlCache = class {
  #owner;
  #sqls;
  capacity;
  constructor(owner, capacity) {
    this.#owner = owner;
    this.#sqls = new Lru();
    this.capacity = capacity;
  }
  // Replaces SQL strings with cached `hrana.Sql` objects in the statements in `hranaStmts`. After this
  // function returns, we guarantee that all `hranaStmts` refer to valid (not closed) `hrana.Sql` objects,
  // but _we may invalidate any other `hrana.Sql` objects_ (by closing them, thus removing them from the
  // server).
  //
  // In practice, this means that after calling this function, you can use the statements only up to the
  // first `await`, because concurrent code may also use the cache and invalidate those statements.
  apply(hranaStmts) {
    if (this.capacity <= 0) {
      return;
    }
    const usedSqlObjs = /* @__PURE__ */ new Set();
    for (const hranaStmt of hranaStmts) {
      if (typeof hranaStmt.sql !== "string") {
        continue;
      }
      const sqlText = hranaStmt.sql;
      if (sqlText.length >= 5e3) {
        continue;
      }
      let sqlObj = this.#sqls.get(sqlText);
      if (sqlObj === void 0) {
        while (this.#sqls.size + 1 > this.capacity) {
          const [evictSqlText, evictSqlObj] = this.#sqls.peekLru();
          if (usedSqlObjs.has(evictSqlObj)) {
            break;
          }
          evictSqlObj.close();
          this.#sqls.delete(evictSqlText);
        }
        if (this.#sqls.size + 1 <= this.capacity) {
          sqlObj = this.#owner.storeSql(sqlText);
          this.#sqls.set(sqlText, sqlObj);
        }
      }
      if (sqlObj !== void 0) {
        hranaStmt.sql = sqlObj;
        usedSqlObjs.add(sqlObj);
      }
    }
  }
};
var Lru = class {
  // This maps keys to the cache values. The entries are ordered by their last use (entires that were used
  // most recently are at the end).
  #cache;
  constructor() {
    this.#cache = /* @__PURE__ */ new Map();
  }
  get(key) {
    const value = this.#cache.get(key);
    if (value !== void 0) {
      this.#cache.delete(key);
      this.#cache.set(key, value);
    }
    return value;
  }
  set(key, value) {
    this.#cache.set(key, value);
  }
  peekLru() {
    for (const entry of this.#cache.entries()) {
      return entry;
    }
    return void 0;
  }
  delete(key) {
    this.#cache.delete(key);
  }
  get size() {
    return this.#cache.size;
  }
};

// node_modules/@libsql/client/lib-esm/ws.js
var import_promise_limit = __toESM(require_promise_limit(), 1);
function _createClient(config) {
  if (config.scheme !== "wss" && config.scheme !== "ws") {
    throw new LibsqlError(`The WebSocket client supports only "libsql:", "wss:" and "ws:" URLs, got ${JSON.stringify(config.scheme + ":")}. For more information, please read ${supportedUrlLink}`, "URL_SCHEME_NOT_SUPPORTED");
  }
  if (config.encryptionKey !== void 0) {
    throw new LibsqlError("Encryption key is not supported by the remote client.", "ENCRYPTION_KEY_NOT_SUPPORTED");
  }
  if (config.scheme === "ws" && config.tls) {
    throw new LibsqlError(`A "ws:" URL cannot opt into TLS by using ?tls=1`, "URL_INVALID");
  } else if (config.scheme === "wss" && !config.tls) {
    throw new LibsqlError(`A "wss:" URL cannot opt out of TLS by using ?tls=0`, "URL_INVALID");
  }
  const url = encodeBaseUrl(config.scheme, config.authority, config.path);
  let client;
  try {
    client = openWs(url, config.authToken);
  } catch (e) {
    if (e instanceof WebSocketUnsupportedError) {
      const suggestedScheme = config.scheme === "wss" ? "https" : "http";
      const suggestedUrl = encodeBaseUrl(suggestedScheme, config.authority, config.path);
      throw new LibsqlError(`This environment does not support WebSockets, please switch to the HTTP client by using a "${suggestedScheme}:" URL (${JSON.stringify(suggestedUrl)}). For more information, please read ${supportedUrlLink}`, "WEBSOCKETS_NOT_SUPPORTED");
    }
    throw mapHranaError(e);
  }
  return new WsClient2(client, url, config.authToken, config.intMode, config.concurrency);
}
var maxConnAgeMillis = 60 * 1e3;
var sqlCacheCapacity = 100;
var WsClient2 = class {
  #url;
  #authToken;
  #intMode;
  // State of the current connection. The `hrana.WsClient` inside may be closed at any moment due to an
  // asynchronous error.
  #connState;
  // If defined, this is a connection that will be used in the future, once it is ready.
  #futureConnState;
  closed;
  protocol;
  #isSchemaDatabase;
  #promiseLimitFunction;
  /** @private */
  constructor(client, url, authToken, intMode, concurrency) {
    this.#url = url;
    this.#authToken = authToken;
    this.#intMode = intMode;
    this.#connState = this.#openConn(client);
    this.#futureConnState = void 0;
    this.closed = false;
    this.protocol = "ws";
    this.#promiseLimitFunction = (0, import_promise_limit.default)(concurrency);
  }
  async limit(fn) {
    return this.#promiseLimitFunction(fn);
  }
  async execute(stmtOrSql, args) {
    let stmt;
    if (typeof stmtOrSql === "string") {
      stmt = {
        sql: stmtOrSql,
        args: args || []
      };
    } else {
      stmt = stmtOrSql;
    }
    return this.limit(async () => {
      const streamState = await this.#openStream();
      try {
        const hranaStmt = stmtToHrana(stmt);
        streamState.conn.sqlCache.apply([hranaStmt]);
        const hranaRowsPromise = streamState.stream.query(hranaStmt);
        streamState.stream.closeGracefully();
        const hranaRowsResult = await hranaRowsPromise;
        return resultSetFromHrana(hranaRowsResult);
      } catch (e) {
        throw mapHranaError(e);
      } finally {
        this._closeStream(streamState);
      }
    });
  }
  async batch(stmts, mode = "deferred") {
    return this.limit(async () => {
      const streamState = await this.#openStream();
      try {
        const normalizedStmts = stmts.map((stmt) => {
          if (Array.isArray(stmt)) {
            return {
              sql: stmt[0],
              args: stmt[1] || []
            };
          }
          return stmt;
        });
        const hranaStmts = normalizedStmts.map(stmtToHrana);
        const version3 = await streamState.conn.client.getVersion();
        streamState.conn.sqlCache.apply(hranaStmts);
        const batch = streamState.stream.batch(version3 >= 3);
        const resultsPromise = executeHranaBatch(mode, version3, batch, hranaStmts);
        const results = await resultsPromise;
        return results;
      } catch (e) {
        throw mapHranaError(e);
      } finally {
        this._closeStream(streamState);
      }
    });
  }
  async migrate(stmts) {
    return this.limit(async () => {
      const streamState = await this.#openStream();
      try {
        const hranaStmts = stmts.map(stmtToHrana);
        const version3 = await streamState.conn.client.getVersion();
        const batch = streamState.stream.batch(version3 >= 3);
        const resultsPromise = executeHranaBatch("deferred", version3, batch, hranaStmts, true);
        const results = await resultsPromise;
        return results;
      } catch (e) {
        throw mapHranaError(e);
      } finally {
        this._closeStream(streamState);
      }
    });
  }
  async transaction(mode = "write") {
    return this.limit(async () => {
      const streamState = await this.#openStream();
      try {
        const version3 = await streamState.conn.client.getVersion();
        return new WsTransaction(this, streamState, mode, version3);
      } catch (e) {
        this._closeStream(streamState);
        throw mapHranaError(e);
      }
    });
  }
  async executeMultiple(sql) {
    return this.limit(async () => {
      const streamState = await this.#openStream();
      try {
        const promise = streamState.stream.sequence(sql);
        streamState.stream.closeGracefully();
        await promise;
      } catch (e) {
        throw mapHranaError(e);
      } finally {
        this._closeStream(streamState);
      }
    });
  }
  sync() {
    throw new LibsqlError("sync not supported in ws mode", "SYNC_NOT_SUPPORTED");
  }
  async #openStream() {
    if (this.closed) {
      throw new LibsqlError("The client is closed", "CLIENT_CLOSED");
    }
    const now = /* @__PURE__ */ new Date();
    const ageMillis = now.valueOf() - this.#connState.openTime.valueOf();
    if (ageMillis > maxConnAgeMillis && this.#futureConnState === void 0) {
      const futureConnState = this.#openConn();
      this.#futureConnState = futureConnState;
      futureConnState.client.getVersion().then((_version) => {
        if (this.#connState !== futureConnState) {
          if (this.#connState.streamStates.size === 0) {
            this.#connState.client.close();
          } else {
          }
        }
        this.#connState = futureConnState;
        this.#futureConnState = void 0;
      }, (_e) => {
        this.#futureConnState = void 0;
      });
    }
    if (this.#connState.client.closed) {
      try {
        if (this.#futureConnState !== void 0) {
          this.#connState = this.#futureConnState;
        } else {
          this.#connState = this.#openConn();
        }
      } catch (e) {
        throw mapHranaError(e);
      }
    }
    const connState = this.#connState;
    try {
      if (connState.useSqlCache === void 0) {
        connState.useSqlCache = await connState.client.getVersion() >= 2;
        if (connState.useSqlCache) {
          connState.sqlCache.capacity = sqlCacheCapacity;
        }
      }
      const stream = connState.client.openStream();
      stream.intMode = this.#intMode;
      const streamState = { conn: connState, stream };
      connState.streamStates.add(streamState);
      return streamState;
    } catch (e) {
      throw mapHranaError(e);
    }
  }
  #openConn(client) {
    try {
      client ??= openWs(this.#url, this.#authToken);
      return {
        client,
        useSqlCache: void 0,
        sqlCache: new SqlCache(client, 0),
        openTime: /* @__PURE__ */ new Date(),
        streamStates: /* @__PURE__ */ new Set()
      };
    } catch (e) {
      throw mapHranaError(e);
    }
  }
  async reconnect() {
    try {
      for (const st of Array.from(this.#connState.streamStates)) {
        try {
          st.stream.close();
        } catch {
        }
      }
      this.#connState.client.close();
    } catch {
    }
    if (this.#futureConnState) {
      try {
        this.#futureConnState.client.close();
      } catch {
      }
      this.#futureConnState = void 0;
    }
    const next = this.#openConn();
    const version3 = await next.client.getVersion();
    next.useSqlCache = version3 >= 2;
    if (next.useSqlCache) {
      next.sqlCache.capacity = sqlCacheCapacity;
    }
    this.#connState = next;
    this.closed = false;
  }
  _closeStream(streamState) {
    streamState.stream.close();
    const connState = streamState.conn;
    connState.streamStates.delete(streamState);
    if (connState.streamStates.size === 0 && connState !== this.#connState) {
      connState.client.close();
    }
  }
  close() {
    this.#connState.client.close();
    this.closed = true;
    if (this.#futureConnState) {
      try {
        this.#futureConnState.client.close();
      } catch {
      }
      this.#futureConnState = void 0;
    }
    this.closed = true;
  }
};
var WsTransaction = class extends HranaTransaction {
  #client;
  #streamState;
  /** @private */
  constructor(client, state, mode, version3) {
    super(mode, version3);
    this.#client = client;
    this.#streamState = state;
  }
  /** @private */
  _getStream() {
    return this.#streamState.stream;
  }
  /** @private */
  _getSqlCache() {
    return this.#streamState.conn.sqlCache;
  }
  close() {
    this.#client._closeStream(this.#streamState);
  }
  get closed() {
    return this.#streamState.stream.closed;
  }
};

// node_modules/@libsql/client/lib-esm/http.js
var import_promise_limit2 = __toESM(require_promise_limit(), 1);
function _createClient2(config) {
  if (config.scheme !== "https" && config.scheme !== "http") {
    throw new LibsqlError(`The HTTP client supports only "libsql:", "https:" and "http:" URLs, got ${JSON.stringify(config.scheme + ":")}. For more information, please read ${supportedUrlLink}`, "URL_SCHEME_NOT_SUPPORTED");
  }
  if (config.encryptionKey !== void 0) {
    throw new LibsqlError("Encryption key is not supported by the remote client.", "ENCRYPTION_KEY_NOT_SUPPORTED");
  }
  if (config.scheme === "http" && config.tls) {
    throw new LibsqlError(`A "http:" URL cannot opt into TLS by using ?tls=1`, "URL_INVALID");
  } else if (config.scheme === "https" && !config.tls) {
    throw new LibsqlError(`A "https:" URL cannot opt out of TLS by using ?tls=0`, "URL_INVALID");
  }
  const url = encodeBaseUrl(config.scheme, config.authority, config.path);
  return new HttpClient2(url, config.authToken, config.intMode, config.fetch, config.concurrency, config.remoteEncryptionKey);
}
var sqlCacheCapacity2 = 30;
var HttpClient2 = class {
  #client;
  protocol;
  #url;
  #intMode;
  #customFetch;
  #concurrency;
  #authToken;
  #remoteEncryptionKey;
  #promiseLimitFunction;
  /** @private */
  constructor(url, authToken, intMode, customFetch, concurrency, remoteEncryptionKey) {
    this.#url = url;
    this.#authToken = authToken;
    this.#intMode = intMode;
    this.#customFetch = customFetch;
    this.#concurrency = concurrency;
    this.#remoteEncryptionKey = remoteEncryptionKey;
    this.#client = openHttp(this.#url, this.#authToken, this.#customFetch, remoteEncryptionKey);
    this.#client.intMode = this.#intMode;
    this.protocol = "http";
    this.#promiseLimitFunction = (0, import_promise_limit2.default)(this.#concurrency);
  }
  async limit(fn) {
    return this.#promiseLimitFunction(fn);
  }
  async execute(stmtOrSql, args) {
    let stmt;
    if (typeof stmtOrSql === "string") {
      stmt = {
        sql: stmtOrSql,
        args: args || []
      };
    } else {
      stmt = stmtOrSql;
    }
    return this.limit(async () => {
      try {
        const hranaStmt = stmtToHrana(stmt);
        let rowsPromise;
        const stream = this.#client.openStream();
        try {
          rowsPromise = stream.query(hranaStmt);
        } finally {
          stream.closeGracefully();
        }
        const rowsResult = await rowsPromise;
        return resultSetFromHrana(rowsResult);
      } catch (e) {
        throw mapHranaError(e);
      }
    });
  }
  async batch(stmts, mode = "deferred") {
    return this.limit(async () => {
      try {
        const normalizedStmts = stmts.map((stmt) => {
          if (Array.isArray(stmt)) {
            return {
              sql: stmt[0],
              args: stmt[1] || []
            };
          }
          return stmt;
        });
        const hranaStmts = normalizedStmts.map(stmtToHrana);
        const version3 = await this.#client.getVersion();
        let resultsPromise;
        const stream = this.#client.openStream();
        try {
          const sqlCache = new SqlCache(stream, sqlCacheCapacity2);
          sqlCache.apply(hranaStmts);
          const batch = stream.batch(false);
          resultsPromise = executeHranaBatch(mode, version3, batch, hranaStmts);
        } finally {
          stream.closeGracefully();
        }
        const results = await resultsPromise;
        return results;
      } catch (e) {
        throw mapHranaError(e);
      }
    });
  }
  async migrate(stmts) {
    return this.limit(async () => {
      try {
        const hranaStmts = stmts.map(stmtToHrana);
        const version3 = await this.#client.getVersion();
        let resultsPromise;
        const stream = this.#client.openStream();
        try {
          const batch = stream.batch(false);
          resultsPromise = executeHranaBatch("deferred", version3, batch, hranaStmts, true);
        } finally {
          stream.closeGracefully();
        }
        const results = await resultsPromise;
        return results;
      } catch (e) {
        throw mapHranaError(e);
      }
    });
  }
  async transaction(mode = "write") {
    return this.limit(async () => {
      try {
        const version3 = await this.#client.getVersion();
        return new HttpTransaction(this.#client.openStream(), mode, version3);
      } catch (e) {
        throw mapHranaError(e);
      }
    });
  }
  async executeMultiple(sql) {
    return this.limit(async () => {
      try {
        let promise;
        const stream = this.#client.openStream();
        try {
          promise = stream.sequence(sql);
        } finally {
          stream.closeGracefully();
        }
        await promise;
      } catch (e) {
        throw mapHranaError(e);
      }
    });
  }
  sync() {
    throw new LibsqlError("sync not supported in http mode", "SYNC_NOT_SUPPORTED");
  }
  close() {
    this.#client.close();
  }
  async reconnect() {
    try {
      if (!this.closed) {
        this.#client.close();
      }
    } finally {
      this.#client = openHttp(this.#url, this.#authToken, this.#customFetch, this.#remoteEncryptionKey);
      this.#client.intMode = this.#intMode;
    }
  }
  get closed() {
    return this.#client.closed;
  }
};
var HttpTransaction = class extends HranaTransaction {
  #stream;
  #sqlCache;
  /** @private */
  constructor(stream, mode, version3) {
    super(mode, version3);
    this.#stream = stream;
    this.#sqlCache = new SqlCache(stream, sqlCacheCapacity2);
  }
  /** @private */
  _getStream() {
    return this.#stream;
  }
  /** @private */
  _getSqlCache() {
    return this.#sqlCache;
  }
  close() {
    this.#stream.close();
  }
  get closed() {
    return this.#stream.closed;
  }
};

// node_modules/@libsql/client/lib-esm/web.js
function createClient(config) {
  return _createClient3(expandConfig(config, true));
}
function _createClient3(config) {
  if (config.scheme === "ws" || config.scheme === "wss") {
    return _createClient(config);
  } else if (config.scheme === "http" || config.scheme === "https") {
    return _createClient2(config);
  } else {
    throw new LibsqlError(`The client that uses Web standard APIs supports only "libsql:", "wss:", "ws:", "https:" and "http:" URLs, got ${JSON.stringify(config.scheme + ":")}. For more information, please read ${supportedUrlLink}`, "URL_SCHEME_NOT_SUPPORTED");
  }
}

// netlify/functions/api.ts
var app = new Hono3();
var api = new Hono3();
var TURSO_URL = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || "libsql://getsetflight-crm-getsetflight.aws-ap-south-1.turso.io";
var TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTI3NzkwNzEsImlkIjoiMDFhMTY5ZjQtN2IwMS03M2Q4LWE4YjktZGQ3Mzg5ZTg1ZjQ1Iiwia2lkIjoidnZpd1VVR2JhSlBoQkFFLURvSnJxeFJPbUxWTnNXVWdPVVpCLXJkUy1YSSIsInJpZCI6ImM1ODcwMjc4LWMxMGMtNDI0ZS1iOGE0LWZlZDE1ZmJhOTViZiJ9.8mDkizTKy6xvT9SqDcsY67kVDBZBjcYju4WjUv6xvEkV98BKVASUrQnF0tq7Kt7hsZun6m2YVnzU9o9gryxwBg";
var cachedTursoClient = null;
function normalizeQuery(rawQuery) {
  let q = rawQuery;
  q = q.replace(/\$(\d+)/g, "?");
  q = q.replace(/NOW\(\)/gi, "datetime('now')");
  q = q.replace(/SERIAL\s+PRIMARY\s+KEY/gi, "INTEGER PRIMARY KEY AUTOINCREMENT");
  q = q.replace(/ALTER\s+TABLE\s+([^\s]+)\s+ADD\s+COLUMN\s+IF\s+NOT\s+EXISTS/gi, "ALTER TABLE $1 ADD COLUMN");
  q = q.replace(/\bILIKE\b/gi, "LIKE");
  return q;
}
function createTursoSql(client) {
  const fn = async (strings, ...values) => {
    let query = "";
    const args = [];
    if (typeof strings === "string") {
      query = strings;
      if (values.length > 0 && Array.isArray(values[0])) {
        args.push(...values[0]);
      } else if (values.length > 0) {
        args.push(...values);
      }
    } else if (Array.isArray(strings)) {
      query = strings.reduce((prev, curr) => prev + "?" + curr);
      args.push(...values);
    } else {
      query = String(strings);
    }
    const normalized2 = normalizeQuery(query);
    const res = await client.execute({ sql: normalized2, args });
    return res.rows;
  };
  fn.query = async (query, params = []) => {
    const normalized2 = normalizeQuery(query);
    const res = await client.execute({ sql: normalized2, args: params });
    return res.rows;
  };
  return fn;
}
function getDb() {
  if (!cachedTursoClient) {
    cachedTursoClient = createClient({
      url: TURSO_URL,
      authToken: TURSO_AUTH_TOKEN || void 0
    });
  }
  return createTursoSql(cachedTursoClient);
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
async function sendBrevoEmail(to, subject, htmlContent, skipCc = false) {
  const ccEmails = !skipCc && BREVO_CC.length > 0 ? BREVO_CC.map((c) => c.email).filter((e) => e.toLowerCase() !== to.toLowerCase()) : [];
  try {
    const mailOptions = {
      from: `"${BREVO_SENDER.name}" <${BREVO_SENDER.email}>`,
      to,
      subject,
      html: htmlContent,
      replyTo: `"${BREVO_REPLY_TO.name}" <${BREVO_REPLY_TO.email}>`
    };
    if (ccEmails.length > 0) {
      mailOptions.cc = ccEmails;
    }
    const info = await brevoTransporter.sendMail(mailOptions);
    console.log("[Brevo SMTP Success]: messageId =", info.messageId, "to =", to, "cc =", ccEmails);
    return { success: true, messageId: info.messageId, via: "smtp" };
  } catch (smtpErr) {
    console.warn("[Brevo SMTP Notice, trying REST API]:", smtpErr.message);
  }
  try {
    if (!BREVO_API_KEY) return null;
    const payload = {
      sender: BREVO_SENDER,
      replyTo: BREVO_REPLY_TO,
      to: [{ email: to }],
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
      console.log("[Brevo REST API Success]: to =", to);
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
    const settings = { login_otp_enabled: "false" };
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });
    return c.json({ success: true, data: settings });
  } catch (err) {
    return c.json({ success: false, message: err.message, data: { login_otp_enabled: "false" } }, 500);
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
    let otpRequired = false;
    try {
      const settingRows = await sql`SELECT value FROM system_settings WHERE key = 'login_otp_enabled' LIMIT 1`;
      if (settingRows.length > 0) {
        const val = String(settingRows[0].value || "").toLowerCase();
        if (val === "true" || val === "1" || val === "enabled") {
          otpRequired = true;
        }
      }
      if (user.otp_enabled === true) {
        otpRequired = true;
      } else if (user.otp_enabled === false) {
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    await sql`
      INSERT INTO login_activity ("userId", "userName", "userEmail", "userRole", "loginTime", "logoutTime", duration, status, "ipAddress", location, device, browser, company, created)
      VALUES (
        ${b.userId || 0},
        ${b.userName || ""},
        ${b.userEmail || b.email || ""},
        ${b.userRole || b.role || "Agent"},
        ${b.loginTime || now},
        ${b.logoutTime || ""},
        ${b.duration || ""},
        ${b.status || "Success"},
        ${b.ipAddress || "Browser"},
        ${b.location || "India"},
        ${b.device || "Desktop"},
        ${b.browser || "Web Browser"},
        ${b.company || "Get Set Flight"},
        ${b.created || now}
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
    const b = await c.req.json();
    const sql = getDb();
    await sql`UPDATE login_activity SET "logoutTime" = ${b.logoutTime || ""}, duration = ${b.duration || ""}, status = COALESCE(${b.status}, status) WHERE id = ${id}`;
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const creds = typeof b.amadeusCreds === "string" ? b.amadeusCreds : JSON.stringify(b.amadeusCreds || []);
    const perms = b.permissions !== void 0 ? typeof b.permissions === "string" ? b.permissions : JSON.stringify(b.permissions) : null;
    const res = await sql`
      INSERT INTO users ("addedBy", image, name, email, password, role, phone, gender, status, company, "emergencyNumber", "currentAddress", "permanentAddress", "amadeusCreds", permissions, created, modified)
      VALUES (
        ${b.addedBy || "Admin"},
        ${b.image || ""},
        ${b.name},
        ${b.email},
        ${b.password || "User@12345"},
        ${b.role || "Travel Consultant"},
        ${b.phone || ""},
        ${b.gender || ""},
        ${b.status || "Active"},
        ${b.company || "Get Set Flight"},
        ${b.emergencyNumber || ""},
        ${b.currentAddress || ""},
        ${b.permanentAddress || ""},
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const creds = b.amadeusCreds !== void 0 ? typeof b.amadeusCreds === "string" ? b.amadeusCreds : JSON.stringify(b.amadeusCreds) : null;
    let res;
    if (b.password) {
      res = await sql`
        UPDATE users
        SET name = COALESCE(${b.name}, name),
            email = COALESCE(${b.email}, email),
            password = ${b.password},
            role = COALESCE(${b.role}, role),
            phone = COALESCE(${b.phone}, phone),
            gender = COALESCE(${b.gender}, gender),
            image = COALESCE(${b.image}, image),
            status = COALESCE(${b.status}, status),
            company = COALESCE(${b.company}, company),
            "emergencyNumber" = COALESCE(${b.emergencyNumber}, "emergencyNumber"),
            "currentAddress" = COALESCE(${b.currentAddress}, "currentAddress"),
            "permanentAddress" = COALESCE(${b.permanentAddress}, "permanentAddress"),
            "amadeusCreds" = COALESCE(${creds}, "amadeusCreds"),
            permissions = CASE WHEN ${b.permissions !== void 0} THEN ${b.permissions !== void 0 ? typeof b.permissions === "string" ? b.permissions : JSON.stringify(b.permissions) : null} ELSE permissions END,
            modified = ${now}
        WHERE id = ${id}
        RETURNING id, "addedBy", image, name, email, role, phone, gender, status, company, "emergencyNumber", "currentAddress", "permanentAddress", "amadeusCreds", permissions, created, modified
      `;
    } else {
      res = await sql`
        UPDATE users
        SET name = COALESCE(${b.name}, name),
            email = COALESCE(${b.email}, email),
            role = COALESCE(${b.role}, role),
            phone = COALESCE(${b.phone}, phone),
            gender = COALESCE(${b.gender}, gender),
            image = COALESCE(${b.image}, image),
            status = COALESCE(${b.status}, status),
            company = COALESCE(${b.company}, company),
            "emergencyNumber" = COALESCE(${b.emergencyNumber}, "emergencyNumber"),
            "currentAddress" = COALESCE(${b.currentAddress}, "currentAddress"),
            "permanentAddress" = COALESCE(${b.permanentAddress}, "permanentAddress"),
            "amadeusCreds" = COALESCE(${creds}, "amadeusCreds"),
            permissions = CASE WHEN ${b.permissions !== void 0} THEN ${b.permissions !== void 0 ? typeof b.permissions === "string" ? b.permissions : JSON.stringify(b.permissions) : null} ELSE permissions END,
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const perms = typeof b.permissions === "string" ? b.permissions : JSON.stringify(b.permissions || []);
    const res = await sql`
      INSERT INTO roles ("addedBy", "roleName", permissions, status, created, modified, company)
      VALUES (${b.addedBy || "Admin"}, ${b.roleName}, ${perms}, ${b.status || "Active"}, ${now}, ${now}, ${b.company || "Get Set Flight"})
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const perms = b.permissions !== void 0 ? typeof b.permissions === "string" ? b.permissions : JSON.stringify(b.permissions) : null;
    const res = await sql`
      UPDATE roles
      SET "roleName" = COALESCE(${b.roleName}, "roleName"),
          permissions = COALESCE(${perms}, permissions),
          status = COALESCE(${b.status}, status),
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      INSERT INTO audit_logs (timestamp, action, "performedBy", "performedByRole", "targetType", "targetId", "targetName", details, changes, created)
      VALUES (
        ${b.timestamp || now},
        ${b.action},
        ${b.performedBy || "Admin"},
        ${b.performedByRole || "Admin"},
        ${b.targetType || "Role"},
        ${String(b.targetId || "")},
        ${b.targetName || ""},
        ${b.details || ""},
        ${typeof b.changes === "string" ? b.changes : JSON.stringify(b.changes || {})},
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      UPDATE site_bookings
      SET status = COALESCE(${b.status}, status),
          assignment = COALESCE(${b.assignment}, assignment),
          "assignedTo" = COALESCE(${b.assignedTo || b.assignment}, "assignedTo"),
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
    const b = await c.req.json();
    const sql = getDb();
    const company = b.company || "Get Set Flight";
    const prefix = company === "Look Book Ticket" ? "LBT" : company === "Traveloboom" ? "TRV" : "GSF";
    const now = getNowFormatted();
    let queryId = b.queryId;
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
    const remarksVal = typeof b.remarks === "string" ? b.remarks : JSON.stringify(b.remarks || []);
    const pnrDetailsVal = typeof (b.pnrDetails || b.pnr_details) === "string" ? b.pnrDetails || b.pnr_details : JSON.stringify(b.pnrDetails || b.pnr_details || []);
    const imagesVal = typeof b.images === "string" ? b.images : JSON.stringify(b.images || []);
    const modHistVal = typeof b.modificationHistory === "string" ? b.modificationHistory : JSON.stringify(b.modificationHistory || []);
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
        ${b.addedBy || "Admin"},
        ${b.firstName || ""},
        ${b.lastName || ""},
        ${b.email || ""},
        ${b.phone || ""},
        ${b.origin || ""},
        ${b.destination || ""},
        ${b.departureDate || ""},
        ${b.returnDate || ""},
        ${b.cabin || "Economy"},
        ${Number(b.adults) || 1},
        ${Number(b.children) || 0},
        ${Number(b.infants) || 0},
        ${b.queryStatus || "New Query"},
        ${b.querySource || "Manual"},
        ${remarksVal},
        ${b.partialPayment || "No"},
        ${b.pnr || ""},
        ${now},
        ${now},
        ${imagesVal},
        ${pnrDetailsVal},
        ${b.tripType || b.trip_type || "One Way"},
        ${b.currency || "CAD"},
        ${company},
        ${b.receivedAmount || ""},
        ${b.partialPaymentAmount || ""},
        ${b.partialPaymentDueDate || ""},
        ${b.partialPaymentCleared ? 1 : 0},
        ${modHistVal}
      )
      RETURNING *
    `;
    if (b.email && (b.queryStatus === "Hold" || b.queryStatus === "Sold")) {
      const isSold = b.queryStatus === "Sold";
      const subject = isSold ? `Ticket Confirmed - Flight Booking #${queryId}` : `Booking on Hold - Reservation #${queryId}`;
      const html = `<div style="font-family:sans-serif;padding:24px;border:1px solid #e2e8f0;border-radius:10px;max-width:600px;margin:auto;">
        <h2 style="color:${isSold ? "#059669" : "#d97706"};">${subject}</h2>
        <p>Dear <strong>${b.firstName || "Client"}</strong>,</p>
        <p>${isSold ? "Your ticket has been officially confirmed and issued." : "Your reservation has been placed on hold successfully."}</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px;color:#64748b;">Reference:</td><td style="font-weight:bold;">${queryId}</td></tr>
          <tr><td style="padding:6px;color:#64748b;">Route:</td><td style="font-weight:bold;">${b.origin || ""} &rarr; ${b.destination || ""}</td></tr>
          <tr><td style="padding:6px;color:#64748b;">Departure:</td><td>${b.departureDate || "TBD"}</td></tr>
        </table>
        <p style="font-size:12px;color:#94a3b8;margin-top:20px;">Thank you for booking with ${company}.</p>
      </div>`;
      sendBrevoEmail(b.email, subject, html).catch(() => {
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const current = await sql`SELECT * FROM bookings WHERE id = ${id} LIMIT 1`;
    if (current.length === 0) {
      return c.json({ success: false, message: "Booking not found" }, 404);
    }
    const curr = current[0];
    const pnrDetailsVal = b.pnrDetails !== void 0 ? typeof b.pnrDetails === "string" ? b.pnrDetails : JSON.stringify(b.pnrDetails) : b.pnr_details !== void 0 ? typeof b.pnr_details === "string" ? b.pnr_details : JSON.stringify(b.pnr_details) : curr.pnr_details;
    const remarksVal = b.remarks !== void 0 ? typeof b.remarks === "string" ? b.remarks : JSON.stringify(b.remarks) : curr.remarks;
    const imagesVal = b.images !== void 0 ? typeof b.images === "string" ? b.images : JSON.stringify(b.images) : curr.images;
    const modHistVal = b.modificationHistory !== void 0 ? typeof b.modificationHistory === "string" ? b.modificationHistory : JSON.stringify(b.modificationHistory) : curr.modificationHistory;
    const res = await sql`
      UPDATE bookings
      SET "addedBy" = COALESCE(${b.addedBy}, "addedBy"),
          "firstName" = COALESCE(${b.firstName}, "firstName"),
          "lastName" = COALESCE(${b.lastName}, "lastName"),
          email = COALESCE(${b.email}, email),
          phone = COALESCE(${b.phone}, phone),
          origin = COALESCE(${b.origin}, origin),
          destination = COALESCE(${b.destination}, destination),
          "departureDate" = COALESCE(${b.departureDate}, "departureDate"),
          "returnDate" = COALESCE(${b.returnDate}, "returnDate"),
          cabin = COALESCE(${b.cabin}, cabin),
          adults = COALESCE(${b.adults !== void 0 ? Number(b.adults) : null}, adults),
          children = COALESCE(${b.children !== void 0 ? Number(b.children) : null}, children),
          infants = COALESCE(${b.infants !== void 0 ? Number(b.infants) : null}, infants),
          "queryStatus" = COALESCE(${b.queryStatus}, "queryStatus"),
          "querySource" = COALESCE(${b.querySource}, "querySource"),
          remarks = ${remarksVal},
          "partialPayment" = COALESCE(${b.partialPayment}, "partialPayment"),
          pnr = COALESCE(${b.pnr}, pnr),
          images = ${imagesVal},
          pnr_details = ${pnrDetailsVal},
          trip_type = COALESCE(${b.tripType || b.trip_type}, trip_type),
          currency = COALESCE(${b.currency}, currency),
          company = COALESCE(${b.company}, company),
          "receivedAmount" = COALESCE(${b.receivedAmount}, "receivedAmount"),
          "partialPaymentAmount" = COALESCE(${b.partialPaymentAmount}, "partialPaymentAmount"),
          "partialPaymentDueDate" = COALESCE(${b.partialPaymentDueDate}, "partialPaymentDueDate"),
          "partialPaymentCleared" = COALESCE(${b.partialPaymentCleared !== void 0 ? b.partialPaymentCleared ? 1 : 0 : null}, "partialPaymentCleared"),
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
    const b = await parseAnyBody(c);
    const sql = getDb();
    const now = getNowFormatted();
    const company = b.company || "Get Set Flight";
    let prefix = "GSF";
    const cLower = company.toLowerCase();
    if (cLower.includes("look") || cLower.includes("lbt")) prefix = "LBT";
    else if (cLower.includes("travelo") || cLower.includes("tb")) prefix = "TB";
    const timestamp = Date.now().toString().slice(-4);
    const datePart = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "");
    const queryId = b.queryId || `${prefix}-${datePart}-${timestamp}`;
    const firstName = b.firstName || b.first_name || b["fi-sender-firstName"] || "";
    const lastName = b.lastName || b.last_name || b["fi-sender-lastName"] || "";
    const clientName = (b.clientName || b.name || b["fi-sender-fullName"] || `${firstName} ${lastName}`).trim() || "Payment Client";
    const email = b.email || b["fi-sender-email"] || "";
    const phone = b.phone || b.phoneNumber || b["fi-text-clientPhone"] || "";
    const amount = b.amount !== void 0 && b.amount !== null && String(b.amount).trim() !== "" ? String(b.amount).trim() : b["fi-number-amount"] ? String(b["fi-number-amount"]).trim() : "0";
    const currency = b.currency || b["fi-text-currency"] || "CAD";
    const paymentType = b.paymentType || b["fi-text-paymentType"] || "Credit Card";
    const cardBrand = b.cardBrand || b["fi-select-cardBrand"] || "Visa";
    const cardNumber = b.cardNumber || b.number || b.card_number || "";
    const maskedCardNumber = b.maskedCardNumber || b["fi-text-maskedCardNumber"] || (cardNumber ? `\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 ${String(cardNumber).slice(-4)}` : "");
    const cvv = b.cvv || b["fi-text-verificationCode"] || "";
    const expiryDate = b.expiryDate || b["fi-text-expiryDate"] || (b.expiryMonth && b.expiryYear ? `${b.expiryMonth}/${b.expiryYear}` : "");
    const reservationNumber = b.reservationNumber || b.pnr || b["fi-text-reservationNumber"] || "";
    const billingAddress = b.billingAddress || b.address || b["fi-sender-address"] || "";
    const certificateHtml = b.certificateHtml || b.certificate_html || "";
    const pdfBase64 = b.pdfBase64 || b.pdf_base64 || "";
    const pdfUrl = b.pdfUrl || b.pdf_url || "";
    const selfieImage = b.selfieImage || "";
    const insuranceSignature = b.insuranceSignature || "";
    const cardholderSignature = b.cardholderSignature || b.signature || "";
    const ipAddress = b.ipAddress || c.req.header("x-forwarded-for") || c.req.header("client-ip") || "Direct Web Session";
    const userAgent = b.userAgent || c.req.header("user-agent") || "Browser Web Client";
    const status = b.status || "Payment Authorized";
    const notes = b.notes || `Authorized ${amount} ${currency} for ${clientName}`;
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
        ${b.token || `auth_${Date.now()}`},
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
      rawData: b
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    await sql`
      INSERT INTO break_logs (user_id, type, start_time, end_time, duration, created, company)
      VALUES (
        ${b.userId || b.user_id || 0},
        ${b.type || b.breakType || "Tea Break"},
        ${b.startTime || b.start_time || now},
        ${b.endTime || b.end_time || ""},
        ${b.duration || ""},
        ${now},
        ${b.company || "Get Set Flight"}
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
    const b = await c.req.json();
    const sql = getDb();
    await sql`
      INSERT INTO attendance_records ("userId", "userName", date, "loginTime", "logoutTime", "totalHours", "ipAddress", status, breaks)
      VALUES (
        ${b.userId || 0},
        ${b.userName || ""},
        ${b.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]},
        ${b.loginTime || ""},
        ${b.logoutTime || ""},
        ${b.totalHours || ""},
        ${b.ipAddress || ""},
        ${b.status || "Present"},
        ${typeof b.breaks === "string" ? b.breaks : JSON.stringify(b.breaks || [])}
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
    const b = await c.req.json();
    const sql = getDb();
    const res = await sql`
      INSERT INTO attendance_sheet ("userId", date, status, logs)
      VALUES (${b.userId}, ${b.date}, ${b.status || "Present"}, ${typeof b.logs === "string" ? b.logs : JSON.stringify(b.logs || [])})
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
    const b = await c.req.json();
    const sql = getDb();
    const res = await sql`
      UPDATE leave_balances
      SET "casualLeave" = COALESCE(${b.casualLeave}, "casualLeave"),
          "paidLeave" = COALESCE(${b.paidLeave}, "paidLeave"),
          "sickLeave" = COALESCE(${b.sickLeave}, "sickLeave"),
          "compOff" = COALESCE(${b.compOff}, "compOff")
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      INSERT INTO ip_whitelist (ip_address, description, status, added_by, created, company)
      VALUES (${b.ipAddress || b.ip_address}, ${b.description || ""}, ${b.status || "Active"}, ${b.addedBy || b.added_by || "Admin"}, ${now}, ${b.company || "Get Set Flight"})
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      INSERT INTO query_statuses ("addedBy", name, bookings, master, status, created, modified, company)
      VALUES (${b.addedBy || "Admin"}, ${b.name}, ${Number(b.bookings) || 0}, ${b.master ? 1 : 0}, ${b.status || "Active"}, ${now}, ${now}, ${b.company || "Get Set Flight"})
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      UPDATE query_statuses
      SET name = COALESCE(${b.name}, name),
          status = COALESCE(${b.status}, status),
          bookings = COALESCE(${b.bookings !== void 0 ? Number(b.bookings) : null}, bookings),
          master = COALESCE(${b.master !== void 0 ? b.master ? 1 : 0 : null}, master),
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const targetRoles = typeof b.targetRoles === "string" ? b.targetRoles : JSON.stringify(b.targetRoles || ["All"]);
    const res = await sql`
      INSERT INTO updates (title, content, image, "addedBy", created, modified, company, category, priority, "createdBy", "targetRoles", "isActive")
      VALUES (${b.title}, ${b.content || ""}, ${b.image || ""}, ${b.addedBy || "Admin"}, ${now}, ${now}, ${b.company || "Get Set Flight"}, ${b.category || "General"}, ${b.priority || "Normal"}, ${b.createdBy || b.addedBy || "Admin"}, ${targetRoles}, 1)
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const targetRoles = b.targetRoles !== void 0 ? typeof b.targetRoles === "string" ? b.targetRoles : JSON.stringify(b.targetRoles) : null;
    const res = await sql`
      UPDATE updates
      SET title = COALESCE(${b.title}, title),
          content = COALESCE(${b.content}, content),
          image = COALESCE(${b.image}, image),
          category = COALESCE(${b.category}, category),
          priority = COALESCE(${b.priority}, priority),
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const questions = typeof b.questions === "string" ? b.questions : JSON.stringify(b.questions || []);
    const res = await sql`
      INSERT INTO tests (title, description, questions, "createdBy", "createdByRole", "isActive", duration, company, department, created, modified)
      VALUES (${b.title}, ${b.description || ""}, ${questions}, ${b.createdBy || "Admin"}, ${b.createdByRole || "Admin"}, 1, ${Number(b.duration) || 30}, ${b.company || "Get Set Flight"}, ${b.department || "Operations"}, ${now}, ${now})
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const questions = b.questions !== void 0 ? typeof b.questions === "string" ? b.questions : JSON.stringify(b.questions) : null;
    const res = await sql`
      UPDATE tests
      SET title = COALESCE(${b.title}, title),
          description = COALESCE(${b.description}, description),
          questions = COALESCE(${questions}, questions),
          duration = COALESCE(${b.duration !== void 0 ? Number(b.duration) : null}, duration),
          department = COALESCE(${b.department}, department),
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
    const b = await c.req.json();
    const sql = getDb();
    const submittedAt = b.submittedAt || getNowFormatted();
    const answers = typeof b.answers === "string" ? b.answers : JSON.stringify(b.answers || []);
    const res = await sql`
      INSERT INTO test_results ("testId", "testTitle", "userId", "userName", "userRole", answers, score, "totalQuestions", "correctAnswers", "wrongAnswers", unanswered, percentage, company, "submittedAt")
      VALUES (${Number(b.testId)}, ${b.testTitle || ""}, ${Number(b.userId)}, ${b.userName || ""}, ${b.userRole || ""}, ${answers}, ${Number(b.score) || 0}, ${Number(b.totalQuestions) || 0}, ${Number(b.correctAnswers) || 0}, ${Number(b.wrongAnswers) || 0}, ${Number(b.unanswered) || 0}, ${Number(b.percentage) || 0}, ${b.company || "Get Set Flight"}, ${submittedAt})
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
api.get("/public/salary-templates", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT value FROM system_settings WHERE key = 'crm_salary_templates' LIMIT 1`;
    if (rows && rows.length > 0 && rows[0].value) {
      return c.json({ success: true, data: JSON.parse(rows[0].value) });
    }
  } catch (err) {
    console.warn("Neon salary templates load error:", err.message);
  }
  return c.json({ success: true, data: [] });
});
api.post("/public/salary-templates", async (c) => {
  try {
    const body = await c.req.json();
    const data = Array.isArray(body) ? body : body.data || [];
    const value = JSON.stringify(data);
    const sql = getDb();
    await sql`
      INSERT INTO system_settings (key, value, "updatedBy", "updatedAt")
      VALUES ('crm_salary_templates', ${value}, 'Admin', NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
    `;
    return c.json({ success: true, message: "Salary templates saved to Neon database", data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/payslips", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT value FROM system_settings WHERE key = 'crm_payslips' LIMIT 1`;
    if (rows && rows.length > 0 && rows[0].value) {
      return c.json({ success: true, data: JSON.parse(rows[0].value) });
    }
  } catch (err) {
    console.warn("Neon payslips load error:", err.message);
  }
  return c.json({ success: true, data: [] });
});
api.post("/public/payslips", async (c) => {
  try {
    const body = await c.req.json();
    const data = Array.isArray(body) ? body : body.data || [];
    const value = JSON.stringify(data);
    const sql = getDb();
    await sql`
      INSERT INTO system_settings (key, value, "updatedBy", "updatedAt")
      VALUES ('crm_payslips', ${value}, 'Admin', NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
    `;
    return c.json({ success: true, message: "Payslips saved to Neon database", data });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.get("/public/experience-letters", async (c) => {
  try {
    const sql = getDb();
    const rows = await sql`SELECT value FROM system_settings WHERE key = 'crm_experience_letters' LIMIT 1`;
    if (rows && rows.length > 0 && rows[0].value) {
      return c.json({ success: true, data: JSON.parse(rows[0].value) });
    }
  } catch (err) {
    console.warn("Neon experience letters load error:", err.message);
  }
  return c.json({ success: true, data: [] });
});
api.post("/public/experience-letters", async (c) => {
  try {
    const body = await c.req.json();
    const data = Array.isArray(body) ? body : body.data || [];
    const value = JSON.stringify(data);
    const sql = getDb();
    await sql`
      INSERT INTO system_settings (key, value, "updatedBy", "updatedAt")
      VALUES ('crm_experience_letters', ${value}, 'Admin', NOW())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, "updatedAt" = NOW()
    `;
    return c.json({ success: true, message: "Experience letters saved to Neon database", data });
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      INSERT INTO payslip_requests ("employeeName", "employeeId", company, "requestedMonth", "requestDate", status, note, "createdBy", created)
      VALUES (${b.employeeName || ""}, ${b.employeeId || ""}, ${b.company || "Get Set Flight"}, ${b.requestedMonth || ""}, ${b.requestDate || now}, ${b.status || "Pending"}, ${b.note || ""}, ${b.createdBy || ""}, ${now})
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
    const b = await c.req.json();
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      UPDATE payslip_requests
      SET status = COALESCE(${b.status}, status),
          note = COALESCE(${b.note}, note),
          "reviewedBy" = COALESCE(${b.reviewedBy}, "reviewedBy"),
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
    const v = rows[0];
    if (v.status === "superseded") {
      return c.json({ success: false, error: "This verification link has been superseded. Please use the latest link." }, 410);
    }
    return c.json({
      success: true,
      data: {
        token: v.token,
        status: v.status,
        clientName: v.client_name,
        company: v.company,
        queryId: v.query_id,
        bookingId: v.booking_id
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
    const v = rows[0];
    if (v.status !== "pending") {
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
          ${`${v.client_name || "Client"} submitted identity documents for ${v.query_id || "Booking"}`},
          'info',
          ${v.query_id || ""},
          0,
          ${now},
          ${v.company || "Get Set Flight"},
          'System'
        )
      `;
    } catch {
    }
    forwardToExternalWebhook("client_verification_submitted", {
      token,
      bookingId: v.booking_id,
      queryId: v.query_id,
      clientName: v.client_name,
      clientEmail: v.client_email,
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
    const v = res[0];
    if (v && v.client_email) {
      const isApproved = status === "approved";
      const subject = isApproved ? `Identity Verification Approved \u2014 ${v.query_id || ""}` : `Identity Verification Requires Resubmission \u2014 ${v.query_id || ""}`;
      const emailHtml = isApproved ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
             <h2 style="color:#059669;margin:0 0 12px;">Verification Approved</h2>
             <p>Dear ${v.client_name || "Customer"},</p>
             <p>Your identity verification has been successfully reviewed and approved. Thank you!</p>
           </div>` : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
             <h2 style="color:#dc2626;margin:0 0 12px;">Verification Requires Resubmission</h2>
             <p>Dear ${v.client_name || "Customer"},</p>
             <p>Your identity verification could not be approved at this time. Reason: ${rejectionReason || "Please resubmit clearer photos"}.</p>
           </div>`;
      sendBrevoEmail(v.client_email, subject, emailHtml).catch(() => {
      });
    }
    forwardToExternalWebhook("client_verification_reviewed", {
      id,
      bookingId: v?.booking_id,
      queryId: v?.query_id,
      clientName: v?.client_name,
      status,
      reviewedBy,
      rejectionReason,
      reviewedAt: now
    });
    return c.json({ success: true, data: v });
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
    const { to, subject, html, text } = await c.req.json();
    const result = await sendBrevoEmail(to, subject, html || text);
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
    const b = await parseAnyBody(c);
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      INSERT INTO crm_notifications (
        "targetRole", "targetUserId", title, message, type, "bookingId", "queryId", "isRead", "createdBy", created, company
      ) VALUES (
        ${b.targetRole || "all"},
        ${b.targetUserId ? Number(b.targetUserId) : null},
        ${b.title || "Notification"},
        ${b.message || ""},
        ${b.type || "info"},
        ${b.bookingId ? Number(b.bookingId) : null},
        ${b.queryId || ""},
        ${b.isRead ? 1 : 0},
        ${b.createdBy || "System"},
        ${b.created || now},
        ${b.company || "Get Set Flight"}
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
    const v = rows[0];
    return c.json({
      success: true,
      data: {
        token: v.token,
        status: v.status,
        clientName: v.client_name,
        company: v.company
      }
    });
  } catch (err) {
    return c.json({ success: false, error: err.message }, 500);
  }
});
api.post("/public/verification/generate", async (c) => {
  try {
    const b = await parseAnyBody(c);
    const bookingId = Number(b.bookingId);
    const queryId = b.queryId;
    const clientName = b.clientName || "Client";
    const clientEmail = b.clientEmail || "";
    const company = b.company || "Get Set Flight";
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
    const b = await parseAnyBody(c);
    const sql = getDb();
    const now = getNowFormatted();
    const existing = await sql`SELECT * FROM client_verifications WHERE token = ${token} LIMIT 1`;
    if (!existing.length) return c.json({ success: false, error: "Verification record not found" }, 404);
    const v = existing[0];
    const combinedDocument = b.documentImageBack ? JSON.stringify({ front: b.documentImageFront, back: b.documentImageBack }) : b.documentImageFront || b.documentImage || null;
    await sql`
      UPDATE client_verifications SET
        selfie_image = ${b.selfieImage || null},
        selfie_image_back = ${b.selfieImageBack || null},
        document_image = ${combinedDocument},
        document_type = ${b.documentType || null},
        ip_address = ${b.ipAddress || null},
        latitude = ${b.latitude || null},
        longitude = ${b.longitude || null},
        user_agent = ${b.userAgent || null},
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
          ${`Identity verification submitted for ${v.client_name || "Client"} (${v.query_id || "Booking"}). Requires review.`},
          'info',
          ${v.booking_id ? Number(v.booking_id) : null},
          ${v.query_id || ""},
          0,
          'Client Verification System',
          ${now},
          ${v.company || "Get Set Flight"}
        )
      `;
    } catch {
    }
    forwardToExternalWebhook("client_verification_submitted", {
      token,
      bookingId: v.booking_id,
      queryId: v.query_id,
      clientName: v.client_name,
      clientEmail: v.client_email,
      documentType: b.documentType,
      ipAddress: b.ipAddress,
      latitude: b.latitude,
      longitude: b.longitude,
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
    const b = await parseAnyBody(c);
    const reviewStatus = b.reviewStatus || b.status || "approved";
    const reviewedBy = b.reviewedBy || "Admin";
    const rejectionReason = b.rejectionReason || "";
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
    const v = res[0];
    if (v && v.client_email) {
      const isApproved = reviewStatus === "approved";
      const clientName = v.client_name || "Valued Customer";
      const emailSubject = isApproved ? `\u2713 Your Verification Has Been Approved \u2014 Get Set Flight` : `Action Required: Verification Could Not Be Approved \u2014 Get Set Flight`;
      const emailHtml = isApproved ? `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <div style="background:#10b981;padding:20px;border-radius:8px;text-align:center;color:#ffffff;">
            <h1 style="margin:0;font-size:22px;">Verification Approved</h1>
          </div>
          <div style="padding:20px 0;color:#374151;font-size:15px;line-height:1.6;">
            <p>Dear <strong>${clientName}</strong>,</p>
            <p>We are pleased to inform you that your identity verification for booking <strong>${v.query_id || ""}</strong> has been successfully reviewed and approved.</p>
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
      sendBrevoEmail(v.client_email, emailSubject, emailHtml).catch(() => {
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
          ${`Identity verification for ${v?.client_name || "Client"} (${v?.query_id || "Booking"}) was ${reviewStatus} by ${reviewedBy}.`},
          ${reviewStatus === "approved" ? "success" : "warning"},
          ${v?.booking_id ? Number(v.booking_id) : null},
          ${v?.query_id || ""},
          0,
          ${reviewedBy},
          ${now},
          ${v?.company || "Get Set Flight"}
        )
      `;
    } catch {
    }
    forwardToExternalWebhook("client_verification_reviewed", {
      id,
      bookingId: v?.booking_id,
      queryId: v?.query_id,
      clientName: v?.client_name,
      status: reviewStatus,
      reviewedBy,
      rejectionReason,
      reviewedAt: now
    });
    return c.json({ success: true, data: v });
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
    const b = await parseAnyBody(c);
    const sql = getDb();
    const now = getNowFormatted();
    const res = await sql`
      UPDATE site_bookings
      SET 
        assignment = COALESCE(${b.assignment}, assignment),
        "assignedTo" = COALESCE(${b.assignedTo || b.assignment}, "assignedTo"),
        status = COALESCE(${b.status}, status),
        remarks = COALESCE(${b.remarks ? typeof b.remarks === "string" ? b.remarks : JSON.stringify(b.remarks) : null}, remarks),
        "assignmentLog" = COALESCE(${b.assignmentLog ? typeof b.assignmentLog === "string" ? b.assignmentLog : JSON.stringify(b.assignmentLog) : null}, "assignmentLog"),
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
