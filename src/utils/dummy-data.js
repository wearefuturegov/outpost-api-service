require("dotenv").config()
const { connect } = require("../db")
const logger = require("./logger")

connect(async db => {
  //  @TODO make sure when we do this we do it on the right db!
  const collections = await db
    .listCollections({ name: "indexed_services" }, { nameOnly: true })
    .toArray()

  const indexedServicesDb = collections.some(a => a.name === "indexed_services")

  if (indexedServicesDb) {
    try {
      await db.collection("indexed_services").insertMany([
        {
          id: 1,
          updated_at: {
            $date: "2022-07-01T20:14:55.847Z",
          },
          name: "Ligula Mattis Dolor",
          description:
            "Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.",
          url: "http://outpost-platform.wearefuturegov.com/",
          min_age: 0,
          max_age: 100,
          age_band_under_2: null,
          age_band_2: null,
          age_band_3_4: null,
          age_band_5_7: null,
          age_band_8_plus: null,
          age_band_all: null,
          needs_referral: true,
          free: null,
          created_at: {
            $date: "2022-07-01T20:14:54.546Z",
          },
          status: "published",
          target_directories: [],
          locations: [
            {
              id: 1,
              name: "Location 1",
              address_1: null,
              city: "London",
              state_province: "",
              postal_code: "EC1",
              country: "GB",
              geometry: {
                type: "Point",
                coordinates: [-0.2664017, 51.5285262],
              },
              mask_exact_address: true,
              accessibilities: [],
            },
          ],
          contacts: [],
          meta: [],
          organisation: {
            id: 1,
            name: "Organisation 1",
            description: null,
            email: null,
            url: null,
          },
          taxonomies: [
            {
              id: 1,
              name: "Taxonomy 1",
              slug: "taxonomy-1",
              parent_id: null,
            },
          ],
          regular_schedules: [],
          cost_options: [],
          links: [
            {
              label: "Facebook",
              url: "https://www.facebook.com",
            },
          ],
          send_needs: [],
          suitabilities: [],
          local_offer: null,
        },
      ])
      logger.info("✅ Added dummy data to 'indexed_services' collection")
      process.exit()
    } catch (e) {
      logger.error(e)
      throw e
    }
  } else {
    logger.warn("🚫 'indexed_services' collection doesn't exist yet")
    process.exit()
  }
})
