# Blockchain-Based Cross-Border Payments System

A fully functional, enterprise-grade working model of a **Permissioned / Consortium Blockchain for Cross-Border Payments** with **Proof of Authority (PoA)** consensus, **Smart Contracts**, **Foreign Exchange (FX) Oracles**, and **MongoDB** persistence.

---

## 🌟 Key Architecture & Highlights

1. **Permissioned Consortium Model (Proof of Authority - PoA)**:
   - Designed for banks and payment service providers (PSPs).
   - Only authorized institutional nodes (`NODE_JPM_US`, `NODE_HSBC_UK`, `NODE_DB_EU`, `NODE_SBI_IN`) can validate transactions and mint blocks.
   - Eliminates heavy mining costs of Proof of Work and features **$0.00 gas fees** suitable for regulated interbank settlement.

2. **MongoDB Database Persistence**:
   - Database: `crossborder_payments` (Default: `mongodb://127.0.0.1:27017`)
   - Collections:
     - `blocks`: Cryptographically chained blocks with index, timestamp, SHA-256 hash, previousHash, Merkle root, transactions, and validator signature.
     - `transactions`: Complete cross-border payment records with status lifecycle tracking.
     - `participants`: Senders, bank nodes, and beneficiaries with KYC status, country, balance, and account numbers.
     - `audit_logs`: Detailed step-by-step state machine transition audit trail.
     - `oracle_rates`: Historical and signed FX quotes.

3. **Smart Contract Engine (`PaymentSmartContract`)**:
   - **Participant Management**:
     - `addParticipant()`: Enrolls new institutions or individuals.
     - `verifyParticipant()`: Checks KYC credentials and participant eligibility.
   - **Payment Management**:
     - `initiatePayment()`: Sender creates a cross-border transfer.
     - `executeSmartContractChecks()`: Validates KYC, sender balance, AML transaction limits ($50,000 max single transfer), and Oracle signature.
     - `getPayment()` & `getPaymentStatus()`: Real-time transaction query.
   - **Settlement Management**:
     - `confirmSettlement()`: Bank / PSP off-ramp executes fiat conversion and disburses funds to the beneficiary.
     - `updateStatus()`: Manages transaction state progression (`INITIATED` &rarr; `VALIDATED` &rarr; `RECORDED_ON_BLOCKCHAIN` &rarr; `SETTLED` / `REJECTED`).

4. **Foreign Exchange (FX) Oracle**:
   - Simulates trusted off-chain financial data providers (e.g. Reuters, Bloomberg, Chainlink).
   - Produces cryptographically signed quotes (`HMAC-SHA256`) for USD, EUR, GBP, INR, JPY, CAD, AUD, SGD, AED.

5. **Interactive Live State Machine Visualizer**:
   - Directly maps to the state diagram:
   `START` &rarr; `Sender Login / Authorization` &rarr; `Enter Beneficiary and Amount` &rarr; `Validate Payment Details` &rarr; `Create Payment Transaction` &rarr; `Smart Contract Checks` &rarr; `Consensus / Authorized Validation (PoA)` &rarr; `Record on Blockchain` &rarr; `Settlement / Off-Ramp` &rarr; `Beneficiary Receives Funds` &rarr; `View Payment Status` &rarr; `END`.
   - Visual feedback for both successful flows and rejection states (e.g., overdraft, AML limit cap).

6. **Tamper Detection & Immutability Audit**:
   - The UI includes a **"Simulate Tampering"** button that alters transaction data directly in MongoDB without the consensus key.
   - Running **"Verify Cryptographic Integrity"** recalculates SHA-256 hashes, Merkle roots, and PoA signatures, demonstrating instant tamper detection.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+)
- **MongoDB** (v7.0+ or v8.0+ running on `mongodb://127.0.0.1:27017` or configured via `MONGODB_URI`)

### 2. Run the Working Model Server
```bash
# Navigate to the project directory
cd "C:\Users\bhavi\.gemini\antigravity\scratch\blockchain-crossborder-payments"

# Start the application server
npm start
```

