// routes/taskRoutes.js
const express = require('express');
const taskController = require('../controllers/taskController');

const router = express.Router();

router.post('/complete', taskController.completeTask);
router.post('/quotex-id', taskController.submitQuotexId);
router.post('/daily-checkin', taskController.claimDailyCheckin);

module.exports = router;