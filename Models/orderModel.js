const mongoose = require("mongoose")


const orderSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    products: [{
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
    }],
    subTotal: {
        type: Number,
        required: true,
    }
});
module.exports = mongoose.model("Order",orderSchema)