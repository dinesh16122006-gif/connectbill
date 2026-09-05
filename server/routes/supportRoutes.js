const express = require('express');
const router = express.Router();
const {
  submitTicket,
  getTickets,
  updateTicketStatus
} = require('../controllers/supportController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.post('/', submitTicket); // Can be submitted by customer or visitor
router.get('/', verifyToken, requireAdmin, getTickets);
router.put('/:id', verifyToken, requireAdmin, updateTicketStatus);

module.exports = router;
