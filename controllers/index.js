const { calculateDistance, geocode, projection } = require("../lib")
const { db } = require("../db")
const Queries = require("../lib/queries")

module.exports = {
  index: async (req, res, next) => {
    try {
      const Service = db().collection("indexed_services")
      const perPage = parseInt(req.query.per_page) || 20

      let query = {}

      // full text search
      if (req.query.keywords) {
        if (req.query.location || req.query.lng || req.query.lat) {
          const docs = await Service.find({
            $text: { $search: req.query.keywords },
          }).toArray()
          query._id = { $in: docs.map(doc => doc._id) }
        } else {
          query.$text = { $search: req.query.keywords }
        }
      }

      query.$and = []

      // taxonomies
      if (req.query.taxonomies) {
        let taxonomiesArray = [].concat(req.query.taxonomies)
        taxonomiesArray.forEach(cluster =>
          query.$and.push({
            "taxonomies.slug": { $in: [].concat(cluster.split(",")) },
          })
        )
      }

      // send needs
      if (req.query.needs) {
        let needsArray = [].concat(req.query.needs)
        needsArray.forEach(cluster =>
          query.$and.push({
            "send_needs.slug": { $in: [].concat(cluster.split(",")) },
          })
        )
      }


      // accessibility
      if (req.query.accessibilities) {
        let accessibilitiesArray = [].concat(req.query.accessibilities)
        accessibilitiesArray.forEach(cluster =>
          query.$and.push({
            "locations.accessibilities.slug": { $in: [].concat(cluster.split(",")) },
          })
        )
      }


      // days
      if (req.query.days) {
        let daysArray = [].concat(req.query.days)
        daysArray.forEach(cluster =>
          query.$and.push({
            "regular_schedules.weekday": { $in: [].concat(cluster.split(",")) },
          })
        )
      }


      // geocoding
      let interpreted_location
      if (req.query.location && !(req.query.lat && req.query.lng)) {
        let { results } = await geocode(req.query.location)
        if (results[0]) {
          interpreted_location = results[0].formatted_address
          req.query.lng = results[0].geometry.location.lng
          req.query.lat = results[0].geometry.location.lat
        }
      }

      // apply visibility filtering
      query = Queries.visibleNow(query)

      // apply age filtering
      query = Queries.filterAges(query, req)

      // apply only filters
      query = Queries.filterOnly(query, req)

      // geo sort
      if (req.query.lat && req.query.lng) {
        query["locations.geometry"] = {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [
                parseFloat(req.query.lng),
                parseFloat(req.query.lat),
              ],
            },
          },
        }
      }

      Promise.all([
        Service.find(query)
          .project({
            ...projection,
          })
          .sort(query.$text ? { score: { $meta: "textScore" } } : false)
          .limit(perPage)
          .skip((parseInt(req.query.page) - 1) * perPage)
          .toArray(),
        Service.find(query).count(),
      ])
        .then(([results, count]) =>
          res.json({
            page: parseInt(req.query.page) || 1,
            size: results.length,
            totalPages: Math.ceil(count / perPage),
            totalElements: count,
            interpreted_location,
            content: results.map(result => ({
              ...result,
              distance_away: calculateDistance(req.query, result.locations),
            })),
          })
        )
        .catch(e => next(e))
    } catch (e) {
      next(e)
    }
  },

  show: async (req, res, next) => {
    try {
      let query = { id: parseInt(req.params.id) }
      query = Queries.visibleNow(query)
      let result = await db()
        .collection("indexed_services")
        .findOne(query, projection)
      if (!result) throw new Error("No matching document")
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
}
