import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Users, DollarSign, TrendingUp, Calendar, 
  Plus, Edit, Trash2, Phone, Mail, Building,
  CheckCircle, Clock, Target, Award
} from 'lucide-react';

const CRMView = ({ fetchWithAuth, BACKEND_URL }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [activities, setActivities] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editingDeal, setEditingDeal] = useState(null);
  const [editingCompany, setEditingCompany] = useState(null);
  
  // Form states
  const [contactForm, setContactForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    ext: '',
    company: '',
    position: '',
    address: '',
    city: '',
    state: '',
    status: 'cold_lead',
    notes: ''
  });
  
  const [uploadingCSV, setUploadingCSV] = useState(false);
  
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    industry: '',
    website: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    country: '',
    employee_count: '',
    annual_revenue: '',
    company_type: 'prospect',
    status: 'active',
    parent_company: '',
    account_owner: '',
    founded_date: '',
    customer_since: '',
    linkedin_url: '',
    twitter_handle: '',
    notes: ''
  });
  
  const [dealForm, setDealForm] = useState({
    name: '',
    value: 0,
    stage: 'prospecting',
    contact_id: '',
    probability: 50,
    description: ''
  });
  
  const [activityForm, setActivityForm] = useState({
    type: 'call',
    subject: '',
    description: '',
    contact_id: '',
    completed: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contactsRes, dealsRes, activitiesRes, companiesRes, activityLogsRes, dashboardRes] = await Promise.all([
        fetchWithAuth(`${BACKEND_URL}/api/admin/crm/contacts`),
        fetchWithAuth(`${BACKEND_URL}/api/admin/crm/deals`),
        fetchWithAuth(`${BACKEND_URL}/api/admin/crm/activities`),
        fetchWithAuth(`${BACKEND_URL}/api/admin/crm/companies`),
        fetchWithAuth(`${BACKEND_URL}/api/admin/crm/activity-logs`),
        fetchWithAuth(`${BACKEND_URL}/api/admin/crm/dashboard`)
      ]);

      if (contactsRes.ok) setContacts(await contactsRes.json());
      if (dealsRes.ok) setDeals(await dealsRes.json());
      if (activitiesRes.ok) setActivities(await activitiesRes.json());
      if (companiesRes.ok) setCompanies(await companiesRes.json());
      if (activityLogsRes.ok) setActivityLogs(await activityLogsRes.json());
      if (dashboardRes.ok) setDashboard(await dashboardRes.json());
    } catch (e) {
      toast.error('Failed to load CRM data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/contacts`, {
        method: 'POST',
        body: JSON.stringify(contactForm)
      });
      if (res.ok) {
        toast.success('Contact created successfully');
        setIsContactModalOpen(false);
        loadData();
        resetContactForm();
      }
    } catch (e) {
      toast.error('Failed to create contact');
    }
  };

  const handleUpdateContact = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/contacts/${editingContact.id}`, {
        method: 'PUT',
        body: JSON.stringify(contactForm)
      });
      if (res.ok) {
        toast.success('Contact updated successfully');
        setIsContactModalOpen(false);
        loadData();
        resetContactForm();
      }
    } catch (e) {
      toast.error('Failed to update contact');
    }
  };

  const handleDeleteContact = async (id) => {
    if (!confirm('Delete this contact?')) return;
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/contacts/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Contact deleted');
        loadData();
      }
    } catch (e) {
      toast.error('Failed to delete contact');
    }
  };

  const handleCreateDeal = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/deals`, {
        method: 'POST',
        body: JSON.stringify(dealForm)
      });
      if (res.ok) {
        toast.success('Deal created successfully');
        setIsDealModalOpen(false);
        loadData();
        resetDealForm();
      }
    } catch (e) {
      toast.error('Failed to create deal');
    }
  };

  const handleCreateActivity = async () => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/activities`, {
        method: 'POST',
        body: JSON.stringify(activityForm)
      });
      if (res.ok) {
        toast.success('Activity created successfully');
        setIsActivityModalOpen(false);
        loadData();
        resetActivityForm();
      }
    } catch (e) {
      toast.error('Failed to create activity');
    }
  };

  const handleCreateCompany = async () => {
    try {
      // Prepare data with proper type conversions
      const companyData = {
        ...companyForm,
        employee_count: companyForm.employee_count ? parseInt(companyForm.employee_count) : null,
        annual_revenue: companyForm.annual_revenue ? parseFloat(companyForm.annual_revenue) : null,
        parent_company: companyForm.parent_company || null,
        account_owner: companyForm.account_owner || null,
        founded_date: companyForm.founded_date || null,
        customer_since: companyForm.customer_since || null,
        linkedin_url: companyForm.linkedin_url || null,
        twitter_handle: companyForm.twitter_handle || null,
        notes: companyForm.notes || null
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/companies`, {
        method: 'POST',
        body: JSON.stringify(companyData)
      });
      
      if (res.ok) {
        toast.success('Company created successfully');
        setIsCompanyModalOpen(false);
        loadData();
        resetCompanyForm();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to create company');
      }
    } catch (e) {
      toast.error('Failed to create company: ' + e.message);
    }
  };

  const handleUpdateCompany = async () => {
    try {
      // Prepare data with proper type conversions
      const companyData = {
        ...companyForm,
        employee_count: companyForm.employee_count ? parseInt(companyForm.employee_count) : null,
        annual_revenue: companyForm.annual_revenue ? parseFloat(companyForm.annual_revenue) : null,
        parent_company: companyForm.parent_company || null,
        account_owner: companyForm.account_owner || null,
        founded_date: companyForm.founded_date || null,
        customer_since: companyForm.customer_since || null,
        linkedin_url: companyForm.linkedin_url || null,
        twitter_handle: companyForm.twitter_handle || null,
        notes: companyForm.notes || null
      };

      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/companies/${editingCompany.id}`, {
        method: 'PUT',
        body: JSON.stringify(companyData)
      });
      
      if (res.ok) {
        toast.success('Company updated successfully');
        setIsCompanyModalOpen(false);
        loadData();
        resetCompanyForm();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to update company');
      }
    } catch (e) {
      toast.error('Failed to update company: ' + e.message);
    }
  };

  const handleDeleteCompany = async (id) => {
    if (!confirm('Delete this company?')) return;
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/companies/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Company deleted');
        loadData();
      }
    } catch (e) {
      toast.error('Failed to delete company');
    }
  };

  const handleCompanyCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingCSV(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/companies/upload`, {
        method: 'POST',
        body: formData
        // Don't set headers - fetchWithAuth will handle it for FormData
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.message);
        if (result.errors && result.errors.length > 0) {
          console.log('Import errors:', result.errors);
        }
        loadData();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.detail || 'Failed to upload CSV');
      }
    } catch (e) {
      console.error('Company CSV upload error:', e);
      toast.error('Error uploading CSV: ' + e.message);
    } finally {
      setUploadingCSV(false);
      event.target.value = '';
    }
  };

  const resetContactForm = () => {
    setContactForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      ext: '',
      company: '',
      position: '',
      address: '',
      city: '',
      state: '',
      status: 'cold_lead',
      notes: ''
    });
    setEditingContact(null);
  };

  const resetDealForm = () => {
    setDealForm({
      name: '',
      value: 0,
      stage: 'prospecting',
      contact_id: '',
      probability: 50,
      description: ''
    });
    setEditingDeal(null);
  };

  const resetActivityForm = () => {
    setActivityForm({
      type: 'call',
      subject: '',
      description: '',
      contact_id: '',
      completed: false
    });
  };

  const resetCompanyForm = () => {
    setCompanyForm({
      company_name: '',
      industry: '',
      website: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
      employee_count: '',
      annual_revenue: '',
      company_type: 'prospect',
      status: 'active',
      parent_company: '',
      account_owner: '',
      founded_date: '',
      customer_since: '',
      linkedin_url: '',
      twitter_handle: '',
      notes: ''
    });
    setEditingCompany(null);
  };

  const openEditCompany = (company) => {
    setEditingCompany(company);
    setCompanyForm({
      company_name: company.company_name,
      industry: company.industry || '',
      website: company.website || '',
      phone: company.phone || '',
      email: company.email || '',
      address: company.address || '',
      city: company.city || '',
      state: company.state || '',
      zip_code: company.zip_code || '',
      country: company.country || '',
      employee_count: company.employee_count || '',
      annual_revenue: company.annual_revenue || '',
      company_type: company.company_type || 'prospect',
      status: company.status || 'active',
      parent_company: company.parent_company || '',
      account_owner: company.account_owner || '',
      founded_date: company.founded_date || '',
      customer_since: company.customer_since || '',
      linkedin_url: company.linkedin_url || '',
      twitter_handle: company.twitter_handle || '',
      notes: company.notes || ''
    });
    setIsCompanyModalOpen(true);
  };

  const openEditContact = (contact) => {
    setEditingContact(contact);
    setContactForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      email: contact.email,
      phone: contact.phone || '',
      ext: contact.ext || '',
      company: contact.company || '',
      position: contact.position || '',
      address: contact.address || '',
      city: contact.city || '',
      state: contact.state || '',
      status: contact.status,
      notes: contact.notes || ''
    });
    setIsContactModalOpen(true);
  };

  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingCSV(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/crm/contacts/upload`, {
        method: 'POST',
        body: formData
        // Don't set headers - fetchWithAuth will handle it for FormData
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.message);
        if (result.errors && result.errors.length > 0) {
          console.log('Import errors:', result.errors);
        }
        loadData();
      } else {
        const error = await res.json().catch(() => ({}));
        toast.error(error.detail || 'Failed to upload CSV');
      }
    } catch (e) {
      console.error('CSV upload error:', e);
      toast.error('Error uploading CSV: ' + e.message);
    } finally {
      setUploadingCSV(false);
      event.target.value = ''; // Reset file input
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      cold_lead: 'bg-muted text-foreground',
      hot_lead: 'bg-muted text-orange-800',
      customer: 'bg-muted text-foreground'
    };
    const labels = {
      cold_lead: 'Cold Lead',
      hot_lead: 'Hot Lead',
      customer: 'Customer'
    };
    return <Badge className={variants[status] || 'bg-muted'}>{labels[status] || status}</Badge>;
  };

  const getStageBadge = (stage) => {
    const variants = {
      prospecting: 'bg-muted text-purple-800',
      qualification: 'bg-muted text-foreground',
      proposal: 'bg-muted text-indigo-800',
      negotiation: 'bg-muted text-orange-800',
      closed_won: 'bg-muted text-foreground',
      closed_lost: 'bg-muted text-red-800'
    };
    return <Badge className={variants[stage] || 'bg-muted'}>{stage.replace('_', ' ')}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading CRM...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-foreground">CRM</h2>
          <p className="text-muted-foreground mt-2">Customer Relationship Management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-4">
          {['dashboard', 'company', 'contacts', 'deals', 'activity-log'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'company' ? 'Company' : 
               tab === 'activity-log' ? 'Activity Log' : 
               tab}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && dashboard && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Contacts</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{dashboard.total_contacts}</p>
                    <p className="text-xs text-muted-foreground mt-1">{dashboard.leads} leads</p>
                  </div>
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Deal Value</p>
                    <p className="text-3xl font-bold text-foreground mt-2">${dashboard.total_deal_value.toLocaleString()}</p>
                    <p className="text-xs text-foreground mt-1">{dashboard.won_deals_count} won</p>
                  </div>
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{dashboard.conversion_rate.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{dashboard.customers} customers</p>
                  </div>
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Activities</p>
                    <p className="text-3xl font-bold text-foreground mt-2">{dashboard.pending_activities}</p>
                    <p className="text-xs text-muted-foreground mt-1">to complete</p>
                  </div>
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deals by Stage */}
          <Card>
            <CardHeader>
              <CardTitle>Deals by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(dashboard.deals_by_stage).map(([stage, count]) => (
                  <div key={stage} className="border rounded-lg p-4">
                    <div className="text-2xl font-bold text-foreground">{count}</div>
                    <div className="text-sm text-muted-foreground capitalize mt-1">{stage.replace('_', ' ')}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contacts Tab */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Contacts</h3>
            <div className="flex gap-2">
              <label htmlFor="csv-upload">
                <Button variant="outline" disabled={uploadingCSV} onClick={() => document.getElementById('csv-upload').click()}>
                  {uploadingCSV ? 'Uploading...' : 'Upload CSV/Excel'}
                </Button>
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleCSVUpload}
                className="hidden"
              />
              <Button onClick={() => { resetContactForm(); setIsContactModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-3 font-semibold text-foreground">Name</th>
                      <th className="text-left p-3 font-semibold text-foreground">Company</th>
                      <th className="text-left p-3 font-semibold text-foreground">Position</th>
                      <th className="text-left p-3 font-semibold text-foreground">Email</th>
                      <th className="text-left p-3 font-semibold text-foreground">Phone#</th>
                      <th className="text-left p-3 font-semibold text-foreground">Ext</th>
                      <th className="text-left p-3 font-semibold text-foreground">Address</th>
                      <th className="text-left p-3 font-semibold text-foreground">City</th>
                      <th className="text-left p-3 font-semibold text-foreground">State</th>
                      <th className="text-left p-3 font-semibold text-foreground">Status</th>
                      <th className="text-left p-3 font-semibold text-foreground">Notes</th>
                      <th className="text-left p-3 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(contact => (
                      <tr key={contact.id} className="border-b hover:bg-muted">
                        <td className="p-3">
                          <div className="font-medium text-foreground">
                            {contact.first_name} {contact.last_name}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-foreground">{contact.company || '—'}</td>
                        <td className="p-3 text-sm text-foreground">{contact.position || '—'}</td>
                        <td className="p-3 text-sm text-foreground">{contact.email}</td>
                        <td className="p-3 text-sm text-foreground">{contact.phone || '—'}</td>
                        <td className="p-3 text-sm text-foreground">{contact.ext || '—'}</td>
                        <td className="p-3 text-sm text-foreground">{contact.address || '—'}</td>
                        <td className="p-3 text-sm text-foreground">{contact.city || '—'}</td>
                        <td className="p-3 text-sm text-foreground">{contact.state || '—'}</td>
                        <td className="p-3">{getStatusBadge(contact.status)}</td>
                        <td className="p-3 text-sm text-foreground max-w-xs truncate">
                          {contact.notes || '—'}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditContact(contact)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteContact(contact.id)}>
                              <Trash2 className="w-3 h-3 text-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {contacts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No contacts yet. Add your first contact or upload a CSV file.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Company Tab */}
      {activeTab === 'company' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Companies</h3>
            <div className="flex gap-2">
              <label htmlFor="company-csv-upload">
                <Button variant="outline" disabled={uploadingCSV} onClick={() => document.getElementById('company-csv-upload').click()}>
                  {uploadingCSV ? 'Uploading...' : 'Upload CSV/Excel'}
                </Button>
              </label>
              <input
                id="company-csv-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleCompanyCSVUpload}
                className="hidden"
              />
              <Button onClick={() => { resetCompanyForm(); setIsCompanyModalOpen(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Company
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-3 font-semibold text-foreground">Company Name</th>
                      <th className="text-left p-3 font-semibold text-foreground">Industry</th>
                      <th className="text-left p-3 font-semibold text-foreground">Website</th>
                      <th className="text-left p-3 font-semibold text-foreground">Phone</th>
                      <th className="text-left p-3 font-semibold text-foreground">Email</th>
                      <th className="text-left p-3 font-semibold text-foreground">City</th>
                      <th className="text-left p-3 font-semibold text-foreground">State</th>
                      <th className="text-left p-3 font-semibold text-foreground">Country</th>
                      <th className="text-left p-3 font-semibold text-foreground">Employee Count</th>
                      <th className="text-left p-3 font-semibold text-foreground">Annual Revenue</th>
                      <th className="text-left p-3 font-semibold text-foreground">Type</th>
                      <th className="text-left p-3 font-semibold text-foreground">Status</th>
                      <th className="text-left p-3 font-semibold text-foreground">Account Owner</th>
                      <th className="text-left p-3 font-semibold text-foreground">Notes</th>
                      <th className="text-left p-3 font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map(company => (
                      <tr key={company.id} className="border-b hover:bg-muted">
                        <td className="p-3">
                          <div className="font-medium text-foreground">{company.company_name}</div>
                          {company.parent_company && (
                            <div className="text-xs text-muted-foreground">Parent: {company.parent_company}</div>
                          )}
                        </td>
                        <td className="p-3 text-sm text-foreground">{company.industry || '—'}</td>
                        <td className="p-3 text-sm text-foreground">
                          {company.website ? (
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                              {company.website.replace(/^https?:\/\//, '').substring(0, 20)}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="p-3 text-sm text-foreground">{company.phone || '—'}</td>
                        <td className="p-3 text-sm text-foreground">{company.email || '—'}</td>
                        <td className="p-3 text-sm text-foreground">{company.city || '—'}</td>
                        <td className="p-3 text-sm text-foreground">{company.state || '—'}</td>
                        <td className="p-3 text-sm text-foreground">{company.country || '—'}</td>
                        <td className="p-3 text-sm text-foreground">
                          {company.employee_count ? company.employee_count.toLocaleString() : '—'}
                        </td>
                        <td className="p-3 text-sm text-foreground">
                          {company.annual_revenue ? `$${(company.annual_revenue / 1000000).toFixed(1)}M` : '—'}
                        </td>
                        <td className="p-3">
                          <Badge className={
                            company.company_type === 'customer' ? 'bg-muted text-foreground' :
                            company.company_type === 'partner' ? 'bg-muted text-purple-800' :
                            company.company_type === 'vendor' ? 'bg-muted text-orange-800' :
                            'bg-muted text-foreground'
                          }>
                            {company.company_type}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge className={
                            company.status === 'active' ? 'bg-muted text-foreground' :
                            company.status === 'churned' ? 'bg-muted text-red-800' :
                            'bg-muted text-foreground'
                          }>
                            {company.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-foreground">{company.account_owner || '—'}</td>
                        <td className="p-3 text-sm text-foreground max-w-xs truncate">{company.notes || '—'}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditCompany(company)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleDeleteCompany(company.id)}>
                              <Trash2 className="w-3 h-3 text-foreground" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {companies.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No companies yet. Add your first company or upload a CSV file.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Deals Tab */}
      {activeTab === 'deals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Deals</h3>
            <Button onClick={() => { resetDealForm(); setIsDealModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Deal
            </Button>
          </div>

          <div className="space-y-4">
            {deals.map(deal => {
              const contact = contacts.find(c => c.id === deal.contact_id);
              return (
                <Card key={deal.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-semibold text-lg">{deal.name}</h4>
                          {getStageBadge(deal.stage)}
                        </div>
                        {contact && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Contact: {contact.first_name} {contact.last_name}
                          </p>
                        )}
                        {deal.description && (
                          <p className="text-sm text-muted-foreground mt-2">{deal.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">${deal.value.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground mt-1">{deal.probability}% probability</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Activities Tab */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Activities</h3>
            <Button onClick={() => { resetActivityForm(); setIsActivityModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </Button>
          </div>

          <div className="space-y-3">
            {activities.map(activity => {
              const contact = contacts.find(c => c.id === activity.contact_id);
              return (
                <Card key={activity.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.completed ? 'bg-muted' : 'bg-muted'
                        }`}>
                          {activity.completed ? (
                            <CheckCircle className="w-5 h-5 text-foreground" />
                          ) : (
                            <Clock className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{activity.type}</Badge>
                            <h4 className="font-semibold">{activity.subject}</h4>
                          </div>
                          {activity.description && (
                            <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                          )}
                          {contact && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Contact: {contact.first_name} {contact.last_name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Log Tab */}
      {activeTab === 'activity-log' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Activity Log</h3>
            <p className="text-sm text-muted-foreground">Team activity across all CRM entities</p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted">
                      <th className="text-left p-3 font-semibold text-foreground">Timestamp</th>
                      <th className="text-left p-3 font-semibold text-foreground">User</th>
                      <th className="text-left p-3 font-semibold text-foreground">Action</th>
                      <th className="text-left p-3 font-semibold text-foreground">Entity Type</th>
                      <th className="text-left p-3 font-semibold text-foreground">Entity Name</th>
                      <th className="text-left p-3 font-semibold text-foreground">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activityLogs.map((log) => {
                      const timestamp = new Date(log.timestamp);
                      const timeAgo = (() => {
                        const seconds = Math.floor((new Date() - timestamp) / 1000);
                        if (seconds < 60) return `${seconds}s ago`;
                        const minutes = Math.floor(seconds / 60);
                        if (minutes < 60) return `${minutes}m ago`;
                        const hours = Math.floor(minutes / 60);
                        if (hours < 24) return `${hours}h ago`;
                        const days = Math.floor(hours / 24);
                        return `${days}d ago`;
                      })();

                      return (
                        <tr key={log.id} className="border-b hover:bg-muted">
                          <td className="p-3">
                            <div className="text-sm text-foreground">
                              {timestamp.toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">{timeAgo}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-sm font-medium text-foreground">{log.user_name}</div>
                            <div className="text-xs text-muted-foreground">{log.user_email}</div>
                          </td>
                          <td className="p-3">
                            <Badge className={
                              log.action === 'created' ? 'bg-muted text-foreground' :
                              log.action === 'updated' ? 'bg-muted text-foreground' :
                              log.action === 'deleted' ? 'bg-muted text-red-800' :
                              'bg-muted text-foreground'
                            }>
                              {log.action}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="capitalize">
                              {log.entity_type}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm font-medium text-foreground">
                            {log.entity_name}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {log.details && (
                              <div className="space-y-1">
                                {Object.entries(log.details).map(([key, value]) => (
                                  value && (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium">{key}:</span> {value}
                                    </div>
                                  )
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {activityLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No activity logs yet. Actions performed on contacts, companies, and deals will appear here.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact Modal */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add New Contact'}</DialogTitle>
            <DialogDescription>
              {editingContact ? 'Update contact information' : 'Create a new contact in your CRM'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={contactForm.first_name}
                onChange={(e) => setContactForm({ ...contactForm, first_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={contactForm.last_name}
                onChange={(e) => setContactForm({ ...contactForm, last_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Company</Label>
              <Input
                value={contactForm.company}
                onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Position</Label>
              <Input
                value={contactForm.position}
                onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Phone#</Label>
              <Input
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Ext</Label>
              <Input
                value={contactForm.ext}
                onChange={(e) => setContactForm({ ...contactForm, ext: e.target.value })}
                placeholder="1234"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input
                value={contactForm.address}
                onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                placeholder="123 Main Street"
                className="mt-1"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={contactForm.city}
                onChange={(e) => setContactForm({ ...contactForm, city: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={contactForm.state}
                onChange={(e) => setContactForm({ ...contactForm, state: e.target.value })}
                placeholder="CA"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={contactForm.status} onValueChange={(val) => setContactForm({ ...contactForm, status: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cold_lead">Cold Lead</SelectItem>
                  <SelectItem value="hot_lead">Hot Lead</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <textarea
                value={contactForm.notes}
                onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md min-h-[80px]"
                placeholder="Add any notes about this contact..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsContactModalOpen(false); resetContactForm(); }}>
              Cancel
            </Button>
            <Button onClick={editingContact ? handleUpdateContact : handleCreateContact}>
              {editingContact ? 'Update' : 'Create'} Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deal Modal */}
      <Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
            <DialogDescription>Create a new deal in your pipeline</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Deal Name *</Label>
              <Input
                value={dealForm.name}
                onChange={(e) => setDealForm({ ...dealForm, name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Value ($) *</Label>
                <Input
                  type="number"
                  value={dealForm.value}
                  onChange={(e) => setDealForm({ ...dealForm, value: parseFloat(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Probability (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={dealForm.probability}
                  onChange={(e) => setDealForm({ ...dealForm, probability: parseInt(e.target.value) || 50 })}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label>Stage</Label>
              <Select value={dealForm.stage} onValueChange={(val) => setDealForm({ ...dealForm, stage: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospecting">Prospecting</SelectItem>
                  <SelectItem value="qualification">Qualification</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="negotiation">Negotiation</SelectItem>
                  <SelectItem value="closed_won">Closed Won</SelectItem>
                  <SelectItem value="closed_lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Contact</Label>
              <Select value={dealForm.contact_id} onValueChange={(val) => setDealForm({ ...dealForm, contact_id: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={dealForm.description}
                onChange={(e) => setDealForm({ ...dealForm, description: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDealModalOpen(false); resetDealForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateDeal}>Create Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Activity Modal */}
      <Dialog open={isActivityModalOpen} onOpenChange={setIsActivityModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Activity</DialogTitle>
            <DialogDescription>Log an activity or create a task</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Type</Label>
              <Select value={activityForm.type} onValueChange={(val) => setActivityForm({ ...activityForm, type: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject *</Label>
              <Input
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Related Contact</Label>
              <Select value={activityForm.contact_id} onValueChange={(val) => setActivityForm({ ...activityForm, contact_id: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select contact (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsActivityModalOpen(false); resetActivityForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateActivity}>Create Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Company Modal */}
      <Dialog open={isCompanyModalOpen} onOpenChange={setIsCompanyModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
            <DialogDescription>
              {editingCompany ? 'Update company information' : 'Create a new company in your CRM'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2">
              <Label>Company Name *</Label>
              <Input
                value={companyForm.company_name}
                onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Industry</Label>
              <Input
                value={companyForm.industry}
                onChange={(e) => setCompanyForm({ ...companyForm, industry: e.target.value })}
                placeholder="e.g., Transportation, Technology"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={companyForm.website}
                onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                placeholder="https://example.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={companyForm.phone}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                placeholder="(555) 123-4567"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={companyForm.email}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input
                value={companyForm.address}
                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                placeholder="123 Business Blvd, Suite 100"
                className="mt-1"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={companyForm.city}
                onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={companyForm.state}
                onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                placeholder="CA"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Zip Code</Label>
              <Input
                value={companyForm.zip_code}
                onChange={(e) => setCompanyForm({ ...companyForm, zip_code: e.target.value })}
                placeholder="12345"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={companyForm.country}
                onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                placeholder="USA"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Employee Count</Label>
              <Input
                type="number"
                value={companyForm.employee_count}
                onChange={(e) => setCompanyForm({ ...companyForm, employee_count: e.target.value })}
                placeholder="50"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Annual Revenue ($)</Label>
              <Input
                type="number"
                value={companyForm.annual_revenue}
                onChange={(e) => setCompanyForm({ ...companyForm, annual_revenue: e.target.value })}
                placeholder="1000000"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Company Type</Label>
              <Select value={companyForm.company_type} onValueChange={(val) => setCompanyForm({ ...companyForm, company_type: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="partner">Partner</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={companyForm.status} onValueChange={(val) => setCompanyForm({ ...companyForm, status: val })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="churned">Churned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parent Company</Label>
              <Input
                value={companyForm.parent_company}
                onChange={(e) => setCompanyForm({ ...companyForm, parent_company: e.target.value })}
                placeholder="For subsidiaries"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Account Owner</Label>
              <Input
                value={companyForm.account_owner}
                onChange={(e) => setCompanyForm({ ...companyForm, account_owner: e.target.value })}
                placeholder="Name of account manager"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Founded Date</Label>
              <Input
                type="date"
                value={companyForm.founded_date}
                onChange={(e) => setCompanyForm({ ...companyForm, founded_date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Customer Since</Label>
              <Input
                type="date"
                value={companyForm.customer_since}
                onChange={(e) => setCompanyForm({ ...companyForm, customer_since: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>LinkedIn URL</Label>
              <Input
                value={companyForm.linkedin_url}
                onChange={(e) => setCompanyForm({ ...companyForm, linkedin_url: e.target.value })}
                placeholder="https://linkedin.com/company/..."
                className="mt-1"
              />
            </div>
            <div>
              <Label>Twitter Handle</Label>
              <Input
                value={companyForm.twitter_handle}
                onChange={(e) => setCompanyForm({ ...companyForm, twitter_handle: e.target.value })}
                placeholder="@company"
                className="mt-1"
              />
            </div>
            <div className="col-span-2">
              <Label>Notes</Label>
              <textarea
                value={companyForm.notes}
                onChange={(e) => setCompanyForm({ ...companyForm, notes: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md min-h-[80px]"
                placeholder="Add any notes about this company..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCompanyModalOpen(false); resetCompanyForm(); }}>
              Cancel
            </Button>
            <Button onClick={editingCompany ? handleUpdateCompany : handleCreateCompany}>
              {editingCompany ? 'Update' : 'Create'} Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CRMView;
