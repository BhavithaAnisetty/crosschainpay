const Block = require('./Block');
const db = require('../db/mongodb');
const crypto = require('crypto');

/**
 * Consortium Blockchain Network using Proof of Authority (PoA).
 * Maintained collaboratively by authorized institutional bank validator nodes.
 */
class Blockchain {
  constructor() {
    this.authorizedValidators = [
      { id: 'NODE_JPM_US', name: 'JP Morgan Chase US', country: 'USA' },
      { id: 'NODE_HSBC_UK', name: 'HSBC London', country: 'GBR' },
      { id: 'NODE_DB_EU', name: 'Deutsche Bank Frankfurt', country: 'DEU' },
      { id: 'NODE_SBI_IN', name: 'State Bank of India', country: 'IND' }
    ];

    this.currentValidatorIndex = 0;
    this.pendingTransactions = [];
  }

  /**
   * Initializes the blockchain by reading from MongoDB or creating Genesis Block.
   */
  async init() {
    const blocks = await db.getBlocks();
    if (!blocks || blocks.length === 0) {
      console.log('[Blockchain] No existing blocks found in MongoDB. Initializing Genesis Block...');
      const genesisBlock = new Block(
        0,
        new Date('2026-01-01T00:00:00.000Z').toISOString(),
        [
          {
            type: 'GENESIS_TRANSACTION',
            description: 'Cross-Border Consortium Payment Rail Initialized',
            timestamp: new Date('2026-01-01T00:00:00.000Z').toISOString(),
            status: 'CONFIRMED'
          }
        ],
        '0'.repeat(64),
        'NODE_JPM_US'
      );

      await db.insertBlock(genesisBlock);
      await db.logAudit({
        event: 'GENESIS_BLOCK_CREATED',
        blockIndex: 0,
        details: `Genesis Block minted by authorized validator NODE_JPM_US. Hash: ${genesisBlock.hash}`
      });
      console.log(`[Blockchain] Genesis Block minted. Hash: ${genesisBlock.hash}`);
    } else {
      console.log(`[Blockchain] Loaded ${blocks.length} blocks from MongoDB.`);
    }
  }

  /**
   * Returns list of authorized PoA validator nodes.
   */
  getValidators() {
    return this.authorizedValidators;
  }

  /**
   * Selects the next round-robin authorized validator.
   */
  getNextValidator() {
    const validator = this.authorizedValidators[this.currentValidatorIndex];
    this.currentValidatorIndex = (this.currentValidatorIndex + 1) % this.authorizedValidators.length;
    return validator;
  }

  /**
   * Checks if an identity is authorized to validate blocks.
   */
  isAuthorizedValidator(validatorId) {
    return this.authorizedValidators.some(v => v.id === validatorId);
  }

  /**
   * Adds a transaction to the memory pool awaiting consensus inclusion.
   */
  addTransactionToPool(transaction) {
    this.pendingTransactions.push(transaction);
  }

