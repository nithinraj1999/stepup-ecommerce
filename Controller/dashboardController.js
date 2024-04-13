const orderModel = require("../models/orderModel")





const loadDashBoard = async (req, res) => {
    try {
      const subTotalSum = await orderModel.aggregate([{$group:{_id:null,total:{$sum:"$subTotal"}}}])
      const totalRevenue = subTotalSum[0].total
      const totalOrder = await orderModel.find({}).count()
      const pendingOrdersRequest = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Requested Return" } } }).count()
    //   const totalProductReturned =  await orderModel.find({ "products": { $elemMatch: { orderStatus: "Product Returned" } } }).count()
       const totalProductCancelled = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Canceled" } } }).count()
    const totalReturnedProducts = await orderModel.aggregate([
        { $unwind: "$products" }, // Unwind the products array
        { $match: { "products.orderStatus": "Product Returned" } }, // Match only returned products
        { $group: { _id: null, count: { $sum: 1 } } } // Group to count returned products
      ]);
      
      const returnedProductCount = totalReturnedProducts.length > 0 ? totalReturnedProducts[0].count : 0;
      
      const placed = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Placed" } } }).count()
      const shipped = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Shipped" } } }).count()
      const packed = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Packed" } } }).count()
      const delivered = await orderModel.find({ "products": { $elemMatch: { orderStatus: "Delivered" } } }).count()

      const currentYear = new Date().getFullYear();
      // Get orders for the current year
      const orders = await orderModel.find({
          orderDate: {
              $gte: new Date(`${currentYear}-01-01`),
              $lte: new Date(`${currentYear}-12-31T23:59:59.999`)
          }
      });  
  
      // Calculate total earnings for each month
      const monthlyEarnings = Array(12).fill(0); // Initialize array for 12 months with zeros
      orders.forEach(order => {
          const month = order.orderDate.getMonth(); // Month is zero-based (0 for January)
          monthlyEarnings[month] += order.subTotal;
      });

      const topSellingProducts = await orderModel.aggregate([
        { $unwind: "$products" }, // Unwind the products array
        {
            $group: {
                _id: "$products.productId",
                totalQuantity: { $sum: "$products.quantity" }
            }
        }, // Group by productId and sum the quantities
        { $sort: { totalQuantity: -1 } }, // Sort by totalQuantity in descending order
        { $limit: 10 }, // Limit to top 10 selling products
        {
            $lookup: {
                from: "products", // The name of the collection to join with
                localField: "_id", // The field from the input documents
                foreignField: "_id", // The field from the documents of the "products" collection
                as: "product" // The output array field
            }
        },
        {
            $addFields: {
                productName: { $arrayElemAt: ["$product.name", 0] } // Extract the name from the product array
            }
        },
        {
            $project: {
                _id: 1,
                totalQuantity: 1,
                productName: 1
            }
        }
    ]);
    
  
    const topSellingCategories = await orderModel.aggregate([
      { $unwind: "$products" },
      {
          $lookup: {
              from: "products",
              localField: "products.productId",
              foreignField: "_id",
              as: "product"
          }
      },
      { $unwind: "$product" },
      {
          $lookup: {
              from: "categories",
              localField: "product.subcategory_id",
              foreignField: "_id",
              as: "category"
          }
      },
      { $unwind: "$category" },
      {
          $group: {
              _id: "$category.name",
              totalQuantity: { $sum: "$products.quantity" }
          }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 3 }
  ]);


  
        // Find top 10 selling brands
        const totalSalesByBrand = await orderModel.aggregate([
          { $unwind: "$products" },
          {
              $lookup: {
                  from: "products",
                  localField: "products.productId",
                  foreignField: "_id",
                  as: "product"
              }
          },
          { $unwind: "$product" },
          {
              $group: {
                  _id: "$product.manufacturer",
                  totalQuantity: { $sum: "$products.quantity" }
              }
          },
          { $sort: { totalQuantity: -1 } } // Sort by brand name
      ]);





      // Calculate average monthly earnings
      const totalEarnings = monthlyEarnings.reduce((total, earnings) => total + earnings, 0);
      const averageMonthlyEarnings = totalEarnings / 12;
      const roundedAverageMonthlyEarnings = Math.round(averageMonthlyEarnings * 100) / 100; // Round to 2 decimal places

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
          totalSalesByBrand
      }) 
    } catch (error) { 
        console.error(error)
    }
}
 
 module.exports = {
    loadDashBoard
 }