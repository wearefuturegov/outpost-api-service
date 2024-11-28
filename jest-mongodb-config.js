// https://github.com/typegoose/mongodb-memory-server#available-options
module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: "7.0.14",
      skipMD5: true,
    },
    instance: {
      dbName: "outpost_api_development",
    },
    autoStart: false,
  },
}
