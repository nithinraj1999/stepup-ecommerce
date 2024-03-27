const loadSalesReport = async (req, res) => {
    try {
      const orders = await orderModel .find({})
    
      .populate('userId',{orders})
        res.render('sales')
    } catch (error) {
        console.error(error)
    }
}