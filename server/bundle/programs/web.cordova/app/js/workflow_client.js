'use strict';

var reg_email = /^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/;

var workflowClient = function(userId, auth_token, access_token){
	this.userId = userId;
	this.auth_token = auth_token;
	this.access_token = access_token;
};


workflowClient.prototype.checkFormData = function(){

	var is_pass = true;

	$(".form-control",$("[name='instanceForm']")).each(function(){

		var $element = $(this);

		$element.parent().removeClass("has-error");

		if($element.attr("disabled") !== 'disabled'){
			if($element.parent().data("required") === "true" || $element.parent().data("required") === true){
				var fileValue = "";
				if ($element.attr("type") === "checkbox" || $element.attr("type") === "radio") {
					fileValue = $("[name='" + $element.name + "']:checked").val();
				} else {
					fileValue = $element.val();
				}

				if (!fileValue || fileValue === '' || fileValue.length < 1) {
					$element.parent().addClass("has-error");
					window.toastr.error("请填写" + $element.attr("title"));
					is_pass = false;
				}
			}

			if($element.attr("type") === 'email' && $element.val()){
				if(!reg_email.test($element.val())){
					$element.parent().addClass("has-error");
					window.toastr.error($element.attr("title") + "格式错误");
					is_pass = false;
				}
			}
		}
	});

	return is_pass;
};


workflowClient.prototype.submit_success = function (data, textStatus) {
	var that = this;
	$.ajax({
		url: "/api/workflow/open/submit/"+data.data._id,
		type: 'put',
		headers: {
			'x-space-id': window.space
		},
		async: false,
		data: JSON.stringify(data),
		dataType: 'json',
		processData: false,
		contentType: "application/json",
		success: function(){
			$("[name='instanceForm']")[0].reset();
			window.toastr.success("提交成功");
		},
		error: that.submit_error
	});

};

workflowClient.prototype.submit_error = function (jqXHR, textStatus, errorThrown) {
	window.toastr.error("提交失败");
};

workflowClient.prototype.submit = function () {

	var that = this;

	if(!this.checkFormData()){
		return ;
	}

	var form_values = $("[name='instanceForm']").serializeArray();

	var values = {};

	form_values.forEach(function (item) {
		values[item.name] = item.value;
	});

	$("[data-type='datetime']").each(function(){
		var code = $(this).attr("name");
		if(values[code]){
			values[code] = new Date(values[code]);
		}
	});


	var data = {
		"flow": window.flow,
		"values":values

	};

	var rev;

	$.ajax({
		url: "/api/workflow/open/drafts",
		type: 'POST',
		headers: {
			'x-space-id': window.space
		},
		async: false,
		data: JSON.stringify(data),
		dataType: 'json',
		processData: false,
		contentType: "application/json",
		success: that.submit_success,
		error: that.submit_error
	});

	console.log(rev);
};

function isMobile(){
	return navigator.userAgent.match(/(iPhone|iPod|Android|ios)/i);
}

$(document).ready(function () {

	$(".steedos").before('<a class="btn btn-block btn-steedos-workflow" onclick="wc.submit()"><i class="fa fa-paper-plane"></i> 提交到审批王</a>')

	$("[data-type='date']").each(function(){
		if(isMobile()){
			$(this).attr("type", "date");
		}else{
			$(this).datetimepicker({
				format: 'yyyy-mm-dd',
				language:  'zh-CN',
				weekStart: 1,
				todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 2,
				minView: 2,
				forceParse: 0
			});
		}

	});

	$("[data-type='datetime']").each(function(){
		if(isMobile()){
			$(this).attr("type", "datetime-local");
		}else {
			$(this).datetimepicker({
				format: 'yyyy-mm-dd hh:ii',
				language: 'zh-CN',
				weekStart: 1,
				todayBtn: 1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 2,
				forceParse: 0,
				showMeridian: 1
			});
		}
	});
});

var wc = new workflowClient("","","");