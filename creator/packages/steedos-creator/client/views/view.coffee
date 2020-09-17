loadRecordFromOdata = (template, objectName, recordId)->
	template.record.set({});
	object = Creator.getObject(objectName)
	selectFields = Creator.objectOdataSelectFields(object)
	expand = Creator.objectOdataExpandFields(object)
	if objectName == "space_users"
		# 用户详细界面额外请求company_ids对应的admins，以方便确认当前用户是否有权限编辑、删除该记录
		expand = expand.replace(/\bcompany_ids\b/,"company_ids($select=name,admins)")
	record = Creator.odata.get(objectName, recordId, selectFields, expand)
	template.record.set(record)

getRelatedListTemplateId = (related_object_name)->
	return "steedos-list-related-#{related_object_name}"

Template.creator_view.onCreated ->
	Template.creator_view.currentInstance = this
	this.recordsTotal = new ReactiveVar({})
	this.__schema = new ReactiveVar({})
	# this.recordLoad = new ReactiveVar(false)
	this.record = new ReactiveVar()
	this.agreement = new ReactiveVar()
	templateData = Template.instance().data
	objectApiName = templateData?.objectApiName
	recordId = templateData?.recordId
	if !objectApiName or !recordId
		return
	this.objectApiName = objectApiName
	this.recordId = recordId
	object = Creator.getObject(objectApiName)
	template = Template.instance()
	this.onEditSuccess = onEditSuccess = (formType,result)->
#		loadRecordFromOdata(template, Session.get("object_name"), Session.get("record_id"))
		$('#afModal').modal('hide')
		FlowRouter.reload()
	this.agreement.set('odata')
	AutoForm.hooks creatorEditForm:
		onSuccess: onEditSuccess
	,false
	self = this
	getSchema = ()->
		schema = new SimpleSchema(Creator.getObjectSchema(Creator.getObject(objectApiName)))
		#在只读页面将omit字段设置为false
		_.forEach schema._schema, (f, key)->
			if f.autoform?.omit
				f.autoform.omit = false
		return schema

	Tracker.nonreactive ()->
		loadRecord(self.objectApiName, self.recordId)

	self.__schema.set(getSchema())
	Tracker.nonreactive ()->
		if !_.isEmpty(self.record.get())
			FormManager.runHook(self.objectApiName, 'view', 'before', {schema: self.__schema, record: self.record});

#	if object.database_name && object.database_name != 'meteor-mongo'
#		this.agreement.set('odata')
#		AutoForm.hooks creatorEditForm:
#			onSuccess: onEditSuccess
#		,false
#	else
#		this.agreement.set('subscribe')

loadRecord = (objectName, recordId)->
	if objectName == "users"
		return
	# recordId = Session.get "record_id"
	object = Creator.getObject(objectName)

	# if Meteor.loggingIn() || Meteor.loggingOut() || !Meteor.userId()
	# 	return;

	object_fields = object.fields
#	if objectName and recordId
#		if !object.database_name || !object.database_name == 'meteor-mongo'
#			fields = Creator.getFields(objectName)
#			ref_fields = {}
#			_.each fields, (f)->
#				if f.indexOf(".")  < 0
#					ref_fields[f] = 1
#			Creator.subs["Creator"].subscribe "steedos_object_tabular", "creator_" + objectName, [recordId], ref_fields, Session.get("spaceId")
#		else
#			loadRecordFromOdata(Template.instance(), objectName, recordId)
	if objectName and recordId
		loadRecordFromOdata(Template.instance(), objectName, recordId)

addFieldInfo = (element)->
	if element.view?.isDestroyed
		return
	element.$(".has-inline-text").each ->
		id = "info_" + $(this).attr("for").replace(".", "_")
		html = """
						<span class="help-info" id="#{id}">
							<i class="ion ion-information-circled"></i>
						</span>
					"""
		$(".slds-form-element__label", $(this)).append(html)

	element.$(".info-popover").each ->
		_id = $("~ .slds-form-element .help-info", $(this)).attr("id");
		$(this).dxPopover
			target: "#" + _id,
			showEvent: "mouseenter",
			hideEvent: "mouseleave",
			position: "top",
			width: 300,
			animation: {
				show: {
					type: "pop",
					from: {
						scale: 0
					},
					to: {
						scale: 1
					}
				},
				hide: {
					type: "fade",
					from: 1,
					to: 0
				}
			}

