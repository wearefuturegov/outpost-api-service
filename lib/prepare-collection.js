require("dotenv").config()
const { connect } = require("../db")

connect(async db => {
  const collections = await db
    .listCollections({ name: "indexed_services" }, { nameOnly: true })
    .toArray()

  const indexedServicesDb = collections.some(a => a.name === "indexed_services")

  if (!indexedServicesDb) {
    try {
      await db.createCollection("indexed_services")
      console.log("✅ 'indexed_services' Collection created successfully")
      process.exit()
    } catch (e) {
      console.log(e)
      throw e
    }
  } else {
    console.log("✅ 'indexed_services' Collection already exists")
    process.exit()
  }
})
