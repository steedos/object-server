import DevExpress from './devextreme';

let ODataClient = {
    query(object_name, {space_id, options, callback}) {
        if (!space_id) {
            return;
        }
        if (!object_name) {
            return;
        }
        if (typeof callback != "function") {
            return;
        }
        if (!options){
            options = {};
        }
        let url = "/api/odata/v2/" + space_id + "/" + object_name;
        options.store = new DevExpress.data.ODataStore({
            type: "odata",
            version: 4,
            url: url,
            withCredentials: false,
            beforeSend: function(request) {
                request.headers['X-User-Id'] = "97zjiueTefx5aKnco";
                request.headers['X-Space-Id'] = space_id;
                request.headers['X-Auth-Token'] = "qhJgFasUzYQcw7CYQ__g2Dv-Ydzw8MVIwepwllQtQ21";
            },
            errorHandler: function (error) {
                console.error(error);
            },
            fieldTypes: {
                '_id': 'String'
            }
        });
        let datasource = new DevExpress.data.DataSource(options);
        datasource.load().done(function (result, args) {
            callback(result, args);
        }).fail(function (error) {
            console.error(error);
            if (error.reason) {
                if (typeof toastr !== "undefined" && toastr !== null) {
                    if (typeof toastr.error === "function") {
                        toastr.error(TAPi18n.__(error.reason));
                    }
                }
            } else if (error.message) {
                if (typeof toastr !== "undefined" && toastr !== null) {
                    if (typeof toastr.error === "function") {
                        toastr.error(TAPi18n.__(error.message));
                    }
                }
            } else {
                if (typeof toastr !== "undefined" && toastr !== null) {
                    if (typeof toastr.error === "function") {
                        toastr.error(error);
                    }
                }
            }
            callback(false, error);
        });
    }
};

export default ODataClient;

