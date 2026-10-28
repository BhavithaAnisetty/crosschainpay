const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const db = require('./db/mongodb');
const blockchain = require('./blockchain/Blockchain');
const smartContract = require('./blockchain/SmartContract');
const oracle = require('./blockchain/Oracle');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '../public');

// MIME types for static files
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

/**
 * Helper to parse JSON request body
 */
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Helper to send JSON responses
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

/**
 * Serves static web frontend assets
 */
function serveStatic(req, res, pathname) {
  let filePath = pathname === '/' ? path.join(PUBLIC_DIR, 'index.html') : path.join(PUBLIC_DIR, pathname);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
}

/**
 * Main HTTP Request Dispatcher
 */
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    return res.end();
  }

  try {
    // ==========================================
    // API: SYSTEM STATUS & MONGODB STATS
    // ==========================================
    if (pathname === '/api/status' && method === 'GET') {
      const dbStats = await db.getDbStats();
      const blocks = await db.getBlocks();
      const validators = blockchain.getValidators();
      return sendJson(res, 200, {
        network: 'Permissioned Consortium Cross-Border Payment Rail',
        consensus: 'Proof of Authority (PoA)',
        blockHeight: blocks.length,
        pendingTransactions: blockchain.pendingTransactions.length,
        validators,
        database: dbStats,
        smartContractAddress: smartContract.contractAddress
      });
    }

    // ==========================================
    // API: PARTICIPANTS
    // ==========================================
    if (pathname === '/api/participants' && method === 'GET') {
      const participants = await db.getAllParticipants();
      return sendJson(res, 200, participants);
    }

    if (pathname === '/api/participants' && method === 'POST') {
      const body = await parseJsonBody(req);
      const participant = await smartContract.addParticipant(body);
      return sendJson(res, 201, participant);
    }

    if (pathname.startsWith('/api/participants/') && method === 'GET') {
      const id = pathname.replace('/api/participants/', '');
      const participant = await db.getParticipant(id);
      if (!participant) return sendJson(res, 404, { error: 'Participant not found' });
      return sendJson(res, 200, participant);
    }

    // ==========================================
    // API: FX ORACLE
    // ==========================================
    if (pathname === '/api/oracle/rates' && method === 'GET') {
      return sendJson(res, 200, oracle.getAllRates());
    }

    if (pathname === '/api/oracle/convert' && method === 'GET') {
      const { amount, from, to } = parsedUrl.query;
      if (!amount || !from || !to) {
        return sendJson(res, 400, { error: 'Query parameters amount, from, and to are required' });
      }
      const quote = oracle.convert(Number(amount), from, to);
      return sendJson(res, 200, quote);
    }

    // ==========================================
    // API: PAYMENTS & END-TO-END WORKFLOW
    // ==========================================
    if (pathname === '/api/payments' && method === 'GET') {
      const txs = await db.getAllTransactions();
      return sendJson(res, 200, txs);
    }

    if (pathname.startsWith('/api/payments/') && method === 'GET') {
      const txId = pathname.replace('/api/payments/', '');
      const tx = await db.getTransaction(txId);
      if (!tx) return sendJson(res, 404, { error: 'Transaction not found' });
      return sendJson(res, 200, tx);
    }

    // STEP 1: Sender Initiates Payment
    if (pathname === '/api/payments/initiate' && method === 'POST') {
      const body = await parseJsonBody(req);
      const paymentTx = await smartContract.initiatePayment(body);
      blockchain.addTransactionToPool(paymentTx);
      return sendJson(res, 201, paymentTx);
    }

    // STEP 2: Smart Contract Rule Checks
    if (pathname === '/api/payments/validate' && method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await smartContract.executeSmartContractChecks(body.txId);
      return sendJson(res, 200, result);
    }

    // STEP 3: Proof of Authority Consensus & Block Mining
    if (pathname === '/api/payments/mine' && method === 'POST') {
      const body = await parseJsonBody(req);
      const newBlock = await blockchain.minePendingTransactions(body.validatorId);
      return sendJson(res, 200, {
        message: 'Transactions validated by PoA consensus and recorded to blockchain block.',
        block: newBlock
      });
    }

    // STEP 4: Settlement / Fiat Off-Ramp Disbursement
    if (pathname === '/api/payments/settle' && method === 'POST') {
      const body = await parseJsonBody(req);
      const updatedTx = await smartContract.confirmSettlement(
        body.txId,
        body.bankValidatorId || 'NODE_SBI_IN',
        body.settlementRef
      );
      return sendJson(res, 200, updatedTx);
    }

    // ONE-CLICK: Execute Full End-to-End Workflow automatically
    if (pathname === '/api/payments/run-full-flow' && method === 'POST') {
      const body = await parseJsonBody(req);
      const stepsLog = [];

      // State 1 & 2: Sender initiates
      stepsLog.push({ step: 'Sender Login / Authorization', status: 'SUCCESS' });
      stepsLog.push({ step: 'Enter Beneficiary and Amount', status: 'SUCCESS', details: body });

      // State 3 & 4: Validate details & Create Tx
      const paymentTx = await smartContract.initiatePayment(body);
      blockchain.addTransactionToPool(paymentTx);
      stepsLog.push({ step: 'Validate Payment Details', status: 'SUCCESS' });
      stepsLog.push({ step: 'Create Payment Transaction', status: 'SUCCESS', txId: paymentTx.txId });

      // State 5: Smart contract checks
      await smartContract.executeSmartContractChecks(paymentTx.txId);
      stepsLog.push({ step: 'Smart Contract Checks', status: 'SUCCESS' });

      // State 6 & 7: PoA consensus & Record on Blockchain
      const block = await blockchain.minePendingTransactions(body.validatorId || 'NODE_JPM_US');
      stepsLog.push({ step: 'Consensus / Authorized Validation (PoA)', status: 'SUCCESS', validator: block.validator });
      stepsLog.push({ step: 'Record on Blockchain', status: 'SUCCESS', blockIndex: block.index, blockHash: block.hash });

      // State 8 & 9: Settlement / Off-Ramp & Beneficiary Receives Funds
      const settledTx = await smartContract.confirmSettlement(
        paymentTx.txId,
        body.settlementBankNode || 'NODE_SBI_IN'
      );
      stepsLog.push({ step: 'Settlement / Off-Ramp', status: 'SUCCESS', settlementRef: settledTx.settlementRef });
      stepsLog.push({ step: 'Beneficiary Receives Funds', status: 'SUCCESS', amountReceived: `${settledTx.convertedAmount} ${settledTx.destinationCurrency}` });
      stepsLog.push({ step: 'View Payment Status', status: 'SUCCESS', finalStatus: 'SETTLED' });

      return sendJson(res, 200, {
        success: true,
        stepsLog,
        transaction: settledTx,
        block
      });
    }

    // ==========================================
    // API: BLOCKCHAIN EXPLORER & INTEGRITY
    // ==========================================
    if (pathname === '/api/blockchain/blocks' && method === 'GET') {
      const blocks = await db.getBlocks();
      return sendJson(res, 200, blocks);
    }

    if (pathname === '/api/blockchain/verify' && method === 'GET') {
      const verification = await blockchain.isChainValid();
      return sendJson(res, 200, verification);
    }

    if (pathname === '/api/blockchain/tamper' && method === 'POST') {
      const body = await parseJsonBody(req);
      const resTamper = await blockchain.simulateTamper(body.blockIndex || 1, body.fakeAmount || 999999);
      return sendJson(res, 200, resTamper);
    }

    if (pathname === '/api/blockchain/repair' && method === 'POST') {
      const resRepair = await blockchain.repairChain();
      return sendJson(res, 200, resRepair);
    }

    // ==========================================
    // API: AUDIT LOGS
    // ==========================================
    if (pathname === '/api/audit-logs' && method === 'GET') {
      const limit = parsedUrl.query.limit ? Number(parsedUrl.query.limit) : 50;
      const logs = await db.getAuditLogs(limit);
      return sendJson(res, 200, logs);
    }

    // Fallback: Static Assets
    return serveStatic(req, res, pathname);

  } catch (error) {
    console.error(`[Server Error] ${method} ${pathname}:`, error.message);
    return sendJson(res, 400, {
      error: error.message,
      lifecycleState: 'Validation Failed / Rejection'
    });
  }
});

/**
 * Start Server & Bootstrap Database & Initial Blocks
 */
async function start() {
  await db.connect();
  await blockchain.init();
  await smartContract.seedInitialParticipants();

  server.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`  BLOCKCHAIN CROSS-BORDER PAYMENTS SYSTEM (PoA Consortium)     `);
    console.log(`================================================================`);
    console.log(`  Web Dashboard : http://localhost:${PORT}`);
    console.log(`  API Status    : http://localhost:${PORT}/api/status`);
    console.log(`  MongoDB DB    : ${db.dbName} (${db.isConnected ? 'CONNECTED' : 'IN-MEMORY CACHE'})`);
    console.log(`================================================================`);
  });
}

start().catch(err => {
  console.error('Fatal initialization error:', err);
});
