@urlQuery = new Array()
checkUserSigned = (context, redirect) ->
	if Meteor.userId()
		Creator.pushCurrentPathToUrlQuery();
		Meteor.defer(Favorites.changeState);
	return
	# listTreeCompany = localStorage.getItem("listTreeCompany")
	# if listTreeCompany
	# 	Session.set('listTreeCompany', listTreeCompany);
	# else
	# 	# 从当前用户的space_users表中获取
	# 	s_user = db.space_users.findOne()
	# 	if s_user?.company
	# 		localStorage.setItem("listTreeCompany", s_user?.company)
	# 		Session.set('listTreeCompany', s_user?.company);
	# 	else
	# 		# Session.set('listTreeCompany', "-1");
	# 		Session.set('listTreeCompany', "xZXy9x8o6qykf2ZAf");
	# 统一设置此参数，待以后拆分
	# Session.set('listTreeCompany', "xZXy9x8o6qykf2ZAf")
	
	# if !Meteor.userId()
	# 	Setup.validate();

set_sessions = (context, redirect)->
	app_id = context.params.app_id
	if (app_id != "-")
		Session.set("app_id", app_id)
	oldObjectName = Tracker.nonreactive ()-> return Session.get("object_name")
	oldRecordId = Tracker.nonreactive ()-> return Session.get("record_id")
	object_name = context.params.object_name
	record_id = context.params.record_id
	Session.set("object_name", object_name)
	# 手机上record_id从老值变更为新值时，要清除record，否则list组件不会处理加载
	if record_id != oldRecordId
		Template.creator_view.currentInstance?.record?.set(null)
	Session.set("record_id", record_id)
	objectHomeComponent = ReactSteedos.pluginComponentSelector(ReactSteedos.store.getState(), "ObjectHome", object_name)
	if objectHomeComponent
		Session.set("object_home_component", object_name);
	else
		Session.set("object_home_component", null)
	if record_id and ((oldObjectName and oldObjectName != object_name) or (oldRecordId and record_id != oldRecordId))
		# 切换object_name且是详细界面，说明是点击进入了相关详细记录界面，强制加一条临时导航栏项
		Session.set("temp_navs_force_create", true)

checkAppPermission = (context, redirect)->
	app_id = context.params.app_id
	if app_id == "admin" || app_id == "-"
		return
	apps = _.pluck(Creator.getVisibleApps(true),"_id")
	if apps.indexOf(app_id) < 0
		console.log(app_id + " app access denied")
		Session.set("app_id", Creator.getVisibleApps(true)[0]._id)
		redirect "/"

checkAppId = (context, redirect)->
	app_id = context.params.app_id
	if app_id == "admin" and Steedos.isMobile()
		# 手机上不支持admin应用，直接跳转到用户设置界面
		redirect "/user_settings"
		# urlQuery.pop的原因是手机上user_settings界面返回按钮应该正常返回到上个界面而不是返回到/app/admin
		urlQuery.pop()

checkObjectPermission = (context, redirect)->
	object_name = context.params.object_name
	allowRead = Creator.getObject(object_name)?.permissions?.get()?.allowRead
	unless allowRead
		console.log(object_name + " object access denied")
		Session.set("object_name", null)
		redirect "/"


FlowRouter.route '/app',
	triggersEnter: [ checkUserSigned ],
	action: (params, queryParams)->
		BlazeLayout.render Creator.getLayout(),
			main: "creator_app_home"

FlowRouter.route '/app/menu',
	triggersEnter: [ checkUserSigned ],
	action: (params, queryParams)->
		main = 'app_object_menu'
		Session.set("hidden_header",true)
		BlazeLayout.render Creator.getLayout(),
			main: main
	triggersExit: [(context, redirect) ->
		if Steedos.isMobile()
			Session.set("hidden_header", undefined)
	]

