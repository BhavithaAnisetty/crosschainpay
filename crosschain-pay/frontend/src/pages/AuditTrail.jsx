import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Key, 
  FileCheck,
  RefreshCw 
} from 'lucide-react';
import { api } from '../services/api';

export default function AuditTrail({ setNotification }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyInput, setVerifyInput] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleVerify = async (hashToVerify) => {
    const targetHash = hashToVerify || verifyInput;
    if (!targetHash.trim()) {
      setNotification('Please enter or select a transaction hash to verify', 'error');
      return;
    }

    try {
      setVerifying(true);
      const result = await api.verifyTransaction(targetHash.trim());
      setVerificationResult(result);
      if (result.verified) {
        setNotification('Cryptographic verification confirmed on-chain!', 'success');
      } else {
        setNotification('Verification alert: Transaction hash not confirmed.', 'error');
      }
    } catch (err) {
      setNotification(err.message || 'Verification error', 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="page-container">
      
      {/* Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-navy-blue)' }}>
          Blockchain Audit Trail
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
          Immutable on-chain event logs and smart contract verification records.
        </p>
      </div>

      {/* Verify Transaction Card */}
      <div className="card" style={{ marginBottom: '24px', backgroundColor: 'var(--color-light-sky)', border: '1px solid #BAE6FD' }}>
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShieldCheck size={20} color="#2563EB" />
          <span>Verify Transaction Integrity On-Chain</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '16px' }}>
          Check any transaction hash against the deployed <code style={{ color: 'var(--color-royal-blue)' }}>PaymentLedger</code> smart contract.
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Paste Ethereum Transaction Hash (0x...)"
              value={verifyInput}
              onChange={(e) => setVerifyInput(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', backgroundColor: '#FFFFFF' }}
            />
          </div>
          <button 
            className="btn-primary" 
            onClick={() => handleVerify()}
            disabled={verifying}
            style={{ minWidth: '150px' }}
          >
            {verifying ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <FileCheck size={16} />
                <span>Verify On-Chain</span>
              </>
            )}
          </button>
        </div>

        {/* Verification Result Banner */}
        {verificationResult && (
          <div style={{
            marginTop: '16px',
            padding: '14px 16px',
            borderRadius: '8px',
            backgroundColor: verificationResult.verified ? '#DCFCE7' : '#FEE2E2',
            border: `1px solid ${verificationResult.verified ? '#86EFAC' : '#FCA5A5'}`,
            fontSize: '0.82rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: verificationResult.verified ? '#166534' : 'var(--color-red)', marginBottom: '6px' }}>
              {verificationResult.verified ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{verificationResult.verified ? 'VERIFIED: Authentic On-Chain Record' : 'VERIFICATION FAILED'}</span>
            </div>
            <div style={{ color: '#1E293B', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', wordBreak: 'break-all' }}>
              <strong>Tx Hash:</strong> {verificationResult.txHash}
            </div>
            {verificationResult.event && (
              <div style={{ color: '#1E293B', fontSize: '0.75rem', marginTop: '4px' }}>
                <strong>Confirmed Event:</strong> {verificationResult.event}
              </div>
            )}
            {verificationResult.contractAddress && (
              <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: '2px' }}>
                <strong>Contract:</strong> {verificationResult.contractAddress}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="card-title" style={{ fontSize: '0.95rem' }}>Immutable Event Logs</div>
            <div className="card-subtitle">Stored simultaneously in MongoDB and verified on Ethereum block height</div>
          </div>
          <button className="btn-secondary" onClick={loadLogs} style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Payment ID</th>
                <th>Tx Hash</th>
                <th>Block #</th>
                <th>Initiating Wallet</th>
                <th>Timestamp</th>
                <th>Verification</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: '#94A3B8' }}>
                    {loading ? 'Querying on-chain audit trail...' : 'No audit entries found.'}
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id}>
                    <td>
                      <span className="badge badge-info" style={{ fontWeight: 600 }}>
                        {log.eventType}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-navy-blue)' }}>
                      {log.paymentId}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#64748B' }}>
                      {log.txHash.slice(0, 10)}...{log.txHash.slice(-6)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      #{log.blockNumber}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#475569' }}>
                      {log.initiatingAddress.slice(0, 8)}...{log.initiatingAddress.slice(-6)}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        <CheckCircle2 size={12} />
                        <span>Verified</span>
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-secondary" 
                        onClick={() => {
                          setVerifyInput(log.txHash);
                          handleVerify(log.txHash);
                        }}
                        style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
