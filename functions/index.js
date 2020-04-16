const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const firebaseConfig = {
    apiKey: "AIzaSyCRsEBC99_H4oEMLGC83rJ-tv3MgVK9qzM",
    authDomain: "socialape-d6344.firebaseapp.com",
    databaseURL: "https://socialape-d6344.firebaseio.com",
    projectId: "socialape-d6344",
    storageBucket: "socialape-d6344.appspot.com",
    messagingSenderId: "566786809671",
    appId: "1:566786809671:web:974b5bc35f69a655b8b662"
  };

const app = require('express')();

const firebase = require('firebase');
firebase.initializeApp(firebaseConfig);

const db = admin.firestore();

app.get('/screams', (req, res) => {
  db.collection('screams').orderBy('createdAt', 'desc').get()
    .then(data => {
        let screams = [];
        data.forEach(doc => {
            screams.push({
                screamId: doc.id,
                body: doc.data().body,
                userHandle: doc.data().userHandle,
                createdAt: doc.data().createdAt
            });
        });
        return res.json(screams)
    })
    .catch(err => res.json(err.message))
})

const FBAuth = (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        return res.status(403).json({ error: 'Unauthorized' })
    }
    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken;
            console.log('decodedUoken: ', decodedToken);
            return db.collection('users')
            .where('userId', '==', req.user.uid)
            .limit(1)
            .get();
        })
        .then(data => {
            req.user.handle = data.docs[0].data().handle;
            return next();
        })
        .catch(err => {
            console.log('Error while verifying token ',err);
            return res.status(403).json(err)
            
        })
}

//Post one scream
app.post('/scream', FBAuth, (req, res) => {
    if(req.method !== 'POST') return res.status(400).json({error: 'Method not allowed'});

   const newScream = {
       body: req.body.body,
       userHandle: req.user.handle,
       createdAt: new Date().toISOString()
   };

   db.collection('screams').add(newScream)
    .then(doc => {
        return res.json({message: `document ${doc.id} created successfully`})
    })
    .catch(err => {
        res.status(500).json({error: err.message});
        console.log(err.message);
        
    })
});

const isEmpty = (string) => {
    if(string.trim() === '') return true;
    else return false;
}
const isEmail = (email) => {
    const regEx =  /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if(email.match(regEx)) return true;
    else return false;
}
//signup route
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    let errors = {};

    if(isEmpty(newUser.email)){
        errors.email = 'must not be empty'
    } else if(!isEmail(newUser.email)){
        errors.email = 'Must be a valid email address'
    }

    if(isEmpty(newUser.password)) errors.password = 'Must not empty'
    if(newUser.password !== newUser.confirmPassword) errors.confirmPassword = 'Passwords must match'
    if(isEmpty(newUser.handle)) errors.handle = 'Must not empty'

    if(Object.keys(errors).length > 0) return res.status(400).json(errors)

    //validate data

    let token, userId;
    db.doc(`/users/${newUser.handle}`).get()
        .then(doc => {
            if(doc.exists){
                return res.status(400).json({ handle: 'this handle is already taken' })

            }else {
                return firebase.auth().createUserWithEmailAndPassword(newUser.email, newUser.password)
            }
        })
        .then(data => {
            userId = data.user.uid;
           return data.user.getIdToken(); 
        })
        .then(resToken => {
            token = resToken;
            const userCredentials = {
                handle: newUser.handle,
                email: newUser.email,
                createdAt: new Date().toISOString(),
                userId
            };
            return db.doc(`/users/${newUser.handle}`).set(userCredentials)
        })
        .then(result => {
            return res.status(201).json({ token });
        })
        .catch(error => {
            console.log(error);
            if(error.code === 'auth/email-already-in-use'){
                return res.status(400).json({email: 'Email is already is used'})
            }else {
                return res.status(500).json({error: error.code})
            }
        })
});

app.post('/login', (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };
    let errors = {};
    if(isEmpty(user.email)) errors.email = 'must not be empty';
    if(isEmpty(user.password)) errors.password = 'must not be empty';
    if(Object.keys(errors).length > 0) return res.status(400).json(errors);

    firebase.auth().signInWithEmailAndPassword(user.email, user.password)
        .then(data => {
            return data.user.getIdToken();
        })
        .then(token => {
            return res.json({token})
        })
        .catch(err => {
            if(err.code === 'auth/wrong-password'){
                return res.status(403).json({general: 'Wrong credential, please try again'})
            } else if (err.code === 'auth/user-not-found') {
                return res.status(403).json({general: 'Wrong credential, please try again'})
            }else {
                return res.status(500).json({error: err.code})
            }
        })
})

// https://baseurl.com/api/xxx
exports.api = functions.region('asia-east2').https.onRequest(app);