FlowRouter.route '/app/:app_id',
	triggersEnter: [ checkUserSigned, checkAppPermission, checkAppId ],
	action: (params, queryParams)->
		app_id = FlowRouter.getParam("app_id")
		if (app_id != "-")
			# 切换APP时先清除object_name，record_id，否则相关依赖的autorun会以之前错误的值运行
			Session.set("object_name", null)
			Session.set("record_id", null)
			Session.set("app_id", app_id)
		Session.set("admin_template_name", null)
		app = Creator.getApp(app_id)
		if app_id is "meeting"
			FlowRouter.go('/app/' + app_id + '/meeting/calendar')
		else
			if app and app.is_use_iframe
				main = 'creator_app_iframe'
			else
				main = 'creator_app_home'
			BlazeLayout.render Creator.getLayout(),
				main: main

FlowRouter.route '/app/:app_id/home',
	triggersEnter: [ checkUserSigned, checkAppPermission ],
	action: (params, queryParams)->
		app_id = FlowRouter.getParam("app_id")
		Session.set("app_id", app_id)
		Session.set("admin_template_name", null)
		Session.set("app_home_active", true)
		if FlowRouter.getParam("app_id") is "meeting"
			FlowRouter.go('/app/' + app_id + '/meeting/calendar')
		else
			main = 'dashboard'
			if Steedos.isMobile()
				Session.set('hidden_header', true)
				main = 'dashboard'
			Steedos.setAppTitle([t("Home"), "Steedos"].join(" | "));
			BlazeLayout.render Creator.getLayout(),
				main: main
	triggersExit: [(context, redirect) ->
		Session.set("app_home_active", false);
		if Steedos.isMobile()
			Session.set("hidden_header", undefined)
	]

#FlowRouter.route '/app/:app_id/page/:page_id/',
#	triggersEnter: [ checkUserSigned, checkAppPermission ],
#	action: (params, queryParams)->
#		app_id = FlowRouter.getParam("app_id")
#		Session.set("app_id", app_id)
#		BlazeLayout.render Creator.getLayout(),
#			main: 'page'

FlowRouter.route '/page/:page_id/',
	action: (params, queryParams)->
		BlazeLayout.render Creator.getLayout(),
			main: 'page'

FlowRouter.route '/user_settings',
	triggersEnter: [ checkUserSigned ],
	action: (params, queryParams)->
			Session.set('headerTitle', '设置' )
			Session.set("showBackHeader", true)
			BlazeLayout.render Creator.getLayout(),
					main: "adminMenu"
	triggersExit: [(context, redirect) ->
		Session.set("showBackHeader", false)
		Session.set('headerTitle', undefined )
	]


FlowRouter.route '/user_settings/switchspace',
	triggersEnter: [ checkUserSigned ],
	action: (params, queryParams)->
			Session.set('headerTitle', '选择工作区')
			Session.set("showBackHeader", true)
			BlazeLayout.render Creator.getLayout(),
				main: "switchSpace"
	triggersExit: [(context, redirect) ->
		Session.set("showBackHeader", false)
		Session.set('headerTitle', undefined )
	]

FlowRouter.route '/app/:app_id/search/:search_text',
	triggersEnter: [ checkUserSigned ],
	action: (params, queryParams)->
		app_id = FlowRouter.getParam("app_id")
		if (app_id != "-")
			Session.set("app_id", app_id)
		Session.set("search_text", FlowRouter.getParam("search_text"))
		Session.set("record_id", null) #有的地方会响应Session中record_id值，如果不清空可能会有异常现象，比如删除搜索结果中的记录后会跳转到记录对应的object的列表
		BlazeLayout.render Creator.getLayout(),
			main: "record_search_list"

FlowRouter.route '/app/:app_id/reports/view/:record_id',
	triggersEnter: [ checkUserSigned ],
	action: (params, queryParams)->
		app_id = FlowRouter.getParam("app_id")
		record_id = FlowRouter.getParam("record_id")
		object_name = FlowRouter.getParam("object_name")
		if (app_id != "-")
			Session.set("app_id", app_id)
		data = {app_id: Session.get("app_id"), record_id: record_id, object_name: object_name}
		Session.set("object_name", "reports")
		Session.set("record_id", record_id)
		BlazeLayout.render Creator.getLayout(),
			main: "creator_report"

