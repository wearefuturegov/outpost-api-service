const { cache } = require("../cache")
const logger = require("../../utils/logger")

module.exports = {
  enabled: process.env.REDIS_URL ? true : false,
  setCachedData: async (key, value, options = { EX: 3600 }) => {
    try {
      await cache().set(key, JSON.stringify(value), options)
      logger.debug(`REDIS: Setting cache for ${key}`)
    } catch (err) {
      logger.error("Error setting data to Redis", err)
    }
  },
  getCachedData: async key => {
    try {
      const data = await cache().get(key)
      logger.debug(`REDIS: Getting cache for ${key}`)
      return JSON.parse(data)
    } catch (err) {
      logger.error("Error getting data from Redis", err)
      return null
    }
  },
}
