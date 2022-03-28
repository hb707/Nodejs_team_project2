const express = require('express')
const userRouter = require('./user/userRouter.js')
const boardRouter = require('./board')
const chatRouter = require('./chat')
const searchRouter = require('./search')
const router = express.Router()

router.get('/', (req, res) => {
    res.render('index.html')
})

router.use('/user', userRouter)
router.use('/board', boardRouter)
router.use('/chat', chatRouter)
router.use('/search', searchRouter)

module.exports = router

