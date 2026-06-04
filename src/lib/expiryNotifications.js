/**
 * Document expiry notification scheduler.
 * Stores scheduled alerts in localStorage and checks them on every app load.
 * Uses Web Notifications API on web; shows in-app banners as fallback.
 * Also exports helpers for DocumentVaultScreen and UniversalScanScreen to register docs.
 */

const JOBS_KEY = 'integra_expiry_jobs_v1';

// Thresholds (days before expiry) → notification copy
const THRESHOLDS = [
  { days: 60, title: 'Document Expiring Soon',       urgency: 'low'    },
  { days: 30, title: 'Document Expiring Soon',       urgency: 'low'    },
  { days: 15, title: '⚠️ Action Required',           urgency: 'medium' },
  { days: 7,  title: '⚠️ Urgent: Document Expiring', urgency: 'high'   },
  { days: 1,  title: '🚨 Expires Tomorrow',          urgency: 'high'   },
  { days: 0,  title: '🚨 Document EXPIRED',          urgency: 'critical'},
];

// Overdue repeats after expiry (in days past expiry)
const OVERDUE_REPEATS = [7, 14, 30];

const DOC_TYPE_LABELS = {
  drivers_license:    "Driver's Licence",
  medical_card:       'Medical Card',
  hazmat_cert:        'HazMat Certification',
  twic_card:          'TWIC Card',
  cargo_insurance:    'Cargo Insurance',
  liability_insurance:'Liability Insurance',
  vehicle_registration:'Vehicle Registration',
  ifta_license:       'IFTA Licence',
  cvor_certificate:   'CVOR/NSC Certificate',
};

const today = () => new Date().toISOString().slice(0, 10);

const addDays = (dateStr, n) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const diffDays = (from, to) => {
  const msPerDay = 86400000;
  return Math.round((new Date(to) - new Date(from)) / msPerDay);
};

// ── Read / write jobs ─────────────────────────────────────────────────────────
const readJobs = () => {
  try { return JSON.parse(localStorage.getItem(JOBS_KEY) || '[]'); } catch { return []; }
};
const writeJobs = (jobs) => {
  try { localStorage.setItem(JOBS_KEY, JSON.stringify(jobs)); } catch {}
};

// ── Build notification body text ──────────────────────────────────────────────
function makeBody(label, docType, daysUntil) {
  const name = DOC_TYPE_LABELS[docType] || label || 'Document';
  if (daysUntil > 1)  return `Your ${name} expires in ${daysUntil} days. Start the renewal process now.`;
  if (daysUntil === 1) return `Your ${name} expires TOMORROW. Renew today.`;
  if (daysUntil === 0) return `Your ${name} has expired. Renew immediately.`;
  return `Your ${name} expired ${Math.abs(daysUntil)} days ago. Renew immediately.`;
}

// ── Schedule reminders for a document ────────────────────────────────────────
export function scheduleExpiryReminders(docId, label, docType, expiryDate) {
  if (!expiryDate) return;

  // Remove existing jobs for this doc
  const jobs = readJobs().filter(j => j.docId !== docId);

  const todayStr = today();
  const daysLeft = diffDays(todayStr, expiryDate);

  // Forward thresholds (only schedule future ones)
  THRESHOLDS.forEach(({ days, title, urgency }) => {
    if (daysLeft >= days) {
      const fireDate = addDays(expiryDate, -days);
      if (fireDate >= todayStr) {
        jobs.push({
          id:         `${docId}-${days}d`,
          docId,
          label,
          docType,
          expiryDate,
          fireDate,
          title,
          body:       makeBody(label, docType, days),
          urgency,
          sent:       false,
        });
      }
    }
  });

  // Overdue repeats (only if already expired)
  if (daysLeft < 0) {
    OVERDUE_REPEATS.forEach(daysAfter => {
      const fireDate = addDays(expiryDate, daysAfter);
      if (fireDate >= todayStr) {
        jobs.push({
          id:         `${docId}-overdue-${daysAfter}`,
          docId,
          label,
          docType,
          expiryDate,
          fireDate,
          title:      '🚨 Document EXPIRED',
          body:       makeBody(label, docType, -daysAfter),
          urgency:    'critical',
          sent:       false,
        });
      }
    });
  }

  writeJobs(jobs);
}

// ── Cancel reminders when a doc is deleted ────────────────────────────────────
export function cancelExpiryReminders(docId) {
  writeJobs(readJobs().filter(j => j.docId !== docId));
}

// ── Check due notifications — call this on every app load ────────────────────
// Returns array of due alert objects so the UI can display in-app banners
export function checkDueNotifications() {
  const todayStr   = today();
  const jobs       = readJobs();
  const due        = jobs.filter(j => !j.sent && j.fireDate <= todayStr);
  const remaining  = jobs.map(j =>
    due.find(d => d.id === j.id) ? { ...j, sent: true } : j
  );
  writeJobs(remaining);

  // Try Web Notifications for background alerts
  due.forEach(job => {
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(job.title, {
          body: job.body,
          icon: '/company-logo.jpg',
          tag:  job.id,
          data: { screen: 'vault', docType: job.docType },
        });
      }
    } catch (_) { /* ignore if notifications not supported */ }
  });

  return due; // caller can render in-app banners for any due alerts
}

// ── Request Web Notification permission (call on user gesture) ───────────────
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'not-supported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied')  return 'denied';
  return Notification.requestPermission();
}

// ── Get all pending reminders (for settings / preview) ───────────────────────
export function getPendingReminders() {
  return readJobs().filter(j => !j.sent);
}

// ── Urgency colour helper for in-app banners ──────────────────────────────────
export const URGENCY_COLORS = {
  low:      { bg: 'bg-blue-600/10',   border: 'border-blue-600/30',   text: 'text-blue-400'   },
  medium:   { bg: 'bg-amber-600/10',  border: 'border-amber-600/40',  text: 'text-amber-400'  },
  high:     { bg: 'bg-[#CC2222]/10',  border: 'border-[#CC2222]/40',  text: 'text-[#FF2020]'  },
  critical: { bg: 'bg-[#CC2222]/20',  border: 'border-[#CC2222]/60',  text: 'text-[#FF2020]'  },
};