Template.creator_view.onRendered ->
	self = this
	# this.autorun ->
	# 	record_id = Session.get("record_id")
	# 	if record_id
	# 		$(".creator-view-tabs-link").closest(".slds-tabs_default__item").removeClass("slds-is-active")
	# 		$(".creator-view-tabs-link").attr("aria-selected", false)

	# 		$(".creator-view-tabs-link[data-tab='creator-quick-form']").closest(".slds-tabs_default__item").addClass("slds-is-active")
	# 		$(".creator-view-tabs-link[data-tab='creator-quick-form']").attr("aria-selected", false)

	# 		$(".creator-view-tabs-content").removeClass("slds-show").addClass("slds-hide")
	# 		$("#creator-quick-form").addClass("slds-show")
	# this.autorun ->
	# 	record_id = Session.get("record_id")
	# 	if record_id
	# 		Tracker.nonreactive(loadRecord)


	Meteor.setTimeout ()->
		Tracker.nonreactive ()->
			FormManager.runHook(self.objectApiName, 'view', 'after', {schema: self.__schema, record: self.record});
	,10


	# if Steedos.isMobile()
	# 	this.autorun ->
	# 		loadRecord()
	# else
	# 	this.autorun ->
	# 		if Session.get("record_id")
	# 			Tracker.nonreactive(loadRecord)

	# this.autorun ->
	# 	if Creator.subs["Creator"].ready()
	# 		Template.instance().recordLoad.set(true)

	Meteor.defer ()->
		addFieldInfo(self)

Template.creator_view.helpers Creator.helpers

Template.creator_view.helpers
	form_horizontal: ()->
		if Session.get("app_id") == "admin"
			return window.innerWidth > (767 + 250)
		else
			return window.innerWidth > 767

	hasUnObjectField: (t)->
		r = false;
		objectApiName = Template.instance().objectApiName
		unless objectApiName
			return r

		if t && t.length > 0
			_object = Creator.getObject(objectApiName)
			_.find t, (fieldKey)->
				if !fieldKey
					return
				field = _object.fields[fieldKey]
				if field
					if _object.schema._schema[fieldKey]?.type?.name != 'Object'
						r = true;
					if field.type == 'lookup' || field.type == 'master_detail'
						reference_to = field.reference_to
						if _.isFunction(reference_to)
							reference_to = reference_to()
						if _.isArray(reference_to)
							r = true;
					return r;
		return r;

	isObjectField: (fieldKey)->
		if !fieldKey
			return
		objectApiName = Template.instance().objectApiName
		unless objectApiName
			return
		_object = Creator.getObject(objectApiName)
		return _object.schema._schema[fieldKey]?.type?.name == 'Object' && _object.fields[fieldKey].type != 'lookup' && _object.fields[fieldKey].type != 'master_detail'

	objectField: (fieldKey)->
		objectApiName = Template.instance().objectApiName
		unless objectApiName
			return
		schema = Creator.getObject(objectApiName).schema
		name = schema._schema[fieldKey].label
		schemaFieldKeys = _.map(schema._objectKeys[fieldKey + '.'], (k)->
			return fieldKey + '.' + k
		)
		schemaFieldKeys = schemaFieldKeys.filter (key)->
			# 子表字段不应该显示hidden字段
			schemaFieldItem = schema._schema[key]
			if schemaFieldItem
				return !(schemaFieldItem.autoform?.type == "hidden")
			else
				return false

		fields = Creator.getFieldsForReorder(schema._schema, schemaFieldKeys)
		console.log(schema)
		console.log(schemaFieldKeys)
		console.log(fields)
		return {
			name: name
			fields: fields
		}

	collection: ()->
		objectApiName = Template.instance().objectApiName
		unless objectApiName
			return
		return "Creator.Collections." + Creator.getObject(objectApiName)?._collection_name

	schema: ()->
		return Template.instance().__schema?.get()

	schemaFields: ()->
		objectApiName = Template.instance().objectApiName
		if !objectApiName
			return
		object = Creator.getObject(objectApiName)
		simpleSchema = Template.instance().__schema?.get()
		schema = simpleSchema._schema
		# 不显示created/modified，因为它们显示在created_by/modified_by字段后面
		firstLevelKeys = _.without simpleSchema._firstLevelSchemaKeys, "created", "modified"
		permission_fields = Creator.getFields()

