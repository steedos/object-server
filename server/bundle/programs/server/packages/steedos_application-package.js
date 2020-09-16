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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hcHBsaWNhdGlvbi1wYWNrYWdlL21vZGVscy9hcHBsaWNhdGlvbl9wYWNrYWdlLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvbW9kZWxzL2FwcGxpY2F0aW9uX3BhY2thZ2UuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2FwcGxpY2F0aW9uLXBhY2thZ2Uvc2VydmVyL3JvdXRlcy9leHBvcnQuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9zZXJ2ZXIvcm91dGVzL2V4cG9ydC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3BhY2thZ2VzL3N0ZWVkb3NfYXBwbGljYXRpb24tcGFja2FnZS9zZXJ2ZXIvcm91dGVzL2ltcG9ydC5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9yb3V0ZXMvaW1wb3J0LmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hcHBsaWNhdGlvbi1wYWNrYWdlL3NlcnZlci9tZXRob2RzL2xpc3R2aWV3c19vcHRpb25zLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvc2VydmVyL21ldGhvZHMvbGlzdHZpZXdzX29wdGlvbnMuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2FwcGxpY2F0aW9uLXBhY2thZ2Uvc2VydmVyL21ldGhvZHMvaW5pdF9leHBvcnRfZGF0YS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL3NlcnZlci9tZXRob2RzL2luaXRfZXhwb3J0X2RhdGEuY29mZmVlIiwibWV0ZW9yOi8v8J+Su2FwcC9wYWNrYWdlcy9zdGVlZG9zX2FwcGxpY2F0aW9uLXBhY2thZ2UvbGliL3RyYW5zZm9ybS5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi90cmFuc2Zvcm0uY29mZmVlIl0sIm5hbWVzIjpbIkNyZWF0b3IiLCJPYmplY3RzIiwiYXBwbGljYXRpb25fcGFja2FnZSIsIm5hbWUiLCJpY29uIiwibGFiZWwiLCJmaWVsZHMiLCJ0eXBlIiwiYXBwcyIsInJlZmVyZW5jZV90byIsIm11bHRpcGxlIiwib3B0aW9uc0Z1bmN0aW9uIiwiX29wdGlvbnMiLCJfIiwiZm9yRWFjaCIsIkFwcHMiLCJvIiwiayIsInB1c2giLCJ2YWx1ZSIsImljb25fc2xkcyIsIm9iamVjdHMiLCJvYmplY3RzQnlOYW1lIiwiaGlkZGVuIiwibGlzdF92aWV3cyIsIm9wdGlvbnNNZXRob2QiLCJwZXJtaXNzaW9uX3NldCIsInBlcm1pc3Npb25fb2JqZWN0cyIsInJlcG9ydHMiLCJhbGwiLCJjb2x1bW5zIiwiZmlsdGVyX3Njb3BlIiwiYWN0aW9ucyIsImluaXRfZGF0YSIsInZpc2libGUiLCJvbiIsInRvZG8iLCJvYmplY3RfbmFtZSIsInJlY29yZF9pZCIsImNvbnNvbGUiLCJsb2ciLCJNZXRlb3IiLCJjYWxsIiwiU2Vzc2lvbiIsImdldCIsImVycm9yIiwicmVzdWx0IiwidG9hc3RyIiwicmVhc29uIiwic3VjY2VzcyIsInVybCIsIlN0ZWVkb3MiLCJhYnNvbHV0ZVVybCIsIndpbmRvdyIsIm9wZW4iLCJNb2RhbCIsInNob3ciLCJKc29uUm91dGVzIiwiYWRkIiwicmVxIiwicmVzIiwibmV4dCIsImRhdGEiLCJlIiwiZmlsZU5hbWUiLCJyZWNvcmQiLCJzcGFjZV9pZCIsInNwYWNlX3VzZXIiLCJ1c2VySWQiLCJnZXRVc2VySWRGcm9tQXV0aFRva2VuIiwic2VuZFJlc3VsdCIsImNvZGUiLCJlcnJvcnMiLCJwYXJhbXMiLCJpc1NwYWNlQWRtaW4iLCJnZXRDb2xsZWN0aW9uIiwiZmluZE9uZSIsIl9pZCIsInVzZXIiLCJzcGFjZSIsIkFQVHJhbnNmb3JtIiwiZGF0YVNvdXJjZSIsInNldEhlYWRlciIsImVuY29kZVVSSSIsImVuZCIsIkpTT04iLCJzdHJpbmdpZnkiLCJzdGFjayIsIm1lc3NhZ2UiLCJ0cmFuc2Zvcm1GaWVsZE9wdGlvbnMiLCJ0cmFuc2Zvcm1GaWx0ZXJzIiwiZmlsdGVycyIsIl9maWx0ZXJzIiwiZWFjaCIsImYiLCJpc0FycmF5IiwibGVuZ3RoIiwiZmllbGQiLCJvcGVyYXRpb24iLCJvcHRpb25zIiwiaGFzIiwiam9pbiIsImltcG9ydE9iamVjdCIsIm9iamVjdCIsImxpc3Rfdmlld3NfaWRfbWFwcyIsIl9maWVsZG5hbWVzIiwiaGFzUmVjZW50VmlldyIsImludGVybmFsX2xpc3RfdmlldyIsIm9ial9saXN0X3ZpZXdzIiwidHJpZ2dlcnMiLCJwZXJtaXNzaW9ucyIsIm93bmVyIiwiaW5zZXJ0IiwibGlzdF92aWV3IiwibmV3X2lkIiwib2xkX2lkIiwiaXNSZWNlbnRWaWV3IiwiaXNBbGxWaWV3IiwiJHNldCIsIiR1bnNldCIsInVwZGF0ZSIsInJlbW92ZSIsImNvbnRhaW5zIiwiZGlyZWN0IiwidHJpZ2dlciIsInJlcGxhY2UiLCJSZWdFeHAiLCJpc19lbmFibGUiLCJhY3Rpb24iLCJpbXBvcnRfYXBwX3BhY2thZ2UiLCJpbXBfZGF0YSIsImZyb21fdGVtcGxhdGUiLCJhcHBzX2lkX21hcHMiLCJpbXBfYXBwX2lkcyIsImltcF9vYmplY3RfbmFtZXMiLCJvYmplY3RfbmFtZXMiLCJwZXJtaXNzaW9uX3NldF9pZF9tYXBzIiwicGVybWlzc2lvbl9zZXRfaWRzIiwiRXJyb3IiLCJjaGVjayIsIk9iamVjdCIsInBsdWNrIiwiYXBwIiwiaW5jbHVkZSIsImtleXMiLCJpc0xlZ2FsVmVyc2lvbiIsImlzU3RyaW5nIiwiYXNzaWduZWRfYXBwcyIsImFwcF9pZCIsInBlcm1pc3Npb25fb2JqZWN0IiwicGVybWlzc2lvbl9zZXRfaWQiLCJyZXBvcnQiLCJpc19jcmVhdG9yIiwiX2xpc3RfdmlldyIsInBlcm1pc3Npb25fc2V0X3VzZXJzIiwidXNlcnMiLCJ1c2VyX2lkIiwiZGlzYWJsZWRfbGlzdF92aWV3cyIsImxpc3Rfdmlld19pZCIsIm5ld192aWV3X2lkIiwibWV0aG9kcyIsImNvbGxlY3Rpb24iLCJuYW1lX2ZpZWxkX2tleSIsInF1ZXJ5IiwicXVlcnlfb3B0aW9ucyIsInJlY29yZHMiLCJyZWYiLCJyZWYxIiwicmVzdWx0cyIsInNlYXJjaFRleHRRdWVyeSIsInNlbGVjdGVkIiwic29ydCIsImdldE9iamVjdCIsIk5BTUVfRklFTERfS0VZIiwic2VhcmNoVGV4dCIsIiRyZWdleCIsInZhbHVlcyIsIiRvciIsIiRpbiIsImV4dGVuZCIsIiRuaW4iLCJkYiIsImZpbHRlclF1ZXJ5IiwibGltaXQiLCJpc09iamVjdCIsImZpbmQiLCJmZXRjaCIsInJlZjIiLCJpc0VtcHR5IiwiZ2V0QXBwT2JqZWN0cyIsImdldE9iamVjdHNMaXN0Vmlld3MiLCJnZXRPYmplY3RzUGVybWlzc2lvbk9iamVjdHMiLCJnZXRPYmplY3RzUGVybWlzc2lvblNldCIsImdldE9iamVjdHNSZXBvcnRzIiwiYXBwT2JqZWN0cyIsIm9iamVjdHNfbmFtZSIsIm9iamVjdHNMaXN0Vmlld3MiLCJzaGFyZWQiLCJvYmplY3RzUmVwb3J0cyIsIm9iamVjdHNQZXJtaXNzaW9uT2JqZWN0cyIsIm9iamVjdHNQZXJtaXNzaW9uU2V0IiwiX29iamVjdHMiLCJfb2JqZWN0c19saXN0X3ZpZXdzIiwiX29iamVjdHNfcGVybWlzc2lvbl9vYmplY3RzIiwiX29iamVjdHNfcGVybWlzc2lvbl9zZXQiLCJfb2JqZWN0c19yZXBvcnRzIiwiYXBwSWQiLCJjb25jYXQiLCJ1bmlxIiwiaWdub3JlX2ZpZWxkcyIsImNyZWF0ZWQiLCJjcmVhdGVkX2J5IiwibW9kaWZpZWQiLCJtb2RpZmllZF9ieSIsImlzX2RlbGV0ZWQiLCJpbnN0YW5jZXMiLCJzaGFyaW5nIiwiZXhwb3J0T2JqZWN0IiwiX29iaiIsInYiLCJrZXkiLCJfdHJpZ2dlciIsImlzRnVuY3Rpb24iLCJ0b1N0cmluZyIsIl90b2RvIiwiX2FjdGlvbiIsIl9maWVsZCIsIl9mbyIsIl9vMSIsInJlZ0V4IiwiX3JlZ0V4IiwiX29wdGlvbnNGdW5jdGlvbiIsIl9yZWZlcmVuY2VfdG8iLCJjcmVhdGVGdW5jdGlvbiIsIl9jcmVhdGVGdW5jdGlvbiIsImRlZmF1bHRWYWx1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LGdCQUFZbk4sY0FBWixHQUE2QjFCLFFBQVEyRSxhQUFSLENBQXNCLGdCQUF0QixFQUF3QzhHLElBQXhDLENBQTZDO0FBQUM1RyxXQUFLO0FBQUNxRyxhQUFLakgsT0FBT3ZDO0FBQWI7QUFBTixLQUE3QyxFQUFrRjtBQUFDcEIsY0FBUTJNO0FBQVQsS0FBbEYsRUFBMkd2QixLQUEzRyxFQUE3QjtBQytCQzs7QUQ3QkYsTUFBRzdLLEVBQUVrRixPQUFGLENBQVU5QixPQUFPdEMsa0JBQWpCLEtBQXdDc0MsT0FBT3RDLGtCQUFQLENBQTBCcUUsTUFBMUIsR0FBbUMsQ0FBOUU7QUFDQzZJLGdCQUFZbE4sa0JBQVosR0FBaUMzQixRQUFRMkUsYUFBUixDQUFzQixvQkFBdEIsRUFBNEM4RyxJQUE1QyxDQUFpRDtBQUFDNUcsV0FBSztBQUFDcUcsYUFBS2pILE9BQU90QztBQUFiO0FBQU4sS0FBakQsRUFBMEY7QUFBQ3JCLGNBQVEyTTtBQUFULEtBQTFGLEVBQW1IdkIsS0FBbkgsRUFBakM7QUNxQ0M7O0FEbkNGLE1BQUc3SyxFQUFFa0YsT0FBRixDQUFVOUIsT0FBT3JDLE9BQWpCLEtBQTZCcUMsT0FBT3JDLE9BQVAsQ0FBZW9FLE1BQWYsR0FBd0IsQ0FBeEQ7QUFDQzZJLGdCQUFZak4sT0FBWixHQUFzQjVCLFFBQVEyRSxhQUFSLENBQXNCLFNBQXRCLEVBQWlDOEcsSUFBakMsQ0FBc0M7QUFBQzVHLFdBQUs7QUFBQ3FHLGFBQUtqSCxPQUFPckM7QUFBYjtBQUFOLEtBQXRDLEVBQW9FO0FBQUN0QixjQUFRMk07QUFBVCxLQUFwRSxFQUE2RnZCLEtBQTdGLEVBQXRCO0FDMkNDOztBRHpDRixTQUFPbUQsV0FBUDtBQW5Db0IsQ0FBckIsQyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19hcHBsaWNhdGlvbi1wYWNrYWdlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiQ3JlYXRvci5PYmplY3RzLmFwcGxpY2F0aW9uX3BhY2thZ2UgPVxuXHRuYW1lOiBcImFwcGxpY2F0aW9uX3BhY2thZ2VcIlxuXHRpY29uOiBcImN1c3RvbS5jdXN0b200MlwiXG5cdGxhYmVsOiBcIui9r+S7tuWMhVwiXG5cdGZpZWxkczpcblx0XHRuYW1lOlxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcblx0XHRcdGxhYmVsOiBcIuWQjeensFwiXG5cdFx0YXBwczpcblx0XHRcdHR5cGU6IFwibG9va3VwXCJcblx0XHRcdGxhYmVsOiBcIuW6lOeUqFwiXG5cdFx0XHR0eXBlOiBcImxvb2t1cFwiXG5cdFx0XHRyZWZlcmVuY2VfdG86IFwiYXBwc1wiXG5cdFx0XHRtdWx0aXBsZTogdHJ1ZVxuXHRcdFx0b3B0aW9uc0Z1bmN0aW9uOiAoKS0+XG5cdFx0XHRcdF9vcHRpb25zID0gW11cblx0XHRcdFx0Xy5mb3JFYWNoIENyZWF0b3IuQXBwcywgKG8sIGspLT5cblx0XHRcdFx0XHRfb3B0aW9ucy5wdXNoIHtsYWJlbDogby5uYW1lLCB2YWx1ZTogaywgaWNvbjogby5pY29uX3NsZHN9XG5cdFx0XHRcdHJldHVybiBfb3B0aW9uc1xuXHRcdG9iamVjdHM6XG5cdFx0XHR0eXBlOiBcImxvb2t1cFwiXG5cdFx0XHRsYWJlbDogXCLlr7nosaFcIlxuXHRcdFx0cmVmZXJlbmNlX3RvOiBcIm9iamVjdHNcIlxuXHRcdFx0bXVsdGlwbGU6IHRydWVcblx0XHRcdG9wdGlvbnNGdW5jdGlvbjogKCktPlxuXHRcdFx0XHRfb3B0aW9ucyA9IFtdXG5cdFx0XHRcdF8uZm9yRWFjaCBDcmVhdG9yLm9iamVjdHNCeU5hbWUsIChvLCBrKS0+XG5cdFx0XHRcdFx0aWYgIW8uaGlkZGVuXG5cdFx0XHRcdFx0XHRfb3B0aW9ucy5wdXNoIHsgbGFiZWw6IG8ubGFiZWwsIHZhbHVlOiBrLCBpY29uOiBvLmljb24gfVxuXHRcdFx0XHRyZXR1cm4gX29wdGlvbnNcblxuXHRcdGxpc3Rfdmlld3M6XG5cdFx0XHR0eXBlOiBcImxvb2t1cFwiXG5cdFx0XHRsYWJlbDogXCLliJfooajop4blm75cIlxuXHRcdFx0bXVsdGlwbGU6IHRydWVcblx0XHRcdHJlZmVyZW5jZV90bzogXCJvYmplY3RfbGlzdHZpZXdzXCJcblx0XHRcdG9wdGlvbnNNZXRob2Q6IFwiY3JlYXRvci5saXN0dmlld3Nfb3B0aW9uc1wiXG5cdFx0cGVybWlzc2lvbl9zZXQ6XG5cdFx0XHR0eXBlOiBcImxvb2t1cFwiXG5cdFx0XHRsYWJlbDogXCLmnYPpmZDnu4RcIlxuXHRcdFx0bXVsdGlwbGU6IHRydWVcblx0XHRcdHJlZmVyZW5jZV90bzogXCJwZXJtaXNzaW9uX3NldFwiXG5cdFx0cGVybWlzc2lvbl9vYmplY3RzOlxuXHRcdFx0dHlwZTogXCJsb29rdXBcIlxuXHRcdFx0bGFiZWw6IFwi5p2D6ZmQ6ZuGXCJcblx0XHRcdG11bHRpcGxlOiB0cnVlXG5cdFx0XHRyZWZlcmVuY2VfdG86IFwicGVybWlzc2lvbl9vYmplY3RzXCJcblx0XHRyZXBvcnRzOlxuXHRcdFx0dHlwZTogXCJsb29rdXBcIlxuXHRcdFx0bGFiZWw6IFwi5oql6KGoXCJcblx0XHRcdG11bHRpcGxlOiB0cnVlXG5cdFx0XHRyZWZlcmVuY2VfdG86IFwicmVwb3J0c1wiXG5cdGxpc3Rfdmlld3M6XG5cdFx0YWxsOlxuXHRcdFx0bGFiZWw6IFwi5omA5pyJXCJcblx0XHRcdGNvbHVtbnM6IFtcIm5hbWVcIl1cblx0XHRcdGZpbHRlcl9zY29wZTogXCJzcGFjZVwiXG5cdGFjdGlvbnM6XG5cdFx0aW5pdF9kYXRhOlxuXHRcdFx0bGFiZWw6IFwi5Yid5aeL5YyWXCJcblx0XHRcdHZpc2libGU6IHRydWVcblx0XHRcdG9uOiBcInJlY29yZFwiXG5cdFx0XHR0b2RvOiAob2JqZWN0X25hbWUsIHJlY29yZF9pZCwgZmllbGRzKS0+XG5cdFx0XHRcdGNvbnNvbGUubG9nKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIGZpZWxkcylcblx0XHRcdFx0TWV0ZW9yLmNhbGwgXCJhcHBQYWNrYWdlLmluaXRfZXhwb3J0X2RhdGFcIiwgU2Vzc2lvbi5nZXQoXCJzcGFjZUlkXCIpLCByZWNvcmRfaWQsKGVycm9yLCByZXN1bHQpLT5cblx0XHRcdFx0XHRpZiBlcnJvclxuXHRcdFx0XHRcdFx0dG9hc3RyLmVycm9yKGVycm9yLnJlYXNvbilcblx0XHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0XHR0b2FzdHIuc3VjY2VzcyhcIuWIneWni+WMluWujOaIkFwiKVxuXHRcdGV4cG9ydDpcblx0XHRcdGxhYmVsOiBcIuWvvOWHulwiXG5cdFx0XHR2aXNpYmxlOiB0cnVlXG5cdFx0XHRvbjogXCJyZWNvcmRcIlxuXHRcdFx0dG9kbzogKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIGZpZWxkcyktPlxuXHRcdFx0XHRjb25zb2xlLmxvZyhcIuWvvOWHuiN7b2JqZWN0X25hbWV9LT4je3JlY29yZF9pZH1cIilcblx0XHRcdFx0dXJsID0gU3RlZWRvcy5hYnNvbHV0ZVVybCBcIi9hcGkvY3JlYXRvci9hcHBfcGFja2FnZS9leHBvcnQvI3tTZXNzaW9uLmdldChcInNwYWNlSWRcIil9LyN7cmVjb3JkX2lkfVwiXG5cdFx0XHRcdHdpbmRvdy5vcGVuKHVybClcbiNcdFx0XHRcdCQuYWpheFxuI1x0XHRcdFx0XHR0eXBlOiBcInBvc3RcIlxuI1x0XHRcdFx0XHR1cmw6IHVybFxuI1x0XHRcdFx0XHRkYXRhVHlwZTogXCJqc29uXCJcbiNcdFx0XHRcdFx0YmVmb3JlU2VuZDogKHJlcXVlc3QpIC0+XG4jXHRcdFx0XHRcdFx0cmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdYLVVzZXItSWQnLCBNZXRlb3IudXNlcklkKCkpXG4jXHRcdFx0XHRcdFx0cmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdYLUF1dGgtVG9rZW4nLCBBY2NvdW50cy5fc3RvcmVkTG9naW5Ub2tlbigpKVxuI1x0XHRcdFx0XHRlcnJvcjogKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikgLT5cbiNcdFx0XHRcdFx0XHRlcnJvciA9IGpxWEhSLnJlc3BvbnNlSlNPTlxuI1x0XHRcdFx0XHRcdGNvbnNvbGUuZXJyb3IgZXJyb3JcbiNcdFx0XHRcdFx0XHRpZiBlcnJvcj8ucmVhc29uXG4jXHRcdFx0XHRcdFx0XHR0b2FzdHI/LmVycm9yPyhUQVBpMThuLl9fKGVycm9yLnJlYXNvbikpXG4jXHRcdFx0XHRcdFx0ZWxzZSBpZiBlcnJvcj8ubWVzc2FnZVxuI1x0XHRcdFx0XHRcdFx0dG9hc3RyPy5lcnJvcj8oVEFQaTE4bi5fXyhlcnJvci5tZXNzYWdlKSlcbiNcdFx0XHRcdFx0XHRlbHNlXG4jXHRcdFx0XHRcdFx0XHR0b2FzdHI/LmVycm9yPyhlcnJvcilcbiNcdFx0XHRcdFx0c3VjY2VzczogKHJlc3VsdCkgLT5cbiNcdFx0XHRcdFx0XHRjb25zb2xlLmxvZyhcInJlc3VsdC4uLi4uLi4uLi4uLi4uLi4uLi4je3Jlc3VsdH1cIilcblxuXHRcdGltcG9ydDpcblx0XHRcdGxhYmVsOiBcIuWvvOWFpVwiXG5cdFx0XHR2aXNpYmxlOiB0cnVlXG5cdFx0XHRvbjogXCJsaXN0XCJcblx0XHRcdHRvZG86IChvYmplY3RfbmFtZSktPlxuXHRcdFx0XHRjb25zb2xlLmxvZyhcIm9iamVjdF9uYW1lXCIsIG9iamVjdF9uYW1lKVxuXHRcdFx0XHRNb2RhbC5zaG93KFwiQVBQYWNrYWdlSW1wb3J0TW9kYWxcIilcbiIsIkNyZWF0b3IuT2JqZWN0cy5hcHBsaWNhdGlvbl9wYWNrYWdlID0ge1xuICBuYW1lOiBcImFwcGxpY2F0aW9uX3BhY2thZ2VcIixcbiAgaWNvbjogXCJjdXN0b20uY3VzdG9tNDJcIixcbiAgbGFiZWw6IFwi6L2v5Lu25YyFXCIsXG4gIGZpZWxkczoge1xuICAgIG5hbWU6IHtcbiAgICAgIHR5cGU6IFwidGV4dFwiLFxuICAgICAgbGFiZWw6IFwi5ZCN56ewXCJcbiAgICB9LFxuICAgIGFwcHM6IHtcbiAgICAgIHR5cGU6IFwibG9va3VwXCIsXG4gICAgICBsYWJlbDogXCLlupTnlKhcIixcbiAgICAgIHR5cGU6IFwibG9va3VwXCIsXG4gICAgICByZWZlcmVuY2VfdG86IFwiYXBwc1wiLFxuICAgICAgbXVsdGlwbGU6IHRydWUsXG4gICAgICBvcHRpb25zRnVuY3Rpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgX29wdGlvbnM7XG4gICAgICAgIF9vcHRpb25zID0gW107XG4gICAgICAgIF8uZm9yRWFjaChDcmVhdG9yLkFwcHMsIGZ1bmN0aW9uKG8sIGspIHtcbiAgICAgICAgICByZXR1cm4gX29wdGlvbnMucHVzaCh7XG4gICAgICAgICAgICBsYWJlbDogby5uYW1lLFxuICAgICAgICAgICAgdmFsdWU6IGssXG4gICAgICAgICAgICBpY29uOiBvLmljb25fc2xkc1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIF9vcHRpb25zO1xuICAgICAgfVxuICAgIH0sXG4gICAgb2JqZWN0czoge1xuICAgICAgdHlwZTogXCJsb29rdXBcIixcbiAgICAgIGxhYmVsOiBcIuWvueixoVwiLFxuICAgICAgcmVmZXJlbmNlX3RvOiBcIm9iamVjdHNcIixcbiAgICAgIG11bHRpcGxlOiB0cnVlLFxuICAgICAgb3B0aW9uc0Z1bmN0aW9uOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIF9vcHRpb25zO1xuICAgICAgICBfb3B0aW9ucyA9IFtdO1xuICAgICAgICBfLmZvckVhY2goQ3JlYXRvci5vYmplY3RzQnlOYW1lLCBmdW5jdGlvbihvLCBrKSB7XG4gICAgICAgICAgaWYgKCFvLmhpZGRlbikge1xuICAgICAgICAgICAgcmV0dXJuIF9vcHRpb25zLnB1c2goe1xuICAgICAgICAgICAgICBsYWJlbDogby5sYWJlbCxcbiAgICAgICAgICAgICAgdmFsdWU6IGssXG4gICAgICAgICAgICAgIGljb246IG8uaWNvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIF9vcHRpb25zO1xuICAgICAgfVxuICAgIH0sXG4gICAgbGlzdF92aWV3czoge1xuICAgICAgdHlwZTogXCJsb29rdXBcIixcbiAgICAgIGxhYmVsOiBcIuWIl+ihqOinhuWbvlwiLFxuICAgICAgbXVsdGlwbGU6IHRydWUsXG4gICAgICByZWZlcmVuY2VfdG86IFwib2JqZWN0X2xpc3R2aWV3c1wiLFxuICAgICAgb3B0aW9uc01ldGhvZDogXCJjcmVhdG9yLmxpc3R2aWV3c19vcHRpb25zXCJcbiAgICB9LFxuICAgIHBlcm1pc3Npb25fc2V0OiB7XG4gICAgICB0eXBlOiBcImxvb2t1cFwiLFxuICAgICAgbGFiZWw6IFwi5p2D6ZmQ57uEXCIsXG4gICAgICBtdWx0aXBsZTogdHJ1ZSxcbiAgICAgIHJlZmVyZW5jZV90bzogXCJwZXJtaXNzaW9uX3NldFwiXG4gICAgfSxcbiAgICBwZXJtaXNzaW9uX29iamVjdHM6IHtcbiAgICAgIHR5cGU6IFwibG9va3VwXCIsXG4gICAgICBsYWJlbDogXCLmnYPpmZDpm4ZcIixcbiAgICAgIG11bHRpcGxlOiB0cnVlLFxuICAgICAgcmVmZXJlbmNlX3RvOiBcInBlcm1pc3Npb25fb2JqZWN0c1wiXG4gICAgfSxcbiAgICByZXBvcnRzOiB7XG4gICAgICB0eXBlOiBcImxvb2t1cFwiLFxuICAgICAgbGFiZWw6IFwi5oql6KGoXCIsXG4gICAgICBtdWx0aXBsZTogdHJ1ZSxcbiAgICAgIHJlZmVyZW5jZV90bzogXCJyZXBvcnRzXCJcbiAgICB9XG4gIH0sXG4gIGxpc3Rfdmlld3M6IHtcbiAgICBhbGw6IHtcbiAgICAgIGxhYmVsOiBcIuaJgOaciVwiLFxuICAgICAgY29sdW1uczogW1wibmFtZVwiXSxcbiAgICAgIGZpbHRlcl9zY29wZTogXCJzcGFjZVwiXG4gICAgfVxuICB9LFxuICBhY3Rpb25zOiB7XG4gICAgaW5pdF9kYXRhOiB7XG4gICAgICBsYWJlbDogXCLliJ3lp4vljJZcIixcbiAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICBvbjogXCJyZWNvcmRcIixcbiAgICAgIHRvZG86IGZ1bmN0aW9uKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIGZpZWxkcykge1xuICAgICAgICBjb25zb2xlLmxvZyhvYmplY3RfbmFtZSwgcmVjb3JkX2lkLCBmaWVsZHMpO1xuICAgICAgICByZXR1cm4gTWV0ZW9yLmNhbGwoXCJhcHBQYWNrYWdlLmluaXRfZXhwb3J0X2RhdGFcIiwgU2Vzc2lvbi5nZXQoXCJzcGFjZUlkXCIpLCByZWNvcmRfaWQsIGZ1bmN0aW9uKGVycm9yLCByZXN1bHQpIHtcbiAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHJldHVybiB0b2FzdHIuZXJyb3IoZXJyb3IucmVhc29uKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRvYXN0ci5zdWNjZXNzKFwi5Yid5aeL5YyW5a6M5oiQXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBcImV4cG9ydFwiOiB7XG4gICAgICBsYWJlbDogXCLlr7zlh7pcIixcbiAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICBvbjogXCJyZWNvcmRcIixcbiAgICAgIHRvZG86IGZ1bmN0aW9uKG9iamVjdF9uYW1lLCByZWNvcmRfaWQsIGZpZWxkcykge1xuICAgICAgICB2YXIgdXJsO1xuICAgICAgICBjb25zb2xlLmxvZyhcIuWvvOWHulwiICsgb2JqZWN0X25hbWUgKyBcIi0+XCIgKyByZWNvcmRfaWQpO1xuICAgICAgICB1cmwgPSBTdGVlZG9zLmFic29sdXRlVXJsKFwiL2FwaS9jcmVhdG9yL2FwcF9wYWNrYWdlL2V4cG9ydC9cIiArIChTZXNzaW9uLmdldChcInNwYWNlSWRcIikpICsgXCIvXCIgKyByZWNvcmRfaWQpO1xuICAgICAgICByZXR1cm4gd2luZG93Lm9wZW4odXJsKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIFwiaW1wb3J0XCI6IHtcbiAgICAgIGxhYmVsOiBcIuWvvOWFpVwiLFxuICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgIG9uOiBcImxpc3RcIixcbiAgICAgIHRvZG86IGZ1bmN0aW9uKG9iamVjdF9uYW1lKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKFwib2JqZWN0X25hbWVcIiwgb2JqZWN0X25hbWUpO1xuICAgICAgICByZXR1cm4gTW9kYWwuc2hvdyhcIkFQUGFja2FnZUltcG9ydE1vZGFsXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcbiIsIkpzb25Sb3V0ZXMuYWRkICdnZXQnLCAnL2FwaS9jcmVhdG9yL2FwcF9wYWNrYWdlL2V4cG9ydC86c3BhY2VfaWQvOnJlY29yZF9pZCcsIChyZXEsIHJlcywgbmV4dCkgLT5cblx0dHJ5XG5cblx0XHR1c2VySWQgPSBTdGVlZG9zLmdldFVzZXJJZEZyb21BdXRoVG9rZW4ocmVxLCByZXMpO1xuXG5cdFx0aWYgIXVzZXJJZFxuXHRcdFx0SnNvblJvdXRlcy5zZW5kUmVzdWx0IHJlcywge1xuXHRcdFx0XHRjb2RlOiA0MDFcblx0XHRcdFx0ZGF0YToge2Vycm9yczogXCJBdXRoZW50aWNhdGlvbiBpcyByZXF1aXJlZCBhbmQgaGFzIG5vdCBiZWVuIHByb3ZpZGVkLlwifVxuXHRcdFx0fVxuXHRcdFx0cmV0dXJuXG5cblx0XHRyZWNvcmRfaWQgPSByZXEucGFyYW1zLnJlY29yZF9pZFxuXHRcdHNwYWNlX2lkID0gcmVxLnBhcmFtcy5zcGFjZV9pZFxuXG5cdFx0aWYgIUNyZWF0b3IuaXNTcGFjZUFkbWluKHNwYWNlX2lkLCB1c2VySWQpXG5cdFx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLCB7XG5cdFx0XHRcdGNvZGU6IDQwMVxuXHRcdFx0XHRkYXRhOiB7ZXJyb3JzOiBcIlBlcm1pc3Npb24gZGVuaWVkXCJ9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm5cblxuXHRcdHJlY29yZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcGxpY2F0aW9uX3BhY2thZ2VcIikuZmluZE9uZSh7X2lkOiByZWNvcmRfaWR9KVxuXG5cdFx0aWYgIXJlY29yZFxuXHRcdFx0SnNvblJvdXRlcy5zZW5kUmVzdWx0IHJlcywge1xuXHRcdFx0XHRjb2RlOiA0MDRcblx0XHRcdFx0ZGF0YToge2Vycm9yczogXCJDb2xsZWN0aW9uIG5vdCBmb3VuZCBmb3IgdGhlIHNlZ21lbnQgI3tyZWNvcmRfaWR9XCJ9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm5cblxuXHRcdHNwYWNlX3VzZXIgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJzcGFjZV91c2Vyc1wiKS5maW5kT25lKHt1c2VyOiB1c2VySWQsIHNwYWNlOiByZWNvcmQuc3BhY2V9KVxuXG5cdFx0aWYgIXNwYWNlX3VzZXJcblx0XHRcdEpzb25Sb3V0ZXMuc2VuZFJlc3VsdCByZXMsIHtcblx0XHRcdFx0Y29kZTogNDAxXG5cdFx0XHRcdGRhdGE6IHtlcnJvcnM6IFwiVXNlciBkb2VzIG5vdCBoYXZlIHByaXZpbGVnZXMgdG8gYWNjZXNzIHRoZSBlbnRpdHlcIn1cblx0XHRcdH1cblx0XHRcdHJldHVyblxuXG5cdFx0ZGF0YSA9IEFQVHJhbnNmb3JtLmV4cG9ydCByZWNvcmRcblxuXHRcdGRhdGEuZGF0YVNvdXJjZSA9IE1ldGVvci5hYnNvbHV0ZVVybChcImFwaS9jcmVhdG9yL2FwcF9wYWNrYWdlL2V4cG9ydC8je3NwYWNlX2lkfS8je3JlY29yZF9pZH1cIilcblxuXHRcdGZpbGVOYW1lID0gcmVjb3JkLm5hbWUgfHwgXCJhcHBsaWNhdGlvbl9wYWNrYWdlXCJcblxuXHRcdHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtdHlwZScsICdhcHBsaWNhdGlvbi94LW1zZG93bmxvYWQnKTtcblx0XHRyZXMuc2V0SGVhZGVyKCdDb250ZW50LURpc3Bvc2l0aW9uJywgJ2F0dGFjaG1lbnQ7ZmlsZW5hbWU9JytlbmNvZGVVUkkoZmlsZU5hbWUpKycuanNvbicpO1xuXHRcdHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgNCkpXG5cdGNhdGNoIGVcblx0XHRjb25zb2xlLmVycm9yIGUuc3RhY2tcblx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLCB7XG5cdFx0XHRjb2RlOiAyMDBcblx0XHRcdGRhdGE6IHsgZXJyb3JzOiBlLnJlYXNvbiB8fCBlLm1lc3NhZ2UgfVxuXHRcdH1cblxuIiwiSnNvblJvdXRlcy5hZGQoJ2dldCcsICcvYXBpL2NyZWF0b3IvYXBwX3BhY2thZ2UvZXhwb3J0LzpzcGFjZV9pZC86cmVjb3JkX2lkJywgZnVuY3Rpb24ocmVxLCByZXMsIG5leHQpIHtcbiAgdmFyIGRhdGEsIGUsIGZpbGVOYW1lLCByZWNvcmQsIHJlY29yZF9pZCwgc3BhY2VfaWQsIHNwYWNlX3VzZXIsIHVzZXJJZDtcbiAgdHJ5IHtcbiAgICB1c2VySWQgPSBTdGVlZG9zLmdldFVzZXJJZEZyb21BdXRoVG9rZW4ocmVxLCByZXMpO1xuICAgIGlmICghdXNlcklkKSB7XG4gICAgICBKc29uUm91dGVzLnNlbmRSZXN1bHQocmVzLCB7XG4gICAgICAgIGNvZGU6IDQwMSxcbiAgICAgICAgZGF0YToge1xuICAgICAgICAgIGVycm9yczogXCJBdXRoZW50aWNhdGlvbiBpcyByZXF1aXJlZCBhbmQgaGFzIG5vdCBiZWVuIHByb3ZpZGVkLlwiXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZWNvcmRfaWQgPSByZXEucGFyYW1zLnJlY29yZF9pZDtcbiAgICBzcGFjZV9pZCA9IHJlcS5wYXJhbXMuc3BhY2VfaWQ7XG4gICAgaWYgKCFDcmVhdG9yLmlzU3BhY2VBZG1pbihzcGFjZV9pZCwgdXNlcklkKSkge1xuICAgICAgSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgICBjb2RlOiA0MDEsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBlcnJvcnM6IFwiUGVybWlzc2lvbiBkZW5pZWRcIlxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmVjb3JkID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiYXBwbGljYXRpb25fcGFja2FnZVwiKS5maW5kT25lKHtcbiAgICAgIF9pZDogcmVjb3JkX2lkXG4gICAgfSk7XG4gICAgaWYgKCFyZWNvcmQpIHtcbiAgICAgIEpzb25Sb3V0ZXMuc2VuZFJlc3VsdChyZXMsIHtcbiAgICAgICAgY29kZTogNDA0LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgZXJyb3JzOiBcIkNvbGxlY3Rpb24gbm90IGZvdW5kIGZvciB0aGUgc2VnbWVudCBcIiArIHJlY29yZF9pZFxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgc3BhY2VfdXNlciA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInNwYWNlX3VzZXJzXCIpLmZpbmRPbmUoe1xuICAgICAgdXNlcjogdXNlcklkLFxuICAgICAgc3BhY2U6IHJlY29yZC5zcGFjZVxuICAgIH0pO1xuICAgIGlmICghc3BhY2VfdXNlcikge1xuICAgICAgSnNvblJvdXRlcy5zZW5kUmVzdWx0KHJlcywge1xuICAgICAgICBjb2RlOiA0MDEsXG4gICAgICAgIGRhdGE6IHtcbiAgICAgICAgICBlcnJvcnM6IFwiVXNlciBkb2VzIG5vdCBoYXZlIHByaXZpbGVnZXMgdG8gYWNjZXNzIHRoZSBlbnRpdHlcIlxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZGF0YSA9IEFQVHJhbnNmb3JtW1wiZXhwb3J0XCJdKHJlY29yZCk7XG4gICAgZGF0YS5kYXRhU291cmNlID0gTWV0ZW9yLmFic29sdXRlVXJsKFwiYXBpL2NyZWF0b3IvYXBwX3BhY2thZ2UvZXhwb3J0L1wiICsgc3BhY2VfaWQgKyBcIi9cIiArIHJlY29yZF9pZCk7XG4gICAgZmlsZU5hbWUgPSByZWNvcmQubmFtZSB8fCBcImFwcGxpY2F0aW9uX3BhY2thZ2VcIjtcbiAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC1tc2Rvd25sb2FkJyk7XG4gICAgcmVzLnNldEhlYWRlcignQ29udGVudC1EaXNwb3NpdGlvbicsICdhdHRhY2htZW50O2ZpbGVuYW1lPScgKyBlbmNvZGVVUkkoZmlsZU5hbWUpICsgJy5qc29uJyk7XG4gICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSwgbnVsbCwgNCkpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGUgPSBlcnJvcjtcbiAgICBjb25zb2xlLmVycm9yKGUuc3RhY2spO1xuICAgIHJldHVybiBKc29uUm91dGVzLnNlbmRSZXN1bHQocmVzLCB7XG4gICAgICBjb2RlOiAyMDAsXG4gICAgICBkYXRhOiB7XG4gICAgICAgIGVycm9yczogZS5yZWFzb24gfHwgZS5tZXNzYWdlXG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn0pO1xuIiwidHJhbnNmb3JtRmlsdGVycyA9IChmaWx0ZXJzKS0+XG5cdF9maWx0ZXJzID0gW11cblx0Xy5lYWNoIGZpbHRlcnMsIChmKS0+XG5cdFx0aWYgXy5pc0FycmF5KGYpICYmIGYubGVuZ3RoID09IDNcblx0XHRcdF9maWx0ZXJzLnB1c2gge2ZpZWxkOiBmWzBdLCBvcGVyYXRpb246IGZbMV0sIHZhbHVlOiBmWzJdfVxuXHRcdGVsc2Vcblx0XHRcdF9maWx0ZXJzLnB1c2ggZlxuXHRyZXR1cm4gX2ZpbHRlcnNcblxudHJhbnNmb3JtRmllbGRPcHRpb25zID0gKG9wdGlvbnMpLT5cblx0aWYgIV8uaXNBcnJheShvcHRpb25zKVxuXHRcdHJldHVybiBvcHRpb25zXG5cblx0X29wdGlvbnMgPSBbXVxuXG5cdF8uZWFjaCBvcHRpb25zLCAobyktPlxuXHRcdGlmIG8gJiYgXy5oYXMobywgJ2xhYmVsJykgJiYgXy5oYXMobywgJ3ZhbHVlJylcblx0XHRcdF9vcHRpb25zLnB1c2ggXCIje28ubGFiZWx9OiN7by52YWx1ZX1cIlxuXG5cdHJldHVybiBfb3B0aW9ucy5qb2luKCcsJylcblxuXG5DcmVhdG9yLmltcG9ydE9iamVjdCA9ICh1c2VySWQsIHNwYWNlX2lkLCBvYmplY3QsIGxpc3Rfdmlld3NfaWRfbWFwcykgLT5cblx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLWltcG9ydE9iamVjdC0tLS0tLS0tLS0tLS0tLS0tLScsIG9iamVjdC5uYW1lKVxuXHRmaWVsZHMgPSBvYmplY3QuZmllbGRzXG5cdHRyaWdnZXJzID0gb2JqZWN0LnRyaWdnZXJzXG5cdGFjdGlvbnMgPSBvYmplY3QuYWN0aW9uc1xuXHRvYmpfbGlzdF92aWV3cyA9IG9iamVjdC5saXN0X3ZpZXdzXG5cblx0ZGVsZXRlIG9iamVjdC5faWRcblx0ZGVsZXRlIG9iamVjdC5maWVsZHNcblx0ZGVsZXRlIG9iamVjdC50cmlnZ2Vyc1xuXHRkZWxldGUgb2JqZWN0LmFjdGlvbnNcblx0ZGVsZXRlIG9iamVjdC5wZXJtaXNzaW9ucyAj5Yig6ZmkcGVybWlzc2lvbnPliqjmgIHlsZ7mgKdcblx0ZGVsZXRlIG9iamVjdC5saXN0X3ZpZXdzXG5cblx0b2JqZWN0LnNwYWNlID0gc3BhY2VfaWRcblx0b2JqZWN0Lm93bmVyID0gdXNlcklkXG5cblx0Q3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0c1wiKS5pbnNlcnQob2JqZWN0KVxuXG5cdCMgMi4xIOaMgeS5heWMluWvueixoWxpc3Rfdmlld3Ncblx0aW50ZXJuYWxfbGlzdF92aWV3ID0ge31cblxuXHRoYXNSZWNlbnRWaWV3ID0gZmFsc2Vcblx0Y29uc29sZS5sb2coJ+aMgeS5heWMluWvueixoWxpc3Rfdmlld3MnKTtcblx0Xy5lYWNoIG9ial9saXN0X3ZpZXdzLCAobGlzdF92aWV3KS0+XG5cdFx0b2xkX2lkID0gbGlzdF92aWV3Ll9pZFxuXHRcdGRlbGV0ZSBsaXN0X3ZpZXcuX2lkXG5cdFx0bGlzdF92aWV3LnNwYWNlID0gc3BhY2VfaWRcblx0XHRsaXN0X3ZpZXcub3duZXIgPSB1c2VySWRcblx0XHRsaXN0X3ZpZXcub2JqZWN0X25hbWUgPSBvYmplY3QubmFtZVxuXHRcdGlmIENyZWF0b3IuaXNSZWNlbnRWaWV3KGxpc3Rfdmlldylcblx0XHRcdGhhc1JlY2VudFZpZXcgPSB0cnVlXG5cblx0XHRpZiBsaXN0X3ZpZXcuZmlsdGVyc1xuXHRcdFx0bGlzdF92aWV3LmZpbHRlcnMgPSB0cmFuc2Zvcm1GaWx0ZXJzKGxpc3Rfdmlldy5maWx0ZXJzKVxuXG5cdFx0aWYgQ3JlYXRvci5pc0FsbFZpZXcobGlzdF92aWV3KSB8fCBDcmVhdG9yLmlzUmVjZW50VmlldyhsaXN0X3ZpZXcpXG5cdCMg5Yib5bu6b2JqZWN05pe277yM5Lya6Ieq5Yqo5re75YqgYWxsIHZpZXfjgIFyZWNlbnQgdmlld1xuXG5cdFx0XHRvcHRpb25zID0geyRzZXQ6IGxpc3Rfdmlld31cblxuXHRcdFx0aWYgIWxpc3Rfdmlldy5jb2x1bW5zXG5cdFx0XHRcdG9wdGlvbnMuJHVuc2V0ID0ge2NvbHVtbnM6ICcnfVxuXG5cdFx0XHRDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfbGlzdHZpZXdzXCIpLnVwZGF0ZSh7b2JqZWN0X25hbWU6IG9iamVjdC5uYW1lLCBuYW1lOiBsaXN0X3ZpZXcubmFtZSwgc3BhY2U6IHNwYWNlX2lkfSwgb3B0aW9ucylcblx0XHRlbHNlXG5cdFx0XHRuZXdfaWQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfbGlzdHZpZXdzXCIpLmluc2VydChsaXN0X3ZpZXcpXG5cdFx0XHRsaXN0X3ZpZXdzX2lkX21hcHNbb2JqZWN0Lm5hbWUgKyBcIl9cIiArIG9sZF9pZF0gPSBuZXdfaWRcblxuXHRpZiAhaGFzUmVjZW50Vmlld1xuXHRcdENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikucmVtb3ZlKHtuYW1lOiBcInJlY2VudFwiLCBzcGFjZTogc3BhY2VfaWQsIG9iamVjdF9uYW1lOiBvYmplY3QubmFtZSwgb3duZXI6IHVzZXJJZH0pXG5cdGNvbnNvbGUubG9nKCfmjIHkuYXljJblr7nosaHlrZfmrrUnKTtcblx0IyAyLjIg5oyB5LmF5YyW5a+56LGh5a2X5q61XG5cblx0X2ZpZWxkbmFtZXMgPSBbXVxuXG5cdF8uZWFjaCBmaWVsZHMsIChmaWVsZCwgayktPlxuXHRcdGRlbGV0ZSBmaWVsZC5faWRcblx0XHRmaWVsZC5zcGFjZSA9IHNwYWNlX2lkXG5cdFx0ZmllbGQub3duZXIgPSB1c2VySWRcblx0XHRmaWVsZC5vYmplY3QgPSBvYmplY3QubmFtZVxuXG5cdFx0aWYgZmllbGQub3B0aW9uc1xuXHRcdFx0ZmllbGQub3B0aW9ucyA9IHRyYW5zZm9ybUZpZWxkT3B0aW9ucyhmaWVsZC5vcHRpb25zKVxuXG5cdFx0aWYgIV8uaGFzKGZpZWxkLCBcIm5hbWVcIilcblx0XHRcdGZpZWxkLm5hbWUgPSBrXG5cblx0XHRfZmllbGRuYW1lcy5wdXNoIGZpZWxkLm5hbWVcblxuXHRcdGlmIGZpZWxkLm5hbWUgPT0gXCJuYW1lXCJcblx0XHRcdCMg5Yib5bu6b2JqZWN05pe277yM5Lya6Ieq5Yqo5re75YqgbmFtZeWtl+aute+8jOWboOatpOWcqOatpOWkhOWvuW5hbWXlrZfmrrXov5vooYzmm7TmlrBcblx0XHRcdENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9maWVsZHNcIikudXBkYXRlKHtvYmplY3Q6IG9iamVjdC5uYW1lLCBuYW1lOiBcIm5hbWVcIiwgc3BhY2U6IHNwYWNlX2lkfSwgeyRzZXQ6IGZpZWxkfSlcblx0XHRlbHNlXG5cdFx0XHRDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfZmllbGRzXCIpLmluc2VydChmaWVsZClcblxuXHRcdGlmICFfLmNvbnRhaW5zKF9maWVsZG5hbWVzLCAnbmFtZScpXG5cdFx0XHRDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfZmllbGRzXCIpLmRpcmVjdC5yZW1vdmUoe29iamVjdDogb2JqZWN0Lm5hbWUsIG5hbWU6IFwibmFtZVwiLCBzcGFjZTogc3BhY2VfaWR9KVxuXG5cdGNvbnNvbGUubG9nKCfmjIHkuYXljJbop6blj5HlmagnKTtcblx0IyAyLjMg5oyB5LmF5YyW6Kem5Y+R5ZmoXG5cdF8uZWFjaCB0cmlnZ2VycywgKHRyaWdnZXIsIGspLT5cblx0XHRkZWxldGUgdHJpZ2dlcnMuX2lkXG5cdFx0dHJpZ2dlci5zcGFjZSA9IHNwYWNlX2lkXG5cdFx0dHJpZ2dlci5vd25lciA9IHVzZXJJZFxuXHRcdHRyaWdnZXIub2JqZWN0ID0gb2JqZWN0Lm5hbWVcblx0XHRpZiAhXy5oYXModHJpZ2dlciwgXCJuYW1lXCIpXG5cdFx0XHR0cmlnZ2VyLm5hbWUgPSBrLnJlcGxhY2UobmV3IFJlZ0V4cChcIlxcXFwuXCIsIFwiZ1wiKSwgXCJfXCIpXG5cblx0XHRpZiAhXy5oYXModHJpZ2dlciwgXCJpc19lbmFibGVcIilcblx0XHRcdHRyaWdnZXIuaXNfZW5hYmxlID0gdHJ1ZVxuXG5cdFx0Q3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X3RyaWdnZXJzXCIpLmluc2VydCh0cmlnZ2VyKVxuXHRjb25zb2xlLmxvZygn5oyB5LmF5YyW5pON5L2cJyk7XG5cdCMgMi40IOaMgeS5heWMluaTjeS9nFxuXHRfLmVhY2ggYWN0aW9ucywgKGFjdGlvbiwgayktPlxuXHRcdGRlbGV0ZSBhY3Rpb24uX2lkXG5cdFx0YWN0aW9uLnNwYWNlID0gc3BhY2VfaWRcblx0XHRhY3Rpb24ub3duZXIgPSB1c2VySWRcblx0XHRhY3Rpb24ub2JqZWN0ID0gb2JqZWN0Lm5hbWVcblx0XHRpZiAhXy5oYXMoYWN0aW9uLCBcIm5hbWVcIilcblx0XHRcdGFjdGlvbi5uYW1lID0gay5yZXBsYWNlKG5ldyBSZWdFeHAoXCJcXFxcLlwiLCBcImdcIiksIFwiX1wiKVxuXHRcdGlmICFfLmhhcyhhY3Rpb24sIFwiaXNfZW5hYmxlXCIpXG5cdFx0XHRhY3Rpb24uaXNfZW5hYmxlID0gdHJ1ZVxuXHRcdENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9hY3Rpb25zXCIpLmluc2VydChhY3Rpb24pXG5cblx0Y29uc29sZS5sb2coJy0tLS0tLS0tLS0tLS0tLS0tLWltcG9ydE9iamVjdCBlbmQtLS0tLS0tLS0tLS0tLS0tLS0nLCBvYmplY3QubmFtZSlcblxuQ3JlYXRvci5pbXBvcnRfYXBwX3BhY2thZ2UgPSAodXNlcklkLCBzcGFjZV9pZCwgaW1wX2RhdGEsIGZyb21fdGVtcGxhdGUpLT5cblx0aWYgIXVzZXJJZFxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI0MDFcIiwgXCJBdXRoZW50aWNhdGlvbiBpcyByZXF1aXJlZCBhbmQgaGFzIG5vdCBiZWVuIHByb3ZpZGVkLlwiKVxuXG5cdGlmICFDcmVhdG9yLmlzU3BhY2VBZG1pbihzcGFjZV9pZCwgdXNlcklkKVxuXHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI0MDFcIiwgXCJQZXJtaXNzaW9uIGRlbmllZC5cIilcblxuXHQjIyPmlbDmja7moKHpqowg5byA5aeLIyMjXG5cdGNoZWNrKGltcF9kYXRhLCBPYmplY3QpXG5cdGlmICFmcm9tX3RlbXBsYXRlXG5cdFx0IyAxIGFwcHPmoKHpqozvvJrmoLnmja5faWTliKTmlq3lupTnlKjmmK/lkKblt7LlrZjlnKhcblx0XHRpbXBfYXBwX2lkcyA9IF8ucGx1Y2soaW1wX2RhdGEuYXBwcywgXCJfaWRcIilcblx0XHRpZiBfLmlzQXJyYXkoaW1wX2RhdGEuYXBwcykgJiYgaW1wX2RhdGEuYXBwcy5sZW5ndGggPiAwXG5cdFx0XHRfLmVhY2ggaW1wX2RhdGEuYXBwcywgKGFwcCktPlxuXHRcdFx0XHRpZiBfLmluY2x1ZGUoXy5rZXlzKENyZWF0b3IuQXBwcyksIGFwcC5faWQpXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuW6lOeUqCcje2FwcC5uYW1lfSflt7LlrZjlnKhcIilcblxuXHRcdCMgMiBvYmplY3Rz5qCh6aqM77ya5qC55o2ub2JqZWN0Lm5hbWXliKTmlq3lr7nosaHmmK/lkKblt7LlrZjlnKg7IOagoemqjHRyaWdnZXJzXG5cdFx0aWYgXy5pc0FycmF5KGltcF9kYXRhLm9iamVjdHMpICYmIGltcF9kYXRhLm9iamVjdHMubGVuZ3RoID4gMFxuXHRcdFx0Xy5lYWNoIGltcF9kYXRhLm9iamVjdHMsIChvYmplY3QpLT5cblx0XHRcdFx0aWYgXy5pbmNsdWRlKF8ua2V5cyhDcmVhdG9yLk9iamVjdHMpLCBvYmplY3QubmFtZSlcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5a+56LGhJyN7b2JqZWN0Lm5hbWV9J+W3suWtmOWcqFwiKVxuXHRcdFx0XHRfLmVhY2ggb2JqZWN0LnRyaWdnZXJzLCAodHJpZ2dlciktPlxuXHRcdFx0XHRcdGlmIHRyaWdnZXIub24gPT0gJ3NlcnZlcicgJiYgIVN0ZWVkb3MuaXNMZWdhbFZlcnNpb24oc3BhY2VfaWQsXCJ3b3JrZmxvdy5lbnRlcnByaXNlXCIpXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yIDUwMCwgXCLlj6rmnInkvIHkuJrniYjmlK/mjIHphY3nva7mnI3liqHnq6/nmoTop6blj5HlmahcIlxuXG5cdFx0aW1wX29iamVjdF9uYW1lcyA9IF8ucGx1Y2soaW1wX2RhdGEub2JqZWN0cywgXCJuYW1lXCIpXG5cdFx0b2JqZWN0X25hbWVzID0gXy5rZXlzKENyZWF0b3IuT2JqZWN0cylcblxuXHRcdCMgMyDliKTmlq1hcHBz55qE5a+56LGh5piv5ZCm6YO95a2Y5ZyoXG5cdFx0aWYgXy5pc0FycmF5KGltcF9kYXRhLmFwcHMpICYmIGltcF9kYXRhLmFwcHMubGVuZ3RoID4gMFxuXHRcdFx0Xy5lYWNoIGltcF9kYXRhLmFwcHMsIChhcHApLT5cblx0XHRcdFx0Xy5lYWNoIGFwcC5vYmplY3RzLCAob2JqZWN0X25hbWUpLT5cblx0XHRcdFx0XHRpZiAhXy5pbmNsdWRlKG9iamVjdF9uYW1lcywgb2JqZWN0X25hbWUpICYmICFfLmluY2x1ZGUoaW1wX29iamVjdF9uYW1lcywgb2JqZWN0X25hbWUpXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5bqU55SoJyN7YXBwLm5hbWV9J+S4reaMh+WumueahOWvueixoScje29iamVjdF9uYW1lfSfkuI3lrZjlnKhcIilcblxuXHRcdCMgNCBsaXN0X3ZpZXdz5qCh6aqM77ya5Yik5patbGlzdF92aWV3c+WvueW6lOeahG9iamVjdOaYr+WQpuWtmOWcqFxuXHRcdGlmIF8uaXNBcnJheShpbXBfZGF0YS5saXN0X3ZpZXdzKSAmJiBpbXBfZGF0YS5saXN0X3ZpZXdzLmxlbmd0aCA+IDBcblx0XHRcdF8uZWFjaCBpbXBfZGF0YS5saXN0X3ZpZXdzLCAobGlzdF92aWV3KS0+XG5cdFx0XHRcdGlmICFsaXN0X3ZpZXcub2JqZWN0X25hbWUgfHwgIV8uaXNTdHJpbmcobGlzdF92aWV3Lm9iamVjdF9uYW1lKVxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLliJfooajop4blm74nI3tsaXN0X3ZpZXcubmFtZX0n55qEb2JqZWN0X25hbWXlsZ7mgKfml6DmlYhcIilcblx0XHRcdFx0aWYgIV8uaW5jbHVkZShvYmplY3RfbmFtZXMsIGxpc3Rfdmlldy5vYmplY3RfbmFtZSkgJiYgIV8uaW5jbHVkZShpbXBfb2JqZWN0X25hbWVzLCBsaXN0X3ZpZXcub2JqZWN0X25hbWUpXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuWIl+ihqOinhuWbvicje2xpc3Rfdmlldy5uYW1lfSfkuK3mjIflrprnmoTlr7nosaEnI3tsaXN0X3ZpZXcub2JqZWN0X25hbWV9J+S4jeWtmOWcqFwiKVxuXG5cdFx0IyA1IHBlcm1pc3Npb25fc2V05qCh6aqM77ya5Yik5pat5p2D6ZmQ57uE5Lit55qE5o6I5p2D5bqU55SoYXNzaWduZWRfYXBwczsg5p2D6ZmQ57uE55qE5ZCN56ew5LiN5YWB6K646YeN5aSNXG5cdFx0cGVybWlzc2lvbl9zZXRfaWRzID0gXy5wbHVjayhpbXBfZGF0YS5wZXJtaXNzaW9uX3NldCwgXCJfaWRcIilcblx0XHRpZiBfLmlzQXJyYXkoaW1wX2RhdGEucGVybWlzc2lvbl9zZXQpICYmIGltcF9kYXRhLnBlcm1pc3Npb25fc2V0Lmxlbmd0aCA+IDBcblx0XHRcdF8uZWFjaCBpbXBfZGF0YS5wZXJtaXNzaW9uX3NldCwgKHBlcm1pc3Npb25fc2V0KS0+XG5cdFx0XHRcdGlmIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmRPbmUoe3NwYWNlOiBzcGFjZV9pZCwgbmFtZTogcGVybWlzc2lvbl9zZXQubmFtZX0se2ZpZWxkczp7X2lkOjF9fSlcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yIDUwMCwgXCLmnYPpmZDnu4TlkI3np7AnI3twZXJtaXNzaW9uX3NldC5uYW1lfSfkuI3og73ph43lpI1cIlxuXHRcdFx0XHRfLmVhY2ggcGVybWlzc2lvbl9zZXQuYXNzaWduZWRfYXBwcywgKGFwcF9pZCktPlxuXHRcdFx0XHRcdGlmICFfLmluY2x1ZGUoXy5rZXlzKENyZWF0b3IuQXBwcyksIGFwcF9pZCkgJiYgIV8uaW5jbHVkZShpbXBfYXBwX2lkcywgYXBwX2lkKVxuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuadg+mZkOe7hCcje3Blcm1pc3Npb25fc2V0Lm5hbWV9J+eahOaOiOadg+W6lOeUqCcje2FwcF9pZH0n5LiN5a2Y5ZyoXCIpXG5cblx0XHQjIDYgcGVybWlzc2lvbl9vYmplY3Rz5qCh6aqM77ya5Yik5pat5p2D6ZmQ6ZuG5Lit5oyH5a6a55qEb2JqZWN05piv5ZCm5a2Y5Zyo77yb5Yik5pat5p2D6ZmQ57uE5qCH6K+G5piv5piv5ZCm5pyJ5pWIXG5cdFx0aWYgXy5pc0FycmF5KGltcF9kYXRhLnBlcm1pc3Npb25fb2JqZWN0cykgJiYgaW1wX2RhdGEucGVybWlzc2lvbl9vYmplY3RzLmxlbmd0aCA+IDBcblx0XHRcdF8uZWFjaCBpbXBfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMsIChwZXJtaXNzaW9uX29iamVjdCktPlxuXHRcdFx0XHRpZiAhcGVybWlzc2lvbl9vYmplY3Qub2JqZWN0X25hbWUgfHwgIV8uaXNTdHJpbmcocGVybWlzc2lvbl9vYmplY3Qub2JqZWN0X25hbWUpXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuadg+mZkOmbhicje3Blcm1pc3Npb25fb2JqZWN0Lm5hbWV9J+eahG9iamVjdF9uYW1l5bGe5oCn5peg5pWIXCIpXG5cdFx0XHRcdGlmICFfLmluY2x1ZGUob2JqZWN0X25hbWVzLCBwZXJtaXNzaW9uX29iamVjdC5vYmplY3RfbmFtZSkgJiYgIV8uaW5jbHVkZShpbXBfb2JqZWN0X25hbWVzLCBwZXJtaXNzaW9uX29iamVjdC5vYmplY3RfbmFtZSlcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5p2D6ZmQ6ZuGJyN7bGlzdF92aWV3Lm5hbWV9J+S4reaMh+WumueahOWvueixoScje3Blcm1pc3Npb25fb2JqZWN0Lm9iamVjdF9uYW1lfSfkuI3lrZjlnKhcIilcblxuXHRcdFx0XHRpZiAhXy5oYXMocGVybWlzc2lvbl9vYmplY3QsIFwicGVybWlzc2lvbl9zZXRfaWRcIikgfHwgIV8uaXNTdHJpbmcocGVybWlzc2lvbl9vYmplY3QucGVybWlzc2lvbl9zZXRfaWQpXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuadg+mZkOmbhicje3Blcm1pc3Npb25fb2JqZWN0Lm5hbWV9J+eahHBlcm1pc3Npb25fc2V0X2lk5bGe5oCn5peg5pWIXCIpXG5cdFx0XHRcdGVsc2UgaWYgIV8uaW5jbHVkZShwZXJtaXNzaW9uX3NldF9pZHMsIHBlcm1pc3Npb25fb2JqZWN0LnBlcm1pc3Npb25fc2V0X2lkKVxuXHRcdFx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLmnYPpmZDpm4YnI3twZXJtaXNzaW9uX29iamVjdC5uYW1lfSfmjIflrprnmoTmnYPpmZDnu4QnI3twZXJtaXNzaW9uX29iamVjdC5wZXJtaXNzaW9uX3NldF9pZH0n5YC85LiN5Zyo5a+85YWl55qEcGVybWlzc2lvbl9zZXTkuK1cIilcblxuXHRcdCMgNyByZXBvcnRz5qCh6aqM77ya5Yik5pat5oql6KGo5Lit5oyH5a6a55qEb2JqZWN05piv5ZCm5a2Y5ZyoXG5cdFx0aWYgXy5pc0FycmF5KGltcF9kYXRhLnJlcG9ydHMpICYmIGltcF9kYXRhLnJlcG9ydHMubGVuZ3RoID4gMFxuXHRcdFx0Xy5lYWNoIGltcF9kYXRhLnJlcG9ydHMsIChyZXBvcnQpLT5cblx0XHRcdFx0aWYgIXJlcG9ydC5vYmplY3RfbmFtZSB8fCAhXy5pc1N0cmluZyhyZXBvcnQub2JqZWN0X25hbWUpXG5cdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuaKpeihqCcje3JlcG9ydC5uYW1lfSfnmoRvYmplY3RfbmFtZeWxnuaAp+aXoOaViFwiKVxuXHRcdFx0XHRpZiAhXy5pbmNsdWRlKG9iamVjdF9uYW1lcywgcmVwb3J0Lm9iamVjdF9uYW1lKSAmJiAhXy5pbmNsdWRlKGltcF9vYmplY3RfbmFtZXMsIHJlcG9ydC5vYmplY3RfbmFtZSlcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5oql6KGoJyN7cmVwb3J0Lm5hbWV9J+S4reaMh+WumueahOWvueixoScje3JlcG9ydC5vYmplY3RfbmFtZX0n5LiN5a2Y5ZyoXCIpXG5cblx0IyMj5pWw5o2u5qCh6aqMIOe7k+adnyMjI1xuXG5cdCMjI+aVsOaNruaMgeS5heWMliDlvIDlp4sjIyNcblxuXHQjIOWumuS5ieaWsOaXp+aVsOaNruWvueW6lOWFs+ezu+mbhuWQiFxuXHRhcHBzX2lkX21hcHMgPSB7fVxuXHRsaXN0X3ZpZXdzX2lkX21hcHMgPSB7fVxuXHRwZXJtaXNzaW9uX3NldF9pZF9tYXBzID0ge31cblxuXHQjIDEg5oyB5LmF5YyWQXBwc1xuXHRpZiBfLmlzQXJyYXkoaW1wX2RhdGEuYXBwcykgJiYgaW1wX2RhdGEuYXBwcy5sZW5ndGggPiAwXG5cdFx0Xy5lYWNoIGltcF9kYXRhLmFwcHMsIChhcHApLT5cblx0XHRcdG9sZF9pZCA9IGFwcC5faWRcblx0XHRcdGRlbGV0ZSBhcHAuX2lkXG5cdFx0XHRhcHAuc3BhY2UgPSBzcGFjZV9pZFxuXHRcdFx0YXBwLm93bmVyID0gdXNlcklkXG5cdFx0XHRhcHAuaXNfY3JlYXRvciA9IHRydWVcblx0XHRcdG5ld19pZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcHNcIikuaW5zZXJ0KGFwcClcblx0XHRcdGFwcHNfaWRfbWFwc1tvbGRfaWRdID0gbmV3X2lkXG5cblx0IyAyIOaMgeS5heWMlm9iamVjdHNcblx0aWYgXy5pc0FycmF5KGltcF9kYXRhLm9iamVjdHMpICYmIGltcF9kYXRhLm9iamVjdHMubGVuZ3RoID4gMFxuXHRcdF8uZWFjaCBpbXBfZGF0YS5vYmplY3RzLCAob2JqZWN0KS0+XG5cdFx0XHRDcmVhdG9yLmltcG9ydE9iamVjdCh1c2VySWQsIHNwYWNlX2lkLCBvYmplY3QsIGxpc3Rfdmlld3NfaWRfbWFwcylcblxuXHQjIDMg5oyB5LmF5YyWbGlzdF92aWV3c1xuXHRpZiBfLmlzQXJyYXkoaW1wX2RhdGEubGlzdF92aWV3cykgJiYgaW1wX2RhdGEubGlzdF92aWV3cy5sZW5ndGggPiAwXG5cdFx0Xy5lYWNoIGltcF9kYXRhLmxpc3Rfdmlld3MsIChsaXN0X3ZpZXcpLT5cblx0XHRcdG9sZF9pZCA9IGxpc3Rfdmlldy5faWRcblx0XHRcdGRlbGV0ZSBsaXN0X3ZpZXcuX2lkXG5cblx0XHRcdGxpc3Rfdmlldy5zcGFjZSA9IHNwYWNlX2lkXG5cdFx0XHRsaXN0X3ZpZXcub3duZXIgPSB1c2VySWRcblx0XHRcdGlmIENyZWF0b3IuaXNBbGxWaWV3KGxpc3RfdmlldykgfHwgQ3JlYXRvci5pc1JlY2VudFZpZXcobGlzdF92aWV3KVxuXHRcdFx0XHQjIOWIm+W7um9iamVjdOaXtu+8jOS8muiHquWKqOa3u+WKoGFsbCB2aWV344CBcmVjZW50IHZpZXdcblx0XHRcdFx0X2xpc3RfdmlldyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikuZmluZE9uZSh7b2JqZWN0X25hbWU6IGxpc3Rfdmlldy5vYmplY3RfbmFtZSwgbmFtZTogbGlzdF92aWV3Lm5hbWUsIHNwYWNlOiBzcGFjZV9pZH0se2ZpZWxkczoge19pZDogMX19KVxuXHRcdFx0XHRpZiBfbGlzdF92aWV3XG5cdFx0XHRcdFx0bmV3X2lkID0gX2xpc3Rfdmlldy5faWRcblx0XHRcdFx0Q3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS51cGRhdGUoe29iamVjdF9uYW1lOiBsaXN0X3ZpZXcub2JqZWN0X25hbWUsIG5hbWU6IGxpc3Rfdmlldy5uYW1lLCBzcGFjZTogc3BhY2VfaWR9LCB7JHNldDogbGlzdF92aWV3fSlcblx0XHRcdGVsc2Vcblx0XHRcdFx0bmV3X2lkID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS5pbnNlcnQobGlzdF92aWV3KVxuXG5cdFx0XHRsaXN0X3ZpZXdzX2lkX21hcHNbbGlzdF92aWV3Lm9iamVjdF9uYW1lICsgXCJfXCIgKyBvbGRfaWRdID0gbmV3X2lkXG5cblx0IyA0IOaMgeS5heWMlnBlcm1pc3Npb25fc2V0XG5cdGlmIF8uaXNBcnJheShpbXBfZGF0YS5wZXJtaXNzaW9uX3NldCkgJiYgaW1wX2RhdGEucGVybWlzc2lvbl9zZXQubGVuZ3RoID4gMFxuXHRcdF8uZWFjaCBpbXBfZGF0YS5wZXJtaXNzaW9uX3NldCwgKHBlcm1pc3Npb25fc2V0KS0+XG5cdFx0XHRvbGRfaWQgPSBwZXJtaXNzaW9uX3NldC5faWRcblx0XHRcdGRlbGV0ZSBwZXJtaXNzaW9uX3NldC5faWRcblxuXHRcdFx0cGVybWlzc2lvbl9zZXQuc3BhY2UgPSBzcGFjZV9pZFxuXHRcdFx0cGVybWlzc2lvbl9zZXQub3duZXIgPSB1c2VySWRcblxuXHRcdFx0cGVybWlzc2lvbl9zZXRfdXNlcnMgPSBbXVxuXHRcdFx0Xy5lYWNoIHBlcm1pc3Npb25fc2V0LnVzZXJzLCAodXNlcl9pZCktPlxuXHRcdFx0XHRzcGFjZV91c2VyID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwic3BhY2VfdXNlcnNcIikuZmluZE9uZSh7c3BhY2U6IHNwYWNlX2lkLCB1c2VyOiB1c2VyX2lkfSwge2ZpZWxkczoge19pZDogMX19KVxuXHRcdFx0XHRpZiBzcGFjZV91c2VyXG5cdFx0XHRcdFx0cGVybWlzc2lvbl9zZXRfdXNlcnMucHVzaCB1c2VyX2lkXG5cblx0XHRcdGFzc2lnbmVkX2FwcHMgPSBbXVxuXHRcdFx0Xy5lYWNoIHBlcm1pc3Npb25fc2V0LmFzc2lnbmVkX2FwcHMsIChhcHBfaWQpLT5cblx0XHRcdFx0aWYgXy5pbmNsdWRlKF8ua2V5cyhDcmVhdG9yLkFwcHMpLCBhcHBfaWQpXG5cdFx0XHRcdFx0YXNzaWduZWRfYXBwcy5wdXNoIGFwcF9pZFxuXHRcdFx0XHRlbHNlIGlmIGFwcHNfaWRfbWFwc1thcHBfaWRdXG5cdFx0XHRcdFx0YXNzaWduZWRfYXBwcy5wdXNoIGFwcHNfaWRfbWFwc1thcHBfaWRdXG5cblxuXHRcdFx0bmV3X2lkID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9zZXRcIikuaW5zZXJ0KHBlcm1pc3Npb25fc2V0KVxuXG5cdFx0XHRwZXJtaXNzaW9uX3NldF9pZF9tYXBzW29sZF9pZF0gPSBuZXdfaWRcblxuXHQjIDUgIOaMgeS5heWMlnBlcm1pc3Npb25fb2JqZWN0c1xuXHRpZiBfLmlzQXJyYXkoaW1wX2RhdGEucGVybWlzc2lvbl9vYmplY3RzKSAmJiBpbXBfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMubGVuZ3RoID4gMFxuXHRcdF8uZWFjaCBpbXBfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMsIChwZXJtaXNzaW9uX29iamVjdCktPlxuXHRcdFx0ZGVsZXRlIHBlcm1pc3Npb25fb2JqZWN0Ll9pZFxuXG5cdFx0XHRwZXJtaXNzaW9uX29iamVjdC5zcGFjZSA9IHNwYWNlX2lkXG5cdFx0XHRwZXJtaXNzaW9uX29iamVjdC5vd25lciA9IHVzZXJJZFxuXG5cdFx0XHRwZXJtaXNzaW9uX29iamVjdC5wZXJtaXNzaW9uX3NldF9pZCA9IHBlcm1pc3Npb25fc2V0X2lkX21hcHNbcGVybWlzc2lvbl9vYmplY3QucGVybWlzc2lvbl9zZXRfaWRdXG5cblx0XHRcdGRpc2FibGVkX2xpc3Rfdmlld3MgPSBbXVxuXHRcdFx0Xy5lYWNoIHBlcm1pc3Npb25fb2JqZWN0LmRpc2FibGVkX2xpc3Rfdmlld3MsIChsaXN0X3ZpZXdfaWQpLT5cblx0XHRcdFx0bmV3X3ZpZXdfaWQgPSBsaXN0X3ZpZXdzX2lkX21hcHNbcGVybWlzc2lvbl9vYmplY3Qub2JqZWN0X25hbWUgKyBcIl9cIiArIGxpc3Rfdmlld19pZF1cblx0XHRcdFx0aWYgbmV3X3ZpZXdfaWRcblx0XHRcdFx0XHRkaXNhYmxlZF9saXN0X3ZpZXdzLnB1c2ggbmV3X3ZpZXdfaWRcblxuXHRcdFx0Q3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9vYmplY3RzXCIpLmluc2VydChwZXJtaXNzaW9uX29iamVjdClcblxuXHQjIDYg5oyB5LmF5YyWcmVwb3J0c1xuXHRpZiBfLmlzQXJyYXkoaW1wX2RhdGEucmVwb3J0cykgJiYgaW1wX2RhdGEucmVwb3J0cy5sZW5ndGggPiAwXG5cdFx0Xy5lYWNoIGltcF9kYXRhLnJlcG9ydHMsIChyZXBvcnQpLT5cblx0XHRcdGRlbGV0ZSByZXBvcnQuX2lkXG5cblx0XHRcdHJlcG9ydC5zcGFjZSA9IHNwYWNlX2lkXG5cdFx0XHRyZXBvcnQub3duZXIgPSB1c2VySWRcblxuXHRcdFx0Q3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicmVwb3J0c1wiKS5pbnNlcnQocmVwb3J0KVxuXHQjIyPmlbDmja7mjIHkuYXljJYg57uT5p2fIyMjXG5cbiMjI+eUseS6juS9v+eUqOaOpeWPo+aWueW8j+S8muWvvOiHtGNvbGxlY3Rpb27nmoRhZnRlcuOAgWJlZm9yZeS4reiOt+WPluS4jeWIsHVzZXJJZO+8jOWGjeatpOmXrumimOacquino+WGs+S5i+WJje+8jOi/mOaYr+S9v+eUqE1ldGhvZFxuSnNvblJvdXRlcy5hZGQgJ3Bvc3QnLCAnL2FwaS9jcmVhdG9yL2FwcF9wYWNrYWdlL2ltcG9ydC86c3BhY2VfaWQnLCAocmVxLCByZXMsIG5leHQpIC0+XG5cdHRyeVxuXHRcdHVzZXJJZCA9IFN0ZWVkb3MuZ2V0VXNlcklkRnJvbUF1dGhUb2tlbihyZXEsIHJlcyk7XG5cdFx0c3BhY2VfaWQgPSByZXEucGFyYW1zLnNwYWNlX2lkXG5cdFx0aW1wX2RhdGEgPSByZXEuYm9keVxuXHRcdGltcG9ydF9hcHBfcGFja2FnZSh1c2VySWQsIHNwYWNlX2lkLCBpbXBfZGF0YSlcblx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLCB7XG5cdFx0XHRjb2RlOiAyMDBcblx0XHRcdGRhdGE6IHt9XG5cdFx0fVxuXHRjYXRjaCBlXG5cdFx0Y29uc29sZS5lcnJvciBlLnN0YWNrXG5cdFx0SnNvblJvdXRlcy5zZW5kUmVzdWx0IHJlcywge1xuXHRcdFx0Y29kZTogZS5lcnJvclxuXHRcdFx0ZGF0YTogeyBlcnJvcnM6IGVycm9yTWVzc2FnZTogZS5yZWFzb24gfHwgZS5tZXNzYWdlIH1cblx0XHR9XG4jIyNcblxuTWV0ZW9yLm1ldGhvZHNcblx0J2ltcG9ydF9hcHBfcGFja2FnZSc6IChzcGFjZV9pZCwgaW1wX2RhdGEpLT5cblx0XHR1c2VySWQgPSB0aGlzLnVzZXJJZFxuXHRcdENyZWF0b3IuaW1wb3J0X2FwcF9wYWNrYWdlKHVzZXJJZCwgc3BhY2VfaWQsIGltcF9kYXRhKVxuIiwidmFyIHRyYW5zZm9ybUZpZWxkT3B0aW9ucywgdHJhbnNmb3JtRmlsdGVycztcblxudHJhbnNmb3JtRmlsdGVycyA9IGZ1bmN0aW9uKGZpbHRlcnMpIHtcbiAgdmFyIF9maWx0ZXJzO1xuICBfZmlsdGVycyA9IFtdO1xuICBfLmVhY2goZmlsdGVycywgZnVuY3Rpb24oZikge1xuICAgIGlmIChfLmlzQXJyYXkoZikgJiYgZi5sZW5ndGggPT09IDMpIHtcbiAgICAgIHJldHVybiBfZmlsdGVycy5wdXNoKHtcbiAgICAgICAgZmllbGQ6IGZbMF0sXG4gICAgICAgIG9wZXJhdGlvbjogZlsxXSxcbiAgICAgICAgdmFsdWU6IGZbMl1cbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gX2ZpbHRlcnMucHVzaChmKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gX2ZpbHRlcnM7XG59O1xuXG50cmFuc2Zvcm1GaWVsZE9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gIHZhciBfb3B0aW9ucztcbiAgaWYgKCFfLmlzQXJyYXkob3B0aW9ucykpIHtcbiAgICByZXR1cm4gb3B0aW9ucztcbiAgfVxuICBfb3B0aW9ucyA9IFtdO1xuICBfLmVhY2gob3B0aW9ucywgZnVuY3Rpb24obykge1xuICAgIGlmIChvICYmIF8uaGFzKG8sICdsYWJlbCcpICYmIF8uaGFzKG8sICd2YWx1ZScpKSB7XG4gICAgICByZXR1cm4gX29wdGlvbnMucHVzaChvLmxhYmVsICsgXCI6XCIgKyBvLnZhbHVlKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gX29wdGlvbnMuam9pbignLCcpO1xufTtcblxuQ3JlYXRvci5pbXBvcnRPYmplY3QgPSBmdW5jdGlvbih1c2VySWQsIHNwYWNlX2lkLCBvYmplY3QsIGxpc3Rfdmlld3NfaWRfbWFwcykge1xuICB2YXIgX2ZpZWxkbmFtZXMsIGFjdGlvbnMsIGZpZWxkcywgaGFzUmVjZW50VmlldywgaW50ZXJuYWxfbGlzdF92aWV3LCBvYmpfbGlzdF92aWV3cywgdHJpZ2dlcnM7XG4gIGNvbnNvbGUubG9nKCctLS0tLS0tLS0tLS0tLS0tLS1pbXBvcnRPYmplY3QtLS0tLS0tLS0tLS0tLS0tLS0nLCBvYmplY3QubmFtZSk7XG4gIGZpZWxkcyA9IG9iamVjdC5maWVsZHM7XG4gIHRyaWdnZXJzID0gb2JqZWN0LnRyaWdnZXJzO1xuICBhY3Rpb25zID0gb2JqZWN0LmFjdGlvbnM7XG4gIG9ial9saXN0X3ZpZXdzID0gb2JqZWN0Lmxpc3Rfdmlld3M7XG4gIGRlbGV0ZSBvYmplY3QuX2lkO1xuICBkZWxldGUgb2JqZWN0LmZpZWxkcztcbiAgZGVsZXRlIG9iamVjdC50cmlnZ2VycztcbiAgZGVsZXRlIG9iamVjdC5hY3Rpb25zO1xuICBkZWxldGUgb2JqZWN0LnBlcm1pc3Npb25zO1xuICBkZWxldGUgb2JqZWN0Lmxpc3Rfdmlld3M7XG4gIG9iamVjdC5zcGFjZSA9IHNwYWNlX2lkO1xuICBvYmplY3Qub3duZXIgPSB1c2VySWQ7XG4gIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdHNcIikuaW5zZXJ0KG9iamVjdCk7XG4gIGludGVybmFsX2xpc3RfdmlldyA9IHt9O1xuICBoYXNSZWNlbnRWaWV3ID0gZmFsc2U7XG4gIGNvbnNvbGUubG9nKCfmjIHkuYXljJblr7nosaFsaXN0X3ZpZXdzJyk7XG4gIF8uZWFjaChvYmpfbGlzdF92aWV3cywgZnVuY3Rpb24obGlzdF92aWV3KSB7XG4gICAgdmFyIG5ld19pZCwgb2xkX2lkLCBvcHRpb25zO1xuICAgIG9sZF9pZCA9IGxpc3Rfdmlldy5faWQ7XG4gICAgZGVsZXRlIGxpc3Rfdmlldy5faWQ7XG4gICAgbGlzdF92aWV3LnNwYWNlID0gc3BhY2VfaWQ7XG4gICAgbGlzdF92aWV3Lm93bmVyID0gdXNlcklkO1xuICAgIGxpc3Rfdmlldy5vYmplY3RfbmFtZSA9IG9iamVjdC5uYW1lO1xuICAgIGlmIChDcmVhdG9yLmlzUmVjZW50VmlldyhsaXN0X3ZpZXcpKSB7XG4gICAgICBoYXNSZWNlbnRWaWV3ID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGxpc3Rfdmlldy5maWx0ZXJzKSB7XG4gICAgICBsaXN0X3ZpZXcuZmlsdGVycyA9IHRyYW5zZm9ybUZpbHRlcnMobGlzdF92aWV3LmZpbHRlcnMpO1xuICAgIH1cbiAgICBpZiAoQ3JlYXRvci5pc0FsbFZpZXcobGlzdF92aWV3KSB8fCBDcmVhdG9yLmlzUmVjZW50VmlldyhsaXN0X3ZpZXcpKSB7XG4gICAgICBvcHRpb25zID0ge1xuICAgICAgICAkc2V0OiBsaXN0X3ZpZXdcbiAgICAgIH07XG4gICAgICBpZiAoIWxpc3Rfdmlldy5jb2x1bW5zKSB7XG4gICAgICAgIG9wdGlvbnMuJHVuc2V0ID0ge1xuICAgICAgICAgIGNvbHVtbnM6ICcnXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS51cGRhdGUoe1xuICAgICAgICBvYmplY3RfbmFtZTogb2JqZWN0Lm5hbWUsXG4gICAgICAgIG5hbWU6IGxpc3Rfdmlldy5uYW1lLFxuICAgICAgICBzcGFjZTogc3BhY2VfaWRcbiAgICAgIH0sIG9wdGlvbnMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZXdfaWQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfbGlzdHZpZXdzXCIpLmluc2VydChsaXN0X3ZpZXcpO1xuICAgICAgcmV0dXJuIGxpc3Rfdmlld3NfaWRfbWFwc1tvYmplY3QubmFtZSArIFwiX1wiICsgb2xkX2lkXSA9IG5ld19pZDtcbiAgICB9XG4gIH0pO1xuICBpZiAoIWhhc1JlY2VudFZpZXcpIHtcbiAgICBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfbGlzdHZpZXdzXCIpLnJlbW92ZSh7XG4gICAgICBuYW1lOiBcInJlY2VudFwiLFxuICAgICAgc3BhY2U6IHNwYWNlX2lkLFxuICAgICAgb2JqZWN0X25hbWU6IG9iamVjdC5uYW1lLFxuICAgICAgb3duZXI6IHVzZXJJZFxuICAgIH0pO1xuICB9XG4gIGNvbnNvbGUubG9nKCfmjIHkuYXljJblr7nosaHlrZfmrrUnKTtcbiAgX2ZpZWxkbmFtZXMgPSBbXTtcbiAgXy5lYWNoKGZpZWxkcywgZnVuY3Rpb24oZmllbGQsIGspIHtcbiAgICBkZWxldGUgZmllbGQuX2lkO1xuICAgIGZpZWxkLnNwYWNlID0gc3BhY2VfaWQ7XG4gICAgZmllbGQub3duZXIgPSB1c2VySWQ7XG4gICAgZmllbGQub2JqZWN0ID0gb2JqZWN0Lm5hbWU7XG4gICAgaWYgKGZpZWxkLm9wdGlvbnMpIHtcbiAgICAgIGZpZWxkLm9wdGlvbnMgPSB0cmFuc2Zvcm1GaWVsZE9wdGlvbnMoZmllbGQub3B0aW9ucyk7XG4gICAgfVxuICAgIGlmICghXy5oYXMoZmllbGQsIFwibmFtZVwiKSkge1xuICAgICAgZmllbGQubmFtZSA9IGs7XG4gICAgfVxuICAgIF9maWVsZG5hbWVzLnB1c2goZmllbGQubmFtZSk7XG4gICAgaWYgKGZpZWxkLm5hbWUgPT09IFwibmFtZVwiKSB7XG4gICAgICBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfZmllbGRzXCIpLnVwZGF0ZSh7XG4gICAgICAgIG9iamVjdDogb2JqZWN0Lm5hbWUsXG4gICAgICAgIG5hbWU6IFwibmFtZVwiLFxuICAgICAgICBzcGFjZTogc3BhY2VfaWRcbiAgICAgIH0sIHtcbiAgICAgICAgJHNldDogZmllbGRcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfZmllbGRzXCIpLmluc2VydChmaWVsZCk7XG4gICAgfVxuICAgIGlmICghXy5jb250YWlucyhfZmllbGRuYW1lcywgJ25hbWUnKSkge1xuICAgICAgcmV0dXJuIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9maWVsZHNcIikuZGlyZWN0LnJlbW92ZSh7XG4gICAgICAgIG9iamVjdDogb2JqZWN0Lm5hbWUsXG4gICAgICAgIG5hbWU6IFwibmFtZVwiLFxuICAgICAgICBzcGFjZTogc3BhY2VfaWRcbiAgICAgIH0pO1xuICAgIH1cbiAgfSk7XG4gIGNvbnNvbGUubG9nKCfmjIHkuYXljJbop6blj5HlmagnKTtcbiAgXy5lYWNoKHRyaWdnZXJzLCBmdW5jdGlvbih0cmlnZ2VyLCBrKSB7XG4gICAgZGVsZXRlIHRyaWdnZXJzLl9pZDtcbiAgICB0cmlnZ2VyLnNwYWNlID0gc3BhY2VfaWQ7XG4gICAgdHJpZ2dlci5vd25lciA9IHVzZXJJZDtcbiAgICB0cmlnZ2VyLm9iamVjdCA9IG9iamVjdC5uYW1lO1xuICAgIGlmICghXy5oYXModHJpZ2dlciwgXCJuYW1lXCIpKSB7XG4gICAgICB0cmlnZ2VyLm5hbWUgPSBrLnJlcGxhY2UobmV3IFJlZ0V4cChcIlxcXFwuXCIsIFwiZ1wiKSwgXCJfXCIpO1xuICAgIH1cbiAgICBpZiAoIV8uaGFzKHRyaWdnZXIsIFwiaXNfZW5hYmxlXCIpKSB7XG4gICAgICB0cmlnZ2VyLmlzX2VuYWJsZSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfdHJpZ2dlcnNcIikuaW5zZXJ0KHRyaWdnZXIpO1xuICB9KTtcbiAgY29uc29sZS5sb2coJ+aMgeS5heWMluaTjeS9nCcpO1xuICBfLmVhY2goYWN0aW9ucywgZnVuY3Rpb24oYWN0aW9uLCBrKSB7XG4gICAgZGVsZXRlIGFjdGlvbi5faWQ7XG4gICAgYWN0aW9uLnNwYWNlID0gc3BhY2VfaWQ7XG4gICAgYWN0aW9uLm93bmVyID0gdXNlcklkO1xuICAgIGFjdGlvbi5vYmplY3QgPSBvYmplY3QubmFtZTtcbiAgICBpZiAoIV8uaGFzKGFjdGlvbiwgXCJuYW1lXCIpKSB7XG4gICAgICBhY3Rpb24ubmFtZSA9IGsucmVwbGFjZShuZXcgUmVnRXhwKFwiXFxcXC5cIiwgXCJnXCIpLCBcIl9cIik7XG4gICAgfVxuICAgIGlmICghXy5oYXMoYWN0aW9uLCBcImlzX2VuYWJsZVwiKSkge1xuICAgICAgYWN0aW9uLmlzX2VuYWJsZSA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJvYmplY3RfYWN0aW9uc1wiKS5pbnNlcnQoYWN0aW9uKTtcbiAgfSk7XG4gIHJldHVybiBjb25zb2xlLmxvZygnLS0tLS0tLS0tLS0tLS0tLS0taW1wb3J0T2JqZWN0IGVuZC0tLS0tLS0tLS0tLS0tLS0tLScsIG9iamVjdC5uYW1lKTtcbn07XG5cbkNyZWF0b3IuaW1wb3J0X2FwcF9wYWNrYWdlID0gZnVuY3Rpb24odXNlcklkLCBzcGFjZV9pZCwgaW1wX2RhdGEsIGZyb21fdGVtcGxhdGUpIHtcbiAgdmFyIGFwcHNfaWRfbWFwcywgaW1wX2FwcF9pZHMsIGltcF9vYmplY3RfbmFtZXMsIGxpc3Rfdmlld3NfaWRfbWFwcywgb2JqZWN0X25hbWVzLCBwZXJtaXNzaW9uX3NldF9pZF9tYXBzLCBwZXJtaXNzaW9uX3NldF9pZHM7XG4gIGlmICghdXNlcklkKSB7XG4gICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjQwMVwiLCBcIkF1dGhlbnRpY2F0aW9uIGlzIHJlcXVpcmVkIGFuZCBoYXMgbm90IGJlZW4gcHJvdmlkZWQuXCIpO1xuICB9XG4gIGlmICghQ3JlYXRvci5pc1NwYWNlQWRtaW4oc3BhY2VfaWQsIHVzZXJJZCkpIHtcbiAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNDAxXCIsIFwiUGVybWlzc2lvbiBkZW5pZWQuXCIpO1xuICB9XG5cbiAgLyrmlbDmja7moKHpqowg5byA5aeLICovXG4gIGNoZWNrKGltcF9kYXRhLCBPYmplY3QpO1xuICBpZiAoIWZyb21fdGVtcGxhdGUpIHtcbiAgICBpbXBfYXBwX2lkcyA9IF8ucGx1Y2soaW1wX2RhdGEuYXBwcywgXCJfaWRcIik7XG4gICAgaWYgKF8uaXNBcnJheShpbXBfZGF0YS5hcHBzKSAmJiBpbXBfZGF0YS5hcHBzLmxlbmd0aCA+IDApIHtcbiAgICAgIF8uZWFjaChpbXBfZGF0YS5hcHBzLCBmdW5jdGlvbihhcHApIHtcbiAgICAgICAgaWYgKF8uaW5jbHVkZShfLmtleXMoQ3JlYXRvci5BcHBzKSwgYXBwLl9pZCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5bqU55SoJ1wiICsgYXBwLm5hbWUgKyBcIiflt7LlrZjlnKhcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBpZiAoXy5pc0FycmF5KGltcF9kYXRhLm9iamVjdHMpICYmIGltcF9kYXRhLm9iamVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgXy5lYWNoKGltcF9kYXRhLm9iamVjdHMsIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgICBpZiAoXy5pbmNsdWRlKF8ua2V5cyhDcmVhdG9yLk9iamVjdHMpLCBvYmplY3QubmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5a+56LGhJ1wiICsgb2JqZWN0Lm5hbWUgKyBcIiflt7LlrZjlnKhcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIF8uZWFjaChvYmplY3QudHJpZ2dlcnMsIGZ1bmN0aW9uKHRyaWdnZXIpIHtcbiAgICAgICAgICBpZiAodHJpZ2dlci5vbiA9PT0gJ3NlcnZlcicgJiYgIVN0ZWVkb3MuaXNMZWdhbFZlcnNpb24oc3BhY2VfaWQsIFwid29ya2Zsb3cuZW50ZXJwcmlzZVwiKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi5Y+q5pyJ5LyB5Lia54mI5pSv5oyB6YWN572u5pyN5Yqh56uv55qE6Kem5Y+R5ZmoXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaW1wX29iamVjdF9uYW1lcyA9IF8ucGx1Y2soaW1wX2RhdGEub2JqZWN0cywgXCJuYW1lXCIpO1xuICAgIG9iamVjdF9uYW1lcyA9IF8ua2V5cyhDcmVhdG9yLk9iamVjdHMpO1xuICAgIGlmIChfLmlzQXJyYXkoaW1wX2RhdGEuYXBwcykgJiYgaW1wX2RhdGEuYXBwcy5sZW5ndGggPiAwKSB7XG4gICAgICBfLmVhY2goaW1wX2RhdGEuYXBwcywgZnVuY3Rpb24oYXBwKSB7XG4gICAgICAgIHJldHVybiBfLmVhY2goYXBwLm9iamVjdHMsIGZ1bmN0aW9uKG9iamVjdF9uYW1lKSB7XG4gICAgICAgICAgaWYgKCFfLmluY2x1ZGUob2JqZWN0X25hbWVzLCBvYmplY3RfbmFtZSkgJiYgIV8uaW5jbHVkZShpbXBfb2JqZWN0X25hbWVzLCBvYmplY3RfbmFtZSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLlupTnlKgnXCIgKyBhcHAubmFtZSArIFwiJ+S4reaMh+WumueahOWvueixoSdcIiArIG9iamVjdF9uYW1lICsgXCIn5LiN5a2Y5ZyoXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKF8uaXNBcnJheShpbXBfZGF0YS5saXN0X3ZpZXdzKSAmJiBpbXBfZGF0YS5saXN0X3ZpZXdzLmxlbmd0aCA+IDApIHtcbiAgICAgIF8uZWFjaChpbXBfZGF0YS5saXN0X3ZpZXdzLCBmdW5jdGlvbihsaXN0X3ZpZXcpIHtcbiAgICAgICAgaWYgKCFsaXN0X3ZpZXcub2JqZWN0X25hbWUgfHwgIV8uaXNTdHJpbmcobGlzdF92aWV3Lm9iamVjdF9uYW1lKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLliJfooajop4blm74nXCIgKyBsaXN0X3ZpZXcubmFtZSArIFwiJ+eahG9iamVjdF9uYW1l5bGe5oCn5peg5pWIXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICghXy5pbmNsdWRlKG9iamVjdF9uYW1lcywgbGlzdF92aWV3Lm9iamVjdF9uYW1lKSAmJiAhXy5pbmNsdWRlKGltcF9vYmplY3RfbmFtZXMsIGxpc3Rfdmlldy5vYmplY3RfbmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5YiX6KGo6KeG5Zu+J1wiICsgbGlzdF92aWV3Lm5hbWUgKyBcIifkuK3mjIflrprnmoTlr7nosaEnXCIgKyBsaXN0X3ZpZXcub2JqZWN0X25hbWUgKyBcIifkuI3lrZjlnKhcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBwZXJtaXNzaW9uX3NldF9pZHMgPSBfLnBsdWNrKGltcF9kYXRhLnBlcm1pc3Npb25fc2V0LCBcIl9pZFwiKTtcbiAgICBpZiAoXy5pc0FycmF5KGltcF9kYXRhLnBlcm1pc3Npb25fc2V0KSAmJiBpbXBfZGF0YS5wZXJtaXNzaW9uX3NldC5sZW5ndGggPiAwKSB7XG4gICAgICBfLmVhY2goaW1wX2RhdGEucGVybWlzc2lvbl9zZXQsIGZ1bmN0aW9uKHBlcm1pc3Npb25fc2V0KSB7XG4gICAgICAgIGlmIChDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX3NldFwiKS5maW5kT25lKHtcbiAgICAgICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICAgICAgbmFtZTogcGVybWlzc2lvbl9zZXQubmFtZVxuICAgICAgICB9LCB7XG4gICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICBfaWQ6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0pKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcig1MDAsIFwi5p2D6ZmQ57uE5ZCN56ewJ1wiICsgcGVybWlzc2lvbl9zZXQubmFtZSArIFwiJ+S4jeiDvemHjeWkjVwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gXy5lYWNoKHBlcm1pc3Npb25fc2V0LmFzc2lnbmVkX2FwcHMsIGZ1bmN0aW9uKGFwcF9pZCkge1xuICAgICAgICAgIGlmICghXy5pbmNsdWRlKF8ua2V5cyhDcmVhdG9yLkFwcHMpLCBhcHBfaWQpICYmICFfLmluY2x1ZGUoaW1wX2FwcF9pZHMsIGFwcF9pZCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLmnYPpmZDnu4QnXCIgKyBwZXJtaXNzaW9uX3NldC5uYW1lICsgXCIn55qE5o6I5p2D5bqU55SoJ1wiICsgYXBwX2lkICsgXCIn5LiN5a2Y5ZyoXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKF8uaXNBcnJheShpbXBfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMpICYmIGltcF9kYXRhLnBlcm1pc3Npb25fb2JqZWN0cy5sZW5ndGggPiAwKSB7XG4gICAgICBfLmVhY2goaW1wX2RhdGEucGVybWlzc2lvbl9vYmplY3RzLCBmdW5jdGlvbihwZXJtaXNzaW9uX29iamVjdCkge1xuICAgICAgICBpZiAoIXBlcm1pc3Npb25fb2JqZWN0Lm9iamVjdF9uYW1lIHx8ICFfLmlzU3RyaW5nKHBlcm1pc3Npb25fb2JqZWN0Lm9iamVjdF9uYW1lKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLmnYPpmZDpm4YnXCIgKyBwZXJtaXNzaW9uX29iamVjdC5uYW1lICsgXCIn55qEb2JqZWN0X25hbWXlsZ7mgKfml6DmlYhcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFfLmluY2x1ZGUob2JqZWN0X25hbWVzLCBwZXJtaXNzaW9uX29iamVjdC5vYmplY3RfbmFtZSkgJiYgIV8uaW5jbHVkZShpbXBfb2JqZWN0X25hbWVzLCBwZXJtaXNzaW9uX29iamVjdC5vYmplY3RfbmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5p2D6ZmQ6ZuGJ1wiICsgbGlzdF92aWV3Lm5hbWUgKyBcIifkuK3mjIflrprnmoTlr7nosaEnXCIgKyBwZXJtaXNzaW9uX29iamVjdC5vYmplY3RfbmFtZSArIFwiJ+S4jeWtmOWcqFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIV8uaGFzKHBlcm1pc3Npb25fb2JqZWN0LCBcInBlcm1pc3Npb25fc2V0X2lkXCIpIHx8ICFfLmlzU3RyaW5nKHBlcm1pc3Npb25fb2JqZWN0LnBlcm1pc3Npb25fc2V0X2lkKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLmnYPpmZDpm4YnXCIgKyBwZXJtaXNzaW9uX29iamVjdC5uYW1lICsgXCIn55qEcGVybWlzc2lvbl9zZXRfaWTlsZ7mgKfml6DmlYhcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoIV8uaW5jbHVkZShwZXJtaXNzaW9uX3NldF9pZHMsIHBlcm1pc3Npb25fb2JqZWN0LnBlcm1pc3Npb25fc2V0X2lkKSkge1xuICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgXCLmnYPpmZDpm4YnXCIgKyBwZXJtaXNzaW9uX29iamVjdC5uYW1lICsgXCIn5oyH5a6a55qE5p2D6ZmQ57uEJ1wiICsgcGVybWlzc2lvbl9vYmplY3QucGVybWlzc2lvbl9zZXRfaWQgKyBcIiflgLzkuI3lnKjlr7zlhaXnmoRwZXJtaXNzaW9uX3NldOS4rVwiKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlmIChfLmlzQXJyYXkoaW1wX2RhdGEucmVwb3J0cykgJiYgaW1wX2RhdGEucmVwb3J0cy5sZW5ndGggPiAwKSB7XG4gICAgICBfLmVhY2goaW1wX2RhdGEucmVwb3J0cywgZnVuY3Rpb24ocmVwb3J0KSB7XG4gICAgICAgIGlmICghcmVwb3J0Lm9iamVjdF9uYW1lIHx8ICFfLmlzU3RyaW5nKHJlcG9ydC5vYmplY3RfbmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIFwi5oql6KGoJ1wiICsgcmVwb3J0Lm5hbWUgKyBcIifnmoRvYmplY3RfbmFtZeWxnuaAp+aXoOaViFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIV8uaW5jbHVkZShvYmplY3RfbmFtZXMsIHJlcG9ydC5vYmplY3RfbmFtZSkgJiYgIV8uaW5jbHVkZShpbXBfb2JqZWN0X25hbWVzLCByZXBvcnQub2JqZWN0X25hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuaKpeihqCdcIiArIHJlcG9ydC5uYW1lICsgXCIn5Lit5oyH5a6a55qE5a+56LGhJ1wiICsgcmVwb3J0Lm9iamVjdF9uYW1lICsgXCIn5LiN5a2Y5ZyoXCIpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICAvKuaVsOaNruagoemqjCDnu5PmnZ8gKi9cblxuICAvKuaVsOaNruaMgeS5heWMliDlvIDlp4sgKi9cbiAgYXBwc19pZF9tYXBzID0ge307XG4gIGxpc3Rfdmlld3NfaWRfbWFwcyA9IHt9O1xuICBwZXJtaXNzaW9uX3NldF9pZF9tYXBzID0ge307XG4gIGlmIChfLmlzQXJyYXkoaW1wX2RhdGEuYXBwcykgJiYgaW1wX2RhdGEuYXBwcy5sZW5ndGggPiAwKSB7XG4gICAgXy5lYWNoKGltcF9kYXRhLmFwcHMsIGZ1bmN0aW9uKGFwcCkge1xuICAgICAgdmFyIG5ld19pZCwgb2xkX2lkO1xuICAgICAgb2xkX2lkID0gYXBwLl9pZDtcbiAgICAgIGRlbGV0ZSBhcHAuX2lkO1xuICAgICAgYXBwLnNwYWNlID0gc3BhY2VfaWQ7XG4gICAgICBhcHAub3duZXIgPSB1c2VySWQ7XG4gICAgICBhcHAuaXNfY3JlYXRvciA9IHRydWU7XG4gICAgICBuZXdfaWQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJhcHBzXCIpLmluc2VydChhcHApO1xuICAgICAgcmV0dXJuIGFwcHNfaWRfbWFwc1tvbGRfaWRdID0gbmV3X2lkO1xuICAgIH0pO1xuICB9XG4gIGlmIChfLmlzQXJyYXkoaW1wX2RhdGEub2JqZWN0cykgJiYgaW1wX2RhdGEub2JqZWN0cy5sZW5ndGggPiAwKSB7XG4gICAgXy5lYWNoKGltcF9kYXRhLm9iamVjdHMsIGZ1bmN0aW9uKG9iamVjdCkge1xuICAgICAgcmV0dXJuIENyZWF0b3IuaW1wb3J0T2JqZWN0KHVzZXJJZCwgc3BhY2VfaWQsIG9iamVjdCwgbGlzdF92aWV3c19pZF9tYXBzKTtcbiAgICB9KTtcbiAgfVxuICBpZiAoXy5pc0FycmF5KGltcF9kYXRhLmxpc3Rfdmlld3MpICYmIGltcF9kYXRhLmxpc3Rfdmlld3MubGVuZ3RoID4gMCkge1xuICAgIF8uZWFjaChpbXBfZGF0YS5saXN0X3ZpZXdzLCBmdW5jdGlvbihsaXN0X3ZpZXcpIHtcbiAgICAgIHZhciBfbGlzdF92aWV3LCBuZXdfaWQsIG9sZF9pZDtcbiAgICAgIG9sZF9pZCA9IGxpc3Rfdmlldy5faWQ7XG4gICAgICBkZWxldGUgbGlzdF92aWV3Ll9pZDtcbiAgICAgIGxpc3Rfdmlldy5zcGFjZSA9IHNwYWNlX2lkO1xuICAgICAgbGlzdF92aWV3Lm93bmVyID0gdXNlcklkO1xuICAgICAgaWYgKENyZWF0b3IuaXNBbGxWaWV3KGxpc3RfdmlldykgfHwgQ3JlYXRvci5pc1JlY2VudFZpZXcobGlzdF92aWV3KSkge1xuICAgICAgICBfbGlzdF92aWV3ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS5maW5kT25lKHtcbiAgICAgICAgICBvYmplY3RfbmFtZTogbGlzdF92aWV3Lm9iamVjdF9uYW1lLFxuICAgICAgICAgIG5hbWU6IGxpc3Rfdmlldy5uYW1lLFxuICAgICAgICAgIHNwYWNlOiBzcGFjZV9pZFxuICAgICAgICB9LCB7XG4gICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICBfaWQ6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoX2xpc3Rfdmlldykge1xuICAgICAgICAgIG5ld19pZCA9IF9saXN0X3ZpZXcuX2lkO1xuICAgICAgICB9XG4gICAgICAgIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikudXBkYXRlKHtcbiAgICAgICAgICBvYmplY3RfbmFtZTogbGlzdF92aWV3Lm9iamVjdF9uYW1lLFxuICAgICAgICAgIG5hbWU6IGxpc3Rfdmlldy5uYW1lLFxuICAgICAgICAgIHNwYWNlOiBzcGFjZV9pZFxuICAgICAgICB9LCB7XG4gICAgICAgICAgJHNldDogbGlzdF92aWV3XG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3X2lkID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS5pbnNlcnQobGlzdF92aWV3KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBsaXN0X3ZpZXdzX2lkX21hcHNbbGlzdF92aWV3Lm9iamVjdF9uYW1lICsgXCJfXCIgKyBvbGRfaWRdID0gbmV3X2lkO1xuICAgIH0pO1xuICB9XG4gIGlmIChfLmlzQXJyYXkoaW1wX2RhdGEucGVybWlzc2lvbl9zZXQpICYmIGltcF9kYXRhLnBlcm1pc3Npb25fc2V0Lmxlbmd0aCA+IDApIHtcbiAgICBfLmVhY2goaW1wX2RhdGEucGVybWlzc2lvbl9zZXQsIGZ1bmN0aW9uKHBlcm1pc3Npb25fc2V0KSB7XG4gICAgICB2YXIgYXNzaWduZWRfYXBwcywgbmV3X2lkLCBvbGRfaWQsIHBlcm1pc3Npb25fc2V0X3VzZXJzO1xuICAgICAgb2xkX2lkID0gcGVybWlzc2lvbl9zZXQuX2lkO1xuICAgICAgZGVsZXRlIHBlcm1pc3Npb25fc2V0Ll9pZDtcbiAgICAgIHBlcm1pc3Npb25fc2V0LnNwYWNlID0gc3BhY2VfaWQ7XG4gICAgICBwZXJtaXNzaW9uX3NldC5vd25lciA9IHVzZXJJZDtcbiAgICAgIHBlcm1pc3Npb25fc2V0X3VzZXJzID0gW107XG4gICAgICBfLmVhY2gocGVybWlzc2lvbl9zZXQudXNlcnMsIGZ1bmN0aW9uKHVzZXJfaWQpIHtcbiAgICAgICAgdmFyIHNwYWNlX3VzZXI7XG4gICAgICAgIHNwYWNlX3VzZXIgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJzcGFjZV91c2Vyc1wiKS5maW5kT25lKHtcbiAgICAgICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICAgICAgdXNlcjogdXNlcl9pZFxuICAgICAgICB9LCB7XG4gICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICBfaWQ6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoc3BhY2VfdXNlcikge1xuICAgICAgICAgIHJldHVybiBwZXJtaXNzaW9uX3NldF91c2Vycy5wdXNoKHVzZXJfaWQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIGFzc2lnbmVkX2FwcHMgPSBbXTtcbiAgICAgIF8uZWFjaChwZXJtaXNzaW9uX3NldC5hc3NpZ25lZF9hcHBzLCBmdW5jdGlvbihhcHBfaWQpIHtcbiAgICAgICAgaWYgKF8uaW5jbHVkZShfLmtleXMoQ3JlYXRvci5BcHBzKSwgYXBwX2lkKSkge1xuICAgICAgICAgIHJldHVybiBhc3NpZ25lZF9hcHBzLnB1c2goYXBwX2lkKTtcbiAgICAgICAgfSBlbHNlIGlmIChhcHBzX2lkX21hcHNbYXBwX2lkXSkge1xuICAgICAgICAgIHJldHVybiBhc3NpZ25lZF9hcHBzLnB1c2goYXBwc19pZF9tYXBzW2FwcF9pZF0pO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIG5ld19pZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmluc2VydChwZXJtaXNzaW9uX3NldCk7XG4gICAgICByZXR1cm4gcGVybWlzc2lvbl9zZXRfaWRfbWFwc1tvbGRfaWRdID0gbmV3X2lkO1xuICAgIH0pO1xuICB9XG4gIGlmIChfLmlzQXJyYXkoaW1wX2RhdGEucGVybWlzc2lvbl9vYmplY3RzKSAmJiBpbXBfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMubGVuZ3RoID4gMCkge1xuICAgIF8uZWFjaChpbXBfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMsIGZ1bmN0aW9uKHBlcm1pc3Npb25fb2JqZWN0KSB7XG4gICAgICB2YXIgZGlzYWJsZWRfbGlzdF92aWV3cztcbiAgICAgIGRlbGV0ZSBwZXJtaXNzaW9uX29iamVjdC5faWQ7XG4gICAgICBwZXJtaXNzaW9uX29iamVjdC5zcGFjZSA9IHNwYWNlX2lkO1xuICAgICAgcGVybWlzc2lvbl9vYmplY3Qub3duZXIgPSB1c2VySWQ7XG4gICAgICBwZXJtaXNzaW9uX29iamVjdC5wZXJtaXNzaW9uX3NldF9pZCA9IHBlcm1pc3Npb25fc2V0X2lkX21hcHNbcGVybWlzc2lvbl9vYmplY3QucGVybWlzc2lvbl9zZXRfaWRdO1xuICAgICAgZGlzYWJsZWRfbGlzdF92aWV3cyA9IFtdO1xuICAgICAgXy5lYWNoKHBlcm1pc3Npb25fb2JqZWN0LmRpc2FibGVkX2xpc3Rfdmlld3MsIGZ1bmN0aW9uKGxpc3Rfdmlld19pZCkge1xuICAgICAgICB2YXIgbmV3X3ZpZXdfaWQ7XG4gICAgICAgIG5ld192aWV3X2lkID0gbGlzdF92aWV3c19pZF9tYXBzW3Blcm1pc3Npb25fb2JqZWN0Lm9iamVjdF9uYW1lICsgXCJfXCIgKyBsaXN0X3ZpZXdfaWRdO1xuICAgICAgICBpZiAobmV3X3ZpZXdfaWQpIHtcbiAgICAgICAgICByZXR1cm4gZGlzYWJsZWRfbGlzdF92aWV3cy5wdXNoKG5ld192aWV3X2lkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9vYmplY3RzXCIpLmluc2VydChwZXJtaXNzaW9uX29iamVjdCk7XG4gICAgfSk7XG4gIH1cbiAgaWYgKF8uaXNBcnJheShpbXBfZGF0YS5yZXBvcnRzKSAmJiBpbXBfZGF0YS5yZXBvcnRzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4gXy5lYWNoKGltcF9kYXRhLnJlcG9ydHMsIGZ1bmN0aW9uKHJlcG9ydCkge1xuICAgICAgZGVsZXRlIHJlcG9ydC5faWQ7XG4gICAgICByZXBvcnQuc3BhY2UgPSBzcGFjZV9pZDtcbiAgICAgIHJlcG9ydC5vd25lciA9IHVzZXJJZDtcbiAgICAgIHJldHVybiBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJyZXBvcnRzXCIpLmluc2VydChyZXBvcnQpO1xuICAgIH0pO1xuICB9XG5cbiAgLyrmlbDmja7mjIHkuYXljJYg57uT5p2fICovXG59O1xuXG5cbi8q55Sx5LqO5L2/55So5o6l5Y+j5pa55byP5Lya5a+86Ie0Y29sbGVjdGlvbueahGFmdGVy44CBYmVmb3Jl5Lit6I635Y+W5LiN5YiwdXNlcklk77yM5YaN5q2k6Zeu6aKY5pyq6Kej5Yaz5LmL5YmN77yM6L+Y5piv5L2/55SoTWV0aG9kXG5Kc29uUm91dGVzLmFkZCAncG9zdCcsICcvYXBpL2NyZWF0b3IvYXBwX3BhY2thZ2UvaW1wb3J0LzpzcGFjZV9pZCcsIChyZXEsIHJlcywgbmV4dCkgLT5cblx0dHJ5XG5cdFx0dXNlcklkID0gU3RlZWRvcy5nZXRVc2VySWRGcm9tQXV0aFRva2VuKHJlcSwgcmVzKTtcblx0XHRzcGFjZV9pZCA9IHJlcS5wYXJhbXMuc3BhY2VfaWRcblx0XHRpbXBfZGF0YSA9IHJlcS5ib2R5XG5cdFx0aW1wb3J0X2FwcF9wYWNrYWdlKHVzZXJJZCwgc3BhY2VfaWQsIGltcF9kYXRhKVxuXHRcdEpzb25Sb3V0ZXMuc2VuZFJlc3VsdCByZXMsIHtcblx0XHRcdGNvZGU6IDIwMFxuXHRcdFx0ZGF0YToge31cblx0XHR9XG5cdGNhdGNoIGVcblx0XHRjb25zb2xlLmVycm9yIGUuc3RhY2tcblx0XHRKc29uUm91dGVzLnNlbmRSZXN1bHQgcmVzLCB7XG5cdFx0XHRjb2RlOiBlLmVycm9yXG5cdFx0XHRkYXRhOiB7IGVycm9yczogZXJyb3JNZXNzYWdlOiBlLnJlYXNvbiB8fCBlLm1lc3NhZ2UgfVxuXHRcdH1cbiAqL1xuXG5NZXRlb3IubWV0aG9kcyh7XG4gICdpbXBvcnRfYXBwX3BhY2thZ2UnOiBmdW5jdGlvbihzcGFjZV9pZCwgaW1wX2RhdGEpIHtcbiAgICB2YXIgdXNlcklkO1xuICAgIHVzZXJJZCA9IHRoaXMudXNlcklkO1xuICAgIHJldHVybiBDcmVhdG9yLmltcG9ydF9hcHBfcGFja2FnZSh1c2VySWQsIHNwYWNlX2lkLCBpbXBfZGF0YSk7XG4gIH1cbn0pO1xuIiwiTWV0ZW9yLm1ldGhvZHNcblx0XCJjcmVhdG9yLmxpc3R2aWV3c19vcHRpb25zXCI6IChvcHRpb25zKS0+XG5cdFx0aWYgb3B0aW9ucz8ucGFyYW1zPy5yZWZlcmVuY2VfdG9cblxuXHRcdFx0b2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qob3B0aW9ucy5wYXJhbXMucmVmZXJlbmNlX3RvKVxuXG5cdFx0XHRuYW1lX2ZpZWxkX2tleSA9IG9iamVjdC5OQU1FX0ZJRUxEX0tFWVxuXG5cdFx0XHRxdWVyeSA9IHt9XG5cdFx0XHRpZiBvcHRpb25zLnBhcmFtcy5zcGFjZVxuXHRcdFx0XHRxdWVyeS5zcGFjZSA9IG9wdGlvbnMucGFyYW1zLnNwYWNlXG5cblx0XHRcdFx0c29ydCA9IG9wdGlvbnM/LnNvcnRcblxuXHRcdFx0XHRzZWxlY3RlZCA9IG9wdGlvbnM/LnNlbGVjdGVkIHx8IFtdXG5cblx0XHRcdFx0aWYgb3B0aW9ucy5zZWFyY2hUZXh0XG5cdFx0XHRcdFx0c2VhcmNoVGV4dFF1ZXJ5ID0ge31cblx0XHRcdFx0XHRzZWFyY2hUZXh0UXVlcnlbbmFtZV9maWVsZF9rZXldID0geyRyZWdleDogb3B0aW9ucy5zZWFyY2hUZXh0fVxuXG5cdFx0XHRcdGlmIG9wdGlvbnM/LnZhbHVlcz8ubGVuZ3RoXG5cdFx0XHRcdFx0aWYgb3B0aW9ucy5zZWFyY2hUZXh0XG5cdFx0XHRcdFx0XHRxdWVyeS4kb3IgPSBbe19pZDogeyRpbjogb3B0aW9ucy52YWx1ZXN9fSwgc2VhcmNoVGV4dFF1ZXJ5LCB7b2JqZWN0X25hbWU6IHskcmVnZXg6IG9wdGlvbnMuc2VhcmNoVGV4dH19XVxuXHRcdFx0XHRcdGVsc2Vcblx0XHRcdFx0XHRcdHF1ZXJ5LiRvciA9IFt7X2lkOiB7JGluOiBvcHRpb25zLnZhbHVlc319XVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0aWYgb3B0aW9ucy5zZWFyY2hUZXh0XG5cdFx0XHRcdFx0XHRfLmV4dGVuZChxdWVyeSwgeyRvcjogW3NlYXJjaFRleHRRdWVyeSwgIHtvYmplY3RfbmFtZTogeyRyZWdleDogb3B0aW9ucy5zZWFyY2hUZXh0fX1dfSlcblx0XHRcdFx0XHRxdWVyeS5faWQgPSB7JG5pbjogc2VsZWN0ZWR9XG5cblx0XHRcdFx0Y29sbGVjdGlvbiA9IG9iamVjdC5kYlxuXG5cdFx0XHRcdGlmIG9wdGlvbnMuZmlsdGVyUXVlcnlcblx0XHRcdFx0XHRfLmV4dGVuZCBxdWVyeSwgb3B0aW9ucy5maWx0ZXJRdWVyeVxuXG5cdFx0XHRcdHF1ZXJ5X29wdGlvbnMgPSB7bGltaXQ6IDEwfVxuXG5cdFx0XHRcdGlmIHNvcnQgJiYgXy5pc09iamVjdChzb3J0KVxuXHRcdFx0XHRcdHF1ZXJ5X29wdGlvbnMuc29ydCA9IHNvcnRcblxuXHRcdFx0XHRpZiBjb2xsZWN0aW9uXG5cdFx0XHRcdFx0dHJ5XG5cdFx0XHRcdFx0XHRyZWNvcmRzID0gY29sbGVjdGlvbi5maW5kKHF1ZXJ5LCBxdWVyeV9vcHRpb25zKS5mZXRjaCgpXG5cdFx0XHRcdFx0XHRyZXN1bHRzID0gW11cblx0XHRcdFx0XHRcdF8uZWFjaCByZWNvcmRzLCAocmVjb3JkKS0+XG5cdFx0XHRcdFx0XHRcdG9iamVjdF9uYW1lID0gQ3JlYXRvci5nZXRPYmplY3QocmVjb3JkLm9iamVjdF9uYW1lKT8ubmFtZSB8fCBcIlwiXG5cdFx0XHRcdFx0XHRcdGlmICFfLmlzRW1wdHkob2JqZWN0X25hbWUpXG5cdFx0XHRcdFx0XHRcdFx0b2JqZWN0X25hbWUgPSBcIiAoI3tvYmplY3RfbmFtZX0pXCJcblxuXHRcdFx0XHRcdFx0XHRyZXN1bHRzLnB1c2hcblx0XHRcdFx0XHRcdFx0XHRsYWJlbDogcmVjb3JkW25hbWVfZmllbGRfa2V5XSArIG9iamVjdF9uYW1lXG5cdFx0XHRcdFx0XHRcdFx0dmFsdWU6IHJlY29yZC5faWRcblx0XHRcdFx0XHRcdHJldHVybiByZXN1bHRzXG5cdFx0XHRcdFx0Y2F0Y2ggZVxuXHRcdFx0XHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvciA1MDAsIGUubWVzc2FnZSArIFwiLS0+XCIgKyBKU09OLnN0cmluZ2lmeShvcHRpb25zKVxuXHRcdHJldHVybiBbXSAiLCJNZXRlb3IubWV0aG9kcyh7XG4gIFwiY3JlYXRvci5saXN0dmlld3Nfb3B0aW9uc1wiOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgdmFyIGNvbGxlY3Rpb24sIGUsIG5hbWVfZmllbGRfa2V5LCBvYmplY3QsIHF1ZXJ5LCBxdWVyeV9vcHRpb25zLCByZWNvcmRzLCByZWYsIHJlZjEsIHJlc3VsdHMsIHNlYXJjaFRleHRRdWVyeSwgc2VsZWN0ZWQsIHNvcnQ7XG4gICAgaWYgKG9wdGlvbnMgIT0gbnVsbCA/IChyZWYgPSBvcHRpb25zLnBhcmFtcykgIT0gbnVsbCA/IHJlZi5yZWZlcmVuY2VfdG8gOiB2b2lkIDAgOiB2b2lkIDApIHtcbiAgICAgIG9iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KG9wdGlvbnMucGFyYW1zLnJlZmVyZW5jZV90byk7XG4gICAgICBuYW1lX2ZpZWxkX2tleSA9IG9iamVjdC5OQU1FX0ZJRUxEX0tFWTtcbiAgICAgIHF1ZXJ5ID0ge307XG4gICAgICBpZiAob3B0aW9ucy5wYXJhbXMuc3BhY2UpIHtcbiAgICAgICAgcXVlcnkuc3BhY2UgPSBvcHRpb25zLnBhcmFtcy5zcGFjZTtcbiAgICAgICAgc29ydCA9IG9wdGlvbnMgIT0gbnVsbCA/IG9wdGlvbnMuc29ydCA6IHZvaWQgMDtcbiAgICAgICAgc2VsZWN0ZWQgPSAob3B0aW9ucyAhPSBudWxsID8gb3B0aW9ucy5zZWxlY3RlZCA6IHZvaWQgMCkgfHwgW107XG4gICAgICAgIGlmIChvcHRpb25zLnNlYXJjaFRleHQpIHtcbiAgICAgICAgICBzZWFyY2hUZXh0UXVlcnkgPSB7fTtcbiAgICAgICAgICBzZWFyY2hUZXh0UXVlcnlbbmFtZV9maWVsZF9rZXldID0ge1xuICAgICAgICAgICAgJHJlZ2V4OiBvcHRpb25zLnNlYXJjaFRleHRcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zICE9IG51bGwgPyAocmVmMSA9IG9wdGlvbnMudmFsdWVzKSAhPSBudWxsID8gcmVmMS5sZW5ndGggOiB2b2lkIDAgOiB2b2lkIDApIHtcbiAgICAgICAgICBpZiAob3B0aW9ucy5zZWFyY2hUZXh0KSB7XG4gICAgICAgICAgICBxdWVyeS4kb3IgPSBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBfaWQ6IHtcbiAgICAgICAgICAgICAgICAgICRpbjogb3B0aW9ucy52YWx1ZXNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sIHNlYXJjaFRleHRRdWVyeSwge1xuICAgICAgICAgICAgICAgIG9iamVjdF9uYW1lOiB7XG4gICAgICAgICAgICAgICAgICAkcmVnZXg6IG9wdGlvbnMuc2VhcmNoVGV4dFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcXVlcnkuJG9yID0gW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgX2lkOiB7XG4gICAgICAgICAgICAgICAgICAkaW46IG9wdGlvbnMudmFsdWVzXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAob3B0aW9ucy5zZWFyY2hUZXh0KSB7XG4gICAgICAgICAgICBfLmV4dGVuZChxdWVyeSwge1xuICAgICAgICAgICAgICAkb3I6IFtcbiAgICAgICAgICAgICAgICBzZWFyY2hUZXh0UXVlcnksIHtcbiAgICAgICAgICAgICAgICAgIG9iamVjdF9uYW1lOiB7XG4gICAgICAgICAgICAgICAgICAgICRyZWdleDogb3B0aW9ucy5zZWFyY2hUZXh0XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBdXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcXVlcnkuX2lkID0ge1xuICAgICAgICAgICAgJG5pbjogc2VsZWN0ZWRcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGNvbGxlY3Rpb24gPSBvYmplY3QuZGI7XG4gICAgICAgIGlmIChvcHRpb25zLmZpbHRlclF1ZXJ5KSB7XG4gICAgICAgICAgXy5leHRlbmQocXVlcnksIG9wdGlvbnMuZmlsdGVyUXVlcnkpO1xuICAgICAgICB9XG4gICAgICAgIHF1ZXJ5X29wdGlvbnMgPSB7XG4gICAgICAgICAgbGltaXQ6IDEwXG4gICAgICAgIH07XG4gICAgICAgIGlmIChzb3J0ICYmIF8uaXNPYmplY3Qoc29ydCkpIHtcbiAgICAgICAgICBxdWVyeV9vcHRpb25zLnNvcnQgPSBzb3J0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJlY29yZHMgPSBjb2xsZWN0aW9uLmZpbmQocXVlcnksIHF1ZXJ5X29wdGlvbnMpLmZldGNoKCk7XG4gICAgICAgICAgICByZXN1bHRzID0gW107XG4gICAgICAgICAgICBfLmVhY2gocmVjb3JkcywgZnVuY3Rpb24ocmVjb3JkKSB7XG4gICAgICAgICAgICAgIHZhciBvYmplY3RfbmFtZSwgcmVmMjtcbiAgICAgICAgICAgICAgb2JqZWN0X25hbWUgPSAoKHJlZjIgPSBDcmVhdG9yLmdldE9iamVjdChyZWNvcmQub2JqZWN0X25hbWUpKSAhPSBudWxsID8gcmVmMi5uYW1lIDogdm9pZCAwKSB8fCBcIlwiO1xuICAgICAgICAgICAgICBpZiAoIV8uaXNFbXB0eShvYmplY3RfbmFtZSkpIHtcbiAgICAgICAgICAgICAgICBvYmplY3RfbmFtZSA9IFwiIChcIiArIG9iamVjdF9uYW1lICsgXCIpXCI7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHMucHVzaCh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IHJlY29yZFtuYW1lX2ZpZWxkX2tleV0gKyBvYmplY3RfbmFtZSxcbiAgICAgICAgICAgICAgICB2YWx1ZTogcmVjb3JkLl9pZFxuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdHM7XG4gICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgICAgIGUgPSBlcnJvcjtcbiAgICAgICAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoNTAwLCBlLm1lc3NhZ2UgKyBcIi0tPlwiICsgSlNPTi5zdHJpbmdpZnkob3B0aW9ucykpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gW107XG4gIH1cbn0pO1xuIiwiI+iOt+WPluW6lOeUqOS4i+eahOWvueixoVxuZ2V0QXBwT2JqZWN0cyA9IChhcHApLT5cblx0YXBwT2JqZWN0cyA9IFtdXG5cdGlmIGFwcCAmJiBfLmlzQXJyYXkoYXBwLm9iamVjdHMpICYmIGFwcC5vYmplY3RzLmxlbmd0aCA+IDBcblx0XHRfLmVhY2ggYXBwLm9iamVjdHMsIChvYmplY3RfbmFtZSktPlxuXHRcdFx0b2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0X25hbWUpXG5cdFx0XHRpZiBvYmplY3Rcblx0XHRcdFx0YXBwT2JqZWN0cy5wdXNoIG9iamVjdF9uYW1lXG5cdHJldHVybiBhcHBPYmplY3RzXG5cbiPojrflj5blr7nosaHkuIvnmoTliJfooajop4blm75cbmdldE9iamVjdHNMaXN0Vmlld3MgPSAoc3BhY2VfaWQsIG9iamVjdHNfbmFtZSktPlxuXHRvYmplY3RzTGlzdFZpZXdzID0gW11cblx0aWYgb2JqZWN0c19uYW1lICYmIF8uaXNBcnJheShvYmplY3RzX25hbWUpICYmIG9iamVjdHNfbmFtZS5sZW5ndGggPiAwXG5cdFx0Xy5lYWNoIG9iamVjdHNfbmFtZSwgKG9iamVjdF9uYW1lKS0+XG5cdFx0XHQj6I635Y+W5a+56LGh55qE5YWx5Lqr5YiX6KGo6KeG5Zu+bGlzdF92aWV3c1xuXHRcdFx0bGlzdF92aWV3cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikuZmluZCh7b2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLCBzcGFjZTogc3BhY2VfaWQsIHNoYXJlZDogdHJ1ZX0sIHtmaWVsZHM6IHtfaWQ6IDF9fSlcblx0XHRcdGxpc3Rfdmlld3MuZm9yRWFjaCAobGlzdF92aWV3KS0+XG5cdFx0XHRcdG9iamVjdHNMaXN0Vmlld3MucHVzaCBsaXN0X3ZpZXcuX2lkXG5cdHJldHVybiBvYmplY3RzTGlzdFZpZXdzXG5cbiPojrflj5blr7nosaHkuIvnmoTmiqXooahcbmdldE9iamVjdHNSZXBvcnRzID0gKHNwYWNlX2lkLCBvYmplY3RzX25hbWUpLT5cblx0b2JqZWN0c1JlcG9ydHMgPSBbXVxuXHRpZiBvYmplY3RzX25hbWUgJiYgXy5pc0FycmF5KG9iamVjdHNfbmFtZSkgJiYgb2JqZWN0c19uYW1lLmxlbmd0aCA+IDBcblx0XHRfLmVhY2ggb2JqZWN0c19uYW1lLCAob2JqZWN0X25hbWUpLT5cblx0XHRcdCPojrflj5blr7nosaHnmoTmiqXooahyZXBvcnRzXG5cdFx0XHRyZXBvcnRzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicmVwb3J0c1wiKS5maW5kKHtvYmplY3RfbmFtZTogb2JqZWN0X25hbWUsIHNwYWNlOiBzcGFjZV9pZH0sIHtmaWVsZHM6IHtfaWQ6IDF9fSlcblx0XHRcdHJlcG9ydHMuZm9yRWFjaCAocmVwb3J0KS0+XG5cdFx0XHRcdG9iamVjdHNSZXBvcnRzLnB1c2ggcmVwb3J0Ll9pZFxuXHRyZXR1cm4gb2JqZWN0c1JlcG9ydHNcblxuI+iOt+WPluWvueixoeS4i+eahOadg+mZkOmbhlxuZ2V0T2JqZWN0c1Blcm1pc3Npb25PYmplY3RzID0gKHNwYWNlX2lkLCBvYmplY3RzX25hbWUpLT5cblx0b2JqZWN0c1Blcm1pc3Npb25PYmplY3RzID0gW11cblx0aWYgb2JqZWN0c19uYW1lICYmIF8uaXNBcnJheShvYmplY3RzX25hbWUpICYmIG9iamVjdHNfbmFtZS5sZW5ndGggPiAwXG5cdFx0Xy5lYWNoIG9iamVjdHNfbmFtZSwgKG9iamVjdF9uYW1lKS0+XG5cdFx0XHRwZXJtaXNzaW9uX29iamVjdHMgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX29iamVjdHNcIikuZmluZCh7b2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLCBzcGFjZTogc3BhY2VfaWR9LCB7ZmllbGRzOiB7X2lkOiAxfX0pXG5cdFx0XHRwZXJtaXNzaW9uX29iamVjdHMuZm9yRWFjaCAocGVybWlzc2lvbl9vYmplY3QpLT5cblx0XHRcdFx0b2JqZWN0c1Blcm1pc3Npb25PYmplY3RzLnB1c2ggcGVybWlzc2lvbl9vYmplY3QuX2lkXG5cdHJldHVybiBvYmplY3RzUGVybWlzc2lvbk9iamVjdHNcblxuI+iOt+WPluWvueixoeS4i+adg+mZkOmbhuWvueW6lOeahOadg+mZkOe7hFxuZ2V0T2JqZWN0c1Blcm1pc3Npb25TZXQgPSAoc3BhY2VfaWQsIG9iamVjdHNfbmFtZSktPlxuXHRvYmplY3RzUGVybWlzc2lvblNldCA9IFtdXG5cdGlmIG9iamVjdHNfbmFtZSAmJiBfLmlzQXJyYXkob2JqZWN0c19uYW1lKSAmJiBvYmplY3RzX25hbWUubGVuZ3RoID4gMFxuXHRcdF8uZWFjaCBvYmplY3RzX25hbWUsIChvYmplY3RfbmFtZSktPlxuXHRcdFx0cGVybWlzc2lvbl9vYmplY3RzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9vYmplY3RzXCIpLmZpbmQoe29iamVjdF9uYW1lOiBvYmplY3RfbmFtZSwgc3BhY2U6IHNwYWNlX2lkfSwge2ZpZWxkczoge3Blcm1pc3Npb25fc2V0X2lkOiAxfX0pXG5cdFx0XHRwZXJtaXNzaW9uX29iamVjdHMuZm9yRWFjaCAocGVybWlzc2lvbl9vYmplY3QpLT5cblx0XHRcdFx0cGVybWlzc2lvbl9zZXQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX3NldFwiKS5maW5kT25lKHtfaWQ6IHBlcm1pc3Npb25fb2JqZWN0LnBlcm1pc3Npb25fc2V0X2lkfSwge2ZpZWxkczoge19pZDogMX19KVxuXHRcdFx0XHRvYmplY3RzUGVybWlzc2lvblNldC5wdXNoIHBlcm1pc3Npb25fc2V0Ll9pZFxuXHRyZXR1cm4gb2JqZWN0c1Blcm1pc3Npb25TZXRcblxuXG5NZXRlb3IubWV0aG9kc1xuXHRcImFwcFBhY2thZ2UuaW5pdF9leHBvcnRfZGF0YVwiOiAoc3BhY2VfaWQsIHJlY29yZF9pZCktPlxuXHRcdHVzZXJJZCA9IHRoaXMudXNlcklkXG5cdFx0aWYgIXVzZXJJZFxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjQwMVwiLCBcIkF1dGhlbnRpY2F0aW9uIGlzIHJlcXVpcmVkIGFuZCBoYXMgbm90IGJlZW4gcHJvdmlkZWQuXCIpXG5cblx0XHRpZiAhQ3JlYXRvci5pc1NwYWNlQWRtaW4oc3BhY2VfaWQsIHVzZXJJZClcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI0MDFcIiwgXCJQZXJtaXNzaW9uIGRlbmllZC5cIilcblxuXHRcdHJlY29yZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcGxpY2F0aW9uX3BhY2thZ2VcIikuZmluZE9uZSh7X2lkOiByZWNvcmRfaWR9KVxuXG5cdFx0aWYgKCFfLmlzQXJyYXkocmVjb3JkPy5hcHBzKSB8fCByZWNvcmQ/LmFwcHM/Lmxlbmd0aCA8IDEpICYmICghXy5pc0FycmF5KHJlY29yZD8ub2JqZWN0cykgfHwgcmVjb3JkPy5vYmplY3RzPy5sZW5ndGggPCAxKVxuXHRcdFx0dGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuivt+WFiOmAieaLqeW6lOeUqOaIluiAheWvueixoVwiKVxuXG5cdFx0ZGF0YSA9IHt9XG5cdFx0X29iamVjdHMgPSByZWNvcmQub2JqZWN0cyB8fCBbXVxuXHRcdF9vYmplY3RzX2xpc3Rfdmlld3MgPSByZWNvcmQubGlzdF92aWV3cyB8fCBbXVxuXHRcdF9vYmplY3RzX3JlcG9ydHMgPSByZWNvcmQucmVwb3J0cyB8fCBbXVxuXHRcdF9vYmplY3RzX3Blcm1pc3Npb25fb2JqZWN0cyA9IHJlY29yZC5wZXJtaXNzaW9uX29iamVjdHMgfHwgW11cblx0XHRfb2JqZWN0c19wZXJtaXNzaW9uX3NldCA9IHJlY29yZC5wZXJtaXNzaW9uX3NldCB8fCBbXVxuXG5cdFx0dHJ5XG5cdFx0XHRpZiBfLmlzQXJyYXkocmVjb3JkPy5hcHBzKSAmJiByZWNvcmQuYXBwcy5sZW5ndGggPiAwXG5cdFx0XHRcdF8uZWFjaCByZWNvcmQuYXBwcywgKGFwcElkKS0+XG5cdFx0XHRcdFx0aWYgIWFwcFxuXHRcdFx0XHRcdFx0I+WmguaenOS7juS7o+eggeS4reWumuS5ieeahGFwcHPkuK3msqHmnInmib7liLDvvIzliJnku47mlbDmja7lupPkuK3ojrflj5Zcblx0XHRcdFx0XHRcdGFwcCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcHNcIikuZmluZE9uZSh7X2lkOiBhcHBJZCwgaXNfY3JlYXRvcjogdHJ1ZX0sIHtmaWVsZHM6IHtvYmplY3RzOiAxfX0pXG5cdFx0XHRcdFx0X29iamVjdHMgPSBfb2JqZWN0cy5jb25jYXQoZ2V0QXBwT2JqZWN0cyhhcHApKVxuXG5cdFx0XHRpZiBfLmlzQXJyYXkoX29iamVjdHMpICYmIF9vYmplY3RzLmxlbmd0aCA+IDBcblx0XHRcdFx0X29iamVjdHNfbGlzdF92aWV3cyA9IF9vYmplY3RzX2xpc3Rfdmlld3MuY29uY2F0KGdldE9iamVjdHNMaXN0Vmlld3Moc3BhY2VfaWQsIF9vYmplY3RzKSlcblx0XHRcdFx0X29iamVjdHNfcmVwb3J0cyA9IF9vYmplY3RzX3JlcG9ydHMuY29uY2F0KGdldE9iamVjdHNSZXBvcnRzKHNwYWNlX2lkLCBfb2JqZWN0cykpXG5cdFx0XHRcdF9vYmplY3RzX3Blcm1pc3Npb25fb2JqZWN0cyA9IF9vYmplY3RzX3Blcm1pc3Npb25fb2JqZWN0cy5jb25jYXQoZ2V0T2JqZWN0c1Blcm1pc3Npb25PYmplY3RzKHNwYWNlX2lkLCBfb2JqZWN0cykpXG5cdFx0XHRcdF9vYmplY3RzX3Blcm1pc3Npb25fc2V0ID0gX29iamVjdHNfcGVybWlzc2lvbl9zZXQuY29uY2F0KGdldE9iamVjdHNQZXJtaXNzaW9uU2V0KHNwYWNlX2lkLCBfb2JqZWN0cykpXG5cblx0XHRcdFx0ZGF0YS5vYmplY3RzID0gXy51bmlxIF9vYmplY3RzXG5cdFx0XHRcdGRhdGEubGlzdF92aWV3cyA9IF8udW5pcSBfb2JqZWN0c19saXN0X3ZpZXdzXG5cdFx0XHRcdGRhdGEucGVybWlzc2lvbl9zZXQgPSBfLnVuaXEgX29iamVjdHNfcGVybWlzc2lvbl9zZXRcblx0XHRcdFx0ZGF0YS5wZXJtaXNzaW9uX29iamVjdHMgPSBfLnVuaXEgX29iamVjdHNfcGVybWlzc2lvbl9vYmplY3RzXG5cdFx0XHRcdGRhdGEucmVwb3J0cyA9IF8udW5pcSBfb2JqZWN0c19yZXBvcnRzXG5cdFx0XHRcdENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcGxpY2F0aW9uX3BhY2thZ2VcIikudXBkYXRlKHtfaWQ6IHJlY29yZC5faWR9LHskc2V0OiBkYXRhfSlcblx0XHRjYXRjaCBlXG5cdFx0XHRjb25zb2xlLmVycm9yIGUuc3RhY2tcblx0XHRcdHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI1MDBcIiwgZS5yZWFzb24gfHwgZS5tZXNzYWdlICkiLCJ2YXIgZ2V0QXBwT2JqZWN0cywgZ2V0T2JqZWN0c0xpc3RWaWV3cywgZ2V0T2JqZWN0c1Blcm1pc3Npb25PYmplY3RzLCBnZXRPYmplY3RzUGVybWlzc2lvblNldCwgZ2V0T2JqZWN0c1JlcG9ydHM7XG5cbmdldEFwcE9iamVjdHMgPSBmdW5jdGlvbihhcHApIHtcbiAgdmFyIGFwcE9iamVjdHM7XG4gIGFwcE9iamVjdHMgPSBbXTtcbiAgaWYgKGFwcCAmJiBfLmlzQXJyYXkoYXBwLm9iamVjdHMpICYmIGFwcC5vYmplY3RzLmxlbmd0aCA+IDApIHtcbiAgICBfLmVhY2goYXBwLm9iamVjdHMsIGZ1bmN0aW9uKG9iamVjdF9uYW1lKSB7XG4gICAgICB2YXIgb2JqZWN0O1xuICAgICAgb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0X25hbWUpO1xuICAgICAgaWYgKG9iamVjdCkge1xuICAgICAgICByZXR1cm4gYXBwT2JqZWN0cy5wdXNoKG9iamVjdF9uYW1lKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICByZXR1cm4gYXBwT2JqZWN0cztcbn07XG5cbmdldE9iamVjdHNMaXN0Vmlld3MgPSBmdW5jdGlvbihzcGFjZV9pZCwgb2JqZWN0c19uYW1lKSB7XG4gIHZhciBvYmplY3RzTGlzdFZpZXdzO1xuICBvYmplY3RzTGlzdFZpZXdzID0gW107XG4gIGlmIChvYmplY3RzX25hbWUgJiYgXy5pc0FycmF5KG9iamVjdHNfbmFtZSkgJiYgb2JqZWN0c19uYW1lLmxlbmd0aCA+IDApIHtcbiAgICBfLmVhY2gob2JqZWN0c19uYW1lLCBmdW5jdGlvbihvYmplY3RfbmFtZSkge1xuICAgICAgdmFyIGxpc3Rfdmlld3M7XG4gICAgICBsaXN0X3ZpZXdzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS5maW5kKHtcbiAgICAgICAgb2JqZWN0X25hbWU6IG9iamVjdF9uYW1lLFxuICAgICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICAgIHNoYXJlZDogdHJ1ZVxuICAgICAgfSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBfaWQ6IDFcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gbGlzdF92aWV3cy5mb3JFYWNoKGZ1bmN0aW9uKGxpc3Rfdmlldykge1xuICAgICAgICByZXR1cm4gb2JqZWN0c0xpc3RWaWV3cy5wdXNoKGxpc3Rfdmlldy5faWQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIG9iamVjdHNMaXN0Vmlld3M7XG59O1xuXG5nZXRPYmplY3RzUmVwb3J0cyA9IGZ1bmN0aW9uKHNwYWNlX2lkLCBvYmplY3RzX25hbWUpIHtcbiAgdmFyIG9iamVjdHNSZXBvcnRzO1xuICBvYmplY3RzUmVwb3J0cyA9IFtdO1xuICBpZiAob2JqZWN0c19uYW1lICYmIF8uaXNBcnJheShvYmplY3RzX25hbWUpICYmIG9iamVjdHNfbmFtZS5sZW5ndGggPiAwKSB7XG4gICAgXy5lYWNoKG9iamVjdHNfbmFtZSwgZnVuY3Rpb24ob2JqZWN0X25hbWUpIHtcbiAgICAgIHZhciByZXBvcnRzO1xuICAgICAgcmVwb3J0cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInJlcG9ydHNcIikuZmluZCh7XG4gICAgICAgIG9iamVjdF9uYW1lOiBvYmplY3RfbmFtZSxcbiAgICAgICAgc3BhY2U6IHNwYWNlX2lkXG4gICAgICB9LCB7XG4gICAgICAgIGZpZWxkczoge1xuICAgICAgICAgIF9pZDogMVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXBvcnRzLmZvckVhY2goZnVuY3Rpb24ocmVwb3J0KSB7XG4gICAgICAgIHJldHVybiBvYmplY3RzUmVwb3J0cy5wdXNoKHJlcG9ydC5faWQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIG9iamVjdHNSZXBvcnRzO1xufTtcblxuZ2V0T2JqZWN0c1Blcm1pc3Npb25PYmplY3RzID0gZnVuY3Rpb24oc3BhY2VfaWQsIG9iamVjdHNfbmFtZSkge1xuICB2YXIgb2JqZWN0c1Blcm1pc3Npb25PYmplY3RzO1xuICBvYmplY3RzUGVybWlzc2lvbk9iamVjdHMgPSBbXTtcbiAgaWYgKG9iamVjdHNfbmFtZSAmJiBfLmlzQXJyYXkob2JqZWN0c19uYW1lKSAmJiBvYmplY3RzX25hbWUubGVuZ3RoID4gMCkge1xuICAgIF8uZWFjaChvYmplY3RzX25hbWUsIGZ1bmN0aW9uKG9iamVjdF9uYW1lKSB7XG4gICAgICB2YXIgcGVybWlzc2lvbl9vYmplY3RzO1xuICAgICAgcGVybWlzc2lvbl9vYmplY3RzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9vYmplY3RzXCIpLmZpbmQoe1xuICAgICAgICBvYmplY3RfbmFtZTogb2JqZWN0X25hbWUsXG4gICAgICAgIHNwYWNlOiBzcGFjZV9pZFxuICAgICAgfSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBfaWQ6IDFcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gcGVybWlzc2lvbl9vYmplY3RzLmZvckVhY2goZnVuY3Rpb24ocGVybWlzc2lvbl9vYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIG9iamVjdHNQZXJtaXNzaW9uT2JqZWN0cy5wdXNoKHBlcm1pc3Npb25fb2JqZWN0Ll9pZCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gb2JqZWN0c1Blcm1pc3Npb25PYmplY3RzO1xufTtcblxuZ2V0T2JqZWN0c1Blcm1pc3Npb25TZXQgPSBmdW5jdGlvbihzcGFjZV9pZCwgb2JqZWN0c19uYW1lKSB7XG4gIHZhciBvYmplY3RzUGVybWlzc2lvblNldDtcbiAgb2JqZWN0c1Blcm1pc3Npb25TZXQgPSBbXTtcbiAgaWYgKG9iamVjdHNfbmFtZSAmJiBfLmlzQXJyYXkob2JqZWN0c19uYW1lKSAmJiBvYmplY3RzX25hbWUubGVuZ3RoID4gMCkge1xuICAgIF8uZWFjaChvYmplY3RzX25hbWUsIGZ1bmN0aW9uKG9iamVjdF9uYW1lKSB7XG4gICAgICB2YXIgcGVybWlzc2lvbl9vYmplY3RzO1xuICAgICAgcGVybWlzc2lvbl9vYmplY3RzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9vYmplY3RzXCIpLmZpbmQoe1xuICAgICAgICBvYmplY3RfbmFtZTogb2JqZWN0X25hbWUsXG4gICAgICAgIHNwYWNlOiBzcGFjZV9pZFxuICAgICAgfSwge1xuICAgICAgICBmaWVsZHM6IHtcbiAgICAgICAgICBwZXJtaXNzaW9uX3NldF9pZDogMVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBwZXJtaXNzaW9uX29iamVjdHMuZm9yRWFjaChmdW5jdGlvbihwZXJtaXNzaW9uX29iamVjdCkge1xuICAgICAgICB2YXIgcGVybWlzc2lvbl9zZXQ7XG4gICAgICAgIHBlcm1pc3Npb25fc2V0ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicGVybWlzc2lvbl9zZXRcIikuZmluZE9uZSh7XG4gICAgICAgICAgX2lkOiBwZXJtaXNzaW9uX29iamVjdC5wZXJtaXNzaW9uX3NldF9pZFxuICAgICAgICB9LCB7XG4gICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICBfaWQ6IDFcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gb2JqZWN0c1Blcm1pc3Npb25TZXQucHVzaChwZXJtaXNzaW9uX3NldC5faWQpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIG9iamVjdHNQZXJtaXNzaW9uU2V0O1xufTtcblxuTWV0ZW9yLm1ldGhvZHMoe1xuICBcImFwcFBhY2thZ2UuaW5pdF9leHBvcnRfZGF0YVwiOiBmdW5jdGlvbihzcGFjZV9pZCwgcmVjb3JkX2lkKSB7XG4gICAgdmFyIF9vYmplY3RzLCBfb2JqZWN0c19saXN0X3ZpZXdzLCBfb2JqZWN0c19wZXJtaXNzaW9uX29iamVjdHMsIF9vYmplY3RzX3Blcm1pc3Npb25fc2V0LCBfb2JqZWN0c19yZXBvcnRzLCBkYXRhLCBlLCByZWNvcmQsIHJlZiwgcmVmMSwgdXNlcklkO1xuICAgIHVzZXJJZCA9IHRoaXMudXNlcklkO1xuICAgIGlmICghdXNlcklkKSB7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNDAxXCIsIFwiQXV0aGVudGljYXRpb24gaXMgcmVxdWlyZWQgYW5kIGhhcyBub3QgYmVlbiBwcm92aWRlZC5cIik7XG4gICAgfVxuICAgIGlmICghQ3JlYXRvci5pc1NwYWNlQWRtaW4oc3BhY2VfaWQsIHVzZXJJZCkpIHtcbiAgICAgIHRocm93IG5ldyBNZXRlb3IuRXJyb3IoXCI0MDFcIiwgXCJQZXJtaXNzaW9uIGRlbmllZC5cIik7XG4gICAgfVxuICAgIHJlY29yZCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcGxpY2F0aW9uX3BhY2thZ2VcIikuZmluZE9uZSh7XG4gICAgICBfaWQ6IHJlY29yZF9pZFxuICAgIH0pO1xuICAgIGlmICgoIV8uaXNBcnJheShyZWNvcmQgIT0gbnVsbCA/IHJlY29yZC5hcHBzIDogdm9pZCAwKSB8fCAocmVjb3JkICE9IG51bGwgPyAocmVmID0gcmVjb3JkLmFwcHMpICE9IG51bGwgPyByZWYubGVuZ3RoIDogdm9pZCAwIDogdm9pZCAwKSA8IDEpICYmICghXy5pc0FycmF5KHJlY29yZCAhPSBudWxsID8gcmVjb3JkLm9iamVjdHMgOiB2b2lkIDApIHx8IChyZWNvcmQgIT0gbnVsbCA/IChyZWYxID0gcmVjb3JkLm9iamVjdHMpICE9IG51bGwgPyByZWYxLmxlbmd0aCA6IHZvaWQgMCA6IHZvaWQgMCkgPCAxKSkge1xuICAgICAgdGhyb3cgbmV3IE1ldGVvci5FcnJvcihcIjUwMFwiLCBcIuivt+WFiOmAieaLqeW6lOeUqOaIluiAheWvueixoVwiKTtcbiAgICB9XG4gICAgZGF0YSA9IHt9O1xuICAgIF9vYmplY3RzID0gcmVjb3JkLm9iamVjdHMgfHwgW107XG4gICAgX29iamVjdHNfbGlzdF92aWV3cyA9IHJlY29yZC5saXN0X3ZpZXdzIHx8IFtdO1xuICAgIF9vYmplY3RzX3JlcG9ydHMgPSByZWNvcmQucmVwb3J0cyB8fCBbXTtcbiAgICBfb2JqZWN0c19wZXJtaXNzaW9uX29iamVjdHMgPSByZWNvcmQucGVybWlzc2lvbl9vYmplY3RzIHx8IFtdO1xuICAgIF9vYmplY3RzX3Blcm1pc3Npb25fc2V0ID0gcmVjb3JkLnBlcm1pc3Npb25fc2V0IHx8IFtdO1xuICAgIHRyeSB7XG4gICAgICBpZiAoXy5pc0FycmF5KHJlY29yZCAhPSBudWxsID8gcmVjb3JkLmFwcHMgOiB2b2lkIDApICYmIHJlY29yZC5hcHBzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgXy5lYWNoKHJlY29yZC5hcHBzLCBmdW5jdGlvbihhcHBJZCkge1xuICAgICAgICAgIHZhciBhcHA7XG4gICAgICAgICAgaWYgKCFhcHApIHtcbiAgICAgICAgICAgIGFwcCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcHNcIikuZmluZE9uZSh7XG4gICAgICAgICAgICAgIF9pZDogYXBwSWQsXG4gICAgICAgICAgICAgIGlzX2NyZWF0b3I6IHRydWVcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgZmllbGRzOiB7XG4gICAgICAgICAgICAgICAgb2JqZWN0czogMVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIF9vYmplY3RzID0gX29iamVjdHMuY29uY2F0KGdldEFwcE9iamVjdHMoYXBwKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKF8uaXNBcnJheShfb2JqZWN0cykgJiYgX29iamVjdHMubGVuZ3RoID4gMCkge1xuICAgICAgICBfb2JqZWN0c19saXN0X3ZpZXdzID0gX29iamVjdHNfbGlzdF92aWV3cy5jb25jYXQoZ2V0T2JqZWN0c0xpc3RWaWV3cyhzcGFjZV9pZCwgX29iamVjdHMpKTtcbiAgICAgICAgX29iamVjdHNfcmVwb3J0cyA9IF9vYmplY3RzX3JlcG9ydHMuY29uY2F0KGdldE9iamVjdHNSZXBvcnRzKHNwYWNlX2lkLCBfb2JqZWN0cykpO1xuICAgICAgICBfb2JqZWN0c19wZXJtaXNzaW9uX29iamVjdHMgPSBfb2JqZWN0c19wZXJtaXNzaW9uX29iamVjdHMuY29uY2F0KGdldE9iamVjdHNQZXJtaXNzaW9uT2JqZWN0cyhzcGFjZV9pZCwgX29iamVjdHMpKTtcbiAgICAgICAgX29iamVjdHNfcGVybWlzc2lvbl9zZXQgPSBfb2JqZWN0c19wZXJtaXNzaW9uX3NldC5jb25jYXQoZ2V0T2JqZWN0c1Blcm1pc3Npb25TZXQoc3BhY2VfaWQsIF9vYmplY3RzKSk7XG4gICAgICAgIGRhdGEub2JqZWN0cyA9IF8udW5pcShfb2JqZWN0cyk7XG4gICAgICAgIGRhdGEubGlzdF92aWV3cyA9IF8udW5pcShfb2JqZWN0c19saXN0X3ZpZXdzKTtcbiAgICAgICAgZGF0YS5wZXJtaXNzaW9uX3NldCA9IF8udW5pcShfb2JqZWN0c19wZXJtaXNzaW9uX3NldCk7XG4gICAgICAgIGRhdGEucGVybWlzc2lvbl9vYmplY3RzID0gXy51bmlxKF9vYmplY3RzX3Blcm1pc3Npb25fb2JqZWN0cyk7XG4gICAgICAgIGRhdGEucmVwb3J0cyA9IF8udW5pcShfb2JqZWN0c19yZXBvcnRzKTtcbiAgICAgICAgcmV0dXJuIENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImFwcGxpY2F0aW9uX3BhY2thZ2VcIikudXBkYXRlKHtcbiAgICAgICAgICBfaWQ6IHJlY29yZC5faWRcbiAgICAgICAgfSwge1xuICAgICAgICAgICRzZXQ6IGRhdGFcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGUgPSBlcnJvcjtcbiAgICAgIGNvbnNvbGUuZXJyb3IoZS5zdGFjayk7XG4gICAgICB0aHJvdyBuZXcgTWV0ZW9yLkVycm9yKFwiNTAwXCIsIGUucmVhc29uIHx8IGUubWVzc2FnZSk7XG4gICAgfVxuICB9XG59KTtcbiIsIkBBUFRyYW5zZm9ybSA9IHt9XG5cbmlnbm9yZV9maWVsZHMgPSB7XG5cdG93bmVyOiAwLFxuXHRzcGFjZTogMCxcblx0Y3JlYXRlZDogMCxcblx0Y3JlYXRlZF9ieTogMCxcblx0bW9kaWZpZWQ6IDAsXG5cdG1vZGlmaWVkX2J5OiAwLFxuXHRpc19kZWxldGVkOiAwLFxuXHRpbnN0YW5jZXM6IDAsXG5cdHNoYXJpbmc6IDBcbn1cblxuQVBUcmFuc2Zvcm0uZXhwb3J0T2JqZWN0ID0gKG9iamVjdCktPlxuXHRfb2JqID0ge31cblxuXHRfLmV4dGVuZChfb2JqICwgb2JqZWN0KVxuXG5cdG9ial9saXN0X3ZpZXdzID0ge31cblxuXHRfLmV4dGVuZChvYmpfbGlzdF92aWV3cywgX29iai5saXN0X3ZpZXdzIHx8IHt9KVxuXG5cdF8uZWFjaCBvYmpfbGlzdF92aWV3cywgKHYsIGspLT5cblx0XHRpZiAhXy5oYXModiwgXCJfaWRcIilcblx0XHRcdHYuX2lkID0ga1xuXHRcdGlmICFfLmhhcyh2LCBcIm5hbWVcIilcblx0XHRcdHYubmFtZSA9IGtcblx0X29iai5saXN0X3ZpZXdzID0gb2JqX2xpc3Rfdmlld3NcblxuXG5cdCPlj6rkv67mlLlfb2Jq5bGe5oCn5Y6fb2JqZWN05bGe5oCn5L+d5oyB5LiN5Y+YXG5cdHRyaWdnZXJzID0ge31cblx0Xy5mb3JFYWNoIF9vYmoudHJpZ2dlcnMsICh0cmlnZ2VyLCBrZXkpLT5cblx0XHRfdHJpZ2dlciA9IHt9XG5cdFx0Xy5leHRlbmQoX3RyaWdnZXIsIHRyaWdnZXIpXG5cdFx0aWYgXy5pc0Z1bmN0aW9uKF90cmlnZ2VyLnRvZG8pXG5cdFx0XHRfdHJpZ2dlci50b2RvID0gX3RyaWdnZXIudG9kby50b1N0cmluZygpXG5cdFx0ZGVsZXRlIF90cmlnZ2VyLl90b2RvXG5cdFx0dHJpZ2dlcnNba2V5XSA9IF90cmlnZ2VyXG5cdF9vYmoudHJpZ2dlcnMgPSB0cmlnZ2Vyc1xuXG5cdGFjdGlvbnMgPSB7fVxuXHRfLmZvckVhY2ggX29iai5hY3Rpb25zLCAoYWN0aW9uLCBrZXkpLT5cblx0XHRfYWN0aW9uID0ge31cblx0XHRfLmV4dGVuZChfYWN0aW9uLCBhY3Rpb24pXG5cdFx0aWYgXy5pc0Z1bmN0aW9uKF9hY3Rpb24udG9kbylcblx0XHRcdF9hY3Rpb24udG9kbyA9IF9hY3Rpb24udG9kby50b1N0cmluZygpXG5cdFx0ZGVsZXRlIF9hY3Rpb24uX3RvZG9cblx0XHRhY3Rpb25zW2tleV0gPSBfYWN0aW9uXG5cblx0X29iai5hY3Rpb25zID0gYWN0aW9uc1xuXG5cdGZpZWxkcyA9IHt9XG5cdF8uZm9yRWFjaCBfb2JqLmZpZWxkcywgKGZpZWxkLCBrZXkpLT5cblx0XHRfZmllbGQgPSB7fVxuXHRcdF8uZXh0ZW5kKF9maWVsZCwgZmllbGQpXG5cdFx0aWYgXy5pc0Z1bmN0aW9uKF9maWVsZC5vcHRpb25zKVxuXHRcdFx0X2ZpZWxkLm9wdGlvbnMgPSBfZmllbGQub3B0aW9ucy50b1N0cmluZygpXG5cdFx0XHRkZWxldGUgX2ZpZWxkLl9vcHRpb25zXG5cblx0XHRpZiBfLmlzQXJyYXkoX2ZpZWxkLm9wdGlvbnMpXG5cdFx0XHRfZm8gPSBbXVxuXHRcdFx0Xy5mb3JFYWNoIF9maWVsZC5vcHRpb25zLCAoX28xKS0+XG5cdFx0XHRcdF9mby5wdXNoKFwiI3tfbzEubGFiZWx9OiN7X28xLnZhbHVlfVwiKVxuXHRcdFx0X2ZpZWxkLm9wdGlvbnMgPSBfZm8uam9pbihcIixcIilcblx0XHRcdGRlbGV0ZSBfZmllbGQuX29wdGlvbnNcblxuXHRcdGlmIF9maWVsZC5yZWdFeFxuXHRcdFx0X2ZpZWxkLnJlZ0V4ID0gX2ZpZWxkLnJlZ0V4LnRvU3RyaW5nKClcblx0XHRcdGRlbGV0ZSBfZmllbGQuX3JlZ0V4XG5cblx0XHRpZiBfLmlzRnVuY3Rpb24oX2ZpZWxkLm9wdGlvbnNGdW5jdGlvbilcblx0XHRcdF9maWVsZC5vcHRpb25zRnVuY3Rpb24gPSBfZmllbGQub3B0aW9uc0Z1bmN0aW9uLnRvU3RyaW5nKClcblx0XHRcdGRlbGV0ZSBfZmllbGQuX29wdGlvbnNGdW5jdGlvblxuXG5cdFx0aWYgXy5pc0Z1bmN0aW9uKF9maWVsZC5yZWZlcmVuY2VfdG8pXG5cdFx0XHRfZmllbGQucmVmZXJlbmNlX3RvID0gX2ZpZWxkLnJlZmVyZW5jZV90by50b1N0cmluZygpXG5cdFx0XHRkZWxldGUgX2ZpZWxkLl9yZWZlcmVuY2VfdG9cblxuXHRcdGlmIF8uaXNGdW5jdGlvbihfZmllbGQuY3JlYXRlRnVuY3Rpb24pXG5cdFx0XHRfZmllbGQuY3JlYXRlRnVuY3Rpb24gPSBfZmllbGQuY3JlYXRlRnVuY3Rpb24udG9TdHJpbmcoKVxuXHRcdFx0ZGVsZXRlIF9maWVsZC5fY3JlYXRlRnVuY3Rpb25cblxuXHRcdGlmIF8uaXNGdW5jdGlvbihfZmllbGQuZGVmYXVsdFZhbHVlKVxuXHRcdFx0X2ZpZWxkLmRlZmF1bHRWYWx1ZSA9IF9maWVsZC5kZWZhdWx0VmFsdWUudG9TdHJpbmcoKVxuXHRcdFx0ZGVsZXRlIF9maWVsZC5fZGVmYXVsdFZhbHVlXG5cdFx0I1RPRE8g6L2s5o2iZmllbGQuYXV0b2Zvcm0udHlwZe+8jOW3suWSjOacseaAneWYieehruiupO+8jOebruWJjeS4jeaUr+aMgWF1dG9mb3JtLnR5cGUg5Li6ZnVuY3Rpb27nsbvlnotcblx0XHRmaWVsZHNba2V5XSA9IF9maWVsZFxuXG5cdF9vYmouZmllbGRzID0gZmllbGRzXG5cblx0cmV0dXJuIF9vYmpcblxuIyMjXG7lr7zlh7rmlbDmja46XG57XG5cdGFwcHM6W3t9XSwg6L2v5Lu25YyF6YCJ5Lit55qEYXBwc1xuXHRvYmplY3RzOlt7fV0sIOmAieS4reeahG9iamVjdOWPiuWFtmZpZWxkcywgbGlzdF92aWV3cywgdHJpZ2dlcnMsIGFjdGlvbnMsIHBlcm1pc3Npb25fc2V0562JXG4gICAgbGlzdF92aWV3czpbe31dLCDova/ku7bljIXpgInkuK3nmoRsaXN0X3ZpZXdzXG4gICAgcGVybWlzc2lvbnM6W3t9XSwg6L2v5Lu25YyF6YCJ5Lit55qE5p2D6ZmQ6ZuGXG4gICAgcGVybWlzc2lvbl9vYmplY3RzOlt7fV0sIOi9r+S7tuWMhemAieS4reeahOadg+mZkOWvueixoVxuICAgIHJlcG9ydHM6W3t9XSDova/ku7bljIXpgInkuK3nmoTmiqXooahcbn1cbiMjI1xuQVBUcmFuc2Zvcm0uZXhwb3J0ID0gKHJlY29yZCktPlxuXHRleHBvcnRfZGF0YSA9IHt9XG5cdGlmIF8uaXNBcnJheShyZWNvcmQuYXBwcykgJiYgcmVjb3JkLmFwcHMubGVuZ3RoID4gMFxuXHRcdGV4cG9ydF9kYXRhLmFwcHMgPSBbXVxuXG5cdFx0Xy5lYWNoIHJlY29yZC5hcHBzLCAoYXBwS2V5KS0+XG5cdFx0XHRhcHAgPSB7fVxuXHRcdFx0Xy5leHRlbmQoYXBwLCBDcmVhdG9yLkFwcHNbYXBwS2V5XSlcblx0XHRcdGlmICFhcHAgfHwgXy5pc0VtcHR5KGFwcClcblx0XHRcdFx0YXBwID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiYXBwc1wiKS5maW5kT25lKHtfaWQ6IGFwcEtleX0sIHtmaWVsZHM6IGlnbm9yZV9maWVsZHN9KVxuXHRcdFx0ZWxzZVxuXHRcdFx0XHRpZiAhXy5oYXMoYXBwLCBcIl9pZFwiKVxuXHRcdFx0XHRcdGFwcC5faWQgPSBhcHBLZXlcblx0XHRcdGlmIGFwcFxuXHRcdFx0XHRleHBvcnRfZGF0YS5hcHBzLnB1c2ggYXBwXG5cblx0aWYgXy5pc0FycmF5KHJlY29yZC5vYmplY3RzKSAmJiByZWNvcmQub2JqZWN0cy5sZW5ndGggPiAwXG5cdFx0ZXhwb3J0X2RhdGEub2JqZWN0cyA9IFtdXG5cdFx0Xy5lYWNoIHJlY29yZC5vYmplY3RzLCAob2JqZWN0X25hbWUpLT5cblx0XHRcdG9iamVjdCA9IENyZWF0b3IuT2JqZWN0c1tvYmplY3RfbmFtZV1cblx0XHRcdGlmIG9iamVjdFxuXHRcdFx0XHRleHBvcnRfZGF0YS5vYmplY3RzLnB1c2ggQVBUcmFuc2Zvcm0uZXhwb3J0T2JqZWN0KG9iamVjdClcblxuXHRpZiBfLmlzQXJyYXkocmVjb3JkLmxpc3Rfdmlld3MpICYmIHJlY29yZC5saXN0X3ZpZXdzLmxlbmd0aCA+IDBcblx0XHRleHBvcnRfZGF0YS5saXN0X3ZpZXdzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwib2JqZWN0X2xpc3R2aWV3c1wiKS5maW5kKHtfaWQ6IHskaW46IHJlY29yZC5saXN0X3ZpZXdzfX0sIHtmaWVsZHM6IGlnbm9yZV9maWVsZHN9KS5mZXRjaCgpXG5cblx0aWYgXy5pc0FycmF5KHJlY29yZC5wZXJtaXNzaW9uX3NldCkgJiYgcmVjb3JkLnBlcm1pc3Npb25fc2V0Lmxlbmd0aCA+IDBcblx0XHRleHBvcnRfZGF0YS5wZXJtaXNzaW9uX3NldCA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fc2V0XCIpLmZpbmQoe19pZDogeyRpbjogcmVjb3JkLnBlcm1pc3Npb25fc2V0fX0sIHtmaWVsZHM6IGlnbm9yZV9maWVsZHN9KS5mZXRjaCgpXG5cblx0aWYgXy5pc0FycmF5KHJlY29yZC5wZXJtaXNzaW9uX29iamVjdHMpICYmIHJlY29yZC5wZXJtaXNzaW9uX29iamVjdHMubGVuZ3RoID4gMFxuXHRcdGV4cG9ydF9kYXRhLnBlcm1pc3Npb25fb2JqZWN0cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInBlcm1pc3Npb25fb2JqZWN0c1wiKS5maW5kKHtfaWQ6IHskaW46IHJlY29yZC5wZXJtaXNzaW9uX29iamVjdHN9fSwge2ZpZWxkczogaWdub3JlX2ZpZWxkc30pLmZldGNoKClcblxuXHRpZiBfLmlzQXJyYXkocmVjb3JkLnJlcG9ydHMpICYmIHJlY29yZC5yZXBvcnRzLmxlbmd0aCA+IDBcblx0XHRleHBvcnRfZGF0YS5yZXBvcnRzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwicmVwb3J0c1wiKS5maW5kKHtfaWQ6IHskaW46IHJlY29yZC5yZXBvcnRzfX0sIHtmaWVsZHM6IGlnbm9yZV9maWVsZHN9KS5mZXRjaCgpXG5cblx0cmV0dXJuIGV4cG9ydF9kYXRhXG4iLCJ2YXIgaWdub3JlX2ZpZWxkcztcblxudGhpcy5BUFRyYW5zZm9ybSA9IHt9O1xuXG5pZ25vcmVfZmllbGRzID0ge1xuICBvd25lcjogMCxcbiAgc3BhY2U6IDAsXG4gIGNyZWF0ZWQ6IDAsXG4gIGNyZWF0ZWRfYnk6IDAsXG4gIG1vZGlmaWVkOiAwLFxuICBtb2RpZmllZF9ieTogMCxcbiAgaXNfZGVsZXRlZDogMCxcbiAgaW5zdGFuY2VzOiAwLFxuICBzaGFyaW5nOiAwXG59O1xuXG5BUFRyYW5zZm9ybS5leHBvcnRPYmplY3QgPSBmdW5jdGlvbihvYmplY3QpIHtcbiAgdmFyIF9vYmosIGFjdGlvbnMsIGZpZWxkcywgb2JqX2xpc3Rfdmlld3MsIHRyaWdnZXJzO1xuICBfb2JqID0ge307XG4gIF8uZXh0ZW5kKF9vYmosIG9iamVjdCk7XG4gIG9ial9saXN0X3ZpZXdzID0ge307XG4gIF8uZXh0ZW5kKG9ial9saXN0X3ZpZXdzLCBfb2JqLmxpc3Rfdmlld3MgfHwge30pO1xuICBfLmVhY2gob2JqX2xpc3Rfdmlld3MsIGZ1bmN0aW9uKHYsIGspIHtcbiAgICBpZiAoIV8uaGFzKHYsIFwiX2lkXCIpKSB7XG4gICAgICB2Ll9pZCA9IGs7XG4gICAgfVxuICAgIGlmICghXy5oYXModiwgXCJuYW1lXCIpKSB7XG4gICAgICByZXR1cm4gdi5uYW1lID0gaztcbiAgICB9XG4gIH0pO1xuICBfb2JqLmxpc3Rfdmlld3MgPSBvYmpfbGlzdF92aWV3cztcbiAgdHJpZ2dlcnMgPSB7fTtcbiAgXy5mb3JFYWNoKF9vYmoudHJpZ2dlcnMsIGZ1bmN0aW9uKHRyaWdnZXIsIGtleSkge1xuICAgIHZhciBfdHJpZ2dlcjtcbiAgICBfdHJpZ2dlciA9IHt9O1xuICAgIF8uZXh0ZW5kKF90cmlnZ2VyLCB0cmlnZ2VyKTtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKF90cmlnZ2VyLnRvZG8pKSB7XG4gICAgICBfdHJpZ2dlci50b2RvID0gX3RyaWdnZXIudG9kby50b1N0cmluZygpO1xuICAgIH1cbiAgICBkZWxldGUgX3RyaWdnZXIuX3RvZG87XG4gICAgcmV0dXJuIHRyaWdnZXJzW2tleV0gPSBfdHJpZ2dlcjtcbiAgfSk7XG4gIF9vYmoudHJpZ2dlcnMgPSB0cmlnZ2VycztcbiAgYWN0aW9ucyA9IHt9O1xuICBfLmZvckVhY2goX29iai5hY3Rpb25zLCBmdW5jdGlvbihhY3Rpb24sIGtleSkge1xuICAgIHZhciBfYWN0aW9uO1xuICAgIF9hY3Rpb24gPSB7fTtcbiAgICBfLmV4dGVuZChfYWN0aW9uLCBhY3Rpb24pO1xuICAgIGlmIChfLmlzRnVuY3Rpb24oX2FjdGlvbi50b2RvKSkge1xuICAgICAgX2FjdGlvbi50b2RvID0gX2FjdGlvbi50b2RvLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIGRlbGV0ZSBfYWN0aW9uLl90b2RvO1xuICAgIHJldHVybiBhY3Rpb25zW2tleV0gPSBfYWN0aW9uO1xuICB9KTtcbiAgX29iai5hY3Rpb25zID0gYWN0aW9ucztcbiAgZmllbGRzID0ge307XG4gIF8uZm9yRWFjaChfb2JqLmZpZWxkcywgZnVuY3Rpb24oZmllbGQsIGtleSkge1xuICAgIHZhciBfZmllbGQsIF9mbztcbiAgICBfZmllbGQgPSB7fTtcbiAgICBfLmV4dGVuZChfZmllbGQsIGZpZWxkKTtcbiAgICBpZiAoXy5pc0Z1bmN0aW9uKF9maWVsZC5vcHRpb25zKSkge1xuICAgICAgX2ZpZWxkLm9wdGlvbnMgPSBfZmllbGQub3B0aW9ucy50b1N0cmluZygpO1xuICAgICAgZGVsZXRlIF9maWVsZC5fb3B0aW9ucztcbiAgICB9XG4gICAgaWYgKF8uaXNBcnJheShfZmllbGQub3B0aW9ucykpIHtcbiAgICAgIF9mbyA9IFtdO1xuICAgICAgXy5mb3JFYWNoKF9maWVsZC5vcHRpb25zLCBmdW5jdGlvbihfbzEpIHtcbiAgICAgICAgcmV0dXJuIF9mby5wdXNoKF9vMS5sYWJlbCArIFwiOlwiICsgX28xLnZhbHVlKTtcbiAgICAgIH0pO1xuICAgICAgX2ZpZWxkLm9wdGlvbnMgPSBfZm8uam9pbihcIixcIik7XG4gICAgICBkZWxldGUgX2ZpZWxkLl9vcHRpb25zO1xuICAgIH1cbiAgICBpZiAoX2ZpZWxkLnJlZ0V4KSB7XG4gICAgICBfZmllbGQucmVnRXggPSBfZmllbGQucmVnRXgudG9TdHJpbmcoKTtcbiAgICAgIGRlbGV0ZSBfZmllbGQuX3JlZ0V4O1xuICAgIH1cbiAgICBpZiAoXy5pc0Z1bmN0aW9uKF9maWVsZC5vcHRpb25zRnVuY3Rpb24pKSB7XG4gICAgICBfZmllbGQub3B0aW9uc0Z1bmN0aW9uID0gX2ZpZWxkLm9wdGlvbnNGdW5jdGlvbi50b1N0cmluZygpO1xuICAgICAgZGVsZXRlIF9maWVsZC5fb3B0aW9uc0Z1bmN0aW9uO1xuICAgIH1cbiAgICBpZiAoXy5pc0Z1bmN0aW9uKF9maWVsZC5yZWZlcmVuY2VfdG8pKSB7XG4gICAgICBfZmllbGQucmVmZXJlbmNlX3RvID0gX2ZpZWxkLnJlZmVyZW5jZV90by50b1N0cmluZygpO1xuICAgICAgZGVsZXRlIF9maWVsZC5fcmVmZXJlbmNlX3RvO1xuICAgIH1cbiAgICBpZiAoXy5pc0Z1bmN0aW9uKF9maWVsZC5jcmVhdGVGdW5jdGlvbikpIHtcbiAgICAgIF9maWVsZC5jcmVhdGVGdW5jdGlvbiA9IF9maWVsZC5jcmVhdGVGdW5jdGlvbi50b1N0cmluZygpO1xuICAgICAgZGVsZXRlIF9maWVsZC5fY3JlYXRlRnVuY3Rpb247XG4gICAgfVxuICAgIGlmIChfLmlzRnVuY3Rpb24oX2ZpZWxkLmRlZmF1bHRWYWx1ZSkpIHtcbiAgICAgIF9maWVsZC5kZWZhdWx0VmFsdWUgPSBfZmllbGQuZGVmYXVsdFZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICBkZWxldGUgX2ZpZWxkLl9kZWZhdWx0VmFsdWU7XG4gICAgfVxuICAgIHJldHVybiBmaWVsZHNba2V5XSA9IF9maWVsZDtcbiAgfSk7XG4gIF9vYmouZmllbGRzID0gZmllbGRzO1xuICByZXR1cm4gX29iajtcbn07XG5cblxuLypcbuWvvOWHuuaVsOaNrjpcbntcblx0YXBwczpbe31dLCDova/ku7bljIXpgInkuK3nmoRhcHBzXG5cdG9iamVjdHM6W3t9XSwg6YCJ5Lit55qEb2JqZWN05Y+K5YW2ZmllbGRzLCBsaXN0X3ZpZXdzLCB0cmlnZ2VycywgYWN0aW9ucywgcGVybWlzc2lvbl9zZXTnrYlcbiAgICBsaXN0X3ZpZXdzOlt7fV0sIOi9r+S7tuWMhemAieS4reeahGxpc3Rfdmlld3NcbiAgICBwZXJtaXNzaW9uczpbe31dLCDova/ku7bljIXpgInkuK3nmoTmnYPpmZDpm4ZcbiAgICBwZXJtaXNzaW9uX29iamVjdHM6W3t9XSwg6L2v5Lu25YyF6YCJ5Lit55qE5p2D6ZmQ5a+56LGhXG4gICAgcmVwb3J0czpbe31dIOi9r+S7tuWMhemAieS4reeahOaKpeihqFxufVxuICovXG5cbkFQVHJhbnNmb3JtW1wiZXhwb3J0XCJdID0gZnVuY3Rpb24ocmVjb3JkKSB7XG4gIHZhciBleHBvcnRfZGF0YTtcbiAgZXhwb3J0X2RhdGEgPSB7fTtcbiAgaWYgKF8uaXNBcnJheShyZWNvcmQuYXBwcykgJiYgcmVjb3JkLmFwcHMubGVuZ3RoID4gMCkge1xuICAgIGV4cG9ydF9kYXRhLmFwcHMgPSBbXTtcbiAgICBfLmVhY2gocmVjb3JkLmFwcHMsIGZ1bmN0aW9uKGFwcEtleSkge1xuICAgICAgdmFyIGFwcDtcbiAgICAgIGFwcCA9IHt9O1xuICAgICAgXy5leHRlbmQoYXBwLCBDcmVhdG9yLkFwcHNbYXBwS2V5XSk7XG4gICAgICBpZiAoIWFwcCB8fCBfLmlzRW1wdHkoYXBwKSkge1xuICAgICAgICBhcHAgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJhcHBzXCIpLmZpbmRPbmUoe1xuICAgICAgICAgIF9pZDogYXBwS2V5XG4gICAgICAgIH0sIHtcbiAgICAgICAgICBmaWVsZHM6IGlnbm9yZV9maWVsZHNcbiAgICAgICAgfSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoIV8uaGFzKGFwcCwgXCJfaWRcIikpIHtcbiAgICAgICAgICBhcHAuX2lkID0gYXBwS2V5O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoYXBwKSB7XG4gICAgICAgIHJldHVybiBleHBvcnRfZGF0YS5hcHBzLnB1c2goYXBwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBpZiAoXy5pc0FycmF5KHJlY29yZC5vYmplY3RzKSAmJiByZWNvcmQub2JqZWN0cy5sZW5ndGggPiAwKSB7XG4gICAgZXhwb3J0X2RhdGEub2JqZWN0cyA9IFtdO1xuICAgIF8uZWFjaChyZWNvcmQub2JqZWN0cywgZnVuY3Rpb24ob2JqZWN0X25hbWUpIHtcbiAgICAgIHZhciBvYmplY3Q7XG4gICAgICBvYmplY3QgPSBDcmVhdG9yLk9iamVjdHNbb2JqZWN0X25hbWVdO1xuICAgICAgaWYgKG9iamVjdCkge1xuICAgICAgICByZXR1cm4gZXhwb3J0X2RhdGEub2JqZWN0cy5wdXNoKEFQVHJhbnNmb3JtLmV4cG9ydE9iamVjdChvYmplY3QpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuICBpZiAoXy5pc0FycmF5KHJlY29yZC5saXN0X3ZpZXdzKSAmJiByZWNvcmQubGlzdF92aWV3cy5sZW5ndGggPiAwKSB7XG4gICAgZXhwb3J0X2RhdGEubGlzdF92aWV3cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcIm9iamVjdF9saXN0dmlld3NcIikuZmluZCh7XG4gICAgICBfaWQ6IHtcbiAgICAgICAgJGluOiByZWNvcmQubGlzdF92aWV3c1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGZpZWxkczogaWdub3JlX2ZpZWxkc1xuICAgIH0pLmZldGNoKCk7XG4gIH1cbiAgaWYgKF8uaXNBcnJheShyZWNvcmQucGVybWlzc2lvbl9zZXQpICYmIHJlY29yZC5wZXJtaXNzaW9uX3NldC5sZW5ndGggPiAwKSB7XG4gICAgZXhwb3J0X2RhdGEucGVybWlzc2lvbl9zZXQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX3NldFwiKS5maW5kKHtcbiAgICAgIF9pZDoge1xuICAgICAgICAkaW46IHJlY29yZC5wZXJtaXNzaW9uX3NldFxuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGZpZWxkczogaWdub3JlX2ZpZWxkc1xuICAgIH0pLmZldGNoKCk7XG4gIH1cbiAgaWYgKF8uaXNBcnJheShyZWNvcmQucGVybWlzc2lvbl9vYmplY3RzKSAmJiByZWNvcmQucGVybWlzc2lvbl9vYmplY3RzLmxlbmd0aCA+IDApIHtcbiAgICBleHBvcnRfZGF0YS5wZXJtaXNzaW9uX29iamVjdHMgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJwZXJtaXNzaW9uX29iamVjdHNcIikuZmluZCh7XG4gICAgICBfaWQ6IHtcbiAgICAgICAgJGluOiByZWNvcmQucGVybWlzc2lvbl9vYmplY3RzXG4gICAgICB9XG4gICAgfSwge1xuICAgICAgZmllbGRzOiBpZ25vcmVfZmllbGRzXG4gICAgfSkuZmV0Y2goKTtcbiAgfVxuICBpZiAoXy5pc0FycmF5KHJlY29yZC5yZXBvcnRzKSAmJiByZWNvcmQucmVwb3J0cy5sZW5ndGggPiAwKSB7XG4gICAgZXhwb3J0X2RhdGEucmVwb3J0cyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcInJlcG9ydHNcIikuZmluZCh7XG4gICAgICBfaWQ6IHtcbiAgICAgICAgJGluOiByZWNvcmQucmVwb3J0c1xuICAgICAgfVxuICAgIH0sIHtcbiAgICAgIGZpZWxkczogaWdub3JlX2ZpZWxkc1xuICAgIH0pLmZldGNoKCk7XG4gIH1cbiAgcmV0dXJuIGV4cG9ydF9kYXRhO1xufTtcbiJdfQ==
