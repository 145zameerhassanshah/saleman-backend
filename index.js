const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {authMiddleware, roleMiddleware}=require("./middleware/exporter");
const USER_ROLES=require("./models/userEnum")
const {userRouter,categoryRouter,subCategoryRouter,quotationRouter,dealerRouter,productRouter,industryRouter,orderRouter} = require("./routes/exporter");
require('dotenv').config();
const connectDB = require('./database/db');
const app = express();
app.use("/uploads", express.static("uploads"));

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use("/users", userRouter);
app.use("/products",authMiddleware,roleMiddleware(USER_ROLES.ADMIN),productRouter);
app.use("/dealers",authMiddleware,roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN),dealerRouter);

app.use("/category",authMiddleware,roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN),categoryRouter);
app.use("/sub-category",authMiddleware,roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN),subCategoryRouter);
app.use("/quotation",authMiddleware,roleMiddleware(USER_ROLES.ADMIN,USER_ROLES.SALESMAN),quotationRouter);
app.use("/order",authMiddleware,orderRouter);
app.use("/industry",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN),industryRouter);
// app.use("/setting",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),settingRouter);


/* ==============================
   SERVER
============================== */

const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});