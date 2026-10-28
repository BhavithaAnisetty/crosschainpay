import React, { useState } from 'react';
import { Link2, Lock, Mail, User, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function Auth({ onLoginSuccess, setNotification }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: 'sender@crosschain.pay',
    password: 'password123',
    role: 'user'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register(formData.name, formData.email, formData.password, formData.role);
        setNotification('Account registered successfully! Welcome to CrossChain Pay.', 'success');
        onLoginSuccess(res.user);
      } else {
        const res = await api.login(formData.email, formData.password);
        setNotification(`Welcome back, ${res.user.name}!`, 'success');
        onLoginSuccess(res.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role) => {
    setError('');
    setLoading(true);
    const email = role === 'admin' ? 'admin@crosschain.pay' : 'sender@crosschain.pay';
    const password = role === 'admin' ? 'admin123' : 'password123';

    try {
      const res = await api.login(email, password);
      setNotification(`Logged in as Demo ${role.toUpperCase()}!`, 'success');
      onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--color-light-grey)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        backgroundColor: 'var(--color-white)',
        borderRadius: '16px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        padding: '36px 32px'
      }}>
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '12px',
            backgroundColor: 'var(--color-royal-blue)',
            color: 'var(--color-white)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px'
          }}>
            <Link2 size={26} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-navy-blue)' }}>
            CrossChain Pay
          </h1>
          <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '4px' }}>
            Blockchain-Based Cross-Border Payments System
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--color-light-grey)',
          padding: '4px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: !isRegister ? 'var(--color-white)' : 'transparent',
              color: !isRegister ? 'var(--color-navy-blue)' : '#64748B',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: !isRegister ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: isRegister ? 'var(--color-white)' : 'transparent',
              color: isRegister ? 'var(--color-navy-blue)' : '#64748B',
              fontWeight: 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              boxShadow: isRegister ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            color: 'var(--color-red)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div>
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Rivera"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ paddingLeft: '36px' }}
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="name@crosschain.pay"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ paddingLeft: '36px' }}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ paddingLeft: '36px' }}
                required
              />
            </div>
          </div>

          {isRegister && (
            <div>
              <label className="form-label">Role</label>
              <select
                className="form-select"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">Sender (Payer)</option>
                <option value="admin">Compliance Administrator</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '12px', marginTop: '6px' }}
          >
            <span>{isRegister ? 'Register & Access System' : 'Sign In'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Login Buttons */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748B', textAlign: 'center', marginBottom: '10px' }}>
            Instant Evaluation Demo Accounts:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleQuickLogin('user')}
              style={{ fontSize: '0.78rem', padding: '8px' }}
            >
              Sender Demo
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => handleQuickLogin('admin')}
              style={{ fontSize: '0.78rem', padding: '8px', color: '#D6AE54', borderColor: '#D6AE54' }}
            >
              Admin Demo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
