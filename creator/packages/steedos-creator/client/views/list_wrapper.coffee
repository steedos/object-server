
Template.creator_list_wrapper.onRendered ->
	self = this
	self.rendered = false
	self.autorun ->
		if Session.get("list_view_id")
			self.$(".btn-filter-list").removeClass("slds-is-selected")
			self.$(".filter-list-container").addClass("slds-hide")
			if self.rendered
				self.$("#grid-search").val('')

	self.autorun ->
		if Session.get("list_view_id") && self.rendered
			# 刷新浏览器或从详细界面返回到列表时，因self.rendered条件不会进入
			# 切换视图时会进入，清除查找条件
			Session.set("standard_query", null)
	
	self.autorun ->
		list_view_id = Session.get("list_view_id")
		object_name = Session.get("object_name")
		isSubReady = Creator.subs["CreatorListViews"].ready()
		if isSubReady and list_view_id
			list_view_obj = Creator.Collections.object_listviews.findOne(list_view_id)
			filter_target = Tracker.nonreactive ->
				return Session.get("filter_target")
			# 是否过滤条件关联的视图及对象未发生变化
			isFilterTargetNotChanged = filter_target?.list_view_id == list_view_id and filter_target?.object_name == object_name
			if list_view_obj
				if isFilterTargetNotChanged
					# 过滤条件关联的视图及对象未发生变化时，不从数据库中重载过滤条件到Session，以允许界面跳转时过滤条件保持不变
					return
				if list_view_obj.filter_scope
					Session.set("filter_scope", list_view_obj.filter_scope)
				else
					Session.set("filter_scope", null)
				if list_view_obj.filters
					if Creator.isListViewFilterEditable(list_view_obj)
						# 当视图不是共享的，或者当前用户本身有权限编辑当前视图时才把过滤条件显示在右侧过滤器中
						# 这样普通用户查看共享视图时，就相当于共享视图是定义在yml文件中一样，视图的过滤条件是必要的过滤条件且不可以被编辑
						Session.set("filter_items", list_view_obj.filters)
					else
						Session.set("filter_items", null)
				else
					Session.set("filter_items", null)
			else
				if isFilterTargetNotChanged
					# 过滤条件关联的视图及对象未发生变化时，不清空Session中的过滤条件，以允许界面跳转时过滤条件保持不变
					return
				Session.set("filter_scope", null)
				Session.set("filter_items", null)
			
			# list_view_id、object_name变化时，标记过滤条件关联的视图及对象
			Session.set("filter_target", {
				list_view_id: list_view_id,
				object_name: object_name
			});

	self.rendered = true

	self.autorun ->
		# object_name变化时自动请求odata获取每个视图的记录数
		object_name = Session.get("object_name")
		listViews = Creator.getListViews()
		self.recordsListViewTotal.set {}
		listViews?.forEach (view)->
			unless view?.show_count
				return
			filters = Creator.getODataFilter(view._id, object_name)
			options =
				filter: filters
			Creator.odata.queryCount object_name, options, (count, error)->
				if !error and count != false
					recordsListViewTotal = self.recordsListViewTotal.get()
					recordsListViewTotal[view._id] = count
					self.recordsListViewTotal.set recordsListViewTotal


Template.creator_list_wrapper.helpers Creator.helpers

isCalendarView = ()->
	view = Creator.getListView(Session.get "object_name", Session.get("list_view_id"))
	return view?.type == 'calendar'

getFollowAction = ()->
	actions = Creator.getActions()
	return _.find actions, (action)->
		return action.name == 'standard_follow'

isFollowing = ()->
	return Creator.getCollection("follows")?.findOne({object_name: Session.get("object_name"), owner: Meteor.userId()})

