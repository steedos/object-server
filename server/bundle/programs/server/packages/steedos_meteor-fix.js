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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczptZXRlb3ItZml4L2xpYi9tZXRlb3JfZml4LmpzIl0sIm5hbWVzIjpbIk1vbmdvIiwibW9kdWxlIiwibGluayIsInYiLCJNZXRlb3IiLCJpc1NlcnZlciIsInByb2Nlc3MiLCJub0RlcHJlY2F0aW9uIiwibW9uZ29PcHRpb25zIiwidXNlVW5pZmllZFRvcG9sb2d5IiwiYXV0b1JlY29ubmVjdCIsInVuZGVmaW5lZCIsInJlY29ubmVjdFRyaWVzIiwibW9uZ29PcHRpb25TdHIiLCJlbnYiLCJNT05HT19PUFRJT05TIiwianNvbk1vbmdvT3B0aW9ucyIsIkpTT04iLCJwYXJzZSIsIk9iamVjdCIsImFzc2lnbiIsInNldENvbm5lY3Rpb25PcHRpb25zIiwiYXV0b3J1biIsIlRyYWNrZXIiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLEtBQUo7QUFBVUMsTUFBTSxDQUFDQyxJQUFQLENBQVksY0FBWixFQUEyQjtBQUFDRixPQUFLLENBQUNHLENBQUQsRUFBRztBQUFDSCxTQUFLLEdBQUNHLENBQU47QUFBUTs7QUFBbEIsQ0FBM0IsRUFBK0MsQ0FBL0M7O0FBRVY7QUFDQTtBQUNBLElBQUlDLE1BQU0sQ0FBQ0MsUUFBWCxFQUFxQjtBQUNwQkMsU0FBTyxDQUFDQyxhQUFSLEdBQXdCLElBQXhCLENBRG9CLENBQ1U7O0FBQzlCLE1BQUlDLFlBQVksR0FBRztBQUNsQkMsc0JBQWtCLEVBQUUsSUFERjtBQUNRO0FBQzFCQyxpQkFBYSxFQUFFQyxTQUZHO0FBR2xCQyxrQkFBYyxFQUFFRDtBQUhFLEdBQW5CO0FBTUEsUUFBTUUsY0FBYyxHQUFHUCxPQUFPLENBQUNRLEdBQVIsQ0FBWUMsYUFBbkM7O0FBQ0EsTUFBSSxPQUFPRixjQUFQLEtBQTBCLFdBQTlCLEVBQTJDO0FBQzFDLFVBQU1HLGdCQUFnQixHQUFHQyxJQUFJLENBQUNDLEtBQUwsQ0FBV0wsY0FBWCxDQUF6QjtBQUVBTCxnQkFBWSxHQUFHVyxNQUFNLENBQUNDLE1BQVAsQ0FBYyxFQUFkLEVBQWtCWixZQUFsQixFQUFnQ1EsZ0JBQWhDLENBQWY7QUFDQTs7QUFDRGhCLE9BQUssQ0FBQ3FCLG9CQUFOLENBQTJCYixZQUEzQjtBQUNBOztBQUdESixNQUFNLENBQUNrQixPQUFQLEdBQWlCQyxPQUFPLENBQUNELE9BQXpCLEMiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfbWV0ZW9yLWZpeC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE1vbmdvIH0gZnJvbSAnbWV0ZW9yL21vbmdvJ1xuXG4vLyBSZXZlcnQgY2hhbmdlIGZyb20gTWV0ZW9yIDEuNi4xIHdobyBzZXQgaWdub3JlVW5kZWZpbmVkOiB0cnVlXG4vLyBtb3JlIGluZm9ybWF0aW9uIGh0dHBzOi8vZ2l0aHViLmNvbS9tZXRlb3IvbWV0ZW9yL3B1bGwvOTQ0NFxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuXHRwcm9jZXNzLm5vRGVwcmVjYXRpb24gPSB0cnVlOyAvLyBzaWxlbmNlIGRlcHJlY2F0aW9uIHdhcm5pbmdzLCDnm7jlvZPkuo4gLS1uby1kZXByZWNhdGlvblxuXHRsZXQgbW9uZ29PcHRpb25zID0ge1xuXHRcdHVzZVVuaWZpZWRUb3BvbG9neTogdHJ1ZSwgLy8gUmVxdWlyZWQgdG8gc2lsZW5jZSBkZXByZWNhdGlvbiB3YXJuaW5nc1xuXHRcdGF1dG9SZWNvbm5lY3Q6IHVuZGVmaW5lZCxcblx0XHRyZWNvbm5lY3RUcmllczogdW5kZWZpbmVkXG5cdH07XG5cblx0Y29uc3QgbW9uZ29PcHRpb25TdHIgPSBwcm9jZXNzLmVudi5NT05HT19PUFRJT05TO1xuXHRpZiAodHlwZW9mIG1vbmdvT3B0aW9uU3RyICE9PSAndW5kZWZpbmVkJykge1xuXHRcdGNvbnN0IGpzb25Nb25nb09wdGlvbnMgPSBKU09OLnBhcnNlKG1vbmdvT3B0aW9uU3RyKTtcblxuXHRcdG1vbmdvT3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oe30sIG1vbmdvT3B0aW9ucywganNvbk1vbmdvT3B0aW9ucyk7XG5cdH1cblx0TW9uZ28uc2V0Q29ubmVjdGlvbk9wdGlvbnMobW9uZ29PcHRpb25zKTtcbn1cblxuXG5NZXRlb3IuYXV0b3J1biA9IFRyYWNrZXIuYXV0b3J1blxuIl19
