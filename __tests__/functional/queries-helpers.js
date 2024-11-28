const { MongoClient } = require("mongodb")

module.exports = {
  dbSetup: async () => {
    const connection = await MongoClient.connect(globalThis.__MONGO_URI__)
    const db = await connection.db(globalThis.__MONGO_DB_NAME__)

    await db.createCollection("indexed_services")
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
      "service_at_locations.location.geometry": "2dsphere",
    })
    await db.collection("indexed_services").createIndex({
      "taxonomies.slug": 1,
    })

    return { connection, db }
  },
  singleService: ({ id, name } = {}) => {
    return {
      _id: id ?? 1,
      id: id ?? 1,
      name: name ?? "Test Service",
      visible_from: null,
      visible_to: null,
    }
  },
  noResults: {
    number: 1,
    size: 0,
    totalPages: 0,
    totalElements: 0,
    first: true,
    last: false,
    perPage: 50,
    interpreted_location: undefined,
    content: [],
  },
}
