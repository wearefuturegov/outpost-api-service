const express = require("express")
const cors = require("cors")
const { connect } = require("./db")
const routes = require("./routes")

const server = express()

require("dotenv").config()

connect(() => console.log("Database connection established"))

server.use(sslRedirect())
server.use(cors())
server.use("/api/v1/", routes)

const port = process.env.PORT || 4000
server.listen(port, () => console.log(`✅ Listening on port ${port}`))