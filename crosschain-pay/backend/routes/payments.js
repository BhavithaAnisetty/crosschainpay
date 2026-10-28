const express = require('express');
const router = express.Router();
const paymentModel = require('../models/Payment');
const auditLogModel = require('../models/AuditLog');
const oracleService = require('../services/oracle');
const blockchainService = require('../services/blockchain');
const { requireAuth } = require('../middleware/auth');

// Get payment stats
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const stats = await paymentModel.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get estimate quote
router.get('/estimate', requireAuth, (req, res) => {
  try {
    const { amount, currency } = req.query;
    const estimate = oracleService.getEstimate(amount || 1000, currency || 'INR');
    res.json(estimate);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List transactions
router.get('/', requireAuth, async (req, res) => {
  try {
    const { search, status, limit } = req.query;
    let payments = await paymentModel.getAll({}, limit ? Number(limit) : 100);

    // Apply search filter if present
    if (search) {
      const s = search.toLowerCase();
      payments = payments.filter(p =>
        p.paymentId.toLowerCase().includes(s) ||
        p.beneficiaryName.toLowerCase().includes(s) ||
        p.destinationCountry.toLowerCase().includes(s) ||
        (p.txHash && p.txHash.toLowerCase().includes(s))
      );
    }

    // Apply status filter if present
    if (status && status !== 'All') {
      payments = payments.filter(p => p.status.toLowerCase() === status.toLowerCase());
    }

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create and record payment
router.post('/', requireAuth, async (req, res) => {
  try {
    const { beneficiaryName, destinationCountry, paymentAmount, destinationCurrency, purpose, clientTxHash, clientBlockNumber, walletAddress } = req.body;

    if (!beneficiaryName || !destinationCountry || !paymentAmount || !destinationCurrency) {
      return res.status(400).json({ error: 'Beneficiary name, destination country, payment amount, and currency are required.' });
    }

    const numAmount = Number(paymentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be a positive number greater than zero.' });
    }

    // Educational compliance rule: Max $50,000 single transfer cap
    if (numAmount > 50000) {
      return res.status(400).json({ error: 'Transfer exceeds maximum single transaction cap of $50,000.00 USD.' });
    }

    // Calculate conversion
    const quote = oracleService.getEstimate(numAmount, destinationCurrency);
    const paymentId = 'PAY-' + Math.floor(100000 + Math.random() * 900000) + '-' + destinationCountry.slice(0, 2).toUpperCase();

    // Record on blockchain
    let txHash = clientTxHash;
    let blockNumber = clientBlockNumber;
    let senderAddress = walletAddress || req.user.walletAddress;

    if (!txHash) {
      const onChainRecord = await blockchainService.recordPaymentOnChain({
        paymentId,
        senderAddress,
        beneficiary: beneficiaryName,
        destinationCountry,
        destinationCurrency,
        amount: numAmount
      });
      txHash = onChainRecord.txHash;
      blockNumber = onChainRecord.blockNumber;
    }

    // Persist Payment to MongoDB
    const payment = await paymentModel.create({
      paymentId,
      userId: req.user.id,
      senderName: req.user.name,
      senderAddress,
      beneficiaryName,
      destinationCountry,
      paymentAmount: numAmount,
      sourceCurrency: 'USD',
      destinationCurrency: destinationCurrency.toUpperCase(),
      purpose: purpose || 'General Settlement',
      exchangeRate: quote.rate,
      estimatedFee: quote.estimatedFee,
      convertedAmount: quote.convertedAmount,
      status: 'Settled',
      txHash,
      blockNumber,
      contractAddress: blockchainService.contractAddress
    });

    // Create Audit Log
    await auditLogModel.log({
      paymentId,
      txHash,
      blockNumber,
      initiatingAddress: senderAddress,
      eventType: 'PaymentRecorded',
      verificationStatus: 'VERIFIED_ON_CHAIN',
      details: `Smart contract validated transfer of ${numAmount} USD to ${beneficiaryName} (${destinationCountry}) -> ${quote.convertedAmount} ${destinationCurrency.toUpperCase()}`
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get single payment
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const payment = await paymentModel.getById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
