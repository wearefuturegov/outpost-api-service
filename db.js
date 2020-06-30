const { MongoClient } = require("mongodb")
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/outpost_development"

let db

module.exports = {
    connect: (cb) => {
        MongoClient.connect(uri, { useUnifiedTopology: true })
            .then(client => {
                db = client.db()
                cb(db)
            })
            .catch(err => console.error(err))
    },
    db: () => db
}