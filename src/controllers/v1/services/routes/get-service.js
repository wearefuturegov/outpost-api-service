const filters = require("../../../../lib/filters")
const { projection } = require("../../../../lib")
const { db } = require("../../../../db")
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

    let result = await db()
      .collection("indexed_services")
      .findOne(query, projection)

    return result
  },
}
