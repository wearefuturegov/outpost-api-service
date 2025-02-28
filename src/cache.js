const redis = require("redis")
const logger = require("../utils/logger")
const uri = process.env.REDIS_URL

let cache

module.exports = {
  connect: async cb => {
    if (!uri) {
      logger.error(`REDIS_URL not set`)
      return false
    }

    cache = redis.createClient({
      url: uri,
    })

    cache.on("error", err => {
      logger.error("Redis Client Error", err)
    })

    try {
      await cache.connect()
      logger.info(`Connected to Redis at ${uri}`)
      cb(cache)
    } catch (err) {
      logger.error("Unable to connect to Redis", err)
    }
  },
  cache: () => {
    if (!cache) {
      throw new Error(
        "cache() called without being connected to Redis. Please connect first, see application logs for more details."
      )
    }
    return cache
  },
}
