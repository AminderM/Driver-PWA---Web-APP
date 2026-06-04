/**
 * Document scanning API — calls backend endpoints which use DeepSeek.
 * Backend has DEEPSEEK_DOC_SCANNER_API_KEY configured.
 *
 * Components must pass their `api` function from useDriverApp() to use these.
 */

// ── Core API call (multipart file upload) ────────────────────────────────────
async function uploadScan(apiFunc, endpoint, file) {
  const form = new FormData();
  form.append('file', file);

  try {
    return await apiFunc(endpoint, {
      method: 'POST',
      body: form,
    });
  } catch (error) {
    const status = error.status;
    const message = error.message;

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

// ── Public scan functions (components call with their api from useDriverApp) ──

export async function scanRateCon(file, api) {
  return uploadScan(api, '/rate-con/parse', file);
}

export async function scanReceipt(file, api) {
  return uploadScan(api, '/receipt/parse', file);
}

export async function scanIdentify(file, api) {
  return uploadScan(api, '/scan/identify', file);
}
