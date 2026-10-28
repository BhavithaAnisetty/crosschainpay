import React from 'react';
import { Menu, Wallet, LogOut, UserCheck } from 'lucide-react';

export default function Navbar({ 
  pageTitle, 
  user, 
  onLogout, 
  walletAccount, 
  onConnectWallet, 
  setMobileOpen 
}) {
  return (
    <header className="top-navbar">
      <div className="nav-left">
        <button 
          className="menu-toggle-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Toggle Navigation"
        >
          <Menu size={22} />
        </button>
        <h1 className="page-title">{pageTitle}</h1>
      </div>

      <div className="nav-right">
        {walletAccount ? (
          <div className="wallet-btn connected" title={`Connected MetaMask: ${walletAccount}`}>
            <Wallet size={15} color="#16A34A" />
            <span style={{ fontFamily: 'var(--font-mono)' }}>
              {walletAccount.slice(0, 6)}...{walletAccount.slice(-4)}
            </span>
          </div>
        ) : (
          <button className="wallet-btn" onClick={onConnectWallet}>
            <Wallet size={15} />
            <span>Connect MetaMask</span>
          </button>
        )}

        {user && (
          <div className="user-badge">
            <UserCheck size={15} color="#2563EB" />
            <span style={{ fontWeight: 600 }}>{user.name}</span>
            <span style={{ 
              fontSize: '0.7rem', 
              padding: '2px 6px', 
              borderRadius: '4px',
              backgroundColor: user.role === 'admin' ? '#FEF3C7' : '#EAF6FF',
              color: user.role === 'admin' ? '#D6AE54' : '#2563EB',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              {user.role}
            </span>
          </div>
        )}

        <button 
          className="btn-secondary" 
          onClick={onLogout}
          style={{ padding: '8px 12px', fontSize: '0.8rem' }}
          title="Sign out"
        >
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
