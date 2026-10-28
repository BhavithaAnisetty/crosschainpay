import React from 'react';
import { 
  LayoutDashboard, 
  Send, 
  History, 
  Users, 
  ShieldCheck, 
  Settings as SettingsIcon, 
  ShieldAlert, 
  Link2,
  X
} from 'lucide-react';

export default function Sidebar({ currentPage, setCurrentPage, mobileOpen, setMobileOpen, user }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'send', label: 'Send Payment', icon: Send },
    { id: 'transactions', label: 'Transaction History', icon: History },
    { id: 'beneficiaries', label: 'Beneficiaries', icon: Users },
    { id: 'audit', label: 'Blockchain Audit Trail', icon: ShieldCheck },
    { id: 'admin', label: 'Admin Dashboard', icon: ShieldAlert, adminOnly: true },
    { id: 'settings', label: 'Settings', icon: SettingsIcon }
  ];

  const handleNav = (id) => {
    setCurrentPage(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="brand-icon">
          <Link2 size={20} />
        </div>
        <div>
          <div className="brand-name">CrossChain Pay</div>
          <div className="brand-sub">Consortium Payment Rail</div>
        </div>
        {mobileOpen && (
          <button 
            onClick={() => setMobileOpen(false)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== 'admin') return null;
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="network-pill">
          <span className="network-dot"></span>
          <span>Hardhat Local (31337)</span>
        </div>
      </div>
    </aside>
  );
}
