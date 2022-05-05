const mongoose = require('mongoose')

const {
    generateError,
    saveThumbnails,
    getFilenameFromUrl,
    deleteImages,
} = require('../utility')

// mongoose models
const { LISTING } = require('../models/names')
const Listing = mongoose.model(LISTING)

exports.getListings = async (req, res, next) => {
    try {
        const products = await Listing.find().sort({ createdAt: 'desc' })
        res.status(200).json(products)
    } catch (error) {
        next(error)
    }
}

exports.postListing = async (req, res, next) => {
    try {
        const { categoryId, description, price, title } = req.body
        const imageNames = req.files.map((file) => file.filename)
        const images = req.files.map((file) => ({
            url: `http://${process.env.HOST_IP}:${process.env.PORT}/assets/images/${file.filename}`,
            thumbnail: `http://${process.env.HOST_IP}:${process.env.PORT}/assets/thumbnails/${file.filename}`,
        }))

        await saveThumbnails(imageNames)

        const location = req.body.location
            ? JSON.parse(req.body.location)
            : null

        const product = new Listing({
            categoryId,
            description,
            images,
            price,
            title,
            userId: req.user._id,
        })
        if (location) product.location = location

        await product.save()

        res.status(201).json(product)
    } catch (error) {
        next(error)
    }
}

exports.putListing = async (req, res, next) => {
    try {
        const { id } = req.params

        const { categoryId, description, title, price } = req.body
        const imageNames = req.files.map((file) => file.filename)
        const images = req.files.map((file) => ({
            url: `http://${process.env.HOST_IP}:${process.env.PORT}/assets/images/${file.filename}`,
            thumbnail: `http://${process.env.HOST_IP}:${process.env.PORT}/assets/thumbnails/${file.filename}`,
        }))

        await saveThumbnails(imageNames)

        const location = req.body.location
            ? JSON.parse(req.body.location)
            : null

        const product = await Listing.findById(id)
        if (!product) throw generateError(404, 'listing not found')
        if (product.userId.toString() !== req.user._id.toString())
            throw generateError(
                401,
                'You are not authorized to edit this listing'
            )

        const oldImageNames = product.images.map((image) =>
            getFilenameFromUrl(image.url)
        )
        await deleteImages(oldImageNames)

        if (categoryId) product.categoryId = categoryId
        if (description) product.description = description
        if (price) product.price = price
        if (title) product.title = title
        if (images.length > 0) product.images = images
        if (location) product.location = location

        await product.save()

        res.status(200).json(product)
    } catch (error) {
        next(error)
    }
}

exports.deleteListing = async (req, res, next) => {
    try {
        const { id } = req.params

        const product = await Listing.findById(id)
        if (!product) throw generateError(404, 'listing not found')
        if (product.userId.toString() !== req.user._id.toString())
            throw generateError(
                401,
                'You are not authorized to delete this listing'
            )

        const imageNames = product.images.map((image) =>
            getFilenameFromUrl(image.url)
        )
        await deleteImages(imageNames)

        await product.remove()

        res.status(200).end()
    } catch (error) {
        next(error)
    }
}
