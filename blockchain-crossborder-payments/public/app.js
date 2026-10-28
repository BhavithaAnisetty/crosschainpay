// Frontend Controller for Blockchain-Based Cross-Border Payments System

const API_BASE = '';
let currentParticipants = [];
let oracleRates = {};
let latestInitiatedTx = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  await loadSystemStatus();
  await loadParticipants();
  await loadOracleRates();
  await loadTransactions();
  await loadBlocks();
  await loadMongoStats();

  // Periodic poll for status & blocks
  setInterval(loadSystemStatus, 8000);
  setInterval(loadTransactions, 10000);
});

// ==========================================
// TAB NAVIGATION
// ==========================================
function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

  const activePane = document.getElementById(`tabContent-${tabId}`);
  const activeBtn = document.getElementById(`tabBtn-${tabId}`);

  if (activePane) activePane.classList.remove('hidden');
  if (activeBtn) activeBtn.classList.add('active');

  if (tabId === 'explorer') loadBlocks();
  if (tabId === 'mongodb') loadMongoCollectionData();
  if (tabId === 'oracle') loadOracleRates();

  if (window.lucide) lucide.createIcons();
}

// ==========================================
// SYSTEM STATUS & PARTICIPANTS
// ==========================================
async function loadSystemStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    const data = await res.json();

    document.getElementById('blockHeightBadge').textContent = data.blockHeight;
    
    const dbBadge = document.getElementById('mongoStatusBadge');
    if (data.database && data.database.isConnected) {
      dbBadge.textContent = 'Connected (v8.2.2)';
      dbBadge.className = 'font-semibold text-emerald-400';
    } else {
      dbBadge.textContent = 'In-Memory DB Active';
      dbBadge.className = 'font-semibold text-amber-400';
    }

    if (data.validators && data.validators.length > 0) {
      const v = data.validators[0];
      document.getElementById('activeNodeText').textContent = `${v.id} (${v.name})`;
    }
  } catch (err) {
    console.warn('Status poll notice:', err);
  }
}

async function loadParticipants() {
  try {
    const res = await fetch(`${API_BASE}/api/participants`);
    currentParticipants = await res.json();

    const senderSelect = document.getElementById('senderSelect');
    const beneficiarySelect = document.getElementById('beneficiarySelect');

    senderSelect.innerHTML = '';
    beneficiarySelect.innerHTML = '';

    const senders = currentParticipants.filter(p => p.role === 'SENDER');
    const beneficiaries = currentParticipants.filter(p => p.role === 'BENEFICIARY');

    senders.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.country} - ${s.currency})`;
      senderSelect.appendChild(opt);
    });

    beneficiaries.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = `${b.name} (${b.country} - ${b.currency})`;
      beneficiarySelect.appendChild(opt);
    });

    onSenderChange();
    updateFxConversionPreview();
  } catch (err) {
    logToConsole(`Error loading participants: ${err.message}`, 'ERROR');
  }
}

function onSenderChange() {
  const senderId = document.getElementById('senderSelect').value;
  const sender = currentParticipants.find(p => p.id === senderId);
  if (sender) {
    document.getElementById('senderBalance').textContent = `$${Number(sender.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }
}

// ==========================================
// FX ORACLE
// ==========================================
async function loadOracleRates() {
  try {
    const res = await fetch(`${API_BASE}/api/oracle/rates`);
    oracleRates = await res.json();

    const grid = document.getElementById('oracleRatesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    for (const [curr, rate] of Object.entries(oracleRates.rates)) {
      const card = document.createElement('div');
      card.className = 'p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between';
      card.innerHTML = `
        <div>
          <div class="text-[10px] text-slate-500 uppercase font-mono">${curr} / USD</div>
          <div class="text-sm font-bold text-white font-mono">${rate.toFixed(4)}</div>
        </div>
        <div class="w-7 h-7 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400 font-bold text-[10px]">
          ${curr}
        </div>
      `;
      grid.appendChild(card);
    }

    updateFxConversionPreview();
  } catch (err) {
    console.warn('Oracle rate fetch error:', err);
  }
}

