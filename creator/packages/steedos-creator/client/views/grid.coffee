_itemClick = (e, curObjectName, listName)->
	self = this
	record = e.data
	if !record
		return

	if _.isObject(record._id)
		record._id = record._id._value

	record_permissions = Creator.getRecordPermissions curObjectName, record, Meteor.userId()
	actions = _actionItems(curObjectName, record, record_permissions)

	if actions.length
		actionSheetItems = _.map actions, (action)->
			return {text: action.label, record: record, action: action, object_name: curObjectName}
	else
		actionSheetItems = [{text: t("creator_list_no_actions_tip")}]

	actionSheetOption =
		dataSource: actionSheetItems
		showTitle: false
		usePopover: true
		width: "auto"
		onItemClick: (value)->
			action = value.itemData.action
			recordId = value.itemData.record._id
			objectName = value.itemData.object_name
			object = Creator.getObject(objectName)
			collectionName = object.label
			name_field_key = object.NAME_FIELD_KEY
			if objectName == "organizations"
				# 显示组织列表时，特殊处理name_field_key为name字段
				name_field_key = "name"
			Session.set("action_fields", undefined)
			Session.set("action_collection", "Creator.Collections.#{objectName}")
			Session.set("action_collection_name", collectionName)
			Session.set("action_save_and_insert", true)
			if action.todo == "standard_delete"
				action_record_title = value.itemData.record[name_field_key]
				Creator.executeAction objectName, action, recordId, action_record_title, listName, value.itemData.record, ()->
					# 移除列表勾选中的id值，并刷新列表保持列表原来选中的id值集合状态
					selectedIds = Creator.TabularSelectedIds[objectName]
					Creator.TabularSelectedIds[objectName] = _.without(selectedIds, recordId)
					self.dxDataGridInstance?.refresh().done (result)->
						Creator.remainCheckboxState(self.dxDataGridInstance.$element())
			else
				Creator.executeAction objectName, action, recordId, value.itemElement
	if actions.length
		actionSheetOption.itemTemplate = "item"
	else
		actionSheetOption.itemTemplate = (itemData, itemIndex, itemElement)->
			itemElement.html "<span class='text-muted'>#{itemData.text}</span>"

	actionSheet = this.$(".action-sheet").dxActionSheet(actionSheetOption).dxActionSheet("instance")

	actionSheet.option("target", e.event.target);
	actionSheet.option("visible", true);

_actionItems = (objectApiName, record, record_permissions)->
	obj = Creator.getObject(objectApiName)
	actions = Creator.getActions(objectApiName)
	actions = _.filter actions, (action)->
		if action.on == "record" or action.on == "record_more" or action.on == "list_item"
			if typeof action.visible == "function"
				return action.visible(objectApiName, record._id, record_permissions, record)
			else
				return action.visible
		else
			return false
	return actions

_expandFields = (objectApiName, columns)->
	expand_fields = []
	fields = Creator.getObject(objectApiName).fields
	_.each columns, (n)->
		if fields[n]?.type == "master_detail" || fields[n]?.type == "lookup"
			if fields[n].reference_to
				ref = fields[n].reference_to
				if _.isFunction(ref)
					ref = ref()
			else
				ref = fields[n].optionsFunction({}).getProperty("value")

			if !_.isArray(ref)
				ref = [ref]

			ref = _.map ref, (o)->
				key = Creator.getObject(o)?.NAME_FIELD_KEY || "name"
				return key

			ref = _.compact(ref)

			ref = _.uniq(ref)

			ref = ref.join(",")

			if ref
				# expand_fields.push(n + "($select=" + ref + ")")
				expand_fields.push(n)
			# expand_fields.push n + "($select=name)"
	return expand_fields

