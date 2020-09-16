(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MeteorX = Package['meteorhacks:meteorx'].MeteorX;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                             //
// packages/meteorhacks_unblock/packages/meteorhacks_unblock.js                                //
//                                                                                             //
/////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                               //
(function () {

///////////////////////////////////////////////////////////////////////////////////////////
//                                                                                       //
// packages/meteorhacks:unblock/lib/unblock.js                                           //
//                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////
                                                                                         //
var cachedUnblock;                                                                       // 1
                                                                                         // 2
var originalSub = MeteorX.Session.prototype.protocol_handlers.sub;                       // 3
MeteorX.Session.prototype.protocol_handlers.sub = function(msg, unblock) {               // 4
  var self = this;                                                                       // 5
  // cacheUnblock temporarly, so we can capture it later                                 // 6
  // we will use unblock in current eventLoop, so this is safe                           // 7
  cachedUnblock = unblock;                                                               // 8
  originalSub.call(self, msg, unblock);                                                  // 9
  // cleaning cached unblock                                                             // 10
  cachedUnblock = null;                                                                  // 11
};                                                                                       // 12
                                                                                         // 13
// We simply replace current implementation with a simple modification                   // 14
// to add add the unblock                                                                // 15
MeteorX.Session.prototype._startSubscription = function (handler, subId, params, name) { // 16
  var self = this;                                                                       // 17
  var sub = new MeteorX.Subscription(self, handler, subId, params, name);                // 18
                                                                                         // 19
  var unblockHander = cachedUnblock;                                                     // 20
  // _startSubscription may call from a lot places                                       // 21
  // so cachedUnblock might be null in somecases                                         // 22
  if(!unblockHander) {                                                                   // 23
    unblockHander = function() {}                                                        // 24
  }                                                                                      // 25
  // assign the cachedUnblock                                                            // 26
  sub.unblock = unblockHander ;                                                          // 27
                                                                                         // 28
  if(subId) {                                                                            // 29
    self._namedSubs[subId] = sub;                                                        // 30
  } else {                                                                               // 31
    self._universalSubs.push(sub);                                                       // 32
  }                                                                                      // 33
                                                                                         // 34
  sub._runHandler();                                                                     // 35
};                                                                                       // 36
                                                                                         // 37
// sometimes _runHandler will be called directly and                                     // 38
// we won't have the session context and cachedUnblock                                   // 39
// so, those situations, set a dummy function for unblock                                // 40
// this happens often when logging in and out                                            // 41
var originalRunHandler = MeteorX.Subscription.prototype._runHandler;                     // 42
MeteorX.Subscription.prototype._runHandler = function() {                                // 43
  if(!this.unblock) {                                                                    // 44
    this.unblock = function() {};                                                        // 45
  }                                                                                      // 46
  originalRunHandler.call(this);                                                         // 47
}                                                                                        // 48
///////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

/////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("meteorhacks:unblock");

})();
