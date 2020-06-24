const { Router }  = require("express")
const router = Router()
const controller = require("../controllers")

router.get("/services", controller.index)
router.get("/services/:id", controller.show)

router.use((err, req, res, next) => {
    console.error(err)
    if(err.message === "No matching document"){
        res.status(404).json({
            error: "No matching document"
        })
    } else {
        res.status(500).json({
            error: process.env.NODE_ENV === "production" ? "There was an internal server error. Please try again later" : err.message
        })
    }
})

router.use("*", (req, res, next)=>{
    res.status(404).json({
        error: "No route matches your request"
    })
})

module.exports = router