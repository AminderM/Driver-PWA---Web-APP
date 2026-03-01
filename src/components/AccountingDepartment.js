import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ==================== Chart Components ====================

// Cash Flow Trend Chart
const AccountingTrendChart = ({ receivables, payables }) => {
  const chartData = useMemo(() => {
    // Group by month
    const monthlyData = {};
    const today = new Date();
    
    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      monthlyData[key] = { month: key, ar: 0, ap: 0, net: 0 };
    }
    
    // Sum AR by month
    receivables.forEach(r => {
      const date = new Date(r.created_at);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyData[key]) {
        monthlyData[key].ar += r.amount || 0;
      }
    });
    
    // Sum AP by month
    payables.forEach(p => {
      const date = new Date(p.created_at);
      const key = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (monthlyData[key]) {
        monthlyData[key].ap += p.amount || 0;
      }
    });
    
    // Calculate net
    Object.values(monthlyData).forEach(d => {
      d.net = d.ar - d.ap;
    });
    
    return Object.values(monthlyData);
  }, [receivables, payables]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          <Legend />
          <Line type="monotone" dataKey="ar" name="Receivables" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e' }} />
          <Line type="monotone" dataKey="ap" name="Payables" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
          <Line type="monotone" dataKey="net" name="Net Cash Flow" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: '#3b82f6' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Collections Performance Pie Chart
const CollectionsChart = ({ receivables }) => {
  const COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6b7280'];
  
  const pieData = useMemo(() => {
    const paid = receivables.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.amount || 0), 0);
    const pending = receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.amount || 0), 0);
    const overdue = receivables.filter(r => r.status === 'overdue').reduce((sum, r) => sum + (r.amount || 0), 0);
    const partial = receivables.filter(r => r.status === 'partial').reduce((sum, r) => sum + (r.amount || 0), 0);
    
    return [
      { name: 'Paid', value: paid },
      { name: 'Pending', value: pending },
      { name: 'Overdue', value: overdue },
      { name: 'Partial', value: partial }
    ].filter(d => d.value > 0);
  }, [receivables]);

  const total = pieData.reduce((sum, d) => sum + d.value, 0);
  const collectionRate = total > 0 
    ? ((pieData.find(d => d.name === 'Paid')?.value || 0) / total * 100).toFixed(1) 
    : 0;

  return (
    <div className="h-64 relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-2xl font-bold text-foreground">{collectionRate}%</div>
        <div className="text-xs text-muted-foreground">Collection Rate</div>
      </div>
    </div>
  );
};

// Aging Row Component (helper for AgingReport)
const AgingRow = ({ label, ar, ap, colorClass }) => (
  <div className={`grid grid-cols-3 gap-4 p-3 ${colorClass} rounded-lg`}>
    <span className="font-medium">{label}</span>
    <span className="text-right text-foreground">${ar.toLocaleString()}</span>
    <span className="text-right text-foreground">${ap.toLocaleString()}</span>
  </div>
);

// Aging Report Component
const AgingReport = ({ receivables, payables }) => {
  const agingData = useMemo(() => {
    const today = new Date();
    
    const calculateAging = (items, dateField = 'due_date') => {
      const buckets = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
      
      items.filter(item => item.status !== 'paid').forEach(item => {
        const dueDate = new Date(item[dateField]);
        const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue <= 0) buckets.current += item.amount || 0;
        else if (daysOverdue <= 30) buckets.days30 += item.amount || 0;
        else if (daysOverdue <= 60) buckets.days60 += item.amount || 0;
        else if (daysOverdue <= 90) buckets.days90 += item.amount || 0;
        else buckets.over90 += item.amount || 0;
      });
      
      return buckets;
    };
    
    return {
      ar: calculateAging(receivables),
      ap: calculateAging(payables)
    };
  }, [receivables, payables]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-4 px-3 py-2 bg-muted rounded-lg font-semibold text-sm">
        <span>Aging Bucket</span>
        <span className="text-right text-foreground">AR Outstanding</span>
        <span className="text-right text-foreground">AP Outstanding</span>
      </div>
      <AgingRow label="Current" ar={agingData.ar.current} ap={agingData.ap.current} colorClass="bg-muted" />
      <AgingRow label="1-30 Days" ar={agingData.ar.days30} ap={agingData.ap.days30} colorClass="bg-muted" />
      <AgingRow label="31-60 Days" ar={agingData.ar.days60} ap={agingData.ap.days60} colorClass="bg-muted" />
      <AgingRow label="61-90 Days" ar={agingData.ar.days90} ap={agingData.ap.days90} colorClass="bg-muted" />
      <AgingRow label="Over 90 Days" ar={agingData.ar.over90} ap={agingData.ap.over90} colorClass="bg-muted" />
    </div>
  );
};

