const filters = require("./../../../src/lib/filters")

describe("filterLocation", () => {
  it("should return an empty object if lat and lng are not provided", () => {
    expect(filters.filterLocation()).toEqual({})
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
    expect(filters.filterLocation(lat, lng, false)).toEqual(expectedQuery)
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
    expect(filters.filterLocation(lat, lng, true)).toEqual(expectedQuery)
  })
})

describe("Calling visibleNow", () => {
  it("should return a query that checks if a document is visible now", () => {
    const query = filters.visibleNow()

    // Check if the query contains the correct conditions
    expect(query).toEqual([
      {
        $or: [
          { visible_from: null },
          { visible_from: { $lte: expect.any(Date) } },
        ],
      },
      {
        $or: [{ visible_to: null }, { visible_to: { $gte: expect.any(Date) } }],
      },
    ])
  })
})

describe("filterKeywords", () => {
  it("should return an empty object if keywords are not provided", async () => {
    const result = await filters.filterKeywords()
    expect(result).toEqual({})
  })

  it("should return a query object with $text if no locationInQuery is provided", async () => {
    const keywords = "test"
    const expectedQuery = { $text: { $search: keywords } }
    const result = await filters.filterKeywords(keywords)
    expect(result).toEqual(expectedQuery)
  })

  it.todo("should return a query object with _id if locationInQuery is true")
  // it("should return a query object with _id if locationInQuery is true", async () => {
  //   const keywords = "test"
  //   const args = ["arg1", "arg2"]
  //   const expectedQuery = {
  //     _id: { $in: [new ObjectId("60d5ec9af682fbd39a892fb6")] },
  //   }
  //   const result = await filters.filterKeywords(keywords, ...args)
  //   expect(result).toEqual(expectedQuery)
  // })
})

describe("filterAges", () => {
  it("should return an empty array if min_age and max_age are not provided", () => {
    expect(filters.filterAges()).toEqual([])
  })

  it("should return a query object with max_age if min_age is provided", () => {
    const min_age = "10"
    const expectedQuery = [
      {
        $or: [{ max_age: null }, { max_age: { $gte: parseInt(min_age) } }],
      },
    ]
    expect(filters.filterAges(min_age)).toEqual(expectedQuery)
  })

  it("should return a query object with min_age if max_age is provided", () => {
    const max_age = "20"
    const expectedQuery = [
      {
        $or: [{ min_age: null }, { min_age: { $lte: parseInt(max_age) } }],
      },
    ]
    expect(filters.filterAges(undefined, max_age)).toEqual(expectedQuery)
  })

  it("should return a query object with min_age and max_age if both are provided", () => {
    const min_age = "10"
    const max_age = "20"
    const expectedQuery = [
      {
        $or: [{ max_age: null }, { max_age: { $gte: parseInt(min_age) } }],
      },
      {
        $or: [{ min_age: null }, { min_age: { $lte: parseInt(max_age) } }],
      },
    ]
    expect(filters.filterAges(min_age, max_age)).toEqual(expectedQuery)
  })
})

describe("filterOnly", () => {
  it("should return an empty array if only is not provided", () => {
    expect(filters.filterOnly()).toEqual([])
  })

  it('should return a query object with free: true if only includes "free"', () => {
    const only = ["free"]
    const expectedQuery = [{ free: true }]
    expect(filters.filterOnly(only)).toEqual(expectedQuery)
  })
})

describe("filterTaxonomies", () => {
  it("should return an empty object if taxonomies is not provided", () => {
    expect(filters.filterTaxonomies()).toEqual({})
  })

  it("should return a query array if taxonomies is provided", () => {
    const taxonomies = [
      "things-to-do",
      "clubs-and-groups,holiday-activities,dance-drama-and-music",
      "youth-clubs,gaming,sports-courses-and-camps,dance-drama-and-music",
    ]
    const expectedQuery = {
      "taxonomies.slug": {
        $all: [
          "things-to-do",
          "clubs-and-groups,holiday-activities,dance-drama-and-music",
          "youth-clubs,gaming,sports-courses-and-camps,dance-drama-and-music",
        ],
      },
    }

    expect(filters.filterTaxonomies(taxonomies)).toEqual(expectedQuery)
  })
})

describe("filterDirectories", () => {
  it("should return an empty object if directories is not provided", () => {
    expect(filters.filterDirectories()).toEqual({})
  })

  it("should return an empty object if directories is an empty array", () => {
    expect(filters.filterDirectories([])).toEqual({})
  })

  it("should return a query object if directories is provided", () => {
    const directories = ["bfis", "bod"]
    const expectedQuery = {
      "directories.label": { $in: directories },
    }
    expect(filters.filterDirectories(directories)).toEqual(expectedQuery)
  })
})

describe("filterSuitabilities", () => {
  it("should return an empty object if suitabilities is not provided", () => {
    expect(filters.filterSuitabilities()).toEqual({})
  })

  it("should return a query object if suitabilities is provided", () => {
    const suitabilities = [
      "physical-disabilities",
      "mental-health-acquired-brain-injury",
    ]
    const expectedQuery = {
      "suitabilities.slug": { $in: suitabilities },
    }
    expect(filters.filterSuitabilities(suitabilities)).toEqual(expectedQuery)
  })
})

describe("filterNeeds", () => {
  it("should return an empty object if needs is not provided", () => {
    expect(filters.filterNeeds()).toEqual({})
  })

  it("should return a query object if needs is provided", () => {
    const needs = ["visual", "autism"]
    const expectedQuery = {
      "send_needs.slug": { $in: needs },
    }
    expect(filters.filterNeeds(needs)).toEqual(expectedQuery)
  })
})

describe("filterAccessibilities", () => {
  it("should return an empty object if accessibilities is not provided", () => {
    expect(filters.filterAccessibilities()).toEqual({})
  })

  it("should return a query object if accessibilities is provided", () => {
    const accessibilities = [
      "accessible-toilet-facilities",
      "wheelchair-accessible-entrance",
    ]
    const expectedQuery = {
      "service_at_locations.location.accessibilities.slug": {
        $in: accessibilities,
      },
    }
    expect(filters.filterAccessibilities(accessibilities)).toEqual(
      expectedQuery
    )
  })
})

describe("filterDays", () => {
  it("should return an empty object if days is not provided", () => {
    expect(filters.filterDays()).toEqual({})
  })

  it("should return an empty object if days is an empty array", () => {
    expect(filters.filterDays([])).toEqual({})
  })

  it("should return a query object if days is provided", () => {
    const days = ["Monday", "Tuesday"]
    const expectedQuery = {
      "regular_schedules.weekday": { $in: days },
    }
    expect(filters.filterDays(days)).toEqual(expectedQuery)
  })
})
