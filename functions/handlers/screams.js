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
                  likeCount: doc.data().likeCount,
                  userImage: doc.data().userImage
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
       userImage: req.user.imageUrl,
       createdAt: new Date().toISOString(),
       likeCount: 0,
       commentCount:0
   };

   db.collection('screams').add(newScream)
    .then(doc => {
        const resScream = newScream;
        resScream.screamId = doc.id;
        return res.json({resScream})
    })
    .catch(err => {
        res.status(500).json({error: err.message});
        console.log(err.message);
        
    })
}

//获取scream 以及其相关的评论（倒序）
exports.getScream = (req, res) => {
    let screamData = {};
    db.doc(`/screams/${req.params.screamId}`).get()
        .then(doc => {
            if(!doc.exists){
                return res.status(404).json({error: 'Scream not found'})
            }
            screamData = doc.data();
            screamData.screamId = doc.id;
            return db.collection('comments').orderBy('createdAt', 'desc').where('screamId', '==', req.params.screamId).get();
        })
        .then(data => {
            screamData.comments = [];
            data.forEach(doc => {
                screamData.comments.push(doc.data())
            });
            return res.json(screamData)
        })
        .catch(err => {
            res.status(500).json({ error: err.code })
        })
}

//对一个scream发布评论
exports.commentOnScream = (req, res) => {
    if(req.body.body.trim() === '') return res.status(400).json({comment: 'must not be empty'})

    const newComment = {
        body: req.body.body,
        createdAt: new Date().toISOString(),
        screamId: req.params.screamId,
        userHandle: req.user.handle,
        userImage: req.user.imageUrl
    };
    db.doc(`/screams/${req.params.screamId}`).get()
        .then(doc => {
            if(!doc.exists){
                return res.status(404).json({error: 'Scream not found'})
            } 
            return doc.ref.update({commentCount: doc.data().commentCount + 1})
        })
        .then(() => {
            return db.collection('comments').add(newComment)
        })
        .then(() => {
                res.json(newComment)
        })
        .catch(err => {
            console.log(err.code);
            res.status(500).json({error: 'Something went wrong'})
        })
};

//like sceam
exports.likeScream = (req, res) => {
    //userHandle是用户的唯一标识
    //likes的collection的document中存储的有userHandle 和 screamId
    //likeDocument获得的是当前用户对这个scream是否点过赞
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
        .where('screamId', '==', req.params.screamId).limit(1);
        //获取这个scream
        const screamDocument = db.doc(`/screams/${req.params.screamId}`);
       
        let screamData = {};

        screamDocument.get()
            .then(doc => {
                if(doc.exists){ //如果这个scream存在
                    screamData = doc.data(); //把这个scream的数据暂存在screamData中
                    screamData.screamId = doc.id;
                    return likeDocument.get(); // 返回这个scream原有的点赞document
                } else {
                    return res.status(404).json({ error: 'Scream not found' })
                }
            })
            .then(data => {
                if(data.empty){ //如果这个scream原本就没有过点赞关联的document就给likes的collection添加一条点赞的document
                    return db.collection('likes').add({
                        screamId: req.params.screamId,
                        userHandle: req.user.handle
                    })
                    .then(() => {
                        screamData.likeCount++ //scream更新
                        return screamDocument.update({ likeCount: screamData.likeCount })
                    })
                    .then(() => { //返回点赞后的scream信息
                        return res.json(screamData)
                    })
                } else {//当前用户对这个scream点过赞
                    return res.status(400).json({error: 'Scream already liked'})
                }
            })
            .catch(err => {
                res.status(500).json({error: err.code})
            })
};

exports.unlikeScream = (req, res) => {
    const likeDocument = db.collection('likes').where('userHandle', '==', req.user.handle)
        .where('screamId', '==', req.params.screamId).limit(1);

        const screamDocument = db.doc(`/screams/${req.params.screamId}`);
        let screamData = {};
        screamDocument.get()
            .then(doc => {
                if(doc.exists){ //如果这个scream存在
                    screamData = doc.data(); //把这个scream的数据暂存在screamData中
                    screamData.screamId = doc.id;
                    return likeDocument.get(); // chain这个scream原有的点赞document
                } else {
                    return res.status(404).json({ error: 'Scream not found' })
                }
            })
            .then(data => {
                if(data.empty){ //如果这个scream原本就没有过点赞关联的document就给likes的collection添加一条点赞的document
                    return res.status(400).json({error: 'Scream not liked'})
                  
                } else {//当前用户对这个scream点过赞
                    return db.doc(`/likes/${data.docs[0].id}`).delete()
                        .then(() => {
                            screamData.likeCount-- //scream更新
                            return screamDocument.update({ likeCount: screamData.likeCount })
                        })
                        .then(() => { //返回点赞后的scream信息
                            return res.json(screamData)
                        })
                }
            })
            .catch(err => {
                res.status(500).json({error: err.code})
            })
};

//delete a scream
exports.deleteScream = (req, res) => {
    const document = db.doc(`/screams/${req.params.screamId}`);
    document.get()
    .then(doc => {
        if(!doc.exists){
            return res.status(404).json({error: 'Scream not found'})
        } 

        if (doc.data().userHandle !== req.user.handle) {
            return res.status(403).json({error: 'Unauthorized'})
        } else {
            return document.delete();
        }
        
    })
    .then(() => {
        res.json({message: 'Scream deleted successfully'})
    })
    .catch((err) => {
        return res.status(500).json({error: err.code})
    });
};