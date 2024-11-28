const { dbSetup, singleService, noResults } = require("./queries-helpers")
const logger = require("../../utils/logger")
const queries = require("../../src/lib/queries")
const { db: ourDb } = require("../../src/db")
const {
  getServices,
  getService,
} = require("../../src/controllers/v1/services/routes")
const { index, show } = require("../../src/controllers/v1/services/index")

// mocks
jest.mock("../../utils/logger")
jest.mock("../../src/db")

describe("queries", () => {
  let connection
  let db

  let req = {
    query: {},
  }
  let res = {
    json: jest.fn(),
  }
  let next = jest.fn()

  // setup db connection and mock our db
  beforeAll(async () => {
    const setup = await dbSetup()
    connection = setup.connection
    db = setup.db
    ourDb.mockImplementation(() => db)
  })

  afterAll(async () => {
    await connection.close()
  })

  // clean data before every test - including nested describes
  beforeEach(async () => {
    const collections = await db.collections()
    for (let collection of collections) {
      await collection.deleteMany({})
    }
  })

  // make sure it all works
  it("should add a service into the collection", async () => {
    const Service = db.collection("indexed_services")
    const mockService = { _id: 1, name: "Test Service" }
    await Service.insertOne(mockService)
    const insertedUser = await Service.findOne({ _id: 1 })
    expect(insertedUser).toEqual(mockService)
  })

  describe("show", () => {
    beforeEach(async () => {
      const Service = db.collection("indexed_services")
      await Service.insertOne(singleService())
      jest.spyOn(getService, "buildQuery")
      jest.spyOn(getService, "executeQuery")
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("should return the service when found", async () => {
      req.params = { id: 1 }
      const result = {
        id: 1,
        name: "Test Service",
      }
      await show(req, res, next)
      expect(getService.buildQuery).toHaveBeenCalledWith(req.params)
      expect(res.json).toHaveBeenCalledWith(result)
      expect(next).not.toHaveBeenCalled()
    })

    it("should call next with an error when no matching document is found", async () => {
      req.params = { id: 2 }
      await show(req, res, next)
      expect(getService.buildQuery).toHaveBeenCalledWith(req.params)
      expect(res.json).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith(new Error("No matching document"))
    })

    it("should call next with an error when an exception occurs", async () => {
      req.params = { id: 2 }
      const error = new Error("No matching document")
      await show(req, res, next)
      expect(getService.buildQuery).toHaveBeenCalledWith(req.params)
      expect(res.json).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledWith(error)
    })
  })

  describe("index", () => {
    beforeEach(async () => {
      jest.spyOn(getServices, "parseRequestParameters")
      jest.spyOn(getServices, "executeQuery")
      jest.spyOn(queries, "queryType")
    })

    afterEach(() => {
      jest.clearAllMocks()
    })

    it("should return a result if no services", async () => {
      await index(req, res, next)
      expect(getServices.parseRequestParameters).toHaveBeenCalledWith(req.query)
      expect(res.json).toHaveBeenCalledWith(noResults)
      expect(next).not.toHaveBeenCalled()
    })

    it("should return a list of services", async () => {
      const Service = db.collection("indexed_services")
      await Service.insertOne(singleService())
      const result = {
        number: 1,
        size: 1,
        totalPages: 1,
        totalElements: 1,
        first: true,
        last: true,
        perPage: 50,
        interpreted_location: undefined,
        content: [{ id: 1, name: "Test Service" }],
      }
      await index(req, res, next)
      expect(getServices.parseRequestParameters).toHaveBeenCalledWith(req.query)
      expect(res.json).toHaveBeenCalledWith(result)
      expect(next).not.toHaveBeenCalled()
    })

    describe("querytypes", () => {
      it("keyword", async () => {
        const Service = db.collection("indexed_services")
        await Service.insertMany([
          singleService({ id: 1, name: "one" }),
          singleService({ id: 2, name: "two" }),
        ])

        req.query = {
          keywords: "one",
        }
        const result = {
          number: 1,
          size: 1,
          totalPages: 1,
          totalElements: 1,
          first: true,
          last: true,
          perPage: 50,
          interpreted_location: undefined,
          content: [{ id: 1, name: "one", score: 5.5 }],
        }
        await index(req, res, next)
        expect(getServices.parseRequestParameters).toHaveBeenCalledWith(
          req.query
        )
        // expect(queries.queryType).toHaveBeenCalledWith("keyword")
        expect(res.json).toHaveBeenCalledWith(result)
        expect(next).not.toHaveBeenCalled()
      })

      describe("location", () => {
        it("lat and lng", async () => {
          const Service = db.collection("indexed_services")
          await Service.insertMany([
            singleService({ id: 1, name: "one" }),
            singleService({ id: 2, name: "two" }),
          ])

          const services = await Service.find({}).toArray()
          console.log(services)

          req.query = {
            lat: "51.999326",
            lng: "0.987645",
          }
          const result = {
            number: 1,
            size: 1,
            totalPages: 1,
            totalElements: 1,
            first: true,
            last: true,
            perPage: 50,
            interpreted_location: undefined,
            content: [{ id: 1, name: "one", score: 5.5 }],
          }
          await index(req, res, next)
          expect(getServices.parseRequestParameters).toHaveBeenCalledWith(
            req.query
          )
          // expect(res.json).toHaveBeenCalledWith(result)
          expect(next).not.toHaveBeenCalled()
        })
        it("lat", async () => {})
        it("lng", async () => {})
      })
      it("location_keyword", async () => {})
      it("undefined", async () => {})
    })
  })
})

// starts before opens_at
// 01:59 - 02:15

// starts at opens at
// 02:00 - 02:30

// within window
// 02:15 - 02:45

// ends at closes_at
// 02:30 - 03:00

// starts at opens_at ends at closes_at
// 02:00 - 03:00

// starts at opens_At and ends after closes_at
// 02:00 - 03:30

// starts after opens_At ends after closes_at
// 02:30 - 03:30

// starts before opens_at ends after closes_at
// 01:59 - 03:01

// const Service = db.collection("indexed_services")
// const services = await Service.find({}).toArray()
// console.log(services)

// show available services
// const Service = db.collection("indexed_services")
// const services = await Service.find({}).toArray()
// console.log(services)

// // Log the return values of buildQuery and executeQuery
// const buildQueryReturnValue = await getService.buildQuery(req.params)
// const executeQueryReturnValue = await getService.executeQuery(
//   buildQueryReturnValue
// )
// console.log("buildQuery returned:", JSON.stringify(buildQueryReturnValue))
// console.log("executeQuery returned:", executeQueryReturnValue)
