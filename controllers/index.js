const { calculateDistance } = require("../lib")
const { db } = require("../db")

module.exports = {
    index: async (req, res, next) => {
        try{
            const Service = db().collection("indexed_services")
            const perPage = 20

            let ids
            if(req.query.keywords){
                const docs = await Service
                    .find({ $text: { $search: req.query.keywords }})
                    .toArray()
                ids = docs.map(doc => doc._id)
            }

            let query = {}

            if(ids) query._id = { $in: ids }

            if(req.query.taxonomies) query["service.taxonomies.name"] = { 
                $in: [].concat(req.query.taxonomies)
            }

            if(req.query.lat && req.query.lng){
                query["location.geometry"] = {
                    $nearSphere: {
                        $geometry: {
                            type: "Point",
                            coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)]
                        }
                    }
                }
            }

            Promise.all([
                Service
                    .find(query)
                    .limit(perPage)
                    .skip((parseInt(req.query.page) - 1) * perPage)
                    .toArray(),
                Service
                    .find(query)
                    .count()
            ])
                .then(([
                    results,
                    count
                ]) => res.json({
                    total: count,
                    page: parseInt(req.query.page) || 1,
                    totalPages: Math.round(count / perPage),
                    services: results.map(result => ({
                        ...result.service,
                        location: result.location,
                        distance: calculateDistance(req.query, result.location)
                    }))
                }))
                .catch(e => next(e))

        } catch(e){
            next(e)
        }
    },

    show: async (req, res, next) => {
        try{
            let result = await db().collection("indexed_services").findOne({id: parseInt(req.params.id)})
            if(!result) throw new Error("No matching service")
            res.json({
                ...result.service,
                location: result.location
            })
        } catch(err) {
            next(err)
        }
    }
}