getColumnItem = (object, list_view, column, list_view_sort, column_default_sort, column_sort_settings, is_related, defaultWidth)->

	field = object.fields[column]
	listViewColumns = list_view.columns
	listViewColumn = {field: column};

	_.every listViewColumns, (_column)->
		if _.isObject(_column)
			eq =  _column?.field == column
		else
			eq =  _column == column

		if eq
			listViewColumn = _column

		return !eq;

	if _.isString(listViewColumn)
		listViewColumn = {field: listViewColumn}

	columnWidth = listViewColumn?.width || ''
	if !columnWidth && Steedos.isMobile()
		columnWidth = "160px"

	columnItem =
		cssClass: "slds-cell-edit cell-type-#{field.type} cell-name-#{field.name}"
		caption: listViewColumn?.label || field.label || TAPi18n.__(object.schema.label(listViewColumn?.field))
		dataField: listViewColumn?.field
		alignment: "left"
		width: columnWidth
		cellTemplate: (container, options) ->
			field_name = column
			if /\w+\.\$\.\w+/g.test(field_name)
				# object类型带子属性的field_name要去掉中间的美元符号，否则显示不出字段值
				field_name = column.replace(/\$\./,"")
			# 需要考虑field_name为 a.b.c 这种格式
			field_val = eval("options.data." + field_name)
			cellOption = {_id: options.data._id, val: field_val, doc: options.data, field: field, field_name: field_name, object_name: object.name, agreement: "odata", is_related: is_related}
			if field.type is "markdown"
				cellOption["full_screen"] = true
			Blaze.renderWithData Template.creator_table_cell, cellOption, container[0]
	if listViewColumn?.wrap
		columnItem.cssClass += " cell-wrap"
	else
		columnItem.cssClass += " cell-nowrap"
		# 不换行的字段如果没配置宽度，则使用默认宽度
		# if !columnItem.width
		# 	columnItem.width = defaultWidth

	if column_sort_settings and column_sort_settings.length > 0
		_.each column_sort_settings, (sort)->
			if sort[0] == column
				columnItem.sortOrder = sort[1]
	else if !_.isEmpty(list_view_sort)
		_.each list_view_sort, (sort)->
			if sort[0] == column
				columnItem.sortOrder = sort[1]
	else
		#默认读取default view的sort配置
		_.each column_default_sort, (sort)->
			if sort[0] == column
				columnItem.sortOrder = sort[1]

	unless field.sortable
		columnItem.allowSorting = false

	return columnItem;

_columns = (objectApiName, columns, listName, is_related, related_list_item_props)->
	relatedSort = related_list_item_props.sort
	object = Creator.getObject(objectApiName)
	grid_settings = Creator.getCollection("settings").findOne({object_name: objectApiName, record_id: "object_gridviews"})
	column_default_sort = Creator.transformSortToDX(Creator.getObjectDefaultSort(objectApiName))
	if grid_settings and grid_settings.settings
		column_width_settings = grid_settings.settings[listName]?.column_width
		column_sort_settings = Creator.transformSortToDX(grid_settings.settings[listName]?.sort)
	list_view = Creator.getListView(objectApiName, listName)
	list_view_sort = Creator.transformSortToDX(list_view?.sort)
	if column_sort_settings and column_sort_settings.length > 0
		list_view_sort = column_sort_settings
	else if is_related && !_.isEmpty(relatedSort)
		list_view_sort = Creator.transformSortToDX(relatedSort)
	else if !_.isEmpty(list_view_sort)
		list_view_sort = list_view_sort
	else
		#默认读取default view的sort配置
		list_view_sort = column_default_sort
	result = columns.map (n,i)->
		defaultWidth = _defaultWidth(columns, object.enable_tree, i)
		if is_related && related_list_item_props.customRelatedListObject && related_list_item_props.columns
			list_view.columns = related_list_item_props.columns
		return getColumnItem(object, list_view, n, list_view_sort, column_default_sort, column_sort_settings, is_related, defaultWidth)
	if !_.isEmpty(list_view_sort)
		_.each list_view_sort, (sort,index)->
			sortColumn = _.findWhere(result,{dataField:sort[0]})
			if sortColumn
				sortColumn.sortOrder = sort[1]
				sortColumn.sortIndex = index
	return result

