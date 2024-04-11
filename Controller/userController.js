const otpGenerator = require('otp-generator')
const userModel = require('../Models/userModel')
const categoryModal = require('../Models/categoryModel')
const otpModel = require('../Models/otpModel')
const nodemailer = require('nodemailer')
const productModel = require('../Models/productModel')
const cartModal = require('../Models/cartModal')
const orderModal = require('../Models/orderModel')
const wishListModel = require('../Models/wishListModel')
const walletModel = require('../Models/walletModel')
const Swal = require('sweetalert2')
const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')
const Razorpay = require('razorpay')
require('dotenv').config()
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const coupenModel = require('../Models/coupenModel')
const moment = require('moment')
const path = require('path')
const ejs = require('ejs')
const puppeteer = require('puppeteer')
const express = require('express')
const app = express()
var instance = new Razorpay({
    key_id: process.env.KEY_ID,
    key_secret: process.env.KEY_SECRET,
})

app.set('view engine', 'ejs')
app.set(path.join(__dirname, 'views', 'user'))

const securePassword = async (password) => {
    try {
        const passwordHash = await bcrypt.hash(password, 10)
        return passwordHash
    } catch (error) {
        console.error(error)
    }
}

const loadHomePage = (req, res) => {
    try {
        let isLoggedIn
        if (req.session.user_id) {
            isLoggedIn = true
        } else {
            isLoggedIn = false
        }
        if (req.session.user_id) {
            res.render('home', { isLoggedIn })
        } else {
            res.render('home', { isLoggedIn })
        }
    } catch (error) {
        console.error(error)
    }
}

const loadsignup = (req, res) => {
    try {
        res.render('login')
    } catch (error) {
        console.error(error)
    }
}

const signup = async (req, res) => {
    try {
        const { email, name, phone, password } = req.body

        const user = await userModel.findOne({ email: email })

        if (!user) {
            const hashedPassword = await securePassword(password)
            const userData = new userModel({
                name: name,
                email: email,
                phone: phone,
                password: hashedPassword,
            })
            await userData.save()

            await otp(email)
            res.render('otp-verification', { email })
        } else {
            if (user.isVerified === true) {
                res.render('login')
            } else if (user.isVerified === false) {
                await otp(email)
                res.render('otp-verification', { email })
            }
        }
    } catch (error) {
        console.error(error)
    }
}

const loadOTP = async (req, res) => {
    try {
        const email = req.query.email
        res.render('otp-verification', { email: email })
    } catch (error) {
        console.error(error)
    }
}

const resendOTP = async (req, res) => {
    try {
        const { email } = req.body
        await otp(email)
        res.json({ success: true, email })
    } catch (error) {
        console.error(error)
    }
}

//======================================== OTP verification ============================================

const verifyOTP = async (req, res) => {
    try {
        let isLoggedIn
        if (req.session.user_id) {
            isLoggedIn = true
        } else {
            isLoggedIn = false
        }
        const { hiddenEmail } = req.body
        const email = hiddenEmail
        const found = await otpModel
            .find({ email: { $eq: email } })
            .sort({ _id: -1 })
            .limit(1)

        if (found.length == 0) {
            res.render('home', { isLoggedIn })
        } else if (found) {
            const otp = found[0].otp
            if (otp === req.body.otp) {
                await userModel.updateOne(
                    { email: email },
                    { $set: { isVerified: true } }
                )
                res.render('home', { isLoggedIn })
            } else {
                req.flash('message', 'Invalid OTP. Please try again.')
                const message = req.flash('message')
                res.render('otp-verification', { email, message: message })
            }
        } else {
            res.render('login')
        }
    } catch (error) {
        console.log(error)
    }
}
//=============================================
const loadLogin = (req, res) => {
    try {
        let isLoggedIn
        if (req.session.user_id) {
            isLoggedIn = true
        } else {
            isLoggedIn = false
        }

        res.render('login', { isLoggedIn })
    } catch (error) {
        console.error(error)
    }
}
//=====================================
const verifyLogin = async (req, res) => {
    try {
        email = req.body.loginEmail
        password = req.body.loginPassword
        const found = await userModel.findOne({
            email: email,
            isBlock: false,
            isAdmin: false,
            isVerified: true,
        })
        if (found) {
            const passwordMatch = await bcrypt.compare(password, found.password)
            if (passwordMatch) {
                req.session.user_id = found._id
                res.redirect('/')
            } else {
                res.redirect('/login')
            }
        } else {
            res.redirect('/login')
        }
    } catch (error) {
        console.log(error)
    }
}

