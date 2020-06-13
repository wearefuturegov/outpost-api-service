const { connect } = require("../db")

connect(async db => {
    await db.collection("indexed_services").createIndex({ 
        "service.name": "text", 
        "service.description": "text" 
    })
    await db.collection("indexed_services").createIndex({ 
        "location.geometry": "2dsphere"
    })
    console.log("✅ Indices created successfully")
})