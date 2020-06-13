const haversine = require("haversine")

module.exports = {
    calculateDistance: (query, location) => haversine({
        latitude: query.lat,
        longitude: query.lng
    },{
        latitude: location.geometry.coordinates[1],
        longitude: location.geometry.coordinates[0]
    },
    {
        unit: "mile"
    })
}