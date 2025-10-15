// models/User.js
const { db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

class User {
  constructor(data) {
    this.userId = data.userId;
    this.walletAddress = data.walletAddress;
    this.balance = data.balance || 0.0;
    this.farmClaimCount = data.farmClaimCount || 0;
    this.referralCount = data.referralCount || 0;
    this.currentRank = data.currentRank || 0;
    this.referralCode = data.referralCode;
    this.referredBy = data.referredBy;
    this.farmReadyTime = data.farmReadyTime || 0;
    this.activeBoost = data.activeBoost || {
      multiplier: 1.0,
      endTime: 0,
      name: 'None',
    };
    this.dailyCheckin = data.dailyCheckin || {
      streak: 0,
      lastClaim: 0,
    };
    this.welcomeClaimed = data.welcomeClaimed || false;
    this.createdAt = data.createdAt || Date.now();
    this.updatedAt = data.updatedAt || Date.now();
  }

  async save() {
    this.updatedAt = Date.now();
    await db.collection(COLLECTIONS.USERS).doc(this.userId).set({
      ...this,
      updatedAt: this.updatedAt
    });
  }

  static async findByUserId(userId) {
    const doc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    if (!doc.exists) return null;
    return new User(doc.data());
  }

  static async findByWalletAddress(walletAddress) {
    const snapshot = await db.collection(COLLECTIONS.USERS)
      .where('walletAddress', '==', walletAddress)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return new User(snapshot.docs[0].data());
  }

  static async updateUser(userId, updateData) {
    updateData.updatedAt = Date.now();
    await db.collection(COLLECTIONS.USERS).doc(userId).update(updateData);
  }

  static async createUser(userData) {
    const user = new User(userData);
    await user.save();
    return user;
  }
}

module.exports = User;