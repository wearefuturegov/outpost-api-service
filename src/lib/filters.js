const { db } = require("../db")
const logger = require("../../utils/logger")
const { RRule, RRuleSet, rrulestr } = require("rrule")

const filters = {
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
  // only=needs-referral
  // only=local-offer
  filterOnly: only => {
    let query = []
    if (only) {
      if (only.includes("free")) query.push({ free: true })
      if (only.includes("needs-referral")) query.push({ needs_referral: true })
      if (only.includes("local-offer"))
        query.push({ local_offer: { $exists: true, $ne: null } })
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
   * Returns the regular_schedules.weekday for the days
   * @TODO test http://localhost:3001/api/v1/services?days=Monday
   * @TODO test http://localhost:3001/api/v1/services?days=Monday&days=Tuesday
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

  /**
   * Filters by opens_at, closes_at and day
   * @TODO test http://localhost:3002/api/v1/services?start_time=22:00&end_time=22:30&day=MO
   * @TODO test http://localhost:3002/api/v1/services?start_time=22:00
   * @TODO test http://localhost:3002/api/v1/services?end_time=22:30
   * @TODO test http://localhost:3002/api/v1/services?day=MO
   * @TODO test http://localhost:3002/api/v1/services?start_time=22:00&end_time=22:30&day=MO&start_time=22:00&end_time=22:30&day=MO
   * @param {*} startTime
   * @param {*} endTime
   * @param {*} day
   * @returns
   */
  filterStartTimeEndTimeDay: (startTime, endTime, day) => {
    let orConditions = []
    const maxLength = Math.max(startTime.length, endTime.length, day.length)

    for (let i = 0; i < maxLength; i++) {
      let condition = {}
      if (startTime[i]) {
        condition["regular_schedules.opens_at"] = { $gte: startTime[i] }
      }
      if (endTime[i]) {
        condition["regular_schedules.closes_at"] = { $lte: endTime[i] }
      }
      if (day[i]) {
        condition["regular_schedules.weekday"] = day[i]
      }
      orConditions.push(condition)
    }

    let query = {}
    if (orConditions.length > 0) {
      query.$or = orConditions
    }

    return query
  },

  /**
   * Filter for services that have events that occur between two dates
   * @param {*} startDate
   * @param {*} endDate
   * @returns
   */
  filterStartDateEndDate: async (startDate, endDate) => {
    if (startDate && endDate) {
      logger.debug("filterStartDateEndDate")
      // find services with regularSchedules
      const visibleNow = filters.visibleNow()
      const rs_query = {
        regular_schedules: {
          $elemMatch: {
            dtstart: { $exists: true, $ne: null },
          },
        },
        $and: [...visibleNow],
      }

      logger.debug("\n\nℹ️ filterStartDateEndDate query")
      logger.debug(rs_query)
      logger.debug(JSON.stringify(rs_query))

      const Service = db().collection("indexed_services")
      const regularSchedules = await Service.find(rs_query).toArray()

      const singleEventRegularScheduleIds = []
      const recurringEventRegularScheduleIds = []
      regularSchedules.forEach(service => {
        service.regular_schedules.forEach(schedule => {
          // find single events that occur between the start and end date
          if (
            schedule.freq === null &&
            new Date(schedule.dtstart) >= new Date(startDate) &&
            new Date(schedule.dtstart) <= new Date(endDate)
          ) {
            singleEventRegularScheduleIds.push(schedule.id)
          }
          // find recurring events that occur between the start and end date

          const { freq, interval, byday, bymonthday, dtstart, until, count } =
            schedule

          if (freq !== null) {
            const freqMapping = {
              week: "WEEKLY",
              month: "MONTHLY",
            }

            let options = {
              dtstart: new Date(dtstart),
              freq: RRule[freqMapping[freq]],
              interval: interval,
              until: until ? new Date(until) : null,
              count: count,
            }

            // weekly repeating events can have MO or TU,WE
            if (freq === "week") {
              options = {
                byweekday: byday
                  ? byday.split(",").map(day => RRule[day])
                  : null,
                ...options,
              }
            }

            // monthly repeating can have bymonthday = 1[st day of the month]
            // or byweekday in format -1MO [Last Monday of the month], 2TU [Second Tuesday of the month] etc which uses bysetpos
            if (freq === "month") {
              if (bymonthday) {
                options = {
                  bymonthday: bymonthday ? bymonthday : null,
                  ...options,
                }
              } else if (byday) {
                const bysetpos = byday.split(",").map(day => {
                  const match = day.match(/(-?\d+)([A-Z]+)/)
                  return [match[1], match[2]]
                })
                options = {
                  bysetpos: bysetpos[0][0],
                  byweekday: RRule[bysetpos[0][1]],
                  ...options,
                }
              }
            }
            const rule = new RRule(options)
            const dates = rule.between(
              new Date(startDate),
              new Date(endDate),
              true
            )

            if (dates.length > 0) {
              recurringEventRegularScheduleIds.push(schedule.id)
            }
          }
        })
      })

      return {
        "regular_schedules.id": {
          $in: [
            ...singleEventRegularScheduleIds,
            ...recurringEventRegularScheduleIds,
          ],
        },
      }
    }
    return {}
  },
}

module.exports = filters
