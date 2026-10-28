require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const userModel = require('./models/User');
const beneficiaryModel = require('./models/Beneficiary');
const paymentModel = require('./models/Payment');
const auditLogModel = require('./models/AuditLog');
const blockchainService = require('./services/blockchain');

const authRoutes = require('./routes/auth');
const paymentsRoutes = require('./routes/payments');
const beneficiariesRoutes = require('./routes/beneficiaries');
const auditRoutes = require('./routes/audit');
const path = require('path');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_DIST = path.join(__dirname, '../frontend/dist');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(FRONTEND_DIST));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/beneficiaries', beneficiariesRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/admin', adminRoutes);

// Health Check
app.get('/api/health', async (req, res) => {
  const nodeStatus = await blockchainService.checkNodeStatus();
  res.json({
    status: 'ONLINE',
    app: 'CrossChain Pay Backend API',
    version: '1.0.0',
    database: {
      connected: db.isConnected,
      dbName: db.dbName
    },
    blockchain: nodeStatus,
    timestamp: new Date().toISOString()
  });
});

// Serve frontend for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[API Error]:', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

async function bootstrap() {
  await db.connect();

  // Seed default credentials and data
  await userModel.seedDefaultUsers();
  const demoSender = await userModel.findByEmail('sender@crosschain.pay');
  if (demoSender) {
    await beneficiaryModel.seedDefaultBeneficiaries(demoSender.id);
    await paymentModel.seedDefaultPayments(demoSender);
    const existingPayments = await paymentModel.getAll({}, 10);
    await auditLogModel.seedDefaultLogs(existingPayments);
  }

  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`  CROSSCHAIN PAY API SERVER RUNNING ON PORT ${PORT}            `);
    console.log(`================================================================`);
    console.log(`  API Health  : http://localhost:${PORT}/api/health`);
    console.log(`  MongoDB     : ${db.dbName} (${db.isConnected ? 'CONNECTED' : 'IN-MEMORY'})`);
    console.log(`  Demo Sender : sender@crosschain.pay / password123`);
    console.log(`  Demo Admin  : admin@crosschain.pay / admin123`);
    console.log(`================================================================`);
  });
}

bootstrap().catch(err => {
  console.error('Fatal bootstrap error:', err);
});
