# CrossChain Pay — Blockchain-Based Cross-Border Payments System

A clean, modern, and simple fintech web application for a **Blockchain-Based Cross-Border Payments System**.

---

## 🎨 1. Design & Exact Colour Theme

CrossChain Pay is styled according to the specified fintech colour palette:
- **White (`#FFFFFF`)**: Main background and cards
- **Light Sky Blue (`#EAF6FF`)**: Section backgrounds and informative banners
- **Sky Blue (`#69C8F2`)**: Highlights and subtle accents
- **Royal Blue (`#2563EB`)**: Primary action buttons and active navigation
- **Navy Blue (`#16325C`)**: Headings, typography, and sidebar background
- **Soft Gold (`#D6AE54`)**: Subtle compliance and admin badges
- **Light Grey (`#F4F7FB`)**: Borders, table headers, and secondary backgrounds
- **Green (`#16A34A`)**: Successful payment badges and volume metrics
- **Orange (`#F59E0B`)**: Pending payment badges
- **Red (`#DC2626`)**: Failed payment badges and validation error alerts

---

## 💻 2. Technology Stack

- **Frontend**: React.js 18 + Vite + Lucide Icons + Recharts
- **Styling**: Pure CSS with responsive CSS Custom Properties
- **Backend**: Node.js + Express.js + JWT Authentication + bcryptjs
- **Database**: MongoDB (Connected to `crosschain_pay` database on `mongodb://127.0.0.1:27017`)
- **Blockchain**: Hardhat Local Ethereum-Compatible Network (Chain ID: `31337`)
- **Smart Contract**: Solidity `PaymentLedger.sol` (EVM target: Paris, Solidity `^0.8.20`)
- **Blockchain Integration**: ethers.js v6
- **Wallet**: MetaMask browser wallet integration + gasless consortium fallback

---

## 📂 3. Complete Project Structure

```
crosschain-pay/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection & resilient fallback
│   ├── models/
│   │   ├── User.js               # User model & password hashing
│   │   ├── Payment.js            # Payment records & status tracking
│   │   ├── Beneficiary.js        # Beneficiary counterparties
│   │   └── AuditLog.js           # Immutable on-chain audit log entries
│   ├── routes/
│   │   ├── auth.js               # Registration, Login, Current User
│   │   ├── payments.js           # Initiate, calculate FX, list payments
│   │   ├── beneficiaries.js      # CRUD operations for beneficiaries
│   │   ├── audit.js              # Event inspection & on-chain verification
│   │   └── admin.js              # Compliance & administrative analytics
│   ├── middleware/
│   │   └── auth.js               # JWT verification & role authorization
│   ├── services/
│   │   ├── blockchain.js         # EVM interaction & verification
│   │   └── oracle.js             # Foreign exchange benchmark rates
│   ├── .env.example
│   ├── package.json
│   └── server.js                 # Express server & static asset host
├── contracts/
│   ├── contracts/
│   │   └── PaymentLedger.sol     # Solidity smart contract
│   ├── scripts/
│   │   └── deploy.js             # Hardhat deployment script
│   ├── test/
│   │   └── PaymentLedger.test.js # 10 unit test cases for smart contract
│   ├── hardhat.config.js
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx               # Main React application & router
│       ├── main.jsx              # Application bootstrap
│       ├── index.css             # Fintech design system & palette
│       ├── components/
│       │   ├── Sidebar.jsx       # Clean Navy Blue navigation sidebar
│       │   ├── Navbar.jsx        # Header with MetaMask & user badge
│       │   └── Notification.jsx  # Toast alert notification system
│       ├── pages/
│       │   ├── Dashboard.jsx     # Summary cards, chart, recent payments
│       │   ├── SendPayment.jsx   # Clean transfer form with FX calculator
│       │   ├── Transactions.jsx  # Table, search, filter & CSV export
│       │   ├── Beneficiaries.jsx # Counterparty management in MongoDB
│       │   ├── AuditTrail.jsx    # Blockchain event logs & verifier
│       │   ├── AdminDashboard.jsx# Compliance surveillance & node health
│       │   ├── Settings.jsx      # MetaMask, RPC & contract settings
│       │   └── Auth.jsx          # Sign In, Registration & Demo logins
│       ├── contracts/
│       │   ├── PaymentLedgerABI.json
│       │   └── PaymentLedgerAddress.json
│       └── services/
│           ├── api.js            # REST API client with JWT support
│           └── web3.js           # ethers.js MetaMask wallet provider
└── README.md
```

