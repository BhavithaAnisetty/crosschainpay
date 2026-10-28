import React, { useEffect, useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  ArrowUpRight 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { api } from '../services/api';

export default function Dashboard({ setCurrentPage, user }) {
  const [stats, setStats] = useState({
    totalVolumeUSD: 0,
    successfulCount: 0,
    pendingCount: 0,
    failedCount: 0
  });
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sample weekly volume chart data for clear fintech visualization
  const chartData = [
    { day: 'Mon', volume: 1200 },
    { day: 'Tue', volume: 2400 },
    { day: 'Wed', volume: 1800 },
    { day: 'Thu', volume: 3200 },
    { day: 'Fri', volume: 4800 },
    { day: 'Sat', volume: 2900 },
    { day: 'Sun', volume: 3850 }
  ];

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [statsData, paymentsData] = await Promise.all([
          api.getPaymentStats(),
          api.getPayments({ limit: 5 })
        ]);
        setStats(statsData);
        setRecentPayments(paymentsData);
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  return (
    <div className="page-container">
      {/* Welcome & Action Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy-blue)' }}>
            Welcome back, {user?.name || 'Sender'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
            Consortium Blockchain Payment Gateway &bull; Cross-Border Settlement Coordination
          </p>
        </div>

        <button 
          className="btn-primary" 
          onClick={() => setCurrentPage('send')}
          style={{ padding: '12px 22px', fontSize: '0.95rem' }}
        >
          <Send size={18} />
          <span>Send Payment</span>
        </button>
      </div>

      {/* Notice Banner */}
      <div className="notice-box">
        <strong>Educational Prototype Notice:</strong> CrossChain Pay demonstrates auditable, tamper-resistant payment metadata coordination on an Ethereum-compatible Hardhat network. Not intended for commercial banking operations.
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon-wrap" style={{ backgroundColor: '#EAF6FF', color: 'var(--color-royal-blue)' }}>
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="metric-label">Confirmed Volume</div>
            <div className="metric-value">
              ${Number(stats.totalVolumeUSD || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap" style={{ backgroundColor: '#DCFCE7', color: 'var(--color-green)' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="metric-label">Successful</div>
            <div className="metric-value">{stats.successfulCount || 0}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap" style={{ backgroundColor: '#FEF3C7', color: 'var(--color-orange)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="metric-label">Pending</div>
            <div className="metric-value">{stats.pendingCount || 0}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon-wrap" style={{ backgroundColor: '#FEE2E2', color: 'var(--color-red)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="metric-label">Failed</div>
            <div className="metric-value">{stats.failedCount || 0}</div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Activity Chart & Blockchain Status */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* Payment Activity Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Settlement Activity</div>
              <div className="card-subtitle">Weekly cross-border payment coordination (USD)</div>
            </div>
          </div>

          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.8rem' }}
                  formatter={(value) => [`$${value}`, 'Volume']}
                />
                <Area type="monotone" dataKey="volume" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVolume)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blockchain Status Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="card-header">
              <div>
                <div className="card-title">Blockchain Network Status</div>
                <div className="card-subtitle">Ethereum-Compatible Proof of Authority</div>
              </div>
              <span className="badge badge-success">
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--color-green)' }}></span>
                Operational
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>Consensus Protocol</span>
                <strong style={{ color: 'var(--color-navy-blue)' }}>Proof of Authority (PoA)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>Network Chain ID</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>31337 (Localhost)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>Smart Contract</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-royal-blue)' }}>PaymentLedger.sol</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>Consortium Gas Fee</span>
                <strong style={{ color: 'var(--color-green)' }}>$0.00 (Zero Gas)</strong>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <button 
              className="btn-secondary" 
              onClick={() => setCurrentPage('audit')}
              style={{ width: '100%', fontSize: '0.82rem' }}
            >
              <ShieldCheck size={16} />
              <span>Inspect Blockchain Audit Trail</span>
            </button>
          </div>
        </div>

      </div>

      {/* Recent Transactions Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Transactions</div>
            <div className="card-subtitle">Real-time payment coordination across international corridors</div>
          </div>
          <button 
            className="btn-secondary" 
            onClick={() => setCurrentPage('transactions')}
            style={{ fontSize: '0.8rem', padding: '6px 14px' }}
          >
            <span>View All</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Beneficiary</th>
                <th>Country</th>
                <th>Sent Amount</th>
                <th>Converted Amount</th>
                <th>Status</th>
                <th>Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              {recentPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                    No transactions recorded yet. Click "Send Payment" to initiate!
                  </td>
                </tr>
              ) : (
                recentPayments.map((p) => {
                  let badgeClass = 'badge-pending';
                  if (p.status === 'Settled' || p.status === 'Recorded') badgeClass = 'badge-success';
                  if (p.status === 'Failed') badgeClass = 'badge-failed';

                  return (
                    <tr key={p.paymentId}>
                      <td style={{ fontWeight: 600, color: 'var(--color-royal-blue)', fontFamily: 'var(--font-mono)' }}>
                        {p.paymentId}
                      </td>
                      <td style={{ fontWeight: 500 }}>{p.beneficiaryName}</td>
                      <td>{p.destinationCountry}</td>
                      <td style={{ fontWeight: 600 }}>${p.paymentAmount.toFixed(2)} USD</td>
                      <td style={{ color: 'var(--color-green)', fontWeight: 600 }}>
                        {p.convertedAmount.toLocaleString()} {p.destinationCurrency}
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{p.status}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#64748B' }}>
                        {p.txHash ? `${p.txHash.slice(0, 10)}...${p.txHash.slice(-6)}` : 'On-Chain'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
