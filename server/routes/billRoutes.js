const express = require('express');
const router = express.Router();
const {
  getBills,
  getBillById,
  createBill,
  triggerMonthlyBills,
  updateBill,
  cancelBill,
  getPendingBills
} = require('../controllers/billController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getBills);
router.get('/pending', verifyToken, getPendingBills);
router.post('/generate-monthly', verifyToken, requireAdmin, triggerMonthlyBills);
router.post('/', verifyToken, requireAdmin, createBill);
router.get('/:id', verifyToken, getBillById);
router.put('/:id', verifyToken, requireAdmin, updateBill);
router.put('/:id/cancel', verifyToken, requireAdmin, cancelBill);

module.exports = router;
