const {
  index,
  show,
} = require("./../../../../src/controllers/v1/services/index")
const getServices = require("./../../../../src/controllers/v1/services/routes/get-services")
const getService = require("./../../../../src/controllers/v1/services/routes/get-service")

jest.mock("./../../../../src/controllers/v1/services/routes/get-services")
jest.mock("./../../../../src/controllers/v1/services/routes/get-service")

describe("index", () => {
  it("should parse request parameters, build and execute query, build content and response, and send the response", async () => {
    const req = { query: {} }
    const res = { json: jest.fn() }
    const next = jest.fn()

    const parameters = { perPage: 10, page: 2 }
    const queryType = undefined
    const query = { id: 123 }
    const results = [{ id: 123, name: "Test Service" }]
    const count = 1
    const content = "Test Content"
    const response = { results, count, content }

    getServices.parseRequestParameters.mockResolvedValue(parameters)
    getServices.buildQuery.mockResolvedValue(query)
    getServices.executeQuery.mockResolvedValue({ results, count })
    getServices.buildContent.mockReturnValue(content)
    getServices.buildResponse.mockReturnValue(response)

    await index(req, res, next)

    expect(getServices.parseRequestParameters).toHaveBeenCalledWith(req.query)

    expect(getServices.buildQuery).toHaveBeenCalledWith(parameters, queryType)
    expect(getServices.executeQuery).toHaveBeenCalledWith(
      query,
      parameters.perPage,
      parameters.page,
      queryType
    )
    expect(getServices.buildContent).toHaveBeenCalledWith(
      results,
      parameters.lat,
      parameters.lng
    )
    expect(getServices.buildResponse).toHaveBeenCalledWith(
      { results, count },
      parameters.perPage,
      parameters.page,
      content,
      parameters.interpreted_location
    )
    expect(res.json).toHaveBeenCalledWith(response)
  })

  it("should call next with the error if an error occurs", async () => {
    const req = { query: {} }
    const res = { json: jest.fn() }
    const next = jest.fn()
    const error = new Error("Test Error")

    getServices.parseRequestParameters.mockRejectedValue(error)

    await index(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  describe("show", () => {
    it("should build and execute query, and send the result", async () => {
      const req = { params: { id: "123" } }
      const res = { json: jest.fn() }
      const next = jest.fn()

      const query = { id: 123 }
      const result = { id: 123, name: "Test Service" }

      getService.buildQuery.mockReturnValue(query)
      getService.executeQuery.mockResolvedValue(result)

      await show(req, res, next)

      expect(getService.buildQuery).toHaveBeenCalledWith(req.params)
      expect(getService.executeQuery).toHaveBeenCalledWith(query)
      expect(res.json).toHaveBeenCalledWith(result)
    })

    it("should call next with the error if an error occurs", async () => {
      const req = { params: { id: "123" } }
      const res = { json: jest.fn() }
      const next = jest.fn()
      const error = new Error("Test Error")

      getService.buildQuery.mockReturnValue({})
      getService.executeQuery.mockRejectedValue(error)

      await show(req, res, next)

      expect(next).toHaveBeenCalledWith(error)
    })

    it("should call next with an error if no matching document is found", async () => {
      const req = { params: { id: "123" } }
      const res = { json: jest.fn() }
      const next = jest.fn()

      getService.buildQuery.mockReturnValue({})
      getService.executeQuery.mockResolvedValue(null)

      await show(req, res, next)

      expect(next).toHaveBeenCalledWith(new Error("No matching document"))
    })
  })
})
