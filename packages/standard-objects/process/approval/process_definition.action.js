module.exports = {
  enableVisible: function enableVisible(object_name, record_id, record_permissions) {
    var result = Steedos.authRequest("/api/v4/".concat(object_name, "/").concat(record_id), {
      type: 'get',
      async: false
    });
    return !result.active;
  },
  enable: function enable(object_name, record_id, fields) {
    Steedos.authRequest("/api/v4/".concat(object_name, "/").concat(record_id), {
      type: 'put',
      async: false,
      data: JSON.stringify({
        active: true
      })
    });
    FlowRouter.reload();
  },
  disableVisible: function disableVisible(object_name, record_id, record_permissions) {
    var result = Steedos.authRequest("/api/v4/".concat(object_name, "/").concat(record_id), {
      type: 'get',
      async: false
    });
    return result.active;
  },
  disable: function disable(object_name, record_id, fields) {
    Steedos.authRequest("/api/v4/".concat(object_name, "/").concat(record_id), {
      type: 'put',
      async: false,
      data: JSON.stringify({
        active: false
      })
    });
    FlowRouter.reload();
  },
  copyVisible: true,
  copy: function copy(object_name, record_id, fields) {
    var result = Steedos.authRequest("/api/v4/".concat(object_name, "/").concat(record_id, "/copy"), {
      type: 'get',
      async: false
    });
    FlowRouter.go("/app/admin/process_definition/view/".concat(result._id));
  }
};