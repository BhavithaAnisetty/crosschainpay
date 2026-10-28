const db = require('../db/mongodb');
const oracle = require('./Oracle');
const crypto = require('crypto');

/**
 * Smart Contract for Permissioned Cross-Border Payments.
 * Deployed to the consortium blockchain.
 */
class PaymentSmartContract {
  constructor() {
    this.contractAddress = '0x8A97bFe4587c126dE90cA1450Fe3e3c6a461e73B';
    this.version = '1.0.0';
    this.maxSingleTransferLimitUSD = 50000; // Regulatory AML cap for automated processing
  }

  /**
   * Seed default consortium actors into MongoDB.
   */
  async seedInitialParticipants() {
    const participants = [
      {
        id: 'SENDER_ALICE_US',
        name: 'Alice Johnson',
        role: 'SENDER',
        country: 'USA',
        currency: 'USD',
        balance: 25000.00,
        kycStatus: 'VERIFIED',
        bankNodeId: 'NODE_JPM_US',
        accountNumber: 'US-CHK-88392019'
      },
      {
        id: 'BENEFICIARY_RAJ_IN',
        name: 'Raj Sharma',
        role: 'BENEFICIARY',
        country: 'IND',
        currency: 'INR',
        balance: 145000.00,
        kycStatus: 'VERIFIED',
        bankNodeId: 'NODE_SBI_IN',
        accountNumber: 'IN-SB-44910283'
      },
      {
        id: 'BENEFICIARY_CHLOE_FR',
        name: 'Chloe Dupont',
        role: 'BENEFICIARY',
        country: 'FRA',
        currency: 'EUR',
        balance: 3200.00,
        kycStatus: 'VERIFIED',
        bankNodeId: 'NODE_DB_EU',
        accountNumber: 'FR-IBAN-99201948'
      },
      {
        id: 'NODE_JPM_US',
        name: 'JP Morgan Chase US',
        role: 'BANK_VALIDATOR',
        country: 'USA',
        currency: 'USD',
        isValidator: true,
        kycStatus: 'VERIFIED'
      },
      {
        id: 'NODE_HSBC_UK',
        name: 'HSBC London Global Settlement',
        role: 'BANK_VALIDATOR',
        country: 'GBR',
        currency: 'GBP',
        isValidator: true,
        kycStatus: 'VERIFIED'
      },
      {
        id: 'NODE_DB_EU',
        name: 'Deutsche Bank Frankfurt',
        role: 'BANK_VALIDATOR',
        country: 'DEU',
        currency: 'EUR',
        isValidator: true,
        kycStatus: 'VERIFIED'
      },
      {
        id: 'NODE_SBI_IN',
        name: 'State Bank of India Cross-Border Rail',
        role: 'BANK_VALIDATOR',
        country: 'IND',
        currency: 'INR',
        isValidator: true,
        kycStatus: 'VERIFIED'
      }
    ];

    for (const p of participants) {
      const existing = await db.getParticipant(p.id);
      if (!existing) {
        await db.upsertParticipant(p);
      }
    }
  }

  // ==========================================
  // PARTICIPANT MANAGEMENT
  // ==========================================

  /**
   * Adds or registers a new participant in the consortium.
   */
  async addParticipant({ id, name, role, country, currency, balance = 0, kycStatus = 'PENDING', bankNodeId = null }) {
    if (!id || !name || !role || !country || !currency) {
      throw new Error('SmartContract.addParticipant: Missing required participant fields');
    }

    const participant = {
      id,
      name,
      role: role.toUpperCase(),
      country: country.toUpperCase(),
      currency: currency.toUpperCase(),
      balance: Number(balance),
      kycStatus: kycStatus.toUpperCase(),
      bankNodeId,
      createdAt: new Date().toISOString()
    };

    await db.upsertParticipant(participant);
    await db.logAudit({
      event: 'PARTICIPANT_REGISTERED',
      participantId: id,
      details: `Participant ${name} (${role}) registered with KYC ${kycStatus}`
    });

    return participant;
  }

