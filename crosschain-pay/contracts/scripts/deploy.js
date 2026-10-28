const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================");
  console.log(" Deploying PaymentLedger Smart Contract...      ");
  console.log("=================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);

  const PaymentLedger = await hre.ethers.getContractFactory("PaymentLedger");
  const paymentLedger = await PaymentLedger.deploy();
  await paymentLedger.waitForDeployment();

  const contractAddress = await paymentLedger.getAddress();
  console.log(">>> PaymentLedger deployed to:", contractAddress);

  // Write contract address and ABI to frontend/src/contracts/
  const contractsDir = path.join(__dirname, "../../frontend/src/contracts");
  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir, { recursive: true });
  }

  const contractArtifact = await hre.artifacts.readArtifact("PaymentLedger");

  fs.writeFileSync(
    path.join(contractsDir, "PaymentLedgerAddress.json"),
    JSON.stringify({ address: contractAddress, network: "localhost", chainId: 31337 }, null, 2)
  );

  fs.writeFileSync(
    path.join(contractsDir, "PaymentLedgerABI.json"),
    JSON.stringify(contractArtifact.abi, null, 2)
  );

  console.log("Saved ABI & deployed address to frontend/src/contracts/");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment error:", error);
    process.exit(1);
  });