Template.creator_list_wrapper.helpers

	isCalendarView: ()->
		return isCalendarView()

	object_listviews_fields: ()->
		listview_fields = Creator.getObject("object_listviews").fields
		field_keys = _.keys(listview_fields)
		field_keys.remove(field_keys.indexOf("object_name"))
		if !Steedos.isSpaceAdmin()
			field_keys.remove(field_keys.indexOf("shared"))

		field_keys.remove(field_keys.indexOf("filters"))
		field_keys.remove(field_keys.indexOf("filters.$"))
		field_keys.remove(field_keys.indexOf("filters.$.field"))
		field_keys.remove(field_keys.indexOf("filters.$.operation"))
		field_keys.remove(field_keys.indexOf("filters.$.value"))

		return field_keys.join(",")

	isRefreshable: ()->
		return Template["creator_grid"]?.refresh

	list_template: ()->
		return "creator_grid"

	recordsTotalCount: ()->
		return Template.instance().recordsTotal.get()
	
	sidebar: ()->
		object_name = Session.get "object_name"
		return !Steedos.isMobile() and Creator.getObject(object_name)?.sidebar
	
	sidebarDropdownMenu: ()->
		object_name = Session.get "object_name"
		return Steedos.isMobile() and Creator.getObject(object_name)?.sidebar
	
	showAsGrid: ()->
		object_name = Session.get "object_name"
		if Creator.getObject(object_name)?.enable_tree
			return true
		return !Steedos.isMobile()
	
	list_data: ()->
		templateData = Template.currentData()
		return {objectApiName: templateData.objectApiName, listName: templateData.listName, total: Template.instance().recordsTotal}

	list_views: ()->
		Session.get("change_list_views")
		return Creator.getListViews()

	custom_view: ()->
		return Creator.Collections.object_listviews.find({object_name: Session.get("object_name"), is_default: {$ne: true}})

	list_view: ()->
		Session.get("change_list_views")
		list_view = Creator.getListView(Session.get("object_name"), Session.get("list_view_id"))

		if Session.get("list_view_id") and Session.get("list_view_id") != list_view?._id
			return

		if !list_view
			return

		if list_view?.name != Session.get("list_view_id")
			if list_view?._id
				Session.set("list_view_id", list_view._id)
			else
				Session.set("list_view_id", list_view.name)
		return list_view

	list_view_url: (list_view)->
		if list_view._id
			list_view_id = String(list_view._id)
		else
			list_view_id = String(list_view.name)
		
		app_id = Session.get("app_id")
		object_name = Session.get("object_name")
		return Creator.getListViewUrl(object_name, app_id, list_view_id)
	
	list_view_label: (item)->
		if item
			return item.label || item.name 
		else
			return ""
	
	list_view_count: (item)->
		unless item.show_count
			return ""
		recordsListViewTotal = Template.instance().recordsListViewTotal.get()
		if(recordsListViewTotal[item._id] != undefined)
			return "#{recordsListViewTotal[item._id]}"
		else
			# 显示为正在请求中效果
			return "..."

	actions: ()->
		actions = Creator.getActions()
		isCalendar = isCalendarView()
		actions = _.filter actions, (action)->
			if isCalendar && action.todo == "standard_query"
				return false
			if action.name == "standard_follow"
				return false
			if action.on == "list"
				if typeof action.visible == "function"
					return action.visible()
				else
					return action.visible
			else
				return false
		return actions

	is_custom_list_view: ()->
		if Creator.Collections.object_listviews.findOne(Session.get("list_view_id"))
			return true
		else
			return false
	
	is_view_owner: ()->
		list_view = Creator.Collections.object_listviews.findOne(Session.get("list_view_id"))
		if list_view and list_view.owner == Meteor.userId()
			return true
		return false

	is_filter_changed: ()->
		list_view_obj = Creator.Collections.object_listviews.findOne(Session.get("list_view_id"))
		is_filter_list_disabled = !list_view_obj or list_view_obj.owner != Meteor.userId()
		if is_filter_list_disabled
			# 只读视图不能存在到数据库
			return false
		if list_view_obj
			original_filter_scope = list_view_obj.filter_scope
			original_filter_items = list_view_obj.filters
			original_filter_logic = list_view_obj.filter_logic
			current_filter_logic = Session.get("filter_logic")
			current_filter_scope = Session.get("filter_scope")
			current_filter_items = Session.get("filter_items")
			if original_filter_scope == current_filter_scope and JSON.stringify(original_filter_items) == JSON.stringify(current_filter_items)
				if (!current_filter_logic and !original_filter_logic) or (current_filter_logic == original_filter_logic)
					return false
				else
					return true
			else
				return true
	
	list_view_visible: ()->
		return Session.get("list_view_visible")
	
	current_list_view: ()->
		list_view_obj = Creator.Collections.object_listviews.findOne(Session.get("list_view_id"))
		return list_view_obj?._id

	delete_on_success: ()->
		return ->
			list_views = Creator.getListViews()
			Session.set("list_view_id", list_views[0]._id)

	isTree: ()->
		objectName = Session.get("object_name")
		object = Creator.getObject(objectName)
		return object?.enable_tree

	search_text: ()->
		search_text = Tracker.nonreactive ()->
			standard_query = Session.get("standard_query")
			if standard_query && standard_query.is_mini && standard_query.object_name == Session.get("object_name") && standard_query.search_text
				return standard_query.search_text
		if search_text
			return search_text
		else
			return ''
	isFiltering: ()->
		return Creator.getIsFiltering()
	canFollow: ()->
		objectName = Session.get("object_name")
		object = Creator.getObject(objectName)
		followAction = getFollowAction();
		followActionVisible = followAction?.visible
		if _.isFunction(followActionVisible)
			followActionVisible = followActionVisible()
		return (object?.enable_follow && followActionVisible) || isFollowing()
	isFollowing : ()->
		return isFollowing();