  /**
   * Verifies participant eligibility and KYC status.
   */
  async verifyParticipant(participantId) {
    const participant = await db.getParticipant(participantId);
    if (!participant) {
      return { verified: false, reason: `Participant ${participantId} not found in consortium registry.` };
    }

    if (participant.kycStatus !== 'VERIFIED') {
      return { verified: false, reason: `Participant ${participantId} KYC status is ${participant.kycStatus}. Must be VERIFIED.` };
    }

    return { verified: true, participant };
  }

  // ==========================================
  // PAYMENT MANAGEMENT
  // ==========================================

  /**
   * Initiates a cross-border payment.
   * Checks conditions, computes FX rate from Oracle, and creates a payment transaction.
   */
  async initiatePayment({
    senderId,
    beneficiaryId,
    amount,
    srcCurrency,
    dstCurrency,
    purpose = 'Trade/Remittance'
  }) {
    await db.logAudit({
      event: 'STATE_SENDER_LOGIN',
      senderId,
      details: 'Sender authenticated and initiated payment request'
    });

    // 1. Verify Sender
    const senderCheck = await this.verifyParticipant(senderId);
    if (!senderCheck.verified) {
      await db.logAudit({ event: 'VALIDATION_FAILED', reason: senderCheck.reason, senderId });
      throw new Error(`Sender Validation Failed: ${senderCheck.reason}`);
    }
    const sender = senderCheck.participant;

    // 2. Verify Beneficiary
    const beneficiaryCheck = await this.verifyParticipant(beneficiaryId);
    if (!beneficiaryCheck.verified) {
      await db.logAudit({ event: 'VALIDATION_FAILED', reason: beneficiaryCheck.reason, beneficiaryId });
      throw new Error(`Beneficiary Validation Failed: ${beneficiaryCheck.reason}`);
    }
    const beneficiary = beneficiaryCheck.participant;

    // 3. Amount & Currency Validations
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Payment amount must be a positive numeric value');
    }

    if (sender.balance < numAmount) {
      const err = `Insufficient funds: Sender balance is ${sender.balance} ${sender.currency}, requested ${numAmount} ${srcCurrency}`;
      await db.logAudit({ event: 'VALIDATION_FAILED', reason: err, senderId });
      throw new Error(err);
    }

    if (numAmount > this.maxSingleTransferLimitUSD) {
      const err = `AML Limit Exceeded: Transfer amount exceeds maximum single cross-border limit of $${this.maxSingleTransferLimitUSD}`;
      await db.logAudit({ event: 'VALIDATION_FAILED', reason: err, senderId });
      throw new Error(err);
    }

    // 4. Query FX Oracle for exchange rate
    const fxQuote = oracle.convert(numAmount, srcCurrency, dstCurrency);
    await db.saveOracleRate(fxQuote);

    // 5. Generate Payment Transaction
    const txId = 'TX-' + crypto.randomBytes(8).toString('hex').toUpperCase();
    const paymentTx = {
      txId,
      senderId: sender.id,
      senderName: sender.name,
      senderCountry: sender.country,
      beneficiaryId: beneficiary.id,
      beneficiaryName: beneficiary.name,
      beneficiaryCountry: beneficiary.country,
      sourceCurrency: srcCurrency.toUpperCase(),
      destinationCurrency: dstCurrency.toUpperCase(),
      originalAmount: numAmount,
      convertedAmount: fxQuote.convertedAmount,
      exchangeRate: fxQuote.rate,
      oracleSignature: fxQuote.signature,
      oracleQuoteTimestamp: fxQuote.timestamp,
      oracleId: fxQuote.oracleId,
      purpose,
      status: 'INITIATED',
      lifecycleState: 'Create Payment Transaction',
      smartContractAddress: this.contractAddress,
      validatorNode: null,
      blockIndex: null,
      settlementRef: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Lock funds from sender
    sender.balance -= numAmount;
    await db.upsertParticipant(sender);

    // Persist to MongoDB
    await db.insertTransaction(paymentTx);
    await db.logAudit({
      event: 'PAYMENT_TRANSACTION_CREATED',
      txId,
      details: `Created cross-border transaction ${txId}: ${numAmount} ${srcCurrency} -> ${fxQuote.convertedAmount} ${dstCurrency}`
    });

    return paymentTx;
  }