async function updateFxConversionPreview() {
  const beneficiaryId = document.getElementById('beneficiarySelect').value;
  const amount = Number(document.getElementById('transferAmount').value) || 0;
  const beneficiary = currentParticipants.find(p => p.id === beneficiaryId);

  if (!beneficiary) return;

  document.getElementById('beneficiaryRail').textContent = `${beneficiary.country} (${beneficiary.currency})`;

  try {
    const res = await fetch(`${API_BASE}/api/oracle/convert?amount=${amount}&from=USD&to=${beneficiary.currency}`);
    const quote = await res.json();

    document.getElementById('oracleFxRateText').textContent = `1 USD = ${quote.rate.toFixed(4)} ${quote.toCurrency}`;
    document.getElementById('beneficiaryReceivesText').textContent = `${Number(quote.convertedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} ${quote.toCurrency}`;
  } catch (e) {
    console.error(e);
  }
}

async function calculateSimulatedFx() {
  const amount = document.getElementById('simAmount').value;
  const target = document.getElementById('simTargetCurrency').value;

  try {
    const res = await fetch(`${API_BASE}/api/oracle/convert?amount=${amount}&from=USD&to=${target}`);
    const data = await res.json();

    const box = document.getElementById('simQuoteResult');
    box.classList.remove('hidden');
    box.innerHTML = `
      <div class="text-emerald-400 font-semibold mb-1">Oracle Signed FX Quote Verified:</div>
      <div>Input: ${amount} USD &rarr; Converted: <span class="text-white font-bold">${data.convertedAmount.toLocaleString()} ${target}</span></div>
      <div>Exchange Rate: 1 USD = ${data.rate} ${target}</div>
      <div class="text-[10px] text-slate-500 break-all mt-1">Oracle Signature: ${data.signature}</div>
    `;
  } catch (err) {
    alert(err.message);
  }
}

// ==========================================
// STATE MACHINE VISUALIZER
// ==========================================
const ALL_STATES = [
  'START',
  'LOGIN',
  'ENTER_DETAILS',
  'VALIDATE_DETAILS',
  'CREATE_TX',
  'SMART_CONTRACT',
  'POA_CONSENSUS',
  'RECORD_BLOCKCHAIN',
  'SETTLEMENT',
  'BENEFICIARY_RECEIVES',
  'END'
];

function resetStateVisualizer() {
  ALL_STATES.forEach(s => {
    const el = document.getElementById(`node-${s}`);
    if (el) {
      el.className = 'state-node z-10 flex flex-col items-center';
    }
  });
  dismissRejection();
  document.getElementById('stateStatusBadge').textContent = 'Current State: READY / IDLE';
  document.getElementById('stateStatusBadge').className = 'text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700';
}

function setActiveState(stateKey, statusLabel = null) {
  // Mark previous ones as completed
  const currentIndex = ALL_STATES.indexOf(stateKey);
  for (let i = 0; i < currentIndex; i++) {
    const prevEl = document.getElementById(`node-${ALL_STATES[i]}`);
    if (prevEl) prevEl.className = 'state-node completed-step z-10 flex flex-col items-center';
  }

  const currentEl = document.getElementById(`node-${stateKey}`);
  if (currentEl) {
    currentEl.className = 'state-node active-step z-10 flex flex-col items-center';
  }

  const badge = document.getElementById('stateStatusBadge');
  badge.textContent = `State: ${statusLabel || stateKey}`;
  badge.className = 'text-xs px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700 font-semibold';
}

function setErrorState(stateKey, errorMessage) {
  const el = document.getElementById(`node-${stateKey}`);
  if (el) {
    el.className = 'state-node error-step z-10 flex flex-col items-center';
  }
  const badge = document.getElementById('stateStatusBadge');
  badge.textContent = `REJECTED AT: ${stateKey}`;
  badge.className = 'text-xs px-3 py-1 rounded-full bg-rose-900/60 text-rose-300 border border-rose-700 font-semibold';

  const notice = document.getElementById('rejectionNotice');
  const msgEl = document.getElementById('rejectionMessage');
  msgEl.textContent = errorMessage;
  notice.classList.remove('hidden');
}

