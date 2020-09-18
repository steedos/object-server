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
var ECMAScript = Package.ecmascript.ECMAScript;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Blaze = Package.blaze.Blaze;
var UI = Package.blaze.UI;
var Handlebars = Package.blaze.Handlebars;
var Selector = Package['steedos:base'].Selector;
var Steedos = Package['steedos:base'].Steedos;
var AjaxCollection = Package['steedos:base'].AjaxCollection;
var SteedosDataManager = Package['steedos:base'].SteedosDataManager;
var SteedosOffice = Package['steedos:base'].SteedosOffice;
var billingManager = Package['steedos:base'].billingManager;
var _i18n = Package['universe:i18n']._i18n;
var i18n = Package['universe:i18n'].i18n;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var meteorInstall = Package.modules.meteorInstall;
var HTML = Package.htmljs.HTML;

/* Package-scope variables */
var __coffeescriptShare;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:users-import":{"checkNpm.js":function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/steedos_users-import/checkNpm.js                                                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);
checkNpmVersions({
  "ejs": "^2.5.5",
  "ejs-lint": "^0.2.0"
}, 'steedos:users-import');
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"server":{"methods":{"import_users.coffee":function(){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/steedos_users-import/server/methods/import_users.coffee                                                 //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.methods({
  /*
  		1、校验用户是否存在
  		2、校验工作区用户是否存在
  		3、校验部门是否存在
  		4、校验部门用户是否存在
  		TODO: 国际化
   */import_users: function (space_id, user_pk, data, onlyCheck) {
    var _self, accepted_user_count, currentUser, currentUserLocale, errorList, owner_id, root_org, space, testData;

    _self = this;

    if (!this.userId) {
      throw new Meteor.Error(401, "请先登录");
    }

    root_org = db.organizations.findOne({
      space: space_id,
      parent: null
    });
    space = db.spaces.findOne(space_id);

    if (!space || !(space != null ? space.admins.includes(this.userId) : void 0)) {
      throw new Meteor.Error(401, "只有工作区管理员可以导入用户");
    }

    if (!space.is_paid) {
      throw new Meteor.Error(401, "基础版不支持此功能");
    }

    accepted_user_count = db.space_users.find({
      space: space._id,
      user_accepted: true
    }).count();

    if (accepted_user_count + data.length > space.user_limit) {
      throw new Meteor.Error(400, "需要提升已购买用户数至" + (accepted_user_count + data.length) + "(当前" + space.user_limit + ")" + ", 请在企业信息模块中点击升级按钮购买");
    }

    owner_id = space.owner;
    testData = [];
    errorList = [];
    currentUser = db.users.findOne({
      _id: _self.userId
    }, {
      fields: {
        locale: 1,
        phone: 1
      }
    });
    currentUserLocale = currentUser.locale;
    data.forEach(function (item, i) {
      var multiOrgs, operating, organization, organization_depts, ref, ref1, ref2, ref3, selector, spaceUserExist, testObj, user, userExist;

      if (!item.phone && !item.email) {
        throw new Meteor.Error(500, "第" + (i + 1) + "行: 手机号，邮箱不能都为空");
      }

      testObj = {};

      if (item.username) {
        testObj.username = item.username;

        if (testData.filterProperty("username", item.username).length > 0) {
          throw new Meteor.Error(500, "第" + (i + 1) + "行：用户名重复");
        }
      }

      if (item.phone) {
        testObj.phone = item.phone;

        if (testData.filterProperty("phone", item.phone).length > 0) {
          throw new Meteor.Error(500, "第" + (i + 1) + "行：手机号重复");
        }
      }

      if (item.email) {
        if (!/^([A-Z0-9\.\-\_\+])*([A-Z0-9\+\-\_])+\@[A-Z0-9]+([\-][A-Z0-9]+)*([\.][A-Z0-9\-]+){1,8}$/i.test(item.email)) {
          throw new Meteor.Error(500, "第" + (i + 1) + "行：邮件格式错误" + item.email);
        }

        testObj.email = item.email;

        if (testData.filterProperty("email", item.email).length > 0) {
          throw new Meteor.Error(500, "第" + (i + 1) + "行：邮件重复");
        }
      }

      item.space = space_id;
      testData.push(testObj);
      selector = [];
      operating = "";

      if (item.username) {
        selector.push({
          username: item.username
        });
      }

      if (item.email) {
        selector.push({
          email: item.email
        });
      }

      if (item.phone) {
        selector.push({
          mobile: item.phone
        });
      }

      userExist = db.users.find({
        $or: selector
      });

      if (userExist.count() > 1) {
        throw new Meteor.Error(500, "第" + (i + 1) + "行：用户名、手机号、邮箱信息有误，无法匹配到同一账号");
      } else if (userExist.count() === 1) {
        user = userExist.fetch()[0]._id;
        spaceUserExist = db.space_users.find({
          space: space_id,
          user: user
        });

        if (spaceUserExist.count() === 1) {
          operating = "update";
        } else if (spaceUserExist.count() === 0) {
          operating = "insert";
        }
      } else if (userExist.count() === 0) {
        operating = "insert";
      }

      if (item.password && userExist.count() === 1) {
        if ((ref = userExist.fetch()[0].services) != null ? (ref1 = ref.password) != null ? ref1.bcrypt : void 0 : void 0) {
          throw new Meteor.Error(500, "第" + (i + 1) + "行：用户已设置密码，不允许修改");
        }
      }

      organization = item.organization;

      if (!organization) {
        throw new Meteor.Error(500, "第" + (i + 1) + "行：部门不能为空");
      }

      organization_depts = organization.split("/");

      if (organization_depts.length < 1 || organization_depts[0] !== root_org.name) {
        throw new Meteor.Error(500, "第" + (i + 1) + "行：无效的根部门");
      }

      if (item.password && (user != null ? (ref2 = user.services) != null ? (ref3 = ref2.password) != null ? ref3.bcrypt : void 0 : void 0 : void 0)) {
        throw new Meteor.Error(500, "第" + (i + 1) + "行：用户已设置密码，不允许修改");
      }

      organization_depts.forEach(function (dept_name, j) {
        if (!dept_name) {
          throw new Meteor.Error(500, "第" + (i + 1) + "行：无效的部门");
        }
      });
      multiOrgs = organization.split(",");
      return multiOrgs.forEach(function (orgFullname) {
        var fullname;
        organization_depts = orgFullname.trim().split("/");
        fullname = "";
        return organization_depts.forEach(function (dept_name, j) {
          var orgCount;

          if (j > 0) {
            if (j === 1) {
              fullname = dept_name;
            } else {
              fullname = fullname + "/" + dept_name;
            }

            orgCount = db.organizations.find({
              space: space_id,
              fullname: fullname
            }).count();

            if (orgCount === 0) {
              throw new Meteor.Error(500, "第" + (i + 1) + "行：部门(" + dept_name + ")不存在，请先创建");
            }
          }
        });
      });
    });

    if (onlyCheck) {
      return;
    }

    data.forEach(function (item, i) {
      var belongOrgids, e, error, multiOrgs, now, operating, organization, selector, space_user, space_user_update_doc, su_doc, udoc, user, userExist, userInfo, user_id;
      error = {};

      try {
        selector = [];
        operating = "";

        if (item.email) {
          selector.push({
            email: item.email
          });
        }

        if (item.phone) {
          selector.push({
            mobile: item.phone
          });
        }

        userExist = db.users.find({
          $or: selector
        });

        if (userExist.count() > 1) {
          throw new Meteor.Error(400, "用户名、手机号、邮箱信息有误，无法匹配到同一账号");
        } else if (userExist.count() === 1) {
          user = userExist.fetch()[0];
        }

        now = new Date();
        organization = item.organization;
        multiOrgs = organization.split(",");
        belongOrgids = [];
        multiOrgs.forEach(function (orgFullname) {
          var fullname, org, organization_depts;
          organization_depts = orgFullname.trim().split("/");
          fullname = "";
          organization_depts.forEach(function (dept_name, j) {
            if (j > 0) {
              if (j === 1) {
                return fullname = dept_name;
              } else {
                return fullname = fullname + "/" + dept_name;
              }
            } else {
              return fullname = dept_name;
            }
          });
          org = db.organizations.findOne({
            space: space_id,
            fullname: fullname
          });

          if (org) {
            return belongOrgids.push(org._id);
          }
        });
        user_id = null;

        if (user) {
          user_id = user._id;
        } else {
          udoc = {};
          udoc._id = db.users._makeNewID();
          udoc.steedos_id = item.email || udoc._id;
          udoc.locale = currentUserLocale;
          udoc.spaces_invited = [space_id];

          if (item.name) {
            udoc.name = item.name;
          }

          if (item.email) {
            udoc.email = item.email;
            udoc.email_verified = false;
          }

          if (item.username) {
            udoc.username = item.username;
          }

          if (item.phone) {
            udoc.mobile = item.phone;
            udoc.mobile_verified = false;
          }

          user_id = db.users.insert(udoc);

          if (item.password) {
            Accounts.setPassword(user_id, item.password, {
              logout: false
            });
          }
        }

        space_user = db.space_users.findOne({
          space: space_id,
          user: user_id
        });

        if (space_user) {
          if (belongOrgids.length > 0) {
            if (!space_user.organizations) {
              space_user.organizations = [];
            }

            space_user_update_doc = {};
            space_user_update_doc.organizations = _.uniq(space_user.organizations.concat(belongOrgids));

            if (item.email) {
              space_user_update_doc.email = item.email;
            }

            if (item.name) {
              space_user_update_doc.name = item.name;
            }

            if (item.company) {
              space_user_update_doc.company = item.company;
            }

            if (item.position) {
              space_user_update_doc.position = item.position;
            }

            if (item.work_phone) {
              space_user_update_doc.work_phone = item.work_phone;
            }

            if (item.phone) {
              space_user_update_doc.mobile = item.phone;
            }

            if (item.sort_no) {
              space_user_update_doc.sort_no = item.sort_no;
            }

            if (_.keys(space_user_update_doc).length > 0) {
              db.space_users.update({
                space: space_id,
                user: user_id
              }, {
                $set: space_user_update_doc
              });
            }

            if (space_user.invite_state === "refused" || space_user.invite_state === "pending") {
              throw new Meteor.Error(400, "该用户还未接受加入工作区，不能修改他的个人信息");
            } else {
              if (item.password) {
                return Accounts.setPassword(user_id, item.password, {
                  logout: false
                });
              }
            }
          }
        } else {
          if (belongOrgids.length > 0) {
            su_doc = {};
            su_doc._id = db.space_users._makeNewID();
            su_doc.space = space_id;
            su_doc.user_accepted = true;
            su_doc.invite_state = "accepted";

            if (user) {
              su_doc.user_accepted = false;
              su_doc.invite_state = "pending";
            }

            su_doc.name = item.name;

            if (item.email) {
              su_doc.email = item.email;
            }

            su_doc.organization = belongOrgids[0];
            su_doc.organizations = belongOrgids;

            if (item.position) {
              su_doc.position = item.position;
            }

            if (item.work_phone) {
              su_doc.work_phone = item.work_phone;
            }

            if (item.phone) {
              su_doc.mobile = item.phone;
            }

            if (item.sort_no) {
              su_doc.sort_no = item.sort_no;
            }

            if (item.company) {
              su_doc.company = item.company;
            }

            if (user_id) {
              userInfo = db.users.findOne(user_id, {
                fields: {
                  username: 1
                }
              });

              if (userInfo.username) {
                su_doc.username = userInfo.username;
              }

              su_doc.user = user_id;
            }

            return db.space_users.insert(su_doc);
          }
        }
      } catch (error1) {
        e = error1;
        error.line = i + 1;
        error.message = e.reason;
        return errorList.push(error);
      }
    });
    return errorList;
  }
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}},"routes":{"api_space_users_export.coffee":function(require){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/steedos_users-import/routes/api_space_users_export.coffee                                               //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.startup(function () {
  return WebApp.connectHandlers.use("/api/export/space_users", function (req, res, next) {
    var current_user_info, e, ejs, ejsLint, error_obj, fields, fileName, lang, now, org, orgName, org_id, org_ids, org_objs, query, ret, sheet_name, space_id, str, template, user_id, users_to_xls;

    try {
      current_user_info = uuflowManager.check_authorization(req);
      query = req.query;
      space_id = query.space_id;
      org_id = query.org_id;
      user_id = query['X-User-Id'];
      org = db.organizations.findOne({
        _id: org_id
      }, {
        fields: {
          fullname: 1
        }
      });
      users_to_xls = new Array();
      now = new Date();

      if (Steedos.isSpaceAdmin(space_id, user_id)) {
        users_to_xls = db.space_users.find({
          space: space_id
        }, {
          sort: {
            name: 1
          }
        }).fetch();
      } else {
        org_ids = [];
        org_objs = db.organizations.find({
          _id: org_id,
          space: space_id
        }, {
          fields: {
            _id: 1,
            children: 1
          }
        }).fetch();
        org_ids = _.pluck(org_objs, '_id');

        _.each(org_objs, function (org_obj) {
          return org_ids = _.union(org_ids, org_obj != null ? org_obj.children : void 0);
        });

        _.uniq(org_ids);

        users_to_xls = db.space_users.find({
          space: space_id,
          organizations: {
            $in: org_ids
          }
        }, {
          sort: {
            sort_no: -1,
            name: 1
          }
        }).fetch();
      }

      ejs = require('ejs');
      str = Assets.getText('server/ejs/export_space_users.ejs');
      ejsLint = require('ejs-lint');
      error_obj = ejsLint.lint(str, {});

      if (error_obj) {
        console.error("===/api/contacts/export/space_users:");
        console.error(error_obj);
      }

      template = ejs.compile(str);
      lang = 'en';

      if (current_user_info.locale === 'zh-cn') {
        lang = 'zh-CN';
      }

      orgName = org ? org.fullname : org_id;
      fields = [{
        type: 'String',
        name: 'name',
        width: 60,
        title: TAPi18n.__('space_users_name', {}, lang)
      }, {
        type: 'String',
        name: 'mobile',
        width: 100,
        title: TAPi18n.__('space_users_mobile', {}, lang)
      }, {
        type: 'String',
        name: 'work_phone',
        width: 100,
        title: TAPi18n.__('space_users_work_phone', {}, lang)
      }, {
        type: 'String',
        name: 'email',
        width: 100,
        title: TAPi18n.__('space_users_email', {}, lang)
      }, {
        type: 'String',
        name: 'company',
        width: 100,
        title: TAPi18n.__('space_users_company', {}, lang)
      }, {
        type: 'String',
        name: 'position',
        width: 100,
        title: TAPi18n.__('space_users_position', {}, lang)
      }, {
        type: 'String',
        name: 'organizations',
        width: 600,
        title: TAPi18n.__('space_users_organizations', {}, lang),
        transform: function (value) {
          var orgNames;
          orgNames = db.organizations.find({
            _id: {
              $in: value
            }
          }, {
            fields: {
              fullname: 1
            }
          }).map(function (item, index) {
            return item.fullname;
          });
          return orgNames.join(",");
        }
      }, {
        type: 'String',
        name: 'manager',
        width: 60,
        title: TAPi18n.__('space_users_manager', {}, lang),
        transform: function (value) {
          var user;
          user = db.users.findOne({
            _id: value
          }, {
            fields: {
              name: 1
            }
          });
          return user != null ? user.name : void 0;
        }
      }, {
        type: 'String',
        name: 'user',
        width: 60,
        title: TAPi18n.__('users_username', {}, lang),
        transform: function (value) {
          var user;
          user = db.users.findOne({
            _id: value
          }, {
            fields: {
              username: 1
            }
          });
          return user != null ? user.username : void 0;
        }
      }, {
        type: 'Number',
        name: 'sort_no',
        width: 35,
        title: TAPi18n.__('space_users_sort_no', {}, lang)
      }, {
        type: 'String',
        name: 'user_accepted',
        width: 35,
        title: TAPi18n.__('space_users_user_accepted', {}, lang),
        transform: function (value) {
          if (value) {
            return TAPi18n.__('space_users_user_accepted_yes', {}, lang);
          } else {
            return TAPi18n.__('space_users_user_accepted_no', {}, lang);
          }
        }
      }];
      sheet_name = orgName != null ? orgName.replace(/\//g, "-") : void 0;
      ret = template({
        lang: lang,
        sheet_name: sheet_name,
        fields: fields,
        users_to_xls: users_to_xls
      });
      fileName = "SteedOSContacts_" + moment().format('YYYYMMDDHHmm') + ".xls";
      res.setHeader("Content-type", "application/octet-stream");
      res.setHeader("Content-Disposition", "attachment;filename=" + encodeURI(fileName));
      return res.end(ret);
    } catch (error) {
      e = error;
      console.error(e.stack);
      return res.end(e.message);
    }
  });
});
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:users-import/checkNpm.js");
require("/node_modules/meteor/steedos:users-import/server/methods/import_users.coffee");
require("/node_modules/meteor/steedos:users-import/routes/api_space_users_export.coffee");

/* Exports */
Package._define("steedos:users-import");

})();

