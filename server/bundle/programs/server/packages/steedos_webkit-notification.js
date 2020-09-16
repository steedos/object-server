(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Push = Package['raix:push'].Push;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ECMAScript = Package.ecmascript.ECMAScript;
var SubsManager = Package['meteorhacks:subs-manager'].SubsManager;
var Selector = Package['steedos:base'].Selector;
var Steedos = Package['steedos:base'].Steedos;
var AjaxCollection = Package['steedos:base'].AjaxCollection;
var SteedosDataManager = Package['steedos:base'].SteedosDataManager;
var SteedosOffice = Package['steedos:base'].SteedosOffice;
var billingManager = Package['steedos:base'].billingManager;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var meteorInstall = Package.modules.meteorInstall;

/* Package-scope variables */
var __coffeescriptShare;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:webkit-notification":{"server":{"models":{"raix_push_notifications.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/steedos_webkit-notification/server/models/raix_push_notifications.coff //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
db.raix_push_notifications = Push.notifications;

if (Meteor.isServer) {
  Meteor.publish('raix_push_notifications', function () {
    var query;

    if (!this.userId) {
      return this.ready();
    }

    query = {
      query: {
        $regex: "{\"userId\":\"" + this.userId + "\","
      },
      createdAt: {
        $gt: new Date()
      }
    };
    return db.raix_push_notifications.find(query, {
      fields: {
        badge: 1,
        from: 1,
        title: 1,
        text: 1,
        payload: 1
      },
      sort: {
        createdAt: -1
      },
      limit: 5
    });
  });
}
/////////////////////////////////////////////////////////////////////////////////////

}},"methods":{"calculate_box.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////
//                                                                                 //
// packages/steedos_webkit-notification/server/methods/calculate_box.coffee        //
//                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////
                                                                                   //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.methods({
  calculateBox: function (instanceId) {
    var box, cc_users, inbox_users, instance, userId;
    check(instanceId, String);
    userId = this.userId;
    instance = db.instances.findOne({
      _id: instanceId
    }, {
      fields: {
        inbox_users: 1,
        cc_users: 1
      }
    });
    inbox_users = instance.inbox_users;
    cc_users = instance.cc_users;
    box = "";

    if (_.indexOf(inbox_users, userId) >= 0 || _.indexOf(cc_users, userId) >= 0) {
      box = "inbox";
    } else {
      box = "outbox";
    }

    return box;
  }
});
/////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:webkit-notification/server/models/raix_push_notifications.coffee");
require("/node_modules/meteor/steedos:webkit-notification/server/methods/calculate_box.coffee");

/* Exports */
Package._define("steedos:webkit-notification");

})();

