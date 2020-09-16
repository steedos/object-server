(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var TAPi18next = Package['tap:i18n'].TAPi18next;
var TAPi18n = Package['tap:i18n'].TAPi18n;

/* Package-scope variables */
var translations;

(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/cn.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["cn"] = ["cn","cn"];
TAPi18n._enable({"helper_name":"_","supported_languages":null,"i18n_files_route":"/tap-i18n","preloaded_langs":[],"cdn_path":null});
TAPi18n.languages_names["en"] = ["English","English"];
if(_.isUndefined(TAPi18n.translations["cn"])) {
  TAPi18n.translations["cn"] = {};
}

if(_.isUndefined(TAPi18n.translations["cn"][namespace])) {
  TAPi18n.translations["cn"][namespace] = {};
}

_.extend(TAPi18n.translations["cn"][namespace], {"meteor_status_connected":"已连接","meteor_status_connecting":"连接中...","meteor_status_failed":"无法连接服务器","meteor_status_waiting":"等待与服务器连接,","meteor_status_offline":"离线状态。","meteor_status_reconnect_in":"一秒后再尝试...","meteor_status_reconnect_in_plural":"在__count__秒后再尝试...","meteor_status_try_now_waiting":"立即重试","meteor_status_try_now_offline":"重新连接"});
TAPi18n._registerServerTranslator("cn", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/cs.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["cs"] = ["Czech","čeština‎"];
if(_.isUndefined(TAPi18n.translations["cs"])) {
  TAPi18n.translations["cs"] = {};
}

if(_.isUndefined(TAPi18n.translations["cs"][namespace])) {
  TAPi18n.translations["cs"][namespace] = {};
}

_.extend(TAPi18n.translations["cs"][namespace], {"meteor_status_connected":"Připojeno","meteor_status_connecting":"Připojuji k serveru...","meteor_status_failed":"Připojení k serveru selhalo","meteor_status_waiting":"Čekám na připojení k serveru,","meteor_status_offline":"Offline režim.","meteor_status_reconnect_in":"zkusím znovu za moment...","meteor_status_reconnect_in_plural":"zkusím znovu za __count__ sekund...","meteor_status_try_now_waiting":"Připojit","meteor_status_try_now_offline":"Znovu připojit"});
TAPi18n._registerServerTranslator("cs", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/da.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["da"] = ["Danish","Dansk"];
if(_.isUndefined(TAPi18n.translations["da"])) {
  TAPi18n.translations["da"] = {};
}

if(_.isUndefined(TAPi18n.translations["da"][namespace])) {
  TAPi18n.translations["da"][namespace] = {};
}

_.extend(TAPi18n.translations["da"][namespace], {"meteor_status_connected":"Forbundet","meteor_status_connecting":"Forbinder...","meteor_status_failed":"Forbindelsen til serveren gik tabt","meteor_status_waiting":"Afventer forbindelse til server,","meteor_status_offline":"Offline-tilstand.","meteor_status_reconnect_in":"forsøger igen om 1 sekund...","meteor_status_reconnect_in_plural":"forsøger igen om __count__ sekunder...","meteor_status_try_now_waiting":"Forsøg nu","meteor_status_try_now_offline":"Forbind igen"});
TAPi18n._registerServerTranslator("da", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/de.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["de"] = ["German","Deutsch"];
if(_.isUndefined(TAPi18n.translations["de"])) {
  TAPi18n.translations["de"] = {};
}

if(_.isUndefined(TAPi18n.translations["de"][namespace])) {
  TAPi18n.translations["de"][namespace] = {};
}

_.extend(TAPi18n.translations["de"][namespace], {"meteor_status_connected":"Verbunden","meteor_status_connecting":"Verbinden...","meteor_status_failed":"Die Verbindung zum Server wurde unterbrochen","meteor_status_waiting":"Warte auf Verbindung zum Server,","meteor_status_offline":"Offline Modus.","meteor_status_reconnect_in":"Versuche in einer Sekunde zu verbinden...","meteor_status_reconnect_in_plural":"Versuche in __count__ Sekunden zu verbinden...","meteor_status_try_now_waiting":"Jetzt versuchen","meteor_status_try_now_offline":"Nochmal verbinden"});
TAPi18n._registerServerTranslator("de", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/en.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
// integrate the fallback language translations 
translations = {};
translations[namespace] = {"meteor_status_connected":"Connected","meteor_status_connecting":"Connecting...","meteor_status_failed":"The server connection failed","meteor_status_waiting":"Waiting for server connection,","meteor_status_offline":"Offline mode.","meteor_status_reconnect_in":"trying again in one second...","meteor_status_reconnect_in_plural":"trying again in __count__ seconds...","meteor_status_try_now_waiting":"Try now","meteor_status_try_now_offline":"Connect again"};
TAPi18n._loadLangFileObject("en", translations);
TAPi18n._registerServerTranslator("en", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/es.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["es"] = ["Spanish (Spain)","Español"];
if(_.isUndefined(TAPi18n.translations["es"])) {
  TAPi18n.translations["es"] = {};
}

if(_.isUndefined(TAPi18n.translations["es"][namespace])) {
  TAPi18n.translations["es"][namespace] = {};
}

_.extend(TAPi18n.translations["es"][namespace], {"meteor_status_connected":"Conectado","meteor_status_connecting":"Conectando...","meteor_status_failed":"La conexión con el servidor falló","meteor_status_waiting":"Desconectado,","meteor_status_offline":"Modo fuera de línea.","meteor_status_reconnect_in":"reintentando automáticamente en un segundo...","meteor_status_reconnect_in_plural":"reintentando automáticamente en __count__ segundos...","meteor_status_try_now_waiting":"Intentar ahora","meteor_status_try_now_offline":"Conectar de nuevo"});
TAPi18n._registerServerTranslator("es", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/et.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["et"] = ["Estonian","Eesti"];
if(_.isUndefined(TAPi18n.translations["et"])) {
  TAPi18n.translations["et"] = {};
}

if(_.isUndefined(TAPi18n.translations["et"][namespace])) {
  TAPi18n.translations["et"][namespace] = {};
}

_.extend(TAPi18n.translations["et"][namespace], {"meteor_status_connected":"Ühendatud","meteor_status_connecting":"Ühendan...","meteor_status_failed":"Ei saa serveriga ühendust","meteor_status_waiting":"Ootan serveriga ühendust,","meteor_status_offline":"Offline režiimis.","meteor_status_reconnect_in":"proovin uuesti 1 sekundi pärast...","meteor_status_reconnect_in_plural":"proovin uuesti __count__ sekundi pärast...","meteor_status_try_now_waiting":"Proovi nüüd","meteor_status_try_now_offline":"Ühenda uuesti"});
TAPi18n._registerServerTranslator("et", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/fr.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["fr"] = ["French (France)","Français"];
if(_.isUndefined(TAPi18n.translations["fr"])) {
  TAPi18n.translations["fr"] = {};
}

if(_.isUndefined(TAPi18n.translations["fr"][namespace])) {
  TAPi18n.translations["fr"][namespace] = {};
}

_.extend(TAPi18n.translations["fr"][namespace], {"meteor_status_connected":"Connecté","meteor_status_connecting":"Connexion en cours...","meteor_status_failed":"La connexion au serveur a échoué","meteor_status_waiting":"En attente de connexion au serveur","meteor_status_offline":"Mode hors connexion.","meteor_status_reconnect_in":"Tentative de connexion dans une seconde...","meteor_status_reconnect_in_plural":"Tentative de connexion dans __count__ secondes...","meteor_status_try_now_waiting":"Réessayer","meteor_status_try_now_offline":"Reconnexion"});
TAPi18n._registerServerTranslator("fr", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/id.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["id"] = ["Indonesian","Bahasa Indonesia"];
if(_.isUndefined(TAPi18n.translations["id"])) {
  TAPi18n.translations["id"] = {};
}

if(_.isUndefined(TAPi18n.translations["id"][namespace])) {
  TAPi18n.translations["id"][namespace] = {};
}

_.extend(TAPi18n.translations["id"][namespace], {"meteor_status_connected":"Terhubung","meteor_status_connecting":"Menghubungkan...","meteor_status_failed":"Koneksi server gagal","meteor_status_waiting":"Menunggu koneksi server,","meteor_status_offline":"Mode luar jaringan.","meteor_status_reconnect_in":"mencoba lagi dalam waktu satu detik...","meteor_status_reconnect_in_plural":"mencoba lagi dalam waktu __count__ detik...","meteor_status_try_now_waiting":"Coba sekarang","meteor_status_try_now_offline":"Hubungkan lagi"});
TAPi18n._registerServerTranslator("id", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/it.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["it"] = ["Italian","Italiano"];
if(_.isUndefined(TAPi18n.translations["it"])) {
  TAPi18n.translations["it"] = {};
}

if(_.isUndefined(TAPi18n.translations["it"][namespace])) {
  TAPi18n.translations["it"][namespace] = {};
}

_.extend(TAPi18n.translations["it"][namespace], {"meteor_status_connected":"Connesso","meteor_status_connecting":"Connessione in corso...","meteor_status_failed":"Impossibile connettersi al server","meteor_status_waiting":"Server non disponibile,","meteor_status_offline":"Modalità non in linea.","meteor_status_reconnect_in":"riprovo tra pochi secondi...","meteor_status_reconnect_in_plural":"riprovo tra __count__ secondi...","meteor_status_try_now_waiting":"Connetti ora","meteor_status_try_now_offline":"Riprova"});
TAPi18n._registerServerTranslator("it", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/ms.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["ms"] = ["Malay","Bahasa Melayu"];
if(_.isUndefined(TAPi18n.translations["ms"])) {
  TAPi18n.translations["ms"] = {};
}

if(_.isUndefined(TAPi18n.translations["ms"][namespace])) {
  TAPi18n.translations["ms"][namespace] = {};
}

_.extend(TAPi18n.translations["ms"][namespace], {"meteor_status_connected":"Bersambung","meteor_status_connecting":"Menyambung...","meteor_status_failed":"Sambungan pelayan gagal","meteor_status_waiting":"Menunggu sambungan pelayan,","meteor_status_offline":"Mod LuarTalian.","meteor_status_reconnect_in":"cuba lagi dalam masa satu saat...","meteor_status_reconnect_in_plural":"cuba lagi dalam masa __count__ saat...","meteor_status_try_now_waiting":"Cuba sekarang","meteor_status_try_now_offline":"Sambung semula"});
TAPi18n._registerServerTranslator("ms", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/nl.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["nl"] = ["Dutch","Nederlands"];
if(_.isUndefined(TAPi18n.translations["nl"])) {
  TAPi18n.translations["nl"] = {};
}

if(_.isUndefined(TAPi18n.translations["nl"][namespace])) {
  TAPi18n.translations["nl"][namespace] = {};
}

_.extend(TAPi18n.translations["nl"][namespace], {"meteor_status_connected":"Verbonden","meteor_status_connecting":"Bezig met verbinden...","meteor_status_failed":"Verbinding met de server mislukt","meteor_status_waiting":"Wachten op verbinding met de server,","meteor_status_offline":"Offline modus.","meteor_status_reconnect_in":"herverbinden over 1 seconde...","meteor_status_reconnect_in_plural":"herverbinden over __count__ seconden...","meteor_status_try_now_waiting":"Probeer het nu","meteor_status_try_now_offline":"Verbind opnieuw"});
TAPi18n._registerServerTranslator("nl", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/pt.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["pt"] = ["Portuguese (Portugal)","Português"];
if(_.isUndefined(TAPi18n.translations["pt"])) {
  TAPi18n.translations["pt"] = {};
}

if(_.isUndefined(TAPi18n.translations["pt"][namespace])) {
  TAPi18n.translations["pt"][namespace] = {};
}

_.extend(TAPi18n.translations["pt"][namespace], {"meteor_status_connected":"Conectado","meteor_status_connecting":"Conectando...","meteor_status_failed":"A conexão com o servidor falhou","meteor_status_waiting":"Aguardando pela conexão com o servidor,","meteor_status_offline":"Modo offline.","meteor_status_reconnect_in":"tentando novamente em um segundo...","meteor_status_reconnect_in_plural":"tentando novamente em __count__ segundos...","meteor_status_try_now_waiting":"Tentar agora","meteor_status_try_now_offline":"Conectar novamente"});
TAPi18n._registerServerTranslator("pt", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/ru.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["ru"] = ["Russian","Русский"];
if(_.isUndefined(TAPi18n.translations["ru"])) {
  TAPi18n.translations["ru"] = {};
}

if(_.isUndefined(TAPi18n.translations["ru"][namespace])) {
  TAPi18n.translations["ru"][namespace] = {};
}

_.extend(TAPi18n.translations["ru"][namespace], {"meteor_status_connected":"Подключение","meteor_status_connecting":"Подключение ...","meteor_status_failed":"Соединение с сервером не удалось","meteor_status_waiting":"В ожидании соединения с сервером","meteor_status_offline":"Автономный режим.","meteor_status_reconnect_in":"пытается снова в одну секунду ...","meteor_status_reconnect_in_plural":"пытается снова через __count__ секунд ...","meteor_status_try_now_waiting":"Попробуйте сейчас","meteor_status_try_now_offline":"Подключите снова"});
TAPi18n._registerServerTranslator("ru", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/tr.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["tr"] = ["Turkish","Türkçe"];
if(_.isUndefined(TAPi18n.translations["tr"])) {
  TAPi18n.translations["tr"] = {};
}

if(_.isUndefined(TAPi18n.translations["tr"][namespace])) {
  TAPi18n.translations["tr"][namespace] = {};
}

_.extend(TAPi18n.translations["tr"][namespace], {"meteor_status_connected":"Bağlantı sağlandı...","meteor_status_connecting":"Bağlanıyor...","meteor_status_failed":"Sunucu ile bağlantı başarısız...","meteor_status_waiting":"Sunucu bağlantısı bekleniyor...,","meteor_status_offline":"Çevrimdışı mod.","meteor_status_reconnect_in":"tekrar deneniyor...","meteor_status_reconnect_in_plural":"__count__ saniye içinde tekrar denenecek...","meteor_status_try_now_waiting":"Şimdi tekrar dene!","meteor_status_try_now_offline":"Tekrar bağlan!"});
TAPi18n._registerServerTranslator("tr", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/vi.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["vi"] = ["Vietnamese","Tiếng Việt"];
if(_.isUndefined(TAPi18n.translations["vi"])) {
  TAPi18n.translations["vi"] = {};
}

if(_.isUndefined(TAPi18n.translations["vi"][namespace])) {
  TAPi18n.translations["vi"][namespace] = {};
}

_.extend(TAPi18n.translations["vi"][namespace], {"meteor_status_connected":"Đã kết nối","meteor_status_connecting":"Đang kết nối...","meteor_status_failed":"Kết nối tới máy chủ thất bại","meteor_status_waiting":"Đang đợi kết nối tới máy chủ,","meteor_status_offline":"Chế độ ngoại tuyến.","meteor_status_reconnect_in":"Thử kết nối lại trong một giây...","meteor_status_reconnect_in_plural":"Thử kết nối lại trong __count__ giây...","meteor_status_try_now_waiting":"Thử ngay bây giờ","meteor_status_try_now_offline":"Kết nối lại lần nữa"});
TAPi18n._registerServerTranslator("vi", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/zh.i1 //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["zh"] = ["Chinese","中文"];
if(_.isUndefined(TAPi18n.translations["zh"])) {
  TAPi18n.translations["zh"] = {};
}

if(_.isUndefined(TAPi18n.translations["zh"][namespace])) {
  TAPi18n.translations["zh"][namespace] = {};
}

_.extend(TAPi18n.translations["zh"][namespace], {"meteor_status_connected":"已连线","meteor_status_connecting":"连线中...","meteor_status_failed":"无法与服务器连线","meteor_status_waiting":"等待与服务器连线,","meteor_status_offline":"离线模式","meteor_status_reconnect_in":"一分钟后再尝试...","meteor_status_reconnect_in_plural":"在__count__秒钟后再尝试...","meteor_status_try_now_waiting":"现在再试","meteor_status_try_now_offline":"重新连线"});
TAPi18n._registerServerTranslator("zh", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);






(function(){

/////////////////////////////////////////////////////////////////////////
//                                                                     //
// packages/francocatena_status/packages/francocatena_statusi18n/zh-TW //
//                                                                     //
/////////////////////////////////////////////////////////////////////////
                                                                       //
var _ = Package.underscore._,
    package_name = "project",
    namespace = "project";

if (package_name != "project") {
    namespace = TAPi18n.packages[package_name].namespace;
}
TAPi18n.languages_names["zh-TW"] = ["Chinese (Taiwan)","繁体中文（台湾）"];
if(_.isUndefined(TAPi18n.translations["zh-TW"])) {
  TAPi18n.translations["zh-TW"] = {};
}

if(_.isUndefined(TAPi18n.translations["zh-TW"][namespace])) {
  TAPi18n.translations["zh-TW"][namespace] = {};
}

_.extend(TAPi18n.translations["zh-TW"][namespace], {"meteor_status_connected":"已連線","meteor_status_connecting":"連線中...","meteor_status_failed":"無法與伺服器連線","meteor_status_waiting":"等待與服務器連線,","meteor_status_offline":"離線模式。","meteor_status_reconnect_in":"一秒鐘後再嘗試...","meteor_status_reconnect_in_plural":"在__count__秒鍾後再嘗試...","meteor_status_try_now_waiting":"現在再試","meteor_status_try_now_offline":"重新連線"});
TAPi18n._registerServerTranslator("zh-TW", namespace);

/////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("francocatena:status");

})();
