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

///////////////////////////////////////////////////////////////////////////////
//                                                                           //
// packages/steedos_creator-autoform-modals/lib/server/core.coffee           //
//                                                                           //
///////////////////////////////////////////////////////////////////////////////
                                                                             //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.methods({
  "af_multiple_update": function (options) {
    var _ids, _object_name, collection, object, ref;

    check(options, Object);
    ref = options['$set'], _ids = ref._ids, _object_name = ref._object_name;
    check(_ids, String);
    check(_object_name, String);
    delete options['$set']._ids;
    delete options['$set']._object_name;
    object = Creator.getObject(_object_name);

    if (!object) {
      throw new Meteor.Error(403, "未找到指定对象");
      return false;
    }

    collection = object.db;
    collection.update({
      _id: {
        $in: _ids.split(",")
      }
    }, options, {
      multi: true
    });
    return true;
  },
  "af_update": function (options, id) {
    var _object_name, collection, object;

    _object_name = options["$set"]._object_name;
    check(options, Object);
    check(_object_name, String);
    delete options["$set"]._ids;
    delete options["$set"]._object_name;
    object = Creator.getObject(_object_name);

    if (!object) {
      throw new Meteor.Error(403, "未找到指定对象");
      return false;
    }

    collection = object.db;
    collection.update({
      _id: id
    }, options);
    return true;
  },
  "af_insert": function (options) {
    var _id, _object_name, collection, object;

    _object_name = options._object_name;
    check(options, Object);
    check(_object_name, String);
    delete options._ids;
    delete options._object_name;
    object = Creator.getObject(_object_name);

    if (!object) {
      throw new Meteor.Error(403, "未找到指定对象");
      return false;
    }

    collection = object.db;
    _id = collection.insert(options);
    return collection.findOne(_id);
  }
});
///////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("steedos:creator-autoform-modals");

})();

