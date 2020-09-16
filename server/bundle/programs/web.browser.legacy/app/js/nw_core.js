/**
 * Created by dell on 2017/7/13.
 */

var isNode = function () {
	return typeof process !== "undefined" && process !== null ? process.__nwjs : void 0;
}

var isImage = function (type) {
	if (type == "image/tiff"){
		return false;
	}
	return type.startsWith("image/");
}

var isHtml = function (type) {
	return type == "text/html"
}


var openWindow = function(url, target, options) {
	if (!target) {
		target = "_blank";
	}
	if (!options) {
		options = 'scrollbars=yes,EnableViewPortScale=yes,toolbarposition=top,transitionstyle=fliphorizontal,closebuttoncaption=  x  ';
	}
	return window.open(url, target, options);
}


nw_core = {}

var url, net, path, http, https, fs;


nw_core.canOpenFile = function(filename){
	var _exp;
	if (filename.split('.').length < 2) {
		return false;
	}
	_exp = filename.split('.').pop().toLowerCase();
	switch (_exp) {
		case 'doc':
			return true;
		case 'docx':
			return true;
		case 'xls':
			return true;
		case 'xlsx':
			return true;
		case 'ppt':
			return true;
		case 'pptx':
			return true;
		case 'pdf':
			return true;
		case 'tif':
			return true;
		case 'txt':
			return true;
		default:
			return false;
	}
	return false;
}

if (isNode()) {
	// turn off SSL validation checking
	if (window.location.protocol == "https:") {
		process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	}

	url = nw.require('url');
	net = nw.require('net');
	path = nw.require('path');
	https = nw.require('https');
	http = nw.require('http');
	fs = nw.require('fs');
	child_process = nw.require('child_process');
	if (child_process)
		exec = child_process.exec;

}


nw_core.openFile = function (file_url, filename) {

	console.log("file_url", file_url)
	console.log("filename", filename)

	var download_dir = process.env.USERPROFILE + "\\Steedos\\";

	console.log("download_dir", download_dir)

	var filePath = path.join(download_dir, filename);

	var downloaded = function (filePath) {
		var cmd = 'start "" ' + '\"' + filePath + '\"';

		var child = exec(cmd);

		child.on('close',function(){

		});

		child.on('error', function(error) {
			console.error("error", error)
		});
	}

	nw_core.downloadFile(file_url, download_dir, filePath, downloaded)

}

nw_core.downloadFile = function (file_url, download_dir, filePath, callback) {

	fs.exists(download_dir, function(exists) {
		if (exists == true) {
			// 直接下载到本地覆盖之前的同名版本
			_downloadFile(file_url, filePath, callback);
		}else {
			// 新建路径并下载附件到本地
			fs.mkdir(download_dir, function(err) {
				if (err) {
					console.error(err);
				} else {
					_downloadFile(file_url, filePath, callback);
				}
			})
		}
	})
}

var _downloadFile = function(file_url, filePath, callback) {

	var file = fs.createWriteStream(filePath);

	var _HTTP = window.location.protocol.replace(":", "") == 'http' ? http : https;

	var dfile = _HTTP.get(encodeURI(file_url), function(res) {
		res.on('data', function(data) {
			file.write(data);
		}).on('end', function() {
			file.end();

			callback(filePath);
		})
	});
	dfile.on('error', function(e) {
		console.error(e.message);
	})
}