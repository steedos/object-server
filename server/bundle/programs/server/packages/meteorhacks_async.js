(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;

/* Package-scope variables */
var Async, response;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                          //
// packages/meteorhacks_async/packages/meteorhacks_async.js                                                 //
//                                                                                                          //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                            //
(function () {

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/meteorhacks:async/async.js                                                                //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
var Future = Npm.require('fibers/future');                                                            // 1
Async = {};                                                                                           // 2
                                                                                                      // 3
Async.runSync = Meteor.sync = function(asynFunction) {                                                // 4
  var future = new Future();                                                                          // 5
  var sent = false;                                                                                   // 6
  var payload;                                                                                        // 7
                                                                                                      // 8
  var wrappedAsyncFunction = Meteor.bindEnvironment(asynFunction, function(err) {                     // 9
    console.error('Error inside the Async.runSync: ' + err.message);                                  // 10
    returnFuture(err);                                                                                // 11
  });                                                                                                 // 12
                                                                                                      // 13
  setTimeout(function() {                                                                             // 14
    wrappedAsyncFunction(returnFuture);                                                               // 15
  }, 0);                                                                                              // 16
                                                                                                      // 17
  future.wait();                                                                                      // 18
  sent = true;                                                                                        // 19
                                                                                                      // 20
  function returnFuture(error, result) {                                                              // 21
    if(!sent) {                                                                                       // 22
      payload = { result: result, error: error};                                                      // 23
      future.return();                                                                                // 24
    }                                                                                                 // 25
  }                                                                                                   // 26
                                                                                                      // 27
  return payload;                                                                                     // 28
};                                                                                                    // 29
                                                                                                      // 30
Async.wrap = function(arg1, arg2) {                                                                   // 31
  if(typeof arg1 == 'function') {                                                                     // 32
    var func = arg1;                                                                                  // 33
    return wrapFunction(func);                                                                        // 34
  } else if(typeof arg1 == 'object' && typeof arg2 == 'string') {                                     // 35
    var obj = arg1;                                                                                   // 36
    var funcName = arg2;                                                                              // 37
    return wrapObject(obj, [funcName])[funcName];                                                     // 38
  } else if(typeof arg1 == 'object' &&  arg2 instanceof Array) {                                      // 39
    var obj = arg1;                                                                                   // 40
    var funcNameList = arg2;                                                                          // 41
    return wrapObject(obj, funcNameList);                                                             // 42
  } else {                                                                                            // 43
    throw new Error('unsupported argument list');                                                     // 44
  }                                                                                                   // 45
                                                                                                      // 46
  function wrapObject(obj, funcNameList) {                                                            // 47
    var returnObj = {};                                                                               // 48
    funcNameList.forEach(function(funcName) {                                                         // 49
      if(obj[funcName]) {                                                                             // 50
        var func = obj[funcName].bind(obj);                                                           // 51
        returnObj[funcName] = wrapFunction(func);                                                     // 52
      } else {                                                                                        // 53
        throw new Error('instance method not exists: ' + funcName);                                   // 54
      }                                                                                               // 55
    });                                                                                               // 56
    return returnObj;                                                                                 // 57
  }                                                                                                   // 58
                                                                                                      // 59
  function wrapFunction(func) {                                                                       // 60
    return function() {                                                                               // 61
      var args = arguments;                                                                           // 62
      response = Meteor.sync(function(done) {                                                         // 63
        Array.prototype.push.call(args, done);                                                        // 64
        func.apply(null, args);                                                                       // 65
      });                                                                                             // 66
                                                                                                      // 67
      if(response.error) {                                                                            // 68
        //we need to wrap a new error here something throw error object comes with response does not  // 69
        //print the correct error to the console, if there is not try catch block                     // 70
        var error = new Error(response.error.message);                                                // 71
        for(var key in response.error) {                                                              // 72
          if(error[key] === undefined) {                                                              // 73
            error[key] = response.error[key];                                                         // 74
          }                                                                                           // 75
        }                                                                                             // 76
        throw error;                                                                                  // 77
      } else {                                                                                        // 78
        return response.result;                                                                       // 79
      }                                                                                               // 80
    };                                                                                                // 81
  }                                                                                                   // 82
};                                                                                                    // 83
////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("meteorhacks:async", {
  Async: Async
});

})();
