const express = require('express');
const router = express.Router();

const {
    addTransaction,
    extendTransaction,
    getTransactions,
    getDashboard,
    getByDateRange,
    markAsPaid
  } = require('../controllers/transactionController');

router.post('/add', addTransaction);
router.put('/extend/:id', extendTransaction);
router.get('/', getTransactions);
router.get('/dashboard', getDashboard);
router.get('/range', getByDateRange);
router.put('/paid/:id', markAsPaid);

module.exports = router;