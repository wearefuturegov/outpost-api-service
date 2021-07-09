const Queries = require("../../../lib/queries")

describe('Calling filterAges ', () => {
  it('should return an empty result if called with no query', () => {
    const query = Queries.filterAges({}, { query: {} })
    expect(query).toStrictEqual({ "$and": [] })
  })

  describe('with only a min_age supplied', () => {
    const query = Queries.filterAges({}, { query: { min_age: 16 } })

    it('should return a query containing a max_age gte the min_age supplied', () => {
      expect(query).toStrictEqual({
        "$and": [
          {
            "$or": [
              {
                "max_age": null,
              },
              {
                "max_age": {
                  "$gte": 16,
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe('with only a max_age supplied', () => {
    const query = Queries.filterAges({}, { query: { max_age: 12 } })

    it('should return a query containing min_age lte the max_age supplied', () => {
      expect(query).toStrictEqual({
        "$and": [
          {
            "$or": [
              {
                "min_age": null,
              },
              {
                "min_age": {
                  "$lte": 12,
                },
              },
            ],
          },
        ],
      })
    })
  })

  describe('with a min_age and a max_age supplied', () => {
    const query = Queries.filterAges({}, { query: { min_age: 8, max_age: 14 } })

    it('should return a query containing max_age gte the min_age and min_age lte the max_age supplied', () => {
      expect(query).toStrictEqual({
        "$and": [
          {
            "$or": [
              {
                "max_age": null,
              },
              {
                "max_age": {
                  "$gte": 8,
                },
              },
            ],
          },
          {
            "$or": [
              {
                "min_age": null,
              },
              {
                "min_age": {
                  "$lte": 14,
                },
              },
            ],
          },
        ],
      })
    })
  })
})
