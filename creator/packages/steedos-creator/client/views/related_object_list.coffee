getRelatedListTemplateId = ()->
	return "steedos-list-related-object-list"

Template.related_object_list.helpers
	related_object_name: ()->
		return Template.instance().relatedObjectName

	related_object_label: ()->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		relatedObjectName = Template.instance().relatedObjectName
		if !objectApiName or !recordId or !relatedObjectName
			return ""
		relatedList = Creator.getRelatedList(objectApiName, recordId)
		relatedObj = _.find relatedList, (rl) ->
			return rl.object_name == relatedObjectName
		return relatedObj?.label || Creator.getObject(relatedObjectName).label

	is_file: ()->
		return Template.instance().relatedObjectName == "cms_files"

	object_label: ()->
		objectApiName = Template.instance().objectApiName
		return Creator.getObject(objectApiName).label
	
	record_name: ()->
		objectApiName = Template.instance().objectApiName
		name_field_key = Creator.getObject(objectApiName).NAME_FIELD_KEY
		return Template.instance()?.record.get()[name_field_key]

	record_url: ()->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		if !objectApiName or !recordId
			return ""
		return Creator.getObjectUrl(objectApiName, recordId)

	allowCreate: ()->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		relatedObjectName = Template.instance().relatedObjectName
		if !objectApiName or !recordId or !relatedObjectName
			return false
		relatedList = Creator.getRelatedList(objectApiName, recordId)
		related_list_item_props = relatedList.find((item)-> return item.object_name == relatedObjectName)
		return Creator.getRecordRelatedListPermissions(objectApiName, related_list_item_props).allowCreate

	isUnlocked: ()->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		if !objectApiName or !recordId
			return false
		if Creator.getPermissions(objectApiName).modifyAllRecords
			return true
		record = Creator.getObjectRecord(objectApiName, recordId)
		return !record?.locked

	hasPermission: (permissionName)->
		objectApiName = Template.instance().objectApiName
		permissions = Creator.getPermissions(objectApiName)
		if permissions
			return permissions[permissionName]

	recordsTotalCount: ()->
		return Template.instance().recordsTotal.get()
	
	list_data: () ->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		relatedObjectName = Template.instance().relatedObjectName
		if !objectApiName or !recordId or !relatedObjectName
			return {}
		relatedList = Creator.getRelatedList(objectApiName, recordId)
		related_list_item_props = relatedList.find((item)-> return item.object_name == relatedObjectName)
		data = {
			id: getRelatedListTemplateId(), 
			related_object_name: relatedObjectName, 
			objectApiName: objectApiName, 
			listName: Creator.getListView(relatedObjectName, "all")._id,
			recordId: recordId, 
			total: Template.instance().recordsTotal,
			is_related: true, 
			related_list_item_props: related_list_item_props,
			pageSize: 50
		}
		if objectApiName == 'objects'
			data.recordId = Template.instance()?.record.get().name;
		return data


Template.related_object_list.events
	"click .add-related-object-record": (event, template)->
		relatedObjectName = template.relatedObjectName
		objectApiName = template.objectApiName
		recordId = template.recordId
		if objectApiName == 'objects'
			recordId = template?.record?.get().name;
		action_collection_name = Creator.getObject(relatedObjectName).label
		
		ids = Creator.TabularSelectedIds[relatedObjectName]
		if ids?.length
			# 列表有选中项时，取第一个选中项，复制其内容到新建窗口中
			# 这的第一个指的是第一次勾选的选中项，而不是列表中已勾选的第一项
			recordId = ids[0]
			doc = Creator.odata.get(relatedObjectName, recordId)
			Session.set 'cmDoc', doc
			# “保存并新建”操作中自动打开的新窗口中需要再次复制最新的doc内容到新窗口中
			Session.set 'cmShowAgainDuplicated', true
		else 
			related_lists = Creator.getRelatedList(objectApiName, recordId)
			related_field_name = _.findWhere(related_lists, {object_name: relatedObjectName}).related_field_name
			if related_field_name
				Session.set 'cmDoc', Object.assign({"#{related_field_name}": recordId}, FormManager.getInitialValues(relatedObjectName))
		
		Session.set "action_collection", "Creator.Collections.#{relatedObjectName}"
		Session.set "action_collection_name", action_collection_name
		Meteor.defer ->
			$(".creator-add").click()

	'click .btn-refresh': (event, template)->
		if Steedos.isMobile()
			Template.list.refresh getRelatedListTemplateId()
		else
			dxDataGridInstance = $(event.currentTarget).closest(".related_object_list").find(".gridContainer").dxDataGrid().dxDataGrid('instance')
			Template.creator_grid.refresh(dxDataGridInstance)

	'change .input-file-upload': (event, template)->
		Creator.relatedObjectFileUploadHandler event, ()->
			if Steedos.isMobile()
				Template.list.refresh getRelatedListTemplateId()
			else
				dataset = event.currentTarget.dataset
				parent = dataset?.parent
				targetObjectName = dataset?.targetObjectName
				gridContainerWrap = $(event.currentTarget).closest(".related_object_list")
				dxDataGridInstance = gridContainerWrap.find(".gridContainer.#{targetObjectName}").dxDataGrid().dxDataGrid('instance')
				Template.creator_grid.refresh dxDataGridInstance


Template.related_object_list.onCreated ->
	this.recordsTotal = new ReactiveVar(0)
	this.record = new ReactiveVar({});
	self = this
	templateData = Template.instance().data
	objectApiName = templateData?.objectApiName
	recordId = templateData?.recordId
	relatedObjectName = templateData?.relatedObjectName
	if !objectApiName or !recordId or !relatedObjectName
		return
	self = this
	self.objectApiName = objectApiName
	self.recordId = recordId
	self.relatedObjectName = relatedObjectName
	this.autorun ()->
		_record = Creator.getCollection(objectApiName).findOne(recordId)
		if !_record
			_record = Creator.odata.get(objectApiName, recordId)
		self.record.set( _record || {})

