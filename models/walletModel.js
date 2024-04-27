const mongoose  = require("mongoose")

const walletSchema = mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    balance:{
        type:Number,
        default:0
    },
    transactions:[{
        date:{
            type:Date,
            default:Date.now
        },
        amount:{
            type:Number,
            required:true
        },
        type:{
            type:String,
           default:"Credit"
        }
    }]
})

module.exports = mongoose.model("wallet",walletSchema)
