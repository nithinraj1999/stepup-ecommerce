const walletModel = require('../models/walletModel')
const userModel = require('../models/userModel')
const orderModal = require('../models/orderModel')
const cartModal = require("../models/cartModal")





const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user_id
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

       

        res.render('wallet', {
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