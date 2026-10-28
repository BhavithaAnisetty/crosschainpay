const db = require('../config/db');

class PaymentModel {
  async getAll(query = {}, limit = 50) {
    return await db.collection('payments').find(query).sort({ createdAt: -1 }).limit(limit).toArray();
  }

  async getById(paymentId) {
    return await db.collection('payments').findOne({ paymentId });
  }

  async create(paymentData) {
    const payment = {
      paymentId: paymentData.paymentId,
      userId: paymentData.userId,
      senderName: paymentData.senderName,
      senderAddress: paymentData.senderAddress,
      beneficiaryName: paymentData.beneficiaryName,
      destinationCountry: paymentData.destinationCountry,
      paymentAmount: Number(paymentData.paymentAmount),
      sourceCurrency: paymentData.sourceCurrency || 'USD',
      destinationCurrency: paymentData.destinationCurrency,
      purpose: paymentData.purpose || 'Trade Settlement',
      exchangeRate: Number(paymentData.exchangeRate),
      estimatedFee: Number(paymentData.estimatedFee || 0.0),
      convertedAmount: Number(paymentData.convertedAmount),
      status: paymentData.status || 'Recorded', // 'Recorded', 'Settled', 'Failed'
      txHash: paymentData.txHash,
      blockNumber: paymentData.blockNumber,
      gasUsed: paymentData.gasUsed || '21,000',
      network: paymentData.network || 'Hardhat Localhost (Chain ID 31337)',
      contractAddress: paymentData.contractAddress,
      isVerifiedOnChain: paymentData.isVerifiedOnChain || true,
      createdAt: paymentData.createdAt || new Date().toISOString(),
      settledAt: paymentData.settledAt || new Date().toISOString()
    };

    await db.collection('payments').insertOne(payment);
    return payment;
  }

  async updateStatus(paymentId, status, details = {}) {
    await db.collection('payments').updateOne(
      { paymentId },
      { $set: { status, ...details, updatedAt: new Date().toISOString() } }
    );
    return await this.getById(paymentId);
  }

  async getStats() {
    const all = await db.collection('payments').find({}).toArray();
    const successful = all.filter(p => p.status === 'Settled' || p.status === 'Recorded');
    const pending = all.filter(p => p.status === 'Pending');
    const failed = all.filter(p => p.status === 'Failed');

    const totalVolumeUSD = successful.reduce((sum, p) => sum + (p.paymentAmount || 0), 0);

    return {
      totalVolumeUSD: Number(totalVolumeUSD.toFixed(2)),
      totalCount: all.length,
      successfulCount: successful.length,
      pendingCount: pending.length,
      failedCount: failed.length
    };
  }

  async seedDefaultPayments(user) {
    const count = await db.collection('payments').countDocuments({});
    if (count > 0) return;

    const samplePayments = [
      {
        paymentId: 'PAY-892104-IN',
        userId: user.id,
        senderName: user.name,
        senderAddress: user.walletAddress,
        beneficiaryName: 'Priya Sharma',
        destinationCountry: 'India',
        paymentAmount: 1500.00,
        sourceCurrency: 'USD',
        destinationCurrency: 'INR',
        purpose: 'Software Consultancy Services',
        exchangeRate: 83.45,
        estimatedFee: 0.00,
        convertedAmount: 125175.00,
        status: 'Settled',
        txHash: '0x9a4f2184e1b829dc7a184e03bca710e4b859e8749a203fbc19e34891bca72091',
        blockNumber: 104,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        settledAt: new Date(Date.now() - 86400000 * 2 + 12000).toISOString()
      },
      {
        paymentId: 'PAY-892105-GB',
        userId: user.id,
        senderName: user.name,
        senderAddress: user.walletAddress,
        beneficiaryName: 'Liam O’Connor',
        destinationCountry: 'United Kingdom',
        paymentAmount: 3200.00,
        sourceCurrency: 'USD',
        destinationCurrency: 'GBP',
        purpose: 'Equipment Supply Chain',
        exchangeRate: 0.79,
        estimatedFee: 0.00,
        convertedAmount: 2528.00,
        status: 'Settled',
        txHash: '0x4f128be204a9e3381a7d65bca891726ea984719284cb91837eab102948197e41',
        blockNumber: 105,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        settledAt: new Date(Date.now() - 86400000 + 15000).toISOString()
      },
      {
        paymentId: 'PAY-892106-FR',
        userId: user.id,
        senderName: user.name,
        senderAddress: user.walletAddress,
        beneficiaryName: 'Camille Laurent',
        destinationCountry: 'France',
        paymentAmount: 850.00,
        sourceCurrency: 'USD',
        destinationCurrency: 'EUR',
        purpose: 'Subscription & Cloud Services',
        exchangeRate: 0.92,
        estimatedFee: 0.00,
        convertedAmount: 782.00,
        status: 'Settled',
        txHash: '0x7e83910cb49a710293847a9e182374b910e982371904a8b71029384e91028374',
        blockNumber: 106,
        createdAt: new Date().toISOString(),
        settledAt: new Date(Date.now() + 10000).toISOString()
      }
    ];

    for (const p of samplePayments) {
      await this.create(p);
    }
  }
}

module.exports = new PaymentModel();
