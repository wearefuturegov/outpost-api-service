const index = require("./../../../src/controllers/v1/index")
const services = require("./../../../src/controllers/v1/services/index")

jest.mock("./../../../src/controllers/v1/services/index")

describe("index", () => {
  it("should export services", () => {
    expect(index.services).toBe(services)
  })
})
