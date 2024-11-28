require("dotenv").config()
const haversine = require("haversine")
const fetch = require("isomorphic-unfetch")

module.exports = {
  calculateDistance: (lat, lng, locations) => {
    let distances = []
    if (locations) {
      locations.forEach(location => {
        distances.push(
          haversine(
            {
              latitude: lat,
              longitude: lng,
            },
            {
              latitude: location.geometry.coordinates[1],
              longitude: location.geometry.coordinates[0],
            },
            {
              unit: "mile",
            }
          )
        )
      })
      return Math.min(...distances)
    }
  },

  geocode: async location => {
    if (!process.env.GOOGLE_API_KEY || !location) {
      throw new Error(
        "GOOGLE_API_KEY and or location are not set, unable to geocode locations"
      )
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${location}&region=uk&key=${process.env.GOOGLE_API_KEY}`
    )
    return await response.json()
  },

  projection: {
    _id: 0,
    visible_from: 0,
    visible_to: 0,
  },

  /**
   * Used to map the day abbreviation to the full day names
   */
  dayMapping: {
    SU: "Sunday",
    MO: "Monday",
    TU: "Tuesday",
    WE: "Wednesday",
    TH: "Thursday",
    FR: "Friday",
    SA: "Saturday",
  },
}
