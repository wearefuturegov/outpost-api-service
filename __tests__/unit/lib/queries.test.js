const queries = require("./../../../src/lib/queries")

describe("queryType", () => {
  test('should return "keyword" when only keywords are provided', () => {
    const parameters = { keywords: "test" }
    expect(queries.queryType(parameters)).toBe("keyword")
  })

  test('should return "location" when only lat and lng are provided', () => {
    const parameters = { lat: 51.5074, lng: -0.1278 }
    expect(queries.queryType(parameters)).toBe("location")
  })

  test('should return "keyword_location" when keywords, lat, and lng are all provided', () => {
    const parameters = { keywords: "test", lat: 51.5074, lng: -0.1278 }
    expect(queries.queryType(parameters)).toBe("keyword_location")
  })

  test("should return undefined when none of the parameters are provided", () => {
    const parameters = {}
    expect(queries.queryType(parameters)).toBeUndefined()
  })

  test("should return undefined when keywords is provided but lat and lng are missing", () => {
    const parameters = { keywords: "test", lat: undefined, lng: undefined }
    expect(queries.queryType(parameters)).toBe("keyword")
  })

  test("should return undefined when lat and lng are provided but keywords is missing", () => {
    const parameters = { keywords: undefined, lat: 51.5074, lng: -0.1278 }
    expect(queries.queryType(parameters)).toBe("location")
  })
})

describe("addFilters", () => {})
