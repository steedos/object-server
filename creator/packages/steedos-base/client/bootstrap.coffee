require('url-search-params-polyfill');
clone = require('clone')
getCookie = (name)->
	pattern = RegExp(name + "=.[^;]*")
	matched = document.cookie.match(pattern)
	if(matched)
		cookie = matched[0].split('=')
		return cookie[1]
	return false

@Setup = {}
Creator.__l = new ReactiveVar()

Blaze._allowJavascriptUrls() 
FlowRouter.wait();

Steedos.goResetPassword = (redirect)->
	accountsUrl = Meteor.settings.public?.webservices?.accounts?.url
	if accountsUrl
		if !redirect
			redirect = location.href.replace("/steedos/sign-in", "").replace("/steedos/logout", "")
		if _.isFunction(Steedos.isCordova) && Steedos.isCordova()
			rootUrl = new URL(__meteor_runtime_config__.ROOT_URL)
			accountsUrl = rootUrl.origin + accountsUrl
		window.location.href = accountsUrl + "/a/#/update-password?redirect_uri=" + redirect;

Steedos.redirectToSignIn = (redirect)->
	accountsUrl = Meteor.settings.public?.webservices?.accounts?.url
	if accountsUrl 
		if !redirect
			redirect = location.href.replace("/steedos/sign-in", "").replace("/steedos/logout", "")
		if _.isFunction(Steedos.isCordova) && Steedos.isCordova()
			rootUrl = new URL(__meteor_runtime_config__.ROOT_URL)
			accountsUrl = rootUrl.origin + accountsUrl
		window.location.href = accountsUrl + "/authorize?redirect_uri=" + redirect;

Setup.validate = (onSuccess)->

	# if window.location.pathname.indexOf('/steedos/sign-in')>=0
	# 	if (!FlowRouter._initialized)
	# 		FlowRouter.initialize();
	# 	return;

	console.log("Validating user...")
	searchParams = new URLSearchParams(window.location.search);
	# 优先使用 URL 变量
	loginToken = searchParams.get("X-Auth-Token");
	userId = searchParams.get("X-User-Id");
	# 然后使用 Meteor LocalStorage 变量
	if (!userId or !loginToken)
		loginToken = Accounts._storedLoginToken()
		userId = Accounts._storedUserId();
	# 然后使用 Cookie 变量
	if (!userId or !loginToken)
		loginToken = getCookie("X-Auth-Token");
		userId = getCookie("X-User-Id");
	spaceId = searchParams.get("X-Space-Id");
	if (!spaceId)
		spaceId = localStorage.getItem("spaceId")
	if (!spaceId)
		spaceId = getCookie("X-Space-Id");
	headers = {}
	requestData = { 'utcOffset': moment().utcOffset() / 60 }
	if loginToken && spaceId
		headers['Authorization'] = 'Bearer ' + spaceId + ',' + loginToken
	else if loginToken
		# headers['Authorization'] = 'Bearer ' + loginToken
		headers['X-User-Id'] = userId
		headers['X-Auth-Token'] = loginToken
	
	$.ajax
		type: "POST",
		url: Steedos.absoluteUrl("api/v4/users/validate"),
		contentType: "application/json",
		dataType: 'json',
		data: JSON.stringify(requestData),
		xhrFields: 
			withCredentials: true
		crossDomain: true
		headers: headers
	.done ( data ) ->
		if Meteor.userId() != data.userId
			Accounts.connection.setUserId(data.userId);
			Accounts.loginWithToken data.authToken, (err) ->
				if (err)
					Meteor._debug("Error logging in with token: " + err);
					FlowRouter.go "/steedos/logout"
					return

		if data.webservices
			Steedos.settings.webservices = data.webservices
		Setup.lastUserId = data.userId
		if data.password_expired
			Steedos.goResetPassword()
		if data.spaceId 
			Setup.lastSpaceId = data.spaceId
			if (data.spaceId != Session.get("spaceId"))
				Steedos.setSpaceId(data.spaceId)

		Creator.USER_CONTEXT = {
			spaceId: data.spaceId,
			userId: data.userId,
			user: data
		}
		if !Meteor.loggingIn()
			# 第一次在登录界面输入用户名密码登录后loggingIn为true，这时还没有登录成功
			Setup.bootstrap(Session.get("spaceId"))
		
		if onSuccess
			onSuccess()
	.fail ( e ) ->
		if (e.status == 401)
			Steedos.redirectToSignIn()
		return