FlowRouter.route '/app/:app_id/instances/grid/all',
	triggersEnter: [ checkUserSigned ],
	action: (params, queryParams)->
		app_id = FlowRouter.getParam("app_id")
		if (app_id != "-")
			Session.set("app_id", app_id)
		Session.set("object_name", "instances")
		FlowRouter.go '/workflow'
		return

FlowRouter.route '/app/:app_id/instances/view/:record_id',
	triggersEnter: [ checkUserSigned ],
	action: (params, queryParams)->
		record_id = FlowRouter.getParam("record_id")
		Creator.odata.get("instances", "#{record_id}/view?async", null, null, (result)=>
			if result and result.redirect
				# result.redirect返回的是带rootUrl前缀的相对路径，不能用FlowRouter.go
				FlowRouter.redirect result.redirect
		)


# FlowRouter.route '/app/:app_id/cms_posts/grid/all',
# 	action: (params, queryParams)->
# 		app_id = FlowRouter.getParam("app_id")
# 		if (app_id != "-")
# 			Session.set("app_id", app_id)
# 		Session.set("object_name", "cms_posts")
# 		FlowRouter.go '/cms'

objectRoutes = FlowRouter.group
	prefix: '/app/:app_id/:object_name',
	name: 'objectRoutes',
	triggersEnter: [checkUserSigned, checkAppPermission, checkObjectPermission, set_sessions]

objectRoutes.route '/',
	triggersEnter: [ 
		# 自动跳转到对象的第一个视图
		(context, redirect) -> 
			object_name = context.params.object_name
			unless Session.get("object_home_component")
				list_view = Creator.getObjectFirstListView(object_name)
				list_view_id = list_view?._id
				app_id = context.params.app_id
				if object_name == "meeting"
					url = "/app/" + app_id + "/" + object_name + "/calendar/"
				else
					url = "/app/" + app_id + "/" + object_name + "/grid/" + list_view_id
				redirect(url)
	 ],
	action: (params, queryParams)->
		BlazeLayout.render Creator.getLayout(),
			main: "object_home"

#objectRoutes.route '/list/switch',
#	action: (params, queryParams)->
#		if Steedos.isMobile()  && false and $(".mobile-content-wrapper #list_switch").length == 0
#			Tracker.autorun (c)->
#				if Creator.bootstrapLoaded.get() and Session.get("spaceId")
#					c.stop()
#					app_id = FlowRouter.getParam("app_id")
#					object_name = FlowRouter.getParam("object_name")
#					data = {app_id: app_id, object_name: object_name}
#					Meteor.defer ->
#						Blaze.renderWithData(Template.listSwitch, data, $(".mobile-content-wrapper")[0], $(".layout-placeholder")[0])

#objectRoutes.route '/:list_view_id/list',
#	action: (params, queryParams)->
#		app_id = FlowRouter.getParam("app_id")
#		object_name = FlowRouter.getParam("object_name")
#		list_view_id = FlowRouter.getParam("list_view_id")
#		data = {app_id: app_id, object_name: object_name, list_view_id: list_view_id}
#		Session.set("reload_dxlist", false)
#		if Steedos.isMobile()  && false and $("#mobile_list_#{object_name}").length == 0
#			Tracker.autorun (c)->
#				if Creator.bootstrapLoaded.get() and Session.get("spaceId")
#					c.stop()
#					Meteor.defer ->
#						Blaze.renderWithData(Template.mobileList, data, $(".mobile-content-wrapper")[0], $(".layout-placeholder")[0])

