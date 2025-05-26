const orderModel = require('../models/orderModel')

const loadDashBoard = async (req, res) => {
    try {
        const subTotalSum = await orderModel.aggregate([
            { $group: { _id: null, total: { $sum: '$subTotal' } } },
        ])
        const totalRevenue = subTotalSum[0].total
        const totalOrder = await orderModel.find({}).countDocuments()
        const pendingOrdersRequest = await orderModel
            .find({
                products: { $elemMatch: { orderStatus: 'Requested Return' } },
            })
            .countDocuments()
        const totalProductCancelled = await orderModel
            .find({ products: { $elemMatch: { orderStatus: 'Canceled' } } })
            .countDocuments()
        const totalReturnedProducts = await orderModel.aggregate([
            { $unwind: '$products' },
            { $match: { 'products.orderStatus': 'Product Returned' } },
            { $group: { _id: null, count: { $sum: 1 } } },
        ])

        const returnedProductCount =
            totalReturnedProducts.length > 0
                ? totalReturnedProducts[0].count
                : 0

        const placed = await orderModel
            .find({ products: { $elemMatch: { orderStatus: 'Placed' } } })
            .countDocuments()
        const shipped = await orderModel
            .find({ products: { $elemMatch: { orderStatus: 'Shipped' } } })
            .countDocuments()
        const packed = await orderModel
            .find({ products: { $elemMatch: { orderStatus: 'Packed' } } })
            .countDocuments()
        const delivered = await orderModel
            .find({ products: { $elemMatch: { orderStatus: 'Delivered' } } })
            .countDocuments()

        const currentYear = new Date().getFullYear()
        const orders = await orderModel.find({
            orderDate: {
                $gte: new Date(`${currentYear}-01-01`),
                $lte: new Date(`${currentYear}-12-31T23:59:59.999`),
            },
        })

        const monthlyEarnings = Array(12).fill(0)
        orders.forEach((order) => {
            const month = order.orderDate.getMonth()
            monthlyEarnings[month] += order.subTotal
        })

        const topSellingProducts = await orderModel.aggregate([
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.productId',
                    totalQuantity: { $sum: '$products.quantity' },
                },
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            {
                $addFields: {
                    productName: { $arrayElemAt: ['$product.name', 0] },
                },
            },
            {
                $project: {
                    _id: 1,
                    totalQuantity: 1,
                    productName: 1,
                },
            },
        ])

        const topSellingCategories = await orderModel.aggregate([
            { $unwind: '$products' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'product.subcategory_id',
                    foreignField: '_id',
                    as: 'category',
                },
            },
            { $unwind: '$category' },
            {
                $group: {
                    _id: '$category.name',
                    totalQuantity: { $sum: '$products.quantity' },
                },
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 3 },
        ])

        // Find top 10 selling brands
        const totalSalesByBrand = await orderModel.aggregate([
            { $unwind: '$products' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.manufacturer',
                    totalQuantity: { $sum: '$products.quantity' },
                },
            },
            { $sort: { totalQuantity: -1 } },
        ])

        const totalEarnings = monthlyEarnings.reduce(
            (total, earnings) => total + earnings,
            0
        )
        const averageMonthlyEarnings = totalEarnings / 12
        const roundedAverageMonthlyEarnings =
            Math.round(averageMonthlyEarnings * 100) / 100

        res.render('dashboard', {
            totalRevenue,
            totalOrder,
            returnedProductCount,
            totalProductCancelled,
            roundedAverageMonthlyEarnings,
            pendingOrdersRequest,
            placed,
            packed,
            delivered,
            shipped,
            monthlyEarnings,
            topSellingProducts,
            topSellingCategories,
            totalSalesByBrand,
        })
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    loadDashBoard,
}
