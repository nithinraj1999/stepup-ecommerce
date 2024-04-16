const coupenModel = require('../models/coupenModel')
const cartModal = require("../models/cartModal")



const applyCoupen = async (req, res) => {
    try {
        const userId = req.session.user_id
        const { coupencode } = req.body
        const cart = await cartModal.findOne({ userId: userId })
        const coupen = await coupenModel.findOne({ coupenCode: coupencode })
        const coupenId = coupen._id
        const couponAlreadyUsed = coupen?.users?.find(
            (user) => user.userID == userId
        )
        let subTotal = cart.subTotal

        if (couponAlreadyUsed) {
            res.json({
                success: true,
                alreadyused: true,
                message: 'Coupen Already Used',
                subTotal: subTotal,
            })
        } else { 
            const { discount, validUntill, minPurchaseAmount } = coupen

            if (
                subTotal >= minPurchaseAmount &&
                new Date(validUntill) > Date.now()
            ) {
                await cartModal.updateOne(
                    { userId: userId },
                    { $set: { appliedCoupen: coupenId } }
                )
                discountamount = (subTotal * discount) / 100
                subTotal = subTotal - discountamount
                res.json({ success: true, subTotal: subTotal })
            } else {
                res.json({ message: 'Cannot apply coupen', subTotal: subTotal })
            }
        }
    } catch (error) {
        console.error(error)
    }
}





// ===========  admin side  ====

const loadCoupenPage = async (req, res) => {
    try {
        const ITEMS_PER_PAGE = 5
        const page = parseInt(req.query.page) || 1
        const totalCouponsCount = await coupenModel.countDocuments()
        const totalPages = Math.ceil(totalCouponsCount / ITEMS_PER_PAGE)
        const skip = (page - 1) * ITEMS_PER_PAGE
        const coupens = await coupenModel
            .find({})
            .skip(skip)
            .limit(ITEMS_PER_PAGE)

        res.render('coupens', { coupens, totalPages, currentPage: page })
    } catch (error) {
        console.error(error)
    }
}

const addNewCoupen = async (req, res) => {
    try {
        const {
            couponTitle,
            couponCode,
            validFrom,
            validUntil,
            discountPercentage,
            minTotalPrice,
        } = req.body

        const coupenCodeUpperCase = couponCode.toUpperCase()
        const coupen = new coupenModel({
            coupenName: couponTitle,
            coupenCode: coupenCodeUpperCase,
            discount: discountPercentage,
            minPurchaseAmount: minTotalPrice,
            validFrom: validFrom,
            validUntill: validUntil,
        })
        await coupen.save()

        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}  

const deleteCoupen = async (req, res) => {
    try {
        const { couponId } = req.body
        await coupenModel.deleteOne({ _id: couponId })
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

const loadEditCoupen = async (req,res)=>{
  try{

    const  {coupenId} = req.body
    
    const coupenDetails = await coupenModel.findOne({_id:coupenId})
    res.json({coupenDetails})

  }
  catch(error){
    console.error(error);
  }
}

const editCoupen = async (req, res) => {
    try {
        const {
            coupenId,
            title,
            coupenCode,
            validFrom,
            validUntill,
            discount,
            minPrice,
        } = req.body
        const coupenCodeUpperCase = coupenCode.toUpperCase()
        const coupen = await coupenModel.findOne({
            coupenCode: coupenCodeUpperCase,
        })
     
            await coupenModel.updateOne(
                { _id: coupenId },
                {
                    $set: {
                        coupenName: title,
                        coupenCode: coupenCodeUpperCase,
                        validFrom: validFrom,
                        validUntill: validUntill,
                        discount: discount,
                        minPurchaseAmount: minPrice,
                    },
                }
            )
            res.json({ success: true })
       
    } catch (error) {
        console.error(error)
    }
}



module.exports = {
    applyCoupen,
    loadCoupenPage,
    addNewCoupen,
    deleteCoupen,
    loadEditCoupen,
    editCoupen,
}