const loadProductList = async (req, res) => {
    try {
        const userId = req.session.user_id
        const isLoggedIn = !!req.session.user_id
        const page = parseInt(req.query.page) || 1 // Current page number
        const limit = 6
        const path = req.path
        const filter = {
            list: true,
        }

        filter.subcategory_id = {
            $in: await categoryModal.find({
                isBlock: false,
            }),
        }
        const { category, brand: manufacturer, sort, search } = req.query

        // If brand filter is applied
        if (manufacturer && Array.isArray(manufacturer)) {
            filter.manufacturer = { $in: manufacturer }
        } else if (manufacturer) {
            filter.manufacturer = manufacturer
        }

        if (category && Array.isArray(category)) {
            filter.subcategory_id = {
                $in: await categoryModal.find({
                    subcategory: category,
                }),
            }
        } else if (category) {
            filter.subcategory_id = await categoryModal.find({
                subcategory: category,
            })
        }
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
                { manufacturer: { $regex: search, $options: 'i' } },
            ]
        }

        const sortOptions = {}
        if (req.query.sortBy === '-1') {
            sortOptions['price'] = -1
        } else if (req.query.sortBy === '1') {
            sortOptions['price'] = 1
        }

        const productsCount = await productModel.find(filter).countDocuments()
        const totalPages = Math.ceil(productsCount / limit)

        const startIndex = (page - 1) * limit

        const products = await productModel
            .find(filter)
            .populate({
                path: 'subcategory_id',
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')
            .sort(sortOptions)
            .skip(startIndex)
            .limit(limit)

        const subcategory = await categoryModal.distinct('subcategory')
        const brand = await productModel.distinct('manufacturer')

        const wishList = await wishListModel.findOne({ userId })
        const cart = await cartModal.findOne({ userId })

        res.render('productGrid', {
            find: products,
            category: 'All products',
            brand,
            cart,
            subcategory,
            isLoggedIn,
            wishList,
            cat: 'all',
            path,
            currentPage: page,
            totalPages,
        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
    }
}

//=========================================Load Men products on ===============================
const loadMen = async (req, res) => {
    try {
        const userId = req.session.user_id
        const isLoggedIn = req.session.user_id ? true : false
        const { category, brand: manufacturer, sort, search } = req.query
        const page = parseInt(req.query.page) || 1 // Current page number
        const limit = 6
        const query = {
            list: true,
        }
        query.subcategory_id = {
            $in: await categoryModal.find({
                isBlock: false,
            }),
        }

        if (manufacturer && Array.isArray(manufacturer)) {
            query.manufacturer = { $in: manufacturer }
        } else if (manufacturer) {
            query.manufacturer = manufacturer
        }

        if (category && Array.isArray(category)) {
            query.subcategory_id = {
                $in: await categoryModal.find({
                    subcategory: category,
                }),
            }
        } else if (category) {
            query.subcategory_id = await categoryModal.find({
                subcategory: category,
            })
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
                { manufacturer: { $regex: search, $options: 'i' } },
            ]
        }

        const path = req.path
        const startIndex = (page - 1) * limit
        const find = await productModel
            .find(query)
            .populate({
                path: 'subcategory_id',
                match: { name: 'Men' },
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')

        const filteredFind = find.filter((item) => item.subcategory_id !== null)
        const productsCount = filteredFind.length
        const totalPages = Math.ceil(productsCount / limit)

        const paginatedResults = filteredFind.slice(
            startIndex,
            startIndex + limit
        )

        const brand = await productModel.distinct('manufacturer')
        const subcategory = await categoryModal.distinct('subcategory')
        const wishList = await wishListModel.findOne({ userId: userId })
        const cart = await cartModal.findOne({ userId: userId })

        res.render('productGrid', {
            find: paginatedResults,
            path,
            currentPage: page,
            cart,
            totalPages,
            category: "Men's shoes",
            brand,
            subcategory,
            isLoggedIn,
            wishList,
            cat: 'Men',
        })
    } catch (error) {
        console.error(error)
    }
}

//=========================================Load women productspage===============================

const loadWomen = async (req, res) => {
    try {
        const userId = req.session.user_id
        const isLoggedIn = req.session.user_id ? true : false
        const { category, brand: manufacturer, sortBy, search } = req.query
        const page = parseInt(req.query.page) || 1 // Current page number
        const limit = 6

        const query = {
            list: true,
        }
        query.subcategory_id = {
            $in: await categoryModal.find({
                isBlock: false,
            }),
        }
        if (manufacturer && Array.isArray(manufacturer)) {
            query.manufacturer = { $in: manufacturer }
        } else if (manufacturer) {
            query.manufacturer = manufacturer
        }

        if (category && Array.isArray(category)) {
            query.subcategory_id = {
                $in: await categoryModal.find({
                    subcategory: category,
                }),
            }
        } else if (category) {
            query.subcategory_id = await categoryModal.find({
                subcategory: category,
            })
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
                { manufacturer: { $regex: search, $options: 'i' } },
            ]
        }

        const sortOptions = {}
        if (req.query.sortBy === '-1') {
            sortOptions['price'] = -1
        } else if (req.query.sortBy === '1') {
            sortOptions['price'] = 1
        }

        const path = req.path
        const startIndex = (page - 1) * limit
        const find = await productModel
            .find(query)
            .populate({
                path: 'subcategory_id',
                match: { name: 'Women' },
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')
            .sort(sortOptions)
        const filteredFind = find.filter(
            (item) => item.subcategory_id && item.subcategory_id.name == 'Women'
        )
        const productsCount = filteredFind.length
        const totalPages = Math.ceil(productsCount / limit)
        const paginatedResults = filteredFind.slice(
            startIndex,
            startIndex + limit
        )

        const brand = await productModel.distinct('manufacturer')
        const subcategory = await categoryModal.distinct('subcategory')
        const wishList = await wishListModel.findOne({ userId: userId })
        const cart = await cartModal.findOne({ userId: userId })

        res.render('productGrid', {
            find: paginatedResults,
            currentPage: page,
            cart,
            path,
            totalPages,
            category: "Women's shoes",
            brand,
            subcategory,
            isLoggedIn,
            wishList,
            cat: 'Women',
        })
    } catch (error) {
        console.error(error)
    }
}

//=========================================Load Kids products ===============================

const loadKids = async (req, res) => {
    try {
        const userId = req.session.user_id
        const isLoggedIn = req.session.user_id ? true : false
        const { category, brand: manufacturer, sort, search } = req.query

        const page = parseInt(req.query.page) || 1 // Current page number
        const limit = 6

        const query = {
            list: true,
        }
        query.subcategory_id = {
            $in: await categoryModal.find({
                isBlock: false,
            }),
        }

        if (manufacturer && Array.isArray(manufacturer)) {
            query.manufacturer = { $in: manufacturer }
        } else if (manufacturer) {
            query.manufacturer = manufacturer
        }

        if (category && Array.isArray(category)) {
            query.subcategory_id = {
                $in: await categoryModal.find({
                    subcategory: category,
                }),
            }
        } else if (category) {
            query.subcategory_id = await categoryModal.find({
                subcategory: category,
            })
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } }, // Case-insensitive search
                { manufacturer: { $regex: search, $options: 'i' } },
            ]
        }

        const sortOptions = {}
        if (req.query.sortBy === '-1') {
            sortOptions['price'] = -1
        } else if (req.query.sortBy === '1') {
            sortOptions['price'] = 1
        }

        // const totalPages = Math.ceil(productsCount / limit)
        const path = req.path
        const startIndex = (page - 1) * limit

        const find = await productModel
            .find(query)
            .populate({
                path: 'subcategory_id',
                match: { name: 'Kids' },
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')
            .sort(sortOptions)

        const filteredFind = find.filter((item) => item.subcategory_id !== null)
        const productsCount = filteredFind.length
        const totalPages = Math.ceil(productsCount / limit)
        const paginatedResults = filteredFind.slice(
            startIndex,
            startIndex + limit
        )
        const brand = await productModel.distinct('manufacturer')
        const subcategory = await categoryModal.distinct('subcategory')
        const wishList = await wishListModel.findOne({ userId: userId })
        const cart = await cartModal.findOne({ userId: userId })

        res.render('productGrid', {
            find: paginatedResults,
            currentPage: page,
            totalPages,
            path,
            cart,
            category: 'Kids shoes',
            brand,
            subcategory,
            isLoggedIn,
            wishList,
            cat: 'Kids',
        })
    } catch (error) {
        console.error(error)
    }
}

//===================================Load product details page==========================================

const loadProductDetails = async (req, res) => {
    try {
        const userId = req.session.user_id
        const find = await productModel
            .findOne({ _id: req.query.id })
            .populate({
                path: 'subcategory_id',
                match: { name: 'Kids' },
                populate: {
                    path: 'offer',
                    model: 'offer',
                },
            })
            .populate('offer')
        const wishList = await wishListModel.findOne({ userId: userId })
        res.render('productDetails', { find, wishList })
    } catch (error) {
        console.error(error)
    }
}

//==========================================function for send OTP ======================================
async function otp(email) {
    try {
        const otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        })

        const otpDOC = new otpModel({
            email: email,
            otp: otp,
        })

        await otpDOC.save()

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                // TODO: replace `user` and `pass` values from <https://forwardemail.net>
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        })

        // async..await is not allowed in global scope, must use a wrapper
        async function main() {
            // send mail with defined transport object
            try {
                const info = await transporter.sendMail({
                    from: process.env.MAIL_USER, // sender address
                    to: email, // list of receivers
                    subject: 'Here is your OTP', // Subject line
                    text: otp, // plain text body
                })
                console.log('Message sent: %s', info.messageId)
            } catch (error) {
                console.log(error)
            }
        }
        main().catch(console.error)
    } catch (error) {
        console.error(error)
    }
}

