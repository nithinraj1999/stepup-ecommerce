const walletModel = require('../models/walletModel')
const userModel = require('../models/userModel')
const orderModal = require('../models/orderModel')






const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user_id
        const find = await userModel.findOne({ _id: userId })
        const wallet = await walletModel.findOne({ userId: userId })

        // Sort wallet transactions by date in descending order
        wallet.transactions.sort((a, b) => b.date - a.date)

        const page = req.query.page || 1 // Get page number from query parameter
        const limit = 10 // Number of transactions per page
        const skip = (page - 1) * limit

        const totalCount = wallet.transactions.length
        const totalPages = Math.ceil(totalCount / limit)

        const paginatedTransactions = wallet.transactions.slice(
            skip,
            skip + limit
        )
        const cart = await cartModal.findOne({ userId: userId })

        const orders = await orderModal
            .find({ userId: userId })
            .populate({
                path: 'products',
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
            .sort({ _id: -1 })

        res.render('wallet', {
            find,
            orders,
            wallet,
            cart,
            transactions: paginatedTransactions,
            currentPage: page,
            totalPages,
        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}


module.exports = {
    loadWallet
}