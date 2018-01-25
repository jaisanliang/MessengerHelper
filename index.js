'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').DialogflowApp;
const functions = require('firebase-functions');
const messenger = require('facebook-chat-api');

// Action names from Dialogflow intents
const MESSAGE_ACTION = 'message';
const MESSAGE_CONFIRMED_ACTION = 'message-confirmed';
// Parameters parsed from intents
const NAME = 'name';
const MESSAGE = 'message';
const FULL_NAME = 'fullName';
// Shared context of intents
const CONTEXT = 'messageintent-followup';

exports.message = functions.https.onRequest((request, response) => {
  const app = new App({request, response});
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));

  function messageFulfillment(app) {
    let name = app.getArgument(NAME);
    let message = app.getArgument(MESSAGE);
    getFullName(name, message, app);
  }

  function messageConfirmedFulfillment(app) {
    let name = app.getContextArgument(CONTEXT, NAME).value;
    let message = app.getContextArgument(CONTEXT, MESSAGE).value;
    sendMessage(name, message, app);
  }

  // d. build an action map, which maps intent names to functions
  let actionMap = new Map();
  actionMap.set(MESSAGE_ACTION, messageFulfillment);
  actionMap.set(MESSAGE_CONFIRMED_ACTION, messageConfirmedFulfillment);

  app.handleRequest(actionMap);
});

function getFullName(name, message, app) {
  messenger({email: functions.config().facebook.email, password: functions.config().facebook.password}, (err, api) => {
    if(err) return console.error(err);
    api.getUserID(name, (err, data) => {
      if(err) return console.error(err);
      var fullName = data[0].name;
      var parameters = {};
      parameters[NAME] = name;
      parameters[MESSAGE] = message;
      parameters[FULL_NAME] = fullName;
      app.setContext(CONTEXT, 2, parameters);
      app.ask('About to send \'' + message + '\' to ' + fullName + '. Is this correct?');
    });
  });
}

function sendMessage(name, message, app) {
  messenger({email: functions.config().facebook.email, password: functions.config().facebook.password}, (err, api) => {
    if(err) return console.error(err);
    api.getUserID(name, (err, data) => {
      if(err) return console.error(err);
      // Send the message to the best match
      var threadID = data[0].userID;
      api.sendMessage(message, threadID);
      app.tell('Okay, sending message to '+ name + '.');
    });
  });
}
