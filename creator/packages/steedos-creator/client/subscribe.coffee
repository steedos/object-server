Creator.subs["Creator"] = new SubsManager()
Creator.subs["CreatorListViews"] = new SubsManager()
Creator.subs["TabularSetting"] = new SubsManager()
Creator.subs["CreatorRecord"] = new SubsManager()
Creator.subs["CreatorActionRecord"] = new SubsManager()
Creator.subs["objectRecentViewed"] = new SubsManager()
Steedos.subs["PendingSpace"] = new SubsManager();

Meteor.startup ->
	
	# Tracker.autorun (c)->
	# 	if Session.get("object_name")
	# 		Creator.subs["objectRecentViewed"].subscribe "object_recent_viewed", Session.get("object_name")

	Tracker.autorun (c)->
		if Session.get("object_name") and Session.get("spaceId")
			Creator.subs["CreatorListViews"].subscribe "object_listviews", Session.get("object_name"), Session.get("spaceId")

	Tracker.autorun (c)->
		if Creator.subs["CreatorListViews"].ready() && Creator.bootstrapLoaded.get()
			object_listViews = Creator.getCollection("object_listviews").find({space: Session.get("spaceId"), object_name: Session.get("object_name")})
			if !Creator.getObject(Session.get("object_name"))
				return
			list_views = Creator.getObject(Session.get("object_name")).list_views
			list_views_byname = Creator.getObject(Session.get("object_name")).list_views
			defaultView = Creator.getObjectDefaultView(Session.get("object_name"))
			object_listViews.forEach (listview)->
				_list_view = Creator.convertListView(defaultView, listview, listview.name)
				if listview.api_name
					_key = listview.api_name
				else
					_key = listview._id
#				if listview.is_default
#					_key = "all"
				list_views[_key] = _list_view
				list_views_byname[_key] = _list_view

			Session.set("change_list_views", Random.id())

			Creator.getCollection("object_listviews").find().observe {
				removed: (oldDocument) ->
					# if oldDocument.name == "recent"
					# 	key = oldDocument.name
					# else
					# 	key = oldDocument._id
					if oldDocument.api_name
						key = oldDocument.api_name
					else
						key = oldDocument._id
					delete Creator.Objects[Session.get("object_name")].list_views[key]
					delete Creator.getObject(Session.get("object_name")).list_views[key]
			}


# Meteor.startup ->
# 	Tracker.autorun (c)->
# 		object_name = Session.get("object_name")
# 		related_object_name = Session.get("related_object_name")
# 		if object_name or related_object_name
# 			object_a = [object_name, related_object_name]
# 			object_a = _.compact(object_a)
# 			Creator.subs["TabularSetting"].subscribe "user_tabular_settings", object_a
			
Meteor.startup ->
	Tracker.autorun (c)->
		if Session.get("object_name") and Session.get("record_id")
			Creator.subs["CreatorRecord"].subscribe "creator_object_record", Session.get("object_name"), Session.get("record_id"), Session.get('spaceId')
#
#	Tracker.autorun (c)->
#		if Session.get("action_object_name") and Session.get("action_record_id")
#			Creator.subs["CreatorActionRecord"].subscribe "creator_object_record", Session.get("action_object_name"), Session.get("action_record_id"), Session.get('spaceId')

Meteor.startup ->
	Tracker.autorun (c)->
		if Session.get("spaceId")
			Meteor.subscribe("myFollows", Session.get("spaceId"))


Meteor.startup ->
	Tracker.autorun (c)->
		if Meteor.userId()
			Steedos.subs["PendingSpace"].subscribe "space_need_to_confirm"
			spaceNeedToConfirm = db.space_users.find({user: Meteor.userId(), invite_state: "pending"}).fetch() || []
			spaceNeedToConfirm.forEach (obj) ->
				Meteor.call 'getPendingSpaceInfo', obj.created_by, obj.space, (error,result) ->
					console.log("getPendingSpaceInfo=====", result);
					if error
						console.log error
					else
						swal {
							title: t("pending_space_invite_info", {inviter: result.inviter, space: result.space})
							type: "info"
							showCancelButton: true
							cancelButtonText: "拒绝"
							confirmButtonColor: "#2196f3"
							confirmButtonText: t('OK')
							closeOnConfirm: true
							allowEscapeKey: false
							allowOutsideClick: false
						}, (option)->
							if option
								Meteor.call 'acceptJoinSpace', obj._id, (error,result) ->
									if error
										console.log error
									else 
										console.log 'acceptJoinSpace'
							else
								Meteor.call 'refuseJoinSpace', obj._id, (error,result) ->
									if error
										console.log error
									else 
										console.log 'refuseJoinSpace'
									
			


