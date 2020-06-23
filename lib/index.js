const haversine = require("haversine")
const fetch = require("isomorphic-unfetch")

module.exports = {
    calculateDistance: (query, locations) => {
        let distances = []
        locations.forEach(location => {
            distances.push(haversine({
                latitude: query.lat,
                longitude: query.lng
            },{
                latitude: location.geometry.coordinates[1],
                longitude: location.geometry.coordinates[0]
            },
            {
                unit: "mile"
            }))
        })
        return Math.min(...distances)
    },

    geocode: async location => {
        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&region=uk&key=${process.env.GOOGLE_API_KEY}`)
        return await response.json()
    },

    projection: {
        _id: 0
    }
}