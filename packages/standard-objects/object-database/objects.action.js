module.exports = {
  show_object: function (object_name, record_id, item_element) {
    var record = this.record || Creator.getObjectById(record_id);
    if(!record){
        return toastr.error("未找到记录");
    }

    if(record.is_enable === false){
        return toastr.warning("请先启动对象");
    }

    if(record.datasource && record.datasource != 'default'){
        var datasource = Creator.odata.get('datasources', record.datasource, 'is_enable');
        if(!datasource){
            return toastr.error("未找到数据源");
        }
        if(!datasource.is_enable){
            return toastr.warning("请先启动数据源");
        }
    }

    var allViews = Creator.odata.query('object_listviews', {
        $select: '_id',
        $filter: "(((contains(tolower(object_name),'".concat(record.name, "'))) and ((contains(tolower(name),'all'))))")
      }, true);

    if(allViews && allViews.length > 0){
        Steedos.openWindow(Creator.getRelativeUrl("/app/-/" + record.name + "/grid/" + allViews[0]._id))
    }else{
        Steedos.openWindow(Creator.getRelativeUrl("/app/-/" + record.name + "/grid/all"))
    }
  },
  show_objectVisible: function(object_name, record_id, record_permissions){
    if(!Creator.isSpaceAdmin()){
        return false
    }

    var record = Creator.odata.get("objects", record_id, "is_deleted");
    if(record && !record.is_deleted){
        return true;
    }
  },
  copy_odata: function (object_name, record_id, item_element) {
    var clipboard, o_name, path, record;
    record = this.record || Creator.getObjectById(record_id);
    //enable_api 属性未开放
    if ((record != null ? record.enable_api : void 0) || true) {
        o_name = record != null ? record.name : void 0;
        path = SteedosOData.getODataPath(Session.get("spaceId"), o_name);
        item_element.attr('data-clipboard-text', path);
        if (!item_element.attr('data-clipboard-new')) {
            clipboard = new Clipboard(item_element[0]);
            item_element.attr('data-clipboard-new', true);
            clipboard.on('success', function (e) {
                return toastr.success('复制成功');
            });
            clipboard.on('error', function (e) {
                toastr.error('复制失败');
                return console.error("e");
            });
            if (item_element[0].tagName === 'LI' || item_element.hasClass('view-action')) {
                return item_element.trigger("click");
            }
        }
    } else {
        return toastr.error('复制失败: 未启用API');
    }
  },
  copy_odataVisible: function(object_name, record_id, record_permissions){
    if(!Creator.isSpaceAdmin()){
        return false
    }

    var record = Creator.odata.get("objects", record_id, "is_deleted");
    if(record && !record.is_deleted){
        return true;
    }
  },
  standard_deleteVisible: function(object_name, record_id, record_permissions){
    if(!Creator.isSpaceAdmin()){
        return false
    }

    var record = Creator.odata.get("objects", record_id, "is_deleted");
    if(record && !record.is_deleted){
        return Creator.baseObject.actions.standard_delete.visible.apply(this, arguments);
    }
  }
  // export: function(object_name, record_id, fields){
  //   return window.open(Steedos.absoluteUrl("/api/v4/objects/" + record_id + "/export_yml"), '_blank');
  // }
}