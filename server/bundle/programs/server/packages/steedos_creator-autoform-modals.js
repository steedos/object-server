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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19jcmVhdG9yLWF1dG9mb3JtLW1vZGFscy9saWIvc2VydmVyL2NvcmUuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9saWIvc2VydmVyL2NvcmUuY29mZmVlIl0sIm5hbWVzIjpbIk1ldGVvciIsIm1ldGhvZHMiLCJvcHRpb25zIiwiX2lkcyIsIl9vYmplY3RfbmFtZSIsImNvbGxlY3Rpb24iLCJvYmplY3QiLCJyZWYiLCJjaGVjayIsIk9iamVjdCIsIlN0cmluZyIsIkNyZWF0b3IiLCJnZXRPYmplY3QiLCJFcnJvciIsImRiIiwidXBkYXRlIiwiX2lkIiwiJGluIiwic3BsaXQiLCJtdWx0aSIsImlkIiwiaW5zZXJ0IiwiZmluZE9uZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLE9BQU9DLE9BQVAsQ0FDQztBQUFBLHdCQUFzQixVQUFDQyxPQUFEO0FBQ3JCLFFBQUFDLElBQUEsRUFBQUMsWUFBQSxFQUFBQyxVQUFBLEVBQUFDLE1BQUEsRUFBQUMsR0FBQTs7QUFBQUMsVUFBTU4sT0FBTixFQUFlTyxNQUFmO0FBQ0FGLFVBQXdCTCxRQUFRLE1BQVIsQ0FBeEIsRUFBRUMsT0FBQUksSUFBQUosSUFBRixFQUFRQyxlQUFBRyxJQUFBSCxZQUFSO0FBQ0FJLFVBQU1MLElBQU4sRUFBWU8sTUFBWjtBQUNBRixVQUFNSixZQUFOLEVBQW9CTSxNQUFwQjtBQUVBLFdBQU9SLFFBQVEsTUFBUixFQUFnQkMsSUFBdkI7QUFDQSxXQUFPRCxRQUFRLE1BQVIsRUFBZ0JFLFlBQXZCO0FBQ0FFLGFBQVNLLFFBQVFDLFNBQVIsQ0FBa0JSLFlBQWxCLENBQVQ7O0FBQ0EsU0FBT0UsTUFBUDtBQUNDLFlBQU0sSUFBSU4sT0FBT2EsS0FBWCxDQUFpQixHQUFqQixFQUFzQixTQUF0QixDQUFOO0FBQ0EsYUFBTyxLQUFQO0FDQ0U7O0FEQUhSLGlCQUFhQyxPQUFPUSxFQUFwQjtBQUVBVCxlQUFXVSxNQUFYLENBQWtCO0FBQ2pCQyxXQUFLO0FBQUNDLGFBQUtkLEtBQUtlLEtBQUwsQ0FBVyxHQUFYO0FBQU47QUFEWSxLQUFsQixFQUVHaEIsT0FGSCxFQUVZO0FBQUNpQixhQUFNO0FBQVAsS0FGWjtBQUdBLFdBQU8sSUFBUDtBQWpCRDtBQW1CQSxlQUFhLFVBQUNqQixPQUFELEVBQVVrQixFQUFWO0FBQ1osUUFBQWhCLFlBQUEsRUFBQUMsVUFBQSxFQUFBQyxNQUFBOztBQUFBRixtQkFBZUYsUUFBUSxNQUFSLEVBQWdCRSxZQUEvQjtBQUVBSSxVQUFNTixPQUFOLEVBQWVPLE1BQWY7QUFDQUQsVUFBTUosWUFBTixFQUFvQk0sTUFBcEI7QUFDQSxXQUFPUixRQUFRLE1BQVIsRUFBZ0JDLElBQXZCO0FBQ0EsV0FBT0QsUUFBUSxNQUFSLEVBQWdCRSxZQUF2QjtBQUNBRSxhQUFTSyxRQUFRQyxTQUFSLENBQWtCUixZQUFsQixDQUFUOztBQUNBLFNBQU9FLE1BQVA7QUFDQyxZQUFNLElBQUlOLE9BQU9hLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IsU0FBdEIsQ0FBTjtBQUNBLGFBQU8sS0FBUDtBQ0tFOztBREpIUixpQkFBYUMsT0FBT1EsRUFBcEI7QUFDQVQsZUFBV1UsTUFBWCxDQUFrQjtBQUFDQyxXQUFLSTtBQUFOLEtBQWxCLEVBQTZCbEIsT0FBN0I7QUFDQSxXQUFPLElBQVA7QUFoQ0Q7QUFrQ0EsZUFBYSxVQUFDQSxPQUFEO0FBQ1osUUFBQWMsR0FBQSxFQUFBWixZQUFBLEVBQUFDLFVBQUEsRUFBQUMsTUFBQTs7QUFBQ0YsbUJBQWdCRixRQUFBRSxZQUFoQjtBQUNESSxVQUFNTixPQUFOLEVBQWVPLE1BQWY7QUFDQUQsVUFBTUosWUFBTixFQUFvQk0sTUFBcEI7QUFDQSxXQUFPUixRQUFRQyxJQUFmO0FBQ0EsV0FBT0QsUUFBUUUsWUFBZjtBQUNBRSxhQUFTSyxRQUFRQyxTQUFSLENBQWtCUixZQUFsQixDQUFUOztBQUNBLFNBQU9FLE1BQVA7QUFDQyxZQUFNLElBQUlOLE9BQU9hLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IsU0FBdEIsQ0FBTjtBQUNBLGFBQU8sS0FBUDtBQ1NFOztBRFJIUixpQkFBYUMsT0FBT1EsRUFBcEI7QUFDQUUsVUFBTVgsV0FBV2dCLE1BQVgsQ0FBa0JuQixPQUFsQixDQUFOO0FBQ0EsV0FBT0csV0FBV2lCLE9BQVgsQ0FBbUJOLEdBQW5CLENBQVA7QUE5Q0Q7QUFBQSxDQURELEUiLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfY3JlYXRvci1hdXRvZm9ybS1tb2RhbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJNZXRlb3IubWV0aG9kc1xyXG5cdFwiYWZfbXVsdGlwbGVfdXBkYXRlXCI6IChvcHRpb25zKS0+XHJcblx0XHRjaGVjayBvcHRpb25zLCBPYmplY3RcclxuXHRcdHsgX2lkcywgX29iamVjdF9uYW1lfSA9IG9wdGlvbnNbJyRzZXQnXVxyXG5cdFx0Y2hlY2sgX2lkcywgU3RyaW5nXHJcblx0XHRjaGVjayBfb2JqZWN0X25hbWUsIFN0cmluZ1xyXG5cclxuXHRcdGRlbGV0ZSBvcHRpb25zWyckc2V0J10uX2lkc1xyXG5cdFx0ZGVsZXRlIG9wdGlvbnNbJyRzZXQnXS5fb2JqZWN0X25hbWVcclxuXHRcdG9iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KF9vYmplY3RfbmFtZSlcclxuXHRcdHVubGVzcyBvYmplY3RcclxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDMsIFwi5pyq5om+5Yiw5oyH5a6a5a+56LGhXCIpXHJcblx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0Y29sbGVjdGlvbiA9IG9iamVjdC5kYlxyXG5cdFx0IyBjb25zb2xlLmxvZyBcImFmX21vZGFsX211bHRpcGxlX3VwZGF0ZSxvcHRpb25zMjpcIiwgb3B0aW9uc1xyXG5cdFx0Y29sbGVjdGlvbi51cGRhdGUge1xyXG5cdFx0XHRfaWQ6IHskaW46IF9pZHMuc3BsaXQoXCIsXCIpfVxyXG5cdFx0fSwgb3B0aW9ucywge211bHRpOnRydWV9XHJcblx0XHRyZXR1cm4gdHJ1ZVxyXG5cclxuXHRcImFmX3VwZGF0ZVwiOiAob3B0aW9ucywgaWQpLT5cclxuXHRcdF9vYmplY3RfbmFtZSA9IG9wdGlvbnNbXCIkc2V0XCJdLl9vYmplY3RfbmFtZVxyXG5cclxuXHRcdGNoZWNrIG9wdGlvbnMsIE9iamVjdFxyXG5cdFx0Y2hlY2sgX29iamVjdF9uYW1lLCBTdHJpbmdcclxuXHRcdGRlbGV0ZSBvcHRpb25zW1wiJHNldFwiXS5faWRzXHJcblx0XHRkZWxldGUgb3B0aW9uc1tcIiRzZXRcIl0uX29iamVjdF9uYW1lXHJcblx0XHRvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChfb2JqZWN0X25hbWUpXHJcblx0XHR1bmxlc3Mgb2JqZWN0XHJcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIuacquaJvuWIsOaMh+WumuWvueixoVwiKVxyXG5cdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdGNvbGxlY3Rpb24gPSBvYmplY3QuZGJcclxuXHRcdGNvbGxlY3Rpb24udXBkYXRlIHtfaWQ6IGlkfSwgb3B0aW9uc1xyXG5cdFx0cmV0dXJuIHRydWVcclxuXHJcblx0XCJhZl9pbnNlcnRcIjogKG9wdGlvbnMpLT5cclxuXHRcdHtfb2JqZWN0X25hbWV9ID0gb3B0aW9uc1xyXG5cdFx0Y2hlY2sgb3B0aW9ucywgT2JqZWN0XHJcblx0XHRjaGVjayBfb2JqZWN0X25hbWUsIFN0cmluZ1xyXG5cdFx0ZGVsZXRlIG9wdGlvbnMuX2lkc1xyXG5cdFx0ZGVsZXRlIG9wdGlvbnMuX29iamVjdF9uYW1lXHJcblx0XHRvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChfb2JqZWN0X25hbWUpXHJcblx0XHR1bmxlc3Mgb2JqZWN0XHJcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIuacquaJvuWIsOaMh+WumuWvueixoVwiKVxyXG5cdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdGNvbGxlY3Rpb24gPSBvYmplY3QuZGJcclxuXHRcdF9pZCA9IGNvbGxlY3Rpb24uaW5zZXJ0IG9wdGlvbnNcclxuXHRcdHJldHVybiBjb2xsZWN0aW9uLmZpbmRPbmUoX2lkKSIsIk1ldGVvci5tZXRob2RzKHtcbiAgXCJhZl9tdWx0aXBsZV91cGRhdGVcIjogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBfaWRzLCBfb2JqZWN0X25hbWUsIGNvbGxlY3Rpb24sIG9iamVjdCwgcmVmO1xuICAgIGNoZWNrKG9wdGlvbnMsIE9iamVjdCk7XG4gICAgcmVmID0gb3B0aW9uc1snJHNldCddLCBfaWRzID0gcmVmLl9pZHMsIF9vYmplY3RfbmFtZSA9IHJlZi5fb2JqZWN0X25hbWU7XG4gICAgY2hlY2soX2lkcywgU3RyaW5nKTtcbiAgICBjaGVjayhfb2JqZWN0X25hbWUsIFN0cmluZyk7XG4gICAgZGVsZXRlIG9wdGlvbnNbJyRzZXQnXS5faWRzO1xuICAgIGRlbGV0ZSBvcHRpb25zWyckc2V0J10uX29iamVjdF9uYW1lO1xuICAgIG9iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KF9vYmplY3RfbmFtZSk7XG4gICAgaWYgKCFvYmplY3QpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIuacquaJvuWIsOaMh+WumuWvueixoVwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29sbGVjdGlvbiA9IG9iamVjdC5kYjtcbiAgICBjb2xsZWN0aW9uLnVwZGF0ZSh7XG4gICAgICBfaWQ6IHtcbiAgICAgICAgJGluOiBfaWRzLnNwbGl0KFwiLFwiKVxuICAgICAgfVxuICAgIH0sIG9wdGlvbnMsIHtcbiAgICAgIG11bHRpOiB0cnVlXG4gICAgfSk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG4gIFwiYWZfdXBkYXRlXCI6IGZ1bmN0aW9uKG9wdGlvbnMsIGlkKSB7XG4gICAgdmFyIF9vYmplY3RfbmFtZSwgY29sbGVjdGlvbiwgb2JqZWN0O1xuICAgIF9vYmplY3RfbmFtZSA9IG9wdGlvbnNbXCIkc2V0XCJdLl9vYmplY3RfbmFtZTtcbiAgICBjaGVjayhvcHRpb25zLCBPYmplY3QpO1xuICAgIGNoZWNrKF9vYmplY3RfbmFtZSwgU3RyaW5nKTtcbiAgICBkZWxldGUgb3B0aW9uc1tcIiRzZXRcIl0uX2lkcztcbiAgICBkZWxldGUgb3B0aW9uc1tcIiRzZXRcIl0uX29iamVjdF9uYW1lO1xuICAgIG9iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KF9vYmplY3RfbmFtZSk7XG4gICAgaWYgKCFvYmplY3QpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAzLCBcIuacquaJvuWIsOaMh+WumuWvueixoVwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgY29sbGVjdGlvbiA9IG9iamVjdC5kYjtcbiAgICBjb2xsZWN0aW9uLnVwZGF0ZSh7XG4gICAgICBfaWQ6IGlkXG4gICAgfSwgb3B0aW9ucyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG4gIFwiYWZfaW5zZXJ0XCI6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgX2lkLCBfb2JqZWN0X25hbWUsIGNvbGxlY3Rpb24sIG9iamVjdDtcbiAgICBfb2JqZWN0X25hbWUgPSBvcHRpb25zLl9vYmplY3RfbmFtZTtcbiAgICBjaGVjayhvcHRpb25zLCBPYmplY3QpO1xuICAgIGNoZWNrKF9vYmplY3RfbmFtZSwgU3RyaW5nKTtcbiAgICBkZWxldGUgb3B0aW9ucy5faWRzO1xuICAgIGRlbGV0ZSBvcHRpb25zLl9vYmplY3RfbmFtZTtcbiAgICBvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChfb2JqZWN0X25hbWUpO1xuICAgIGlmICghb2JqZWN0KSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMywgXCLmnKrmib7liLDmjIflrprlr7nosaFcIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGNvbGxlY3Rpb24gPSBvYmplY3QuZGI7XG4gICAgX2lkID0gY29sbGVjdGlvbi5pbnNlcnQob3B0aW9ucyk7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uZmluZE9uZShfaWQpO1xuICB9XG59KTtcbiJdfQ==