function dismissRejection() {
  const notice = document.getElementById('rejectionNotice');
  if (notice) notice.classList.add('hidden');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==========================================
// PAYMENT WORKFLOW EXECUTION
// ==========================================
async function executeOneClickWorkflow() {
  const senderId = document.getElementById('senderSelect').value;
  const beneficiaryId = document.getElementById('beneficiarySelect').value;
  const amount = Number(document.getElementById('transferAmount').value);
  const validatorId = document.getElementById('validatorSelect').value;

  const beneficiary = currentParticipants.find(p => p.id === beneficiaryId);
  const sender = currentParticipants.find(p => p.id === senderId);

  resetStateVisualizer();
  clearConsole();
  document.getElementById('receiptCard').classList.add('hidden');

  logToConsole('====================================================', 'INFO');
  logToConsole('INITIATING CONSORTIUM CROSS-BORDER PAYMENT WORKFLOW', 'INFO');
  logToConsole('====================================================', 'INFO');

  try {
    // 1. START
    setActiveState('START', 'START');
    logToConsole('[1/10] START: Initializing payment orchestration...', 'STEP');
    await sleep(400);

    // 2. Sender Login
    setActiveState('LOGIN', 'Sender Login & Authorization');
    logToConsole(`[2/10] AUTH: Sender ${sender.name} authenticated via account ${sender.accountNumber}.`, 'SUCCESS');
    await sleep(400);

    // 3. Enter Beneficiary & Amount
    setActiveState('ENTER_DETAILS', 'Enter Beneficiary and Amount');
    logToConsole(`[3/10] INPUT: Beneficiary: ${beneficiary.name} (${beneficiary.country}), Amount: $${amount} USD.`, 'STEP');
    await sleep(400);

    // 4. Validate Details
    setActiveState('VALIDATE_DETAILS', 'Validate Payment Details');
    logToConsole('[4/10] VALIDATE: Checking participant records, KYC credentials, and AML boundaries...', 'STEP');
    await sleep(400);

    // 5. Create Payment Transaction
    setActiveState('CREATE_TX', 'Create Payment Transaction');
    logToConsole('[5/10] ORACLE & SMART CONTRACT: Calling initiatePayment()...', 'STEP');

    const res = await fetch(`${API_BASE}/api/payments/run-full-flow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId,
        beneficiaryId,
        amount,
        srcCurrency: 'USD',
        dstCurrency: beneficiary.currency,
        validatorId,
        purpose: 'Cross-Border Supply Chain Settlement'
      })
    });

    const data = await res.json();

    if (!res.ok) {
      setErrorState('SMART_CONTRACT', data.error || 'Transaction rejected by rules.');
      logToConsole(`ERROR: ${data.error}`, 'ERROR');
      return;
    }

    const { transaction, block } = data;
    logToConsole(`Created Transaction ID: ${transaction.txId}`, 'SUCCESS');
    logToConsole(`Oracle FX Conversion: 1 USD = ${transaction.exchangeRate} ${transaction.destinationCurrency}`, 'INFO');
    await sleep(400);

    // 6. Smart Contract Checks
    setActiveState('SMART_CONTRACT', 'Smart Contract Checks');
    logToConsole(`[6/10] SMART CONTRACT: Predefined conditions verified at contract ${smartContractAddress(transaction)}.`, 'SUCCESS');
    await sleep(450);

    // 7. PoA Consensus
    setActiveState('POA_CONSENSUS', 'Consensus / Authorized Validation');
    logToConsole(`[7/10] PoA CONSENSUS: Authorized validator node [${block.validator}] verified transaction signatures.`, 'SUCCESS');
    await sleep(450);

    // 8. Record on Blockchain
    setActiveState('RECORD_BLOCKCHAIN', 'Record on Blockchain');
    logToConsole(`[8/10] BLOCKCHAIN: Mined Block #${block.index} [Hash: ${block.hash.slice(0, 16)}...]`, 'SUCCESS');
    await sleep(450);

    // 9. Settlement / Off-Ramp
    setActiveState('SETTLEMENT', 'Settlement / Off-Ramp');
    logToConsole(`[9/10] SETTLEMENT: Bank rail executed fiat conversion. Reference: ${transaction.settlementRef}`, 'SUCCESS');
    await sleep(450);

    // 10. Beneficiary Receives Funds & END
    setActiveState('BENEFICIARY_RECEIVES', 'Beneficiary Receives Funds');
    logToConsole(`[10/10] DISBURSEMENT: ${Number(transaction.convertedAmount).toLocaleString()} ${transaction.destinationCurrency} credited to ${beneficiary.name}!`, 'SUCCESS');
    await sleep(400);

    setActiveState('END', 'Completed Successfully');
    logToConsole('PAYMENT WORKFLOW REACHED STATE: END. Transaction fully settled & immutable.', 'SUCCESS');

    // Display Receipt
    showReceipt(transaction, block);

    // Refresh UI Data
    await loadParticipants();
    await loadTransactions();
    await loadBlocks();
    await loadSystemStatus();
    await loadMongoStats();

  } catch (err) {
    setErrorState('VALIDATE_DETAILS', err.message);
    logToConsole(`Workflow Exception: ${err.message}`, 'ERROR');
  }
}

// Step 1: Initiate Only
async function stepInitiateOnly() {
  const senderId = document.getElementById('senderSelect').value;
  const beneficiaryId = document.getElementById('beneficiarySelect').value;
  const amount = Number(document.getElementById('transferAmount').value);
  const beneficiary = currentParticipants.find(p => p.id === beneficiaryId);

  resetStateVisualizer();
  setActiveState('CREATE_TX', 'Initiating Transaction');

  try {
    const res = await fetch(`${API_BASE}/api/payments/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        senderId,
        beneficiaryId,
        amount,
        srcCurrency: 'USD',
        dstCurrency: beneficiary.currency
      })
    });

    const tx = await res.json();
    if (!res.ok) throw new Error(tx.error);

    latestInitiatedTx = tx;
    logToConsole(`Step 1 Complete: Transaction ${tx.txId} initiated and queued in pending pool.`, 'SUCCESS');
    setActiveState('SMART_CONTRACT', 'Awaiting Validation & Mining');
    await loadTransactions();
  } catch (e) {
    setErrorState('VALIDATE_DETAILS', e.message);
    logToConsole(`Initiation Failed: ${e.message}`, 'ERROR');
  }
}

// Step 2: Mine & Settle
async function stepMineAndSettle() {
  const validatorId = document.getElementById('validatorSelect').value;
  try {
    logToConsole('Validating Smart Contract Rules & executing PoA consensus...', 'STEP');
    
    // Mine pending block
    const mineRes = await fetch(`${API_BASE}/api/payments/mine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validatorId })
    });
    const mineData = await mineRes.json();
    if (!mineRes.ok) throw new Error(mineData.error);

    const block = mineData.block;
    logToConsole(`PoA Block #${block.index} validated by ${block.validator}. Hash: ${block.hash.slice(0, 16)}...`, 'SUCCESS');
    setActiveState('RECORD_BLOCKCHAIN', 'Recorded on Blockchain');

    // Settle transactions
    for (const tx of block.transactions) {
      const settleRes = await fetch(`${API_BASE}/api/payments/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId: tx.txId, bankValidatorId: validatorId })
      });
      const settled = await settleRes.json();
      logToConsole(`Settled ${settled.txId}: Credited ${settled.convertedAmount} ${settled.destinationCurrency}`, 'SUCCESS');
    }

    setActiveState('END', 'Settled & Completed');
    await loadParticipants();
    await loadTransactions();
    await loadBlocks();
  } catch (e) {
    logToConsole(`Mine & Settle Error: ${e.message}`, 'ERROR');
  }
}

// Simulation Edge Cases
function triggerExceedLimit() {
  document.getElementById('transferAmount').value = '65000';
  updateFxConversionPreview();
  executeOneClickWorkflow();
}

function triggerOverdraft() {
  document.getElementById('transferAmount').value = '999999';
  updateFxConversionPreview();
  executeOneClickWorkflow();
}

function smartContractAddress(tx) {
  return tx.smartContractAddress ? tx.smartContractAddress.slice(0, 10) + '...' : '0x8A97bF...';
}

function showReceipt(tx, block) {
  document.getElementById('receiptCard').classList.remove('hidden');
  document.getElementById('receiptTxId').textContent = tx.txId;
  document.getElementById('receiptSender').textContent = `${tx.senderName} (${tx.senderCountry})`;
  document.getElementById('receiptBeneficiary').textContent = `${tx.beneficiaryName} (${tx.beneficiaryCountry})`;
  document.getElementById('receiptAmount').textContent = `${Number(tx.convertedAmount).toLocaleString()} ${tx.destinationCurrency}`;
  document.getElementById('receiptBlock').textContent = `Block #${block.index}`;
  document.getElementById('receiptValidator').textContent = block.validator;
  document.getElementById('receiptSettlementRef').textContent = tx.settlementRef;
  document.getElementById('receiptBlockHash').textContent = block.hash;
}

// ==========================================
// TRANSACTIONS TABLE
// ==========================================
async function loadTransactions() {
  try {
    const res = await fetch(`${API_BASE}/api/payments`);
    const txs = await res.json();

    const tbody = document.getElementById('txTableBody');
    if (!tbody) return;

    if (!txs || txs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-slate-500 font-sans">No transactions recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';
    txs.forEach(t => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-800/40 transition';

      let statusColor = 'text-amber-400 bg-amber-950/60 border-amber-800/60';
      if (t.status === 'SETTLED') statusColor = 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60';
      if (t.status === 'REJECTED') statusColor = 'text-rose-400 bg-rose-950/60 border-rose-800/60';
      if (t.status === 'RECORDED_ON_BLOCKCHAIN') statusColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60';

      tr.innerHTML = `
        <td class="py-2.5 px-3 text-indigo-400 font-semibold">${t.txId}</td>
        <td class="py-2.5 px-3 font-sans">${t.senderName || t.senderId}</td>
        <td class="py-2.5 px-3 font-sans">${t.beneficiaryName || t.beneficiaryId}</td>
        <td class="py-2.5 px-3 text-white">$${Number(t.originalAmount).toLocaleString()} ${t.sourceCurrency}</td>
        <td class="py-2.5 px-3 text-emerald-400 font-bold">${Number(t.convertedAmount).toLocaleString()} ${t.destinationCurrency}</td>
        <td class="py-2.5 px-3 text-slate-400">${t.exchangeRate}</td>
        <td class="py-2.5 px-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-semibold border ${statusColor}">
            ${t.status}
          </span>
        </td>
        <td class="py-2.5 px-3 text-slate-400">${t.blockIndex !== null ? '#' + t.blockIndex : 'Pending'}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.warn('Tx load error:', err);
  }
}

// ==========================================
// BLOCKCHAIN EXPLORER
// ==========================================
async function loadBlocks() {
  try {
    const res = await fetch(`${API_BASE}/api/blockchain/blocks`);
    const blocks = await res.json();

    const container = document.getElementById('blocksListContainer');
    if (!container) return;

    container.innerHTML = '';
    blocks.slice().reverse().forEach(b => {
      const card = document.createElement('div');
      card.className = 'p-4 bg-slate-950 border border-slate-800/90 rounded-2xl shadow space-y-2';

      const txCount = b.transactions ? b.transactions.length : 0;
      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-slate-800/60 pb-2.5">
          <div class="flex items-center space-x-2">
            <span class="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono text-xs font-bold">
              Block #${b.index}
            </span>
            <span class="text-xs text-slate-400 font-mono">${b.timestamp}</span>
          </div>
          <div class="flex items-center space-x-2 text-xs">
            <span class="text-slate-500">Validator:</span>
            <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400 font-mono font-semibold">${b.validator}</span>
            <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-900 text-[10px]">PoA Signed</span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-1">
          <div class="truncate">
            <span class="text-slate-500">Current Hash:</span> 
            <span class="text-slate-200 select-all">${b.hash}</span>
          </div>
          <div class="truncate">
            <span class="text-slate-500">Previous Hash:</span> 
            <span class="text-slate-400 select-all">${b.previousHash}</span>
          </div>
          <div class="truncate">
            <span class="text-slate-500">Merkle Root:</span> 
            <span class="text-slate-400 select-all">${b.merkleRoot}</span>
          </div>
          <div class="truncate">
            <span class="text-slate-500">PoA Signature:</span> 
            <span class="text-slate-500 select-all">${b.validatorSignature || 'N/A'}</span>
          </div>
        </div>

        <div class="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
          <span class="text-slate-400 font-medium">Included Transactions (${txCount})</span>
          <span class="text-slate-500 text-[11px]">${b.index === 0 ? 'Genesis Initialization' : 'Cross-Border Settlements'}</span>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.warn('Blocks fetch error:', err);
  }
}

async function verifyBlockchainIntegrity() {
  try {
    const res = await fetch(`${API_BASE}/api/blockchain/verify`);
    const result = await res.json();

    const banner = document.getElementById('integrityResultBanner');
    const text = document.getElementById('integrityText');
    const icon = document.getElementById('integrityIcon');

    banner.classList.remove('hidden');
    if (result.valid) {
      banner.className = 'mt-4 p-3 rounded-xl text-xs flex items-center justify-between bg-emerald-950/80 border border-emerald-700 text-emerald-200';
      text.textContent = `PASS: All ${result.totalBlocks} blocks cryptographically verified! Hashes, Merkle roots, and PoA signatures are intact.`;
      logToConsole('CRYPTOGRAPHIC INTEGRITY AUDIT: PASS - Immutability verified.', 'SUCCESS');
    } else {
      banner.className = 'mt-4 p-3 rounded-xl text-xs flex items-center justify-between bg-rose-950/80 border border-rose-700 text-rose-200';
      text.textContent = `ALERT: Cryptographic tampering detected at Block #${result.tamperedBlockIndex}! Reason: ${result.reason}`;
      logToConsole(`TAMPER DETECTED: ${result.reason}`, 'ERROR');
    }
  } catch (err) {
    alert(err.message);
  }
}

async function tamperSimulation() {
  try {
    const res = await fetch(`${API_BASE}/api/blockchain/tamper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blockIndex: 1, fakeAmount: 99999999 })
    });
    const data = await res.json();
    logToConsole(`TAMPER ATTACK SIMULATED: ${data.message}`, 'ERROR');
    await loadBlocks();
    await verifyBlockchainIntegrity();
  } catch (err) {
    alert(err.message);
  }
}

async function repairChain() {
  try {
    const res = await fetch(`${API_BASE}/api/blockchain/repair`, { method: 'POST' });
    const data = await res.json();
    logToConsole(data.message, 'SUCCESS');
    await loadBlocks();
    await verifyBlockchainIntegrity();
  } catch (err) {
    alert(err.message);
  }
}

// ==========================================
// MONGODB COLLECTIONS INSPECTOR
// ==========================================
async function loadMongoStats() {
  try {
    const res = await fetch(`${API_BASE}/api/status`);
    const data = await res.json();
    if (data.database && data.database.counts) {
      document.getElementById('statBlocksCount').textContent = data.database.counts.blocks || 0;
      document.getElementById('statTxsCount').textContent = data.database.counts.transactions || 0;
      document.getElementById('statParticipantsCount').textContent = data.database.counts.participants || 0;
      document.getElementById('statAuditCount').textContent = data.database.counts.audit_logs || 0;
    }
  } catch (e) {
    console.warn(e);
  }
}

async function loadMongoCollectionData() {
  const collectionName = document.getElementById('mongoCollectionSelect').value;
  const pre = document.getElementById('mongoRawJson');
  pre.textContent = `// Querying MongoDB collection: "crossborder_payments.${collectionName}"...`;

  try {
    let endpoint = '';
    if (collectionName === 'blocks') endpoint = '/api/blockchain/blocks';
    else if (collectionName === 'transactions') endpoint = '/api/payments';
    else if (collectionName === 'participants') endpoint = '/api/participants';
    else if (collectionName === 'audit_logs') endpoint = '/api/audit-logs';

    const res = await fetch(`${API_BASE}${endpoint}`);
    const data = await res.json();
    pre.textContent = JSON.stringify(data, null, 2);
    await loadMongoStats();
  } catch (err) {
    pre.textContent = `Error loading collection: ${err.message}`;
  }
}

// ==========================================
// CONSOLE LOGGER HELPER
// ==========================================
function logToConsole(message, type = 'INFO') {
  const consoleBox = document.getElementById('consoleLog');
  if (!consoleBox) return;

  const row = document.createElement('div');
  const time = new Date().toLocaleTimeString();

  let color = 'text-slate-300';
  if (type === 'SUCCESS') color = 'text-emerald-400 font-semibold';
  if (type === 'ERROR') color = 'text-rose-400 font-bold';
  if (type === 'STEP') color = 'text-cyan-300';

  row.className = `${color} flex items-start space-x-2`;
  row.innerHTML = `<span class="text-slate-600">[${time}]</span> <span>${message}</span>`;

  consoleBox.appendChild(row);
  consoleBox.scrollTop = consoleBox.scrollHeight;
}

function clearConsole() {
  const c = document.getElementById('consoleLog');
  if (c) c.innerHTML = '<div class="text-slate-500">// Console cleared. Ready.</div>';
}
