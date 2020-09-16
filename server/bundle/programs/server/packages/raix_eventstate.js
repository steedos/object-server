(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var EventEmitter = Package['raix:eventemitter'].EventEmitter;

/* Package-scope variables */
var EventState;

(function(){

/////////////////////////////////////////////////////////////////////////////
//                                                                         //
// packages/raix_eventstate/packages/raix_eventstate.js                    //
//                                                                         //
/////////////////////////////////////////////////////////////////////////////
                                                                           //
(function () {

///////////////////////////////////////////////////////////////////////
//                                                                   //
// packages/raix:eventstate/eventstate.common.js                     //
//                                                                   //
///////////////////////////////////////////////////////////////////////
                                                                     //
EventState = function(map) {                                         // 1
  var self = this;                                                   // 2
                                                                     // 3
  // Make sure we return an instance of EventState                   // 4
  if (!(self instanceof EventState)) {                               // 5
    return new EventState(map);                                      // 6
  }                                                                  // 7
                                                                     // 8
  // Extend with Event emitter                                       // 9
 EventEmitter.call(self);                                            // 10
                                                                     // 11
  // Map of state values                                             // 12
  self.map = map || {};                                              // 13
  _.each(self.map, function(val, key) {                              // 14
    // Make sure they are all arrays of arguments _.mapObject        // 15
    self.map[key] = _.isArray(val) ? val : [val];                    // 16
  });                                                                // 17
};                                                                   // 18
                                                                     // 19
// Extend the EventState prototype with EventEmitter                 // 20
EventState.prototype = Object.create(EventEmitter.prototype);        // 21
                                                                     // 22
EventState.prototype.emitState = function(name /* arguments */) {    // 23
  var self = this;                                                   // 24
                                                                     // 25
  var args = _.toArray(arguments);                                   // 26
                                                                     // 27
  // Set value                                                       // 28
  self.map[name] = _.clone(_.rest(args));                            // 29
                                                                     // 30
  // Emit change event                                               // 31
  EventEmitter.prototype.emit.apply(self, args);                     // 32
                                                                     // 33
  // Return EventState instance                                      // 34
  return self;                                                       // 35
};                                                                   // 36
                                                                     // 37
EventState.prototype.on = function(name, listener) {                 // 38
  var self = this;                                                   // 39
                                                                     // 40
  // Add the listener                                                // 41
  EventEmitter.prototype.on.call(self, name, listener);              // 42
  // Check if state got a value                                      // 43
  if (self.map.hasOwnProperty(name)) {                               // 44
    // Return the current value                                      // 45
    listener.apply(self, self.map[name]);                            // 46
  }                                                                  // 47
                                                                     // 48
  // Return EventState instance                                      // 49
  return self;                                                       // 50
};                                                                   // 51
                                                                     // 52
EventState.prototype.once = function(name, listener) {               // 53
  var self = this;                                                   // 54
                                                                     // 55
  // Check if state got a value                                      // 56
  if (self.map.hasOwnProperty(name)) {                               // 57
    // Return the value                                              // 58
    listener.apply(self, self.map[name]);                            // 59
  } else {                                                           // 60
    // Add the listener                                              // 61
    EventEmitter.prototype.once.call(self, name, listener);          // 62
  }                                                                  // 63
                                                                     // 64
  // Return EventState instance                                      // 65
  return self;                                                       // 66
};                                                                   // 67
                                                                     // 68
                                                                     // 69
EventState.prototype.clearState = function(name) {                   // 70
  var self = this;                                                   // 71
                                                                     // 72
  if (name) {                                                        // 73
    // Remove the named state                                        // 74
    self.map = _.omit(self.map, name);                               // 75
  } else {                                                           // 76
    // Clear the whole map                                           // 77
    self.map = {};                                                   // 78
  }                                                                  // 79
};                                                                   // 80
                                                                     // 81
                                                                     // 82
// Add api helpers                                                   // 83
EventState.prototype.addListener = EventState.prototype.on;          // 84
                                                                     // 85
// Add jquery like helpers                                           // 86
EventState.prototype.one = EventState.prototype.once;                // 87
                                                                     // 88
///////////////////////////////////////////////////////////////////////

}).call(this);

/////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("raix:eventstate", {
  EventState: EventState
});

})();