Open your browser to:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🧪 Running the Headless Simulation Test

You can run an automated end-to-end test suite that executes all 8 lifecycle phases in MongoDB:

```bash
npm test
```

### Test Suite Execution Output:
- **Test 1**: Connect to MongoDB & bootstrap Genesis Block.
- **Test 2**: Query FX Oracle & verify HMAC cryptographic signature.
- **Test 3**: Sender initiates cross-border payment (e.g., $2,500 USD &rarr; 208,625 INR).
- **Test 4**: Smart contract executes rule checks (KYC, AML cap, balances).
- **Test 5**: Proof of Authority Consensus & Block Minting by authorized validator (`NODE_JPM_US`).
- **Test 6**: Bank / PSP confirms settlement and disburses fiat to Beneficiary.
- **Test 7**: Full cryptographic chain verification (SHA-256 block hashes, previous hash link, Merkle roots).
- **Test 8**: Tampering attack simulation & instant detection.

---

## 🖥️ Web Dashboard Features

1. **Payment Flow & State Diagram Tab**:
   - Interactive payment initiation form.
   - Live Oracle exchange rate converter.
   - Real-time animated state progress tracking.
   - One-Click **"Execute Full End-to-End Workflow"** or step-by-step execution.
   - Settlement Receipt with transaction ID, validator signature, and block hash.
   - Edge case simulation triggers (exceed limit, zero balance).

2. **Consortium Blockchain Explorer Tab**:
   - View all mined blocks stored in MongoDB.
   - Inspect SHA-256 current hash, previous hash, Merkle root, and PoA validator signatures.
   - Live cryptographic integrity audit runner.
   - Tamper simulation and restoration tool.

3. **FX Oracle & Rates Tab**:
   - Real-time currency exchange rates.
   - Interactive FX conversion simulator with signed quote generation.

4. **MongoDB Collections Tab**:
   - Live document viewer for all collections: `blocks`, `transactions`, `participants`, `audit_logs`.
   - Real-time document counts.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/status` | Network health, PoA validators, block height, MongoDB status |
| `GET` | `/api/participants` | List enrolled Senders, Banks, and Beneficiaries |
| `POST` | `/api/participants` | Register new participant (`addParticipant`) |
| `GET` | `/api/oracle/rates` | Active FX exchange rates from Oracle |
| `GET` | `/api/oracle/convert?amount=...&from=...&to=...` | Query signed FX conversion quote |
| `GET` | `/api/payments` | List all payment transactions |
| `POST` | `/api/payments/initiate` | Sender initiates payment (`initiatePayment`) |
| `POST` | `/api/payments/validate` | Execute smart contract condition check |
| `POST` | `/api/payments/mine` | PoA validator creates new block and records tx |
| `POST` | `/api/payments/settle` | Bank confirms settlement off-ramp (`confirmSettlement`) |
| `POST` | `/api/payments/run-full-flow` | Orchestrates complete end-to-end payment lifecycle |
| `GET` | `/api/blockchain/blocks` | Retrieve complete cryptographic blockchain from MongoDB |
| `GET` | `/api/blockchain/verify` | Run SHA-256 cryptographic chain integrity audit |
| `POST` | `/api/blockchain/tamper` | Simulate unauthorized data modification |
| `POST` | `/api/blockchain/repair` | Restore blockchain state |
| `GET` | `/api/audit-logs` | Retrieve chronological state transition logs |

---

## 🗃️ Inspecting Directly via MongoDB Shell (`mongosh`)

You can connect directly to MongoDB from your terminal to inspect the data:

```bash
mongosh "mongodb://127.0.0.1:27017/crossborder_payments"
```

Useful commands:
```javascript
// View collections
show collections;

// View latest blocks
db.blocks.find().pretty();

// View cross-border transactions
db.transactions.find().pretty();

// View participants and updated balances
db.participants.find().pretty();

// View state transition audit trail
db.audit_logs.find().sort({ timestamp: -1 }).limit(10).pretty();
```
