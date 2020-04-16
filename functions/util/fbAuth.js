const { admin, db } = require('../util/admin')

module.exports = (req, res, next) => {
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