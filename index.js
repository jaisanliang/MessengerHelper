'use strict';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').DialogflowApp;
const functions = require('firebase-functions');
const messenger = require("facebook-chat-api");

// a. the action name from the make_name Dialogflow intent
const MESSAGE_ACTION = 'message';
// b. the parameters that are parsed from the make_name intent 
const NAME = 'name';
const MESSAGE = 'message';


exports.message = functions.https.onRequest((request, response) => {
  const app = new App({request, response});
  console.log('Request headers: ' + JSON.stringify(request.headers));
  console.log('Request body: ' + JSON.stringify(request.body));


// c. The function that sends a message
  function sendMessage(app) {
    let name = app.getArgument(NAME);
    let message = app.getArgument(MESSAGE);
    app.tell('Alright, sending ' +
      message + ' to ' + name + '.');
    sendMessageHelper(name, message);
  }
  // d. build an action map, which maps intent names to functions
  let actionMap = new Map();
  actionMap.set(MESSAGE_ACTION, sendMessage);


app.handleRequest(actionMap);
});

function sendMessageHelper(name, message) {
    messenger({email: functions.config().facebook.email, password: functions.config().facebook.password}, (err, api) => {
        if(err) return console.error(err);
        api.getUserID(name, (err, data) => {
            if(err) return console.error(err);

            // Send the message to the best match (best by Facebook's criteria)
            var msg = message;
            var threadID = data[0].userID;
            api.sendMessage(msg, threadID);
        });
    });
}
