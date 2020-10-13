module.exports = {
  createCustomerSpaceUser: function createCustomerSpaceUser() {
    var objectName = "space_users";
    var object = Creator.getObject(objectName);
    var collection_name = object.label;
    Session.set("action_collection", "Creator.Collections." + objectName);
    Session.set("action_collection_name", collection_name);
    Session.set("action_save_and_insert", false);
    Session.set("cmDoc", Object.assign({
      is_customer: true,
      contact_id: this.record._id,
      profile: 'customer'
    }, this.record));
    console.log("this.record", Object.assign({
      is_customer: true
    }, this.record));
    Meteor.defer(function () {
      $(".creator-add").click();
    });
  },
  createCustomerSpaceUserVisible: function createCustomerSpaceUserVisible(object_name, record_id, record_permissions) {
    if (!Creator.isSpaceAdmin()) {
      return false;
    }

    var record = Creator.odata.get("contacts", record_id, "account,user", "account($select=is_customer)");

    if (record && record.account && record.account.is_customer && !record.user) {
      return true;
    }
  },
  viewCustomerSpaceUser: function viewCustomerSpaceUser() {
    var record = Creator.odata.query("space_users", {
      $filter: "(user eq '".concat(this.record.user, "')")
    }, true);
    FlowRouter.go(Creator.getObjectRouterUrl("space_users", record[0]._id));
  },
  viewCustomerSpaceUserVisible: function viewCustomerSpaceUserVisible(object_name, record_id, record_permissions) {
    if (!Creator.isSpaceAdmin()) {
      return false;
    }

    var record = Creator.odata.get("contacts", record_id, "account,user", "account($select=is_customer)");

    if (record && record.user) {
      var spaceUser = Creator.odata.query("space_users", {
        $filter: "(user eq '".concat(record.user, "')"),
        $select: "is_customer"
      }, true);

      if (spaceUser[0].is_customer) {
        return true;
      }
    }
  },
  disableCustomerSpaceUser: function disableCustomerSpaceUser(object_name, record_id, fields) {
    text = '将禁用与此客户关联的外部用户。 是否确定？';
    swal({
      title: "禁用客户账户",
      text: "<div>" + text + "</div>",
      html: true,
      showCancelButton: true,
      confirmButtonText: t('YES'),
      cancelButtonText: t('NO')
    }, function (confirm) {
      if (confirm) {
        $("body").addClass("loading");
        var userSession = Creator.USER_CONTEXT;
        var spaceId = userSession.spaceId;
        var authToken = userSession.authToken ? userSession.authToken : userSession.user.authToken;
        var url = "/api/v4/contacts/" + record_id + "/disable_customer_spaceuser";
        url = Steedos.absoluteUrl(url);

        try {
          var authorization = "Bearer " + spaceId + "," + authToken;
          var headers = [{
            name: 'Content-Type',
            value: 'application/json'
          }, {
            name: 'Authorization',
            value: authorization
          }];
          $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            contentType: 'application/json',
            beforeSend: function beforeSend(XHR) {
              if (headers && headers.length) {
                return headers.forEach(function (header) {
                  return XHR.setRequestHeader(header.name, header.value);
                });
              }
            },
            success: function success(data) {
              $("body").removeClass("loading");
              toastr.success(t('已禁用客户账户'));
            },
            error: function error(XMLHttpRequest, textStatus, errorThrown) {
              console.error(XMLHttpRequest.responseJSON);
              $("body").removeClass("loading");

              if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON.error) {
                toastr.error(t(XMLHttpRequest.responseJSON.error.replace(/:/g, '：')));
              } else {
                toastr.error(XMLHttpRequest.responseJSON);
              }
            }
          });
        } catch (err) {
          console.error(err);
          toastr.error(err);
          $("body").removeClass("loading");
        }
      }

      sweetAlert.close();
    });
  },
  disableCustomerSpaceUserVisible: function disableCustomerSpaceUserVisible(object_name, record_id, record_permissions) {
    if (!Creator.isSpaceAdmin()) {
      return false;
    }

    var record = Creator.odata.get("contacts", record_id, "account,user", "account($select=is_customer)");

    if (record && record.user) {
      var spaceUser = Creator.odata.query("space_users", {
        $filter: "(user eq '".concat(record.user, "')"),
        $select: "is_customer"
      }, true);

      if (spaceUser[0].is_customer) {
        return true;
      }
    }
  },
  createSupplierSpaceUser: function createSupplierSpaceUser() {
    var objectName = "space_users";
    var object = Creator.getObject(objectName);
    var collection_name = object.label;
    Session.set("action_collection", "Creator.Collections." + objectName);
    Session.set("action_collection_name", collection_name);
    Session.set("action_save_and_insert", false);
    Session.set("cmDoc", Object.assign({
      is_supplier: true,
      contact_id: this.record._id,
      profile: 'supplier'
    }, this.record));
    console.log("this.record", Object.assign({
      is_supplier: true
    }, this.record));
    Meteor.defer(function () {
      $(".creator-add").click();
    });
  },
  createSupplierSpaceUserVisible: function createSupplierSpaceUserVisible(object_name, record_id, record_permissions) {
    if (!Creator.isSpaceAdmin()) {
      return false;
    }

    var record = Creator.odata.get("contacts", record_id, "account,user", "account($select=is_supplier)");

    if (record && record.account && record.account.is_supplier && !record.user) {
      return true;
    }
  },
  viewSupplierSpaceUser: function viewSupplierSpaceUser() {
    var record = Creator.odata.query("space_users", {
      $filter: "(user eq '".concat(this.record.user, "')")
    }, true);
    FlowRouter.go(Creator.getObjectRouterUrl("space_users", record[0]._id));
  },
  viewSupplierSpaceUserVisible: function viewSupplierSpaceUserVisible(object_name, record_id, record_permissions) {
    if (!Creator.isSpaceAdmin()) {
      return false;
    }

    var record = Creator.odata.get("contacts", record_id, "account,user", "account($select=is_supplier)");

    if (record && record.user) {
      var spaceUser = Creator.odata.query("space_users", {
        $filter: "(user eq '".concat(record.user, "')"),
        $select: "is_supplier"
      }, true);

      if (spaceUser[0].is_supplier) {
        return true;
      }
    }
  },
  disableSupplierSpaceUser: function disableSupplierSpaceUser(object_name, record_id, fields) {
    text = '将禁用与此供应商关联的外部用户。 是否确定？';
    swal({
      title: "禁用供应商账户",
      text: "<div>" + text + "</div>",
      html: true,
      showCancelButton: true,
      confirmButtonText: t('YES'),
      cancelButtonText: t('NO')
    }, function (confirm) {
      if (confirm) {
        $("body").addClass("loading");
        var userSession = Creator.USER_CONTEXT;
        var spaceId = userSession.spaceId;
        var authToken = userSession.authToken ? userSession.authToken : userSession.user.authToken;
        var url = "/api/v4/contacts/" + record_id + "/disable_supplier_spaceuser";
        url = Steedos.absoluteUrl(url);

        try {
          var authorization = "Bearer " + spaceId + "," + authToken;
          var headers = [{
            name: 'Content-Type',
            value: 'application/json'
          }, {
            name: 'Authorization',
            value: authorization
          }];
          $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            contentType: 'application/json',
            beforeSend: function beforeSend(XHR) {
              if (headers && headers.length) {
                return headers.forEach(function (header) {
                  return XHR.setRequestHeader(header.name, header.value);
                });
              }
            },
            success: function success(data) {
              $("body").removeClass("loading");
              toastr.success(t('已禁用客户账户'));
            },
            error: function error(XMLHttpRequest, textStatus, errorThrown) {
              console.error(XMLHttpRequest.responseJSON);
              $("body").removeClass("loading");

              if (XMLHttpRequest.responseJSON && XMLHttpRequest.responseJSON.error) {
                toastr.error(t(XMLHttpRequest.responseJSON.error.replace(/:/g, '：')));
              } else {
                toastr.error(XMLHttpRequest.responseJSON);
              }
            }
          });
        } catch (err) {
          console.error(err);
          toastr.error(err);
          $("body").removeClass("loading");
        }
      }

      sweetAlert.close();
    });
  },
  disableSupplierSpaceUserVisible: function disableSupplierSpaceUserVisible(object_name, record_id, record_permissions) {
    if (!Creator.isSpaceAdmin()) {
      return false;
    }

    var record = Creator.odata.get("contacts", record_id, "account,user", "account($select=is_supplier)");

    if (record && record.user) {
      var spaceUser = Creator.odata.query("space_users", {
        $filter: "(user eq '".concat(record.user, "')"),
        $select: "is_supplier"
      }, true);

      if (spaceUser[0].is_supplier) {
        return true;
      }
    }
  }
};