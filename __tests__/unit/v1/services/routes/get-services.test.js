const {
  buildQuery,
  executeQuery,
} = require("./../../../../../src/controllers/v1/services/routes/get-service")
const { geocode } = require("./../../../../../src/lib")
const filters = require("./../../../../../src/lib/filters")
const Index = require("./../../../../../src/lib")
const { db } = require("./../../../../../src/db")
const {
  parseRequestParameters,
} = require("./../../../../../src/controllers/v1/services/routes/get-services")

jest.mock("./../../../../../src/lib/index")
jest.mock("./../../../../../src/db")

describe("get-services", () => {
  describe("parseRequestParameters", () => {
    it("should return thes parameters when no query parameters are provided", async () => {
      const expectedResults = {
        perPage: 50,
        page: 1,
        keywords: undefined,
        location: undefined,
        lat: undefined,
        lng: undefined,
        directories: [],
        taxonomies: [],
        needs: [],
        suitabilities: [],
        days: [],
        accessibilities: [],
        only: [],
        minAge: undefined,
        maxAge: undefined,
        interpreted_location: undefined,
      }

      const results = await parseRequestParameters({})

      expect(results).toEqual(expectedResults)
    })

    describe("perPage", () => {
      it("should return 50 if perPage is not provided", async () => {
        const { perPage } = await parseRequestParameters({})
        expect(perPage).toEqual(50)
      })
      it("should return a number if a string is passed through", async () => {
        const { perPage } = await parseRequestParameters({ per_page: "100" })
        expect(perPage).toEqual(100)
      })
      it("should return a number if a number is passed through", async () => {
        const { perPage } = await parseRequestParameters({ per_page: 100 })
        expect(perPage).toEqual(100)
      })
    })

    describe("page", () => {
      it("should return 1 if page is not provided", async () => {
        const { page } = await parseRequestParameters({})
        expect(page).toEqual(1)
      })
      it("should return a number if a string is passed through", async () => {
        const { page } = await parseRequestParameters({ page: "1" })
        expect(page).toEqual(1)
      })
      it("should return a number if a number is passed through", async () => {
        const { page } = await parseRequestParameters({ page: 1 })
        expect(page).toEqual(1)
      })
    })

    describe("keywords", () => {
      it("should return undefined if keywords are not provided", async () => {
        const { keywords } = await parseRequestParameters({})
        expect(keywords).toBeUndefined()
      })
      it("should return a string if a value is passed through", async () => {
        const { keywords } = await parseRequestParameters({ keywords: "test" })
        expect(keywords).toEqual("test")
      })
    })

    describe("location", () => {
      it("should return undefined if location is not provided", async () => {
        const { location } = await parseRequestParameters({})
        expect(location).toBeUndefined()
      })
      it("should return a string if a value is passed through", async () => {
        const { location } = await parseRequestParameters({
          location: "London",
        })
        expect(location).toEqual("London")
      })

      it("should return interpreted_location and the corresponding lat lng if valid location is provided", async () => {
        const queryParams = { location: "London" }
        const results = [
          {
            formatted_address: "London, UK",
            geometry: { location: { lat: "2.12", lng: "2.12" } },
          },
        ]
        geocode.mockResolvedValue({ results })
        const { interpreted_location, lat, lng } = await parseRequestParameters(
          queryParams
        )
        expect(geocode).toHaveBeenCalledWith(queryParams.location)
        expect(interpreted_location).toEqual(results[0].formatted_address)
        expect(lat).toBeCloseTo(parseInt(results[0].geometry.location.lat))
        expect(lng).toBeCloseTo(parseInt(results[0].geometry.location.lng))
      })

      it("should return undefined if invalid location is provided", async () => {
        const queryParams = { location: "Not a real place" }
        const results = []
        geocode.mockResolvedValue({ results })
        const { interpreted_location, lat, lng } = await parseRequestParameters(
          queryParams
        )
        expect(interpreted_location).toBeUndefined()
        expect(lat).toBeUndefined()
        expect(lng).toBeUndefined()
      })

      it("should return provided lat lng even if location is provided", async () => {
        const queryParams = { location: "London", lat: 1.12, lng: 1.12 }
        const results = [
          {
            formatted_address: "London, UK",
            geometry: { location: { lat: "2.12", lng: "2.12" } },
          },
        ]
        geocode.mockResolvedValue({ results })
        const { interpreted_location, lat, lng, location } =
          await parseRequestParameters(queryParams)

        expect(geocode).toHaveBeenCalledWith(queryParams.location)
        expect(interpreted_location).toBeUndefined()
        expect(lat).toBeCloseTo(1.12)
        expect(lng).toBeCloseTo(1.12)
      })
    })

    describe("lat", () => {
      it("should return undefined if lat are not provided", async () => {
        const { lat } = await parseRequestParameters({})
        expect(lat).toBeUndefined()
      })
      it("should return a float if a string is passed through", async () => {
        const { lat } = await parseRequestParameters({ lat: "1.12" })
        expect(lat).toBeCloseTo(1.12)
      })
      it("should return a float if a number is passed through", async () => {
        const { lat } = await parseRequestParameters({ lat: 1.12 })
        expect(lat).toBeCloseTo(1.12)
      })
    })

    describe("lng", () => {
      it("should return undefined if lng are not provided", async () => {
        const { lng } = await parseRequestParameters({})
        expect(lng).toBeUndefined()
      })
      it("should return a float if a string is passed through", async () => {
        const { lng } = await parseRequestParameters({ lng: "1.12" })
        expect(lng).toBeCloseTo(1.12)
      })
      it("should return a float if a number is passed through", async () => {
        const { lng } = await parseRequestParameters({ lng: 1.12 })
        expect(lng).toBeCloseTo(1.12)
      })
    })

    describe("directories", () => {
      it("should return undefined if directories are not provided", async () => {
        const { directories } = await parseRequestParameters({})
        expect(directories).toEqual([])
      })
      it("should return a unique array multiple targets are passed through", async () => {
        const { directories } = await parseRequestParameters({
          directories: ["a", "b,a"],
        })
        expect(new Set(directories)).toEqual(new Set(["a", "b"]))
      })
      it("should return a unique array one target is passed through", async () => {
        const { directories } = await parseRequestParameters({
          directories: ["a,b"],
        })
        expect(new Set(directories)).toEqual(new Set(["a", "b"]))
      })
    })

    describe("taxonomies", () => {
      it("should return undefined if taxonomies are not provided", async () => {
        const { taxonomies } = await parseRequestParameters({})
        expect(taxonomies).toEqual([])
      })
      it("should return a unique array multiple targets are passed through", async () => {
        const { taxonomies } = await parseRequestParameters({
          taxonomies: ["a", "b,a"],
        })
        expect(new Set(taxonomies)).toEqual(new Set(["a", "b"]))
      })
      it("should return a unique array one target is passed through", async () => {
        const { taxonomies } = await parseRequestParameters({
          taxonomies: ["a,b"],
        })
        expect(new Set(taxonomies)).toEqual(new Set(["a", "b"]))
      })
    })

    describe("needs", () => {
      it("should return undefined if needs are not provided", async () => {
        const { needs } = await parseRequestParameters({})
        expect(needs).toEqual([])
      })
      it("should return a unique array multiple targets are passed through", async () => {
        const { needs } = await parseRequestParameters({
          needs: ["a", "b,a"],
        })
        expect(new Set(needs)).toEqual(new Set(["a", "b"]))
      })
      it("should return a unique array one target is passed through", async () => {
        const { needs } = await parseRequestParameters({
          needs: ["a,b"],
        })
        expect(new Set(needs)).toEqual(new Set(["a", "b"]))
      })
    })

    describe("suitabilities", () => {
      it("should return undefined if suitabilities are not provided", async () => {
        const { suitabilities } = await parseRequestParameters({})
        expect(suitabilities).toEqual([])
      })
      it("should return a unique array multiple targets are passed through", async () => {
        const { suitabilities } = await parseRequestParameters({
          suitabilities: ["a", "b,a"],
        })
        expect(new Set(suitabilities)).toEqual(new Set(["a", "b"]))
      })
      it("should return a unique array one target is passed through", async () => {
        const { suitabilities } = await parseRequestParameters({
          suitabilities: ["a,b"],
        })
        expect(new Set(suitabilities)).toEqual(new Set(["a", "b"]))
      })
    })

    describe("accessibilities", () => {
      it("should return undefined if accessibilities are not provided", async () => {
        const { accessibilities } = await parseRequestParameters({})
        expect(accessibilities).toEqual([])
      })
      it("should return a unique array multiple targets are passed through", async () => {
        const { accessibilities } = await parseRequestParameters({
          accessibilities: ["a", "b,a"],
        })
        expect(new Set(accessibilities)).toEqual(new Set(["a", "b"]))
      })
      it("should return a unique array one target is passed through", async () => {
        const { accessibilities } = await parseRequestParameters({
          accessibilities: ["a,b"],
        })
        expect(new Set(accessibilities)).toEqual(new Set(["a", "b"]))
      })
    })

    describe("days", () => {
      it("should return undefined if days are not provided", async () => {
        const { days } = await parseRequestParameters({})
        expect(days).toEqual([])
      })
      it("should return a unique array multiple targets are passed through", async () => {
        const { days } = await parseRequestParameters({
          days: ["a", "b,a"],
        })
        expect(new Set(days)).toEqual(new Set(["a", "b"]))
      })
      it("should return a unique array one target is passed through", async () => {
        const { days } = await parseRequestParameters({
          days: ["a,b"],
        })
        expect(new Set(days)).toEqual(new Set(["a", "b"]))
      })
    })

    describe("only", () => {
      it("should return undefined if only are not provided", async () => {
        const { only } = await parseRequestParameters({})
        expect(only).toEqual([])
      })
      it("should return a unique array multiple targets are passed through", async () => {
        const { only } = await parseRequestParameters({
          only: ["a", "b,a"],
        })
        expect(new Set(only)).toEqual(new Set(["a", "b"]))
      })
      it("should return a unique array one target is passed through", async () => {
        const { only } = await parseRequestParameters({
          only: ["a,b"],
        })
        expect(new Set(only)).toEqual(new Set(["a", "b"]))
      })
    })

    describe("minAge", () => {
      it("should return undefined if minAge is not provided", async () => {
        const { minAge } = await parseRequestParameters({})
        expect(minAge).toBeUndefined()
      })
      it("should return a number if a string is passed through", async () => {
        const { minAge } = await parseRequestParameters({ min_age: "1" })
        expect(minAge).toEqual(1)
      })
      it("should return a number if a number is passed through", async () => {
        const { minAge } = await parseRequestParameters({ min_age: 1 })
        expect(minAge).toEqual(1)
      })
    })

    describe("maxAge", () => {
      it("should return undefined if page is not provided", async () => {
        const { maxAge } = await parseRequestParameters({})
        expect(maxAge).toBeUndefined()
      })
      it("should return a number if a string is passed through", async () => {
        const { maxAge } = await parseRequestParameters({ max_age: "1" })
        expect(maxAge).toEqual(1)
      })
      it("should return a number if a number is passed through", async () => {
        const { maxAge } = await parseRequestParameters({ max_age: 1 })
        expect(maxAge).toEqual(1)
      })
    })

    describe("interpreted_location", () => {
      it("should return undefined if location is not provided", async () => {
        const { interpreted_location } = await parseRequestParameters({})
        expect(interpreted_location).toBeUndefined()
      })
      it.todo(
        "should return the formatted address if valid location is provided"
      )
      it.todo(
        "should return the formatted address if invalid location is provided"
      )
    })
  })
  describe("buildQuery", () => {})
  describe("createCountQuery", () => {})
  describe("executeQuery", () => {})
  describe("buildContent", () => {})
  describe("buildResponse", () => {})
})
