var designer = {
	urlQuery: function(name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
		var r = window.location.search.substr(1).match(reg);
		if (r != null) return unescape(r[2]);
		return null;
	},
	run: function() {
		var Steedos = window.opener ? window.opener.Steedos : null;
		var toastr = window.opener ? window.opener.toastr : null;
		var title = this.urlQuery("title");
		if (title) {
			document.title = decodeURIComponent(decodeURIComponent(title));
		}
		if (Steedos) {
			// 去除客户端右击事件
			Steedos.forbidNodeContextmenu(window, "#ifrChart");
		}
		var type = this.urlQuery("type");
		var instance_id = this.urlQuery("instance_id");
		var errMsg = "";
		if(!instance_id){
			errMsg = "参数错误";
			toastr && toastr.error("errMsg");
			console.error(errMsg);
			return;
		}
		switch(type){
			case "traces":
				$("#ifrChart").attr("src", "/api/workflow/chart/traces?instance_id=" + instance_id);
				break;
			case "traces_expand":
				$("#ifrChart").attr("src", "/api/workflow/chart/traces_expand?instance_id=" + instance_id);
				break;
			default:
				$("#ifrChart").attr("src", "/api/workflow/chart?instance_id=" + instance_id);
				break;
		}
	}
};
$(function() {
	designer.run();
});