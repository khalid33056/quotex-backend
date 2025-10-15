// services/tonService.js
const axios = require('axios');
const { TON_CENTER_CONFIG, tonClient } = require('../config/ton');
const { v4: uuidv4 } = require('uuid');

class TonService {
  // Verify TON transaction
  async verifyTransaction(walletAddress, amount, timestamp) {
    try {
      const response = await axios.get(
        `${TON_CENTER_CONFIG.baseURL}/getTransactions`,
        {
          params: {
            address: walletAddress,
            limit: 10
          },
          headers: TON_CENTER_CONFIG.headers
        }
      );

      const transactions = response.data.result;
      
      // Find transaction matching criteria
      const validTransaction = transactions.find(tx => {
        const txTimestamp = tx.utime * 1000; // Convert to milliseconds
        const txAmount = parseFloat(tx.in_msg.value) / 1e9; // Convert from nanograms to TON
        
        return txTimestamp >= timestamp && 
               Math.abs(txAmount - amount) < 0.001 && // Allow small rounding difference
               tx.in_msg.destination === process.env.TON_RECEIVING_WALLET;
      });

      return {
        isValid: !!validTransaction,
        transaction: validTransaction
      };
    } catch (error) {
      console.error('TON transaction verification error:', error);
      throw new Error('Failed to verify transaction');
    }
  }

  // Get wallet balance
  async getWalletBalance(walletAddress) {
    try {
      const response = await axios.get(
        `${TON_CENTER_CONFIG.baseURL}/getAddressBalance`,
        {
          params: { address: walletAddress },
          headers: TON_CENTER_CONFIG.headers
        }
      );

      return parseFloat(response.data.result) / 1e9; // Convert to TON
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      return 0;
    }
  }

  // Generate payment link for presale/boost
  generatePaymentLink(amount, memo) {
    const receivingWallet = process.env.TON_RECEIVING_WALLET;
    const tonDeepLink = `ton://transfer/${receivingWallet}?amount=${amount * 1e9}&text=${encodeURIComponent(memo)}`;
    
    return {
      deepLink: tonDeepLink,
      receivingWallet,
      amount,
      memo
    };
  }

  // Monitor transaction status
  async monitorTransaction(txHash, timeout = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        const response = await axios.get(
          `${TON_CENTER_CONFIG.baseURL}/getTransaction`,
          {
            params: { hash: txHash },
            headers: TON_CENTER_CONFIG.headers
          }
        );

        if (response.data.ok) {
          return {
            status: 'confirmed',
            transaction: response.data.result
          };
        }
      } catch (error) {
        // Transaction might not be confirmed yet
      }

      // Wait 5 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    return { status: 'timeout' };
  }
}

module.exports = new TonService();