_defaultWidth = (columns, isTree, i)->
	if columns.length == i+1
		return null;
	column_counts = columns.length
	subWidth = if isTree then 46 else 46 + 60 + 60
	content_width = $(".gridContainer").width() - subWidth
	return content_width/column_counts

_getShowColumns = (curObject, selectColumns, is_related, listName, related_list_item_props) ->
	self = this
	curObjectName = curObject.name
	# 这里如果不加nonreactive，会因为后面customSave函数插入数据造成表Creator.Collections.settings数据变化进入死循环
	showColumns = Tracker.nonreactive ()-> return _columns(curObjectName, selectColumns, listName, is_related, related_list_item_props)
	actions = Creator.getActions(curObjectName)
	if true || !Steedos.isMobile() && actions.length
		showColumns.push
			dataField: "_id_actions"
			width: 46
			allowExporting: false
			allowSorting: false
			allowReordering: false
			headerCellTemplate: (container) ->
				return ""
			cellTemplate: (container, options) ->
				htmlText = """
					<span class="slds-grid slds-grid--align-spread creator-table-actions">
						<div class="forceVirtualActionMarker forceVirtualAction">
							<a class="rowActionsPlaceHolder slds-button slds-button--icon-x-small slds-button--icon-border-filled keyboardMode--trigger" aria-haspopup="true" role="button" title="" href="javascript:void(0);" data-toggle="dropdown">
								<span class="slds-icon_container slds-icon-utility-down">
									<span class="lightningPrimitiveIcon">
										#{Blaze.toHTMLWithData Template.steedos_button_icon, {class: "slds-icon slds-icon-text-default slds-icon--xx-small", source: "utility-sprite", name:"down"}}
									</span>
									<span class="slds-assistive-text" data-aura-rendered-by="15534:0">显示更多信息</span>
								</span>
							</a>
						</div>
					</span>
				"""
				$("<div>").append(htmlText).appendTo(container);

	if is_related || !curObject.enable_tree
		nameFieldKey = curObject.NAME_FIELD_KEY
		needToShowLinkForIndexColumn = false
		if selectColumns.indexOf(nameFieldKey) < 0
			needToShowLinkForIndexColumn = true
		if !Steedos.isMobile()
			isDetailView = self.data.recordsTotal and is_related; #详细界面相关列表
			if !isDetailView
				showColumns.splice 0, 0,
					dataField: "_id_checkbox"
					width: 30
					allowResizing: false
					allowExporting: false
					allowSorting: false
					allowReordering: false
					headerCellTemplate: (container) ->
						Blaze.renderWithData Template.creator_table_checkbox, {_id: "#", object_name: curObjectName}, container[0]
					cellTemplate: (container, options) ->
						Blaze.renderWithData Template.creator_table_checkbox, {_id: options.data._id, object_name: curObjectName}, container[0]

			showColumns.splice 0, 0,
				dataField: "_index"
				width: 50
				allowResizing: false
				alignment: "right"
				allowExporting: true
				allowSorting: false
				allowReordering: false
				caption: ""
				cellTemplate: (container, options) ->
					pageSize = self.dxDataGridInstance.pageSize()
					pageIndex = self.dxDataGridInstance.pageIndex()
					htmlText = options.rowIndex + 1 + pageSize * pageIndex
					showLink = needToShowLinkForIndexColumn
					unless showLink
						# 当没配置name字段显示在列表视图中时，默认是不给序号列加链接的，但是如果配置了，要不要加链接显示取决于当前记录的name字段是否有值
						showLink = !options.data?[nameFieldKey]
					if showLink
						href = Creator.getObjectUrl(curObjectName, options.data._id)
						htmlText = $("<a href=\"#{href}\" class=\"grid-index-link\">#{htmlText}</a>")
						# if is_related
						# 	htmlText.attr("onclick", Steedos.getOpenWindowScript(href))
						$("<div>").append(htmlText).appendTo(container)
					else
						$("<div>").append(htmlText).appendTo(container)
	_.every showColumns, (n)->
		n.sortingMethod = Creator.sortingMethod
	return showColumns;

