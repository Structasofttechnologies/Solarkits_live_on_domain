const express = require('express');
const router = express.Router();
const {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controller/epc.controller');

router.get('/', getAllPlans);
router.get('/:id', getPlanById);
router.post('/', createPlan);
router.put('/:id', updatePlan);
router.patch('/:id', updatePlan);
router.delete('/:id', deletePlan);

module.exports = router;