Setup.clearAuthLocalStorage = ()->
	localStorage = window.localStorage;
	i = 0
	while i < localStorage.length
		key = localStorage.key(i)
		if key?.startsWith("Meteor.loginToken") || key?.startsWith("Meteor.userId")  || key?.startsWith("Meteor.loginTokenExpires") || key?.startsWith('accounts:')
			localStorage.removeItem(key)
		i++

Setup.logout = (callback) ->
	$.ajax
		type: "POST",
		url: Steedos.absoluteUrl("api/v4/users/logout"),
		dataType: 'json',
		xhrFields: 
		   withCredentials: true
		crossDomain: true,
	.always ( data ) ->
		Setup.clearAuthLocalStorage()
		if callback
			callback()

Meteor.startup ->

	Setup.validate();
	Accounts.onLogin ()->
		console.log("onLogin")
		
		if Meteor.userId() != Setup.lastUserId
			Setup.validate();
		else 
			Setup.bootstrap(Session.get("spaceId"))

		# Tracker.autorun (c)->
		# 	# 登录后需要清除登录前订阅的space数据，以防止默认选中登录前浏览器url参数中的的工作区ID所指向的工作区
		# 	# 而且可能登录后的用户不属性该SpaceAvatar中订阅的工作区，所以需要清除订阅，由之前的订阅来决定当前用户可以选择哪些工作区
		# 	if Steedos.subsSpaceBase.ready()
		# 		c.stop()
		# 		Steedos.subs["SpaceAvatar"]?.clear()
		# 	return
		return

	Accounts.onLogout ()->
		console.log("onLogout")
		Setup.logout ()-> 
			Creator.bootstrapLoaded.set(false)
			$("body").removeClass('loading')
			Setup.lastUserId = null;
			Steedos.redirectToSignIn()

	Tracker.autorun (c)->
		spaceId = Session.get("spaceId");
		if Setup.lastSpaceId && (Setup.lastSpaceId != spaceId)
			# 一定要在spaceId变化时立即设置bootstrapLoaded为false，而不可以在请求bootstrap之前才设置为false
			# 否则有订阅的话，在请求bootsrtrap前，会先触发订阅的变化，订阅又会触发Creator.bootstrapLoaded.get()值的变化，而且是true变为true
			# 这样的话在autorun中监听Creator.bootstrapLoaded.get()变化就会多进入一次
			Creator.bootstrapLoaded.set(false)
			console.log("spaceId change from " + Setup.lastSpaceId + " to " + Session.get("spaceId"))
			Setup.validate()
		return

	if (localStorage.getItem("app_id") && !Session.get("app_id"))
		Session.set("app_id", localStorage.getItem("app_id"));

	Tracker.autorun (c)->
		#console.log("app_id change: " + Session.get("app_id"))
		localStorage.setItem("app_id", Session.get("app_id"))
		return

	return

Creator.bootstrapLoaded = new ReactiveVar(false)

handleBootstrapData = (result, callback)->
	requestLicense(result?.space?._id);
	Creator._recordSafeObjectCache = []; # 切换工作区时，情况object缓存
	Creator.Objects = result.objects;
	Creator.baseObject = Creator.Objects.base;
	Creator.objectsByName = {};
	object_listviews = result.object_listviews
	Creator.object_workflows = result.object_workflows
	isSpaceAdmin = Steedos.isSpaceAdmin()

	Session.set "user_permission_sets", result.user_permission_sets

	_.each Creator.Objects, (object, object_name)->
		_object_listviews = object_listviews[object_name]
		_.each _object_listviews, (_object_listview)->
			if _.isString(_object_listview.options)
				_object_listview.options = JSON.parse(_object_listview.options)
			if _object_listview.api_name
				_key = _object_listview.api_name
			else
				_key = _object_listview._id
			if !object.list_views
				object.list_views = {}
			object.list_views[_key] = _object_listview
		Creator.loadObjects object, object_name

	# 计算错误，此时store还没初始化，如何能在react中计算selector？
	Creator.Apps = result.apps; #ReactSteedos.creatorAppsSelector(ReactSteedos.store.getState())
	Creator.Menus = result.assigned_menus
	if Steedos.isMobile()
		mobileApps = _.filter Creator.getVisibleApps(true), (item)->
			return item._id !='admin' && !_.isEmpty(item.mobile_objects)
		appIds = _.pluck(mobileApps, "_id")
	else
		appIds = _.pluck(Creator.getVisibleApps(true), "_id")
	if (appIds && appIds.length>0)
		if (!Session.get("app_id") || appIds.indexOf(Session.get("app_id"))<0)
			Session.set("app_id", appIds[0])
	Creator.Dashboards = if result.dashboards then result.dashboards else {};
	Creator.Plugins = if result.plugins then result.plugins else {};

	Creator.appendObjectFieldsColorStyles()

	if _.isFunction(callback)
		callback()

	Creator.bootstrapLoaded.set(true)
	if (!FlowRouter._initialized)
		FlowRouter.initialize();

	if FlowRouter.current()?.context?.pathname == "/steedos/sign-in"
		if FlowRouter.current()?.queryParams?.redirect
			document.location.href = FlowRouter.current().queryParams.redirect;
			return
		else
			FlowRouter.go("/")

