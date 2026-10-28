const db = require('../config/db');

class BeneficiaryModel {
  async getAllForUser(userId) {
    return await db.collection('beneficiaries').find({ userId }).toArray();
  }

  async getById(id) {
    return await db.collection('beneficiaries').findOne({ id });
  }

  async create({ userId, name, country, currency, bankName, accountNumber, swiftBic }) {
    if (!name || !country || !currency || !accountNumber) {
      throw new Error('Name, country, currency, and account number are required');
    }

    const beneficiary = {
      id: 'BEN-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      userId,
      name,
      country: country.toUpperCase(),
      currency: currency.toUpperCase(),
      bankName: bankName || 'Standard Chartered',
      accountNumber,
      swiftBic: swiftBic || 'SCBLUS33XXX',
      createdAt: new Date().toISOString()
    };

    await db.collection('beneficiaries').insertOne(beneficiary);
    return beneficiary;
  }

  async update(id, userId, updates) {
    const existing = await db.collection('beneficiaries').findOne({ id, userId });
    if (!existing) throw new Error('Beneficiary not found or unauthorized');

    const cleanUpdates = {};
    ['name', 'country', 'currency', 'bankName', 'accountNumber', 'swiftBic'].forEach(field => {
      if (updates[field] !== undefined) cleanUpdates[field] = updates[field];
    });

    await db.collection('beneficiaries').updateOne({ id, userId }, { $set: cleanUpdates });
    return await this.getById(id);
  }

  async delete(id, userId) {
    const res = await db.collection('beneficiaries').deleteOne({ id, userId });
    return res.deletedCount > 0;
  }

  async seedDefaultBeneficiaries(userId) {
    const defaultList = [
      {
        userId,
        name: 'Priya Sharma',
        country: 'India',
        currency: 'INR',
        bankName: 'HDFC Bank Ltd',
        accountNumber: '50100492817291',
        swiftBic: 'HDFCINBBXXX'
      },
      {
        userId,
        name: 'Liam O’Connor',
        country: 'United Kingdom',
        currency: 'GBP',
        bankName: 'Barclays Bank UK',
        accountNumber: '204519928371',
        swiftBic: 'BARCGB22XXX'
      },
      {
        userId,
        name: 'Camille Laurent',
        country: 'France',
        currency: 'EUR',
        bankName: 'BNP Paribas',
        accountNumber: 'FR7630004012345678901234567',
        swiftBic: 'BNPAFR22XXX'
      }
    ];

    for (const b of defaultList) {
      const existing = await db.collection('beneficiaries').findOne({ userId, name: b.name });
      if (!existing) {
        await this.create(b);
      }
    }
  }
}

module.exports = new BeneficiaryModel();
