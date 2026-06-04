/**
 * DeepSeek vision API — used by all three document scanners.
 * Key is read from REACT_APP_DEEPSEEK_API_KEY in .env
 */

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL        = 'deepseek-chat';

// ── Convert file → base64 data URL ───────────────────────────────────────────
const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// ── Core API call ─────────────────────────────────────────────────────────────
async function callDeepSeekVision(dataUrl, prompt) {
  const key = process.env.REACT_APP_DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error('DeepSeek API key not configured. Add REACT_APP_DEEPSEEK_API_KEY to your .env file.');
  }

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: dataUrl } },
          { type: 'text', text: prompt },
        ],
      }],
      response_format: { type: 'json_object' },
      max_tokens: 1024,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) throw new Error('DeepSeek API key is invalid or expired. Check REACT_APP_DEEPSEEK_API_KEY.');
    if (res.status === 429) throw new Error('AI service is temporarily busy. Please try again in a moment.');
    throw new Error(body?.error?.message || `AI service error (${res.status}). Please try again.`);
  }

  const data    = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('AI returned an empty response. Please try again.');

  try {
    return JSON.parse(content);
  } catch {
    throw new Error('AI returned an unreadable response. Please retake the photo with better lighting and try again.');
  }
}

// ── Prompts ───────────────────────────────────────────────────────────────────

const RATE_CON_PROMPT = `
You are an expert at reading trucking rate confirmations and load tenders.
Analyze this document and extract the following fields exactly.

Return ONLY a valid JSON object with these keys (use null for any field not found):
{
  "shipper":        "string or null",
  "consignee":      "string or null",
  "origin":         "string or null — pickup city and province/state e.g. Toronto, ON",
  "destination":    "string or null — delivery city and province/state",
  "pickup_date":    "string or null — YYYY-MM-DD",
  "delivery_date":  "string or null — YYYY-MM-DD",
  "commodity":      "string or null",
  "weight":         "number or null — lbs, digits only",
  "rate":           "number or null — total load rate, digits only no $ sign",
  "broker_name":    "string or null",
  "broker_mc":      "string or null",
  "broker_contact": "string or null"
}

Rules:
- Return ONLY the JSON object. No markdown, no code fences, no explanation.
- Dates must be YYYY-MM-DD.
- weight and rate must be plain numbers (strip $, lbs, commas).
`.trim();

const RECEIPT_PROMPT = `
You are an expert at reading expense receipts for truck drivers.
Analyze this receipt and extract the following fields.

Return ONLY a valid JSON object (use null for missing fields):
{
  "amount":      "number or null — total paid, digits only no $ sign",
  "vendor":      "string or null — business name",
  "date":        "string or null — YYYY-MM-DD",
  "category":    "string or null — MUST be exactly one of: fuel, tolls, maintenance, lumper, detention, meals, lodging, scales, permits, insurance, other",
  "description": "string or null — brief description"
}

Category rules:
- fuel        = gas stations, diesel, DEF
- tolls       = highway/bridge tolls
- maintenance = truck repairs, tires, oil
- lumper      = loading/unloading labor
- detention   = detention fees
- meals       = restaurants, food
- lodging     = hotels, motels
- scales      = weigh station fees
- permits     = oversize/overweight permits
- insurance   = insurance premiums
- other       = anything else

Rules:
- Return ONLY the JSON object. No markdown, no code fences.
- amount must be a plain number.
- If year is missing from date, use the current year.
`.trim();

const IDENTIFY_PROMPT = `
You are an expert document classification and data extraction assistant for truck drivers.
Analyze this document and classify it, then extract all relevant fields.

Return ONLY a valid JSON object in this exact shape:
{
  "document_type": "one of: expense_receipt, rate_confirmation, bol, drivers_license, medical_card, hazmat_cert, twic_card, cargo_insurance, liability_insurance, vehicle_registration, ifta_license, cvor_certificate, abstract, lease_agreement, business_registration, void_cheque, other",
  "label":         "short human-readable label e.g. CDL Class A — John Smith",
  "confidence":    "number 0.0 to 1.0",
  "extracted": {
    "expiry_date":    "YYYY-MM-DD or null — CRITICAL: look for EXP, EXPIRES, VALID UNTIL, RENEWAL DATE",
    "amount":         "number or null",
    "vendor":         "string or null",
    "date":           "YYYY-MM-DD or null",
    "category":       "fuel/tolls/maintenance/lumper/detention/meals/lodging/scales/permits/insurance/other or null",
    "description":    "string or null",
    "origin":         "string or null",
    "destination":    "string or null",
    "rate":           "number or null",
    "pickup_date":    "YYYY-MM-DD or null",
    "delivery_date":  "YYYY-MM-DD or null",
    "shipper":        "string or null",
    "consignee":      "string or null",
    "broker_name":    "string or null",
    "commodity":      "string or null",
    "weight":         "number or null",
    "holder_name":    "string or null — name on licence or card"
  }
}

Critical rules:
- Return ONLY the JSON object. No markdown, no code fences, no explanation.
- expiry_date is the most important field. Search every corner of the document for it.
- For drivers_license: expiry is on the front of the card.
- For medical_card: expiry is the certification end date.
- For insurance: expiry is the policy end date.
- For vehicle_registration: expiry is the renewal/sticker date.
- All dates MUST be YYYY-MM-DD.
- If confidence < 0.6, set document_type to "other".
`.trim();

// ── Public scan functions ─────────────────────────────────────────────────────

export async function scanRateCon(file) {
  const dataUrl = await fileToDataUrl(file);
  return callDeepSeekVision(dataUrl, RATE_CON_PROMPT);
}

export async function scanReceipt(file) {
  const dataUrl = await fileToDataUrl(file);
  return callDeepSeekVision(dataUrl, RECEIPT_PROMPT);
}

export async function scanIdentify(file) {
  const dataUrl = await fileToDataUrl(file);
  return callDeepSeekVision(dataUrl, IDENTIFY_PROMPT);
}
