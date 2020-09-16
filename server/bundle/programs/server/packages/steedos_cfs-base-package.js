(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var _ = Package.underscore._;
var EJSON = Package.ejson.EJSON;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var FS, _Utility;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:cfs-base-package":{"base-common.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_cfs-base-package/base-common.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// Exported namespace
FS = {}; // namespace for adapters; XXX should this be added by cfs-storage-adapter pkg instead?

FS.Store = {
  GridFS: function () {
    throw new Error('To use FS.Store.GridFS, you must add the "steedos:cfs-gridfs" package.');
  },
  FileSystem: function () {
    throw new Error('To use FS.Store.FileSystem, you must add the "steedos:cfs-filesystem" package.');
  },
  S3: function () {
    throw new Error('To use FS.Store.S3, you must add the "steedos:cfs-s3" package.');
  },
  WABS: function () {
    throw new Error('To use FS.Store.WABS, you must add the "steedos:cfs-wabs" package.');
  },
  Dropbox: function () {
    throw new Error('To use FS.Store.Dropbox, you must add the "steedos:cfs-dropbox" package.');
  }
}; // namespace for access points

FS.AccessPoint = {}; // namespace for utillities

FS.Utility = {}; // A general place for any package to store global config settings

FS.config = {}; // An internal collection reference

FS._collections = {}; // Test scope

_Utility = {}; // #############################################################################
//
// HELPERS
//
// #############################################################################

/** @method _Utility.defaultZero
 * @private
  * @param {Any} val Returns number or 0 if value is a falsy
  */

_Utility.defaultZero = function (val) {
  return +(val || 0);
};
/**
 * @method FS.Utility.cloneFileRecord
 * @public
 * @param {FS.File|FS.Collection filerecord} rec
 * @param {Object} [options]
 * @param {Boolean} [options.full=false] Set `true` to prevent certain properties from being omitted from the clone.
 * @returns {Object} Cloned filerecord
 *
 * Makes a shallow clone of `rec`, filtering out some properties that might be present if
 * it's an FS.File instance, but which we never want to be part of the stored
 * filerecord.
 *
 * This is a blacklist clone rather than a whitelist because we want the user to be able
 * to specify whatever additional properties they wish.
 *
 * In general, we expect the following whitelist properties used by the internal and
 * external APIs:
 *
 * _id, name, size, type, chunkCount, chunkSize, chunkSum, copies, createdAt, updatedAt, uploadedAt
 *
 * Those properties, and any additional properties added by the user, should be present
 * in the returned object, which is suitable for inserting into the backing collection or
 * extending an FS.File instance.
 *
 */


FS.Utility.cloneFileRecord = function (rec, options) {
  options = options || {};
  var result = {}; // We use this method for two purposes. If using it to clone one FS.File into another, then
  // we want a full clone. But if using it to get a filerecord object for inserting into the
  // internal collection, then there are certain properties we want to omit so that they aren't
  // stored in the collection.

  var omit = options.full ? [] : ['collectionName', 'collection', 'data', 'createdByTransform'];

  for (var prop in rec) {
    if (rec.hasOwnProperty(prop) && !_.contains(omit, prop)) {
      result[prop] = rec[prop];
    }
  }

  return result;
};
/**
 * @method FS.Utility.defaultCallback
 * @public
 * @param {Error} [err]
 * @returns {undefined}
 *
 * Can be used as a default callback for client methods that need a callback.
 * Simply throws the provided error if there is one.
 */


FS.Utility.defaultCallback = function defaultCallback(err) {
  if (err) {
    // Show gentle error if Meteor error
    if (err instanceof Meteor.Error) {
      console.error(err.message);
    } else {
      // Normal error, just throw error
      throw err;
    }
  }
};
/**
 * @method FS.Utility.defaultCallback
 * @public
 * @param {Function} [f] A callback function, if you have one. Can be undefined or null.
 * @param {Meteor.Error | Error | String} [err] Error or error message (string)
 * @returns {Any} the callback result if any
 *
 * Handle Error, creates an Error instance with the given text. If callback is
 * a function, passes the error to that function. Otherwise throws it. Useful
 * for dealing with errors in methods that optionally accept a callback.
 */


FS.Utility.handleError = function (f, err, result) {
  // Set callback
  var callback = typeof f === 'function' ? f : FS.Utility.defaultCallback; // Set the err

  var error = err === '' + err ? new Error(err) : err; // callback

  return callback(error, result);
};
/**
 * @method FS.Utility.noop
 * @public
 * Use this to hand a no operation / empty function
 */


FS.Utility.noop = function () {};
/**
 * @method validateAction
 * @private
 * @param {Object} validators - The validators object to use, with `deny` and `allow` properties.
 * @param {FS.File} fileObj - Mounted or mountable file object to be passed to validators.
 * @param {String} userId - The ID of the user who is attempting the action.
 * @returns {undefined}
 *
 * Throws a "400-Bad Request" Meteor error if the file is not mounted or
 * a "400-Access denied" Meteor error if the action is not allowed.
 */


FS.Utility.validateAction = function validateAction(validators, fileObj, userId) {
  var denyValidators = validators.deny;
  var allowValidators = validators.allow; // If insecure package is used and there are no validators defined,
  // allow the action.

  if (typeof Package === 'object' && Package.insecure && denyValidators.length + allowValidators.length === 0) {
    return;
  } // If already mounted, validators should receive a fileObj
  // that is fully populated


  if (fileObj.isMounted()) {
    fileObj.getFileRecord();
  } // Any deny returns true means denied.


  if (_.any(denyValidators, function (validator) {
    return validator(userId, fileObj);
  })) {
    throw new Meteor.Error(403, "Access denied");
  } // Any allow returns true means proceed. Throw error if they all fail.


  if (_.all(allowValidators, function (validator) {
    return !validator(userId, fileObj);
  })) {
    throw new Meteor.Error(403, "Access denied");
  }
};
/**
 * @method FS.Utility.getFileName
 * @private
 * @param {String} name - A filename, filepath, or URL
 * @returns {String} The filename without the URL, filepath, or query string
 */


FS.Utility.getFileName = function utilGetFileName(name) {
  // in case it's a URL, strip off potential query string
  // should have no effect on filepath
  name = name.split('?')[0]; // strip off beginning path or url

  var lastSlash = name.lastIndexOf('/');

  if (lastSlash !== -1) {
    name = name.slice(lastSlash + 1);
  }

  return name;
};
/**
 * @method FS.Utility.getFileExtension
 * @public
 * @param {String} name - A filename, filepath, or URL that may or may not have an extension.
 * @returns {String} The extension or an empty string if no extension found.
 */


FS.Utility.getFileExtension = function utilGetFileExtension(name) {
  name = FS.Utility.getFileName(name); // Seekout the last '.' if found

  var found = name.lastIndexOf('.'); // Return the extension if found else ''
  // If found is -1, we return '' because there is no extension
  // If found is 0, we return '' because it's a hidden file

  return found > 0 ? name.slice(found + 1).toLowerCase() : '';
};
/**
 * @method FS.Utility.setFileExtension
 * @public
 * @param {String} name - A filename that may or may not already have an extension.
 * @param {String} ext - An extension without leading period, which you want to be the new extension on `name`.
 * @returns {String} The filename with changed extension.
 */


FS.Utility.setFileExtension = function utilSetFileExtension(name, ext) {
  if (!name || !name.length) {
    return name;
  }

  var currentExt = FS.Utility.getFileExtension(name);

  if (currentExt.length) {
    name = name.slice(0, currentExt.length * -1) + ext;
  } else {
    name = name + '.' + ext;
  }

  return name;
};
/*
 * Borrowed these from http package
 */


FS.Utility.encodeParams = function encodeParams(params) {
  var buf = [];

  _.each(params, function (value, key) {
    if (buf.length) buf.push('&');
    buf.push(FS.Utility.encodeString(key), '=', FS.Utility.encodeString(value));
  });

  return buf.join('').replace(/%20/g, '+');
};

FS.Utility.encodeString = function encodeString(str) {
  return encodeURIComponent(str).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");
};
/*
 * btoa and atob shims for client and server
 */


FS.Utility._btoa = function _fsUtility_btoa(str) {
  var buffer;

  if (str instanceof Buffer) {
    buffer = str;
  } else {
    buffer = new Buffer(str.toString(), 'binary');
  }

  return buffer.toString('base64');
};

FS.Utility.btoa = function fsUtility_btoa(str) {
  if (typeof btoa === 'function') {
    // Client
    return btoa(str);
  } else if (typeof Buffer !== 'undefined') {
    // Server
    return FS.Utility._btoa(str);
  } else {
    throw new Error('FS.Utility.btoa: Cannot base64 encode on your system');
  }
};

FS.Utility._atob = function _fsUtility_atob(str) {
  return new Buffer(str, 'base64').toString('binary');
};

FS.Utility.atob = function fsUtility_atob(str) {
  if (typeof atob === 'function') {
    // Client
    return atob(str);
  } else if (typeof Buffer !== 'undefined') {
    // Server
    return FS.Utility._atob(str);
  } else {
    throw new Error('FS.Utility.atob: Cannot base64 encode on your system');
  }
}; // Api wrap for 3party libs like underscore


FS.Utility.extend = _.extend;
FS.Utility.each = _.each;
FS.Utility.isEmpty = _.isEmpty;
FS.Utility.indexOf = _.indexOf;
FS.Utility.isArray = _.isArray;
FS.Utility.map = _.map;
FS.Utility.once = _.once;
FS.Utility.include = _.include;
FS.Utility.size = _.size;
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"base-server.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_cfs-base-package/base-server.js                                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/**
 * @method FS.Utility.binaryToBuffer
 * @public
 * @param {Uint8Array} data
 * @returns {Buffer}
 *
 * Converts a Uint8Array instance to a Node Buffer instance
 */
FS.Utility.binaryToBuffer = function (data) {
  var len = data.length;
  var buffer = new Buffer(len);

  for (var i = 0; i < len; i++) {
    buffer[i] = data[i];
  }

  return buffer;
};
/**
 * @method FS.Utility.bufferToBinary
 * @public
 * @param {Buffer} data
 * @returns {Uint8Array}
 *
 * Converts a Node Buffer instance to a Uint8Array instance
 */


FS.Utility.bufferToBinary = function (data) {
  var len = data.length;
  var binary = EJSON.newBinary(len);

  for (var i = 0; i < len; i++) {
    binary[i] = data[i];
  }

  return binary;
};
/**
 * @method FS.Utility.safeCallback
 * @public
 * @param {Function} callback
 * @returns {Function}
 *
 * Makes a callback safe for Meteor code
 */


FS.Utility.safeCallback = function (callback) {
  return Meteor.bindEnvironment(callback, function (err) {
    throw err;
  });
};
/**
 * @method FS.Utility.safeStream
 * @public
 * @param {Stream} nodestream
 * @returns {Stream}
 *
 * Adds `safeOn` and `safeOnce` methods to a NodeJS Stream
 * object. These are the same as `on` and `once`, except
 * that the callback is wrapped for use in Meteor.
 */


FS.Utility.safeStream = function (nodestream) {
  if (!nodestream || typeof nodestream.on !== 'function') throw new Error('FS.Utility.safeStream requires a NodeJS Stream'); // Create Meteor safe events

  nodestream.safeOn = function (name, callback) {
    return nodestream.on(name, FS.Utility.safeCallback(callback));
  }; // Create Meteor safe events


  nodestream.safeOnce = function (name, callback) {
    return nodestream.once(name, FS.Utility.safeCallback(callback));
  }; // Return the modified stream - modified anyway


  return nodestream;
};
/**
 * @method FS.Utility.eachFileFromPath
 * @public
 * @param {String} p - Server path
 * @param {Function} f - Function to run for each file found in the path.
 * @returns {undefined}
 *
 * Utility for iteration over files from path on server
 */


FS.Utility.eachFileFromPath = function (p, f) {
  var fs = require('fs');

  var path = require('path');

  var files = fs.readdirSync(p);
  files.map(function (file) {
    return path.join(p, file);
  }).filter(function (filePath) {
    return fs.statSync(filePath).isFile() && path.basename(filePath)[0] !== '.';
  }).forEach(function (filePath) {
    f(filePath);
  });
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:cfs-base-package/base-common.js");
require("/node_modules/meteor/steedos:cfs-base-package/base-server.js");

/* Exports */
Package._define("steedos:cfs-base-package", {
  FS: FS,
  _Utility: _Utility
});

})();

