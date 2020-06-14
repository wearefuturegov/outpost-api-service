const { calculateDistance, geocode } = require("../lib")
const { db } = require("../db")

module.exports = {
    index: async (req, res, next) => {
        try{
            const Service = db().collection("indexed_services")
            const perPage = 20

            let pipeline = []
            let matchStage = {}

            // FULL TEXT SEARCH
            if(req.query.keywords){
                if(req.query.location || req.query.lng || req.query.lat){
                    const docs = await Service
                        .find({ $text: { $search: req.query.keywords }})
                        .toArray()
                        pipeline.push({
                            $match: {
                                _id: { $in: docs.map(doc => doc._id) }
                            }
                        })
                } else {
                    pipeline.push({
                        $match: { $text: { $search: req.query.keywords } }
                    })
                }
            }

            // GEOCODING
            let interpretated_location
            if(req.query.location && !(req.query.lat && req.query.lng)){
                let { results } = await geocode(req.query.location)
                if(results[0]){
                    interpretated_location = results[0].formatted_address
                    req.query.lng = results[0].geometry.location.lng, 
                    req.query.lat = results[0].geometry.location.lat
                }
            }

            // GEONEAR
            if(req.query.lat && req.query.lng){
                pipeline.push({
                    $geoNear: {
                        near: {
                            type: "Point",
                            coordinates: [parseFloat(req.query.lng), parseFloat(req.query.lat)]
                        },
                        distanceField: "distance_away"
                    }
                })
            }

            // TAXONOMIES
            if(req.query.taxonomies) pipeline.push({
                $match: { "service.taxonomies.slug" : { $in: [].concat(req.query.taxonomies) }}
            })

            // PAGINATION
            pipeline.push({ $limit: 20 })
            if(req.query.page) pipeline.push({
                $skip: (parseInt(req.query.page) - 1) * perPage
            })

            await Service
                .aggregate(pipeline)
                .toArray()
                .then(results => res.json({
                    page: parseInt(req.query.page) || 1,
                    interpretated_location,
                    content: results
                }))

        } catch(e) {
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
