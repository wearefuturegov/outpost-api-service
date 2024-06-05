const Index = require("./../../../src/lib/index")

describe("Calling calculateDistance", () => {
  it("should return the minimum distance between the query and the locations", () => {
    const locations = [
      { geometry: { coordinates: [0, 1] } },
      { geometry: { coordinates: [0, 2] } },
    ]
    const distance = Index.calculateDistance(0, 0, locations)

    // Check if the distance is the minimum distance
    expect(distance).toBeCloseTo(69.1, 1) // The distance between (0, 0) and (0, 1) is approximately 69.1 miles
  })
})

describe("Calling geocode", () => {
  it.todo("should return a json object")
  it.todo("should throw an error if GOOGLE_API_KEY or location is not set")
})

describe("Calling projection", () => {
  it("should return the projection object", () => {
    const projection = Index.projection

    // Check if the projection object is correct
    expect(projection).toEqual({ _id: 0, visible_from: 0, visible_to: 0 })
  })
})
