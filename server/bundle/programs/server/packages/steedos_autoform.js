(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var ECMAScript = Package.ecmascript.ECMAScript;
var Random = Package.random.Random;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var check = Package.check.check;
var Match = Package.check.Match;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var CollectionHooks = Package['matb33:collection-hooks'].CollectionHooks;
var FlowRouter = Package['kadira:flow-router'].FlowRouter;
var SubsManager = Package['meteorhacks:subs-manager'].SubsManager;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var Tabular = Package['aldeed:tabular'].Tabular;
var moment = Package['momentjs:moment'].moment;
var JsonRoutes = Package['simple:json-routes'].JsonRoutes;
var RestMiddleware = Package['simple:json-routes'].RestMiddleware;
var _i18n = Package['universe:i18n']._i18n;
var i18n = Package['universe:i18n'].i18n;
var Selector = Package['steedos:base'].Selector;
var Steedos = Package['steedos:base'].Steedos;
var AjaxCollection = Package['steedos:base'].AjaxCollection;
var SteedosDataManager = Package['steedos:base'].SteedosDataManager;
var SteedosOffice = Package['steedos:base'].SteedosOffice;
var billingManager = Package['steedos:base'].billingManager;
var Sortable = Package['rubaxa:sortable'].Sortable;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Blaze = Package.ui.Blaze;
var UI = Package.ui.UI;
var Handlebars = Package.ui.Handlebars;
var Spacebars = Package.spacebars.Spacebars;
var meteorInstall = Package.modules.meteorInstall;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var __coffeescriptShare, CFDataManager;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:autoform":{"client":{"core.coffee":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/steedos_autoform/client/core.coffee                                                          //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
this.TabularTables = {};
Meteor.startup(function () {
  return SimpleSchema.extendOptions({
    beforeOpenFunction: Match.Optional(Match.OneOf(Function, String))
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"coreform":{"inputTypes":{"coreform-user":{"lib":{"cf_tabular_space_user.coffee":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/steedos_autoform/client/coreform/inputTypes/coreform-user/lib/cf_tabular_space_user.coffee   //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  return TabularTables.cf_tabular_space_user = new Tabular.Table({
    name: "cf_tabular_space_user",
    collection: db.space_users,
    drawCallback: function (settings) {
      return $("#cf_reverse").attr("checked", false);
    },
    columns: [{
      data: "_id",
      title: '<input type="checkbox" name="cf_reverse" id="cf_reverse">',
      orderable: false,
      width: '10px',
      render: function (val, type, doc) {
        var input, inputType, ref, ref1, ref2;
        inputType = "checkbox";

        if (!((ref = TabularTables.cf_tabular_space_user.customData) != null ? ref.multiple : void 0)) {
          inputType = "radio";
        }

        input = '<input type="' + inputType + '" class="list_checkbox" name="cf_contacts_ids" id="' + doc.user + '" value="' + doc.user + '" data-name="' + doc.name + '" data-email="' + doc.email + '"';

        if ((ref1 = TabularTables.cf_tabular_space_user.customData) != null ? (ref2 = ref1.defaultValues) != null ? ref2.includes(doc.user) : void 0 : void 0) {
          input += " checked ";
        }

        input += ">";
        return input;
      }
    }, {
      data: "name",
      orderable: false,
      render: function (val, type, doc) {
        return "<label data-user='" + doc.user + "' class='for-input'><div class='user-name'><font>" + doc.name + "</font></div></label>";
      }
    }, {
      data: "sort_no",
      title: "",
      orderable: true,
      visible: false
    }, {
      data: "name",
      title: "",
      orderable: true,
      visible: false
    }, {
      data: "email",
      title: "",
      orderable: false,
      visible: false
    }],
    onUnload: function () {
      return console.log("onUnload ok....");
    },
    dom: "tp",
    order: [[2, "desc"], [3, "asc"]],
    extraFields: ["_id", "name", "user", "sort_no", "email"],
    lengthChange: false,
    pageLength: 100,
    info: false,
    searching: true,
    responsive: {
      details: false
    },
    autoWidth: false,
    changeSelector: function (selector, userId) {
      var ref, space, space_user;

      if (!userId) {
        return {
          _id: -1
        };
      }

      space = selector.space;

      if (!space) {
        if ((selector != null ? (ref = selector.$and) != null ? ref.length : void 0 : void 0) > 0) {
          space = selector.$and.getProperty('space')[0];
        }
      }

      if (!space) {
        return {
          _id: -1
        };
      }

      space_user = db.space_users.findOne({
        user: userId,
        space: space
      }, {
        fields: {
          _id: 1
        }
      });

      if (!space_user) {
        return {
          _id: -1
        };
      }

      return selector;
    },
    pagingType: "numbers"
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},"routes":{"formula_space_users.coffee":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/steedos_autoform/routes/formula_space_users.coffee                                           //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  return JsonRoutes.add("post", "/api/formula/space_users", function (req, res, next) {
    var data, query, selected, spaceId, spaceUsers, space_users, userIds;
    userIds = req.body.userIds;
    spaceId = req.query.spaceId;
    spaceUsers = [];
    data = [];

    if (userIds) {
      if (!userIds instanceof Array) {
        userIds = [userIds];
      }

      query = {
        user: {
          $in: userIds
        }
      };

      if (spaceId) {
        query.space = spaceId;
      }

      space_users = db.space_users.find(query).fetch();
      selected = [];
      space_users.forEach(function (u) {
        var fu, u_org, u_orgs, user_flow_positions, user_role_ids, user_roles;

        if (selected.indexOf(u.user) < 0) {
          fu = {};
          fu.id = u.user;
          fu.name = u.name;
          fu.sort_no = u.sort_no;
          fu.mobile = u.mobile;
          fu.work_phone = u.work_phone;
          fu.position = u.position;
          u_org = db.organizations.findOne({
            _id: u.organization
          }, {
            fields: {
              name: 1,
              fullname: 1
            }
          });
          u_orgs = db.organizations.find({
            _id: {
              $in: u.organizations
            }
          }, {
            fields: {
              name: 1,
              fullname: 1
            }
          }).fetch();
          fu.organization = {
            name: u_org != null ? u_org.name : void 0,
            fullname: u_org != null ? u_org.fullname : void 0
          };
          fu.organizations = {
            name: u_orgs != null ? u_orgs.getProperty("name") : void 0,
            fullname: u_orgs != null ? u_orgs.getProperty("fullname") : void 0
          };
          fu.hr = u.hr || {};

          if (db.flow_positions && db.flow_roles) {
            user_flow_positions = db.flow_positions.find({
              space: u.space,
              users: u.user
            }, {
              fields: {
                role: 1
              }
            }).fetch();
            user_role_ids = user_flow_positions.getProperty("role");
            user_roles = db.flow_roles.find({
              _id: {
                $in: user_role_ids
              }
            }, {
              fields: {
                name: 1
              }
            }).fetch();
            fu.roles = user_roles.getProperty("name");
          }

          data.push(fu);
          return selected.push(u.user);
        }
      });
      userIds.forEach(function (uId) {
        return spaceUsers.push(_.find(data, function (su) {
          return su.id === uId;
        }));
      });
    }

    return JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        'spaceUsers': spaceUsers
      }
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

},"formula_organizations.coffee":function(){

///////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                       //
// packages/steedos_autoform/routes/formula_organizations.coffee                                         //
//                                                                                                       //
///////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                         //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  return JsonRoutes.add("post", "/api/formula/organizations", function (req, res, next) {
    var data, orgIds, orgs, query, res_orgs, spaceId;
    res_orgs = [];
    data = [];
    orgIds = req.body.orgIds;
    spaceId = req.query.spaceId;

    if (orgIds) {
      if (!orgIds instanceof Array) {
        orgIds = [orgIds];
      }

      query = {
        _id: {
          $in: orgIds
        }
      };

      if (spaceId) {
        query.space = spaceId;
      }

      orgs = db.organizations.find(query, {
        fields: {
          name: 1,
          fullname: 1
        }
      }).fetch();
      orgs.forEach(function (org) {
        return data.push({
          id: org._id,
          name: org.name,
          fullname: org.fullname
        });
      });
      orgIds.forEach(function (oId) {
        return res_orgs.push(_.find(data, function (o) {
          return o.id === oId;
        }));
      });
    }

    return JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        'orgs': res_orgs
      }
    });
  });
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:autoform/client/core.coffee");
require("/node_modules/meteor/steedos:autoform/client/coreform/inputTypes/coreform-user/lib/cf_tabular_space_user.coffee");
require("/node_modules/meteor/steedos:autoform/routes/formula_space_users.coffee");
require("/node_modules/meteor/steedos:autoform/routes/formula_organizations.coffee");

/* Exports */
Package._define("steedos:autoform", {
  CFDataManager: CFDataManager
});

})();

//# sourceURL=meteor://💻app/packages/steedos_autoform.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS9jbGllbnQvY29yZS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2NsaWVudC9jb3JlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS9jbGllbnQvY29yZWZvcm0vaW5wdXRUeXBlcy9jb3JlZm9ybS11c2VyL2xpYi9jZl90YWJ1bGFyX3NwYWNlX3VzZXIuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9jbGllbnQvY29yZWZvcm0vaW5wdXRUeXBlcy9jb3JlZm9ybS11c2VyL2xpYi9jZl90YWJ1bGFyX3NwYWNlX3VzZXIuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2F1dG9mb3JtL3JvdXRlcy9mb3JtdWxhX3NwYWNlX3VzZXJzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcm91dGVzL2Zvcm11bGFfc3BhY2VfdXNlcnMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2F1dG9mb3JtL3JvdXRlcy9mb3JtdWxhX29yZ2FuaXphdGlvbnMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9yb3V0ZXMvZm9ybXVsYV9vcmdhbml6YXRpb25zLmNvZmZlZSJdLCJuYW1lcyI6WyJUYWJ1bGFyVGFibGVzIiwiTWV0ZW9yIiwic3RhcnR1cCIsIlNpbXBsZVNjaGVtYSIsImV4dGVuZE9wdGlvbnMiLCJiZWZvcmVPcGVuRnVuY3Rpb24iLCJNYXRjaCIsIk9wdGlvbmFsIiwiT25lT2YiLCJGdW5jdGlvbiIsIlN0cmluZyIsImNmX3RhYnVsYXJfc3BhY2VfdXNlciIsIlRhYnVsYXIiLCJUYWJsZSIsIm5hbWUiLCJjb2xsZWN0aW9uIiwiZGIiLCJzcGFjZV91c2VycyIsImRyYXdDYWxsYmFjayIsInNldHRpbmdzIiwiJCIsImF0dHIiLCJjb2x1bW5zIiwiZGF0YSIsInRpdGxlIiwib3JkZXJhYmxlIiwid2lkdGgiLCJyZW5kZXIiLCJ2YWwiLCJ0eXBlIiwiZG9jIiwiaW5wdXQiLCJpbnB1dFR5cGUiLCJyZWYiLCJyZWYxIiwicmVmMiIsImN1c3RvbURhdGEiLCJtdWx0aXBsZSIsInVzZXIiLCJlbWFpbCIsImRlZmF1bHRWYWx1ZXMiLCJpbmNsdWRlcyIsInZpc2libGUiLCJvblVubG9hZCIsImNvbnNvbGUiLCJsb2ciLCJkb20iLCJvcmRlciIsImV4dHJhRmllbGRzIiwibGVuZ3RoQ2hhbmdlIiwicGFnZUxlbmd0aCIsImluZm8iLCJzZWFyY2hpbmciLCJyZXNwb25zaXZlIiwiZGV0YWlscyIsImF1dG9XaWR0aCIsImNoYW5nZVNlbGVjdG9yIiwic2VsZWN0b3IiLCJ1c2VySWQiLCJzcGFjZSIsInNwYWNlX3VzZXIiLCJfaWQiLCIkYW5kIiwibGVuZ3RoIiwiZ2V0UHJvcGVydHkiLCJmaW5kT25lIiwiZmllbGRzIiwicGFnaW5nVHlwZSIsIkpzb25Sb3V0ZXMiLCJhZGQiLCJyZXEiLCJyZXMiLCJuZXh0IiwicXVlcnkiLCJzZWxlY3RlZCIsInNwYWNlSWQiLCJzcGFjZVVzZXJzIiwidXNlcklkcyIsImJvZHkiLCJBcnJheSIsIiRpbiIsImZpbmQiLCJmZXRjaCIsImZvckVhY2giLCJ1IiwiZnUiLCJ1X29yZyIsInVfb3JncyIsInVzZXJfZmxvd19wb3NpdGlvbnMiLCJ1c2VyX3JvbGVfaWRzIiwidXNlcl9yb2xlcyIsImluZGV4T2YiLCJpZCIsInNvcnRfbm8iLCJtb2JpbGUiLCJ3b3JrX3Bob25lIiwicG9zaXRpb24iLCJvcmdhbml6YXRpb25zIiwib3JnYW5pemF0aW9uIiwiZnVsbG5hbWUiLCJociIsImZsb3dfcG9zaXRpb25zIiwiZmxvd19yb2xlcyIsInVzZXJzIiwicm9sZSIsInJvbGVzIiwicHVzaCIsInVJZCIsIl8iLCJzdSIsInNlbmRSZXN1bHQiLCJjb2RlIiwib3JnSWRzIiwib3JncyIsInJlc19vcmdzIiwib3JnIiwib0lkIiwibyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7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Qjs7QUFFQSxRQUFHcUMsTUFBSDtBQUNDLFVBQUcsQ0FBSUEsTUFBSixZQUFzQmpDLEtBQXpCO0FBQ0NpQyxpQkFBUyxDQUFDQSxNQUFELENBQVQ7QUNIRzs7QURLSnZDLGNBQVE7QUFBQ1osYUFBSztBQUFDbUIsZUFBS2dDO0FBQU47QUFBTixPQUFSOztBQUVBLFVBQUdyQyxPQUFIO0FBQ0NGLGNBQU1kLEtBQU4sR0FBY2dCLE9BQWQ7QUNBRzs7QURFSnNDLGFBQU9qRyxHQUFHaUYsYUFBSCxDQUFpQmhCLElBQWpCLENBQXNCUixLQUF0QixFQUE2QjtBQUFDUCxnQkFBUTtBQUFDcEQsZ0JBQU0sQ0FBUDtBQUFVcUYsb0JBQVU7QUFBcEI7QUFBVCxPQUE3QixFQUErRGpCLEtBQS9ELEVBQVA7QUFFQStCLFdBQUs5QixPQUFMLENBQWEsVUFBQ2dDLEdBQUQ7QUNJUixlREhKNUYsS0FBS21GLElBQUwsQ0FBVTtBQUFDZCxjQUFJdUIsSUFBSXRELEdBQVQ7QUFBYy9DLGdCQUFNcUcsSUFBSXJHLElBQXhCO0FBQThCcUYsb0JBQVVnQixJQUFJaEI7QUFBNUMsU0FBVixDQ0dJO0FESkw7QUFHQWEsYUFBTzdCLE9BQVAsQ0FBZSxVQUFDaUMsR0FBRDtBQ1FWLGVEUEpGLFNBQVNSLElBQVQsQ0FBY0UsRUFBRTNCLElBQUYsQ0FBTzFELElBQVAsRUFBYSxVQUFDOEYsQ0FBRDtBQUFNLGlCQUFPQSxFQUFFekIsRUFBRixLQUFRd0IsR0FBZjtBQUFuQixVQUFkLENDT0k7QURSTDtBQ1lFOztBQUNELFdEUkZoRCxXQUFXMEMsVUFBWCxDQUFzQnZDLEdBQXRCLEVBQTJCO0FBQzFCd0MsWUFBTSxHQURvQjtBQUUxQnhGLFlBQU07QUFDTCxnQkFBUTJGO0FBREg7QUFGb0IsS0FBM0IsQ0NRRTtBRHJDSCxJQ0FDO0FEREYsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS5qcyIsInNvdXJjZXNDb250ZW50IjpbIkBUYWJ1bGFyVGFibGVzID0ge307XG5cblxuTWV0ZW9yLnN0YXJ0dXAgLT5cblx0U2ltcGxlU2NoZW1hLmV4dGVuZE9wdGlvbnMoe2JlZm9yZU9wZW5GdW5jdGlvbjogTWF0Y2guT3B0aW9uYWwoTWF0Y2guT25lT2YoRnVuY3Rpb24sIFN0cmluZykpfSkiLCJ0aGlzLlRhYnVsYXJUYWJsZXMgPSB7fTtcblxuTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIHJldHVybiBTaW1wbGVTY2hlbWEuZXh0ZW5kT3B0aW9ucyh7XG4gICAgYmVmb3JlT3BlbkZ1bmN0aW9uOiBNYXRjaC5PcHRpb25hbChNYXRjaC5PbmVPZihGdW5jdGlvbiwgU3RyaW5nKSlcbiAgfSk7XG59KTtcbiIsIk1ldGVvci5zdGFydHVwICgpLT5cblx0VGFidWxhclRhYmxlcy5jZl90YWJ1bGFyX3NwYWNlX3VzZXIgPSBuZXcgVGFidWxhci5UYWJsZSh7XG5cdFx0bmFtZTogXCJjZl90YWJ1bGFyX3NwYWNlX3VzZXJcIixcblx0XHRjb2xsZWN0aW9uOiBkYi5zcGFjZV91c2Vycyxcblx0XHRkcmF3Q2FsbGJhY2s6IChzZXR0aW5ncyktPlxuXHRcdFx0JChcIiNjZl9yZXZlcnNlXCIpLmF0dHIoXCJjaGVja2VkXCIsIGZhbHNlKVxuXHRcdGNvbHVtbnM6IFtcblx0XHRcdHtcblx0XHRcdFx0ZGF0YTogXCJfaWRcIixcblx0XHRcdFx0dGl0bGU6ICc8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImNmX3JldmVyc2VcIiBpZD1cImNmX3JldmVyc2VcIj4nLFxuXHRcdFx0XHRvcmRlcmFibGU6IGZhbHNlLFxuXHRcdFx0XHR3aWR0aDonMTBweCcsXG5cdFx0XHRcdHJlbmRlcjogICh2YWwsIHR5cGUsIGRvYykgLT5cblxuXHRcdFx0XHRcdGlucHV0VHlwZSA9IFwiY2hlY2tib3hcIjtcblxuXHRcdFx0XHRcdGlmICFUYWJ1bGFyVGFibGVzLmNmX3RhYnVsYXJfc3BhY2VfdXNlci5jdXN0b21EYXRhPy5tdWx0aXBsZVxuXHRcdFx0XHRcdFx0aW5wdXRUeXBlID0gXCJyYWRpb1wiXG5cblx0XHRcdFx0XHRpbnB1dCA9ICc8aW5wdXQgdHlwZT1cIicgKyBpbnB1dFR5cGUgKyAnXCIgY2xhc3M9XCJsaXN0X2NoZWNrYm94XCIgbmFtZT1cImNmX2NvbnRhY3RzX2lkc1wiIGlkPVwiJyArIGRvYy51c2VyICsgJ1wiIHZhbHVlPVwiJyArIGRvYy51c2VyICsgJ1wiIGRhdGEtbmFtZT1cIicgKyBkb2MubmFtZSArICdcIiBkYXRhLWVtYWlsPVwiJyArIGRvYy5lbWFpbCArICdcIic7XG5cblx0XHRcdFx0XHRpZiBUYWJ1bGFyVGFibGVzLmNmX3RhYnVsYXJfc3BhY2VfdXNlci5jdXN0b21EYXRhPy5kZWZhdWx0VmFsdWVzPy5pbmNsdWRlcyhkb2MudXNlcilcblx0XHRcdFx0XHRcdGlucHV0ICs9IFwiIGNoZWNrZWQgXCJcblxuXHRcdFx0XHRcdGlucHV0ICs9IFwiPlwiXG5cdFx0XHRcdFx0cmV0dXJuIGlucHV0XG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRkYXRhOiBcIm5hbWVcIixcblx0XHRcdFx0b3JkZXJhYmxlOiBmYWxzZSxcblx0XHRcdFx0cmVuZGVyOiAgKHZhbCwgdHlwZSwgZG9jKSAtPlxuXHRcdFx0XHRcdHJldHVybiBcIjxsYWJlbCBkYXRhLXVzZXI9J1wiICsgZG9jLnVzZXIgKyBcIicgY2xhc3M9J2Zvci1pbnB1dCc+PGRpdiBjbGFzcz0ndXNlci1uYW1lJz48Zm9udD5cIiArIGRvYy5uYW1lICsgXCI8L2ZvbnQ+PC9kaXY+PC9sYWJlbD5cIlxuXHRcdFx0fSxcblx0XHRcdHtcblx0XHRcdFx0ZGF0YTogXCJzb3J0X25vXCIsXG5cdFx0XHRcdHRpdGxlOiBcIlwiLFxuXHRcdFx0XHRvcmRlcmFibGU6IHRydWUsXG5cdFx0XHRcdHZpc2libGU6IGZhbHNlXG5cdFx0XHR9LFxuXHRcdFx0e1xuXHRcdFx0XHRkYXRhOiBcIm5hbWVcIixcblx0XHRcdFx0dGl0bGU6IFwiXCIsXG5cdFx0XHRcdG9yZGVyYWJsZTogdHJ1ZSxcblx0XHRcdFx0dmlzaWJsZTogZmFsc2Vcblx0XHRcdH0se1xuXHRcdFx0XHRkYXRhOiBcImVtYWlsXCIsXG5cdFx0XHRcdHRpdGxlOiBcIlwiLFxuXHRcdFx0XHRvcmRlcmFibGU6IGZhbHNlLFxuXHRcdFx0XHR2aXNpYmxlOiBmYWxzZVxuXHRcdFx0fVxuXHRcdF0sXG5cdFx0b25VbmxvYWQ6KCkgLT5cblx0XHRcdHJldHVybiBjb25zb2xlLmxvZyhcIm9uVW5sb2FkIG9rLi4uLlwiKTtcbiNzZWxlY3Q6XG4jICBzdHlsZTogJ3NpbmdsZSdcblx0XHRkb206IFwidHBcIixcblx0XHRvcmRlcjpbWzIsXCJkZXNjXCJdLFszLFwiYXNjXCJdXSxcblx0XHRleHRyYUZpZWxkczogW1wiX2lkXCIsIFwibmFtZVwiLCBcInVzZXJcIiwgXCJzb3J0X25vXCIsIFwiZW1haWxcIl0sXG5cdFx0bGVuZ3RoQ2hhbmdlOiBmYWxzZSxcblx0XHRwYWdlTGVuZ3RoOiAxMDAsXG5cdFx0aW5mbzogZmFsc2UsXG5cdFx0c2VhcmNoaW5nOiB0cnVlLFxuXHRcdHJlc3BvbnNpdmU6XG5cdFx0XHRkZXRhaWxzOiBmYWxzZVxuXHRcdGF1dG9XaWR0aDogZmFsc2UsXG5cdFx0Y2hhbmdlU2VsZWN0b3I6IChzZWxlY3RvciwgdXNlcklkKSAtPlxuXHRcdFx0dW5sZXNzIHVzZXJJZFxuXHRcdFx0XHRyZXR1cm4ge19pZDogLTF9XG5cdFx0XHRzcGFjZSA9IHNlbGVjdG9yLnNwYWNlXG5cdFx0XHR1bmxlc3Mgc3BhY2Vcblx0XHRcdFx0aWYgc2VsZWN0b3I/LiRhbmQ/Lmxlbmd0aCA+IDBcblx0XHRcdFx0XHRzcGFjZSA9IHNlbGVjdG9yLiRhbmQuZ2V0UHJvcGVydHkoJ3NwYWNlJylbMF1cblx0XHRcdHVubGVzcyBzcGFjZVxuXHRcdFx0XHRyZXR1cm4ge19pZDogLTF9XG5cdFx0XHRzcGFjZV91c2VyID0gZGIuc3BhY2VfdXNlcnMuZmluZE9uZSh7dXNlcjogdXNlcklkLHNwYWNlOnNwYWNlfSwge2ZpZWxkczoge19pZDogMX19KVxuXHRcdFx0dW5sZXNzIHNwYWNlX3VzZXJcblx0XHRcdFx0cmV0dXJuIHtfaWQ6IC0xfVxuXHRcdFx0cmV0dXJuIHNlbGVjdG9yXG5cbiNzY3JvbGxZOiAgICAgICAgJzQwMHB4JyxcbiNzY3JvbGxDb2xsYXBzZTogdHJ1ZSxcblx0XHRwYWdpbmdUeXBlOiBcIm51bWJlcnNcIlxuXG5cdH0pO1xuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIHJldHVybiBUYWJ1bGFyVGFibGVzLmNmX3RhYnVsYXJfc3BhY2VfdXNlciA9IG5ldyBUYWJ1bGFyLlRhYmxlKHtcbiAgICBuYW1lOiBcImNmX3RhYnVsYXJfc3BhY2VfdXNlclwiLFxuICAgIGNvbGxlY3Rpb246IGRiLnNwYWNlX3VzZXJzLFxuICAgIGRyYXdDYWxsYmFjazogZnVuY3Rpb24oc2V0dGluZ3MpIHtcbiAgICAgIHJldHVybiAkKFwiI2NmX3JldmVyc2VcIikuYXR0cihcImNoZWNrZWRcIiwgZmFsc2UpO1xuICAgIH0sXG4gICAgY29sdW1uczogW1xuICAgICAge1xuICAgICAgICBkYXRhOiBcIl9pZFwiLFxuICAgICAgICB0aXRsZTogJzxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiY2ZfcmV2ZXJzZVwiIGlkPVwiY2ZfcmV2ZXJzZVwiPicsXG4gICAgICAgIG9yZGVyYWJsZTogZmFsc2UsXG4gICAgICAgIHdpZHRoOiAnMTBweCcsXG4gICAgICAgIHJlbmRlcjogZnVuY3Rpb24odmFsLCB0eXBlLCBkb2MpIHtcbiAgICAgICAgICB2YXIgaW5wdXQsIGlucHV0VHlwZSwgcmVmLCByZWYxLCByZWYyO1xuICAgICAgICAgIGlucHV0VHlwZSA9IFwiY2hlY2tib3hcIjtcbiAgICAgICAgICBpZiAoISgocmVmID0gVGFidWxhclRhYmxlcy5jZl90YWJ1bGFyX3NwYWNlX3VzZXIuY3VzdG9tRGF0YSkgIT0gbnVsbCA/IHJlZi5tdWx0aXBsZSA6IHZvaWQgMCkpIHtcbiAgICAgICAgICAgIGlucHV0VHlwZSA9IFwicmFkaW9cIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgaW5wdXQgPSAnPGlucHV0IHR5cGU9XCInICsgaW5wdXRUeXBlICsgJ1wiIGNsYXNzPVwibGlzdF9jaGVja2JveFwiIG5hbWU9XCJjZl9jb250YWN0c19pZHNcIiBpZD1cIicgKyBkb2MudXNlciArICdcIiB2YWx1ZT1cIicgKyBkb2MudXNlciArICdcIiBkYXRhLW5hbWU9XCInICsgZG9jLm5hbWUgKyAnXCIgZGF0YS1lbWFpbD1cIicgKyBkb2MuZW1haWwgKyAnXCInO1xuICAgICAgICAgIGlmICgocmVmMSA9IFRhYnVsYXJUYWJsZXMuY2ZfdGFidWxhcl9zcGFjZV91c2VyLmN1c3RvbURhdGEpICE9IG51bGwgPyAocmVmMiA9IHJlZjEuZGVmYXVsdFZhbHVlcykgIT0gbnVsbCA/IHJlZjIuaW5jbHVkZXMoZG9jLnVzZXIpIDogdm9pZCAwIDogdm9pZCAwKSB7XG4gICAgICAgICAgICBpbnB1dCArPSBcIiBjaGVja2VkIFwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpbnB1dCArPSBcIj5cIjtcbiAgICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgICAgIH1cbiAgICAgIH0sIHtcbiAgICAgICAgZGF0YTogXCJuYW1lXCIsXG4gICAgICAgIG9yZGVyYWJsZTogZmFsc2UsXG4gICAgICAgIHJlbmRlcjogZnVuY3Rpb24odmFsLCB0eXBlLCBkb2MpIHtcbiAgICAgICAgICByZXR1cm4gXCI8bGFiZWwgZGF0YS11c2VyPSdcIiArIGRvYy51c2VyICsgXCInIGNsYXNzPSdmb3ItaW5wdXQnPjxkaXYgY2xhc3M9J3VzZXItbmFtZSc+PGZvbnQ+XCIgKyBkb2MubmFtZSArIFwiPC9mb250PjwvZGl2PjwvbGFiZWw+XCI7XG4gICAgICAgIH1cbiAgICAgIH0sIHtcbiAgICAgICAgZGF0YTogXCJzb3J0X25vXCIsXG4gICAgICAgIHRpdGxlOiBcIlwiLFxuICAgICAgICBvcmRlcmFibGU6IHRydWUsXG4gICAgICAgIHZpc2libGU6IGZhbHNlXG4gICAgICB9LCB7XG4gICAgICAgIGRhdGE6IFwibmFtZVwiLFxuICAgICAgICB0aXRsZTogXCJcIixcbiAgICAgICAgb3JkZXJhYmxlOiB0cnVlLFxuICAgICAgICB2aXNpYmxlOiBmYWxzZVxuICAgICAgfSwge1xuICAgICAgICBkYXRhOiBcImVtYWlsXCIsXG4gICAgICAgIHRpdGxlOiBcIlwiLFxuICAgICAgICBvcmRlcmFibGU6IGZhbHNlLFxuICAgICAgICB2aXNpYmxlOiBmYWxzZVxuICAgICAgfVxuICAgIF0sXG4gICAgb25VbmxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGNvbnNvbGUubG9nKFwib25VbmxvYWQgb2suLi4uXCIpO1xuICAgIH0sXG4gICAgZG9tOiBcInRwXCIsXG4gICAgb3JkZXI6IFtbMiwgXCJkZXNjXCJdLCBbMywgXCJhc2NcIl1dLFxuICAgIGV4dHJhRmllbGRzOiBbXCJfaWRcIiwgXCJuYW1lXCIsIFwidXNlclwiLCBcInNvcnRfbm9cIiwgXCJlbWFpbFwiXSxcbiAgICBsZW5ndGhDaGFuZ2U6IGZhbHNlLFxuICAgIHBhZ2VMZW5ndGg6IDEwMCxcbiAgICBpbmZvOiBmYWxzZSxcbiAgICBzZWFyY2hpbmc6IHRydWUsXG4gICAgcmVzcG9uc2l2ZToge1xuICAgICAgZGV0YWlsczogZmFsc2VcbiAgICB9LFxuICAgIGF1dG9XaWR0aDogZmFsc2UsXG4gICAgY2hhbmdlU2VsZWN0b3I6IGZ1bmN0aW9uKHNlbGVjdG9yLCB1c2VySWQpIHtcbiAgICAgIHZhciByZWYsIHNwYWNlLCBzcGFjZV91c2VyO1xuICAgICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBfaWQ6IC0xXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBzcGFjZSA9IHNlbGVjdG9yLnNwYWNlO1xuICAgICAgaWYgKCFzcGFjZSkge1xuICAgICAgICBpZiAoKHNlbGVjdG9yICE9IG51bGwgPyAocmVmID0gc2VsZWN0b3IuJGFuZCkgIT0gbnVsbCA/IHJlZi5sZW5ndGggOiB2b2lkIDAgOiB2b2lkIDApID4gMCkge1xuICAgICAgICAgIHNwYWNlID0gc2VsZWN0b3IuJGFuZC5nZXRQcm9wZXJ0eSgnc3BhY2UnKVswXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFzcGFjZSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIF9pZDogLTFcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHNwYWNlX3VzZXIgPSBkYi5zcGFjZV91c2Vycy5maW5kT25lKHtcbiAgICAgICAgdXNlcjogdXNlcklkLFxuICAgICAgICBzcGFjZTogc3BhY2VcbiAgICAgIH0sIHtcbiAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgX2lkOiAxXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgaWYgKCFzcGFjZV91c2VyKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgX2lkOiAtMVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNlbGVjdG9yO1xuICAgIH0sXG4gICAgcGFnaW5nVHlwZTogXCJudW1iZXJzXCJcbiAgfSk7XG59KTtcbiIsIk1ldGVvci5zdGFydHVwIC0+XG5cdEpzb25Sb3V0ZXMuYWRkIFwicG9zdFwiLCBcIi9hcGkvZm9ybXVsYS9zcGFjZV91c2Vyc1wiLCAocmVxLCByZXMsIG5leHQpIC0+XG5cdFx0dXNlcklkcyA9IHJlcS5ib2R5LnVzZXJJZHNcblx0XHRzcGFjZUlkID0gcmVxLnF1ZXJ5LnNwYWNlSWRcblxuXHRcdHNwYWNlVXNlcnMgPSBbXVxuXG5cdFx0ZGF0YSA9IFtdXG5cblx0XHRpZiAodXNlcklkcylcblxuXHRcdFx0aWYgbm90IHVzZXJJZHMgaW5zdGFuY2VvZiBBcnJheVxuXHRcdFx0XHR1c2VySWRzID0gW3VzZXJJZHNdXG5cblx0XHRcdHF1ZXJ5ID0ge1xuXHRcdFx0XHR1c2VyOiB7XG5cdFx0XHRcdFx0JGluOiB1c2VySWRzXG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0aWYgc3BhY2VJZFxuXHRcdFx0XHRxdWVyeS5zcGFjZSA9IHNwYWNlSWRcblxuXHRcdFx0c3BhY2VfdXNlcnMgPSBkYi5zcGFjZV91c2Vycy5maW5kKHF1ZXJ5KS5mZXRjaCgpO1xuXG5cdFx0XHRzZWxlY3RlZCA9IFtdXG5cblx0XHRcdHNwYWNlX3VzZXJzLmZvckVhY2ggKHUpLT5cblx0XHRcdFx0aWYgc2VsZWN0ZWQuaW5kZXhPZih1LnVzZXIpIDwgMFxuXHRcdFx0XHRcdGZ1ID0ge31cblxuXHRcdFx0XHRcdGZ1LmlkID0gdS51c2VyXG5cblx0XHRcdFx0XHRmdS5uYW1lID0gdS5uYW1lXG5cblx0XHRcdFx0XHRmdS5zb3J0X25vID0gdS5zb3J0X25vXG5cblx0XHRcdFx0XHRmdS5tb2JpbGUgPSB1Lm1vYmlsZVxuXG5cdFx0XHRcdFx0ZnUud29ya19waG9uZSA9IHUud29ya19waG9uZVxuXG5cdFx0XHRcdFx0ZnUucG9zaXRpb24gPSB1LnBvc2l0aW9uXG5cblx0XHRcdFx0XHR1X29yZyA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZE9uZSh7X2lkOiB1Lm9yZ2FuaXphdGlvbn0sIHtmaWVsZHM6IHtuYW1lOiAxLCBmdWxsbmFtZTogMX19KVxuXG5cdFx0XHRcdFx0dV9vcmdzID0gZGIub3JnYW5pemF0aW9ucy5maW5kKHtfaWQ6IHskaW46IHUub3JnYW5pemF0aW9uc319LCB7ZmllbGRzOiB7bmFtZTogMSwgZnVsbG5hbWU6IDF9fSkuZmV0Y2goKVxuXG5cblx0XHRcdFx0XHRmdS5vcmdhbml6YXRpb24gPSB7XG5cdFx0XHRcdFx0XHRuYW1lOiB1X29yZz8ubmFtZSxcblx0XHRcdFx0XHRcdGZ1bGxuYW1lOiB1X29yZz8uZnVsbG5hbWVcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRmdS5vcmdhbml6YXRpb25zID0ge1xuXHRcdFx0XHRcdFx0bmFtZTogdV9vcmdzPy5nZXRQcm9wZXJ0eShcIm5hbWVcIiksXG5cdFx0XHRcdFx0XHRmdWxsbmFtZTogdV9vcmdzPy5nZXRQcm9wZXJ0eShcImZ1bGxuYW1lXCIpLFxuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGZ1LmhyID0gdS5ociB8fCB7fVxuXG5cdFx0XHRcdFx0aWYgZGIuZmxvd19wb3NpdGlvbnMgJiYgZGIuZmxvd19yb2xlc1xuXG5cdFx0XHRcdFx0XHR1c2VyX2Zsb3dfcG9zaXRpb25zID0gZGIuZmxvd19wb3NpdGlvbnMuZmluZCh7c3BhY2U6IHUuc3BhY2UsIHVzZXJzOiB1LnVzZXJ9LCB7ZmllbGRzOiB7cm9sZTogMX19KS5mZXRjaCgpO1xuXG5cdFx0XHRcdFx0XHR1c2VyX3JvbGVfaWRzID0gdXNlcl9mbG93X3Bvc2l0aW9ucy5nZXRQcm9wZXJ0eShcInJvbGVcIik7XG5cblx0XHRcdFx0XHRcdHVzZXJfcm9sZXMgPSBkYi5mbG93X3JvbGVzLmZpbmQoe19pZDogeyRpbjogdXNlcl9yb2xlX2lkc319LCB7ZmllbGRzOiB7bmFtZTogMX19KS5mZXRjaCgpO1xuXG5cdFx0XHRcdFx0XHRmdS5yb2xlcyA9IHVzZXJfcm9sZXMuZ2V0UHJvcGVydHkoXCJuYW1lXCIpXG5cblx0XHRcdFx0XHRkYXRhLnB1c2ggZnVcblxuXHRcdFx0XHRcdHNlbGVjdGVkLnB1c2ggdS51c2VyXG5cblx0XHRcdHVzZXJJZHMuZm9yRWFjaCAodUlkKS0+XG5cdFx0XHRcdHNwYWNlVXNlcnMucHVzaCBfLmZpbmQoZGF0YSwgKHN1KS0+IHJldHVybiBzdS5pZCA9PSB1SWQpXG5cblxuXHRcdEpzb25Sb3V0ZXMuc2VuZFJlc3VsdChyZXMsIHtcblx0XHRcdGNvZGU6IDIwMCxcblx0XHRcdGRhdGE6IHtcblx0XHRcdFx0J3NwYWNlVXNlcnMnOiBzcGFjZVVzZXJzXG5cdFx0XHR9XG5cdFx0fSk7XG5cbiIsIk1ldGVvci5zdGFydHVwKGZ1bmN0aW9uKCkge1xuICByZXR1cm4gSnNvblJvdXRlcy5hZGQoXCJwb3N0XCIsIFwiL2FwaS9mb3JtdWxhL3NwYWNlX3VzZXJzXCIsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgdmFyIGRhdGEsIHF1ZXJ5LCBzZWxlY3RlZCwgc3BhY2VJZCwgc3BhY2VVc2Vycywgc3BhY2VfdXNlcnMsIHVzZXJJZHM7XG4gICAgdXNlcklkcyA9IHJlcS5ib2R5LnVzZXJJZHM7XG4gICAgc3BhY2VJZCA9IHJlcS5xdWVyeS5zcGFjZUlkO1xuICAgIHNwYWNlVXNlcnMgPSBbXTtcbiAgICBkYXRhID0gW107XG4gICAgaWYgKHVzZXJJZHMpIHtcbiAgICAgIGlmICghdXNlcklkcyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIHVzZXJJZHMgPSBbdXNlcklkc107XG4gICAgICB9XG4gICAgICBxdWVyeSA9IHtcbiAgICAgICAgdXNlcjoge1xuICAgICAgICAgICRpbjogdXNlcklkc1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgaWYgKHNwYWNlSWQpIHtcbiAgICAgICAgcXVlcnkuc3BhY2UgPSBzcGFjZUlkO1xuICAgICAgfVxuICAgICAgc3BhY2VfdXNlcnMgPSBkYi5zcGFjZV91c2Vycy5maW5kKHF1ZXJ5KS5mZXRjaCgpO1xuICAgICAgc2VsZWN0ZWQgPSBbXTtcbiAgICAgIHNwYWNlX3VzZXJzLmZvckVhY2goZnVuY3Rpb24odSkge1xuICAgICAgICB2YXIgZnUsIHVfb3JnLCB1X29yZ3MsIHVzZXJfZmxvd19wb3NpdGlvbnMsIHVzZXJfcm9sZV9pZHMsIHVzZXJfcm9sZXM7XG4gICAgICAgIGlmIChzZWxlY3RlZC5pbmRleE9mKHUudXNlcikgPCAwKSB7XG4gICAgICAgICAgZnUgPSB7fTtcbiAgICAgICAgICBmdS5pZCA9IHUudXNlcjtcbiAgICAgICAgICBmdS5uYW1lID0gdS5uYW1lO1xuICAgICAgICAgIGZ1LnNvcnRfbm8gPSB1LnNvcnRfbm87XG4gICAgICAgICAgZnUubW9iaWxlID0gdS5tb2JpbGU7XG4gICAgICAgICAgZnUud29ya19waG9uZSA9IHUud29ya19waG9uZTtcbiAgICAgICAgICBmdS5wb3NpdGlvbiA9IHUucG9zaXRpb247XG4gICAgICAgICAgdV9vcmcgPSBkYi5vcmdhbml6YXRpb25zLmZpbmRPbmUoe1xuICAgICAgICAgICAgX2lkOiB1Lm9yZ2FuaXphdGlvblxuICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICBuYW1lOiAxLFxuICAgICAgICAgICAgICBmdWxsbmFtZTogMVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIHVfb3JncyA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZCh7XG4gICAgICAgICAgICBfaWQ6IHtcbiAgICAgICAgICAgICAgJGluOiB1Lm9yZ2FuaXphdGlvbnNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgbmFtZTogMSxcbiAgICAgICAgICAgICAgZnVsbG5hbWU6IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KS5mZXRjaCgpO1xuICAgICAgICAgIGZ1Lm9yZ2FuaXphdGlvbiA9IHtcbiAgICAgICAgICAgIG5hbWU6IHVfb3JnICE9IG51bGwgPyB1X29yZy5uYW1lIDogdm9pZCAwLFxuICAgICAgICAgICAgZnVsbG5hbWU6IHVfb3JnICE9IG51bGwgPyB1X29yZy5mdWxsbmFtZSA6IHZvaWQgMFxuICAgICAgICAgIH07XG4gICAgICAgICAgZnUub3JnYW5pemF0aW9ucyA9IHtcbiAgICAgICAgICAgIG5hbWU6IHVfb3JncyAhPSBudWxsID8gdV9vcmdzLmdldFByb3BlcnR5KFwibmFtZVwiKSA6IHZvaWQgMCxcbiAgICAgICAgICAgIGZ1bGxuYW1lOiB1X29yZ3MgIT0gbnVsbCA/IHVfb3Jncy5nZXRQcm9wZXJ0eShcImZ1bGxuYW1lXCIpIDogdm9pZCAwXG4gICAgICAgICAgfTtcbiAgICAgICAgICBmdS5ociA9IHUuaHIgfHwge307XG4gICAgICAgICAgaWYgKGRiLmZsb3dfcG9zaXRpb25zICYmIGRiLmZsb3dfcm9sZXMpIHtcbiAgICAgICAgICAgIHVzZXJfZmxvd19wb3NpdGlvbnMgPSBkYi5mbG93X3Bvc2l0aW9ucy5maW5kKHtcbiAgICAgICAgICAgICAgc3BhY2U6IHUuc3BhY2UsXG4gICAgICAgICAgICAgIHVzZXJzOiB1LnVzZXJcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgcm9sZTogMVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KS5mZXRjaCgpO1xuICAgICAgICAgICAgdXNlcl9yb2xlX2lkcyA9IHVzZXJfZmxvd19wb3NpdGlvbnMuZ2V0UHJvcGVydHkoXCJyb2xlXCIpO1xuICAgICAgICAgICAgdXNlcl9yb2xlcyA9IGRiLmZsb3dfcm9sZXMuZmluZCh7XG4gICAgICAgICAgICAgIF9pZDoge1xuICAgICAgICAgICAgICAgICRpbjogdXNlcl9yb2xlX2lkc1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICAgIG5hbWU6IDFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuZmV0Y2goKTtcbiAgICAgICAgICAgIGZ1LnJvbGVzID0gdXNlcl9yb2xlcy5nZXRQcm9wZXJ0eShcIm5hbWVcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGRhdGEucHVzaChmdSk7XG4gICAgICAgICAgcmV0dXJuIHNlbGVjdGVkLnB1c2godS51c2VyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB1c2VySWRzLmZvckVhY2goZnVuY3Rpb24odUlkKSB7XG4gICAgICAgIHJldHVybiBzcGFjZVVzZXJzLnB1c2goXy5maW5kKGRhdGEsIGZ1bmN0aW9uKHN1KSB7XG4gICAgICAgICAgcmV0dXJuIHN1LmlkID09PSB1SWQ7XG4gICAgICAgIH0pKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgY29kZTogMjAwLFxuICAgICAgZGF0YToge1xuICAgICAgICAnc3BhY2VVc2Vycyc6IHNwYWNlVXNlcnNcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59KTtcbiIsIk1ldGVvci5zdGFydHVwIC0+XG5cdEpzb25Sb3V0ZXMuYWRkIFwicG9zdFwiLCBcIi9hcGkvZm9ybXVsYS9vcmdhbml6YXRpb25zXCIsIChyZXEsIHJlcywgbmV4dCkgLT5cblxuXHRcdHJlc19vcmdzID0gW11cblxuXHRcdGRhdGEgPSBbXVxuXG5cdFx0b3JnSWRzID0gcmVxLmJvZHkub3JnSWRzXG5cblx0XHRzcGFjZUlkID0gcmVxLnF1ZXJ5LnNwYWNlSWRcblxuXHRcdGlmIG9yZ0lkc1xuXHRcdFx0aWYgbm90IG9yZ0lkcyBpbnN0YW5jZW9mIEFycmF5XG5cdFx0XHRcdG9yZ0lkcyA9IFtvcmdJZHNdXG5cblx0XHRcdHF1ZXJ5ID0ge19pZDogeyRpbjogb3JnSWRzfX1cblxuXHRcdFx0aWYgc3BhY2VJZFxuXHRcdFx0XHRxdWVyeS5zcGFjZSA9IHNwYWNlSWRcblxuXHRcdFx0b3JncyA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZChxdWVyeSwge2ZpZWxkczoge25hbWU6IDEsIGZ1bGxuYW1lOiAxfX0pLmZldGNoKCk7XG5cblx0XHRcdG9yZ3MuZm9yRWFjaCAob3JnKS0+XG5cdFx0XHRcdGRhdGEucHVzaCB7aWQ6IG9yZy5faWQsIG5hbWU6IG9yZy5uYW1lLCBmdWxsbmFtZTogb3JnLmZ1bGxuYW1lfVxuXG5cdFx0XHRvcmdJZHMuZm9yRWFjaCAob0lkKS0+XG5cdFx0XHRcdHJlc19vcmdzLnB1c2ggXy5maW5kKGRhdGEsIChvKS0+IHJldHVybiBvLmlkID09IG9JZClcblxuXG5cblx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQocmVzLCB7XG5cdFx0XHRjb2RlOiAyMDAsXG5cdFx0XHRkYXRhOiB7XG5cdFx0XHRcdCdvcmdzJzogcmVzX29yZ3Ncblx0XHRcdH1cblx0XHR9KTtcblxuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIHJldHVybiBKc29uUm91dGVzLmFkZChcInBvc3RcIiwgXCIvYXBpL2Zvcm11bGEvb3JnYW5pemF0aW9uc1wiLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICAgIHZhciBkYXRhLCBvcmdJZHMsIG9yZ3MsIHF1ZXJ5LCByZXNfb3Jncywgc3BhY2VJZDtcbiAgICByZXNfb3JncyA9IFtdO1xuICAgIGRhdGEgPSBbXTtcbiAgICBvcmdJZHMgPSByZXEuYm9keS5vcmdJZHM7XG4gICAgc3BhY2VJZCA9IHJlcS5xdWVyeS5zcGFjZUlkO1xuICAgIGlmIChvcmdJZHMpIHtcbiAgICAgIGlmICghb3JnSWRzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgb3JnSWRzID0gW29yZ0lkc107XG4gICAgICB9XG4gICAgICBxdWVyeSA9IHtcbiAgICAgICAgX2lkOiB7XG4gICAgICAgICAgJGluOiBvcmdJZHNcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGlmIChzcGFjZUlkKSB7XG4gICAgICAgIHF1ZXJ5LnNwYWNlID0gc3BhY2VJZDtcbiAgICAgIH1cbiAgICAgIG9yZ3MgPSBkYi5vcmdhbml6YXRpb25zLmZpbmQocXVlcnksIHtcbiAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgbmFtZTogMSxcbiAgICAgICAgICBmdWxsbmFtZTogMVxuICAgICAgICB9XG4gICAgICB9KS5mZXRjaCgpO1xuICAgICAgb3Jncy5mb3JFYWNoKGZ1bmN0aW9uKG9yZykge1xuICAgICAgICByZXR1cm4gZGF0YS5wdXNoKHtcbiAgICAgICAgICBpZDogb3JnLl9pZCxcbiAgICAgICAgICBuYW1lOiBvcmcubmFtZSxcbiAgICAgICAgICBmdWxsbmFtZTogb3JnLmZ1bGxuYW1lXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBvcmdJZHMuZm9yRWFjaChmdW5jdGlvbihvSWQpIHtcbiAgICAgICAgcmV0dXJuIHJlc19vcmdzLnB1c2goXy5maW5kKGRhdGEsIGZ1bmN0aW9uKG8pIHtcbiAgICAgICAgICByZXR1cm4gby5pZCA9PT0gb0lkO1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIEpzb25Sb3V0ZXMuc2VuZFJlc3VsdChyZXMsIHtcbiAgICAgIGNvZGU6IDIwMCxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgJ29yZ3MnOiByZXNfb3Jnc1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
