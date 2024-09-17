const {
  buildQuery,
  executeQuery,
} = require("./../../../../../src/controllers/v1/services/routes/get-service")
const filters = require("./../../../../../src/lib/filters")
const Index = require("./../../../../../src/lib")
const { db } = require("./../../../../../src/db")
const { projection } = require("./../../../../../src/lib")

jest.mock("./../../../../../src/lib/filters")
jest.mock("./../../../../../src/db")

describe("get-service", () => {
  describe("buildQuery", () => {
    it("should build a query with the provided parameters", async () => {
      const parameters = { id: "123" }
      const visibleNow = [{ visible: true }]
      filters.visibleNow.mockReturnValue(visibleNow)

      const expectedQuery = { id: 123, $and: visibleNow }
      const query = await buildQuery(parameters)

      expect(query).toEqual(expectedQuery)
    })
  })

  describe("executeQuery", () => {
    it("should execute the provided query and return the result", async () => {
      const query = { id: 123, $and: [{ visible: true }] }
      const result = { id: 123, name: "Test Service" }
      const mockDb = {
        collection: jest.fn().mockReturnThis(),
        findOne: jest.fn().mockResolvedValue(result),
      }
      db.mockReturnValue(mockDb)

      const returnedResult = await executeQuery(query)

      expect(mockDb.collection).toHaveBeenCalledWith("indexed_services")
      expect(mockDb.findOne).toHaveBeenCalledWith(query, { projection })
      expect(returnedResult).toEqual(result)
    })
  })
})
