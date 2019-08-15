import {
  dialogflow,
} from 'actions-on-google';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as functions from 'firebase-functions';

import { RootIntent } from './intents';

const app = dialogflow({
  debug: false,
});

app.intent('Default Welcome Intent', (conv) => {
  conv.ask('Hi, how is it going?');;
});

new RootIntent(app);

// express
const server = express();
server.use(bodyParser.json());
server.listen(process.env.PORT || 5000, () => {
  console.log('App started');
});
server.post('/fulfillment', app);

// Firebase
// export const fulfillment = functions.https.onRequest(app);

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
