// utils/helpers.js
const { v4: uuidv4 } = require('uuid');

const generateReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const formatTimeRemaining = (ms) => {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map(v => v.toString().padStart(2, '0'))
    .join(':');
};

const calculateFarmStatus = (farmReadyTime, boostMultiplier, referralCount) => {
  const now = Date.now();
  const msRemaining = farmReadyTime - now;
  const BASE_FARMING_REWARD = 0.2;
  
  const finalReward = BASE_FARMING_REWARD * boostMultiplier;
  const commission = referralCount > 0 ? BASE_FARMING_REWARD * 0.10 : 0;
  const totalClaimReward = finalReward + commission;

  if (msRemaining <= 0) {
    return {
      isReady: true,
      timeDisplay: "READY!",
      reward: totalClaimReward.toFixed(2),
      commission: commission.toFixed(2),
    };
  } else {
    return {
      isReady: false,
      timeDisplay: formatTimeRemaining(msRemaining),
      reward: totalClaimReward.toFixed(2),
      commission: commission.toFixed(2),
    };
  }
};

module.exports = {
  generateReferralCode,
  formatTimeRemaining,
  calculateFarmStatus
};