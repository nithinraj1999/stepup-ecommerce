const wishListModel = require('../models/wishListModel')
const cartModal = require('../models/cartModal')



const addToWishList = async (req, res) => {
    try {
        const userId = req.session.user_id
        const { productId } = req.body
        const wishList = await wishListModel.findOne({ userId: userId })
        if (!wishList) {
            const wishList = new wishListModel({
                userId: userId,
                product: [
                    {
                        productId: productId,
                    },
                ],
            })

            await wishList.save()
        } else {
            const isProductExists = wishList.product.find((item) =>
                item.productId.equals(productId)
            )
            if (!isProductExists) {
                await wishListModel.updateOne(
                    { userId: userId },
                    { $push: { product: { productId: productId } } }
                )
            } else {
                await wishListModel.updateOne(
                    { userId: userId },
                    { $pull: { product: { productId: productId } } }
                )
            }
        }

        const find = await wishListModel.findOne({ userId: userId })
        const checkIsThereProductID = find.product.find((item) =>
            item.productId.equals(productId)
        )

        res.json({ success: true, checkIsThereProductID })
    } catch (error) {
        console.error(error)
    }
}

const loadWishList = async (req, res) => {
    try {
        let isLoggedIn = req.session.user_id ? true : false
        const userId = req.session.user_id
        const wishList = await wishListModel
            .findOne({ userId: userId })
            .populate('product.productId')
        const cart = await cartModal.findOne({ userId: userId })

        res.render('wishList', { wishList, isLoggedIn, cart })
    } catch (error) {
        console.error(error)
    }
}

const removeWishList = async (req, res) => {
    try {
        const userId = req.session.user_id
        const { productId } = req.body
        await wishListModel.updateOne(
            { userId: userId },
            { $pull: { product: { productId: productId } } }
        )

        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    addToWishList,
    loadWishList,
    removeWishList

}