transformFilters = (filters)->
	_filters = []
	_.each filters, (f)->
		if _.isArray(f) && f.length == 3
			_filters.push {field: f[0], operation: f[1], value: f[2]}
		else
			_filters.push f
	return _filters

Template.creator_list_wrapper.events

	'click .list-action-custom': (event) ->
		objectName = Session.get("object_name")
		object = Creator.getObject(objectName)
		collection_name = object.label
		Session.set("action_fields", undefined)
		Session.set("action_collection", "Creator.Collections.#{objectName}")
		Session.set("action_collection_name", collection_name)
		if isCalendarView()
			Session.set("action_save_and_insert", false)
		else
			Session.set("action_save_and_insert", true)
		Creator.executeAction objectName, this

	'click .export-data-grid': (event, template)->
		template.$(".dx-datagrid-export-button").click()

	'click .btn-filter-list': (event, template)->
		$(event.currentTarget).toggleClass("slds-is-selected")
		$(".filter-list-container").toggleClass("slds-hide")

	'click .close-filter-panel': (event, template)->
		$(".btn-filter-list").removeClass("slds-is-selected")
		$(".filter-list-container").addClass("slds-hide")
	
	'click .add-list-view': (event, template)->
		$(".btn-add-list-view").click()

	'click .copy-list-view': (event, template)->

		current_list_view = _.clone(Creator.getListView(Session.get("object_name"), Session.get("list_view_id")))

		delete current_list_view._id

		delete current_list_view.name

		delete current_list_view.label

		if current_list_view.filters
			current_list_view.filters = transformFilters(current_list_view.filters)

		Session.set "cmDoc", current_list_view

		$(".btn-add-list-view").click()

	'click .reset-column-width': (event, template)->
		list_view_id = Session.get("list_view_id")
		object_name = Session.get("object_name")
		grid_settings = Creator.getCollection("settings").findOne({object_name: object_name, record_id: "object_gridviews"})
		column_width = {}
		_.each grid_settings?.settings[list_view_id]?.column_width,(val, key)->
			if key == "_id_checkbox"
				column_width[key] = 60
			else if key == '_index'
				column_width[key] = 60
			else if key == '_id_actions'
				column_width[key] = 46
			else
				column_width[key] = 0
		Session.set "list_view_visible", false
		Meteor.call 'grid_settings', object_name, list_view_id, column_width, (e, r)->
			if e
				console.log e
			else
				Session.set "list_view_visible", true

	'click .edit-list-view': (event, template)->
		$(".btn-edit-list-view").click()

	'click .cancel-change': (event, template)->
		list_view_id = Session.get("list_view_id")
		listView = Creator.Collections.object_listviews.findOne(list_view_id)
		filters = listView.filters || []
		filter_scope = listView.filter_scope
		filter_logic = listView.filter_logic
		Session.set("filter_items", filters)
		Session.set("filter_scope", filter_scope)
		Session.set("filter_logic", filter_logic)

	'click .save-change': (event, template)->
		list_view_id = Session.get("list_view_id")
		filter_items = Session.get("filter_items")
		filter_scope = Session.get("filter_scope")
		filter_items = _.map filter_items, (obj) ->
			if _.isEmpty(obj)
				return false
			else
				return obj
		filter_items = _.compact(filter_items)

		format_logic = template.$("#filter-logic").val()
		if Creator.validateFilters(filter_items, format_logic)
			Session.set "list_view_visible", false
			Meteor.call "update_filters", list_view_id, filter_items, filter_scope, format_logic, (error, result) ->
				Session.set "list_view_visible", true
				if error 
					console.log "error", error 
				else if result
					Session.set("filter_items", filter_items)

	'click .filters-save-as': (event, template)->
		filter_items = Session.get("filter_items")
		filter_items = _.map filter_items, (obj) ->
			if _.isEmpty(obj)
				return false
			else
				return obj
		filter_items = _.compact(filter_items)
		Session.set "cmDoc", {filters: filter_items}
		$(".btn-add-list-view").click()
		$(".filter-list-container").toggleClass("slds-hide")

	'click .select-fields-to-display': (event, template)->
		Modal.show("select_fields")

	'click .delete-list-view': (event, template)->
		list_view_id = Session.get("list_view_id")
		Session.set "cmDoc", {_id: list_view_id}
		$(".btn-delete-list-view").click()

	'click .btn-refresh': (event, template)->
		$(".slds-icon-standard-refresh", event.currentTarget).animateCss("rotate")
		object = Creator.getObject()
		gridContainer = $(event.currentTarget).closest(".filter-list-wraper").find(".gridContainer")
		if object?.enable_tree
			dxDataGridInstance = gridContainer.dxTreeList().dxTreeList('instance')
		else
			dxDataGridInstance = gridContainer.dxDataGrid().dxDataGrid('instance')
		Template["creator_grid"]?.refresh(dxDataGridInstance)

	'keydown input#grid-search': (event, template)->
		if event.keyCode == "13" or event.key == "Enter"
			searchKey = $(event.currentTarget).val().trim()
			object_name = Session.get("object_name")
			obj = Creator.getObject(object_name)
			if searchKey
				if obj.enable_tree
					$(".gridContainer").dxTreeList({}).dxTreeList('instance').searchByText(searchKey)
				else
					obj_fields = obj.fields
					query = {}
					_.each obj_fields, (field,field_name)->
						if (field.searchable || field_name == obj.NAME_FIELD_KEY) && field.type != 'number'
							query[field_name] = searchKey
					standard_query = object_name: object_name, query: query, is_mini: true, search_text: searchKey
					Session.set 'standard_query', standard_query
			else
				if obj.enable_tree
					$(".gridContainer").dxTreeList({}).dxTreeList('instance').searchByText()
				else
					Session.set 'standard_query', null

	'click .list-action-follow': (event, template)->
		followAction = getFollowAction()
		Creator.executeAction(Session.get("object_name"), followAction)

	'click .slds-page-header--object-home .slds-page-header__title .dx-treeview-toggle-item-visibility': (event) ->
		# 视图下拉菜单中如果有dxTreeView，则应该让点击展开折叠树节点时不隐藏弹出层
		event.stopPropagation()

	'click .btn-toggle-grid-sidebar': (event, template)->
		$(event.currentTarget).toggleClass("slds-is-selected")
		$(".list-table-container.list-table-sidebar").toggleClass("slds-hide")
		sidebar = Creator.getObject()?.sidebar
		if sidebar and sidebar.clear_selection_while_hidden
			gridSidebarInstance = $(".creator-list-wrapper .list-table-sidebar .gridSidebarContainer").dxTreeView().dxTreeView('instance')
			gridSidebarInstance.unselectItem(gridSidebarInstance.getSelectedNodesKeys()?[0])




Template.creator_list_wrapper.onCreated ->
	this.recordsTotal = new ReactiveVar(0)
	this.recordsListViewTotal = new ReactiveVar({})

Template.creator_list_wrapper.onDestroyed ->
	object_name = Session.get("object_name")
	if object_name
		Creator.TabularSelectedIds[object_name] = []


AutoForm.hooks addListView:
	onSuccess: (formType,result)->
		app_id = Session.get("app_id")
		object_name = Session.get("object_name")
		list_view_id = result._id
		url = "/app/" + app_id + "/" + object_name + "/grid/" + list_view_id
		FlowRouter.go url
			