  /**
   * Executes Smart Contract Predefined Rules & Conditions check.
   */
  async executeSmartContractChecks(txId) {
    const tx = await db.getTransaction(txId);
    if (!tx) throw new Error(`Transaction ${txId} not found`);

    // Verify Oracle signature
    const isOracleValid = oracle.verifyQuote({
      oracleId: tx.oracleId,
      fromCurrency: tx.sourceCurrency,
      toCurrency: tx.destinationCurrency,
      rate: tx.exchangeRate,
      timestamp: tx.oracleQuoteTimestamp || tx.createdAt,
      signature: tx.oracleSignature
    });

    if (!isOracleValid) {
      await this.updateStatus(txId, 'REJECTED', 'Oracle signature tampered or invalid FX rate.');
      throw new Error('Smart contract validation failed: Invalid Oracle FX Signature');
    }

    // Update status to VALIDATED
    await this.updateStatus(txId, 'VALIDATED', 'Smart contract rule check passed. Awaiting PoA consensus.');
    return { success: true, message: 'All smart contract rules passed successfully.' };
  }

  /**
   * Retrieves status of a payment.
   */
  async getPaymentStatus(txId) {
    const tx = await db.getTransaction(txId);
    if (!tx) throw new Error(`Payment transaction ${txId} not found`);
    return {
      txId: tx.txId,
      status: tx.status,
      lifecycleState: tx.lifecycleState,
      updatedAt: tx.updatedAt
    };
  }

  /**
   * Retrieves full details of a payment.
   */
  async getPayment(txId) {
    const tx = await db.getTransaction(txId);
    if (!tx) throw new Error(`Payment transaction ${txId} not found`);
    return tx;
  }

  // ==========================================
  // SETTLEMENT MANAGEMENT
  // ==========================================

  /**
   * Bank / Payment Service Provider confirms settlement and fiat disbursement to beneficiary.
   */
  async confirmSettlement(txId, bankValidatorId, externalRailReference = null) {
    const tx = await db.getTransaction(txId);
    if (!tx) throw new Error(`Transaction ${txId} not found`);

    if (tx.status !== 'RECORDED_ON_BLOCKCHAIN') {
      throw new Error(`Cannot settle transaction in '${tx.status}' state. Must be 'RECORDED_ON_BLOCKCHAIN'.`);
    }

    const beneficiary = await db.getParticipant(tx.beneficiaryId);
    if (!beneficiary) throw new Error(`Beneficiary ${tx.beneficiaryId} not found`);

    // Credit beneficiary balance
    beneficiary.balance += tx.convertedAmount;
    await db.upsertParticipant(beneficiary);

    const settlementRef = externalRailReference || `SETTLE-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    await db.updateTransaction(txId, {
      status: 'SETTLED',
      lifecycleState: 'Beneficiary Receives Funds',
      settledByNode: bankValidatorId,
      settlementRef,
      settledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    await db.logAudit({
      event: 'SETTLEMENT_CONFIRMED',
      txId,
      settlementRef,
      details: `Settlement completed by ${bankValidatorId}. Credited ${tx.convertedAmount} ${tx.destinationCurrency} to ${beneficiary.name}.`
    });

    return await db.getTransaction(txId);
  }

  /**
   * Updates payment status.
   */
  async updateStatus(txId, newStatus, reason = '') {
    const updates = {
      status: newStatus,
      statusReason: reason,
      updatedAt: new Date().toISOString()
    };

    if (newStatus === 'VALIDATED') {
      updates.lifecycleState = 'Smart Contract Checks';
    } else if (newStatus === 'RECORDED_ON_BLOCKCHAIN') {
      updates.lifecycleState = 'Record on Blockchain';
    } else if (newStatus === 'SETTLED') {
      updates.lifecycleState = 'Beneficiary Receives Funds';
    } else if (newStatus === 'REJECTED') {
      updates.lifecycleState = 'Validation Failed / Rejected';
    }

    await db.updateTransaction(txId, updates);
    await db.logAudit({
      event: `STATUS_UPDATED_${newStatus}`,
      txId,
      details: `Transaction ${txId} status changed to ${newStatus}. ${reason}`
    });
  }
}

module.exports = new PaymentSmartContract();
