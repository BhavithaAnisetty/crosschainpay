import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Notification from './components/Notification';

import Dashboard from './pages/Dashboard';
import SendPayment from './pages/SendPayment';
import Transactions from './pages/Transactions';
import Beneficiaries from './pages/Beneficiaries';
import AuditTrail from './pages/AuditTrail';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import Auth from './pages/Auth';

import { api } from './services/api';
import { web3Service } from './services/web3';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [walletAccount, setWalletAccount] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: 'success' });

  // Initialize Auth & Wallet check
  useEffect(() => {
    const existingUser = api.getCurrentUser();
    if (existingUser) {
      setUser(existingUser);
    }

    // Check silent MetaMask connection
    web3Service.getConnectedAccount().then(acc => {
      if (acc) setWalletAccount(acc);
    });

    // Listen to MetaMask account changes if installed
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setWalletAccount(accounts[0]);
          triggerNotification(`MetaMask Account switched: ${accounts[0].slice(0, 6)}...`, 'info');
        } else {
          setWalletAccount(null);
        }
      });
    }
  }, []);

  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleConnectWallet = async () => {
    try {
      const res = await web3Service.connectWallet();
      setWalletAccount(res.account);
      triggerNotification(`Connected MetaMask: ${res.account.slice(0, 6)}...${res.account.slice(-4)}`, 'success');
    } catch (err) {
      triggerNotification(err.message, 'error');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setCurrentPage('dashboard');
    triggerNotification('Logged out successfully.', 'info');
  };

  const handleQuickSwitchAdmin = async () => {
    try {
      const res = await api.login('admin@crosschain.pay', 'admin123');
      setUser(res.user);
      setCurrentPage('admin');
      triggerNotification('Switched to Administrator Account!', 'success');
    } catch (e) {
      triggerNotification(e.message, 'error');
    }
  };

  // If not logged in, show Auth
  if (!user) {
    return (
      <>
        <Auth 
          onLoginSuccess={(loggedUser) => setUser(loggedUser)} 
          setNotification={triggerNotification} 
        />
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification({ message: '', type: 'success' })} 
        />
      </>
    );
  }

  // Titles mapping
  const titles = {
    dashboard: 'Dashboard Overview',
    send: 'Send Cross-Border Payment',
    transactions: 'Transaction Ledger & History',
    beneficiaries: 'Beneficiary Management',
    audit: 'Blockchain Audit Trail',
    admin: 'Chief Compliance & Admin Control',
    settings: 'Settings & Network Information'
  };

  return (
    <div className="app-container">
      {/* Blue Sidebar */}
      <Sidebar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        user={user}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Navbar 
          pageTitle={titles[currentPage] || 'CrossChain Pay'}
          user={user}
          onLogout={handleLogout}
          walletAccount={walletAccount}
          onConnectWallet={handleConnectWallet}
          setMobileOpen={setMobileOpen}
        />

        <main style={{ flex: 1 }}>
          {currentPage === 'dashboard' && (
            <Dashboard setCurrentPage={setCurrentPage} user={user} />
          )}
          {currentPage === 'send' && (
            <SendPayment 
              setCurrentPage={setCurrentPage} 
              setNotification={triggerNotification} 
              walletAccount={walletAccount}
            />
          )}
          {currentPage === 'transactions' && (
            <Transactions setNotification={triggerNotification} />
          )}
          {currentPage === 'beneficiaries' && (
            <Beneficiaries setNotification={triggerNotification} />
          )}
          {currentPage === 'audit' && (
            <AuditTrail setNotification={triggerNotification} />
          )}
          {currentPage === 'admin' && (
            <AdminDashboard 
              user={user} 
              setCurrentPage={setCurrentPage} 
              setNotification={triggerNotification}
              onQuickSwitchAdmin={handleQuickSwitchAdmin}
            />
          )}
          {currentPage === 'settings' && (
            <Settings 
              user={user} 
              walletAccount={walletAccount}
              onConnectWallet={handleConnectWallet}
              setNotification={triggerNotification}
            />
          )}
        </main>
      </div>

      {/* Toast Notification */}
      <Notification 
        message={notification.message} 
        type={notification.type} 
        onClose={() => setNotification({ message: '', type: 'success' })} 
      />
    </div>
  );
}
