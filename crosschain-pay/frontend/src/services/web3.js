import { ethers } from 'ethers';
import contractAddressData from '../contracts/PaymentLedgerAddress.json';
import contractAbiData from '../contracts/PaymentLedgerABI.json';

class Web3Service {
  constructor() {
    this.provider = null;
    this.signer = null;
    this.account = null;
    this.contract = null;
    this.contractAddress = contractAddressData.address || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
    this.abi = contractAbiData;
  }

  isMetaMaskAvailable() {
    return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
  }

  async connectWallet() {
    if (!this.isMetaMaskAvailable()) {
      throw new Error('MetaMask is not installed. You can still use CrossChain Pay with automated consortium verification!');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await this.provider.send('eth_requestAccounts', []);
      this.account = accounts[0];
      this.signer = await this.provider.getSigner();

      this.contract = new ethers.Contract(this.contractAddress, this.abi, this.signer);

      return {
        account: this.account,
        contractAddress: this.contractAddress,
        network: await this.provider.getNetwork()
      };
    } catch (err) {
      console.error('Wallet connection error:', err);
      throw new Error(err.message || 'Failed to connect MetaMask wallet');
    }
  }

  async getConnectedAccount() {
    if (!this.isMetaMaskAvailable()) return null;
    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await this.provider.listAccounts();
      if (accounts && accounts.length > 0) {
        this.account = accounts[0].address;
        this.signer = await this.provider.getSigner();
        this.contract = new ethers.Contract(this.contractAddress, this.abi, this.signer);
        return this.account;
      }
    } catch (e) {
      console.warn('Silent account check:', e);
    }
    return null;
  }

  async recordPayment(paymentId, beneficiary, destinationCountry, destinationCurrency, amountUSD) {
    if (!this.contract || !this.signer) {
      throw new Error('Wallet not connected to smart contract. Please connect MetaMask or use automated rail.');
    }

    // Scale amount by 100 to represent integer cents
    const scaledAmount = Math.round(Number(amountUSD) * 100);

    const tx = await this.contract.recordPayment(
      paymentId,
      beneficiary,
      destinationCountry,
      destinationCurrency,
      scaledAmount
    );

    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      sender: this.account
    };
  }

  async verifyPaymentOnChain(paymentId) {
    if (!this.contract) {
      // Create read-only fallback provider if no wallet connected
      const rpcProvider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      const readOnlyContract = new ethers.Contract(this.contractAddress, this.abi, rpcProvider);
      return await readOnlyContract.verifyPayment(paymentId);
    }
    return await this.contract.verifyPayment(paymentId);
  }
}

export const web3Service = new Web3Service();
