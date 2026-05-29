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

  const darkGray  = [30, 30, 30];
  const medGray   = [100, 100, 100];
  const lightGray = [230, 230, 230];
  const red       = [200, 30, 30];

  // ── Logo / company header ────────────────────────────────────────────────
  if (user?.logo_url) {
    try {
      const img = await loadImage(user.logo_url);
      const ratio = img.width / img.height;
      const logoH = 50;
      const logoW = Math.min(logoH * ratio, 120);
      doc.addImage(img, 'PNG', margin, y, logoW, logoH);
      y += logoH + 10;
    } catch (_) { /* skip if logo fails */ }
  }

  // Company name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...darkGray);
  doc.text((user?.company_name || user?.full_name || 'Company Name').toUpperCase(), margin, y);
  y += 18;

  // MC/DOT
  if (user?.mc_dot_number) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...medGray);
    doc.text(user.mc_dot_number, margin, y);
    y += 13;
  }

  // ── INVOICE header (top-right) ────────────────────────────────────────────
  const headerY = margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...red);
  doc.text('INVOICE', W - margin, headerY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...medGray);
  const invoiceLines = [
    ['Invoice #:', invoice.invoiceNumber],
    ['Date:', invoice.invoiceDate],
    ['Due Date:', invoice.dueDate],
  ];
  let infoY = headerY + 20;
  invoiceLines.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, W - margin - 80, infoY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.text(String(value || '—'), W - margin, infoY, { align: 'right' });
    doc.setTextColor(...medGray);
    infoY += 14;
  });

  y = Math.max(y, infoY) + 20;

  // Divider
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 20;

  // ── Bill To ───────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...medGray);
  doc.text('BILL TO', margin, y);
  y += 13;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...darkGray);
  doc.text(invoice.billToName || '—', margin, y);
  y += 14;
  if (invoice.billToContact) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...medGray);
    doc.text(invoice.billToContact, margin, y);
    y += 13;
  }
  if (invoice.billToMc) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...medGray);
    doc.text(`MC: ${invoice.billToMc}`, margin, y);
    y += 13;
  }

  y += 20;

  // ── Load details table ────────────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['LOAD DETAILS', '']],
    body: [
      ['Origin',        invoice.origin        || '—'],
      ['Destination',   invoice.destination   || '—'],
      ['Pickup Date',   invoice.pickupDate     || '—'],
      ['Delivery Date', invoice.deliveryDate   || '—'],
      ['Commodity',     invoice.commodity      || '—'],
      ['Miles',         invoice.miles ? `${Number(invoice.miles).toLocaleString()} mi` : '—'],
      ['Weight',        invoice.weight ? `${Number(invoice.weight).toLocaleString()} lbs` : '—'],
    ].filter(([, v]) => v !== '—'),
    headStyles: {
      fillColor: darkGray,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    bodyStyles: { fontSize: 9, textColor: darkGray },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 120, textColor: medGray } },
    theme: 'striped',
  });

  y = doc.lastAutoTable.finalY + 20;

  // ── Line items table ──────────────────────────────────────────────────────
  const lineItems = invoice.lineItems.filter(li => li.description && li.amount);

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['DESCRIPTION', 'AMOUNT']],
    body: lineItems.map(li => [li.description, `$${Number(li.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]),
    headStyles: {
      fillColor: red,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 10, textColor: darkGray },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 100, fontStyle: 'bold' },
    },
    theme: 'striped',
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  y = doc.lastAutoTable.finalY;

  // Total row
  const totalAmt = lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0);
  doc.setFillColor(...darkGray);
  doc.rect(margin, y, W - margin * 2, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL DUE', margin + 10, y + 18);
  doc.text(
    `$${totalAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    W - margin - 10, y + 18, { align: 'right' }
  );

  y += 50;

  // ── Payment instructions / notes ──────────────────────────────────────────
  if (invoice.paymentInstructions || invoice.notes) {
    doc.setDrawColor(...lightGray);
    doc.line(margin, y, W - margin, y);
    y += 16;

    if (invoice.paymentInstructions) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...medGray);
      doc.text('PAYMENT INSTRUCTIONS', margin, y);
      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      const piLines = doc.splitTextToSize(invoice.paymentInstructions, W - margin * 2);
      doc.text(piLines, margin, y);
      y += piLines.length * 12 + 10;
    }

    if (invoice.notes) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...medGray);
      doc.text('NOTES', margin, y);
      y += 12;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...darkGray);
      const noteLines = doc.splitTextToSize(invoice.notes, W - margin * 2);
      doc.text(noteLines, margin, y);
    }
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...lightGray);
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