const userLogout = async (req, res) => {
    try {
        req.session.user_id = null
        res.redirect('/')
    } catch (error) {
        console.log(error)
    }
}

const myAccount = async (req, res) => {
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

        res.render('myAccount', {
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

const editUser = async (req, res) => {
    try {
        const { name, email, phone, userId } = req.body
        const find = await userModel.findOne({ _id: userId })
        const oldEmail = find.email
        await userModel.updateOne(
            { _id: userId },
            { $set: { name: name, phone: phone, email: email } }
        )

        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

const addAddress = async (req, res) => {
    try {
        const { name, phone, building, city, district, state, pincode } =
            req.body
        const userId = req.session.user_id
        await userModel.updateOne(
            { _id: userId },
            {
                $push: {
                    address: {
                        name: name,
                        phone: phone,
                        building: building,
                        city: city,
                        district: district,
                        state: state,
                        pincode: pincode,
                    },
                },
            }
        )

        res.status(200).json({ message: 'Address added successfully' })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: 'Internal server error' })
    }
}

const loadEditAddress = async (req, res) => {
    try {
        const addressId = req.params.id
        const id = req.session.user_id
        const find = await userModel.findOne({ _id: id })
        const address = find.address.find((i) => i._id == addressId)
        if (find) {
            res.json(address)
        } else {
            res.status(404).json({ error: 'Address not found' })
        }
    } catch (error) {
        console.error(error)
    }
}

const editAddress = async (req, res) => {
    try {
        const {
            name,
            phone,
            building,
            city,
            district,
            state,
            pincode,
            addressId,
        } = req.body
        const id = req.session.user_id

        await userModel.updateOne(
            { _id: id, 'address._id': addressId },
            {
                $set: {
                    'address.$.name': name,
                    'address.$.phone': phone,
                    'address.$.building': building,
                    'address.$.city': city,
                    'address.$.district': district,
                    'address.$.state': state,
                    'address.$.pincode': pincode,
                },
            }
        )

        res.json({ message: 'Address added successfully' })
    } catch (error) {
        console.error(error)
    }
}

const deleteAddress = async (req, res) => {
  try{
    const addressIdToDelete = req.body.addressId
    const id = req.session.user_id
    await userModel.updateOne(
        { _id: id },
        { $pull: { address: { _id: addressIdToDelete } } }
    )
    res.json({ success: 'deletion success' })
  }
  catch(error){
    console.error(error);
  }
    
}

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

const loadCart = async (req, res) => {
    try {
        const userId = req.session.user_id
        // const cart = await cartModal.findOne({userId:userId}).populate("product.productId")
        const cart = await cartModal.findOne({ userId: userId }).populate({
            path: 'product',
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

        if (cart && cart.product) {
            for (const item of cart.product) {
                const quantity = item.quantity
                // const productPrice = item.productId.price; // Assuming "price" is the field in your product schema containing the product price
                const productPrice = item.price
                const total = quantity * productPrice

                // Update the total for the current product in the cart
                await cartModal.updateOne(
                    { userId: userId, 'product.productId': item.productId },
                    { $set: { 'product.$.total': total } }
                )
            }
        }

        const find = await cartModal
            .findOne({ userId: userId })
            .populate('product.productId')

        const subtotal = await cartModal.aggregate([
            {
                $match: {
                    $expr: { $eq: ['$userId', { $toObjectId: userId }] },
                },
            },
            { $group: { _id: { subTotal: { $sum: '$product.total' } } } },
        ])

        const cartSubtotal = subtotal[0]?._id?.subTotal
        await cartModal.updateOne(
            { userId: userId },
            { $set: { subTotal: cartSubtotal } }
        )
        const subTotal = await cartModal.findOne({ userId: userId })

        res.render('cart', { find, subTotal })
    } catch (error) {
        console.error(error)
    }
}

const addTocart = async (req, res) => {
    try {
        const userId = req.session.user_id
        const { productPrice, productId } = req.body
        const price = parseInt(productPrice)
        let userCart = await cartModal.findOne({ userId: userId })
        // console.log(price);
        if (!userCart) {
            userCart = new cartModal({
                userId: userId,
                product: [
                    {
                        productId: productId,
                        price: price,
                        total: price,
                    },
                ],
                subTotal: price,
            })
            await userCart.save()
            res.status(200).json({
                success: true,
                message: 'Item added/updated to cart successfully',
            })
        } else {
            const find = await cartModal.find({
                'product.productId': productId,
            })
            const subtotal = await cartModal.aggregate([
                {
                    $match: {
                        $expr: { $eq: ['$userId', { $toObjectId: userId }] },
                    },
                },
                { $group: { _id: { subTotal: { $sum: '$product.total' } } } },
            ])

            const cartSubtotal = subtotal[0]?._id?.subTotal

            if (find.length == 0) {
                await cartModal.updateOne(
                    { userId: userId },
                    {
                        $push: {
                            product: {
                                productId: productId,
                                price: price,
                                total: price,
                            },
                        },
                    }
                )
                const subtotal = await cartModal.aggregate([
                    {
                        $match: {
                            $expr: {
                                $eq: ['$userId', { $toObjectId: userId }],
                            },
                        },
                    },
                    {
                        $group: {
                            _id: { subTotal: { $sum: '$product.total' } },
                        },
                    },
                ])

                const cartSubtotal = subtotal[0]?._id?.subTotal
                await cartModal.updateOne(
                    { userId: userId },
                    { $set: { subTotal: cartSubtotal } }
                )

                res.status(200).json({
                    success: true,
                    message: 'Item added/updated to cart successfully',
                })
            } else {
                res.status(200).json({
                    success: true,
                    message: 'Item added/updated to cart successfully',
                })
            }
        }
    } catch (error) {
        console.error('Error adding to cart:', error)
        res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        })
    }
}

const updateCart = async (req, res) => {
    try {
        const id = req.session.user_id
        const { productId, quantity, productPrice } = req.body

        const total = quantity * productPrice
        let warningMsg

        await cartModal.updateOne(
            { userId: id, 'product.productId': productId },
            {
                $set: {
                    'product.$.quantity': quantity,
                    'product.$.total': total,
                },
            }
        )
        const subtotal = await cartModal.aggregate([
            { $match: { $expr: { $eq: ['$userId', { $toObjectId: id }] } } },
            { $group: { _id: { subTotal: { $sum: '$product.total' } } } },
        ])

        const cartSubtotal = subtotal[0]?._id?.subTotal
        await cartModal.updateOne(
            { userId: id },
            { $set: { subTotal: cartSubtotal } }
        )
        const find = await cartModal
            .findOne({ userId: id })
            .populate('product.productId')
        const subTotal = find.subTotal
        const productItem = find?.product?.find(
            (item) => item.productId._id == productId
        )
        const f = await cartModal
            .findOne({ userId: id })
            .populate('product.productId')
        if (productItem && productItem.productId.quantity == quantity) {
            warningMsg = true
        } else {
            warningMsg = false
        }
        res.json({ success: true, total, subTotal, warningMsg })
    } catch (error) {
        console.error(error)
    }
}

const removeItem = async (req, res) => {
    try {
        const id = req.session.user_id
        const { productId } = req.body
        await cartModal.updateOne(
            { userId: id },
            { $pull: { product: { productId: productId } } }
        )
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}

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
    res.render('orderSuccessPage')
}

function generateUniqueID(length) {
    const uuid = uuidv4().replace(/-/g, '') // Remove dashes from the UUID
    return uuid.substring(0, length)
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

const loadProduct = async (req, res) => {
    try {
        const userId = req.session.user_id
        let isLoggedIn
        if (req.session.user_id) {
            isLoggedIn = true
        } else {
            isLoggedIn = false
        }

        const find = await productModel
            .find({ list: true })
            .populate('subcategory_id')
            .sort({ price: -1 })
        const subcategory = await categoryModal.distinct('subcategory')
        const brand = await productModel.distinct('manufacturer')
        const wishList = await wishListModel.findOne({ userId: userId })
        res.render('productGrid', {
            find,
            category: 'All products',
            brand,
            subcategory,
            isLoggedIn,
            wishList,
        })
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

        const ejsTemplate = path.resolve(__dirname, '../Views/user/invoice.ejs')
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

const loadEmailSubmit = (req, res) => {
    try {
        res.render('resetPassword')
    } catch (error) {
        console.error(error)
    }
}

const sendResetLink = async (req, res) => {
    try {
        const { email } = req.body
        const user = await userModel.findOne({ email: email })
        const userId = user._id
        res.json({ userId })
    } catch (error) {
        console.error(error)
    }
}

const loadResetPassword = (req, res) => {
    try {
        const { userId } = req.query
        res.render('newPassword', { userId })
    } catch (error) {
        console.error(error)
    }
}

const resetPassword = async (req, res) => {
    try {
        const { newPassword, confirmPassword, userId } = req.body

        if (newPassword === confirmPassword) {
            const hashedPassword = await securePassword(newPassword)
            await userModel.updateOne(
                { _id: userId },
                { $set: { password: hashedPassword } }
            )
            res.redirect('/')
        }
    } catch (error) {
        console.error(error)
    }
}

const sendResetEmail = async (req, res) => {
    try {
        const { userId, email } = req.query
        const resetLink = `http://localhost:3000/reset?userId=${userId}`

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                // TODO: replace `user` and `pass` values from <https://forwardemail.net>
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        })

        // async..await is not allowed in global scope, must use a wrapper
        async function main() {
            // send mail with defined transport object
            try {
                const info = await transporter.sendMail({
                    from: process.env.MAIL_USER, // sender address
                    to: email, // list of receivers
                    subject: 'Click The link To Reset Password', // Subject line
                    html: `<p>Hello,</p><p>Please click the following link to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`,
                })
                console.log('Message sent: %s', info.messageId)
            } catch (error) {
                console.log(error)
            }
        }
        main().catch(console.error)

        res.render('resetPassword', {
            message:
                'Reset PasswordLink has been sended to your email. Please do check',
        })
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    loadHomePage,
    loadsignup,
    signup,
    loadOTP,
    verifyOTP,
    loadLogin,
    verifyLogin,
    loadProductList,
    loadMen,
    loadWomen,
    loadKids,
    loadProductDetails,
    userLogout,
    loadCart,
    addTocart,
    myAccount,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress,
    updateCart,
    removeItem,
    loadCheckout,
    order,
    loadOrderSuccess,
    resendOTP,
    editUser,
    orderDetails,
    cancelRequest,
    returnRequest,
    addToWishList,
    loadWishList,
    removeWishList,
    verifyPayment,
    applyCoupen,
    loadProduct,
    // sortByPrice,
    failedPayment,
    paymentFailed,
    checkOutVerification,
    // filter,

    // applyFilter,
    loadInvoice,
    retryPayment,
    loadEmailSubmit,
    sendResetLink,
    resetPassword,
    loadResetPassword,
    sendResetEmail,
    loadWallet,
}
