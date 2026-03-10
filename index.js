const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./database/db');

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

connectDB();

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});