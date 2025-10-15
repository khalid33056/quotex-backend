// config/ton.js
const { TonClient } = require("@tonclient/core");
const { libNode } = require("@tonclient/lib-node");

TonClient.useBinaryLibrary(libNode);

const tonClient = new TonClient({
  network: {
    endpoints: [process.env.TON_NETWORK === 'mainnet' 
      ? 'https://mainnet.toncenter.com/api/v2'
      : 'https://testnet.toncenter.com/api/v2'
    ],
  },
});

const TON_CENTER_CONFIG = {
  baseURL: process.env.TON_CENTER_BASE_URL,
  headers: {
    'X-API-Key': process.env.TON_CENTER_API_KEY
  }
};

module.exports = { tonClient, TON_CENTER_CONFIG };