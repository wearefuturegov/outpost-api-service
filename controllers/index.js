const { db } = require("../db")

module.exports = {
    index: (req, res, next) => {

        let query = {}

        if(req.query.taxonomies) query["taxonomies.name"] = {$in: [].concat(req.query.taxonomies)}
        if(req.query.keywords) query.$text = { $search: req.query.keywords }

        db().collection("indexed_services")
            .find(query)
            .limit(100)
            .toArray()
            .then(docs => res.json(docs))
            .catch(err => next(err))
    },

    show: async (req, res, next) => {
        try{
            let result = await db().collection("indexed_services").findOne({id: parseInt(req.params.id)})
            if(!result) throw new Error("No matching service")
            res.json(result)
        } catch(err) {
            next(err)
        }
    }
}