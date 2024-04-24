require("dotenv").config()
const { connect } = require("../src/db")
const logger = require("./logger")

connect(async db => {
  try {
    await db.collection("indexed_services").createIndex(
      {
        name: "text",
        description: "text",
      },
      {
        weights: {
          name: 5,
          description: 1,
        },
      }
    )
    await db.collection("indexed_services").createIndex({
      "locations.geometry": "2dsphere",
    })
    await db.collection("indexed_services").createIndex({
      "taxonomies.slug": 1,
    })
    logger.info("✅ Indices created successfully")
    process.exit()
  } catch (e) {
    logger.error(e)
  }
})