#		_.forEach schema, (field, name)->
#			if field.type == Object && field.autoform
#				field.autoform.type = 'hidden'

		fieldGroups = []
		fieldsForGroup = []

		grouplessFields = []
		grouplessFields = Creator.getFieldsWithNoGroup(schema)
		grouplessFields = Creator.getFieldsInFirstLevel(firstLevelKeys, grouplessFields)
		if permission_fields
			grouplessFields = _.intersection(permission_fields, grouplessFields)
#		grouplessFields = Creator.getFieldsWithoutOmit(schema, grouplessFields)
		grouplessFields = Creator.getFieldsForReorder(schema, grouplessFields)

		fieldGroupNames = Creator.getSortedFieldGroupNames(schema)
		_.each fieldGroupNames, (fieldGroupName) ->
			fieldsForGroup = Creator.getFieldsForGroup(schema, fieldGroupName)
			fieldsForGroup = Creator.getFieldsInFirstLevel(firstLevelKeys, fieldsForGroup)
			if permission_fields
				fieldsForGroup = _.intersection(permission_fields, fieldsForGroup)
#			fieldsForGroup = Creator.getFieldsWithoutOmit(schema, fieldsForGroup)
			fieldsForGroup = Creator.getFieldsForReorder(schema, fieldsForGroup)
			fieldGroups.push
				name: fieldGroupName
				fields: fieldsForGroup

		finalFields =
			grouplessFields: grouplessFields
			groupFields: fieldGroups

		return finalFields

	keyValue: (key) ->
		record = Template.instance().record?.get();
