checkUserSigned = (context, redirect) ->
	# if !Meteor.userId()
	# 	Setup.validate();

FlowRouter.route '/',
	action: (params, queryParams)->
		FlowRouter.go '/app'

FlowRouter.route '/admin',
	action: (params, queryParams)->
		FlowRouter.go '/app/admin'

FlowRouter.route '/steedos/sign-in',
	triggersEnter: [ (context, redirect)->
		Steedos.redirectToSignIn()
	]

#FlowRouter.route '/steedos/logout',
#	action: (params, queryParams)->
#		$("body").addClass('loading')
#		Meteor.logout ()->
#			return

FlowRouter.route '/select-users',
	action: (params, queryParams)->
		BlazeLayout.render 'selectUsersLayout',
			main: "reactSelectUsers"

FlowRouter.route '/steedos/springboard',
	triggersEnter: [ ->
		FlowRouter.go "/"
	]

FlowRouter.triggers.enter (context, redirect, stop)->
	if context?.queryParams?.app_id
		Session.set('current_app_id', context.queryParams.app_id)


FlowRouter.route '/apps/iframe/:app_id',
	triggersEnter: [ checkUserSigned ],
	action: (params, queryParams)->
		authToken = {};
		authToken["spaceId"] = Steedos.getSpaceId()
		authToken["X-User-Id"] = Meteor.userId()
		authToken["X-Auth-Token"] = Accounts._storedLoginToken()
		url = Meteor.absoluteUrl("api/setup/sso/" + params.app_id + "?" + $.param(authToken))

		BlazeLayout.render 'iframeLayout',
			url: url


## 不知还能不能用
FlowRouter.route '/steedos/sso', 
	action: (params, queryParams)->
		returnurl = queryParams.returnurl

		Steedos.loginWithCookie ()->
			Meteor._debug("cookie login success");
			FlowRouter.go(returnurl);


FlowRouter.route '/admin/view-logs',
	triggersEnter: [ checkUserSigned ],
	action: (params, queryParams)->
		BlazeLayout.render Creator.getLayout(),
			main: "viewLogs"
