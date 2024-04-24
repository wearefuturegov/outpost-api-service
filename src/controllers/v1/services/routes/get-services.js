const filters = require("../../../../lib/filters")
const { calculateDistance, geocode, projection } = require("../../../../lib")
const { db } = require("../../../../db")
const logger = require("../../../../utils/logger")

module.exports = {
  /**
   *
   * @param {*} req
   * @returns
   */
  parseRequestParameters: async req => {
    const perPage = parseInt(req.query.per_page) || 50
    const page = parseInt(req.query.page) || 1
    const keywords = req.query.keywords
    const location = req.query.location
    let lat = req.query.lat
    let lng = req.query.lng
    let targetDirectories = req.query?.targetDirectories
      ? [].concat(req.query.targetDirectories)
      : []
    let taxonomies = req.query?.taxonomies
      ? [].concat(req.query.taxonomies)
      : []
    let needs = req.query?.needs ? [].concat(req.query.needs) : []
    let suitabilities = req.query?.suitabilities
      ? [].concat(req.query.suitabilities)
      : []
    let accessibilities = req.query?.accessibilities
      ? [].concat(req.query.accessibilities)
      : []
    let days = req.query?.days ? [].concat(req.query.days) : []
    const only = req.query.only
    const minAge = req.query.min_age
    const maxAge = req.query.max_age

    // not a param but we want to save on requests
    let interpreted_location

    // Validate parameters here...
    // if the query param is used more than once for these fields
    // combine them and make sure they are unique
    // so ?suitabilities=a&suitabilities=b,a becomes suitabilities=[a,b]
    targetDirectories = [
      ...new Set(targetDirectories.flatMap(str => str.split(","))),
    ]
    needs = [...new Set(needs.flatMap(str => str.split(",")))]
    suitabilities = [...new Set(suitabilities.flatMap(str => str.split(",")))]
    accessibilities = [
      ...new Set(accessibilities.flatMap(str => str.split(","))),
    ]
    days = [...new Set(days.flatMap(str => str.split(",")))]

    // if we have a location then we can find lat lng
    if (location && !(lat && lng)) {
      let { results } = await geocode(req.query.location)
      if (results[0]) {
        interpreted_location = results[0].formatted_address
        lng = results[0].geometry.location.lng
        lat = results[0].geometry.location.lat
      }
    }

    return {
      perPage,
      page,
      keywords,
      location,
      lat,
      lng,
      targetDirectories,
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

    const filterKeywords = await filters.filterKeywords(
      parameters.keywords,
      parameters.location,
      parameters.lat,
      parameters.lng
    )
    query = { ...filterKeywords, ...query }

    const locationGeometry = filters.locationGeometry(
      parameters.lat,
      parameters.lng
    )
    query = { ...locationGeometry, ...query }

    // add filtering for taxonomies
    const taxonomies = filters.filterTaxonomies(parameters.taxonomies)
    query.$and.push(...taxonomies)

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
      filters.filterTargetDirectories(parameters.targetDirectories),
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

    logger.debug(query)
    logger.debug(countQuery)

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
