// src/services/apiClient.js
/**
 * CyberRiskIQ Unified Multi-Tenant API Client
 * Manages communication with FastAPI backend, injecting active tenant & auth tokens.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function getStoredTenantId() {
  return sessionStorage.getItem('cyberriskiq_tenant_id') || 'org-demo-finsecure';
}

export function setStoredTenantId(tenantId) {
  sessionStorage.setItem('cyberriskiq_tenant_id', tenantId);
}

export function getStoredAuthToken() {
  return sessionStorage.getItem('cyberriskiq_auth_token') || 'demo-token';
}

export function setStoredAuthToken(token) {
  sessionStorage.setItem('cyberriskiq_auth_token', token);
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const tenantId = getStoredTenantId();
  const token = getStoredAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    'X-Organization-ID': tenantId,
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errorMsg = `API error ${res.status}: ${res.statusText}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) errorMsg = errorJson.detail;
      } catch (_) {}
      throw new Error(errorMsg);
    }

    return await res.json();
  } catch (err) {
    console.error(`[CyberRiskIQ API Client] Error calling ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request('/api/health'),

  // Organization & Onboarding
  getOrganization: () => request('/api/organization'),
  updateOrganization: (data) => request('/api/organization', { method: 'PUT', body: JSON.stringify(data) }),
  completeOnboarding: (payload) => request('/api/onboarding/complete', { method: 'POST', body: JSON.stringify(payload) }),
  loadDemoData: () => request('/api/onboarding/load-demo', { method: 'POST' }),
  resetOrganization: () => request('/api/organization/reset', { method: 'POST' }),

  // Assets
  getAssets: () => request('/api/assets'),
  getAsset: (id) => request(`/api/assets/${id}`),
  createAsset: (data) => request('/api/assets', { method: 'POST', body: JSON.stringify(data) }),
  bulkImportAssets: (assets) => request('/api/assets/bulk-import', { method: 'POST', body: JSON.stringify({ assets }) }),
  updateAsset: (id, data) => request(`/api/assets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAsset: (id) => request(`/api/assets/${id}`, { method: 'DELETE' }),

  // Findings
  getFindings: () => request('/api/findings'),
  createFinding: (data) => request('/api/findings', { method: 'POST', body: JSON.stringify(data) }),

  // Authoritative Calculations
  getDashboardSummary: () => request('/api/dashboard/summary'),
  getRisks: () => request('/api/risks'),
  getFinancialExposure: () => request('/api/financial-exposure'),
  getCompliancePosture: () => request('/api/compliance/posture'),
  runOptimization: (budget, lockedIn = [], lockedOut = []) => 
    request('/api/optimization/run', { method: 'POST', body: JSON.stringify({ budget, locked_in: lockedIn, locked_out: lockedOut }) }),
  simulateScenario: (controlsOverride = {}, exposureOverride = {}, delay30Days = false) =>
    request('/api/scenarios/simulate', { 
      method: 'POST', 
      body: JSON.stringify({ 
        controls_override: controlsOverride, 
        exposure_override: exposureOverride, 
        delay_30_days: delay30Days 
      }) 
    }),

  // AI Risk Analyst
  queryAIAnalyst: (query, simulatedControls = {}) =>
    request('/api/ai/query', { method: 'POST', body: JSON.stringify({ query, simulated_controls: simulatedControls }) }),

  // Security Assessment
  runAssessment: (target, mode = 'DEMONSTRATION', authorized = true, quick = true) =>
    request('/api/assessment', { method: 'POST', body: JSON.stringify({ target, mode, authorized, quick }) }),
  getControls: () => request('/api/controls')
};
