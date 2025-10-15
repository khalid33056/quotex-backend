// controllers/walletController.js
const User = require('../models/User');
const tonService = require('../services/tonService');

class WalletController {
  // Connect wallet to user
  async connectWallet(req, res) {
    try {
      const { userId, walletAddress, signature } = req.body;
      
      const user = await User.findByUserId(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify wallet connection (simplified - in production, verify signature)
      if (!this.verifyWalletSignature(walletAddress, signature)) {
        return res.status(400).json({ error: 'Invalid wallet signature' });
      }

      user.walletAddress = walletAddress;
      await user.save();

      // Get wallet balance
      const balance = await tonService.getWalletBalance(walletAddress);

      res.json({
        success: true,
        walletAddress,
        balance,
        message: 'Wallet connected successfully'
      });
    } catch (error) {
      console.error('Connect wallet error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Verify wallet signature (placeholder implementation)
  verifyWalletSignature(walletAddress, signature) {
    // In production, implement proper signature verification
    // This is a simplified version
    return !!walletAddress && !!signature;
  }

  // Get wallet info
  async getWalletInfo(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findByUserId(userId);
      
      if (!user || !user.walletAddress) {
        return res.status(404).json({ error: 'Wallet not connected' });
      }

      const balance = await tonService.getWalletBalance(user.walletAddress);

      res.json({
        walletAddress: user.walletAddress,
        balance,
        connected: true
      });
    } catch (error) {
      console.error('Get wallet info error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Generate payment request for presale/boost
  async generatePaymentRequest(req, res) {
    try {
      const { userId, amount, type, productId } = req.body;
      
      const user = await User.findByUserId(userId);
      if (!user || !user.walletAddress) {
        return res.status(400).json({ error: 'User not found or wallet not connected' });
      }

      const memo = `${type}_${productId}_${userId}`;
      const paymentLink = tonService.generatePaymentLink(amount, memo);

      res.json({
        success: true,
        paymentLink: paymentLink.deepLink,
        receivingWallet: paymentLink.receivingWallet,
        amount,
        memo
      });
    } catch (error) {
      console.error('Generate payment request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

module.exports = new WalletController();