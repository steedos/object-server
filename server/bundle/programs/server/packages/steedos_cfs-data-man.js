(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var EJSON = Package.ejson.EJSON;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var DataMan;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:cfs-data-man":{"checkNpm.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-data-man/checkNpm.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);

// fix warning: xxx not installed
require("mime/package.json");

require("temp/package.json");

checkNpmVersions({
  mime: "^2.0.2",
  'buffer-stream-reader': "0.1.1",
  //request: "2.44.0",
  // We use a specific commit from a fork of "request" package for now; we need fix for
  // https://github.com/mikeal/request/issues/887 (https://github.com/CollectionFS/Meteor-CollectionFS/issues/347)
  request: "^2.81.0",
  temp: "0.7.0" // for tests only

}, 'steedos:cfs-data-man');
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"data-man-api.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-data-man/server/data-man-api.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global DataMan:true, Buffer */
var fs = require("fs");

var Readable = require('stream').Readable;
/**
 * @method DataMan
 * @public
 * @constructor
 * @param {Buffer|ArrayBuffer|Uint8Array|String} data The data that you want to manipulate.
 * @param {String} [type] The data content (MIME) type, if known. Required if the first argument is a Buffer, ArrayBuffer, Uint8Array, or URL
 * @param {Object} [options] Currently used only to pass options for the GET request when `data` is a URL.
 */


DataMan = function DataMan(data, type, options) {
  var self = this,
      buffer;

  if (!data) {
    throw new Error("DataMan constructor requires a data argument");
  } // The end result of all this is that we will have this.source set to a correct
  // data type handler. We are simply detecting what the data arg is.
  //
  // Unless we already have in-memory data, we don't load anything into memory
  // and instead rely on obtaining a read stream when the time comes.


  if (typeof Buffer !== "undefined" && data instanceof Buffer) {
    if (!type) {
      throw new Error("DataMan constructor requires a type argument when passed a Buffer");
    }

    self.source = new DataMan.Buffer(data, type);
  } else if (typeof ArrayBuffer !== "undefined" && data instanceof ArrayBuffer) {
    if (typeof Buffer === "undefined") {
      throw new Error("Buffer support required to handle an ArrayBuffer");
    }

    if (!type) {
      throw new Error("DataMan constructor requires a type argument when passed an ArrayBuffer");
    }

    buffer = new Buffer(new Uint8Array(data));
    self.source = new DataMan.Buffer(buffer, type);
  } else if (EJSON.isBinary(data)) {
    if (typeof Buffer === "undefined") {
      throw new Error("Buffer support required to handle an ArrayBuffer");
    }

    if (!type) {
      throw new Error("DataMan constructor requires a type argument when passed a Uint8Array");
    }

    buffer = new Buffer(data);
    self.source = new DataMan.Buffer(buffer, type);
  } else if (typeof Readable !== "undefined" && data instanceof Readable) {
    if (!type) {
      throw new Error("DataMan constructor requires a type argument when passed a stream.Readable");
    }

    self.source = new DataMan.ReadStream(data, type);
  } else if (typeof data === "string") {
    if (data.slice(0, 5) === "data:") {
      self.source = new DataMan.DataURI(data);
    } else if (data.slice(0, 5) === "http:" || data.slice(0, 6) === "https:") {
      if (!type) {
        throw new Error("DataMan constructor requires a type argument when passed a URL");
      }

      self.source = new DataMan.URL(data, type, options);
    } else {
      // assume it's a filepath
      self.source = new DataMan.FilePath(data, type);
    }
  } else {
    throw new Error("DataMan constructor received data that it doesn't support");
  }
};
/**
 * @method DataMan.prototype.getBuffer
 * @public
 * @param {function} [callback] callback(err, buffer)
 * @returns {Buffer|undefined}
 *
 * Returns a Buffer representing this data, or passes the Buffer to a callback.
 */


DataMan.prototype.getBuffer = function dataManGetBuffer(callback) {
  var self = this;
  return callback ? self.source.getBuffer(callback) : Meteor.wrapAsync(bind(self.source.getBuffer, self.source))();
};

function _saveToFile(readStream, filePath, callback) {
  var writeStream = fs.createWriteStream(filePath);
  writeStream.on('close', Meteor.bindEnvironment(function () {
    callback();
  }, function (error) {
    callback(error);
  }));
  writeStream.on('error', Meteor.bindEnvironment(function (error) {
    callback(error);
  }, function (error) {
    callback(error);
  }));
  readStream.pipe(writeStream);
}
/**
 * @method DataMan.prototype.saveToFile
 * @public
 * @param {String} filePath
 * @param {Function} callback
 * @returns {undefined}
 *
 * Saves this data to a filepath on the local filesystem.
 */


DataMan.prototype.saveToFile = function dataManSaveToFile(filePath, callback) {
  var readStream = this.createReadStream();
  return callback ? _saveToFile(readStream, filePath, callback) : Meteor.wrapAsync(_saveToFile)(readStream, filePath);
};
/**
 * @method DataMan.prototype.getDataUri
 * @public
 * @param {function} [callback] callback(err, dataUri)
 *
 * If no callback, returns the data URI.
 */


DataMan.prototype.getDataUri = function dataManGetDataUri(callback) {
  var self = this;
  return callback ? self.source.getDataUri(callback) : Meteor.wrapAsync(bind(self.source.getDataUri, self.source))();
};
/**
 * @method DataMan.prototype.createReadStream
 * @public
 *
 * Returns a read stream for the data.
 */


DataMan.prototype.createReadStream = function dataManCreateReadStream() {
  return this.source.createReadStream();
};
/**
 * @method DataMan.prototype.size
 * @public
 * @param {function} [callback] callback(err, size)
 *
 * If no callback, returns the size in bytes of the data.
 */


DataMan.prototype.size = function dataManSize(callback) {
  var self = this;
  return callback ? self.source.size(callback) : Meteor.wrapAsync(bind(self.source.size, self.source))();
};
/**
 * @method DataMan.prototype.type
 * @public
 *
 * Returns the type of the data.
 */


DataMan.prototype.type = function dataManType() {
  return this.source.type();
};
/*
 * "bind" shim; from underscorejs, but we avoid a dependency
 */


var slice = Array.prototype.slice;
var nativeBind = Function.prototype.bind;

var ctor = function () {};

function isFunction(obj) {
  return Object.prototype.toString.call(obj) == '[object Function]';
}

