const Index = require("../../../lib/index")

describe("Calling calculateDistance", () => {
  it("should return the minimum distance between the query and the locations", () => {
    const query = { lat: 0, lng: 0 }
    const locations = [
      { geometry: { coordinates: [0, 1] } },
      { geometry: { coordinates: [0, 2] } },
    ]
    const distance = Index.calculateDistance(query, locations)

    // Check if the distance is the minimum distance
    expect(distance).toBeCloseTo(69.1, 1) // The distance between (0, 0) and (0, 1) is approximately 69.1 miles
  })
})
