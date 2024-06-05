const { MongoClient } = require("mongodb")
const { connect, db } = require("./../../src/db")
const logger = require("./../../utils/logger")

jest.mock("mongodb")
jest.mock("./../../utils/logger")

describe("db", () => {
  describe("connect", () => {
    it.todo("should connect to the database and call the callback with the db")
    // it("should connect to the database and call the callback with the db", async () => {
    //   const mockDb = { databaseName: "outpost_api_development" }
    //   const mockClient = { db: jest.fn().mockReturnValue(mockDb) }
    //   MongoClient.connect.mockResolvedValue(mockClient)

    //   const cb = jest.fn()
    //   await connect(cb)

    //   expect(MongoClient.connect).toHaveBeenCalledWith(process.env.DB_URI)
    //   expect(mockClient.db).toHaveBeenCalled()
    //   expect(cb).toHaveBeenCalledWith(mockDb)
    // })

    it.todo("should log an error if the connection fails")
    // it("should log an error if the connection fails", async () => {
    //   const error = new Error("Connection failed")
    //   MongoClient.connect.mockRejectedValue(error)

    //   const cb = jest.fn()
    //   await connect(cb)

    //   expect(logger.error).toHaveBeenCalledWith(error)
    // })

    it.todo("should warn you if it connects but the database is 'test'")
  })

  describe("db", () => {
    it("should throw an error if not connected", () => {
      expect(() => db()).toThrow(
        "db() called without being connected to the database. Please connect first, see application logs for more details."
      )
    })

    it.todo("should return the db if connected")
  })
})
