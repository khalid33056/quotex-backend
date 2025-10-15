// routes/walletRoutes.js
const express = require('express');
const walletController = require('../controllers/walletController');

const router = express.Router();

router.post('/connect', walletController.connectWallet);
router.get('/:userId/info', walletController.getWalletInfo);
router.post('/payment-request', walletController.generatePaymentRequest);

module.exports = router;