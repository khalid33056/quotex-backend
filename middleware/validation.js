// middleware/validation.js
const Joi = require('joi');

const validateUser = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    walletAddress: Joi.string().optional(),
    referralCode: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

const validateTransaction = (req, res, next) => {
  const schema = Joi.object({
    userId: Joi.string().required(),
    amount: Joi.number().min(0.1).required(),
    txHash: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

module.exports = { validateUser, validateTransaction };