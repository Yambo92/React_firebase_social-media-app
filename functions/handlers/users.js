const { db, admin } = require('../util/admin')

const config = require('../util/config')

const firebase = require('firebase');



firebase.initializeApp(config);

const {validateSignUpData , validateLoginData, reduceUserDetails} = require('../util/validations')

//sign up
exports.signUp = (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle,
    };

    //validate data
    const { valid, errors} = validateSignUpData(newUser);

    if(!valid) return res.status(400).json(errors)

    const noImg = 'no-img.png'

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
                imageUrl:  `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
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
                return res.status(500).json({general: 'Something went wrong, please try again! '})
            }
        })
}

//login
exports.login = (req, res) => {
    const user = {
        email: req.body.email,
        password: req.body.password
    };
        //validate data
        const { valid, errors} = validateLoginData(user);

        if(!valid) return res.status(400).json(errors)
   
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
                // return res.status(500).json({error: err.code})
                return res.status(403).json({general: 'Wrong credential, please try again'})
            }
        })
}

//add user details
exports.addUserDetails = (req, res) => {
    let userDetails = reduceUserDetails(req.body);

    db.doc(`/users/${req.user.handle}`).update(userDetails)
        .then(() => {
            return res.json({ message: 'Details added successfully' })
        })
        .catch(err => {
            return res.status(500).json({error: err.code})
        })
}

//get own user details
exports.getAuthenticatedUser = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.user.handle}`).get()
        .then(doc => {
            if(doc.exists) {
                userData.credentials = doc.data();
                return db.collection('likes').where('userHandle', '==', req.user.handle).get()
            }
        })
        .then(data => {
            userData.likes = [];
            data.forEach(doc => {
                userData.likes.push(doc.data())
            });
            return db.collection('notifications').where('recipient', '==', req.user.handle)
                .orderBy('createdAt', 'desc').limit(10).get();
        })
        .then(data => {
            userData.notifications = [];
            data.forEach(doc => {
                userData.notifications.push({
                    recipient: doc.data().recipient,
                    sender: doc.data().sender,
                    createdAt: doc.data().createdAt,
                    screamId: doc.data().screamId,
                    type: doc.data().type,
                    read: doc.data().read,
                    notificationId: doc.id
                })
            });
            return res.json(userData)
        })
        .catch(err => {
            res.status(500).json({error: err.code})
        })
}


//get any user's details
exports.getUserDetails = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.params.handle}`).get()
        .then(doc => {
            if(doc.exists){
                userData.user = doc.data();
                return db.collection('screams').where('userHandle', '==', req.params.handle)
                    .orderBy('createdAt', 'desc')
                    .get();
            } else {
                return res.status(404).json({error: 'User not found'})
            }
        })
        .then(data => {
            userData.screams = [];
            data.forEach(doc => {
                userData.screams.push({
                    body: doc.data().body,
                    createdAt: doc.data().createdAt,
                    userHandle: doc.data().userHandle,
                    userImage: doc.data().userImage,
                    likeCount: doc.data().likeCount,
                    commentCount: doc.data().commentCount,
                    screamId: doc.id
                })
            });
            return res.json(userData)
        })
        .catch(err => {
            return res.status(500).json({error: err.code})
        })
}

exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();
    req.body.forEach(notificationId => {
        const notification = db.doc(`/notifications/${notificationId}`)
        batch.update(notification, {read: true});
    });
    batch.commit()
        .then(() => {
            return res.json({message: 'Notifications marked read'})
        })
        .catch(err => {
            return res.status(500).json({error: err.code})
        })
}

//upload user profile image
exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy')
    const path = require('path')
    const os = require('os')
    const fs = require('fs')
    const busboy = new BusBoy({headers: req.headers});

    let imageFileName;
    let imageToBeUploaded = {};

    //mimetype: image/jpeg
    //filename: girle_0.jpg
    //fieldname: image
   
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
        if(!/image\/\*/.test(mimetype)){
            return res.status(400).json({error: 'Wrong file type emitted'})
        }
        //img.png
        const imageExtension = filename.split('.')[filename.split('.').length - 1];
        //8703487285.png
        imageFileName = `${Math.round(Math.random() * 10000000000)}.${imageExtension}`
        const filepath = path.join(os.tmpdir(), imageFileName);
        imageToBeUploaded = {filepath, mimetype};
        file.pipe(fs.createWriteStream(filepath))
    });
    busboy.on('finish', () => {
        admin.storage().bucket().upload(imageToBeUploaded.filepath, {
            resumable: false,
            metadata: {
                contentType: imageToBeUploaded.mimetype
            }
        })
        .then(() => {
            const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
            return db.doc(`/users/${req.user.handle}`).update({ imageUrl })
        })
        .then(() => {
            return res.json({ message: 'Image uploaded successfully' })
        })
        .catch(err => {
            console.log(err);
            return res.status(500).json({error: err.code})
            
        })
    });
    busboy.end(req.rawBody);
}




