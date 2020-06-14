const { calculateDistance, geocode } = require("../lib")
const { db } = require("../db")

module.exports = {
    index: async (req, res, next) => {
        try{
            const Service = db().collection("indexed_services")
            const perPage = 20

            let query = {}

            if(req.query.keywords){
                if(req.query.location || req.query.lng || req.query.lat){
                    const docs = await Service
                        .find({ $text: { $search: req.query.keywords }})
                        .toArray()
                    query._id = { $in: docs.map(doc => doc._id) }
                } else {
                    query.$text = { $search: req.query.keywords }
                }
            }

            if(req.query.taxonomies) query["service.taxonomies.name"] = { 
                $in: [].concat(req.query.taxonomies)
            }

            let interpretated_location
            if(req.query.location && !(req.query.lat && req.query.lng)){
                let { results } = await geocode(req.query.location)
                if(results[0]){
                    interpretated_location = results[0].formatted_address
                    req.query.lng = results[0].geometry.location.lng, 
                    req.query.lat = results[0].geometry.location.lat
                }
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
                    page: parseInt(req.query.page) || 1,
                    totalPages: Math.round(count / perPage),                    
                    totalElements: count,
                    interpretated_location,
                    content: results.map(result => ({
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