// controllers/userController.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');
const { generateReferralCode } = require('../utils/helpers');

class UserController {
  // Get user profile
  async getUserProfile(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findByUserId(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Remove sensitive data
      const { referralCode, referredBy, ...userData } = user;
      
      res.json(userData);
    } catch (error) {
      console.error('Get user profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Create or update user
  async createOrUpdateUser(req, res) {
    try {
      const { userId, walletAddress, referralCode } = req.body;
      
      let user = await User.findByUserId(userId);
      
      if (user) {
        // Update existing user
        if (walletAddress && !user.walletAddress) {
          user.walletAddress = walletAddress;
          await user.save();
        }
      } else {
        // Create new user
        let referredBy = null;
        
        // Check if referral code is valid
        if (referralCode) {
          const referrer = await User.findByReferralCode(referralCode);
          if (referrer) {
            referredBy = referrer.userId;
            // Update referrer's count
            await User.updateUser(referredBy, {
              referralCount: (referrer.referralCount || 0) + 1
            });
          }
        }

        user = await User.createUser({
          userId,
          walletAddress,
          referralCode: generateReferralCode(),
          referredBy,
          balance: 0.0,
          farmClaimCount: 0,
          referralCount: 0,
          currentRank: 0
        });
      }

      res.json(user);
    } catch (error) {
      console.error('Create/update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Claim welcome reward
  async claimWelcomeReward(req, res) {
    try {
      const { userId } = req.body;
      const user = await User.findByUserId(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (user.welcomeClaimed) {
        return res.status(400).json({ error: 'Welcome reward already claimed' });
      }

      const WELCOME_REWARD = 1.0;
      
      // Update user balance
      user.balance += WELCOME_REWARD;
      user.welcomeClaimed = true;
      await user.save();

      // Record transaction
      const transaction = new Transaction({
        transactionId: uuidv4(),
        userId,
        type: 'welcome_reward',
        amount: WELCOME_REWARD,
        token: 'QTX',
        status: 'completed'
      });
      await transaction.save();

      res.json({
        success: true,
        reward: WELCOME_REWARD,
        newBalance: user.balance
      });
    } catch (error) {
      console.error('Claim welcome reward error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get user statistics
  async getUserStats(req, res) {
    try {
      const { userId } = req.params;
      const user = await User.findByUserId(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const stats = {
        balance: user.balance,
        farmClaimCount: user.farmClaimCount,
        referralCount: user.referralCount,
        currentRank: user.currentRank,
        dailyStreak: user.dailyCheckin.streak,
        totalEarned: await this.calculateTotalEarned(userId)
      };

      res.json(stats);
    } catch (error) {
      console.error('Get user stats error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async calculateTotalEarned(userId) {
    const transactions = await Transaction.findByUserId(userId);
    return transactions
      .filter(tx => tx.type.includes('reward') || tx.type === 'farm_claim')
      .reduce((total, tx) => total + tx.amount, 0);
  }
}

module.exports = new UserController();