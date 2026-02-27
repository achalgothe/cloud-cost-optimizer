const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getCostOverview,
  getCostBreakdown,
  getCostForecast,
} = require('../controllers/costController');

router.use(protect);

router.get('/overview', getCostOverview);
router.get('/breakdown', getCostBreakdown);
router.get('/forecast', getCostForecast);

module.exports = router;
