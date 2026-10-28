import React, { useState } from 'react';
import { 
  Wallet, 
  Settings as SettingsIcon, 
  Copy, 
  Check, 
  Info, 
  Shield, 
  User, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { web3Service } from '../services/web3';

export default function Settings({ user, walletAccount, onConnectWallet, setNotification }) {
  const [copied, setCopied] = useState(false);
  const contractAddress = web3Service.contractAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  const copyContract = () => {
    navigator.clipboard.writeText(contractAddress);
    setCopied(true);
    setNotification('Contract address copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="page-container" style={{ maxWidth: '820px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-navy-blue)' }}>
          Settings &amp; Network Configuration
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
          Blockchain RPC endpoints, smart contract addresses, and account credentials.
        </p>
      </div>

      {/* Account Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">User Account</div>
          <span className="badge badge-info">{user?.role}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.85rem' }}>
          <div>
            <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Name</div>
            <strong>{user?.name}</strong>
          </div>
          <div>
            <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Email</div>
            <strong>{user?.email}</strong>
          </div>
          <div>
            <div style={{ color: '#64748B', fontSize: '0.75rem' }}>Assigned Consortium Node</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-royal-blue)' }}>
              NODE_JPM_US (Institutional Node)
            </span>
          </div>
        </div>
      </div>

      {/* Wallet Connection Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">MetaMask Wallet Connection</div>
          {walletAccount ? (
            <span className="badge badge-success">Connected</span>
          ) : (
            <span className="badge badge-pending">Disconnected</span>
          )}
        </div>

        <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '16px' }}>
          Connect your Web3 browser wallet (e.g. MetaMask) to sign smart contract transactions directly on the Ethereum-compatible Hardhat network.
        </p>

        {walletAccount ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase' }}>Active Wallet Address</div>
              <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--color-navy-blue)' }}>
                {walletAccount}
              </strong>
            </div>
            <button className="btn-secondary" onClick={() => setNotification('Wallet is managed via MetaMask extension', 'success')}>
              Connected
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={onConnectWallet}>
            <Wallet size={16} />
            <span>Connect MetaMask Wallet</span>
          </button>
        )}
      </div>

      {/* Smart Contract Configuration Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div className="card-title">Smart Contract &amp; Hardhat Network</div>
          <span className="badge badge-info">Chain ID: 31337</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.82rem' }}>
          <div>
            <div style={{ color: '#64748B', fontSize: '0.75rem', marginBottom: '4px' }}>PaymentLedger Contract Address</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="text" 
                className="form-input" 
                value={contractAddress}
                readOnly
                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', backgroundColor: 'var(--color-light-grey)' }}
              />
              <button className="btn-secondary" onClick={copyContract} style={{ padding: '9px 14px' }}>
                {copied ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
              <div style={{ color: '#64748B', fontSize: '0.72rem' }}>Local RPC URL</div>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>http://127.0.0.1:8545</strong>
            </div>
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
              <div style={{ color: '#64748B', fontSize: '0.72rem' }}>Network Name</div>
              <strong>Hardhat Localhost</strong>
            </div>
            <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
              <div style={{ color: '#64748B', fontSize: '0.72rem' }}>Consensus Engine</div>
              <strong>Proof of Authority</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Educational Prototype Disclaimer */}
      <div className="card" style={{ backgroundColor: 'var(--color-light-sky)', border: '1px solid #BAE6FD' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--color-navy-blue)', fontWeight: 700 }}>
          <Info size={18} color="#2563EB" />
          <span>Educational Prototype Disclaimer</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.6 }}>
          This software is an educational prototype built to demonstrate how blockchain technology coordinates cross-border payment metadata, proof of authorization, and immutable reconciliation. Actual fiat currency conversion, commercial SWIFT integration, or physical banking disbursement are not executed in real financial rails.
        </p>
      </div>

    </div>
  );
}
