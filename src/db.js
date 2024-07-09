const { MongoClient } = require("mongodb")
const logger = require("../utils/logger")
const uri = process.env.DB_URI

// @TODO test mongodb://outpost:password@mongo/outpost_api_development?retryWrites=true&w=majority
// @TODO test mongodb://outpost:password@mongo/?retryWrites=true&w=majority
// @TODO test mongodb://outpost:password@mongo

let db

module.exports = {
  connect: async cb => {
    if (!uri) {
      logger.error(`DB_URI not set`)
      return false
    }

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

        // ensure that the location index exists
        const indexName = "service_at_locations.location.geometry_2dsphere"
        try {
          const indexExists = await db
            .collection("indexed_services")
            .indexExists(indexName)

          if (!indexExists) {
            logger.warn(
              `The index ${indexName} does not exist on your collection, please run prepare-indices script to create it or you will not return correct results.`
            )
          }
        } catch (err) {
          logger.error(`Unable to check for location index ${err}`)
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
