import './select_users.html';
const { store, viewStateSelector } = ReactSteedos;
import SelectUsersContainer from './containers/SelectUsers.jsx'
var _ = require("underscore");

function getTagElement(){
	var searchParams = new URLSearchParams(window.location.search);
	return searchParams.get("tag_element")
}

function getSearchJson(){
	var searchParams = new URLSearchParams(window.location.search);
	var searchData = {};

	for(var i of searchParams.keys()){
		searchData[i] =searchParams.get(i)
	}
	return searchData
}

function closeWindow(){
	window.location.href="about:blank";
	window.close();
}

var defaultGridId = "selectUsers";

Template.reactSelectUsers.helpers({
	SelectUsers: function(){
		return SelectUsersContainer;
	},
	multiple: function(){
		return true;
	},
	gridId: function(){
		return getTagElement() || defaultGridId
	}
});


Template.reactSelectUsers.events({
	'click .cancel': function(){
		closeWindow();
	},
	'click .confirm': function(){
		var tagElement = getTagElement();
		var viewData = viewStateSelector(store.getState(), tagElement);
		if(_.isEmpty(viewData.selection)){
			toastr.warning("请选择用户");
			return false;
		}
		var postData = Object.assign({}, getSearchJson(), {selection: viewData.selection});
		window.opener.postMessage(postData, "*");
		closeWindow();
	}
});
