(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ReactiveVar = Package['reactive-var'].ReactiveVar;
var ReactiveDict = Package['reactive-dict'].ReactiveDict;
var ECMAScript = Package.ecmascript.ECMAScript;
var Random = Package.random.Random;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var check = Package.check.check;
var Match = Package.check.Match;
var DDPRateLimiter = Package['ddp-rate-limiter'].DDPRateLimiter;
var _ = Package.underscore._;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var Blaze = Package.ui.Blaze;
var UI = Package.ui.UI;
var Handlebars = Package.ui.Handlebars;
var JsonRoutes = Package['simple:json-routes'].JsonRoutes;
var RestMiddleware = Package['simple:json-routes'].RestMiddleware;
var Restivus = Package['nimble:restivus'].Restivus;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var Tabular = Package['aldeed:tabular'].Tabular;
var CollectionHooks = Package['matb33:collection-hooks'].CollectionHooks;
var BlazeLayout = Package['kadira:blaze-layout'].BlazeLayout;
var FlowRouter = Package['kadira:flow-router'].FlowRouter;
var Template = Package['meteorhacks:ssr'].Template;
var SSR = Package['meteorhacks:ssr'].SSR;
var SubsManager = Package['meteorhacks:subs-manager'].SubsManager;
var WebApp = Package.webapp.WebApp;
var WebAppInternals = Package.webapp.WebAppInternals;
var main = Package.webapp.main;
var Accounts = Package['accounts-base'].Accounts;
var Selector = Package['steedos:base'].Selector;
var Steedos = Package['steedos:base'].Steedos;
var AjaxCollection = Package['steedos:base'].AjaxCollection;
var SteedosDataManager = Package['steedos:base'].SteedosDataManager;
var SteedosOffice = Package['steedos:base'].SteedosOffice;
var billingManager = Package['steedos:base'].billingManager;
var Theme = Package['steedos:theme'].Theme;
var CFDataManager = Package['steedos:autoform'].CFDataManager;
var Push = Package['raix:push'].Push;
var Logger = Package['steedos:logger'].Logger;
var _i18n = Package['universe:i18n']._i18n;
var i18n = Package['universe:i18n'].i18n;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var meteorInstall = Package.modules.meteorInstall;
var HTML = Package.htmljs.HTML;
var Collection2 = Package['aldeed:collection2-core'].Collection2;
var FS = Package['steedos:cfs-base-package'].FS;
var Spacebars = Package.spacebars.Spacebars;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var __coffeescriptShare, permissionManagerForInitApproval, uuflowManagerForInitApproval;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:creator":{"checkNpm.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/checkNpm.js                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
let checkNpmVersions;
module.link("meteor/tmeasday:check-npm-versions", {
  checkNpmVersions(v) {
    checkNpmVersions = v;
  }

}, 0);
checkNpmVersions({
  busboy: "^0.2.13",
  mkdirp: "^0.3.5",
  "xml2js": "^0.4.19",
  "node-xlsx": "^0.12.0"
}, 'steedos:creator');

if (Meteor.settings && Meteor.settings.cfs && Meteor.settings.cfs.aliyun) {
  checkNpmVersions({
    "aliyun-sdk": "^1.11.12"
  }, 'steedos:creator');
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"core.coffee":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/core.coffee                                                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Creator.getSchema = function (object_name) {
  var ref;
  return (ref = Creator.getObject(object_name)) != null ? ref.schema : void 0;
};

Creator.getObjectUrl = function (object_name, record_id, app_id) {
  var list_view, list_view_id;

  if (!app_id) {
    app_id = Session.get("app_id");
  }

  if (!object_name) {
    object_name = Session.get("object_name");
  }

  list_view = Creator.getListView(object_name, null);
  list_view_id = list_view != null ? list_view._id : void 0;

  if (record_id) {
    return Creator.getRelativeUrl("/app/" + app_id + "/" + object_name + "/view/" + record_id);
  } else {
    if (object_name === "meeting") {
      return Creator.getRelativeUrl("/app/" + app_id + "/" + object_name + "/calendar/");
    } else {
      return Creator.getRelativeUrl("/app/" + app_id + "/" + object_name + "/grid/" + list_view_id);
    }
  }
};

Creator.getObjectAbsoluteUrl = function (object_name, record_id, app_id) {
  var list_view, list_view_id;

  if (!app_id) {
    app_id = Session.get("app_id");
  }

  if (!object_name) {
    object_name = Session.get("object_name");
  }

  list_view = Creator.getListView(object_name, null);
  list_view_id = list_view != null ? list_view._id : void 0;

  if (record_id) {
    return Steedos.absoluteUrl("/app/" + app_id + "/" + object_name + "/view/" + record_id, true);
  } else {
    if (object_name === "meeting") {
      return Steedos.absoluteUrl("/app/" + app_id + "/" + object_name + "/calendar/", true);
    } else {
      return Steedos.absoluteUrl("/app/" + app_id + "/" + object_name + "/grid/" + list_view_id, true);
    }
  }
};

Creator.getObjectRouterUrl = function (object_name, record_id, app_id) {
  var list_view, list_view_id;

  if (!app_id) {
    app_id = Session.get("app_id");
  }

  if (!object_name) {
    object_name = Session.get("object_name");
  }

  list_view = Creator.getListView(object_name, null);
  list_view_id = list_view != null ? list_view._id : void 0;

  if (record_id) {
    return "/app/" + app_id + "/" + object_name + "/view/" + record_id;
  } else {
    if (object_name === "meeting") {
      return "/app/" + app_id + "/" + object_name + "/calendar/";
    } else {
      return "/app/" + app_id + "/" + object_name + "/grid/" + list_view_id;
    }
  }
};

Creator.getListViewUrl = function (object_name, app_id, list_view_id) {
  var url;
  url = Creator.getListViewRelativeUrl(object_name, app_id, list_view_id);
  return Creator.getRelativeUrl(url);
};

Creator.getListViewRelativeUrl = function (object_name, app_id, list_view_id) {
  if (list_view_id === "calendar") {
    return "/app/" + app_id + "/" + object_name + "/calendar/";
  } else {
    return "/app/" + app_id + "/" + object_name + "/grid/" + list_view_id;
  }
};

Creator.getSwitchListUrl = function (object_name, app_id, list_view_id) {
  if (list_view_id) {
    return Creator.getRelativeUrl("/app/" + app_id + "/" + object_name + "/" + list_view_id + "/list");
  } else {
    return Creator.getRelativeUrl("/app/" + app_id + "/" + object_name + "/list/switch");
  }
};

Creator.getRelatedObjectUrl = function (object_name, app_id, record_id, related_object_name) {
  return Creator.getRelativeUrl("/app/" + app_id + "/" + object_name + "/" + record_id + "/" + related_object_name + "/grid");
};

Creator.getObjectLookupFieldOptions = function (object_name, is_deep, is_skip_hide, is_related) {
  var _object, _options, fields, icon, relatedObjects;

  _options = [];

  if (!object_name) {
    return _options;
  }

  _object = Creator.getObject(object_name);
  fields = _object != null ? _object.fields : void 0;
  icon = _object != null ? _object.icon : void 0;

  _.forEach(fields, function (f, k) {
    if (is_skip_hide && f.hidden) {
      return;
    }

    if (f.type === "select") {
      return _options.push({
        label: "" + (f.label || k),
        value: "" + k,
        icon: icon
      });
    } else {
      return _options.push({
        label: f.label || k,
        value: k,
        icon: icon
      });
    }
  });

  if (is_deep) {
    _.forEach(fields, function (f, k) {
      var r_object;

      if (is_skip_hide && f.hidden) {
        return;
      }

      if ((f.type === "lookup" || f.type === "master_detail") && f.reference_to && _.isString(f.reference_to)) {
        r_object = Creator.getObject(f.reference_to);

        if (r_object) {
          return _.forEach(r_object.fields, function (f2, k2) {
            return _options.push({
              label: (f.label || k) + "=>" + (f2.label || k2),
              value: k + "." + k2,
              icon: r_object != null ? r_object.icon : void 0
            });
          });
        }
      }
    });
  }

  if (is_related) {
    relatedObjects = Creator.getRelatedObjects(object_name);

    _.each(relatedObjects, function (_this) {
      return function (_relatedObject) {
        var relatedObject, relatedOptions;
        relatedOptions = Creator.getObjectLookupFieldOptions(_relatedObject.object_name, false, false, false);
        relatedObject = Creator.getObject(_relatedObject.object_name);
        return _.each(relatedOptions, function (relatedOption) {
          if (_relatedObject.foreign_key !== relatedOption.value) {
            return _options.push({
              label: (relatedObject.label || relatedObject.name) + "=>" + relatedOption.label,
              value: relatedObject.name + "." + relatedOption.value,
              icon: relatedObject != null ? relatedObject.icon : void 0
            });
          }
        });
      };
    }(this));
  }

  return _options;
};

Creator.getObjectFilterFieldOptions = function (object_name) {
  var _object, _options, fields, icon, permission_fields;

  _options = [];

  if (!object_name) {
    return _options;
  }

  _object = Creator.getObject(object_name);
  fields = _object != null ? _object.fields : void 0;
  permission_fields = Creator.getFields(object_name);
  icon = _object != null ? _object.icon : void 0;

  _.forEach(fields, function (f, k) {
    if (!_.include(["grid", "object", "[Object]", "[object]", "Object", "avatar", "image", "markdown", "html"], f.type) && !f.hidden) {
      if (!/\w+\./.test(k) && _.indexOf(permission_fields, k) > -1) {
        return _options.push({
          label: f.label || k,
          value: k,
          icon: icon
        });
      }
    }
  });

  return _options;
};

Creator.getObjectFieldOptions = function (object_name) {
  var _object, _options, fields, icon, permission_fields;

  _options = [];

  if (!object_name) {
    return _options;
  }

  _object = Creator.getObject(object_name);
  fields = _object != null ? _object.fields : void 0;
  permission_fields = Creator.getFields(object_name);
  icon = _object != null ? _object.icon : void 0;

  _.forEach(fields, function (f, k) {
    if (!_.include(["grid", "object", "[Object]", "[object]", "Object", "avatar", "image", "markdown", "html"], f.type)) {
      if (!/\w+\./.test(k) && _.indexOf(permission_fields, k) > -1) {
        return _options.push({
          label: f.label || k,
          value: k,
          icon: icon
        });
      }
    }
  });

  return _options;
}; /*
   filters: 要转换的filters
   fields: 对象字段
   filter_fields: 默认过滤字段，支持字符串数组和对象数组两种格式，如:['filed_name1','filed_name2'],[{field:'filed_name1',required:true}]
   处理逻辑: 把filters中存在于filter_fields的过滤条件增加每项的is_default、is_required属性，不存在于filter_fields的过滤条件对应的移除每项的相关属性
   返回结果: 处理后的filters
    */

Creator.getFiltersWithFilterFields = function (filters, fields, filter_fields) {
  if (!filters) {
    filters = [];
  }

  if (!filter_fields) {
    filter_fields = [];
  }

  if (filter_fields != null ? filter_fields.length : void 0) {
    filter_fields.forEach(function (n) {
      if (_.isString(n)) {
        n = {
          field: n,
          required: false
        };
      }

      if (fields[n.field] && !_.findWhere(filters, {
        field: n.field
      })) {
        return filters.push({
          field: n.field,
          is_default: true,
          is_required: n.required
        });
      }
    });
  }

  filters.forEach(function (filterItem) {
    var matchField;
    matchField = filter_fields.find(function (n) {
      return n === filterItem.field || n.field === filterItem.field;
    });

    if (_.isString(matchField)) {
      matchField = {
        field: matchField,
        required: false
      };
    }

    if (matchField) {
      filterItem.is_default = true;
      return filterItem.is_required = matchField.required;
    } else {
      delete filterItem.is_default;
      return delete filterItem.is_required;
    }
  });
  return filters;
};

Creator.getObjectRecord = function (object_name, record_id, select_fields, expand) {
  var collection, record, ref, ref1, ref2;

  if (!object_name) {
    object_name = Session.get("object_name");
  }

  if (!record_id) {
    record_id = Session.get("record_id");
  }

  if (Meteor.isClient) {
    if (object_name === Session.get("object_name") && record_id === Session.get("record_id")) {
      if ((ref = Template.instance()) != null ? ref.record : void 0) {
        return (ref1 = Template.instance()) != null ? (ref2 = ref1.record) != null ? ref2.get() : void 0 : void 0;
      }
    } else {
      return Creator.odata.get(object_name, record_id, select_fields, expand);
    }
  }

  collection = Creator.getCollection(object_name);

  if (collection) {
    record = collection.findOne(record_id);
    return record;
  }
};

Creator.getObjectRecordName = function (record, object_name) {
  var name_field_key, ref;

  if (!record) {
    record = Creator.getObjectRecord();
  }

  if (record) {
    name_field_key = object_name === "organizations" ? "name" : (ref = Creator.getObject(object_name)) != null ? ref.NAME_FIELD_KEY : void 0;

    if (record && name_field_key) {
      return record.label || record[name_field_key];
    }
  }
};

Creator.getApp = function (app_id) {
  var app, ref, ref1;

  if (!app_id) {
    app_id = Session.get("app_id");
  }

  app = Creator.Apps[app_id];

  if ((ref = Creator.deps) != null) {
    if ((ref1 = ref.app) != null) {
      ref1.depend();
    }
  }

  return app;
};

Creator.getAppDashboard = function (app_id) {
  var app, dashboard;
  app = Creator.getApp(app_id);

  if (!app) {
    return;
  }

  dashboard = null;

  _.each(Creator.Dashboards, function (v, k) {
    var ref;

    if (((ref = v.apps) != null ? ref.indexOf(app._id) : void 0) > -1) {
      return dashboard = v;
    }
  });

  return dashboard;
};

Creator.getAppDashboardComponent = function (app_id) {
  var app;
  app = Creator.getApp(app_id);

  if (!app) {
    return;
  }

  return ReactSteedos.pluginComponentSelector(ReactSteedos.store.getState(), "Dashboard", app._id);
};

Creator.getAppObjectNames = function (app_id) {
  var app, appObjects, isMobile, objects;
  app = Creator.getApp(app_id);

  if (!app) {
    return;
  }

  isMobile = Steedos.isMobile();
  appObjects = isMobile ? app.mobile_objects : app.objects;
  objects = [];

  if (app) {
    _.each(appObjects, function (v) {
      var obj;
      obj = Creator.getObject(v);

      if (obj != null ? obj.permissions.get().allowRead : void 0) {
        return objects.push(v);
      }
    });
  }

  return objects;
};

Creator.getVisibleApps = function (includeAdmin) {
  var changeApp;
  changeApp = Creator._subApp.get();
  ReactSteedos.store.getState().entities.apps = Object.assign({}, ReactSteedos.store.getState().entities.apps, {
    apps: changeApp
  });
  return ReactSteedos.visibleAppsSelector(ReactSteedos.store.getState(), includeAdmin);
};

Creator.getVisibleAppsObjects = function () {
  var apps, objects, visibleObjectNames;
  apps = Creator.getVisibleApps();
  visibleObjectNames = _.flatten(_.pluck(apps, 'objects'));
  objects = _.filter(Creator.Objects, function (obj) {
    if (visibleObjectNames.indexOf(obj.name) < 0) {
      return false;
    } else {
      return true;
    }
  });
  objects = objects.sort(Creator.sortingMethod.bind({
    key: "label"
  }));
  objects = _.pluck(objects, 'name');
  return _.uniq(objects);
};

Creator.getAppsObjects = function () {
  var objects, tempObjects;
  objects = [];
  tempObjects = [];

  _.forEach(Creator.Apps, function (app) {
    tempObjects = _.filter(app.objects, function (obj) {
      return !obj.hidden;
    });
    return objects = objects.concat(tempObjects);
  });

  return _.uniq(objects);
};

Creator.validateFilters = function (filters, logic) {
  var e, errorMsg, filter_items, filter_length, flag, index, word;
  filter_items = _.map(filters, function (obj) {
    if (_.isEmpty(obj)) {
      return false;
    } else {
      return obj;
    }
  });
  filter_items = _.compact(filter_items);
  errorMsg = "";
  filter_length = filter_items.length;

  if (logic) {
    logic = logic.replace(/\n/g, "").replace(/\s+/g, " ");

    if (/[._\-!+]+/ig.test(logic)) {
      errorMsg = "含有特殊字符。";
    }

    if (!errorMsg) {
      index = logic.match(/\d+/ig);

      if (!index) {
        errorMsg = "有些筛选条件进行了定义，但未在高级筛选条件中被引用。";
      } else {
        index.forEach(function (i) {
          if (i < 1 || i > filter_length) {
            return errorMsg = "您的筛选条件引用了未定义的筛选器：" + i + "。";
          }
        });
        flag = 1;

        while (flag <= filter_length) {
          if (!index.includes("" + flag)) {
            errorMsg = "有些筛选条件进行了定义，但未在高级筛选条件中被引用。";
          }

          flag++;
        }
      }
    }

    if (!errorMsg) {
      word = logic.match(/[a-zA-Z]+/ig);

      if (word) {
        word.forEach(function (w) {
          if (!/^(and|or)$/ig.test(w)) {
            return errorMsg = "检查您的高级筛选条件中的拼写。";
          }
        });
      }
    }

    if (!errorMsg) {
      try {
        Creator["eval"](logic.replace(/and/ig, "&&").replace(/or/ig, "||"));
      } catch (error) {
        e = error;
        errorMsg = "您的筛选器中含有特殊字符";
      }

      if (/(AND)[^()]+(OR)/ig.test(logic) || /(OR)[^()]+(AND)/ig.test(logic)) {
        errorMsg = "您的筛选器必须在连续性的 AND 和 OR 表达式前后使用括号。";
      }
    }
  }

  if (errorMsg) {
    console.log("error", errorMsg);

    if (Meteor.isClient) {
      toastr.error(errorMsg);
    }

    return false;
  } else {
    return true;
  }
}; /*
   options参数：
   	extend-- 是否需要把当前用户基本信息加入公式，即让公式支持Creator.USER_CONTEXT中的值，默认为true
   	userId-- 当前登录用户
   	spaceId-- 当前所在工作区
   extend为true时，后端需要额外传入userId及spaceId用于抓取Creator.USER_CONTEXT对应的值
    */

Creator.formatFiltersToMongo = function (filters, options) {
  var selector;

  if (!(filters != null ? filters.length : void 0)) {
    return;
  }

  if (!(filters[0] instanceof Array)) {
    filters = _.map(filters, function (obj) {
      return [obj.field, obj.operation, obj.value];
    });
  }

  selector = [];

  _.each(filters, function (filter) {
    var field, option, reg, sub_selector, value;
    field = filter[0];
    option = filter[1];

    if (Meteor.isClient) {
      value = Creator.evaluateFormula(filter[2]);
    } else {
      value = Creator.evaluateFormula(filter[2], null, options);
    }

    sub_selector = {};
    sub_selector[field] = {};

    if (option === "=") {
      sub_selector[field]["$eq"] = value;
    } else if (option === "<>") {
      sub_selector[field]["$ne"] = value;
    } else if (option === ">") {
      sub_selector[field]["$gt"] = value;
    } else if (option === ">=") {
      sub_selector[field]["$gte"] = value;
    } else if (option === "<") {
      sub_selector[field]["$lt"] = value;
    } else if (option === "<=") {
      sub_selector[field]["$lte"] = value;
    } else if (option === "startswith") {
      reg = new RegExp("^" + value, "i");
      sub_selector[field]["$regex"] = reg;
    } else if (option === "contains") {
      reg = new RegExp(value, "i");
      sub_selector[field]["$regex"] = reg;
    } else if (option === "notcontains") {
      reg = new RegExp("^((?!" + value + ").)*$", "i");
      sub_selector[field]["$regex"] = reg;
    }

    return selector.push(sub_selector);
  });

  return selector;
};

Creator.isBetweenFilterOperation = function (operation) {
  var ref;
  return operation === "between" || !!((ref = Creator.getBetweenTimeBuiltinValues(true)) != null ? ref[operation] : void 0);
}; /*
   options参数：
   	extend-- 是否需要把当前用户基本信息加入公式，即让公式支持Creator.USER_CONTEXT中的值，默认为true
   	userId-- 当前登录用户
   	spaceId-- 当前所在工作区
   	extend为true时，后端需要额外传入userId及spaceId用于抓取Creator.USER_CONTEXT对应的值
    */

Creator.formatFiltersToDev = function (filters, object_name, options) {
  var logicTempFilters, selector, steedosFilters;
  steedosFilters = require("@steedos/filters");

  if (!filters.length) {
    return;
  }

  if (options != null ? options.is_logic_or : void 0) {
    logicTempFilters = [];
    filters.forEach(function (n) {
      logicTempFilters.push(n);
      return logicTempFilters.push("or");
    });
    logicTempFilters.pop();
    filters = logicTempFilters;
  }

  selector = steedosFilters.formatFiltersToDev(filters, Creator.USER_CONTEXT);
  return selector;
}; /*
   options参数：
   	extend-- 是否需要把当前用户基本信息加入公式，即让公式支持Creator.USER_CONTEXT中的值，默认为true
   	userId-- 当前登录用户
   	spaceId-- 当前所在工作区
   extend为true时，后端需要额外传入userId及spaceId用于抓取Creator.USER_CONTEXT对应的值
    */

Creator.formatLogicFiltersToDev = function (filters, filter_logic, options) {
  var format_logic;
  format_logic = filter_logic.replace(/\(\s+/ig, "(").replace(/\s+\)/ig, ")").replace(/\(/g, "[").replace(/\)/g, "]").replace(/\s+/g, ",").replace(/(and|or)/ig, "'$1'");
  format_logic = format_logic.replace(/(\d)+/ig, function (x) {
    var _f, field, option, sub_selector, value;

    _f = filters[x - 1];
    field = _f.field;
    option = _f.operation;

    if (Meteor.isClient) {
      value = Creator.evaluateFormula(_f.value);
    } else {
      value = Creator.evaluateFormula(_f.value, null, options);
    }

    sub_selector = [];

    if (_.isArray(value) === true) {
      if (option === "=") {
        _.each(value, function (v) {
          return sub_selector.push([field, option, v], "or");
        });
      } else if (option === "<>") {
        _.each(value, function (v) {
          return sub_selector.push([field, option, v], "and");
        });
      } else {
        _.each(value, function (v) {
          return sub_selector.push([field, option, v], "or");
        });
      }

      if (sub_selector[sub_selector.length - 1] === "and" || sub_selector[sub_selector.length - 1] === "or") {
        sub_selector.pop();
      }
    } else {
      sub_selector = [field, option, value];
    }

    console.log("sub_selector", sub_selector);
    return JSON.stringify(sub_selector);
  });
  format_logic = "[" + format_logic + "]";
  return Creator["eval"](format_logic);
};

Creator.getRelatedObjects = function (object_name, spaceId, userId) {
  var _object, permissions, related_object_names, related_objects, unrelated_objects;

  if (Meteor.isClient) {
    if (!object_name) {
      object_name = Session.get("object_name");
    }

    if (!spaceId) {
      spaceId = Session.get("spaceId");
    }

    if (!userId) {
      userId = Meteor.userId();
    }
  }

  related_object_names = [];
  _object = Creator.getObject(object_name);

  if (!_object) {
    return related_object_names;
  }

  related_objects = Creator.getObjectRelateds(_object._collection_name);
  related_object_names = _.pluck(related_objects, "object_name");

  if ((related_object_names != null ? related_object_names.length : void 0) === 0) {
    return related_object_names;
  }

  permissions = Creator.getPermissions(object_name, spaceId, userId);
  unrelated_objects = permissions.unrelated_objects;
  related_object_names = _.difference(related_object_names, unrelated_objects);
  return _.filter(related_objects, function (related_object) {
    var allowRead, isActive, ref, related_object_name;
    related_object_name = related_object.object_name;
    isActive = related_object_names.indexOf(related_object_name) > -1;
    allowRead = (ref = Creator.getPermissions(related_object_name, spaceId, userId)) != null ? ref.allowRead : void 0;
    return isActive && allowRead;
  });
};

Creator.getRelatedObjectNames = function (object_name, spaceId, userId) {
  var related_objects;
  related_objects = Creator.getRelatedObjects(object_name, spaceId, userId);
  return _.pluck(related_objects, "object_name");
};

Creator.getActions = function (object_name, spaceId, userId) {
  var actions, disabled_actions, obj, permissions, ref, ref1;

  if (Meteor.isClient) {
    if (!object_name) {
      object_name = Session.get("object_name");
    }

    if (!spaceId) {
      spaceId = Session.get("spaceId");
    }

    if (!userId) {
      userId = Meteor.userId();
    }
  }

  obj = Creator.getObject(object_name);

  if (!obj) {
    return;
  }

  permissions = Creator.getPermissions(object_name, spaceId, userId);
  disabled_actions = permissions.disabled_actions;
  actions = _.sortBy(_.values(obj.actions), 'sort');

  if (_.has(obj, 'allow_actions')) {
    actions = _.filter(actions, function (action) {
      return _.include(obj.allow_actions, action.name);
    });
  }

  _.each(actions, function (action) {
    if (Steedos.isMobile() && ["record", "record_only"].indexOf(action.on) > -1 && action.name !== 'standard_edit') {
      if (action.on === "record_only") {
        return action.on = 'record_only_more';
      } else {
        return action.on = 'record_more';
      }
    }
  });

  if (Steedos.isMobile() && ["cms_files", "cfs.files.filerecord"].indexOf(object_name) > -1) {
    if ((ref = actions.find(function (n) {
      return n.name === "standard_edit";
    })) != null) {
      ref.on = "record_more";
    }

    if ((ref1 = actions.find(function (n) {
      return n.name === "download";
    })) != null) {
      ref1.on = "record";
    }
  }

  actions = _.filter(actions, function (action) {
    return _.indexOf(disabled_actions, action.name) < 0;
  });
  return actions;
};

/返回当前用户有权限访问的所有list_view，包括分享的，用户自定义非分享的（除非owner变了），以及默认的其他视图注意Creator.getPermissions函数中是不会有用户自定义非分享的视图的，所以Creator.getPermissions函数中拿到的结果不全，并不是当前用户能看到所有视图/;

Creator.getListViews = function (object_name, spaceId, userId) {
  var disabled_list_views, isMobile, list_views, object, ref;

  if (Meteor.isClient) {
    if (!object_name) {
      object_name = Session.get("object_name");
    }

    if (!spaceId) {
      spaceId = Session.get("spaceId");
    }

    if (!userId) {
      userId = Meteor.userId();
    }
  }

  if (!object_name) {
    return;
  }

  object = Creator.getObject(object_name);

  if (!object) {
    return;
  }

  disabled_list_views = ((ref = Creator.getPermissions(object_name, spaceId, userId)) != null ? ref.disabled_list_views : void 0) || [];
  list_views = [];
  isMobile = Steedos.isMobile();

  _.each(object.list_views, function (item, item_name) {
    if (isMobile && item.type === "calendar") {
      return;
    }

    if (item_name !== "default") {
      if (_.indexOf(disabled_list_views, item_name) < 0 || item.owner === userId) {
        return list_views.push(item);
      }
    }
  });

  return list_views;
};

Creator.getFields = function (object_name, spaceId, userId) {
  var fieldsName, ref, unreadable_fields;

  if (Meteor.isClient) {
    if (!object_name) {
      object_name = Session.get("object_name");
    }

    if (!spaceId) {
      spaceId = Session.get("spaceId");
    }

    if (!userId) {
      userId = Meteor.userId();
    }
  }

  fieldsName = Creator.getObjectFieldsName(object_name);
  unreadable_fields = (ref = Creator.getPermissions(object_name, spaceId, userId)) != null ? ref.unreadable_fields : void 0;
  return _.difference(fieldsName, unreadable_fields);
};

Creator.isloading = function () {
  return !Creator.bootstrapLoaded.get();
};

Creator.convertSpecialCharacter = function (str) {
  return str.replace(/([\^\$\(\)\*\+\?\.\\\|\[\]\{\}])/g, "\\$1");
};

Creator.getDisabledFields = function (schema) {
  var fields;
  fields = _.map(schema, function (field, fieldName) {
    return field.autoform && field.autoform.disabled && !field.autoform.omit && fieldName;
  });
  fields = _.compact(fields);
  return fields;
};

Creator.getHiddenFields = function (schema) {
  var fields;
  fields = _.map(schema, function (field, fieldName) {
    return field.autoform && field.autoform.type === "hidden" && !field.autoform.omit && fieldName;
  });
  fields = _.compact(fields);
  return fields;
};

Creator.getFieldsWithNoGroup = function (schema) {
  var fields;
  fields = _.map(schema, function (field, fieldName) {
    return (!field.autoform || !field.autoform.group || field.autoform.group === "-") && (!field.autoform || field.autoform.type !== "hidden") && fieldName;
  });
  fields = _.compact(fields);
  return fields;
};

Creator.getSortedFieldGroupNames = function (schema) {
  var names;
  names = _.map(schema, function (field) {
    return field.autoform && field.autoform.group !== "-" && field.autoform.group;
  });
  names = _.compact(names);
  names = _.unique(names);
  return names;
};

Creator.getFieldsForGroup = function (schema, groupName) {
  var fields;
  fields = _.map(schema, function (field, fieldName) {
    return field.autoform && field.autoform.group === groupName && field.autoform.type !== "hidden" && fieldName;
  });
  fields = _.compact(fields);
  return fields;
};

Creator.getFieldsWithoutOmit = function (schema, keys) {
  keys = _.map(keys, function (key) {
    var field, ref;
    field = _.pick(schema, key);

    if ((ref = field[key].autoform) != null ? ref.omit : void 0) {
      return false;
    } else {
      return key;
    }
  });
  keys = _.compact(keys);
  return keys;
};

Creator.getFieldsInFirstLevel = function (firstLevelKeys, keys) {
  keys = _.map(keys, function (key) {
    if (_.indexOf(firstLevelKeys, key) > -1) {
      return key;
    } else {
      return false;
    }
  });
  keys = _.compact(keys);
  return keys;
};

Creator.getFieldsForReorder = function (schema, keys, isSingle) {
  var _keys, childKeys, fields, i, is_wide_1, is_wide_2, sc_1, sc_2;

  fields = [];
  i = 0;
  _keys = _.filter(keys, function (key) {
    return !key.endsWith('_endLine');
  });

  while (i < _keys.length) {
    sc_1 = _.pick(schema, _keys[i]);
    sc_2 = _.pick(schema, _keys[i + 1]);
    is_wide_1 = false;
    is_wide_2 = false;

    _.each(sc_1, function (value) {
      var ref, ref1;

      if (((ref = value.autoform) != null ? ref.is_wide : void 0) || ((ref1 = value.autoform) != null ? ref1.type : void 0) === "table") {
        return is_wide_1 = true;
      }
    });

    _.each(sc_2, function (value) {
      var ref, ref1;

      if (((ref = value.autoform) != null ? ref.is_wide : void 0) || ((ref1 = value.autoform) != null ? ref1.type : void 0) === "table") {
        return is_wide_2 = true;
      }
    });

    if (Steedos.isMobile()) {
      is_wide_1 = true;
      is_wide_2 = true;
    }

    if (isSingle) {
      fields.push(_keys.slice(i, i + 1));
      i += 1;
    } else {
      if (is_wide_1) {
        fields.push(_keys.slice(i, i + 1));
        i += 1;
      } else if (!is_wide_1 && is_wide_2) {
        childKeys = _keys.slice(i, i + 1);
        childKeys.push(void 0);
        fields.push(childKeys);
        i += 1;
      } else if (!is_wide_1 && !is_wide_2) {
        childKeys = _keys.slice(i, i + 1);

        if (_keys[i + 1]) {
          childKeys.push(_keys[i + 1]);
        } else {
          childKeys.push(void 0);
        }

        fields.push(childKeys);
        i += 2;
      }
    }
  }

  return fields;
};

Creator.isFilterValueEmpty = function (v) {
  return typeof v === "undefined" || v === null || Number.isNaN(v) || v.length === 0;
};

if (Meteor.isServer) {
  Creator.getAllRelatedObjects = function (object_name) {
    var related_object_names;
    related_object_names = [];

    _.each(Creator.Objects, function (related_object, related_object_name) {
      return _.each(related_object.fields, function (related_field, related_field_name) {
        if (related_field.type === "master_detail" && related_field.reference_to && related_field.reference_to === object_name) {
          return related_object_names.push(related_object_name);
        }
      });
    });

    if (Creator.getObject(object_name).enable_files) {
      related_object_names.push("cms_files");
    }

    return related_object_names;
  };
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"apps.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/lib/apps.coffee                                                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Creator.appsByName = {};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"server":{"methods":{"object_recent_viewed.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/methods/object_recent_viewed.coffee                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.methods({
  "object_recent_viewed": function (object_name, record_id, space_id) {
    var collection_recent_viewed, current_recent_viewed, doc, filters;

    if (!this.userId) {
      return null;
    }

    if (object_name === "object_recent_viewed") {
      return;
    }

    if (object_name && record_id) {
      if (!space_id) {
        doc = Creator.getCollection(object_name).findOne({
          _id: record_id
        }, {
          fields: {
            space: 1
          }
        });
        space_id = doc != null ? doc.space : void 0;
      }

      collection_recent_viewed = Creator.getCollection("object_recent_viewed");
      filters = {
        owner: this.userId,
        space: space_id,
        'record.o': object_name,
        'record.ids': [record_id]
      };
      current_recent_viewed = collection_recent_viewed.findOne(filters);

      if (current_recent_viewed) {
        collection_recent_viewed.update(current_recent_viewed._id, {
          $inc: {
            count: 1
          },
          $set: {
            modified: new Date(),
            modified_by: this.userId
          }
        });
      } else {
        collection_recent_viewed.insert({
          _id: collection_recent_viewed._makeNewID(),
          owner: this.userId,
          space: space_id,
          record: {
            o: object_name,
            ids: [record_id]
          },
          count: 1,
          created: new Date(),
          created_by: this.userId,
          modified: new Date(),
          modified_by: this.userId
        });
      }
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"object_recent_record.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/methods/object_recent_record.coffee                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var async_recent_aggregate, recent_aggregate, search_object;

recent_aggregate = function (created_by, spaceId, _records, callback) {
  return Creator.Collections.object_recent_viewed.rawCollection().aggregate([{
    $match: {
      created_by: created_by,
      space: spaceId
    }
  }, {
    $group: {
      _id: {
        object_name: "$record.o",
        record_id: "$record.ids",
        space: "$space"
      },
      maxCreated: {
        $max: "$created"
      }
    }
  }, {
    $sort: {
      maxCreated: -1
    }
  }, {
    $limit: 10
  }]).toArray(function (err, data) {
    if (err) {
      throw new Error(err);
    }

    data.forEach(function (doc) {
      return _records.push(doc._id);
    });

    if (callback && _.isFunction(callback)) {
      callback();
    }
  });
};

async_recent_aggregate = Meteor.wrapAsync(recent_aggregate);

search_object = function (space, object_name, userId, searchText) {
  var _object, _object_collection, _object_name_key, data, fields, query, query_and, records, search_Keywords;

  data = new Array();

  if (searchText) {
    _object = Creator.getObject(object_name);
    _object_collection = Creator.getCollection(object_name);
    _object_name_key = _object != null ? _object.NAME_FIELD_KEY : void 0;

    if (_object && _object_collection && _object_name_key) {
      query = {};
      search_Keywords = searchText.split(" ");
      query_and = [];
      search_Keywords.forEach(function (keyword) {
        var subquery;
        subquery = {};
        subquery[_object_name_key] = {
          $regex: keyword.trim()
        };
        return query_and.push(subquery);
      });
      query.$and = query_and;
      query.space = {
        $in: [space]
      };
      fields = {
        _id: 1
      };
      fields[_object_name_key] = 1;
      records = _object_collection.find(query, {
        fields: fields,
        sort: {
          modified: 1
        },
        limit: 5
      });
      records.forEach(function (record) {
        return data.push({
          _id: record._id,
          _name: record[_object_name_key],
          _object_name: object_name
        });
      });
    }
  }

  return data;
};

Meteor.methods({
  'object_recent_record': function (spaceId) {
    var data, records;
    data = new Array();
    records = new Array();
    async_recent_aggregate(this.userId, spaceId, records);
    records.forEach(function (item) {
      var fields, record, record_object, record_object_collection;
      record_object = Creator.getObject(item.object_name, item.space);

      if (!record_object) {
        return;
      }

      record_object_collection = Creator.getCollection(item.object_name, item.space);

      if (record_object && record_object_collection) {
        fields = {
          _id: 1
        };
        fields[record_object.NAME_FIELD_KEY] = 1;
        record = record_object_collection.findOne(item.record_id[0], {
          fields: fields
        });

        if (record) {
          return data.push({
            _id: record._id,
            _name: record[record_object.NAME_FIELD_KEY],
            _object_name: item.object_name
          });
        }
      }
    });
    return data;
  },
  'object_record_search': function (options) {
    var data, searchText, self, space;
    self = this;
    data = new Array();
    searchText = options.searchText;
    space = options.space;

    _.forEach(Creator.objectsByName, function (_object, name) {
      var object_record;

      if (_object.enable_search) {
        object_record = search_object(space, _object.name, self.userId, searchText);
        return data = data.concat(object_record);
      }
    });

    return data;
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"object_listviews_options.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/methods/object_listviews_options.coffee                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.methods({
  update_filters: function (listview_id, filters, filter_scope, filter_logic) {
    return Creator.Collections.object_listviews.direct.update({
      _id: listview_id
    }, {
      $set: {
        filters: filters,
        filter_scope: filter_scope,
        filter_logic: filter_logic
      }
    });
  },
  update_columns: function (listview_id, columns) {
    check(columns, Array);

    if (columns.length < 1) {
      throw new Meteor.Error(400, "Select at least one field to display");
    }

    return Creator.Collections.object_listviews.update({
      _id: listview_id
    }, {
      $set: {
        columns: columns
      }
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"report_data.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/methods/report_data.coffee                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.methods({
  'report_data': function (options) {
    var compoundFields, cursor, fields, filterFields, filter_scope, filters, objectFields, object_name, ref, result, selector, space, userId;
    check(options, Object);
    space = options.space;
    fields = options.fields;
    object_name = options.object_name;
    filter_scope = options.filter_scope;
    filters = options.filters;
    filterFields = {};
    compoundFields = [];
    objectFields = (ref = Creator.getObject(object_name)) != null ? ref.fields : void 0;

    _.each(fields, function (item, index) {
      var childKey, name, objectField, splits;
      splits = item.split(".");
      name = splits[0];
      objectField = objectFields[name];

      if (splits.length > 1 && objectField) {
        childKey = item.replace(name + ".", "");
        compoundFields.push({
          name: name,
          childKey: childKey,
          field: objectField
        });
      }

      return filterFields[name] = 1;
    });

    selector = {};
    userId = this.userId;
    selector.space = space;

    if (filter_scope === "spacex") {
      selector.space = {
        $in: [null, space]
      };
    } else if (filter_scope === "mine") {
      selector.owner = userId;
    }

    if (Creator.isCommonSpace(space) && Creator.isSpaceAdmin(space, this.userId)) {
      delete selector.space;
    }

    if (filters && filters.length > 0) {
      selector["$and"] = filters;
    }

    cursor = Creator.getCollection(object_name).find(selector, {
      fields: filterFields,
      skip: 0,
      limit: 10000
    });
    result = cursor.fetch();

    if (compoundFields.length) {
      result = result.map(function (item, index) {
        _.each(compoundFields, function (compoundFieldItem, index) {
          var compoundFilterFields, itemKey, itemValue, ref1, referenceItem, reference_to, type;
          itemKey = compoundFieldItem.name + "*%*" + compoundFieldItem.childKey.replace(/\./g, "*%*");
          itemValue = item[compoundFieldItem.name];
          type = compoundFieldItem.field.type;

          if (["lookup", "master_detail"].indexOf(type) > -1) {
            reference_to = compoundFieldItem.field.reference_to;
            compoundFilterFields = {};
            compoundFilterFields[compoundFieldItem.childKey] = 1;
            referenceItem = Creator.getCollection(reference_to).findOne({
              _id: itemValue
            }, {
              fields: compoundFilterFields
            });

            if (referenceItem) {
              item[itemKey] = referenceItem[compoundFieldItem.childKey];
            }
          } else if (type === "select") {
            options = compoundFieldItem.field.options;
            item[itemKey] = ((ref1 = _.findWhere(options, {
              value: itemValue
            })) != null ? ref1.label : void 0) || itemValue;
          } else {
            item[itemKey] = itemValue;
          }

          if (!item[itemKey]) {
            return item[itemKey] = "--";
          }
        });

        return item;
      });
      return result;
    } else {
      return result;
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"user_tabular_settings.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/methods/user_tabular_settings.coffee                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
/*
    type: "user"
    object_name: "object_listviews"
    record_id: "{object_name},{listview_id}"
    settings:
        column_width: { field_a: 100, field_2: 150 }
        sort: [["field_a", "desc"]]
    owner: {userId}
 */Meteor.methods({
  "tabular_sort_settings": function (object_name, list_view_id, sort) {
    var doc, obj, setting, userId;
    userId = this.userId;
    setting = Creator.Collections.settings.findOne({
      object_name: object_name,
      record_id: "object_listviews",
      owner: userId
    });

    if (setting) {
      return Creator.Collections.settings.update({
        _id: setting._id
      }, {
        $set: (obj = {}, obj["settings." + list_view_id + ".sort"] = sort, obj)
      });
    } else {
      doc = {
        type: "user",
        object_name: object_name,
        record_id: "object_listviews",
        settings: {},
        owner: userId
      };
      doc.settings[list_view_id] = {};
      doc.settings[list_view_id].sort = sort;
      return Creator.Collections.settings.insert(doc);
    }
  },
  "tabular_column_width_settings": function (object_name, list_view_id, column_width) {
    var doc, obj, setting, userId;
    userId = this.userId;
    setting = Creator.Collections.settings.findOne({
      object_name: object_name,
      record_id: "object_listviews",
      owner: userId
    });

    if (setting) {
      return Creator.Collections.settings.update({
        _id: setting._id
      }, {
        $set: (obj = {}, obj["settings." + list_view_id + ".column_width"] = column_width, obj)
      });
    } else {
      doc = {
        type: "user",
        object_name: object_name,
        record_id: "object_listviews",
        settings: {},
        owner: userId
      };
      doc.settings[list_view_id] = {};
      doc.settings[list_view_id].column_width = column_width;
      return Creator.Collections.settings.insert(doc);
    }
  },
  "grid_settings": function (object_name, list_view_id, column_width, sort) {
    var doc, obj, obj1, ref, ref1, setting, userId;
    userId = this.userId;
    setting = Creator.Collections.settings.findOne({
      object_name: object_name,
      record_id: "object_gridviews",
      owner: userId
    });

    if (setting) {
      column_width._id_actions = ((ref = setting.settings["" + list_view_id]) != null ? (ref1 = ref.column_width) != null ? ref1._id_actions : void 0 : void 0) === 46 ? 47 : 46;

      if (sort) {
        return Creator.Collections.settings.update({
          _id: setting._id
        }, {
          $set: (obj = {}, obj["settings." + list_view_id + ".sort"] = sort, obj["settings." + list_view_id + ".column_width"] = column_width, obj)
        });
      } else {
        return Creator.Collections.settings.update({
          _id: setting._id
        }, {
          $set: (obj1 = {}, obj1["settings." + list_view_id + ".column_width"] = column_width, obj1)
        });
      }
    } else {
      doc = {
        type: "user",
        object_name: object_name,
        record_id: "object_gridviews",
        settings: {},
        owner: userId
      };
      doc.settings[list_view_id] = {};
      doc.settings[list_view_id].column_width = column_width;
      doc.settings[list_view_id].sort = sort;
      return Creator.Collections.settings.insert(doc);
    }
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"object_export2xml.coffee":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/methods/object_export2xml.coffee                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var _mixFieldsData, _mixRelatedData, _writeXmlFile, fs, logger, mkdirp, path, xml2js;

xml2js = require('xml2js');
fs = require('fs');
path = require('path');
mkdirp = require('mkdirp');
logger = new Logger('Export_TO_XML');

_writeXmlFile = function (jsonObj, objName) {
  var builder, day, fileAddress, fileName, filePath, month, now, stream, xml, year;
  builder = new xml2js.Builder();
  xml = builder.buildObject(jsonObj);
  stream = new Buffer(xml);
  now = new Date();
  year = now.getFullYear();
  month = now.getMonth() + 1;
  day = now.getDate();
  filePath = path.join(__meteor_bootstrap__.serverDir, '../../../export/' + year + '/' + month + '/' + day + '/' + objName);
  fileName = (jsonObj != null ? jsonObj._id : void 0) + ".xml";
  fileAddress = path.join(filePath, fileName);

  if (!fs.existsSync(filePath)) {
    mkdirp.sync(filePath);
  }

  fs.writeFile(fileAddress, stream, function (err) {
    if (err) {
      return logger.error(jsonObj._id + "写入xml文件失败", err);
    }
  });
  return filePath;
};

_mixFieldsData = function (obj, objName) {
  var jsonObj, mixBool, mixDate, mixDefault, objFields, ref;
  jsonObj = {};
  objFields = typeof Creator !== "undefined" && Creator !== null ? (ref = Creator.getObject(objName)) != null ? ref.fields : void 0 : void 0;

  mixDefault = function (field_name) {
    return jsonObj[field_name] = obj[field_name] || "";
  };

  mixDate = function (field_name, type) {
    var date, dateStr, format;
    date = obj[field_name];

    if (type === "date") {
      format = "YYYY-MM-DD";
    } else {
      format = "YYYY-MM-DD HH:mm:ss";
    }

    if (date != null && format != null) {
      dateStr = moment(date).format(format);
    }

    return jsonObj[field_name] = dateStr || "";
  };

  mixBool = function (field_name) {
    if (obj[field_name] === true) {
      return jsonObj[field_name] = "是";
    } else if (obj[field_name] === false) {
      return jsonObj[field_name] = "否";
    } else {
      return jsonObj[field_name] = "";
    }
  };

  _.each(objFields, function (field, field_name) {
    switch (field != null ? field.type : void 0) {
      case "date":
      case "datetime":
        return mixDate(field_name, field.type);

      case "boolean":
        return mixBool(field_name);

      default:
        return mixDefault(field_name);
    }
  });

  return jsonObj;
};

_mixRelatedData = function (obj, objName) {
  var relatedObjNames, related_objects;
  related_objects = {};
  relatedObjNames = typeof Creator !== "undefined" && Creator !== null ? Creator.getAllRelatedObjects(objName) : void 0;
  relatedObjNames.forEach(function (relatedObjName) {
    var fields, obj1, ref, relatedCollection, relatedRecordList, relatedTableData, related_field_name;
    relatedTableData = [];

    if (relatedObjName === "cms_files") {
      related_field_name = "parent.ids";
    } else {
      fields = typeof Creator !== "undefined" && Creator !== null ? (ref = Creator.Objects[relatedObjName]) != null ? ref.fields : void 0 : void 0;
      related_field_name = "";

      _.each(fields, function (field, field_name) {
        if ((field != null ? field.reference_to : void 0) === objName) {
          return related_field_name = field_name;
        }
      });
    }

    if (related_field_name) {
      relatedCollection = Creator.getCollection(relatedObjName);
      relatedRecordList = relatedCollection.find((obj1 = {}, obj1["" + related_field_name] = obj._id, obj1)).fetch();
      relatedRecordList.forEach(function (relatedObj) {
        var fieldsData;
        fieldsData = _mixFieldsData(relatedObj, relatedObjName);
        return relatedTableData.push(fieldsData);
      });
    }

    return related_objects[relatedObjName] = relatedTableData;
  });
  return related_objects;
};

Creator.Export2xml = function (objName, recordList) {
  var collection;
  logger.info("Run Creator.Export2xml");
  console.time("Creator.Export2xml");
  collection = Creator.getCollection(objName);
  recordList = collection.find({}).fetch();
  recordList.forEach(function (recordObj) {
    var fieldsData, filePath, jsonObj, related_objects;
    jsonObj = {};
    jsonObj._id = recordObj._id;
    fieldsData = _mixFieldsData(recordObj, objName);
    jsonObj[objName] = fieldsData;
    related_objects = _mixRelatedData(recordObj, objName);
    jsonObj["related_objects"] = related_objects;
    return filePath = _writeXmlFile(jsonObj, objName);
  });
  console.timeEnd("Creator.Export2xml");
  return filePath;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"object_import_jobs.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/methods/object_import_jobs.coffee                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"related_objects_records.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/methods/related_objects_records.coffee                                              //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.methods({
  related_objects_records: function (object_name, related_object_name, related_field_name, record_id, spaceId) {
    var permissions, related_records, selector, userId;
    userId = this.userId;

    if (related_object_name === "cfs.files.filerecord") {
      selector = {
        "metadata.space": spaceId
      };
    } else {
      selector = {
        space: spaceId
      };
    }

    if (related_object_name === "cms_files") {
      selector["parent.o"] = object_name;
      selector["parent.ids"] = [record_id];
    } else {
      selector[related_field_name] = record_id;
    }

    permissions = Creator.getPermissions(related_object_name, spaceId, userId);

    if (!permissions.viewAllRecords && permissions.allowRead) {
      selector.owner = userId;
    }

    related_records = Creator.getCollection(related_object_name).find(selector);
    return related_records.count();
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"pending_space.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/methods/pending_space.coffee                                                        //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.methods({
  getPendingSpaceInfo: function (inviterId, spaceId) {
    var inviterName, spaceName;
    inviterName = db.users.findOne({
      _id: inviterId
    }).name;
    spaceName = db.spaces.findOne({
      _id: spaceId
    }).name;
    return {
      inviter: inviterName,
      space: spaceName
    };
  },
  refuseJoinSpace: function (_id) {
    return db.space_users.direct.update({
      _id: _id
    }, {
      $set: {
        invite_state: "refused"
      }
    });
  },
  acceptJoinSpace: function (_id) {
    return db.space_users.direct.update({
      _id: _id
    }, {
      $set: {
        invite_state: "accepted",
        user_accepted: true
      }
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"publications":{"object.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/publications/object.coffee                                                          //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.publish("creator_object_record", function (object_name, id, space_id) {
  var collection;
  collection = Creator.getCollection(object_name, space_id);

  if (collection) {
    return collection.find({
      _id: id
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"object_tabular.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/publications/object_tabular.coffee                                                  //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.publishComposite("steedos_object_tabular", function (tableName, ids, fields, spaceId) {
  var _fields, _keys, _object, _object_name, data, keys, object_colleciton, reference_fields, self;

  if (!this.userId) {
    return this.ready();
  }

  check(tableName, String);
  check(ids, Array);
  check(fields, Match.Optional(Object));
  _object_name = tableName.replace("creator_", "");
  _object = Creator.getObject(_object_name, spaceId);

  if (spaceId) {
    _object_name = Creator.getObjectName(_object);
  }

  object_colleciton = Creator.getCollection(_object_name);
  _fields = _object != null ? _object.fields : void 0;

  if (!_fields || !object_colleciton) {
    return this.ready();
  }

  reference_fields = _.filter(_fields, function (f) {
    return _.isFunction(f.reference_to) || !_.isEmpty(f.reference_to);
  });
  self = this;
  self.unblock();

  if (reference_fields.length > 0) {
    data = {
      find: function () {
        var field_keys;
        self.unblock();
        field_keys = {};

        _.each(_.keys(fields), function (f) {
          if (!/\w+(\.\$){1}\w?/.test(f)) {
            return field_keys[f] = 1;
          }
        });

        return object_colleciton.find({
          _id: {
            $in: ids
          }
        }, {
          fields: field_keys
        });
      }
    };
    data.children = [];
    keys = _.keys(fields);

    if (keys.length < 1) {
      keys = _.keys(_fields);
    }

    _keys = [];
    keys.forEach(function (key) {
      if (_object.schema._objectKeys[key + '.']) {
        _keys = _keys.concat(_.map(_object.schema._objectKeys[key + '.'], function (k) {
          return key + '.' + k;
        }));
      }

      return _keys.push(key);
    });

    _keys.forEach(function (key) {
      var reference_field;
      reference_field = _fields[key];

      if (reference_field && (_.isFunction(reference_field.reference_to) || !_.isEmpty(reference_field.reference_to))) {
        return data.children.push({
          find: function (parent) {
            var children_fields, e, name_field_key, p_k, query, reference_ids, reference_to, reference_to_object, s_k;

            try {
              self.unblock();
              query = {};

              if (/\w+(\.\$\.){1}\w+/.test(key)) {
                p_k = key.replace(/(\w+)\.\$\.\w+/ig, "$1");
                s_k = key.replace(/\w+\.\$\.(\w+)/ig, "$1");
                reference_ids = parent[p_k].getProperty(s_k);
              } else {
                reference_ids = key.split('.').reduce(function (o, x) {
                  return o != null ? o[x] : void 0;
                }, parent);
              }

              reference_to = reference_field.reference_to;

              if (_.isFunction(reference_to)) {
                reference_to = reference_to();
              }

              if (_.isArray(reference_to)) {
                if (_.isObject(reference_ids) && !_.isArray(reference_ids)) {
                  reference_to = reference_ids.o;
                  reference_ids = reference_ids.ids || [];
                } else {
                  return [];
                }
              }

              if (_.isArray(reference_ids)) {
                query._id = {
                  $in: reference_ids
                };
              } else {
                query._id = reference_ids;
              }

              reference_to_object = Creator.getObject(reference_to, spaceId);
              name_field_key = reference_to_object.NAME_FIELD_KEY;
              children_fields = {
                _id: 1,
                space: 1
              };

              if (name_field_key) {
                children_fields[name_field_key] = 1;
              }

              return Creator.getCollection(reference_to, spaceId).find(query, {
                fields: children_fields
              });
            } catch (error) {
              e = error;
              console.log(reference_to, parent, e);
              return [];
            }
          }
        });
      }
    });

    return data;
  } else {
    return {
      find: function () {
        self.unblock();
        return object_colleciton.find({
          _id: {
            $in: ids
          }
        }, {
          fields: fields
        });
      }
    };
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"object_listviews.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/publications/object_listviews.coffee                                                //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.publish("object_listviews", function (object_name, spaceId) {
  var userId;
  userId = this.userId;
  return Creator.getCollection("object_listviews").find({
    object_name: object_name,
    space: spaceId,
    "$or": [{
      owner: userId
    }, {
      shared: true
    }]
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"user_tabular_settings.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/publications/user_tabular_settings.coffee                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.publish("user_tabular_settings", function (object_name) {
  var userId;
  userId = this.userId;
  return Creator.Collections.settings.find({
    object_name: {
      $in: object_name
    },
    record_id: {
      $in: ["object_listviews", "object_gridviews"]
    },
    owner: userId
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"related_objects_records.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/publications/related_objects_records.coffee                                         //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.publish("related_objects_records", function (object_name, related_object_name, related_field_name, record_id, spaceId) {
  var permissions, selector, userId;
  userId = this.userId;

  if (related_object_name === "cfs.files.filerecord") {
    selector = {
      "metadata.space": spaceId
    };
  } else {
    selector = {
      space: spaceId
    };
  }

  if (related_object_name === "cms_files") {
    selector["parent.o"] = object_name;
    selector["parent.ids"] = [record_id];
  } else {
    selector[related_field_name] = record_id;
  }

  permissions = Creator.getPermissions(related_object_name, spaceId, userId);

  if (!permissions.viewAllRecords && permissions.allowRead) {
    selector.owner = userId;
  }

  return Creator.getCollection(related_object_name).find(selector);
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"space_user_info.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/publications/space_user_info.coffee                                                 //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.publish('space_user_info', function (spaceId, userId) {
  return Creator.getCollection("space_users").find({
    space: spaceId,
    user: userId
  });
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"contacts_view_limits.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/publications/contacts_view_limits.coffee                                            //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
if (Meteor.isServer) {
  Meteor.publish('contacts_view_limits', function (spaceId) {
    var selector;

    if (!this.userId) {
      return this.ready();
    }

    if (!spaceId) {
      return this.ready();
    }

    selector = {
      space: spaceId,
      key: 'contacts_view_limits'
    };
    return db.space_settings.find(selector);
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"contacts_no_force_phone_users.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/publications/contacts_no_force_phone_users.coffee                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
if (Meteor.isServer) {
  Meteor.publish('contacts_no_force_phone_users', function (spaceId) {
    var selector;

    if (!this.userId) {
      return this.ready();
    }

    if (!spaceId) {
      return this.ready();
    }

    selector = {
      space: spaceId,
      key: 'contacts_no_force_phone_users'
    };
    return db.space_settings.find(selector);
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"space_need_to_confirm.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/publications/space_need_to_confirm.coffee                                           //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
if (Meteor.isServer) {
  Meteor.publish('space_need_to_confirm', function () {
    var userId;
    userId = this.userId;
    return db.space_users.find({
      user: userId,
      invite_state: "pending"
    });
  });
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"lib":{"permission_manager.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/lib/permission_manager.coffee                                                       //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
permissionManagerForInitApproval = {};

permissionManagerForInitApproval.getFlowPermissions = function (flow_id, user_id) {
  var flow, my_permissions, org_ids, organizations, orgs_can_add, orgs_can_admin, orgs_can_monitor, space_id, users_can_add, users_can_admin, users_can_monitor;
  flow = uuflowManagerForInitApproval.getFlow(flow_id);
  space_id = flow.space;
  org_ids = new Array();
  organizations = db.organizations.find({
    space: space_id,
    users: user_id
  }, {
    fields: {
      parents: 1
    }
  }).fetch();

  _.each(organizations, function (org) {
    org_ids.push(org._id);

    if (org.parents) {
      return _.each(org.parents, function (parent_id) {
        return org_ids.push(parent_id);
      });
    }
  });

  org_ids = _.uniq(org_ids);
  my_permissions = new Array();

  if (flow.perms) {
    if (flow.perms.users_can_add) {
      users_can_add = flow.perms.users_can_add;

      if (users_can_add.includes(user_id)) {
        my_permissions.push("add");
      }
    }

    if (flow.perms.orgs_can_add) {
      orgs_can_add = flow.perms.orgs_can_add;

      _.each(org_ids, function (org_id) {
        if (orgs_can_add.includes(org_id)) {
          return my_permissions.push("add");
        }
      });
    }

    if (flow.perms.users_can_monitor) {
      users_can_monitor = flow.perms.users_can_monitor;

      if (users_can_monitor.includes(user_id)) {
        my_permissions.push("monitor");
      }
    }

    if (flow.perms.orgs_can_monitor) {
      orgs_can_monitor = flow.perms.orgs_can_monitor;

      _.each(org_ids, function (org_id) {
        if (orgs_can_monitor.includes(org_id)) {
          return my_permissions.push("monitor");
        }
      });
    }

    if (flow.perms.users_can_admin) {
      users_can_admin = flow.perms.users_can_admin;

      if (users_can_admin.includes(user_id)) {
        my_permissions.push("admin");
      }
    }

    if (flow.perms.orgs_can_admin) {
      orgs_can_admin = flow.perms.orgs_can_admin;

      _.each(org_ids, function (org_id) {
        if (orgs_can_admin.includes(org_id)) {
          return my_permissions.push("admin");
        }
      });
    }
  }

  my_permissions = _.uniq(my_permissions);
  return my_permissions;
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"uuflowManagerForInitApproval.coffee":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/lib/uuflowManagerForInitApproval.coffee                                             //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var _eval;

_eval = require('eval');
uuflowManagerForInitApproval = {};

uuflowManagerForInitApproval.check_authorization = function (req) {
  var authToken, hashedToken, query, user, userId;
  query = req.query;
  userId = query["X-User-Id"];
  authToken = query["X-Auth-Token"];

  if (!userId || !authToken) {
    throw new Meteor.Error(401, 'Unauthorized');
  }

  hashedToken = Accounts._hashLoginToken(authToken);
  user = Meteor.users.findOne({
    _id: userId,
    "services.resume.loginTokens.hashedToken": hashedToken
  });

  if (!user) {
    throw new Meteor.Error(401, 'Unauthorized');
  }

  return user;
};

uuflowManagerForInitApproval.getSpace = function (space_id) {
  var space;
  space = Creator.Collections.spaces.findOne(space_id);

  if (!space) {
    throw new Meteor.Error('error!', "space_id有误或此space已经被删除");
  }

  return space;
};

uuflowManagerForInitApproval.getFlow = function (flow_id) {
  var flow;
  flow = Creator.Collections.flows.findOne(flow_id);

  if (!flow) {
    throw new Meteor.Error('error!', "id有误或此流程已经被删除");
  }

  return flow;
};

uuflowManagerForInitApproval.getSpaceUser = function (space_id, user_id) {
  var space_user;
  space_user = Creator.Collections.space_users.findOne({
    space: space_id,
    user: user_id
  });

  if (!space_user) {
    throw new Meteor.Error('error!', "user_id对应的用户不属于当前space");
  }

  return space_user;
};

uuflowManagerForInitApproval.getSpaceUserOrgInfo = function (space_user) {
  var info, org;
  info = new Object();
  info.organization = space_user.organization;
  org = Creator.Collections.organizations.findOne(space_user.organization, {
    fields: {
      name: 1,
      fullname: 1
    }
  });
  info.organization_name = org.name;
  info.organization_fullname = org.fullname;
  return info;
};

uuflowManagerForInitApproval.isFlowEnabled = function (flow) {
  if (flow.state !== "enabled") {
    throw new Meteor.Error('error!', "流程未启用,操作失败");
  }
};

uuflowManagerForInitApproval.isFlowSpaceMatched = function (flow, space_id) {
  if (flow.space !== space_id) {
    throw new Meteor.Error('error!', "流程和工作区ID不匹配");
  }
};

uuflowManagerForInitApproval.getForm = function (form_id) {
  var form;
  form = Creator.Collections.forms.findOne(form_id);

  if (!form) {
    throw new Meteor.Error('error!', '表单ID有误或此表单已经被删除');
  }

  return form;
};

uuflowManagerForInitApproval.getCategory = function (category_id) {
  return Creator.Collections.categories.findOne(category_id);
};

uuflowManagerForInitApproval.create_instance = function (instance_from_client, user_info) {
  var appr_obj, approve_from_client, category, flow, flow_id, form, ins_obj, new_ins_id, now, permissions, relatedTablesInfo, space, space_id, space_user, space_user_org_info, start_step, trace_from_client, trace_obj, user_id;
  check(instance_from_client["applicant"], String);
  check(instance_from_client["space"], String);
  check(instance_from_client["flow"], String);
  check(instance_from_client["record_ids"], [{
    o: String,
    ids: [String]
  }]);
  uuflowManagerForInitApproval.checkIsInApproval(instance_from_client["record_ids"][0], instance_from_client["space"]);
  space_id = instance_from_client["space"];
  flow_id = instance_from_client["flow"];
  user_id = user_info._id;
  trace_from_client = null;
  approve_from_client = null;

  if (instance_from_client["traces"] && instance_from_client["traces"][0]) {
    trace_from_client = instance_from_client["traces"][0];

    if (trace_from_client["approves"] && trace_from_client["approves"][0]) {
      approve_from_client = instance_from_client["traces"][0]["approves"][0];
    }
  }

  space = uuflowManagerForInitApproval.getSpace(space_id);
  flow = uuflowManagerForInitApproval.getFlow(flow_id);
  space_user = uuflowManagerForInitApproval.getSpaceUser(space_id, user_id);
  space_user_org_info = uuflowManagerForInitApproval.getSpaceUserOrgInfo(space_user);
  uuflowManagerForInitApproval.isFlowEnabled(flow);
  uuflowManagerForInitApproval.isFlowSpaceMatched(flow, space_id);
  form = uuflowManagerForInitApproval.getForm(flow.form);
  permissions = permissionManager.getFlowPermissions(flow_id, user_id);

  if (!permissions.includes("add")) {
    throw new Meteor.Error('error!', "当前用户没有此流程的新建权限");
  }

  now = new Date();
  ins_obj = {};
  ins_obj._id = Creator.Collections.instances._makeNewID();
  ins_obj.space = space_id;
  ins_obj.flow = flow_id;
  ins_obj.flow_version = flow.current._id;
  ins_obj.form = flow.form;
  ins_obj.form_version = flow.current.form_version;
  ins_obj.name = flow.name;
  ins_obj.submitter = user_id;
  ins_obj.submitter_name = user_info.name;
  ins_obj.applicant = instance_from_client["applicant"] ? instance_from_client["applicant"] : user_id;
  ins_obj.applicant_name = instance_from_client["applicant_name"] ? instance_from_client["applicant_name"] : user_info.name;
  ins_obj.applicant_organization = instance_from_client["applicant_organization"] ? instance_from_client["applicant_organization"] : space_user.organization;
  ins_obj.applicant_organization_name = instance_from_client["applicant_organization_name"] ? instance_from_client["applicant_organization_name"] : space_user_org_info.organization_name;
  ins_obj.applicant_organization_fullname = instance_from_client["applicant_organization_fullname"] ? instance_from_client["applicant_organization_fullname"] : space_user_org_info.organization_fullname;
  ins_obj.applicant_company = instance_from_client["applicant_company"] ? instance_from_client["applicant_company"] : space_user.company_id;
  ins_obj.state = 'draft';
  ins_obj.code = '';
  ins_obj.is_archived = false;
  ins_obj.is_deleted = false;
  ins_obj.created = now;
  ins_obj.created_by = user_id;
  ins_obj.modified = now;
  ins_obj.modified_by = user_id;
  ins_obj.values = new Object();
  ins_obj.record_ids = instance_from_client["record_ids"];

  if (space_user.company_id) {
    ins_obj.company_id = space_user.company_id;
  }

  trace_obj = {};
  trace_obj._id = new Mongo.ObjectID()._str;
  trace_obj.instance = ins_obj._id;
  trace_obj.is_finished = false;
  start_step = _.find(flow.current.steps, function (step) {
    return step.step_type === 'start';
  });
  trace_obj.step = start_step._id;
  trace_obj.name = start_step.name;
  trace_obj.start_date = now;
  appr_obj = {};
  appr_obj._id = new Mongo.ObjectID()._str;
  appr_obj.instance = ins_obj._id;
  appr_obj.trace = trace_obj._id;
  appr_obj.is_finished = false;
  appr_obj.user = instance_from_client["applicant"] ? instance_from_client["applicant"] : user_id;
  appr_obj.user_name = instance_from_client["applicant_name"] ? instance_from_client["applicant_name"] : user_info.name;
  appr_obj.handler = user_id;
  appr_obj.handler_name = user_info.name;
  appr_obj.handler_organization = space_user.organization;
  appr_obj.handler_organization_name = space_user_org_info.name;
  appr_obj.handler_organization_fullname = space_user_org_info.fullname;
  appr_obj.type = 'draft';
  appr_obj.start_date = now;
  appr_obj.read_date = now;
  appr_obj.is_read = true;
  appr_obj.is_error = false;
  appr_obj.description = '';
  relatedTablesInfo = {};
  appr_obj.values = uuflowManagerForInitApproval.initiateValues(ins_obj.record_ids[0], flow_id, space_id, form.current.fields, relatedTablesInfo);
  trace_obj.approves = [appr_obj];
  ins_obj.traces = [trace_obj];
  ins_obj.inbox_users = instance_from_client.inbox_users || [];
  ins_obj.current_step_name = start_step.name;

  if (flow.auto_remind === true) {
    ins_obj.auto_remind = true;
  }

  ins_obj.flow_name = flow.name;

  if (form.category) {
    category = uuflowManagerForInitApproval.getCategory(form.category);

    if (category) {
      ins_obj.category_name = category.name;
      ins_obj.category = category._id;
    }
  }

  new_ins_id = Creator.Collections.instances.insert(ins_obj);
  uuflowManagerForInitApproval.initiateRecordInstanceInfo(ins_obj.record_ids[0], new_ins_id, space_id);
  uuflowManagerForInitApproval.initiateRelatedRecordInstanceInfo(relatedTablesInfo, new_ins_id, space_id);
  uuflowManagerForInitApproval.initiateAttach(ins_obj.record_ids[0], space_id, ins_obj._id, appr_obj._id);
  return new_ins_id;
};

uuflowManagerForInitApproval.initiateValues = function (recordIds, flowId, spaceId, fields, relatedTablesInfo) {
  var fieldCodes, filterValues, flow, form, formFields, formTableFields, formTableFieldsCode, getFieldOdataValue, getFormField, getFormTableField, getFormTableFieldCode, getFormTableSubField, getRelatedObjectFieldCode, getSelectOrgValue, getSelectOrgValues, getSelectUserValue, getSelectUserValues, object, objectName, ow, record, recordId, ref, relatedObjects, relatedObjectsKeys, tableFieldCodes, tableFieldMap, tableToRelatedMap, values;
  fieldCodes = [];

  _.each(fields, function (f) {
    if (f.type === 'section') {
      return _.each(f.fields, function (ff) {
        return fieldCodes.push(ff.code);
      });
    } else {
      return fieldCodes.push(f.code);
    }
  });

  values = {};
  objectName = recordIds.o;
  object = Creator.getObject(objectName, spaceId);
  recordId = recordIds.ids[0];
  ow = Creator.Collections.object_workflows.findOne({
    object_name: objectName,
    flow_id: flowId
  });
  record = Creator.getCollection(objectName, spaceId).findOne(recordId);
  flow = Creator.getCollection('flows').findOne(flowId, {
    fields: {
      form: 1
    }
  });

  if (ow && record) {
    form = Creator.getCollection("forms").findOne(flow.form);
    formFields = form.current.fields || [];
    relatedObjects = Creator.getRelatedObjects(objectName, spaceId);
    relatedObjectsKeys = _.pluck(relatedObjects, 'object_name');
    formTableFields = _.filter(formFields, function (formField) {
      return formField.type === 'table';
    });
    formTableFieldsCode = _.pluck(formTableFields, 'code');

    getRelatedObjectFieldCode = function (key) {
      return _.find(relatedObjectsKeys, function (relatedObjectsKey) {
        return key.startsWith(relatedObjectsKey + '.');
      });
    };

    getFormTableFieldCode = function (key) {
      return _.find(formTableFieldsCode, function (formTableFieldCode) {
        return key.startsWith(formTableFieldCode + '.');
      });
    };

    getFormTableField = function (key) {
      return _.find(formTableFields, function (f) {
        return f.code === key;
      });
    };

    getFormField = function (key) {
      return _.find(formFields, function (f) {
        return f.code === key;
      });
    };

    getFormTableSubField = function (tableField, subFieldCode) {
      return _.find(tableField.fields, function (f) {
        return f.code === subFieldCode;
      });
    };

    getFieldOdataValue = function (objName, id) {
      var _record, _records, obj;

      obj = Creator.getCollection(objName);

      if (!obj) {
        return;
      }

      if (_.isString(id)) {
        _record = obj.findOne(id);

        if (_record) {
          _record['@label'] = _record.name;
          return _record;
        }
      } else if (_.isArray(id)) {
        _records = [];
        obj.find({
          _id: {
            $in: id
          }
        }).forEach(function (_record) {
          _record['@label'] = _record.name;
          return _records.push(_record);
        });

        if (!_.isEmpty(_records)) {
          return _records;
        }
      }
    };

    getSelectUserValue = function (userId, spaceId) {
      var su;
      su = Creator.getCollection('space_users').findOne({
        space: spaceId,
        user: userId
      });
      su.id = userId;
      return su;
    };

    getSelectUserValues = function (userIds, spaceId) {
      var sus;
      sus = [];

      if (_.isArray(userIds)) {
        _.each(userIds, function (userId) {
          var su;
          su = getSelectUserValue(userId, spaceId);

          if (su) {
            return sus.push(su);
          }
        });
      }

      return sus;
    };

    getSelectOrgValue = function (orgId, spaceId) {
      var org;
      org = Creator.getCollection('organizations').findOne(orgId, {
        fields: {
          _id: 1,
          name: 1,
          fullname: 1
        }
      });
      org.id = orgId;
      return org;
    };

    getSelectOrgValues = function (orgIds, spaceId) {
      var orgs;
      orgs = [];

      if (_.isArray(orgIds)) {
        _.each(orgIds, function (orgId) {
          var org;
          org = getSelectOrgValue(orgId, spaceId);

          if (org) {
            return orgs.push(org);
          }
        });
      }

      return orgs;
    };

    tableFieldCodes = [];
    tableFieldMap = [];
    tableToRelatedMap = {};

    if ((ref = ow.field_map) != null) {
      ref.forEach(function (fm) {
        var fieldsObj, formField, formTableFieldCode, lookupFieldName, lookupObject, oTableCode, oTableFieldCode, objField, objectField, objectFieldName, object_field, odataFieldValue, referenceToFieldValue, referenceToObjectName, relatedObjectFieldCode, selectFieldValue, tableToRelatedMapKey, wTableCode, workflow_field;
        object_field = fm.object_field;
        workflow_field = fm.workflow_field;
        relatedObjectFieldCode = getRelatedObjectFieldCode(object_field);
        formTableFieldCode = getFormTableFieldCode(workflow_field);
        objField = object.fields[object_field];
        formField = getFormField(workflow_field);

        if (relatedObjectFieldCode) {
          oTableCode = object_field.split('.')[0];
          oTableFieldCode = object_field.split('.')[1];
          tableToRelatedMapKey = oTableCode;

          if (!tableToRelatedMap[tableToRelatedMapKey]) {
            tableToRelatedMap[tableToRelatedMapKey] = {};
          }

          if (formTableFieldCode) {
            wTableCode = workflow_field.split('.')[0];
            tableToRelatedMap[tableToRelatedMapKey]['_FROM_TABLE_CODE'] = wTableCode;
          }

          return tableToRelatedMap[tableToRelatedMapKey][oTableFieldCode] = workflow_field;
        } else if (workflow_field.indexOf('.$.') > 0 && object_field.indexOf('.$.') > 0) {
          wTableCode = workflow_field.split('.$.')[0];
          oTableCode = object_field.split('.$.')[0];

          if (record.hasOwnProperty(oTableCode) && _.isArray(record[oTableCode])) {
            tableFieldCodes.push(JSON.stringify({
              workflow_table_field_code: wTableCode,
              object_table_field_code: oTableCode
            }));
            return tableFieldMap.push(fm);
          }
        } else if (object_field.indexOf('.') > 0 && object_field.indexOf('.$.') === -1) {
          objectFieldName = object_field.split('.')[0];
          lookupFieldName = object_field.split('.')[1];

          if (object) {
            objectField = object.fields[objectFieldName];

            if (objectField && (objectField.type === "lookup" || objectField.type === "master_detail") && !objectField.multiple) {
              fieldsObj = {};
              fieldsObj[lookupFieldName] = 1;
              lookupObject = Creator.getCollection(objectField.reference_to, spaceId).findOne(record[objectFieldName], {
                fields: fieldsObj
              });

              if (lookupObject) {
                return values[workflow_field] = lookupObject[lookupFieldName];
              }
            }
          }
        } else if (formField && objField && formField.type === 'odata' && ['lookup', 'master_detail'].includes(objField.type) && _.isString(objField.reference_to)) {
          referenceToObjectName = objField.reference_to;
          referenceToFieldValue = record[objField.name];
          odataFieldValue;

          if (objField.multiple && formField.is_multiselect) {
            odataFieldValue = getFieldOdataValue(referenceToObjectName, referenceToFieldValue);
          } else if (!objField.multiple && !formField.is_multiselect) {
            odataFieldValue = getFieldOdataValue(referenceToObjectName, referenceToFieldValue);
          }

          return values[workflow_field] = odataFieldValue;
        } else if (formField && objField && ['user', 'group'].includes(formField.type) && ['lookup', 'master_detail'].includes(objField.type) && ['users', 'organizations'].includes(objField.reference_to)) {
          referenceToFieldValue = record[objField.name];

          if (!_.isEmpty(referenceToFieldValue)) {
            selectFieldValue;

            if (formField.type === 'user') {
              if (objField.multiple && formField.is_multiselect) {
                selectFieldValue = getSelectUserValues(referenceToFieldValue, spaceId);
              } else if (!objField.multiple && !formField.is_multiselect) {
                selectFieldValue = getSelectUserValue(referenceToFieldValue, spaceId);
              }
            } else if (formField.type === 'group') {
              if (objField.multiple && formField.is_multiselect) {
                selectFieldValue = getSelectOrgValues(referenceToFieldValue, spaceId);
              } else if (!objField.multiple && !formField.is_multiselect) {
                selectFieldValue = getSelectOrgValue(referenceToFieldValue, spaceId);
              }
            }

            if (selectFieldValue) {
              return values[workflow_field] = selectFieldValue;
            }
          }
        } else if (record.hasOwnProperty(object_field)) {
          return values[workflow_field] = record[object_field];
        }
      });
    }

    _.uniq(tableFieldCodes).forEach(function (tfc) {
      var c;
      c = JSON.parse(tfc);
      values[c.workflow_table_field_code] = [];
      return record[c.object_table_field_code].forEach(function (tr) {
        var newTr;
        newTr = {};

        _.each(tr, function (v, k) {
          return tableFieldMap.forEach(function (tfm) {
            var wTdCode;

            if (tfm.object_field === c.object_table_field_code + '.$.' + k) {
              wTdCode = tfm.workflow_field.split('.$.')[1];
              return newTr[wTdCode] = v;
            }
          });
        });

        if (!_.isEmpty(newTr)) {
          return values[c.workflow_table_field_code].push(newTr);
        }
      });
    });

    _.each(tableToRelatedMap, function (map, key) {
      var formTableField, relatedCollection, relatedField, relatedFieldName, relatedObject, relatedObjectName, relatedRecords, relatedTableItems, selector, tableCode, tableValues;
      tableCode = map._FROM_TABLE_CODE;
      formTableField = getFormTableField(tableCode);

      if (!tableCode) {
        return console.warn('tableToRelated: [' + key + '] missing corresponding table.');
      } else {
        relatedObjectName = key;
        tableValues = [];
        relatedTableItems = [];
        relatedObject = Creator.getObject(relatedObjectName, spaceId);
        relatedField = _.find(relatedObject.fields, function (f) {
          return ['lookup', 'master_detail'].includes(f.type) && f.reference_to === objectName;
        });
        relatedFieldName = relatedField.name;
        selector = {};
        selector[relatedFieldName] = recordId;
        relatedCollection = Creator.getCollection(relatedObjectName, spaceId);
        relatedRecords = relatedCollection.find(selector);
        relatedRecords.forEach(function (rr) {
          var tableValueItem;
          tableValueItem = {};

          _.each(map, function (valueKey, fieldKey) {
            var formField, formFieldKey, referenceToFieldValue, referenceToObjectName, relatedObjectField, tableFieldValue;

            if (fieldKey !== '_FROM_TABLE_CODE') {
              tableFieldValue;
              formFieldKey;

              if (valueKey.startsWith(tableCode + '.')) {
                formFieldKey = valueKey.split(".")[1];
              } else {
                formFieldKey = valueKey;
              }

              formField = getFormTableSubField(formTableField, formFieldKey);
              relatedObjectField = relatedObject.fields[fieldKey];

              if (!formField || !relatedObjectField) {
                return;
              }

              if (formField.type === 'odata' && ['lookup', 'master_detail'].includes(relatedObjectField.type) && _.isString(relatedObjectField.reference_to)) {
                referenceToObjectName = relatedObjectField.reference_to;
                referenceToFieldValue = rr[fieldKey];

                if (relatedObjectField.multiple && formField.is_multiselect) {
                  tableFieldValue = getFieldOdataValue(referenceToObjectName, referenceToFieldValue);
                } else if (!relatedObjectField.multiple && !formField.is_multiselect) {
                  tableFieldValue = getFieldOdataValue(referenceToObjectName, referenceToFieldValue);
                }
              } else if (['user', 'group'].includes(formField.type) && ['lookup', 'master_detail'].includes(relatedObjectField.type) && ['users', 'organizations'].includes(relatedObjectField.reference_to)) {
                referenceToFieldValue = rr[fieldKey];

                if (!_.isEmpty(referenceToFieldValue)) {
                  if (formField.type === 'user') {
                    if (relatedObjectField.multiple && formField.is_multiselect) {
                      tableFieldValue = getSelectUserValues(referenceToFieldValue, spaceId);
                    } else if (!relatedObjectField.multiple && !formField.is_multiselect) {
                      tableFieldValue = getSelectUserValue(referenceToFieldValue, spaceId);
                    }
                  } else if (formField.type === 'group') {
                    if (relatedObjectField.multiple && formField.is_multiselect) {
                      tableFieldValue = getSelectOrgValues(referenceToFieldValue, spaceId);
                    } else if (!relatedObjectField.multiple && !formField.is_multiselect) {
                      tableFieldValue = getSelectOrgValue(referenceToFieldValue, spaceId);
                    }
                  }
                }
              } else {
                tableFieldValue = rr[fieldKey];
              }

              return tableValueItem[formFieldKey] = tableFieldValue;
            }
          });

          if (!_.isEmpty(tableValueItem)) {
            tableValueItem._id = rr._id;
            tableValues.push(tableValueItem);
            return relatedTableItems.push({
              _table: {
                _id: rr._id,
                _code: tableCode
              }
            });
          }
        });
        values[tableCode] = tableValues;
        return relatedTablesInfo[relatedObjectName] = relatedTableItems;
      }
    });

    if (ow.field_map_script) {
      _.extend(values, uuflowManagerForInitApproval.evalFieldMapScript(ow.field_map_script, objectName, spaceId, recordId));
    }
  }

  filterValues = {};

  _.each(_.keys(values), function (k) {
    if (fieldCodes.includes(k)) {
      return filterValues[k] = values[k];
    }
  });

  return filterValues;
};

uuflowManagerForInitApproval.evalFieldMapScript = function (field_map_script, objectName, spaceId, objectId) {
  var func, record, script, values;
  record = Creator.getCollection(objectName, spaceId).findOne(objectId);
  script = "module.exports = function (record) { " + field_map_script + " }";
  func = _eval(script, "field_map_script");
  values = func(record);

  if (_.isObject(values)) {
    return values;
  } else {
    console.error("evalFieldMapScript: 脚本返回值类型不是对象");
  }

  return {};
};

uuflowManagerForInitApproval.initiateAttach = function (recordIds, spaceId, insId, approveId) {
  Creator.Collections['cms_files'].find({
    space: spaceId,
    parent: recordIds
  }).forEach(function (cf) {
    return _.each(cf.versions, function (versionId, idx) {
      var f, newFile;
      f = Creator.Collections['cfs.files.filerecord'].findOne(versionId);
      newFile = new FS.File();
      return newFile.attachData(f.createReadStream('files'), {
        type: f.original.type
      }, function (err) {
        var metadata;

        if (err) {
          throw new Meteor.Error(err.error, err.reason);
        }

        newFile.name(f.name());
        newFile.size(f.size());
        metadata = {
          owner: f.metadata.owner,
          owner_name: f.metadata.owner_name,
          space: spaceId,
          instance: insId,
          approve: approveId,
          parent: cf._id
        };

        if (idx === 0) {
          metadata.current = true;
        }

        newFile.metadata = metadata;
        return cfs.instances.insert(newFile);
      });
    });
  });
};

uuflowManagerForInitApproval.initiateRecordInstanceInfo = function (recordIds, insId, spaceId) {
  Creator.getCollection(recordIds.o, spaceId).update(recordIds.ids[0], {
    $push: {
      instances: {
        $each: [{
          _id: insId,
          state: 'draft'
        }],
        $position: 0
      }
    },
    $set: {
      locked: true,
      instance_state: 'draft'
    }
  });
};

uuflowManagerForInitApproval.initiateRelatedRecordInstanceInfo = function (relatedTablesInfo, insId, spaceId) {
  _.each(relatedTablesInfo, function (tableItems, relatedObjectName) {
    var relatedCollection;
    relatedCollection = Creator.getCollection(relatedObjectName, spaceId);
    return _.each(tableItems, function (item) {
      return relatedCollection.update(item._table._id, {
        $set: {
          instances: [{
            _id: insId,
            state: 'draft'
          }],
          _table: item._table
        }
      });
    });
  });
};

uuflowManagerForInitApproval.checkIsInApproval = function (recordIds, spaceId) {
  var record;
  record = Creator.getCollection(recordIds.o, spaceId).findOne({
    _id: recordIds.ids[0],
    instances: {
      $exists: true
    }
  }, {
    fields: {
      instances: 1
    }
  });

  if (record && record.instances[0].state !== 'completed' && Creator.Collections.instances.find(record.instances[0]._id).count() > 0) {
    throw new Meteor.Error('error!', "此记录已发起流程正在审批中，待审批结束方可发起下一次审批！");
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"routes":{"s3.coffee":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/routes/s3.coffee                                                                    //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var getQueryString;
JsonRoutes.add("post", "/s3/", function (req, res, next) {
  return JsonRoutes.parseFiles(req, res, function () {
    var collection, fileCollection, newFile;
    collection = cfs.files;
    fileCollection = Creator.getObject("cms_files").db;

    if (req.files && req.files[0]) {
      newFile = new FS.File();
      return newFile.attachData(req.files[0].data, {
        type: req.files[0].mimeType
      }, function (err) {
        var body, e, extention, fileObj, filename, metadata, newFileObjId, object_name, owner, owner_name, parent, record_id, resp, size, space;
        filename = req.files[0].filename;
        extention = filename.split('.').pop();

        if (["image.jpg", "image.gif", "image.jpeg", "image.png"].includes(filename.toLowerCase())) {
          filename = "image-" + moment(new Date()).format('YYYYMMDDHHmmss') + "." + extention;
        }

        body = req.body;

        try {
          if (body && (body['upload_from'] === "IE" || body['upload_from'] === "node")) {
            filename = decodeURIComponent(filename);
          }
        } catch (error) {
          e = error;
          console.error(filename);
          console.error(e);
          filename = filename.replace(/%/g, "-");
        }

        newFile.name(filename);

        if (body && body['owner'] && body['space'] && body['record_id'] && body['object_name']) {
          parent = body['parent'];
          owner = body['owner'];
          owner_name = body['owner_name'];
          space = body['space'];
          record_id = body['record_id'];
          object_name = body['object_name'];
          parent = body['parent'];
          metadata = {
            owner: owner,
            owner_name: owner_name,
            space: space,
            record_id: record_id,
            object_name: object_name
          };

          if (parent) {
            metadata.parent = parent;
          }

          newFile.metadata = metadata;
          fileObj = collection.insert(newFile);
        } else {
          fileObj = collection.insert(newFile);
        }

        size = fileObj.original.size;

        if (!size) {
          size = 1024;
        }

        if (parent) {
          fileCollection.update({
            _id: parent
          }, {
            $set: {
              extention: extention,
              size: size,
              modified: new Date(),
              modified_by: owner
            },
            $push: {
              versions: {
                $each: [fileObj._id],
                $position: 0
              }
            }
          });
        } else {
          newFileObjId = fileCollection.direct.insert({
            name: filename,
            description: '',
            extention: extention,
            size: size,
            versions: [fileObj._id],
            parent: {
              o: object_name,
              ids: [record_id]
            },
            owner: owner,
            space: space,
            created: new Date(),
            created_by: owner,
            modified: new Date(),
            modified_by: owner
          });
          fileObj.update({
            $set: {
              'metadata.parent': newFileObjId
            }
          });
        }

        resp = {
          version_id: fileObj._id,
          size: size
        };
        res.setHeader("x-amz-version-id", fileObj._id);
        res.end(JSON.stringify(resp));
      });
    } else {
      res.statusCode = 500;
      return res.end();
    }
  });
});
JsonRoutes.add("post", "/s3/:collection", function (req, res, next) {
  var collectionName, e, userId;

  try {
    userId = Steedos.getUserIdFromAuthToken(req, res);

    if (!userId) {
      throw new Meteor.Error(500, "No permission");
    }

    collectionName = req.params.collection;
    JsonRoutes.parseFiles(req, res, function () {
      var collection, newFile, resultData;
      collection = cfs[collectionName];

      if (!collection) {
        throw new Meteor.Error(500, "No Collection");
      }

      if (req.files && req.files[0]) {
        newFile = new FS.File();
        newFile.name(req.files[0].filename);

        if (req.body) {
          newFile.metadata = req.body;
        }

        newFile.owner = userId;
        newFile.metadata.owner = userId;
        newFile.attachData(req.files[0].data, {
          type: req.files[0].mimeType
        });
        collection.insert(newFile);
        resultData = collection.files.findOne(newFile._id);
        JsonRoutes.sendResult(res, {
          code: 200,
          data: resultData
        });
      } else {
        throw new Meteor.Error(500, "No File");
      }
    });
  } catch (error) {
    e = error;
    console.error(e.stack);
    return JsonRoutes.sendResult(res, {
      code: e.error || 500,
      data: {
        errors: e.reason || e.message
      }
    });
  }
});

getQueryString = function (accessKeyId, secretAccessKey, query, method) {
  var ALY, canonicalizedQueryString, date, queryKeys, queryStr, stringToSign;
  console.log("----uuflowManager.getQueryString----");
  ALY = require('aliyun-sdk');
  date = ALY.util.date.getDate();
  query.Format = "json";
  query.Version = "2017-03-21";
  query.AccessKeyId = accessKeyId;
  query.SignatureMethod = "HMAC-SHA1";
  query.Timestamp = ALY.util.date.iso8601(date);
  query.SignatureVersion = "1.0";
  query.SignatureNonce = String(date.getTime());
  queryKeys = Object.keys(query);
  queryKeys.sort();
  canonicalizedQueryString = "";
  queryKeys.forEach(function (name) {
    return canonicalizedQueryString += "&" + name + "=" + ALY.util.popEscape(query[name]);
  });
  stringToSign = method.toUpperCase() + '&%2F&' + ALY.util.popEscape(canonicalizedQueryString.substr(1));
  query.Signature = ALY.util.crypto.hmac(secretAccessKey + '&', stringToSign, 'base64', 'sha1');
  queryStr = ALY.util.queryParamsToString(query);
  console.log(queryStr);
  return queryStr;
};

JsonRoutes.add("post", "/s3/vod/upload", function (req, res, next) {
  var ALY, collectionName, e, userId;

  try {
    userId = Steedos.getUserIdFromAuthToken(req, res);

    if (!userId) {
      throw new Meteor.Error(500, "No permission");
    }

    collectionName = "videos";
    ALY = require('aliyun-sdk');
    JsonRoutes.parseFiles(req, res, function () {
      var accessKeyId, collection, date, oss, query, r, ref, ref1, ref2, ref3, secretAccessKey, uploadAddress, uploadAuth, url, videoId;
      collection = cfs[collectionName];

      if (!collection) {
        throw new Meteor.Error(500, "No Collection");
      }

      if (req.files && req.files[0]) {
        if (collectionName === 'videos' && ((ref = Meteor.settings["public"].cfs) != null ? ref.store : void 0) === "OSS") {
          accessKeyId = (ref1 = Meteor.settings.cfs.aliyun) != null ? ref1.accessKeyId : void 0;
          secretAccessKey = (ref2 = Meteor.settings.cfs.aliyun) != null ? ref2.secretAccessKey : void 0;
          date = ALY.util.date.getDate();
          query = {
            Action: "CreateUploadVideo",
            Title: req.files[0].filename,
            FileName: req.files[0].filename
          };
          url = "http://vod.cn-shanghai.aliyuncs.com/?" + getQueryString(accessKeyId, secretAccessKey, query, 'GET');
          r = HTTP.call('GET', url);
          console.log(r);

          if ((ref3 = r.data) != null ? ref3.VideoId : void 0) {
            videoId = r.data.VideoId;
            uploadAddress = JSON.parse(new Buffer(r.data.UploadAddress, 'base64').toString());
            console.log(uploadAddress);
            uploadAuth = JSON.parse(new Buffer(r.data.UploadAuth, 'base64').toString());
            console.log(uploadAuth);
            oss = new ALY.OSS({
              "accessKeyId": uploadAuth.AccessKeyId,
              "secretAccessKey": uploadAuth.AccessKeySecret,
              "endpoint": uploadAddress.Endpoint,
              "apiVersion": '2013-10-15',
              "securityToken": uploadAuth.SecurityToken
            });
            return oss.putObject({
              Bucket: uploadAddress.Bucket,
              Key: uploadAddress.FileName,
              Body: req.files[0].data,
              AccessControlAllowOrigin: '',
              ContentType: req.files[0].mimeType,
              CacheControl: 'no-cache',
              ContentDisposition: '',
              ContentEncoding: 'utf-8',
              ServerSideEncryption: 'AES256',
              Expires: null
            }, Meteor.bindEnvironment(function (err, data) {
              var getPlayInfoQuery, getPlayInfoResult, getPlayInfoUrl, newDate;

              if (err) {
                console.log('error:', err);
                throw new Meteor.Error(500, err.message);
              }

              console.log('success:', data);
              newDate = ALY.util.date.getDate();
              getPlayInfoQuery = {
                Action: 'GetPlayInfo',
                VideoId: videoId
              };
              getPlayInfoUrl = "http://vod.cn-shanghai.aliyuncs.com/?" + getQueryString(accessKeyId, secretAccessKey, getPlayInfoQuery, 'GET');
              getPlayInfoResult = HTTP.call('GET', getPlayInfoUrl);
              return JsonRoutes.sendResult(res, {
                code: 200,
                data: getPlayInfoResult
              });
            }));
          }
        }
      } else {
        throw new Meteor.Error(500, "No File");
      }
    });
  } catch (error) {
    e = error;
    console.error(e.stack);
    return JsonRoutes.sendResult(res, {
      code: e.error || 500,
      data: {
        errors: e.reason || e.message
      }
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"api_workflow_drafts.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                     //
// packages/steedos_creator/server/routes/api_workflow_drafts.coffee                                                   //
//                                                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                       //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
JsonRoutes.add('post', '/api/object/workflow/drafts', function (req, res, next) {
  var current_user_id, current_user_info, e, hashData, inserted_instances;

  try {
    current_user_info = uuflowManagerForInitApproval.check_authorization(req);
    current_user_id = current_user_info._id;
    hashData = req.body;
    inserted_instances = new Array();

    _.each(hashData['Instances'], function (instance_from_client) {
      var new_ins, new_ins_id;
      new_ins_id = uuflowManagerForInitApproval.create_instance(instance_from_client, current_user_info);
      new_ins = Creator.Collections.instances.findOne({
        _id: new_ins_id
      }, {
        fields: {
          space: 1,
          flow: 1,
          flow_version: 1,
          form: 1,
          form_version: 1
        }
      });
      return inserted_instances.push(new_ins);
    });

    return JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        inserts: inserted_instances
      }
    });
  } catch (error) {
    e = error;
    console.error(e.stack);
    return JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        errors: [{
          errorMessage: e.reason || e.message
        }]
      }
    });
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:creator/checkNpm.js");
require("/node_modules/meteor/steedos:creator/core.coffee");
require("/node_modules/meteor/steedos:creator/lib/apps.coffee");
require("/node_modules/meteor/steedos:creator/server/methods/object_recent_viewed.coffee");
require("/node_modules/meteor/steedos:creator/server/methods/object_recent_record.coffee");
require("/node_modules/meteor/steedos:creator/server/methods/object_listviews_options.coffee");
require("/node_modules/meteor/steedos:creator/server/methods/report_data.coffee");
require("/node_modules/meteor/steedos:creator/server/methods/user_tabular_settings.coffee");
require("/node_modules/meteor/steedos:creator/server/methods/object_export2xml.coffee");
require("/node_modules/meteor/steedos:creator/server/methods/object_import_jobs.coffee");
require("/node_modules/meteor/steedos:creator/server/methods/related_objects_records.coffee");
require("/node_modules/meteor/steedos:creator/server/methods/pending_space.coffee");
require("/node_modules/meteor/steedos:creator/server/publications/object.coffee");
require("/node_modules/meteor/steedos:creator/server/publications/object_tabular.coffee");
require("/node_modules/meteor/steedos:creator/server/publications/object_listviews.coffee");
require("/node_modules/meteor/steedos:creator/server/publications/user_tabular_settings.coffee");
require("/node_modules/meteor/steedos:creator/server/publications/related_objects_records.coffee");
require("/node_modules/meteor/steedos:creator/server/publications/space_user_info.coffee");
require("/node_modules/meteor/steedos:creator/server/publications/contacts_view_limits.coffee");
require("/node_modules/meteor/steedos:creator/server/publications/contacts_no_force_phone_users.coffee");
require("/node_modules/meteor/steedos:creator/server/publications/space_need_to_confirm.coffee");
require("/node_modules/meteor/steedos:creator/server/lib/permission_manager.coffee");
require("/node_modules/meteor/steedos:creator/server/lib/uuflowManagerForInitApproval.coffee");
require("/node_modules/meteor/steedos:creator/server/routes/s3.coffee");
require("/node_modules/meteor/steedos:creator/server/routes/api_workflow_drafts.coffee");

/* Exports */
Package._define("steedos:creator", {
  permissionManagerForInitApproval: permissionManagerForInitApproval,
  uuflowManagerForInitApproval: uuflowManagerForInitApproval
});

})();

//# sourceURL=meteor://💻app/packages/steedos_creator.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvczpjcmVhdG9yL2NoZWNrTnBtLmpzIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3IvY29yZS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2NvcmUuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3IvbGliL2FwcHMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3Ivc2VydmVyL21ldGhvZHMvb2JqZWN0X3JlY2VudF92aWV3ZWQuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvbWV0aG9kcy9vYmplY3RfcmVjZW50X3ZpZXdlZC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfY3JlYXRvci9zZXJ2ZXIvbWV0aG9kcy9vYmplY3RfcmVjZW50X3JlY29yZC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tZXRob2RzL29iamVjdF9yZWNlbnRfcmVjb3JkLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19jcmVhdG9yL3NlcnZlci9tZXRob2RzL29iamVjdF9saXN0dmlld3Nfb3B0aW9ucy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tZXRob2RzL29iamVjdF9saXN0dmlld3Nfb3B0aW9ucy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfY3JlYXRvci9zZXJ2ZXIvbWV0aG9kcy9yZXBvcnRfZGF0YS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tZXRob2RzL3JlcG9ydF9kYXRhLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19jcmVhdG9yL3NlcnZlci9tZXRob2RzL3VzZXJfdGFidWxhcl9zZXR0aW5ncy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tZXRob2RzL3VzZXJfdGFidWxhcl9zZXR0aW5ncy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfY3JlYXRvci9zZXJ2ZXIvbWV0aG9kcy9vYmplY3RfZXhwb3J0MnhtbC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tZXRob2RzL29iamVjdF9leHBvcnQyeG1sLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19jcmVhdG9yL3NlcnZlci9tZXRob2RzL3JlbGF0ZWRfb2JqZWN0c19yZWNvcmRzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL21ldGhvZHMvcmVsYXRlZF9vYmplY3RzX3JlY29yZHMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3Ivc2VydmVyL21ldGhvZHMvcGVuZGluZ19zcGFjZS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tZXRob2RzL3BlbmRpbmdfc3BhY2UuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3Ivc2VydmVyL3B1YmxpY2F0aW9ucy9vYmplY3QuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvcHVibGljYXRpb25zL29iamVjdC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfY3JlYXRvci9zZXJ2ZXIvcHVibGljYXRpb25zL29iamVjdF90YWJ1bGFyLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL3B1YmxpY2F0aW9ucy9vYmplY3RfdGFidWxhci5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfY3JlYXRvci9zZXJ2ZXIvcHVibGljYXRpb25zL29iamVjdF9saXN0dmlld3MuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3Ivc2VydmVyL3B1YmxpY2F0aW9ucy91c2VyX3RhYnVsYXJfc2V0dGluZ3MuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3Ivc2VydmVyL3B1YmxpY2F0aW9ucy9yZWxhdGVkX29iamVjdHNfcmVjb3Jkcy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9wdWJsaWNhdGlvbnMvcmVsYXRlZF9vYmplY3RzX3JlY29yZHMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3Ivc2VydmVyL3B1YmxpY2F0aW9ucy9zcGFjZV91c2VyX2luZm8uY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3Ivc2VydmVyL3B1YmxpY2F0aW9ucy9jb250YWN0c192aWV3X2xpbWl0cy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9wdWJsaWNhdGlvbnMvY29udGFjdHNfdmlld19saW1pdHMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3Ivc2VydmVyL3B1YmxpY2F0aW9ucy9jb250YWN0c19ub19mb3JjZV9waG9uZV91c2Vycy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9wdWJsaWNhdGlvbnMvY29udGFjdHNfbm9fZm9yY2VfcGhvbmVfdXNlcnMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3Ivc2VydmVyL3B1YmxpY2F0aW9ucy9zcGFjZV9uZWVkX3RvX2NvbmZpcm0uY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvcHVibGljYXRpb25zL3NwYWNlX25lZWRfdG9fY29uZmlybS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfY3JlYXRvci9zZXJ2ZXIvbGliL3Blcm1pc3Npb25fbWFuYWdlci5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9saWIvcGVybWlzc2lvbl9tYW5hZ2VyLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19jcmVhdG9yL3NlcnZlci9saWIvdXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9saWIvdXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfY3JlYXRvci9zZXJ2ZXIvcm91dGVzL3MzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL3JvdXRlcy9zMy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfY3JlYXRvci9zZXJ2ZXIvcm91dGVzL2FwaV93b3JrZmxvd19kcmFmdHMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvcm91dGVzL2FwaV93b3JrZmxvd19kcmFmdHMuY29mZmVlIl0sIm5hbWVzIjpbImNoZWNrTnBtVmVyc2lvbnMiLCJtb2R1bGUiLCJsaW5rIiwidiIsImJ1c2JveSIsIm1rZGlycCIsIk1ldGVvciIsInNldHRpbmdzIiwiY2ZzIiwiYWxpeXVuIiwiQ3JlYXRvciIsImdldFNjaGVtYSIsIm9iamVjdF9uYW1lIiwicmVmIiwiZ2V0T2JqZWN0Iiwic2NoZW1hIiwiZ2V0T2JqZWN0VXJsIiwicmVjb3JkX2lkIiwiYXBwX2lkIiwibGlzdF92aWV3IiwibGlzdF92aWV3X2lkIiwiU2Vzc2lvbiIsImdldCIsImdldExpc3RWaWV3IiwiX2lkIiwiZ2V0UmVsYXRpdmVVcmwiLCJnZXRPYmplY3RBYnNvbHV0ZVVybCIsIlN0ZWVkb3MiLCJhYnNvbHV0ZVVybCIsImdldE9iamVjdFJvdXRlclVybCIsImdldExpc3RWaWV3VXJsIiwidXJsIiwiZ2V0TGlzdFZpZXdSZWxhdGl2ZVVybCIsImdldFN3aXRjaExpc3RVcmwiLCJnZXRSZWxhdGVkT2JqZWN0VXJsIiwicmVsYXRlZF9vYmplY3RfbmFtZSIsImdldE9iamVjdExvb2t1cEZpZWxkT3B0aW9ucyIsImlzX2RlZXAiLCJpc19za2lwX2hpZGUiLCJpc19yZWxhdGVkIiwiX29iamVjdCIsIl9vcHRpb25zIiwiZmllbGRzIiwiaWNvbiIsInJlbGF0ZWRPYmplY3RzIiwiXyIsImZvckVhY2giLCJmIiwiayIsImhpZGRlbiIsInR5cGUiLCJwdXNoIiwibGFiZWwiLCJ2YWx1ZSIsInJfb2JqZWN0IiwicmVmZXJlbmNlX3RvIiwiaXNTdHJpbmciLCJmMiIsImsyIiwiZ2V0UmVsYXRlZE9iamVjdHMiLCJlYWNoIiwiX3RoaXMiLCJfcmVsYXRlZE9iamVjdCIsInJlbGF0ZWRPYmplY3QiLCJyZWxhdGVkT3B0aW9ucyIsInJlbGF0ZWRPcHRpb24iLCJmb3JlaWduX2tleSIsIm5hbWUiLCJnZXRPYmplY3RGaWx0ZXJGaWVsZE9wdGlvbnMiLCJwZXJtaXNzaW9uX2ZpZWxkcyIsImdldEZpZWxkcyIsImluY2x1ZGUiLCJ0ZXN0IiwiaW5kZXhPZiIsImdldE9iamVjdEZpZWxkT3B0aW9ucyIsImdldEZpbHRlcnNXaXRoRmlsdGVyRmllbGRzIiwiZmlsdGVycyIsImZpbHRlcl9maWVsZHMiLCJsZW5ndGgiLCJuIiwiZmllbGQiLCJyZXF1aXJlZCIsImZpbmRXaGVyZSIsImlzX2RlZmF1bHQiLCJpc19yZXF1aXJlZCIsImZpbHRlckl0ZW0iLCJtYXRjaEZpZWxkIiwiZmluZCIsImdldE9iamVjdFJlY29yZCIsInNlbGVjdF9maWVsZHMiLCJleHBhbmQiLCJjb2xsZWN0aW9uIiwicmVjb3JkIiwicmVmMSIsInJlZjIiLCJpc0NsaWVudCIsIlRlbXBsYXRlIiwiaW5zdGFuY2UiLCJvZGF0YSIsImdldENvbGxlY3Rpb24iLCJmaW5kT25lIiwiZ2V0T2JqZWN0UmVjb3JkTmFtZSIsIm5hbWVfZmllbGRfa2V5IiwiTkFNRV9GSUVMRF9LRVkiLCJnZXRBcHAiLCJhcHAiLCJBcHBzIiwiZGVwcyIsImRlcGVuZCIsImdldEFwcERhc2hib2FyZCIsImRhc2hib2FyZCIsIkRhc2hib2FyZHMiLCJhcHBzIiwiZ2V0QXBwRGFzaGJvYXJkQ29tcG9uZW50IiwiUmVhY3RTdGVlZG9zIiwicGx1Z2luQ29tcG9uZW50U2VsZWN0b3IiLCJzdG9yZSIsImdldFN0YXRlIiwiZ2V0QXBwT2JqZWN0TmFtZXMiLCJhcHBPYmplY3RzIiwiaXNNb2JpbGUiLCJvYmplY3RzIiwibW9iaWxlX29iamVjdHMiLCJvYmoiLCJwZXJtaXNzaW9ucyIsImFsbG93UmVhZCIsImdldFZpc2libGVBcHBzIiwiaW5jbHVkZUFkbWluIiwiY2hhbmdlQXBwIiwiX3N1YkFwcCIsImVudGl0aWVzIiwiT2JqZWN0IiwiYXNzaWduIiwidmlzaWJsZUFwcHNTZWxlY3RvciIsImdldFZpc2libGVBcHBzT2JqZWN0cyIsInZpc2libGVPYmplY3ROYW1lcyIsImZsYXR0ZW4iLCJwbHVjayIsImZpbHRlciIsIk9iamVjdHMiLCJzb3J0Iiwic29ydGluZ01ldGhvZCIsImJpbmQiLCJrZXkiLCJ1bmlxIiwiZ2V0QXBwc09iamVjdHMiLCJ0ZW1wT2JqZWN0cyIsImNvbmNhdCIsInZhbGlkYXRlRmlsdGVycyIsImxvZ2ljIiwiZSIsImVycm9yTXNnIiwiZmlsdGVyX2l0ZW1zIiwiZmlsdGVyX2xlbmd0aCIsImZsYWciLCJpbmRleCIsIndvcmQiLCJtYXAiLCJpc0VtcHR5IiwiY29tcGFjdCIsInJlcGxhY2UiLCJtYXRjaCIsImkiLCJpbmNsdWRlcyIsInciLCJlcnJvciIsImNvbnNvbGUiLCJsb2ciLCJ0b2FzdHIiLCJmb3JtYXRGaWx0ZXJzVG9Nb25nbyIsIm9wdGlvbnMiLCJzZWxlY3RvciIsIkFycmF5Iiwib3BlcmF0aW9uIiwib3B0aW9uIiwicmVnIiwic3ViX3NlbGVjdG9yIiwiZXZhbHVhdGVGb3JtdWxhIiwiUmVnRXhwIiwiaXNCZXR3ZWVuRmlsdGVyT3BlcmF0aW9uIiwiZ2V0QmV0d2VlblRpbWVCdWlsdGluVmFsdWVzIiwiZm9ybWF0RmlsdGVyc1RvRGV2IiwibG9naWNUZW1wRmlsdGVycyIsInN0ZWVkb3NGaWx0ZXJzIiwicmVxdWlyZSIsImlzX2xvZ2ljX29yIiwicG9wIiwiVVNFUl9DT05URVhUIiwiZm9ybWF0TG9naWNGaWx0ZXJzVG9EZXYiLCJmaWx0ZXJfbG9naWMiLCJmb3JtYXRfbG9naWMiLCJ4IiwiX2YiLCJpc0FycmF5IiwiSlNPTiIsInN0cmluZ2lmeSIsInNwYWNlSWQiLCJ1c2VySWQiLCJyZWxhdGVkX29iamVjdF9uYW1lcyIsInJlbGF0ZWRfb2JqZWN0cyIsInVucmVsYXRlZF9vYmplY3RzIiwiZ2V0T2JqZWN0UmVsYXRlZHMiLCJfY29sbGVjdGlvbl9uYW1lIiwiZ2V0UGVybWlzc2lvbnMiLCJkaWZmZXJlbmNlIiwicmVsYXRlZF9vYmplY3QiLCJpc0FjdGl2ZSIsImdldFJlbGF0ZWRPYmplY3ROYW1lcyIsImdldEFjdGlvbnMiLCJhY3Rpb25zIiwiZGlzYWJsZWRfYWN0aW9ucyIsInNvcnRCeSIsInZhbHVlcyIsImhhcyIsImFjdGlvbiIsImFsbG93X2FjdGlvbnMiLCJvbiIsImdldExpc3RWaWV3cyIsImRpc2FibGVkX2xpc3Rfdmlld3MiLCJsaXN0X3ZpZXdzIiwib2JqZWN0IiwiaXRlbSIsIml0ZW1fbmFtZSIsIm93bmVyIiwiZmllbGRzTmFtZSIsInVucmVhZGFibGVfZmllbGRzIiwiZ2V0T2JqZWN0RmllbGRzTmFtZSIsImlzbG9hZGluZyIsImJvb3RzdHJhcExvYWRlZCIsImNvbnZlcnRTcGVjaWFsQ2hhcmFjdGVyIiwic3RyIiwiZ2V0RGlzYWJsZWRGaWVsZHMiLCJmaWVsZE5hbWUiLCJhdXRvZm9ybSIsImRpc2FibGVkIiwib21pdCIsImdldEhpZGRlbkZpZWxkcyIsImdldEZpZWxkc1dpdGhOb0dyb3VwIiwiZ3JvdXAiLCJnZXRTb3J0ZWRGaWVsZEdyb3VwTmFtZXMiLCJuYW1lcyIsInVuaXF1ZSIsImdldEZpZWxkc0Zvckdyb3VwIiwiZ3JvdXBOYW1lIiwiZ2V0RmllbGRzV2l0aG91dE9taXQiLCJrZXlzIiwicGljayIsImdldEZpZWxkc0luRmlyc3RMZXZlbCIsImZpcnN0TGV2ZWxLZXlzIiwiZ2V0RmllbGRzRm9yUmVvcmRlciIsImlzU2luZ2xlIiwiX2tleXMiLCJjaGlsZEtleXMiLCJpc193aWRlXzEiLCJpc193aWRlXzIiLCJzY18xIiwic2NfMiIsImVuZHNXaXRoIiwiaXNfd2lkZSIsInNsaWNlIiwiaXNGaWx0ZXJWYWx1ZUVtcHR5IiwiTnVtYmVyIiwiaXNOYU4iLCJpc1NlcnZlciIsImdldEFsbFJlbGF0ZWRPYmplY3RzIiwicmVsYXRlZF9maWVsZCIsInJlbGF0ZWRfZmllbGRfbmFtZSIsImVuYWJsZV9maWxlcyIsImFwcHNCeU5hbWUiLCJtZXRob2RzIiwic3BhY2VfaWQiLCJjb2xsZWN0aW9uX3JlY2VudF92aWV3ZWQiLCJjdXJyZW50X3JlY2VudF92aWV3ZWQiLCJkb2MiLCJzcGFjZSIsInVwZGF0ZSIsIiRpbmMiLCJjb3VudCIsIiRzZXQiLCJtb2RpZmllZCIsIkRhdGUiLCJtb2RpZmllZF9ieSIsImluc2VydCIsIl9tYWtlTmV3SUQiLCJvIiwiaWRzIiwiY3JlYXRlZCIsImNyZWF0ZWRfYnkiLCJhc3luY19yZWNlbnRfYWdncmVnYXRlIiwicmVjZW50X2FnZ3JlZ2F0ZSIsInNlYXJjaF9vYmplY3QiLCJfcmVjb3JkcyIsImNhbGxiYWNrIiwiQ29sbGVjdGlvbnMiLCJvYmplY3RfcmVjZW50X3ZpZXdlZCIsInJhd0NvbGxlY3Rpb24iLCJhZ2dyZWdhdGUiLCIkbWF0Y2giLCIkZ3JvdXAiLCJtYXhDcmVhdGVkIiwiJG1heCIsIiRzb3J0IiwiJGxpbWl0IiwidG9BcnJheSIsImVyciIsImRhdGEiLCJFcnJvciIsImlzRnVuY3Rpb24iLCJ3cmFwQXN5bmMiLCJzZWFyY2hUZXh0IiwiX29iamVjdF9jb2xsZWN0aW9uIiwiX29iamVjdF9uYW1lX2tleSIsInF1ZXJ5IiwicXVlcnlfYW5kIiwicmVjb3JkcyIsInNlYXJjaF9LZXl3b3JkcyIsInNwbGl0Iiwia2V5d29yZCIsInN1YnF1ZXJ5IiwiJHJlZ2V4IiwidHJpbSIsIiRhbmQiLCIkaW4iLCJsaW1pdCIsIl9uYW1lIiwiX29iamVjdF9uYW1lIiwicmVjb3JkX29iamVjdCIsInJlY29yZF9vYmplY3RfY29sbGVjdGlvbiIsInNlbGYiLCJvYmplY3RzQnlOYW1lIiwib2JqZWN0X3JlY29yZCIsImVuYWJsZV9zZWFyY2giLCJ1cGRhdGVfZmlsdGVycyIsImxpc3R2aWV3X2lkIiwiZmlsdGVyX3Njb3BlIiwib2JqZWN0X2xpc3R2aWV3cyIsImRpcmVjdCIsInVwZGF0ZV9jb2x1bW5zIiwiY29sdW1ucyIsImNoZWNrIiwiY29tcG91bmRGaWVsZHMiLCJjdXJzb3IiLCJmaWx0ZXJGaWVsZHMiLCJvYmplY3RGaWVsZHMiLCJyZXN1bHQiLCJjaGlsZEtleSIsIm9iamVjdEZpZWxkIiwic3BsaXRzIiwiaXNDb21tb25TcGFjZSIsImlzU3BhY2VBZG1pbiIsInNraXAiLCJmZXRjaCIsImNvbXBvdW5kRmllbGRJdGVtIiwiY29tcG91bmRGaWx0ZXJGaWVsZHMiLCJpdGVtS2V5IiwiaXRlbVZhbHVlIiwicmVmZXJlbmNlSXRlbSIsInNldHRpbmciLCJjb2x1bW5fd2lkdGgiLCJvYmoxIiwiX2lkX2FjdGlvbnMiLCJfbWl4RmllbGRzRGF0YSIsIl9taXhSZWxhdGVkRGF0YSIsIl93cml0ZVhtbEZpbGUiLCJmcyIsImxvZ2dlciIsInBhdGgiLCJ4bWwyanMiLCJMb2dnZXIiLCJqc29uT2JqIiwib2JqTmFtZSIsImJ1aWxkZXIiLCJkYXkiLCJmaWxlQWRkcmVzcyIsImZpbGVOYW1lIiwiZmlsZVBhdGgiLCJtb250aCIsIm5vdyIsInN0cmVhbSIsInhtbCIsInllYXIiLCJCdWlsZGVyIiwiYnVpbGRPYmplY3QiLCJCdWZmZXIiLCJnZXRGdWxsWWVhciIsImdldE1vbnRoIiwiZ2V0RGF0ZSIsImpvaW4iLCJfX21ldGVvcl9ib290c3RyYXBfXyIsInNlcnZlckRpciIsImV4aXN0c1N5bmMiLCJzeW5jIiwid3JpdGVGaWxlIiwibWl4Qm9vbCIsIm1peERhdGUiLCJtaXhEZWZhdWx0Iiwib2JqRmllbGRzIiwiZmllbGRfbmFtZSIsImRhdGUiLCJkYXRlU3RyIiwiZm9ybWF0IiwibW9tZW50IiwicmVsYXRlZE9iak5hbWVzIiwicmVsYXRlZE9iak5hbWUiLCJyZWxhdGVkQ29sbGVjdGlvbiIsInJlbGF0ZWRSZWNvcmRMaXN0IiwicmVsYXRlZFRhYmxlRGF0YSIsInJlbGF0ZWRPYmoiLCJmaWVsZHNEYXRhIiwiRXhwb3J0MnhtbCIsInJlY29yZExpc3QiLCJpbmZvIiwidGltZSIsInJlY29yZE9iaiIsInRpbWVFbmQiLCJyZWxhdGVkX29iamVjdHNfcmVjb3JkcyIsInJlbGF0ZWRfcmVjb3JkcyIsInZpZXdBbGxSZWNvcmRzIiwiZ2V0UGVuZGluZ1NwYWNlSW5mbyIsImludml0ZXJJZCIsImludml0ZXJOYW1lIiwic3BhY2VOYW1lIiwiZGIiLCJ1c2VycyIsInNwYWNlcyIsImludml0ZXIiLCJyZWZ1c2VKb2luU3BhY2UiLCJzcGFjZV91c2VycyIsImludml0ZV9zdGF0ZSIsImFjY2VwdEpvaW5TcGFjZSIsInVzZXJfYWNjZXB0ZWQiLCJwdWJsaXNoIiwiaWQiLCJwdWJsaXNoQ29tcG9zaXRlIiwidGFibGVOYW1lIiwiX2ZpZWxkcyIsIm9iamVjdF9jb2xsZWNpdG9uIiwicmVmZXJlbmNlX2ZpZWxkcyIsInJlYWR5IiwiU3RyaW5nIiwiTWF0Y2giLCJPcHRpb25hbCIsImdldE9iamVjdE5hbWUiLCJ1bmJsb2NrIiwiZmllbGRfa2V5cyIsImNoaWxkcmVuIiwiX29iamVjdEtleXMiLCJyZWZlcmVuY2VfZmllbGQiLCJwYXJlbnQiLCJjaGlsZHJlbl9maWVsZHMiLCJwX2siLCJyZWZlcmVuY2VfaWRzIiwicmVmZXJlbmNlX3RvX29iamVjdCIsInNfayIsImdldFByb3BlcnR5IiwicmVkdWNlIiwiaXNPYmplY3QiLCJzaGFyZWQiLCJ1c2VyIiwic3BhY2Vfc2V0dGluZ3MiLCJwZXJtaXNzaW9uTWFuYWdlckZvckluaXRBcHByb3ZhbCIsImdldEZsb3dQZXJtaXNzaW9ucyIsImZsb3dfaWQiLCJ1c2VyX2lkIiwiZmxvdyIsIm15X3Blcm1pc3Npb25zIiwib3JnX2lkcyIsIm9yZ2FuaXphdGlvbnMiLCJvcmdzX2Nhbl9hZGQiLCJvcmdzX2Nhbl9hZG1pbiIsIm9yZ3NfY2FuX21vbml0b3IiLCJ1c2Vyc19jYW5fYWRkIiwidXNlcnNfY2FuX2FkbWluIiwidXNlcnNfY2FuX21vbml0b3IiLCJ1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsIiwiZ2V0RmxvdyIsInBhcmVudHMiLCJvcmciLCJwYXJlbnRfaWQiLCJwZXJtcyIsIm9yZ19pZCIsIl9ldmFsIiwiY2hlY2tfYXV0aG9yaXphdGlvbiIsInJlcSIsImF1dGhUb2tlbiIsImhhc2hlZFRva2VuIiwiQWNjb3VudHMiLCJfaGFzaExvZ2luVG9rZW4iLCJnZXRTcGFjZSIsImZsb3dzIiwiZ2V0U3BhY2VVc2VyIiwic3BhY2VfdXNlciIsImdldFNwYWNlVXNlck9yZ0luZm8iLCJvcmdhbml6YXRpb24iLCJmdWxsbmFtZSIsIm9yZ2FuaXphdGlvbl9uYW1lIiwib3JnYW5pemF0aW9uX2Z1bGxuYW1lIiwiaXNGbG93RW5hYmxlZCIsInN0YXRlIiwiaXNGbG93U3BhY2VNYXRjaGVkIiwiZ2V0Rm9ybSIsImZvcm1faWQiLCJmb3JtIiwiZm9ybXMiLCJnZXRDYXRlZ29yeSIsImNhdGVnb3J5X2lkIiwiY2F0ZWdvcmllcyIsImNyZWF0ZV9pbnN0YW5jZSIsImluc3RhbmNlX2Zyb21fY2xpZW50IiwidXNlcl9pbmZvIiwiYXBwcl9vYmoiLCJhcHByb3ZlX2Zyb21fY2xpZW50IiwiY2F0ZWdvcnkiLCJpbnNfb2JqIiwibmV3X2luc19pZCIsInJlbGF0ZWRUYWJsZXNJbmZvIiwic3BhY2VfdXNlcl9vcmdfaW5mbyIsInN0YXJ0X3N0ZXAiLCJ0cmFjZV9mcm9tX2NsaWVudCIsInRyYWNlX29iaiIsImNoZWNrSXNJbkFwcHJvdmFsIiwicGVybWlzc2lvbk1hbmFnZXIiLCJpbnN0YW5jZXMiLCJmbG93X3ZlcnNpb24iLCJjdXJyZW50IiwiZm9ybV92ZXJzaW9uIiwic3VibWl0dGVyIiwic3VibWl0dGVyX25hbWUiLCJhcHBsaWNhbnQiLCJhcHBsaWNhbnRfbmFtZSIsImFwcGxpY2FudF9vcmdhbml6YXRpb24iLCJhcHBsaWNhbnRfb3JnYW5pemF0aW9uX25hbWUiLCJhcHBsaWNhbnRfb3JnYW5pemF0aW9uX2Z1bGxuYW1lIiwiYXBwbGljYW50X2NvbXBhbnkiLCJjb21wYW55X2lkIiwiY29kZSIsImlzX2FyY2hpdmVkIiwiaXNfZGVsZXRlZCIsInJlY29yZF9pZHMiLCJNb25nbyIsIk9iamVjdElEIiwiX3N0ciIsImlzX2ZpbmlzaGVkIiwic3RlcHMiLCJzdGVwIiwic3RlcF90eXBlIiwic3RhcnRfZGF0ZSIsInRyYWNlIiwidXNlcl9uYW1lIiwiaGFuZGxlciIsImhhbmRsZXJfbmFtZSIsImhhbmRsZXJfb3JnYW5pemF0aW9uIiwiaGFuZGxlcl9vcmdhbml6YXRpb25fbmFtZSIsImhhbmRsZXJfb3JnYW5pemF0aW9uX2Z1bGxuYW1lIiwicmVhZF9kYXRlIiwiaXNfcmVhZCIsImlzX2Vycm9yIiwiZGVzY3JpcHRpb24iLCJpbml0aWF0ZVZhbHVlcyIsImFwcHJvdmVzIiwidHJhY2VzIiwiaW5ib3hfdXNlcnMiLCJjdXJyZW50X3N0ZXBfbmFtZSIsImF1dG9fcmVtaW5kIiwiZmxvd19uYW1lIiwiY2F0ZWdvcnlfbmFtZSIsImluaXRpYXRlUmVjb3JkSW5zdGFuY2VJbmZvIiwiaW5pdGlhdGVSZWxhdGVkUmVjb3JkSW5zdGFuY2VJbmZvIiwiaW5pdGlhdGVBdHRhY2giLCJyZWNvcmRJZHMiLCJmbG93SWQiLCJmaWVsZENvZGVzIiwiZmlsdGVyVmFsdWVzIiwiZm9ybUZpZWxkcyIsImZvcm1UYWJsZUZpZWxkcyIsImZvcm1UYWJsZUZpZWxkc0NvZGUiLCJnZXRGaWVsZE9kYXRhVmFsdWUiLCJnZXRGb3JtRmllbGQiLCJnZXRGb3JtVGFibGVGaWVsZCIsImdldEZvcm1UYWJsZUZpZWxkQ29kZSIsImdldEZvcm1UYWJsZVN1YkZpZWxkIiwiZ2V0UmVsYXRlZE9iamVjdEZpZWxkQ29kZSIsImdldFNlbGVjdE9yZ1ZhbHVlIiwiZ2V0U2VsZWN0T3JnVmFsdWVzIiwiZ2V0U2VsZWN0VXNlclZhbHVlIiwiZ2V0U2VsZWN0VXNlclZhbHVlcyIsIm9iamVjdE5hbWUiLCJvdyIsInJlY29yZElkIiwicmVsYXRlZE9iamVjdHNLZXlzIiwidGFibGVGaWVsZENvZGVzIiwidGFibGVGaWVsZE1hcCIsInRhYmxlVG9SZWxhdGVkTWFwIiwiZmYiLCJvYmplY3Rfd29ya2Zsb3dzIiwiZm9ybUZpZWxkIiwicmVsYXRlZE9iamVjdHNLZXkiLCJzdGFydHNXaXRoIiwiZm9ybVRhYmxlRmllbGRDb2RlIiwidGFibGVGaWVsZCIsInN1YkZpZWxkQ29kZSIsIl9yZWNvcmQiLCJzdSIsInVzZXJJZHMiLCJzdXMiLCJvcmdJZCIsIm9yZ0lkcyIsIm9yZ3MiLCJmaWVsZF9tYXAiLCJmbSIsImZpZWxkc09iaiIsImxvb2t1cEZpZWxkTmFtZSIsImxvb2t1cE9iamVjdCIsIm9UYWJsZUNvZGUiLCJvVGFibGVGaWVsZENvZGUiLCJvYmpGaWVsZCIsIm9iamVjdEZpZWxkTmFtZSIsIm9iamVjdF9maWVsZCIsIm9kYXRhRmllbGRWYWx1ZSIsInJlZmVyZW5jZVRvRmllbGRWYWx1ZSIsInJlZmVyZW5jZVRvT2JqZWN0TmFtZSIsInJlbGF0ZWRPYmplY3RGaWVsZENvZGUiLCJzZWxlY3RGaWVsZFZhbHVlIiwidGFibGVUb1JlbGF0ZWRNYXBLZXkiLCJ3VGFibGVDb2RlIiwid29ya2Zsb3dfZmllbGQiLCJoYXNPd25Qcm9wZXJ0eSIsIndvcmtmbG93X3RhYmxlX2ZpZWxkX2NvZGUiLCJvYmplY3RfdGFibGVfZmllbGRfY29kZSIsIm11bHRpcGxlIiwiaXNfbXVsdGlzZWxlY3QiLCJ0ZmMiLCJjIiwicGFyc2UiLCJ0ciIsIm5ld1RyIiwidGZtIiwid1RkQ29kZSIsImZvcm1UYWJsZUZpZWxkIiwicmVsYXRlZEZpZWxkIiwicmVsYXRlZEZpZWxkTmFtZSIsInJlbGF0ZWRPYmplY3ROYW1lIiwicmVsYXRlZFJlY29yZHMiLCJyZWxhdGVkVGFibGVJdGVtcyIsInRhYmxlQ29kZSIsInRhYmxlVmFsdWVzIiwiX0ZST01fVEFCTEVfQ09ERSIsIndhcm4iLCJyciIsInRhYmxlVmFsdWVJdGVtIiwidmFsdWVLZXkiLCJmaWVsZEtleSIsImZvcm1GaWVsZEtleSIsInJlbGF0ZWRPYmplY3RGaWVsZCIsInRhYmxlRmllbGRWYWx1ZSIsIl90YWJsZSIsIl9jb2RlIiwiZmllbGRfbWFwX3NjcmlwdCIsImV4dGVuZCIsImV2YWxGaWVsZE1hcFNjcmlwdCIsIm9iamVjdElkIiwiZnVuYyIsInNjcmlwdCIsImluc0lkIiwiYXBwcm92ZUlkIiwiY2YiLCJ2ZXJzaW9ucyIsInZlcnNpb25JZCIsImlkeCIsIm5ld0ZpbGUiLCJGUyIsIkZpbGUiLCJhdHRhY2hEYXRhIiwiY3JlYXRlUmVhZFN0cmVhbSIsIm9yaWdpbmFsIiwibWV0YWRhdGEiLCJyZWFzb24iLCJzaXplIiwib3duZXJfbmFtZSIsImFwcHJvdmUiLCIkcHVzaCIsIiRlYWNoIiwiJHBvc2l0aW9uIiwibG9ja2VkIiwiaW5zdGFuY2Vfc3RhdGUiLCJ0YWJsZUl0ZW1zIiwiJGV4aXN0cyIsImdldFF1ZXJ5U3RyaW5nIiwiSnNvblJvdXRlcyIsImFkZCIsInJlcyIsIm5leHQiLCJwYXJzZUZpbGVzIiwiZmlsZUNvbGxlY3Rpb24iLCJmaWxlcyIsIm1pbWVUeXBlIiwiYm9keSIsImV4dGVudGlvbiIsImZpbGVPYmoiLCJmaWxlbmFtZSIsIm5ld0ZpbGVPYmpJZCIsInJlc3AiLCJ0b0xvd2VyQ2FzZSIsImRlY29kZVVSSUNvbXBvbmVudCIsInZlcnNpb25faWQiLCJzZXRIZWFkZXIiLCJlbmQiLCJzdGF0dXNDb2RlIiwiY29sbGVjdGlvbk5hbWUiLCJnZXRVc2VySWRGcm9tQXV0aFRva2VuIiwicGFyYW1zIiwicmVzdWx0RGF0YSIsInNlbmRSZXN1bHQiLCJzdGFjayIsImVycm9ycyIsIm1lc3NhZ2UiLCJhY2Nlc3NLZXlJZCIsInNlY3JldEFjY2Vzc0tleSIsIm1ldGhvZCIsIkFMWSIsImNhbm9uaWNhbGl6ZWRRdWVyeVN0cmluZyIsInF1ZXJ5S2V5cyIsInF1ZXJ5U3RyIiwic3RyaW5nVG9TaWduIiwidXRpbCIsIkZvcm1hdCIsIlZlcnNpb24iLCJBY2Nlc3NLZXlJZCIsIlNpZ25hdHVyZU1ldGhvZCIsIlRpbWVzdGFtcCIsImlzbzg2MDEiLCJTaWduYXR1cmVWZXJzaW9uIiwiU2lnbmF0dXJlTm9uY2UiLCJnZXRUaW1lIiwicG9wRXNjYXBlIiwidG9VcHBlckNhc2UiLCJzdWJzdHIiLCJTaWduYXR1cmUiLCJjcnlwdG8iLCJobWFjIiwicXVlcnlQYXJhbXNUb1N0cmluZyIsIm9zcyIsInIiLCJyZWYzIiwidXBsb2FkQWRkcmVzcyIsInVwbG9hZEF1dGgiLCJ2aWRlb0lkIiwiQWN0aW9uIiwiVGl0bGUiLCJGaWxlTmFtZSIsIkhUVFAiLCJjYWxsIiwiVmlkZW9JZCIsIlVwbG9hZEFkZHJlc3MiLCJ0b1N0cmluZyIsIlVwbG9hZEF1dGgiLCJPU1MiLCJBY2Nlc3NLZXlTZWNyZXQiLCJFbmRwb2ludCIsIlNlY3VyaXR5VG9rZW4iLCJwdXRPYmplY3QiLCJCdWNrZXQiLCJLZXkiLCJCb2R5IiwiQWNjZXNzQ29udHJvbEFsbG93T3JpZ2luIiwiQ29udGVudFR5cGUiLCJDYWNoZUNvbnRyb2wiLCJDb250ZW50RGlzcG9zaXRpb24iLCJDb250ZW50RW5jb2RpbmciLCJTZXJ2ZXJTaWRlRW5jcnlwdGlvbiIsIkV4cGlyZXMiLCJiaW5kRW52aXJvbm1lbnQiLCJnZXRQbGF5SW5mb1F1ZXJ5IiwiZ2V0UGxheUluZm9SZXN1bHQiLCJnZXRQbGF5SW5mb1VybCIsIm5ld0RhdGUiLCJjdXJyZW50X3VzZXJfaWQiLCJjdXJyZW50X3VzZXJfaW5mbyIsImhhc2hEYXRhIiwiaW5zZXJ0ZWRfaW5zdGFuY2VzIiwibmV3X2lucyIsImluc2VydHMiLCJlcnJvck1lc3NhZ2UiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxJQUFJ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bUJBQWF4Qyw2QkFBNkJpQyxlQUE3QixDQUE2Q0Msb0JBQTdDLEVBQW1FNlEsaUJBQW5FLENBQWI7QUFFQUcsZ0JBQVVsd0IsUUFBUTJSLFdBQVIsQ0FBb0JxTyxTQUFwQixDQUE4QnRhLE9BQTlCLENBQXNDO0FBQUU1RSxhQUFLMGU7QUFBUCxPQUF0QyxFQUEyRDtBQUFFeGQsZ0JBQVE7QUFBRXdPLGlCQUFPLENBQVQ7QUFBWThMLGdCQUFNLENBQWxCO0FBQXFCMkQsd0JBQWMsQ0FBbkM7QUFBc0NyQixnQkFBTSxDQUE1QztBQUErQ3VCLHdCQUFjO0FBQTdEO0FBQVYsT0FBM0QsQ0FBVjtBQ1NHLGFEUEg4UCxtQkFBbUJ4dEIsSUFBbkIsQ0FBd0J5dEIsT0FBeEIsQ0NPRztBRFpKOztBQ2NFLFdEUEY1RixXQUFXd0IsVUFBWCxDQUFzQnRCLEdBQXRCLEVBQTJCO0FBQzFCM0osWUFBTSxHQURvQjtBQUUxQnRPLFlBQU07QUFBRTRkLGlCQUFTRjtBQUFYO0FBRm9CLEtBQTNCLENDT0U7QUR0QkgsV0FBQXRtQixLQUFBO0FBbUJNZixRQUFBZSxLQUFBO0FBQ0xDLFlBQVFELEtBQVIsQ0FBY2YsRUFBRW1qQixLQUFoQjtBQ1dFLFdEVkZ6QixXQUFXd0IsVUFBWCxDQUFzQnRCLEdBQXRCLEVBQTJCO0FBQzFCM0osWUFBTSxHQURvQjtBQUUxQnRPLFlBQU07QUFBRXlaLGdCQUFRLENBQUM7QUFBRW9FLHdCQUFjeG5CLEVBQUU4Z0IsTUFBRixJQUFZOWdCLEVBQUVxakI7QUFBOUIsU0FBRDtBQUFWO0FBRm9CLEtBQTNCLENDVUU7QUFVRDtBRDFDSCxHIiwiZmlsZSI6Ii9wYWNrYWdlcy9zdGVlZG9zX2NyZWF0b3IuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xyXG5cdGNoZWNrTnBtVmVyc2lvbnNcclxufSBmcm9tICdtZXRlb3IvdG1lYXNkYXk6Y2hlY2stbnBtLXZlcnNpb25zJztcclxuY2hlY2tOcG1WZXJzaW9ucyh7XHJcblx0YnVzYm95OiBcIl4wLjIuMTNcIixcclxuXHRta2RpcnA6IFwiXjAuMy41XCIsXHJcblx0XCJ4bWwyanNcIjogXCJeMC40LjE5XCIsXHJcblx0XCJub2RlLXhsc3hcIjogXCJeMC4xMi4wXCJcclxufSwgJ3N0ZWVkb3M6Y3JlYXRvcicpO1xyXG5cclxuaWYgKE1ldGVvci5zZXR0aW5ncyAmJiBNZXRlb3Iuc2V0dGluZ3MuY2ZzICYmIE1ldGVvci5zZXR0aW5ncy5jZnMuYWxpeXVuKSB7XHJcblx0Y2hlY2tOcG1WZXJzaW9ucyh7XHJcblx0XHRcImFsaXl1bi1zZGtcIjogXCJeMS4xMS4xMlwiXHJcblx0fSwgJ3N0ZWVkb3M6Y3JlYXRvcicpO1xyXG59IiwiXHJcblx0IyBDcmVhdG9yLmluaXRBcHBzKClcclxuXHJcblxyXG4jIENyZWF0b3IuaW5pdEFwcHMgPSAoKS0+XHJcbiMgXHRpZiBNZXRlb3IuaXNTZXJ2ZXJcclxuIyBcdFx0Xy5lYWNoIENyZWF0b3IuQXBwcywgKGFwcCwgYXBwX2lkKS0+XHJcbiMgXHRcdFx0ZGJfYXBwID0gZGIuYXBwcy5maW5kT25lKGFwcF9pZClcclxuIyBcdFx0XHRpZiAhZGJfYXBwXHJcbiMgXHRcdFx0XHRhcHAuX2lkID0gYXBwX2lkXHJcbiMgXHRcdFx0XHRkYi5hcHBzLmluc2VydChhcHApXHJcbiMgZWxzZVxyXG4jIFx0YXBwLl9pZCA9IGFwcF9pZFxyXG4jIFx0ZGIuYXBwcy51cGRhdGUoe19pZDogYXBwX2lkfSwgYXBwKVxyXG5cclxuQ3JlYXRvci5nZXRTY2hlbWEgPSAob2JqZWN0X25hbWUpLT5cclxuXHRyZXR1cm4gQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0X25hbWUpPy5zY2hlbWFcclxuXHJcbkNyZWF0b3IuZ2V0T2JqZWN0VXJsID0gKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIGFwcF9pZCkgLT5cclxuXHRpZiAhYXBwX2lkXHJcblx0XHRhcHBfaWQgPSBTZXNzaW9uLmdldChcImFwcF9pZFwiKVxyXG5cdGlmICFvYmplY3RfbmFtZVxyXG5cdFx0b2JqZWN0X25hbWUgPSBTZXNzaW9uLmdldChcIm9iamVjdF9uYW1lXCIpXHJcblxyXG5cdGxpc3RfdmlldyA9IENyZWF0b3IuZ2V0TGlzdFZpZXcob2JqZWN0X25hbWUsIG51bGwpXHJcblx0bGlzdF92aWV3X2lkID0gbGlzdF92aWV3Py5faWRcclxuXHJcblx0aWYgcmVjb3JkX2lkXHJcblx0XHRyZXR1cm4gQ3JlYXRvci5nZXRSZWxhdGl2ZVVybChcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvdmlldy9cIiArIHJlY29yZF9pZClcclxuXHRlbHNlXHJcblx0XHRpZiBvYmplY3RfbmFtZSBpcyBcIm1lZXRpbmdcIlxyXG5cdFx0XHRyZXR1cm4gQ3JlYXRvci5nZXRSZWxhdGl2ZVVybChcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvY2FsZW5kYXIvXCIpXHJcblx0XHRlbHNlXHJcblx0XHRcdHJldHVybiBDcmVhdG9yLmdldFJlbGF0aXZlVXJsKFwiL2FwcC9cIiArIGFwcF9pZCArIFwiL1wiICsgb2JqZWN0X25hbWUgKyBcIi9ncmlkL1wiICsgbGlzdF92aWV3X2lkKVxyXG5cclxuQ3JlYXRvci5nZXRPYmplY3RBYnNvbHV0ZVVybCA9IChvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBhcHBfaWQpIC0+XHJcblx0aWYgIWFwcF9pZFxyXG5cdFx0YXBwX2lkID0gU2Vzc2lvbi5nZXQoXCJhcHBfaWRcIilcclxuXHRpZiAhb2JqZWN0X25hbWVcclxuXHRcdG9iamVjdF9uYW1lID0gU2Vzc2lvbi5nZXQoXCJvYmplY3RfbmFtZVwiKVxyXG5cclxuXHRsaXN0X3ZpZXcgPSBDcmVhdG9yLmdldExpc3RWaWV3KG9iamVjdF9uYW1lLCBudWxsKVxyXG5cdGxpc3Rfdmlld19pZCA9IGxpc3Rfdmlldz8uX2lkXHJcblxyXG5cdGlmIHJlY29yZF9pZFxyXG5cdFx0cmV0dXJuIFN0ZWVkb3MuYWJzb2x1dGVVcmwoXCIvYXBwL1wiICsgYXBwX2lkICsgXCIvXCIgKyBvYmplY3RfbmFtZSArIFwiL3ZpZXcvXCIgKyByZWNvcmRfaWQsIHRydWUpXHJcblx0ZWxzZVxyXG5cdFx0aWYgb2JqZWN0X25hbWUgaXMgXCJtZWV0aW5nXCJcclxuXHRcdFx0cmV0dXJuIFN0ZWVkb3MuYWJzb2x1dGVVcmwoXCIvYXBwL1wiICsgYXBwX2lkICsgXCIvXCIgKyBvYmplY3RfbmFtZSArIFwiL2NhbGVuZGFyL1wiLCB0cnVlKVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRyZXR1cm4gU3RlZWRvcy5hYnNvbHV0ZVVybChcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvZ3JpZC9cIiArIGxpc3Rfdmlld19pZCwgdHJ1ZSlcclxuXHJcbkNyZWF0b3IuZ2V0T2JqZWN0Um91dGVyVXJsID0gKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIGFwcF9pZCkgLT5cclxuXHRpZiAhYXBwX2lkXHJcblx0XHRhcHBfaWQgPSBTZXNzaW9uLmdldChcImFwcF9pZFwiKVxyXG5cdGlmICFvYmplY3RfbmFtZVxyXG5cdFx0b2JqZWN0X25hbWUgPSBTZXNzaW9uLmdldChcIm9iamVjdF9uYW1lXCIpXHJcblxyXG5cdGxpc3RfdmlldyA9IENyZWF0b3IuZ2V0TGlzdFZpZXcob2JqZWN0X25hbWUsIG51bGwpXHJcblx0bGlzdF92aWV3X2lkID0gbGlzdF92aWV3Py5faWRcclxuXHJcblx0aWYgcmVjb3JkX2lkXHJcblx0XHRyZXR1cm4gXCIvYXBwL1wiICsgYXBwX2lkICsgXCIvXCIgKyBvYmplY3RfbmFtZSArIFwiL3ZpZXcvXCIgKyByZWNvcmRfaWRcclxuXHRlbHNlXHJcblx0XHRpZiBvYmplY3RfbmFtZSBpcyBcIm1lZXRpbmdcIlxyXG5cdFx0XHRyZXR1cm4gXCIvYXBwL1wiICsgYXBwX2lkICsgXCIvXCIgKyBvYmplY3RfbmFtZSArIFwiL2NhbGVuZGFyL1wiXHJcblx0XHRlbHNlXHJcblx0XHRcdHJldHVybiBcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvZ3JpZC9cIiArIGxpc3Rfdmlld19pZFxyXG5cclxuQ3JlYXRvci5nZXRMaXN0Vmlld1VybCA9IChvYmplY3RfbmFtZSwgYXBwX2lkLCBsaXN0X3ZpZXdfaWQpIC0+XHJcblx0dXJsID0gQ3JlYXRvci5nZXRMaXN0Vmlld1JlbGF0aXZlVXJsKG9iamVjdF9uYW1lLCBhcHBfaWQsIGxpc3Rfdmlld19pZClcclxuXHRyZXR1cm4gQ3JlYXRvci5nZXRSZWxhdGl2ZVVybCh1cmwpXHJcblxyXG5DcmVhdG9yLmdldExpc3RWaWV3UmVsYXRpdmVVcmwgPSAob2JqZWN0X25hbWUsIGFwcF9pZCwgbGlzdF92aWV3X2lkKSAtPlxyXG5cdGlmIGxpc3Rfdmlld19pZCBpcyBcImNhbGVuZGFyXCJcclxuXHRcdHJldHVybiBcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvY2FsZW5kYXIvXCJcclxuXHRlbHNlXHJcblx0XHRyZXR1cm4gXCIvYXBwL1wiICsgYXBwX2lkICsgXCIvXCIgKyBvYmplY3RfbmFtZSArIFwiL2dyaWQvXCIgKyBsaXN0X3ZpZXdfaWRcclxuXHJcbkNyZWF0b3IuZ2V0U3dpdGNoTGlzdFVybCA9IChvYmplY3RfbmFtZSwgYXBwX2lkLCBsaXN0X3ZpZXdfaWQpIC0+XHJcblx0aWYgbGlzdF92aWV3X2lkXHJcblx0XHRyZXR1cm4gQ3JlYXRvci5nZXRSZWxhdGl2ZVVybChcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvXCIgKyBsaXN0X3ZpZXdfaWQgKyBcIi9saXN0XCIpXHJcblx0ZWxzZVxyXG5cdFx0cmV0dXJuIENyZWF0b3IuZ2V0UmVsYXRpdmVVcmwoXCIvYXBwL1wiICsgYXBwX2lkICsgXCIvXCIgKyBvYmplY3RfbmFtZSArIFwiL2xpc3Qvc3dpdGNoXCIpXHJcblxyXG5DcmVhdG9yLmdldFJlbGF0ZWRPYmplY3RVcmwgPSAob2JqZWN0X25hbWUsIGFwcF9pZCwgcmVjb3JkX2lkLCByZWxhdGVkX29iamVjdF9uYW1lKSAtPlxyXG5cdHJldHVybiBDcmVhdG9yLmdldFJlbGF0aXZlVXJsKFwiL2FwcC9cIiArIGFwcF9pZCArIFwiL1wiICsgb2JqZWN0X25hbWUgKyBcIi9cIiArIHJlY29yZF9pZCArIFwiL1wiICsgcmVsYXRlZF9vYmplY3RfbmFtZSArIFwiL2dyaWRcIilcclxuXHJcbkNyZWF0b3IuZ2V0T2JqZWN0TG9va3VwRmllbGRPcHRpb25zID0gKG9iamVjdF9uYW1lLCBpc19kZWVwLCBpc19za2lwX2hpZGUsIGlzX3JlbGF0ZWQpLT5cclxuXHRfb3B0aW9ucyA9IFtdXHJcblx0dW5sZXNzIG9iamVjdF9uYW1lXHJcblx0XHRyZXR1cm4gX29wdGlvbnNcclxuXHRfb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0X25hbWUpXHJcblx0ZmllbGRzID0gX29iamVjdD8uZmllbGRzXHJcblx0aWNvbiA9IF9vYmplY3Q/Lmljb25cclxuXHRfLmZvckVhY2ggZmllbGRzLCAoZiwgayktPlxyXG5cdFx0aWYgaXNfc2tpcF9oaWRlIGFuZCBmLmhpZGRlblxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdGlmIGYudHlwZSA9PSBcInNlbGVjdFwiXHJcblx0XHRcdF9vcHRpb25zLnB1c2gge2xhYmVsOiBcIiN7Zi5sYWJlbCB8fCBrfVwiLCB2YWx1ZTogXCIje2t9XCIsIGljb246IGljb259XHJcblx0XHRlbHNlXHJcblx0XHRcdF9vcHRpb25zLnB1c2gge2xhYmVsOiBmLmxhYmVsIHx8IGssIHZhbHVlOiBrLCBpY29uOiBpY29ufVxyXG5cdGlmIGlzX2RlZXBcclxuXHRcdF8uZm9yRWFjaCBmaWVsZHMsIChmLCBrKS0+XHJcblx0XHRcdGlmIGlzX3NraXBfaGlkZSBhbmQgZi5oaWRkZW5cclxuXHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0aWYgKGYudHlwZSA9PSBcImxvb2t1cFwiIHx8IGYudHlwZSA9PSBcIm1hc3Rlcl9kZXRhaWxcIikgJiYgZi5yZWZlcmVuY2VfdG8gJiYgXy5pc1N0cmluZyhmLnJlZmVyZW5jZV90bylcclxuXHRcdFx0XHQjIOS4jeaUr+aMgWYucmVmZXJlbmNlX3Rv5Li6ZnVuY3Rpb27nmoTmg4XlhrXvvIzmnInpnIDmsYLlho3or7RcclxuXHRcdFx0XHRyX29iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KGYucmVmZXJlbmNlX3RvKVxyXG5cdFx0XHRcdGlmIHJfb2JqZWN0XHJcblx0XHRcdFx0XHRfLmZvckVhY2ggcl9vYmplY3QuZmllbGRzLCAoZjIsIGsyKS0+XHJcblx0XHRcdFx0XHRcdF9vcHRpb25zLnB1c2gge2xhYmVsOiBcIiN7Zi5sYWJlbCB8fCBrfT0+I3tmMi5sYWJlbCB8fCBrMn1cIiwgdmFsdWU6IFwiI3trfS4je2syfVwiLCBpY29uOiByX29iamVjdD8uaWNvbn1cclxuXHRpZiBpc19yZWxhdGVkXHJcblx0XHRyZWxhdGVkT2JqZWN0cyA9IENyZWF0b3IuZ2V0UmVsYXRlZE9iamVjdHMob2JqZWN0X25hbWUpXHJcblx0XHRfLmVhY2ggcmVsYXRlZE9iamVjdHMsIChfcmVsYXRlZE9iamVjdCk9PlxyXG5cdFx0XHRyZWxhdGVkT3B0aW9ucyA9IENyZWF0b3IuZ2V0T2JqZWN0TG9va3VwRmllbGRPcHRpb25zKF9yZWxhdGVkT2JqZWN0Lm9iamVjdF9uYW1lLCBmYWxzZSwgZmFsc2UsIGZhbHNlKVxyXG5cdFx0XHRyZWxhdGVkT2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3QoX3JlbGF0ZWRPYmplY3Qub2JqZWN0X25hbWUpXHJcblx0XHRcdF8uZWFjaCByZWxhdGVkT3B0aW9ucywgKHJlbGF0ZWRPcHRpb24pLT5cclxuXHRcdFx0XHRpZiBfcmVsYXRlZE9iamVjdC5mb3JlaWduX2tleSAhPSByZWxhdGVkT3B0aW9uLnZhbHVlXHJcblx0XHRcdFx0XHRfb3B0aW9ucy5wdXNoIHtsYWJlbDogXCIje3JlbGF0ZWRPYmplY3QubGFiZWwgfHwgcmVsYXRlZE9iamVjdC5uYW1lfT0+I3tyZWxhdGVkT3B0aW9uLmxhYmVsfVwiLCB2YWx1ZTogXCIje3JlbGF0ZWRPYmplY3QubmFtZX0uI3tyZWxhdGVkT3B0aW9uLnZhbHVlfVwiLCBpY29uOiByZWxhdGVkT2JqZWN0Py5pY29ufVxyXG5cdHJldHVybiBfb3B0aW9uc1xyXG5cclxuIyDnu5/kuIDkuLrlr7nosaFvYmplY3RfbmFtZeaPkOS+m+WPr+eUqOS6jui/h+iZkeWZqOi/h+iZkeWtl+autVxyXG5DcmVhdG9yLmdldE9iamVjdEZpbHRlckZpZWxkT3B0aW9ucyA9IChvYmplY3RfbmFtZSktPlxyXG5cdF9vcHRpb25zID0gW11cclxuXHR1bmxlc3Mgb2JqZWN0X25hbWVcclxuXHRcdHJldHVybiBfb3B0aW9uc1xyXG5cdF9vYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSlcclxuXHRmaWVsZHMgPSBfb2JqZWN0Py5maWVsZHNcclxuXHRwZXJtaXNzaW9uX2ZpZWxkcyA9IENyZWF0b3IuZ2V0RmllbGRzKG9iamVjdF9uYW1lKVxyXG5cdGljb24gPSBfb2JqZWN0Py5pY29uXHJcblx0Xy5mb3JFYWNoIGZpZWxkcywgKGYsIGspLT5cclxuXHRcdCMgaGlkZGVuLGdyaWTnrYnnsbvlnovnmoTlrZfmrrXvvIzkuI3pnIDopoHov4fmu6RcclxuXHRcdGlmICFfLmluY2x1ZGUoW1wiZ3JpZFwiLFwib2JqZWN0XCIsIFwiW09iamVjdF1cIiwgXCJbb2JqZWN0XVwiLCBcIk9iamVjdFwiLCBcImF2YXRhclwiLCBcImltYWdlXCIsIFwibWFya2Rvd25cIiwgXCJodG1sXCJdLCBmLnR5cGUpIGFuZCAhZi5oaWRkZW5cclxuXHRcdFx0IyBmaWx0ZXJzLiQuZmllbGTlj4pmbG93LmN1cnJlbnTnrYnlrZDlrZfmrrXkuZ/kuI3pnIDopoHov4fmu6RcclxuXHRcdFx0aWYgIS9cXHcrXFwuLy50ZXN0KGspIGFuZCBfLmluZGV4T2YocGVybWlzc2lvbl9maWVsZHMsIGspID4gLTFcclxuXHRcdFx0XHRfb3B0aW9ucy5wdXNoIHtsYWJlbDogZi5sYWJlbCB8fCBrLCB2YWx1ZTogaywgaWNvbjogaWNvbn1cclxuXHJcblx0cmV0dXJuIF9vcHRpb25zXHJcblxyXG5DcmVhdG9yLmdldE9iamVjdEZpZWxkT3B0aW9ucyA9IChvYmplY3RfbmFtZSktPlxyXG5cdF9vcHRpb25zID0gW11cclxuXHR1bmxlc3Mgb2JqZWN0X25hbWVcclxuXHRcdHJldHVybiBfb3B0aW9uc1xyXG5cdF9vYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSlcclxuXHRmaWVsZHMgPSBfb2JqZWN0Py5maWVsZHNcclxuXHRwZXJtaXNzaW9uX2ZpZWxkcyA9IENyZWF0b3IuZ2V0RmllbGRzKG9iamVjdF9uYW1lKVxyXG5cdGljb24gPSBfb2JqZWN0Py5pY29uXHJcblx0Xy5mb3JFYWNoIGZpZWxkcywgKGYsIGspLT5cclxuXHRcdGlmICFfLmluY2x1ZGUoW1wiZ3JpZFwiLFwib2JqZWN0XCIsIFwiW09iamVjdF1cIiwgXCJbb2JqZWN0XVwiLCBcIk9iamVjdFwiLCBcImF2YXRhclwiLCBcImltYWdlXCIsIFwibWFya2Rvd25cIiwgXCJodG1sXCJdLCBmLnR5cGUpXHJcblx0XHRcdGlmICEvXFx3K1xcLi8udGVzdChrKSBhbmQgXy5pbmRleE9mKHBlcm1pc3Npb25fZmllbGRzLCBrKSA+IC0xXHJcblx0XHRcdFx0X29wdGlvbnMucHVzaCB7bGFiZWw6IGYubGFiZWwgfHwgaywgdmFsdWU6IGssIGljb246IGljb259XHJcblx0cmV0dXJuIF9vcHRpb25zXHJcblxyXG4jIyNcclxuZmlsdGVyczog6KaB6L2s5o2i55qEZmlsdGVyc1xyXG5maWVsZHM6IOWvueixoeWtl+autVxyXG5maWx0ZXJfZmllbGRzOiDpu5jorqTov4fmu6TlrZfmrrXvvIzmlK/mjIHlrZfnrKbkuLLmlbDnu4Tlkozlr7nosaHmlbDnu4TkuKTnp43moLzlvI/vvIzlpoI6WydmaWxlZF9uYW1lMScsJ2ZpbGVkX25hbWUyJ10sW3tmaWVsZDonZmlsZWRfbmFtZTEnLHJlcXVpcmVkOnRydWV9XVxyXG7lpITnkIbpgLvovpE6IOaKimZpbHRlcnPkuK3lrZjlnKjkuo5maWx0ZXJfZmllbGRz55qE6L+H5ruk5p2h5Lu25aKe5Yqg5q+P6aG555qEaXNfZGVmYXVsdOOAgWlzX3JlcXVpcmVk5bGe5oCn77yM5LiN5a2Y5Zyo5LqOZmlsdGVyX2ZpZWxkc+eahOi/h+a7pOadoeS7tuWvueW6lOeahOenu+mZpOavj+mhueeahOebuOWFs+WxnuaAp1xyXG7ov5Tlm57nu5Pmnpw6IOWkhOeQhuWQjueahGZpbHRlcnNcclxuIyMjXHJcbkNyZWF0b3IuZ2V0RmlsdGVyc1dpdGhGaWx0ZXJGaWVsZHMgPSAoZmlsdGVycywgZmllbGRzLCBmaWx0ZXJfZmllbGRzKS0+XHJcblx0dW5sZXNzIGZpbHRlcnNcclxuXHRcdGZpbHRlcnMgPSBbXVxyXG5cdHVubGVzcyBmaWx0ZXJfZmllbGRzXHJcblx0XHRmaWx0ZXJfZmllbGRzID0gW11cclxuXHRpZiBmaWx0ZXJfZmllbGRzPy5sZW5ndGhcclxuXHRcdGZpbHRlcl9maWVsZHMuZm9yRWFjaCAobiktPlxyXG5cdFx0XHRpZiBfLmlzU3RyaW5nKG4pXHJcblx0XHRcdFx0biA9IFxyXG5cdFx0XHRcdFx0ZmllbGQ6IG4sXHJcblx0XHRcdFx0XHRyZXF1aXJlZDogZmFsc2VcclxuXHRcdFx0aWYgZmllbGRzW24uZmllbGRdIGFuZCAhXy5maW5kV2hlcmUoZmlsdGVycyx7ZmllbGQ6bi5maWVsZH0pXHJcblx0XHRcdFx0ZmlsdGVycy5wdXNoXHJcblx0XHRcdFx0XHRmaWVsZDogbi5maWVsZCxcclxuXHRcdFx0XHRcdGlzX2RlZmF1bHQ6IHRydWUsXHJcblx0XHRcdFx0XHRpc19yZXF1aXJlZDogbi5yZXF1aXJlZFxyXG5cdGZpbHRlcnMuZm9yRWFjaCAoZmlsdGVySXRlbSktPlxyXG5cdFx0bWF0Y2hGaWVsZCA9IGZpbHRlcl9maWVsZHMuZmluZCAobiktPiByZXR1cm4gbiA9PSBmaWx0ZXJJdGVtLmZpZWxkIG9yIG4uZmllbGQgPT0gZmlsdGVySXRlbS5maWVsZFxyXG5cdFx0aWYgXy5pc1N0cmluZyhtYXRjaEZpZWxkKVxyXG5cdFx0XHRtYXRjaEZpZWxkID0gXHJcblx0XHRcdFx0ZmllbGQ6IG1hdGNoRmllbGQsXHJcblx0XHRcdFx0cmVxdWlyZWQ6IGZhbHNlXHJcblx0XHRpZiBtYXRjaEZpZWxkXHJcblx0XHRcdGZpbHRlckl0ZW0uaXNfZGVmYXVsdCA9IHRydWVcclxuXHRcdFx0ZmlsdGVySXRlbS5pc19yZXF1aXJlZCA9IG1hdGNoRmllbGQucmVxdWlyZWRcclxuXHRcdGVsc2VcclxuXHRcdFx0ZGVsZXRlIGZpbHRlckl0ZW0uaXNfZGVmYXVsdFxyXG5cdFx0XHRkZWxldGUgZmlsdGVySXRlbS5pc19yZXF1aXJlZFxyXG5cdHJldHVybiBmaWx0ZXJzXHJcblxyXG5DcmVhdG9yLmdldE9iamVjdFJlY29yZCA9IChvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBzZWxlY3RfZmllbGRzLCBleHBhbmQpLT5cclxuXHJcblx0aWYgIW9iamVjdF9uYW1lXHJcblx0XHRvYmplY3RfbmFtZSA9IFNlc3Npb24uZ2V0KFwib2JqZWN0X25hbWVcIilcclxuXHJcblx0aWYgIXJlY29yZF9pZFxyXG5cdFx0cmVjb3JkX2lkID0gU2Vzc2lvbi5nZXQoXCJyZWNvcmRfaWRcIilcclxuXHRpZiBNZXRlb3IuaXNDbGllbnRcclxuXHRcdGlmIG9iamVjdF9uYW1lID09IFNlc3Npb24uZ2V0KFwib2JqZWN0X25hbWVcIikgJiYgIHJlY29yZF9pZCA9PSBTZXNzaW9uLmdldChcInJlY29yZF9pZFwiKVxyXG5cdFx0XHRpZiBUZW1wbGF0ZS5pbnN0YW5jZSgpPy5yZWNvcmRcclxuXHRcdFx0XHRyZXR1cm4gVGVtcGxhdGUuaW5zdGFuY2UoKT8ucmVjb3JkPy5nZXQoKVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRyZXR1cm4gQ3JlYXRvci5vZGF0YS5nZXQob2JqZWN0X25hbWUsIHJlY29yZF9pZCwgc2VsZWN0X2ZpZWxkcywgZXhwYW5kKVxyXG5cclxuXHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKG9iamVjdF9uYW1lKVxyXG5cdGlmIGNvbGxlY3Rpb25cclxuXHRcdHJlY29yZCA9IGNvbGxlY3Rpb24uZmluZE9uZShyZWNvcmRfaWQpXHJcblx0XHRyZXR1cm4gcmVjb3JkXHJcblxyXG5DcmVhdG9yLmdldE9iamVjdFJlY29yZE5hbWUgPSAocmVjb3JkLCBvYmplY3RfbmFtZSktPlxyXG5cdHVubGVzcyByZWNvcmRcclxuXHRcdHJlY29yZCA9IENyZWF0b3IuZ2V0T2JqZWN0UmVjb3JkKClcclxuXHRpZiByZWNvcmRcclxuXHRcdCMg5pi+56S657uE57uH5YiX6KGo5pe277yM54m55q6K5aSE55CGbmFtZV9maWVsZF9rZXnkuLpuYW1l5a2X5q61XHJcblx0XHRuYW1lX2ZpZWxkX2tleSA9IGlmIG9iamVjdF9uYW1lID09IFwib3JnYW5pemF0aW9uc1wiIHRoZW4gXCJuYW1lXCIgZWxzZSBDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSk/Lk5BTUVfRklFTERfS0VZXHJcblx0XHRpZiByZWNvcmQgYW5kIG5hbWVfZmllbGRfa2V5XHJcblx0XHRcdHJldHVybiByZWNvcmQubGFiZWwgfHwgcmVjb3JkW25hbWVfZmllbGRfa2V5XVxyXG5cclxuQ3JlYXRvci5nZXRBcHAgPSAoYXBwX2lkKS0+XHJcblx0aWYgIWFwcF9pZFxyXG5cdFx0YXBwX2lkID0gU2Vzc2lvbi5nZXQoXCJhcHBfaWRcIilcclxuXHRhcHAgPSBDcmVhdG9yLkFwcHNbYXBwX2lkXVxyXG5cdENyZWF0b3IuZGVwcz8uYXBwPy5kZXBlbmQoKVxyXG5cdHJldHVybiBhcHBcclxuXHJcbkNyZWF0b3IuZ2V0QXBwRGFzaGJvYXJkID0gKGFwcF9pZCktPlxyXG5cdGFwcCA9IENyZWF0b3IuZ2V0QXBwKGFwcF9pZClcclxuXHRpZiAhYXBwXHJcblx0XHRyZXR1cm5cclxuXHRkYXNoYm9hcmQgPSBudWxsXHJcblx0Xy5lYWNoIENyZWF0b3IuRGFzaGJvYXJkcywgKHYsIGspLT5cclxuXHRcdGlmIHYuYXBwcz8uaW5kZXhPZihhcHAuX2lkKSA+IC0xXHJcblx0XHRcdGRhc2hib2FyZCA9IHY7XHJcblx0cmV0dXJuIGRhc2hib2FyZDtcclxuXHJcbkNyZWF0b3IuZ2V0QXBwRGFzaGJvYXJkQ29tcG9uZW50ID0gKGFwcF9pZCktPlxyXG5cdGFwcCA9IENyZWF0b3IuZ2V0QXBwKGFwcF9pZClcclxuXHRpZiAhYXBwXHJcblx0XHRyZXR1cm5cclxuXHRyZXR1cm4gUmVhY3RTdGVlZG9zLnBsdWdpbkNvbXBvbmVudFNlbGVjdG9yKFJlYWN0U3RlZWRvcy5zdG9yZS5nZXRTdGF0ZSgpLCBcIkRhc2hib2FyZFwiLCBhcHAuX2lkKTtcclxuXHJcbkNyZWF0b3IuZ2V0QXBwT2JqZWN0TmFtZXMgPSAoYXBwX2lkKS0+XHJcblx0YXBwID0gQ3JlYXRvci5nZXRBcHAoYXBwX2lkKVxyXG5cdGlmICFhcHBcclxuXHRcdHJldHVyblxyXG5cdGlzTW9iaWxlID0gU3RlZWRvcy5pc01vYmlsZSgpXHJcblx0YXBwT2JqZWN0cyA9IGlmIGlzTW9iaWxlIHRoZW4gYXBwLm1vYmlsZV9vYmplY3RzIGVsc2UgYXBwLm9iamVjdHNcclxuXHRvYmplY3RzID0gW11cclxuXHRpZiBhcHBcclxuXHRcdF8uZWFjaCBhcHBPYmplY3RzLCAodiktPlxyXG5cdFx0XHRvYmogPSBDcmVhdG9yLmdldE9iamVjdCh2KVxyXG5cdFx0XHRpZiBvYmo/LnBlcm1pc3Npb25zLmdldCgpLmFsbG93UmVhZFxyXG5cdFx0XHRcdG9iamVjdHMucHVzaCB2XHJcblx0cmV0dXJuIG9iamVjdHNcclxuXHJcbkNyZWF0b3IuZ2V0VmlzaWJsZUFwcHMgPSAoaW5jbHVkZUFkbWluKS0+XHJcblx0Y2hhbmdlQXBwID0gQ3JlYXRvci5fc3ViQXBwLmdldCgpO1xyXG5cdFJlYWN0U3RlZWRvcy5zdG9yZS5nZXRTdGF0ZSgpLmVudGl0aWVzLmFwcHMgPSBPYmplY3QuYXNzaWduKHt9LCBSZWFjdFN0ZWVkb3Muc3RvcmUuZ2V0U3RhdGUoKS5lbnRpdGllcy5hcHBzLCB7YXBwczogY2hhbmdlQXBwfSk7XHJcblx0cmV0dXJuIFJlYWN0U3RlZWRvcy52aXNpYmxlQXBwc1NlbGVjdG9yKFJlYWN0U3RlZWRvcy5zdG9yZS5nZXRTdGF0ZSgpLCBpbmNsdWRlQWRtaW4pXHJcblxyXG5DcmVhdG9yLmdldFZpc2libGVBcHBzT2JqZWN0cyA9ICgpLT5cclxuXHRhcHBzID0gQ3JlYXRvci5nZXRWaXNpYmxlQXBwcygpXHJcblx0dmlzaWJsZU9iamVjdE5hbWVzID0gXy5mbGF0dGVuKF8ucGx1Y2soYXBwcywnb2JqZWN0cycpKVxyXG5cdG9iamVjdHMgPSBfLmZpbHRlciBDcmVhdG9yLk9iamVjdHMsIChvYmopLT5cclxuXHRcdGlmIHZpc2libGVPYmplY3ROYW1lcy5pbmRleE9mKG9iai5uYW1lKSA8IDBcclxuXHRcdFx0cmV0dXJuIGZhbHNlXHJcblx0XHRlbHNlXHJcblx0XHRcdHJldHVybiB0cnVlXHJcblx0b2JqZWN0cyA9IG9iamVjdHMuc29ydChDcmVhdG9yLnNvcnRpbmdNZXRob2QuYmluZCh7a2V5OlwibGFiZWxcIn0pKVxyXG5cdG9iamVjdHMgPSBfLnBsdWNrKG9iamVjdHMsJ25hbWUnKVxyXG5cdHJldHVybiBfLnVuaXEgb2JqZWN0c1xyXG5cclxuQ3JlYXRvci5nZXRBcHBzT2JqZWN0cyA9ICgpLT5cclxuXHRvYmplY3RzID0gW11cclxuXHR0ZW1wT2JqZWN0cyA9IFtdXHJcblx0Xy5mb3JFYWNoIENyZWF0b3IuQXBwcywgKGFwcCktPlxyXG5cdFx0dGVtcE9iamVjdHMgPSBfLmZpbHRlciBhcHAub2JqZWN0cywgKG9iaiktPlxyXG5cdFx0XHRyZXR1cm4gIW9iai5oaWRkZW5cclxuXHRcdG9iamVjdHMgPSBvYmplY3RzLmNvbmNhdCh0ZW1wT2JqZWN0cylcclxuXHRyZXR1cm4gXy51bmlxIG9iamVjdHNcclxuXHJcbkNyZWF0b3IudmFsaWRhdGVGaWx0ZXJzID0gKGZpbHRlcnMsIGxvZ2ljKS0+XHJcblx0ZmlsdGVyX2l0ZW1zID0gXy5tYXAgZmlsdGVycywgKG9iaikgLT5cclxuXHRcdGlmIF8uaXNFbXB0eShvYmopXHJcblx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRyZXR1cm4gb2JqXHJcblx0ZmlsdGVyX2l0ZW1zID0gXy5jb21wYWN0KGZpbHRlcl9pdGVtcylcclxuXHRlcnJvck1zZyA9IFwiXCJcclxuXHRmaWx0ZXJfbGVuZ3RoID0gZmlsdGVyX2l0ZW1zLmxlbmd0aFxyXG5cdGlmIGxvZ2ljXHJcblx0XHQjIOagvOW8j+WMlmZpbHRlclxyXG5cdFx0bG9naWMgPSBsb2dpYy5yZXBsYWNlKC9cXG4vZywgXCJcIikucmVwbGFjZSgvXFxzKy9nLCBcIiBcIilcclxuXHJcblx0XHQjIOWIpOaWreeJueauiuWtl+esplxyXG5cdFx0aWYgL1suX1xcLSErXSsvaWcudGVzdChsb2dpYylcclxuXHRcdFx0ZXJyb3JNc2cgPSBcIuWQq+acieeJueauiuWtl+espuOAglwiXHJcblxyXG5cdFx0aWYgIWVycm9yTXNnXHJcblx0XHRcdGluZGV4ID0gbG9naWMubWF0Y2goL1xcZCsvaWcpXHJcblx0XHRcdGlmICFpbmRleFxyXG5cdFx0XHRcdGVycm9yTXNnID0gXCLmnInkupvnrZvpgInmnaHku7bov5vooYzkuoblrprkuYnvvIzkvYbmnKrlnKjpq5jnuqfnrZvpgInmnaHku7bkuK3ooqvlvJXnlKjjgIJcIlxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0aW5kZXguZm9yRWFjaCAoaSktPlxyXG5cdFx0XHRcdFx0aWYgaSA8IDEgb3IgaSA+IGZpbHRlcl9sZW5ndGhcclxuXHRcdFx0XHRcdFx0ZXJyb3JNc2cgPSBcIuaCqOeahOetm+mAieadoeS7tuW8leeUqOS6huacquWumuS5ieeahOetm+mAieWZqO+8miN7aX3jgIJcIlxyXG5cclxuXHRcdFx0XHRmbGFnID0gMVxyXG5cdFx0XHRcdHdoaWxlIGZsYWcgPD0gZmlsdGVyX2xlbmd0aFxyXG5cdFx0XHRcdFx0aWYgIWluZGV4LmluY2x1ZGVzKFwiI3tmbGFnfVwiKVxyXG5cdFx0XHRcdFx0XHRlcnJvck1zZyA9IFwi5pyJ5Lqb562b6YCJ5p2h5Lu26L+b6KGM5LqG5a6a5LmJ77yM5L2G5pyq5Zyo6auY57qn562b6YCJ5p2h5Lu25Lit6KKr5byV55So44CCXCJcclxuXHRcdFx0XHRcdGZsYWcrKztcclxuXHJcblx0XHRpZiAhZXJyb3JNc2dcclxuXHRcdFx0IyDliKTmlq3mmK/lkKbmnInpnZ7ms5Xoi7HmloflrZfnrKZcclxuXHRcdFx0d29yZCA9IGxvZ2ljLm1hdGNoKC9bYS16QS1aXSsvaWcpXHJcblx0XHRcdGlmIHdvcmRcclxuXHRcdFx0XHR3b3JkLmZvckVhY2ggKHcpLT5cclxuXHRcdFx0XHRcdGlmICEvXihhbmR8b3IpJC9pZy50ZXN0KHcpXHJcblx0XHRcdFx0XHRcdGVycm9yTXNnID0gXCLmo4Dmn6XmgqjnmoTpq5jnuqfnrZvpgInmnaHku7bkuK3nmoTmi7zlhpnjgIJcIlxyXG5cclxuXHRcdGlmICFlcnJvck1zZ1xyXG5cdFx0XHQjIOWIpOaWreagvOW8j+aYr+WQpuato+ehrlxyXG5cdFx0XHR0cnlcclxuXHRcdFx0XHRDcmVhdG9yLmV2YWwobG9naWMucmVwbGFjZSgvYW5kL2lnLCBcIiYmXCIpLnJlcGxhY2UoL29yL2lnLCBcInx8XCIpKVxyXG5cdFx0XHRjYXRjaCBlXHJcblx0XHRcdFx0ZXJyb3JNc2cgPSBcIuaCqOeahOetm+mAieWZqOS4reWQq+acieeJueauiuWtl+esplwiXHJcblxyXG5cdFx0XHRpZiAvKEFORClbXigpXSsoT1IpL2lnLnRlc3QobG9naWMpIHx8ICAvKE9SKVteKCldKyhBTkQpL2lnLnRlc3QobG9naWMpXHJcblx0XHRcdFx0ZXJyb3JNc2cgPSBcIuaCqOeahOetm+mAieWZqOW/hemhu+WcqOi/nue7reaAp+eahCBBTkQg5ZKMIE9SIOihqOi+vuW8j+WJjeWQjuS9v+eUqOaLrOWPt+OAglwiXHJcblx0aWYgZXJyb3JNc2dcclxuXHRcdGNvbnNvbGUubG9nIFwiZXJyb3JcIiwgZXJyb3JNc2dcclxuXHRcdGlmIE1ldGVvci5pc0NsaWVudFxyXG5cdFx0XHR0b2FzdHIuZXJyb3IoZXJyb3JNc2cpXHJcblx0XHRyZXR1cm4gZmFsc2VcclxuXHRlbHNlXHJcblx0XHRyZXR1cm4gdHJ1ZVxyXG5cclxuIyBcIj1cIiwgXCI8PlwiLCBcIj5cIiwgXCI+PVwiLCBcIjxcIiwgXCI8PVwiLCBcInN0YXJ0c3dpdGhcIiwgXCJjb250YWluc1wiLCBcIm5vdGNvbnRhaW5zXCIuXHJcbiMjI1xyXG5vcHRpb25z5Y+C5pWw77yaXHJcblx0ZXh0ZW5kLS0g5piv5ZCm6ZyA6KaB5oqK5b2T5YmN55So5oi35Z+65pys5L+h5oGv5Yqg5YWl5YWs5byP77yM5Y2z6K6p5YWs5byP5pSv5oyBQ3JlYXRvci5VU0VSX0NPTlRFWFTkuK3nmoTlgLzvvIzpu5jorqTkuLp0cnVlXHJcblx0dXNlcklkLS0g5b2T5YmN55m75b2V55So5oi3XHJcblx0c3BhY2VJZC0tIOW9k+WJjeaJgOWcqOW3peS9nOWMulxyXG5leHRlbmTkuLp0cnVl5pe277yM5ZCO56uv6ZyA6KaB6aKd5aSW5Lyg5YWldXNlcklk5Y+Kc3BhY2VJZOeUqOS6juaKk+WPlkNyZWF0b3IuVVNFUl9DT05URVhU5a+55bqU55qE5YC8XHJcbiMjI1xyXG5DcmVhdG9yLmZvcm1hdEZpbHRlcnNUb01vbmdvID0gKGZpbHRlcnMsIG9wdGlvbnMpLT5cclxuXHR1bmxlc3MgZmlsdGVycz8ubGVuZ3RoXHJcblx0XHRyZXR1cm5cclxuXHQjIOW9k2ZpbHRlcnPkuI3mmK9bQXJyYXld57G75Z6L6ICM5pivW09iamVjdF3nsbvlnovml7bvvIzov5vooYzmoLzlvI/ovazmjaJcclxuXHR1bmxlc3MgZmlsdGVyc1swXSBpbnN0YW5jZW9mIEFycmF5XHJcblx0XHRmaWx0ZXJzID0gXy5tYXAgZmlsdGVycywgKG9iaiktPlxyXG5cdFx0XHRyZXR1cm4gW29iai5maWVsZCwgb2JqLm9wZXJhdGlvbiwgb2JqLnZhbHVlXVxyXG5cdHNlbGVjdG9yID0gW11cclxuXHRfLmVhY2ggZmlsdGVycywgKGZpbHRlciktPlxyXG5cdFx0ZmllbGQgPSBmaWx0ZXJbMF1cclxuXHRcdG9wdGlvbiA9IGZpbHRlclsxXVxyXG5cdFx0aWYgTWV0ZW9yLmlzQ2xpZW50XHJcblx0XHRcdHZhbHVlID0gQ3JlYXRvci5ldmFsdWF0ZUZvcm11bGEoZmlsdGVyWzJdKVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHR2YWx1ZSA9IENyZWF0b3IuZXZhbHVhdGVGb3JtdWxhKGZpbHRlclsyXSwgbnVsbCwgb3B0aW9ucylcclxuXHRcdHN1Yl9zZWxlY3RvciA9IHt9XHJcblx0XHRzdWJfc2VsZWN0b3JbZmllbGRdID0ge31cclxuXHRcdGlmIG9wdGlvbiA9PSBcIj1cIlxyXG5cdFx0XHRzdWJfc2VsZWN0b3JbZmllbGRdW1wiJGVxXCJdID0gdmFsdWVcclxuXHRcdGVsc2UgaWYgb3B0aW9uID09IFwiPD5cIlxyXG5cdFx0XHRzdWJfc2VsZWN0b3JbZmllbGRdW1wiJG5lXCJdID0gdmFsdWVcclxuXHRcdGVsc2UgaWYgb3B0aW9uID09IFwiPlwiXHJcblx0XHRcdHN1Yl9zZWxlY3RvcltmaWVsZF1bXCIkZ3RcIl0gPSB2YWx1ZVxyXG5cdFx0ZWxzZSBpZiBvcHRpb24gPT0gXCI+PVwiXHJcblx0XHRcdHN1Yl9zZWxlY3RvcltmaWVsZF1bXCIkZ3RlXCJdID0gdmFsdWVcclxuXHRcdGVsc2UgaWYgb3B0aW9uID09IFwiPFwiXHJcblx0XHRcdHN1Yl9zZWxlY3RvcltmaWVsZF1bXCIkbHRcIl0gPSB2YWx1ZVxyXG5cdFx0ZWxzZSBpZiBvcHRpb24gPT0gXCI8PVwiXHJcblx0XHRcdHN1Yl9zZWxlY3RvcltmaWVsZF1bXCIkbHRlXCJdID0gdmFsdWVcclxuXHRcdGVsc2UgaWYgb3B0aW9uID09IFwic3RhcnRzd2l0aFwiXHJcblx0XHRcdHJlZyA9IG5ldyBSZWdFeHAoXCJeXCIgKyB2YWx1ZSwgXCJpXCIpXHJcblx0XHRcdHN1Yl9zZWxlY3RvcltmaWVsZF1bXCIkcmVnZXhcIl0gPSByZWdcclxuXHRcdGVsc2UgaWYgb3B0aW9uID09IFwiY29udGFpbnNcIlxyXG5cdFx0XHRyZWcgPSBuZXcgUmVnRXhwKHZhbHVlLCBcImlcIilcclxuXHRcdFx0c3ViX3NlbGVjdG9yW2ZpZWxkXVtcIiRyZWdleFwiXSA9IHJlZ1xyXG5cdFx0ZWxzZSBpZiBvcHRpb24gPT0gXCJub3Rjb250YWluc1wiXHJcblx0XHRcdHJlZyA9IG5ldyBSZWdFeHAoXCJeKCg/IVwiICsgdmFsdWUgKyBcIikuKSokXCIsIFwiaVwiKVxyXG5cdFx0XHRzdWJfc2VsZWN0b3JbZmllbGRdW1wiJHJlZ2V4XCJdID0gcmVnXHJcblx0XHRzZWxlY3Rvci5wdXNoIHN1Yl9zZWxlY3RvclxyXG5cdHJldHVybiBzZWxlY3RvclxyXG5cclxuQ3JlYXRvci5pc0JldHdlZW5GaWx0ZXJPcGVyYXRpb24gPSAob3BlcmF0aW9uKS0+XHJcblx0cmV0dXJuIG9wZXJhdGlvbiA9PSBcImJldHdlZW5cIiBvciAhIUNyZWF0b3IuZ2V0QmV0d2VlblRpbWVCdWlsdGluVmFsdWVzKHRydWUpP1tvcGVyYXRpb25dXHJcblxyXG4jIyNcclxub3B0aW9uc+WPguaVsO+8mlxyXG5cdGV4dGVuZC0tIOaYr+WQpumcgOimgeaKiuW9k+WJjeeUqOaIt+WfuuacrOS/oeaBr+WKoOWFpeWFrOW8j++8jOWNs+iuqeWFrOW8j+aUr+aMgUNyZWF0b3IuVVNFUl9DT05URVhU5Lit55qE5YC877yM6buY6K6k5Li6dHJ1ZVxyXG5cdHVzZXJJZC0tIOW9k+WJjeeZu+W9leeUqOaIt1xyXG5cdHNwYWNlSWQtLSDlvZPliY3miYDlnKjlt6XkvZzljLpcclxuXHRleHRlbmTkuLp0cnVl5pe277yM5ZCO56uv6ZyA6KaB6aKd5aSW5Lyg5YWldXNlcklk5Y+Kc3BhY2VJZOeUqOS6juaKk+WPlkNyZWF0b3IuVVNFUl9DT05URVhU5a+55bqU55qE5YC8XHJcbiMjI1xyXG5DcmVhdG9yLmZvcm1hdEZpbHRlcnNUb0RldiA9IChmaWx0ZXJzLCBvYmplY3RfbmFtZSwgb3B0aW9ucyktPlxyXG5cdHN0ZWVkb3NGaWx0ZXJzID0gcmVxdWlyZShcIkBzdGVlZG9zL2ZpbHRlcnNcIik7XHJcblx0dW5sZXNzIGZpbHRlcnMubGVuZ3RoXHJcblx0XHRyZXR1cm5cclxuXHRpZiBvcHRpb25zPy5pc19sb2dpY19vclxyXG5cdFx0IyDlpoLmnpxpc19sb2dpY19vcuS4unRydWXvvIzkuLpmaWx0ZXJz56ys5LiA5bGC5YWD57Sg5aKe5Yqgb3Lpl7TpmpRcclxuXHRcdGxvZ2ljVGVtcEZpbHRlcnMgPSBbXVxyXG5cdFx0ZmlsdGVycy5mb3JFYWNoIChuKS0+XHJcblx0XHRcdGxvZ2ljVGVtcEZpbHRlcnMucHVzaChuKVxyXG5cdFx0XHRsb2dpY1RlbXBGaWx0ZXJzLnB1c2goXCJvclwiKVxyXG5cdFx0bG9naWNUZW1wRmlsdGVycy5wb3AoKVxyXG5cdFx0ZmlsdGVycyA9IGxvZ2ljVGVtcEZpbHRlcnNcclxuXHRzZWxlY3RvciA9IHN0ZWVkb3NGaWx0ZXJzLmZvcm1hdEZpbHRlcnNUb0RldihmaWx0ZXJzLCBDcmVhdG9yLlVTRVJfQ09OVEVYVClcclxuXHRyZXR1cm4gc2VsZWN0b3JcclxuXHJcbiMjI1xyXG5vcHRpb25z5Y+C5pWw77yaXHJcblx0ZXh0ZW5kLS0g5piv5ZCm6ZyA6KaB5oqK5b2T5YmN55So5oi35Z+65pys5L+h5oGv5Yqg5YWl5YWs5byP77yM5Y2z6K6p5YWs5byP5pSv5oyBQ3JlYXRvci5VU0VSX0NPTlRFWFTkuK3nmoTlgLzvvIzpu5jorqTkuLp0cnVlXHJcblx0dXNlcklkLS0g5b2T5YmN55m75b2V55So5oi3XHJcblx0c3BhY2VJZC0tIOW9k+WJjeaJgOWcqOW3peS9nOWMulxyXG5leHRlbmTkuLp0cnVl5pe277yM5ZCO56uv6ZyA6KaB6aKd5aSW5Lyg5YWldXNlcklk5Y+Kc3BhY2VJZOeUqOS6juaKk+WPlkNyZWF0b3IuVVNFUl9DT05URVhU5a+55bqU55qE5YC8XHJcbiMjI1xyXG5DcmVhdG9yLmZvcm1hdExvZ2ljRmlsdGVyc1RvRGV2ID0gKGZpbHRlcnMsIGZpbHRlcl9sb2dpYywgb3B0aW9ucyktPlxyXG5cdGZvcm1hdF9sb2dpYyA9IGZpbHRlcl9sb2dpYy5yZXBsYWNlKC9cXChcXHMrL2lnLCBcIihcIikucmVwbGFjZSgvXFxzK1xcKS9pZywgXCIpXCIpLnJlcGxhY2UoL1xcKC9nLCBcIltcIikucmVwbGFjZSgvXFwpL2csIFwiXVwiKS5yZXBsYWNlKC9cXHMrL2csIFwiLFwiKS5yZXBsYWNlKC8oYW5kfG9yKS9pZywgXCInJDEnXCIpXHJcblx0Zm9ybWF0X2xvZ2ljID0gZm9ybWF0X2xvZ2ljLnJlcGxhY2UoLyhcXGQpKy9pZywgKHgpLT5cclxuXHRcdF9mID0gZmlsdGVyc1t4LTFdXHJcblx0XHRmaWVsZCA9IF9mLmZpZWxkXHJcblx0XHRvcHRpb24gPSBfZi5vcGVyYXRpb25cclxuXHRcdGlmIE1ldGVvci5pc0NsaWVudFxyXG5cdFx0XHR2YWx1ZSA9IENyZWF0b3IuZXZhbHVhdGVGb3JtdWxhKF9mLnZhbHVlKVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHR2YWx1ZSA9IENyZWF0b3IuZXZhbHVhdGVGb3JtdWxhKF9mLnZhbHVlLCBudWxsLCBvcHRpb25zKVxyXG5cdFx0c3ViX3NlbGVjdG9yID0gW11cclxuXHRcdGlmIF8uaXNBcnJheSh2YWx1ZSkgPT0gdHJ1ZVxyXG5cdFx0XHRpZiBvcHRpb24gPT0gXCI9XCJcclxuXHRcdFx0XHRfLmVhY2ggdmFsdWUsICh2KS0+XHJcblx0XHRcdFx0XHRzdWJfc2VsZWN0b3IucHVzaCBbZmllbGQsIG9wdGlvbiwgdl0sIFwib3JcIlxyXG5cdFx0XHRlbHNlIGlmIG9wdGlvbiA9PSBcIjw+XCJcclxuXHRcdFx0XHRfLmVhY2ggdmFsdWUsICh2KS0+XHJcblx0XHRcdFx0XHRzdWJfc2VsZWN0b3IucHVzaCBbZmllbGQsIG9wdGlvbiwgdl0sIFwiYW5kXCJcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdF8uZWFjaCB2YWx1ZSwgKHYpLT5cclxuXHRcdFx0XHRcdHN1Yl9zZWxlY3Rvci5wdXNoIFtmaWVsZCwgb3B0aW9uLCB2XSwgXCJvclwiXHJcblx0XHRcdGlmIHN1Yl9zZWxlY3RvcltzdWJfc2VsZWN0b3IubGVuZ3RoIC0gMV0gPT0gXCJhbmRcIiB8fCBzdWJfc2VsZWN0b3Jbc3ViX3NlbGVjdG9yLmxlbmd0aCAtIDFdID09IFwib3JcIlxyXG5cdFx0XHRcdHN1Yl9zZWxlY3Rvci5wb3AoKVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRzdWJfc2VsZWN0b3IgPSBbZmllbGQsIG9wdGlvbiwgdmFsdWVdXHJcblx0XHRjb25zb2xlLmxvZyBcInN1Yl9zZWxlY3RvclwiLCBzdWJfc2VsZWN0b3JcclxuXHRcdHJldHVybiBKU09OLnN0cmluZ2lmeShzdWJfc2VsZWN0b3IpXHJcblx0KVxyXG5cdGZvcm1hdF9sb2dpYyA9IFwiWyN7Zm9ybWF0X2xvZ2ljfV1cIlxyXG5cdHJldHVybiBDcmVhdG9yLmV2YWwoZm9ybWF0X2xvZ2ljKVxyXG5cclxuQ3JlYXRvci5nZXRSZWxhdGVkT2JqZWN0cyA9IChvYmplY3RfbmFtZSwgc3BhY2VJZCwgdXNlcklkKS0+XHJcblx0aWYgTWV0ZW9yLmlzQ2xpZW50XHJcblx0XHRpZiAhb2JqZWN0X25hbWVcclxuXHRcdFx0b2JqZWN0X25hbWUgPSBTZXNzaW9uLmdldChcIm9iamVjdF9uYW1lXCIpXHJcblx0XHRpZiAhc3BhY2VJZFxyXG5cdFx0XHRzcGFjZUlkID0gU2Vzc2lvbi5nZXQoXCJzcGFjZUlkXCIpXHJcblx0XHRpZiAhdXNlcklkXHJcblx0XHRcdHVzZXJJZCA9IE1ldGVvci51c2VySWQoKVxyXG5cclxuXHRyZWxhdGVkX29iamVjdF9uYW1lcyA9IFtdXHJcblx0X29iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KG9iamVjdF9uYW1lKVxyXG5cclxuXHRpZiAhX29iamVjdFxyXG5cdFx0cmV0dXJuIHJlbGF0ZWRfb2JqZWN0X25hbWVzXHJcblxyXG4jXHRyZWxhdGVkX29iamVjdF9uYW1lcyA9IF8ucGx1Y2soX29iamVjdC5yZWxhdGVkX29iamVjdHMsXCJvYmplY3RfbmFtZVwiKVxyXG5cclxuXHRyZWxhdGVkX29iamVjdHMgPSBDcmVhdG9yLmdldE9iamVjdFJlbGF0ZWRzKF9vYmplY3QuX2NvbGxlY3Rpb25fbmFtZSlcclxuXHJcblx0cmVsYXRlZF9vYmplY3RfbmFtZXMgPSBfLnBsdWNrKHJlbGF0ZWRfb2JqZWN0cyxcIm9iamVjdF9uYW1lXCIpXHJcblx0aWYgcmVsYXRlZF9vYmplY3RfbmFtZXM/Lmxlbmd0aCA9PSAwXHJcblx0XHRyZXR1cm4gcmVsYXRlZF9vYmplY3RfbmFtZXNcclxuXHJcblx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldFBlcm1pc3Npb25zKG9iamVjdF9uYW1lLCBzcGFjZUlkLCB1c2VySWQpXHJcblx0dW5yZWxhdGVkX29iamVjdHMgPSBwZXJtaXNzaW9ucy51bnJlbGF0ZWRfb2JqZWN0c1xyXG5cclxuXHRyZWxhdGVkX29iamVjdF9uYW1lcyA9IF8uZGlmZmVyZW5jZSByZWxhdGVkX29iamVjdF9uYW1lcywgdW5yZWxhdGVkX29iamVjdHNcclxuXHRyZXR1cm4gXy5maWx0ZXIgcmVsYXRlZF9vYmplY3RzLCAocmVsYXRlZF9vYmplY3QpLT5cclxuXHRcdHJlbGF0ZWRfb2JqZWN0X25hbWUgPSByZWxhdGVkX29iamVjdC5vYmplY3RfbmFtZVxyXG5cdFx0aXNBY3RpdmUgPSByZWxhdGVkX29iamVjdF9uYW1lcy5pbmRleE9mKHJlbGF0ZWRfb2JqZWN0X25hbWUpID4gLTFcclxuXHRcdGFsbG93UmVhZCA9IENyZWF0b3IuZ2V0UGVybWlzc2lvbnMocmVsYXRlZF9vYmplY3RfbmFtZSwgc3BhY2VJZCwgdXNlcklkKT8uYWxsb3dSZWFkXHJcblx0XHRyZXR1cm4gaXNBY3RpdmUgYW5kIGFsbG93UmVhZFxyXG5cclxuQ3JlYXRvci5nZXRSZWxhdGVkT2JqZWN0TmFtZXMgPSAob2JqZWN0X25hbWUsIHNwYWNlSWQsIHVzZXJJZCktPlxyXG5cdHJlbGF0ZWRfb2JqZWN0cyA9IENyZWF0b3IuZ2V0UmVsYXRlZE9iamVjdHMob2JqZWN0X25hbWUsIHNwYWNlSWQsIHVzZXJJZClcclxuXHRyZXR1cm4gXy5wbHVjayhyZWxhdGVkX29iamVjdHMsXCJvYmplY3RfbmFtZVwiKVxyXG5cclxuQ3JlYXRvci5nZXRBY3Rpb25zID0gKG9iamVjdF9uYW1lLCBzcGFjZUlkLCB1c2VySWQpLT5cclxuXHRpZiBNZXRlb3IuaXNDbGllbnRcclxuXHRcdGlmICFvYmplY3RfbmFtZVxyXG5cdFx0XHRvYmplY3RfbmFtZSA9IFNlc3Npb24uZ2V0KFwib2JqZWN0X25hbWVcIilcclxuXHRcdGlmICFzcGFjZUlkXHJcblx0XHRcdHNwYWNlSWQgPSBTZXNzaW9uLmdldChcInNwYWNlSWRcIilcclxuXHRcdGlmICF1c2VySWRcclxuXHRcdFx0dXNlcklkID0gTWV0ZW9yLnVzZXJJZCgpXHJcblxyXG5cdG9iaiA9IENyZWF0b3IuZ2V0T2JqZWN0KG9iamVjdF9uYW1lKVxyXG5cclxuXHRpZiAhb2JqXHJcblx0XHRyZXR1cm5cclxuXHJcblx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldFBlcm1pc3Npb25zKG9iamVjdF9uYW1lLCBzcGFjZUlkLCB1c2VySWQpXHJcblx0ZGlzYWJsZWRfYWN0aW9ucyA9IHBlcm1pc3Npb25zLmRpc2FibGVkX2FjdGlvbnNcclxuXHRhY3Rpb25zID0gXy5zb3J0QnkoXy52YWx1ZXMob2JqLmFjdGlvbnMpICwgJ3NvcnQnKTtcclxuXHJcblx0aWYgXy5oYXMob2JqLCAnYWxsb3dfYWN0aW9ucycpXHJcblx0XHRhY3Rpb25zID0gXy5maWx0ZXIgYWN0aW9ucywgKGFjdGlvbiktPlxyXG5cdFx0XHRyZXR1cm4gXy5pbmNsdWRlKG9iai5hbGxvd19hY3Rpb25zLCBhY3Rpb24ubmFtZSlcclxuXHJcblx0Xy5lYWNoIGFjdGlvbnMsIChhY3Rpb24pLT5cclxuXHRcdCMg5omL5py65LiK5Y+q5pi+56S657yW6L6R5oyJ6ZKu77yM5YW25LuW55qE5pS+5Yiw5oqY5Y+g5LiL5ouJ6I+c5Y2V5LitXHJcblx0XHRpZiBTdGVlZG9zLmlzTW9iaWxlKCkgJiYgW1wicmVjb3JkXCIsIFwicmVjb3JkX29ubHlcIl0uaW5kZXhPZihhY3Rpb24ub24pID4gLTEgJiYgYWN0aW9uLm5hbWUgIT0gJ3N0YW5kYXJkX2VkaXQnXHJcblx0XHRcdGlmIGFjdGlvbi5vbiA9PSBcInJlY29yZF9vbmx5XCJcclxuXHRcdFx0XHRhY3Rpb24ub24gPSAncmVjb3JkX29ubHlfbW9yZSdcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdGFjdGlvbi5vbiA9ICdyZWNvcmRfbW9yZSdcclxuXHJcblx0aWYgU3RlZWRvcy5pc01vYmlsZSgpICYmIFtcImNtc19maWxlc1wiLCBcImNmcy5maWxlcy5maWxlcmVjb3JkXCJdLmluZGV4T2Yob2JqZWN0X25hbWUpID4gLTFcclxuXHRcdCMg6ZmE5Lu254m55q6K5aSE55CG77yM5LiL6L295oyJ6ZKu5pS+5Zyo5Li76I+c5Y2V77yM57yW6L6R5oyJ6ZKu5pS+5Yiw5bqV5LiL5oqY5Y+g5LiL5ouJ6I+c5Y2V5LitXHJcblx0XHRhY3Rpb25zLmZpbmQoKG4pLT4gcmV0dXJuIG4ubmFtZSA9PSBcInN0YW5kYXJkX2VkaXRcIik/Lm9uID0gXCJyZWNvcmRfbW9yZVwiXHJcblx0XHRhY3Rpb25zLmZpbmQoKG4pLT4gcmV0dXJuIG4ubmFtZSA9PSBcImRvd25sb2FkXCIpPy5vbiA9IFwicmVjb3JkXCJcclxuXHJcblx0YWN0aW9ucyA9IF8uZmlsdGVyIGFjdGlvbnMsIChhY3Rpb24pLT5cclxuXHRcdHJldHVybiBfLmluZGV4T2YoZGlzYWJsZWRfYWN0aW9ucywgYWN0aW9uLm5hbWUpIDwgMFxyXG5cclxuXHRyZXR1cm4gYWN0aW9uc1xyXG5cclxuLy8vXHJcblx06L+U5Zue5b2T5YmN55So5oi35pyJ5p2D6ZmQ6K6/6Zeu55qE5omA5pyJbGlzdF92aWV377yM5YyF5ous5YiG5Lqr55qE77yM55So5oi36Ieq5a6a5LmJ6Z2e5YiG5Lqr55qE77yI6Zmk6Z2eb3duZXLlj5jkuobvvInvvIzku6Xlj4rpu5jorqTnmoTlhbbku5bop4blm75cclxuXHTms6jmhI9DcmVhdG9yLmdldFBlcm1pc3Npb25z5Ye95pWw5Lit5piv5LiN5Lya5pyJ55So5oi36Ieq5a6a5LmJ6Z2e5YiG5Lqr55qE6KeG5Zu+55qE77yM5omA5LulQ3JlYXRvci5nZXRQZXJtaXNzaW9uc+WHveaVsOS4reaLv+WIsOeahOe7k+aenOS4jeWFqO+8jOW5tuS4jeaYr+W9k+WJjeeUqOaIt+iDveeci+WIsOaJgOacieinhuWbvlxyXG4vLy9cclxuQ3JlYXRvci5nZXRMaXN0Vmlld3MgPSAob2JqZWN0X25hbWUsIHNwYWNlSWQsIHVzZXJJZCktPlxyXG5cdGlmIE1ldGVvci5pc0NsaWVudFxyXG5cdFx0aWYgIW9iamVjdF9uYW1lXHJcblx0XHRcdG9iamVjdF9uYW1lID0gU2Vzc2lvbi5nZXQoXCJvYmplY3RfbmFtZVwiKVxyXG5cdFx0aWYgIXNwYWNlSWRcclxuXHRcdFx0c3BhY2VJZCA9IFNlc3Npb24uZ2V0KFwic3BhY2VJZFwiKVxyXG5cdFx0aWYgIXVzZXJJZFxyXG5cdFx0XHR1c2VySWQgPSBNZXRlb3IudXNlcklkKClcclxuXHRcclxuXHR1bmxlc3Mgb2JqZWN0X25hbWVcclxuXHRcdHJldHVyblxyXG5cclxuXHRvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSlcclxuXHJcblx0aWYgIW9iamVjdFxyXG5cdFx0cmV0dXJuXHJcblxyXG5cdGRpc2FibGVkX2xpc3Rfdmlld3MgPSBDcmVhdG9yLmdldFBlcm1pc3Npb25zKG9iamVjdF9uYW1lLCBzcGFjZUlkLCB1c2VySWQpPy5kaXNhYmxlZF9saXN0X3ZpZXdzIHx8IFtdXHJcblxyXG5cdGxpc3Rfdmlld3MgPSBbXVxyXG5cclxuXHRpc01vYmlsZSA9IFN0ZWVkb3MuaXNNb2JpbGUoKVxyXG5cclxuXHRfLmVhY2ggb2JqZWN0Lmxpc3Rfdmlld3MsIChpdGVtLCBpdGVtX25hbWUpLT5cclxuXHRcdGlmIGlzTW9iaWxlIGFuZCBpdGVtLnR5cGUgPT0gXCJjYWxlbmRhclwiXHJcblx0XHRcdCMg5omL5py65LiK5YWI5LiN5pi+56S65pel5Y6G6KeG5Zu+XHJcblx0XHRcdHJldHVyblxyXG5cdFx0aWYgaXRlbV9uYW1lICE9IFwiZGVmYXVsdFwiXHJcblx0XHRcdGlmIF8uaW5kZXhPZihkaXNhYmxlZF9saXN0X3ZpZXdzLCBpdGVtX25hbWUpIDwgMCB8fCBpdGVtLm93bmVyID09IHVzZXJJZFxyXG5cdFx0XHRcdGxpc3Rfdmlld3MucHVzaCBpdGVtXHJcblxyXG5cdHJldHVybiBsaXN0X3ZpZXdzXHJcblxyXG4jIOWJjeWPsOeQhuiuuuS4iuS4jeW6lOivpeiwg+eUqOivpeWHveaVsO+8jOWboOS4uuWtl+auteeahOadg+mZkOmDveWcqENyZWF0b3IuZ2V0T2JqZWN0KG9iamVjdF9uYW1lKS5maWVsZHPnmoTnm7jlhbPlsZ7mgKfkuK3mnInmoIfor4bkuoZcclxuQ3JlYXRvci5nZXRGaWVsZHMgPSAob2JqZWN0X25hbWUsIHNwYWNlSWQsIHVzZXJJZCktPlxyXG5cdGlmIE1ldGVvci5pc0NsaWVudFxyXG5cdFx0aWYgIW9iamVjdF9uYW1lXHJcblx0XHRcdG9iamVjdF9uYW1lID0gU2Vzc2lvbi5nZXQoXCJvYmplY3RfbmFtZVwiKVxyXG5cdFx0aWYgIXNwYWNlSWRcclxuXHRcdFx0c3BhY2VJZCA9IFNlc3Npb24uZ2V0KFwic3BhY2VJZFwiKVxyXG5cdFx0aWYgIXVzZXJJZFxyXG5cdFx0XHR1c2VySWQgPSBNZXRlb3IudXNlcklkKClcclxuXHJcblx0ZmllbGRzTmFtZSA9IENyZWF0b3IuZ2V0T2JqZWN0RmllbGRzTmFtZShvYmplY3RfbmFtZSlcclxuXHR1bnJlYWRhYmxlX2ZpZWxkcyA9ICBDcmVhdG9yLmdldFBlcm1pc3Npb25zKG9iamVjdF9uYW1lLCBzcGFjZUlkLCB1c2VySWQpPy51bnJlYWRhYmxlX2ZpZWxkc1xyXG5cdHJldHVybiBfLmRpZmZlcmVuY2UoZmllbGRzTmFtZSwgdW5yZWFkYWJsZV9maWVsZHMpXHJcblxyXG5DcmVhdG9yLmlzbG9hZGluZyA9ICgpLT5cclxuXHRyZXR1cm4gIUNyZWF0b3IuYm9vdHN0cmFwTG9hZGVkLmdldCgpXHJcblxyXG5DcmVhdG9yLmNvbnZlcnRTcGVjaWFsQ2hhcmFjdGVyID0gKHN0ciktPlxyXG5cdHJldHVybiBzdHIucmVwbGFjZSgvKFtcXF5cXCRcXChcXClcXCpcXCtcXD9cXC5cXFxcXFx8XFxbXFxdXFx7XFx9XSkvZywgXCJcXFxcJDFcIilcclxuXHJcbiMg6K6h566XZmllbGRz55u45YWz5Ye95pWwXHJcbiMgU1RBUlRcclxuQ3JlYXRvci5nZXREaXNhYmxlZEZpZWxkcyA9IChzY2hlbWEpLT5cclxuXHRmaWVsZHMgPSBfLm1hcChzY2hlbWEsIChmaWVsZCwgZmllbGROYW1lKSAtPlxyXG5cdFx0cmV0dXJuIGZpZWxkLmF1dG9mb3JtIGFuZCBmaWVsZC5hdXRvZm9ybS5kaXNhYmxlZCBhbmQgIWZpZWxkLmF1dG9mb3JtLm9taXQgYW5kIGZpZWxkTmFtZVxyXG5cdClcclxuXHRmaWVsZHMgPSBfLmNvbXBhY3QoZmllbGRzKVxyXG5cdHJldHVybiBmaWVsZHNcclxuXHJcbkNyZWF0b3IuZ2V0SGlkZGVuRmllbGRzID0gKHNjaGVtYSktPlxyXG5cdGZpZWxkcyA9IF8ubWFwKHNjaGVtYSwgKGZpZWxkLCBmaWVsZE5hbWUpIC0+XHJcblx0XHRyZXR1cm4gZmllbGQuYXV0b2Zvcm0gYW5kIGZpZWxkLmF1dG9mb3JtLnR5cGUgPT0gXCJoaWRkZW5cIiBhbmQgIWZpZWxkLmF1dG9mb3JtLm9taXQgYW5kIGZpZWxkTmFtZVxyXG5cdClcclxuXHRmaWVsZHMgPSBfLmNvbXBhY3QoZmllbGRzKVxyXG5cdHJldHVybiBmaWVsZHNcclxuXHJcbkNyZWF0b3IuZ2V0RmllbGRzV2l0aE5vR3JvdXAgPSAoc2NoZW1hKS0+XHJcblx0ZmllbGRzID0gXy5tYXAoc2NoZW1hLCAoZmllbGQsIGZpZWxkTmFtZSkgLT5cclxuXHRcdHJldHVybiAoIWZpZWxkLmF1dG9mb3JtIG9yICFmaWVsZC5hdXRvZm9ybS5ncm91cCBvciBmaWVsZC5hdXRvZm9ybS5ncm91cCA9PSBcIi1cIikgYW5kICghZmllbGQuYXV0b2Zvcm0gb3IgZmllbGQuYXV0b2Zvcm0udHlwZSAhPSBcImhpZGRlblwiKSBhbmQgZmllbGROYW1lXHJcblx0KVxyXG5cdGZpZWxkcyA9IF8uY29tcGFjdChmaWVsZHMpXHJcblx0cmV0dXJuIGZpZWxkc1xyXG5cclxuQ3JlYXRvci5nZXRTb3J0ZWRGaWVsZEdyb3VwTmFtZXMgPSAoc2NoZW1hKS0+XHJcblx0bmFtZXMgPSBfLm1hcChzY2hlbWEsIChmaWVsZCkgLT5cclxuIFx0XHRyZXR1cm4gZmllbGQuYXV0b2Zvcm0gYW5kIGZpZWxkLmF1dG9mb3JtLmdyb3VwICE9IFwiLVwiIGFuZCBmaWVsZC5hdXRvZm9ybS5ncm91cFxyXG5cdClcclxuXHRuYW1lcyA9IF8uY29tcGFjdChuYW1lcylcclxuXHRuYW1lcyA9IF8udW5pcXVlKG5hbWVzKVxyXG5cdHJldHVybiBuYW1lc1xyXG5cclxuQ3JlYXRvci5nZXRGaWVsZHNGb3JHcm91cCA9IChzY2hlbWEsIGdyb3VwTmFtZSkgLT5cclxuICBcdGZpZWxkcyA9IF8ubWFwKHNjaGVtYSwgKGZpZWxkLCBmaWVsZE5hbWUpIC0+XHJcbiAgICBcdHJldHVybiBmaWVsZC5hdXRvZm9ybSBhbmQgZmllbGQuYXV0b2Zvcm0uZ3JvdXAgPT0gZ3JvdXBOYW1lIGFuZCBmaWVsZC5hdXRvZm9ybS50eXBlICE9IFwiaGlkZGVuXCIgYW5kIGZpZWxkTmFtZVxyXG4gIFx0KVxyXG4gIFx0ZmllbGRzID0gXy5jb21wYWN0KGZpZWxkcylcclxuICBcdHJldHVybiBmaWVsZHNcclxuXHJcbkNyZWF0b3IuZ2V0RmllbGRzV2l0aG91dE9taXQgPSAoc2NoZW1hLCBrZXlzKSAtPlxyXG5cdGtleXMgPSBfLm1hcChrZXlzLCAoa2V5KSAtPlxyXG5cdFx0ZmllbGQgPSBfLnBpY2soc2NoZW1hLCBrZXkpXHJcblx0XHRpZiBmaWVsZFtrZXldLmF1dG9mb3JtPy5vbWl0XHJcblx0XHRcdHJldHVybiBmYWxzZVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRyZXR1cm4ga2V5XHJcblx0KVxyXG5cdGtleXMgPSBfLmNvbXBhY3Qoa2V5cylcclxuXHRyZXR1cm4ga2V5c1xyXG5cclxuQ3JlYXRvci5nZXRGaWVsZHNJbkZpcnN0TGV2ZWwgPSAoZmlyc3RMZXZlbEtleXMsIGtleXMpIC0+XHJcblx0a2V5cyA9IF8ubWFwKGtleXMsIChrZXkpIC0+XHJcblx0XHRpZiBfLmluZGV4T2YoZmlyc3RMZXZlbEtleXMsIGtleSkgPiAtMVxyXG5cdFx0XHRyZXR1cm4ga2V5XHJcblx0XHRlbHNlXHJcblx0XHRcdHJldHVybiBmYWxzZVxyXG5cdClcclxuXHRrZXlzID0gXy5jb21wYWN0KGtleXMpXHJcblx0cmV0dXJuIGtleXNcclxuXHJcbkNyZWF0b3IuZ2V0RmllbGRzRm9yUmVvcmRlciA9IChzY2hlbWEsIGtleXMsIGlzU2luZ2xlKSAtPlxyXG5cdGZpZWxkcyA9IFtdXHJcblx0aSA9IDBcclxuXHRfa2V5cyA9IF8uZmlsdGVyKGtleXMsIChrZXkpLT5cclxuXHRcdHJldHVybiAha2V5LmVuZHNXaXRoKCdfZW5kTGluZScpXHJcblx0KTtcclxuXHR3aGlsZSBpIDwgX2tleXMubGVuZ3RoXHJcblx0XHRzY18xID0gXy5waWNrKHNjaGVtYSwgX2tleXNbaV0pXHJcblx0XHRzY18yID0gXy5waWNrKHNjaGVtYSwgX2tleXNbaSsxXSlcclxuXHJcblx0XHRpc193aWRlXzEgPSBmYWxzZVxyXG5cdFx0aXNfd2lkZV8yID0gZmFsc2VcclxuXHJcbiNcdFx0aXNfcmFuZ2VfMSA9IGZhbHNlXHJcbiNcdFx0aXNfcmFuZ2VfMiA9IGZhbHNlXHJcblxyXG5cdFx0Xy5lYWNoIHNjXzEsICh2YWx1ZSkgLT5cclxuXHRcdFx0aWYgdmFsdWUuYXV0b2Zvcm0/LmlzX3dpZGUgfHwgdmFsdWUuYXV0b2Zvcm0/LnR5cGUgPT0gXCJ0YWJsZVwiXHJcblx0XHRcdFx0aXNfd2lkZV8xID0gdHJ1ZVxyXG5cclxuI1x0XHRcdGlmIHZhbHVlLmF1dG9mb3JtPy5pc19yYW5nZVxyXG4jXHRcdFx0XHRpc19yYW5nZV8xID0gdHJ1ZVxyXG5cclxuXHRcdF8uZWFjaCBzY18yLCAodmFsdWUpIC0+XHJcblx0XHRcdGlmIHZhbHVlLmF1dG9mb3JtPy5pc193aWRlIHx8IHZhbHVlLmF1dG9mb3JtPy50eXBlID09IFwidGFibGVcIlxyXG5cdFx0XHRcdGlzX3dpZGVfMiA9IHRydWVcclxuXHJcbiNcdFx0XHRpZiB2YWx1ZS5hdXRvZm9ybT8uaXNfcmFuZ2VcclxuI1x0XHRcdFx0aXNfcmFuZ2VfMiA9IHRydWVcclxuXHJcblx0XHRpZiBTdGVlZG9zLmlzTW9iaWxlKClcclxuXHRcdFx0aXNfd2lkZV8xID0gdHJ1ZVxyXG5cdFx0XHRpc193aWRlXzIgPSB0cnVlXHJcblxyXG5cdFx0aWYgaXNTaW5nbGVcclxuXHRcdFx0ZmllbGRzLnB1c2ggX2tleXMuc2xpY2UoaSwgaSsxKVxyXG5cdFx0XHRpICs9IDFcclxuXHRcdGVsc2VcclxuI1x0XHRcdGlmICFpc19yYW5nZV8xICYmIGlzX3JhbmdlXzJcclxuI1x0XHRcdFx0Y2hpbGRLZXlzID0gX2tleXMuc2xpY2UoaSwgaSsxKVxyXG4jXHRcdFx0XHRjaGlsZEtleXMucHVzaCB1bmRlZmluZWRcclxuI1x0XHRcdFx0ZmllbGRzLnB1c2ggY2hpbGRLZXlzXHJcbiNcdFx0XHRcdGkgKz0gMVxyXG4jXHRcdFx0ZWxzZVxyXG5cdFx0XHRpZiBpc193aWRlXzFcclxuXHRcdFx0XHRmaWVsZHMucHVzaCBfa2V5cy5zbGljZShpLCBpKzEpXHJcblx0XHRcdFx0aSArPSAxXHJcblx0XHRcdGVsc2UgaWYgIWlzX3dpZGVfMSBhbmQgaXNfd2lkZV8yXHJcblx0XHRcdFx0Y2hpbGRLZXlzID0gX2tleXMuc2xpY2UoaSwgaSsxKVxyXG5cdFx0XHRcdGNoaWxkS2V5cy5wdXNoIHVuZGVmaW5lZFxyXG5cdFx0XHRcdGZpZWxkcy5wdXNoIGNoaWxkS2V5c1xyXG5cdFx0XHRcdGkgKz0gMVxyXG5cdFx0XHRlbHNlIGlmICFpc193aWRlXzEgYW5kICFpc193aWRlXzJcclxuXHRcdFx0XHRjaGlsZEtleXMgPSBfa2V5cy5zbGljZShpLCBpKzEpXHJcblx0XHRcdFx0aWYgX2tleXNbaSsxXVxyXG5cdFx0XHRcdFx0Y2hpbGRLZXlzLnB1c2ggX2tleXNbaSsxXVxyXG5cdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdGNoaWxkS2V5cy5wdXNoIHVuZGVmaW5lZFxyXG5cdFx0XHRcdGZpZWxkcy5wdXNoIGNoaWxkS2V5c1xyXG5cdFx0XHRcdGkgKz0gMlxyXG5cclxuXHRyZXR1cm4gZmllbGRzXHJcblxyXG5DcmVhdG9yLmlzRmlsdGVyVmFsdWVFbXB0eSA9ICh2KSAtPlxyXG5cdHJldHVybiB0eXBlb2YgdiA9PSBcInVuZGVmaW5lZFwiIHx8IHYgPT0gbnVsbCB8fCBOdW1iZXIuaXNOYU4odikgfHwgdi5sZW5ndGggPT0gMFxyXG5cclxuIyBFTkRcclxuXHJcbmlmIE1ldGVvci5pc1NlcnZlclxyXG5cdENyZWF0b3IuZ2V0QWxsUmVsYXRlZE9iamVjdHMgPSAob2JqZWN0X25hbWUpLT5cclxuXHRcdHJlbGF0ZWRfb2JqZWN0X25hbWVzID0gW11cclxuXHRcdF8uZWFjaCBDcmVhdG9yLk9iamVjdHMsIChyZWxhdGVkX29iamVjdCwgcmVsYXRlZF9vYmplY3RfbmFtZSktPlxyXG5cdFx0XHRfLmVhY2ggcmVsYXRlZF9vYmplY3QuZmllbGRzLCAocmVsYXRlZF9maWVsZCwgcmVsYXRlZF9maWVsZF9uYW1lKS0+XHJcblx0XHRcdFx0aWYgcmVsYXRlZF9maWVsZC50eXBlID09IFwibWFzdGVyX2RldGFpbFwiIGFuZCByZWxhdGVkX2ZpZWxkLnJlZmVyZW5jZV90byBhbmQgcmVsYXRlZF9maWVsZC5yZWZlcmVuY2VfdG8gPT0gb2JqZWN0X25hbWVcclxuXHRcdFx0XHRcdHJlbGF0ZWRfb2JqZWN0X25hbWVzLnB1c2ggcmVsYXRlZF9vYmplY3RfbmFtZVxyXG5cclxuXHRcdGlmIENyZWF0b3IuZ2V0T2JqZWN0KG9iamVjdF9uYW1lKS5lbmFibGVfZmlsZXNcclxuXHRcdFx0cmVsYXRlZF9vYmplY3RfbmFtZXMucHVzaCBcImNtc19maWxlc1wiXHJcblxyXG5cdFx0cmV0dXJuIHJlbGF0ZWRfb2JqZWN0X25hbWVzIiwiQ3JlYXRvci5nZXRTY2hlbWEgPSBmdW5jdGlvbihvYmplY3RfbmFtZSkge1xuICB2YXIgcmVmO1xuICByZXR1cm4gKHJlZiA9IENyZWF0b3IuZ2V0T2JqZWN0KG9iamVjdF9uYW1lKSkgIT0gbnVsbCA/IHJlZi5zY2hlbWEgOiB2b2lkIDA7XG59O1xuXG5DcmVhdG9yLmdldE9iamVjdFVybCA9IGZ1bmN0aW9uKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIGFwcF9pZCkge1xuICB2YXIgbGlzdF92aWV3LCBsaXN0X3ZpZXdfaWQ7XG4gIGlmICghYXBwX2lkKSB7XG4gICAgYXBwX2lkID0gU2Vzc2lvbi5nZXQoXCJhcHBfaWRcIik7XG4gIH1cbiAgaWYgKCFvYmplY3RfbmFtZSkge1xuICAgIG9iamVjdF9uYW1lID0gU2Vzc2lvbi5nZXQoXCJvYmplY3RfbmFtZVwiKTtcbiAgfVxuICBsaXN0X3ZpZXcgPSBDcmVhdG9yLmdldExpc3RWaWV3KG9iamVjdF9uYW1lLCBudWxsKTtcbiAgbGlzdF92aWV3X2lkID0gbGlzdF92aWV3ICE9IG51bGwgPyBsaXN0X3ZpZXcuX2lkIDogdm9pZCAwO1xuICBpZiAocmVjb3JkX2lkKSB7XG4gICAgcmV0dXJuIENyZWF0b3IuZ2V0UmVsYXRpdmVVcmwoXCIvYXBwL1wiICsgYXBwX2lkICsgXCIvXCIgKyBvYmplY3RfbmFtZSArIFwiL3ZpZXcvXCIgKyByZWNvcmRfaWQpO1xuICB9IGVsc2Uge1xuICAgIGlmIChvYmplY3RfbmFtZSA9PT0gXCJtZWV0aW5nXCIpIHtcbiAgICAgIHJldHVybiBDcmVhdG9yLmdldFJlbGF0aXZlVXJsKFwiL2FwcC9cIiArIGFwcF9pZCArIFwiL1wiICsgb2JqZWN0X25hbWUgKyBcIi9jYWxlbmRhci9cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBDcmVhdG9yLmdldFJlbGF0aXZlVXJsKFwiL2FwcC9cIiArIGFwcF9pZCArIFwiL1wiICsgb2JqZWN0X25hbWUgKyBcIi9ncmlkL1wiICsgbGlzdF92aWV3X2lkKTtcbiAgICB9XG4gIH1cbn07XG5cbkNyZWF0b3IuZ2V0T2JqZWN0QWJzb2x1dGVVcmwgPSBmdW5jdGlvbihvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBhcHBfaWQpIHtcbiAgdmFyIGxpc3RfdmlldywgbGlzdF92aWV3X2lkO1xuICBpZiAoIWFwcF9pZCkge1xuICAgIGFwcF9pZCA9IFNlc3Npb24uZ2V0KFwiYXBwX2lkXCIpO1xuICB9XG4gIGlmICghb2JqZWN0X25hbWUpIHtcbiAgICBvYmplY3RfbmFtZSA9IFNlc3Npb24uZ2V0KFwib2JqZWN0X25hbWVcIik7XG4gIH1cbiAgbGlzdF92aWV3ID0gQ3JlYXRvci5nZXRMaXN0VmlldyhvYmplY3RfbmFtZSwgbnVsbCk7XG4gIGxpc3Rfdmlld19pZCA9IGxpc3RfdmlldyAhPSBudWxsID8gbGlzdF92aWV3Ll9pZCA6IHZvaWQgMDtcbiAgaWYgKHJlY29yZF9pZCkge1xuICAgIHJldHVybiBTdGVlZG9zLmFic29sdXRlVXJsKFwiL2FwcC9cIiArIGFwcF9pZCArIFwiL1wiICsgb2JqZWN0X25hbWUgKyBcIi92aWV3L1wiICsgcmVjb3JkX2lkLCB0cnVlKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAob2JqZWN0X25hbWUgPT09IFwibWVldGluZ1wiKSB7XG4gICAgICByZXR1cm4gU3RlZWRvcy5hYnNvbHV0ZVVybChcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvY2FsZW5kYXIvXCIsIHRydWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gU3RlZWRvcy5hYnNvbHV0ZVVybChcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvZ3JpZC9cIiArIGxpc3Rfdmlld19pZCwgdHJ1ZSk7XG4gICAgfVxuICB9XG59O1xuXG5DcmVhdG9yLmdldE9iamVjdFJvdXRlclVybCA9IGZ1bmN0aW9uKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIGFwcF9pZCkge1xuICB2YXIgbGlzdF92aWV3LCBsaXN0X3ZpZXdfaWQ7XG4gIGlmICghYXBwX2lkKSB7XG4gICAgYXBwX2lkID0gU2Vzc2lvbi5nZXQoXCJhcHBfaWRcIik7XG4gIH1cbiAgaWYgKCFvYmplY3RfbmFtZSkge1xuICAgIG9iamVjdF9uYW1lID0gU2Vzc2lvbi5nZXQoXCJvYmplY3RfbmFtZVwiKTtcbiAgfVxuICBsaXN0X3ZpZXcgPSBDcmVhdG9yLmdldExpc3RWaWV3KG9iamVjdF9uYW1lLCBudWxsKTtcbiAgbGlzdF92aWV3X2lkID0gbGlzdF92aWV3ICE9IG51bGwgPyBsaXN0X3ZpZXcuX2lkIDogdm9pZCAwO1xuICBpZiAocmVjb3JkX2lkKSB7XG4gICAgcmV0dXJuIFwiL2FwcC9cIiArIGFwcF9pZCArIFwiL1wiICsgb2JqZWN0X25hbWUgKyBcIi92aWV3L1wiICsgcmVjb3JkX2lkO1xuICB9IGVsc2Uge1xuICAgIGlmIChvYmplY3RfbmFtZSA9PT0gXCJtZWV0aW5nXCIpIHtcbiAgICAgIHJldHVybiBcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvY2FsZW5kYXIvXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvZ3JpZC9cIiArIGxpc3Rfdmlld19pZDtcbiAgICB9XG4gIH1cbn07XG5cbkNyZWF0b3IuZ2V0TGlzdFZpZXdVcmwgPSBmdW5jdGlvbihvYmplY3RfbmFtZSwgYXBwX2lkLCBsaXN0X3ZpZXdfaWQpIHtcbiAgdmFyIHVybDtcbiAgdXJsID0gQ3JlYXRvci5nZXRMaXN0Vmlld1JlbGF0aXZlVXJsKG9iamVjdF9uYW1lLCBhcHBfaWQsIGxpc3Rfdmlld19pZCk7XG4gIHJldHVybiBDcmVhdG9yLmdldFJlbGF0aXZlVXJsKHVybCk7XG59O1xuXG5DcmVhdG9yLmdldExpc3RWaWV3UmVsYXRpdmVVcmwgPSBmdW5jdGlvbihvYmplY3RfbmFtZSwgYXBwX2lkLCBsaXN0X3ZpZXdfaWQpIHtcbiAgaWYgKGxpc3Rfdmlld19pZCA9PT0gXCJjYWxlbmRhclwiKSB7XG4gICAgcmV0dXJuIFwiL2FwcC9cIiArIGFwcF9pZCArIFwiL1wiICsgb2JqZWN0X25hbWUgKyBcIi9jYWxlbmRhci9cIjtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gXCIvYXBwL1wiICsgYXBwX2lkICsgXCIvXCIgKyBvYmplY3RfbmFtZSArIFwiL2dyaWQvXCIgKyBsaXN0X3ZpZXdfaWQ7XG4gIH1cbn07XG5cbkNyZWF0b3IuZ2V0U3dpdGNoTGlzdFVybCA9IGZ1bmN0aW9uKG9iamVjdF9uYW1lLCBhcHBfaWQsIGxpc3Rfdmlld19pZCkge1xuICBpZiAobGlzdF92aWV3X2lkKSB7XG4gICAgcmV0dXJuIENyZWF0b3IuZ2V0UmVsYXRpdmVVcmwoXCIvYXBwL1wiICsgYXBwX2lkICsgXCIvXCIgKyBvYmplY3RfbmFtZSArIFwiL1wiICsgbGlzdF92aWV3X2lkICsgXCIvbGlzdFwiKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gQ3JlYXRvci5nZXRSZWxhdGl2ZVVybChcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvbGlzdC9zd2l0Y2hcIik7XG4gIH1cbn07XG5cbkNyZWF0b3IuZ2V0UmVsYXRlZE9iamVjdFVybCA9IGZ1bmN0aW9uKG9iamVjdF9uYW1lLCBhcHBfaWQsIHJlY29yZF9pZCwgcmVsYXRlZF9vYmplY3RfbmFtZSkge1xuICByZXR1cm4gQ3JlYXRvci5nZXRSZWxhdGl2ZVVybChcIi9hcHAvXCIgKyBhcHBfaWQgKyBcIi9cIiArIG9iamVjdF9uYW1lICsgXCIvXCIgKyByZWNvcmRfaWQgKyBcIi9cIiArIHJlbGF0ZWRfb2JqZWN0X25hbWUgKyBcIi9ncmlkXCIpO1xufTtcblxuQ3JlYXRvci5nZXRPYmplY3RMb29rdXBGaWVsZE9wdGlvbnMgPSBmdW5jdGlvbihvYmplY3RfbmFtZSwgaXNfZGVlcCwgaXNfc2tpcF9oaWRlLCBpc19yZWxhdGVkKSB7XG4gIHZhciBfb2JqZWN0LCBfb3B0aW9ucywgZmllbGRzLCBpY29uLCByZWxhdGVkT2JqZWN0cztcbiAgX29wdGlvbnMgPSBbXTtcbiAgaWYgKCFvYmplY3RfbmFtZSkge1xuICAgIHJldHVybiBfb3B0aW9ucztcbiAgfVxuICBfb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0X25hbWUpO1xuICBmaWVsZHMgPSBfb2JqZWN0ICE9IG51bGwgPyBfb2JqZWN0LmZpZWxkcyA6IHZvaWQgMDtcbiAgaWNvbiA9IF9vYmplY3QgIT0gbnVsbCA/IF9vYmplY3QuaWNvbiA6IHZvaWQgMDtcbiAgXy5mb3JFYWNoKGZpZWxkcywgZnVuY3Rpb24oZiwgaykge1xuICAgIGlmIChpc19za2lwX2hpZGUgJiYgZi5oaWRkZW4pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGYudHlwZSA9PT0gXCJzZWxlY3RcIikge1xuICAgICAgcmV0dXJuIF9vcHRpb25zLnB1c2goe1xuICAgICAgICBsYWJlbDogXCJcIiArIChmLmxhYmVsIHx8IGspLFxuICAgICAgICB2YWx1ZTogXCJcIiArIGssXG4gICAgICAgIGljb246IGljb25cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gX29wdGlvbnMucHVzaCh7XG4gICAgICAgIGxhYmVsOiBmLmxhYmVsIHx8IGssXG4gICAgICAgIHZhbHVlOiBrLFxuICAgICAgICBpY29uOiBpY29uXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuICBpZiAoaXNfZGVlcCkge1xuICAgIF8uZm9yRWFjaChmaWVsZHMsIGZ1bmN0aW9uKGYsIGspIHtcbiAgICAgIHZhciByX29iamVjdDtcbiAgICAgIGlmIChpc19za2lwX2hpZGUgJiYgZi5oaWRkZW4pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKChmLnR5cGUgPT09IFwibG9va3VwXCIgfHwgZi50eXBlID09PSBcIm1hc3Rlcl9kZXRhaWxcIikgJiYgZi5yZWZlcmVuY2VfdG8gJiYgXy5pc1N0cmluZyhmLnJlZmVyZW5jZV90bykpIHtcbiAgICAgICAgcl9vYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChmLnJlZmVyZW5jZV90byk7XG4gICAgICAgIGlmIChyX29iamVjdCkge1xuICAgICAgICAgIHJldHVybiBfLmZvckVhY2gocl9vYmplY3QuZmllbGRzLCBmdW5jdGlvbihmMiwgazIpIHtcbiAgICAgICAgICAgIHJldHVybiBfb3B0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgbGFiZWw6IChmLmxhYmVsIHx8IGspICsgXCI9PlwiICsgKGYyLmxhYmVsIHx8IGsyKSxcbiAgICAgICAgICAgICAgdmFsdWU6IGsgKyBcIi5cIiArIGsyLFxuICAgICAgICAgICAgICBpY29uOiByX29iamVjdCAhPSBudWxsID8gcl9vYmplY3QuaWNvbiA6IHZvaWQgMFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBpZiAoaXNfcmVsYXRlZCkge1xuICAgIHJlbGF0ZWRPYmplY3RzID0gQ3JlYXRvci5nZXRSZWxhdGVkT2JqZWN0cyhvYmplY3RfbmFtZSk7XG4gICAgXy5lYWNoKHJlbGF0ZWRPYmplY3RzLCAoZnVuY3Rpb24oX3RoaXMpIHtcbiAgICAgIHJldHVybiBmdW5jdGlvbihfcmVsYXRlZE9iamVjdCkge1xuICAgICAgICB2YXIgcmVsYXRlZE9iamVjdCwgcmVsYXRlZE9wdGlvbnM7XG4gICAgICAgIHJlbGF0ZWRPcHRpb25zID0gQ3JlYXRvci5nZXRPYmplY3RMb29rdXBGaWVsZE9wdGlvbnMoX3JlbGF0ZWRPYmplY3Qub2JqZWN0X25hbWUsIGZhbHNlLCBmYWxzZSwgZmFsc2UpO1xuICAgICAgICByZWxhdGVkT2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3QoX3JlbGF0ZWRPYmplY3Qub2JqZWN0X25hbWUpO1xuICAgICAgICByZXR1cm4gXy5lYWNoKHJlbGF0ZWRPcHRpb25zLCBmdW5jdGlvbihyZWxhdGVkT3B0aW9uKSB7XG4gICAgICAgICAgaWYgKF9yZWxhdGVkT2JqZWN0LmZvcmVpZ25fa2V5ICE9PSByZWxhdGVkT3B0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gX29wdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiAocmVsYXRlZE9iamVjdC5sYWJlbCB8fCByZWxhdGVkT2JqZWN0Lm5hbWUpICsgXCI9PlwiICsgcmVsYXRlZE9wdGlvbi5sYWJlbCxcbiAgICAgICAgICAgICAgdmFsdWU6IHJlbGF0ZWRPYmplY3QubmFtZSArIFwiLlwiICsgcmVsYXRlZE9wdGlvbi52YWx1ZSxcbiAgICAgICAgICAgICAgaWNvbjogcmVsYXRlZE9iamVjdCAhPSBudWxsID8gcmVsYXRlZE9iamVjdC5pY29uIDogdm9pZCAwXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICB9KSh0aGlzKSk7XG4gIH1cbiAgcmV0dXJuIF9vcHRpb25zO1xufTtcblxuQ3JlYXRvci5nZXRPYmplY3RGaWx0ZXJGaWVsZE9wdGlvbnMgPSBmdW5jdGlvbihvYmplY3RfbmFtZSkge1xuICB2YXIgX29iamVjdCwgX29wdGlvbnMsIGZpZWxkcywgaWNvbiwgcGVybWlzc2lvbl9maWVsZHM7XG4gIF9vcHRpb25zID0gW107XG4gIGlmICghb2JqZWN0X25hbWUpIHtcbiAgICByZXR1cm4gX29wdGlvbnM7XG4gIH1cbiAgX29iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KG9iamVjdF9uYW1lKTtcbiAgZmllbGRzID0gX29iamVjdCAhPSBudWxsID8gX29iamVjdC5maWVsZHMgOiB2b2lkIDA7XG4gIHBlcm1pc3Npb25fZmllbGRzID0gQ3JlYXRvci5nZXRGaWVsZHMob2JqZWN0X25hbWUpO1xuICBpY29uID0gX29iamVjdCAhPSBudWxsID8gX29iamVjdC5pY29uIDogdm9pZCAwO1xuICBfLmZvckVhY2goZmllbGRzLCBmdW5jdGlvbihmLCBrKSB7XG4gICAgaWYgKCFfLmluY2x1ZGUoW1wiZ3JpZFwiLCBcIm9iamVjdFwiLCBcIltPYmplY3RdXCIsIFwiW29iamVjdF1cIiwgXCJPYmplY3RcIiwgXCJhdmF0YXJcIiwgXCJpbWFnZVwiLCBcIm1hcmtkb3duXCIsIFwiaHRtbFwiXSwgZi50eXBlKSAmJiAhZi5oaWRkZW4pIHtcbiAgICAgIGlmICghL1xcdytcXC4vLnRlc3QoaykgJiYgXy5pbmRleE9mKHBlcm1pc3Npb25fZmllbGRzLCBrKSA+IC0xKSB7XG4gICAgICAgIHJldHVybiBfb3B0aW9ucy5wdXNoKHtcbiAgICAgICAgICBsYWJlbDogZi5sYWJlbCB8fCBrLFxuICAgICAgICAgIHZhbHVlOiBrLFxuICAgICAgICAgIGljb246IGljb25cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIF9vcHRpb25zO1xufTtcblxuQ3JlYXRvci5nZXRPYmplY3RGaWVsZE9wdGlvbnMgPSBmdW5jdGlvbihvYmplY3RfbmFtZSkge1xuICB2YXIgX29iamVjdCwgX29wdGlvbnMsIGZpZWxkcywgaWNvbiwgcGVybWlzc2lvbl9maWVsZHM7XG4gIF9vcHRpb25zID0gW107XG4gIGlmICghb2JqZWN0X25hbWUpIHtcbiAgICByZXR1cm4gX29wdGlvbnM7XG4gIH1cbiAgX29iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KG9iamVjdF9uYW1lKTtcbiAgZmllbGRzID0gX29iamVjdCAhPSBudWxsID8gX29iamVjdC5maWVsZHMgOiB2b2lkIDA7XG4gIHBlcm1pc3Npb25fZmllbGRzID0gQ3JlYXRvci5nZXRGaWVsZHMob2JqZWN0X25hbWUpO1xuICBpY29uID0gX29iamVjdCAhPSBudWxsID8gX29iamVjdC5pY29uIDogdm9pZCAwO1xuICBfLmZvckVhY2goZmllbGRzLCBmdW5jdGlvbihmLCBrKSB7XG4gICAgaWYgKCFfLmluY2x1ZGUoW1wiZ3JpZFwiLCBcIm9iamVjdFwiLCBcIltPYmplY3RdXCIsIFwiW29iamVjdF1cIiwgXCJPYmplY3RcIiwgXCJhdmF0YXJcIiwgXCJpbWFnZVwiLCBcIm1hcmtkb3duXCIsIFwiaHRtbFwiXSwgZi50eXBlKSkge1xuICAgICAgaWYgKCEvXFx3K1xcLi8udGVzdChrKSAmJiBfLmluZGV4T2YocGVybWlzc2lvbl9maWVsZHMsIGspID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIF9vcHRpb25zLnB1c2goe1xuICAgICAgICAgIGxhYmVsOiBmLmxhYmVsIHx8IGssXG4gICAgICAgICAgdmFsdWU6IGssXG4gICAgICAgICAgaWNvbjogaWNvblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gX29wdGlvbnM7XG59O1xuXG5cbi8qXG5maWx0ZXJzOiDopoHovazmjaLnmoRmaWx0ZXJzXG5maWVsZHM6IOWvueixoeWtl+autVxuZmlsdGVyX2ZpZWxkczog6buY6K6k6L+H5ruk5a2X5q6177yM5pSv5oyB5a2X56ym5Liy5pWw57uE5ZKM5a+56LGh5pWw57uE5Lik56eN5qC85byP77yM5aaCOlsnZmlsZWRfbmFtZTEnLCdmaWxlZF9uYW1lMiddLFt7ZmllbGQ6J2ZpbGVkX25hbWUxJyxyZXF1aXJlZDp0cnVlfV1cbuWkhOeQhumAu+i+kTog5oqKZmlsdGVyc+S4reWtmOWcqOS6jmZpbHRlcl9maWVsZHPnmoTov4fmu6TmnaHku7blop7liqDmr4/pobnnmoRpc19kZWZhdWx044CBaXNfcmVxdWlyZWTlsZ7mgKfvvIzkuI3lrZjlnKjkuo5maWx0ZXJfZmllbGRz55qE6L+H5ruk5p2h5Lu25a+55bqU55qE56e76Zmk5q+P6aG555qE55u45YWz5bGe5oCnXG7ov5Tlm57nu5Pmnpw6IOWkhOeQhuWQjueahGZpbHRlcnNcbiAqL1xuXG5DcmVhdG9yLmdldEZpbHRlcnNXaXRoRmlsdGVyRmllbGRzID0gZnVuY3Rpb24oZmlsdGVycywgZmllbGRzLCBmaWx0ZXJfZmllbGRzKSB7XG4gIGlmICghZmlsdGVycykge1xuICAgIGZpbHRlcnMgPSBbXTtcbiAgfVxuICBpZiAoIWZpbHRlcl9maWVsZHMpIHtcbiAgICBmaWx0ZXJfZmllbGRzID0gW107XG4gIH1cbiAgaWYgKGZpbHRlcl9maWVsZHMgIT0gbnVsbCA/IGZpbHRlcl9maWVsZHMubGVuZ3RoIDogdm9pZCAwKSB7XG4gICAgZmlsdGVyX2ZpZWxkcy5mb3JFYWNoKGZ1bmN0aW9uKG4pIHtcbiAgICAgIGlmIChfLmlzU3RyaW5nKG4pKSB7XG4gICAgICAgIG4gPSB7XG4gICAgICAgICAgZmllbGQ6IG4sXG4gICAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICBpZiAoZmllbGRzW24uZmllbGRdICYmICFfLmZpbmRXaGVyZShmaWx0ZXJzLCB7XG4gICAgICAgIGZpZWxkOiBuLmZpZWxkXG4gICAgICB9KSkge1xuICAgICAgICByZXR1cm4gZmlsdGVycy5wdXNoKHtcbiAgICAgICAgICBmaWVsZDogbi5maWVsZCxcbiAgICAgICAgICBpc19kZWZhdWx0OiB0cnVlLFxuICAgICAgICAgIGlzX3JlcXVpcmVkOiBuLnJlcXVpcmVkXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIGZpbHRlcnMuZm9yRWFjaChmdW5jdGlvbihmaWx0ZXJJdGVtKSB7XG4gICAgdmFyIG1hdGNoRmllbGQ7XG4gICAgbWF0Y2hGaWVsZCA9IGZpbHRlcl9maWVsZHMuZmluZChmdW5jdGlvbihuKSB7XG4gICAgICByZXR1cm4gbiA9PT0gZmlsdGVySXRlbS5maWVsZCB8fCBuLmZpZWxkID09PSBmaWx0ZXJJdGVtLmZpZWxkO1xuICAgIH0pO1xuICAgIGlmIChfLmlzU3RyaW5nKG1hdGNoRmllbGQpKSB7XG4gICAgICBtYXRjaEZpZWxkID0ge1xuICAgICAgICBmaWVsZDogbWF0Y2hGaWVsZCxcbiAgICAgICAgcmVxdWlyZWQ6IGZhbHNlXG4gICAgICB9O1xuICAgIH1cbiAgICBpZiAobWF0Y2hGaWVsZCkge1xuICAgICAgZmlsdGVySXRlbS5pc19kZWZhdWx0ID0gdHJ1ZTtcbiAgICAgIHJldHVybiBmaWx0ZXJJdGVtLmlzX3JlcXVpcmVkID0gbWF0Y2hGaWVsZC5yZXF1aXJlZDtcbiAgICB9IGVsc2Uge1xuICAgICAgZGVsZXRlIGZpbHRlckl0ZW0uaXNfZGVmYXVsdDtcbiAgICAgIHJldHVybiBkZWxldGUgZmlsdGVySXRlbS5pc19yZXF1aXJlZDtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gZmlsdGVycztcbn07XG5cbkNyZWF0b3IuZ2V0T2JqZWN0UmVjb3JkID0gZnVuY3Rpb24ob2JqZWN0X25hbWUsIHJlY29yZF9pZCwgc2VsZWN0X2ZpZWxkcywgZXhwYW5kKSB7XG4gIHZhciBjb2xsZWN0aW9uLCByZWNvcmQsIHJlZiwgcmVmMSwgcmVmMjtcbiAgaWYgKCFvYmplY3RfbmFtZSkge1xuICAgIG9iamVjdF9uYW1lID0gU2Vzc2lvbi5nZXQoXCJvYmplY3RfbmFtZVwiKTtcbiAgfVxuICBpZiAoIXJlY29yZF9pZCkge1xuICAgIHJlY29yZF9pZCA9IFNlc3Npb24uZ2V0KFwicmVjb3JkX2lkXCIpO1xuICB9XG4gIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICBpZiAob2JqZWN0X25hbWUgPT09IFNlc3Npb24uZ2V0KFwib2JqZWN0X25hbWVcIikgJiYgcmVjb3JkX2lkID09PSBTZXNzaW9uLmdldChcInJlY29yZF9pZFwiKSkge1xuICAgICAgaWYgKChyZWYgPSBUZW1wbGF0ZS5pbnN0YW5jZSgpKSAhPSBudWxsID8gcmVmLnJlY29yZCA6IHZvaWQgMCkge1xuICAgICAgICByZXR1cm4gKHJlZjEgPSBUZW1wbGF0ZS5pbnN0YW5jZSgpKSAhPSBudWxsID8gKHJlZjIgPSByZWYxLnJlY29yZCkgIT0gbnVsbCA/IHJlZjIuZ2V0KCkgOiB2b2lkIDAgOiB2b2lkIDA7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBDcmVhdG9yLm9kYXRhLmdldChvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBzZWxlY3RfZmllbGRzLCBleHBhbmQpO1xuICAgIH1cbiAgfVxuICBjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKG9iamVjdF9uYW1lKTtcbiAgaWYgKGNvbGxlY3Rpb24pIHtcbiAgICByZWNvcmQgPSBjb2xsZWN0aW9uLmZpbmRPbmUocmVjb3JkX2lkKTtcbiAgICByZXR1cm4gcmVjb3JkO1xuICB9XG59O1xuXG5DcmVhdG9yLmdldE9iamVjdFJlY29yZE5hbWUgPSBmdW5jdGlvbihyZWNvcmQsIG9iamVjdF9uYW1lKSB7XG4gIHZhciBuYW1lX2ZpZWxkX2tleSwgcmVmO1xuICBpZiAoIXJlY29yZCkge1xuICAgIHJlY29yZCA9IENyZWF0b3IuZ2V0T2JqZWN0UmVjb3JkKCk7XG4gIH1cbiAgaWYgKHJlY29yZCkge1xuICAgIG5hbWVfZmllbGRfa2V5ID0gb2JqZWN0X25hbWUgPT09IFwib3JnYW5pemF0aW9uc1wiID8gXCJuYW1lXCIgOiAocmVmID0gQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0X25hbWUpKSAhPSBudWxsID8gcmVmLk5BTUVfRklFTERfS0VZIDogdm9pZCAwO1xuICAgIGlmIChyZWNvcmQgJiYgbmFtZV9maWVsZF9rZXkpIHtcbiAgICAgIHJldHVybiByZWNvcmQubGFiZWwgfHwgcmVjb3JkW25hbWVfZmllbGRfa2V5XTtcbiAgICB9XG4gIH1cbn07XG5cbkNyZWF0b3IuZ2V0QXBwID0gZnVuY3Rpb24oYXBwX2lkKSB7XG4gIHZhciBhcHAsIHJlZiwgcmVmMTtcbiAgaWYgKCFhcHBfaWQpIHtcbiAgICBhcHBfaWQgPSBTZXNzaW9uLmdldChcImFwcF9pZFwiKTtcbiAgfVxuICBhcHAgPSBDcmVhdG9yLkFwcHNbYXBwX2lkXTtcbiAgaWYgKChyZWYgPSBDcmVhdG9yLmRlcHMpICE9IG51bGwpIHtcbiAgICBpZiAoKHJlZjEgPSByZWYuYXBwKSAhPSBudWxsKSB7XG4gICAgICByZWYxLmRlcGVuZCgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gYXBwO1xufTtcblxuQ3JlYXRvci5nZXRBcHBEYXNoYm9hcmQgPSBmdW5jdGlvbihhcHBfaWQpIHtcbiAgdmFyIGFwcCwgZGFzaGJvYXJkO1xuICBhcHAgPSBDcmVhdG9yLmdldEFwcChhcHBfaWQpO1xuICBpZiAoIWFwcCkge1xuICAgIHJldHVybjtcbiAgfVxuICBkYXNoYm9hcmQgPSBudWxsO1xuICBfLmVhY2goQ3JlYXRvci5EYXNoYm9hcmRzLCBmdW5jdGlvbih2LCBrKSB7XG4gICAgdmFyIHJlZjtcbiAgICBpZiAoKChyZWYgPSB2LmFwcHMpICE9IG51bGwgPyByZWYuaW5kZXhPZihhcHAuX2lkKSA6IHZvaWQgMCkgPiAtMSkge1xuICAgICAgcmV0dXJuIGRhc2hib2FyZCA9IHY7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGRhc2hib2FyZDtcbn07XG5cbkNyZWF0b3IuZ2V0QXBwRGFzaGJvYXJkQ29tcG9uZW50ID0gZnVuY3Rpb24oYXBwX2lkKSB7XG4gIHZhciBhcHA7XG4gIGFwcCA9IENyZWF0b3IuZ2V0QXBwKGFwcF9pZCk7XG4gIGlmICghYXBwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHJldHVybiBSZWFjdFN0ZWVkb3MucGx1Z2luQ29tcG9uZW50U2VsZWN0b3IoUmVhY3RTdGVlZG9zLnN0b3JlLmdldFN0YXRlKCksIFwiRGFzaGJvYXJkXCIsIGFwcC5faWQpO1xufTtcblxuQ3JlYXRvci5nZXRBcHBPYmplY3ROYW1lcyA9IGZ1bmN0aW9uKGFwcF9pZCkge1xuICB2YXIgYXBwLCBhcHBPYmplY3RzLCBpc01vYmlsZSwgb2JqZWN0cztcbiAgYXBwID0gQ3JlYXRvci5nZXRBcHAoYXBwX2lkKTtcbiAgaWYgKCFhcHApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaXNNb2JpbGUgPSBTdGVlZG9zLmlzTW9iaWxlKCk7XG4gIGFwcE9iamVjdHMgPSBpc01vYmlsZSA/IGFwcC5tb2JpbGVfb2JqZWN0cyA6IGFwcC5vYmplY3RzO1xuICBvYmplY3RzID0gW107XG4gIGlmIChhcHApIHtcbiAgICBfLmVhY2goYXBwT2JqZWN0cywgZnVuY3Rpb24odikge1xuICAgICAgdmFyIG9iajtcbiAgICAgIG9iaiA9IENyZWF0b3IuZ2V0T2JqZWN0KHYpO1xuICAgICAgaWYgKG9iaiAhPSBudWxsID8gb2JqLnBlcm1pc3Npb25zLmdldCgpLmFsbG93UmVhZCA6IHZvaWQgMCkge1xuICAgICAgICByZXR1cm4gb2JqZWN0cy5wdXNoKHYpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIHJldHVybiBvYmplY3RzO1xufTtcblxuQ3JlYXRvci5nZXRWaXNpYmxlQXBwcyA9IGZ1bmN0aW9uKGluY2x1ZGVBZG1pbikge1xuICB2YXIgY2hhbmdlQXBwO1xuICBjaGFuZ2VBcHAgPSBDcmVhdG9yLl9zdWJBcHAuZ2V0KCk7XG4gIFJlYWN0U3RlZWRvcy5zdG9yZS5nZXRTdGF0ZSgpLmVudGl0aWVzLmFwcHMgPSBPYmplY3QuYXNzaWduKHt9LCBSZWFjdFN0ZWVkb3Muc3RvcmUuZ2V0U3RhdGUoKS5lbnRpdGllcy5hcHBzLCB7XG4gICAgYXBwczogY2hhbmdlQXBwXG4gIH0pO1xuICByZXR1cm4gUmVhY3RTdGVlZG9zLnZpc2libGVBcHBzU2VsZWN0b3IoUmVhY3RTdGVlZG9zLnN0b3JlLmdldFN0YXRlKCksIGluY2x1ZGVBZG1pbik7XG59O1xuXG5DcmVhdG9yLmdldFZpc2libGVBcHBzT2JqZWN0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgYXBwcywgb2JqZWN0cywgdmlzaWJsZU9iamVjdE5hbWVzO1xuICBhcHBzID0gQ3JlYXRvci5nZXRWaXNpYmxlQXBwcygpO1xuICB2aXNpYmxlT2JqZWN0TmFtZXMgPSBfLmZsYXR0ZW4oXy5wbHVjayhhcHBzLCAnb2JqZWN0cycpKTtcbiAgb2JqZWN0cyA9IF8uZmlsdGVyKENyZWF0b3IuT2JqZWN0cywgZnVuY3Rpb24ob2JqKSB7XG4gICAgaWYgKHZpc2libGVPYmplY3ROYW1lcy5pbmRleE9mKG9iai5uYW1lKSA8IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9KTtcbiAgb2JqZWN0cyA9IG9iamVjdHMuc29ydChDcmVhdG9yLnNvcnRpbmdNZXRob2QuYmluZCh7XG4gICAga2V5OiBcImxhYmVsXCJcbiAgfSkpO1xuICBvYmplY3RzID0gXy5wbHVjayhvYmplY3RzLCAnbmFtZScpO1xuICByZXR1cm4gXy51bmlxKG9iamVjdHMpO1xufTtcblxuQ3JlYXRvci5nZXRBcHBzT2JqZWN0cyA9IGZ1bmN0aW9uKCkge1xuICB2YXIgb2JqZWN0cywgdGVtcE9iamVjdHM7XG4gIG9iamVjdHMgPSBbXTtcbiAgdGVtcE9iamVjdHMgPSBbXTtcbiAgXy5mb3JFYWNoKENyZWF0b3IuQXBwcywgZnVuY3Rpb24oYXBwKSB7XG4gICAgdGVtcE9iamVjdHMgPSBfLmZpbHRlcihhcHAub2JqZWN0cywgZnVuY3Rpb24ob2JqKSB7XG4gICAgICByZXR1cm4gIW9iai5oaWRkZW47XG4gICAgfSk7XG4gICAgcmV0dXJuIG9iamVjdHMgPSBvYmplY3RzLmNvbmNhdCh0ZW1wT2JqZWN0cyk7XG4gIH0pO1xuICByZXR1cm4gXy51bmlxKG9iamVjdHMpO1xufTtcblxuQ3JlYXRvci52YWxpZGF0ZUZpbHRlcnMgPSBmdW5jdGlvbihmaWx0ZXJzLCBsb2dpYykge1xuICB2YXIgZSwgZXJyb3JNc2csIGZpbHRlcl9pdGVtcywgZmlsdGVyX2xlbmd0aCwgZmxhZywgaW5kZXgsIHdvcmQ7XG4gIGZpbHRlcl9pdGVtcyA9IF8ubWFwKGZpbHRlcnMsIGZ1bmN0aW9uKG9iaikge1xuICAgIGlmIChfLmlzRW1wdHkob2JqKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gb2JqO1xuICAgIH1cbiAgfSk7XG4gIGZpbHRlcl9pdGVtcyA9IF8uY29tcGFjdChmaWx0ZXJfaXRlbXMpO1xuICBlcnJvck1zZyA9IFwiXCI7XG4gIGZpbHRlcl9sZW5ndGggPSBmaWx0ZXJfaXRlbXMubGVuZ3RoO1xuICBpZiAobG9naWMpIHtcbiAgICBsb2dpYyA9IGxvZ2ljLnJlcGxhY2UoL1xcbi9nLCBcIlwiKS5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbiAgICBpZiAoL1suX1xcLSErXSsvaWcudGVzdChsb2dpYykpIHtcbiAgICAgIGVycm9yTXNnID0gXCLlkKvmnInnibnmrorlrZfnrKbjgIJcIjtcbiAgICB9XG4gICAgaWYgKCFlcnJvck1zZykge1xuICAgICAgaW5kZXggPSBsb2dpYy5tYXRjaCgvXFxkKy9pZyk7XG4gICAgICBpZiAoIWluZGV4KSB7XG4gICAgICAgIGVycm9yTXNnID0gXCLmnInkupvnrZvpgInmnaHku7bov5vooYzkuoblrprkuYnvvIzkvYbmnKrlnKjpq5jnuqfnrZvpgInmnaHku7bkuK3ooqvlvJXnlKjjgIJcIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluZGV4LmZvckVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICAgIGlmIChpIDwgMSB8fCBpID4gZmlsdGVyX2xlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuIGVycm9yTXNnID0gXCLmgqjnmoTnrZvpgInmnaHku7blvJXnlKjkuobmnKrlrprkuYnnmoTnrZvpgInlmajvvJpcIiArIGkgKyBcIuOAglwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGZsYWcgPSAxO1xuICAgICAgICB3aGlsZSAoZmxhZyA8PSBmaWx0ZXJfbGVuZ3RoKSB7XG4gICAgICAgICAgaWYgKCFpbmRleC5pbmNsdWRlcyhcIlwiICsgZmxhZykpIHtcbiAgICAgICAgICAgIGVycm9yTXNnID0gXCLmnInkupvnrZvpgInmnaHku7bov5vooYzkuoblrprkuYnvvIzkvYbmnKrlnKjpq5jnuqfnrZvpgInmnaHku7bkuK3ooqvlvJXnlKjjgIJcIjtcbiAgICAgICAgICB9XG4gICAgICAgICAgZmxhZysrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghZXJyb3JNc2cpIHtcbiAgICAgIHdvcmQgPSBsb2dpYy5tYXRjaCgvW2EtekEtWl0rL2lnKTtcbiAgICAgIGlmICh3b3JkKSB7XG4gICAgICAgIHdvcmQuZm9yRWFjaChmdW5jdGlvbih3KSB7XG4gICAgICAgICAgaWYgKCEvXihhbmR8b3IpJC9pZy50ZXN0KHcpKSB7XG4gICAgICAgICAgICByZXR1cm4gZXJyb3JNc2cgPSBcIuajgOafpeaCqOeahOmrmOe6p+etm+mAieadoeS7tuS4reeahOaLvOWGmeOAglwiO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghZXJyb3JNc2cpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIENyZWF0b3JbXCJldmFsXCJdKGxvZ2ljLnJlcGxhY2UoL2FuZC9pZywgXCImJlwiKS5yZXBsYWNlKC9vci9pZywgXCJ8fFwiKSk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBlID0gZXJyb3I7XG4gICAgICAgIGVycm9yTXNnID0gXCLmgqjnmoTnrZvpgInlmajkuK3lkKvmnInnibnmrorlrZfnrKZcIjtcbiAgICAgIH1cbiAgICAgIGlmICgvKEFORClbXigpXSsoT1IpL2lnLnRlc3QobG9naWMpIHx8IC8oT1IpW14oKV0rKEFORCkvaWcudGVzdChsb2dpYykpIHtcbiAgICAgICAgZXJyb3JNc2cgPSBcIuaCqOeahOetm+mAieWZqOW/hemhu+WcqOi/nue7reaAp+eahCBBTkQg5ZKMIE9SIOihqOi+vuW8j+WJjeWQjuS9v+eUqOaLrOWPt+OAglwiO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoZXJyb3JNc2cpIHtcbiAgICBjb25zb2xlLmxvZyhcImVycm9yXCIsIGVycm9yTXNnKTtcbiAgICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICB0b2FzdHIuZXJyb3IoZXJyb3JNc2cpO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbn07XG5cblxuLypcbm9wdGlvbnPlj4LmlbDvvJpcblx0ZXh0ZW5kLS0g5piv5ZCm6ZyA6KaB5oqK5b2T5YmN55So5oi35Z+65pys5L+h5oGv5Yqg5YWl5YWs5byP77yM5Y2z6K6p5YWs5byP5pSv5oyBQ3JlYXRvci5VU0VSX0NPTlRFWFTkuK3nmoTlgLzvvIzpu5jorqTkuLp0cnVlXG5cdHVzZXJJZC0tIOW9k+WJjeeZu+W9leeUqOaIt1xuXHRzcGFjZUlkLS0g5b2T5YmN5omA5Zyo5bel5L2c5Yy6XG5leHRlbmTkuLp0cnVl5pe277yM5ZCO56uv6ZyA6KaB6aKd5aSW5Lyg5YWldXNlcklk5Y+Kc3BhY2VJZOeUqOS6juaKk+WPlkNyZWF0b3IuVVNFUl9DT05URVhU5a+55bqU55qE5YC8XG4gKi9cblxuQ3JlYXRvci5mb3JtYXRGaWx0ZXJzVG9Nb25nbyA9IGZ1bmN0aW9uKGZpbHRlcnMsIG9wdGlvbnMpIHtcbiAgdmFyIHNlbGVjdG9yO1xuICBpZiAoIShmaWx0ZXJzICE9IG51bGwgPyBmaWx0ZXJzLmxlbmd0aCA6IHZvaWQgMCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCEoZmlsdGVyc1swXSBpbnN0YW5jZW9mIEFycmF5KSkge1xuICAgIGZpbHRlcnMgPSBfLm1hcChmaWx0ZXJzLCBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBbb2JqLmZpZWxkLCBvYmoub3BlcmF0aW9uLCBvYmoudmFsdWVdO1xuICAgIH0pO1xuICB9XG4gIHNlbGVjdG9yID0gW107XG4gIF8uZWFjaChmaWx0ZXJzLCBmdW5jdGlvbihmaWx0ZXIpIHtcbiAgICB2YXIgZmllbGQsIG9wdGlvbiwgcmVnLCBzdWJfc2VsZWN0b3IsIHZhbHVlO1xuICAgIGZpZWxkID0gZmlsdGVyWzBdO1xuICAgIG9wdGlvbiA9IGZpbHRlclsxXTtcbiAgICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgICB2YWx1ZSA9IENyZWF0b3IuZXZhbHVhdGVGb3JtdWxhKGZpbHRlclsyXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gQ3JlYXRvci5ldmFsdWF0ZUZvcm11bGEoZmlsdGVyWzJdLCBudWxsLCBvcHRpb25zKTtcbiAgICB9XG4gICAgc3ViX3NlbGVjdG9yID0ge307XG4gICAgc3ViX3NlbGVjdG9yW2ZpZWxkXSA9IHt9O1xuICAgIGlmIChvcHRpb24gPT09IFwiPVwiKSB7XG4gICAgICBzdWJfc2VsZWN0b3JbZmllbGRdW1wiJGVxXCJdID0gdmFsdWU7XG4gICAgfSBlbHNlIGlmIChvcHRpb24gPT09IFwiPD5cIikge1xuICAgICAgc3ViX3NlbGVjdG9yW2ZpZWxkXVtcIiRuZVwiXSA9IHZhbHVlO1xuICAgIH0gZWxzZSBpZiAob3B0aW9uID09PSBcIj5cIikge1xuICAgICAgc3ViX3NlbGVjdG9yW2ZpZWxkXVtcIiRndFwiXSA9IHZhbHVlO1xuICAgIH0gZWxzZSBpZiAob3B0aW9uID09PSBcIj49XCIpIHtcbiAgICAgIHN1Yl9zZWxlY3RvcltmaWVsZF1bXCIkZ3RlXCJdID0gdmFsdWU7XG4gICAgfSBlbHNlIGlmIChvcHRpb24gPT09IFwiPFwiKSB7XG4gICAgICBzdWJfc2VsZWN0b3JbZmllbGRdW1wiJGx0XCJdID0gdmFsdWU7XG4gICAgfSBlbHNlIGlmIChvcHRpb24gPT09IFwiPD1cIikge1xuICAgICAgc3ViX3NlbGVjdG9yW2ZpZWxkXVtcIiRsdGVcIl0gPSB2YWx1ZTtcbiAgICB9IGVsc2UgaWYgKG9wdGlvbiA9PT0gXCJzdGFydHN3aXRoXCIpIHtcbiAgICAgIHJlZyA9IG5ldyBSZWdFeHAoXCJeXCIgKyB2YWx1ZSwgXCJpXCIpO1xuICAgICAgc3ViX3NlbGVjdG9yW2ZpZWxkXVtcIiRyZWdleFwiXSA9IHJlZztcbiAgICB9IGVsc2UgaWYgKG9wdGlvbiA9PT0gXCJjb250YWluc1wiKSB7XG4gICAgICByZWcgPSBuZXcgUmVnRXhwKHZhbHVlLCBcImlcIik7XG4gICAgICBzdWJfc2VsZWN0b3JbZmllbGRdW1wiJHJlZ2V4XCJdID0gcmVnO1xuICAgIH0gZWxzZSBpZiAob3B0aW9uID09PSBcIm5vdGNvbnRhaW5zXCIpIHtcbiAgICAgIHJlZyA9IG5ldyBSZWdFeHAoXCJeKCg/IVwiICsgdmFsdWUgKyBcIikuKSokXCIsIFwiaVwiKTtcbiAgICAgIHN1Yl9zZWxlY3RvcltmaWVsZF1bXCIkcmVnZXhcIl0gPSByZWc7XG4gICAgfVxuICAgIHJldHVybiBzZWxlY3Rvci5wdXNoKHN1Yl9zZWxlY3Rvcik7XG4gIH0pO1xuICByZXR1cm4gc2VsZWN0b3I7XG59O1xuXG5DcmVhdG9yLmlzQmV0d2VlbkZpbHRlck9wZXJhdGlvbiA9IGZ1bmN0aW9uKG9wZXJhdGlvbikge1xuICB2YXIgcmVmO1xuICByZXR1cm4gb3BlcmF0aW9uID09PSBcImJldHdlZW5cIiB8fCAhISgocmVmID0gQ3JlYXRvci5nZXRCZXR3ZWVuVGltZUJ1aWx0aW5WYWx1ZXModHJ1ZSkpICE9IG51bGwgPyByZWZbb3BlcmF0aW9uXSA6IHZvaWQgMCk7XG59O1xuXG5cbi8qXG5vcHRpb25z5Y+C5pWw77yaXG5cdGV4dGVuZC0tIOaYr+WQpumcgOimgeaKiuW9k+WJjeeUqOaIt+WfuuacrOS/oeaBr+WKoOWFpeWFrOW8j++8jOWNs+iuqeWFrOW8j+aUr+aMgUNyZWF0b3IuVVNFUl9DT05URVhU5Lit55qE5YC877yM6buY6K6k5Li6dHJ1ZVxuXHR1c2VySWQtLSDlvZPliY3nmbvlvZXnlKjmiLdcblx0c3BhY2VJZC0tIOW9k+WJjeaJgOWcqOW3peS9nOWMulxuXHRleHRlbmTkuLp0cnVl5pe277yM5ZCO56uv6ZyA6KaB6aKd5aSW5Lyg5YWldXNlcklk5Y+Kc3BhY2VJZOeUqOS6juaKk+WPlkNyZWF0b3IuVVNFUl9DT05URVhU5a+55bqU55qE5YC8XG4gKi9cblxuQ3JlYXRvci5mb3JtYXRGaWx0ZXJzVG9EZXYgPSBmdW5jdGlvbihmaWx0ZXJzLCBvYmplY3RfbmFtZSwgb3B0aW9ucykge1xuICB2YXIgbG9naWNUZW1wRmlsdGVycywgc2VsZWN0b3IsIHN0ZWVkb3NGaWx0ZXJzO1xuICBzdGVlZG9zRmlsdGVycyA9IHJlcXVpcmUoXCJAc3RlZWRvcy9maWx0ZXJzXCIpO1xuICBpZiAoIWZpbHRlcnMubGVuZ3RoKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChvcHRpb25zICE9IG51bGwgPyBvcHRpb25zLmlzX2xvZ2ljX29yIDogdm9pZCAwKSB7XG4gICAgbG9naWNUZW1wRmlsdGVycyA9IFtdO1xuICAgIGZpbHRlcnMuZm9yRWFjaChmdW5jdGlvbihuKSB7XG4gICAgICBsb2dpY1RlbXBGaWx0ZXJzLnB1c2gobik7XG4gICAgICByZXR1cm4gbG9naWNUZW1wRmlsdGVycy5wdXNoKFwib3JcIik7XG4gICAgfSk7XG4gICAgbG9naWNUZW1wRmlsdGVycy5wb3AoKTtcbiAgICBmaWx0ZXJzID0gbG9naWNUZW1wRmlsdGVycztcbiAgfVxuICBzZWxlY3RvciA9IHN0ZWVkb3NGaWx0ZXJzLmZvcm1hdEZpbHRlcnNUb0RldihmaWx0ZXJzLCBDcmVhdG9yLlVTRVJfQ09OVEVYVCk7XG4gIHJldHVybiBzZWxlY3Rvcjtcbn07XG5cblxuLypcbm9wdGlvbnPlj4LmlbDvvJpcblx0ZXh0ZW5kLS0g5piv5ZCm6ZyA6KaB5oqK5b2T5YmN55So5oi35Z+65pys5L+h5oGv5Yqg5YWl5YWs5byP77yM5Y2z6K6p5YWs5byP5pSv5oyBQ3JlYXRvci5VU0VSX0NPTlRFWFTkuK3nmoTlgLzvvIzpu5jorqTkuLp0cnVlXG5cdHVzZXJJZC0tIOW9k+WJjeeZu+W9leeUqOaIt1xuXHRzcGFjZUlkLS0g5b2T5YmN5omA5Zyo5bel5L2c5Yy6XG5leHRlbmTkuLp0cnVl5pe277yM5ZCO56uv6ZyA6KaB6aKd5aSW5Lyg5YWldXNlcklk5Y+Kc3BhY2VJZOeUqOS6juaKk+WPlkNyZWF0b3IuVVNFUl9DT05URVhU5a+55bqU55qE5YC8XG4gKi9cblxuQ3JlYXRvci5mb3JtYXRMb2dpY0ZpbHRlcnNUb0RldiA9IGZ1bmN0aW9uKGZpbHRlcnMsIGZpbHRlcl9sb2dpYywgb3B0aW9ucykge1xuICB2YXIgZm9ybWF0X2xvZ2ljO1xuICBmb3JtYXRfbG9naWMgPSBmaWx0ZXJfbG9naWMucmVwbGFjZSgvXFwoXFxzKy9pZywgXCIoXCIpLnJlcGxhY2UoL1xccytcXCkvaWcsIFwiKVwiKS5yZXBsYWNlKC9cXCgvZywgXCJbXCIpLnJlcGxhY2UoL1xcKS9nLCBcIl1cIikucmVwbGFjZSgvXFxzKy9nLCBcIixcIikucmVwbGFjZSgvKGFuZHxvcikvaWcsIFwiJyQxJ1wiKTtcbiAgZm9ybWF0X2xvZ2ljID0gZm9ybWF0X2xvZ2ljLnJlcGxhY2UoLyhcXGQpKy9pZywgZnVuY3Rpb24oeCkge1xuICAgIHZhciBfZiwgZmllbGQsIG9wdGlvbiwgc3ViX3NlbGVjdG9yLCB2YWx1ZTtcbiAgICBfZiA9IGZpbHRlcnNbeCAtIDFdO1xuICAgIGZpZWxkID0gX2YuZmllbGQ7XG4gICAgb3B0aW9uID0gX2Yub3BlcmF0aW9uO1xuICAgIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICAgIHZhbHVlID0gQ3JlYXRvci5ldmFsdWF0ZUZvcm11bGEoX2YudmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IENyZWF0b3IuZXZhbHVhdGVGb3JtdWxhKF9mLnZhbHVlLCBudWxsLCBvcHRpb25zKTtcbiAgICB9XG4gICAgc3ViX3NlbGVjdG9yID0gW107XG4gICAgaWYgKF8uaXNBcnJheSh2YWx1ZSkgPT09IHRydWUpIHtcbiAgICAgIGlmIChvcHRpb24gPT09IFwiPVwiKSB7XG4gICAgICAgIF8uZWFjaCh2YWx1ZSwgZnVuY3Rpb24odikge1xuICAgICAgICAgIHJldHVybiBzdWJfc2VsZWN0b3IucHVzaChbZmllbGQsIG9wdGlvbiwgdl0sIFwib3JcIik7XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIGlmIChvcHRpb24gPT09IFwiPD5cIikge1xuICAgICAgICBfLmVhY2godmFsdWUsIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICByZXR1cm4gc3ViX3NlbGVjdG9yLnB1c2goW2ZpZWxkLCBvcHRpb24sIHZdLCBcImFuZFwiKTtcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBfLmVhY2godmFsdWUsIGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgICByZXR1cm4gc3ViX3NlbGVjdG9yLnB1c2goW2ZpZWxkLCBvcHRpb24sIHZdLCBcIm9yXCIpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGlmIChzdWJfc2VsZWN0b3Jbc3ViX3NlbGVjdG9yLmxlbmd0aCAtIDFdID09PSBcImFuZFwiIHx8IHN1Yl9zZWxlY3RvcltzdWJfc2VsZWN0b3IubGVuZ3RoIC0gMV0gPT09IFwib3JcIikge1xuICAgICAgICBzdWJfc2VsZWN0b3IucG9wKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN1Yl9zZWxlY3RvciA9IFtmaWVsZCwgb3B0aW9uLCB2YWx1ZV07XG4gICAgfVxuICAgIGNvbnNvbGUubG9nKFwic3ViX3NlbGVjdG9yXCIsIHN1Yl9zZWxlY3Rvcik7XG4gICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHN1Yl9zZWxlY3Rvcik7XG4gIH0pO1xuICBmb3JtYXRfbG9naWMgPSBcIltcIiArIGZvcm1hdF9sb2dpYyArIFwiXVwiO1xuICByZXR1cm4gQ3JlYXRvcltcImV2YWxcIl0oZm9ybWF0X2xvZ2ljKTtcbn07XG5cbkNyZWF0b3IuZ2V0UmVsYXRlZE9iamVjdHMgPSBmdW5jdGlvbihvYmplY3RfbmFtZSwgc3BhY2VJZCwgdXNlcklkKSB7XG4gIHZhciBfb2JqZWN0LCBwZXJtaXNzaW9ucywgcmVsYXRlZF9vYmplY3RfbmFtZXMsIHJlbGF0ZWRfb2JqZWN0cywgdW5yZWxhdGVkX29iamVjdHM7XG4gIGlmIChNZXRlb3IuaXNDbGllbnQpIHtcbiAgICBpZiAoIW9iamVjdF9uYW1lKSB7XG4gICAgICBvYmplY3RfbmFtZSA9IFNlc3Npb24uZ2V0KFwib2JqZWN0X25hbWVcIik7XG4gICAgfVxuICAgIGlmICghc3BhY2VJZCkge1xuICAgICAgc3BhY2VJZCA9IFNlc3Npb24uZ2V0KFwic3BhY2VJZFwiKTtcbiAgICB9XG4gICAgaWYgKCF1c2VySWQpIHtcbiAgICAgIHVzZXJJZCA9IE1ldGVvci51c2VySWQoKTtcbiAgICB9XG4gIH1cbiAgcmVsYXRlZF9vYmplY3RfbmFtZXMgPSBbXTtcbiAgX29iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KG9iamVjdF9uYW1lKTtcbiAgaWYgKCFfb2JqZWN0KSB7XG4gICAgcmV0dXJuIHJlbGF0ZWRfb2JqZWN0X25hbWVzO1xuICB9XG4gIHJlbGF0ZWRfb2JqZWN0cyA9IENyZWF0b3IuZ2V0T2JqZWN0UmVsYXRlZHMoX29iamVjdC5fY29sbGVjdGlvbl9uYW1lKTtcbiAgcmVsYXRlZF9vYmplY3RfbmFtZXMgPSBfLnBsdWNrKHJlbGF0ZWRfb2JqZWN0cywgXCJvYmplY3RfbmFtZVwiKTtcbiAgaWYgKChyZWxhdGVkX29iamVjdF9uYW1lcyAhPSBudWxsID8gcmVsYXRlZF9vYmplY3RfbmFtZXMubGVuZ3RoIDogdm9pZCAwKSA9PT0gMCkge1xuICAgIHJldHVybiByZWxhdGVkX29iamVjdF9uYW1lcztcbiAgfVxuICBwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0UGVybWlzc2lvbnMob2JqZWN0X25hbWUsIHNwYWNlSWQsIHVzZXJJZCk7XG4gIHVucmVsYXRlZF9vYmplY3RzID0gcGVybWlzc2lvbnMudW5yZWxhdGVkX29iamVjdHM7XG4gIHJlbGF0ZWRfb2JqZWN0X25hbWVzID0gXy5kaWZmZXJlbmNlKHJlbGF0ZWRfb2JqZWN0X25hbWVzLCB1bnJlbGF0ZWRfb2JqZWN0cyk7XG4gIHJldHVybiBfLmZpbHRlcihyZWxhdGVkX29iamVjdHMsIGZ1bmN0aW9uKHJlbGF0ZWRfb2JqZWN0KSB7XG4gICAgdmFyIGFsbG93UmVhZCwgaXNBY3RpdmUsIHJlZiwgcmVsYXRlZF9vYmplY3RfbmFtZTtcbiAgICByZWxhdGVkX29iamVjdF9uYW1lID0gcmVsYXRlZF9vYmplY3Qub2JqZWN0X25hbWU7XG4gICAgaXNBY3RpdmUgPSByZWxhdGVkX29iamVjdF9uYW1lcy5pbmRleE9mKHJlbGF0ZWRfb2JqZWN0X25hbWUpID4gLTE7XG4gICAgYWxsb3dSZWFkID0gKHJlZiA9IENyZWF0b3IuZ2V0UGVybWlzc2lvbnMocmVsYXRlZF9vYmplY3RfbmFtZSwgc3BhY2VJZCwgdXNlcklkKSkgIT0gbnVsbCA/IHJlZi5hbGxvd1JlYWQgOiB2b2lkIDA7XG4gICAgcmV0dXJuIGlzQWN0aXZlICYmIGFsbG93UmVhZDtcbiAgfSk7XG59O1xuXG5DcmVhdG9yLmdldFJlbGF0ZWRPYmplY3ROYW1lcyA9IGZ1bmN0aW9uKG9iamVjdF9uYW1lLCBzcGFjZUlkLCB1c2VySWQpIHtcbiAgdmFyIHJlbGF0ZWRfb2JqZWN0cztcbiAgcmVsYXRlZF9vYmplY3RzID0gQ3JlYXRvci5nZXRSZWxhdGVkT2JqZWN0cyhvYmplY3RfbmFtZSwgc3BhY2VJZCwgdXNlcklkKTtcbiAgcmV0dXJuIF8ucGx1Y2socmVsYXRlZF9vYmplY3RzLCBcIm9iamVjdF9uYW1lXCIpO1xufTtcblxuQ3JlYXRvci5nZXRBY3Rpb25zID0gZnVuY3Rpb24ob2JqZWN0X25hbWUsIHNwYWNlSWQsIHVzZXJJZCkge1xuICB2YXIgYWN0aW9ucywgZGlzYWJsZWRfYWN0aW9ucywgb2JqLCBwZXJtaXNzaW9ucywgcmVmLCByZWYxO1xuICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgaWYgKCFvYmplY3RfbmFtZSkge1xuICAgICAgb2JqZWN0X25hbWUgPSBTZXNzaW9uLmdldChcIm9iamVjdF9uYW1lXCIpO1xuICAgIH1cbiAgICBpZiAoIXNwYWNlSWQpIHtcbiAgICAgIHNwYWNlSWQgPSBTZXNzaW9uLmdldChcInNwYWNlSWRcIik7XG4gICAgfVxuICAgIGlmICghdXNlcklkKSB7XG4gICAgICB1c2VySWQgPSBNZXRlb3IudXNlcklkKCk7XG4gICAgfVxuICB9XG4gIG9iaiA9IENyZWF0b3IuZ2V0T2JqZWN0KG9iamVjdF9uYW1lKTtcbiAgaWYgKCFvYmopIHtcbiAgICByZXR1cm47XG4gIH1cbiAgcGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldFBlcm1pc3Npb25zKG9iamVjdF9uYW1lLCBzcGFjZUlkLCB1c2VySWQpO1xuICBkaXNhYmxlZF9hY3Rpb25zID0gcGVybWlzc2lvbnMuZGlzYWJsZWRfYWN0aW9ucztcbiAgYWN0aW9ucyA9IF8uc29ydEJ5KF8udmFsdWVzKG9iai5hY3Rpb25zKSwgJ3NvcnQnKTtcbiAgaWYgKF8uaGFzKG9iaiwgJ2FsbG93X2FjdGlvbnMnKSkge1xuICAgIGFjdGlvbnMgPSBfLmZpbHRlcihhY3Rpb25zLCBmdW5jdGlvbihhY3Rpb24pIHtcbiAgICAgIHJldHVybiBfLmluY2x1ZGUob2JqLmFsbG93X2FjdGlvbnMsIGFjdGlvbi5uYW1lKTtcbiAgICB9KTtcbiAgfVxuICBfLmVhY2goYWN0aW9ucywgZnVuY3Rpb24oYWN0aW9uKSB7XG4gICAgaWYgKFN0ZWVkb3MuaXNNb2JpbGUoKSAmJiBbXCJyZWNvcmRcIiwgXCJyZWNvcmRfb25seVwiXS5pbmRleE9mKGFjdGlvbi5vbikgPiAtMSAmJiBhY3Rpb24ubmFtZSAhPT0gJ3N0YW5kYXJkX2VkaXQnKSB7XG4gICAgICBpZiAoYWN0aW9uLm9uID09PSBcInJlY29yZF9vbmx5XCIpIHtcbiAgICAgICAgcmV0dXJuIGFjdGlvbi5vbiA9ICdyZWNvcmRfb25seV9tb3JlJztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBhY3Rpb24ub24gPSAncmVjb3JkX21vcmUnO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG4gIGlmIChTdGVlZG9zLmlzTW9iaWxlKCkgJiYgW1wiY21zX2ZpbGVzXCIsIFwiY2ZzLmZpbGVzLmZpbGVyZWNvcmRcIl0uaW5kZXhPZihvYmplY3RfbmFtZSkgPiAtMSkge1xuICAgIGlmICgocmVmID0gYWN0aW9ucy5maW5kKGZ1bmN0aW9uKG4pIHtcbiAgICAgIHJldHVybiBuLm5hbWUgPT09IFwic3RhbmRhcmRfZWRpdFwiO1xuICAgIH0pKSAhPSBudWxsKSB7XG4gICAgICByZWYub24gPSBcInJlY29yZF9tb3JlXCI7XG4gICAgfVxuICAgIGlmICgocmVmMSA9IGFjdGlvbnMuZmluZChmdW5jdGlvbihuKSB7XG4gICAgICByZXR1cm4gbi5uYW1lID09PSBcImRvd25sb2FkXCI7XG4gICAgfSkpICE9IG51bGwpIHtcbiAgICAgIHJlZjEub24gPSBcInJlY29yZFwiO1xuICAgIH1cbiAgfVxuICBhY3Rpb25zID0gXy5maWx0ZXIoYWN0aW9ucywgZnVuY3Rpb24oYWN0aW9uKSB7XG4gICAgcmV0dXJuIF8uaW5kZXhPZihkaXNhYmxlZF9hY3Rpb25zLCBhY3Rpb24ubmFtZSkgPCAwO1xuICB9KTtcbiAgcmV0dXJuIGFjdGlvbnM7XG59O1xuXG4v6L+U5Zue5b2T5YmN55So5oi35pyJ5p2D6ZmQ6K6/6Zeu55qE5omA5pyJbGlzdF92aWV377yM5YyF5ous5YiG5Lqr55qE77yM55So5oi36Ieq5a6a5LmJ6Z2e5YiG5Lqr55qE77yI6Zmk6Z2eb3duZXLlj5jkuobvvInvvIzku6Xlj4rpu5jorqTnmoTlhbbku5bop4blm77ms6jmhI9DcmVhdG9yLmdldFBlcm1pc3Npb25z5Ye95pWw5Lit5piv5LiN5Lya5pyJ55So5oi36Ieq5a6a5LmJ6Z2e5YiG5Lqr55qE6KeG5Zu+55qE77yM5omA5LulQ3JlYXRvci5nZXRQZXJtaXNzaW9uc+WHveaVsOS4reaLv+WIsOeahOe7k+aenOS4jeWFqO+8jOW5tuS4jeaYr+W9k+WJjeeUqOaIt+iDveeci+WIsOaJgOacieinhuWbvi87XG5cbkNyZWF0b3IuZ2V0TGlzdFZpZXdzID0gZnVuY3Rpb24ob2JqZWN0X25hbWUsIHNwYWNlSWQsIHVzZXJJZCkge1xuICB2YXIgZGlzYWJsZWRfbGlzdF92aWV3cywgaXNNb2JpbGUsIGxpc3Rfdmlld3MsIG9iamVjdCwgcmVmO1xuICBpZiAoTWV0ZW9yLmlzQ2xpZW50KSB7XG4gICAgaWYgKCFvYmplY3RfbmFtZSkge1xuICAgICAgb2JqZWN0X25hbWUgPSBTZXNzaW9uLmdldChcIm9iamVjdF9uYW1lXCIpO1xuICAgIH1cbiAgICBpZiAoIXNwYWNlSWQpIHtcbiAgICAgIHNwYWNlSWQgPSBTZXNzaW9uLmdldChcInNwYWNlSWRcIik7XG4gICAgfVxuICAgIGlmICghdXNlcklkKSB7XG4gICAgICB1c2VySWQgPSBNZXRlb3IudXNlcklkKCk7XG4gICAgfVxuICB9XG4gIGlmICghb2JqZWN0X25hbWUpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0X25hbWUpO1xuICBpZiAoIW9iamVjdCkge1xuICAgIHJldHVybjtcbiAgfVxuICBkaXNhYmxlZF9saXN0X3ZpZXdzID0gKChyZWYgPSBDcmVhdG9yLmdldFBlcm1pc3Npb25zKG9iamVjdF9uYW1lLCBzcGFjZUlkLCB1c2VySWQpKSAhPSBudWxsID8gcmVmLmRpc2FibGVkX2xpc3Rfdmlld3MgOiB2b2lkIDApIHx8IFtdO1xuICBsaXN0X3ZpZXdzID0gW107XG4gIGlzTW9iaWxlID0gU3RlZWRvcy5pc01vYmlsZSgpO1xuICBfLmVhY2gob2JqZWN0Lmxpc3Rfdmlld3MsIGZ1bmN0aW9uKGl0ZW0sIGl0ZW1fbmFtZSkge1xuICAgIGlmIChpc01vYmlsZSAmJiBpdGVtLnR5cGUgPT09IFwiY2FsZW5kYXJcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoaXRlbV9uYW1lICE9PSBcImRlZmF1bHRcIikge1xuICAgICAgaWYgKF8uaW5kZXhPZihkaXNhYmxlZF9saXN0X3ZpZXdzLCBpdGVtX25hbWUpIDwgMCB8fCBpdGVtLm93bmVyID09PSB1c2VySWQpIHtcbiAgICAgICAgcmV0dXJuIGxpc3Rfdmlld3MucHVzaChpdGVtKTtcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4gbGlzdF92aWV3cztcbn07XG5cbkNyZWF0b3IuZ2V0RmllbGRzID0gZnVuY3Rpb24ob2JqZWN0X25hbWUsIHNwYWNlSWQsIHVzZXJJZCkge1xuICB2YXIgZmllbGRzTmFtZSwgcmVmLCB1bnJlYWRhYmxlX2ZpZWxkcztcbiAgaWYgKE1ldGVvci5pc0NsaWVudCkge1xuICAgIGlmICghb2JqZWN0X25hbWUpIHtcbiAgICAgIG9iamVjdF9uYW1lID0gU2Vzc2lvbi5nZXQoXCJvYmplY3RfbmFtZVwiKTtcbiAgICB9XG4gICAgaWYgKCFzcGFjZUlkKSB7XG4gICAgICBzcGFjZUlkID0gU2Vzc2lvbi5nZXQoXCJzcGFjZUlkXCIpO1xuICAgIH1cbiAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgdXNlcklkID0gTWV0ZW9yLnVzZXJJZCgpO1xuICAgIH1cbiAgfVxuICBmaWVsZHNOYW1lID0gQ3JlYXRvci5nZXRPYmplY3RGaWVsZHNOYW1lKG9iamVjdF9uYW1lKTtcbiAgdW5yZWFkYWJsZV9maWVsZHMgPSAocmVmID0gQ3JlYXRvci5nZXRQZXJtaXNzaW9ucyhvYmplY3RfbmFtZSwgc3BhY2VJZCwgdXNlcklkKSkgIT0gbnVsbCA/IHJlZi51bnJlYWRhYmxlX2ZpZWxkcyA6IHZvaWQgMDtcbiAgcmV0dXJuIF8uZGlmZmVyZW5jZShmaWVsZHNOYW1lLCB1bnJlYWRhYmxlX2ZpZWxkcyk7XG59O1xuXG5DcmVhdG9yLmlzbG9hZGluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gIUNyZWF0b3IuYm9vdHN0cmFwTG9hZGVkLmdldCgpO1xufTtcblxuQ3JlYXRvci5jb252ZXJ0U3BlY2lhbENoYXJhY3RlciA9IGZ1bmN0aW9uKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyhbXFxeXFwkXFwoXFwpXFwqXFwrXFw/XFwuXFxcXFxcfFxcW1xcXVxce1xcfV0pL2csIFwiXFxcXCQxXCIpO1xufTtcblxuQ3JlYXRvci5nZXREaXNhYmxlZEZpZWxkcyA9IGZ1bmN0aW9uKHNjaGVtYSkge1xuICB2YXIgZmllbGRzO1xuICBmaWVsZHMgPSBfLm1hcChzY2hlbWEsIGZ1bmN0aW9uKGZpZWxkLCBmaWVsZE5hbWUpIHtcbiAgICByZXR1cm4gZmllbGQuYXV0b2Zvcm0gJiYgZmllbGQuYXV0b2Zvcm0uZGlzYWJsZWQgJiYgIWZpZWxkLmF1dG9mb3JtLm9taXQgJiYgZmllbGROYW1lO1xuICB9KTtcbiAgZmllbGRzID0gXy5jb21wYWN0KGZpZWxkcyk7XG4gIHJldHVybiBmaWVsZHM7XG59O1xuXG5DcmVhdG9yLmdldEhpZGRlbkZpZWxkcyA9IGZ1bmN0aW9uKHNjaGVtYSkge1xuICB2YXIgZmllbGRzO1xuICBmaWVsZHMgPSBfLm1hcChzY2hlbWEsIGZ1bmN0aW9uKGZpZWxkLCBmaWVsZE5hbWUpIHtcbiAgICByZXR1cm4gZmllbGQuYXV0b2Zvcm0gJiYgZmllbGQuYXV0b2Zvcm0udHlwZSA9PT0gXCJoaWRkZW5cIiAmJiAhZmllbGQuYXV0b2Zvcm0ub21pdCAmJiBmaWVsZE5hbWU7XG4gIH0pO1xuICBmaWVsZHMgPSBfLmNvbXBhY3QoZmllbGRzKTtcbiAgcmV0dXJuIGZpZWxkcztcbn07XG5cbkNyZWF0b3IuZ2V0RmllbGRzV2l0aE5vR3JvdXAgPSBmdW5jdGlvbihzY2hlbWEpIHtcbiAgdmFyIGZpZWxkcztcbiAgZmllbGRzID0gXy5tYXAoc2NoZW1hLCBmdW5jdGlvbihmaWVsZCwgZmllbGROYW1lKSB7XG4gICAgcmV0dXJuICghZmllbGQuYXV0b2Zvcm0gfHwgIWZpZWxkLmF1dG9mb3JtLmdyb3VwIHx8IGZpZWxkLmF1dG9mb3JtLmdyb3VwID09PSBcIi1cIikgJiYgKCFmaWVsZC5hdXRvZm9ybSB8fCBmaWVsZC5hdXRvZm9ybS50eXBlICE9PSBcImhpZGRlblwiKSAmJiBmaWVsZE5hbWU7XG4gIH0pO1xuICBmaWVsZHMgPSBfLmNvbXBhY3QoZmllbGRzKTtcbiAgcmV0dXJuIGZpZWxkcztcbn07XG5cbkNyZWF0b3IuZ2V0U29ydGVkRmllbGRHcm91cE5hbWVzID0gZnVuY3Rpb24oc2NoZW1hKSB7XG4gIHZhciBuYW1lcztcbiAgbmFtZXMgPSBfLm1hcChzY2hlbWEsIGZ1bmN0aW9uKGZpZWxkKSB7XG4gICAgcmV0dXJuIGZpZWxkLmF1dG9mb3JtICYmIGZpZWxkLmF1dG9mb3JtLmdyb3VwICE9PSBcIi1cIiAmJiBmaWVsZC5hdXRvZm9ybS5ncm91cDtcbiAgfSk7XG4gIG5hbWVzID0gXy5jb21wYWN0KG5hbWVzKTtcbiAgbmFtZXMgPSBfLnVuaXF1ZShuYW1lcyk7XG4gIHJldHVybiBuYW1lcztcbn07XG5cbkNyZWF0b3IuZ2V0RmllbGRzRm9yR3JvdXAgPSBmdW5jdGlvbihzY2hlbWEsIGdyb3VwTmFtZSkge1xuICB2YXIgZmllbGRzO1xuICBmaWVsZHMgPSBfLm1hcChzY2hlbWEsIGZ1bmN0aW9uKGZpZWxkLCBmaWVsZE5hbWUpIHtcbiAgICByZXR1cm4gZmllbGQuYXV0b2Zvcm0gJiYgZmllbGQuYXV0b2Zvcm0uZ3JvdXAgPT09IGdyb3VwTmFtZSAmJiBmaWVsZC5hdXRvZm9ybS50eXBlICE9PSBcImhpZGRlblwiICYmIGZpZWxkTmFtZTtcbiAgfSk7XG4gIGZpZWxkcyA9IF8uY29tcGFjdChmaWVsZHMpO1xuICByZXR1cm4gZmllbGRzO1xufTtcblxuQ3JlYXRvci5nZXRGaWVsZHNXaXRob3V0T21pdCA9IGZ1bmN0aW9uKHNjaGVtYSwga2V5cykge1xuICBrZXlzID0gXy5tYXAoa2V5cywgZnVuY3Rpb24oa2V5KSB7XG4gICAgdmFyIGZpZWxkLCByZWY7XG4gICAgZmllbGQgPSBfLnBpY2soc2NoZW1hLCBrZXkpO1xuICAgIGlmICgocmVmID0gZmllbGRba2V5XS5hdXRvZm9ybSkgIT0gbnVsbCA/IHJlZi5vbWl0IDogdm9pZCAwKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBrZXk7XG4gICAgfVxuICB9KTtcbiAga2V5cyA9IF8uY29tcGFjdChrZXlzKTtcbiAgcmV0dXJuIGtleXM7XG59O1xuXG5DcmVhdG9yLmdldEZpZWxkc0luRmlyc3RMZXZlbCA9IGZ1bmN0aW9uKGZpcnN0TGV2ZWxLZXlzLCBrZXlzKSB7XG4gIGtleXMgPSBfLm1hcChrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICBpZiAoXy5pbmRleE9mKGZpcnN0TGV2ZWxLZXlzLCBrZXkpID4gLTEpIHtcbiAgICAgIHJldHVybiBrZXk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0pO1xuICBrZXlzID0gXy5jb21wYWN0KGtleXMpO1xuICByZXR1cm4ga2V5cztcbn07XG5cbkNyZWF0b3IuZ2V0RmllbGRzRm9yUmVvcmRlciA9IGZ1bmN0aW9uKHNjaGVtYSwga2V5cywgaXNTaW5nbGUpIHtcbiAgdmFyIF9rZXlzLCBjaGlsZEtleXMsIGZpZWxkcywgaSwgaXNfd2lkZV8xLCBpc193aWRlXzIsIHNjXzEsIHNjXzI7XG4gIGZpZWxkcyA9IFtdO1xuICBpID0gMDtcbiAgX2tleXMgPSBfLmZpbHRlcihrZXlzLCBmdW5jdGlvbihrZXkpIHtcbiAgICByZXR1cm4gIWtleS5lbmRzV2l0aCgnX2VuZExpbmUnKTtcbiAgfSk7XG4gIHdoaWxlIChpIDwgX2tleXMubGVuZ3RoKSB7XG4gICAgc2NfMSA9IF8ucGljayhzY2hlbWEsIF9rZXlzW2ldKTtcbiAgICBzY18yID0gXy5waWNrKHNjaGVtYSwgX2tleXNbaSArIDFdKTtcbiAgICBpc193aWRlXzEgPSBmYWxzZTtcbiAgICBpc193aWRlXzIgPSBmYWxzZTtcbiAgICBfLmVhY2goc2NfMSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHZhciByZWYsIHJlZjE7XG4gICAgICBpZiAoKChyZWYgPSB2YWx1ZS5hdXRvZm9ybSkgIT0gbnVsbCA/IHJlZi5pc193aWRlIDogdm9pZCAwKSB8fCAoKHJlZjEgPSB2YWx1ZS5hdXRvZm9ybSkgIT0gbnVsbCA/IHJlZjEudHlwZSA6IHZvaWQgMCkgPT09IFwidGFibGVcIikge1xuICAgICAgICByZXR1cm4gaXNfd2lkZV8xID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBfLmVhY2goc2NfMiwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHZhciByZWYsIHJlZjE7XG4gICAgICBpZiAoKChyZWYgPSB2YWx1ZS5hdXRvZm9ybSkgIT0gbnVsbCA/IHJlZi5pc193aWRlIDogdm9pZCAwKSB8fCAoKHJlZjEgPSB2YWx1ZS5hdXRvZm9ybSkgIT0gbnVsbCA/IHJlZjEudHlwZSA6IHZvaWQgMCkgPT09IFwidGFibGVcIikge1xuICAgICAgICByZXR1cm4gaXNfd2lkZV8yID0gdHJ1ZTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBpZiAoU3RlZWRvcy5pc01vYmlsZSgpKSB7XG4gICAgICBpc193aWRlXzEgPSB0cnVlO1xuICAgICAgaXNfd2lkZV8yID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGlzU2luZ2xlKSB7XG4gICAgICBmaWVsZHMucHVzaChfa2V5cy5zbGljZShpLCBpICsgMSkpO1xuICAgICAgaSArPSAxO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaXNfd2lkZV8xKSB7XG4gICAgICAgIGZpZWxkcy5wdXNoKF9rZXlzLnNsaWNlKGksIGkgKyAxKSk7XG4gICAgICAgIGkgKz0gMTtcbiAgICAgIH0gZWxzZSBpZiAoIWlzX3dpZGVfMSAmJiBpc193aWRlXzIpIHtcbiAgICAgICAgY2hpbGRLZXlzID0gX2tleXMuc2xpY2UoaSwgaSArIDEpO1xuICAgICAgICBjaGlsZEtleXMucHVzaCh2b2lkIDApO1xuICAgICAgICBmaWVsZHMucHVzaChjaGlsZEtleXMpO1xuICAgICAgICBpICs9IDE7XG4gICAgICB9IGVsc2UgaWYgKCFpc193aWRlXzEgJiYgIWlzX3dpZGVfMikge1xuICAgICAgICBjaGlsZEtleXMgPSBfa2V5cy5zbGljZShpLCBpICsgMSk7XG4gICAgICAgIGlmIChfa2V5c1tpICsgMV0pIHtcbiAgICAgICAgICBjaGlsZEtleXMucHVzaChfa2V5c1tpICsgMV0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNoaWxkS2V5cy5wdXNoKHZvaWQgMCk7XG4gICAgICAgIH1cbiAgICAgICAgZmllbGRzLnB1c2goY2hpbGRLZXlzKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gZmllbGRzO1xufTtcblxuQ3JlYXRvci5pc0ZpbHRlclZhbHVlRW1wdHkgPSBmdW5jdGlvbih2KSB7XG4gIHJldHVybiB0eXBlb2YgdiA9PT0gXCJ1bmRlZmluZWRcIiB8fCB2ID09PSBudWxsIHx8IE51bWJlci5pc05hTih2KSB8fCB2Lmxlbmd0aCA9PT0gMDtcbn07XG5cbmlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgQ3JlYXRvci5nZXRBbGxSZWxhdGVkT2JqZWN0cyA9IGZ1bmN0aW9uKG9iamVjdF9uYW1lKSB7XG4gICAgdmFyIHJlbGF0ZWRfb2JqZWN0X25hbWVzO1xuICAgIHJlbGF0ZWRfb2JqZWN0X25hbWVzID0gW107XG4gICAgXy5lYWNoKENyZWF0b3IuT2JqZWN0cywgZnVuY3Rpb24ocmVsYXRlZF9vYmplY3QsIHJlbGF0ZWRfb2JqZWN0X25hbWUpIHtcbiAgICAgIHJldHVybiBfLmVhY2gocmVsYXRlZF9vYmplY3QuZmllbGRzLCBmdW5jdGlvbihyZWxhdGVkX2ZpZWxkLCByZWxhdGVkX2ZpZWxkX25hbWUpIHtcbiAgICAgICAgaWYgKHJlbGF0ZWRfZmllbGQudHlwZSA9PT0gXCJtYXN0ZXJfZGV0YWlsXCIgJiYgcmVsYXRlZF9maWVsZC5yZWZlcmVuY2VfdG8gJiYgcmVsYXRlZF9maWVsZC5yZWZlcmVuY2VfdG8gPT09IG9iamVjdF9uYW1lKSB7XG4gICAgICAgICAgcmV0dXJuIHJlbGF0ZWRfb2JqZWN0X25hbWVzLnB1c2gocmVsYXRlZF9vYmplY3RfbmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGlmIChDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSkuZW5hYmxlX2ZpbGVzKSB7XG4gICAgICByZWxhdGVkX29iamVjdF9uYW1lcy5wdXNoKFwiY21zX2ZpbGVzXCIpO1xuICAgIH1cbiAgICByZXR1cm4gcmVsYXRlZF9vYmplY3RfbmFtZXM7XG4gIH07XG59XG4iLCJDcmVhdG9yLmFwcHNCeU5hbWUgPSB7fVxyXG5cclxuIiwiTWV0ZW9yLm1ldGhvZHNcclxuXHRcIm9iamVjdF9yZWNlbnRfdmlld2VkXCI6IChvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBzcGFjZV9pZCktPlxyXG5cdFx0aWYgIXRoaXMudXNlcklkXHJcblx0XHRcdHJldHVybiBudWxsXHJcblxyXG5cdFx0aWYgb2JqZWN0X25hbWUgPT0gXCJvYmplY3RfcmVjZW50X3ZpZXdlZFwiXHJcblx0XHRcdHJldHVyblxyXG5cdFx0aWYgb2JqZWN0X25hbWUgYW5kIHJlY29yZF9pZFxyXG5cdFx0XHRpZiAhc3BhY2VfaWRcclxuXHRcdFx0XHRkb2MgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqZWN0X25hbWUpLmZpbmRPbmUoe19pZDogcmVjb3JkX2lkfSwge2ZpZWxkczoge3NwYWNlOiAxfX0pXHJcblx0XHRcdFx0c3BhY2VfaWQgPSBkb2M/LnNwYWNlXHJcblxyXG5cdFx0XHRjb2xsZWN0aW9uX3JlY2VudF92aWV3ZWQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfcmVjZW50X3ZpZXdlZFwiKVxyXG5cdFx0XHRmaWx0ZXJzID0geyBvd25lcjogdGhpcy51c2VySWQsIHNwYWNlOiBzcGFjZV9pZCwgJ3JlY29yZC5vJzogb2JqZWN0X25hbWUsICdyZWNvcmQuaWRzJzogW3JlY29yZF9pZF19XHJcblx0XHRcdGN1cnJlbnRfcmVjZW50X3ZpZXdlZCA9IGNvbGxlY3Rpb25fcmVjZW50X3ZpZXdlZC5maW5kT25lKGZpbHRlcnMpXHJcblx0XHRcdGlmIGN1cnJlbnRfcmVjZW50X3ZpZXdlZFxyXG5cdFx0XHRcdGNvbGxlY3Rpb25fcmVjZW50X3ZpZXdlZC51cGRhdGUoXHJcblx0XHRcdFx0XHRjdXJyZW50X3JlY2VudF92aWV3ZWQuX2lkLFxyXG5cdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHQkaW5jOiB7XHJcblx0XHRcdFx0XHRcdFx0Y291bnQ6IDFcclxuXHRcdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdFx0JHNldDoge1xyXG5cdFx0XHRcdFx0XHRcdG1vZGlmaWVkOiBuZXcgRGF0ZSgpXHJcblx0XHRcdFx0XHRcdFx0bW9kaWZpZWRfYnk6IHRoaXMudXNlcklkXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHQpXHJcblx0XHRcdGVsc2VcclxuXHRcdFx0XHRjb2xsZWN0aW9uX3JlY2VudF92aWV3ZWQuaW5zZXJ0KFxyXG5cdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRfaWQ6IGNvbGxlY3Rpb25fcmVjZW50X3ZpZXdlZC5fbWFrZU5ld0lEKClcclxuXHRcdFx0XHRcdFx0b3duZXI6IHRoaXMudXNlcklkXHJcblx0XHRcdFx0XHRcdHNwYWNlOiBzcGFjZV9pZFxyXG5cdFx0XHRcdFx0XHRyZWNvcmQ6IHtvOiBvYmplY3RfbmFtZSwgaWRzOiBbcmVjb3JkX2lkXX1cclxuXHRcdFx0XHRcdFx0Y291bnQ6IDFcclxuXHRcdFx0XHRcdFx0Y3JlYXRlZDogbmV3IERhdGUoKVxyXG5cdFx0XHRcdFx0XHRjcmVhdGVkX2J5OiB0aGlzLnVzZXJJZFxyXG5cdFx0XHRcdFx0XHRtb2RpZmllZDogbmV3IERhdGUoKVxyXG5cdFx0XHRcdFx0XHRtb2RpZmllZF9ieTogdGhpcy51c2VySWRcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHQpXHJcblx0XHRcdHJldHVybiIsIk1ldGVvci5tZXRob2RzKHtcbiAgXCJvYmplY3RfcmVjZW50X3ZpZXdlZFwiOiBmdW5jdGlvbihvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBzcGFjZV9pZCkge1xuICAgIHZhciBjb2xsZWN0aW9uX3JlY2VudF92aWV3ZWQsIGN1cnJlbnRfcmVjZW50X3ZpZXdlZCwgZG9jLCBmaWx0ZXJzO1xuICAgIGlmICghdGhpcy51c2VySWQpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBpZiAob2JqZWN0X25hbWUgPT09IFwib2JqZWN0X3JlY2VudF92aWV3ZWRcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAob2JqZWN0X25hbWUgJiYgcmVjb3JkX2lkKSB7XG4gICAgICBpZiAoIXNwYWNlX2lkKSB7XG4gICAgICAgIGRvYyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihvYmplY3RfbmFtZSkuZmluZE9uZSh7XG4gICAgICAgICAgX2lkOiByZWNvcmRfaWRcbiAgICAgICAgfSwge1xuICAgICAgICAgIGZpZWxkczoge1xuICAgICAgICAgICAgc3BhY2U6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBzcGFjZV9pZCA9IGRvYyAhPSBudWxsID8gZG9jLnNwYWNlIDogdm9pZCAwO1xuICAgICAgfVxuICAgICAgY29sbGVjdGlvbl9yZWNlbnRfdmlld2VkID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X3JlY2VudF92aWV3ZWRcIik7XG4gICAgICBmaWx0ZXJzID0ge1xuICAgICAgICBvd25lcjogdGhpcy51c2VySWQsXG4gICAgICAgIHNwYWNlOiBzcGFjZV9pZCxcbiAgICAgICAgJ3JlY29yZC5vJzogb2JqZWN0X25hbWUsXG4gICAgICAgICdyZWNvcmQuaWRzJzogW3JlY29yZF9pZF1cbiAgICAgIH07XG4gICAgICBjdXJyZW50X3JlY2VudF92aWV3ZWQgPSBjb2xsZWN0aW9uX3JlY2VudF92aWV3ZWQuZmluZE9uZShmaWx0ZXJzKTtcbiAgICAgIGlmIChjdXJyZW50X3JlY2VudF92aWV3ZWQpIHtcbiAgICAgICAgY29sbGVjdGlvbl9yZWNlbnRfdmlld2VkLnVwZGF0ZShjdXJyZW50X3JlY2VudF92aWV3ZWQuX2lkLCB7XG4gICAgICAgICAgJGluYzoge1xuICAgICAgICAgICAgY291bnQ6IDFcbiAgICAgICAgICB9LFxuICAgICAgICAgICRzZXQ6IHtcbiAgICAgICAgICAgIG1vZGlmaWVkOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgbW9kaWZpZWRfYnk6IHRoaXMudXNlcklkXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbGxlY3Rpb25fcmVjZW50X3ZpZXdlZC5pbnNlcnQoe1xuICAgICAgICAgIF9pZDogY29sbGVjdGlvbl9yZWNlbnRfdmlld2VkLl9tYWtlTmV3SUQoKSxcbiAgICAgICAgICBvd25lcjogdGhpcy51c2VySWQsXG4gICAgICAgICAgc3BhY2U6IHNwYWNlX2lkLFxuICAgICAgICAgIHJlY29yZDoge1xuICAgICAgICAgICAgbzogb2JqZWN0X25hbWUsXG4gICAgICAgICAgICBpZHM6IFtyZWNvcmRfaWRdXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjb3VudDogMSxcbiAgICAgICAgICBjcmVhdGVkOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIGNyZWF0ZWRfYnk6IHRoaXMudXNlcklkLFxuICAgICAgICAgIG1vZGlmaWVkOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgIG1vZGlmaWVkX2J5OiB0aGlzLnVzZXJJZFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pO1xuIiwicmVjZW50X2FnZ3JlZ2F0ZSA9IChjcmVhdGVkX2J5LCBzcGFjZUlkLCBfcmVjb3JkcywgY2FsbGJhY2spLT5cclxuXHRDcmVhdG9yLkNvbGxlY3Rpb25zLm9iamVjdF9yZWNlbnRfdmlld2VkLnJhd0NvbGxlY3Rpb24oKS5hZ2dyZWdhdGUoW1xyXG5cdFx0eyRtYXRjaDoge2NyZWF0ZWRfYnk6IGNyZWF0ZWRfYnksIHNwYWNlOiBzcGFjZUlkfX0sXHJcblx0XHR7JGdyb3VwOiB7X2lkOiB7b2JqZWN0X25hbWU6IFwiJHJlY29yZC5vXCIsIHJlY29yZF9pZDogXCIkcmVjb3JkLmlkc1wiLCBzcGFjZTogXCIkc3BhY2VcIn0sIG1heENyZWF0ZWQ6IHskbWF4OiBcIiRjcmVhdGVkXCJ9fX0sXHJcblx0XHR7JHNvcnQ6IHttYXhDcmVhdGVkOiAtMX19LFxyXG5cdFx0eyRsaW1pdDogMTB9XHJcblx0XSkudG9BcnJheSAoZXJyLCBkYXRhKS0+XHJcblx0XHRpZiBlcnJcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKGVycilcclxuXHJcblx0XHRkYXRhLmZvckVhY2ggKGRvYykgLT5cclxuXHRcdFx0X3JlY29yZHMucHVzaCBkb2MuX2lkXHJcblxyXG5cdFx0aWYgY2FsbGJhY2sgJiYgXy5pc0Z1bmN0aW9uKGNhbGxiYWNrKVxyXG5cdFx0XHRjYWxsYmFjaygpXHJcblxyXG5cdFx0cmV0dXJuXHJcblxyXG5hc3luY19yZWNlbnRfYWdncmVnYXRlID0gTWV0ZW9yLndyYXBBc3luYyhyZWNlbnRfYWdncmVnYXRlKVxyXG5cclxuc2VhcmNoX29iamVjdCA9IChzcGFjZSwgb2JqZWN0X25hbWUsdXNlcklkLCBzZWFyY2hUZXh0KS0+XHJcblx0ZGF0YSA9IG5ldyBBcnJheSgpXHJcblxyXG5cdGlmIHNlYXJjaFRleHRcclxuXHJcblx0XHRfb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0X25hbWUpXHJcblxyXG5cdFx0X29iamVjdF9jb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKG9iamVjdF9uYW1lKVxyXG5cdFx0X29iamVjdF9uYW1lX2tleSA9IF9vYmplY3Q/Lk5BTUVfRklFTERfS0VZXHJcblx0XHRpZiBfb2JqZWN0ICYmIF9vYmplY3RfY29sbGVjdGlvbiAmJiBfb2JqZWN0X25hbWVfa2V5XHJcblx0XHRcdHF1ZXJ5ID0ge31cclxuXHRcdFx0c2VhcmNoX0tleXdvcmRzID0gc2VhcmNoVGV4dC5zcGxpdChcIiBcIilcclxuXHRcdFx0cXVlcnlfYW5kID0gW11cclxuXHRcdFx0c2VhcmNoX0tleXdvcmRzLmZvckVhY2ggKGtleXdvcmQpLT5cclxuXHRcdFx0XHRzdWJxdWVyeSA9IHt9XHJcblx0XHRcdFx0c3VicXVlcnlbX29iamVjdF9uYW1lX2tleV0gPSB7JHJlZ2V4OiBrZXl3b3JkLnRyaW0oKX1cclxuXHRcdFx0XHRxdWVyeV9hbmQucHVzaCBzdWJxdWVyeVxyXG5cclxuXHRcdFx0cXVlcnkuJGFuZCA9IHF1ZXJ5X2FuZFxyXG5cdFx0XHRxdWVyeS5zcGFjZSA9IHskaW46IFtzcGFjZV19XHJcblxyXG5cdFx0XHRmaWVsZHMgPSB7X2lkOiAxfVxyXG5cdFx0XHRmaWVsZHNbX29iamVjdF9uYW1lX2tleV0gPSAxXHJcblxyXG5cdFx0XHRyZWNvcmRzID0gX29iamVjdF9jb2xsZWN0aW9uLmZpbmQocXVlcnksIHtmaWVsZHM6IGZpZWxkcywgc29ydDoge21vZGlmaWVkOiAxfSwgbGltaXQ6IDV9KVxyXG5cclxuXHRcdFx0cmVjb3Jkcy5mb3JFYWNoIChyZWNvcmQpLT5cclxuXHRcdFx0XHRkYXRhLnB1c2gge19pZDogcmVjb3JkLl9pZCwgX25hbWU6IHJlY29yZFtfb2JqZWN0X25hbWVfa2V5XSwgX29iamVjdF9uYW1lOiBvYmplY3RfbmFtZX1cclxuXHRcclxuXHRyZXR1cm4gZGF0YVxyXG5cclxuTWV0ZW9yLm1ldGhvZHNcclxuXHQnb2JqZWN0X3JlY2VudF9yZWNvcmQnOiAoc3BhY2VJZCktPlxyXG5cdFx0ZGF0YSA9IG5ldyBBcnJheSgpXHJcblx0XHRyZWNvcmRzID0gbmV3IEFycmF5KClcclxuXHRcdGFzeW5jX3JlY2VudF9hZ2dyZWdhdGUodGhpcy51c2VySWQsIHNwYWNlSWQsIHJlY29yZHMpXHJcblx0XHRyZWNvcmRzLmZvckVhY2ggKGl0ZW0pLT5cclxuXHRcdFx0cmVjb3JkX29iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KGl0ZW0ub2JqZWN0X25hbWUsIGl0ZW0uc3BhY2UpXHJcblxyXG5cdFx0XHRpZiAhcmVjb3JkX29iamVjdFxyXG5cdFx0XHRcdHJldHVyblxyXG5cclxuXHRcdFx0cmVjb3JkX29iamVjdF9jb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGl0ZW0ub2JqZWN0X25hbWUsIGl0ZW0uc3BhY2UpXHJcblxyXG5cdFx0XHRpZiByZWNvcmRfb2JqZWN0ICYmIHJlY29yZF9vYmplY3RfY29sbGVjdGlvblxyXG5cdFx0XHRcdGZpZWxkcyA9IHtfaWQ6IDF9XHJcblxyXG5cdFx0XHRcdGZpZWxkc1tyZWNvcmRfb2JqZWN0Lk5BTUVfRklFTERfS0VZXSA9IDFcclxuXHJcblx0XHRcdFx0cmVjb3JkID0gcmVjb3JkX29iamVjdF9jb2xsZWN0aW9uLmZpbmRPbmUoaXRlbS5yZWNvcmRfaWRbMF0sIHtmaWVsZHM6IGZpZWxkc30pXHJcblx0XHRcdFx0aWYgcmVjb3JkXHJcblx0XHRcdFx0XHRkYXRhLnB1c2gge19pZDogcmVjb3JkLl9pZCwgX25hbWU6IHJlY29yZFtyZWNvcmRfb2JqZWN0Lk5BTUVfRklFTERfS0VZXSwgX29iamVjdF9uYW1lOiBpdGVtLm9iamVjdF9uYW1lfVxyXG5cclxuXHRcdHJldHVybiBkYXRhXHJcblxyXG5cdCdvYmplY3RfcmVjb3JkX3NlYXJjaCc6IChvcHRpb25zKS0+XHJcblx0XHRzZWxmID0gdGhpc1xyXG5cclxuXHRcdGRhdGEgPSBuZXcgQXJyYXkoKVxyXG5cclxuXHRcdHNlYXJjaFRleHQgPSBvcHRpb25zLnNlYXJjaFRleHRcclxuXHRcdHNwYWNlID0gb3B0aW9ucy5zcGFjZVxyXG5cclxuXHRcdF8uZm9yRWFjaCBDcmVhdG9yLm9iamVjdHNCeU5hbWUsIChfb2JqZWN0LCBuYW1lKS0+XHJcblx0XHRcdGlmIF9vYmplY3QuZW5hYmxlX3NlYXJjaFxyXG5cdFx0XHRcdG9iamVjdF9yZWNvcmQgPSBzZWFyY2hfb2JqZWN0KHNwYWNlLCBfb2JqZWN0Lm5hbWUsIHNlbGYudXNlcklkLCBzZWFyY2hUZXh0KVxyXG5cdFx0XHRcdGRhdGEgPSBkYXRhLmNvbmNhdChvYmplY3RfcmVjb3JkKVxyXG5cclxuXHRcdHJldHVybiBkYXRhXHJcbiIsInZhciBhc3luY19yZWNlbnRfYWdncmVnYXRlLCByZWNlbnRfYWdncmVnYXRlLCBzZWFyY2hfb2JqZWN0O1xuXG5yZWNlbnRfYWdncmVnYXRlID0gZnVuY3Rpb24oY3JlYXRlZF9ieSwgc3BhY2VJZCwgX3JlY29yZHMsIGNhbGxiYWNrKSB7XG4gIHJldHVybiBDcmVhdG9yLkNvbGxlY3Rpb25zLm9iamVjdF9yZWNlbnRfdmlld2VkLnJhd0NvbGxlY3Rpb24oKS5hZ2dyZWdhdGUoW1xuICAgIHtcbiAgICAgICRtYXRjaDoge1xuICAgICAgICBjcmVhdGVkX2J5OiBjcmVhdGVkX2J5LFxuICAgICAgICBzcGFjZTogc3BhY2VJZFxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgICRncm91cDoge1xuICAgICAgICBfaWQ6IHtcbiAgICAgICAgICBvYmplY3RfbmFtZTogXCIkcmVjb3JkLm9cIixcbiAgICAgICAgICByZWNvcmRfaWQ6IFwiJHJlY29yZC5pZHNcIixcbiAgICAgICAgICBzcGFjZTogXCIkc3BhY2VcIlxuICAgICAgICB9LFxuICAgICAgICBtYXhDcmVhdGVkOiB7XG4gICAgICAgICAgJG1heDogXCIkY3JlYXRlZFwiXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9LCB7XG4gICAgICAkc29ydDoge1xuICAgICAgICBtYXhDcmVhdGVkOiAtMVxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgICRsaW1pdDogMTBcbiAgICB9XG4gIF0pLnRvQXJyYXkoZnVuY3Rpb24oZXJyLCBkYXRhKSB7XG4gICAgaWYgKGVycikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XG4gICAgfVxuICAgIGRhdGEuZm9yRWFjaChmdW5jdGlvbihkb2MpIHtcbiAgICAgIHJldHVybiBfcmVjb3Jkcy5wdXNoKGRvYy5faWQpO1xuICAgIH0pO1xuICAgIGlmIChjYWxsYmFjayAmJiBfLmlzRnVuY3Rpb24oY2FsbGJhY2spKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfSk7XG59O1xuXG5hc3luY19yZWNlbnRfYWdncmVnYXRlID0gTWV0ZW9yLndyYXBBc3luYyhyZWNlbnRfYWdncmVnYXRlKTtcblxuc2VhcmNoX29iamVjdCA9IGZ1bmN0aW9uKHNwYWNlLCBvYmplY3RfbmFtZSwgdXNlcklkLCBzZWFyY2hUZXh0KSB7XG4gIHZhciBfb2JqZWN0LCBfb2JqZWN0X2NvbGxlY3Rpb24sIF9vYmplY3RfbmFtZV9rZXksIGRhdGEsIGZpZWxkcywgcXVlcnksIHF1ZXJ5X2FuZCwgcmVjb3Jkcywgc2VhcmNoX0tleXdvcmRzO1xuICBkYXRhID0gbmV3IEFycmF5KCk7XG4gIGlmIChzZWFyY2hUZXh0KSB7XG4gICAgX29iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KG9iamVjdF9uYW1lKTtcbiAgICBfb2JqZWN0X2NvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqZWN0X25hbWUpO1xuICAgIF9vYmplY3RfbmFtZV9rZXkgPSBfb2JqZWN0ICE9IG51bGwgPyBfb2JqZWN0Lk5BTUVfRklFTERfS0VZIDogdm9pZCAwO1xuICAgIGlmIChfb2JqZWN0ICYmIF9vYmplY3RfY29sbGVjdGlvbiAmJiBfb2JqZWN0X25hbWVfa2V5KSB7XG4gICAgICBxdWVyeSA9IHt9O1xuICAgICAgc2VhcmNoX0tleXdvcmRzID0gc2VhcmNoVGV4dC5zcGxpdChcIiBcIik7XG4gICAgICBxdWVyeV9hbmQgPSBbXTtcbiAgICAgIHNlYXJjaF9LZXl3b3Jkcy5mb3JFYWNoKGZ1bmN0aW9uKGtleXdvcmQpIHtcbiAgICAgICAgdmFyIHN1YnF1ZXJ5O1xuICAgICAgICBzdWJxdWVyeSA9IHt9O1xuICAgICAgICBzdWJxdWVyeVtfb2JqZWN0X25hbWVfa2V5XSA9IHtcbiAgICAgICAgICAkcmVnZXg6IGtleXdvcmQudHJpbSgpXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBxdWVyeV9hbmQucHVzaChzdWJxdWVyeSk7XG4gICAgICB9KTtcbiAgICAgIHF1ZXJ5LiRhbmQgPSBxdWVyeV9hbmQ7XG4gICAgICBxdWVyeS5zcGFjZSA9IHtcbiAgICAgICAgJGluOiBbc3BhY2VdXG4gICAgICB9O1xuICAgICAgZmllbGRzID0ge1xuICAgICAgICBfaWQ6IDFcbiAgICAgIH07XG4gICAgICBmaWVsZHNbX29iamVjdF9uYW1lX2tleV0gPSAxO1xuICAgICAgcmVjb3JkcyA9IF9vYmplY3RfY29sbGVjdGlvbi5maW5kKHF1ZXJ5LCB7XG4gICAgICAgIGZpZWxkczogZmllbGRzLFxuICAgICAgICBzb3J0OiB7XG4gICAgICAgICAgbW9kaWZpZWQ6IDFcbiAgICAgICAgfSxcbiAgICAgICAgbGltaXQ6IDVcbiAgICAgIH0pO1xuICAgICAgcmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uKHJlY29yZCkge1xuICAgICAgICByZXR1cm4gZGF0YS5wdXNoKHtcbiAgICAgICAgICBfaWQ6IHJlY29yZC5faWQsXG4gICAgICAgICAgX25hbWU6IHJlY29yZFtfb2JqZWN0X25hbWVfa2V5XSxcbiAgICAgICAgICBfb2JqZWN0X25hbWU6IG9iamVjdF9uYW1lXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBkYXRhO1xufTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICAnb2JqZWN0X3JlY2VudF9yZWNvcmQnOiBmdW5jdGlvbihzcGFjZUlkKSB7XG4gICAgdmFyIGRhdGEsIHJlY29yZHM7XG4gICAgZGF0YSA9IG5ldyBBcnJheSgpO1xuICAgIHJlY29yZHMgPSBuZXcgQXJyYXkoKTtcbiAgICBhc3luY19yZWNlbnRfYWdncmVnYXRlKHRoaXMudXNlcklkLCBzcGFjZUlkLCByZWNvcmRzKTtcbiAgICByZWNvcmRzLmZvckVhY2goZnVuY3Rpb24oaXRlbSkge1xuICAgICAgdmFyIGZpZWxkcywgcmVjb3JkLCByZWNvcmRfb2JqZWN0LCByZWNvcmRfb2JqZWN0X2NvbGxlY3Rpb247XG4gICAgICByZWNvcmRfb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3QoaXRlbS5vYmplY3RfbmFtZSwgaXRlbS5zcGFjZSk7XG4gICAgICBpZiAoIXJlY29yZF9vYmplY3QpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmVjb3JkX29iamVjdF9jb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKGl0ZW0ub2JqZWN0X25hbWUsIGl0ZW0uc3BhY2UpO1xuICAgICAgaWYgKHJlY29yZF9vYmplY3QgJiYgcmVjb3JkX29iamVjdF9jb2xsZWN0aW9uKSB7XG4gICAgICAgIGZpZWxkcyA9IHtcbiAgICAgICAgICBfaWQ6IDFcbiAgICAgICAgfTtcbiAgICAgICAgZmllbGRzW3JlY29yZF9vYmplY3QuTkFNRV9GSUVMRF9LRVldID0gMTtcbiAgICAgICAgcmVjb3JkID0gcmVjb3JkX29iamVjdF9jb2xsZWN0aW9uLmZpbmRPbmUoaXRlbS5yZWNvcmRfaWRbMF0sIHtcbiAgICAgICAgICBmaWVsZHM6IGZpZWxkc1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHJlY29yZCkge1xuICAgICAgICAgIHJldHVybiBkYXRhLnB1c2goe1xuICAgICAgICAgICAgX2lkOiByZWNvcmQuX2lkLFxuICAgICAgICAgICAgX25hbWU6IHJlY29yZFtyZWNvcmRfb2JqZWN0Lk5BTUVfRklFTERfS0VZXSxcbiAgICAgICAgICAgIF9vYmplY3RfbmFtZTogaXRlbS5vYmplY3RfbmFtZVxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH0sXG4gICdvYmplY3RfcmVjb3JkX3NlYXJjaCc6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICB2YXIgZGF0YSwgc2VhcmNoVGV4dCwgc2VsZiwgc3BhY2U7XG4gICAgc2VsZiA9IHRoaXM7XG4gICAgZGF0YSA9IG5ldyBBcnJheSgpO1xuICAgIHNlYXJjaFRleHQgPSBvcHRpb25zLnNlYXJjaFRleHQ7XG4gICAgc3BhY2UgPSBvcHRpb25zLnNwYWNlO1xuICAgIF8uZm9yRWFjaChDcmVhdG9yLm9iamVjdHNCeU5hbWUsIGZ1bmN0aW9uKF9vYmplY3QsIG5hbWUpIHtcbiAgICAgIHZhciBvYmplY3RfcmVjb3JkO1xuICAgICAgaWYgKF9vYmplY3QuZW5hYmxlX3NlYXJjaCkge1xuICAgICAgICBvYmplY3RfcmVjb3JkID0gc2VhcmNoX29iamVjdChzcGFjZSwgX29iamVjdC5uYW1lLCBzZWxmLnVzZXJJZCwgc2VhcmNoVGV4dCk7XG4gICAgICAgIHJldHVybiBkYXRhID0gZGF0YS5jb25jYXQob2JqZWN0X3JlY29yZCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHNcclxuICAgIHVwZGF0ZV9maWx0ZXJzOiAobGlzdHZpZXdfaWQsIGZpbHRlcnMsIGZpbHRlcl9zY29wZSwgZmlsdGVyX2xvZ2ljKS0+XHJcbiAgICAgICAgQ3JlYXRvci5Db2xsZWN0aW9ucy5vYmplY3RfbGlzdHZpZXdzLmRpcmVjdC51cGRhdGUoe19pZDogbGlzdHZpZXdfaWR9LCB7JHNldDoge2ZpbHRlcnM6IGZpbHRlcnMsIGZpbHRlcl9zY29wZTogZmlsdGVyX3Njb3BlLCBmaWx0ZXJfbG9naWM6IGZpbHRlcl9sb2dpY319KVxyXG5cclxuICAgIHVwZGF0ZV9jb2x1bW5zOiAobGlzdHZpZXdfaWQsIGNvbHVtbnMpLT5cclxuICAgICAgICBjaGVjayhjb2x1bW5zLCBBcnJheSlcclxuICAgICAgICBcclxuICAgICAgICBpZiBjb2x1bW5zLmxlbmd0aCA8IDFcclxuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvciA0MDAsIFwiU2VsZWN0IGF0IGxlYXN0IG9uZSBmaWVsZCB0byBkaXNwbGF5XCJcclxuICAgICAgICBDcmVhdG9yLkNvbGxlY3Rpb25zLm9iamVjdF9saXN0dmlld3MudXBkYXRlKHtfaWQ6IGxpc3R2aWV3X2lkfSwgeyRzZXQ6IHtjb2x1bW5zOiBjb2x1bW5zfX0pXHJcbiIsIk1ldGVvci5tZXRob2RzKHtcbiAgdXBkYXRlX2ZpbHRlcnM6IGZ1bmN0aW9uKGxpc3R2aWV3X2lkLCBmaWx0ZXJzLCBmaWx0ZXJfc2NvcGUsIGZpbHRlcl9sb2dpYykge1xuICAgIHJldHVybiBDcmVhdG9yLkNvbGxlY3Rpb25zLm9iamVjdF9saXN0dmlld3MuZGlyZWN0LnVwZGF0ZSh7XG4gICAgICBfaWQ6IGxpc3R2aWV3X2lkXG4gICAgfSwge1xuICAgICAgJHNldDoge1xuICAgICAgICBmaWx0ZXJzOiBmaWx0ZXJzLFxuICAgICAgICBmaWx0ZXJfc2NvcGU6IGZpbHRlcl9zY29wZSxcbiAgICAgICAgZmlsdGVyX2xvZ2ljOiBmaWx0ZXJfbG9naWNcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbiAgdXBkYXRlX2NvbHVtbnM6IGZ1bmN0aW9uKGxpc3R2aWV3X2lkLCBjb2x1bW5zKSB7XG4gICAgY2hlY2soY29sdW1ucywgQXJyYXkpO1xuICAgIGlmIChjb2x1bW5zLmxlbmd0aCA8IDEpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAwLCBcIlNlbGVjdCBhdCBsZWFzdCBvbmUgZmllbGQgdG8gZGlzcGxheVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIENyZWF0b3IuQ29sbGVjdGlvbnMub2JqZWN0X2xpc3R2aWV3cy51cGRhdGUoe1xuICAgICAgX2lkOiBsaXN0dmlld19pZFxuICAgIH0sIHtcbiAgICAgICRzZXQ6IHtcbiAgICAgICAgY29sdW1uczogY29sdW1uc1xuICAgICAgfVxuICAgIH0pO1xuICB9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzXHJcblx0J3JlcG9ydF9kYXRhJzogKG9wdGlvbnMpLT5cclxuXHRcdGNoZWNrKG9wdGlvbnMsIE9iamVjdClcclxuXHRcdHNwYWNlID0gb3B0aW9ucy5zcGFjZVxyXG5cdFx0ZmllbGRzID0gb3B0aW9ucy5maWVsZHNcclxuXHRcdG9iamVjdF9uYW1lID0gb3B0aW9ucy5vYmplY3RfbmFtZVxyXG5cdFx0ZmlsdGVyX3Njb3BlID0gb3B0aW9ucy5maWx0ZXJfc2NvcGVcclxuXHRcdGZpbHRlcnMgPSBvcHRpb25zLmZpbHRlcnNcclxuXHRcdGZpbHRlckZpZWxkcyA9IHt9XHJcblx0XHRjb21wb3VuZEZpZWxkcyA9IFtdXHJcblx0XHRvYmplY3RGaWVsZHMgPSBDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSk/LmZpZWxkc1xyXG5cdFx0Xy5lYWNoIGZpZWxkcywgKGl0ZW0sIGluZGV4KS0+XHJcblx0XHRcdHNwbGl0cyA9IGl0ZW0uc3BsaXQoXCIuXCIpXHJcblx0XHRcdG5hbWUgPSBzcGxpdHNbMF1cclxuXHRcdFx0b2JqZWN0RmllbGQgPSBvYmplY3RGaWVsZHNbbmFtZV1cclxuXHRcdFx0aWYgc3BsaXRzLmxlbmd0aCA+IDEgYW5kIG9iamVjdEZpZWxkXHJcblx0XHRcdFx0Y2hpbGRLZXkgPSBpdGVtLnJlcGxhY2UgbmFtZSArIFwiLlwiLCBcIlwiXHJcblx0XHRcdFx0Y29tcG91bmRGaWVsZHMucHVzaCh7bmFtZTogbmFtZSwgY2hpbGRLZXk6IGNoaWxkS2V5LCBmaWVsZDogb2JqZWN0RmllbGR9KVxyXG5cdFx0XHRmaWx0ZXJGaWVsZHNbbmFtZV0gPSAxXHJcblxyXG5cdFx0c2VsZWN0b3IgPSB7fVxyXG5cdFx0dXNlcklkID0gdGhpcy51c2VySWRcclxuXHRcdHNlbGVjdG9yLnNwYWNlID0gc3BhY2VcclxuXHRcdGlmIGZpbHRlcl9zY29wZSA9PSBcInNwYWNleFwiXHJcblx0XHRcdHNlbGVjdG9yLnNwYWNlID0gXHJcblx0XHRcdFx0JGluOiBbbnVsbCxzcGFjZV1cclxuXHRcdGVsc2UgaWYgZmlsdGVyX3Njb3BlID09IFwibWluZVwiXHJcblx0XHRcdHNlbGVjdG9yLm93bmVyID0gdXNlcklkXHJcblxyXG5cdFx0aWYgQ3JlYXRvci5pc0NvbW1vblNwYWNlKHNwYWNlKSAmJiBDcmVhdG9yLmlzU3BhY2VBZG1pbihzcGFjZSwgQHVzZXJJZClcclxuXHRcdFx0ZGVsZXRlIHNlbGVjdG9yLnNwYWNlXHJcblxyXG5cdFx0aWYgZmlsdGVycyBhbmQgZmlsdGVycy5sZW5ndGggPiAwXHJcblx0XHRcdHNlbGVjdG9yW1wiJGFuZFwiXSA9IGZpbHRlcnNcclxuXHJcblx0XHRjdXJzb3IgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqZWN0X25hbWUpLmZpbmQoc2VsZWN0b3IsIHtmaWVsZHM6IGZpbHRlckZpZWxkcywgc2tpcDogMCwgbGltaXQ6IDEwMDAwfSlcclxuI1x0XHRpZiBjdXJzb3IuY291bnQoKSA+IDEwMDAwXHJcbiNcdFx0XHRyZXR1cm4gW11cclxuXHRcdHJlc3VsdCA9IGN1cnNvci5mZXRjaCgpXHJcblx0XHRpZiBjb21wb3VuZEZpZWxkcy5sZW5ndGhcclxuXHRcdFx0cmVzdWx0ID0gcmVzdWx0Lm1hcCAoaXRlbSxpbmRleCktPlxyXG5cdFx0XHRcdF8uZWFjaCBjb21wb3VuZEZpZWxkcywgKGNvbXBvdW5kRmllbGRJdGVtLCBpbmRleCktPlxyXG5cdFx0XHRcdFx0aXRlbUtleSA9IGNvbXBvdW5kRmllbGRJdGVtLm5hbWUgKyBcIiolKlwiICsgY29tcG91bmRGaWVsZEl0ZW0uY2hpbGRLZXkucmVwbGFjZSgvXFwuL2csIFwiKiUqXCIpXHJcblx0XHRcdFx0XHRpdGVtVmFsdWUgPSBpdGVtW2NvbXBvdW5kRmllbGRJdGVtLm5hbWVdXHJcblx0XHRcdFx0XHR0eXBlID0gY29tcG91bmRGaWVsZEl0ZW0uZmllbGQudHlwZVxyXG5cdFx0XHRcdFx0aWYgW1wibG9va3VwXCIsIFwibWFzdGVyX2RldGFpbFwiXS5pbmRleE9mKHR5cGUpID4gLTFcclxuXHRcdFx0XHRcdFx0cmVmZXJlbmNlX3RvID0gY29tcG91bmRGaWVsZEl0ZW0uZmllbGQucmVmZXJlbmNlX3RvXHJcblx0XHRcdFx0XHRcdGNvbXBvdW5kRmlsdGVyRmllbGRzID0ge31cclxuXHRcdFx0XHRcdFx0Y29tcG91bmRGaWx0ZXJGaWVsZHNbY29tcG91bmRGaWVsZEl0ZW0uY2hpbGRLZXldID0gMVxyXG5cdFx0XHRcdFx0XHRyZWZlcmVuY2VJdGVtID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKHJlZmVyZW5jZV90bykuZmluZE9uZSB7X2lkOiBpdGVtVmFsdWV9LCBmaWVsZHM6IGNvbXBvdW5kRmlsdGVyRmllbGRzXHJcblx0XHRcdFx0XHRcdGlmIHJlZmVyZW5jZUl0ZW1cclxuXHRcdFx0XHRcdFx0XHRpdGVtW2l0ZW1LZXldID0gcmVmZXJlbmNlSXRlbVtjb21wb3VuZEZpZWxkSXRlbS5jaGlsZEtleV1cclxuXHRcdFx0XHRcdGVsc2UgaWYgdHlwZSA9PSBcInNlbGVjdFwiXHJcblx0XHRcdFx0XHRcdG9wdGlvbnMgPSBjb21wb3VuZEZpZWxkSXRlbS5maWVsZC5vcHRpb25zXHJcblx0XHRcdFx0XHRcdGl0ZW1baXRlbUtleV0gPSBfLmZpbmRXaGVyZShvcHRpb25zLCB7dmFsdWU6IGl0ZW1WYWx1ZX0pPy5sYWJlbCBvciBpdGVtVmFsdWVcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0aXRlbVtpdGVtS2V5XSA9IGl0ZW1WYWx1ZVxyXG5cdFx0XHRcdFx0dW5sZXNzIGl0ZW1baXRlbUtleV1cclxuXHRcdFx0XHRcdFx0aXRlbVtpdGVtS2V5XSA9IFwiLS1cIlxyXG5cdFx0XHRcdHJldHVybiBpdGVtXHJcblx0XHRcdHJldHVybiByZXN1bHRcclxuXHRcdGVsc2VcclxuXHRcdFx0cmV0dXJuIHJlc3VsdFxyXG5cclxuIiwiTWV0ZW9yLm1ldGhvZHMoe1xuICAncmVwb3J0X2RhdGEnOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGNvbXBvdW5kRmllbGRzLCBjdXJzb3IsIGZpZWxkcywgZmlsdGVyRmllbGRzLCBmaWx0ZXJfc2NvcGUsIGZpbHRlcnMsIG9iamVjdEZpZWxkcywgb2JqZWN0X25hbWUsIHJlZiwgcmVzdWx0LCBzZWxlY3Rvciwgc3BhY2UsIHVzZXJJZDtcbiAgICBjaGVjayhvcHRpb25zLCBPYmplY3QpO1xuICAgIHNwYWNlID0gb3B0aW9ucy5zcGFjZTtcbiAgICBmaWVsZHMgPSBvcHRpb25zLmZpZWxkcztcbiAgICBvYmplY3RfbmFtZSA9IG9wdGlvbnMub2JqZWN0X25hbWU7XG4gICAgZmlsdGVyX3Njb3BlID0gb3B0aW9ucy5maWx0ZXJfc2NvcGU7XG4gICAgZmlsdGVycyA9IG9wdGlvbnMuZmlsdGVycztcbiAgICBmaWx0ZXJGaWVsZHMgPSB7fTtcbiAgICBjb21wb3VuZEZpZWxkcyA9IFtdO1xuICAgIG9iamVjdEZpZWxkcyA9IChyZWYgPSBDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSkpICE9IG51bGwgPyByZWYuZmllbGRzIDogdm9pZCAwO1xuICAgIF8uZWFjaChmaWVsZHMsIGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICB2YXIgY2hpbGRLZXksIG5hbWUsIG9iamVjdEZpZWxkLCBzcGxpdHM7XG4gICAgICBzcGxpdHMgPSBpdGVtLnNwbGl0KFwiLlwiKTtcbiAgICAgIG5hbWUgPSBzcGxpdHNbMF07XG4gICAgICBvYmplY3RGaWVsZCA9IG9iamVjdEZpZWxkc1tuYW1lXTtcbiAgICAgIGlmIChzcGxpdHMubGVuZ3RoID4gMSAmJiBvYmplY3RGaWVsZCkge1xuICAgICAgICBjaGlsZEtleSA9IGl0ZW0ucmVwbGFjZShuYW1lICsgXCIuXCIsIFwiXCIpO1xuICAgICAgICBjb21wb3VuZEZpZWxkcy5wdXNoKHtcbiAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgIGNoaWxkS2V5OiBjaGlsZEtleSxcbiAgICAgICAgICBmaWVsZDogb2JqZWN0RmllbGRcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmlsdGVyRmllbGRzW25hbWVdID0gMTtcbiAgICB9KTtcbiAgICBzZWxlY3RvciA9IHt9O1xuICAgIHVzZXJJZCA9IHRoaXMudXNlcklkO1xuICAgIHNlbGVjdG9yLnNwYWNlID0gc3BhY2U7XG4gICAgaWYgKGZpbHRlcl9zY29wZSA9PT0gXCJzcGFjZXhcIikge1xuICAgICAgc2VsZWN0b3Iuc3BhY2UgPSB7XG4gICAgICAgICRpbjogW251bGwsIHNwYWNlXVxuICAgICAgfTtcbiAgICB9IGVsc2UgaWYgKGZpbHRlcl9zY29wZSA9PT0gXCJtaW5lXCIpIHtcbiAgICAgIHNlbGVjdG9yLm93bmVyID0gdXNlcklkO1xuICAgIH1cbiAgICBpZiAoQ3JlYXRvci5pc0NvbW1vblNwYWNlKHNwYWNlKSAmJiBDcmVhdG9yLmlzU3BhY2VBZG1pbihzcGFjZSwgdGhpcy51c2VySWQpKSB7XG4gICAgICBkZWxldGUgc2VsZWN0b3Iuc3BhY2U7XG4gICAgfVxuICAgIGlmIChmaWx0ZXJzICYmIGZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgc2VsZWN0b3JbXCIkYW5kXCJdID0gZmlsdGVycztcbiAgICB9XG4gICAgY3Vyc29yID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKG9iamVjdF9uYW1lKS5maW5kKHNlbGVjdG9yLCB7XG4gICAgICBmaWVsZHM6IGZpbHRlckZpZWxkcyxcbiAgICAgIHNraXA6IDAsXG4gICAgICBsaW1pdDogMTAwMDBcbiAgICB9KTtcbiAgICByZXN1bHQgPSBjdXJzb3IuZmV0Y2goKTtcbiAgICBpZiAoY29tcG91bmRGaWVsZHMubGVuZ3RoKSB7XG4gICAgICByZXN1bHQgPSByZXN1bHQubWFwKGZ1bmN0aW9uKGl0ZW0sIGluZGV4KSB7XG4gICAgICAgIF8uZWFjaChjb21wb3VuZEZpZWxkcywgZnVuY3Rpb24oY29tcG91bmRGaWVsZEl0ZW0sIGluZGV4KSB7XG4gICAgICAgICAgdmFyIGNvbXBvdW5kRmlsdGVyRmllbGRzLCBpdGVtS2V5LCBpdGVtVmFsdWUsIHJlZjEsIHJlZmVyZW5jZUl0ZW0sIHJlZmVyZW5jZV90bywgdHlwZTtcbiAgICAgICAgICBpdGVtS2V5ID0gY29tcG91bmRGaWVsZEl0ZW0ubmFtZSArIFwiKiUqXCIgKyBjb21wb3VuZEZpZWxkSXRlbS5jaGlsZEtleS5yZXBsYWNlKC9cXC4vZywgXCIqJSpcIik7XG4gICAgICAgICAgaXRlbVZhbHVlID0gaXRlbVtjb21wb3VuZEZpZWxkSXRlbS5uYW1lXTtcbiAgICAgICAgICB0eXBlID0gY29tcG91bmRGaWVsZEl0ZW0uZmllbGQudHlwZTtcbiAgICAgICAgICBpZiAoW1wibG9va3VwXCIsIFwibWFzdGVyX2RldGFpbFwiXS5pbmRleE9mKHR5cGUpID4gLTEpIHtcbiAgICAgICAgICAgIHJlZmVyZW5jZV90byA9IGNvbXBvdW5kRmllbGRJdGVtLmZpZWxkLnJlZmVyZW5jZV90bztcbiAgICAgICAgICAgIGNvbXBvdW5kRmlsdGVyRmllbGRzID0ge307XG4gICAgICAgICAgICBjb21wb3VuZEZpbHRlckZpZWxkc1tjb21wb3VuZEZpZWxkSXRlbS5jaGlsZEtleV0gPSAxO1xuICAgICAgICAgICAgcmVmZXJlbmNlSXRlbSA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihyZWZlcmVuY2VfdG8pLmZpbmRPbmUoe1xuICAgICAgICAgICAgICBfaWQ6IGl0ZW1WYWx1ZVxuICAgICAgICAgICAgfSwge1xuICAgICAgICAgICAgICBmaWVsZHM6IGNvbXBvdW5kRmlsdGVyRmllbGRzXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmIChyZWZlcmVuY2VJdGVtKSB7XG4gICAgICAgICAgICAgIGl0ZW1baXRlbUtleV0gPSByZWZlcmVuY2VJdGVtW2NvbXBvdW5kRmllbGRJdGVtLmNoaWxkS2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwic2VsZWN0XCIpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBjb21wb3VuZEZpZWxkSXRlbS5maWVsZC5vcHRpb25zO1xuICAgICAgICAgICAgaXRlbVtpdGVtS2V5XSA9ICgocmVmMSA9IF8uZmluZFdoZXJlKG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgdmFsdWU6IGl0ZW1WYWx1ZVxuICAgICAgICAgICAgfSkpICE9IG51bGwgPyByZWYxLmxhYmVsIDogdm9pZCAwKSB8fCBpdGVtVmFsdWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGl0ZW1baXRlbUtleV0gPSBpdGVtVmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICghaXRlbVtpdGVtS2V5XSkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZW1baXRlbUtleV0gPSBcIi0tXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICB9XG59KTtcbiIsIiMjI1xyXG4gICAgdHlwZTogXCJ1c2VyXCJcclxuICAgIG9iamVjdF9uYW1lOiBcIm9iamVjdF9saXN0dmlld3NcIlxyXG4gICAgcmVjb3JkX2lkOiBcIntvYmplY3RfbmFtZX0se2xpc3R2aWV3X2lkfVwiXHJcbiAgICBzZXR0aW5nczpcclxuICAgICAgICBjb2x1bW5fd2lkdGg6IHsgZmllbGRfYTogMTAwLCBmaWVsZF8yOiAxNTAgfVxyXG4gICAgICAgIHNvcnQ6IFtbXCJmaWVsZF9hXCIsIFwiZGVzY1wiXV1cclxuICAgIG93bmVyOiB7dXNlcklkfVxyXG4jIyNcclxuXHJcbk1ldGVvci5tZXRob2RzXHJcbiAgICBcInRhYnVsYXJfc29ydF9zZXR0aW5nc1wiOiAob2JqZWN0X25hbWUsIGxpc3Rfdmlld19pZCwgc29ydCktPlxyXG4gICAgICAgIHVzZXJJZCA9IHRoaXMudXNlcklkXHJcbiAgICAgICAgc2V0dGluZyA9IENyZWF0b3IuQ29sbGVjdGlvbnMuc2V0dGluZ3MuZmluZE9uZSh7b2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLCByZWNvcmRfaWQ6IFwib2JqZWN0X2xpc3R2aWV3c1wiLCBvd25lcjogdXNlcklkfSlcclxuICAgICAgICBpZiBzZXR0aW5nXHJcbiAgICAgICAgICAgIENyZWF0b3IuQ29sbGVjdGlvbnMuc2V0dGluZ3MudXBkYXRlKHtfaWQ6IHNldHRpbmcuX2lkfSwgeyRzZXQ6IHtcInNldHRpbmdzLiN7bGlzdF92aWV3X2lkfS5zb3J0XCI6IHNvcnR9fSlcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGRvYyA9IFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJ1c2VyXCJcclxuICAgICAgICAgICAgICAgIG9iamVjdF9uYW1lOiBvYmplY3RfbmFtZVxyXG4gICAgICAgICAgICAgICAgcmVjb3JkX2lkOiBcIm9iamVjdF9saXN0dmlld3NcIlxyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHt9XHJcbiAgICAgICAgICAgICAgICBvd25lcjogdXNlcklkXHJcblxyXG4gICAgICAgICAgICBkb2Muc2V0dGluZ3NbbGlzdF92aWV3X2lkXSA9IHt9XHJcbiAgICAgICAgICAgIGRvYy5zZXR0aW5nc1tsaXN0X3ZpZXdfaWRdLnNvcnQgPSBzb3J0XHJcblxyXG4gICAgICAgICAgICBDcmVhdG9yLkNvbGxlY3Rpb25zLnNldHRpbmdzLmluc2VydChkb2MpXHJcblxyXG4gICAgXCJ0YWJ1bGFyX2NvbHVtbl93aWR0aF9zZXR0aW5nc1wiOiAob2JqZWN0X25hbWUsIGxpc3Rfdmlld19pZCwgY29sdW1uX3dpZHRoKS0+XHJcbiAgICAgICAgdXNlcklkID0gdGhpcy51c2VySWRcclxuICAgICAgICBzZXR0aW5nID0gQ3JlYXRvci5Db2xsZWN0aW9ucy5zZXR0aW5ncy5maW5kT25lKHtvYmplY3RfbmFtZTogb2JqZWN0X25hbWUsIHJlY29yZF9pZDogXCJvYmplY3RfbGlzdHZpZXdzXCIsIG93bmVyOiB1c2VySWR9KVxyXG4gICAgICAgIGlmIHNldHRpbmdcclxuICAgICAgICAgICAgQ3JlYXRvci5Db2xsZWN0aW9ucy5zZXR0aW5ncy51cGRhdGUoe19pZDogc2V0dGluZy5faWR9LCB7JHNldDoge1wic2V0dGluZ3MuI3tsaXN0X3ZpZXdfaWR9LmNvbHVtbl93aWR0aFwiOiBjb2x1bW5fd2lkdGh9fSlcclxuICAgICAgICBlbHNlXHJcbiAgICAgICAgICAgIGRvYyA9IFxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJ1c2VyXCJcclxuICAgICAgICAgICAgICAgIG9iamVjdF9uYW1lOiBvYmplY3RfbmFtZVxyXG4gICAgICAgICAgICAgICAgcmVjb3JkX2lkOiBcIm9iamVjdF9saXN0dmlld3NcIlxyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHt9XHJcbiAgICAgICAgICAgICAgICBvd25lcjogdXNlcklkXHJcblxyXG4gICAgICAgICAgICBkb2Muc2V0dGluZ3NbbGlzdF92aWV3X2lkXSA9IHt9XHJcbiAgICAgICAgICAgIGRvYy5zZXR0aW5nc1tsaXN0X3ZpZXdfaWRdLmNvbHVtbl93aWR0aCA9IGNvbHVtbl93aWR0aFxyXG5cclxuICAgICAgICAgICAgQ3JlYXRvci5Db2xsZWN0aW9ucy5zZXR0aW5ncy5pbnNlcnQoZG9jKVxyXG5cclxuICAgIFwiZ3JpZF9zZXR0aW5nc1wiOiAob2JqZWN0X25hbWUsIGxpc3Rfdmlld19pZCwgY29sdW1uX3dpZHRoLCBzb3J0KS0+XHJcbiAgICAgICAgdXNlcklkID0gdGhpcy51c2VySWRcclxuICAgICAgICBzZXR0aW5nID0gQ3JlYXRvci5Db2xsZWN0aW9ucy5zZXR0aW5ncy5maW5kT25lKHtvYmplY3RfbmFtZTogb2JqZWN0X25hbWUsIHJlY29yZF9pZDogXCJvYmplY3RfZ3JpZHZpZXdzXCIsIG93bmVyOiB1c2VySWR9KVxyXG4gICAgICAgIGlmIHNldHRpbmdcclxuICAgICAgICAgICAgIyDmr4/mrKHpg73lvLrliLbmlLnlj5hfaWRfYWN0aW9uc+WIl+eahOWuveW6pu+8jOS7peino+WGs+W9k+eUqOaIt+WPquaUueWPmOWtl+auteasoeW6j+iAjOayoeacieaUueWPmOS7u+S9leWtl+auteWuveW6puaXtu+8jOWJjeerr+ayoeacieiuoumYheWIsOWtl+auteasoeW6j+WPmOabtOeahOaVsOaNrueahOmXrumimFxyXG4gICAgICAgICAgICBjb2x1bW5fd2lkdGguX2lkX2FjdGlvbnMgPSBpZiBzZXR0aW5nLnNldHRpbmdzW1wiI3tsaXN0X3ZpZXdfaWR9XCJdPy5jb2x1bW5fd2lkdGg/Ll9pZF9hY3Rpb25zID09IDQ2IHRoZW4gNDcgZWxzZSA0NlxyXG4gICAgICAgICAgICBpZiBzb3J0XHJcbiAgICAgICAgICAgICAgICBDcmVhdG9yLkNvbGxlY3Rpb25zLnNldHRpbmdzLnVwZGF0ZSh7X2lkOiBzZXR0aW5nLl9pZH0sIHskc2V0OiB7XCJzZXR0aW5ncy4je2xpc3Rfdmlld19pZH0uc29ydFwiOiBzb3J0LCBcInNldHRpbmdzLiN7bGlzdF92aWV3X2lkfS5jb2x1bW5fd2lkdGhcIjogY29sdW1uX3dpZHRofX0pXHJcbiAgICAgICAgICAgIGVsc2VcclxuICAgICAgICAgICAgICAgIENyZWF0b3IuQ29sbGVjdGlvbnMuc2V0dGluZ3MudXBkYXRlKHtfaWQ6IHNldHRpbmcuX2lkfSwgeyRzZXQ6IHtcInNldHRpbmdzLiN7bGlzdF92aWV3X2lkfS5jb2x1bW5fd2lkdGhcIjogY29sdW1uX3dpZHRofX0pXHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBkb2MgPVxyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJ1c2VyXCJcclxuICAgICAgICAgICAgICAgIG9iamVjdF9uYW1lOiBvYmplY3RfbmFtZVxyXG4gICAgICAgICAgICAgICAgcmVjb3JkX2lkOiBcIm9iamVjdF9ncmlkdmlld3NcIlxyXG4gICAgICAgICAgICAgICAgc2V0dGluZ3M6IHt9XHJcbiAgICAgICAgICAgICAgICBvd25lcjogdXNlcklkXHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBkb2Muc2V0dGluZ3NbbGlzdF92aWV3X2lkXSA9IHt9XHJcbiAgICAgICAgICAgIGRvYy5zZXR0aW5nc1tsaXN0X3ZpZXdfaWRdLmNvbHVtbl93aWR0aCA9IGNvbHVtbl93aWR0aFxyXG4gICAgICAgICAgICBkb2Muc2V0dGluZ3NbbGlzdF92aWV3X2lkXS5zb3J0ID0gc29ydFxyXG5cclxuICAgICAgICAgICAgQ3JlYXRvci5Db2xsZWN0aW9ucy5zZXR0aW5ncy5pbnNlcnQoZG9jKSIsIlxuLypcbiAgICB0eXBlOiBcInVzZXJcIlxuICAgIG9iamVjdF9uYW1lOiBcIm9iamVjdF9saXN0dmlld3NcIlxuICAgIHJlY29yZF9pZDogXCJ7b2JqZWN0X25hbWV9LHtsaXN0dmlld19pZH1cIlxuICAgIHNldHRpbmdzOlxuICAgICAgICBjb2x1bW5fd2lkdGg6IHsgZmllbGRfYTogMTAwLCBmaWVsZF8yOiAxNTAgfVxuICAgICAgICBzb3J0OiBbW1wiZmllbGRfYVwiLCBcImRlc2NcIl1dXG4gICAgb3duZXI6IHt1c2VySWR9XG4gKi9cbk1ldGVvci5tZXRob2RzKHtcbiAgXCJ0YWJ1bGFyX3NvcnRfc2V0dGluZ3NcIjogZnVuY3Rpb24ob2JqZWN0X25hbWUsIGxpc3Rfdmlld19pZCwgc29ydCkge1xuICAgIHZhciBkb2MsIG9iaiwgc2V0dGluZywgdXNlcklkO1xuICAgIHVzZXJJZCA9IHRoaXMudXNlcklkO1xuICAgIHNldHRpbmcgPSBDcmVhdG9yLkNvbGxlY3Rpb25zLnNldHRpbmdzLmZpbmRPbmUoe1xuICAgICAgb2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLFxuICAgICAgcmVjb3JkX2lkOiBcIm9iamVjdF9saXN0dmlld3NcIixcbiAgICAgIG93bmVyOiB1c2VySWRcbiAgICB9KTtcbiAgICBpZiAoc2V0dGluZykge1xuICAgICAgcmV0dXJuIENyZWF0b3IuQ29sbGVjdGlvbnMuc2V0dGluZ3MudXBkYXRlKHtcbiAgICAgICAgX2lkOiBzZXR0aW5nLl9pZFxuICAgICAgfSwge1xuICAgICAgICAkc2V0OiAoXG4gICAgICAgICAgb2JqID0ge30sXG4gICAgICAgICAgb2JqW1wic2V0dGluZ3MuXCIgKyBsaXN0X3ZpZXdfaWQgKyBcIi5zb3J0XCJdID0gc29ydCxcbiAgICAgICAgICBvYmpcbiAgICAgICAgKVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRvYyA9IHtcbiAgICAgICAgdHlwZTogXCJ1c2VyXCIsXG4gICAgICAgIG9iamVjdF9uYW1lOiBvYmplY3RfbmFtZSxcbiAgICAgICAgcmVjb3JkX2lkOiBcIm9iamVjdF9saXN0dmlld3NcIixcbiAgICAgICAgc2V0dGluZ3M6IHt9LFxuICAgICAgICBvd25lcjogdXNlcklkXG4gICAgICB9O1xuICAgICAgZG9jLnNldHRpbmdzW2xpc3Rfdmlld19pZF0gPSB7fTtcbiAgICAgIGRvYy5zZXR0aW5nc1tsaXN0X3ZpZXdfaWRdLnNvcnQgPSBzb3J0O1xuICAgICAgcmV0dXJuIENyZWF0b3IuQ29sbGVjdGlvbnMuc2V0dGluZ3MuaW5zZXJ0KGRvYyk7XG4gICAgfVxuICB9LFxuICBcInRhYnVsYXJfY29sdW1uX3dpZHRoX3NldHRpbmdzXCI6IGZ1bmN0aW9uKG9iamVjdF9uYW1lLCBsaXN0X3ZpZXdfaWQsIGNvbHVtbl93aWR0aCkge1xuICAgIHZhciBkb2MsIG9iaiwgc2V0dGluZywgdXNlcklkO1xuICAgIHVzZXJJZCA9IHRoaXMudXNlcklkO1xuICAgIHNldHRpbmcgPSBDcmVhdG9yLkNvbGxlY3Rpb25zLnNldHRpbmdzLmZpbmRPbmUoe1xuICAgICAgb2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLFxuICAgICAgcmVjb3JkX2lkOiBcIm9iamVjdF9saXN0dmlld3NcIixcbiAgICAgIG93bmVyOiB1c2VySWRcbiAgICB9KTtcbiAgICBpZiAoc2V0dGluZykge1xuICAgICAgcmV0dXJuIENyZWF0b3IuQ29sbGVjdGlvbnMuc2V0dGluZ3MudXBkYXRlKHtcbiAgICAgICAgX2lkOiBzZXR0aW5nLl9pZFxuICAgICAgfSwge1xuICAgICAgICAkc2V0OiAoXG4gICAgICAgICAgb2JqID0ge30sXG4gICAgICAgICAgb2JqW1wic2V0dGluZ3MuXCIgKyBsaXN0X3ZpZXdfaWQgKyBcIi5jb2x1bW5fd2lkdGhcIl0gPSBjb2x1bW5fd2lkdGgsXG4gICAgICAgICAgb2JqXG4gICAgICAgIClcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBkb2MgPSB7XG4gICAgICAgIHR5cGU6IFwidXNlclwiLFxuICAgICAgICBvYmplY3RfbmFtZTogb2JqZWN0X25hbWUsXG4gICAgICAgIHJlY29yZF9pZDogXCJvYmplY3RfbGlzdHZpZXdzXCIsXG4gICAgICAgIHNldHRpbmdzOiB7fSxcbiAgICAgICAgb3duZXI6IHVzZXJJZFxuICAgICAgfTtcbiAgICAgIGRvYy5zZXR0aW5nc1tsaXN0X3ZpZXdfaWRdID0ge307XG4gICAgICBkb2Muc2V0dGluZ3NbbGlzdF92aWV3X2lkXS5jb2x1bW5fd2lkdGggPSBjb2x1bW5fd2lkdGg7XG4gICAgICByZXR1cm4gQ3JlYXRvci5Db2xsZWN0aW9ucy5zZXR0aW5ncy5pbnNlcnQoZG9jKTtcbiAgICB9XG4gIH0sXG4gIFwiZ3JpZF9zZXR0aW5nc1wiOiBmdW5jdGlvbihvYmplY3RfbmFtZSwgbGlzdF92aWV3X2lkLCBjb2x1bW5fd2lkdGgsIHNvcnQpIHtcbiAgICB2YXIgZG9jLCBvYmosIG9iajEsIHJlZiwgcmVmMSwgc2V0dGluZywgdXNlcklkO1xuICAgIHVzZXJJZCA9IHRoaXMudXNlcklkO1xuICAgIHNldHRpbmcgPSBDcmVhdG9yLkNvbGxlY3Rpb25zLnNldHRpbmdzLmZpbmRPbmUoe1xuICAgICAgb2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLFxuICAgICAgcmVjb3JkX2lkOiBcIm9iamVjdF9ncmlkdmlld3NcIixcbiAgICAgIG93bmVyOiB1c2VySWRcbiAgICB9KTtcbiAgICBpZiAoc2V0dGluZykge1xuICAgICAgY29sdW1uX3dpZHRoLl9pZF9hY3Rpb25zID0gKChyZWYgPSBzZXR0aW5nLnNldHRpbmdzW1wiXCIgKyBsaXN0X3ZpZXdfaWRdKSAhPSBudWxsID8gKHJlZjEgPSByZWYuY29sdW1uX3dpZHRoKSAhPSBudWxsID8gcmVmMS5faWRfYWN0aW9ucyA6IHZvaWQgMCA6IHZvaWQgMCkgPT09IDQ2ID8gNDcgOiA0NjtcbiAgICAgIGlmIChzb3J0KSB7XG4gICAgICAgIHJldHVybiBDcmVhdG9yLkNvbGxlY3Rpb25zLnNldHRpbmdzLnVwZGF0ZSh7XG4gICAgICAgICAgX2lkOiBzZXR0aW5nLl9pZFxuICAgICAgICB9LCB7XG4gICAgICAgICAgJHNldDogKFxuICAgICAgICAgICAgb2JqID0ge30sXG4gICAgICAgICAgICBvYmpbXCJzZXR0aW5ncy5cIiArIGxpc3Rfdmlld19pZCArIFwiLnNvcnRcIl0gPSBzb3J0LFxuICAgICAgICAgICAgb2JqW1wic2V0dGluZ3MuXCIgKyBsaXN0X3ZpZXdfaWQgKyBcIi5jb2x1bW5fd2lkdGhcIl0gPSBjb2x1bW5fd2lkdGgsXG4gICAgICAgICAgICBvYmpcbiAgICAgICAgICApXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIENyZWF0b3IuQ29sbGVjdGlvbnMuc2V0dGluZ3MudXBkYXRlKHtcbiAgICAgICAgICBfaWQ6IHNldHRpbmcuX2lkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAkc2V0OiAoXG4gICAgICAgICAgICBvYmoxID0ge30sXG4gICAgICAgICAgICBvYmoxW1wic2V0dGluZ3MuXCIgKyBsaXN0X3ZpZXdfaWQgKyBcIi5jb2x1bW5fd2lkdGhcIl0gPSBjb2x1bW5fd2lkdGgsXG4gICAgICAgICAgICBvYmoxXG4gICAgICAgICAgKVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZG9jID0ge1xuICAgICAgICB0eXBlOiBcInVzZXJcIixcbiAgICAgICAgb2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLFxuICAgICAgICByZWNvcmRfaWQ6IFwib2JqZWN0X2dyaWR2aWV3c1wiLFxuICAgICAgICBzZXR0aW5nczoge30sXG4gICAgICAgIG93bmVyOiB1c2VySWRcbiAgICAgIH07XG4gICAgICBkb2Muc2V0dGluZ3NbbGlzdF92aWV3X2lkXSA9IHt9O1xuICAgICAgZG9jLnNldHRpbmdzW2xpc3Rfdmlld19pZF0uY29sdW1uX3dpZHRoID0gY29sdW1uX3dpZHRoO1xuICAgICAgZG9jLnNldHRpbmdzW2xpc3Rfdmlld19pZF0uc29ydCA9IHNvcnQ7XG4gICAgICByZXR1cm4gQ3JlYXRvci5Db2xsZWN0aW9ucy5zZXR0aW5ncy5pbnNlcnQoZG9jKTtcbiAgICB9XG4gIH1cbn0pO1xuIiwieG1sMmpzID0gcmVxdWlyZSAneG1sMmpzJ1xyXG5mcyA9IHJlcXVpcmUgJ2ZzJ1xyXG5wYXRoID0gcmVxdWlyZSAncGF0aCdcclxubWtkaXJwID0gcmVxdWlyZSAnbWtkaXJwJ1xyXG5cclxubG9nZ2VyID0gbmV3IExvZ2dlciAnRXhwb3J0X1RPX1hNTCdcclxuXHJcbl93cml0ZVhtbEZpbGUgPSAoanNvbk9iaixvYmpOYW1lKSAtPlxyXG5cdCMg6L2seG1sXHJcblx0YnVpbGRlciA9IG5ldyB4bWwyanMuQnVpbGRlcigpXHJcblx0eG1sID0gYnVpbGRlci5idWlsZE9iamVjdCBqc29uT2JqXHJcblxyXG5cdCMg6L2s5Li6YnVmZmVyXHJcblx0c3RyZWFtID0gbmV3IEJ1ZmZlciB4bWxcclxuXHJcblx0IyDmoLnmja7lvZPlpKnml7bpl7TnmoTlubTmnIjml6XkvZzkuLrlrZjlgqjot6/lvoRcclxuXHRub3cgPSBuZXcgRGF0ZVxyXG5cdHllYXIgPSBub3cuZ2V0RnVsbFllYXIoKVxyXG5cdG1vbnRoID0gbm93LmdldE1vbnRoKCkgKyAxXHJcblx0ZGF5ID0gbm93LmdldERhdGUoKVxyXG5cclxuXHQjIOaWh+S7tui3r+W+hFxyXG5cdGZpbGVQYXRoID0gcGF0aC5qb2luKF9fbWV0ZW9yX2Jvb3RzdHJhcF9fLnNlcnZlckRpciwnLi4vLi4vLi4vZXhwb3J0LycgKyB5ZWFyICsgJy8nICsgbW9udGggKyAnLycgKyBkYXkgKyAnLycgKyBvYmpOYW1lIClcclxuXHRmaWxlTmFtZSA9IGpzb25PYmo/Ll9pZCArIFwiLnhtbFwiXHJcblx0ZmlsZUFkZHJlc3MgPSBwYXRoLmpvaW4gZmlsZVBhdGgsIGZpbGVOYW1lXHJcblxyXG5cdGlmICFmcy5leGlzdHNTeW5jIGZpbGVQYXRoXHJcblx0XHRta2RpcnAuc3luYyBmaWxlUGF0aFxyXG5cclxuXHQjIOWGmeWFpeaWh+S7tlxyXG5cdGZzLndyaXRlRmlsZSBmaWxlQWRkcmVzcywgc3RyZWFtLCAoZXJyKSAtPlxyXG5cdFx0aWYgZXJyXHJcblx0XHRcdGxvZ2dlci5lcnJvciBcIiN7anNvbk9iai5faWR95YaZ5YWleG1s5paH5Lu25aSx6LSlXCIsZXJyXHJcblx0XHJcblx0cmV0dXJuIGZpbGVQYXRoXHJcblxyXG5cclxuIyDmlbTnkIZGaWVsZHPnmoRqc29u5pWw5o2uXHJcbl9taXhGaWVsZHNEYXRhID0gKG9iaixvYmpOYW1lKSAtPlxyXG5cdCMg5Yid5aeL5YyW5a+56LGh5pWw5o2uXHJcblx0anNvbk9iaiA9IHt9XHJcblx0IyDojrflj5ZmaWVsZHNcclxuXHRvYmpGaWVsZHMgPSBDcmVhdG9yPy5nZXRPYmplY3Qob2JqTmFtZSk/LmZpZWxkc1xyXG5cclxuXHRtaXhEZWZhdWx0ID0gKGZpZWxkX25hbWUpLT5cclxuXHRcdGpzb25PYmpbZmllbGRfbmFtZV0gPSBvYmpbZmllbGRfbmFtZV0gfHwgXCJcIlxyXG5cclxuXHRtaXhEYXRlID0gKGZpZWxkX25hbWUsdHlwZSktPlxyXG5cdFx0ZGF0ZSA9IG9ialtmaWVsZF9uYW1lXVxyXG5cdFx0aWYgdHlwZSA9PSBcImRhdGVcIlxyXG5cdFx0XHRmb3JtYXQgPSBcIllZWVktTU0tRERcIlxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRmb3JtYXQgPSBcIllZWVktTU0tREQgSEg6bW06c3NcIlxyXG5cdFx0aWYgZGF0ZT8gYW5kIGZvcm1hdD9cclxuXHRcdFx0ZGF0ZVN0ciA9IG1vbWVudChkYXRlKS5mb3JtYXQoZm9ybWF0KVxyXG5cdFx0anNvbk9ialtmaWVsZF9uYW1lXSA9IGRhdGVTdHIgfHwgXCJcIlxyXG5cclxuXHRtaXhCb29sID0gKGZpZWxkX25hbWUpLT5cclxuXHRcdGlmIG9ialtmaWVsZF9uYW1lXSA9PSB0cnVlXHJcblx0XHRcdGpzb25PYmpbZmllbGRfbmFtZV0gPSBcIuaYr1wiXHJcblx0XHRlbHNlIGlmIG9ialtmaWVsZF9uYW1lXSA9PSBmYWxzZVxyXG5cdFx0XHRqc29uT2JqW2ZpZWxkX25hbWVdID0gXCLlkKZcIlxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRqc29uT2JqW2ZpZWxkX25hbWVdID0gXCJcIlxyXG5cclxuXHQjIOW+queOr+avj+S4qmZpZWxkcyzlubbliKTmlq3lj5blgLxcclxuXHRfLmVhY2ggb2JqRmllbGRzLCAoZmllbGQsIGZpZWxkX25hbWUpLT5cclxuXHRcdHN3aXRjaCBmaWVsZD8udHlwZVxyXG5cdFx0XHR3aGVuIFwiZGF0ZVwiLFwiZGF0ZXRpbWVcIiB0aGVuIG1peERhdGUgZmllbGRfbmFtZSxmaWVsZC50eXBlXHJcblx0XHRcdHdoZW4gXCJib29sZWFuXCIgdGhlbiBtaXhCb29sIGZpZWxkX25hbWVcclxuXHRcdFx0ZWxzZSBtaXhEZWZhdWx0IGZpZWxkX25hbWVcclxuXHJcblx0cmV0dXJuIGpzb25PYmpcclxuXHJcbiMg6I635Y+W5a2Q6KGo5pW055CG5pWw5o2uXHJcbl9taXhSZWxhdGVkRGF0YSA9IChvYmosb2JqTmFtZSkgLT5cclxuXHQjIOWIneWni+WMluWvueixoeaVsOaNrlxyXG5cdHJlbGF0ZWRfb2JqZWN0cyA9IHt9XHJcblxyXG5cdCMg6I635Y+W55u45YWz6KGoXHJcblx0cmVsYXRlZE9iak5hbWVzID0gQ3JlYXRvcj8uZ2V0QWxsUmVsYXRlZE9iamVjdHMgb2JqTmFtZVxyXG5cclxuXHQjIOW+queOr+ebuOWFs+ihqFxyXG5cdHJlbGF0ZWRPYmpOYW1lcy5mb3JFYWNoIChyZWxhdGVkT2JqTmFtZSkgLT5cclxuXHRcdCMg5q+P5Liq6KGo5a6a5LmJ5LiA5Liq5a+56LGh5pWw57uEXHJcblx0XHRyZWxhdGVkVGFibGVEYXRhID0gW11cclxuXHJcblx0XHQjICrorr7nva7lhbPogZTmkJzntKLmn6Xor6LnmoTlrZfmrrVcclxuXHRcdCMg6ZmE5Lu255qE5YWz6IGU5pCc57Si5a2X5q615piv5a6a5q2755qEXHJcblx0XHRpZiByZWxhdGVkT2JqTmFtZSA9PSBcImNtc19maWxlc1wiXHJcblx0XHRcdHJlbGF0ZWRfZmllbGRfbmFtZSA9IFwicGFyZW50Lmlkc1wiXHJcblx0XHRlbHNlXHJcblx0XHRcdCMg6I635Y+WZmllbGRzXHJcblx0XHRcdGZpZWxkcyA9IENyZWF0b3I/Lk9iamVjdHNbcmVsYXRlZE9iak5hbWVdPy5maWVsZHNcclxuXHRcdFx0IyDlvqrnjq/mr4/kuKpmaWVsZCzmib7lh7pyZWZlcmVuY2VfdG/nmoTlhbPogZTlrZfmrrVcclxuXHRcdFx0cmVsYXRlZF9maWVsZF9uYW1lID0gXCJcIlxyXG5cdFx0XHRfLmVhY2ggZmllbGRzLCAoZmllbGQsIGZpZWxkX25hbWUpLT5cclxuXHRcdFx0XHRpZiBmaWVsZD8ucmVmZXJlbmNlX3RvID09IG9iak5hbWVcclxuXHRcdFx0XHRcdHJlbGF0ZWRfZmllbGRfbmFtZSA9IGZpZWxkX25hbWVcclxuXHJcblx0XHQjIOagueaNruaJvuWHuueahOWFs+iBlOWtl+aute+8jOafpeWtkOihqOaVsOaNrlxyXG5cdFx0aWYgcmVsYXRlZF9maWVsZF9uYW1lXHJcblx0XHRcdHJlbGF0ZWRDb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKHJlbGF0ZWRPYmpOYW1lKVxyXG5cdFx0XHQjIOiOt+WPluWIsOaJgOacieeahOaVsOaNrlxyXG5cdFx0XHRyZWxhdGVkUmVjb3JkTGlzdCA9IHJlbGF0ZWRDb2xsZWN0aW9uLmZpbmQoe1wiI3tyZWxhdGVkX2ZpZWxkX25hbWV9XCI6b2JqLl9pZH0pLmZldGNoKClcclxuXHRcdFx0IyDlvqrnjq/mr4/kuIDmnaHmlbDmja5cclxuXHRcdFx0cmVsYXRlZFJlY29yZExpc3QuZm9yRWFjaCAocmVsYXRlZE9iaiktPlxyXG5cdFx0XHRcdCMg5pW05ZCIZmllbGRz5pWw5o2uXHJcblx0XHRcdFx0ZmllbGRzRGF0YSA9IF9taXhGaWVsZHNEYXRhIHJlbGF0ZWRPYmoscmVsYXRlZE9iak5hbWVcclxuXHRcdFx0XHQjIOaKiuS4gOadoeiusOW9leaPkuWFpeWIsOWvueixoeaVsOe7hOS4rVxyXG5cdFx0XHRcdHJlbGF0ZWRUYWJsZURhdGEucHVzaCBmaWVsZHNEYXRhXHJcblxyXG5cdFx0IyDmiorkuIDkuKrlrZDooajnmoTmiYDmnInmlbDmja7mj5LlhaXliLByZWxhdGVkX29iamVjdHPkuK3vvIzlho3lvqrnjq/kuIvkuIDkuKpcclxuXHRcdHJlbGF0ZWRfb2JqZWN0c1tyZWxhdGVkT2JqTmFtZV0gPSByZWxhdGVkVGFibGVEYXRhXHJcblxyXG5cdHJldHVybiByZWxhdGVkX29iamVjdHNcclxuXHJcbiMgQ3JlYXRvci5FeHBvcnQyeG1sKClcclxuQ3JlYXRvci5FeHBvcnQyeG1sID0gKG9iak5hbWUsIHJlY29yZExpc3QpIC0+XHJcblx0bG9nZ2VyLmluZm8gXCJSdW4gQ3JlYXRvci5FeHBvcnQyeG1sXCJcclxuXHJcblx0Y29uc29sZS50aW1lIFwiQ3JlYXRvci5FeHBvcnQyeG1sXCJcclxuXHJcblx0IyDmtYvor5XmlbDmja5cclxuXHQjIG9iak5hbWUgPSBcImFyY2hpdmVfcmVjb3Jkc1wiXHJcblxyXG5cdCMg5p+l5om+5a+56LGh5pWw5o2uXHJcblx0Y29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihvYmpOYW1lKVxyXG5cdCMg5rWL6K+V5pWw5o2uXHJcblx0cmVjb3JkTGlzdCA9IGNvbGxlY3Rpb24uZmluZCh7fSkuZmV0Y2goKVxyXG5cclxuXHRyZWNvcmRMaXN0LmZvckVhY2ggKHJlY29yZE9iaiktPlxyXG5cdFx0anNvbk9iaiA9IHt9XHJcblx0XHRqc29uT2JqLl9pZCA9IHJlY29yZE9iai5faWRcclxuXHJcblx0XHQjIOaVtOeQhuS4u+ihqOeahEZpZWxkc+aVsOaNrlxyXG5cdFx0ZmllbGRzRGF0YSA9IF9taXhGaWVsZHNEYXRhIHJlY29yZE9iaixvYmpOYW1lXHJcblx0XHRqc29uT2JqW29iak5hbWVdID0gZmllbGRzRGF0YVxyXG5cclxuXHRcdCMg5pW055CG55u45YWz6KGo5pWw5o2uXHJcblx0XHRyZWxhdGVkX29iamVjdHMgPSBfbWl4UmVsYXRlZERhdGEgcmVjb3JkT2JqLG9iak5hbWVcclxuXHJcblx0XHRqc29uT2JqW1wicmVsYXRlZF9vYmplY3RzXCJdID0gcmVsYXRlZF9vYmplY3RzXHJcblxyXG5cdFx0IyDovazkuLp4bWzkv53lrZjmlofku7ZcclxuXHRcdGZpbGVQYXRoID0gX3dyaXRlWG1sRmlsZSBqc29uT2JqLG9iak5hbWVcclxuXHJcblx0Y29uc29sZS50aW1lRW5kIFwiQ3JlYXRvci5FeHBvcnQyeG1sXCJcclxuXHRyZXR1cm4gZmlsZVBhdGgiLCJ2YXIgX21peEZpZWxkc0RhdGEsIF9taXhSZWxhdGVkRGF0YSwgX3dyaXRlWG1sRmlsZSwgZnMsIGxvZ2dlciwgbWtkaXJwLCBwYXRoLCB4bWwyanM7XG5cbnhtbDJqcyA9IHJlcXVpcmUoJ3htbDJqcycpO1xuXG5mcyA9IHJlcXVpcmUoJ2ZzJyk7XG5cbnBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5cbm1rZGlycCA9IHJlcXVpcmUoJ21rZGlycCcpO1xuXG5sb2dnZXIgPSBuZXcgTG9nZ2VyKCdFeHBvcnRfVE9fWE1MJyk7XG5cbl93cml0ZVhtbEZpbGUgPSBmdW5jdGlvbihqc29uT2JqLCBvYmpOYW1lKSB7XG4gIHZhciBidWlsZGVyLCBkYXksIGZpbGVBZGRyZXNzLCBmaWxlTmFtZSwgZmlsZVBhdGgsIG1vbnRoLCBub3csIHN0cmVhbSwgeG1sLCB5ZWFyO1xuICBidWlsZGVyID0gbmV3IHhtbDJqcy5CdWlsZGVyKCk7XG4gIHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoanNvbk9iaik7XG4gIHN0cmVhbSA9IG5ldyBCdWZmZXIoeG1sKTtcbiAgbm93ID0gbmV3IERhdGU7XG4gIHllYXIgPSBub3cuZ2V0RnVsbFllYXIoKTtcbiAgbW9udGggPSBub3cuZ2V0TW9udGgoKSArIDE7XG4gIGRheSA9IG5vdy5nZXREYXRlKCk7XG4gIGZpbGVQYXRoID0gcGF0aC5qb2luKF9fbWV0ZW9yX2Jvb3RzdHJhcF9fLnNlcnZlckRpciwgJy4uLy4uLy4uL2V4cG9ydC8nICsgeWVhciArICcvJyArIG1vbnRoICsgJy8nICsgZGF5ICsgJy8nICsgb2JqTmFtZSk7XG4gIGZpbGVOYW1lID0gKGpzb25PYmogIT0gbnVsbCA/IGpzb25PYmouX2lkIDogdm9pZCAwKSArIFwiLnhtbFwiO1xuICBmaWxlQWRkcmVzcyA9IHBhdGguam9pbihmaWxlUGF0aCwgZmlsZU5hbWUpO1xuICBpZiAoIWZzLmV4aXN0c1N5bmMoZmlsZVBhdGgpKSB7XG4gICAgbWtkaXJwLnN5bmMoZmlsZVBhdGgpO1xuICB9XG4gIGZzLndyaXRlRmlsZShmaWxlQWRkcmVzcywgc3RyZWFtLCBmdW5jdGlvbihlcnIpIHtcbiAgICBpZiAoZXJyKSB7XG4gICAgICByZXR1cm4gbG9nZ2VyLmVycm9yKGpzb25PYmouX2lkICsgXCLlhpnlhaV4bWzmlofku7blpLHotKVcIiwgZXJyKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gZmlsZVBhdGg7XG59O1xuXG5fbWl4RmllbGRzRGF0YSA9IGZ1bmN0aW9uKG9iaiwgb2JqTmFtZSkge1xuICB2YXIganNvbk9iaiwgbWl4Qm9vbCwgbWl4RGF0ZSwgbWl4RGVmYXVsdCwgb2JqRmllbGRzLCByZWY7XG4gIGpzb25PYmogPSB7fTtcbiAgb2JqRmllbGRzID0gdHlwZW9mIENyZWF0b3IgIT09IFwidW5kZWZpbmVkXCIgJiYgQ3JlYXRvciAhPT0gbnVsbCA/IChyZWYgPSBDcmVhdG9yLmdldE9iamVjdChvYmpOYW1lKSkgIT0gbnVsbCA/IHJlZi5maWVsZHMgOiB2b2lkIDAgOiB2b2lkIDA7XG4gIG1peERlZmF1bHQgPSBmdW5jdGlvbihmaWVsZF9uYW1lKSB7XG4gICAgcmV0dXJuIGpzb25PYmpbZmllbGRfbmFtZV0gPSBvYmpbZmllbGRfbmFtZV0gfHwgXCJcIjtcbiAgfTtcbiAgbWl4RGF0ZSA9IGZ1bmN0aW9uKGZpZWxkX25hbWUsIHR5cGUpIHtcbiAgICB2YXIgZGF0ZSwgZGF0ZVN0ciwgZm9ybWF0O1xuICAgIGRhdGUgPSBvYmpbZmllbGRfbmFtZV07XG4gICAgaWYgKHR5cGUgPT09IFwiZGF0ZVwiKSB7XG4gICAgICBmb3JtYXQgPSBcIllZWVktTU0tRERcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgZm9ybWF0ID0gXCJZWVlZLU1NLUREIEhIOm1tOnNzXCI7XG4gICAgfVxuICAgIGlmICgoZGF0ZSAhPSBudWxsKSAmJiAoZm9ybWF0ICE9IG51bGwpKSB7XG4gICAgICBkYXRlU3RyID0gbW9tZW50KGRhdGUpLmZvcm1hdChmb3JtYXQpO1xuICAgIH1cbiAgICByZXR1cm4ganNvbk9ialtmaWVsZF9uYW1lXSA9IGRhdGVTdHIgfHwgXCJcIjtcbiAgfTtcbiAgbWl4Qm9vbCA9IGZ1bmN0aW9uKGZpZWxkX25hbWUpIHtcbiAgICBpZiAob2JqW2ZpZWxkX25hbWVdID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4ganNvbk9ialtmaWVsZF9uYW1lXSA9IFwi5pivXCI7XG4gICAgfSBlbHNlIGlmIChvYmpbZmllbGRfbmFtZV0gPT09IGZhbHNlKSB7XG4gICAgICByZXR1cm4ganNvbk9ialtmaWVsZF9uYW1lXSA9IFwi5ZCmXCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBqc29uT2JqW2ZpZWxkX25hbWVdID0gXCJcIjtcbiAgICB9XG4gIH07XG4gIF8uZWFjaChvYmpGaWVsZHMsIGZ1bmN0aW9uKGZpZWxkLCBmaWVsZF9uYW1lKSB7XG4gICAgc3dpdGNoIChmaWVsZCAhPSBudWxsID8gZmllbGQudHlwZSA6IHZvaWQgMCkge1xuICAgICAgY2FzZSBcImRhdGVcIjpcbiAgICAgIGNhc2UgXCJkYXRldGltZVwiOlxuICAgICAgICByZXR1cm4gbWl4RGF0ZShmaWVsZF9uYW1lLCBmaWVsZC50eXBlKTtcbiAgICAgIGNhc2UgXCJib29sZWFuXCI6XG4gICAgICAgIHJldHVybiBtaXhCb29sKGZpZWxkX25hbWUpO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIG1peERlZmF1bHQoZmllbGRfbmFtZSk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIGpzb25PYmo7XG59O1xuXG5fbWl4UmVsYXRlZERhdGEgPSBmdW5jdGlvbihvYmosIG9iak5hbWUpIHtcbiAgdmFyIHJlbGF0ZWRPYmpOYW1lcywgcmVsYXRlZF9vYmplY3RzO1xuICByZWxhdGVkX29iamVjdHMgPSB7fTtcbiAgcmVsYXRlZE9iak5hbWVzID0gdHlwZW9mIENyZWF0b3IgIT09IFwidW5kZWZpbmVkXCIgJiYgQ3JlYXRvciAhPT0gbnVsbCA/IENyZWF0b3IuZ2V0QWxsUmVsYXRlZE9iamVjdHMob2JqTmFtZSkgOiB2b2lkIDA7XG4gIHJlbGF0ZWRPYmpOYW1lcy5mb3JFYWNoKGZ1bmN0aW9uKHJlbGF0ZWRPYmpOYW1lKSB7XG4gICAgdmFyIGZpZWxkcywgb2JqMSwgcmVmLCByZWxhdGVkQ29sbGVjdGlvbiwgcmVsYXRlZFJlY29yZExpc3QsIHJlbGF0ZWRUYWJsZURhdGEsIHJlbGF0ZWRfZmllbGRfbmFtZTtcbiAgICByZWxhdGVkVGFibGVEYXRhID0gW107XG4gICAgaWYgKHJlbGF0ZWRPYmpOYW1lID09PSBcImNtc19maWxlc1wiKSB7XG4gICAgICByZWxhdGVkX2ZpZWxkX25hbWUgPSBcInBhcmVudC5pZHNcIjtcbiAgICB9IGVsc2Uge1xuICAgICAgZmllbGRzID0gdHlwZW9mIENyZWF0b3IgIT09IFwidW5kZWZpbmVkXCIgJiYgQ3JlYXRvciAhPT0gbnVsbCA/IChyZWYgPSBDcmVhdG9yLk9iamVjdHNbcmVsYXRlZE9iak5hbWVdKSAhPSBudWxsID8gcmVmLmZpZWxkcyA6IHZvaWQgMCA6IHZvaWQgMDtcbiAgICAgIHJlbGF0ZWRfZmllbGRfbmFtZSA9IFwiXCI7XG4gICAgICBfLmVhY2goZmllbGRzLCBmdW5jdGlvbihmaWVsZCwgZmllbGRfbmFtZSkge1xuICAgICAgICBpZiAoKGZpZWxkICE9IG51bGwgPyBmaWVsZC5yZWZlcmVuY2VfdG8gOiB2b2lkIDApID09PSBvYmpOYW1lKSB7XG4gICAgICAgICAgcmV0dXJuIHJlbGF0ZWRfZmllbGRfbmFtZSA9IGZpZWxkX25hbWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAocmVsYXRlZF9maWVsZF9uYW1lKSB7XG4gICAgICByZWxhdGVkQ29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihyZWxhdGVkT2JqTmFtZSk7XG4gICAgICByZWxhdGVkUmVjb3JkTGlzdCA9IHJlbGF0ZWRDb2xsZWN0aW9uLmZpbmQoKFxuICAgICAgICBvYmoxID0ge30sXG4gICAgICAgIG9iajFbXCJcIiArIHJlbGF0ZWRfZmllbGRfbmFtZV0gPSBvYmouX2lkLFxuICAgICAgICBvYmoxXG4gICAgICApKS5mZXRjaCgpO1xuICAgICAgcmVsYXRlZFJlY29yZExpc3QuZm9yRWFjaChmdW5jdGlvbihyZWxhdGVkT2JqKSB7XG4gICAgICAgIHZhciBmaWVsZHNEYXRhO1xuICAgICAgICBmaWVsZHNEYXRhID0gX21peEZpZWxkc0RhdGEocmVsYXRlZE9iaiwgcmVsYXRlZE9iak5hbWUpO1xuICAgICAgICByZXR1cm4gcmVsYXRlZFRhYmxlRGF0YS5wdXNoKGZpZWxkc0RhdGEpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiByZWxhdGVkX29iamVjdHNbcmVsYXRlZE9iak5hbWVdID0gcmVsYXRlZFRhYmxlRGF0YTtcbiAgfSk7XG4gIHJldHVybiByZWxhdGVkX29iamVjdHM7XG59O1xuXG5DcmVhdG9yLkV4cG9ydDJ4bWwgPSBmdW5jdGlvbihvYmpOYW1lLCByZWNvcmRMaXN0KSB7XG4gIHZhciBjb2xsZWN0aW9uO1xuICBsb2dnZXIuaW5mbyhcIlJ1biBDcmVhdG9yLkV4cG9ydDJ4bWxcIik7XG4gIGNvbnNvbGUudGltZShcIkNyZWF0b3IuRXhwb3J0MnhtbFwiKTtcbiAgY29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihvYmpOYW1lKTtcbiAgcmVjb3JkTGlzdCA9IGNvbGxlY3Rpb24uZmluZCh7fSkuZmV0Y2goKTtcbiAgcmVjb3JkTGlzdC5mb3JFYWNoKGZ1bmN0aW9uKHJlY29yZE9iaikge1xuICAgIHZhciBmaWVsZHNEYXRhLCBmaWxlUGF0aCwganNvbk9iaiwgcmVsYXRlZF9vYmplY3RzO1xuICAgIGpzb25PYmogPSB7fTtcbiAgICBqc29uT2JqLl9pZCA9IHJlY29yZE9iai5faWQ7XG4gICAgZmllbGRzRGF0YSA9IF9taXhGaWVsZHNEYXRhKHJlY29yZE9iaiwgb2JqTmFtZSk7XG4gICAganNvbk9ialtvYmpOYW1lXSA9IGZpZWxkc0RhdGE7XG4gICAgcmVsYXRlZF9vYmplY3RzID0gX21peFJlbGF0ZWREYXRhKHJlY29yZE9iaiwgb2JqTmFtZSk7XG4gICAganNvbk9ialtcInJlbGF0ZWRfb2JqZWN0c1wiXSA9IHJlbGF0ZWRfb2JqZWN0cztcbiAgICByZXR1cm4gZmlsZVBhdGggPSBfd3JpdGVYbWxGaWxlKGpzb25PYmosIG9iak5hbWUpO1xuICB9KTtcbiAgY29uc29sZS50aW1lRW5kKFwiQ3JlYXRvci5FeHBvcnQyeG1sXCIpO1xuICByZXR1cm4gZmlsZVBhdGg7XG59O1xuIiwiTWV0ZW9yLm1ldGhvZHMgXHJcblx0cmVsYXRlZF9vYmplY3RzX3JlY29yZHM6IChvYmplY3RfbmFtZSwgcmVsYXRlZF9vYmplY3RfbmFtZSwgcmVsYXRlZF9maWVsZF9uYW1lLCByZWNvcmRfaWQsIHNwYWNlSWQpLT5cclxuXHRcdHVzZXJJZCA9IHRoaXMudXNlcklkXHJcblx0XHRpZiByZWxhdGVkX29iamVjdF9uYW1lID09IFwiY2ZzLmZpbGVzLmZpbGVyZWNvcmRcIlxyXG5cdFx0XHRzZWxlY3RvciA9IHtcIm1ldGFkYXRhLnNwYWNlXCI6IHNwYWNlSWR9XHJcblx0XHRlbHNlXHJcblx0XHRcdHNlbGVjdG9yID0ge3NwYWNlOiBzcGFjZUlkfVxyXG5cdFx0XHJcblx0XHRpZiByZWxhdGVkX29iamVjdF9uYW1lID09IFwiY21zX2ZpbGVzXCJcclxuXHRcdFx0IyDpmYTku7bnmoTlhbPogZTmkJzntKLmnaHku7bmmK/lrprmrbvnmoRcclxuXHRcdFx0c2VsZWN0b3JbXCJwYXJlbnQub1wiXSA9IG9iamVjdF9uYW1lXHJcblx0XHRcdHNlbGVjdG9yW1wicGFyZW50Lmlkc1wiXSA9IFtyZWNvcmRfaWRdXHJcblx0XHRlbHNlXHJcblx0XHRcdHNlbGVjdG9yW3JlbGF0ZWRfZmllbGRfbmFtZV0gPSByZWNvcmRfaWRcclxuXHJcblx0XHRwZXJtaXNzaW9ucyA9IENyZWF0b3IuZ2V0UGVybWlzc2lvbnMocmVsYXRlZF9vYmplY3RfbmFtZSwgc3BhY2VJZCwgdXNlcklkKVxyXG5cdFx0aWYgIXBlcm1pc3Npb25zLnZpZXdBbGxSZWNvcmRzIGFuZCBwZXJtaXNzaW9ucy5hbGxvd1JlYWRcclxuXHRcdFx0c2VsZWN0b3Iub3duZXIgPSB1c2VySWRcclxuXHRcdFxyXG5cdFx0cmVsYXRlZF9yZWNvcmRzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKHJlbGF0ZWRfb2JqZWN0X25hbWUpLmZpbmQoc2VsZWN0b3IpXHJcblx0XHRyZXR1cm4gcmVsYXRlZF9yZWNvcmRzLmNvdW50KCkiLCJNZXRlb3IubWV0aG9kcyh7XG4gIHJlbGF0ZWRfb2JqZWN0c19yZWNvcmRzOiBmdW5jdGlvbihvYmplY3RfbmFtZSwgcmVsYXRlZF9vYmplY3RfbmFtZSwgcmVsYXRlZF9maWVsZF9uYW1lLCByZWNvcmRfaWQsIHNwYWNlSWQpIHtcbiAgICB2YXIgcGVybWlzc2lvbnMsIHJlbGF0ZWRfcmVjb3Jkcywgc2VsZWN0b3IsIHVzZXJJZDtcbiAgICB1c2VySWQgPSB0aGlzLnVzZXJJZDtcbiAgICBpZiAocmVsYXRlZF9vYmplY3RfbmFtZSA9PT0gXCJjZnMuZmlsZXMuZmlsZXJlY29yZFwiKSB7XG4gICAgICBzZWxlY3RvciA9IHtcbiAgICAgICAgXCJtZXRhZGF0YS5zcGFjZVwiOiBzcGFjZUlkXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBzZWxlY3RvciA9IHtcbiAgICAgICAgc3BhY2U6IHNwYWNlSWRcbiAgICAgIH07XG4gICAgfVxuICAgIGlmIChyZWxhdGVkX29iamVjdF9uYW1lID09PSBcImNtc19maWxlc1wiKSB7XG4gICAgICBzZWxlY3RvcltcInBhcmVudC5vXCJdID0gb2JqZWN0X25hbWU7XG4gICAgICBzZWxlY3RvcltcInBhcmVudC5pZHNcIl0gPSBbcmVjb3JkX2lkXTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2VsZWN0b3JbcmVsYXRlZF9maWVsZF9uYW1lXSA9IHJlY29yZF9pZDtcbiAgICB9XG4gICAgcGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldFBlcm1pc3Npb25zKHJlbGF0ZWRfb2JqZWN0X25hbWUsIHNwYWNlSWQsIHVzZXJJZCk7XG4gICAgaWYgKCFwZXJtaXNzaW9ucy52aWV3QWxsUmVjb3JkcyAmJiBwZXJtaXNzaW9ucy5hbGxvd1JlYWQpIHtcbiAgICAgIHNlbGVjdG9yLm93bmVyID0gdXNlcklkO1xuICAgIH1cbiAgICByZWxhdGVkX3JlY29yZHMgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ocmVsYXRlZF9vYmplY3RfbmFtZSkuZmluZChzZWxlY3Rvcik7XG4gICAgcmV0dXJuIHJlbGF0ZWRfcmVjb3Jkcy5jb3VudCgpO1xuICB9XG59KTtcbiIsIk1ldGVvci5tZXRob2RzXHJcblx0Z2V0UGVuZGluZ1NwYWNlSW5mbzogKGludml0ZXJJZCwgc3BhY2VJZCktPlxyXG5cdFx0aW52aXRlck5hbWUgPSBkYi51c2Vycy5maW5kT25lKHtfaWQ6IGludml0ZXJJZH0pLm5hbWVcclxuXHRcdHNwYWNlTmFtZSA9IGRiLnNwYWNlcy5maW5kT25lKHtfaWQ6IHNwYWNlSWR9KS5uYW1lXHJcblxyXG5cdFx0cmV0dXJuIHtpbnZpdGVyOiBpbnZpdGVyTmFtZSwgc3BhY2U6IHNwYWNlTmFtZX1cclxuXHJcblx0cmVmdXNlSm9pblNwYWNlOiAoX2lkKS0+XHJcblx0XHRkYi5zcGFjZV91c2Vycy5kaXJlY3QudXBkYXRlKHtfaWQ6IF9pZH0seyRzZXQ6IHtpbnZpdGVfc3RhdGU6IFwicmVmdXNlZFwifX0pXHJcblxyXG5cdGFjY2VwdEpvaW5TcGFjZTogKF9pZCktPlxyXG5cdFx0ZGIuc3BhY2VfdXNlcnMuZGlyZWN0LnVwZGF0ZSh7X2lkOiBfaWR9LHskc2V0OiB7aW52aXRlX3N0YXRlOiBcImFjY2VwdGVkXCIsIHVzZXJfYWNjZXB0ZWQ6IHRydWV9fSlcclxuXHJcbiIsIk1ldGVvci5tZXRob2RzKHtcbiAgZ2V0UGVuZGluZ1NwYWNlSW5mbzogZnVuY3Rpb24oaW52aXRlcklkLCBzcGFjZUlkKSB7XG4gICAgdmFyIGludml0ZXJOYW1lLCBzcGFjZU5hbWU7XG4gICAgaW52aXRlck5hbWUgPSBkYi51c2Vycy5maW5kT25lKHtcbiAgICAgIF9pZDogaW52aXRlcklkXG4gICAgfSkubmFtZTtcbiAgICBzcGFjZU5hbWUgPSBkYi5zcGFjZXMuZmluZE9uZSh7XG4gICAgICBfaWQ6IHNwYWNlSWRcbiAgICB9KS5uYW1lO1xuICAgIHJldHVybiB7XG4gICAgICBpbnZpdGVyOiBpbnZpdGVyTmFtZSxcbiAgICAgIHNwYWNlOiBzcGFjZU5hbWVcbiAgICB9O1xuICB9LFxuICByZWZ1c2VKb2luU3BhY2U6IGZ1bmN0aW9uKF9pZCkge1xuICAgIHJldHVybiBkYi5zcGFjZV91c2Vycy5kaXJlY3QudXBkYXRlKHtcbiAgICAgIF9pZDogX2lkXG4gICAgfSwge1xuICAgICAgJHNldDoge1xuICAgICAgICBpbnZpdGVfc3RhdGU6IFwicmVmdXNlZFwiXG4gICAgICB9XG4gICAgfSk7XG4gIH0sXG4gIGFjY2VwdEpvaW5TcGFjZTogZnVuY3Rpb24oX2lkKSB7XG4gICAgcmV0dXJuIGRiLnNwYWNlX3VzZXJzLmRpcmVjdC51cGRhdGUoe1xuICAgICAgX2lkOiBfaWRcbiAgICB9LCB7XG4gICAgICAkc2V0OiB7XG4gICAgICAgIGludml0ZV9zdGF0ZTogXCJhY2NlcHRlZFwiLFxuICAgICAgICB1c2VyX2FjY2VwdGVkOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn0pO1xuIiwiTWV0ZW9yLnB1Ymxpc2ggXCJjcmVhdG9yX29iamVjdF9yZWNvcmRcIiwgKG9iamVjdF9uYW1lLCBpZCwgc3BhY2VfaWQpLT5cclxuXHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKG9iamVjdF9uYW1lLCBzcGFjZV9pZClcclxuXHRpZiBjb2xsZWN0aW9uXHJcblx0XHRyZXR1cm4gY29sbGVjdGlvbi5maW5kKHtfaWQ6IGlkfSlcclxuXHJcbiIsIk1ldGVvci5wdWJsaXNoKFwiY3JlYXRvcl9vYmplY3RfcmVjb3JkXCIsIGZ1bmN0aW9uKG9iamVjdF9uYW1lLCBpZCwgc3BhY2VfaWQpIHtcbiAgdmFyIGNvbGxlY3Rpb247XG4gIGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqZWN0X25hbWUsIHNwYWNlX2lkKTtcbiAgaWYgKGNvbGxlY3Rpb24pIHtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5maW5kKHtcbiAgICAgIF9pZDogaWRcbiAgICB9KTtcbiAgfVxufSk7XG4iLCJNZXRlb3IucHVibGlzaENvbXBvc2l0ZSBcInN0ZWVkb3Nfb2JqZWN0X3RhYnVsYXJcIiwgKHRhYmxlTmFtZSwgaWRzLCBmaWVsZHMsIHNwYWNlSWQpLT5cclxuXHR1bmxlc3MgdGhpcy51c2VySWRcclxuXHRcdHJldHVybiB0aGlzLnJlYWR5KClcclxuXHJcblx0Y2hlY2sodGFibGVOYW1lLCBTdHJpbmcpO1xyXG5cdGNoZWNrKGlkcywgQXJyYXkpO1xyXG5cdGNoZWNrKGZpZWxkcywgTWF0Y2guT3B0aW9uYWwoT2JqZWN0KSk7XHJcblxyXG5cdF9vYmplY3RfbmFtZSA9IHRhYmxlTmFtZS5yZXBsYWNlKFwiY3JlYXRvcl9cIixcIlwiKVxyXG5cdF9vYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChfb2JqZWN0X25hbWUsIHNwYWNlSWQpXHJcblxyXG5cdGlmIHNwYWNlSWRcclxuXHRcdF9vYmplY3RfbmFtZSA9IENyZWF0b3IuZ2V0T2JqZWN0TmFtZShfb2JqZWN0KVxyXG5cclxuXHRvYmplY3RfY29sbGVjaXRvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihfb2JqZWN0X25hbWUpXHJcblxyXG5cclxuXHRfZmllbGRzID0gX29iamVjdD8uZmllbGRzXHJcblx0aWYgIV9maWVsZHMgfHwgIW9iamVjdF9jb2xsZWNpdG9uXHJcblx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpXHJcblxyXG5cdHJlZmVyZW5jZV9maWVsZHMgPSBfLmZpbHRlciBfZmllbGRzLCAoZiktPlxyXG5cdFx0cmV0dXJuIF8uaXNGdW5jdGlvbihmLnJlZmVyZW5jZV90bykgfHwgIV8uaXNFbXB0eShmLnJlZmVyZW5jZV90bylcclxuXHJcblx0c2VsZiA9IHRoaXNcclxuXHJcblx0c2VsZi51bmJsb2NrKCk7XHJcblxyXG5cdGlmIHJlZmVyZW5jZV9maWVsZHMubGVuZ3RoID4gMFxyXG5cdFx0ZGF0YSA9IHtcclxuXHRcdFx0ZmluZDogKCktPlxyXG5cdFx0XHRcdHNlbGYudW5ibG9jaygpO1xyXG5cdFx0XHRcdGZpZWxkX2tleXMgPSB7fVxyXG5cdFx0XHRcdF8uZWFjaCBfLmtleXMoZmllbGRzKSwgKGYpLT5cclxuXHRcdFx0XHRcdHVubGVzcyAvXFx3KyhcXC5cXCQpezF9XFx3Py8udGVzdChmKVxyXG5cdFx0XHRcdFx0XHRmaWVsZF9rZXlzW2ZdID0gMVxyXG5cdFx0XHRcdFxyXG5cdFx0XHRcdHJldHVybiBvYmplY3RfY29sbGVjaXRvbi5maW5kKHtfaWQ6IHskaW46IGlkc319LCB7ZmllbGRzOiBmaWVsZF9rZXlzfSk7XHJcblx0XHR9XHJcblxyXG5cdFx0ZGF0YS5jaGlsZHJlbiA9IFtdXHJcblxyXG5cdFx0a2V5cyA9IF8ua2V5cyhmaWVsZHMpXHJcblxyXG5cdFx0aWYga2V5cy5sZW5ndGggPCAxXHJcblx0XHRcdGtleXMgPSBfLmtleXMoX2ZpZWxkcylcclxuXHJcblx0XHRfa2V5cyA9IFtdXHJcblxyXG5cdFx0a2V5cy5mb3JFYWNoIChrZXkpLT5cclxuXHRcdFx0aWYgX29iamVjdC5zY2hlbWEuX29iamVjdEtleXNba2V5ICsgJy4nXVxyXG5cdFx0XHRcdF9rZXlzID0gX2tleXMuY29uY2F0KF8ubWFwKF9vYmplY3Quc2NoZW1hLl9vYmplY3RLZXlzW2tleSArICcuJ10sIChrKS0+XHJcblx0XHRcdFx0XHRyZXR1cm4ga2V5ICsgJy4nICsga1xyXG5cdFx0XHRcdCkpXHJcblx0XHRcdF9rZXlzLnB1c2goa2V5KVxyXG5cclxuXHRcdF9rZXlzLmZvckVhY2ggKGtleSktPlxyXG5cdFx0XHRyZWZlcmVuY2VfZmllbGQgPSBfZmllbGRzW2tleV1cclxuXHJcblx0XHRcdGlmIHJlZmVyZW5jZV9maWVsZCAmJiAoXy5pc0Z1bmN0aW9uKHJlZmVyZW5jZV9maWVsZC5yZWZlcmVuY2VfdG8pIHx8ICFfLmlzRW1wdHkocmVmZXJlbmNlX2ZpZWxkLnJlZmVyZW5jZV90bykpICAjIGFuZCBDcmVhdG9yLkNvbGxlY3Rpb25zW3JlZmVyZW5jZV9maWVsZC5yZWZlcmVuY2VfdG9dXHJcblx0XHRcdFx0ZGF0YS5jaGlsZHJlbi5wdXNoIHtcclxuXHRcdFx0XHRcdGZpbmQ6IChwYXJlbnQpIC0+XHJcblx0XHRcdFx0XHRcdHRyeVxyXG5cdFx0XHRcdFx0XHRcdHNlbGYudW5ibG9jaygpO1xyXG5cclxuXHRcdFx0XHRcdFx0XHRxdWVyeSA9IHt9XHJcblxyXG5cdFx0XHRcdFx0XHRcdCMg6KGo5qC85a2Q5a2X5q6154m55q6K5aSE55CGXHJcblx0XHRcdFx0XHRcdFx0aWYgL1xcdysoXFwuXFwkXFwuKXsxfVxcdysvLnRlc3Qoa2V5KVxyXG5cdFx0XHRcdFx0XHRcdFx0cF9rID0ga2V5LnJlcGxhY2UoLyhcXHcrKVxcLlxcJFxcLlxcdysvaWcsIFwiJDFcIilcclxuXHRcdFx0XHRcdFx0XHRcdHNfayA9IGtleS5yZXBsYWNlKC9cXHcrXFwuXFwkXFwuKFxcdyspL2lnLCBcIiQxXCIpXHJcblx0XHRcdFx0XHRcdFx0XHRyZWZlcmVuY2VfaWRzID0gcGFyZW50W3Bfa10uZ2V0UHJvcGVydHkoc19rKVxyXG5cdFx0XHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0XHRcdHJlZmVyZW5jZV9pZHMgPSBrZXkuc3BsaXQoJy4nKS5yZWR1Y2UgKG8sIHgpIC0+XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0bz9beF1cclxuXHRcdFx0XHRcdFx0XHRcdCwgcGFyZW50XHJcblxyXG5cdFx0XHRcdFx0XHRcdHJlZmVyZW5jZV90byA9IHJlZmVyZW5jZV9maWVsZC5yZWZlcmVuY2VfdG9cclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgXy5pc0Z1bmN0aW9uKHJlZmVyZW5jZV90bylcclxuXHRcdFx0XHRcdFx0XHRcdHJlZmVyZW5jZV90byA9IHJlZmVyZW5jZV90bygpXHJcblxyXG5cdFx0XHRcdFx0XHRcdGlmIF8uaXNBcnJheShyZWZlcmVuY2VfdG8pXHJcblx0XHRcdFx0XHRcdFx0XHRpZiBfLmlzT2JqZWN0KHJlZmVyZW5jZV9pZHMpICYmICFfLmlzQXJyYXkocmVmZXJlbmNlX2lkcylcclxuXHRcdFx0XHRcdFx0XHRcdFx0cmVmZXJlbmNlX3RvID0gcmVmZXJlbmNlX2lkcy5vXHJcblx0XHRcdFx0XHRcdFx0XHRcdHJlZmVyZW5jZV9pZHMgPSByZWZlcmVuY2VfaWRzLmlkcyB8fCBbXVxyXG5cdFx0XHRcdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gW11cclxuXHJcblx0XHRcdFx0XHRcdFx0aWYgXy5pc0FycmF5KHJlZmVyZW5jZV9pZHMpXHJcblx0XHRcdFx0XHRcdFx0XHRxdWVyeS5faWQgPSB7JGluOiByZWZlcmVuY2VfaWRzfVxyXG5cdFx0XHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0XHRcdHF1ZXJ5Ll9pZCA9IHJlZmVyZW5jZV9pZHNcclxuXHJcblx0XHRcdFx0XHRcdFx0cmVmZXJlbmNlX3RvX29iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KHJlZmVyZW5jZV90bywgc3BhY2VJZClcclxuXHJcblx0XHRcdFx0XHRcdFx0bmFtZV9maWVsZF9rZXkgPSByZWZlcmVuY2VfdG9fb2JqZWN0Lk5BTUVfRklFTERfS0VZXHJcblxyXG5cdFx0XHRcdFx0XHRcdGNoaWxkcmVuX2ZpZWxkcyA9IHtfaWQ6IDEsIHNwYWNlOiAxfVxyXG5cclxuXHRcdFx0XHRcdFx0XHRpZiBuYW1lX2ZpZWxkX2tleVxyXG5cdFx0XHRcdFx0XHRcdFx0Y2hpbGRyZW5fZmllbGRzW25hbWVfZmllbGRfa2V5XSA9IDFcclxuXHJcblx0XHRcdFx0XHRcdFx0cmV0dXJuIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihyZWZlcmVuY2VfdG8sIHNwYWNlSWQpLmZpbmQocXVlcnksIHtcclxuXHRcdFx0XHRcdFx0XHRcdGZpZWxkczogY2hpbGRyZW5fZmllbGRzXHJcblx0XHRcdFx0XHRcdFx0fSk7XHJcblx0XHRcdFx0XHRcdGNhdGNoIGVcclxuXHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhyZWZlcmVuY2VfdG8sIHBhcmVudCwgZSlcclxuXHRcdFx0XHRcdFx0XHRyZXR1cm4gW11cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGRhdGFcclxuXHRlbHNlXHJcblx0XHRyZXR1cm4ge1xyXG5cdFx0XHRmaW5kOiAoKS0+XHJcblx0XHRcdFx0c2VsZi51bmJsb2NrKCk7XHJcblx0XHRcdFx0cmV0dXJuIG9iamVjdF9jb2xsZWNpdG9uLmZpbmQoe19pZDogeyRpbjogaWRzfX0sIHtmaWVsZHM6IGZpZWxkc30pXHJcblx0XHR9O1xyXG5cclxuIiwiTWV0ZW9yLnB1Ymxpc2hDb21wb3NpdGUoXCJzdGVlZG9zX29iamVjdF90YWJ1bGFyXCIsIGZ1bmN0aW9uKHRhYmxlTmFtZSwgaWRzLCBmaWVsZHMsIHNwYWNlSWQpIHtcbiAgdmFyIF9maWVsZHMsIF9rZXlzLCBfb2JqZWN0LCBfb2JqZWN0X25hbWUsIGRhdGEsIGtleXMsIG9iamVjdF9jb2xsZWNpdG9uLCByZWZlcmVuY2VfZmllbGRzLCBzZWxmO1xuICBpZiAoIXRoaXMudXNlcklkKSB7XG4gICAgcmV0dXJuIHRoaXMucmVhZHkoKTtcbiAgfVxuICBjaGVjayh0YWJsZU5hbWUsIFN0cmluZyk7XG4gIGNoZWNrKGlkcywgQXJyYXkpO1xuICBjaGVjayhmaWVsZHMsIE1hdGNoLk9wdGlvbmFsKE9iamVjdCkpO1xuICBfb2JqZWN0X25hbWUgPSB0YWJsZU5hbWUucmVwbGFjZShcImNyZWF0b3JfXCIsIFwiXCIpO1xuICBfb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3QoX29iamVjdF9uYW1lLCBzcGFjZUlkKTtcbiAgaWYgKHNwYWNlSWQpIHtcbiAgICBfb2JqZWN0X25hbWUgPSBDcmVhdG9yLmdldE9iamVjdE5hbWUoX29iamVjdCk7XG4gIH1cbiAgb2JqZWN0X2NvbGxlY2l0b24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oX29iamVjdF9uYW1lKTtcbiAgX2ZpZWxkcyA9IF9vYmplY3QgIT0gbnVsbCA/IF9vYmplY3QuZmllbGRzIDogdm9pZCAwO1xuICBpZiAoIV9maWVsZHMgfHwgIW9iamVjdF9jb2xsZWNpdG9uKSB7XG4gICAgcmV0dXJuIHRoaXMucmVhZHkoKTtcbiAgfVxuICByZWZlcmVuY2VfZmllbGRzID0gXy5maWx0ZXIoX2ZpZWxkcywgZnVuY3Rpb24oZikge1xuICAgIHJldHVybiBfLmlzRnVuY3Rpb24oZi5yZWZlcmVuY2VfdG8pIHx8ICFfLmlzRW1wdHkoZi5yZWZlcmVuY2VfdG8pO1xuICB9KTtcbiAgc2VsZiA9IHRoaXM7XG4gIHNlbGYudW5ibG9jaygpO1xuICBpZiAocmVmZXJlbmNlX2ZpZWxkcy5sZW5ndGggPiAwKSB7XG4gICAgZGF0YSA9IHtcbiAgICAgIGZpbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZmllbGRfa2V5cztcbiAgICAgICAgc2VsZi51bmJsb2NrKCk7XG4gICAgICAgIGZpZWxkX2tleXMgPSB7fTtcbiAgICAgICAgXy5lYWNoKF8ua2V5cyhmaWVsZHMpLCBmdW5jdGlvbihmKSB7XG4gICAgICAgICAgaWYgKCEvXFx3KyhcXC5cXCQpezF9XFx3Py8udGVzdChmKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkX2tleXNbZl0gPSAxO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvYmplY3RfY29sbGVjaXRvbi5maW5kKHtcbiAgICAgICAgICBfaWQ6IHtcbiAgICAgICAgICAgICRpbjogaWRzXG4gICAgICAgICAgfVxuICAgICAgICB9LCB7XG4gICAgICAgICAgZmllbGRzOiBmaWVsZF9rZXlzXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gICAgZGF0YS5jaGlsZHJlbiA9IFtdO1xuICAgIGtleXMgPSBfLmtleXMoZmllbGRzKTtcbiAgICBpZiAoa2V5cy5sZW5ndGggPCAxKSB7XG4gICAgICBrZXlzID0gXy5rZXlzKF9maWVsZHMpO1xuICAgIH1cbiAgICBfa2V5cyA9IFtdO1xuICAgIGtleXMuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgIGlmIChfb2JqZWN0LnNjaGVtYS5fb2JqZWN0S2V5c1trZXkgKyAnLiddKSB7XG4gICAgICAgIF9rZXlzID0gX2tleXMuY29uY2F0KF8ubWFwKF9vYmplY3Quc2NoZW1hLl9vYmplY3RLZXlzW2tleSArICcuJ10sIGZ1bmN0aW9uKGspIHtcbiAgICAgICAgICByZXR1cm4ga2V5ICsgJy4nICsgaztcbiAgICAgICAgfSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIF9rZXlzLnB1c2goa2V5KTtcbiAgICB9KTtcbiAgICBfa2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgICAgdmFyIHJlZmVyZW5jZV9maWVsZDtcbiAgICAgIHJlZmVyZW5jZV9maWVsZCA9IF9maWVsZHNba2V5XTtcbiAgICAgIGlmIChyZWZlcmVuY2VfZmllbGQgJiYgKF8uaXNGdW5jdGlvbihyZWZlcmVuY2VfZmllbGQucmVmZXJlbmNlX3RvKSB8fCAhXy5pc0VtcHR5KHJlZmVyZW5jZV9maWVsZC5yZWZlcmVuY2VfdG8pKSkge1xuICAgICAgICByZXR1cm4gZGF0YS5jaGlsZHJlbi5wdXNoKHtcbiAgICAgICAgICBmaW5kOiBmdW5jdGlvbihwYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBjaGlsZHJlbl9maWVsZHMsIGUsIG5hbWVfZmllbGRfa2V5LCBwX2ssIHF1ZXJ5LCByZWZlcmVuY2VfaWRzLCByZWZlcmVuY2VfdG8sIHJlZmVyZW5jZV90b19vYmplY3QsIHNfaztcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIHNlbGYudW5ibG9jaygpO1xuICAgICAgICAgICAgICBxdWVyeSA9IHt9O1xuICAgICAgICAgICAgICBpZiAoL1xcdysoXFwuXFwkXFwuKXsxfVxcdysvLnRlc3Qoa2V5KSkge1xuICAgICAgICAgICAgICAgIHBfayA9IGtleS5yZXBsYWNlKC8oXFx3KylcXC5cXCRcXC5cXHcrL2lnLCBcIiQxXCIpO1xuICAgICAgICAgICAgICAgIHNfayA9IGtleS5yZXBsYWNlKC9cXHcrXFwuXFwkXFwuKFxcdyspL2lnLCBcIiQxXCIpO1xuICAgICAgICAgICAgICAgIHJlZmVyZW5jZV9pZHMgPSBwYXJlbnRbcF9rXS5nZXRQcm9wZXJ0eShzX2spO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlZmVyZW5jZV9pZHMgPSBrZXkuc3BsaXQoJy4nKS5yZWR1Y2UoZnVuY3Rpb24obywgeCkge1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIG8gIT0gbnVsbCA/IG9beF0gOiB2b2lkIDA7XG4gICAgICAgICAgICAgICAgfSwgcGFyZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZWZlcmVuY2VfdG8gPSByZWZlcmVuY2VfZmllbGQucmVmZXJlbmNlX3RvO1xuICAgICAgICAgICAgICBpZiAoXy5pc0Z1bmN0aW9uKHJlZmVyZW5jZV90bykpIHtcbiAgICAgICAgICAgICAgICByZWZlcmVuY2VfdG8gPSByZWZlcmVuY2VfdG8oKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoXy5pc0FycmF5KHJlZmVyZW5jZV90bykpIHtcbiAgICAgICAgICAgICAgICBpZiAoXy5pc09iamVjdChyZWZlcmVuY2VfaWRzKSAmJiAhXy5pc0FycmF5KHJlZmVyZW5jZV9pZHMpKSB7XG4gICAgICAgICAgICAgICAgICByZWZlcmVuY2VfdG8gPSByZWZlcmVuY2VfaWRzLm87XG4gICAgICAgICAgICAgICAgICByZWZlcmVuY2VfaWRzID0gcmVmZXJlbmNlX2lkcy5pZHMgfHwgW107XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKF8uaXNBcnJheShyZWZlcmVuY2VfaWRzKSkge1xuICAgICAgICAgICAgICAgIHF1ZXJ5Ll9pZCA9IHtcbiAgICAgICAgICAgICAgICAgICRpbjogcmVmZXJlbmNlX2lkc1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcXVlcnkuX2lkID0gcmVmZXJlbmNlX2lkcztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZWZlcmVuY2VfdG9fb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3QocmVmZXJlbmNlX3RvLCBzcGFjZUlkKTtcbiAgICAgICAgICAgICAgbmFtZV9maWVsZF9rZXkgPSByZWZlcmVuY2VfdG9fb2JqZWN0Lk5BTUVfRklFTERfS0VZO1xuICAgICAgICAgICAgICBjaGlsZHJlbl9maWVsZHMgPSB7XG4gICAgICAgICAgICAgICAgX2lkOiAxLFxuICAgICAgICAgICAgICAgIHNwYWNlOiAxXG4gICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIGlmIChuYW1lX2ZpZWxkX2tleSkge1xuICAgICAgICAgICAgICAgIGNoaWxkcmVuX2ZpZWxkc1tuYW1lX2ZpZWxkX2tleV0gPSAxO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiBDcmVhdG9yLmdldENvbGxlY3Rpb24ocmVmZXJlbmNlX3RvLCBzcGFjZUlkKS5maW5kKHF1ZXJ5LCB7XG4gICAgICAgICAgICAgICAgZmllbGRzOiBjaGlsZHJlbl9maWVsZHNcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICBlID0gZXJyb3I7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlZmVyZW5jZV90bywgcGFyZW50LCBlKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIGRhdGE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGZpbmQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLnVuYmxvY2soKTtcbiAgICAgICAgcmV0dXJuIG9iamVjdF9jb2xsZWNpdG9uLmZpbmQoe1xuICAgICAgICAgIF9pZDoge1xuICAgICAgICAgICAgJGluOiBpZHNcbiAgICAgICAgICB9XG4gICAgICAgIH0sIHtcbiAgICAgICAgICBmaWVsZHM6IGZpZWxkc1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoIFwib2JqZWN0X2xpc3R2aWV3c1wiLCAob2JqZWN0X25hbWUsIHNwYWNlSWQpLT5cclxuICAgIHVzZXJJZCA9IHRoaXMudXNlcklkXHJcbiAgICByZXR1cm4gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS5maW5kKHtvYmplY3RfbmFtZTogb2JqZWN0X25hbWUsIHNwYWNlOiBzcGFjZUlkICxcIiRvclwiOlt7b3duZXI6IHVzZXJJZH0sIHtzaGFyZWQ6IHRydWV9XX0pIiwiTWV0ZW9yLnB1Ymxpc2ggXCJ1c2VyX3RhYnVsYXJfc2V0dGluZ3NcIiwgKG9iamVjdF9uYW1lKS0+XHJcbiAgICB1c2VySWQgPSB0aGlzLnVzZXJJZFxyXG4gICAgcmV0dXJuIENyZWF0b3IuQ29sbGVjdGlvbnMuc2V0dGluZ3MuZmluZCh7b2JqZWN0X25hbWU6IHskaW46IG9iamVjdF9uYW1lfSwgcmVjb3JkX2lkOiB7JGluOiBbXCJvYmplY3RfbGlzdHZpZXdzXCIsIFwib2JqZWN0X2dyaWR2aWV3c1wiXX0sIG93bmVyOiB1c2VySWR9KVxyXG4iLCJNZXRlb3IucHVibGlzaCBcInJlbGF0ZWRfb2JqZWN0c19yZWNvcmRzXCIsIChvYmplY3RfbmFtZSwgcmVsYXRlZF9vYmplY3RfbmFtZSwgcmVsYXRlZF9maWVsZF9uYW1lLCByZWNvcmRfaWQsIHNwYWNlSWQpLT5cclxuXHR1c2VySWQgPSB0aGlzLnVzZXJJZFxyXG5cdGlmIHJlbGF0ZWRfb2JqZWN0X25hbWUgPT0gXCJjZnMuZmlsZXMuZmlsZXJlY29yZFwiXHJcblx0XHRzZWxlY3RvciA9IHtcIm1ldGFkYXRhLnNwYWNlXCI6IHNwYWNlSWR9XHJcblx0ZWxzZVxyXG5cdFx0c2VsZWN0b3IgPSB7c3BhY2U6IHNwYWNlSWR9XHJcblx0XHJcblx0aWYgcmVsYXRlZF9vYmplY3RfbmFtZSA9PSBcImNtc19maWxlc1wiXHJcblx0XHQjIOmZhOS7tueahOWFs+iBlOaQnOe0ouadoeS7tuaYr+Wumuatu+eahFxyXG5cdFx0c2VsZWN0b3JbXCJwYXJlbnQub1wiXSA9IG9iamVjdF9uYW1lXHJcblx0XHRzZWxlY3RvcltcInBhcmVudC5pZHNcIl0gPSBbcmVjb3JkX2lkXVxyXG5cdGVsc2VcclxuXHRcdHNlbGVjdG9yW3JlbGF0ZWRfZmllbGRfbmFtZV0gPSByZWNvcmRfaWRcclxuXHJcblx0cGVybWlzc2lvbnMgPSBDcmVhdG9yLmdldFBlcm1pc3Npb25zKHJlbGF0ZWRfb2JqZWN0X25hbWUsIHNwYWNlSWQsIHVzZXJJZClcclxuXHRpZiAhcGVybWlzc2lvbnMudmlld0FsbFJlY29yZHMgYW5kIHBlcm1pc3Npb25zLmFsbG93UmVhZFxyXG5cdFx0c2VsZWN0b3Iub3duZXIgPSB1c2VySWRcclxuXHRcclxuXHRyZXR1cm4gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKHJlbGF0ZWRfb2JqZWN0X25hbWUpLmZpbmQoc2VsZWN0b3IpIiwiTWV0ZW9yLnB1Ymxpc2goXCJyZWxhdGVkX29iamVjdHNfcmVjb3Jkc1wiLCBmdW5jdGlvbihvYmplY3RfbmFtZSwgcmVsYXRlZF9vYmplY3RfbmFtZSwgcmVsYXRlZF9maWVsZF9uYW1lLCByZWNvcmRfaWQsIHNwYWNlSWQpIHtcbiAgdmFyIHBlcm1pc3Npb25zLCBzZWxlY3RvciwgdXNlcklkO1xuICB1c2VySWQgPSB0aGlzLnVzZXJJZDtcbiAgaWYgKHJlbGF0ZWRfb2JqZWN0X25hbWUgPT09IFwiY2ZzLmZpbGVzLmZpbGVyZWNvcmRcIikge1xuICAgIHNlbGVjdG9yID0ge1xuICAgICAgXCJtZXRhZGF0YS5zcGFjZVwiOiBzcGFjZUlkXG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBzZWxlY3RvciA9IHtcbiAgICAgIHNwYWNlOiBzcGFjZUlkXG4gICAgfTtcbiAgfVxuICBpZiAocmVsYXRlZF9vYmplY3RfbmFtZSA9PT0gXCJjbXNfZmlsZXNcIikge1xuICAgIHNlbGVjdG9yW1wicGFyZW50Lm9cIl0gPSBvYmplY3RfbmFtZTtcbiAgICBzZWxlY3RvcltcInBhcmVudC5pZHNcIl0gPSBbcmVjb3JkX2lkXTtcbiAgfSBlbHNlIHtcbiAgICBzZWxlY3RvcltyZWxhdGVkX2ZpZWxkX25hbWVdID0gcmVjb3JkX2lkO1xuICB9XG4gIHBlcm1pc3Npb25zID0gQ3JlYXRvci5nZXRQZXJtaXNzaW9ucyhyZWxhdGVkX29iamVjdF9uYW1lLCBzcGFjZUlkLCB1c2VySWQpO1xuICBpZiAoIXBlcm1pc3Npb25zLnZpZXdBbGxSZWNvcmRzICYmIHBlcm1pc3Npb25zLmFsbG93UmVhZCkge1xuICAgIHNlbGVjdG9yLm93bmVyID0gdXNlcklkO1xuICB9XG4gIHJldHVybiBDcmVhdG9yLmdldENvbGxlY3Rpb24ocmVsYXRlZF9vYmplY3RfbmFtZSkuZmluZChzZWxlY3Rvcik7XG59KTtcbiIsIk1ldGVvci5wdWJsaXNoICdzcGFjZV91c2VyX2luZm8nLCAoc3BhY2VJZCwgdXNlcklkKS0+XHJcblx0cmV0dXJuIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInNwYWNlX3VzZXJzXCIpLmZpbmQoe3NwYWNlOiBzcGFjZUlkLCB1c2VyOiB1c2VySWR9KSIsIlxyXG5pZiBNZXRlb3IuaXNTZXJ2ZXJcclxuXHJcblx0TWV0ZW9yLnB1Ymxpc2ggJ2NvbnRhY3RzX3ZpZXdfbGltaXRzJywgKHNwYWNlSWQpLT5cclxuXHJcblx0XHR1bmxlc3MgdGhpcy51c2VySWRcclxuXHRcdFx0cmV0dXJuIHRoaXMucmVhZHkoKVxyXG5cclxuXHRcdHVubGVzcyBzcGFjZUlkXHJcblx0XHRcdHJldHVybiB0aGlzLnJlYWR5KClcclxuXHJcblx0XHRzZWxlY3RvciA9XHJcblx0XHRcdHNwYWNlOiBzcGFjZUlkXHJcblx0XHRcdGtleTogJ2NvbnRhY3RzX3ZpZXdfbGltaXRzJ1xyXG5cclxuXHRcdHJldHVybiBkYi5zcGFjZV9zZXR0aW5ncy5maW5kKHNlbGVjdG9yKSIsImlmIChNZXRlb3IuaXNTZXJ2ZXIpIHtcbiAgTWV0ZW9yLnB1Ymxpc2goJ2NvbnRhY3RzX3ZpZXdfbGltaXRzJywgZnVuY3Rpb24oc3BhY2VJZCkge1xuICAgIHZhciBzZWxlY3RvcjtcbiAgICBpZiAoIXRoaXMudXNlcklkKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZWFkeSgpO1xuICAgIH1cbiAgICBpZiAoIXNwYWNlSWQpIHtcbiAgICAgIHJldHVybiB0aGlzLnJlYWR5KCk7XG4gICAgfVxuICAgIHNlbGVjdG9yID0ge1xuICAgICAgc3BhY2U6IHNwYWNlSWQsXG4gICAgICBrZXk6ICdjb250YWN0c192aWV3X2xpbWl0cydcbiAgICB9O1xuICAgIHJldHVybiBkYi5zcGFjZV9zZXR0aW5ncy5maW5kKHNlbGVjdG9yKTtcbiAgfSk7XG59XG4iLCJcclxuaWYgTWV0ZW9yLmlzU2VydmVyXHJcblxyXG5cdE1ldGVvci5wdWJsaXNoICdjb250YWN0c19ub19mb3JjZV9waG9uZV91c2VycycsIChzcGFjZUlkKS0+XHJcblxyXG5cdFx0dW5sZXNzIHRoaXMudXNlcklkXHJcblx0XHRcdHJldHVybiB0aGlzLnJlYWR5KClcclxuXHJcblx0XHR1bmxlc3Mgc3BhY2VJZFxyXG5cdFx0XHRyZXR1cm4gdGhpcy5yZWFkeSgpXHJcblxyXG5cdFx0c2VsZWN0b3IgPVxyXG5cdFx0XHRzcGFjZTogc3BhY2VJZFxyXG5cdFx0XHRrZXk6ICdjb250YWN0c19ub19mb3JjZV9waG9uZV91c2VycydcclxuXHJcblx0XHRyZXR1cm4gZGIuc3BhY2Vfc2V0dGluZ3MuZmluZChzZWxlY3RvcikiLCJpZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG4gIE1ldGVvci5wdWJsaXNoKCdjb250YWN0c19ub19mb3JjZV9waG9uZV91c2VycycsIGZ1bmN0aW9uKHNwYWNlSWQpIHtcbiAgICB2YXIgc2VsZWN0b3I7XG4gICAgaWYgKCF0aGlzLnVzZXJJZCkge1xuICAgICAgcmV0dXJuIHRoaXMucmVhZHkoKTtcbiAgICB9XG4gICAgaWYgKCFzcGFjZUlkKSB7XG4gICAgICByZXR1cm4gdGhpcy5yZWFkeSgpO1xuICAgIH1cbiAgICBzZWxlY3RvciA9IHtcbiAgICAgIHNwYWNlOiBzcGFjZUlkLFxuICAgICAga2V5OiAnY29udGFjdHNfbm9fZm9yY2VfcGhvbmVfdXNlcnMnXG4gICAgfTtcbiAgICByZXR1cm4gZGIuc3BhY2Vfc2V0dGluZ3MuZmluZChzZWxlY3Rvcik7XG4gIH0pO1xufVxuIiwiaWYgTWV0ZW9yLmlzU2VydmVyXHJcblx0TWV0ZW9yLnB1Ymxpc2ggJ3NwYWNlX25lZWRfdG9fY29uZmlybScsICgpLT5cclxuXHRcdHVzZXJJZCA9IHRoaXMudXNlcklkXHJcblx0XHRyZXR1cm4gZGIuc3BhY2VfdXNlcnMuZmluZCh7dXNlcjogdXNlcklkLCBpbnZpdGVfc3RhdGU6IFwicGVuZGluZ1wifSkiLCJpZiAoTWV0ZW9yLmlzU2VydmVyKSB7XG4gIE1ldGVvci5wdWJsaXNoKCdzcGFjZV9uZWVkX3RvX2NvbmZpcm0nLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgdXNlcklkO1xuICAgIHVzZXJJZCA9IHRoaXMudXNlcklkO1xuICAgIHJldHVybiBkYi5zcGFjZV91c2Vycy5maW5kKHtcbiAgICAgIHVzZXI6IHVzZXJJZCxcbiAgICAgIGludml0ZV9zdGF0ZTogXCJwZW5kaW5nXCJcbiAgICB9KTtcbiAgfSk7XG59XG4iLCJwZXJtaXNzaW9uTWFuYWdlckZvckluaXRBcHByb3ZhbCA9IHt9XHJcblxyXG5wZXJtaXNzaW9uTWFuYWdlckZvckluaXRBcHByb3ZhbC5nZXRGbG93UGVybWlzc2lvbnMgPSAoZmxvd19pZCwgdXNlcl9pZCkgLT5cclxuXHQjIOagueaNrjpmbG93X2lk5p+l5Yiw5a+55bqU55qEZmxvd1xyXG5cdGZsb3cgPSB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmdldEZsb3coZmxvd19pZClcclxuXHRzcGFjZV9pZCA9IGZsb3cuc3BhY2VcclxuXHQjIOagueaNrnNwYWNlX2lk5ZKMOnVzZXJfaWTliLBvcmdhbml6YXRpb25z6KGo5Lit5p+l5Yiw55So5oi35omA5bGe5omA5pyJ55qEb3JnX2lk77yI5YyF5ous5LiK57qn57uESUTvvIlcclxuXHRvcmdfaWRzID0gbmV3IEFycmF5XHJcblx0b3JnYW5pemF0aW9ucyA9IGRiLm9yZ2FuaXphdGlvbnMuZmluZCh7XHJcblx0XHRzcGFjZTogc3BhY2VfaWQsIHVzZXJzOiB1c2VyX2lkIH0sIHsgZmllbGRzOiB7IHBhcmVudHM6IDEgfSB9KS5mZXRjaCgpXHJcblx0Xy5lYWNoKG9yZ2FuaXphdGlvbnMsIChvcmcpIC0+XHJcblx0XHRvcmdfaWRzLnB1c2gob3JnLl9pZClcclxuXHRcdGlmIG9yZy5wYXJlbnRzXHJcblx0XHRcdF8uZWFjaChvcmcucGFyZW50cywgKHBhcmVudF9pZCkgLT5cclxuXHRcdFx0XHRvcmdfaWRzLnB1c2gocGFyZW50X2lkKVxyXG5cdFx0XHQpXHJcblx0KVxyXG5cdG9yZ19pZHMgPSBfLnVuaXEob3JnX2lkcylcclxuXHRteV9wZXJtaXNzaW9ucyA9IG5ldyBBcnJheVxyXG5cdGlmIGZsb3cucGVybXNcclxuXHRcdCMg5Yik5patZmxvdy5wZXJtcy51c2Vyc19jYW5fYWRtaW7kuK3mmK/lkKbljIXlkKvlvZPliY3nlKjmiLfvvIxcclxuXHRcdCMg5oiW6ICFZmxvdy5wZXJtcy5vcmdzX2Nhbl9hZGTmmK/lkKbljIXlkKs05q2l5b6X5Yiw55qEb3JnX2lk5pWw57uE5Lit55qE5Lu75L2V5LiA5Liq77yMXHJcblx0XHQjIOiLpeaYr++8jOWImeWcqOi/lOWbnueahOaVsOe7hOS4reWKoOS4imFkZFxyXG5cdFx0aWYgZmxvdy5wZXJtcy51c2Vyc19jYW5fYWRkXHJcblx0XHRcdHVzZXJzX2Nhbl9hZGQgPSBmbG93LnBlcm1zLnVzZXJzX2Nhbl9hZGRcclxuXHRcdFx0aWYgdXNlcnNfY2FuX2FkZC5pbmNsdWRlcyh1c2VyX2lkKVxyXG5cdFx0XHRcdG15X3Blcm1pc3Npb25zLnB1c2goXCJhZGRcIilcclxuXHJcblx0XHRpZiBmbG93LnBlcm1zLm9yZ3NfY2FuX2FkZFxyXG5cdFx0XHRvcmdzX2Nhbl9hZGQgPSBmbG93LnBlcm1zLm9yZ3NfY2FuX2FkZFxyXG5cdFx0XHRfLmVhY2gob3JnX2lkcywgKG9yZ19pZCkgLT5cclxuXHRcdFx0XHRpZiBvcmdzX2Nhbl9hZGQuaW5jbHVkZXMob3JnX2lkKVxyXG5cdFx0XHRcdFx0bXlfcGVybWlzc2lvbnMucHVzaChcImFkZFwiKVxyXG5cdFx0XHQpXHJcblx0XHQjIOWIpOaWrWZsb3cucGVybXMudXNlcnNfY2FuX21vbml0b3LkuK3mmK/lkKbljIXlkKvlvZPliY3nlKjmiLfvvIxcclxuXHRcdCMg5oiW6ICFZmxvdy5wZXJtcy5vcmdzX2Nhbl9tb25pdG9y5piv5ZCm5YyF5ZCrNOatpeW+l+WIsOeahG9yZ19pZOaVsOe7hOS4reeahOS7u+S9leS4gOS4qu+8jFxyXG5cdFx0IyDoi6XmmK/vvIzliJnlnKjov5Tlm57nmoTmlbDnu4TkuK3liqDkuIptb25pdG9yXHJcblx0XHRpZiBmbG93LnBlcm1zLnVzZXJzX2Nhbl9tb25pdG9yXHJcblx0XHRcdHVzZXJzX2Nhbl9tb25pdG9yID0gZmxvdy5wZXJtcy51c2Vyc19jYW5fbW9uaXRvclxyXG5cdFx0XHRpZiB1c2Vyc19jYW5fbW9uaXRvci5pbmNsdWRlcyh1c2VyX2lkKVxyXG5cdFx0XHRcdG15X3Blcm1pc3Npb25zLnB1c2goXCJtb25pdG9yXCIpXHJcblxyXG5cdFx0aWYgZmxvdy5wZXJtcy5vcmdzX2Nhbl9tb25pdG9yXHJcblx0XHRcdG9yZ3NfY2FuX21vbml0b3IgPSBmbG93LnBlcm1zLm9yZ3NfY2FuX21vbml0b3JcclxuXHRcdFx0Xy5lYWNoKG9yZ19pZHMsIChvcmdfaWQpIC0+XHJcblx0XHRcdFx0aWYgb3Jnc19jYW5fbW9uaXRvci5pbmNsdWRlcyhvcmdfaWQpXHJcblx0XHRcdFx0XHRteV9wZXJtaXNzaW9ucy5wdXNoKFwibW9uaXRvclwiKVxyXG5cdFx0XHQpXHJcblx0XHQjIOWIpOaWrWZsb3cucGVybXMudXNlcnNfY2FuX2FkbWlu5Lit5piv5ZCm5YyF5ZCr5b2T5YmN55So5oi377yMXHJcblx0XHQjIOaIluiAhWZsb3cucGVybXMub3Jnc19jYW5fYWRtaW7mmK/lkKbljIXlkKs05q2l5b6X5Yiw55qEb3JnX2lk5pWw57uE5Lit55qE5Lu75L2V5LiA5Liq77yMXHJcblx0XHQjIOiLpeaYr++8jOWImeWcqOi/lOWbnueahOaVsOe7hOS4reWKoOS4imFkbWluXHJcblx0XHRpZiBmbG93LnBlcm1zLnVzZXJzX2Nhbl9hZG1pblxyXG5cdFx0XHR1c2Vyc19jYW5fYWRtaW4gPSBmbG93LnBlcm1zLnVzZXJzX2Nhbl9hZG1pblxyXG5cdFx0XHRpZiB1c2Vyc19jYW5fYWRtaW4uaW5jbHVkZXModXNlcl9pZClcclxuXHRcdFx0XHRteV9wZXJtaXNzaW9ucy5wdXNoKFwiYWRtaW5cIilcclxuXHJcblx0XHRpZiBmbG93LnBlcm1zLm9yZ3NfY2FuX2FkbWluXHJcblx0XHRcdG9yZ3NfY2FuX2FkbWluID0gZmxvdy5wZXJtcy5vcmdzX2Nhbl9hZG1pblxyXG5cdFx0XHRfLmVhY2gob3JnX2lkcywgKG9yZ19pZCkgLT5cclxuXHRcdFx0XHRpZiBvcmdzX2Nhbl9hZG1pbi5pbmNsdWRlcyhvcmdfaWQpXHJcblx0XHRcdFx0XHRteV9wZXJtaXNzaW9ucy5wdXNoKFwiYWRtaW5cIilcclxuXHRcdFx0KVxyXG5cclxuXHRteV9wZXJtaXNzaW9ucyA9IF8udW5pcShteV9wZXJtaXNzaW9ucylcclxuXHRyZXR1cm4gbXlfcGVybWlzc2lvbnMiLCIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cbnBlcm1pc3Npb25NYW5hZ2VyRm9ySW5pdEFwcHJvdmFsID0ge307XG5cbnBlcm1pc3Npb25NYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmdldEZsb3dQZXJtaXNzaW9ucyA9IGZ1bmN0aW9uKGZsb3dfaWQsIHVzZXJfaWQpIHtcbiAgdmFyIGZsb3csIG15X3Blcm1pc3Npb25zLCBvcmdfaWRzLCBvcmdhbml6YXRpb25zLCBvcmdzX2Nhbl9hZGQsIG9yZ3NfY2FuX2FkbWluLCBvcmdzX2Nhbl9tb25pdG9yLCBzcGFjZV9pZCwgdXNlcnNfY2FuX2FkZCwgdXNlcnNfY2FuX2FkbWluLCB1c2Vyc19jYW5fbW9uaXRvcjtcbiAgZmxvdyA9IHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0RmxvdyhmbG93X2lkKTtcbiAgc3BhY2VfaWQgPSBmbG93LnNwYWNlO1xuICBvcmdfaWRzID0gbmV3IEFycmF5O1xuICBvcmdhbml6YXRpb25zID0gZGIub3JnYW5pemF0aW9ucy5maW5kKHtcbiAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgdXNlcnM6IHVzZXJfaWRcbiAgfSwge1xuICAgIGZpZWxkczoge1xuICAgICAgcGFyZW50czogMVxuICAgIH1cbiAgfSkuZmV0Y2goKTtcbiAgXy5lYWNoKG9yZ2FuaXphdGlvbnMsIGZ1bmN0aW9uKG9yZykge1xuICAgIG9yZ19pZHMucHVzaChvcmcuX2lkKTtcbiAgICBpZiAob3JnLnBhcmVudHMpIHtcbiAgICAgIHJldHVybiBfLmVhY2gob3JnLnBhcmVudHMsIGZ1bmN0aW9uKHBhcmVudF9pZCkge1xuICAgICAgICByZXR1cm4gb3JnX2lkcy5wdXNoKHBhcmVudF9pZCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuICBvcmdfaWRzID0gXy51bmlxKG9yZ19pZHMpO1xuICBteV9wZXJtaXNzaW9ucyA9IG5ldyBBcnJheTtcbiAgaWYgKGZsb3cucGVybXMpIHtcbiAgICBpZiAoZmxvdy5wZXJtcy51c2Vyc19jYW5fYWRkKSB7XG4gICAgICB1c2Vyc19jYW5fYWRkID0gZmxvdy5wZXJtcy51c2Vyc19jYW5fYWRkO1xuICAgICAgaWYgKHVzZXJzX2Nhbl9hZGQuaW5jbHVkZXModXNlcl9pZCkpIHtcbiAgICAgICAgbXlfcGVybWlzc2lvbnMucHVzaChcImFkZFwiKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGZsb3cucGVybXMub3Jnc19jYW5fYWRkKSB7XG4gICAgICBvcmdzX2Nhbl9hZGQgPSBmbG93LnBlcm1zLm9yZ3NfY2FuX2FkZDtcbiAgICAgIF8uZWFjaChvcmdfaWRzLCBmdW5jdGlvbihvcmdfaWQpIHtcbiAgICAgICAgaWYgKG9yZ3NfY2FuX2FkZC5pbmNsdWRlcyhvcmdfaWQpKSB7XG4gICAgICAgICAgcmV0dXJuIG15X3Blcm1pc3Npb25zLnB1c2goXCJhZGRcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoZmxvdy5wZXJtcy51c2Vyc19jYW5fbW9uaXRvcikge1xuICAgICAgdXNlcnNfY2FuX21vbml0b3IgPSBmbG93LnBlcm1zLnVzZXJzX2Nhbl9tb25pdG9yO1xuICAgICAgaWYgKHVzZXJzX2Nhbl9tb25pdG9yLmluY2x1ZGVzKHVzZXJfaWQpKSB7XG4gICAgICAgIG15X3Blcm1pc3Npb25zLnB1c2goXCJtb25pdG9yXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZmxvdy5wZXJtcy5vcmdzX2Nhbl9tb25pdG9yKSB7XG4gICAgICBvcmdzX2Nhbl9tb25pdG9yID0gZmxvdy5wZXJtcy5vcmdzX2Nhbl9tb25pdG9yO1xuICAgICAgXy5lYWNoKG9yZ19pZHMsIGZ1bmN0aW9uKG9yZ19pZCkge1xuICAgICAgICBpZiAob3Jnc19jYW5fbW9uaXRvci5pbmNsdWRlcyhvcmdfaWQpKSB7XG4gICAgICAgICAgcmV0dXJuIG15X3Blcm1pc3Npb25zLnB1c2goXCJtb25pdG9yXCIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGZsb3cucGVybXMudXNlcnNfY2FuX2FkbWluKSB7XG4gICAgICB1c2Vyc19jYW5fYWRtaW4gPSBmbG93LnBlcm1zLnVzZXJzX2Nhbl9hZG1pbjtcbiAgICAgIGlmICh1c2Vyc19jYW5fYWRtaW4uaW5jbHVkZXModXNlcl9pZCkpIHtcbiAgICAgICAgbXlfcGVybWlzc2lvbnMucHVzaChcImFkbWluXCIpO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoZmxvdy5wZXJtcy5vcmdzX2Nhbl9hZG1pbikge1xuICAgICAgb3Jnc19jYW5fYWRtaW4gPSBmbG93LnBlcm1zLm9yZ3NfY2FuX2FkbWluO1xuICAgICAgXy5lYWNoKG9yZ19pZHMsIGZ1bmN0aW9uKG9yZ19pZCkge1xuICAgICAgICBpZiAob3Jnc19jYW5fYWRtaW4uaW5jbHVkZXMob3JnX2lkKSkge1xuICAgICAgICAgIHJldHVybiBteV9wZXJtaXNzaW9ucy5wdXNoKFwiYWRtaW5cIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuICBteV9wZXJtaXNzaW9ucyA9IF8udW5pcShteV9wZXJtaXNzaW9ucyk7XG4gIHJldHVybiBteV9wZXJtaXNzaW9ucztcbn07XG4iLCJfZXZhbCA9IHJlcXVpcmUoJ2V2YWwnKVxyXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsID0ge31cclxuXHJcbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuY2hlY2tfYXV0aG9yaXphdGlvbiA9IChyZXEpIC0+XHJcblx0cXVlcnkgPSByZXEucXVlcnlcclxuXHR1c2VySWQgPSBxdWVyeVtcIlgtVXNlci1JZFwiXVxyXG5cdGF1dGhUb2tlbiA9IHF1ZXJ5W1wiWC1BdXRoLVRva2VuXCJdXHJcblxyXG5cdGlmIG5vdCB1c2VySWQgb3Igbm90IGF1dGhUb2tlblxyXG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvciA0MDEsICdVbmF1dGhvcml6ZWQnXHJcblxyXG5cdGhhc2hlZFRva2VuID0gQWNjb3VudHMuX2hhc2hMb2dpblRva2VuKGF1dGhUb2tlbilcclxuXHR1c2VyID0gTWV0ZW9yLnVzZXJzLmZpbmRPbmVcclxuXHRcdF9pZDogdXNlcklkLFxyXG5cdFx0XCJzZXJ2aWNlcy5yZXN1bWUubG9naW5Ub2tlbnMuaGFzaGVkVG9rZW5cIjogaGFzaGVkVG9rZW5cclxuXHJcblx0aWYgbm90IHVzZXJcclxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IgNDAxLCAnVW5hdXRob3JpemVkJ1xyXG5cclxuXHRyZXR1cm4gdXNlclxyXG5cclxudXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5nZXRTcGFjZSA9IChzcGFjZV9pZCkgLT5cclxuXHRzcGFjZSA9IENyZWF0b3IuQ29sbGVjdGlvbnMuc3BhY2VzLmZpbmRPbmUoc3BhY2VfaWQpXHJcblx0aWYgbm90IHNwYWNlXHJcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvciEnLCBcInNwYWNlX2lk5pyJ6K+v5oiW5q2kc3BhY2Xlt7Lnu4/ooqvliKDpmaRcIilcclxuXHRyZXR1cm4gc3BhY2VcclxuXHJcbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0RmxvdyA9IChmbG93X2lkKSAtPlxyXG5cdGZsb3cgPSBDcmVhdG9yLkNvbGxlY3Rpb25zLmZsb3dzLmZpbmRPbmUoZmxvd19pZClcclxuXHRpZiBub3QgZmxvd1xyXG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3IhJywgXCJpZOacieivr+aIluatpOa1geeoi+W3sue7j+iiq+WIoOmZpFwiKVxyXG5cdHJldHVybiBmbG93XHJcblxyXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmdldFNwYWNlVXNlciA9IChzcGFjZV9pZCwgdXNlcl9pZCkgLT5cclxuXHRzcGFjZV91c2VyID0gQ3JlYXRvci5Db2xsZWN0aW9ucy5zcGFjZV91c2Vycy5maW5kT25lKHsgc3BhY2U6IHNwYWNlX2lkLCB1c2VyOiB1c2VyX2lkIH0pXHJcblx0aWYgbm90IHNwYWNlX3VzZXJcclxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yIScsIFwidXNlcl9pZOWvueW6lOeahOeUqOaIt+S4jeWxnuS6juW9k+WJjXNwYWNlXCIpXHJcblx0cmV0dXJuIHNwYWNlX3VzZXJcclxuXHJcbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0U3BhY2VVc2VyT3JnSW5mbyA9IChzcGFjZV91c2VyKSAtPlxyXG5cdGluZm8gPSBuZXcgT2JqZWN0XHJcblx0aW5mby5vcmdhbml6YXRpb24gPSBzcGFjZV91c2VyLm9yZ2FuaXphdGlvblxyXG5cdG9yZyA9IENyZWF0b3IuQ29sbGVjdGlvbnMub3JnYW5pemF0aW9ucy5maW5kT25lKHNwYWNlX3VzZXIub3JnYW5pemF0aW9uLCB7IGZpZWxkczogeyBuYW1lOiAxICwgZnVsbG5hbWU6IDEgfSB9KVxyXG5cdGluZm8ub3JnYW5pemF0aW9uX25hbWUgPSBvcmcubmFtZVxyXG5cdGluZm8ub3JnYW5pemF0aW9uX2Z1bGxuYW1lID0gb3JnLmZ1bGxuYW1lXHJcblx0cmV0dXJuIGluZm9cclxuXHJcbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuaXNGbG93RW5hYmxlZCA9IChmbG93KSAtPlxyXG5cdGlmIGZsb3cuc3RhdGUgaXNudCBcImVuYWJsZWRcIlxyXG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3IhJywgXCLmtYHnqIvmnKrlkK/nlKgs5pON5L2c5aSx6LSlXCIpXHJcblxyXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmlzRmxvd1NwYWNlTWF0Y2hlZCA9IChmbG93LCBzcGFjZV9pZCkgLT5cclxuXHRpZiBmbG93LnNwYWNlIGlzbnQgc3BhY2VfaWRcclxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yIScsIFwi5rWB56iL5ZKM5bel5L2c5Yy6SUTkuI3ljLnphY1cIilcclxuXHJcbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0Rm9ybSA9IChmb3JtX2lkKSAtPlxyXG5cdGZvcm0gPSBDcmVhdG9yLkNvbGxlY3Rpb25zLmZvcm1zLmZpbmRPbmUoZm9ybV9pZClcclxuXHRpZiBub3QgZm9ybVxyXG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3IhJywgJ+ihqOWNlUlE5pyJ6K+v5oiW5q2k6KGo5Y2V5bey57uP6KKr5Yig6ZmkJylcclxuXHJcblx0cmV0dXJuIGZvcm1cclxuXHJcbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0Q2F0ZWdvcnkgPSAoY2F0ZWdvcnlfaWQpIC0+XHJcblx0cmV0dXJuIENyZWF0b3IuQ29sbGVjdGlvbnMuY2F0ZWdvcmllcy5maW5kT25lKGNhdGVnb3J5X2lkKVxyXG5cclxudXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5jcmVhdGVfaW5zdGFuY2UgPSAoaW5zdGFuY2VfZnJvbV9jbGllbnQsIHVzZXJfaW5mbykgLT5cclxuXHRjaGVjayBpbnN0YW5jZV9mcm9tX2NsaWVudFtcImFwcGxpY2FudFwiXSwgU3RyaW5nXHJcblx0Y2hlY2sgaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJzcGFjZVwiXSwgU3RyaW5nXHJcblx0Y2hlY2sgaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJmbG93XCJdLCBTdHJpbmdcclxuXHRjaGVjayBpbnN0YW5jZV9mcm9tX2NsaWVudFtcInJlY29yZF9pZHNcIl0sIFt7bzogU3RyaW5nLCBpZHM6IFtTdHJpbmddfV1cclxuXHJcblx0IyDmoKHpqozmmK/lkKZyZWNvcmTlt7Lnu4/lj5HotbfnmoTnlLPor7fov5jlnKjlrqHmibnkuK1cclxuXHR1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmNoZWNrSXNJbkFwcHJvdmFsKGluc3RhbmNlX2Zyb21fY2xpZW50W1wicmVjb3JkX2lkc1wiXVswXSwgaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJzcGFjZVwiXSlcclxuXHJcblx0c3BhY2VfaWQgPSBpbnN0YW5jZV9mcm9tX2NsaWVudFtcInNwYWNlXCJdXHJcblx0Zmxvd19pZCA9IGluc3RhbmNlX2Zyb21fY2xpZW50W1wiZmxvd1wiXVxyXG5cdHVzZXJfaWQgPSB1c2VyX2luZm8uX2lkXHJcblx0IyDojrflj5bliY3lj7DmiYDkvKDnmoR0cmFjZVxyXG5cdHRyYWNlX2Zyb21fY2xpZW50ID0gbnVsbFxyXG5cdCMg6I635Y+W5YmN5Y+w5omA5Lyg55qEYXBwcm92ZVxyXG5cdGFwcHJvdmVfZnJvbV9jbGllbnQgPSBudWxsXHJcblx0aWYgaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJ0cmFjZXNcIl0gYW5kIGluc3RhbmNlX2Zyb21fY2xpZW50W1widHJhY2VzXCJdWzBdXHJcblx0XHR0cmFjZV9mcm9tX2NsaWVudCA9IGluc3RhbmNlX2Zyb21fY2xpZW50W1widHJhY2VzXCJdWzBdXHJcblx0XHRpZiB0cmFjZV9mcm9tX2NsaWVudFtcImFwcHJvdmVzXCJdIGFuZCB0cmFjZV9mcm9tX2NsaWVudFtcImFwcHJvdmVzXCJdWzBdXHJcblx0XHRcdGFwcHJvdmVfZnJvbV9jbGllbnQgPSBpbnN0YW5jZV9mcm9tX2NsaWVudFtcInRyYWNlc1wiXVswXVtcImFwcHJvdmVzXCJdWzBdXHJcblxyXG5cdCMg6I635Y+W5LiA5Liqc3BhY2VcclxuXHRzcGFjZSA9IHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0U3BhY2Uoc3BhY2VfaWQpXHJcblx0IyDojrflj5bkuIDkuKpmbG93XHJcblx0ZmxvdyA9IHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0RmxvdyhmbG93X2lkKVxyXG5cdCMg6I635Y+W5LiA5Liqc3BhY2XkuIvnmoTkuIDkuKp1c2VyXHJcblx0c3BhY2VfdXNlciA9IHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0U3BhY2VVc2VyKHNwYWNlX2lkLCB1c2VyX2lkKVxyXG5cdCMg6I635Y+Wc3BhY2VfdXNlcuaJgOWcqOeahOmDqOmXqOS/oeaBr1xyXG5cdHNwYWNlX3VzZXJfb3JnX2luZm8gPSB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmdldFNwYWNlVXNlck9yZ0luZm8oc3BhY2VfdXNlcilcclxuXHQjIOWIpOaWreS4gOS4qmZsb3fmmK/lkKbkuLrlkK/nlKjnirbmgIFcclxuXHR1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmlzRmxvd0VuYWJsZWQoZmxvdylcclxuXHQjIOWIpOaWreS4gOS4qmZsb3flkoxzcGFjZV9pZOaYr+WQpuWMuemFjVxyXG5cdHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuaXNGbG93U3BhY2VNYXRjaGVkKGZsb3csIHNwYWNlX2lkKVxyXG5cclxuXHRmb3JtID0gdXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5nZXRGb3JtKGZsb3cuZm9ybSlcclxuXHJcblx0cGVybWlzc2lvbnMgPSBwZXJtaXNzaW9uTWFuYWdlci5nZXRGbG93UGVybWlzc2lvbnMoZmxvd19pZCwgdXNlcl9pZClcclxuXHJcblx0aWYgbm90IHBlcm1pc3Npb25zLmluY2x1ZGVzKFwiYWRkXCIpXHJcblx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvciEnLCBcIuW9k+WJjeeUqOaIt+ayoeacieatpOa1geeoi+eahOaWsOW7uuadg+mZkFwiKVxyXG5cclxuXHRub3cgPSBuZXcgRGF0ZVxyXG5cdGluc19vYmogPSB7fVxyXG5cdGluc19vYmouX2lkID0gQ3JlYXRvci5Db2xsZWN0aW9ucy5pbnN0YW5jZXMuX21ha2VOZXdJRCgpXHJcblx0aW5zX29iai5zcGFjZSA9IHNwYWNlX2lkXHJcblx0aW5zX29iai5mbG93ID0gZmxvd19pZFxyXG5cdGluc19vYmouZmxvd192ZXJzaW9uID0gZmxvdy5jdXJyZW50Ll9pZFxyXG5cdGluc19vYmouZm9ybSA9IGZsb3cuZm9ybVxyXG5cdGluc19vYmouZm9ybV92ZXJzaW9uID0gZmxvdy5jdXJyZW50LmZvcm1fdmVyc2lvblxyXG5cdGluc19vYmoubmFtZSA9IGZsb3cubmFtZVxyXG5cdGluc19vYmouc3VibWl0dGVyID0gdXNlcl9pZFxyXG5cdGluc19vYmouc3VibWl0dGVyX25hbWUgPSB1c2VyX2luZm8ubmFtZVxyXG5cdGluc19vYmouYXBwbGljYW50ID0gaWYgaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRcIl0gdGhlbiBpbnN0YW5jZV9mcm9tX2NsaWVudFtcImFwcGxpY2FudFwiXSBlbHNlIHVzZXJfaWRcclxuXHRpbnNfb2JqLmFwcGxpY2FudF9uYW1lID0gaWYgaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRfbmFtZVwiXSB0aGVuIGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50X25hbWVcIl0gZWxzZSB1c2VyX2luZm8ubmFtZVxyXG5cdGluc19vYmouYXBwbGljYW50X29yZ2FuaXphdGlvbiA9IGlmIGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50X29yZ2FuaXphdGlvblwiXSB0aGVuIGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50X29yZ2FuaXphdGlvblwiXSBlbHNlIHNwYWNlX3VzZXIub3JnYW5pemF0aW9uXHJcblx0aW5zX29iai5hcHBsaWNhbnRfb3JnYW5pemF0aW9uX25hbWUgPSBpZiBpbnN0YW5jZV9mcm9tX2NsaWVudFtcImFwcGxpY2FudF9vcmdhbml6YXRpb25fbmFtZVwiXSB0aGVuIGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50X29yZ2FuaXphdGlvbl9uYW1lXCJdIGVsc2Ugc3BhY2VfdXNlcl9vcmdfaW5mby5vcmdhbml6YXRpb25fbmFtZVxyXG5cdGluc19vYmouYXBwbGljYW50X29yZ2FuaXphdGlvbl9mdWxsbmFtZSA9IGlmIGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50X29yZ2FuaXphdGlvbl9mdWxsbmFtZVwiXSB0aGVuIGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50X29yZ2FuaXphdGlvbl9mdWxsbmFtZVwiXSBlbHNlICBzcGFjZV91c2VyX29yZ19pbmZvLm9yZ2FuaXphdGlvbl9mdWxsbmFtZVxyXG5cdGluc19vYmouYXBwbGljYW50X2NvbXBhbnkgPSBpZiBpbnN0YW5jZV9mcm9tX2NsaWVudFtcImFwcGxpY2FudF9jb21wYW55XCJdIHRoZW4gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRfY29tcGFueVwiXSBlbHNlIHNwYWNlX3VzZXIuY29tcGFueV9pZFxyXG5cdGluc19vYmouc3RhdGUgPSAnZHJhZnQnXHJcblx0aW5zX29iai5jb2RlID0gJydcclxuXHRpbnNfb2JqLmlzX2FyY2hpdmVkID0gZmFsc2VcclxuXHRpbnNfb2JqLmlzX2RlbGV0ZWQgPSBmYWxzZVxyXG5cdGluc19vYmouY3JlYXRlZCA9IG5vd1xyXG5cdGluc19vYmouY3JlYXRlZF9ieSA9IHVzZXJfaWRcclxuXHRpbnNfb2JqLm1vZGlmaWVkID0gbm93XHJcblx0aW5zX29iai5tb2RpZmllZF9ieSA9IHVzZXJfaWRcclxuXHRpbnNfb2JqLnZhbHVlcyA9IG5ldyBPYmplY3RcclxuXHJcblx0aW5zX29iai5yZWNvcmRfaWRzID0gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJyZWNvcmRfaWRzXCJdXHJcblxyXG5cdGlmIHNwYWNlX3VzZXIuY29tcGFueV9pZFxyXG5cdFx0aW5zX29iai5jb21wYW55X2lkID0gc3BhY2VfdXNlci5jb21wYW55X2lkXHJcblxyXG5cdCMg5paw5bu6VHJhY2VcclxuXHR0cmFjZV9vYmogPSB7fVxyXG5cdHRyYWNlX29iai5faWQgPSBuZXcgTW9uZ28uT2JqZWN0SUQoKS5fc3RyXHJcblx0dHJhY2Vfb2JqLmluc3RhbmNlID0gaW5zX29iai5faWRcclxuXHR0cmFjZV9vYmouaXNfZmluaXNoZWQgPSBmYWxzZVxyXG5cdCMg5b2T5YmN5pyA5paw54mIZmxvd+S4reW8gOWni+iKgueCuVxyXG5cdHN0YXJ0X3N0ZXAgPSBfLmZpbmQoZmxvdy5jdXJyZW50LnN0ZXBzLCAoc3RlcCkgLT5cclxuXHRcdHJldHVybiBzdGVwLnN0ZXBfdHlwZSBpcyAnc3RhcnQnXHJcblx0KVxyXG5cdHRyYWNlX29iai5zdGVwID0gc3RhcnRfc3RlcC5faWRcclxuXHR0cmFjZV9vYmoubmFtZSA9IHN0YXJ0X3N0ZXAubmFtZVxyXG5cclxuXHR0cmFjZV9vYmouc3RhcnRfZGF0ZSA9IG5vd1xyXG5cdCMg5paw5bu6QXBwcm92ZVxyXG5cdGFwcHJfb2JqID0ge31cclxuXHRhcHByX29iai5faWQgPSBuZXcgTW9uZ28uT2JqZWN0SUQoKS5fc3RyXHJcblx0YXBwcl9vYmouaW5zdGFuY2UgPSBpbnNfb2JqLl9pZFxyXG5cdGFwcHJfb2JqLnRyYWNlID0gdHJhY2Vfb2JqLl9pZFxyXG5cdGFwcHJfb2JqLmlzX2ZpbmlzaGVkID0gZmFsc2VcclxuXHRhcHByX29iai51c2VyID0gaWYgaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRcIl0gdGhlbiBpbnN0YW5jZV9mcm9tX2NsaWVudFtcImFwcGxpY2FudFwiXSBlbHNlIHVzZXJfaWRcclxuXHRhcHByX29iai51c2VyX25hbWUgPSBpZiBpbnN0YW5jZV9mcm9tX2NsaWVudFtcImFwcGxpY2FudF9uYW1lXCJdIHRoZW4gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRfbmFtZVwiXSBlbHNlIHVzZXJfaW5mby5uYW1lXHJcblx0YXBwcl9vYmouaGFuZGxlciA9IHVzZXJfaWRcclxuXHRhcHByX29iai5oYW5kbGVyX25hbWUgPSB1c2VyX2luZm8ubmFtZVxyXG5cdGFwcHJfb2JqLmhhbmRsZXJfb3JnYW5pemF0aW9uID0gc3BhY2VfdXNlci5vcmdhbml6YXRpb25cclxuXHRhcHByX29iai5oYW5kbGVyX29yZ2FuaXphdGlvbl9uYW1lID0gc3BhY2VfdXNlcl9vcmdfaW5mby5uYW1lXHJcblx0YXBwcl9vYmouaGFuZGxlcl9vcmdhbml6YXRpb25fZnVsbG5hbWUgPSBzcGFjZV91c2VyX29yZ19pbmZvLmZ1bGxuYW1lXHJcblx0YXBwcl9vYmoudHlwZSA9ICdkcmFmdCdcclxuXHRhcHByX29iai5zdGFydF9kYXRlID0gbm93XHJcblx0YXBwcl9vYmoucmVhZF9kYXRlID0gbm93XHJcblx0YXBwcl9vYmouaXNfcmVhZCA9IHRydWVcclxuXHRhcHByX29iai5pc19lcnJvciA9IGZhbHNlXHJcblx0YXBwcl9vYmouZGVzY3JpcHRpb24gPSAnJ1xyXG5cdHJlbGF0ZWRUYWJsZXNJbmZvID0ge31cclxuXHRhcHByX29iai52YWx1ZXMgPSB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmluaXRpYXRlVmFsdWVzKGluc19vYmoucmVjb3JkX2lkc1swXSwgZmxvd19pZCwgc3BhY2VfaWQsIGZvcm0uY3VycmVudC5maWVsZHMsIHJlbGF0ZWRUYWJsZXNJbmZvKVxyXG5cclxuXHR0cmFjZV9vYmouYXBwcm92ZXMgPSBbYXBwcl9vYmpdXHJcblx0aW5zX29iai50cmFjZXMgPSBbdHJhY2Vfb2JqXVxyXG5cclxuXHRpbnNfb2JqLmluYm94X3VzZXJzID0gaW5zdGFuY2VfZnJvbV9jbGllbnQuaW5ib3hfdXNlcnMgfHwgW11cclxuXHJcblx0aW5zX29iai5jdXJyZW50X3N0ZXBfbmFtZSA9IHN0YXJ0X3N0ZXAubmFtZVxyXG5cclxuXHRpZiBmbG93LmF1dG9fcmVtaW5kIGlzIHRydWVcclxuXHRcdGluc19vYmouYXV0b19yZW1pbmQgPSB0cnVlXHJcblxyXG5cdCMg5paw5bu655Sz6K+35Y2V5pe277yMaW5zdGFuY2Vz6K6w5b2V5rWB56iL5ZCN56ew44CB5rWB56iL5YiG57G75ZCN56ewICMxMzEzXHJcblx0aW5zX29iai5mbG93X25hbWUgPSBmbG93Lm5hbWVcclxuXHRpZiBmb3JtLmNhdGVnb3J5XHJcblx0XHRjYXRlZ29yeSA9IHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0Q2F0ZWdvcnkoZm9ybS5jYXRlZ29yeSlcclxuXHRcdGlmIGNhdGVnb3J5XHJcblx0XHRcdGluc19vYmouY2F0ZWdvcnlfbmFtZSA9IGNhdGVnb3J5Lm5hbWVcclxuXHRcdFx0aW5zX29iai5jYXRlZ29yeSA9IGNhdGVnb3J5Ll9pZFxyXG5cclxuXHRuZXdfaW5zX2lkID0gQ3JlYXRvci5Db2xsZWN0aW9ucy5pbnN0YW5jZXMuaW5zZXJ0KGluc19vYmopXHJcblxyXG5cdHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuaW5pdGlhdGVSZWNvcmRJbnN0YW5jZUluZm8oaW5zX29iai5yZWNvcmRfaWRzWzBdLCBuZXdfaW5zX2lkLCBzcGFjZV9pZClcclxuXHJcblx0dXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5pbml0aWF0ZVJlbGF0ZWRSZWNvcmRJbnN0YW5jZUluZm8ocmVsYXRlZFRhYmxlc0luZm8sIG5ld19pbnNfaWQsIHNwYWNlX2lkKVxyXG5cclxuXHR1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmluaXRpYXRlQXR0YWNoKGluc19vYmoucmVjb3JkX2lkc1swXSwgc3BhY2VfaWQsIGluc19vYmouX2lkLCBhcHByX29iai5faWQpXHJcblxyXG5cdHJldHVybiBuZXdfaW5zX2lkXHJcblxyXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmluaXRpYXRlVmFsdWVzID0gKHJlY29yZElkcywgZmxvd0lkLCBzcGFjZUlkLCBmaWVsZHMsIHJlbGF0ZWRUYWJsZXNJbmZvKSAtPlxyXG5cdGZpZWxkQ29kZXMgPSBbXVxyXG5cdF8uZWFjaCBmaWVsZHMsIChmKSAtPlxyXG5cdFx0aWYgZi50eXBlID09ICdzZWN0aW9uJ1xyXG5cdFx0XHRfLmVhY2ggZi5maWVsZHMsIChmZikgLT5cclxuXHRcdFx0XHRmaWVsZENvZGVzLnB1c2ggZmYuY29kZVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRmaWVsZENvZGVzLnB1c2ggZi5jb2RlXHJcblxyXG5cdHZhbHVlcyA9IHt9XHJcblx0b2JqZWN0TmFtZSA9IHJlY29yZElkcy5vXHJcblx0b2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0TmFtZSwgc3BhY2VJZClcclxuXHRyZWNvcmRJZCA9IHJlY29yZElkcy5pZHNbMF1cclxuXHRvdyA9IENyZWF0b3IuQ29sbGVjdGlvbnMub2JqZWN0X3dvcmtmbG93cy5maW5kT25lKHtcclxuXHRcdG9iamVjdF9uYW1lOiBvYmplY3ROYW1lLFxyXG5cdFx0Zmxvd19pZDogZmxvd0lkXHJcblx0fSlcclxuXHRyZWNvcmQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqZWN0TmFtZSwgc3BhY2VJZCkuZmluZE9uZShyZWNvcmRJZClcclxuXHRmbG93ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKCdmbG93cycpLmZpbmRPbmUoZmxvd0lkLCB7IGZpZWxkczogeyBmb3JtOiAxIH0gfSlcclxuXHRpZiBvdyBhbmQgcmVjb3JkXHJcblx0XHRmb3JtID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiZm9ybXNcIikuZmluZE9uZShmbG93LmZvcm0pXHJcblx0XHRmb3JtRmllbGRzID0gZm9ybS5jdXJyZW50LmZpZWxkcyB8fCBbXVxyXG5cdFx0cmVsYXRlZE9iamVjdHMgPSBDcmVhdG9yLmdldFJlbGF0ZWRPYmplY3RzKG9iamVjdE5hbWUsIHNwYWNlSWQpXHJcblx0XHRyZWxhdGVkT2JqZWN0c0tleXMgPSBfLnBsdWNrKHJlbGF0ZWRPYmplY3RzLCAnb2JqZWN0X25hbWUnKVxyXG5cdFx0Zm9ybVRhYmxlRmllbGRzID0gXy5maWx0ZXIgZm9ybUZpZWxkcywgKGZvcm1GaWVsZCkgLT5cclxuXHRcdFx0cmV0dXJuIGZvcm1GaWVsZC50eXBlID09ICd0YWJsZSdcclxuXHRcdGZvcm1UYWJsZUZpZWxkc0NvZGUgPSBfLnBsdWNrKGZvcm1UYWJsZUZpZWxkcywgJ2NvZGUnKVxyXG5cclxuXHRcdGdldFJlbGF0ZWRPYmplY3RGaWVsZENvZGUgPSAgKGtleSkgLT5cclxuXHRcdFx0cmV0dXJuIF8uZmluZCByZWxhdGVkT2JqZWN0c0tleXMsICAocmVsYXRlZE9iamVjdHNLZXkpIC0+XHJcblx0XHRcdFx0cmV0dXJuIGtleS5zdGFydHNXaXRoKHJlbGF0ZWRPYmplY3RzS2V5ICsgJy4nKVxyXG5cclxuXHRcdGdldEZvcm1UYWJsZUZpZWxkQ29kZSA9IChrZXkpIC0+XHJcblx0XHRcdHJldHVybiBfLmZpbmQgZm9ybVRhYmxlRmllbGRzQ29kZSwgIChmb3JtVGFibGVGaWVsZENvZGUpIC0+XHJcblx0XHRcdFx0cmV0dXJuIGtleS5zdGFydHNXaXRoKGZvcm1UYWJsZUZpZWxkQ29kZSArICcuJylcclxuXHJcblx0XHRnZXRGb3JtVGFibGVGaWVsZCA9IChrZXkpIC0+XHJcblx0XHRcdHJldHVybiBfLmZpbmQgZm9ybVRhYmxlRmllbGRzLCAgKGYpIC0+XHJcblx0XHRcdFx0cmV0dXJuIGYuY29kZSA9PSBrZXlcclxuXHJcblx0XHRnZXRGb3JtRmllbGQgPSAoa2V5KSAtPlxyXG5cdFx0XHRyZXR1cm4gXy5maW5kIGZvcm1GaWVsZHMsICAoZikgLT5cclxuXHRcdFx0XHRyZXR1cm4gZi5jb2RlID09IGtleVxyXG5cclxuXHRcdGdldEZvcm1UYWJsZVN1YkZpZWxkID0gKHRhYmxlRmllbGQsIHN1YkZpZWxkQ29kZSkgLT5cclxuXHRcdFx0cmV0dXJuIF8uZmluZCB0YWJsZUZpZWxkLmZpZWxkcywgIChmKSAtPlxyXG5cdFx0XHRcdHJldHVybiBmLmNvZGUgPT0gc3ViRmllbGRDb2RlXHJcblxyXG5cdFx0Z2V0RmllbGRPZGF0YVZhbHVlID0gKG9iak5hbWUsIGlkKSAtPlxyXG5cdFx0XHRvYmogPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqTmFtZSlcclxuXHRcdFx0aWYgIW9ialxyXG5cdFx0XHRcdHJldHVyblxyXG5cdFx0XHRpZiBfLmlzU3RyaW5nIGlkXHJcblx0XHRcdFx0X3JlY29yZCA9IG9iai5maW5kT25lKGlkKVxyXG5cdFx0XHRcdGlmIF9yZWNvcmRcclxuXHRcdFx0XHRcdF9yZWNvcmRbJ0BsYWJlbCddID0gX3JlY29yZC5uYW1lXHJcblx0XHRcdFx0XHRyZXR1cm4gX3JlY29yZFxyXG5cdFx0XHRlbHNlIGlmIF8uaXNBcnJheSBpZFxyXG5cdFx0XHRcdF9yZWNvcmRzID0gW11cclxuXHRcdFx0XHRvYmouZmluZCh7IF9pZDogeyAkaW46IGlkIH0gfSkuZm9yRWFjaCAoX3JlY29yZCkgLT5cclxuXHRcdFx0XHRcdF9yZWNvcmRbJ0BsYWJlbCddID0gX3JlY29yZC5uYW1lXHJcblx0XHRcdFx0XHRfcmVjb3Jkcy5wdXNoIF9yZWNvcmRcclxuXHJcblx0XHRcdFx0aWYgIV8uaXNFbXB0eSBfcmVjb3Jkc1xyXG5cdFx0XHRcdFx0cmV0dXJuIF9yZWNvcmRzXHJcblx0XHRcdHJldHVyblxyXG5cclxuXHRcdGdldFNlbGVjdFVzZXJWYWx1ZSA9ICh1c2VySWQsIHNwYWNlSWQpIC0+XHJcblx0XHRcdHN1ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKCdzcGFjZV91c2VycycpLmZpbmRPbmUoeyBzcGFjZTogc3BhY2VJZCwgdXNlcjogdXNlcklkIH0pXHJcblx0XHRcdHN1LmlkID0gdXNlcklkXHJcblx0XHRcdHJldHVybiBzdVxyXG5cclxuXHRcdGdldFNlbGVjdFVzZXJWYWx1ZXMgPSAodXNlcklkcywgc3BhY2VJZCkgLT5cclxuXHRcdFx0c3VzID0gW11cclxuXHRcdFx0aWYgXy5pc0FycmF5IHVzZXJJZHNcclxuXHRcdFx0XHRfLmVhY2ggdXNlcklkcywgKHVzZXJJZCkgLT5cclxuXHRcdFx0XHRcdHN1ID0gZ2V0U2VsZWN0VXNlclZhbHVlKHVzZXJJZCwgc3BhY2VJZClcclxuXHRcdFx0XHRcdGlmIHN1XHJcblx0XHRcdFx0XHRcdHN1cy5wdXNoKHN1KVxyXG5cdFx0XHRyZXR1cm4gc3VzXHJcblxyXG5cdFx0Z2V0U2VsZWN0T3JnVmFsdWUgPSAob3JnSWQsIHNwYWNlSWQpIC0+XHJcblx0XHRcdG9yZyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbignb3JnYW5pemF0aW9ucycpLmZpbmRPbmUob3JnSWQsIHsgZmllbGRzOiB7IF9pZDogMSwgbmFtZTogMSwgZnVsbG5hbWU6IDEgfSB9KVxyXG5cdFx0XHRvcmcuaWQgPSBvcmdJZFxyXG5cdFx0XHRyZXR1cm4gb3JnXHJcblxyXG5cdFx0Z2V0U2VsZWN0T3JnVmFsdWVzID0gKG9yZ0lkcywgc3BhY2VJZCkgLT5cclxuXHRcdFx0b3JncyA9IFtdXHJcblx0XHRcdGlmIF8uaXNBcnJheSBvcmdJZHNcclxuXHRcdFx0XHRfLmVhY2ggb3JnSWRzLCAob3JnSWQpIC0+XHJcblx0XHRcdFx0XHRvcmcgPSBnZXRTZWxlY3RPcmdWYWx1ZShvcmdJZCwgc3BhY2VJZClcclxuXHRcdFx0XHRcdGlmIG9yZ1xyXG5cdFx0XHRcdFx0XHRvcmdzLnB1c2gob3JnKVxyXG5cdFx0XHRyZXR1cm4gb3Jnc1xyXG5cclxuXHRcdHRhYmxlRmllbGRDb2RlcyA9IFtdXHJcblx0XHR0YWJsZUZpZWxkTWFwID0gW11cclxuXHRcdHRhYmxlVG9SZWxhdGVkTWFwID0ge31cclxuXHJcblx0XHRvdy5maWVsZF9tYXA/LmZvckVhY2ggKGZtKSAtPlxyXG5cdFx0XHRvYmplY3RfZmllbGQgPSBmbS5vYmplY3RfZmllbGRcclxuXHRcdFx0d29ya2Zsb3dfZmllbGQgPSBmbS53b3JrZmxvd19maWVsZFxyXG5cdFx0XHRyZWxhdGVkT2JqZWN0RmllbGRDb2RlID0gZ2V0UmVsYXRlZE9iamVjdEZpZWxkQ29kZShvYmplY3RfZmllbGQpXHJcblx0XHRcdGZvcm1UYWJsZUZpZWxkQ29kZSA9IGdldEZvcm1UYWJsZUZpZWxkQ29kZSh3b3JrZmxvd19maWVsZClcclxuXHRcdFx0b2JqRmllbGQgPSBvYmplY3QuZmllbGRzW29iamVjdF9maWVsZF1cclxuXHRcdFx0Zm9ybUZpZWxkID0gZ2V0Rm9ybUZpZWxkKHdvcmtmbG93X2ZpZWxkKVxyXG5cdFx0XHQjIOWkhOeQhuWtkOihqOWtl+autVxyXG5cdFx0XHRpZiByZWxhdGVkT2JqZWN0RmllbGRDb2RlXHJcblx0XHRcdFx0XHJcblx0XHRcdFx0b1RhYmxlQ29kZSA9IG9iamVjdF9maWVsZC5zcGxpdCgnLicpWzBdXHJcblx0XHRcdFx0b1RhYmxlRmllbGRDb2RlID0gb2JqZWN0X2ZpZWxkLnNwbGl0KCcuJylbMV1cclxuXHRcdFx0XHR0YWJsZVRvUmVsYXRlZE1hcEtleSA9IG9UYWJsZUNvZGVcclxuXHRcdFx0XHRpZiAhdGFibGVUb1JlbGF0ZWRNYXBbdGFibGVUb1JlbGF0ZWRNYXBLZXldXHJcblx0XHRcdFx0XHR0YWJsZVRvUmVsYXRlZE1hcFt0YWJsZVRvUmVsYXRlZE1hcEtleV0gPSB7fVxyXG5cclxuXHRcdFx0XHRpZiBmb3JtVGFibGVGaWVsZENvZGVcclxuXHRcdFx0XHRcdHdUYWJsZUNvZGUgPSB3b3JrZmxvd19maWVsZC5zcGxpdCgnLicpWzBdXHJcblx0XHRcdFx0XHR0YWJsZVRvUmVsYXRlZE1hcFt0YWJsZVRvUmVsYXRlZE1hcEtleV1bJ19GUk9NX1RBQkxFX0NPREUnXSA9IHdUYWJsZUNvZGVcclxuXHJcblx0XHRcdFx0dGFibGVUb1JlbGF0ZWRNYXBbdGFibGVUb1JlbGF0ZWRNYXBLZXldW29UYWJsZUZpZWxkQ29kZV0gPSB3b3JrZmxvd19maWVsZFxyXG5cdFx0XHQjIOWIpOaWreaYr+WQpuaYr+ihqOagvOWtl+autVxyXG5cdFx0XHRlbHNlIGlmIHdvcmtmbG93X2ZpZWxkLmluZGV4T2YoJy4kLicpID4gMCBhbmQgb2JqZWN0X2ZpZWxkLmluZGV4T2YoJy4kLicpID4gMFxyXG5cdFx0XHRcdHdUYWJsZUNvZGUgPSB3b3JrZmxvd19maWVsZC5zcGxpdCgnLiQuJylbMF1cclxuXHRcdFx0XHRvVGFibGVDb2RlID0gb2JqZWN0X2ZpZWxkLnNwbGl0KCcuJC4nKVswXVxyXG5cdFx0XHRcdGlmIHJlY29yZC5oYXNPd25Qcm9wZXJ0eShvVGFibGVDb2RlKSBhbmQgXy5pc0FycmF5KHJlY29yZFtvVGFibGVDb2RlXSlcclxuXHRcdFx0XHRcdHRhYmxlRmllbGRDb2Rlcy5wdXNoKEpTT04uc3RyaW5naWZ5KHtcclxuXHRcdFx0XHRcdFx0d29ya2Zsb3dfdGFibGVfZmllbGRfY29kZTogd1RhYmxlQ29kZSxcclxuXHRcdFx0XHRcdFx0b2JqZWN0X3RhYmxlX2ZpZWxkX2NvZGU6IG9UYWJsZUNvZGVcclxuXHRcdFx0XHRcdH0pKVxyXG5cdFx0XHRcdFx0dGFibGVGaWVsZE1hcC5wdXNoKGZtKVxyXG5cclxuXHRcdFx0IyDlpITnkIZsb29rdXDjgIFtYXN0ZXJfZGV0YWls57G75Z6L5a2X5q61XHJcblx0XHRcdGVsc2UgaWYgb2JqZWN0X2ZpZWxkLmluZGV4T2YoJy4nKSA+IDAgYW5kIG9iamVjdF9maWVsZC5pbmRleE9mKCcuJC4nKSA9PSAtMVxyXG5cdFx0XHRcdG9iamVjdEZpZWxkTmFtZSA9IG9iamVjdF9maWVsZC5zcGxpdCgnLicpWzBdXHJcblx0XHRcdFx0bG9va3VwRmllbGROYW1lID0gb2JqZWN0X2ZpZWxkLnNwbGl0KCcuJylbMV1cclxuXHRcdFx0XHRpZiBvYmplY3RcclxuXHRcdFx0XHRcdG9iamVjdEZpZWxkID0gb2JqZWN0LmZpZWxkc1tvYmplY3RGaWVsZE5hbWVdXHJcblx0XHRcdFx0XHRpZiBvYmplY3RGaWVsZCAmJiAob2JqZWN0RmllbGQudHlwZSA9PSBcImxvb2t1cFwiIHx8IG9iamVjdEZpZWxkLnR5cGUgPT0gXCJtYXN0ZXJfZGV0YWlsXCIpICYmICFvYmplY3RGaWVsZC5tdWx0aXBsZVxyXG5cdFx0XHRcdFx0XHRmaWVsZHNPYmogPSB7fVxyXG5cdFx0XHRcdFx0XHRmaWVsZHNPYmpbbG9va3VwRmllbGROYW1lXSA9IDFcclxuXHRcdFx0XHRcdFx0bG9va3VwT2JqZWN0ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKG9iamVjdEZpZWxkLnJlZmVyZW5jZV90bywgc3BhY2VJZCkuZmluZE9uZShyZWNvcmRbb2JqZWN0RmllbGROYW1lXSwgeyBmaWVsZHM6IGZpZWxkc09iaiB9KVxyXG5cdFx0XHRcdFx0XHRpZiBsb29rdXBPYmplY3RcclxuXHRcdFx0XHRcdFx0XHR2YWx1ZXNbd29ya2Zsb3dfZmllbGRdID0gbG9va3VwT2JqZWN0W2xvb2t1cEZpZWxkTmFtZV1cclxuXHJcblx0XHRcdCMgbG9va3Vw44CBbWFzdGVyX2RldGFpbOWtl+auteWQjOatpeWIsG9kYXRh5a2X5q61XHJcblx0XHRcdGVsc2UgaWYgZm9ybUZpZWxkICYmIG9iakZpZWxkICYmIGZvcm1GaWVsZC50eXBlID09ICdvZGF0YScgJiYgWydsb29rdXAnLCAnbWFzdGVyX2RldGFpbCddLmluY2x1ZGVzKG9iakZpZWxkLnR5cGUpICYmIF8uaXNTdHJpbmcob2JqRmllbGQucmVmZXJlbmNlX3RvKVxyXG5cdFx0XHRcdHJlZmVyZW5jZVRvT2JqZWN0TmFtZSA9IG9iakZpZWxkLnJlZmVyZW5jZV90b1xyXG5cdFx0XHRcdHJlZmVyZW5jZVRvRmllbGRWYWx1ZSA9IHJlY29yZFtvYmpGaWVsZC5uYW1lXVxyXG5cdFx0XHRcdG9kYXRhRmllbGRWYWx1ZVxyXG5cdFx0XHRcdGlmIG9iakZpZWxkLm11bHRpcGxlICYmIGZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdFxyXG5cdFx0XHRcdFx0b2RhdGFGaWVsZFZhbHVlID0gZ2V0RmllbGRPZGF0YVZhbHVlKHJlZmVyZW5jZVRvT2JqZWN0TmFtZSwgcmVmZXJlbmNlVG9GaWVsZFZhbHVlKVxyXG5cdFx0XHRcdGVsc2UgaWYgIW9iakZpZWxkLm11bHRpcGxlICYmICFmb3JtRmllbGQuaXNfbXVsdGlzZWxlY3RcclxuXHRcdFx0XHRcdG9kYXRhRmllbGRWYWx1ZSA9IGdldEZpZWxkT2RhdGFWYWx1ZShyZWZlcmVuY2VUb09iamVjdE5hbWUsIHJlZmVyZW5jZVRvRmllbGRWYWx1ZSlcclxuXHRcdFx0XHR2YWx1ZXNbd29ya2Zsb3dfZmllbGRdID0gb2RhdGFGaWVsZFZhbHVlXHJcblx0XHRcdGVsc2UgaWYgZm9ybUZpZWxkICYmIG9iakZpZWxkICYmIFsndXNlcicsICdncm91cCddLmluY2x1ZGVzKGZvcm1GaWVsZC50eXBlKSAmJiBbJ2xvb2t1cCcsICdtYXN0ZXJfZGV0YWlsJ10uaW5jbHVkZXMob2JqRmllbGQudHlwZSkgJiYgWyd1c2VycycsICdvcmdhbml6YXRpb25zJ10uaW5jbHVkZXMob2JqRmllbGQucmVmZXJlbmNlX3RvKVxyXG5cdFx0XHRcdHJlZmVyZW5jZVRvRmllbGRWYWx1ZSA9IHJlY29yZFtvYmpGaWVsZC5uYW1lXVxyXG5cdFx0XHRcdGlmICFfLmlzRW1wdHkocmVmZXJlbmNlVG9GaWVsZFZhbHVlKVxyXG5cdFx0XHRcdFx0c2VsZWN0RmllbGRWYWx1ZVxyXG5cdFx0XHRcdFx0aWYgZm9ybUZpZWxkLnR5cGUgPT0gJ3VzZXInXHJcblx0XHRcdFx0XHRcdGlmIG9iakZpZWxkLm11bHRpcGxlICYmIGZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdFxyXG5cdFx0XHRcdFx0XHRcdHNlbGVjdEZpZWxkVmFsdWUgPSBnZXRTZWxlY3RVc2VyVmFsdWVzKHJlZmVyZW5jZVRvRmllbGRWYWx1ZSwgc3BhY2VJZClcclxuXHRcdFx0XHRcdFx0ZWxzZSBpZiAhb2JqRmllbGQubXVsdGlwbGUgJiYgIWZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdFxyXG5cdFx0XHRcdFx0XHRcdHNlbGVjdEZpZWxkVmFsdWUgPSBnZXRTZWxlY3RVc2VyVmFsdWUocmVmZXJlbmNlVG9GaWVsZFZhbHVlLCBzcGFjZUlkKVxyXG5cdFx0XHRcdFx0ZWxzZSBpZiBmb3JtRmllbGQudHlwZSA9PSAnZ3JvdXAnXHJcblx0XHRcdFx0XHRcdGlmIG9iakZpZWxkLm11bHRpcGxlICYmIGZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdFxyXG5cdFx0XHRcdFx0XHRcdHNlbGVjdEZpZWxkVmFsdWUgPSBnZXRTZWxlY3RPcmdWYWx1ZXMocmVmZXJlbmNlVG9GaWVsZFZhbHVlLCBzcGFjZUlkKVxyXG5cdFx0XHRcdFx0XHRlbHNlIGlmICFvYmpGaWVsZC5tdWx0aXBsZSAmJiAhZm9ybUZpZWxkLmlzX211bHRpc2VsZWN0XHJcblx0XHRcdFx0XHRcdFx0c2VsZWN0RmllbGRWYWx1ZSA9IGdldFNlbGVjdE9yZ1ZhbHVlKHJlZmVyZW5jZVRvRmllbGRWYWx1ZSwgc3BhY2VJZClcclxuXHRcdFx0XHRcdGlmIHNlbGVjdEZpZWxkVmFsdWVcclxuXHRcdFx0XHRcdFx0dmFsdWVzW3dvcmtmbG93X2ZpZWxkXSA9IHNlbGVjdEZpZWxkVmFsdWVcclxuXHRcdFx0ZWxzZSBpZiByZWNvcmQuaGFzT3duUHJvcGVydHkob2JqZWN0X2ZpZWxkKVxyXG5cdFx0XHRcdHZhbHVlc1t3b3JrZmxvd19maWVsZF0gPSByZWNvcmRbb2JqZWN0X2ZpZWxkXVxyXG5cclxuXHRcdCMg6KGo5qC85a2X5q61XHJcblx0XHRfLnVuaXEodGFibGVGaWVsZENvZGVzKS5mb3JFYWNoICh0ZmMpIC0+XHJcblx0XHRcdGMgPSBKU09OLnBhcnNlKHRmYylcclxuXHRcdFx0dmFsdWVzW2Mud29ya2Zsb3dfdGFibGVfZmllbGRfY29kZV0gPSBbXVxyXG5cdFx0XHRyZWNvcmRbYy5vYmplY3RfdGFibGVfZmllbGRfY29kZV0uZm9yRWFjaCAodHIpIC0+XHJcblx0XHRcdFx0bmV3VHIgPSB7fVxyXG5cdFx0XHRcdF8uZWFjaCB0ciwgKHYsIGspIC0+XHJcblx0XHRcdFx0XHR0YWJsZUZpZWxkTWFwLmZvckVhY2ggKHRmbSkgLT5cclxuXHRcdFx0XHRcdFx0aWYgdGZtLm9iamVjdF9maWVsZCBpcyAoYy5vYmplY3RfdGFibGVfZmllbGRfY29kZSArICcuJC4nICsgaylcclxuXHRcdFx0XHRcdFx0XHR3VGRDb2RlID0gdGZtLndvcmtmbG93X2ZpZWxkLnNwbGl0KCcuJC4nKVsxXVxyXG5cdFx0XHRcdFx0XHRcdG5ld1RyW3dUZENvZGVdID0gdlxyXG5cdFx0XHRcdGlmIG5vdCBfLmlzRW1wdHkobmV3VHIpXHJcblx0XHRcdFx0XHR2YWx1ZXNbYy53b3JrZmxvd190YWJsZV9maWVsZF9jb2RlXS5wdXNoKG5ld1RyKVxyXG5cclxuXHRcdCMg5ZCM5q2l5a2Q6KGo5pWw5o2u6Iez6KGo5Y2V6KGo5qC8XHJcblx0XHRfLmVhY2ggdGFibGVUb1JlbGF0ZWRNYXAsICAobWFwLCBrZXkpIC0+XHJcblx0XHRcdHRhYmxlQ29kZSA9IG1hcC5fRlJPTV9UQUJMRV9DT0RFXHJcblx0XHRcdGZvcm1UYWJsZUZpZWxkID0gZ2V0Rm9ybVRhYmxlRmllbGQodGFibGVDb2RlKVxyXG5cdFx0XHRpZiAhdGFibGVDb2RlXHJcblx0XHRcdFx0Y29uc29sZS53YXJuKCd0YWJsZVRvUmVsYXRlZDogWycgKyBrZXkgKyAnXSBtaXNzaW5nIGNvcnJlc3BvbmRpbmcgdGFibGUuJylcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHJlbGF0ZWRPYmplY3ROYW1lID0ga2V5XHJcblx0XHRcdFx0dGFibGVWYWx1ZXMgPSBbXVxyXG5cdFx0XHRcdHJlbGF0ZWRUYWJsZUl0ZW1zID0gW11cclxuXHRcdFx0XHRyZWxhdGVkT2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3QocmVsYXRlZE9iamVjdE5hbWUsIHNwYWNlSWQpXHJcblx0XHRcdFx0cmVsYXRlZEZpZWxkID0gXy5maW5kIHJlbGF0ZWRPYmplY3QuZmllbGRzLCAoZikgLT5cclxuXHRcdFx0XHRcdHJldHVybiBbJ2xvb2t1cCcsICdtYXN0ZXJfZGV0YWlsJ10uaW5jbHVkZXMoZi50eXBlKSAmJiBmLnJlZmVyZW5jZV90byA9PSBvYmplY3ROYW1lXHJcblxyXG5cdFx0XHRcdHJlbGF0ZWRGaWVsZE5hbWUgPSByZWxhdGVkRmllbGQubmFtZVxyXG5cclxuXHRcdFx0XHRzZWxlY3RvciA9IHt9XHJcblx0XHRcdFx0c2VsZWN0b3JbcmVsYXRlZEZpZWxkTmFtZV0gPSByZWNvcmRJZFxyXG5cdFx0XHRcdHJlbGF0ZWRDb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKHJlbGF0ZWRPYmplY3ROYW1lLCBzcGFjZUlkKVxyXG5cdFx0XHRcdHJlbGF0ZWRSZWNvcmRzID0gcmVsYXRlZENvbGxlY3Rpb24uZmluZChzZWxlY3RvcilcclxuXHJcblx0XHRcdFx0cmVsYXRlZFJlY29yZHMuZm9yRWFjaCAocnIpIC0+XHJcblx0XHRcdFx0XHR0YWJsZVZhbHVlSXRlbSA9IHt9XHJcblx0XHRcdFx0XHRfLmVhY2ggbWFwLCAodmFsdWVLZXksIGZpZWxkS2V5KSAtPlxyXG5cdFx0XHRcdFx0XHRpZiBmaWVsZEtleSAhPSAnX0ZST01fVEFCTEVfQ09ERSdcclxuXHRcdFx0XHRcdFx0XHR0YWJsZUZpZWxkVmFsdWVcclxuXHRcdFx0XHRcdFx0XHRmb3JtRmllbGRLZXlcclxuXHRcdFx0XHRcdFx0XHRpZiB2YWx1ZUtleS5zdGFydHNXaXRoKHRhYmxlQ29kZSArICcuJylcclxuXHRcdFx0XHRcdFx0XHRcdGZvcm1GaWVsZEtleSA9ICh2YWx1ZUtleS5zcGxpdChcIi5cIilbMV0pXHJcblx0XHRcdFx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0XHRcdFx0Zm9ybUZpZWxkS2V5ID0gdmFsdWVLZXlcclxuXHRcdFx0XHRcdFx0XHRcclxuXHRcdFx0XHRcdFx0XHRmb3JtRmllbGQgPSBnZXRGb3JtVGFibGVTdWJGaWVsZChmb3JtVGFibGVGaWVsZCwgZm9ybUZpZWxkS2V5KVxyXG5cdFx0XHRcdFx0XHRcdHJlbGF0ZWRPYmplY3RGaWVsZCA9IHJlbGF0ZWRPYmplY3QuZmllbGRzW2ZpZWxkS2V5XVxyXG5cdFx0XHRcdFx0XHRcdGlmICFmb3JtRmllbGQgfHwgIXJlbGF0ZWRPYmplY3RGaWVsZFxyXG5cdFx0XHRcdFx0XHRcdFx0cmV0dXJuXHJcblx0XHRcdFx0XHRcdFx0aWYgZm9ybUZpZWxkLnR5cGUgPT0gJ29kYXRhJyAmJiBbJ2xvb2t1cCcsICdtYXN0ZXJfZGV0YWlsJ10uaW5jbHVkZXMocmVsYXRlZE9iamVjdEZpZWxkLnR5cGUpICYmIF8uaXNTdHJpbmcocmVsYXRlZE9iamVjdEZpZWxkLnJlZmVyZW5jZV90bylcclxuXHRcdFx0XHRcdFx0XHRcdHJlZmVyZW5jZVRvT2JqZWN0TmFtZSA9IHJlbGF0ZWRPYmplY3RGaWVsZC5yZWZlcmVuY2VfdG9cclxuXHRcdFx0XHRcdFx0XHRcdHJlZmVyZW5jZVRvRmllbGRWYWx1ZSA9IHJyW2ZpZWxkS2V5XVxyXG5cdFx0XHRcdFx0XHRcdFx0aWYgcmVsYXRlZE9iamVjdEZpZWxkLm11bHRpcGxlICYmIGZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdFxyXG5cdFx0XHRcdFx0XHRcdFx0XHR0YWJsZUZpZWxkVmFsdWUgPSBnZXRGaWVsZE9kYXRhVmFsdWUocmVmZXJlbmNlVG9PYmplY3ROYW1lLCByZWZlcmVuY2VUb0ZpZWxkVmFsdWUpXHJcblx0XHRcdFx0XHRcdFx0XHRlbHNlIGlmICFyZWxhdGVkT2JqZWN0RmllbGQubXVsdGlwbGUgJiYgIWZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdFxyXG5cdFx0XHRcdFx0XHRcdFx0XHR0YWJsZUZpZWxkVmFsdWUgPSBnZXRGaWVsZE9kYXRhVmFsdWUocmVmZXJlbmNlVG9PYmplY3ROYW1lLCByZWZlcmVuY2VUb0ZpZWxkVmFsdWUpXHJcblx0XHRcdFx0XHRcdFx0ZWxzZSBpZiBbJ3VzZXInLCAnZ3JvdXAnXS5pbmNsdWRlcyhmb3JtRmllbGQudHlwZSkgJiYgWydsb29rdXAnLCAnbWFzdGVyX2RldGFpbCddLmluY2x1ZGVzKHJlbGF0ZWRPYmplY3RGaWVsZC50eXBlKSAmJiBbJ3VzZXJzJywgJ29yZ2FuaXphdGlvbnMnXS5pbmNsdWRlcyhyZWxhdGVkT2JqZWN0RmllbGQucmVmZXJlbmNlX3RvKVxyXG5cdFx0XHRcdFx0XHRcdFx0cmVmZXJlbmNlVG9GaWVsZFZhbHVlID0gcnJbZmllbGRLZXldXHJcblx0XHRcdFx0XHRcdFx0XHRpZiAhXy5pc0VtcHR5KHJlZmVyZW5jZVRvRmllbGRWYWx1ZSlcclxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgZm9ybUZpZWxkLnR5cGUgPT0gJ3VzZXInXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0aWYgcmVsYXRlZE9iamVjdEZpZWxkLm11bHRpcGxlICYmIGZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdFxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0dGFibGVGaWVsZFZhbHVlID0gZ2V0U2VsZWN0VXNlclZhbHVlcyhyZWZlcmVuY2VUb0ZpZWxkVmFsdWUsIHNwYWNlSWQpXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZWxzZSBpZiAhcmVsYXRlZE9iamVjdEZpZWxkLm11bHRpcGxlICYmICFmb3JtRmllbGQuaXNfbXVsdGlzZWxlY3RcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRhYmxlRmllbGRWYWx1ZSA9IGdldFNlbGVjdFVzZXJWYWx1ZShyZWZlcmVuY2VUb0ZpZWxkVmFsdWUsIHNwYWNlSWQpXHJcblx0XHRcdFx0XHRcdFx0XHRcdGVsc2UgaWYgZm9ybUZpZWxkLnR5cGUgPT0gJ2dyb3VwJ1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdGlmIHJlbGF0ZWRPYmplY3RGaWVsZC5tdWx0aXBsZSAmJiBmb3JtRmllbGQuaXNfbXVsdGlzZWxlY3RcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRhYmxlRmllbGRWYWx1ZSA9IGdldFNlbGVjdE9yZ1ZhbHVlcyhyZWZlcmVuY2VUb0ZpZWxkVmFsdWUsIHNwYWNlSWQpXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0ZWxzZSBpZiAhcmVsYXRlZE9iamVjdEZpZWxkLm11bHRpcGxlICYmICFmb3JtRmllbGQuaXNfbXVsdGlzZWxlY3RcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdHRhYmxlRmllbGRWYWx1ZSA9IGdldFNlbGVjdE9yZ1ZhbHVlKHJlZmVyZW5jZVRvRmllbGRWYWx1ZSwgc3BhY2VJZClcclxuXHRcdFx0XHRcdFx0XHRlbHNlXHJcblx0XHRcdFx0XHRcdFx0XHR0YWJsZUZpZWxkVmFsdWUgPSBycltmaWVsZEtleV1cclxuXHRcdFx0XHRcdFx0XHR0YWJsZVZhbHVlSXRlbVtmb3JtRmllbGRLZXldID0gdGFibGVGaWVsZFZhbHVlXHJcblx0XHRcdFx0XHRpZiAhXy5pc0VtcHR5KHRhYmxlVmFsdWVJdGVtKVxyXG5cdFx0XHRcdFx0XHR0YWJsZVZhbHVlSXRlbS5faWQgPSByci5faWRcclxuXHRcdFx0XHRcdFx0dGFibGVWYWx1ZXMucHVzaCh0YWJsZVZhbHVlSXRlbSlcclxuXHRcdFx0XHRcdFx0cmVsYXRlZFRhYmxlSXRlbXMucHVzaCh7IF90YWJsZTogeyBfaWQ6IHJyLl9pZCwgX2NvZGU6IHRhYmxlQ29kZSB9IH0gKVxyXG5cclxuXHRcdFx0XHR2YWx1ZXNbdGFibGVDb2RlXSA9IHRhYmxlVmFsdWVzXHJcblx0XHRcdFx0cmVsYXRlZFRhYmxlc0luZm9bcmVsYXRlZE9iamVjdE5hbWVdID0gcmVsYXRlZFRhYmxlSXRlbXNcclxuXHJcblx0XHQjIOWmguaenOmFjee9ruS6huiEmuacrOWImeaJp+ihjOiEmuacrFxyXG5cdFx0aWYgb3cuZmllbGRfbWFwX3NjcmlwdFxyXG5cdFx0XHRfLmV4dGVuZCh2YWx1ZXMsIHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZXZhbEZpZWxkTWFwU2NyaXB0KG93LmZpZWxkX21hcF9zY3JpcHQsIG9iamVjdE5hbWUsIHNwYWNlSWQsIHJlY29yZElkKSlcclxuXHJcblx0IyDov4fmu6Tmjol2YWx1ZXPkuK3nmoTpnZ7ms5VrZXlcclxuXHRmaWx0ZXJWYWx1ZXMgPSB7fVxyXG5cdF8uZWFjaCBfLmtleXModmFsdWVzKSwgKGspIC0+XHJcblx0XHRpZiBmaWVsZENvZGVzLmluY2x1ZGVzKGspXHJcblx0XHRcdGZpbHRlclZhbHVlc1trXSA9IHZhbHVlc1trXVxyXG5cclxuXHRyZXR1cm4gZmlsdGVyVmFsdWVzXHJcblxyXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmV2YWxGaWVsZE1hcFNjcmlwdCA9IChmaWVsZF9tYXBfc2NyaXB0LCBvYmplY3ROYW1lLCBzcGFjZUlkLCBvYmplY3RJZCkgLT5cclxuXHRyZWNvcmQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqZWN0TmFtZSwgc3BhY2VJZCkuZmluZE9uZShvYmplY3RJZClcclxuXHRzY3JpcHQgPSBcIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHJlY29yZCkgeyBcIiArIGZpZWxkX21hcF9zY3JpcHQgKyBcIiB9XCJcclxuXHRmdW5jID0gX2V2YWwoc2NyaXB0LCBcImZpZWxkX21hcF9zY3JpcHRcIilcclxuXHR2YWx1ZXMgPSBmdW5jKHJlY29yZClcclxuXHRpZiBfLmlzT2JqZWN0IHZhbHVlc1xyXG5cdFx0cmV0dXJuIHZhbHVlc1xyXG5cdGVsc2VcclxuXHRcdGNvbnNvbGUuZXJyb3IgXCJldmFsRmllbGRNYXBTY3JpcHQ6IOiEmuacrOi/lOWbnuWAvOexu+Wei+S4jeaYr+WvueixoVwiXHJcblx0cmV0dXJuIHt9XHJcblxyXG5cclxuXHJcbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuaW5pdGlhdGVBdHRhY2ggPSAocmVjb3JkSWRzLCBzcGFjZUlkLCBpbnNJZCwgYXBwcm92ZUlkKSAtPlxyXG5cclxuXHRDcmVhdG9yLkNvbGxlY3Rpb25zWydjbXNfZmlsZXMnXS5maW5kKHtcclxuXHRcdHNwYWNlOiBzcGFjZUlkLFxyXG5cdFx0cGFyZW50OiByZWNvcmRJZHNcclxuXHR9KS5mb3JFYWNoIChjZikgLT5cclxuXHRcdF8uZWFjaCBjZi52ZXJzaW9ucywgKHZlcnNpb25JZCwgaWR4KSAtPlxyXG5cdFx0XHRmID0gQ3JlYXRvci5Db2xsZWN0aW9uc1snY2ZzLmZpbGVzLmZpbGVyZWNvcmQnXS5maW5kT25lKHZlcnNpb25JZClcclxuXHRcdFx0bmV3RmlsZSA9IG5ldyBGUy5GaWxlKClcclxuXHJcblx0XHRcdG5ld0ZpbGUuYXR0YWNoRGF0YSBmLmNyZWF0ZVJlYWRTdHJlYW0oJ2ZpbGVzJyksIHtcclxuXHRcdFx0XHRcdHR5cGU6IGYub3JpZ2luYWwudHlwZVxyXG5cdFx0XHR9LCAoZXJyKSAtPlxyXG5cdFx0XHRcdGlmIChlcnIpXHJcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKGVyci5lcnJvciwgZXJyLnJlYXNvbilcclxuXHJcblx0XHRcdFx0bmV3RmlsZS5uYW1lKGYubmFtZSgpKVxyXG5cdFx0XHRcdG5ld0ZpbGUuc2l6ZShmLnNpemUoKSlcclxuXHRcdFx0XHRtZXRhZGF0YSA9IHtcclxuXHRcdFx0XHRcdG93bmVyOiBmLm1ldGFkYXRhLm93bmVyLFxyXG5cdFx0XHRcdFx0b3duZXJfbmFtZTogZi5tZXRhZGF0YS5vd25lcl9uYW1lLFxyXG5cdFx0XHRcdFx0c3BhY2U6IHNwYWNlSWQsXHJcblx0XHRcdFx0XHRpbnN0YW5jZTogaW5zSWQsXHJcblx0XHRcdFx0XHRhcHByb3ZlOiBhcHByb3ZlSWRcclxuXHRcdFx0XHRcdHBhcmVudDogY2YuX2lkXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiBpZHggaXMgMFxyXG5cdFx0XHRcdFx0bWV0YWRhdGEuY3VycmVudCA9IHRydWVcclxuXHJcblx0XHRcdFx0bmV3RmlsZS5tZXRhZGF0YSA9IG1ldGFkYXRhXHJcblx0XHRcdFx0Y2ZzLmluc3RhbmNlcy5pbnNlcnQobmV3RmlsZSlcclxuXHJcblx0cmV0dXJuXHJcblxyXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmluaXRpYXRlUmVjb3JkSW5zdGFuY2VJbmZvID0gKHJlY29yZElkcywgaW5zSWQsIHNwYWNlSWQpIC0+XHJcblx0Q3JlYXRvci5nZXRDb2xsZWN0aW9uKHJlY29yZElkcy5vLCBzcGFjZUlkKS51cGRhdGUocmVjb3JkSWRzLmlkc1swXSwge1xyXG5cdFx0JHB1c2g6IHtcclxuXHRcdFx0aW5zdGFuY2VzOiB7XHJcblx0XHRcdFx0JGVhY2g6IFt7XHJcblx0XHRcdFx0XHRfaWQ6IGluc0lkLFxyXG5cdFx0XHRcdFx0c3RhdGU6ICdkcmFmdCdcclxuXHRcdFx0XHR9XSxcclxuXHRcdFx0XHQkcG9zaXRpb246IDBcclxuXHRcdFx0fVxyXG5cdFx0fSxcclxuXHRcdCRzZXQ6IHtcclxuXHRcdFx0bG9ja2VkOiB0cnVlXHJcblx0XHRcdGluc3RhbmNlX3N0YXRlOiAnZHJhZnQnXHJcblx0XHR9XHJcblx0fSlcclxuXHJcblx0cmV0dXJuXHJcblxyXG5cclxudXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5pbml0aWF0ZVJlbGF0ZWRSZWNvcmRJbnN0YW5jZUluZm8gPSAocmVsYXRlZFRhYmxlc0luZm8sIGluc0lkLCBzcGFjZUlkKSAtPlxyXG5cdF8uZWFjaCByZWxhdGVkVGFibGVzSW5mbywgKHRhYmxlSXRlbXMsIHJlbGF0ZWRPYmplY3ROYW1lKSAtPlxyXG5cdFx0cmVsYXRlZENvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ocmVsYXRlZE9iamVjdE5hbWUsIHNwYWNlSWQpXHJcblx0XHRfLmVhY2ggdGFibGVJdGVtcywgKGl0ZW0pIC0+XHJcblx0XHRcdHJlbGF0ZWRDb2xsZWN0aW9uLnVwZGF0ZShpdGVtLl90YWJsZS5faWQsIHtcclxuXHRcdFx0XHQkc2V0OiB7XHJcblx0XHRcdFx0XHRpbnN0YW5jZXM6IFt7XHJcblx0XHRcdFx0XHRcdF9pZDogaW5zSWQsXHJcblx0XHRcdFx0XHRcdHN0YXRlOiAnZHJhZnQnXHJcblx0XHRcdFx0XHR9XSxcclxuXHRcdFx0XHRcdF90YWJsZTogaXRlbS5fdGFibGVcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblxyXG5cdHJldHVyblxyXG5cclxudXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5jaGVja0lzSW5BcHByb3ZhbCA9IChyZWNvcmRJZHMsIHNwYWNlSWQpIC0+XHJcblx0cmVjb3JkID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKHJlY29yZElkcy5vLCBzcGFjZUlkKS5maW5kT25lKHtcclxuXHRcdF9pZDogcmVjb3JkSWRzLmlkc1swXSwgaW5zdGFuY2VzOiB7ICRleGlzdHM6IHRydWUgfVxyXG5cdH0sIHsgZmllbGRzOiB7IGluc3RhbmNlczogMSB9IH0pXHJcblxyXG5cdGlmIHJlY29yZCBhbmQgcmVjb3JkLmluc3RhbmNlc1swXS5zdGF0ZSBpc250ICdjb21wbGV0ZWQnIGFuZCBDcmVhdG9yLkNvbGxlY3Rpb25zLmluc3RhbmNlcy5maW5kKHJlY29yZC5pbnN0YW5jZXNbMF0uX2lkKS5jb3VudCgpID4gMFxyXG5cdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3IhJywgXCLmraTorrDlvZXlt7Llj5HotbfmtYHnqIvmraPlnKjlrqHmibnkuK3vvIzlvoXlrqHmibnnu5PmnZ/mlrnlj6/lj5HotbfkuIvkuIDmrKHlrqHmibnvvIFcIilcclxuXHJcblx0cmV0dXJuXHJcblxyXG4iLCJ2YXIgX2V2YWw7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXG5cbl9ldmFsID0gcmVxdWlyZSgnZXZhbCcpO1xuXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsID0ge307XG5cbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuY2hlY2tfYXV0aG9yaXphdGlvbiA9IGZ1bmN0aW9uKHJlcSkge1xuICB2YXIgYXV0aFRva2VuLCBoYXNoZWRUb2tlbiwgcXVlcnksIHVzZXIsIHVzZXJJZDtcbiAgcXVlcnkgPSByZXEucXVlcnk7XG4gIHVzZXJJZCA9IHF1ZXJ5W1wiWC1Vc2VyLUlkXCJdO1xuICBhdXRoVG9rZW4gPSBxdWVyeVtcIlgtQXV0aC1Ub2tlblwiXTtcbiAgaWYgKCF1c2VySWQgfHwgIWF1dGhUb2tlbikge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNDAxLCAnVW5hdXRob3JpemVkJyk7XG4gIH1cbiAgaGFzaGVkVG9rZW4gPSBBY2NvdW50cy5faGFzaExvZ2luVG9rZW4oYXV0aFRva2VuKTtcbiAgdXNlciA9IE1ldGVvci51c2Vycy5maW5kT25lKHtcbiAgICBfaWQ6IHVzZXJJZCxcbiAgICBcInNlcnZpY2VzLnJlc3VtZS5sb2dpblRva2Vucy5oYXNoZWRUb2tlblwiOiBoYXNoZWRUb2tlblxuICB9KTtcbiAgaWYgKCF1c2VyKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig0MDEsICdVbmF1dGhvcml6ZWQnKTtcbiAgfVxuICByZXR1cm4gdXNlcjtcbn07XG5cbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0U3BhY2UgPSBmdW5jdGlvbihzcGFjZV9pZCkge1xuICB2YXIgc3BhY2U7XG4gIHNwYWNlID0gQ3JlYXRvci5Db2xsZWN0aW9ucy5zcGFjZXMuZmluZE9uZShzcGFjZV9pZCk7XG4gIGlmICghc3BhY2UpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvciEnLCBcInNwYWNlX2lk5pyJ6K+v5oiW5q2kc3BhY2Xlt7Lnu4/ooqvliKDpmaRcIik7XG4gIH1cbiAgcmV0dXJuIHNwYWNlO1xufTtcblxudXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5nZXRGbG93ID0gZnVuY3Rpb24oZmxvd19pZCkge1xuICB2YXIgZmxvdztcbiAgZmxvdyA9IENyZWF0b3IuQ29sbGVjdGlvbnMuZmxvd3MuZmluZE9uZShmbG93X2lkKTtcbiAgaWYgKCFmbG93KSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3IhJywgXCJpZOacieivr+aIluatpOa1geeoi+W3sue7j+iiq+WIoOmZpFwiKTtcbiAgfVxuICByZXR1cm4gZmxvdztcbn07XG5cbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0U3BhY2VVc2VyID0gZnVuY3Rpb24oc3BhY2VfaWQsIHVzZXJfaWQpIHtcbiAgdmFyIHNwYWNlX3VzZXI7XG4gIHNwYWNlX3VzZXIgPSBDcmVhdG9yLkNvbGxlY3Rpb25zLnNwYWNlX3VzZXJzLmZpbmRPbmUoe1xuICAgIHNwYWNlOiBzcGFjZV9pZCxcbiAgICB1c2VyOiB1c2VyX2lkXG4gIH0pO1xuICBpZiAoIXNwYWNlX3VzZXIpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvciEnLCBcInVzZXJfaWTlr7nlupTnmoTnlKjmiLfkuI3lsZ7kuo7lvZPliY1zcGFjZVwiKTtcbiAgfVxuICByZXR1cm4gc3BhY2VfdXNlcjtcbn07XG5cbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0U3BhY2VVc2VyT3JnSW5mbyA9IGZ1bmN0aW9uKHNwYWNlX3VzZXIpIHtcbiAgdmFyIGluZm8sIG9yZztcbiAgaW5mbyA9IG5ldyBPYmplY3Q7XG4gIGluZm8ub3JnYW5pemF0aW9uID0gc3BhY2VfdXNlci5vcmdhbml6YXRpb247XG4gIG9yZyA9IENyZWF0b3IuQ29sbGVjdGlvbnMub3JnYW5pemF0aW9ucy5maW5kT25lKHNwYWNlX3VzZXIub3JnYW5pemF0aW9uLCB7XG4gICAgZmllbGRzOiB7XG4gICAgICBuYW1lOiAxLFxuICAgICAgZnVsbG5hbWU6IDFcbiAgICB9XG4gIH0pO1xuICBpbmZvLm9yZ2FuaXphdGlvbl9uYW1lID0gb3JnLm5hbWU7XG4gIGluZm8ub3JnYW5pemF0aW9uX2Z1bGxuYW1lID0gb3JnLmZ1bGxuYW1lO1xuICByZXR1cm4gaW5mbztcbn07XG5cbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuaXNGbG93RW5hYmxlZCA9IGZ1bmN0aW9uKGZsb3cpIHtcbiAgaWYgKGZsb3cuc3RhdGUgIT09IFwiZW5hYmxlZFwiKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcignZXJyb3IhJywgXCLmtYHnqIvmnKrlkK/nlKgs5pON5L2c5aSx6LSlXCIpO1xuICB9XG59O1xuXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmlzRmxvd1NwYWNlTWF0Y2hlZCA9IGZ1bmN0aW9uKGZsb3csIHNwYWNlX2lkKSB7XG4gIGlmIChmbG93LnNwYWNlICE9PSBzcGFjZV9pZCkge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yIScsIFwi5rWB56iL5ZKM5bel5L2c5Yy6SUTkuI3ljLnphY1cIik7XG4gIH1cbn07XG5cbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0Rm9ybSA9IGZ1bmN0aW9uKGZvcm1faWQpIHtcbiAgdmFyIGZvcm07XG4gIGZvcm0gPSBDcmVhdG9yLkNvbGxlY3Rpb25zLmZvcm1zLmZpbmRPbmUoZm9ybV9pZCk7XG4gIGlmICghZm9ybSkge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoJ2Vycm9yIScsICfooajljZVJROacieivr+aIluatpOihqOWNleW3sue7j+iiq+WIoOmZpCcpO1xuICB9XG4gIHJldHVybiBmb3JtO1xufTtcblxudXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5nZXRDYXRlZ29yeSA9IGZ1bmN0aW9uKGNhdGVnb3J5X2lkKSB7XG4gIHJldHVybiBDcmVhdG9yLkNvbGxlY3Rpb25zLmNhdGVnb3JpZXMuZmluZE9uZShjYXRlZ29yeV9pZCk7XG59O1xuXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmNyZWF0ZV9pbnN0YW5jZSA9IGZ1bmN0aW9uKGluc3RhbmNlX2Zyb21fY2xpZW50LCB1c2VyX2luZm8pIHtcbiAgdmFyIGFwcHJfb2JqLCBhcHByb3ZlX2Zyb21fY2xpZW50LCBjYXRlZ29yeSwgZmxvdywgZmxvd19pZCwgZm9ybSwgaW5zX29iaiwgbmV3X2luc19pZCwgbm93LCBwZXJtaXNzaW9ucywgcmVsYXRlZFRhYmxlc0luZm8sIHNwYWNlLCBzcGFjZV9pZCwgc3BhY2VfdXNlciwgc3BhY2VfdXNlcl9vcmdfaW5mbywgc3RhcnRfc3RlcCwgdHJhY2VfZnJvbV9jbGllbnQsIHRyYWNlX29iaiwgdXNlcl9pZDtcbiAgY2hlY2soaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRcIl0sIFN0cmluZyk7XG4gIGNoZWNrKGluc3RhbmNlX2Zyb21fY2xpZW50W1wic3BhY2VcIl0sIFN0cmluZyk7XG4gIGNoZWNrKGluc3RhbmNlX2Zyb21fY2xpZW50W1wiZmxvd1wiXSwgU3RyaW5nKTtcbiAgY2hlY2soaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJyZWNvcmRfaWRzXCJdLCBbXG4gICAge1xuICAgICAgbzogU3RyaW5nLFxuICAgICAgaWRzOiBbU3RyaW5nXVxuICAgIH1cbiAgXSk7XG4gIHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuY2hlY2tJc0luQXBwcm92YWwoaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJyZWNvcmRfaWRzXCJdWzBdLCBpbnN0YW5jZV9mcm9tX2NsaWVudFtcInNwYWNlXCJdKTtcbiAgc3BhY2VfaWQgPSBpbnN0YW5jZV9mcm9tX2NsaWVudFtcInNwYWNlXCJdO1xuICBmbG93X2lkID0gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJmbG93XCJdO1xuICB1c2VyX2lkID0gdXNlcl9pbmZvLl9pZDtcbiAgdHJhY2VfZnJvbV9jbGllbnQgPSBudWxsO1xuICBhcHByb3ZlX2Zyb21fY2xpZW50ID0gbnVsbDtcbiAgaWYgKGluc3RhbmNlX2Zyb21fY2xpZW50W1widHJhY2VzXCJdICYmIGluc3RhbmNlX2Zyb21fY2xpZW50W1widHJhY2VzXCJdWzBdKSB7XG4gICAgdHJhY2VfZnJvbV9jbGllbnQgPSBpbnN0YW5jZV9mcm9tX2NsaWVudFtcInRyYWNlc1wiXVswXTtcbiAgICBpZiAodHJhY2VfZnJvbV9jbGllbnRbXCJhcHByb3Zlc1wiXSAmJiB0cmFjZV9mcm9tX2NsaWVudFtcImFwcHJvdmVzXCJdWzBdKSB7XG4gICAgICBhcHByb3ZlX2Zyb21fY2xpZW50ID0gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJ0cmFjZXNcIl1bMF1bXCJhcHByb3Zlc1wiXVswXTtcbiAgICB9XG4gIH1cbiAgc3BhY2UgPSB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmdldFNwYWNlKHNwYWNlX2lkKTtcbiAgZmxvdyA9IHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0RmxvdyhmbG93X2lkKTtcbiAgc3BhY2VfdXNlciA9IHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0U3BhY2VVc2VyKHNwYWNlX2lkLCB1c2VyX2lkKTtcbiAgc3BhY2VfdXNlcl9vcmdfaW5mbyA9IHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuZ2V0U3BhY2VVc2VyT3JnSW5mbyhzcGFjZV91c2VyKTtcbiAgdXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5pc0Zsb3dFbmFibGVkKGZsb3cpO1xuICB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmlzRmxvd1NwYWNlTWF0Y2hlZChmbG93LCBzcGFjZV9pZCk7XG4gIGZvcm0gPSB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmdldEZvcm0oZmxvdy5mb3JtKTtcbiAgcGVybWlzc2lvbnMgPSBwZXJtaXNzaW9uTWFuYWdlci5nZXRGbG93UGVybWlzc2lvbnMoZmxvd19pZCwgdXNlcl9pZCk7XG4gIGlmICghcGVybWlzc2lvbnMuaW5jbHVkZXMoXCJhZGRcIikpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvciEnLCBcIuW9k+WJjeeUqOaIt+ayoeacieatpOa1geeoi+eahOaWsOW7uuadg+mZkFwiKTtcbiAgfVxuICBub3cgPSBuZXcgRGF0ZTtcbiAgaW5zX29iaiA9IHt9O1xuICBpbnNfb2JqLl9pZCA9IENyZWF0b3IuQ29sbGVjdGlvbnMuaW5zdGFuY2VzLl9tYWtlTmV3SUQoKTtcbiAgaW5zX29iai5zcGFjZSA9IHNwYWNlX2lkO1xuICBpbnNfb2JqLmZsb3cgPSBmbG93X2lkO1xuICBpbnNfb2JqLmZsb3dfdmVyc2lvbiA9IGZsb3cuY3VycmVudC5faWQ7XG4gIGluc19vYmouZm9ybSA9IGZsb3cuZm9ybTtcbiAgaW5zX29iai5mb3JtX3ZlcnNpb24gPSBmbG93LmN1cnJlbnQuZm9ybV92ZXJzaW9uO1xuICBpbnNfb2JqLm5hbWUgPSBmbG93Lm5hbWU7XG4gIGluc19vYmouc3VibWl0dGVyID0gdXNlcl9pZDtcbiAgaW5zX29iai5zdWJtaXR0ZXJfbmFtZSA9IHVzZXJfaW5mby5uYW1lO1xuICBpbnNfb2JqLmFwcGxpY2FudCA9IGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50XCJdID8gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRcIl0gOiB1c2VyX2lkO1xuICBpbnNfb2JqLmFwcGxpY2FudF9uYW1lID0gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRfbmFtZVwiXSA/IGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50X25hbWVcIl0gOiB1c2VyX2luZm8ubmFtZTtcbiAgaW5zX29iai5hcHBsaWNhbnRfb3JnYW5pemF0aW9uID0gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRfb3JnYW5pemF0aW9uXCJdID8gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRfb3JnYW5pemF0aW9uXCJdIDogc3BhY2VfdXNlci5vcmdhbml6YXRpb247XG4gIGluc19vYmouYXBwbGljYW50X29yZ2FuaXphdGlvbl9uYW1lID0gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRfb3JnYW5pemF0aW9uX25hbWVcIl0gPyBpbnN0YW5jZV9mcm9tX2NsaWVudFtcImFwcGxpY2FudF9vcmdhbml6YXRpb25fbmFtZVwiXSA6IHNwYWNlX3VzZXJfb3JnX2luZm8ub3JnYW5pemF0aW9uX25hbWU7XG4gIGluc19vYmouYXBwbGljYW50X29yZ2FuaXphdGlvbl9mdWxsbmFtZSA9IGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50X29yZ2FuaXphdGlvbl9mdWxsbmFtZVwiXSA/IGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50X29yZ2FuaXphdGlvbl9mdWxsbmFtZVwiXSA6IHNwYWNlX3VzZXJfb3JnX2luZm8ub3JnYW5pemF0aW9uX2Z1bGxuYW1lO1xuICBpbnNfb2JqLmFwcGxpY2FudF9jb21wYW55ID0gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRfY29tcGFueVwiXSA/IGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50X2NvbXBhbnlcIl0gOiBzcGFjZV91c2VyLmNvbXBhbnlfaWQ7XG4gIGluc19vYmouc3RhdGUgPSAnZHJhZnQnO1xuICBpbnNfb2JqLmNvZGUgPSAnJztcbiAgaW5zX29iai5pc19hcmNoaXZlZCA9IGZhbHNlO1xuICBpbnNfb2JqLmlzX2RlbGV0ZWQgPSBmYWxzZTtcbiAgaW5zX29iai5jcmVhdGVkID0gbm93O1xuICBpbnNfb2JqLmNyZWF0ZWRfYnkgPSB1c2VyX2lkO1xuICBpbnNfb2JqLm1vZGlmaWVkID0gbm93O1xuICBpbnNfb2JqLm1vZGlmaWVkX2J5ID0gdXNlcl9pZDtcbiAgaW5zX29iai52YWx1ZXMgPSBuZXcgT2JqZWN0O1xuICBpbnNfb2JqLnJlY29yZF9pZHMgPSBpbnN0YW5jZV9mcm9tX2NsaWVudFtcInJlY29yZF9pZHNcIl07XG4gIGlmIChzcGFjZV91c2VyLmNvbXBhbnlfaWQpIHtcbiAgICBpbnNfb2JqLmNvbXBhbnlfaWQgPSBzcGFjZV91c2VyLmNvbXBhbnlfaWQ7XG4gIH1cbiAgdHJhY2Vfb2JqID0ge307XG4gIHRyYWNlX29iai5faWQgPSBuZXcgTW9uZ28uT2JqZWN0SUQoKS5fc3RyO1xuICB0cmFjZV9vYmouaW5zdGFuY2UgPSBpbnNfb2JqLl9pZDtcbiAgdHJhY2Vfb2JqLmlzX2ZpbmlzaGVkID0gZmFsc2U7XG4gIHN0YXJ0X3N0ZXAgPSBfLmZpbmQoZmxvdy5jdXJyZW50LnN0ZXBzLCBmdW5jdGlvbihzdGVwKSB7XG4gICAgcmV0dXJuIHN0ZXAuc3RlcF90eXBlID09PSAnc3RhcnQnO1xuICB9KTtcbiAgdHJhY2Vfb2JqLnN0ZXAgPSBzdGFydF9zdGVwLl9pZDtcbiAgdHJhY2Vfb2JqLm5hbWUgPSBzdGFydF9zdGVwLm5hbWU7XG4gIHRyYWNlX29iai5zdGFydF9kYXRlID0gbm93O1xuICBhcHByX29iaiA9IHt9O1xuICBhcHByX29iai5faWQgPSBuZXcgTW9uZ28uT2JqZWN0SUQoKS5fc3RyO1xuICBhcHByX29iai5pbnN0YW5jZSA9IGluc19vYmouX2lkO1xuICBhcHByX29iai50cmFjZSA9IHRyYWNlX29iai5faWQ7XG4gIGFwcHJfb2JqLmlzX2ZpbmlzaGVkID0gZmFsc2U7XG4gIGFwcHJfb2JqLnVzZXIgPSBpbnN0YW5jZV9mcm9tX2NsaWVudFtcImFwcGxpY2FudFwiXSA/IGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50XCJdIDogdXNlcl9pZDtcbiAgYXBwcl9vYmoudXNlcl9uYW1lID0gaW5zdGFuY2VfZnJvbV9jbGllbnRbXCJhcHBsaWNhbnRfbmFtZVwiXSA/IGluc3RhbmNlX2Zyb21fY2xpZW50W1wiYXBwbGljYW50X25hbWVcIl0gOiB1c2VyX2luZm8ubmFtZTtcbiAgYXBwcl9vYmouaGFuZGxlciA9IHVzZXJfaWQ7XG4gIGFwcHJfb2JqLmhhbmRsZXJfbmFtZSA9IHVzZXJfaW5mby5uYW1lO1xuICBhcHByX29iai5oYW5kbGVyX29yZ2FuaXphdGlvbiA9IHNwYWNlX3VzZXIub3JnYW5pemF0aW9uO1xuICBhcHByX29iai5oYW5kbGVyX29yZ2FuaXphdGlvbl9uYW1lID0gc3BhY2VfdXNlcl9vcmdfaW5mby5uYW1lO1xuICBhcHByX29iai5oYW5kbGVyX29yZ2FuaXphdGlvbl9mdWxsbmFtZSA9IHNwYWNlX3VzZXJfb3JnX2luZm8uZnVsbG5hbWU7XG4gIGFwcHJfb2JqLnR5cGUgPSAnZHJhZnQnO1xuICBhcHByX29iai5zdGFydF9kYXRlID0gbm93O1xuICBhcHByX29iai5yZWFkX2RhdGUgPSBub3c7XG4gIGFwcHJfb2JqLmlzX3JlYWQgPSB0cnVlO1xuICBhcHByX29iai5pc19lcnJvciA9IGZhbHNlO1xuICBhcHByX29iai5kZXNjcmlwdGlvbiA9ICcnO1xuICByZWxhdGVkVGFibGVzSW5mbyA9IHt9O1xuICBhcHByX29iai52YWx1ZXMgPSB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmluaXRpYXRlVmFsdWVzKGluc19vYmoucmVjb3JkX2lkc1swXSwgZmxvd19pZCwgc3BhY2VfaWQsIGZvcm0uY3VycmVudC5maWVsZHMsIHJlbGF0ZWRUYWJsZXNJbmZvKTtcbiAgdHJhY2Vfb2JqLmFwcHJvdmVzID0gW2FwcHJfb2JqXTtcbiAgaW5zX29iai50cmFjZXMgPSBbdHJhY2Vfb2JqXTtcbiAgaW5zX29iai5pbmJveF91c2VycyA9IGluc3RhbmNlX2Zyb21fY2xpZW50LmluYm94X3VzZXJzIHx8IFtdO1xuICBpbnNfb2JqLmN1cnJlbnRfc3RlcF9uYW1lID0gc3RhcnRfc3RlcC5uYW1lO1xuICBpZiAoZmxvdy5hdXRvX3JlbWluZCA9PT0gdHJ1ZSkge1xuICAgIGluc19vYmouYXV0b19yZW1pbmQgPSB0cnVlO1xuICB9XG4gIGluc19vYmouZmxvd19uYW1lID0gZmxvdy5uYW1lO1xuICBpZiAoZm9ybS5jYXRlZ29yeSkge1xuICAgIGNhdGVnb3J5ID0gdXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5nZXRDYXRlZ29yeShmb3JtLmNhdGVnb3J5KTtcbiAgICBpZiAoY2F0ZWdvcnkpIHtcbiAgICAgIGluc19vYmouY2F0ZWdvcnlfbmFtZSA9IGNhdGVnb3J5Lm5hbWU7XG4gICAgICBpbnNfb2JqLmNhdGVnb3J5ID0gY2F0ZWdvcnkuX2lkO1xuICAgIH1cbiAgfVxuICBuZXdfaW5zX2lkID0gQ3JlYXRvci5Db2xsZWN0aW9ucy5pbnN0YW5jZXMuaW5zZXJ0KGluc19vYmopO1xuICB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmluaXRpYXRlUmVjb3JkSW5zdGFuY2VJbmZvKGluc19vYmoucmVjb3JkX2lkc1swXSwgbmV3X2luc19pZCwgc3BhY2VfaWQpO1xuICB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmluaXRpYXRlUmVsYXRlZFJlY29yZEluc3RhbmNlSW5mbyhyZWxhdGVkVGFibGVzSW5mbywgbmV3X2luc19pZCwgc3BhY2VfaWQpO1xuICB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmluaXRpYXRlQXR0YWNoKGluc19vYmoucmVjb3JkX2lkc1swXSwgc3BhY2VfaWQsIGluc19vYmouX2lkLCBhcHByX29iai5faWQpO1xuICByZXR1cm4gbmV3X2luc19pZDtcbn07XG5cbnV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuaW5pdGlhdGVWYWx1ZXMgPSBmdW5jdGlvbihyZWNvcmRJZHMsIGZsb3dJZCwgc3BhY2VJZCwgZmllbGRzLCByZWxhdGVkVGFibGVzSW5mbykge1xuICB2YXIgZmllbGRDb2RlcywgZmlsdGVyVmFsdWVzLCBmbG93LCBmb3JtLCBmb3JtRmllbGRzLCBmb3JtVGFibGVGaWVsZHMsIGZvcm1UYWJsZUZpZWxkc0NvZGUsIGdldEZpZWxkT2RhdGFWYWx1ZSwgZ2V0Rm9ybUZpZWxkLCBnZXRGb3JtVGFibGVGaWVsZCwgZ2V0Rm9ybVRhYmxlRmllbGRDb2RlLCBnZXRGb3JtVGFibGVTdWJGaWVsZCwgZ2V0UmVsYXRlZE9iamVjdEZpZWxkQ29kZSwgZ2V0U2VsZWN0T3JnVmFsdWUsIGdldFNlbGVjdE9yZ1ZhbHVlcywgZ2V0U2VsZWN0VXNlclZhbHVlLCBnZXRTZWxlY3RVc2VyVmFsdWVzLCBvYmplY3QsIG9iamVjdE5hbWUsIG93LCByZWNvcmQsIHJlY29yZElkLCByZWYsIHJlbGF0ZWRPYmplY3RzLCByZWxhdGVkT2JqZWN0c0tleXMsIHRhYmxlRmllbGRDb2RlcywgdGFibGVGaWVsZE1hcCwgdGFibGVUb1JlbGF0ZWRNYXAsIHZhbHVlcztcbiAgZmllbGRDb2RlcyA9IFtdO1xuICBfLmVhY2goZmllbGRzLCBmdW5jdGlvbihmKSB7XG4gICAgaWYgKGYudHlwZSA9PT0gJ3NlY3Rpb24nKSB7XG4gICAgICByZXR1cm4gXy5lYWNoKGYuZmllbGRzLCBmdW5jdGlvbihmZikge1xuICAgICAgICByZXR1cm4gZmllbGRDb2Rlcy5wdXNoKGZmLmNvZGUpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmaWVsZENvZGVzLnB1c2goZi5jb2RlKTtcbiAgICB9XG4gIH0pO1xuICB2YWx1ZXMgPSB7fTtcbiAgb2JqZWN0TmFtZSA9IHJlY29yZElkcy5vO1xuICBvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChvYmplY3ROYW1lLCBzcGFjZUlkKTtcbiAgcmVjb3JkSWQgPSByZWNvcmRJZHMuaWRzWzBdO1xuICBvdyA9IENyZWF0b3IuQ29sbGVjdGlvbnMub2JqZWN0X3dvcmtmbG93cy5maW5kT25lKHtcbiAgICBvYmplY3RfbmFtZTogb2JqZWN0TmFtZSxcbiAgICBmbG93X2lkOiBmbG93SWRcbiAgfSk7XG4gIHJlY29yZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihvYmplY3ROYW1lLCBzcGFjZUlkKS5maW5kT25lKHJlY29yZElkKTtcbiAgZmxvdyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbignZmxvd3MnKS5maW5kT25lKGZsb3dJZCwge1xuICAgIGZpZWxkczoge1xuICAgICAgZm9ybTogMVxuICAgIH1cbiAgfSk7XG4gIGlmIChvdyAmJiByZWNvcmQpIHtcbiAgICBmb3JtID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiZm9ybXNcIikuZmluZE9uZShmbG93LmZvcm0pO1xuICAgIGZvcm1GaWVsZHMgPSBmb3JtLmN1cnJlbnQuZmllbGRzIHx8IFtdO1xuICAgIHJlbGF0ZWRPYmplY3RzID0gQ3JlYXRvci5nZXRSZWxhdGVkT2JqZWN0cyhvYmplY3ROYW1lLCBzcGFjZUlkKTtcbiAgICByZWxhdGVkT2JqZWN0c0tleXMgPSBfLnBsdWNrKHJlbGF0ZWRPYmplY3RzLCAnb2JqZWN0X25hbWUnKTtcbiAgICBmb3JtVGFibGVGaWVsZHMgPSBfLmZpbHRlcihmb3JtRmllbGRzLCBmdW5jdGlvbihmb3JtRmllbGQpIHtcbiAgICAgIHJldHVybiBmb3JtRmllbGQudHlwZSA9PT0gJ3RhYmxlJztcbiAgICB9KTtcbiAgICBmb3JtVGFibGVGaWVsZHNDb2RlID0gXy5wbHVjayhmb3JtVGFibGVGaWVsZHMsICdjb2RlJyk7XG4gICAgZ2V0UmVsYXRlZE9iamVjdEZpZWxkQ29kZSA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIF8uZmluZChyZWxhdGVkT2JqZWN0c0tleXMsIGZ1bmN0aW9uKHJlbGF0ZWRPYmplY3RzS2V5KSB7XG4gICAgICAgIHJldHVybiBrZXkuc3RhcnRzV2l0aChyZWxhdGVkT2JqZWN0c0tleSArICcuJyk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGdldEZvcm1UYWJsZUZpZWxkQ29kZSA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIF8uZmluZChmb3JtVGFibGVGaWVsZHNDb2RlLCBmdW5jdGlvbihmb3JtVGFibGVGaWVsZENvZGUpIHtcbiAgICAgICAgcmV0dXJuIGtleS5zdGFydHNXaXRoKGZvcm1UYWJsZUZpZWxkQ29kZSArICcuJyk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGdldEZvcm1UYWJsZUZpZWxkID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gXy5maW5kKGZvcm1UYWJsZUZpZWxkcywgZnVuY3Rpb24oZikge1xuICAgICAgICByZXR1cm4gZi5jb2RlID09PSBrZXk7XG4gICAgICB9KTtcbiAgICB9O1xuICAgIGdldEZvcm1GaWVsZCA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIF8uZmluZChmb3JtRmllbGRzLCBmdW5jdGlvbihmKSB7XG4gICAgICAgIHJldHVybiBmLmNvZGUgPT09IGtleTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgZ2V0Rm9ybVRhYmxlU3ViRmllbGQgPSBmdW5jdGlvbih0YWJsZUZpZWxkLCBzdWJGaWVsZENvZGUpIHtcbiAgICAgIHJldHVybiBfLmZpbmQodGFibGVGaWVsZC5maWVsZHMsIGZ1bmN0aW9uKGYpIHtcbiAgICAgICAgcmV0dXJuIGYuY29kZSA9PT0gc3ViRmllbGRDb2RlO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICBnZXRGaWVsZE9kYXRhVmFsdWUgPSBmdW5jdGlvbihvYmpOYW1lLCBpZCkge1xuICAgICAgdmFyIF9yZWNvcmQsIF9yZWNvcmRzLCBvYmo7XG4gICAgICBvYmogPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqTmFtZSk7XG4gICAgICBpZiAoIW9iaikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoXy5pc1N0cmluZyhpZCkpIHtcbiAgICAgICAgX3JlY29yZCA9IG9iai5maW5kT25lKGlkKTtcbiAgICAgICAgaWYgKF9yZWNvcmQpIHtcbiAgICAgICAgICBfcmVjb3JkWydAbGFiZWwnXSA9IF9yZWNvcmQubmFtZTtcbiAgICAgICAgICByZXR1cm4gX3JlY29yZDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChfLmlzQXJyYXkoaWQpKSB7XG4gICAgICAgIF9yZWNvcmRzID0gW107XG4gICAgICAgIG9iai5maW5kKHtcbiAgICAgICAgICBfaWQ6IHtcbiAgICAgICAgICAgICRpbjogaWRcbiAgICAgICAgICB9XG4gICAgICAgIH0pLmZvckVhY2goZnVuY3Rpb24oX3JlY29yZCkge1xuICAgICAgICAgIF9yZWNvcmRbJ0BsYWJlbCddID0gX3JlY29yZC5uYW1lO1xuICAgICAgICAgIHJldHVybiBfcmVjb3Jkcy5wdXNoKF9yZWNvcmQpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKCFfLmlzRW1wdHkoX3JlY29yZHMpKSB7XG4gICAgICAgICAgcmV0dXJuIF9yZWNvcmRzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgICBnZXRTZWxlY3RVc2VyVmFsdWUgPSBmdW5jdGlvbih1c2VySWQsIHNwYWNlSWQpIHtcbiAgICAgIHZhciBzdTtcbiAgICAgIHN1ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKCdzcGFjZV91c2VycycpLmZpbmRPbmUoe1xuICAgICAgICBzcGFjZTogc3BhY2VJZCxcbiAgICAgICAgdXNlcjogdXNlcklkXG4gICAgICB9KTtcbiAgICAgIHN1LmlkID0gdXNlcklkO1xuICAgICAgcmV0dXJuIHN1O1xuICAgIH07XG4gICAgZ2V0U2VsZWN0VXNlclZhbHVlcyA9IGZ1bmN0aW9uKHVzZXJJZHMsIHNwYWNlSWQpIHtcbiAgICAgIHZhciBzdXM7XG4gICAgICBzdXMgPSBbXTtcbiAgICAgIGlmIChfLmlzQXJyYXkodXNlcklkcykpIHtcbiAgICAgICAgXy5lYWNoKHVzZXJJZHMsIGZ1bmN0aW9uKHVzZXJJZCkge1xuICAgICAgICAgIHZhciBzdTtcbiAgICAgICAgICBzdSA9IGdldFNlbGVjdFVzZXJWYWx1ZSh1c2VySWQsIHNwYWNlSWQpO1xuICAgICAgICAgIGlmIChzdSkge1xuICAgICAgICAgICAgcmV0dXJuIHN1cy5wdXNoKHN1KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHN1cztcbiAgICB9O1xuICAgIGdldFNlbGVjdE9yZ1ZhbHVlID0gZnVuY3Rpb24ob3JnSWQsIHNwYWNlSWQpIHtcbiAgICAgIHZhciBvcmc7XG4gICAgICBvcmcgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oJ29yZ2FuaXphdGlvbnMnKS5maW5kT25lKG9yZ0lkLCB7XG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgIF9pZDogMSxcbiAgICAgICAgICBuYW1lOiAxLFxuICAgICAgICAgIGZ1bGxuYW1lOiAxXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgb3JnLmlkID0gb3JnSWQ7XG4gICAgICByZXR1cm4gb3JnO1xuICAgIH07XG4gICAgZ2V0U2VsZWN0T3JnVmFsdWVzID0gZnVuY3Rpb24ob3JnSWRzLCBzcGFjZUlkKSB7XG4gICAgICB2YXIgb3JncztcbiAgICAgIG9yZ3MgPSBbXTtcbiAgICAgIGlmIChfLmlzQXJyYXkob3JnSWRzKSkge1xuICAgICAgICBfLmVhY2gob3JnSWRzLCBmdW5jdGlvbihvcmdJZCkge1xuICAgICAgICAgIHZhciBvcmc7XG4gICAgICAgICAgb3JnID0gZ2V0U2VsZWN0T3JnVmFsdWUob3JnSWQsIHNwYWNlSWQpO1xuICAgICAgICAgIGlmIChvcmcpIHtcbiAgICAgICAgICAgIHJldHVybiBvcmdzLnB1c2gob3JnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG9yZ3M7XG4gICAgfTtcbiAgICB0YWJsZUZpZWxkQ29kZXMgPSBbXTtcbiAgICB0YWJsZUZpZWxkTWFwID0gW107XG4gICAgdGFibGVUb1JlbGF0ZWRNYXAgPSB7fTtcbiAgICBpZiAoKHJlZiA9IG93LmZpZWxkX21hcCkgIT0gbnVsbCkge1xuICAgICAgcmVmLmZvckVhY2goZnVuY3Rpb24oZm0pIHtcbiAgICAgICAgdmFyIGZpZWxkc09iaiwgZm9ybUZpZWxkLCBmb3JtVGFibGVGaWVsZENvZGUsIGxvb2t1cEZpZWxkTmFtZSwgbG9va3VwT2JqZWN0LCBvVGFibGVDb2RlLCBvVGFibGVGaWVsZENvZGUsIG9iakZpZWxkLCBvYmplY3RGaWVsZCwgb2JqZWN0RmllbGROYW1lLCBvYmplY3RfZmllbGQsIG9kYXRhRmllbGRWYWx1ZSwgcmVmZXJlbmNlVG9GaWVsZFZhbHVlLCByZWZlcmVuY2VUb09iamVjdE5hbWUsIHJlbGF0ZWRPYmplY3RGaWVsZENvZGUsIHNlbGVjdEZpZWxkVmFsdWUsIHRhYmxlVG9SZWxhdGVkTWFwS2V5LCB3VGFibGVDb2RlLCB3b3JrZmxvd19maWVsZDtcbiAgICAgICAgb2JqZWN0X2ZpZWxkID0gZm0ub2JqZWN0X2ZpZWxkO1xuICAgICAgICB3b3JrZmxvd19maWVsZCA9IGZtLndvcmtmbG93X2ZpZWxkO1xuICAgICAgICByZWxhdGVkT2JqZWN0RmllbGRDb2RlID0gZ2V0UmVsYXRlZE9iamVjdEZpZWxkQ29kZShvYmplY3RfZmllbGQpO1xuICAgICAgICBmb3JtVGFibGVGaWVsZENvZGUgPSBnZXRGb3JtVGFibGVGaWVsZENvZGUod29ya2Zsb3dfZmllbGQpO1xuICAgICAgICBvYmpGaWVsZCA9IG9iamVjdC5maWVsZHNbb2JqZWN0X2ZpZWxkXTtcbiAgICAgICAgZm9ybUZpZWxkID0gZ2V0Rm9ybUZpZWxkKHdvcmtmbG93X2ZpZWxkKTtcbiAgICAgICAgaWYgKHJlbGF0ZWRPYmplY3RGaWVsZENvZGUpIHtcbiAgICAgICAgICBvVGFibGVDb2RlID0gb2JqZWN0X2ZpZWxkLnNwbGl0KCcuJylbMF07XG4gICAgICAgICAgb1RhYmxlRmllbGRDb2RlID0gb2JqZWN0X2ZpZWxkLnNwbGl0KCcuJylbMV07XG4gICAgICAgICAgdGFibGVUb1JlbGF0ZWRNYXBLZXkgPSBvVGFibGVDb2RlO1xuICAgICAgICAgIGlmICghdGFibGVUb1JlbGF0ZWRNYXBbdGFibGVUb1JlbGF0ZWRNYXBLZXldKSB7XG4gICAgICAgICAgICB0YWJsZVRvUmVsYXRlZE1hcFt0YWJsZVRvUmVsYXRlZE1hcEtleV0gPSB7fTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGZvcm1UYWJsZUZpZWxkQ29kZSkge1xuICAgICAgICAgICAgd1RhYmxlQ29kZSA9IHdvcmtmbG93X2ZpZWxkLnNwbGl0KCcuJylbMF07XG4gICAgICAgICAgICB0YWJsZVRvUmVsYXRlZE1hcFt0YWJsZVRvUmVsYXRlZE1hcEtleV1bJ19GUk9NX1RBQkxFX0NPREUnXSA9IHdUYWJsZUNvZGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiB0YWJsZVRvUmVsYXRlZE1hcFt0YWJsZVRvUmVsYXRlZE1hcEtleV1bb1RhYmxlRmllbGRDb2RlXSA9IHdvcmtmbG93X2ZpZWxkO1xuICAgICAgICB9IGVsc2UgaWYgKHdvcmtmbG93X2ZpZWxkLmluZGV4T2YoJy4kLicpID4gMCAmJiBvYmplY3RfZmllbGQuaW5kZXhPZignLiQuJykgPiAwKSB7XG4gICAgICAgICAgd1RhYmxlQ29kZSA9IHdvcmtmbG93X2ZpZWxkLnNwbGl0KCcuJC4nKVswXTtcbiAgICAgICAgICBvVGFibGVDb2RlID0gb2JqZWN0X2ZpZWxkLnNwbGl0KCcuJC4nKVswXTtcbiAgICAgICAgICBpZiAocmVjb3JkLmhhc093blByb3BlcnR5KG9UYWJsZUNvZGUpICYmIF8uaXNBcnJheShyZWNvcmRbb1RhYmxlQ29kZV0pKSB7XG4gICAgICAgICAgICB0YWJsZUZpZWxkQ29kZXMucHVzaChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIHdvcmtmbG93X3RhYmxlX2ZpZWxkX2NvZGU6IHdUYWJsZUNvZGUsXG4gICAgICAgICAgICAgIG9iamVjdF90YWJsZV9maWVsZF9jb2RlOiBvVGFibGVDb2RlXG4gICAgICAgICAgICB9KSk7XG4gICAgICAgICAgICByZXR1cm4gdGFibGVGaWVsZE1hcC5wdXNoKGZtKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAob2JqZWN0X2ZpZWxkLmluZGV4T2YoJy4nKSA+IDAgJiYgb2JqZWN0X2ZpZWxkLmluZGV4T2YoJy4kLicpID09PSAtMSkge1xuICAgICAgICAgIG9iamVjdEZpZWxkTmFtZSA9IG9iamVjdF9maWVsZC5zcGxpdCgnLicpWzBdO1xuICAgICAgICAgIGxvb2t1cEZpZWxkTmFtZSA9IG9iamVjdF9maWVsZC5zcGxpdCgnLicpWzFdO1xuICAgICAgICAgIGlmIChvYmplY3QpIHtcbiAgICAgICAgICAgIG9iamVjdEZpZWxkID0gb2JqZWN0LmZpZWxkc1tvYmplY3RGaWVsZE5hbWVdO1xuICAgICAgICAgICAgaWYgKG9iamVjdEZpZWxkICYmIChvYmplY3RGaWVsZC50eXBlID09PSBcImxvb2t1cFwiIHx8IG9iamVjdEZpZWxkLnR5cGUgPT09IFwibWFzdGVyX2RldGFpbFwiKSAmJiAhb2JqZWN0RmllbGQubXVsdGlwbGUpIHtcbiAgICAgICAgICAgICAgZmllbGRzT2JqID0ge307XG4gICAgICAgICAgICAgIGZpZWxkc09ialtsb29rdXBGaWVsZE5hbWVdID0gMTtcbiAgICAgICAgICAgICAgbG9va3VwT2JqZWN0ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKG9iamVjdEZpZWxkLnJlZmVyZW5jZV90bywgc3BhY2VJZCkuZmluZE9uZShyZWNvcmRbb2JqZWN0RmllbGROYW1lXSwge1xuICAgICAgICAgICAgICAgIGZpZWxkczogZmllbGRzT2JqXG4gICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICBpZiAobG9va3VwT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlc1t3b3JrZmxvd19maWVsZF0gPSBsb29rdXBPYmplY3RbbG9va3VwRmllbGROYW1lXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChmb3JtRmllbGQgJiYgb2JqRmllbGQgJiYgZm9ybUZpZWxkLnR5cGUgPT09ICdvZGF0YScgJiYgWydsb29rdXAnLCAnbWFzdGVyX2RldGFpbCddLmluY2x1ZGVzKG9iakZpZWxkLnR5cGUpICYmIF8uaXNTdHJpbmcob2JqRmllbGQucmVmZXJlbmNlX3RvKSkge1xuICAgICAgICAgIHJlZmVyZW5jZVRvT2JqZWN0TmFtZSA9IG9iakZpZWxkLnJlZmVyZW5jZV90bztcbiAgICAgICAgICByZWZlcmVuY2VUb0ZpZWxkVmFsdWUgPSByZWNvcmRbb2JqRmllbGQubmFtZV07XG4gICAgICAgICAgb2RhdGFGaWVsZFZhbHVlO1xuICAgICAgICAgIGlmIChvYmpGaWVsZC5tdWx0aXBsZSAmJiBmb3JtRmllbGQuaXNfbXVsdGlzZWxlY3QpIHtcbiAgICAgICAgICAgIG9kYXRhRmllbGRWYWx1ZSA9IGdldEZpZWxkT2RhdGFWYWx1ZShyZWZlcmVuY2VUb09iamVjdE5hbWUsIHJlZmVyZW5jZVRvRmllbGRWYWx1ZSk7XG4gICAgICAgICAgfSBlbHNlIGlmICghb2JqRmllbGQubXVsdGlwbGUgJiYgIWZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdCkge1xuICAgICAgICAgICAgb2RhdGFGaWVsZFZhbHVlID0gZ2V0RmllbGRPZGF0YVZhbHVlKHJlZmVyZW5jZVRvT2JqZWN0TmFtZSwgcmVmZXJlbmNlVG9GaWVsZFZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHZhbHVlc1t3b3JrZmxvd19maWVsZF0gPSBvZGF0YUZpZWxkVmFsdWU7XG4gICAgICAgIH0gZWxzZSBpZiAoZm9ybUZpZWxkICYmIG9iakZpZWxkICYmIFsndXNlcicsICdncm91cCddLmluY2x1ZGVzKGZvcm1GaWVsZC50eXBlKSAmJiBbJ2xvb2t1cCcsICdtYXN0ZXJfZGV0YWlsJ10uaW5jbHVkZXMob2JqRmllbGQudHlwZSkgJiYgWyd1c2VycycsICdvcmdhbml6YXRpb25zJ10uaW5jbHVkZXMob2JqRmllbGQucmVmZXJlbmNlX3RvKSkge1xuICAgICAgICAgIHJlZmVyZW5jZVRvRmllbGRWYWx1ZSA9IHJlY29yZFtvYmpGaWVsZC5uYW1lXTtcbiAgICAgICAgICBpZiAoIV8uaXNFbXB0eShyZWZlcmVuY2VUb0ZpZWxkVmFsdWUpKSB7XG4gICAgICAgICAgICBzZWxlY3RGaWVsZFZhbHVlO1xuICAgICAgICAgICAgaWYgKGZvcm1GaWVsZC50eXBlID09PSAndXNlcicpIHtcbiAgICAgICAgICAgICAgaWYgKG9iakZpZWxkLm11bHRpcGxlICYmIGZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdCkge1xuICAgICAgICAgICAgICAgIHNlbGVjdEZpZWxkVmFsdWUgPSBnZXRTZWxlY3RVc2VyVmFsdWVzKHJlZmVyZW5jZVRvRmllbGRWYWx1ZSwgc3BhY2VJZCk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoIW9iakZpZWxkLm11bHRpcGxlICYmICFmb3JtRmllbGQuaXNfbXVsdGlzZWxlY3QpIHtcbiAgICAgICAgICAgICAgICBzZWxlY3RGaWVsZFZhbHVlID0gZ2V0U2VsZWN0VXNlclZhbHVlKHJlZmVyZW5jZVRvRmllbGRWYWx1ZSwgc3BhY2VJZCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZm9ybUZpZWxkLnR5cGUgPT09ICdncm91cCcpIHtcbiAgICAgICAgICAgICAgaWYgKG9iakZpZWxkLm11bHRpcGxlICYmIGZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdCkge1xuICAgICAgICAgICAgICAgIHNlbGVjdEZpZWxkVmFsdWUgPSBnZXRTZWxlY3RPcmdWYWx1ZXMocmVmZXJlbmNlVG9GaWVsZFZhbHVlLCBzcGFjZUlkKTtcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICghb2JqRmllbGQubXVsdGlwbGUgJiYgIWZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdCkge1xuICAgICAgICAgICAgICAgIHNlbGVjdEZpZWxkVmFsdWUgPSBnZXRTZWxlY3RPcmdWYWx1ZShyZWZlcmVuY2VUb0ZpZWxkVmFsdWUsIHNwYWNlSWQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc2VsZWN0RmllbGRWYWx1ZSkge1xuICAgICAgICAgICAgICByZXR1cm4gdmFsdWVzW3dvcmtmbG93X2ZpZWxkXSA9IHNlbGVjdEZpZWxkVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHJlY29yZC5oYXNPd25Qcm9wZXJ0eShvYmplY3RfZmllbGQpKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlc1t3b3JrZmxvd19maWVsZF0gPSByZWNvcmRbb2JqZWN0X2ZpZWxkXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIF8udW5pcSh0YWJsZUZpZWxkQ29kZXMpLmZvckVhY2goZnVuY3Rpb24odGZjKSB7XG4gICAgICB2YXIgYztcbiAgICAgIGMgPSBKU09OLnBhcnNlKHRmYyk7XG4gICAgICB2YWx1ZXNbYy53b3JrZmxvd190YWJsZV9maWVsZF9jb2RlXSA9IFtdO1xuICAgICAgcmV0dXJuIHJlY29yZFtjLm9iamVjdF90YWJsZV9maWVsZF9jb2RlXS5mb3JFYWNoKGZ1bmN0aW9uKHRyKSB7XG4gICAgICAgIHZhciBuZXdUcjtcbiAgICAgICAgbmV3VHIgPSB7fTtcbiAgICAgICAgXy5lYWNoKHRyLCBmdW5jdGlvbih2LCBrKSB7XG4gICAgICAgICAgcmV0dXJuIHRhYmxlRmllbGRNYXAuZm9yRWFjaChmdW5jdGlvbih0Zm0pIHtcbiAgICAgICAgICAgIHZhciB3VGRDb2RlO1xuICAgICAgICAgICAgaWYgKHRmbS5vYmplY3RfZmllbGQgPT09IChjLm9iamVjdF90YWJsZV9maWVsZF9jb2RlICsgJy4kLicgKyBrKSkge1xuICAgICAgICAgICAgICB3VGRDb2RlID0gdGZtLndvcmtmbG93X2ZpZWxkLnNwbGl0KCcuJC4nKVsxXTtcbiAgICAgICAgICAgICAgcmV0dXJuIG5ld1RyW3dUZENvZGVdID0gdjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmICghXy5pc0VtcHR5KG5ld1RyKSkge1xuICAgICAgICAgIHJldHVybiB2YWx1ZXNbYy53b3JrZmxvd190YWJsZV9maWVsZF9jb2RlXS5wdXNoKG5ld1RyKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gICAgXy5lYWNoKHRhYmxlVG9SZWxhdGVkTWFwLCBmdW5jdGlvbihtYXAsIGtleSkge1xuICAgICAgdmFyIGZvcm1UYWJsZUZpZWxkLCByZWxhdGVkQ29sbGVjdGlvbiwgcmVsYXRlZEZpZWxkLCByZWxhdGVkRmllbGROYW1lLCByZWxhdGVkT2JqZWN0LCByZWxhdGVkT2JqZWN0TmFtZSwgcmVsYXRlZFJlY29yZHMsIHJlbGF0ZWRUYWJsZUl0ZW1zLCBzZWxlY3RvciwgdGFibGVDb2RlLCB0YWJsZVZhbHVlcztcbiAgICAgIHRhYmxlQ29kZSA9IG1hcC5fRlJPTV9UQUJMRV9DT0RFO1xuICAgICAgZm9ybVRhYmxlRmllbGQgPSBnZXRGb3JtVGFibGVGaWVsZCh0YWJsZUNvZGUpO1xuICAgICAgaWYgKCF0YWJsZUNvZGUpIHtcbiAgICAgICAgcmV0dXJuIGNvbnNvbGUud2FybigndGFibGVUb1JlbGF0ZWQ6IFsnICsga2V5ICsgJ10gbWlzc2luZyBjb3JyZXNwb25kaW5nIHRhYmxlLicpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVsYXRlZE9iamVjdE5hbWUgPSBrZXk7XG4gICAgICAgIHRhYmxlVmFsdWVzID0gW107XG4gICAgICAgIHJlbGF0ZWRUYWJsZUl0ZW1zID0gW107XG4gICAgICAgIHJlbGF0ZWRPYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChyZWxhdGVkT2JqZWN0TmFtZSwgc3BhY2VJZCk7XG4gICAgICAgIHJlbGF0ZWRGaWVsZCA9IF8uZmluZChyZWxhdGVkT2JqZWN0LmZpZWxkcywgZnVuY3Rpb24oZikge1xuICAgICAgICAgIHJldHVybiBbJ2xvb2t1cCcsICdtYXN0ZXJfZGV0YWlsJ10uaW5jbHVkZXMoZi50eXBlKSAmJiBmLnJlZmVyZW5jZV90byA9PT0gb2JqZWN0TmFtZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlbGF0ZWRGaWVsZE5hbWUgPSByZWxhdGVkRmllbGQubmFtZTtcbiAgICAgICAgc2VsZWN0b3IgPSB7fTtcbiAgICAgICAgc2VsZWN0b3JbcmVsYXRlZEZpZWxkTmFtZV0gPSByZWNvcmRJZDtcbiAgICAgICAgcmVsYXRlZENvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ocmVsYXRlZE9iamVjdE5hbWUsIHNwYWNlSWQpO1xuICAgICAgICByZWxhdGVkUmVjb3JkcyA9IHJlbGF0ZWRDb2xsZWN0aW9uLmZpbmQoc2VsZWN0b3IpO1xuICAgICAgICByZWxhdGVkUmVjb3Jkcy5mb3JFYWNoKGZ1bmN0aW9uKHJyKSB7XG4gICAgICAgICAgdmFyIHRhYmxlVmFsdWVJdGVtO1xuICAgICAgICAgIHRhYmxlVmFsdWVJdGVtID0ge307XG4gICAgICAgICAgXy5lYWNoKG1hcCwgZnVuY3Rpb24odmFsdWVLZXksIGZpZWxkS2V5KSB7XG4gICAgICAgICAgICB2YXIgZm9ybUZpZWxkLCBmb3JtRmllbGRLZXksIHJlZmVyZW5jZVRvRmllbGRWYWx1ZSwgcmVmZXJlbmNlVG9PYmplY3ROYW1lLCByZWxhdGVkT2JqZWN0RmllbGQsIHRhYmxlRmllbGRWYWx1ZTtcbiAgICAgICAgICAgIGlmIChmaWVsZEtleSAhPT0gJ19GUk9NX1RBQkxFX0NPREUnKSB7XG4gICAgICAgICAgICAgIHRhYmxlRmllbGRWYWx1ZTtcbiAgICAgICAgICAgICAgZm9ybUZpZWxkS2V5O1xuICAgICAgICAgICAgICBpZiAodmFsdWVLZXkuc3RhcnRzV2l0aCh0YWJsZUNvZGUgKyAnLicpKSB7XG4gICAgICAgICAgICAgICAgZm9ybUZpZWxkS2V5ID0gKHZhbHVlS2V5LnNwbGl0KFwiLlwiKVsxXSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZm9ybUZpZWxkS2V5ID0gdmFsdWVLZXk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZm9ybUZpZWxkID0gZ2V0Rm9ybVRhYmxlU3ViRmllbGQoZm9ybVRhYmxlRmllbGQsIGZvcm1GaWVsZEtleSk7XG4gICAgICAgICAgICAgIHJlbGF0ZWRPYmplY3RGaWVsZCA9IHJlbGF0ZWRPYmplY3QuZmllbGRzW2ZpZWxkS2V5XTtcbiAgICAgICAgICAgICAgaWYgKCFmb3JtRmllbGQgfHwgIXJlbGF0ZWRPYmplY3RGaWVsZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoZm9ybUZpZWxkLnR5cGUgPT09ICdvZGF0YScgJiYgWydsb29rdXAnLCAnbWFzdGVyX2RldGFpbCddLmluY2x1ZGVzKHJlbGF0ZWRPYmplY3RGaWVsZC50eXBlKSAmJiBfLmlzU3RyaW5nKHJlbGF0ZWRPYmplY3RGaWVsZC5yZWZlcmVuY2VfdG8pKSB7XG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlVG9PYmplY3ROYW1lID0gcmVsYXRlZE9iamVjdEZpZWxkLnJlZmVyZW5jZV90bztcbiAgICAgICAgICAgICAgICByZWZlcmVuY2VUb0ZpZWxkVmFsdWUgPSBycltmaWVsZEtleV07XG4gICAgICAgICAgICAgICAgaWYgKHJlbGF0ZWRPYmplY3RGaWVsZC5tdWx0aXBsZSAmJiBmb3JtRmllbGQuaXNfbXVsdGlzZWxlY3QpIHtcbiAgICAgICAgICAgICAgICAgIHRhYmxlRmllbGRWYWx1ZSA9IGdldEZpZWxkT2RhdGFWYWx1ZShyZWZlcmVuY2VUb09iamVjdE5hbWUsIHJlZmVyZW5jZVRvRmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICghcmVsYXRlZE9iamVjdEZpZWxkLm11bHRpcGxlICYmICFmb3JtRmllbGQuaXNfbXVsdGlzZWxlY3QpIHtcbiAgICAgICAgICAgICAgICAgIHRhYmxlRmllbGRWYWx1ZSA9IGdldEZpZWxkT2RhdGFWYWx1ZShyZWZlcmVuY2VUb09iamVjdE5hbWUsIHJlZmVyZW5jZVRvRmllbGRWYWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKFsndXNlcicsICdncm91cCddLmluY2x1ZGVzKGZvcm1GaWVsZC50eXBlKSAmJiBbJ2xvb2t1cCcsICdtYXN0ZXJfZGV0YWlsJ10uaW5jbHVkZXMocmVsYXRlZE9iamVjdEZpZWxkLnR5cGUpICYmIFsndXNlcnMnLCAnb3JnYW5pemF0aW9ucyddLmluY2x1ZGVzKHJlbGF0ZWRPYmplY3RGaWVsZC5yZWZlcmVuY2VfdG8pKSB7XG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlVG9GaWVsZFZhbHVlID0gcnJbZmllbGRLZXldO1xuICAgICAgICAgICAgICAgIGlmICghXy5pc0VtcHR5KHJlZmVyZW5jZVRvRmllbGRWYWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChmb3JtRmllbGQudHlwZSA9PT0gJ3VzZXInKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGVkT2JqZWN0RmllbGQubXVsdGlwbGUgJiYgZm9ybUZpZWxkLmlzX211bHRpc2VsZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGFibGVGaWVsZFZhbHVlID0gZ2V0U2VsZWN0VXNlclZhbHVlcyhyZWZlcmVuY2VUb0ZpZWxkVmFsdWUsIHNwYWNlSWQpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCFyZWxhdGVkT2JqZWN0RmllbGQubXVsdGlwbGUgJiYgIWZvcm1GaWVsZC5pc19tdWx0aXNlbGVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgIHRhYmxlRmllbGRWYWx1ZSA9IGdldFNlbGVjdFVzZXJWYWx1ZShyZWZlcmVuY2VUb0ZpZWxkVmFsdWUsIHNwYWNlSWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGZvcm1GaWVsZC50eXBlID09PSAnZ3JvdXAnKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZWxhdGVkT2JqZWN0RmllbGQubXVsdGlwbGUgJiYgZm9ybUZpZWxkLmlzX211bHRpc2VsZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGFibGVGaWVsZFZhbHVlID0gZ2V0U2VsZWN0T3JnVmFsdWVzKHJlZmVyZW5jZVRvRmllbGRWYWx1ZSwgc3BhY2VJZCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIXJlbGF0ZWRPYmplY3RGaWVsZC5tdWx0aXBsZSAmJiAhZm9ybUZpZWxkLmlzX211bHRpc2VsZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgdGFibGVGaWVsZFZhbHVlID0gZ2V0U2VsZWN0T3JnVmFsdWUocmVmZXJlbmNlVG9GaWVsZFZhbHVlLCBzcGFjZUlkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB0YWJsZUZpZWxkVmFsdWUgPSBycltmaWVsZEtleV07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHRhYmxlVmFsdWVJdGVtW2Zvcm1GaWVsZEtleV0gPSB0YWJsZUZpZWxkVmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKCFfLmlzRW1wdHkodGFibGVWYWx1ZUl0ZW0pKSB7XG4gICAgICAgICAgICB0YWJsZVZhbHVlSXRlbS5faWQgPSByci5faWQ7XG4gICAgICAgICAgICB0YWJsZVZhbHVlcy5wdXNoKHRhYmxlVmFsdWVJdGVtKTtcbiAgICAgICAgICAgIHJldHVybiByZWxhdGVkVGFibGVJdGVtcy5wdXNoKHtcbiAgICAgICAgICAgICAgX3RhYmxlOiB7XG4gICAgICAgICAgICAgICAgX2lkOiByci5faWQsXG4gICAgICAgICAgICAgICAgX2NvZGU6IHRhYmxlQ29kZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB2YWx1ZXNbdGFibGVDb2RlXSA9IHRhYmxlVmFsdWVzO1xuICAgICAgICByZXR1cm4gcmVsYXRlZFRhYmxlc0luZm9bcmVsYXRlZE9iamVjdE5hbWVdID0gcmVsYXRlZFRhYmxlSXRlbXM7XG4gICAgICB9XG4gICAgfSk7XG4gICAgaWYgKG93LmZpZWxkX21hcF9zY3JpcHQpIHtcbiAgICAgIF8uZXh0ZW5kKHZhbHVlcywgdXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5ldmFsRmllbGRNYXBTY3JpcHQob3cuZmllbGRfbWFwX3NjcmlwdCwgb2JqZWN0TmFtZSwgc3BhY2VJZCwgcmVjb3JkSWQpKTtcbiAgICB9XG4gIH1cbiAgZmlsdGVyVmFsdWVzID0ge307XG4gIF8uZWFjaChfLmtleXModmFsdWVzKSwgZnVuY3Rpb24oaykge1xuICAgIGlmIChmaWVsZENvZGVzLmluY2x1ZGVzKGspKSB7XG4gICAgICByZXR1cm4gZmlsdGVyVmFsdWVzW2tdID0gdmFsdWVzW2tdO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBmaWx0ZXJWYWx1ZXM7XG59O1xuXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmV2YWxGaWVsZE1hcFNjcmlwdCA9IGZ1bmN0aW9uKGZpZWxkX21hcF9zY3JpcHQsIG9iamVjdE5hbWUsIHNwYWNlSWQsIG9iamVjdElkKSB7XG4gIHZhciBmdW5jLCByZWNvcmQsIHNjcmlwdCwgdmFsdWVzO1xuICByZWNvcmQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ob2JqZWN0TmFtZSwgc3BhY2VJZCkuZmluZE9uZShvYmplY3RJZCk7XG4gIHNjcmlwdCA9IFwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAocmVjb3JkKSB7IFwiICsgZmllbGRfbWFwX3NjcmlwdCArIFwiIH1cIjtcbiAgZnVuYyA9IF9ldmFsKHNjcmlwdCwgXCJmaWVsZF9tYXBfc2NyaXB0XCIpO1xuICB2YWx1ZXMgPSBmdW5jKHJlY29yZCk7XG4gIGlmIChfLmlzT2JqZWN0KHZhbHVlcykpIHtcbiAgICByZXR1cm4gdmFsdWVzO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJldmFsRmllbGRNYXBTY3JpcHQ6IOiEmuacrOi/lOWbnuWAvOexu+Wei+S4jeaYr+WvueixoVwiKTtcbiAgfVxuICByZXR1cm4ge307XG59O1xuXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmluaXRpYXRlQXR0YWNoID0gZnVuY3Rpb24ocmVjb3JkSWRzLCBzcGFjZUlkLCBpbnNJZCwgYXBwcm92ZUlkKSB7XG4gIENyZWF0b3IuQ29sbGVjdGlvbnNbJ2Ntc19maWxlcyddLmZpbmQoe1xuICAgIHNwYWNlOiBzcGFjZUlkLFxuICAgIHBhcmVudDogcmVjb3JkSWRzXG4gIH0pLmZvckVhY2goZnVuY3Rpb24oY2YpIHtcbiAgICByZXR1cm4gXy5lYWNoKGNmLnZlcnNpb25zLCBmdW5jdGlvbih2ZXJzaW9uSWQsIGlkeCkge1xuICAgICAgdmFyIGYsIG5ld0ZpbGU7XG4gICAgICBmID0gQ3JlYXRvci5Db2xsZWN0aW9uc1snY2ZzLmZpbGVzLmZpbGVyZWNvcmQnXS5maW5kT25lKHZlcnNpb25JZCk7XG4gICAgICBuZXdGaWxlID0gbmV3IEZTLkZpbGUoKTtcbiAgICAgIHJldHVybiBuZXdGaWxlLmF0dGFjaERhdGEoZi5jcmVhdGVSZWFkU3RyZWFtKCdmaWxlcycpLCB7XG4gICAgICAgIHR5cGU6IGYub3JpZ2luYWwudHlwZVxuICAgICAgfSwgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIHZhciBtZXRhZGF0YTtcbiAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoZXJyLmVycm9yLCBlcnIucmVhc29uKTtcbiAgICAgICAgfVxuICAgICAgICBuZXdGaWxlLm5hbWUoZi5uYW1lKCkpO1xuICAgICAgICBuZXdGaWxlLnNpemUoZi5zaXplKCkpO1xuICAgICAgICBtZXRhZGF0YSA9IHtcbiAgICAgICAgICBvd25lcjogZi5tZXRhZGF0YS5vd25lcixcbiAgICAgICAgICBvd25lcl9uYW1lOiBmLm1ldGFkYXRhLm93bmVyX25hbWUsXG4gICAgICAgICAgc3BhY2U6IHNwYWNlSWQsXG4gICAgICAgICAgaW5zdGFuY2U6IGluc0lkLFxuICAgICAgICAgIGFwcHJvdmU6IGFwcHJvdmVJZCxcbiAgICAgICAgICBwYXJlbnQ6IGNmLl9pZFxuICAgICAgICB9O1xuICAgICAgICBpZiAoaWR4ID09PSAwKSB7XG4gICAgICAgICAgbWV0YWRhdGEuY3VycmVudCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgbmV3RmlsZS5tZXRhZGF0YSA9IG1ldGFkYXRhO1xuICAgICAgICByZXR1cm4gY2ZzLmluc3RhbmNlcy5pbnNlcnQobmV3RmlsZSk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59O1xuXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmluaXRpYXRlUmVjb3JkSW5zdGFuY2VJbmZvID0gZnVuY3Rpb24ocmVjb3JkSWRzLCBpbnNJZCwgc3BhY2VJZCkge1xuICBDcmVhdG9yLmdldENvbGxlY3Rpb24ocmVjb3JkSWRzLm8sIHNwYWNlSWQpLnVwZGF0ZShyZWNvcmRJZHMuaWRzWzBdLCB7XG4gICAgJHB1c2g6IHtcbiAgICAgIGluc3RhbmNlczoge1xuICAgICAgICAkZWFjaDogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIF9pZDogaW5zSWQsXG4gICAgICAgICAgICBzdGF0ZTogJ2RyYWZ0J1xuICAgICAgICAgIH1cbiAgICAgICAgXSxcbiAgICAgICAgJHBvc2l0aW9uOiAwXG4gICAgICB9XG4gICAgfSxcbiAgICAkc2V0OiB7XG4gICAgICBsb2NrZWQ6IHRydWUsXG4gICAgICBpbnN0YW5jZV9zdGF0ZTogJ2RyYWZ0J1xuICAgIH1cbiAgfSk7XG59O1xuXG51dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmluaXRpYXRlUmVsYXRlZFJlY29yZEluc3RhbmNlSW5mbyA9IGZ1bmN0aW9uKHJlbGF0ZWRUYWJsZXNJbmZvLCBpbnNJZCwgc3BhY2VJZCkge1xuICBfLmVhY2gocmVsYXRlZFRhYmxlc0luZm8sIGZ1bmN0aW9uKHRhYmxlSXRlbXMsIHJlbGF0ZWRPYmplY3ROYW1lKSB7XG4gICAgdmFyIHJlbGF0ZWRDb2xsZWN0aW9uO1xuICAgIHJlbGF0ZWRDb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKHJlbGF0ZWRPYmplY3ROYW1lLCBzcGFjZUlkKTtcbiAgICByZXR1cm4gXy5lYWNoKHRhYmxlSXRlbXMsIGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgIHJldHVybiByZWxhdGVkQ29sbGVjdGlvbi51cGRhdGUoaXRlbS5fdGFibGUuX2lkLCB7XG4gICAgICAgICRzZXQ6IHtcbiAgICAgICAgICBpbnN0YW5jZXM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgX2lkOiBpbnNJZCxcbiAgICAgICAgICAgICAgc3RhdGU6ICdkcmFmdCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgICBdLFxuICAgICAgICAgIF90YWJsZTogaXRlbS5fdGFibGVcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufTtcblxudXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5jaGVja0lzSW5BcHByb3ZhbCA9IGZ1bmN0aW9uKHJlY29yZElkcywgc3BhY2VJZCkge1xuICB2YXIgcmVjb3JkO1xuICByZWNvcmQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ocmVjb3JkSWRzLm8sIHNwYWNlSWQpLmZpbmRPbmUoe1xuICAgIF9pZDogcmVjb3JkSWRzLmlkc1swXSxcbiAgICBpbnN0YW5jZXM6IHtcbiAgICAgICRleGlzdHM6IHRydWVcbiAgICB9XG4gIH0sIHtcbiAgICBmaWVsZHM6IHtcbiAgICAgIGluc3RhbmNlczogMVxuICAgIH1cbiAgfSk7XG4gIGlmIChyZWNvcmQgJiYgcmVjb3JkLmluc3RhbmNlc1swXS5zdGF0ZSAhPT0gJ2NvbXBsZXRlZCcgJiYgQ3JlYXRvci5Db2xsZWN0aW9ucy5pbnN0YW5jZXMuZmluZChyZWNvcmQuaW5zdGFuY2VzWzBdLl9pZCkuY291bnQoKSA+IDApIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKCdlcnJvciEnLCBcIuatpOiusOW9leW3suWPkei1t+a1geeoi+ato+WcqOWuoeaJueS4re+8jOW+heWuoeaJuee7k+adn+aWueWPr+WPkei1t+S4i+S4gOasoeWuoeaJue+8gVwiKTtcbiAgfVxufTtcbiIsIkpzb25Sb3V0ZXMuYWRkIFwicG9zdFwiLCBcIi9zMy9cIiwgIChyZXEsIHJlcywgbmV4dCkgLT5cclxuXHJcblx0SnNvblJvdXRlcy5wYXJzZUZpbGVzIHJlcSwgcmVzLCAoKS0+XHJcblx0XHRjb2xsZWN0aW9uID0gY2ZzLmZpbGVzXHJcblx0XHRmaWxlQ29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0T2JqZWN0KFwiY21zX2ZpbGVzXCIpLmRiXHJcblxyXG5cdFx0aWYgcmVxLmZpbGVzIGFuZCByZXEuZmlsZXNbMF1cclxuXHJcblx0XHRcdG5ld0ZpbGUgPSBuZXcgRlMuRmlsZSgpO1xyXG5cdFx0XHRuZXdGaWxlLmF0dGFjaERhdGEgcmVxLmZpbGVzWzBdLmRhdGEsIHt0eXBlOiByZXEuZmlsZXNbMF0ubWltZVR5cGV9LCAoZXJyKSAtPlxyXG5cdFx0XHRcdGZpbGVuYW1lID0gcmVxLmZpbGVzWzBdLmZpbGVuYW1lXHJcblx0XHRcdFx0ZXh0ZW50aW9uID0gZmlsZW5hbWUuc3BsaXQoJy4nKS5wb3AoKVxyXG5cdFx0XHRcdGlmIFtcImltYWdlLmpwZ1wiLCBcImltYWdlLmdpZlwiLCBcImltYWdlLmpwZWdcIiwgXCJpbWFnZS5wbmdcIl0uaW5jbHVkZXMoZmlsZW5hbWUudG9Mb3dlckNhc2UoKSlcclxuXHRcdFx0XHRcdGZpbGVuYW1lID0gXCJpbWFnZS1cIiArIG1vbWVudChuZXcgRGF0ZSgpKS5mb3JtYXQoJ1lZWVlNTURESEhtbXNzJykgKyBcIi5cIiArIGV4dGVudGlvblxyXG5cclxuXHRcdFx0XHRib2R5ID0gcmVxLmJvZHlcclxuXHRcdFx0XHR0cnlcclxuXHRcdFx0XHRcdGlmIGJvZHkgJiYgKGJvZHlbJ3VwbG9hZF9mcm9tJ10gaXMgXCJJRVwiIG9yIGJvZHlbJ3VwbG9hZF9mcm9tJ10gaXMgXCJub2RlXCIpXHJcblx0XHRcdFx0XHRcdGZpbGVuYW1lID0gZGVjb2RlVVJJQ29tcG9uZW50KGZpbGVuYW1lKVxyXG5cdFx0XHRcdGNhdGNoIGVcclxuXHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IoZmlsZW5hbWUpXHJcblx0XHRcdFx0XHRjb25zb2xlLmVycm9yIGVcclxuXHRcdFx0XHRcdGZpbGVuYW1lID0gZmlsZW5hbWUucmVwbGFjZSgvJS9nLCBcIi1cIilcclxuXHJcblx0XHRcdFx0bmV3RmlsZS5uYW1lKGZpbGVuYW1lKVxyXG5cclxuXHRcdFx0XHRpZiBib2R5ICYmIGJvZHlbJ293bmVyJ10gJiYgYm9keVsnc3BhY2UnXSAmJiBib2R5WydyZWNvcmRfaWQnXSAgJiYgYm9keVsnb2JqZWN0X25hbWUnXVxyXG5cdFx0XHRcdFx0cGFyZW50ID0gYm9keVsncGFyZW50J11cclxuXHRcdFx0XHRcdG93bmVyID0gYm9keVsnb3duZXInXVxyXG5cdFx0XHRcdFx0b3duZXJfbmFtZSA9IGJvZHlbJ293bmVyX25hbWUnXVxyXG5cdFx0XHRcdFx0c3BhY2UgPSBib2R5WydzcGFjZSddXHJcblx0XHRcdFx0XHRyZWNvcmRfaWQgPSBib2R5WydyZWNvcmRfaWQnXVxyXG5cdFx0XHRcdFx0b2JqZWN0X25hbWUgPSBib2R5WydvYmplY3RfbmFtZSddXHJcblx0XHRcdFx0XHRwYXJlbnQgPSBib2R5WydwYXJlbnQnXVxyXG5cdFx0XHRcdFx0bWV0YWRhdGEgPSB7b3duZXI6b3duZXIsIG93bmVyX25hbWU6b3duZXJfbmFtZSwgc3BhY2U6c3BhY2UsIHJlY29yZF9pZDpyZWNvcmRfaWQsIG9iamVjdF9uYW1lOiBvYmplY3RfbmFtZX1cclxuXHRcdFx0XHRcdGlmIHBhcmVudFxyXG5cdFx0XHRcdFx0XHRtZXRhZGF0YS5wYXJlbnQgPSBwYXJlbnRcclxuXHRcdFx0XHRcdG5ld0ZpbGUubWV0YWRhdGEgPSBtZXRhZGF0YVxyXG5cdFx0XHRcdFx0ZmlsZU9iaiA9IGNvbGxlY3Rpb24uaW5zZXJ0IG5ld0ZpbGVcclxuXHJcblx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0ZmlsZU9iaiA9IGNvbGxlY3Rpb24uaW5zZXJ0IG5ld0ZpbGVcclxuXHJcblxyXG5cdFx0XHRcdHNpemUgPSBmaWxlT2JqLm9yaWdpbmFsLnNpemVcclxuXHRcdFx0XHRpZiAhc2l6ZVxyXG5cdFx0XHRcdFx0c2l6ZSA9IDEwMjRcclxuXHRcdFx0XHRpZiBwYXJlbnRcclxuXHRcdFx0XHRcdGZpbGVDb2xsZWN0aW9uLnVwZGF0ZSh7X2lkOnBhcmVudH0se1xyXG5cdFx0XHRcdFx0XHQkc2V0OlxyXG5cdFx0XHRcdFx0XHRcdGV4dGVudGlvbjogZXh0ZW50aW9uXHJcblx0XHRcdFx0XHRcdFx0c2l6ZTogc2l6ZVxyXG5cdFx0XHRcdFx0XHRcdG1vZGlmaWVkOiAobmV3IERhdGUoKSlcclxuXHRcdFx0XHRcdFx0XHRtb2RpZmllZF9ieTogb3duZXJcclxuXHRcdFx0XHRcdFx0JHB1c2g6XHJcblx0XHRcdFx0XHRcdFx0dmVyc2lvbnM6XHJcblx0XHRcdFx0XHRcdFx0XHQkZWFjaDogWyBmaWxlT2JqLl9pZCBdXHJcblx0XHRcdFx0XHRcdFx0XHQkcG9zaXRpb246IDBcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0bmV3RmlsZU9iaklkID0gZmlsZUNvbGxlY3Rpb24uZGlyZWN0Lmluc2VydCB7XHJcblx0XHRcdFx0XHRcdG5hbWU6IGZpbGVuYW1lXHJcblx0XHRcdFx0XHRcdGRlc2NyaXB0aW9uOiAnJ1xyXG5cdFx0XHRcdFx0XHRleHRlbnRpb246IGV4dGVudGlvblxyXG5cdFx0XHRcdFx0XHRzaXplOiBzaXplXHJcblx0XHRcdFx0XHRcdHZlcnNpb25zOiBbZmlsZU9iai5faWRdXHJcblx0XHRcdFx0XHRcdHBhcmVudDoge286b2JqZWN0X25hbWUsaWRzOltyZWNvcmRfaWRdfVxyXG5cdFx0XHRcdFx0XHRvd25lcjogb3duZXJcclxuXHRcdFx0XHRcdFx0c3BhY2U6IHNwYWNlXHJcblx0XHRcdFx0XHRcdGNyZWF0ZWQ6IChuZXcgRGF0ZSgpKVxyXG5cdFx0XHRcdFx0XHRjcmVhdGVkX2J5OiBvd25lclxyXG5cdFx0XHRcdFx0XHRtb2RpZmllZDogKG5ldyBEYXRlKCkpXHJcblx0XHRcdFx0XHRcdG1vZGlmaWVkX2J5OiBvd25lclxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0ZmlsZU9iai51cGRhdGUoeyRzZXQ6IHsnbWV0YWRhdGEucGFyZW50JyA6IG5ld0ZpbGVPYmpJZH19KVxyXG5cclxuXHRcdFx0XHRyZXNwID1cclxuXHRcdFx0XHRcdHZlcnNpb25faWQ6IGZpbGVPYmouX2lkLFxyXG5cdFx0XHRcdFx0c2l6ZTogc2l6ZVxyXG5cclxuXHRcdFx0XHRyZXMuc2V0SGVhZGVyKFwieC1hbXotdmVyc2lvbi1pZFwiLGZpbGVPYmouX2lkKTtcclxuXHRcdFx0XHRyZXMuZW5kKEpTT04uc3RyaW5naWZ5KHJlc3ApKTtcclxuXHRcdFx0XHRyZXR1cm5cclxuXHRcdGVsc2VcclxuXHRcdFx0cmVzLnN0YXR1c0NvZGUgPSA1MDA7XHJcblx0XHRcdHJlcy5lbmQoKTtcclxuXHJcbkpzb25Sb3V0ZXMuYWRkIFwicG9zdFwiLCBcIi9zMy86Y29sbGVjdGlvblwiLCAgKHJlcSwgcmVzLCBuZXh0KSAtPlxyXG5cdHRyeVxyXG5cdFx0dXNlcklkID0gU3RlZWRvcy5nZXRVc2VySWRGcm9tQXV0aFRva2VuKHJlcSwgcmVzKVxyXG5cdFx0aWYgIXVzZXJJZFxyXG5cdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCJObyBwZXJtaXNzaW9uXCIpXHJcblxyXG5cdFx0Y29sbGVjdGlvbk5hbWUgPSByZXEucGFyYW1zLmNvbGxlY3Rpb25cclxuXHJcblx0XHRKc29uUm91dGVzLnBhcnNlRmlsZXMgcmVxLCByZXMsICgpLT5cclxuXHRcdFx0Y29sbGVjdGlvbiA9IGNmc1tjb2xsZWN0aW9uTmFtZV1cclxuXHJcblx0XHRcdGlmIG5vdCBjb2xsZWN0aW9uXHJcblx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwiTm8gQ29sbGVjdGlvblwiKVxyXG5cclxuXHRcdFx0aWYgcmVxLmZpbGVzIGFuZCByZXEuZmlsZXNbMF1cclxuXHJcblx0XHRcdFx0bmV3RmlsZSA9IG5ldyBGUy5GaWxlKClcclxuXHRcdFx0XHRuZXdGaWxlLm5hbWUocmVxLmZpbGVzWzBdLmZpbGVuYW1lKVxyXG5cclxuXHRcdFx0XHRpZiByZXEuYm9keVxyXG5cdFx0XHRcdFx0bmV3RmlsZS5tZXRhZGF0YSA9IHJlcS5ib2R5XHJcblxyXG5cdFx0XHRcdG5ld0ZpbGUub3duZXIgPSB1c2VySWRcclxuXHRcdFx0XHRuZXdGaWxlLm1ldGFkYXRhLm93bmVyID0gdXNlcklkXHJcblxyXG5cdFx0XHRcdG5ld0ZpbGUuYXR0YWNoRGF0YSByZXEuZmlsZXNbMF0uZGF0YSwge3R5cGU6IHJlcS5maWxlc1swXS5taW1lVHlwZX1cclxuXHJcblx0XHRcdFx0Y29sbGVjdGlvbi5pbnNlcnQgbmV3RmlsZVxyXG5cclxuXHRcdFx0XHRyZXN1bHREYXRhID0gY29sbGVjdGlvbi5maWxlcy5maW5kT25lKG5ld0ZpbGUuX2lkKVxyXG5cdFx0XHRcdEpzb25Sb3V0ZXMuc2VuZFJlc3VsdCByZXMsXHJcblx0XHRcdFx0XHRjb2RlOiAyMDBcclxuXHRcdFx0XHRcdGRhdGE6IHJlc3VsdERhdGFcclxuXHRcdFx0XHRyZXR1cm5cclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIk5vIEZpbGVcIilcclxuXHJcblx0XHRyZXR1cm5cclxuXHRjYXRjaCBlXHJcblx0XHRjb25zb2xlLmVycm9yIGUuc3RhY2tcclxuXHRcdEpzb25Sb3V0ZXMuc2VuZFJlc3VsdCByZXMsIHtcclxuXHRcdFx0Y29kZTogZS5lcnJvciB8fCA1MDBcclxuXHRcdFx0ZGF0YToge2Vycm9yczogZS5yZWFzb24gfHwgZS5tZXNzYWdlfVxyXG5cdFx0fVxyXG5cclxuXHJcblxyXG5nZXRRdWVyeVN0cmluZyA9IChhY2Nlc3NLZXlJZCwgc2VjcmV0QWNjZXNzS2V5LCBxdWVyeSwgbWV0aG9kKSAtPlxyXG5cdGNvbnNvbGUubG9nIFwiLS0tLXV1Zmxvd01hbmFnZXIuZ2V0UXVlcnlTdHJpbmctLS0tXCJcclxuXHRBTFkgPSByZXF1aXJlKCdhbGl5dW4tc2RrJylcclxuXHRkYXRlID0gQUxZLnV0aWwuZGF0ZS5nZXREYXRlKClcclxuXHJcblx0cXVlcnkuRm9ybWF0ID0gXCJqc29uXCJcclxuXHRxdWVyeS5WZXJzaW9uID0gXCIyMDE3LTAzLTIxXCJcclxuXHRxdWVyeS5BY2Nlc3NLZXlJZCA9IGFjY2Vzc0tleUlkXHJcblx0cXVlcnkuU2lnbmF0dXJlTWV0aG9kID0gXCJITUFDLVNIQTFcIlxyXG5cdHF1ZXJ5LlRpbWVzdGFtcCA9IEFMWS51dGlsLmRhdGUuaXNvODYwMShkYXRlKVxyXG5cdHF1ZXJ5LlNpZ25hdHVyZVZlcnNpb24gPSBcIjEuMFwiXHJcblx0cXVlcnkuU2lnbmF0dXJlTm9uY2UgPSBTdHJpbmcoZGF0ZS5nZXRUaW1lKCkpXHJcblxyXG5cdHF1ZXJ5S2V5cyA9IE9iamVjdC5rZXlzKHF1ZXJ5KVxyXG5cdHF1ZXJ5S2V5cy5zb3J0KClcclxuXHJcblx0Y2Fub25pY2FsaXplZFF1ZXJ5U3RyaW5nID0gXCJcIlxyXG5cdHF1ZXJ5S2V5cy5mb3JFYWNoIChuYW1lKSAtPlxyXG5cdFx0Y2Fub25pY2FsaXplZFF1ZXJ5U3RyaW5nICs9IFwiJlwiICsgbmFtZSArIFwiPVwiICsgQUxZLnV0aWwucG9wRXNjYXBlKHF1ZXJ5W25hbWVdKVxyXG5cclxuXHRzdHJpbmdUb1NpZ24gPSBtZXRob2QudG9VcHBlckNhc2UoKSArICcmJTJGJicgKyBBTFkudXRpbC5wb3BFc2NhcGUoY2Fub25pY2FsaXplZFF1ZXJ5U3RyaW5nLnN1YnN0cigxKSlcclxuXHJcblx0cXVlcnkuU2lnbmF0dXJlID0gQUxZLnV0aWwuY3J5cHRvLmhtYWMoc2VjcmV0QWNjZXNzS2V5ICsgJyYnLCBzdHJpbmdUb1NpZ24sICdiYXNlNjQnLCAnc2hhMScpXHJcblxyXG5cdHF1ZXJ5U3RyID0gQUxZLnV0aWwucXVlcnlQYXJhbXNUb1N0cmluZyhxdWVyeSlcclxuXHRjb25zb2xlLmxvZyBxdWVyeVN0clxyXG5cdHJldHVybiBxdWVyeVN0clxyXG5cclxuSnNvblJvdXRlcy5hZGQgXCJwb3N0XCIsIFwiL3MzL3ZvZC91cGxvYWRcIiwgIChyZXEsIHJlcywgbmV4dCkgLT5cclxuXHR0cnlcclxuXHRcdHVzZXJJZCA9IFN0ZWVkb3MuZ2V0VXNlcklkRnJvbUF1dGhUb2tlbihyZXEsIHJlcylcclxuXHRcdGlmICF1c2VySWRcclxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwiTm8gcGVybWlzc2lvblwiKVxyXG5cclxuXHRcdGNvbGxlY3Rpb25OYW1lID0gXCJ2aWRlb3NcIlxyXG5cclxuXHRcdEFMWSA9IHJlcXVpcmUoJ2FsaXl1bi1zZGsnKVxyXG5cclxuXHRcdEpzb25Sb3V0ZXMucGFyc2VGaWxlcyByZXEsIHJlcywgKCktPlxyXG5cdFx0XHRjb2xsZWN0aW9uID0gY2ZzW2NvbGxlY3Rpb25OYW1lXVxyXG5cclxuXHRcdFx0aWYgbm90IGNvbGxlY3Rpb25cclxuXHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCJObyBDb2xsZWN0aW9uXCIpXHJcblxyXG5cdFx0XHRpZiByZXEuZmlsZXMgYW5kIHJlcS5maWxlc1swXVxyXG5cclxuXHRcdFx0XHRpZiBjb2xsZWN0aW9uTmFtZSBpcyAndmlkZW9zJyBhbmQgTWV0ZW9yLnNldHRpbmdzLnB1YmxpYy5jZnM/LnN0b3JlIGlzIFwiT1NTXCJcclxuXHRcdFx0XHRcdGFjY2Vzc0tleUlkID0gTWV0ZW9yLnNldHRpbmdzLmNmcy5hbGl5dW4/LmFjY2Vzc0tleUlkXHJcblx0XHRcdFx0XHRzZWNyZXRBY2Nlc3NLZXkgPSBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmFsaXl1bj8uc2VjcmV0QWNjZXNzS2V5XHJcblxyXG5cdFx0XHRcdFx0ZGF0ZSA9IEFMWS51dGlsLmRhdGUuZ2V0RGF0ZSgpXHJcblxyXG5cdFx0XHRcdFx0cXVlcnkgPSB7XHJcblx0XHRcdFx0XHRcdEFjdGlvbjogXCJDcmVhdGVVcGxvYWRWaWRlb1wiXHJcblx0XHRcdFx0XHRcdFRpdGxlOiByZXEuZmlsZXNbMF0uZmlsZW5hbWVcclxuXHRcdFx0XHRcdFx0RmlsZU5hbWU6IHJlcS5maWxlc1swXS5maWxlbmFtZVxyXG5cdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdHVybCA9IFwiaHR0cDovL3ZvZC5jbi1zaGFuZ2hhaS5hbGl5dW5jcy5jb20vP1wiICsgZ2V0UXVlcnlTdHJpbmcoYWNjZXNzS2V5SWQsIHNlY3JldEFjY2Vzc0tleSwgcXVlcnksICdHRVQnKVxyXG5cclxuXHRcdFx0XHRcdHIgPSBIVFRQLmNhbGwgJ0dFVCcsIHVybFxyXG5cclxuXHRcdFx0XHRcdGNvbnNvbGUubG9nIHJcclxuXHJcblx0XHRcdFx0XHRpZiByLmRhdGE/LlZpZGVvSWRcclxuXHRcdFx0XHRcdFx0dmlkZW9JZCA9IHIuZGF0YS5WaWRlb0lkXHJcblx0XHRcdFx0XHRcdHVwbG9hZEFkZHJlc3MgPSBKU09OLnBhcnNlKG5ldyBCdWZmZXIoci5kYXRhLlVwbG9hZEFkZHJlc3MsICdiYXNlNjQnKS50b1N0cmluZygpKVxyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyB1cGxvYWRBZGRyZXNzXHJcblx0XHRcdFx0XHRcdHVwbG9hZEF1dGggPSBKU09OLnBhcnNlKG5ldyBCdWZmZXIoci5kYXRhLlVwbG9hZEF1dGgsICdiYXNlNjQnKS50b1N0cmluZygpKVxyXG5cdFx0XHRcdFx0XHRjb25zb2xlLmxvZyB1cGxvYWRBdXRoXHJcblxyXG5cdFx0XHRcdFx0XHRvc3MgPSBuZXcgQUxZLk9TUyh7XHJcblx0XHRcdFx0XHRcdFx0XCJhY2Nlc3NLZXlJZFwiOiB1cGxvYWRBdXRoLkFjY2Vzc0tleUlkLFxyXG5cdFx0XHRcdFx0XHRcdFwic2VjcmV0QWNjZXNzS2V5XCI6IHVwbG9hZEF1dGguQWNjZXNzS2V5U2VjcmV0LFxyXG5cdFx0XHRcdFx0XHRcdFwiZW5kcG9pbnRcIjogdXBsb2FkQWRkcmVzcy5FbmRwb2ludCxcclxuXHRcdFx0XHRcdFx0XHRcImFwaVZlcnNpb25cIjogJzIwMTMtMTAtMTUnLFxyXG5cdFx0XHRcdFx0XHRcdFwic2VjdXJpdHlUb2tlblwiOiB1cGxvYWRBdXRoLlNlY3VyaXR5VG9rZW5cclxuXHRcdFx0XHRcdFx0fSlcclxuXHJcblx0XHRcdFx0XHRcdG9zcy5wdXRPYmplY3Qge1xyXG5cdFx0XHRcdFx0XHRcdEJ1Y2tldDogdXBsb2FkQWRkcmVzcy5CdWNrZXQsXHJcblx0XHRcdFx0XHRcdFx0S2V5OiB1cGxvYWRBZGRyZXNzLkZpbGVOYW1lLFxyXG5cdFx0XHRcdFx0XHRcdEJvZHk6IHJlcS5maWxlc1swXS5kYXRhLFxyXG5cdFx0XHRcdFx0XHRcdEFjY2Vzc0NvbnRyb2xBbGxvd09yaWdpbjogJycsXHJcblx0XHRcdFx0XHRcdFx0Q29udGVudFR5cGU6IHJlcS5maWxlc1swXS5taW1lVHlwZSxcclxuXHRcdFx0XHRcdFx0XHRDYWNoZUNvbnRyb2w6ICduby1jYWNoZScsXHJcblx0XHRcdFx0XHRcdFx0Q29udGVudERpc3Bvc2l0aW9uOiAnJyxcclxuXHRcdFx0XHRcdFx0XHRDb250ZW50RW5jb2Rpbmc6ICd1dGYtOCcsXHJcblx0XHRcdFx0XHRcdFx0U2VydmVyU2lkZUVuY3J5cHRpb246ICdBRVMyNTYnLFxyXG5cdFx0XHRcdFx0XHRcdEV4cGlyZXM6IG51bGxcclxuXHRcdFx0XHRcdFx0fSwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudCAoZXJyLCBkYXRhKSAtPlxyXG5cclxuXHRcdFx0XHRcdFx0XHRpZiBlcnJcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdlcnJvcjonLCBlcnIpXHJcblx0XHRcdFx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgZXJyLm1lc3NhZ2UpXHJcblxyXG5cdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdzdWNjZXNzOicsIGRhdGEpXHJcblxyXG5cdFx0XHRcdFx0XHRcdG5ld0RhdGUgPSBBTFkudXRpbC5kYXRlLmdldERhdGUoKVxyXG5cclxuXHRcdFx0XHRcdFx0XHRnZXRQbGF5SW5mb1F1ZXJ5ID0ge1xyXG5cdFx0XHRcdFx0XHRcdFx0QWN0aW9uOiAnR2V0UGxheUluZm8nXHJcblx0XHRcdFx0XHRcdFx0XHRWaWRlb0lkOiB2aWRlb0lkXHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XHRnZXRQbGF5SW5mb1VybCA9IFwiaHR0cDovL3ZvZC5jbi1zaGFuZ2hhaS5hbGl5dW5jcy5jb20vP1wiICsgZ2V0UXVlcnlTdHJpbmcoYWNjZXNzS2V5SWQsIHNlY3JldEFjY2Vzc0tleSwgZ2V0UGxheUluZm9RdWVyeSwgJ0dFVCcpXHJcblxyXG5cdFx0XHRcdFx0XHRcdGdldFBsYXlJbmZvUmVzdWx0ID0gSFRUUC5jYWxsICdHRVQnLCBnZXRQbGF5SW5mb1VybFxyXG5cclxuXHRcdFx0XHRcdFx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLFxyXG5cdFx0XHRcdFx0XHRcdFx0Y29kZTogMjAwXHJcblx0XHRcdFx0XHRcdFx0XHRkYXRhOiBnZXRQbGF5SW5mb1Jlc3VsdFxyXG5cclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIk5vIEZpbGVcIilcclxuXHJcblx0XHRyZXR1cm5cclxuXHRjYXRjaCBlXHJcblx0XHRjb25zb2xlLmVycm9yIGUuc3RhY2tcclxuXHRcdEpzb25Sb3V0ZXMuc2VuZFJlc3VsdCByZXMsIHtcclxuXHRcdFx0Y29kZTogZS5lcnJvciB8fCA1MDBcclxuXHRcdFx0ZGF0YToge2Vycm9yczogZS5yZWFzb24gfHwgZS5tZXNzYWdlfVxyXG5cdFx0fSIsInZhciBnZXRRdWVyeVN0cmluZztcblxuSnNvblJvdXRlcy5hZGQoXCJwb3N0XCIsIFwiL3MzL1wiLCBmdW5jdGlvbihyZXEsIHJlcywgbmV4dCkge1xuICByZXR1cm4gSnNvblJvdXRlcy5wYXJzZUZpbGVzKHJlcSwgcmVzLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgY29sbGVjdGlvbiwgZmlsZUNvbGxlY3Rpb24sIG5ld0ZpbGU7XG4gICAgY29sbGVjdGlvbiA9IGNmcy5maWxlcztcbiAgICBmaWxlQ29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0T2JqZWN0KFwiY21zX2ZpbGVzXCIpLmRiO1xuICAgIGlmIChyZXEuZmlsZXMgJiYgcmVxLmZpbGVzWzBdKSB7XG4gICAgICBuZXdGaWxlID0gbmV3IEZTLkZpbGUoKTtcbiAgICAgIHJldHVybiBuZXdGaWxlLmF0dGFjaERhdGEocmVxLmZpbGVzWzBdLmRhdGEsIHtcbiAgICAgICAgdHlwZTogcmVxLmZpbGVzWzBdLm1pbWVUeXBlXG4gICAgICB9LCBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgdmFyIGJvZHksIGUsIGV4dGVudGlvbiwgZmlsZU9iaiwgZmlsZW5hbWUsIG1ldGFkYXRhLCBuZXdGaWxlT2JqSWQsIG9iamVjdF9uYW1lLCBvd25lciwgb3duZXJfbmFtZSwgcGFyZW50LCByZWNvcmRfaWQsIHJlc3AsIHNpemUsIHNwYWNlO1xuICAgICAgICBmaWxlbmFtZSA9IHJlcS5maWxlc1swXS5maWxlbmFtZTtcbiAgICAgICAgZXh0ZW50aW9uID0gZmlsZW5hbWUuc3BsaXQoJy4nKS5wb3AoKTtcbiAgICAgICAgaWYgKFtcImltYWdlLmpwZ1wiLCBcImltYWdlLmdpZlwiLCBcImltYWdlLmpwZWdcIiwgXCJpbWFnZS5wbmdcIl0uaW5jbHVkZXMoZmlsZW5hbWUudG9Mb3dlckNhc2UoKSkpIHtcbiAgICAgICAgICBmaWxlbmFtZSA9IFwiaW1hZ2UtXCIgKyBtb21lbnQobmV3IERhdGUoKSkuZm9ybWF0KCdZWVlZTU1EREhIbW1zcycpICsgXCIuXCIgKyBleHRlbnRpb247XG4gICAgICAgIH1cbiAgICAgICAgYm9keSA9IHJlcS5ib2R5O1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGlmIChib2R5ICYmIChib2R5Wyd1cGxvYWRfZnJvbSddID09PSBcIklFXCIgfHwgYm9keVsndXBsb2FkX2Zyb20nXSA9PT0gXCJub2RlXCIpKSB7XG4gICAgICAgICAgICBmaWxlbmFtZSA9IGRlY29kZVVSSUNvbXBvbmVudChmaWxlbmFtZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICAgIGUgPSBlcnJvcjtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGZpbGVuYW1lKTtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUpO1xuICAgICAgICAgIGZpbGVuYW1lID0gZmlsZW5hbWUucmVwbGFjZSgvJS9nLCBcIi1cIik7XG4gICAgICAgIH1cbiAgICAgICAgbmV3RmlsZS5uYW1lKGZpbGVuYW1lKTtcbiAgICAgICAgaWYgKGJvZHkgJiYgYm9keVsnb3duZXInXSAmJiBib2R5WydzcGFjZSddICYmIGJvZHlbJ3JlY29yZF9pZCddICYmIGJvZHlbJ29iamVjdF9uYW1lJ10pIHtcbiAgICAgICAgICBwYXJlbnQgPSBib2R5WydwYXJlbnQnXTtcbiAgICAgICAgICBvd25lciA9IGJvZHlbJ293bmVyJ107XG4gICAgICAgICAgb3duZXJfbmFtZSA9IGJvZHlbJ293bmVyX25hbWUnXTtcbiAgICAgICAgICBzcGFjZSA9IGJvZHlbJ3NwYWNlJ107XG4gICAgICAgICAgcmVjb3JkX2lkID0gYm9keVsncmVjb3JkX2lkJ107XG4gICAgICAgICAgb2JqZWN0X25hbWUgPSBib2R5WydvYmplY3RfbmFtZSddO1xuICAgICAgICAgIHBhcmVudCA9IGJvZHlbJ3BhcmVudCddO1xuICAgICAgICAgIG1ldGFkYXRhID0ge1xuICAgICAgICAgICAgb3duZXI6IG93bmVyLFxuICAgICAgICAgICAgb3duZXJfbmFtZTogb3duZXJfbmFtZSxcbiAgICAgICAgICAgIHNwYWNlOiBzcGFjZSxcbiAgICAgICAgICAgIHJlY29yZF9pZDogcmVjb3JkX2lkLFxuICAgICAgICAgICAgb2JqZWN0X25hbWU6IG9iamVjdF9uYW1lXG4gICAgICAgICAgfTtcbiAgICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICBtZXRhZGF0YS5wYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5ld0ZpbGUubWV0YWRhdGEgPSBtZXRhZGF0YTtcbiAgICAgICAgICBmaWxlT2JqID0gY29sbGVjdGlvbi5pbnNlcnQobmV3RmlsZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZmlsZU9iaiA9IGNvbGxlY3Rpb24uaW5zZXJ0KG5ld0ZpbGUpO1xuICAgICAgICB9XG4gICAgICAgIHNpemUgPSBmaWxlT2JqLm9yaWdpbmFsLnNpemU7XG4gICAgICAgIGlmICghc2l6ZSkge1xuICAgICAgICAgIHNpemUgPSAxMDI0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICBmaWxlQ29sbGVjdGlvbi51cGRhdGUoe1xuICAgICAgICAgICAgX2lkOiBwYXJlbnRcbiAgICAgICAgICB9LCB7XG4gICAgICAgICAgICAkc2V0OiB7XG4gICAgICAgICAgICAgIGV4dGVudGlvbjogZXh0ZW50aW9uLFxuICAgICAgICAgICAgICBzaXplOiBzaXplLFxuICAgICAgICAgICAgICBtb2RpZmllZDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgICAgbW9kaWZpZWRfYnk6IG93bmVyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgJHB1c2g6IHtcbiAgICAgICAgICAgICAgdmVyc2lvbnM6IHtcbiAgICAgICAgICAgICAgICAkZWFjaDogW2ZpbGVPYmouX2lkXSxcbiAgICAgICAgICAgICAgICAkcG9zaXRpb246IDBcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld0ZpbGVPYmpJZCA9IGZpbGVDb2xsZWN0aW9uLmRpcmVjdC5pbnNlcnQoe1xuICAgICAgICAgICAgbmFtZTogZmlsZW5hbWUsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJycsXG4gICAgICAgICAgICBleHRlbnRpb246IGV4dGVudGlvbixcbiAgICAgICAgICAgIHNpemU6IHNpemUsXG4gICAgICAgICAgICB2ZXJzaW9uczogW2ZpbGVPYmouX2lkXSxcbiAgICAgICAgICAgIHBhcmVudDoge1xuICAgICAgICAgICAgICBvOiBvYmplY3RfbmFtZSxcbiAgICAgICAgICAgICAgaWRzOiBbcmVjb3JkX2lkXVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG93bmVyOiBvd25lcixcbiAgICAgICAgICAgIHNwYWNlOiBzcGFjZSxcbiAgICAgICAgICAgIGNyZWF0ZWQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICBjcmVhdGVkX2J5OiBvd25lcixcbiAgICAgICAgICAgIG1vZGlmaWVkOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgbW9kaWZpZWRfYnk6IG93bmVyXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgZmlsZU9iai51cGRhdGUoe1xuICAgICAgICAgICAgJHNldDoge1xuICAgICAgICAgICAgICAnbWV0YWRhdGEucGFyZW50JzogbmV3RmlsZU9iaklkXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmVzcCA9IHtcbiAgICAgICAgICB2ZXJzaW9uX2lkOiBmaWxlT2JqLl9pZCxcbiAgICAgICAgICBzaXplOiBzaXplXG4gICAgICAgIH07XG4gICAgICAgIHJlcy5zZXRIZWFkZXIoXCJ4LWFtei12ZXJzaW9uLWlkXCIsIGZpbGVPYmouX2lkKTtcbiAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShyZXNwKSk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICByZXR1cm4gcmVzLmVuZCgpO1xuICAgIH1cbiAgfSk7XG59KTtcblxuSnNvblJvdXRlcy5hZGQoXCJwb3N0XCIsIFwiL3MzLzpjb2xsZWN0aW9uXCIsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIHZhciBjb2xsZWN0aW9uTmFtZSwgZSwgdXNlcklkO1xuICB0cnkge1xuICAgIHVzZXJJZCA9IFN0ZWVkb3MuZ2V0VXNlcklkRnJvbUF1dGhUb2tlbihyZXEsIHJlcyk7XG4gICAgaWYgKCF1c2VySWQpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIk5vIHBlcm1pc3Npb25cIik7XG4gICAgfVxuICAgIGNvbGxlY3Rpb25OYW1lID0gcmVxLnBhcmFtcy5jb2xsZWN0aW9uO1xuICAgIEpzb25Sb3V0ZXMucGFyc2VGaWxlcyhyZXEsIHJlcywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgY29sbGVjdGlvbiwgbmV3RmlsZSwgcmVzdWx0RGF0YTtcbiAgICAgIGNvbGxlY3Rpb24gPSBjZnNbY29sbGVjdGlvbk5hbWVdO1xuICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIk5vIENvbGxlY3Rpb25cIik7XG4gICAgICB9XG4gICAgICBpZiAocmVxLmZpbGVzICYmIHJlcS5maWxlc1swXSkge1xuICAgICAgICBuZXdGaWxlID0gbmV3IEZTLkZpbGUoKTtcbiAgICAgICAgbmV3RmlsZS5uYW1lKHJlcS5maWxlc1swXS5maWxlbmFtZSk7XG4gICAgICAgIGlmIChyZXEuYm9keSkge1xuICAgICAgICAgIG5ld0ZpbGUubWV0YWRhdGEgPSByZXEuYm9keTtcbiAgICAgICAgfVxuICAgICAgICBuZXdGaWxlLm93bmVyID0gdXNlcklkO1xuICAgICAgICBuZXdGaWxlLm1ldGFkYXRhLm93bmVyID0gdXNlcklkO1xuICAgICAgICBuZXdGaWxlLmF0dGFjaERhdGEocmVxLmZpbGVzWzBdLmRhdGEsIHtcbiAgICAgICAgICB0eXBlOiByZXEuZmlsZXNbMF0ubWltZVR5cGVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbGxlY3Rpb24uaW5zZXJ0KG5ld0ZpbGUpO1xuICAgICAgICByZXN1bHREYXRhID0gY29sbGVjdGlvbi5maWxlcy5maW5kT25lKG5ld0ZpbGUuX2lkKTtcbiAgICAgICAgSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgICAgIGNvZGU6IDIwMCxcbiAgICAgICAgICBkYXRhOiByZXN1bHREYXRhXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwiTm8gRmlsZVwiKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBlID0gZXJyb3I7XG4gICAgY29uc29sZS5lcnJvcihlLnN0YWNrKTtcbiAgICByZXR1cm4gSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgY29kZTogZS5lcnJvciB8fCA1MDAsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIGVycm9yczogZS5yZWFzb24gfHwgZS5tZXNzYWdlXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn0pO1xuXG5nZXRRdWVyeVN0cmluZyA9IGZ1bmN0aW9uKGFjY2Vzc0tleUlkLCBzZWNyZXRBY2Nlc3NLZXksIHF1ZXJ5LCBtZXRob2QpIHtcbiAgdmFyIEFMWSwgY2Fub25pY2FsaXplZFF1ZXJ5U3RyaW5nLCBkYXRlLCBxdWVyeUtleXMsIHF1ZXJ5U3RyLCBzdHJpbmdUb1NpZ247XG4gIGNvbnNvbGUubG9nKFwiLS0tLXV1Zmxvd01hbmFnZXIuZ2V0UXVlcnlTdHJpbmctLS0tXCIpO1xuICBBTFkgPSByZXF1aXJlKCdhbGl5dW4tc2RrJyk7XG4gIGRhdGUgPSBBTFkudXRpbC5kYXRlLmdldERhdGUoKTtcbiAgcXVlcnkuRm9ybWF0ID0gXCJqc29uXCI7XG4gIHF1ZXJ5LlZlcnNpb24gPSBcIjIwMTctMDMtMjFcIjtcbiAgcXVlcnkuQWNjZXNzS2V5SWQgPSBhY2Nlc3NLZXlJZDtcbiAgcXVlcnkuU2lnbmF0dXJlTWV0aG9kID0gXCJITUFDLVNIQTFcIjtcbiAgcXVlcnkuVGltZXN0YW1wID0gQUxZLnV0aWwuZGF0ZS5pc284NjAxKGRhdGUpO1xuICBxdWVyeS5TaWduYXR1cmVWZXJzaW9uID0gXCIxLjBcIjtcbiAgcXVlcnkuU2lnbmF0dXJlTm9uY2UgPSBTdHJpbmcoZGF0ZS5nZXRUaW1lKCkpO1xuICBxdWVyeUtleXMgPSBPYmplY3Qua2V5cyhxdWVyeSk7XG4gIHF1ZXJ5S2V5cy5zb3J0KCk7XG4gIGNhbm9uaWNhbGl6ZWRRdWVyeVN0cmluZyA9IFwiXCI7XG4gIHF1ZXJ5S2V5cy5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICByZXR1cm4gY2Fub25pY2FsaXplZFF1ZXJ5U3RyaW5nICs9IFwiJlwiICsgbmFtZSArIFwiPVwiICsgQUxZLnV0aWwucG9wRXNjYXBlKHF1ZXJ5W25hbWVdKTtcbiAgfSk7XG4gIHN0cmluZ1RvU2lnbiA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpICsgJyYlMkYmJyArIEFMWS51dGlsLnBvcEVzY2FwZShjYW5vbmljYWxpemVkUXVlcnlTdHJpbmcuc3Vic3RyKDEpKTtcbiAgcXVlcnkuU2lnbmF0dXJlID0gQUxZLnV0aWwuY3J5cHRvLmhtYWMoc2VjcmV0QWNjZXNzS2V5ICsgJyYnLCBzdHJpbmdUb1NpZ24sICdiYXNlNjQnLCAnc2hhMScpO1xuICBxdWVyeVN0ciA9IEFMWS51dGlsLnF1ZXJ5UGFyYW1zVG9TdHJpbmcocXVlcnkpO1xuICBjb25zb2xlLmxvZyhxdWVyeVN0cik7XG4gIHJldHVybiBxdWVyeVN0cjtcbn07XG5cbkpzb25Sb3V0ZXMuYWRkKFwicG9zdFwiLCBcIi9zMy92b2QvdXBsb2FkXCIsIGZ1bmN0aW9uKHJlcSwgcmVzLCBuZXh0KSB7XG4gIHZhciBBTFksIGNvbGxlY3Rpb25OYW1lLCBlLCB1c2VySWQ7XG4gIHRyeSB7XG4gICAgdXNlcklkID0gU3RlZWRvcy5nZXRVc2VySWRGcm9tQXV0aFRva2VuKHJlcSwgcmVzKTtcbiAgICBpZiAoIXVzZXJJZCkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwiTm8gcGVybWlzc2lvblwiKTtcbiAgICB9XG4gICAgY29sbGVjdGlvbk5hbWUgPSBcInZpZGVvc1wiO1xuICAgIEFMWSA9IHJlcXVpcmUoJ2FsaXl1bi1zZGsnKTtcbiAgICBKc29uUm91dGVzLnBhcnNlRmlsZXMocmVxLCByZXMsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGFjY2Vzc0tleUlkLCBjb2xsZWN0aW9uLCBkYXRlLCBvc3MsIHF1ZXJ5LCByLCByZWYsIHJlZjEsIHJlZjIsIHJlZjMsIHNlY3JldEFjY2Vzc0tleSwgdXBsb2FkQWRkcmVzcywgdXBsb2FkQXV0aCwgdXJsLCB2aWRlb0lkO1xuICAgICAgY29sbGVjdGlvbiA9IGNmc1tjb2xsZWN0aW9uTmFtZV07XG4gICAgICBpZiAoIWNvbGxlY3Rpb24pIHtcbiAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwiTm8gQ29sbGVjdGlvblwiKTtcbiAgICAgIH1cbiAgICAgIGlmIChyZXEuZmlsZXMgJiYgcmVxLmZpbGVzWzBdKSB7XG4gICAgICAgIGlmIChjb2xsZWN0aW9uTmFtZSA9PT0gJ3ZpZGVvcycgJiYgKChyZWYgPSBNZXRlb3Iuc2V0dGluZ3NbXCJwdWJsaWNcIl0uY2ZzKSAhPSBudWxsID8gcmVmLnN0b3JlIDogdm9pZCAwKSA9PT0gXCJPU1NcIikge1xuICAgICAgICAgIGFjY2Vzc0tleUlkID0gKHJlZjEgPSBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmFsaXl1bikgIT0gbnVsbCA/IHJlZjEuYWNjZXNzS2V5SWQgOiB2b2lkIDA7XG4gICAgICAgICAgc2VjcmV0QWNjZXNzS2V5ID0gKHJlZjIgPSBNZXRlb3Iuc2V0dGluZ3MuY2ZzLmFsaXl1bikgIT0gbnVsbCA/IHJlZjIuc2VjcmV0QWNjZXNzS2V5IDogdm9pZCAwO1xuICAgICAgICAgIGRhdGUgPSBBTFkudXRpbC5kYXRlLmdldERhdGUoKTtcbiAgICAgICAgICBxdWVyeSA9IHtcbiAgICAgICAgICAgIEFjdGlvbjogXCJDcmVhdGVVcGxvYWRWaWRlb1wiLFxuICAgICAgICAgICAgVGl0bGU6IHJlcS5maWxlc1swXS5maWxlbmFtZSxcbiAgICAgICAgICAgIEZpbGVOYW1lOiByZXEuZmlsZXNbMF0uZmlsZW5hbWVcbiAgICAgICAgICB9O1xuICAgICAgICAgIHVybCA9IFwiaHR0cDovL3ZvZC5jbi1zaGFuZ2hhaS5hbGl5dW5jcy5jb20vP1wiICsgZ2V0UXVlcnlTdHJpbmcoYWNjZXNzS2V5SWQsIHNlY3JldEFjY2Vzc0tleSwgcXVlcnksICdHRVQnKTtcbiAgICAgICAgICByID0gSFRUUC5jYWxsKCdHRVQnLCB1cmwpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKHIpO1xuICAgICAgICAgIGlmICgocmVmMyA9IHIuZGF0YSkgIT0gbnVsbCA/IHJlZjMuVmlkZW9JZCA6IHZvaWQgMCkge1xuICAgICAgICAgICAgdmlkZW9JZCA9IHIuZGF0YS5WaWRlb0lkO1xuICAgICAgICAgICAgdXBsb2FkQWRkcmVzcyA9IEpTT04ucGFyc2UobmV3IEJ1ZmZlcihyLmRhdGEuVXBsb2FkQWRkcmVzcywgJ2Jhc2U2NCcpLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgY29uc29sZS5sb2codXBsb2FkQWRkcmVzcyk7XG4gICAgICAgICAgICB1cGxvYWRBdXRoID0gSlNPTi5wYXJzZShuZXcgQnVmZmVyKHIuZGF0YS5VcGxvYWRBdXRoLCAnYmFzZTY0JykudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh1cGxvYWRBdXRoKTtcbiAgICAgICAgICAgIG9zcyA9IG5ldyBBTFkuT1NTKHtcbiAgICAgICAgICAgICAgXCJhY2Nlc3NLZXlJZFwiOiB1cGxvYWRBdXRoLkFjY2Vzc0tleUlkLFxuICAgICAgICAgICAgICBcInNlY3JldEFjY2Vzc0tleVwiOiB1cGxvYWRBdXRoLkFjY2Vzc0tleVNlY3JldCxcbiAgICAgICAgICAgICAgXCJlbmRwb2ludFwiOiB1cGxvYWRBZGRyZXNzLkVuZHBvaW50LFxuICAgICAgICAgICAgICBcImFwaVZlcnNpb25cIjogJzIwMTMtMTAtMTUnLFxuICAgICAgICAgICAgICBcInNlY3VyaXR5VG9rZW5cIjogdXBsb2FkQXV0aC5TZWN1cml0eVRva2VuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBvc3MucHV0T2JqZWN0KHtcbiAgICAgICAgICAgICAgQnVja2V0OiB1cGxvYWRBZGRyZXNzLkJ1Y2tldCxcbiAgICAgICAgICAgICAgS2V5OiB1cGxvYWRBZGRyZXNzLkZpbGVOYW1lLFxuICAgICAgICAgICAgICBCb2R5OiByZXEuZmlsZXNbMF0uZGF0YSxcbiAgICAgICAgICAgICAgQWNjZXNzQ29udHJvbEFsbG93T3JpZ2luOiAnJyxcbiAgICAgICAgICAgICAgQ29udGVudFR5cGU6IHJlcS5maWxlc1swXS5taW1lVHlwZSxcbiAgICAgICAgICAgICAgQ2FjaGVDb250cm9sOiAnbm8tY2FjaGUnLFxuICAgICAgICAgICAgICBDb250ZW50RGlzcG9zaXRpb246ICcnLFxuICAgICAgICAgICAgICBDb250ZW50RW5jb2Rpbmc6ICd1dGYtOCcsXG4gICAgICAgICAgICAgIFNlcnZlclNpZGVFbmNyeXB0aW9uOiAnQUVTMjU2JyxcbiAgICAgICAgICAgICAgRXhwaXJlczogbnVsbFxuICAgICAgICAgICAgfSwgTWV0ZW9yLmJpbmRFbnZpcm9ubWVudChmdW5jdGlvbihlcnIsIGRhdGEpIHtcbiAgICAgICAgICAgICAgdmFyIGdldFBsYXlJbmZvUXVlcnksIGdldFBsYXlJbmZvUmVzdWx0LCBnZXRQbGF5SW5mb1VybCwgbmV3RGF0ZTtcbiAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlcnJvcjonLCBlcnIpO1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3N1Y2Nlc3M6JywgZGF0YSk7XG4gICAgICAgICAgICAgIG5ld0RhdGUgPSBBTFkudXRpbC5kYXRlLmdldERhdGUoKTtcbiAgICAgICAgICAgICAgZ2V0UGxheUluZm9RdWVyeSA9IHtcbiAgICAgICAgICAgICAgICBBY3Rpb246ICdHZXRQbGF5SW5mbycsXG4gICAgICAgICAgICAgICAgVmlkZW9JZDogdmlkZW9JZFxuICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICBnZXRQbGF5SW5mb1VybCA9IFwiaHR0cDovL3ZvZC5jbi1zaGFuZ2hhaS5hbGl5dW5jcy5jb20vP1wiICsgZ2V0UXVlcnlTdHJpbmcoYWNjZXNzS2V5SWQsIHNlY3JldEFjY2Vzc0tleSwgZ2V0UGxheUluZm9RdWVyeSwgJ0dFVCcpO1xuICAgICAgICAgICAgICBnZXRQbGF5SW5mb1Jlc3VsdCA9IEhUVFAuY2FsbCgnR0VUJywgZ2V0UGxheUluZm9VcmwpO1xuICAgICAgICAgICAgICByZXR1cm4gSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgICAgICAgICAgIGNvZGU6IDIwMCxcbiAgICAgICAgICAgICAgICBkYXRhOiBnZXRQbGF5SW5mb1Jlc3VsdFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBcIk5vIEZpbGVcIik7XG4gICAgICB9XG4gICAgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgZSA9IGVycm9yO1xuICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayk7XG4gICAgcmV0dXJuIEpzb25Sb3V0ZXMuc2VuZFJlc3VsdChyZXMsIHtcbiAgICAgIGNvZGU6IGUuZXJyb3IgfHwgNTAwLFxuICAgICAgZGF0YToge1xuICAgICAgICBlcnJvcnM6IGUucmVhc29uIHx8IGUubWVzc2FnZVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59KTtcbiIsIkpzb25Sb3V0ZXMuYWRkICdwb3N0JywgJy9hcGkvb2JqZWN0L3dvcmtmbG93L2RyYWZ0cycsIChyZXEsIHJlcywgbmV4dCkgLT5cclxuXHR0cnlcclxuXHRcdGN1cnJlbnRfdXNlcl9pbmZvID0gdXVmbG93TWFuYWdlckZvckluaXRBcHByb3ZhbC5jaGVja19hdXRob3JpemF0aW9uKHJlcSlcclxuXHRcdGN1cnJlbnRfdXNlcl9pZCA9IGN1cnJlbnRfdXNlcl9pbmZvLl9pZFxyXG5cclxuXHRcdGhhc2hEYXRhID0gcmVxLmJvZHlcclxuXHJcblx0XHRpbnNlcnRlZF9pbnN0YW5jZXMgPSBuZXcgQXJyYXlcclxuXHJcblx0XHRfLmVhY2ggaGFzaERhdGFbJ0luc3RhbmNlcyddLCAoaW5zdGFuY2VfZnJvbV9jbGllbnQpIC0+XHJcblx0XHRcdG5ld19pbnNfaWQgPSB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmNyZWF0ZV9pbnN0YW5jZShpbnN0YW5jZV9mcm9tX2NsaWVudCwgY3VycmVudF91c2VyX2luZm8pXHJcblxyXG5cdFx0XHRuZXdfaW5zID0gQ3JlYXRvci5Db2xsZWN0aW9ucy5pbnN0YW5jZXMuZmluZE9uZSh7IF9pZDogbmV3X2luc19pZCB9LCB7IGZpZWxkczogeyBzcGFjZTogMSwgZmxvdzogMSwgZmxvd192ZXJzaW9uOiAxLCBmb3JtOiAxLCBmb3JtX3ZlcnNpb246IDEgfSB9KVxyXG5cclxuXHRcdFx0aW5zZXJ0ZWRfaW5zdGFuY2VzLnB1c2gobmV3X2lucylcclxuXHJcblx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLCB7XHJcblx0XHRcdGNvZGU6IDIwMFxyXG5cdFx0XHRkYXRhOiB7IGluc2VydHM6IGluc2VydGVkX2luc3RhbmNlcyB9XHJcblx0XHR9XHJcblx0Y2F0Y2ggZVxyXG5cdFx0Y29uc29sZS5lcnJvciBlLnN0YWNrXHJcblx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLCB7XHJcblx0XHRcdGNvZGU6IDIwMFxyXG5cdFx0XHRkYXRhOiB7IGVycm9yczogW3sgZXJyb3JNZXNzYWdlOiBlLnJlYXNvbiB8fCBlLm1lc3NhZ2UgfV0gfVxyXG5cdFx0fVxyXG5cclxuIiwiSnNvblJvdXRlcy5hZGQoJ3Bvc3QnLCAnL2FwaS9vYmplY3Qvd29ya2Zsb3cvZHJhZnRzJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgdmFyIGN1cnJlbnRfdXNlcl9pZCwgY3VycmVudF91c2VyX2luZm8sIGUsIGhhc2hEYXRhLCBpbnNlcnRlZF9pbnN0YW5jZXM7XG4gIHRyeSB7XG4gICAgY3VycmVudF91c2VyX2luZm8gPSB1dWZsb3dNYW5hZ2VyRm9ySW5pdEFwcHJvdmFsLmNoZWNrX2F1dGhvcml6YXRpb24ocmVxKTtcbiAgICBjdXJyZW50X3VzZXJfaWQgPSBjdXJyZW50X3VzZXJfaW5mby5faWQ7XG4gICAgaGFzaERhdGEgPSByZXEuYm9keTtcbiAgICBpbnNlcnRlZF9pbnN0YW5jZXMgPSBuZXcgQXJyYXk7XG4gICAgXy5lYWNoKGhhc2hEYXRhWydJbnN0YW5jZXMnXSwgZnVuY3Rpb24oaW5zdGFuY2VfZnJvbV9jbGllbnQpIHtcbiAgICAgIHZhciBuZXdfaW5zLCBuZXdfaW5zX2lkO1xuICAgICAgbmV3X2luc19pZCA9IHV1Zmxvd01hbmFnZXJGb3JJbml0QXBwcm92YWwuY3JlYXRlX2luc3RhbmNlKGluc3RhbmNlX2Zyb21fY2xpZW50LCBjdXJyZW50X3VzZXJfaW5mbyk7XG4gICAgICBuZXdfaW5zID0gQ3JlYXRvci5Db2xsZWN0aW9ucy5pbnN0YW5jZXMuZmluZE9uZSh7XG4gICAgICAgIF9pZDogbmV3X2luc19pZFxuICAgICAgfSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBzcGFjZTogMSxcbiAgICAgICAgICBmbG93OiAxLFxuICAgICAgICAgIGZsb3dfdmVyc2lvbjogMSxcbiAgICAgICAgICBmb3JtOiAxLFxuICAgICAgICAgIGZvcm1fdmVyc2lvbjogMVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBpbnNlcnRlZF9pbnN0YW5jZXMucHVzaChuZXdfaW5zKTtcbiAgICB9KTtcbiAgICByZXR1cm4gSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgY29kZTogMjAwLFxuICAgICAgZGF0YToge1xuICAgICAgICBpbnNlcnRzOiBpbnNlcnRlZF9pbnN0YW5jZXNcbiAgICAgIH1cbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBlID0gZXJyb3I7XG4gICAgY29uc29sZS5lcnJvcihlLnN0YWNrKTtcbiAgICByZXR1cm4gSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgY29kZTogMjAwLFxuICAgICAgZGF0YToge1xuICAgICAgICBlcnJvcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBlcnJvck1lc3NhZ2U6IGUucmVhc29uIHx8IGUubWVzc2FnZVxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIH0pO1xuICB9XG59KTtcbiJdfQ==
