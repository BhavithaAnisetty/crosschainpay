const crypto = require('crypto');

/**
 * Represents a Block in the Permissioned Cross-Border Payment Blockchain.
 */
class Block {
  constructor(index, timestamp, transactions, previousHash = '', validator = 'GENESIS_NODE') {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.previousHash = previousHash;
    this.validator = validator;
    this.merkleRoot = this.calculateMerkleRoot();
    this.hash = this.calculateHash();
    this.validatorSignature = this.generateValidatorSignature();
  }

  /**
   * Calculates the Merkle root of all transactions in this block.
   */
  calculateMerkleRoot() {
    if (!this.transactions || this.transactions.length === 0) {
      return crypto.createHash('sha256').update('EMPTY_BLOCK').digest('hex');
    }

    let hashes = this.transactions.map(tx => {
      const data = typeof tx === 'string' ? tx : JSON.stringify(tx);
      return crypto.createHash('sha256').update(data).digest('hex');
    });

    while (hashes.length > 1) {
      if (hashes.length % 2 !== 0) {
        hashes.push(hashes[hashes.length - 1]);
      }
      const newLevel = [];
      for (let i = 0; i < hashes.length; i += 2) {
        const combined = hashes[i] + hashes[i + 1];
        newLevel.push(crypto.createHash('sha256').update(combined).digest('hex'));
      }
      hashes = newLevel;
    }

    return hashes[0];
  }

  /**
   * Computes SHA-256 hash of the block contents.
   */
  calculateHash() {
    const blockPayload = JSON.stringify({
      index: this.index,
      timestamp: this.timestamp,
      previousHash: this.previousHash,
      merkleRoot: this.merkleRoot,
      validator: this.validator
    });
    return crypto.createHash('sha256').update(blockPayload).digest('hex');
  }

  /**
   * Generates a cryptographic Proof of Authority attestation signature
   * by the designated validator node.
   */
  generateValidatorSignature() {
    return crypto
      .createHmac('sha256', `POA_VALIDATOR_SECRET_${this.validator}`)
      .update(`${this.hash}:${this.validator}:${this.timestamp}`)
      .digest('hex');
  }

  /**
   * Verifies validator signature validity.
   */
  verifyValidatorSignature() {
    const expected = crypto
      .createHmac('sha256', `POA_VALIDATOR_SECRET_${this.validator}`)
      .update(`${this.hash}:${this.validator}:${this.timestamp}`)
      .digest('hex');
    return expected === this.validatorSignature;
  }
}

module.exports = Block;
