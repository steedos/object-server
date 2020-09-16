(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var FS = Package['steedos:cfs-base-package'].FS;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var check = Package.check.check;
var Match = Package.check.Match;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var HTTP = Package.http.HTTP;
var HTTPInternals = Package.http.HTTPInternals;
var DataMan = Package['steedos:cfs-data-man'].DataMan;
var EventEmitter = Package['raix:eventemitter'].EventEmitter;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:cfs-file":{"checkNpm.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_cfs-file/checkNpm.js                                                                              //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);

// fix warning: xxx not installed
require("temp/package.json");

checkNpmVersions({
  temp: "0.7.0" // for tests only

}, 'steedos:cfs-file');
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fsFile-common.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_cfs-file/fsFile-common.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/**
 * @method FS.File
 * @namespace FS.File
 * @public
 * @constructor
 * @param {object|FS.File|data to attach} [ref] Another FS.File instance, a filerecord, or some data to pass to attachData
 */
FS.File = function (ref, createdByTransform) {
  var self = this;
  self.createdByTransform = !!createdByTransform;

  if (ref instanceof FS.File || isBasicObject(ref)) {
    // Extend self with filerecord related data
    FS.Utility.extend(self, FS.Utility.cloneFileRecord(ref, {
      full: true
    }));
  } else if (ref) {
    self.attachData(ref);
  }
}; // An FS.File can emit events


FS.File.prototype = new EventEmitter();
/**
 * @method FS.File.prototype.attachData
 * @public
 * @param {File|Blob|Buffer|ArrayBuffer|Uint8Array|String} data The data that you want to attach to the file.
 * @param {Object} [options] Options
 * @param {String} [options.type] The data content (MIME) type, if known.
 * @param {String} [options.headers] When attaching a URL, headers to be used for the GET request (currently server only)
 * @param {String} [options.auth] When attaching a URL, "username:password" to be used for the GET request (currently server only)
 * @param {Function} [callback] Callback function, callback(error). On the client, a callback is required if data is a URL.
 * @returns {FS.File} This FS.File instance.
 *
 */

FS.File.prototype.attachData = function fsFileAttachData(data, options, callback) {
  var self = this;

  if (!callback && typeof options === "function") {
    callback = options;
    options = {};
  }

  options = options || {};

  if (!data) {
    throw new Error('FS.File.attachData requires a data argument with some data');
  }

  var urlOpts; // Set any other properties we can determine from the source data
  // File

  if (typeof File !== "undefined" && data instanceof File) {
    self.name(data.name);
    self.updatedAt(data.lastModifiedDate);
    self.size(data.size);
    setData(data.type);
  } // Blob
  else if (typeof Blob !== "undefined" && data instanceof Blob) {
      self.name(data.name);
      self.updatedAt(new Date());
      self.size(data.size);
      setData(data.type);
    } // URL: we need to do a HEAD request to get the type because type
    // is required for filtering to work.
    else if (typeof data === "string" && (data.slice(0, 5) === "http:" || data.slice(0, 6) === "https:")) {
        urlOpts = FS.Utility.extend({}, options);

        if (urlOpts.type) {
          delete urlOpts.type;
        }

        if (!callback) {
          if (Meteor.isClient) {
            throw new Error('FS.File.attachData requires a callback when attaching a URL on the client');
          }

          var result = Meteor.call('_cfs_getUrlInfo', data, urlOpts);
          FS.Utility.extend(self, {
            original: result
          });
          setData(result.type);
        } else {
          Meteor.call('_cfs_getUrlInfo', data, urlOpts, function (error, result) {
            FS.debug && console.log("URL HEAD RESULT:", result);

            if (error) {
              callback(error);
            } else {
              var type = result.type || options.type;

              if (!type) {
                throw new Error('FS.File.attachData got a URL for which it could not determine the MIME type and none was provided using options.type');
              }

              FS.Utility.extend(self, {
                original: result
              });
              setData(type);
            }
          });
        }
      } // Everything else
      else {
          setData(options.type);
        } // Set the data


  function setData(type) {
    self.data = new DataMan(data, type, urlOpts); // Update the type to match what the data is

    self.type(self.data.type()); // Update the size to match what the data is.
    // It's always safe to call self.data.size() without supplying a callback
    // because it requires a callback only for URLs on the client, and we
    // already added size for URLs when we got the result from '_cfs_getUrlInfo' method.

    if (!self.size()) {
      if (callback) {
        self.data.size(function (error, size) {
          if (error) {
            callback && callback(error);
          } else {
            self.size(size);
            setName();
          }
        });
      } else {
        self.size(self.data.size());
        setName();
      }
    } else {
      setName();
    }
  }

  function setName() {
    // See if we can extract a file name from URL or filepath
    if (!self.name() && typeof data === "string") {
      // name from URL
      if (data.slice(0, 5) === "http:" || data.slice(0, 6) === "https:") {
        if (FS.Utility.getFileExtension(data).length) {
          // for a URL we assume the end is a filename only if it has an extension
          self.name(FS.Utility.getFileName(data));
        }
      } // name from filepath
      else if (data.slice(0, 5) !== "data:") {
          self.name(FS.Utility.getFileName(data));
        }
    }

    callback && callback();
  }

  return self; //allow chaining
};
/**
 * @method FS.File.prototype.uploadProgress
 * @public
 * @returns {number} The server confirmed upload progress
 */


FS.File.prototype.uploadProgress = function () {
  var self = this; // Make sure our file record is updated

  self.getFileRecord(); // If fully uploaded, return 100

  if (self.uploadedAt) {
    return 100;
  } // Otherwise return the confirmed progress or 0
  else {
      return Math.round((self.chunkCount || 0) / (self.chunkSum || 1) * 100);
    }
};
/**
 * @method FS.File.prototype.controlledByDeps
 * @public
 * @returns {FS.Collection} Returns true if this FS.File is reactive
 *
 * > Note: Returns true if this FS.File object was created by a FS.Collection
 * > and we are in a reactive computations. What does this mean? Well it should
 * > mean that our fileRecord is fully updated by Meteor and we are mounted on
 * > a collection
 */


FS.File.prototype.controlledByDeps = function () {
  var self = this;
  return self.createdByTransform && Deps.active;
};
/**
 * @method FS.File.prototype.getCollection
 * @public
 * @returns {FS.Collection} Returns attached collection or undefined if not mounted
 */


FS.File.prototype.getCollection = function () {
  // Get the collection reference
  var self = this; // If we already made the link then do no more

  if (self.collection) {
    return self.collection;
  } // If we don't have a collectionName then there's not much to do, the file is
  // not mounted yet


  if (!self.collectionName) {
    // Should not throw an error here - could be common that the file is not
    // yet mounted into a collection
    return;
  } // Link the collection to the file


  self.collection = FS._collections[self.collectionName];
  return self.collection; //possibly undefined, but that's desired behavior
};
/**
 * @method FS.File.prototype.isMounted
 * @public
 * @returns {FS.Collection} Returns attached collection or undefined if not mounted
 */


FS.File.prototype.isMounted = FS.File.prototype.getCollection;
/**
 * @method FS.File.prototype.getFileRecord Returns the fileRecord
 * @public
 * @returns {object} The filerecord
 */

FS.File.prototype.getFileRecord = function () {
  var self = this; // Check if this file object fileRecord is kept updated by Meteor, if so
  // return self

  if (self.controlledByDeps()) {
    return self;
  } // Go for manually updating the file record


  if (self.isMounted()) {
    FS.debug && console.log('GET FILERECORD: ' + self._id); // Return the fileRecord or an empty object

    var fileRecord = self.collection.files.findOne({
      _id: self._id
    }) || {};
    FS.Utility.extend(self, fileRecord);
    return fileRecord;
  } else {
    // We return an empty object, this way users can still do `getRecord().size`
    // Without getting an error
    return {};
  }
};
/**
 * @method FS.File.prototype.update
 * @public
 * @param {modifier} modifier
 * @param {object} [options]
 * @param {function} [callback]
 *
 * Updates the fileRecord.
 */


FS.File.prototype.update = function (modifier, options, callback) {
  var self = this;
  FS.debug && console.log('UPDATE: ' + JSON.stringify(modifier)); // Make sure we have options and callback

  if (!callback && typeof options === 'function') {
    callback = options;
    options = {};
  }

  callback = callback || FS.Utility.defaultCallback;

  if (!self.isMounted()) {
    callback(new Error("Cannot update a file that is not associated with a collection"));
    return;
  } // Call collection update - File record


  return self.collection.files.update({
    _id: self._id
  }, modifier, options, function (err, count) {
    // Update the fileRecord if it was changed and on the client
    // The server-side methods will pull the fileRecord if needed
    if (count > 0 && Meteor.isClient) self.getFileRecord(); // Call callback

    callback(err, count);
  });
};
/**
 * @method FS.File.prototype._saveChanges
 * @private
 * @param {String} [what] "_original" to save original info, or a store name to save info for that store, or saves everything
 *
 * Updates the fileRecord from values currently set on the FS.File instance.
 */


FS.File.prototype._saveChanges = function (what) {
  var self = this;

  if (!self.isMounted()) {
    return;
  }

  FS.debug && console.log("FS.File._saveChanges:", what || "all");
  var mod = {
    $set: {}
  };

  if (what === "_original") {
    mod.$set.original = self.original;
  } else if (typeof what === "string") {
    var info = self.copies[what];

    if (info) {
      mod.$set["copies." + what] = info;
    }
  } else {
    mod.$set.original = self.original;
    mod.$set.copies = self.copies;
  }

  self.update(mod);
};
/**
 * @method FS.File.prototype.remove
 * @public
 * @param {Function} [callback]
 * @returns {number} Count
 *
 * Remove the current file from its FS.Collection
 */


FS.File.prototype.remove = function (callback) {
  var self = this;
  FS.debug && console.log('REMOVE: ' + self._id);
  callback = callback || FS.Utility.defaultCallback;

  if (!self.isMounted()) {
    callback(new Error("Cannot remove a file that is not associated with a collection"));
    return;
  }

  return self.collection.files.remove({
    _id: self._id
  }, function (err, res) {
    if (!err) {
      delete self._id;
      delete self.collection;
      delete self.collectionName;
    }

    callback(err, res);
  });
};
/**
 * @method FS.File.prototype.moveTo
 * @param {FS.Collection} targetCollection
 * @private // Marked private until implemented
 * @todo Needs to be implemented
 *
 * Move the file from current collection to another collection
 *
 * > Note: Not yet implemented
 */

/**
 * @method FS.File.prototype.getExtension Returns the lowercase file extension
 * @public
 * @deprecated Use the `extension` getter/setter method instead.
 * @param {Object} [options]
 * @param {String} [options.store] - Store name. Default is the original extension.
 * @returns {string} The extension eg.: `jpg` or if not found then an empty string ''
 */


FS.File.prototype.getExtension = function (options) {
  var self = this;
  return self.extension(options);
};

function checkContentType(fsFile, storeName, startOfType) {
  var type;

  if (storeName && fsFile.hasStored(storeName)) {
    type = fsFile.type({
      store: storeName
    });
  } else {
    type = fsFile.type();
  }

  if (typeof type === "string") {
    return type.indexOf(startOfType) === 0;
  }

  return false;
}
/**
 * @method FS.File.prototype.isImage Is it an image file?
 * @public
 * @param {object} [options]
 * @param {string} [options.store] The store we're interested in
 *
 * Returns true if the copy of this file in the specified store has an image
 * content type. If the file object is unmounted or doesn't have a copy for
 * the specified store, or if you don't specify a store, this method checks
 * the content type of the original file.
 */


FS.File.prototype.isImage = function (options) {
  return checkContentType(this, (options || {}).store, 'image/');
};
/**
 * @method FS.File.prototype.isVideo Is it a video file?
 * @public
 * @param {object} [options]
 * @param {string} [options.store] The store we're interested in
 *
 * Returns true if the copy of this file in the specified store has a video
 * content type. If the file object is unmounted or doesn't have a copy for
 * the specified store, or if you don't specify a store, this method checks
 * the content type of the original file.
 */


FS.File.prototype.isVideo = function (options) {
  return checkContentType(this, (options || {}).store, 'video/');
};
/**
 * @method FS.File.prototype.isAudio Is it an audio file?
 * @public
 * @param {object} [options]
 * @param {string} [options.store] The store we're interested in
 *
 * Returns true if the copy of this file in the specified store has an audio
 * content type. If the file object is unmounted or doesn't have a copy for
 * the specified store, or if you don't specify a store, this method checks
 * the content type of the original file.
 */


FS.File.prototype.isAudio = function (options) {
  return checkContentType(this, (options || {}).store, 'audio/');
};
/**
 * @method FS.File.prototype.formattedSize
 * @public
 * @param  {Object} options
 * @param  {String} [options.store=none,display original file size] Which file do you want to get the size of?
 * @param  {String} [options.formatString='0.00 b'] The `numeral` format string to use.
 * @return {String} The file size formatted as a human readable string and reactively updated.
 *
 * * You must add the `numeral` package to your app before you can use this method.
 * * If info is not found or a size can't be determined, it will show 0.
 */


FS.File.prototype.formattedSize = function fsFileFormattedSize(options) {
  var self = this;
  if (typeof numeral !== "function") throw new Error("You must add the numeral package if you call FS.File.formattedSize");
  options = options || {};
  options = options.hash || options;
  var size = self.size(options) || 0;
  return numeral(size).format(options.formatString || '0.00 b');
};
/**
 * @method FS.File.prototype.isUploaded Is this file completely uploaded?
 * @public
 * @returns {boolean} True if the number of uploaded bytes is equal to the file size.
 */


FS.File.prototype.isUploaded = function () {
  var self = this; // Make sure we use the updated file record

  self.getFileRecord();
  return !!self.uploadedAt;
};
/**
 * @method FS.File.prototype.hasStored
 * @public
 * @param {string} storeName Name of the store
 * @param {boolean} [optimistic=false] In case that the file record is not found, read below
 * @returns {boolean} Is a version of this file stored in the given store?
 *
 * > Note: If the file is not published to the client or simply not found:
 * this method cannot know for sure if it exists or not. The `optimistic`
 * param is the boolean value to return. Are we `optimistic` that the copy
 * could exist. This is the case in `FS.File.url` we are optimistic that the
 * copy supplied by the user exists.
 */


FS.File.prototype.hasStored = function (storeName, optimistic) {
  var self = this; // Make sure we use the updated file record

  self.getFileRecord(); // If we havent the published data then

  if (FS.Utility.isEmpty(self.copies)) {
    return !!optimistic;
  }

  if (typeof storeName === "string") {
    // Return true only if the `key` property is present, which is not set until
    // storage is complete.
    return !!(self.copies && self.copies[storeName] && self.copies[storeName].key);
  }

  return false;
}; // Backwards compatibility


FS.File.prototype.hasCopy = FS.File.prototype.hasStored;
/**
 * @method FS.File.prototype.getCopyInfo
 * @public
 * @deprecated Use individual methods with `store` option instead.
 * @param {string} storeName Name of the store for which to get copy info.
 * @returns {Object} The file details, e.g., name, size, key, etc., specific to the copy saved in this store.
 */

FS.File.prototype.getCopyInfo = function (storeName) {
  var self = this; // Make sure we use the updated file record

  self.getFileRecord();
  return self.copies && self.copies[storeName] || null;
};
/**
 * @method FS.File.prototype._getInfo
 * @private
 * @param {String} [storeName] Name of the store for which to get file info. Omit for original file details.
 * @param {Object} [options]
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first?
 * @returns {Object} The file details, e.g., name, size, key, etc. If not found, returns an empty object.
 */


FS.File.prototype._getInfo = function (storeName, options) {
  var self = this;
  options = options || {};

  if (options.updateFileRecordFirst) {
    // Make sure we use the updated file record
    self.getFileRecord();
  }

  if (storeName) {
    return self.copies && self.copies[storeName] || {};
  } else {
    return self.original || {};
  }
};
/**
 * @method FS.File.prototype._setInfo
 * @private
 * @param {String} storeName - Name of the store for which to set file info. Non-string will set original file details.
 * @param {String} property - Property to set
 * @param {String} value - New value for property
 * @param {Boolean} save - Should the new value be saved to the DB, too, or just set in the FS.File properties?
 * @returns {undefined}
 */


FS.File.prototype._setInfo = function (storeName, property, value, save) {
  var self = this;

  if (typeof storeName === "string") {
    self.copies = self.copies || {};
    self.copies[storeName] = self.copies[storeName] || {};
    self.copies[storeName][property] = value;
    save && self._saveChanges(storeName);
  } else {
    self.original = self.original || {};
    self.original[property] = value;
    save && self._saveChanges("_original");
  }
};
/**
 * @method FS.File.prototype.name
 * @public
 * @param {String|null} [value] - If setting the name, specify the new name as the first argument. Otherwise the options argument should be first.
 * @param {Object} [options]
 * @param {Object} [options.store=none,original] - Get or set the name of the version of the file that was saved in this store. Default is the original file name.
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first? Applies to getter usage only.
 * @param {Boolean} [options.save=true] Save change to database? Applies to setter usage only.
 * @returns {String|undefined} If setting, returns `undefined`. If getting, returns the file name.
 */


FS.File.prototype.name = function (value, options) {
  var self = this;

  if (!options && (typeof value === "object" && value !== null || typeof value === "undefined")) {
    // GET
    options = value || {};
    options = options.hash || options; // allow use as UI helper

    return self._getInfo(options.store, options).name;
  } else {
    // SET
    options = options || {};
    return self._setInfo(options.store, 'name', value, typeof options.save === "boolean" ? options.save : true);
  }
};
/**
 * @method FS.File.prototype.extension
 * @public
 * @param {String|null} [value] - If setting the extension, specify the new extension (without period) as the first argument. Otherwise the options argument should be first.
 * @param {Object} [options]
 * @param {Object} [options.store=none,original] - Get or set the extension of the version of the file that was saved in this store. Default is the original file extension.
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first? Applies to getter usage only.
 * @param {Boolean} [options.save=true] Save change to database? Applies to setter usage only.
 * @returns {String|undefined} If setting, returns `undefined`. If getting, returns the file extension or an empty string if there isn't one.
 */


FS.File.prototype.extension = function (value, options) {
  var self = this;

  if (!options && (typeof value === "object" && value !== null || typeof value === "undefined")) {
    // GET
    options = value || {};
    return FS.Utility.getFileExtension(self.name(options) || '');
  } else {
    // SET
    options = options || {};
    var newName = FS.Utility.setFileExtension(self.name(options) || '', value);
    return self._setInfo(options.store, 'name', newName, typeof options.save === "boolean" ? options.save : true);
  }
};
/**
 * @method FS.File.prototype.size
 * @public
 * @param {Number} [value] - If setting the size, specify the new size in bytes as the first argument. Otherwise the options argument should be first.
 * @param {Object} [options]
 * @param {Object} [options.store=none,original] - Get or set the size of the version of the file that was saved in this store. Default is the original file size.
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first? Applies to getter usage only.
 * @param {Boolean} [options.save=true] Save change to database? Applies to setter usage only.
 * @returns {Number|undefined} If setting, returns `undefined`. If getting, returns the file size.
 */


FS.File.prototype.size = function (value, options) {
  var self = this;

  if (!options && (typeof value === "object" && value !== null || typeof value === "undefined")) {
    // GET
    options = value || {};
    options = options.hash || options; // allow use as UI helper

    return self._getInfo(options.store, options).size;
  } else {
    // SET
    options = options || {};
    return self._setInfo(options.store, 'size', value, typeof options.save === "boolean" ? options.save : true);
  }
};
/**
 * @method FS.File.prototype.type
 * @public
 * @param {String} [value] - If setting the type, specify the new type as the first argument. Otherwise the options argument should be first.
 * @param {Object} [options]
 * @param {Object} [options.store=none,original] - Get or set the type of the version of the file that was saved in this store. Default is the original file type.
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first? Applies to getter usage only.
 * @param {Boolean} [options.save=true] Save change to database? Applies to setter usage only.
 * @returns {String|undefined} If setting, returns `undefined`. If getting, returns the file type.
 */


FS.File.prototype.type = function (value, options) {
  var self = this;

  if (!options && (typeof value === "object" && value !== null || typeof value === "undefined")) {
    // GET
    options = value || {};
    options = options.hash || options; // allow use as UI helper

    return self._getInfo(options.store, options).type;
  } else {
    // SET
    options = options || {};
    return self._setInfo(options.store, 'type', value, typeof options.save === "boolean" ? options.save : true);
  }
};
/**
 * @method FS.File.prototype.updatedAt
 * @public
 * @param {String} [value] - If setting updatedAt, specify the new date as the first argument. Otherwise the options argument should be first.
 * @param {Object} [options]
 * @param {Object} [options.store=none,original] - Get or set the last updated date for the version of the file that was saved in this store. Default is the original last updated date.
 * @param {Boolean} [options.updateFileRecordFirst=false] Update this instance with data from the DB first? Applies to getter usage only.
 * @param {Boolean} [options.save=true] Save change to database? Applies to setter usage only.
 * @returns {String|undefined} If setting, returns `undefined`. If getting, returns the file's last updated date.
 */


FS.File.prototype.updatedAt = function (value, options) {
  var self = this;

  if (!options && (typeof value === "object" && value !== null && !(value instanceof Date) || typeof value === "undefined")) {
    // GET
    options = value || {};
    options = options.hash || options; // allow use as UI helper

    return self._getInfo(options.store, options).updatedAt;
  } else {
    // SET
    options = options || {};
    return self._setInfo(options.store, 'updatedAt', value, typeof options.save === "boolean" ? options.save : true);
  }
};
/**
 * @method FS.File.onStoredCallback
 * @summary Calls callback when the file is fully stored to the specify storeName
 * @public
 * @param {String} [storeName] - The name of the file store we want to get called when stored.
 * @param {function} [callback]
 */


FS.File.prototype.onStoredCallback = function (storeName, callback) {
  // Check file is not already stored
  if (this.hasStored(storeName)) {
    callback();
    return;
  }

  if (Meteor.isServer) {
    // Listen to file stored events
    // TODO Require thinking whether it is better to use observer for case of using multiple application instances, Ask for same image url while upload is being done.
    this.on('stored', function (newStoreName) {
      // If stored is completed to the specified store call callback
      if (storeName === newStoreName) {
        // Remove the specified file stored listener
        this.removeListener('stored', arguments.callee);
        callback();
      }
    }.bind(this));
  } else {
    var fileId = this._id,
        collectionName = this.collectionName; // Wait for file to be fully uploaded

    Tracker.autorun(function (c) {
      Meteor.call('_cfs_returnWhenStored', collectionName, fileId, storeName, function (error, result) {
        if (result && result === true) {
          c.stop();
          callback();
        } else {
          Meteor.setTimeout(function () {
            c.invalidate();
          }, 100);
        }
      });
    });
  }
};
/**
 * @method FS.File.onStored
 * @summary Function that returns when the file is fully stored to the specify storeName
 * @public
 * @param {String} storeName - The name of the file store we want to get called when stored.
 *
 * Function that returns when the file is fully stored to the specify storeName.
 *
 * For example needed if wanted to save the direct link to a file on s3 when fully uploaded.
 */


FS.File.prototype.onStored = function (arguments) {
  var onStoredSync = Meteor.wrapAsync(this.onStoredCallback);
  return onStoredSync.call(this, arguments);
};

function isBasicObject(obj) {
  return obj === Object(obj) && Object.getPrototypeOf(obj) === Object.prototype;
} // getPrototypeOf polyfill


if (typeof Object.getPrototypeOf !== "function") {
  if (typeof "".__proto__ === "object") {
    Object.getPrototypeOf = function (object) {
      return object.__proto__;
    };
  } else {
    Object.getPrototypeOf = function (object) {
      // May break if the constructor has been tampered with
      return object.constructor.prototype;
    };
  }
}
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"fsFile-server.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_cfs-file/fsFile-server.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/**
 * Notes a details about a storage adapter failure within the file record
 * @param {string} storeName
 * @param {number} maxTries
 * @return {undefined}
 * @todo deprecate this
 */
FS.File.prototype.logCopyFailure = function (storeName, maxTries) {
  var self = this; // hasStored will update from the fileRecord

  if (self.hasStored(storeName)) {
    throw new Error("logCopyFailure: invalid storeName");
  } // Make sure we have a temporary file saved since we will be
  // trying the save again.


  FS.TempStore.ensureForFile(self);
  var now = new Date();
  var currentCount = self.failures && self.failures.copies && self.failures.copies[storeName] && typeof self.failures.copies[storeName].count === "number" ? self.failures.copies[storeName].count : 0;
  maxTries = maxTries || 5;
  var modifier = {};
  modifier.$set = {};
  modifier.$set['failures.copies.' + storeName + '.lastAttempt'] = now;

  if (currentCount === 0) {
    modifier.$set['failures.copies.' + storeName + '.firstAttempt'] = now;
  }

  modifier.$set['failures.copies.' + storeName + '.count'] = currentCount + 1;
  modifier.$set['failures.copies.' + storeName + '.doneTrying'] = currentCount + 1 >= maxTries;
  self.update(modifier);
};
/**
 * Has this store permanently failed?
 * @param {String} storeName The name of the store
 * @return {boolean} Has this store failed permanently?
 * @todo deprecate this
 */


FS.File.prototype.failedPermanently = function (storeName) {
  var self = this;
  return !!(self.failures && self.failures.copies && self.failures.copies[storeName] && self.failures.copies[storeName].doneTrying);
};
/**
 * @method FS.File.prototype.createReadStream
 * @public
 * @param {String} [storeName]
 * @returns {stream.Readable} Readable NodeJS stream
 *
 * Returns a readable stream. Where the stream reads from depends on the FS.File instance and whether you pass a store name.
 *
 * * If you pass a `storeName`, a readable stream for the file data saved in that store is returned.
 * * If you don't pass a `storeName` and data is attached to the FS.File instance (on `data` property, which must be a DataMan instance), then a readable stream for the attached data is returned.
 * * If you don't pass a `storeName` and there is no data attached to the FS.File instance, a readable stream for the file data currently in the temporary store (`FS.TempStore`) is returned.
 *
 */


FS.File.prototype.createReadStream = function (storeName) {
  var self = this; // If we dont have a store name but got Buffer data?

  if (!storeName && self.data) {
    FS.debug && console.log("fileObj.createReadStream creating read stream for attached data"); // Stream from attached data if present

    return self.data.createReadStream();
  } else if (!storeName && FS.TempStore && FS.TempStore.exists(self)) {
    FS.debug && console.log("fileObj.createReadStream creating read stream for temp store"); // Stream from temp store - its a bit slower than regular streams?

    return FS.TempStore.createReadStream(self);
  } else {
    // Stream from the store using storage adapter
    if (self.isMounted()) {
      var storage = self.collection.storesLookup[storeName] || self.collection.primaryStore;
      FS.debug && console.log("fileObj.createReadStream creating read stream for store", storage.name); // return stream

      return storage.adapter.createReadStream(self);
    } else {
      throw new Meteor.Error('File not mounted');
    }
  }
};
/**
 * @method FS.File.prototype.createWriteStream
 * @public
 * @param {String} [storeName]
 * @returns {stream.Writeable} Writeable NodeJS stream
 *
 * Returns a writeable stream. Where the stream writes to depends on whether you pass in a store name.
 *
 * * If you pass a `storeName`, a writeable stream for (over)writing the file data in that store is returned.
 * * If you don't pass a `storeName`, a writeable stream for writing to the temp store for this file is returned.
 *
 */


FS.File.prototype.createWriteStream = function (storeName) {
  var self = this; // We have to have a mounted file in order for this to work

  if (self.isMounted()) {
    if (!storeName && FS.TempStore && FS.FileWorker) {
      // If we have worker installed - we pass the file to FS.TempStore
      // We dont need the storeName since all stores will be generated from
      // TempStore.
      // This should trigger FS.FileWorker at some point?
      FS.TempStore.createWriteStream(self);
    } else {
      // Stream directly to the store using storage adapter
      var storage = self.collection.storesLookup[storeName] || self.collection.primaryStore;
      return storage.adapter.createWriteStream(self);
    }
  } else {
    throw new Meteor.Error('File not mounted');
  }
};
/**
 * @method FS.File.prototype.copy Makes a copy of the file and underlying data in all stores.
 * @public
 * @returns {FS.File} The new FS.File instance
 */


FS.File.prototype.copy = function () {
  var self = this;

  if (!self.isMounted()) {
    throw new Error("Cannot copy a file that is not associated with a collection");
  } // Get the file record


  var fileRecord = self.collection.files.findOne({
    _id: self._id
  }, {
    transform: null
  }) || {}; // Remove _id and copy keys from the file record

  delete fileRecord._id; // Insert directly; we don't have access to "original" in this case

  var newId = self.collection.files.insert(fileRecord);
  var newFile = self.collection.findOne(newId); // Copy underlying files in the stores

  var mod, oldKey;

  for (var name in newFile.copies) {
    if (newFile.copies.hasOwnProperty(name)) {
      oldKey = newFile.copies[name].key;

      if (oldKey) {
        // We need to ask the adapter for the true oldKey because
        // right now gridfs does some extra stuff.
        // TODO GridFS should probably set the full key object
        // (with _id and filename) into `copies.key`
        // so that copies.key can be passed directly to
        // createReadStreamForFileKey
        var sourceFileStorage = self.collection.storesLookup[name];

        if (!sourceFileStorage) {
          throw new Error(name + " is not a valid store name");
        }

        oldKey = sourceFileStorage.adapter.fileKey(self); // delete so that new fileKey will be generated in copyStoreData

        delete newFile.copies[name].key;
        mod = mod || {};
        mod["copies." + name + ".key"] = copyStoreData(newFile, name, oldKey);
      }
    }
  } // Update keys in the filerecord


  if (mod) {
    newFile.update({
      $set: mod
    });
  }

  return newFile;
};

Meteor.methods({
  // Does a HEAD request to URL to get the type, updatedAt,
  // and size prior to actually downloading the data.
  // That way we can do filter checks without actually downloading.
  '_cfs_getUrlInfo': function (url, options) {
    check(url, String);
    check(options, Object);
    this.unblock();
    var response = HTTP.call("HEAD", url, options);
    var headers = response.headers;
    var result = {};

    if (headers['content-type']) {
      result.type = headers['content-type'];
    }

    if (headers['content-length']) {
      result.size = +headers['content-length'];
    }

    if (headers['last-modified']) {
      result.updatedAt = new Date(headers['last-modified']);
    }

    return result;
  },
  // Helper function that checks whether given fileId from collectionName
  //  Is fully uploaded to specify storeName.
  '_cfs_returnWhenStored': function (collectionName, fileId, storeName) {
    check(collectionName, String);
    check(fileId, String);
    check(storeName, String);
    var collection = FS._collections[collectionName];

    if (!collection) {
      return Meteor.Error('_cfs_returnWhenStored: FSCollection name not exists');
    }

    var file = collection.findOne({
      _id: fileId
    });

    if (!file) {
      return Meteor.Error('_cfs_returnWhenStored: FSFile not exists');
    }

    return file.hasStored(storeName);
  }
}); // TODO maybe this should be in cfs-storage-adapter

function _copyStoreData(fileObj, storeName, sourceKey, callback) {
  if (!fileObj.isMounted()) {
    throw new Error("Cannot copy store data for a file that is not associated with a collection");
  }

  var storage = fileObj.collection.storesLookup[storeName];

  if (!storage) {
    throw new Error(storeName + " is not a valid store name");
  } // We want to prevent beforeWrite and transformWrite from running, so
  // we interact directly with the store.


  var destinationKey = storage.adapter.fileKey(fileObj);
  var readStream = storage.adapter.createReadStreamForFileKey(sourceKey);
  var writeStream = storage.adapter.createWriteStreamForFileKey(destinationKey);
  writeStream.once('stored', function (result) {
    callback(null, result.fileKey);
  });
  writeStream.once('error', function (error) {
    callback(error);
  });
  readStream.pipe(writeStream);
}

var copyStoreData = Meteor.wrapAsync(_copyStoreData);
/**
 * @method FS.File.prototype.copyData Copies the content of a store directly into another store.
 * @public
 * @param {string} sourceStoreName
 * @param {string} targetStoreName
 * @param {boolean=} move
 */

FS.File.prototype.copyData = function (sourceStoreName, targetStoreName, move) {
  move = !!move;
  /**
   * @type {Object.<string,*>}
   */

  var sourceStoreValues = this.copies[sourceStoreName];
  /**
   * @type {string}
   */

  var copyKey = cloneDataToStore(this, sourceStoreName, targetStoreName, move);
  /**
   * @type {Object.<string,*>}
   */

  var targetStoreValues = {};

  for (var v in sourceStoreValues) {
    if (sourceStoreValues.hasOwnProperty(v)) {
      targetStoreValues[v] = sourceStoreValues[v];
    }
  }

  targetStoreValues.key = copyKey;
  targetStoreValues.createdAt = new Date();
  targetStoreValues.updatedAt = new Date();
  /**
   *
   * @type {modifier}
   */

  var modifier = {};
  modifier.$set = {};
  modifier.$set["copies." + targetStoreName] = targetStoreValues;

  if (move) {
    modifier.$unset = {};
    modifier.$unset["copies." + sourceStoreName] = "";
  }

  this.update(modifier);
};
/**
 * @method FS.File.prototype.moveData Moves the content of a store directly into another store.
 * @public
 * @param {string} sourceStoreName
 * @param {string} targetStoreName
 */


FS.File.prototype.moveData = function (sourceStoreName, targetStoreName) {
  this.copyData(sourceStoreName, targetStoreName, true);
}; // TODO maybe this should be in cfs-storage-adapter

/**
 *
 * @param {FS.File} fileObj
 * @param {string} sourceStoreName
 * @param {string} targetStoreName
 * @param {boolean} move
 * @param callback
 * @private
 */


function _copyDataFromStoreToStore(fileObj, sourceStoreName, targetStoreName, move, callback) {
  if (!fileObj.isMounted()) {
    throw new Error("Cannot copy store data for a file that is not associated with a collection");
  }
  /**
   * @type {FS.StorageAdapter}
   */


  var sourceStorage = fileObj.collection.storesLookup[sourceStoreName];
  /**
   * @type {FS.StorageAdapter}
   */

  var targetStorage = fileObj.collection.storesLookup[targetStoreName];

  if (!sourceStorage) {
    throw new Error(sourceStoreName + " is not a valid store name");
  }

  if (!targetStorage) {
    throw new Error(targetStorage + " is not a valid store name");
  } // We want to prevent beforeWrite and transformWrite from running, so
  // we interact directly with the store.


  var sourceKey = sourceStorage.adapter.fileKey(fileObj);
  var targetKey = targetStorage.adapter.fileKey(fileObj);
  var readStream = sourceStorage.adapter.createReadStreamForFileKey(sourceKey);
  var writeStream = targetStorage.adapter.createWriteStreamForFileKey(targetKey);
  writeStream.safeOnce('stored', function (result) {
    if (move && sourceStorage.adapter.remove(fileObj) === false) {
      callback("Copied to store:" + targetStoreName + " with fileKey: " + result.fileKey + ", but could not delete from source store: " + sourceStoreName);
    } else {
      callback(null, result.fileKey);
    }
  });
  writeStream.once('error', function (error) {
    callback(error);
  });
  readStream.pipe(writeStream);
}

var cloneDataToStore = Meteor.wrapAsync(_copyDataFromStoreToStore);
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:cfs-file/checkNpm.js");
require("/node_modules/meteor/steedos:cfs-file/fsFile-common.js");
require("/node_modules/meteor/steedos:cfs-file/fsFile-server.js");

/* Exports */
Package._define("steedos:cfs-file");

})();

