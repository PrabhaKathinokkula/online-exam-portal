const mongoose = require('mongoose');
const Badge = require('./models/Badge');

mongoose.connect('mongodb://127.0.0.1:27017/examDB')
.then(async () => {
    console.log("MongoDB Connected");

    await Badge.deleteMany(); 

    await Badge.insertMany([

    {
        subject: "DevOps",
        level: "levelA",
        name: "DevOps Beginner",
        image: "/images/badges/devops-A.png"
    },
    {
        subject: "DevOps",
        level: "levelB",
        name: "DevOps Intermediate",
        image: "/images/badges/devops-B.png"
    },
    {
        subject: "DevOps",
        level: "levelC",
        name: "DevOps Advanced",
        image: "/images/badges/devops-C.png"
    },

    {
        subject: "CloudComputing",
        level: "levelA",
        name: "Cloud Beginner",
        image: "/images/badges/cloud-A.png"
    },
    {
        subject: "CloudComputing",
        level: "levelB",
        name: "Cloud Intermediate",
        image: "/images/badges/cloud-B.png"
    },
    {
        subject: "CloudComputing",
        level: "levelC",
        name: "Cloud Advanced",
        image: "/images/badges/cloud-C.png"
    },

    {
        subject: "MongoDB",
        level: "levelA",
        name: "MongoDB Beginner",
        image: "/images/badges/mongo-A.png"
    },
    {
        subject: "MongoDB",
        level: "levelB",
        name: "MongoDB Intermediate",
        image: "/images/badges/mongo-B.png"
    },
    {
        subject: "MongoDB",
        level: "levelC",
        name: "MongoDB Advanced",
        image: "/images/badges/mongo-C.png"
    }

]);

    console.log("Badges inserted ");

    mongoose.connection.close();
})
.catch(err => console.log(err));