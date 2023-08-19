require("dotenv").config()
const express = require("express")
const forceSSL = require("express-force-ssl")
const rateLimit = require("express-rate-limit")
const cors = require("cors")
const { connect } = require("./db")
const routes = require("./routes")

const server = express()
const port = process.env.NODE_PORT || 3001
const environment = process.env.NODE_ENV
const isDevelopment = environment === "development"

connect(() =>
  console.log(
    `📡 Database connection established http${
      !isDevelopment ? "s" : ""
    }://localhost:${port}/api/v1/services`
  )
)

server.set("trust proxy", 1)

if (!isDevelopment) {
  server.use(forceSSL)
}
server.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
)

server.use(cors())
server.get("/health", (req, res) => {
  const data = {
    uptime: process.uptime(),
    message: "Ok",
    date: new Date(),
  }

  res.status(200).send(data)
})
server.use("/api/v1/", routes)

server.listen(port, () => console.log(`✅ Listening on port ${port}`))
