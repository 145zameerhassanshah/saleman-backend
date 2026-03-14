const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {authMiddleware, roleMiddleware}=require("./middleware/exporter");
const USER_ROLES=require("./models/userEnum")
<<<<<<< HEAD
const {userRouter,categoryRouter,subCategoryRouter,quotationRouter,dealerRouter,productRouter} = require("./routes/exporter");
=======
const {userRouter,categoryRouter,subCategoryRouter,quotationRouter,orderRouter,dealerRouter} = require("./routes/exporter");
>>>>>>> 38839c378b49e8f6393536ba5155d800cb2fbe11
require('dotenv').config();

const connectDB = require('./database/db');
const app = express();

connectDB();

/* ==============================
   MIDDLEWARE
============================== */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(cors({
  origin: "http://localhost:3000", // frontend url
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use("/users", userRouter);
<<<<<<< HEAD
app.use("/dealers",authMiddleware,dealerRouter);
app.use("/category",authMiddleware,categoryRouter);
app.use("/sub-category",authMiddleware,subCategoryRouter);
app.use("/quotation",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),quotationRouter);
app.use("/products",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),productRouter);
/* ==============================
   SERVER
============================== */

const port = process.env.PORT || 3001;
=======
app.use("/dealers", dealerRouter);
app.use("/category",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),categoryRouter);
app.use("/sub-category",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),subCategoryRouter);
app.use("/quotation",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),quotationRouter);
app.use("/order",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),orderRouter)
// app.use("/setting",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),settingRouter);

const port = process.env.PORT || 3002;
>>>>>>> 38839c378b49e8f6393536ba5155d800cb2fbe11

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});