// ── Main screen ───────────────────────────────────────────────────────────────

const InvoiceGeneratorScreen = ({ onBack }) => {
  const { api, user, theme, toggleTheme } = useDriverApp();
  const isDark = theme === 'dark';

  const bg      = isDark ? 'bg-[#030303]'        : 'bg-[#f5f5f5]';
  const surface = isDark ? 'bg-[#080808]'    : 'bg-white';
  const text    = isDark ? 'text-white'       : 'text-black';
  const subtext = isDark ? 'text-white/60'    : 'text-black/60';
  const border  = isDark ? 'border-[#1F1F1F]' : 'border-[#e5e5e5]';
  const inputCls = `w-full border py-2.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#CC2222] ${
    isDark
      ? 'bg-[#080808] border-[#1F1F1F] text-white placeholder-white/30'
      : 'bg-white border-[#e5e5e5] text-black placeholder-black/30'
  }`;

  const [screen, setScreen]   = useState('list'); // 'list' | 'form' | 'generating'
  const [loads, setLoads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState('');
  const [genError, setGenError] = useState('');

  // Form state
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate]     = useState('');
  const [dueDate, setDueDate]             = useState('');
  const [billToName, setBillToName]       = useState('');
  const [billToContact, setBillToContact] = useState('');
  const [billToMc, setBillToMc]           = useState('');
  const [lineItems, setLineItems]         = useState([]);
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [notes, setNotes]                 = useState('');

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    setFetchErr('');
    try {
      const data = await api('/my-loads');
      setLoads(Array.isArray(data) ? data.filter(l => l.status === 'delivered' || l.status === 'invoiced') : []);
    } catch {
      setFetchErr('Could not load. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const openForm = (load) => {
    setSelectedLoad(load);
    setInvoiceNumber(makeInvoiceNumber());
    setInvoiceDate(todayStr());
    setDueDate(netDueStr(30));
    setBillToName(load.broker_name || '');
    setBillToContact(load.broker_contact || '');
    setBillToMc(load.broker_mc || '');
    setLineItems([
      { id: 1, description: `Freight Services — ${load.origin || ''} to ${load.destination || ''}`, amount: String(load.rate || '') },
    ]);
    setPaymentInstructions('');
    setNotes(load.notes || '');
    setGenError('');
    setScreen('form');
  };

  const addLineItem = () =>
    setLineItems(prev => [...prev, { id: Date.now(), description: '', amount: '' }]);

  const updateLineItem = (id, field, value) =>
    setLineItems(prev => prev.map(li => li.id === id ? { ...li, [field]: value } : li));

  const removeLineItem = (id) =>
    setLineItems(prev => prev.filter(li => li.id !== id));

  const total = lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0);

  const handleGenerate = async () => {
    if (!billToName.trim()) { setGenError('Bill To name is required.'); return; }
    if (lineItems.filter(li => li.description && li.amount).length === 0) {
      setGenError('Add at least one line item with an amount.');
      return;
    }

    setScreen('generating');
    setGenError('');

    try {
      const invoice = {
        invoiceNumber, invoiceDate, dueDate,
        billToName: billToName.trim(),
        billToContact: billToContact.trim(),
        billToMc: billToMc.trim(),
        origin:       selectedLoad?.origin,
        destination:  selectedLoad?.destination,
        pickupDate:   selectedLoad?.pickup_date?.slice(0, 10),
        deliveryDate: selectedLoad?.delivery_date?.slice(0, 10),
        commodity:    selectedLoad?.commodity,
        miles:        selectedLoad?.estimated_miles,
        weight:       selectedLoad?.weight,
        lineItems,
        paymentInstructions: paymentInstructions.trim(),
        notes: notes.trim(),
      };

      const doc = await generateInvoicePdf(invoice, user);
      const filename = `${invoiceNumber}.pdf`;

      // Open PDF in new tab (works on web + Capacitor WebView)
      const blob = doc.output('blob');
      const url  = URL.createObjectURL(blob);
      window.open(url, '_blank');

      // Also trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);

      setScreen('form'); // return to form so user can generate again
    } catch (err) {
      setGenError('PDF generation failed. ' + (err.message || ''));
      setScreen('form');
    }
  };

  // ── Load list ─────────────────────────────────────────────────────────────
  if (screen === 'list') {
    return (
      <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
        <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
          <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className={`text-sm tracking-wider ${subtext}`}>← BACK</button>
            <button onClick={toggleTheme} className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-black/50'}`}>
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>
          <h1 className={`text-xl font-bold tracking-wider ${text}`}>INVOICE GENERATOR</h1>
          <p className={`text-xs mt-0.5 ${subtext}`}>Select a delivered load to invoice</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {fetchErr && (
            <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-4 mb-4">
              <p className="text-[#FF2020] text-sm">{fetchErr}</p>
              <button onClick={fetchLoads} className="text-[#FF2020] text-xs mt-2 underline">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-[#CC2222] border-t-transparent rounded-full animate-spin" />
              <p className={`text-sm ${subtext}`}>Loading loads...</p>
            </div>
          ) : loads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <p className="text-4xl mb-4">📄</p>
              <p className={`text-base font-bold tracking-wider mb-2 ${text}`}>NO DELIVERED LOADS</p>
              <p className={`text-sm ${subtext}`}>
                Mark a load as "Delivered" in My Loads to generate an invoice.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {loads.map(load => (
                <button key={load.id} onClick={() => openForm(load)}
                  className={`w-full text-left ${surface} border ${border} p-4 hover:border-[#CC2222]/50 transition-colors`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold tracking-wider ${
                      load.status === 'invoiced' ? 'text-purple-400' : 'text-[#2DBB62]'
                    }`}>
                      {load.status === 'invoiced' ? '● INVOICED' : '● DELIVERED'}
                    </span>
                    {load.pickup_date && (
                      <span className={`text-xs ${subtext}`}>
                        {new Date(load.pickup_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm font-bold ${text}`}>
                    {load.origin || '—'} → {load.destination || '—'}
                  </p>
                  {load.broker_name && (
                    <p className={`text-xs mt-1 ${subtext}`}>{load.broker_name}</p>
                  )}
                  <p className={`text-sm font-bold mt-1 text-[#2DBB62]`}>
                    {load.rate ? `$${Number(load.rate).toLocaleString()}` : '—'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

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
          {[0, 1, 2].map(i => (
            <div key={i} className="w-2 h-2 bg-[#CC2222] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Invoice form ──────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col font-['Barlow_Condensed'] ${bg}`}>
      <div className={`${surface} border-b ${border} px-5 pt-10 pb-4`}>
        <button onClick={() => setScreen('list')} className={`text-sm tracking-wider mb-4 block ${subtext}`}>← BACK</button>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className={`text-xl font-bold tracking-wider ${text}`}>NEW INVOICE</h1>
            <p className={`text-xs mt-0.5 ${subtext}`}>
              {selectedLoad?.origin} → {selectedLoad?.destination}
            </p>
          </div>
          <span className="text-xs bg-[#2DBB62]/20 text-[#2DBB62] px-2 py-1 tracking-wider flex-shrink-0">
            ${Number(selectedLoad?.rate || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {genError && (
          <div className="bg-[#CC2222]/20 border border-[#CC2222]/50 p-4">
            <p className="text-[#FF2020] text-sm">{genError}</p>
          </div>
        )}

        {/* Invoice meta */}
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
        </div>

        {/* Bill To */}
        <div className={`${surface} border ${border} p-4 space-y-3`}>
          <p className={`text-xs tracking-wider font-bold ${subtext}`}>BILL TO</p>
          <div>
            <label className={LabelCls(isDark)}>BROKER / COMPANY NAME</label>
            <input type="text" value={billToName} onChange={e => setBillToName(e.target.value)}
              placeholder="Echo Global Logistics" className={inputCls} />
          </div>
          <div>
            <label className={LabelCls(isDark)}>CONTACT <span className={`font-normal ${subtext}`}>(optional)</span></label>
            <input type="text" value={billToContact} onChange={e => setBillToContact(e.target.value)}
              placeholder="Name, phone, or email" className={inputCls} />
          </div>
          <div>
            <label className={LabelCls(isDark)}>MC NUMBER <span className={`font-normal ${subtext}`}>(optional)</span></label>
            <input type="text" value={billToMc} onChange={e => setBillToMc(e.target.value)}
              placeholder="MC-123456" className={inputCls} />
          </div>
        </div>

        {/* Line items */}
        <div className={`${surface} border ${border} p-4 space-y-3`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs tracking-wider font-bold ${subtext}`}>LINE ITEMS</p>
            <span className={`text-sm font-bold text-[#2DBB62]`}>
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {lineItems.map((li, idx) => (
            <div key={li.id} className={`border ${border} p-3 space-y-2`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs tracking-wider ${subtext}`}>ITEM {idx + 1}</span>
                {lineItems.length > 1 && (
                  <button onClick={() => removeLineItem(li.id)}
                    className={`text-xs ${subtext} hover:text-[#CC2222] transition-colors`}>✕ REMOVE</button>
                )}
              </div>
              <input type="text" value={li.description}
                onChange={e => updateLineItem(li.id, 'description', e.target.value)}
                placeholder="Description" className={inputCls} />
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${subtext}`}>$</span>
                <input type="number" value={li.amount}
                  onChange={e => updateLineItem(li.id, 'amount', e.target.value)}
                  placeholder="0.00" min="0" step="0.01"
                  className={`${inputCls} pl-6`} />
              </div>
            </div>
          ))}

          <button onClick={addLineItem}
            className={`w-full border ${border} py-2.5 text-xs tracking-wider ${subtext} hover:border-[#CC2222]/50 transition-colors`}>
            + ADD LINE ITEM
          </button>
        </div>

        {/* Payment instructions + notes */}
        <div className={`${surface} border ${border} p-4 space-y-3`}>
          <p className={`text-xs tracking-wider font-bold ${subtext}`}>ADDITIONAL INFO</p>
          <div>
            <label className={LabelCls(isDark)}>
              PAYMENT INSTRUCTIONS <span className={`font-normal ${subtext}`}>(optional)</span>
            </label>
            <textarea value={paymentInstructions} onChange={e => setPaymentInstructions(e.target.value)}
              rows={2} placeholder="e.g. Please pay via ACH to account #..."
              className={`${inputCls} resize-none`} />
          </div>
          <div>
            <label className={LabelCls(isDark)}>
              NOTES <span className={`font-normal ${subtext}`}>(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="e.g. Reference: BOL #12345"
              className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Company info reminder */}
        {(!user?.company_name || !user?.logo_url) && (
          <div className={`border ${isDark ? 'border-amber-600/40 bg-[#D4921A]/10' : 'border-amber-500/30 bg-amber-50'} p-3 flex gap-3`}>
            <span>⚠️</span>
            <p className={`text-xs ${isDark ? 'text-[#D4921A]/80' : 'text-amber-700'}`}>
              Add your company name and logo in Profile → Business Info for a branded invoice.
            </p>
          </div>
        )}

        {/* Generate button */}
        <button onClick={handleGenerate}
          className="w-full bg-[#CC2222] hover:bg-[#7A1010] text-white font-bold py-4 tracking-wider transition-colors flex items-center justify-center gap-2">
          <span>📄</span> GENERATE PDF INVOICE
        </button>

        <div className="h-6" />
      </div>
    </div>
  );
};

const LabelCls = (isDark) =>
  `block text-xs font-medium mb-1 tracking-wider ${isDark ? 'text-white/70' : 'text-black/70'}`;

export default InvoiceGeneratorScreen;
