const otpGenerator = require('otp-generator')
const userModel = require('../models/userModel')
const otpModel = require('../models/otpModel')
const nodemailer = require('nodemailer')
const cartModal = require('../models/cartModal')
const orderModal = require('../models/orderModel')
const walletModel = require('../models/walletModel')
const { v4: uuidv4 } = require('uuid')
const Razorpay = require('razorpay')
require('dotenv').config()
const bcrypt = require('bcrypt')
const path = require('path')

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

const loadHomePage = async (req, res) => {
    try {
        const isLoggedIn = req.session.user_id ? true : false
        if (req.session.user_id) {
            const cart = await cartModal.findOne({
                userId: req.session.user_id,
            })
            res.render('home', { isLoggedIn, cart })
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
                req.flash('message', 'email already exist.please login')
                const message = req.flash('message')
                res.render('login', { message: message })
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
        const userOTP = parseInt(req.body.otp)

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

            if (otp === userOTP) {
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


//==========================================function for send OTP ======================================
async function otp(email) {
    try {
        const otp = otpGenerator.generate(4, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
        })
        console.log(otp)

        const otpDOC = new otpModel({
            email: email,
            otp: otp,
        })
        console.log(otpDOC)

        await otpDOC.save()

        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        })

        async function main() {
            try {
                const info = await transporter.sendMail({
                    from: process.env.MAIL_USER,
                    to: email,
                    subject: 'Here is your OTP',
                    text: otp,
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
        if (wallet) {
        }
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
            isLoggedIn:true
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
    try {
        const addressIdToDelete = req.body.addressId
        const id = req.session.user_id
        await userModel.updateOne(
            { _id: id },
            { $pull: { address: { _id: addressIdToDelete } } }
        )
        res.json({ success: 'deletion success' })
    } catch (error) {
        console.error(error)
    }
}


function generateUniqueID(length) {
    const uuid = uuidv4().replace(/-/g, '') // Remove dashes from the UUID
    return uuid.substring(0, length)
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
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        })
        async function main() {
            try {
                const info = await transporter.sendMail({
                    from: process.env.MAIL_USER, 
                    to: email, 
                    subject: 'Click The link To Reset Password', 
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

const address = async (req, res) => {
    try {
        const userId = req.session.user_id
        const find = await userModel.findOne({ _id: userId })
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

        res.render('myAccountAddress', {
            find,
            orders,
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



const myOrders = async (req, res) => {
    try {
        const userId = req.session.user_id
        const find = await userModel.findOne({ _id: userId })
        const cart = await cartModal.findOne({ userId: userId })
        const page = parseInt(req.query.page) || 1 
        const limit = 7 
        const totalOrders = await orderModal.countDocuments({ userId: userId })

        const skip = (page - 1) * limit

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
            .skip(skip)
            .limit(limit)

        res.render('myAccountOrders', {
            find,
            orders,
            cart,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit),
            isLoggedIn:true

        })
    } catch (error) {
        console.error(error)
        res.status(500).send('Internal Server Error')
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
    userLogout,
    myAccount,
    addAddress,
    loadEditAddress,
    editAddress,
    deleteAddress,
    resendOTP,
    editUser,
    loadEmailSubmit,
    sendResetLink,
    resetPassword,
    loadResetPassword,
    sendResetEmail,
    address,
    myOrders,
}
