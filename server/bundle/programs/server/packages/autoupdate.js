(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var Autoupdate;

var require = meteorInstall({"node_modules":{"meteor":{"autoupdate":{"autoupdate_server.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/autoupdate/autoupdate_server.js                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread"));

module.export({
  Autoupdate: () => Autoupdate
});
let onMessage;
module.link("meteor/inter-process-messaging", {
  onMessage(v) {
    onMessage = v;
  }

}, 0);

// Publish the current client versions for each client architecture
// (web.browser, web.browser.legacy, web.cordova). When a client observes
// a change in the versions associated with its client architecture,
// it will refresh itself, either by swapping out CSS assets or by
// reloading the page.
//
// There are three versions for any given client architecture: `version`,
// `versionRefreshable`, and `versionNonRefreshable`. The refreshable
// version is a hash of just the client resources that are refreshable,
// such as CSS, while the non-refreshable version is a hash of the rest of
// the client assets, excluding the refreshable ones: HTML, JS, and static
// files in the `public` directory. The `version` version is a combined
// hash of everything.
//
// If the environment variable `AUTOUPDATE_VERSION` is set, it will be
// used in place of all client versions. You can use this variable to
// control when the client reloads. For example, if you want to force a
// reload only after major changes, use a custom AUTOUPDATE_VERSION and
// change it only when something worth pushing to clients happens.
//
// The server publishes a `meteor_autoupdate_clientVersions` collection.
// The ID of each document is the client architecture, and the fields of
// the document are the versions described above.
var Future = Npm.require("fibers/future");

const Autoupdate = __meteor_runtime_config__.autoupdate = {
  // Map from client architectures (web.browser, web.browser.legacy,
  // web.cordova) to version fields { version, versionRefreshable,
  // versionNonRefreshable, refreshable } that will be stored in
  // ClientVersions documents (whose IDs are client architectures). This
  // data gets serialized into the boilerplate because it's stored in
  // __meteor_runtime_config__.autoupdate.versions.
  versions: {}
};
// The collection of acceptable client versions.
const ClientVersions = new Mongo.Collection("meteor_autoupdate_clientVersions", {
  connection: null
}); // The client hash includes __meteor_runtime_config__, so wait until
// all packages have loaded and have had a chance to populate the
// runtime config before using the client hash as our default auto
// update version id.
// Note: Tests allow people to override Autoupdate.autoupdateVersion before
// startup.

Autoupdate.autoupdateVersion = null;
Autoupdate.autoupdateVersionRefreshable = null;
Autoupdate.autoupdateVersionCordova = null;
Autoupdate.appId = __meteor_runtime_config__.appId = process.env.APP_ID;
var syncQueue = new Meteor._SynchronousQueue();

function updateVersions(shouldReloadClientProgram) {
  // Step 1: load the current client program on the server
  if (shouldReloadClientProgram) {
    WebAppInternals.reloadClientPrograms();
  }

  const {
    // If the AUTOUPDATE_VERSION environment variable is defined, it takes
    // precedence, but Autoupdate.autoupdateVersion is still supported as
    // a fallback. In most cases neither of these values will be defined.
    AUTOUPDATE_VERSION = Autoupdate.autoupdateVersion
  } = process.env; // Step 2: update __meteor_runtime_config__.autoupdate.versions.

  const clientArchs = Object.keys(WebApp.clientPrograms);
  clientArchs.forEach(arch => {
    Autoupdate.versions[arch] = {
      version: AUTOUPDATE_VERSION || WebApp.calculateClientHash(arch),
      versionRefreshable: AUTOUPDATE_VERSION || WebApp.calculateClientHashRefreshable(arch),
      versionNonRefreshable: AUTOUPDATE_VERSION || WebApp.calculateClientHashNonRefreshable(arch)
    };
  }); // Step 3: form the new client boilerplate which contains the updated
  // assets and __meteor_runtime_config__.

  if (shouldReloadClientProgram) {
    WebAppInternals.generateBoilerplate();
  } // Step 4: update the ClientVersions collection.
  // We use `onListening` here because we need to use
  // `WebApp.getRefreshableAssets`, which is only set after
  // `WebApp.generateBoilerplate` is called by `main` in webapp.


  WebApp.onListening(() => {
    clientArchs.forEach(arch => {
      const payload = (0, _objectSpread2.default)({}, Autoupdate.versions[arch], {
        assets: WebApp.getRefreshableAssets(arch)
      });

      if (!ClientVersions.findOne({
        _id: arch
      })) {
        ClientVersions.insert((0, _objectSpread2.default)({
          _id: arch
        }, payload));
      } else {
        ClientVersions.update(arch, {
          $set: payload
        });
      }
    });
  });
}

Meteor.publish("meteor_autoupdate_clientVersions", function (appId) {
  // `null` happens when a client doesn't have an appId and passes
  // `undefined` to `Meteor.subscribe`. `undefined` is translated to
  // `null` as JSON doesn't have `undefined.
  check(appId, Match.OneOf(String, undefined, null)); // // Don't notify clients using wrong appId such as mobile apps built with a
  // // different server but pointing at the same local url
  // if (Autoupdate.appId && appId && Autoupdate.appId !== appId)
  //   return [];

  return ClientVersions.find();
}, {
  is_auto: true
});
Meteor.startup(function () {
  updateVersions(false); // Force any connected clients that are still looking for these older
  // document IDs to reload.

  ["version", "version-refreshable", "version-cordova"].forEach(_id => {
    ClientVersions.upsert(_id, {
      $set: {
        version: "outdated"
      }
    });
  });
});
var fut = new Future(); // We only want 'refresh' to trigger 'updateVersions' AFTER onListen,
// so we add a queued task that waits for onListen before 'refresh' can queue
// tasks. Note that the `onListening` callbacks do not fire until after
// Meteor.startup, so there is no concern that the 'updateVersions' calls from
// 'refresh' will overlap with the `updateVersions` call from Meteor.startup.

syncQueue.queueTask(function () {
  fut.wait();
});
WebApp.onListening(function () {
  fut.return();
});

function enqueueVersionsRefresh() {
  syncQueue.queueTask(function () {
    updateVersions(true);
  });
} // Listen for messages pertaining to the client-refresh topic.


onMessage("client-refresh", enqueueVersionsRefresh); // Another way to tell the process to refresh: send SIGHUP signal

process.on('SIGHUP', Meteor.bindEnvironment(function () {
  enqueueVersionsRefresh();
}, "handling SIGHUP signal for refresh"));
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

var exports = require("/node_modules/meteor/autoupdate/autoupdate_server.js");

/* Exports */
Package._define("autoupdate", exports, {
  Autoupdate: Autoupdate
});

})();

//# sourceURL=meteor://💻app/packages/autoupdate.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYXV0b3VwZGF0ZS9hdXRvdXBkYXRlX3NlcnZlci5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJBdXRvdXBkYXRlIiwib25NZXNzYWdlIiwibGluayIsInYiLCJGdXR1cmUiLCJOcG0iLCJyZXF1aXJlIiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsImF1dG91cGRhdGUiLCJ2ZXJzaW9ucyIsIkNsaWVudFZlcnNpb25zIiwiTW9uZ28iLCJDb2xsZWN0aW9uIiwiY29ubmVjdGlvbiIsImF1dG91cGRhdGVWZXJzaW9uIiwiYXV0b3VwZGF0ZVZlcnNpb25SZWZyZXNoYWJsZSIsImF1dG91cGRhdGVWZXJzaW9uQ29yZG92YSIsImFwcElkIiwicHJvY2VzcyIsImVudiIsIkFQUF9JRCIsInN5bmNRdWV1ZSIsIk1ldGVvciIsIl9TeW5jaHJvbm91c1F1ZXVlIiwidXBkYXRlVmVyc2lvbnMiLCJzaG91bGRSZWxvYWRDbGllbnRQcm9ncmFtIiwiV2ViQXBwSW50ZXJuYWxzIiwicmVsb2FkQ2xpZW50UHJvZ3JhbXMiLCJBVVRPVVBEQVRFX1ZFUlNJT04iLCJjbGllbnRBcmNocyIsIk9iamVjdCIsImtleXMiLCJXZWJBcHAiLCJjbGllbnRQcm9ncmFtcyIsImZvckVhY2giLCJhcmNoIiwidmVyc2lvbiIsImNhbGN1bGF0ZUNsaWVudEhhc2giLCJ2ZXJzaW9uUmVmcmVzaGFibGUiLCJjYWxjdWxhdGVDbGllbnRIYXNoUmVmcmVzaGFibGUiLCJ2ZXJzaW9uTm9uUmVmcmVzaGFibGUiLCJjYWxjdWxhdGVDbGllbnRIYXNoTm9uUmVmcmVzaGFibGUiLCJnZW5lcmF0ZUJvaWxlcnBsYXRlIiwib25MaXN0ZW5pbmciLCJwYXlsb2FkIiwiYXNzZXRzIiwiZ2V0UmVmcmVzaGFibGVBc3NldHMiLCJmaW5kT25lIiwiX2lkIiwiaW5zZXJ0IiwidXBkYXRlIiwiJHNldCIsInB1Ymxpc2giLCJjaGVjayIsIk1hdGNoIiwiT25lT2YiLCJTdHJpbmciLCJ1bmRlZmluZWQiLCJmaW5kIiwiaXNfYXV0byIsInN0YXJ0dXAiLCJ1cHNlcnQiLCJmdXQiLCJxdWV1ZVRhc2siLCJ3YWl0IiwicmV0dXJuIiwiZW5xdWV1ZVZlcnNpb25zUmVmcmVzaCIsIm9uIiwiYmluZEVudmlyb25tZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUFDQyxZQUFVLEVBQUMsTUFBSUE7QUFBaEIsQ0FBZDtBQUEyQyxJQUFJQyxTQUFKO0FBQWNILE1BQU0sQ0FBQ0ksSUFBUCxDQUFZLGdDQUFaLEVBQTZDO0FBQUNELFdBQVMsQ0FBQ0UsQ0FBRCxFQUFHO0FBQUNGLGFBQVMsR0FBQ0UsQ0FBVjtBQUFZOztBQUExQixDQUE3QyxFQUF5RSxDQUF6RTs7QUFBekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBLElBQUlDLE1BQU0sR0FBR0MsR0FBRyxDQUFDQyxPQUFKLENBQVksZUFBWixDQUFiOztBQUVPLE1BQU1OLFVBQVUsR0FBR08seUJBQXlCLENBQUNDLFVBQTFCLEdBQXVDO0FBQy9EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBQyxVQUFRLEVBQUU7QUFQcUQsQ0FBMUQ7QUFVUDtBQUNBLE1BQU1DLGNBQWMsR0FDbEIsSUFBSUMsS0FBSyxDQUFDQyxVQUFWLENBQXFCLGtDQUFyQixFQUF5RDtBQUN2REMsWUFBVSxFQUFFO0FBRDJDLENBQXpELENBREYsQyxDQUtBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTs7QUFDQWIsVUFBVSxDQUFDYyxpQkFBWCxHQUErQixJQUEvQjtBQUNBZCxVQUFVLENBQUNlLDRCQUFYLEdBQTBDLElBQTFDO0FBQ0FmLFVBQVUsQ0FBQ2dCLHdCQUFYLEdBQXND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SUFBSTBCLEdBQUcsR0FBRyxJQUFJMUQsTUFBSixFQUFWLEMsQ0FFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBaUIsU0FBUyxDQUFDMEMsU0FBVixDQUFvQixZQUFZO0FBQzlCRCxLQUFHLENBQUNFLElBQUo7QUFDRCxDQUZEO0FBSUFoQyxNQUFNLENBQUNXLFdBQVAsQ0FBbUIsWUFBWTtBQUM3Qm1CLEtBQUcsQ0FBQ0csTUFBSjtBQUNELENBRkQ7O0FBSUEsU0FBU0Msc0JBQVQsR0FBa0M7QUFDaEM3QyxXQUFTLENBQUMwQyxTQUFWLENBQW9CLFlBQVk7QUFDOUJ2QyxrQkFBYyxDQUFDLElBQUQsQ0FBZDtBQUNELEdBRkQ7QUFHRCxDLENBRUQ7OztBQUVBdkIsU0FBUyxDQUFDLGdCQUFELEVBQW1CaUUsc0JBQW5CLENBQVQsQyxDQUVBOztBQUNBaEQsT0FBTyxDQUFDaUQsRUFBUixDQUFXLFFBQVgsRUFBcUI3QyxNQUFNLENBQUM4QyxlQUFQLENBQXVCLFlBQVk7QUFDdERGLHdCQUFzQjtBQUN2QixDQUZvQixFQUVsQixvQ0FGa0IsQ0FBckIsRSIsImZpbGUiOiIvcGFja2FnZXMvYXV0b3VwZGF0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFB1Ymxpc2ggdGhlIGN1cnJlbnQgY2xpZW50IHZlcnNpb25zIGZvciBlYWNoIGNsaWVudCBhcmNoaXRlY3R1cmVcbi8vICh3ZWIuYnJvd3Nlciwgd2ViLmJyb3dzZXIubGVnYWN5LCB3ZWIuY29yZG92YSkuIFdoZW4gYSBjbGllbnQgb2JzZXJ2ZXNcbi8vIGEgY2hhbmdlIGluIHRoZSB2ZXJzaW9ucyBhc3NvY2lhdGVkIHdpdGggaXRzIGNsaWVudCBhcmNoaXRlY3R1cmUsXG4vLyBpdCB3aWxsIHJlZnJlc2ggaXRzZWxmLCBlaXRoZXIgYnkgc3dhcHBpbmcgb3V0IENTUyBhc3NldHMgb3IgYnlcbi8vIHJlbG9hZGluZyB0aGUgcGFnZS5cbi8vXG4vLyBUaGVyZSBhcmUgdGhyZWUgdmVyc2lvbnMgZm9yIGFueSBnaXZlbiBjbGllbnQgYXJjaGl0ZWN0dXJlOiBgdmVyc2lvbmAsXG4vLyBgdmVyc2lvblJlZnJlc2hhYmxlYCwgYW5kIGB2ZXJzaW9uTm9uUmVmcmVzaGFibGVgLiBUaGUgcmVmcmVzaGFibGVcbi8vIHZlcnNpb24gaXMgYSBoYXNoIG9mIGp1c3QgdGhlIGNsaWVudCByZXNvdXJjZXMgdGhhdCBhcmUgcmVmcmVzaGFibGUsXG4vLyBzdWNoIGFzIENTUywgd2hpbGUgdGhlIG5vbi1yZWZyZXNoYWJsZSB2ZXJzaW9uIGlzIGEgaGFzaCBvZiB0aGUgcmVzdCBvZlxuLy8gdGhlIGNsaWVudCBhc3NldHMsIGV4Y2x1ZGluZyB0aGUgcmVmcmVzaGFibGUgb25lczogSFRNTCwgSlMsIGFuZCBzdGF0aWNcbi8vIGZpbGVzIGluIHRoZSBgcHVibGljYCBkaXJlY3RvcnkuIFRoZSBgdmVyc2lvbmAgdmVyc2lvbiBpcyBhIGNvbWJpbmVkXG4vLyBoYXNoIG9mIGV2ZXJ5dGhpbmcuXG4vL1xuLy8gSWYgdGhlIGVudmlyb25tZW50IHZhcmlhYmxlIGBBVVRPVVBEQVRFX1ZFUlNJT05gIGlzIHNldCwgaXQgd2lsbCBiZVxuLy8gdXNlZCBpbiBwbGFjZSBvZiBhbGwgY2xpZW50IHZlcnNpb25zLiBZb3UgY2FuIHVzZSB0aGlzIHZhcmlhYmxlIHRvXG4vLyBjb250cm9sIHdoZW4gdGhlIGNsaWVudCByZWxvYWRzLiBGb3IgZXhhbXBsZSwgaWYgeW91IHdhbnQgdG8gZm9yY2UgYVxuLy8gcmVsb2FkIG9ubHkgYWZ0ZXIgbWFqb3IgY2hhbmdlcywgdXNlIGEgY3VzdG9tIEFVVE9VUERBVEVfVkVSU0lPTiBhbmRcbi8vIGNoYW5nZSBpdCBvbmx5IHdoZW4gc29tZXRoaW5nIHdvcnRoIHB1c2hpbmcgdG8gY2xpZW50cyBoYXBwZW5zLlxuLy9cbi8vIFRoZSBzZXJ2ZXIgcHVibGlzaGVzIGEgYG1ldGVvcl9hdXRvdXBkYXRlX2NsaWVudFZlcnNpb25zYCBjb2xsZWN0aW9uLlxuLy8gVGhlIElEIG9mIGVhY2ggZG9jdW1lbnQgaXMgdGhlIGNsaWVudCBhcmNoaXRlY3R1cmUsIGFuZCB0aGUgZmllbGRzIG9mXG4vLyB0aGUgZG9jdW1lbnQgYXJlIHRoZSB2ZXJzaW9ucyBkZXNjcmliZWQgYWJvdmUuXG5cbnZhciBGdXR1cmUgPSBOcG0ucmVxdWlyZShcImZpYmVycy9mdXR1cmVcIik7XG5cbmV4cG9ydCBjb25zdCBBdXRvdXBkYXRlID0gX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5hdXRvdXBkYXRlID0ge1xuICAvLyBNYXAgZnJvbSBjbGllbnQgYXJjaGl0ZWN0dXJlcyAod2ViLmJyb3dzZXIsIHdlYi5icm93c2VyLmxlZ2FjeSxcbiAgLy8gd2ViLmNvcmRvdmEpIHRvIHZlcnNpb24gZmllbGRzIHsgdmVyc2lvbiwgdmVyc2lvblJlZnJlc2hhYmxlLFxuICAvLyB2ZXJzaW9uTm9uUmVmcmVzaGFibGUsIHJlZnJlc2hhYmxlIH0gdGhhdCB3aWxsIGJlIHN0b3JlZCBpblxuICAvLyBDbGllbnRWZXJzaW9ucyBkb2N1bWVudHMgKHdob3NlIElEcyBhcmUgY2xpZW50IGFyY2hpdGVjdHVyZXMpLiBUaGlzXG4gIC8vIGRhdGEgZ2V0cyBzZXJpYWxpemVkIGludG8gdGhlIGJvaWxlcnBsYXRlIGJlY2F1c2UgaXQncyBzdG9yZWQgaW5cbiAgLy8gX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5hdXRvdXBkYXRlLnZlcnNpb25zLlxuICB2ZXJzaW9uczoge31cbn07XG5cbi8vIFRoZSBjb2xsZWN0aW9uIG9mIGFjY2VwdGFibGUgY2xpZW50IHZlcnNpb25zLlxuY29uc3QgQ2xpZW50VmVyc2lvbnMgPVxuICBuZXcgTW9uZ28uQ29sbGVjdGlvbihcIm1ldGVvcl9hdXRvdXBkYXRlX2NsaWVudFZlcnNpb25zXCIsIHtcbiAgICBjb25uZWN0aW9uOiBudWxsXG4gIH0pO1xuXG4vLyBUaGUgY2xpZW50IGhhc2ggaW5jbHVkZXMgX19tZXRlb3JfcnVudGltZV9jb25maWdfXywgc28gd2FpdCB1bnRpbFxuLy8gYWxsIHBhY2thZ2VzIGhhdmUgbG9hZGVkIGFuZCBoYXZlIGhhZCBhIGNoYW5jZSB0byBwb3B1bGF0ZSB0aGVcbi8vIHJ1bnRpbWUgY29uZmlnIGJlZm9yZSB1c2luZyB0aGUgY2xpZW50IGhhc2ggYXMgb3VyIGRlZmF1bHQgYXV0b1xuLy8gdXBkYXRlIHZlcnNpb24gaWQuXG5cbi8vIE5vdGU6IFRlc3RzIGFsbG93IHBlb3BsZSB0byBvdmVycmlkZSBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uIGJlZm9yZVxuLy8gc3RhcnR1cC5cbkF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb24gPSBudWxsO1xuQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvblJlZnJlc2hhYmxlID0gbnVsbDtcbkF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25Db3Jkb3ZhID0gbnVsbDtcbkF1dG91cGRhdGUuYXBwSWQgPSBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLmFwcElkID0gcHJvY2Vzcy5lbnYuQVBQX0lEO1xuXG52YXIgc3luY1F1ZXVlID0gbmV3IE1ldGVvci5fU3luY2hyb25vdXNRdWV1ZSgpO1xuXG5mdW5jdGlvbiB1cGRhdGVWZXJzaW9ucyhzaG91bGRSZWxvYWRDbGllbnRQcm9ncmFtKSB7XG4gIC8vIFN0ZXAgMTogbG9hZCB0aGUgY3VycmVudCBjbGllbnQgcHJvZ3JhbSBvbiB0aGUgc2VydmVyXG4gIGlmIChzaG91bGRSZWxvYWRDbGllbnRQcm9ncmFtKSB7XG4gICAgV2ViQXBwSW50ZXJuYWxzLnJlbG9hZENsaWVudFByb2dyYW1zKCk7XG4gIH1cblxuICBjb25zdCB7XG4gICAgLy8gSWYgdGhlIEFVVE9VUERBVEVfVkVSU0lPTiBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyBkZWZpbmVkLCBpdCB0YWtlc1xuICAgIC8vIHByZWNlZGVuY2UsIGJ1dCBBdXRvdXBkYXRlLmF1dG91cGRhdGVWZXJzaW9uIGlzIHN0aWxsIHN1cHBvcnRlZCBhc1xuICAgIC8vIGEgZmFsbGJhY2suIEluIG1vc3QgY2FzZXMgbmVpdGhlciBvZiB0aGVzZSB2YWx1ZXMgd2lsbCBiZSBkZWZpbmVkLlxuICAgIEFVVE9VUERBVEVfVkVSU0lPTiA9IEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25cbiAgfSA9IHByb2Nlc3MuZW52O1xuXG4gIC8vIFN0ZXAgMjogdXBkYXRlIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uYXV0b3VwZGF0ZS52ZXJzaW9ucy5cbiAgY29uc3QgY2xpZW50QXJjaHMgPSBPYmplY3Qua2V5cyhXZWJBcHAuY2xpZW50UHJvZ3JhbXMpO1xuICBjbGllbnRBcmNocy5mb3JFYWNoKGFyY2ggPT4ge1xuICAgIEF1dG91cGRhdGUudmVyc2lvbnNbYXJjaF0gPSB7XG4gICAgICB2ZXJzaW9uOiBBVVRPVVBEQVRFX1ZFUlNJT04gfHxcbiAgICAgICAgV2ViQXBwLmNhbGN1bGF0ZUNsaWVudEhhc2goYXJjaCksXG4gICAgICB2ZXJzaW9uUmVmcmVzaGFibGU6IEFVVE9VUERBVEVfVkVSU0lPTiB8fFxuICAgICAgICBXZWJBcHAuY2FsY3VsYXRlQ2xpZW50SGFzaFJlZnJlc2hhYmxlKGFyY2gpLFxuICAgICAgdmVyc2lvbk5vblJlZnJlc2hhYmxlOiBBVVRPVVBEQVRFX1ZFUlNJT04gfHxcbiAgICAgICAgV2ViQXBwLmNhbGN1bGF0ZUNsaWVudEhhc2hOb25SZWZyZXNoYWJsZShhcmNoKSxcbiAgICB9O1xuICB9KTtcblxuICAvLyBTdGVwIDM6IGZvcm0gdGhlIG5ldyBjbGllbnQgYm9pbGVycGxhdGUgd2hpY2ggY29udGFpbnMgdGhlIHVwZGF0ZWRcbiAgLy8gYXNzZXRzIGFuZCBfX21ldGVvcl9ydW50aW1lX2NvbmZpZ19fLlxuICBpZiAoc2hvdWxkUmVsb2FkQ2xpZW50UHJvZ3JhbSkge1xuICAgIFdlYkFwcEludGVybmFscy5nZW5lcmF0ZUJvaWxlcnBsYXRlKCk7XG4gIH1cblxuICAvLyBTdGVwIDQ6IHVwZGF0ZSB0aGUgQ2xpZW50VmVyc2lvbnMgY29sbGVjdGlvbi5cbiAgLy8gV2UgdXNlIGBvbkxpc3RlbmluZ2AgaGVyZSBiZWNhdXNlIHdlIG5lZWQgdG8gdXNlXG4gIC8vIGBXZWJBcHAuZ2V0UmVmcmVzaGFibGVBc3NldHNgLCB3aGljaCBpcyBvbmx5IHNldCBhZnRlclxuICAvLyBgV2ViQXBwLmdlbmVyYXRlQm9pbGVycGxhdGVgIGlzIGNhbGxlZCBieSBgbWFpbmAgaW4gd2ViYXBwLlxuICBXZWJBcHAub25MaXN0ZW5pbmcoKCkgPT4ge1xuICAgIGNsaWVudEFyY2hzLmZvckVhY2goYXJjaCA9PiB7XG4gICAgICBjb25zdCBwYXlsb2FkID0ge1xuICAgICAgICAuLi5BdXRvdXBkYXRlLnZlcnNpb25zW2FyY2hdLFxuICAgICAgICBhc3NldHM6IFdlYkFwcC5nZXRSZWZyZXNoYWJsZUFzc2V0cyhhcmNoKSxcbiAgICAgIH07XG4gICAgICBpZiAoISBDbGllbnRWZXJzaW9ucy5maW5kT25lKHsgX2lkOiBhcmNoIH0pKSB7XG4gICAgICAgIENsaWVudFZlcnNpb25zLmluc2VydCh7IF9pZDogYXJjaCwgLi4ucGF5bG9hZCB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIENsaWVudFZlcnNpb25zLnVwZGF0ZShhcmNoLCB7ICRzZXQ6IHBheWxvYWQgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufVxuXG5NZXRlb3IucHVibGlzaChcbiAgXCJtZXRlb3JfYXV0b3VwZGF0ZV9jbGllbnRWZXJzaW9uc1wiLFxuICBmdW5jdGlvbiAoYXBwSWQpIHtcbiAgICAvLyBgbnVsbGAgaGFwcGVucyB3aGVuIGEgY2xpZW50IGRvZXNuJ3QgaGF2ZSBhbiBhcHBJZCBhbmQgcGFzc2VzXG4gICAgLy8gYHVuZGVmaW5lZGAgdG8gYE1ldGVvci5zdWJzY3JpYmVgLiBgdW5kZWZpbmVkYCBpcyB0cmFuc2xhdGVkIHRvXG4gICAgLy8gYG51bGxgIGFzIEpTT04gZG9lc24ndCBoYXZlIGB1bmRlZmluZWQuXG4gICAgY2hlY2soYXBwSWQsIE1hdGNoLk9uZU9mKFN0cmluZywgdW5kZWZpbmVkLCBudWxsKSk7XG5cbiAgICAvLyAvLyBEb24ndCBub3RpZnkgY2xpZW50cyB1c2luZyB3cm9uZyBhcHBJZCBzdWNoIGFzIG1vYmlsZSBhcHBzIGJ1aWx0IHdpdGggYVxuICAgIC8vIC8vIGRpZmZlcmVudCBzZXJ2ZXIgYnV0IHBvaW50aW5nIGF0IHRoZSBzYW1lIGxvY2FsIHVybFxuICAgIC8vIGlmIChBdXRvdXBkYXRlLmFwcElkICYmIGFwcElkICYmIEF1dG91cGRhdGUuYXBwSWQgIT09IGFwcElkKVxuICAgIC8vICAgcmV0dXJuIFtdO1xuXG4gICAgcmV0dXJuIENsaWVudFZlcnNpb25zLmZpbmQoKTtcbiAgfSxcbiAge2lzX2F1dG86IHRydWV9XG4pO1xuXG5NZXRlb3Iuc3RhcnR1cChmdW5jdGlvbiAoKSB7XG4gIHVwZGF0ZVZlcnNpb25zKGZhbHNlKTtcblxuICAvLyBGb3JjZSBhbnkgY29ubmVjdGVkIGNsaWVudHMgdGhhdCBhcmUgc3RpbGwgbG9va2luZyBmb3IgdGhlc2Ugb2xkZXJcbiAgLy8gZG9jdW1lbnQgSURzIHRvIHJlbG9hZC5cbiAgW1widmVyc2lvblwiLFxuICAgXCJ2ZXJzaW9uLXJlZnJlc2hhYmxlXCIsXG4gICBcInZlcnNpb24tY29yZG92YVwiLFxuICBdLmZvckVhY2goX2lkID0+IHtcbiAgICBDbGllbnRWZXJzaW9ucy51cHNlcnQoX2lkLCB7XG4gICAgICAkc2V0OiB7IHZlcnNpb246IFwib3V0ZGF0ZWRcIiB9XG4gICAgfSk7XG4gIH0pO1xufSk7XG5cbnZhciBmdXQgPSBuZXcgRnV0dXJlKCk7XG5cbi8vIFdlIG9ubHkgd2FudCAncmVmcmVzaCcgdG8gdHJpZ2dlciAndXBkYXRlVmVyc2lvbnMnIEFGVEVSIG9uTGlzdGVuLFxuLy8gc28gd2UgYWRkIGEgcXVldWVkIHRhc2sgdGhhdCB3YWl0cyBmb3Igb25MaXN0ZW4gYmVmb3JlICdyZWZyZXNoJyBjYW4gcXVldWVcbi8vIHRhc2tzLiBOb3RlIHRoYXQgdGhlIGBvbkxpc3RlbmluZ2AgY2FsbGJhY2tzIGRvIG5vdCBmaXJlIHVudGlsIGFmdGVyXG4vLyBNZXRlb3Iuc3RhcnR1cCwgc28gdGhlcmUgaXMgbm8gY29uY2VybiB0aGF0IHRoZSAndXBkYXRlVmVyc2lvbnMnIGNhbGxzIGZyb21cbi8vICdyZWZyZXNoJyB3aWxsIG92ZXJsYXAgd2l0aCB0aGUgYHVwZGF0ZVZlcnNpb25zYCBjYWxsIGZyb20gTWV0ZW9yLnN0YXJ0dXAuXG5cbnN5bmNRdWV1ZS5xdWV1ZVRhc2soZnVuY3Rpb24gKCkge1xuICBmdXQud2FpdCgpO1xufSk7XG5cbldlYkFwcC5vbkxpc3RlbmluZyhmdW5jdGlvbiAoKSB7XG4gIGZ1dC5yZXR1cm4oKTtcbn0pO1xuXG5mdW5jdGlvbiBlbnF1ZXVlVmVyc2lvbnNSZWZyZXNoKCkge1xuICBzeW5jUXVldWUucXVldWVUYXNrKGZ1bmN0aW9uICgpIHtcbiAgICB1cGRhdGVWZXJzaW9ucyh0cnVlKTtcbiAgfSk7XG59XG5cbi8vIExpc3RlbiBmb3IgbWVzc2FnZXMgcGVydGFpbmluZyB0byB0aGUgY2xpZW50LXJlZnJlc2ggdG9waWMuXG5pbXBvcnQgeyBvbk1lc3NhZ2UgfSBmcm9tIFwibWV0ZW9yL2ludGVyLXByb2Nlc3MtbWVzc2FnaW5nXCI7XG5vbk1lc3NhZ2UoXCJjbGllbnQtcmVmcmVzaFwiLCBlbnF1ZXVlVmVyc2lvbnNSZWZyZXNoKTtcblxuLy8gQW5vdGhlciB3YXkgdG8gdGVsbCB0aGUgcHJvY2VzcyB0byByZWZyZXNoOiBzZW5kIFNJR0hVUCBzaWduYWxcbnByb2Nlc3Mub24oJ1NJR0hVUCcsIE1ldGVvci5iaW5kRW52aXJvbm1lbnQoZnVuY3Rpb24gKCkge1xuICBlbnF1ZXVlVmVyc2lvbnNSZWZyZXNoKCk7XG59LCBcImhhbmRsaW5nIFNJR0hVUCBzaWduYWwgZm9yIHJlZnJlc2hcIikpO1xuIl19
