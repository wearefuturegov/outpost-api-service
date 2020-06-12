const express = require("express")
const { connect } = require("./db")
const server = express()
const routes = require("./routes")

require("dotenv").config()

connect(() => console.log("Database connection established"))

server.use("/api/v1/", routes)

const port = process.env.PORT || 4000
server.listen(port, () => console.log(`✅ Listening on port ${port}`))