function bind(func, context) {
  var args, bound;
  if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
  if (!isFunction(func)) throw new TypeError();
  args = slice.call(arguments, 2);
  return bound = function () {
    if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
    ctor.prototype = func.prototype;
    var self = new ctor();
    ctor.prototype = null;
    var result = func.apply(self, args.concat(slice.call(arguments)));
    if (Object(result) === result) return result;
    return self;
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"data-man-buffer.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-data-man/server/data-man-buffer.js                                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var bufferStreamReader = require('buffer-stream-reader');
/**
 * @method DataMan.Buffer
 * @public
 * @constructor
 * @param {Buffer} buffer
 * @param {String} type The data content (MIME) type.
 */


DataMan.Buffer = function DataManBuffer(buffer, type) {
  var self = this;
  self.buffer = buffer;
  self._type = type;
};
/**
 * @method DataMan.Buffer.prototype.getBuffer
 * @private
 * @param {function} callback callback(err, buffer)
 * @returns {Buffer|undefined}
 *
 * Passes a Buffer representing the data to a callback.
 */


DataMan.Buffer.prototype.getBuffer = function dataManBufferGetBuffer(callback) {
  callback(null, this.buffer);
};
/**
 * @method DataMan.Buffer.prototype.getDataUri
 * @private
 * @param {function} callback callback(err, dataUri)
 *
 * Passes a data URI representing the data in the buffer to a callback.
 */


DataMan.Buffer.prototype.getDataUri = function dataManBufferGetDataUri(callback) {
  var self = this;

  if (!self._type) {
    callback(new Error("DataMan.getDataUri couldn't get a contentType"));
  } else {
    var dataUri = "data:" + self._type + ";base64," + self.buffer.toString("base64");
    callback(null, dataUri);
  }
};
/**
 * @method DataMan.Buffer.prototype.createReadStream
 * @private
 *
 * Returns a read stream for the data.
 */


DataMan.Buffer.prototype.createReadStream = function dataManBufferCreateReadStream() {
  return new bufferStreamReader(this.buffer);
};
/**
 * @method DataMan.Buffer.prototype.size
 * @param {function} callback callback(err, size)
 * @private
 *
 * Passes the size in bytes of the data in the buffer to a callback.
 */


DataMan.Buffer.prototype.size = function dataManBufferSize(callback) {
  var self = this;

  if (typeof self._size === "number") {
    callback(null, self._size);
    return;
  }

  self._size = self.buffer.length;
  callback(null, self._size);
};
/**
 * @method DataMan.Buffer.prototype.type
 * @private
 *
 * Returns the type of the data.
 */


DataMan.Buffer.prototype.type = function dataManBufferType() {
  return this._type;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"data-man-datauri.js":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-data-man/server/data-man-datauri.js                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/**
 * @method DataMan.DataURI
 * @public
 * @constructor
 * @param {String} dataUri
 */
DataMan.DataURI = function DataManDataURI(dataUri) {
  var self = this;
  var pieces = dataUri.match(/^data:(.*);base64,(.*)$/);
  var buffer = new Buffer(pieces[2], 'base64');
  return new DataMan.Buffer(buffer, pieces[1]);
};

DataMan.DataURI.prototype = DataMan.Buffer.prototype;
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"data-man-filepath.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-data-man/server/data-man-filepath.js                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var mime = require('mime');

var fs = require("fs");
/**
 * @method DataMan.FilePath
 * @public
 * @constructor
 * @param {String} filepath
 * @param {String} [type] The data content (MIME) type. Will lookup from file if not passed.
 */


DataMan.FilePath = function DataManFilePath(filepath, type) {
  var self = this;
  self.filepath = filepath;
  self._type = type || mime.lookup(filepath);
};
/**
 * @method DataMan.FilePath.prototype.getBuffer
 * @private
 * @param {function} callback callback(err, buffer)
 * @returns {Buffer|undefined}
 *
 * Passes a Buffer representing the data to a callback.
 */


DataMan.FilePath.prototype.getBuffer = function dataManFilePathGetBuffer(callback) {
  var self = this; // Call node readFile

  fs.readFile(self.filepath, Meteor.bindEnvironment(function (err, buffer) {
    callback(err, buffer);
  }, function (err) {
    callback(err);
  }));
};
/**
 * @method DataMan.FilePath.prototype.getDataUri
 * @private
 * @param {function} callback callback(err, dataUri)
 *
 * Passes a data URI representing the data to a callback.
 */


DataMan.FilePath.prototype.getDataUri = function dataManFilePathGetDataUri(callback) {
  var self = this;
  self.getBuffer(function (error, buffer) {
    if (error) {
      callback(error);
    } else {
      if (!self._type) {
        callback(new Error("DataMan.getDataUri couldn't get a contentType"));
      } else {
        var dataUri = "data:" + self._type + ";base64," + buffer.toString("base64");
        buffer = null;
        callback(null, dataUri);
      }
    }
  });
};
/**
 * @method DataMan.FilePath.prototype.createReadStream
 * @private
 *
 * Returns a read stream for the data.
 */


DataMan.FilePath.prototype.createReadStream = function dataManFilePathCreateReadStream() {
  // Stream from filesystem
  return fs.createReadStream(this.filepath);
};
/**
 * @method DataMan.FilePath.prototype.size
 * @param {function} callback callback(err, size)
 * @private
 *
 * Passes the size in bytes of the data to a callback.
 */


DataMan.FilePath.prototype.size = function dataManFilePathSize(callback) {
  var self = this;

  if (typeof self._size === "number") {
    callback(null, self._size);
    return;
  } // We can get the size without buffering


  fs.stat(self.filepath, Meteor.bindEnvironment(function (error, stats) {
    if (stats && typeof stats.size === "number") {
      self._size = stats.size;
      callback(null, self._size);
    } else {
      callback(error);
    }
  }, function (error) {
    callback(error);
  }));
};
/**
 * @method DataMan.FilePath.prototype.type
 * @private
 *
 * Returns the type of the data.
 */


DataMan.FilePath.prototype.type = function dataManFilePathType() {
  return this._type;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"data-man-url.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-data-man/server/data-man-url.js                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var request = require("request");
/**
 * @method DataMan.URL
 * @public
 * @constructor
 * @param {String} url
 * @param {String} type The data content (MIME) type.
 */


DataMan.URL = function DataManURL(url, type, options) {
  var self = this;
  options = options || {};
  self.url = url;
  self._type = type; // This is some code borrowed from the http package. Hopefully
  // we can eventually use HTTP pkg directly instead of 'request'
  // once it supports streams and buffers and such. (`request` takes
  // and `auth` option, too, but not of the same form as `HTTP`.)

  if (options.auth) {
    if (options.auth.indexOf(':') < 0) throw new Error('auth option should be of the form "username:password"');
    options.headers = options.headers || {};
    options.headers['Authorization'] = "Basic " + new Buffer(options.auth, "ascii").toString("base64");
    delete options.auth;
  }

  self.urlOpts = options;
};
/**
 * @method DataMan.URL.prototype.getBuffer
 * @private
 * @param {function} callback callback(err, buffer)
 * @returns {Buffer|undefined}
 *
 * Passes a Buffer representing the data at the URL to a callback.
 */


DataMan.URL.prototype.getBuffer = function dataManUrlGetBuffer(callback) {
  var self = this;
  request(_.extend({
    url: self.url,
    method: "GET",
    encoding: null,
    jar: false
  }, self.urlOpts), Meteor.bindEnvironment(function (err, res, body) {
    if (err) {
      callback(err);
    } else {
      self._type = res.headers['content-type'];
      callback(null, body);
    }
  }, function (err) {
    callback(err);
  }));
};
/**
 * @method DataMan.URL.prototype.getDataUri
 * @private
 * @param {function} callback callback(err, dataUri)
 *
 * Passes a data URI representing the data at the URL to a callback.
 */


DataMan.URL.prototype.getDataUri = function dataManUrlGetDataUri(callback) {
  var self = this;
  self.getBuffer(function (error, buffer) {
    if (error) {
      callback(error);
    } else {
      if (!self._type) {
        callback(new Error("DataMan.getDataUri couldn't get a contentType"));
      } else {
        var dataUri = "data:" + self._type + ";base64," + buffer.toString("base64");
        callback(null, dataUri);
      }
    }
  });
};
/**
 * @method DataMan.URL.prototype.createReadStream
 * @private
 *
 * Returns a read stream for the data.
 */


DataMan.URL.prototype.createReadStream = function dataManUrlCreateReadStream() {
  var self = this; // Stream from URL

  return request(_.extend({
    url: self.url,
    method: "GET"
  }, self.urlOpts));
};
/**
 * @method DataMan.URL.prototype.size
 * @param {function} callback callback(err, size)
 * @private
 *
 * Returns the size in bytes of the data at the URL.
 */


DataMan.URL.prototype.size = function dataManUrlSize(callback) {
  var self = this;

  if (typeof self._size === "number") {
    callback(null, self._size);
    return;
  }

  self.getBuffer(function (error, buffer) {
    if (error) {
      callback(error);
    } else {
      self._size = buffer.length;
      callback(null, self._size);
    }
  });
};
/**
 * @method DataMan.URL.prototype.type
 * @private
 *
 * Returns the type of the data.
 */


DataMan.URL.prototype.type = function dataManUrlType() {
  return this._type;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"data-man-readstream.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-data-man/server/data-man-readstream.js                                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
/* global DataMan */
var PassThrough = require('stream').PassThrough;
/**
 * @method DataMan.ReadStream
 * @public
 * @constructor
 * @param {ReadStream} stream
 * @param {String} type The data content (MIME) type.
 */


DataMan.ReadStream = function DataManBuffer(stream, type) {
  var self = this; // Create a bufferable / paused new stream...

  var pt = new PassThrough(); // Pipe provided read stream into pass-through stream

  stream.pipe(pt); // Set pass-through stream reference

  self.stream = pt; // Set type as provided

  self._type = type;
};
/**
 * @method DataMan.ReadStream.prototype.getBuffer
 * @private
 * @param {function} callback callback(err, buffer)
 * @returns {undefined}
 *
 * Passes a Buffer representing the data to a callback.
 */


DataMan.ReadStream.prototype.getBuffer = function dataManReadStreamGetBuffer()
/*callback*/
{// TODO implement as passthrough stream?
};
/**
 * @method DataMan.ReadStream.prototype.getDataUri
 * @private
 * @param {function} callback callback(err, dataUri)
 *
 * Passes a data URI representing the data in the stream to a callback.
 */


DataMan.ReadStream.prototype.getDataUri = function dataManReadStreamGetDataUri()
/*callback*/
{// TODO implement as passthrough stream?
};
/**
 * @method DataMan.ReadStream.prototype.createReadStream
 * @private
 *
 * Returns a read stream for the data.
 */


DataMan.ReadStream.prototype.createReadStream = function dataManReadStreamCreateReadStream() {
  return this.stream;
};
/**
 * @method DataMan.ReadStream.prototype.size
 * @param {function} callback callback(err, size)
 * @private
 *
 * Passes the size in bytes of the data in the stream to a callback.
 */


DataMan.ReadStream.prototype.size = function dataManReadStreamSize(callback) {
  callback(0); // will determine from stream later
};
/**
 * @method DataMan.ReadStream.prototype.type
 * @private
 *
 * Returns the type of the data.
 */


DataMan.ReadStream.prototype.type = function dataManReadStreamType() {
  return this._type;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:cfs-data-man/checkNpm.js");
require("/node_modules/meteor/steedos:cfs-data-man/server/data-man-api.js");
require("/node_modules/meteor/steedos:cfs-data-man/server/data-man-buffer.js");
require("/node_modules/meteor/steedos:cfs-data-man/server/data-man-datauri.js");
require("/node_modules/meteor/steedos:cfs-data-man/server/data-man-filepath.js");
require("/node_modules/meteor/steedos:cfs-data-man/server/data-man-url.js");
require("/node_modules/meteor/steedos:cfs-data-man/server/data-man-readstream.js");

/* Exports */
Package._define("steedos:cfs-data-man", {
  DataMan: DataMan
});

})();

//# sourceURL=meteor://💻app/packages/steedos_cfs-data-man.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtZGF0YS1tYW4vY2hlY2tOcG0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6Y2ZzLWRhdGEtbWFuL3NlcnZlci9kYXRhLW1hbi1hcGkuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6Y2ZzLWRhdGEtbWFuL3NlcnZlci9kYXRhLW1hbi1idWZmZXIuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6Y2ZzLWRhdGEtbWFuL3NlcnZlci9kYXRhLW1hbi1kYXRhdXJpLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zOmNmcy1kYXRhLW1hbi9zZXJ2ZXIvZGF0YS1tYW4tZmlsZXBhdGguanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6Y2ZzLWRhdGEtbWFuL3NlcnZlci9kYXRhLW1hbi11cmwuanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3M6Y2ZzLWRhdGEtbWFuL3NlcnZlci9kYXRhLW1hbi1yZWFkc3RyZWFtLmpzIl0sIm5hbWVzIjpbImNoZWNrTnBtVmVyc2lvbnMiLCJtb2R1bGUiLCJsaW5rIiwidiIsInJlcXVpcmUiLCJtaW1lIiwicmVxdWVzdCIsInRlbXAiLCJmcyIsIlJlYWRhYmxlIiwiRGF0YU1hbiIsImRhdGEiLCJ0eXBlIiwib3B0aW9ucyIsInNlbGYiLCJidWZmZXIiLCJFcnJvciIsIkJ1ZmZlciIsInNvdXJjZSIsIkFycmF5QnVmZmVyIiwiVWludDhBcnJheSIsIkVKU09OIiwiaXNCaW5hcnkiLCJSZWFkU3RyZWFtIiwic2xpY2UiLCJEYXRhVVJJIiwiVVJMIiwiRmlsZVBhdGgiLCJwcm90b3R5cGUiLCJnZXRCdWZmZXIiLCJkYXRhTWFuR2V0QnVmZmVyIiwiY2FsbGJhY2siLCJNZXRlb3IiLCJ3cmFwQXN5bmMiLCJiaW5kIiwiX3NhdmVUb0ZpbGUiLCJyZWFkU3RyZWFtIiwiZmlsZVBhdGgiLCJ3cml0ZVN0cmVhbSIsImNyZWF0ZVdyaXRlU3RyZWFtIiwib24iLCJiaW5kRW52aXJvbm1lbnQiLCJlcnJvciIsInBpcGUiLCJzYXZlVG9GaWxlIiwiZGF0YU1hblNhdmVUb0ZpbGUiLCJjcmVhdGVSZWFkU3RyZWFtIiwiZ2V0RGF0YVVyaSIsImRhdGFNYW5HZXREYXRhVXJpIiwiZGF0YU1hbkNyZWF0ZVJlYWRTdHJlYW0iLCJzaXplIiwiZGF0YU1hblNpemUiLCJkYXRhTWFuVHlwZSIsIkFycmF5IiwibmF0aXZlQmluZCIsIkZ1bmN0aW9uIiwiY3RvciIsImlzRnVuY3Rpb24iLCJvYmoiLCJPYmplY3QiLCJ0b1N0cmluZyIsImNhbGwiLCJmdW5jIiwiY29udGV4dCIsImFyZ3MiLCJib3VuZCIsImFwcGx5IiwiYXJndW1lbnRzIiwiVHlwZUVycm9yIiwiY29uY2F0IiwicmVzdWx0IiwiYnVmZmVyU3RyZWFtUmVhZGVyIiwiRGF0YU1hbkJ1ZmZlciIsIl90eXBlIiwiZGF0YU1hbkJ1ZmZlckdldEJ1ZmZlciIsImRhdGFNYW5CdWZmZXJHZXREYXRhVXJpIiwiZGF0YVVyaSIsImRhdGFNYW5CdWZmZXJDcmVhdGVSZWFkU3RyZWFtIiwiZGF0YU1hbkJ1ZmZlclNpemUiLCJfc2l6ZSIsImxlbmd0aCIsImRhdGFNYW5CdWZmZXJUeXBlIiwiRGF0YU1hbkRhdGFVUkkiLCJwaWVjZXMiLCJtYXRjaCIsIkRhdGFNYW5GaWxlUGF0aCIsImZpbGVwYXRoIiwibG9va3VwIiwiZGF0YU1hbkZpbGVQYXRoR2V0QnVmZmVyIiwicmVhZEZpbGUiLCJlcnIiLCJkYXRhTWFuRmlsZVBhdGhHZXREYXRhVXJpIiwiZGF0YU1hbkZpbGVQYXRoQ3JlYXRlUmVhZFN0cmVhbSIsImRhdGFNYW5GaWxlUGF0aFNpemUiLCJzdGF0Iiwic3RhdHMiLCJkYXRhTWFuRmlsZVBhdGhUeXBlIiwiRGF0YU1hblVSTCIsInVybCIsImF1dGgiLCJpbmRleE9mIiwiaGVhZGVycyIsInVybE9wdHMiLCJkYXRhTWFuVXJsR2V0QnVmZmVyIiwiXyIsImV4dGVuZCIsIm1ldGhvZCIsImVuY29kaW5nIiwiamFyIiwicmVzIiwiYm9keSIsImRhdGFNYW5VcmxHZXREYXRhVXJpIiwiZGF0YU1hblVybENyZWF0ZVJlYWRTdHJlYW0iLCJkYXRhTWFuVXJsU2l6ZSIsImRhdGFNYW5VcmxUeXBlIiwiUGFzc1Rocm91Z2giLCJzdHJlYW0iLCJwdCIsImRhdGFNYW5SZWFkU3RyZWFtR2V0QnVmZmVyIiwiZGF0YU1hblJlYWRTdHJlYW1HZXREYXRhVXJpIiwiZGF0YU1hblJlYWRTdHJlYW1DcmVhdGVSZWFkU3RyZWFtIiwiZGF0YU1hblJlYWRTdHJlYW1TaXplIiwiZGF0YU1hblJlYWRTdHJlYW1UeXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLGdCQUFKO0FBQXFCQyxNQUFNLENBQUNDLElBQVAsQ0FBWSxvQ0FBWixFQUFpRDtBQUFDRixrQkFBZ0IsQ0FBQ0csQ0FBRCxFQUFHO0FBQUNILG9CQUFnQixHQUFDRyxDQUFqQjtBQUFtQjs7QUFBeEMsQ0FBakQsRUFBMkYsQ0FBM0Y7O0FBQXJCO0FBQ0FDLE9BQU8sQ0FBQyxtQkFBRCxDQUFQOztBQUNBQSxPQUFPLENBQUMsbUJBQUQsQ0FBUDs7QUFHQUosZ0JBQWdCLENBQUM7QUFDaEJLLE1BQUksRUFBRSxRQURVO0FBRWhCLDBCQUF3QixPQUZSO0FBR2hCO0FBQ0E7QUFDQTtBQUNBQyxTQUFPLEVBQUUsU0FOTztBQU9oQkMsTUFBSSxFQUFFLE9BUFUsQ0FPRjs7QUFQRSxDQUFELEVBUWIsc0JBUmEsQ0FBaEIsQzs7Ozs7Ozs7Ozs7QUNMQTtBQUVBLElBQUlDLEVBQUUsR0FBR0osT0FBTyxDQUFDLElBQUQsQ0FBaEI7O0FBQ0EsSUFBSUssUUFBUSxHQUFHTCxPQUFPLENBQUMsUUFBRCxDQUFQLENBQWtCSyxRQUFqQztBQUVBOzs7Ozs7Ozs7O0FBUUFDLE9BQU8sR0FBRyxTQUFTQSxPQUFULENBQWlCQyxJQUFqQixFQUF1QkMsSUFB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Q0FBVCxHQUE2QztBQUMzRixTQUFPLEtBQUtKLE1BQVo7QUFDRCxDQUZEO0FBSUE7Ozs7Ozs7OztBQU9BMUcsT0FBTyxDQUFDYSxVQUFSLENBQW1CSyxTQUFuQixDQUE2QnNCLElBQTdCLEdBQW9DLFNBQVN1RSxxQkFBVCxDQUErQjFGLFFBQS9CLEVBQXlDO0FBQzNFQSxVQUFRLENBQUMsQ0FBRCxDQUFSLENBRDJFLENBQzlEO0FBQ2QsQ0FGRDtBQUlBOzs7Ozs7OztBQU1BckIsT0FBTyxDQUFDYSxVQUFSLENBQW1CSyxTQUFuQixDQUE2QmhCLElBQTdCLEdBQW9DLFNBQVM4RyxxQkFBVCxHQUFpQztBQUNuRSxTQUFPLEtBQUtqRCxLQUFaO0FBQ0QsQ0FGRCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9zdGVlZG9zX2Nmcy1kYXRhLW1hbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGZpeCB3YXJuaW5nOiB4eHggbm90IGluc3RhbGxlZFxyXG5yZXF1aXJlKFwibWltZS9wYWNrYWdlLmpzb25cIik7XHJcbnJlcXVpcmUoXCJ0ZW1wL3BhY2thZ2UuanNvblwiKTtcclxuXHJcbmltcG9ydCB7IGNoZWNrTnBtVmVyc2lvbnMgfSBmcm9tICdtZXRlb3IvdG1lYXNkYXk6Y2hlY2stbnBtLXZlcnNpb25zJztcclxuY2hlY2tOcG1WZXJzaW9ucyh7XHJcblx0bWltZTogXCJeMi4wLjJcIixcclxuXHQnYnVmZmVyLXN0cmVhbS1yZWFkZXInOiBcIjAuMS4xXCIsXHJcblx0Ly9yZXF1ZXN0OiBcIjIuNDQuMFwiLFxyXG5cdC8vIFdlIHVzZSBhIHNwZWNpZmljIGNvbW1pdCBmcm9tIGEgZm9yayBvZiBcInJlcXVlc3RcIiBwYWNrYWdlIGZvciBub3c7IHdlIG5lZWQgZml4IGZvclxyXG5cdC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9taWtlYWwvcmVxdWVzdC9pc3N1ZXMvODg3IChodHRwczovL2dpdGh1Yi5jb20vQ29sbGVjdGlvbkZTL01ldGVvci1Db2xsZWN0aW9uRlMvaXNzdWVzLzM0NylcclxuXHRyZXF1ZXN0OiBcIl4yLjgxLjBcIixcclxuXHR0ZW1wOiBcIjAuNy4wXCIgLy8gZm9yIHRlc3RzIG9ubHlcclxufSwgJ3N0ZWVkb3M6Y2ZzLWRhdGEtbWFuJyk7IiwiLyogZ2xvYmFsIERhdGFNYW46dHJ1ZSwgQnVmZmVyICovXHJcblxyXG52YXIgZnMgPSByZXF1aXJlKFwiZnNcIik7XHJcbnZhciBSZWFkYWJsZSA9IHJlcXVpcmUoJ3N0cmVhbScpLlJlYWRhYmxlO1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hblxyXG4gKiBAcHVibGljXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge0J1ZmZlcnxBcnJheUJ1ZmZlcnxVaW50OEFycmF5fFN0cmluZ30gZGF0YSBUaGUgZGF0YSB0aGF0IHlvdSB3YW50IHRvIG1hbmlwdWxhdGUuXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbdHlwZV0gVGhlIGRhdGEgY29udGVudCAoTUlNRSkgdHlwZSwgaWYga25vd24uIFJlcXVpcmVkIGlmIHRoZSBmaXJzdCBhcmd1bWVudCBpcyBhIEJ1ZmZlciwgQXJyYXlCdWZmZXIsIFVpbnQ4QXJyYXksIG9yIFVSTFxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIEN1cnJlbnRseSB1c2VkIG9ubHkgdG8gcGFzcyBvcHRpb25zIGZvciB0aGUgR0VUIHJlcXVlc3Qgd2hlbiBgZGF0YWAgaXMgYSBVUkwuXHJcbiAqL1xyXG5EYXRhTWFuID0gZnVuY3Rpb24gRGF0YU1hbihkYXRhLCB0eXBlLCBvcHRpb25zKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzLCBidWZmZXI7XHJcblxyXG4gIGlmICghZGF0YSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwiRGF0YU1hbiBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIGRhdGEgYXJndW1lbnRcIik7XHJcbiAgfVxyXG5cclxuICAvLyBUaGUgZW5kIHJlc3VsdCBvZiBhbGwgdGhpcyBpcyB0aGF0IHdlIHdpbGwgaGF2ZSB0aGlzLnNvdXJjZSBzZXQgdG8gYSBjb3JyZWN0XHJcbiAgLy8gZGF0YSB0eXBlIGhhbmRsZXIuIFdlIGFyZSBzaW1wbHkgZGV0ZWN0aW5nIHdoYXQgdGhlIGRhdGEgYXJnIGlzLlxyXG4gIC8vXHJcbiAgLy8gVW5sZXNzIHdlIGFscmVhZHkgaGF2ZSBpbi1tZW1vcnkgZGF0YSwgd2UgZG9uJ3QgbG9hZCBhbnl0aGluZyBpbnRvIG1lbW9yeVxyXG4gIC8vIGFuZCBpbnN0ZWFkIHJlbHkgb24gb2J0YWluaW5nIGEgcmVhZCBzdHJlYW0gd2hlbiB0aGUgdGltZSBjb21lcy5cclxuICBpZiAodHlwZW9mIEJ1ZmZlciAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkYXRhIGluc3RhbmNlb2YgQnVmZmVyKSB7XHJcbiAgICBpZiAoIXR5cGUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGF0YU1hbiBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIHR5cGUgYXJndW1lbnQgd2hlbiBwYXNzZWQgYSBCdWZmZXJcIik7XHJcbiAgICB9XHJcbiAgICBzZWxmLnNvdXJjZSA9IG5ldyBEYXRhTWFuLkJ1ZmZlcihkYXRhLCB0eXBlKTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgIGlmICh0eXBlb2YgQnVmZmVyID09PSBcInVuZGVmaW5lZFwiKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkJ1ZmZlciBzdXBwb3J0IHJlcXVpcmVkIHRvIGhhbmRsZSBhbiBBcnJheUJ1ZmZlclwiKTtcclxuICAgIH1cclxuICAgIGlmICghdHlwZSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEYXRhTWFuIGNvbnN0cnVjdG9yIHJlcXVpcmVzIGEgdHlwZSBhcmd1bWVudCB3aGVuIHBhc3NlZCBhbiBBcnJheUJ1ZmZlclwiKTtcclxuICAgIH1cclxuICAgIGJ1ZmZlciA9IG5ldyBCdWZmZXIobmV3IFVpbnQ4QXJyYXkoZGF0YSkpO1xyXG4gICAgc2VsZi5zb3VyY2UgPSBuZXcgRGF0YU1hbi5CdWZmZXIoYnVmZmVyLCB0eXBlKTtcclxuICB9IGVsc2UgaWYgKEVKU09OLmlzQmluYXJ5KGRhdGEpKSB7XHJcbiAgICBpZiAodHlwZW9mIEJ1ZmZlciA9PT0gXCJ1bmRlZmluZWRcIikge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJCdWZmZXIgc3VwcG9ydCByZXF1aXJlZCB0byBoYW5kbGUgYW4gQXJyYXlCdWZmZXJcIik7XHJcbiAgICB9XHJcbiAgICBpZiAoIXR5cGUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGF0YU1hbiBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIHR5cGUgYXJndW1lbnQgd2hlbiBwYXNzZWQgYSBVaW50OEFycmF5XCIpO1xyXG4gICAgfVxyXG4gICAgYnVmZmVyID0gbmV3IEJ1ZmZlcihkYXRhKTtcclxuICAgIHNlbGYuc291cmNlID0gbmV3IERhdGFNYW4uQnVmZmVyKGJ1ZmZlciwgdHlwZSk7XHJcbiAgfSBlbHNlIGlmICh0eXBlb2YgUmVhZGFibGUgIT09IFwidW5kZWZpbmVkXCIgJiYgZGF0YSBpbnN0YW5jZW9mIFJlYWRhYmxlKSB7XHJcbiAgICBpZiAoIXR5cGUpIHtcclxuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGF0YU1hbiBjb25zdHJ1Y3RvciByZXF1aXJlcyBhIHR5cGUgYXJndW1lbnQgd2hlbiBwYXNzZWQgYSBzdHJlYW0uUmVhZGFibGVcIik7XHJcbiAgICB9XHJcbiAgICBzZWxmLnNvdXJjZSA9IG5ldyBEYXRhTWFuLlJlYWRTdHJlYW0oZGF0YSwgdHlwZSk7XHJcbiAgfSBlbHNlIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgaWYgKGRhdGEuc2xpY2UoMCwgNSkgPT09IFwiZGF0YTpcIikge1xyXG4gICAgICBzZWxmLnNvdXJjZSA9IG5ldyBEYXRhTWFuLkRhdGFVUkkoZGF0YSk7XHJcbiAgICB9IGVsc2UgaWYgKGRhdGEuc2xpY2UoMCwgNSkgPT09IFwiaHR0cDpcIiB8fCBkYXRhLnNsaWNlKDAsIDYpID09PSBcImh0dHBzOlwiKSB7XHJcbiAgICAgIGlmICghdHlwZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkRhdGFNYW4gY29uc3RydWN0b3IgcmVxdWlyZXMgYSB0eXBlIGFyZ3VtZW50IHdoZW4gcGFzc2VkIGEgVVJMXCIpO1xyXG4gICAgICB9XHJcbiAgICAgIHNlbGYuc291cmNlID0gbmV3IERhdGFNYW4uVVJMKGRhdGEsIHR5cGUsIG9wdGlvbnMpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gYXNzdW1lIGl0J3MgYSBmaWxlcGF0aFxyXG4gICAgICBzZWxmLnNvdXJjZSA9IG5ldyBEYXRhTWFuLkZpbGVQYXRoKGRhdGEsIHR5cGUpO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJEYXRhTWFuIGNvbnN0cnVjdG9yIHJlY2VpdmVkIGRhdGEgdGhhdCBpdCBkb2Vzbid0IHN1cHBvcnRcIik7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5wcm90b3R5cGUuZ2V0QnVmZmVyXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXSBjYWxsYmFjayhlcnIsIGJ1ZmZlcilcclxuICogQHJldHVybnMge0J1ZmZlcnx1bmRlZmluZWR9XHJcbiAqXHJcbiAqIFJldHVybnMgYSBCdWZmZXIgcmVwcmVzZW50aW5nIHRoaXMgZGF0YSwgb3IgcGFzc2VzIHRoZSBCdWZmZXIgdG8gYSBjYWxsYmFjay5cclxuICovXHJcbkRhdGFNYW4ucHJvdG90eXBlLmdldEJ1ZmZlciA9IGZ1bmN0aW9uIGRhdGFNYW5HZXRCdWZmZXIoY2FsbGJhY2spIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgcmV0dXJuIGNhbGxiYWNrID8gc2VsZi5zb3VyY2UuZ2V0QnVmZmVyKGNhbGxiYWNrKSA6IE1ldGVvci53cmFwQXN5bmMoYmluZChzZWxmLnNvdXJjZS5nZXRCdWZmZXIsIHNlbGYuc291cmNlKSkoKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIF9zYXZlVG9GaWxlKHJlYWRTdHJlYW0sIGZpbGVQYXRoLCBjYWxsYmFjaykge1xyXG4gIHZhciB3cml0ZVN0cmVhbSA9IGZzLmNyZWF0ZVdyaXRlU3RyZWFtKGZpbGVQYXRoKTtcclxuICB3cml0ZVN0cmVhbS5vbignY2xvc2UnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uICgpIHtcclxuICAgIGNhbGxiYWNrKCk7XHJcbiAgfSwgZnVuY3Rpb24gKGVycm9yKSB7IGNhbGxiYWNrKGVycm9yKTsgfSkpO1xyXG4gIHdyaXRlU3RyZWFtLm9uKCdlcnJvcicsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICBjYWxsYmFjayhlcnJvcik7XHJcbiAgfSwgZnVuY3Rpb24gKGVycm9yKSB7IGNhbGxiYWNrKGVycm9yKTsgfSkpO1xyXG4gIHJlYWRTdHJlYW0ucGlwZSh3cml0ZVN0cmVhbSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIERhdGFNYW4ucHJvdG90eXBlLnNhdmVUb0ZpbGVcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge1N0cmluZ30gZmlsZVBhdGhcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICpcclxuICogU2F2ZXMgdGhpcyBkYXRhIHRvIGEgZmlsZXBhdGggb24gdGhlIGxvY2FsIGZpbGVzeXN0ZW0uXHJcbiAqL1xyXG5EYXRhTWFuLnByb3RvdHlwZS5zYXZlVG9GaWxlID0gZnVuY3Rpb24gZGF0YU1hblNhdmVUb0ZpbGUoZmlsZVBhdGgsIGNhbGxiYWNrKSB7XHJcbiAgdmFyIHJlYWRTdHJlYW0gPSB0aGlzLmNyZWF0ZVJlYWRTdHJlYW0oKTtcclxuICByZXR1cm4gY2FsbGJhY2sgPyBfc2F2ZVRvRmlsZShyZWFkU3RyZWFtLCBmaWxlUGF0aCwgY2FsbGJhY2spIDogTWV0ZW9yLndyYXBBc3luYyhfc2F2ZVRvRmlsZSkocmVhZFN0cmVhbSwgZmlsZVBhdGgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5wcm90b3R5cGUuZ2V0RGF0YVVyaVxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjYWxsYmFja10gY2FsbGJhY2soZXJyLCBkYXRhVXJpKVxyXG4gKlxyXG4gKiBJZiBubyBjYWxsYmFjaywgcmV0dXJucyB0aGUgZGF0YSBVUkkuXHJcbiAqL1xyXG5EYXRhTWFuLnByb3RvdHlwZS5nZXREYXRhVXJpID0gZnVuY3Rpb24gZGF0YU1hbkdldERhdGFVcmkoY2FsbGJhY2spIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgcmV0dXJuIGNhbGxiYWNrID8gc2VsZi5zb3VyY2UuZ2V0RGF0YVVyaShjYWxsYmFjaykgOiBNZXRlb3Iud3JhcEFzeW5jKGJpbmQoc2VsZi5zb3VyY2UuZ2V0RGF0YVVyaSwgc2VsZi5zb3VyY2UpKSgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5wcm90b3R5cGUuY3JlYXRlUmVhZFN0cmVhbVxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIFJldHVybnMgYSByZWFkIHN0cmVhbSBmb3IgdGhlIGRhdGEuXHJcbiAqL1xyXG5EYXRhTWFuLnByb3RvdHlwZS5jcmVhdGVSZWFkU3RyZWFtID0gZnVuY3Rpb24gZGF0YU1hbkNyZWF0ZVJlYWRTdHJlYW0oKSB7XHJcbiAgcmV0dXJuIHRoaXMuc291cmNlLmNyZWF0ZVJlYWRTdHJlYW0oKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIERhdGFNYW4ucHJvdG90eXBlLnNpemVcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBbY2FsbGJhY2tdIGNhbGxiYWNrKGVyciwgc2l6ZSlcclxuICpcclxuICogSWYgbm8gY2FsbGJhY2ssIHJldHVybnMgdGhlIHNpemUgaW4gYnl0ZXMgb2YgdGhlIGRhdGEuXHJcbiAqL1xyXG5EYXRhTWFuLnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24gZGF0YU1hblNpemUoY2FsbGJhY2spIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgcmV0dXJuIGNhbGxiYWNrID8gc2VsZi5zb3VyY2Uuc2l6ZShjYWxsYmFjaykgOiBNZXRlb3Iud3JhcEFzeW5jKGJpbmQoc2VsZi5zb3VyY2Uuc2l6ZSwgc2VsZi5zb3VyY2UpKSgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5wcm90b3R5cGUudHlwZVxyXG4gKiBAcHVibGljXHJcbiAqXHJcbiAqIFJldHVybnMgdGhlIHR5cGUgb2YgdGhlIGRhdGEuXHJcbiAqL1xyXG5EYXRhTWFuLnByb3RvdHlwZS50eXBlID0gZnVuY3Rpb24gZGF0YU1hblR5cGUoKSB7XHJcbiAgcmV0dXJuIHRoaXMuc291cmNlLnR5cGUoKTtcclxufTtcclxuXHJcbi8qXHJcbiAqIFwiYmluZFwiIHNoaW07IGZyb20gdW5kZXJzY29yZWpzLCBidXQgd2UgYXZvaWQgYSBkZXBlbmRlbmN5XHJcbiAqL1xyXG52YXIgc2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XHJcbnZhciBuYXRpdmVCaW5kID0gRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQ7XHJcbnZhciBjdG9yID0gZnVuY3Rpb24oKXt9O1xyXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKG9iaikge1xyXG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSA9PSAnW29iamVjdCBGdW5jdGlvbl0nO1xyXG59XHJcbmZ1bmN0aW9uIGJpbmQoZnVuYywgY29udGV4dCkge1xyXG4gIHZhciBhcmdzLCBib3VuZDtcclxuICBpZiAobmF0aXZlQmluZCAmJiBmdW5jLmJpbmQgPT09IG5hdGl2ZUJpbmQpIHJldHVybiBuYXRpdmVCaW5kLmFwcGx5KGZ1bmMsIHNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSk7XHJcbiAgaWYgKCFpc0Z1bmN0aW9uKGZ1bmMpKSB0aHJvdyBuZXcgVHlwZUVycm9yO1xyXG4gIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XHJcbiAgcmV0dXJuIGJvdW5kID0gZnVuY3Rpb24oKSB7XHJcbiAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgYm91bmQpKSByZXR1cm4gZnVuYy5hcHBseShjb250ZXh0LCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcclxuICAgIGN0b3IucHJvdG90eXBlID0gZnVuYy5wcm90b3R5cGU7XHJcbiAgICB2YXIgc2VsZiA9IG5ldyBjdG9yO1xyXG4gICAgY3Rvci5wcm90b3R5cGUgPSBudWxsO1xyXG4gICAgdmFyIHJlc3VsdCA9IGZ1bmMuYXBwbHkoc2VsZiwgYXJncy5jb25jYXQoc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XHJcbiAgICBpZiAoT2JqZWN0KHJlc3VsdCkgPT09IHJlc3VsdCkgcmV0dXJuIHJlc3VsdDtcclxuICAgIHJldHVybiBzZWxmO1xyXG4gIH07XHJcbn1cclxuIiwidmFyIGJ1ZmZlclN0cmVhbVJlYWRlciA9IHJlcXVpcmUoJ2J1ZmZlci1zdHJlYW0tcmVhZGVyJyk7XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBEYXRhTWFuLkJ1ZmZlclxyXG4gKiBAcHVibGljXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge0J1ZmZlcn0gYnVmZmVyXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFRoZSBkYXRhIGNvbnRlbnQgKE1JTUUpIHR5cGUuXHJcbiAqL1xyXG5EYXRhTWFuLkJ1ZmZlciA9IGZ1bmN0aW9uIERhdGFNYW5CdWZmZXIoYnVmZmVyLCB0eXBlKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHNlbGYuYnVmZmVyID0gYnVmZmVyO1xyXG4gIHNlbGYuX3R5cGUgPSB0eXBlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5CdWZmZXIucHJvdG90eXBlLmdldEJ1ZmZlclxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBjYWxsYmFjayhlcnIsIGJ1ZmZlcilcclxuICogQHJldHVybnMge0J1ZmZlcnx1bmRlZmluZWR9XHJcbiAqXHJcbiAqIFBhc3NlcyBhIEJ1ZmZlciByZXByZXNlbnRpbmcgdGhlIGRhdGEgdG8gYSBjYWxsYmFjay5cclxuICovXHJcbkRhdGFNYW4uQnVmZmVyLnByb3RvdHlwZS5nZXRCdWZmZXIgPSBmdW5jdGlvbiBkYXRhTWFuQnVmZmVyR2V0QnVmZmVyKGNhbGxiYWNrKSB7XHJcbiAgY2FsbGJhY2sobnVsbCwgdGhpcy5idWZmZXIpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5CdWZmZXIucHJvdG90eXBlLmdldERhdGFVcmlcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgY2FsbGJhY2soZXJyLCBkYXRhVXJpKVxyXG4gKlxyXG4gKiBQYXNzZXMgYSBkYXRhIFVSSSByZXByZXNlbnRpbmcgdGhlIGRhdGEgaW4gdGhlIGJ1ZmZlciB0byBhIGNhbGxiYWNrLlxyXG4gKi9cclxuRGF0YU1hbi5CdWZmZXIucHJvdG90eXBlLmdldERhdGFVcmkgPSBmdW5jdGlvbiBkYXRhTWFuQnVmZmVyR2V0RGF0YVVyaShjYWxsYmFjaykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICBpZiAoIXNlbGYuX3R5cGUpIHtcclxuICAgIGNhbGxiYWNrKG5ldyBFcnJvcihcIkRhdGFNYW4uZ2V0RGF0YVVyaSBjb3VsZG4ndCBnZXQgYSBjb250ZW50VHlwZVwiKSk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHZhciBkYXRhVXJpID0gXCJkYXRhOlwiICsgc2VsZi5fdHlwZSArIFwiO2Jhc2U2NCxcIiArIHNlbGYuYnVmZmVyLnRvU3RyaW5nKFwiYmFzZTY0XCIpO1xyXG4gICAgY2FsbGJhY2sobnVsbCwgZGF0YVVyaSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5CdWZmZXIucHJvdG90eXBlLmNyZWF0ZVJlYWRTdHJlYW1cclxuICogQHByaXZhdGVcclxuICpcclxuICogUmV0dXJucyBhIHJlYWQgc3RyZWFtIGZvciB0aGUgZGF0YS5cclxuICovXHJcbkRhdGFNYW4uQnVmZmVyLnByb3RvdHlwZS5jcmVhdGVSZWFkU3RyZWFtID0gZnVuY3Rpb24gZGF0YU1hbkJ1ZmZlckNyZWF0ZVJlYWRTdHJlYW0oKSB7XHJcbiAgcmV0dXJuIG5ldyBidWZmZXJTdHJlYW1SZWFkZXIodGhpcy5idWZmZXIpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5CdWZmZXIucHJvdG90eXBlLnNpemVcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgY2FsbGJhY2soZXJyLCBzaXplKVxyXG4gKiBAcHJpdmF0ZVxyXG4gKlxyXG4gKiBQYXNzZXMgdGhlIHNpemUgaW4gYnl0ZXMgb2YgdGhlIGRhdGEgaW4gdGhlIGJ1ZmZlciB0byBhIGNhbGxiYWNrLlxyXG4gKi9cclxuRGF0YU1hbi5CdWZmZXIucHJvdG90eXBlLnNpemUgPSBmdW5jdGlvbiBkYXRhTWFuQnVmZmVyU2l6ZShjYWxsYmFjaykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgaWYgKHR5cGVvZiBzZWxmLl9zaXplID09PSBcIm51bWJlclwiKSB7XHJcbiAgICBjYWxsYmFjayhudWxsLCBzZWxmLl9zaXplKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHNlbGYuX3NpemUgPSBzZWxmLmJ1ZmZlci5sZW5ndGg7XHJcbiAgY2FsbGJhY2sobnVsbCwgc2VsZi5fc2l6ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBEYXRhTWFuLkJ1ZmZlci5wcm90b3R5cGUudHlwZVxyXG4gKiBAcHJpdmF0ZVxyXG4gKlxyXG4gKiBSZXR1cm5zIHRoZSB0eXBlIG9mIHRoZSBkYXRhLlxyXG4gKi9cclxuRGF0YU1hbi5CdWZmZXIucHJvdG90eXBlLnR5cGUgPSBmdW5jdGlvbiBkYXRhTWFuQnVmZmVyVHlwZSgpIHtcclxuICByZXR1cm4gdGhpcy5fdHlwZTtcclxufTtcclxuIiwiLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5EYXRhVVJJXHJcbiAqIEBwdWJsaWNcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBkYXRhVXJpXHJcbiAqL1xyXG5EYXRhTWFuLkRhdGFVUkkgPSBmdW5jdGlvbiBEYXRhTWFuRGF0YVVSSShkYXRhVXJpKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciBwaWVjZXMgPSBkYXRhVXJpLm1hdGNoKC9eZGF0YTooLiopO2Jhc2U2NCwoLiopJC8pO1xyXG4gIHZhciBidWZmZXIgPSBuZXcgQnVmZmVyKHBpZWNlc1syXSwgJ2Jhc2U2NCcpO1xyXG4gIHJldHVybiBuZXcgRGF0YU1hbi5CdWZmZXIoYnVmZmVyLCBwaWVjZXNbMV0pO1xyXG59O1xyXG5cclxuRGF0YU1hbi5EYXRhVVJJLnByb3RvdHlwZSA9IERhdGFNYW4uQnVmZmVyLnByb3RvdHlwZTtcclxuIiwidmFyIG1pbWUgPSByZXF1aXJlKCdtaW1lJyk7XHJcbnZhciBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIERhdGFNYW4uRmlsZVBhdGhcclxuICogQHB1YmxpY1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtTdHJpbmd9IGZpbGVwYXRoXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbdHlwZV0gVGhlIGRhdGEgY29udGVudCAoTUlNRSkgdHlwZS4gV2lsbCBsb29rdXAgZnJvbSBmaWxlIGlmIG5vdCBwYXNzZWQuXHJcbiAqL1xyXG5EYXRhTWFuLkZpbGVQYXRoID0gZnVuY3Rpb24gRGF0YU1hbkZpbGVQYXRoKGZpbGVwYXRoLCB0eXBlKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHNlbGYuZmlsZXBhdGggPSBmaWxlcGF0aDtcclxuICBzZWxmLl90eXBlID0gdHlwZSB8fCBtaW1lLmxvb2t1cChmaWxlcGF0aCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBEYXRhTWFuLkZpbGVQYXRoLnByb3RvdHlwZS5nZXRCdWZmZXJcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgY2FsbGJhY2soZXJyLCBidWZmZXIpXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJ8dW5kZWZpbmVkfVxyXG4gKlxyXG4gKiBQYXNzZXMgYSBCdWZmZXIgcmVwcmVzZW50aW5nIHRoZSBkYXRhIHRvIGEgY2FsbGJhY2suXHJcbiAqL1xyXG5EYXRhTWFuLkZpbGVQYXRoLnByb3RvdHlwZS5nZXRCdWZmZXIgPSBmdW5jdGlvbiBkYXRhTWFuRmlsZVBhdGhHZXRCdWZmZXIoY2FsbGJhY2spIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIC8vIENhbGwgbm9kZSByZWFkRmlsZVxyXG4gIGZzLnJlYWRGaWxlKHNlbGYuZmlsZXBhdGgsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24oZXJyLCBidWZmZXIpIHtcclxuICAgIGNhbGxiYWNrKGVyciwgYnVmZmVyKTtcclxuICB9LCBmdW5jdGlvbihlcnIpIHtcclxuICAgIGNhbGxiYWNrKGVycik7XHJcbiAgfSkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5GaWxlUGF0aC5wcm90b3R5cGUuZ2V0RGF0YVVyaVxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBjYWxsYmFjayhlcnIsIGRhdGFVcmkpXHJcbiAqXHJcbiAqIFBhc3NlcyBhIGRhdGEgVVJJIHJlcHJlc2VudGluZyB0aGUgZGF0YSB0byBhIGNhbGxiYWNrLlxyXG4gKi9cclxuRGF0YU1hbi5GaWxlUGF0aC5wcm90b3R5cGUuZ2V0RGF0YVVyaSA9IGZ1bmN0aW9uIGRhdGFNYW5GaWxlUGF0aEdldERhdGFVcmkoY2FsbGJhY2spIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIHNlbGYuZ2V0QnVmZmVyKGZ1bmN0aW9uIChlcnJvciwgYnVmZmVyKSB7XHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgY2FsbGJhY2soZXJyb3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKCFzZWxmLl90eXBlKSB7XHJcbiAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiRGF0YU1hbi5nZXREYXRhVXJpIGNvdWxkbid0IGdldCBhIGNvbnRlbnRUeXBlXCIpKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgZGF0YVVyaSA9IFwiZGF0YTpcIiArIHNlbGYuX3R5cGUgKyBcIjtiYXNlNjQsXCIgKyBidWZmZXIudG9TdHJpbmcoXCJiYXNlNjRcIik7XHJcbiAgICAgICAgYnVmZmVyID0gbnVsbDtcclxuICAgICAgICBjYWxsYmFjayhudWxsLCBkYXRhVXJpKTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5GaWxlUGF0aC5wcm90b3R5cGUuY3JlYXRlUmVhZFN0cmVhbVxyXG4gKiBAcHJpdmF0ZVxyXG4gKlxyXG4gKiBSZXR1cm5zIGEgcmVhZCBzdHJlYW0gZm9yIHRoZSBkYXRhLlxyXG4gKi9cclxuRGF0YU1hbi5GaWxlUGF0aC5wcm90b3R5cGUuY3JlYXRlUmVhZFN0cmVhbSA9IGZ1bmN0aW9uIGRhdGFNYW5GaWxlUGF0aENyZWF0ZVJlYWRTdHJlYW0oKSB7XHJcbiAgLy8gU3RyZWFtIGZyb20gZmlsZXN5c3RlbVxyXG4gIHJldHVybiBmcy5jcmVhdGVSZWFkU3RyZWFtKHRoaXMuZmlsZXBhdGgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5GaWxlUGF0aC5wcm90b3R5cGUuc2l6ZVxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBjYWxsYmFjayhlcnIsIHNpemUpXHJcbiAqIEBwcml2YXRlXHJcbiAqXHJcbiAqIFBhc3NlcyB0aGUgc2l6ZSBpbiBieXRlcyBvZiB0aGUgZGF0YSB0byBhIGNhbGxiYWNrLlxyXG4gKi9cclxuRGF0YU1hbi5GaWxlUGF0aC5wcm90b3R5cGUuc2l6ZSA9IGZ1bmN0aW9uIGRhdGFNYW5GaWxlUGF0aFNpemUoY2FsbGJhY2spIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIGlmICh0eXBlb2Ygc2VsZi5fc2l6ZSA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgY2FsbGJhY2sobnVsbCwgc2VsZi5fc2l6ZSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvLyBXZSBjYW4gZ2V0IHRoZSBzaXplIHdpdGhvdXQgYnVmZmVyaW5nXHJcbiAgZnMuc3RhdChzZWxmLmZpbGVwYXRoLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uIChlcnJvciwgc3RhdHMpIHtcclxuICAgIGlmIChzdGF0cyAmJiB0eXBlb2Ygc3RhdHMuc2l6ZSA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgICBzZWxmLl9zaXplID0gc3RhdHMuc2l6ZTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgc2VsZi5fc2l6ZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjYWxsYmFjayhlcnJvcik7XHJcbiAgICB9XHJcbiAgfSwgZnVuY3Rpb24gKGVycm9yKSB7XHJcbiAgICBjYWxsYmFjayhlcnJvcik7XHJcbiAgfSkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRGF0YU1hbi5GaWxlUGF0aC5wcm90b3R5cGUudHlwZVxyXG4gKiBAcHJpdmF0ZVxyXG4gKlxyXG4gKiBSZXR1cm5zIHRoZSB0eXBlIG9mIHRoZSBkYXRhLlxyXG4gKi9cclxuRGF0YU1hbi5GaWxlUGF0aC5wcm90b3R5cGUudHlwZSA9IGZ1bmN0aW9uIGRhdGFNYW5GaWxlUGF0aFR5cGUoKSB7XHJcbiAgcmV0dXJuIHRoaXMuX3R5cGU7XHJcbn07XHJcbiIsInZhciByZXF1ZXN0ID0gcmVxdWlyZShcInJlcXVlc3RcIik7XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBEYXRhTWFuLlVSTFxyXG4gKiBAcHVibGljXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB0eXBlIFRoZSBkYXRhIGNvbnRlbnQgKE1JTUUpIHR5cGUuXHJcbiAqL1xyXG5EYXRhTWFuLlVSTCA9IGZ1bmN0aW9uIERhdGFNYW5VUkwodXJsLCB0eXBlLCBvcHRpb25zKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICBzZWxmLnVybCA9IHVybDtcclxuICBzZWxmLl90eXBlID0gdHlwZTtcclxuXHJcbiAgLy8gVGhpcyBpcyBzb21lIGNvZGUgYm9ycm93ZWQgZnJvbSB0aGUgaHR0cCBwYWNrYWdlLiBIb3BlZnVsbHlcclxuICAvLyB3ZSBjYW4gZXZlbnR1YWxseSB1c2UgSFRUUCBwa2cgZGlyZWN0bHkgaW5zdGVhZCBvZiAncmVxdWVzdCdcclxuICAvLyBvbmNlIGl0IHN1cHBvcnRzIHN0cmVhbXMgYW5kIGJ1ZmZlcnMgYW5kIHN1Y2guIChgcmVxdWVzdGAgdGFrZXNcclxuICAvLyBhbmQgYGF1dGhgIG9wdGlvbiwgdG9vLCBidXQgbm90IG9mIHRoZSBzYW1lIGZvcm0gYXMgYEhUVFBgLilcclxuICBpZiAob3B0aW9ucy5hdXRoKSB7XHJcbiAgICBpZiAob3B0aW9ucy5hdXRoLmluZGV4T2YoJzonKSA8IDApXHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignYXV0aCBvcHRpb24gc2hvdWxkIGJlIG9mIHRoZSBmb3JtIFwidXNlcm5hbWU6cGFzc3dvcmRcIicpO1xyXG4gICAgb3B0aW9ucy5oZWFkZXJzID0gb3B0aW9ucy5oZWFkZXJzIHx8IHt9O1xyXG4gICAgb3B0aW9ucy5oZWFkZXJzWydBdXRob3JpemF0aW9uJ10gPSBcIkJhc2ljIFwiK1xyXG4gICAgICAobmV3IEJ1ZmZlcihvcHRpb25zLmF1dGgsIFwiYXNjaWlcIikpLnRvU3RyaW5nKFwiYmFzZTY0XCIpO1xyXG4gICAgZGVsZXRlIG9wdGlvbnMuYXV0aDtcclxuICB9XHJcblxyXG4gIHNlbGYudXJsT3B0cyA9IG9wdGlvbnM7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBEYXRhTWFuLlVSTC5wcm90b3R5cGUuZ2V0QnVmZmVyXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIGNhbGxiYWNrKGVyciwgYnVmZmVyKVxyXG4gKiBAcmV0dXJucyB7QnVmZmVyfHVuZGVmaW5lZH1cclxuICpcclxuICogUGFzc2VzIGEgQnVmZmVyIHJlcHJlc2VudGluZyB0aGUgZGF0YSBhdCB0aGUgVVJMIHRvIGEgY2FsbGJhY2suXHJcbiAqL1xyXG5EYXRhTWFuLlVSTC5wcm90b3R5cGUuZ2V0QnVmZmVyID0gZnVuY3Rpb24gZGF0YU1hblVybEdldEJ1ZmZlcihjYWxsYmFjaykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgcmVxdWVzdChfLmV4dGVuZCh7XHJcbiAgICB1cmw6IHNlbGYudXJsLFxyXG4gICAgbWV0aG9kOiBcIkdFVFwiLFxyXG4gICAgZW5jb2Rpbmc6IG51bGwsXHJcbiAgICBqYXI6IGZhbHNlXHJcbiAgfSwgc2VsZi51cmxPcHRzKSwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbihlcnIsIHJlcywgYm9keSkge1xyXG4gICAgaWYgKGVycikge1xyXG4gICAgICBjYWxsYmFjayhlcnIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgc2VsZi5fdHlwZSA9IHJlcy5oZWFkZXJzWydjb250ZW50LXR5cGUnXTtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgYm9keSk7XHJcbiAgICB9XHJcbiAgfSwgZnVuY3Rpb24oZXJyKSB7XHJcbiAgICBjYWxsYmFjayhlcnIpO1xyXG4gIH0pKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIERhdGFNYW4uVVJMLnByb3RvdHlwZS5nZXREYXRhVXJpXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGNhbGxiYWNrIGNhbGxiYWNrKGVyciwgZGF0YVVyaSlcclxuICpcclxuICogUGFzc2VzIGEgZGF0YSBVUkkgcmVwcmVzZW50aW5nIHRoZSBkYXRhIGF0IHRoZSBVUkwgdG8gYSBjYWxsYmFjay5cclxuICovXHJcbkRhdGFNYW4uVVJMLnByb3RvdHlwZS5nZXREYXRhVXJpID0gZnVuY3Rpb24gZGF0YU1hblVybEdldERhdGFVcmkoY2FsbGJhY2spIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIHNlbGYuZ2V0QnVmZmVyKGZ1bmN0aW9uIChlcnJvciwgYnVmZmVyKSB7XHJcbiAgICBpZiAoZXJyb3IpIHtcclxuICAgICAgY2FsbGJhY2soZXJyb3IpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKCFzZWxmLl90eXBlKSB7XHJcbiAgICAgICAgY2FsbGJhY2sobmV3IEVycm9yKFwiRGF0YU1hbi5nZXREYXRhVXJpIGNvdWxkbid0IGdldCBhIGNvbnRlbnRUeXBlXCIpKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICB2YXIgZGF0YVVyaSA9IFwiZGF0YTpcIiArIHNlbGYuX3R5cGUgKyBcIjtiYXNlNjQsXCIgKyBidWZmZXIudG9TdHJpbmcoXCJiYXNlNjRcIik7XHJcbiAgICAgICAgY2FsbGJhY2sobnVsbCwgZGF0YVVyaSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIERhdGFNYW4uVVJMLnByb3RvdHlwZS5jcmVhdGVSZWFkU3RyZWFtXHJcbiAqIEBwcml2YXRlXHJcbiAqXHJcbiAqIFJldHVybnMgYSByZWFkIHN0cmVhbSBmb3IgdGhlIGRhdGEuXHJcbiAqL1xyXG5EYXRhTWFuLlVSTC5wcm90b3R5cGUuY3JlYXRlUmVhZFN0cmVhbSA9IGZ1bmN0aW9uIGRhdGFNYW5VcmxDcmVhdGVSZWFkU3RyZWFtKCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICAvLyBTdHJlYW0gZnJvbSBVUkxcclxuICByZXR1cm4gcmVxdWVzdChfLmV4dGVuZCh7XHJcbiAgICB1cmw6IHNlbGYudXJsLFxyXG4gICAgbWV0aG9kOiBcIkdFVFwiXHJcbiAgfSwgc2VsZi51cmxPcHRzKSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBEYXRhTWFuLlVSTC5wcm90b3R5cGUuc2l6ZVxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBjYWxsYmFjayhlcnIsIHNpemUpXHJcbiAqIEBwcml2YXRlXHJcbiAqXHJcbiAqIFJldHVybnMgdGhlIHNpemUgaW4gYnl0ZXMgb2YgdGhlIGRhdGEgYXQgdGhlIFVSTC5cclxuICovXHJcbkRhdGFNYW4uVVJMLnByb3RvdHlwZS5zaXplID0gZnVuY3Rpb24gZGF0YU1hblVybFNpemUoY2FsbGJhY2spIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIGlmICh0eXBlb2Ygc2VsZi5fc2l6ZSA9PT0gXCJudW1iZXJcIikge1xyXG4gICAgY2FsbGJhY2sobnVsbCwgc2VsZi5fc2l6ZSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBzZWxmLmdldEJ1ZmZlcihmdW5jdGlvbiAoZXJyb3IsIGJ1ZmZlcikge1xyXG4gICAgaWYgKGVycm9yKSB7XHJcbiAgICAgIGNhbGxiYWNrKGVycm9yKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNlbGYuX3NpemUgPSBidWZmZXIubGVuZ3RoO1xyXG4gICAgICBjYWxsYmFjayhudWxsLCBzZWxmLl9zaXplKTtcclxuICAgIH1cclxuICB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIERhdGFNYW4uVVJMLnByb3RvdHlwZS50eXBlXHJcbiAqIEBwcml2YXRlXHJcbiAqXHJcbiAqIFJldHVybnMgdGhlIHR5cGUgb2YgdGhlIGRhdGEuXHJcbiAqL1xyXG5EYXRhTWFuLlVSTC5wcm90b3R5cGUudHlwZSA9IGZ1bmN0aW9uIGRhdGFNYW5VcmxUeXBlKCkge1xyXG4gIHJldHVybiB0aGlzLl90eXBlO1xyXG59O1xyXG4iLCIvKiBnbG9iYWwgRGF0YU1hbiAqL1xyXG5cclxudmFyIFBhc3NUaHJvdWdoID0gcmVxdWlyZSgnc3RyZWFtJykuUGFzc1Rocm91Z2g7XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBEYXRhTWFuLlJlYWRTdHJlYW1cclxuICogQHB1YmxpY1xyXG4gKiBAY29uc3RydWN0b3JcclxuICogQHBhcmFtIHtSZWFkU3RyZWFtfSBzdHJlYW1cclxuICogQHBhcmFtIHtTdHJpbmd9IHR5cGUgVGhlIGRhdGEgY29udGVudCAoTUlNRSkgdHlwZS5cclxuICovXHJcbkRhdGFNYW4uUmVhZFN0cmVhbSA9IGZ1bmN0aW9uIERhdGFNYW5CdWZmZXIoc3RyZWFtLCB0eXBlKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAvLyBDcmVhdGUgYSBidWZmZXJhYmxlIC8gcGF1c2VkIG5ldyBzdHJlYW0uLi5cclxuICB2YXIgcHQgPSBuZXcgUGFzc1Rocm91Z2goKTtcclxuXHJcbiAgLy8gUGlwZSBwcm92aWRlZCByZWFkIHN0cmVhbSBpbnRvIHBhc3MtdGhyb3VnaCBzdHJlYW1cclxuICBzdHJlYW0ucGlwZShwdCk7XHJcblxyXG4gIC8vIFNldCBwYXNzLXRocm91Z2ggc3RyZWFtIHJlZmVyZW5jZVxyXG4gIHNlbGYuc3RyZWFtID0gcHQ7XHJcblxyXG4gIC8vIFNldCB0eXBlIGFzIHByb3ZpZGVkXHJcbiAgc2VsZi5fdHlwZSA9IHR5cGU7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBEYXRhTWFuLlJlYWRTdHJlYW0ucHJvdG90eXBlLmdldEJ1ZmZlclxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBjYWxsYmFjayhlcnIsIGJ1ZmZlcilcclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICpcclxuICogUGFzc2VzIGEgQnVmZmVyIHJlcHJlc2VudGluZyB0aGUgZGF0YSB0byBhIGNhbGxiYWNrLlxyXG4gKi9cclxuRGF0YU1hbi5SZWFkU3RyZWFtLnByb3RvdHlwZS5nZXRCdWZmZXIgPSBmdW5jdGlvbiBkYXRhTWFuUmVhZFN0cmVhbUdldEJ1ZmZlcigvKmNhbGxiYWNrKi8pIHtcclxuICAvLyBUT0RPIGltcGxlbWVudCBhcyBwYXNzdGhyb3VnaCBzdHJlYW0/XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBEYXRhTWFuLlJlYWRTdHJlYW0ucHJvdG90eXBlLmdldERhdGFVcmlcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2sgY2FsbGJhY2soZXJyLCBkYXRhVXJpKVxyXG4gKlxyXG4gKiBQYXNzZXMgYSBkYXRhIFVSSSByZXByZXNlbnRpbmcgdGhlIGRhdGEgaW4gdGhlIHN0cmVhbSB0byBhIGNhbGxiYWNrLlxyXG4gKi9cclxuRGF0YU1hbi5SZWFkU3RyZWFtLnByb3RvdHlwZS5nZXREYXRhVXJpID0gZnVuY3Rpb24gZGF0YU1hblJlYWRTdHJlYW1HZXREYXRhVXJpKC8qY2FsbGJhY2sqLykge1xyXG4gIC8vIFRPRE8gaW1wbGVtZW50IGFzIHBhc3N0aHJvdWdoIHN0cmVhbT9cclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIERhdGFNYW4uUmVhZFN0cmVhbS5wcm90b3R5cGUuY3JlYXRlUmVhZFN0cmVhbVxyXG4gKiBAcHJpdmF0ZVxyXG4gKlxyXG4gKiBSZXR1cm5zIGEgcmVhZCBzdHJlYW0gZm9yIHRoZSBkYXRhLlxyXG4gKi9cclxuRGF0YU1hbi5SZWFkU3RyZWFtLnByb3RvdHlwZS5jcmVhdGVSZWFkU3RyZWFtID0gZnVuY3Rpb24gZGF0YU1hblJlYWRTdHJlYW1DcmVhdGVSZWFkU3RyZWFtKCkge1xyXG4gIHJldHVybiB0aGlzLnN0cmVhbTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIERhdGFNYW4uUmVhZFN0cmVhbS5wcm90b3R5cGUuc2l6ZVxyXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBjYWxsYmFjayBjYWxsYmFjayhlcnIsIHNpemUpXHJcbiAqIEBwcml2YXRlXHJcbiAqXHJcbiAqIFBhc3NlcyB0aGUgc2l6ZSBpbiBieXRlcyBvZiB0aGUgZGF0YSBpbiB0aGUgc3RyZWFtIHRvIGEgY2FsbGJhY2suXHJcbiAqL1xyXG5EYXRhTWFuLlJlYWRTdHJlYW0ucHJvdG90eXBlLnNpemUgPSBmdW5jdGlvbiBkYXRhTWFuUmVhZFN0cmVhbVNpemUoY2FsbGJhY2spIHtcclxuICBjYWxsYmFjaygwKTsgLy8gd2lsbCBkZXRlcm1pbmUgZnJvbSBzdHJlYW0gbGF0ZXJcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIERhdGFNYW4uUmVhZFN0cmVhbS5wcm90b3R5cGUudHlwZVxyXG4gKiBAcHJpdmF0ZVxyXG4gKlxyXG4gKiBSZXR1cm5zIHRoZSB0eXBlIG9mIHRoZSBkYXRhLlxyXG4gKi9cclxuRGF0YU1hbi5SZWFkU3RyZWFtLnByb3RvdHlwZS50eXBlID0gZnVuY3Rpb24gZGF0YU1hblJlYWRTdHJlYW1UeXBlKCkge1xyXG4gIHJldHVybiB0aGlzLl90eXBlO1xyXG59O1xyXG4iXX0=
