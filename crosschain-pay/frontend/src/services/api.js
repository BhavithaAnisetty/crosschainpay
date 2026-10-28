const API_BASE = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('crosschain_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const api = {
  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    localStorage.setItem('crosschain_token', data.token);
    localStorage.setItem('crosschain_user', JSON.stringify(data.user));
    return data;
  },

  async register(name, email, password, role) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    localStorage.setItem('crosschain_token', data.token);
    localStorage.setItem('crosschain_user', JSON.stringify(data.user));
    return data;
  },

  getCurrentUser() {
    const raw = localStorage.getItem('crosschain_user');
    return raw ? JSON.parse(raw) : null;
  },

  logout() {
    localStorage.removeItem('crosschain_token');
    localStorage.removeItem('crosschain_user');
  },

  // Payments
  async getPaymentStats() {
    const res = await fetch(`${API_BASE}/payments/stats`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to fetch payment stats');
    return await res.json();
  },

  async getPayments(query = {}) {
    const params = new URLSearchParams(query).toString();
    const res = await fetch(`${API_BASE}/payments?${params}`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to fetch payments');
    return await res.json();
  },

  async getEstimate(amount, currency) {
    const res = await fetch(`${API_BASE}/payments/estimate?amount=${amount}&currency=${currency}`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to fetch FX estimate');
    return await res.json();
  },

  async sendPayment(paymentData) {
    const res = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(paymentData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to process payment');
    return data;
  },

  // Beneficiaries
  async getBeneficiaries() {
    const res = await fetch(`${API_BASE}/beneficiaries`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to fetch beneficiaries');
    return await res.json();
  },

  async addBeneficiary(benData) {
    const res = await fetch(`${API_BASE}/beneficiaries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(benData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add beneficiary');
    return data;
  },

  async updateBeneficiary(id, benData) {
    const res = await fetch(`${API_BASE}/beneficiaries/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(benData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update beneficiary');
    return data;
  },

  async deleteBeneficiary(id) {
    const res = await fetch(`${API_BASE}/beneficiaries/${id}`, {
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to delete beneficiary');
    return await res.json();
  },

  // Audit Logs
  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit`, {
      headers: getAuthHeader()
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return await res.json();
  },

  async verifyTransaction(txHash) {
    const res = await fetch(`${API_BASE}/audit/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ txHash })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify transaction');
    return data;
  },

  // Admin
  async getAdminMetrics() {
    const res = await fetch(`${API_BASE}/admin/metrics`, {
      headers: getAuthHeader()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin metrics');
    return data;
  },

  // System Health
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return await res.json();
  }
};
