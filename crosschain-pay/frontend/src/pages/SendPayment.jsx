import React, { useState, useEffect } from 'react';
import { Send, ArrowRight, CheckCircle2, AlertCircle, Info, RefreshCw, Wallet } from 'lucide-react';
import { api } from '../services/api';
import { web3Service } from '../services/web3';

export default function SendPayment({ setCurrentPage, setNotification, walletAccount }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [selectedBenId, setSelectedBenId] = useState('');
  
  const [formData, setFormData] = useState({
    beneficiaryName: '',
    destinationCountry: 'India',
    paymentAmount: '1250',
    destinationCurrency: 'INR',
    purpose: 'Software Consultancy Services'
  });

  const [estimate, setEstimate] = useState({
    rate: 83.45,
    convertedAmount: 104312.50,
    estimatedFee: 0.00,
    isSampleRate: true
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);

  // Load beneficiaries from MongoDB
  useEffect(() => {
    async function loadBeneficiaries() {
      try {
        const list = await api.getBeneficiaries();
        setBeneficiaries(list);
        if (list.length > 0) {
          const first = list[0];
          setSelectedBenId(first.id);
          setFormData(prev => ({
            ...prev,
            beneficiaryName: first.name,
            destinationCountry: first.country,
            destinationCurrency: first.currency
          }));
        }
      } catch (err) {
        console.warn('Failed to fetch beneficiaries:', err);
      }
    }
    loadBeneficiaries();
  }, []);

  // Update estimate on amount/currency change
  useEffect(() => {
    async function fetchEstimate() {
      if (!formData.paymentAmount || Number(formData.paymentAmount) <= 0) return;
      try {
        const data = await api.getEstimate(formData.paymentAmount, formData.destinationCurrency);
        setEstimate(data);
      } catch (e) {
        console.warn('Estimate fetch notice:', e);
      }
    }
    fetchEstimate();
  }, [formData.paymentAmount, formData.destinationCurrency]);

  const handleBeneficiarySelect = (e) => {
    const id = e.target.value;
    setSelectedBenId(id);
    if (id === 'custom') {
      setFormData(prev => ({
        ...prev,
        beneficiaryName: '',
        destinationCountry: 'India',
        destinationCurrency: 'INR'
      }));
      return;
    }

    const ben = beneficiaries.find(b => b.id === id);
    if (ben) {
      setFormData(prev => ({
        ...prev,
        beneficiaryName: ben.name,
        destinationCountry: ben.country,
        destinationCurrency: ben.currency
      }));
    }
  };

  const handleCountryChange = (e) => {
    const country = e.target.value;
    const currencyMap = {
      India: 'INR',
      'United Kingdom': 'GBP',
      France: 'EUR',
      Germany: 'EUR',
      Japan: 'JPY',
      Canada: 'CAD',
      Australia: 'AUD',
      Singapore: 'SGD',
      'United Arab Emirates': 'AED'
    };
    const currency = currencyMap[country] || 'USD';
    setFormData(prev => ({ ...prev, destinationCountry: country, destinationCurrency: currency }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessReceipt(null);

    // Validation
    if (!formData.beneficiaryName.trim()) {
      setErrorMsg('Beneficiary name is required.');
      return;
    }
    const numAmount = Number(formData.paymentAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMsg('Payment amount must be greater than zero.');
      return;
    }
    if (numAmount > 50000) {
      setErrorMsg('Educational Compliance Cap: Transfers cannot exceed $50,000.00 USD.');
      return;
    }

    setIsSubmitting(true);

    try {
      let clientTxHash = null;
      let clientBlockNumber = null;

      // If MetaMask is connected, optionally record on smart contract via MetaMask
      if (walletAccount && web3Service.contract) {
        try {
          const pseudoId = 'PAY-' + Math.floor(100000 + Math.random() * 900000);
          const onChain = await web3Service.recordPayment(
            pseudoId,
            formData.beneficiaryName,
            formData.destinationCountry,
            formData.destinationCurrency,
            numAmount
          );
          clientTxHash = onChain.txHash;
          clientBlockNumber = onChain.blockNumber;
        } catch (web3Err) {
          console.warn('MetaMask signing bypassed/declined, using automated PoA rail:', web3Err);
        }
      }

      // Execute through backend API and persist to MongoDB
      const res = await api.sendPayment({
        ...formData,
        paymentAmount: numAmount,
        clientTxHash,
        clientBlockNumber,
        walletAddress: walletAccount
      });

      setSuccessReceipt(res);
      setNotification(`Payment ${res.paymentId} successfully recorded and settled!`, 'success');
    } catch (err) {
      setErrorMsg(err.message || 'Payment execution failed');
      setNotification(err.message || 'Payment execution failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '820px', margin: '0 auto' }}>
      
      {/* Page Title */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-navy-blue)' }}>
          Send Cross-Border Payment
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
          Record international payment transaction metadata to the immutable blockchain ledger.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          backgroundColor: '#FEE2E2',
          border: '1px solid #FCA5A5',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          color: 'var(--color-red)',
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SUCCESS RECEIPT MODAL / CARD */}
      {successReceipt && (
        <div className="card" style={{ marginBottom: '24px', border: '1px solid #86EFAC', backgroundColor: '#F0FDF4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={24} color="#16A34A" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#166534' }}>
                Payment Successfully Settled
              </h3>
              <p style={{ fontSize: '0.78rem', color: '#15803D' }}>
                Transaction recorded on PaymentLedger smart contract & stored in MongoDB.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', fontSize: '0.82rem', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
              <div style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>Payment ID</div>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-royal-blue)' }}>{successReceipt.paymentId}</strong>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
              <div style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>Beneficiary Receives</div>
              <strong style={{ color: '#166534' }}>{Number(successReceipt.convertedAmount).toLocaleString()} {successReceipt.destinationCurrency}</strong>
            </div>
            <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
              <div style={{ color: '#64748B', fontSize: '0.72rem', textTransform: 'uppercase' }}>Block Number</div>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>#{successReceipt.blockNumber}</strong>
            </div>
          </div>

          <div style={{ backgroundColor: '#FFFFFF', padding: '10px 14px', borderRadius: '8px', border: '1px solid #DCFCE7', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: '#475569', wordBreak: 'break-all' }}>
            <span style={{ color: '#64748B' }}>Tx Hash:</span> {successReceipt.txHash}
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn-primary" onClick={() => setCurrentPage('transactions')}>
              View in Transaction History
            </button>
            <button className="btn-secondary" onClick={() => setSuccessReceipt(null)}>
              Send Another Payment
            </button>
          </div>
        </div>
      )}

      {/* Main Payment Form */}
      <form onSubmit={handleSubmit} className="card">
        
        {/* Beneficiary Quick Selector */}
        {beneficiaries.length > 0 && (
          <div className="form-group">
            <label className="form-label">Select Saved Beneficiary (MongoDB)</label>
            <select 
              value={selectedBenId} 
              onChange={handleBeneficiarySelect} 
              className="form-select"
            >
              {beneficiaries.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name} — {b.country} ({b.currency}) &bull; {b.bankName}
                </option>
              ))}
              <option value="custom">+ Enter New Beneficiary Manually</option>
            </select>
          </div>
        )}

        {/* Beneficiary Name & Country */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Beneficiary Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="e.g. Priya Sharma"
              value={formData.beneficiaryName}
              onChange={(e) => setFormData({ ...formData, beneficiaryName: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Destination Country</label>
            <select 
              className="form-select"
              value={formData.destinationCountry}
              onChange={handleCountryChange}
            >
              <option value="India">India (INR)</option>
              <option value="United Kingdom">United Kingdom (GBP)</option>
              <option value="France">France (EUR)</option>
              <option value="Germany">Germany (EUR)</option>
              <option value="Japan">Japan (JPY)</option>
              <option value="Canada">Canada (CAD)</option>
              <option value="Australia">Australia (AUD)</option>
              <option value="Singapore">Singapore (SGD)</option>
              <option value="United Arab Emirates">United Arab Emirates (AED)</option>
            </select>
          </div>
        </div>

        {/* Amount & Currency */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Payment Amount (USD)</label>
            <input 
              type="number" 
              className="form-input" 
              min="1"
              step="any"
              value={formData.paymentAmount}
              onChange={(e) => setFormData({ ...formData, paymentAmount: e.target.value })}
              required
            />
            <div className="form-hint">Source currency: US Dollars (USD)</div>
          </div>

          <div className="form-group">
            <label className="form-label">Destination Currency</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.destinationCurrency}
              readOnly
              style={{ backgroundColor: 'var(--color-light-grey)', cursor: 'not-allowed' }}
            />
            <div className="form-hint">Automated corridor conversion</div>
          </div>
        </div>

        {/* Purpose */}
        <div className="form-group">
          <label className="form-label">Payment Purpose / Reference</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="e.g. Software Consultancy, Trade Settlement"
            value={formData.purpose}
            onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          />
        </div>

        {/* Exchange Rate Estimate Card */}
        <div style={{
          backgroundColor: 'var(--color-light-sky)',
          border: '1px solid #BAE6FD',
          borderRadius: '10px',
          padding: '16px 20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-navy-blue)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Info size={16} color="#2563EB" />
              <span>Sample Benchmark Exchange Rate</span>
            </span>
            <span style={{ fontSize: '0.72rem', backgroundColor: '#FFFFFF', padding: '2px 8px', borderRadius: '4px', border: '1px solid #BAE6FD', color: 'var(--color-royal-blue)', fontWeight: 600 }}>
              1 USD = {estimate.rate} {formData.destinationCurrency}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px dashed #BAE6FD' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Estimated Transaction Fee</div>
              <strong style={{ color: 'var(--color-green)', fontSize: '0.85rem' }}>$0.00 (Consortium Rail)</strong>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Beneficiary Receives (Converted)</div>
              <strong style={{ fontSize: '1.25rem', color: 'var(--color-navy-blue)', fontWeight: 700 }}>
                {Number(estimate.convertedAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {formData.destinationCurrency}
              </strong>
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '8px', fontStyle: 'italic' }}>
            * Sample exchange rate for educational prototype testing. Not live commercial banking rates.
          </div>
        </div>

        {/* Action Button */}
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={isSubmitting}
          style={{ width: '100%', padding: '14px', fontSize: '0.95rem' }}
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>Processing Smart Contract Recording...</span>
            </>
          ) : (
            <>
              <Send size={18} />
              <span>Confirm & Record Payment on Blockchain</span>
            </>
          )}
        </button>

      </form>
    </div>
  );
}
