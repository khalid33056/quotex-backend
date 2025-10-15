// routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const { validateUser } = require('../middleware/validation');

const router = express.Router();

router.get('/:userId', userController.getUserProfile);
router.post('/', validateUser, userController.createOrUpdateUser);
router.post('/welcome-reward', userController.claimWelcomeReward);
router.get('/:userId/stats', userController.getUserStats);

module.exports = router;