// Cash Flow Projection Component
const CashFlowProjection = ({ receivables, payables }) => {
  const projectionData = useMemo(() => {
    const today = new Date();
    const projections = [];
    let runningBalance = 0;
    
    // Get expected inflows (AR pending/sent) and outflows (AP pending)
    const expectedInflows = receivables
      .filter(r => ['pending', 'sent'].includes(r.status))
      .map(r => ({ date: new Date(r.due_date), amount: r.amount, type: 'inflow', description: r.customer_name }));
    
    const expectedOutflows = payables
      .filter(p => p.status === 'pending')
      .map(p => ({ date: new Date(p.due_date), amount: p.amount, type: 'outflow', description: p.vendor_name }));
    
    // Combine and sort by date
    const allTransactions = [...expectedInflows, ...expectedOutflows]
      .filter(t => {
        const daysDiff = Math.floor((t.date - today) / (1000 * 60 * 60 * 24));
        return daysDiff >= 0 && daysDiff <= 30;
      })
      .sort((a, b) => a.date - b.date);
    
    // Generate weekly projections
    for (let week = 1; week <= 4; week++) {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() + (week - 1) * 7);
      const weekEnd = new Date(today);
      weekEnd.setDate(today.getDate() + week * 7);
      
      const weekTransactions = allTransactions.filter(t => t.date >= weekStart && t.date < weekEnd);
      const inflow = weekTransactions.filter(t => t.type === 'inflow').reduce((sum, t) => sum + t.amount, 0);
      const outflow = weekTransactions.filter(t => t.type === 'outflow').reduce((sum, t) => sum + t.amount, 0);
      runningBalance += inflow - outflow;
      
      projections.push({
        week: `Week ${week}`,
        inflow,
        outflow,
        net: inflow - outflow,
        balance: runningBalance
      });
    }
    
    return projections;
  }, [receivables, payables]);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={projectionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
          <Legend />
          <Bar dataKey="inflow" name="Expected Inflow" fill="#22c55e" />
          <Bar dataKey="outflow" name="Expected Outflow" fill="#ef4444" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ==================== Main Component ====================

const AccountingDepartment = ({ BACKEND_URL, fetchWithAuth }) => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Expenses state
  const [expenses, setExpenses] = useState([]);
  const [expensesSummary, setExpensesSummary] = useState({});
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [expenseFilter, setExpenseFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'

  // Income state
  const [income, setIncome] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState({});
  const [incomeFilter, setIncomeFilter] = useState('all'); // 'all', 'fully_paid', 'partial'

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState(null); // 'ar' or 'ap'
  const [paymentItem, setPaymentItem] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    payment_method: 'check',
    reference_number: '',
    notes: ''
  });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  // Receipt processing state
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [parsedReceiptData, setParsedReceiptData] = useState(null);
  const [receiptType, setReceiptType] = useState(null); // 'ar' or 'ap'

  // AR Filters
  const [arFilters, setArFilters] = useState({
    invoiceNumber: 'all',
    customer: 'all',
    status: 'all',
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: ''
  });

  // AP Filters
  const [apFilters, setApFilters] = useState({
    billNumber: 'all',
    vendor: 'all',
    status: 'all',
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: ''
  });

  // Invoice form
  const [invoiceForm, setInvoiceForm] = useState({
    customer_name: '',
    customer_email: '',
    invoice_number: '',
    amount: '',
    due_date: '',
    description: '',
    load_reference: '',
    status: 'pending'
  });

  // Bill form
  const [billForm, setBillForm] = useState({
    vendor_name: '',
    vendor_email: '',
    bill_number: '',
    amount: '',
    due_date: '',
    description: '',
    category: 'fuel',
    status: 'pending'
  });

  // Alerts state
  const [alerts, setAlerts] = useState([]);
  const [alertsSummary, setAlertsSummary] = useState({});

  useEffect(() => {
    loadData();
    loadAlerts();
  }, [fetchWithAuth, BACKEND_URL]);

  const loadAlerts = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/alerts`);
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setAlertsSummary(data.summary || {});
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const loadExpenses = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/expenses`);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setExpensesSummary(data.summary || {});
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }
  };

  const loadIncome = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/income`);
      if (res.ok) {
        const data = await res.json();
        setIncome(data.income || []);
        setIncomeSummary(data.summary || {});
      }
    } catch (error) {
      console.error('Error loading income:', error);
    }
  };

  const loadExpenseCategories = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/expense-categories`);
      if (res.ok) {
        const data = await res.json();
        setExpenseCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error loading expense categories:', error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load AR
      const arRes = await fetchWithAuth(`${BACKEND_URL}/api/accounting/receivables`);
      if (arRes.ok) {
        const arData = await arRes.json();
        setReceivables(arData.receivables || []);
      }

      // Load AP
      const apRes = await fetchWithAuth(`${BACKEND_URL}/api/accounting/payables`);
      if (apRes.ok) {
        const apData = await apRes.json();
        setPayables(apData.payables || []);
      }
      
      // Load Expenses
      await loadExpenses();
      await loadExpenseCategories();
      
      // Load Income
      await loadIncome();
    } catch (error) {
      console.error('Error loading accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Expenses
  const filteredExpenses = expenses.filter(item => {
    if (expenseFilter === 'all') return true;
    return item.status === expenseFilter;
  });

  // Filtered Income
  const filteredIncome = income.filter(item => {
    if (incomeFilter === 'all') return true;
    if (incomeFilter === 'fully_paid') return item.status === 'paid';
    if (incomeFilter === 'partial') return item.status === 'partial';
    return true;
  });

  // Filtered AR
  const filteredReceivables = receivables.filter(item => {
    if (arFilters.invoiceNumber !== 'all' && item.invoice_number !== arFilters.invoiceNumber) return false;
    if (arFilters.customer !== 'all' && item.customer_name !== arFilters.customer) return false;
    if (arFilters.status !== 'all' && item.status !== arFilters.status) return false;
    if (arFilters.amountMin && item.amount < parseFloat(arFilters.amountMin)) return false;
    if (arFilters.amountMax && item.amount > parseFloat(arFilters.amountMax)) return false;
    if (arFilters.dateFrom || arFilters.dateTo) {
      const itemDate = new Date(item.created_at);
      if (arFilters.dateFrom && itemDate < new Date(arFilters.dateFrom)) return false;
      if (arFilters.dateTo && itemDate > new Date(arFilters.dateTo + 'T23:59:59')) return false;
    }
    return true;
  });

  // Filtered AP
  const filteredPayables = payables.filter(item => {
    if (apFilters.billNumber !== 'all' && item.bill_number !== apFilters.billNumber) return false;
    if (apFilters.vendor !== 'all' && item.vendor_name !== apFilters.vendor) return false;
    if (apFilters.status !== 'all' && item.status !== apFilters.status) return false;
    if (apFilters.amountMin && item.amount < parseFloat(apFilters.amountMin)) return false;
    if (apFilters.amountMax && item.amount > parseFloat(apFilters.amountMax)) return false;
    if (apFilters.dateFrom || apFilters.dateTo) {
      const itemDate = new Date(item.created_at);
      if (apFilters.dateFrom && itemDate < new Date(apFilters.dateFrom)) return false;
      if (apFilters.dateTo && itemDate > new Date(apFilters.dateTo + 'T23:59:59')) return false;
    }
    return true;
  });

  // Unique values for filters
  const uniqueInvoiceNumbers = [...new Set(receivables.map(r => r.invoice_number).filter(Boolean))];
  const uniqueCustomers = [...new Set(receivables.map(r => r.customer_name).filter(Boolean))];
  const uniqueBillNumbers = [...new Set(payables.map(p => p.bill_number).filter(Boolean))];
  const uniqueVendors = [...new Set(payables.map(p => p.vendor_name).filter(Boolean))];

  // Calculate totals
  const totalAR = receivables.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalARPending = receivables.filter(r => r.status === 'pending').reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalAROverdue = receivables.filter(r => r.status === 'overdue').reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalARPaid = receivables.filter(r => r.status === 'paid').reduce((sum, r) => sum + (r.amount || 0), 0);

  const totalAP = payables.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAPPending = payables.filter(p => p.status === 'pending').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAPOverdue = payables.filter(p => p.status === 'overdue').reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalAPPaid = payables.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);

  // Create Invoice
  const handleCreateInvoice = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/receivables`, {
        method: 'POST',
        body: JSON.stringify(invoiceForm)
      });

      if (res.ok) {
        toast.success('Invoice created successfully');
        setShowInvoiceModal(false);
        setInvoiceForm({
          customer_name: '',
          customer_email: '',
          invoice_number: '',
          amount: '',
          due_date: '',
          description: '',
          load_reference: '',
          status: 'pending'
        });
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to create invoice');
      }
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  // Create Bill
  const handleCreateBill = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/payables`, {
        method: 'POST',
        body: JSON.stringify(billForm)
      });

      if (res.ok) {
        toast.success('Bill created successfully');
        setShowBillModal(false);
        setBillForm({
          vendor_name: '',
          vendor_email: '',
          bill_number: '',
          amount: '',
          due_date: '',
          description: '',
          category: 'fuel',
          status: 'pending'
        });
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to create bill');
      }
    } catch (error) {
      toast.error('Failed to create bill');
    }
  };

  // Update status
  const handleStatusChange = async (type, id, newStatus) => {
    // If user selects "partial" (Partial Payment Received), open the payment modal instead
    if (newStatus === 'partial') {
      const items = type === 'ar' ? receivables : payables;
      const item = items.find(i => i.id === id);
      if (item) {
        openPaymentModal(type, item);
        return;
      }
    }
    
    try {
      const endpoint = type === 'ar' ? 'receivables' : 'payables';
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success('Status updated successfully');
        loadData();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Payment functions
  const openPaymentModal = (type, item) => {
    setPaymentType(type);
    setPaymentItem(item);
    setPaymentForm({
      amount: '',
      payment_method: 'check',
      reference_number: '',
      notes: ''
    });
    setShowPaymentModal(true);
    
    // Load payment history asynchronously
    loadPaymentHistory(type, item.id);
  };

  const loadPaymentHistory = async (type, itemId) => {
    setLoadingPayments(true);
    try {
      const endpoint = type === 'ar' 
        ? `${BACKEND_URL}/api/accounting/receivables/${itemId}/payments`
        : `${BACKEND_URL}/api/accounting/payables/${itemId}/payments`;
      
      const res = await fetchWithAuth(endpoint);
      if (res.ok) {
        const data = await res.json();
        setPaymentHistory(data.payments || []);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      const endpoint = paymentType === 'ar'
        ? `${BACKEND_URL}/api/accounting/receivables/${paymentItem.id}/payments`
        : `${BACKEND_URL}/api/accounting/payables/${paymentItem.id}/payments`;

      const res = await fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          amount: parseFloat(paymentForm.amount),
          payment_method: paymentForm.payment_method,
          reference_number: paymentForm.reference_number,
          notes: paymentForm.notes
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Payment of $${parseFloat(paymentForm.amount).toLocaleString()} recorded successfully`);
        
        // Reset form and reload
        setPaymentForm({
          amount: '',
          payment_method: 'check',
          reference_number: '',
          notes: ''
        });
        
        // Reload payment history and data
        await loadPaymentHistory(paymentType, paymentItem.id);
        loadData();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to record payment');
      }
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  // Expense functions
  const handleApproveExpense = async (expenseId) => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/expenses/${expenseId}/approve`, {
        method: 'POST'
      });
      
      if (res.ok) {
        const data = await res.json();
        toast.success(`Expense approved! AP Bill ${data.ap_entry.bill_number} created.`);
        loadData(); // Reload all data
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to approve expense');
      }
    } catch (error) {
      toast.error('Failed to approve expense');
    }
  };

  const handleRejectExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to reject this expense?')) return;
    
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/expenses/${expenseId}/reject`, {
        method: 'POST'
      });
      
      if (res.ok) {
        toast.success('Expense rejected');
        loadExpenses();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to reject expense');
      }
    } catch (error) {
      toast.error('Failed to reject expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/accounting/expenses/${expenseId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        toast.success('Expense deleted');
        loadExpenses();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to delete expense');
      }
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      fuel: 'fa-gas-pump',
      repairs_maintenance: 'fa-wrench',
      tires: 'fa-circle',
      parts_supplies: 'fa-cog',
      tolls: 'fa-road',
      permits_licenses: 'fa-id-card',
      parking: 'fa-parking',
      driver_meals: 'fa-utensils',
      lodging: 'fa-bed',
      scale_fees: 'fa-balance-scale',
      lumper_fees: 'fa-dolly',
      detention_fees: 'fa-clock',
      insurance: 'fa-shield-alt',
      registration: 'fa-file-alt',
      cleaning: 'fa-broom',
      communication: 'fa-phone',
      office_supplies: 'fa-paperclip',
      professional_services: 'fa-briefcase',
      other: 'fa-ellipsis-h'
    };
    return icons[category] || 'fa-receipt';
  };

  const getCategoryName = (category) => {
    const names = {
      fuel: 'Fuel',
      repairs_maintenance: 'Repairs & Maintenance',
      tires: 'Tires',
      parts_supplies: 'Parts & Supplies',
      tolls: 'Tolls',
      permits_licenses: 'Permits & Licenses',
      parking: 'Parking',
      driver_meals: 'Driver Meals',
      lodging: 'Lodging',
      scale_fees: 'Scale Fees',
      lumper_fees: 'Lumper Fees',
      detention_fees: 'Detention Fees',
      insurance: 'Insurance',
      registration: 'Registration',
      cleaning: 'Cleaning',
      communication: 'Communication',
      office_supplies: 'Office Supplies',
      professional_services: 'Professional Services',
      other: 'Other'
    };
    return names[category] || category;
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-muted text-foreground',
      sent: 'bg-muted text-foreground',
      overdue: 'bg-muted text-foreground',
      paid: 'bg-muted text-foreground',
      partial: 'bg-muted text-foreground',
      cancelled: 'bg-muted text-foreground',
      approved: 'bg-muted text-foreground',
      rejected: 'bg-muted text-foreground'
    };
    return styles[status] || 'bg-muted text-foreground';
  };

  // Get display text for AR status
  const getARStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      sent: 'Sent',
      overdue: 'Overdue',
      partial: 'Partial Payment',
      paid: 'Fully Received'
    };
    return labels[status] || status;
  };

  // Receipt processing functions
  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReceiptFile(file);
      setParsedReceiptData(null);
      setReceiptType(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const processReceipt = async () => {
    if (!receiptFile) {
      toast.error('Please upload a receipt image first');
      return;
    }

    setProcessingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('file', receiptFile);

      // Use fetch directly for FormData (don't set Content-Type, let browser handle it)
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/accounting/parse-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setParsedReceiptData(data.parsed_data);
        setReceiptType(data.suggested_type); // 'ar' or 'ap'
        toast.success('Receipt processed successfully!');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to process receipt');
      }
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.error('Failed to process receipt');
    } finally {
      setProcessingReceipt(false);
    }
  };

  const submitParsedReceipt = async () => {
    if (!parsedReceiptData) {
      toast.error('Please process a receipt first');
      return;
    }

    try {
      // Use the new confirm-receipt endpoint with AI classification
      const treatment = parsedReceiptData.treatment || 'expense';
      
      const confirmPayload = {
        treatment: treatment,
        vendor_name: parsedReceiptData.vendor_name || 'Unknown Vendor',
        amount: parsedReceiptData.amount || 0,
        expense_date: parsedReceiptData.expense_date || new Date().toISOString().split('T')[0],
        due_date: parsedReceiptData.due_date || null,
        receipt_number: parsedReceiptData.receipt_number || `RCP-${Date.now()}`,
        bill_number: parsedReceiptData.bill_number || null,
        description: parsedReceiptData.description || 'Imported from receipt scan',
        category: parsedReceiptData.category || 'other',
        payment_method: parsedReceiptData.payment_method || 'card',
        payment_status: parsedReceiptData.payment_status || null,
        line_items: parsedReceiptData.line_items || [],
        load_reference: parsedReceiptData.load_reference || null,
        driver_name: parsedReceiptData.driver_name || null,
        vehicle_name: parsedReceiptData.vehicle_number || null,
        ai_treatment_reason: parsedReceiptData.treatment_reason || null
      };

      const response = await fetchWithAuth(`${BACKEND_URL}/api/accounting/confirm-receipt`, {
        method: 'POST',
        body: JSON.stringify(confirmPayload)
      });

      if (response.ok) {
        const result = await response.json();
        if (result.entry_type === 'expense') {
          toast.success('Expense added to ledger for approval!');
          setActiveTab('expenses');
        } else {
          toast.success('Bill added to Accounts Payable!');
          setActiveTab('ap');
        }
        // Reset receipt state
        setReceiptFile(null);
        setReceiptPreview(null);
        setParsedReceiptData(null);
        setReceiptType(null);
        loadData();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create entry');
      }
    } catch (error) {
      console.error('Error submitting receipt:', error);
      toast.error('Failed to create entry');
    }
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setParsedReceiptData(null);
    setReceiptType(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">💰 Accounting</h1>
          <p className="text-sm text-muted-foreground">Manage invoices, bills, and financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowInvoiceModal(true)} className="bg-green-600 hover:bg-green-700">
            <i className="fas fa-plus mr-2"></i>
            New Invoice
          </Button>
          <Button onClick={() => setShowBillModal(true)} variant="outline">
            <i className="fas fa-plus mr-2"></i>
            New Bill
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Total Receivable</p>
                <p className="text-2xl font-bold text-foreground">${totalAR.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                <i className="fas fa-arrow-down text-foreground"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-foreground">
              <span className="font-medium">{receivables.length}</span> invoices
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Total Payable</p>
                <p className="text-2xl font-bold text-foreground">${totalAP.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-red-200 rounded-full flex items-center justify-center">
                <i className="fas fa-arrow-up text-foreground"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-foreground">
              <span className="font-medium">{payables.length}</span> bills
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Overdue AR</p>
                <p className="text-2xl font-bold text-foreground">${totalAROverdue.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-200 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-foreground"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-foreground">
              <span className="font-medium">{receivables.filter(r => r.status === 'overdue').length}</span> overdue
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Net Position</p>
                <p className={`text-2xl font-bold ${totalAR - totalAP >= 0 ? 'text-foreground' : 'text-foreground'}`}>
                  ${(totalAR - totalAP).toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center">
                <i className="fas fa-balance-scale text-foreground"></i>
              </div>
            </div>
            <div className="mt-2 text-xs text-foreground">AR - AP Balance</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6 bg-card rounded-xl p-1 border border-border shadow-sm max-w-4xl">
          <TabsTrigger value="analytics" className="text-sm">
            <i className="fas fa-chart-line mr-2"></i>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="receipts" className="text-sm">
            <i className="fas fa-receipt mr-2"></i>
            Receipts
          </TabsTrigger>
          <TabsTrigger value="income" className="text-sm">
            <i className="fas fa-hand-holding-usd mr-2"></i>
            Income
          </TabsTrigger>
          <TabsTrigger value="expenses" className="text-sm">
            <i className="fas fa-money-bill-wave mr-2"></i>
            Expenses
          </TabsTrigger>
          <TabsTrigger value="receivables" className="text-sm">
            <i className="fas fa-file-invoice-dollar mr-2"></i>
            Accounts Receivable
          </TabsTrigger>
          <TabsTrigger value="payables" className="text-sm">
            <i className="fas fa-file-invoice mr-2"></i>
            Accounts Payable
          </TabsTrigger>
        </TabsList>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="space-y-6">
            {/* Alerts & Notifications Section */}
            {alerts.length > 0 && (
              <Card className="border-border bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <div className="flex items-center">
                      <i className="fas fa-bell text-foreground mr-2"></i>
                      Alerts & Notifications
                      <Badge className="ml-2 bg-muted text-foreground">
                        {alertsSummary.total_alerts || 0}
                      </Badge>
                    </div>
                    <div className="flex gap-2 text-sm">
                      {alertsSummary.high_priority > 0 && (
                        <Badge className="bg-muted text-foreground">
                          <i className="fas fa-exclamation-circle mr-1"></i>
                          {alertsSummary.high_priority} High
                        </Badge>
                      )}
                      {alertsSummary.medium_priority > 0 && (
                        <Badge className="bg-muted text-foreground">
                          {alertsSummary.medium_priority} Medium
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {alerts.slice(0, 5).map((alert, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-lg flex items-start justify-between ${
                          alert.priority === 'high' ? 'bg-muted border border-border' :
                          alert.priority === 'medium' ? 'bg-muted border border-border' :
                          'bg-muted border border-border'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <i className={`fas ${
                              alert.type === 'overdue_ar' ? 'fa-file-invoice-dollar text-foreground' :
                              alert.type === 'overdue_ap' ? 'fa-exclamation-triangle text-foreground' :
                              alert.type === 'upcoming_ap' ? 'fa-clock text-foreground' :
                              'fa-bell text-foreground'
                            }`}></i>
                            <span className="font-medium text-sm">{alert.title}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>Due: {new Date(alert.due_date).toLocaleDateString()}</span>
                            {alert.days_overdue > 0 && (
                              <Badge variant="outline" className="text-xs bg-muted text-foreground border-border">
                                {alert.days_overdue} days overdue
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <span className={`text-lg font-bold ${
                            alert.related_type === 'ar' ? 'text-foreground' : 'text-foreground'
                          }`}>
                            ${alert.amount?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {alerts.length > 5 && (
                      <div className="text-center pt-2 text-sm text-muted-foreground">
                        <i className="fas fa-ellipsis-h mr-1"></i>
                        {alerts.length - 5} more alerts
                      </div>
                    )}
                  </div>
                  {/* Alert Summary */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-foreground font-medium">AR Overdue Total</div>
                      <div className="text-xl font-bold text-foreground">${(alertsSummary.total_ar_overdue || 0).toLocaleString()}</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-xs text-foreground font-medium">AP Due/Overdue Total</div>
                      <div className="text-xl font-bold text-foreground">${(alertsSummary.total_ap_upcoming || 0).toLocaleString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Row - Summary Cards */}
            <div className="grid grid-cols-2 gap-6">
              {/* AR Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-arrow-circle-down text-foreground mr-2"></i>
                    Accounts Receivable Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-foreground">Pending</span>
                      <span className="text-lg font-bold text-foreground">${totalARPending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-foreground">Overdue</span>
                      <span className="text-lg font-bold text-foreground">${totalAROverdue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-foreground">Paid</span>
                      <span className="text-lg font-bold text-foreground">${totalARPaid.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">Total</span>
                        <span className="text-xl font-bold text-foreground">${totalAR.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AP Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-arrow-circle-up text-foreground mr-2"></i>
                    Accounts Payable Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-foreground">Pending</span>
                      <span className="text-lg font-bold text-foreground">${totalAPPending.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-foreground">Overdue</span>
                      <span className="text-lg font-bold text-foreground">${totalAPOverdue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium text-foreground">Paid</span>
                      <span className="text-lg font-bold text-foreground">${totalAPPaid.toLocaleString()}</span>
                    </div>
                    <div className="border-t pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-foreground">Total</span>
                        <span className="text-xl font-bold text-foreground">${totalAP.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Second Row - Charts */}
            <div className="grid grid-cols-2 gap-6">
              {/* AR/AP Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-chart-line text-foreground mr-2"></i>
                    Cash Flow Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AccountingTrendChart receivables={receivables} payables={payables} />
                </CardContent>
              </Card>

              {/* Collections Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <i className="fas fa-chart-pie text-foreground mr-2"></i>
                    Collections Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CollectionsChart receivables={receivables} />
                </CardContent>
              </Card>
            </div>

            {/* Third Row - Aging Report */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-calendar-alt text-foreground mr-2"></i>
                  Aging Report Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AgingReport receivables={receivables} payables={payables} />
              </CardContent>
            </Card>

            {/* Fourth Row - Cash Flow Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-piggy-bank text-foreground mr-2"></i>
                  Cash Flow Projection (Next 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CashFlowProjection receivables={receivables} payables={payables} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Receipts Tab */}
        <TabsContent value="receipts" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-upload text-foreground mr-2"></i>
                  Upload Receipt
                </CardTitle>
                <p className="text-sm text-muted-foreground">Upload a receipt image for AI processing</p>
              </CardHeader>
              <CardContent>
                {!receiptPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleReceiptUpload}
                      className="hidden"
                      id="receipt-upload"
                    />
                    <label htmlFor="receipt-upload" className="cursor-pointer">
                      <i className="fas fa-cloud-upload-alt text-muted-foreground text-4xl mb-4"></i>
                      <p className="text-muted-foreground mb-2">Click to upload or drag and drop</p>
                      <p className="text-sm text-muted-foreground">PNG, JPG, JPEG up to 10MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <img 
                        src={receiptPreview} 
                        alt="Receipt preview" 
                        className="w-full max-h-64 object-contain rounded-lg border"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={clearReceipt}
                      >
                        <i className="fas fa-times"></i>
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={processReceipt} 
                        disabled={processingReceipt}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {processingReceipt ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Processing...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-magic mr-2"></i>
                            Process with AI
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={clearReceipt}>
                        <i className="fas fa-redo mr-2"></i>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Parsed Data Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <i className="fas fa-file-alt text-foreground mr-2"></i>
                  Extracted Data
                </CardTitle>
                <p className="text-sm text-muted-foreground">Review and confirm before adding to Expenses Ledger</p>
              </CardHeader>
              <CardContent>
                {!parsedReceiptData ? (
                  <div className="text-center py-12">
                    <i className="fas fa-file-invoice text-foreground text-5xl mb-4"></i>
                    <p className="text-muted-foreground">Upload and process a receipt to see extracted data</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* AI Classification Decision */}
                    <div className={`p-4 rounded-lg border-2 ${
                      parsedReceiptData.treatment === 'expense' 
                        ? 'bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700' 
                        : 'bg-orange-50 dark:bg-orange-950 border-orange-300 dark:border-orange-700'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <i className={`fas ${parsedReceiptData.treatment === 'expense' ? 'fa-receipt text-green-600' : 'fa-file-invoice-dollar text-orange-600'} text-xl`}></i>
                          <span className="font-semibold text-foreground">
                            AI Classification: {parsedReceiptData.treatment === 'expense' ? 'Pre-paid Expense' : 'Unpaid Bill (Accounts Payable)'}
                          </span>
                        </div>
                        <Badge className={parsedReceiptData.treatment === 'expense' ? 'bg-green-600' : 'bg-orange-600'}>
                          {parsedReceiptData.treatment === 'expense' ? 'EXPENSE' : 'ACCOUNTS PAYABLE'}
                        </Badge>
                      </div>
                      {parsedReceiptData.treatment_reason && (
                        <p className="text-sm text-muted-foreground mb-3">
                          <i className="fas fa-robot mr-1"></i>
                          {parsedReceiptData.treatment_reason}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Change to:</span>
                        <Button 
                          size="sm" 
                          variant={parsedReceiptData.treatment === 'expense' ? 'default' : 'outline'}
                          onClick={() => setParsedReceiptData({...parsedReceiptData, treatment: 'expense'})}
                          className={parsedReceiptData.treatment === 'expense' ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          <i className="fas fa-receipt mr-1"></i> Expense
                        </Button>
                        <Button 
                          size="sm" 
                          variant={parsedReceiptData.treatment === 'accounts_payable' ? 'default' : 'outline'}
                          onClick={() => setParsedReceiptData({...parsedReceiptData, treatment: 'accounts_payable'})}
                          className={parsedReceiptData.treatment === 'accounts_payable' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                        >
                          <i className="fas fa-file-invoice-dollar mr-1"></i> Accounts Payable
                        </Button>
                      </div>
                    </div>

                    {/* Category Badge */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                      <span className="font-medium text-foreground">Detected Category:</span>
                      <Badge className="bg-muted text-foreground">
                        <i className={`fas ${getCategoryIcon(parsedReceiptData.category)} mr-1`}></i>
                        {getCategoryName(parsedReceiptData.category || 'other')}
                      </Badge>
                    </div>

                    {/* Workflow Note */}
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded flex items-center gap-2">
                      <i className="fas fa-info-circle"></i>
                      {parsedReceiptData.treatment === 'expense' 
                        ? 'This will be added to the Expenses Ledger as a pre-paid expense for approval.'
                        : 'This will be added to Accounts Payable as an unpaid bill to be paid later.'}
                    </div>

                    {/* Extracted Fields */}
                    <div className="space-y-3 border-t pt-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Vendor Name</Label>
                          <Input 
                            value={parsedReceiptData.vendor_name || ''} 
                            onChange={(e) => setParsedReceiptData({...parsedReceiptData, vendor_name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Amount ($)</Label>
                          <Input 
                            type="number"
                            value={parsedReceiptData.amount || ''} 
                            onChange={(e) => setParsedReceiptData({...parsedReceiptData, amount: parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            {parsedReceiptData.treatment === 'expense' ? 'Expense Date' : 'Invoice Date'}
                          </Label>
                          <Input 
                            type="date"
                            value={parsedReceiptData.expense_date || ''} 
                            onChange={(e) => setParsedReceiptData({...parsedReceiptData, expense_date: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            {parsedReceiptData.treatment === 'expense' ? 'Receipt #' : 'Bill/Invoice #'}
                          </Label>
                          <Input 
                            value={parsedReceiptData.receipt_number || ''} 
                            onChange={(e) => setParsedReceiptData({...parsedReceiptData, receipt_number: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      {/* Due Date - only for Accounts Payable */}
                      {parsedReceiptData.treatment === 'accounts_payable' && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Due Date</Label>
                            <Input 
                              type="date"
                              value={parsedReceiptData.due_date || ''} 
                              onChange={(e) => setParsedReceiptData({...parsedReceiptData, due_date: e.target.value})}
                            />
                          </div>
                          <div className="flex items-end">
                            <p className="text-xs text-muted-foreground pb-2">
                              <i className="fas fa-info-circle mr-1"></i>
                              If not set, defaults to 30 days from today
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Category</Label>
                          <Select 
                            value={parsedReceiptData.category || 'other'} 
                            onValueChange={(v) => setParsedReceiptData({...parsedReceiptData, category: v})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fuel">🛢️ Fuel</SelectItem>
                              <SelectItem value="repairs_maintenance">🔧 Repairs & Maintenance</SelectItem>
                              <SelectItem value="tires">🚗 Tires</SelectItem>
                              <SelectItem value="parts_supplies">⚙️ Parts & Supplies</SelectItem>
                              <SelectItem value="tolls">🛣️ Tolls</SelectItem>
                              <SelectItem value="permits_licenses">📋 Permits & Licenses</SelectItem>
                              <SelectItem value="parking">🅿️ Parking</SelectItem>
                              <SelectItem value="driver_meals">🍔 Driver Meals</SelectItem>
                              <SelectItem value="lodging">🏨 Lodging</SelectItem>
                              <SelectItem value="scale_fees">⚖️ Scale Fees</SelectItem>
                              <SelectItem value="lumper_fees">📦 Lumper Fees</SelectItem>
                              <SelectItem value="detention_fees">⏱️ Detention Fees</SelectItem>
                              <SelectItem value="insurance">🛡️ Insurance</SelectItem>
                              <SelectItem value="other">📋 Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Payment Method</Label>
                          <Select 
                            value={parsedReceiptData.payment_method || 'card'} 
                            onValueChange={(v) => setParsedReceiptData({...parsedReceiptData, payment_method: v})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="card">Credit Card</SelectItem>
                              <SelectItem value="fleet_card">Fleet Card</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="check">Check</SelectItem>
                              <SelectItem value="ach">ACH</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Description</Label>
                        <Input 
                          value={parsedReceiptData.description || ''} 
                          onChange={(e) => setParsedReceiptData({...parsedReceiptData, description: e.target.value})}
                        />
                      </div>

                      {/* Optional linking fields */}
                      <div className="border-t pt-3 mt-3">
                        <Label className="text-xs text-muted-foreground mb-2 block">Link to (Optional)</Label>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">Driver</Label>
                            <Input 
                              placeholder="Driver name"
                              value={parsedReceiptData.driver_name || ''} 
                              onChange={(e) => setParsedReceiptData({...parsedReceiptData, driver_name: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Vehicle/Truck</Label>
                            <Input 
                              placeholder="Vehicle #"
                              value={parsedReceiptData.vehicle_number || ''} 
                              onChange={(e) => setParsedReceiptData({...parsedReceiptData, vehicle_number: e.target.value})}
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Load Reference</Label>
                            <Input 
                              placeholder="Load #"
                              value={parsedReceiptData.load_reference || ''} 
                              onChange={(e) => setParsedReceiptData({...parsedReceiptData, load_reference: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Fuel specific fields */}
                      {parsedReceiptData.category === 'fuel' && (parsedReceiptData.gallons || parsedReceiptData.price_per_gallon) && (
                        <div className="bg-muted p-3 rounded-lg border border-border">
                          <Label className="text-xs text-foreground font-medium">Fuel Details</Label>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                            {parsedReceiptData.gallons && (
                              <div>Gallons: <span className="font-medium">{parsedReceiptData.gallons}</span></div>
                            )}
                            {parsedReceiptData.price_per_gallon && (
                              <div>Price/Gallon: <span className="font-medium">${parsedReceiptData.price_per_gallon}</span></div>
                            )}
                            {parsedReceiptData.odometer && (
                              <div>Odometer: <span className="font-medium">{parsedReceiptData.odometer}</span></div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        onClick={submitParsedReceipt}
                        className={`flex-1 ${parsedReceiptData.treatment === 'expense' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'}`}
                      >
                        <i className={`fas ${parsedReceiptData.treatment === 'expense' ? 'fa-plus-circle' : 'fa-file-invoice-dollar'} mr-2`}></i>
                        {parsedReceiptData.treatment === 'expense' ? 'Add to Expenses Ledger' : 'Add to Accounts Payable'}
                      </Button>
                      <Button variant="outline" onClick={clearReceipt}>
                        Clear
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Income Tab */}
        <TabsContent value="income" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-foreground">
                    <i className="fas fa-hand-holding-usd mr-2"></i>
                    Income ({filteredIncome.length})
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className="bg-muted text-foreground">
                      {incomeSummary.fully_paid_count || 0} Fully Paid
                    </Badge>
                    <Badge className="bg-muted text-foreground">
                      {incomeSummary.partial_count || 0} Partial
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={incomeFilter} onValueChange={setIncomeFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Income</SelectItem>
                      <SelectItem value="fully_paid">Fully Paid</SelectItem>
                      <SelectItem value="partial">Partial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="text-sm text-foreground font-medium">Total Received</div>
                  <div className="text-2xl font-bold text-foreground">${(incomeSummary.total_received || 0).toLocaleString()}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="text-sm text-foreground font-medium">Total Invoiced</div>
                  <div className="text-2xl font-bold text-foreground">${(incomeSummary.total_invoiced || 0).toLocaleString()}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="text-sm text-foreground font-medium">Outstanding</div>
                  <div className="text-2xl font-bold text-foreground">${(incomeSummary.total_outstanding || 0).toLocaleString()}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="text-sm text-foreground font-medium">Collection Rate</div>
                  <div className="text-2xl font-bold text-foreground">
                    {incomeSummary.total_invoiced > 0 
                      ? ((incomeSummary.total_received / incomeSummary.total_invoiced) * 100).toFixed(1) 
                      : 0}%
                  </div>
                </div>
              </div>

              {/* Income Table */}
              {filteredIncome.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <i className="fas fa-hand-holding-usd text-4xl mb-3 text-foreground"></i>
                  <p>No income received yet.</p>
                  <p className="text-sm mt-1">Record payments in Accounts Receivable to see income here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b-2 border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Invoice #</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Customer</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Invoiced</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Received</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Outstanding</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Load Ref</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Last Payment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredIncome.map((item, index) => {
                        const outstanding = (item.amount || 0) - (item.amount_paid || 0);
                        const paymentPercent = item.amount > 0 ? ((item.amount_paid || 0) / item.amount * 100) : 0;
                        return (
                          <tr key={item.id} className={`hover:bg-muted/50 ${index % 2 === 0 ? 'bg-card' : 'bg-muted/50'}`}>
                            <td className="px-4 py-3 font-medium text-foreground">
                              <div className="flex items-center gap-1">
                                {item.invoice_number}
                                {item.auto_generated && (
                                  <span className="text-xs text-foreground" title="Auto-generated from load">
                                    <i className="fas fa-link"></i>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">{item.customer_name}</td>
                            <td className="px-4 py-3 font-medium text-foreground">${item.amount?.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-foreground">${(item.amount_paid || 0).toLocaleString()}</span>
                                {/* Mini progress bar */}
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className="bg-muted0 h-1.5 rounded-full"
                                    style={{ width: `${Math.min(100, paymentPercent)}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {outstanding > 0 ? (
                                <span className="text-foreground">${outstanding.toLocaleString()}</span>
                              ) : (
                                <span className="text-foreground">$0</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {item.load_reference ? (
                                <Badge variant="outline" className="text-xs bg-muted text-foreground border-border">
                                  <i className="fas fa-truck mr-1"></i>
                                  {item.load_reference}
                                </Badge>
                              ) : '-'}
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={item.status === 'paid' ? 'bg-muted text-foreground' : 'bg-muted text-foreground'}>
                                {item.status === 'paid' ? (
                                  <><i className="fas fa-check-circle mr-1"></i>Paid</>
                                ) : (
                                  <><i className="fas fa-clock mr-1"></i>Partial</>
                                )}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">
                              {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Expenses Ledger Tab */}
        <TabsContent value="expenses" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Expenses Ledger ({filteredExpenses.length})</CardTitle>
                  <div className="flex gap-2">
                    <Badge className="bg-muted text-foreground">
                      {expensesSummary.pending_count || 0} Pending
                    </Badge>
                    <Badge className="bg-muted text-foreground">
                      {expensesSummary.approved_count || 0} Approved
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={expenseFilter} onValueChange={setExpenseFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Filter status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Expenses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="text-sm text-foreground font-medium">Pending Approval</div>
                  <div className="text-2xl font-bold text-foreground">${(expensesSummary.pending_total || 0).toLocaleString()}</div>
                  <div className="text-xs text-foreground">{expensesSummary.pending_count || 0} expenses</div>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="text-sm text-foreground font-medium">Approved (→ AP)</div>
                  <div className="text-2xl font-bold text-foreground">${(expensesSummary.approved_total || 0).toLocaleString()}</div>
                  <div className="text-xs text-foreground">{expensesSummary.approved_count || 0} expenses</div>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border col-span-2">
                  <div className="text-sm text-foreground font-medium">Workflow</div>
                  <div className="flex items-center gap-2 mt-2 text-xs">
                    <Badge className="bg-muted">Upload Receipt</Badge>
                    <i className="fas fa-arrow-right text-muted-foreground"></i>
                    <Badge className="bg-muted text-foreground">Pending Review</Badge>
                    <i className="fas fa-arrow-right text-muted-foreground"></i>
                    <Badge className="bg-muted text-foreground">Approved</Badge>
                    <i className="fas fa-arrow-right text-muted-foreground"></i>
                    <Badge className="bg-muted text-foreground">Accounts Payable</Badge>
                  </div>
                </div>
              </div>

              {/* Expenses Table */}
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <i className="fas fa-receipt text-4xl mb-3 text-foreground"></i>
                  <p>No expenses found.</p>
                  <p className="text-sm mt-1">Upload a receipt to create an expense entry.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('receipts')}
                  >
                    <i className="fas fa-upload mr-2"></i>
                    Upload Receipt
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b-2 border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Vendor</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Category</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Receipt #</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Links</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredExpenses.map((expense, index) => (
                        <tr key={expense.id} className={`hover:bg-muted ${index % 2 === 0 ? 'bg-card' : 'bg-muted/50'}`}>
                          <td className="px-4 py-3">
                            {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 font-medium">{expense.vendor_name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <i className={`fas ${getCategoryIcon(expense.category)} text-muted-foreground`}></i>
                              <span className="capitalize">{getCategoryName(expense.category)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-foreground">${expense.amount?.toLocaleString()}</td>
                          <td className="px-4 py-3 text-muted-foreground">{expense.receipt_number || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1 text-xs">
                              {expense.load_reference && (
                                <Badge variant="outline" className="text-xs bg-muted text-foreground border-border">
                                  <i className="fas fa-truck mr-1"></i>{expense.load_reference}
                                </Badge>
                              )}
                              {expense.driver_name && (
                                <Badge variant="outline" className="text-xs bg-muted text-foreground border-border">
                                  <i className="fas fa-user mr-1"></i>{expense.driver_name}
                                </Badge>
                              )}
                              {expense.vehicle_name && (
                                <Badge variant="outline" className="text-xs bg-muted text-foreground border-gray-300">
                                  <i className="fas fa-truck-pickup mr-1"></i>{expense.vehicle_name}
                                </Badge>
                              )}
                              {!expense.load_reference && !expense.driver_name && !expense.vehicle_name && '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusBadge(expense.status)}>{expense.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {expense.status === 'pending' ? (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                  onClick={() => handleApproveExpense(expense.id)}
                                >
                                  <i className="fas fa-check mr-1"></i>
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 text-xs text-foreground border-red-300 hover:bg-muted"
                                  onClick={() => handleRejectExpense(expense.id)}
                                >
                                  <i className="fas fa-times"></i>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="h-7 text-xs text-muted-foreground"
                                  onClick={() => handleDeleteExpense(expense.id)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                            ) : expense.status === 'approved' ? (
                              <div className="text-xs text-foreground">
                                <i className="fas fa-check-circle mr-1"></i>
                                {expense.ap_bill_number ? (
                                  <span>→ {expense.ap_bill_number}</span>
                                ) : 'Approved'}
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                {expense.status === 'rejected' ? 'Rejected' : '-'}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Receivable Tab */}
        <TabsContent value="receivables" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Accounts Receivable ({filteredReceivables.length})</CardTitle>
                  <span className="text-xs text-muted-foreground">{receivables.length} total</span>
                </div>
                <Button onClick={() => setShowInvoiceModal(true)} size="sm" className="bg-green-600 hover:bg-green-700">
                  <i className="fas fa-plus mr-2"></i>
                  New Invoice
                </Button>
              </div>
            </CardHeader>

            {/* AR Filter Bar */}
            <div className="px-4 py-3 bg-muted border-b border-border overflow-hidden">
              <div className="flex items-end gap-2 overflow-x-auto">
                <div className="min-w-[100px] max-w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Invoice #</label>
                  <select
                    value={arFilters.invoiceNumber}
                    onChange={(e) => setArFilters({ ...arFilters, invoiceNumber: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueInvoiceNumbers.map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[120px] max-w-[140px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Customer</label>
                  <select
                    value={arFilters.customer}
                    onChange={(e) => setArFilters({ ...arFilters, customer: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueCustomers.map(c => (
                      <option key={c} value={c}>{c.length > 15 ? c.substring(0, 15) + '...' : c}</option>
                    ))}
                  </select>
                </div>

                <div className="w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Amount ($)</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="number"
                      value={arFilters.amountMin}
                      onChange={(e) => setArFilters({ ...arFilters, amountMin: e.target.value })}
                      placeholder="Min"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="number"
                      value={arFilters.amountMax}
                      onChange={(e) => setArFilters({ ...arFilters, amountMax: e.target.value })}
                      placeholder="Max"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="w-[90px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select
                    value={arFilters.status}
                    onChange={(e) => setArFilters({ ...arFilters, status: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="sent">Sent</option>
                    <option value="overdue">Overdue</option>
                    <option value="partial">Partial Payment</option>
                    <option value="paid">Fully Received</option>
                  </select>
                </div>

                <div className="w-[170px] flex-shrink-0">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Date Range</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="date"
                      value={arFilters.dateFrom}
                      onChange={(e) => setArFilters({ ...arFilters, dateFrom: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="date"
                      value={arFilters.dateTo}
                      onChange={(e) => setArFilters({ ...arFilters, dateTo: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {(arFilters.invoiceNumber !== 'all' || arFilters.customer !== 'all' || 
                  arFilters.amountMin || arFilters.amountMax || arFilters.status !== 'all' ||
                  arFilters.dateFrom || arFilters.dateTo) && (
                  <button
                    onClick={() => setArFilters({
                      invoiceNumber: 'all', customer: 'all', status: 'all',
                      amountMin: '', amountMax: '', dateFrom: '', dateTo: ''
                    })}
                    className="px-2 py-1.5 text-xs text-foreground hover:bg-muted rounded whitespace-nowrap"
                  >
                    <i className="fas fa-times mr-1"></i>Clear
                  </button>
                )}
              </div>
            </div>

            <CardContent className="p-0">
              {filteredReceivables.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-file-invoice-dollar text-muted-foreground text-5xl mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">No Invoices</h3>
                  <p className="text-muted-foreground mb-4">Create your first invoice to track receivables</p>
                  <Button onClick={() => setShowInvoiceModal(true)} className="bg-green-600 hover:bg-green-700">
                    <i className="fas fa-plus mr-2"></i>Create Invoice
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b-2 border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Invoice #</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Customer</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Paid/Balance</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Due Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Load Ref</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredReceivables.map((item, index) => (
                        <tr key={item.id} className={`hover:bg-muted ${index % 2 === 0 ? 'bg-card' : 'bg-muted/50'}`}>
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div className="flex items-center gap-1">
                              {item.invoice_number}
                              {item.auto_generated && (
                                <span className="text-xs text-foreground" title="Auto-generated from load">
                                  <i className="fas fa-link"></i>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">{item.customer_name}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">${item.amount?.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <div className="text-foreground">Paid: ${(item.amount_paid || 0).toLocaleString()}</div>
                              <div className="text-foreground">Due: ${((item.amount || 0) - (item.amount_paid || 0)).toLocaleString()}</div>
                              {/* Mini progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div 
                                  className="bg-muted0 h-1 rounded-full"
                                  style={{ width: `${Math.min(100, ((item.amount_paid || 0) / (item.amount || 1)) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusBadge(item.status)}>{getARStatusLabel(item.status)}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {item.load_reference ? (
                              <Badge variant="outline" className="text-xs bg-muted text-foreground border-border">
                                <i className="fas fa-truck mr-1"></i>
                                {item.load_reference}
                              </Badge>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {item.status !== 'paid' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 text-xs text-foreground border-green-300 hover:bg-muted"
                                  onClick={() => openPaymentModal('ar', item)}
                                >
                                  <i className="fas fa-dollar-sign mr-1"></i>
                                  Pay
                                </Button>
                              )}
                              <Select value={item.status} onValueChange={(value) => handleStatusChange('ar', item.id, value)}>
                                <SelectTrigger className="h-7 w-[140px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="sent">Sent</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                  <SelectItem value="partial">Partial Payment Received</SelectItem>
                                  <SelectItem value="paid">Fully Received</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Accounts Payable Tab */}
        <TabsContent value="payables" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>Accounts Payable ({filteredPayables.length})</CardTitle>
                  <span className="text-xs text-muted-foreground">{payables.length} total</span>
                </div>
                <Button onClick={() => setShowBillModal(true)} size="sm" variant="outline">
                  <i className="fas fa-plus mr-2"></i>
                  New Bill
                </Button>
              </div>
            </CardHeader>

            {/* AP Filter Bar */}
            <div className="px-4 py-3 bg-muted border-b border-border overflow-hidden">
              <div className="flex items-end gap-2 overflow-x-auto">
                <div className="min-w-[100px] max-w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Bill #</label>
                  <select
                    value={apFilters.billNumber}
                    onChange={(e) => setApFilters({ ...apFilters, billNumber: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueBillNumbers.map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                </div>

                <div className="min-w-[120px] max-w-[140px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Vendor</label>
                  <select
                    value={apFilters.vendor}
                    onChange={(e) => setApFilters({ ...apFilters, vendor: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    {uniqueVendors.map(v => (
                      <option key={v} value={v}>{v.length > 15 ? v.substring(0, 15) + '...' : v}</option>
                    ))}
                  </select>
                </div>

                <div className="w-[120px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Amount ($)</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="number"
                      value={apFilters.amountMin}
                      onChange={(e) => setApFilters({ ...apFilters, amountMin: e.target.value })}
                      placeholder="Min"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="number"
                      value={apFilters.amountMax}
                      onChange={(e) => setApFilters({ ...apFilters, amountMax: e.target.value })}
                      placeholder="Max"
                      className="w-full px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="w-[90px]">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Status</label>
                  <select
                    value={apFilters.status}
                    onChange={(e) => setApFilters({ ...apFilters, status: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 bg-card"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="w-[170px] flex-shrink-0">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Date Range</label>
                  <div className="flex gap-0.5 items-center">
                    <input
                      type="date"
                      value={apFilters.dateFrom}
                      onChange={(e) => setApFilters({ ...apFilters, dateFrom: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                    <span className="text-muted-foreground text-xs">-</span>
                    <input
                      type="date"
                      value={apFilters.dateTo}
                      onChange={(e) => setApFilters({ ...apFilters, dateTo: e.target.value })}
                      className="w-[75px] px-1 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {(apFilters.billNumber !== 'all' || apFilters.vendor !== 'all' || 
                  apFilters.amountMin || apFilters.amountMax || apFilters.status !== 'all' ||
                  apFilters.dateFrom || apFilters.dateTo) && (
                  <button
                    onClick={() => setApFilters({
                      billNumber: 'all', vendor: 'all', status: 'all',
                      amountMin: '', amountMax: '', dateFrom: '', dateTo: ''
                    })}
                    className="px-2 py-1.5 text-xs text-foreground hover:bg-muted rounded whitespace-nowrap"
                  >
                    <i className="fas fa-times mr-1"></i>Clear
                  </button>
                )}
              </div>
            </div>

            <CardContent className="p-0">
              {filteredPayables.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-file-invoice text-muted-foreground text-5xl mb-4"></i>
                  <h3 className="text-xl font-semibold mb-2">No Bills</h3>
                  <p className="text-muted-foreground mb-4">Create your first bill to track payables</p>
                  <Button onClick={() => setShowBillModal(true)} variant="outline">
                    <i className="fas fa-plus mr-2"></i>Create Bill
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b-2 border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Bill #</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Vendor</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Amount</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Paid/Balance</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Due Date</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Category</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Load Ref</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPayables.map((item, index) => (
                        <tr key={item.id} className={`hover:bg-muted ${index % 2 === 0 ? 'bg-card' : 'bg-muted/50'}`}>
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div className="flex items-center gap-1">
                              {item.bill_number}
                              {item.auto_generated && (
                                <span className="text-xs text-foreground" title="Auto-generated from load">
                                  <i className="fas fa-link"></i>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">{item.vendor_name}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">${item.amount?.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <div className="text-xs">
                              <div className="text-foreground">Paid: ${(item.amount_paid || 0).toLocaleString()}</div>
                              <div className="text-foreground">Due: ${((item.amount || 0) - (item.amount_paid || 0)).toLocaleString()}</div>
                              {/* Mini progress bar */}
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div 
                                  className="bg-muted0 h-1 rounded-full"
                                  style={{ width: `${Math.min(100, ((item.amount_paid || 0) / (item.amount || 1)) * 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">{item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}</td>
                          <td className="px-4 py-3 capitalize">{item.category || '-'}</td>
                          <td className="px-4 py-3">
                            {item.load_reference ? (
                              <Badge variant="outline" className="text-xs bg-muted text-foreground border-border">
                                <i className="fas fa-truck mr-1"></i>
                                {item.load_reference}
                              </Badge>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusBadge(item.status)}>{item.status}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {item.status !== 'paid' && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="h-7 text-xs text-foreground border-blue-300 hover:bg-muted"
                                  onClick={() => openPaymentModal('ap', item)}
                                >
                                  <i className="fas fa-dollar-sign mr-1"></i>
                                  Pay
                                </Button>
                              )}
                              <Select value={item.status} onValueChange={(value) => handleStatusChange('ap', item.id, value)}>
                                <SelectTrigger className="h-7 w-[90px] text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="overdue">Overdue</SelectItem>
                                  <SelectItem value="partial">Partial</SelectItem>
                                  <SelectItem value="paid">Paid</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Invoice Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Invoice Number *</Label>
                <Input
                  value={invoiceForm.invoice_number}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, invoice_number: e.target.value })}
                  placeholder="INV-001"
                />
              </div>
              <div>
                <Label>Amount ($) *</Label>
                <Input
                  type="number"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label>Customer Name *</Label>
              <Input
                value={invoiceForm.customer_name}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_name: e.target.value })}
                placeholder="Customer name"
              />
            </div>
            <div>
              <Label>Customer Email</Label>
              <Input
                type="email"
                value={invoiceForm.customer_email}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, customer_email: e.target.value })}
                placeholder="customer@example.com"
              />
            </div>
            <div>
              <Label>Due Date *</Label>
              <Input
                type="date"
                value={invoiceForm.due_date}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, due_date: e.target.value })}
              />
            </div>
            <div>
              <Label>Load Reference</Label>
              <Input
                value={invoiceForm.load_reference}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, load_reference: e.target.value })}
                placeholder="LD-XXXXXXXX"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                placeholder="Invoice description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
            <Button onClick={handleCreateInvoice} className="bg-green-600 hover:bg-green-700">Create Invoice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Bill Modal */}
      <Dialog open={showBillModal} onOpenChange={setShowBillModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Bill</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Bill Number *</Label>
                <Input
                  value={billForm.bill_number}
                  onChange={(e) => setBillForm({ ...billForm, bill_number: e.target.value })}
                  placeholder="BILL-001"
                />
              </div>
              <div>
                <Label>Amount ($) *</Label>
                <Input
                  type="number"
                  value={billForm.amount}
                  onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label>Vendor Name *</Label>
              <Input
                value={billForm.vendor_name}
                onChange={(e) => setBillForm({ ...billForm, vendor_name: e.target.value })}
                placeholder="Vendor name"
              />
            </div>
            <div>
              <Label>Vendor Email</Label>
              <Input
                type="email"
                value={billForm.vendor_email}
                onChange={(e) => setBillForm({ ...billForm, vendor_email: e.target.value })}
                placeholder="vendor@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Due Date *</Label>
                <Input
                  type="date"
                  value={billForm.due_date}
                  onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={billForm.category} onValueChange={(v) => setBillForm({ ...billForm, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="insurance">Insurance</SelectItem>
                    <SelectItem value="tolls">Tolls</SelectItem>
                    <SelectItem value="supplies">Supplies</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={billForm.description}
                onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
                placeholder="Bill description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBillModal(false)}>Cancel</Button>
            <Button onClick={handleCreateBill}>Create Bill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Recording Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {paymentType === 'ar' ? 'Record Payment Received' : 'Record Payment Made'}
            </DialogTitle>
          </DialogHeader>
          
          {paymentItem && (
            <div className="space-y-4">
              {/* Invoice/Bill Summary */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{paymentType === 'ar' ? 'Invoice #' : 'Bill #'}:</span>
                  <span className="font-medium">{paymentType === 'ar' ? paymentItem.invoice_number : paymentItem.bill_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{paymentType === 'ar' ? 'Customer' : 'Vendor'}:</span>
                  <span className="font-medium">{paymentType === 'ar' ? paymentItem.customer_name : paymentItem.vendor_name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="font-bold text-foreground">${paymentItem.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-medium text-foreground">${(paymentItem.amount_paid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm border-t pt-2">
                  <span className="text-muted-foreground">Balance Due:</span>
                  <span className="font-bold text-foreground">${((paymentItem.amount || 0) - (paymentItem.amount_paid || 0)).toLocaleString()}</span>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-muted0 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((paymentItem.amount_paid || 0) / (paymentItem.amount || 1)) * 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {((paymentItem.amount_paid || 0) / (paymentItem.amount || 1) * 100).toFixed(0)}% paid
                  </p>
                </div>
              </div>

              {/* Payment History */}
              {paymentHistory.length > 0 && (
                <div className="border rounded-lg">
                  <div className="p-3 bg-muted border-b">
                    <h4 className="font-medium text-sm">Payment History</h4>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    {paymentHistory.map((payment, idx) => (
                      <div key={idx} className="p-2 border-b last:border-b-0 text-sm flex justify-between items-center">
                        <div>
                          <span className="font-medium text-foreground">${payment.amount?.toLocaleString()}</span>
                          <span className="text-muted-foreground ml-2">via {payment.payment_method}</span>
                          {payment.reference_number && (
                            <span className="text-muted-foreground ml-2">#{payment.reference_number}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(payment.recorded_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Payment Form */}
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-medium text-sm">Record New Payment</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Amount ($) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      placeholder="0.00"
                      max={(paymentItem.amount || 0) - (paymentItem.amount_paid || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Payment Method</Label>
                    <Select 
                      value={paymentForm.payment_method} 
                      onValueChange={(v) => setPaymentForm({ ...paymentForm, payment_method: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="check">Check</SelectItem>
                        <SelectItem value="wire">Wire Transfer</SelectItem>
                        <SelectItem value="ach">ACH</SelectItem>
                        <SelectItem value="card">Credit Card</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Reference Number</Label>
                  <Input
                    value={paymentForm.reference_number}
                    onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
                    placeholder="Check #, Transaction ID, etc."
                  />
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Input
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
            <Button 
              onClick={handleRecordPayment}
              className={paymentType === 'ar' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              <i className="fas fa-check mr-2"></i>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingDepartment;
