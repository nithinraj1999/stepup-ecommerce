const mongoose = require('mongoose')

const orderSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    order_id: {
        type: String,
        required: true,
    },
    products: [
        {
            name: {
                type: String,
                required: true,
            },
            manufacturer: {
                type: String,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            total: {
                type: Number,
                required: true,
            },
            productImage: {
                type: String,
                required: true,
            },
            orderStatus: {
                type: String,
                default: 'Placed',
            },
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
                required: true,
            },
            reason: {
                type: String,
                default: ' ',
            },
        },
    ],
    addressId: {
        type: String,
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    orderDate: {
        type: Date,
        default: Date.now, 
    },
    subTotal: {
        type: Number,
        required: true,
    },
})

module.exports = mongoose.model('Order', orderSchema)
