Creator.getInitWidthPercent = (object_name, columns) ->
	_schema = Creator.getSchema(object_name)?._schema
	column_num = 0
	if _schema
		_.each columns, (field_name) ->
			field = _.pick(_schema, field_name)
			is_wide = field[field_name]?.autoform?.is_wide
			if is_wide
				column_num += 2
			else
				column_num += 1

		init_width_percent = 100 / column_num
		return init_width_percent

Creator.getFieldIsWide = (object_name, field_name) ->
	_schema = Creator.getSchema(object_name)._schema
	if _schema
		field = _.pick(_schema, field_name)
		is_wide = field[field_name]?.autoform?.is_wide
		return is_wide

Creator.getTabularOrder = (object_name, list_view_id, columns) ->
	setting = Creator.Collections?.settings?.findOne({object_name: object_name, record_id: "object_listviews"})
	obj = Creator.getObject(object_name)
	columns = _.map columns, (column)->
		field = obj.fields[column]
		if field?.type and !field.hidden
			return column
		else
			return undefined
	columns = _.compact columns
	if setting and setting.settings
		sort = setting.settings[list_view_id]?.sort || []
		sort = _.map sort, (order)->
			key = order[0]
			index = _.indexOf(columns, key)
			order[0] = index + 1
			return order
		return sort
	return []


Creator.initListViews = (object_name)->
	object = Creator.getObject(object_name)
	columns = Creator.getObjectDefaultColumns(object_name) || ["name"]
	extra_columns = ["owner"]
	default_extra_columns = Creator.getObjectDefaultExtraColumns(object_name) || ["owner"]
	if default_extra_columns
		extra_columns = _.union extra_columns, default_extra_columns

	order = Creator.getObjectDefaultSort(object_name) || []
	if Meteor.isClient
		Creator.TabularSelectedIds?[object_name] = []

Creator.convertListView = (default_view, list_view, list_view_name)->
	default_columns = default_view?.columns
	default_mobile_columns = default_view?.mobile_columns
	unless list_view
		return
	oitem = _.clone(list_view)
	if !_.has(oitem, "name")
		oitem.name = list_view_name
	if !oitem.columns
		if default_columns
			oitem.columns = default_columns
	if !oitem.columns
		oitem.columns = ["name"]
	if !oitem.mobile_columns
		if default_mobile_columns
			oitem.mobile_columns = default_mobile_columns

	if Meteor.isClient
		if Creator.isCloudAdminSpace(Session.get("spaceId")) && !_.include(oitem.columns, 'space')
			oitem.columns.push('space')


	if !oitem.filter_scope
		# listview视图的filter_scope默认值改为space #131
		oitem.filter_scope = "space"

	if !_.has(oitem, "_id")
		oitem._id = list_view_name
	else
		oitem.label = oitem.label || list_view.name

	if _.isString(oitem.options)
		oitem.options = JSON.parse(oitem.options)

	_.forEach oitem.filters, (filter, _index)->
		if !_.isArray(filter) && _.isObject(filter)
			if Meteor.isServer
				if _.isFunction(filter?.value)
					filter._value = filter.value.toString()
			else
				if _.isString(filter?._value)
					filter.value = Creator.eval("(#{filter._value})")
	return oitem


