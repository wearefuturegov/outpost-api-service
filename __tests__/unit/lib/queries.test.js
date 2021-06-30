const Queries = require("../../../lib/queries")

describe('Calling filterAges ', () => {
  it('should return an empty result if called with no query', () => {
    const query = Queries.filterAges({}, { query: {} })
    expect(query).toStrictEqual({ "$and": [] })
  })
})