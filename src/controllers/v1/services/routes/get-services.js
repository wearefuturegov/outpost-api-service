const filters = require("../../../../lib/filters")
const queries = require("../../../../lib/queries")
const {
  calculateDistance,
  geocode,
  projection,
  dayMapping,
} = require("../../../../lib")
const { db } = require("../../../../db")
const logger = require("../../../../../utils/logger")
const locations = require("../../../../lib/locations")

module.exports = {
  /**
   *
   * @param {*} req
   * @returns
   */
  parseRequestParameters: async queryParams => {
    const perPage = parseInt(queryParams.per_page) || 50
    if (perPage > 200) {
      throw new Error("Per page limit is 200")
    }

    const page = parseInt(queryParams.page) || 1
    const proximity = parseInt(queryParams.proximity) || 5 * 1609.34 // miles x 1609.34 = Distance in meters
    const keywords = queryParams.keywords
    const location = queryParams.location
    let lat = queryParams?.lat ? parseFloat(queryParams.lat) : undefined
    let lng = queryParams?.lng ? parseFloat(queryParams.lng) : undefined
    let directories = queryParams?.directories
      ? [].concat(queryParams.directories)
      : []
    let taxonomies = queryParams?.taxonomies
      ? [].concat(queryParams.taxonomies)
      : []
    let needs = queryParams?.needs ? [].concat(queryParams.needs) : []
    let suitabilities = queryParams?.suitabilities
      ? [].concat(queryParams.suitabilities)
      : []
    let accessibilities = queryParams?.accessibilities
      ? [].concat(queryParams.accessibilities)
      : []
    // days = days=Monday&days=Tuesday -  deprecated
    let daysDeprecated = queryParams?.days ? [].concat(queryParams.days) : []
    let only = queryParams?.only ? [].concat(queryParams.only) : []
    let meta = queryParams?.meta ? [].concat(queryParams.meta) : []

    const minAge = parseInt(queryParams.min_age) || undefined
    const maxAge = parseInt(queryParams.max_age) || undefined

    let startTime = queryParams?.start_time
      ? [].concat(queryParams.start_time)
      : []
    let endTime = queryParams?.end_time ? [].concat(queryParams.end_time) : []
    let day = queryParams?.day ? [].concat(queryParams.day) : []

    const startDate = queryParams.start_date || undefined
    const endDate = queryParams.end_date || undefined

    // not a param but we want to save on requests
    let interpreted_location

    // Validate parameters here...
    // if the query param is used more than once for these fields
    // combine them and make sure they are unique
    // so ?suitabilities=a&suitabilities=b,a becomes suitabilities=[a,b]
    directories = [...new Set(directories.flatMap(str => str.split(",")))]
    taxonomies = [...new Set(taxonomies.flatMap(str => str.split(",")))]
    needs = [...new Set(needs.flatMap(str => str.split(",")))]
    suitabilities = [...new Set(suitabilities.flatMap(str => str.split(",")))]
    accessibilities = [
      ...new Set(accessibilities.flatMap(str => str.split(","))),
    ]
    daysDeprecated = [...new Set(daysDeprecated.flatMap(str => str.split(",")))]
    only = [...new Set(only.flatMap(str => str.split(",")))]
    meta = [...new Set(meta.flatMap(str => str.split(",")))]

    // split meta into key values
    meta = meta.map(str => {
      const [key, ...valueParts] = str.split(":")
      const value = valueParts.join(":") // Join the rest of the parts to handle cases where the value contains colons
      return { key, value }
    })

    // we dont de-dupe these as they are used in pairs
    startTime = [...startTime.flatMap(str => str.split(","))]
    endTime = [...endTime.flatMap(str => str.split(","))]
    day = [...day.flatMap(str => str.split(","))]
    // Convert day abbreviations to full names
    day = day.map(d => dayMapping[d] || d)

    const lengths = [startTime.length, endTime.length, day.length].filter(
      len => len > 0
    )
    if (lengths.length > 1 && !lengths.every(len => len === lengths[0])) {
      throw new Error(
        "The number of start_time, end_time, and day parameters must be equal if more than one is provided"
      )
    }

    // if we have a location then we can find lat lng
    if (location && !(lat && lng)) {
      try {
        const { results } = await geocode(queryParams.location)
        if (results[0]) {
          interpreted_location = results[0].formatted_address
          lng = parseFloat(results[0].geometry.location.lng)
          lat = parseFloat(results[0].geometry.location.lat)
        }
      } catch (error) {
        logger.warn(error)
      }
    }

    return {
      perPage,
      page,
      proximity,
      keywords,
      location,
      lat,
      lng,
      directories,
      taxonomies,
      needs,
      suitabilities,
      daysDeprecated,
      startTime,
      endTime,
      day,
      startDate,
      endDate,
      accessibilities,
      only,
      meta,
      minAge,
      maxAge,
      interpreted_location,
    }
  },

  /**
   * This builds the query based on the queryType
   * There are currently 4 query types, keyword, location, keyword_location, default
   * The main difference is the location queries which require a different structure
   * @param {*} parameters
   * @returns
   */
  buildQuery: async (parameters, queryType) => {
    let query = {}
    query.$and = []

    switch (queryType) {
      case "location":
        // if location but no keyword is requested
        // we want to filter by location
        // and we add the other standard filters as well
        // http://localhost:3002/api/v1/services?location=Buckingham%2C%20MK18%2C%20UK
        // {
        //   "service_at_locations.location.geometry": {
        //     "$nearSphere": {
        //       "$geometry": { "type": "Point", "coordinates": [-0.987645, 51.999326] },
        //       "$maxDistance": 32186.8
        //     }
        //   },
        //   "$and": [
        //     {
        //       "$or": [
        //         { "visible_from": null },
        //         { "visible_from": { "$lte": "2024-07-27T10:30:24.535Z" } }
        //       ]
        //     },
        //     {
        //       "$or": [
        //         { "visible_to": null },
        //         { "visible_to": { "$gte": "2024-07-27T10:30:24.535Z" } }
        //       ]
        //     }
        //   ]
        // }

        const filterLocationNearest = locations.filterLocationNearest(
          parameters.lat,
          parameters.lng,
          parameters.proximity
        )
        query = { ...filterLocationNearest, ...query }

        query = await queries.addFilters(query, parameters)

        break
      case "keyword_location":
        // if theres a keyword and a location then we do a search first
        // for keyword to refine the location search query we also include the other
        // filters and exclude those with no location set
        // and we add the other standard filters as well
        // {
        //   "service_at_locations.location.geometry": {
        //     "$nearSphere": {
        //       "$geometry": { "type": "Point", "coordinates": [-0.987645, 51.999326] },
        //       "$maxDistance": 32186.8
        //     }
        //   },
        //   "_id": {
        //     "$in": [
        //       new ObjectId('66903557ea279c1d167cdf41')
        //     ]
        //   },
        //   "$and": [
        //     {
        //       "$or": [
        //         { "visible_from": null },
        //         { "visible_from": { "$lte": "2024-07-27T11:08:21.487Z" } }
        //       ]
        //     },
        //     {
        //       "$or": [
        //         { "visible_to": null },
        //         { "visible_to": { "$gte": "2024-07-27T11:08:21.487Z" } }
        //       ]
        //     }
        //   ]
        // }

        const filterLocationKeywords = await locations.filterLocationKeywords(
          parameters.keywords,
          parameters
        )
        query = { ...filterLocationKeywords, ...query }

        const filterLocationKeywordsNearest = locations.filterLocationNearest(
          parameters.lat,
          parameters.lng,
          parameters.proximity
        )
        query = { ...filterLocationKeywordsNearest, ...query }

        query = await queries.addFilters(query, parameters)

        break
      default:
        // if theres a keyword then its added to the query
        // and we add the other standard filters as well
        // This is what http://localhost:3002/api/v1/services?days=monday&keywords=send%20peer%20support looks like
        // {
        //   "$text": { "$search": "send peer support" },
        //   "$and": [
        //     {
        //       "$or": [
        //         { "visible_from": null },
        //         { "visible_from": { "$lte": "2024-07-27T10:01:37.059Z" } }
        //       ]
        //     },
        //     {
        //       "$or": [
        //         { "visible_to": null },
        //         { "visible_to": { "$gte": "2024-07-27T10:01:37.059Z" } }
        //       ]
        //     },
        //     { "regular_schedules.weekday": { "$in": ["monday"] } }
        //   ]
        // }
        const filterKeywords = await filters.filterKeywords(parameters.keywords)
        query = { ...filterKeywords, ...query }
        query = await queries.addFilters(query, parameters)
        break
    }

    return query
  },

  /**
   * this is done because of the $nearSphere method in locationGeometry.
   * This is because The $nearSphere operator cannot be used with the
   * countDocuments() method in MongoDB because countDocuments()
   * uses an aggregation pipeline under the hood, and $nearSphere is not
   * allowed in an aggregation pipeline.
   * so as a workaround if we're using nearsphere we update the count
   * query to prevent errors
   * the result of nearsphere will include all services with a location
   * so this query is a good substitute to get the totalElements value
   * http://localhost:3001/api/v1/services?lat=51.2107714&lng=0.31105&per_page=10&suitabilities=physical-disabilities
   * @param {*} query
   * @returns
   */
  createCountQuery: query => {
    // "budget deep clone" we spread $and so can modify it for countQuery only
    const countQuery = { ...query, $and: [...query.$and] }
    if ("service_at_locations.location.geometry" in countQuery) {
      delete countQuery["service_at_locations.location.geometry"]

      countQuery["$and"].push({
        "service_at_locations.location.geometry": {
          $exists: true,
          $ne: null,
        },
      })
    }
    logger.debug("\n\nℹ️ countQuery - added due to queryType")
    logger.debug(countQuery)
    logger.debug(JSON.stringify(countQuery))
    return countQuery
  },

  /**
   * Executes the query
   * @param {*} query
   * @param {*} perPage
   * @param {*} page
   * @returns
   */
  async executeQuery(query, perPage, page, queryType) {
    const Service = db().collection("indexed_services")

    let queryProjection
    let sort
    let countQuery

    switch (queryType) {
      case "location":
        queryProjection = { ...projection }
        sort = {}
        countQuery = this.createCountQuery(query)
        break
      case "keyword_location":
        queryProjection = { ...projection }
        sort = {}
        countQuery = this.createCountQuery(query)
        break
      case "keyword":
        queryProjection = {
          ...projection,
          score: { $meta: "textScore" },
        }
        sort = {
          score: { $meta: "textScore" },
          updated_at: -1,
        }
        countQuery = query
        break
      default:
        queryProjection = { ...projection }
        sort = { updated_at: -1 }
        countQuery = query
        break
    }

    logger.debug("\n\nℹ️ query")
    logger.debug(query)
    logger.debug(JSON.stringify(query))

    logger.debug("\n\nℹ️ projection")
    logger.debug(projection)
    logger.debug(JSON.stringify(projection))

    logger.debug("\n\nℹ️ sort")
    logger.debug(sort)
    logger.debug(JSON.stringify(sort))

    const [results, count] = await Promise.all([
      Service.find(query)
        .project(queryProjection)
        .sort(sort)
        .limit(perPage)
        .skip((page - 1) * perPage)
        .toArray(),
      Service.countDocuments(countQuery),
    ])

    return { results, count }
  },

  /**
   *
   * @param {*} results
   * @param {*} lat
   * @param {*} lng
   * @returns
   */
  buildContent(results, lat, lng) {
    return results.map(result => ({
      ...result,
      distance_away: calculateDistance(lat, lng, result.locations),
    }))
  },

  /**
   *
   * @param {*} param0
   * @param {*} perPage
   * @param {*} page
   * @param {*} content
   * @param {*} interpreted_location
   * @returns
   */
  buildResponse(
    { results, count },
    perPage,
    page,
    content,
    interpreted_location
  ) {
    const currentPage = parseInt(page) || 1
    const totalPages = Math.ceil(count / perPage)

    return {
      number: currentPage,
      size: results.length,
      totalPages: totalPages,
      totalElements: count,
      first: currentPage === 1,
      last: currentPage === totalPages,
      perPage: perPage,
      interpreted_location,
      content: content,
    }
  },
}
