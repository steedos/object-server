(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var ECMAScript = Package.ecmascript.ECMAScript;
var meteorInstall = Package.modules.meteorInstall;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var __coffeescriptShare;

var require = meteorInstall({"node_modules":{"meteor":{"steedos:audit":{"lib":{"audit_records.coffee":function(require){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/steedos_audit/lib/audit_records.coffee                                                                 //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var clone, getLookupFieldModifier, getLookupFieldValue, insertRecord, transformFieldValue, updateRecord;
clone = require("clone");
Creator.AuditRecords = {};

getLookupFieldValue = function (reference_to, value, space_id) {
  var name_field_key, obj, previous_ids, reference_to_object, values;

  if (_.isArray(reference_to) && _.isObject(value)) {
    reference_to = value.o;
    previous_ids = value.ids;
  }

  if (!_.isArray(previous_ids)) {
    previous_ids = value ? [value] : [];
  }

  reference_to_object = Creator.getObject(reference_to, space_id);
  name_field_key = reference_to_object.NAME_FIELD_KEY;
  values = Creator.getCollection(reference_to, space_id).find({
    _id: {
      $in: previous_ids
    }
  }, {
    fields: (obj = {
      _id: 1
    }, obj["" + name_field_key] = 1, obj)
  }).fetch();
  values = Creator.getOrderlySetByIds(values, previous_ids);
  return _.pluck(values, name_field_key).join(',');
};

getLookupFieldModifier = function (field, value, space_id) {
  var reference_to;
  reference_to = field.reference_to;

  if (_.isFunction(reference_to)) {
    reference_to = reference_to();
  }

  if (_.isFunction(field.optionsFunction)) {
    if (_.isString(reference_to)) {
      if (value) {
        return getLookupFieldValue(reference_to, value, space_id);
      }
    } else {
      return '';
    }
  } else {
    return getLookupFieldValue(reference_to, value, space_id);
  }
}; /*
   字段值转换规则:
   1 日期 格式存储为 (String): 2018-01-02
   2 时间 格式存储为 (String): 2018-01-02 23:12
   2 lookup 和下拉框，都是对应的显示名称 (name | label)
   3 boolean 就存是/否
   4 多行文本\grid\lookup有optionsFunction并且没有reference_to时 不记录新旧值, 只记录修改时间, 修改人, 修改的字段显示名
    */

transformFieldValue = function (field, value, options) {
  var selected_value, space_id, utcOffset;

  if (_.isNull(value) || _.isUndefined(value)) {
    return;
  }

  utcOffset = options.utcOffset;
  space_id = options.space_id;

  switch (field.type) {
    case 'date':
      return moment.utc(value).format('YYYY-MM-DD');

    case 'datetime':
      return moment(value).utcOffset(utcOffset).format('YYYY-MM-DD HH:mm');

    case 'boolean':
      if (_.isBoolean(value)) {
        if (value) {
          return '是';
        } else {
          return '否';
        }
      }

      break;

    case 'select':
      if (_.isString(value)) {
        value = [value];
      }

      selected_value = _.map(field.options, function (option) {
        if (_.contains(value, option.value)) {
          return option.label;
        }
      });
      return _.compact(selected_value).join(',');

    case 'checkbox':
      if (_.isString(value)) {
        value = [value];
      }

      selected_value = _.map(field.options, function (option) {
        if (_.contains(value, option.value)) {
          return option.label;
        }
      });
      return _.compact(selected_value).join(',');

    case 'lookup':
      return getLookupFieldModifier(field, value, space_id);

    case 'master_detail':
      return getLookupFieldModifier(field, value, space_id);

    case 'textarea':
      return '';

    case 'code':
      return '';

    case 'html':
      return '';

    case 'markdown':
      return '';

    case 'grid':
      return '';

    default:
      return value;
  }
};

insertRecord = function (userId, object_name, new_doc) {
  var collection, doc, record_id, space_id;
  collection = Creator.getCollection("audit_records");
  space_id = new_doc.space;
  record_id = new_doc._id;
  doc = {
    _id: collection._makeNewID(),
    space: space_id,
    field_name: "已创建。",
    related_to: {
      o: object_name,
      ids: [record_id]
    }
  };
  return collection.insert(doc);
};

updateRecord = function (userId, object_name, new_doc, previous_doc, modifier) {
  var fields, modifierSet, modifierUnset, options, record_id, ref, space_id, utcOffset;
  space_id = new_doc.space;
  record_id = new_doc._id;
  fields = (ref = Creator.convertObject(clone(Creator.getObject(object_name, space_id)), space_id)) != null ? ref.fields : void 0;
  modifierSet = modifier.$set;
  modifierUnset = modifier.$unset; /* TODO utcOffset 应该来自数据库,待 #984 处理后 调整
                                   
                                      utcOffset = Creator.getCollection("users").findOne({_id: userId})?.utcOffset
                                   
                                   	if !_.isNumber(utcOffset)
                                   		utcOffset = 8
                                    */
  utcOffset = 8;
  options = {
    utcOffset: utcOffset,
    space_id: space_id
  };

  _.each(modifierSet, function (v, k) {
    var collection, db_new_value, db_previous_value, doc, field, new_value, previous_value;
    field = fields != null ? fields[k] : void 0;
    previous_value = previous_doc[k];
    new_value = v;
    db_previous_value = null;
    db_new_value = null;

    switch (field.type) {
      case 'date':
        if ((new_value != null ? new_value.toString() : void 0) !== (previous_value != null ? previous_value.toString() : void 0)) {
          if (new_value) {
            db_new_value = transformFieldValue(field, new_value, options);
          }

          if (previous_value) {
            db_previous_value = transformFieldValue(field, previous_value, options);
          }
        }

        break;

      case 'datetime':
        if ((new_value != null ? new_value.toString() : void 0) !== (previous_value != null ? previous_value.toString() : void 0)) {
          if (new_value) {
            db_new_value = transformFieldValue(field, new_value, options);
          }

          if (previous_value) {
            db_previous_value = transformFieldValue(field, previous_value, options);
          }
        }

        break;

      case 'textarea':
        if (previous_value !== new_value) {
          db_previous_value = transformFieldValue(field, previous_value, options);
          db_new_value = transformFieldValue(field, new_value, options);
        }

        break;

      case 'code':
        if (previous_value !== new_value) {
          db_previous_value = transformFieldValue(field, previous_value, options);
          db_new_value = transformFieldValue(field, new_value, options);
        }

        break;

      case 'html':
        if (previous_value !== new_value) {
          db_previous_value = transformFieldValue(field, previous_value, options);
          db_new_value = transformFieldValue(field, new_value, options);
        }

        break;

      case 'markdown':
        if (previous_value !== new_value) {
          db_previous_value = transformFieldValue(field, previous_value, options);
          db_new_value = transformFieldValue(field, new_value, options);
        }

        break;

      case 'grid':
        if (JSON.stringify(previous_value) !== JSON.stringify(new_value)) {
          db_previous_value = transformFieldValue(field, previous_value, options);
          db_new_value = transformFieldValue(field, new_value, options);
        }

        break;

      case 'boolean':
        if (previous_value !== new_value) {
          db_previous_value = transformFieldValue(field, previous_value, options);
          db_new_value = transformFieldValue(field, new_value, options);
        }

        break;

      case 'select':
        if ((previous_value != null ? previous_value.toString() : void 0) !== (new_value != null ? new_value.toString() : void 0)) {
          db_previous_value = transformFieldValue(field, previous_value, options);
          db_new_value = transformFieldValue(field, new_value, options);
        }

        break;

      case 'checkbox':
        if ((previous_value != null ? previous_value.toString() : void 0) !== (new_value != null ? new_value.toString() : void 0)) {
          db_previous_value = transformFieldValue(field, previous_value, options);
          db_new_value = transformFieldValue(field, new_value, options);
        }

        break;

      case 'lookup':
        if (JSON.stringify(previous_value) !== JSON.stringify(new_value)) {
          if (previous_value) {
            db_previous_value = transformFieldValue(field, previous_value, options);
          }

          if (new_value) {
            db_new_value = transformFieldValue(field, new_value, options);
          }
        }

        break;

      case 'master_detail':
        if (JSON.stringify(previous_value) !== JSON.stringify(new_value)) {
          if (previous_value) {
            db_previous_value = transformFieldValue(field, previous_value, options);
          }

          if (new_value) {
            db_new_value = transformFieldValue(field, new_value, options);
          }
        }

        break;

      default:
        if (new_value !== previous_value) {
          db_previous_value = previous_value;
          db_new_value = new_value;
        }

    }

    if (db_new_value !== null && db_new_value !== void 0 || db_previous_value !== null && db_previous_value !== void 0) {
      collection = Creator.getCollection("audit_records");
      doc = {
        _id: collection._makeNewID(),
        space: space_id,
        field_name: field.label || field.name,
        previous_value: db_previous_value,
        new_value: db_new_value,
        related_to: {
          o: object_name,
          ids: [record_id]
        }
      };
      return collection.insert(doc);
    }
  });

  return _.each(modifierUnset, function (v, k) {
    var collection, db_previous_value, doc, field, previous_value;
    field = fields != null ? fields[k] : void 0;
    previous_value = previous_doc[k];

    if (previous_value || _.isBoolean(previous_value)) {
      collection = Creator.getCollection("audit_records");
      db_previous_value = transformFieldValue(field, previous_value, options);
      doc = {
        _id: collection._makeNewID(),
        space: space_id,
        field_name: field.label || field.name,
        previous_value: db_previous_value,
        related_to: {
          o: object_name,
          ids: [record_id]
        }
      };
      return collection.insert(doc);
    }
  });
};

Creator.AuditRecords.add = function (action, userId, object_name, new_doc, previous_doc, modifier) {
  if (action === 'update') {
    return updateRecord(userId, object_name, new_doc, previous_doc, modifier);
  } else if (action === 'insert') {
    return insertRecord(userId, object_name, new_doc);
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}},"models":{"audit_records.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/steedos_audit/models/audit_records.coffee                                                              //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Creator.Objects.audit_records = {
  name: "audit_records",
  label: "字段历史",
  icon: "record",
  fields: {
    related_to: {
      label: "相关项",
      type: "lookup",
      index: true,
      reference_to: function () {
        var o;
        o = [];

        _.each(Creator.Objects, function (object, object_name) {
          if (object.enable_audit) {
            return o.push(object.name);
          }
        });

        return o;
      },
      filterable: true,
      is_name: true
    },
    created: {
      label: "时间",
      filterable: true
    },
    field_name: {
      label: "字段",
      type: "text",
      required: true,
      is_wide: true
    },
    created_by: {
      label: "用户"
    },
    previous_value: {
      label: "原始值",
      type: "text"
    },
    new_value: {
      label: "新值",
      type: "text"
    }
  },
  list_views: {
    all: {
      label: "全部",
      filter_scope: "space",
      columns: ["related_to", "created", "field_name", "created_by", "previous_value", "new_value"],
      filter_fields: ["related_to"]
    },
    recent: {
      label: "最近查看",
      filter_scope: "space"
    }
  },
  permission_set: {
    user: {
      allowCreate: false,
      allowDelete: false,
      allowEdit: false,
      allowRead: true,
      modifyAllRecords: false,
      viewAllRecords: false
    },
    admin: {
      allowCreate: false,
      allowDelete: false,
      allowEdit: false,
      allowRead: true,
      modifyAllRecords: false,
      viewAllRecords: true
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"audit_login.coffee":function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/steedos_audit/models/audit_login.coffee                                                                //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
Creator.Objects.audit_login = {
  name: "audit_login",
  label: "登录日志",
  icon: "record",
  fields: {
    username: {
      label: "用户名",
      type: "text",
      is_name: true
    },
    login_time: {
      label: "登录时间",
      type: "datetime"
    },
    source_ip: {
      label: "IP地址",
      type: "text"
    },
    location: {
      label: "位置",
      type: "text"
    },
    login_type: {
      label: "登录方式",
      type: "text"
    },
    status: {
      label: "状态",
      type: "text"
    },
    browser: {
      label: "浏览器",
      type: "text"
    },
    platform: {
      label: "系统",
      type: "text"
    },
    application: {
      label: "应用",
      type: "text"
    },
    client_version: {
      label: "客户端版本",
      type: "text"
    },
    api_type: {
      label: "api类型",
      type: "text"
    },
    api_version: {
      label: "api版本",
      type: "text"
    },
    login_url: {
      label: "登录URL",
      type: "text"
    }
  },
  list_views: {
    all: {
      label: "全部",
      filter_scope: "space",
      columns: ["username", "login_time", "source_ip", "location", "login_type", "status", "browser", "platform", "application", "client_version", "api_type", "api_version", "login_url"]
    },
    recent: {
      label: "最近查看",
      filter_scope: "space"
    }
  },
  permission_set: {
    user: {
      allowCreate: false,
      allowDelete: false,
      allowEdit: false,
      allowRead: true,
      modifyAllRecords: false,
      viewAllRecords: false
    },
    admin: {
      allowCreate: false,
      allowDelete: false,
      allowEdit: false,
      allowRead: true,
      modifyAllRecords: false,
      viewAllRecords: true
    }
  }
};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}}},{
  "extensions": [
    ".js",
    ".json",
    ".coffee"
  ]
});

require("/node_modules/meteor/steedos:audit/lib/audit_records.coffee");
require("/node_modules/meteor/steedos:audit/models/audit_records.coffee");
require("/node_modules/meteor/steedos:audit/models/audit_login.coffee");

/* Exports */
Package._define("steedos:audit");

})();

//# sourceURL=meteor://💻app/packages/steedos_audit.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdWRpdC9saWIvYXVkaXRfcmVjb3Jkcy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9hdWRpdF9yZWNvcmRzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdWRpdC9tb2RlbHMvYXVkaXRfcmVjb3Jkcy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL21vZGVscy9hdWRpdF9yZWNvcmRzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdWRpdC9tb2RlbHMvYXVkaXRfbG9naW4uY29mZmVlIl0sIm5hbWVzIjpbImNsb25lIiwiZ2V0TG9va3VwRmllbGRNb2RpZmllciIsImdldExvb2t1cEZpZWxkVmFsdWUiLCJpbnNlcnRSZWNvcmQiLCJ0cmFuc2Zvcm1GaWVsZFZhbHVlIiwidXBkYXRlUmVjb3JkIiwicmVxdWlyZSIsIkNyZWF0b3IiLCJBdWRpdFJlY29yZHMiLCJyZWZlcmVuY2VfdG8iLCJ2YWx1ZSIsInNwYWNlX2lkIiwibmFtZV9maWVsZF9rZXkiLCJvYmoiLCJwcmV2aW91c19pZHMiLCJyZWZlcmVuY2VfdG9fb2JqZWN0IiwidmFsdWVzIiwiXyIsImlzQXJyYXkiLCJpc09iamVjdCIsIm8iLCJpZHMiLCJnZXRPYmplY3QiLCJOQU1FX0ZJRUxEX0tFWSIsImdldENvbGxlY3Rpb24iLCJmaW5kIiwiX2lkIiwiJGluIiwiZmllbGRzIiwiZmV0Y2giLCJnZXRPcmRlcmx5U2V0QnlJZHMiLCJwbHVjayIsImpvaW4iLCJmaWVsZCIsImlzRnVuY3Rpb24iLCJvcHRpb25zRnVuY3Rpb24iLCJpc1N0cmluZyIsIm9wdGlvbnMiLCJzZWxlY3RlZF92YWx1ZSIsInV0Y09mZnNldCIsImlzTnVsbCIsImlzVW5kZWZpbmVkIiwidHlwZSIsIm1vbWVudCIsInV0YyIsImZvcm1hdCIsImlzQm9vbGVhbiIsIm1hcCIsIm9wdGlvbiIsImNvbnRhaW5zIiwibGFiZWwiLCJjb21wYWN0IiwidXNlcklkIiwib2JqZWN0X25hbWUiLCJuZXdfZG9jIiwiY29sbGVjdGlvbiIsImRvYyIsInJlY29yZF9pZCIsInNwYWNlIiwiX21ha2VOZXdJRCIsImZpZWxkX25hbWUiLCJyZWxhdGVkX3RvIiwiaW5zZXJ0IiwicHJldmlvdXNfZG9jIiwibW9kaWZpZXIiLCJtb2RpZmllclNldCIsIm1vZGlmaWVyVW5zZXQiLCJyZWYiLCJjb252ZXJ0T2JqZWN0IiwiJHNldCIsIiR1bnNldCIsImVhY2giLCJ2IiwiayIsImRiX25ld192YWx1ZSIsImRiX3ByZXZpb3VzX3ZhbHVlIiwibmV3X3ZhbHVlIiwicHJldmlvdXNfdmFsdWUiLCJ0b1N0cmluZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJuYW1lIiwiYWRkIiwiYWN0aW9uIiwiT2JqZWN0cyIsImF1ZGl0X3JlY29yZHMiLCJpY29uIiwiaW5kZXgiLCJvYmplY3QiLCJlbmFibGVfYXVkaXQiLCJwdXNoIiwiZmlsdGVyYWJsZSIsImlzX25hbWUiLCJjcmVhdGVkIiwicmVxdWlyZWQiLCJpc193aWRlIiwiY3JlYXRlZF9ieSIsImxpc3Rfdmlld3MiLCJhbGwiLCJmaWx0ZXJfc2NvcGUiLCJjb2x1bW5zIiwiZmlsdGVyX2ZpZWxkcyIsInJlY2VudCIsInBlcm1pc3Npb25fc2V0IiwidXNlciIsImFsbG93Q3JlYXRlIiwiYWxsb3dEZWxldGUiLCJhbGxvd0VkaXQiLCJhbGxvd1JlYWQiLCJtb2RpZnlBbGxSZWNvcmRzIiwidmlld0FsbFJlY29yZHMiLCJhZG1pbiIsImF1ZGl0X2xvZ2luIiwidXNlcm5hbWUiLCJsb2dpbl90aW1lIiwic291cmNlX2lwIiwibG9jYXRpb24iLCJsb2dpbl90eXBlIiwic3RhdHVzIiwiYnJvd3NlciIsInBsYXRmb3JtIiwiYXBwbGljYXRpb24iLCJjbGllbnRfdmVyc2lvbiIsImFwaV90eXBlIiwiYXBpX3ZlcnNpb24iLCJsb2dpbl91cmwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7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RGI7QUFFQUMsaUJBQVcsS0FGWDtBQUdBQyxpQkFBVyxJQUhYO0FBSUFDLHdCQUFrQixLQUpsQjtBQUtBQyxzQkFBZ0I7QUFMaEIsS0FERDtBQU9BQyxXQUNDO0FBQUFOLG1CQUFhLEtBQWI7QUFDQUMsbUJBQWEsS0FEYjtBQUVBQyxpQkFBVyxLQUZYO0FBR0FDLGlCQUFXLElBSFg7QUFJQUMsd0JBQWtCLEtBSmxCO0FBS0FDLHNCQUFnQjtBQUxoQjtBQVJEO0FBbkVELENBREQsQyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19hdWRpdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsb25lID0gcmVxdWlyZShcImNsb25lXCIpO1xuQ3JlYXRvci5BdWRpdFJlY29yZHMgPSB7fVxuXG5nZXRMb29rdXBGaWVsZFZhbHVlID0gKHJlZmVyZW5jZV90bywgdmFsdWUsIHNwYWNlX2lkKS0+XG5cdGlmIF8uaXNBcnJheShyZWZlcmVuY2VfdG8pICYmIF8uaXNPYmplY3QodmFsdWUpXG5cdFx0cmVmZXJlbmNlX3RvID0gdmFsdWUub1xuXHRcdHByZXZpb3VzX2lkcyA9IHZhbHVlLmlkc1xuXHRpZiAhXy5pc0FycmF5KHByZXZpb3VzX2lkcylcblx0XHRwcmV2aW91c19pZHMgPSBpZiB2YWx1ZSB0aGVuIFt2YWx1ZV0gZWxzZSBbXVxuXHRyZWZlcmVuY2VfdG9fb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3QocmVmZXJlbmNlX3RvLCBzcGFjZV9pZClcblx0bmFtZV9maWVsZF9rZXkgPSByZWZlcmVuY2VfdG9fb2JqZWN0Lk5BTUVfRklFTERfS0VZXG5cdHZhbHVlcyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihyZWZlcmVuY2VfdG8sIHNwYWNlX2lkKS5maW5kKHtfaWQ6IHskaW46IHByZXZpb3VzX2lkc319LCB7ZmllbGRzOiB7X2lkOjEsIFwiI3tuYW1lX2ZpZWxkX2tleX1cIjogMX19KS5mZXRjaCgpXG5cdHZhbHVlcyA9IENyZWF0b3IuZ2V0T3JkZXJseVNldEJ5SWRzKHZhbHVlcywgcHJldmlvdXNfaWRzKVxuXHRyZXR1cm4gKF8ucGx1Y2sgdmFsdWVzLCBuYW1lX2ZpZWxkX2tleSkuam9pbignLCcpXG5cbmdldExvb2t1cEZpZWxkTW9kaWZpZXIgPSAoZmllbGQsIHZhbHVlLCBzcGFjZV9pZCktPlxuXHRyZWZlcmVuY2VfdG8gPSBmaWVsZC5yZWZlcmVuY2VfdG9cblx0aWYgXy5pc0Z1bmN0aW9uKHJlZmVyZW5jZV90bylcblx0XHRyZWZlcmVuY2VfdG8gPSByZWZlcmVuY2VfdG8oKVxuXHRpZiBfLmlzRnVuY3Rpb24oZmllbGQub3B0aW9uc0Z1bmN0aW9uKVxuXHRcdGlmIF8uaXNTdHJpbmcocmVmZXJlbmNlX3RvKVxuXHRcdFx0aWYgdmFsdWVcblx0XHRcdFx0cmV0dXJuIGdldExvb2t1cEZpZWxkVmFsdWUocmVmZXJlbmNlX3RvLCB2YWx1ZSwgc3BhY2VfaWQpXG5cdFx0ZWxzZVxuXHRcdFx0cmV0dXJuICcnXG5cdGVsc2Vcblx0XHRyZXR1cm4gZ2V0TG9va3VwRmllbGRWYWx1ZShyZWZlcmVuY2VfdG8sIHZhbHVlLCBzcGFjZV9pZClcblxuIyMjXG7lrZfmrrXlgLzovazmjaLop4TliJk6XG4xIOaXpeacnyDmoLzlvI/lrZjlgqjkuLogKFN0cmluZyk6IDIwMTgtMDEtMDJcbjIg5pe26Ze0IOagvOW8j+WtmOWCqOS4uiAoU3RyaW5nKTogMjAxOC0wMS0wMiAyMzoxMlxuMiBsb29rdXAg5ZKM5LiL5ouJ5qGG77yM6YO95piv5a+55bqU55qE5pi+56S65ZCN56ewIChuYW1lIHwgbGFiZWwpXG4zIGJvb2xlYW4g5bCx5a2Y5pivL+WQplxuNCDlpJrooYzmlofmnKxcXGdyaWRcXGxvb2t1cOaciW9wdGlvbnNGdW5jdGlvbuW5tuS4lOayoeaciXJlZmVyZW5jZV90b+aXtiDkuI3orrDlvZXmlrDml6flgLwsIOWPquiusOW9leS/ruaUueaXtumXtCwg5L+u5pS55Lq6LCDkv67mlLnnmoTlrZfmrrXmmL7npLrlkI1cbiMjI1xudHJhbnNmb3JtRmllbGRWYWx1ZSA9IChmaWVsZCwgdmFsdWUsIG9wdGlvbnMpLT5cblxuXHRpZiBfLmlzTnVsbCh2YWx1ZSkgfHwgXy5pc1VuZGVmaW5lZCh2YWx1ZSlcblx0XHRyZXR1cm5cblxuXHR1dGNPZmZzZXQgPSBvcHRpb25zLnV0Y09mZnNldFxuXHRzcGFjZV9pZCA9IG9wdGlvbnMuc3BhY2VfaWRcblxuXHRzd2l0Y2ggZmllbGQudHlwZVxuXHRcdHdoZW4gJ2RhdGUnXG5cdFx0XHRyZXR1cm4gbW9tZW50LnV0Yyh2YWx1ZSkuZm9ybWF0KCdZWVlZLU1NLUREJylcblx0XHR3aGVuICdkYXRldGltZSdcblx0XHRcdHJldHVybiBtb21lbnQodmFsdWUpLnV0Y09mZnNldCh1dGNPZmZzZXQpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbScpXG5cdFx0d2hlbiAnYm9vbGVhbidcblx0XHRcdGlmIF8uaXNCb29sZWFuKHZhbHVlKVxuXHRcdFx0XHRpZiB2YWx1ZVxuXHRcdFx0XHRcdHJldHVybiAn5pivJ1xuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdFx0cmV0dXJuICflkKYnXG5cdFx0d2hlbiAnc2VsZWN0J1xuXHRcdFx0aWYgXy5pc1N0cmluZyh2YWx1ZSlcblx0XHRcdFx0dmFsdWUgPSBbdmFsdWVdXG5cdFx0XHRzZWxlY3RlZF92YWx1ZSA9IF8ubWFwIGZpZWxkLm9wdGlvbnMsIChvcHRpb24pLT5cblx0XHRcdFx0aWYgXy5jb250YWlucyh2YWx1ZSwgb3B0aW9uLnZhbHVlKVxuXHRcdFx0XHRcdHJldHVybiBvcHRpb24ubGFiZWxcblx0XHRcdHJldHVybiBfLmNvbXBhY3Qoc2VsZWN0ZWRfdmFsdWUpLmpvaW4oJywnKVxuXHRcdHdoZW4gJ2NoZWNrYm94J1xuXHRcdFx0aWYgXy5pc1N0cmluZyh2YWx1ZSlcblx0XHRcdFx0dmFsdWUgPSBbdmFsdWVdXG5cdFx0XHRzZWxlY3RlZF92YWx1ZSA9IF8ubWFwIGZpZWxkLm9wdGlvbnMsIChvcHRpb24pLT5cblx0XHRcdFx0aWYgXy5jb250YWlucyh2YWx1ZSwgb3B0aW9uLnZhbHVlKVxuXHRcdFx0XHRcdHJldHVybiBvcHRpb24ubGFiZWxcblx0XHRcdHJldHVybiBfLmNvbXBhY3Qoc2VsZWN0ZWRfdmFsdWUpLmpvaW4oJywnKVxuXHRcdHdoZW4gJ2xvb2t1cCdcblx0XHRcdHJldHVybiBnZXRMb29rdXBGaWVsZE1vZGlmaWVyKGZpZWxkLCB2YWx1ZSwgc3BhY2VfaWQpXG5cdFx0d2hlbiAnbWFzdGVyX2RldGFpbCdcblx0XHRcdHJldHVybiBnZXRMb29rdXBGaWVsZE1vZGlmaWVyKGZpZWxkLCB2YWx1ZSwgc3BhY2VfaWQpXG5cdFx0d2hlbiAndGV4dGFyZWEnXG5cdFx0XHRyZXR1cm4gJydcblx0XHR3aGVuICdjb2RlJ1xuXHRcdFx0cmV0dXJuICcnXG5cdFx0d2hlbiAnaHRtbCdcblx0XHRcdHJldHVybiAnJ1xuXHRcdHdoZW4gJ21hcmtkb3duJ1xuXHRcdFx0cmV0dXJuICcnXG5cdFx0d2hlbiAnZ3JpZCdcblx0XHRcdHJldHVybiAnJ1xuXHRcdGVsc2Vcblx0XHRcdHJldHVybiB2YWx1ZVxuXG4jIOaWsOW7uuaXtiwg5LiN6K6w5b2V5piO57uGXG5pbnNlcnRSZWNvcmQgPSAodXNlcklkLCBvYmplY3RfbmFtZSwgbmV3X2RvYyktPlxuI1x0aWYgIXVzZXJJZFxuI1x0XHRyZXR1cm5cblxuXHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiYXVkaXRfcmVjb3Jkc1wiKVxuXHRzcGFjZV9pZCA9IG5ld19kb2Muc3BhY2Vcblx0cmVjb3JkX2lkID0gbmV3X2RvYy5faWRcblx0ZG9jID0ge1xuXHRcdF9pZDogY29sbGVjdGlvbi5fbWFrZU5ld0lEKClcblx0XHRzcGFjZTogc3BhY2VfaWRcblx0XHRmaWVsZF9uYW1lOiBcIuW3suWIm+W7uuOAglwiXG5cdFx0cmVsYXRlZF90bzoge1xuXHRcdFx0bzogb2JqZWN0X25hbWVcblx0XHRcdGlkczogW3JlY29yZF9pZF1cblx0XHR9XG5cdH1cblx0Y29sbGVjdGlvbi5pbnNlcnQgZG9jXG5cbiMg5L+u5pS55pe2LCDorrDlvZXlrZfmrrXlj5jmm7TmmI7nu4ZcbnVwZGF0ZVJlY29yZCA9ICh1c2VySWQsIG9iamVjdF9uYW1lLCBuZXdfZG9jLCBwcmV2aW91c19kb2MsIG1vZGlmaWVyKS0+XG4jXHRpZiAhdXNlcklkXG4jXHRcdHJldHVyblxuXHRzcGFjZV9pZCA9IG5ld19kb2Muc3BhY2Vcblx0cmVjb3JkX2lkID0gbmV3X2RvYy5faWRcblxuXHRmaWVsZHMgPSBDcmVhdG9yLmNvbnZlcnRPYmplY3QoY2xvbmUoQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0X25hbWUsIHNwYWNlX2lkKSksIHNwYWNlX2lkKT8uZmllbGRzXG5cblx0bW9kaWZpZXJTZXQgPSBtb2RpZmllci4kc2V0XG5cblx0bW9kaWZpZXJVbnNldCA9IG1vZGlmaWVyLiR1bnNldFxuXG5cdCMjIyBUT0RPIHV0Y09mZnNldCDlupTor6XmnaXoh6rmlbDmja7lupMs5b6FICM5ODQg5aSE55CG5ZCOIOiwg+aVtFxuXG4gICAgdXRjT2Zmc2V0ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwidXNlcnNcIikuZmluZE9uZSh7X2lkOiB1c2VySWR9KT8udXRjT2Zmc2V0XG5cblx0aWYgIV8uaXNOdW1iZXIodXRjT2Zmc2V0KVxuXHRcdHV0Y09mZnNldCA9IDhcblx0IyMjXG5cblx0dXRjT2Zmc2V0ID0gOFxuXG5cdG9wdGlvbnMgPSB7dXRjT2Zmc2V0OiB1dGNPZmZzZXQsIHNwYWNlX2lkOiBzcGFjZV9pZH1cblxuXHRfLmVhY2ggbW9kaWZpZXJTZXQsICh2LCBrKS0+XG5cdFx0ZmllbGQgPSBmaWVsZHM/W2tdXG5cdFx0cHJldmlvdXNfdmFsdWUgPSBwcmV2aW91c19kb2Nba11cblx0XHRuZXdfdmFsdWUgPSB2XG5cblx0XHRkYl9wcmV2aW91c192YWx1ZSA9IG51bGxcblx0XHRkYl9uZXdfdmFsdWUgPSBudWxsXG5cblx0XHRzd2l0Y2ggZmllbGQudHlwZVxuXHRcdFx0d2hlbiAnZGF0ZSdcblx0XHRcdFx0aWYgbmV3X3ZhbHVlPy50b1N0cmluZygpICE9IHByZXZpb3VzX3ZhbHVlPy50b1N0cmluZygpXG5cdFx0XHRcdFx0aWYgbmV3X3ZhbHVlXG5cdFx0XHRcdFx0XHRkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpXG5cdFx0XHRcdFx0aWYgcHJldmlvdXNfdmFsdWVcblx0XHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXG5cdFx0XHR3aGVuICdkYXRldGltZSdcblx0XHRcdFx0aWYgbmV3X3ZhbHVlPy50b1N0cmluZygpICE9IHByZXZpb3VzX3ZhbHVlPy50b1N0cmluZygpXG5cdFx0XHRcdFx0aWYgbmV3X3ZhbHVlXG5cdFx0XHRcdFx0XHRkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpXG5cdFx0XHRcdFx0aWYgcHJldmlvdXNfdmFsdWVcblx0XHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXG5cdFx0XHR3aGVuICd0ZXh0YXJlYSdcblx0XHRcdFx0aWYgcHJldmlvdXNfdmFsdWUgIT0gbmV3X3ZhbHVlXG5cdFx0XHRcdFx0ZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucylcblx0XHRcdFx0XHRkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpXG5cdFx0XHR3aGVuICdjb2RlJ1xuXHRcdFx0XHRpZiBwcmV2aW91c192YWx1ZSAhPSBuZXdfdmFsdWVcblx0XHRcdFx0XHRkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKVxuXHRcdFx0XHRcdGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucylcblx0XHRcdHdoZW4gJ2h0bWwnXG5cdFx0XHRcdGlmIHByZXZpb3VzX3ZhbHVlICE9IG5ld192YWx1ZVxuXHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXG5cdFx0XHRcdFx0ZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKVxuXHRcdFx0d2hlbiAnbWFya2Rvd24nXG5cdFx0XHRcdGlmIHByZXZpb3VzX3ZhbHVlICE9IG5ld192YWx1ZVxuXHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXG5cdFx0XHRcdFx0ZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKVxuXHRcdFx0d2hlbiAnZ3JpZCdcblx0XHRcdFx0aWYgSlNPTi5zdHJpbmdpZnkocHJldmlvdXNfdmFsdWUpICE9IEpTT04uc3RyaW5naWZ5KG5ld192YWx1ZSlcblx0XHRcdFx0XHRkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKVxuXHRcdFx0XHRcdGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucylcblx0XHRcdHdoZW4gJ2Jvb2xlYW4nXG5cdFx0XHRcdGlmIHByZXZpb3VzX3ZhbHVlICE9IG5ld192YWx1ZVxuXHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXG5cdFx0XHRcdFx0ZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKVxuXHRcdFx0d2hlbiAnc2VsZWN0J1xuXHRcdFx0XHRpZiBwcmV2aW91c192YWx1ZT8udG9TdHJpbmcoKSAhPSBuZXdfdmFsdWU/LnRvU3RyaW5nKClcblx0XHRcdFx0XHRkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKVxuXHRcdFx0XHRcdGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucylcblx0XHRcdHdoZW4gJ2NoZWNrYm94J1xuXHRcdFx0XHRpZiBwcmV2aW91c192YWx1ZT8udG9TdHJpbmcoKSAhPSBuZXdfdmFsdWU/LnRvU3RyaW5nKClcblx0XHRcdFx0XHRkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKVxuXHRcdFx0XHRcdGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucylcblx0XHRcdHdoZW4gJ2xvb2t1cCdcblx0XHRcdFx0aWYgSlNPTi5zdHJpbmdpZnkocHJldmlvdXNfdmFsdWUpICE9IEpTT04uc3RyaW5naWZ5KG5ld192YWx1ZSlcblx0XHRcdFx0XHRpZiBwcmV2aW91c192YWx1ZVxuXHRcdFx0XHRcdFx0ZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucylcblx0XHRcdFx0XHRpZiBuZXdfdmFsdWVcblx0XHRcdFx0XHRcdGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucylcblx0XHRcdHdoZW4gJ21hc3Rlcl9kZXRhaWwnXG5cdFx0XHRcdGlmIEpTT04uc3RyaW5naWZ5KHByZXZpb3VzX3ZhbHVlKSAhPSBKU09OLnN0cmluZ2lmeShuZXdfdmFsdWUpXG5cdFx0XHRcdFx0aWYgcHJldmlvdXNfdmFsdWVcblx0XHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXG5cdFx0XHRcdFx0aWYgbmV3X3ZhbHVlXG5cdFx0XHRcdFx0XHRkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpXG5cdFx0XHRlbHNlXG5cdFx0XHRcdGlmIG5ld192YWx1ZSAhPSBwcmV2aW91c192YWx1ZVxuXHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gcHJldmlvdXNfdmFsdWVcblx0XHRcdFx0XHRkYl9uZXdfdmFsdWUgPSBuZXdfdmFsdWVcblxuXHRcdGlmIChkYl9uZXdfdmFsdWUgIT0gbnVsbCAmJiBkYl9uZXdfdmFsdWUgIT0gdW5kZWZpbmVkKSB8fCAoZGJfcHJldmlvdXNfdmFsdWUgIT0gbnVsbCAmJiBkYl9wcmV2aW91c192YWx1ZSAhPSB1bmRlZmluZWQpXG5cdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiYXVkaXRfcmVjb3Jkc1wiKVxuXHRcdFx0ZG9jID0ge1xuXHRcdFx0XHRfaWQ6IGNvbGxlY3Rpb24uX21ha2VOZXdJRCgpXG5cdFx0XHRcdHNwYWNlOiBzcGFjZV9pZFxuXHRcdFx0XHRmaWVsZF9uYW1lOiBmaWVsZC5sYWJlbCB8fCBmaWVsZC5uYW1lXG5cdFx0XHRcdHByZXZpb3VzX3ZhbHVlOiBkYl9wcmV2aW91c192YWx1ZVxuXHRcdFx0XHRuZXdfdmFsdWU6IGRiX25ld192YWx1ZVxuXHRcdFx0XHRyZWxhdGVkX3RvOiB7XG5cdFx0XHRcdFx0bzogb2JqZWN0X25hbWVcblx0XHRcdFx0XHRpZHM6IFtyZWNvcmRfaWRdXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGNvbGxlY3Rpb24uaW5zZXJ0IGRvY1xuXG5cdF8uZWFjaCBtb2RpZmllclVuc2V0LCAodiwgayktPlxuXHRcdGZpZWxkID0gZmllbGRzP1trXVxuXHRcdHByZXZpb3VzX3ZhbHVlID0gcHJldmlvdXNfZG9jW2tdXG5cdFx0aWYgcHJldmlvdXNfdmFsdWUgfHwgXy5pc0Jvb2xlYW4ocHJldmlvdXNfdmFsdWUpXG5cdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiYXVkaXRfcmVjb3Jkc1wiKVxuXHRcdFx0ZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucylcblx0XHRcdGRvYyA9IHtcblx0XHRcdFx0X2lkOiBjb2xsZWN0aW9uLl9tYWtlTmV3SUQoKVxuXHRcdFx0XHRzcGFjZTogc3BhY2VfaWRcblx0XHRcdFx0ZmllbGRfbmFtZTogZmllbGQubGFiZWwgfHwgZmllbGQubmFtZVxuXHRcdFx0XHRwcmV2aW91c192YWx1ZTogZGJfcHJldmlvdXNfdmFsdWVcblx0XHRcdFx0cmVsYXRlZF90bzoge1xuXHRcdFx0XHRcdG86IG9iamVjdF9uYW1lXG5cdFx0XHRcdFx0aWRzOiBbcmVjb3JkX2lkXVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRjb2xsZWN0aW9uLmluc2VydCBkb2NcblxuQ3JlYXRvci5BdWRpdFJlY29yZHMuYWRkID0gKGFjdGlvbiwgdXNlcklkLCBvYmplY3RfbmFtZSwgbmV3X2RvYywgcHJldmlvdXNfZG9jLCBtb2RpZmllciktPlxuXHRpZiBhY3Rpb24gPT0gJ3VwZGF0ZSdcblx0XHR1cGRhdGVSZWNvcmQodXNlcklkLCBvYmplY3RfbmFtZSwgbmV3X2RvYywgcHJldmlvdXNfZG9jLCBtb2RpZmllcilcblx0ZWxzZSBpZiBhY3Rpb24gPT0gJ2luc2VydCdcblx0XHRpbnNlcnRSZWNvcmQodXNlcklkLCBvYmplY3RfbmFtZSwgbmV3X2RvYylcbiIsInZhciBjbG9uZSwgZ2V0TG9va3VwRmllbGRNb2RpZmllciwgZ2V0TG9va3VwRmllbGRWYWx1ZSwgaW5zZXJ0UmVjb3JkLCB0cmFuc2Zvcm1GaWVsZFZhbHVlLCB1cGRhdGVSZWNvcmQ7XG5cbmNsb25lID0gcmVxdWlyZShcImNsb25lXCIpO1xuXG5DcmVhdG9yLkF1ZGl0UmVjb3JkcyA9IHt9O1xuXG5nZXRMb29rdXBGaWVsZFZhbHVlID0gZnVuY3Rpb24ocmVmZXJlbmNlX3RvLCB2YWx1ZSwgc3BhY2VfaWQpIHtcbiAgdmFyIG5hbWVfZmllbGRfa2V5LCBvYmosIHByZXZpb3VzX2lkcywgcmVmZXJlbmNlX3RvX29iamVjdCwgdmFsdWVzO1xuICBpZiAoXy5pc0FycmF5KHJlZmVyZW5jZV90bykgJiYgXy5pc09iamVjdCh2YWx1ZSkpIHtcbiAgICByZWZlcmVuY2VfdG8gPSB2YWx1ZS5vO1xuICAgIHByZXZpb3VzX2lkcyA9IHZhbHVlLmlkcztcbiAgfVxuICBpZiAoIV8uaXNBcnJheShwcmV2aW91c19pZHMpKSB7XG4gICAgcHJldmlvdXNfaWRzID0gdmFsdWUgPyBbdmFsdWVdIDogW107XG4gIH1cbiAgcmVmZXJlbmNlX3RvX29iamVjdCA9IENyZWF0b3IuZ2V0T2JqZWN0KHJlZmVyZW5jZV90bywgc3BhY2VfaWQpO1xuICBuYW1lX2ZpZWxkX2tleSA9IHJlZmVyZW5jZV90b19vYmplY3QuTkFNRV9GSUVMRF9LRVk7XG4gIHZhbHVlcyA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihyZWZlcmVuY2VfdG8sIHNwYWNlX2lkKS5maW5kKHtcbiAgICBfaWQ6IHtcbiAgICAgICRpbjogcHJldmlvdXNfaWRzXG4gICAgfVxuICB9LCB7XG4gICAgZmllbGRzOiAoXG4gICAgICBvYmogPSB7XG4gICAgICAgIF9pZDogMVxuICAgICAgfSxcbiAgICAgIG9ialtcIlwiICsgbmFtZV9maWVsZF9rZXldID0gMSxcbiAgICAgIG9ialxuICAgIClcbiAgfSkuZmV0Y2goKTtcbiAgdmFsdWVzID0gQ3JlYXRvci5nZXRPcmRlcmx5U2V0QnlJZHModmFsdWVzLCBwcmV2aW91c19pZHMpO1xuICByZXR1cm4gKF8ucGx1Y2sodmFsdWVzLCBuYW1lX2ZpZWxkX2tleSkpLmpvaW4oJywnKTtcbn07XG5cbmdldExvb2t1cEZpZWxkTW9kaWZpZXIgPSBmdW5jdGlvbihmaWVsZCwgdmFsdWUsIHNwYWNlX2lkKSB7XG4gIHZhciByZWZlcmVuY2VfdG87XG4gIHJlZmVyZW5jZV90byA9IGZpZWxkLnJlZmVyZW5jZV90bztcbiAgaWYgKF8uaXNGdW5jdGlvbihyZWZlcmVuY2VfdG8pKSB7XG4gICAgcmVmZXJlbmNlX3RvID0gcmVmZXJlbmNlX3RvKCk7XG4gIH1cbiAgaWYgKF8uaXNGdW5jdGlvbihmaWVsZC5vcHRpb25zRnVuY3Rpb24pKSB7XG4gICAgaWYgKF8uaXNTdHJpbmcocmVmZXJlbmNlX3RvKSkge1xuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBnZXRMb29rdXBGaWVsZFZhbHVlKHJlZmVyZW5jZV90bywgdmFsdWUsIHNwYWNlX2lkKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZ2V0TG9va3VwRmllbGRWYWx1ZShyZWZlcmVuY2VfdG8sIHZhbHVlLCBzcGFjZV9pZCk7XG4gIH1cbn07XG5cblxuLypcbuWtl+auteWAvOi9rOaNouinhOWImTpcbjEg5pel5pyfIOagvOW8j+WtmOWCqOS4uiAoU3RyaW5nKTogMjAxOC0wMS0wMlxuMiDml7bpl7Qg5qC85byP5a2Y5YKo5Li6IChTdHJpbmcpOiAyMDE4LTAxLTAyIDIzOjEyXG4yIGxvb2t1cCDlkozkuIvmi4nmoYbvvIzpg73mmK/lr7nlupTnmoTmmL7npLrlkI3np7AgKG5hbWUgfCBsYWJlbClcbjMgYm9vbGVhbiDlsLHlrZjmmK8v5ZCmXG40IOWkmuihjOaWh+acrFxcZ3JpZFxcbG9va3Vw5pyJb3B0aW9uc0Z1bmN0aW9u5bm25LiU5rKh5pyJcmVmZXJlbmNlX3Rv5pe2IOS4jeiusOW9leaWsOaXp+WAvCwg5Y+q6K6w5b2V5L+u5pS55pe26Ze0LCDkv67mlLnkurosIOS/ruaUueeahOWtl+auteaYvuekuuWQjVxuICovXG5cbnRyYW5zZm9ybUZpZWxkVmFsdWUgPSBmdW5jdGlvbihmaWVsZCwgdmFsdWUsIG9wdGlvbnMpIHtcbiAgdmFyIHNlbGVjdGVkX3ZhbHVlLCBzcGFjZV9pZCwgdXRjT2Zmc2V0O1xuICBpZiAoXy5pc051bGwodmFsdWUpIHx8IF8uaXNVbmRlZmluZWQodmFsdWUpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHV0Y09mZnNldCA9IG9wdGlvbnMudXRjT2Zmc2V0O1xuICBzcGFjZV9pZCA9IG9wdGlvbnMuc3BhY2VfaWQ7XG4gIHN3aXRjaCAoZmllbGQudHlwZSkge1xuICAgIGNhc2UgJ2RhdGUnOlxuICAgICAgcmV0dXJuIG1vbWVudC51dGModmFsdWUpLmZvcm1hdCgnWVlZWS1NTS1ERCcpO1xuICAgIGNhc2UgJ2RhdGV0aW1lJzpcbiAgICAgIHJldHVybiBtb21lbnQodmFsdWUpLnV0Y09mZnNldCh1dGNPZmZzZXQpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbScpO1xuICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgaWYgKF8uaXNCb29sZWFuKHZhbHVlKSkge1xuICAgICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgICByZXR1cm4gJ+aYryc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuICflkKYnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlICdzZWxlY3QnOlxuICAgICAgaWYgKF8uaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gW3ZhbHVlXTtcbiAgICAgIH1cbiAgICAgIHNlbGVjdGVkX3ZhbHVlID0gXy5tYXAoZmllbGQub3B0aW9ucywgZnVuY3Rpb24ob3B0aW9uKSB7XG4gICAgICAgIGlmIChfLmNvbnRhaW5zKHZhbHVlLCBvcHRpb24udmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIG9wdGlvbi5sYWJlbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gXy5jb21wYWN0KHNlbGVjdGVkX3ZhbHVlKS5qb2luKCcsJyk7XG4gICAgY2FzZSAnY2hlY2tib3gnOlxuICAgICAgaWYgKF8uaXNTdHJpbmcodmFsdWUpKSB7XG4gICAgICAgIHZhbHVlID0gW3ZhbHVlXTtcbiAgICAgIH1cbiAgICAgIHNlbGVjdGVkX3ZhbHVlID0gXy5tYXAoZmllbGQub3B0aW9ucywgZnVuY3Rpb24ob3B0aW9uKSB7XG4gICAgICAgIGlmIChfLmNvbnRhaW5zKHZhbHVlLCBvcHRpb24udmFsdWUpKSB7XG4gICAgICAgICAgcmV0dXJuIG9wdGlvbi5sYWJlbDtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gXy5jb21wYWN0KHNlbGVjdGVkX3ZhbHVlKS5qb2luKCcsJyk7XG4gICAgY2FzZSAnbG9va3VwJzpcbiAgICAgIHJldHVybiBnZXRMb29rdXBGaWVsZE1vZGlmaWVyKGZpZWxkLCB2YWx1ZSwgc3BhY2VfaWQpO1xuICAgIGNhc2UgJ21hc3Rlcl9kZXRhaWwnOlxuICAgICAgcmV0dXJuIGdldExvb2t1cEZpZWxkTW9kaWZpZXIoZmllbGQsIHZhbHVlLCBzcGFjZV9pZCk7XG4gICAgY2FzZSAndGV4dGFyZWEnOlxuICAgICAgcmV0dXJuICcnO1xuICAgIGNhc2UgJ2NvZGUnOlxuICAgICAgcmV0dXJuICcnO1xuICAgIGNhc2UgJ2h0bWwnOlxuICAgICAgcmV0dXJuICcnO1xuICAgIGNhc2UgJ21hcmtkb3duJzpcbiAgICAgIHJldHVybiAnJztcbiAgICBjYXNlICdncmlkJzpcbiAgICAgIHJldHVybiAnJztcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHZhbHVlO1xuICB9XG59O1xuXG5pbnNlcnRSZWNvcmQgPSBmdW5jdGlvbih1c2VySWQsIG9iamVjdF9uYW1lLCBuZXdfZG9jKSB7XG4gIHZhciBjb2xsZWN0aW9uLCBkb2MsIHJlY29yZF9pZCwgc3BhY2VfaWQ7XG4gIGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJhdWRpdF9yZWNvcmRzXCIpO1xuICBzcGFjZV9pZCA9IG5ld19kb2Muc3BhY2U7XG4gIHJlY29yZF9pZCA9IG5ld19kb2MuX2lkO1xuICBkb2MgPSB7XG4gICAgX2lkOiBjb2xsZWN0aW9uLl9tYWtlTmV3SUQoKSxcbiAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgZmllbGRfbmFtZTogXCLlt7LliJvlu7rjgIJcIixcbiAgICByZWxhdGVkX3RvOiB7XG4gICAgICBvOiBvYmplY3RfbmFtZSxcbiAgICAgIGlkczogW3JlY29yZF9pZF1cbiAgICB9XG4gIH07XG4gIHJldHVybiBjb2xsZWN0aW9uLmluc2VydChkb2MpO1xufTtcblxudXBkYXRlUmVjb3JkID0gZnVuY3Rpb24odXNlcklkLCBvYmplY3RfbmFtZSwgbmV3X2RvYywgcHJldmlvdXNfZG9jLCBtb2RpZmllcikge1xuICB2YXIgZmllbGRzLCBtb2RpZmllclNldCwgbW9kaWZpZXJVbnNldCwgb3B0aW9ucywgcmVjb3JkX2lkLCByZWYsIHNwYWNlX2lkLCB1dGNPZmZzZXQ7XG4gIHNwYWNlX2lkID0gbmV3X2RvYy5zcGFjZTtcbiAgcmVjb3JkX2lkID0gbmV3X2RvYy5faWQ7XG4gIGZpZWxkcyA9IChyZWYgPSBDcmVhdG9yLmNvbnZlcnRPYmplY3QoY2xvbmUoQ3JlYXRvci5nZXRPYmplY3Qob2JqZWN0X25hbWUsIHNwYWNlX2lkKSksIHNwYWNlX2lkKSkgIT0gbnVsbCA/IHJlZi5maWVsZHMgOiB2b2lkIDA7XG4gIG1vZGlmaWVyU2V0ID0gbW9kaWZpZXIuJHNldDtcbiAgbW9kaWZpZXJVbnNldCA9IG1vZGlmaWVyLiR1bnNldDtcblxuICAvKiBUT0RPIHV0Y09mZnNldCDlupTor6XmnaXoh6rmlbDmja7lupMs5b6FICM5ODQg5aSE55CG5ZCOIOiwg+aVtFxuICBcbiAgICAgdXRjT2Zmc2V0ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwidXNlcnNcIikuZmluZE9uZSh7X2lkOiB1c2VySWR9KT8udXRjT2Zmc2V0XG4gIFxuICBcdGlmICFfLmlzTnVtYmVyKHV0Y09mZnNldClcbiAgXHRcdHV0Y09mZnNldCA9IDhcbiAgICovXG4gIHV0Y09mZnNldCA9IDg7XG4gIG9wdGlvbnMgPSB7XG4gICAgdXRjT2Zmc2V0OiB1dGNPZmZzZXQsXG4gICAgc3BhY2VfaWQ6IHNwYWNlX2lkXG4gIH07XG4gIF8uZWFjaChtb2RpZmllclNldCwgZnVuY3Rpb24odiwgaykge1xuICAgIHZhciBjb2xsZWN0aW9uLCBkYl9uZXdfdmFsdWUsIGRiX3ByZXZpb3VzX3ZhbHVlLCBkb2MsIGZpZWxkLCBuZXdfdmFsdWUsIHByZXZpb3VzX3ZhbHVlO1xuICAgIGZpZWxkID0gZmllbGRzICE9IG51bGwgPyBmaWVsZHNba10gOiB2b2lkIDA7XG4gICAgcHJldmlvdXNfdmFsdWUgPSBwcmV2aW91c19kb2Nba107XG4gICAgbmV3X3ZhbHVlID0gdjtcbiAgICBkYl9wcmV2aW91c192YWx1ZSA9IG51bGw7XG4gICAgZGJfbmV3X3ZhbHVlID0gbnVsbDtcbiAgICBzd2l0Y2ggKGZpZWxkLnR5cGUpIHtcbiAgICAgIGNhc2UgJ2RhdGUnOlxuICAgICAgICBpZiAoKG5ld192YWx1ZSAhPSBudWxsID8gbmV3X3ZhbHVlLnRvU3RyaW5nKCkgOiB2b2lkIDApICE9PSAocHJldmlvdXNfdmFsdWUgIT0gbnVsbCA/IHByZXZpb3VzX3ZhbHVlLnRvU3RyaW5nKCkgOiB2b2lkIDApKSB7XG4gICAgICAgICAgaWYgKG5ld192YWx1ZSkge1xuICAgICAgICAgICAgZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKHByZXZpb3VzX3ZhbHVlKSB7XG4gICAgICAgICAgICBkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdkYXRldGltZSc6XG4gICAgICAgIGlmICgobmV3X3ZhbHVlICE9IG51bGwgPyBuZXdfdmFsdWUudG9TdHJpbmcoKSA6IHZvaWQgMCkgIT09IChwcmV2aW91c192YWx1ZSAhPSBudWxsID8gcHJldmlvdXNfdmFsdWUudG9TdHJpbmcoKSA6IHZvaWQgMCkpIHtcbiAgICAgICAgICBpZiAobmV3X3ZhbHVlKSB7XG4gICAgICAgICAgICBkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocHJldmlvdXNfdmFsdWUpIHtcbiAgICAgICAgICAgIGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3RleHRhcmVhJzpcbiAgICAgICAgaWYgKHByZXZpb3VzX3ZhbHVlICE9PSBuZXdfdmFsdWUpIHtcbiAgICAgICAgICBkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICBkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY29kZSc6XG4gICAgICAgIGlmIChwcmV2aW91c192YWx1ZSAhPT0gbmV3X3ZhbHVlKSB7XG4gICAgICAgICAgZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2h0bWwnOlxuICAgICAgICBpZiAocHJldmlvdXNfdmFsdWUgIT09IG5ld192YWx1ZSkge1xuICAgICAgICAgIGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICAgIGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtYXJrZG93bic6XG4gICAgICAgIGlmIChwcmV2aW91c192YWx1ZSAhPT0gbmV3X3ZhbHVlKSB7XG4gICAgICAgICAgZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2dyaWQnOlxuICAgICAgICBpZiAoSlNPTi5zdHJpbmdpZnkocHJldmlvdXNfdmFsdWUpICE9PSBKU09OLnN0cmluZ2lmeShuZXdfdmFsdWUpKSB7XG4gICAgICAgICAgZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2Jvb2xlYW4nOlxuICAgICAgICBpZiAocHJldmlvdXNfdmFsdWUgIT09IG5ld192YWx1ZSkge1xuICAgICAgICAgIGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICAgIGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdzZWxlY3QnOlxuICAgICAgICBpZiAoKHByZXZpb3VzX3ZhbHVlICE9IG51bGwgPyBwcmV2aW91c192YWx1ZS50b1N0cmluZygpIDogdm9pZCAwKSAhPT0gKG5ld192YWx1ZSAhPSBudWxsID8gbmV3X3ZhbHVlLnRvU3RyaW5nKCkgOiB2b2lkIDApKSB7XG4gICAgICAgICAgZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2NoZWNrYm94JzpcbiAgICAgICAgaWYgKChwcmV2aW91c192YWx1ZSAhPSBudWxsID8gcHJldmlvdXNfdmFsdWUudG9TdHJpbmcoKSA6IHZvaWQgMCkgIT09IChuZXdfdmFsdWUgIT0gbnVsbCA/IG5ld192YWx1ZS50b1N0cmluZygpIDogdm9pZCAwKSkge1xuICAgICAgICAgIGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICAgIGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdsb29rdXAnOlxuICAgICAgICBpZiAoSlNPTi5zdHJpbmdpZnkocHJldmlvdXNfdmFsdWUpICE9PSBKU09OLnN0cmluZ2lmeShuZXdfdmFsdWUpKSB7XG4gICAgICAgICAgaWYgKHByZXZpb3VzX3ZhbHVlKSB7XG4gICAgICAgICAgICBkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5ld192YWx1ZSkge1xuICAgICAgICAgICAgZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtYXN0ZXJfZGV0YWlsJzpcbiAgICAgICAgaWYgKEpTT04uc3RyaW5naWZ5KHByZXZpb3VzX3ZhbHVlKSAhPT0gSlNPTi5zdHJpbmdpZnkobmV3X3ZhbHVlKSkge1xuICAgICAgICAgIGlmIChwcmV2aW91c192YWx1ZSkge1xuICAgICAgICAgICAgZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChuZXdfdmFsdWUpIHtcbiAgICAgICAgICAgIGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgaWYgKG5ld192YWx1ZSAhPT0gcHJldmlvdXNfdmFsdWUpIHtcbiAgICAgICAgICBkYl9wcmV2aW91c192YWx1ZSA9IHByZXZpb3VzX3ZhbHVlO1xuICAgICAgICAgIGRiX25ld192YWx1ZSA9IG5ld192YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoKGRiX25ld192YWx1ZSAhPT0gbnVsbCAmJiBkYl9uZXdfdmFsdWUgIT09IHZvaWQgMCkgfHwgKGRiX3ByZXZpb3VzX3ZhbHVlICE9PSBudWxsICYmIGRiX3ByZXZpb3VzX3ZhbHVlICE9PSB2b2lkIDApKSB7XG4gICAgICBjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiYXVkaXRfcmVjb3Jkc1wiKTtcbiAgICAgIGRvYyA9IHtcbiAgICAgICAgX2lkOiBjb2xsZWN0aW9uLl9tYWtlTmV3SUQoKSxcbiAgICAgICAgc3BhY2U6IHNwYWNlX2lkLFxuICAgICAgICBmaWVsZF9uYW1lOiBmaWVsZC5sYWJlbCB8fCBmaWVsZC5uYW1lLFxuICAgICAgICBwcmV2aW91c192YWx1ZTogZGJfcHJldmlvdXNfdmFsdWUsXG4gICAgICAgIG5ld192YWx1ZTogZGJfbmV3X3ZhbHVlLFxuICAgICAgICByZWxhdGVkX3RvOiB7XG4gICAgICAgICAgbzogb2JqZWN0X25hbWUsXG4gICAgICAgICAgaWRzOiBbcmVjb3JkX2lkXVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb24uaW5zZXJ0KGRvYyk7XG4gICAgfVxuICB9KTtcbiAgcmV0dXJuIF8uZWFjaChtb2RpZmllclVuc2V0LCBmdW5jdGlvbih2LCBrKSB7XG4gICAgdmFyIGNvbGxlY3Rpb24sIGRiX3ByZXZpb3VzX3ZhbHVlLCBkb2MsIGZpZWxkLCBwcmV2aW91c192YWx1ZTtcbiAgICBmaWVsZCA9IGZpZWxkcyAhPSBudWxsID8gZmllbGRzW2tdIDogdm9pZCAwO1xuICAgIHByZXZpb3VzX3ZhbHVlID0gcHJldmlvdXNfZG9jW2tdO1xuICAgIGlmIChwcmV2aW91c192YWx1ZSB8fCBfLmlzQm9vbGVhbihwcmV2aW91c192YWx1ZSkpIHtcbiAgICAgIGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJhdWRpdF9yZWNvcmRzXCIpO1xuICAgICAgZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICBkb2MgPSB7XG4gICAgICAgIF9pZDogY29sbGVjdGlvbi5fbWFrZU5ld0lEKCksXG4gICAgICAgIHNwYWNlOiBzcGFjZV9pZCxcbiAgICAgICAgZmllbGRfbmFtZTogZmllbGQubGFiZWwgfHwgZmllbGQubmFtZSxcbiAgICAgICAgcHJldmlvdXNfdmFsdWU6IGRiX3ByZXZpb3VzX3ZhbHVlLFxuICAgICAgICByZWxhdGVkX3RvOiB7XG4gICAgICAgICAgbzogb2JqZWN0X25hbWUsXG4gICAgICAgICAgaWRzOiBbcmVjb3JkX2lkXVxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb24uaW5zZXJ0KGRvYyk7XG4gICAgfVxuICB9KTtcbn07XG5cbkNyZWF0b3IuQXVkaXRSZWNvcmRzLmFkZCA9IGZ1bmN0aW9uKGFjdGlvbiwgdXNlcklkLCBvYmplY3RfbmFtZSwgbmV3X2RvYywgcHJldmlvdXNfZG9jLCBtb2RpZmllcikge1xuICBpZiAoYWN0aW9uID09PSAndXBkYXRlJykge1xuICAgIHJldHVybiB1cGRhdGVSZWNvcmQodXNlcklkLCBvYmplY3RfbmFtZSwgbmV3X2RvYywgcHJldmlvdXNfZG9jLCBtb2RpZmllcik7XG4gIH0gZWxzZSBpZiAoYWN0aW9uID09PSAnaW5zZXJ0Jykge1xuICAgIHJldHVybiBpbnNlcnRSZWNvcmQodXNlcklkLCBvYmplY3RfbmFtZSwgbmV3X2RvYyk7XG4gIH1cbn07XG4iLCJDcmVhdG9yLk9iamVjdHMuYXVkaXRfcmVjb3JkcyA9XG5cdG5hbWU6IFwiYXVkaXRfcmVjb3Jkc1wiXG5cdGxhYmVsOiBcIuWtl+auteWOhuWPslwiXG5cdGljb246IFwicmVjb3JkXCJcblx0ZmllbGRzOlxuXHRcdHJlbGF0ZWRfdG86XG5cdFx0XHRsYWJlbDogXCLnm7jlhbPpoblcIlxuXHRcdFx0dHlwZTogXCJsb29rdXBcIlxuXHRcdFx0aW5kZXg6IHRydWVcblx0XHRcdHJlZmVyZW5jZV90bzogKCktPlxuXHRcdFx0XHRvID0gW11cblx0XHRcdFx0Xy5lYWNoIENyZWF0b3IuT2JqZWN0cywgKG9iamVjdCwgb2JqZWN0X25hbWUpLT5cblx0XHRcdFx0XHRpZiBvYmplY3QuZW5hYmxlX2F1ZGl0XG5cdFx0XHRcdFx0XHRvLnB1c2ggb2JqZWN0Lm5hbWVcblx0XHRcdFx0cmV0dXJuIG9cblx0XHRcdGZpbHRlcmFibGU6dHJ1ZVxuXHRcdFx0aXNfbmFtZTogdHJ1ZVxuXHRcdGNyZWF0ZWQ6XG5cdFx0XHRsYWJlbDpcIuaXtumXtFwiXG5cdFx0XHRmaWx0ZXJhYmxlOnRydWVcblx0XHRmaWVsZF9uYW1lOlxuXHRcdFx0bGFiZWw6IFwi5a2X5q61XCJcblx0XHRcdHR5cGU6IFwidGV4dFwiXG5cdFx0XHRyZXF1aXJlZDogdHJ1ZVxuXHRcdFx0aXNfd2lkZTogdHJ1ZVxuXHRcdGNyZWF0ZWRfYnk6XG5cdFx0XHRsYWJlbDpcIueUqOaIt1wiXG5cdFx0cHJldmlvdXNfdmFsdWU6XG5cdFx0XHRsYWJlbDogXCLljp/lp4vlgLxcIlxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcblx0XHRuZXdfdmFsdWU6XG5cdFx0XHRsYWJlbDogXCLmlrDlgLxcIlxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcblxuXG5cdGxpc3Rfdmlld3M6XG5cdFx0YWxsOlxuXHRcdFx0bGFiZWw6IFwi5YWo6YOoXCJcblx0XHRcdGZpbHRlcl9zY29wZTogXCJzcGFjZVwiXG5cdFx0XHRjb2x1bW5zOiBbXCJyZWxhdGVkX3RvXCIsIFwiY3JlYXRlZFwiLCBcImZpZWxkX25hbWVcIiwgXCJjcmVhdGVkX2J5XCIsIFwicHJldmlvdXNfdmFsdWVcIiwgXCJuZXdfdmFsdWVcIl1cblx0XHRcdGZpbHRlcl9maWVsZHM6IFtcInJlbGF0ZWRfdG9cIl1cblx0XHRyZWNlbnQ6XG5cdFx0XHRsYWJlbDogXCLmnIDov5Hmn6XnnItcIlxuXHRcdFx0ZmlsdGVyX3Njb3BlOiBcInNwYWNlXCJcblxuXHRwZXJtaXNzaW9uX3NldDpcblx0XHR1c2VyOlxuXHRcdFx0YWxsb3dDcmVhdGU6IGZhbHNlXG5cdFx0XHRhbGxvd0RlbGV0ZTogZmFsc2Vcblx0XHRcdGFsbG93RWRpdDogZmFsc2Vcblx0XHRcdGFsbG93UmVhZDogdHJ1ZVxuXHRcdFx0bW9kaWZ5QWxsUmVjb3JkczogZmFsc2Vcblx0XHRcdHZpZXdBbGxSZWNvcmRzOiBmYWxzZVxuXHRcdGFkbWluOlxuXHRcdFx0YWxsb3dDcmVhdGU6IGZhbHNlXG5cdFx0XHRhbGxvd0RlbGV0ZTogZmFsc2Vcblx0XHRcdGFsbG93RWRpdDogZmFsc2Vcblx0XHRcdGFsbG93UmVhZDogdHJ1ZVxuXHRcdFx0bW9kaWZ5QWxsUmVjb3JkczogZmFsc2Vcblx0XHRcdHZpZXdBbGxSZWNvcmRzOiB0cnVlIiwiQ3JlYXRvci5PYmplY3RzLmF1ZGl0X3JlY29yZHMgPSB7XG4gIG5hbWU6IFwiYXVkaXRfcmVjb3Jkc1wiLFxuICBsYWJlbDogXCLlrZfmrrXljoblj7JcIixcbiAgaWNvbjogXCJyZWNvcmRcIixcbiAgZmllbGRzOiB7XG4gICAgcmVsYXRlZF90bzoge1xuICAgICAgbGFiZWw6IFwi55u45YWz6aG5XCIsXG4gICAgICB0eXBlOiBcImxvb2t1cFwiLFxuICAgICAgaW5kZXg6IHRydWUsXG4gICAgICByZWZlcmVuY2VfdG86IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbztcbiAgICAgICAgbyA9IFtdO1xuICAgICAgICBfLmVhY2goQ3JlYXRvci5PYmplY3RzLCBmdW5jdGlvbihvYmplY3QsIG9iamVjdF9uYW1lKSB7XG4gICAgICAgICAgaWYgKG9iamVjdC5lbmFibGVfYXVkaXQpIHtcbiAgICAgICAgICAgIHJldHVybiBvLnB1c2gob2JqZWN0Lm5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvO1xuICAgICAgfSxcbiAgICAgIGZpbHRlcmFibGU6IHRydWUsXG4gICAgICBpc19uYW1lOiB0cnVlXG4gICAgfSxcbiAgICBjcmVhdGVkOiB7XG4gICAgICBsYWJlbDogXCLml7bpl7RcIixcbiAgICAgIGZpbHRlcmFibGU6IHRydWVcbiAgICB9LFxuICAgIGZpZWxkX25hbWU6IHtcbiAgICAgIGxhYmVsOiBcIuWtl+autVwiLFxuICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgIGlzX3dpZGU6IHRydWVcbiAgICB9LFxuICAgIGNyZWF0ZWRfYnk6IHtcbiAgICAgIGxhYmVsOiBcIueUqOaIt1wiXG4gICAgfSxcbiAgICBwcmV2aW91c192YWx1ZToge1xuICAgICAgbGFiZWw6IFwi5Y6f5aeL5YC8XCIsXG4gICAgICB0eXBlOiBcInRleHRcIlxuICAgIH0sXG4gICAgbmV3X3ZhbHVlOiB7XG4gICAgICBsYWJlbDogXCLmlrDlgLxcIixcbiAgICAgIHR5cGU6IFwidGV4dFwiXG4gICAgfVxuICB9LFxuICBsaXN0X3ZpZXdzOiB7XG4gICAgYWxsOiB7XG4gICAgICBsYWJlbDogXCLlhajpg6hcIixcbiAgICAgIGZpbHRlcl9zY29wZTogXCJzcGFjZVwiLFxuICAgICAgY29sdW1uczogW1wicmVsYXRlZF90b1wiLCBcImNyZWF0ZWRcIiwgXCJmaWVsZF9uYW1lXCIsIFwiY3JlYXRlZF9ieVwiLCBcInByZXZpb3VzX3ZhbHVlXCIsIFwibmV3X3ZhbHVlXCJdLFxuICAgICAgZmlsdGVyX2ZpZWxkczogW1wicmVsYXRlZF90b1wiXVxuICAgIH0sXG4gICAgcmVjZW50OiB7XG4gICAgICBsYWJlbDogXCLmnIDov5Hmn6XnnItcIixcbiAgICAgIGZpbHRlcl9zY29wZTogXCJzcGFjZVwiXG4gICAgfVxuICB9LFxuICBwZXJtaXNzaW9uX3NldDoge1xuICAgIHVzZXI6IHtcbiAgICAgIGFsbG93Q3JlYXRlOiBmYWxzZSxcbiAgICAgIGFsbG93RGVsZXRlOiBmYWxzZSxcbiAgICAgIGFsbG93RWRpdDogZmFsc2UsXG4gICAgICBhbGxvd1JlYWQ6IHRydWUsXG4gICAgICBtb2RpZnlBbGxSZWNvcmRzOiBmYWxzZSxcbiAgICAgIHZpZXdBbGxSZWNvcmRzOiBmYWxzZVxuICAgIH0sXG4gICAgYWRtaW46IHtcbiAgICAgIGFsbG93Q3JlYXRlOiBmYWxzZSxcbiAgICAgIGFsbG93RGVsZXRlOiBmYWxzZSxcbiAgICAgIGFsbG93RWRpdDogZmFsc2UsXG4gICAgICBhbGxvd1JlYWQ6IHRydWUsXG4gICAgICBtb2RpZnlBbGxSZWNvcmRzOiBmYWxzZSxcbiAgICAgIHZpZXdBbGxSZWNvcmRzOiB0cnVlXG4gICAgfVxuICB9XG59O1xuIiwiQ3JlYXRvci5PYmplY3RzLmF1ZGl0X2xvZ2luID1cblx0bmFtZTogXCJhdWRpdF9sb2dpblwiXG5cdGxhYmVsOiBcIueZu+W9leaXpeW/l1wiXG5cdGljb246IFwicmVjb3JkXCJcblx0ZmllbGRzOlxuXHRcdHVzZXJuYW1lOlxuXHRcdFx0bGFiZWw6IFwi55So5oi35ZCNXCJcblx0XHRcdHR5cGU6IFwidGV4dFwiXG5cdFx0XHRpc19uYW1lOiB0cnVlXG5cblx0XHRsb2dpbl90aW1lOlxuXHRcdFx0bGFiZWw6XCLnmbvlvZXml7bpl7RcIlxuXHRcdFx0dHlwZTogXCJkYXRldGltZVwiXG5cblx0XHRzb3VyY2VfaXA6XG5cdFx0XHRsYWJlbDogXCJJUOWcsOWdgFwiXG5cdFx0XHR0eXBlOiBcInRleHRcIlxuXG5cdFx0bG9jYXRpb246XG5cdFx0XHRsYWJlbDpcIuS9jee9rlwiXG5cdFx0XHR0eXBlOiBcInRleHRcIlxuXG5cdFx0bG9naW5fdHlwZTpcblx0XHRcdGxhYmVsOiBcIueZu+W9leaWueW8j1wiXG5cdFx0XHR0eXBlOiBcInRleHRcIlxuXG5cdFx0c3RhdHVzOlxuXHRcdFx0bGFiZWw6IFwi54q25oCBXCJcblx0XHRcdHR5cGU6IFwidGV4dFwiXG5cblx0XHRicm93c2VyOlxuXHRcdFx0bGFiZWw6IFwi5rWP6KeI5ZmoXCJcblx0XHRcdHR5cGU6IFwidGV4dFwiXG5cblx0XHRwbGF0Zm9ybTpcblx0XHRcdGxhYmVsOiBcIuezu+e7n1wiXG5cdFx0XHR0eXBlOiBcInRleHRcIlxuXG5cdFx0YXBwbGljYXRpb246XG5cdFx0XHRsYWJlbDogXCLlupTnlKhcIlxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcblxuXHRcdGNsaWVudF92ZXJzaW9uOlxuXHRcdFx0bGFiZWw6IFwi5a6i5oi356uv54mI5pysXCJcblx0XHRcdHR5cGU6IFwidGV4dFwiXG5cblx0XHRhcGlfdHlwZTpcblx0XHRcdGxhYmVsOiBcImFwaeexu+Wei1wiXG5cdFx0XHR0eXBlOiBcInRleHRcIlxuXG5cdFx0YXBpX3ZlcnNpb246XG5cdFx0XHRsYWJlbDogXCJhcGnniYjmnKxcIlxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcblxuXHRcdGxvZ2luX3VybDpcblx0XHRcdGxhYmVsOiBcIueZu+W9lVVSTFwiXG5cdFx0XHR0eXBlOiBcInRleHRcIlxuXG5cdGxpc3Rfdmlld3M6XG5cdFx0YWxsOlxuXHRcdFx0bGFiZWw6IFwi5YWo6YOoXCJcblx0XHRcdGZpbHRlcl9zY29wZTogXCJzcGFjZVwiXG5cdFx0XHRjb2x1bW5zOiBbXCJ1c2VybmFtZVwiLCBcImxvZ2luX3RpbWVcIiwgXCJzb3VyY2VfaXBcIiwgXCJsb2NhdGlvblwiLCBcImxvZ2luX3R5cGVcIiwgXCJzdGF0dXNcIiwgXCJicm93c2VyXCIsIFwicGxhdGZvcm1cIiwgXCJhcHBsaWNhdGlvblwiLCBcImNsaWVudF92ZXJzaW9uXCIsIFwiYXBpX3R5cGVcIiwgXCJhcGlfdmVyc2lvblwiLCBcImxvZ2luX3VybFwiXVxuXHRcdHJlY2VudDpcblx0XHRcdGxhYmVsOiBcIuacgOi/keafpeeci1wiXG5cdFx0XHRmaWx0ZXJfc2NvcGU6IFwic3BhY2VcIlxuXG5cdHBlcm1pc3Npb25fc2V0OlxuXHRcdHVzZXI6XG5cdFx0XHRhbGxvd0NyZWF0ZTogZmFsc2Vcblx0XHRcdGFsbG93RGVsZXRlOiBmYWxzZVxuXHRcdFx0YWxsb3dFZGl0OiBmYWxzZVxuXHRcdFx0YWxsb3dSZWFkOiB0cnVlXG5cdFx0XHRtb2RpZnlBbGxSZWNvcmRzOiBmYWxzZVxuXHRcdFx0dmlld0FsbFJlY29yZHM6IGZhbHNlXG5cdFx0YWRtaW46XG5cdFx0XHRhbGxvd0NyZWF0ZTogZmFsc2Vcblx0XHRcdGFsbG93RGVsZXRlOiBmYWxzZVxuXHRcdFx0YWxsb3dFZGl0OiBmYWxzZVxuXHRcdFx0YWxsb3dSZWFkOiB0cnVlXG5cdFx0XHRtb2RpZnlBbGxSZWNvcmRzOiBmYWxzZVxuXHRcdFx0dmlld0FsbFJlY29yZHM6IHRydWUiXX0=