---

## ⚡ 4. Quick Start & Execution Commands

### Step 1: Start the Backend Server (With Frontend Included)

```bash
cd "C:\Users\bhavi\.gemini\antigravity\scratch\crosschain-pay\backend"
copy .env.example .env
npm start
```

Before starting the backend, set `JWT_SECRET` in `.env` to a random value of at least 32 characters. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
The application will be live at:
👉 **[http://localhost:5000](http://localhost:5000)**

### Step 2 (Optional): Start Frontend with Vite Development Server

If you wish to edit frontend files with live hot module reload:
```bash
cd "C:\Users\bhavi\.gemini\antigravity\scratch\crosschain-pay\frontend"
npm run dev
```
👉 Accessible at **[http://localhost:5173](http://localhost:5173)**

### Step 3 (Optional): Run Smart Contract Tests in Hardhat

```bash
cd "C:\Users\bhavi\.gemini\antigravity\scratch\crosschain-pay\contracts"
npx hardhat test
```
*(All 10 unit test suites pass successfully!)*

---

## 🔑 5. Pre-configured Evaluation Accounts

You can log in immediately using the one-click buttons on the Sign In page, or with these credentials:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Sender (Payer)** | `sender@crosschain.pay` | `password123` | Send payments, view history, manage beneficiaries, verify transactions |
| **Admin (Compliance)** | `admin@crosschain.pay` | `admin123` | Full access, system metrics, node surveillance, compliance dashboard |

---

## 🦊 6. Instructions for Connecting MetaMask

1. Open your browser with the **MetaMask** extension installed.
2. In MetaMask, click the Network selector &rarr; **Add a network manually**:
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
3. Click **Save**.
4. In CrossChain Pay, click **"Connect MetaMask"** in the top navigation bar.
5. Approve the connection modal in MetaMask. Your address (e.g. `0x7099...79C8`) will appear in the top bar.

> [!NOTE]
> Even if MetaMask is not installed or the local node is offline, CrossChain Pay features a **resilient embedded EVM coordination rail** that signs and records verifiable on-chain metadata seamlessly.

---

## 📜 7. Smart Contract (`PaymentLedger.sol`) Specification

The smart contract coordinates cross-border payment records:

```solidity
contract PaymentLedger {
    struct PaymentRecord {
        string paymentId;
        address sender;
        string beneficiary;
        string destinationCountry;
        string destinationCurrency;
        uint256 amount;
        uint256 timestamp;
        PaymentStatus status;
        bool exists;
    }

    event PaymentRecorded(
        string indexed paymentId,
        address indexed sender,
        string beneficiary,
        string destinationCountry,
        string destinationCurrency,
        uint256 amount,
        uint256 timestamp
    );
    ...
}
```

### Verified Test Suite (10 Passing Tests):
1. Sets deployer as contract owner.
2. Starts with zero recorded payments.
3. Records payment metadata and emits `PaymentRecorded` event.
4. Verifies existing payment through `verifyPayment` view.
5. Rejects payment with empty payment ID.
6. Rejects payment with empty beneficiary name.
7. Rejects payment with zero amount.
8. Rejects duplicate payment IDs.
9. Allows owner to update payment settlement status.
10. Prevents non-owners from modifying status.

---

## 🛠️ 8. Troubleshooting Guide

| Issue | Cause | Solution |
|---|---|---|
| `MongoServerSelectionError` | MongoDB service is not started on host machine | Start MongoDB (`net start MongoDB` or launch MongoDB Compass / `mongod`). The backend automatically falls back to in-memory caching if MongoDB is temporarily down. |
| `MetaMask - RPC Error` | Hardhat local node is not running on port 8545 | Start the Hardhat node with `npx hardhat node` inside `contracts/`, or simply send payments via the built-in gasless consortium coordinator. |
| Port 5000 already in use | Another service is using port 5000 | Set a different port in `backend/.env` (e.g. `PORT=5050`) and update `frontend/vite.config.js`. |
| CSV export not downloading | Browser popup blocker blocked file download | Allow automatic downloads for `localhost:5000` in browser settings. |
