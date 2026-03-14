const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
<<<<<<< HEAD
const userRouter = require("./routes/userRoutes");
const dealerRouter = require("./routes/dealerRoutes");
=======
const {authMiddleware, roleMiddleware}=require("./middleware/exporter");
const USER_ROLES=require("./models/userEnum")
const {userRouter,categoryRouter,subCategoryRouter,quotationRouter,orderRouter,settingRouter} = require("./routes/exporter");
>>>>>>> 7fc4bdf90e3211cf15b96dba329982a44a70cbd6
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

/* ==============================
   ROUTES
============================== */

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use("/users", userRouter);
<<<<<<< HEAD
app.use("/dealers", dealerRouter);
=======
app.use("/category",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),categoryRouter);
app.use("/sub-category",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),subCategoryRouter);
app.use("/quotation",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),quotationRouter);
>>>>>>> 7fc4bdf90e3211cf15b96dba329982a44a70cbd6
app.use("/order",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),orderRouter)
app.use("/setting",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),settingRouter);

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});