  /**
   * Proof of Authority Consensus:
   * Authorized bank validator bundles transactions into a block, signs it, and attaches it to the chain.
   */
  async minePendingTransactions(validatorId = null) {
    // 1. Determine validator
    const chosenValidator = validatorId || this.getNextValidator().id;

    if (!this.isAuthorizedValidator(chosenValidator)) {
      throw new Error(`PoA Consensus Error: Node ${chosenValidator} is NOT an authorized validator.`);
    }

    if (this.pendingTransactions.length === 0) {
      throw new Error('No pending transactions to include in block.');
    }

    const latestBlock = await db.getLatestBlock();
    const newIndex = latestBlock ? latestBlock.index + 1 : 1;
    const previousHash = latestBlock ? latestBlock.hash : '0'.repeat(64);

    // 2. Create Block
    const newBlock = new Block(
      newIndex,
      new Date().toISOString(),
      [...this.pendingTransactions],
      previousHash,
      chosenValidator
    );

    // 3. Persist Block into MongoDB
    await db.insertBlock(newBlock);

    // 4. Update transaction records in MongoDB
    for (const tx of this.pendingTransactions) {
      await db.updateTransaction(tx.txId, {
        status: 'RECORDED_ON_BLOCKCHAIN',
        lifecycleState: 'Record on Blockchain',
        blockIndex: newIndex,
        validatorNode: chosenValidator,
        blockHash: newBlock.hash,
        recordedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await db.logAudit({
        event: 'BLOCK_RECORDED',
        txId: tx.txId,
        blockIndex: newIndex,
        validator: chosenValidator,
        details: `Transaction ${tx.txId} validated via PoA by ${chosenValidator} in Block #${newIndex}`
      });
    }

    // Reset pending pool
    this.pendingTransactions = [];

    return newBlock;
  }

  /**
   * Verifies the cryptographic integrity of the blockchain stored in MongoDB.
   * Checks SHA-256 hashes, previousHash link, and PoA validator digital signatures.
   */
  async isChainValid() {
    const blocks = await db.getBlocks();

    if (!blocks || blocks.length === 0) {
      return { valid: false, reason: 'Blockchain is empty' };
    }

    for (let i = 1; i < blocks.length; i++) {
      const current = blocks[i];
      const previous = blocks[i - 1];

      // Re-instantiate Block to test recalculation
      const tempBlock = new Block(
        current.index,
        current.timestamp,
        current.transactions,
        current.previousHash,
        current.validator
      );

      // 1. Verify Hash
      if (tempBlock.hash !== current.hash) {
        return {
          valid: false,
          reason: `Block #${current.index} data has been tampered! Computed hash ${tempBlock.hash} does not match stored hash ${current.hash}.`,
          tamperedBlockIndex: current.index
        };
      }

      // 2. Verify Chain Link
      if (current.previousHash !== previous.hash) {
        return {
          valid: false,
          reason: `Block #${current.index} previousHash (${current.previousHash.slice(0, 10)}...) does not match Block #${previous.index} hash (${previous.hash.slice(0, 10)}...). Broken chain linkage!`,
          tamperedBlockIndex: current.index
        };
      }

      // 3. Verify Proof of Authority Validator
      if (!this.isAuthorizedValidator(current.validator)) {
        return {
          valid: false,
          reason: `Block #${current.index} was signed by unauthorized validator: ${current.validator}`,
          tamperedBlockIndex: current.index
        };
      }

      // 4. Verify Validator Signature
      const expectedSignature = crypto
        .createHmac('sha256', `POA_VALIDATOR_SECRET_${current.validator}`)
        .update(`${current.hash}:${current.validator}:${current.timestamp}`)
        .digest('hex');

      if (current.validatorSignature !== expectedSignature) {
        return {
          valid: false,
          reason: `Block #${current.index} validator signature is invalid.`,
          tamperedBlockIndex: current.index
        };
      }
    }

    return {
      valid: true,
      totalBlocks: blocks.length,
      latestBlockHash: blocks[blocks.length - 1].hash,
      message: 'Cryptographic integrity verified! All hashes, Merkle roots, and PoA signatures match.'
    };
  }

  /**
   * Simulates a deliberate tampering attack on MongoDB to demonstrate immutability detection.
   */
  async simulateTamper(blockIndex, fakeAmount = 9999999) {
    const blocks = await db.getBlocks();
    const targetBlock = blocks.find(b => b.index === Number(blockIndex));
    if (!targetBlock) {
      throw new Error(`Block #${blockIndex} not found`);
    }

    if (!targetBlock.transactions || targetBlock.transactions.length === 0) {
      throw new Error(`Block #${blockIndex} has no transactions to tamper with.`);
    }

    // Tamper with the transaction data inside MongoDB without recomputing the hash
    targetBlock.transactions[0].originalAmount = fakeAmount;
    targetBlock.transactions[0].tampered = true;

    if (db.isConnected && db.db) {
      await db.db.collection('blocks').updateOne(
        { index: Number(blockIndex) },
        { $set: { transactions: targetBlock.transactions } }
      );
    }

    await db.logAudit({
      event: 'SECURITY_SIMULATION_TAMPER',
      blockIndex,
      details: `Simulated unauthorized modification of Block #${blockIndex} amount to ${fakeAmount}`
    });

    return {
      message: `Block #${blockIndex} transaction amount secretly tampered to ${fakeAmount}. Run verification to detect!`,
      tamperedBlockIndex: blockIndex
    };
  }

  /**
   * Repairs the chain after demonstration.
   */
  async repairChain() {
    const blocks = await db.getBlocks();
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.transactions) {
        b.transactions.forEach(t => {
          if (t.tampered) {
            delete t.tampered;
            t.originalAmount = 1000;
          }
        });
      }
      const prevHash = i === 0 ? '0'.repeat(64) : blocks[i - 1].hash;
      const repaired = new Block(b.index, b.timestamp, b.transactions, prevHash, b.validator);
      b.hash = repaired.hash;
      b.merkleRoot = repaired.merkleRoot;
      b.previousHash = repaired.previousHash;
      b.validatorSignature = repaired.validatorSignature;

      if (db.isConnected && db.db) {
        await db.db.collection('blocks').updateOne({ index: b.index }, { $set: b });
      }
    }

    await db.logAudit({
      event: 'CHAIN_REPAIRED',
      details: 'Consortium validator consensus restored block state integrity.'
    });

    return { message: 'Blockchain integrity restored.' };
  }
}

module.exports = new Blockchain();
