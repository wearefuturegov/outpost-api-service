const express = require("express")
const sslRedirect = require("heroku-ssl-redirect")
const cors = require("cors")
const { connect } = require("./db")
const routes = require("./routes")
const rateLimit  = require("express-rate-limit")

const server = express()

require("dotenv").config()

connect(() => console.log("Database connection established"))

server.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}))
server.use(sslRedirect())
server.use(cors())
server.use("/api/v1/", routes)

const port = process.env.PORT || 4000
server.listen(port, () => console.log(`✅ Listening on port ${port}`))