# _getGridPaging = (objectApiName, listName) ->
# 	return Tracker.nonreactive ()->
# 		_grid_paging = Session.get('grid_paging')
# 		if _grid_paging?.object_name == objectApiName && _grid_paging?.list_view_id == listName
# 			return _grid_paging

_getPageSize = (is_related, selfPageSize) ->
	# localPageSize = localStorage.getItem("creator_pageSize:"+Meteor.userId())
	# if !is_related and localPageSize
	# 	pageSize = localPageSize
	if selfPageSize
		pageSize = selfPageSize
	else if is_related
		pageSize = 5
	else
		pageSize = 8
	return pageSize

getObjectpaging = (objectName)->
	return Creator.getObject(objectName).paging

Template.creator_grid.onRendered ->
	self = this
	# self.autorun (c)->
	# if Session.get("object_home_component")
	# 	# 如果从grid界面切换到plugin自定义的object component则不需要执行下面的代码
	# 	return
	# Template.currentData() 这个代码不能删除，用于更新self.data中的数据
	# templateData = Template.currentData()
	is_related = self.data.is_related
	objectApiName = self.data.objectApiName
	listName = self.data.listName
	_pageSize = self.data.pageSize
	creator_obj = Creator.getObject(objectApiName)
	if !creator_obj
		return
	related_object_name = self.data.related_object_name
	# if is_related
	# 	listName = Creator.getListView(related_object_name, "all")._id
	unless listName
		toastr.error t("creator_list_view_permissions_lost")
		return

	# if !is_related
	# 	# grid_paging = Tracker.nonreactive ()->
	# 	# 				_grid_paging = Session.get('grid_paging')
	# 	# 				if _grid_paging?.objectApiName == objectApiName && _grid_paging.list_view_id == list_view_id
	# 	# 					return _grid_paging
	# 	grid_paging = _getGridPaging(objectApiName, listName)
	curObjectName = if is_related then related_object_name else objectApiName
	curObject = Creator.getObject(curObjectName)

	# user_permission_sets = Session.get("user_permission_sets")
	user_permission_sets = Creator.UserPermissionSets
	userCompanyOrganizationId = Steedos.getUserCompanyOrganizationId()
	isSpaceAdmin = Creator.isSpaceAdmin()
	isOrganizationAdmin = _.include(user_permission_sets,"organization_admin")

	recordId = self.data.record_id || self.data.recordId
	related_list_item_props = self.data.related_list_item_props || {}

	# if Steedos.spaceId() and (is_related or Creator.subs["CreatorListViews"].ready()) and Creator.subs["TabularSetting"].ready()
	# if true
	url = Creator.getODataEndpointUrl(objectApiName, listName, is_related, related_object_name)
	filter = Creator.getListViewFilters(objectApiName, listName, is_related, related_object_name, recordId)
	# console.log("==filter===", objectApiName, listName, is_related, related_object_name, recordId)
	# console.log("==filter==r=", filter)
	pageIndex = 0
	selectColumns = Creator.getListviewColumns(curObject, objectApiName, is_related, listName, related_list_item_props)
	# #expand_fields 不需要包含 extra_columns
	expand_fields = _expandFields(curObjectName, selectColumns)
	showColumns = _getShowColumns.call(self, curObject, selectColumns, is_related, listName, related_list_item_props)
	pageSize = _getPageSize(is_related, _pageSize)
	objectPaging = getObjectpaging(curObjectName);
	# extra_columns不需要显示在表格上，因此不做_columns函数处理
	selectColumns = Creator.unionSelectColumnsWithExtraAndDepandOn(selectColumns, curObject, objectApiName, is_related)
	
	# 对于a.b的字段，发送odata请求时需要转换为a/b
	selectColumns = selectColumns.map (n)->
		return n.replace(".", "/");

	if !filter
		# filter 为undefined时要设置为空，否则dxDataGrid控件会使用上次使用过的filter
		filter = null

	_listView = Creator.getListView(objectApiName, listName, true)
	if _.isNumber(objectPaging?.page_size)
		pageSize = objectPaging?.page_size
	dxOptions =
		remoteOperations: true
		scrolling: 
			showScrollbar: "always"
			mode: _listView?.scrolling_mode || objectPaging?.mode || "standard"
		paging:
			pageSize: pageSize
			enabled: objectPaging?.enabled
		pager:
			showPageSizeSelector: true,
			allowedPageSizes: [10, 50, 100, 200],
			showInfo: false,
			showNavigationButtons: true
		showColumnLines: false
		allowColumnReordering: true
		allowColumnResizing: true
		columnResizingMode: "widget"
		showRowLines: true
		savingTimeout: 1000
		noDataText: t("list_view_no_records")
		stateStoring:{
			type: "custom"
			enabled: true
			# TODO:后续会考虑改为保存到另外一张单独的表中，见#840
			# customSave: (gridState)->
			# 	if self.data.is_related
			# 		return
			# 	columns = gridState.columns
			# 	column_width = {}
			# 	sort = []
			# 	if columns and columns.length
			# 		columns = _.sortBy(_.values(columns), "visibleIndex")
			# 		_.each columns, (column_obj)->
			# 			if column_obj.width
			# 				column_width[column_obj.dataField] = column_obj.width
			# 		columns = _.sortBy(_.values(columns), "sortIndex")
			# 		_.each columns, (column_obj)->
			# 			if column_obj.sortOrder
			# 				sort.push {field_name: column_obj.dataField, order: column_obj.sortOrder}
			# 		Meteor.call 'grid_settings', curObjectName, listName, column_width, sort,
			# 			(error, result)->
			# 				if error
			# 					console.log error
			# 				else
			# 					console.log "grid_settings success"
			customLoad: ->
				return {pageIndex: pageIndex}
		}
		dataSource:
			store:
				type: "odata"
				version: 4
				url: url
				withCredentials: false
				beforeSend: (request) ->
					request.headers['X-User-Id'] = Meteor.userId()
					request.headers['X-Space-Id'] = Steedos.spaceId()
					request.headers['X-Auth-Token'] = Accounts._storedLoginToken()
				errorHandler: (error) ->
					if error.httpStatus == 404 || error.httpStatus == 400
						error.message = t "creator_odata_api_not_found"
					else if error.httpStatus == 401
						error.message = t "creator_odata_unexpected_character"
					else if error.httpStatus == 403
						error.message = t "creator_odata_user_privileges"
					else if error.httpStatus == 500
						if error.message == "Unexpected character at 106" or error.message == 'Unexpected character at 374'
							error.message = t "creator_odata_unexpected_character"
					toastr.error(error.message)
					console.error('errorHandler', error)
				fieldTypes: {
					'_id': 'String'
				}
			select: selectColumns
			filter: filter
			expand: expand_fields
		columns: showColumns
		columnAutoWidth: false
		sorting:
			mode: "multiple"
		customizeExportData: (col, row)->
			fields = curObject.fields
			_.each row, (r)->
				_.each r.values, (val, index)->
					if val
						if val.constructor == Object
							r.values[index] = val.name || val._NAME_FIELD_VALUE
						else if val.constructor == Array
							_val = [];
							_.each val, (_v)->
								if _.isString(_v)
									_val.push _v
								else if _.isObject(_v)
									_val.push(_v.name || _v._NAME_FIELD_VALUE)
							r.values[index] = _val.join(",")
						else if val.constructor == Date
							dataField = col[index]?.dataField
							if fields and fields[dataField]?.type == "date"
								val = moment(val).format('YYYY-MM-DD')
								r.values[index] = val
							else
								utcOffset = moment().utcOffset() / 60
								val = moment(val).add(utcOffset, "hours").format('YYYY-MM-DD H:mm')
								r.values[index] = val
						else
							dataField = col[index]?.dataField
							if fields and fields[dataField]?.type == "select"
								options = fields[dataField].options
								valOpt = _.find options, (opt)->
									return opt.value == val
								if valOpt
									r.values[index] = valOpt.label
		onCellClick: (e)->
			if e.column?.dataField ==  "_id_actions"
				_itemClick.call(self, e, curObjectName, listName)

		onContentReady: (e)->
			if self.data.total
				self.data.total.set self.dxDataGridInstance.totalCount()
			else if self.data.recordsTotal
				recordsTotal = self.data.recordsTotal.get()
				recordsTotal[curObjectName] = self.dxDataGridInstance.totalCount()
				self.data.recordsTotal.set recordsTotal
			unless is_related
				unless curObject.enable_tree
					# 不支持tree格式的翻页
					current_pagesize = self.$(".gridContainer").dxDataGrid().dxDataGrid('instance').pageSize()
					self.$(".gridContainer").dxDataGrid().dxDataGrid('instance').pageSize(current_pagesize)
					# localStorage.setItem("creator_pageSize:"+Meteor.userId(),current_pagesize)
		# onNodesInitialized: (e)->
		# 	if creator_obj.enable_tree
		# 		# 默认展开第一个节点
		# 		rootNode = e.component.getRootNode()
		# 		firstNodeKey = rootNode?.children[0]?.key
		# 		if firstNodeKey
		# 			e.component.expandRow(firstNodeKey)
	if Steedos.isMobile()
		dxOptions.allowColumnReordering = false
		dxOptions.allowColumnResizing = false

	if is_related
		dxOptions.pager.showPageSizeSelector = false
	fileName = Creator.getObject(curObjectName).label + "-" + Creator.getListView(curObjectName, listName)?.label
	dxOptions.export =
		enabled: true
		fileName: fileName
		allowExportSelectedData: false

	if !is_related and curObject.enable_tree
		# 如果是tree则过虑条件适用tree格式，要排除相关项is_related的情况，因为相关项列表不需要支持tree
		dxOptions.keyExpr = "_id"
		dxOptions.parentIdExpr = "parent"
		dxOptions.hasItemsExpr = (params)->
			if params?.children?.length>0
				return true
			return false;
		dxOptions.expandNodesOnFiltering = true
		# tree 模式不能设置filter，filter由tree动态生成
		dxOptions.dataSource.filter = null
		dxOptions.rootValue = null
		dxOptions.remoteOperations =
			filtering: true
			sorting: false
			grouping: false
		dxOptions.scrolling = null
		dxOptions.pageing =
			pageSize: 1000
		# dxOptions.expandedRowKeys = ["9b7maW3W2sXdg8fKq"]
		# dxOptions.autoExpandAll = true
		# 不支持tree格式的翻页，因为OData模式下，每次翻页都请求了完整数据，没有意义
		dxOptions.pager = null

		_.forEach dxOptions.columns, (column)->
			if column.dataField == 'name' || column.dataField == curObject.NAME_FIELD_KEY
				column.allowSearch = true
			else
				column.allowSearch = false

		if objectApiName == "organizations"
			unless isSpaceAdmin
				if isOrganizationAdmin
					if userCompanyOrganizationId
						dxOptions.rootValue = userCompanyOrganizationId
					else
						dxOptions.rootValue = "-1"
				else
					dxOptions.rootValue = "-1"

		self.dxDataGridInstance = self.$(".gridContainer").dxTreeList(dxOptions).dxTreeList('instance')
	else
		self.dxDataGridInstance = self.$(".gridContainer").dxDataGrid(dxOptions).dxDataGrid('instance')
