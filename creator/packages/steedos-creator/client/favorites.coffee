@Favorites = {};

getActionSelected = (params, object_name)->
	if params.list_view_id && !_.has(params, 'record_id')
		if Creator.getCollection("favorites").findOne({object_name: object_name, record_type: 'LIST_VIEW', record_id: params.list_view_id})
			return true
	else if params.record_id
		if Creator.getCollection("favorites").findOne({object_name: object_name, record_type: 'RECORD', record_id: params.record_id})
			return true
	return false;

getActionDisabled = (params)->
	if params.list_view_id && !_.has(params, 'record_id')
		return false
	else if params.record_id
		return false
	return true

getAssistiveText = (actionDisabled, actionSelected)->
	assistiveText = {action: '',more: t("webapp_favorites_more"), editFavorites: t("webapp_favorites_edit")}
	if actionDisabled
		assistiveText.action = t("webapp_favorites_action_not_support")
	else
		if actionSelected
			assistiveText.action = t("webapp_favorites_action_remove")
		else
			assistiveText.action = t("webapp_favorites_action_add")
	return assistiveText

Favorites.changeRecords = ()->
	SteedosReact = require('@steedos/react');
	SteedosReact.store.dispatch(SteedosReact.changeRecords(Creator.getCollection("favorites").find({space: Session.get("spaceId"), owner: Meteor.userId()}, {sort: {sort_no: -1, modified: -1}}).fetch(), 'steedos-header-favorites'))

Favorites.changeState = ()->
	SteedosReact = require('@steedos/react');
	currentRouter = FlowRouter.current();
	params = currentRouter?.params

	if _.has(params, 'box') && _.has(params, 'instanceId')
		object_name = 'instances'
		params = {record_id: params.instanceId}
	else
		object_name = params.object_name || Session.get("object_name")
	if object_name
		actionDisabled = getActionDisabled(params);
		actionSelected = getActionSelected(params, object_name);
		SteedosReact.store.dispatch(SteedosReact.changeActionSelected(actionSelected, 'steedos-header-favorites'))
		SteedosReact.store.dispatch(SteedosReact.changeActionDisabled(actionDisabled, 'steedos-header-favorites'))
		SteedosReact.store.dispatch(SteedosReact.changeAssistiveText(getAssistiveText(actionDisabled, actionSelected), 'steedos-header-favorites'))
	else
		actionDisabled = getActionDisabled(params);
		SteedosReact.store.dispatch(SteedosReact.changeActionDisabled(actionDisabled, 'steedos-header-favorites'))
		SteedosReact.store.dispatch(SteedosReact.changeAssistiveText(getAssistiveText(actionDisabled, actionSelected), 'steedos-header-favorites'))

Favorites.getActionSelected = getActionSelected

Favorites.isRecordSelected = (object_name, record_id)->
	return getActionSelected({record_id}, object_name)

Meteor.startup ()->
	Meteor.autorun ()->
		if Creator.subs["CreatorFavorites"].ready("myFavorites") && Creator.bootstrapLoaded.get()
			Favorites.changeRecords();
			Favorites.changeState();


