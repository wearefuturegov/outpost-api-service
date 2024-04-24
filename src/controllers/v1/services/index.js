const logger = require("../../../../utils/logger")
const { getServices, getService } = require("./routes")

module.exports = {
  /**
   * Handles the api/v1/services route.
   * @async
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} req.query - Query parameters for the request.
   * @param {number} [req.query.per_page=50] - Number of items per page.
   * @param {number} [req.query.page=1] - Current page number.
   * @param {string} [req.query.keywords] - Keywords for full text search.
   * @param {string} [req.query.location] - Location for geospatial search.
   * @param {number} [req.query.lat] - Latitude for geospatial search.
   * @param {number} [req.query.lng] - Longitude for geospatial search.
   * @param {string|string[]} [req.query.targetDirectories] - Target directories to filter services.
   * @param {string|string[]} [req.query.taxonomies] - Taxonomies to filter services.
   * @param {string|string[]} [req.query.needs] - Needs to filter services.
   * @param {string|string[]} [req.query.suitabilities] - Suitabilities to filter services.
   * @param {string|string[]} [req.query.days] - Days to filter services.
   * @param {string|string[]} [req.query.accessibilities] - Accessibilities to filter services.
   * @param {string|string[]} [req.query.only] - Only free, open-weekends, open-after-six.
   * @param {number} [req.query.min_age] - Minimum age for age range filtering.
   * @param {number} [req.query.max_age] - Maximum age for age range filtering
   * @param {Object} res - Express response object.
   * @param {function} next - Express next middleware function.
   * @returns {Promise<void>} Promise representing the operation status.
   * @throws {Error} If an error occurs during execution.
   */
  index: async (req, res, next) => {
    try {
      const parameters = await getServices.parseRequestParameters(req.query)
      logger.http(parameters)

      const query = await getServices.buildQuery(parameters)

      const { results, count } = await getServices.executeQuery(
        query,
        parameters.perPage,
        parameters.page
      )
      const content = getServices.buildContent(
        results,
        parameters.lat,
        parameters.lng
      )
      const response = getServices.buildResponse(
        { results, count },
        parameters.perPage,
        parameters.page,
        content,
        parameters.interpreted_location
      )

      res.json(response)
    } catch (e) {
      next(e)
    }
  },

  /**
   * Handles the api/v1/services/:id route.
   * @async
   * @function
   * @param {Object} req - Express request object.
   * @param {Object} req.params - Route parameters for the request.
   * @param {number} req.params.id - ID of the service to retrieve.
   * @param {Object} res - Express response object.
   * @param {function} next - Express next middleware function.
   * @returns {Promise<void>} Promise representing the operation status.
   * @throws {Error} If an error occurs during execution or no matching document is found.
   */
  show: async (req, res, next) => {
    try {
      const query = getService.buildQuery(req.params)
      const result = await getService.executeQuery(query)
      // let result = await db()
      //   .collection("indexed_services")
      //   .findOne(query, projection)
      if (!result) throw new Error("No matching document")
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
}