Template.creator_grid.helpers Creator.helpers

Template.creator_grid.helpers
	hideGridContent: ()->
		is_related = Template.instance().data.is_related
		recordsTotal = Template.instance().data.recordsTotal
		related_object_name = Template.instance().data.related_object_name
		if is_related and recordsTotal
			total = recordsTotal.get()?[related_object_name]
			return !total
		else
			return false
	
	gridObjectNameClass: ()->
		is_related = Template.instance().data.is_related
		objectApiName = Template.instance().data.objectApiName
		related_object_name = Template.instance().data.related_object_name
		result = if is_related then related_object_name else objectApiName
		# 文件版本为"cfs.files.filerecord"，需要替换为"cfs-files-filerecord"
		return result?.replace(/\./g,"-")

Template.creator_grid.events

	'click .table-cell-edit': (event, template) ->
		is_related = template.data.is_related
		field = this.field_name
		full_screen = this.full_screen

		if this.field.depend_on && _.isArray(this.field.depend_on)
			field = _.clone(this.field.depend_on)
			field.push(this.field_name)
			field = field.join(",")

		# objectName = if is_related then (template.data?.related_object_name || Session.get("related_object_name")) else (template.data?.objectApiName || Session.get("object_name"))
		objectName = if is_related then template.data?.related_object_name else template.data?.objectApiName
		object = Creator.getObject(objectName)
		collection_name = object.label
		record = Creator.odata.get(objectName, this._id)
		if record
			Session.set("cmFullScreen", full_screen)
			Session.set 'cmDoc', record
			Session.set("action_fields", field)
			Session.set("action_collection", "Creator.Collections.#{objectName}")
			Session.set("action_collection_name", collection_name)
			Session.set("action_save_and_insert", false)
			Session.set 'cmIsMultipleUpdate', true
			Session.set 'cmTargetIds', Creator.TabularSelectedIds?[objectName]
			Meteor.defer ()->
				$(".btn.creator-cell-edit").click()

		return false

	'dblclick td': (event) ->
		$(".table-cell-edit", event.currentTarget).click()

	'click td': (event, template)->
		if $(event.currentTarget).find(".slds-checkbox input").length
			# 左侧勾选框不要focus样式功能
			return
		if $(event.currentTarget).parent().hasClass("dx-freespace-row")
			# 最底下的空白td不要focus样式功能
			return
		template.$("td").removeClass("slds-has-focus")
		$(event.currentTarget).addClass("slds-has-focus")

	# 'click .link-detail': (event, template)->
	# 	page_index = Template.instance().dxDataGridInstance.pageIndex()
	# 	# object_name = Session.get("object_name")
	# 	objectApiName = template.objectApiName
	# 	Session.set 'page_index', {object_name: objectApiName, page_index: page_index}

