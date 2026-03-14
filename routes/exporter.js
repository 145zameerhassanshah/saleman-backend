const userRouter=require("./userRoutes");
const categoryRouter=require("./productCategoryRoute");
const subCategoryRouter=require("./subCategoryRoute");
const quotationRouter=require("./quotationRouter");
const orderRouter=require("./OrderRouter");
const settingRouter=require("./settingRoute");
const dealerRouter=require("./dealerRoute");

module.exports={
    userRouter,
    categoryRouter,
    subCategoryRouter,
    quotationRouter,
    orderRouter,
    settingRouter,
    dealerRouter
}