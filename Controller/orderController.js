const userModel = require('../models/userModel')
const productModel = require('../models/productModel')
const cartModal = require('../models/cartModal')
const coupenModel = require('../models/coupenModel')
const Razorpay = require('razorpay')
const walletModel = require('../models/walletModel')
const { v4: uuidv4 } = require('uuid')
const orderModal = require('../models/orderModel')
const path = require('path')
const ejs = require('ejs')
const puppeteer = require('puppeteer') 


var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
})

const loadCheckout = async (req, res) => {
    try {
        const id = req.session.user_id
        const find = await userModel.findOne({ _id: id })
        const cartData = await cartModal
            .findOne({ userId: id })
            .populate('product.productId')
        const wallet = await walletModel.findOne({ userId: id })
        const coupens = await coupenModel.find({})
        res.render('checkout', { find, cartData, wallet, coupens })
    } catch (error) {
        console.error(error) 
    } 
}

const loadOrderSuccess = async (req, res) => {
    try{
        res.render('orderSuccessPage')
    }
    catch(error){
        console.error(error);
    }
}

function generateUniqueID(length) {
    try{
        const uuid = uuidv4().replace(/-/g, '') // Remove dashes from the UUID
        return uuid.substring(0, length)
    }
    catch(error){
        console.error(error);
    }
    
}

const checkOutVerification = async (req, res) => {
    try {
        const userId = req.session.user_id
        const cartData = await cartModal
            .findOne({ userId: userId })
            .populate('product.productId')

        for (const item of cartData.product) {
            const product = item.productId

            if (item.quantity > product.quantity) {
                console.error(
                    `Error: Quantity of product '${product.name}' is insufficient.`
                )
                return res.status(400).json({
                    error: `Quantity of product '${product.name}' is insufficient.`,
                })
            }
        }

        res.json({ success: true })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal Server Error' })
    }
}