#	'click .dx-datagrid-table .dx-row-lines': (event, template)->
#		if Steedos.isMobile()
#			herf = $("a", event.currentTarget).attr('href')
#			if herf.startsWith(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX)
#				herf = herf.replace(__meteor_runtime_config__.ROOT_URL_PATH_PREFIX,'')
#			FlowRouter.go(herf)

Template.creator_grid.onCreated ->
	templateData = Template.instance().data
	objectApiName = templateData?.objectApiName
	listName = templateData?.listName
	console.log "==Template.creator_grid.onCreated===", objectApiName, listName
	if !objectApiName or !listName
		return
	self = this
	self.objectApiName = objectApiName
	self.listName = listName
	# self.list_view_id = Session.get("list_view_id")
	self.creatorAddFormOnSuccess = (formType,result)->
		if self.data.related_object_name
			if self.data.related_object_name == result.object_name
				FlowRouter.reload();
		else
			self.dxDataGridInstance?.refresh().done (result)->
				Creator.remainCheckboxState(self.dxDataGridInstance.$element())
	self.creatorEditFormOnSuccess = (formType,result)->
		if self.data.related_object_name
			if self.data.related_object_name == result.object_name
				FlowRouter.reload();
		else
			self.dxDataGridInstance?.refresh().done (result)->
				Creator.remainCheckboxState(self.dxDataGridInstance.$element())
	self.creatorCellEditFormOnSuccess = (formType,result)->
		if self.data.related_object_name
			if self.data.related_object_name == result.object_name
				FlowRouter.reload();
		else
			self.dxDataGridInstance?.refresh().done (result)->
				Creator.remainCheckboxState(self.dxDataGridInstance.$element())
	self.creatorAddRelatedFormOnSuccess = (formType,result)->
		if self.data.related_object_name
			if self.data.related_object_name == result.object_name
				FlowRouter.reload();
		else
			self.dxDataGridInstance?.refresh().done (result)->
				Creator.remainCheckboxState(self.dxDataGridInstance.$element())
	AutoForm.hooks creatorAddForm:
		onSuccess: self.creatorAddFormOnSuccess
	,false
	AutoForm.hooks creatorEditForm:
		onSuccess: self.creatorEditFormOnSuccess
	,false
	AutoForm.hooks creatorCellEditForm:
		onSuccess: self.creatorCellEditFormOnSuccess
	,false
	AutoForm.hooks creatorAddRelatedForm:
		onSuccess: self.creatorAddRelatedFormOnSuccess
	,false
