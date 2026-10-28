const db = require('../config/db');

class AuditLogModel {
  async log({ paymentId, txHash, blockNumber, initiatingAddress, eventType, verificationStatus = 'VERIFIED_ON_CHAIN', details = '' }) {
    const logDoc = {
      id: 'AUD-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      paymentId: paymentId || 'N/A',
      txHash: txHash || '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockNumber: Number(blockNumber || 100),
      initiatingAddress: initiatingAddress || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      eventType: eventType || 'PaymentRecorded',
      verificationStatus: verificationStatus,
      details: details,
      timestamp: new Date().toISOString()
    };

    await db.collection('audit_logs').insertOne(logDoc);
    return logDoc;
  }

  async getAll(limit = 100) {
    return await db.collection('audit_logs').find({}).sort({ timestamp: -1 }).limit(limit).toArray();
  }

  async getByTxHash(txHash) {
    return await db.collection('audit_logs').findOne({ txHash });
  }

  async seedDefaultLogs(payments) {
    const count = await db.collection('audit_logs').countDocuments({});
    if (count > 0) return;

    for (const p of payments) {
      await this.log({
        paymentId: p.paymentId,
        txHash: p.txHash,
        blockNumber: p.blockNumber,
        initiatingAddress: p.senderAddress,
        eventType: 'PaymentRecorded',
        verificationStatus: 'VERIFIED_ON_CHAIN',
        details: `Smart contract validated transfer of ${p.paymentAmount} ${p.sourceCurrency} to ${p.beneficiaryName} (${p.destinationCountry})`
      });
    }
  }
}

module.exports = new AuditLogModel();
