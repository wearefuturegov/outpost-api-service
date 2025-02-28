const { db } = require("../db")
const { ObjectId } = require("mongodb")
const logger = require("../../utils/logger")
const filters = require("./filters")
const queries = require("./queries")
const caching = require("./caching")

module.exports = {
  /**
   * this is a filter for the location nearest to the lat and lng
   * NB this can't be used as part of an aggregate pipeline so countDocuments will not work
   * see executeQuery() in get-services.js
   * @param {*} lat
   * @param {*} lng
   * @returns
   */
  filterLocationNearest: (lat, lng, proximity) => {
    let query = {}
    if (lat !== undefined && lng !== undefined) {
      query["service_at_locations.location.geometry"] = {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: proximity, // meters
        },
      }
    }
    return query
  },

  /**
   * if there is a location or lat or lng value then we do a search first for keyword to refine the location search query
   * $text performs a text search on the content of the fields indexed with a text index.
   * In this case it will search the name_text_description_text index
   * @TODO test http://localhost:3001/api/v1/services
   * @TODO test http://localhost:3001/api/v1/services?location=London
   * @TODO test http://localhost:3001/api/v1/services?lat=51.2107714&lng=0.31105&per_page=10
   * @param {*} keywords
   * @param  {...any} args
   * @returns
   */
  filterLocationKeywords: async (keywords, parameters) => {
    let query = {}
    if (keywords) {
      let keyword_query = {}
      keyword_query.$and = []
      const Service = db().collection("indexed_services")
      const filterKeywords = await filters.filterKeywords(parameters.keywords)
      keyword_query = { ...filterKeywords, ...keyword_query }
      keyword_query = await queries.addFilters(keyword_query, parameters)
      // exclude services with no location
      keyword_query.$and.push({
        "service_at_locations.location.geometry": {
          $exists: true,
          $ne: null,
        },
      })

      logger.debug("\n\nℹ️ filterLocationKeywords query")
      logger.debug(keyword_query)
      logger.debug(JSON.stringify(keyword_query))

      const keyword_query_copy = JSON.parse(JSON.stringify(keyword_query))
      const cacheKey = `filterLocationKeywords_${JSON.stringify(
        filters.removeVisibleNow(keyword_query_copy)
      )}`
      if (caching.enabled) {
        const cachedData = await caching.getCachedData(cacheKey)
        if (cachedData) {
          query._id = {
            $in: cachedData.map(id => ObjectId.createFromHexString(id)),
          }
          logger.info(`Using cached results for filterLocationKeywords query`)
          return query
        }
      }

      const docs = await Service.find(keyword_query)
        .project({ _id: 1 })
        .limit(1000)
        .toArray()

      query._id = { $in: docs.map(doc => doc._id) }

      if (caching.enabled) {
        const ids = docs.map(doc => doc._id.toString())
        await caching.setCachedData(cacheKey, ids, {
          EX: 6 * 60 * 60, // Cache for 6 hours
        })
      }
    }
    return query
  },

  /**
   * @deprecated because we've gone back to nearSphere for now but leaving in as we will probably use it again
   * To use this simply add to query.$and array
   * query.$and.push(
   *   filters.filterLocation(
   *     parameters.lat,
   *     parameters.lng,
   *     query?.$text ?? false
   *   )
   * )
   * This can be used instead of the above with the following benefits:
   * - can be used as part of an aggregate pipeline
   * - faster
   * - no need for a separate countDocuments query
   * The only downside is that results are not ordered nearest to furthest
   * @param {*} lat
   * @param {*} lng
   * @param {*} keywordSearch
   * @returns
   */
  filterLocation: (lat, lng, keywordSearch) => {
    if (lat !== undefined && lng !== undefined) {
      logger.debug(
        `Looking for services near ${parseFloat(lat)}, ${parseFloat(lng)} `
      )
      // if the query has keyword search then we need to make sure that we return services with no location still too
      if (keywordSearch) {
        return {
          $or: [
            {
              "service_at_locations.location.geometry": {
                $geoWithin: {
                  $centerSphere: [
                    [parseFloat(lng), parseFloat(lat)],
                    20 / 3963.2, // miles x 1609.34 = Distance in meters
                  ],
                },
              },
            },
            { "service_at_locations.location.geometry": { $exists: false } },
          ],
        }
      } else {
        return {
          "service_at_locations.location.geometry": {
            $geoWithin: {
              $centerSphere: [[parseFloat(lng), parseFloat(lat)], 20 / 3963.2], // miles x 1609.34 = Distance in meters
            },
          },
        }
      }
    }
    return {}
  },
}
