const fetch = require("isomorphic-unfetch")

module.exports = async location => {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}&region=uk&key=${process.env.GOOGLE_API_KEY}`)
    return await response.json()
}