if Meteor.isClient
	Creator.getRelatedList = (object_name)->
		unless object_name
			return
		relatedListObjects = {}
		relatedListNames = []
		objectLayoutRelatedListObjects = [];
		_object = Creator.getObject(object_name)
		if _object
			layoutRelatedList = _object.related_lists;
			if !_.isEmpty layoutRelatedList
				_.each layoutRelatedList, (item)->
					reObjectName = item.related_field_fullname.split('.')[0]
					reFieldName = item.related_field_fullname.split('.')[1]
					write_requires_master_read = Creator.getObject(reObjectName)?.fields[reFieldName]?.write_requires_master_read
					related =
						object_name: reObjectName
						columns: item.field_names
						mobile_columns: item.field_names
						is_file: reObjectName == "cms_files"
						filtersFunction: item.filters
						sort: item.sort
						related_field_name: reFieldName
						customRelatedListObject: true
						write_requires_master_read: write_requires_master_read
						label: item.label
						actions: item.buttons
						visible_on: item.visible_on
						pageSize: item.pageSize
					objectLayoutRelatedListObjects.push(related)
				return objectLayoutRelatedListObjects;
			relatedList = _object.relatedList
			if !_.isEmpty relatedList
				_.each relatedList, (objOrName)->
					if _.isObject objOrName
						related =
							object_name: objOrName.objectName
							columns: objOrName.columns
							mobile_columns: objOrName.mobile_columns
							is_file: objOrName.objectName == "cms_files"
							filtersFunction: objOrName.filters
							sort: objOrName.sort
							related_field_name: ''
							customRelatedListObject: true
							label: objOrName.label
							actions: objOrName.actions
							pageSize: objOrName.pageSize
						relatedListObjects[objOrName.objectName] = related
						relatedListNames.push objOrName.objectName
					else if _.isString objOrName
						relatedListNames.push objOrName

		mapList = {}
		related_objects = Creator.getRelatedObjects(object_name)
		_.each related_objects, (related_object_item) ->
			if !related_object_item?.object_name
				return
			related_object_name = related_object_item.object_name
			related_field_name = related_object_item.foreign_key
			write_requires_master_read = related_object_item.write_requires_master_read
			related_object = Creator.getObject(related_object_name)
			unless related_object
				return
			columns = Creator.getObjectDefaultColumns(related_object_name) || ["name"]
			columns = _.without(columns, related_field_name)
			mobile_columns = Creator.getObjectDefaultColumns(related_object_name, true) || ["name"]
			mobile_columns = _.without(mobile_columns, related_field_name)

			order = Creator.getObjectDefaultSort(related_object_name)
			tabular_order = Creator.transformSortToTabular(order, columns)

			if /\w+\.\$\.\w+/g.test(related_field_name)
				# object类型带子属性的related_field_name要去掉中间的美元符号，否则显示不出字段值
				related_field_name = related_field_name.replace(/\$\./,"")
			related =
				object_name: related_object_name
				columns: columns
				mobile_columns: mobile_columns
				related_field_name: related_field_name
				is_file: related_object_name == "cms_files"
				write_requires_master_read: write_requires_master_read

			relatedObject = relatedListObjects[related_object_name]
			if relatedObject
				if relatedObject.columns
					related.columns = relatedObject.columns
				if relatedObject.mobile_columns
					related.mobile_columns = relatedObject.mobile_columns
				if relatedObject.sort
					related.sort = relatedObject.sort
				if relatedObject.filtersFunction
					related.filtersFunction = relatedObject.filtersFunction
				if relatedObject.customRelatedListObject
					related.customRelatedListObject = relatedObject.customRelatedListObject
				if relatedObject.label
					related.label = relatedObject.label
				delete relatedListObjects[related_object_name]

			mapList[related.object_name] = related


		spaceId = Session.get("spaceId")
		userId = Meteor.userId()
		related_object_names = _.pluck(_.values(relatedListObjects), "object_name")
		permissions = Creator.getPermissions(object_name, spaceId, userId)
		unrelated_objects = permissions.unrelated_objects
		related_object_names = _.difference related_object_names, unrelated_objects
		_.each relatedListObjects, (v, related_object_name) ->
			isActive = related_object_names.indexOf(related_object_name) > -1
			allowRead = Creator.getPermissions(related_object_name, spaceId, userId)?.allowRead
			if isActive && allowRead
				mapList[related_object_name] = v

		list = []
		if _.isEmpty relatedListNames
			list =  _.values mapList
		else
			_.each relatedListNames, (objectName) ->
				if mapList[objectName]
					list.push mapList[objectName]

		if _.has(_object, 'allow_relatedList')
			list = _.filter list, (item)->
				return _.include(_object.allow_relatedList, item.object_name)

		return list

Creator.getObjectFirstListView = (object_name)->
	return _.first(Creator.getListViews(object_name))

### 
	取出list_view_id对应的视图，如果不存在或者没有权限，就返回第一个视图
	exac为true时，需要强制按list_view_id精确查找，不默认返回第一个视图
###
Creator.getListView = (object_name, list_view_id, exac)->
	if Meteor.isClient
		if !object_name
			object_name = Session.get("object_name")
		if !list_view_id
			list_view_id = Session.get("list_view_id")
	object = Creator.getObject(object_name)
	if !object
		return
	listViews = Creator.getListViews(object_name)
	unless listViews?.length
		return
	list_view = _.findWhere(listViews,{"_id":list_view_id})
	unless list_view
		# 如果不需要强制按list_view_id精确查找，则默认返回第一个视图，反之返回空
		if exac
			return
		else
			list_view = listViews[0]
	return list_view

