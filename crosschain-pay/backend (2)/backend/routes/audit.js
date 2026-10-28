const express = require('express');
const router = express.Router();
const auditLogModel = require('../models/AuditLog');
const blockchainService = require('../services/blockchain');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, async (req, res) => {
  try {
    const logs = await auditLogModel.getAll(100);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/verify', requireAuth, async (req, res) => {
  try {
    const { txHash } = req.body;
    if (!txHash) return res.status(400).json({ error: 'Transaction hash is required' });

    const auditEntry = await auditLogModel.getByTxHash(txHash);
    const verification = await blockchainService.verifyTransaction(txHash);

    res.json({
      ...verification,
      auditRecord: auditEntry || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
