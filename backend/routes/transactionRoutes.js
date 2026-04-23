const express = require('express');
const router = express.Router();

const {
  addTransaction,
  extendTransaction,
  getTransactions,
  getDashboard,
  getByDateRange,
  markAsPaid,
  getByPerson,
  updateTransaction,
  deleteTransaction
} = require('../controllers/transactionController');

router.post('/add', addTransaction);
router.put('/extend/:id', extendTransaction);
router.get('/', getTransactions);
router.get('/dashboard', getDashboard);
router.get('/range', getByDateRange);
router.put('/paid/:id', markAsPaid);
router.get('/person/:name', getByPerson);
router.get('/profile/:name', getByPerson);
router.put('/update/:id', updateTransaction);
router.delete('/delete/:id', deleteTransaction);


module.exports = router;