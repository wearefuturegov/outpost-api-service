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
})