//# sourceURL=meteor://💻app/packages/steedos_webkit-notification.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc193ZWJraXQtbm90aWZpY2F0aW9uL3NlcnZlci9tb2RlbHMvcmFpeF9wdXNoX25vdGlmaWNhdGlvbnMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbW9kZWxzL3JhaXhfcHVzaF9ub3RpZmljYXRpb25zLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc193ZWJraXQtbm90aWZpY2F0aW9uL3NlcnZlci9tZXRob2RzL2NhbGN1bGF0ZV9ib3guY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWV0aG9kcy9jYWxjdWxhdGVfYm94LmNvZmZlZSJdLCJuYW1lcyI6WyJkYiIsInJhaXhfcHVzaF9ub3RpZmljYXRpb25zIiwiUHVzaCIsIm5vdGlmaWNhdGlvbnMiLCJNZXRlb3IiLCJpc1NlcnZlciIsInB1Ymxpc2giLCJxdWVyeSIsInVzZXJJZCIsInJlYWR5IiwiJHJlZ2V4IiwiY3JlYXRlZEF0IiwiJGd0IiwiRGF0ZSIsImZpbmQiLCJmaWVsZHMiLCJiYWRnZSIsImZyb20iLCJ0aXRsZSIsInRleHQiLCJwYXlsb2FkIiwic29ydCIsImxpbWl0IiwibWV0aG9kcyIsImNhbGN1bGF0ZUJveCIsImluc3RhbmNlSWQiLCJib3giLCJjY191c2VycyIsImluYm94X3VzZXJzIiwiaW5zdGFuY2UiLCJjaGVjayIsIlN0cmluZyIsImluc3RhbmNlcyIsImZpbmRPbmUiLCJfaWQiLCJfIiwiaW5kZXhPZiJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0FBLEdBQUdDLHVCQUFILEdBQTZCQyxLQUFLQyxhQUFsQzs7QUFFQSxJQUFHQyxPQUFPQyxRQUFWO0FBQ0lELFNBQU9FLE9BQVAsQ0FBZSx5QkFBZixFQUEwQztBQUV0QyxRQUFBQyxLQUFBOztBQUFBLFNBQU8sS0FBS0MsTUFBWjtBQUNJLGFBQU8sS0FBS0MsS0FBTCxFQUFQO0FDRlA7O0FETUdGLFlBQVE7QUFBQ0EsYUFBTztBQUFDRyxnQkFBTyxtQkFBbUIsS0FBS0YsTUFBeEIsR0FBaUM7QUFBekMsT0FBUjtBQUF3REcsaUJBQVU7QUFBQ0MsYUFBSyxJQUFJQyxJQUFKO0FBQU47QUFBbEUsS0FBUjtBQUVBLFdBQU9iLEdBQUdDLHVCQUFILENBQTJCYSxJQUEzQixDQUFnQ1AsS0FBaEMsRUFBdUM7QUFBQ1EsY0FBUTtBQUFDQyxlQUFNLENBQVA7QUFBVUMsY0FBSyxDQUFmO0FBQWtCQyxlQUFPLENBQXpCO0FBQTRCQyxjQUFLLENBQWpDO0FBQW9DQyxpQkFBUTtBQUE1QyxPQUFUO0FBQXlEQyxZQUFLO0FBQUNWLG1CQUFVLENBQUM7QUFBWixPQUE5RDtBQUE2RVcsYUFBTTtBQUFuRixLQUF2QyxDQUFQO0FBVEo7QUN3QkgsQzs7Ozs7Ozs7Ozs7O0FDOUJEbEIsT0FBT21CLE9BQVAsQ0FDQztBQUFBQyxnQkFBYyxVQUFDQyxVQUFEO0FBQ2IsUUFBQUMsR0FBQSxFQUFBQyxRQUFBLEVBQUFDLFdBQUEsRUFBQUMsUUFBQSxFQUFBckIsTUFBQTtBQUFBc0IsVUFBTUwsVUFBTixFQUFrQk0sTUFBbEI7QUFDQXZCLGFBQVMsS0FBS0EsTUFBZDtBQUNBcUIsZUFBVzdCLEdBQUdnQyxTQUFILENBQWFDLE9BQWIsQ0FBcUI7QUFBQ0MsV0FBS1Q7QUFBTixLQUFyQixFQUF1QztBQUFDVixjQUFRO0FBQUNhLHFCQUFhLENBQWQ7QUFBaUJELGtCQUFVO0FBQTNCO0FBQVQsS0FBdkMsQ0FBWDtBQUNBQyxrQkFBY0MsU0FBU0QsV0FBdkI7QUFDQUQsZUFBV0UsU0FBU0YsUUFBcEI7QUFFQUQsVUFBTSxFQUFOOztBQUVBLFFBQUdTLEVBQUVDLE9BQUYsQ0FBVVIsV0FBVixFQUF1QnBCLE1BQXZCLEtBQWtDLENBQWxDLElBQXVDMkIsRUFBRUMsT0FBRixDQUFVVCxRQUFWLEVBQW9CbkIsTUFBcEIsS0FBK0IsQ0FBekU7QUFDQ2tCLFlBQU0sT0FBTjtBQUREO0FBR0NBLFlBQU0sUUFBTjtBQ09FOztBRExILFdBQU9BLEdBQVA7QUFkRDtBQUFBLENBREQsRSIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc193ZWJraXQtbm90aWZpY2F0aW9uLmpzIiwic291cmNlc0NvbnRlbnQiOlsiXG4jIGRiLnJhaXhfcHVzaF9ub3RpZmljYXRpb25zID0gbmV3IE1vbmdvLkNvbGxlY3Rpb24oJ19yYWl4X3B1c2hfbm90aWZpY2F0aW9ucycpO1xuXG5kYi5yYWl4X3B1c2hfbm90aWZpY2F0aW9ucyA9IFB1c2gubm90aWZpY2F0aW9uc1xuXG5pZiBNZXRlb3IuaXNTZXJ2ZXJcbiAgICBNZXRlb3IucHVibGlzaCAncmFpeF9wdXNoX25vdGlmaWNhdGlvbnMnLCAtPlxuXG4gICAgICAgIHVubGVzcyB0aGlzLnVzZXJJZFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVhZHkoKVxuXG4gICAgICAgICMgYXBwTmFtZSA9IFwid29ya2Zsb3dcIlxuICAgICAgICBcbiAgICAgICAgcXVlcnkgPSB7cXVlcnk6IHskcmVnZXg6XCJ7XFxcInVzZXJJZFxcXCI6XFxcIlwiICsgdGhpcy51c2VySWQgKyBcIlxcXCIsXCJ9LGNyZWF0ZWRBdDp7JGd0OiBuZXcgRGF0ZSgpfX1cblxuICAgICAgICByZXR1cm4gZGIucmFpeF9wdXNoX25vdGlmaWNhdGlvbnMuZmluZChxdWVyeSwge2ZpZWxkczoge2JhZGdlOjEsIGZyb206MSwgdGl0bGU6IDEsIHRleHQ6MSwgcGF5bG9hZDoxfSwgc29ydDp7Y3JlYXRlZEF0Oi0xfSxsaW1pdDo1fSkiLCJkYi5yYWl4X3B1c2hfbm90aWZpY2F0aW9ucyA9IFB1c2gubm90aWZpY2F0aW9ucztcblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICBNZXRlb3IucHVibGlzaCgncmFpeF9wdXNoX25vdGlmaWNhdGlvbnMnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgcXVlcnk7XG4gICAgaWYgKCF0aGlzLnVzZXJJZCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVhZHkoKTtcbiAgICB9XG4gICAgcXVlcnkgPSB7XG4gICAgICBxdWVyeToge1xuICAgICAgICAkcmVnZXg6IFwie1xcXCJ1c2VySWRcXFwiOlxcXCJcIiArIHRoaXMudXNlcklkICsgXCJcXFwiLFwiXG4gICAgICB9LFxuICAgICAgY3JlYXRlZEF0OiB7XG4gICAgICAgICRndDogbmV3IERhdGUoKVxuICAgICAgfVxuICAgIH07XG4gICAgcmV0dXJuIGRiLnJhaXhfcHVzaF9ub3RpZmljYXRpb25zLmZpbmQocXVlcnksIHtcbiAgICAgIGZpZWxkczoge1xuICAgICAgICBiYWRnZTogMSxcbiAgICAgICAgZnJvbTogMSxcbiAgICAgICAgdGl0bGU6IDEsXG4gICAgICAgIHRleHQ6IDEsXG4gICAgICAgIHBheWxvYWQ6IDFcbiAgICAgIH0sXG4gICAgICBzb3J0OiB7XG4gICAgICAgIGNyZWF0ZWRBdDogLTFcbiAgICAgIH0sXG4gICAgICBsaW1pdDogNVxuICAgIH0pO1xuICB9KTtcbn1cbiIsIk1ldGVvci5tZXRob2RzXG5cdGNhbGN1bGF0ZUJveDogKGluc3RhbmNlSWQpIC0+XG5cdFx0Y2hlY2sgaW5zdGFuY2VJZCwgU3RyaW5nXG5cdFx0dXNlcklkID0gdGhpcy51c2VySWRcblx0XHRpbnN0YW5jZSA9IGRiLmluc3RhbmNlcy5maW5kT25lKHtfaWQ6IGluc3RhbmNlSWR9LHtmaWVsZHM6IHtpbmJveF91c2VyczogMSwgY2NfdXNlcnM6IDF9fSlcblx0XHRpbmJveF91c2VycyA9IGluc3RhbmNlLmluYm94X3VzZXJzXG5cdFx0Y2NfdXNlcnMgPSBpbnN0YW5jZS5jY191c2Vyc1xuXG5cdFx0Ym94ID0gXCJcIlxuXG5cdFx0aWYgXy5pbmRleE9mKGluYm94X3VzZXJzLCB1c2VySWQpID49IDAgfHwgXy5pbmRleE9mKGNjX3VzZXJzLCB1c2VySWQpID49IDBcblx0XHRcdGJveCA9IFwiaW5ib3hcIlxuXHRcdGVsc2Vcblx0XHRcdGJveCA9IFwib3V0Ym94XCJcblxuXHRcdHJldHVybiBib3giLCJNZXRlb3IubWV0aG9kcyh7XG4gIGNhbGN1bGF0ZUJveDogZnVuY3Rpb24oaW5zdGFuY2VJZCkge1xuICAgIHZhciBib3gsIGNjX3VzZXJzLCBpbmJveF91c2VycywgaW5zdGFuY2UsIHVzZXJJZDtcbiAgICBjaGVjayhpbnN0YW5jZUlkLCBTdHJpbmcpO1xuICAgIHVzZXJJZCA9IHRoaXMudXNlcklkO1xuICAgIGluc3RhbmNlID0gZGIuaW5zdGFuY2VzLmZpbmRPbmUoe1xuICAgICAgX2lkOiBpbnN0YW5jZUlkXG4gICAgfSwge1xuICAgICAgZmllbGRzOiB7XG4gICAgICAgIGluYm94X3VzZXJzOiAxLFxuICAgICAgICBjY191c2VyczogMVxuICAgICAgfVxuICAgIH0pO1xuICAgIGluYm94X3VzZXJzID0gaW5zdGFuY2UuaW5ib3hfdXNlcnM7XG4gICAgY2NfdXNlcnMgPSBpbnN0YW5jZS5jY191c2VycztcbiAgICBib3ggPSBcIlwiO1xuICAgIGlmIChfLmluZGV4T2YoaW5ib3hfdXNlcnMsIHVzZXJJZCkgPj0gMCB8fCBfLmluZGV4T2YoY2NfdXNlcnMsIHVzZXJJZCkgPj0gMCkge1xuICAgICAgYm94ID0gXCJpbmJveFwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBib3ggPSBcIm91dGJveFwiO1xuICAgIH1cbiAgICByZXR1cm4gYm94O1xuICB9XG59KTtcbiJdfQ==
