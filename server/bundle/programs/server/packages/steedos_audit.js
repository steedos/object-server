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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdWRpdC9saWIvYXVkaXRfcmVjb3Jkcy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL2xpYi9hdWRpdF9yZWNvcmRzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdWRpdC9tb2RlbHMvYXVkaXRfcmVjb3Jkcy5jb2ZmZWUiLCJtZXRlb3I6Ly/wn5K7YXBwL21vZGVscy9hdWRpdF9yZWNvcmRzLmNvZmZlZSIsIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvc3RlZWRvc19hdWRpdC9tb2RlbHMvYXVkaXRfbG9naW4uY29mZmVlIl0sIm5hbWVzIjpbImNsb25lIiwiZ2V0TG9va3VwRmllbGRNb2RpZmllciIsImdldExvb2t1cEZpZWxkVmFsdWUiLCJpbnNlcnRSZWNvcmQiLCJ0cmFuc2Zvcm1GaWVsZFZhbHVlIiwidXBkYXRlUmVjb3JkIiwicmVxdWlyZSIsIkNyZWF0b3IiLCJBdWRpdFJlY29yZHMiLCJyZWZlcmVuY2VfdG8iLCJ2YWx1ZSIsInNwYWNlX2lkIiwibmFtZV9maWVsZF9rZXkiLCJvYmoiLCJwcmV2aW91c19pZHMiLCJyZWZlcmVuY2VfdG9fb2JqZWN0IiwidmFsdWVzIiwiXyIsImlzQXJyYXkiLCJpc09iamVjdCIsIm8iLCJpZHMiLCJnZXRPYmplY3QiLCJOQU1FX0ZJRUxEX0tFWSIsImdldENvbGxlY3Rpb24iLCJmaW5kIiwiX2lkIiwiJGluIiwiZmllbGRzIiwiZmV0Y2giLCJnZXRPcmRlcmx5U2V0QnlJZHMiLCJwbHVjayIsImpvaW4iLCJmaWVsZCIsImlzRnVuY3Rpb24iLCJvcHRpb25zRnVuY3Rpb24iLCJpc1N0cmluZyIsIm9wdGlvbnMiLCJzZWxlY3RlZF92YWx1ZSIsInV0Y09mZnNldCIsImlzTnVsbCIsImlzVW5kZWZpbmVkIiwidHlwZSIsIm1vbWVudCIsInV0YyIsImZvcm1hdCIsImlzQm9vbGVhbiIsIm1hcCIsIm9wdGlvbiIsImNvbnRhaW5zIiwibGFiZWwiLCJjb21wYWN0IiwidXNlcklkIiwib2JqZWN0X25hbWUiLCJuZXdfZG9jIiwiY29sbGVjdGlvbiIsImRvYyIsInJlY29yZF9pZCIsInNwYWNlIiwiX21ha2VOZXdJRCIsImZpZWxkX25hbWUiLCJyZWxhdGVkX3RvIiwiaW5zZXJ0IiwicHJldmlvdXNfZG9jIiwibW9kaWZpZXIiLCJtb2RpZmllclNldCIsIm1vZGlmaWVyVW5zZXQiLCJyZWYiLCJjb252ZXJ0T2JqZWN0IiwiJHNldCIsIiR1bnNldCIsImVhY2giLCJ2IiwiayIsImRiX25ld192YWx1ZSIsImRiX3ByZXZpb3VzX3ZhbHVlIiwibmV3X3ZhbHVlIiwicHJldmlvdXNfdmFsdWUiLCJ0b1N0cmluZyIsIkpTT04iLCJzdHJpbmdpZnkiLCJuYW1lIiwiYWRkIiwiYWN0aW9uIiwiT2JqZWN0cyIsImF1ZGl0X3JlY29yZHMiLCJpY29uIiwiaW5kZXgiLCJvYmplY3QiLCJlbmFibGVfYXVkaXQiLCJwdXNoIiwiZmlsdGVyYWJsZSIsImlzX25hbWUiLCJjcmVhdGVkIiwicmVxdWlyZWQiLCJpc193aWRlIiwiY3JlYXRlZF9ieSIsImxpc3Rfdmlld3MiLCJhbGwiLCJmaWx0ZXJfc2NvcGUiLCJjb2x1bW5zIiwiZmlsdGVyX2ZpZWxkcyIsInJlY2VudCIsInBlcm1pc3Npb25fc2V0IiwidXNlciIsImFsbG93Q3JlYXRlIiwiYWxsb3dEZWxldGUiLCJhbGxvd0VkaXQiLCJhbGxvd1JlYWQiLCJtb2RpZnlBbGxSZWNvcmRzIiwidmlld0FsbFJlY29yZHMiLCJhZG1pbiIsImF1ZGl0X2xvZ2luIiwidXNlcm5hbWUiLCJsb2dpbl90aW1lIiwic291cmNlX2lwIiwibG9jYXRpb24iLCJsb2dpbl90eXBlIiwic3RhdHVzIiwiYnJvd3NlciIsInBsYXRmb3JtIiwiYXBwbGljYXRpb24iLCJjbGllbnRfdmVyc2lvbiIsImFwaV90eXBlIiwiYXBpX3ZlcnNpb24iLCJsb2dpbl91cmwiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7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RGI7QUFFQUMsaUJBQVcsS0FGWDtBQUdBQyxpQkFBVyxJQUhYO0FBSUFDLHdCQUFrQixLQUpsQjtBQUtBQyxzQkFBZ0I7QUFMaEIsS0FERDtBQU9BQyxXQUNDO0FBQUFOLG1CQUFhLEtBQWI7QUFDQUMsbUJBQWEsS0FEYjtBQUVBQyxpQkFBVyxLQUZYO0FBR0FDLGlCQUFXLElBSFg7QUFJQUMsd0JBQWtCLEtBSmxCO0FBS0FDLHNCQUFnQjtBQUxoQjtBQVJEO0FBbkVELENBREQsQyIsImZpbGUiOiIvcGFja2FnZXMvc3RlZWRvc19hdWRpdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImNsb25lID0gcmVxdWlyZShcImNsb25lXCIpO1xyXG5DcmVhdG9yLkF1ZGl0UmVjb3JkcyA9IHt9XHJcblxyXG5nZXRMb29rdXBGaWVsZFZhbHVlID0gKHJlZmVyZW5jZV90bywgdmFsdWUsIHNwYWNlX2lkKS0+XHJcblx0aWYgXy5pc0FycmF5KHJlZmVyZW5jZV90bykgJiYgXy5pc09iamVjdCh2YWx1ZSlcclxuXHRcdHJlZmVyZW5jZV90byA9IHZhbHVlLm9cclxuXHRcdHByZXZpb3VzX2lkcyA9IHZhbHVlLmlkc1xyXG5cdGlmICFfLmlzQXJyYXkocHJldmlvdXNfaWRzKVxyXG5cdFx0cHJldmlvdXNfaWRzID0gaWYgdmFsdWUgdGhlbiBbdmFsdWVdIGVsc2UgW11cclxuXHRyZWZlcmVuY2VfdG9fb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3QocmVmZXJlbmNlX3RvLCBzcGFjZV9pZClcclxuXHRuYW1lX2ZpZWxkX2tleSA9IHJlZmVyZW5jZV90b19vYmplY3QuTkFNRV9GSUVMRF9LRVlcclxuXHR2YWx1ZXMgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24ocmVmZXJlbmNlX3RvLCBzcGFjZV9pZCkuZmluZCh7X2lkOiB7JGluOiBwcmV2aW91c19pZHN9fSwge2ZpZWxkczoge19pZDoxLCBcIiN7bmFtZV9maWVsZF9rZXl9XCI6IDF9fSkuZmV0Y2goKVxyXG5cdHZhbHVlcyA9IENyZWF0b3IuZ2V0T3JkZXJseVNldEJ5SWRzKHZhbHVlcywgcHJldmlvdXNfaWRzKVxyXG5cdHJldHVybiAoXy5wbHVjayB2YWx1ZXMsIG5hbWVfZmllbGRfa2V5KS5qb2luKCcsJylcclxuXHJcbmdldExvb2t1cEZpZWxkTW9kaWZpZXIgPSAoZmllbGQsIHZhbHVlLCBzcGFjZV9pZCktPlxyXG5cdHJlZmVyZW5jZV90byA9IGZpZWxkLnJlZmVyZW5jZV90b1xyXG5cdGlmIF8uaXNGdW5jdGlvbihyZWZlcmVuY2VfdG8pXHJcblx0XHRyZWZlcmVuY2VfdG8gPSByZWZlcmVuY2VfdG8oKVxyXG5cdGlmIF8uaXNGdW5jdGlvbihmaWVsZC5vcHRpb25zRnVuY3Rpb24pXHJcblx0XHRpZiBfLmlzU3RyaW5nKHJlZmVyZW5jZV90bylcclxuXHRcdFx0aWYgdmFsdWVcclxuXHRcdFx0XHRyZXR1cm4gZ2V0TG9va3VwRmllbGRWYWx1ZShyZWZlcmVuY2VfdG8sIHZhbHVlLCBzcGFjZV9pZClcclxuXHRcdGVsc2VcclxuXHRcdFx0cmV0dXJuICcnXHJcblx0ZWxzZVxyXG5cdFx0cmV0dXJuIGdldExvb2t1cEZpZWxkVmFsdWUocmVmZXJlbmNlX3RvLCB2YWx1ZSwgc3BhY2VfaWQpXHJcblxyXG4jIyNcclxu5a2X5q615YC86L2s5o2i6KeE5YiZOlxyXG4xIOaXpeacnyDmoLzlvI/lrZjlgqjkuLogKFN0cmluZyk6IDIwMTgtMDEtMDJcclxuMiDml7bpl7Qg5qC85byP5a2Y5YKo5Li6IChTdHJpbmcpOiAyMDE4LTAxLTAyIDIzOjEyXHJcbjIgbG9va3VwIOWSjOS4i+aLieahhu+8jOmDveaYr+WvueW6lOeahOaYvuekuuWQjeensCAobmFtZSB8IGxhYmVsKVxyXG4zIGJvb2xlYW4g5bCx5a2Y5pivL+WQplxyXG40IOWkmuihjOaWh+acrFxcZ3JpZFxcbG9va3Vw5pyJb3B0aW9uc0Z1bmN0aW9u5bm25LiU5rKh5pyJcmVmZXJlbmNlX3Rv5pe2IOS4jeiusOW9leaWsOaXp+WAvCwg5Y+q6K6w5b2V5L+u5pS55pe26Ze0LCDkv67mlLnkurosIOS/ruaUueeahOWtl+auteaYvuekuuWQjVxyXG4jIyNcclxudHJhbnNmb3JtRmllbGRWYWx1ZSA9IChmaWVsZCwgdmFsdWUsIG9wdGlvbnMpLT5cclxuXHJcblx0aWYgXy5pc051bGwodmFsdWUpIHx8IF8uaXNVbmRlZmluZWQodmFsdWUpXHJcblx0XHRyZXR1cm5cclxuXHJcblx0dXRjT2Zmc2V0ID0gb3B0aW9ucy51dGNPZmZzZXRcclxuXHRzcGFjZV9pZCA9IG9wdGlvbnMuc3BhY2VfaWRcclxuXHJcblx0c3dpdGNoIGZpZWxkLnR5cGVcclxuXHRcdHdoZW4gJ2RhdGUnXHJcblx0XHRcdHJldHVybiBtb21lbnQudXRjKHZhbHVlKS5mb3JtYXQoJ1lZWVktTU0tREQnKVxyXG5cdFx0d2hlbiAnZGF0ZXRpbWUnXHJcblx0XHRcdHJldHVybiBtb21lbnQodmFsdWUpLnV0Y09mZnNldCh1dGNPZmZzZXQpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbScpXHJcblx0XHR3aGVuICdib29sZWFuJ1xyXG5cdFx0XHRpZiBfLmlzQm9vbGVhbih2YWx1ZSlcclxuXHRcdFx0XHRpZiB2YWx1ZVxyXG5cdFx0XHRcdFx0cmV0dXJuICfmmK8nXHJcblx0XHRcdFx0ZWxzZVxyXG5cdFx0XHRcdFx0cmV0dXJuICflkKYnXHJcblx0XHR3aGVuICdzZWxlY3QnXHJcblx0XHRcdGlmIF8uaXNTdHJpbmcodmFsdWUpXHJcblx0XHRcdFx0dmFsdWUgPSBbdmFsdWVdXHJcblx0XHRcdHNlbGVjdGVkX3ZhbHVlID0gXy5tYXAgZmllbGQub3B0aW9ucywgKG9wdGlvbiktPlxyXG5cdFx0XHRcdGlmIF8uY29udGFpbnModmFsdWUsIG9wdGlvbi52YWx1ZSlcclxuXHRcdFx0XHRcdHJldHVybiBvcHRpb24ubGFiZWxcclxuXHRcdFx0cmV0dXJuIF8uY29tcGFjdChzZWxlY3RlZF92YWx1ZSkuam9pbignLCcpXHJcblx0XHR3aGVuICdjaGVja2JveCdcclxuXHRcdFx0aWYgXy5pc1N0cmluZyh2YWx1ZSlcclxuXHRcdFx0XHR2YWx1ZSA9IFt2YWx1ZV1cclxuXHRcdFx0c2VsZWN0ZWRfdmFsdWUgPSBfLm1hcCBmaWVsZC5vcHRpb25zLCAob3B0aW9uKS0+XHJcblx0XHRcdFx0aWYgXy5jb250YWlucyh2YWx1ZSwgb3B0aW9uLnZhbHVlKVxyXG5cdFx0XHRcdFx0cmV0dXJuIG9wdGlvbi5sYWJlbFxyXG5cdFx0XHRyZXR1cm4gXy5jb21wYWN0KHNlbGVjdGVkX3ZhbHVlKS5qb2luKCcsJylcclxuXHRcdHdoZW4gJ2xvb2t1cCdcclxuXHRcdFx0cmV0dXJuIGdldExvb2t1cEZpZWxkTW9kaWZpZXIoZmllbGQsIHZhbHVlLCBzcGFjZV9pZClcclxuXHRcdHdoZW4gJ21hc3Rlcl9kZXRhaWwnXHJcblx0XHRcdHJldHVybiBnZXRMb29rdXBGaWVsZE1vZGlmaWVyKGZpZWxkLCB2YWx1ZSwgc3BhY2VfaWQpXHJcblx0XHR3aGVuICd0ZXh0YXJlYSdcclxuXHRcdFx0cmV0dXJuICcnXHJcblx0XHR3aGVuICdjb2RlJ1xyXG5cdFx0XHRyZXR1cm4gJydcclxuXHRcdHdoZW4gJ2h0bWwnXHJcblx0XHRcdHJldHVybiAnJ1xyXG5cdFx0d2hlbiAnbWFya2Rvd24nXHJcblx0XHRcdHJldHVybiAnJ1xyXG5cdFx0d2hlbiAnZ3JpZCdcclxuXHRcdFx0cmV0dXJuICcnXHJcblx0XHRlbHNlXHJcblx0XHRcdHJldHVybiB2YWx1ZVxyXG5cclxuIyDmlrDlu7rml7YsIOS4jeiusOW9leaYjue7hlxyXG5pbnNlcnRSZWNvcmQgPSAodXNlcklkLCBvYmplY3RfbmFtZSwgbmV3X2RvYyktPlxyXG4jXHRpZiAhdXNlcklkXHJcbiNcdFx0cmV0dXJuXHJcblxyXG5cdGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJhdWRpdF9yZWNvcmRzXCIpXHJcblx0c3BhY2VfaWQgPSBuZXdfZG9jLnNwYWNlXHJcblx0cmVjb3JkX2lkID0gbmV3X2RvYy5faWRcclxuXHRkb2MgPSB7XHJcblx0XHRfaWQ6IGNvbGxlY3Rpb24uX21ha2VOZXdJRCgpXHJcblx0XHRzcGFjZTogc3BhY2VfaWRcclxuXHRcdGZpZWxkX25hbWU6IFwi5bey5Yib5bu644CCXCJcclxuXHRcdHJlbGF0ZWRfdG86IHtcclxuXHRcdFx0bzogb2JqZWN0X25hbWVcclxuXHRcdFx0aWRzOiBbcmVjb3JkX2lkXVxyXG5cdFx0fVxyXG5cdH1cclxuXHRjb2xsZWN0aW9uLmluc2VydCBkb2NcclxuXHJcbiMg5L+u5pS55pe2LCDorrDlvZXlrZfmrrXlj5jmm7TmmI7nu4ZcclxudXBkYXRlUmVjb3JkID0gKHVzZXJJZCwgb2JqZWN0X25hbWUsIG5ld19kb2MsIHByZXZpb3VzX2RvYywgbW9kaWZpZXIpLT5cclxuI1x0aWYgIXVzZXJJZFxyXG4jXHRcdHJldHVyblxyXG5cdHNwYWNlX2lkID0gbmV3X2RvYy5zcGFjZVxyXG5cdHJlY29yZF9pZCA9IG5ld19kb2MuX2lkXHJcblxyXG5cdGZpZWxkcyA9IENyZWF0b3IuY29udmVydE9iamVjdChjbG9uZShDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSwgc3BhY2VfaWQpKSwgc3BhY2VfaWQpPy5maWVsZHNcclxuXHJcblx0bW9kaWZpZXJTZXQgPSBtb2RpZmllci4kc2V0XHJcblxyXG5cdG1vZGlmaWVyVW5zZXQgPSBtb2RpZmllci4kdW5zZXRcclxuXHJcblx0IyMjIFRPRE8gdXRjT2Zmc2V0IOW6lOivpeadpeiHquaVsOaNruW6kyzlvoUgIzk4NCDlpITnkIblkI4g6LCD5pW0XHJcblxyXG4gICAgdXRjT2Zmc2V0ID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwidXNlcnNcIikuZmluZE9uZSh7X2lkOiB1c2VySWR9KT8udXRjT2Zmc2V0XHJcblxyXG5cdGlmICFfLmlzTnVtYmVyKHV0Y09mZnNldClcclxuXHRcdHV0Y09mZnNldCA9IDhcclxuXHQjIyNcclxuXHJcblx0dXRjT2Zmc2V0ID0gOFxyXG5cclxuXHRvcHRpb25zID0ge3V0Y09mZnNldDogdXRjT2Zmc2V0LCBzcGFjZV9pZDogc3BhY2VfaWR9XHJcblxyXG5cdF8uZWFjaCBtb2RpZmllclNldCwgKHYsIGspLT5cclxuXHRcdGZpZWxkID0gZmllbGRzP1trXVxyXG5cdFx0cHJldmlvdXNfdmFsdWUgPSBwcmV2aW91c19kb2Nba11cclxuXHRcdG5ld192YWx1ZSA9IHZcclxuXHJcblx0XHRkYl9wcmV2aW91c192YWx1ZSA9IG51bGxcclxuXHRcdGRiX25ld192YWx1ZSA9IG51bGxcclxuXHJcblx0XHRzd2l0Y2ggZmllbGQudHlwZVxyXG5cdFx0XHR3aGVuICdkYXRlJ1xyXG5cdFx0XHRcdGlmIG5ld192YWx1ZT8udG9TdHJpbmcoKSAhPSBwcmV2aW91c192YWx1ZT8udG9TdHJpbmcoKVxyXG5cdFx0XHRcdFx0aWYgbmV3X3ZhbHVlXHJcblx0XHRcdFx0XHRcdGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucylcclxuXHRcdFx0XHRcdGlmIHByZXZpb3VzX3ZhbHVlXHJcblx0XHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdHdoZW4gJ2RhdGV0aW1lJ1xyXG5cdFx0XHRcdGlmIG5ld192YWx1ZT8udG9TdHJpbmcoKSAhPSBwcmV2aW91c192YWx1ZT8udG9TdHJpbmcoKVxyXG5cdFx0XHRcdFx0aWYgbmV3X3ZhbHVlXHJcblx0XHRcdFx0XHRcdGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucylcclxuXHRcdFx0XHRcdGlmIHByZXZpb3VzX3ZhbHVlXHJcblx0XHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdHdoZW4gJ3RleHRhcmVhJ1xyXG5cdFx0XHRcdGlmIHByZXZpb3VzX3ZhbHVlICE9IG5ld192YWx1ZVxyXG5cdFx0XHRcdFx0ZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucylcclxuXHRcdFx0XHRcdGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucylcclxuXHRcdFx0d2hlbiAnY29kZSdcclxuXHRcdFx0XHRpZiBwcmV2aW91c192YWx1ZSAhPSBuZXdfdmFsdWVcclxuXHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdFx0XHRkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdHdoZW4gJ2h0bWwnXHJcblx0XHRcdFx0aWYgcHJldmlvdXNfdmFsdWUgIT0gbmV3X3ZhbHVlXHJcblx0XHRcdFx0XHRkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKVxyXG5cdFx0XHRcdFx0ZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKVxyXG5cdFx0XHR3aGVuICdtYXJrZG93bidcclxuXHRcdFx0XHRpZiBwcmV2aW91c192YWx1ZSAhPSBuZXdfdmFsdWVcclxuXHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdFx0XHRkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdHdoZW4gJ2dyaWQnXHJcblx0XHRcdFx0aWYgSlNPTi5zdHJpbmdpZnkocHJldmlvdXNfdmFsdWUpICE9IEpTT04uc3RyaW5naWZ5KG5ld192YWx1ZSlcclxuXHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdFx0XHRkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdHdoZW4gJ2Jvb2xlYW4nXHJcblx0XHRcdFx0aWYgcHJldmlvdXNfdmFsdWUgIT0gbmV3X3ZhbHVlXHJcblx0XHRcdFx0XHRkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKVxyXG5cdFx0XHRcdFx0ZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKVxyXG5cdFx0XHR3aGVuICdzZWxlY3QnXHJcblx0XHRcdFx0aWYgcHJldmlvdXNfdmFsdWU/LnRvU3RyaW5nKCkgIT0gbmV3X3ZhbHVlPy50b1N0cmluZygpXHJcblx0XHRcdFx0XHRkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKVxyXG5cdFx0XHRcdFx0ZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKVxyXG5cdFx0XHR3aGVuICdjaGVja2JveCdcclxuXHRcdFx0XHRpZiBwcmV2aW91c192YWx1ZT8udG9TdHJpbmcoKSAhPSBuZXdfdmFsdWU/LnRvU3RyaW5nKClcclxuXHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdFx0XHRkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdHdoZW4gJ2xvb2t1cCdcclxuXHRcdFx0XHRpZiBKU09OLnN0cmluZ2lmeShwcmV2aW91c192YWx1ZSkgIT0gSlNPTi5zdHJpbmdpZnkobmV3X3ZhbHVlKVxyXG5cdFx0XHRcdFx0aWYgcHJldmlvdXNfdmFsdWVcclxuXHRcdFx0XHRcdFx0ZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucylcclxuXHRcdFx0XHRcdGlmIG5ld192YWx1ZVxyXG5cdFx0XHRcdFx0XHRkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdHdoZW4gJ21hc3Rlcl9kZXRhaWwnXHJcblx0XHRcdFx0aWYgSlNPTi5zdHJpbmdpZnkocHJldmlvdXNfdmFsdWUpICE9IEpTT04uc3RyaW5naWZ5KG5ld192YWx1ZSlcclxuXHRcdFx0XHRcdGlmIHByZXZpb3VzX3ZhbHVlXHJcblx0XHRcdFx0XHRcdGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpXHJcblx0XHRcdFx0XHRpZiBuZXdfdmFsdWVcclxuXHRcdFx0XHRcdFx0ZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKVxyXG5cdFx0XHRlbHNlXHJcblx0XHRcdFx0aWYgbmV3X3ZhbHVlICE9IHByZXZpb3VzX3ZhbHVlXHJcblx0XHRcdFx0XHRkYl9wcmV2aW91c192YWx1ZSA9IHByZXZpb3VzX3ZhbHVlXHJcblx0XHRcdFx0XHRkYl9uZXdfdmFsdWUgPSBuZXdfdmFsdWVcclxuXHJcblx0XHRpZiAoZGJfbmV3X3ZhbHVlICE9IG51bGwgJiYgZGJfbmV3X3ZhbHVlICE9IHVuZGVmaW5lZCkgfHwgKGRiX3ByZXZpb3VzX3ZhbHVlICE9IG51bGwgJiYgZGJfcHJldmlvdXNfdmFsdWUgIT0gdW5kZWZpbmVkKVxyXG5cdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiYXVkaXRfcmVjb3Jkc1wiKVxyXG5cdFx0XHRkb2MgPSB7XHJcblx0XHRcdFx0X2lkOiBjb2xsZWN0aW9uLl9tYWtlTmV3SUQoKVxyXG5cdFx0XHRcdHNwYWNlOiBzcGFjZV9pZFxyXG5cdFx0XHRcdGZpZWxkX25hbWU6IGZpZWxkLmxhYmVsIHx8IGZpZWxkLm5hbWVcclxuXHRcdFx0XHRwcmV2aW91c192YWx1ZTogZGJfcHJldmlvdXNfdmFsdWVcclxuXHRcdFx0XHRuZXdfdmFsdWU6IGRiX25ld192YWx1ZVxyXG5cdFx0XHRcdHJlbGF0ZWRfdG86IHtcclxuXHRcdFx0XHRcdG86IG9iamVjdF9uYW1lXHJcblx0XHRcdFx0XHRpZHM6IFtyZWNvcmRfaWRdXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdGNvbGxlY3Rpb24uaW5zZXJ0IGRvY1xyXG5cclxuXHRfLmVhY2ggbW9kaWZpZXJVbnNldCwgKHYsIGspLT5cclxuXHRcdGZpZWxkID0gZmllbGRzP1trXVxyXG5cdFx0cHJldmlvdXNfdmFsdWUgPSBwcmV2aW91c19kb2Nba11cclxuXHRcdGlmIHByZXZpb3VzX3ZhbHVlIHx8IF8uaXNCb29sZWFuKHByZXZpb3VzX3ZhbHVlKVxyXG5cdFx0XHRjb2xsZWN0aW9uID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKFwiYXVkaXRfcmVjb3Jkc1wiKVxyXG5cdFx0XHRkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKVxyXG5cdFx0XHRkb2MgPSB7XHJcblx0XHRcdFx0X2lkOiBjb2xsZWN0aW9uLl9tYWtlTmV3SUQoKVxyXG5cdFx0XHRcdHNwYWNlOiBzcGFjZV9pZFxyXG5cdFx0XHRcdGZpZWxkX25hbWU6IGZpZWxkLmxhYmVsIHx8IGZpZWxkLm5hbWVcclxuXHRcdFx0XHRwcmV2aW91c192YWx1ZTogZGJfcHJldmlvdXNfdmFsdWVcclxuXHRcdFx0XHRyZWxhdGVkX3RvOiB7XHJcblx0XHRcdFx0XHRvOiBvYmplY3RfbmFtZVxyXG5cdFx0XHRcdFx0aWRzOiBbcmVjb3JkX2lkXVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0XHRjb2xsZWN0aW9uLmluc2VydCBkb2NcclxuXHJcbkNyZWF0b3IuQXVkaXRSZWNvcmRzLmFkZCA9IChhY3Rpb24sIHVzZXJJZCwgb2JqZWN0X25hbWUsIG5ld19kb2MsIHByZXZpb3VzX2RvYywgbW9kaWZpZXIpLT5cclxuXHRpZiBhY3Rpb24gPT0gJ3VwZGF0ZSdcclxuXHRcdHVwZGF0ZVJlY29yZCh1c2VySWQsIG9iamVjdF9uYW1lLCBuZXdfZG9jLCBwcmV2aW91c19kb2MsIG1vZGlmaWVyKVxyXG5cdGVsc2UgaWYgYWN0aW9uID09ICdpbnNlcnQnXHJcblx0XHRpbnNlcnRSZWNvcmQodXNlcklkLCBvYmplY3RfbmFtZSwgbmV3X2RvYylcclxuIiwidmFyIGNsb25lLCBnZXRMb29rdXBGaWVsZE1vZGlmaWVyLCBnZXRMb29rdXBGaWVsZFZhbHVlLCBpbnNlcnRSZWNvcmQsIHRyYW5zZm9ybUZpZWxkVmFsdWUsIHVwZGF0ZVJlY29yZDtcblxuY2xvbmUgPSByZXF1aXJlKFwiY2xvbmVcIik7XG5cbkNyZWF0b3IuQXVkaXRSZWNvcmRzID0ge307XG5cbmdldExvb2t1cEZpZWxkVmFsdWUgPSBmdW5jdGlvbihyZWZlcmVuY2VfdG8sIHZhbHVlLCBzcGFjZV9pZCkge1xuICB2YXIgbmFtZV9maWVsZF9rZXksIG9iaiwgcHJldmlvdXNfaWRzLCByZWZlcmVuY2VfdG9fb2JqZWN0LCB2YWx1ZXM7XG4gIGlmIChfLmlzQXJyYXkocmVmZXJlbmNlX3RvKSAmJiBfLmlzT2JqZWN0KHZhbHVlKSkge1xuICAgIHJlZmVyZW5jZV90byA9IHZhbHVlLm87XG4gICAgcHJldmlvdXNfaWRzID0gdmFsdWUuaWRzO1xuICB9XG4gIGlmICghXy5pc0FycmF5KHByZXZpb3VzX2lkcykpIHtcbiAgICBwcmV2aW91c19pZHMgPSB2YWx1ZSA/IFt2YWx1ZV0gOiBbXTtcbiAgfVxuICByZWZlcmVuY2VfdG9fb2JqZWN0ID0gQ3JlYXRvci5nZXRPYmplY3QocmVmZXJlbmNlX3RvLCBzcGFjZV9pZCk7XG4gIG5hbWVfZmllbGRfa2V5ID0gcmVmZXJlbmNlX3RvX29iamVjdC5OQU1FX0ZJRUxEX0tFWTtcbiAgdmFsdWVzID0gQ3JlYXRvci5nZXRDb2xsZWN0aW9uKHJlZmVyZW5jZV90bywgc3BhY2VfaWQpLmZpbmQoe1xuICAgIF9pZDoge1xuICAgICAgJGluOiBwcmV2aW91c19pZHNcbiAgICB9XG4gIH0sIHtcbiAgICBmaWVsZHM6IChcbiAgICAgIG9iaiA9IHtcbiAgICAgICAgX2lkOiAxXG4gICAgICB9LFxuICAgICAgb2JqW1wiXCIgKyBuYW1lX2ZpZWxkX2tleV0gPSAxLFxuICAgICAgb2JqXG4gICAgKVxuICB9KS5mZXRjaCgpO1xuICB2YWx1ZXMgPSBDcmVhdG9yLmdldE9yZGVybHlTZXRCeUlkcyh2YWx1ZXMsIHByZXZpb3VzX2lkcyk7XG4gIHJldHVybiAoXy5wbHVjayh2YWx1ZXMsIG5hbWVfZmllbGRfa2V5KSkuam9pbignLCcpO1xufTtcblxuZ2V0TG9va3VwRmllbGRNb2RpZmllciA9IGZ1bmN0aW9uKGZpZWxkLCB2YWx1ZSwgc3BhY2VfaWQpIHtcbiAgdmFyIHJlZmVyZW5jZV90bztcbiAgcmVmZXJlbmNlX3RvID0gZmllbGQucmVmZXJlbmNlX3RvO1xuICBpZiAoXy5pc0Z1bmN0aW9uKHJlZmVyZW5jZV90bykpIHtcbiAgICByZWZlcmVuY2VfdG8gPSByZWZlcmVuY2VfdG8oKTtcbiAgfVxuICBpZiAoXy5pc0Z1bmN0aW9uKGZpZWxkLm9wdGlvbnNGdW5jdGlvbikpIHtcbiAgICBpZiAoXy5pc1N0cmluZyhyZWZlcmVuY2VfdG8pKSB7XG4gICAgICBpZiAodmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIGdldExvb2t1cEZpZWxkVmFsdWUocmVmZXJlbmNlX3RvLCB2YWx1ZSwgc3BhY2VfaWQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBnZXRMb29rdXBGaWVsZFZhbHVlKHJlZmVyZW5jZV90bywgdmFsdWUsIHNwYWNlX2lkKTtcbiAgfVxufTtcblxuXG4vKlxu5a2X5q615YC86L2s5o2i6KeE5YiZOlxuMSDml6XmnJ8g5qC85byP5a2Y5YKo5Li6IChTdHJpbmcpOiAyMDE4LTAxLTAyXG4yIOaXtumXtCDmoLzlvI/lrZjlgqjkuLogKFN0cmluZyk6IDIwMTgtMDEtMDIgMjM6MTJcbjIgbG9va3VwIOWSjOS4i+aLieahhu+8jOmDveaYr+WvueW6lOeahOaYvuekuuWQjeensCAobmFtZSB8IGxhYmVsKVxuMyBib29sZWFuIOWwseWtmOaYry/lkKZcbjQg5aSa6KGM5paH5pysXFxncmlkXFxsb29rdXDmnIlvcHRpb25zRnVuY3Rpb27lubbkuJTmsqHmnIlyZWZlcmVuY2VfdG/ml7Yg5LiN6K6w5b2V5paw5pen5YC8LCDlj6rorrDlvZXkv67mlLnml7bpl7QsIOS/ruaUueS6uiwg5L+u5pS555qE5a2X5q615pi+56S65ZCNXG4gKi9cblxudHJhbnNmb3JtRmllbGRWYWx1ZSA9IGZ1bmN0aW9uKGZpZWxkLCB2YWx1ZSwgb3B0aW9ucykge1xuICB2YXIgc2VsZWN0ZWRfdmFsdWUsIHNwYWNlX2lkLCB1dGNPZmZzZXQ7XG4gIGlmIChfLmlzTnVsbCh2YWx1ZSkgfHwgXy5pc1VuZGVmaW5lZCh2YWx1ZSkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdXRjT2Zmc2V0ID0gb3B0aW9ucy51dGNPZmZzZXQ7XG4gIHNwYWNlX2lkID0gb3B0aW9ucy5zcGFjZV9pZDtcbiAgc3dpdGNoIChmaWVsZC50eXBlKSB7XG4gICAgY2FzZSAnZGF0ZSc6XG4gICAgICByZXR1cm4gbW9tZW50LnV0Yyh2YWx1ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG4gICAgY2FzZSAnZGF0ZXRpbWUnOlxuICAgICAgcmV0dXJuIG1vbWVudCh2YWx1ZSkudXRjT2Zmc2V0KHV0Y09mZnNldCkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOm1tJyk7XG4gICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICBpZiAoXy5pc0Jvb2xlYW4odmFsdWUpKSB7XG4gICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgIHJldHVybiAn5pivJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gJ+WQpic7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICBpZiAoXy5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSBbdmFsdWVdO1xuICAgICAgfVxuICAgICAgc2VsZWN0ZWRfdmFsdWUgPSBfLm1hcChmaWVsZC5vcHRpb25zLCBmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgICAgaWYgKF8uY29udGFpbnModmFsdWUsIG9wdGlvbi52YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gb3B0aW9uLmxhYmVsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBfLmNvbXBhY3Qoc2VsZWN0ZWRfdmFsdWUpLmpvaW4oJywnKTtcbiAgICBjYXNlICdjaGVja2JveCc6XG4gICAgICBpZiAoXy5pc1N0cmluZyh2YWx1ZSkpIHtcbiAgICAgICAgdmFsdWUgPSBbdmFsdWVdO1xuICAgICAgfVxuICAgICAgc2VsZWN0ZWRfdmFsdWUgPSBfLm1hcChmaWVsZC5vcHRpb25zLCBmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgICAgaWYgKF8uY29udGFpbnModmFsdWUsIG9wdGlvbi52YWx1ZSkpIHtcbiAgICAgICAgICByZXR1cm4gb3B0aW9uLmxhYmVsO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiBfLmNvbXBhY3Qoc2VsZWN0ZWRfdmFsdWUpLmpvaW4oJywnKTtcbiAgICBjYXNlICdsb29rdXAnOlxuICAgICAgcmV0dXJuIGdldExvb2t1cEZpZWxkTW9kaWZpZXIoZmllbGQsIHZhbHVlLCBzcGFjZV9pZCk7XG4gICAgY2FzZSAnbWFzdGVyX2RldGFpbCc6XG4gICAgICByZXR1cm4gZ2V0TG9va3VwRmllbGRNb2RpZmllcihmaWVsZCwgdmFsdWUsIHNwYWNlX2lkKTtcbiAgICBjYXNlICd0ZXh0YXJlYSc6XG4gICAgICByZXR1cm4gJyc7XG4gICAgY2FzZSAnY29kZSc6XG4gICAgICByZXR1cm4gJyc7XG4gICAgY2FzZSAnaHRtbCc6XG4gICAgICByZXR1cm4gJyc7XG4gICAgY2FzZSAnbWFya2Rvd24nOlxuICAgICAgcmV0dXJuICcnO1xuICAgIGNhc2UgJ2dyaWQnOlxuICAgICAgcmV0dXJuICcnO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gdmFsdWU7XG4gIH1cbn07XG5cbmluc2VydFJlY29yZCA9IGZ1bmN0aW9uKHVzZXJJZCwgb2JqZWN0X25hbWUsIG5ld19kb2MpIHtcbiAgdmFyIGNvbGxlY3Rpb24sIGRvYywgcmVjb3JkX2lkLCBzcGFjZV9pZDtcbiAgY29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImF1ZGl0X3JlY29yZHNcIik7XG4gIHNwYWNlX2lkID0gbmV3X2RvYy5zcGFjZTtcbiAgcmVjb3JkX2lkID0gbmV3X2RvYy5faWQ7XG4gIGRvYyA9IHtcbiAgICBfaWQ6IGNvbGxlY3Rpb24uX21ha2VOZXdJRCgpLFxuICAgIHNwYWNlOiBzcGFjZV9pZCxcbiAgICBmaWVsZF9uYW1lOiBcIuW3suWIm+W7uuOAglwiLFxuICAgIHJlbGF0ZWRfdG86IHtcbiAgICAgIG86IG9iamVjdF9uYW1lLFxuICAgICAgaWRzOiBbcmVjb3JkX2lkXVxuICAgIH1cbiAgfTtcbiAgcmV0dXJuIGNvbGxlY3Rpb24uaW5zZXJ0KGRvYyk7XG59O1xuXG51cGRhdGVSZWNvcmQgPSBmdW5jdGlvbih1c2VySWQsIG9iamVjdF9uYW1lLCBuZXdfZG9jLCBwcmV2aW91c19kb2MsIG1vZGlmaWVyKSB7XG4gIHZhciBmaWVsZHMsIG1vZGlmaWVyU2V0LCBtb2RpZmllclVuc2V0LCBvcHRpb25zLCByZWNvcmRfaWQsIHJlZiwgc3BhY2VfaWQsIHV0Y09mZnNldDtcbiAgc3BhY2VfaWQgPSBuZXdfZG9jLnNwYWNlO1xuICByZWNvcmRfaWQgPSBuZXdfZG9jLl9pZDtcbiAgZmllbGRzID0gKHJlZiA9IENyZWF0b3IuY29udmVydE9iamVjdChjbG9uZShDcmVhdG9yLmdldE9iamVjdChvYmplY3RfbmFtZSwgc3BhY2VfaWQpKSwgc3BhY2VfaWQpKSAhPSBudWxsID8gcmVmLmZpZWxkcyA6IHZvaWQgMDtcbiAgbW9kaWZpZXJTZXQgPSBtb2RpZmllci4kc2V0O1xuICBtb2RpZmllclVuc2V0ID0gbW9kaWZpZXIuJHVuc2V0O1xuXG4gIC8qIFRPRE8gdXRjT2Zmc2V0IOW6lOivpeadpeiHquaVsOaNruW6kyzlvoUgIzk4NCDlpITnkIblkI4g6LCD5pW0XG4gIFxuICAgICB1dGNPZmZzZXQgPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJ1c2Vyc1wiKS5maW5kT25lKHtfaWQ6IHVzZXJJZH0pPy51dGNPZmZzZXRcbiAgXG4gIFx0aWYgIV8uaXNOdW1iZXIodXRjT2Zmc2V0KVxuICBcdFx0dXRjT2Zmc2V0ID0gOFxuICAgKi9cbiAgdXRjT2Zmc2V0ID0gODtcbiAgb3B0aW9ucyA9IHtcbiAgICB1dGNPZmZzZXQ6IHV0Y09mZnNldCxcbiAgICBzcGFjZV9pZDogc3BhY2VfaWRcbiAgfTtcbiAgXy5lYWNoKG1vZGlmaWVyU2V0LCBmdW5jdGlvbih2LCBrKSB7XG4gICAgdmFyIGNvbGxlY3Rpb24sIGRiX25ld192YWx1ZSwgZGJfcHJldmlvdXNfdmFsdWUsIGRvYywgZmllbGQsIG5ld192YWx1ZSwgcHJldmlvdXNfdmFsdWU7XG4gICAgZmllbGQgPSBmaWVsZHMgIT0gbnVsbCA/IGZpZWxkc1trXSA6IHZvaWQgMDtcbiAgICBwcmV2aW91c192YWx1ZSA9IHByZXZpb3VzX2RvY1trXTtcbiAgICBuZXdfdmFsdWUgPSB2O1xuICAgIGRiX3ByZXZpb3VzX3ZhbHVlID0gbnVsbDtcbiAgICBkYl9uZXdfdmFsdWUgPSBudWxsO1xuICAgIHN3aXRjaCAoZmllbGQudHlwZSkge1xuICAgICAgY2FzZSAnZGF0ZSc6XG4gICAgICAgIGlmICgobmV3X3ZhbHVlICE9IG51bGwgPyBuZXdfdmFsdWUudG9TdHJpbmcoKSA6IHZvaWQgMCkgIT09IChwcmV2aW91c192YWx1ZSAhPSBudWxsID8gcHJldmlvdXNfdmFsdWUudG9TdHJpbmcoKSA6IHZvaWQgMCkpIHtcbiAgICAgICAgICBpZiAobmV3X3ZhbHVlKSB7XG4gICAgICAgICAgICBkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocHJldmlvdXNfdmFsdWUpIHtcbiAgICAgICAgICAgIGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2RhdGV0aW1lJzpcbiAgICAgICAgaWYgKChuZXdfdmFsdWUgIT0gbnVsbCA/IG5ld192YWx1ZS50b1N0cmluZygpIDogdm9pZCAwKSAhPT0gKHByZXZpb3VzX3ZhbHVlICE9IG51bGwgPyBwcmV2aW91c192YWx1ZS50b1N0cmluZygpIDogdm9pZCAwKSkge1xuICAgICAgICAgIGlmIChuZXdfdmFsdWUpIHtcbiAgICAgICAgICAgIGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChwcmV2aW91c192YWx1ZSkge1xuICAgICAgICAgICAgZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAndGV4dGFyZWEnOlxuICAgICAgICBpZiAocHJldmlvdXNfdmFsdWUgIT09IG5ld192YWx1ZSkge1xuICAgICAgICAgIGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICAgIGRiX25ld192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIG5ld192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdjb2RlJzpcbiAgICAgICAgaWYgKHByZXZpb3VzX3ZhbHVlICE9PSBuZXdfdmFsdWUpIHtcbiAgICAgICAgICBkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICBkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnaHRtbCc6XG4gICAgICAgIGlmIChwcmV2aW91c192YWx1ZSAhPT0gbmV3X3ZhbHVlKSB7XG4gICAgICAgICAgZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21hcmtkb3duJzpcbiAgICAgICAgaWYgKHByZXZpb3VzX3ZhbHVlICE9PSBuZXdfdmFsdWUpIHtcbiAgICAgICAgICBkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICBkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnZ3JpZCc6XG4gICAgICAgIGlmIChKU09OLnN0cmluZ2lmeShwcmV2aW91c192YWx1ZSkgIT09IEpTT04uc3RyaW5naWZ5KG5ld192YWx1ZSkpIHtcbiAgICAgICAgICBkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICBkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnYm9vbGVhbic6XG4gICAgICAgIGlmIChwcmV2aW91c192YWx1ZSAhPT0gbmV3X3ZhbHVlKSB7XG4gICAgICAgICAgZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3NlbGVjdCc6XG4gICAgICAgIGlmICgocHJldmlvdXNfdmFsdWUgIT0gbnVsbCA/IHByZXZpb3VzX3ZhbHVlLnRvU3RyaW5nKCkgOiB2b2lkIDApICE9PSAobmV3X3ZhbHVlICE9IG51bGwgPyBuZXdfdmFsdWUudG9TdHJpbmcoKSA6IHZvaWQgMCkpIHtcbiAgICAgICAgICBkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICBkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAnY2hlY2tib3gnOlxuICAgICAgICBpZiAoKHByZXZpb3VzX3ZhbHVlICE9IG51bGwgPyBwcmV2aW91c192YWx1ZS50b1N0cmluZygpIDogdm9pZCAwKSAhPT0gKG5ld192YWx1ZSAhPSBudWxsID8gbmV3X3ZhbHVlLnRvU3RyaW5nKCkgOiB2b2lkIDApKSB7XG4gICAgICAgICAgZGJfcHJldmlvdXNfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBwcmV2aW91c192YWx1ZSwgb3B0aW9ucyk7XG4gICAgICAgICAgZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2xvb2t1cCc6XG4gICAgICAgIGlmIChKU09OLnN0cmluZ2lmeShwcmV2aW91c192YWx1ZSkgIT09IEpTT04uc3RyaW5naWZ5KG5ld192YWx1ZSkpIHtcbiAgICAgICAgICBpZiAocHJldmlvdXNfdmFsdWUpIHtcbiAgICAgICAgICAgIGRiX3ByZXZpb3VzX3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgcHJldmlvdXNfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAobmV3X3ZhbHVlKSB7XG4gICAgICAgICAgICBkYl9uZXdfdmFsdWUgPSB0cmFuc2Zvcm1GaWVsZFZhbHVlKGZpZWxkLCBuZXdfdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ21hc3Rlcl9kZXRhaWwnOlxuICAgICAgICBpZiAoSlNPTi5zdHJpbmdpZnkocHJldmlvdXNfdmFsdWUpICE9PSBKU09OLnN0cmluZ2lmeShuZXdfdmFsdWUpKSB7XG4gICAgICAgICAgaWYgKHByZXZpb3VzX3ZhbHVlKSB7XG4gICAgICAgICAgICBkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG5ld192YWx1ZSkge1xuICAgICAgICAgICAgZGJfbmV3X3ZhbHVlID0gdHJhbnNmb3JtRmllbGRWYWx1ZShmaWVsZCwgbmV3X3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICBpZiAobmV3X3ZhbHVlICE9PSBwcmV2aW91c192YWx1ZSkge1xuICAgICAgICAgIGRiX3ByZXZpb3VzX3ZhbHVlID0gcHJldmlvdXNfdmFsdWU7XG4gICAgICAgICAgZGJfbmV3X3ZhbHVlID0gbmV3X3ZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICgoZGJfbmV3X3ZhbHVlICE9PSBudWxsICYmIGRiX25ld192YWx1ZSAhPT0gdm9pZCAwKSB8fCAoZGJfcHJldmlvdXNfdmFsdWUgIT09IG51bGwgJiYgZGJfcHJldmlvdXNfdmFsdWUgIT09IHZvaWQgMCkpIHtcbiAgICAgIGNvbGxlY3Rpb24gPSBDcmVhdG9yLmdldENvbGxlY3Rpb24oXCJhdWRpdF9yZWNvcmRzXCIpO1xuICAgICAgZG9jID0ge1xuICAgICAgICBfaWQ6IGNvbGxlY3Rpb24uX21ha2VOZXdJRCgpLFxuICAgICAgICBzcGFjZTogc3BhY2VfaWQsXG4gICAgICAgIGZpZWxkX25hbWU6IGZpZWxkLmxhYmVsIHx8IGZpZWxkLm5hbWUsXG4gICAgICAgIHByZXZpb3VzX3ZhbHVlOiBkYl9wcmV2aW91c192YWx1ZSxcbiAgICAgICAgbmV3X3ZhbHVlOiBkYl9uZXdfdmFsdWUsXG4gICAgICAgIHJlbGF0ZWRfdG86IHtcbiAgICAgICAgICBvOiBvYmplY3RfbmFtZSxcbiAgICAgICAgICBpZHM6IFtyZWNvcmRfaWRdXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICByZXR1cm4gY29sbGVjdGlvbi5pbnNlcnQoZG9jKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gXy5lYWNoKG1vZGlmaWVyVW5zZXQsIGZ1bmN0aW9uKHYsIGspIHtcbiAgICB2YXIgY29sbGVjdGlvbiwgZGJfcHJldmlvdXNfdmFsdWUsIGRvYywgZmllbGQsIHByZXZpb3VzX3ZhbHVlO1xuICAgIGZpZWxkID0gZmllbGRzICE9IG51bGwgPyBmaWVsZHNba10gOiB2b2lkIDA7XG4gICAgcHJldmlvdXNfdmFsdWUgPSBwcmV2aW91c19kb2Nba107XG4gICAgaWYgKHByZXZpb3VzX3ZhbHVlIHx8IF8uaXNCb29sZWFuKHByZXZpb3VzX3ZhbHVlKSkge1xuICAgICAgY29sbGVjdGlvbiA9IENyZWF0b3IuZ2V0Q29sbGVjdGlvbihcImF1ZGl0X3JlY29yZHNcIik7XG4gICAgICBkYl9wcmV2aW91c192YWx1ZSA9IHRyYW5zZm9ybUZpZWxkVmFsdWUoZmllbGQsIHByZXZpb3VzX3ZhbHVlLCBvcHRpb25zKTtcbiAgICAgIGRvYyA9IHtcbiAgICAgICAgX2lkOiBjb2xsZWN0aW9uLl9tYWtlTmV3SUQoKSxcbiAgICAgICAgc3BhY2U6IHNwYWNlX2lkLFxuICAgICAgICBmaWVsZF9uYW1lOiBmaWVsZC5sYWJlbCB8fCBmaWVsZC5uYW1lLFxuICAgICAgICBwcmV2aW91c192YWx1ZTogZGJfcHJldmlvdXNfdmFsdWUsXG4gICAgICAgIHJlbGF0ZWRfdG86IHtcbiAgICAgICAgICBvOiBvYmplY3RfbmFtZSxcbiAgICAgICAgICBpZHM6IFtyZWNvcmRfaWRdXG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICByZXR1cm4gY29sbGVjdGlvbi5pbnNlcnQoZG9jKTtcbiAgICB9XG4gIH0pO1xufTtcblxuQ3JlYXRvci5BdWRpdFJlY29yZHMuYWRkID0gZnVuY3Rpb24oYWN0aW9uLCB1c2VySWQsIG9iamVjdF9uYW1lLCBuZXdfZG9jLCBwcmV2aW91c19kb2MsIG1vZGlmaWVyKSB7XG4gIGlmIChhY3Rpb24gPT09ICd1cGRhdGUnKSB7XG4gICAgcmV0dXJuIHVwZGF0ZVJlY29yZCh1c2VySWQsIG9iamVjdF9uYW1lLCBuZXdfZG9jLCBwcmV2aW91c19kb2MsIG1vZGlmaWVyKTtcbiAgfSBlbHNlIGlmIChhY3Rpb24gPT09ICdpbnNlcnQnKSB7XG4gICAgcmV0dXJuIGluc2VydFJlY29yZCh1c2VySWQsIG9iamVjdF9uYW1lLCBuZXdfZG9jKTtcbiAgfVxufTtcbiIsIkNyZWF0b3IuT2JqZWN0cy5hdWRpdF9yZWNvcmRzID1cclxuXHRuYW1lOiBcImF1ZGl0X3JlY29yZHNcIlxyXG5cdGxhYmVsOiBcIuWtl+auteWOhuWPslwiXHJcblx0aWNvbjogXCJyZWNvcmRcIlxyXG5cdGZpZWxkczpcclxuXHRcdHJlbGF0ZWRfdG86XHJcblx0XHRcdGxhYmVsOiBcIuebuOWFs+mhuVwiXHJcblx0XHRcdHR5cGU6IFwibG9va3VwXCJcclxuXHRcdFx0aW5kZXg6IHRydWVcclxuXHRcdFx0cmVmZXJlbmNlX3RvOiAoKS0+XHJcblx0XHRcdFx0byA9IFtdXHJcblx0XHRcdFx0Xy5lYWNoIENyZWF0b3IuT2JqZWN0cywgKG9iamVjdCwgb2JqZWN0X25hbWUpLT5cclxuXHRcdFx0XHRcdGlmIG9iamVjdC5lbmFibGVfYXVkaXRcclxuXHRcdFx0XHRcdFx0by5wdXNoIG9iamVjdC5uYW1lXHJcblx0XHRcdFx0cmV0dXJuIG9cclxuXHRcdFx0ZmlsdGVyYWJsZTp0cnVlXHJcblx0XHRcdGlzX25hbWU6IHRydWVcclxuXHRcdGNyZWF0ZWQ6XHJcblx0XHRcdGxhYmVsOlwi5pe26Ze0XCJcclxuXHRcdFx0ZmlsdGVyYWJsZTp0cnVlXHJcblx0XHRmaWVsZF9uYW1lOlxyXG5cdFx0XHRsYWJlbDogXCLlrZfmrrVcIlxyXG5cdFx0XHR0eXBlOiBcInRleHRcIlxyXG5cdFx0XHRyZXF1aXJlZDogdHJ1ZVxyXG5cdFx0XHRpc193aWRlOiB0cnVlXHJcblx0XHRjcmVhdGVkX2J5OlxyXG5cdFx0XHRsYWJlbDpcIueUqOaIt1wiXHJcblx0XHRwcmV2aW91c192YWx1ZTpcclxuXHRcdFx0bGFiZWw6IFwi5Y6f5aeL5YC8XCJcclxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcclxuXHRcdG5ld192YWx1ZTpcclxuXHRcdFx0bGFiZWw6IFwi5paw5YC8XCJcclxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcclxuXHJcblxyXG5cdGxpc3Rfdmlld3M6XHJcblx0XHRhbGw6XHJcblx0XHRcdGxhYmVsOiBcIuWFqOmDqFwiXHJcblx0XHRcdGZpbHRlcl9zY29wZTogXCJzcGFjZVwiXHJcblx0XHRcdGNvbHVtbnM6IFtcInJlbGF0ZWRfdG9cIiwgXCJjcmVhdGVkXCIsIFwiZmllbGRfbmFtZVwiLCBcImNyZWF0ZWRfYnlcIiwgXCJwcmV2aW91c192YWx1ZVwiLCBcIm5ld192YWx1ZVwiXVxyXG5cdFx0XHRmaWx0ZXJfZmllbGRzOiBbXCJyZWxhdGVkX3RvXCJdXHJcblx0XHRyZWNlbnQ6XHJcblx0XHRcdGxhYmVsOiBcIuacgOi/keafpeeci1wiXHJcblx0XHRcdGZpbHRlcl9zY29wZTogXCJzcGFjZVwiXHJcblxyXG5cdHBlcm1pc3Npb25fc2V0OlxyXG5cdFx0dXNlcjpcclxuXHRcdFx0YWxsb3dDcmVhdGU6IGZhbHNlXHJcblx0XHRcdGFsbG93RGVsZXRlOiBmYWxzZVxyXG5cdFx0XHRhbGxvd0VkaXQ6IGZhbHNlXHJcblx0XHRcdGFsbG93UmVhZDogdHJ1ZVxyXG5cdFx0XHRtb2RpZnlBbGxSZWNvcmRzOiBmYWxzZVxyXG5cdFx0XHR2aWV3QWxsUmVjb3JkczogZmFsc2VcclxuXHRcdGFkbWluOlxyXG5cdFx0XHRhbGxvd0NyZWF0ZTogZmFsc2VcclxuXHRcdFx0YWxsb3dEZWxldGU6IGZhbHNlXHJcblx0XHRcdGFsbG93RWRpdDogZmFsc2VcclxuXHRcdFx0YWxsb3dSZWFkOiB0cnVlXHJcblx0XHRcdG1vZGlmeUFsbFJlY29yZHM6IGZhbHNlXHJcblx0XHRcdHZpZXdBbGxSZWNvcmRzOiB0cnVlIiwiQ3JlYXRvci5PYmplY3RzLmF1ZGl0X3JlY29yZHMgPSB7XG4gIG5hbWU6IFwiYXVkaXRfcmVjb3Jkc1wiLFxuICBsYWJlbDogXCLlrZfmrrXljoblj7JcIixcbiAgaWNvbjogXCJyZWNvcmRcIixcbiAgZmllbGRzOiB7XG4gICAgcmVsYXRlZF90bzoge1xuICAgICAgbGFiZWw6IFwi55u45YWz6aG5XCIsXG4gICAgICB0eXBlOiBcImxvb2t1cFwiLFxuICAgICAgaW5kZXg6IHRydWUsXG4gICAgICByZWZlcmVuY2VfdG86IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbztcbiAgICAgICAgbyA9IFtdO1xuICAgICAgICBfLmVhY2goQ3JlYXRvci5PYmplY3RzLCBmdW5jdGlvbihvYmplY3QsIG9iamVjdF9uYW1lKSB7XG4gICAgICAgICAgaWYgKG9iamVjdC5lbmFibGVfYXVkaXQpIHtcbiAgICAgICAgICAgIHJldHVybiBvLnB1c2gob2JqZWN0Lm5hbWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBvO1xuICAgICAgfSxcbiAgICAgIGZpbHRlcmFibGU6IHRydWUsXG4gICAgICBpc19uYW1lOiB0cnVlXG4gICAgfSxcbiAgICBjcmVhdGVkOiB7XG4gICAgICBsYWJlbDogXCLml7bpl7RcIixcbiAgICAgIGZpbHRlcmFibGU6IHRydWVcbiAgICB9LFxuICAgIGZpZWxkX25hbWU6IHtcbiAgICAgIGxhYmVsOiBcIuWtl+autVwiLFxuICAgICAgdHlwZTogXCJ0ZXh0XCIsXG4gICAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICAgIGlzX3dpZGU6IHRydWVcbiAgICB9LFxuICAgIGNyZWF0ZWRfYnk6IHtcbiAgICAgIGxhYmVsOiBcIueUqOaIt1wiXG4gICAgfSxcbiAgICBwcmV2aW91c192YWx1ZToge1xuICAgICAgbGFiZWw6IFwi5Y6f5aeL5YC8XCIsXG4gICAgICB0eXBlOiBcInRleHRcIlxuICAgIH0sXG4gICAgbmV3X3ZhbHVlOiB7XG4gICAgICBsYWJlbDogXCLmlrDlgLxcIixcbiAgICAgIHR5cGU6IFwidGV4dFwiXG4gICAgfVxuICB9LFxuICBsaXN0X3ZpZXdzOiB7XG4gICAgYWxsOiB7XG4gICAgICBsYWJlbDogXCLlhajpg6hcIixcbiAgICAgIGZpbHRlcl9zY29wZTogXCJzcGFjZVwiLFxuICAgICAgY29sdW1uczogW1wicmVsYXRlZF90b1wiLCBcImNyZWF0ZWRcIiwgXCJmaWVsZF9uYW1lXCIsIFwiY3JlYXRlZF9ieVwiLCBcInByZXZpb3VzX3ZhbHVlXCIsIFwibmV3X3ZhbHVlXCJdLFxuICAgICAgZmlsdGVyX2ZpZWxkczogW1wicmVsYXRlZF90b1wiXVxuICAgIH0sXG4gICAgcmVjZW50OiB7XG4gICAgICBsYWJlbDogXCLmnIDov5Hmn6XnnItcIixcbiAgICAgIGZpbHRlcl9zY29wZTogXCJzcGFjZVwiXG4gICAgfVxuICB9LFxuICBwZXJtaXNzaW9uX3NldDoge1xuICAgIHVzZXI6IHtcbiAgICAgIGFsbG93Q3JlYXRlOiBmYWxzZSxcbiAgICAgIGFsbG93RGVsZXRlOiBmYWxzZSxcbiAgICAgIGFsbG93RWRpdDogZmFsc2UsXG4gICAgICBhbGxvd1JlYWQ6IHRydWUsXG4gICAgICBtb2RpZnlBbGxSZWNvcmRzOiBmYWxzZSxcbiAgICAgIHZpZXdBbGxSZWNvcmRzOiBmYWxzZVxuICAgIH0sXG4gICAgYWRtaW46IHtcbiAgICAgIGFsbG93Q3JlYXRlOiBmYWxzZSxcbiAgICAgIGFsbG93RGVsZXRlOiBmYWxzZSxcbiAgICAgIGFsbG93RWRpdDogZmFsc2UsXG4gICAgICBhbGxvd1JlYWQ6IHRydWUsXG4gICAgICBtb2RpZnlBbGxSZWNvcmRzOiBmYWxzZSxcbiAgICAgIHZpZXdBbGxSZWNvcmRzOiB0cnVlXG4gICAgfVxuICB9XG59O1xuIiwiQ3JlYXRvci5PYmplY3RzLmF1ZGl0X2xvZ2luID1cclxuXHRuYW1lOiBcImF1ZGl0X2xvZ2luXCJcclxuXHRsYWJlbDogXCLnmbvlvZXml6Xlv5dcIlxyXG5cdGljb246IFwicmVjb3JkXCJcclxuXHRmaWVsZHM6XHJcblx0XHR1c2VybmFtZTpcclxuXHRcdFx0bGFiZWw6IFwi55So5oi35ZCNXCJcclxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcclxuXHRcdFx0aXNfbmFtZTogdHJ1ZVxyXG5cclxuXHRcdGxvZ2luX3RpbWU6XHJcblx0XHRcdGxhYmVsOlwi55m75b2V5pe26Ze0XCJcclxuXHRcdFx0dHlwZTogXCJkYXRldGltZVwiXHJcblxyXG5cdFx0c291cmNlX2lwOlxyXG5cdFx0XHRsYWJlbDogXCJJUOWcsOWdgFwiXHJcblx0XHRcdHR5cGU6IFwidGV4dFwiXHJcblxyXG5cdFx0bG9jYXRpb246XHJcblx0XHRcdGxhYmVsOlwi5L2N572uXCJcclxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcclxuXHJcblx0XHRsb2dpbl90eXBlOlxyXG5cdFx0XHRsYWJlbDogXCLnmbvlvZXmlrnlvI9cIlxyXG5cdFx0XHR0eXBlOiBcInRleHRcIlxyXG5cclxuXHRcdHN0YXR1czpcclxuXHRcdFx0bGFiZWw6IFwi54q25oCBXCJcclxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcclxuXHJcblx0XHRicm93c2VyOlxyXG5cdFx0XHRsYWJlbDogXCLmtY/op4jlmahcIlxyXG5cdFx0XHR0eXBlOiBcInRleHRcIlxyXG5cclxuXHRcdHBsYXRmb3JtOlxyXG5cdFx0XHRsYWJlbDogXCLns7vnu59cIlxyXG5cdFx0XHR0eXBlOiBcInRleHRcIlxyXG5cclxuXHRcdGFwcGxpY2F0aW9uOlxyXG5cdFx0XHRsYWJlbDogXCLlupTnlKhcIlxyXG5cdFx0XHR0eXBlOiBcInRleHRcIlxyXG5cclxuXHRcdGNsaWVudF92ZXJzaW9uOlxyXG5cdFx0XHRsYWJlbDogXCLlrqLmiLfnq6/niYjmnKxcIlxyXG5cdFx0XHR0eXBlOiBcInRleHRcIlxyXG5cclxuXHRcdGFwaV90eXBlOlxyXG5cdFx0XHRsYWJlbDogXCJhcGnnsbvlnotcIlxyXG5cdFx0XHR0eXBlOiBcInRleHRcIlxyXG5cclxuXHRcdGFwaV92ZXJzaW9uOlxyXG5cdFx0XHRsYWJlbDogXCJhcGnniYjmnKxcIlxyXG5cdFx0XHR0eXBlOiBcInRleHRcIlxyXG5cclxuXHRcdGxvZ2luX3VybDpcclxuXHRcdFx0bGFiZWw6IFwi55m75b2VVVJMXCJcclxuXHRcdFx0dHlwZTogXCJ0ZXh0XCJcclxuXHJcblx0bGlzdF92aWV3czpcclxuXHRcdGFsbDpcclxuXHRcdFx0bGFiZWw6IFwi5YWo6YOoXCJcclxuXHRcdFx0ZmlsdGVyX3Njb3BlOiBcInNwYWNlXCJcclxuXHRcdFx0Y29sdW1uczogW1widXNlcm5hbWVcIiwgXCJsb2dpbl90aW1lXCIsIFwic291cmNlX2lwXCIsIFwibG9jYXRpb25cIiwgXCJsb2dpbl90eXBlXCIsIFwic3RhdHVzXCIsIFwiYnJvd3NlclwiLCBcInBsYXRmb3JtXCIsIFwiYXBwbGljYXRpb25cIiwgXCJjbGllbnRfdmVyc2lvblwiLCBcImFwaV90eXBlXCIsIFwiYXBpX3ZlcnNpb25cIiwgXCJsb2dpbl91cmxcIl1cclxuXHRcdHJlY2VudDpcclxuXHRcdFx0bGFiZWw6IFwi5pyA6L+R5p+l55yLXCJcclxuXHRcdFx0ZmlsdGVyX3Njb3BlOiBcInNwYWNlXCJcclxuXHJcblx0cGVybWlzc2lvbl9zZXQ6XHJcblx0XHR1c2VyOlxyXG5cdFx0XHRhbGxvd0NyZWF0ZTogZmFsc2VcclxuXHRcdFx0YWxsb3dEZWxldGU6IGZhbHNlXHJcblx0XHRcdGFsbG93RWRpdDogZmFsc2VcclxuXHRcdFx0YWxsb3dSZWFkOiB0cnVlXHJcblx0XHRcdG1vZGlmeUFsbFJlY29yZHM6IGZhbHNlXHJcblx0XHRcdHZpZXdBbGxSZWNvcmRzOiBmYWxzZVxyXG5cdFx0YWRtaW46XHJcblx0XHRcdGFsbG93Q3JlYXRlOiBmYWxzZVxyXG5cdFx0XHRhbGxvd0RlbGV0ZTogZmFsc2VcclxuXHRcdFx0YWxsb3dFZGl0OiBmYWxzZVxyXG5cdFx0XHRhbGxvd1JlYWQ6IHRydWVcclxuXHRcdFx0bW9kaWZ5QWxsUmVjb3JkczogZmFsc2VcclxuXHRcdFx0dmlld0FsbFJlY29yZHM6IHRydWUiXX0=
