
#Template.adminMenu.onRendered ->
#	this.$("#admin_menu").removeClass "hidden"
#	this.$("#admin_menu").animateCss "fadeInRight"

Template.adminMenu.helpers 
	avatarURL: (avatar,w,h,fs) ->
		userId = Meteor.userId()
		avatar = Creator.getCollection("users").findOne({_id: userId})?.avatar
		if avatar
			return Steedos.absoluteUrl("avatar/#{Meteor.userId()}?avatar=#{avatar}")
		else
			return Creator.getRelativeUrl("/packages/steedos_lightning-design-system/client/images/themes/oneSalesforce/lightning_lite_profile_avatar_96.png")

	name: ()->
		return Creator.getCollection("users").findOne()?.name

	logoutUrL: ()->
		return Creator.getRelativeUrl("/accounts/a/#/logout")

	spaceName: ->
		if Session.get("spaceId")
			space = db.spaces.findOne(Session.get("spaceId"))
			if space
				return space.name
		return t("none_space_selected_title")
		 

Template.adminMenu.events
	'click .steedos-logout': ()->
		Steedos.logout();
	"click .admin-menu-back": (event, template) ->
		lastUrl = urlQuery[urlQuery.length - 2]
		urlQuery.pop()
		template.$("#admin_menu").animateCss "fadeOutRight", ->
			Blaze.remove(template.view)
			if lastUrl
				FlowRouter.go lastUrl
			else
				FlowRouter.go '/app'
	
	'click .btn-switch-space': (event, template)->
		FlowRouter.go '/user_settings/switchspace'

	'click .btn-change-password': (event, template)->
		Modal.show("reset_password_modal")

	'click .btn-change-avatar': (event, template)->
		template.$("#mobile-avator-upload").click()

	'change #mobile-avator-upload': (event, template)->
		file = event.target.files[0];
		unless file
			return
		$("body").addClass("loading");
		db.avatars.insert file, (error, fileDoc)->
			if error
				console.error error
				toastr.error t(error.reason)
				$(document.body).removeClass('loading')
			else
				# Inserted new doc with ID fileDoc._id, and kicked off the data upload using HTTP
				# 理论上这里不需要加setTimeout，但是当上传图片很快成功的话，定阅到Avatar变化时可能请求不到上传成功的图片
				setTimeout(()->
					Meteor.call "updateUserAvatar", fileDoc._id, (error, result)->
						if result?.error
							$(document.body).removeClass('loading')
							toastr.error t(result.message)
						else
							$(document.body).removeClass('loading')
				, 3000)