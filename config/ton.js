// config/ton.js

// Import TonWeb library
const TonWeb = require("tonweb");

// Initialize TonWeb HTTP provider
const tonweb = new TonWeb(
  new TonWeb.HttpProvider(
    process.env.TON_NETWORK === "mainnet"
      ? "https://toncenter.com/api/v2/jsonRPC" // Mainnet endpoint
      : "https://testnet.toncenter.com/api/v2/jsonRPC", // Testnet endpoint
    {
      apiKey: process.env.TON_CENTER_API_KEY, // Your TON API key
    }
  )
);

// TON Center config (for external API calls if needed)
const TON_CENTER_CONFIG = {
  baseURL:
    process.env.TON_NETWORK === "mainnet"
      ? "https://toncenter.com/api/v2/jsonRPC"
      : "https://testnet.toncenter.com/api/v2/jsonRPC",
  headers: {
    "X-API-Key": process.env.TON_CENTER_API_KEY,
  },
};

// Export the TonWeb instance and config
module.exports = { tonweb, TON_CENTER_CONFIG };
