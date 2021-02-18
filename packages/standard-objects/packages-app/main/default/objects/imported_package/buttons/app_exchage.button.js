module.exports = {
    install: function () {
        $.ajax({
            type: "GET",
            url: "/api/get/app/strore/schema",
            success: function (data) {
                if (data.apiKey != null) {
                    var apiKey = data.apiKey;
                    var steedos_server = data.steedos_server;
                    window.AmisEmbed(".slds-media__body", data.pageJson);
                 }  
            },
            error: function (res) {
                aler("安装失败：" + res.status);
            }
        });
    },
    installVisible: function () {
        return true
    }
}