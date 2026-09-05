const express = require('express');
const router = express.Router();
const {
  getPlans,
  createPlan,
  updatePlan,
  deletePlan
} = require('../controllers/planController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', verifyToken, getPlans);
router.post('/', verifyToken, requireAdmin, createPlan);
router.put('/:id', verifyToken, requireAdmin, updatePlan);
router.delete('/:id', verifyToken, requireAdmin, deletePlan);

module.exports = router;
