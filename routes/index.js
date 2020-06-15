const { Router }  = require("express")
const router = Router()
const controller = require("../controllers")

router.get("/services", controller.index)
router.get("/services/:id", controller.show)

router.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({
        error: err.message
    })
})

module.exports = router