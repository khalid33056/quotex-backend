// models/Transaction.js
const { db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

class Transaction {
  constructor(data) {
    this.transactionId = data.transactionId;
    this.userId = data.userId;
    this.type = data.type; // 'presale', 'boost', 'farm_claim', 'task_reward', 'referral'
    this.amount = data.amount;
    this.token = data.token || 'QTX';
    this.tonAmount = data.tonAmount;
    this.status = data.status || 'pending'; // 'pending', 'completed', 'failed'
    this.txHash = data.txHash;
    this.metadata = data.metadata || {};
    this.createdAt = data.createdAt || Date.now();
  }

  async save() {
    await db.collection(COLLECTIONS.TRANSACTIONS).doc(this.transactionId).set(this);
  }

  static async findByUserId(userId, limit = 50) {
    const snapshot = await db.collection(COLLECTIONS.TRANSACTIONS)
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => new Transaction(doc.data()));
  }

  static async findByTxHash(txHash) {
    const snapshot = await db.collection(COLLECTIONS.TRANSACTIONS)
      .where('txHash', '==', txHash)
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    return new Transaction(snapshot.docs[0].data());
  }
}

module.exports = Transaction;