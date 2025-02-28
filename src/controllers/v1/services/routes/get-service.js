const filters = require("../../../../lib/filters")
const { projection } = require("../../../../lib")
const { db } = require("../../../../db")
const caching = require("../../../../lib/caching")
const logger = require("../../../../../utils/logger")

module.exports = {
  /**
   *
   * @param {*} parameters
   * @returns
   */
  buildQuery: async parameters => {
    let query = { id: parseInt(parameters.id) }
    query.$and = []

    const visibleNow = filters.visibleNow()
    query.$and.push(...visibleNow)

    return query
  },

  /**
   *
   * @param {*} query
   * @returns
   */
  async executeQuery(query) {
    logger.debug("query")
    logger.debug(query)
    logger.debug(JSON.stringify(query))

    const { id } = query
    const cacheKey = `getService_${id}`

    if (caching.enabled) {
      const cachedData = await caching.getCachedData(cacheKey)
      if (cachedData) {
        logger.info(`Using cached results for ${cacheKey} query`)
        return cachedData
      }
    }

    let result = await db()
      .collection("indexed_services")
      .findOne(query, { projection })

    await caching.setCachedData(cacheKey, result, {
      EX: 3600, // Cache for 1 hour
    })

    return result
  },
}