# Template.creator_grid.onDestroyed ->
# 	#离开界面时，清除hooks为空函数
# 	AutoForm.hooks creatorAddForm:
# 		onSuccess: (formType, result)->
# 			$('#afModal').modal 'hide'
# 			if result.type == "post"
# 				app_id = Session.get("app_id")
# 				object_name = result.object_name
# 				record_id = result._id
# 				url = "/app/#{app_id}/#{object_name}/view/#{record_id}"
# 				FlowRouter.go url
# 	,true
# 	AutoForm.hooks creatorEditForm:
# 		onSuccess: (formType, result)->
# 			$('#afModal').modal 'hide'
# 			if result.type == "post"
# 				app_id = Session.get("app_id")
# 				object_name = result.object_name
# 				record_id = result._id
# 				url = "/app/#{app_id}/#{object_name}/view/#{record_id}"
# 				FlowRouter.go url
# 	,true
# 	AutoForm.hooks creatorCellEditForm:
# 		onSuccess: ()->
# 			$('#afModal').modal 'hide'
# 	,true


Template.creator_grid.refresh = (dxDataGridInstance)->
	# is_related = this.data?.is_related || false
	# if !is_related
	# 	Session.set("grid_paging", null)
	dxDataGridInstance.refresh().done (result)->
		Creator.remainCheckboxState(dxDataGridInstance.$element())

