/**
 * Document scanning API — calls backend endpoints which use DeepSeek.
 * Backend has DEEPSEEK_DOC_SCANNER_API_KEY configured.
 */

import { api } from '../api';

// ── Core API call (multipart file upload) ────────────────────────────────────
async function uploadScan(endpoint, file) {
  const form = new FormData();
  form.append('file', file);

  try {
    const response = await api.post(endpoint, form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    if (status === 415) {
      throw new Error('Unsupported file type. Upload JPEG, PNG, or PDF.');
    }
    if (status === 413) {
      throw new Error('File too large. Max 10 MB.');
    }
    if (status === 503) {
      throw new Error('Document scanner not configured or temporarily busy. Please try again later.');
    }
    if (status === 422) {
      throw new Error('Could not read document. Retake with better lighting.');
    }

    throw new Error(message || 'Failed to scan document. Please try again.');
  }
}

// ── Public scan functions ─────────────────────────────────────────────────────

export async function scanRateCon(file) {
  return uploadScan('/api/driver-mobile/rate-con/parse', file);
}

export async function scanReceipt(file) {
  return uploadScan('/api/driver-mobile/receipt/parse', file);
}

export async function scanIdentify(file) {
  return uploadScan('/api/driver-mobile/scan/identify', file);
}
