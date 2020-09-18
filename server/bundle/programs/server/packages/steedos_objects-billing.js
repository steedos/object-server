(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var Random = Package.random.Random;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var check = Package.check.check;
var Match = Package.check.Match;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ECMAScript = Package.ecmascript.ECMAScript;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var _i18n = Package['universe:i18n']._i18n;
var i18n = Package['universe:i18n'].i18n;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var meteorInstall = Package.modules.meteorInstall;
var FS = Package['steedos:cfs-base-package'].FS;

/* Package-scope variables */
var __coffeescriptShare;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:objects-billing":{"models":{"billings.coffee":function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/steedos_objects-billing/models/billings.coffee             //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
db.billings = new Meteor.Collection('billings');
db.billings.helpers({
  transaction_i18n: function () {
    var d, t;
    t = this.transaction;
    d = "";

    if (t === "Starting balance") {
      d = TAPi18n.__('billing_tranDetail.starting');
    } else if (t === "Payment") {
      d = TAPi18n.__('billing_tranDetail.payment');
    } else if (t === "Service adjustment") {
      d = TAPi18n.__('billing_tranDetail.adjustment');
    } else if (t === "workflow") {
      d = TAPi18n.__('billing_tranDetail.workflow');
    } else if (t === "workflow.professional") {
      d = TAPi18n.__('billing_tranDetail.workflow');
    } else if (t === "chat.professional") {
      d = TAPi18n.__('billing_tranDetail.chat');
    } else {
      d = t;
    }

    return d;
  }
});

if (Meteor.isServer) {
  db.billings._ensureIndex({
    "space": 1
  }, {
    background: true
  });
}
/////////////////////////////////////////////////////////////////////////

},"billing_pay_records.coffee":function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/steedos_objects-billing/models/billing_pay_records.coffee  //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
db.billing_pay_records = new Meteor.Collection('billing_pay_records');
db.billing_pay_records.helpers({
  order_created: function () {
    return moment(this.created).format('YYYY-MM-DD HH:mm:ss');
  },
  order_paid: function () {
    if (this.paid) {
      return TAPi18n.__("billing.has_paid");
    } else {
      return TAPi18n.__("billing.not_paid");
    }
  },
  order_total_fee: function () {
    return (this.total_fee / 100).toString();
  }
});
/////////////////////////////////////////////////////////////////////////

},"modules.coffee":function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/steedos_objects-billing/models/modules.coffee              //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
db.modules = new Meteor.Collection('modules');
/////////////////////////////////////////////////////////////////////////

},"modules_changelogs.coffee":function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/steedos_objects-billing/models/modules_changelogs.coffee   //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
db.modules_changelogs = new Meteor.Collection('modules_changelogs');
/////////////////////////////////////////////////////////////////////////

},"users_changelogs.coffee":function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/steedos_objects-billing/models/users_changelogs.coffee     //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
db.users_changelogs = new Meteor.Collection('users_changelogs');
db.users_changelogs._simpleSchema = new SimpleSchema({
  change_date: {
    type: Date
  },
  operator: {
    type: String
  },
  space: {
    type: String
  },
  operation: {
    type: String
  },
  user: {
    type: String
  },
  user_count: {
    type: Number
  },
  created: {
    type: Date
  },
  created_by: {
    type: String
  }
});

if (Meteor.isServer) {
  db.users_changelogs.before.insert(function (userId, doc) {
    doc.change_date = moment().format('YYYYMMDD');
    doc.created = new Date();
    return doc.created_by = userId;
  });
}
/////////////////////////////////////////////////////////////////////////

},"steedos_statistics.coffee":function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/steedos_objects-billing/models/steedos_statistics.coffee   //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
db.steedos_statistics = new Meteor.Collection('steedos_statistics');
/////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:objects-billing/models/billings.coffee");
require("/node_modules/meteor/steedos:objects-billing/models/billing_pay_records.coffee");
require("/node_modules/meteor/steedos:objects-billing/models/modules.coffee");
require("/node_modules/meteor/steedos:objects-billing/models/modules_changelogs.coffee");
require("/node_modules/meteor/steedos:objects-billing/models/users_changelogs.coffee");
require("/node_modules/meteor/steedos:objects-billing/models/steedos_statistics.coffee");