//# sourceURL=meteor://💻app/packages/steedos_cfs-base-package.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtYmFzZS1wYWNrYWdlL2Jhc2UtY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zOmNmcy1iYXNlLXBhY2thZ2UvYmFzZS1zZXJ2ZXIuanMiXSwibmFtZXMiOlsiRlMiLCJTdG9yZSIsIkdyaWRGUyIsIkVycm9yIiwiRmlsZVN5c3RlbSIsIlMzIiwiV0FCUyIsIkRyb3Bib3giLCJBY2Nlc3NQb2ludCIsIlV0aWxpdHkiLCJjb25maWciLCJfY29sbGVjdGlvbnMiLCJfVXRpbGl0eSIsImRlZmF1bHRaZXJvIiwidmFsIiwiY2xvbmVGaWxlUmVjb3JkIiwicmVjIiwib3B0aW9ucyIsInJlc3VsdCIsIm9taXQiLCJmdWxsIiwicHJvcCIsImhhc093blByb3BlcnR5IiwiXyIsImNvbnRhaW5zIiwiZGVmYXVsdENhbGxiYWNrIiwiZXJyIiwiTWV0ZW9yIiwiY29uc29sZSIsImVycm9yIiwibWVzc2FnZSIsImhhbmRsZUVycm9yIiwiZiIsImNhbGxiYWNrIiwibm9vcCIsInZhbGlkYXRlQWN0aW9uIiwidmFsaWRhdG9ycyIsImZpbGVPYmoiLCJ1c2VySWQiLCJkZW55VmFsaWRhdG9ycyIsImRlbnkiLCJhbGxvd1ZhbGlkYXRvcnMiLCJhbGxvdyIsIlBhY2thZ2UiLCJpbnNlY3VyZSIsImxlbmd0aCIsImlzTW91bnRlZCIsImdldEZpbGVSZWNvcmQiLCJhbnkiLCJ2YWxpZGF0b3IiLCJhbGwiLCJnZXRGaWxlTmFtZSIsInV0aWxHZXRGaWxlTmFtZSIsIm5hbWUiLCJzcGxpdCIsImxhc3RTbGFzaCIsImxhc3RJbmRleE9mIiwic2xpY2UiLCJnZXRGaWxlRXh0ZW5zaW9uIiwidXRpbEdldEZpbGVFeHRlbnNpb24iLCJmb3VuZCIsInRvTG93ZXJDYXNlIiwic2V0RmlsZUV4dGVuc2lvbiIsInV0aWxTZXRGaWxlRXh0ZW5zaW9uIiwiZXh0IiwiY3VycmVudEV4dCIsImVuY29kZVBhcmFtcyIsInBhcmFtcyIsImJ1ZiIsImVhY2giLCJ2YWx1ZSIsImtleSIsInB1c2giLCJlbmNvZGVTdHJpbmciLCJqb2luIiwicmVwbGFjZSIsInN0ciIsImVuY29kZVVSSUNvbXBvbmVudCIsImVzY2FwZSIsIl9idG9hIiwiX2ZzVXRpbGl0eV9idG9hIiwiYnVmZmVyIiwiQnVmZmVyIiwidG9TdHJpbmciLCJidG9hIiwiZnNVdGlsaXR5X2J0b2EiLCJfYXRvYiIsIl9mc1V0aWxpdHlfYXRvYiIsImF0b2IiLCJmc1V0aWxpdHlfYXRvYiIsImV4dGVuZCIsImlzRW1wdHkiLCJpbmRleE9mIiwiaXNBcnJheSIsIm1hcCIsIm9uY2UiLCJpbmNsdWRlIiwic2l6ZSIsImJpbmFyeVRvQnVmZmVyIiwiZGF0YSIsImxlbiIsImkiLCJidWZmZXJUb0JpbmFyeSIsImJpbmFyeSIsIkVKU09OIiwibmV3QmluYXJ5Iiwic2FmZUNhbGxiYWNrIiwiYmluZEVudmlyb25tZW50Iiwic2FmZVN0cmVhbSIsIm5vZGVzdHJlYW0iLCJvbiIsInNhZmVPbiIsInNhZmVPbmNlIiwiZWFjaEZpbGVGcm9tUGF0aCIsInAiLCJmcyIsInJlcXVpcmUiLCJwYXRoIiwiZmlsZXMiLCJyZWFkZGlyU3luYyIsImZpbGUiLCJmaWx0ZXIiLCJmaWxlUGF0aCIsInN0YXRTeW5jIiwiaXNGaWxlIiwiYmFzZW5hbWUiLCJmb3JFYWNoIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQ0FBLEVBQUUsR0FBRyxFQUFMLEMsQ0FFQTs7QUFDQUEsRUFBRSxDQUFDQyxLQUFILEdBQVc7QUFDVEMsUUFBTSxFQUFFLFlBQVk7QUFDbEIsVUFBTSxJQUFJQyxLQUFKLENBQVUsd0VBQVYsQ0FBTjtBQUNELEdBSFE7QUFJVEMsWUFBVSxFQUFFLFlBQVk7QUFDdEIsVUFBTSxJQUFJRCxLQUFKLENBQVUsZ0ZBQVYsQ0FBTjtBQUNELEdBTlE7QUFPVEUsSUFBRSxFQUFFLFlBQVk7QUFDZCxVQUFNLElBQUlGLEtBQUosQ0FB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LEtBQUMsQ0FBQzBGLFFBQUQsQ0FBRDtBQUNELEdBTkQ7QUFPRCxDQVhELEMiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfY2ZzLWJhc2UtcGFja2FnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIEV4cG9ydGVkIG5hbWVzcGFjZVxyXG5GUyA9IHt9O1xyXG5cclxuLy8gbmFtZXNwYWNlIGZvciBhZGFwdGVyczsgWFhYIHNob3VsZCB0aGlzIGJlIGFkZGVkIGJ5IGNmcy1zdG9yYWdlLWFkYXB0ZXIgcGtnIGluc3RlYWQ/XHJcbkZTLlN0b3JlID0ge1xyXG4gIEdyaWRGUzogZnVuY3Rpb24gKCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdUbyB1c2UgRlMuU3RvcmUuR3JpZEZTLCB5b3UgbXVzdCBhZGQgdGhlIFwic3RlZWRvczpjZnMtZ3JpZGZzXCIgcGFja2FnZS4nKTtcclxuICB9LFxyXG4gIEZpbGVTeXN0ZW06IGZ1bmN0aW9uICgpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignVG8gdXNlIEZTLlN0b3JlLkZpbGVTeXN0ZW0sIHlvdSBtdXN0IGFkZCB0aGUgXCJzdGVlZG9zOmNmcy1maWxlc3lzdGVtXCIgcGFja2FnZS4nKTtcclxuICB9LFxyXG4gIFMzOiBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1RvIHVzZSBGUy5TdG9yZS5TMywgeW91IG11c3QgYWRkIHRoZSBcInN0ZWVkb3M6Y2ZzLXMzXCIgcGFja2FnZS4nKTtcclxuICB9LFxyXG4gIFdBQlM6IGZ1bmN0aW9uICgpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignVG8gdXNlIEZTLlN0b3JlLldBQlMsIHlvdSBtdXN0IGFkZCB0aGUgXCJzdGVlZG9zOmNmcy13YWJzXCIgcGFja2FnZS4nKTtcclxuICB9LFxyXG4gIERyb3Bib3g6IGZ1bmN0aW9uICgpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignVG8gdXNlIEZTLlN0b3JlLkRyb3Bib3gsIHlvdSBtdXN0IGFkZCB0aGUgXCJzdGVlZG9zOmNmcy1kcm9wYm94XCIgcGFja2FnZS4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBuYW1lc3BhY2UgZm9yIGFjY2VzcyBwb2ludHNcclxuRlMuQWNjZXNzUG9pbnQgPSB7fTtcclxuXHJcbi8vIG5hbWVzcGFjZSBmb3IgdXRpbGxpdGllc1xyXG5GUy5VdGlsaXR5ID0ge307XHJcblxyXG4vLyBBIGdlbmVyYWwgcGxhY2UgZm9yIGFueSBwYWNrYWdlIHRvIHN0b3JlIGdsb2JhbCBjb25maWcgc2V0dGluZ3NcclxuRlMuY29uZmlnID0ge307XHJcblxyXG4vLyBBbiBpbnRlcm5hbCBjb2xsZWN0aW9uIHJlZmVyZW5jZVxyXG5GUy5fY29sbGVjdGlvbnMgPSB7fTtcclxuXHJcbi8vIFRlc3Qgc2NvcGVcclxuX1V0aWxpdHkgPSB7fTtcclxuXHJcbi8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjXHJcbi8vXHJcbi8vIEhFTFBFUlNcclxuLy9cclxuLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyNcclxuXHJcbi8qKiBAbWV0aG9kIF9VdGlsaXR5LmRlZmF1bHRaZXJvXHJcbiAqIEBwcml2YXRlXHJcbiAgKiBAcGFyYW0ge0FueX0gdmFsIFJldHVybnMgbnVtYmVyIG9yIDAgaWYgdmFsdWUgaXMgYSBmYWxzeVxyXG4gICovXHJcbl9VdGlsaXR5LmRlZmF1bHRaZXJvID0gZnVuY3Rpb24odmFsKSB7XHJcbiAgcmV0dXJuICsodmFsIHx8IDApO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuVXRpbGl0eS5jbG9uZUZpbGVSZWNvcmRcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge0ZTLkZpbGV8RlMuQ29sbGVjdGlvbiBmaWxlcmVjb3JkfSByZWNcclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLmZ1bGw9ZmFsc2VdIFNldCBgdHJ1ZWAgdG8gcHJldmVudCBjZXJ0YWluIHByb3BlcnRpZXMgZnJvbSBiZWluZyBvbWl0dGVkIGZyb20gdGhlIGNsb25lLlxyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBDbG9uZWQgZmlsZXJlY29yZFxyXG4gKlxyXG4gKiBNYWtlcyBhIHNoYWxsb3cgY2xvbmUgb2YgYHJlY2AsIGZpbHRlcmluZyBvdXQgc29tZSBwcm9wZXJ0aWVzIHRoYXQgbWlnaHQgYmUgcHJlc2VudCBpZlxyXG4gKiBpdCdzIGFuIEZTLkZpbGUgaW5zdGFuY2UsIGJ1dCB3aGljaCB3ZSBuZXZlciB3YW50IHRvIGJlIHBhcnQgb2YgdGhlIHN0b3JlZFxyXG4gKiBmaWxlcmVjb3JkLlxyXG4gKlxyXG4gKiBUaGlzIGlzIGEgYmxhY2tsaXN0IGNsb25lIHJhdGhlciB0aGFuIGEgd2hpdGVsaXN0IGJlY2F1c2Ugd2Ugd2FudCB0aGUgdXNlciB0byBiZSBhYmxlXHJcbiAqIHRvIHNwZWNpZnkgd2hhdGV2ZXIgYWRkaXRpb25hbCBwcm9wZXJ0aWVzIHRoZXkgd2lzaC5cclxuICpcclxuICogSW4gZ2VuZXJhbCwgd2UgZXhwZWN0IHRoZSBmb2xsb3dpbmcgd2hpdGVsaXN0IHByb3BlcnRpZXMgdXNlZCBieSB0aGUgaW50ZXJuYWwgYW5kXHJcbiAqIGV4dGVybmFsIEFQSXM6XHJcbiAqXHJcbiAqIF9pZCwgbmFtZSwgc2l6ZSwgdHlwZSwgY2h1bmtDb3VudCwgY2h1bmtTaXplLCBjaHVua1N1bSwgY29waWVzLCBjcmVhdGVkQXQsIHVwZGF0ZWRBdCwgdXBsb2FkZWRBdFxyXG4gKlxyXG4gKiBUaG9zZSBwcm9wZXJ0aWVzLCBhbmQgYW55IGFkZGl0aW9uYWwgcHJvcGVydGllcyBhZGRlZCBieSB0aGUgdXNlciwgc2hvdWxkIGJlIHByZXNlbnRcclxuICogaW4gdGhlIHJldHVybmVkIG9iamVjdCwgd2hpY2ggaXMgc3VpdGFibGUgZm9yIGluc2VydGluZyBpbnRvIHRoZSBiYWNraW5nIGNvbGxlY3Rpb24gb3JcclxuICogZXh0ZW5kaW5nIGFuIEZTLkZpbGUgaW5zdGFuY2UuXHJcbiAqXHJcbiAqL1xyXG5GUy5VdGlsaXR5LmNsb25lRmlsZVJlY29yZCA9IGZ1bmN0aW9uKHJlYywgb3B0aW9ucykge1xyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gIHZhciByZXN1bHQgPSB7fTtcclxuICAvLyBXZSB1c2UgdGhpcyBtZXRob2QgZm9yIHR3byBwdXJwb3Nlcy4gSWYgdXNpbmcgaXQgdG8gY2xvbmUgb25lIEZTLkZpbGUgaW50byBhbm90aGVyLCB0aGVuXHJcbiAgLy8gd2Ugd2FudCBhIGZ1bGwgY2xvbmUuIEJ1dCBpZiB1c2luZyBpdCB0byBnZXQgYSBmaWxlcmVjb3JkIG9iamVjdCBmb3IgaW5zZXJ0aW5nIGludG8gdGhlXHJcbiAgLy8gaW50ZXJuYWwgY29sbGVjdGlvbiwgdGhlbiB0aGVyZSBhcmUgY2VydGFpbiBwcm9wZXJ0aWVzIHdlIHdhbnQgdG8gb21pdCBzbyB0aGF0IHRoZXkgYXJlbid0XHJcbiAgLy8gc3RvcmVkIGluIHRoZSBjb2xsZWN0aW9uLlxyXG4gIHZhciBvbWl0ID0gb3B0aW9ucy5mdWxsID8gW10gOiBbJ2NvbGxlY3Rpb25OYW1lJywgJ2NvbGxlY3Rpb24nLCAnZGF0YScsICdjcmVhdGVkQnlUcmFuc2Zvcm0nXTtcclxuICBmb3IgKHZhciBwcm9wIGluIHJlYykge1xyXG4gICAgaWYgKHJlYy5oYXNPd25Qcm9wZXJ0eShwcm9wKSAmJiAhXy5jb250YWlucyhvbWl0LCBwcm9wKSkge1xyXG4gICAgICByZXN1bHRbcHJvcF0gPSByZWNbcHJvcF07XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiByZXN1bHQ7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5VdGlsaXR5LmRlZmF1bHRDYWxsYmFja1xyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7RXJyb3J9IFtlcnJdXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqXHJcbiAqIENhbiBiZSB1c2VkIGFzIGEgZGVmYXVsdCBjYWxsYmFjayBmb3IgY2xpZW50IG1ldGhvZHMgdGhhdCBuZWVkIGEgY2FsbGJhY2suXHJcbiAqIFNpbXBseSB0aHJvd3MgdGhlIHByb3ZpZGVkIGVycm9yIGlmIHRoZXJlIGlzIG9uZS5cclxuICovXHJcbkZTLlV0aWxpdHkuZGVmYXVsdENhbGxiYWNrID0gZnVuY3Rpb24gZGVmYXVsdENhbGxiYWNrKGVycikge1xyXG4gIGlmIChlcnIpIHtcclxuICAgIC8vIFNob3cgZ2VudGxlIGVycm9yIGlmIE1ldGVvciBlcnJvclxyXG4gICAgaWYgKGVyciBpbnN0YW5jZW9mIE1ldGVvci5FcnJvcikge1xyXG4gICAgICBjb25zb2xlLmVycm9yKGVyci5tZXNzYWdlKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIE5vcm1hbCBlcnJvciwganVzdCB0aHJvdyBlcnJvclxyXG4gICAgICB0aHJvdyBlcnI7XHJcbiAgICB9XHJcblxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLlV0aWxpdHkuZGVmYXVsdENhbGxiYWNrXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2ZdIEEgY2FsbGJhY2sgZnVuY3Rpb24sIGlmIHlvdSBoYXZlIG9uZS4gQ2FuIGJlIHVuZGVmaW5lZCBvciBudWxsLlxyXG4gKiBAcGFyYW0ge01ldGVvci5FcnJvciB8IEVycm9yIHwgU3RyaW5nfSBbZXJyXSBFcnJvciBvciBlcnJvciBtZXNzYWdlIChzdHJpbmcpXHJcbiAqIEByZXR1cm5zIHtBbnl9IHRoZSBjYWxsYmFjayByZXN1bHQgaWYgYW55XHJcbiAqXHJcbiAqIEhhbmRsZSBFcnJvciwgY3JlYXRlcyBhbiBFcnJvciBpbnN0YW5jZSB3aXRoIHRoZSBnaXZlbiB0ZXh0LiBJZiBjYWxsYmFjayBpc1xyXG4gKiBhIGZ1bmN0aW9uLCBwYXNzZXMgdGhlIGVycm9yIHRvIHRoYXQgZnVuY3Rpb24uIE90aGVyd2lzZSB0aHJvd3MgaXQuIFVzZWZ1bFxyXG4gKiBmb3IgZGVhbGluZyB3aXRoIGVycm9ycyBpbiBtZXRob2RzIHRoYXQgb3B0aW9uYWxseSBhY2NlcHQgYSBjYWxsYmFjay5cclxuICovXHJcbkZTLlV0aWxpdHkuaGFuZGxlRXJyb3IgPSBmdW5jdGlvbihmLCBlcnIsIHJlc3VsdCkge1xyXG4gIC8vIFNldCBjYWxsYmFja1xyXG4gIHZhciBjYWxsYmFjayA9ICh0eXBlb2YgZiA9PT0gJ2Z1bmN0aW9uJyk/IGYgOiBGUy5VdGlsaXR5LmRlZmF1bHRDYWxsYmFjaztcclxuICAvLyBTZXQgdGhlIGVyclxyXG4gIHZhciBlcnJvciA9IChlcnIgPT09ICcnK2Vycik/IG5ldyBFcnJvcihlcnIpIDogZXJyO1xyXG4gIC8vIGNhbGxiYWNrXHJcbiAgcmV0dXJuIGNhbGxiYWNrKGVycm9yLCByZXN1bHQpO1xyXG59XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5VdGlsaXR5Lm5vb3BcclxuICogQHB1YmxpY1xyXG4gKiBVc2UgdGhpcyB0byBoYW5kIGEgbm8gb3BlcmF0aW9uIC8gZW1wdHkgZnVuY3Rpb25cclxuICovXHJcbkZTLlV0aWxpdHkubm9vcCA9IGZ1bmN0aW9uKCkge307XHJcblxyXG4vKipcclxuICogQG1ldGhvZCB2YWxpZGF0ZUFjdGlvblxyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0ge09iamVjdH0gdmFsaWRhdG9ycyAtIFRoZSB2YWxpZGF0b3JzIG9iamVjdCB0byB1c2UsIHdpdGggYGRlbnlgIGFuZCBgYWxsb3dgIHByb3BlcnRpZXMuXHJcbiAqIEBwYXJhbSB7RlMuRmlsZX0gZmlsZU9iaiAtIE1vdW50ZWQgb3IgbW91bnRhYmxlIGZpbGUgb2JqZWN0IHRvIGJlIHBhc3NlZCB0byB2YWxpZGF0b3JzLlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXNlcklkIC0gVGhlIElEIG9mIHRoZSB1c2VyIHdobyBpcyBhdHRlbXB0aW5nIHRoZSBhY3Rpb24uXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqXHJcbiAqIFRocm93cyBhIFwiNDAwLUJhZCBSZXF1ZXN0XCIgTWV0ZW9yIGVycm9yIGlmIHRoZSBmaWxlIGlzIG5vdCBtb3VudGVkIG9yXHJcbiAqIGEgXCI0MDAtQWNjZXNzIGRlbmllZFwiIE1ldGVvciBlcnJvciBpZiB0aGUgYWN0aW9uIGlzIG5vdCBhbGxvd2VkLlxyXG4gKi9cclxuRlMuVXRpbGl0eS52YWxpZGF0ZUFjdGlvbiA9IGZ1bmN0aW9uIHZhbGlkYXRlQWN0aW9uKHZhbGlkYXRvcnMsIGZpbGVPYmosIHVzZXJJZCkge1xyXG4gIHZhciBkZW55VmFsaWRhdG9ycyA9IHZhbGlkYXRvcnMuZGVueTtcclxuICB2YXIgYWxsb3dWYWxpZGF0b3JzID0gdmFsaWRhdG9ycy5hbGxvdztcclxuXHJcbiAgLy8gSWYgaW5zZWN1cmUgcGFja2FnZSBpcyB1c2VkIGFuZCB0aGVyZSBhcmUgbm8gdmFsaWRhdG9ycyBkZWZpbmVkLFxyXG4gIC8vIGFsbG93IHRoZSBhY3Rpb24uXHJcbiAgaWYgKHR5cGVvZiBQYWNrYWdlID09PSAnb2JqZWN0J1xyXG4gICAgICAgICAgJiYgUGFja2FnZS5pbnNlY3VyZVxyXG4gICAgICAgICAgJiYgZGVueVZhbGlkYXRvcnMubGVuZ3RoICsgYWxsb3dWYWxpZGF0b3JzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgLy8gSWYgYWxyZWFkeSBtb3VudGVkLCB2YWxpZGF0b3JzIHNob3VsZCByZWNlaXZlIGEgZmlsZU9ialxyXG4gIC8vIHRoYXQgaXMgZnVsbHkgcG9wdWxhdGVkXHJcbiAgaWYgKGZpbGVPYmouaXNNb3VudGVkKCkpIHtcclxuICAgIGZpbGVPYmouZ2V0RmlsZVJlY29yZCgpO1xyXG4gIH1cclxuXHJcbiAgLy8gQW55IGRlbnkgcmV0dXJucyB0cnVlIG1lYW5zIGRlbmllZC5cclxuICBpZiAoXy5hbnkoZGVueVZhbGlkYXRvcnMsIGZ1bmN0aW9uKHZhbGlkYXRvcikge1xyXG4gICAgcmV0dXJuIHZhbGlkYXRvcih1c2VySWQsIGZpbGVPYmopO1xyXG4gIH0pKSB7XHJcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJBY2Nlc3MgZGVuaWVkXCIpO1xyXG4gIH1cclxuICAvLyBBbnkgYWxsb3cgcmV0dXJucyB0cnVlIG1lYW5zIHByb2NlZWQuIFRocm93IGVycm9yIGlmIHRoZXkgYWxsIGZhaWwuXHJcbiAgaWYgKF8uYWxsKGFsbG93VmFsaWRhdG9ycywgZnVuY3Rpb24odmFsaWRhdG9yKSB7XHJcbiAgICByZXR1cm4gIXZhbGlkYXRvcih1c2VySWQsIGZpbGVPYmopO1xyXG4gIH0pKSB7XHJcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCJBY2Nlc3MgZGVuaWVkXCIpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLlV0aWxpdHkuZ2V0RmlsZU5hbWVcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgLSBBIGZpbGVuYW1lLCBmaWxlcGF0aCwgb3IgVVJMXHJcbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBmaWxlbmFtZSB3aXRob3V0IHRoZSBVUkwsIGZpbGVwYXRoLCBvciBxdWVyeSBzdHJpbmdcclxuICovXHJcbkZTLlV0aWxpdHkuZ2V0RmlsZU5hbWUgPSBmdW5jdGlvbiB1dGlsR2V0RmlsZU5hbWUobmFtZSkge1xyXG4gIC8vIGluIGNhc2UgaXQncyBhIFVSTCwgc3RyaXAgb2ZmIHBvdGVudGlhbCBxdWVyeSBzdHJpbmdcclxuICAvLyBzaG91bGQgaGF2ZSBubyBlZmZlY3Qgb24gZmlsZXBhdGhcclxuICBuYW1lID0gbmFtZS5zcGxpdCgnPycpWzBdO1xyXG4gIC8vIHN0cmlwIG9mZiBiZWdpbm5pbmcgcGF0aCBvciB1cmxcclxuICB2YXIgbGFzdFNsYXNoID0gbmFtZS5sYXN0SW5kZXhPZignLycpO1xyXG4gIGlmIChsYXN0U2xhc2ggIT09IC0xKSB7XHJcbiAgICBuYW1lID0gbmFtZS5zbGljZShsYXN0U2xhc2ggKyAxKTtcclxuICB9XHJcbiAgcmV0dXJuIG5hbWU7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5VdGlsaXR5LmdldEZpbGVFeHRlbnNpb25cclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAtIEEgZmlsZW5hbWUsIGZpbGVwYXRoLCBvciBVUkwgdGhhdCBtYXkgb3IgbWF5IG5vdCBoYXZlIGFuIGV4dGVuc2lvbi5cclxuICogQHJldHVybnMge1N0cmluZ30gVGhlIGV4dGVuc2lvbiBvciBhbiBlbXB0eSBzdHJpbmcgaWYgbm8gZXh0ZW5zaW9uIGZvdW5kLlxyXG4gKi9cclxuRlMuVXRpbGl0eS5nZXRGaWxlRXh0ZW5zaW9uID0gZnVuY3Rpb24gdXRpbEdldEZpbGVFeHRlbnNpb24obmFtZSkge1xyXG4gIG5hbWUgPSBGUy5VdGlsaXR5LmdldEZpbGVOYW1lKG5hbWUpO1xyXG4gIC8vIFNlZWtvdXQgdGhlIGxhc3QgJy4nIGlmIGZvdW5kXHJcbiAgdmFyIGZvdW5kID0gbmFtZS5sYXN0SW5kZXhPZignLicpO1xyXG4gIC8vIFJldHVybiB0aGUgZXh0ZW5zaW9uIGlmIGZvdW5kIGVsc2UgJydcclxuICAvLyBJZiBmb3VuZCBpcyAtMSwgd2UgcmV0dXJuICcnIGJlY2F1c2UgdGhlcmUgaXMgbm8gZXh0ZW5zaW9uXHJcbiAgLy8gSWYgZm91bmQgaXMgMCwgd2UgcmV0dXJuICcnIGJlY2F1c2UgaXQncyBhIGhpZGRlbiBmaWxlXHJcbiAgcmV0dXJuIChmb3VuZCA+IDAgPyBuYW1lLnNsaWNlKGZvdW5kICsgMSkudG9Mb3dlckNhc2UoKSA6ICcnKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLlV0aWxpdHkuc2V0RmlsZUV4dGVuc2lvblxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lIC0gQSBmaWxlbmFtZSB0aGF0IG1heSBvciBtYXkgbm90IGFscmVhZHkgaGF2ZSBhbiBleHRlbnNpb24uXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBleHQgLSBBbiBleHRlbnNpb24gd2l0aG91dCBsZWFkaW5nIHBlcmlvZCwgd2hpY2ggeW91IHdhbnQgdG8gYmUgdGhlIG5ldyBleHRlbnNpb24gb24gYG5hbWVgLlxyXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgZmlsZW5hbWUgd2l0aCBjaGFuZ2VkIGV4dGVuc2lvbi5cclxuICovXHJcbkZTLlV0aWxpdHkuc2V0RmlsZUV4dGVuc2lvbiA9IGZ1bmN0aW9uIHV0aWxTZXRGaWxlRXh0ZW5zaW9uKG5hbWUsIGV4dCkge1xyXG4gIGlmICghbmFtZSB8fCAhbmFtZS5sZW5ndGgpIHtcclxuICAgIHJldHVybiBuYW1lO1xyXG4gIH1cclxuICB2YXIgY3VycmVudEV4dCA9IEZTLlV0aWxpdHkuZ2V0RmlsZUV4dGVuc2lvbihuYW1lKTtcclxuICBpZiAoY3VycmVudEV4dC5sZW5ndGgpIHtcclxuICAgIG5hbWUgPSBuYW1lLnNsaWNlKDAsIGN1cnJlbnRFeHQubGVuZ3RoICogLTEpICsgZXh0O1xyXG4gIH0gZWxzZSB7XHJcbiAgICBuYW1lID0gbmFtZSArICcuJyArIGV4dDtcclxuICB9XHJcbiAgcmV0dXJuIG5hbWU7XHJcbn07XHJcblxyXG4vKlxyXG4gKiBCb3Jyb3dlZCB0aGVzZSBmcm9tIGh0dHAgcGFja2FnZVxyXG4gKi9cclxuRlMuVXRpbGl0eS5lbmNvZGVQYXJhbXMgPSBmdW5jdGlvbiBlbmNvZGVQYXJhbXMocGFyYW1zKSB7XHJcbiAgdmFyIGJ1ZiA9IFtdO1xyXG4gIF8uZWFjaChwYXJhbXMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcclxuICAgIGlmIChidWYubGVuZ3RoKVxyXG4gICAgICBidWYucHVzaCgnJicpO1xyXG4gICAgYnVmLnB1c2goRlMuVXRpbGl0eS5lbmNvZGVTdHJpbmcoa2V5KSwgJz0nLCBGUy5VdGlsaXR5LmVuY29kZVN0cmluZyh2YWx1ZSkpO1xyXG4gIH0pO1xyXG4gIHJldHVybiBidWYuam9pbignJykucmVwbGFjZSgvJTIwL2csICcrJyk7XHJcbn07XHJcblxyXG5GUy5VdGlsaXR5LmVuY29kZVN0cmluZyA9IGZ1bmN0aW9uIGVuY29kZVN0cmluZyhzdHIpIHtcclxuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHN0cikucmVwbGFjZSgvWyEnKCldL2csIGVzY2FwZSkucmVwbGFjZSgvXFwqL2csIFwiJTJBXCIpO1xyXG59O1xyXG5cclxuLypcclxuICogYnRvYSBhbmQgYXRvYiBzaGltcyBmb3IgY2xpZW50IGFuZCBzZXJ2ZXJcclxuICovXHJcblxyXG5GUy5VdGlsaXR5Ll9idG9hID0gZnVuY3Rpb24gX2ZzVXRpbGl0eV9idG9hKHN0cikge1xyXG4gIHZhciBidWZmZXI7XHJcblxyXG4gIGlmIChzdHIgaW5zdGFuY2VvZiBCdWZmZXIpIHtcclxuICAgIGJ1ZmZlciA9IHN0cjtcclxuICB9IGVsc2Uge1xyXG4gICAgYnVmZmVyID0gbmV3IEJ1ZmZlcihzdHIudG9TdHJpbmcoKSwgJ2JpbmFyeScpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGJ1ZmZlci50b1N0cmluZygnYmFzZTY0Jyk7XHJcbn07XHJcblxyXG5GUy5VdGlsaXR5LmJ0b2EgPSBmdW5jdGlvbiBmc1V0aWxpdHlfYnRvYShzdHIpIHtcclxuICBpZiAodHlwZW9mIGJ0b2EgPT09ICdmdW5jdGlvbicpIHtcclxuICAgIC8vIENsaWVudFxyXG4gICAgcmV0dXJuIGJ0b2Eoc3RyKTtcclxuICB9IGVsc2UgaWYgKHR5cGVvZiBCdWZmZXIgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAvLyBTZXJ2ZXJcclxuICAgIHJldHVybiBGUy5VdGlsaXR5Ll9idG9hKHN0cik7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRlMuVXRpbGl0eS5idG9hOiBDYW5ub3QgYmFzZTY0IGVuY29kZSBvbiB5b3VyIHN5c3RlbScpO1xyXG4gIH1cclxufTtcclxuXHJcbkZTLlV0aWxpdHkuX2F0b2IgPSBmdW5jdGlvbiBfZnNVdGlsaXR5X2F0b2Ioc3RyKSB7XHJcbiAgcmV0dXJuIG5ldyBCdWZmZXIoc3RyLCAnYmFzZTY0JykudG9TdHJpbmcoJ2JpbmFyeScpO1xyXG59O1xyXG5cclxuRlMuVXRpbGl0eS5hdG9iID0gZnVuY3Rpb24gZnNVdGlsaXR5X2F0b2Ioc3RyKSB7XHJcbiAgaWYgKHR5cGVvZiBhdG9iID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICAvLyBDbGllbnRcclxuICAgIHJldHVybiBhdG9iKHN0cik7XHJcbiAgfSBlbHNlIGlmICh0eXBlb2YgQnVmZmVyICE9PSAndW5kZWZpbmVkJykge1xyXG4gICAgLy8gU2VydmVyXHJcbiAgICByZXR1cm4gRlMuVXRpbGl0eS5fYXRvYihzdHIpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZTLlV0aWxpdHkuYXRvYjogQ2Fubm90IGJhc2U2NCBlbmNvZGUgb24geW91ciBzeXN0ZW0nKTtcclxuICB9XHJcbn07XHJcblxyXG4vLyBBcGkgd3JhcCBmb3IgM3BhcnR5IGxpYnMgbGlrZSB1bmRlcnNjb3JlXHJcbkZTLlV0aWxpdHkuZXh0ZW5kID0gXy5leHRlbmQ7XHJcblxyXG5GUy5VdGlsaXR5LmVhY2ggPSBfLmVhY2g7XHJcblxyXG5GUy5VdGlsaXR5LmlzRW1wdHkgPSBfLmlzRW1wdHk7XHJcblxyXG5GUy5VdGlsaXR5LmluZGV4T2YgPSBfLmluZGV4T2Y7XHJcblxyXG5GUy5VdGlsaXR5LmlzQXJyYXkgPSBfLmlzQXJyYXk7XHJcblxyXG5GUy5VdGlsaXR5Lm1hcCA9IF8ubWFwO1xyXG5cclxuRlMuVXRpbGl0eS5vbmNlID0gXy5vbmNlO1xyXG5cclxuRlMuVXRpbGl0eS5pbmNsdWRlID0gXy5pbmNsdWRlO1xyXG5cclxuRlMuVXRpbGl0eS5zaXplID0gXy5zaXplO1xyXG4iLCIvKipcclxuICogQG1ldGhvZCBGUy5VdGlsaXR5LmJpbmFyeVRvQnVmZmVyXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtVaW50OEFycmF5fSBkYXRhXHJcbiAqIEByZXR1cm5zIHtCdWZmZXJ9XHJcbiAqXHJcbiAqIENvbnZlcnRzIGEgVWludDhBcnJheSBpbnN0YW5jZSB0byBhIE5vZGUgQnVmZmVyIGluc3RhbmNlXHJcbiAqL1xyXG5GUy5VdGlsaXR5LmJpbmFyeVRvQnVmZmVyID0gZnVuY3Rpb24oZGF0YSkge1xyXG4gIHZhciBsZW4gPSBkYXRhLmxlbmd0aDtcclxuICB2YXIgYnVmZmVyID0gbmV3IEJ1ZmZlcihsZW4pO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcclxuICAgIGJ1ZmZlcltpXSA9IGRhdGFbaV07XHJcbiAgfVxyXG4gIHJldHVybiBidWZmZXI7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5VdGlsaXR5LmJ1ZmZlclRvQmluYXJ5XHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtCdWZmZXJ9IGRhdGFcclxuICogQHJldHVybnMge1VpbnQ4QXJyYXl9XHJcbiAqXHJcbiAqIENvbnZlcnRzIGEgTm9kZSBCdWZmZXIgaW5zdGFuY2UgdG8gYSBVaW50OEFycmF5IGluc3RhbmNlXHJcbiAqL1xyXG5GUy5VdGlsaXR5LmJ1ZmZlclRvQmluYXJ5ID0gZnVuY3Rpb24oZGF0YSkge1xyXG4gIHZhciBsZW4gPSBkYXRhLmxlbmd0aDtcclxuICB2YXIgYmluYXJ5ID0gRUpTT04ubmV3QmluYXJ5KGxlbik7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xyXG4gICAgYmluYXJ5W2ldID0gZGF0YVtpXTtcclxuICB9XHJcbiAgcmV0dXJuIGJpbmFyeTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLlV0aWxpdHkuc2FmZUNhbGxiYWNrXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcclxuICogQHJldHVybnMge0Z1bmN0aW9ufVxyXG4gKlxyXG4gKiBNYWtlcyBhIGNhbGxiYWNrIHNhZmUgZm9yIE1ldGVvciBjb2RlXHJcbiAqL1xyXG5GUy5VdGlsaXR5LnNhZmVDYWxsYmFjayA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gIHJldHVybiBNZXRlb3IuYmluZEVudmlyb25tZW50KGNhbGxiYWNrLCBmdW5jdGlvbihlcnIpIHsgdGhyb3cgZXJyOyB9KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLlV0aWxpdHkuc2FmZVN0cmVhbVxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7U3RyZWFtfSBub2Rlc3RyZWFtXHJcbiAqIEByZXR1cm5zIHtTdHJlYW19XHJcbiAqXHJcbiAqIEFkZHMgYHNhZmVPbmAgYW5kIGBzYWZlT25jZWAgbWV0aG9kcyB0byBhIE5vZGVKUyBTdHJlYW1cclxuICogb2JqZWN0LiBUaGVzZSBhcmUgdGhlIHNhbWUgYXMgYG9uYCBhbmQgYG9uY2VgLCBleGNlcHRcclxuICogdGhhdCB0aGUgY2FsbGJhY2sgaXMgd3JhcHBlZCBmb3IgdXNlIGluIE1ldGVvci5cclxuICovXHJcbkZTLlV0aWxpdHkuc2FmZVN0cmVhbSA9IGZ1bmN0aW9uKG5vZGVzdHJlYW0pIHtcclxuICBpZiAoIW5vZGVzdHJlYW0gfHwgdHlwZW9mIG5vZGVzdHJlYW0ub24gIT09ICdmdW5jdGlvbicpXHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZTLlV0aWxpdHkuc2FmZVN0cmVhbSByZXF1aXJlcyBhIE5vZGVKUyBTdHJlYW0nKTtcclxuXHJcbiAgLy8gQ3JlYXRlIE1ldGVvciBzYWZlIGV2ZW50c1xyXG4gIG5vZGVzdHJlYW0uc2FmZU9uID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcclxuICAgIHJldHVybiBub2Rlc3RyZWFtLm9uKG5hbWUsIEZTLlV0aWxpdHkuc2FmZUNhbGxiYWNrKGNhbGxiYWNrKSk7XHJcbiAgfTtcclxuXHJcbiAgLy8gQ3JlYXRlIE1ldGVvciBzYWZlIGV2ZW50c1xyXG4gIG5vZGVzdHJlYW0uc2FmZU9uY2UgPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaykge1xyXG4gICAgcmV0dXJuIG5vZGVzdHJlYW0ub25jZShuYW1lLCBGUy5VdGlsaXR5LnNhZmVDYWxsYmFjayhjYWxsYmFjaykpO1xyXG4gIH07XHJcblxyXG4gIC8vIFJldHVybiB0aGUgbW9kaWZpZWQgc3RyZWFtIC0gbW9kaWZpZWQgYW55d2F5XHJcbiAgcmV0dXJuIG5vZGVzdHJlYW07XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5VdGlsaXR5LmVhY2hGaWxlRnJvbVBhdGhcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge1N0cmluZ30gcCAtIFNlcnZlciBwYXRoXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGYgLSBGdW5jdGlvbiB0byBydW4gZm9yIGVhY2ggZmlsZSBmb3VuZCBpbiB0aGUgcGF0aC5cclxuICogQHJldHVybnMge3VuZGVmaW5lZH1cclxuICpcclxuICogVXRpbGl0eSBmb3IgaXRlcmF0aW9uIG92ZXIgZmlsZXMgZnJvbSBwYXRoIG9uIHNlcnZlclxyXG4gKi9cclxuRlMuVXRpbGl0eS5lYWNoRmlsZUZyb21QYXRoID0gZnVuY3Rpb24ocCwgZikge1xyXG4gIHZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XHJcbiAgdmFyIHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XHJcbiAgdmFyIGZpbGVzID0gZnMucmVhZGRpclN5bmMocCk7XHJcbiAgZmlsZXMubWFwKGZ1bmN0aW9uIChmaWxlKSB7XHJcbiAgICByZXR1cm4gcGF0aC5qb2luKHAsIGZpbGUpO1xyXG4gIH0pLmZpbHRlcihmdW5jdGlvbiAoZmlsZVBhdGgpIHtcclxuICAgIHJldHVybiBmcy5zdGF0U3luYyhmaWxlUGF0aCkuaXNGaWxlKCkgJiYgcGF0aC5iYXNlbmFtZShmaWxlUGF0aClbMF0gIT09ICcuJztcclxuICB9KS5mb3JFYWNoKGZ1bmN0aW9uIChmaWxlUGF0aCkge1xyXG4gICAgZihmaWxlUGF0aCk7XHJcbiAgfSk7XHJcbn07XHJcbiJdfQ==
