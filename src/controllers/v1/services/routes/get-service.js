const filters = require("../../../../lib/filters")
const { projection } = require("../../../../lib")
const { db } = require("../../../../db")

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
    let result = await db()
      .collection("indexed_services")
      .findOne(query, projection)

    return result
  },
}
