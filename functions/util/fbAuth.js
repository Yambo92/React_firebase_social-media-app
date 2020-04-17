const { admin, db } = require('../util/admin')

module.exports = (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
        idToken = req.headers.authorization.split('Bearer ')[1];
    } else {
        return res.status(403).json({ error: 'Unauthorized' })
    }
    /* 
        decodedToken:  { iss: 'https://securetoken.google.com/socialape-d6344',
                    aud: 'socialape-d6344',
                    auth_time: 1587039765,
                    user_id: '4GHTz5VQEAU1CdZ6HYTKPGDs5S72',
                    sub: '4GHTz5VQEAU1CdZ6HYTKPGDs5S72',
                    iat: 1587039765,
                    exp: 1587043365,
                    email: 'ceshi7@qq.com',
                    email_verified: false,
                    firebase: { identities: { email: [Array] }, sign_in_provider: 'password' },
                    uid: '4GHTz5VQEAU1CdZ6HYTKPGDs5S72' }
    */
    admin.auth().verifyIdToken(idToken)
        .then(decodedToken => {
            req.user = decodedToken;
            return db.collection('users')
            .where('userId', '==', req.user.uid)
            .limit(1)
            .get();
        })
        .then(data => {
            req.user.handle = data.docs[0].data().handle;
            req.user.imageUrl = data.docs[0].data().imageUrl;
            return next();
        })
        .catch(err => {
            console.log('Error while verifying token ',err);
            return res.status(403).json(err)
            
        })
}