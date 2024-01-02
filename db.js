const { MongoClient } = require("mongodb")
const uri = process.env.DB_URI

let db

module.exports = {
  connect: cb => {
    MongoClient.connect(uri, { useUnifiedTopology: true })
      .then(client => {
        db = client.db()
        cb(db)
      })
      .catch(err => console.error(err))
  },
  db: () => db,
}
