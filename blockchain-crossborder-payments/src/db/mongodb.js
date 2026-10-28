const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'crossborder_payments';

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.connectionUri = MONGODB_URI;
    this.dbName = DB_NAME;

    // In-memory memory fallback cache in case MongoDB connection drops
    this.memoryStore = {
      blocks: [],
      transactions: [],
      participants: [],
      oracle_rates: [],
      audit_logs: []
    };
  }

  async connect() {
    try {
      this.client = new MongoClient(this.connectionUri, {
        serverSelectionTimeoutMS: 3000
      });
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.isConnected = true;
      console.log(`[MongoDB] Connected successfully to database: "${this.dbName}" at ${this.connectionUri}`);

      await this.initIndexes();
      return true;
    } catch (err) {
      console.warn(`[MongoDB Warning] Could not connect to MongoDB server (${err.message}). Using resilient in-memory storage fallback.`);
      this.isConnected = false;
      return false;
    }
  }

  async initIndexes() {
    if (!this.isConnected || !this.db) return;
    try {
      await this.db.collection('blocks').createIndex({ index: 1 }, { unique: true });
      await this.db.collection('blocks').createIndex({ hash: 1 }, { unique: true });
      await this.db.collection('transactions').createIndex({ txId: 1 }, { unique: true });
      await this.db.collection('participants').createIndex({ id: 1 }, { unique: true });
      await this.db.collection('audit_logs').createIndex({ timestamp: -1 });
      console.log('[MongoDB] Collection indexes initialized.');
    } catch (e) {
      console.warn('[MongoDB] Index creation notice:', e.message);
    }
  }

  // --- Collection Accessors with Resilient Fallback ---

  async insertBlock(block) {
    const doc = { ...block };
    if (this.isConnected && this.db) {
      await this.db.collection('blocks').insertOne(doc);
    }
    this.memoryStore.blocks.push(doc);
    return doc;
  }

  async getBlocks() {
    if (this.isConnected && this.db) {
      return await this.db.collection('blocks').find({}).sort({ index: 1 }).toArray();
    }
    return [...this.memoryStore.blocks].sort((a, b) => a.index - b.index);
  }

  async getBlockByIndex(index) {
    if (this.isConnected && this.db) {
      return await this.db.collection('blocks').findOne({ index: Number(index) });
    }
    return this.memoryStore.blocks.find(b => b.index === Number(index)) || null;
  }

  async getLatestBlock() {
    if (this.isConnected && this.db) {
      const latest = await this.db.collection('blocks').find({}).sort({ index: -1 }).limit(1).toArray();
      return latest[0] || null;
    }
    if (this.memoryStore.blocks.length === 0) return null;
    return this.memoryStore.blocks[this.memoryStore.blocks.length - 1];
  }

  async insertTransaction(tx) {
    const doc = { ...tx };
    if (this.isConnected && this.db) {
      await this.db.collection('transactions').insertOne(doc);
    }
    this.memoryStore.transactions.push(doc);
    return doc;
  }

  async updateTransaction(txId, updates) {
    if (this.isConnected && this.db) {
      await this.db.collection('transactions').updateOne({ txId }, { $set: updates });
    }
    const memTx = this.memoryStore.transactions.find(t => t.txId === txId);
    if (memTx) {
      Object.assign(memTx, updates);
    }
  }

  async getTransaction(txId) {
    if (this.isConnected && this.db) {
      return await this.db.collection('transactions').findOne({ txId });
    }
    return this.memoryStore.transactions.find(t => t.txId === txId) || null;
  }

  async getAllTransactions() {
    if (this.isConnected && this.db) {
      return await this.db.collection('transactions').find({}).sort({ createdAt: -1 }).toArray();
    }
    return [...this.memoryStore.transactions].reverse();
  }

  async upsertParticipant(participant) {
    const filter = { id: participant.id };
    if (this.isConnected && this.db) {
      await this.db.collection('participants').updateOne(
        filter,
        { $set: participant },
        { upsert: true }
      );
    }
    const idx = this.memoryStore.participants.findIndex(p => p.id === participant.id);
    if (idx >= 0) {
      this.memoryStore.participants[idx] = { ...participant };
    } else {
      this.memoryStore.participants.push({ ...participant });
    }
    return participant;
  }

  async getParticipant(id) {
    if (this.isConnected && this.db) {
      return await this.db.collection('participants').findOne({ id });
    }
    return this.memoryStore.participants.find(p => p.id === id) || null;
  }

  async getAllParticipants() {
    if (this.isConnected && this.db) {
      return await this.db.collection('participants').find({}).toArray();
    }
    return [...this.memoryStore.participants];
  }

  async logAudit(entry) {
    const logDoc = {
      ...entry,
      timestamp: new Date().toISOString()
    };
    if (this.isConnected && this.db) {
      await this.db.collection('audit_logs').insertOne(logDoc);
    }
    this.memoryStore.audit_logs.unshift(logDoc);
    if (this.memoryStore.audit_logs.length > 200) {
      this.memoryStore.audit_logs.pop();
    }
    return logDoc;
  }

  async getAuditLogs(limit = 50) {
    if (this.isConnected && this.db) {
      return await this.db.collection('audit_logs').find({}).sort({ timestamp: -1 }).limit(limit).toArray();
    }
    return this.memoryStore.audit_logs.slice(0, limit);
  }

  async saveOracleRate(rateRecord) {
    const doc = { ...rateRecord, recordedAt: new Date().toISOString() };
    if (this.isConnected && this.db) {
      await this.db.collection('oracle_rates').insertOne(doc);
    }
    this.memoryStore.oracle_rates.push(doc);
    return doc;
  }

  async getDbStats() {
    if (this.isConnected && this.db) {
      const blocksCount = await this.db.collection('blocks').countDocuments();
      const txCount = await this.db.collection('transactions').countDocuments();
      const participantsCount = await this.db.collection('participants').countDocuments();
      const auditCount = await this.db.collection('audit_logs').countDocuments();
      return {
        isConnected: true,
        type: 'MongoDB Official Driver',
        dbName: this.dbName,
        uri: this.connectionUri,
        counts: {
          blocks: blocksCount,
          transactions: txCount,
          participants: participantsCount,
          audit_logs: auditCount
        }
      };
    }
    return {
      isConnected: false,
      type: 'Resilient Local Memory Cache',
      dbName: this.dbName,
      uri: this.connectionUri,
      counts: {
        blocks: this.memoryStore.blocks.length,
        transactions: this.memoryStore.transactions.length,
        participants: this.memoryStore.participants.length,
        audit_logs: this.memoryStore.audit_logs.length
      }
    };
  }
}

module.exports = new Database();