const order = async (req, res) => {
    try {
        const id = req.session.user_id
        let {
            cartId,
            selectedAddress,
            selectedPaymentMethod,
            total,
            coupencode,
        } = req.body

        let totalAfterCoupenDiscount
        let totalItemsinCart
        let productPriceAfterCoupen = 0
        if (coupencode) {
            await coupenModel.updateOne(
                { coupenCode: coupencode },
                { $push: { users: { userID: id } } }
            )
        } else {
            console.log('no coupen')
        }

        const uniqueOrderId = generateUniqueID(5)
        const cart = await cartModal
            .findOne({ userId: id })
            .populate('product.productId')

        const subTotal = cart.subTotal
        totalItemsinCart = cart.product.length

        if (coupencode) {
            const coupen = await coupenModel.findOne({ coupenCode: coupencode })
            const discountPercentage = coupen.discount
            const discount = (subTotal * discountPercentage) / 100
            totalAfterCoupenDiscount = subTotal - discount
            productPriceAfterCoupen = discount / totalItemsinCart
        }

        if (selectedPaymentMethod == 'COD') {
            if (cart && cart.product) {
                const products = []
                for (const item of cart.product) {
                    const quantity = item.quantity
                    const productPrice = item.price - productPriceAfterCoupen
                    const manufacturer = item.productId.manufacturer
                    const productName = item.productId.name
                    const productTotal = item.total - productPriceAfterCoupen
                    const productImage =
                        item.productId.product_image[3].resizedFile

                    const productId = item.productId

                    products.push({
                        name: productName,
                        manufacturer: manufacturer,
                        productId: productId,
                        quantity: quantity,
                        price: productPrice,
                        total: productTotal,
                        productImage: productImage,
                    })

                    await productModel.updateOne(
                        { _id: productId },
                        { $inc: { quantity: -quantity } }
                    )
                }
                if (coupencode) {
                    total = totalAfterCoupenDiscount
                }

                const order = new orderModal({
                    userId: id,
                    products: products,
                    addressId: selectedAddress,
                    subTotal: total,
                    order_id: uniqueOrderId,
                    paymentMethod: selectedPaymentMethod,
                    paymentStatus: 'Cash On Delivery',
                })

                await order.save()

                const orderId = order._id
                const orderTotal = order.subTotal

                await cartModal.deleteOne({ userId: id })
                res.status(200).json({
                    codSuccess: true,
                    message: 'Order placed successfully!',
                })
            }
        } else if (selectedPaymentMethod == 'online') {
            if (cart && cart.product) {
                const products = []
                for (const item of cart.product) {
                    const quantity = item.quantity
                    const productPrice = item.price - productPriceAfterCoupen
                    const manufacturer = item.productId.manufacturer
                    const productName = item.productId.name
                    const productTotal = item.total - productPriceAfterCoupen
                    const productImage =
                        item.productId.product_image[3].resizedFile
                    const productId = item.productId

                    products.push({
                        name: productName,
                        manufacturer: manufacturer,
                        productId: productId,
                        quantity: quantity,
                        price: productPrice,
                        total: productTotal,
                        productImage: productImage,
                    })

                    //  await productModel.updateOne({_id:productId},{$inc:{quantity:-quantity}})
                }

                const order = new orderModal({
                    userId: id,
                    products: products,
                    addressId: selectedAddress,
                    subTotal: total,
                    order_id: uniqueOrderId,
                    paymentMethod: selectedPaymentMethod,
                    paymentStatus: 'Pending',
                })

                await order.save()
                const orderId = order._id
                let orderTotal
                if (coupencode) {
                    orderTotal = totalAfterCoupenDiscount
                } else {
                    orderTotal = order.subTotal
                }

                const razorpayInstance = await generaterazorpay(
                    orderId,
                    orderTotal
                )
                res.json({ razorpayInstance })
            }
        } else if (selectedPaymentMethod == 'wallet') {
            if (cart && cart.product) {
                const products = []
                for (const item of cart.product) {
                    const quantity = item.quantity
                    const productPrice = item.price - productPriceAfterCoupen
                    const manufacturer = item.productId.manufacturer
                    const productName = item.productId.name
                    const productTotal = item.total - productPriceAfterCoupen
                    const productImage =
                        item.productId.product_image[3].resizedFile
                    const productId = item.productId

                    products.push({
                        name: productName,
                        manufacturer: manufacturer,
                        productId: productId,
                        quantity: quantity,
                        price: productPrice,
                        total: productTotal,
                        productImage: productImage,
                    })

                    await productModel.updateOne(
                        { _id: productId },
                        { $inc: { quantity: -quantity } }
                    )
                }

                const order = new orderModal({
                    userId: id,
                    products: products,
                    addressId: selectedAddress,
                    subTotal: total,
                    order_id: uniqueOrderId,
                    paymentMethod: selectedPaymentMethod,
                    paymentStatus: 'Success',
                })

                await order.save()
                const orderId = order._id

                if (coupencode) {
                    orderTotal = totalAfterCoupenDiscount
                } else {
                    orderTotal = order.subTotal
                }
                await walletModel.updateOne(
                    { userId: id },
                    {
                        $inc: { balance: -orderTotal },
                        $push: {
                            transactions: { amount: orderTotal, type: 'Debit' },
                        },
                    }
                )

                await cartModal.deleteOne({ userId: id })
                res.status(200).json({
                    codSuccess: true,
                    message: 'Order placed successfully!',
                })
            }
        } else {
            res.json({ message: 'error' })
        }
    } catch (error) {
        console.error(error)
    }
}

//=====================function to generate Razorpay ===================

function generaterazorpay(orderId, totalPrice) {
  try{
    const options = instance.orders.create({
      amount: totalPrice * 100,
      currency: 'INR',
      receipt: orderId,
  })
  return options
  }
  catch(error){
    console.error(error);
  }
    
}

//======================================================================

