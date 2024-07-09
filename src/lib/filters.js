const { db } = require("../db")
const logger = require("../../utils/logger")

module.exports = {
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

  visibleNow: () => {
    let query = []
    query.push({
      $or: [{ visible_from: null }, { visible_from: { $lte: new Date() } }],
    })
    query.push({
      $or: [{ visible_to: null }, { visible_to: { $gte: new Date() } }],
    })
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
  filterKeywords: async keywords => {
    let query = {}
    if (keywords) {
      query.$text = { $search: keywords }
    }
    return query
  },

  // This filter returns all services with an age range overlapping with the
  // range supplied by the user.
  // min_age=0&max_age=18
  filterAges: (min_age, max_age) => {
    let query = []

    if (min_age) {
      query.push({
        $or: [{ max_age: null }, { max_age: { $gte: parseInt(min_age) } }],
      })
    }

    if (max_age) {
      query.push({
        $or: [{ min_age: null }, { min_age: { $lte: parseInt(max_age) } }],
      })
    }

    return query
  },

  // filters by only
  // only=free
  filterOnly: only => {
    let query = []
    if (only) {
      if (only.includes("free")) query.push({ free: true })
      // if(only.includes("open-weekends")) query["regular_schedules.weekday"] = { $in: [ "Saturday", "Sunday"] }
      // if(only.includes("open-after-six")) query["regular_schedules.closes_at"] = { $gte: "18:00"}
    }
    return query
  },

  /**
   * Specify the taxonomies to search for services
   * We are using $in to match any of the taxonomies
   * Since we are using tags/hierarchies we need to make sure that we are including the bottom level of a tree in each level after it appears
   *  {
   *  "$and": [
   *		{
   *      "taxonomies.slug": {
   *        "$in": ["things-to-do"]
   *      }
   *    },
   *    {
   *      "taxonomies.slug": {
   *        "$in": ["clubs-and-groups","holiday-activities", "dance-drama-and-music"]
   *      }
   *    },
   *    {
   *      "taxonomies.slug": {
   *        "$in": ["youth-clubs", "gaming", "sports-courses-and-camps", "dance-drama-and-music"]
   *      }
   *    },
   *  ]
   *}
   * taxonomies=taxonomies=advice-and-support&taxonomies=health-and-wellbeing
   * directories=bod
   * { "target_directories.label": { "$in": ["bfis", "bod"] } }
   *  [ 'fis', 'bod' ]
   * @TODO test http://localhost:3001/api/v1/services?taxonomies=things-to-do
   * @TODO test http://localhost:3001/api/v1/services?taxonomies=things-to-dotaxonomies=parks-and-outdoor-spaces
   * @TODO test http://localhost:3001/api/v1/services?taxonomies=things-to-do&taxonomies=things-to-do&taxonomies=parks-and-outdoor-spaces
   * NB previously this was a $in query
   * {$and: [{'taxonomies.slug': {$in: ['tax1', 'tax2']}}]}
   * which would return services with tax1 or tax2 but ORUK states that all queries are AND queries
   * @param {*} directories
   */
  filterTaxonomies: taxonomies => {
    if (taxonomies?.length > 0) {
      return {
        "taxonomies.slug": { $all: taxonomies },
      }
    }
    return {}
  },

  /**
   * Specify the directory to search for services
   * directories=bod,bfis
   * directories=bod
   * { "target_directories.label": { "$in": ["bfis", "bod"] } }
   *  [ 'fis', 'bod' ]
   * @TODO test http://localhost:3001/api/v1/services?directories=bfis,bod&directories=bfis,bod
   * @TODO test http://localhost:3001/api/v1/services?directories=bfis,bod
   * @TODO test http://localhost:3001/api/v1/services?directories=bfis
   * @param {*} directories
   */
  filterDirectories: directories => {
    if (directories?.length > 0) {
      return {
        "directories.label": { $in: directories },
      }
    }
    return {}
  },

  /**
   * Send needs
   * @TODO test http://localhost:3001/api/v1/services?needs=visual
   * @TODO test http://localhost:3001/api/v1/services?needs=visual&needs=autism
   * @param {*} needs
   * @returns
   */
  filterNeeds: needs => {
    if (needs?.length > 0) {
      return {
        "send_needs.slug": { $in: needs },
      }
    }
    return {}
  },

  /**
   * Suitabilitieies
   * @TODO test http://localhost:3001/api/v1/services?suitabilities=physical-disabilities
   * @TODO test http://localhost:3001/api/v1/services?suitabilities=physical-disabilities&suitabilities=mental-health-acquired-brain-injury
   * @param {*} needs
   * @returns
   */
  filterSuitabilities: suitabilities => {
    if (suitabilities?.length > 0) {
      return {
        "suitabilities.slug": { $in: suitabilities },
      }
    }
    return {}
  },

  /**
   * Accessibilities
   * @TODO test http://localhost:3001/api/v1/services?accessibilities=accessible-toilet-facilities
   * @TODO test http://localhost:3001/api/v1/services?accessibilities=accessible-toilet-facilities&accessibilities=wheelchair-accessible-entrance
   * @param {*} needs
   * @returns
   */
  filterAccessibilities: accessibilities => {
    if (accessibilities?.length > 0) {
      return {
        "service_at_locations.location.accessibilities.slug": {
          $in: accessibilities,
        },
      }
    }
    return {}
  },

  /**
   * Days
   * this has changed from previous iterations since the results returned wouldn't be accurate
   * @TODO test http://localhost:3001/api/v1/services?accessibilities=accessible-toilet-facilities
   * @TODO test http://localhost:3001/api/v1/services?accessibilities=accessible-toilet-facilities&accessibilities=wheelchair-accessible-entrance
   * @param {*} needs
   * @returns
   */
  filterDays: days => {
    if (days?.length > 0) {
      return {
        "regular_schedules.weekday": { $in: days },
      }
    }
    return {}
  },
}
