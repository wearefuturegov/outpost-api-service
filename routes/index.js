const { Router }  = require("express")
const rateLimit  = require("express-rate-limit")
const router = Router()
const controller = require("../controllers")

router.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: {
        error: "You made too many requests. Try again later."
    }
}))

router.get("/services", controller.index)
router.get("/services/:id", controller.show)

router.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({
        error: err.message
    })
})

module.exports = router