Steedos.PermissionSetManager = {};

Steedos.PermissionSetManager.changeSchema = function(doc, schema){
    var objectSchema = Creator.getObjectSchema(Creator.getObject("permission_set"));

    var hiddenField = function(fieldName){
        schema._schema[fieldName].autoform.omit = true;
        schema._schema[fieldName].autoform.type = 'hidden';
        schema._schema[fieldName].optional = true;
    }

    if(doc.type == 'profile'){
        hiddenField('users');
        schema._schema.license = objectSchema.license;
        schema._schema.license.optional = false;
        schema._schema.password_history = objectSchema.password_history;
        schema._schema.max_login_attempts = objectSchema.max_login_attempts;
        schema._schema.lockout_interval = objectSchema.lockout_interval;
        if(doc.name === 'supplier' || doc.name === 'customer'){
            schema._schema.is_external.autoform.readonly = true;
            schema._schema.is_external.autoform.disabled = true;
            doc.is_external = true;
        }else{
            schema._schema.is_external.autoform.readonly = false;
            schema._schema.is_external.autoform.disabled = false;
            doc.is_external = doc.is_external;
        }
    }else{
        hiddenField('is_external');
        hiddenField('password_history');
        hiddenField('max_login_attempts');
        hiddenField('lockout_interval');
        schema._schema.license.optional = true;
        schema._schema.license.defaultValue = null;
        schema._schema.license.autoform.defaultValue = null;
        schema._schema.users = objectSchema.users;
    }
}