#		return record[key]
		key.split('.').reduce (o, x) ->
				o?[x]
		, record

	keyField: (key) ->
		fields = Creator.getObject(Template.instance().objectApiName)?.fields
		return fields?[key]

	is_wide: (key) ->
		fields = Creator.getObject(Template.instance().objectApiName).fields
		return fields[key]?.is_wide

	full_screen: (key) ->
		fields = Creator.getObject(Template.instance().objectApiName).fields
		if fields[key]?.type is "markdown"
			return true
		else
			return false

	label: (key) ->
		return AutoForm.getLabelForField(key)

	# hasPermission: (permissionName)->
	# 	permissions = Creator.getObject()?.permissions?.default
	# 	if permissions
	# 		return permissions[permissionName]

	record: ()->
		record = Template.instance().record?.get();
		if _.isEmpty(record)
			return false
		else
			return record

	record_name: ()->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		if !objectApiName or !recordId
			return
		name_field_key = Creator.getObject(objectApiName)?.NAME_FIELD_KEY
		record = Template.instance().record?.get();
		if !_.isEmpty(record) and name_field_key
			record_name = record.label || record[name_field_key]
			Session.set('record_name', record_name)
		return record_name;

	backUrl: ()->
		return Creator.getObjectUrl(Template.instance().objectApiName, null)

	showForm: ()->
		record = Template.instance().record?.get();
		if _.isEmpty(record)
			return false
		else
			return true

	hasPermission: (permissionName)->
		permissions = Creator.getPermissions()
		if permissions
			return permissions[permissionName]

	recordPerminssion: (permissionName)->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		if !objectApiName or !recordId
			return
		record = Creator.getCollection(objectApiName).findOne recordId
		recordPerminssion = Creator.getRecordPermissions objectApiName, record, Meteor.userId()
		if recordPerminssion
			return recordPerminssion[permissionName]


	object: ()->
		return Creator.getObject()

	object_name: ()->
		return Template.instance().objectApiName

	related_list: ()->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		if !objectApiName or !recordId
			return
		return Creator.getRelatedList(objectApiName, recordId)

	related_object_label: (relatedListObjLabel, relatedObjLabel) ->
		return relatedListObjLabel || relatedObjLabel

	related_list_count: (obj)->
		if obj
			object_name = obj.object_name
			recordsTotal = Template.instance().recordsTotal.get()
			if !_.isEmpty(recordsTotal) and object_name
				return recordsTotal[object_name]

	# related_selector: ()->
	# 	object_name = this.object_name
	# 	related_field_name = this.related_field_name
	# 	record_id = Session.get "record_id"
	# 	if object_name and related_field_name and Session.get("spaceId")
	# 		if object_name == "cfs.files.filerecord"
	# 			selector = {"metadata.space": Session.get("spaceId")}
	# 		else
	# 			selector = {space: Session.get("spaceId")}
	# 		if object_name == "cms_files" || object_name == "tasks" || object_name == "notes"
	# 			# 附件的关联搜索条件是定死的
	# 			selector["#{related_field_name}.o"] = Session.get "object_name"
	# 			selector["#{related_field_name}.ids"] = [record_id]
	# 		else if object_name == "instances"
	# 			instances = Creator.getObjectRecord()?.instances || []
	# 			selector["_id"] = { $in: _.pluck(instances, "_id") }
	# 		else if Session.get("object_name") == "objects"
	# 			recordObjectName = Creator.getObjectRecord()?.name
	# 			selector[related_field_name] = recordObjectName
	# 		else
	# 			selector[related_field_name] = record_id
	# 		permissions = Creator.getPermissions(object_name)
	# 		if permissions.viewAllRecords
	# 			return selector
	# 		else if permissions.allowRead and Meteor.userId()
	# 			selector.owner = Meteor.userId()
	# 			return selector
	# 	return {_id: "nothing to return"}

	appName: ()->
		app = Creator.getApp()
		return app?.name

	related_object: ()->
		return Creator.getObject(this.object_name)

	allowCreate: ()->
		return Creator.getRecordRelatedListPermissions(Session.get('object_name'), this).allowCreate
	relatedActions: ()->
		if this.actions || this.object_name == 'process_instance_history'
			relatedActionsName = this.actions || ['approve', 'reject', 'reassign', 'recall']
			objectName = this.object_name
			actions = Creator.getActions(objectName);
			actions = _.filter actions, (action)->
				if _.include(relatedActionsName, action.name)
					if typeof action.visible == "function"
						return action.visible(objectName)
					else
						return action.visible
				else
					return false
			return actions

	isUnlocked: ()->
		objectApiName = Template.instance().objectApiName
		if !objectApiName
			return
		if Creator.getPermissions(objectApiName).modifyAllRecords
			return true
		record = Template.instance().record?.get();
		return !record?.locked

	detail_info_visible: ()->
		return Session.get("detail_info_visible")

	actions: ()->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		if !objectApiName or !recordId
			return
		actions = Creator.getActions(objectApiName)
		record = Template.instance().record?.get()
		if recordId and !_.isEmpty(record)
			userId = Meteor.userId()
			record_permissions = Creator.getRecordPermissions objectApiName, record, userId
			actions = _.filter actions, (action)->
				if action.on == "record" or action.on == "record_only"
					if typeof action.visible == "function"
						return action.visible(objectApiName, recordId, record_permissions, record)
					else
						return action.visible
				else
					return false
			return actions

	moreActions: ()->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		if !objectApiName or !recordId
			return
		actions = Creator.getActions(objectApiName)
		record = Template.instance().record?.get();
		if recordId and !_.isEmpty(record)
			userId = Meteor.userId()
			record_permissions = Creator.getRecordPermissions objectApiName, record, userId
			actions = _.filter actions, (action)->
				if action.on == "record_more" or action.on == "record_only_more"
					if typeof action.visible == "function"
						return action.visible(objectApiName, recordId, record_permissions, record)
					else
						return action.visible
				else
					return false
			return actions

	isFileDetail: ()->
		return "cms_files" == Template.instance().objectApiName

	related_object_url: ()->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		if !objectApiName or !recordId
			return
		app_id = Session.get "app_id"
		related_object_name = this.object_name
		return Creator.getRelatedObjectUrl(objectApiName, app_id, recordId, related_object_name)

	cell_data: (key)->
		objectApiName = Template.instance().objectApiName
		if !objectApiName
			return
		record = Template.instance().record?.get();
		if _.isEmpty(record)
			return {}
		data = {}
		data._id = record._id
		data.val = record[key]
		data.doc = record
		data.field = Creator.getObject(objectApiName).fields[key]
		data.field_name = key
		data.object_name = objectApiName
		data.disabled = true
		data.parent_view = "record_details"
		return data

	list_data: (item) ->
		objectApiName = Template.instance().objectApiName
		recordId = Template.instance().recordId
		if !objectApiName or !recordId
			return {}
		record = Template.instance().record?.get();
		if _.isEmpty(record)
			return {}
		related_list_item_props = item
		related_object_name = item.object_name
		data = {
			id: getRelatedListTemplateId(related_object_name)
			related_object_name: related_object_name, 
			objectApiName: objectApiName, 
			listName: Creator.getListView(related_object_name, "all")._id,
			recordId: recordId
			recordsTotal: Template.instance().recordsTotal, 
			is_related: true, 
			related_list_item_props: related_list_item_props
		}
		if objectApiName == 'objects'
			data.recordId = record?.name
		else
			data.recordId = recordId
		return data

	enable_chatter: ()->
		objectApiName = Template.instance().objectApiName
		if !objectApiName
			return
		return Creator.getObject(objectApiName)?.enable_chatter

	show_chatter: ()->
		record = Template.instance().record?.get();
		return record

	agreement: ()->
		return Template.instance().agreement.get()
	
	showRightSidebar: ()->
		return false

	showEditIcon: ()->
		return Steedos.isMobile() && this.name == 'standard_edit'

	hasInlineHelpText: (key)->
		objectApiName = Template.instance().objectApiName
		if !objectApiName
			return
		fields = Creator.getObject(objectApiName).fields
		return fields[key]?.inlineHelpText

	showBack: ()->
		# objectApiName = Template.instance().objectApiName
		# record_id = Template.instance().record_id
		# if !objectApiName or !record_id
		# 	return
		# if record_id && (_.has(FlowRouter.current()?.queryParams, 'ref'))
		# 	return false
		# # return true
		# 先不显示返回按钮 【相关记录的链接，不要弹出新窗口 #461】
		return false

