import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';

export default function Transactions({ setNotification }) {
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTx, setSelectedTx] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await api.getPayments({ search, status: statusFilter });
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [search, statusFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (payments.length === 0) {
      setNotification('No transactions to export', 'error');
      return;
    }

    const headers = [
      'Transaction ID',
      'Beneficiary',
      'Destination Country',
      'Sent Amount (USD)',
      'Converted Amount',
      'Destination Currency',
      'Exchange Rate',
      'Status',
      'Block Number',
      'Tx Hash',
      'Date & Time'
    ];

    const rows = payments.map(p => [
      `"${p.paymentId}"`,
      `"${p.beneficiaryName}"`,
      `"${p.destinationCountry}"`,
      p.paymentAmount,
      p.convertedAmount,
      `"${p.destinationCurrency}"`,
      p.exchangeRate,
      `"${p.status}"`,
      p.blockNumber || 'N/A',
      `"${p.txHash || ''}"`,
      `"${p.createdAt}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crosschain_pay_transactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification('Transaction ledger successfully exported to CSV!', 'success');
  };

  return (
    <div className="page-container">
      
      {/* Header and Filter Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-navy-blue)' }}>
            Transaction History
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
            Complete audit trail of all cross-border payments recorded on the blockchain ledger.
          </p>
        </div>

        <button className="btn-secondary" onClick={handleExportCSV}>
          <Download size={16} />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by Payment ID, Beneficiary, Country, or Tx Hash..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} color="#64748B" />
            <select 
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '140px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Settled">Settled</option>
              <option value="Recorded">Recorded</option>
              <option value="Pending">Pending</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

        </div>
      </div>

      {/* Transactions Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Beneficiary</th>
                <th>Destination</th>
                <th>Sent Amount</th>
                <th>Converted Amount</th>
                <th>Date & Time</th>
                <th>Status</th>
                <th>Block #</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    {loading ? 'Loading transactions from MongoDB...' : 'No matching transactions found.'}
                  </td>
                </tr>
              ) : (
                payments.map(p => {
                  let badgeClass = 'badge-pending';
                  if (p.status === 'Settled' || p.status === 'Recorded') badgeClass = 'badge-success';
                  if (p.status === 'Failed') badgeClass = 'badge-failed';

                  return (
                    <tr key={p.paymentId} style={{ cursor: 'pointer' }} onClick={() => setSelectedTx(p)}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-royal-blue)' }}>
                        {p.paymentId}
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.beneficiaryName}</td>
                      <td>{p.destinationCountry}</td>
                      <td style={{ fontWeight: 600 }}>${p.paymentAmount.toFixed(2)} USD</td>
                      <td style={{ color: 'var(--color-green)', fontWeight: 600 }}>
                        {p.convertedAmount.toLocaleString()} {p.destinationCurrency}
                      </td>
                      <td style={{ color: '#64748B', fontSize: '0.78rem' }}>
                        {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{p.status}</span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#64748B' }}>
                        {p.blockNumber ? `#${p.blockNumber}` : 'Pending'}
                      </td>
                      <td>
                        <button 
                          className="btn-secondary" 
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          onClick={(e) => { e.stopPropagation(); setSelectedTx(p); }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="modal-overlay" onClick={() => setSelectedTx(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy-blue)' }}>
                  Transaction Details
                </h3>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--color-royal-blue)' }}>
                  {selectedTx.paymentId}
                </div>
              </div>
              <button 
                onClick={() => setSelectedTx(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>Payment Status</span>
                <span className={`badge ${selectedTx.status === 'Settled' ? 'badge-success' : 'badge-pending'}`}>
                  {selectedTx.status}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>Beneficiary</span>
                <strong>{selectedTx.beneficiaryName} ({selectedTx.destinationCountry})</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>Amount Sent</span>
                <strong>${selectedTx.paymentAmount.toFixed(2)} USD</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>Amount Converted</span>
                <strong style={{ color: 'var(--color-green)' }}>
                  {selectedTx.convertedAmount.toLocaleString()} {selectedTx.destinationCurrency} (Rate: {selectedTx.exchangeRate})
                </strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>Block Number</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>Block #{selectedTx.blockNumber}</strong>
              </div>

              <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <div style={{ color: '#64748B', fontSize: '0.75rem', marginBottom: '4px' }}>Blockchain Transaction Hash</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--color-navy-blue)', wordBreak: 'break-all' }}>
                  {selectedTx.txHash || 'Pending'}
                </div>
              </div>

              <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <div style={{ color: '#64748B', fontSize: '0.75rem', marginBottom: '4px' }}>Smart Contract Address</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#475569', wordBreak: 'break-all' }}>
                  {selectedTx.contractAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px' }}>
                <span style={{ color: '#64748B' }}>Purpose</span>
                <span>{selectedTx.purpose}</span>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button className="btn-secondary" onClick={() => setSelectedTx(null)} style={{ width: '100%' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
