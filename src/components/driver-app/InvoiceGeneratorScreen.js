import React, { useState, useEffect, useCallback } from 'react';
import { useDriverApp } from './DriverAppProvider';

// ── PDF generation (jsPDF) ────────────────────────────────────────────────────

const generateInvoicePdf = async (invoice, user) => {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  const dark    = [26, 26, 26];
  const red     = [211, 32, 39];
  const medGray = [119, 119, 119];
  const ltGray  = [238, 238, 238];
  const bgLight = [250, 250, 250];

  // ── LEFT: logo / IA icon + company name + address ────────────────────────
  const companyName = user?.company_name || 'Your Company Name';
  let leftBottomY = y;

  const LOGO_H = 72;  // compact header logo height

  if (user?.logo_url) {
    try {
      const img = await loadImage(user.logo_url);
      const ratio = img.width / img.height;
      const lw = Math.min(LOGO_H * ratio, 160);
      doc.addImage(img, 'PNG', margin, y, lw, LOGO_H);
      leftBottomY = y + LOGO_H + 8;
    } catch (_) {
      leftBottomY = y;
    }
  } else {
    // IA icon box
    doc.setFillColor(...dark);
    doc.roundedRect(margin, y, LOGO_H, LOGO_H, 6, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...red);
    doc.text('IA', margin + LOGO_H / 2, y + LOGO_H / 2 + 10, { align: 'center' });
    leftBottomY = y + LOGO_H + 8;
  }

  // Company name directly below logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...dark);
  doc.text(companyName, margin, leftBottomY);
  leftBottomY += 14;

  // Address + MC/DOT or website
  const addrLines = [
    user?.address || 'Toronto, ON, Canada',
    user?.mc_dot_number ? `MC/DOT: ${user.mc_dot_number}` : 'integratedtech.ca',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...medGray);
  addrLines.forEach(line => {
    doc.text(line, margin, leftBottomY);
    leftBottomY += 12;
  });

  // ── RIGHT: INVOICE + meta ─────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.setTextColor(...red);
  doc.text('INVOICE', W - margin, y, { align: 'right' });

  const metaRows = [
    ['Invoice #:', invoice.invoiceNumber, true],
    ['Date:',      invoice.invoiceDate,   false],
    ['Due date:',  invoice.dueDate,       false],
    ['Terms:',     invoice.terms || 'Net 30', true],
  ];
  let metaY = y + 22;
  metaRows.forEach(([label, value, bold]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...medGray);
    doc.text(label, W - margin - 85, metaY, { align: 'right' });
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...dark);
    doc.text(String(value || '—'), W - margin, metaY, { align: 'right' });
    metaY += 14;
  });

  y = Math.max(leftBottomY + 10, metaY + 10);

  // ── Divider ───────────────────────────────────────────────────────────────
  doc.setDrawColor(...ltGray);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 16;

  // ── BILL TO ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...medGray);
  doc.text('BILL TO', margin, y);
  y += 11;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.text(invoice.billToName || '—', margin, y);
  y += 14;
  [invoice.billToContact, invoice.billToMc ? `MC: ${invoice.billToMc}` : null]
    .filter(Boolean)
    .forEach(line => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...medGray);
      doc.text(line, margin, y);
      y += 12;
    });
  y += 14;

  // ── LINE ITEMS table ──────────────────────────────────────────────────────
  const lineItems = invoice.lineItems.filter(li => li.description && li.amount);

  // Build sub-line details for first (freight) item
  const freightSubLine = (() => {
    const parts = [];
    if (invoice.miles) parts.push(`${Number(invoice.miles).toLocaleString()} mi`);
    const rpm = invoice.miles && lineItems[0]?.amount
      ? parseFloat(lineItems[0].amount) / Number(invoice.miles) : null;
    if (rpm) parts.push(`@ $${rpm.toFixed(2)}/mi`);
    if (invoice.commodity) parts.push(invoice.commodity);
    return parts.join(' · ');
  })();

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['DESCRIPTION', 'AMOUNT']],
    body: lineItems.map((li, idx) => [
      idx === 0 && freightSubLine ? `${li.description}  ·  ${freightSubLine}` : li.description,
      `$${Number(li.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    ]),
    headStyles: { fillColor: red, textColor: [255,255,255], fontStyle: 'bold', fontSize: 8 },
    bodyStyles: { fontSize: 10, textColor: dark, cellPadding: { top: 10, bottom: 10, left: 12, right: 12 } },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 100, fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: bgLight },
    theme: 'striped',
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Subtotal + Tax ────────────────────────────────────────────────────────
  const subtotal = lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0);
  const tax      = parseFloat(invoice.taxAmount) || 0;
  const total    = subtotal + tax;
  const fmt = n => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  [['Subtotal', subtotal], ['Tax', tax]].forEach(([label, amt]) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...medGray);
    doc.text(label, W - margin - 105, y, { align: 'right' });
    doc.setTextColor(...dark);
    doc.text(fmt(amt), W - margin, y, { align: 'right' });
    y += 16;
  });

  y += 6;

  // ── TOTAL DUE rounded box ─────────────────────────────────────────────────
  doc.setFillColor(...dark);
  doc.roundedRect(margin, y, W - margin * 2, 36, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL DUE', margin + 16, y + 23);
  doc.setFontSize(18);
  doc.text(fmt(total), W - margin - 16, y + 23, { align: 'right' });

  y += 54;

  // ── Footer: PAYMENT | NOTES (two columns) ────────────────────────────────
  doc.setDrawColor(...ltGray);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 14;

  const colW  = (W - margin * 2 - 28) / 2;
  const col2X = margin + colW + 28;

  const drawFooterCol = (x, heading, body) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...medGray);
    doc.text(heading, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(102, 102, 102);
    const lines = doc.splitTextToSize(body, colW);
    doc.text(lines, x, y + 13);
  };

  const payText = invoice.paymentInstructions ||
    `Please remit within 30 days of invoice date. Reference invoice #${invoice.invoiceNumber} with payment.`;
  const noteText = invoice.notes || 'Thank you for your business.';

  drawFooterCol(margin, 'PAYMENT', payText);
  drawFooterCol(col2X, 'NOTES',   noteText);

  // Page footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...ltGray);
  doc.text('Generated by Integra AI · integratedtech.ca', W / 2, pageH - 20, { align: 'center' });

  return doc;
};

const loadImage = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });

