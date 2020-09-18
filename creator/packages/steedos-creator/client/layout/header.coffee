Template.creatorHeader.helpers Creator.helpers

Template.creatorHeader.helpers
	space: ()->
		return db.spaces.findOne(Steedos.getSpaceId())

	logoUrl: (avatar)->
		return Steedos.absoluteUrl("/api/files/avatars/#{avatar}")

	defaultLogoUrl: ()->
		logo_url = "/packages/steedos_creator/assets/logo-square.png"
		return Steedos.absoluteUrl(logo_url)
	
	currentUserUser: ()->
		url = "app/admin/users/view/#{Steedos.userId()}"
		return Creator.getRelativeUrl(url)

	showSwitchOrganization : ()->
		show_switch_organization = Meteor?.settings?.public?.theme?.show_switch_organization
		if show_switch_organization
			return show_switch_organization
		else
			return false
		
	avatarURL: (avatar,w,h,fs) ->
		userId = Meteor.userId()
		avatar = Creator.getCollection("users").findOne({_id: userId})?.avatar
		if avatar
			return Steedos.absoluteUrl("avatar/#{Meteor.userId()}?w=220&h=200&fs=160&avatar=#{avatar}")
		else
			return Creator.getRelativeUrl("/packages/steedos_lightning-design-system/client/images/themes/oneSalesforce/lightning_lite_profile_avatar_96.png")

	displayName: ->
		if Meteor.user()
			return Meteor.user().displayName()
		else
			return " "

	signOutUrl: ()->
		return Creator.getRelativeUrl("/accounts/a/#/logout")

	isAdmin: ()->
		return Steedos.isSpaceAdmin()

	showShopping: ()->
		return Steedos.isSpaceAdmin() && !_.isEmpty(Creator?._TEMPLATE?.Apps)

	showViewObject: ()->
		if !Steedos.isSpaceAdmin()
			return false
		objectName = Session.get("object_name");
		_object = Creator.getObject(objectName);
		if objectName && !_object?.hidden && window._SteedosHiddenObjects && !_.include(window._SteedosHiddenObjects, objectName)
			return true
		else
			return false


Template.creatorHeader.events

	'click .creator-button-setup': (e, t)->
		FlowRouter.go("/app/admin")

	'click .creator-button-shopping': (e, t)->
		Modal.show('template_apps_list_modal')
		
	'click .creator-button-toggle': (e, t)->
		Modal.show("list_tree_modal")

	'click .current-user-link': (e, t)->
		url = Steedos.getUserRouter();
		FlowRouter.go(url)

	'click .history-back': ()->
		history.back()

	'click .history-forward': ()->
		history.forward()

	'click .refresh': ()->
		location.reload()

	'click .creator-button-help': (event, template) ->
		Steedos.openWindow "https://www.steedos.com/help";

	'click .slds-dropdown-trigger_click': (event, template) ->
		if $(event.currentTarget).hasClass('slds-is-open')
			$(event.currentTarget).removeClass('slds-is-open')
		else
			$(event.currentTarget).addClass('slds-is-open')
	'click .show-object': ()->
		object = Creator.getObject(Session.get("object_name"))
		Steedos.openWindow Creator.getObjectUrl("objects", object._id, 'admin')
