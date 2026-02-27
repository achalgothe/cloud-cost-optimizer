const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getRecommendations,
  generateRecommendations,
  updateRecommendation,
  deleteRecommendation,
} = require('../controllers/recommendationController');

router.use(protect);

router.get('/', getRecommendations);
router.post('/generate', generateRecommendations);
router.put('/:id', updateRecommendation);
router.delete('/:id', deleteRecommendation);

module.exports = router;
