

const cartModal = require("../models/cartModal")


const loadCart = async (req, res) => {
    try {
        const userId = req.session.user_id
        // const cart = await cartModal.findOne({userId:userId}).populate("product.productId")
        const cart = await cartModal.findOne({ userId: userId }).populate({
            path: 'product',
            populate: [
                {
                    path: 'productId',
                    model: 'products',
                    populate: {
                        path: 'offer',
                        model: 'offer',
                    },
                },
                {
                    path: 'productId',
                    model: 'products',
                    populate: {
                        path: 'subcategory_id',
                        model: 'Category',
                        populate: {
                            path: 'offer',
                            model: 'offer',
                        },
                    },
                },
            ],
        })

        if (cart && cart.product) {
            for (const item of cart.product) {
                const quantity = item.quantity
                // const productPrice = item.productId.price; // Assuming "price" is the field in your product schema containing the product price
                const productPrice = item.price
                const total = quantity * productPrice

                // Update the total for the current product in the cart
                await cartModal.updateOne(
                    { userId: userId, 'product.productId': item.productId },
                    { $set: { 'product.$.total': total } }
                )
            }
        }

        const find = await cartModal
            .findOne({ userId: userId })
            .populate('product.productId')

        const subtotal = await cartModal.aggregate([
            {
                $match: {
                    $expr: { $eq: ['$userId', { $toObjectId: userId }] },
                },
            },
            { $group: { _id: { subTotal: { $sum: '$product.total' } } } },
        ])

        const cartSubtotal = subtotal[0]?._id?.subTotal
        await cartModal.updateOne(
            { userId: userId },
            { $set: { subTotal: cartSubtotal } }
        )
        const subTotal = await cartModal.findOne({ userId: userId })

        res.render('cart', { find, subTotal })
    } catch (error) {
        console.error(error)
    }
}

const addTocart = async (req, res) => {
    try {
        const userId = req.session.user_id
        const { productPrice, productId } = req.body
        const price = parseInt(productPrice)
        let userCart = await cartModal.findOne({ userId: userId })
        // console.log(price);
        if (!userCart) {
            userCart = new cartModal({
                userId: userId,
                product: [
                    {
                        productId: productId,
                        price: price,
                        total: price,
                    },
                ],
                subTotal: price,
            })
            await userCart.save()
            res.status(200).json({
                success: true,
                message: 'Item added/updated to cart successfully',
            })
        } else {
            const find = await cartModal.find({userId:userId,
                'product.productId': productId,
            })
            const subtotal = await cartModal.aggregate([
                {
                    $match: {
                        $expr: { $eq: ['$userId', { $toObjectId: userId }] },
                    },
                },
                { $group: { _id: { subTotal: { $sum: '$product.total' } } } },
            ])

            const cartSubtotal = subtotal[0]?._id?.subTotal

            if (find.length == 0) {
                await cartModal.updateOne(
                    { userId: userId },
                    {
                        $push: {
                            product: {
                                productId: productId,
                                price: price,
                                total: price,
                            },
                        },
                    }
                )
                const subtotal = await cartModal.aggregate([
                    {
                        $match: {
                            $expr: {
                                $eq: ['$userId', { $toObjectId: userId }],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: { subTotal: { $sum: '$product.total' } },
                        },
                    },
                ])

                const cartSubtotal = subtotal[0]?._id?.subTotal
                await cartModal.updateOne(
                    { userId: userId },
                    { $set: { subTotal: cartSubtotal } }
                )

                res.status(200).json({
                    success: true,
                    message: 'Item added/updated to cart successfully',
                })
            } else {
                res.status(200).json({
                    success: true,
                    message: 'Item added/updated to cart successfully',
                })
            }
        }
    } catch (error) {
        console.error('Error adding to cart:', error)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        })
    }
}

const updateCart = async (req, res) => {
    try {
        const id = req.session.user_id
        const { productId, quantity, productPrice } = req.body

        const total = quantity * productPrice
        let warningMsg

        await cartModal.updateOne(
            { userId: id, 'product.productId': productId },
            {
                $set: {
                    'product.$.quantity': quantity,
                    'product.$.total': total,
                },
            }
        )
        const subtotal = await cartModal.aggregate([
            { $match: { $expr: { $eq: ['$userId', { $toObjectId: id }] } } },
            { $group: { _id: { subTotal: { $sum: '$product.total' } } } },
        ])

        const cartSubtotal = subtotal[0]?._id?.subTotal
        await cartModal.updateOne(
            { userId: id },
            { $set: { subTotal: cartSubtotal } }
        )
        const find = await cartModal
            .findOne({ userId: id })
            .populate('product.productId')
        const subTotal = find.subTotal
        const productItem = find?.product?.find(
            (item) => item.productId._id == productId
        )
        const f = await cartModal
            .findOne({ userId: id })
            .populate('product.productId')
        if (productItem && productItem.productId.quantity == quantity) {
            warningMsg = true
        } else {
            warningMsg = false
        }
        res.json({ success: true, total, subTotal, warningMsg })
    } catch (error) {
        console.error(error)
    }
}

const removeItem = async (req, res) => {
    try {
        const id = req.session.user_id
        const { productId } = req.body
        await cartModal.updateOne(
            { userId: id },
            { $pull: { product: { productId: productId } } }
        )
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}


module.exports = {
    loadCart,
    addTocart,
    updateCart,
    removeItem
}