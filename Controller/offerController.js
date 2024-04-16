const offerModel = require('../models/offer')
const productModel = require('../models/productModel')
const categoryModal = require('../models/categoryModel')

const offer = async (req, res) => {
    try {
        const offer = await offerModel.find({})
        res.render('offer', { offer })
    } catch (error) {
        console.log(error)
    }
}

const addOffer = async (req, res) => {
    try {
        const { offerName, offerPercentage, startDate, endDate } = req.body
        const uppercaseName = offerName.toUpperCase()
        const isOfferNameExist = await offerModel.findOne({
            name: uppercaseName,
        })
        if (!isOfferNameExist) {
            const offer = new offerModel({
                name: uppercaseName,
                percentage: offerPercentage,
                startDate: startDate,
                endDate: endDate,
            })
            await offer.save()
            res.json({ success: true })
        } else {
            res.json({ alreadyExist: 'offer already Exist' })
        }
    } catch (error) {
        console.error(error)
    }
}

const applyOffer = async (req, res) => {
    try {
        const { categoryId, selectedOfferId } = req.body
        await categoryModal.updateOne(
            { _id: categoryId },
            { $set: { offer: selectedOfferId } }
        )
        const products = await productModel
            .find({})
            .populate({
                path: 'subcategory_id',
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')

        let sellingPrice // Define sellingPrice outside the loop

        products.forEach((product) => {
            let price = product?.price // Initialize price with default value
            const productId = product?._id
            const productName = product?.name
            if (
                (product?.subcategory_id?.offer &&
                    product?.subcategory_id?.offer?.status) ||
                (product?.offer && product?.offer?.status)
            ) {
                let categoryOfferPrice = undefined // Initialize with undefined
                let productOfferPrice = undefined // Initialize with undefined

                if (
                    product?.subcategory_id?.offer &&
                    product?.subcategory_id?.offer?.status
                ) {
                    categoryOfferPrice =
                        product?.price -
                        (product?.price *
                            product?.subcategory_id?.offer?.percentage) /
                            100
                }

                if (product?.offer && product?.offer?.status) {
                    productOfferPrice =
                        product?.price -
                        (product?.price * product?.offer?.percentage) / 100
                }
                // Check if either offer price is defined
                if (
                    categoryOfferPrice !== undefined ||
                    productOfferPrice !== undefined
                ) {
                    // Handle the case where either offer price is undefined
                    if (categoryOfferPrice === undefined) {
                        price = productOfferPrice
                    } else if (productOfferPrice === undefined) {
                        price = categoryOfferPrice
                    } else {
                        // Both offer prices are defined, choose the lower one
                        price = Math.min(categoryOfferPrice, productOfferPrice)
                    }
                }
            }
            // Assign the calculated price to sellingPrice for each product
            sellingPrice = price
            async function updateSellingPrice() {
                const product = await productModel
                    .updateMany(
                        { _id: productId, subcategory_id: categoryId },
                        { $set: { sellingPrice: sellingPrice } }
                    )
                    .populate('subcategory_id')
            }
            updateSellingPrice()

         
        })

        // await productModel.updateMany({},{set:{sellingPrice:sellingPrice}})
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

const deleteOffer = async (req, res) => {
    try {
        const { offerId } = req.body
        await offerModel.deleteOne({ _id: offerId })
        // await productModel.updateMany({offer:offerId},{$unset:{offer:"",sellingPrice:""}})

        const offer = await productModel
            .find({ subcategory_id: { $exists: true } }) // Filter where subcategory_id is not null
            .populate({
                path: 'subcategory_id',
                match: { offer: offerId },
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')

        const filteredOffers = offer.filter(
            (offer) => offer.subcategory_id !== null
        )

        const filteredOfferIds = filteredOffers.map((offer) => offer._id)

        await productModel.updateMany(
            { _id: { $in: filteredOfferIds } }, // Filter by IDs of filtered documents
            { $unset: { sellingPrice: '' } } // Unset the selling price field
        )

        await categoryModal.updateMany(
            { offer: offerId },
            { $unset: { offer: '' } }
        )
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

const loadEditOffer = async (req, res) => {
    try {
        const { offerid } = req.query

        const offer = await offerModel.findOne({ _id: offerid })

        res.json({ offer })
    } catch (error) {
        console.error(error)
    }
}

const editOffer = async (req, res) => {
    try {
        const { offerid } = req.query

        const { name, percentage, startDate, endDate } = req.body
        const nameToUpper = name.toUpperCase()

        const isExist = await offerModel.findOne({ name: nameToUpper })

       
            const offer = await offerModel.updateOne(
                { _id: offerid },
                {
                    $set: {
                        name: nameToUpper,
                        percentage: percentage,
                        startDate: startDate,
                        endDate: endDate,
                    },
                }
            )
            res.json({ success: true })
        
    } catch (error) {
        console.error(error)
    }
}

const removeOffer = async (req, res) => {
    try {
        const { categoryId } = req.body
        await categoryModal.updateOne(
            { _id: categoryId },
            { $unset: { offer: '' } }
        )

        const products = await productModel
            .find({})
            .populate({
                path: 'subcategory_id',
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')

        let sellingPrice // Define sellingPrice outside the loop

        products.forEach((product) => {
            let price = product?.price // Initialize price with default value
            const productId = product?._id
            const productName = product?.name
            let categoryOfferPrice
            let productOfferPrice
            if (
                (product?.subcategory_id?.offer &&
                    product?.subcategory_id?.offer?.status) ||
                (product?.offer && product?.offer?.status)
            ) {
                categoryOfferPrice = undefined // Initialize with undefined
                productOfferPrice = undefined // Initialize with undefined

                if (
                    product?.subcategory_id?.offer &&
                    product?.subcategory_id?.offer?.status
                ) {
                    categoryOfferPrice =
                        product?.price -
                        (product?.price *
                            product?.subcategory_id?.offer?.percentage) /
                            100
                }

                if (product?.offer && product?.offer?.status) {
                    productOfferPrice =
                        product?.price -
                        (product?.price * product?.offer?.percentage) / 100
                }

                // Check if either offer price is defined
                if (
                    categoryOfferPrice !== undefined ||
                    productOfferPrice !== undefined
                ) {
                    // Handle the case where either offer price is undefined
                    if (categoryOfferPrice === undefined) {
                        price = productOfferPrice
                    } else if (productOfferPrice === undefined) {
                        price = categoryOfferPrice
                    } else {
                        // Both offer prices are defined, choose the lower one
                        price = Math.min(categoryOfferPrice, productOfferPrice)
                    }
                }
            }
            // Assign the calculated price to sellingPrice for each product
            sellingPrice = price
            async function updateSellingPrice() {
                if (!productOfferPrice && !categoryOfferPrice) {
                    await productModel.updateMany(
                        { _id: productId },
                        { $unset: { sellingPrice: '' } }
                    )
                } else if (productOfferPrice || categoryOfferPrice) {
                    await productModel.updateMany(
                        { _id: productId },
                        { $set: { sellingPrice: sellingPrice } }
                    )
                }
            }
            updateSellingPrice()

           
        })

        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

const applyProductOffer = async (req, res) => {
    try {
        const { productId, selectedOfferId } = req.body
        await productModel.updateOne(
            { _id: productId },
            { $set: { offer: selectedOfferId } }
        )

        const products = await productModel
            .find({ _id: productId })
            .populate({
                path: 'subcategory_id',
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')

        let sellingPrice // Define sellingPrice outside the loop

        products.forEach((product) => {
            let price = product?.price // Initialize price with default value
            const productId = product?._id
            const productName = product?.name
            if (
                (product?.subcategory_id?.offer &&
                    product?.subcategory_id?.offer?.status) ||
                (product?.offer && product?.offer?.status)
            ) {
                let categoryOfferPrice = undefined // Initialize with undefined
                let productOfferPrice = undefined // Initialize with undefined

                if (
                    product?.subcategory_id?.offer &&
                    product?.subcategory_id?.offer?.status
                ) {
                    categoryOfferPrice =
                        product?.price -
                        (product?.price *
                            product?.subcategory_id?.offer?.percentage) /
                            100
                }

                if (product?.offer && product?.offer?.status) {
                    productOfferPrice =
                        product?.price -
                        (product?.price * product?.offer?.percentage) / 100
                }

                // Check if either offer price is defined
                if (
                    categoryOfferPrice !== undefined ||
                    productOfferPrice !== undefined
                ) {
                    // Handle the case where either offer price is undefined
                    if (categoryOfferPrice === undefined) {
                        price = productOfferPrice
                    } else if (productOfferPrice === undefined) {
                        price = categoryOfferPrice
                    } else {
                        // Both offer prices are defined, choose the lower one
                        price = Math.min(categoryOfferPrice, productOfferPrice)
                    }
                }
            }
            // Assign the calculated price to sellingPrice for each product
            sellingPrice = price
            async function updateSellingPrice() {
                await productModel.updateOne(
                    { _id: productId },
                    { $set: { sellingPrice: sellingPrice } }
                )
            }
            updateSellingPrice()

           
        })

        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body
        await productModel.updateOne(
            { _id: productId },
            { $unset: { offer: '' } }
        )
        const products = await productModel
            .find({_id:productId})
            .populate({
                path: 'subcategory_id',
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')

        let sellingPrice // Define sellingPrice outside the loop

        products.forEach((product) => {
            let price = product?.price // Initialize price with default value
            const productId = product?._id
            const productName = product?.name
            let categoryOfferPrice
            let productOfferPrice
            if (
                (product?.subcategory_id?.offer &&
                    product?.subcategory_id?.offer?.status) ||
                (product?.offer && product?.offer?.status)
            ) {
                categoryOfferPrice = undefined // Initialize with undefined
                productOfferPrice = undefined // Initialize with undefined

                if (
                    product?.subcategory_id?.offer &&
                    product?.subcategory_id?.offer?.status
                ) {
                    categoryOfferPrice =
                        product?.price -
                        (product?.price *
                            product?.subcategory_id?.offer?.percentage) /
                            100
                }

                if (product?.offer && product?.offer?.status) {
                    productOfferPrice =
                        product?.price -
                        (product?.price * product?.offer?.percentage) / 100
                }

                // Check if either offer price is defined
                if (
                    categoryOfferPrice !== undefined ||
                    productOfferPrice !== undefined
                ) {
                    // Handle the case where either offer price is undefined
                    if (categoryOfferPrice === undefined) {
                        price = productOfferPrice
                    } else if (productOfferPrice === undefined) {
                        price = categoryOfferPrice
                    } else {
                        // Both offer prices are defined, choose the lower one
                        price = Math.min(categoryOfferPrice, productOfferPrice)
                    }
                }
            }
            // Assign the calculated price to sellingPrice for each product
            sellingPrice = price
            //   async function updateSellingPrice(){
            //       await productModel.updateOne(
            //           { _id: productId },
            //           { $set: { sellingPrice: sellingPrice } }
            //       )
            //   }
            //   updateSellingPrice()

            async function updateSellingPrice() {
                if (!productOfferPrice && !categoryOfferPrice) {
                    await productModel.updateMany(
                        { _id: productId },
                        { $unset: { sellingPrice: '' } }
                    )
                } else if (productOfferPrice || categoryOfferPrice) {
                    await productModel.updateMany(
                        { _id: productId },
                        { $set: { sellingPrice: sellingPrice } }
                    )
                }
            }
            updateSellingPrice()

        })

        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    offer,
    addOffer,
    applyOffer,
    deleteOffer,
    loadEditOffer,
    editOffer,
    removeOffer,
    applyProductOffer,
    removeProductOffer,
}
