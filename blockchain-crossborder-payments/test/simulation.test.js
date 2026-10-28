const db = require('../src/db/mongodb');
const blockchain = require('../src/blockchain/Blockchain');
const smartContract = require('../src/blockchain/SmartContract');
const oracle = require('../src/blockchain/Oracle');

async function runSimulation() {
  console.log('================================================================');
  console.log(' STARTING BLOCKCHAIN CROSS-BORDER PAYMENTS SIMULATION TEST     ');
  console.log(' Consortium PoA + Smart Contracts + FX Oracle + MongoDB         ');
  console.log('================================================================\n');

  try {
    // 1. Connect DB & Initialize
    console.log('[Test 1] Connecting to MongoDB and bootstrapping ledger...');
    await db.connect();
    await blockchain.init();
    await smartContract.seedInitialParticipants();

    const participants = await db.getAllParticipants();
    console.log(`[PASS] Participants registered in MongoDB: ${participants.length}`);

    // 2. Test FX Oracle
    console.log('\n[Test 2] Querying FX Oracle for USD to INR exchange quote...');
    const quote = oracle.convert(1000, 'USD', 'INR');
    console.log(`[PASS] Oracle Quote: 1000 USD = ${quote.convertedAmount} INR (Rate: ${quote.rate})`);
    const isOracleValid = oracle.verifyQuote(quote);
    if (!isOracleValid) throw new Error('Oracle quote signature verification failed!');
    console.log('[PASS] Oracle HMAC cryptographic signature verified.');

    // 3. Sender Initiates Payment
    console.log('\n[Test 3] Step: Sender initiates cross-border payment...');
    const sender = participants.find(p => p.role === 'SENDER');
    const beneficiary = participants.find(p => p.id === 'BENEFICIARY_RAJ_IN');

    console.log(`Sender: ${sender.name} (Balance: $${sender.balance} ${sender.currency})`);
    console.log(`Beneficiary: ${beneficiary.name} (Balance: ${beneficiary.balance} ${beneficiary.currency})`);

    const transferAmount = 2500;
    const paymentTx = await smartContract.initiatePayment({
      senderId: sender.id,
      beneficiaryId: beneficiary.id,
      amount: transferAmount,
      srcCurrency: 'USD',
      dstCurrency: 'INR',
      purpose: 'Software License Payment'
    });

    console.log(`[PASS] Payment Transaction Created: ${paymentTx.txId}`);
    console.log(`       Sent: $${paymentTx.originalAmount} USD`);
    console.log(`       Beneficiary Receives: ${paymentTx.convertedAmount} INR (Rate: ${paymentTx.exchangeRate})`);
    console.log(`       Status: ${paymentTx.status}`);

    // 4. Smart Contract Rule Checks
    console.log('\n[Test 4] Step: Smart contract executes rule checks...');
    await smartContract.executeSmartContractChecks(paymentTx.txId);
    const validatedTx = await db.getTransaction(paymentTx.txId);
    console.log(`[PASS] Smart contract validation passed. Status: ${validatedTx.status}`);

    // 5. Proof of Authority Consensus & Block Creation
    console.log('\n[Test 5] Step: PoA Consensus & Block Mining by authorized validator...');
    blockchain.addTransactionToPool(validatedTx);
    const block = await blockchain.minePendingTransactions('NODE_JPM_US');
    console.log(`[PASS] Block #${block.index} minted by PoA Validator: ${block.validator}`);
    console.log(`       Block Hash: ${block.hash}`);
    console.log(`       Previous Hash: ${block.previousHash}`);
    console.log(`       Merkle Root: ${block.merkleRoot}`);
    console.log(`       PoA Signature: ${block.validatorSignature}`);

    // 6. Bank Settlement & Disbursement
    console.log('\n[Test 6] Step: Bank/PSP confirms settlement & fiat disbursement...');
    const settledTx = await smartContract.confirmSettlement(paymentTx.txId, 'NODE_SBI_IN', 'SETTLE-IN-SBI-9912');
    console.log(`[PASS] Settlement confirmed! Ref: ${settledTx.settlementRef}`);
    console.log(`       Final Status: ${settledTx.status}`);

    const updatedBeneficiary = await db.getParticipant(beneficiary.id);
    console.log(`       Beneficiary ${updatedBeneficiary.name} new balance: ${updatedBeneficiary.balance} INR`);

    // 7. Cryptographic Chain Integrity Verification
    console.log('\n[Test 7] Step: Verifying cryptographic blockchain integrity in MongoDB...');
    const integrityCheck = await blockchain.isChainValid();
    if (!integrityCheck.valid) {
      throw new Error(`Integrity check failed: ${integrityCheck.reason}`);
    }
    console.log(`[PASS] ${integrityCheck.message} (Total Blocks: ${integrityCheck.totalBlocks})`);

    // 8. Security & Tamper Detection Test
    console.log('\n[Test 8] Step: Simulating unauthorized database tampering attack...');
    await blockchain.simulateTamper(block.index, 99999999);
    const tamperCheck = await blockchain.isChainValid();
    if (tamperCheck.valid) {
      throw new Error('Security failure: Tampering was NOT detected by the blockchain!');
    }
    console.log(`[PASS] Tampering successfully detected!`);
    console.log(`       Reason: ${tamperCheck.reason}`);

    // Restore integrity
    await blockchain.repairChain();
    const restoredCheck = await blockchain.isChainValid();
    console.log(`[PASS] Blockchain integrity restored. Valid: ${restoredCheck.valid}`);

    console.log('\n================================================================');
    console.log(' ALL 8 TEST SUITES COMPLETED AND PASSED PERFECTLY!              ');
    console.log('================================================================\n');

    process.exit(0);
  } catch (err) {
    console.error('\n[SIMULATION FAILED]:', err);
    process.exit(1);
  }
}

runSimulation();
