import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Notification({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const isSuccess = type === 'success';

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 60,
      backgroundColor: isSuccess ? '#FFFFFF' : '#FFFFFF',
      borderLeft: `5px solid ${isSuccess ? '#16A34A' : '#DC2626'}`,
      boxShadow: 'var(--shadow-lg)',
      borderRadius: '8px',
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      maxWidth: '420px',
      border: '1px solid var(--color-border)',
      borderLeftWidth: '5px'
    }}>
      {isSuccess ? (
        <CheckCircle2 size={20} color="#16A34A" />
      ) : (
        <AlertCircle size={20} color="#DC2626" />
      )}
      <div style={{ flex: 1, fontSize: '0.85rem', color: 'var(--color-navy-blue)', fontWeight: 500 }}>
        {message}
      </div>
      <button 
        onClick={onClose}
        style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex' }}
      >
        <X size={16} />
      </button>
    </div>
  );
}
