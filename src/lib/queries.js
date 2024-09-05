const filters = require("./filters")

module.exports = {
  /**
   * Determine the query type based on the parameters
   * @param {*} parameters
   * @returns {string} query type keyword, location, keyword_location or undefined
   */
  queryType: parameters => {
    if (parameters.keywords && !parameters.lat && !parameters.lng) {
      return "keyword"
    } else if (
      parameters.keywords === undefined &&
      parameters.lat &&
      parameters.lng
    ) {
      return "location"
    } else if (parameters.keywords && parameters.lat && parameters.lng) {
      return "keyword_location"
    } else {
      return undefined
    }
  },
  /**
   * Adds the global filters to the query.$and array
   * http://localhost:3002/api/v1/services?min_age=10&max_age=20&only=free&directories=bfis&taxonomies=subcat3&needs=autism&suitabilities=chair&accessibilities=hearingloop&days=monday
   * {
   *   "$and": [
   *     { "$or": [{ "max_age": null }, { "max_age": { "$gte": 10 } }] },
   *     { "$or": [{ "min_age": null }, { "min_age": { "$lte": 20 } }] },
   *     { "free": true },
   *     {
   *       "$or": [
   *         { "visible_from": null },
   *         { "visible_from": { "$lte": "2024-07-26T18:29:23.825Z" } }
   *       ]
   *     },
   *     {
   *       "$or": [
   *         { "visible_to": null },
   *         { "visible_to": { "$gte": "2024-07-26T18:29:23.825Z" } }
   *       ]
   *     },
   *     { "directories.label": { "$in": ["bfis"] } },
   *     { "taxonomies.slug": { "$all": ["subcat3"] } },
   *     { "send_needs.slug": { "$in": ["autism"] } },
   *     { "suitabilities.slug": { "$in": ["chair"] } },
   *     {
   *       "service_at_locations.location.accessibilities.slug": {
   *         "$in": ["hearingloop"]
   *       }
   *     },
   *     { "regular_schedules.weekday": { "$in": ["monday"] } }
   *   ]
   * }
   * @param {*} query
   * @param {*} parameters
   * @returns
   */
  addFilters: async (query, parameters) => {
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
      // locations.filterLocation(
      //   parameters.lat,
      //   parameters.lng,
      //   query?.$text ?? false
      // ),
      filters.filterDirectories(parameters.directories),
      filters.filterTaxonomies(parameters.taxonomies),
      filters.filterNeeds(parameters.needs),
      filters.filterSuitabilities(parameters.suitabilities),
      filters.filterAccessibilities(parameters.accessibilities),
      filters.filterDays(parameters.daysDeprecated),
      filters.filterStartTimeEndTimeDay(
        parameters.startTime,
        parameters.endTime,
        parameters.day
      )
    )

    // clear empty values
    query.$and = query.$and.filter(obj => Object.keys(obj).length !== 0)

    return query
  },
}
