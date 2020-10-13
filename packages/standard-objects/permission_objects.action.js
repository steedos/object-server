const _ = require("underscore");
module.exports = {
    customize: function (object_name, record_id, fields) {
        var doc = Creator.odata.get(object_name, record_id);
        var newDoc = {}
        _.each(Creator.getObject(object_name).fields, function(v, k){
            if(_.has(doc, k)){
                newDoc[k] = doc[k]
            }
        })
        delete newDoc.is_system;

        let permissionSetId = doc.permission_set_id
        if(_.include(['admin','user','supplier','customer'], doc.permission_set_id)){
            let dbPst = Creator.odata.query('permission_set', {$select: "_id", $filter: "(name eq '"+doc.permission_set_id+"') and (space eq '"+Steedos.getSpaceId()+"')"}, true)
            if(dbPst && dbPst.length > 0){
                permissionSetId = dbPst[0]._id;
            }
            
            if(_.include(['admin','user','supplier','customer'], permissionSetId)){
                return toastr.error("请先自定义权限组")
            }
        }
        Creator.odata.insert(object_name, Object.assign(newDoc, {permission_set_id: permissionSetId}), function(result, error){
            if(result){
                if(Session.get("object_name") === 'permission_objects'){
                    FlowRouter.go("/app/-/".concat(object_name, "/view/").concat(result._id));
                }else{
                    href = Creator.getObjectUrl(object_name, result._id);
                    window.open(href,'_blank','width=800, height=600, left=50, top= 50, toolbar=no, status=no, menubar=no, resizable=yes, scrollbars=yes')
                }
            }
        });
    },
    customizeVisible: function(object_name, record_id, record_permissions, record){
        if(!record){
            record = {}
        }
        return Creator.baseObject.actions.standard_new.visible() && record.is_system;
    }
}