objectRoutes.route '/:record_id/:related_object_name/grid',
	action: (params, queryParams)->
		app_id = Session.get("app_id")
		object_name = FlowRouter.getParam("object_name")
		record_id = FlowRouter.getParam("record_id")
		related_object_name = FlowRouter.getParam("related_object_name")
		Session.set 'related_object_name', related_object_name
		data = {objectApiName: object_name, recordId: record_id, relatedObjectName: related_object_name}
		BlazeLayout.render Creator.getLayout(),
			main: "related_object_list", data: data

objectRoutes.route '/view/:record_id',
	action: (params, queryParams)->
		if queryParams["X-Space-Id"]
			Steedos.setSpaceId(queryParams["X-Space-Id"])
		app_id = FlowRouter.getParam("app_id")
		object_name = FlowRouter.getParam("object_name")
		record_id = FlowRouter.getParam("record_id")
		ObjectRecent.insert(object_name, record_id)
		Session.set("detail_info_visible", true)
		# if object_name == "cms_posts"
		# 	# 文章有自己单独的详细界面
		# 	siteId = Session.get("siteId")
		# 	FlowRouter.go "/cms/s/#{siteId}/p/#{record_id}"
		# 	return;
		if object_name == "users" && !Creator.isCloudAdminSpace(Session.get("spaceId"))
			main = "user"
		else
			main = "creator_view"
		BlazeLayout.render Creator.getLayout(),
			main: 'recordLoading'
		data = {objectApiName: object_name, recordId: record_id}
		Meteor.setTimeout ()->
			BlazeLayout.render Creator.getLayout(),
				main: main, data: data
		, 10

objectRoutes.route '/grid/:list_view_id',
	action: (params, queryParams)->
		Session.set("record_id", null)
		# 每次进视图应该把过滤器关联的视图及对象清空，否则有bug：刷新浏览器时过滤器中已保存条件未能显示出来 #1167
		if Session.get("object_name") != FlowRouter.getParam("object_name") or Session.get("list_view_id") != FlowRouter.getParam("list_view_id")
			Session.set("filter_target", null)
			# 进入某个视图应该把上一个视图的过滤条件清空
			# 见issue：过滤器，在对象的某个yml文件定义的视图中设置过滤条件后，切换到另一个yml视图，刚设置的过滤条件应该清除掉 #1571
			Session.set("filter_items", null)

		if Session.get("object_name") != FlowRouter.getParam("object_name")
			Session.set("list_view_id", null)

		if queryParams?.hidden_header=="true"
			Session.set("hidden_header", true)

		app_id = FlowRouter.getParam("app_id")
		if (app_id != "-")
			Session.set("app_id", app_id)
		object_name = FlowRouter.getParam("object_name")
		list_view_id = FlowRouter.getParam("list_view_id")
		Session.set("object_name", object_name)
		Session.set("list_view_id", list_view_id)
		Session.set("list_view_visible", false)

		Tracker.afterFlush ()->
			Session.set("list_view_visible", true)
		
		data = {objectApiName: object_name, listName: list_view_id}
		BlazeLayout.render Creator.getLayout(),
			main: "creator_list_wrapper", data: data

objectRoutes.route '/calendar/',
	action: (params, queryParams)->
		if Session.get("object_name") != FlowRouter.getParam("object_name")
			Session.set("list_view_id", null)

		app_id = FlowRouter.getParam("app_id")
		if (app_id != "-")
			Session.set("app_id", app_id)
		Session.set("object_name", FlowRouter.getParam("object_name"))
		Session.set("list_view_visible", false)

		Tracker.afterFlush ()->
			Session.set("list_view_visible", true)
		
		BlazeLayout.render Creator.getLayout(),
			main: "creator_calendar"

FlowRouter.route '/app/admin/page/:template_name', 
	triggersEnter: [ checkUserSigned ],
	action: (params, queryParams)->
		template_name = params?.template_name
		if Meteor.userId()
			Session.set("app_id", "admin")
			Session.set("admin_template_name", template_name)
			BlazeLayout.render Creator.getLayout(),
				main: template_name

