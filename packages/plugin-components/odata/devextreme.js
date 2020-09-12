import DevExpress from "devextreme/bundles/modules/core";
import DevExpressData from "devextreme/bundles/modules/data";
import DevExpressODataStore from "devextreme/bundles/modules/data.odata";

DevExpress.data = DevExpressData;
DevExpress.data.odata = DevExpressODataStore;

export default DevExpress;