/* Exports */
Package._define("steedos:objects-billing");

})();

//# sourceURL=meteor://💻app/packages/steedos_objects-billing.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vYmplY3RzLWJpbGxpbmcvbW9kZWxzL2JpbGxpbmdzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvbW9kZWxzL2JpbGxpbmdzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vYmplY3RzLWJpbGxpbmcvbW9kZWxzL2JpbGxpbmdfcGF5X3JlY29yZHMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9tb2RlbHMvYmlsbGluZ19wYXlfcmVjb3Jkcy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3Nfb2JqZWN0cy1iaWxsaW5nL21vZGVscy9tb2R1bGVzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19vYmplY3RzLWJpbGxpbmcvbW9kZWxzL21vZHVsZXNfY2hhbmdlbG9ncy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3Nfb2JqZWN0cy1iaWxsaW5nL21vZGVscy91c2Vyc19jaGFuZ2Vsb2dzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvbW9kZWxzL3VzZXJzX2NoYW5nZWxvZ3MuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX29iamVjdHMtYmlsbGluZy9tb2RlbHMvc3RlZWRvc19zdGF0aXN0aWNzLmNvZmZlZSJdLCJuYW1lcyI6WyJkYiIsImJpbGxpbmdzIiwiTWV0ZW9yIiwiQ29sbGVjdGlvbiIsImhlbHBlcnMiLCJ0cmFuc2FjdGlvbl9pMThuIiwiZCIsInQiLCJ0cmFuc2FjdGlvbiIsIlRBUGkxOG4iLCJfXyIsImlzU2VydmVyIiwiX2Vuc3VyZUluZGV4IiwiYmFja2dyb3VuZCIsImJpbGxpbmdfcGF5X3JlY29yZHMiLCJvcmRlcl9jcmVhdGVkIiwibW9tZW50IiwiY3JlYXRlZCIsImZvcm1hdCIsIm9yZGVyX3BhaWQiLCJwYWlkIiwib3JkZXJfdG90YWxfZmVlIiwidG90YWxfZmVlIiwidG9TdHJpbmciLCJtb2R1bGVzIiwibW9kdWxlc19jaGFuZ2Vsb2dzIiwidXNlcnNfY2hhbmdlbG9ncyIsIl9zaW1wbGVTY2hlbWEiLCJTaW1wbGVTY2hlbWEiLCJjaGFuZ2VfZGF0ZSIsInR5cGUiLCJEYXRlIiwib3BlcmF0b3IiLCJTdHJpbmciLCJzcGFjZSIsIm9wZXJhdGlvbiIsInVzZXIiLCJ1c2VyX2NvdW50IiwiTnVtYmVyIiwiY3JlYXRlZF9ieSIsImJlZm9yZSIsImluc2VydCIsInVzZXJJZCIsImRvYyIsInN0ZWVkb3Nfc3RhdGlzdGljcyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUFBLEdBQUdDLFFBQUgsR0FBYyxJQUFJQyxPQUFPQyxVQUFYLENBQXNCLFVBQXRCLENBQWQ7QUFHQUgsR0FBR0MsUUFBSCxDQUFZRyxPQUFaLENBQ0M7QUFBQUMsb0JBQWtCO0FBQ2pCLFFBQUFDLENBQUEsRUFBQUMsQ0FBQTtBQUFBQSxRQUFJLEtBQUtDLFdBQVQ7QUFDQUYsUUFBSSxFQUFKOztBQUNBLFFBQUdDLE1BQUssa0JBQVI7QUFDQ0QsVUFBSUcsUUFBUUMsRUFBUixDQUFXLDZCQUFYLENBQUo7QUFERCxXQUVLLElBQUdILE1BQUssU0FBUjtBQUNKRCxVQUFJRyxRQUFRQyxFQUFSLENBQVcsNEJBQVgsQ0FBSjtBQURJLFdBRUEsSUFBR0gsTUFBSyxvQkFBUjtBQUNKRCxVQUFJRyxRQUFRQyxFQUFSLENBQVcsK0JBQVgsQ0FBSjtBQURJLFdBRUEsSUFBR0gsTUFBSyxVQUFSO0FBQ0pELFVBQUlHLFFBQVFDLEVBQVIsQ0FBVyw2QkFBWCxDQUFKO0FBREksV0FFQSxJQUFHSCxNQUFLLHVCQUFSO0FBQ0pELFVBQUlHLFFBQVFDLEVBQVIsQ0FBVyw2QkFBWCxDQUFKO0FBREksV0FFQSxJQUFHSCxNQUFLLG1CQUFSO0FBQ0pELFVBQUlHLFFBQVFDLEVBQVIsQ0FBVyx5QkFBWCxDQUFKO0FBREk7QUFHSkosVUFBSUMsQ0FBSjtBQ0NFOztBRENILFdBQU9ELENBQVA7QUFsQkQ7QUFBQSxDQUREOztBQXFCQSxJQUFHSixPQUFPUyxRQUFWO0FBQ0NYLEtBQUdDLFFBQUgsQ0FBWVcsWUFBWixDQUF5QjtBQUN4QixhQUFTO0FBRGUsR0FBekIsRUFFRTtBQUFDQyxnQkFBWTtBQUFiLEdBRkY7QUNPQSxDOzs7Ozs7Ozs7Ozs7QUNoQ0RiLEdBQUdjLG1CQUFILEdBQXlCLElBQUlaLE9BQU9DLFVBQVgsQ0FBc0IscUJBQXRCLENBQXpCO0FBRUFILEdBQUdjLG1CQUFILENBQXVCVixPQUF2QixDQUNDO0FBQUFXLGlCQUFlO0FBQ2QsV0FBT0MsT0FBTyxLQUFLQyxPQUFaLEVBQXFCQyxNQUFyQixDQUE0QixxQkFBNUIsQ0FBUDtBQUREO0FBR0FDLGNBQVk7QUFDSixRQUFHLEtBQUtDLElBQVI7QUNDSCxhRERxQlgsUUFBUUMsRUFBUixDQUFXLGtCQUFYLENDQ3JCO0FEREc7QUNHSCxhREh5REQsUUFBUUMsRUFBUixDQUFXLGtCQUFYLENDR3pEO0FBQ0Q7QURSSjtBQU1BVyxtQkFBaUI7QUFDaEIsV0FBTyxDQUFDLEtBQUtDLFNBQUwsR0FBZSxHQUFoQixFQUFxQkMsUUFBckIsRUFBUDtBQVBEO0FBQUEsQ0FERCxFOzs7Ozs7Ozs7Ozs7QUVGQXZCLEdBQUd3QixPQUFILEdBQWEsSUFBSXRCLE9BQU9DLFVBQVgsQ0FBc0IsU0FBdEIsQ0FBYixDOzs7Ozs7Ozs7Ozs7QUNBQUgsR0FBR3lCLGtCQUFILEdBQXdCLElBQUl2QixPQUFPQyxVQUFYLENBQXNCLG9CQUF0QixDQUF4QixDOzs7Ozs7Ozs7Ozs7QUNBQUgsR0FBRzBCLGdCQUFILEdBQXNCLElBQUl4QixPQUFPQyxVQUFYLENBQXNCLGtCQUF0QixDQUF0QjtBQUVBSCxHQUFHMEIsZ0JBQUgsQ0FBb0JDLGFBQXBCLEdBQW9DLElBQUlDLFlBQUosQ0FFbEM7QUFBQUMsZUFDRTtBQUFBQyxVQUFNQztBQUFOLEdBREY7QUFHQUMsWUFDRTtBQUFBRixVQUFNRztBQUFOLEdBSkY7QUFNQUMsU0FDRTtBQUFBSixVQUFNRztBQUFOLEdBUEY7QUFTQUUsYUFDRTtBQUFBTCxVQUFNRztBQUFOLEdBVkY7QUFZQUcsUUFDRTtBQUFBTixVQUFNRztBQUFOLEdBYkY7QUFlQUksY0FDRTtBQUFBUCxVQUFNUTtBQUFOLEdBaEJGO0FBa0JBckIsV0FDRTtBQUFBYSxVQUFNQztBQUFOLEdBbkJGO0FBcUJBUSxjQUNFO0FBQUFULFVBQU1HO0FBQU47QUF0QkYsQ0FGa0MsQ0FBcEM7O0FBMkJBLElBQUcvQixPQUFPUyxRQUFWO0FBQ0VYLEtBQUcwQixnQkFBSCxDQUFvQmMsTUFBcEIsQ0FBMkJDLE1BQTNCLENBQWtDLFVBQUNDLE1BQUQsRUFBU0MsR0FBVDtBQUNoQ0EsUUFBSWQsV0FBSixHQUFrQmIsU0FBU0UsTUFBVCxDQUFnQixVQUFoQixDQUFsQjtBQUNBeUIsUUFBSTFCLE9BQUosR0FBYyxJQUFJYyxJQUFKLEVBQWQ7QUNDQSxXREFBWSxJQUFJSixVQUFKLEdBQWlCRyxNQ0FqQjtBREhGO0FDS0QsQzs7Ozs7Ozs7Ozs7O0FDbkNEMUMsR0FBRzRDLGtCQUFILEdBQXdCLElBQUkxQyxPQUFPQyxVQUFYLENBQXNCLG9CQUF0QixDQUF4QixDIiwiZmlsZSI6Ii9wYWNrYWdlcy9zdGVlZG9zX29iamVjdHMtYmlsbGluZy5qcyIsInNvdXJjZXNDb250ZW50IjpbImRiLmJpbGxpbmdzID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCdiaWxsaW5ncycpXHJcblxyXG5cclxuZGIuYmlsbGluZ3MuaGVscGVyc1xyXG5cdHRyYW5zYWN0aW9uX2kxOG46ICgpLT5cclxuXHRcdHQgPSB0aGlzLnRyYW5zYWN0aW9uXHJcblx0XHRkID0gXCJcIlxyXG5cdFx0aWYgdCBpcyBcIlN0YXJ0aW5nIGJhbGFuY2VcIlxyXG5cdFx0XHRkID0gVEFQaTE4bi5fXygnYmlsbGluZ190cmFuRGV0YWlsLnN0YXJ0aW5nJylcclxuXHRcdGVsc2UgaWYgdCBpcyBcIlBheW1lbnRcIlxyXG5cdFx0XHRkID0gVEFQaTE4bi5fXygnYmlsbGluZ190cmFuRGV0YWlsLnBheW1lbnQnKVxyXG5cdFx0ZWxzZSBpZiB0IGlzIFwiU2VydmljZSBhZGp1c3RtZW50XCJcclxuXHRcdFx0ZCA9IFRBUGkxOG4uX18oJ2JpbGxpbmdfdHJhbkRldGFpbC5hZGp1c3RtZW50JylcclxuXHRcdGVsc2UgaWYgdCBpcyBcIndvcmtmbG93XCJcclxuXHRcdFx0ZCA9IFRBUGkxOG4uX18oJ2JpbGxpbmdfdHJhbkRldGFpbC53b3JrZmxvdycpXHJcblx0XHRlbHNlIGlmIHQgaXMgXCJ3b3JrZmxvdy5wcm9mZXNzaW9uYWxcIlxyXG5cdFx0XHRkID0gVEFQaTE4bi5fXygnYmlsbGluZ190cmFuRGV0YWlsLndvcmtmbG93JylcclxuXHRcdGVsc2UgaWYgdCBpcyBcImNoYXQucHJvZmVzc2lvbmFsXCJcclxuXHRcdFx0ZCA9IFRBUGkxOG4uX18oJ2JpbGxpbmdfdHJhbkRldGFpbC5jaGF0JylcclxuXHRcdGVsc2VcclxuXHRcdFx0ZCA9IHRcclxuXHJcblx0XHRyZXR1cm4gZFxyXG5cclxuaWYgTWV0ZW9yLmlzU2VydmVyXHJcblx0ZGIuYmlsbGluZ3MuX2Vuc3VyZUluZGV4KHtcclxuXHRcdFwic3BhY2VcIjogMVxyXG5cdH0se2JhY2tncm91bmQ6IHRydWV9KSIsImRiLmJpbGxpbmdzID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCdiaWxsaW5ncycpO1xuXG5kYi5iaWxsaW5ncy5oZWxwZXJzKHtcbiAgdHJhbnNhY3Rpb25faTE4bjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGQsIHQ7XG4gICAgdCA9IHRoaXMudHJhbnNhY3Rpb247XG4gICAgZCA9IFwiXCI7XG4gICAgaWYgKHQgPT09IFwiU3RhcnRpbmcgYmFsYW5jZVwiKSB7XG4gICAgICBkID0gVEFQaTE4bi5fXygnYmlsbGluZ190cmFuRGV0YWlsLnN0YXJ0aW5nJyk7XG4gICAgfSBlbHNlIGlmICh0ID09PSBcIlBheW1lbnRcIikge1xuICAgICAgZCA9IFRBUGkxOG4uX18oJ2JpbGxpbmdfdHJhbkRldGFpbC5wYXltZW50Jyk7XG4gICAgfSBlbHNlIGlmICh0ID09PSBcIlNlcnZpY2UgYWRqdXN0bWVudFwiKSB7XG4gICAgICBkID0gVEFQaTE4bi5fXygnYmlsbGluZ190cmFuRGV0YWlsLmFkanVzdG1lbnQnKTtcbiAgICB9IGVsc2UgaWYgKHQgPT09IFwid29ya2Zsb3dcIikge1xuICAgICAgZCA9IFRBUGkxOG4uX18oJ2JpbGxpbmdfdHJhbkRldGFpbC53b3JrZmxvdycpO1xuICAgIH0gZWxzZSBpZiAodCA9PT0gXCJ3b3JrZmxvdy5wcm9mZXNzaW9uYWxcIikge1xuICAgICAgZCA9IFRBUGkxOG4uX18oJ2JpbGxpbmdfdHJhbkRldGFpbC53b3JrZmxvdycpO1xuICAgIH0gZWxzZSBpZiAodCA9PT0gXCJjaGF0LnByb2Zlc3Npb25hbFwiKSB7XG4gICAgICBkID0gVEFQaTE4bi5fXygnYmlsbGluZ190cmFuRGV0YWlsLmNoYXQnKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZCA9IHQ7XG4gICAgfVxuICAgIHJldHVybiBkO1xuICB9XG59KTtcblxuaWYgKE1ldGVvci5pc1NlcnZlcikge1xuICBkYi5iaWxsaW5ncy5fZW5zdXJlSW5kZXgoe1xuICAgIFwic3BhY2VcIjogMVxuICB9LCB7XG4gICAgYmFja2dyb3VuZDogdHJ1ZVxuICB9KTtcbn1cbiIsImRiLmJpbGxpbmdfcGF5X3JlY29yZHMgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ2JpbGxpbmdfcGF5X3JlY29yZHMnKVxyXG5cclxuZGIuYmlsbGluZ19wYXlfcmVjb3Jkcy5oZWxwZXJzXHJcblx0b3JkZXJfY3JlYXRlZDogKCktPlxyXG5cdFx0cmV0dXJuIG1vbWVudCh0aGlzLmNyZWF0ZWQpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbTpzcycpXHJcblxyXG5cdG9yZGVyX3BhaWQ6ICgpLT5cclxuXHRcdHJldHVybiBpZiB0aGlzLnBhaWQgdGhlbiBUQVBpMThuLl9fKFwiYmlsbGluZy5oYXNfcGFpZFwiKSBlbHNlIFRBUGkxOG4uX18oXCJiaWxsaW5nLm5vdF9wYWlkXCIpXHJcblxyXG5cdG9yZGVyX3RvdGFsX2ZlZTogKCktPlxyXG5cdFx0cmV0dXJuICh0aGlzLnRvdGFsX2ZlZS8xMDApLnRvU3RyaW5nKClcclxuXHJcbiMgQ3JlYXRvci5PYmplY3RzLmJpbGxpbmdfcGF5X3JlY29yZHMgPSBcclxuIyBcdG5hbWU6IFwiYmlsbGluZ19wYXlfcmVjb3Jkc1wiXHJcbiMgXHRsYWJlbDogXCLorqLljZVcIlxyXG4jIFx0aWNvbjogXCJhcHBzXCJcclxuIyBcdGZpZWxkczpcclxuIyBcdFx0aW5mbzpcclxuIyBcdFx0XHRsYWJlbDpcIuivpuWNleivpuaDhVwiXHJcbiMgXHRcdFx0dHlwZTogXCJvYmplY3RcIlxyXG4jIFx0XHRcdGJsYWNrYm94OiB0cnVlXHJcbiMgXHRcdFx0b21pdDogdHJ1ZVxyXG4jIFx0XHRcdGhpZGRlbjogdHJ1ZVxyXG5cdFx0XHJcbiMgXHRcdHRvdGFsX2ZlZTpcclxuIyBcdFx0XHRsYWJlbDpcIumHkemine+/pVwiXHJcbiMgXHRcdFx0dHlwZTogXCJudW1iZXJcIlxyXG4jIFx0XHRcdGRlZmF1bHRWYWx1ZTogMTAwXHJcbiMgXHRcdFx0b21pdDogdHJ1ZVxyXG5cdFx0XHJcbiMgXHRcdHBhaWQ6XHJcbiMgXHRcdFx0bGFiZWw6XCLlt7Lku5jmrL5cIlxyXG4jIFx0XHRcdHR5cGU6IFwiYm9vbGVhblwiXHJcbiMgXHRcdFx0b21pdDogdHJ1ZVxyXG4jIFx0XHRcdGRlZmF1bHRWYWx1ZTogZmFsc2VcclxuXHRcdFxyXG4jIFx0XHRtb2R1bGVzOlxyXG4jIFx0XHRcdGxhYmVsOlwi5qih5Z2XXCJcclxuIyBcdFx0XHR0eXBlOiBcIlt0ZXh0XVwiXHJcbiMgXHRcdFx0YmxhY2tib3g6IHRydWVcclxuIyBcdFx0XHRvbWl0OiB0cnVlXHJcblx0XHRcclxuIyBcdFx0ZW5kX2RhdGU6XHJcbiMgXHRcdFx0bGFiZWw6XCLnp5/nlKjml6XmnJ/oh7NcIlxyXG4jIFx0XHRcdHR5cGU6IFwiZGF0ZVwiXHJcbiMgXHRcdFx0b21pdDogdHJ1ZVxyXG5cdFx0XHJcbiMgXHRcdHVzZXJfY291bnQ6XHJcbiMgXHRcdFx0bGFiZWw6XCLlkI3pop1cIlxyXG4jIFx0XHRcdHR5cGU6IFwibnVtYmVyXCJcclxuIyBcdFx0XHRvbWl0OiB0cnVlXHJcblxyXG4jIFx0bGlzdF92aWV3czpcclxuIyBcdFx0YWxsOlxyXG4jIFx0XHRcdGxhYmVsOiBcIuaJgOaciVwiXHJcbiMgXHRcdFx0ZmlsdGVyX3Njb3BlOiBcInNwYWNlXCJcclxuIyBcdFx0XHRjb2x1bW5zOiBbXCJtb2R1bGVzXCIsIFwidXNlcl9jb3VudFwiLCBcImVuZF9kYXRlXCIsIFwidG90YWxfZmVlXCIsIFwicGFpZFwiLCBcImNyZWF0ZWRcIl1cclxuXHRcclxuIyBcdHBlcm1pc3Npb25fc2V0OlxyXG4jIFx0XHR1c2VyOlxyXG4jIFx0XHRcdGFsbG93Q3JlYXRlOiBmYWxzZVxyXG4jIFx0XHRcdGFsbG93RGVsZXRlOiBmYWxzZVxyXG4jIFx0XHRcdGFsbG93RWRpdDogZmFsc2VcclxuIyBcdFx0XHRhbGxvd1JlYWQ6IGZhbHNlXHJcbiMgXHRcdFx0bW9kaWZ5QWxsUmVjb3JkczogZmFsc2VcclxuIyBcdFx0XHR2aWV3QWxsUmVjb3JkczogZmFsc2UgXHJcbiMgXHRcdGFkbWluOlxyXG4jIFx0XHRcdGFsbG93Q3JlYXRlOiBmYWxzZVxyXG4jIFx0XHRcdGFsbG93RGVsZXRlOiBmYWxzZVxyXG4jIFx0XHRcdGFsbG93RWRpdDogZmFsc2VcclxuIyBcdFx0XHRhbGxvd1JlYWQ6IHRydWVcclxuIyBcdFx0XHRtb2RpZnlBbGxSZWNvcmRzOiBmYWxzZVxyXG4jIFx0XHRcdHZpZXdBbGxSZWNvcmRzOiB0cnVlIiwiZGIuYmlsbGluZ19wYXlfcmVjb3JkcyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignYmlsbGluZ19wYXlfcmVjb3JkcycpO1xuXG5kYi5iaWxsaW5nX3BheV9yZWNvcmRzLmhlbHBlcnMoe1xuICBvcmRlcl9jcmVhdGVkOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gbW9tZW50KHRoaXMuY3JlYXRlZCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOm1tOnNzJyk7XG4gIH0sXG4gIG9yZGVyX3BhaWQ6IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLnBhaWQpIHtcbiAgICAgIHJldHVybiBUQVBpMThuLl9fKFwiYmlsbGluZy5oYXNfcGFpZFwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFRBUGkxOG4uX18oXCJiaWxsaW5nLm5vdF9wYWlkXCIpO1xuICAgIH1cbiAgfSxcbiAgb3JkZXJfdG90YWxfZmVlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKHRoaXMudG90YWxfZmVlIC8gMTAwKS50b1N0cmluZygpO1xuICB9XG59KTtcbiIsImRiLm1vZHVsZXMgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ21vZHVsZXMnKSIsImRiLm1vZHVsZXNfY2hhbmdlbG9ncyA9IG5ldyBNZXRlb3IuQ29sbGVjdGlvbignbW9kdWxlc19jaGFuZ2Vsb2dzJykiLCJkYi51c2Vyc19jaGFuZ2Vsb2dzID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCd1c2Vyc19jaGFuZ2Vsb2dzJylcclxuXHJcbmRiLnVzZXJzX2NoYW5nZWxvZ3MuX3NpbXBsZVNjaGVtYSA9IG5ldyBTaW1wbGVTY2hlbWFcclxuICAjIOaXpeacn++8jOiusOW9leS6i+S7tuWPkeeUn+eahOaXtumXtO+8jOagvOW8j++8mllZWVlNTUREXHJcbiAgY2hhbmdlX2RhdGU6XHJcbiAgICB0eXBlOiBEYXRlXHJcbiAgIyDmk43kvZzogIVcclxuICBvcGVyYXRvcjpcclxuICAgIHR5cGU6IFN0cmluZ1xyXG4gICMg5bel5L2c5Yy6XHJcbiAgc3BhY2U6XHJcbiAgICB0eXBlOiBTdHJpbmdcclxuICAjIGFkZO+8iOWinuWKoO+8iWRlbGV0Ze+8iOWIoOmZpO+8iWVuYWJsZe+8iOWQr+eUqO+8iWRpc2FibGXvvIjlgZznlKjvvIlcclxuICBvcGVyYXRpb246XHJcbiAgICB0eXBlOiBTdHJpbmdcclxuICAjIOWvueixoe+8jHVzZXJfaWRcclxuICB1c2VyOlxyXG4gICAgdHlwZTogU3RyaW5nXHJcbiAgIyDlt6XkvZzljLrkuK3lkK/nlKjnmoTnlKjmiLfmlbBcclxuICB1c2VyX2NvdW50OlxyXG4gICAgdHlwZTogTnVtYmVyXHJcbiAgIyDliJvlu7rml7bpl7RcclxuICBjcmVhdGVkOlxyXG4gICAgdHlwZTogRGF0ZVxyXG4gICMg5Yib5bu65Lq6XHJcbiAgY3JlYXRlZF9ieTpcclxuICAgIHR5cGU6IFN0cmluZ1xyXG5cclxuXHJcbmlmIE1ldGVvci5pc1NlcnZlclxyXG4gIGRiLnVzZXJzX2NoYW5nZWxvZ3MuYmVmb3JlLmluc2VydCAodXNlcklkLCBkb2MpIC0+XHJcbiAgICBkb2MuY2hhbmdlX2RhdGUgPSBtb21lbnQoKS5mb3JtYXQoJ1lZWVlNTUREJyk7XHJcbiAgICBkb2MuY3JlYXRlZCA9IG5ldyBEYXRlKCk7XHJcbiAgICBkb2MuY3JlYXRlZF9ieSA9IHVzZXJJZDtcclxuXHJcbiIsImRiLnVzZXJzX2NoYW5nZWxvZ3MgPSBuZXcgTWV0ZW9yLkNvbGxlY3Rpb24oJ3VzZXJzX2NoYW5nZWxvZ3MnKTtcblxuZGIudXNlcnNfY2hhbmdlbG9ncy5fc2ltcGxlU2NoZW1hID0gbmV3IFNpbXBsZVNjaGVtYSh7XG4gIGNoYW5nZV9kYXRlOiB7XG4gICAgdHlwZTogRGF0ZVxuICB9LFxuICBvcGVyYXRvcjoge1xuICAgIHR5cGU6IFN0cmluZ1xuICB9LFxuICBzcGFjZToge1xuICAgIHR5cGU6IFN0cmluZ1xuICB9LFxuICBvcGVyYXRpb246IHtcbiAgICB0eXBlOiBTdHJpbmdcbiAgfSxcbiAgdXNlcjoge1xuICAgIHR5cGU6IFN0cmluZ1xuICB9LFxuICB1c2VyX2NvdW50OiB7XG4gICAgdHlwZTogTnVtYmVyXG4gIH0sXG4gIGNyZWF0ZWQ6IHtcbiAgICB0eXBlOiBEYXRlXG4gIH0sXG4gIGNyZWF0ZWRfYnk6IHtcbiAgICB0eXBlOiBTdHJpbmdcbiAgfVxufSk7XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgZGIudXNlcnNfY2hhbmdlbG9ncy5iZWZvcmUuaW5zZXJ0KGZ1bmN0aW9uKHVzZXJJZCwgZG9jKSB7XG4gICAgZG9jLmNoYW5nZV9kYXRlID0gbW9tZW50KCkuZm9ybWF0KCdZWVlZTU1ERCcpO1xuICAgIGRvYy5jcmVhdGVkID0gbmV3IERhdGUoKTtcbiAgICByZXR1cm4gZG9jLmNyZWF0ZWRfYnkgPSB1c2VySWQ7XG4gIH0pO1xufVxuIiwiZGIuc3RlZWRvc19zdGF0aXN0aWNzID0gbmV3IE1ldGVvci5Db2xsZWN0aW9uKCdzdGVlZG9zX3N0YXRpc3RpY3MnKVxyXG4iXX0=
