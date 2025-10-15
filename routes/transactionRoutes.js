// routes/transactionRoutes.js
const express = require('express');
const transactionController = require('../controllers/transactionController');

const router = express.Router();

router.post('/presale', transactionController.processPresalePurchase);
router.post('/boost', transactionController.processBoostPurchase);
router.post('/farm-claim', transactionController.processFarmClaim);

module.exports = router;