const filters = require("./../../../src/lib/filters")

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

  it('should return a query object with local_offer: true if only includes "local-offer"', () => {
    const localOffer = ["local-offer"]
    const expectedQuery = [{ local_offer: { $exists: true, $ne: null } }]
    expect(filters.filterOnly(localOffer)).toEqual(expectedQuery)
  })

  it('should return a query object with needs_referral: true if only includes "needs-referral"', () => {
    const needsReferral = ["needs-referral"]
    const expectedQuery = [{ needs_referral: true }]
    expect(filters.filterOnly(needsReferral)).toEqual(expectedQuery)
  })
})

describe("filterMeta", () => {
  it("should return an empty array if meta is not provided", () => {
    expect(filters.filterMeta()).toEqual([])
  })
  it("should return a query object with key and value if meta includes information", () => {
    expect(
      filters.filterMeta([
        { key: "service-meta-key", value: "service-meta-value" },
      ])
    ).toEqual([
      {
        meta: {
          $elemMatch: {
            key: "service-meta-key",
            value: "service-meta-value",
          },
        },
      },
    ])
  })
  it("should return a query object with each key and value if meta includes information", () => {
    expect(
      filters.filterMeta([
        { key: "service-meta-key", value: "service-meta-value" },
        { key: "service-meta-key-2", value: "service-meta-value-2" },
      ])
    ).toEqual([
      {
        meta: {
          $elemMatch: {
            key: "service-meta-key",
            value: "service-meta-value",
          },
        },
      },
      {
        meta: {
          $elemMatch: {
            key: "service-meta-key-2",
            value: "service-meta-value-2",
          },
        },
      },
    ])
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

describe("filterStartTimeEndTimeDay", () => {
  it("should return a query object if start_time, end_time, and day are provided", () => {
    const startTime = ["22:00"]
    const endTime = ["22:30"]
    const day = ["Monday"]
    const expectedQuery = {
      $or: [
        {
          "regular_schedules.opens_at": { $gte: "22:00" },
          "regular_schedules.closes_at": { $lte: "22:30" },
          "regular_schedules.weekday": "Monday",
        },
      ],
    }
    expect(filters.filterStartTimeEndTimeDay(startTime, endTime, day)).toEqual(
      expectedQuery
    )
  })

  it("should return a query object if only start_time is provided", () => {
    const startTime = ["22:00"]
    const endTime = []
    const day = []
    const expectedQuery = {
      $or: [
        {
          "regular_schedules.opens_at": { $gte: "22:00" },
        },
      ],
    }
    expect(filters.filterStartTimeEndTimeDay(startTime, endTime, day)).toEqual(
      expectedQuery
    )
  })

  it("should return a query object if only end_time is provided", () => {
    const startTime = []
    const endTime = ["22:30"]
    const day = []
    const expectedQuery = {
      $or: [
        {
          "regular_schedules.closes_at": { $lte: "22:30" },
        },
      ],
    }
    expect(filters.filterStartTimeEndTimeDay(startTime, endTime, day)).toEqual(
      expectedQuery
    )
  })

  it("should return a query object if only day is provided", () => {
    const startTime = []
    const endTime = []
    const day = ["Monday"]
    const expectedQuery = {
      $or: [
        {
          "regular_schedules.weekday": "Monday",
        },
      ],
    }
    expect(filters.filterStartTimeEndTimeDay(startTime, endTime, day)).toEqual(
      expectedQuery
    )
  })

  it("should return a query object if multiple sets of start_time, end_time, and day are provided", () => {
    const startTime = ["22:00", "22:00"]
    const endTime = ["22:30", "22:30"]
    const day = ["Monday", "Monday"]
    const expectedQuery = {
      $or: [
        {
          "regular_schedules.opens_at": { $gte: "22:00" },
          "regular_schedules.closes_at": { $lte: "22:30" },
          "regular_schedules.weekday": "Monday",
        },
        {
          "regular_schedules.opens_at": { $gte: "22:00" },
          "regular_schedules.closes_at": { $lte: "22:30" },
          "regular_schedules.weekday": "Monday",
        },
      ],
    }
    expect(filters.filterStartTimeEndTimeDay(startTime, endTime, day)).toEqual(
      expectedQuery
    )
  })
})

describe("removeVisibleNow", () => {
  it("Should remove the visible_from and visible_to from the query", () => {
    const query = {
      $text: { $search: "send" },
      $and: [
        {
          $or: [
            { visible_from: null },
            { visible_from: { $lte: "2025-02-27T22:58:30.423Z" } },
          ],
        },
        {
          $or: [
            { visible_to: null },
            { visible_to: { $gte: "2025-02-27T22:58:30.423Z" } },
          ],
        },
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    const expectedQuery = {
      $text: { $search: "send" },
      $and: [
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    expect(filters.removeVisibleNow(query)).toEqual(expectedQuery)
  })

  it("Should remove the visible_to from the query", () => {
    const query = {
      $text: { $search: "send" },
      $and: [
        {
          $or: [
            { visible_from: null },
            { visible_from: { $lte: "2025-02-27T22:58:30.423Z" } },
          ],
        },
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    const expectedQuery = {
      $text: { $search: "send" },
      $and: [
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    expect(filters.removeVisibleNow(query)).toEqual(expectedQuery)
  })

  it("Should remove the visible_from from the query", () => {
    const query = {
      $text: { $search: "send" },
      $and: [
        {
          $or: [
            { visible_to: null },
            { visible_to: { $gte: "2025-02-27T22:58:30.423Z" } },
          ],
        },
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    const expectedQuery = {
      $text: { $search: "send" },
      $and: [
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    expect(filters.removeVisibleNow(query)).toEqual(expectedQuery)
  })

  it("Should return the query as is if no visible_from or visible_to query", () => {
    const query = {
      $text: { $search: "send" },
      $and: [
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    const expectedQuery = {
      $text: { $search: "send" },
      $and: [
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    expect(filters.removeVisibleNow(query)).toEqual(expectedQuery)
  })

  it("Should return the query as is if no visible_from query", () => {
    const query = {
      $text: { $search: "send" },
      $and: [
        {
          $or: [
            { visible_to: null },
            { visible_to: { $gte: "2025-02-27T22:58:30.423Z" } },
          ],
        },
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    const expectedQuery = {
      $text: { $search: "send" },
      $and: [
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    expect(filters.removeVisibleNow(query)).toEqual(expectedQuery)
  })

  it("Should return the query as is if no visible_to query", () => {
    const query = {
      $text: { $search: "send" },
      $and: [
        {
          $or: [
            { visible_from: null },
            { visible_from: { $lte: "2025-02-27T22:58:30.423Z" } },
          ],
        },
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    const expectedQuery = {
      $text: { $search: "send" },
      $and: [
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    expect(filters.removeVisibleNow(query)).toEqual(expectedQuery)
  })

  it("Should return the query as is if no $and", () => {
    const query = {
      $text: { $search: "send" },
    }
    const expectedQuery = {
      $text: { $search: "send" },
    }
    expect(filters.removeVisibleNow(query)).toEqual(expectedQuery)
  })

  it("Should return other $or in the query", () => {
    const query = {
      $text: { $search: "send" },
      $and: [
        {
          $or: [{ max_age: null }, { max_age: { $gte: 12 } }],
        },
        {
          $or: [
            { visible_from: null },
            { visible_from: { $lte: "2025-02-27T22:58:30.423Z" } },
          ],
        },
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    const expectedQuery = {
      $text: { $search: "send" },
      $and: [
        {
          $or: [{ max_age: null }, { max_age: { $gte: 12 } }],
        },
        { "directories.label": { $in: ["bfis"] } },
        {
          "service_at_locations.location.geometry": {
            $exists: true,
            $ne: null,
          },
        },
      ],
    }
    expect(filters.removeVisibleNow(query)).toEqual(expectedQuery)
  })

  it("Should not return empty $and", () => {
    const query = {
      $text: { $search: "send" },
      $and: [
        {
          $or: [
            { visible_from: null },
            { visible_from: { $lte: "2025-02-27T22:58:30.423Z" } },
          ],
        },
        {
          $or: [
            { visible_to: null },
            { visible_to: { $gte: "2025-02-27T22:58:30.423Z" } },
          ],
        },
      ],
    }
    const expectedQuery = {
      $text: { $search: "send" },
    }
    expect(filters.removeVisibleNow(query)).toEqual(expectedQuery)
  })
})