Template.creator_view.events

	'click .record-action-custom': (event, template) ->
		console.log('click action');
		objectApiName = template.objectApiName
		recordId = template.recordId
		record = template.record?.get();
		object = Creator.getObject(objectApiName)
		collection_name = object.label
		Session.set("action_fields", undefined)
		Session.set("action_collection", "Creator.Collections.#{object._collection_name}")
		Session.set("action_collection_name", collection_name)
		Session.set("action_save_and_insert", true)
		if this.todo == "standard_delete"
			action_record_title = record[object.NAME_FIELD_KEY]
			Creator.executeAction objectApiName, this, recordId, action_record_title, Session.get("list_view_id")
		else
			Creator.executeAction objectApiName, this, recordId, $(event.currentTarget)

	'click .creator-view-tabs-link': (event) ->
		$(".creator-view-tabs-link").closest(".slds-tabs_default__item").removeClass("slds-is-active")
		$(".creator-view-tabs-link").attr("aria-selected", false)

		$(event.currentTarget).closest(".slds-tabs_default__item").addClass("slds-is-active")
		$(event.currentTarget).attr("aria-selected", true)

		tab = "#" + event.currentTarget.dataset.tab
		$(".creator-view-tabs-content").removeClass("slds-show").addClass("slds-hide")
		$(tab).removeClass("slds-hide").addClass("slds-show")


	'click .slds-truncate > a': (event) ->
		template = Template.instance()
		Session.set("detail_info_visible", false)
		Tracker.afterFlush ()->
			Session.set("detail_info_visible", true)
			Meteor.defer ()->
				addFieldInfo(template)

	'dblclick .slds-table td': (event) ->
		$(".table-cell-edit", event.currentTarget).click();

	'dblclick #creator-quick-form .slds-form-element': (event) ->
		$(".table-cell-edit", event.currentTarget).click();

