Steedos.ProcessManager = {};

Steedos.ProcessManager.showProcessApprovalForm = function (action, fields, formId, doc, onConfirm, title) {
  var approveSchema = Creator.getObjectSchema({
    fields: fields
  });
  Modal.show("quickFormModal", {
    formId: formId,
    title: title || TAPi18n.__("process_approval_title_".concat(action)),
    confirmBtnText: "process_approval_confirmBtnText_".concat(action),
    schema: approveSchema,
    doc: doc,
    onConfirm: onConfirm
  }, {
    backdrop: 'static',
    keyboard: true
  });
};

Steedos.ProcessManager.allowApprover = function (object_name, record_id) {
  if (!object_name || !record_id) {
    return false;
  }

  var result = Steedos.authRequest("/api/v4/process/permission/approver/".concat(object_name, "/").concat(record_id), {
    type: 'get',
    async: false
  });

  if (result && result.allowApprover) {
    return true;
  } else {
    return false;
  }
};

Steedos.ProcessManager.allowRecall = function (object_name, record_id) {
  if (!object_name || !record_id) {
    return false;
  }

  var result = Steedos.authRequest("/api/v4/process/permission/recall/".concat(object_name, "/").concat(record_id), {
    type: 'get',
    async: false
  });

  if (result && result.allowRecall) {
    return true;
  } else {
    return false;
  }
};

Steedos.ProcessManager.allowSubmit = function (object_name, record_id) {
  if (!object_name || !record_id) {
    return false;
  }

  if (!Creator.getObject(object_name).enable_process) {
    return false;
  }

  var result = Steedos.authRequest("/api/v4/process/permission/submit/".concat(object_name, "/").concat(record_id), {
    type: 'get',
    async: false
  });

  if (result && result.allowSubmit) {
    return true;
  } else {
    return false;
  }
};

Steedos.ProcessManager.submit = function (object_name, record_id, options) {
  var formId = 'processApprovalForm';
  var schema = {
    comment: {
      label: TAPi18n.__('process_approval_comment'),
      type: 'textarea',
      rows: 3,
      is_wide: true
    }
  };

  if (options && options.showApprover) {
    schema.approver = {
      label: TAPi18n.__('process_approval_approver_label'),
      type: 'lookup',
      reference_to: 'users',
      required: true,
      is_wide: true
    };
    schema.comment.hidden = true;
  }

  var formValue = {};

  if (options && options.value) {
    formValue = options.value;
  }

  Steedos.ProcessManager.showProcessApprovalForm('submit', schema, formId, formValue, function (formValues, e, t) {
    var result = Steedos.authRequest("/api/v4/process/submit/".concat(object_name, "/").concat(record_id), {
      type: 'post',
      async: false,
      data: JSON.stringify(formValues.insertDoc)
    });

    if (result.state === 'FAILURE') {
      if (result.error === 'process_approval_error_needToChooseApprover') {
        Modal.hide(t);
        Meteor.setTimeout(function () {
          Steedos.ProcessManager.submit(object_name, record_id, {
            showApprover: true,
            value: {
              comment: formValues.insertDoc.comment
            }
          });
        }, 800);
      } else {
        toastr.error(TAPi18n.__(result.error));
        Modal.hide(t);
        FlowRouter.reload();
      }
    } else {
      Modal.hide(t);
      FlowRouter.reload();
    }
  });
};

Steedos.ProcessManager.recall = function (object_name, record_id) {
  var formId = 'processApprovalForm';
  Steedos.ProcessManager.showProcessApprovalForm('recall', {
    comment: {
      label: TAPi18n.__('process_approval_comment'),
      type: 'textarea',
      rows: 3,
      is_wide: true
    }
  }, formId, {}, function (formValues, e, t) {
    var result = Steedos.authRequest("/api/v4/process/recall/".concat(object_name, "/").concat(record_id), {
      type: 'post',
      async: false,
      data: JSON.stringify(formValues.insertDoc)
    });

    if (result.state === 'FAILURE') {
      toastr.error(TAPi18n.__(result.error));
    }

    FlowRouter.reload();
    Modal.hide(t);
  });
};

Steedos.ProcessManager.approve = function (object_name, record_id, options) {
  var formId = 'processApprovalForm';
  var title = "".concat(TAPi18n.__('process_instance_history_action_approve')); //TODO approval record name

  var schema = {
    comment: {
      label: TAPi18n.__('process_approval_comment'),
      type: 'textarea',
      rows: 3,
      is_wide: true
    }
  };

  if (options && options.showApprover) {
    schema.approver = {
      label: TAPi18n.__('process_approval_approver_label'),
      type: 'lookup',
      reference_to: 'users',
      required: true,
      is_wide: true
    };
    schema.comment.hidden = true;
  }

  var formValue = {};

  if (options && options.value) {
    formValue = options.value;
  }

  Steedos.ProcessManager.showProcessApprovalForm('approve', schema, formId, formValue, function (formValues, e, t) {
    var result = Steedos.authRequest("/api/v4/process/approve/".concat(object_name, "/").concat(record_id), {
      type: 'post',
      async: false,
      data: JSON.stringify(formValues.insertDoc)
    });

    if (result.state === 'FAILURE') {
      if (result.error === 'process_approval_error_needToChooseApprover') {
        Modal.hide(t);
        Meteor.setTimeout(function () {
          Steedos.ProcessManager.approve(object_name, record_id, {
            showApprover: true,
            value: {
              comment: formValues.insertDoc.comment
            }
          });
        }, 800);
      } else {
        toastr.error(TAPi18n.__(result.error));
        Modal.hide(t);
        FlowRouter.reload();
      }
    } else {
      Modal.hide(t);
      FlowRouter.reload();
    }
  }, title);
};

Steedos.ProcessManager.reject = function (object_name, record_id) {
  var formId = 'processApprovalForm';
  var title = "".concat(TAPi18n.__('process_instance_history_action_reject')); //TODO approval record name

  Steedos.ProcessManager.showProcessApprovalForm('reject', {
    comment: {
      label: TAPi18n.__('process_approval_comment'),
      type: 'textarea',
      rows: 3,
      is_wide: true
    }
  }, formId, {}, function (formValues, e, t) {
    var result = Steedos.authRequest("/api/v4/process/reject/".concat(object_name, "/").concat(record_id), {
      type: 'post',
      async: false,
      data: JSON.stringify(formValues.insertDoc)
    });

    if (result.state === 'FAILURE') {
      toastr.error(TAPi18n.__(result.error));
    }

    FlowRouter.reload();
    Modal.hide(t);
  }, title);
};

Steedos.ProcessManager.reassign = function (object_name, record_id) {
  var formId = 'processApprovalForm';
  Steedos.ProcessManager.showProcessApprovalForm('reassign', {
    approver: {
      label: TAPi18n.__('process_approval_approver_label_reassign'),
      type: 'lookup',
      reference_to: 'users',
      required: true,
      is_wide: true
    },
    comment: {
      label: TAPi18n.__('process_approval_comment'),
      type: 'textarea',
      rows: 3,
      is_wide: true
    }
  }, formId, {}, function (formValues, e, t) {
    var result = Steedos.authRequest("/api/v4/process/reassign/".concat(object_name, "/").concat(record_id), {
      type: 'post',
      async: false,
      data: JSON.stringify(formValues.insertDoc)
    });

    if (result.state === 'FAILURE') {
      toastr.error(TAPi18n.__(result.error));
    }

    FlowRouter.reload();
    Modal.hide(t);
  });
};