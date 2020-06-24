const { connect } = require("../db")

connect(async db => {
    try{
        await db.collection("indexed_services").createIndex({ 
            name: "text", 
            description: "text" 
        })
        await db.collection("indexed_services").createIndex({ 
            "locations.geometry": "2dsphere"
        })
        await db.collection("indexed_services").createIndex({ 
            "taxonomies.slug": 1
        })
        console.log("✅ Indices created successfully")
        process.exit()
    } catch(e){
        console.log(e)
    }
})