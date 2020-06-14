const { connect } = require("../db")

connect(async db => {
    await db.collection("indexed_services").createIndex({ 
        name: "text", 
        description: "text" 
    })
    await db.collection("indexed_services").createIndex({ 
        "locations.geometry": "2dsphere"
    })
    console.log("✅ Indices created successfully")
})