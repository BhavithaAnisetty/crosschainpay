const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'crosschain_pay';

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
    this.uri = MONGODB_URI;
    this.dbName = DB_NAME;

    // Resilient fallback storage
    this.memory = {
      users: [],
      payments: [],
      beneficiaries: [],
      audit_logs: []
    };
  }

  async connect() {
    try {
      this.client = new MongoClient(this.uri, { serverSelectionTimeoutMS: 2500 });
      await this.client.connect();
      this.db = this.client.db(this.dbName);
      this.isConnected = true;
      console.log(`[MongoDB] Connected to database: "${this.dbName}" at ${this.uri}`);

      // Setup indexes
      await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await this.db.collection('payments').createIndex({ paymentId: 1 }, { unique: true });
      await this.db.collection('beneficiaries').createIndex({ id: 1 }, { unique: true });
      await this.db.collection('audit_logs').createIndex({ txHash: 1 });
      return true;
    } catch (err) {
      console.warn(`[MongoDB Warning] Could not connect to MongoDB (${err.message}). Using in-memory fallback.`);
      this.isConnected = false;
      return false;
    }
  }

  collection(name) {
    if (this.isConnected && this.db) {
      return this.db.collection(name);
    }
    // Return an in-memory collection proxy
    return this.createMemoryCollection(name);
  }

  createMemoryCollection(name) {
    if (!this.memory[name]) this.memory[name] = [];
    const store = this.memory[name];

    return {
      find: (query = {}) => ({
        sort: (sortObj = {}) => ({
          limit: (n = 100) => ({
            toArray: async () => {
              let res = store.filter(doc => matchesQuery(doc, query));
              const sortKey = Object.keys(sortObj)[0];
              if (sortKey) {
                const dir = sortObj[sortKey];
                res.sort((a, b) => (a[sortKey] > b[sortKey] ? dir : -dir));
              }
              return res.slice(0, n);
            }
          }),
          toArray: async () => store.filter(doc => matchesQuery(doc, query))
        }),
        toArray: async () => store.filter(doc => matchesQuery(doc, query))
      }),
      findOne: async (query = {}) => store.find(doc => matchesQuery(doc, query)) || null,
      insertOne: async (doc) => {
        store.push({ ...doc });
        return { insertedId: doc._id || doc.id };
      },
      updateOne: async (query, update) => {
        const doc = store.find(d => matchesQuery(d, query));
        if (doc && update.$set) {
          Object.assign(doc, update.$set);
        }
        return { modifiedCount: doc ? 1 : 0 };
      },
      deleteOne: async (query) => {
        const idx = store.findIndex(d => matchesQuery(d, query));
        if (idx >= 0) {
          store.splice(idx, 1);
          return { deletedCount: 1 };
        }
        return { deletedCount: 0 };
      },
      countDocuments: async (query = {}) => store.filter(doc => matchesQuery(doc, query)).length
    };
  }
}

function matchesQuery(doc, query) {
  for (const key of Object.keys(query)) {
    if (doc[key] !== query[key]) return false;
  }
  return true;
}

module.exports = new Database();
