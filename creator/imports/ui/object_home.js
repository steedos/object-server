import './object_home.html';
const { pluginComponentSelector, store } = ReactSteedos;

Template.object_home.helpers({
	Component: function(){
		let object_name = Session.get("object_name")
		return pluginComponentSelector(store.getState(), "ObjectHome", object_name);
	}
});