//# sourceURL=meteor://💻app/packages/steedos_creator-autoform-modals.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19jcmVhdG9yLWF1dG9mb3JtLW1vZGFscy9saWIvc2VydmVyL2NvcmUuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9saWIvc2VydmVyL2NvcmUuY29mZmVlIl0sIm5hbWVzIjpbIk1ldGVvciIsIm1ldGhvZHMiLCJvcHRpb25zIiwiX2lkcyIsIl9vYmplY3RfbmFtZSIsImNvbGxlY3Rpb24iLCJvYmplY3QiLCJyZWYiLCJjaGVjayIsIk9iamVjdCIsIlN0cmluZyIsIkNyZWF0b3IiLCJnZXRPYmplY3QiLCJFcnJvciIsImRiIiwidXBkYXRlIiwiX2lkIiwiJGluIiwic3BsaXQiLCJtdWx0aSIsImlkIiwiaW5zZXJ0IiwiZmluZE9uZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE9BQVAsQ0FDQztBQUFBLHdCQUFzQixVQUFDQyxPQUFEO0FBQ3JCLFFBQUFDLElBQUEsRUFBQUMsWUFBQSxFQUFBQyxVQUFBLEVBQUFDLE1BQUEsRUFBQUMsR0FBQTs7QUFBQUMsVUFBTU4sT0FBTixFQUFlTyxNQUFmO0FBQ0FGLFVBQXdCTCxRQUFRLE1BQVIsQ0FBeEIsRUFBRUMsT0FBQUksSUFBQUosSUFBRixFQUFRQyxlQUFBRyxJQUFBSCxZQUFSO0FBQ0FJLFVBQU1MLElBQU4sRUFBWU8sTUFBWjtBQUNBRixVQUFNSixZQUFOLEVBQW9CTSxNQUFwQjtBQUVBLFdBQU9SLFFBQVEsTUFBUixFQUFnQkMsSUFBdkI7QUFDQSxXQUFPRCxRQUFRLE1BQVIsRUFBZ0JFLFlBQXZCO0FBQ0FFLGFBQVNLLFFBQVFDLFNBQVIsQ0FBa0JSLFlBQWxCLENBQVQ7O0FBQ0EsU0FBT0UsTUFBUDtBQUNDLFlBQU0sSUFBSU4sT0FBT2EsS0FBWCxDQUFpQixHQUFqQixFQUFzQixTQUF0QixDQUFOO0FBQ0EsYUFBTyxLQUFQO0FDQ0U7O0FEQUhSLGlCQUFhQyxPQUFPUSxFQUFwQjtBQUVBVCxlQUFXVSxNQUFYLENBQWtCO0FBQ2pCQyxXQUFLO0FBQUNDLGFBQUtkLEtBQUtlLEtBQUwsQ0FBVyxHQUFYO0FBQU47QUFEWSxLQUFsQixFQUVHaEIsT0FGSCxFQUVZO0FBQUNpQixhQUFNO0FBQVAsS0FGWjtBQUdBLFdBQU8sSUFBUDtBQWpCRDtBQW1CQSxlQUFhLFVBQUNqQixPQUFELEVBQVVrQixFQUFWO0FBQ1osUUFBQWhCLFlBQUEsRUFBQUMsVUFBQSxFQUFBQyxNQUFBOztBQUFBRixtQkFBZUYsUUFBUSxNQUFSLEVBQWdCRSxZQUEvQjtBQUVBSSxVQUFNTixPQUFOLEVBQWVPLE1BQWY7QUFDQUQsVUFBTUosWUFBTixFQUFvQk0sTUFBcEI7QUFDQSxXQUFPUixRQUFRLE1BQVIsRUFBZ0JDLElBQXZCO0FBQ0EsV0FBT0QsUUFBUSxNQUFSLEVBQWdCRSxZQUF2QjtBQUNBRSxhQUFTSyxRQUFRQyxTQUFSLENBQWtCUixZQUFsQixDQUFUOztBQUNBLFNBQU9FLE1BQVA7QUFDQyxZQUFNLElBQUlOLE9BQU9hLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IsU0FBdEIsQ0FBTjtBQUNBLGFBQU8sS0FBUDtBQ0tFOztBREpIUixpQkFBYUMsT0FBT1EsRUFBcEI7QUFDQVQsZUFBV1UsTUFBWCxDQUFrQjtBQUFDQyxXQUFLSTtBQUFOLEtBQWxCLEVBQTZCbEIsT0FBN0I7QUFDQSxXQUFPLElBQVA7QUFoQ0Q7QUFrQ0EsZUFBYSxVQUFDQSxPQUFEO0FBQ1osUUFBQWMsR0FBQSxFQUFBWixZQUFBLEVBQUFDLFVBQUEsRUFBQUMsTUFBQTs7QUFBQ0YsbUJBQWdCRixRQUFBRSxZQUFoQjtBQUNESSxVQUFNTixPQUFOLEVBQWVPLE1BQWY7QUFDQUQsVUFBTUosWUFBTixFQUFvQk0sTUFBcEI7QUFDQSxXQUFPUixRQUFRQyxJQUFmO0FBQ0EsV0FBT0QsUUFBUUUsWUFBZjtBQUNBRSxhQUFTSyxRQUFRQyxTQUFSLENBQWtCUixZQUFsQixDQUFUOztBQUNBLFNBQU9FLE1BQVA7QUFDQyxZQUFNLElBQUlOLE9BQU9hLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IsU0FBdEIsQ0FBTjtBQUNBLGFBQU8sS0FBUDtBQ1NFOztBRFJIUixpQkFBYUMsT0FBT1EsRUFBcEI7QUFDQUUsVUFBTVgsV0FBV2dCLE1BQVgsQ0FBa0JuQixPQUFsQixDQUFOO0FBQ0EsV0FBT0csV0FBV2lCLE9BQVgsQ0FBbUJOLEdBQW5CLENBQVA7QUE5Q0Q7QUFBQSxDQURELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfY3JlYXRvci1hdXRvZm9ybS1tb2RhbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJNZXRlb3IubWV0aG9kc1xuXHRcImFmX211bHRpcGxlX3VwZGF0ZVwiOiAob3B0aW9ucyktPlxuXHRcdGNoZWNrIG9wdGlvbnMsIE9iamVjdFxuXHRcdHsgX2lkcywgX29iamVjdF9uYW1lfSA9IG9wdGlvbnNbJyRzZXQnXVxuXHRcdGNoZWNrIF9pZHMsIFN0cmluZ1xuXHRcdGNoZWNrIF9vYmplY3RfbmFtZSwgU3RyaW5nXG5cblx0XHRkZWxldGUgb3B0aW9uc1snJHNldCddLl9pZHNcblx0XHRkZWxldGUgb3B0aW9uc1snJHNldCddLl9vYmplY3RfbmFtZVxuXHRcdG9iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KF9vYmplY3RfbmFtZSlcblx0XHR1bmxlc3Mgb2JqZWN0XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCLmnKrmib7liLDmjIflrprlr7nosaFcIilcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdGNvbGxlY3Rpb24gPSBvYmplY3QuZGJcblx0XHQjIGNvbnNvbGUubG9nIFwiYWZfbW9kYWxfbXVsdGlwbGVfdXBkYXRlLG9wdGlvbnMyOlwiLCBvcHRpb25zXG5cdFx0Y29sbGVjdGlvbi51cGRhdGUge1xuXHRcdFx0X2lkOiB7JGluOiBfaWRzLnNwbGl0KFwiLFwiKX1cblx0XHR9LCBvcHRpb25zLCB7bXVsdGk6dHJ1ZX1cblx0XHRyZXR1cm4gdHJ1ZVxuXG5cdFwiYWZfdXBkYXRlXCI6IChvcHRpb25zLCBpZCktPlxuXHRcdF9vYmplY3RfbmFtZSA9IG9wdGlvbnNbXCIkc2V0XCJdLl9vYmplY3RfbmFtZVxuXG5cdFx0Y2hlY2sgb3B0aW9ucywgT2JqZWN0XG5cdFx0Y2hlY2sgX29iamVjdF9uYW1lLCBTdHJpbmdcblx0XHRkZWxldGUgb3B0aW9uc1tcIiRzZXRcIl0uX2lkc1xuXHRcdGRlbGV0ZSBvcHRpb25zW1wiJHNldFwiXS5fb2JqZWN0X25hbWVcblx0XHRvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChfb2JqZWN0X25hbWUpXG5cdFx0dW5sZXNzIG9iamVjdFxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwi5pyq5om+5Yiw5oyH5a6a5a+56LGhXCIpXG5cdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRjb2xsZWN0aW9uID0gb2JqZWN0LmRiXG5cdFx0Y29sbGVjdGlvbi51cGRhdGUge19pZDogaWR9LCBvcHRpb25zXG5cdFx0cmV0dXJuIHRydWVcblxuXHRcImFmX2luc2VydFwiOiAob3B0aW9ucyktPlxuXHRcdHtfb2JqZWN0X25hbWV9ID0gb3B0aW9uc1xuXHRcdGNoZWNrIG9wdGlvbnMsIE9iamVjdFxuXHRcdGNoZWNrIF9vYmplY3RfbmFtZSwgU3RyaW5nXG5cdFx0ZGVsZXRlIG9wdGlvbnMuX2lkc1xuXHRcdGRlbGV0ZSBvcHRpb25zLl9vYmplY3RfbmFtZVxuXHRcdG9iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KF9vYmplY3RfbmFtZSlcblx0XHR1bmxlc3Mgb2JqZWN0XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCLmnKrmib7liLDmjIflrprlr7nosaFcIilcblx0XHRcdHJldHVybiBmYWxzZVxuXHRcdGNvbGxlY3Rpb24gPSBvYmplY3QuZGJcblx0XHRfaWQgPSBjb2xsZWN0aW9uLmluc2VydCBvcHRpb25zXG5cdFx0cmV0dXJuIGNvbGxlY3Rpb24uZmluZE9uZShfaWQpIiwiTWV0ZW9yLm1ldGhvZHMoe1xuICBcImFmX211bHRpcGxlX3VwZGF0ZVwiOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIF9pZHMsIF9vYmplY3RfbmFtZSwgY29sbGVjdGlvbiwgb2JqZWN0LCByZWY7XG4gICAgY2hlY2sob3B0aW9ucywgT2JqZWN0KTtcbiAgICByZWYgPSBvcHRpb25zWyckc2V0J10sIF9pZHMgPSByZWYuX2lkcywgX29iamVjdF9uYW1lID0gcmVmLl9vYmplY3RfbmFtZTtcbiAgICBjaGVjayhfaWRzLCBTdHJpbmcpO1xuICAgIGNoZWNrKF9vYmplY3RfbmFtZSwgU3RyaW5nKTtcbiAgICBkZWxldGUgb3B0aW9uc1snJHNldCddLl9pZHM7XG4gICAgZGVsZXRlIG9wdGlvbnNbJyRzZXQnXS5fb2JqZWN0X25hbWU7XG4gICAgb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3QoX29iamVjdF9uYW1lKTtcbiAgICBpZiAoIW9iamVjdCkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwi5pyq5om+5Yiw5oyH5a6a5a+56LGhXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb2xsZWN0aW9uID0gb2JqZWN0LmRiO1xuICAgIGNvbGxlY3Rpb24udXBkYXRlKHtcbiAgICAgIF9pZDoge1xuICAgICAgICAkaW46IF9pZHMuc3BsaXQoXCIsXCIpXG4gICAgICB9XG4gICAgfSwgb3B0aW9ucywge1xuICAgICAgbXVsdGk6IHRydWVcbiAgICB9KTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcbiAgXCJhZl91cGRhdGVcIjogZnVuY3Rpb24ob3B0aW9ucywgaWQpIHtcbiAgICB2YXIgX29iamVjdF9uYW1lLCBjb2xsZWN0aW9uLCBvYmplY3Q7XG4gICAgX29iamVjdF9uYW1lID0gb3B0aW9uc1tcIiRzZXRcIl0uX29iamVjdF9uYW1lO1xuICAgIGNoZWNrKG9wdGlvbnMsIE9iamVjdCk7XG4gICAgY2hlY2soX29iamVjdF9uYW1lLCBTdHJpbmcpO1xuICAgIGRlbGV0ZSBvcHRpb25zW1wiJHNldFwiXS5faWRzO1xuICAgIGRlbGV0ZSBvcHRpb25zW1wiJHNldFwiXS5fb2JqZWN0X25hbWU7XG4gICAgb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3QoX29iamVjdF9uYW1lKTtcbiAgICBpZiAoIW9iamVjdCkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwi5pyq5om+5Yiw5oyH5a6a5a+56LGhXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb2xsZWN0aW9uID0gb2JqZWN0LmRiO1xuICAgIGNvbGxlY3Rpb24udXBkYXRlKHtcbiAgICAgIF9pZDogaWRcbiAgICB9LCBvcHRpb25zKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcbiAgXCJhZl9pbnNlcnRcIjogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBfaWQsIF9vYmplY3RfbmFtZSwgY29sbGVjdGlvbiwgb2JqZWN0O1xuICAgIF9vYmplY3RfbmFtZSA9IG9wdGlvbnMuX29iamVjdF9uYW1lO1xuICAgIGNoZWNrKG9wdGlvbnMsIE9iamVjdCk7XG4gICAgY2hlY2soX29iamVjdF9uYW1lLCBTdHJpbmcpO1xuICAgIGRlbGV0ZSBvcHRpb25zLl9pZHM7XG4gICAgZGVsZXRlIG9wdGlvbnMuX29iamVjdF9uYW1lO1xuICAgIG9iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KF9vYmplY3RfbmFtZSk7XG4gICAgaWYgKCFvYmplY3QpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIuacquaJvuWIsOaMh+WumuWvueixoVwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29sbGVjdGlvbiA9IG9iamVjdC5kYjtcbiAgICBfaWQgPSBjb2xsZWN0aW9uLmluc2VydChvcHRpb25zKTtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5maW5kT25lKF9pZCk7XG4gIH1cbn0pO1xuIl19
