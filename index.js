const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {authMiddleware, roleMiddleware}=require("./middleware/exporter");
const USER_ROLES=require("./models/userEnum")
const {userRouter,categoryRouter,subCategoryRouter,quotationRouter,dealerRouter,productRouter} = require("./routes/exporter");
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
app.use("/dealers",authMiddleware,dealerRouter);
app.use("/category",authMiddleware,categoryRouter);
app.use("/sub-category",authMiddleware,subCategoryRouter);
app.use("/quotation",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),quotationRouter);
app.use("/products",authMiddleware,roleMiddleware(USER_ROLES.SUPER_ADMIN,USER_ROLES.ADMIN),productRouter);
/* ==============================
   SERVER
============================== */

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});