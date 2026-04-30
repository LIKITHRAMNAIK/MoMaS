const express = require('express');
const connectDB = require('./config/db');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const cors = require('cors');

require('dotenv').config();

app.use(cors());
app.use(express.json());

connectDB();

// ✅ ONLY THIS ROUTE
app.use('/api/transactions', transactionRoutes);

app.get('/', (req, res) => {
  res.send('Money Tracker API running');
});

app.listen(5000, () => {
  console.log('Server running on port 5000');
});