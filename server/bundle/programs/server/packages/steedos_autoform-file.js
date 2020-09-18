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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS1maWxlL2xpYi9zZXJ2ZXIvcHVibGlzaC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9zZXJ2ZXIvcHVibGlzaC5jb2ZmZWUiXSwibmFtZXMiOlsiTWV0ZW9yIiwicHVibGlzaCIsImNvbGxlY3Rpb25OYW1lIiwiZG9jSWQiLCJjb2xsZWN0aW9uIiwiY2hlY2siLCJTdHJpbmciLCJGUyIsIl9jb2xsZWN0aW9ucyIsImdsb2JhbCIsImZpbmQiLCJfaWQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBQSxPQUFPQyxPQUFQLENBQWUsaUJBQWYsRUFBa0MsVUFBQ0MsY0FBRCxFQUFpQkMsS0FBakI7QUFDaEMsTUFBQUMsVUFBQTtBQUFBQyxRQUFNSCxjQUFOLEVBQXNCSSxNQUF0QjtBQUNBRCxRQUFNRixLQUFOLEVBQWFHLE1BQWI7QUFFQUYsZUFBYUcsR0FBR0MsWUFBSCxDQUFnQk4sY0FBaEIsS0FBbUNPLE9BQU9QLGNBQVAsQ0FBaEQ7O0FBQ0EsTUFBR0UsVUFBSDtBQ0NFLFdEQUFBLFdBQVdNLElBQVgsQ0FDRTtBQUFBQyxXQUFLUjtBQUFMLEtBREYsQ0NBQTtBQUdEO0FEVEgsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS1maWxlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiTWV0ZW9yLnB1Ymxpc2ggJ2F1dG9mb3JtRmlsZURvYycsIChjb2xsZWN0aW9uTmFtZSwgZG9jSWQpIC0+XHJcbiAgY2hlY2sgY29sbGVjdGlvbk5hbWUsIFN0cmluZ1xyXG4gIGNoZWNrIGRvY0lkLCBTdHJpbmdcclxuXHJcbiAgY29sbGVjdGlvbiA9IEZTLl9jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV0gb3IgZ2xvYmFsW2NvbGxlY3Rpb25OYW1lXVxyXG4gIGlmIGNvbGxlY3Rpb25cclxuICAgIGNvbGxlY3Rpb24uZmluZFxyXG4gICAgICBfaWQ6IGRvY0lkXHJcbiIsIk1ldGVvci5wdWJsaXNoKCdhdXRvZm9ybUZpbGVEb2MnLCBmdW5jdGlvbihjb2xsZWN0aW9uTmFtZSwgZG9jSWQpIHtcbiAgdmFyIGNvbGxlY3Rpb247XG4gIGNoZWNrKGNvbGxlY3Rpb25OYW1lLCBTdHJpbmcpO1xuICBjaGVjayhkb2NJZCwgU3RyaW5nKTtcbiAgY29sbGVjdGlvbiA9IEZTLl9jb2xsZWN0aW9uc1tjb2xsZWN0aW9uTmFtZV0gfHwgZ2xvYmFsW2NvbGxlY3Rpb25OYW1lXTtcbiAgaWYgKGNvbGxlY3Rpb24pIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5maW5kKHtcbiAgICAgIF9pZDogZG9jSWRcbiAgICB9KTtcbiAgfVxufSk7XG4iXX0=