//# sourceURL=meteor://💻app/packages/steedos_users-import.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczp1c2Vycy1pbXBvcnQvY2hlY2tOcG0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfdXNlcnMtaW1wb3J0L3NlcnZlci9tZXRob2RzL2ltcG9ydF91c2Vycy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tZXRob2RzL2ltcG9ydF91c2Vycy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfdXNlcnMtaW1wb3J0L3JvdXRlcy9hcGlfc3BhY2VfdXNlcnNfZXhwb3J0LmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcm91dGVzL2FwaV9zcGFjZV91c2Vyc19leHBvcnQuY29mZmVlIl0sIm5hbWVzIjpbImNoZWNrTnBtVmVyc2lvbnMiLCJtb2R1bGUiLCJsaW5rIiwidiIsIk1ldGVvciIsIm1ldGhvZHMiLCJpbXBvcnRfdXNlcnMiLCJzcGFjZV9pZCIsInVzZXJfcGsiLCJkYXRhIiwib25seUNoZWNrIiwiX3NlbGYiLCJhY2NlcHRlZF91c2VyX2NvdW50IiwiY3VycmVudFVzZXIiLCJjdXJyZW50VXNlckxvY2FsZSIsImVycm9yTGlzdCIsIm93bmVyX2lkIiwicm9vdF9vcmciLCJzcGFjZSIsInRlc3REYXRhIiwidXNlcklkIiwiRXJyb3IiLCJkYiIsIm9yZ2FuaXphdGlvbnMiLCJmaW5kT25lIiwicGFyZW50Iiwic3BhY2VzIiwiYWRtaW5zIiwiaW5jbHVkZXMiLCJpc19wYWlkIiwic3BhY2VfdXNlcnMiLCJmaW5kIiwiX2lkIiwidXNlcl9hY2NlcHRlZCIsImNvdW50IiwibGVuZ3RoIiwidXNlcl9saW1pdCIsIm93bmVyIiwidXNlcnMiLCJmaWVsZHMiLCJsb2NhbGUiLCJwaG9uZSIsImZvckVhY2giLCJpdGVtIiwiaSIsIm11bHRpT3JncyIsIm9wZXJhdGluZyIsIm9yZ2FuaXphdGlvbiIsIm9yZ2FuaXphdGlvbl9kZXB0cyIsInJlZiIsInJlZjEiLCJyZWYyIiwicmVmMyIsInNlbGVjdG9yIiwic3BhY2VVc2VyRXhpc3QiLCJ0ZXN0T2JqIiwidXNlciIsInVzZXJFeGlzdCIsImVtYWlsIiwidXNlcm5hbWUiLCJmaWx0ZXJQcm9wZXJ0eSIsInRlc3QiLCJwdXNoIiwibW9iaWxlIiwiJG9yIiwiZmV0Y2giLCJwYXNzd29yZCIsInNlcnZpY2VzIiwiYmNyeXB0Iiwic3BsaXQiLCJuYW1lIiwiZGVwdF9uYW1lIiwiaiIsIm9yZ0Z1bGxuYW1lIiwiZnVsbG5hbWUiLCJ0cmltIiwib3JnQ291bnQiLCJiZWxvbmdPcmdpZHMiLCJlIiwiZXJyb3IiLCJub3ciLCJzcGFjZV91c2VyIiwic3BhY2VfdXNlcl91cGRhdGVfZG9jIiwic3VfZG9jIiwidWRvYyIsInVzZXJJbmZvIiwidXNlcl9pZCIsIkRhdGUiLCJvcmciLCJfbWFrZU5ld0lEIiwic3RlZWRvc19pZCIsInNwYWNlc19pbnZpdGVkIiwiZW1haWxfdmVyaWZpZWQiLCJtb2JpbGVfdmVyaWZpZWQiLCJpbnNlcnQiLCJBY2NvdW50cyIsInNldFBhc3N3b3JkIiwibG9nb3V0IiwiXyIsInVuaXEiLCJjb25jYXQiLCJjb21wYW55IiwicG9zaXRpb24iLCJ3b3JrX3Bob25lIiwic29ydF9ubyIsImtleXMiLCJ1cGRhdGUiLCIkc2V0IiwiaW52aXRlX3N0YXRlIiwiZXJyb3IxIiwibGluZSIsIm1lc3NhZ2UiLCJyZWFzb24iLCJzdGFydHVwIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwicmVxIiwicmVzIiwibmV4dCIsImN1cnJlbnRfdXNlcl9pbmZvIiwiZWpzIiwiZWpzTGludCIsImVycm9yX29iaiIsImZpbGVOYW1lIiwibGFuZyIsIm9yZ05hbWUiLCJvcmdfaWQiLCJvcmdfaWRzIiwib3JnX29ianMiLCJxdWVyeSIsInJldCIsInNoZWV0X25hbWUiLCJzdHIiLCJ0ZW1wbGF0ZSIsInVzZXJzX3RvX3hscyIsInV1Zmxvd01hbmFnZXIiLCJjaGVja19hdXRob3JpemF0aW9uIiwiQXJyYXkiLCJTdGVlZG9zIiwiaXNTcGFjZUFkbWluIiwic29ydCIsImNoaWxkcmVuIiwicGx1Y2siLCJlYWNoIiwib3JnX29iaiIsInVuaW9uIiwiJGluIiwicmVxdWlyZSIsIkFzc2V0cyIsImdldFRleHQiLCJsaW50IiwiY29uc29sZSIsImNvbXBpbGUiLCJ0eXBlIiwid2lkdGgiLCJ0aXRsZSIsIlRBUGkxOG4iLCJfXyIsInRyYW5zZm9ybSIsInZhbHVlIiwib3JnTmFtZXMiLCJtYXAiLCJpbmRleCIsImpvaW4iLCJyZXBsYWNlIiwibW9tZW50IiwiZm9ybWF0Iiwic2V0SGVhZGVyIiwiZW5jb2RlVVJJIiwiZW5kIiwic3RhY2siXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLGdCQUFKO0FBQXFCQyxNQUFNLENBQUNDLElBQVAsQ0FBWSxvQ0FBWixFQUFpRDtBQUFDRixrQkFBZ0IsQ0FBQ0csQ0FBRCxFQUFHO0FBQUNILG9CQUFnQixHQUFDRyxDQUFqQjtBQUFtQjs7QUFBeEMsQ0FBakQsRUFBMkYsQ0FBM0Y7QUFDckJILGdCQUFnQixDQUFDO0FBQ2hCLFNBQU8sUUFEUztBQUVoQixjQUFZO0FBRkksQ0FBRCxFQUdiLHNCQUhhLENBQWhCLEM7Ozs7Ozs7Ozs7OztBQ0RBSSxPQUFPQyxPQUFQLENBQ0M7QUFBQTs7Ozs7O0tBT0FDLGNBQWMsVUFBQ0MsUUFBRCxFQUFXQyxPQUFYLEVBQW9CQyxJQUFwQixFQUEwQkMsU0FBMUI7QUFFYixRQUFBQyxLQUFBLEVBQUFDLG1CQUFBLEVBQUFDLFdBQUEsRUFBQUMsaUJBQUEsRUFBQUMsU0FBQSxFQUFBQyxRQUFBLEVBQUFDLFFBQUEsRUFBQUMsS0FBQSxFQUFBQyxRQUFBOztBQUFBUixZQUFRLElBQVI7O0FBRUEsUUFBRyxDQUFDLEtBQUtTLE1BQVQ7QUFDQyxZQUFNLElBQUloQixPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQixNQUF0QixDQUFOO0FDQ0U7O0FEQ0hKLGVBQVdLLEdBQUdDLGFBQUgsQ0FBaUJDLE9BQWpCLENBQXlCO0FBQUNOLGFBQU9YLFFBQVI7QUFBa0JrQixjQUFRO0FBQTFCLEtBQXpCLENBQVg7QUFFQVAsWUFBUUksR0FBR0ksTUFBSCxDQUFVRixPQUFWLENBQWtCakIsUUFBbEIsQ0FBUjs7QUFDQSxRQUFHLENBQUNXLEtBQUQsSUFBVSxFQUFBQSxTQUFBLE9BQUNBLE1BQU9TLE1BQVAsQ0FBY0MsUUFBZCxDQUF1QixLQUFLUixNQUE1QixDQUFELEdBQUMsTUFBRCxDQUFiO0FBQ0MsWUFBTSxJQUFJaEIsT0FBT2lCLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IsZ0JBQXRCLENBQU47QUNHRTs7QURESCxRQUFHLENBQUNILE1BQU1XLE9BQVY7QUFDQyxZQUFNLElBQUl6QixPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQixXQUF0QixDQUFOO0FDR0U7O0FEREhULDBCQUFzQlUsR0FBR1EsV0FBSCxDQUFlQyxJQUFmLENBQW9CO0FBQUNiLGFBQU9BLE1BQU1jLEdBQWQ7QUFBbUJDLHFCQUFlO0FBQWxDLEtBQXBCLEVBQTZEQyxLQUE3RCxFQUF0Qjs7QUFDQSxRQUFJdEIsc0JBQXNCSCxLQUFLMEIsTUFBNUIsR0FBc0NqQixNQUFNa0IsVUFBL0M7QUFDQyxZQUFNLElBQUloQyxPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQixpQkFBY1Qsc0JBQXNCSCxLQUFLMEIsTUFBekMsSUFBZ0QsS0FBaEQsR0FBcURqQixNQUFNa0IsVUFBM0QsR0FBc0UsR0FBdEUsR0FBMEUscUJBQWhHLENBQU47QUNNRTs7QURKSHBCLGVBQVdFLE1BQU1tQixLQUFqQjtBQUVBbEIsZUFBVyxFQUFYO0FBRUFKLGdCQUFZLEVBQVo7QUFFQUYsa0JBQWNTLEdBQUdnQixLQUFILENBQVNkLE9BQVQsQ0FBaUI7QUFBQ1EsV0FBS3JCLE1BQU1TO0FBQVosS0FBakIsRUFBcUM7QUFBQ21CLGNBQU87QUFBQ0MsZ0JBQU8sQ0FBUjtBQUFVQyxlQUFNO0FBQWhCO0FBQVIsS0FBckMsQ0FBZDtBQUNBM0Isd0JBQW9CRCxZQUFZMkIsTUFBaEM7QUFJQS9CLFNBQUtpQyxPQUFMLENBQWEsVUFBQ0MsSUFBRCxFQUFPQyxDQUFQO0FBR1osVUFBQUMsU0FBQSxFQUFBQyxTQUFBLEVBQUFDLFlBQUEsRUFBQUMsa0JBQUEsRUFBQUMsR0FBQSxFQUFBQyxJQUFBLEVBQUFDLElBQUEsRUFBQUMsSUFBQSxFQUFBQyxRQUFBLEVBQUFDLGNBQUEsRUFBQUMsT0FBQSxFQUFBQyxJQUFBLEVBQUFDLFNBQUE7O0FBQUEsVUFBRyxDQUFDZCxLQUFLRixLQUFOLElBQWdCLENBQUNFLEtBQUtlLEtBQXpCO0FBQ0MsY0FBTSxJQUFJdEQsT0FBT2lCLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IsT0FBSXVCLElBQUksQ0FBUixJQUFVLGdCQUFoQyxDQUFOO0FDTUc7O0FESEpXLGdCQUFVLEVBQVY7O0FBQ0EsVUFBR1osS0FBS2dCLFFBQVI7QUFDQ0osZ0JBQVFJLFFBQVIsR0FBbUJoQixLQUFLZ0IsUUFBeEI7O0FBQ0EsWUFBR3hDLFNBQVN5QyxjQUFULENBQXdCLFVBQXhCLEVBQW9DakIsS0FBS2dCLFFBQXpDLEVBQW1EeEIsTUFBbkQsR0FBNEQsQ0FBL0Q7QUFDQyxnQkFBTSxJQUFJL0IsT0FBT2lCLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IsT0FBSXVCLElBQUksQ0FBUixJQUFVLFNBQWhDLENBQU47QUFIRjtBQ1NJOztBREpKLFVBQUdELEtBQUtGLEtBQVI7QUFDQ2MsZ0JBQVFkLEtBQVIsR0FBZ0JFLEtBQUtGLEtBQXJCOztBQUNBLFlBQUd0QixTQUFTeUMsY0FBVCxDQUF3QixPQUF4QixFQUFpQ2pCLEtBQUtGLEtBQXRDLEVBQTZDTixNQUE3QyxHQUFzRCxDQUF6RDtBQUNDLGdCQUFNLElBQUkvQixPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQixPQUFJdUIsSUFBSSxDQUFSLElBQVUsU0FBaEMsQ0FBTjtBQUhGO0FDVUk7O0FETEosVUFBR0QsS0FBS2UsS0FBUjtBQUNDLFlBQUcsQ0FBSSwyRkFBMkZHLElBQTNGLENBQWdHbEIsS0FBS2UsS0FBckcsQ0FBUDtBQUNDLGdCQUFNLElBQUl0RCxPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQixPQUFJdUIsSUFBSSxDQUFSLElBQVUsVUFBVixHQUFvQkQsS0FBS2UsS0FBL0MsQ0FBTjtBQ09JOztBRExMSCxnQkFBUUcsS0FBUixHQUFnQmYsS0FBS2UsS0FBckI7O0FBQ0EsWUFBR3ZDLFNBQVN5QyxjQUFULENBQXdCLE9BQXhCLEVBQWlDakIsS0FBS2UsS0FBdEMsRUFBNkN2QixNQUE3QyxHQUFzRCxDQUF6RDtBQUNDLGdCQUFNLElBQUkvQixPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQixPQUFJdUIsSUFBSSxDQUFSLElBQVUsUUFBaEMsQ0FBTjtBQU5GO0FDY0k7O0FETkpELFdBQUt6QixLQUFMLEdBQWFYLFFBQWI7QUFFQVksZUFBUzJDLElBQVQsQ0FBY1AsT0FBZDtBQUdBRixpQkFBVyxFQUFYO0FBQ0FQLGtCQUFZLEVBQVo7O0FBQ0EsVUFBR0gsS0FBS2dCLFFBQVI7QUFDQ04saUJBQVNTLElBQVQsQ0FBYztBQUFDSCxvQkFBVWhCLEtBQUtnQjtBQUFoQixTQUFkO0FDT0c7O0FETkosVUFBR2hCLEtBQUtlLEtBQVI7QUFDQ0wsaUJBQVNTLElBQVQsQ0FBYztBQUFDSixpQkFBT2YsS0FBS2U7QUFBYixTQUFkO0FDVUc7O0FEVEosVUFBR2YsS0FBS0YsS0FBUjtBQUNDWSxpQkFBU1MsSUFBVCxDQUFjO0FBQUNDLGtCQUFRcEIsS0FBS0Y7QUFBZCxTQUFkO0FDYUc7O0FEWEpnQixrQkFBWW5DLEdBQUdnQixLQUFILENBQVNQLElBQVQsQ0FBYztBQUFDaUMsYUFBS1g7QUFBTixPQUFkLENBQVo7O0FBSUEsVUFBR0ksVUFBVXZCLEtBQVYsS0FBb0IsQ0FBdkI7QUFDQyxjQUFNLElBQUk5QixPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQixPQUFJdUIsSUFBSSxDQUFSLElBQVUsNEJBQWhDLENBQU47QUFERCxhQUVLLElBQUdhLFVBQVV2QixLQUFWLE9BQXFCLENBQXhCO0FBQ0pzQixlQUFPQyxVQUFVUSxLQUFWLEdBQWtCLENBQWxCLEVBQXFCakMsR0FBNUI7QUFDQXNCLHlCQUFpQmhDLEdBQUdRLFdBQUgsQ0FBZUMsSUFBZixDQUFvQjtBQUFDYixpQkFBT1gsUUFBUjtBQUFrQmlELGdCQUFNQTtBQUF4QixTQUFwQixDQUFqQjs7QUFDQSxZQUFHRixlQUFlcEIsS0FBZixPQUEwQixDQUE3QjtBQUNDWSxzQkFBWSxRQUFaO0FBREQsZUFFSyxJQUFHUSxlQUFlcEIsS0FBZixPQUEwQixDQUE3QjtBQUNKWSxzQkFBWSxRQUFaO0FBTkc7QUFBQSxhQU9BLElBQUdXLFVBQVV2QixLQUFWLE9BQXFCLENBQXhCO0FBRUpZLG9CQUFZLFFBQVo7QUNlRzs7QURaSixVQUFHSCxLQUFLdUIsUUFBTCxJQUFrQlQsVUFBVXZCLEtBQVYsT0FBcUIsQ0FBMUM7QUFDQyxhQUFBZSxNQUFBUSxVQUFBUSxLQUFBLE1BQUFFLFFBQUEsYUFBQWpCLE9BQUFELElBQUFpQixRQUFBLFlBQUFoQixLQUE0Q2tCLE1BQTVDLEdBQTRDLE1BQTVDLEdBQTRDLE1BQTVDO0FBQ0MsZ0JBQU0sSUFBSWhFLE9BQU9pQixLQUFYLENBQWlCLEdBQWpCLEVBQXNCLE9BQUl1QixJQUFJLENBQVIsSUFBVSxpQkFBaEMsQ0FBTjtBQUZGO0FDaUJJOztBRFpKRyxxQkFBZUosS0FBS0ksWUFBcEI7O0FBRUEsVUFBRyxDQUFDQSxZQUFKO0FBQ0MsY0FBTSxJQUFJM0MsT0FBT2lCLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IsT0FBSXVCLElBQUksQ0FBUixJQUFVLFVBQWhDLENBQU47QUNhRzs7QURYSkksMkJBQXFCRCxhQUFhc0IsS0FBYixDQUFtQixHQUFuQixDQUFyQjs7QUFFQSxVQUFHckIsbUJBQW1CYixNQUFuQixHQUE0QixDQUE1QixJQUFpQ2EsbUJBQW1CLENBQW5CLE1BQXlCL0IsU0FBU3FELElBQXRFO0FBQ0MsY0FBTSxJQUFJbEUsT0FBT2lCLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IsT0FBSXVCLElBQUksQ0FBUixJQUFVLFVBQWhDLENBQU47QUNZRzs7QURWSixVQUFHRCxLQUFLdUIsUUFBTCxLQUFBVixRQUFBLFFBQUFMLE9BQUFLLEtBQUFXLFFBQUEsYUFBQWYsT0FBQUQsS0FBQWUsUUFBQSxZQUFBZCxLQUEyQ2dCLE1BQTNDLEdBQTJDLE1BQTNDLEdBQTJDLE1BQTNDLEdBQTJDLE1BQTNDLENBQUg7QUFDQyxjQUFNLElBQUloRSxPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQixPQUFJdUIsSUFBSSxDQUFSLElBQVUsaUJBQWhDLENBQU47QUNZRzs7QURWSkkseUJBQW1CTixPQUFuQixDQUEyQixVQUFDNkIsU0FBRCxFQUFZQyxDQUFaO0FBQzFCLFlBQUcsQ0FBQ0QsU0FBSjtBQUNDLGdCQUFNLElBQUluRSxPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQixPQUFJdUIsSUFBSSxDQUFSLElBQVUsU0FBaEMsQ0FBTjtBQ1lJO0FEZE47QUFJQUMsa0JBQVlFLGFBQWFzQixLQUFiLENBQW1CLEdBQW5CLENBQVo7QUNhRyxhRFpIeEIsVUFBVUgsT0FBVixDQUFrQixVQUFDK0IsV0FBRDtBQUNqQixZQUFBQyxRQUFBO0FBQUExQiw2QkFBcUJ5QixZQUFZRSxJQUFaLEdBQW1CTixLQUFuQixDQUF5QixHQUF6QixDQUFyQjtBQUNBSyxtQkFBVyxFQUFYO0FDY0ksZURiSjFCLG1CQUFtQk4sT0FBbkIsQ0FBMkIsVUFBQzZCLFNBQUQsRUFBWUMsQ0FBWjtBQUMxQixjQUFBSSxRQUFBOztBQUFBLGNBQUdKLElBQUksQ0FBUDtBQUNDLGdCQUFHQSxNQUFLLENBQVI7QUFDQ0UseUJBQVdILFNBQVg7QUFERDtBQUdDRyx5QkFBV0EsV0FBVyxHQUFYLEdBQWlCSCxTQUE1QjtBQ2VNOztBRGJQSyx1QkFBV3RELEdBQUdDLGFBQUgsQ0FBaUJRLElBQWpCLENBQXNCO0FBQUNiLHFCQUFPWCxRQUFSO0FBQWtCbUUsd0JBQVVBO0FBQTVCLGFBQXRCLEVBQTZEeEMsS0FBN0QsRUFBWDs7QUFFQSxnQkFBRzBDLGFBQVksQ0FBZjtBQUNDLG9CQUFNLElBQUl4RSxPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQixPQUFJdUIsSUFBSSxDQUFSLElBQVUsT0FBVixHQUFpQjJCLFNBQWpCLEdBQTJCLFdBQWpELENBQU47QUFURjtBQzJCTTtBRDVCUCxVQ2FJO0FEaEJMLFFDWUc7QUQ3Rko7O0FBZ0dBLFFBQUc3RCxTQUFIO0FBQ0M7QUNxQkU7O0FEbEJIRCxTQUFLaUMsT0FBTCxDQUFhLFVBQUNDLElBQUQsRUFBT0MsQ0FBUDtBQUNaLFVBQUFpQyxZQUFBLEVBQUFDLENBQUEsRUFBQUMsS0FBQSxFQUFBbEMsU0FBQSxFQUFBbUMsR0FBQSxFQUFBbEMsU0FBQSxFQUFBQyxZQUFBLEVBQUFNLFFBQUEsRUFBQTRCLFVBQUEsRUFBQUMscUJBQUEsRUFBQUMsTUFBQSxFQUFBQyxJQUFBLEVBQUE1QixJQUFBLEVBQUFDLFNBQUEsRUFBQTRCLFFBQUEsRUFBQUMsT0FBQTtBQUFBUCxjQUFRLEVBQVI7O0FBQ0E7QUFDQzFCLG1CQUFXLEVBQVg7QUFDQVAsb0JBQVksRUFBWjs7QUFHQSxZQUFHSCxLQUFLZSxLQUFSO0FBQ0NMLG1CQUFTUyxJQUFULENBQWM7QUFBQ0osbUJBQU9mLEtBQUtlO0FBQWIsV0FBZDtBQ3FCSTs7QURwQkwsWUFBR2YsS0FBS0YsS0FBUjtBQUNDWSxtQkFBU1MsSUFBVCxDQUFjO0FBQUNDLG9CQUFRcEIsS0FBS0Y7QUFBZCxXQUFkO0FDd0JJOztBRHZCTGdCLG9CQUFZbkMsR0FBR2dCLEtBQUgsQ0FBU1AsSUFBVCxDQUFjO0FBQUNpQyxlQUFLWDtBQUFOLFNBQWQsQ0FBWjs7QUFDQSxZQUFHSSxVQUFVdkIsS0FBVixLQUFvQixDQUF2QjtBQUNDLGdCQUFNLElBQUk5QixPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQiwwQkFBdEIsQ0FBTjtBQURELGVBRUssSUFBR29DLFVBQVV2QixLQUFWLE9BQXFCLENBQXhCO0FBQ0pzQixpQkFBT0MsVUFBVVEsS0FBVixHQUFrQixDQUFsQixDQUFQO0FDMkJJOztBRHpCTGUsY0FBTSxJQUFJTyxJQUFKLEVBQU47QUFFQXhDLHVCQUFlSixLQUFLSSxZQUFwQjtBQUNBRixvQkFBWUUsYUFBYXNCLEtBQWIsQ0FBbUIsR0FBbkIsQ0FBWjtBQUNBUSx1QkFBZSxFQUFmO0FBQ0FoQyxrQkFBVUgsT0FBVixDQUFrQixVQUFDK0IsV0FBRDtBQUNqQixjQUFBQyxRQUFBLEVBQUFjLEdBQUEsRUFBQXhDLGtCQUFBO0FBQUFBLCtCQUFxQnlCLFlBQVlFLElBQVosR0FBbUJOLEtBQW5CLENBQXlCLEdBQXpCLENBQXJCO0FBQ0FLLHFCQUFXLEVBQVg7QUFDQTFCLDZCQUFtQk4sT0FBbkIsQ0FBMkIsVUFBQzZCLFNBQUQsRUFBWUMsQ0FBWjtBQUMxQixnQkFBR0EsSUFBSSxDQUFQO0FBQ0Msa0JBQUdBLE1BQUssQ0FBUjtBQzJCUyx1QkQxQlJFLFdBQVdILFNDMEJIO0FEM0JUO0FDNkJTLHVCRDFCUkcsV0FBV0EsV0FBVyxHQUFYLEdBQWlCSCxTQzBCcEI7QUQ5QlY7QUFBQTtBQ2lDUSxxQkQzQlBHLFdBQVdILFNDMkJKO0FBQ0Q7QURuQ1I7QUFTQWlCLGdCQUFNbEUsR0FBR0MsYUFBSCxDQUFpQkMsT0FBakIsQ0FBeUI7QUFBQ04sbUJBQU9YLFFBQVI7QUFBa0JtRSxzQkFBVUE7QUFBNUIsV0FBekIsQ0FBTjs7QUFFQSxjQUFHYyxHQUFIO0FDK0JPLG1CRDlCTlgsYUFBYWYsSUFBYixDQUFrQjBCLElBQUl4RCxHQUF0QixDQzhCTTtBQUNEO0FEOUNQO0FBa0JBc0Qsa0JBQVUsSUFBVjs7QUFDQSxZQUFHOUIsSUFBSDtBQUNDOEIsb0JBQVU5QixLQUFLeEIsR0FBZjtBQUREO0FBR0NvRCxpQkFBTyxFQUFQO0FBQ0FBLGVBQUtwRCxHQUFMLEdBQVdWLEdBQUdnQixLQUFILENBQVNtRCxVQUFULEVBQVg7QUFDQUwsZUFBS00sVUFBTCxHQUFrQi9DLEtBQUtlLEtBQUwsSUFBYzBCLEtBQUtwRCxHQUFyQztBQUNBb0QsZUFBSzVDLE1BQUwsR0FBYzFCLGlCQUFkO0FBQ0FzRSxlQUFLTyxjQUFMLEdBQXNCLENBQUNwRixRQUFELENBQXRCOztBQUNBLGNBQUdvQyxLQUFLMkIsSUFBUjtBQUNDYyxpQkFBS2QsSUFBTCxHQUFZM0IsS0FBSzJCLElBQWpCO0FDK0JLOztBRDdCTixjQUFHM0IsS0FBS2UsS0FBUjtBQUNDMEIsaUJBQUsxQixLQUFMLEdBQWFmLEtBQUtlLEtBQWxCO0FBQ0EwQixpQkFBS1EsY0FBTCxHQUFzQixLQUF0QjtBQytCSzs7QUQ3Qk4sY0FBR2pELEtBQUtnQixRQUFSO0FBQ0N5QixpQkFBS3pCLFFBQUwsR0FBZ0JoQixLQUFLZ0IsUUFBckI7QUMrQks7O0FEN0JOLGNBQUdoQixLQUFLRixLQUFSO0FBQ0MyQyxpQkFBS3JCLE1BQUwsR0FBY3BCLEtBQUtGLEtBQW5CO0FBQ0EyQyxpQkFBS1MsZUFBTCxHQUF1QixLQUF2QjtBQytCSzs7QUQ5Qk5QLG9CQUFVaEUsR0FBR2dCLEtBQUgsQ0FBU3dELE1BQVQsQ0FBZ0JWLElBQWhCLENBQVY7O0FBRUEsY0FBR3pDLEtBQUt1QixRQUFSO0FBQ0M2QixxQkFBU0MsV0FBVCxDQUFxQlYsT0FBckIsRUFBOEIzQyxLQUFLdUIsUUFBbkMsRUFBNkM7QUFBQytCLHNCQUFRO0FBQVQsYUFBN0M7QUF4QkY7QUMwREs7O0FEaENMaEIscUJBQWEzRCxHQUFHUSxXQUFILENBQWVOLE9BQWYsQ0FBdUI7QUFBQ04saUJBQU9YLFFBQVI7QUFBa0JpRCxnQkFBTThCO0FBQXhCLFNBQXZCLENBQWI7O0FBRUEsWUFBR0wsVUFBSDtBQUNDLGNBQUdKLGFBQWExQyxNQUFiLEdBQXNCLENBQXpCO0FBQ0MsZ0JBQUcsQ0FBQzhDLFdBQVcxRCxhQUFmO0FBQ0MwRCx5QkFBVzFELGFBQVgsR0FBMkIsRUFBM0I7QUNvQ007O0FEbENQMkQsb0NBQXdCLEVBQXhCO0FBRUFBLGtDQUFzQjNELGFBQXRCLEdBQXNDMkUsRUFBRUMsSUFBRixDQUFPbEIsV0FBVzFELGFBQVgsQ0FBeUI2RSxNQUF6QixDQUFnQ3ZCLFlBQWhDLENBQVAsQ0FBdEM7O0FBRUEsZ0JBQUdsQyxLQUFLZSxLQUFSO0FBQ0N3QixvQ0FBc0J4QixLQUF0QixHQUE4QmYsS0FBS2UsS0FBbkM7QUNrQ007O0FEaENQLGdCQUFHZixLQUFLMkIsSUFBUjtBQUNDWSxvQ0FBc0JaLElBQXRCLEdBQTZCM0IsS0FBSzJCLElBQWxDO0FDa0NNOztBRGhDUCxnQkFBRzNCLEtBQUswRCxPQUFSO0FBQ0NuQixvQ0FBc0JtQixPQUF0QixHQUFnQzFELEtBQUswRCxPQUFyQztBQ2tDTTs7QURoQ1AsZ0JBQUcxRCxLQUFLMkQsUUFBUjtBQUNDcEIsb0NBQXNCb0IsUUFBdEIsR0FBaUMzRCxLQUFLMkQsUUFBdEM7QUNrQ007O0FEaENQLGdCQUFHM0QsS0FBSzRELFVBQVI7QUFDQ3JCLG9DQUFzQnFCLFVBQXRCLEdBQW1DNUQsS0FBSzRELFVBQXhDO0FDa0NNOztBRGhDUCxnQkFBRzVELEtBQUtGLEtBQVI7QUFDQ3lDLG9DQUFzQm5CLE1BQXRCLEdBQStCcEIsS0FBS0YsS0FBcEM7QUNrQ007O0FEaENQLGdCQUFHRSxLQUFLNkQsT0FBUjtBQUNDdEIsb0NBQXNCc0IsT0FBdEIsR0FBZ0M3RCxLQUFLNkQsT0FBckM7QUNrQ007O0FEaENQLGdCQUFHTixFQUFFTyxJQUFGLENBQU92QixxQkFBUCxFQUE4Qi9DLE1BQTlCLEdBQXVDLENBQTFDO0FBQ0NiLGlCQUFHUSxXQUFILENBQWU0RSxNQUFmLENBQXNCO0FBQUN4Rix1QkFBT1gsUUFBUjtBQUFrQmlELHNCQUFNOEI7QUFBeEIsZUFBdEIsRUFBd0Q7QUFBQ3FCLHNCQUFNekI7QUFBUCxlQUF4RDtBQ3VDTTs7QURyQ1AsZ0JBQUdELFdBQVcyQixZQUFYLEtBQTJCLFNBQTNCLElBQXdDM0IsV0FBVzJCLFlBQVgsS0FBMkIsU0FBdEU7QUFDQyxvQkFBTSxJQUFJeEcsT0FBT2lCLEtBQVgsQ0FBaUIsR0FBakIsRUFBc0IseUJBQXRCLENBQU47QUFERDtBQUtDLGtCQUFHc0IsS0FBS3VCLFFBQVI7QUNxQ1MsdUJEcENSNkIsU0FBU0MsV0FBVCxDQUFxQlYsT0FBckIsRUFBOEIzQyxLQUFLdUIsUUFBbkMsRUFBNkM7QUFBQytCLDBCQUFRO0FBQVQsaUJBQTdDLENDb0NRO0FEMUNWO0FBaENEO0FBREQ7QUFBQTtBQTBDQyxjQUFHcEIsYUFBYTFDLE1BQWIsR0FBc0IsQ0FBekI7QUFDQ2dELHFCQUFTLEVBQVQ7QUFDQUEsbUJBQU9uRCxHQUFQLEdBQWFWLEdBQUdRLFdBQUgsQ0FBZTJELFVBQWYsRUFBYjtBQUNBTixtQkFBT2pFLEtBQVAsR0FBZVgsUUFBZjtBQUVBNEUsbUJBQU9sRCxhQUFQLEdBQXdCLElBQXhCO0FBQ0FrRCxtQkFBT3lCLFlBQVAsR0FBc0IsVUFBdEI7O0FBRUEsZ0JBQUdwRCxJQUFIO0FBQ0MyQixxQkFBT2xELGFBQVAsR0FBdUIsS0FBdkI7QUFDQWtELHFCQUFPeUIsWUFBUCxHQUFzQixTQUF0QjtBQ3VDTTs7QURyQ1B6QixtQkFBT2IsSUFBUCxHQUFjM0IsS0FBSzJCLElBQW5COztBQUNBLGdCQUFHM0IsS0FBS2UsS0FBUjtBQUNDeUIscUJBQU96QixLQUFQLEdBQWVmLEtBQUtlLEtBQXBCO0FDdUNNOztBRHRDUHlCLG1CQUFPcEMsWUFBUCxHQUFzQjhCLGFBQWEsQ0FBYixDQUF0QjtBQUNBTSxtQkFBTzVELGFBQVAsR0FBdUJzRCxZQUF2Qjs7QUFFQSxnQkFBR2xDLEtBQUsyRCxRQUFSO0FBQ0NuQixxQkFBT21CLFFBQVAsR0FBa0IzRCxLQUFLMkQsUUFBdkI7QUN1Q007O0FEckNQLGdCQUFHM0QsS0FBSzRELFVBQVI7QUFDQ3BCLHFCQUFPb0IsVUFBUCxHQUFvQjVELEtBQUs0RCxVQUF6QjtBQ3VDTTs7QURyQ1AsZ0JBQUc1RCxLQUFLRixLQUFSO0FBQ0MwQyxxQkFBT3BCLE1BQVAsR0FBZ0JwQixLQUFLRixLQUFyQjtBQ3VDTTs7QURyQ1AsZ0JBQUdFLEtBQUs2RCxPQUFSO0FBQ0NyQixxQkFBT3FCLE9BQVAsR0FBaUI3RCxLQUFLNkQsT0FBdEI7QUN1Q007O0FEckNQLGdCQUFHN0QsS0FBSzBELE9BQVI7QUFDQ2xCLHFCQUFPa0IsT0FBUCxHQUFpQjFELEtBQUswRCxPQUF0QjtBQ3VDTTs7QURyQ1AsZ0JBQUdmLE9BQUg7QUFDQ0QseUJBQVcvRCxHQUFHZ0IsS0FBSCxDQUFTZCxPQUFULENBQWlCOEQsT0FBakIsRUFBMEI7QUFBRS9DLHdCQUFRO0FBQUVvQiw0QkFBVTtBQUFaO0FBQVYsZUFBMUIsQ0FBWDs7QUFDQSxrQkFBRzBCLFNBQVMxQixRQUFaO0FBQ0N3Qix1QkFBT3hCLFFBQVAsR0FBa0IwQixTQUFTMUIsUUFBM0I7QUMyQ087O0FEMUNSd0IscUJBQU8zQixJQUFQLEdBQWM4QixPQUFkO0FDNENNOztBQUNELG1CRDNDTmhFLEdBQUdRLFdBQUgsQ0FBZWdFLE1BQWYsQ0FBc0JYLE1BQXRCLENDMkNNO0FENUhSO0FBbkVEO0FBQUEsZUFBQTBCLE1BQUE7QUFxSk0vQixZQUFBK0IsTUFBQTtBQUNMOUIsY0FBTStCLElBQU4sR0FBYWxFLElBQUUsQ0FBZjtBQUNBbUMsY0FBTWdDLE9BQU4sR0FBZ0JqQyxFQUFFa0MsTUFBbEI7QUMrQ0ksZUQ5Q0pqRyxVQUFVK0MsSUFBVixDQUFlaUIsS0FBZixDQzhDSTtBQUNEO0FEek1MO0FBNEpBLFdBQU9oRSxTQUFQO0FBdFNEO0FBQUEsQ0FERCxFOzs7Ozs7Ozs7Ozs7QUVBQVgsT0FBTzZHLE9BQVAsQ0FBZTtBQ0NiLFNEQURDLE9BQU9DLGVBQVAsQ0FBdUJDLEdBQXZCLENBQTJCLHlCQUEzQixFQUFzRCxVQUFDQyxHQUFELEVBQU1DLEdBQU4sRUFBV0MsSUFBWDtBQUNyRCxRQUFBQyxpQkFBQSxFQUFBMUMsQ0FBQSxFQUFBMkMsR0FBQSxFQUFBQyxPQUFBLEVBQUFDLFNBQUEsRUFBQXBGLE1BQUEsRUFBQXFGLFFBQUEsRUFBQUMsSUFBQSxFQUFBN0MsR0FBQSxFQUFBUSxHQUFBLEVBQUFzQyxPQUFBLEVBQUFDLE1BQUEsRUFBQUMsT0FBQSxFQUFBQyxRQUFBLEVBQUFDLEtBQUEsRUFBQUMsR0FBQSxFQUFBQyxVQUFBLEVBQUE3SCxRQUFBLEVBQUE4SCxHQUFBLEVBQUFDLFFBQUEsRUFBQWhELE9BQUEsRUFBQWlELFlBQUE7O0FBQUE7QUFDQ2YsMEJBQW9CZ0IsY0FBY0MsbUJBQWQsQ0FBa0NwQixHQUFsQyxDQUFwQjtBQUVBYSxjQUFRYixJQUFJYSxLQUFaO0FBQ0EzSCxpQkFBVzJILE1BQU0zSCxRQUFqQjtBQUNBd0gsZUFBU0csTUFBTUgsTUFBZjtBQUNBekMsZ0JBQVU0QyxNQUFNLFdBQU4sQ0FBVjtBQUNBMUMsWUFBTWxFLEdBQUdDLGFBQUgsQ0FBaUJDLE9BQWpCLENBQXlCO0FBQUNRLGFBQUkrRjtBQUFMLE9BQXpCLEVBQXNDO0FBQUN4RixnQkFBTztBQUFDbUMsb0JBQVM7QUFBVjtBQUFSLE9BQXRDLENBQU47QUFDQTZELHFCQUFlLElBQUlHLEtBQUosRUFBZjtBQUNBMUQsWUFBTSxJQUFJTyxJQUFKLEVBQU47O0FBQ0EsVUFBR29ELFFBQVFDLFlBQVIsQ0FBcUJySSxRQUFyQixFQUE4QitFLE9BQTlCLENBQUg7QUFDQ2lELHVCQUFlakgsR0FBR1EsV0FBSCxDQUFlQyxJQUFmLENBQW9CO0FBQ2xDYixpQkFBT1g7QUFEMkIsU0FBcEIsRUFFWjtBQUNGc0ksZ0JBQU07QUFBQ3ZFLGtCQUFNO0FBQVA7QUFESixTQUZZLEVBSVpMLEtBSlksRUFBZjtBQUREO0FBT0MrRCxrQkFBVSxFQUFWO0FBQ0FDLG1CQUFXM0csR0FBR0MsYUFBSCxDQUFpQlEsSUFBakIsQ0FBc0I7QUFBQ0MsZUFBSStGLE1BQUw7QUFBWTdHLGlCQUFNWDtBQUFsQixTQUF0QixFQUFrRDtBQUFDZ0Msa0JBQU87QUFBQ1AsaUJBQUksQ0FBTDtBQUFPOEcsc0JBQVM7QUFBaEI7QUFBUixTQUFsRCxFQUErRTdFLEtBQS9FLEVBQVg7QUFDQStELGtCQUFVOUIsRUFBRTZDLEtBQUYsQ0FBUWQsUUFBUixFQUFpQixLQUFqQixDQUFWOztBQUNBL0IsVUFBRThDLElBQUYsQ0FBT2YsUUFBUCxFQUFnQixVQUFDZ0IsT0FBRDtBQ2lCVixpQkRoQkxqQixVQUFVOUIsRUFBRWdELEtBQUYsQ0FBUWxCLE9BQVIsRUFBQWlCLFdBQUEsT0FBZ0JBLFFBQVNILFFBQXpCLEdBQXlCLE1BQXpCLENDZ0JMO0FEakJOOztBQUVBNUMsVUFBRUMsSUFBRixDQUFPNkIsT0FBUDs7QUFDQU8sdUJBQWVqSCxHQUFHUSxXQUFILENBQWVDLElBQWYsQ0FBb0I7QUFBQ2IsaUJBQU1YLFFBQVA7QUFBZ0JnQix5QkFBYztBQUFDNEgsaUJBQUluQjtBQUFMO0FBQTlCLFNBQXBCLEVBQWlFO0FBQUNhLGdCQUFNO0FBQUNyQyxxQkFBUyxDQUFDLENBQVg7QUFBYWxDLGtCQUFLO0FBQWxCO0FBQVAsU0FBakUsRUFBK0ZMLEtBQS9GLEVBQWY7QUM0Qkc7O0FEM0JKd0QsWUFBTTJCLFFBQVEsS0FBUixDQUFOO0FBQ0FmLFlBQU1nQixPQUFPQyxPQUFQLENBQWUsbUNBQWYsQ0FBTjtBQUdBNUIsZ0JBQVUwQixRQUFRLFVBQVIsQ0FBVjtBQUNBekIsa0JBQVlELFFBQVE2QixJQUFSLENBQWFsQixHQUFiLEVBQWtCLEVBQWxCLENBQVo7O0FBQ0EsVUFBR1YsU0FBSDtBQUNDNkIsZ0JBQVF6RSxLQUFSLENBQWMsc0NBQWQ7QUFDQXlFLGdCQUFRekUsS0FBUixDQUFjNEMsU0FBZDtBQzJCRzs7QUR6QkpXLGlCQUFXYixJQUFJZ0MsT0FBSixDQUFZcEIsR0FBWixDQUFYO0FBRUFSLGFBQU8sSUFBUDs7QUFDQSxVQUFHTCxrQkFBa0JoRixNQUFsQixLQUE0QixPQUEvQjtBQUNDcUYsZUFBTyxPQUFQO0FDMEJHOztBRHhCSkMsZ0JBQWF0QyxNQUFTQSxJQUFJZCxRQUFiLEdBQTJCcUQsTUFBeEM7QUFDQXhGLGVBQVMsQ0FBQztBQUNSbUgsY0FBTSxRQURFO0FBRVJwRixjQUFLLE1BRkc7QUFHUnFGLGVBQU8sRUFIQztBQUlSQyxlQUFPQyxRQUFRQyxFQUFSLENBQVcsa0JBQVgsRUFBOEIsRUFBOUIsRUFBaUNqQyxJQUFqQztBQUpDLE9BQUQsRUFLTjtBQUNENkIsY0FBTSxRQURMO0FBRURwRixjQUFLLFFBRko7QUFHRHFGLGVBQU8sR0FITjtBQUlEQyxlQUFPQyxRQUFRQyxFQUFSLENBQVcsb0JBQVgsRUFBZ0MsRUFBaEMsRUFBbUNqQyxJQUFuQztBQUpOLE9BTE0sRUFVTjtBQUNENkIsY0FBTSxRQURMO0FBRURwRixjQUFLLFlBRko7QUFHRHFGLGVBQU8sR0FITjtBQUlEQyxlQUFPQyxRQUFRQyxFQUFSLENBQVcsd0JBQVgsRUFBb0MsRUFBcEMsRUFBdUNqQyxJQUF2QztBQUpOLE9BVk0sRUFlTjtBQUNENkIsY0FBTSxRQURMO0FBRURwRixjQUFLLE9BRko7QUFHRHFGLGVBQU8sR0FITjtBQUlEQyxlQUFPQyxRQUFRQyxFQUFSLENBQVcsbUJBQVgsRUFBK0IsRUFBL0IsRUFBa0NqQyxJQUFsQztBQUpOLE9BZk0sRUFvQk47QUFDRDZCLGNBQU0sUUFETDtBQUVEcEYsY0FBSyxTQUZKO0FBR0RxRixlQUFPLEdBSE47QUFJREMsZUFBT0MsUUFBUUMsRUFBUixDQUFXLHFCQUFYLEVBQWlDLEVBQWpDLEVBQW9DakMsSUFBcEM7QUFKTixPQXBCTSxFQXlCTjtBQUNENkIsY0FBTSxRQURMO0FBRURwRixjQUFLLFVBRko7QUFHRHFGLGVBQU8sR0FITjtBQUlEQyxlQUFPQyxRQUFRQyxFQUFSLENBQVcsc0JBQVgsRUFBa0MsRUFBbEMsRUFBcUNqQyxJQUFyQztBQUpOLE9BekJNLEVBOEJOO0FBQ0Q2QixjQUFNLFFBREw7QUFFRHBGLGNBQUssZUFGSjtBQUdEcUYsZUFBTyxHQUhOO0FBSURDLGVBQU9DLFFBQVFDLEVBQVIsQ0FBVywyQkFBWCxFQUF1QyxFQUF2QyxFQUEwQ2pDLElBQTFDLENBSk47QUFLRGtDLG1CQUFXLFVBQUNDLEtBQUQ7QUFDVixjQUFBQyxRQUFBO0FBQUFBLHFCQUFXM0ksR0FBR0MsYUFBSCxDQUFpQlEsSUFBakIsQ0FBc0I7QUFBQ0MsaUJBQUs7QUFBQ21ILG1CQUFLYTtBQUFOO0FBQU4sV0FBdEIsRUFBMEM7QUFBQ3pILG9CQUFRO0FBQUNtQyx3QkFBVTtBQUFYO0FBQVQsV0FBMUMsRUFBbUV3RixHQUFuRSxDQUF1RSxVQUFDdkgsSUFBRCxFQUFNd0gsS0FBTjtBQUNqRixtQkFBT3hILEtBQUsrQixRQUFaO0FBRFUsWUFBWDtBQUdBLGlCQUFPdUYsU0FBU0csSUFBVCxDQUFjLEdBQWQsQ0FBUDtBQVRBO0FBQUEsT0E5Qk0sRUF3Q047QUFDRFYsY0FBTSxRQURMO0FBRURwRixjQUFLLFNBRko7QUFHRHFGLGVBQU8sRUFITjtBQUlEQyxlQUFPQyxRQUFRQyxFQUFSLENBQVcscUJBQVgsRUFBaUMsRUFBakMsRUFBb0NqQyxJQUFwQyxDQUpOO0FBS0RrQyxtQkFBVyxVQUFDQyxLQUFEO0FBQ1YsY0FBQXhHLElBQUE7QUFBQUEsaUJBQU9sQyxHQUFHZ0IsS0FBSCxDQUFTZCxPQUFULENBQWlCO0FBQUNRLGlCQUFLZ0k7QUFBTixXQUFqQixFQUE4QjtBQUFDekgsb0JBQVE7QUFBQytCLG9CQUFNO0FBQVA7QUFBVCxXQUE5QixDQUFQO0FBQ0EsaUJBQUFkLFFBQUEsT0FBT0EsS0FBTWMsSUFBYixHQUFhLE1BQWI7QUFQQTtBQUFBLE9BeENNLEVBZ0ROO0FBQ0RvRixjQUFNLFFBREw7QUFFRHBGLGNBQUssTUFGSjtBQUdEcUYsZUFBTyxFQUhOO0FBSURDLGVBQU9DLFFBQVFDLEVBQVIsQ0FBVyxnQkFBWCxFQUE0QixFQUE1QixFQUErQmpDLElBQS9CLENBSk47QUFLRGtDLG1CQUFXLFVBQUNDLEtBQUQ7QUFDVixjQUFBeEcsSUFBQTtBQUFBQSxpQkFBT2xDLEdBQUdnQixLQUFILENBQVNkLE9BQVQsQ0FBaUI7QUFBQ1EsaUJBQUtnSTtBQUFOLFdBQWpCLEVBQThCO0FBQUN6SCxvQkFBUTtBQUFDb0Isd0JBQVU7QUFBWDtBQUFULFdBQTlCLENBQVA7QUFDQSxpQkFBQUgsUUFBQSxPQUFPQSxLQUFNRyxRQUFiLEdBQWEsTUFBYjtBQVBBO0FBQUEsT0FoRE0sRUF3RE47QUFDRCtGLGNBQU0sUUFETDtBQUVEcEYsY0FBSyxTQUZKO0FBR0RxRixlQUFPLEVBSE47QUFJREMsZUFBT0MsUUFBUUMsRUFBUixDQUFXLHFCQUFYLEVBQWlDLEVBQWpDLEVBQW9DakMsSUFBcEM7QUFKTixPQXhETSxFQTZETjtBQUNENkIsY0FBTSxRQURMO0FBRURwRixjQUFLLGVBRko7QUFHRHFGLGVBQU8sRUFITjtBQUlEQyxlQUFPQyxRQUFRQyxFQUFSLENBQVcsMkJBQVgsRUFBdUMsRUFBdkMsRUFBMENqQyxJQUExQyxDQUpOO0FBS0RrQyxtQkFBVyxVQUFDQyxLQUFEO0FBQ0gsY0FBR0EsS0FBSDtBQ3FEQyxtQkRyRGFILFFBQVFDLEVBQVIsQ0FBVywrQkFBWCxFQUEyQyxFQUEzQyxFQUE4Q2pDLElBQTlDLENDcURiO0FEckREO0FDdURDLG1CRHZEc0VnQyxRQUFRQyxFQUFSLENBQVcsOEJBQVgsRUFBMEMsRUFBMUMsRUFBNkNqQyxJQUE3QyxDQ3VEdEU7QUFDRDtBRDlEUDtBQUFBLE9BN0RNLENBQVQ7QUFzRUFPLG1CQUFBTixXQUFBLE9BQWFBLFFBQVN1QyxPQUFULENBQWlCLEtBQWpCLEVBQXVCLEdBQXZCLENBQWIsR0FBYSxNQUFiO0FBQ0FsQyxZQUFNRyxTQUFTO0FBQ2RULGNBQU1BLElBRFE7QUFFZE8sb0JBQVlBLFVBRkU7QUFHZDdGLGdCQUFRQSxNQUhNO0FBSWRnRyxzQkFBY0E7QUFKQSxPQUFULENBQU47QUFPQVgsaUJBQVcscUJBQXFCMEMsU0FBU0MsTUFBVCxDQUFnQixjQUFoQixDQUFyQixHQUF1RCxNQUFsRTtBQUNBakQsVUFBSWtELFNBQUosQ0FBYyxjQUFkLEVBQThCLDBCQUE5QjtBQUNBbEQsVUFBSWtELFNBQUosQ0FBYyxxQkFBZCxFQUFxQyx5QkFBdUJDLFVBQVU3QyxRQUFWLENBQTVEO0FDeURHLGFEeERITixJQUFJb0QsR0FBSixDQUFRdkMsR0FBUixDQ3dERztBRGxMSixhQUFBcEQsS0FBQTtBQTJITUQsVUFBQUMsS0FBQTtBQUNMeUUsY0FBUXpFLEtBQVIsQ0FBY0QsRUFBRTZGLEtBQWhCO0FDMERHLGFEekRIckQsSUFBSW9ELEdBQUosQ0FBUTVGLEVBQUVpQyxPQUFWLENDeURHO0FBQ0Q7QUR4TEosSUNBQztBRERGLEciLCJmaWxlIjoiL3BhY2thZ2VzL3N0ZWVkb3NfdXNlcnMtaW1wb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY2hlY2tOcG1WZXJzaW9ucyB9IGZyb20gJ21ldGVvci90bWVhc2RheTpjaGVjay1ucG0tdmVyc2lvbnMnO1xyXG5jaGVja05wbVZlcnNpb25zKHtcclxuXHRcImVqc1wiOiBcIl4yLjUuNVwiLFxyXG5cdFwiZWpzLWxpbnRcIjogXCJeMC4yLjBcIlxyXG59LCAnc3RlZWRvczp1c2Vycy1pbXBvcnQnKTtcclxuIiwiTWV0ZW9yLm1ldGhvZHNcclxuXHQjIyNcclxuXHRcdDHjgIHmoKHpqoznlKjmiLfmmK/lkKblrZjlnKhcclxuXHRcdDLjgIHmoKHpqozlt6XkvZzljLrnlKjmiLfmmK/lkKblrZjlnKhcclxuXHRcdDPjgIHmoKHpqozpg6jpl6jmmK/lkKblrZjlnKhcclxuXHRcdDTjgIHmoKHpqozpg6jpl6jnlKjmiLfmmK/lkKblrZjlnKhcclxuXHRcdFRPRE86IOWbvemZheWMllxyXG5cdCMjI1xyXG5cdGltcG9ydF91c2VyczogKHNwYWNlX2lkLCB1c2VyX3BrLCBkYXRhLCBvbmx5Q2hlY2spLT5cclxuXHJcblx0XHRfc2VsZiA9IHRoaXNcclxuXHJcblx0XHRpZiAhdGhpcy51c2VySWRcclxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIFwi6K+35YWI55m75b2VXCIpXHJcblxyXG5cdFx0cm9vdF9vcmcgPSBkYi5vcmdhbml6YXRpb25zLmZpbmRPbmUoe3NwYWNlOiBzcGFjZV9pZCwgcGFyZW50OiBudWxsfSlcclxuXHJcblx0XHRzcGFjZSA9IGRiLnNwYWNlcy5maW5kT25lKHNwYWNlX2lkKVxyXG5cdFx0aWYgIXNwYWNlIHx8ICFzcGFjZT8uYWRtaW5zLmluY2x1ZGVzKHRoaXMudXNlcklkKVxyXG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMSwgXCLlj6rmnInlt6XkvZzljLrnrqHnkIblkZjlj6/ku6Xlr7zlhaXnlKjmiLdcIik7XHJcblxyXG5cdFx0aWYgIXNwYWNlLmlzX3BhaWRcclxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIFwi5Z+656GA54mI5LiN5pSv5oyB5q2k5Yqf6IO9XCIpO1xyXG5cclxuXHRcdGFjY2VwdGVkX3VzZXJfY291bnQgPSBkYi5zcGFjZV91c2Vycy5maW5kKHtzcGFjZTogc3BhY2UuX2lkLCB1c2VyX2FjY2VwdGVkOiB0cnVlfSkuY291bnQoKVxyXG5cdFx0aWYgKGFjY2VwdGVkX3VzZXJfY291bnQgKyBkYXRhLmxlbmd0aCkgPiBzcGFjZS51c2VyX2xpbWl0XHJcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCBcIumcgOimgeaPkOWNh+W3sui0reS5sOeUqOaIt+aVsOiHsyN7YWNjZXB0ZWRfdXNlcl9jb3VudCArIGRhdGEubGVuZ3RofSjlvZPliY0je3NwYWNlLnVzZXJfbGltaXR9KVwiICtcIiwg6K+35Zyo5LyB5Lia5L+h5oGv5qih5Z2X5Lit54K55Ye75Y2H57qn5oyJ6ZKu6LSt5LmwXCIpXHJcblxyXG5cdFx0b3duZXJfaWQgPSBzcGFjZS5vd25lclxyXG5cclxuXHRcdHRlc3REYXRhID0gW11cclxuXHJcblx0XHRlcnJvckxpc3QgPSBbXVxyXG5cclxuXHRcdGN1cnJlbnRVc2VyID0gZGIudXNlcnMuZmluZE9uZSh7X2lkOiBfc2VsZi51c2VySWR9LHtmaWVsZHM6e2xvY2FsZToxLHBob25lOjF9fSlcclxuXHRcdGN1cnJlbnRVc2VyTG9jYWxlID0gY3VycmVudFVzZXIubG9jYWxlXHJcblxyXG5cdFx0IyDmlbDmja7nu5/kuIDmoKHpqoxcclxuXHJcblx0XHRkYXRhLmZvckVhY2ggKGl0ZW0sIGkpLT5cclxuXHRcdFx0IyBjb25zb2xlLmxvZyBpdGVtXHJcblx0XHRcdCMg55So5oi35ZCN77yM5omL5py65Y+377yM6YKu566x5LiN6IO96YO95Li656m6XHJcblx0XHRcdGlmICFpdGVtLnBob25lIGFuZCAhaXRlbS5lbWFpbFxyXG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrCN7aSArIDF96KGMOiDmiYvmnLrlj7fvvIzpgq7nrrHkuI3og73pg73kuLrnqbpcIilcclxuXHJcblx0XHRcdCMg5Yik5patZXhjZWzkuK3nmoTmlbDmja7vvIznlKjmiLflkI3jgIHmiYvmnLrlj7fnrYnkv6Hmga/mmK/lkKbmnInor69cclxuXHRcdFx0dGVzdE9iaiA9IHt9XHJcblx0XHRcdGlmIGl0ZW0udXNlcm5hbWVcclxuXHRcdFx0XHR0ZXN0T2JqLnVzZXJuYW1lID0gaXRlbS51c2VybmFtZVxyXG5cdFx0XHRcdGlmIHRlc3REYXRhLmZpbHRlclByb3BlcnR5KFwidXNlcm5hbWVcIiwgaXRlbS51c2VybmFtZSkubGVuZ3RoID4gMFxyXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysI3tpICsgMX3ooYzvvJrnlKjmiLflkI3ph43lpI1cIik7XHJcblxyXG5cdFx0XHRpZiBpdGVtLnBob25lXHJcblx0XHRcdFx0dGVzdE9iai5waG9uZSA9IGl0ZW0ucGhvbmVcclxuXHRcdFx0XHRpZiB0ZXN0RGF0YS5maWx0ZXJQcm9wZXJ0eShcInBob25lXCIsIGl0ZW0ucGhvbmUpLmxlbmd0aCA+IDBcclxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrCN7aSArIDF96KGM77ya5omL5py65Y+36YeN5aSNXCIpO1xyXG5cclxuXHRcdFx0aWYgaXRlbS5lbWFpbFxyXG5cdFx0XHRcdGlmIG5vdCAvXihbQS1aMC05XFwuXFwtXFxfXFwrXSkqKFtBLVowLTlcXCtcXC1cXF9dKStcXEBbQS1aMC05XSsoW1xcLV1bQS1aMC05XSspKihbXFwuXVtBLVowLTlcXC1dKyl7MSw4fSQvaS50ZXN0KGl0ZW0uZW1haWwpXHJcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLnrKwje2kgKyAxfeihjO+8mumCruS7tuagvOW8j+mUmeivryN7aXRlbS5lbWFpbH1cIik7XHJcblxyXG5cdFx0XHRcdHRlc3RPYmouZW1haWwgPSBpdGVtLmVtYWlsXHJcblx0XHRcdFx0aWYgdGVzdERhdGEuZmlsdGVyUHJvcGVydHkoXCJlbWFpbFwiLCBpdGVtLmVtYWlsKS5sZW5ndGggPiAwXHJcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLnrKwje2kgKyAxfeihjO+8mumCruS7tumHjeWkjVwiKTtcclxuXHJcblx0XHRcdGl0ZW0uc3BhY2UgPSBzcGFjZV9pZFxyXG5cclxuXHRcdFx0dGVzdERhdGEucHVzaCh0ZXN0T2JqKVxyXG5cclxuXHRcdFx0IyDojrflj5bmn6Xmib51c2Vy55qE5p2h5Lu2XHJcblx0XHRcdHNlbGVjdG9yID0gW11cclxuXHRcdFx0b3BlcmF0aW5nID0gXCJcIlxyXG5cdFx0XHRpZiBpdGVtLnVzZXJuYW1lXHJcblx0XHRcdFx0c2VsZWN0b3IucHVzaCB7dXNlcm5hbWU6IGl0ZW0udXNlcm5hbWV9XHJcblx0XHRcdGlmIGl0ZW0uZW1haWxcclxuXHRcdFx0XHRzZWxlY3Rvci5wdXNoIHtlbWFpbDogaXRlbS5lbWFpbH1cclxuXHRcdFx0aWYgaXRlbS5waG9uZVxyXG5cdFx0XHRcdHNlbGVjdG9yLnB1c2gge21vYmlsZTogaXRlbS5waG9uZX1cclxuXHJcblx0XHRcdHVzZXJFeGlzdCA9IGRiLnVzZXJzLmZpbmQoeyRvcjogc2VsZWN0b3J9KVxyXG5cclxuXHJcblx0XHRcdCMg5YWI5Yik5pat5piv5ZCm6IO95Yy56YWN5Yiw5ZSv5LiA55qEdXNlcu+8jOeEtuWQjuWIpOaWreivpeeUqOaIt+aYr2luc2VydOWIsHNwYWNlX3VzZXJz6L+Y5pivdXBkYXRlXHJcblx0XHRcdGlmIHVzZXJFeGlzdC5jb3VudCgpID4gMVxyXG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrCN7aSArIDF96KGM77ya55So5oi35ZCN44CB5omL5py65Y+344CB6YKu566x5L+h5oGv5pyJ6K+v77yM5peg5rOV5Yy56YWN5Yiw5ZCM5LiA6LSm5Y+3XCIpXHJcblx0XHRcdGVsc2UgaWYgdXNlckV4aXN0LmNvdW50KCkgPT0gMVxyXG5cdFx0XHRcdHVzZXIgPSB1c2VyRXhpc3QuZmV0Y2goKVswXS5faWRcclxuXHRcdFx0XHRzcGFjZVVzZXJFeGlzdCA9IGRiLnNwYWNlX3VzZXJzLmZpbmQoe3NwYWNlOiBzcGFjZV9pZCwgdXNlcjogdXNlcn0pXHJcblx0XHRcdFx0aWYgc3BhY2VVc2VyRXhpc3QuY291bnQoKSA9PSAxXHJcblx0XHRcdFx0XHRvcGVyYXRpbmcgPSBcInVwZGF0ZVwiXHJcblx0XHRcdFx0ZWxzZSBpZiBzcGFjZVVzZXJFeGlzdC5jb3VudCgpID09IDBcclxuXHRcdFx0XHRcdG9wZXJhdGluZyA9IFwiaW5zZXJ0XCJcclxuXHRcdFx0ZWxzZSBpZiB1c2VyRXhpc3QuY291bnQoKSA9PSAwXHJcblx0XHRcdFx0IyDmlrDlop5zcGFjZV91c2Vyc+eahOaVsOaNruagoemqjFxyXG5cdFx0XHRcdG9wZXJhdGluZyA9IFwiaW5zZXJ0XCJcclxuXHJcblx0XHRcdCMg5Yik5pat5piv5ZCm6IO95L+u5pS555So5oi355qE5a+G56CBXHJcblx0XHRcdGlmIGl0ZW0ucGFzc3dvcmQgYW5kIHVzZXJFeGlzdC5jb3VudCgpID09IDFcclxuXHRcdFx0XHRpZiB1c2VyRXhpc3QuZmV0Y2goKVswXS5zZXJ2aWNlcz8ucGFzc3dvcmQ/LmJjcnlwdFxyXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysI3tpICsgMX3ooYzvvJrnlKjmiLflt7Lorr7nva7lr4bnoIHvvIzkuI3lhYHorrjkv67mlLlcIik7XHJcblxyXG5cdFx0XHQjIOWIpOaWremDqOmXqOaYr+WQpuWQiOeQhlxyXG5cdFx0XHRvcmdhbml6YXRpb24gPSBpdGVtLm9yZ2FuaXphdGlvblxyXG5cclxuXHRcdFx0aWYgIW9yZ2FuaXphdGlvblxyXG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrCN7aSArIDF96KGM77ya6YOo6Zeo5LiN6IO95Li656m6XCIpO1xyXG5cclxuXHRcdFx0b3JnYW5pemF0aW9uX2RlcHRzID0gb3JnYW5pemF0aW9uLnNwbGl0KFwiL1wiKTtcclxuXHJcblx0XHRcdGlmIG9yZ2FuaXphdGlvbl9kZXB0cy5sZW5ndGggPCAxIHx8IG9yZ2FuaXphdGlvbl9kZXB0c1swXSAhPSByb290X29yZy5uYW1lXHJcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysI3tpICsgMX3ooYzvvJrml6DmlYjnmoTmoLnpg6jpl6hcIik7XHJcblxyXG5cdFx0XHRpZiBpdGVtLnBhc3N3b3JkICYmIHVzZXI/LnNlcnZpY2VzPy5wYXNzd29yZD8uYmNyeXB0XHJcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysI3tpICsgMX3ooYzvvJrnlKjmiLflt7Lorr7nva7lr4bnoIHvvIzkuI3lhYHorrjkv67mlLlcIik7XHJcblxyXG5cdFx0XHRvcmdhbml6YXRpb25fZGVwdHMuZm9yRWFjaCAoZGVwdF9uYW1lLCBqKSAtPlxyXG5cdFx0XHRcdGlmICFkZXB0X25hbWVcclxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrCN7aSArIDF96KGM77ya5peg5pWI55qE6YOo6ZeoXCIpO1xyXG5cclxuXHRcdFx0bXVsdGlPcmdzID0gb3JnYW5pemF0aW9uLnNwbGl0KFwiLFwiKVxyXG5cdFx0XHRtdWx0aU9yZ3MuZm9yRWFjaCAob3JnRnVsbG5hbWUpIC0+XHJcblx0XHRcdFx0b3JnYW5pemF0aW9uX2RlcHRzID0gb3JnRnVsbG5hbWUudHJpbSgpLnNwbGl0KFwiL1wiKVxyXG5cdFx0XHRcdGZ1bGxuYW1lID0gXCJcIlxyXG5cdFx0XHRcdG9yZ2FuaXphdGlvbl9kZXB0cy5mb3JFYWNoIChkZXB0X25hbWUsIGopIC0+XHJcblx0XHRcdFx0XHRpZiBqID4gMFxyXG5cdFx0XHRcdFx0XHRpZiBqID09IDFcclxuXHRcdFx0XHRcdFx0XHRmdWxsbmFtZSA9IGRlcHRfbmFtZVxyXG5cdFx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdFx0ZnVsbG5hbWUgPSBmdWxsbmFtZSArIFwiL1wiICsgZGVwdF9uYW1lXHJcblxyXG5cdFx0XHRcdFx0XHRvcmdDb3VudCA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZCh7c3BhY2U6IHNwYWNlX2lkLCBmdWxsbmFtZTogZnVsbG5hbWV9KS5jb3VudCgpXHJcblxyXG5cdFx0XHRcdFx0XHRpZiBvcmdDb3VudCA9PSAwXHJcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysI3tpICsgMX3ooYzvvJrpg6jpl6goI3tkZXB0X25hbWV9KeS4jeWtmOWcqO+8jOivt+WFiOWIm+W7ulwiKTtcclxuXHJcblx0XHRpZiBvbmx5Q2hlY2tcclxuXHRcdFx0cmV0dXJuIDtcclxuXHJcblx0XHQjIOaVsOaNruWvvOWFpVxyXG5cdFx0ZGF0YS5mb3JFYWNoIChpdGVtLCBpKS0+XHJcblx0XHRcdGVycm9yID0ge31cclxuXHRcdFx0dHJ5XHJcblx0XHRcdFx0c2VsZWN0b3IgPSBbXVxyXG5cdFx0XHRcdG9wZXJhdGluZyA9IFwiXCJcclxuXHRcdFx0XHQjIGlmIGl0ZW0udXNlcm5hbWVcclxuXHRcdFx0XHQjIFx0c2VsZWN0b3IucHVzaCB7dXNlcm5hbWU6IGl0ZW0udXNlcm5hbWV9XHJcblx0XHRcdFx0aWYgaXRlbS5lbWFpbFxyXG5cdFx0XHRcdFx0c2VsZWN0b3IucHVzaCB7ZW1haWw6IGl0ZW0uZW1haWx9XHJcblx0XHRcdFx0aWYgaXRlbS5waG9uZVxyXG5cdFx0XHRcdFx0c2VsZWN0b3IucHVzaCB7bW9iaWxlOiBpdGVtLnBob25lfVxyXG5cdFx0XHRcdHVzZXJFeGlzdCA9IGRiLnVzZXJzLmZpbmQoeyRvcjogc2VsZWN0b3J9KVxyXG5cdFx0XHRcdGlmIHVzZXJFeGlzdC5jb3VudCgpID4gMVxyXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsIFwi55So5oi35ZCN44CB5omL5py65Y+344CB6YKu566x5L+h5oGv5pyJ6K+v77yM5peg5rOV5Yy56YWN5Yiw5ZCM5LiA6LSm5Y+3XCIpXHJcblx0XHRcdFx0ZWxzZSBpZiB1c2VyRXhpc3QuY291bnQoKSA9PSAxXHJcblx0XHRcdFx0XHR1c2VyID0gdXNlckV4aXN0LmZldGNoKClbMF1cclxuXHJcblx0XHRcdFx0bm93ID0gbmV3IERhdGUoKVxyXG5cclxuXHRcdFx0XHRvcmdhbml6YXRpb24gPSBpdGVtLm9yZ2FuaXphdGlvblxyXG5cdFx0XHRcdG11bHRpT3JncyA9IG9yZ2FuaXphdGlvbi5zcGxpdChcIixcIilcclxuXHRcdFx0XHRiZWxvbmdPcmdpZHMgPSBbXVxyXG5cdFx0XHRcdG11bHRpT3Jncy5mb3JFYWNoIChvcmdGdWxsbmFtZSkgLT5cclxuXHRcdFx0XHRcdG9yZ2FuaXphdGlvbl9kZXB0cyA9IG9yZ0Z1bGxuYW1lLnRyaW0oKS5zcGxpdChcIi9cIilcclxuXHRcdFx0XHRcdGZ1bGxuYW1lID0gXCJcIlxyXG5cdFx0XHRcdFx0b3JnYW5pemF0aW9uX2RlcHRzLmZvckVhY2ggKGRlcHRfbmFtZSwgaikgLT5cclxuXHRcdFx0XHRcdFx0aWYgaiA+IDBcclxuXHRcdFx0XHRcdFx0XHRpZiBqID09IDFcclxuXHRcdFx0XHRcdFx0XHRcdGZ1bGxuYW1lID0gZGVwdF9uYW1lXHJcblx0XHRcdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRcdFx0ZnVsbG5hbWUgPSBmdWxsbmFtZSArIFwiL1wiICsgZGVwdF9uYW1lXHJcblx0XHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0XHRmdWxsbmFtZSA9IGRlcHRfbmFtZVxyXG5cclxuXHRcdFx0XHRcdG9yZyA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZE9uZSh7c3BhY2U6IHNwYWNlX2lkLCBmdWxsbmFtZTogZnVsbG5hbWV9KVxyXG5cclxuXHRcdFx0XHRcdGlmIG9yZ1xyXG5cdFx0XHRcdFx0XHRiZWxvbmdPcmdpZHMucHVzaCBvcmcuX2lkXHJcblxyXG5cclxuXHRcdFx0XHR1c2VyX2lkID0gbnVsbFxyXG5cdFx0XHRcdGlmIHVzZXJcclxuXHRcdFx0XHRcdHVzZXJfaWQgPSB1c2VyLl9pZFxyXG5cdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdHVkb2MgPSB7fVxyXG5cdFx0XHRcdFx0dWRvYy5faWQgPSBkYi51c2Vycy5fbWFrZU5ld0lEKClcclxuXHRcdFx0XHRcdHVkb2Muc3RlZWRvc19pZCA9IGl0ZW0uZW1haWwgfHwgdWRvYy5faWRcclxuXHRcdFx0XHRcdHVkb2MubG9jYWxlID0gY3VycmVudFVzZXJMb2NhbGVcclxuXHRcdFx0XHRcdHVkb2Muc3BhY2VzX2ludml0ZWQgPSBbc3BhY2VfaWRdXHJcblx0XHRcdFx0XHRpZiBpdGVtLm5hbWVcclxuXHRcdFx0XHRcdFx0dWRvYy5uYW1lID0gaXRlbS5uYW1lXHJcblxyXG5cdFx0XHRcdFx0aWYgaXRlbS5lbWFpbFxyXG5cdFx0XHRcdFx0XHR1ZG9jLmVtYWlsID0gaXRlbS5lbWFpbFxyXG5cdFx0XHRcdFx0XHR1ZG9jLmVtYWlsX3ZlcmlmaWVkID0gZmFsc2VcclxuXHJcblx0XHRcdFx0XHRpZiBpdGVtLnVzZXJuYW1lXHJcblx0XHRcdFx0XHRcdHVkb2MudXNlcm5hbWUgPSBpdGVtLnVzZXJuYW1lXHJcblxyXG5cdFx0XHRcdFx0aWYgaXRlbS5waG9uZVxyXG5cdFx0XHRcdFx0XHR1ZG9jLm1vYmlsZSA9IGl0ZW0ucGhvbmVcclxuXHRcdFx0XHRcdFx0dWRvYy5tb2JpbGVfdmVyaWZpZWQgPSBmYWxzZVxyXG5cdFx0XHRcdFx0dXNlcl9pZCA9IGRiLnVzZXJzLmluc2VydCh1ZG9jKVxyXG5cclxuXHRcdFx0XHRcdGlmIGl0ZW0ucGFzc3dvcmRcclxuXHRcdFx0XHRcdFx0QWNjb3VudHMuc2V0UGFzc3dvcmQodXNlcl9pZCwgaXRlbS5wYXNzd29yZCwge2xvZ291dDogZmFsc2V9KVxyXG5cclxuXHRcdFx0XHRzcGFjZV91c2VyID0gZGIuc3BhY2VfdXNlcnMuZmluZE9uZSh7c3BhY2U6IHNwYWNlX2lkLCB1c2VyOiB1c2VyX2lkfSlcclxuXHJcblx0XHRcdFx0aWYgc3BhY2VfdXNlclxyXG5cdFx0XHRcdFx0aWYgYmVsb25nT3JnaWRzLmxlbmd0aCA+IDBcclxuXHRcdFx0XHRcdFx0aWYgIXNwYWNlX3VzZXIub3JnYW5pemF0aW9uc1xyXG5cdFx0XHRcdFx0XHRcdHNwYWNlX3VzZXIub3JnYW5pemF0aW9ucyA9IFtdXHJcblxyXG5cdFx0XHRcdFx0XHRzcGFjZV91c2VyX3VwZGF0ZV9kb2MgPSB7fVxyXG5cclxuXHRcdFx0XHRcdFx0c3BhY2VfdXNlcl91cGRhdGVfZG9jLm9yZ2FuaXphdGlvbnMgPSBfLnVuaXEoc3BhY2VfdXNlci5vcmdhbml6YXRpb25zLmNvbmNhdChiZWxvbmdPcmdpZHMpKVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgaXRlbS5lbWFpbFxyXG5cdFx0XHRcdFx0XHRcdHNwYWNlX3VzZXJfdXBkYXRlX2RvYy5lbWFpbCA9IGl0ZW0uZW1haWxcclxuXHJcblx0XHRcdFx0XHRcdGlmIGl0ZW0ubmFtZVxyXG5cdFx0XHRcdFx0XHRcdHNwYWNlX3VzZXJfdXBkYXRlX2RvYy5uYW1lID0gaXRlbS5uYW1lXHJcblxyXG5cdFx0XHRcdFx0XHRpZiBpdGVtLmNvbXBhbnlcclxuXHRcdFx0XHRcdFx0XHRzcGFjZV91c2VyX3VwZGF0ZV9kb2MuY29tcGFueSA9IGl0ZW0uY29tcGFueVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgaXRlbS5wb3NpdGlvblxyXG5cdFx0XHRcdFx0XHRcdHNwYWNlX3VzZXJfdXBkYXRlX2RvYy5wb3NpdGlvbiA9IGl0ZW0ucG9zaXRpb25cclxuXHJcblx0XHRcdFx0XHRcdGlmIGl0ZW0ud29ya19waG9uZVxyXG5cdFx0XHRcdFx0XHRcdHNwYWNlX3VzZXJfdXBkYXRlX2RvYy53b3JrX3Bob25lID0gaXRlbS53b3JrX3Bob25lXHJcblxyXG5cdFx0XHRcdFx0XHRpZiBpdGVtLnBob25lXHJcblx0XHRcdFx0XHRcdFx0c3BhY2VfdXNlcl91cGRhdGVfZG9jLm1vYmlsZSA9IGl0ZW0ucGhvbmVcclxuXHJcblx0XHRcdFx0XHRcdGlmIGl0ZW0uc29ydF9ub1xyXG5cdFx0XHRcdFx0XHRcdHNwYWNlX3VzZXJfdXBkYXRlX2RvYy5zb3J0X25vID0gaXRlbS5zb3J0X25vXHJcblxyXG5cdFx0XHRcdFx0XHRpZiBfLmtleXMoc3BhY2VfdXNlcl91cGRhdGVfZG9jKS5sZW5ndGggPiAwXHJcblx0XHRcdFx0XHRcdFx0ZGIuc3BhY2VfdXNlcnMudXBkYXRlKHtzcGFjZTogc3BhY2VfaWQsIHVzZXI6IHVzZXJfaWR9LCB7JHNldDogc3BhY2VfdXNlcl91cGRhdGVfZG9jfSlcclxuXHJcblx0XHRcdFx0XHRcdGlmIHNwYWNlX3VzZXIuaW52aXRlX3N0YXRlID09IFwicmVmdXNlZFwiIG9yIHNwYWNlX3VzZXIuaW52aXRlX3N0YXRlID09IFwicGVuZGluZ1wiXHJcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsIFwi6K+l55So5oi36L+Y5pyq5o6l5Y+X5Yqg5YWl5bel5L2c5Yy677yM5LiN6IO95L+u5pS55LuW55qE5Liq5Lq65L+h5oGvXCIpXHJcblx0XHRcdFx0XHRcdGVsc2VcclxuI1x0XHRcdFx0XHRcdFx0aWYgaXRlbS51c2VybmFtZVxyXG4jXHRcdFx0XHRcdFx0XHRcdGRiLnVzZXJzLnVwZGF0ZSh7X2lkOiB1c2VyX2lkfSx7JHNldDp7dXNlcm5hbWU6IGl0ZW0udXNlcm5hbWV9fSlcclxuXHRcdFx0XHRcdFx0XHRpZiBpdGVtLnBhc3N3b3JkXHJcblx0XHRcdFx0XHRcdFx0XHRBY2NvdW50cy5zZXRQYXNzd29yZCh1c2VyX2lkLCBpdGVtLnBhc3N3b3JkLCB7bG9nb3V0OiBmYWxzZX0pXHJcblxyXG5cdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdGlmIGJlbG9uZ09yZ2lkcy5sZW5ndGggPiAwXHJcblx0XHRcdFx0XHRcdHN1X2RvYyA9IHt9XHJcblx0XHRcdFx0XHRcdHN1X2RvYy5faWQgPSBkYi5zcGFjZV91c2Vycy5fbWFrZU5ld0lEKClcclxuXHRcdFx0XHRcdFx0c3VfZG9jLnNwYWNlID0gc3BhY2VfaWRcclxuXHJcblx0XHRcdFx0XHRcdHN1X2RvYy51c2VyX2FjY2VwdGVkID0gIHRydWVcclxuXHRcdFx0XHRcdFx0c3VfZG9jLmludml0ZV9zdGF0ZSA9IFwiYWNjZXB0ZWRcIlxyXG5cclxuXHRcdFx0XHRcdFx0aWYgdXNlclxyXG5cdFx0XHRcdFx0XHRcdHN1X2RvYy51c2VyX2FjY2VwdGVkID0gZmFsc2VcclxuXHRcdFx0XHRcdFx0XHRzdV9kb2MuaW52aXRlX3N0YXRlID0gXCJwZW5kaW5nXCJcclxuXHJcblx0XHRcdFx0XHRcdHN1X2RvYy5uYW1lID0gaXRlbS5uYW1lXHJcblx0XHRcdFx0XHRcdGlmIGl0ZW0uZW1haWxcclxuXHRcdFx0XHRcdFx0XHRzdV9kb2MuZW1haWwgPSBpdGVtLmVtYWlsXHJcblx0XHRcdFx0XHRcdHN1X2RvYy5vcmdhbml6YXRpb24gPSBiZWxvbmdPcmdpZHNbMF1cclxuXHRcdFx0XHRcdFx0c3VfZG9jLm9yZ2FuaXphdGlvbnMgPSBiZWxvbmdPcmdpZHNcclxuXHJcblx0XHRcdFx0XHRcdGlmIGl0ZW0ucG9zaXRpb25cclxuXHRcdFx0XHRcdFx0XHRzdV9kb2MucG9zaXRpb24gPSBpdGVtLnBvc2l0aW9uXHJcblxyXG5cdFx0XHRcdFx0XHRpZiBpdGVtLndvcmtfcGhvbmVcclxuXHRcdFx0XHRcdFx0XHRzdV9kb2Mud29ya19waG9uZSA9IGl0ZW0ud29ya19waG9uZVxyXG5cclxuXHRcdFx0XHRcdFx0aWYgaXRlbS5waG9uZVxyXG5cdFx0XHRcdFx0XHRcdHN1X2RvYy5tb2JpbGUgPSBpdGVtLnBob25lXHJcblxyXG5cdFx0XHRcdFx0XHRpZiBpdGVtLnNvcnRfbm9cclxuXHRcdFx0XHRcdFx0XHRzdV9kb2Muc29ydF9ubyA9IGl0ZW0uc29ydF9ub1xyXG5cclxuXHRcdFx0XHRcdFx0aWYgaXRlbS5jb21wYW55XHJcblx0XHRcdFx0XHRcdFx0c3VfZG9jLmNvbXBhbnkgPSBpdGVtLmNvbXBhbnlcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRcdGlmIHVzZXJfaWRcclxuXHRcdFx0XHRcdFx0XHR1c2VySW5mbyA9IGRiLnVzZXJzLmZpbmRPbmUodXNlcl9pZCwgeyBmaWVsZHM6IHsgdXNlcm5hbWU6IDEgfSB9KVxyXG5cdFx0XHRcdFx0XHRcdGlmIHVzZXJJbmZvLnVzZXJuYW1lXHJcblx0XHRcdFx0XHRcdFx0XHRzdV9kb2MudXNlcm5hbWUgPSB1c2VySW5mby51c2VybmFtZVxyXG5cdFx0XHRcdFx0XHRcdHN1X2RvYy51c2VyID0gdXNlcl9pZFxyXG5cclxuXHRcdFx0XHRcdFx0ZGIuc3BhY2VfdXNlcnMuaW5zZXJ0KHN1X2RvYylcclxuXHRcdFx0Y2F0Y2ggZVxyXG5cdFx0XHRcdGVycm9yLmxpbmUgPSBpKzFcclxuXHRcdFx0XHRlcnJvci5tZXNzYWdlID0gZS5yZWFzb25cclxuXHRcdFx0XHRlcnJvckxpc3QucHVzaChlcnJvcilcclxuXHJcblx0XHRyZXR1cm4gZXJyb3JMaXN0XHJcbiIsIk1ldGVvci5tZXRob2RzKHtcblxuICAvKlxuICBcdFx0MeOAgeagoemqjOeUqOaIt+aYr+WQpuWtmOWcqFxuICBcdFx0MuOAgeagoemqjOW3peS9nOWMuueUqOaIt+aYr+WQpuWtmOWcqFxuICBcdFx0M+OAgeagoemqjOmDqOmXqOaYr+WQpuWtmOWcqFxuICBcdFx0NOOAgeagoemqjOmDqOmXqOeUqOaIt+aYr+WQpuWtmOWcqFxuICBcdFx0VE9ETzog5Zu96ZmF5YyWXG4gICAqL1xuICBpbXBvcnRfdXNlcnM6IGZ1bmN0aW9uKHNwYWNlX2lkLCB1c2VyX3BrLCBkYXRhLCBvbmx5Q2hlY2spIHtcbiAgICB2YXIgX3NlbGYsIGFjY2VwdGVkX3VzZXJfY291bnQsIGN1cnJlbnRVc2VyLCBjdXJyZW50VXNlckxvY2FsZSwgZXJyb3JMaXN0LCBvd25lcl9pZCwgcm9vdF9vcmcsIHNwYWNlLCB0ZXN0RGF0YTtcbiAgICBfc2VsZiA9IHRoaXM7XG4gICAgaWYgKCF0aGlzLnVzZXJJZCkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIFwi6K+35YWI55m75b2VXCIpO1xuICAgIH1cbiAgICByb290X29yZyA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZE9uZSh7XG4gICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICBwYXJlbnQ6IG51bGxcbiAgICB9KTtcbiAgICBzcGFjZSA9IGRiLnNwYWNlcy5maW5kT25lKHNwYWNlX2lkKTtcbiAgICBpZiAoIXNwYWNlIHx8ICEoc3BhY2UgIT0gbnVsbCA/IHNwYWNlLmFkbWlucy5pbmNsdWRlcyh0aGlzLnVzZXJJZCkgOiB2b2lkIDApKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMSwgXCLlj6rmnInlt6XkvZzljLrnrqHnkIblkZjlj6/ku6Xlr7zlhaXnlKjmiLdcIik7XG4gICAgfVxuICAgIGlmICghc3BhY2UuaXNfcGFpZCkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIFwi5Z+656GA54mI5LiN5pSv5oyB5q2k5Yqf6IO9XCIpO1xuICAgIH1cbiAgICBhY2NlcHRlZF91c2VyX2NvdW50ID0gZGIuc3BhY2VfdXNlcnMuZmluZCh7XG4gICAgICBzcGFjZTogc3BhY2UuX2lkLFxuICAgICAgdXNlcl9hY2NlcHRlZDogdHJ1ZVxuICAgIH0pLmNvdW50KCk7XG4gICAgaWYgKChhY2NlcHRlZF91c2VyX2NvdW50ICsgZGF0YS5sZW5ndGgpID4gc3BhY2UudXNlcl9saW1pdCkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsIChcIumcgOimgeaPkOWNh+W3sui0reS5sOeUqOaIt+aVsOiHs1wiICsgKGFjY2VwdGVkX3VzZXJfY291bnQgKyBkYXRhLmxlbmd0aCkgKyBcIijlvZPliY1cIiArIHNwYWNlLnVzZXJfbGltaXQgKyBcIilcIikgKyBcIiwg6K+35Zyo5LyB5Lia5L+h5oGv5qih5Z2X5Lit54K55Ye75Y2H57qn5oyJ6ZKu6LSt5LmwXCIpO1xuICAgIH1cbiAgICBvd25lcl9pZCA9IHNwYWNlLm93bmVyO1xuICAgIHRlc3REYXRhID0gW107XG4gICAgZXJyb3JMaXN0ID0gW107XG4gICAgY3VycmVudFVzZXIgPSBkYi51c2Vycy5maW5kT25lKHtcbiAgICAgIF9pZDogX3NlbGYudXNlcklkXG4gICAgfSwge1xuICAgICAgZmllbGRzOiB7XG4gICAgICAgIGxvY2FsZTogMSxcbiAgICAgICAgcGhvbmU6IDFcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjdXJyZW50VXNlckxvY2FsZSA9IGN1cnJlbnRVc2VyLmxvY2FsZTtcbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24oaXRlbSwgaSkge1xuICAgICAgdmFyIG11bHRpT3Jncywgb3BlcmF0aW5nLCBvcmdhbml6YXRpb24sIG9yZ2FuaXphdGlvbl9kZXB0cywgcmVmLCByZWYxLCByZWYyLCByZWYzLCBzZWxlY3Rvciwgc3BhY2VVc2VyRXhpc3QsIHRlc3RPYmosIHVzZXIsIHVzZXJFeGlzdDtcbiAgICAgIGlmICghaXRlbS5waG9uZSAmJiAhaXRlbS5lbWFpbCkge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLnrKxcIiArIChpICsgMSkgKyBcIuihjDog5omL5py65Y+377yM6YKu566x5LiN6IO96YO95Li656m6XCIpO1xuICAgICAgfVxuICAgICAgdGVzdE9iaiA9IHt9O1xuICAgICAgaWYgKGl0ZW0udXNlcm5hbWUpIHtcbiAgICAgICAgdGVzdE9iai51c2VybmFtZSA9IGl0ZW0udXNlcm5hbWU7XG4gICAgICAgIGlmICh0ZXN0RGF0YS5maWx0ZXJQcm9wZXJ0eShcInVzZXJuYW1lXCIsIGl0ZW0udXNlcm5hbWUpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLnrKxcIiArIChpICsgMSkgKyBcIuihjO+8mueUqOaIt+WQjemHjeWkjVwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGl0ZW0ucGhvbmUpIHtcbiAgICAgICAgdGVzdE9iai5waG9uZSA9IGl0ZW0ucGhvbmU7XG4gICAgICAgIGlmICh0ZXN0RGF0YS5maWx0ZXJQcm9wZXJ0eShcInBob25lXCIsIGl0ZW0ucGhvbmUpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLnrKxcIiArIChpICsgMSkgKyBcIuihjO+8muaJi+acuuWPt+mHjeWkjVwiKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKGl0ZW0uZW1haWwpIHtcbiAgICAgICAgaWYgKCEvXihbQS1aMC05XFwuXFwtXFxfXFwrXSkqKFtBLVowLTlcXCtcXC1cXF9dKStcXEBbQS1aMC05XSsoW1xcLV1bQS1aMC05XSspKihbXFwuXVtBLVowLTlcXC1dKyl7MSw4fSQvaS50ZXN0KGl0ZW0uZW1haWwpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysXCIgKyAoaSArIDEpICsgXCLooYzvvJrpgq7ku7bmoLzlvI/plJnor69cIiArIGl0ZW0uZW1haWwpO1xuICAgICAgICB9XG4gICAgICAgIHRlc3RPYmouZW1haWwgPSBpdGVtLmVtYWlsO1xuICAgICAgICBpZiAodGVzdERhdGEuZmlsdGVyUHJvcGVydHkoXCJlbWFpbFwiLCBpdGVtLmVtYWlsKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysXCIgKyAoaSArIDEpICsgXCLooYzvvJrpgq7ku7bph43lpI1cIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGl0ZW0uc3BhY2UgPSBzcGFjZV9pZDtcbiAgICAgIHRlc3REYXRhLnB1c2godGVzdE9iaik7XG4gICAgICBzZWxlY3RvciA9IFtdO1xuICAgICAgb3BlcmF0aW5nID0gXCJcIjtcbiAgICAgIGlmIChpdGVtLnVzZXJuYW1lKSB7XG4gICAgICAgIHNlbGVjdG9yLnB1c2goe1xuICAgICAgICAgIHVzZXJuYW1lOiBpdGVtLnVzZXJuYW1lXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGl0ZW0uZW1haWwpIHtcbiAgICAgICAgc2VsZWN0b3IucHVzaCh7XG4gICAgICAgICAgZW1haWw6IGl0ZW0uZW1haWxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBpZiAoaXRlbS5waG9uZSkge1xuICAgICAgICBzZWxlY3Rvci5wdXNoKHtcbiAgICAgICAgICBtb2JpbGU6IGl0ZW0ucGhvbmVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICB1c2VyRXhpc3QgPSBkYi51c2Vycy5maW5kKHtcbiAgICAgICAgJG9yOiBzZWxlY3RvclxuICAgICAgfSk7XG4gICAgICBpZiAodXNlckV4aXN0LmNvdW50KCkgPiAxKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrFwiICsgKGkgKyAxKSArIFwi6KGM77ya55So5oi35ZCN44CB5omL5py65Y+344CB6YKu566x5L+h5oGv5pyJ6K+v77yM5peg5rOV5Yy56YWN5Yiw5ZCM5LiA6LSm5Y+3XCIpO1xuICAgICAgfSBlbHNlIGlmICh1c2VyRXhpc3QuY291bnQoKSA9PT0gMSkge1xuICAgICAgICB1c2VyID0gdXNlckV4aXN0LmZldGNoKClbMF0uX2lkO1xuICAgICAgICBzcGFjZVVzZXJFeGlzdCA9IGRiLnNwYWNlX3VzZXJzLmZpbmQoe1xuICAgICAgICAgIHNwYWNlOiBzcGFjZV9pZCxcbiAgICAgICAgICB1c2VyOiB1c2VyXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoc3BhY2VVc2VyRXhpc3QuY291bnQoKSA9PT0gMSkge1xuICAgICAgICAgIG9wZXJhdGluZyA9IFwidXBkYXRlXCI7XG4gICAgICAgIH0gZWxzZSBpZiAoc3BhY2VVc2VyRXhpc3QuY291bnQoKSA9PT0gMCkge1xuICAgICAgICAgIG9wZXJhdGluZyA9IFwiaW5zZXJ0XCI7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodXNlckV4aXN0LmNvdW50KCkgPT09IDApIHtcbiAgICAgICAgb3BlcmF0aW5nID0gXCJpbnNlcnRcIjtcbiAgICAgIH1cbiAgICAgIGlmIChpdGVtLnBhc3N3b3JkICYmIHVzZXJFeGlzdC5jb3VudCgpID09PSAxKSB7XG4gICAgICAgIGlmICgocmVmID0gdXNlckV4aXN0LmZldGNoKClbMF0uc2VydmljZXMpICE9IG51bGwgPyAocmVmMSA9IHJlZi5wYXNzd29yZCkgIT0gbnVsbCA/IHJlZjEuYmNyeXB0IDogdm9pZCAwIDogdm9pZCAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysXCIgKyAoaSArIDEpICsgXCLooYzvvJrnlKjmiLflt7Lorr7nva7lr4bnoIHvvIzkuI3lhYHorrjkv67mlLlcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG9yZ2FuaXphdGlvbiA9IGl0ZW0ub3JnYW5pemF0aW9uO1xuICAgICAgaWYgKCFvcmdhbml6YXRpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysXCIgKyAoaSArIDEpICsgXCLooYzvvJrpg6jpl6jkuI3og73kuLrnqbpcIik7XG4gICAgICB9XG4gICAgICBvcmdhbml6YXRpb25fZGVwdHMgPSBvcmdhbml6YXRpb24uc3BsaXQoXCIvXCIpO1xuICAgICAgaWYgKG9yZ2FuaXphdGlvbl9kZXB0cy5sZW5ndGggPCAxIHx8IG9yZ2FuaXphdGlvbl9kZXB0c1swXSAhPT0gcm9vdF9vcmcubmFtZSkge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLnrKxcIiArIChpICsgMSkgKyBcIuihjO+8muaXoOaViOeahOaguemDqOmXqFwiKTtcbiAgICAgIH1cbiAgICAgIGlmIChpdGVtLnBhc3N3b3JkICYmICh1c2VyICE9IG51bGwgPyAocmVmMiA9IHVzZXIuc2VydmljZXMpICE9IG51bGwgPyAocmVmMyA9IHJlZjIucGFzc3dvcmQpICE9IG51bGwgPyByZWYzLmJjcnlwdCA6IHZvaWQgMCA6IHZvaWQgMCA6IHZvaWQgMCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysXCIgKyAoaSArIDEpICsgXCLooYzvvJrnlKjmiLflt7Lorr7nva7lr4bnoIHvvIzkuI3lhYHorrjkv67mlLlcIik7XG4gICAgICB9XG4gICAgICBvcmdhbml6YXRpb25fZGVwdHMuZm9yRWFjaChmdW5jdGlvbihkZXB0X25hbWUsIGopIHtcbiAgICAgICAgaWYgKCFkZXB0X25hbWUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLnrKxcIiArIChpICsgMSkgKyBcIuihjO+8muaXoOaViOeahOmDqOmXqFwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBtdWx0aU9yZ3MgPSBvcmdhbml6YXRpb24uc3BsaXQoXCIsXCIpO1xuICAgICAgcmV0dXJuIG11bHRpT3Jncy5mb3JFYWNoKGZ1bmN0aW9uKG9yZ0Z1bGxuYW1lKSB7XG4gICAgICAgIHZhciBmdWxsbmFtZTtcbiAgICAgICAgb3JnYW5pemF0aW9uX2RlcHRzID0gb3JnRnVsbG5hbWUudHJpbSgpLnNwbGl0KFwiL1wiKTtcbiAgICAgICAgZnVsbG5hbWUgPSBcIlwiO1xuICAgICAgICByZXR1cm4gb3JnYW5pemF0aW9uX2RlcHRzLmZvckVhY2goZnVuY3Rpb24oZGVwdF9uYW1lLCBqKSB7XG4gICAgICAgICAgdmFyIG9yZ0NvdW50O1xuICAgICAgICAgIGlmIChqID4gMCkge1xuICAgICAgICAgICAgaWYgKGogPT09IDEpIHtcbiAgICAgICAgICAgICAgZnVsbG5hbWUgPSBkZXB0X25hbWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBmdWxsbmFtZSA9IGZ1bGxuYW1lICsgXCIvXCIgKyBkZXB0X25hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvcmdDb3VudCA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZCh7XG4gICAgICAgICAgICAgIHNwYWNlOiBzcGFjZV9pZCxcbiAgICAgICAgICAgICAgZnVsbG5hbWU6IGZ1bGxuYW1lXG4gICAgICAgICAgICB9KS5jb3VudCgpO1xuICAgICAgICAgICAgaWYgKG9yZ0NvdW50ID09PSAwKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrFwiICsgKGkgKyAxKSArIFwi6KGM77ya6YOo6ZeoKFwiICsgZGVwdF9uYW1lICsgXCIp5LiN5a2Y5Zyo77yM6K+35YWI5Yib5bu6XCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICBpZiAob25seUNoZWNrKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihpdGVtLCBpKSB7XG4gICAgICB2YXIgYmVsb25nT3JnaWRzLCBlLCBlcnJvciwgbXVsdGlPcmdzLCBub3csIG9wZXJhdGluZywgb3JnYW5pemF0aW9uLCBzZWxlY3Rvciwgc3BhY2VfdXNlciwgc3BhY2VfdXNlcl91cGRhdGVfZG9jLCBzdV9kb2MsIHVkb2MsIHVzZXIsIHVzZXJFeGlzdCwgdXNlckluZm8sIHVzZXJfaWQ7XG4gICAgICBlcnJvciA9IHt9O1xuICAgICAgdHJ5IHtcbiAgICAgICAgc2VsZWN0b3IgPSBbXTtcbiAgICAgICAgb3BlcmF0aW5nID0gXCJcIjtcbiAgICAgICAgaWYgKGl0ZW0uZW1haWwpIHtcbiAgICAgICAgICBzZWxlY3Rvci5wdXNoKHtcbiAgICAgICAgICAgIGVtYWlsOiBpdGVtLmVtYWlsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGl0ZW0ucGhvbmUpIHtcbiAgICAgICAgICBzZWxlY3Rvci5wdXNoKHtcbiAgICAgICAgICAgIG1vYmlsZTogaXRlbS5waG9uZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHVzZXJFeGlzdCA9IGRiLnVzZXJzLmZpbmQoe1xuICAgICAgICAgICRvcjogc2VsZWN0b3JcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICh1c2VyRXhpc3QuY291bnQoKSA+IDEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgXCLnlKjmiLflkI3jgIHmiYvmnLrlj7fjgIHpgq7nrrHkv6Hmga/mnInor6/vvIzml6Dms5XljLnphY3liLDlkIzkuIDotKblj7dcIik7XG4gICAgICAgIH0gZWxzZSBpZiAodXNlckV4aXN0LmNvdW50KCkgPT09IDEpIHtcbiAgICAgICAgICB1c2VyID0gdXNlckV4aXN0LmZldGNoKClbMF07XG4gICAgICAgIH1cbiAgICAgICAgbm93ID0gbmV3IERhdGUoKTtcbiAgICAgICAgb3JnYW5pemF0aW9uID0gaXRlbS5vcmdhbml6YXRpb247XG4gICAgICAgIG11bHRpT3JncyA9IG9yZ2FuaXphdGlvbi5zcGxpdChcIixcIik7XG4gICAgICAgIGJlbG9uZ09yZ2lkcyA9IFtdO1xuICAgICAgICBtdWx0aU9yZ3MuZm9yRWFjaChmdW5jdGlvbihvcmdGdWxsbmFtZSkge1xuICAgICAgICAgIHZhciBmdWxsbmFtZSwgb3JnLCBvcmdhbml6YXRpb25fZGVwdHM7XG4gICAgICAgICAgb3JnYW5pemF0aW9uX2RlcHRzID0gb3JnRnVsbG5hbWUudHJpbSgpLnNwbGl0KFwiL1wiKTtcbiAgICAgICAgICBmdWxsbmFtZSA9IFwiXCI7XG4gICAgICAgICAgb3JnYW5pemF0aW9uX2RlcHRzLmZvckVhY2goZnVuY3Rpb24oZGVwdF9uYW1lLCBqKSB7XG4gICAgICAgICAgICBpZiAoaiA+IDApIHtcbiAgICAgICAgICAgICAgaWYgKGogPT09IDEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVsbG5hbWUgPSBkZXB0X25hbWU7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bGxuYW1lID0gZnVsbG5hbWUgKyBcIi9cIiArIGRlcHRfbmFtZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZ1bGxuYW1lID0gZGVwdF9uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICAgIG9yZyA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZE9uZSh7XG4gICAgICAgICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICAgICAgICBmdWxsbmFtZTogZnVsbG5hbWVcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAob3JnKSB7XG4gICAgICAgICAgICByZXR1cm4gYmVsb25nT3JnaWRzLnB1c2gob3JnLl9pZCk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdXNlcl9pZCA9IG51bGw7XG4gICAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgICAgdXNlcl9pZCA9IHVzZXIuX2lkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHVkb2MgPSB7fTtcbiAgICAgICAgICB1ZG9jLl9pZCA9IGRiLnVzZXJzLl9tYWtlTmV3SUQoKTtcbiAgICAgICAgICB1ZG9jLnN0ZWVkb3NfaWQgPSBpdGVtLmVtYWlsIHx8IHVkb2MuX2lkO1xuICAgICAgICAgIHVkb2MubG9jYWxlID0gY3VycmVudFVzZXJMb2NhbGU7XG4gICAgICAgICAgdWRvYy5zcGFjZXNfaW52aXRlZCA9IFtzcGFjZV9pZF07XG4gICAgICAgICAgaWYgKGl0ZW0ubmFtZSkge1xuICAgICAgICAgICAgdWRvYy5uYW1lID0gaXRlbS5uYW1lO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXRlbS5lbWFpbCkge1xuICAgICAgICAgICAgdWRvYy5lbWFpbCA9IGl0ZW0uZW1haWw7XG4gICAgICAgICAgICB1ZG9jLmVtYWlsX3ZlcmlmaWVkID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpdGVtLnVzZXJuYW1lKSB7XG4gICAgICAgICAgICB1ZG9jLnVzZXJuYW1lID0gaXRlbS51c2VybmFtZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGl0ZW0ucGhvbmUpIHtcbiAgICAgICAgICAgIHVkb2MubW9iaWxlID0gaXRlbS5waG9uZTtcbiAgICAgICAgICAgIHVkb2MubW9iaWxlX3ZlcmlmaWVkID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIHVzZXJfaWQgPSBkYi51c2Vycy5pbnNlcnQodWRvYyk7XG4gICAgICAgICAgaWYgKGl0ZW0ucGFzc3dvcmQpIHtcbiAgICAgICAgICAgIEFjY291bnRzLnNldFBhc3N3b3JkKHVzZXJfaWQsIGl0ZW0ucGFzc3dvcmQsIHtcbiAgICAgICAgICAgICAgbG9nb3V0OiBmYWxzZVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHNwYWNlX3VzZXIgPSBkYi5zcGFjZV91c2Vycy5maW5kT25lKHtcbiAgICAgICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICAgICAgdXNlcjogdXNlcl9pZFxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHNwYWNlX3VzZXIpIHtcbiAgICAgICAgICBpZiAoYmVsb25nT3JnaWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmICghc3BhY2VfdXNlci5vcmdhbml6YXRpb25zKSB7XG4gICAgICAgICAgICAgIHNwYWNlX3VzZXIub3JnYW5pemF0aW9ucyA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3BhY2VfdXNlcl91cGRhdGVfZG9jID0ge307XG4gICAgICAgICAgICBzcGFjZV91c2VyX3VwZGF0ZV9kb2Mub3JnYW5pemF0aW9ucyA9IF8udW5pcShzcGFjZV91c2VyLm9yZ2FuaXphdGlvbnMuY29uY2F0KGJlbG9uZ09yZ2lkcykpO1xuICAgICAgICAgICAgaWYgKGl0ZW0uZW1haWwpIHtcbiAgICAgICAgICAgICAgc3BhY2VfdXNlcl91cGRhdGVfZG9jLmVtYWlsID0gaXRlbS5lbWFpbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtLm5hbWUpIHtcbiAgICAgICAgICAgICAgc3BhY2VfdXNlcl91cGRhdGVfZG9jLm5hbWUgPSBpdGVtLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbS5jb21wYW55KSB7XG4gICAgICAgICAgICAgIHNwYWNlX3VzZXJfdXBkYXRlX2RvYy5jb21wYW55ID0gaXRlbS5jb21wYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGl0ZW0ucG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgc3BhY2VfdXNlcl91cGRhdGVfZG9jLnBvc2l0aW9uID0gaXRlbS5wb3NpdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtLndvcmtfcGhvbmUpIHtcbiAgICAgICAgICAgICAgc3BhY2VfdXNlcl91cGRhdGVfZG9jLndvcmtfcGhvbmUgPSBpdGVtLndvcmtfcGhvbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbS5waG9uZSkge1xuICAgICAgICAgICAgICBzcGFjZV91c2VyX3VwZGF0ZV9kb2MubW9iaWxlID0gaXRlbS5waG9uZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtLnNvcnRfbm8pIHtcbiAgICAgICAgICAgICAgc3BhY2VfdXNlcl91cGRhdGVfZG9jLnNvcnRfbm8gPSBpdGVtLnNvcnRfbm87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoXy5rZXlzKHNwYWNlX3VzZXJfdXBkYXRlX2RvYykubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICBkYi5zcGFjZV91c2Vycy51cGRhdGUoe1xuICAgICAgICAgICAgICAgIHNwYWNlOiBzcGFjZV9pZCxcbiAgICAgICAgICAgICAgICB1c2VyOiB1c2VyX2lkXG4gICAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICAkc2V0OiBzcGFjZV91c2VyX3VwZGF0ZV9kb2NcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3BhY2VfdXNlci5pbnZpdGVfc3RhdGUgPT09IFwicmVmdXNlZFwiIHx8IHNwYWNlX3VzZXIuaW52aXRlX3N0YXRlID09PSBcInBlbmRpbmdcIikge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgXCLor6XnlKjmiLfov5jmnKrmjqXlj5fliqDlhaXlt6XkvZzljLrvvIzkuI3og73kv67mlLnku5bnmoTkuKrkurrkv6Hmga9cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoaXRlbS5wYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBBY2NvdW50cy5zZXRQYXNzd29yZCh1c2VyX2lkLCBpdGVtLnBhc3N3b3JkLCB7XG4gICAgICAgICAgICAgICAgICBsb2dvdXQ6IGZhbHNlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGJlbG9uZ09yZ2lkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzdV9kb2MgPSB7fTtcbiAgICAgICAgICAgIHN1X2RvYy5faWQgPSBkYi5zcGFjZV91c2Vycy5fbWFrZU5ld0lEKCk7XG4gICAgICAgICAgICBzdV9kb2Muc3BhY2UgPSBzcGFjZV9pZDtcbiAgICAgICAgICAgIHN1X2RvYy51c2VyX2FjY2VwdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHN1X2RvYy5pbnZpdGVfc3RhdGUgPSBcImFjY2VwdGVkXCI7XG4gICAgICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgICAgICBzdV9kb2MudXNlcl9hY2NlcHRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICBzdV9kb2MuaW52aXRlX3N0YXRlID0gXCJwZW5kaW5nXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdV9kb2MubmFtZSA9IGl0ZW0ubmFtZTtcbiAgICAgICAgICAgIGlmIChpdGVtLmVtYWlsKSB7XG4gICAgICAgICAgICAgIHN1X2RvYy5lbWFpbCA9IGl0ZW0uZW1haWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzdV9kb2Mub3JnYW5pemF0aW9uID0gYmVsb25nT3JnaWRzWzBdO1xuICAgICAgICAgICAgc3VfZG9jLm9yZ2FuaXphdGlvbnMgPSBiZWxvbmdPcmdpZHM7XG4gICAgICAgICAgICBpZiAoaXRlbS5wb3NpdGlvbikge1xuICAgICAgICAgICAgICBzdV9kb2MucG9zaXRpb24gPSBpdGVtLnBvc2l0aW9uO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGl0ZW0ud29ya19waG9uZSkge1xuICAgICAgICAgICAgICBzdV9kb2Mud29ya19waG9uZSA9IGl0ZW0ud29ya19waG9uZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtLnBob25lKSB7XG4gICAgICAgICAgICAgIHN1X2RvYy5tb2JpbGUgPSBpdGVtLnBob25lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGl0ZW0uc29ydF9ubykge1xuICAgICAgICAgICAgICBzdV9kb2Muc29ydF9ubyA9IGl0ZW0uc29ydF9ubztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtLmNvbXBhbnkpIHtcbiAgICAgICAgICAgICAgc3VfZG9jLmNvbXBhbnkgPSBpdGVtLmNvbXBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodXNlcl9pZCkge1xuICAgICAgICAgICAgICB1c2VySW5mbyA9IGRiLnVzZXJzLmZpbmRPbmUodXNlcl9pZCwge1xuICAgICAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICAgICAgdXNlcm5hbWU6IDFcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBpZiAodXNlckluZm8udXNlcm5hbWUpIHtcbiAgICAgICAgICAgICAgICBzdV9kb2MudXNlcm5hbWUgPSB1c2VySW5mby51c2VybmFtZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdV9kb2MudXNlciA9IHVzZXJfaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZGIuc3BhY2VfdXNlcnMuaW5zZXJ0KHN1X2RvYyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnJvcjEpIHtcbiAgICAgICAgZSA9IGVycm9yMTtcbiAgICAgICAgZXJyb3IubGluZSA9IGkgKyAxO1xuICAgICAgICBlcnJvci5tZXNzYWdlID0gZS5yZWFzb247XG4gICAgICAgIHJldHVybiBlcnJvckxpc3QucHVzaChlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGVycm9yTGlzdDtcbiAgfVxufSk7XG4iLCJNZXRlb3Iuc3RhcnR1cCAtPlxyXG5cdFdlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlIFwiL2FwaS9leHBvcnQvc3BhY2VfdXNlcnNcIiwgKHJlcSwgcmVzLCBuZXh0KS0+XHJcblx0XHR0cnlcclxuXHRcdFx0Y3VycmVudF91c2VyX2luZm8gPSB1dWZsb3dNYW5hZ2VyLmNoZWNrX2F1dGhvcml6YXRpb24ocmVxKVxyXG5cclxuXHRcdFx0cXVlcnkgPSByZXEucXVlcnlcclxuXHRcdFx0c3BhY2VfaWQgPSBxdWVyeS5zcGFjZV9pZFxyXG5cdFx0XHRvcmdfaWQgPSBxdWVyeS5vcmdfaWRcclxuXHRcdFx0dXNlcl9pZCA9IHF1ZXJ5WydYLVVzZXItSWQnXVxyXG5cdFx0XHRvcmcgPSBkYi5vcmdhbml6YXRpb25zLmZpbmRPbmUoe19pZDpvcmdfaWR9LHtmaWVsZHM6e2Z1bGxuYW1lOjF9fSlcclxuXHRcdFx0dXNlcnNfdG9feGxzID0gbmV3IEFycmF5XHJcblx0XHRcdG5vdyA9IG5ldyBEYXRlIFxyXG5cdFx0XHRpZiBTdGVlZG9zLmlzU3BhY2VBZG1pbihzcGFjZV9pZCx1c2VyX2lkKVxyXG5cdFx0XHRcdHVzZXJzX3RvX3hscyA9IGRiLnNwYWNlX3VzZXJzLmZpbmQoe1xyXG5cdFx0XHRcdFx0c3BhY2U6IHNwYWNlX2lkXHJcblx0XHRcdFx0fSwge1xyXG5cdFx0XHRcdFx0c29ydDoge25hbWU6IDF9XHJcblx0XHRcdFx0fSkuZmV0Y2goKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0b3JnX2lkcyA9IFtdXHJcblx0XHRcdFx0b3JnX29ianMgPSBkYi5vcmdhbml6YXRpb25zLmZpbmQoe19pZDpvcmdfaWQsc3BhY2U6c3BhY2VfaWR9LHtmaWVsZHM6e19pZDoxLGNoaWxkcmVuOjF9fSkuZmV0Y2goKVxyXG5cdFx0XHRcdG9yZ19pZHMgPSBfLnBsdWNrKG9yZ19vYmpzLCdfaWQnKVxyXG5cdFx0XHRcdF8uZWFjaCBvcmdfb2Jqcywob3JnX29iaiktPlxyXG5cdFx0XHRcdFx0b3JnX2lkcyA9IF8udW5pb24ob3JnX2lkcyxvcmdfb2JqPy5jaGlsZHJlbilcclxuXHRcdFx0XHRfLnVuaXEob3JnX2lkcylcclxuXHRcdFx0XHR1c2Vyc190b194bHMgPSBkYi5zcGFjZV91c2Vycy5maW5kKHtzcGFjZTpzcGFjZV9pZCxvcmdhbml6YXRpb25zOnskaW46b3JnX2lkc319LHtzb3J0OiB7c29ydF9ubzogLTEsbmFtZToxfX0pLmZldGNoKClcclxuXHRcdFx0ZWpzID0gcmVxdWlyZSgnZWpzJylcclxuXHRcdFx0c3RyID0gQXNzZXRzLmdldFRleHQoJ3NlcnZlci9lanMvZXhwb3J0X3NwYWNlX3VzZXJzLmVqcycpXHJcblx0XHRcdFxyXG5cdFx0XHQjIOajgOa1i+aYr+WQpuacieivreazlemUmeivr1xyXG5cdFx0XHRlanNMaW50ID0gcmVxdWlyZSgnZWpzLWxpbnQnKVxyXG5cdFx0XHRlcnJvcl9vYmogPSBlanNMaW50LmxpbnQoc3RyLCB7fSlcclxuXHRcdFx0aWYgZXJyb3Jfb2JqXHJcblx0XHRcdFx0Y29uc29sZS5lcnJvciBcIj09PS9hcGkvY29udGFjdHMvZXhwb3J0L3NwYWNlX3VzZXJzOlwiXHJcblx0XHRcdFx0Y29uc29sZS5lcnJvciBlcnJvcl9vYmpcclxuXHJcblx0XHRcdHRlbXBsYXRlID0gZWpzLmNvbXBpbGUoc3RyKVxyXG5cclxuXHRcdFx0bGFuZyA9ICdlbidcclxuXHRcdFx0aWYgY3VycmVudF91c2VyX2luZm8ubG9jYWxlIGlzICd6aC1jbidcclxuXHRcdFx0XHRsYW5nID0gJ3poLUNOJ1xyXG5cclxuXHRcdFx0b3JnTmFtZSA9IGlmIG9yZyB0aGVuIG9yZy5mdWxsbmFtZSBlbHNlIG9yZ19pZFxyXG5cdFx0XHRmaWVsZHMgPSBbe1xyXG5cdFx0XHRcdFx0dHlwZTogJ1N0cmluZycsXHJcblx0XHRcdFx0XHRuYW1lOiduYW1lJyxcclxuXHRcdFx0XHRcdHdpZHRoOiA2MCxcclxuXHRcdFx0XHRcdHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc19uYW1lJyx7fSxsYW5nKVxyXG5cdFx0XHRcdH0se1xyXG5cdFx0XHRcdFx0dHlwZTogJ1N0cmluZycsXHJcblx0XHRcdFx0XHRuYW1lOidtb2JpbGUnLFxyXG5cdFx0XHRcdFx0d2lkdGg6IDEwMCxcclxuXHRcdFx0XHRcdHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc19tb2JpbGUnLHt9LGxhbmcpXHJcblx0XHRcdFx0fSx7XHJcblx0XHRcdFx0XHR0eXBlOiAnU3RyaW5nJyxcclxuXHRcdFx0XHRcdG5hbWU6J3dvcmtfcGhvbmUnLFxyXG5cdFx0XHRcdFx0d2lkdGg6IDEwMCxcclxuXHRcdFx0XHRcdHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc193b3JrX3Bob25lJyx7fSxsYW5nKVxyXG5cdFx0XHRcdH0se1xyXG5cdFx0XHRcdFx0dHlwZTogJ1N0cmluZycsXHJcblx0XHRcdFx0XHRuYW1lOidlbWFpbCcsXHJcblx0XHRcdFx0XHR3aWR0aDogMTAwLFxyXG5cdFx0XHRcdFx0dGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX2VtYWlsJyx7fSxsYW5nKVxyXG5cdFx0XHRcdH0se1xyXG5cdFx0XHRcdFx0dHlwZTogJ1N0cmluZycsXHJcblx0XHRcdFx0XHRuYW1lOidjb21wYW55JyxcclxuXHRcdFx0XHRcdHdpZHRoOiAxMDAsXHJcblx0XHRcdFx0XHR0aXRsZTogVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfY29tcGFueScse30sbGFuZylcclxuXHRcdFx0XHR9LHtcclxuXHRcdFx0XHRcdHR5cGU6ICdTdHJpbmcnLFxyXG5cdFx0XHRcdFx0bmFtZToncG9zaXRpb24nLFxyXG5cdFx0XHRcdFx0d2lkdGg6IDEwMCxcclxuXHRcdFx0XHRcdHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc19wb3NpdGlvbicse30sbGFuZylcclxuXHRcdFx0XHR9LHtcclxuXHRcdFx0XHRcdHR5cGU6ICdTdHJpbmcnLFxyXG5cdFx0XHRcdFx0bmFtZTonb3JnYW5pemF0aW9ucycsXHJcblx0XHRcdFx0XHR3aWR0aDogNjAwLFxyXG5cdFx0XHRcdFx0dGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX29yZ2FuaXphdGlvbnMnLHt9LGxhbmcpLFxyXG5cdFx0XHRcdFx0dHJhbnNmb3JtOiAodmFsdWUpLT5cclxuXHRcdFx0XHRcdFx0b3JnTmFtZXMgPSBkYi5vcmdhbml6YXRpb25zLmZpbmQoe19pZDogeyRpbjogdmFsdWV9fSx7ZmllbGRzOiB7ZnVsbG5hbWU6IDF9fSkubWFwKChpdGVtLGluZGV4KS0+XHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIGl0ZW0uZnVsbG5hbWVcclxuXHRcdFx0XHRcdFx0KVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gb3JnTmFtZXMuam9pbihcIixcIilcclxuXHRcdFx0XHR9LHtcclxuXHRcdFx0XHRcdHR5cGU6ICdTdHJpbmcnLFxyXG5cdFx0XHRcdFx0bmFtZTonbWFuYWdlcicsXHJcblx0XHRcdFx0XHR3aWR0aDogNjAsXHJcblx0XHRcdFx0XHR0aXRsZTogVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfbWFuYWdlcicse30sbGFuZylcclxuXHRcdFx0XHRcdHRyYW5zZm9ybTogKHZhbHVlKS0+XHJcblx0XHRcdFx0XHRcdHVzZXIgPSBkYi51c2Vycy5maW5kT25lKHtfaWQ6IHZhbHVlfSx7ZmllbGRzOiB7bmFtZTogMX19KVxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gdXNlcj8ubmFtZVxyXG5cdFx0XHRcdH0se1xyXG5cdFx0XHRcdFx0dHlwZTogJ1N0cmluZycsXHJcblx0XHRcdFx0XHRuYW1lOid1c2VyJyxcclxuXHRcdFx0XHRcdHdpZHRoOiA2MCxcclxuXHRcdFx0XHRcdHRpdGxlOiBUQVBpMThuLl9fKCd1c2Vyc191c2VybmFtZScse30sbGFuZylcclxuXHRcdFx0XHRcdHRyYW5zZm9ybTogKHZhbHVlKS0+XHJcblx0XHRcdFx0XHRcdHVzZXIgPSBkYi51c2Vycy5maW5kT25lKHtfaWQ6IHZhbHVlfSx7ZmllbGRzOiB7dXNlcm5hbWU6IDF9fSlcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHVzZXI/LnVzZXJuYW1lXHJcblx0XHRcdFx0fSx7XHJcblx0XHRcdFx0XHR0eXBlOiAnTnVtYmVyJyxcclxuXHRcdFx0XHRcdG5hbWU6J3NvcnRfbm8nLFxyXG5cdFx0XHRcdFx0d2lkdGg6IDM1LFxyXG5cdFx0XHRcdFx0dGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX3NvcnRfbm8nLHt9LGxhbmcpXHJcblx0XHRcdFx0fSx7XHJcblx0XHRcdFx0XHR0eXBlOiAnU3RyaW5nJyxcclxuXHRcdFx0XHRcdG5hbWU6J3VzZXJfYWNjZXB0ZWQnLFxyXG5cdFx0XHRcdFx0d2lkdGg6IDM1LFxyXG5cdFx0XHRcdFx0dGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX3VzZXJfYWNjZXB0ZWQnLHt9LGxhbmcpXHJcblx0XHRcdFx0XHR0cmFuc2Zvcm06ICh2YWx1ZSktPlxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gaWYgdmFsdWUgdGhlbiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc191c2VyX2FjY2VwdGVkX3llcycse30sbGFuZykgZWxzZSBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc191c2VyX2FjY2VwdGVkX25vJyx7fSxsYW5nKVxyXG5cdFx0XHRcdH1dXHJcblx0XHRcdFxyXG5cdFx0XHRzaGVldF9uYW1lID0gb3JnTmFtZT8ucmVwbGFjZSgvXFwvL2csXCItXCIpICPkuI3mlK/mjIFcIi9cIuespuWPt1xyXG5cdFx0XHRyZXQgPSB0ZW1wbGF0ZSh7XHJcblx0XHRcdFx0bGFuZzogbGFuZyxcclxuXHRcdFx0XHRzaGVldF9uYW1lOiBzaGVldF9uYW1lLFxyXG5cdFx0XHRcdGZpZWxkczogZmllbGRzLFxyXG5cdFx0XHRcdHVzZXJzX3RvX3hsczogdXNlcnNfdG9feGxzXHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHRmaWxlTmFtZSA9IFwiU3RlZWRPU0NvbnRhY3RzX1wiICsgbW9tZW50KCkuZm9ybWF0KCdZWVlZTU1EREhIbW0nKSArIFwiLnhsc1wiXHJcblx0XHRcdHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIilcclxuXHRcdFx0cmVzLnNldEhlYWRlcihcIkNvbnRlbnQtRGlzcG9zaXRpb25cIiwgXCJhdHRhY2htZW50O2ZpbGVuYW1lPVwiK2VuY29kZVVSSShmaWxlTmFtZSkpXHJcblx0XHRcdHJlcy5lbmQocmV0KVxyXG5cdFx0Y2F0Y2ggZVxyXG5cdFx0XHRjb25zb2xlLmVycm9yIGUuc3RhY2tcclxuXHRcdFx0cmVzLmVuZChlLm1lc3NhZ2UpIiwiTWV0ZW9yLnN0YXJ0dXAoZnVuY3Rpb24oKSB7XG4gIHJldHVybiBXZWJBcHAuY29ubmVjdEhhbmRsZXJzLnVzZShcIi9hcGkvZXhwb3J0L3NwYWNlX3VzZXJzXCIsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gICAgdmFyIGN1cnJlbnRfdXNlcl9pbmZvLCBlLCBlanMsIGVqc0xpbnQsIGVycm9yX29iaiwgZmllbGRzLCBmaWxlTmFtZSwgbGFuZywgbm93LCBvcmcsIG9yZ05hbWUsIG9yZ19pZCwgb3JnX2lkcywgb3JnX29ianMsIHF1ZXJ5LCByZXQsIHNoZWV0X25hbWUsIHNwYWNlX2lkLCBzdHIsIHRlbXBsYXRlLCB1c2VyX2lkLCB1c2Vyc190b194bHM7XG4gICAgdHJ5IHtcbiAgICAgIGN1cnJlbnRfdXNlcl9pbmZvID0gdXVmbG93TWFuYWdlci5jaGVja19hdXRob3JpemF0aW9uKHJlcSk7XG4gICAgICBxdWVyeSA9IHJlcS5xdWVyeTtcbiAgICAgIHNwYWNlX2lkID0gcXVlcnkuc3BhY2VfaWQ7XG4gICAgICBvcmdfaWQgPSBxdWVyeS5vcmdfaWQ7XG4gICAgICB1c2VyX2lkID0gcXVlcnlbJ1gtVXNlci1JZCddO1xuICAgICAgb3JnID0gZGIub3JnYW5pemF0aW9ucy5maW5kT25lKHtcbiAgICAgICAgX2lkOiBvcmdfaWRcbiAgICAgIH0sIHtcbiAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgZnVsbG5hbWU6IDFcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICB1c2Vyc190b194bHMgPSBuZXcgQXJyYXk7XG4gICAgICBub3cgPSBuZXcgRGF0ZTtcbiAgICAgIGlmIChTdGVlZG9zLmlzU3BhY2VBZG1pbihzcGFjZV9pZCwgdXNlcl9pZCkpIHtcbiAgICAgICAgdXNlcnNfdG9feGxzID0gZGIuc3BhY2VfdXNlcnMuZmluZCh7XG4gICAgICAgICAgc3BhY2U6IHNwYWNlX2lkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICBzb3J0OiB7XG4gICAgICAgICAgICBuYW1lOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9KS5mZXRjaCgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb3JnX2lkcyA9IFtdO1xuICAgICAgICBvcmdfb2JqcyA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZCh7XG4gICAgICAgICAgX2lkOiBvcmdfaWQsXG4gICAgICAgICAgc3BhY2U6IHNwYWNlX2lkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgIF9pZDogMSxcbiAgICAgICAgICAgIGNoaWxkcmVuOiAxXG4gICAgICAgICAgfVxuICAgICAgICB9KS5mZXRjaCgpO1xuICAgICAgICBvcmdfaWRzID0gXy5wbHVjayhvcmdfb2JqcywgJ19pZCcpO1xuICAgICAgICBfLmVhY2gob3JnX29ianMsIGZ1bmN0aW9uKG9yZ19vYmopIHtcbiAgICAgICAgICByZXR1cm4gb3JnX2lkcyA9IF8udW5pb24ob3JnX2lkcywgb3JnX29iaiAhPSBudWxsID8gb3JnX29iai5jaGlsZHJlbiA6IHZvaWQgMCk7XG4gICAgICAgIH0pO1xuICAgICAgICBfLnVuaXEob3JnX2lkcyk7XG4gICAgICAgIHVzZXJzX3RvX3hscyA9IGRiLnNwYWNlX3VzZXJzLmZpbmQoe1xuICAgICAgICAgIHNwYWNlOiBzcGFjZV9pZCxcbiAgICAgICAgICBvcmdhbml6YXRpb25zOiB7XG4gICAgICAgICAgICAkaW46IG9yZ19pZHNcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHtcbiAgICAgICAgICBzb3J0OiB7XG4gICAgICAgICAgICBzb3J0X25vOiAtMSxcbiAgICAgICAgICAgIG5hbWU6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmZldGNoKCk7XG4gICAgICB9XG4gICAgICBlanMgPSByZXF1aXJlKCdlanMnKTtcbiAgICAgIHN0ciA9IEFzc2V0cy5nZXRUZXh0KCdzZXJ2ZXIvZWpzL2V4cG9ydF9zcGFjZV91c2Vycy5lanMnKTtcbiAgICAgIGVqc0xpbnQgPSByZXF1aXJlKCdlanMtbGludCcpO1xuICAgICAgZXJyb3Jfb2JqID0gZWpzTGludC5saW50KHN0ciwge30pO1xuICAgICAgaWYgKGVycm9yX29iaikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiPT09L2FwaS9jb250YWN0cy9leHBvcnQvc3BhY2VfdXNlcnM6XCIpO1xuICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yX29iaik7XG4gICAgICB9XG4gICAgICB0ZW1wbGF0ZSA9IGVqcy5jb21waWxlKHN0cik7XG4gICAgICBsYW5nID0gJ2VuJztcbiAgICAgIGlmIChjdXJyZW50X3VzZXJfaW5mby5sb2NhbGUgPT09ICd6aC1jbicpIHtcbiAgICAgICAgbGFuZyA9ICd6aC1DTic7XG4gICAgICB9XG4gICAgICBvcmdOYW1lID0gb3JnID8gb3JnLmZ1bGxuYW1lIDogb3JnX2lkO1xuICAgICAgZmllbGRzID0gW1xuICAgICAgICB7XG4gICAgICAgICAgdHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgbmFtZTogJ25hbWUnLFxuICAgICAgICAgIHdpZHRoOiA2MCxcbiAgICAgICAgICB0aXRsZTogVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfbmFtZScsIHt9LCBsYW5nKVxuICAgICAgICB9LCB7XG4gICAgICAgICAgdHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgbmFtZTogJ21vYmlsZScsXG4gICAgICAgICAgd2lkdGg6IDEwMCxcbiAgICAgICAgICB0aXRsZTogVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfbW9iaWxlJywge30sIGxhbmcpXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlOiAnU3RyaW5nJyxcbiAgICAgICAgICBuYW1lOiAnd29ya19waG9uZScsXG4gICAgICAgICAgd2lkdGg6IDEwMCxcbiAgICAgICAgICB0aXRsZTogVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfd29ya19waG9uZScsIHt9LCBsYW5nKVxuICAgICAgICB9LCB7XG4gICAgICAgICAgdHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgbmFtZTogJ2VtYWlsJyxcbiAgICAgICAgICB3aWR0aDogMTAwLFxuICAgICAgICAgIHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc19lbWFpbCcsIHt9LCBsYW5nKVxuICAgICAgICB9LCB7XG4gICAgICAgICAgdHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgbmFtZTogJ2NvbXBhbnknLFxuICAgICAgICAgIHdpZHRoOiAxMDAsXG4gICAgICAgICAgdGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX2NvbXBhbnknLCB7fSwgbGFuZylcbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6ICdTdHJpbmcnLFxuICAgICAgICAgIG5hbWU6ICdwb3NpdGlvbicsXG4gICAgICAgICAgd2lkdGg6IDEwMCxcbiAgICAgICAgICB0aXRsZTogVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfcG9zaXRpb24nLCB7fSwgbGFuZylcbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6ICdTdHJpbmcnLFxuICAgICAgICAgIG5hbWU6ICdvcmdhbml6YXRpb25zJyxcbiAgICAgICAgICB3aWR0aDogNjAwLFxuICAgICAgICAgIHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc19vcmdhbml6YXRpb25zJywge30sIGxhbmcpLFxuICAgICAgICAgIHRyYW5zZm9ybTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIHZhciBvcmdOYW1lcztcbiAgICAgICAgICAgIG9yZ05hbWVzID0gZGIub3JnYW5pemF0aW9ucy5maW5kKHtcbiAgICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICAgJGluOiB2YWx1ZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgICAgIGZ1bGxuYW1lOiAxXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pLm1hcChmdW5jdGlvbihpdGVtLCBpbmRleCkge1xuICAgICAgICAgICAgICByZXR1cm4gaXRlbS5mdWxsbmFtZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIG9yZ05hbWVzLmpvaW4oXCIsXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6ICdTdHJpbmcnLFxuICAgICAgICAgIG5hbWU6ICdtYW5hZ2VyJyxcbiAgICAgICAgICB3aWR0aDogNjAsXG4gICAgICAgICAgdGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX21hbmFnZXInLCB7fSwgbGFuZyksXG4gICAgICAgICAgdHJhbnNmb3JtOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHVzZXI7XG4gICAgICAgICAgICB1c2VyID0gZGIudXNlcnMuZmluZE9uZSh7XG4gICAgICAgICAgICAgIF9pZDogdmFsdWVcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogMVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB1c2VyICE9IG51bGwgPyB1c2VyLm5hbWUgOiB2b2lkIDA7XG4gICAgICAgICAgfVxuICAgICAgICB9LCB7XG4gICAgICAgICAgdHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgbmFtZTogJ3VzZXInLFxuICAgICAgICAgIHdpZHRoOiA2MCxcbiAgICAgICAgICB0aXRsZTogVEFQaTE4bi5fXygndXNlcnNfdXNlcm5hbWUnLCB7fSwgbGFuZyksXG4gICAgICAgICAgdHJhbnNmb3JtOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIHVzZXI7XG4gICAgICAgICAgICB1c2VyID0gZGIudXNlcnMuZmluZE9uZSh7XG4gICAgICAgICAgICAgIF9pZDogdmFsdWVcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgdXNlcm5hbWU6IDFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdXNlciAhPSBudWxsID8gdXNlci51c2VybmFtZSA6IHZvaWQgMDtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlOiAnTnVtYmVyJyxcbiAgICAgICAgICBuYW1lOiAnc29ydF9ubycsXG4gICAgICAgICAgd2lkdGg6IDM1LFxuICAgICAgICAgIHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc19zb3J0X25vJywge30sIGxhbmcpXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlOiAnU3RyaW5nJyxcbiAgICAgICAgICBuYW1lOiAndXNlcl9hY2NlcHRlZCcsXG4gICAgICAgICAgd2lkdGg6IDM1LFxuICAgICAgICAgIHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc191c2VyX2FjY2VwdGVkJywge30sIGxhbmcpLFxuICAgICAgICAgIHRyYW5zZm9ybTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICByZXR1cm4gVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfdXNlcl9hY2NlcHRlZF95ZXMnLCB7fSwgbGFuZyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfdXNlcl9hY2NlcHRlZF9ubycsIHt9LCBsYW5nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIF07XG4gICAgICBzaGVldF9uYW1lID0gb3JnTmFtZSAhPSBudWxsID8gb3JnTmFtZS5yZXBsYWNlKC9cXC8vZywgXCItXCIpIDogdm9pZCAwO1xuICAgICAgcmV0ID0gdGVtcGxhdGUoe1xuICAgICAgICBsYW5nOiBsYW5nLFxuICAgICAgICBzaGVldF9uYW1lOiBzaGVldF9uYW1lLFxuICAgICAgICBmaWVsZHM6IGZpZWxkcyxcbiAgICAgICAgdXNlcnNfdG9feGxzOiB1c2Vyc190b194bHNcbiAgICAgIH0pO1xuICAgICAgZmlsZU5hbWUgPSBcIlN0ZWVkT1NDb250YWN0c19cIiArIG1vbWVudCgpLmZvcm1hdCgnWVlZWU1NRERISG1tJykgKyBcIi54bHNcIjtcbiAgICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIik7XG4gICAgICByZXMuc2V0SGVhZGVyKFwiQ29udGVudC1EaXNwb3NpdGlvblwiLCBcImF0dGFjaG1lbnQ7ZmlsZW5hbWU9XCIgKyBlbmNvZGVVUkkoZmlsZU5hbWUpKTtcbiAgICAgIHJldHVybiByZXMuZW5kKHJldCk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGUgPSBlcnJvcjtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayk7XG4gICAgICByZXR1cm4gcmVzLmVuZChlLm1lc3NhZ2UpO1xuICAgIH1cbiAgfSk7XG59KTtcbiJdfQ==
