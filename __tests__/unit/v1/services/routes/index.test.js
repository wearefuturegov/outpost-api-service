const index = require("./../../../../../src/controllers/v1/services/routes/index")
const getServices = require("./../../../../../src/controllers/v1/services/routes/get-services")
const getService = require("./../../../../../src/controllers/v1/services/routes/get-service")

jest.mock("./../../../../../src/controllers/v1/services/routes/get-services")
jest.mock("./../../../../../src/controllers/v1/services/routes/get-service")

describe("index", () => {
  it("should export getServices and getService", () => {
    expect(index.getServices).toBe(getServices)
    expect(index.getService).toBe(getService)
  })
})