const verifyPayment = async (req, res) => {
    try {
        const { payment, order: orderData } = req.body
        let hmac = crypto.createHmac('sha256', 'BnbkfGmhHXITc2ZOkHCgfk1M')
        hmac.update(
            payment.razorpay_order_id + '|' + payment.razorpay_payment_id
        )
        hmac = hmac.digest('hex')

        if (hmac == payment.razorpay_signature) {
            const orderId = orderData.razorpayInstance.receipt
            const order = await orderModal.findOne({ _id: orderId })
            const userId = order.userId
            if (order) {
                await orderModal.updateOne(
                    { _id: orderId },
                    { $set: { paymentStatus: 'Success' } }
                )
                await cartModal.deleteOne({ userId: userId })

                for (const item of order.products) {
                    const quantity = item.quantity
                    const productId = item.productId
                    await productModel.updateOne(
                        { _id: productId },
                        { $inc: { quantity: -quantity } }
                    )
                }
                res.status(200).json({
                    onlinePaymentsuccess: true,
                    message: 'Order placed successfully!',
                })
            } else {
                res.json({ message: 'cannot find order document' })
            }
        } else {
            console.log('signature isnt matching')

            res.json({ message: 'payament signature isnt matching' })
        }
    } catch (error) {
        console.error(error)
    }
}
//======================

const failedPayment = async (req, res) => {
    try {
        const { payment, order: orderData } = req.body
        const orderId = orderData.razorpayInstance.receipt
        const del = await orderModal.updateOne(
            { _id: orderId },
            { $set: { paymentStatus: 'Failed' } }
        )

        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

const paymentFailed = (req, res) => {
    try {
        res.render('paymentFailedPage')
    } catch (error) {
        console.error(error)
    }
}

const retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body

        const order = await orderModal.findOne({ _id: orderId })

        if (order) {
            // Check if payment method is online
            if (order.paymentMethod === 'online') {
                // Generate Razorpay instance and initiate payment
                const razorpayInstance = await generaterazorpay(
                    orderId,
                    order.subTotal
                )
                res.json({ razorpayInstance })
            } else {
                res.json({
                    message:
                        'Retry payment is only available for online payments.',
                })
            }
        } else {
            res.json({ message: 'Order not found.' })
        }
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal server error.' })
    }
}

//========
const orderDetails = async (req, res) => {
    try {
        const orderId = req.query.orderId
        const productId = req.query.productId
        const userId = req.session.user_id
        const order = await orderModal.findOne({ _id: orderId, userId: userId })
        const addressId = order.addressId
        const user = await userModel.findOne({ _id: userId })
        const product = order.products.find(
            (p) => p._id.toString() === productId
        )
        const address = user.address.find(
            (address) => address._id.toString() === addressId
        )
        const otherItems = order.products.filter(
            (p) => p._id.toString() !== productId
        )

        res.render('orderDetails', { product, address, otherItems, order })
    } catch (error) {
        console.error(error)
    }
}

