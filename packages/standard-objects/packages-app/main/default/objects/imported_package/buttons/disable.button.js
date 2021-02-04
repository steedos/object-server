module.exports = {

    disable: function(object_name, record_id, fields) {
        text = "将停用软件包。是否确定？";
        swal({
            title: "停用软件包",
            text: "<div>" + text + "</div>",
            html: true,
            showCancelButton: true,
            confirmButtonText: t('YES'),
            cancelButtonText: t('NO')
        }, function(confirm) {
            if (confirm) {
                Creator.odata.update(object_name, record_id, {
                    is_enable: false
                }).success(function(e){
                    toastr.success('软件包已停用');
                    FlowRouter.reload();
                })
            }
            sweetAlert.close();
        })
    },
    disableVisible: function(object_name, record_id, record_permissions) {
        if (!Creator.isSpaceAdmin()) {
            return false
        }
        var record = Creator.getCollection(object_name).findOne(record_id);
        if (record) {
            if (typeof record.is_enable != "undefined" && record.is_enable == false) {
                return false
            }
            return true
        }
        return false
    }

}