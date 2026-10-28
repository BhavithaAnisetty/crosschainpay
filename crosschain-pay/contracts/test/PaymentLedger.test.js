const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PaymentLedger Smart Contract", function () {
  let paymentLedger;
  let owner;
  let sender;
  let unauthorized;

  beforeEach(async function () {
    [owner, sender, unauthorized] = await ethers.getSigners();
    const PaymentLedger = await ethers.getContractFactory("PaymentLedger");
    paymentLedger = await PaymentLedger.deploy();
    await paymentLedger.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the deployer as owner", async function () {
      expect(await paymentLedger.owner()).to.equal(owner.address);
    });

    it("Should start with zero payments recorded", async function () {
      expect(await paymentLedger.getPaymentCount()).to.equal(0);
    });
  });

  describe("Valid Payment Recording", function () {
    it("Should record payment metadata and emit PaymentRecorded event", async function () {
      const paymentId = "PAY-100293-IN";
      const beneficiary = "Raj Sharma";
      const country = "India";
      const currency = "INR";
      const amount = 250000; // $2500.00 scaled

      await expect(
        paymentLedger.connect(sender).recordPayment(paymentId, beneficiary, country, currency, amount)
      )
        .to.emit(paymentLedger, "PaymentRecorded")
        .withArgs(paymentId, sender.address, beneficiary, country, currency, amount, (val) => val > 0);

      expect(await paymentLedger.getPaymentCount()).to.equal(1);

      const record = await paymentLedger.getPayment(paymentId);
      expect(record.id).to.equal(paymentId);
      expect(record.sender).to.equal(sender.address);
      expect(record.beneficiary).to.equal(beneficiary);
      expect(record.destinationCountry).to.equal(country);
      expect(record.destinationCurrency).to.equal(currency);
      expect(record.amount).to.equal(amount);
      expect(record.status).to.equal(0); // Status.Recorded
    });

    it("Should verify existing payment through verifyPayment view", async function () {
      const paymentId = "PAY-554433-GB";
      await paymentLedger.connect(sender).recordPayment(paymentId, "Liam O'Connor", "UK", "GBP", 150000);

      const verification = await paymentLedger.verifyPayment(paymentId);
      expect(verification.exists).to.be.true;
      expect(verification.sender).to.equal(sender.address);
    });
  });

  describe("Input Validation & Rejections", function () {
    it("Should reject payment with empty payment ID", async function () {
      await expect(
        paymentLedger.connect(sender).recordPayment("", "Beneficiary", "India", "INR", 1000)
      ).to.be.revertedWith("PaymentLedger: Payment ID cannot be empty");
    });

    it("Should reject payment with empty beneficiary", async function () {
      await expect(
        paymentLedger.connect(sender).recordPayment("PAY-1", "", "India", "INR", 1000)
      ).to.be.revertedWith("PaymentLedger: Beneficiary cannot be empty");
    });

    it("Should reject payment with zero amount", async function () {
      await expect(
        paymentLedger.connect(sender).recordPayment("PAY-2", "Beneficiary", "India", "INR", 0)
      ).to.be.revertedWith("PaymentLedger: Amount must be greater than zero");
    });

    it("Should reject duplicate payment IDs", async function () {
      await paymentLedger.connect(sender).recordPayment("PAY-DUP", "Alice", "USA", "USD", 1000);
      await expect(
        paymentLedger.connect(sender).recordPayment("PAY-DUP", "Bob", "USA", "USD", 2000)
      ).to.be.revertedWith("PaymentLedger: Payment ID already recorded");
    });
  });

  describe("Status Updates & Access Control", function () {
    it("Should allow owner to update payment status", async function () {
      await paymentLedger.connect(sender).recordPayment("PAY-UPDATE", "Alice", "USA", "USD", 5000);
      await paymentLedger.connect(owner).updateStatus("PAY-UPDATE", 1); // 1 = Settled

      const record = await paymentLedger.getPayment("PAY-UPDATE");
      expect(record.status).to.equal(1);
    });

    it("Should prevent non-owners from updating status", async function () {
      await paymentLedger.connect(sender).recordPayment("PAY-STATUS-AUTH", "Alice", "USA", "USD", 5000);
      await expect(
        paymentLedger.connect(unauthorized).updateStatus("PAY-STATUS-AUTH", 1)
      ).to.be.revertedWith("PaymentLedger: Caller is not owner");
    });
  });
});
