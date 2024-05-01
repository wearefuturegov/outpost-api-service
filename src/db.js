const { MongoClient } = require("mongodb")
const logger = require("../utils/logger")
const uri = process.env.DB_URI

// @TODO test mongodb://outpost:password@mongo/outpost_api_development?retryWrites=true&w=majority
// @TODO test mongodb://outpost:password@mongo/?retryWrites=true&w=majority
// @TODO test mongodb://outpost:password@mongo

let db

module.exports = {
  connect: async cb => {
    MongoClient.connect(uri)
      .then(async client => {
        // const ping = await client.db().command({ ping: 1 })
        db = client.db()
        const dbName = db.databaseName
        if (dbName === "test" || !dbName) {
          logger.warn(
            'You are connected to the default "test" database, you might not get any results'
          )
        } else {
          logger.info(`Connected to the "${dbName}" database`)
        }
        cb(db)
      })
      .catch(err => {
        logger.error(err)
        // throw new Error(err)
      })
  },
  db: () => {
    if (!db) {
      throw new Error(
        `db() called without being connected to the database. Please connect first, see application logs for more details.`
      )
    }
    return db
  },
}
