const functions = require('firebase-functions');

const app = require('express')();

const FBAuth = require('./util/fbAuth')

const { getAllScreams, postOneScream } = require('./handlers/screams')

const { signUp, login } = require('./handlers/users')

//Scream route
app.get('/screams', getAllScreams)

//Post one scream
app.post('/scream', FBAuth, postOneScream);

//users route
app.post('/signup', signUp);

app.post('/login', login)

// https://baseurl.com/api/xxx
exports.api = functions.region('asia-east2').https.onRequest(app);


