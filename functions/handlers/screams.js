const { db } = require('../util/admin')

exports.getAllScreams =  (req, res) => {
    db.collection('screams').orderBy('createdAt', 'desc').get()
      .then(data => {
          let screams = [];
          data.forEach(doc => {
              screams.push({
                  screamId: doc.id,
                  body: doc.data().body,
                  userHandle: doc.data().userHandle,
                  createdAt: doc.data().createdAt,
                  commentCount: doc.data().commentCount,
                  likeCount: doc.data().likeCount
              });
          });
          return res.json(screams)
      })
      .catch(err => res.json(err.message))
  }

  exports.postOneScream =  (req, res) => {
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
}