// ── Invoice number helper ─────────────────────────────────────────────────────

const makeInvoiceNumber = () => {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rnd = String(Math.floor(Math.random() * 9000) + 1000);
  return `INV-${yy}${mm}-${rnd}`;
};

const todayStr = () => new Date().toISOString().slice(0, 10);
const netDueStr = (days = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// ── Invoice localStorage store ─────────────────────────────────────────────────
const INVOICES_KEY = 'integra_invoices_v1';
const loadInvoices  = () => { try { return JSON.parse(localStorage.getItem(INVOICES_KEY) || '[]'); } catch { return []; } };
const saveInvoices  = (list) => localStorage.setItem(INVOICES_KEY, JSON.stringify(list));

const isOverdue = (inv) =>
  inv.status !== 'paid' && inv.dueDate && new Date(inv.dueDate) < new Date();

const fmtMoney = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate  = (s) => s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

// ── Main screen ───────────────────────────────────────────────────────────────

const InvoiceGeneratorScreen = ({ onBack }) => {
  const { api, user, theme, toggleTheme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-[#030303]'     : 'bg-[#f5f5f5]';
  const surface = isDark ? 'bg-[#080808]'     : 'bg-white';
  const text    = isDark ? 'text-white'        : 'text-black';
  const subtext = isDark ? 'text-white/60'     : 'text-black/60';
  const border  = isDark ? 'border-[#1F1F1F]' : 'border-[#e5e5e5]';
  const inputCls = `w-full border py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC2222] ${
    isDark ? 'bg-[#080808] border-[#1F1F1F] text-white placeholder-white/30'
           : 'bg-white border-[#e5e5e5] text-black placeholder-black/30'
  }`;

  // screen: 'list' | 'select-load' | 'form' | 'generating' | 'detail'
  const [screen,      setScreen]     = useState('list');
  const [invoices,    setInvoices]   = useState(() => loadInvoices());
  const [loads,       setLoads]      = useState([]);
  const [loadsLoading,setLoadsLoading]=useState(false);
  const [selectedLoad,setSelectedLoad]=useState(null);
  const [activeInvoice,setActiveInvoice]=useState(null); // invoice being viewed in detail
  const [showFabSheet,setShowFabSheet]=useState(false);
  const [genError,    setGenError]   = useState('');

  // Payment sheet state (inside detail screen)
  const [payAmt,     setPayAmt]     = useState('');
  const [payLoading, setPayLoading] = useState(false);
  const [payError,   setPayError]   = useState('');

  // Form state
  const [editingId,          setEditingId]          = useState(null);
  const [invoiceNumber,      setInvoiceNumber]      = useState('');
  const [invoiceDate,        setInvoiceDate]        = useState('');
  const [dueDate,            setDueDate]            = useState('');
  const [billToName,         setBillToName]         = useState('');
  const [billToContact,      setBillToContact]      = useState('');
  const [billToMc,           setBillToMc]           = useState('');
  const [lineItems,          setLineItems]          = useState([]);
  const [taxRate,            setTaxRate]            = useState('0');
  const [terms,              setTerms]              = useState('Net 30');
  const [paymentInstructions,setPaymentInstructions]= useState('');
  const [formNotes,          setFormNotes]          = useState('');
  const [formOrigin,         setFormOrigin]         = useState('');
  const [formDestination,    setFormDestination]    = useState('');
  const [formCommodity,      setFormCommodity]      = useState('');
  const [formMiles,          setFormMiles]          = useState('');

  const persistInvoices = (list) => { setInvoices(list); saveInvoices(list); };

  const fetchLoads = useCallback(async () => {
    setLoadsLoading(true);
    try {
      const data = await api('/my-loads');
      setLoads(Array.isArray(data) ? data.filter(l => l.status === 'delivered' || l.status === 'invoiced') : []);
    } catch { /* silent */ }
    finally  { setLoadsLoading(false); }
  }, [api]);

  const openFormFromLoad = (load) => {
    setSelectedLoad(load);
    setEditingId(null);
    setInvoiceNumber(makeInvoiceNumber());
    setInvoiceDate(todayStr());
    setDueDate(netDueStr(30));
    setBillToName(load.broker_name || '');
    setBillToContact(load.broker_contact || '');
    setBillToMc(load.broker_mc || '');
    setLineItems([{ id: 1, description: `Freight Services — ${load.origin || ''} to ${load.destination || ''}`, amount: String(load.rate || '') }]);
    setTaxRate('0');
    setTerms('Net 30');
    setPaymentInstructions('');
    setFormNotes(load.notes || '');
    setFormOrigin(load.origin || '');
    setFormDestination(load.destination || '');
    setFormCommodity(load.commodity || '');
    setFormMiles(load.estimated_miles ? String(load.estimated_miles) : '');
    setGenError('');
    setScreen('form');
  };

  const openFormManual = () => {
    setSelectedLoad(null);
    setEditingId(null);
    setInvoiceNumber(makeInvoiceNumber());
    setInvoiceDate(todayStr());
    setDueDate(netDueStr(30));
    setBillToName(''); setBillToContact(''); setBillToMc('');
    setLineItems([{ id: 1, description: '', amount: '' }]);
    setTaxRate('0'); setTerms('Net 30');
    setPaymentInstructions(''); setFormNotes('');
    setFormOrigin(''); setFormDestination(''); setFormCommodity(''); setFormMiles('');
    setGenError('');
    setScreen('form');
  };

  const subtotalAmt = lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0);
  const taxAmount   = subtotalAmt * (parseFloat(taxRate) || 0) / 100;
  const total       = subtotalAmt + taxAmount;

  const addLineItem    = () => setLineItems(prev => [...prev, { id: Date.now(), description: '', amount: '' }]);
  const updateLineItem = (id, f, v) => setLineItems(prev => prev.map(li => li.id === id ? { ...li, [f]: v } : li));
  const removeLineItem = (id) => setLineItems(prev => prev.filter(li => li.id !== id));

  const handleGenerate = async () => {
    if (!billToName.trim()) { setGenError('Bill To name is required.'); return; }
    if (lineItems.filter(li => li.description && li.amount).length === 0) { setGenError('Add at least one line item.'); return; }

    setScreen('generating');
    setGenError('');

    try {
      const invData = {
        invoiceNumber, invoiceDate, dueDate,
        terms: terms.trim() || 'Net 30',
        taxAmount,
        billToName: billToName.trim(),
        billToContact: billToContact.trim(),
        billToMc: billToMc.trim(),
        origin:       formOrigin      || selectedLoad?.origin,
        destination:  formDestination || selectedLoad?.destination,
        pickupDate:   selectedLoad?.pickup_date?.slice(0, 10),
        deliveryDate: selectedLoad?.delivery_date?.slice(0, 10),
        commodity:    formCommodity   || selectedLoad?.commodity,
        miles:        formMiles       || selectedLoad?.estimated_miles,
        weight:       selectedLoad?.weight,
        lineItems,
        paymentInstructions: paymentInstructions.trim(),
        notes: formNotes.trim(),
      };

      const doc = await generateInvoicePdf(invData, user);
      const blob = doc.output('blob');
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');
      const a = document.createElement('a');
      a.href = url; a.download = `${invoiceNumber}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);

      // Save / update invoice record
      const record = {
        id:           editingId || String(Date.now()),
        invoiceNumber, invoiceDate, dueDate,
        terms:        terms.trim() || 'Net 30',
        billToName:   billToName.trim(),
        billToContact: billToContact.trim(),
        billToMc:     billToMc.trim(),
        origin:       invData.origin || '',
        destination:  invData.destination || '',
        commodity:    invData.commodity || '',
        miles:        invData.miles || '',
        lineItems,
        taxAmount,
        total,
        paymentInstructions: paymentInstructions.trim(),
        notes:        formNotes.trim(),
        status:       editingId ? (invoices.find(i => i.id === editingId)?.status || 'outstanding') : 'outstanding',
        paidAmount:   editingId ? (invoices.find(i => i.id === editingId)?.paidAmount || 0) : 0,
        paidDate:     editingId ? (invoices.find(i => i.id === editingId)?.paidDate || null) : null,
        createdAt:    editingId ? (invoices.find(i => i.id === editingId)?.createdAt || todayStr()) : todayStr(),
        loadId:       selectedLoad?.id || null,
      };
      const updated = editingId
        ? invoices.map(i => i.id === editingId ? record : i)
        : [record, ...invoices];
      persistInvoices(updated);
      setScreen('list');
    } catch (err) {
      setGenError('PDF generation failed. ' + (err.message || ''));
      setScreen('form');
    }
  };

  // ── Payment recording ─────────────────────────────────────────────────────
  const handleRecordPayment = (amount) => {
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { setPayError('Enter a valid amount.'); return; }
    if (parsed > activeInvoice.total) { setPayError(`Cannot exceed invoice total (${fmtMoney(activeInvoice.total)}).`); return; }
    setPayLoading(true);
    const isFullPay = parsed >= activeInvoice.total;
    const updated = invoices.map(inv => inv.id === activeInvoice.id
      ? { ...inv, paidAmount: parsed, paidDate: todayStr(), status: isFullPay ? 'paid' : 'outstanding' }
      : inv
    );
    persistInvoices(updated);
    setActiveInvoice(updated.find(i => i.id === activeInvoice.id));
    setPayAmt(''); setPayError(''); setPayLoading(false);
  };

  const handleMarkFullyPaid = () => {
    const updated = invoices.map(inv => inv.id === activeInvoice.id
      ? { ...inv, paidAmount: activeInvoice.total, paidDate: todayStr(), status: 'paid' }
      : inv
    );
    persistInvoices(updated);
    setActiveInvoice(updated.find(i => i.id === activeInvoice.id));
  };

  // ── Derived lists ─────────────────────────────────────────────────────────
  const outstanding = invoices.filter(i => i.status !== 'paid').sort((a, b) => {
    // Overdue first, then by due date
    const aOD = isOverdue(a), bOD = isOverdue(b);
    if (aOD !== bOD) return aOD ? -1 : 1;
    return (a.dueDate || '') < (b.dueDate || '') ? -1 : 1;
  });
  const paid = invoices.filter(i => i.status === 'paid').sort((a, b) =>
    (b.paidDate || '') < (a.paidDate || '') ? -1 : 1
  );

  // ── Generating spinner ────────────────────────────────────────────────────
  if (screen === 'generating') {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center font-['Barlow_Condensed'] ${bg}`}>
        <div className="w-16 h-16 bg-[#CC2222]/20 flex items-center justify-center mb-6 animate-pulse">
          <span className="text-2xl">📄</span>
        </div>
        <h2 className={`text-lg font-bold tracking-wider mb-2 ${text}`}>GENERATING PDF</h2>
        <p className={`text-sm ${subtext}`}>Building your invoice...</p>
        <div className="mt-8 flex gap-1">
          {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-[#CC2222] rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
        </div>
      </div>
    );
  }

  // ── Select load screen ────────────────────────────────────────────────────
  if (screen === 'select-load') {
    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
          <button onClick={() => setScreen('list')} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
          <h1 className={`text-xl font-bold tracking-wider ${text}`}>SELECT LOAD</h1>
          <p className={`text-xs mt-0.5 ${subtext}`}>Choose a delivered load to invoice</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loadsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#CC2222] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : loads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <p className={`text-base font-bold tracking-wider mb-2 ${text}`}>NO DELIVERED LOADS</p>
              <p className={`text-sm mb-6 ${subtext}`}>Mark a load as "Delivered" in My Loads first.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loads.map(load => (
                <button key={load.id} onClick={() => openFormFromLoad(load)}
                  className={`w-full text-left ${surface} border ${border} p-4 hover:border-[#CC2222]/50 transition-colors`}>
                  <div className="flex justify-between mb-1">
                    <span className={`text-xs font-bold tracking-wider text-[#2DBB62]`}>● {load.status.toUpperCase()}</span>
                    {load.pickup_date && <span className={`text-xs ${subtext}`}>{new Date(load.pickup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                  </div>
                  <p className={`text-sm font-bold ${text}`}>{load.origin || '—'} → {load.destination || '—'}</p>
                  {load.broker_name && <p className={`text-xs mt-0.5 ${subtext}`}>{load.broker_name}</p>}
                  <p className="text-sm font-bold mt-1 text-[#2DBB62]">{load.rate ? `$${Number(load.rate).toLocaleString()}` : '—'}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Invoice detail + payment ──────────────────────────────────────────────
  if (screen === 'detail' && activeInvoice) {
    const inv     = activeInvoice;
    const overdue = isOverdue(inv);
    const isPaid  = inv.status === 'paid';
    const partial = !isPaid && inv.paidAmount > 0;
    const outstanding_ = inv.total - (inv.paidAmount || 0);

    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
          <button onClick={() => setScreen('list')} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className={`text-xl font-bold tracking-wider ${text}`}>{inv.invoiceNumber}</h1>
              <p className={`text-xs mt-0.5 ${subtext}`}>{inv.billToName}</p>
            </div>
            <span className={`text-xs font-bold tracking-wider px-2 py-1 flex-shrink-0 ${
              isPaid  ? 'bg-green-600/20 text-green-400' :
              overdue ? 'bg-[#CC2222]/20 text-[#FF2020]' :
              partial ? 'bg-amber-600/20 text-amber-400' :
                        `${isDark ? 'bg-white/10 text-white/50' : 'bg-black/10 text-black/50'}`
            }`}>
              {isPaid ? '✓ PAID' : overdue ? '⚠ OVERDUE' : partial ? 'PARTIAL' : 'OUTSTANDING'}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

          {/* Invoice meta */}
          <div className={`${surface} border ${overdue && !isPaid ? 'border-[#CC2222]/50' : border} p-4 space-y-2`}>
            <InvRow label="Invoice Date" value={fmtDate(inv.invoiceDate)} text={text} subtext={subtext} />
            <InvRow label="Due Date"
              value={fmtDate(inv.dueDate)}
              text={text} subtext={subtext}
              valueColor={overdue && !isPaid ? 'text-[#FF2020] font-bold' : ''} />
            <InvRow label="Terms"    value={inv.terms || '—'}       text={text} subtext={subtext} />
            {inv.billToContact && <InvRow label="Contact"  value={inv.billToContact} text={text} subtext={subtext} />}
            {inv.billToMc      && <InvRow label="MC"       value={inv.billToMc}      text={text} subtext={subtext} />}
            {inv.origin        && <InvRow label="Route"    value={`${inv.origin} → ${inv.destination}`} text={text} subtext={subtext} />}
          </div>

          {/* Line items + total */}
          <div className={`${surface} border ${border} p-4 space-y-2`}>
            <p className={`text-xs tracking-wider font-bold mb-2 ${subtext}`}>LINE ITEMS</p>
            {inv.lineItems.filter(li => li.description && li.amount).map((li, i) => (
              <div key={i} className="flex justify-between gap-2">
                <span className={`text-sm flex-1 ${text}`}>{li.description}</span>
                <span className={`text-sm font-bold flex-shrink-0 ${text}`}>{fmtMoney(li.amount)}</span>
              </div>
            ))}
            {inv.taxAmount > 0 && (
              <div className={`flex justify-between text-sm pt-1 border-t ${border} ${subtext}`}>
                <span>Tax</span><span>{fmtMoney(inv.taxAmount)}</span>
              </div>
            )}
            <div className={`flex justify-between text-base font-bold pt-1 border-t ${border} ${text}`}>
              <span>TOTAL</span><span className={isPaid ? 'text-green-400' : overdue ? 'text-[#FF2020]' : 'text-[#2DBB62]'}>{fmtMoney(inv.total)}</span>
            </div>
          </div>

          {/* Payment status */}
          {isPaid ? (
            <div className="bg-green-600/10 border border-green-600/40 p-4 flex items-center gap-3">
              <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-bold tracking-wider text-green-400">PAID IN FULL</p>
                <p className={`text-xs mt-0.5 ${subtext}`}>{fmtMoney(inv.paidAmount)} received on {fmtDate(inv.paidDate)}</p>
              </div>
            </div>
          ) : (
            <div className={`${surface} border ${overdue ? 'border-[#CC2222]/50' : border} p-4 space-y-3`}>
              <p className={`text-xs tracking-wider font-bold ${overdue ? 'text-[#FF2020]' : subtext}`}>
                {overdue ? '⚠ PAYMENT OVERDUE' : 'RECORD PAYMENT'}
              </p>

              {partial && (
                <div className={`text-sm ${subtext} flex justify-between`}>
                  <span>Already collected</span>
                  <span className="text-amber-400 font-bold">{fmtMoney(inv.paidAmount)}</span>
                </div>
              )}
              <div className={`flex justify-between text-sm font-bold ${overdue ? 'text-[#FF2020]' : text}`}>
                <span>Outstanding</span>
                <span>{fmtMoney(outstanding_)}</span>
              </div>

              {payError && <p className="text-[#FF2020] text-xs">{payError}</p>}

              <button onClick={handleMarkFullyPaid}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 tracking-wider flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                MARK FULLY PAID — {fmtMoney(outstanding_)}
              </button>

              <div className="flex items-center gap-3">
                <div className={`flex-1 h-px ${isDark ? 'bg-[#222]' : 'bg-[#e5e5e5]'}`} />
                <span className={`text-xs tracking-widest ${subtext}`}>OR PARTIAL</span>
                <div className={`flex-1 h-px ${isDark ? 'bg-[#222]' : 'bg-[#e5e5e5]'}`} />
              </div>

              <div className="flex gap-2">
                <div className={`flex-1 flex items-center border ${border} ${isDark ? 'bg-[#0a0a0a]' : 'bg-white'}`}>
                  <span className={`pl-3 text-sm ${subtext}`}>$</span>
                  <input type="number" value={payAmt} onChange={e => setPayAmt(e.target.value)}
                    placeholder="0.00" min="0" step="0.01"
                    className={`flex-1 py-3 px-2 text-sm bg-transparent focus:outline-none ${text}`} />
                </div>
                <button onClick={() => handleRecordPayment(payAmt)} disabled={payLoading || !payAmt}
                  className="bg-[#CC2222] hover:bg-[#7A1010] disabled:opacity-40 text-white font-bold px-5 tracking-wider text-sm">
                  {payLoading ? '...' : 'RECORD'}
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2 pb-6">
            <button onClick={async () => {
              try {
                setScreen('generating');
                const doc = await generateInvoicePdf({
                  invoiceNumber: inv.invoiceNumber, invoiceDate: inv.invoiceDate, dueDate: inv.dueDate,
                  terms: inv.terms, taxAmount: inv.taxAmount, billToName: inv.billToName,
                  billToContact: inv.billToContact, billToMc: inv.billToMc,
                  origin: inv.origin, destination: inv.destination, commodity: inv.commodity, miles: inv.miles,
                  lineItems: inv.lineItems, paymentInstructions: inv.paymentInstructions, notes: inv.notes,
                }, user);
                const blob = doc.output('blob');
                const url  = URL.createObjectURL(blob);
                window.open(url, '_blank');
                const a = document.createElement('a');
                a.href = url; a.download = `${inv.invoiceNumber}.pdf`; a.click();
                setTimeout(() => URL.revokeObjectURL(url), 30000);
              } catch { /* silent */ }
              finally { setScreen('detail'); }
            }} className={`w-full ${surface} border ${border} py-3 flex items-center justify-center gap-2 font-bold tracking-wider text-sm ${text} hover:border-[#CC2222]/50 transition-colors`}>
              <span>📄</span> REGENERATE PDF
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Invoice form ──────────────────────────────────────────────────────────
  if (screen === 'form') {
    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
          <button onClick={() => setScreen('list')} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className={`text-xl font-bold tracking-wider ${text}`}>NEW INVOICE</h1>
              {selectedLoad && <p className={`text-xs mt-0.5 ${subtext}`}>{selectedLoad.origin} → {selectedLoad.destination}</p>}
            </div>
            {selectedLoad?.rate && (
              <span className="text-xs bg-[#2DBB62]/20 text-[#2DBB62] px-2 py-1 tracking-wider flex-shrink-0">
                ${Number(selectedLoad.rate).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {genError && <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-4"><p className="text-[#FF2020] text-sm">{genError}</p></div>}

          {/* Invoice details */}
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>INVOICE DETAILS</p>
            <div>
              <label className={LabelCls(isDark)}>INVOICE NUMBER</label>
              <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LabelCls(isDark)}>INVOICE DATE</label>
                <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={LabelCls(isDark)}>DUE DATE</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} />
              </div>
            </div>
            <div>
              <label className={LabelCls(isDark)}>TERMS</label>
              <input type="text" value={terms} onChange={e => setTerms(e.target.value)} placeholder="e.g. Net 30" className={inputCls} />
            </div>
          </div>

          {/* Bill To */}
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>BILL TO</p>
            <div>
              <label className={LabelCls(isDark)}>BROKER / COMPANY NAME</label>
              <input type="text" value={billToName} onChange={e => setBillToName(e.target.value)} placeholder="Echo Global Logistics" className={inputCls} />
            </div>
            <div>
              <label className={LabelCls(isDark)}>CONTACT <span className={`font-normal ${subtext}`}>(optional)</span></label>
              <input type="text" value={billToContact} onChange={e => setBillToContact(e.target.value)} placeholder="Name, phone, or email" className={inputCls} />
            </div>
            <div>
              <label className={LabelCls(isDark)}>MC NUMBER <span className={`font-normal ${subtext}`}>(optional)</span></label>
              <input type="text" value={billToMc} onChange={e => setBillToMc(e.target.value)} placeholder="MC-123456" className={inputCls} />
            </div>
          </div>

          {/* Route (manual entry only) */}
          {!selectedLoad && (
            <div className={`${surface} border ${border} p-4 space-y-3`}>
              <p className={`text-xs tracking-wider font-bold ${subtext}`}>ROUTE <span className={`font-normal ${subtext}`}>(optional)</span></p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LabelCls(isDark)}>ORIGIN</label>
                  <input type="text" value={formOrigin} onChange={e => setFormOrigin(e.target.value)} placeholder="City, State" className={inputCls} />
                </div>
                <div>
                  <label className={LabelCls(isDark)}>DESTINATION</label>
                  <input type="text" value={formDestination} onChange={e => setFormDestination(e.target.value)} placeholder="City, State" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LabelCls(isDark)}>COMMODITY</label>
                  <input type="text" value={formCommodity} onChange={e => setFormCommodity(e.target.value)} placeholder="e.g. Dry goods" className={inputCls} />
                </div>
                <div>
                  <label className={LabelCls(isDark)}>MILES</label>
                  <input type="number" value={formMiles} onChange={e => setFormMiles(e.target.value)} placeholder="e.g. 520" className={inputCls} min="0" />
                </div>
              </div>
            </div>
          )}

          {/* Line items */}
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>LINE ITEMS</p>
            {lineItems.map((li, idx) => (
              <div key={li.id} className={`border ${border} p-3 space-y-2`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs tracking-wider ${subtext}`}>ITEM {idx + 1}</span>
                  {lineItems.length > 1 && (
                    <button onClick={() => removeLineItem(li.id)} className={`text-xs ${subtext} hover:text-[#CC2222] transition-colors`}>✕ REMOVE</button>
                  )}
                </div>
                <input type="text" value={li.description} onChange={e => updateLineItem(li.id, 'description', e.target.value)} placeholder="Description" className={inputCls} />
                <div className="relative">
                  <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${subtext}`}>$</span>
                  <input type="number" value={li.amount} onChange={e => updateLineItem(li.id, 'amount', e.target.value)} placeholder="0.00" min="0" step="0.01" className={`${inputCls} pl-6`} />
                </div>
              </div>
            ))}
            <button onClick={addLineItem} className={`w-full border ${border} py-2.5 text-xs tracking-wider ${subtext} hover:border-[#CC2222]/50 transition-colors`}>
              + ADD LINE ITEM
            </button>
            <div className={`border-t ${border} pt-3 space-y-2`}>
              <div className="flex items-center justify-between gap-3">
                <label className={`text-xs tracking-wider font-bold ${subtext} flex-shrink-0`}>TAX %</label>
                <div className="relative w-32">
                  <input type="number" value={taxRate} min="0" max="100" step="0.01" onChange={e => setTaxRate(e.target.value)} placeholder="0" className={`${inputCls} pr-7 text-right`} />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${subtext}`}>%</span>
                </div>
              </div>
              <div className={`flex justify-between text-sm ${subtext}`}><span>Subtotal</span><span>${subtotalAmt.toFixed(2)}</span></div>
              {taxAmount > 0 && <div className={`flex justify-between text-sm ${subtext}`}><span>Tax ({taxRate}%)</span><span>${taxAmount.toFixed(2)}</span></div>}
              <div className={`flex justify-between text-base font-bold pt-1 border-t ${border} ${text}`}><span>TOTAL</span><span className="text-[#2DBB62]">${total.toFixed(2)}</span></div>
            </div>
          </div>

          {/* Additional info */}
          <div className={`${surface} border ${border} p-4 space-y-3`}>
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>ADDITIONAL INFO</p>
            <div>
              <label className={LabelCls(isDark)}>PAYMENT INSTRUCTIONS <span className={`font-normal ${subtext}`}>(optional)</span></label>
              <textarea value={paymentInstructions} onChange={e => setPaymentInstructions(e.target.value)} rows={2} placeholder="e.g. Please pay via ACH to account #..." className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={LabelCls(isDark)}>NOTES <span className={`font-normal ${subtext}`}>(optional)</span></label>
              <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2} placeholder="e.g. Reference: BOL #12345" className={`${inputCls} resize-none`} />
            </div>
          </div>

          {(!user?.company_name || !user?.logo_url) && (
            <div className={`border ${isDark ? 'border-amber-600/40 bg-[#D4921A]/10' : 'border-amber-500/30 bg-amber-50'} p-3 flex gap-3`}>
              <span>⚠️</span>
              <p className={`text-xs ${isDark ? 'text-[#D4921A]/80' : 'text-amber-700'}`}>Add your company name and logo in Profile for a branded invoice.</p>
            </div>
          )}

          <button onClick={handleGenerate} className="w-full bg-[#CC2222] hover:bg-[#7A1010] text-white font-bold py-4 tracking-wider transition-colors flex items-center justify-center gap-2">
            <span>📄</span> GENERATE & SAVE INVOICE
          </button>
          <div className="h-6" />
        </div>
      </div>
    );
  }

  // ── Main invoice list ─────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`} style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className={`text-sm tracking-wider ${subtext}`}>← BACK</button>
          <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center ${isDark ? 'text-yellow-400' : 'text-black/50'}`}>
            {isDark ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
          </button>
        </div>
        <h1 className={`text-xl font-bold tracking-wider ${text}`}>INVOICES</h1>
        <div className="flex gap-4 mt-1">
          <span className={`text-xs ${outstanding.length > 0 ? 'text-amber-400' : subtext}`}>{outstanding.length} outstanding</span>
          <span className={`text-xs text-green-400`}>{paid.length} paid</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">

        {/* Outstanding */}
        <div>
          <p className={`text-xs tracking-widest font-bold mb-3 ${subtext}`}>// OUTSTANDING</p>
          {outstanding.length === 0 ? (
            <div className={`${surface} border ${border} p-5 text-center`}>
              <p className={`text-sm font-bold tracking-wider mb-1 text-green-400`}>ALL CLEAR</p>
              <p className={`text-xs ${subtext}`}>No outstanding invoices.</p>
            </div>
          ) : outstanding.map(inv => {
            const overdue = isOverdue(inv);
            const partial = inv.paidAmount > 0;
            return (
              <button key={inv.id} onClick={() => { setActiveInvoice(inv); setScreen('detail'); }}
                className={`w-full text-left ${surface} border overflow-hidden mb-2 hover:opacity-90 transition-opacity ${overdue ? 'border-[#CC2222]/60' : border}`}>
                {overdue && <div className="h-1 w-full bg-[#CC2222]" />}
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className={`text-sm font-bold tracking-wider truncate ${text}`}>{inv.invoiceNumber}</p>
                      <p className={`text-xs truncate ${subtext}`}>{inv.billToName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-bold ${overdue ? 'text-[#FF2020]' : text}`}>{fmtMoney(inv.total)}</p>
                      {partial && <p className="text-xs text-amber-400">{fmtMoney(inv.paidAmount)} partial</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    {inv.origin ? <p className={`text-xs truncate ${subtext}`}>{inv.origin} → {inv.destination}</p> : <span />}
                    <p className={`text-xs flex-shrink-0 ml-2 ${overdue ? 'text-[#FF2020] font-bold' : subtext}`}>
                      {overdue ? `OVERDUE · ${fmtDate(inv.dueDate)}` : `Due ${fmtDate(inv.dueDate)}`}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Paid / History */}
        <div>
          <p className={`text-xs tracking-widest font-bold mb-3 ${subtext}`}>// PAID — HISTORY</p>
          {paid.length === 0 ? (
            <div className={`${surface} border ${border} p-5 text-center`}>
              <p className={`text-xs ${subtext}`}>Paid invoices will appear here.</p>
            </div>
          ) : paid.map(inv => (
            <button key={inv.id} onClick={() => { setActiveInvoice(inv); setScreen('detail'); }}
              className={`w-full text-left ${surface} border overflow-hidden mb-2 hover:opacity-90 transition-opacity border-green-600/30`}>
              <div className="h-0.5 w-full bg-green-600/50" />
              <div className="px-4 py-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0">
                    <p className={`text-sm font-bold tracking-wider truncate ${text}`}>{inv.invoiceNumber}</p>
                    <p className={`text-xs truncate ${subtext}`}>{inv.billToName}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base font-bold text-green-400">{fmtMoney(inv.total)}</p>
                    <p className={`text-xs ${subtext}`}>Paid {fmtDate(inv.paidDate)}</p>
                  </div>
                </div>
                {inv.origin && <p className={`text-xs ${subtext}`}>{inv.origin} → {inv.destination}</p>}
              </div>
            </button>
          ))}
        </div>

        <div className="h-4" />
      </div>

      {/* FAB */}
      <button onClick={() => setShowFabSheet(true)}
        style={{ position: 'fixed', bottom: 88, right: 20, zIndex: 50, borderRadius: 0, width: 56, height: 56 }}
        className="bg-[#CC2222] hover:bg-[#7A1010] shadow-lg flex items-center justify-center transition-colors">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* FAB sheet */}
      {showFabSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowFabSheet(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className={`relative ${surface} border-t-2 border-[#CC2222] px-5 pt-5 pb-10`} onClick={e => e.stopPropagation()}>
            <div className={`w-10 h-1 ${isDark ? 'bg-white/20' : 'bg-black/20'} mx-auto mb-5`} />
            <p className={`text-xs font-bold tracking-widest mb-4 ${subtext}`}>NEW INVOICE</p>
            <div className="space-y-3">
              <button onClick={() => { setShowFabSheet(false); fetchLoads(); setScreen('select-load'); }}
                className={`w-full flex items-center gap-4 p-4 border ${border} hover:border-[#CC2222]/50 transition-colors`}>
                <div className="w-10 h-10 bg-[#CC2222]/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#CC2222]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold tracking-wider ${text}`}>FROM A LOAD</p>
                  <p className={`text-xs mt-0.5 ${subtext}`}>Pre-fill from a delivered load</p>
                </div>
              </button>
              <button onClick={() => { setShowFabSheet(false); openFormManual(); }}
                className={`w-full flex items-center gap-4 p-4 border ${border} hover:border-[#CC2222]/50 transition-colors`}>
                <div className="w-10 h-10 bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold tracking-wider ${text}`}>MANUAL ENTRY</p>
                  <p className={`text-xs mt-0.5 ${subtext}`}>Fill in all details yourself</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LabelCls = (isDark) =>
  `block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`;

const InvRow = ({ label, value, text, subtext, valueColor }) => (
  <div className="flex justify-between items-start gap-3">
    <span className={`text-xs flex-shrink-0 ${subtext}`}>{label}</span>
    <span className={`text-sm text-right ${valueColor || text}`}>{value}</span>
  </div>
);

export default InvoiceGeneratorScreen;
