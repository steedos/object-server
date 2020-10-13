module.exports = {
    customize: function (object_name, record_id, fields) {
        var doc = Creator.odata.get(object_name, record_id)
        Creator.odata.insert(object_name, {name: doc.name, label: doc.label, type: doc.type}, function(result, error){
            if(result){
                FlowRouter.go("/app/-/".concat(object_name, "/view/").concat(result._id));
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