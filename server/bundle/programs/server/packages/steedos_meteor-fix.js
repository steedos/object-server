(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var meteorInstall = Package.modules.meteorInstall;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:meteor-fix":{"lib":{"meteor_fix.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////
//                                                                                    //
// packages/steedos_meteor-fix/lib/meteor_fix.js                                      //
//                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////
                                                                                      //
let Mongo;
module.link("meteor/mongo", {
  Mongo(v) {
    Mongo = v;
  }

}, 0);

// Revert change from Meteor 1.6.1 who set ignoreUndefined: true
// more information https://github.com/meteor/meteor/pull/9444
if (Meteor.isServer) {
  process.noDeprecation = true; // silence deprecation warnings, 相当于 --no-deprecation

  let mongoOptions = {
    useUnifiedTopology: true,
    // Required to silence deprecation warnings
    autoReconnect: undefined,
    reconnectTries: undefined
  };
  const mongoOptionStr = process.env.MONGO_OPTIONS;

  if (typeof mongoOptionStr !== 'undefined') {
    const jsonMongoOptions = JSON.parse(mongoOptionStr);
    mongoOptions = Object.assign({}, mongoOptions, jsonMongoOptions);
  }

  Mongo.setConnectionOptions(mongoOptions);
}

Meteor.autorun = Tracker.autorun;
////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json"
  ]
});

require("/node_modules/meteor/steedos:meteor-fix/lib/meteor_fix.js");

/* Exports */
Package._define("steedos:meteor-fix");

})();

//# sourceURL=meteor://💻app/packages/steedos_meteor-fix.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczptZXRlb3ItZml4L2xpYi9tZXRlb3JfZml4LmpzIl0sIm5hbWVzIjpbIk1vbmdvIiwibW9kdWxlIiwibGluayIsInYiLCJNZXRlb3IiLCJpc1NlcnZlciIsInByb2Nlc3MiLCJub0RlcHJlY2F0aW9uIiwibW9uZ29PcHRpb25zIiwidXNlVW5pZmllZFRvcG9sb2d5IiwiYXV0b1JlY29ubmVjdCIsInVuZGVmaW5lZCIsInJlY29ubmVjdFRyaWVzIiwibW9uZ29PcHRpb25TdHIiLCJlbnYiLCJNT05HT19PUFRJT05TIiwianNvbk1vbmdvT3B0aW9ucyIsIkpTT04iLCJwYXJzZSIsIk9iamVjdCIsImFzc2lnbiIsInNldENvbm5lY3Rpb25PcHRpb25zIiwiYXV0b3J1biIsIlRyYWNrZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLEtBQUo7QUFBVUMsTUFBTSxDQUFDQyxJQUFQLENBQVksY0FBWixFQUEyQjtBQUFDRixPQUFLLENBQUNHLENBQUQsRUFBRztBQUFDSCxTQUFLLEdBQUNHLENBQU47QUFBUTs7QUFBbEIsQ0FBM0IsRUFBK0MsQ0FBL0M7O0FBRVY7QUFDQTtBQUNBLElBQUlDLE1BQU0sQ0FBQ0MsUUFBWCxFQUFxQjtBQUNwQkMsU0FBTyxDQUFDQyxhQUFSLEdBQXdCLElBQXhCLENBRG9CLENBQ1U7O0FBQzlCLE1BQUlDLFlBQVksR0FBRztBQUNsQkMsc0JBQWtCLEVBQUUsSUFERjtBQUNRO0FBQzFCQyxpQkFBYSxFQUFFQyxTQUZHO0FBR2xCQyxrQkFBYyxFQUFFRDtBQUhFLEdBQW5CO0FBTUEsUUFBTUUsY0FBYyxHQUFHUCxPQUFPLENBQUNRLEdBQVIsQ0FBWUMsYUFBbkM7O0FBQ0EsTUFBSSxPQUFPRixjQUFQLEtBQTBCLFdBQTlCLEVBQTJDO0FBQzFDLFVBQU1HLGdCQUFnQixHQUFHQyxJQUFJLENBQUNDLEtBQUwsQ0FBV0wsY0FBWCxDQUF6QjtBQUVBTCxnQkFBWSxHQUFHVyxNQUFNLENBQUNDLE1BQVAsQ0FBYyxFQUFkLEVBQWtCWixZQUFsQixFQUFnQ1EsZ0JBQWhDLENBQWY7QUFDQTs7QUFDRGhCLE9BQUssQ0FBQ3FCLG9CQUFOLENBQTJCYixZQUEzQjtBQUNBOztBQUdESixNQUFNLENBQUNrQixPQUFQLEdBQWlCQyxPQUFPLENBQUNELE9BQXpCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfbWV0ZW9yLWZpeC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJ1xyXG5cclxuLy8gUmV2ZXJ0IGNoYW5nZSBmcm9tIE1ldGVvciAxLjYuMSB3aG8gc2V0IGlnbm9yZVVuZGVmaW5lZDogdHJ1ZVxyXG4vLyBtb3JlIGluZm9ybWF0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL3B1bGwvOTQ0NFxyXG5pZiAoTWV0ZW9yLmlzU2VydmVyKSB7XHJcblx0cHJvY2Vzcy5ub0RlcHJlY2F0aW9uID0gdHJ1ZTsgLy8gc2lsZW5jZSBkZXByZWNhdGlvbiB3YXJuaW5ncywg55u45b2T5LqOIC0tbm8tZGVwcmVjYXRpb25cclxuXHRsZXQgbW9uZ29PcHRpb25zID0ge1xyXG5cdFx0dXNlVW5pZmllZFRvcG9sb2d5OiB0cnVlLCAvLyBSZXF1aXJlZCB0byBzaWxlbmNlIGRlcHJlY2F0aW9uIHdhcm5pbmdzXHJcblx0XHRhdXRvUmVjb25uZWN0OiB1bmRlZmluZWQsXHJcblx0XHRyZWNvbm5lY3RUcmllczogdW5kZWZpbmVkXHJcblx0fTtcclxuXHJcblx0Y29uc3QgbW9uZ29PcHRpb25TdHIgPSBwcm9jZXNzLmVudi5NT05HT19PUFRJT05TO1xyXG5cdGlmICh0eXBlb2YgbW9uZ29PcHRpb25TdHIgIT09ICd1bmRlZmluZWQnKSB7XHJcblx0XHRjb25zdCBqc29uTW9uZ29PcHRpb25zID0gSlNPTi5wYXJzZShtb25nb09wdGlvblN0cik7XHJcblxyXG5cdFx0bW9uZ29PcHRpb25zID0gT2JqZWN0LmFzc2lnbih7fSwgbW9uZ29PcHRpb25zLCBqc29uTW9uZ29PcHRpb25zKTtcclxuXHR9XHJcblx0TW9uZ28uc2V0Q29ubmVjdGlvbk9wdGlvbnMobW9uZ29PcHRpb25zKTtcclxufVxyXG5cclxuXHJcbk1ldGVvci5hdXRvcnVuID0gVHJhY2tlci5hdXRvcnVuXHJcbiJdfQ==
