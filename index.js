require("dotenv").config()
const express = require("express")
const forceSSL = require("express-force-ssl")
const rateLimit = require("express-rate-limit")
const cors = require("cors")
const morganMiddleware = require("./middleware/morgan.middleware")
const logger = require("./utils/logger")
const { connect } = require("./src/db")
const v1 = require("./src/controllers/v1")

const router = express.Router()
const server = express()
const port = process.env.PORT || 3000
const environment = process.env.NODE_ENV || "production"
const isDevelopment = environment === "development"

/**
 * Create the initial database connection here
 */
connect(() =>
  logger.info(
    `📡 Database connection established http${
      !isDevelopment ? "s" : ""
    }://localhost:${port}/api/v1/services`
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

server.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
)

server.use(cors())
server.use(morganMiddleware)

/**
 * Routes
 */

server.get("/api/v1/services", v1.services.index)
server.get("/api/v1/services/:id", v1.services.show)

server.get("/health", (req, res) => {
  const data = {
    uptime: process.uptime(),
    message: "Ok",
    date: new Date(),
  }

  res.status(200).send(data)
})

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
  logger.info(`Server is running on port ${port}`)
  logger.info(`Logging level is set to ${logger.level}`)
})