#	'click #creator-tabular .table-cell-edit': (event, template) ->
#		field = this.field_name
#		if this.field.depend_on && _.isArray(this.field.depend_on)
#			field = _.clone(this.field.depend_on)
#			field.push(this.field_name)
#			field = field.join(",")
#
#		object_name = this.object_name
#		collection_name = Creator.getObject(object_name).label
#
#		dataTable = $(event.currentTarget).closest('table').DataTable()
#		tr = $(event.currentTarget).closest("tr")
#		rowData = dataTable.row(tr).data()
#
#		if rowData
#			Session.set("action_fields", field)
#			Session.set("action_collection", "Creator.Collections.#{object_name}")
#			Session.set("action_collection_name", collection_name)
#			Session.set("action_save_and_insert", false)
#			Session.set 'cmDoc', rowData
#
#			Meteor.defer ()->
#				$(".btn.creator-cell-edit").click()

	'click .group-section-control': (event, template) ->
		$(event.currentTarget).closest('.group-section').toggleClass('slds-is-open')

	'click .add-related-object-record': (event, template) ->
		objectName = event.currentTarget.dataset.objectName
		collection_name = Creator.getObject(objectName).label
		collection = "Creator.Collections.#{Creator.getObject(objectName)._collection_name}"
		objectApiName = template.objectApiName
		recordId = template.recordId

#		relatedKey = ""
#		relatedValue = Session.get("record_id")
#		Creator.getRelatedList(current_object_name, relatedValue).forEach (related_obj) ->
#			if objectName == related_obj.object_name
#				relatedKey = related_obj.related_field_name
		
		ids = Creator.TabularSelectedIds[objectName]
		if ids?.length
			# 列表有选中项时，取第一个选中项，复制其内容到新建窗口中
			# 这的第一个指的是第一次勾选的选中项，而不是列表中已勾选的第一项
			record_id = ids[0]
			doc = Creator.odata.get(objectName, record_id)
			Session.set 'cmDoc', doc
			# “保存并新建”操作中自动打开的新窗口中需要再次复制最新的doc内容到新窗口中
			Session.set 'cmShowAgainDuplicated', true
		else
			defaultDoc = FormManager.getRelatedInitialValues(objectApiName, recordId, objectName);
			if !_.isEmpty(defaultDoc)
				Session.set 'cmDoc', defaultDoc

#		else if objectApiName == "objects"
#			recordObjectName = Creator.getObjectRecord().name
#			Session.set 'cmDoc', {"#{relatedKey}": recordObjectName}
#		else if relatedKey
#			Session.set 'cmDoc', {"#{relatedKey}": {o: objectApiName, ids: [relatedValue]}}

		Session.set("action_fields", undefined)
		Session.set("action_collection", collection)
		Session.set("action_collection_name", collection_name)
		Session.set("action_save_and_insert", true)
		Meteor.defer ()->
			$(".creator-add-related").click()
		return

	'click .list-item-action': (event, template) ->
		actionKey = event.currentTarget.dataset.actionKey
		objectName = event.currentTarget.dataset.objectName
		recordId = event.currentTarget.dataset.recordId
		object = Creator.getObject(objectName)
		action = object.actions[actionKey]
		collection_name = object.label
		Session.set("action_fields", undefined)
		Session.set("action_collection", "Creator.Collections.#{object._collection_name}")
		Session.set("action_collection_name", collection_name)
		Session.set("action_save_and_insert", true)
		Creator.executeAction objectName, action, recordId

	'click .slds-table td': (event)->
		$(".slds-table td").removeClass("slds-has-focus")
		$(event.currentTarget).addClass("slds-has-focus")

	'click #creator-quick-form .table-cell-edit': (event, template)->
		# $(".creator-record-edit").click()
		objectApiName = template.objectApiName
		recordId = template.recordId
		full_screen = this.full_screen
		field = this.field_name
		_fs = field.split('.')
		schema = Creator.getObject(objectApiName).schema
		if _fs.length > 1
			_obj_fields = _.map(schema._objectKeys[_fs[0] + '.'], (k)->
				return _fs[0] + '.' + k
			)
			field = _fs[0] + ',' + _obj_fields.join(',')
		if this.field.type == 'grid'
			fieldName = this.field_name
			_obj_fields = _.map(schema._objectKeys[fieldName + '.$.'], (k)->
				return fieldName + '.$.' + k
			)
			_.map(_obj_fields, (key)->
				dependOn = schema._schema[key]?.autoform?.dependOn
				dependOns = []
				if _.isArray(dependOn) && dependOn.length > 0
					dependOns = dependOn.concat(dependOn)
				dependOns = _.uniq(_.compact(dependOns));
				if dependOns.length > 0
					field = field + ',' + dependOns.join(',')
			)
		else if this.field.depend_on && _.isArray(this.field.depend_on)
			field = _.clone(this.field.depend_on)
			field.push(this.field_name)
			field = field.join(",")
		object_name = this.object_name
		collection_name = Creator.getObject(object_name).label
		doc = Creator.odata.get(object_name, recordId)
		if doc
			Session.set("cmFullScreen", full_screen)
			Session.set("action_fields", field)
			Session.set("action_collection", "Creator.Collections.#{Creator.getObject(object_name)._collection_name}")
			Session.set("action_collection_name", collection_name)
			Session.set("action_save_and_insert", false)
