const express = require('express');
const connectDB = require('./config/db');
const transactionRoutes = require('./routes/transactionRoutes');
const app = express();
const cors = require('cors');
app.use(cors());

require('dotenv').config();


connectDB();

app.use(express.json());

app.use('/api/transactions', transactionRoutes);


app.get('/', (req, res) => {
  res.send('Money Tracker API running');
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});