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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczp1c2Vycy1pbXBvcnQvY2hlY2tOcG0uanMiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfdXNlcnMtaW1wb3J0L3NlcnZlci9tZXRob2RzL2ltcG9ydF91c2Vycy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tZXRob2RzL2ltcG9ydF91c2Vycy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfdXNlcnMtaW1wb3J0L3JvdXRlcy9hcGlfc3BhY2VfdXNlcnNfZXhwb3J0LmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcm91dGVzL2FwaV9zcGFjZV91c2Vyc19leHBvcnQuY29mZmVlIl0sIm5hbWVzIjpbImNoZWNrTnBtVmVyc2lvbnMiLCJtb2R1bGUiLCJsaW5rIiwidiIsIk1ldGVvciIsIm1ldGhvZHMiLCJpbXBvcnRfdXNlcnMiLCJzcGFjZV9pZCIsInVzZXJfcGsiLCJkYXRhIiwib25seUNoZWNrIiwiX3NlbGYiLCJhY2NlcHRlZF91c2VyX2NvdW50IiwiY3VycmVudFVzZXIiLCJjdXJyZW50VXNlckxvY2FsZSIsImVycm9yTGlzdCIsIm93bmVyX2lkIiwicm9vdF9vcmciLCJzcGFjZSIsInRlc3REYXRhIiwidXNlcklkIiwiRXJyb3IiLCJkYiIsIm9yZ2FuaXphdGlvbnMiLCJmaW5kT25lIiwicGFyZW50Iiwic3BhY2VzIiwiYWRtaW5zIiwiaW5jbHVkZXMiLCJpc19wYWlkIiwic3BhY2VfdXNlcnMiLCJmaW5kIiwiX2lkIiwidXNlcl9hY2NlcHRlZCIsImNvdW50IiwibGVuZ3RoIiwidXNlcl9saW1pdCIsIm93bmVyIiwidXNlcnMiLCJmaWVsZHMiLCJsb2NhbGUiLCJwaG9uZSIsImZvckVhY2giLCJpdGVtIiwiaSIsIm11bHRpT3JncyIsIm9wZXJhdGluZyIsIm9yZ2FuaXphdGlvbiIsIm9yZ2FuaXphdGlvbl9kZXB0cyIsInJlZiIsInJlZjEiLCJyZWYyIiwicmVmMyIsInNlbGVjdG9yIiwic3BhY2VVc2VyRXhpc3QiLCJ0ZXN0T2JqIiwidXNlciIsInVzZXJFeGlzdCIsImVtYWlsIiwidXNlcm5hbWUiLCJmaWx0ZXJQcm9wZXJ0eSIsInRlc3QiLCJwdXNoIiwibW9iaWxlIiwiJG9yIiwiZmV0Y2giLCJwYXNzd29yZCIsInNlcnZpY2VzIiwiYmNyeXB0Iiwic3BsaXQiLCJuYW1lIiwiZGVwdF9uYW1lIiwiaiIsIm9yZ0Z1bGxuYW1lIiwiZnVsbG5hbWUiLCJ0cmltIiwib3JnQ291bnQiLCJiZWxvbmdPcmdpZHMiLCJlIiwiZXJyb3IiLCJub3ciLCJzcGFjZV91c2VyIiwic3BhY2VfdXNlcl91cGRhdGVfZG9jIiwic3VfZG9jIiwidWRvYyIsInVzZXJJbmZvIiwidXNlcl9pZCIsIkRhdGUiLCJvcmciLCJfbWFrZU5ld0lEIiwic3RlZWRvc19pZCIsInNwYWNlc19pbnZpdGVkIiwiZW1haWxfdmVyaWZpZWQiLCJtb2JpbGVfdmVyaWZpZWQiLCJpbnNlcnQiLCJBY2NvdW50cyIsInNldFBhc3N3b3JkIiwibG9nb3V0IiwiXyIsInVuaXEiLCJjb25jYXQiLCJjb21wYW55IiwicG9zaXRpb24iLCJ3b3JrX3Bob25lIiwic29ydF9ubyIsImtleXMiLCJ1cGRhdGUiLCIkc2V0IiwiaW52aXRlX3N0YXRlIiwiZXJyb3IxIiwibGluZSIsIm1lc3NhZ2UiLCJyZWFzb24iLCJzdGFydHVwIiwiV2ViQXBwIiwiY29ubmVjdEhhbmRsZXJzIiwidXNlIiwicmVxIiwicmVzIiwibmV4dCIsImN1cnJlbnRfdXNlcl9pbmZvIiwiZWpzIiwiZWpzTGludCIsImVycm9yX29iaiIsImZpbGVOYW1lIiwibGFuZyIsIm9yZ05hbWUiLCJvcmdfaWQiLCJvcmdfaWRzIiwib3JnX29ianMiLCJxdWVyeSIsInJldCIsInNoZWV0X25hbWUiLCJzdHIiLCJ0ZW1wbGF0ZSIsInVzZXJzX3RvX3hscyIsInV1Zmxvd01hbmFnZXIiLCJjaGVja19hdXRob3JpemF0aW9uIiwiQXJyYXkiLCJTdGVlZG9zIiwiaXNTcGFjZUFkbWluIiwic29ydCIsImNoaWxkcmVuIiwicGx1Y2siLCJlYWNoIiwib3JnX29iaiIsInVuaW9uIiwiJGluIiwicmVxdWlyZSIsIkFzc2V0cyIsImdldFRleHQiLCJsaW50IiwiY29uc29sZSIsImNvbXBpbGUiLCJ0eXBlIiwid2lkdGgiLCJ0aXRsZSIsIlRBUGkxOG4iLCJfXyIsInRyYW5zZm9ybSIsInZhbHVlIiwib3JnTmFtZXMiLCJtYXAiLCJpbmRleCIsImpvaW4iLCJyZXBsYWNlIiwibW9tZW50IiwiZm9ybWF0Iiwic2V0SGVhZGVyIiwiZW5jb2RlVVJJIiwiZW5kIiwic3RhY2siXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLElBQUlBLGdCQUFKO0FBQXFCQyxNQUFNLENBQUNDLElBQVAsQ0FBWSxvQ0FBWixFQUFpRDtBQUFDRixrQkFBZ0IsQ0FBQ0csQ0FBRCxFQUFHO0FBQUNILG9CQUFnQixHQUFDRyxDQUFqQjtBQUFtQjs7QUFBeEMsQ0FBakQsRUFBMkYsQ0FBM0Y7QUFDckJILGdCQUFnQixDQUFDO0FBQ2hCLFNBQU8sUUFEUztBQUVoQixjQUFZO0FBRkksQ0FBRCxFQUdiLHNCQUhhLENBQWhCLEM7Ozs7Ozs7Ozs7OztBQ0RBSSxPQUFPQyxPQUFQLENBQ0M7QUFBQTs7Ozs7O0tBT0FDLGNBQWMsVUFBQ0MsUUFBRCxFQUFXQyxPQUFYLEVBQW9CQyxJQUFwQixFQUEwQkMsU0FBMUI7QUFFYixRQUFBQyxLQUFBLEVBQUFDLG1CQUFBLEVBQUFDLFdBQUEsRUFBQUMsaUJBQUEsRUFBQUMsU0FBQSxFQUFBQyxRQUFBLEVBQUFDLFFBQUEsRUFBQUMsS0FBQSxFQUFBQyxRQUFBOztBQUFBUixZQUFRLElBQVI7O0FBRUEsUUFBRyxDQUFDLEtBQUtTLE1BQVQ7QUFDQyxZQUFNLElBQUloQixPQUFPaUIsS0FBWCxDQUFpQixHQUFqQixFQUFzQixNQUF0QixDQUFOO0FDQ0U7O0FEQ0hK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cnMtaW1wb3J0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY2hlY2tOcG1WZXJzaW9ucyB9IGZyb20gJ21ldGVvci90bWVhc2RheTpjaGVjay1ucG0tdmVyc2lvbnMnO1xuY2hlY2tOcG1WZXJzaW9ucyh7XG5cdFwiZWpzXCI6IFwiXjIuNS41XCIsXG5cdFwiZWpzLWxpbnRcIjogXCJeMC4yLjBcIlxufSwgJ3N0ZWVkb3M6dXNlcnMtaW1wb3J0Jyk7XG4iLCJNZXRlb3IubWV0aG9kc1xuXHQjIyNcblx0XHQx44CB5qCh6aqM55So5oi35piv5ZCm5a2Y5ZyoXG5cdFx0MuOAgeagoemqjOW3peS9nOWMuueUqOaIt+aYr+WQpuWtmOWcqFxuXHRcdDPjgIHmoKHpqozpg6jpl6jmmK/lkKblrZjlnKhcblx0XHQ044CB5qCh6aqM6YOo6Zeo55So5oi35piv5ZCm5a2Y5ZyoXG5cdFx0VE9ETzog5Zu96ZmF5YyWXG5cdCMjI1xuXHRpbXBvcnRfdXNlcnM6IChzcGFjZV9pZCwgdXNlcl9waywgZGF0YSwgb25seUNoZWNrKS0+XG5cblx0XHRfc2VsZiA9IHRoaXNcblxuXHRcdGlmICF0aGlzLnVzZXJJZFxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIFwi6K+35YWI55m75b2VXCIpXG5cblx0XHRyb290X29yZyA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZE9uZSh7c3BhY2U6IHNwYWNlX2lkLCBwYXJlbnQ6IG51bGx9KVxuXG5cdFx0c3BhY2UgPSBkYi5zcGFjZXMuZmluZE9uZShzcGFjZV9pZClcblx0XHRpZiAhc3BhY2UgfHwgIXNwYWNlPy5hZG1pbnMuaW5jbHVkZXModGhpcy51c2VySWQpXG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMSwgXCLlj6rmnInlt6XkvZzljLrnrqHnkIblkZjlj6/ku6Xlr7zlhaXnlKjmiLdcIik7XG5cblx0XHRpZiAhc3BhY2UuaXNfcGFpZFxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIFwi5Z+656GA54mI5LiN5pSv5oyB5q2k5Yqf6IO9XCIpO1xuXG5cdFx0YWNjZXB0ZWRfdXNlcl9jb3VudCA9IGRiLnNwYWNlX3VzZXJzLmZpbmQoe3NwYWNlOiBzcGFjZS5faWQsIHVzZXJfYWNjZXB0ZWQ6IHRydWV9KS5jb3VudCgpXG5cdFx0aWYgKGFjY2VwdGVkX3VzZXJfY291bnQgKyBkYXRhLmxlbmd0aCkgPiBzcGFjZS51c2VyX2xpbWl0XG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDQwMCwgXCLpnIDopoHmj5DljYflt7LotK3kubDnlKjmiLfmlbDoh7Mje2FjY2VwdGVkX3VzZXJfY291bnQgKyBkYXRhLmxlbmd0aH0o5b2T5YmNI3tzcGFjZS51c2VyX2xpbWl0fSlcIiArXCIsIOivt+WcqOS8geS4muS/oeaBr+aooeWdl+S4reeCueWHu+WNh+e6p+aMiemSrui0reS5sFwiKVxuXG5cdFx0b3duZXJfaWQgPSBzcGFjZS5vd25lclxuXG5cdFx0dGVzdERhdGEgPSBbXVxuXG5cdFx0ZXJyb3JMaXN0ID0gW11cblxuXHRcdGN1cnJlbnRVc2VyID0gZGIudXNlcnMuZmluZE9uZSh7X2lkOiBfc2VsZi51c2VySWR9LHtmaWVsZHM6e2xvY2FsZToxLHBob25lOjF9fSlcblx0XHRjdXJyZW50VXNlckxvY2FsZSA9IGN1cnJlbnRVc2VyLmxvY2FsZVxuXG5cdFx0IyDmlbDmja7nu5/kuIDmoKHpqoxcblxuXHRcdGRhdGEuZm9yRWFjaCAoaXRlbSwgaSktPlxuXHRcdFx0IyBjb25zb2xlLmxvZyBpdGVtXG5cdFx0XHQjIOeUqOaIt+WQje+8jOaJi+acuuWPt++8jOmCrueuseS4jeiDvemDveS4uuepulxuXHRcdFx0aWYgIWl0ZW0ucGhvbmUgYW5kICFpdGVtLmVtYWlsXG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrCN7aSArIDF96KGMOiDmiYvmnLrlj7fvvIzpgq7nrrHkuI3og73pg73kuLrnqbpcIilcblxuXHRcdFx0IyDliKTmlq1leGNlbOS4reeahOaVsOaNru+8jOeUqOaIt+WQjeOAgeaJi+acuuWPt+etieS/oeaBr+aYr+WQpuacieivr1xuXHRcdFx0dGVzdE9iaiA9IHt9XG5cdFx0XHRpZiBpdGVtLnVzZXJuYW1lXG5cdFx0XHRcdHRlc3RPYmoudXNlcm5hbWUgPSBpdGVtLnVzZXJuYW1lXG5cdFx0XHRcdGlmIHRlc3REYXRhLmZpbHRlclByb3BlcnR5KFwidXNlcm5hbWVcIiwgaXRlbS51c2VybmFtZSkubGVuZ3RoID4gMFxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrCN7aSArIDF96KGM77ya55So5oi35ZCN6YeN5aSNXCIpO1xuXG5cdFx0XHRpZiBpdGVtLnBob25lXG5cdFx0XHRcdHRlc3RPYmoucGhvbmUgPSBpdGVtLnBob25lXG5cdFx0XHRcdGlmIHRlc3REYXRhLmZpbHRlclByb3BlcnR5KFwicGhvbmVcIiwgaXRlbS5waG9uZSkubGVuZ3RoID4gMFxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrCN7aSArIDF96KGM77ya5omL5py65Y+36YeN5aSNXCIpO1xuXG5cdFx0XHRpZiBpdGVtLmVtYWlsXG5cdFx0XHRcdGlmIG5vdCAvXihbQS1aMC05XFwuXFwtXFxfXFwrXSkqKFtBLVowLTlcXCtcXC1cXF9dKStcXEBbQS1aMC05XSsoW1xcLV1bQS1aMC05XSspKihbXFwuXVtBLVowLTlcXC1dKyl7MSw4fSQvaS50ZXN0KGl0ZW0uZW1haWwpXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysI3tpICsgMX3ooYzvvJrpgq7ku7bmoLzlvI/plJnor68je2l0ZW0uZW1haWx9XCIpO1xuXG5cdFx0XHRcdHRlc3RPYmouZW1haWwgPSBpdGVtLmVtYWlsXG5cdFx0XHRcdGlmIHRlc3REYXRhLmZpbHRlclByb3BlcnR5KFwiZW1haWxcIiwgaXRlbS5lbWFpbCkubGVuZ3RoID4gMFxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrCN7aSArIDF96KGM77ya6YKu5Lu26YeN5aSNXCIpO1xuXG5cdFx0XHRpdGVtLnNwYWNlID0gc3BhY2VfaWRcblxuXHRcdFx0dGVzdERhdGEucHVzaCh0ZXN0T2JqKVxuXG5cdFx0XHQjIOiOt+WPluafpeaJvnVzZXLnmoTmnaHku7Zcblx0XHRcdHNlbGVjdG9yID0gW11cblx0XHRcdG9wZXJhdGluZyA9IFwiXCJcblx0XHRcdGlmIGl0ZW0udXNlcm5hbWVcblx0XHRcdFx0c2VsZWN0b3IucHVzaCB7dXNlcm5hbWU6IGl0ZW0udXNlcm5hbWV9XG5cdFx0XHRpZiBpdGVtLmVtYWlsXG5cdFx0XHRcdHNlbGVjdG9yLnB1c2gge2VtYWlsOiBpdGVtLmVtYWlsfVxuXHRcdFx0aWYgaXRlbS5waG9uZVxuXHRcdFx0XHRzZWxlY3Rvci5wdXNoIHttb2JpbGU6IGl0ZW0ucGhvbmV9XG5cblx0XHRcdHVzZXJFeGlzdCA9IGRiLnVzZXJzLmZpbmQoeyRvcjogc2VsZWN0b3J9KVxuXG5cblx0XHRcdCMg5YWI5Yik5pat5piv5ZCm6IO95Yy56YWN5Yiw5ZSv5LiA55qEdXNlcu+8jOeEtuWQjuWIpOaWreivpeeUqOaIt+aYr2luc2VydOWIsHNwYWNlX3VzZXJz6L+Y5pivdXBkYXRlXG5cdFx0XHRpZiB1c2VyRXhpc3QuY291bnQoKSA+IDFcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysI3tpICsgMX3ooYzvvJrnlKjmiLflkI3jgIHmiYvmnLrlj7fjgIHpgq7nrrHkv6Hmga/mnInor6/vvIzml6Dms5XljLnphY3liLDlkIzkuIDotKblj7dcIilcblx0XHRcdGVsc2UgaWYgdXNlckV4aXN0LmNvdW50KCkgPT0gMVxuXHRcdFx0XHR1c2VyID0gdXNlckV4aXN0LmZldGNoKClbMF0uX2lkXG5cdFx0XHRcdHNwYWNlVXNlckV4aXN0ID0gZGIuc3BhY2VfdXNlcnMuZmluZCh7c3BhY2U6IHNwYWNlX2lkLCB1c2VyOiB1c2VyfSlcblx0XHRcdFx0aWYgc3BhY2VVc2VyRXhpc3QuY291bnQoKSA9PSAxXG5cdFx0XHRcdFx0b3BlcmF0aW5nID0gXCJ1cGRhdGVcIlxuXHRcdFx0XHRlbHNlIGlmIHNwYWNlVXNlckV4aXN0LmNvdW50KCkgPT0gMFxuXHRcdFx0XHRcdG9wZXJhdGluZyA9IFwiaW5zZXJ0XCJcblx0XHRcdGVsc2UgaWYgdXNlckV4aXN0LmNvdW50KCkgPT0gMFxuXHRcdFx0XHQjIOaWsOWinnNwYWNlX3VzZXJz55qE5pWw5o2u5qCh6aqMXG5cdFx0XHRcdG9wZXJhdGluZyA9IFwiaW5zZXJ0XCJcblxuXHRcdFx0IyDliKTmlq3mmK/lkKbog73kv67mlLnnlKjmiLfnmoTlr4bnoIFcblx0XHRcdGlmIGl0ZW0ucGFzc3dvcmQgYW5kIHVzZXJFeGlzdC5jb3VudCgpID09IDFcblx0XHRcdFx0aWYgdXNlckV4aXN0LmZldGNoKClbMF0uc2VydmljZXM/LnBhc3N3b3JkPy5iY3J5cHRcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLnrKwje2kgKyAxfeihjO+8mueUqOaIt+W3suiuvue9ruWvhuegge+8jOS4jeWFgeiuuOS/ruaUuVwiKTtcblxuXHRcdFx0IyDliKTmlq3pg6jpl6jmmK/lkKblkIjnkIZcblx0XHRcdG9yZ2FuaXphdGlvbiA9IGl0ZW0ub3JnYW5pemF0aW9uXG5cblx0XHRcdGlmICFvcmdhbml6YXRpb25cblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysI3tpICsgMX3ooYzvvJrpg6jpl6jkuI3og73kuLrnqbpcIik7XG5cblx0XHRcdG9yZ2FuaXphdGlvbl9kZXB0cyA9IG9yZ2FuaXphdGlvbi5zcGxpdChcIi9cIik7XG5cblx0XHRcdGlmIG9yZ2FuaXphdGlvbl9kZXB0cy5sZW5ndGggPCAxIHx8IG9yZ2FuaXphdGlvbl9kZXB0c1swXSAhPSByb290X29yZy5uYW1lXG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrCN7aSArIDF96KGM77ya5peg5pWI55qE5qC56YOo6ZeoXCIpO1xuXG5cdFx0XHRpZiBpdGVtLnBhc3N3b3JkICYmIHVzZXI/LnNlcnZpY2VzPy5wYXNzd29yZD8uYmNyeXB0XG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrCN7aSArIDF96KGM77ya55So5oi35bey6K6+572u5a+G56CB77yM5LiN5YWB6K645L+u5pS5XCIpO1xuXG5cdFx0XHRvcmdhbml6YXRpb25fZGVwdHMuZm9yRWFjaCAoZGVwdF9uYW1lLCBqKSAtPlxuXHRcdFx0XHRpZiAhZGVwdF9uYW1lXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysI3tpICsgMX3ooYzvvJrml6DmlYjnmoTpg6jpl6hcIik7XG5cblx0XHRcdG11bHRpT3JncyA9IG9yZ2FuaXphdGlvbi5zcGxpdChcIixcIilcblx0XHRcdG11bHRpT3Jncy5mb3JFYWNoIChvcmdGdWxsbmFtZSkgLT5cblx0XHRcdFx0b3JnYW5pemF0aW9uX2RlcHRzID0gb3JnRnVsbG5hbWUudHJpbSgpLnNwbGl0KFwiL1wiKVxuXHRcdFx0XHRmdWxsbmFtZSA9IFwiXCJcblx0XHRcdFx0b3JnYW5pemF0aW9uX2RlcHRzLmZvckVhY2ggKGRlcHRfbmFtZSwgaikgLT5cblx0XHRcdFx0XHRpZiBqID4gMFxuXHRcdFx0XHRcdFx0aWYgaiA9PSAxXG5cdFx0XHRcdFx0XHRcdGZ1bGxuYW1lID0gZGVwdF9uYW1lXG5cdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdGZ1bGxuYW1lID0gZnVsbG5hbWUgKyBcIi9cIiArIGRlcHRfbmFtZVxuXG5cdFx0XHRcdFx0XHRvcmdDb3VudCA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZCh7c3BhY2U6IHNwYWNlX2lkLCBmdWxsbmFtZTogZnVsbG5hbWV9KS5jb3VudCgpXG5cblx0XHRcdFx0XHRcdGlmIG9yZ0NvdW50ID09IDBcblx0XHRcdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysI3tpICsgMX3ooYzvvJrpg6jpl6goI3tkZXB0X25hbWV9KeS4jeWtmOWcqO+8jOivt+WFiOWIm+W7ulwiKTtcblxuXHRcdGlmIG9ubHlDaGVja1xuXHRcdFx0cmV0dXJuIDtcblxuXHRcdCMg5pWw5o2u5a+85YWlXG5cdFx0ZGF0YS5mb3JFYWNoIChpdGVtLCBpKS0+XG5cdFx0XHRlcnJvciA9IHt9XG5cdFx0XHR0cnlcblx0XHRcdFx0c2VsZWN0b3IgPSBbXVxuXHRcdFx0XHRvcGVyYXRpbmcgPSBcIlwiXG5cdFx0XHRcdCMgaWYgaXRlbS51c2VybmFtZVxuXHRcdFx0XHQjIFx0c2VsZWN0b3IucHVzaCB7dXNlcm5hbWU6IGl0ZW0udXNlcm5hbWV9XG5cdFx0XHRcdGlmIGl0ZW0uZW1haWxcblx0XHRcdFx0XHRzZWxlY3Rvci5wdXNoIHtlbWFpbDogaXRlbS5lbWFpbH1cblx0XHRcdFx0aWYgaXRlbS5waG9uZVxuXHRcdFx0XHRcdHNlbGVjdG9yLnB1c2gge21vYmlsZTogaXRlbS5waG9uZX1cblx0XHRcdFx0dXNlckV4aXN0ID0gZGIudXNlcnMuZmluZCh7JG9yOiBzZWxlY3Rvcn0pXG5cdFx0XHRcdGlmIHVzZXJFeGlzdC5jb3VudCgpID4gMVxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCBcIueUqOaIt+WQjeOAgeaJi+acuuWPt+OAgemCrueuseS/oeaBr+acieivr++8jOaXoOazleWMuemFjeWIsOWQjOS4gOi0puWPt1wiKVxuXHRcdFx0XHRlbHNlIGlmIHVzZXJFeGlzdC5jb3VudCgpID09IDFcblx0XHRcdFx0XHR1c2VyID0gdXNlckV4aXN0LmZldGNoKClbMF1cblxuXHRcdFx0XHRub3cgPSBuZXcgRGF0ZSgpXG5cblx0XHRcdFx0b3JnYW5pemF0aW9uID0gaXRlbS5vcmdhbml6YXRpb25cblx0XHRcdFx0bXVsdGlPcmdzID0gb3JnYW5pemF0aW9uLnNwbGl0KFwiLFwiKVxuXHRcdFx0XHRiZWxvbmdPcmdpZHMgPSBbXVxuXHRcdFx0XHRtdWx0aU9yZ3MuZm9yRWFjaCAob3JnRnVsbG5hbWUpIC0+XG5cdFx0XHRcdFx0b3JnYW5pemF0aW9uX2RlcHRzID0gb3JnRnVsbG5hbWUudHJpbSgpLnNwbGl0KFwiL1wiKVxuXHRcdFx0XHRcdGZ1bGxuYW1lID0gXCJcIlxuXHRcdFx0XHRcdG9yZ2FuaXphdGlvbl9kZXB0cy5mb3JFYWNoIChkZXB0X25hbWUsIGopIC0+XG5cdFx0XHRcdFx0XHRpZiBqID4gMFxuXHRcdFx0XHRcdFx0XHRpZiBqID09IDFcblx0XHRcdFx0XHRcdFx0XHRmdWxsbmFtZSA9IGRlcHRfbmFtZVxuXHRcdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdFx0ZnVsbG5hbWUgPSBmdWxsbmFtZSArIFwiL1wiICsgZGVwdF9uYW1lXG5cdFx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHRcdGZ1bGxuYW1lID0gZGVwdF9uYW1lXG5cblx0XHRcdFx0XHRvcmcgPSBkYi5vcmdhbml6YXRpb25zLmZpbmRPbmUoe3NwYWNlOiBzcGFjZV9pZCwgZnVsbG5hbWU6IGZ1bGxuYW1lfSlcblxuXHRcdFx0XHRcdGlmIG9yZ1xuXHRcdFx0XHRcdFx0YmVsb25nT3JnaWRzLnB1c2ggb3JnLl9pZFxuXG5cblx0XHRcdFx0dXNlcl9pZCA9IG51bGxcblx0XHRcdFx0aWYgdXNlclxuXHRcdFx0XHRcdHVzZXJfaWQgPSB1c2VyLl9pZFxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0dWRvYyA9IHt9XG5cdFx0XHRcdFx0dWRvYy5faWQgPSBkYi51c2Vycy5fbWFrZU5ld0lEKClcblx0XHRcdFx0XHR1ZG9jLnN0ZWVkb3NfaWQgPSBpdGVtLmVtYWlsIHx8IHVkb2MuX2lkXG5cdFx0XHRcdFx0dWRvYy5sb2NhbGUgPSBjdXJyZW50VXNlckxvY2FsZVxuXHRcdFx0XHRcdHVkb2Muc3BhY2VzX2ludml0ZWQgPSBbc3BhY2VfaWRdXG5cdFx0XHRcdFx0aWYgaXRlbS5uYW1lXG5cdFx0XHRcdFx0XHR1ZG9jLm5hbWUgPSBpdGVtLm5hbWVcblxuXHRcdFx0XHRcdGlmIGl0ZW0uZW1haWxcblx0XHRcdFx0XHRcdHVkb2MuZW1haWwgPSBpdGVtLmVtYWlsXG5cdFx0XHRcdFx0XHR1ZG9jLmVtYWlsX3ZlcmlmaWVkID0gZmFsc2VcblxuXHRcdFx0XHRcdGlmIGl0ZW0udXNlcm5hbWVcblx0XHRcdFx0XHRcdHVkb2MudXNlcm5hbWUgPSBpdGVtLnVzZXJuYW1lXG5cblx0XHRcdFx0XHRpZiBpdGVtLnBob25lXG5cdFx0XHRcdFx0XHR1ZG9jLm1vYmlsZSA9IGl0ZW0ucGhvbmVcblx0XHRcdFx0XHRcdHVkb2MubW9iaWxlX3ZlcmlmaWVkID0gZmFsc2Vcblx0XHRcdFx0XHR1c2VyX2lkID0gZGIudXNlcnMuaW5zZXJ0KHVkb2MpXG5cblx0XHRcdFx0XHRpZiBpdGVtLnBhc3N3b3JkXG5cdFx0XHRcdFx0XHRBY2NvdW50cy5zZXRQYXNzd29yZCh1c2VyX2lkLCBpdGVtLnBhc3N3b3JkLCB7bG9nb3V0OiBmYWxzZX0pXG5cblx0XHRcdFx0c3BhY2VfdXNlciA9IGRiLnNwYWNlX3VzZXJzLmZpbmRPbmUoe3NwYWNlOiBzcGFjZV9pZCwgdXNlcjogdXNlcl9pZH0pXG5cblx0XHRcdFx0aWYgc3BhY2VfdXNlclxuXHRcdFx0XHRcdGlmIGJlbG9uZ09yZ2lkcy5sZW5ndGggPiAwXG5cdFx0XHRcdFx0XHRpZiAhc3BhY2VfdXNlci5vcmdhbml6YXRpb25zXG5cdFx0XHRcdFx0XHRcdHNwYWNlX3VzZXIub3JnYW5pemF0aW9ucyA9IFtdXG5cblx0XHRcdFx0XHRcdHNwYWNlX3VzZXJfdXBkYXRlX2RvYyA9IHt9XG5cblx0XHRcdFx0XHRcdHNwYWNlX3VzZXJfdXBkYXRlX2RvYy5vcmdhbml6YXRpb25zID0gXy51bmlxKHNwYWNlX3VzZXIub3JnYW5pemF0aW9ucy5jb25jYXQoYmVsb25nT3JnaWRzKSlcblxuXHRcdFx0XHRcdFx0aWYgaXRlbS5lbWFpbFxuXHRcdFx0XHRcdFx0XHRzcGFjZV91c2VyX3VwZGF0ZV9kb2MuZW1haWwgPSBpdGVtLmVtYWlsXG5cblx0XHRcdFx0XHRcdGlmIGl0ZW0ubmFtZVxuXHRcdFx0XHRcdFx0XHRzcGFjZV91c2VyX3VwZGF0ZV9kb2MubmFtZSA9IGl0ZW0ubmFtZVxuXG5cdFx0XHRcdFx0XHRpZiBpdGVtLmNvbXBhbnlcblx0XHRcdFx0XHRcdFx0c3BhY2VfdXNlcl91cGRhdGVfZG9jLmNvbXBhbnkgPSBpdGVtLmNvbXBhbnlcblxuXHRcdFx0XHRcdFx0aWYgaXRlbS5wb3NpdGlvblxuXHRcdFx0XHRcdFx0XHRzcGFjZV91c2VyX3VwZGF0ZV9kb2MucG9zaXRpb24gPSBpdGVtLnBvc2l0aW9uXG5cblx0XHRcdFx0XHRcdGlmIGl0ZW0ud29ya19waG9uZVxuXHRcdFx0XHRcdFx0XHRzcGFjZV91c2VyX3VwZGF0ZV9kb2Mud29ya19waG9uZSA9IGl0ZW0ud29ya19waG9uZVxuXG5cdFx0XHRcdFx0XHRpZiBpdGVtLnBob25lXG5cdFx0XHRcdFx0XHRcdHNwYWNlX3VzZXJfdXBkYXRlX2RvYy5tb2JpbGUgPSBpdGVtLnBob25lXG5cblx0XHRcdFx0XHRcdGlmIGl0ZW0uc29ydF9ub1xuXHRcdFx0XHRcdFx0XHRzcGFjZV91c2VyX3VwZGF0ZV9kb2Muc29ydF9ubyA9IGl0ZW0uc29ydF9ub1xuXG5cdFx0XHRcdFx0XHRpZiBfLmtleXMoc3BhY2VfdXNlcl91cGRhdGVfZG9jKS5sZW5ndGggPiAwXG5cdFx0XHRcdFx0XHRcdGRiLnNwYWNlX3VzZXJzLnVwZGF0ZSh7c3BhY2U6IHNwYWNlX2lkLCB1c2VyOiB1c2VyX2lkfSwgeyRzZXQ6IHNwYWNlX3VzZXJfdXBkYXRlX2RvY30pXG5cblx0XHRcdFx0XHRcdGlmIHNwYWNlX3VzZXIuaW52aXRlX3N0YXRlID09IFwicmVmdXNlZFwiIG9yIHNwYWNlX3VzZXIuaW52aXRlX3N0YXRlID09IFwicGVuZGluZ1wiXG5cdFx0XHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCBcIuivpeeUqOaIt+i/mOacquaOpeWPl+WKoOWFpeW3peS9nOWMuu+8jOS4jeiDveS/ruaUueS7lueahOS4quS6uuS/oeaBr1wiKVxuXHRcdFx0XHRcdFx0ZWxzZVxuI1x0XHRcdFx0XHRcdFx0aWYgaXRlbS51c2VybmFtZVxuI1x0XHRcdFx0XHRcdFx0XHRkYi51c2Vycy51cGRhdGUoe19pZDogdXNlcl9pZH0seyRzZXQ6e3VzZXJuYW1lOiBpdGVtLnVzZXJuYW1lfX0pXG5cdFx0XHRcdFx0XHRcdGlmIGl0ZW0ucGFzc3dvcmRcblx0XHRcdFx0XHRcdFx0XHRBY2NvdW50cy5zZXRQYXNzd29yZCh1c2VyX2lkLCBpdGVtLnBhc3N3b3JkLCB7bG9nb3V0OiBmYWxzZX0pXG5cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHRcdGlmIGJlbG9uZ09yZ2lkcy5sZW5ndGggPiAwXG5cdFx0XHRcdFx0XHRzdV9kb2MgPSB7fVxuXHRcdFx0XHRcdFx0c3VfZG9jLl9pZCA9IGRiLnNwYWNlX3VzZXJzLl9tYWtlTmV3SUQoKVxuXHRcdFx0XHRcdFx0c3VfZG9jLnNwYWNlID0gc3BhY2VfaWRcblxuXHRcdFx0XHRcdFx0c3VfZG9jLnVzZXJfYWNjZXB0ZWQgPSAgdHJ1ZVxuXHRcdFx0XHRcdFx0c3VfZG9jLmludml0ZV9zdGF0ZSA9IFwiYWNjZXB0ZWRcIlxuXG5cdFx0XHRcdFx0XHRpZiB1c2VyXG5cdFx0XHRcdFx0XHRcdHN1X2RvYy51c2VyX2FjY2VwdGVkID0gZmFsc2Vcblx0XHRcdFx0XHRcdFx0c3VfZG9jLmludml0ZV9zdGF0ZSA9IFwicGVuZGluZ1wiXG5cblx0XHRcdFx0XHRcdHN1X2RvYy5uYW1lID0gaXRlbS5uYW1lXG5cdFx0XHRcdFx0XHRpZiBpdGVtLmVtYWlsXG5cdFx0XHRcdFx0XHRcdHN1X2RvYy5lbWFpbCA9IGl0ZW0uZW1haWxcblx0XHRcdFx0XHRcdHN1X2RvYy5vcmdhbml6YXRpb24gPSBiZWxvbmdPcmdpZHNbMF1cblx0XHRcdFx0XHRcdHN1X2RvYy5vcmdhbml6YXRpb25zID0gYmVsb25nT3JnaWRzXG5cblx0XHRcdFx0XHRcdGlmIGl0ZW0ucG9zaXRpb25cblx0XHRcdFx0XHRcdFx0c3VfZG9jLnBvc2l0aW9uID0gaXRlbS5wb3NpdGlvblxuXG5cdFx0XHRcdFx0XHRpZiBpdGVtLndvcmtfcGhvbmVcblx0XHRcdFx0XHRcdFx0c3VfZG9jLndvcmtfcGhvbmUgPSBpdGVtLndvcmtfcGhvbmVcblxuXHRcdFx0XHRcdFx0aWYgaXRlbS5waG9uZVxuXHRcdFx0XHRcdFx0XHRzdV9kb2MubW9iaWxlID0gaXRlbS5waG9uZVxuXG5cdFx0XHRcdFx0XHRpZiBpdGVtLnNvcnRfbm9cblx0XHRcdFx0XHRcdFx0c3VfZG9jLnNvcnRfbm8gPSBpdGVtLnNvcnRfbm9cblxuXHRcdFx0XHRcdFx0aWYgaXRlbS5jb21wYW55XG5cdFx0XHRcdFx0XHRcdHN1X2RvYy5jb21wYW55ID0gaXRlbS5jb21wYW55XG5cdFx0XHRcdFx0XHRcblx0XHRcdFx0XHRcdGlmIHVzZXJfaWRcblx0XHRcdFx0XHRcdFx0dXNlckluZm8gPSBkYi51c2Vycy5maW5kT25lKHVzZXJfaWQsIHsgZmllbGRzOiB7IHVzZXJuYW1lOiAxIH0gfSlcblx0XHRcdFx0XHRcdFx0aWYgdXNlckluZm8udXNlcm5hbWVcblx0XHRcdFx0XHRcdFx0XHRzdV9kb2MudXNlcm5hbWUgPSB1c2VySW5mby51c2VybmFtZVxuXHRcdFx0XHRcdFx0XHRzdV9kb2MudXNlciA9IHVzZXJfaWRcblxuXHRcdFx0XHRcdFx0ZGIuc3BhY2VfdXNlcnMuaW5zZXJ0KHN1X2RvYylcblx0XHRcdGNhdGNoIGVcblx0XHRcdFx0ZXJyb3IubGluZSA9IGkrMVxuXHRcdFx0XHRlcnJvci5tZXNzYWdlID0gZS5yZWFzb25cblx0XHRcdFx0ZXJyb3JMaXN0LnB1c2goZXJyb3IpXG5cblx0XHRyZXR1cm4gZXJyb3JMaXN0XG4iLCJNZXRlb3IubWV0aG9kcyh7XG5cbiAgLypcbiAgXHRcdDHjgIHmoKHpqoznlKjmiLfmmK/lkKblrZjlnKhcbiAgXHRcdDLjgIHmoKHpqozlt6XkvZzljLrnlKjmiLfmmK/lkKblrZjlnKhcbiAgXHRcdDPjgIHmoKHpqozpg6jpl6jmmK/lkKblrZjlnKhcbiAgXHRcdDTjgIHmoKHpqozpg6jpl6jnlKjmiLfmmK/lkKblrZjlnKhcbiAgXHRcdFRPRE86IOWbvemZheWMllxuICAgKi9cbiAgaW1wb3J0X3VzZXJzOiBmdW5jdGlvbihzcGFjZV9pZCwgdXNlcl9waywgZGF0YSwgb25seUNoZWNrKSB7XG4gICAgdmFyIF9zZWxmLCBhY2NlcHRlZF91c2VyX2NvdW50LCBjdXJyZW50VXNlciwgY3VycmVudFVzZXJMb2NhbGUsIGVycm9yTGlzdCwgb3duZXJfaWQsIHJvb3Rfb3JnLCBzcGFjZSwgdGVzdERhdGE7XG4gICAgX3NlbGYgPSB0aGlzO1xuICAgIGlmICghdGhpcy51c2VySWQpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAxLCBcIuivt+WFiOeZu+W9lVwiKTtcbiAgICB9XG4gICAgcm9vdF9vcmcgPSBkYi5vcmdhbml6YXRpb25zLmZpbmRPbmUoe1xuICAgICAgc3BhY2U6IHNwYWNlX2lkLFxuICAgICAgcGFyZW50OiBudWxsXG4gICAgfSk7XG4gICAgc3BhY2UgPSBkYi5zcGFjZXMuZmluZE9uZShzcGFjZV9pZCk7XG4gICAgaWYgKCFzcGFjZSB8fCAhKHNwYWNlICE9IG51bGwgPyBzcGFjZS5hZG1pbnMuaW5jbHVkZXModGhpcy51c2VySWQpIDogdm9pZCAwKSkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsIFwi5Y+q5pyJ5bel5L2c5Yy6566h55CG5ZGY5Y+v5Lul5a+85YWl55So5oi3XCIpO1xuICAgIH1cbiAgICBpZiAoIXNwYWNlLmlzX3BhaWQpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAxLCBcIuWfuuehgOeJiOS4jeaUr+aMgeatpOWKn+iDvVwiKTtcbiAgICB9XG4gICAgYWNjZXB0ZWRfdXNlcl9jb3VudCA9IGRiLnNwYWNlX3VzZXJzLmZpbmQoe1xuICAgICAgc3BhY2U6IHNwYWNlLl9pZCxcbiAgICAgIHVzZXJfYWNjZXB0ZWQ6IHRydWVcbiAgICB9KS5jb3VudCgpO1xuICAgIGlmICgoYWNjZXB0ZWRfdXNlcl9jb3VudCArIGRhdGEubGVuZ3RoKSA+IHNwYWNlLnVzZXJfbGltaXQpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCAoXCLpnIDopoHmj5DljYflt7LotK3kubDnlKjmiLfmlbDoh7NcIiArIChhY2NlcHRlZF91c2VyX2NvdW50ICsgZGF0YS5sZW5ndGgpICsgXCIo5b2T5YmNXCIgKyBzcGFjZS51c2VyX2xpbWl0ICsgXCIpXCIpICsgXCIsIOivt+WcqOS8geS4muS/oeaBr+aooeWdl+S4reeCueWHu+WNh+e6p+aMiemSrui0reS5sFwiKTtcbiAgICB9XG4gICAgb3duZXJfaWQgPSBzcGFjZS5vd25lcjtcbiAgICB0ZXN0RGF0YSA9IFtdO1xuICAgIGVycm9yTGlzdCA9IFtdO1xuICAgIGN1cnJlbnRVc2VyID0gZGIudXNlcnMuZmluZE9uZSh7XG4gICAgICBfaWQ6IF9zZWxmLnVzZXJJZFxuICAgIH0sIHtcbiAgICAgIGZpZWxkczoge1xuICAgICAgICBsb2NhbGU6IDEsXG4gICAgICAgIHBob25lOiAxXG4gICAgICB9XG4gICAgfSk7XG4gICAgY3VycmVudFVzZXJMb2NhbGUgPSBjdXJyZW50VXNlci5sb2NhbGU7XG4gICAgZGF0YS5mb3JFYWNoKGZ1bmN0aW9uKGl0ZW0sIGkpIHtcbiAgICAgIHZhciBtdWx0aU9yZ3MsIG9wZXJhdGluZywgb3JnYW5pemF0aW9uLCBvcmdhbml6YXRpb25fZGVwdHMsIHJlZiwgcmVmMSwgcmVmMiwgcmVmMywgc2VsZWN0b3IsIHNwYWNlVXNlckV4aXN0LCB0ZXN0T2JqLCB1c2VyLCB1c2VyRXhpc3Q7XG4gICAgICBpZiAoIWl0ZW0ucGhvbmUgJiYgIWl0ZW0uZW1haWwpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysXCIgKyAoaSArIDEpICsgXCLooYw6IOaJi+acuuWPt++8jOmCrueuseS4jeiDvemDveS4uuepulwiKTtcbiAgICAgIH1cbiAgICAgIHRlc3RPYmogPSB7fTtcbiAgICAgIGlmIChpdGVtLnVzZXJuYW1lKSB7XG4gICAgICAgIHRlc3RPYmoudXNlcm5hbWUgPSBpdGVtLnVzZXJuYW1lO1xuICAgICAgICBpZiAodGVzdERhdGEuZmlsdGVyUHJvcGVydHkoXCJ1c2VybmFtZVwiLCBpdGVtLnVzZXJuYW1lKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysXCIgKyAoaSArIDEpICsgXCLooYzvvJrnlKjmiLflkI3ph43lpI1cIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpdGVtLnBob25lKSB7XG4gICAgICAgIHRlc3RPYmoucGhvbmUgPSBpdGVtLnBob25lO1xuICAgICAgICBpZiAodGVzdERhdGEuZmlsdGVyUHJvcGVydHkoXCJwaG9uZVwiLCBpdGVtLnBob25lKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysXCIgKyAoaSArIDEpICsgXCLooYzvvJrmiYvmnLrlj7fph43lpI1cIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChpdGVtLmVtYWlsKSB7XG4gICAgICAgIGlmICghL14oW0EtWjAtOVxcLlxcLVxcX1xcK10pKihbQS1aMC05XFwrXFwtXFxfXSkrXFxAW0EtWjAtOV0rKFtcXC1dW0EtWjAtOV0rKSooW1xcLl1bQS1aMC05XFwtXSspezEsOH0kL2kudGVzdChpdGVtLmVtYWlsKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrFwiICsgKGkgKyAxKSArIFwi6KGM77ya6YKu5Lu25qC85byP6ZSZ6K+vXCIgKyBpdGVtLmVtYWlsKTtcbiAgICAgICAgfVxuICAgICAgICB0ZXN0T2JqLmVtYWlsID0gaXRlbS5lbWFpbDtcbiAgICAgICAgaWYgKHRlc3REYXRhLmZpbHRlclByb3BlcnR5KFwiZW1haWxcIiwgaXRlbS5lbWFpbCkubGVuZ3RoID4gMCkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrFwiICsgKGkgKyAxKSArIFwi6KGM77ya6YKu5Lu26YeN5aSNXCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpdGVtLnNwYWNlID0gc3BhY2VfaWQ7XG4gICAgICB0ZXN0RGF0YS5wdXNoKHRlc3RPYmopO1xuICAgICAgc2VsZWN0b3IgPSBbXTtcbiAgICAgIG9wZXJhdGluZyA9IFwiXCI7XG4gICAgICBpZiAoaXRlbS51c2VybmFtZSkge1xuICAgICAgICBzZWxlY3Rvci5wdXNoKHtcbiAgICAgICAgICB1c2VybmFtZTogaXRlbS51c2VybmFtZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChpdGVtLmVtYWlsKSB7XG4gICAgICAgIHNlbGVjdG9yLnB1c2goe1xuICAgICAgICAgIGVtYWlsOiBpdGVtLmVtYWlsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGl0ZW0ucGhvbmUpIHtcbiAgICAgICAgc2VsZWN0b3IucHVzaCh7XG4gICAgICAgICAgbW9iaWxlOiBpdGVtLnBob25lXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgdXNlckV4aXN0ID0gZGIudXNlcnMuZmluZCh7XG4gICAgICAgICRvcjogc2VsZWN0b3JcbiAgICAgIH0pO1xuICAgICAgaWYgKHVzZXJFeGlzdC5jb3VudCgpID4gMSkge1xuICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLnrKxcIiArIChpICsgMSkgKyBcIuihjO+8mueUqOaIt+WQjeOAgeaJi+acuuWPt+OAgemCrueuseS/oeaBr+acieivr++8jOaXoOazleWMuemFjeWIsOWQjOS4gOi0puWPt1wiKTtcbiAgICAgIH0gZWxzZSBpZiAodXNlckV4aXN0LmNvdW50KCkgPT09IDEpIHtcbiAgICAgICAgdXNlciA9IHVzZXJFeGlzdC5mZXRjaCgpWzBdLl9pZDtcbiAgICAgICAgc3BhY2VVc2VyRXhpc3QgPSBkYi5zcGFjZV91c2Vycy5maW5kKHtcbiAgICAgICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICAgICAgdXNlcjogdXNlclxuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHNwYWNlVXNlckV4aXN0LmNvdW50KCkgPT09IDEpIHtcbiAgICAgICAgICBvcGVyYXRpbmcgPSBcInVwZGF0ZVwiO1xuICAgICAgICB9IGVsc2UgaWYgKHNwYWNlVXNlckV4aXN0LmNvdW50KCkgPT09IDApIHtcbiAgICAgICAgICBvcGVyYXRpbmcgPSBcImluc2VydFwiO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHVzZXJFeGlzdC5jb3VudCgpID09PSAwKSB7XG4gICAgICAgIG9wZXJhdGluZyA9IFwiaW5zZXJ0XCI7XG4gICAgICB9XG4gICAgICBpZiAoaXRlbS5wYXNzd29yZCAmJiB1c2VyRXhpc3QuY291bnQoKSA9PT0gMSkge1xuICAgICAgICBpZiAoKHJlZiA9IHVzZXJFeGlzdC5mZXRjaCgpWzBdLnNlcnZpY2VzKSAhPSBudWxsID8gKHJlZjEgPSByZWYucGFzc3dvcmQpICE9IG51bGwgPyByZWYxLmJjcnlwdCA6IHZvaWQgMCA6IHZvaWQgMCkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrFwiICsgKGkgKyAxKSArIFwi6KGM77ya55So5oi35bey6K6+572u5a+G56CB77yM5LiN5YWB6K645L+u5pS5XCIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBvcmdhbml6YXRpb24gPSBpdGVtLm9yZ2FuaXphdGlvbjtcbiAgICAgIGlmICghb3JnYW5pemF0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrFwiICsgKGkgKyAxKSArIFwi6KGM77ya6YOo6Zeo5LiN6IO95Li656m6XCIpO1xuICAgICAgfVxuICAgICAgb3JnYW5pemF0aW9uX2RlcHRzID0gb3JnYW5pemF0aW9uLnNwbGl0KFwiL1wiKTtcbiAgICAgIGlmIChvcmdhbml6YXRpb25fZGVwdHMubGVuZ3RoIDwgMSB8fCBvcmdhbml6YXRpb25fZGVwdHNbMF0gIT09IHJvb3Rfb3JnLm5hbWUpIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysXCIgKyAoaSArIDEpICsgXCLooYzvvJrml6DmlYjnmoTmoLnpg6jpl6hcIik7XG4gICAgICB9XG4gICAgICBpZiAoaXRlbS5wYXNzd29yZCAmJiAodXNlciAhPSBudWxsID8gKHJlZjIgPSB1c2VyLnNlcnZpY2VzKSAhPSBudWxsID8gKHJlZjMgPSByZWYyLnBhc3N3b3JkKSAhPSBudWxsID8gcmVmMy5iY3J5cHQgOiB2b2lkIDAgOiB2b2lkIDAgOiB2b2lkIDApKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIuesrFwiICsgKGkgKyAxKSArIFwi6KGM77ya55So5oi35bey6K6+572u5a+G56CB77yM5LiN5YWB6K645L+u5pS5XCIpO1xuICAgICAgfVxuICAgICAgb3JnYW5pemF0aW9uX2RlcHRzLmZvckVhY2goZnVuY3Rpb24oZGVwdF9uYW1lLCBqKSB7XG4gICAgICAgIGlmICghZGVwdF9uYW1lKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi56ysXCIgKyAoaSArIDEpICsgXCLooYzvvJrml6DmlYjnmoTpg6jpl6hcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgbXVsdGlPcmdzID0gb3JnYW5pemF0aW9uLnNwbGl0KFwiLFwiKTtcbiAgICAgIHJldHVybiBtdWx0aU9yZ3MuZm9yRWFjaChmdW5jdGlvbihvcmdGdWxsbmFtZSkge1xuICAgICAgICB2YXIgZnVsbG5hbWU7XG4gICAgICAgIG9yZ2FuaXphdGlvbl9kZXB0cyA9IG9yZ0Z1bGxuYW1lLnRyaW0oKS5zcGxpdChcIi9cIik7XG4gICAgICAgIGZ1bGxuYW1lID0gXCJcIjtcbiAgICAgICAgcmV0dXJuIG9yZ2FuaXphdGlvbl9kZXB0cy5mb3JFYWNoKGZ1bmN0aW9uKGRlcHRfbmFtZSwgaikge1xuICAgICAgICAgIHZhciBvcmdDb3VudDtcbiAgICAgICAgICBpZiAoaiA+IDApIHtcbiAgICAgICAgICAgIGlmIChqID09PSAxKSB7XG4gICAgICAgICAgICAgIGZ1bGxuYW1lID0gZGVwdF9uYW1lO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZnVsbG5hbWUgPSBmdWxsbmFtZSArIFwiL1wiICsgZGVwdF9uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3JnQ291bnQgPSBkYi5vcmdhbml6YXRpb25zLmZpbmQoe1xuICAgICAgICAgICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICAgICAgICAgIGZ1bGxuYW1lOiBmdWxsbmFtZVxuICAgICAgICAgICAgfSkuY291bnQoKTtcbiAgICAgICAgICAgIGlmIChvcmdDb3VudCA9PT0gMCkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLnrKxcIiArIChpICsgMSkgKyBcIuihjO+8mumDqOmXqChcIiArIGRlcHRfbmFtZSArIFwiKeS4jeWtmOWcqO+8jOivt+WFiOWIm+W7ulwiKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gICAgaWYgKG9ubHlDaGVjaykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkYXRhLmZvckVhY2goZnVuY3Rpb24oaXRlbSwgaSkge1xuICAgICAgdmFyIGJlbG9uZ09yZ2lkcywgZSwgZXJyb3IsIG11bHRpT3Jncywgbm93LCBvcGVyYXRpbmcsIG9yZ2FuaXphdGlvbiwgc2VsZWN0b3IsIHNwYWNlX3VzZXIsIHNwYWNlX3VzZXJfdXBkYXRlX2RvYywgc3VfZG9jLCB1ZG9jLCB1c2VyLCB1c2VyRXhpc3QsIHVzZXJJbmZvLCB1c2VyX2lkO1xuICAgICAgZXJyb3IgPSB7fTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHNlbGVjdG9yID0gW107XG4gICAgICAgIG9wZXJhdGluZyA9IFwiXCI7XG4gICAgICAgIGlmIChpdGVtLmVtYWlsKSB7XG4gICAgICAgICAgc2VsZWN0b3IucHVzaCh7XG4gICAgICAgICAgICBlbWFpbDogaXRlbS5lbWFpbFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChpdGVtLnBob25lKSB7XG4gICAgICAgICAgc2VsZWN0b3IucHVzaCh7XG4gICAgICAgICAgICBtb2JpbGU6IGl0ZW0ucGhvbmVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICB1c2VyRXhpc3QgPSBkYi51c2Vycy5maW5kKHtcbiAgICAgICAgICAkb3I6IHNlbGVjdG9yXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAodXNlckV4aXN0LmNvdW50KCkgPiAxKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsIFwi55So5oi35ZCN44CB5omL5py65Y+344CB6YKu566x5L+h5oGv5pyJ6K+v77yM5peg5rOV5Yy56YWN5Yiw5ZCM5LiA6LSm5Y+3XCIpO1xuICAgICAgICB9IGVsc2UgaWYgKHVzZXJFeGlzdC5jb3VudCgpID09PSAxKSB7XG4gICAgICAgICAgdXNlciA9IHVzZXJFeGlzdC5mZXRjaCgpWzBdO1xuICAgICAgICB9XG4gICAgICAgIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgIG9yZ2FuaXphdGlvbiA9IGl0ZW0ub3JnYW5pemF0aW9uO1xuICAgICAgICBtdWx0aU9yZ3MgPSBvcmdhbml6YXRpb24uc3BsaXQoXCIsXCIpO1xuICAgICAgICBiZWxvbmdPcmdpZHMgPSBbXTtcbiAgICAgICAgbXVsdGlPcmdzLmZvckVhY2goZnVuY3Rpb24ob3JnRnVsbG5hbWUpIHtcbiAgICAgICAgICB2YXIgZnVsbG5hbWUsIG9yZywgb3JnYW5pemF0aW9uX2RlcHRzO1xuICAgICAgICAgIG9yZ2FuaXphdGlvbl9kZXB0cyA9IG9yZ0Z1bGxuYW1lLnRyaW0oKS5zcGxpdChcIi9cIik7XG4gICAgICAgICAgZnVsbG5hbWUgPSBcIlwiO1xuICAgICAgICAgIG9yZ2FuaXphdGlvbl9kZXB0cy5mb3JFYWNoKGZ1bmN0aW9uKGRlcHRfbmFtZSwgaikge1xuICAgICAgICAgICAgaWYgKGogPiAwKSB7XG4gICAgICAgICAgICAgIGlmIChqID09PSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bGxuYW1lID0gZGVwdF9uYW1lO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdWxsbmFtZSA9IGZ1bGxuYW1lICsgXCIvXCIgKyBkZXB0X25hbWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBmdWxsbmFtZSA9IGRlcHRfbmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgICBvcmcgPSBkYi5vcmdhbml6YXRpb25zLmZpbmRPbmUoe1xuICAgICAgICAgICAgc3BhY2U6IHNwYWNlX2lkLFxuICAgICAgICAgICAgZnVsbG5hbWU6IGZ1bGxuYW1lXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKG9yZykge1xuICAgICAgICAgICAgcmV0dXJuIGJlbG9uZ09yZ2lkcy5wdXNoKG9yZy5faWQpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHVzZXJfaWQgPSBudWxsO1xuICAgICAgICBpZiAodXNlcikge1xuICAgICAgICAgIHVzZXJfaWQgPSB1c2VyLl9pZDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1ZG9jID0ge307XG4gICAgICAgICAgdWRvYy5faWQgPSBkYi51c2Vycy5fbWFrZU5ld0lEKCk7XG4gICAgICAgICAgdWRvYy5zdGVlZG9zX2lkID0gaXRlbS5lbWFpbCB8fCB1ZG9jLl9pZDtcbiAgICAgICAgICB1ZG9jLmxvY2FsZSA9IGN1cnJlbnRVc2VyTG9jYWxlO1xuICAgICAgICAgIHVkb2Muc3BhY2VzX2ludml0ZWQgPSBbc3BhY2VfaWRdO1xuICAgICAgICAgIGlmIChpdGVtLm5hbWUpIHtcbiAgICAgICAgICAgIHVkb2MubmFtZSA9IGl0ZW0ubmFtZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGl0ZW0uZW1haWwpIHtcbiAgICAgICAgICAgIHVkb2MuZW1haWwgPSBpdGVtLmVtYWlsO1xuICAgICAgICAgICAgdWRvYy5lbWFpbF92ZXJpZmllZCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaXRlbS51c2VybmFtZSkge1xuICAgICAgICAgICAgdWRvYy51c2VybmFtZSA9IGl0ZW0udXNlcm5hbWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChpdGVtLnBob25lKSB7XG4gICAgICAgICAgICB1ZG9jLm1vYmlsZSA9IGl0ZW0ucGhvbmU7XG4gICAgICAgICAgICB1ZG9jLm1vYmlsZV92ZXJpZmllZCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB1c2VyX2lkID0gZGIudXNlcnMuaW5zZXJ0KHVkb2MpO1xuICAgICAgICAgIGlmIChpdGVtLnBhc3N3b3JkKSB7XG4gICAgICAgICAgICBBY2NvdW50cy5zZXRQYXNzd29yZCh1c2VyX2lkLCBpdGVtLnBhc3N3b3JkLCB7XG4gICAgICAgICAgICAgIGxvZ291dDogZmFsc2VcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBzcGFjZV91c2VyID0gZGIuc3BhY2VfdXNlcnMuZmluZE9uZSh7XG4gICAgICAgICAgc3BhY2U6IHNwYWNlX2lkLFxuICAgICAgICAgIHVzZXI6IHVzZXJfaWRcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChzcGFjZV91c2VyKSB7XG4gICAgICAgICAgaWYgKGJlbG9uZ09yZ2lkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAoIXNwYWNlX3VzZXIub3JnYW5pemF0aW9ucykge1xuICAgICAgICAgICAgICBzcGFjZV91c2VyLm9yZ2FuaXphdGlvbnMgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNwYWNlX3VzZXJfdXBkYXRlX2RvYyA9IHt9O1xuICAgICAgICAgICAgc3BhY2VfdXNlcl91cGRhdGVfZG9jLm9yZ2FuaXphdGlvbnMgPSBfLnVuaXEoc3BhY2VfdXNlci5vcmdhbml6YXRpb25zLmNvbmNhdChiZWxvbmdPcmdpZHMpKTtcbiAgICAgICAgICAgIGlmIChpdGVtLmVtYWlsKSB7XG4gICAgICAgICAgICAgIHNwYWNlX3VzZXJfdXBkYXRlX2RvYy5lbWFpbCA9IGl0ZW0uZW1haWw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbS5uYW1lKSB7XG4gICAgICAgICAgICAgIHNwYWNlX3VzZXJfdXBkYXRlX2RvYy5uYW1lID0gaXRlbS5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGl0ZW0uY29tcGFueSkge1xuICAgICAgICAgICAgICBzcGFjZV91c2VyX3VwZGF0ZV9kb2MuY29tcGFueSA9IGl0ZW0uY29tcGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtLnBvc2l0aW9uKSB7XG4gICAgICAgICAgICAgIHNwYWNlX3VzZXJfdXBkYXRlX2RvYy5wb3NpdGlvbiA9IGl0ZW0ucG9zaXRpb247XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbS53b3JrX3Bob25lKSB7XG4gICAgICAgICAgICAgIHNwYWNlX3VzZXJfdXBkYXRlX2RvYy53b3JrX3Bob25lID0gaXRlbS53b3JrX3Bob25lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGl0ZW0ucGhvbmUpIHtcbiAgICAgICAgICAgICAgc3BhY2VfdXNlcl91cGRhdGVfZG9jLm1vYmlsZSA9IGl0ZW0ucGhvbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbS5zb3J0X25vKSB7XG4gICAgICAgICAgICAgIHNwYWNlX3VzZXJfdXBkYXRlX2RvYy5zb3J0X25vID0gaXRlbS5zb3J0X25vO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKF8ua2V5cyhzcGFjZV91c2VyX3VwZGF0ZV9kb2MpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgZGIuc3BhY2VfdXNlcnMudXBkYXRlKHtcbiAgICAgICAgICAgICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICAgICAgICAgICAgdXNlcjogdXNlcl9pZFxuICAgICAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAgICAgJHNldDogc3BhY2VfdXNlcl91cGRhdGVfZG9jXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHNwYWNlX3VzZXIuaW52aXRlX3N0YXRlID09PSBcInJlZnVzZWRcIiB8fCBzcGFjZV91c2VyLmludml0ZV9zdGF0ZSA9PT0gXCJwZW5kaW5nXCIpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDAsIFwi6K+l55So5oi36L+Y5pyq5o6l5Y+X5Yqg5YWl5bel5L2c5Yy677yM5LiN6IO95L+u5pS55LuW55qE5Liq5Lq65L+h5oGvXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgaWYgKGl0ZW0ucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gQWNjb3VudHMuc2V0UGFzc3dvcmQodXNlcl9pZCwgaXRlbS5wYXNzd29yZCwge1xuICAgICAgICAgICAgICAgICAgbG9nb3V0OiBmYWxzZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlmIChiZWxvbmdPcmdpZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgc3VfZG9jID0ge307XG4gICAgICAgICAgICBzdV9kb2MuX2lkID0gZGIuc3BhY2VfdXNlcnMuX21ha2VOZXdJRCgpO1xuICAgICAgICAgICAgc3VfZG9jLnNwYWNlID0gc3BhY2VfaWQ7XG4gICAgICAgICAgICBzdV9kb2MudXNlcl9hY2NlcHRlZCA9IHRydWU7XG4gICAgICAgICAgICBzdV9kb2MuaW52aXRlX3N0YXRlID0gXCJhY2NlcHRlZFwiO1xuICAgICAgICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgICAgICAgc3VfZG9jLnVzZXJfYWNjZXB0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgc3VfZG9jLmludml0ZV9zdGF0ZSA9IFwicGVuZGluZ1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3VfZG9jLm5hbWUgPSBpdGVtLm5hbWU7XG4gICAgICAgICAgICBpZiAoaXRlbS5lbWFpbCkge1xuICAgICAgICAgICAgICBzdV9kb2MuZW1haWwgPSBpdGVtLmVtYWlsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3VfZG9jLm9yZ2FuaXphdGlvbiA9IGJlbG9uZ09yZ2lkc1swXTtcbiAgICAgICAgICAgIHN1X2RvYy5vcmdhbml6YXRpb25zID0gYmVsb25nT3JnaWRzO1xuICAgICAgICAgICAgaWYgKGl0ZW0ucG9zaXRpb24pIHtcbiAgICAgICAgICAgICAgc3VfZG9jLnBvc2l0aW9uID0gaXRlbS5wb3NpdGlvbjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtLndvcmtfcGhvbmUpIHtcbiAgICAgICAgICAgICAgc3VfZG9jLndvcmtfcGhvbmUgPSBpdGVtLndvcmtfcGhvbmU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbS5waG9uZSkge1xuICAgICAgICAgICAgICBzdV9kb2MubW9iaWxlID0gaXRlbS5waG9uZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpdGVtLnNvcnRfbm8pIHtcbiAgICAgICAgICAgICAgc3VfZG9jLnNvcnRfbm8gPSBpdGVtLnNvcnRfbm87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXRlbS5jb21wYW55KSB7XG4gICAgICAgICAgICAgIHN1X2RvYy5jb21wYW55ID0gaXRlbS5jb21wYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHVzZXJfaWQpIHtcbiAgICAgICAgICAgICAgdXNlckluZm8gPSBkYi51c2Vycy5maW5kT25lKHVzZXJfaWQsIHtcbiAgICAgICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICAgIHVzZXJuYW1lOiAxXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgaWYgKHVzZXJJbmZvLnVzZXJuYW1lKSB7XG4gICAgICAgICAgICAgICAgc3VfZG9jLnVzZXJuYW1lID0gdXNlckluZm8udXNlcm5hbWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc3VfZG9jLnVzZXIgPSB1c2VyX2lkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGRiLnNwYWNlX3VzZXJzLmluc2VydChzdV9kb2MpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyb3IxKSB7XG4gICAgICAgIGUgPSBlcnJvcjE7XG4gICAgICAgIGVycm9yLmxpbmUgPSBpICsgMTtcbiAgICAgICAgZXJyb3IubWVzc2FnZSA9IGUucmVhc29uO1xuICAgICAgICByZXR1cm4gZXJyb3JMaXN0LnB1c2goZXJyb3IpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiBlcnJvckxpc3Q7XG4gIH1cbn0pO1xuIiwiTWV0ZW9yLnN0YXJ0dXAgLT5cblx0V2ViQXBwLmNvbm5lY3RIYW5kbGVycy51c2UgXCIvYXBpL2V4cG9ydC9zcGFjZV91c2Vyc1wiLCAocmVxLCByZXMsIG5leHQpLT5cblx0XHR0cnlcblx0XHRcdGN1cnJlbnRfdXNlcl9pbmZvID0gdXVmbG93TWFuYWdlci5jaGVja19hdXRob3JpemF0aW9uKHJlcSlcblxuXHRcdFx0cXVlcnkgPSByZXEucXVlcnlcblx0XHRcdHNwYWNlX2lkID0gcXVlcnkuc3BhY2VfaWRcblx0XHRcdG9yZ19pZCA9IHF1ZXJ5Lm9yZ19pZFxuXHRcdFx0dXNlcl9pZCA9IHF1ZXJ5WydYLVVzZXItSWQnXVxuXHRcdFx0b3JnID0gZGIub3JnYW5pemF0aW9ucy5maW5kT25lKHtfaWQ6b3JnX2lkfSx7ZmllbGRzOntmdWxsbmFtZToxfX0pXG5cdFx0XHR1c2Vyc190b194bHMgPSBuZXcgQXJyYXlcblx0XHRcdG5vdyA9IG5ldyBEYXRlIFxuXHRcdFx0aWYgU3RlZWRvcy5pc1NwYWNlQWRtaW4oc3BhY2VfaWQsdXNlcl9pZClcblx0XHRcdFx0dXNlcnNfdG9feGxzID0gZGIuc3BhY2VfdXNlcnMuZmluZCh7XG5cdFx0XHRcdFx0c3BhY2U6IHNwYWNlX2lkXG5cdFx0XHRcdH0sIHtcblx0XHRcdFx0XHRzb3J0OiB7bmFtZTogMX1cblx0XHRcdFx0fSkuZmV0Y2goKVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRvcmdfaWRzID0gW11cblx0XHRcdFx0b3JnX29ianMgPSBkYi5vcmdhbml6YXRpb25zLmZpbmQoe19pZDpvcmdfaWQsc3BhY2U6c3BhY2VfaWR9LHtmaWVsZHM6e19pZDoxLGNoaWxkcmVuOjF9fSkuZmV0Y2goKVxuXHRcdFx0XHRvcmdfaWRzID0gXy5wbHVjayhvcmdfb2JqcywnX2lkJylcblx0XHRcdFx0Xy5lYWNoIG9yZ19vYmpzLChvcmdfb2JqKS0+XG5cdFx0XHRcdFx0b3JnX2lkcyA9IF8udW5pb24ob3JnX2lkcyxvcmdfb2JqPy5jaGlsZHJlbilcblx0XHRcdFx0Xy51bmlxKG9yZ19pZHMpXG5cdFx0XHRcdHVzZXJzX3RvX3hscyA9IGRiLnNwYWNlX3VzZXJzLmZpbmQoe3NwYWNlOnNwYWNlX2lkLG9yZ2FuaXphdGlvbnM6eyRpbjpvcmdfaWRzfX0se3NvcnQ6IHtzb3J0X25vOiAtMSxuYW1lOjF9fSkuZmV0Y2goKVxuXHRcdFx0ZWpzID0gcmVxdWlyZSgnZWpzJylcblx0XHRcdHN0ciA9IEFzc2V0cy5nZXRUZXh0KCdzZXJ2ZXIvZWpzL2V4cG9ydF9zcGFjZV91c2Vycy5lanMnKVxuXHRcdFx0XG5cdFx0XHQjIOajgOa1i+aYr+WQpuacieivreazlemUmeivr1xuXHRcdFx0ZWpzTGludCA9IHJlcXVpcmUoJ2Vqcy1saW50Jylcblx0XHRcdGVycm9yX29iaiA9IGVqc0xpbnQubGludChzdHIsIHt9KVxuXHRcdFx0aWYgZXJyb3Jfb2JqXG5cdFx0XHRcdGNvbnNvbGUuZXJyb3IgXCI9PT0vYXBpL2NvbnRhY3RzL2V4cG9ydC9zcGFjZV91c2VyczpcIlxuXHRcdFx0XHRjb25zb2xlLmVycm9yIGVycm9yX29ialxuXG5cdFx0XHR0ZW1wbGF0ZSA9IGVqcy5jb21waWxlKHN0cilcblxuXHRcdFx0bGFuZyA9ICdlbidcblx0XHRcdGlmIGN1cnJlbnRfdXNlcl9pbmZvLmxvY2FsZSBpcyAnemgtY24nXG5cdFx0XHRcdGxhbmcgPSAnemgtQ04nXG5cblx0XHRcdG9yZ05hbWUgPSBpZiBvcmcgdGhlbiBvcmcuZnVsbG5hbWUgZWxzZSBvcmdfaWRcblx0XHRcdGZpZWxkcyA9IFt7XG5cdFx0XHRcdFx0dHlwZTogJ1N0cmluZycsXG5cdFx0XHRcdFx0bmFtZTonbmFtZScsXG5cdFx0XHRcdFx0d2lkdGg6IDYwLFxuXHRcdFx0XHRcdHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc19uYW1lJyx7fSxsYW5nKVxuXHRcdFx0XHR9LHtcblx0XHRcdFx0XHR0eXBlOiAnU3RyaW5nJyxcblx0XHRcdFx0XHRuYW1lOidtb2JpbGUnLFxuXHRcdFx0XHRcdHdpZHRoOiAxMDAsXG5cdFx0XHRcdFx0dGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX21vYmlsZScse30sbGFuZylcblx0XHRcdFx0fSx7XG5cdFx0XHRcdFx0dHlwZTogJ1N0cmluZycsXG5cdFx0XHRcdFx0bmFtZTond29ya19waG9uZScsXG5cdFx0XHRcdFx0d2lkdGg6IDEwMCxcblx0XHRcdFx0XHR0aXRsZTogVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfd29ya19waG9uZScse30sbGFuZylcblx0XHRcdFx0fSx7XG5cdFx0XHRcdFx0dHlwZTogJ1N0cmluZycsXG5cdFx0XHRcdFx0bmFtZTonZW1haWwnLFxuXHRcdFx0XHRcdHdpZHRoOiAxMDAsXG5cdFx0XHRcdFx0dGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX2VtYWlsJyx7fSxsYW5nKVxuXHRcdFx0XHR9LHtcblx0XHRcdFx0XHR0eXBlOiAnU3RyaW5nJyxcblx0XHRcdFx0XHRuYW1lOidjb21wYW55Jyxcblx0XHRcdFx0XHR3aWR0aDogMTAwLFxuXHRcdFx0XHRcdHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc19jb21wYW55Jyx7fSxsYW5nKVxuXHRcdFx0XHR9LHtcblx0XHRcdFx0XHR0eXBlOiAnU3RyaW5nJyxcblx0XHRcdFx0XHRuYW1lOidwb3NpdGlvbicsXG5cdFx0XHRcdFx0d2lkdGg6IDEwMCxcblx0XHRcdFx0XHR0aXRsZTogVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfcG9zaXRpb24nLHt9LGxhbmcpXG5cdFx0XHRcdH0se1xuXHRcdFx0XHRcdHR5cGU6ICdTdHJpbmcnLFxuXHRcdFx0XHRcdG5hbWU6J29yZ2FuaXphdGlvbnMnLFxuXHRcdFx0XHRcdHdpZHRoOiA2MDAsXG5cdFx0XHRcdFx0dGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX29yZ2FuaXphdGlvbnMnLHt9LGxhbmcpLFxuXHRcdFx0XHRcdHRyYW5zZm9ybTogKHZhbHVlKS0+XG5cdFx0XHRcdFx0XHRvcmdOYW1lcyA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZCh7X2lkOiB7JGluOiB2YWx1ZX19LHtmaWVsZHM6IHtmdWxsbmFtZTogMX19KS5tYXAoKGl0ZW0saW5kZXgpLT5cblx0XHRcdFx0XHRcdFx0cmV0dXJuIGl0ZW0uZnVsbG5hbWVcblx0XHRcdFx0XHRcdClcblx0XHRcdFx0XHRcdHJldHVybiBvcmdOYW1lcy5qb2luKFwiLFwiKVxuXHRcdFx0XHR9LHtcblx0XHRcdFx0XHR0eXBlOiAnU3RyaW5nJyxcblx0XHRcdFx0XHRuYW1lOidtYW5hZ2VyJyxcblx0XHRcdFx0XHR3aWR0aDogNjAsXG5cdFx0XHRcdFx0dGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX21hbmFnZXInLHt9LGxhbmcpXG5cdFx0XHRcdFx0dHJhbnNmb3JtOiAodmFsdWUpLT5cblx0XHRcdFx0XHRcdHVzZXIgPSBkYi51c2Vycy5maW5kT25lKHtfaWQ6IHZhbHVlfSx7ZmllbGRzOiB7bmFtZTogMX19KVxuXHRcdFx0XHRcdFx0cmV0dXJuIHVzZXI/Lm5hbWVcblx0XHRcdFx0fSx7XG5cdFx0XHRcdFx0dHlwZTogJ1N0cmluZycsXG5cdFx0XHRcdFx0bmFtZTondXNlcicsXG5cdFx0XHRcdFx0d2lkdGg6IDYwLFxuXHRcdFx0XHRcdHRpdGxlOiBUQVBpMThuLl9fKCd1c2Vyc191c2VybmFtZScse30sbGFuZylcblx0XHRcdFx0XHR0cmFuc2Zvcm06ICh2YWx1ZSktPlxuXHRcdFx0XHRcdFx0dXNlciA9IGRiLnVzZXJzLmZpbmRPbmUoe19pZDogdmFsdWV9LHtmaWVsZHM6IHt1c2VybmFtZTogMX19KVxuXHRcdFx0XHRcdFx0cmV0dXJuIHVzZXI/LnVzZXJuYW1lXG5cdFx0XHRcdH0se1xuXHRcdFx0XHRcdHR5cGU6ICdOdW1iZXInLFxuXHRcdFx0XHRcdG5hbWU6J3NvcnRfbm8nLFxuXHRcdFx0XHRcdHdpZHRoOiAzNSxcblx0XHRcdFx0XHR0aXRsZTogVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfc29ydF9ubycse30sbGFuZylcblx0XHRcdFx0fSx7XG5cdFx0XHRcdFx0dHlwZTogJ1N0cmluZycsXG5cdFx0XHRcdFx0bmFtZTondXNlcl9hY2NlcHRlZCcsXG5cdFx0XHRcdFx0d2lkdGg6IDM1LFxuXHRcdFx0XHRcdHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc191c2VyX2FjY2VwdGVkJyx7fSxsYW5nKVxuXHRcdFx0XHRcdHRyYW5zZm9ybTogKHZhbHVlKS0+XG5cdFx0XHRcdFx0XHRyZXR1cm4gaWYgdmFsdWUgdGhlbiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc191c2VyX2FjY2VwdGVkX3llcycse30sbGFuZykgZWxzZSBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc191c2VyX2FjY2VwdGVkX25vJyx7fSxsYW5nKVxuXHRcdFx0XHR9XVxuXHRcdFx0XG5cdFx0XHRzaGVldF9uYW1lID0gb3JnTmFtZT8ucmVwbGFjZSgvXFwvL2csXCItXCIpICPkuI3mlK/mjIFcIi9cIuespuWPt1xuXHRcdFx0cmV0ID0gdGVtcGxhdGUoe1xuXHRcdFx0XHRsYW5nOiBsYW5nLFxuXHRcdFx0XHRzaGVldF9uYW1lOiBzaGVldF9uYW1lLFxuXHRcdFx0XHRmaWVsZHM6IGZpZWxkcyxcblx0XHRcdFx0dXNlcnNfdG9feGxzOiB1c2Vyc190b194bHNcblx0XHRcdH0pXG5cblx0XHRcdGZpbGVOYW1lID0gXCJTdGVlZE9TQ29udGFjdHNfXCIgKyBtb21lbnQoKS5mb3JtYXQoJ1lZWVlNTURESEhtbScpICsgXCIueGxzXCJcblx0XHRcdHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LXR5cGVcIiwgXCJhcHBsaWNhdGlvbi9vY3RldC1zdHJlYW1cIilcblx0XHRcdHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LURpc3Bvc2l0aW9uXCIsIFwiYXR0YWNobWVudDtmaWxlbmFtZT1cIitlbmNvZGVVUkkoZmlsZU5hbWUpKVxuXHRcdFx0cmVzLmVuZChyZXQpXG5cdFx0Y2F0Y2ggZVxuXHRcdFx0Y29uc29sZS5lcnJvciBlLnN0YWNrXG5cdFx0XHRyZXMuZW5kKGUubWVzc2FnZSkiLCJNZXRlb3Iuc3RhcnR1cChmdW5jdGlvbigpIHtcbiAgcmV0dXJuIFdlYkFwcC5jb25uZWN0SGFuZGxlcnMudXNlKFwiL2FwaS9leHBvcnQvc3BhY2VfdXNlcnNcIiwgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgICB2YXIgY3VycmVudF91c2VyX2luZm8sIGUsIGVqcywgZWpzTGludCwgZXJyb3Jfb2JqLCBmaWVsZHMsIGZpbGVOYW1lLCBsYW5nLCBub3csIG9yZywgb3JnTmFtZSwgb3JnX2lkLCBvcmdfaWRzLCBvcmdfb2JqcywgcXVlcnksIHJldCwgc2hlZXRfbmFtZSwgc3BhY2VfaWQsIHN0ciwgdGVtcGxhdGUsIHVzZXJfaWQsIHVzZXJzX3RvX3hscztcbiAgICB0cnkge1xuICAgICAgY3VycmVudF91c2VyX2luZm8gPSB1dWZsb3dNYW5hZ2VyLmNoZWNrX2F1dGhvcml6YXRpb24ocmVxKTtcbiAgICAgIHF1ZXJ5ID0gcmVxLnF1ZXJ5O1xuICAgICAgc3BhY2VfaWQgPSBxdWVyeS5zcGFjZV9pZDtcbiAgICAgIG9yZ19pZCA9IHF1ZXJ5Lm9yZ19pZDtcbiAgICAgIHVzZXJfaWQgPSBxdWVyeVsnWC1Vc2VyLUlkJ107XG4gICAgICBvcmcgPSBkYi5vcmdhbml6YXRpb25zLmZpbmRPbmUoe1xuICAgICAgICBfaWQ6IG9yZ19pZFxuICAgICAgfSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBmdWxsbmFtZTogMVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHVzZXJzX3RvX3hscyA9IG5ldyBBcnJheTtcbiAgICAgIG5vdyA9IG5ldyBEYXRlO1xuICAgICAgaWYgKFN0ZWVkb3MuaXNTcGFjZUFkbWluKHNwYWNlX2lkLCB1c2VyX2lkKSkge1xuICAgICAgICB1c2Vyc190b194bHMgPSBkYi5zcGFjZV91c2Vycy5maW5kKHtcbiAgICAgICAgICBzcGFjZTogc3BhY2VfaWRcbiAgICAgICAgfSwge1xuICAgICAgICAgIHNvcnQ6IHtcbiAgICAgICAgICAgIG5hbWU6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmZldGNoKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcmdfaWRzID0gW107XG4gICAgICAgIG9yZ19vYmpzID0gZGIub3JnYW5pemF0aW9ucy5maW5kKHtcbiAgICAgICAgICBfaWQ6IG9yZ19pZCxcbiAgICAgICAgICBzcGFjZTogc3BhY2VfaWRcbiAgICAgICAgfSwge1xuICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgX2lkOiAxLFxuICAgICAgICAgICAgY2hpbGRyZW46IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmZldGNoKCk7XG4gICAgICAgIG9yZ19pZHMgPSBfLnBsdWNrKG9yZ19vYmpzLCAnX2lkJyk7XG4gICAgICAgIF8uZWFjaChvcmdfb2JqcywgZnVuY3Rpb24ob3JnX29iaikge1xuICAgICAgICAgIHJldHVybiBvcmdfaWRzID0gXy51bmlvbihvcmdfaWRzLCBvcmdfb2JqICE9IG51bGwgPyBvcmdfb2JqLmNoaWxkcmVuIDogdm9pZCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIF8udW5pcShvcmdfaWRzKTtcbiAgICAgICAgdXNlcnNfdG9feGxzID0gZGIuc3BhY2VfdXNlcnMuZmluZCh7XG4gICAgICAgICAgc3BhY2U6IHNwYWNlX2lkLFxuICAgICAgICAgIG9yZ2FuaXphdGlvbnM6IHtcbiAgICAgICAgICAgICRpbjogb3JnX2lkc1xuICAgICAgICAgIH1cbiAgICAgICAgfSwge1xuICAgICAgICAgIHNvcnQ6IHtcbiAgICAgICAgICAgIHNvcnRfbm86IC0xLFxuICAgICAgICAgICAgbmFtZTogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSkuZmV0Y2goKTtcbiAgICAgIH1cbiAgICAgIGVqcyA9IHJlcXVpcmUoJ2VqcycpO1xuICAgICAgc3RyID0gQXNzZXRzLmdldFRleHQoJ3NlcnZlci9lanMvZXhwb3J0X3NwYWNlX3VzZXJzLmVqcycpO1xuICAgICAgZWpzTGludCA9IHJlcXVpcmUoJ2Vqcy1saW50Jyk7XG4gICAgICBlcnJvcl9vYmogPSBlanNMaW50LmxpbnQoc3RyLCB7fSk7XG4gICAgICBpZiAoZXJyb3Jfb2JqKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCI9PT0vYXBpL2NvbnRhY3RzL2V4cG9ydC9zcGFjZV91c2VyczpcIik7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3Jfb2JqKTtcbiAgICAgIH1cbiAgICAgIHRlbXBsYXRlID0gZWpzLmNvbXBpbGUoc3RyKTtcbiAgICAgIGxhbmcgPSAnZW4nO1xuICAgICAgaWYgKGN1cnJlbnRfdXNlcl9pbmZvLmxvY2FsZSA9PT0gJ3poLWNuJykge1xuICAgICAgICBsYW5nID0gJ3poLUNOJztcbiAgICAgIH1cbiAgICAgIG9yZ05hbWUgPSBvcmcgPyBvcmcuZnVsbG5hbWUgOiBvcmdfaWQ7XG4gICAgICBmaWVsZHMgPSBbXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnU3RyaW5nJyxcbiAgICAgICAgICBuYW1lOiAnbmFtZScsXG4gICAgICAgICAgd2lkdGg6IDYwLFxuICAgICAgICAgIHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc19uYW1lJywge30sIGxhbmcpXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlOiAnU3RyaW5nJyxcbiAgICAgICAgICBuYW1lOiAnbW9iaWxlJyxcbiAgICAgICAgICB3aWR0aDogMTAwLFxuICAgICAgICAgIHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc19tb2JpbGUnLCB7fSwgbGFuZylcbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6ICdTdHJpbmcnLFxuICAgICAgICAgIG5hbWU6ICd3b3JrX3Bob25lJyxcbiAgICAgICAgICB3aWR0aDogMTAwLFxuICAgICAgICAgIHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc193b3JrX3Bob25lJywge30sIGxhbmcpXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlOiAnU3RyaW5nJyxcbiAgICAgICAgICBuYW1lOiAnZW1haWwnLFxuICAgICAgICAgIHdpZHRoOiAxMDAsXG4gICAgICAgICAgdGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX2VtYWlsJywge30sIGxhbmcpXG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlOiAnU3RyaW5nJyxcbiAgICAgICAgICBuYW1lOiAnY29tcGFueScsXG4gICAgICAgICAgd2lkdGg6IDEwMCxcbiAgICAgICAgICB0aXRsZTogVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfY29tcGFueScsIHt9LCBsYW5nKVxuICAgICAgICB9LCB7XG4gICAgICAgICAgdHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgbmFtZTogJ3Bvc2l0aW9uJyxcbiAgICAgICAgICB3aWR0aDogMTAwLFxuICAgICAgICAgIHRpdGxlOiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc19wb3NpdGlvbicsIHt9LCBsYW5nKVxuICAgICAgICB9LCB7XG4gICAgICAgICAgdHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgbmFtZTogJ29yZ2FuaXphdGlvbnMnLFxuICAgICAgICAgIHdpZHRoOiA2MDAsXG4gICAgICAgICAgdGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX29yZ2FuaXphdGlvbnMnLCB7fSwgbGFuZyksXG4gICAgICAgICAgdHJhbnNmb3JtOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgdmFyIG9yZ05hbWVzO1xuICAgICAgICAgICAgb3JnTmFtZXMgPSBkYi5vcmdhbml6YXRpb25zLmZpbmQoe1xuICAgICAgICAgICAgICBfaWQ6IHtcbiAgICAgICAgICAgICAgICAkaW46IHZhbHVlXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgZnVsbG5hbWU6IDFcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkubWFwKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVtLmZ1bGxuYW1lO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gb3JnTmFtZXMuam9pbihcIixcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9LCB7XG4gICAgICAgICAgdHlwZTogJ1N0cmluZycsXG4gICAgICAgICAgbmFtZTogJ21hbmFnZXInLFxuICAgICAgICAgIHdpZHRoOiA2MCxcbiAgICAgICAgICB0aXRsZTogVEFQaTE4bi5fXygnc3BhY2VfdXNlcnNfbWFuYWdlcicsIHt9LCBsYW5nKSxcbiAgICAgICAgICB0cmFuc2Zvcm06IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgdXNlcjtcbiAgICAgICAgICAgIHVzZXIgPSBkYi51c2Vycy5maW5kT25lKHtcbiAgICAgICAgICAgICAgX2lkOiB2YWx1ZVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICBuYW1lOiAxXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHVzZXIgIT0gbnVsbCA/IHVzZXIubmFtZSA6IHZvaWQgMDtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHtcbiAgICAgICAgICB0eXBlOiAnU3RyaW5nJyxcbiAgICAgICAgICBuYW1lOiAndXNlcicsXG4gICAgICAgICAgd2lkdGg6IDYwLFxuICAgICAgICAgIHRpdGxlOiBUQVBpMThuLl9fKCd1c2Vyc191c2VybmFtZScsIHt9LCBsYW5nKSxcbiAgICAgICAgICB0cmFuc2Zvcm06IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgICB2YXIgdXNlcjtcbiAgICAgICAgICAgIHVzZXIgPSBkYi51c2Vycy5maW5kT25lKHtcbiAgICAgICAgICAgICAgX2lkOiB2YWx1ZVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgICAgICB1c2VybmFtZTogMVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiB1c2VyICE9IG51bGwgPyB1c2VyLnVzZXJuYW1lIDogdm9pZCAwO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6ICdOdW1iZXInLFxuICAgICAgICAgIG5hbWU6ICdzb3J0X25vJyxcbiAgICAgICAgICB3aWR0aDogMzUsXG4gICAgICAgICAgdGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX3NvcnRfbm8nLCB7fSwgbGFuZylcbiAgICAgICAgfSwge1xuICAgICAgICAgIHR5cGU6ICdTdHJpbmcnLFxuICAgICAgICAgIG5hbWU6ICd1c2VyX2FjY2VwdGVkJyxcbiAgICAgICAgICB3aWR0aDogMzUsXG4gICAgICAgICAgdGl0bGU6IFRBUGkxOG4uX18oJ3NwYWNlX3VzZXJzX3VzZXJfYWNjZXB0ZWQnLCB7fSwgbGFuZyksXG4gICAgICAgICAgdHJhbnNmb3JtOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgICAgICAgIHJldHVybiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc191c2VyX2FjY2VwdGVkX3llcycsIHt9LCBsYW5nKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBUQVBpMThuLl9fKCdzcGFjZV91c2Vyc191c2VyX2FjY2VwdGVkX25vJywge30sIGxhbmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgXTtcbiAgICAgIHNoZWV0X25hbWUgPSBvcmdOYW1lICE9IG51bGwgPyBvcmdOYW1lLnJlcGxhY2UoL1xcLy9nLCBcIi1cIikgOiB2b2lkIDA7XG4gICAgICByZXQgPSB0ZW1wbGF0ZSh7XG4gICAgICAgIGxhbmc6IGxhbmcsXG4gICAgICAgIHNoZWV0X25hbWU6IHNoZWV0X25hbWUsXG4gICAgICAgIGZpZWxkczogZmllbGRzLFxuICAgICAgICB1c2Vyc190b194bHM6IHVzZXJzX3RvX3hsc1xuICAgICAgfSk7XG4gICAgICBmaWxlTmFtZSA9IFwiU3RlZWRPU0NvbnRhY3RzX1wiICsgbW9tZW50KCkuZm9ybWF0KCdZWVlZTU1EREhIbW0nKSArIFwiLnhsc1wiO1xuICAgICAgcmVzLnNldEhlYWRlcihcIkNvbnRlbnQtdHlwZVwiLCBcImFwcGxpY2F0aW9uL29jdGV0LXN0cmVhbVwiKTtcbiAgICAgIHJlcy5zZXRIZWFkZXIoXCJDb250ZW50LURpc3Bvc2l0aW9uXCIsIFwiYXR0YWNobWVudDtmaWxlbmFtZT1cIiArIGVuY29kZVVSSShmaWxlTmFtZSkpO1xuICAgICAgcmV0dXJuIHJlcy5lbmQocmV0KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgZSA9IGVycm9yO1xuICAgICAgY29uc29sZS5lcnJvcihlLnN0YWNrKTtcbiAgICAgIHJldHVybiByZXMuZW5kKGUubWVzc2FnZSk7XG4gICAgfVxuICB9KTtcbn0pO1xuIl19
