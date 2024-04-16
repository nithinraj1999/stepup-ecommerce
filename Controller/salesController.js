const orderModel = require('../models/orderModel')






const loadSalesReport = async (req, res) => {
    const page = parseInt(req.query.page) || 1
  
    const limit = 20
    const skip = (page - 1) * limit
    try {
        const orders = await orderModel
            .find({})
            .populate('userId')
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit)
  
        const totalOrders = await orderModel.countDocuments()
        const totalPages = Math.ceil(totalOrders / limit)
  
        res.render('sales', {
            orders,
            totalPages,
            currentPage: page,
        })
    } catch (error) { 
        console.error('Error fetching orders:', error)
    }
  } 
  
  
  const monthlyReport = async (req, res) => {
    try{
  
    
      const { month } = req.body
      res.redirect(`/admin/monthly-report?month=${month}`)
    }
    catch(error){
      console.error(error);
    }
  }
  
  
  const loadMonthlyReport = async (req, res) => {
      const month = req.query.month
      const monthIndex = new Date(Date.parse(month + ' 1, 2000')).getMonth()
  
      const startDate = new Date(new Date().getFullYear(), monthIndex, 1)
      const endDate = new Date(new Date().getFullYear(), monthIndex + 1, 0)
      try {
          const orders = await orderModel 
              .find({ orderDate: { $gte: startDate, $lt: endDate } })
              .populate('userId')
              .sort({ _id: -1 })
          res.render('salesReport', {
              orders,
          })
      } catch (error) {
          console.error('Error fetching orders:', error)
      }
  }
  
  
  const loadWeeklyReport = async (req, res) => {
      const currentDate = new Date()
      const startOfWeek = new Date(
          currentDate.setDate(currentDate.getDate() - currentDate.getDay())
      ) 
      const endOfWeek = new Date(currentDate.setDate(currentDate.getDate() + 6)) 
  
      try {
          const orders = await orderModel
              .find({ orderDate: { $gte: startOfWeek, $lt: endOfWeek } })
              .populate('userId')
              .sort({ _id: -1 })
          res.render('salesReport', {
              orders,
          })
      } catch (error) {
          console.error('Error fetching orders:', error)
      }
  }
  
  const loadyearlyReport = async (req, res) => {
      const currentDate = new Date()
      const startOfYear = new Date(currentDate.getFullYear(), 0, 1) // Start of current year
      const endOfYear = new Date(currentDate.getFullYear(), 11, 31, 23, 59, 59) // End of current year
  
      try {
          const orders = await orderModel
              .find({ orderDate: { $gte: startOfYear, $lt: endOfYear } })
              .populate('userId')
              .sort({ _id: -1 })
          res.render('salesReport', {
              orders,
          })
      } catch (error) {
          console.error('Error fetching orders:', error)
      }
  }
  
  
  const loadDailyReport = async (req, res) => {
    const currentDate = new Date();
    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()); // Start of current day
    const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 23, 59, 59); // End of current day
  
      try {
          const orders = await orderModel
              .find({ orderDate: { $gte: startOfDay, $lt: endOfDay } })
              .populate('userId')
              .sort({ _id: -1 })
          res.render('salesReport', {
              orders,
          })
      } catch (error) {
          console.error('Error fetching orders:', error)
      }
  }
  
  
  const cutomDatereport = async (req, res) => {
      try {
          const { startDate, endDate } = req.body
          console.log(req.body)
          res.redirect(
              `/admin/custom-date-report?startDate=${startDate}&endDate=${endDate}`
          )
      } catch (error) {
          console.error()
      } 
  }
  
  
  const getCutomDatereport = async (req, res) => {
      try {
          const startDate = new Date(req.query['startDate'])
          const endDate = new Date(req.query['endDate'])
          const orders = await orderModel
              .find({ orderDate: { $gte: startDate, $lt: endDate } })
              .populate('userId')
              .sort({ _id: -1 })
          res.render('salesReport', {
              orders,
          })
      } catch (error) {
          console.error(error)
      }
  }
  

  module.exports = {
    loadSalesReport,
    monthlyReport,
    loadMonthlyReport,
    loadWeeklyReport,
    loadyearlyReport,
    loadDailyReport,
    cutomDatereport,
    getCutomDatereport
  }