// config/constants.js
module.exports = {
  // Game Constants
  QTX_TOKEN: "QTX",
  TOTAL_SUPPLY: 10000000,
  BASE_FARMING_REWARD: parseFloat(process.env.BASE_FARMING_REWARD) || 0.2,
  FARMING_COOLDOWN_MS: (parseInt(process.env.FARMING_COOLDOWN_HOURS) || 6) * 60 * 60 * 1000,
  PRESALE_RATE: parseFloat(process.env.PRESALE_RATE) || 7.0,
  REFERRAL_COMMISSION_RATE: parseFloat(process.env.REFERRAL_COMMISSION_RATE) || 0.10,
  QUOTEX_REWARD_MS: (parseInt(process.env.QUOTEX_REWARD_HOURS) || 24) * 60 * 60 * 1000,
  WELCOME_REWARD: 1.0,

  // Boost Packages
  BOOST_PACKAGES: [
    { name: "Bronze Miner", multiplier: 1.5, durationHours: 24, priceTon: 0.1 },
    { name: "Silver Drill", multiplier: 2.0, durationHours: 48, priceTon: 0.25 },
    { name: "Gold Rig", multiplier: 3.0, durationHours: 72, priceTon: 0.5 },
    { name: "Diamond Core", multiplier: 5.0, durationHours: 120, priceTon: 1.0 },
    { name: "Mega Whale", multiplier: 10.0, durationHours: 168, priceTon: 2.5 },
  ],

  // Daily Rewards
  DAILY_REWARDS_SCHEDULE: [
    0.2, 0.2, 0.2, 0.2, 0.4, 
    0.4, 0.4, 0.4, 0.4, 0.6, 
    0.6, 0.6, 0.6, 0.6, 3.0, 
    0.8, 0.8, 0.8, 0.8, 1.0, 
    1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 10.0
  ],

  // Collection Names
  COLLECTIONS: {
    USERS: 'users',
    TRANSACTIONS: 'transactions',
    TASKS: 'user_tasks',
    AIRDROPS: 'airdrops'
  }
};