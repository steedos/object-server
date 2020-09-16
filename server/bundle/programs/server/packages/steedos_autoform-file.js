(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var check = Package.check.check;
var Match = Package.check.Match;
var _ = Package.underscore._;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var _i18n = Package['universe:i18n']._i18n;
var i18n = Package['universe:i18n'].i18n;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var FS = Package['steedos:cfs-base-package'].FS;

/* Package-scope variables */
var __coffeescriptShare;

(function(){

////////////////////////////////////////////////////////////////////////////
//                                                                        //
// packages/steedos_autoform-file/lib/server/publish.coffee               //
//                                                                        //
////////////////////////////////////////////////////////////////////////////
                                                                          //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.publish('autoformFileDoc', function (collectionName, docId) {
  var collection;
  check(collectionName, String);
  check(docId, String);
  collection = FS._collections[collectionName] || global[collectionName];

  if (collection) {
    return collection.find({
      _id: docId
    });
  }
});
////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("steedos:autoform-file");

})();

//# sourceURL=meteor://💻app/packages/steedos_autoform-file.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS1maWxlL2xpYi9zZXJ2ZXIvcHVibGlzaC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9zZXJ2ZXIvcHVibGlzaC5jb2ZmZWUiXSwibmFtZXMiOlsiTWV0ZW9yIiwicHVibGlzaCIsImNvbGxlY3Rpb25OYW1lIiwiZG9jSWQiLCJjb2xsZWN0aW9uIiwiY2hlY2siLCJTdHJpbmciLCJGUyIsIl9jb2xsZWN0aW9ucyIsImdsb2JhbCIsImZpbmQiLCJfaWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWUsaUJBQWYsRUFBa0MsVUFBQ0MsY0FBRCxFQUFpQkMsS0FBakI7QUFDaEMsTUFBQUMsVUFBQTtBQUFBQyxRQUFNSCxjQUFOLEVBQXNCSSxNQUF0QjtBQUNBRCxRQUFNRixLQUFOLEVBQWFHLE1BQWI7QUFFQUYsZUFBYUcsR0FBR0MsWUFBSCxDQUFnQk4sY0FBaEIsS0FBbUNPLE9BQU9QLGNBQVAsQ0FBaEQ7O0FBQ0EsTUFBR0UsVUFBSDtBQ0NFLFdEQUFBLFdBQVdNLElBQVgsQ0FDRTtBQUFBQyxXQUFLUjtBQUFMLEtBREYsQ0NBQTtBQUdEO0FEVEgsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS1maWxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiTWV0ZW9yLnB1Ymxpc2ggJ2F1dG9mb3JtRmlsZURvYycsIChjb2xsZWN0aW9uTmFtZSwgZG9jSWQpIC0+XG4gIGNoZWNrIGNvbGxlY3Rpb25OYW1lLCBTdHJpbmdcbiAgY2hlY2sgZG9jSWQsIFN0cmluZ1xuXG4gIGNvbGxlY3Rpb24gPSBGUy5fY29sbGVjdGlvbnNbY29sbGVjdGlvbk5hbWVdIG9yIGdsb2JhbFtjb2xsZWN0aW9uTmFtZV1cbiAgaWYgY29sbGVjdGlvblxuICAgIGNvbGxlY3Rpb24uZmluZFxuICAgICAgX2lkOiBkb2NJZFxuIiwiTWV0ZW9yLnB1Ymxpc2goJ2F1dG9mb3JtRmlsZURvYycsIGZ1bmN0aW9uKGNvbGxlY3Rpb25OYW1lLCBkb2NJZCkge1xuICB2YXIgY29sbGVjdGlvbjtcbiAgY2hlY2soY29sbGVjdGlvbk5hbWUsIFN0cmluZyk7XG4gIGNoZWNrKGRvY0lkLCBTdHJpbmcpO1xuICBjb2xsZWN0aW9uID0gRlMuX2NvbGxlY3Rpb25zW2NvbGxlY3Rpb25OYW1lXSB8fCBnbG9iYWxbY29sbGVjdGlvbk5hbWVdO1xuICBpZiAoY29sbGVjdGlvbikge1xuICAgIHJldHVybiBjb2xsZWN0aW9uLmZpbmQoe1xuICAgICAgX2lkOiBkb2NJZFxuICAgIH0pO1xuICB9XG59KTtcbiJdfQ==
