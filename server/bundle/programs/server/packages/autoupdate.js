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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvYXV0b3VwZGF0ZS9hdXRvdXBkYXRlX3NlcnZlci5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnQiLCJBdXRvdXBkYXRlIiwib25NZXNzYWdlIiwibGluayIsInYiLCJGdXR1cmUiLCJOcG0iLCJyZXF1aXJlIiwiX19tZXRlb3JfcnVudGltZV9jb25maWdfXyIsImF1dG91cGRhdGUiLCJ2ZXJzaW9ucyIsIkNsaWVudFZlcnNpb25zIiwiTW9uZ28iLCJDb2xsZWN0aW9uIiwiY29ubmVjdGlvbiIsImF1dG91cGRhdGVWZXJzaW9uIiwiYXV0b3VwZGF0ZVZlcnNpb25SZWZyZXNoYWJsZSIsImF1dG91cGRhdGVWZXJzaW9uQ29yZG92YSIsImFwcElkIiwicHJvY2VzcyIsImVudiIsIkFQUF9JRCIsInN5bmNRdWV1ZSIsIk1ldGVvciIsIl9TeW5jaHJvbm91c1F1ZXVlIiwidXBkYXRlVmVyc2lvbnMiLCJzaG91bGRSZWxvYWRDbGllbnRQcm9ncmFtIiwiV2ViQXBwSW50ZXJuYWxzIiwicmVsb2FkQ2xpZW50UHJvZ3JhbXMiLCJBVVRPVVBEQVRFX1ZFUlNJT04iLCJjbGllbnRBcmNocyIsIk9iamVjdCIsImtleXMiLCJXZWJBcHAiLCJjbGllbnRQcm9ncmFtcyIsImZvckVhY2giLCJhcmNoIiwidmVyc2lvbiIsImNhbGN1bGF0ZUNsaWVudEhhc2giLCJ2ZXJzaW9uUmVmcmVzaGFibGUiLCJjYWxjdWxhdGVDbGllbnRIYXNoUmVmcmVzaGFibGUiLCJ2ZXJzaW9uTm9uUmVmcmVzaGFibGUiLCJjYWxjdWxhdGVDbGllbnRIYXNoTm9uUmVmcmVzaGFibGUiLCJnZW5lcmF0ZUJvaWxlcnBsYXRlIiwib25MaXN0ZW5pbmciLCJwYXlsb2FkIiwiYXNzZXRzIiwiZ2V0UmVmcmVzaGFibGVBc3NldHMiLCJmaW5kT25lIiwiX2lkIiwiaW5zZXJ0IiwidXBkYXRlIiwiJHNldCIsInB1Ymxpc2giLCJjaGVjayIsIk1hdGNoIiwiT25lT2YiLCJTdHJpbmciLCJ1bmRlZmluZWQiLCJmaW5kIiwiaXNfYXV0byIsInN0YXJ0dXAiLCJ1cHNlcnQiLCJmdXQiLCJxdWV1ZVRhc2siLCJ3YWl0IiwicmV0dXJuIiwiZW5xdWV1ZVZlcnNpb25zUmVmcmVzaCIsIm9uIiwiYmluZEVudmlyb25tZW50Il0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxNQUFNLENBQUNDLE1BQVAsQ0FBYztBQUFDQyxZQUFVLEVBQUMsTUFBSUE7QUFBaEIsQ0FBZDtBQUEyQyxJQUFJQyxTQUFKO0FBQWNILE1BQU0sQ0FBQ0ksSUFBUCxDQUFZLGdDQUFaLEVBQTZDO0FBQUNELFdBQVMsQ0FBQ0UsQ0FBRCxFQUFHO0FBQUNGLGFBQVMsR0FBQ0UsQ0FBVjtBQUFZOztBQUExQixDQUE3QyxFQUF5RSxDQUF6RTs7QUFBekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUVBLElBQUlDLE1BQU0sR0FBR0MsR0FBRyxDQUFDQyxPQUFKLENBQVksZUFBWixDQUFiOztBQUVPLE1BQU1OLFVBQVUsR0FBR08seUJBQXlCLENBQUNDLFVBQTFCLEdBQXVDO0FBQy9EO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBQyxVQUFRLEVBQUU7QUFQcUQsQ0FBMUQ7QUFVUDtBQUNBLE1BQU1DLGNBQWMsR0FDbEIsSUFBSUMsS0FBSyxDQUFDQyxVQUFWLENBQXFCLGtDQUFyQixFQUF5RDtBQUN2REMsWUFBVSxFQUFFO0FBRDJDLENBQXpELENBREYsQyxDQUtBO0FBQ0E7QUFDQTtBQUNBO0FBRUE7QUFDQTs7QUFDQWIsVUFBVSxDQUFDYyxpQkFBWCxHQUErQixJQUEvQjtBQUNBZCxVQUFVLENBQUNlLDRCQUFYLEdBQTBDLElBQTFDO0FBQ0FmLFVBQVUsQ0FBQ2dCLHdCQUFYLEdBQXND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SUFBSTBCLEdBQUcsR0FBRyxJQUFJMUQsTUFBSixFQUFWLEMsQ0FFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBaUIsU0FBUyxDQUFDMEMsU0FBVixDQUFvQixZQUFZO0FBQzlCRCxLQUFHLENBQUNFLElBQUo7QUFDRCxDQUZEO0FBSUFoQyxNQUFNLENBQUNXLFdBQVAsQ0FBbUIsWUFBWTtBQUM3Qm1CLEtBQUcsQ0FBQ0csTUFBSjtBQUNELENBRkQ7O0FBSUEsU0FBU0Msc0JBQVQsR0FBa0M7QUFDaEM3QyxXQUFTLENBQUMwQyxTQUFWLENBQW9CLFlBQVk7QUFDOUJ2QyxrQkFBYyxDQUFDLElBQUQsQ0FBZDtBQUNELEdBRkQ7QUFHRCxDLENBRUQ7OztBQUVBdkIsU0FBUyxDQUFDLGdCQUFELEVBQW1CaUUsc0JBQW5CLENBQVQsQyxDQUVBOztBQUNBaEQsT0FBTyxDQUFDaUQsRUFBUixDQUFXLFFBQVgsRUFBcUI3QyxNQUFNLENBQUM4QyxlQUFQLENBQXVCLFlBQVk7QUFDdERGLHdCQUFzQjtBQUN2QixDQUZvQixFQUVsQixvQ0FGa0IsQ0FBckIsRSIsImZpbGUiOiIvcGFja2FnZXMvYXV0b3VwZGF0ZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFB1Ymxpc2ggdGhlIGN1cnJlbnQgY2xpZW50IHZlcnNpb25zIGZvciBlYWNoIGNsaWVudCBhcmNoaXRlY3R1cmVcclxuLy8gKHdlYi5icm93c2VyLCB3ZWIuYnJvd3Nlci5sZWdhY3ksIHdlYi5jb3Jkb3ZhKS4gV2hlbiBhIGNsaWVudCBvYnNlcnZlc1xyXG4vLyBhIGNoYW5nZSBpbiB0aGUgdmVyc2lvbnMgYXNzb2NpYXRlZCB3aXRoIGl0cyBjbGllbnQgYXJjaGl0ZWN0dXJlLFxyXG4vLyBpdCB3aWxsIHJlZnJlc2ggaXRzZWxmLCBlaXRoZXIgYnkgc3dhcHBpbmcgb3V0IENTUyBhc3NldHMgb3IgYnlcclxuLy8gcmVsb2FkaW5nIHRoZSBwYWdlLlxyXG4vL1xyXG4vLyBUaGVyZSBhcmUgdGhyZWUgdmVyc2lvbnMgZm9yIGFueSBnaXZlbiBjbGllbnQgYXJjaGl0ZWN0dXJlOiBgdmVyc2lvbmAsXHJcbi8vIGB2ZXJzaW9uUmVmcmVzaGFibGVgLCBhbmQgYHZlcnNpb25Ob25SZWZyZXNoYWJsZWAuIFRoZSByZWZyZXNoYWJsZVxyXG4vLyB2ZXJzaW9uIGlzIGEgaGFzaCBvZiBqdXN0IHRoZSBjbGllbnQgcmVzb3VyY2VzIHRoYXQgYXJlIHJlZnJlc2hhYmxlLFxyXG4vLyBzdWNoIGFzIENTUywgd2hpbGUgdGhlIG5vbi1yZWZyZXNoYWJsZSB2ZXJzaW9uIGlzIGEgaGFzaCBvZiB0aGUgcmVzdCBvZlxyXG4vLyB0aGUgY2xpZW50IGFzc2V0cywgZXhjbHVkaW5nIHRoZSByZWZyZXNoYWJsZSBvbmVzOiBIVE1MLCBKUywgYW5kIHN0YXRpY1xyXG4vLyBmaWxlcyBpbiB0aGUgYHB1YmxpY2AgZGlyZWN0b3J5LiBUaGUgYHZlcnNpb25gIHZlcnNpb24gaXMgYSBjb21iaW5lZFxyXG4vLyBoYXNoIG9mIGV2ZXJ5dGhpbmcuXHJcbi8vXHJcbi8vIElmIHRoZSBlbnZpcm9ubWVudCB2YXJpYWJsZSBgQVVUT1VQREFURV9WRVJTSU9OYCBpcyBzZXQsIGl0IHdpbGwgYmVcclxuLy8gdXNlZCBpbiBwbGFjZSBvZiBhbGwgY2xpZW50IHZlcnNpb25zLiBZb3UgY2FuIHVzZSB0aGlzIHZhcmlhYmxlIHRvXHJcbi8vIGNvbnRyb2wgd2hlbiB0aGUgY2xpZW50IHJlbG9hZHMuIEZvciBleGFtcGxlLCBpZiB5b3Ugd2FudCB0byBmb3JjZSBhXHJcbi8vIHJlbG9hZCBvbmx5IGFmdGVyIG1ham9yIGNoYW5nZXMsIHVzZSBhIGN1c3RvbSBBVVRPVVBEQVRFX1ZFUlNJT04gYW5kXHJcbi8vIGNoYW5nZSBpdCBvbmx5IHdoZW4gc29tZXRoaW5nIHdvcnRoIHB1c2hpbmcgdG8gY2xpZW50cyBoYXBwZW5zLlxyXG4vL1xyXG4vLyBUaGUgc2VydmVyIHB1Ymxpc2hlcyBhIGBtZXRlb3JfYXV0b3VwZGF0ZV9jbGllbnRWZXJzaW9uc2AgY29sbGVjdGlvbi5cclxuLy8gVGhlIElEIG9mIGVhY2ggZG9jdW1lbnQgaXMgdGhlIGNsaWVudCBhcmNoaXRlY3R1cmUsIGFuZCB0aGUgZmllbGRzIG9mXHJcbi8vIHRoZSBkb2N1bWVudCBhcmUgdGhlIHZlcnNpb25zIGRlc2NyaWJlZCBhYm92ZS5cclxuXHJcbnZhciBGdXR1cmUgPSBOcG0ucmVxdWlyZShcImZpYmVycy9mdXR1cmVcIik7XHJcblxyXG5leHBvcnQgY29uc3QgQXV0b3VwZGF0ZSA9IF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uYXV0b3VwZGF0ZSA9IHtcclxuICAvLyBNYXAgZnJvbSBjbGllbnQgYXJjaGl0ZWN0dXJlcyAod2ViLmJyb3dzZXIsIHdlYi5icm93c2VyLmxlZ2FjeSxcclxuICAvLyB3ZWIuY29yZG92YSkgdG8gdmVyc2lvbiBmaWVsZHMgeyB2ZXJzaW9uLCB2ZXJzaW9uUmVmcmVzaGFibGUsXHJcbiAgLy8gdmVyc2lvbk5vblJlZnJlc2hhYmxlLCByZWZyZXNoYWJsZSB9IHRoYXQgd2lsbCBiZSBzdG9yZWQgaW5cclxuICAvLyBDbGllbnRWZXJzaW9ucyBkb2N1bWVudHMgKHdob3NlIElEcyBhcmUgY2xpZW50IGFyY2hpdGVjdHVyZXMpLiBUaGlzXHJcbiAgLy8gZGF0YSBnZXRzIHNlcmlhbGl6ZWQgaW50byB0aGUgYm9pbGVycGxhdGUgYmVjYXVzZSBpdCdzIHN0b3JlZCBpblxyXG4gIC8vIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uYXV0b3VwZGF0ZS52ZXJzaW9ucy5cclxuICB2ZXJzaW9uczoge31cclxufTtcclxuXHJcbi8vIFRoZSBjb2xsZWN0aW9uIG9mIGFjY2VwdGFibGUgY2xpZW50IHZlcnNpb25zLlxyXG5jb25zdCBDbGllbnRWZXJzaW9ucyA9XHJcbiAgbmV3IE1vbmdvLkNvbGxlY3Rpb24oXCJtZXRlb3JfYXV0b3VwZGF0ZV9jbGllbnRWZXJzaW9uc1wiLCB7XHJcbiAgICBjb25uZWN0aW9uOiBudWxsXHJcbiAgfSk7XHJcblxyXG4vLyBUaGUgY2xpZW50IGhhc2ggaW5jbHVkZXMgX19tZXRlb3JfcnVudGltZV9jb25maWdfXywgc28gd2FpdCB1bnRpbFxyXG4vLyBhbGwgcGFja2FnZXMgaGF2ZSBsb2FkZWQgYW5kIGhhdmUgaGFkIGEgY2hhbmNlIHRvIHBvcHVsYXRlIHRoZVxyXG4vLyBydW50aW1lIGNvbmZpZyBiZWZvcmUgdXNpbmcgdGhlIGNsaWVudCBoYXNoIGFzIG91ciBkZWZhdWx0IGF1dG9cclxuLy8gdXBkYXRlIHZlcnNpb24gaWQuXHJcblxyXG4vLyBOb3RlOiBUZXN0cyBhbGxvdyBwZW9wbGUgdG8gb3ZlcnJpZGUgQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvbiBiZWZvcmVcclxuLy8gc3RhcnR1cC5cclxuQXV0b3VwZGF0ZS5hdXRvdXBkYXRlVmVyc2lvbiA9IG51bGw7XHJcbkF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25SZWZyZXNoYWJsZSA9IG51bGw7XHJcbkF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25Db3Jkb3ZhID0gbnVsbDtcclxuQXV0b3VwZGF0ZS5hcHBJZCA9IF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uYXBwSWQgPSBwcm9jZXNzLmVudi5BUFBfSUQ7XHJcblxyXG52YXIgc3luY1F1ZXVlID0gbmV3IE1ldGVvci5fU3luY2hyb25vdXNRdWV1ZSgpO1xyXG5cclxuZnVuY3Rpb24gdXBkYXRlVmVyc2lvbnMoc2hvdWxkUmVsb2FkQ2xpZW50UHJvZ3JhbSkge1xyXG4gIC8vIFN0ZXAgMTogbG9hZCB0aGUgY3VycmVudCBjbGllbnQgcHJvZ3JhbSBvbiB0aGUgc2VydmVyXHJcbiAgaWYgKHNob3VsZFJlbG9hZENsaWVudFByb2dyYW0pIHtcclxuICAgIFdlYkFwcEludGVybmFscy5yZWxvYWRDbGllbnRQcm9ncmFtcygpO1xyXG4gIH1cclxuXHJcbiAgY29uc3Qge1xyXG4gICAgLy8gSWYgdGhlIEFVVE9VUERBVEVfVkVSU0lPTiBlbnZpcm9ubWVudCB2YXJpYWJsZSBpcyBkZWZpbmVkLCBpdCB0YWtlc1xyXG4gICAgLy8gcHJlY2VkZW5jZSwgYnV0IEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb24gaXMgc3RpbGwgc3VwcG9ydGVkIGFzXHJcbiAgICAvLyBhIGZhbGxiYWNrLiBJbiBtb3N0IGNhc2VzIG5laXRoZXIgb2YgdGhlc2UgdmFsdWVzIHdpbGwgYmUgZGVmaW5lZC5cclxuICAgIEFVVE9VUERBVEVfVkVSU0lPTiA9IEF1dG91cGRhdGUuYXV0b3VwZGF0ZVZlcnNpb25cclxuICB9ID0gcHJvY2Vzcy5lbnY7XHJcblxyXG4gIC8vIFN0ZXAgMjogdXBkYXRlIF9fbWV0ZW9yX3J1bnRpbWVfY29uZmlnX18uYXV0b3VwZGF0ZS52ZXJzaW9ucy5cclxuICBjb25zdCBjbGllbnRBcmNocyA9IE9iamVjdC5rZXlzKFdlYkFwcC5jbGllbnRQcm9ncmFtcyk7XHJcbiAgY2xpZW50QXJjaHMuZm9yRWFjaChhcmNoID0+IHtcclxuICAgIEF1dG91cGRhdGUudmVyc2lvbnNbYXJjaF0gPSB7XHJcbiAgICAgIHZlcnNpb246IEFVVE9VUERBVEVfVkVSU0lPTiB8fFxyXG4gICAgICAgIFdlYkFwcC5jYWxjdWxhdGVDbGllbnRIYXNoKGFyY2gpLFxyXG4gICAgICB2ZXJzaW9uUmVmcmVzaGFibGU6IEFVVE9VUERBVEVfVkVSU0lPTiB8fFxyXG4gICAgICAgIFdlYkFwcC5jYWxjdWxhdGVDbGllbnRIYXNoUmVmcmVzaGFibGUoYXJjaCksXHJcbiAgICAgIHZlcnNpb25Ob25SZWZyZXNoYWJsZTogQVVUT1VQREFURV9WRVJTSU9OIHx8XHJcbiAgICAgICAgV2ViQXBwLmNhbGN1bGF0ZUNsaWVudEhhc2hOb25SZWZyZXNoYWJsZShhcmNoKSxcclxuICAgIH07XHJcbiAgfSk7XHJcblxyXG4gIC8vIFN0ZXAgMzogZm9ybSB0aGUgbmV3IGNsaWVudCBib2lsZXJwbGF0ZSB3aGljaCBjb250YWlucyB0aGUgdXBkYXRlZFxyXG4gIC8vIGFzc2V0cyBhbmQgX19tZXRlb3JfcnVudGltZV9jb25maWdfXy5cclxuICBpZiAoc2hvdWxkUmVsb2FkQ2xpZW50UHJvZ3JhbSkge1xyXG4gICAgV2ViQXBwSW50ZXJuYWxzLmdlbmVyYXRlQm9pbGVycGxhdGUoKTtcclxuICB9XHJcblxyXG4gIC8vIFN0ZXAgNDogdXBkYXRlIHRoZSBDbGllbnRWZXJzaW9ucyBjb2xsZWN0aW9uLlxyXG4gIC8vIFdlIHVzZSBgb25MaXN0ZW5pbmdgIGhlcmUgYmVjYXVzZSB3ZSBuZWVkIHRvIHVzZVxyXG4gIC8vIGBXZWJBcHAuZ2V0UmVmcmVzaGFibGVBc3NldHNgLCB3aGljaCBpcyBvbmx5IHNldCBhZnRlclxyXG4gIC8vIGBXZWJBcHAuZ2VuZXJhdGVCb2lsZXJwbGF0ZWAgaXMgY2FsbGVkIGJ5IGBtYWluYCBpbiB3ZWJhcHAuXHJcbiAgV2ViQXBwLm9uTGlzdGVuaW5nKCgpID0+IHtcclxuICAgIGNsaWVudEFyY2hzLmZvckVhY2goYXJjaCA9PiB7XHJcbiAgICAgIGNvbnN0IHBheWxvYWQgPSB7XHJcbiAgICAgICAgLi4uQXV0b3VwZGF0ZS52ZXJzaW9uc1thcmNoXSxcclxuICAgICAgICBhc3NldHM6IFdlYkFwcC5nZXRSZWZyZXNoYWJsZUFzc2V0cyhhcmNoKSxcclxuICAgICAgfTtcclxuICAgICAgaWYgKCEgQ2xpZW50VmVyc2lvbnMuZmluZE9uZSh7IF9pZDogYXJjaCB9KSkge1xyXG4gICAgICAgIENsaWVudFZlcnNpb25zLmluc2VydCh7IF9pZDogYXJjaCwgLi4ucGF5bG9hZCB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBDbGllbnRWZXJzaW9ucy51cGRhdGUoYXJjaCwgeyAkc2V0OiBwYXlsb2FkIH0pO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9KTtcclxufVxyXG5cclxuTWV0ZW9yLnB1Ymxpc2goXHJcbiAgXCJtZXRlb3JfYXV0b3VwZGF0ZV9jbGllbnRWZXJzaW9uc1wiLFxyXG4gIGZ1bmN0aW9uIChhcHBJZCkge1xyXG4gICAgLy8gYG51bGxgIGhhcHBlbnMgd2hlbiBhIGNsaWVudCBkb2Vzbid0IGhhdmUgYW4gYXBwSWQgYW5kIHBhc3Nlc1xyXG4gICAgLy8gYHVuZGVmaW5lZGAgdG8gYE1ldGVvci5zdWJzY3JpYmVgLiBgdW5kZWZpbmVkYCBpcyB0cmFuc2xhdGVkIHRvXHJcbiAgICAvLyBgbnVsbGAgYXMgSlNPTiBkb2Vzbid0IGhhdmUgYHVuZGVmaW5lZC5cclxuICAgIGNoZWNrKGFwcElkLCBNYXRjaC5PbmVPZihTdHJpbmcsIHVuZGVmaW5lZCwgbnVsbCkpO1xyXG5cclxuICAgIC8vIC8vIERvbid0IG5vdGlmeSBjbGllbnRzIHVzaW5nIHdyb25nIGFwcElkIHN1Y2ggYXMgbW9iaWxlIGFwcHMgYnVpbHQgd2l0aCBhXHJcbiAgICAvLyAvLyBkaWZmZXJlbnQgc2VydmVyIGJ1dCBwb2ludGluZyBhdCB0aGUgc2FtZSBsb2NhbCB1cmxcclxuICAgIC8vIGlmIChBdXRvdXBkYXRlLmFwcElkICYmIGFwcElkICYmIEF1dG91cGRhdGUuYXBwSWQgIT09IGFwcElkKVxyXG4gICAgLy8gICByZXR1cm4gW107XHJcblxyXG4gICAgcmV0dXJuIENsaWVudFZlcnNpb25zLmZpbmQoKTtcclxuICB9LFxyXG4gIHtpc19hdXRvOiB0cnVlfVxyXG4pO1xyXG5cclxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24gKCkge1xyXG4gIHVwZGF0ZVZlcnNpb25zKGZhbHNlKTtcclxuXHJcbiAgLy8gRm9yY2UgYW55IGNvbm5lY3RlZCBjbGllbnRzIHRoYXQgYXJlIHN0aWxsIGxvb2tpbmcgZm9yIHRoZXNlIG9sZGVyXHJcbiAgLy8gZG9jdW1lbnQgSURzIHRvIHJlbG9hZC5cclxuICBbXCJ2ZXJzaW9uXCIsXHJcbiAgIFwidmVyc2lvbi1yZWZyZXNoYWJsZVwiLFxyXG4gICBcInZlcnNpb24tY29yZG92YVwiLFxyXG4gIF0uZm9yRWFjaChfaWQgPT4ge1xyXG4gICAgQ2xpZW50VmVyc2lvbnMudXBzZXJ0KF9pZCwge1xyXG4gICAgICAkc2V0OiB7IHZlcnNpb246IFwib3V0ZGF0ZWRcIiB9XHJcbiAgICB9KTtcclxuICB9KTtcclxufSk7XHJcblxyXG52YXIgZnV0ID0gbmV3IEZ1dHVyZSgpO1xyXG5cclxuLy8gV2Ugb25seSB3YW50ICdyZWZyZXNoJyB0byB0cmlnZ2VyICd1cGRhdGVWZXJzaW9ucycgQUZURVIgb25MaXN0ZW4sXHJcbi8vIHNvIHdlIGFkZCBhIHF1ZXVlZCB0YXNrIHRoYXQgd2FpdHMgZm9yIG9uTGlzdGVuIGJlZm9yZSAncmVmcmVzaCcgY2FuIHF1ZXVlXHJcbi8vIHRhc2tzLiBOb3RlIHRoYXQgdGhlIGBvbkxpc3RlbmluZ2AgY2FsbGJhY2tzIGRvIG5vdCBmaXJlIHVudGlsIGFmdGVyXHJcbi8vIE1ldGVvci5zdGFydHVwLCBzbyB0aGVyZSBpcyBubyBjb25jZXJuIHRoYXQgdGhlICd1cGRhdGVWZXJzaW9ucycgY2FsbHMgZnJvbVxyXG4vLyAncmVmcmVzaCcgd2lsbCBvdmVybGFwIHdpdGggdGhlIGB1cGRhdGVWZXJzaW9uc2AgY2FsbCBmcm9tIE1ldGVvci5zdGFydHVwLlxyXG5cclxuc3luY1F1ZXVlLnF1ZXVlVGFzayhmdW5jdGlvbiAoKSB7XHJcbiAgZnV0LndhaXQoKTtcclxufSk7XHJcblxyXG5XZWJBcHAub25MaXN0ZW5pbmcoZnVuY3Rpb24gKCkge1xyXG4gIGZ1dC5yZXR1cm4oKTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiBlbnF1ZXVlVmVyc2lvbnNSZWZyZXNoKCkge1xyXG4gIHN5bmNRdWV1ZS5xdWV1ZVRhc2soZnVuY3Rpb24gKCkge1xyXG4gICAgdXBkYXRlVmVyc2lvbnModHJ1ZSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8vIExpc3RlbiBmb3IgbWVzc2FnZXMgcGVydGFpbmluZyB0byB0aGUgY2xpZW50LXJlZnJlc2ggdG9waWMuXHJcbmltcG9ydCB7IG9uTWVzc2FnZSB9IGZyb20gXCJtZXRlb3IvaW50ZXItcHJvY2Vzcy1tZXNzYWdpbmdcIjtcclxub25NZXNzYWdlKFwiY2xpZW50LXJlZnJlc2hcIiwgZW5xdWV1ZVZlcnNpb25zUmVmcmVzaCk7XHJcblxyXG4vLyBBbm90aGVyIHdheSB0byB0ZWxsIHRoZSBwcm9jZXNzIHRvIHJlZnJlc2g6IHNlbmQgU0lHSFVQIHNpZ25hbFxyXG5wcm9jZXNzLm9uKCdTSUdIVVAnLCBNZXRlb3IuYmluZEVudmlyb25tZW50KGZ1bmN0aW9uICgpIHtcclxuICBlbnF1ZXVlVmVyc2lvbnNSZWZyZXNoKCk7XHJcbn0sIFwiaGFuZGxpbmcgU0lHSFVQIHNpZ25hbCBmb3IgcmVmcmVzaFwiKSk7XHJcbiJdfQ==
