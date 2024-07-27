const getServices = require("../../../src/controllers/v1/services/routes/get-services")
const locations = require("./../../../src/lib/locations")

describe("filterLocationNearest", () => {
  test("should return null when the list of locations is empty", async () => {
    const lat = undefined
    const lng = undefined
    const { proximity } = await getServices.parseRequestParameters({})
    expect(locations.filterLocationNearest(lat, lng, proximity)).toEqual({})
  })

  test("should return results when lat and lng is set", async () => {
    const lat = parseFloat(1)
    const lng = parseFloat(1.2)
    const { proximity } = await getServices.parseRequestParameters({ lat, lng })
    expect(locations.filterLocationNearest(lat, lng, proximity)).toEqual({
      "service_at_locations.location.geometry": {
        $nearSphere: {
          $geometry: {
            coordinates: [lng, lat],
            type: "Point",
          },
          $maxDistance: proximity,
        },
      },
    })
  })

  test("should return results when one or another lat/lng is 0", async () => {
    const lat = parseFloat(0)
    const lng = parseFloat(1.2)
    const { proximity } = await getServices.parseRequestParameters({ lat, lng })
    expect(locations.filterLocationNearest(lat, lng, proximity)).toEqual({
      "service_at_locations.location.geometry": {
        $nearSphere: {
          $geometry: {
            coordinates: [lng, lat],
            type: "Point",
          },
          $maxDistance: proximity,
        },
      },
    })
  })
})

describe("filterLocationKeywords", () => {
  test("should return an empty object when no keywords", async () => {
    const keywords = undefined
    const parameters = await getServices.parseRequestParameters({})
    const result = await locations.filterLocationKeywords(keywords, parameters)
    expect(result).toEqual({})
  })

  // test("should return a list of ids", async () => {
  //   const keywords = "SEND peer support"
  //   const parameters = await getServices.parseRequestParameters({})
  //   const result = await locations.filterLocationKeywords(keywords, parameters)
  //   expect(locations.filterLocationKeywords(keywords, parameters)).toEqual({
  //     $and: [
  //       { keyword: "test" },
  //       { filter: "test" },
  //       {
  //         "service_at_locations.location.geometry": {
  //           $exists: true,
  //           $ne: null,
  //         },
  //       },
  //     ],
  //   })
  // })
})

describe("filterLocation", () => {
  it("should return an empty object if lat and lng are not provided", () => {
    expect(locations.filterLocation()).toEqual({})
  })

  it("should return a query object if lat and lng are provided", () => {
    const lat = "40.7128"
    const lng = "-74.0060"
    const expectedQuery = {
      "service_at_locations.location.geometry": {
        $geoWithin: {
          $centerSphere: [[parseFloat(lng), parseFloat(lat)], 20 / 3963.2],
        },
      },
    }
    expect(locations.filterLocation(lat, lng, false)).toEqual(expectedQuery)
  })

  it("should return a different query object if lat and lng and keywordSearch are provided", () => {
    const lat = "40.7128"
    const lng = "-74.0060"
    const expectedQuery = {
      $or: [
        {
          "service_at_locations.location.geometry": {
            $geoWithin: {
              $centerSphere: [
                [parseFloat(lng), parseFloat(lat)],
                20 / 3963.2, // miles x 1609.34 = Distance in meters
              ],
            },
          },
        },
        { "service_at_locations.location.geometry": { $exists: false } },
      ],
    }
    expect(locations.filterLocation(lat, lng, true)).toEqual(expectedQuery)
  })
})