Template.creator_grid.onDestroyed ->
	# is_related = this.data.is_related
	# if !is_related && this.listName == Session.get("list_view_id")
	# 	paging = this.dxDataGridInstance?.option().paging
	# 	if paging
	# 		paging.object_name = this.data.objectApiName
	# 		paging.list_view_id = this.listName
	# 		Session.set("grid_paging", paging)
	self = this
	_.each(AutoForm._hooks.creatorAddForm.onSuccess, (fn, index)->
		if fn == self.creatorAddFormOnSuccess
			delete AutoForm._hooks.creatorAddForm.onSuccess[index]
	)
	_.each(AutoForm._hooks.creatorEditForm.onSuccess, (fn, index)->
		if fn == self.creatorEditFormOnSuccess
			delete AutoForm._hooks.creatorEditForm.onSuccess[index]
	)
	_.each(AutoForm._hooks.creatorCellEditForm.onSuccess, (fn, index)->
		if fn == self.creatorCellEditFormOnSuccess
			delete AutoForm._hooks.creatorCellEditForm.onSuccess[index]
	)
	_.each(AutoForm._hooks.creatorAddRelatedForm.onSuccess, (fn, index)->
		if fn == self.creatorAddRelatedFormOnSuccess
			delete AutoForm._hooks.creatorAddRelatedForm.onSuccess[index]
	)