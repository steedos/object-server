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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS9jbGllbnQvY29yZS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2NsaWVudC9jb3JlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS9jbGllbnQvY29yZWZvcm0vaW5wdXRUeXBlcy9jb3JlZm9ybS11c2VyL2xpYi9jZl90YWJ1bGFyX3NwYWNlX3VzZXIuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9jbGllbnQvY29yZWZvcm0vaW5wdXRUeXBlcy9jb3JlZm9ybS11c2VyL2xpYi9jZl90YWJ1bGFyX3NwYWNlX3VzZXIuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2F1dG9mb3JtL3JvdXRlcy9mb3JtdWxhX3NwYWNlX3VzZXJzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcm91dGVzL2Zvcm11bGFfc3BhY2VfdXNlcnMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2F1dG9mb3JtL3JvdXRlcy9mb3JtdWxhX29yZ2FuaXphdGlvbnMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9yb3V0ZXMvZm9ybXVsYV9vcmdhbml6YXRpb25zLmNvZmZlZSJdLCJuYW1lcyI6WyJUYWJ1bGFyVGFibGVzIiwiTWV0ZW9yIiwic3RhcnR1cCIsIlNpbXBsZVNjaGVtYSIsImV4dGVuZE9wdGlvbnMiLCJiZWZvcmVPcGVuRnVuY3Rpb24iLCJNYXRjaCIsIk9wdGlvbmFsIiwiT25lT2YiLCJGdW5jdGlvbiIsIlN0cmluZyIsImNmX3RhYnVsYXJfc3BhY2VfdXNlciIsIlRhYnVsYXIiLCJUYWJsZSIsIm5hbWUiLCJjb2xsZWN0aW9uIiwiZGIiLCJzcGFjZV91c2VycyIsImRyYXdDYWxsYmFjayIsInNldHRpbmdzIiwiJCIsImF0dHIiLCJjb2x1bW5zIiwiZGF0YSIsInRpdGxlIiwib3JkZXJhYmxlIiwid2lkdGgiLCJyZW5kZXIiLCJ2YWwiLCJ0eXBlIiwiZG9jIiwiaW5wdXQiLCJpbnB1dFR5cGUiLCJyZWYiLCJyZWYxIiwicmVmMiIsImN1c3RvbURhdGEiLCJtdWx0aXBsZSIsInVzZXIiLCJlbWFpbCIsImRlZmF1bHRWYWx1ZXMiLCJpbmNsdWRlcyIsInZpc2libGUiLCJvblVubG9hZCIsImNvbnNvbGUiLCJsb2ciLCJkb20iLCJvcmRlciIsImV4dHJhRmllbGRzIiwibGVuZ3RoQ2hhbmdlIiwicGFnZUxlbmd0aCIsImluZm8iLCJzZWFyY2hpbmciLCJyZXNwb25zaXZlIiwiZGV0YWlscyIsImF1dG9XaWR0aCIsImNoYW5nZVNlbGVjdG9yIiwic2VsZWN0b3IiLCJ1c2VySWQiLCJzcGFjZSIsInNwYWNlX3VzZXIiLCJfaWQiLCIkYW5kIiwibGVuZ3RoIiwiZ2V0UHJvcGVydHkiLCJmaW5kT25lIiwiZmllbGRzIiwicGFnaW5nVHlwZSIsIkpzb25Sb3V0ZXMiLCJhZGQiLCJyZXEiLCJyZXMiLCJuZXh0IiwicXVlcnkiLCJzZWxlY3RlZCIsInNwYWNlSWQiLCJzcGFjZVVzZXJzIiwidXNlcklkcyIsImJvZHkiLCJBcnJheSIsIiRpbiIsImZpbmQiLCJmZXRjaCIsImZvckVhY2giLCJ1IiwiZnUiLCJ1X29yZyIsInVfb3JncyIsInVzZXJfZmxvd19wb3NpdGlvbnMiLCJ1c2VyX3JvbGVfaWRzIiwidXNlcl9yb2xlcyIsImluZGV4T2YiLCJpZCIsInNvcnRfbm8iLCJtb2JpbGUiLCJ3b3JrX3Bob25lIiwicG9zaXRpb24iLCJvcmdhbml6YXRpb25zIiwib3JnYW5pemF0aW9uIiwiZnVsbG5hbWUiLCJociIsImZsb3dfcG9zaXRpb25zIiwiZmxvd19yb2xlcyIsInVzZXJzIiwicm9sZSIsInJvbGVzIiwicHVzaCIsInVJZCIsIl8iLCJzdSIsInNlbmRSZXN1bHQiLCJjb2RlIiwib3JnSWRzIiwib3JncyIsInJlc19vcmdzIiwib3JnIiwib0lkIiwibyJdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7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Qjs7QUFFQSxRQUFHcUMsTUFBSDtBQUNDLFVBQUcsQ0FBSUEsTUFBSixZQUFzQmpDLEtBQXpCO0FBQ0NpQyxpQkFBUyxDQUFDQSxNQUFELENBQVQ7QUNIRzs7QURLSnZDLGNBQVE7QUFBQ1osYUFBSztBQUFDbUIsZUFBS2dDO0FBQU47QUFBTixPQUFSOztBQUVBLFVBQUdyQyxPQUFIO0FBQ0NGLGNBQU1kLEtBQU4sR0FBY2dCLE9BQWQ7QUNBRzs7QURFSnNDLGFBQU9qRyxHQUFHaUYsYUFBSCxDQUFpQmhCLElBQWpCLENBQXNCUixLQUF0QixFQUE2QjtBQUFDUCxnQkFBUTtBQUFDcEQsZ0JBQU0sQ0FBUDtBQUFVcUYsb0JBQVU7QUFBcEI7QUFBVCxPQUE3QixFQUErRGpCLEtBQS9ELEVBQVA7QUFFQStCLFdBQUs5QixPQUFMLENBQWEsVUFBQ2dDLEdBQUQ7QUNJUixlREhKNUYsS0FBS21GLElBQUwsQ0FBVTtBQUFDZCxjQUFJdUIsSUFBSXRELEdBQVQ7QUFBYy9DLGdCQUFNcUcsSUFBSXJHLElBQXhCO0FBQThCcUYsb0JBQVVnQixJQUFJaEI7QUFBNUMsU0FBVixDQ0dJO0FESkw7QUFHQWEsYUFBTzdCLE9BQVAsQ0FBZSxVQUFDaUMsR0FBRDtBQ1FWLGVEUEpGLFNBQVNSLElBQVQsQ0FBY0UsRUFBRTNCLElBQUYsQ0FBTzFELElBQVAsRUFBYSxVQUFDOEYsQ0FBRDtBQUFNLGlCQUFPQSxFQUFFekIsRUFBRixLQUFRd0IsR0FBZjtBQUFuQixVQUFkLENDT0k7QURSTDtBQ1lFOztBQUNELFdEUkZoRCxXQUFXMEMsVUFBWCxDQUFzQnZDLEdBQXRCLEVBQTJCO0FBQzFCd0MsWUFBTSxHQURvQjtBQUUxQnhGLFlBQU07QUFDTCxnQkFBUTJGO0FBREg7QUFGb0IsS0FBM0IsQ0NRRTtBRHJDSCxJQ0FDO0FEREYsRyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19hdXRvZm9ybS5qcyIsInNvdXJjZXNDb250ZW50IjpbIkBUYWJ1bGFyVGFibGVzID0ge307XHJcblxyXG5cclxuTWV0ZW9yLnN0YXJ0dXAgLT5cclxuXHRTaW1wbGVTY2hlbWEuZXh0ZW5kT3B0aW9ucyh7YmVmb3JlT3BlbkZ1bmN0aW9uOiBNYXRjaC5PcHRpb25hbChNYXRjaC5PbmVPZihGdW5jdGlvbiwgU3RyaW5nKSl9KSIsInRoaXMuVGFidWxhclRhYmxlcyA9IHt9O1xuXG5NZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFNpbXBsZVNjaGVtYS5leHRlbmRPcHRpb25zKHtcbiAgICBiZWZvcmVPcGVuRnVuY3Rpb246IE1hdGNoLk9wdGlvbmFsKE1hdGNoLk9uZU9mKEZ1bmN0aW9uLCBTdHJpbmcpKVxuICB9KTtcbn0pO1xuIiwiTWV0ZW9yLnN0YXJ0dXAgKCktPlxyXG5cdFRhYnVsYXJUYWJsZXMuY2ZfdGFidWxhcl9zcGFjZV91c2VyID0gbmV3IFRhYnVsYXIuVGFibGUoe1xyXG5cdFx0bmFtZTogXCJjZl90YWJ1bGFyX3NwYWNlX3VzZXJcIixcclxuXHRcdGNvbGxlY3Rpb246IGRiLnNwYWNlX3VzZXJzLFxyXG5cdFx0ZHJhd0NhbGxiYWNrOiAoc2V0dGluZ3MpLT5cclxuXHRcdFx0JChcIiNjZl9yZXZlcnNlXCIpLmF0dHIoXCJjaGVja2VkXCIsIGZhbHNlKVxyXG5cdFx0Y29sdW1uczogW1xyXG5cdFx0XHR7XHJcblx0XHRcdFx0ZGF0YTogXCJfaWRcIixcclxuXHRcdFx0XHR0aXRsZTogJzxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiY2ZfcmV2ZXJzZVwiIGlkPVwiY2ZfcmV2ZXJzZVwiPicsXHJcblx0XHRcdFx0b3JkZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHR3aWR0aDonMTBweCcsXHJcblx0XHRcdFx0cmVuZGVyOiAgKHZhbCwgdHlwZSwgZG9jKSAtPlxyXG5cclxuXHRcdFx0XHRcdGlucHV0VHlwZSA9IFwiY2hlY2tib3hcIjtcclxuXHJcblx0XHRcdFx0XHRpZiAhVGFidWxhclRhYmxlcy5jZl90YWJ1bGFyX3NwYWNlX3VzZXIuY3VzdG9tRGF0YT8ubXVsdGlwbGVcclxuXHRcdFx0XHRcdFx0aW5wdXRUeXBlID0gXCJyYWRpb1wiXHJcblxyXG5cdFx0XHRcdFx0aW5wdXQgPSAnPGlucHV0IHR5cGU9XCInICsgaW5wdXRUeXBlICsgJ1wiIGNsYXNzPVwibGlzdF9jaGVja2JveFwiIG5hbWU9XCJjZl9jb250YWN0c19pZHNcIiBpZD1cIicgKyBkb2MudXNlciArICdcIiB2YWx1ZT1cIicgKyBkb2MudXNlciArICdcIiBkYXRhLW5hbWU9XCInICsgZG9jLm5hbWUgKyAnXCIgZGF0YS1lbWFpbD1cIicgKyBkb2MuZW1haWwgKyAnXCInO1xyXG5cclxuXHRcdFx0XHRcdGlmIFRhYnVsYXJUYWJsZXMuY2ZfdGFidWxhcl9zcGFjZV91c2VyLmN1c3RvbURhdGE/LmRlZmF1bHRWYWx1ZXM/LmluY2x1ZGVzKGRvYy51c2VyKVxyXG5cdFx0XHRcdFx0XHRpbnB1dCArPSBcIiBjaGVja2VkIFwiXHJcblxyXG5cdFx0XHRcdFx0aW5wdXQgKz0gXCI+XCJcclxuXHRcdFx0XHRcdHJldHVybiBpbnB1dFxyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0ZGF0YTogXCJuYW1lXCIsXHJcblx0XHRcdFx0b3JkZXJhYmxlOiBmYWxzZSxcclxuXHRcdFx0XHRyZW5kZXI6ICAodmFsLCB0eXBlLCBkb2MpIC0+XHJcblx0XHRcdFx0XHRyZXR1cm4gXCI8bGFiZWwgZGF0YS11c2VyPSdcIiArIGRvYy51c2VyICsgXCInIGNsYXNzPSdmb3ItaW5wdXQnPjxkaXYgY2xhc3M9J3VzZXItbmFtZSc+PGZvbnQ+XCIgKyBkb2MubmFtZSArIFwiPC9mb250PjwvZGl2PjwvbGFiZWw+XCJcclxuXHRcdFx0fSxcclxuXHRcdFx0e1xyXG5cdFx0XHRcdGRhdGE6IFwic29ydF9ub1wiLFxyXG5cdFx0XHRcdHRpdGxlOiBcIlwiLFxyXG5cdFx0XHRcdG9yZGVyYWJsZTogdHJ1ZSxcclxuXHRcdFx0XHR2aXNpYmxlOiBmYWxzZVxyXG5cdFx0XHR9LFxyXG5cdFx0XHR7XHJcblx0XHRcdFx0ZGF0YTogXCJuYW1lXCIsXHJcblx0XHRcdFx0dGl0bGU6IFwiXCIsXHJcblx0XHRcdFx0b3JkZXJhYmxlOiB0cnVlLFxyXG5cdFx0XHRcdHZpc2libGU6IGZhbHNlXHJcblx0XHRcdH0se1xyXG5cdFx0XHRcdGRhdGE6IFwiZW1haWxcIixcclxuXHRcdFx0XHR0aXRsZTogXCJcIixcclxuXHRcdFx0XHRvcmRlcmFibGU6IGZhbHNlLFxyXG5cdFx0XHRcdHZpc2libGU6IGZhbHNlXHJcblx0XHRcdH1cclxuXHRcdF0sXHJcblx0XHRvblVubG9hZDooKSAtPlxyXG5cdFx0XHRyZXR1cm4gY29uc29sZS5sb2coXCJvblVubG9hZCBvay4uLi5cIik7XHJcbiNzZWxlY3Q6XHJcbiMgIHN0eWxlOiAnc2luZ2xlJ1xyXG5cdFx0ZG9tOiBcInRwXCIsXHJcblx0XHRvcmRlcjpbWzIsXCJkZXNjXCJdLFszLFwiYXNjXCJdXSxcclxuXHRcdGV4dHJhRmllbGRzOiBbXCJfaWRcIiwgXCJuYW1lXCIsIFwidXNlclwiLCBcInNvcnRfbm9cIiwgXCJlbWFpbFwiXSxcclxuXHRcdGxlbmd0aENoYW5nZTogZmFsc2UsXHJcblx0XHRwYWdlTGVuZ3RoOiAxMDAsXHJcblx0XHRpbmZvOiBmYWxzZSxcclxuXHRcdHNlYXJjaGluZzogdHJ1ZSxcclxuXHRcdHJlc3BvbnNpdmU6XHJcblx0XHRcdGRldGFpbHM6IGZhbHNlXHJcblx0XHRhdXRvV2lkdGg6IGZhbHNlLFxyXG5cdFx0Y2hhbmdlU2VsZWN0b3I6IChzZWxlY3RvciwgdXNlcklkKSAtPlxyXG5cdFx0XHR1bmxlc3MgdXNlcklkXHJcblx0XHRcdFx0cmV0dXJuIHtfaWQ6IC0xfVxyXG5cdFx0XHRzcGFjZSA9IHNlbGVjdG9yLnNwYWNlXHJcblx0XHRcdHVubGVzcyBzcGFjZVxyXG5cdFx0XHRcdGlmIHNlbGVjdG9yPy4kYW5kPy5sZW5ndGggPiAwXHJcblx0XHRcdFx0XHRzcGFjZSA9IHNlbGVjdG9yLiRhbmQuZ2V0UHJvcGVydHkoJ3NwYWNlJylbMF1cclxuXHRcdFx0dW5sZXNzIHNwYWNlXHJcblx0XHRcdFx0cmV0dXJuIHtfaWQ6IC0xfVxyXG5cdFx0XHRzcGFjZV91c2VyID0gZGIuc3BhY2VfdXNlcnMuZmluZE9uZSh7dXNlcjogdXNlcklkLHNwYWNlOnNwYWNlfSwge2ZpZWxkczoge19pZDogMX19KVxyXG5cdFx0XHR1bmxlc3Mgc3BhY2VfdXNlclxyXG5cdFx0XHRcdHJldHVybiB7X2lkOiAtMX1cclxuXHRcdFx0cmV0dXJuIHNlbGVjdG9yXHJcblxyXG4jc2Nyb2xsWTogICAgICAgICc0MDBweCcsXHJcbiNzY3JvbGxDb2xsYXBzZTogdHJ1ZSxcclxuXHRcdHBhZ2luZ1R5cGU6IFwibnVtYmVyc1wiXHJcblxyXG5cdH0pO1xyXG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFRhYnVsYXJUYWJsZXMuY2ZfdGFidWxhcl9zcGFjZV91c2VyID0gbmV3IFRhYnVsYXIuVGFibGUoe1xuICAgIG5hbWU6IFwiY2ZfdGFidWxhcl9zcGFjZV91c2VyXCIsXG4gICAgY29sbGVjdGlvbjogZGIuc3BhY2VfdXNlcnMsXG4gICAgZHJhd0NhbGxiYWNrOiBmdW5jdGlvbihzZXR0aW5ncykge1xuICAgICAgcmV0dXJuICQoXCIjY2ZfcmV2ZXJzZVwiKS5hdHRyKFwiY2hlY2tlZFwiLCBmYWxzZSk7XG4gICAgfSxcbiAgICBjb2x1bW5zOiBbXG4gICAgICB7XG4gICAgICAgIGRhdGE6IFwiX2lkXCIsXG4gICAgICAgIHRpdGxlOiAnPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJjZl9yZXZlcnNlXCIgaWQ9XCJjZl9yZXZlcnNlXCI+JyxcbiAgICAgICAgb3JkZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgd2lkdGg6ICcxMHB4JyxcbiAgICAgICAgcmVuZGVyOiBmdW5jdGlvbih2YWwsIHR5cGUsIGRvYykge1xuICAgICAgICAgIHZhciBpbnB1dCwgaW5wdXRUeXBlLCByZWYsIHJlZjEsIHJlZjI7XG4gICAgICAgICAgaW5wdXRUeXBlID0gXCJjaGVja2JveFwiO1xuICAgICAgICAgIGlmICghKChyZWYgPSBUYWJ1bGFyVGFibGVzLmNmX3RhYnVsYXJfc3BhY2VfdXNlci5jdXN0b21EYXRhKSAhPSBudWxsID8gcmVmLm11bHRpcGxlIDogdm9pZCAwKSkge1xuICAgICAgICAgICAgaW5wdXRUeXBlID0gXCJyYWRpb1wiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpbnB1dCA9ICc8aW5wdXQgdHlwZT1cIicgKyBpbnB1dFR5cGUgKyAnXCIgY2xhc3M9XCJsaXN0X2NoZWNrYm94XCIgbmFtZT1cImNmX2NvbnRhY3RzX2lkc1wiIGlkPVwiJyArIGRvYy51c2VyICsgJ1wiIHZhbHVlPVwiJyArIGRvYy51c2VyICsgJ1wiIGRhdGEtbmFtZT1cIicgKyBkb2MubmFtZSArICdcIiBkYXRhLWVtYWlsPVwiJyArIGRvYy5lbWFpbCArICdcIic7XG4gICAgICAgICAgaWYgKChyZWYxID0gVGFidWxhclRhYmxlcy5jZl90YWJ1bGFyX3NwYWNlX3VzZXIuY3VzdG9tRGF0YSkgIT0gbnVsbCA/IChyZWYyID0gcmVmMS5kZWZhdWx0VmFsdWVzKSAhPSBudWxsID8gcmVmMi5pbmNsdWRlcyhkb2MudXNlcikgOiB2b2lkIDAgOiB2b2lkIDApIHtcbiAgICAgICAgICAgIGlucHV0ICs9IFwiIGNoZWNrZWQgXCI7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlucHV0ICs9IFwiPlwiO1xuICAgICAgICAgIHJldHVybiBpbnB1dDtcbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICBkYXRhOiBcIm5hbWVcIixcbiAgICAgICAgb3JkZXJhYmxlOiBmYWxzZSxcbiAgICAgICAgcmVuZGVyOiBmdW5jdGlvbih2YWwsIHR5cGUsIGRvYykge1xuICAgICAgICAgIHJldHVybiBcIjxsYWJlbCBkYXRhLXVzZXI9J1wiICsgZG9jLnVzZXIgKyBcIicgY2xhc3M9J2Zvci1pbnB1dCc+PGRpdiBjbGFzcz0ndXNlci1uYW1lJz48Zm9udD5cIiArIGRvYy5uYW1lICsgXCI8L2ZvbnQ+PC9kaXY+PC9sYWJlbD5cIjtcbiAgICAgICAgfVxuICAgICAgfSwge1xuICAgICAgICBkYXRhOiBcInNvcnRfbm9cIixcbiAgICAgICAgdGl0bGU6IFwiXCIsXG4gICAgICAgIG9yZGVyYWJsZTogdHJ1ZSxcbiAgICAgICAgdmlzaWJsZTogZmFsc2VcbiAgICAgIH0sIHtcbiAgICAgICAgZGF0YTogXCJuYW1lXCIsXG4gICAgICAgIHRpdGxlOiBcIlwiLFxuICAgICAgICBvcmRlcmFibGU6IHRydWUsXG4gICAgICAgIHZpc2libGU6IGZhbHNlXG4gICAgICB9LCB7XG4gICAgICAgIGRhdGE6IFwiZW1haWxcIixcbiAgICAgICAgdGl0bGU6IFwiXCIsXG4gICAgICAgIG9yZGVyYWJsZTogZmFsc2UsXG4gICAgICAgIHZpc2libGU6IGZhbHNlXG4gICAgICB9XG4gICAgXSxcbiAgICBvblVubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gY29uc29sZS5sb2coXCJvblVubG9hZCBvay4uLi5cIik7XG4gICAgfSxcbiAgICBkb206IFwidHBcIixcbiAgICBvcmRlcjogW1syLCBcImRlc2NcIl0sIFszLCBcImFzY1wiXV0sXG4gICAgZXh0cmFGaWVsZHM6IFtcIl9pZFwiLCBcIm5hbWVcIiwgXCJ1c2VyXCIsIFwic29ydF9ub1wiLCBcImVtYWlsXCJdLFxuICAgIGxlbmd0aENoYW5nZTogZmFsc2UsXG4gICAgcGFnZUxlbmd0aDogMTAwLFxuICAgIGluZm86IGZhbHNlLFxuICAgIHNlYXJjaGluZzogdHJ1ZSxcbiAgICByZXNwb25zaXZlOiB7XG4gICAgICBkZXRhaWxzOiBmYWxzZVxuICAgIH0sXG4gICAgYXV0b1dpZHRoOiBmYWxzZSxcbiAgICBjaGFuZ2VTZWxlY3RvcjogZnVuY3Rpb24oc2VsZWN0b3IsIHVzZXJJZCkge1xuICAgICAgdmFyIHJlZiwgc3BhY2UsIHNwYWNlX3VzZXI7XG4gICAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIF9pZDogLTFcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHNwYWNlID0gc2VsZWN0b3Iuc3BhY2U7XG4gICAgICBpZiAoIXNwYWNlKSB7XG4gICAgICAgIGlmICgoc2VsZWN0b3IgIT0gbnVsbCA/IChyZWYgPSBzZWxlY3Rvci4kYW5kKSAhPSBudWxsID8gcmVmLmxlbmd0aCA6IHZvaWQgMCA6IHZvaWQgMCkgPiAwKSB7XG4gICAgICAgICAgc3BhY2UgPSBzZWxlY3Rvci4kYW5kLmdldFByb3BlcnR5KCdzcGFjZScpWzBdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIXNwYWNlKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgX2lkOiAtMVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgc3BhY2VfdXNlciA9IGRiLnNwYWNlX3VzZXJzLmZpbmRPbmUoe1xuICAgICAgICB1c2VyOiB1c2VySWQsXG4gICAgICAgIHNwYWNlOiBzcGFjZVxuICAgICAgfSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBfaWQ6IDFcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBpZiAoIXNwYWNlX3VzZXIpIHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBfaWQ6IC0xXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gc2VsZWN0b3I7XG4gICAgfSxcbiAgICBwYWdpbmdUeXBlOiBcIm51bWJlcnNcIlxuICB9KTtcbn0pO1xuIiwiTWV0ZW9yLnN0YXJ0dXAgLT5cclxuXHRKc29uUm91dGVzLmFkZCBcInBvc3RcIiwgXCIvYXBpL2Zvcm11bGEvc3BhY2VfdXNlcnNcIiwgKHJlcSwgcmVzLCBuZXh0KSAtPlxyXG5cdFx0dXNlcklkcyA9IHJlcS5ib2R5LnVzZXJJZHNcclxuXHRcdHNwYWNlSWQgPSByZXEucXVlcnkuc3BhY2VJZFxyXG5cclxuXHRcdHNwYWNlVXNlcnMgPSBbXVxyXG5cclxuXHRcdGRhdGEgPSBbXVxyXG5cclxuXHRcdGlmICh1c2VySWRzKVxyXG5cclxuXHRcdFx0aWYgbm90IHVzZXJJZHMgaW5zdGFuY2VvZiBBcnJheVxyXG5cdFx0XHRcdHVzZXJJZHMgPSBbdXNlcklkc11cclxuXHJcblx0XHRcdHF1ZXJ5ID0ge1xyXG5cdFx0XHRcdHVzZXI6IHtcclxuXHRcdFx0XHRcdCRpbjogdXNlcklkc1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgc3BhY2VJZFxyXG5cdFx0XHRcdHF1ZXJ5LnNwYWNlID0gc3BhY2VJZFxyXG5cclxuXHRcdFx0c3BhY2VfdXNlcnMgPSBkYi5zcGFjZV91c2Vycy5maW5kKHF1ZXJ5KS5mZXRjaCgpO1xyXG5cclxuXHRcdFx0c2VsZWN0ZWQgPSBbXVxyXG5cclxuXHRcdFx0c3BhY2VfdXNlcnMuZm9yRWFjaCAodSktPlxyXG5cdFx0XHRcdGlmIHNlbGVjdGVkLmluZGV4T2YodS51c2VyKSA8IDBcclxuXHRcdFx0XHRcdGZ1ID0ge31cclxuXHJcblx0XHRcdFx0XHRmdS5pZCA9IHUudXNlclxyXG5cclxuXHRcdFx0XHRcdGZ1Lm5hbWUgPSB1Lm5hbWVcclxuXHJcblx0XHRcdFx0XHRmdS5zb3J0X25vID0gdS5zb3J0X25vXHJcblxyXG5cdFx0XHRcdFx0ZnUubW9iaWxlID0gdS5tb2JpbGVcclxuXHJcblx0XHRcdFx0XHRmdS53b3JrX3Bob25lID0gdS53b3JrX3Bob25lXHJcblxyXG5cdFx0XHRcdFx0ZnUucG9zaXRpb24gPSB1LnBvc2l0aW9uXHJcblxyXG5cdFx0XHRcdFx0dV9vcmcgPSBkYi5vcmdhbml6YXRpb25zLmZpbmRPbmUoe19pZDogdS5vcmdhbml6YXRpb259LCB7ZmllbGRzOiB7bmFtZTogMSwgZnVsbG5hbWU6IDF9fSlcclxuXHJcblx0XHRcdFx0XHR1X29yZ3MgPSBkYi5vcmdhbml6YXRpb25zLmZpbmQoe19pZDogeyRpbjogdS5vcmdhbml6YXRpb25zfX0sIHtmaWVsZHM6IHtuYW1lOiAxLCBmdWxsbmFtZTogMX19KS5mZXRjaCgpXHJcblxyXG5cclxuXHRcdFx0XHRcdGZ1Lm9yZ2FuaXphdGlvbiA9IHtcclxuXHRcdFx0XHRcdFx0bmFtZTogdV9vcmc/Lm5hbWUsXHJcblx0XHRcdFx0XHRcdGZ1bGxuYW1lOiB1X29yZz8uZnVsbG5hbWVcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRmdS5vcmdhbml6YXRpb25zID0ge1xyXG5cdFx0XHRcdFx0XHRuYW1lOiB1X29yZ3M/LmdldFByb3BlcnR5KFwibmFtZVwiKSxcclxuXHRcdFx0XHRcdFx0ZnVsbG5hbWU6IHVfb3Jncz8uZ2V0UHJvcGVydHkoXCJmdWxsbmFtZVwiKSxcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRmdS5ociA9IHUuaHIgfHwge31cclxuXHJcblx0XHRcdFx0XHRpZiBkYi5mbG93X3Bvc2l0aW9ucyAmJiBkYi5mbG93X3JvbGVzXHJcblxyXG5cdFx0XHRcdFx0XHR1c2VyX2Zsb3dfcG9zaXRpb25zID0gZGIuZmxvd19wb3NpdGlvbnMuZmluZCh7c3BhY2U6IHUuc3BhY2UsIHVzZXJzOiB1LnVzZXJ9LCB7ZmllbGRzOiB7cm9sZTogMX19KS5mZXRjaCgpO1xyXG5cclxuXHRcdFx0XHRcdFx0dXNlcl9yb2xlX2lkcyA9IHVzZXJfZmxvd19wb3NpdGlvbnMuZ2V0UHJvcGVydHkoXCJyb2xlXCIpO1xyXG5cclxuXHRcdFx0XHRcdFx0dXNlcl9yb2xlcyA9IGRiLmZsb3dfcm9sZXMuZmluZCh7X2lkOiB7JGluOiB1c2VyX3JvbGVfaWRzfX0sIHtmaWVsZHM6IHtuYW1lOiAxfX0pLmZldGNoKCk7XHJcblxyXG5cdFx0XHRcdFx0XHRmdS5yb2xlcyA9IHVzZXJfcm9sZXMuZ2V0UHJvcGVydHkoXCJuYW1lXCIpXHJcblxyXG5cdFx0XHRcdFx0ZGF0YS5wdXNoIGZ1XHJcblxyXG5cdFx0XHRcdFx0c2VsZWN0ZWQucHVzaCB1LnVzZXJcclxuXHJcblx0XHRcdHVzZXJJZHMuZm9yRWFjaCAodUlkKS0+XHJcblx0XHRcdFx0c3BhY2VVc2Vycy5wdXNoIF8uZmluZChkYXRhLCAoc3UpLT4gcmV0dXJuIHN1LmlkID09IHVJZClcclxuXHJcblxyXG5cdFx0SnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xyXG5cdFx0XHRjb2RlOiAyMDAsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHQnc3BhY2VVc2Vycyc6IHNwYWNlVXNlcnNcclxuXHRcdFx0fVxyXG5cdFx0fSk7XHJcblxyXG4iLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcbiAgcmV0dXJuIEpzb25Sb3V0ZXMuYWRkKFwicG9zdFwiLCBcIi9hcGkvZm9ybXVsYS9zcGFjZV91c2Vyc1wiLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICAgIHZhciBkYXRhLCBxdWVyeSwgc2VsZWN0ZWQsIHNwYWNlSWQsIHNwYWNlVXNlcnMsIHNwYWNlX3VzZXJzLCB1c2VySWRzO1xuICAgIHVzZXJJZHMgPSByZXEuYm9keS51c2VySWRzO1xuICAgIHNwYWNlSWQgPSByZXEucXVlcnkuc3BhY2VJZDtcbiAgICBzcGFjZVVzZXJzID0gW107XG4gICAgZGF0YSA9IFtdO1xuICAgIGlmICh1c2VySWRzKSB7XG4gICAgICBpZiAoIXVzZXJJZHMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICB1c2VySWRzID0gW3VzZXJJZHNdO1xuICAgICAgfVxuICAgICAgcXVlcnkgPSB7XG4gICAgICAgIHVzZXI6IHtcbiAgICAgICAgICAkaW46IHVzZXJJZHNcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGlmIChzcGFjZUlkKSB7XG4gICAgICAgIHF1ZXJ5LnNwYWNlID0gc3BhY2VJZDtcbiAgICAgIH1cbiAgICAgIHNwYWNlX3VzZXJzID0gZGIuc3BhY2VfdXNlcnMuZmluZChxdWVyeSkuZmV0Y2goKTtcbiAgICAgIHNlbGVjdGVkID0gW107XG4gICAgICBzcGFjZV91c2Vycy5mb3JFYWNoKGZ1bmN0aW9uKHUpIHtcbiAgICAgICAgdmFyIGZ1LCB1X29yZywgdV9vcmdzLCB1c2VyX2Zsb3dfcG9zaXRpb25zLCB1c2VyX3JvbGVfaWRzLCB1c2VyX3JvbGVzO1xuICAgICAgICBpZiAoc2VsZWN0ZWQuaW5kZXhPZih1LnVzZXIpIDwgMCkge1xuICAgICAgICAgIGZ1ID0ge307XG4gICAgICAgICAgZnUuaWQgPSB1LnVzZXI7XG4gICAgICAgICAgZnUubmFtZSA9IHUubmFtZTtcbiAgICAgICAgICBmdS5zb3J0X25vID0gdS5zb3J0X25vO1xuICAgICAgICAgIGZ1Lm1vYmlsZSA9IHUubW9iaWxlO1xuICAgICAgICAgIGZ1LndvcmtfcGhvbmUgPSB1LndvcmtfcGhvbmU7XG4gICAgICAgICAgZnUucG9zaXRpb24gPSB1LnBvc2l0aW9uO1xuICAgICAgICAgIHVfb3JnID0gZGIub3JnYW5pemF0aW9ucy5maW5kT25lKHtcbiAgICAgICAgICAgIF9pZDogdS5vcmdhbml6YXRpb25cbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgbmFtZTogMSxcbiAgICAgICAgICAgICAgZnVsbG5hbWU6IDFcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICB1X29yZ3MgPSBkYi5vcmdhbml6YXRpb25zLmZpbmQoe1xuICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICRpbjogdS5vcmdhbml6YXRpb25zXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSwge1xuICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgIG5hbWU6IDEsXG4gICAgICAgICAgICAgIGZ1bGxuYW1lOiAxXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkuZmV0Y2goKTtcbiAgICAgICAgICBmdS5vcmdhbml6YXRpb24gPSB7XG4gICAgICAgICAgICBuYW1lOiB1X29yZyAhPSBudWxsID8gdV9vcmcubmFtZSA6IHZvaWQgMCxcbiAgICAgICAgICAgIGZ1bGxuYW1lOiB1X29yZyAhPSBudWxsID8gdV9vcmcuZnVsbG5hbWUgOiB2b2lkIDBcbiAgICAgICAgICB9O1xuICAgICAgICAgIGZ1Lm9yZ2FuaXphdGlvbnMgPSB7XG4gICAgICAgICAgICBuYW1lOiB1X29yZ3MgIT0gbnVsbCA/IHVfb3Jncy5nZXRQcm9wZXJ0eShcIm5hbWVcIikgOiB2b2lkIDAsXG4gICAgICAgICAgICBmdWxsbmFtZTogdV9vcmdzICE9IG51bGwgPyB1X29yZ3MuZ2V0UHJvcGVydHkoXCJmdWxsbmFtZVwiKSA6IHZvaWQgMFxuICAgICAgICAgIH07XG4gICAgICAgICAgZnUuaHIgPSB1LmhyIHx8IHt9O1xuICAgICAgICAgIGlmIChkYi5mbG93X3Bvc2l0aW9ucyAmJiBkYi5mbG93X3JvbGVzKSB7XG4gICAgICAgICAgICB1c2VyX2Zsb3dfcG9zaXRpb25zID0gZGIuZmxvd19wb3NpdGlvbnMuZmluZCh7XG4gICAgICAgICAgICAgIHNwYWNlOiB1LnNwYWNlLFxuICAgICAgICAgICAgICB1c2VyczogdS51c2VyXG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICAgIHJvbGU6IDFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuZmV0Y2goKTtcbiAgICAgICAgICAgIHVzZXJfcm9sZV9pZHMgPSB1c2VyX2Zsb3dfcG9zaXRpb25zLmdldFByb3BlcnR5KFwicm9sZVwiKTtcbiAgICAgICAgICAgIHVzZXJfcm9sZXMgPSBkYi5mbG93X3JvbGVzLmZpbmQoe1xuICAgICAgICAgICAgICBfaWQ6IHtcbiAgICAgICAgICAgICAgICAkaW46IHVzZXJfcm9sZV9pZHNcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAxXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLmZldGNoKCk7XG4gICAgICAgICAgICBmdS5yb2xlcyA9IHVzZXJfcm9sZXMuZ2V0UHJvcGVydHkoXCJuYW1lXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBkYXRhLnB1c2goZnUpO1xuICAgICAgICAgIHJldHVybiBzZWxlY3RlZC5wdXNoKHUudXNlcik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgdXNlcklkcy5mb3JFYWNoKGZ1bmN0aW9uKHVJZCkge1xuICAgICAgICByZXR1cm4gc3BhY2VVc2Vycy5wdXNoKF8uZmluZChkYXRhLCBmdW5jdGlvbihzdSkge1xuICAgICAgICAgIHJldHVybiBzdS5pZCA9PT0gdUlkO1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIEpzb25Sb3V0ZXMuc2VuZFJlc3VsdChyZXMsIHtcbiAgICAgIGNvZGU6IDIwMCxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgJ3NwYWNlVXNlcnMnOiBzcGFjZVVzZXJzXG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufSk7XG4iLCJNZXRlb3Iuc3RhcnR1cCAtPlxyXG5cdEpzb25Sb3V0ZXMuYWRkIFwicG9zdFwiLCBcIi9hcGkvZm9ybXVsYS9vcmdhbml6YXRpb25zXCIsIChyZXEsIHJlcywgbmV4dCkgLT5cclxuXHJcblx0XHRyZXNfb3JncyA9IFtdXHJcblxyXG5cdFx0ZGF0YSA9IFtdXHJcblxyXG5cdFx0b3JnSWRzID0gcmVxLmJvZHkub3JnSWRzXHJcblxyXG5cdFx0c3BhY2VJZCA9IHJlcS5xdWVyeS5zcGFjZUlkXHJcblxyXG5cdFx0aWYgb3JnSWRzXHJcblx0XHRcdGlmIG5vdCBvcmdJZHMgaW5zdGFuY2VvZiBBcnJheVxyXG5cdFx0XHRcdG9yZ0lkcyA9IFtvcmdJZHNdXHJcblxyXG5cdFx0XHRxdWVyeSA9IHtfaWQ6IHskaW46IG9yZ0lkc319XHJcblxyXG5cdFx0XHRpZiBzcGFjZUlkXHJcblx0XHRcdFx0cXVlcnkuc3BhY2UgPSBzcGFjZUlkXHJcblxyXG5cdFx0XHRvcmdzID0gZGIub3JnYW5pemF0aW9ucy5maW5kKHF1ZXJ5LCB7ZmllbGRzOiB7bmFtZTogMSwgZnVsbG5hbWU6IDF9fSkuZmV0Y2goKTtcclxuXHJcblx0XHRcdG9yZ3MuZm9yRWFjaCAob3JnKS0+XHJcblx0XHRcdFx0ZGF0YS5wdXNoIHtpZDogb3JnLl9pZCwgbmFtZTogb3JnLm5hbWUsIGZ1bGxuYW1lOiBvcmcuZnVsbG5hbWV9XHJcblxyXG5cdFx0XHRvcmdJZHMuZm9yRWFjaCAob0lkKS0+XHJcblx0XHRcdFx0cmVzX29yZ3MucHVzaCBfLmZpbmQoZGF0YSwgKG8pLT4gcmV0dXJuIG8uaWQgPT0gb0lkKVxyXG5cclxuXHJcblxyXG5cdFx0SnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xyXG5cdFx0XHRjb2RlOiAyMDAsXHJcblx0XHRcdGRhdGE6IHtcclxuXHRcdFx0XHQnb3Jncyc6IHJlc19vcmdzXHJcblx0XHRcdH1cclxuXHRcdH0pO1xyXG5cclxuIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIHJldHVybiBKc29uUm91dGVzLmFkZChcInBvc3RcIiwgXCIvYXBpL2Zvcm11bGEvb3JnYW5pemF0aW9uc1wiLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICAgIHZhciBkYXRhLCBvcmdJZHMsIG9yZ3MsIHF1ZXJ5LCByZXNfb3Jncywgc3BhY2VJZDtcbiAgICByZXNfb3JncyA9IFtdO1xuICAgIGRhdGEgPSBbXTtcbiAgICBvcmdJZHMgPSByZXEuYm9keS5vcmdJZHM7XG4gICAgc3BhY2VJZCA9IHJlcS5xdWVyeS5zcGFjZUlkO1xuICAgIGlmIChvcmdJZHMpIHtcbiAgICAgIGlmICghb3JnSWRzIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgb3JnSWRzID0gW29yZ0lkc107XG4gICAgICB9XG4gICAgICBxdWVyeSA9IHtcbiAgICAgICAgX2lkOiB7XG4gICAgICAgICAgJGluOiBvcmdJZHNcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIGlmIChzcGFjZUlkKSB7XG4gICAgICAgIHF1ZXJ5LnNwYWNlID0gc3BhY2VJZDtcbiAgICAgIH1cbiAgICAgIG9yZ3MgPSBkYi5vcmdhbml6YXRpb25zLmZpbmQocXVlcnksIHtcbiAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgbmFtZTogMSxcbiAgICAgICAgICBmdWxsbmFtZTogMVxuICAgICAgICB9XG4gICAgICB9KS5mZXRjaCgpO1xuICAgICAgb3Jncy5mb3JFYWNoKGZ1bmN0aW9uKG9yZykge1xuICAgICAgICByZXR1cm4gZGF0YS5wdXNoKHtcbiAgICAgICAgICBpZDogb3JnLl9pZCxcbiAgICAgICAgICBuYW1lOiBvcmcubmFtZSxcbiAgICAgICAgICBmdWxsbmFtZTogb3JnLmZ1bGxuYW1lXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBvcmdJZHMuZm9yRWFjaChmdW5jdGlvbihvSWQpIHtcbiAgICAgICAgcmV0dXJuIHJlc19vcmdzLnB1c2goXy5maW5kKGRhdGEsIGZ1bmN0aW9uKG8pIHtcbiAgICAgICAgICByZXR1cm4gby5pZCA9PT0gb0lkO1xuICAgICAgICB9KSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIEpzb25Sb3V0ZXMuc2VuZFJlc3VsdChyZXMsIHtcbiAgICAgIGNvZGU6IDIwMCxcbiAgICAgIGRhdGE6IHtcbiAgICAgICAgJ29yZ3MnOiByZXNfb3Jnc1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn0pO1xuIl19
