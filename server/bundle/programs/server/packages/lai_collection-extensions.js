(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;

/* Package-scope variables */
var CollectionExtensions;

(function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                  //
// packages/lai_collection-extensions/packages/lai_collection-extensions.js                         //
//                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                    //
(function () {

///////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                           //
// packages/lai:collection-extensions/collection-extensions.js                               //
//                                                                                           //
///////////////////////////////////////////////////////////////////////////////////////////////
                                                                                             //
// The collection extensions namespace                                                       // 1
CollectionExtensions = {};                                                                   // 2
                                                                                             // 3
// Stores all the collection extensions                                                      // 4
CollectionExtensions._extensions = [];                                                       // 5
                                                                                             // 6
// This is where you would add custom functionality to                                       // 7
// Mongo.Collection/Meteor.Collection                                                        // 8
Meteor.addCollectionExtension = function (customFunction) {                                  // 9
  if (typeof customFunction !== 'function') {                                                // 10
    throw new Meteor.Error(                                                                  // 11
      'collection-extension-wrong-argument',                                                 // 12
      'You must pass a function \
       into Meteor.addCollectionExtension().');                                              // 14
  }                                                                                          // 15
  CollectionExtensions._extensions.push(customFunction);                                     // 16
  // If Meteor.users exists, apply the extension right away                                  // 17
  if (typeof Meteor.users !== 'undefined') {                                                 // 18
    customFunction.apply(Meteor.users, ['users']);                                           // 19
  }                                                                                          // 20
};                                                                                           // 21
                                                                                             // 22
// Utility function to add a prototype function to your                                      // 23
// Meteor/Mongo.Collection object                                                            // 24
Meteor.addCollectionPrototype = function (name, customFunction) {                            // 25
  if (typeof name !== 'string') {                                                            // 26
    throw new Meteor.Error(                                                                  // 27
      'collection-extension-wrong-argument',                                                 // 28
      'You must pass a string as the first argument \
       into Meteor.addCollectionPrototype().');                                              // 30
  }                                                                                          // 31
  if (typeof customFunction !== 'function') {                                                // 32
    throw new Meteor.Error(                                                                  // 33
      'collection-extension-wrong-argument',                                                 // 34
      'You must pass a function as the second argument \
       into Meteor.addCollectionPrototype().');                                              // 36
  }                                                                                          // 37
  (typeof Mongo !== 'undefined' ?                                                            // 38
    Mongo.Collection :                                                                       // 39
    Meteor.Collection).prototype[name] = customFunction;                                     // 40
};                                                                                           // 41
                                                                                             // 42
// This is used to reassign the prototype of unfortunately                                   // 43
// and unstoppably already instantiated Mongo instances                                      // 44
// i.e. Meteor.users                                                                         // 45
CollectionExtensions._reassignCollectionPrototype = function (instance, constr) {            // 46
  var hasSetPrototypeOf = typeof Object.setPrototypeOf === 'function';                       // 47
                                                                                             // 48
  if (!constr) constr = typeof Mongo !== 'undefined' ? Mongo.Collection : Meteor.Collection; // 49
                                                                                             // 50
  // __proto__ is not available in < IE11                                                    // 51
  // Note: Assigning a prototype dynamically has performance implications                    // 52
  if (hasSetPrototypeOf) {                                                                   // 53
    Object.setPrototypeOf(instance, constr.prototype);                                       // 54
  } else if (instance.__proto__) {                                                           // 55
    instance.__proto__ = constr.prototype;                                                   // 56
  }                                                                                          // 57
};                                                                                           // 58
                                                                                             // 59
// This monkey-patches the Collection constructor                                            // 60
// This code is the same monkey-patching code                                                // 61
// that matb33:collection-hooks uses, which works pretty nicely                              // 62
CollectionExtensions._wrapCollection = function (ns, as) {                                   // 63
  // Save the original prototype                                                             // 64
  if (!as._CollectionPrototype) as._CollectionPrototype = new as.Collection(null);           // 65
                                                                                             // 66
  var constructor = as.Collection;                                                           // 67
  var proto = as._CollectionPrototype;                                                       // 68
                                                                                             // 69
  ns.Collection = function () {                                                              // 70
    var ret = constructor.apply(this, arguments);                                            // 71
    // This is where all the collection extensions get processed                             // 72
    CollectionExtensions._processCollectionExtensions(this, arguments);                      // 73
    return ret;                                                                              // 74
  };                                                                                         // 75
                                                                                             // 76
  ns.Collection.prototype = proto;                                                           // 77
  ns.Collection.prototype.constructor = ns.Collection;                                       // 78
                                                                                             // 79
  for (var prop in constructor) {                                                            // 80
    if (constructor.hasOwnProperty(prop)) {                                                  // 81
      ns.Collection[prop] = constructor[prop];                                               // 82
    }                                                                                        // 83
  }                                                                                          // 84
};                                                                                           // 85
                                                                                             // 86
CollectionExtensions._processCollectionExtensions = function (self, args) {                  // 87
  // Using old-school operations for better performance                                      // 88
  // Please don't judge me ;P                                                                // 89
  var args = args ? [].slice.call(args, 0) : undefined;                                      // 90
  var extensions = CollectionExtensions._extensions;                                         // 91
  for (var i = 0, len = extensions.length; i < len; i++) {                                   // 92
    extensions[i].apply(self, args);                                                         // 93
  }                                                                                          // 94
};                                                                                           // 95
                                                                                             // 96
if (typeof Mongo !== 'undefined') {                                                          // 97
  CollectionExtensions._wrapCollection(Meteor, Mongo);                                       // 98
  CollectionExtensions._wrapCollection(Mongo, Mongo);                                        // 99
} else {                                                                                     // 100
  CollectionExtensions._wrapCollection(Meteor, Meteor);                                      // 101
}                                                                                            // 102
                                                                                             // 103
if (typeof Meteor.users !== 'undefined') {                                                   // 104
  // Ensures that Meteor.users instanceof Mongo.Collection                                   // 105
  CollectionExtensions._reassignCollectionPrototype(Meteor.users);                           // 106
}                                                                                            // 107
///////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

//////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("lai:collection-extensions");

})();
