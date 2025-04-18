const walletModel = require('../models/walletModel')
const cartModel = require("../models/cartModal")


const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user_id
        const wallet = await walletModel.findOne({ userId: userId })

        wallet?.transactions?.sort((a, b) => b.date - a.date)

        const page = req.query.page || 1 
        const limit = 10 
        const skip = (page - 1) * limit

        const totalCount = wallet?.transactions?.length
        const totalPages = Math.ceil(totalCount / limit)

        const paginatedTransactions = wallet?.transactions?.slice(
            skip,
            skip + limit
        )
        const cart = await cartModel.findOne({ userId: userId })

       

        res.render('wallet', {
            wallet,
            cart,
            transactions: paginatedTransactions,
            currentPage: page,
            totalPages,
            isLoggedIn:true

        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}


module.exports = {
    loadWallet
}