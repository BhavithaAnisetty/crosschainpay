import React, { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, X, Building2, Globe, CreditCard } from 'lucide-react';
import { api } from '../services/api';

export default function Beneficiaries({ setNotification }) {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    country: 'India',
    currency: 'INR',
    bankName: '',
    accountNumber: '',
    swiftBic: ''
  });

  const loadBeneficiaries = async () => {
    try {
      setLoading(true);
      const list = await api.getBeneficiaries();
      setBeneficiaries(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBeneficiaries();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: '',
      country: 'India',
      currency: 'INR',
      bankName: '',
      accountNumber: '',
      swiftBic: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingId(b.id);
    setFormData({
      name: b.name,
      country: b.country,
      currency: b.currency,
      bankName: b.bankName || '',
      accountNumber: b.accountNumber,
      swiftBic: b.swiftBic || ''
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove beneficiary "${name}"?`)) return;
    try {
      await api.deleteBeneficiary(id);
      setNotification(`Beneficiary "${name}" removed.`, 'success');
      loadBeneficiaries();
    } catch (err) {
      setNotification(err.message || 'Failed to delete beneficiary', 'error');
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
    setFormData(prev => ({ ...prev, country, currency: currencyMap[country] || 'USD' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateBeneficiary(editingId, formData);
        setNotification('Beneficiary details updated successfully.', 'success');
      } else {
        await api.addBeneficiary(formData);
        setNotification('New beneficiary enrolled in MongoDB.', 'success');
      }
      setModalOpen(false);
      loadBeneficiaries();
    } catch (err) {
      setNotification(err.message || 'Operation failed', 'error');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--color-navy-blue)' }}>
            Beneficiaries Directory
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748B' }}>
            Manage authorized receiving counterparties stored in your MongoDB database.
          </p>
        </div>

        <button className="btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add Beneficiary</span>
        </button>
      </div>

      {/* Beneficiaries Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
        {beneficiaries.length === 0 ? (
          <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
            {loading ? 'Loading counterparties from MongoDB...' : 'No beneficiaries added yet. Click "Add Beneficiary" above!'}
          </div>
        ) : (
          beneficiaries.map(b => (
            <div key={b.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '8px', backgroundColor: 'var(--color-light-sky)', color: 'var(--color-royal-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building2 size={20} />
                  </div>
                  <span className="badge badge-info">{b.currency}</span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-navy-blue)', marginBottom: '4px' }}>
                  {b.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                  <Globe size={14} />
                  <span>{b.country}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', backgroundColor: 'var(--color-light-grey)', borderRadius: '8px', fontSize: '0.78rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Bank:</span>
                    <strong style={{ color: 'var(--color-navy-blue)' }}>{b.bankName || 'Standard Bank'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Account:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{b.accountNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>SWIFT / BIC:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{b.swiftBic}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
                <button 
                  className="btn-secondary" 
                  onClick={() => openEditModal(b)}
                  style={{ flex: 1, padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleDelete(b.id, b.name)}
                  style={{ color: 'var(--color-red)', borderColor: '#FCA5A5', padding: '6px 12px', fontSize: '0.78rem' }}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-navy-blue)' }}>
                {editingId ? 'Edit Beneficiary' : 'Add New Beneficiary'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Full Legal Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Liam O'Connor"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Destination Country</label>
                  <select 
                    className="form-select"
                    value={formData.country}
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

                <div className="form-group">
                  <label className="form-label">Currency</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formData.currency}
                    readOnly
                    style={{ backgroundColor: 'var(--color-light-grey)' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Receiving Bank Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Barclays Bank UK"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Number / IBAN</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. GB29BARC204519928371"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SWIFT / BIC Code</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. BARCGB22XXX"
                  value={formData.swiftBic}
                  onChange={(e) => setFormData({ ...formData, swiftBic: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {editingId ? 'Save Changes' : 'Enroll Beneficiary'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
