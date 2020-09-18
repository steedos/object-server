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
var JsonRoutes = Package['simple:json-routes'].JsonRoutes;
var RestMiddleware = Package['simple:json-routes'].RestMiddleware;
var Restivus = Package['nimble:restivus'].Restivus;
var SimpleSchema = Package['aldeed:simple-schema'].SimpleSchema;
var MongoObject = Package['aldeed:simple-schema'].MongoObject;
var Tabular = Package['aldeed:tabular'].Tabular;
var CollectionHooks = Package['matb33:collection-hooks'].CollectionHooks;
var SubsManager = Package['meteorhacks:subs-manager'].SubsManager;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;
var Collection2 = Package['aldeed:collection2-core'].Collection2;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var __coffeescriptShare;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_application-package/models/application_package.coffee                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Creator.Objects.application_package = {
  name: "application_package",
  icon: "custom.custom42",
  label: "软件包",
  fields: {
    name: {
      type: "text",
      label: "名称"
    },
    apps: {
      type: "lookup",
      label: "应用",
      type: "lookup",
      reference_to: "apps",
      multiple: true,
      optionsFunction: function () {
        var _options;

        _options = [];

        _.forEach(Creator.Apps, function (o, k) {
          return _options.push({
            label: o.name,
            value: k,
            icon: o.icon_slds
          });
        });

        return _options;
      }
    },
    objects: {
      type: "lookup",
      label: "对象",
      reference_to: "objects",
      multiple: true,
      optionsFunction: function () {
        var _options;

        _options = [];

        _.forEach(Creator.objectsByName, function (o, k) {
          if (!o.hidden) {
            return _options.push({
              label: o.label,
              value: k,
              icon: o.icon
            });
          }
        });

        return _options;
      }
    },
    list_views: {
      type: "lookup",
      label: "列表视图",
      multiple: true,
      reference_to: "object_listviews",
      optionsMethod: "creator.listviews_options"
    },
    permission_set: {
      type: "lookup",
      label: "权限组",
      multiple: true,
      reference_to: "permission_set"
    },
    permission_objects: {
      type: "lookup",
      label: "权限集",
      multiple: true,
      reference_to: "permission_objects"
    },
    reports: {
      type: "lookup",
      label: "报表",
      multiple: true,
      reference_to: "reports"
    }
  },
  list_views: {
    all: {
      label: "所有",
      columns: ["name"],
      filter_scope: "space"
    }
  },
  actions: {
    init_data: {
      label: "初始化",
      visible: true,
      on: "record",
      todo: function (object_name, record_id, fields) {
        console.log(object_name, record_id, fields);
        return Meteor.call("appPackage.init_export_data", Session.get("spaceId"), record_id, function (error, result) {
          if (error) {
            return toastr.error(error.reason);
          } else {
            return toastr.success("初始化完成");
          }
        });
      }
    },
    "export": {
      label: "导出",
      visible: true,
      on: "record",
      todo: function (object_name, record_id, fields) {
        var url;
        console.log("导出" + object_name + "->" + record_id);
        url = Steedos.absoluteUrl("/api/creator/app_package/export/" + Session.get("spaceId") + "/" + record_id);
        return window.open(url);
      }
    },
    "import": {
      label: "导入",
      visible: true,
      on: "list",
      todo: function (object_name) {
        console.log("object_name", object_name);
        return Modal.show("APPackageImportModal");
      }
    }
  }
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_application-package/server/routes/export.coffee                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
JsonRoutes.add('get', '/api/creator/app_package/export/:space_id/:record_id', function (req, res, next) {
  var data, e, fileName, record, record_id, space_id, space_user, userId;

  try {
    userId = Steedos.getUserIdFromAuthToken(req, res);

    if (!userId) {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          errors: "Authentication is required and has not been provided."
        }
      });
      return;
    }

    record_id = req.params.record_id;
    space_id = req.params.space_id;

    if (!Creator.isSpaceAdmin(space_id, userId)) {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          errors: "Permission denied"
        }
      });
      return;
    }

    record = Creator.getCollection("application_package").findOne({
      _id: record_id
    });

    if (!record) {
      JsonRoutes.sendResult(res, {
        code: 404,
        data: {
          errors: "Collection not found for the segment " + record_id
        }
      });
      return;
    }

    space_user = Creator.getCollection("space_users").findOne({
      user: userId,
      space: record.space
    });

    if (!space_user) {
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          errors: "User does not have privileges to access the entity"
        }
      });
      return;
    }

    data = APTransform["export"](record);
    data.dataSource = Meteor.absoluteUrl("api/creator/app_package/export/" + space_id + "/" + record_id);
    fileName = record.name || "application_package";
    res.setHeader('Content-type', 'application/x-msdownload');
    res.setHeader('Content-Disposition', 'attachment;filename=' + encodeURI(fileName) + '.json');
    return res.end(JSON.stringify(data, null, 4));
  } catch (error) {
    e = error;
    console.error(e.stack);
    return JsonRoutes.sendResult(res, {
      code: 200,
      data: {
        errors: e.reason || e.message
      }
    });
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_application-package/server/routes/import.coffee                                                   //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var transformFieldOptions, transformFilters;

transformFilters = function (filters) {
  var _filters;

  _filters = [];

  _.each(filters, function (f) {
    if (_.isArray(f) && f.length === 3) {
      return _filters.push({
        field: f[0],
        operation: f[1],
        value: f[2]
      });
    } else {
      return _filters.push(f);
    }
  });

  return _filters;
};

transformFieldOptions = function (options) {
  var _options;

  if (!_.isArray(options)) {
    return options;
  }

  _options = [];

  _.each(options, function (o) {
    if (o && _.has(o, 'label') && _.has(o, 'value')) {
      return _options.push(o.label + ":" + o.value);
    }
  });

  return _options.join(',');
};

Creator.importObject = function (userId, space_id, object, list_views_id_maps) {
  var _fieldnames, actions, fields, hasRecentView, internal_list_view, obj_list_views, triggers;

  console.log('------------------importObject------------------', object.name);
  fields = object.fields;
  triggers = object.triggers;
  actions = object.actions;
  obj_list_views = object.list_views;
  delete object._id;
  delete object.fields;
  delete object.triggers;
  delete object.actions;
  delete object.permissions;
  delete object.list_views;
  object.space = space_id;
  object.owner = userId;
  Creator.getCollection("objects").insert(object);
  internal_list_view = {};
  hasRecentView = false;
  console.log('持久化对象list_views');

  _.each(obj_list_views, function (list_view) {
    var new_id, old_id, options;
    old_id = list_view._id;
    delete list_view._id;
    list_view.space = space_id;
    list_view.owner = userId;
    list_view.object_name = object.name;

    if (Creator.isRecentView(list_view)) {
      hasRecentView = true;
    }

    if (list_view.filters) {
      list_view.filters = transformFilters(list_view.filters);
    }

    if (Creator.isAllView(list_view) || Creator.isRecentView(list_view)) {
      options = {
        $set: list_view
      };

      if (!list_view.columns) {
        options.$unset = {
          columns: ''
        };
      }

      return Creator.getCollection("object_listviews").update({
        object_name: object.name,
        name: list_view.name,
        space: space_id
      }, options);
    } else {
      new_id = Creator.getCollection("object_listviews").insert(list_view);
      return list_views_id_maps[object.name + "_" + old_id] = new_id;
    }
  });

  if (!hasRecentView) {
    Creator.getCollection("object_listviews").remove({
      name: "recent",
      space: space_id,
      object_name: object.name,
      owner: userId
    });
  }

  console.log('持久化对象字段');
  _fieldnames = [];

  _.each(fields, function (field, k) {
    delete field._id;
    field.space = space_id;
    field.owner = userId;
    field.object = object.name;

    if (field.options) {
      field.options = transformFieldOptions(field.options);
    }

    if (!_.has(field, "name")) {
      field.name = k;
    }

    _fieldnames.push(field.name);

    if (field.name === "name") {
      Creator.getCollection("object_fields").update({
        object: object.name,
        name: "name",
        space: space_id
      }, {
        $set: field
      });
    } else {
      Creator.getCollection("object_fields").insert(field);
    }

    if (!_.contains(_fieldnames, 'name')) {
      return Creator.getCollection("object_fields").direct.remove({
        object: object.name,
        name: "name",
        space: space_id
      });
    }
  });

  console.log('持久化触发器');

  _.each(triggers, function (trigger, k) {
    delete triggers._id;
    trigger.space = space_id;
    trigger.owner = userId;
    trigger.object = object.name;

    if (!_.has(trigger, "name")) {
      trigger.name = k.replace(new RegExp("\\.", "g"), "_");
    }

    if (!_.has(trigger, "is_enable")) {
      trigger.is_enable = true;
    }

    return Creator.getCollection("object_triggers").insert(trigger);
  });

  console.log('持久化操作');

  _.each(actions, function (action, k) {
    delete action._id;
    action.space = space_id;
    action.owner = userId;
    action.object = object.name;

    if (!_.has(action, "name")) {
      action.name = k.replace(new RegExp("\\.", "g"), "_");
    }

    if (!_.has(action, "is_enable")) {
      action.is_enable = true;
    }

    return Creator.getCollection("object_actions").insert(action);
  });

  return console.log('------------------importObject end------------------', object.name);
};

Creator.import_app_package = function (userId, space_id, imp_data, from_template) {
  var apps_id_maps, imp_app_ids, imp_object_names, list_views_id_maps, object_names, permission_set_id_maps, permission_set_ids;

  if (!userId) {
    throw new Meteor.Error("401", "Authentication is required and has not been provided.");
  }

  if (!Creator.isSpaceAdmin(space_id, userId)) {
    throw new Meteor.Error("401", "Permission denied.");
  } /*数据校验 开始 */

  check(imp_data, Object);

  if (!from_template) {
    imp_app_ids = _.pluck(imp_data.apps, "_id");

    if (_.isArray(imp_data.apps) && imp_data.apps.length > 0) {
      _.each(imp_data.apps, function (app) {
        if (_.include(_.keys(Creator.Apps), app._id)) {
          throw new Meteor.Error("500", "应用'" + app.name + "'已存在");
        }
      });
    }

    if (_.isArray(imp_data.objects) && imp_data.objects.length > 0) {
      _.each(imp_data.objects, function (object) {
        if (_.include(_.keys(Creator.Objects), object.name)) {
          throw new Meteor.Error("500", "对象'" + object.name + "'已存在");
        }

        return _.each(object.triggers, function (trigger) {
          if (trigger.on === 'server' && !Steedos.isLegalVersion(space_id, "workflow.enterprise")) {
            throw new Meteor.Error(500, "只有企业版支持配置服务端的触发器");
          }
        });
      });
    }

    imp_object_names = _.pluck(imp_data.objects, "name");
    object_names = _.keys(Creator.Objects);

    if (_.isArray(imp_data.apps) && imp_data.apps.length > 0) {
      _.each(imp_data.apps, function (app) {
        return _.each(app.objects, function (object_name) {
          if (!_.include(object_names, object_name) && !_.include(imp_object_names, object_name)) {
            throw new Meteor.Error("500", "应用'" + app.name + "'中指定的对象'" + object_name + "'不存在");
          }
        });
      });
    }

    if (_.isArray(imp_data.list_views) && imp_data.list_views.length > 0) {
      _.each(imp_data.list_views, function (list_view) {
        if (!list_view.object_name || !_.isString(list_view.object_name)) {
          throw new Meteor.Error("500", "列表视图'" + list_view.name + "'的object_name属性无效");
        }

        if (!_.include(object_names, list_view.object_name) && !_.include(imp_object_names, list_view.object_name)) {
          throw new Meteor.Error("500", "列表视图'" + list_view.name + "'中指定的对象'" + list_view.object_name + "'不存在");
        }
      });
    }

    permission_set_ids = _.pluck(imp_data.permission_set, "_id");

    if (_.isArray(imp_data.permission_set) && imp_data.permission_set.length > 0) {
      _.each(imp_data.permission_set, function (permission_set) {
        if (Creator.getCollection("permission_set").findOne({
          space: space_id,
          name: permission_set.name
        }, {
          fields: {
            _id: 1
          }
        })) {
          throw new Meteor.Error(500, "权限组名称'" + permission_set.name + "'不能重复");
        }

        return _.each(permission_set.assigned_apps, function (app_id) {
          if (!_.include(_.keys(Creator.Apps), app_id) && !_.include(imp_app_ids, app_id)) {
            throw new Meteor.Error("500", "权限组'" + permission_set.name + "'的授权应用'" + app_id + "'不存在");
          }
        });
      });
    }

    if (_.isArray(imp_data.permission_objects) && imp_data.permission_objects.length > 0) {
      _.each(imp_data.permission_objects, function (permission_object) {
        if (!permission_object.object_name || !_.isString(permission_object.object_name)) {
          throw new Meteor.Error("500", "权限集'" + permission_object.name + "'的object_name属性无效");
        }

        if (!_.include(object_names, permission_object.object_name) && !_.include(imp_object_names, permission_object.object_name)) {
          throw new Meteor.Error("500", "权限集'" + list_view.name + "'中指定的对象'" + permission_object.object_name + "'不存在");
        }

        if (!_.has(permission_object, "permission_set_id") || !_.isString(permission_object.permission_set_id)) {
          throw new Meteor.Error("500", "权限集'" + permission_object.name + "'的permission_set_id属性无效");
        } else if (!_.include(permission_set_ids, permission_object.permission_set_id)) {
          throw new Meteor.Error("500", "权限集'" + permission_object.name + "'指定的权限组'" + permission_object.permission_set_id + "'值不在导入的permission_set中");
        }
      });
    }

    if (_.isArray(imp_data.reports) && imp_data.reports.length > 0) {
      _.each(imp_data.reports, function (report) {
        if (!report.object_name || !_.isString(report.object_name)) {
          throw new Meteor.Error("500", "报表'" + report.name + "'的object_name属性无效");
        }

        if (!_.include(object_names, report.object_name) && !_.include(imp_object_names, report.object_name)) {
          throw new Meteor.Error("500", "报表'" + report.name + "'中指定的对象'" + report.object_name + "'不存在");
        }
      });
    }
  } /*数据校验 结束 */ /*数据持久化 开始 */

  apps_id_maps = {};
  list_views_id_maps = {};
  permission_set_id_maps = {};

  if (_.isArray(imp_data.apps) && imp_data.apps.length > 0) {
    _.each(imp_data.apps, function (app) {
      var new_id, old_id;
      old_id = app._id;
      delete app._id;
      app.space = space_id;
      app.owner = userId;
      app.is_creator = true;
      new_id = Creator.getCollection("apps").insert(app);
      return apps_id_maps[old_id] = new_id;
    });
  }

  if (_.isArray(imp_data.objects) && imp_data.objects.length > 0) {
    _.each(imp_data.objects, function (object) {
      return Creator.importObject(userId, space_id, object, list_views_id_maps);
    });
  }

  if (_.isArray(imp_data.list_views) && imp_data.list_views.length > 0) {
    _.each(imp_data.list_views, function (list_view) {
      var _list_view, new_id, old_id;

      old_id = list_view._id;
      delete list_view._id;
      list_view.space = space_id;
      list_view.owner = userId;

      if (Creator.isAllView(list_view) || Creator.isRecentView(list_view)) {
        _list_view = Creator.getCollection("object_listviews").findOne({
          object_name: list_view.object_name,
          name: list_view.name,
          space: space_id
        }, {
          fields: {
            _id: 1
          }
        });

        if (_list_view) {
          new_id = _list_view._id;
        }

        Creator.getCollection("object_listviews").update({
          object_name: list_view.object_name,
          name: list_view.name,
          space: space_id
        }, {
          $set: list_view
        });
      } else {
        new_id = Creator.getCollection("object_listviews").insert(list_view);
      }

      return list_views_id_maps[list_view.object_name + "_" + old_id] = new_id;
    });
  }

  if (_.isArray(imp_data.permission_set) && imp_data.permission_set.length > 0) {
    _.each(imp_data.permission_set, function (permission_set) {
      var assigned_apps, new_id, old_id, permission_set_users;
      old_id = permission_set._id;
      delete permission_set._id;
      permission_set.space = space_id;
      permission_set.owner = userId;
      permission_set_users = [];

      _.each(permission_set.users, function (user_id) {
        var space_user;
        space_user = Creator.getCollection("space_users").findOne({
          space: space_id,
          user: user_id
        }, {
          fields: {
            _id: 1
          }
        });

        if (space_user) {
          return permission_set_users.push(user_id);
        }
      });

      assigned_apps = [];

      _.each(permission_set.assigned_apps, function (app_id) {
        if (_.include(_.keys(Creator.Apps), app_id)) {
          return assigned_apps.push(app_id);
        } else if (apps_id_maps[app_id]) {
          return assigned_apps.push(apps_id_maps[app_id]);
        }
      });

      new_id = Creator.getCollection("permission_set").insert(permission_set);
      return permission_set_id_maps[old_id] = new_id;
    });
  }

  if (_.isArray(imp_data.permission_objects) && imp_data.permission_objects.length > 0) {
    _.each(imp_data.permission_objects, function (permission_object) {
      var disabled_list_views;
      delete permission_object._id;
      permission_object.space = space_id;
      permission_object.owner = userId;
      permission_object.permission_set_id = permission_set_id_maps[permission_object.permission_set_id];
      disabled_list_views = [];

      _.each(permission_object.disabled_list_views, function (list_view_id) {
        var new_view_id;
        new_view_id = list_views_id_maps[permission_object.object_name + "_" + list_view_id];

        if (new_view_id) {
          return disabled_list_views.push(new_view_id);
        }
      });

      return Creator.getCollection("permission_objects").insert(permission_object);
    });
  }

  if (_.isArray(imp_data.reports) && imp_data.reports.length > 0) {
    return _.each(imp_data.reports, function (report) {
      delete report._id;
      report.space = space_id;
      report.owner = userId;
      return Creator.getCollection("reports").insert(report);
    });
  } /*数据持久化 结束 */
}; /*由于使用接口方式会导致collection的after、before中获取不到userId，再此问题未解决之前，还是使用Method
   JsonRoutes.add 'post', '/api/creator/app_package/import/:space_id', (req, res, next) ->
   	try
   		userId = Steedos.getUserIdFromAuthToken(req, res);
   		space_id = req.params.space_id
   		imp_data = req.body
   		import_app_package(userId, space_id, imp_data)
   		JsonRoutes.sendResult res, {
   			code: 200
   			data: {}
   		}
   	catch e
   		console.error e.stack
   		JsonRoutes.sendResult res, {
   			code: e.error
   			data: { errors: errorMessage: e.reason || e.message }
   		}
    */

Meteor.methods({
  'import_app_package': function (space_id, imp_data) {
    var userId;
    userId = this.userId;
    return Creator.import_app_package(userId, space_id, imp_data);
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_application-package/server/methods/listviews_options.coffee                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Meteor.methods({
  "creator.listviews_options": function (options) {
    var collection, e, name_field_key, object, query, query_options, records, ref, ref1, results, searchTextQuery, selected, sort;

    if (options != null ? (ref = options.params) != null ? ref.reference_to : void 0 : void 0) {
      object = Creator.getObject(options.params.reference_to);
      name_field_key = object.NAME_FIELD_KEY;
      query = {};

      if (options.params.space) {
        query.space = options.params.space;
        sort = options != null ? options.sort : void 0;
        selected = (options != null ? options.selected : void 0) || [];

        if (options.searchText) {
          searchTextQuery = {};
          searchTextQuery[name_field_key] = {
            $regex: options.searchText
          };
        }

        if (options != null ? (ref1 = options.values) != null ? ref1.length : void 0 : void 0) {
          if (options.searchText) {
            query.$or = [{
              _id: {
                $in: options.values
              }
            }, searchTextQuery, {
              object_name: {
                $regex: options.searchText
              }
            }];
          } else {
            query.$or = [{
              _id: {
                $in: options.values
              }
            }];
          }
        } else {
          if (options.searchText) {
            _.extend(query, {
              $or: [searchTextQuery, {
                object_name: {
                  $regex: options.searchText
                }
              }]
            });
          }

          query._id = {
            $nin: selected
          };
        }

        collection = object.db;

        if (options.filterQuery) {
          _.extend(query, options.filterQuery);
        }

        query_options = {
          limit: 10
        };

        if (sort && _.isObject(sort)) {
          query_options.sort = sort;
        }

        if (collection) {
          try {
            records = collection.find(query, query_options).fetch();
            results = [];

            _.each(records, function (record) {
              var object_name, ref2;
              object_name = ((ref2 = Creator.getObject(record.object_name)) != null ? ref2.name : void 0) || "";

              if (!_.isEmpty(object_name)) {
                object_name = " (" + object_name + ")";
              }

              return results.push({
                label: record[name_field_key] + object_name,
                value: record._id
              });
            });

            return results;
          } catch (error) {
            e = error;
            throw new Meteor.Error(500, e.message + "-->" + JSON.stringify(options));
          }
        }
      }
    }

    return [];
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_application-package/server/methods/init_export_data.coffee                                        //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var getAppObjects, getObjectsListViews, getObjectsPermissionObjects, getObjectsPermissionSet, getObjectsReports;

getAppObjects = function (app) {
  var appObjects;
  appObjects = [];

  if (app && _.isArray(app.objects) && app.objects.length > 0) {
    _.each(app.objects, function (object_name) {
      var object;
      object = Creator.getObject(object_name);

      if (object) {
        return appObjects.push(object_name);
      }
    });
  }

  return appObjects;
};

getObjectsListViews = function (space_id, objects_name) {
  var objectsListViews;
  objectsListViews = [];

  if (objects_name && _.isArray(objects_name) && objects_name.length > 0) {
    _.each(objects_name, function (object_name) {
      var list_views;
      list_views = Creator.getCollection("object_listviews").find({
        object_name: object_name,
        space: space_id,
        shared: true
      }, {
        fields: {
          _id: 1
        }
      });
      return list_views.forEach(function (list_view) {
        return objectsListViews.push(list_view._id);
      });
    });
  }

  return objectsListViews;
};

getObjectsReports = function (space_id, objects_name) {
  var objectsReports;
  objectsReports = [];

  if (objects_name && _.isArray(objects_name) && objects_name.length > 0) {
    _.each(objects_name, function (object_name) {
      var reports;
      reports = Creator.getCollection("reports").find({
        object_name: object_name,
        space: space_id
      }, {
        fields: {
          _id: 1
        }
      });
      return reports.forEach(function (report) {
        return objectsReports.push(report._id);
      });
    });
  }

  return objectsReports;
};

getObjectsPermissionObjects = function (space_id, objects_name) {
  var objectsPermissionObjects;
  objectsPermissionObjects = [];

  if (objects_name && _.isArray(objects_name) && objects_name.length > 0) {
    _.each(objects_name, function (object_name) {
      var permission_objects;
      permission_objects = Creator.getCollection("permission_objects").find({
        object_name: object_name,
        space: space_id
      }, {
        fields: {
          _id: 1
        }
      });
      return permission_objects.forEach(function (permission_object) {
        return objectsPermissionObjects.push(permission_object._id);
      });
    });
  }

  return objectsPermissionObjects;
};

getObjectsPermissionSet = function (space_id, objects_name) {
  var objectsPermissionSet;
  objectsPermissionSet = [];

  if (objects_name && _.isArray(objects_name) && objects_name.length > 0) {
    _.each(objects_name, function (object_name) {
      var permission_objects;
      permission_objects = Creator.getCollection("permission_objects").find({
        object_name: object_name,
        space: space_id
      }, {
        fields: {
          permission_set_id: 1
        }
      });
      return permission_objects.forEach(function (permission_object) {
        var permission_set;
        permission_set = Creator.getCollection("permission_set").findOne({
          _id: permission_object.permission_set_id
        }, {
          fields: {
            _id: 1
          }
        });
        return objectsPermissionSet.push(permission_set._id);
      });
    });
  }

  return objectsPermissionSet;
};

Meteor.methods({
  "appPackage.init_export_data": function (space_id, record_id) {
    var _objects, _objects_list_views, _objects_permission_objects, _objects_permission_set, _objects_reports, data, e, record, ref, ref1, userId;

    userId = this.userId;

    if (!userId) {
      throw new Meteor.Error("401", "Authentication is required and has not been provided.");
    }

    if (!Creator.isSpaceAdmin(space_id, userId)) {
      throw new Meteor.Error("401", "Permission denied.");
    }

    record = Creator.getCollection("application_package").findOne({
      _id: record_id
    });

    if ((!_.isArray(record != null ? record.apps : void 0) || (record != null ? (ref = record.apps) != null ? ref.length : void 0 : void 0) < 1) && (!_.isArray(record != null ? record.objects : void 0) || (record != null ? (ref1 = record.objects) != null ? ref1.length : void 0 : void 0) < 1)) {
      throw new Meteor.Error("500", "请先选择应用或者对象");
    }

    data = {};
    _objects = record.objects || [];
    _objects_list_views = record.list_views || [];
    _objects_reports = record.reports || [];
    _objects_permission_objects = record.permission_objects || [];
    _objects_permission_set = record.permission_set || [];

    try {
      if (_.isArray(record != null ? record.apps : void 0) && record.apps.length > 0) {
        _.each(record.apps, function (appId) {
          var app;

          if (!app) {
            app = Creator.getCollection("apps").findOne({
              _id: appId,
              is_creator: true
            }, {
              fields: {
                objects: 1
              }
            });
          }

          return _objects = _objects.concat(getAppObjects(app));
        });
      }

      if (_.isArray(_objects) && _objects.length > 0) {
        _objects_list_views = _objects_list_views.concat(getObjectsListViews(space_id, _objects));
        _objects_reports = _objects_reports.concat(getObjectsReports(space_id, _objects));
        _objects_permission_objects = _objects_permission_objects.concat(getObjectsPermissionObjects(space_id, _objects));
        _objects_permission_set = _objects_permission_set.concat(getObjectsPermissionSet(space_id, _objects));
        data.objects = _.uniq(_objects);
        data.list_views = _.uniq(_objects_list_views);
        data.permission_set = _.uniq(_objects_permission_set);
        data.permission_objects = _.uniq(_objects_permission_objects);
        data.reports = _.uniq(_objects_reports);
        return Creator.getCollection("application_package").update({
          _id: record._id
        }, {
          $set: data
        });
      }
    } catch (error) {
      e = error;
      console.error(e.stack);
      throw new Meteor.Error("500", e.reason || e.message);
    }
  }
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/steedos_application-package/lib/transform.coffee                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var ignore_fields;
this.APTransform = {};
ignore_fields = {
  owner: 0,
  space: 0,
  created: 0,
  created_by: 0,
  modified: 0,
  modified_by: 0,
  is_deleted: 0,
  instances: 0,
  sharing: 0
};

APTransform.exportObject = function (object) {
  var _obj, actions, fields, obj_list_views, triggers;

  _obj = {};

  _.extend(_obj, object);

  obj_list_views = {};

  _.extend(obj_list_views, _obj.list_views || {});

  _.each(obj_list_views, function (v, k) {
    if (!_.has(v, "_id")) {
      v._id = k;
    }

    if (!_.has(v, "name")) {
      return v.name = k;
    }
  });

  _obj.list_views = obj_list_views;
  triggers = {};

  _.forEach(_obj.triggers, function (trigger, key) {
    var _trigger;

    _trigger = {};

    _.extend(_trigger, trigger);

    if (_.isFunction(_trigger.todo)) {
      _trigger.todo = _trigger.todo.toString();
    }

    delete _trigger._todo;
    return triggers[key] = _trigger;
  });

  _obj.triggers = triggers;
  actions = {};

  _.forEach(_obj.actions, function (action, key) {
    var _action;

    _action = {};

    _.extend(_action, action);

    if (_.isFunction(_action.todo)) {
      _action.todo = _action.todo.toString();
    }

    delete _action._todo;
    return actions[key] = _action;
  });

  _obj.actions = actions;
  fields = {};

  _.forEach(_obj.fields, function (field, key) {
    var _field, _fo;

    _field = {};

    _.extend(_field, field);

    if (_.isFunction(_field.options)) {
      _field.options = _field.options.toString();
      delete _field._options;
    }

    if (_.isArray(_field.options)) {
      _fo = [];

      _.forEach(_field.options, function (_o1) {
        return _fo.push(_o1.label + ":" + _o1.value);
      });

      _field.options = _fo.join(",");
      delete _field._options;
    }

    if (_field.regEx) {
      _field.regEx = _field.regEx.toString();
      delete _field._regEx;
    }

    if (_.isFunction(_field.optionsFunction)) {
      _field.optionsFunction = _field.optionsFunction.toString();
      delete _field._optionsFunction;
    }

    if (_.isFunction(_field.reference_to)) {
      _field.reference_to = _field.reference_to.toString();
      delete _field._reference_to;
    }

    if (_.isFunction(_field.createFunction)) {
      _field.createFunction = _field.createFunction.toString();
      delete _field._createFunction;
    }

    if (_.isFunction(_field.defaultValue)) {
      _field.defaultValue = _field.defaultValue.toString();
      delete _field._defaultValue;
    }

    return fields[key] = _field;
  });

  _obj.fields = fields;
  return _obj;
}; /*
   导出数据:
   {
   	apps:[{}], 软件包选中的apps
   	objects:[{}], 选中的object及其fields, list_views, triggers, actions, permission_set等
       list_views:[{}], 软件包选中的list_views
       permissions:[{}], 软件包选中的权限集
       permission_objects:[{}], 软件包选中的权限对象
       reports:[{}] 软件包选中的报表
   }
    */

APTransform["export"] = function (record) {
  var export_data;
  export_data = {};

  if (_.isArray(record.apps) && record.apps.length > 0) {
    export_data.apps = [];

    _.each(record.apps, function (appKey) {
      var app;
      app = {};

      _.extend(app, Creator.Apps[appKey]);

      if (!app || _.isEmpty(app)) {
        app = Creator.getCollection("apps").findOne({
          _id: appKey
        }, {
          fields: ignore_fields
        });
      } else {
        if (!_.has(app, "_id")) {
          app._id = appKey;
        }
      }

      if (app) {
        return export_data.apps.push(app);
      }
    });
  }

  if (_.isArray(record.objects) && record.objects.length > 0) {
    export_data.objects = [];

    _.each(record.objects, function (object_name) {
      var object;
      object = Creator.Objects[object_name];

      if (object) {
        return export_data.objects.push(APTransform.exportObject(object));
      }
    });
  }

  if (_.isArray(record.list_views) && record.list_views.length > 0) {
    export_data.list_views = Creator.getCollection("object_listviews").find({
      _id: {
        $in: record.list_views
      }
    }, {
      fields: ignore_fields
    }).fetch();
  }

  if (_.isArray(record.permission_set) && record.permission_set.length > 0) {
    export_data.permission_set = Creator.getCollection("permission_set").find({
      _id: {
        $in: record.permission_set
      }
    }, {
      fields: ignore_fields
    }).fetch();
  }

  if (_.isArray(record.permission_objects) && record.permission_objects.length > 0) {
    export_data.permission_objects = Creator.getCollection("permission_objects").find({
      _id: {
        $in: record.permission_objects
      }
    }, {
      fields: ignore_fields
    }).fetch();
  }

  if (_.isArray(record.reports) && record.reports.length > 0) {
    export_data.reports = Creator.getCollection("reports").find({
      _id: {
        $in: record.reports
      }
    }, {
      fields: ignore_fields
    }).fetch();
  }

  return export_data;
};
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("steedos:application-package");

})();

//# sourceURL=meteor://💻app/packages/steedos_application-package.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hcHBsaWNhdGlvbi1wYWNrYWdlL21vZGVscy9hcHBsaWNhdGlvbl9wYWNrYWdlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvbW9kZWxzL2FwcGxpY2F0aW9uX3BhY2thZ2UuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2FwcGxpY2F0aW9uLXBhY2thZ2Uvc2VydmVyL3JvdXRlcy9leHBvcnQuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvcm91dGVzL2V4cG9ydC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfYXBwbGljYXRpb24tcGFja2FnZS9zZXJ2ZXIvcm91dGVzL2ltcG9ydC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9yb3V0ZXMvaW1wb3J0LmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hcHBsaWNhdGlvbi1wYWNrYWdlL3NlcnZlci9tZXRob2RzL2xpc3R2aWV3c19vcHRpb25zLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL21ldGhvZHMvbGlzdHZpZXdzX29wdGlvbnMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2FwcGxpY2F0aW9uLXBhY2thZ2Uvc2VydmVyL21ldGhvZHMvaW5pdF9leHBvcnRfZGF0YS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tZXRob2RzL2luaXRfZXhwb3J0X2RhdGEuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2FwcGxpY2F0aW9uLXBhY2thZ2UvbGliL3RyYW5zZm9ybS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi90cmFuc2Zvcm0uY29mZmVlIl0sIm5hbWVzIjpbIkNyZWF0b3IiLCJPYmplY3RzIiwiYXBwbGljYXRpb25fcGFja2FnZSIsIm5hbWUiLCJpY29uIiwibGFiZWwiLCJmaWVsZHMiLCJ0eXBlIiwiYXBwcyIsInJlZmVyZW5jZV90byIsIm11bHRpcGxlIiwib3B0aW9uc0Z1bmN0aW9uIiwiX29wdGlvbnMiLCJfIiwiZm9yRWFjaCIsIkFwcHMiLCJvIiwiayIsInB1c2giLCJ2YWx1ZSIsImljb25fc2xkcyIsIm9iamVjdHMiLCJvYmplY3RzQnlOYW1lIiwiaGlkZGVuIiwibGlzdF92aWV3cyIsIm9wdGlvbnNNZXRob2QiLCJwZXJtaXNzaW9uX3NldCIsInBlcm1pc3Npb25fb2JqZWN0cyIsInJlcG9ydHMiLCJhbGwiLCJjb2x1bW5zIiwiZmlsdGVyX3Njb3BlIiwiYWN0aW9ucyIsImluaXRfZGF0YSIsInZpc2libGUiLCJvbiIsInRvZG8iLCJvYmplY3RfbmFtZSIsInJlY29yZF9pZCIsImNvbnNvbGUiLCJsb2ciLCJNZXRlb3IiLCJjYWxsIiwiU2Vzc2lvbiIsImdldCIsImVycm9yIiwicmVzdWx0IiwidG9hc3RyIiwicmVhc29uIiwic3VjY2VzcyIsInVybCIsIlN0ZWVkb3MiLCJhYnNvbHV0ZVVybCIsIndpbmRvdyIsIm9wZW4iLCJNb2RhbCIsInNob3ciLCJKc29uUm91dGVzIiwiYWRkIiwicmVxIiwicmVzIiwibmV4dCIsImRhdGEiLCJlIiwiZmlsZU5hbWUiLCJyZWNvcmQiLCJzcGFjZV9pZCIsInNwYWNlX3VzZXIiLCJ1c2VySWQiLCJnZXRVc2VySWRGcm9tQXV0aFRva2VuIiwic2VuZFJlc3VsdCIsImNvZGUiLCJlcnJvcnMiLCJwYXJhbXMiLCJpc1NwYWNlQWRtaW4iLCJnZXRDb2xsZWN0aW9uIiwiZmluZE9uZSIsIl9pZCIsInVzZXIiLCJzcGFjZSIsIkFQVHJhbnNmb3JtIiwiZGF0YVNvdXJjZSIsInNldEhlYWRlciIsImVuY29kZVVSSSIsImVuZCIsIkpTT04iLCJzdHJpbmdpZnkiLCJzdGFjayIsIm1lc3NhZ2UiLCJ0cmFuc2Zvcm1GaWVsZE9wdGlvbnMiLCJ0cmFuc2Zvcm1GaWx0ZXJzIiwiZmlsdGVycyIsIl9maWx0ZXJzIiwiZWFjaCIsImYiLCJpc0FycmF5IiwibGVuZ3RoIiwiZmllbGQiLCJvcGVyYXRpb24iLCJvcHRpb25zIiwiaGFzIiwiam9pbiIsImltcG9ydE9iamVjdCIsIm9iamVjdCIsImxpc3Rfdmlld3NfaWRfbWFwcyIsIl9maWVsZG5hbWVzIiwiaGFzUmVjZW50VmlldyIsImludGVybmFsX2xpc3RfdmlldyIsIm9ial9saXN0X3ZpZXdzIiwidHJpZ2dlcnMiLCJwZXJtaXNzaW9ucyIsIm93bmVyIiwiaW5zZXJ0IiwibGlzdF92aWV3IiwibmV3X2lkIiwib2xkX2lkIiwiaXNSZWNlbnRWaWV3IiwiaXNBbGxWaWV3IiwiJHNldCIsIiR1bnNldCIsInVwZGF0ZSIsInJlbW92ZSIsImNvbnRhaW5zIiwiZGlyZWN0IiwidHJpZ2dlciIsInJlcGxhY2UiLCJSZWdFeHAiLCJpc19lbmFibGUiLCJhY3Rpb24iLCJpbXBvcnRfYXBwX3BhY2thZ2UiLCJpbXBfZGF0YSIsImZyb21fdGVtcGxhdGUiLCJhcHBzX2lkX21hcHMiLCJpbXBfYXBwX2lkcyIsImltcF9vYmplY3RfbmFtZXMiLCJvYmplY3RfbmFtZXMiLCJwZXJtaXNzaW9uX3NldF9pZF9tYXBzIiwicGVybWlzc2lvbl9zZXRfaWRzIiwiRXJyb3IiLCJjaGVjayIsIk9iamVjdCIsInBsdWNrIiwiYXBwIiwiaW5jbHVkZSIsImtleXMiLCJpc0xlZ2FsVmVyc2lvbiIsImlzU3RyaW5nIiwiYXNzaWduZWRfYXBwcyIsImFwcF9pZCIsInBlcm1pc3Npb25fb2JqZWN0IiwicGVybWlzc2lvbl9zZXRfaWQiLCJyZXBvcnQiLCJpc19jcmVhdG9yIiwiX2xpc3RfdmlldyIsInBlcm1pc3Npb25fc2V0X3VzZXJzIiwidXNlcnMiLCJ1c2VyX2lkIiwiZGlzYWJsZWRfbGlzdF92aWV3cyIsImxpc3Rfdmlld19pZCIsIm5ld192aWV3X2lkIiwibWV0aG9kcyIsImNvbGxlY3Rpb24iLCJuYW1lX2ZpZWxkX2tleSIsInF1ZXJ5IiwicXVlcnlfb3B0aW9ucyIsInJlY29yZHMiLCJyZWYiLCJyZWYxIiwicmVzdWx0cyIsInNlYXJjaFRleHRRdWVyeSIsInNlbGVjdGVkIiwic29ydCIsImdldE9iamVjdCIsIk5BTUVfRklFTERfS0VZIiwic2VhcmNoVGV4dCIsIiRyZWdleCIsInZhbHVlcyIsIiRvciIsIiRpbiIsImV4dGVuZCIsIiRuaW4iLCJkYiIsImZpbHRlclF1ZXJ5IiwibGltaXQiLCJpc09iamVjdCIsImZpbmQiLCJmZXRjaCIsInJlZjIiLCJpc0VtcHR5IiwiZ2V0QXBwT2JqZWN0cyIsImdldE9iamVjdHNMaXN0Vmlld3MiLCJnZXRPYmplY3RzUGVybWlzc2lvbk9iamVjdHMiLCJnZXRPYmplY3RzUGVybWlzc2lvblNldCIsImdldE9iamVjdHNSZXBvcnRzIiwiYXBwT2JqZWN0cyIsIm9iamVjdHNfbmFtZSIsIm9iamVjdHNMaXN0Vmlld3MiLCJzaGFyZWQiLCJvYmplY3RzUmVwb3J0cyIsIm9iamVjdHNQZXJtaXNzaW9uT2JqZWN0cyIsIm9iamVjdHNQZXJtaXNzaW9uU2V0IiwiX29iamVjdHMiLCJfb2JqZWN0c19saXN0X3ZpZXdzIiwiX29iamVjdHNfcGVybWlzc2lvbl9vYmplY3RzIiwiX29iamVjdHNfcGVybWlzc2lvbl9zZXQiLCJfb2JqZWN0c19yZXBvcnRzIiwiYXBwSWQiLCJjb25jYXQiLCJ1bmlxIiwiaWdub3JlX2ZpZWxkcyIsImNyZWF0ZWQiLCJjcmVhdGVkX2J5IiwibW9kaWZpZWQiLCJtb2RpZmllZF9ieSIsImlzX2RlbGV0ZWQiLCJpbnN0YW5jZXMiLCJzaGFyaW5nIiwiZXhwb3J0T2JqZWN0IiwiX29iaiIsInYiLCJrZXkiLCJfdHJpZ2dlciIsImlzRnVuY3Rpb24iLCJ0b1N0cmluZyIsIl90b2RvIiwiX2FjdGlvbiIsIl9maWVsZCIsIl9mbyIsIl9vMSIsInJlZ0V4IiwiX3JlZ0V4IiwiX29wdGlvbnNGdW5jdGlvbiIsIl9yZWZlcmVuY2VfdG8iLCJjcmVhdGVGdW5jdGlvbiIsIl9jcmVhdGVGdW5jdGlvbiIsImRlZmF1bHRWYWx1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LGdCQUFZbk4sY0FBWixHQUE2QjFCLFFBQVEyRSxhQUFSLENBQXNCLGdCQUF0QixFQUF3QzhHLElBQXhDLENBQTZDO0FBQUM1RyxXQUFLO0FBQUNxRyxhQUFLakgsT0FBT3ZDO0FBQWI7QUFBTixLQUE3QyxFQUFrRjtBQUFDcEIsY0FBUTJNO0FBQVQsS0FBbEYsRUFBMkd2QixLQUEzRyxFQUE3QjtBQytCQzs7QUQ3QkYsTUFBRzdLLEVBQUVrRixPQUFGLENBQVU5QixPQUFPdEMsa0JBQWpCLEtBQXdDc0MsT0FBT3RDLGtCQUFQLENBQTBCcUUsTUFBMUIsR0FBbUMsQ0FBOUU7QUFDQzZJLGdCQUFZbE4sa0JBQVosR0FBaUMzQixRQUFRMkUsYUFBUixDQUFzQixvQkFBdEIsRUFBNEM4RyxJQUE1QyxDQUFpRDtBQUFDNUcsV0FBSztBQUFDcUcsYUFBS2pILE9BQU90QztBQUFiO0FBQU4sS0FBakQsRUFBMEY7QUFBQ3JCLGNBQVEyTTtBQUFULEtBQTFGLEVBQW1IdkIsS0FBbkgsRUFBakM7QUNxQ0M7O0FEbkNGLE1BQUc3SyxFQUFFa0YsT0FBRixDQUFVOUIsT0FBT3JDLE9BQWpCLEtBQTZCcUMsT0FBT3JDLE9BQVAsQ0FBZW9FLE1BQWYsR0FBd0IsQ0FBeEQ7QUFDQzZJLGdCQUFZak4sT0FBWixHQUFzQjVCLFFBQVEyRSxhQUFSLENBQXNCLFNBQXRCLEVBQWlDOEcsSUFBakMsQ0FBc0M7QUFBQzVHLFdBQUs7QUFBQ3FHLGFBQUtqSCxPQUFPckM7QUFBYjtBQUFOLEtBQXRDLEVBQW9FO0FBQUN0QixjQUFRMk07QUFBVCxLQUFwRSxFQUE2RnZCLEtBQTdGLEVBQXRCO0FDMkNDOztBRHpDRixTQUFPbUQsV0FBUDtBQW5Db0IsQ0FBckIsQyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19hcHBsaWNhdGlvbi1wYWNrYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiQ3JlYXRvci5PYmplY3RzLmFwcGxpY2F0aW9uX3BhY2thZ2UgPVxyXG5cdG5hbWU6IFwiYXBwbGljYXRpb25fcGFja2FnZVwiXHJcblx0aWNvbjogXCJjdXN0b20uY3VzdG9tNDJcIlxyXG5cdGxhYmVsOiBcIui9r+S7tuWMhVwiXHJcblx0ZmllbGRzOlxyXG5cdFx0bmFtZTpcclxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcclxuXHRcdFx0bGFiZWw6IFwi5ZCN56ewXCJcclxuXHRcdGFwcHM6XHJcblx0XHRcdHR5cGU6IFwibG9va3VwXCJcclxuXHRcdFx0bGFiZWw6IFwi5bqU55SoXCJcclxuXHRcdFx0dHlwZTogXCJsb29rdXBcIlxyXG5cdFx0XHRyZWZlcmVuY2VfdG86IFwiYXBwc1wiXHJcblx0XHRcdG11bHRpcGxlOiB0cnVlXHJcblx0XHRcdG9wdGlvbnNGdW5jdGlvbjogKCktPlxyXG5cdFx0XHRcdF9vcHRpb25zID0gW11cclxuXHRcdFx0XHRfLmZvckVhY2ggQ3JlYXRvci5BcHBzLCAobywgayktPlxyXG5cdFx0XHRcdFx0X29wdGlvbnMucHVzaCB7bGFiZWw6IG8ubmFtZSwgdmFsdWU6IGssIGljb246IG8uaWNvbl9zbGRzfVxyXG5cdFx0XHRcdHJldHVybiBfb3B0aW9uc1xyXG5cdFx0b2JqZWN0czpcclxuXHRcdFx0dHlwZTogXCJsb29rdXBcIlxyXG5cdFx0XHRsYWJlbDogXCLlr7nosaFcIlxyXG5cdFx0XHRyZWZlcmVuY2VfdG86IFwib2JqZWN0c1wiXHJcblx0XHRcdG11bHRpcGxlOiB0cnVlXHJcblx0XHRcdG9wdGlvbnNGdW5jdGlvbjogKCktPlxyXG5cdFx0XHRcdF9vcHRpb25zID0gW11cclxuXHRcdFx0XHRfLmZvckVhY2ggQ3JlYXRvci5vYmplY3RzQnlOYW1lLCAobywgayktPlxyXG5cdFx0XHRcdFx0aWYgIW8uaGlkZGVuXHJcblx0XHRcdFx0XHRcdF9vcHRpb25zLnB1c2ggeyBsYWJlbDogby5sYWJlbCwgdmFsdWU6IGssIGljb246IG8uaWNvbiB9XHJcblx0XHRcdFx0cmV0dXJuIF9vcHRpb25zXHJcblxyXG5cdFx0bGlzdF92aWV3czpcclxuXHRcdFx0dHlwZTogXCJsb29rdXBcIlxyXG5cdFx0XHRsYWJlbDogXCLliJfooajop4blm75cIlxyXG5cdFx0XHRtdWx0aXBsZTogdHJ1ZVxyXG5cdFx0XHRyZWZlcmVuY2VfdG86IFwib2JqZWN0X2xpc3R2aWV3c1wiXHJcblx0XHRcdG9wdGlvbnNNZXRob2Q6IFwiY3JlYXRvci5saXN0dmlld3Nfb3B0aW9uc1wiXHJcblx0XHRwZXJtaXNzaW9uX3NldDpcclxuXHRcdFx0dHlwZTogXCJsb29rdXBcIlxyXG5cdFx0XHRsYWJlbDogXCLmnYPpmZDnu4RcIlxyXG5cdFx0XHRtdWx0aXBsZTogdHJ1ZVxyXG5cdFx0XHRyZWZlcmVuY2VfdG86IFwicGVybWlzc2lvbl9zZXRcIlxyXG5cdFx0cGVybWlzc2lvbl9vYmplY3RzOlxyXG5cdFx0XHR0eXBlOiBcImxvb2t1cFwiXHJcblx0XHRcdGxhYmVsOiBcIuadg+mZkOmbhlwiXHJcblx0XHRcdG11bHRpcGxlOiB0cnVlXHJcblx0XHRcdHJlZmVyZW5jZV90bzogXCJwZXJtaXNzaW9uX29iamVjdHNcIlxyXG5cdFx0cmVwb3J0czpcclxuXHRcdFx0dHlwZTogXCJsb29rdXBcIlxyXG5cdFx0XHRsYWJlbDogXCLmiqXooahcIlxyXG5cdFx0XHRtdWx0aXBsZTogdHJ1ZVxyXG5cdFx0XHRyZWZlcmVuY2VfdG86IFwicmVwb3J0c1wiXHJcblx0bGlzdF92aWV3czpcclxuXHRcdGFsbDpcclxuXHRcdFx0bGFiZWw6IFwi5omA5pyJXCJcclxuXHRcdFx0Y29sdW1uczogW1wibmFtZVwiXVxyXG5cdFx0XHRmaWx0ZXJfc2NvcGU6IFwic3BhY2VcIlxyXG5cdGFjdGlvbnM6XHJcblx0XHRpbml0X2RhdGE6XHJcblx0XHRcdGxhYmVsOiBcIuWIneWni+WMllwiXHJcblx0XHRcdHZpc2libGU6IHRydWVcclxuXHRcdFx0b246IFwicmVjb3JkXCJcclxuXHRcdFx0dG9kbzogKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIGZpZWxkcyktPlxyXG5cdFx0XHRcdGNvbnNvbGUubG9nKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIGZpZWxkcylcclxuXHRcdFx0XHRNZXRlb3IuY2FsbCBcImFwcFBhY2thZ2UuaW5pdF9leHBvcnRfZGF0YVwiLCBTZXNzaW9uLmdldChcInNwYWNlSWRcIiksIHJlY29yZF9pZCwoZXJyb3IsIHJlc3VsdCktPlxyXG5cdFx0XHRcdFx0aWYgZXJyb3JcclxuXHRcdFx0XHRcdFx0dG9hc3RyLmVycm9yKGVycm9yLnJlYXNvbilcclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0dG9hc3RyLnN1Y2Nlc3MoXCLliJ3lp4vljJblrozmiJBcIilcclxuXHRcdGV4cG9ydDpcclxuXHRcdFx0bGFiZWw6IFwi5a+85Ye6XCJcclxuXHRcdFx0dmlzaWJsZTogdHJ1ZVxyXG5cdFx0XHRvbjogXCJyZWNvcmRcIlxyXG5cdFx0XHR0b2RvOiAob2JqZWN0X25hbWUsIHJlY29yZF9pZCwgZmllbGRzKS0+XHJcblx0XHRcdFx0Y29uc29sZS5sb2coXCLlr7zlh7oje29iamVjdF9uYW1lfS0+I3tyZWNvcmRfaWR9XCIpXHJcblx0XHRcdFx0dXJsID0gU3RlZWRvcy5hYnNvbHV0ZVVybCBcIi9hcGkvY3JlYXRvci9hcHBfcGFja2FnZS9leHBvcnQvI3tTZXNzaW9uLmdldChcInNwYWNlSWRcIil9LyN7cmVjb3JkX2lkfVwiXHJcblx0XHRcdFx0d2luZG93Lm9wZW4odXJsKVxyXG4jXHRcdFx0XHQkLmFqYXhcclxuI1x0XHRcdFx0XHR0eXBlOiBcInBvc3RcIlxyXG4jXHRcdFx0XHRcdHVybDogdXJsXHJcbiNcdFx0XHRcdFx0ZGF0YVR5cGU6IFwianNvblwiXHJcbiNcdFx0XHRcdFx0YmVmb3JlU2VuZDogKHJlcXVlc3QpIC0+XHJcbiNcdFx0XHRcdFx0XHRyZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIoJ1gtVXNlci1JZCcsIE1ldGVvci51c2VySWQoKSlcclxuI1x0XHRcdFx0XHRcdHJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignWC1BdXRoLVRva2VuJywgQWNjb3VudHMuX3N0b3JlZExvZ2luVG9rZW4oKSlcclxuI1x0XHRcdFx0XHRlcnJvcjogKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgLT5cclxuI1x0XHRcdFx0XHRcdGVycm9yID0ganFYSFIucmVzcG9uc2VKU09OXHJcbiNcdFx0XHRcdFx0XHRjb25zb2xlLmVycm9yIGVycm9yXHJcbiNcdFx0XHRcdFx0XHRpZiBlcnJvcj8ucmVhc29uXHJcbiNcdFx0XHRcdFx0XHRcdHRvYXN0cj8uZXJyb3I/KFRBUGkxOG4uX18oZXJyb3IucmVhc29uKSlcclxuI1x0XHRcdFx0XHRcdGVsc2UgaWYgZXJyb3I/Lm1lc3NhZ2VcclxuI1x0XHRcdFx0XHRcdFx0dG9hc3RyPy5lcnJvcj8oVEFQaTE4bi5fXyhlcnJvci5tZXNzYWdlKSlcclxuI1x0XHRcdFx0XHRcdGVsc2VcclxuI1x0XHRcdFx0XHRcdFx0dG9hc3RyPy5lcnJvcj8oZXJyb3IpXHJcbiNcdFx0XHRcdFx0c3VjY2VzczogKHJlc3VsdCkgLT5cclxuI1x0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwicmVzdWx0Li4uLi4uLi4uLi4uLi4uLi4uLiN7cmVzdWx0fVwiKVxyXG5cclxuXHRcdGltcG9ydDpcclxuXHRcdFx0bGFiZWw6IFwi5a+85YWlXCJcclxuXHRcdFx0dmlzaWJsZTogdHJ1ZVxyXG5cdFx0XHRvbjogXCJsaXN0XCJcclxuXHRcdFx0dG9kbzogKG9iamVjdF9uYW1lKS0+XHJcblx0XHRcdFx0Y29uc29sZS5sb2coXCJvYmplY3RfbmFtZVwiLCBvYmplY3RfbmFtZSlcclxuXHRcdFx0XHRNb2RhbC5zaG93KFwiQVBQYWNrYWdlSW1wb3J0TW9kYWxcIilcclxuIiwiQ3JlYXRvci5PYmplY3RzLmFwcGxpY2F0aW9uX3BhY2thZ2UgPSB7XG4gIG5hbWU6IFwiYXBwbGljYXRpb25fcGFja2FnZVwiLFxuICBpY29uOiBcImN1c3RvbS5jdXN0b200MlwiLFxuICBsYWJlbDogXCLova/ku7bljIVcIixcbiAgZmllbGRzOiB7XG4gICAgbmFtZToge1xuICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICBsYWJlbDogXCLlkI3np7BcIlxuICAgIH0sXG4gICAgYXBwczoge1xuICAgICAgdHlwZTogXCJsb29rdXBcIixcbiAgICAgIGxhYmVsOiBcIuW6lOeUqFwiLFxuICAgICAgdHlwZTogXCJsb29rdXBcIixcbiAgICAgIHJlZmVyZW5jZV90bzogXCJhcHBzXCIsXG4gICAgICBtdWx0aXBsZTogdHJ1ZSxcbiAgICAgIG9wdGlvbnNGdW5jdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBfb3B0aW9ucztcbiAgICAgICAgX29wdGlvbnMgPSBbXTtcbiAgICAgICAgXy5mb3JFYWNoKENyZWF0b3IuQXBwcywgZnVuY3Rpb24obywgaykge1xuICAgICAgICAgIHJldHVybiBfb3B0aW9ucy5wdXNoKHtcbiAgICAgICAgICAgIGxhYmVsOiBvLm5hbWUsXG4gICAgICAgICAgICB2YWx1ZTogayxcbiAgICAgICAgICAgIGljb246IG8uaWNvbl9zbGRzXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gX29wdGlvbnM7XG4gICAgICB9XG4gICAgfSxcbiAgICBvYmplY3RzOiB7XG4gICAgICB0eXBlOiBcImxvb2t1cFwiLFxuICAgICAgbGFiZWw6IFwi5a+56LGhXCIsXG4gICAgICByZWZlcmVuY2VfdG86IFwib2JqZWN0c1wiLFxuICAgICAgbXVsdGlwbGU6IHRydWUsXG4gICAgICBvcHRpb25zRnVuY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX29wdGlvbnM7XG4gICAgICAgIF9vcHRpb25zID0gW107XG4gICAgICAgIF8uZm9yRWFjaChDcmVhdG9yLm9iamVjdHNCeU5hbWUsIGZ1bmN0aW9uKG8sIGspIHtcbiAgICAgICAgICBpZiAoIW8uaGlkZGVuKSB7XG4gICAgICAgICAgICByZXR1cm4gX29wdGlvbnMucHVzaCh7XG4gICAgICAgICAgICAgIGxhYmVsOiBvLmxhYmVsLFxuICAgICAgICAgICAgICB2YWx1ZTogayxcbiAgICAgICAgICAgICAgaWNvbjogby5pY29uXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gX29wdGlvbnM7XG4gICAgICB9XG4gICAgfSxcbiAgICBsaXN0X3ZpZXdzOiB7XG4gICAgICB0eXBlOiBcImxvb2t1cFwiLFxuICAgICAgbGFiZWw6IFwi5YiX6KGo6KeG5Zu+XCIsXG4gICAgICBtdWx0aXBsZTogdHJ1ZSxcbiAgICAgIHJlZmVyZW5jZV90bzogXCJvYmplY3RfbGlzdHZpZXdzXCIsXG4gICAgICBvcHRpb25zTWV0aG9kOiBcImNyZWF0b3IubGlzdHZpZXdzX29wdGlvbnNcIlxuICAgIH0sXG4gICAgcGVybWlzc2lvbl9zZXQ6IHtcbiAgICAgIHR5cGU6IFwibG9va3VwXCIsXG4gICAgICBsYWJlbDogXCLmnYPpmZDnu4RcIixcbiAgICAgIG11bHRpcGxlOiB0cnVlLFxuICAgICAgcmVmZXJlbmNlX3RvOiBcInBlcm1pc3Npb25fc2V0XCJcbiAgICB9LFxuICAgIHBlcm1pc3Npb25fb2JqZWN0czoge1xuICAgICAgdHlwZTogXCJsb29rdXBcIixcbiAgICAgIGxhYmVsOiBcIuadg+mZkOmbhlwiLFxuICAgICAgbXVsdGlwbGU6IHRydWUsXG4gICAgICByZWZlcmVuY2VfdG86IFwicGVybWlzc2lvbl9vYmplY3RzXCJcbiAgICB9LFxuICAgIHJlcG9ydHM6IHtcbiAgICAgIHR5cGU6IFwibG9va3VwXCIsXG4gICAgICBsYWJlbDogXCLmiqXooahcIixcbiAgICAgIG11bHRpcGxlOiB0cnVlLFxuICAgICAgcmVmZXJlbmNlX3RvOiBcInJlcG9ydHNcIlxuICAgIH1cbiAgfSxcbiAgbGlzdF92aWV3czoge1xuICAgIGFsbDoge1xuICAgICAgbGFiZWw6IFwi5omA5pyJXCIsXG4gICAgICBjb2x1bW5zOiBbXCJuYW1lXCJdLFxuICAgICAgZmlsdGVyX3Njb3BlOiBcInNwYWNlXCJcbiAgICB9XG4gIH0sXG4gIGFjdGlvbnM6IHtcbiAgICBpbml0X2RhdGE6IHtcbiAgICAgIGxhYmVsOiBcIuWIneWni+WMllwiLFxuICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgIG9uOiBcInJlY29yZFwiLFxuICAgICAgdG9kbzogZnVuY3Rpb24ob2JqZWN0X25hbWUsIHJlY29yZF9pZCwgZmllbGRzKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIGZpZWxkcyk7XG4gICAgICAgIHJldHVybiBNZXRlb3IuY2FsbChcImFwcFBhY2thZ2UuaW5pdF9leHBvcnRfZGF0YVwiLCBTZXNzaW9uLmdldChcInNwYWNlSWRcIiksIHJlY29yZF9pZCwgZnVuY3Rpb24oZXJyb3IsIHJlc3VsdCkge1xuICAgICAgICAgIGlmIChlcnJvcikge1xuICAgICAgICAgICAgcmV0dXJuIHRvYXN0ci5lcnJvcihlcnJvci5yZWFzb24pO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdG9hc3RyLnN1Y2Nlc3MoXCLliJ3lp4vljJblrozmiJBcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9LFxuICAgIFwiZXhwb3J0XCI6IHtcbiAgICAgIGxhYmVsOiBcIuWvvOWHulwiLFxuICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgIG9uOiBcInJlY29yZFwiLFxuICAgICAgdG9kbzogZnVuY3Rpb24ob2JqZWN0X25hbWUsIHJlY29yZF9pZCwgZmllbGRzKSB7XG4gICAgICAgIHZhciB1cmw7XG4gICAgICAgIGNvbnNvbGUubG9nKFwi5a+85Ye6XCIgKyBvYmplY3RfbmFtZSArIFwiLT5cIiArIHJlY29yZF9pZCk7XG4gICAgICAgIHVybCA9IFN0ZWVkb3MuYWJzb2x1dGVVcmwoXCIvYXBpL2NyZWF0b3IvYXBwX3BhY2thZ2UvZXhwb3J0L1wiICsgKFNlc3Npb24uZ2V0KFwic3BhY2VJZFwiKSkgKyBcIi9cIiArIHJlY29yZF9pZCk7XG4gICAgICAgIHJldHVybiB3aW5kb3cub3Blbih1cmwpO1xuICAgICAgfVxuICAgIH0sXG4gICAgXCJpbXBvcnRcIjoge1xuICAgICAgbGFiZWw6IFwi5a+85YWlXCIsXG4gICAgICB2aXNpYmxlOiB0cnVlLFxuICAgICAgb246IFwibGlzdFwiLFxuICAgICAgdG9kbzogZnVuY3Rpb24ob2JqZWN0X25hbWUpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJvYmplY3RfbmFtZVwiLCBvYmplY3RfbmFtZSk7XG4gICAgICAgIHJldHVybiBNb2RhbC5zaG93KFwiQVBQYWNrYWdlSW1wb3J0TW9kYWxcIik7XG4gICAgICB9XG4gICAgfVxuICB9XG59O1xuIiwiSnNvblJvdXRlcy5hZGQgJ2dldCcsICcvYXBpL2NyZWF0b3IvYXBwX3BhY2thZ2UvZXhwb3J0LzpzcGFjZV9pZC86cmVjb3JkX2lkJywgKHJlcSwgcmVzLCBuZXh0KSAtPlxyXG5cdHRyeVxyXG5cclxuXHRcdHVzZXJJZCA9IFN0ZWVkb3MuZ2V0VXNlcklkRnJvbUF1dGhUb2tlbihyZXEsIHJlcyk7XHJcblxyXG5cdFx0aWYgIXVzZXJJZFxyXG5cdFx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLCB7XHJcblx0XHRcdFx0Y29kZTogNDAxXHJcblx0XHRcdFx0ZGF0YToge2Vycm9yczogXCJBdXRoZW50aWNhdGlvbiBpcyByZXF1aXJlZCBhbmQgaGFzIG5vdCBiZWVuIHByb3ZpZGVkLlwifVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVyblxyXG5cclxuXHRcdHJlY29yZF9pZCA9IHJlcS5wYXJhbXMucmVjb3JkX2lkXHJcblx0XHRzcGFjZV9pZCA9IHJlcS5wYXJhbXMuc3BhY2VfaWRcclxuXHJcblx0XHRpZiAhQ3JlYXRvci5pc1NwYWNlQWRtaW4oc3BhY2VfaWQsIHVzZXJJZClcclxuXHRcdFx0SnNvblJvdXRlcy5zZW5kUmVzdWx0IHJlcywge1xyXG5cdFx0XHRcdGNvZGU6IDQwMVxyXG5cdFx0XHRcdGRhdGE6IHtlcnJvcnM6IFwiUGVybWlzc2lvbiBkZW5pZWRcIn1cclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm5cclxuXHJcblx0XHRyZWNvcmQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJhcHBsaWNhdGlvbl9wYWNrYWdlXCIpLmZpbmRPbmUoe19pZDogcmVjb3JkX2lkfSlcclxuXHJcblx0XHRpZiAhcmVjb3JkXHJcblx0XHRcdEpzb25Sb3V0ZXMuc2VuZFJlc3VsdCByZXMsIHtcclxuXHRcdFx0XHRjb2RlOiA0MDRcclxuXHRcdFx0XHRkYXRhOiB7ZXJyb3JzOiBcIkNvbGxlY3Rpb24gbm90IGZvdW5kIGZvciB0aGUgc2VnbWVudCAje3JlY29yZF9pZH1cIn1cclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm5cclxuXHJcblx0XHRzcGFjZV91c2VyID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwic3BhY2VfdXNlcnNcIikuZmluZE9uZSh7dXNlcjogdXNlcklkLCBzcGFjZTogcmVjb3JkLnNwYWNlfSlcclxuXHJcblx0XHRpZiAhc3BhY2VfdXNlclxyXG5cdFx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLCB7XHJcblx0XHRcdFx0Y29kZTogNDAxXHJcblx0XHRcdFx0ZGF0YToge2Vycm9yczogXCJVc2VyIGRvZXMgbm90IGhhdmUgcHJpdmlsZWdlcyB0byBhY2Nlc3MgdGhlIGVudGl0eVwifVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVyblxyXG5cclxuXHRcdGRhdGEgPSBBUFRyYW5zZm9ybS5leHBvcnQgcmVjb3JkXHJcblxyXG5cdFx0ZGF0YS5kYXRhU291cmNlID0gTWV0ZW9yLmFic29sdXRlVXJsKFwiYXBpL2NyZWF0b3IvYXBwX3BhY2thZ2UvZXhwb3J0LyN7c3BhY2VfaWR9LyN7cmVjb3JkX2lkfVwiKVxyXG5cclxuXHRcdGZpbGVOYW1lID0gcmVjb3JkLm5hbWUgfHwgXCJhcHBsaWNhdGlvbl9wYWNrYWdlXCJcclxuXHJcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC1tc2Rvd25sb2FkJyk7XHJcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgJ2F0dGFjaG1lbnQ7ZmlsZW5hbWU9JytlbmNvZGVVUkkoZmlsZU5hbWUpKycuanNvbicpO1xyXG5cdFx0cmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhLCBudWxsLCA0KSlcclxuXHRjYXRjaCBlXHJcblx0XHRjb25zb2xlLmVycm9yIGUuc3RhY2tcclxuXHRcdEpzb25Sb3V0ZXMuc2VuZFJlc3VsdCByZXMsIHtcclxuXHRcdFx0Y29kZTogMjAwXHJcblx0XHRcdGRhdGE6IHsgZXJyb3JzOiBlLnJlYXNvbiB8fCBlLm1lc3NhZ2UgfVxyXG5cdFx0fVxyXG5cclxuIiwiSnNvblJvdXRlcy5hZGQoJ2dldCcsICcvYXBpL2NyZWF0b3IvYXBwX3BhY2thZ2UvZXhwb3J0LzpzcGFjZV9pZC86cmVjb3JkX2lkJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgdmFyIGRhdGEsIGUsIGZpbGVOYW1lLCByZWNvcmQsIHJlY29yZF9pZCwgc3BhY2VfaWQsIHNwYWNlX3VzZXIsIHVzZXJJZDtcbiAgdHJ5IHtcbiAgICB1c2VySWQgPSBTdGVlZG9zLmdldFVzZXJJZEZyb21BdXRoVG9rZW4ocmVxLCByZXMpO1xuICAgIGlmICghdXNlcklkKSB7XG4gICAgICBKc29uUm91dGVzLnNlbmRSZXN1bHQocmVzLCB7XG4gICAgICAgIGNvZGU6IDQwMSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGVycm9yczogXCJBdXRoZW50aWNhdGlvbiBpcyByZXF1aXJlZCBhbmQgaGFzIG5vdCBiZWVuIHByb3ZpZGVkLlwiXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZWNvcmRfaWQgPSByZXEucGFyYW1zLnJlY29yZF9pZDtcbiAgICBzcGFjZV9pZCA9IHJlcS5wYXJhbXMuc3BhY2VfaWQ7XG4gICAgaWYgKCFDcmVhdG9yLmlzU3BhY2VBZG1pbihzcGFjZV9pZCwgdXNlcklkKSkge1xuICAgICAgSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgICBjb2RlOiA0MDEsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBlcnJvcnM6IFwiUGVybWlzc2lvbiBkZW5pZWRcIlxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVjb3JkID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiYXBwbGljYXRpb25fcGFja2FnZVwiKS5maW5kT25lKHtcbiAgICAgIF9pZDogcmVjb3JkX2lkXG4gICAgfSk7XG4gICAgaWYgKCFyZWNvcmQpIHtcbiAgICAgIEpzb25Sb3V0ZXMuc2VuZFJlc3VsdChyZXMsIHtcbiAgICAgICAgY29kZTogNDA0LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgZXJyb3JzOiBcIkNvbGxlY3Rpb24gbm90IGZvdW5kIGZvciB0aGUgc2VnbWVudCBcIiArIHJlY29yZF9pZFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3BhY2VfdXNlciA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInNwYWNlX3VzZXJzXCIpLmZpbmRPbmUoe1xuICAgICAgdXNlcjogdXNlcklkLFxuICAgICAgc3BhY2U6IHJlY29yZC5zcGFjZVxuICAgIH0pO1xuICAgIGlmICghc3BhY2VfdXNlcikge1xuICAgICAgSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgICBjb2RlOiA0MDEsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBlcnJvcnM6IFwiVXNlciBkb2VzIG5vdCBoYXZlIHByaXZpbGVnZXMgdG8gYWNjZXNzIHRoZSBlbnRpdHlcIlxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGF0YSA9IEFQVHJhbnNmb3JtW1wiZXhwb3J0XCJdKHJlY29yZCk7XG4gICAgZGF0YS5kYXRhU291cmNlID0gTWV0ZW9yLmFic29sdXRlVXJsKFwiYXBpL2NyZWF0b3IvYXBwX3BhY2thZ2UvZXhwb3J0L1wiICsgc3BhY2VfaWQgKyBcIi9cIiArIHJlY29yZF9pZCk7XG4gICAgZmlsZU5hbWUgPSByZWNvcmQubmFtZSB8fCBcImFwcGxpY2F0aW9uX3BhY2thZ2VcIjtcbiAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC1tc2Rvd25sb2FkJyk7XG4gICAgcmVzLnNldEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsICdhdHRhY2htZW50O2ZpbGVuYW1lPScgKyBlbmNvZGVVUkkoZmlsZU5hbWUpICsgJy5qc29uJyk7XG4gICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgNCkpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGUgPSBlcnJvcjtcbiAgICBjb25zb2xlLmVycm9yKGUuc3RhY2spO1xuICAgIHJldHVybiBKc29uUm91dGVzLnNlbmRSZXN1bHQocmVzLCB7XG4gICAgICBjb2RlOiAyMDAsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIGVycm9yczogZS5yZWFzb24gfHwgZS5tZXNzYWdlXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn0pO1xuIiwidHJhbnNmb3JtRmlsdGVycyA9IChmaWx0ZXJzKS0+XHJcblx0X2ZpbHRlcnMgPSBbXVxyXG5cdF8uZWFjaCBmaWx0ZXJzLCAoZiktPlxyXG5cdFx0aWYgXy5pc0FycmF5KGYpICYmIGYubGVuZ3RoID09IDNcclxuXHRcdFx0X2ZpbHRlcnMucHVzaCB7ZmllbGQ6IGZbMF0sIG9wZXJhdGlvbjogZlsxXSwgdmFsdWU6IGZbMl19XHJcblx0XHRlbHNlXHJcblx0XHRcdF9maWx0ZXJzLnB1c2ggZlxyXG5cdHJldHVybiBfZmlsdGVyc1xyXG5cclxudHJhbnNmb3JtRmllbGRPcHRpb25zID0gKG9wdGlvbnMpLT5cclxuXHRpZiAhXy5pc0FycmF5KG9wdGlvbnMpXHJcblx0XHRyZXR1cm4gb3B0aW9uc1xyXG5cclxuXHRfb3B0aW9ucyA9IFtdXHJcblxyXG5cdF8uZWFjaCBvcHRpb25zLCAobyktPlxyXG5cdFx0aWYgbyAmJiBfLmhhcyhvLCAnbGFiZWwnKSAmJiBfLmhhcyhvLCAndmFsdWUnKVxyXG5cdFx0XHRfb3B0aW9ucy5wdXNoIFwiI3tvLmxhYmVsfToje28udmFsdWV9XCJcclxuXHJcblx0cmV0dXJuIF9vcHRpb25zLmpvaW4oJywnKVxyXG5cclxuXHJcbkNyZWF0b3IuaW1wb3J0T2JqZWN0ID0gKHVzZXJJZCwgc3BhY2VfaWQsIG9iamVjdCwgbGlzdF92aWV3c19pZF9tYXBzKSAtPlxyXG5cdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS1pbXBvcnRPYmplY3QtLS0tLS0tLS0tLS0tLS0tLS0nLCBvYmplY3QubmFtZSlcclxuXHRmaWVsZHMgPSBvYmplY3QuZmllbGRzXHJcblx0dHJpZ2dlcnMgPSBvYmplY3QudHJpZ2dlcnNcclxuXHRhY3Rpb25zID0gb2JqZWN0LmFjdGlvbnNcclxuXHRvYmpfbGlzdF92aWV3cyA9IG9iamVjdC5saXN0X3ZpZXdzXHJcblxyXG5cdGRlbGV0ZSBvYmplY3QuX2lkXHJcblx0ZGVsZXRlIG9iamVjdC5maWVsZHNcclxuXHRkZWxldGUgb2JqZWN0LnRyaWdnZXJzXHJcblx0ZGVsZXRlIG9iamVjdC5hY3Rpb25zXHJcblx0ZGVsZXRlIG9iamVjdC5wZXJtaXNzaW9ucyAj5Yig6ZmkcGVybWlzc2lvbnPliqjmgIHlsZ7mgKdcclxuXHRkZWxldGUgb2JqZWN0Lmxpc3Rfdmlld3NcclxuXHJcblx0b2JqZWN0LnNwYWNlID0gc3BhY2VfaWRcclxuXHRvYmplY3Qub3duZXIgPSB1c2VySWRcclxuXHJcblx0Q3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0c1wiKS5pbnNlcnQob2JqZWN0KVxyXG5cclxuXHQjIDIuMSDmjIHkuYXljJblr7nosaFsaXN0X3ZpZXdzXHJcblx0aW50ZXJuYWxfbGlzdF92aWV3ID0ge31cclxuXHJcblx0aGFzUmVjZW50VmlldyA9IGZhbHNlXHJcblx0Y29uc29sZS5sb2coJ+aMgeS5heWMluWvueixoWxpc3Rfdmlld3MnKTtcclxuXHRfLmVhY2ggb2JqX2xpc3Rfdmlld3MsIChsaXN0X3ZpZXcpLT5cclxuXHRcdG9sZF9pZCA9IGxpc3Rfdmlldy5faWRcclxuXHRcdGRlbGV0ZSBsaXN0X3ZpZXcuX2lkXHJcblx0XHRsaXN0X3ZpZXcuc3BhY2UgPSBzcGFjZV9pZFxyXG5cdFx0bGlzdF92aWV3Lm93bmVyID0gdXNlcklkXHJcblx0XHRsaXN0X3ZpZXcub2JqZWN0X25hbWUgPSBvYmplY3QubmFtZVxyXG5cdFx0aWYgQ3JlYXRvci5pc1JlY2VudFZpZXcobGlzdF92aWV3KVxyXG5cdFx0XHRoYXNSZWNlbnRWaWV3ID0gdHJ1ZVxyXG5cclxuXHRcdGlmIGxpc3Rfdmlldy5maWx0ZXJzXHJcblx0XHRcdGxpc3Rfdmlldy5maWx0ZXJzID0gdHJhbnNmb3JtRmlsdGVycyhsaXN0X3ZpZXcuZmlsdGVycylcclxuXHJcblx0XHRpZiBDcmVhdG9yLmlzQWxsVmlldyhsaXN0X3ZpZXcpIHx8IENyZWF0b3IuaXNSZWNlbnRWaWV3KGxpc3RfdmlldylcclxuXHQjIOWIm+W7um9iamVjdOaXtu+8jOS8muiHquWKqOa3u+WKoGFsbCB2aWV344CBcmVjZW50IHZpZXdcclxuXHJcblx0XHRcdG9wdGlvbnMgPSB7JHNldDogbGlzdF92aWV3fVxyXG5cclxuXHRcdFx0aWYgIWxpc3Rfdmlldy5jb2x1bW5zXHJcblx0XHRcdFx0b3B0aW9ucy4kdW5zZXQgPSB7Y29sdW1uczogJyd9XHJcblxyXG5cdFx0XHRDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfbGlzdHZpZXdzXCIpLnVwZGF0ZSh7b2JqZWN0X25hbWU6IG9iamVjdC5uYW1lLCBuYW1lOiBsaXN0X3ZpZXcubmFtZSwgc3BhY2U6IHNwYWNlX2lkfSwgb3B0aW9ucylcclxuXHRcdGVsc2VcclxuXHRcdFx0bmV3X2lkID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS5pbnNlcnQobGlzdF92aWV3KVxyXG5cdFx0XHRsaXN0X3ZpZXdzX2lkX21hcHNbb2JqZWN0Lm5hbWUgKyBcIl9cIiArIG9sZF9pZF0gPSBuZXdfaWRcclxuXHJcblx0aWYgIWhhc1JlY2VudFZpZXdcclxuXHRcdENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikucmVtb3ZlKHtuYW1lOiBcInJlY2VudFwiLCBzcGFjZTogc3BhY2VfaWQsIG9iamVjdF9uYW1lOiBvYmplY3QubmFtZSwgb3duZXI6IHVzZXJJZH0pXHJcblx0Y29uc29sZS5sb2coJ+aMgeS5heWMluWvueixoeWtl+autScpO1xyXG5cdCMgMi4yIOaMgeS5heWMluWvueixoeWtl+autVxyXG5cclxuXHRfZmllbGRuYW1lcyA9IFtdXHJcblxyXG5cdF8uZWFjaCBmaWVsZHMsIChmaWVsZCwgayktPlxyXG5cdFx0ZGVsZXRlIGZpZWxkLl9pZFxyXG5cdFx0ZmllbGQuc3BhY2UgPSBzcGFjZV9pZFxyXG5cdFx0ZmllbGQub3duZXIgPSB1c2VySWRcclxuXHRcdGZpZWxkLm9iamVjdCA9IG9iamVjdC5uYW1lXHJcblxyXG5cdFx0aWYgZmllbGQub3B0aW9uc1xyXG5cdFx0XHRmaWVsZC5vcHRpb25zID0gdHJhbnNmb3JtRmllbGRPcHRpb25zKGZpZWxkLm9wdGlvbnMpXHJcblxyXG5cdFx0aWYgIV8uaGFzKGZpZWxkLCBcIm5hbWVcIilcclxuXHRcdFx0ZmllbGQubmFtZSA9IGtcclxuXHJcblx0XHRfZmllbGRuYW1lcy5wdXNoIGZpZWxkLm5hbWVcclxuXHJcblx0XHRpZiBmaWVsZC5uYW1lID09IFwibmFtZVwiXHJcblx0XHRcdCMg5Yib5bu6b2JqZWN05pe277yM5Lya6Ieq5Yqo5re75YqgbmFtZeWtl+aute+8jOWboOatpOWcqOatpOWkhOWvuW5hbWXlrZfmrrXov5vooYzmm7TmlrBcclxuXHRcdFx0Q3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2ZpZWxkc1wiKS51cGRhdGUoe29iamVjdDogb2JqZWN0Lm5hbWUsIG5hbWU6IFwibmFtZVwiLCBzcGFjZTogc3BhY2VfaWR9LCB7JHNldDogZmllbGR9KVxyXG5cdFx0ZWxzZVxyXG5cdFx0XHRDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfZmllbGRzXCIpLmluc2VydChmaWVsZClcclxuXHJcblx0XHRpZiAhXy5jb250YWlucyhfZmllbGRuYW1lcywgJ25hbWUnKVxyXG5cdFx0XHRDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfZmllbGRzXCIpLmRpcmVjdC5yZW1vdmUoe29iamVjdDogb2JqZWN0Lm5hbWUsIG5hbWU6IFwibmFtZVwiLCBzcGFjZTogc3BhY2VfaWR9KVxyXG5cclxuXHRjb25zb2xlLmxvZygn5oyB5LmF5YyW6Kem5Y+R5ZmoJyk7XHJcblx0IyAyLjMg5oyB5LmF5YyW6Kem5Y+R5ZmoXHJcblx0Xy5lYWNoIHRyaWdnZXJzLCAodHJpZ2dlciwgayktPlxyXG5cdFx0ZGVsZXRlIHRyaWdnZXJzLl9pZFxyXG5cdFx0dHJpZ2dlci5zcGFjZSA9IHNwYWNlX2lkXHJcblx0XHR0cmlnZ2VyLm93bmVyID0gdXNlcklkXHJcblx0XHR0cmlnZ2VyLm9iamVjdCA9IG9iamVjdC5uYW1lXHJcblx0XHRpZiAhXy5oYXModHJpZ2dlciwgXCJuYW1lXCIpXHJcblx0XHRcdHRyaWdnZXIubmFtZSA9IGsucmVwbGFjZShuZXcgUmVnRXhwKFwiXFxcXC5cIiwgXCJnXCIpLCBcIl9cIilcclxuXHJcblx0XHRpZiAhXy5oYXModHJpZ2dlciwgXCJpc19lbmFibGVcIilcclxuXHRcdFx0dHJpZ2dlci5pc19lbmFibGUgPSB0cnVlXHJcblxyXG5cdFx0Q3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X3RyaWdnZXJzXCIpLmluc2VydCh0cmlnZ2VyKVxyXG5cdGNvbnNvbGUubG9nKCfmjIHkuYXljJbmk43kvZwnKTtcclxuXHQjIDIuNCDmjIHkuYXljJbmk43kvZxcclxuXHRfLmVhY2ggYWN0aW9ucywgKGFjdGlvbiwgayktPlxyXG5cdFx0ZGVsZXRlIGFjdGlvbi5faWRcclxuXHRcdGFjdGlvbi5zcGFjZSA9IHNwYWNlX2lkXHJcblx0XHRhY3Rpb24ub3duZXIgPSB1c2VySWRcclxuXHRcdGFjdGlvbi5vYmplY3QgPSBvYmplY3QubmFtZVxyXG5cdFx0aWYgIV8uaGFzKGFjdGlvbiwgXCJuYW1lXCIpXHJcblx0XHRcdGFjdGlvbi5uYW1lID0gay5yZXBsYWNlKG5ldyBSZWdFeHAoXCJcXFxcLlwiLCBcImdcIiksIFwiX1wiKVxyXG5cdFx0aWYgIV8uaGFzKGFjdGlvbiwgXCJpc19lbmFibGVcIilcclxuXHRcdFx0YWN0aW9uLmlzX2VuYWJsZSA9IHRydWVcclxuXHRcdENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9hY3Rpb25zXCIpLmluc2VydChhY3Rpb24pXHJcblxyXG5cdGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS1pbXBvcnRPYmplY3QgZW5kLS0tLS0tLS0tLS0tLS0tLS0tJywgb2JqZWN0Lm5hbWUpXHJcblxyXG5DcmVhdG9yLmltcG9ydF9hcHBfcGFja2FnZSA9ICh1c2VySWQsIHNwYWNlX2lkLCBpbXBfZGF0YSwgZnJvbV90ZW1wbGF0ZSktPlxyXG5cdGlmICF1c2VySWRcclxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI0MDFcIiwgXCJBdXRoZW50aWNhdGlvbiBpcyByZXF1aXJlZCBhbmQgaGFzIG5vdCBiZWVuIHByb3ZpZGVkLlwiKVxyXG5cclxuXHRpZiAhQ3JlYXRvci5pc1NwYWNlQWRtaW4oc3BhY2VfaWQsIHVzZXJJZClcclxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI0MDFcIiwgXCJQZXJtaXNzaW9uIGRlbmllZC5cIilcclxuXHJcblx0IyMj5pWw5o2u5qCh6aqMIOW8gOWniyMjI1xyXG5cdGNoZWNrKGltcF9kYXRhLCBPYmplY3QpXHJcblx0aWYgIWZyb21fdGVtcGxhdGVcclxuXHRcdCMgMSBhcHBz5qCh6aqM77ya5qC55o2uX2lk5Yik5pat5bqU55So5piv5ZCm5bey5a2Y5ZyoXHJcblx0XHRpbXBfYXBwX2lkcyA9IF8ucGx1Y2soaW1wX2RhdGEuYXBwcywgXCJfaWRcIilcclxuXHRcdGlmIF8uaXNBcnJheShpbXBfZGF0YS5hcHBzKSAmJiBpbXBfZGF0YS5hcHBzLmxlbmd0aCA+IDBcclxuXHRcdFx0Xy5lYWNoIGltcF9kYXRhLmFwcHMsIChhcHApLT5cclxuXHRcdFx0XHRpZiBfLmluY2x1ZGUoXy5rZXlzKENyZWF0b3IuQXBwcyksIGFwcC5faWQpXHJcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5bqU55SoJyN7YXBwLm5hbWV9J+W3suWtmOWcqFwiKVxyXG5cclxuXHRcdCMgMiBvYmplY3Rz5qCh6aqM77ya5qC55o2ub2JqZWN0Lm5hbWXliKTmlq3lr7nosaHmmK/lkKblt7LlrZjlnKg7IOagoemqjHRyaWdnZXJzXHJcblx0XHRpZiBfLmlzQXJyYXkoaW1wX2RhdGEub2JqZWN0cykgJiYgaW1wX2RhdGEub2JqZWN0cy5sZW5ndGggPiAwXHJcblx0XHRcdF8uZWFjaCBpbXBfZGF0YS5vYmplY3RzLCAob2JqZWN0KS0+XHJcblx0XHRcdFx0aWYgXy5pbmNsdWRlKF8ua2V5cyhDcmVhdG9yLk9iamVjdHMpLCBvYmplY3QubmFtZSlcclxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLlr7nosaEnI3tvYmplY3QubmFtZX0n5bey5a2Y5ZyoXCIpXHJcblx0XHRcdFx0Xy5lYWNoIG9iamVjdC50cmlnZ2VycywgKHRyaWdnZXIpLT5cclxuXHRcdFx0XHRcdGlmIHRyaWdnZXIub24gPT0gJ3NlcnZlcicgJiYgIVN0ZWVkb3MuaXNMZWdhbFZlcnNpb24oc3BhY2VfaWQsXCJ3b3JrZmxvdy5lbnRlcnByaXNlXCIpXHJcblx0XHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IgNTAwLCBcIuWPquacieS8geS4mueJiOaUr+aMgemFjee9ruacjeWKoeerr+eahOinpuWPkeWZqFwiXHJcblxyXG5cdFx0aW1wX29iamVjdF9uYW1lcyA9IF8ucGx1Y2soaW1wX2RhdGEub2JqZWN0cywgXCJuYW1lXCIpXHJcblx0XHRvYmplY3RfbmFtZXMgPSBfLmtleXMoQ3JlYXRvci5PYmplY3RzKVxyXG5cclxuXHRcdCMgMyDliKTmlq1hcHBz55qE5a+56LGh5piv5ZCm6YO95a2Y5ZyoXHJcblx0XHRpZiBfLmlzQXJyYXkoaW1wX2RhdGEuYXBwcykgJiYgaW1wX2RhdGEuYXBwcy5sZW5ndGggPiAwXHJcblx0XHRcdF8uZWFjaCBpbXBfZGF0YS5hcHBzLCAoYXBwKS0+XHJcblx0XHRcdFx0Xy5lYWNoIGFwcC5vYmplY3RzLCAob2JqZWN0X25hbWUpLT5cclxuXHRcdFx0XHRcdGlmICFfLmluY2x1ZGUob2JqZWN0X25hbWVzLCBvYmplY3RfbmFtZSkgJiYgIV8uaW5jbHVkZShpbXBfb2JqZWN0X25hbWVzLCBvYmplY3RfbmFtZSlcclxuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuW6lOeUqCcje2FwcC5uYW1lfSfkuK3mjIflrprnmoTlr7nosaEnI3tvYmplY3RfbmFtZX0n5LiN5a2Y5ZyoXCIpXHJcblxyXG5cdFx0IyA0IGxpc3Rfdmlld3PmoKHpqozvvJrliKTmlq1saXN0X3ZpZXdz5a+55bqU55qEb2JqZWN05piv5ZCm5a2Y5ZyoXHJcblx0XHRpZiBfLmlzQXJyYXkoaW1wX2RhdGEubGlzdF92aWV3cykgJiYgaW1wX2RhdGEubGlzdF92aWV3cy5sZW5ndGggPiAwXHJcblx0XHRcdF8uZWFjaCBpbXBfZGF0YS5saXN0X3ZpZXdzLCAobGlzdF92aWV3KS0+XHJcblx0XHRcdFx0aWYgIWxpc3Rfdmlldy5vYmplY3RfbmFtZSB8fCAhXy5pc1N0cmluZyhsaXN0X3ZpZXcub2JqZWN0X25hbWUpXHJcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5YiX6KGo6KeG5Zu+JyN7bGlzdF92aWV3Lm5hbWV9J+eahG9iamVjdF9uYW1l5bGe5oCn5peg5pWIXCIpXHJcblx0XHRcdFx0aWYgIV8uaW5jbHVkZShvYmplY3RfbmFtZXMsIGxpc3Rfdmlldy5vYmplY3RfbmFtZSkgJiYgIV8uaW5jbHVkZShpbXBfb2JqZWN0X25hbWVzLCBsaXN0X3ZpZXcub2JqZWN0X25hbWUpXHJcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5YiX6KGo6KeG5Zu+JyN7bGlzdF92aWV3Lm5hbWV9J+S4reaMh+WumueahOWvueixoScje2xpc3Rfdmlldy5vYmplY3RfbmFtZX0n5LiN5a2Y5ZyoXCIpXHJcblxyXG5cdFx0IyA1IHBlcm1pc3Npb25fc2V05qCh6aqM77ya5Yik5pat5p2D6ZmQ57uE5Lit55qE5o6I5p2D5bqU55SoYXNzaWduZWRfYXBwczsg5p2D6ZmQ57uE55qE5ZCN56ew5LiN5YWB6K646YeN5aSNXHJcblx0XHRwZXJtaXNzaW9uX3NldF9pZHMgPSBfLnBsdWNrKGltcF9kYXRhLnBlcm1pc3Npb25fc2V0LCBcIl9pZFwiKVxyXG5cdFx0aWYgXy5pc0FycmF5KGltcF9kYXRhLnBlcm1pc3Npb25fc2V0KSAmJiBpbXBfZGF0YS5wZXJtaXNzaW9uX3NldC5sZW5ndGggPiAwXHJcblx0XHRcdF8uZWFjaCBpbXBfZGF0YS5wZXJtaXNzaW9uX3NldCwgKHBlcm1pc3Npb25fc2V0KS0+XHJcblx0XHRcdFx0aWYgQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9zZXRcIikuZmluZE9uZSh7c3BhY2U6IHNwYWNlX2lkLCBuYW1lOiBwZXJtaXNzaW9uX3NldC5uYW1lfSx7ZmllbGRzOntfaWQ6MX19KVxyXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvciA1MDAsIFwi5p2D6ZmQ57uE5ZCN56ewJyN7cGVybWlzc2lvbl9zZXQubmFtZX0n5LiN6IO96YeN5aSNXCJcclxuXHRcdFx0XHRfLmVhY2ggcGVybWlzc2lvbl9zZXQuYXNzaWduZWRfYXBwcywgKGFwcF9pZCktPlxyXG5cdFx0XHRcdFx0aWYgIV8uaW5jbHVkZShfLmtleXMoQ3JlYXRvci5BcHBzKSwgYXBwX2lkKSAmJiAhXy5pbmNsdWRlKGltcF9hcHBfaWRzLCBhcHBfaWQpXHJcblx0XHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLmnYPpmZDnu4QnI3twZXJtaXNzaW9uX3NldC5uYW1lfSfnmoTmjojmnYPlupTnlKgnI3thcHBfaWR9J+S4jeWtmOWcqFwiKVxyXG5cclxuXHRcdCMgNiBwZXJtaXNzaW9uX29iamVjdHPmoKHpqozvvJrliKTmlq3mnYPpmZDpm4bkuK3mjIflrprnmoRvYmplY3TmmK/lkKblrZjlnKjvvJvliKTmlq3mnYPpmZDnu4TmoIfor4bmmK/mmK/lkKbmnInmlYhcclxuXHRcdGlmIF8uaXNBcnJheShpbXBfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMpICYmIGltcF9kYXRhLnBlcm1pc3Npb25fb2JqZWN0cy5sZW5ndGggPiAwXHJcblx0XHRcdF8uZWFjaCBpbXBfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMsIChwZXJtaXNzaW9uX29iamVjdCktPlxyXG5cdFx0XHRcdGlmICFwZXJtaXNzaW9uX29iamVjdC5vYmplY3RfbmFtZSB8fCAhXy5pc1N0cmluZyhwZXJtaXNzaW9uX29iamVjdC5vYmplY3RfbmFtZSlcclxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLmnYPpmZDpm4YnI3twZXJtaXNzaW9uX29iamVjdC5uYW1lfSfnmoRvYmplY3RfbmFtZeWxnuaAp+aXoOaViFwiKVxyXG5cdFx0XHRcdGlmICFfLmluY2x1ZGUob2JqZWN0X25hbWVzLCBwZXJtaXNzaW9uX29iamVjdC5vYmplY3RfbmFtZSkgJiYgIV8uaW5jbHVkZShpbXBfb2JqZWN0X25hbWVzLCBwZXJtaXNzaW9uX29iamVjdC5vYmplY3RfbmFtZSlcclxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLmnYPpmZDpm4YnI3tsaXN0X3ZpZXcubmFtZX0n5Lit5oyH5a6a55qE5a+56LGhJyN7cGVybWlzc2lvbl9vYmplY3Qub2JqZWN0X25hbWV9J+S4jeWtmOWcqFwiKVxyXG5cclxuXHRcdFx0XHRpZiAhXy5oYXMocGVybWlzc2lvbl9vYmplY3QsIFwicGVybWlzc2lvbl9zZXRfaWRcIikgfHwgIV8uaXNTdHJpbmcocGVybWlzc2lvbl9vYmplY3QucGVybWlzc2lvbl9zZXRfaWQpXHJcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5p2D6ZmQ6ZuGJyN7cGVybWlzc2lvbl9vYmplY3QubmFtZX0n55qEcGVybWlzc2lvbl9zZXRfaWTlsZ7mgKfml6DmlYhcIilcclxuXHRcdFx0XHRlbHNlIGlmICFfLmluY2x1ZGUocGVybWlzc2lvbl9zZXRfaWRzLCBwZXJtaXNzaW9uX29iamVjdC5wZXJtaXNzaW9uX3NldF9pZClcclxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLmnYPpmZDpm4YnI3twZXJtaXNzaW9uX29iamVjdC5uYW1lfSfmjIflrprnmoTmnYPpmZDnu4QnI3twZXJtaXNzaW9uX29iamVjdC5wZXJtaXNzaW9uX3NldF9pZH0n5YC85LiN5Zyo5a+85YWl55qEcGVybWlzc2lvbl9zZXTkuK1cIilcclxuXHJcblx0XHQjIDcgcmVwb3J0c+agoemqjO+8muWIpOaWreaKpeihqOS4reaMh+WumueahG9iamVjdOaYr+WQpuWtmOWcqFxyXG5cdFx0aWYgXy5pc0FycmF5KGltcF9kYXRhLnJlcG9ydHMpICYmIGltcF9kYXRhLnJlcG9ydHMubGVuZ3RoID4gMFxyXG5cdFx0XHRfLmVhY2ggaW1wX2RhdGEucmVwb3J0cywgKHJlcG9ydCktPlxyXG5cdFx0XHRcdGlmICFyZXBvcnQub2JqZWN0X25hbWUgfHwgIV8uaXNTdHJpbmcocmVwb3J0Lm9iamVjdF9uYW1lKVxyXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuaKpeihqCcje3JlcG9ydC5uYW1lfSfnmoRvYmplY3RfbmFtZeWxnuaAp+aXoOaViFwiKVxyXG5cdFx0XHRcdGlmICFfLmluY2x1ZGUob2JqZWN0X25hbWVzLCByZXBvcnQub2JqZWN0X25hbWUpICYmICFfLmluY2x1ZGUoaW1wX29iamVjdF9uYW1lcywgcmVwb3J0Lm9iamVjdF9uYW1lKVxyXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuaKpeihqCcje3JlcG9ydC5uYW1lfSfkuK3mjIflrprnmoTlr7nosaEnI3tyZXBvcnQub2JqZWN0X25hbWV9J+S4jeWtmOWcqFwiKVxyXG5cclxuXHQjIyPmlbDmja7moKHpqowg57uT5p2fIyMjXHJcblxyXG5cdCMjI+aVsOaNruaMgeS5heWMliDlvIDlp4sjIyNcclxuXHJcblx0IyDlrprkuYnmlrDml6fmlbDmja7lr7nlupTlhbPns7vpm4blkIhcclxuXHRhcHBzX2lkX21hcHMgPSB7fVxyXG5cdGxpc3Rfdmlld3NfaWRfbWFwcyA9IHt9XHJcblx0cGVybWlzc2lvbl9zZXRfaWRfbWFwcyA9IHt9XHJcblxyXG5cdCMgMSDmjIHkuYXljJZBcHBzXHJcblx0aWYgXy5pc0FycmF5KGltcF9kYXRhLmFwcHMpICYmIGltcF9kYXRhLmFwcHMubGVuZ3RoID4gMFxyXG5cdFx0Xy5lYWNoIGltcF9kYXRhLmFwcHMsIChhcHApLT5cclxuXHRcdFx0b2xkX2lkID0gYXBwLl9pZFxyXG5cdFx0XHRkZWxldGUgYXBwLl9pZFxyXG5cdFx0XHRhcHAuc3BhY2UgPSBzcGFjZV9pZFxyXG5cdFx0XHRhcHAub3duZXIgPSB1c2VySWRcclxuXHRcdFx0YXBwLmlzX2NyZWF0b3IgPSB0cnVlXHJcblx0XHRcdG5ld19pZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcHNcIikuaW5zZXJ0KGFwcClcclxuXHRcdFx0YXBwc19pZF9tYXBzW29sZF9pZF0gPSBuZXdfaWRcclxuXHJcblx0IyAyIOaMgeS5heWMlm9iamVjdHNcclxuXHRpZiBfLmlzQXJyYXkoaW1wX2RhdGEub2JqZWN0cykgJiYgaW1wX2RhdGEub2JqZWN0cy5sZW5ndGggPiAwXHJcblx0XHRfLmVhY2ggaW1wX2RhdGEub2JqZWN0cywgKG9iamVjdCktPlxyXG5cdFx0XHRDcmVhdG9yLmltcG9ydE9iamVjdCh1c2VySWQsIHNwYWNlX2lkLCBvYmplY3QsIGxpc3Rfdmlld3NfaWRfbWFwcylcclxuXHJcblx0IyAzIOaMgeS5heWMlmxpc3Rfdmlld3NcclxuXHRpZiBfLmlzQXJyYXkoaW1wX2RhdGEubGlzdF92aWV3cykgJiYgaW1wX2RhdGEubGlzdF92aWV3cy5sZW5ndGggPiAwXHJcblx0XHRfLmVhY2ggaW1wX2RhdGEubGlzdF92aWV3cywgKGxpc3RfdmlldyktPlxyXG5cdFx0XHRvbGRfaWQgPSBsaXN0X3ZpZXcuX2lkXHJcblx0XHRcdGRlbGV0ZSBsaXN0X3ZpZXcuX2lkXHJcblxyXG5cdFx0XHRsaXN0X3ZpZXcuc3BhY2UgPSBzcGFjZV9pZFxyXG5cdFx0XHRsaXN0X3ZpZXcub3duZXIgPSB1c2VySWRcclxuXHRcdFx0aWYgQ3JlYXRvci5pc0FsbFZpZXcobGlzdF92aWV3KSB8fCBDcmVhdG9yLmlzUmVjZW50VmlldyhsaXN0X3ZpZXcpXHJcblx0XHRcdFx0IyDliJvlu7pvYmplY3Tml7bvvIzkvJroh6rliqjmt7vliqBhbGwgdmlld+OAgXJlY2VudCB2aWV3XHJcblx0XHRcdFx0X2xpc3RfdmlldyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikuZmluZE9uZSh7b2JqZWN0X25hbWU6IGxpc3Rfdmlldy5vYmplY3RfbmFtZSwgbmFtZTogbGlzdF92aWV3Lm5hbWUsIHNwYWNlOiBzcGFjZV9pZH0se2ZpZWxkczoge19pZDogMX19KVxyXG5cdFx0XHRcdGlmIF9saXN0X3ZpZXdcclxuXHRcdFx0XHRcdG5ld19pZCA9IF9saXN0X3ZpZXcuX2lkXHJcblx0XHRcdFx0Q3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS51cGRhdGUoe29iamVjdF9uYW1lOiBsaXN0X3ZpZXcub2JqZWN0X25hbWUsIG5hbWU6IGxpc3Rfdmlldy5uYW1lLCBzcGFjZTogc3BhY2VfaWR9LCB7JHNldDogbGlzdF92aWV3fSlcclxuXHRcdFx0ZWxzZVxyXG5cdFx0XHRcdG5ld19pZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikuaW5zZXJ0KGxpc3RfdmlldylcclxuXHJcblx0XHRcdGxpc3Rfdmlld3NfaWRfbWFwc1tsaXN0X3ZpZXcub2JqZWN0X25hbWUgKyBcIl9cIiArIG9sZF9pZF0gPSBuZXdfaWRcclxuXHJcblx0IyA0IOaMgeS5heWMlnBlcm1pc3Npb25fc2V0XHJcblx0aWYgXy5pc0FycmF5KGltcF9kYXRhLnBlcm1pc3Npb25fc2V0KSAmJiBpbXBfZGF0YS5wZXJtaXNzaW9uX3NldC5sZW5ndGggPiAwXHJcblx0XHRfLmVhY2ggaW1wX2RhdGEucGVybWlzc2lvbl9zZXQsIChwZXJtaXNzaW9uX3NldCktPlxyXG5cdFx0XHRvbGRfaWQgPSBwZXJtaXNzaW9uX3NldC5faWRcclxuXHRcdFx0ZGVsZXRlIHBlcm1pc3Npb25fc2V0Ll9pZFxyXG5cclxuXHRcdFx0cGVybWlzc2lvbl9zZXQuc3BhY2UgPSBzcGFjZV9pZFxyXG5cdFx0XHRwZXJtaXNzaW9uX3NldC5vd25lciA9IHVzZXJJZFxyXG5cclxuXHRcdFx0cGVybWlzc2lvbl9zZXRfdXNlcnMgPSBbXVxyXG5cdFx0XHRfLmVhY2ggcGVybWlzc2lvbl9zZXQudXNlcnMsICh1c2VyX2lkKS0+XHJcblx0XHRcdFx0c3BhY2VfdXNlciA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInNwYWNlX3VzZXJzXCIpLmZpbmRPbmUoe3NwYWNlOiBzcGFjZV9pZCwgdXNlcjogdXNlcl9pZH0sIHtmaWVsZHM6IHtfaWQ6IDF9fSlcclxuXHRcdFx0XHRpZiBzcGFjZV91c2VyXHJcblx0XHRcdFx0XHRwZXJtaXNzaW9uX3NldF91c2Vycy5wdXNoIHVzZXJfaWRcclxuXHJcblx0XHRcdGFzc2lnbmVkX2FwcHMgPSBbXVxyXG5cdFx0XHRfLmVhY2ggcGVybWlzc2lvbl9zZXQuYXNzaWduZWRfYXBwcywgKGFwcF9pZCktPlxyXG5cdFx0XHRcdGlmIF8uaW5jbHVkZShfLmtleXMoQ3JlYXRvci5BcHBzKSwgYXBwX2lkKVxyXG5cdFx0XHRcdFx0YXNzaWduZWRfYXBwcy5wdXNoIGFwcF9pZFxyXG5cdFx0XHRcdGVsc2UgaWYgYXBwc19pZF9tYXBzW2FwcF9pZF1cclxuXHRcdFx0XHRcdGFzc2lnbmVkX2FwcHMucHVzaCBhcHBzX2lkX21hcHNbYXBwX2lkXVxyXG5cclxuXHJcblx0XHRcdG5ld19pZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmluc2VydChwZXJtaXNzaW9uX3NldClcclxuXHJcblx0XHRcdHBlcm1pc3Npb25fc2V0X2lkX21hcHNbb2xkX2lkXSA9IG5ld19pZFxyXG5cclxuXHQjIDUgIOaMgeS5heWMlnBlcm1pc3Npb25fb2JqZWN0c1xyXG5cdGlmIF8uaXNBcnJheShpbXBfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMpICYmIGltcF9kYXRhLnBlcm1pc3Npb25fb2JqZWN0cy5sZW5ndGggPiAwXHJcblx0XHRfLmVhY2ggaW1wX2RhdGEucGVybWlzc2lvbl9vYmplY3RzLCAocGVybWlzc2lvbl9vYmplY3QpLT5cclxuXHRcdFx0ZGVsZXRlIHBlcm1pc3Npb25fb2JqZWN0Ll9pZFxyXG5cclxuXHRcdFx0cGVybWlzc2lvbl9vYmplY3Quc3BhY2UgPSBzcGFjZV9pZFxyXG5cdFx0XHRwZXJtaXNzaW9uX29iamVjdC5vd25lciA9IHVzZXJJZFxyXG5cclxuXHRcdFx0cGVybWlzc2lvbl9vYmplY3QucGVybWlzc2lvbl9zZXRfaWQgPSBwZXJtaXNzaW9uX3NldF9pZF9tYXBzW3Blcm1pc3Npb25fb2JqZWN0LnBlcm1pc3Npb25fc2V0X2lkXVxyXG5cclxuXHRcdFx0ZGlzYWJsZWRfbGlzdF92aWV3cyA9IFtdXHJcblx0XHRcdF8uZWFjaCBwZXJtaXNzaW9uX29iamVjdC5kaXNhYmxlZF9saXN0X3ZpZXdzLCAobGlzdF92aWV3X2lkKS0+XHJcblx0XHRcdFx0bmV3X3ZpZXdfaWQgPSBsaXN0X3ZpZXdzX2lkX21hcHNbcGVybWlzc2lvbl9vYmplY3Qub2JqZWN0X25hbWUgKyBcIl9cIiArIGxpc3Rfdmlld19pZF1cclxuXHRcdFx0XHRpZiBuZXdfdmlld19pZFxyXG5cdFx0XHRcdFx0ZGlzYWJsZWRfbGlzdF92aWV3cy5wdXNoIG5ld192aWV3X2lkXHJcblxyXG5cdFx0XHRDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX29iamVjdHNcIikuaW5zZXJ0KHBlcm1pc3Npb25fb2JqZWN0KVxyXG5cclxuXHQjIDYg5oyB5LmF5YyWcmVwb3J0c1xyXG5cdGlmIF8uaXNBcnJheShpbXBfZGF0YS5yZXBvcnRzKSAmJiBpbXBfZGF0YS5yZXBvcnRzLmxlbmd0aCA+IDBcclxuXHRcdF8uZWFjaCBpbXBfZGF0YS5yZXBvcnRzLCAocmVwb3J0KS0+XHJcblx0XHRcdGRlbGV0ZSByZXBvcnQuX2lkXHJcblxyXG5cdFx0XHRyZXBvcnQuc3BhY2UgPSBzcGFjZV9pZFxyXG5cdFx0XHRyZXBvcnQub3duZXIgPSB1c2VySWRcclxuXHJcblx0XHRcdENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInJlcG9ydHNcIikuaW5zZXJ0KHJlcG9ydClcclxuXHQjIyPmlbDmja7mjIHkuYXljJYg57uT5p2fIyMjXHJcblxyXG4jIyPnlLHkuo7kvb/nlKjmjqXlj6PmlrnlvI/kvJrlr7zoh7Rjb2xsZWN0aW9u55qEYWZ0ZXLjgIFiZWZvcmXkuK3ojrflj5bkuI3liLB1c2VySWTvvIzlho3mraTpl67popjmnKrop6PlhrPkuYvliY3vvIzov5jmmK/kvb/nlKhNZXRob2RcclxuSnNvblJvdXRlcy5hZGQgJ3Bvc3QnLCAnL2FwaS9jcmVhdG9yL2FwcF9wYWNrYWdlL2ltcG9ydC86c3BhY2VfaWQnLCAocmVxLCByZXMsIG5leHQpIC0+XHJcblx0dHJ5XHJcblx0XHR1c2VySWQgPSBTdGVlZG9zLmdldFVzZXJJZEZyb21BdXRoVG9rZW4ocmVxLCByZXMpO1xyXG5cdFx0c3BhY2VfaWQgPSByZXEucGFyYW1zLnNwYWNlX2lkXHJcblx0XHRpbXBfZGF0YSA9IHJlcS5ib2R5XHJcblx0XHRpbXBvcnRfYXBwX3BhY2thZ2UodXNlcklkLCBzcGFjZV9pZCwgaW1wX2RhdGEpXHJcblx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLCB7XHJcblx0XHRcdGNvZGU6IDIwMFxyXG5cdFx0XHRkYXRhOiB7fVxyXG5cdFx0fVxyXG5cdGNhdGNoIGVcclxuXHRcdGNvbnNvbGUuZXJyb3IgZS5zdGFja1xyXG5cdFx0SnNvblJvdXRlcy5zZW5kUmVzdWx0IHJlcywge1xyXG5cdFx0XHRjb2RlOiBlLmVycm9yXHJcblx0XHRcdGRhdGE6IHsgZXJyb3JzOiBlcnJvck1lc3NhZ2U6IGUucmVhc29uIHx8IGUubWVzc2FnZSB9XHJcblx0XHR9XHJcbiMjI1xyXG5cclxuTWV0ZW9yLm1ldGhvZHNcclxuXHQnaW1wb3J0X2FwcF9wYWNrYWdlJzogKHNwYWNlX2lkLCBpbXBfZGF0YSktPlxyXG5cdFx0dXNlcklkID0gdGhpcy51c2VySWRcclxuXHRcdENyZWF0b3IuaW1wb3J0X2FwcF9wYWNrYWdlKHVzZXJJZCwgc3BhY2VfaWQsIGltcF9kYXRhKVxyXG4iLCJ2YXIgdHJhbnNmb3JtRmllbGRPcHRpb25zLCB0cmFuc2Zvcm1GaWx0ZXJzO1xuXG50cmFuc2Zvcm1GaWx0ZXJzID0gZnVuY3Rpb24oZmlsdGVycykge1xuICB2YXIgX2ZpbHRlcnM7XG4gIF9maWx0ZXJzID0gW107XG4gIF8uZWFjaChmaWx0ZXJzLCBmdW5jdGlvbihmKSB7XG4gICAgaWYgKF8uaXNBcnJheShmKSAmJiBmLmxlbmd0aCA9PT0gMykge1xuICAgICAgcmV0dXJuIF9maWx0ZXJzLnB1c2goe1xuICAgICAgICBmaWVsZDogZlswXSxcbiAgICAgICAgb3BlcmF0aW9uOiBmWzFdLFxuICAgICAgICB2YWx1ZTogZlsyXVxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBfZmlsdGVycy5wdXNoKGYpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBfZmlsdGVycztcbn07XG5cbnRyYW5zZm9ybUZpZWxkT3B0aW9ucyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgdmFyIF9vcHRpb25zO1xuICBpZiAoIV8uaXNBcnJheShvcHRpb25zKSkge1xuICAgIHJldHVybiBvcHRpb25zO1xuICB9XG4gIF9vcHRpb25zID0gW107XG4gIF8uZWFjaChvcHRpb25zLCBmdW5jdGlvbihvKSB7XG4gICAgaWYgKG8gJiYgXy5oYXMobywgJ2xhYmVsJykgJiYgXy5oYXMobywgJ3ZhbHVlJykpIHtcbiAgICAgIHJldHVybiBfb3B0aW9ucy5wdXNoKG8ubGFiZWwgKyBcIjpcIiArIG8udmFsdWUpO1xuICAgIH1cbiAgfSk7XG4gIHJldHVybiBfb3B0aW9ucy5qb2luKCcsJyk7XG59O1xuXG5DcmVhdG9yLmltcG9ydE9iamVjdCA9IGZ1bmN0aW9uKHVzZXJJZCwgc3BhY2VfaWQsIG9iamVjdCwgbGlzdF92aWV3c19pZF9tYXBzKSB7XG4gIHZhciBfZmllbGRuYW1lcywgYWN0aW9ucywgZmllbGRzLCBoYXNSZWNlbnRWaWV3LCBpbnRlcm5hbF9saXN0X3ZpZXcsIG9ial9saXN0X3ZpZXdzLCB0cmlnZ2VycztcbiAgY29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLWltcG9ydE9iamVjdC0tLS0tLS0tLS0tLS0tLS0tLScsIG9iamVjdC5uYW1lKTtcbiAgZmllbGRzID0gb2JqZWN0LmZpZWxkcztcbiAgdHJpZ2dlcnMgPSBvYmplY3QudHJpZ2dlcnM7XG4gIGFjdGlvbnMgPSBvYmplY3QuYWN0aW9ucztcbiAgb2JqX2xpc3Rfdmlld3MgPSBvYmplY3QubGlzdF92aWV3cztcbiAgZGVsZXRlIG9iamVjdC5faWQ7XG4gIGRlbGV0ZSBvYmplY3QuZmllbGRzO1xuICBkZWxldGUgb2JqZWN0LnRyaWdnZXJzO1xuICBkZWxldGUgb2JqZWN0LmFjdGlvbnM7XG4gIGRlbGV0ZSBvYmplY3QucGVybWlzc2lvbnM7XG4gIGRlbGV0ZSBvYmplY3QubGlzdF92aWV3cztcbiAgb2JqZWN0LnNwYWNlID0gc3BhY2VfaWQ7XG4gIG9iamVjdC5vd25lciA9IHVzZXJJZDtcbiAgQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0c1wiKS5pbnNlcnQob2JqZWN0KTtcbiAgaW50ZXJuYWxfbGlzdF92aWV3ID0ge307XG4gIGhhc1JlY2VudFZpZXcgPSBmYWxzZTtcbiAgY29uc29sZS5sb2coJ+aMgeS5heWMluWvueixoWxpc3Rfdmlld3MnKTtcbiAgXy5lYWNoKG9ial9saXN0X3ZpZXdzLCBmdW5jdGlvbihsaXN0X3ZpZXcpIHtcbiAgICB2YXIgbmV3X2lkLCBvbGRfaWQsIG9wdGlvbnM7XG4gICAgb2xkX2lkID0gbGlzdF92aWV3Ll9pZDtcbiAgICBkZWxldGUgbGlzdF92aWV3Ll9pZDtcbiAgICBsaXN0X3ZpZXcuc3BhY2UgPSBzcGFjZV9pZDtcbiAgICBsaXN0X3ZpZXcub3duZXIgPSB1c2VySWQ7XG4gICAgbGlzdF92aWV3Lm9iamVjdF9uYW1lID0gb2JqZWN0Lm5hbWU7XG4gICAgaWYgKENyZWF0b3IuaXNSZWNlbnRWaWV3KGxpc3RfdmlldykpIHtcbiAgICAgIGhhc1JlY2VudFZpZXcgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAobGlzdF92aWV3LmZpbHRlcnMpIHtcbiAgICAgIGxpc3Rfdmlldy5maWx0ZXJzID0gdHJhbnNmb3JtRmlsdGVycyhsaXN0X3ZpZXcuZmlsdGVycyk7XG4gICAgfVxuICAgIGlmIChDcmVhdG9yLmlzQWxsVmlldyhsaXN0X3ZpZXcpIHx8IENyZWF0b3IuaXNSZWNlbnRWaWV3KGxpc3RfdmlldykpIHtcbiAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICRzZXQ6IGxpc3Rfdmlld1xuICAgICAgfTtcbiAgICAgIGlmICghbGlzdF92aWV3LmNvbHVtbnMpIHtcbiAgICAgICAgb3B0aW9ucy4kdW5zZXQgPSB7XG4gICAgICAgICAgY29sdW1uczogJydcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfbGlzdHZpZXdzXCIpLnVwZGF0ZSh7XG4gICAgICAgIG9iamVjdF9uYW1lOiBvYmplY3QubmFtZSxcbiAgICAgICAgbmFtZTogbGlzdF92aWV3Lm5hbWUsXG4gICAgICAgIHNwYWNlOiBzcGFjZV9pZFxuICAgICAgfSwgb3B0aW9ucyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5ld19pZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikuaW5zZXJ0KGxpc3Rfdmlldyk7XG4gICAgICByZXR1cm4gbGlzdF92aWV3c19pZF9tYXBzW29iamVjdC5uYW1lICsgXCJfXCIgKyBvbGRfaWRdID0gbmV3X2lkO1xuICAgIH1cbiAgfSk7XG4gIGlmICghaGFzUmVjZW50Vmlldykge1xuICAgIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikucmVtb3ZlKHtcbiAgICAgIG5hbWU6IFwicmVjZW50XCIsXG4gICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICBvYmplY3RfbmFtZTogb2JqZWN0Lm5hbWUsXG4gICAgICBvd25lcjogdXNlcklkXG4gICAgfSk7XG4gIH1cbiAgY29uc29sZS5sb2coJ+aMgeS5heWMluWvueixoeWtl+autScpO1xuICBfZmllbGRuYW1lcyA9IFtdO1xuICBfLmVhY2goZmllbGRzLCBmdW5jdGlvbihmaWVsZCwgaykge1xuICAgIGRlbGV0ZSBmaWVsZC5faWQ7XG4gICAgZmllbGQuc3BhY2UgPSBzcGFjZV9pZDtcbiAgICBmaWVsZC5vd25lciA9IHVzZXJJZDtcbiAgICBmaWVsZC5vYmplY3QgPSBvYmplY3QubmFtZTtcbiAgICBpZiAoZmllbGQub3B0aW9ucykge1xuICAgICAgZmllbGQub3B0aW9ucyA9IHRyYW5zZm9ybUZpZWxkT3B0aW9ucyhmaWVsZC5vcHRpb25zKTtcbiAgICB9XG4gICAgaWYgKCFfLmhhcyhmaWVsZCwgXCJuYW1lXCIpKSB7XG4gICAgICBmaWVsZC5uYW1lID0gaztcbiAgICB9XG4gICAgX2ZpZWxkbmFtZXMucHVzaChmaWVsZC5uYW1lKTtcbiAgICBpZiAoZmllbGQubmFtZSA9PT0gXCJuYW1lXCIpIHtcbiAgICAgIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9maWVsZHNcIikudXBkYXRlKHtcbiAgICAgICAgb2JqZWN0OiBvYmplY3QubmFtZSxcbiAgICAgICAgbmFtZTogXCJuYW1lXCIsXG4gICAgICAgIHNwYWNlOiBzcGFjZV9pZFxuICAgICAgfSwge1xuICAgICAgICAkc2V0OiBmaWVsZFxuICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9maWVsZHNcIikuaW5zZXJ0KGZpZWxkKTtcbiAgICB9XG4gICAgaWYgKCFfLmNvbnRhaW5zKF9maWVsZG5hbWVzLCAnbmFtZScpKSB7XG4gICAgICByZXR1cm4gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2ZpZWxkc1wiKS5kaXJlY3QucmVtb3ZlKHtcbiAgICAgICAgb2JqZWN0OiBvYmplY3QubmFtZSxcbiAgICAgICAgbmFtZTogXCJuYW1lXCIsXG4gICAgICAgIHNwYWNlOiBzcGFjZV9pZFxuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbiAgY29uc29sZS5sb2coJ+aMgeS5heWMluinpuWPkeWZqCcpO1xuICBfLmVhY2godHJpZ2dlcnMsIGZ1bmN0aW9uKHRyaWdnZXIsIGspIHtcbiAgICBkZWxldGUgdHJpZ2dlcnMuX2lkO1xuICAgIHRyaWdnZXIuc3BhY2UgPSBzcGFjZV9pZDtcbiAgICB0cmlnZ2VyLm93bmVyID0gdXNlcklkO1xuICAgIHRyaWdnZXIub2JqZWN0ID0gb2JqZWN0Lm5hbWU7XG4gICAgaWYgKCFfLmhhcyh0cmlnZ2VyLCBcIm5hbWVcIikpIHtcbiAgICAgIHRyaWdnZXIubmFtZSA9IGsucmVwbGFjZShuZXcgUmVnRXhwKFwiXFxcXC5cIiwgXCJnXCIpLCBcIl9cIik7XG4gICAgfVxuICAgIGlmICghXy5oYXModHJpZ2dlciwgXCJpc19lbmFibGVcIikpIHtcbiAgICAgIHRyaWdnZXIuaXNfZW5hYmxlID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF90cmlnZ2Vyc1wiKS5pbnNlcnQodHJpZ2dlcik7XG4gIH0pO1xuICBjb25zb2xlLmxvZygn5oyB5LmF5YyW5pON5L2cJyk7XG4gIF8uZWFjaChhY3Rpb25zLCBmdW5jdGlvbihhY3Rpb24sIGspIHtcbiAgICBkZWxldGUgYWN0aW9uLl9pZDtcbiAgICBhY3Rpb24uc3BhY2UgPSBzcGFjZV9pZDtcbiAgICBhY3Rpb24ub3duZXIgPSB1c2VySWQ7XG4gICAgYWN0aW9uLm9iamVjdCA9IG9iamVjdC5uYW1lO1xuICAgIGlmICghXy5oYXMoYWN0aW9uLCBcIm5hbWVcIikpIHtcbiAgICAgIGFjdGlvbi5uYW1lID0gay5yZXBsYWNlKG5ldyBSZWdFeHAoXCJcXFxcLlwiLCBcImdcIiksIFwiX1wiKTtcbiAgICB9XG4gICAgaWYgKCFfLmhhcyhhY3Rpb24sIFwiaXNfZW5hYmxlXCIpKSB7XG4gICAgICBhY3Rpb24uaXNfZW5hYmxlID0gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9hY3Rpb25zXCIpLmluc2VydChhY3Rpb24pO1xuICB9KTtcbiAgcmV0dXJuIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS1pbXBvcnRPYmplY3QgZW5kLS0tLS0tLS0tLS0tLS0tLS0tJywgb2JqZWN0Lm5hbWUpO1xufTtcblxuQ3JlYXRvci5pbXBvcnRfYXBwX3BhY2thZ2UgPSBmdW5jdGlvbih1c2VySWQsIHNwYWNlX2lkLCBpbXBfZGF0YSwgZnJvbV90ZW1wbGF0ZSkge1xuICB2YXIgYXBwc19pZF9tYXBzLCBpbXBfYXBwX2lkcywgaW1wX29iamVjdF9uYW1lcywgbGlzdF92aWV3c19pZF9tYXBzLCBvYmplY3RfbmFtZXMsIHBlcm1pc3Npb25fc2V0X2lkX21hcHMsIHBlcm1pc3Npb25fc2V0X2lkcztcbiAgaWYgKCF1c2VySWQpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNDAxXCIsIFwiQXV0aGVudGljYXRpb24gaXMgcmVxdWlyZWQgYW5kIGhhcyBub3QgYmVlbiBwcm92aWRlZC5cIik7XG4gIH1cbiAgaWYgKCFDcmVhdG9yLmlzU3BhY2VBZG1pbihzcGFjZV9pZCwgdXNlcklkKSkge1xuICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI0MDFcIiwgXCJQZXJtaXNzaW9uIGRlbmllZC5cIik7XG4gIH1cblxuICAvKuaVsOaNruagoemqjCDlvIDlp4sgKi9cbiAgY2hlY2soaW1wX2RhdGEsIE9iamVjdCk7XG4gIGlmICghZnJvbV90ZW1wbGF0ZSkge1xuICAgIGltcF9hcHBfaWRzID0gXy5wbHVjayhpbXBfZGF0YS5hcHBzLCBcIl9pZFwiKTtcbiAgICBpZiAoXy5pc0FycmF5KGltcF9kYXRhLmFwcHMpICYmIGltcF9kYXRhLmFwcHMubGVuZ3RoID4gMCkge1xuICAgICAgXy5lYWNoKGltcF9kYXRhLmFwcHMsIGZ1bmN0aW9uKGFwcCkge1xuICAgICAgICBpZiAoXy5pbmNsdWRlKF8ua2V5cyhDcmVhdG9yLkFwcHMpLCBhcHAuX2lkKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLlupTnlKgnXCIgKyBhcHAubmFtZSArIFwiJ+W3suWtmOWcqFwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChfLmlzQXJyYXkoaW1wX2RhdGEub2JqZWN0cykgJiYgaW1wX2RhdGEub2JqZWN0cy5sZW5ndGggPiAwKSB7XG4gICAgICBfLmVhY2goaW1wX2RhdGEub2JqZWN0cywgZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgIGlmIChfLmluY2x1ZGUoXy5rZXlzKENyZWF0b3IuT2JqZWN0cyksIG9iamVjdC5uYW1lKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLlr7nosaEnXCIgKyBvYmplY3QubmFtZSArIFwiJ+W3suWtmOWcqFwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXy5lYWNoKG9iamVjdC50cmlnZ2VycywgZnVuY3Rpb24odHJpZ2dlcikge1xuICAgICAgICAgIGlmICh0cmlnZ2VyLm9uID09PSAnc2VydmVyJyAmJiAhU3RlZWRvcy5pc0xlZ2FsVmVyc2lvbihzcGFjZV9pZCwgXCJ3b3JrZmxvdy5lbnRlcnByaXNlXCIpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLlj6rmnInkvIHkuJrniYjmlK/mjIHphY3nva7mnI3liqHnq6/nmoTop6blj5HlmahcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpbXBfb2JqZWN0X25hbWVzID0gXy5wbHVjayhpbXBfZGF0YS5vYmplY3RzLCBcIm5hbWVcIik7XG4gICAgb2JqZWN0X25hbWVzID0gXy5rZXlzKENyZWF0b3IuT2JqZWN0cyk7XG4gICAgaWYgKF8uaXNBcnJheShpbXBfZGF0YS5hcHBzKSAmJiBpbXBfZGF0YS5hcHBzLmxlbmd0aCA+IDApIHtcbiAgICAgIF8uZWFjaChpbXBfZGF0YS5hcHBzLCBmdW5jdGlvbihhcHApIHtcbiAgICAgICAgcmV0dXJuIF8uZWFjaChhcHAub2JqZWN0cywgZnVuY3Rpb24ob2JqZWN0X25hbWUpIHtcbiAgICAgICAgICBpZiAoIV8uaW5jbHVkZShvYmplY3RfbmFtZXMsIG9iamVjdF9uYW1lKSAmJiAhXy5pbmNsdWRlKGltcF9vYmplY3RfbmFtZXMsIG9iamVjdF9uYW1lKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuW6lOeUqCdcIiArIGFwcC5uYW1lICsgXCIn5Lit5oyH5a6a55qE5a+56LGhJ1wiICsgb2JqZWN0X25hbWUgKyBcIifkuI3lrZjlnKhcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoXy5pc0FycmF5KGltcF9kYXRhLmxpc3Rfdmlld3MpICYmIGltcF9kYXRhLmxpc3Rfdmlld3MubGVuZ3RoID4gMCkge1xuICAgICAgXy5lYWNoKGltcF9kYXRhLmxpc3Rfdmlld3MsIGZ1bmN0aW9uKGxpc3Rfdmlldykge1xuICAgICAgICBpZiAoIWxpc3Rfdmlldy5vYmplY3RfbmFtZSB8fCAhXy5pc1N0cmluZyhsaXN0X3ZpZXcub2JqZWN0X25hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuWIl+ihqOinhuWbvidcIiArIGxpc3Rfdmlldy5uYW1lICsgXCIn55qEb2JqZWN0X25hbWXlsZ7mgKfml6DmlYhcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFfLmluY2x1ZGUob2JqZWN0X25hbWVzLCBsaXN0X3ZpZXcub2JqZWN0X25hbWUpICYmICFfLmluY2x1ZGUoaW1wX29iamVjdF9uYW1lcywgbGlzdF92aWV3Lm9iamVjdF9uYW1lKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLliJfooajop4blm74nXCIgKyBsaXN0X3ZpZXcubmFtZSArIFwiJ+S4reaMh+WumueahOWvueixoSdcIiArIGxpc3Rfdmlldy5vYmplY3RfbmFtZSArIFwiJ+S4jeWtmOWcqFwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIHBlcm1pc3Npb25fc2V0X2lkcyA9IF8ucGx1Y2soaW1wX2RhdGEucGVybWlzc2lvbl9zZXQsIFwiX2lkXCIpO1xuICAgIGlmIChfLmlzQXJyYXkoaW1wX2RhdGEucGVybWlzc2lvbl9zZXQpICYmIGltcF9kYXRhLnBlcm1pc3Npb25fc2V0Lmxlbmd0aCA+IDApIHtcbiAgICAgIF8uZWFjaChpbXBfZGF0YS5wZXJtaXNzaW9uX3NldCwgZnVuY3Rpb24ocGVybWlzc2lvbl9zZXQpIHtcbiAgICAgICAgaWYgKENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmRPbmUoe1xuICAgICAgICAgIHNwYWNlOiBzcGFjZV9pZCxcbiAgICAgICAgICBuYW1lOiBwZXJtaXNzaW9uX3NldC5uYW1lXG4gICAgICAgIH0sIHtcbiAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgIF9pZDogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgXCLmnYPpmZDnu4TlkI3np7AnXCIgKyBwZXJtaXNzaW9uX3NldC5uYW1lICsgXCIn5LiN6IO96YeN5aSNXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfLmVhY2gocGVybWlzc2lvbl9zZXQuYXNzaWduZWRfYXBwcywgZnVuY3Rpb24oYXBwX2lkKSB7XG4gICAgICAgICAgaWYgKCFfLmluY2x1ZGUoXy5rZXlzKENyZWF0b3IuQXBwcyksIGFwcF9pZCkgJiYgIV8uaW5jbHVkZShpbXBfYXBwX2lkcywgYXBwX2lkKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuadg+mZkOe7hCdcIiArIHBlcm1pc3Npb25fc2V0Lm5hbWUgKyBcIifnmoTmjojmnYPlupTnlKgnXCIgKyBhcHBfaWQgKyBcIifkuI3lrZjlnKhcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoXy5pc0FycmF5KGltcF9kYXRhLnBlcm1pc3Npb25fb2JqZWN0cykgJiYgaW1wX2RhdGEucGVybWlzc2lvbl9vYmplY3RzLmxlbmd0aCA+IDApIHtcbiAgICAgIF8uZWFjaChpbXBfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMsIGZ1bmN0aW9uKHBlcm1pc3Npb25fb2JqZWN0KSB7XG4gICAgICAgIGlmICghcGVybWlzc2lvbl9vYmplY3Qub2JqZWN0X25hbWUgfHwgIV8uaXNTdHJpbmcocGVybWlzc2lvbl9vYmplY3Qub2JqZWN0X25hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuadg+mZkOmbhidcIiArIHBlcm1pc3Npb25fb2JqZWN0Lm5hbWUgKyBcIifnmoRvYmplY3RfbmFtZeWxnuaAp+aXoOaViFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIV8uaW5jbHVkZShvYmplY3RfbmFtZXMsIHBlcm1pc3Npb25fb2JqZWN0Lm9iamVjdF9uYW1lKSAmJiAhXy5pbmNsdWRlKGltcF9vYmplY3RfbmFtZXMsIHBlcm1pc3Npb25fb2JqZWN0Lm9iamVjdF9uYW1lKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLmnYPpmZDpm4YnXCIgKyBsaXN0X3ZpZXcubmFtZSArIFwiJ+S4reaMh+WumueahOWvueixoSdcIiArIHBlcm1pc3Npb25fb2JqZWN0Lm9iamVjdF9uYW1lICsgXCIn5LiN5a2Y5ZyoXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghXy5oYXMocGVybWlzc2lvbl9vYmplY3QsIFwicGVybWlzc2lvbl9zZXRfaWRcIikgfHwgIV8uaXNTdHJpbmcocGVybWlzc2lvbl9vYmplY3QucGVybWlzc2lvbl9zZXRfaWQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuadg+mZkOmbhidcIiArIHBlcm1pc3Npb25fb2JqZWN0Lm5hbWUgKyBcIifnmoRwZXJtaXNzaW9uX3NldF9pZOWxnuaAp+aXoOaViFwiKTtcbiAgICAgICAgfSBlbHNlIGlmICghXy5pbmNsdWRlKHBlcm1pc3Npb25fc2V0X2lkcywgcGVybWlzc2lvbl9vYmplY3QucGVybWlzc2lvbl9zZXRfaWQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuadg+mZkOmbhidcIiArIHBlcm1pc3Npb25fb2JqZWN0Lm5hbWUgKyBcIifmjIflrprnmoTmnYPpmZDnu4QnXCIgKyBwZXJtaXNzaW9uX29iamVjdC5wZXJtaXNzaW9uX3NldF9pZCArIFwiJ+WAvOS4jeWcqOWvvOWFpeeahHBlcm1pc3Npb25fc2V05LitXCIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKF8uaXNBcnJheShpbXBfZGF0YS5yZXBvcnRzKSAmJiBpbXBfZGF0YS5yZXBvcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIF8uZWFjaChpbXBfZGF0YS5yZXBvcnRzLCBmdW5jdGlvbihyZXBvcnQpIHtcbiAgICAgICAgaWYgKCFyZXBvcnQub2JqZWN0X25hbWUgfHwgIV8uaXNTdHJpbmcocmVwb3J0Lm9iamVjdF9uYW1lKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLmiqXooagnXCIgKyByZXBvcnQubmFtZSArIFwiJ+eahG9iamVjdF9uYW1l5bGe5oCn5peg5pWIXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghXy5pbmNsdWRlKG9iamVjdF9uYW1lcywgcmVwb3J0Lm9iamVjdF9uYW1lKSAmJiAhXy5pbmNsdWRlKGltcF9vYmplY3RfbmFtZXMsIHJlcG9ydC5vYmplY3RfbmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5oql6KGoJ1wiICsgcmVwb3J0Lm5hbWUgKyBcIifkuK3mjIflrprnmoTlr7nosaEnXCIgKyByZXBvcnQub2JqZWN0X25hbWUgKyBcIifkuI3lrZjlnKhcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIC8q5pWw5o2u5qCh6aqMIOe7k+adnyAqL1xuXG4gIC8q5pWw5o2u5oyB5LmF5YyWIOW8gOWniyAqL1xuICBhcHBzX2lkX21hcHMgPSB7fTtcbiAgbGlzdF92aWV3c19pZF9tYXBzID0ge307XG4gIHBlcm1pc3Npb25fc2V0X2lkX21hcHMgPSB7fTtcbiAgaWYgKF8uaXNBcnJheShpbXBfZGF0YS5hcHBzKSAmJiBpbXBfZGF0YS5hcHBzLmxlbmd0aCA+IDApIHtcbiAgICBfLmVhY2goaW1wX2RhdGEuYXBwcywgZnVuY3Rpb24oYXBwKSB7XG4gICAgICB2YXIgbmV3X2lkLCBvbGRfaWQ7XG4gICAgICBvbGRfaWQgPSBhcHAuX2lkO1xuICAgICAgZGVsZXRlIGFwcC5faWQ7XG4gICAgICBhcHAuc3BhY2UgPSBzcGFjZV9pZDtcbiAgICAgIGFwcC5vd25lciA9IHVzZXJJZDtcbiAgICAgIGFwcC5pc19jcmVhdG9yID0gdHJ1ZTtcbiAgICAgIG5ld19pZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcHNcIikuaW5zZXJ0KGFwcCk7XG4gICAgICByZXR1cm4gYXBwc19pZF9tYXBzW29sZF9pZF0gPSBuZXdfaWQ7XG4gICAgfSk7XG4gIH1cbiAgaWYgKF8uaXNBcnJheShpbXBfZGF0YS5vYmplY3RzKSAmJiBpbXBfZGF0YS5vYmplY3RzLmxlbmd0aCA+IDApIHtcbiAgICBfLmVhY2goaW1wX2RhdGEub2JqZWN0cywgZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICByZXR1cm4gQ3JlYXRvci5pbXBvcnRPYmplY3QodXNlcklkLCBzcGFjZV9pZCwgb2JqZWN0LCBsaXN0X3ZpZXdzX2lkX21hcHMpO1xuICAgIH0pO1xuICB9XG4gIGlmIChfLmlzQXJyYXkoaW1wX2RhdGEubGlzdF92aWV3cykgJiYgaW1wX2RhdGEubGlzdF92aWV3cy5sZW5ndGggPiAwKSB7XG4gICAgXy5lYWNoKGltcF9kYXRhLmxpc3Rfdmlld3MsIGZ1bmN0aW9uKGxpc3Rfdmlldykge1xuICAgICAgdmFyIF9saXN0X3ZpZXcsIG5ld19pZCwgb2xkX2lkO1xuICAgICAgb2xkX2lkID0gbGlzdF92aWV3Ll9pZDtcbiAgICAgIGRlbGV0ZSBsaXN0X3ZpZXcuX2lkO1xuICAgICAgbGlzdF92aWV3LnNwYWNlID0gc3BhY2VfaWQ7XG4gICAgICBsaXN0X3ZpZXcub3duZXIgPSB1c2VySWQ7XG4gICAgICBpZiAoQ3JlYXRvci5pc0FsbFZpZXcobGlzdF92aWV3KSB8fCBDcmVhdG9yLmlzUmVjZW50VmlldyhsaXN0X3ZpZXcpKSB7XG4gICAgICAgIF9saXN0X3ZpZXcgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfbGlzdHZpZXdzXCIpLmZpbmRPbmUoe1xuICAgICAgICAgIG9iamVjdF9uYW1lOiBsaXN0X3ZpZXcub2JqZWN0X25hbWUsXG4gICAgICAgICAgbmFtZTogbGlzdF92aWV3Lm5hbWUsXG4gICAgICAgICAgc3BhY2U6IHNwYWNlX2lkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgIF9pZDogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChfbGlzdF92aWV3KSB7XG4gICAgICAgICAgbmV3X2lkID0gX2xpc3Rfdmlldy5faWQ7XG4gICAgICAgIH1cbiAgICAgICAgQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS51cGRhdGUoe1xuICAgICAgICAgIG9iamVjdF9uYW1lOiBsaXN0X3ZpZXcub2JqZWN0X25hbWUsXG4gICAgICAgICAgbmFtZTogbGlzdF92aWV3Lm5hbWUsXG4gICAgICAgICAgc3BhY2U6IHNwYWNlX2lkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICAkc2V0OiBsaXN0X3ZpZXdcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdfaWQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfbGlzdHZpZXdzXCIpLmluc2VydChsaXN0X3ZpZXcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGxpc3Rfdmlld3NfaWRfbWFwc1tsaXN0X3ZpZXcub2JqZWN0X25hbWUgKyBcIl9cIiArIG9sZF9pZF0gPSBuZXdfaWQ7XG4gICAgfSk7XG4gIH1cbiAgaWYgKF8uaXNBcnJheShpbXBfZGF0YS5wZXJtaXNzaW9uX3NldCkgJiYgaW1wX2RhdGEucGVybWlzc2lvbl9zZXQubGVuZ3RoID4gMCkge1xuICAgIF8uZWFjaChpbXBfZGF0YS5wZXJtaXNzaW9uX3NldCwgZnVuY3Rpb24ocGVybWlzc2lvbl9zZXQpIHtcbiAgICAgIHZhciBhc3NpZ25lZF9hcHBzLCBuZXdfaWQsIG9sZF9pZCwgcGVybWlzc2lvbl9zZXRfdXNlcnM7XG4gICAgICBvbGRfaWQgPSBwZXJtaXNzaW9uX3NldC5faWQ7XG4gICAgICBkZWxldGUgcGVybWlzc2lvbl9zZXQuX2lkO1xuICAgICAgcGVybWlzc2lvbl9zZXQuc3BhY2UgPSBzcGFjZV9pZDtcbiAgICAgIHBlcm1pc3Npb25fc2V0Lm93bmVyID0gdXNlcklkO1xuICAgICAgcGVybWlzc2lvbl9zZXRfdXNlcnMgPSBbXTtcbiAgICAgIF8uZWFjaChwZXJtaXNzaW9uX3NldC51c2VycywgZnVuY3Rpb24odXNlcl9pZCkge1xuICAgICAgICB2YXIgc3BhY2VfdXNlcjtcbiAgICAgICAgc3BhY2VfdXNlciA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInNwYWNlX3VzZXJzXCIpLmZpbmRPbmUoe1xuICAgICAgICAgIHNwYWNlOiBzcGFjZV9pZCxcbiAgICAgICAgICB1c2VyOiB1c2VyX2lkXG4gICAgICAgIH0sIHtcbiAgICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICAgIF9pZDogMVxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChzcGFjZV91c2VyKSB7XG4gICAgICAgICAgcmV0dXJuIHBlcm1pc3Npb25fc2V0X3VzZXJzLnB1c2godXNlcl9pZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgYXNzaWduZWRfYXBwcyA9IFtdO1xuICAgICAgXy5lYWNoKHBlcm1pc3Npb25fc2V0LmFzc2lnbmVkX2FwcHMsIGZ1bmN0aW9uKGFwcF9pZCkge1xuICAgICAgICBpZiAoXy5pbmNsdWRlKF8ua2V5cyhDcmVhdG9yLkFwcHMpLCBhcHBfaWQpKSB7XG4gICAgICAgICAgcmV0dXJuIGFzc2lnbmVkX2FwcHMucHVzaChhcHBfaWQpO1xuICAgICAgICB9IGVsc2UgaWYgKGFwcHNfaWRfbWFwc1thcHBfaWRdKSB7XG4gICAgICAgICAgcmV0dXJuIGFzc2lnbmVkX2FwcHMucHVzaChhcHBzX2lkX21hcHNbYXBwX2lkXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgbmV3X2lkID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9zZXRcIikuaW5zZXJ0KHBlcm1pc3Npb25fc2V0KTtcbiAgICAgIHJldHVybiBwZXJtaXNzaW9uX3NldF9pZF9tYXBzW29sZF9pZF0gPSBuZXdfaWQ7XG4gICAgfSk7XG4gIH1cbiAgaWYgKF8uaXNBcnJheShpbXBfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMpICYmIGltcF9kYXRhLnBlcm1pc3Npb25fb2JqZWN0cy5sZW5ndGggPiAwKSB7XG4gICAgXy5lYWNoKGltcF9kYXRhLnBlcm1pc3Npb25fb2JqZWN0cywgZnVuY3Rpb24ocGVybWlzc2lvbl9vYmplY3QpIHtcbiAgICAgIHZhciBkaXNhYmxlZF9saXN0X3ZpZXdzO1xuICAgICAgZGVsZXRlIHBlcm1pc3Npb25fb2JqZWN0Ll9pZDtcbiAgICAgIHBlcm1pc3Npb25fb2JqZWN0LnNwYWNlID0gc3BhY2VfaWQ7XG4gICAgICBwZXJtaXNzaW9uX29iamVjdC5vd25lciA9IHVzZXJJZDtcbiAgICAgIHBlcm1pc3Npb25fb2JqZWN0LnBlcm1pc3Npb25fc2V0X2lkID0gcGVybWlzc2lvbl9zZXRfaWRfbWFwc1twZXJtaXNzaW9uX29iamVjdC5wZXJtaXNzaW9uX3NldF9pZF07XG4gICAgICBkaXNhYmxlZF9saXN0X3ZpZXdzID0gW107XG4gICAgICBfLmVhY2gocGVybWlzc2lvbl9vYmplY3QuZGlzYWJsZWRfbGlzdF92aWV3cywgZnVuY3Rpb24obGlzdF92aWV3X2lkKSB7XG4gICAgICAgIHZhciBuZXdfdmlld19pZDtcbiAgICAgICAgbmV3X3ZpZXdfaWQgPSBsaXN0X3ZpZXdzX2lkX21hcHNbcGVybWlzc2lvbl9vYmplY3Qub2JqZWN0X25hbWUgKyBcIl9cIiArIGxpc3Rfdmlld19pZF07XG4gICAgICAgIGlmIChuZXdfdmlld19pZCkge1xuICAgICAgICAgIHJldHVybiBkaXNhYmxlZF9saXN0X3ZpZXdzLnB1c2gobmV3X3ZpZXdfaWQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX29iamVjdHNcIikuaW5zZXJ0KHBlcm1pc3Npb25fb2JqZWN0KTtcbiAgICB9KTtcbiAgfVxuICBpZiAoXy5pc0FycmF5KGltcF9kYXRhLnJlcG9ydHMpICYmIGltcF9kYXRhLnJlcG9ydHMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBfLmVhY2goaW1wX2RhdGEucmVwb3J0cywgZnVuY3Rpb24ocmVwb3J0KSB7XG4gICAgICBkZWxldGUgcmVwb3J0Ll9pZDtcbiAgICAgIHJlcG9ydC5zcGFjZSA9IHNwYWNlX2lkO1xuICAgICAgcmVwb3J0Lm93bmVyID0gdXNlcklkO1xuICAgICAgcmV0dXJuIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInJlcG9ydHNcIikuaW5zZXJ0KHJlcG9ydCk7XG4gICAgfSk7XG4gIH1cblxuICAvKuaVsOaNruaMgeS5heWMliDnu5PmnZ8gKi9cbn07XG5cblxuLyrnlLHkuo7kvb/nlKjmjqXlj6PmlrnlvI/kvJrlr7zoh7Rjb2xsZWN0aW9u55qEYWZ0ZXLjgIFiZWZvcmXkuK3ojrflj5bkuI3liLB1c2VySWTvvIzlho3mraTpl67popjmnKrop6PlhrPkuYvliY3vvIzov5jmmK/kvb/nlKhNZXRob2Rcbkpzb25Sb3V0ZXMuYWRkICdwb3N0JywgJy9hcGkvY3JlYXRvci9hcHBfcGFja2FnZS9pbXBvcnQvOnNwYWNlX2lkJywgKHJlcSwgcmVzLCBuZXh0KSAtPlxuXHR0cnlcblx0XHR1c2VySWQgPSBTdGVlZG9zLmdldFVzZXJJZEZyb21BdXRoVG9rZW4ocmVxLCByZXMpO1xuXHRcdHNwYWNlX2lkID0gcmVxLnBhcmFtcy5zcGFjZV9pZFxuXHRcdGltcF9kYXRhID0gcmVxLmJvZHlcblx0XHRpbXBvcnRfYXBwX3BhY2thZ2UodXNlcklkLCBzcGFjZV9pZCwgaW1wX2RhdGEpXG5cdFx0SnNvblJvdXRlcy5zZW5kUmVzdWx0IHJlcywge1xuXHRcdFx0Y29kZTogMjAwXG5cdFx0XHRkYXRhOiB7fVxuXHRcdH1cblx0Y2F0Y2ggZVxuXHRcdGNvbnNvbGUuZXJyb3IgZS5zdGFja1xuXHRcdEpzb25Sb3V0ZXMuc2VuZFJlc3VsdCByZXMsIHtcblx0XHRcdGNvZGU6IGUuZXJyb3Jcblx0XHRcdGRhdGE6IHsgZXJyb3JzOiBlcnJvck1lc3NhZ2U6IGUucmVhc29uIHx8IGUubWVzc2FnZSB9XG5cdFx0fVxuICovXG5cbk1ldGVvci5tZXRob2RzKHtcbiAgJ2ltcG9ydF9hcHBfcGFja2FnZSc6IGZ1bmN0aW9uKHNwYWNlX2lkLCBpbXBfZGF0YSkge1xuICAgIHZhciB1c2VySWQ7XG4gICAgdXNlcklkID0gdGhpcy51c2VySWQ7XG4gICAgcmV0dXJuIENyZWF0b3IuaW1wb3J0X2FwcF9wYWNrYWdlKHVzZXJJZCwgc3BhY2VfaWQsIGltcF9kYXRhKTtcbiAgfVxufSk7XG4iLCJNZXRlb3IubWV0aG9kc1xyXG5cdFwiY3JlYXRvci5saXN0dmlld3Nfb3B0aW9uc1wiOiAob3B0aW9ucyktPlxyXG5cdFx0aWYgb3B0aW9ucz8ucGFyYW1zPy5yZWZlcmVuY2VfdG9cclxuXHJcblx0XHRcdG9iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KG9wdGlvbnMucGFyYW1zLnJlZmVyZW5jZV90bylcclxuXHJcblx0XHRcdG5hbWVfZmllbGRfa2V5ID0gb2JqZWN0Lk5BTUVfRklFTERfS0VZXHJcblxyXG5cdFx0XHRxdWVyeSA9IHt9XHJcblx0XHRcdGlmIG9wdGlvbnMucGFyYW1zLnNwYWNlXHJcblx0XHRcdFx0cXVlcnkuc3BhY2UgPSBvcHRpb25zLnBhcmFtcy5zcGFjZVxyXG5cclxuXHRcdFx0XHRzb3J0ID0gb3B0aW9ucz8uc29ydFxyXG5cclxuXHRcdFx0XHRzZWxlY3RlZCA9IG9wdGlvbnM/LnNlbGVjdGVkIHx8IFtdXHJcblxyXG5cdFx0XHRcdGlmIG9wdGlvbnMuc2VhcmNoVGV4dFxyXG5cdFx0XHRcdFx0c2VhcmNoVGV4dFF1ZXJ5ID0ge31cclxuXHRcdFx0XHRcdHNlYXJjaFRleHRRdWVyeVtuYW1lX2ZpZWxkX2tleV0gPSB7JHJlZ2V4OiBvcHRpb25zLnNlYXJjaFRleHR9XHJcblxyXG5cdFx0XHRcdGlmIG9wdGlvbnM/LnZhbHVlcz8ubGVuZ3RoXHJcblx0XHRcdFx0XHRpZiBvcHRpb25zLnNlYXJjaFRleHRcclxuXHRcdFx0XHRcdFx0cXVlcnkuJG9yID0gW3tfaWQ6IHskaW46IG9wdGlvbnMudmFsdWVzfX0sIHNlYXJjaFRleHRRdWVyeSwge29iamVjdF9uYW1lOiB7JHJlZ2V4OiBvcHRpb25zLnNlYXJjaFRleHR9fV1cclxuXHRcdFx0XHRcdGVsc2VcclxuXHRcdFx0XHRcdFx0cXVlcnkuJG9yID0gW3tfaWQ6IHskaW46IG9wdGlvbnMudmFsdWVzfX1dXHJcblx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0aWYgb3B0aW9ucy5zZWFyY2hUZXh0XHJcblx0XHRcdFx0XHRcdF8uZXh0ZW5kKHF1ZXJ5LCB7JG9yOiBbc2VhcmNoVGV4dFF1ZXJ5LCAge29iamVjdF9uYW1lOiB7JHJlZ2V4OiBvcHRpb25zLnNlYXJjaFRleHR9fV19KVxyXG5cdFx0XHRcdFx0cXVlcnkuX2lkID0geyRuaW46IHNlbGVjdGVkfVxyXG5cclxuXHRcdFx0XHRjb2xsZWN0aW9uID0gb2JqZWN0LmRiXHJcblxyXG5cdFx0XHRcdGlmIG9wdGlvbnMuZmlsdGVyUXVlcnlcclxuXHRcdFx0XHRcdF8uZXh0ZW5kIHF1ZXJ5LCBvcHRpb25zLmZpbHRlclF1ZXJ5XHJcblxyXG5cdFx0XHRcdHF1ZXJ5X29wdGlvbnMgPSB7bGltaXQ6IDEwfVxyXG5cclxuXHRcdFx0XHRpZiBzb3J0ICYmIF8uaXNPYmplY3Qoc29ydClcclxuXHRcdFx0XHRcdHF1ZXJ5X29wdGlvbnMuc29ydCA9IHNvcnRcclxuXHJcblx0XHRcdFx0aWYgY29sbGVjdGlvblxyXG5cdFx0XHRcdFx0dHJ5XHJcblx0XHRcdFx0XHRcdHJlY29yZHMgPSBjb2xsZWN0aW9uLmZpbmQocXVlcnksIHF1ZXJ5X29wdGlvbnMpLmZldGNoKClcclxuXHRcdFx0XHRcdFx0cmVzdWx0cyA9IFtdXHJcblx0XHRcdFx0XHRcdF8uZWFjaCByZWNvcmRzLCAocmVjb3JkKS0+XHJcblx0XHRcdFx0XHRcdFx0b2JqZWN0X25hbWUgPSBDcmVhdG9yLmdldE9iamVjdChyZWNvcmQub2JqZWN0X25hbWUpPy5uYW1lIHx8IFwiXCJcclxuXHRcdFx0XHRcdFx0XHRpZiAhXy5pc0VtcHR5KG9iamVjdF9uYW1lKVxyXG5cdFx0XHRcdFx0XHRcdFx0b2JqZWN0X25hbWUgPSBcIiAoI3tvYmplY3RfbmFtZX0pXCJcclxuXHJcblx0XHRcdFx0XHRcdFx0cmVzdWx0cy5wdXNoXHJcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogcmVjb3JkW25hbWVfZmllbGRfa2V5XSArIG9iamVjdF9uYW1lXHJcblx0XHRcdFx0XHRcdFx0XHR2YWx1ZTogcmVjb3JkLl9pZFxyXG5cdFx0XHRcdFx0XHRyZXR1cm4gcmVzdWx0c1xyXG5cdFx0XHRcdFx0Y2F0Y2ggZVxyXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yIDUwMCwgZS5tZXNzYWdlICsgXCItLT5cIiArIEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpXHJcblx0XHRyZXR1cm4gW10gIiwiTWV0ZW9yLm1ldGhvZHMoe1xuICBcImNyZWF0b3IubGlzdHZpZXdzX29wdGlvbnNcIjogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgIHZhciBjb2xsZWN0aW9uLCBlLCBuYW1lX2ZpZWxkX2tleSwgb2JqZWN0LCBxdWVyeSwgcXVlcnlfb3B0aW9ucywgcmVjb3JkcywgcmVmLCByZWYxLCByZXN1bHRzLCBzZWFyY2hUZXh0UXVlcnksIHNlbGVjdGVkLCBzb3J0O1xuICAgIGlmIChvcHRpb25zICE9IG51bGwgPyAocmVmID0gb3B0aW9ucy5wYXJhbXMpICE9IG51bGwgPyByZWYucmVmZXJlbmNlX3RvIDogdm9pZCAwIDogdm9pZCAwKSB7XG4gICAgICBvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChvcHRpb25zLnBhcmFtcy5yZWZlcmVuY2VfdG8pO1xuICAgICAgbmFtZV9maWVsZF9rZXkgPSBvYmplY3QuTkFNRV9GSUVMRF9LRVk7XG4gICAgICBxdWVyeSA9IHt9O1xuICAgICAgaWYgKG9wdGlvbnMucGFyYW1zLnNwYWNlKSB7XG4gICAgICAgIHF1ZXJ5LnNwYWNlID0gb3B0aW9ucy5wYXJhbXMuc3BhY2U7XG4gICAgICAgIHNvcnQgPSBvcHRpb25zICE9IG51bGwgPyBvcHRpb25zLnNvcnQgOiB2b2lkIDA7XG4gICAgICAgIHNlbGVjdGVkID0gKG9wdGlvbnMgIT0gbnVsbCA/IG9wdGlvbnMuc2VsZWN0ZWQgOiB2b2lkIDApIHx8IFtdO1xuICAgICAgICBpZiAob3B0aW9ucy5zZWFyY2hUZXh0KSB7XG4gICAgICAgICAgc2VhcmNoVGV4dFF1ZXJ5ID0ge307XG4gICAgICAgICAgc2VhcmNoVGV4dFF1ZXJ5W25hbWVfZmllbGRfa2V5XSA9IHtcbiAgICAgICAgICAgICRyZWdleDogb3B0aW9ucy5zZWFyY2hUZXh0XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucyAhPSBudWxsID8gKHJlZjEgPSBvcHRpb25zLnZhbHVlcykgIT0gbnVsbCA/IHJlZjEubGVuZ3RoIDogdm9pZCAwIDogdm9pZCAwKSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMuc2VhcmNoVGV4dCkge1xuICAgICAgICAgICAgcXVlcnkuJG9yID0gW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICAgICAkaW46IG9wdGlvbnMudmFsdWVzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9LCBzZWFyY2hUZXh0UXVlcnksIHtcbiAgICAgICAgICAgICAgICBvYmplY3RfbmFtZToge1xuICAgICAgICAgICAgICAgICAgJHJlZ2V4OiBvcHRpb25zLnNlYXJjaFRleHRcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHF1ZXJ5LiRvciA9IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIF9pZDoge1xuICAgICAgICAgICAgICAgICAgJGluOiBvcHRpb25zLnZhbHVlc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKG9wdGlvbnMuc2VhcmNoVGV4dCkge1xuICAgICAgICAgICAgXy5leHRlbmQocXVlcnksIHtcbiAgICAgICAgICAgICAgJG9yOiBbXG4gICAgICAgICAgICAgICAgc2VhcmNoVGV4dFF1ZXJ5LCB7XG4gICAgICAgICAgICAgICAgICBvYmplY3RfbmFtZToge1xuICAgICAgICAgICAgICAgICAgICAkcmVnZXg6IG9wdGlvbnMuc2VhcmNoVGV4dFxuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHF1ZXJ5Ll9pZCA9IHtcbiAgICAgICAgICAgICRuaW46IHNlbGVjdGVkXG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBjb2xsZWN0aW9uID0gb2JqZWN0LmRiO1xuICAgICAgICBpZiAob3B0aW9ucy5maWx0ZXJRdWVyeSkge1xuICAgICAgICAgIF8uZXh0ZW5kKHF1ZXJ5LCBvcHRpb25zLmZpbHRlclF1ZXJ5KTtcbiAgICAgICAgfVxuICAgICAgICBxdWVyeV9vcHRpb25zID0ge1xuICAgICAgICAgIGxpbWl0OiAxMFxuICAgICAgICB9O1xuICAgICAgICBpZiAoc29ydCAmJiBfLmlzT2JqZWN0KHNvcnQpKSB7XG4gICAgICAgICAgcXVlcnlfb3B0aW9ucy5zb3J0ID0gc29ydDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29sbGVjdGlvbikge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZWNvcmRzID0gY29sbGVjdGlvbi5maW5kKHF1ZXJ5LCBxdWVyeV9vcHRpb25zKS5mZXRjaCgpO1xuICAgICAgICAgICAgcmVzdWx0cyA9IFtdO1xuICAgICAgICAgICAgXy5lYWNoKHJlY29yZHMsIGZ1bmN0aW9uKHJlY29yZCkge1xuICAgICAgICAgICAgICB2YXIgb2JqZWN0X25hbWUsIHJlZjI7XG4gICAgICAgICAgICAgIG9iamVjdF9uYW1lID0gKChyZWYyID0gQ3JlYXRvci5nZXRPYmplY3QocmVjb3JkLm9iamVjdF9uYW1lKSkgIT0gbnVsbCA/IHJlZjIubmFtZSA6IHZvaWQgMCkgfHwgXCJcIjtcbiAgICAgICAgICAgICAgaWYgKCFfLmlzRW1wdHkob2JqZWN0X25hbWUpKSB7XG4gICAgICAgICAgICAgICAgb2JqZWN0X25hbWUgPSBcIiAoXCIgKyBvYmplY3RfbmFtZSArIFwiKVwiO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybiByZXN1bHRzLnB1c2goe1xuICAgICAgICAgICAgICAgIGxhYmVsOiByZWNvcmRbbmFtZV9maWVsZF9rZXldICsgb2JqZWN0X25hbWUsXG4gICAgICAgICAgICAgICAgdmFsdWU6IHJlY29yZC5faWRcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICBlID0gZXJyb3I7XG4gICAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKDUwMCwgZS5tZXNzYWdlICsgXCItLT5cIiArIEpTT04uc3RyaW5naWZ5KG9wdGlvbnMpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIFtdO1xuICB9XG59KTtcbiIsIiPojrflj5blupTnlKjkuIvnmoTlr7nosaFcclxuZ2V0QXBwT2JqZWN0cyA9IChhcHApLT5cclxuXHRhcHBPYmplY3RzID0gW11cclxuXHRpZiBhcHAgJiYgXy5pc0FycmF5KGFwcC5vYmplY3RzKSAmJiBhcHAub2JqZWN0cy5sZW5ndGggPiAwXHJcblx0XHRfLmVhY2ggYXBwLm9iamVjdHMsIChvYmplY3RfbmFtZSktPlxyXG5cdFx0XHRvYmplY3QgPSBDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSlcclxuXHRcdFx0aWYgb2JqZWN0XHJcblx0XHRcdFx0YXBwT2JqZWN0cy5wdXNoIG9iamVjdF9uYW1lXHJcblx0cmV0dXJuIGFwcE9iamVjdHNcclxuXHJcbiPojrflj5blr7nosaHkuIvnmoTliJfooajop4blm75cclxuZ2V0T2JqZWN0c0xpc3RWaWV3cyA9IChzcGFjZV9pZCwgb2JqZWN0c19uYW1lKS0+XHJcblx0b2JqZWN0c0xpc3RWaWV3cyA9IFtdXHJcblx0aWYgb2JqZWN0c19uYW1lICYmIF8uaXNBcnJheShvYmplY3RzX25hbWUpICYmIG9iamVjdHNfbmFtZS5sZW5ndGggPiAwXHJcblx0XHRfLmVhY2ggb2JqZWN0c19uYW1lLCAob2JqZWN0X25hbWUpLT5cclxuXHRcdFx0I+iOt+WPluWvueixoeeahOWFseS6q+WIl+ihqOinhuWbvmxpc3Rfdmlld3NcclxuXHRcdFx0bGlzdF92aWV3cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikuZmluZCh7b2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLCBzcGFjZTogc3BhY2VfaWQsIHNoYXJlZDogdHJ1ZX0sIHtmaWVsZHM6IHtfaWQ6IDF9fSlcclxuXHRcdFx0bGlzdF92aWV3cy5mb3JFYWNoIChsaXN0X3ZpZXcpLT5cclxuXHRcdFx0XHRvYmplY3RzTGlzdFZpZXdzLnB1c2ggbGlzdF92aWV3Ll9pZFxyXG5cdHJldHVybiBvYmplY3RzTGlzdFZpZXdzXHJcblxyXG4j6I635Y+W5a+56LGh5LiL55qE5oql6KGoXHJcbmdldE9iamVjdHNSZXBvcnRzID0gKHNwYWNlX2lkLCBvYmplY3RzX25hbWUpLT5cclxuXHRvYmplY3RzUmVwb3J0cyA9IFtdXHJcblx0aWYgb2JqZWN0c19uYW1lICYmIF8uaXNBcnJheShvYmplY3RzX25hbWUpICYmIG9iamVjdHNfbmFtZS5sZW5ndGggPiAwXHJcblx0XHRfLmVhY2ggb2JqZWN0c19uYW1lLCAob2JqZWN0X25hbWUpLT5cclxuXHRcdFx0I+iOt+WPluWvueixoeeahOaKpeihqHJlcG9ydHNcclxuXHRcdFx0cmVwb3J0cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInJlcG9ydHNcIikuZmluZCh7b2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLCBzcGFjZTogc3BhY2VfaWR9LCB7ZmllbGRzOiB7X2lkOiAxfX0pXHJcblx0XHRcdHJlcG9ydHMuZm9yRWFjaCAocmVwb3J0KS0+XHJcblx0XHRcdFx0b2JqZWN0c1JlcG9ydHMucHVzaCByZXBvcnQuX2lkXHJcblx0cmV0dXJuIG9iamVjdHNSZXBvcnRzXHJcblxyXG4j6I635Y+W5a+56LGh5LiL55qE5p2D6ZmQ6ZuGXHJcbmdldE9iamVjdHNQZXJtaXNzaW9uT2JqZWN0cyA9IChzcGFjZV9pZCwgb2JqZWN0c19uYW1lKS0+XHJcblx0b2JqZWN0c1Blcm1pc3Npb25PYmplY3RzID0gW11cclxuXHRpZiBvYmplY3RzX25hbWUgJiYgXy5pc0FycmF5KG9iamVjdHNfbmFtZSkgJiYgb2JqZWN0c19uYW1lLmxlbmd0aCA+IDBcclxuXHRcdF8uZWFjaCBvYmplY3RzX25hbWUsIChvYmplY3RfbmFtZSktPlxyXG5cdFx0XHRwZXJtaXNzaW9uX29iamVjdHMgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX29iamVjdHNcIikuZmluZCh7b2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLCBzcGFjZTogc3BhY2VfaWR9LCB7ZmllbGRzOiB7X2lkOiAxfX0pXHJcblx0XHRcdHBlcm1pc3Npb25fb2JqZWN0cy5mb3JFYWNoIChwZXJtaXNzaW9uX29iamVjdCktPlxyXG5cdFx0XHRcdG9iamVjdHNQZXJtaXNzaW9uT2JqZWN0cy5wdXNoIHBlcm1pc3Npb25fb2JqZWN0Ll9pZFxyXG5cdHJldHVybiBvYmplY3RzUGVybWlzc2lvbk9iamVjdHNcclxuXHJcbiPojrflj5blr7nosaHkuIvmnYPpmZDpm4blr7nlupTnmoTmnYPpmZDnu4RcclxuZ2V0T2JqZWN0c1Blcm1pc3Npb25TZXQgPSAoc3BhY2VfaWQsIG9iamVjdHNfbmFtZSktPlxyXG5cdG9iamVjdHNQZXJtaXNzaW9uU2V0ID0gW11cclxuXHRpZiBvYmplY3RzX25hbWUgJiYgXy5pc0FycmF5KG9iamVjdHNfbmFtZSkgJiYgb2JqZWN0c19uYW1lLmxlbmd0aCA+IDBcclxuXHRcdF8uZWFjaCBvYmplY3RzX25hbWUsIChvYmplY3RfbmFtZSktPlxyXG5cdFx0XHRwZXJtaXNzaW9uX29iamVjdHMgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX29iamVjdHNcIikuZmluZCh7b2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLCBzcGFjZTogc3BhY2VfaWR9LCB7ZmllbGRzOiB7cGVybWlzc2lvbl9zZXRfaWQ6IDF9fSlcclxuXHRcdFx0cGVybWlzc2lvbl9vYmplY3RzLmZvckVhY2ggKHBlcm1pc3Npb25fb2JqZWN0KS0+XHJcblx0XHRcdFx0cGVybWlzc2lvbl9zZXQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX3NldFwiKS5maW5kT25lKHtfaWQ6IHBlcm1pc3Npb25fb2JqZWN0LnBlcm1pc3Npb25fc2V0X2lkfSwge2ZpZWxkczoge19pZDogMX19KVxyXG5cdFx0XHRcdG9iamVjdHNQZXJtaXNzaW9uU2V0LnB1c2ggcGVybWlzc2lvbl9zZXQuX2lkXHJcblx0cmV0dXJuIG9iamVjdHNQZXJtaXNzaW9uU2V0XHJcblxyXG5cclxuTWV0ZW9yLm1ldGhvZHNcclxuXHRcImFwcFBhY2thZ2UuaW5pdF9leHBvcnRfZGF0YVwiOiAoc3BhY2VfaWQsIHJlY29yZF9pZCktPlxyXG5cdFx0dXNlcklkID0gdGhpcy51c2VySWRcclxuXHRcdGlmICF1c2VySWRcclxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjQwMVwiLCBcIkF1dGhlbnRpY2F0aW9uIGlzIHJlcXVpcmVkIGFuZCBoYXMgbm90IGJlZW4gcHJvdmlkZWQuXCIpXHJcblxyXG5cdFx0aWYgIUNyZWF0b3IuaXNTcGFjZUFkbWluKHNwYWNlX2lkLCB1c2VySWQpXHJcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI0MDFcIiwgXCJQZXJtaXNzaW9uIGRlbmllZC5cIilcclxuXHJcblx0XHRyZWNvcmQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJhcHBsaWNhdGlvbl9wYWNrYWdlXCIpLmZpbmRPbmUoe19pZDogcmVjb3JkX2lkfSlcclxuXHJcblx0XHRpZiAoIV8uaXNBcnJheShyZWNvcmQ/LmFwcHMpIHx8IHJlY29yZD8uYXBwcz8ubGVuZ3RoIDwgMSkgJiYgKCFfLmlzQXJyYXkocmVjb3JkPy5vYmplY3RzKSB8fCByZWNvcmQ/Lm9iamVjdHM/Lmxlbmd0aCA8IDEpXHJcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLor7flhYjpgInmi6nlupTnlKjmiJbogIXlr7nosaFcIilcclxuXHJcblx0XHRkYXRhID0ge31cclxuXHRcdF9vYmplY3RzID0gcmVjb3JkLm9iamVjdHMgfHwgW11cclxuXHRcdF9vYmplY3RzX2xpc3Rfdmlld3MgPSByZWNvcmQubGlzdF92aWV3cyB8fCBbXVxyXG5cdFx0X29iamVjdHNfcmVwb3J0cyA9IHJlY29yZC5yZXBvcnRzIHx8IFtdXHJcblx0XHRfb2JqZWN0c19wZXJtaXNzaW9uX29iamVjdHMgPSByZWNvcmQucGVybWlzc2lvbl9vYmplY3RzIHx8IFtdXHJcblx0XHRfb2JqZWN0c19wZXJtaXNzaW9uX3NldCA9IHJlY29yZC5wZXJtaXNzaW9uX3NldCB8fCBbXVxyXG5cclxuXHRcdHRyeVxyXG5cdFx0XHRpZiBfLmlzQXJyYXkocmVjb3JkPy5hcHBzKSAmJiByZWNvcmQuYXBwcy5sZW5ndGggPiAwXHJcblx0XHRcdFx0Xy5lYWNoIHJlY29yZC5hcHBzLCAoYXBwSWQpLT5cclxuXHRcdFx0XHRcdGlmICFhcHBcclxuXHRcdFx0XHRcdFx0I+WmguaenOS7juS7o+eggeS4reWumuS5ieeahGFwcHPkuK3msqHmnInmib7liLDvvIzliJnku47mlbDmja7lupPkuK3ojrflj5ZcclxuXHRcdFx0XHRcdFx0YXBwID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiYXBwc1wiKS5maW5kT25lKHtfaWQ6IGFwcElkLCBpc19jcmVhdG9yOiB0cnVlfSwge2ZpZWxkczoge29iamVjdHM6IDF9fSlcclxuXHRcdFx0XHRcdF9vYmplY3RzID0gX29iamVjdHMuY29uY2F0KGdldEFwcE9iamVjdHMoYXBwKSlcclxuXHJcblx0XHRcdGlmIF8uaXNBcnJheShfb2JqZWN0cykgJiYgX29iamVjdHMubGVuZ3RoID4gMFxyXG5cdFx0XHRcdF9vYmplY3RzX2xpc3Rfdmlld3MgPSBfb2JqZWN0c19saXN0X3ZpZXdzLmNvbmNhdChnZXRPYmplY3RzTGlzdFZpZXdzKHNwYWNlX2lkLCBfb2JqZWN0cykpXHJcblx0XHRcdFx0X29iamVjdHNfcmVwb3J0cyA9IF9vYmplY3RzX3JlcG9ydHMuY29uY2F0KGdldE9iamVjdHNSZXBvcnRzKHNwYWNlX2lkLCBfb2JqZWN0cykpXHJcblx0XHRcdFx0X29iamVjdHNfcGVybWlzc2lvbl9vYmplY3RzID0gX29iamVjdHNfcGVybWlzc2lvbl9vYmplY3RzLmNvbmNhdChnZXRPYmplY3RzUGVybWlzc2lvbk9iamVjdHMoc3BhY2VfaWQsIF9vYmplY3RzKSlcclxuXHRcdFx0XHRfb2JqZWN0c19wZXJtaXNzaW9uX3NldCA9IF9vYmplY3RzX3Blcm1pc3Npb25fc2V0LmNvbmNhdChnZXRPYmplY3RzUGVybWlzc2lvblNldChzcGFjZV9pZCwgX29iamVjdHMpKVxyXG5cclxuXHRcdFx0XHRkYXRhLm9iamVjdHMgPSBfLnVuaXEgX29iamVjdHNcclxuXHRcdFx0XHRkYXRhLmxpc3Rfdmlld3MgPSBfLnVuaXEgX29iamVjdHNfbGlzdF92aWV3c1xyXG5cdFx0XHRcdGRhdGEucGVybWlzc2lvbl9zZXQgPSBfLnVuaXEgX29iamVjdHNfcGVybWlzc2lvbl9zZXRcclxuXHRcdFx0XHRkYXRhLnBlcm1pc3Npb25fb2JqZWN0cyA9IF8udW5pcSBfb2JqZWN0c19wZXJtaXNzaW9uX29iamVjdHNcclxuXHRcdFx0XHRkYXRhLnJlcG9ydHMgPSBfLnVuaXEgX29iamVjdHNfcmVwb3J0c1xyXG5cdFx0XHRcdENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcGxpY2F0aW9uX3BhY2thZ2VcIikudXBkYXRlKHtfaWQ6IHJlY29yZC5faWR9LHskc2V0OiBkYXRhfSlcclxuXHRcdGNhdGNoIGVcclxuXHRcdFx0Y29uc29sZS5lcnJvciBlLnN0YWNrXHJcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgZS5yZWFzb24gfHwgZS5tZXNzYWdlICkiLCJ2YXIgZ2V0QXBwT2JqZWN0cywgZ2V0T2JqZWN0c0xpc3RWaWV3cywgZ2V0T2JqZWN0c1Blcm1pc3Npb25PYmplY3RzLCBnZXRPYmplY3RzUGVybWlzc2lvblNldCwgZ2V0T2JqZWN0c1JlcG9ydHM7XG5cbmdldEFwcE9iamVjdHMgPSBmdW5jdGlvbihhcHApIHtcbiAgdmFyIGFwcE9iamVjdHM7XG4gIGFwcE9iamVjdHMgPSBbXTtcbiAgaWYgKGFwcCAmJiBfLmlzQXJyYXkoYXBwLm9iamVjdHMpICYmIGFwcC5vYmplY3RzLmxlbmd0aCA+IDApIHtcbiAgICBfLmVhY2goYXBwLm9iamVjdHMsIGZ1bmN0aW9uKG9iamVjdF9uYW1lKSB7XG4gICAgICB2YXIgb2JqZWN0O1xuICAgICAgb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0X25hbWUpO1xuICAgICAgaWYgKG9iamVjdCkge1xuICAgICAgICByZXR1cm4gYXBwT2JqZWN0cy5wdXNoKG9iamVjdF9uYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICByZXR1cm4gYXBwT2JqZWN0cztcbn07XG5cbmdldE9iamVjdHNMaXN0Vmlld3MgPSBmdW5jdGlvbihzcGFjZV9pZCwgb2JqZWN0c19uYW1lKSB7XG4gIHZhciBvYmplY3RzTGlzdFZpZXdzO1xuICBvYmplY3RzTGlzdFZpZXdzID0gW107XG4gIGlmIChvYmplY3RzX25hbWUgJiYgXy5pc0FycmF5KG9iamVjdHNfbmFtZSkgJiYgb2JqZWN0c19uYW1lLmxlbmd0aCA+IDApIHtcbiAgICBfLmVhY2gob2JqZWN0c19uYW1lLCBmdW5jdGlvbihvYmplY3RfbmFtZSkge1xuICAgICAgdmFyIGxpc3Rfdmlld3M7XG4gICAgICBsaXN0X3ZpZXdzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS5maW5kKHtcbiAgICAgICAgb2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLFxuICAgICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICAgIHNoYXJlZDogdHJ1ZVxuICAgICAgfSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBfaWQ6IDFcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbGlzdF92aWV3cy5mb3JFYWNoKGZ1bmN0aW9uKGxpc3Rfdmlldykge1xuICAgICAgICByZXR1cm4gb2JqZWN0c0xpc3RWaWV3cy5wdXNoKGxpc3Rfdmlldy5faWQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIG9iamVjdHNMaXN0Vmlld3M7XG59O1xuXG5nZXRPYmplY3RzUmVwb3J0cyA9IGZ1bmN0aW9uKHNwYWNlX2lkLCBvYmplY3RzX25hbWUpIHtcbiAgdmFyIG9iamVjdHNSZXBvcnRzO1xuICBvYmplY3RzUmVwb3J0cyA9IFtdO1xuICBpZiAob2JqZWN0c19uYW1lICYmIF8uaXNBcnJheShvYmplY3RzX25hbWUpICYmIG9iamVjdHNfbmFtZS5sZW5ndGggPiAwKSB7XG4gICAgXy5lYWNoKG9iamVjdHNfbmFtZSwgZnVuY3Rpb24ob2JqZWN0X25hbWUpIHtcbiAgICAgIHZhciByZXBvcnRzO1xuICAgICAgcmVwb3J0cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInJlcG9ydHNcIikuZmluZCh7XG4gICAgICAgIG9iamVjdF9uYW1lOiBvYmplY3RfbmFtZSxcbiAgICAgICAgc3BhY2U6IHNwYWNlX2lkXG4gICAgICB9LCB7XG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgIF9pZDogMVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXBvcnRzLmZvckVhY2goZnVuY3Rpb24ocmVwb3J0KSB7XG4gICAgICAgIHJldHVybiBvYmplY3RzUmVwb3J0cy5wdXNoKHJlcG9ydC5faWQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIG9iamVjdHNSZXBvcnRzO1xufTtcblxuZ2V0T2JqZWN0c1Blcm1pc3Npb25PYmplY3RzID0gZnVuY3Rpb24oc3BhY2VfaWQsIG9iamVjdHNfbmFtZSkge1xuICB2YXIgb2JqZWN0c1Blcm1pc3Npb25PYmplY3RzO1xuICBvYmplY3RzUGVybWlzc2lvbk9iamVjdHMgPSBbXTtcbiAgaWYgKG9iamVjdHNfbmFtZSAmJiBfLmlzQXJyYXkob2JqZWN0c19uYW1lKSAmJiBvYmplY3RzX25hbWUubGVuZ3RoID4gMCkge1xuICAgIF8uZWFjaChvYmplY3RzX25hbWUsIGZ1bmN0aW9uKG9iamVjdF9uYW1lKSB7XG4gICAgICB2YXIgcGVybWlzc2lvbl9vYmplY3RzO1xuICAgICAgcGVybWlzc2lvbl9vYmplY3RzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9vYmplY3RzXCIpLmZpbmQoe1xuICAgICAgICBvYmplY3RfbmFtZTogb2JqZWN0X25hbWUsXG4gICAgICAgIHNwYWNlOiBzcGFjZV9pZFxuICAgICAgfSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBfaWQ6IDFcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcGVybWlzc2lvbl9vYmplY3RzLmZvckVhY2goZnVuY3Rpb24ocGVybWlzc2lvbl9vYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdHNQZXJtaXNzaW9uT2JqZWN0cy5wdXNoKHBlcm1pc3Npb25fb2JqZWN0Ll9pZCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gb2JqZWN0c1Blcm1pc3Npb25PYmplY3RzO1xufTtcblxuZ2V0T2JqZWN0c1Blcm1pc3Npb25TZXQgPSBmdW5jdGlvbihzcGFjZV9pZCwgb2JqZWN0c19uYW1lKSB7XG4gIHZhciBvYmplY3RzUGVybWlzc2lvblNldDtcbiAgb2JqZWN0c1Blcm1pc3Npb25TZXQgPSBbXTtcbiAgaWYgKG9iamVjdHNfbmFtZSAmJiBfLmlzQXJyYXkob2JqZWN0c19uYW1lKSAmJiBvYmplY3RzX25hbWUubGVuZ3RoID4gMCkge1xuICAgIF8uZWFjaChvYmplY3RzX25hbWUsIGZ1bmN0aW9uKG9iamVjdF9uYW1lKSB7XG4gICAgICB2YXIgcGVybWlzc2lvbl9vYmplY3RzO1xuICAgICAgcGVybWlzc2lvbl9vYmplY3RzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9vYmplY3RzXCIpLmZpbmQoe1xuICAgICAgICBvYmplY3RfbmFtZTogb2JqZWN0X25hbWUsXG4gICAgICAgIHNwYWNlOiBzcGFjZV9pZFxuICAgICAgfSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBwZXJtaXNzaW9uX3NldF9pZDogMVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBwZXJtaXNzaW9uX29iamVjdHMuZm9yRWFjaChmdW5jdGlvbihwZXJtaXNzaW9uX29iamVjdCkge1xuICAgICAgICB2YXIgcGVybWlzc2lvbl9zZXQ7XG4gICAgICAgIHBlcm1pc3Npb25fc2V0ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9zZXRcIikuZmluZE9uZSh7XG4gICAgICAgICAgX2lkOiBwZXJtaXNzaW9uX29iamVjdC5wZXJtaXNzaW9uX3NldF9pZFxuICAgICAgICB9LCB7XG4gICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICBfaWQ6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gb2JqZWN0c1Blcm1pc3Npb25TZXQucHVzaChwZXJtaXNzaW9uX3NldC5faWQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIG9iamVjdHNQZXJtaXNzaW9uU2V0O1xufTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICBcImFwcFBhY2thZ2UuaW5pdF9leHBvcnRfZGF0YVwiOiBmdW5jdGlvbihzcGFjZV9pZCwgcmVjb3JkX2lkKSB7XG4gICAgdmFyIF9vYmplY3RzLCBfb2JqZWN0c19saXN0X3ZpZXdzLCBfb2JqZWN0c19wZXJtaXNzaW9uX29iamVjdHMsIF9vYmplY3RzX3Blcm1pc3Npb25fc2V0LCBfb2JqZWN0c19yZXBvcnRzLCBkYXRhLCBlLCByZWNvcmQsIHJlZiwgcmVmMSwgdXNlcklkO1xuICAgIHVzZXJJZCA9IHRoaXMudXNlcklkO1xuICAgIGlmICghdXNlcklkKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNDAxXCIsIFwiQXV0aGVudGljYXRpb24gaXMgcmVxdWlyZWQgYW5kIGhhcyBub3QgYmVlbiBwcm92aWRlZC5cIik7XG4gICAgfVxuICAgIGlmICghQ3JlYXRvci5pc1NwYWNlQWRtaW4oc3BhY2VfaWQsIHVzZXJJZCkpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI0MDFcIiwgXCJQZXJtaXNzaW9uIGRlbmllZC5cIik7XG4gICAgfVxuICAgIHJlY29yZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcGxpY2F0aW9uX3BhY2thZ2VcIikuZmluZE9uZSh7XG4gICAgICBfaWQ6IHJlY29yZF9pZFxuICAgIH0pO1xuICAgIGlmICgoIV8uaXNBcnJheShyZWNvcmQgIT0gbnVsbCA/IHJlY29yZC5hcHBzIDogdm9pZCAwKSB8fCAocmVjb3JkICE9IG51bGwgPyAocmVmID0gcmVjb3JkLmFwcHMpICE9IG51bGwgPyByZWYubGVuZ3RoIDogdm9pZCAwIDogdm9pZCAwKSA8IDEpICYmICghXy5pc0FycmF5KHJlY29yZCAhPSBudWxsID8gcmVjb3JkLm9iamVjdHMgOiB2b2lkIDApIHx8IChyZWNvcmQgIT0gbnVsbCA/IChyZWYxID0gcmVjb3JkLm9iamVjdHMpICE9IG51bGwgPyByZWYxLmxlbmd0aCA6IHZvaWQgMCA6IHZvaWQgMCkgPCAxKSkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuivt+WFiOmAieaLqeW6lOeUqOaIluiAheWvueixoVwiKTtcbiAgICB9XG4gICAgZGF0YSA9IHt9O1xuICAgIF9vYmplY3RzID0gcmVjb3JkLm9iamVjdHMgfHwgW107XG4gICAgX29iamVjdHNfbGlzdF92aWV3cyA9IHJlY29yZC5saXN0X3ZpZXdzIHx8IFtdO1xuICAgIF9vYmplY3RzX3JlcG9ydHMgPSByZWNvcmQucmVwb3J0cyB8fCBbXTtcbiAgICBfb2JqZWN0c19wZXJtaXNzaW9uX29iamVjdHMgPSByZWNvcmQucGVybWlzc2lvbl9vYmplY3RzIHx8IFtdO1xuICAgIF9vYmplY3RzX3Blcm1pc3Npb25fc2V0ID0gcmVjb3JkLnBlcm1pc3Npb25fc2V0IHx8IFtdO1xuICAgIHRyeSB7XG4gICAgICBpZiAoXy5pc0FycmF5KHJlY29yZCAhPSBudWxsID8gcmVjb3JkLmFwcHMgOiB2b2lkIDApICYmIHJlY29yZC5hcHBzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgXy5lYWNoKHJlY29yZC5hcHBzLCBmdW5jdGlvbihhcHBJZCkge1xuICAgICAgICAgIHZhciBhcHA7XG4gICAgICAgICAgaWYgKCFhcHApIHtcbiAgICAgICAgICAgIGFwcCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcHNcIikuZmluZE9uZSh7XG4gICAgICAgICAgICAgIF9pZDogYXBwSWQsXG4gICAgICAgICAgICAgIGlzX2NyZWF0b3I6IHRydWVcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgb2JqZWN0czogMVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIF9vYmplY3RzID0gX29iamVjdHMuY29uY2F0KGdldEFwcE9iamVjdHMoYXBwKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKF8uaXNBcnJheShfb2JqZWN0cykgJiYgX29iamVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICBfb2JqZWN0c19saXN0X3ZpZXdzID0gX29iamVjdHNfbGlzdF92aWV3cy5jb25jYXQoZ2V0T2JqZWN0c0xpc3RWaWV3cyhzcGFjZV9pZCwgX29iamVjdHMpKTtcbiAgICAgICAgX29iamVjdHNfcmVwb3J0cyA9IF9vYmplY3RzX3JlcG9ydHMuY29uY2F0KGdldE9iamVjdHNSZXBvcnRzKHNwYWNlX2lkLCBfb2JqZWN0cykpO1xuICAgICAgICBfb2JqZWN0c19wZXJtaXNzaW9uX29iamVjdHMgPSBfb2JqZWN0c19wZXJtaXNzaW9uX29iamVjdHMuY29uY2F0KGdldE9iamVjdHNQZXJtaXNzaW9uT2JqZWN0cyhzcGFjZV9pZCwgX29iamVjdHMpKTtcbiAgICAgICAgX29iamVjdHNfcGVybWlzc2lvbl9zZXQgPSBfb2JqZWN0c19wZXJtaXNzaW9uX3NldC5jb25jYXQoZ2V0T2JqZWN0c1Blcm1pc3Npb25TZXQoc3BhY2VfaWQsIF9vYmplY3RzKSk7XG4gICAgICAgIGRhdGEub2JqZWN0cyA9IF8udW5pcShfb2JqZWN0cyk7XG4gICAgICAgIGRhdGEubGlzdF92aWV3cyA9IF8udW5pcShfb2JqZWN0c19saXN0X3ZpZXdzKTtcbiAgICAgICAgZGF0YS5wZXJtaXNzaW9uX3NldCA9IF8udW5pcShfb2JqZWN0c19wZXJtaXNzaW9uX3NldCk7XG4gICAgICAgIGRhdGEucGVybWlzc2lvbl9vYmplY3RzID0gXy51bmlxKF9vYmplY3RzX3Blcm1pc3Npb25fb2JqZWN0cyk7XG4gICAgICAgIGRhdGEucmVwb3J0cyA9IF8udW5pcShfb2JqZWN0c19yZXBvcnRzKTtcbiAgICAgICAgcmV0dXJuIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcGxpY2F0aW9uX3BhY2thZ2VcIikudXBkYXRlKHtcbiAgICAgICAgICBfaWQ6IHJlY29yZC5faWRcbiAgICAgICAgfSwge1xuICAgICAgICAgICRzZXQ6IGRhdGFcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGUgPSBlcnJvcjtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayk7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIGUucmVhc29uIHx8IGUubWVzc2FnZSk7XG4gICAgfVxuICB9XG59KTtcbiIsIkBBUFRyYW5zZm9ybSA9IHt9XHJcblxyXG5pZ25vcmVfZmllbGRzID0ge1xyXG5cdG93bmVyOiAwLFxyXG5cdHNwYWNlOiAwLFxyXG5cdGNyZWF0ZWQ6IDAsXHJcblx0Y3JlYXRlZF9ieTogMCxcclxuXHRtb2RpZmllZDogMCxcclxuXHRtb2RpZmllZF9ieTogMCxcclxuXHRpc19kZWxldGVkOiAwLFxyXG5cdGluc3RhbmNlczogMCxcclxuXHRzaGFyaW5nOiAwXHJcbn1cclxuXHJcbkFQVHJhbnNmb3JtLmV4cG9ydE9iamVjdCA9IChvYmplY3QpLT5cclxuXHRfb2JqID0ge31cclxuXHJcblx0Xy5leHRlbmQoX29iaiAsIG9iamVjdClcclxuXHJcblx0b2JqX2xpc3Rfdmlld3MgPSB7fVxyXG5cclxuXHRfLmV4dGVuZChvYmpfbGlzdF92aWV3cywgX29iai5saXN0X3ZpZXdzIHx8IHt9KVxyXG5cclxuXHRfLmVhY2ggb2JqX2xpc3Rfdmlld3MsICh2LCBrKS0+XHJcblx0XHRpZiAhXy5oYXModiwgXCJfaWRcIilcclxuXHRcdFx0di5faWQgPSBrXHJcblx0XHRpZiAhXy5oYXModiwgXCJuYW1lXCIpXHJcblx0XHRcdHYubmFtZSA9IGtcclxuXHRfb2JqLmxpc3Rfdmlld3MgPSBvYmpfbGlzdF92aWV3c1xyXG5cclxuXHJcblx0I+WPquS/ruaUuV9vYmrlsZ7mgKfljp9vYmplY3TlsZ7mgKfkv53mjIHkuI3lj5hcclxuXHR0cmlnZ2VycyA9IHt9XHJcblx0Xy5mb3JFYWNoIF9vYmoudHJpZ2dlcnMsICh0cmlnZ2VyLCBrZXkpLT5cclxuXHRcdF90cmlnZ2VyID0ge31cclxuXHRcdF8uZXh0ZW5kKF90cmlnZ2VyLCB0cmlnZ2VyKVxyXG5cdFx0aWYgXy5pc0Z1bmN0aW9uKF90cmlnZ2VyLnRvZG8pXHJcblx0XHRcdF90cmlnZ2VyLnRvZG8gPSBfdHJpZ2dlci50b2RvLnRvU3RyaW5nKClcclxuXHRcdGRlbGV0ZSBfdHJpZ2dlci5fdG9kb1xyXG5cdFx0dHJpZ2dlcnNba2V5XSA9IF90cmlnZ2VyXHJcblx0X29iai50cmlnZ2VycyA9IHRyaWdnZXJzXHJcblxyXG5cdGFjdGlvbnMgPSB7fVxyXG5cdF8uZm9yRWFjaCBfb2JqLmFjdGlvbnMsIChhY3Rpb24sIGtleSktPlxyXG5cdFx0X2FjdGlvbiA9IHt9XHJcblx0XHRfLmV4dGVuZChfYWN0aW9uLCBhY3Rpb24pXHJcblx0XHRpZiBfLmlzRnVuY3Rpb24oX2FjdGlvbi50b2RvKVxyXG5cdFx0XHRfYWN0aW9uLnRvZG8gPSBfYWN0aW9uLnRvZG8udG9TdHJpbmcoKVxyXG5cdFx0ZGVsZXRlIF9hY3Rpb24uX3RvZG9cclxuXHRcdGFjdGlvbnNba2V5XSA9IF9hY3Rpb25cclxuXHJcblx0X29iai5hY3Rpb25zID0gYWN0aW9uc1xyXG5cclxuXHRmaWVsZHMgPSB7fVxyXG5cdF8uZm9yRWFjaCBfb2JqLmZpZWxkcywgKGZpZWxkLCBrZXkpLT5cclxuXHRcdF9maWVsZCA9IHt9XHJcblx0XHRfLmV4dGVuZChfZmllbGQsIGZpZWxkKVxyXG5cdFx0aWYgXy5pc0Z1bmN0aW9uKF9maWVsZC5vcHRpb25zKVxyXG5cdFx0XHRfZmllbGQub3B0aW9ucyA9IF9maWVsZC5vcHRpb25zLnRvU3RyaW5nKClcclxuXHRcdFx0ZGVsZXRlIF9maWVsZC5fb3B0aW9uc1xyXG5cclxuXHRcdGlmIF8uaXNBcnJheShfZmllbGQub3B0aW9ucylcclxuXHRcdFx0X2ZvID0gW11cclxuXHRcdFx0Xy5mb3JFYWNoIF9maWVsZC5vcHRpb25zLCAoX28xKS0+XHJcblx0XHRcdFx0X2ZvLnB1c2goXCIje19vMS5sYWJlbH06I3tfbzEudmFsdWV9XCIpXHJcblx0XHRcdF9maWVsZC5vcHRpb25zID0gX2ZvLmpvaW4oXCIsXCIpXHJcblx0XHRcdGRlbGV0ZSBfZmllbGQuX29wdGlvbnNcclxuXHJcblx0XHRpZiBfZmllbGQucmVnRXhcclxuXHRcdFx0X2ZpZWxkLnJlZ0V4ID0gX2ZpZWxkLnJlZ0V4LnRvU3RyaW5nKClcclxuXHRcdFx0ZGVsZXRlIF9maWVsZC5fcmVnRXhcclxuXHJcblx0XHRpZiBfLmlzRnVuY3Rpb24oX2ZpZWxkLm9wdGlvbnNGdW5jdGlvbilcclxuXHRcdFx0X2ZpZWxkLm9wdGlvbnNGdW5jdGlvbiA9IF9maWVsZC5vcHRpb25zRnVuY3Rpb24udG9TdHJpbmcoKVxyXG5cdFx0XHRkZWxldGUgX2ZpZWxkLl9vcHRpb25zRnVuY3Rpb25cclxuXHJcblx0XHRpZiBfLmlzRnVuY3Rpb24oX2ZpZWxkLnJlZmVyZW5jZV90bylcclxuXHRcdFx0X2ZpZWxkLnJlZmVyZW5jZV90byA9IF9maWVsZC5yZWZlcmVuY2VfdG8udG9TdHJpbmcoKVxyXG5cdFx0XHRkZWxldGUgX2ZpZWxkLl9yZWZlcmVuY2VfdG9cclxuXHJcblx0XHRpZiBfLmlzRnVuY3Rpb24oX2ZpZWxkLmNyZWF0ZUZ1bmN0aW9uKVxyXG5cdFx0XHRfZmllbGQuY3JlYXRlRnVuY3Rpb24gPSBfZmllbGQuY3JlYXRlRnVuY3Rpb24udG9TdHJpbmcoKVxyXG5cdFx0XHRkZWxldGUgX2ZpZWxkLl9jcmVhdGVGdW5jdGlvblxyXG5cclxuXHRcdGlmIF8uaXNGdW5jdGlvbihfZmllbGQuZGVmYXVsdFZhbHVlKVxyXG5cdFx0XHRfZmllbGQuZGVmYXVsdFZhbHVlID0gX2ZpZWxkLmRlZmF1bHRWYWx1ZS50b1N0cmluZygpXHJcblx0XHRcdGRlbGV0ZSBfZmllbGQuX2RlZmF1bHRWYWx1ZVxyXG5cdFx0I1RPRE8g6L2s5o2iZmllbGQuYXV0b2Zvcm0udHlwZe+8jOW3suWSjOacseaAneWYieehruiupO+8jOebruWJjeS4jeaUr+aMgWF1dG9mb3JtLnR5cGUg5Li6ZnVuY3Rpb27nsbvlnotcclxuXHRcdGZpZWxkc1trZXldID0gX2ZpZWxkXHJcblxyXG5cdF9vYmouZmllbGRzID0gZmllbGRzXHJcblxyXG5cdHJldHVybiBfb2JqXHJcblxyXG4jIyNcclxu5a+85Ye65pWw5o2uOlxyXG57XHJcblx0YXBwczpbe31dLCDova/ku7bljIXpgInkuK3nmoRhcHBzXHJcblx0b2JqZWN0czpbe31dLCDpgInkuK3nmoRvYmplY3Tlj4rlhbZmaWVsZHMsIGxpc3Rfdmlld3MsIHRyaWdnZXJzLCBhY3Rpb25zLCBwZXJtaXNzaW9uX3NldOetiVxyXG4gICAgbGlzdF92aWV3czpbe31dLCDova/ku7bljIXpgInkuK3nmoRsaXN0X3ZpZXdzXHJcbiAgICBwZXJtaXNzaW9uczpbe31dLCDova/ku7bljIXpgInkuK3nmoTmnYPpmZDpm4ZcclxuICAgIHBlcm1pc3Npb25fb2JqZWN0czpbe31dLCDova/ku7bljIXpgInkuK3nmoTmnYPpmZDlr7nosaFcclxuICAgIHJlcG9ydHM6W3t9XSDova/ku7bljIXpgInkuK3nmoTmiqXooahcclxufVxyXG4jIyNcclxuQVBUcmFuc2Zvcm0uZXhwb3J0ID0gKHJlY29yZCktPlxyXG5cdGV4cG9ydF9kYXRhID0ge31cclxuXHRpZiBfLmlzQXJyYXkocmVjb3JkLmFwcHMpICYmIHJlY29yZC5hcHBzLmxlbmd0aCA+IDBcclxuXHRcdGV4cG9ydF9kYXRhLmFwcHMgPSBbXVxyXG5cclxuXHRcdF8uZWFjaCByZWNvcmQuYXBwcywgKGFwcEtleSktPlxyXG5cdFx0XHRhcHAgPSB7fVxyXG5cdFx0XHRfLmV4dGVuZChhcHAsIENyZWF0b3IuQXBwc1thcHBLZXldKVxyXG5cdFx0XHRpZiAhYXBwIHx8IF8uaXNFbXB0eShhcHApXHJcblx0XHRcdFx0YXBwID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiYXBwc1wiKS5maW5kT25lKHtfaWQ6IGFwcEtleX0sIHtmaWVsZHM6IGlnbm9yZV9maWVsZHN9KVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0aWYgIV8uaGFzKGFwcCwgXCJfaWRcIilcclxuXHRcdFx0XHRcdGFwcC5faWQgPSBhcHBLZXlcclxuXHRcdFx0aWYgYXBwXHJcblx0XHRcdFx0ZXhwb3J0X2RhdGEuYXBwcy5wdXNoIGFwcFxyXG5cclxuXHRpZiBfLmlzQXJyYXkocmVjb3JkLm9iamVjdHMpICYmIHJlY29yZC5vYmplY3RzLmxlbmd0aCA+IDBcclxuXHRcdGV4cG9ydF9kYXRhLm9iamVjdHMgPSBbXVxyXG5cdFx0Xy5lYWNoIHJlY29yZC5vYmplY3RzLCAob2JqZWN0X25hbWUpLT5cclxuXHRcdFx0b2JqZWN0ID0gQ3JlYXRvci5PYmplY3RzW29iamVjdF9uYW1lXVxyXG5cdFx0XHRpZiBvYmplY3RcclxuXHRcdFx0XHRleHBvcnRfZGF0YS5vYmplY3RzLnB1c2ggQVBUcmFuc2Zvcm0uZXhwb3J0T2JqZWN0KG9iamVjdClcclxuXHJcblx0aWYgXy5pc0FycmF5KHJlY29yZC5saXN0X3ZpZXdzKSAmJiByZWNvcmQubGlzdF92aWV3cy5sZW5ndGggPiAwXHJcblx0XHRleHBvcnRfZGF0YS5saXN0X3ZpZXdzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS5maW5kKHtfaWQ6IHskaW46IHJlY29yZC5saXN0X3ZpZXdzfX0sIHtmaWVsZHM6IGlnbm9yZV9maWVsZHN9KS5mZXRjaCgpXHJcblxyXG5cdGlmIF8uaXNBcnJheShyZWNvcmQucGVybWlzc2lvbl9zZXQpICYmIHJlY29yZC5wZXJtaXNzaW9uX3NldC5sZW5ndGggPiAwXHJcblx0XHRleHBvcnRfZGF0YS5wZXJtaXNzaW9uX3NldCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmQoe19pZDogeyRpbjogcmVjb3JkLnBlcm1pc3Npb25fc2V0fX0sIHtmaWVsZHM6IGlnbm9yZV9maWVsZHN9KS5mZXRjaCgpXHJcblxyXG5cdGlmIF8uaXNBcnJheShyZWNvcmQucGVybWlzc2lvbl9vYmplY3RzKSAmJiByZWNvcmQucGVybWlzc2lvbl9vYmplY3RzLmxlbmd0aCA+IDBcclxuXHRcdGV4cG9ydF9kYXRhLnBlcm1pc3Npb25fb2JqZWN0cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fb2JqZWN0c1wiKS5maW5kKHtfaWQ6IHskaW46IHJlY29yZC5wZXJtaXNzaW9uX29iamVjdHN9fSwge2ZpZWxkczogaWdub3JlX2ZpZWxkc30pLmZldGNoKClcclxuXHJcblx0aWYgXy5pc0FycmF5KHJlY29yZC5yZXBvcnRzKSAmJiByZWNvcmQucmVwb3J0cy5sZW5ndGggPiAwXHJcblx0XHRleHBvcnRfZGF0YS5yZXBvcnRzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicmVwb3J0c1wiKS5maW5kKHtfaWQ6IHskaW46IHJlY29yZC5yZXBvcnRzfX0sIHtmaWVsZHM6IGlnbm9yZV9maWVsZHN9KS5mZXRjaCgpXHJcblxyXG5cdHJldHVybiBleHBvcnRfZGF0YVxyXG4iLCJ2YXIgaWdub3JlX2ZpZWxkcztcblxudGhpcy5BUFRyYW5zZm9ybSA9IHt9O1xuXG5pZ25vcmVfZmllbGRzID0ge1xuICBvd25lcjogMCxcbiAgc3BhY2U6IDAsXG4gIGNyZWF0ZWQ6IDAsXG4gIGNyZWF0ZWRfYnk6IDAsXG4gIG1vZGlmaWVkOiAwLFxuICBtb2RpZmllZF9ieTogMCxcbiAgaXNfZGVsZXRlZDogMCxcbiAgaW5zdGFuY2VzOiAwLFxuICBzaGFyaW5nOiAwXG59O1xuXG5BUFRyYW5zZm9ybS5leHBvcnRPYmplY3QgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgdmFyIF9vYmosIGFjdGlvbnMsIGZpZWxkcywgb2JqX2xpc3Rfdmlld3MsIHRyaWdnZXJzO1xuICBfb2JqID0ge307XG4gIF8uZXh0ZW5kKF9vYmosIG9iamVjdCk7XG4gIG9ial9saXN0X3ZpZXdzID0ge307XG4gIF8uZXh0ZW5kKG9ial9saXN0X3ZpZXdzLCBfb2JqLmxpc3Rfdmlld3MgfHwge30pO1xuICBfLmVhY2gob2JqX2xpc3Rfdmlld3MsIGZ1bmN0aW9uKHYsIGspIHtcbiAgICBpZiAoIV8uaGFzKHYsIFwiX2lkXCIpKSB7XG4gICAgICB2Ll9pZCA9IGs7XG4gICAgfVxuICAgIGlmICghXy5oYXModiwgXCJuYW1lXCIpKSB7XG4gICAgICByZXR1cm4gdi5uYW1lID0gaztcbiAgICB9XG4gIH0pO1xuICBfb2JqLmxpc3Rfdmlld3MgPSBvYmpfbGlzdF92aWV3cztcbiAgdHJpZ2dlcnMgPSB7fTtcbiAgXy5mb3JFYWNoKF9vYmoudHJpZ2dlcnMsIGZ1bmN0aW9uKHRyaWdnZXIsIGtleSkge1xuICAgIHZhciBfdHJpZ2dlcjtcbiAgICBfdHJpZ2dlciA9IHt9O1xuICAgIF8uZXh0ZW5kKF90cmlnZ2VyLCB0cmlnZ2VyKTtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKF90cmlnZ2VyLnRvZG8pKSB7XG4gICAgICBfdHJpZ2dlci50b2RvID0gX3RyaWdnZXIudG9kby50b1N0cmluZygpO1xuICAgIH1cbiAgICBkZWxldGUgX3RyaWdnZXIuX3RvZG87XG4gICAgcmV0dXJuIHRyaWdnZXJzW2tleV0gPSBfdHJpZ2dlcjtcbiAgfSk7XG4gIF9vYmoudHJpZ2dlcnMgPSB0cmlnZ2VycztcbiAgYWN0aW9ucyA9IHt9O1xuICBfLmZvckVhY2goX29iai5hY3Rpb25zLCBmdW5jdGlvbihhY3Rpb24sIGtleSkge1xuICAgIHZhciBfYWN0aW9uO1xuICAgIF9hY3Rpb24gPSB7fTtcbiAgICBfLmV4dGVuZChfYWN0aW9uLCBhY3Rpb24pO1xuICAgIGlmIChfLmlzRnVuY3Rpb24oX2FjdGlvbi50b2RvKSkge1xuICAgICAgX2FjdGlvbi50b2RvID0gX2FjdGlvbi50b2RvLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIGRlbGV0ZSBfYWN0aW9uLl90b2RvO1xuICAgIHJldHVybiBhY3Rpb25zW2tleV0gPSBfYWN0aW9uO1xuICB9KTtcbiAgX29iai5hY3Rpb25zID0gYWN0aW9ucztcbiAgZmllbGRzID0ge307XG4gIF8uZm9yRWFjaChfb2JqLmZpZWxkcywgZnVuY3Rpb24oZmllbGQsIGtleSkge1xuICAgIHZhciBfZmllbGQsIF9mbztcbiAgICBfZmllbGQgPSB7fTtcbiAgICBfLmV4dGVuZChfZmllbGQsIGZpZWxkKTtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKF9maWVsZC5vcHRpb25zKSkge1xuICAgICAgX2ZpZWxkLm9wdGlvbnMgPSBfZmllbGQub3B0aW9ucy50b1N0cmluZygpO1xuICAgICAgZGVsZXRlIF9maWVsZC5fb3B0aW9ucztcbiAgICB9XG4gICAgaWYgKF8uaXNBcnJheShfZmllbGQub3B0aW9ucykpIHtcbiAgICAgIF9mbyA9IFtdO1xuICAgICAgXy5mb3JFYWNoKF9maWVsZC5vcHRpb25zLCBmdW5jdGlvbihfbzEpIHtcbiAgICAgICAgcmV0dXJuIF9mby5wdXNoKF9vMS5sYWJlbCArIFwiOlwiICsgX28xLnZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgX2ZpZWxkLm9wdGlvbnMgPSBfZm8uam9pbihcIixcIik7XG4gICAgICBkZWxldGUgX2ZpZWxkLl9vcHRpb25zO1xuICAgIH1cbiAgICBpZiAoX2ZpZWxkLnJlZ0V4KSB7XG4gICAgICBfZmllbGQucmVnRXggPSBfZmllbGQucmVnRXgudG9TdHJpbmcoKTtcbiAgICAgIGRlbGV0ZSBfZmllbGQuX3JlZ0V4O1xuICAgIH1cbiAgICBpZiAoXy5pc0Z1bmN0aW9uKF9maWVsZC5vcHRpb25zRnVuY3Rpb24pKSB7XG4gICAgICBfZmllbGQub3B0aW9uc0Z1bmN0aW9uID0gX2ZpZWxkLm9wdGlvbnNGdW5jdGlvbi50b1N0cmluZygpO1xuICAgICAgZGVsZXRlIF9maWVsZC5fb3B0aW9uc0Z1bmN0aW9uO1xuICAgIH1cbiAgICBpZiAoXy5pc0Z1bmN0aW9uKF9maWVsZC5yZWZlcmVuY2VfdG8pKSB7XG4gICAgICBfZmllbGQucmVmZXJlbmNlX3RvID0gX2ZpZWxkLnJlZmVyZW5jZV90by50b1N0cmluZygpO1xuICAgICAgZGVsZXRlIF9maWVsZC5fcmVmZXJlbmNlX3RvO1xuICAgIH1cbiAgICBpZiAoXy5pc0Z1bmN0aW9uKF9maWVsZC5jcmVhdGVGdW5jdGlvbikpIHtcbiAgICAgIF9maWVsZC5jcmVhdGVGdW5jdGlvbiA9IF9maWVsZC5jcmVhdGVGdW5jdGlvbi50b1N0cmluZygpO1xuICAgICAgZGVsZXRlIF9maWVsZC5fY3JlYXRlRnVuY3Rpb247XG4gICAgfVxuICAgIGlmIChfLmlzRnVuY3Rpb24oX2ZpZWxkLmRlZmF1bHRWYWx1ZSkpIHtcbiAgICAgIF9maWVsZC5kZWZhdWx0VmFsdWUgPSBfZmllbGQuZGVmYXVsdFZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICBkZWxldGUgX2ZpZWxkLl9kZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHNba2V5XSA9IF9maWVsZDtcbiAgfSk7XG4gIF9vYmouZmllbGRzID0gZmllbGRzO1xuICByZXR1cm4gX29iajtcbn07XG5cblxuLypcbuWvvOWHuuaVsOaNrjpcbntcblx0YXBwczpbe31dLCDova/ku7bljIXpgInkuK3nmoRhcHBzXG5cdG9iamVjdHM6W3t9XSwg6YCJ5Lit55qEb2JqZWN05Y+K5YW2ZmllbGRzLCBsaXN0X3ZpZXdzLCB0cmlnZ2VycywgYWN0aW9ucywgcGVybWlzc2lvbl9zZXTnrYlcbiAgICBsaXN0X3ZpZXdzOlt7fV0sIOi9r+S7tuWMhemAieS4reeahGxpc3Rfdmlld3NcbiAgICBwZXJtaXNzaW9uczpbe31dLCDova/ku7bljIXpgInkuK3nmoTmnYPpmZDpm4ZcbiAgICBwZXJtaXNzaW9uX29iamVjdHM6W3t9XSwg6L2v5Lu25YyF6YCJ5Lit55qE5p2D6ZmQ5a+56LGhXG4gICAgcmVwb3J0czpbe31dIOi9r+S7tuWMhemAieS4reeahOaKpeihqFxufVxuICovXG5cbkFQVHJhbnNmb3JtW1wiZXhwb3J0XCJdID0gZnVuY3Rpb24ocmVjb3JkKSB7XG4gIHZhciBleHBvcnRfZGF0YTtcbiAgZXhwb3J0X2RhdGEgPSB7fTtcbiAgaWYgKF8uaXNBcnJheShyZWNvcmQuYXBwcykgJiYgcmVjb3JkLmFwcHMubGVuZ3RoID4gMCkge1xuICAgIGV4cG9ydF9kYXRhLmFwcHMgPSBbXTtcbiAgICBfLmVhY2gocmVjb3JkLmFwcHMsIGZ1bmN0aW9uKGFwcEtleSkge1xuICAgICAgdmFyIGFwcDtcbiAgICAgIGFwcCA9IHt9O1xuICAgICAgXy5leHRlbmQoYXBwLCBDcmVhdG9yLkFwcHNbYXBwS2V5XSk7XG4gICAgICBpZiAoIWFwcCB8fCBfLmlzRW1wdHkoYXBwKSkge1xuICAgICAgICBhcHAgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJhcHBzXCIpLmZpbmRPbmUoe1xuICAgICAgICAgIF9pZDogYXBwS2V5XG4gICAgICAgIH0sIHtcbiAgICAgICAgICBmaWVsZHM6IGlnbm9yZV9maWVsZHNcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIV8uaGFzKGFwcCwgXCJfaWRcIikpIHtcbiAgICAgICAgICBhcHAuX2lkID0gYXBwS2V5O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoYXBwKSB7XG4gICAgICAgIHJldHVybiBleHBvcnRfZGF0YS5hcHBzLnB1c2goYXBwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBpZiAoXy5pc0FycmF5KHJlY29yZC5vYmplY3RzKSAmJiByZWNvcmQub2JqZWN0cy5sZW5ndGggPiAwKSB7XG4gICAgZXhwb3J0X2RhdGEub2JqZWN0cyA9IFtdO1xuICAgIF8uZWFjaChyZWNvcmQub2JqZWN0cywgZnVuY3Rpb24ob2JqZWN0X25hbWUpIHtcbiAgICAgIHZhciBvYmplY3Q7XG4gICAgICBvYmplY3QgPSBDcmVhdG9yLk9iamVjdHNbb2JqZWN0X25hbWVdO1xuICAgICAgaWYgKG9iamVjdCkge1xuICAgICAgICByZXR1cm4gZXhwb3J0X2RhdGEub2JqZWN0cy5wdXNoKEFQVHJhbnNmb3JtLmV4cG9ydE9iamVjdChvYmplY3QpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBpZiAoXy5pc0FycmF5KHJlY29yZC5saXN0X3ZpZXdzKSAmJiByZWNvcmQubGlzdF92aWV3cy5sZW5ndGggPiAwKSB7XG4gICAgZXhwb3J0X2RhdGEubGlzdF92aWV3cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikuZmluZCh7XG4gICAgICBfaWQ6IHtcbiAgICAgICAgJGluOiByZWNvcmQubGlzdF92aWV3c1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGZpZWxkczogaWdub3JlX2ZpZWxkc1xuICAgIH0pLmZldGNoKCk7XG4gIH1cbiAgaWYgKF8uaXNBcnJheShyZWNvcmQucGVybWlzc2lvbl9zZXQpICYmIHJlY29yZC5wZXJtaXNzaW9uX3NldC5sZW5ndGggPiAwKSB7XG4gICAgZXhwb3J0X2RhdGEucGVybWlzc2lvbl9zZXQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX3NldFwiKS5maW5kKHtcbiAgICAgIF9pZDoge1xuICAgICAgICAkaW46IHJlY29yZC5wZXJtaXNzaW9uX3NldFxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGZpZWxkczogaWdub3JlX2ZpZWxkc1xuICAgIH0pLmZldGNoKCk7XG4gIH1cbiAgaWYgKF8uaXNBcnJheShyZWNvcmQucGVybWlzc2lvbl9vYmplY3RzKSAmJiByZWNvcmQucGVybWlzc2lvbl9vYmplY3RzLmxlbmd0aCA+IDApIHtcbiAgICBleHBvcnRfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX29iamVjdHNcIikuZmluZCh7XG4gICAgICBfaWQ6IHtcbiAgICAgICAgJGluOiByZWNvcmQucGVybWlzc2lvbl9vYmplY3RzXG4gICAgICB9XG4gICAgfSwge1xuICAgICAgZmllbGRzOiBpZ25vcmVfZmllbGRzXG4gICAgfSkuZmV0Y2goKTtcbiAgfVxuICBpZiAoXy5pc0FycmF5KHJlY29yZC5yZXBvcnRzKSAmJiByZWNvcmQucmVwb3J0cy5sZW5ndGggPiAwKSB7XG4gICAgZXhwb3J0X2RhdGEucmVwb3J0cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInJlcG9ydHNcIikuZmluZCh7XG4gICAgICBfaWQ6IHtcbiAgICAgICAgJGluOiByZWNvcmQucmVwb3J0c1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGZpZWxkczogaWdub3JlX2ZpZWxkc1xuICAgIH0pLmZldGNoKCk7XG4gIH1cbiAgcmV0dXJuIGV4cG9ydF9kYXRhO1xufTtcbiJdfQ==
