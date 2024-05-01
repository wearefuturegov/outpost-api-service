require("dotenv").config()
const { connect } = require("../src/db")
const logger = require("./logger")

connect(async db => {
  //  @TODO make sure when we do this we do it on the right db!
  const collections = await db
    .listCollections({ name: "indexed_services" }, { nameOnly: true })
    .toArray()

  const indexedServicesDb = collections.some(a => a.name === "indexed_services")

  if (!indexedServicesDb) {
    try {
      await db.createCollection("indexed_services")
      logger.info("✅ 'indexed_services' Collection created successfully")
      process.exit()
    } catch (e) {
      logger.error(e)
      throw e
    }
  } else {
    logger.warn("✅ 'indexed_services' Collection already exists")
    process.exit()
  }
})
