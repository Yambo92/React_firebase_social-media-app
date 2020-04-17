let db = {
    users: [
        {
            userId: 'CWFpilAWm9VpGf9cJGmI4EdTe1K3',
            email: 'ceshi2@qq.com',
            handle: 'ceshi2',
            createdAt: '2020-04-16T06:12:37.874Z',
            imageUrl: 'https://firebasestorage.googleapis.com/v0/b/socialape-d6344.appspot.com/o/2629024851.jpg?alt=media',
            bio: 'Hello, my name is user, nice to meet u',
            website: 'https://user.com',
            location: 'Wuhan, China'
        }
    ],
    screams: [
        {
            userHandle: 'user',
            body: 'this is the scream body',
            createdAt: "2020-04-16T04:46:14.664Z",
            likeCount: 0,
            commentCount: 0
        }
    ],
    comments: [
        {
            userHandle: 'user',
            screamId: 'ffgdsjgjgifjas',
            body: 'nice one mate!',
            createdAt:  "2020-04-16T04:46:14.664Z",
        }
    ],
    notifications: [
        {
            recipient: 'user',
            sender: 'john',
            read: 'true | false',
            screamId: 'fsakfjsflsd',
            type: 'like | comment',
            createdAt: '2020-04-16T04:46:14.664Z'
        }
    ]
};

const userDetails = {
    //redux data
    credentials:  {
        userId: 'CWFpilAWm9VpGf9cJGmI4EdTe1K3',
        email: 'ceshi2@qq.com',
        handle: 'ceshi2',
        createdAt: '2020-04-16T06:12:37.874Z',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/socialape-d6344.appspot.com/o/2629024851.jpg?alt=media',
        bio: 'Hello, my name is user, nice to meet u',
        website: 'https://user.com',
        location: 'Wuhan, China'
    },
    likes:[
        {
            userHandle: 'user',
            screamId: 'sdsdsfdffffafsfasad'
        },
        {
            userHandle: 'user',
            screamId: 'ddsfdffffafsfasad'
        }
    ]
}