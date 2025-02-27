require("dotenv").config()
const express = require("express")
const forceSSL = require("express-force-ssl")
const rateLimit = require("express-rate-limit")
const swaggerUi = require("swagger-ui-express")
const swaggerJsdoc = require("swagger-jsdoc")
const cors = require("cors")
const morganMiddleware = require("./middleware/morgan.middleware")
const logger = require("./utils/logger")
const { connect } = require("./src/db")
const routes = require("./src/routes/routes")

const server = express()
const port = process.env.PORT || 3000
const host_port = process.env.HOST_PORT || process.env.PORT || 3000
const environment = process.env.NODE_ENV || "production"
const isDevelopment = environment === "development"

/**
 * Create the initial database connection here
 */
connect(() =>
  logger.info(
    `📡 Database connection established http${
      !isDevelopment ? "s" : ""
    }://localhost:${host_port}/api/v1/services`
  )
)

/**
 * Settings & middleware
 */
server.set("trust proxy", 1)

// outside of dev environment if we send FORCE_SSL then SSL is forced
if (!isDevelopment) {
  if (process.env.FORCE_SSL && process.env.FORCE_SSL.toLowerCase() === "true") {
    server.use(forceSSL)
  }
}

server.use(cors())
server.use(morganMiddleware)

server.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: process.env.RATE_LIMIT ?? 100, // limit each IP to 100 requests per 1-minute window.
    message: "Too many requests from this IP, please try again after a minute",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) =>
      res.status(options.statusCode).json({
        error: options.message,
      }),
  })
)

/**
 * Swagger
 */

const swaggerJsdocOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Outpost API Service",
      version: "1.0.0",
      description:
        "The Outpost service API is a RESTful API that provides access to the services in the Outpost Platform",
      version: "1.0.0",
      contact: {
        name: "Outpost API service",
        url: "https://github.com/wearefuturegov/outpost-api-service",
      },
    },
    externalDocs: {
      description: "Find out more about the Outpost Platform",
      url: "https://outpost-platform.wearefuturegov.com/",
    },
    tags: [
      {
        name: "Services",
        description: "Services and events",
        externalDocs: {
          description: "Find out more",
          url: "https://developers.openreferraluk.org/Guidance/",
        },
      },
      {
        name: "Utilities",
        description: "Utilities and helpers",
      },
    ],
  },
  apis: ["./src/routes/*.js", "./src/routes/*.yml"],
  failOnErrors: true,
}

const openapiSpecification = swaggerJsdoc(swaggerJsdocOptions)

var options = {
  swaggerOptions: {
    // validatorUrl: null,
  },
}
server.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openapiSpecification, options)
)
server.get("/schema.json", (req, res) => {
  // And here we go, we serve it.
  res.setHeader("Content-Type", "application/json")
  res.send(openapiSpecification)
})

/**
 * Routes
 */

routes.setup(server)

// 404
server.use("*", (req, res, next) => {
  res.status(404).json({
    error: "No route matches your request",
  })
})

// Error handling
server.use((err, req, res, next) => {
  logger.error(err.stack)
  if (err.message === "No matching document") {
    res.status(404).json({
      error: "No matching document",
    })
  } else {
    res.status(500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "There was an internal server error. Please try again later"
          : err.message,
    })
  }
})

/**
 * Start the server
 */
server.listen(port, () => {
  logger.info(`Server is running on port ${host_port}`)
  logger.info(`Logging level is set to ${logger.level}`)
})
