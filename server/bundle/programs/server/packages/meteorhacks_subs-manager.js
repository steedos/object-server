(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var _ = Package.underscore._;
var EJSON = Package.ejson.EJSON;

/* Package-scope variables */
var SubsManager;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                          //
// packages/meteorhacks_subs-manager/lib/sub_manager.js                                     //
//                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////
                                                                                            //
var FastRender = null;
if(Package['meteorhacks:fast-render']) {
  FastRender = Package['meteorhacks:fast-render'].FastRender;
}

SubsManager = function (options) {
  var self = this;
  self.options = options || {};
  // maxiumum number of subscriptions are cached
  self.options.cacheLimit = self.options.cacheLimit || 10;
  // maximum time, subscription stay in the cache
  self.options.expireIn = self.options.expireIn || 5;

  self._cacheMap = {};
  self._cacheList = [];
  self._ready = false;
  self.dep = new Deps.Dependency();

  self.computation = self._registerComputation();
};

SubsManager.prototype.subscribe = function() {
  var self = this;
  if(Meteor.isClient) {
    var args = _.toArray(arguments);
    this._addSub(args);

    return {
      ready: function() {
        self.dep.depend();
        return self._ready;
      }
    };
  } else {
    // to support fast-render
    if(Meteor.subscribe) {
      return Meteor.subscribe.apply(Meteor, arguments);
    }
  }
};

SubsManager.prototype._addSub = function(args) {
  var self = this;
  var hash = EJSON.stringify(args);
  var subName = args[0];
  var paramsKey = EJSON.stringify(args.slice(1));

  if(!self._cacheMap[hash]) {
    var sub = {
      args: args,
      hash: hash
    };

    this._handleError(sub);

    self._cacheMap[hash] = sub;
    self._cacheList.push(sub);

    // if fast-render comes with this subscription
    // we need to fake the ready message at first
    // This is because we are delaying the actual subscription evaluation
    // May be FastRender needs to send full list of subscription args to the client
    // But, for now this is something working
    if(FastRender && FastRender._subscriptions && FastRender._subscriptions[subName]) {
      self._ready = self._ready && FastRender._subscriptions[subName][paramsKey];
    } else {
      self._ready = false;
    }

    // to notify the global ready()
    self._notifyChanged();
    
    // no need to interfere with the current computation
    self._reRunSubs();
  }

  // add the current sub to the top of the list
  var sub = self._cacheMap[hash];
  sub.updated = (new Date).getTime();

  var index = _.indexOf(self._cacheList, sub);
  self._cacheList.splice(index, 1);
  self._cacheList.push(sub);
};

SubsManager.prototype._reRunSubs = function() {
  var self = this;

  if(Deps.currentComputation) {
    Deps.afterFlush(function() {
      self.computation.invalidate();
    });
  } else {
    self.computation.invalidate();
  }
};

SubsManager.prototype._notifyChanged = function() {
  var self = this;
  if(Deps.currentComputation) {
    setTimeout(function() {
      self.dep.changed();
    }, 0);
  } else {
    self.dep.changed();
  }
};

SubsManager.prototype._applyCacheLimit = function () {
  var self = this;
  var overflow = self._cacheList.length - self.options.cacheLimit;
  if(overflow > 0) {
    var removedSubs = self._cacheList.splice(0, overflow);
    _.each(removedSubs, function(sub) {
      delete self._cacheMap[sub.hash];
    });
  }
};

SubsManager.prototype._applyExpirations = function() {
  var self = this;
  var newCacheList = [];

  var expirationTime = (new Date).getTime() - self.options.expireIn * 60 * 1000;
  _.each(self._cacheList, function(sub) {
    if(sub.updated >= expirationTime) {
      newCacheList.push(sub);
    } else {
      delete self._cacheMap[sub.hash];
    }
  });

  self._cacheList = newCacheList;
};

SubsManager.prototype._registerComputation = function() {
  var self = this;
  var computation = Deps.autorun(function() {
    self._applyExpirations();
    self._applyCacheLimit();

    var ready = true;
    _.each(self._cacheList, function(sub) {
      sub.ready = Meteor.subscribe.apply(Meteor, sub.args).ready();
      ready = ready && sub.ready;
    });

    if(ready) {
      self._ready = true;
      self._notifyChanged();
    }
  });

  return computation;
};

SubsManager.prototype._createIdentifier = function(args) {
  var tmpArgs = _.map(args, function(value) {
    if(typeof value == "string") {
      return '"' + value + '"';
    } else {
      return value;
    }
  });

  return tmpArgs.join(', ');
};

SubsManager.prototype._handleError = function(sub) {
  var args = sub.args;
  var lastElement = _.last(args);
  sub.identifier = this._createIdentifier(args);

  if(!lastElement) {
    args.push({onError: errorHandlingLogic});
  } else if(typeof lastElement == "function") {
    args.pop();
    args.push({onReady: lastElement, onError: errorHandlingLogic});
  } else if(typeof lastElement.onError == "function") {
    var originalOnError = lastElement.onError;
    lastElement.onError = function(err) {
      errorHandlingLogic(err);
      originalOnError(err);
    };
  } else if(typeof lastElement.onReady == "function") {
    lastElement.onError = errorHandlingLogic;
  } else {
    args.push({onError: errorHandlingLogic});
  }

  function errorHandlingLogic (err) {
    console.log("Error invoking SubsManager.subscribe(%s): ", sub.identifier , err.reason);
    // expire this sub right away.
    // Then expiration machanism will take care of the sub removal
    sub.updated = new Date(1);
  }
};

SubsManager.prototype.reset = function() {
  var self = this;
  var oldComputation = self.computation;
  self.computation = self._registerComputation();

  // invalidate the new compuation and it will fire new subscriptions
  self.computation.invalidate();

  // after above invalidation completed, fire stop the old computation
  // which then send unsub messages
  // mergeBox will correct send changed data and there'll be no flicker
  Deps.afterFlush(function() {
    oldComputation.stop();
  });
};

SubsManager.prototype.clear = function() {
  this._cacheList = [];
  this._cacheMap = {};
  this._reRunSubs();
};

SubsManager.prototype.ready = function() {
  this.dep.depend();

  // if there are no items in the cacheList we are not ready yet.
  if(this._cacheList.length === 0) {
    return false;
  }
  return this._ready;
};

//////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("meteorhacks:subs-manager", {
  SubsManager: SubsManager
});

})();
