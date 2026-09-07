// src/services/securityAssessmentService.js
// CyberRiskIQ AI Security Assessment Engine Client Service
// Authoritative backend API client for launching scans, streaming logs, and fetching structured reports.

import { getStoredTenantId } from './apiClient';

export async function runSecurityAssessment(target, options = {}) {
  const resp = await fetch('/api/assessment/scan', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Organization-ID': getStoredTenantId()
    },
    body: JSON.stringify({
      target,
      scope: options.scope || 'Standard Full Scope',
      mode: options.mode || 'demo'
    })
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to initialize AI Security Assessment scan');
  }
  return await resp.json();
}

export async function fetchAssessmentLogs(runId) {
  const resp = await fetch(`/api/assessment/log/${runId}`, {
    headers: {
      'X-Organization-ID': getStoredTenantId()
    }
  });
  if (!resp.ok) return '';
  return await resp.text();
}

export async function fetchAssessmentResult(runId) {
  const resp = await fetch(`/api/assessment/result/${runId}`, {
    headers: {
      'X-Organization-ID': getStoredTenantId()
    }
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to fetch assessment results');
  }
  return await resp.json();
}

export async function fetchAssessmentReport(runId) {
  const resp = await fetch(`/api/assessment/report/${runId}`, {
    headers: {
      'X-Organization-ID': getStoredTenantId()
    }
  });
  if (!resp.ok) {
    const errorData = await resp.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || 'Failed to fetch assessment quantitative report');
  }
  return await resp.json();
}
