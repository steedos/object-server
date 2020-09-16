(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var FS = Package['steedos:cfs-base-package'].FS;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var PowerQueue = Package['steedos:cfs-power-queue'].PowerQueue;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:cfs-worker":{"fileWorker.js":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_cfs-worker/fileWorker.js                                                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
//// TODO: Use power queue to handle throttling etc.
//// Use observe to monitor changes and have it create tasks for the power queue
//// to perform.

/**
 * @public
 * @type Object
 */
FS.FileWorker = {};

var path = require('path');

var fs = require('fs');
/**
 * @method FS.FileWorker.observe
 * @public
 * @param {FS.Collection} fsCollection
 * @returns {undefined}
 *
 * Sets up observes on the fsCollection to store file copies and delete
 * temp files at the appropriate times.
 */


FS.FileWorker.observe = function (fsCollection) {// if (Meteor.settings.cfs && Meteor.settings.cfs.worker && Meteor.settings.cfs.worker.enabled) {
  //   // Initiate observe for finding newly uploaded/added files that need to be stored
  //   // per store.
  //   FS.Utility.each(fsCollection.options.stores, function (store) {
  //     var storeName = store.name;
  //     fsCollection.files.find(getReadyQuery(storeName), {
  //       fields: {
  //         copies: 0
  //       }
  //     }).observe({
  //       added: function (fsFile) {
  //         // added will catch fresh files
  //         FS.debug && console.log("FileWorker ADDED - calling saveCopy", storeName, "for", fsFile._id);
  //         saveCopy(fsFile, storeName);
  //       },
  //       changed: function (fsFile) {
  //         // changed will catch failures and retry them
  //         FS.debug && console.log("FileWorker CHANGED - calling saveCopy", storeName, "for", fsFile._id);
  //         saveCopy(fsFile, storeName);
  //       }
  //     });
  //   });
  //   // Initiate observe for finding files that have been stored so we can delete
  //   // any temp files
  //   fsCollection.files.find(getDoneQuery(fsCollection.options.stores)).observe({
  //     added: function (fsFile) {
  //       FS.debug && console.log("FileWorker ADDED - calling deleteChunks for", fsFile._id);
  //       FS.TempStore.removeFile(fsFile);
  //     }
  //   });
  // }
  // // Initiate observe for catching files that have been removed and
  // // removing the data from all stores as well
  // fsCollection.files.find().observe({
  //   removed: function(fsFile) {
  //     FS.debug && console.log('FileWorker REMOVED - removing all stored data for', fsFile._id);
  //     //remove from temp store
  //     FS.TempStore.removeFile(fsFile);
  //     //delete from all stores
  //     FS.Utility.each(fsCollection.options.stores, function(storage) {
  //       try {
  //         storage.adapter.remove(fsFile);
  //       } catch (e) {
  //         return
  //       }
  //     });
  //   }
  // });
};
/**
 *  @method getReadyQuery
 *  @private
 *  @param {string} storeName - The name of the store to observe
 *
 *  Returns a selector that will be used to identify files that
 *  have been uploaded but have not yet been stored to the
 *  specified store.
 *
 *  {
 *    uploadedAt: {$exists: true},
 *    'copies.storeName`: null,
 *    'failures.copies.storeName.doneTrying': {$ne: true}
 *  }
 */


function getReadyQuery(storeName) {
  var selector = {
    uploadedAt: {
      $exists: true
    }
  };
  selector['copies.' + storeName] = null;
  selector['failures.copies.' + storeName + '.doneTrying'] = {
    $ne: true
  };
  return selector;
}
/**
 *  @method getDoneQuery
 *  @private
 *  @param {Array} stores - The stores array from the FS.Collection options
 *
 *  Returns a selector that will be used to identify files where all
 *  stores have successfully save or have failed the
 *  max number of times but still have chunks. The resulting selector
 *  should be something like this:
 *
 *  {
 *    $and: [
 *      {chunks: {$exists: true}},
 *      {
 *        $or: [
 *          {
 *            $and: [
 *              {
 *                'copies.storeName': {$ne: null}
 *              },
 *              {
 *                'copies.storeName': {$ne: false}
 *              }
 *            ]
 *          },
 *          {
 *            'failures.copies.storeName.doneTrying': true
 *          }
 *        ]
 *      },
 *      REPEATED FOR EACH STORE
 *    ]
 *  }
 *
 */


function getDoneQuery(stores) {
  var selector = {
    $and: [{
      chunks: {
        $exists: true
      }
    }]
  }; // Add conditions for all defined stores

  FS.Utility.each(stores, function (store) {
    var storeName = store.name;
    var copyCond = {
      $or: [{
        $and: []
      }]
    };
    var tempCond = {};
    tempCond["copies." + storeName] = {
      $ne: null
    };
    copyCond.$or[0].$and.push(tempCond);
    tempCond = {};
    tempCond["copies." + storeName] = {
      $ne: false
    };
    copyCond.$or[0].$and.push(tempCond);
    tempCond = {};
    tempCond['failures.copies.' + storeName + '.doneTrying'] = true;
    copyCond.$or.push(tempCond);
    selector.$and.push(copyCond);
  });
  return selector;
}
/**
 * @method saveCopy
 * @private
 * @param {FS.File} fsFile
 * @param {string} storeName
 * @param {Object} options
 * @param {Boolean} [options.overwrite=false] - Force save to the specified store?
 * @returns {undefined}
 *
 * Saves to the specified store. If the
 * `overwrite` option is `true`, will save to the store even if we already
 * have, potentially overwriting any previously saved data. Synchronous.
 */


FS.FileWorker.saveCopy = function (fsFile, storeName, options) {
  options = options || {};
  var storage = FS.StorageAdapter(storeName);

  if (!storage) {
    throw new Error('No store named "' + storeName + '" exists');
  }

  FS.debug && console.log('saving to store ' + storeName);

  if (FS.TempStore.exists(fsFile)) {
    var temp_chunk = FS.TempStore.Tracker.findOne({
      fileId: fsFile._id
    });

    if (!temp_chunk || temp_chunk.is_saveCopy) {
      return;
    }

    var filepath = path.join(__meteor_bootstrap__.serverDir, '../../../cfs/files/_tempstore/' + temp_chunk.keys["0"]);

    if (fs.existsSync(filepath)) {
      var r = FS.TempStore.Tracker.update({
        fileId: fsFile._id,
        is_saveCopy: {
          $exists: false
        }
      }, {
        $set: {
          is_saveCopy: true
        }
      });

      if (r) {
        var writeStream = storage.adapter.createWriteStream(fsFile);
        var readStream = FS.TempStore.createReadStream(fsFile); // Pipe the temp data into the storage adapter

        readStream.pipe(writeStream);
      }
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:cfs-worker/fileWorker.js");

/* Exports */
Package._define("steedos:cfs-worker");

})();

//# sourceURL=meteor://💻app/packages/steedos_cfs-worker.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjZnMtd29ya2VyL2ZpbGVXb3JrZXIuanMiXSwibmFtZXMiOlsiRlMiLCJGaWxlV29ya2VyIiwicGF0aCIsInJlcXVpcmUiLCJmcyIsIm9ic2VydmUiLCJmc0NvbGxlY3Rpb24iLCJnZXRSZWFkeVF1ZXJ5Iiwic3RvcmVOYW1lIiwic2VsZWN0b3IiLCJ1cGxvYWRlZEF0IiwiJGV4aXN0cyIsIiRuZSIsImdldERvbmVRdWVyeSIsInN0b3JlcyIsIiRhbmQiLCJjaHVua3MiLCJVdGlsaXR5IiwiZWFjaCIsInN0b3JlIiwibmFtZSIsImNvcHlDb25kIiwiJG9yIiwidGVtcENvbmQiLCJwdXNoIiwic2F2ZUNvcHkiLCJmc0ZpbGUiLCJvcHRpb25zIiwic3RvcmFnZSIsIlN0b3JhZ2VBZGFwdGVyIiwiRXJyb3IiLCJkZWJ1ZyIsImNvbnNvbGUiLCJsb2ciLCJUZW1wU3RvcmUiLCJleGlzdHMiLCJ0ZW1wX2NodW5rIiwiVHJhY2tlciIsImZpbmRPbmUiLCJmaWxlSWQiLCJfaWQiLCJpc19zYXZlQ29weSIsImZpbGVwYXRoIiwiam9pbiIsIl9fbWV0ZW9yX2Jvb3RzdHJhcF9fIiwic2VydmVyRGlyIiwia2V5cyIsImV4aXN0c1N5bmMiLCJyIiwidXBkYXRlIiwiJHNldCIsIndyaXRlU3RyZWFtIiwiYWRhcHRlciIsImNyZWF0ZVdyaXRlU3RyZWFtIiwicmVhZFN0cmVhbSIsImNyZWF0ZVJlYWRTdHJlYW0iLCJwaXBlIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFDQTtBQUNBOztBQUVBOzs7O0FBSUFBLEVBQUUsQ0FBQ0MsVUFBSCxHQUFnQixFQUFoQjs7QUFDQSxJQUFJQyxJQUFJLEdBQUdDLE9BQU8sQ0FBQyxNQUFELENBQWxCOztBQUNBLElBQUlDLEVBQUUsR0FBR0QsT0FBTyxDQUFDLElBQUQsQ0FBaEI7QUFFQTs7Ozs7Ozs7Ozs7QUFTQUgsRUFBRSxDQUFDQyxVQUFILENBQWNJLE9BQWQsR0FBd0IsVUFBVUMsWUFBVixFQUF3QixDQUU5QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDRCxDQXRERDtBQXdEQTs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFlQSxTQUFTQyxhQUFULENBQXVCQyxTQUF2QixFQUFrQztBQUNoQyxNQUFJQyxRQUFRLEdBQUc7QUFDYkMsY0FBVSxFQUFFO0FBQ1ZDLGFBQU8sRUFBRTtBQURDO0FBREMsR0FBZjtBQUtBRixVQUFRLENBQUMsWUFBWUQsU0FBYixDQUFSLEdBQWtDLElBQWxDO0FBQ0FDLFVBQVEsQ0FBQyxxQkFBcUJELFNBQXJCLEdBQWlDLGFBQWxDLENBQVIsR0FBMkQ7QUFDekRJLE9BQUcsRUFBRTtBQURvRCxHQUEzRDtBQUdBLFNBQU9ILFFBQVA7QUFDRDtBQUVEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUNBLFNBQVNJLFlBQVQsQ0FBc0JDLE1BQXRCLEVBQThCO0FBQzVCLE1BQUlMLFFBQVEsR0FBRztBQUNiTSxRQUFJLEVBQUUsQ0FBQztBQUNMQyxZQUFNLEVBQUU7QUFDTkwsZUFBTyxFQUFFO0FBREg7QUFESCxLQUFEO0FBRE8sR0FBZixDQUQ0QixDQVM1Qjs7QUFDQVgsSUFBRSxDQUFDaUIsT0FBSCxDQUFXQyxJQUFYLENBQWdCSixNQUFoQixFQUF3QixVQUFVSyxLQUFWLEVBQWlCO0FBQ3ZDLFFBQUlYLFNBQVMsR0FBR1csS0FBSyxDQUFDQyxJQUF0QjtBQUNBLFFBQUlDLFFBQVEsR0FBRztBQUNiQyxTQUFHLEVBQUUsQ0FBQztBQUNKUCxZQUFJLEVBQUU7QUFERixPQUFEO0FBRFEsS0FBZjtBQUtBLFFBQUlRLFFBQVEsR0FBRyxFQUFmO0FBQ0FBLFlBQVEsQ0FBQyxZQUFZZixTQUFiLENBQVIsR0FBa0M7QUFDaENJLFNBQUcsRUFBRTtBQUQyQixLQUFsQztBQUdBUyxZQUFRLENBQUNDLEdBQVQsQ0FBYSxDQUFiLEVBQWdCUCxJQUFoQixDQUFxQlMsSUFBckIsQ0FBMEJELFFBQTFCO0FBQ0FBLFlBQVEsR0FBRyxFQUFYO0FBQ0FBLFlBQVEsQ0FBQyxZQUFZZixTQUFiLENBQVIsR0FBa0M7QUFDaENJLFNBQUcsRUFBRTtBQUQyQixLQUFsQztBQUdBUyxZQUFRLENBQUNDLEdBQVQsQ0FBYSxDQUFiLEVBQWdCUCxJQUFoQixDQUFxQlMsSUFBckIsQ0FBMEJELFFBQTFCO0FBQ0FBLFlBQVEsR0FBRyxFQUFYO0FBQ0FBLFlBQVEsQ0FBQyxxQkFBcUJmLFNBQXJCLEdBQWlDLGFBQWxDLENBQVIsR0FBMkQsSUFBM0Q7QUFDQWEsWUFBUSxDQUFDQyxHQUFULENBQWFFLElBQWIsQ0FBa0JELFFBQWxCO0FBQ0FkLFlBQVEsQ0FBQ00sSUFBVCxDQUFjUyxJQUFkLENBQW1CSCxRQUFuQjtBQUNELEdBckJEO0FBdUJBLFNBQU9aLFFBQVA7QUFDRDtBQUVEOzs7Ozs7Ozs7Ozs7Ozs7QUFhQVQsRUFBRSxDQUFDQyxVQUFILENBQWN3QixRQUFkLEdBQXlCLFVBQVVDLE1BQVYsRUFBa0JsQixTQUFsQixFQUE2Qm1CLE9BQTdCLEVBQXNDO0FBQzdEQSxTQUFPLEdBQUdBLE9BQU8sSUFBSSxFQUFyQjtBQUVBLE1BQUlDLE9BQU8sR0FBRzVCLEVBQUUsQ0FBQzZCLGNBQUgsQ0FBa0JyQixTQUFsQixDQUFkOztBQUNBLE1BQUksQ0FBQ29CLE9BQUwsRUFBYztBQUNaLFVBQU0sSUFBSUUsS0FBSixDQUFVLHFCQUFxQnRCLFNBQXJCLEdBQWlDLFVBQTNDLENBQU47QUFDRDs7QUFFRFIsSUFBRSxDQUFDK0IsS0FBSCxJQUFZQyxPQUFPLENBQUNDLEdBQVIsQ0FBWSxxQkFBcUJ6QixTQUFqQyxDQUFaOztBQUVBLE1BQUlSLEVBQUUsQ0FBQ2tDLFNBQUgsQ0FBYUMsTUFBYixDQUFvQlQsTUFBcEIsQ0FBSixFQUFpQztBQUMvQixRQUFJVSxVQUFVLEdBQUdwQyxFQUFFLENBQUNrQyxTQUFILENBQWFHLE9BQWIsQ0FBcUJDLE9BQXJCLENBQTZCO0FBQzVDQyxZQUFNLEVBQUViLE1BQU0sQ0FBQ2M7QUFENkIsS0FBN0IsQ0FBakI7O0FBR0EsUUFBSSxDQUFDSixVQUFELElBQWVBLFVBQVUsQ0FBQ0ssV0FBOUIsRUFBMkM7QUFDekM7QUFDRDs7QUFDRCxRQUFJQyxRQUFRLEdBQUd4QyxJQUFJLENBQUN5QyxJQUFMLENBQVVDLG9CQUFvQixDQUFDQyxTQUEvQixFQUEwQyxtQ0FBbUNULFVBQVUsQ0FBQ1UsSUFBWCxDQUFnQixHQUFoQixDQUE3RSxDQUFmOztBQUNBLFFBQUkxQyxFQUFFLENBQUMyQyxVQUFILENBQWNMLFFBQWQsQ0FBSixFQUE2QjtBQUMzQixVQUFJTSxDQUFDLEdBQUdoRCxFQUFFLENBQUNrQyxTQUFILENBQWFHLE9BQWIsQ0FBcUJZLE1BQXJCLENBQTRCO0FBQ2xDVixjQUFNLEVBQUViLE1BQU0sQ0FBQ2MsR0FEbUI7QUFFbENDLG1CQUFXLEVBQUU7QUFDWDlCLGlCQUFPLEVBQUU7QUFERTtBQUZxQixPQUE1QixFQUtMO0FBQ0R1QyxZQUFJLEVBQUU7QUFDSlQscUJBQVcsRUFBRTtBQURUO0FBREwsT0FMSyxDQUFSOztBQVVBLFVBQUlPLENBQUosRUFBTztBQUNMLFlBQUlHLFdBQVcsR0FBR3ZCLE9BQU8sQ0FBQ3dCLE9BQVIsQ0FBZ0JDLGlCQUFoQixDQUFrQzNCLE1BQWxDLENBQWxCO0FBQ0EsWUFBSTRCLFVBQVUsR0FBR3RELEVBQUUsQ0FBQ2tDLFNBQUgsQ0FBYXFCLGdCQUFiLENBQThCN0IsTUFBOUIsQ0FBakIsQ0FGSyxDQUdMOztBQUNBNEIsa0JBQVUsQ0FBQ0UsSUFBWCxDQUFnQkwsV0FBaEI7QUFDRDtBQUNGO0FBRUY7QUFDRixDQXRDRCxDIiwiZmlsZSI6Ii9wYWNrYWdlcy9zdGVlZG9zX2Nmcy13b3JrZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8vIFRPRE86IFVzZSBwb3dlciBxdWV1ZSB0byBoYW5kbGUgdGhyb3R0bGluZyBldGMuXHJcbi8vLy8gVXNlIG9ic2VydmUgdG8gbW9uaXRvciBjaGFuZ2VzIGFuZCBoYXZlIGl0IGNyZWF0ZSB0YXNrcyBmb3IgdGhlIHBvd2VyIHF1ZXVlXHJcbi8vLy8gdG8gcGVyZm9ybS5cclxuXHJcbi8qKlxyXG4gKiBAcHVibGljXHJcbiAqIEB0eXBlIE9iamVjdFxyXG4gKi9cclxuRlMuRmlsZVdvcmtlciA9IHt9O1xyXG52YXIgcGF0aCA9IHJlcXVpcmUoJ3BhdGgnKTtcclxudmFyIGZzID0gcmVxdWlyZSgnZnMnKTtcclxuXHJcbi8qKlxyXG4gKiBAbWV0aG9kIEZTLkZpbGVXb3JrZXIub2JzZXJ2ZVxyXG4gKiBAcHVibGljXHJcbiAqIEBwYXJhbSB7RlMuQ29sbGVjdGlvbn0gZnNDb2xsZWN0aW9uXHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqXHJcbiAqIFNldHMgdXAgb2JzZXJ2ZXMgb24gdGhlIGZzQ29sbGVjdGlvbiB0byBzdG9yZSBmaWxlIGNvcGllcyBhbmQgZGVsZXRlXHJcbiAqIHRlbXAgZmlsZXMgYXQgdGhlIGFwcHJvcHJpYXRlIHRpbWVzLlxyXG4gKi9cclxuRlMuRmlsZVdvcmtlci5vYnNlcnZlID0gZnVuY3Rpb24gKGZzQ29sbGVjdGlvbikge1xyXG5cclxuICAvLyBpZiAoTWV0ZW9yLnNldHRpbmdzLmNmcyAmJiBNZXRlb3Iuc2V0dGluZ3MuY2ZzLndvcmtlciAmJiBNZXRlb3Iuc2V0dGluZ3MuY2ZzLndvcmtlci5lbmFibGVkKSB7XHJcbiAgLy8gICAvLyBJbml0aWF0ZSBvYnNlcnZlIGZvciBmaW5kaW5nIG5ld2x5IHVwbG9hZGVkL2FkZGVkIGZpbGVzIHRoYXQgbmVlZCB0byBiZSBzdG9yZWRcclxuICAvLyAgIC8vIHBlciBzdG9yZS5cclxuICAvLyAgIEZTLlV0aWxpdHkuZWFjaChmc0NvbGxlY3Rpb24ub3B0aW9ucy5zdG9yZXMsIGZ1bmN0aW9uIChzdG9yZSkge1xyXG4gIC8vICAgICB2YXIgc3RvcmVOYW1lID0gc3RvcmUubmFtZTtcclxuICAvLyAgICAgZnNDb2xsZWN0aW9uLmZpbGVzLmZpbmQoZ2V0UmVhZHlRdWVyeShzdG9yZU5hbWUpLCB7XHJcbiAgLy8gICAgICAgZmllbGRzOiB7XHJcbiAgLy8gICAgICAgICBjb3BpZXM6IDBcclxuICAvLyAgICAgICB9XHJcbiAgLy8gICAgIH0pLm9ic2VydmUoe1xyXG4gIC8vICAgICAgIGFkZGVkOiBmdW5jdGlvbiAoZnNGaWxlKSB7XHJcbiAgLy8gICAgICAgICAvLyBhZGRlZCB3aWxsIGNhdGNoIGZyZXNoIGZpbGVzXHJcbiAgLy8gICAgICAgICBGUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZyhcIkZpbGVXb3JrZXIgQURERUQgLSBjYWxsaW5nIHNhdmVDb3B5XCIsIHN0b3JlTmFtZSwgXCJmb3JcIiwgZnNGaWxlLl9pZCk7XHJcbiAgLy8gICAgICAgICBzYXZlQ29weShmc0ZpbGUsIHN0b3JlTmFtZSk7XHJcbiAgLy8gICAgICAgfSxcclxuICAvLyAgICAgICBjaGFuZ2VkOiBmdW5jdGlvbiAoZnNGaWxlKSB7XHJcbiAgLy8gICAgICAgICAvLyBjaGFuZ2VkIHdpbGwgY2F0Y2ggZmFpbHVyZXMgYW5kIHJldHJ5IHRoZW1cclxuICAvLyAgICAgICAgIEZTLmRlYnVnICYmIGNvbnNvbGUubG9nKFwiRmlsZVdvcmtlciBDSEFOR0VEIC0gY2FsbGluZyBzYXZlQ29weVwiLCBzdG9yZU5hbWUsIFwiZm9yXCIsIGZzRmlsZS5faWQpO1xyXG4gIC8vICAgICAgICAgc2F2ZUNvcHkoZnNGaWxlLCBzdG9yZU5hbWUpO1xyXG4gIC8vICAgICAgIH1cclxuICAvLyAgICAgfSk7XHJcbiAgLy8gICB9KTtcclxuXHJcbiAgLy8gICAvLyBJbml0aWF0ZSBvYnNlcnZlIGZvciBmaW5kaW5nIGZpbGVzIHRoYXQgaGF2ZSBiZWVuIHN0b3JlZCBzbyB3ZSBjYW4gZGVsZXRlXHJcbiAgLy8gICAvLyBhbnkgdGVtcCBmaWxlc1xyXG4gIC8vICAgZnNDb2xsZWN0aW9uLmZpbGVzLmZpbmQoZ2V0RG9uZVF1ZXJ5KGZzQ29sbGVjdGlvbi5vcHRpb25zLnN0b3JlcykpLm9ic2VydmUoe1xyXG4gIC8vICAgICBhZGRlZDogZnVuY3Rpb24gKGZzRmlsZSkge1xyXG4gIC8vICAgICAgIEZTLmRlYnVnICYmIGNvbnNvbGUubG9nKFwiRmlsZVdvcmtlciBBRERFRCAtIGNhbGxpbmcgZGVsZXRlQ2h1bmtzIGZvclwiLCBmc0ZpbGUuX2lkKTtcclxuICAvLyAgICAgICBGUy5UZW1wU3RvcmUucmVtb3ZlRmlsZShmc0ZpbGUpO1xyXG4gIC8vICAgICB9XHJcbiAgLy8gICB9KTtcclxuICAvLyB9XHJcblxyXG5cclxuXHJcbiAgLy8gLy8gSW5pdGlhdGUgb2JzZXJ2ZSBmb3IgY2F0Y2hpbmcgZmlsZXMgdGhhdCBoYXZlIGJlZW4gcmVtb3ZlZCBhbmRcclxuICAvLyAvLyByZW1vdmluZyB0aGUgZGF0YSBmcm9tIGFsbCBzdG9yZXMgYXMgd2VsbFxyXG4gIC8vIGZzQ29sbGVjdGlvbi5maWxlcy5maW5kKCkub2JzZXJ2ZSh7XHJcbiAgLy8gICByZW1vdmVkOiBmdW5jdGlvbihmc0ZpbGUpIHtcclxuICAvLyAgICAgRlMuZGVidWcgJiYgY29uc29sZS5sb2coJ0ZpbGVXb3JrZXIgUkVNT1ZFRCAtIHJlbW92aW5nIGFsbCBzdG9yZWQgZGF0YSBmb3InLCBmc0ZpbGUuX2lkKTtcclxuICAvLyAgICAgLy9yZW1vdmUgZnJvbSB0ZW1wIHN0b3JlXHJcbiAgLy8gICAgIEZTLlRlbXBTdG9yZS5yZW1vdmVGaWxlKGZzRmlsZSk7XHJcbiAgLy8gICAgIC8vZGVsZXRlIGZyb20gYWxsIHN0b3Jlc1xyXG4gIC8vICAgICBGUy5VdGlsaXR5LmVhY2goZnNDb2xsZWN0aW9uLm9wdGlvbnMuc3RvcmVzLCBmdW5jdGlvbihzdG9yYWdlKSB7XHJcbiAgLy8gICAgICAgdHJ5IHtcclxuICAvLyAgICAgICAgIHN0b3JhZ2UuYWRhcHRlci5yZW1vdmUoZnNGaWxlKTtcclxuICAvLyAgICAgICB9IGNhdGNoIChlKSB7XHJcbiAgLy8gICAgICAgICByZXR1cm5cclxuICAvLyAgICAgICB9XHJcbiAgLy8gICAgIH0pO1xyXG4gIC8vICAgfVxyXG4gIC8vIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqICBAbWV0aG9kIGdldFJlYWR5UXVlcnlcclxuICogIEBwcml2YXRlXHJcbiAqICBAcGFyYW0ge3N0cmluZ30gc3RvcmVOYW1lIC0gVGhlIG5hbWUgb2YgdGhlIHN0b3JlIHRvIG9ic2VydmVcclxuICpcclxuICogIFJldHVybnMgYSBzZWxlY3RvciB0aGF0IHdpbGwgYmUgdXNlZCB0byBpZGVudGlmeSBmaWxlcyB0aGF0XHJcbiAqICBoYXZlIGJlZW4gdXBsb2FkZWQgYnV0IGhhdmUgbm90IHlldCBiZWVuIHN0b3JlZCB0byB0aGVcclxuICogIHNwZWNpZmllZCBzdG9yZS5cclxuICpcclxuICogIHtcclxuICogICAgdXBsb2FkZWRBdDogeyRleGlzdHM6IHRydWV9LFxyXG4gKiAgICAnY29waWVzLnN0b3JlTmFtZWA6IG51bGwsXHJcbiAqICAgICdmYWlsdXJlcy5jb3BpZXMuc3RvcmVOYW1lLmRvbmVUcnlpbmcnOiB7JG5lOiB0cnVlfVxyXG4gKiAgfVxyXG4gKi9cclxuZnVuY3Rpb24gZ2V0UmVhZHlRdWVyeShzdG9yZU5hbWUpIHtcclxuICB2YXIgc2VsZWN0b3IgPSB7XHJcbiAgICB1cGxvYWRlZEF0OiB7XHJcbiAgICAgICRleGlzdHM6IHRydWVcclxuICAgIH1cclxuICB9O1xyXG4gIHNlbGVjdG9yWydjb3BpZXMuJyArIHN0b3JlTmFtZV0gPSBudWxsO1xyXG4gIHNlbGVjdG9yWydmYWlsdXJlcy5jb3BpZXMuJyArIHN0b3JlTmFtZSArICcuZG9uZVRyeWluZyddID0ge1xyXG4gICAgJG5lOiB0cnVlXHJcbiAgfTtcclxuICByZXR1cm4gc2VsZWN0b3I7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiAgQG1ldGhvZCBnZXREb25lUXVlcnlcclxuICogIEBwcml2YXRlXHJcbiAqICBAcGFyYW0ge0FycmF5fSBzdG9yZXMgLSBUaGUgc3RvcmVzIGFycmF5IGZyb20gdGhlIEZTLkNvbGxlY3Rpb24gb3B0aW9uc1xyXG4gKlxyXG4gKiAgUmV0dXJucyBhIHNlbGVjdG9yIHRoYXQgd2lsbCBiZSB1c2VkIHRvIGlkZW50aWZ5IGZpbGVzIHdoZXJlIGFsbFxyXG4gKiAgc3RvcmVzIGhhdmUgc3VjY2Vzc2Z1bGx5IHNhdmUgb3IgaGF2ZSBmYWlsZWQgdGhlXHJcbiAqICBtYXggbnVtYmVyIG9mIHRpbWVzIGJ1dCBzdGlsbCBoYXZlIGNodW5rcy4gVGhlIHJlc3VsdGluZyBzZWxlY3RvclxyXG4gKiAgc2hvdWxkIGJlIHNvbWV0aGluZyBsaWtlIHRoaXM6XHJcbiAqXHJcbiAqICB7XHJcbiAqICAgICRhbmQ6IFtcclxuICogICAgICB7Y2h1bmtzOiB7JGV4aXN0czogdHJ1ZX19LFxyXG4gKiAgICAgIHtcclxuICogICAgICAgICRvcjogW1xyXG4gKiAgICAgICAgICB7XHJcbiAqICAgICAgICAgICAgJGFuZDogW1xyXG4gKiAgICAgICAgICAgICAge1xyXG4gKiAgICAgICAgICAgICAgICAnY29waWVzLnN0b3JlTmFtZSc6IHskbmU6IG51bGx9XHJcbiAqICAgICAgICAgICAgICB9LFxyXG4gKiAgICAgICAgICAgICAge1xyXG4gKiAgICAgICAgICAgICAgICAnY29waWVzLnN0b3JlTmFtZSc6IHskbmU6IGZhbHNlfVxyXG4gKiAgICAgICAgICAgICAgfVxyXG4gKiAgICAgICAgICAgIF1cclxuICogICAgICAgICAgfSxcclxuICogICAgICAgICAge1xyXG4gKiAgICAgICAgICAgICdmYWlsdXJlcy5jb3BpZXMuc3RvcmVOYW1lLmRvbmVUcnlpbmcnOiB0cnVlXHJcbiAqICAgICAgICAgIH1cclxuICogICAgICAgIF1cclxuICogICAgICB9LFxyXG4gKiAgICAgIFJFUEVBVEVEIEZPUiBFQUNIIFNUT1JFXHJcbiAqICAgIF1cclxuICogIH1cclxuICpcclxuICovXHJcbmZ1bmN0aW9uIGdldERvbmVRdWVyeShzdG9yZXMpIHtcclxuICB2YXIgc2VsZWN0b3IgPSB7XHJcbiAgICAkYW5kOiBbe1xyXG4gICAgICBjaHVua3M6IHtcclxuICAgICAgICAkZXhpc3RzOiB0cnVlXHJcbiAgICAgIH1cclxuICAgIH1dXHJcbiAgfTtcclxuXHJcbiAgLy8gQWRkIGNvbmRpdGlvbnMgZm9yIGFsbCBkZWZpbmVkIHN0b3Jlc1xyXG4gIEZTLlV0aWxpdHkuZWFjaChzdG9yZXMsIGZ1bmN0aW9uIChzdG9yZSkge1xyXG4gICAgdmFyIHN0b3JlTmFtZSA9IHN0b3JlLm5hbWU7XHJcbiAgICB2YXIgY29weUNvbmQgPSB7XHJcbiAgICAgICRvcjogW3tcclxuICAgICAgICAkYW5kOiBbXVxyXG4gICAgICB9XVxyXG4gICAgfTtcclxuICAgIHZhciB0ZW1wQ29uZCA9IHt9O1xyXG4gICAgdGVtcENvbmRbXCJjb3BpZXMuXCIgKyBzdG9yZU5hbWVdID0ge1xyXG4gICAgICAkbmU6IG51bGxcclxuICAgIH07XHJcbiAgICBjb3B5Q29uZC4kb3JbMF0uJGFuZC5wdXNoKHRlbXBDb25kKTtcclxuICAgIHRlbXBDb25kID0ge307XHJcbiAgICB0ZW1wQ29uZFtcImNvcGllcy5cIiArIHN0b3JlTmFtZV0gPSB7XHJcbiAgICAgICRuZTogZmFsc2VcclxuICAgIH07XHJcbiAgICBjb3B5Q29uZC4kb3JbMF0uJGFuZC5wdXNoKHRlbXBDb25kKTtcclxuICAgIHRlbXBDb25kID0ge307XHJcbiAgICB0ZW1wQ29uZFsnZmFpbHVyZXMuY29waWVzLicgKyBzdG9yZU5hbWUgKyAnLmRvbmVUcnlpbmcnXSA9IHRydWU7XHJcbiAgICBjb3B5Q29uZC4kb3IucHVzaCh0ZW1wQ29uZCk7XHJcbiAgICBzZWxlY3Rvci4kYW5kLnB1c2goY29weUNvbmQpO1xyXG4gIH0pXHJcblxyXG4gIHJldHVybiBzZWxlY3RvcjtcclxufVxyXG5cclxuLyoqXHJcbiAqIEBtZXRob2Qgc2F2ZUNvcHlcclxuICogQHByaXZhdGVcclxuICogQHBhcmFtIHtGUy5GaWxlfSBmc0ZpbGVcclxuICogQHBhcmFtIHtzdHJpbmd9IHN0b3JlTmFtZVxyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IFtvcHRpb25zLm92ZXJ3cml0ZT1mYWxzZV0gLSBGb3JjZSBzYXZlIHRvIHRoZSBzcGVjaWZpZWQgc3RvcmU/XHJcbiAqIEByZXR1cm5zIHt1bmRlZmluZWR9XHJcbiAqXHJcbiAqIFNhdmVzIHRvIHRoZSBzcGVjaWZpZWQgc3RvcmUuIElmIHRoZVxyXG4gKiBgb3ZlcndyaXRlYCBvcHRpb24gaXMgYHRydWVgLCB3aWxsIHNhdmUgdG8gdGhlIHN0b3JlIGV2ZW4gaWYgd2UgYWxyZWFkeVxyXG4gKiBoYXZlLCBwb3RlbnRpYWxseSBvdmVyd3JpdGluZyBhbnkgcHJldmlvdXNseSBzYXZlZCBkYXRhLiBTeW5jaHJvbm91cy5cclxuICovXHJcbkZTLkZpbGVXb3JrZXIuc2F2ZUNvcHkgPSBmdW5jdGlvbiAoZnNGaWxlLCBzdG9yZU5hbWUsIG9wdGlvbnMpIHtcclxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgdmFyIHN0b3JhZ2UgPSBGUy5TdG9yYWdlQWRhcHRlcihzdG9yZU5hbWUpO1xyXG4gIGlmICghc3RvcmFnZSkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdObyBzdG9yZSBuYW1lZCBcIicgKyBzdG9yZU5hbWUgKyAnXCIgZXhpc3RzJyk7XHJcbiAgfVxyXG5cclxuICBGUy5kZWJ1ZyAmJiBjb25zb2xlLmxvZygnc2F2aW5nIHRvIHN0b3JlICcgKyBzdG9yZU5hbWUpO1xyXG5cclxuICBpZiAoRlMuVGVtcFN0b3JlLmV4aXN0cyhmc0ZpbGUpKSB7XHJcbiAgICB2YXIgdGVtcF9jaHVuayA9IEZTLlRlbXBTdG9yZS5UcmFja2VyLmZpbmRPbmUoe1xyXG4gICAgICBmaWxlSWQ6IGZzRmlsZS5faWRcclxuICAgIH0pO1xyXG4gICAgaWYgKCF0ZW1wX2NodW5rIHx8IHRlbXBfY2h1bmsuaXNfc2F2ZUNvcHkpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgdmFyIGZpbGVwYXRoID0gcGF0aC5qb2luKF9fbWV0ZW9yX2Jvb3RzdHJhcF9fLnNlcnZlckRpciwgJy4uLy4uLy4uL2Nmcy9maWxlcy9fdGVtcHN0b3JlLycgKyB0ZW1wX2NodW5rLmtleXNbXCIwXCJdKTtcclxuICAgIGlmIChmcy5leGlzdHNTeW5jKGZpbGVwYXRoKSkge1xyXG4gICAgICB2YXIgciA9IEZTLlRlbXBTdG9yZS5UcmFja2VyLnVwZGF0ZSh7XHJcbiAgICAgICAgZmlsZUlkOiBmc0ZpbGUuX2lkLFxyXG4gICAgICAgIGlzX3NhdmVDb3B5OiB7XHJcbiAgICAgICAgICAkZXhpc3RzOiBmYWxzZVxyXG4gICAgICAgIH1cclxuICAgICAgfSwge1xyXG4gICAgICAgICRzZXQ6IHtcclxuICAgICAgICAgIGlzX3NhdmVDb3B5OiB0cnVlXHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgaWYgKHIpIHtcclxuICAgICAgICB2YXIgd3JpdGVTdHJlYW0gPSBzdG9yYWdlLmFkYXB0ZXIuY3JlYXRlV3JpdGVTdHJlYW0oZnNGaWxlKTtcclxuICAgICAgICB2YXIgcmVhZFN0cmVhbSA9IEZTLlRlbXBTdG9yZS5jcmVhdGVSZWFkU3RyZWFtKGZzRmlsZSk7XHJcbiAgICAgICAgLy8gUGlwZSB0aGUgdGVtcCBkYXRhIGludG8gdGhlIHN0b3JhZ2UgYWRhcHRlclxyXG4gICAgICAgIHJlYWRTdHJlYW0ucGlwZSh3cml0ZVN0cmVhbSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgfVxyXG59Il19