requestLicense = (spaceId)->
	unless spaceId and Meteor.userId()
		return
	userId = Meteor.userId()
	authToken = Accounts._storedLoginToken()
	url = Steedos.absoluteUrl "/api/bootstrap/#{spaceId}"
	headers = {}
	headers['Authorization'] = 'Bearer ' + spaceId + ',' + authToken
	headers['X-User-Id'] = userId
	headers['X-Auth-Token'] = authToken
	$.ajax
		type: "get"
		url: Steedos.absoluteUrl("/api/license/#{spaceId}"),
		dataType: "json"
		headers: headers
		error: (jqXHR, textStatus, errorThrown) ->
			error = jqXHR.responseJSON
			console.error error
			if error?.reason
				toastr?.error?(TAPi18n.__(error.reason))
			else if error?.message
				toastr?.error?(TAPi18n.__(error.message))
			else
				toastr?.error?(error)
		success: (result) ->
			Creator.__l.set result

requestBootstrapDataUseAjax = (spaceId, callback)->
	unless spaceId and Meteor.userId()
		return
	userId = Meteor.userId()
	authToken = Accounts._storedLoginToken()
	url = Steedos.absoluteUrl "/api/bootstrap/#{spaceId}"
	headers = {}
	headers['Authorization'] = 'Bearer ' + spaceId + ',' + authToken
	headers['X-User-Id'] = userId
	headers['X-Auth-Token'] = authToken
	$.ajax
		type: "get"
		url: url
		dataType: "json"
		headers: headers
		error: (jqXHR, textStatus, errorThrown) ->
			FlowRouter.initialize();
			error = jqXHR.responseJSON
			console.error error
			if error?.reason
				toastr?.error?(TAPi18n.__(error.reason))
			else if error?.message
				toastr?.error?(TAPi18n.__(error.message))
			else
				toastr?.error?(error)
		success: (result) ->
			handleBootstrapData(result, callback);


requestBootstrapDataUseAction = (spaceId)->
	SteedosReact = require('@steedos/react');
	store.dispatch(SteedosReact.loadBootstrapEntitiesData({spaceId: spaceId}))

requestBootstrapData = (spaceId, callback)->
	SteedosReact = require('@steedos/react');
	if SteedosReact.store
		requestBootstrapDataUseAction(spaceId);
	else
		requestBootstrapDataUseAjax(spaceId, callback);

Setup.bootstrap = (spaceId, callback)->
	requestBootstrapData(spaceId, callback)


FlowRouter.route '/steedos/logout',
	action: (params, queryParams)->
		#AccountsTemplates.logout();
		$("body").addClass('loading')
		Meteor.logout ()->
#			FlowRouter.go("/steedos/sign-in")
			return

Meteor.startup ()->
	SteedosReact = require('@steedos/react');
	RequestStatusOption = SteedosReact.RequestStatusOption
	lastBootStrapRequestStatus = '';
	SteedosReact.store?.subscribe ()->
		state = SteedosReact.store.getState();
		if lastBootStrapRequestStatus == RequestStatusOption.STARTED
			lastBootStrapRequestStatus = SteedosReact.getRequestStatus(state); # 由于handleBootstrapData函数执行比较慢，因此在handleBootstrapData执行前，给lastBootStrapRequestStatus更新值
			if SteedosReact.isRequestSuccess(state)
				handleBootstrapData(clone(SteedosReact.getBootstrapData(state)));
		else
			lastBootStrapRequestStatus = SteedosReact.getRequestStatus(state);