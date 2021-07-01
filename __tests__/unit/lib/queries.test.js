const Queries = require("../../../lib/queries")

describe('Calling filterAges ', () => {
  it('should return an empty result if called with no query', () => {
    const query = Queries.filterAges({}, { query: {} })
    expect(query).toStrictEqual({ "$and": [] })
  })

  it('should return a query containing lte the min_age supplied', () => {
    const query = Queries.filterAges({}, { query: { min_age: 16 } })
    expect(query).toStrictEqual({
      "$and": [
        {
          "$or": [
            {
              "min_age": null,
            },
            {
              "min_age": {
                "$lte": 16,
              },
            },
          ],
        },
      ],
    })
  })

  // TODO: I think this should be gte min_age 0 and lte max_age 12 
  it('should return a query containing gte the max_age supplied', () => {
    const query = Queries.filterAges({}, { query: { max_age: 12 } })
    expect(query).toStrictEqual({
      "$and": [
        {
          "$or": [
            {
              "max_age": null,
            },
            {
              "max_age": {
                "$gte": 12,
              },
            },
          ],
        },
      ],
    })
  })

  // TODO I think this should be lte max_age && gte min_age
  it('should return a query containing gte the max_age and lte the min_age supplied', () => {
    const query = Queries.filterAges({}, { query: { min_age: 8, max_age: 14 } })
    expect(query).toStrictEqual({
      "$and": [
        {
          "$or": [
            {
              "min_age": null,
            },
            {
              "min_age": {
                "$lte": 8,
              },
            },
          ],
        },
        {
          "$or": [
            {
              "max_age": null,
            },
            {
              "max_age": {
                "$gte": 14,
              },
            },
          ],
        },
      ],
    })
  })
})