#获取list_view_id对应的视图是否是最近查看视图
Creator.getListViewIsRecent = (object_name, list_view_id)->
	if Meteor.isClient
		if !object_name
			object_name = Session.get("object_name")
		if !list_view_id
			list_view_id = Session.get("list_view_id")
	if typeof(list_view_id) == "string"
		object = Creator.getObject(object_name)
		if !object
			return
		listView = _.findWhere(object.list_views,{_id: list_view_id})
	else
		listView = list_view_id
	return listView?.name == "recent"


###
    从columns参数中过滤出用于手机端显示的columns
	规则：
	1.优先把columns中的name字段排在第一个
	2.最多只返回4个字段
	3.考虑宽字段占用整行规则条件下，最多只返回两行
###
Creator.pickObjectMobileColumns = (object_name, columns)->
	result = []
	maxRows = 2 
	maxCount = maxRows * 2
	count = 0
	object = Creator.getObject(object_name)
	fields = object.fields
	unless object
		return columns
	nameKey = object.NAME_FIELD_KEY
	isNameColumn = (item)->
		if _.isObject(item)
			return item.field == nameKey
		else
			return item == nameKey
	getField = (item)->
		if _.isObject(item)
			return fields[item.field]
		else
			return fields[item]
	if nameKey
		nameColumn = columns.find (item)->
			return isNameColumn(item)
	if nameColumn
		field = getField(nameColumn)
		itemCount = if field.is_wide then 2 else 1
		count += itemCount
		result.push nameColumn
	columns.forEach (item)->
		field = getField(item)
		unless field
			return
		itemCount = if field.is_wide then 2 else 1
		if count < maxCount and result.length < maxCount and !isNameColumn(item)
			count += itemCount
			if count <= maxCount
				result.push item
	
	return result

###
    获取默认视图
###
Creator.getObjectDefaultView = (object_name)->
	object = Creator.getObject(object_name)
	if !object
		object = Creator.Objects[object_name]
	if object?.list_views?.default
		#TODO 此代码只是暂时兼容以前code中定义的default视图，待code中的default清理完成后，需要删除此代码
		defaultView = object.list_views.default
	else
		_.each object?.list_views, (list_view, key)->
			if list_view.name == "all" || key == "all"
				defaultView = list_view
	return defaultView;

###
    获取对象的列表默认显示字段
###
Creator.getObjectDefaultColumns = (object_name, use_mobile_columns)->
	defaultView = Creator.getObjectDefaultView(object_name)
	columns = defaultView?.columns
	if use_mobile_columns
		if defaultView?.mobile_columns
			columns = defaultView.mobile_columns
		else if columns
			columns = Creator.pickObjectMobileColumns(object_name, columns)
	return columns

###
	获取对象的列表默认额外加载的字段
###
Creator.getObjectDefaultExtraColumns = (object_name)->
	defaultView = Creator.getObjectDefaultView(object_name)
	return defaultView?.extra_columns

###
	获取对象的默认排序
###
Creator.getObjectDefaultSort = (object_name)->
	defaultView = Creator.getObjectDefaultView(object_name)
	if defaultView
		if defaultView.sort
			return defaultView.sort
		else
			return [["created", "desc"]]


###
    判断是否All view
###
Creator.isAllView = (list_view)->
	return list_view?.name == "all"

###
    判断是否最近查看 view
###
Creator.isRecentView = (list_view)->
	return list_view?.name == "recent"

###
    将sort转换为Tabular控件所需要的格式
###
Creator.transformSortToTabular = (sort, tabularColumns)->
	tabular_sort = []
	_.each sort, (item)->
		if _.isArray(item)
			# 兼容旧的数据格式[["field_name", "order"]]
			if item.length == 1
				column_index = tabularColumns.indexOf(item[0])
				if column_index > -1
					tabular_sort.push [column_index, "asc"]
			else if item.length == 2
				column_index = tabularColumns.indexOf(item[0])
				if column_index > -1
					tabular_sort.push [column_index, item[1]]
		else if _.isObject(item)
			#新数据格式：[{field_name: , order: }]
			field_name = item.field_name
			order = item.order
			if field_name && order
				column_index = tabularColumns.indexOf(field_name)
				if column_index > -1
					tabular_sort.push [column_index, order]

	return tabular_sort

###
    将sort转换为DevExpress控件所需要的格式
###
Creator.transformSortToDX = (sort)->
	dx_sort = []
	_.each sort, (item)->
		if _.isArray(item)
			#兼容旧格式：[["field_name", "order"]]
			dx_sort.push(item)
		else if _.isObject(item)
			#新数据格式：[{field_name: , order: }]
			field_name = item.field_name
			order = item.order
			if field_name && order
				dx_sort.push [field_name, order]

	return dx_sort