const cancelRequest = async (req, res) => {
    try {
        const userId = req.session.user_id
        const { productId, orderId, reason } = req.body
        await orderModal.updateOne(
            { _id: orderId, userId: userId, 'products._id': productId },
            {
                $set: { 'products.$.orderStatus': 'Canceled', reason: reason },
            }
        )

        const order = await orderModal.findOne({ _id: orderId, userId: userId })

        const cancelledProduct = order.products.find(
            (item) => item._id == productId
        )
        const cancelledProductId = cancelledProduct.productId
        const quantityOfCanceled = cancelledProduct.quantity
        const priceOfCanceled = cancelledProduct.price
        const totalPriceOfCancelled = quantityOfCanceled * priceOfCanceled
        const paymentMethod = order.paymentMethod

        await productModel.updateOne(
            { _id: cancelledProductId },
            { $inc: { quantity: quantityOfCanceled } }
        )

        if (
            order.paymentMethod == 'wallet' ||
            order.paymentMethod == 'online'
        ) {
            const wallet = await walletModel.findOne({ userId: userId })
            if (!wallet) {
                const addBalaceToWallet = new walletModel({
                    userId: userId,
                    balance: priceOfCanceled,
                    transactions: [
                        {
                            amount: totalPriceOfCancelled,
                        },
                    ],
                })

                await addBalaceToWallet.save()
            } else {
                await walletModel.updateOne(
                    { userId: userId },
                    {
                        $inc: { balance: totalPriceOfCancelled },
                        $push: {
                            transactions: { amount: totalPriceOfCancelled },
                        },
                    }
                )
            }
        }

        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

const returnRequest = async (req, res) => {
    try {
        const userId = req.session.user_id
        const { productId, orderId, reason } = req.body
        await orderModal.updateOne(
            { _id: orderId, userId: userId, 'products._id': productId },
            {
                $set: {
                    'products.$.orderStatus': 'Requested Return',
                    reason: reason,
                },
            }
        )
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

const loadInvoice = async (req, res) => {
    try {
        const productId = req.query.productId // Use req.params for URL parameters
        const orderId = req.query.orderId

        const orderData = await orderModal
            .findOne({ _id: orderId })
            .populate('products.productId')
            .populate('userId')

        const data = {
            orderData,
        }

        const ejsTemplate = path.resolve(__dirname, '../../views/user/invoice.ejs')
        const ejsData = await ejs.renderFile(ejsTemplate, data)

        // Launch Puppeteer and generate PDF
        const browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage()
        await page.setContent(ejsData, { waitUntil: 'networkidle0' })
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
        })

        // Close the browser
        await browser.close()

        // Set headers for inline display in the browser
        res.set({
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'inline; filename=order_invoice.pdf',
        }).send(pdfBuffer)
    } catch (error) { 
        console.error(error)
    }
}



// =========== admin side =========


const loadOrders = async (req, res) => {
    const page = parseInt(req.query.page) || 1
    const limit = 7
    const skip = (page - 1) * limit
    try {
        const orders = await orderModal
            .find({ paymentStatus:{$ne:"Failed"}})
            .populate('userId')
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)

        const totalOrders = await orderModal.countDocuments()

        const totalPages = Math.ceil(totalOrders / limit)

        res.render('adminAllOrders.ejs', {
            orders,
            totalPages,
            currentPage: page,
        })
    } catch (error) {
        console.error('Error fetching orders:', error)
    }
}


const orderStatus = async(req,res) =>{
  try{
    const {currentStatus,orderId,productId} = req.body
    const find = await orderModal.findOne({_id:orderId})
    await orderModal.updateOne(
      { "_id": orderId, "products._id": productId },
      { $set: { "products.$.orderStatus": currentStatus } }
    );  
    res.json({success:true,currentStatus}) 
  }
  catch(error){ 
    console.error(error);
  }
} 
 

const orderRequest = async (req, res) => {
    try {
        const { status, orderId, productId } = req.body
        if (status == 'Reject Request') {
            await orderModal.updateOne(
                { _id: orderId, 'products._id': productId },
                { $set: { 'products.$.orderStatus': 'Delivered' } }
            )
        } else {
            await orderModal.updateOne(
                { _id: orderId, 'products._id': productId },
                { $set: { 'products.$.orderStatus': 'Product Returned' } }
            )

            const order = await orderModal.findOne({ _id: orderId })

            const returnedProduct = order.products.find(
                (item) => item._id == productId
            )
            const returnedProductId = returnedProduct.productId
            const quantityOfReturned = returnedProduct.quantity

            await productModel.updateOne(
                { _id: returnedProductId },
                { $inc: { quantity: quantityOfReturned } }
            )

            const orders = await orderModal.findOne({
                _id: orderId,
                'products._id': productId,
            })
            const orderStatus = orders.products[0].orderStatus

            const priceOfReturned = returnedProduct.price
            const totalPriceOfReturned = priceOfReturned * quantityOfReturned

            const userId = order.userId

            const wallet = await walletModel.findOne({ userId: userId })
            if (!wallet) {
                const addBalaceToWallet = new walletModel({
                    userId: userId,
                    balance: priceOfReturned,
                    transactions: [
                        {
                            amount: totalPriceOfReturned,
                        },
                    ],
                })

                await addBalaceToWallet.save()
            } else {
                await walletModel.updateOne(
                    { userId: userId },
                    {
                        $inc: { balance: totalPriceOfReturned },
                        $push: {
                            transactions: { amount: totalPriceOfReturned },
                        },
                    }
                )
            }
        }

        res.json({ status, orderStatus })
    } catch (error) {
        console.error(error)
    }
}
 
    



module.exports = {
    loadCheckout,
    loadOrderSuccess,
    checkOutVerification,
    order,
    verifyPayment,
    failedPayment,
    paymentFailed,
    retryPayment,
    orderDetails,
    cancelRequest,
    returnRequest,
    loadInvoice,
    loadOrders,
    orderStatus,
    orderRequest



}