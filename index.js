const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const userRouter = require("./routes/userRoutes");
const dealerRouter = require("./routes/dealerRoutes");
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
app.use("/dealers", dealerRouter);

/* ==============================
   SERVER
============================== */

const port = process.env.PORT || 3001;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});