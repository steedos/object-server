(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var FS = Package['steedos:cfs-base-package'].FS;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var check = Package.check.check;
var Match = Package.check.Match;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var EventEmitter = Package['raix:eventemitter'].EventEmitter;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var fsFile;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/steedos_cfs-collection/common.js                                                                   //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
/**
 *
 * @constructor
 * @param {string} name A name for the collection
 * @param {Object} options
 * @param {FS.StorageAdapter[]} options.stores An array of stores in which files should be saved. At least one is required.
 * @param {Object} [options.filter] Filter definitions
 * @param {Number} [options.chunkSize=2MB] Override the chunk size in bytes for uploads
 * @param {Function} [options.uploader] A function to pass FS.File instances after inserting, which will begin uploading them. By default, `FS.HTTP.uploadQueue.uploadFile` is used if the `cfs-upload-http` package is present, or `FS.DDP.uploadQueue.uploadFile` is used if the `cfs-upload-ddp` package is present. You can override with your own, or set to `null` to prevent automatic uploading.
 * @returns {undefined}
 */
FS.Collection = function(name, options) {
  var self = this;

  self.storesLookup = {};

  self.primaryStore = {};

  self.options = {
    filter: null, //optional
    stores: [], //required
    chunkSize: null
  };

  // Define a default uploader based on which upload packages are present,
  // preferring HTTP. You may override with your own function or
  // set to null to skip automatic uploading of data after file insert/update.
  if (FS.HTTP && FS.HTTP.uploadQueue) {
    self.options.uploader = FS.HTTP.uploadQueue.uploadFile;
  } else if (FS.DDP && FS.DDP.uploadQueue) {
    self.options.uploader = FS.DDP.uploadQueue.uploadFile;
  }

  // Extend and overwrite options
  FS.Utility.extend(self.options, options || {});

  // Set the FS.Collection name
  self.name = name;

  // Make sure at least one store has been supplied.
  // Usually the stores aren't used on the client, but we need them defined
  // so that we can access their names and use the first one as the default.
  if (FS.Utility.isEmpty(self.options.stores)) {
    throw new Error("You must specify at least one store. Please consult the documentation.");
  }

  FS.Utility.each(self.options.stores, function(store, i) {
    // Set the primary store
    if (i === 0) {
      self.primaryStore = store;
    }

    // Check for duplicate naming
    if (typeof self.storesLookup[store.name] !== 'undefined') {
      throw new Error('FS.Collection store names must be uniq, duplicate found: ' + store.name);
    }

    // Set the lookup
    self.storesLookup[store.name] = store;

    if (Meteor.isServer) {

      // Emit events based on store events
      store.on('stored', Meteor.bindEnvironment(function(storeName, fileObj) {
        // This is weird, but currently there is a bug where each store will emit the
        // events for all other stores, too, so we need to make sure that this event
        // is truly for this store.
        if (storeName !== store.name)
          return;
        // When a file is successfully stored into the store, we emit a "stored" event on the FS.Collection only if the file belongs to this collection
        if (fileObj.collectionName === name) {
          var emitted = self.emit('stored', fileObj, store.name);
          if (FS.debug && !emitted) {
            console.log(fileObj.name({
              store: store.name
            }) + ' was successfully saved to the ' + store.name + ' store. You are seeing this informational message because you enabled debugging and you have not defined any listeners for the "stored" event on the ' + name + ' collection.');
          }
          FS.debug && console.log('清除_tempstore中的chunk', name);
          // 上传完成后清除_tempstore中的chunk
          FS.TempStore.removeFile(fileObj);
        }
        fileObj.emit('stored', store.name);
      }));

      store.on('error', function(storeName, error, fileObj) {
        // This is weird, but currently there is a bug where each store will emit the
        // events for all other stores, too, so we need to make sure that this event
        // is truly for this store.
        if (storeName !== store.name)
          return;
        // When a file has an error while being stored into the temp store, we emit an "error" event on the FS.Collection only if the file belongs to this collection
        if (fileObj.collectionName === name) {
          error = new Error('Error storing file to the ' + store.name + ' store: ' + error.message);
          var emitted = self.emit('error', error, fileObj, store.name);
          if (FS.debug && !emitted) {
            console.log(error.message);
          }
        }
        fileObj.on('error', function(storeName) {
          console.error("fileObj emit error");
          console.error(storeName);
        });
        fileObj.emit('error', store.name);
      });

    }
  });

  var _filesOptions = {
    transform: function(doc) {
      // This should keep the filerecord in the file object updated in reactive
      // context
      var result = new FS.File(doc, true);
      result.collectionName = name;
      return result;
    }
  };

  // Create the 'cfs.' ++ ".filerecord" and use fsFile
  var collectionName = 'cfs.' + name + '.filerecord';
  self.files = new Mongo.Collection(collectionName, _filesOptions);

  if (Meteor.isServer) {
    self.files.before.remove(function(userId, doc){
      try {
        FS.debug && console.log('删除文件', doc._id);
        fsFile = self.files.findOne(doc._id);
        //remove from temp store
        FS.TempStore.removeFile(fsFile);
        //delete from all stores
        FS.Utility.each(self.options.stores, function(storage) {
          try {
            storage.adapter.remove(fsFile);
          } catch (e) {
            return
          }
        });
      } catch (error) {
        console.error('删除文件', error.stack);
        return
      }

    })
  }

  // For storing custom allow/deny functions
  self._validators = {
    download: {
      allow: [],
      deny: []
    }
  };

  // Set up filters
  // XXX Should we deprecate the filter option now that this is done with a separate pkg, or just keep it?
  if (self.filters) {
    self.filters(self.options.filter);
  }

  // Save the collection reference (we want it without the 'cfs.' prefix and '.filerecord' suffix)
  FS._collections[name] = this;

  // Set up observers
  Meteor.isServer && FS.FileWorker && FS.FileWorker.observe(this);

  // Emit "removed" event on collection
  // self.files.find().observe({
  //   removed: function(fileObj) {
  //     self.emit('removed', fileObj);
  //   }
  // });

  // Emit events based on TempStore events
  if (FS.TempStore) {
    FS.TempStore.on('stored', function(fileObj, result) {
      // When a file is successfully stored into the temp store, we emit an "uploaded" event on the FS.Collection only if the file belongs to this collection
      if (fileObj.collectionName === name) {
        var emitted = self.emit('uploaded', fileObj);
        if (FS.debug && !emitted) {
          console.log(fileObj.name() + ' was successfully uploaded. You are seeing this informational message because you enabled debugging and you have not defined any listeners for the "uploaded" event on the ' + name + ' collection.');
        }
        FS.debug && console.log('保存文件', fileObj.getCollection().primaryStore.name);
        FS.FileWorker.saveCopy(fileObj, fileObj.getCollection().primaryStore.name);
      }

    });

    FS.TempStore.on('error', function(error, fileObj) {
      // When a file has an error while being stored into the temp store, we emit an "error" event on the FS.Collection only if the file belongs to this collection
      if (fileObj.collectionName === name) {
        self.emit('error', new Error('Error storing uploaded file to TempStore: ' + error.message), fileObj);
      }
    });
  } else if (Meteor.isServer) {
    throw new Error("FS.Collection constructor: FS.TempStore must be defined before constructing any FS.Collections.")
  }

};

// An FS.Collection can emit events
FS.Collection.prototype = new EventEmitter();
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                             //
// packages/steedos_cfs-collection/api.common.js                                                               //
//                                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                               //
/** @method FS.Collection.prototype.insert Insert `File` or `FS.File` or remote URL into collection
 * @public
 * @param {File|Blob|Buffer|ArrayBuffer|Uint8Array|String} fileRef File, FS.File, or other data to insert
 * @param {function} [callback] Callback `function(error, fileObj)`
 * @returns {FS.File|undefined} The `file object`
 * [Meteor docs](http://docs.meteor.com/#insert)
 */
FS.Collection.prototype.insert = function(fileRef, callback) {
  var self = this;

  if (Meteor.isClient && !callback) {
    callback = FS.Utility.defaultCallback;
  }

  // XXX:
  // We should out factor beginStorage to FS.File.beginStorage
  // the client side storage adapters should be the one providing
  // the upload either via http/ddp or direct upload
  // Could be cool to have a streaming api on the client side
  // having a createReadStream etc. on the client too...
  function beginStorage(fileObj) {
    // If on client, begin uploading the data
    if (Meteor.isClient) {
      self.options.uploader && self.options.uploader(fileObj);
    }

    // If on the server, save the binary to a single chunk temp file,
    // so that it is available when FileWorker calls saveCopies.
    // This will also trigger file handling from collection observes.
    else if (Meteor.isServer) {
      fileObj.createReadStream().pipe(FS.TempStore.createWriteStream(fileObj));
    }
  }

  // XXX: would be great if this function could be simplyfied - if even possible?
  function checkAndInsert(fileObj) {
    // Check filters. This is called in deny functions, too, but we call here to catch
    // server inserts and to catch client inserts early, allowing us to call `onInvalid` on
    // the client and save a trip to the server.
    if (!self.allowsFile(fileObj)) {
      return FS.Utility.handleError(callback, 'FS.Collection insert: file does not pass collection filters');
    }

    // Set collection name
    fileObj.collectionName = self.name;

    // Insert the file into db
    // We call cloneFileRecord as an easy way of extracting the properties
    // that need saving.
    if (callback) {
      fileObj._id = self.files.insert(FS.Utility.cloneFileRecord(fileObj), function(err, id) {
        if (err) {
          if (fileObj._id) {
            delete fileObj._id;
          }
        } else {
          // Set _id, just to be safe, since this could be before or after the insert method returns
          fileObj._id = id;
          // Pass to uploader or stream data to the temp store
          beginStorage(fileObj);
        }
        callback(err, err ? void 0 : fileObj);
      });
    } else {
      fileObj._id = self.files.insert(FS.Utility.cloneFileRecord(fileObj));
      // Pass to uploader or stream data to the temp store
      beginStorage(fileObj);
    }
    return fileObj;
  }

  // Parse, adjust fileRef
  if (fileRef instanceof FS.File) {
    if (!fileRef.type()) {
      fileRef.type('application/octet-stream');
    }
    return checkAndInsert(fileRef);
  } else {
    // For convenience, allow File, Blob, Buffer, data URI, filepath, URL, etc. to be passed as first arg,
    // and we will attach that to a new fileobj for them
    var fileObj = new FS.File(fileRef);
    if (callback) {
      fileObj.attachData(fileRef, function attachDataCallback(error) {
        if (error) {
          callback(error);
        } else {
          checkAndInsert(fileObj);
        }
      });
    } else {
      // We ensure there's a callback on the client, so if there isn't one at this point,
      // we must be on the server expecting synchronous behavior.
      fileObj.attachData(fileRef);
      checkAndInsert(fileObj);
    }
    return fileObj;
  }
};

/** @method FS.Collection.prototype.update Update the file record
 * @public
 * @param {FS.File|object} selector
 * @param {object} modifier
 * @param {object} [options]
 * @param {function} [callback]
 * [Meteor docs](http://docs.meteor.com/#update)
 */
FS.Collection.prototype.update = function(selector, modifier, options, callback) {
  var self = this;
  if (selector instanceof FS.File) {
    // Make sure the file belongs to this FS.Collection
    if (selector.collectionName === self.files._name) {
      return selector.update(modifier, options, callback);
    } else {
      // Tried to save a file in the wrong FS.Collection
      throw new Error('FS.Collection cannot update file belongs to: "' + selector.collectionName + '" not: "' + self.files._name + '"');
    }
  }

  return self.files.update(selector, modifier, options, callback);
};

/** @method FS.Collection.prototype.remove Remove the file from the collection
 * @public
 * @param {FS.File|object} selector
 * @param {Function} [callback]
 * [Meteor docs](http://docs.meteor.com/#remove)
 */
FS.Collection.prototype.remove = function(selector, callback) {
  var self = this;
  if (selector instanceof FS.File) {

    // Make sure the file belongs to this FS.Collection
    if (selector.collectionName === self.files._name) {
      return selector.remove(callback);
    } else {
      // Tried to remove a file from the wrong FS.Collection
      throw new Error('FS.Collection cannot remove file belongs to: "' + selector.collectionName + '" not: "' + self.files._name + '"');
    }
  }

  //doesn't work correctly on the client without a callback
  callback = callback || FS.Utility.defaultCallback;
  return self.files.remove(selector, callback);
};

/** @method FS.Collection.prototype.findOne
 * @public
 * @param {[selector](http://docs.meteor.com/#selectors)} selector
 * [Meteor docs](http://docs.meteor.com/#findone)
 * Example:
 ```js
 var images = new FS.Collection( ... );
 // Get the file object
 var fo = images.findOne({ _id: 'NpnskCt6ippN6CgD8' });
 ```
 */
// Call findOne on files collection
FS.Collection.prototype.findOne = function(selector) {
  var self = this;
  return self.files.findOne.apply(self.files, arguments);
};

/** @method FS.Collection.prototype.find
 * @public
 * @param {[selector](http://docs.meteor.com/#selectors)} selector
 * [Meteor docs](http://docs.meteor.com/#find)
 * Example:
 ```js
 var images = new FS.Collection( ... );
 // Get the all file objects
 var files = images.find({ _id: 'NpnskCt6ippN6CgD8' }).fetch();
 ```
 */
FS.Collection.prototype.find = function(selector) {
  var self = this;
  return self.files.find.apply(self.files, arguments);
};

/** @method FS.Collection.prototype.allow
 * @public
 * @param {object} options
 * @param {function} options.download Function that checks if the file contents may be downloaded
 * @param {function} options.insert
 * @param {function} options.update
 * @param {function} options.remove Functions that look at a proposed modification to the database and return true if it should be allowed
 * @param {[string]} [options.fetch] Optional performance enhancement. Limits the fields that will be fetched from the database for inspection by your update and remove functions
 * [Meteor docs](http://docs.meteor.com/#allow)
 * Example:
 ```js
 var images = new FS.Collection( ... );
 // Get the all file objects
 var files = images.allow({
 insert: function(userId, doc) { return true; },
 update: function(userId, doc, fields, modifier) { return true; },
 remove: function(userId, doc) { return true; },
 download: function(userId, fileObj) { return true; },
 });
 ```
 */
FS.Collection.prototype.allow = function(options) {
  var self = this;

  // Pull out the custom "download" functions
  if (options.download) {
    if (!(options.download instanceof Function)) {
      throw new Error("allow: Value for `download` must be a function");
    }
    self._validators.download.allow.push(options.download);
    delete options.download;
  }

  return self.files.allow.call(self.files, options);
};

/** @method FS.Collection.prototype.deny
 * @public
 * @param {object} options
 * @param {function} options.download Function that checks if the file contents may be downloaded
 * @param {function} options.insert
 * @param {function} options.update
 * @param {function} options.remove Functions that look at a proposed modification to the database and return true if it should be denyed
 * @param {[string]} [options.fetch] Optional performance enhancement. Limits the fields that will be fetched from the database for inspection by your update and remove functions
 * [Meteor docs](http://docs.meteor.com/#deny)
 * Example:
 ```js
 var images = new FS.Collection( ... );
 // Get the all file objects
 var files = images.deny({
 insert: function(userId, doc) { return true; },
 update: function(userId, doc, fields, modifier) { return true; },
 remove: function(userId, doc) { return true; },
 download: function(userId, fileObj) { return true; },
 });
 ```
 */
FS.Collection.prototype.deny = function(options) {
  var self = this;

  // Pull out the custom "download" functions
  if (options.download) {
    if (!(options.download instanceof Function)) {
      throw new Error("deny: Value for `download` must be a function");
    }
    self._validators.download.deny.push(options.download);
    delete options.download;
  }

  return self.files.deny.call(self.files, options);
};

// TODO: Upsert?

/**
 * We provide a default implementation that doesn't do anything.
 * Can be changed by user or packages, such as the default cfs-collection-filters pkg.
 * @param  {FS.File} fileObj File object
 * @return {Boolean} Should we allow insertion of this file?
 */
FS.Collection.prototype.allowsFile = function fsColAllowsFile(fileObj) {
  return true;
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("steedos:cfs-collection");

})();
