(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var Random = Package.random.Random;
var MongoInternals = Package.mongo.MongoInternals;
var Mongo = Package.mongo.Mongo;

/* Package-scope variables */
var exposeLivedata, exposeMongoLivedata, MeteorX;

(function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                    //
// packages/meteorhacks_meteorx/packages/meteorhacks_meteorx.js                                       //
//                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                      //
(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/meteorhacks:meteorx/lib/livedata.js                                                 //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
exposeLivedata = function(namespace) {                                                          // 1
  //instrumenting session                                                                       // 2
  var fakeSocket = {send: function() {}, close: function() {}, headers: []};                    // 3
  var ddpConnectMessage = {msg: 'connect', version: 'pre1', support: ['pre1']};                 // 4
  Meteor.default_server._handleConnect(fakeSocket, ddpConnectMessage);                          // 5
                                                                                                // 6
  if(fakeSocket._meteorSession) { //for newer meteor versions                                   // 7
    namespace.Session = fakeSocket._meteorSession.constructor;                                  // 8
                                                                                                // 9
    exposeSubscription(fakeSocket._meteorSession, namespace);                                   // 10
    exposeSessionCollectionView(fakeSocket._meteorSession, namespace);                          // 11
                                                                                                // 12
    if(Meteor.default_server._closeSession) {                                                   // 13
      //0.7.x +                                                                                 // 14
      Meteor.default_server._closeSession(fakeSocket._meteorSession);                           // 15
    } else if(Meteor.default_server._destroySession) {                                          // 16
      //0.6.6.x                                                                                 // 17
      Meteor.default_server._destroySession(fakeSocket._meteorSession);                         // 18
    }                                                                                           // 19
  } else if(fakeSocket.meteor_session) { //support for 0.6.5.x                                  // 20
    namespace.Session = fakeSocket.meteor_session.constructor;                                  // 21
                                                                                                // 22
    //instrumenting subscription                                                                // 23
    exposeSubscription(fakeSocket.meteor_session, namespace);                                   // 24
    exposeSessionCollectionView(fakeSocket._meteorSession, namespace);                          // 25
                                                                                                // 26
    fakeSocket.meteor_session.detach(fakeSocket);                                               // 27
  } else {                                                                                      // 28
    console.error('expose: session exposing failed');                                           // 29
  }                                                                                             // 30
};                                                                                              // 31
                                                                                                // 32
function exposeSubscription(session, namespace) {                                               // 33
  var subId = Random.id();                                                                      // 34
  var publicationHandler = function() {this.ready()};                                           // 35
  var pubName = '__dummy_pub_' + Random.id();                                                   // 36
                                                                                                // 37
  session._startSubscription(publicationHandler, subId, [], pubName);                           // 38
  var subscription = session._namedSubs[subId];                                                 // 39
  namespace.Subscription = subscription.constructor;                                            // 40
                                                                                                // 41
  //cleaning up                                                                                 // 42
  session._stopSubscription(subId);                                                             // 43
}                                                                                               // 44
                                                                                                // 45
function exposeSessionCollectionView(session, namespace) {                                      // 46
  var documentView = session.getCollectionView();                                               // 47
  namespace.SessionCollectionView = documentView.constructor;                                   // 48
                                                                                                // 49
  var id = 'the-id';                                                                            // 50
  documentView.added('sample-handle', id, {aa: 10});                                            // 51
  namespace.SessionDocumentView = documentView.documents[id].constructor;                       // 52
}                                                                                               // 53
//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/meteorhacks:meteorx/lib/mongo-livedata.js                                           //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
exposeMongoLivedata = function(namespace) {                                                     // 1
  var coll = new Meteor.Collection('__dummy_coll_' + Random.id());                              // 2
  //we need wait until db get connected with meteor, .findOne() does that                       // 3
  coll.findOne();                                                                               // 4
                                                                                                // 5
  namespace.MongoConnection = MongoInternals.defaultRemoteCollectionDriver().mongo.constructor; // 6
  var cursor = coll.find();                                                                     // 7
  namespace.MongoCursor = cursor.constructor;                                                   // 8
}                                                                                               // 9
                                                                                                // 10
                                                                                                // 11
//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);






(function () {

//////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                              //
// packages/meteorhacks:meteorx/lib/server.js                                                   //
//                                                                                              //
//////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                //
MeteorX = {};                                                                                   // 1
                                                                                                // 2
exposeLivedata(MeteorX);                                                                        // 3
exposeMongoLivedata(MeteorX);                                                                   // 4
                                                                                                // 5
//////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);

////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("meteorhacks:meteorx", {
  MeteorX: MeteorX
});

})();
