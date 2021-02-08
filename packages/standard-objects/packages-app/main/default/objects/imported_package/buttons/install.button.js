module.exports = {
    install: function () {
        let object = {
            fields: {
                packageVersionId: {
                    type: 'text',
                    label: TAPi18n.__('package_version_field_installation_id'),
                    is_wide: true,
                    required: true
                },
                password: {
                    type: 'password',
                    label: TAPi18n.__('package_action_upload_form_install_password'),
                    is_wide: true
                }
            }
        }
        let schema = Creator.getObjectSchema(object);

        schema.password.autoform.autocomplete='new-password';

        let formId = 'installPackageForm';
        
        let onConfirm = function(formValues, e, t){
            $("body").addClass('loading');
            const data = formValues.insertDoc;
            var result = Steedos.authRequest(`/api/package/installing_from_store/info/${data.packageVersionId}`, {type: 'post', async: false, data: JSON.stringify({password: data.password})});
            if(!result){
                return $("body").removeClass('loading');
            }
            if(result.error){
                return toastr.error('请求的软件包尚不存在或已删除。如果这是最近创建的软件包版本，请在几分钟后重试，或联系软件包发布者。', '此应用程序无法安装【找不到软件包】');
            }
            let _schema = Creator.getObjectSchema(result.schema);
            let _doc = result.data;
            Modal.hide(t);
            Meteor.setTimeout(function(){
                const installPackage = function(formValues, e, t){
                    $("body").addClass('loading');
                    var result = Steedos.authRequest(`/api/package/installing_from_store/file/${data.packageVersionId}`, {type: 'post', async: false, data: JSON.stringify({password: data.password})});
                    if(!result){
                        return $("body").removeClass('loading');
                    }
                    if(result.error){
                        $("body").removeClass('loading');
                        return toastr.error(result.error);
                    }
                    Meteor.setTimeout(function(){
                        $("body").removeClass('loading');
                        toastr.success(TAPi18n.__('imported_package_action_install_success'));
                        FlowRouter.go("/app/-/imported_package/view/" + result._id);
                        Modal.hide(t);
                        window.location.reload();
                    }, 10 * 1000)
                }
                $("body").removeClass('loading');
                Modal.show("quickFormModal", {formId: formId, formType: 'readonly', modalSize: 'modal-lg', title: TAPi18n.__(`imported_package_action_install`), confirmBtnText: TAPi18n.__("Confirm"), schema: _schema, doc: _doc, onConfirm: installPackage}, {
                    backdrop: 'static',
                    keyboard: true
                });
            }, 800)
        }
        let doc = {};
        Modal.show("quickFormModal", {formId: formId, title: TAPi18n.__(`imported_package_action_install`), confirmBtnText: TAPi18n.__("Next"), schema: schema, doc: doc, onConfirm: onConfirm}, {
            backdrop: 'static',
            keyboard: true
        });
    },
    installVisible: function () {
        return true
    }
}