// loading environment variables from .env file
if (process.env.NODE_ENV !== 'production') require('dotenv').config()
// connecting to mongodb server
require('./config/database')
// mongoose models
require('./models')

const path = require('path')

const cors = require('cors')
const express = require('express')

// routes
const {
    authRoutes,
    listingRoutes,
    messageRoutes,
    notificationsRoutes,
    userRoutes,
} = require('./routes')

const app = express()

app.use('/assets', express.static(path.resolve(__dirname, 'assets')))

// setup cors
app.use(cors())
// using express's bodyparser implementation
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
// using multer to store files
app.use(require('./config/storage'))

app.use('/api', authRoutes)
app.use('/api/listings', listingRoutes)
app.use('/api/user', userRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/messages', messageRoutes)

// 404 - Not Found route handler
app.use((req, res) => {
    res.status(404).json({ message: `${req.url} not found` })
})

// custom error middleware
app.use((error, req, res, next) => {
    const code = error.code || 500
    const message = error.message || 'Something went wrong, please try again'
    res.status(code).json({ message })
})

app.listen(process.env.PORT, process.env.HOST_IP, () =>
    console.log(`go to http://${process.env.HOST_IP}:${process.env.PORT}`)
)
