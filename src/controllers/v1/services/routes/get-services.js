const filters = require("../../../../lib/filters")
const { calculateDistance, geocode, projection } = require("../../../../lib")
const { db } = require("../../../../db")
const logger = require("../../../../../utils/logger")

module.exports = {
  /**
   *
   * @param {*} req
   * @returns
   */
  parseRequestParameters: async queryParams => {
    const perPage = parseInt(queryParams.per_page) || 50
    const page = parseInt(queryParams.page) || 1
    const keywords = queryParams.keywords
    const location = queryParams.location
    let lat = parseFloat(queryParams.lat) || undefined
    let lng = parseFloat(queryParams.lng) || undefined
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
    let days = queryParams?.days ? [].concat(queryParams.days) : []
    let only = queryParams?.only ? [].concat(queryParams.only) : []
    const minAge = parseInt(queryParams.min_age) || undefined
    const maxAge = parseInt(queryParams.max_age) || undefined

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
    days = [...new Set(days.flatMap(str => str.split(",")))]
    only = [...new Set(only.flatMap(str => str.split(",")))]

    // if we have a location then we can find lat lng
    if (location && !(lat && lng)) {
      try {
        const { results } = await geocode(queryParams.location)
        logger.debug(results)
        if (results[0]) {
          interpreted_location = results[0].formatted_address
          lng = parseInt(results[0].geometry.location.lng)
          lat = parseInt(results[0].geometry.location.lat)
        }
      } catch (error) {
        logger.warn(error)
      }
    }

    return {
      perPage,
      page,
      keywords,
      location,
      lat,
      lng,
      directories,
      taxonomies,
      needs,
      suitabilities,
      days,
      accessibilities,
      only,
      minAge,
      maxAge,
      interpreted_location,
    }
  },
  /**
   *
   * @param {*} parameters
   * @returns
   */
  buildQuery: async parameters => {
    let query = {}
    query.$and = []

    const locationInQuery =
      parameters.location !== undefined ||
      parameters.lat !== undefined ||
      parameters.lng !== undefined
    const filterKeywords = await filters.filterKeywords(
      parameters.keywords,
      locationInQuery
    )
    query = { ...filterKeywords, ...query }

    const locationGeometry = filters.locationGeometry(
      parameters.lat,
      parameters.lng
    )
    query = { ...locationGeometry, ...query }

    // add filtering for ages
    const ages = filters.filterAges(parameters.minAge, parameters.maxAge)
    query.$and.push(...ages)

    // apply only filters
    const only = filters.filterOnly(parameters.only)
    query.$and.push(...only)

    // apply visibility filtering
    const visibleNow = filters.visibleNow()
    query.$and.push(...visibleNow)

    // add filtering
    query.$and.push(
      filters.filterDirectories(parameters.directories),
      filters.filterTaxonomies(parameters.taxonomies),
      filters.filterNeeds(parameters.needs),
      filters.filterSuitabilities(parameters.suitabilities),
      filters.filterAccessibilities(parameters.accessibilities),
      filters.filterDays(parameters.days)
    )

    // clear empty values
    query.$and = query.$and.filter(obj => Object.keys(obj).length !== 0)

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
   * @TODO test this doesn't affect query object
   * http://localhost:3001/api/v1/services?lat=51.2107714&lng=0.31105&per_page=10&suitabilities=physical-disabilities
   * @param {*} query
   * @returns
   */
  createCountQuery: query => {
    // "budget deep clone" we spread $and so can modify it for countQuery only
    const countQuery = { ...query, $and: [...query.$and] }
    if ("locations.geometry" in countQuery) {
      delete countQuery["locations.geometry"]

      countQuery["$and"].push({
        "locations.geometry": {
          $exists: true,
          $ne: null,
        },
      })
    }
    return countQuery
  },

  /**
   *
   * @param {*} query
   * @param {*} perPage
   * @param {*} page
   * @returns
   */
  async executeQuery(query, perPage, page) {
    const Service = db().collection("indexed_services")
    const countQuery = this.createCountQuery(query)

    logger.debug("query")
    logger.debug(query)
    logger.debug(JSON.stringify(query))
    logger.debug("countQuery")
    logger.debug(countQuery)
    logger.debug(JSON.stringify(countQuery))

    const [results, count] = await Promise.all([
      Service.find(query)
        .project({
          ...projection,
        })
        .sort(query.$text ? { score: { $meta: "textScore" } } : {})
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
      interpreted_location,
      content: content,
    }
  },
}