//# sourceURL=meteor://💻app/packages/steedos_cfs-file.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtZmlsZS9jaGVja05wbS5qcyIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtZmlsZS9mc0ZpbGUtY29tbW9uLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zOmNmcy1maWxlL2ZzRmlsZS1zZXJ2ZXIuanMiXSwibmFtZXMiOlsiY2hlY2tOcG1WZXJzaW9ucyIsIm1vZHVsZSIsImxpbmsiLCJ2IiwicmVxdWlyZSIsInRlbXAiLCJGUyIsIkZpbGUiLCJyZWYiLCJjcmVhdGVkQnlUcmFuc2Zvcm0iLCJzZWxmIiwiaXNCYXNpY09iamVjdCIsIlV0aWxpdHkiLCJleHRlbmQiLCJjbG9uZUZpbGVSZWNvcmQiLCJmdWxsIiwiYXR0YWNoRGF0YSIsInByb3RvdHlwZSIsIkV2ZW50RW1pdHRlciIsImZzRmlsZUF0dGFjaERhdGEiLCJkYXRhIiwib3B0aW9ucyIsImNhbGxiYWNrIiwiRXJyb3IiLCJ1cmxPcHRzIiwibmFtZSIsInVwZGF0ZWRBdCIsImxhc3RNb2RpZmllZERhdGUiLCJzaXplIiwic2V0RGF0YSIsInR5cGUiLCJCbG9iIiwiRGF0ZSIsInNsaWNlIiwiTWV0ZW9yIiwiaXNDbGllbnQiLCJyZXN1bHQiLCJjYWxsIiwib3JpZ2luYWwiLCJlcnJvciIsImRlYnVnIiwiY29uc29sZSIsImxvZyIsIkRhdGFNYW4iLCJzZXROYW1lIiwiZ2V0RmlsZUV4dGVuc2lvbiIsImxlbmd0aCIsImdldEZpbGVOYW1lIiwidXBsb2FkUHJvZ3Jlc3MiLCJnZXRGaWxlUmVjb3JkIiwidXBsb2FkZWRBdCIsIk1hdGgiLCJyb3VuZCIsImNodW5rQ291bnQiLCJjaHVua1N1bSIsImNvbnRyb2xsZWRCeURlcHMiLCJEZXBzIiwiYWN0aXZlIiwiZ2V0Q29sbGVjdGlvbiIsImNvbGxlY3Rpb24iLCJjb2xsZWN0aW9uTmFtZSIsIl9jb2xsZWN0aW9ucyIsImlzTW91bnRlZCIsIl9pZCIsImZpbGVSZWNvcmQiLCJmaWxlcyIsImZpbmRPbmUiLCJ1cGRhdGUiLCJtb2RpZmllciIsIkpTT04iLCJzdHJpbmdpZnkiLCJkZWZhdWx0Q2FsbGJhY2siLCJlcnIiLCJjb3VudCIsIl9zYXZlQ2hhbmdlcyIsIndoYXQiLCJtb2QiLCIkc2V0IiwiaW5mbyIsImNvcGllcyIsInJlbW92ZSIsInJlcyIsImdldEV4dGVuc2lvbiIsImV4dGVuc2lvbiIsImNoZWNrQ29udGVudFR5cGUiLCJmc0ZpbGUiLCJzdG9yZU5hbWUiLCJzdGFydE9mVHlwZSIsImhhc1N0b3JlZCIsInN0b3JlIiwiaW5kZXhPZiIsImlzSW1hZ2UiLCJpc1ZpZGVvIiwiaXNBdWRpbyIsImZvcm1hdHRlZFNpemUiLCJmc0ZpbGVGb3JtYXR0ZWRTaXplIiwibnVtZXJhbCIsImhhc2giLCJmb3JtYXQiLCJmb3JtYXRTdHJpbmciLCJpc1VwbG9hZGVkIiwib3B0aW1pc3RpYyIsImlzRW1wdHkiLCJrZXkiLCJoYXNDb3B5IiwiZ2V0Q29weUluZm8iLCJfZ2V0SW5mbyIsInVwZGF0ZUZpbGVSZWNvcmRGaXJzdCIsIl9zZXRJbmZvIiwicHJvcGVydHkiLCJ2YWx1ZSIsInNhdmUiLCJuZXdOYW1lIiwic2V0RmlsZUV4dGVuc2lvbiIsIm9uU3RvcmVkQ2FsbGJhY2siLCJpc1NlcnZlciIsIm9uIiwibmV3U3RvcmVOYW1lIiwicmVtb3ZlTGlzdGVuZXIiLCJhcmd1bWVudHMiLCJjYWxsZWUiLCJiaW5kIiwiZmlsZUlkIiwiVHJhY2tlciIsImF1dG9ydW4iLCJjIiwic3RvcCIsInNldFRpbWVvdXQiLCJpbnZhbGlkYXRlIiwib25TdG9yZWQiLCJvblN0b3JlZFN5bmMiLCJ3cmFwQXN5bmMiLCJvYmoiLCJPYmplY3QiLCJnZXRQcm90b3R5cGVPZiIsIl9fcHJvdG9fXyIsIm9iamVjdCIsImNvbnN0cnVjdG9yIiwibG9nQ29weUZhaWx1cmUiLCJtYXhUcmllcyIsIlRlbXBTdG9yZSIsImVuc3VyZUZvckZpbGUiLCJub3ciLCJjdXJyZW50Q291bnQiLCJmYWlsdXJlcyIsImZhaWxlZFBlcm1hbmVudGx5IiwiZG9uZVRyeWluZyIsImNyZWF0ZVJlYWRTdHJlYW0iLCJleGlzdHMiLCJzdG9yYWdlIiwic3RvcmVzTG9va3VwIiwicHJpbWFyeVN0b3JlIiwiYWRhcHRlciIsImNyZWF0ZVdyaXRlU3RyZWFtIiwiRmlsZVdvcmtlciIsImNvcHkiLCJ0cmFuc2Zvcm0iLCJuZXdJZCIsImluc2VydCIsIm5ld0ZpbGUiLCJvbGRLZXkiLCJoYXNPd25Qcm9wZXJ0eSIsInNvdXJjZUZpbGVTdG9yYWdlIiwiZmlsZUtleSIsImNvcHlTdG9yZURhdGEiLCJtZXRob2RzIiwidXJsIiwiY2hlY2siLCJTdHJpbmciLCJ1bmJsb2NrIiwicmVzcG9uc2UiLCJIVFRQIiwiaGVhZGVycyIsImZpbGUiLCJfY29weVN0b3JlRGF0YSIsImZpbGVPYmoiLCJzb3VyY2VLZXkiLCJkZXN0aW5hdGlvbktleSIsInJlYWRTdHJlYW0iLCJjcmVhdGVSZWFkU3RyZWFtRm9yRmlsZUtleSIsIndyaXRlU3RyZWFtIiwiY3JlYXRlV3JpdGVTdHJlYW1Gb3JGaWxlS2V5Iiwib25jZSIsInBpcGUiLCJjb3B5RGF0YSIsInNvdXJjZVN0b3JlTmFtZSIsInRhcmdldFN0b3JlTmFtZSIsIm1vdmUiLCJzb3VyY2VTdG9yZVZhbHVlcyIsImNvcHlLZXkiLCJjbG9uZURhdGFUb1N0b3JlIiwidGFyZ2V0U3RvcmVWYWx1ZXMiLCJjcmVhdGVkQXQiLCIkdW5zZXQiLCJtb3ZlRGF0YSIsIl9jb3B5RGF0YUZyb21TdG9yZVRvU3RvcmUiLCJzb3VyY2VTdG9yYWdlIiwidGFyZ2V0U3RvcmFnZSIsInRhcmdldEtleSIsInNhZmVPbmNlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLGdCQUFKO0FBQXFCQyxNQUFNLENBQUNDLElBQVAsQ0FBWSxvQ0FBWixFQUFpRDtBQUFDRixrQkFBZ0IsQ0FBQ0csQ0FBRCxFQUFHO0FBQUNILG9CQUFnQixHQUFDRyxD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bEIsYUFBVyxDQUFDbUIsUUFBWixDQUFxQixRQUFyQixFQUErQixVQUFTbkssTUFBVCxFQUFpQjtBQUM5QyxRQUFHdUosSUFBSSxJQUFJUyxhQUFhLENBQUM1QyxPQUFkLENBQXNCeEUsTUFBdEIsQ0FBNkIrRixPQUE3QixNQUF3QyxLQUFuRCxFQUF5RDtBQUN2RHpKLGNBQVEsQ0FBQyxxQkFBcUJvSyxlQUFyQixHQUNQLGlCQURPLEdBRVB0SixNQUFNLENBQUMrSCxPQUZBLEdBR1AsNENBSE8sR0FJUHNCLGVBSk0sQ0FBUjtBQUtELEtBTkQsTUFNSztBQUNIbkssY0FBUSxDQUFDLElBQUQsRUFBT2MsTUFBTSxDQUFDK0gsT0FBZCxDQUFSO0FBQ0Q7QUFDRixHQVZEO0FBWUFpQixhQUFXLENBQUNFLElBQVosQ0FBaUIsT0FBakIsRUFBMEIsVUFBUy9JLEtBQVQsRUFBZ0I7QUFDeENqQixZQUFRLENBQUNpQixLQUFELENBQVI7QUFDRCxHQUZEO0FBSUEySSxZQUFVLENBQUNLLElBQVgsQ0FBZ0JILFdBQWhCO0FBQ0Q7O0FBQ0QsSUFBSVUsZ0JBQWdCLEdBQUc1SixNQUFNLENBQUNpRyxTQUFQLENBQWlCZ0UseUJBQWpCLENBQXZCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfY2ZzLWZpbGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBmaXggd2FybmluZzogeHh4IG5vdCBpbnN0YWxsZWRcclxucmVxdWlyZShcInRlbXAvcGFja2FnZS5qc29uXCIpO1xyXG5cclxuaW1wb3J0IHsgY2hlY2tOcG1WZXJzaW9ucyB9IGZyb20gJ21ldGVvci90bWVhc2RheTpjaGVjay1ucG0tdmVyc2lvbnMnO1xyXG5jaGVja05wbVZlcnNpb25zKHtcclxuXHR0ZW1wOiBcIjAuNy4wXCIgLy8gZm9yIHRlc3RzIG9ubHlcclxufSwgJ3N0ZWVkb3M6Y2ZzLWZpbGUnKTsiLCIvKipcclxuICogQG1ldGhvZCBGUy5GaWxlXHJcbiAqIEBuYW1lc3BhY2UgRlMuRmlsZVxyXG4gKiBAcHVibGljXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge29iamVjdHxGUy5GaWxlfGRhdGEgdG8gYXR0YWNofSBbcmVmXSBBbm90aGVyIEZTLkZpbGUgaW5zdGFuY2UsIGEgZmlsZXJlY29yZCwgb3Igc29tZSBkYXRhIHRvIHBhc3MgdG8gYXR0YWNoRGF0YVxyXG4gKi9cclxuRlMuRmlsZSA9IGZ1bmN0aW9uKHJlZiwgY3JlYXRlZEJ5VHJhbnNmb3JtKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICBzZWxmLmNyZWF0ZWRCeVRyYW5zZm9ybSA9ICEhY3JlYXRlZEJ5VHJhbnNmb3JtO1xyXG5cclxuICBpZiAocmVmIGluc3RhbmNlb2YgRlMuRmlsZSB8fCBpc0Jhc2ljT2JqZWN0KHJlZikpIHtcclxuICAgIC8vIEV4dGVuZCBzZWxmIHdpdGggZmlsZXJlY29yZCByZWxhdGVkIGRhdGFcclxuICAgIEZTLlV0aWxpdHkuZXh0ZW5kKHNlbGYsIEZTLlV0aWxpdHkuY2xvbmVGaWxlUmVjb3JkKHJlZiwge2Z1bGw6IHRydWV9KSk7XHJcbiAgfSBlbHNlIGlmIChyZWYpIHtcclxuICAgIHNlbGYuYXR0YWNoRGF0YShyZWYpO1xyXG4gIH1cclxufTtcclxuXHJcbi8vIEFuIEZTLkZpbGUgY2FuIGVtaXQgZXZlbnRzXHJcbkZTLkZpbGUucHJvdG90eXBlID0gbmV3IEV2ZW50RW1pdHRlcigpO1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuRmlsZS5wcm90b3R5cGUuYXR0YWNoRGF0YVxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7RmlsZXxCbG9ifEJ1ZmZlcnxBcnJheUJ1ZmZlcnxVaW50OEFycmF5fFN0cmluZ30gZGF0YSBUaGUgZGF0YSB0aGF0IHlvdSB3YW50IHRvIGF0dGFjaCB0byB0aGUgZmlsZS5cclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXSBPcHRpb25zXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbb3B0aW9ucy50eXBlXSBUaGUgZGF0YSBjb250ZW50IChNSU1FKSB0eXBlLCBpZiBrbm93bi5cclxuICogQHBhcmFtIHtTdHJpbmd9IFtvcHRpb25zLmhlYWRlcnNdIFdoZW4gYXR0YWNoaW5nIGEgVVJMLCBoZWFkZXJzIHRvIGJlIHVzZWQgZm9yIHRoZSBHRVQgcmVxdWVzdCAoY3VycmVudGx5IHNlcnZlciBvbmx5KVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gW29wdGlvbnMuYXV0aF0gV2hlbiBhdHRhY2hpbmcgYSBVUkwsIFwidXNlcm5hbWU6cGFzc3dvcmRcIiB0byBiZSB1c2VkIGZvciB0aGUgR0VUIHJlcXVlc3QgKGN1cnJlbnRseSBzZXJ2ZXIgb25seSlcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXSBDYWxsYmFjayBmdW5jdGlvbiwgY2FsbGJhY2soZXJyb3IpLiBPbiB0aGUgY2xpZW50LCBhIGNhbGxiYWNrIGlzIHJlcXVpcmVkIGlmIGRhdGEgaXMgYSBVUkwuXHJcbiAqIEByZXR1cm5zIHtGUy5GaWxlfSBUaGlzIEZTLkZpbGUgaW5zdGFuY2UuXHJcbiAqXHJcbiAqL1xyXG5GUy5GaWxlLnByb3RvdHlwZS5hdHRhY2hEYXRhID0gZnVuY3Rpb24gZnNGaWxlQXR0YWNoRGF0YShkYXRhLCBvcHRpb25zLCBjYWxsYmFjaykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgaWYgKCFjYWxsYmFjayAmJiB0eXBlb2Ygb3B0aW9ucyA9PT0gXCJmdW5jdGlvblwiKSB7XHJcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XHJcbiAgICBvcHRpb25zID0ge307XHJcbiAgfVxyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICBpZiAoIWRhdGEpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcignRlMuRmlsZS5hdHRhY2hEYXRhIHJlcXVpcmVzIGEgZGF0YSBhcmd1bWVudCB3aXRoIHNvbWUgZGF0YScpO1xyXG4gIH1cclxuXHJcbiAgdmFyIHVybE9wdHM7XHJcblxyXG4gIC8vIFNldCBhbnkgb3RoZXIgcHJvcGVydGllcyB3ZSBjYW4gZGV0ZXJtaW5lIGZyb20gdGhlIHNvdXJjZSBkYXRhXHJcbiAgLy8gRmlsZVxyXG4gIGlmICh0eXBlb2YgRmlsZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkYXRhIGluc3RhbmNlb2YgRmlsZSkge1xyXG4gICAgc2VsZi5uYW1lKGRhdGEubmFtZSk7XHJcbiAgICBzZWxmLnVwZGF0ZWRBdChkYXRhLmxhc3RNb2RpZmllZERhdGUpO1xyXG4gICAgc2VsZi5zaXplKGRhdGEuc2l6ZSk7XHJcbiAgICBzZXREYXRhKGRhdGEudHlwZSk7XHJcbiAgfVxyXG4gIC8vIEJsb2JcclxuICBlbHNlIGlmICh0eXBlb2YgQmxvYiAhPT0gXCJ1bmRlZmluZWRcIiAmJiBkYXRhIGluc3RhbmNlb2YgQmxvYikge1xyXG4gICAgc2VsZi5uYW1lKGRhdGEubmFtZSk7XHJcbiAgICBzZWxmLnVwZGF0ZWRBdChuZXcgRGF0ZSgpKTtcclxuICAgIHNlbGYuc2l6ZShkYXRhLnNpemUpO1xyXG4gICAgc2V0RGF0YShkYXRhLnR5cGUpO1xyXG4gIH1cclxuICAvLyBVUkw6IHdlIG5lZWQgdG8gZG8gYSBIRUFEIHJlcXVlc3QgdG8gZ2V0IHRoZSB0eXBlIGJlY2F1c2UgdHlwZVxyXG4gIC8vIGlzIHJlcXVpcmVkIGZvciBmaWx0ZXJpbmcgdG8gd29yay5cclxuICBlbHNlIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiAmJiAoZGF0YS5zbGljZSgwLCA1KSA9PT0gXCJodHRwOlwiIHx8IGRhdGEuc2xpY2UoMCwgNikgPT09IFwiaHR0cHM6XCIpKSB7XHJcbiAgICB1cmxPcHRzID0gRlMuVXRpbGl0eS5leHRlbmQoe30sIG9wdGlvbnMpO1xyXG4gICAgaWYgKHVybE9wdHMudHlwZSkge1xyXG4gICAgICBkZWxldGUgdXJsT3B0cy50eXBlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICghY2FsbGJhY2spIHtcclxuICAgICAgaWYgKE1ldGVvci5pc0NsaWVudCkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRlMuRmlsZS5hdHRhY2hEYXRhIHJlcXVpcmVzIGEgY2FsbGJhY2sgd2hlbiBhdHRhY2hpbmcgYSBVUkwgb24gdGhlIGNsaWVudCcpO1xyXG4gICAgICB9XHJcbiAgICAgIHZhciByZXN1bHQgPSBNZXRlb3IuY2FsbCgnX2Nmc19nZXRVcmxJbmZvJywgZGF0YSwgdXJsT3B0cyk7XHJcbiAgICAgIEZTLlV0aWxpdHkuZXh0ZW5kKHNlbGYsIHtvcmlnaW5hbDogcmVzdWx0fSk7XHJcbiAgICAgIHNldERhdGEocmVzdWx0LnR5cGUpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgTWV0ZW9yLmNhbGwoJ19jZnNfZ2V0VXJsSW5mbycsIGRhdGEsIHVybE9wdHMsIGZ1bmN0aW9uIChlcnJvciwgcmVzdWx0KSB7XHJcbiAgICAgICAgRlMuZGVidWcgJiYgY29uc29sZS5sb2coXCJVUkwgSEVBRCBSRVNVTFQ6XCIsIHJlc3VsdCk7XHJcbiAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICBjYWxsYmFjayhlcnJvcik7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHZhciB0eXBlID0gcmVzdWx0LnR5cGUgfHwgb3B0aW9ucy50eXBlO1xyXG4gICAgICAgICAgaWYgKCEgdHlwZSkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZTLkZpbGUuYXR0YWNoRGF0YSBnb3QgYSBVUkwgZm9yIHdoaWNoIGl0IGNvdWxkIG5vdCBkZXRlcm1pbmUgdGhlIE1JTUUgdHlwZSBhbmQgbm9uZSB3YXMgcHJvdmlkZWQgdXNpbmcgb3B0aW9ucy50eXBlJyk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBGUy5VdGlsaXR5LmV4dGVuZChzZWxmLCB7b3JpZ2luYWw6IHJlc3VsdH0pO1xyXG4gICAgICAgICAgc2V0RGF0YSh0eXBlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuICAvLyBFdmVyeXRoaW5nIGVsc2VcclxuICBlbHNlIHtcclxuICAgIHNldERhdGEob3B0aW9ucy50eXBlKTtcclxuICB9XHJcblxyXG4gIC8vIFNldCB0aGUgZGF0YVxyXG4gIGZ1bmN0aW9uIHNldERhdGEodHlwZSkge1xyXG4gICAgc2VsZi5kYXRhID0gbmV3IERhdGFNYW4oZGF0YSwgdHlwZSwgdXJsT3B0cyk7XHJcblxyXG4gICAgLy8gVXBkYXRlIHRoZSB0eXBlIHRvIG1hdGNoIHdoYXQgdGhlIGRhdGEgaXNcclxuICAgIHNlbGYudHlwZShzZWxmLmRhdGEudHlwZSgpKTtcclxuXHJcbiAgICAvLyBVcGRhdGUgdGhlIHNpemUgdG8gbWF0Y2ggd2hhdCB0aGUgZGF0YSBpcy5cclxuICAgIC8vIEl0J3MgYWx3YXlzIHNhZmUgdG8gY2FsbCBzZWxmLmRhdGEuc2l6ZSgpIHdpdGhvdXQgc3VwcGx5aW5nIGEgY2FsbGJhY2tcclxuICAgIC8vIGJlY2F1c2UgaXQgcmVxdWlyZXMgYSBjYWxsYmFjayBvbmx5IGZvciBVUkxzIG9uIHRoZSBjbGllbnQsIGFuZCB3ZVxyXG4gICAgLy8gYWxyZWFkeSBhZGRlZCBzaXplIGZvciBVUkxzIHdoZW4gd2UgZ290IHRoZSByZXN1bHQgZnJvbSAnX2Nmc19nZXRVcmxJbmZvJyBtZXRob2QuXHJcbiAgICBpZiAoIXNlbGYuc2l6ZSgpKSB7XHJcbiAgICAgIGlmIChjYWxsYmFjaykge1xyXG4gICAgICAgIHNlbGYuZGF0YS5zaXplKGZ1bmN0aW9uIChlcnJvciwgc2l6ZSkge1xyXG4gICAgICAgICAgaWYgKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKGVycm9yKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNlbGYuc2l6ZShzaXplKTtcclxuICAgICAgICAgICAgc2V0TmFtZSgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNlbGYuc2l6ZShzZWxmLmRhdGEuc2l6ZSgpKTtcclxuICAgICAgICBzZXROYW1lKCk7XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHNldE5hbWUoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHNldE5hbWUoKSB7XHJcbiAgICAvLyBTZWUgaWYgd2UgY2FuIGV4dHJhY3QgYSBmaWxlIG5hbWUgZnJvbSBVUkwgb3IgZmlsZXBhdGhcclxuICAgIGlmICghc2VsZi5uYW1lKCkgJiYgdHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcclxuICAgICAgLy8gbmFtZSBmcm9tIFVSTFxyXG4gICAgICBpZiAoZGF0YS5zbGljZSgwLCA1KSA9PT0gXCJodHRwOlwiIHx8IGRhdGEuc2xpY2UoMCwgNikgPT09IFwiaHR0cHM6XCIpIHtcclxuICAgICAgICBpZiAoRlMuVXRpbGl0eS5nZXRGaWxlRXh0ZW5zaW9uKGRhdGEpLmxlbmd0aCkge1xyXG4gICAgICAgICAgLy8gZm9yIGEgVVJMIHdlIGFzc3VtZSB0aGUgZW5kIGlzIGEgZmlsZW5hbWUgb25seSBpZiBpdCBoYXMgYW4gZXh0ZW5zaW9uXHJcbiAgICAgICAgICBzZWxmLm5hbWUoRlMuVXRpbGl0eS5nZXRGaWxlTmFtZShkYXRhKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8vIG5hbWUgZnJvbSBmaWxlcGF0aFxyXG4gICAgICBlbHNlIGlmIChkYXRhLnNsaWNlKDAsIDUpICE9PSBcImRhdGE6XCIpIHtcclxuICAgICAgICBzZWxmLm5hbWUoRlMuVXRpbGl0eS5nZXRGaWxlTmFtZShkYXRhKSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjYWxsYmFjayAmJiBjYWxsYmFjaygpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHNlbGY7IC8vYWxsb3cgY2hhaW5pbmdcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGUucHJvdG90eXBlLnVwbG9hZFByb2dyZXNzXHJcbiAqIEBwdWJsaWNcclxuICogQHJldHVybnMge251bWJlcn0gVGhlIHNlcnZlciBjb25maXJtZWQgdXBsb2FkIHByb2dyZXNzXHJcbiAqL1xyXG5GUy5GaWxlLnByb3RvdHlwZS51cGxvYWRQcm9ncmVzcyA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICAvLyBNYWtlIHN1cmUgb3VyIGZpbGUgcmVjb3JkIGlzIHVwZGF0ZWRcclxuICBzZWxmLmdldEZpbGVSZWNvcmQoKTtcclxuXHJcbiAgLy8gSWYgZnVsbHkgdXBsb2FkZWQsIHJldHVybiAxMDBcclxuICBpZiAoc2VsZi51cGxvYWRlZEF0KSB7XHJcbiAgICByZXR1cm4gMTAwO1xyXG4gIH1cclxuICAvLyBPdGhlcndpc2UgcmV0dXJuIHRoZSBjb25maXJtZWQgcHJvZ3Jlc3Mgb3IgMFxyXG4gIGVsc2Uge1xyXG4gICAgcmV0dXJuIE1hdGgucm91bmQoKHNlbGYuY2h1bmtDb3VudCB8fCAwKSAvIChzZWxmLmNodW5rU3VtIHx8IDEpICogMTAwKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5GaWxlLnByb3RvdHlwZS5jb250cm9sbGVkQnlEZXBzXHJcbiAqIEBwdWJsaWNcclxuICogQHJldHVybnMge0ZTLkNvbGxlY3Rpb259IFJldHVybnMgdHJ1ZSBpZiB0aGlzIEZTLkZpbGUgaXMgcmVhY3RpdmVcclxuICpcclxuICogPiBOb3RlOiBSZXR1cm5zIHRydWUgaWYgdGhpcyBGUy5GaWxlIG9iamVjdCB3YXMgY3JlYXRlZCBieSBhIEZTLkNvbGxlY3Rpb25cclxuICogPiBhbmQgd2UgYXJlIGluIGEgcmVhY3RpdmUgY29tcHV0YXRpb25zLiBXaGF0IGRvZXMgdGhpcyBtZWFuPyBXZWxsIGl0IHNob3VsZFxyXG4gKiA+IG1lYW4gdGhhdCBvdXIgZmlsZVJlY29yZCBpcyBmdWxseSB1cGRhdGVkIGJ5IE1ldGVvciBhbmQgd2UgYXJlIG1vdW50ZWQgb25cclxuICogPiBhIGNvbGxlY3Rpb25cclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLmNvbnRyb2xsZWRCeURlcHMgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgcmV0dXJuIHNlbGYuY3JlYXRlZEJ5VHJhbnNmb3JtICYmIERlcHMuYWN0aXZlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuRmlsZS5wcm90b3R5cGUuZ2V0Q29sbGVjdGlvblxyXG4gKiBAcHVibGljXHJcbiAqIEByZXR1cm5zIHtGUy5Db2xsZWN0aW9ufSBSZXR1cm5zIGF0dGFjaGVkIGNvbGxlY3Rpb24gb3IgdW5kZWZpbmVkIGlmIG5vdCBtb3VudGVkXHJcbiAqL1xyXG5GUy5GaWxlLnByb3RvdHlwZS5nZXRDb2xsZWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgLy8gR2V0IHRoZSBjb2xsZWN0aW9uIHJlZmVyZW5jZVxyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgLy8gSWYgd2UgYWxyZWFkeSBtYWRlIHRoZSBsaW5rIHRoZW4gZG8gbm8gbW9yZVxyXG4gIGlmIChzZWxmLmNvbGxlY3Rpb24pIHtcclxuICAgIHJldHVybiBzZWxmLmNvbGxlY3Rpb247XHJcbiAgfVxyXG5cclxuICAvLyBJZiB3ZSBkb24ndCBoYXZlIGEgY29sbGVjdGlvbk5hbWUgdGhlbiB0aGVyZSdzIG5vdCBtdWNoIHRvIGRvLCB0aGUgZmlsZSBpc1xyXG4gIC8vIG5vdCBtb3VudGVkIHlldFxyXG4gIGlmICghc2VsZi5jb2xsZWN0aW9uTmFtZSkge1xyXG4gICAgLy8gU2hvdWxkIG5vdCB0aHJvdyBhbiBlcnJvciBoZXJlIC0gY291bGQgYmUgY29tbW9uIHRoYXQgdGhlIGZpbGUgaXMgbm90XHJcbiAgICAvLyB5ZXQgbW91bnRlZCBpbnRvIGEgY29sbGVjdGlvblxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgLy8gTGluayB0aGUgY29sbGVjdGlvbiB0byB0aGUgZmlsZVxyXG4gIHNlbGYuY29sbGVjdGlvbiA9IEZTLl9jb2xsZWN0aW9uc1tzZWxmLmNvbGxlY3Rpb25OYW1lXTtcclxuXHJcbiAgcmV0dXJuIHNlbGYuY29sbGVjdGlvbjsgLy9wb3NzaWJseSB1bmRlZmluZWQsIGJ1dCB0aGF0J3MgZGVzaXJlZCBiZWhhdmlvclxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuRmlsZS5wcm90b3R5cGUuaXNNb3VudGVkXHJcbiAqIEBwdWJsaWNcclxuICogQHJldHVybnMge0ZTLkNvbGxlY3Rpb259IFJldHVybnMgYXR0YWNoZWQgY29sbGVjdGlvbiBvciB1bmRlZmluZWQgaWYgbm90IG1vdW50ZWRcclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLmlzTW91bnRlZCA9IEZTLkZpbGUucHJvdG90eXBlLmdldENvbGxlY3Rpb247XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5GaWxlLnByb3RvdHlwZS5nZXRGaWxlUmVjb3JkIFJldHVybnMgdGhlIGZpbGVSZWNvcmRcclxuICogQHB1YmxpY1xyXG4gKiBAcmV0dXJucyB7b2JqZWN0fSBUaGUgZmlsZXJlY29yZFxyXG4gKi9cclxuRlMuRmlsZS5wcm90b3R5cGUuZ2V0RmlsZVJlY29yZCA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICAvLyBDaGVjayBpZiB0aGlzIGZpbGUgb2JqZWN0IGZpbGVSZWNvcmQgaXMga2VwdCB1cGRhdGVkIGJ5IE1ldGVvciwgaWYgc29cclxuICAvLyByZXR1cm4gc2VsZlxyXG4gIGlmIChzZWxmLmNvbnRyb2xsZWRCeURlcHMoKSkge1xyXG4gICAgcmV0dXJuIHNlbGY7XHJcbiAgfVxyXG4gIC8vIEdvIGZvciBtYW51YWxseSB1cGRhdGluZyB0aGUgZmlsZSByZWNvcmRcclxuICBpZiAoc2VsZi5pc01vdW50ZWQoKSkge1xyXG4gICAgRlMuZGVidWcgJiYgY29uc29sZS5sb2coJ0dFVCBGSUxFUkVDT1JEOiAnICsgc2VsZi5faWQpO1xyXG5cclxuICAgIC8vIFJldHVybiB0aGUgZmlsZVJlY29yZCBvciBhbiBlbXB0eSBvYmplY3RcclxuICAgIHZhciBmaWxlUmVjb3JkID0gc2VsZi5jb2xsZWN0aW9uLmZpbGVzLmZpbmRPbmUoe19pZDogc2VsZi5faWR9KSB8fCB7fTtcclxuICAgIEZTLlV0aWxpdHkuZXh0ZW5kKHNlbGYsIGZpbGVSZWNvcmQpO1xyXG4gICAgcmV0dXJuIGZpbGVSZWNvcmQ7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFdlIHJldHVybiBhbiBlbXB0eSBvYmplY3QsIHRoaXMgd2F5IHVzZXJzIGNhbiBzdGlsbCBkbyBgZ2V0UmVjb3JkKCkuc2l6ZWBcclxuICAgIC8vIFdpdGhvdXQgZ2V0dGluZyBhbiBlcnJvclxyXG4gICAgcmV0dXJuIHt9O1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGUucHJvdG90eXBlLnVwZGF0ZVxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7bW9kaWZpZXJ9IG1vZGlmaWVyXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cclxuICogQHBhcmFtIHtmdW5jdGlvbn0gW2NhbGxiYWNrXVxyXG4gKlxyXG4gKiBVcGRhdGVzIHRoZSBmaWxlUmVjb3JkLlxyXG4gKi9cclxuRlMuRmlsZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24obW9kaWZpZXIsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICBGUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnVVBEQVRFOiAnICsgSlNPTi5zdHJpbmdpZnkobW9kaWZpZXIpKTtcclxuXHJcbiAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgb3B0aW9ucyBhbmQgY2FsbGJhY2tcclxuICBpZiAoIWNhbGxiYWNrICYmIHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XHJcbiAgICBvcHRpb25zID0ge307XHJcbiAgfVxyXG4gIGNhbGxiYWNrID0gY2FsbGJhY2sgfHwgRlMuVXRpbGl0eS5kZWZhdWx0Q2FsbGJhY2s7XHJcblxyXG4gIGlmICghc2VsZi5pc01vdW50ZWQoKSkge1xyXG4gICAgY2FsbGJhY2sobmV3IEVycm9yKFwiQ2Fubm90IHVwZGF0ZSBhIGZpbGUgdGhhdCBpcyBub3QgYXNzb2NpYXRlZCB3aXRoIGEgY29sbGVjdGlvblwiKSk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICAvLyBDYWxsIGNvbGxlY3Rpb24gdXBkYXRlIC0gRmlsZSByZWNvcmRcclxuICByZXR1cm4gc2VsZi5jb2xsZWN0aW9uLmZpbGVzLnVwZGF0ZSh7X2lkOiBzZWxmLl9pZH0sIG1vZGlmaWVyLCBvcHRpb25zLCBmdW5jdGlvbihlcnIsIGNvdW50KSB7XHJcbiAgICAvLyBVcGRhdGUgdGhlIGZpbGVSZWNvcmQgaWYgaXQgd2FzIGNoYW5nZWQgYW5kIG9uIHRoZSBjbGllbnRcclxuICAgIC8vIFRoZSBzZXJ2ZXItc2lkZSBtZXRob2RzIHdpbGwgcHVsbCB0aGUgZmlsZVJlY29yZCBpZiBuZWVkZWRcclxuICAgIGlmIChjb3VudCA+IDAgJiYgTWV0ZW9yLmlzQ2xpZW50KVxyXG4gICAgICBzZWxmLmdldEZpbGVSZWNvcmQoKTtcclxuICAgIC8vIENhbGwgY2FsbGJhY2tcclxuICAgIGNhbGxiYWNrKGVyciwgY291bnQpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuRmlsZS5wcm90b3R5cGUuX3NhdmVDaGFuZ2VzXHJcbiAqIEBwcml2YXRlXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbd2hhdF0gXCJfb3JpZ2luYWxcIiB0byBzYXZlIG9yaWdpbmFsIGluZm8sIG9yIGEgc3RvcmUgbmFtZSB0byBzYXZlIGluZm8gZm9yIHRoYXQgc3RvcmUsIG9yIHNhdmVzIGV2ZXJ5dGhpbmdcclxuICpcclxuICogVXBkYXRlcyB0aGUgZmlsZVJlY29yZCBmcm9tIHZhbHVlcyBjdXJyZW50bHkgc2V0IG9uIHRoZSBGUy5GaWxlIGluc3RhbmNlLlxyXG4gKi9cclxuRlMuRmlsZS5wcm90b3R5cGUuX3NhdmVDaGFuZ2VzID0gZnVuY3Rpb24od2hhdCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgaWYgKCFzZWxmLmlzTW91bnRlZCgpKSB7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG5cclxuICBGUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhcIkZTLkZpbGUuX3NhdmVDaGFuZ2VzOlwiLCB3aGF0IHx8IFwiYWxsXCIpO1xyXG5cclxuICB2YXIgbW9kID0geyRzZXQ6IHt9fTtcclxuICBpZiAod2hhdCA9PT0gXCJfb3JpZ2luYWxcIikge1xyXG4gICAgbW9kLiRzZXQub3JpZ2luYWwgPSBzZWxmLm9yaWdpbmFsO1xyXG4gIH0gZWxzZSBpZiAodHlwZW9mIHdoYXQgPT09IFwic3RyaW5nXCIpIHtcclxuICAgIHZhciBpbmZvID0gc2VsZi5jb3BpZXNbd2hhdF07XHJcbiAgICBpZiAoaW5mbykge1xyXG4gICAgICBtb2QuJHNldFtcImNvcGllcy5cIiArIHdoYXRdID0gaW5mbztcclxuICAgIH1cclxuICB9IGVsc2Uge1xyXG4gICAgbW9kLiRzZXQub3JpZ2luYWwgPSBzZWxmLm9yaWdpbmFsO1xyXG4gICAgbW9kLiRzZXQuY29waWVzID0gc2VsZi5jb3BpZXM7XHJcbiAgfVxyXG5cclxuICBzZWxmLnVwZGF0ZShtb2QpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuRmlsZS5wcm90b3R5cGUucmVtb3ZlXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gW2NhbGxiYWNrXVxyXG4gKiBAcmV0dXJucyB7bnVtYmVyfSBDb3VudFxyXG4gKlxyXG4gKiBSZW1vdmUgdGhlIGN1cnJlbnQgZmlsZSBmcm9tIGl0cyBGUy5Db2xsZWN0aW9uXHJcbiAqL1xyXG5GUy5GaWxlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihjYWxsYmFjaykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgRlMuZGVidWcgJiYgY29uc29sZS5sb2coJ1JFTU9WRTogJyArIHNlbGYuX2lkKTtcclxuXHJcbiAgY2FsbGJhY2sgPSBjYWxsYmFjayB8fCBGUy5VdGlsaXR5LmRlZmF1bHRDYWxsYmFjaztcclxuXHJcbiAgaWYgKCFzZWxmLmlzTW91bnRlZCgpKSB7XHJcbiAgICBjYWxsYmFjayhuZXcgRXJyb3IoXCJDYW5ub3QgcmVtb3ZlIGEgZmlsZSB0aGF0IGlzIG5vdCBhc3NvY2lhdGVkIHdpdGggYSBjb2xsZWN0aW9uXCIpKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHJldHVybiBzZWxmLmNvbGxlY3Rpb24uZmlsZXMucmVtb3ZlKHtfaWQ6IHNlbGYuX2lkfSwgZnVuY3Rpb24oZXJyLCByZXMpIHtcclxuICAgIGlmICghZXJyKSB7XHJcbiAgICAgIGRlbGV0ZSBzZWxmLl9pZDtcclxuICAgICAgZGVsZXRlIHNlbGYuY29sbGVjdGlvbjtcclxuICAgICAgZGVsZXRlIHNlbGYuY29sbGVjdGlvbk5hbWU7XHJcbiAgICB9XHJcbiAgICBjYWxsYmFjayhlcnIsIHJlcyk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5GaWxlLnByb3RvdHlwZS5tb3ZlVG9cclxuICogQHBhcmFtIHtGUy5Db2xsZWN0aW9ufSB0YXJnZXRDb2xsZWN0aW9uXHJcbiAqIEBwcml2YXRlIC8vIE1hcmtlZCBwcml2YXRlIHVudGlsIGltcGxlbWVudGVkXHJcbiAqIEB0b2RvIE5lZWRzIHRvIGJlIGltcGxlbWVudGVkXHJcbiAqXHJcbiAqIE1vdmUgdGhlIGZpbGUgZnJvbSBjdXJyZW50IGNvbGxlY3Rpb24gdG8gYW5vdGhlciBjb2xsZWN0aW9uXHJcbiAqXHJcbiAqID4gTm90ZTogTm90IHlldCBpbXBsZW1lbnRlZFxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGUucHJvdG90eXBlLmdldEV4dGVuc2lvbiBSZXR1cm5zIHRoZSBsb3dlcmNhc2UgZmlsZSBleHRlbnNpb25cclxuICogQHB1YmxpY1xyXG4gKiBAZGVwcmVjYXRlZCBVc2UgdGhlIGBleHRlbnNpb25gIGdldHRlci9zZXR0ZXIgbWV0aG9kIGluc3RlYWQuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICogQHBhcmFtIHtTdHJpbmd9IFtvcHRpb25zLnN0b3JlXSAtIFN0b3JlIG5hbWUuIERlZmF1bHQgaXMgdGhlIG9yaWdpbmFsIGV4dGVuc2lvbi5cclxuICogQHJldHVybnMge3N0cmluZ30gVGhlIGV4dGVuc2lvbiBlZy46IGBqcGdgIG9yIGlmIG5vdCBmb3VuZCB0aGVuIGFuIGVtcHR5IHN0cmluZyAnJ1xyXG4gKi9cclxuRlMuRmlsZS5wcm90b3R5cGUuZ2V0RXh0ZW5zaW9uID0gZnVuY3Rpb24ob3B0aW9ucykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICByZXR1cm4gc2VsZi5leHRlbnNpb24ob3B0aW9ucyk7XHJcbn07XHJcblxyXG5mdW5jdGlvbiBjaGVja0NvbnRlbnRUeXBlKGZzRmlsZSwgc3RvcmVOYW1lLCBzdGFydE9mVHlwZSkge1xyXG4gIHZhciB0eXBlO1xyXG4gIGlmIChzdG9yZU5hbWUgJiYgZnNGaWxlLmhhc1N0b3JlZChzdG9yZU5hbWUpKSB7XHJcbiAgICB0eXBlID0gZnNGaWxlLnR5cGUoe3N0b3JlOiBzdG9yZU5hbWV9KTtcclxuICB9IGVsc2Uge1xyXG4gICAgdHlwZSA9IGZzRmlsZS50eXBlKCk7XHJcbiAgfVxyXG4gIGlmICh0eXBlb2YgdHlwZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgcmV0dXJuIHR5cGUuaW5kZXhPZihzdGFydE9mVHlwZSkgPT09IDA7XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuRmlsZS5wcm90b3R5cGUuaXNJbWFnZSBJcyBpdCBhbiBpbWFnZSBmaWxlP1xyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBbb3B0aW9uc11cclxuICogQHBhcmFtIHtzdHJpbmd9IFtvcHRpb25zLnN0b3JlXSBUaGUgc3RvcmUgd2UncmUgaW50ZXJlc3RlZCBpblxyXG4gKlxyXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGNvcHkgb2YgdGhpcyBmaWxlIGluIHRoZSBzcGVjaWZpZWQgc3RvcmUgaGFzIGFuIGltYWdlXHJcbiAqIGNvbnRlbnQgdHlwZS4gSWYgdGhlIGZpbGUgb2JqZWN0IGlzIHVubW91bnRlZCBvciBkb2Vzbid0IGhhdmUgYSBjb3B5IGZvclxyXG4gKiB0aGUgc3BlY2lmaWVkIHN0b3JlLCBvciBpZiB5b3UgZG9uJ3Qgc3BlY2lmeSBhIHN0b3JlLCB0aGlzIG1ldGhvZCBjaGVja3NcclxuICogdGhlIGNvbnRlbnQgdHlwZSBvZiB0aGUgb3JpZ2luYWwgZmlsZS5cclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLmlzSW1hZ2UgPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgcmV0dXJuIGNoZWNrQ29udGVudFR5cGUodGhpcywgKG9wdGlvbnMgfHwge30pLnN0b3JlLCAnaW1hZ2UvJyk7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5GaWxlLnByb3RvdHlwZS5pc1ZpZGVvIElzIGl0IGEgdmlkZW8gZmlsZT9cclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge29iamVjdH0gW29wdGlvbnNdXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBbb3B0aW9ucy5zdG9yZV0gVGhlIHN0b3JlIHdlJ3JlIGludGVyZXN0ZWQgaW5cclxuICpcclxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBjb3B5IG9mIHRoaXMgZmlsZSBpbiB0aGUgc3BlY2lmaWVkIHN0b3JlIGhhcyBhIHZpZGVvXHJcbiAqIGNvbnRlbnQgdHlwZS4gSWYgdGhlIGZpbGUgb2JqZWN0IGlzIHVubW91bnRlZCBvciBkb2Vzbid0IGhhdmUgYSBjb3B5IGZvclxyXG4gKiB0aGUgc3BlY2lmaWVkIHN0b3JlLCBvciBpZiB5b3UgZG9uJ3Qgc3BlY2lmeSBhIHN0b3JlLCB0aGlzIG1ldGhvZCBjaGVja3NcclxuICogdGhlIGNvbnRlbnQgdHlwZSBvZiB0aGUgb3JpZ2luYWwgZmlsZS5cclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLmlzVmlkZW8gPSBmdW5jdGlvbihvcHRpb25zKSB7XHJcbiAgcmV0dXJuIGNoZWNrQ29udGVudFR5cGUodGhpcywgKG9wdGlvbnMgfHwge30pLnN0b3JlLCAndmlkZW8vJyk7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5GaWxlLnByb3RvdHlwZS5pc0F1ZGlvIElzIGl0IGFuIGF1ZGlvIGZpbGU/XHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtvYmplY3R9IFtvcHRpb25zXVxyXG4gKiBAcGFyYW0ge3N0cmluZ30gW29wdGlvbnMuc3RvcmVdIFRoZSBzdG9yZSB3ZSdyZSBpbnRlcmVzdGVkIGluXHJcbiAqXHJcbiAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgY29weSBvZiB0aGlzIGZpbGUgaW4gdGhlIHNwZWNpZmllZCBzdG9yZSBoYXMgYW4gYXVkaW9cclxuICogY29udGVudCB0eXBlLiBJZiB0aGUgZmlsZSBvYmplY3QgaXMgdW5tb3VudGVkIG9yIGRvZXNuJ3QgaGF2ZSBhIGNvcHkgZm9yXHJcbiAqIHRoZSBzcGVjaWZpZWQgc3RvcmUsIG9yIGlmIHlvdSBkb24ndCBzcGVjaWZ5IGEgc3RvcmUsIHRoaXMgbWV0aG9kIGNoZWNrc1xyXG4gKiB0aGUgY29udGVudCB0eXBlIG9mIHRoZSBvcmlnaW5hbCBmaWxlLlxyXG4gKi9cclxuRlMuRmlsZS5wcm90b3R5cGUuaXNBdWRpbyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcclxuICByZXR1cm4gY2hlY2tDb250ZW50VHlwZSh0aGlzLCAob3B0aW9ucyB8fCB7fSkuc3RvcmUsICdhdWRpby8nKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGUucHJvdG90eXBlLmZvcm1hdHRlZFNpemVcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnNcclxuICogQHBhcmFtICB7U3RyaW5nfSBbb3B0aW9ucy5zdG9yZT1ub25lLGRpc3BsYXkgb3JpZ2luYWwgZmlsZSBzaXplXSBXaGljaCBmaWxlIGRvIHlvdSB3YW50IHRvIGdldCB0aGUgc2l6ZSBvZj9cclxuICogQHBhcmFtICB7U3RyaW5nfSBbb3B0aW9ucy5mb3JtYXRTdHJpbmc9JzAuMDAgYiddIFRoZSBgbnVtZXJhbGAgZm9ybWF0IHN0cmluZyB0byB1c2UuXHJcbiAqIEByZXR1cm4ge1N0cmluZ30gVGhlIGZpbGUgc2l6ZSBmb3JtYXR0ZWQgYXMgYSBodW1hbiByZWFkYWJsZSBzdHJpbmcgYW5kIHJlYWN0aXZlbHkgdXBkYXRlZC5cclxuICpcclxuICogKiBZb3UgbXVzdCBhZGQgdGhlIGBudW1lcmFsYCBwYWNrYWdlIHRvIHlvdXIgYXBwIGJlZm9yZSB5b3UgY2FuIHVzZSB0aGlzIG1ldGhvZC5cclxuICogKiBJZiBpbmZvIGlzIG5vdCBmb3VuZCBvciBhIHNpemUgY2FuJ3QgYmUgZGV0ZXJtaW5lZCwgaXQgd2lsbCBzaG93IDAuXHJcbiAqL1xyXG5GUy5GaWxlLnByb3RvdHlwZS5mb3JtYXR0ZWRTaXplID0gZnVuY3Rpb24gZnNGaWxlRm9ybWF0dGVkU2l6ZShvcHRpb25zKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICBpZiAodHlwZW9mIG51bWVyYWwgIT09IFwiZnVuY3Rpb25cIilcclxuICAgIHRocm93IG5ldyBFcnJvcihcIllvdSBtdXN0IGFkZCB0aGUgbnVtZXJhbCBwYWNrYWdlIGlmIHlvdSBjYWxsIEZTLkZpbGUuZm9ybWF0dGVkU2l6ZVwiKTtcclxuXHJcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgb3B0aW9ucyA9IG9wdGlvbnMuaGFzaCB8fCBvcHRpb25zO1xyXG5cclxuICB2YXIgc2l6ZSA9IHNlbGYuc2l6ZShvcHRpb25zKSB8fCAwO1xyXG4gIHJldHVybiBudW1lcmFsKHNpemUpLmZvcm1hdChvcHRpb25zLmZvcm1hdFN0cmluZyB8fCAnMC4wMCBiJyk7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5GaWxlLnByb3RvdHlwZS5pc1VwbG9hZGVkIElzIHRoaXMgZmlsZSBjb21wbGV0ZWx5IHVwbG9hZGVkP1xyXG4gKiBAcHVibGljXHJcbiAqIEByZXR1cm5zIHtib29sZWFufSBUcnVlIGlmIHRoZSBudW1iZXIgb2YgdXBsb2FkZWQgYnl0ZXMgaXMgZXF1YWwgdG8gdGhlIGZpbGUgc2l6ZS5cclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLmlzVXBsb2FkZWQgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIC8vIE1ha2Ugc3VyZSB3ZSB1c2UgdGhlIHVwZGF0ZWQgZmlsZSByZWNvcmRcclxuICBzZWxmLmdldEZpbGVSZWNvcmQoKTtcclxuXHJcbiAgcmV0dXJuICEhc2VsZi51cGxvYWRlZEF0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuRmlsZS5wcm90b3R5cGUuaGFzU3RvcmVkXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtzdHJpbmd9IHN0b3JlTmFtZSBOYW1lIG9mIHRoZSBzdG9yZVxyXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtvcHRpbWlzdGljPWZhbHNlXSBJbiBjYXNlIHRoYXQgdGhlIGZpbGUgcmVjb3JkIGlzIG5vdCBmb3VuZCwgcmVhZCBiZWxvd1xyXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gSXMgYSB2ZXJzaW9uIG9mIHRoaXMgZmlsZSBzdG9yZWQgaW4gdGhlIGdpdmVuIHN0b3JlP1xyXG4gKlxyXG4gKiA+IE5vdGU6IElmIHRoZSBmaWxlIGlzIG5vdCBwdWJsaXNoZWQgdG8gdGhlIGNsaWVudCBvciBzaW1wbHkgbm90IGZvdW5kOlxyXG4gKiB0aGlzIG1ldGhvZCBjYW5ub3Qga25vdyBmb3Igc3VyZSBpZiBpdCBleGlzdHMgb3Igbm90LiBUaGUgYG9wdGltaXN0aWNgXHJcbiAqIHBhcmFtIGlzIHRoZSBib29sZWFuIHZhbHVlIHRvIHJldHVybi4gQXJlIHdlIGBvcHRpbWlzdGljYCB0aGF0IHRoZSBjb3B5XHJcbiAqIGNvdWxkIGV4aXN0LiBUaGlzIGlzIHRoZSBjYXNlIGluIGBGUy5GaWxlLnVybGAgd2UgYXJlIG9wdGltaXN0aWMgdGhhdCB0aGVcclxuICogY29weSBzdXBwbGllZCBieSB0aGUgdXNlciBleGlzdHMuXHJcbiAqL1xyXG5GUy5GaWxlLnByb3RvdHlwZS5oYXNTdG9yZWQgPSBmdW5jdGlvbihzdG9yZU5hbWUsIG9wdGltaXN0aWMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgLy8gTWFrZSBzdXJlIHdlIHVzZSB0aGUgdXBkYXRlZCBmaWxlIHJlY29yZFxyXG4gIHNlbGYuZ2V0RmlsZVJlY29yZCgpO1xyXG4gIC8vIElmIHdlIGhhdmVudCB0aGUgcHVibGlzaGVkIGRhdGEgdGhlblxyXG4gIGlmIChGUy5VdGlsaXR5LmlzRW1wdHkoc2VsZi5jb3BpZXMpKSB7XHJcbiAgICByZXR1cm4gISFvcHRpbWlzdGljO1xyXG4gIH1cclxuICBpZiAodHlwZW9mIHN0b3JlTmFtZSA9PT0gXCJzdHJpbmdcIikge1xyXG4gICAgLy8gUmV0dXJuIHRydWUgb25seSBpZiB0aGUgYGtleWAgcHJvcGVydHkgaXMgcHJlc2VudCwgd2hpY2ggaXMgbm90IHNldCB1bnRpbFxyXG4gICAgLy8gc3RvcmFnZSBpcyBjb21wbGV0ZS5cclxuICAgIHJldHVybiAhIShzZWxmLmNvcGllcyAmJiBzZWxmLmNvcGllc1tzdG9yZU5hbWVdICYmIHNlbGYuY29waWVzW3N0b3JlTmFtZV0ua2V5KTtcclxuICB9XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG5cclxuLy8gQmFja3dhcmRzIGNvbXBhdGliaWxpdHlcclxuRlMuRmlsZS5wcm90b3R5cGUuaGFzQ29weSA9IEZTLkZpbGUucHJvdG90eXBlLmhhc1N0b3JlZDtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGUucHJvdG90eXBlLmdldENvcHlJbmZvXHJcbiAqIEBwdWJsaWNcclxuICogQGRlcHJlY2F0ZWQgVXNlIGluZGl2aWR1YWwgbWV0aG9kcyB3aXRoIGBzdG9yZWAgb3B0aW9uIGluc3RlYWQuXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdG9yZU5hbWUgTmFtZSBvZiB0aGUgc3RvcmUgZm9yIHdoaWNoIHRvIGdldCBjb3B5IGluZm8uXHJcbiAqIEByZXR1cm5zIHtPYmplY3R9IFRoZSBmaWxlIGRldGFpbHMsIGUuZy4sIG5hbWUsIHNpemUsIGtleSwgZXRjLiwgc3BlY2lmaWMgdG8gdGhlIGNvcHkgc2F2ZWQgaW4gdGhpcyBzdG9yZS5cclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLmdldENvcHlJbmZvID0gZnVuY3Rpb24oc3RvcmVOYW1lKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIC8vIE1ha2Ugc3VyZSB3ZSB1c2UgdGhlIHVwZGF0ZWQgZmlsZSByZWNvcmRcclxuICBzZWxmLmdldEZpbGVSZWNvcmQoKTtcclxuICByZXR1cm4gKHNlbGYuY29waWVzICYmIHNlbGYuY29waWVzW3N0b3JlTmFtZV0pIHx8IG51bGw7XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5GaWxlLnByb3RvdHlwZS5fZ2V0SW5mb1xyXG4gKiBAcHJpdmF0ZVxyXG4gKiBAcGFyYW0ge1N0cmluZ30gW3N0b3JlTmFtZV0gTmFtZSBvZiB0aGUgc3RvcmUgZm9yIHdoaWNoIHRvIGdldCBmaWxlIGluZm8uIE9taXQgZm9yIG9yaWdpbmFsIGZpbGUgZGV0YWlscy5cclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLnVwZGF0ZUZpbGVSZWNvcmRGaXJzdD1mYWxzZV0gVXBkYXRlIHRoaXMgaW5zdGFuY2Ugd2l0aCBkYXRhIGZyb20gdGhlIERCIGZpcnN0P1xyXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBUaGUgZmlsZSBkZXRhaWxzLCBlLmcuLCBuYW1lLCBzaXplLCBrZXksIGV0Yy4gSWYgbm90IGZvdW5kLCByZXR1cm5zIGFuIGVtcHR5IG9iamVjdC5cclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLl9nZXRJbmZvID0gZnVuY3Rpb24oc3RvcmVOYW1lLCBvcHRpb25zKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG5cclxuICBpZiAob3B0aW9ucy51cGRhdGVGaWxlUmVjb3JkRmlyc3QpIHtcclxuICAgIC8vIE1ha2Ugc3VyZSB3ZSB1c2UgdGhlIHVwZGF0ZWQgZmlsZSByZWNvcmRcclxuICAgIHNlbGYuZ2V0RmlsZVJlY29yZCgpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHN0b3JlTmFtZSkge1xyXG4gICAgcmV0dXJuIChzZWxmLmNvcGllcyAmJiBzZWxmLmNvcGllc1tzdG9yZU5hbWVdKSB8fCB7fTtcclxuICB9IGVsc2Uge1xyXG4gICAgcmV0dXJuIHNlbGYub3JpZ2luYWwgfHwge307XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuRmlsZS5wcm90b3R5cGUuX3NldEluZm9cclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtTdHJpbmd9IHN0b3JlTmFtZSAtIE5hbWUgb2YgdGhlIHN0b3JlIGZvciB3aGljaCB0byBzZXQgZmlsZSBpbmZvLiBOb24tc3RyaW5nIHdpbGwgc2V0IG9yaWdpbmFsIGZpbGUgZGV0YWlscy5cclxuICogQHBhcmFtIHtTdHJpbmd9IHByb3BlcnR5IC0gUHJvcGVydHkgdG8gc2V0XHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWx1ZSAtIE5ldyB2YWx1ZSBmb3IgcHJvcGVydHlcclxuICogQHBhcmFtIHtCb29sZWFufSBzYXZlIC0gU2hvdWxkIHRoZSBuZXcgdmFsdWUgYmUgc2F2ZWQgdG8gdGhlIERCLCB0b28sIG9yIGp1c3Qgc2V0IGluIHRoZSBGUy5GaWxlIHByb3BlcnRpZXM/XHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqL1xyXG5GUy5GaWxlLnByb3RvdHlwZS5fc2V0SW5mbyA9IGZ1bmN0aW9uKHN0b3JlTmFtZSwgcHJvcGVydHksIHZhbHVlLCBzYXZlKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIGlmICh0eXBlb2Ygc3RvcmVOYW1lID09PSBcInN0cmluZ1wiKSB7XHJcbiAgICBzZWxmLmNvcGllcyA9IHNlbGYuY29waWVzIHx8IHt9O1xyXG4gICAgc2VsZi5jb3BpZXNbc3RvcmVOYW1lXSA9IHNlbGYuY29waWVzW3N0b3JlTmFtZV0gfHwge307XHJcbiAgICBzZWxmLmNvcGllc1tzdG9yZU5hbWVdW3Byb3BlcnR5XSA9IHZhbHVlO1xyXG4gICAgc2F2ZSAmJiBzZWxmLl9zYXZlQ2hhbmdlcyhzdG9yZU5hbWUpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICBzZWxmLm9yaWdpbmFsID0gc2VsZi5vcmlnaW5hbCB8fCB7fTtcclxuICAgIHNlbGYub3JpZ2luYWxbcHJvcGVydHldID0gdmFsdWU7XHJcbiAgICBzYXZlICYmIHNlbGYuX3NhdmVDaGFuZ2VzKFwiX29yaWdpbmFsXCIpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGUucHJvdG90eXBlLm5hbWVcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge1N0cmluZ3xudWxsfSBbdmFsdWVdIC0gSWYgc2V0dGluZyB0aGUgbmFtZSwgc3BlY2lmeSB0aGUgbmV3IG5hbWUgYXMgdGhlIGZpcnN0IGFyZ3VtZW50LiBPdGhlcndpc2UgdGhlIG9wdGlvbnMgYXJndW1lbnQgc2hvdWxkIGJlIGZpcnN0LlxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5zdG9yZT1ub25lLG9yaWdpbmFsXSAtIEdldCBvciBzZXQgdGhlIG5hbWUgb2YgdGhlIHZlcnNpb24gb2YgdGhlIGZpbGUgdGhhdCB3YXMgc2F2ZWQgaW4gdGhpcyBzdG9yZS4gRGVmYXVsdCBpcyB0aGUgb3JpZ2luYWwgZmlsZSBuYW1lLlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLnVwZGF0ZUZpbGVSZWNvcmRGaXJzdD1mYWxzZV0gVXBkYXRlIHRoaXMgaW5zdGFuY2Ugd2l0aCBkYXRhIGZyb20gdGhlIERCIGZpcnN0PyBBcHBsaWVzIHRvIGdldHRlciB1c2FnZSBvbmx5LlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLnNhdmU9dHJ1ZV0gU2F2ZSBjaGFuZ2UgdG8gZGF0YWJhc2U/IEFwcGxpZXMgdG8gc2V0dGVyIHVzYWdlIG9ubHkuXHJcbiAqIEByZXR1cm5zIHtTdHJpbmd8dW5kZWZpbmVkfSBJZiBzZXR0aW5nLCByZXR1cm5zIGB1bmRlZmluZWRgLiBJZiBnZXR0aW5nLCByZXR1cm5zIHRoZSBmaWxlIG5hbWUuXHJcbiAqL1xyXG5GUy5GaWxlLnByb3RvdHlwZS5uYW1lID0gZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIGlmICghb3B0aW9ucyAmJiAoKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkgfHwgdHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSkge1xyXG4gICAgLy8gR0VUXHJcbiAgICBvcHRpb25zID0gdmFsdWUgfHwge307XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucy5oYXNoIHx8IG9wdGlvbnM7IC8vIGFsbG93IHVzZSBhcyBVSSBoZWxwZXJcclxuICAgIHJldHVybiBzZWxmLl9nZXRJbmZvKG9wdGlvbnMuc3RvcmUsIG9wdGlvbnMpLm5hbWU7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFNFVFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICByZXR1cm4gc2VsZi5fc2V0SW5mbyhvcHRpb25zLnN0b3JlLCAnbmFtZScsIHZhbHVlLCB0eXBlb2Ygb3B0aW9ucy5zYXZlID09PSBcImJvb2xlYW5cIiA/IG9wdGlvbnMuc2F2ZSA6IHRydWUpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGUucHJvdG90eXBlLmV4dGVuc2lvblxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7U3RyaW5nfG51bGx9IFt2YWx1ZV0gLSBJZiBzZXR0aW5nIHRoZSBleHRlbnNpb24sIHNwZWNpZnkgdGhlIG5ldyBleHRlbnNpb24gKHdpdGhvdXQgcGVyaW9kKSBhcyB0aGUgZmlyc3QgYXJndW1lbnQuIE90aGVyd2lzZSB0aGUgb3B0aW9ucyBhcmd1bWVudCBzaG91bGQgYmUgZmlyc3QuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnN0b3JlPW5vbmUsb3JpZ2luYWxdIC0gR2V0IG9yIHNldCB0aGUgZXh0ZW5zaW9uIG9mIHRoZSB2ZXJzaW9uIG9mIHRoZSBmaWxlIHRoYXQgd2FzIHNhdmVkIGluIHRoaXMgc3RvcmUuIERlZmF1bHQgaXMgdGhlIG9yaWdpbmFsIGZpbGUgZXh0ZW5zaW9uLlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLnVwZGF0ZUZpbGVSZWNvcmRGaXJzdD1mYWxzZV0gVXBkYXRlIHRoaXMgaW5zdGFuY2Ugd2l0aCBkYXRhIGZyb20gdGhlIERCIGZpcnN0PyBBcHBsaWVzIHRvIGdldHRlciB1c2FnZSBvbmx5LlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLnNhdmU9dHJ1ZV0gU2F2ZSBjaGFuZ2UgdG8gZGF0YWJhc2U/IEFwcGxpZXMgdG8gc2V0dGVyIHVzYWdlIG9ubHkuXHJcbiAqIEByZXR1cm5zIHtTdHJpbmd8dW5kZWZpbmVkfSBJZiBzZXR0aW5nLCByZXR1cm5zIGB1bmRlZmluZWRgLiBJZiBnZXR0aW5nLCByZXR1cm5zIHRoZSBmaWxlIGV4dGVuc2lvbiBvciBhbiBlbXB0eSBzdHJpbmcgaWYgdGhlcmUgaXNuJ3Qgb25lLlxyXG4gKi9cclxuRlMuRmlsZS5wcm90b3R5cGUuZXh0ZW5zaW9uID0gZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIGlmICghb3B0aW9ucyAmJiAoKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkgfHwgdHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSkge1xyXG4gICAgLy8gR0VUXHJcbiAgICBvcHRpb25zID0gdmFsdWUgfHwge307XHJcbiAgICByZXR1cm4gRlMuVXRpbGl0eS5nZXRGaWxlRXh0ZW5zaW9uKHNlbGYubmFtZShvcHRpb25zKSB8fCAnJyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFNFVFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICB2YXIgbmV3TmFtZSA9IEZTLlV0aWxpdHkuc2V0RmlsZUV4dGVuc2lvbihzZWxmLm5hbWUob3B0aW9ucykgfHwgJycsIHZhbHVlKTtcclxuICAgIHJldHVybiBzZWxmLl9zZXRJbmZvKG9wdGlvbnMuc3RvcmUsICduYW1lJywgbmV3TmFtZSwgdHlwZW9mIG9wdGlvbnMuc2F2ZSA9PT0gXCJib29sZWFuXCIgPyBvcHRpb25zLnNhdmUgOiB0cnVlKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5GaWxlLnByb3RvdHlwZS5zaXplXHJcbiAqIEBwdWJsaWNcclxuICogQHBhcmFtIHtOdW1iZXJ9IFt2YWx1ZV0gLSBJZiBzZXR0aW5nIHRoZSBzaXplLCBzcGVjaWZ5IHRoZSBuZXcgc2l6ZSBpbiBieXRlcyBhcyB0aGUgZmlyc3QgYXJndW1lbnQuIE90aGVyd2lzZSB0aGUgb3B0aW9ucyBhcmd1bWVudCBzaG91bGQgYmUgZmlyc3QuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc11cclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zLnN0b3JlPW5vbmUsb3JpZ2luYWxdIC0gR2V0IG9yIHNldCB0aGUgc2l6ZSBvZiB0aGUgdmVyc2lvbiBvZiB0aGUgZmlsZSB0aGF0IHdhcyBzYXZlZCBpbiB0aGlzIHN0b3JlLiBEZWZhdWx0IGlzIHRoZSBvcmlnaW5hbCBmaWxlIHNpemUuXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMudXBkYXRlRmlsZVJlY29yZEZpcnN0PWZhbHNlXSBVcGRhdGUgdGhpcyBpbnN0YW5jZSB3aXRoIGRhdGEgZnJvbSB0aGUgREIgZmlyc3Q/IEFwcGxpZXMgdG8gZ2V0dGVyIHVzYWdlIG9ubHkuXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuc2F2ZT10cnVlXSBTYXZlIGNoYW5nZSB0byBkYXRhYmFzZT8gQXBwbGllcyB0byBzZXR0ZXIgdXNhZ2Ugb25seS5cclxuICogQHJldHVybnMge051bWJlcnx1bmRlZmluZWR9IElmIHNldHRpbmcsIHJldHVybnMgYHVuZGVmaW5lZGAuIElmIGdldHRpbmcsIHJldHVybnMgdGhlIGZpbGUgc2l6ZS5cclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLnNpemUgPSBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgaWYgKCFvcHRpb25zICYmICgodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiICYmIHZhbHVlICE9PSBudWxsKSB8fCB0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIpKSB7XHJcbiAgICAvLyBHRVRcclxuICAgIG9wdGlvbnMgPSB2YWx1ZSB8fCB7fTtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zLmhhc2ggfHwgb3B0aW9uczsgLy8gYWxsb3cgdXNlIGFzIFVJIGhlbHBlclxyXG4gICAgcmV0dXJuIHNlbGYuX2dldEluZm8ob3B0aW9ucy5zdG9yZSwgb3B0aW9ucykuc2l6ZTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gU0VUXHJcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuICAgIHJldHVybiBzZWxmLl9zZXRJbmZvKG9wdGlvbnMuc3RvcmUsICdzaXplJywgdmFsdWUsIHR5cGVvZiBvcHRpb25zLnNhdmUgPT09IFwiYm9vbGVhblwiID8gb3B0aW9ucy5zYXZlIDogdHJ1ZSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuRmlsZS5wcm90b3R5cGUudHlwZVxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbdmFsdWVdIC0gSWYgc2V0dGluZyB0aGUgdHlwZSwgc3BlY2lmeSB0aGUgbmV3IHR5cGUgYXMgdGhlIGZpcnN0IGFyZ3VtZW50LiBPdGhlcndpc2UgdGhlIG9wdGlvbnMgYXJndW1lbnQgc2hvdWxkIGJlIGZpcnN0LlxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9ucy5zdG9yZT1ub25lLG9yaWdpbmFsXSAtIEdldCBvciBzZXQgdGhlIHR5cGUgb2YgdGhlIHZlcnNpb24gb2YgdGhlIGZpbGUgdGhhdCB3YXMgc2F2ZWQgaW4gdGhpcyBzdG9yZS4gRGVmYXVsdCBpcyB0aGUgb3JpZ2luYWwgZmlsZSB0eXBlLlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLnVwZGF0ZUZpbGVSZWNvcmRGaXJzdD1mYWxzZV0gVXBkYXRlIHRoaXMgaW5zdGFuY2Ugd2l0aCBkYXRhIGZyb20gdGhlIERCIGZpcnN0PyBBcHBsaWVzIHRvIGdldHRlciB1c2FnZSBvbmx5LlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLnNhdmU9dHJ1ZV0gU2F2ZSBjaGFuZ2UgdG8gZGF0YWJhc2U/IEFwcGxpZXMgdG8gc2V0dGVyIHVzYWdlIG9ubHkuXHJcbiAqIEByZXR1cm5zIHtTdHJpbmd8dW5kZWZpbmVkfSBJZiBzZXR0aW5nLCByZXR1cm5zIGB1bmRlZmluZWRgLiBJZiBnZXR0aW5nLCByZXR1cm5zIHRoZSBmaWxlIHR5cGUuXHJcbiAqL1xyXG5GUy5GaWxlLnByb3RvdHlwZS50eXBlID0gZnVuY3Rpb24odmFsdWUsIG9wdGlvbnMpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIGlmICghb3B0aW9ucyAmJiAoKHR5cGVvZiB2YWx1ZSA9PT0gXCJvYmplY3RcIiAmJiB2YWx1ZSAhPT0gbnVsbCkgfHwgdHlwZW9mIHZhbHVlID09PSBcInVuZGVmaW5lZFwiKSkge1xyXG4gICAgLy8gR0VUXHJcbiAgICBvcHRpb25zID0gdmFsdWUgfHwge307XHJcbiAgICBvcHRpb25zID0gb3B0aW9ucy5oYXNoIHx8IG9wdGlvbnM7IC8vIGFsbG93IHVzZSBhcyBVSSBoZWxwZXJcclxuICAgIHJldHVybiBzZWxmLl9nZXRJbmZvKG9wdGlvbnMuc3RvcmUsIG9wdGlvbnMpLnR5cGU7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFNFVFxyXG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XHJcbiAgICByZXR1cm4gc2VsZi5fc2V0SW5mbyhvcHRpb25zLnN0b3JlLCAndHlwZScsIHZhbHVlLCB0eXBlb2Ygb3B0aW9ucy5zYXZlID09PSBcImJvb2xlYW5cIiA/IG9wdGlvbnMuc2F2ZSA6IHRydWUpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGUucHJvdG90eXBlLnVwZGF0ZWRBdFxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBbdmFsdWVdIC0gSWYgc2V0dGluZyB1cGRhdGVkQXQsIHNwZWNpZnkgdGhlIG5ldyBkYXRlIGFzIHRoZSBmaXJzdCBhcmd1bWVudC4gT3RoZXJ3aXNlIHRoZSBvcHRpb25zIGFyZ3VtZW50IHNob3VsZCBiZSBmaXJzdC5cclxuICogQHBhcmFtIHtPYmplY3R9IFtvcHRpb25zXVxyXG4gKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnMuc3RvcmU9bm9uZSxvcmlnaW5hbF0gLSBHZXQgb3Igc2V0IHRoZSBsYXN0IHVwZGF0ZWQgZGF0ZSBmb3IgdGhlIHZlcnNpb24gb2YgdGhlIGZpbGUgdGhhdCB3YXMgc2F2ZWQgaW4gdGhpcyBzdG9yZS4gRGVmYXVsdCBpcyB0aGUgb3JpZ2luYWwgbGFzdCB1cGRhdGVkIGRhdGUuXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMudXBkYXRlRmlsZVJlY29yZEZpcnN0PWZhbHNlXSBVcGRhdGUgdGhpcyBpbnN0YW5jZSB3aXRoIGRhdGEgZnJvbSB0aGUgREIgZmlyc3Q/IEFwcGxpZXMgdG8gZ2V0dGVyIHVzYWdlIG9ubHkuXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gW29wdGlvbnMuc2F2ZT10cnVlXSBTYXZlIGNoYW5nZSB0byBkYXRhYmFzZT8gQXBwbGllcyB0byBzZXR0ZXIgdXNhZ2Ugb25seS5cclxuICogQHJldHVybnMge1N0cmluZ3x1bmRlZmluZWR9IElmIHNldHRpbmcsIHJldHVybnMgYHVuZGVmaW5lZGAuIElmIGdldHRpbmcsIHJldHVybnMgdGhlIGZpbGUncyBsYXN0IHVwZGF0ZWQgZGF0ZS5cclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLnVwZGF0ZWRBdCA9IGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICBpZiAoIW9wdGlvbnMgJiYgKCh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIgJiYgdmFsdWUgIT09IG51bGwgJiYgISh2YWx1ZSBpbnN0YW5jZW9mIERhdGUpKSB8fCB0eXBlb2YgdmFsdWUgPT09IFwidW5kZWZpbmVkXCIpKSB7XHJcbiAgICAvLyBHRVRcclxuICAgIG9wdGlvbnMgPSB2YWx1ZSB8fCB7fTtcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zLmhhc2ggfHwgb3B0aW9uczsgLy8gYWxsb3cgdXNlIGFzIFVJIGhlbHBlclxyXG4gICAgcmV0dXJuIHNlbGYuX2dldEluZm8ob3B0aW9ucy5zdG9yZSwgb3B0aW9ucykudXBkYXRlZEF0O1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBTRVRcclxuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gICAgcmV0dXJuIHNlbGYuX3NldEluZm8ob3B0aW9ucy5zdG9yZSwgJ3VwZGF0ZWRBdCcsIHZhbHVlLCB0eXBlb2Ygb3B0aW9ucy5zYXZlID09PSBcImJvb2xlYW5cIiA/IG9wdGlvbnMuc2F2ZSA6IHRydWUpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGUub25TdG9yZWRDYWxsYmFja1xyXG4gKiBAc3VtbWFyeSBDYWxscyBjYWxsYmFjayB3aGVuIHRoZSBmaWxlIGlzIGZ1bGx5IHN0b3JlZCB0byB0aGUgc3BlY2lmeSBzdG9yZU5hbWVcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge1N0cmluZ30gW3N0b3JlTmFtZV0gLSBUaGUgbmFtZSBvZiB0aGUgZmlsZSBzdG9yZSB3ZSB3YW50IHRvIGdldCBjYWxsZWQgd2hlbiBzdG9yZWQuXHJcbiAqIEBwYXJhbSB7ZnVuY3Rpb259IFtjYWxsYmFja11cclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLm9uU3RvcmVkQ2FsbGJhY2sgPSBmdW5jdGlvbiAoc3RvcmVOYW1lLCBjYWxsYmFjaykge1xyXG4gIC8vIENoZWNrIGZpbGUgaXMgbm90IGFscmVhZHkgc3RvcmVkXHJcbiAgaWYgKHRoaXMuaGFzU3RvcmVkKHN0b3JlTmFtZSkpIHtcclxuICAgIGNhbGxiYWNrKCk7XHJcbiAgICByZXR1cm47XHJcbiAgfVxyXG4gIGlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcclxuICAgIC8vIExpc3RlbiB0byBmaWxlIHN0b3JlZCBldmVudHNcclxuICAgIC8vIFRPRE8gUmVxdWlyZSB0aGlua2luZyB3aGV0aGVyIGl0IGlzIGJldHRlciB0byB1c2Ugb2JzZXJ2ZXIgZm9yIGNhc2Ugb2YgdXNpbmcgbXVsdGlwbGUgYXBwbGljYXRpb24gaW5zdGFuY2VzLCBBc2sgZm9yIHNhbWUgaW1hZ2UgdXJsIHdoaWxlIHVwbG9hZCBpcyBiZWluZyBkb25lLlxyXG4gICAgdGhpcy5vbignc3RvcmVkJywgZnVuY3Rpb24gKG5ld1N0b3JlTmFtZSkge1xyXG4gICAgICAvLyBJZiBzdG9yZWQgaXMgY29tcGxldGVkIHRvIHRoZSBzcGVjaWZpZWQgc3RvcmUgY2FsbCBjYWxsYmFja1xyXG4gICAgICBpZiAoc3RvcmVOYW1lID09PSBuZXdTdG9yZU5hbWUpIHtcclxuICAgICAgICAvLyBSZW1vdmUgdGhlIHNwZWNpZmllZCBmaWxlIHN0b3JlZCBsaXN0ZW5lclxyXG4gICAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIoJ3N0b3JlZCcsIGFyZ3VtZW50cy5jYWxsZWUpO1xyXG4gICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgIH1cclxuICAgIH0uYmluZCh0aGlzKVxyXG4gICAgKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdmFyIGZpbGVJZCA9IHRoaXMuX2lkLFxyXG4gICAgICAgIGNvbGxlY3Rpb25OYW1lID0gdGhpcy5jb2xsZWN0aW9uTmFtZTtcclxuICAgIC8vIFdhaXQgZm9yIGZpbGUgdG8gYmUgZnVsbHkgdXBsb2FkZWRcclxuICAgIFRyYWNrZXIuYXV0b3J1bihmdW5jdGlvbiAoYykge1xyXG4gICAgICBNZXRlb3IuY2FsbCgnX2Nmc19yZXR1cm5XaGVuU3RvcmVkJywgY29sbGVjdGlvbk5hbWUsIGZpbGVJZCwgc3RvcmVOYW1lLCBmdW5jdGlvbiAoZXJyb3IsIHJlc3VsdCkge1xyXG4gICAgICAgIGlmIChyZXN1bHQgJiYgcmVzdWx0ID09PSB0cnVlKSB7XHJcbiAgICAgICAgICBjLnN0b3AoKTtcclxuICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIE1ldGVvci5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgYy5pbnZhbGlkYXRlKCk7XHJcbiAgICAgICAgICB9LCAxMDApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5GaWxlLm9uU3RvcmVkXHJcbiAqIEBzdW1tYXJ5IEZ1bmN0aW9uIHRoYXQgcmV0dXJucyB3aGVuIHRoZSBmaWxlIGlzIGZ1bGx5IHN0b3JlZCB0byB0aGUgc3BlY2lmeSBzdG9yZU5hbWVcclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RvcmVOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIGZpbGUgc3RvcmUgd2Ugd2FudCB0byBnZXQgY2FsbGVkIHdoZW4gc3RvcmVkLlxyXG4gKlxyXG4gKiBGdW5jdGlvbiB0aGF0IHJldHVybnMgd2hlbiB0aGUgZmlsZSBpcyBmdWxseSBzdG9yZWQgdG8gdGhlIHNwZWNpZnkgc3RvcmVOYW1lLlxyXG4gKlxyXG4gKiBGb3IgZXhhbXBsZSBuZWVkZWQgaWYgd2FudGVkIHRvIHNhdmUgdGhlIGRpcmVjdCBsaW5rIHRvIGEgZmlsZSBvbiBzMyB3aGVuIGZ1bGx5IHVwbG9hZGVkLlxyXG4gKi9cclxuRlMuRmlsZS5wcm90b3R5cGUub25TdG9yZWQgPSBmdW5jdGlvbiAoYXJndW1lbnRzKSB7XHJcbiAgdmFyIG9uU3RvcmVkU3luYyA9IE1ldGVvci53cmFwQXN5bmModGhpcy5vblN0b3JlZENhbGxiYWNrKTtcclxuICByZXR1cm4gb25TdG9yZWRTeW5jLmNhbGwodGhpcywgYXJndW1lbnRzKTtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGlzQmFzaWNPYmplY3Qob2JqKSB7XHJcbiAgcmV0dXJuIChvYmogPT09IE9iamVjdChvYmopICYmIE9iamVjdC5nZXRQcm90b3R5cGVPZihvYmopID09PSBPYmplY3QucHJvdG90eXBlKTtcclxufVxyXG5cclxuLy8gZ2V0UHJvdG90eXBlT2YgcG9seWZpbGxcclxuaWYgKHR5cGVvZiBPYmplY3QuZ2V0UHJvdG90eXBlT2YgIT09IFwiZnVuY3Rpb25cIikge1xyXG4gIGlmICh0eXBlb2YgXCJcIi5fX3Byb3RvX18gPT09IFwib2JqZWN0XCIpIHtcclxuICAgIE9iamVjdC5nZXRQcm90b3R5cGVPZiA9IGZ1bmN0aW9uKG9iamVjdCkge1xyXG4gICAgICByZXR1cm4gb2JqZWN0Ll9fcHJvdG9fXztcclxuICAgIH07XHJcbiAgfSBlbHNlIHtcclxuICAgIE9iamVjdC5nZXRQcm90b3R5cGVPZiA9IGZ1bmN0aW9uKG9iamVjdCkge1xyXG4gICAgICAvLyBNYXkgYnJlYWsgaWYgdGhlIGNvbnN0cnVjdG9yIGhhcyBiZWVuIHRhbXBlcmVkIHdpdGhcclxuICAgICAgcmV0dXJuIG9iamVjdC5jb25zdHJ1Y3Rvci5wcm90b3R5cGU7XHJcbiAgICB9O1xyXG4gIH1cclxufVxyXG5cclxuXHJcbiIsIi8qKlxyXG4gKiBOb3RlcyBhIGRldGFpbHMgYWJvdXQgYSBzdG9yYWdlIGFkYXB0ZXIgZmFpbHVyZSB3aXRoaW4gdGhlIGZpbGUgcmVjb3JkXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdG9yZU5hbWVcclxuICogQHBhcmFtIHtudW1iZXJ9IG1heFRyaWVzXHJcbiAqIEByZXR1cm4ge3VuZGVmaW5lZH1cclxuICogQHRvZG8gZGVwcmVjYXRlIHRoaXNcclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLmxvZ0NvcHlGYWlsdXJlID0gZnVuY3Rpb24oc3RvcmVOYW1lLCBtYXhUcmllcykge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgLy8gaGFzU3RvcmVkIHdpbGwgdXBkYXRlIGZyb20gdGhlIGZpbGVSZWNvcmRcclxuICBpZiAoc2VsZi5oYXNTdG9yZWQoc3RvcmVOYW1lKSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKFwibG9nQ29weUZhaWx1cmU6IGludmFsaWQgc3RvcmVOYW1lXCIpO1xyXG4gIH1cclxuXHJcbiAgLy8gTWFrZSBzdXJlIHdlIGhhdmUgYSB0ZW1wb3JhcnkgZmlsZSBzYXZlZCBzaW5jZSB3ZSB3aWxsIGJlXHJcbiAgLy8gdHJ5aW5nIHRoZSBzYXZlIGFnYWluLlxyXG4gIEZTLlRlbXBTdG9yZS5lbnN1cmVGb3JGaWxlKHNlbGYpO1xyXG5cclxuICB2YXIgbm93ID0gbmV3IERhdGUoKTtcclxuICB2YXIgY3VycmVudENvdW50ID0gKHNlbGYuZmFpbHVyZXMgJiYgc2VsZi5mYWlsdXJlcy5jb3BpZXMgJiYgc2VsZi5mYWlsdXJlcy5jb3BpZXNbc3RvcmVOYW1lXSAmJiB0eXBlb2Ygc2VsZi5mYWlsdXJlcy5jb3BpZXNbc3RvcmVOYW1lXS5jb3VudCA9PT0gXCJudW1iZXJcIikgPyBzZWxmLmZhaWx1cmVzLmNvcGllc1tzdG9yZU5hbWVdLmNvdW50IDogMDtcclxuICBtYXhUcmllcyA9IG1heFRyaWVzIHx8IDU7XHJcblxyXG4gIHZhciBtb2RpZmllciA9IHt9O1xyXG4gIG1vZGlmaWVyLiRzZXQgPSB7fTtcclxuICBtb2RpZmllci4kc2V0WydmYWlsdXJlcy5jb3BpZXMuJyArIHN0b3JlTmFtZSArICcubGFzdEF0dGVtcHQnXSA9IG5vdztcclxuICBpZiAoY3VycmVudENvdW50ID09PSAwKSB7XHJcbiAgICBtb2RpZmllci4kc2V0WydmYWlsdXJlcy5jb3BpZXMuJyArIHN0b3JlTmFtZSArICcuZmlyc3RBdHRlbXB0J10gPSBub3c7XHJcbiAgfVxyXG4gIG1vZGlmaWVyLiRzZXRbJ2ZhaWx1cmVzLmNvcGllcy4nICsgc3RvcmVOYW1lICsgJy5jb3VudCddID0gY3VycmVudENvdW50ICsgMTtcclxuICBtb2RpZmllci4kc2V0WydmYWlsdXJlcy5jb3BpZXMuJyArIHN0b3JlTmFtZSArICcuZG9uZVRyeWluZyddID0gKGN1cnJlbnRDb3VudCArIDEgPj0gbWF4VHJpZXMpO1xyXG4gIHNlbGYudXBkYXRlKG1vZGlmaWVyKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIYXMgdGhpcyBzdG9yZSBwZXJtYW5lbnRseSBmYWlsZWQ/XHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBzdG9yZU5hbWUgVGhlIG5hbWUgb2YgdGhlIHN0b3JlXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IEhhcyB0aGlzIHN0b3JlIGZhaWxlZCBwZXJtYW5lbnRseT9cclxuICogQHRvZG8gZGVwcmVjYXRlIHRoaXNcclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLmZhaWxlZFBlcm1hbmVudGx5ID0gZnVuY3Rpb24oc3RvcmVOYW1lKSB7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHJldHVybiAhIShzZWxmLmZhaWx1cmVzICYmXHJcbiAgICAgICAgICAgIHNlbGYuZmFpbHVyZXMuY29waWVzICYmXHJcbiAgICAgICAgICAgIHNlbGYuZmFpbHVyZXMuY29waWVzW3N0b3JlTmFtZV0gJiZcclxuICAgICAgICAgICAgc2VsZi5mYWlsdXJlcy5jb3BpZXNbc3RvcmVOYW1lXS5kb25lVHJ5aW5nKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGUucHJvdG90eXBlLmNyZWF0ZVJlYWRTdHJlYW1cclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge1N0cmluZ30gW3N0b3JlTmFtZV1cclxuICogQHJldHVybnMge3N0cmVhbS5SZWFkYWJsZX0gUmVhZGFibGUgTm9kZUpTIHN0cmVhbVxyXG4gKlxyXG4gKiBSZXR1cm5zIGEgcmVhZGFibGUgc3RyZWFtLiBXaGVyZSB0aGUgc3RyZWFtIHJlYWRzIGZyb20gZGVwZW5kcyBvbiB0aGUgRlMuRmlsZSBpbnN0YW5jZSBhbmQgd2hldGhlciB5b3UgcGFzcyBhIHN0b3JlIG5hbWUuXHJcbiAqXHJcbiAqICogSWYgeW91IHBhc3MgYSBgc3RvcmVOYW1lYCwgYSByZWFkYWJsZSBzdHJlYW0gZm9yIHRoZSBmaWxlIGRhdGEgc2F2ZWQgaW4gdGhhdCBzdG9yZSBpcyByZXR1cm5lZC5cclxuICogKiBJZiB5b3UgZG9uJ3QgcGFzcyBhIGBzdG9yZU5hbWVgIGFuZCBkYXRhIGlzIGF0dGFjaGVkIHRvIHRoZSBGUy5GaWxlIGluc3RhbmNlIChvbiBgZGF0YWAgcHJvcGVydHksIHdoaWNoIG11c3QgYmUgYSBEYXRhTWFuIGluc3RhbmNlKSwgdGhlbiBhIHJlYWRhYmxlIHN0cmVhbSBmb3IgdGhlIGF0dGFjaGVkIGRhdGEgaXMgcmV0dXJuZWQuXHJcbiAqICogSWYgeW91IGRvbid0IHBhc3MgYSBgc3RvcmVOYW1lYCBhbmQgdGhlcmUgaXMgbm8gZGF0YSBhdHRhY2hlZCB0byB0aGUgRlMuRmlsZSBpbnN0YW5jZSwgYSByZWFkYWJsZSBzdHJlYW0gZm9yIHRoZSBmaWxlIGRhdGEgY3VycmVudGx5IGluIHRoZSB0ZW1wb3Jhcnkgc3RvcmUgKGBGUy5UZW1wU3RvcmVgKSBpcyByZXR1cm5lZC5cclxuICpcclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLmNyZWF0ZVJlYWRTdHJlYW0gPSBmdW5jdGlvbihzdG9yZU5hbWUpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIC8vIElmIHdlIGRvbnQgaGF2ZSBhIHN0b3JlIG5hbWUgYnV0IGdvdCBCdWZmZXIgZGF0YT9cclxuICBpZiAoIXN0b3JlTmFtZSAmJiBzZWxmLmRhdGEpIHtcclxuICAgIEZTLmRlYnVnICYmIGNvbnNvbGUubG9nKFwiZmlsZU9iai5jcmVhdGVSZWFkU3RyZWFtIGNyZWF0aW5nIHJlYWQgc3RyZWFtIGZvciBhdHRhY2hlZCBkYXRhXCIpO1xyXG4gICAgLy8gU3RyZWFtIGZyb20gYXR0YWNoZWQgZGF0YSBpZiBwcmVzZW50XHJcbiAgICByZXR1cm4gc2VsZi5kYXRhLmNyZWF0ZVJlYWRTdHJlYW0oKTtcclxuICB9IGVsc2UgaWYgKCFzdG9yZU5hbWUgJiYgRlMuVGVtcFN0b3JlICYmIEZTLlRlbXBTdG9yZS5leGlzdHMoc2VsZikpIHtcclxuICAgIEZTLmRlYnVnICYmIGNvbnNvbGUubG9nKFwiZmlsZU9iai5jcmVhdGVSZWFkU3RyZWFtIGNyZWF0aW5nIHJlYWQgc3RyZWFtIGZvciB0ZW1wIHN0b3JlXCIpO1xyXG4gICAgLy8gU3RyZWFtIGZyb20gdGVtcCBzdG9yZSAtIGl0cyBhIGJpdCBzbG93ZXIgdGhhbiByZWd1bGFyIHN0cmVhbXM/XHJcbiAgICByZXR1cm4gRlMuVGVtcFN0b3JlLmNyZWF0ZVJlYWRTdHJlYW0oc2VsZik7XHJcbiAgfSBlbHNlIHtcclxuICAgIC8vIFN0cmVhbSBmcm9tIHRoZSBzdG9yZSB1c2luZyBzdG9yYWdlIGFkYXB0ZXJcclxuICAgIGlmIChzZWxmLmlzTW91bnRlZCgpKSB7XHJcbiAgICAgIHZhciBzdG9yYWdlID0gc2VsZi5jb2xsZWN0aW9uLnN0b3Jlc0xvb2t1cFtzdG9yZU5hbWVdIHx8IHNlbGYuY29sbGVjdGlvbi5wcmltYXJ5U3RvcmU7XHJcbiAgICAgIEZTLmRlYnVnICYmIGNvbnNvbGUubG9nKFwiZmlsZU9iai5jcmVhdGVSZWFkU3RyZWFtIGNyZWF0aW5nIHJlYWQgc3RyZWFtIGZvciBzdG9yZVwiLCBzdG9yYWdlLm5hbWUpO1xyXG4gICAgICAvLyByZXR1cm4gc3RyZWFtXHJcbiAgICAgIHJldHVybiBzdG9yYWdlLmFkYXB0ZXIuY3JlYXRlUmVhZFN0cmVhbShzZWxmKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ0ZpbGUgbm90IG1vdW50ZWQnKTtcclxuICAgIH1cclxuXHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBtZXRob2QgRlMuRmlsZS5wcm90b3R5cGUuY3JlYXRlV3JpdGVTdHJlYW1cclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge1N0cmluZ30gW3N0b3JlTmFtZV1cclxuICogQHJldHVybnMge3N0cmVhbS5Xcml0ZWFibGV9IFdyaXRlYWJsZSBOb2RlSlMgc3RyZWFtXHJcbiAqXHJcbiAqIFJldHVybnMgYSB3cml0ZWFibGUgc3RyZWFtLiBXaGVyZSB0aGUgc3RyZWFtIHdyaXRlcyB0byBkZXBlbmRzIG9uIHdoZXRoZXIgeW91IHBhc3MgaW4gYSBzdG9yZSBuYW1lLlxyXG4gKlxyXG4gKiAqIElmIHlvdSBwYXNzIGEgYHN0b3JlTmFtZWAsIGEgd3JpdGVhYmxlIHN0cmVhbSBmb3IgKG92ZXIpd3JpdGluZyB0aGUgZmlsZSBkYXRhIGluIHRoYXQgc3RvcmUgaXMgcmV0dXJuZWQuXHJcbiAqICogSWYgeW91IGRvbid0IHBhc3MgYSBgc3RvcmVOYW1lYCwgYSB3cml0ZWFibGUgc3RyZWFtIGZvciB3cml0aW5nIHRvIHRoZSB0ZW1wIHN0b3JlIGZvciB0aGlzIGZpbGUgaXMgcmV0dXJuZWQuXHJcbiAqXHJcbiAqL1xyXG5GUy5GaWxlLnByb3RvdHlwZS5jcmVhdGVXcml0ZVN0cmVhbSA9IGZ1bmN0aW9uKHN0b3JlTmFtZSkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgLy8gV2UgaGF2ZSB0byBoYXZlIGEgbW91bnRlZCBmaWxlIGluIG9yZGVyIGZvciB0aGlzIHRvIHdvcmtcclxuICBpZiAoc2VsZi5pc01vdW50ZWQoKSkge1xyXG4gICAgaWYgKCFzdG9yZU5hbWUgJiYgRlMuVGVtcFN0b3JlICYmIEZTLkZpbGVXb3JrZXIpIHtcclxuICAgICAgLy8gSWYgd2UgaGF2ZSB3b3JrZXIgaW5zdGFsbGVkIC0gd2UgcGFzcyB0aGUgZmlsZSB0byBGUy5UZW1wU3RvcmVcclxuICAgICAgLy8gV2UgZG9udCBuZWVkIHRoZSBzdG9yZU5hbWUgc2luY2UgYWxsIHN0b3JlcyB3aWxsIGJlIGdlbmVyYXRlZCBmcm9tXHJcbiAgICAgIC8vIFRlbXBTdG9yZS5cclxuICAgICAgLy8gVGhpcyBzaG91bGQgdHJpZ2dlciBGUy5GaWxlV29ya2VyIGF0IHNvbWUgcG9pbnQ/XHJcbiAgICAgIEZTLlRlbXBTdG9yZS5jcmVhdGVXcml0ZVN0cmVhbShzZWxmKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIC8vIFN0cmVhbSBkaXJlY3RseSB0byB0aGUgc3RvcmUgdXNpbmcgc3RvcmFnZSBhZGFwdGVyXHJcbiAgICAgIHZhciBzdG9yYWdlID0gc2VsZi5jb2xsZWN0aW9uLnN0b3Jlc0xvb2t1cFtzdG9yZU5hbWVdIHx8IHNlbGYuY29sbGVjdGlvbi5wcmltYXJ5U3RvcmU7XHJcbiAgICAgIHJldHVybiBzdG9yYWdlLmFkYXB0ZXIuY3JlYXRlV3JpdGVTdHJlYW0oc2VsZik7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ0ZpbGUgbm90IG1vdW50ZWQnKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQG1ldGhvZCBGUy5GaWxlLnByb3RvdHlwZS5jb3B5IE1ha2VzIGEgY29weSBvZiB0aGUgZmlsZSBhbmQgdW5kZXJseWluZyBkYXRhIGluIGFsbCBzdG9yZXMuXHJcbiAqIEBwdWJsaWNcclxuICogQHJldHVybnMge0ZTLkZpbGV9IFRoZSBuZXcgRlMuRmlsZSBpbnN0YW5jZVxyXG4gKi9cclxuRlMuRmlsZS5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uKCkge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgaWYgKCFzZWxmLmlzTW91bnRlZCgpKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgY29weSBhIGZpbGUgdGhhdCBpcyBub3QgYXNzb2NpYXRlZCB3aXRoIGEgY29sbGVjdGlvblwiKTtcclxuICB9XHJcblxyXG4gIC8vIEdldCB0aGUgZmlsZSByZWNvcmRcclxuICB2YXIgZmlsZVJlY29yZCA9IHNlbGYuY29sbGVjdGlvbi5maWxlcy5maW5kT25lKHtfaWQ6IHNlbGYuX2lkfSwge3RyYW5zZm9ybTogbnVsbH0pIHx8IHt9O1xyXG5cclxuICAvLyBSZW1vdmUgX2lkIGFuZCBjb3B5IGtleXMgZnJvbSB0aGUgZmlsZSByZWNvcmRcclxuICBkZWxldGUgZmlsZVJlY29yZC5faWQ7XHJcblxyXG4gIC8vIEluc2VydCBkaXJlY3RseTsgd2UgZG9uJ3QgaGF2ZSBhY2Nlc3MgdG8gXCJvcmlnaW5hbFwiIGluIHRoaXMgY2FzZVxyXG4gIHZhciBuZXdJZCA9IHNlbGYuY29sbGVjdGlvbi5maWxlcy5pbnNlcnQoZmlsZVJlY29yZCk7XHJcblxyXG4gIHZhciBuZXdGaWxlID0gc2VsZi5jb2xsZWN0aW9uLmZpbmRPbmUobmV3SWQpO1xyXG5cclxuICAvLyBDb3B5IHVuZGVybHlpbmcgZmlsZXMgaW4gdGhlIHN0b3Jlc1xyXG4gIHZhciBtb2QsIG9sZEtleTtcclxuICBmb3IgKHZhciBuYW1lIGluIG5ld0ZpbGUuY29waWVzKSB7XHJcbiAgICBpZiAobmV3RmlsZS5jb3BpZXMuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcclxuICAgICAgb2xkS2V5ID0gbmV3RmlsZS5jb3BpZXNbbmFtZV0ua2V5O1xyXG4gICAgICBpZiAob2xkS2V5KSB7XHJcbiAgICAgICAgLy8gV2UgbmVlZCB0byBhc2sgdGhlIGFkYXB0ZXIgZm9yIHRoZSB0cnVlIG9sZEtleSBiZWNhdXNlXHJcbiAgICAgICAgLy8gcmlnaHQgbm93IGdyaWRmcyBkb2VzIHNvbWUgZXh0cmEgc3R1ZmYuXHJcbiAgICAgICAgLy8gVE9ETyBHcmlkRlMgc2hvdWxkIHByb2JhYmx5IHNldCB0aGUgZnVsbCBrZXkgb2JqZWN0XHJcbiAgICAgICAgLy8gKHdpdGggX2lkIGFuZCBmaWxlbmFtZSkgaW50byBgY29waWVzLmtleWBcclxuICAgICAgICAvLyBzbyB0aGF0IGNvcGllcy5rZXkgY2FuIGJlIHBhc3NlZCBkaXJlY3RseSB0b1xyXG4gICAgICAgIC8vIGNyZWF0ZVJlYWRTdHJlYW1Gb3JGaWxlS2V5XHJcbiAgICAgICAgdmFyIHNvdXJjZUZpbGVTdG9yYWdlID0gc2VsZi5jb2xsZWN0aW9uLnN0b3Jlc0xvb2t1cFtuYW1lXTtcclxuICAgICAgICBpZiAoIXNvdXJjZUZpbGVTdG9yYWdlKSB7XHJcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobmFtZSArIFwiIGlzIG5vdCBhIHZhbGlkIHN0b3JlIG5hbWVcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG9sZEtleSA9IHNvdXJjZUZpbGVTdG9yYWdlLmFkYXB0ZXIuZmlsZUtleShzZWxmKTtcclxuICAgICAgICAvLyBkZWxldGUgc28gdGhhdCBuZXcgZmlsZUtleSB3aWxsIGJlIGdlbmVyYXRlZCBpbiBjb3B5U3RvcmVEYXRhXHJcbiAgICAgICAgZGVsZXRlIG5ld0ZpbGUuY29waWVzW25hbWVdLmtleTtcclxuICAgICAgICBtb2QgPSBtb2QgfHwge307XHJcbiAgICAgICAgbW9kW1wiY29waWVzLlwiICsgbmFtZSArIFwiLmtleVwiXSA9IGNvcHlTdG9yZURhdGEobmV3RmlsZSwgbmFtZSwgb2xkS2V5KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH1cclxuICAvLyBVcGRhdGUga2V5cyBpbiB0aGUgZmlsZXJlY29yZFxyXG4gIGlmIChtb2QpIHtcclxuICAgIG5ld0ZpbGUudXBkYXRlKHskc2V0OiBtb2R9KTtcclxuICB9XHJcblxyXG4gIHJldHVybiBuZXdGaWxlO1xyXG59O1xyXG5cclxuTWV0ZW9yLm1ldGhvZHMoe1xyXG4gIC8vIERvZXMgYSBIRUFEIHJlcXVlc3QgdG8gVVJMIHRvIGdldCB0aGUgdHlwZSwgdXBkYXRlZEF0LFxyXG4gIC8vIGFuZCBzaXplIHByaW9yIHRvIGFjdHVhbGx5IGRvd25sb2FkaW5nIHRoZSBkYXRhLlxyXG4gIC8vIFRoYXQgd2F5IHdlIGNhbiBkbyBmaWx0ZXIgY2hlY2tzIHdpdGhvdXQgYWN0dWFsbHkgZG93bmxvYWRpbmcuXHJcbiAgJ19jZnNfZ2V0VXJsSW5mbyc6IGZ1bmN0aW9uICh1cmwsIG9wdGlvbnMpIHtcclxuICAgIGNoZWNrKHVybCwgU3RyaW5nKTtcclxuICAgIGNoZWNrKG9wdGlvbnMsIE9iamVjdCk7XHJcblxyXG4gICAgdGhpcy51bmJsb2NrKCk7XHJcblxyXG4gICAgdmFyIHJlc3BvbnNlID0gSFRUUC5jYWxsKFwiSEVBRFwiLCB1cmwsIG9wdGlvbnMpO1xyXG4gICAgdmFyIGhlYWRlcnMgPSByZXNwb25zZS5oZWFkZXJzO1xyXG4gICAgdmFyIHJlc3VsdCA9IHt9O1xyXG5cclxuICAgIGlmIChoZWFkZXJzWydjb250ZW50LXR5cGUnXSkge1xyXG4gICAgICByZXN1bHQudHlwZSA9IGhlYWRlcnNbJ2NvbnRlbnQtdHlwZSddO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChoZWFkZXJzWydjb250ZW50LWxlbmd0aCddKSB7XHJcbiAgICAgIHJlc3VsdC5zaXplID0gK2hlYWRlcnNbJ2NvbnRlbnQtbGVuZ3RoJ107XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKGhlYWRlcnNbJ2xhc3QtbW9kaWZpZWQnXSkge1xyXG4gICAgICByZXN1bHQudXBkYXRlZEF0ID0gbmV3IERhdGUoaGVhZGVyc1snbGFzdC1tb2RpZmllZCddKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH0sXHJcbiAgLy8gSGVscGVyIGZ1bmN0aW9uIHRoYXQgY2hlY2tzIHdoZXRoZXIgZ2l2ZW4gZmlsZUlkIGZyb20gY29sbGVjdGlvbk5hbWVcclxuICAvLyAgSXMgZnVsbHkgdXBsb2FkZWQgdG8gc3BlY2lmeSBzdG9yZU5hbWUuXHJcbiAgJ19jZnNfcmV0dXJuV2hlblN0b3JlZCcgOiBmdW5jdGlvbiAoY29sbGVjdGlvbk5hbWUsIGZpbGVJZCwgc3RvcmVOYW1lKSB7XHJcbiAgICBjaGVjayhjb2xsZWN0aW9uTmFtZSwgU3RyaW5nKTtcclxuICAgIGNoZWNrKGZpbGVJZCwgU3RyaW5nKTtcclxuICAgIGNoZWNrKHN0b3JlTmFtZSwgU3RyaW5nKTtcclxuXHJcbiAgICB2YXIgY29sbGVjdGlvbiA9IEZTLl9jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV07XHJcbiAgICBpZiAoIWNvbGxlY3Rpb24pIHtcclxuICAgICAgcmV0dXJuIE1ldGVvci5FcnJvcignX2Nmc19yZXR1cm5XaGVuU3RvcmVkOiBGU0NvbGxlY3Rpb24gbmFtZSBub3QgZXhpc3RzJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGZpbGUgPSBjb2xsZWN0aW9uLmZpbmRPbmUoe19pZDogZmlsZUlkfSk7XHJcbiAgICBpZiAoIWZpbGUpIHtcclxuICAgICAgcmV0dXJuIE1ldGVvci5FcnJvcignX2Nmc19yZXR1cm5XaGVuU3RvcmVkOiBGU0ZpbGUgbm90IGV4aXN0cycpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZpbGUuaGFzU3RvcmVkKHN0b3JlTmFtZSk7XHJcbiAgfVxyXG59KTtcclxuXHJcbi8vIFRPRE8gbWF5YmUgdGhpcyBzaG91bGQgYmUgaW4gY2ZzLXN0b3JhZ2UtYWRhcHRlclxyXG5mdW5jdGlvbiBfY29weVN0b3JlRGF0YShmaWxlT2JqLCBzdG9yZU5hbWUsIHNvdXJjZUtleSwgY2FsbGJhY2spIHtcclxuICBpZiAoIWZpbGVPYmouaXNNb3VudGVkKCkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBjb3B5IHN0b3JlIGRhdGEgZm9yIGEgZmlsZSB0aGF0IGlzIG5vdCBhc3NvY2lhdGVkIHdpdGggYSBjb2xsZWN0aW9uXCIpO1xyXG4gIH1cclxuXHJcbiAgdmFyIHN0b3JhZ2UgPSBmaWxlT2JqLmNvbGxlY3Rpb24uc3RvcmVzTG9va3VwW3N0b3JlTmFtZV07XHJcbiAgaWYgKCFzdG9yYWdlKSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3Ioc3RvcmVOYW1lICsgXCIgaXMgbm90IGEgdmFsaWQgc3RvcmUgbmFtZVwiKTtcclxuICB9XHJcblxyXG4gIC8vIFdlIHdhbnQgdG8gcHJldmVudCBiZWZvcmVXcml0ZSBhbmQgdHJhbnNmb3JtV3JpdGUgZnJvbSBydW5uaW5nLCBzb1xyXG4gIC8vIHdlIGludGVyYWN0IGRpcmVjdGx5IHdpdGggdGhlIHN0b3JlLlxyXG4gIHZhciBkZXN0aW5hdGlvbktleSA9IHN0b3JhZ2UuYWRhcHRlci5maWxlS2V5KGZpbGVPYmopO1xyXG4gIHZhciByZWFkU3RyZWFtID0gc3RvcmFnZS5hZGFwdGVyLmNyZWF0ZVJlYWRTdHJlYW1Gb3JGaWxlS2V5KHNvdXJjZUtleSk7XHJcbiAgdmFyIHdyaXRlU3RyZWFtID0gc3RvcmFnZS5hZGFwdGVyLmNyZWF0ZVdyaXRlU3RyZWFtRm9yRmlsZUtleShkZXN0aW5hdGlvbktleSk7XHJcblxyXG4gIHdyaXRlU3RyZWFtLm9uY2UoJ3N0b3JlZCcsIGZ1bmN0aW9uKHJlc3VsdCkge1xyXG4gICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0LmZpbGVLZXkpO1xyXG4gIH0pO1xyXG5cclxuICB3cml0ZVN0cmVhbS5vbmNlKCdlcnJvcicsIGZ1bmN0aW9uKGVycm9yKSB7XHJcbiAgICBjYWxsYmFjayhlcnJvcik7XHJcbiAgfSk7XHJcblxyXG4gIHJlYWRTdHJlYW0ucGlwZSh3cml0ZVN0cmVhbSk7XHJcbn1cclxudmFyIGNvcHlTdG9yZURhdGEgPSBNZXRlb3Iud3JhcEFzeW5jKF9jb3B5U3RvcmVEYXRhKTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGUucHJvdG90eXBlLmNvcHlEYXRhIENvcGllcyB0aGUgY29udGVudCBvZiBhIHN0b3JlIGRpcmVjdGx5IGludG8gYW5vdGhlciBzdG9yZS5cclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gc291cmNlU3RvcmVOYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRTdG9yZU5hbWVcclxuICogQHBhcmFtIHtib29sZWFuPX0gbW92ZVxyXG4gKi9cclxuRlMuRmlsZS5wcm90b3R5cGUuY29weURhdGEgPSBmdW5jdGlvbihzb3VyY2VTdG9yZU5hbWUsIHRhcmdldFN0b3JlTmFtZSwgbW92ZSl7XHJcblxyXG4gIG1vdmUgPSAhIW1vdmU7XHJcbiAgLyoqXHJcbiAgICogQHR5cGUge09iamVjdC48c3RyaW5nLCo+fVxyXG4gICAqL1xyXG4gIHZhciBzb3VyY2VTdG9yZVZhbHVlcyA9IHRoaXMuY29waWVzW3NvdXJjZVN0b3JlTmFtZV07XHJcbiAgLyoqXHJcbiAgICogQHR5cGUge3N0cmluZ31cclxuICAgKi9cclxuICB2YXIgY29weUtleSA9IGNsb25lRGF0YVRvU3RvcmUodGhpcywgc291cmNlU3RvcmVOYW1lLCB0YXJnZXRTdG9yZU5hbWUsIG1vdmUpO1xyXG4gIC8qKlxyXG4gICAqIEB0eXBlIHtPYmplY3QuPHN0cmluZywqPn1cclxuICAgKi9cclxuICB2YXIgdGFyZ2V0U3RvcmVWYWx1ZXMgPSB7fTtcclxuICBmb3IgKHZhciB2IGluIHNvdXJjZVN0b3JlVmFsdWVzKSB7XHJcbiAgICBpZiAoc291cmNlU3RvcmVWYWx1ZXMuaGFzT3duUHJvcGVydHkodikpIHtcclxuICAgICAgdGFyZ2V0U3RvcmVWYWx1ZXNbdl0gPSBzb3VyY2VTdG9yZVZhbHVlc1t2XVxyXG4gICAgfVxyXG4gIH1cclxuICB0YXJnZXRTdG9yZVZhbHVlcy5rZXkgPSBjb3B5S2V5O1xyXG4gIHRhcmdldFN0b3JlVmFsdWVzLmNyZWF0ZWRBdCA9IG5ldyBEYXRlKCk7XHJcbiAgdGFyZ2V0U3RvcmVWYWx1ZXMudXBkYXRlZEF0ID0gbmV3IERhdGUoKTtcclxuICAvKipcclxuICAgKlxyXG4gICAqIEB0eXBlIHttb2RpZmllcn1cclxuICAgKi9cclxuICB2YXIgbW9kaWZpZXIgPSB7fTtcclxuICBtb2RpZmllci4kc2V0ID0ge307XHJcbiAgbW9kaWZpZXIuJHNldFtcImNvcGllcy5cIit0YXJnZXRTdG9yZU5hbWVdID0gdGFyZ2V0U3RvcmVWYWx1ZXM7XHJcbiAgaWYobW92ZSl7XHJcbiAgICBtb2RpZmllci4kdW5zZXQgPSB7fTtcclxuICAgIG1vZGlmaWVyLiR1bnNldFtcImNvcGllcy5cIitzb3VyY2VTdG9yZU5hbWVdID0gXCJcIjtcclxuICB9XHJcbiAgdGhpcy51cGRhdGUobW9kaWZpZXIpO1xyXG59O1xyXG4vKipcclxuICogQG1ldGhvZCBGUy5GaWxlLnByb3RvdHlwZS5tb3ZlRGF0YSBNb3ZlcyB0aGUgY29udGVudCBvZiBhIHN0b3JlIGRpcmVjdGx5IGludG8gYW5vdGhlciBzdG9yZS5cclxuICogQHB1YmxpY1xyXG4gKiBAcGFyYW0ge3N0cmluZ30gc291cmNlU3RvcmVOYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRTdG9yZU5hbWVcclxuICovXHJcbkZTLkZpbGUucHJvdG90eXBlLm1vdmVEYXRhID0gZnVuY3Rpb24oc291cmNlU3RvcmVOYW1lLCB0YXJnZXRTdG9yZU5hbWUpe1xyXG4gIHRoaXMuY29weURhdGEoc291cmNlU3RvcmVOYW1lLCB0YXJnZXRTdG9yZU5hbWUsIHRydWUpO1xyXG59O1xyXG4vLyBUT0RPIG1heWJlIHRoaXMgc2hvdWxkIGJlIGluIGNmcy1zdG9yYWdlLWFkYXB0ZXJcclxuLyoqXHJcbiAqXHJcbiAqIEBwYXJhbSB7RlMuRmlsZX0gZmlsZU9ialxyXG4gKiBAcGFyYW0ge3N0cmluZ30gc291cmNlU3RvcmVOYW1lXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSB0YXJnZXRTdG9yZU5hbWVcclxuICogQHBhcmFtIHtib29sZWFufSBtb3ZlXHJcbiAqIEBwYXJhbSBjYWxsYmFja1xyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gX2NvcHlEYXRhRnJvbVN0b3JlVG9TdG9yZShmaWxlT2JqLCBzb3VyY2VTdG9yZU5hbWUsIHRhcmdldFN0b3JlTmFtZSwgbW92ZSwgY2FsbGJhY2spIHtcclxuICBpZiAoIWZpbGVPYmouaXNNb3VudGVkKCkpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCBjb3B5IHN0b3JlIGRhdGEgZm9yIGEgZmlsZSB0aGF0IGlzIG5vdCBhc3NvY2lhdGVkIHdpdGggYSBjb2xsZWN0aW9uXCIpO1xyXG4gIH1cclxuICAvKipcclxuICAgKiBAdHlwZSB7RlMuU3RvcmFnZUFkYXB0ZXJ9XHJcbiAgICovXHJcbiAgdmFyIHNvdXJjZVN0b3JhZ2UgPSBmaWxlT2JqLmNvbGxlY3Rpb24uc3RvcmVzTG9va3VwW3NvdXJjZVN0b3JlTmFtZV07XHJcbiAgLyoqXHJcbiAgICogQHR5cGUge0ZTLlN0b3JhZ2VBZGFwdGVyfVxyXG4gICAqL1xyXG4gIHZhciB0YXJnZXRTdG9yYWdlID0gZmlsZU9iai5jb2xsZWN0aW9uLnN0b3Jlc0xvb2t1cFt0YXJnZXRTdG9yZU5hbWVdO1xyXG5cclxuICBpZiAoIXNvdXJjZVN0b3JhZ2UpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcihzb3VyY2VTdG9yZU5hbWUgKyBcIiBpcyBub3QgYSB2YWxpZCBzdG9yZSBuYW1lXCIpO1xyXG4gIH1cclxuICBpZiAoIXRhcmdldFN0b3JhZ2UpIHtcclxuICAgIHRocm93IG5ldyBFcnJvcih0YXJnZXRTdG9yYWdlICsgXCIgaXMgbm90IGEgdmFsaWQgc3RvcmUgbmFtZVwiKTtcclxuICB9XHJcblxyXG4gIC8vIFdlIHdhbnQgdG8gcHJldmVudCBiZWZvcmVXcml0ZSBhbmQgdHJhbnNmb3JtV3JpdGUgZnJvbSBydW5uaW5nLCBzb1xyXG4gIC8vIHdlIGludGVyYWN0IGRpcmVjdGx5IHdpdGggdGhlIHN0b3JlLlxyXG4gIHZhciBzb3VyY2VLZXkgPSBzb3VyY2VTdG9yYWdlLmFkYXB0ZXIuZmlsZUtleShmaWxlT2JqKTtcclxuICB2YXIgdGFyZ2V0S2V5ID0gdGFyZ2V0U3RvcmFnZS5hZGFwdGVyLmZpbGVLZXkoZmlsZU9iaik7XHJcbiAgdmFyIHJlYWRTdHJlYW0gPSBzb3VyY2VTdG9yYWdlLmFkYXB0ZXIuY3JlYXRlUmVhZFN0cmVhbUZvckZpbGVLZXkoc291cmNlS2V5KTtcclxuICB2YXIgd3JpdGVTdHJlYW0gPSB0YXJnZXRTdG9yYWdlLmFkYXB0ZXIuY3JlYXRlV3JpdGVTdHJlYW1Gb3JGaWxlS2V5KHRhcmdldEtleSk7XHJcblxyXG5cclxuICB3cml0ZVN0cmVhbS5zYWZlT25jZSgnc3RvcmVkJywgZnVuY3Rpb24ocmVzdWx0KSB7XHJcbiAgICBpZihtb3ZlICYmIHNvdXJjZVN0b3JhZ2UuYWRhcHRlci5yZW1vdmUoZmlsZU9iaik9PT1mYWxzZSl7XHJcbiAgICAgIGNhbGxiYWNrKFwiQ29waWVkIHRvIHN0b3JlOlwiICsgdGFyZ2V0U3RvcmVOYW1lXHJcbiAgICAgICsgXCIgd2l0aCBmaWxlS2V5OiBcIlxyXG4gICAgICArIHJlc3VsdC5maWxlS2V5XHJcbiAgICAgICsgXCIsIGJ1dCBjb3VsZCBub3QgZGVsZXRlIGZyb20gc291cmNlIHN0b3JlOiBcIlxyXG4gICAgICArIHNvdXJjZVN0b3JlTmFtZSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgY2FsbGJhY2sobnVsbCwgcmVzdWx0LmZpbGVLZXkpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICB3cml0ZVN0cmVhbS5vbmNlKCdlcnJvcicsIGZ1bmN0aW9uKGVycm9yKSB7XHJcbiAgICBjYWxsYmFjayhlcnJvcik7XHJcbiAgfSk7XHJcblxyXG4gIHJlYWRTdHJlYW0ucGlwZSh3cml0ZVN0cmVhbSk7XHJcbn1cclxudmFyIGNsb25lRGF0YVRvU3RvcmUgPSBNZXRlb3Iud3JhcEFzeW5jKF9jb3B5RGF0YUZyb21TdG9yZVRvU3RvcmUpO1xyXG4iXX0=
