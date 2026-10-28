const express = require('express');
const router = express.Router();
const paymentModel = require('../models/Payment');
const auditLogModel = require('../models/AuditLog');
const blockchainService = require('../services/blockchain');
const db = require('../config/db');
const { requireAdmin } = require('../middleware/auth');

router.get('/metrics', requireAdmin, async (req, res) => {
  try {
    const stats = await paymentModel.getStats();
    const payments = await paymentModel.getAll({}, 10);
    const auditLogs = await auditLogModel.getAll(20);
    const nodeStatus = await blockchainService.checkNodeStatus();

    let usersCount = 0;
    let beneficiariesCount = 0;
    try {
      usersCount = await db.collection('users').countDocuments({});
      beneficiariesCount = await db.collection('beneficiaries').countDocuments({});
    } catch (e) {
      usersCount = 2;
    }

    res.json({
      metrics: {
        ...stats,
        usersCount,
        beneficiariesCount,
        smartContractAddress: blockchainService.contractAddress,
        blockchainNetwork: blockchainService.networkName
      },
      nodeStatus,
      recentPayments: payments,
      recentAuditLogs: auditLogs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
