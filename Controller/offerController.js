
const offerModel = require("../models/offer")
const productModel = require("../models/productModel")
const categoryModal = require("../models/categoryModel")


const offer = async (req, res) => {
    try {
        const offer = await offerModel.find({})
        res.render('offer', { offer })
    } catch (error) {
        console.log(error)
    }
}

const addOffer = async (req,res)=>{
  try{

    const {offerName,offerPercentage,startDate,endDate} = req.body
    const uppercaseName = offerName.toUpperCase();
    const isOfferNameExist = await offerModel.findOne({name:uppercaseName})
    if(!isOfferNameExist){
      const offer = new offerModel({
        name:uppercaseName,
        percentage:offerPercentage,
        startDate:startDate,
        endDate:endDate
      })
      await offer.save()
      res.json({success:true})
    }else{
      res.json({alreadyExist:"offer already Exist"})
    }
  }
  catch(error){
    console.error(error);
  }
}


const applyOffer = async(req,res)=>{
try{
  const {categoryId,selectedOfferId} = req.body
  await categoryModal.updateOne({_id:categoryId},{$set:{offer:selectedOfferId}})
  res.json({success:true})
}
catch(error){
  console.error(error);
}
}
 
const deleteOffer = async (req,res)=>{
try{
   const {offerId} = req.body
   await offerModel.deleteOne({_id:offerId})

   res.json({success:true})
}
catch(error){
  console.error(error);
}
}

const loadEditOffer = async(req,res)=>{
  try{
    const {offerid} = req.query
  
    const offer = await offerModel.findOne({_id:offerid})
  
    res.json({offer})
  }catch(error){
    console.error(error);
  }
} 

const editOffer = async (req,res)=>{
try{
  const {offerid} =req.query
  
const {name,
  percentage,
  startDate,
  endDate} = req.body
const nameToUpper = name.toUpperCase()

const isExist = await offerModel.findOne({name:nameToUpper})

if(!isExist){
  const offer = await offerModel.updateOne(
    { _id: offerid },
    {
        $set: {
            name: nameToUpper,
            percentage: percentage,
            startDate: startDate,
            endDate: endDate
        }
    }   
  );
  res.json({success:true})
}else{
  res.json({message:"alreadyExist"})
}
 
}
catch(error){
  console.error(error);
}
}
 

const removeOffer = async (req, res) => {
    try {
        const { categoryId } = req.body
        await categoryModal.updateOne(
            { _id: categoryId },
            { $unset: { offer: '' } }
        )
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}


const applyProductOffer = async (req, res) => {
    try {
        const { productId, selectedOfferId } = req.body
        await productModel.updateOne(
            { _id: productId },
            { $set: { offer: selectedOfferId } }
        )
        console.log(req.body)
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
} 


const removeProductOffer = async (req, res) => {
    try {
        const { productId } = req.body
        await productModel.updateOne(
            { _id: productId },
            { $unset: { offer: '' } }
        )
        res.json({ success: true })
    } catch (error) {
        console.error(error)
    }
}


module.exports = {
    offer,
    addOffer,
    applyOffer,
    deleteOffer,
    loadEditOffer,
    editOffer,
    removeOffer,
    applyProductOffer,
    removeProductOffer,


}