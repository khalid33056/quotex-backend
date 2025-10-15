// controllers/taskController.js
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { v4: uuidv4 } = require('uuid');

class TaskController {
  // Complete task and reward user
  async completeTask(req, res) {
    try {
      const { userId, taskId, proof } = req.body;
      
      const user = await User.findByUserId(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const task = this.getTaskDetails(taskId);
      if (!task) {
        return res.status(400).json({ error: 'Invalid task' });
      }

      // Check if task already completed
      if (await this.isTaskCompleted(userId, taskId)) {
        return res.status(400).json({ error: 'Task already completed' });
      }

      // Verify task completion (simplified - in production, verify proof)
      if (!this.verifyTaskCompletion(taskId, proof)) {
        return res.status(400).json({ error: 'Task verification failed' });
      }

      // Reward user
      user.balance += task.reward;
      await user.save();

      // Record task completion
      await this.recordTaskCompletion(userId, taskId, proof);

      // Record transaction
      const transaction = new Transaction({
        transactionId: uuidv4(),
        userId,
        type: 'task_reward',
        amount: task.reward,
        token: 'QTX',
        status: 'completed',
        metadata: {
          taskId,
          taskName: task.title
        }
      });
      await transaction.save();

      res.json({
        success: true,
        reward: task.reward,
        newBalance: user.balance,
        taskCompleted: taskId
      });
    } catch (error) {
      console.error('Complete task error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Submit Quotex ID for verification
  async submitQuotexId(req, res) {
    try {
      const { userId, quotexId } = req.body;
      
      const user = await User.findByUserId(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Store Quotex ID and start verification timer
      await this.recordQuotexSubmission(userId, quotexId);

      res.json({
        success: true,
        message: 'Quotex ID submitted. Reward will be available in 24 hours.',
        verificationTime: Date.now() + (24 * 60 * 60 * 1000)
      });
    } catch (error) {
      console.error('Submit Quotex ID error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Claim daily check-in reward
  async claimDailyCheckin(req, res) {
    try {
      const { userId } = req.body;
      
      const user = await User.findByUserId(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const dailyCheckin = await this.processDailyCheckin(user);
      if (!dailyCheckin.canClaim) {
        return res.status(400).json({ 
          error: 'Daily check-in not available',
          nextClaim: dailyCheckin.nextClaim
        });
      }

      // Update user balance and streak
      user.balance += dailyCheckin.reward;
      user.dailyCheckin.streak = dailyCheckin.newStreak;
      user.dailyCheckin.lastClaim = Date.now();
      await user.save();

      // Record transaction
      const transaction = new Transaction({
        transactionId: uuidv4(),
        userId,
        type: 'daily_checkin',
        amount: dailyCheckin.reward,
        token: 'QTX',
        status: 'completed',
        metadata: {
          streak: dailyCheckin.newStreak,
          day: dailyCheckin.day
        }
      });
      await transaction.save();

      res.json({
        success: true,
        reward: dailyCheckin.reward,
        newBalance: user.balance,
        streak: dailyCheckin.newStreak,
        nextClaim: dailyCheckin.nextClaim
      });
    } catch (error) {
      console.error('Claim daily check-in error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async processDailyCheckin(user) {
    const DAILY_REWARDS_SCHEDULE = [
      0.2, 0.2, 0.2, 0.2, 0.4, 0.4, 0.4, 0.4, 0.4, 0.6,
      0.6, 0.6, 0.6, 0.6, 3.0, 0.8, 0.8, 0.8, 0.8, 1.0,
      1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 10.0
    ];

    const now = Date.now();
    const lastClaim = user.dailyCheckin.lastClaim;
    const lastClaimDate = new Date(lastClaim).toDateString();
    const today = new Date().toDateString();

    // Check if already claimed today
    if (lastClaimDate === today) {
      const nextClaim = new Date();
      nextClaim.setDate(nextClaim.getDate() + 1);
      nextClaim.setHours(0, 0, 0, 0);
      
      return {
        canClaim: false,
        nextClaim: nextClaim.getTime()
      };
    }

    // Calculate streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = yesterday.toDateString();
    
    let newStreak = user.dailyCheckin.streak;
    if (lastClaimDate === yesterdayString) {
      newStreak += 1;
    } else {
      newStreak = 1; // Reset streak if missed a day
    }

    // Calculate reward
    const rewardIndex = (newStreak - 1) % DAILY_REWARDS_SCHEDULE.length;
    const reward = DAILY_REWARDS_SCHEDULE[rewardIndex];

    const nextClaim = new Date();
    nextClaim.setDate(nextClaim.getDate() + 1);
    nextClaim.setHours(0, 0, 0, 0);

    return {
      canClaim: true,
      reward,
      newStreak,
      day: rewardIndex + 1,
      nextClaim: nextClaim.getTime()
    };
  }

  getTaskDetails(taskId) {
    const TASKS = {
      joinTelegram: { reward: 10.0, title: 'Join Telegram Channel' },
      followTwitter: { reward: 10.0, title: 'Follow us on X (Twitter)' },
      joinCommunity: { reward: 7.0, title: 'Join Telegram Community' },
      quotex: { reward: 12.5, title: 'Join Quotex platform' },
      presaleBonus: { reward: 15.0, title: 'Presale Purchase Bonus' }
    };
    
    return TASKS[taskId];
  }

  verifyTaskCompletion(taskId, proof) {
    // In production, implement proper verification for each task type
    // This is a simplified version
    return !!proof;
  }

  async isTaskCompleted(userId, taskId) {
    // Check if task is already completed in database
    // Implementation depends on your task storage structure
    return false;
  }

  async recordTaskCompletion(userId, taskId, proof) {
    // Record task completion in database
    // Implementation depends on your task storage structure
  }

  async recordQuotexSubmission(userId, quotexId) {
    // Record Quotex ID submission and start verification timer
  }
}

module.exports = new TaskController();