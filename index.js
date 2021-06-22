require("dotenv").config()
const express = require("express")
const sslRedirect = require("heroku-ssl-redirect")
const rateLimit  = require("express-rate-limit")
const cors = require("cors")
const { connect } = require("./db")
const routes = require("./routes")

const server = express()

connect(() => console.log("📡 Database connection established"))

server.set('trust proxy', 1)
server.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
}))
server.use(sslRedirect())
server.use(cors())
server.use("/api/v1/", routes)

const port = process.env.PORT || 5000
server.listen(port, () => console.log(`✅ Listening on port ${port}`))
