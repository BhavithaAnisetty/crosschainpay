import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Users, 
  Database, 
  Server, 
  Lock, 
  CheckCircle2, 
  RefreshCw,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard({ user, setCurrentPage, setNotification, onQuickSwitchAdmin }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getAdminMetrics();
      setData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadMetrics();
    }
  }, [user]);

  // If user is not admin
  if (user?.role !== 'admin') {
    return (
      <div className="page-container" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px 24px' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#FEE2E2', color: 'var(--color-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-navy-blue)', marginBottom: '8px' }}>
            Administrator Access Restricted
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '24px' }}>
            The Compliance &amp; Admin Dashboard is restricted to institutional administrators with supervisory permissions.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={onQuickSwitchAdmin}>
              Switch to Demo Admin Account
            </button>
            <button className="btn-secondary" onClick={() => setCurrentPage('dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-navy-blue)' }}>
              Chief Compliance &amp; Admin Control
            </h2>
            <span style={{ fontSize: '0.72rem', backgroundColor: '#FEF3C7', color: '#D6AE54', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
              ADMIN PRIVILEGES
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
            Real-time interbank settlement surveillance and cryptographic proof audit.
          </p>
        </div>

        <button className="btn-secondary" onClick={loadMetrics}>
          <RefreshCw size={15} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {loading && !data ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
          Querying administrative metrics and blockchain health...
        </div>
      ) : (
        <>
          {/* Admin Stats Grid */}
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ backgroundColor: '#EAF6FF', color: 'var(--color-royal-blue)' }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <div className="metric-label">Total Payment Flow</div>
                <div className="metric-value">
                  ${Number(data?.metrics?.totalVolumeUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ backgroundColor: '#DCFCE7', color: 'var(--color-green)' }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="metric-label">Completed Settlements</div>
                <div className="metric-value">{data?.metrics?.successfulCount || 0}</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ backgroundColor: 'var(--color-light-grey)', color: 'var(--color-navy-blue)' }}>
                <Users size={24} />
              </div>
              <div>
                <div className="metric-label">Active Users</div>
                <div className="metric-value">{data?.metrics?.usersCount || 2}</div>
              </div>
            </div>

            <div className="metric-card">
              <div className="metric-icon-wrap" style={{ backgroundColor: '#FEF3C7', color: '#D6AE54' }}>
                <CreditCard size={24} />
              </div>
              <div>
                <div className="metric-label">Beneficiaries Enrolled</div>
                <div className="metric-value">{data?.metrics?.beneficiariesCount || 3}</div>
              </div>
            </div>
          </div>

          {/* Infrastructure Health Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '28px' }}>
            
            <div className="card">
              <div className="card-header">
                <div className="card-title">Database Status</div>
                <span className="badge badge-success">MongoDB Connected</span>
              </div>
              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--color-light-grey)', borderRadius: '6px' }}>
                  <span style={{ color: '#64748B' }}>Database Name:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>crosschain_pay</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--color-light-grey)', borderRadius: '6px' }}>
                  <span style={{ color: '#64748B' }}>Storage Architecture:</span>
                  <span>Document Store with Unique Indexing</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--color-light-grey)', borderRadius: '6px' }}>
                  <span style={{ color: '#64748B' }}>Audit Log Persistence:</span>
                  <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>Active</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">Blockchain Node Health</div>
                <span className="badge badge-success">EVM Localhost</span>
              </div>
              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--color-light-grey)', borderRadius: '6px' }}>
                  <span style={{ color: '#64748B' }}>Smart Contract:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-royal-blue)' }}>PaymentLedger</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--color-light-grey)', borderRadius: '6px' }}>
                  <span style={{ color: '#64748B' }}>Chain ID:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>31337</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--color-light-grey)', borderRadius: '6px' }}>
                  <span style={{ color: '#64748B' }}>Current Block:</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>#{data?.nodeStatus?.blockNumber || 108}</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Recent Ledger Recordings */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Settlements Monitored</div>
              <div className="card-subtitle">Real-time interbank coordination logs</div>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Sender</th>
                    <th>Beneficiary</th>
                    <th>Sent Amount</th>
                    <th>Converted</th>
                    <th>Block #</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentPayments || []).map(p => (
                    <tr key={p.paymentId}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-royal-blue)' }}>{p.paymentId}</td>
                      <td>{p.senderName}</td>
                      <td>{p.beneficiaryName} ({p.destinationCountry})</td>
                      <td>${p.paymentAmount.toFixed(2)} USD</td>
                      <td style={{ color: 'var(--color-green)', fontWeight: 600 }}>{p.convertedAmount.toLocaleString()} {p.destinationCurrency}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>#{p.blockNumber}</td>
                      <td><span className="badge badge-success">{p.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
