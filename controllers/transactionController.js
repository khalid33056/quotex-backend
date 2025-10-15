// controllers/transactionController.js
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const tonService = require('../services/tonService');
const { v4: uuidv4 } = require('uuid');

class TransactionController {
  // Process presale purchase
  async processPresalePurchase(req, res) {
    try {
      const { userId, tonAmount, txHash } = req.body;
      
      const user = await User.findByUserId(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify transaction
      const verification = await tonService.verifyTransaction(
        user.walletAddress,
        tonAmount,
        Date.now() - 300000 // 5 minutes window
      );

      if (!verification.isValid) {
        return res.status(400).json({ error: 'Transaction verification failed' });
      }

      const PRESALE_RATE = 7.0;
      const qtxAmount = tonAmount * PRESALE_RATE;

      // Update user balance
      user.balance += qtxAmount;
      await user.save();

      // Record transaction
      const transaction = new Transaction({
        transactionId: uuidv4(),
        userId,
        type: 'presale',
        amount: qtxAmount,
        tonAmount,
        token: 'QTX',
        status: 'completed',
        txHash,
        metadata: {
          rate: PRESALE_RATE,
          tonAmount
        }
      });
      await transaction.save();

      // Check for presale bonus task
      if (tonAmount >= 0.1) {
        await this.checkPresaleBonusTask(userId);
      }

      res.json({
        success: true,
        qtxAmount,
        newBalance: user.balance,
        transactionId: transaction.transactionId
      });
    } catch (error) {
      console.error('Process presale purchase error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Process boost purchase
  async processBoostPurchase(req, res) {
    try {
      const { userId, boostId, tonAmount, txHash } = req.body;
      
      const user = await User.findByUserId(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify transaction
      const verification = await tonService.verifyTransaction(
        user.walletAddress,
        tonAmount,
        Date.now() - 300000
      );

      if (!verification.isValid) {
        return res.status(400).json({ error: 'Transaction verification failed' });
      }

      // Get boost details
      const boost = this.getBoostDetails(boostId);
      if (!boost) {
        return res.status(400).json({ error: 'Invalid boost package' });
      }

      // Activate boost
      user.activeBoost = {
        multiplier: boost.multiplier,
        endTime: Date.now() + (boost.durationHours * 60 * 60 * 1000),
        name: boost.name
      };
      await user.save();

      // Record transaction
      const transaction = new Transaction({
        transactionId: uuidv4(),
        userId,
        type: 'boost_purchase',
        amount: 0,
        tonAmount,
        token: 'TON',
        status: 'completed',
        txHash,
        metadata: {
          boostId,
          boostName: boost.name,
          multiplier: boost.multiplier,
          durationHours: boost.durationHours
        }
      });
      await transaction.save();

      res.json({
        success: true,
        boost: user.activeBoost,
        message: 'Boost activated successfully'
      });
    } catch (error) {
      console.error('Process boost purchase error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Process farm claim
  async processFarmClaim(req, res) {
    try {
      const { userId } = req.body;
      
      const user = await User.findByUserId(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Check if farm is ready
      const now = Date.now();
      if (user.farmReadyTime > now) {
        return res.status(400).json({ 
          error: 'Farm not ready',
          timeRemaining: user.farmReadyTime - now
        });
      }

      const BASE_FARMING_REWARD = 0.2;
      const boostMultiplier = user.activeBoost.endTime > now ? user.activeBoost.multiplier : 1.0;
      const baseReward = BASE_FARMING_REWARD * boostMultiplier;

      // Calculate referral commission
      let commission = 0;
      if (user.referredBy) {
        commission = BASE_FARMING_REWARD * 0.10;
        // Add commission to referrer
        await this.addReferralCommission(user.referredBy, commission, userId);
      }

      const totalReward = baseReward + commission;

      // Update user
      user.balance += totalReward;
      user.farmClaimCount += 1;
      user.farmReadyTime = now + (6 * 60 * 60 * 1000); // 6 hours
      await user.save();

      // Record transaction
      const transaction = new Transaction({
        transactionId: uuidv4(),
        userId,
        type: 'farm_claim',
        amount: totalReward,
        token: 'QTX',
        status: 'completed',
        metadata: {
          baseReward,
          commission,
          boostMultiplier
        }
      });
      await transaction.save();

      res.json({
        success: true,
        reward: totalReward,
        baseReward,
        commission,
        newBalance: user.balance,
        nextClaimTime: user.farmReadyTime
      });
    } catch (error) {
      console.error('Process farm claim error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async addReferralCommission(referrerId, commission, referredUserId) {
    try {
      const referrer = await User.findByUserId(referrerId);
      if (referrer) {
        referrer.balance += commission;
        await referrer.save();

        // Record referral commission transaction
        const transaction = new Transaction({
          transactionId: uuidv4(),
          userId: referrerId,
          type: 'referral_commission',
          amount: commission,
          token: 'QTX',
          status: 'completed',
          metadata: {
            fromUser: referredUserId,
            commissionRate: '10%'
          }
        });
        await transaction.save();
      }
    } catch (error) {
      console.error('Add referral commission error:', error);
    }
  }

  getBoostDetails(boostId) {
    const BOOST_PACKAGES = [
      { name: "Bronze Miner", multiplier: 1.5, durationHours: 24, priceTon: 0.1 },
      { name: "Silver Drill", multiplier: 2.0, durationHours: 48, priceTon: 0.25 },
      { name: "Gold Rig", multiplier: 3.0, durationHours: 72, priceTon: 0.5 },
      { name: "Diamond Core", multiplier: 5.0, durationHours: 120, priceTon: 1.0 },
      { name: "Mega Whale", multiplier: 10.0, durationHours: 168, priceTon: 2.5 },
    ];
    
    return BOOST_PACKAGES[boostId];
  }

  async checkPresaleBonusTask(userId) {
    // Implementation for presale bonus task
    // This would update the user's task completion status
  }
}

module.exports = new TransactionController();