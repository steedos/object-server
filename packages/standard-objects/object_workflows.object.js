Creator.Objects.object_workflows.triggers = {
  "before.insert.server.object_workflows.check": {
    on: "server",
    when: "before.insert",
    todo: function (userId, doc) {
      if (doc.object_name) {
        var object = Creator.getObject(doc.object_name);
        if (!object.enable_workflow) {
          throw new Meteor.Error(400, `只有启用开关(enable_workflow)的业务对象，才能配置对象流程。`);
        }
      }
    }
  },
  "before.update.server.object_workflows.check": {
    on: "server",
    when: "before.update",
    todo: function (userId, doc, fieldNames, modifier, options) {
      modifier.$set = modifier.$set || {};
      if (modifier.$set.object_name) {
        var object = Creator.getObject(modifier.$set.object_name);
        if (!object.enable_workflow) {
          throw new Meteor.Error(400, `只有启用开关(enable_workflow)的业务对象，才能配置对象流程。`);
        }
      }
    }
  },
  "before.insert.client.object_workflows.check": {
    on: "client",
    when: "before.insert",
    todo: function (userId, doc) {
      if (!Steedos.hasFeature('object_workflow', Steedos.getSpaceId())) {
        Steedos.spaceUpgradedModal();
        throw new Meteor.Error('当前工作区版本不能使用此功能，请联络系统管理员升级版本');
      }
    }
  },
  "before.update.client.object_workflows.check": {
    on: "client",
    when: "before.update",
    todo: function (userId, doc) {
      if (!Steedos.hasFeature('object_workflow', Steedos.getSpaceId())) {
        Steedos.spaceUpgradedModal();
        throw new Meteor.Error('当前工作区版本不能使用此功能，请联络系统管理员升级版本');
      }
    }
  },
};

Creator.Objects.object_workflows.actions = {
  forceSync: {
    label: 'sync history approvals',
    visible: function (object_name, record_id, record_permissions) {
      var perms, record;
      perms = {};
      if (record_permissions) {
        perms = record_permissions;
      } else {
        record = Creator.getObjectRecord(object_name, record_id);
        record_permissions = Creator.getRecordPermissions(object_name, record, Meteor.userId());
        if (record_permissions) {
          perms = record_permissions;
        }
      }
      return perms["allowEdit"];
    },
    on: "record",
    todo: function (object_name, record_id, fields) {
      $("body").addClass("loading");
      Meteor.call('object_workflows.forcesync', record_id, function (error, result) {
        $("body").removeClass("loading");
      
        if (error) {
          toastr.error(error.message);
        }
      
        if (result.error) {
          var errorLi = "";
          var href = "".concat(Steedos.absoluteUrl('workflow/space/' + Session.get('spaceId') + '/monitor/'));
          result.error.forEach(function (e) {
            errorLi += "<tr><td><a href='".concat(href + e._id, "' target='_blank'>").concat(e.name, "</a></td><td>").concat(e.message, "</td></tr>");
          });
          swal({
            title: t('object_workflows_sync_history_instances_failed'),
            text: "<div style=\"height: 400px;overflow: auto;\"><table><tbody>".concat(errorLi, "</tbody></table></div>"),
            html: true,
            confirmButtonText: t('OK')
          });
        } else {
          toastr.success(t('object_workflows_sync_history_instances_success'));
        }
      });
    }
  }
}

if (Meteor.isServer) {
  Meteor.methods({
    'object_workflows.forcesync': function (record_id) {
      check(record_id, String);
      var ow = Creator.getCollection('object_workflows').findOne(record_id);
      var spaceId = ow.space;
      var flowId = ow.flow_id;
      var errorMsgs = [];
      var result = {};
      Creator.getCollection('instances').find({ space: spaceId, flow: flowId, state: { $in: ['pending', 'completed'] }, $or: [{ record_ids: { $exists: false } }, { record_ids: { $size: 0 } }] }, { fields: { name: 1 } }).forEach(function (ins) {
        var doc = {
          info: {
            instance_id: ins._id,
            records: null
          }
        }
        try {
          InstanceRecordQueue.sendDoc(doc);
        } catch (error) {
          errorMsgs.push({ _id: ins._id, name: ins.name, message: error.message });
        }

      })

      if (errorMsgs.length > 0) {
        result.error = errorMsgs
      }

      return result;
    }
  });
}