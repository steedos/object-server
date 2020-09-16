(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var __coffeescriptShare;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                         //
// packages/steedos_autoform-modals/lib/server/core.coffee                                 //
//                                                                                         //
/////////////////////////////////////////////////////////////////////////////////////////////
                                                                                           //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.methods({
  "af_modal_multiple_update": function (options) {
    var collection, doc, object, object_name, target_ids;
    check(options, Object);
    target_ids = options.target_ids, doc = options.doc, object_name = options.object_name;
    check(target_ids, Array);
    check(doc, Object);
    check(object_name, String);
    object = Creator.getObject(object_name);

    if (!object) {
      throw new Meteor.Error(403, "未找到指定对象");
      return false;
    }

    collection = object.db;
    collection.update({
      _id: {
        $in: target_ids
      }
    }, doc, {
      multi: true
    });
    return true;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("steedos:autoform-modals");

})();

//# sourceURL=meteor://💻app/packages/steedos_autoform-modals.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS1tb2RhbHMvbGliL3NlcnZlci9jb3JlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvbGliL3NlcnZlci9jb3JlLmNvZmZlZSJdLCJuYW1lcyI6WyJNZXRlb3IiLCJtZXRob2RzIiwib3B0aW9ucyIsImNvbGxlY3Rpb24iLCJkb2MiLCJvYmplY3QiLCJvYmplY3RfbmFtZSIsInRhcmdldF9pZHMiLCJjaGVjayIsIk9iamVjdCIsIkFycmF5IiwiU3RyaW5nIiwiQ3JlYXRvciIsImdldE9iamVjdCIsIkVycm9yIiwiZGIiLCJ1cGRhdGUiLCJfaWQiLCIkaW4iLCJtdWx0aSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE9BQVAsQ0FDQztBQUFBLDhCQUE0QixVQUFDQyxPQUFEO0FBQzNCLFFBQUFDLFVBQUEsRUFBQUMsR0FBQSxFQUFBQyxNQUFBLEVBQUFDLFdBQUEsRUFBQUMsVUFBQTtBQUFBQyxVQUFNTixPQUFOLEVBQWVPLE1BQWY7QUFDRUYsaUJBQUFMLFFBQUFLLFVBQUEsRUFBWUgsTUFBQUYsUUFBQUUsR0FBWixFQUFpQkUsY0FBQUosUUFBQUksV0FBakI7QUFDRkUsVUFBTUQsVUFBTixFQUFrQkcsS0FBbEI7QUFDQUYsVUFBTUosR0FBTixFQUFXSyxNQUFYO0FBQ0FELFVBQU1GLFdBQU4sRUFBbUJLLE1BQW5CO0FBRUFOLGFBQVNPLFFBQVFDLFNBQVIsQ0FBa0JQLFdBQWxCLENBQVQ7O0FBQ0EsU0FBT0QsTUFBUDtBQUNDLFlBQU0sSUFBSUwsT0FBT2MsS0FBWCxDQUFpQixHQUFqQixFQUFzQixTQUF0QixDQUFOO0FBQ0EsYUFBTyxLQUFQO0FDQ0U7O0FEQUhYLGlCQUFhRSxPQUFPVSxFQUFwQjtBQUNBWixlQUFXYSxNQUFYLENBQWtCO0FBQ2pCQyxXQUFLO0FBQUNDLGFBQUtYO0FBQU47QUFEWSxLQUFsQixFQUVHSCxHQUZILEVBRVE7QUFBQ2UsYUFBTTtBQUFQLEtBRlI7QUFHQSxXQUFPLElBQVA7QUFmRDtBQUFBLENBREQsRSIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS1tb2RhbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJNZXRlb3IubWV0aG9kc1xyXG5cdFwiYWZfbW9kYWxfbXVsdGlwbGVfdXBkYXRlXCI6IChvcHRpb25zKS0+XHJcblx0XHRjaGVjayBvcHRpb25zLCBPYmplY3RcclxuXHRcdHsgdGFyZ2V0X2lkcywgZG9jLCBvYmplY3RfbmFtZX0gPSBvcHRpb25zXHJcblx0XHRjaGVjayB0YXJnZXRfaWRzLCBBcnJheVxyXG5cdFx0Y2hlY2sgZG9jLCBPYmplY3RcclxuXHRcdGNoZWNrIG9iamVjdF9uYW1lLCBTdHJpbmdcclxuXHJcblx0XHRvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSlcclxuXHRcdHVubGVzcyBvYmplY3RcclxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwi5pyq5om+5Yiw5oyH5a6a5a+56LGhXCIpXHJcblx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0Y29sbGVjdGlvbiA9IG9iamVjdC5kYlxyXG5cdFx0Y29sbGVjdGlvbi51cGRhdGUge1xyXG5cdFx0XHRfaWQ6IHskaW46IHRhcmdldF9pZHN9XHJcblx0XHR9LCBkb2MsIHttdWx0aTp0cnVlfVxyXG5cdFx0cmV0dXJuIHRydWU7IiwiTWV0ZW9yLm1ldGhvZHMoe1xuICBcImFmX21vZGFsX211bHRpcGxlX3VwZGF0ZVwiOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGNvbGxlY3Rpb24sIGRvYywgb2JqZWN0LCBvYmplY3RfbmFtZSwgdGFyZ2V0X2lkcztcbiAgICBjaGVjayhvcHRpb25zLCBPYmplY3QpO1xuICAgIHRhcmdldF9pZHMgPSBvcHRpb25zLnRhcmdldF9pZHMsIGRvYyA9IG9wdGlvbnMuZG9jLCBvYmplY3RfbmFtZSA9IG9wdGlvbnMub2JqZWN0X25hbWU7XG4gICAgY2hlY2sodGFyZ2V0X2lkcywgQXJyYXkpO1xuICAgIGNoZWNrKGRvYywgT2JqZWN0KTtcbiAgICBjaGVjayhvYmplY3RfbmFtZSwgU3RyaW5nKTtcbiAgICBvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSk7XG4gICAgaWYgKCFvYmplY3QpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIuacquaJvuWIsOaMh+WumuWvueixoVwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29sbGVjdGlvbiA9IG9iamVjdC5kYjtcbiAgICBjb2xsZWN0aW9uLnVwZGF0ZSh7XG4gICAgICBfaWQ6IHtcbiAgICAgICAgJGluOiB0YXJnZXRfaWRzXG4gICAgICB9XG4gICAgfSwgZG9jLCB7XG4gICAgICBtdWx0aTogdHJ1ZVxuICAgIH0pO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59KTtcbiJdfQ==
