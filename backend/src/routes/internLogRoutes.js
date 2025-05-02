const express = require('express');
const router = express.Router();
const {
  timeIn,
  timeOut,
  getTodayLog,
  getLogs,
  updateDescription,
  deleteLog
} = require('../controllers/internLogController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.post('/time-in', timeIn);
router.post('/time-out', timeOut);
router.get('/today', getTodayLog);
router.get('/', getLogs);
router.patch('/:id/description', updateDescription);
router.delete('/:id', deleteLog);

module.exports = router; 