#			cmDoc = {}
#			objectFields = Creator.getObject(object_name).fields
#			_.each doc, (v, k)->
#				if template.agreement.get() == 'subscribe'
#					cmDoc[k] =v
#				else
#					if (objectFields[k]?.type == 'lookup' || objectFields[k]?.type == 'master_detail') && objectFields[k]?.reference_to
#						if objectFields[k].multiple
#							cmDoc[k] =  _.pluck(doc[k], "_id")
#						else
#							cmDoc[k] = doc[k]?._id
#					else if( v && _.keys(v).length > 0 && !_.isArray(v) && _.isObject(v))
#						cmDoc[k] = {}
#						_.each _.keys(v), (_sk)->
#							cmDoc[k][_sk] = _.pluck(doc[k][_sk], "_id")
#					else
#						cmDoc[k] =v
#			Session.set 'cmDoc', cmDoc
			Session.set 'cmDoc', doc
			Meteor.defer ()->
				$(".btn.creator-edit").click()

	'change .input-file-upload': (event, template)->
		Creator.relatedObjectFileUploadHandler event, ()->
			dataset = event.currentTarget.dataset
			parent = dataset?.parent
			targetObjectName = dataset?.targetObjectName
			console.log("relatedObjectFileUploadHandler==targetObjectName==", targetObjectName);
			if Steedos.isMobile()
				Template.list.refresh getRelatedListTemplateId(targetObjectName)
			else
				gridContainerWrap = $(".related-object-tabular")
				dxDataGridInstance = gridContainerWrap.find(".gridContainer.#{targetObjectName}").dxDataGrid().dxDataGrid('instance')
				Template.creator_grid.refresh dxDataGridInstance

	
	'click .slds-tabs_card .slds-tabs_default__item': (event) ->
		currentTarget = $(event.currentTarget)
		if currentTarget.hasClass("slds-is-active")
			return
		currentIndex = currentTarget.index()
		currentTabContainer = currentTarget.closest(".slds-tabs_card")
		currentTarget.siblings(".slds-is-active").removeClass("slds-is-active").end().addClass("slds-is-active")
		currentTabContainer.find(">.slds-tabs_default__content.slds-show").toggleClass("slds-show").toggleClass("slds-hide")
		currentTabContainer.find(">.slds-tabs_default__content").eq(currentIndex).toggleClass("slds-show").toggleClass("slds-hide")
	'click .back-icon': (event, template)->
		app_id = Session.get("app_id")
		object = template.objectApiName
		if app_id && object
			FlowRouter.go Creator.getObjectRouterUrl(object, undefined, app_id)
		else if app_id
			FlowRouter.go "/app/#{app_id}"
		else
			FlowRouter.go "/app"
	'click .relate-action-custom': (event, template)->
		this.todo(template.objectApiName, template.recordId);

Template.creator_view.onDestroyed ()->
	console.log('Template.creator_view.onDestroyed...');
	self = this
	_.each(AutoForm._hooks.creatorEditForm.onSuccess, (fn, index)->
		if fn == self.onEditSuccess
			delete AutoForm._hooks.creatorEditForm.onSuccess[index]
	)