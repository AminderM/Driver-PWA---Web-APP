import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const CompanyProfileInner = () => {
  const { user, fetchWithAuth } = useAuth();
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeView, setActiveView] = useState('users');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showAddDriverDialog, setShowAddDriverDialog] = useState(false);
  const [showEditDriverDialog, setShowEditDriverDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [newUserData, setNewUserData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'dispatcher',
    password: ''
  });
  const [newDriverData, setNewDriverData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });
  
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const isAdmin = user?.role === 'fleet_owner';

  useEffect(() => {
    loadCompanyProfile();
    loadCompanyUsers();
    loadDrivers();
  }, []);


  // Theme handler effect (must be registered before any early returns)
  useEffect(() => {
    function handleApplyTheme() {
      if (!company?.logo_url) return;
      (async () => {
        try {
          const VibrantMod = await import('node-vibrant');
          const Vibrant = VibrantMod.default || VibrantMod;
          const palette = await Vibrant.from(company.logo_url).getPalette();
          const colordMod = await import('colord');
          const mixMod = await import('colord/plugins/mix');
          const labMod = await import('colord/plugins/lab');
          const { colord, extend } = colordMod;
          extend([mixMod.default || mixMod, labMod.default || labMod]);

          const ensureContrast = (bgHex, fgHex, minRatio = 4.5) => {
            let fg = colord(fgHex);
            const bg = colord(bgHex);
            if (!bg.isValid()) return fgHex;
            if (!fg.isValid()) fg = colord('#111111');
            let adjusted = fg;
            const isBgDark = bg.isDark();
            for (let i = 0; i < 20 && adjusted.contrast(bg) < minRatio; i++) {
              adjusted = isBgDark ? adjusted.lighten(0.05) : adjusted.darken(0.05);
            }
            if (adjusted.contrast(bg) >= minRatio) return adjusted.toHex();
            return isBgDark ? '#FFFFFF' : '#111111';
          };

          const primaryHex = palette.Vibrant?.hex || palette.Muted?.hex || '#2563eb';
          const secondaryHex = palette.LightVibrant?.hex || colord(primaryHex).mix('#ffffff', 0.7).toHex();
          const accentHex = palette.DarkVibrant?.hex || colord(primaryHex).mix('#000000', 0.7).toHex();

          const toVar = (hex) => {
            const hsl = colord(hex).toHsl();
            return `${hsl.h} ${hsl.s}% ${hsl.l}%`;
          };

          const vars = {
            '--primary': toVar(primaryHex),
            '--primary-foreground': toVar(ensureContrast(primaryHex, '#ffffff')),
            '--secondary': toVar(secondaryHex),
            '--secondary-foreground': toVar(ensureContrast(secondaryHex, '#0a0a0a')),
            '--accent': toVar(accentHex),
            '--accent-foreground': toVar(ensureContrast(accentHex, '#ffffff')),
            '--ring': toVar(primaryHex),
          };

          Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));

          const res = await fetchWithAuth(`${BACKEND_URL}/api/companies/my`, {
            method: 'PUT',
            body: JSON.stringify({ theme: vars })
          });
          if (res.ok) {
            toast.success('Brand theme applied');
            loadCompanyProfile();
          } else {
            const err = await res.json();
            toast.error(err.detail || 'Failed to save theme');
          }
        } catch (e) {
          console.error('Theme apply error', e);
          toast.error('Failed to adapt theme from logo');
        }
      })();
    }

    window.addEventListener('tc:applyThemeFromLogo', handleApplyTheme);
    return () => window.removeEventListener('tc:applyThemeFromLogo', handleApplyTheme);
  }, [company, BACKEND_URL, fetchWithAuth]);

  const loadCompanyProfile = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/companies/my`);
      if (response.ok) {
        const data = await response.json();
        setCompany(data);
        setFormData(data);
      }
    } catch (error) {
      console.error('Error loading company:', error);
      toast.error('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyUsers = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/users/company`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadDrivers = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/drivers/my`);
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveCompany = async () => {
    if (!isAdmin) {
      toast.error('Only admins can edit company profile');
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/companies/my`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updated = await response.json();
        setCompany(updated);
        setIsEditing(false);
        toast.success('Company profile updated successfully');
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update company');
      }
    } catch (error) {
      toast.error('Error updating company');
    }
  };

  const handleLogoUpload = async (event) => {
    if (!isAdmin) {
      toast.error('Only admins can upload logo');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${BACKEND_URL}/api/companies/my/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setCompany(prev => ({ ...prev, logo_url: result.logo_url }));
        toast.success('Logo uploaded successfully');
        loadCompanyProfile();
        // Auto-trigger brand theme adaptation after successful logo upload
        window.dispatchEvent(new CustomEvent('tc:applyThemeFromLogo'));
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to upload logo');
      }
    } catch (error) {
      toast.error('Error uploading logo');
    }
  };

  const handleDocumentUpload = async (documentType, event) => {
    if (!isAdmin) {
      toast.error('Only admins can upload documents');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    // Check file size (10MB limit)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error(`File size exceeds 10MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `${BACKEND_URL}/api/companies/my/upload-document?document_type=${documentType}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        }
      );

      if (response.ok) {
        toast.success('Document uploaded successfully');
        loadCompanyProfile();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to upload document');
      }
    } catch (error) {
      toast.error('Error uploading document');
    }
  };

  const handleAddUser = async () => {
    if (!newUserData.full_name || !newUserData.email || !newUserData.phone || !newUserData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/users`, {
        method: 'POST',
        body: JSON.stringify(newUserData)
      });

      if (response.ok) {
        toast.success('User added successfully');
        setShowAddUserDialog(false);
        setNewUserData({ full_name: '', email: '', phone: '', role: 'dispatcher', password: '' });
        loadCompanyUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to add user');
      }
    } catch (error) {
      toast.error('Error adding user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!isAdmin) {
      toast.error('Only admins can delete users');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/users/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        loadCompanyUsers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    }
  };

  const handleAddDriver = async () => {
    if (!newDriverData.full_name || !newDriverData.email || !newDriverData.phone || !newDriverData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const driverPayload = {
        ...newDriverData,
        role: 'driver'
      };

      const response = await fetchWithAuth(`${BACKEND_URL}/api/drivers`, {
        method: 'POST',
        body: JSON.stringify(driverPayload)
      });

      if (response.ok) {
        toast.success('Driver added successfully');
        setShowAddDriverDialog(false);
        setNewDriverData({ full_name: '', email: '', phone: '', password: '' });
        loadDrivers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to add driver');
      }
    } catch (error) {
      toast.error('Error adding driver');
    }
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
    setShowEditDriverDialog(true);
  };

  const handleUpdateDriver = async () => {
    if (!editingDriver) return;

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/drivers/${editingDriver.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: editingDriver.full_name,
          email: editingDriver.email,
          phone: editingDriver.phone,
          role: 'driver'
        })
      });

      if (response.ok) {
        toast.success('Driver updated successfully');
        setShowEditDriverDialog(false);
        setEditingDriver(null);
        loadDrivers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to update driver');
      }
    } catch (error) {
      toast.error('Error updating driver');
    }
  };

  const handleDeleteDriver = async (driverId) => {
    if (!isAdmin) {
      toast.error('Only admins can delete drivers');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this driver?')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/drivers/${driverId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Driver deleted successfully');
        loadDrivers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to delete driver');
      }
    } catch (error) {
      toast.error('Error deleting driver');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRole = (role) => {
    const roleMap = {
      'fleet_owner': 'Fleet Owner',
      'dispatcher': 'Dispatcher',
      'accounts_receivable': 'Accounts Receivable',
      'accounts_payable': 'Accounts Payable',
      'hr': 'HR',
      'manufacturer': 'Manufacturer',
      'construction_company': 'Construction Company',
      'warehouse': 'Warehouse',
      'driver': 'Driver'
    };
    return roleMap[role] || role;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }


  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No company profile found</p>
      </div>
    );
  }

  return (

    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Company Profile</h2>
          <p className="text-gray-600">Manage your company information and team</p>
        </div>
      </div>

      {/* Split View Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT SIDEBAR - Company Info (Always Visible) */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Company Information</CardTitle>
                {isAdmin && !isEditing && (
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-24 h-24 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="Company Logo" className="w-full h-full object-contain" />
                  ) : (
                    <i className="fas fa-building text-3xl text-gray-400"></i>
                  )}
                </div>
                {isAdmin && (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button size="sm" variant="outline" onClick={() => document.getElementById('logo-upload').click()}>
                      <i className="fas fa-upload mr-1 text-xs"></i>
                      Upload Logo
                {/* Gate docs_versioning panel elsewhere; this section is only brand theming */}

                    </Button>
                  </div>
                )}

              {/* Theme Preview and Actions */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-500">Brand Theme</Label>
                  {company.theme ? (
                    <span className="text-xs text-gray-500">Applied</span>
                  ) : (
                    <span className="text-xs text-gray-400">Default</span>
                  )}
                </div>
                {company.theme && (
                  <div className="flex items-center gap-2">
                    {Object.entries(company.theme).slice(0,6).map(([k,v]) => (
                      <div key={k} className="w-6 h-6 rounded border" style={{ backgroundColor: `hsl(${v})` }} title={k}></div>
                    ))}
                  </div>
                )}
                {/* Gate brand theming under feature flag */}

                {isAdmin && company.logo_url && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.dispatchEvent(new CustomEvent('tc:applyThemeFromLogo'))}>
                      <i className="fas fa-palette mr-1"></i>
                      Adapt from Logo
                    </Button>
                    {company.theme && (
                      <Button size="sm" variant="ghost" onClick={async () => {
                        // Reset to defaults by clearing theme field
                        try {
                          const response = await fetchWithAuth(`${BACKEND_URL}/api/companies/my`, {
                            method: 'PUT',
                            body: JSON.stringify({ theme: null })
                          });
                          if (response.ok) {
                            toast.success('Theme reset to default');
                            // reset CSS vars by removing inline styles for vars we set
                            Object.keys(company.theme || {}).forEach(k => document.documentElement.style.removeProperty(k));
                            loadCompanyProfile();
                          } else {
                            const err = await response.json();
                            toast.error(err.detail || 'Failed to reset theme');
                          }
                        } catch(e) {
                          toast.error('Error resetting theme');
                        }
                      }}>
                        <i className="fas fa-undo mr-1"></i>
                        Reset Theme
                      </Button>
                    )}
                  </div>
                )}
              </div>

              </div>

              {/* Company Details */}
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <Label className="text-xs text-gray-500">Company Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-semibold text-sm mt-1">{company.name}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Company Type</Label>
                  <p className="text-sm mt-1 capitalize">{company.company_type?.replace('_', ' ')}</p>
                </div>

                <div>
                  <Label className="text-xs text-gray-500">MC Number</Label>
                  {isEditing ? (
                    <Input
                      value={formData.mc_number || ''}
                      onChange={(e) => handleInputChange('mc_number', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{company.mc_number || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500">DOT Number</Label>
                  {isEditing ? (
                    <Input
                      value={formData.dot_number || ''}
                      onChange={(e) => handleInputChange('dot_number', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{company.dot_number || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500">NSC Number</Label>
                  {isEditing ? (
                    <Input
                      value={formData.nsc_number || ''}
                      onChange={(e) => handleInputChange('nsc_number', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{company.nsc_number || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Phone</Label>
                  {isEditing ? (
                    <Input
                      value={formData.phone_number || ''}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{company.phone_number || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Company Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.company_email || ''}
                      onChange={(e) => handleInputChange('company_email', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">{company.company_email || 'N/A'}</p>
                  )}
                </div>

                <div>
                  <Label className="text-xs text-gray-500">Website</Label>
                  {isEditing ? (
                    <Input
                      value={formData.website || ''}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm mt-1">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-foreground hover:underline">
                          {company.website}
                        </a>
                      ) : 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button size="sm" variant="outline" onClick={() => {
                    setIsEditing(false);
                    setFormData(company);
                  }} className="flex-1">
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveCompany} className="flex-1">
                    <i className="fas fa-save mr-1"></i>
                    Save
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL - Switchable Views */}
        <div className="lg:col-span-2">
          {/* View Selector */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeView === 'users' ? 'default' : 'outline'}
              onClick={() => setActiveView('users')}
              className="flex-1"
            >
              <i className="fas fa-users mr-2"></i>
              Users
            </Button>
            <Button
              variant={activeView === 'drivers' ? 'default' : 'outline'}
              onClick={() => setActiveView('drivers')}
              className="flex-1"
            >
              <i className="fas fa-id-card mr-2"></i>
              Drivers
            </Button>
            <Button
              variant={activeView === 'documents' ? 'default' : 'outline'}
              onClick={() => setActiveView('documents')}
              className="flex-1"
            >
              <i className="fas fa-file-alt mr-2"></i>
              Documents
            </Button>
          </div>

          {/* Users View */}
          {activeView === 'users' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Company Users</CardTitle>
                    <CardDescription>Manage user accounts and permissions</CardDescription>
                  </div>
                  {isAdmin && (
                    <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <i className="fas fa-plus mr-2"></i>
                          Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Full Name *</Label>
                            <Input
                              value={newUserData.full_name}
                              onChange={(e) => setNewUserData(prev => ({ ...prev, full_name: e.target.value }))}
                              placeholder="Enter full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input
                              type="email"
                              value={newUserData.email}
                              onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="Enter email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone *</Label>
                            <Input
                              value={newUserData.phone}
                              onChange={(e) => setNewUserData(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Role *</Label>
                            <Select value={newUserData.role} onValueChange={(value) => setNewUserData(prev => ({ ...prev, role: value }))}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dispatcher">Dispatcher</SelectItem>
                                <SelectItem value="driver">Driver</SelectItem>
                                <SelectItem value="accounts_receivable">Accounts Receivable</SelectItem>
                                <SelectItem value="accounts_payable">Accounts Payable</SelectItem>
                                <SelectItem value="hr">HR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Password *</Label>
                            <Input
                              type="password"
                              value={newUserData.password}
                              onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Enter password"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setShowAddUserDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddUser}>
                              Add User
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-users text-4xl mb-4"></i>
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          {isAdmin && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{user.full_name}</td>
                            <td className="px-4 py-3">{user.email}</td>
                            <td className="px-4 py-3">{formatRole(user.role)}</td>
                            <td className="px-4 py-3">
                              <Badge className="bg-muted text-foreground">Active</Badge>
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-foreground hover:bg-muted"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Drivers View */}
          {activeView === 'drivers' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Company Drivers</CardTitle>
                    <CardDescription>Manage driver accounts and credentials</CardDescription>
                  </div>
                  {isAdmin && (
                    <Dialog open={showAddDriverDialog} onOpenChange={setShowAddDriverDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          <i className="fas fa-plus mr-2"></i>
                          Add Driver
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add New Driver</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Full Name *</Label>
                            <Input
                              value={newDriverData.full_name}
                              onChange={(e) => setNewDriverData(prev => ({ ...prev, full_name: e.target.value }))}
                              placeholder="Enter full name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input
                              type="email"
                              value={newDriverData.email}
                              onChange={(e) => setNewDriverData(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="Enter email"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone *</Label>
                            <Input
                              value={newDriverData.phone}
                              onChange={(e) => setNewDriverData(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="Enter phone number"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Password *</Label>
                            <Input
                              type="password"
                              value={newDriverData.password}
                              onChange={(e) => setNewDriverData(prev => ({ ...prev, password: e.target.value }))}
                              placeholder="Enter password"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setShowAddDriverDialog(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleAddDriver}>
                              Add Driver
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {drivers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-id-card text-4xl mb-4"></i>
                    <p>No drivers found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phone</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          {isAdmin && <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {drivers.map((driver) => (
                          <tr key={driver.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">{driver.full_name}</td>
                            <td className="px-4 py-3">{driver.email || 'N/A'}</td>
                            <td className="px-4 py-3">{driver.phone || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <Badge className="bg-muted text-foreground">Active</Badge>
                            </td>
                            {isAdmin && (
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEditDriver(driver)}>
                                    <i className="fas fa-edit"></i>
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="text-foreground hover:bg-muted"
                                    onClick={() => handleDeleteDriver(driver.id)}
                                  >
                                    <i className="fas fa-trash"></i>
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Edit Driver Dialog */}
          <Dialog open={showEditDriverDialog} onOpenChange={setShowEditDriverDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Driver</DialogTitle>
              </DialogHeader>
              {editingDriver && (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input
                      value={editingDriver.full_name}
                      onChange={(e) => setEditingDriver(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={editingDriver.email}
                      onChange={(e) => setEditingDriver(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone *</Label>
                    <Input
                      value={editingDriver.phone}
                      onChange={(e) => setEditingDriver(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => {
                      setShowEditDriverDialog(false);
                      setEditingDriver(null);
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateDriver}>
                      Update Driver
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Documents View */}
          {activeView === 'documents' && (
            <Card>
              <CardHeader>
                <CardTitle>Company Documents</CardTitle>
                <CardDescription>Upload and manage transportation-specific documents (Max 10MB per file)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* MC/NSC Authority */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">MC/NSC Authority</h3>
                    {company.company_documents?.mc_authority?.length > 0 && (
                      <Badge className="bg-muted text-foreground">
                        <i className="fas fa-check-circle mr-1"></i>
                        {company.company_documents.mc_authority.length} Version(s)
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Motor Carrier or National Safety Code Authority Document</p>
                  
                  {/* Document History */}
                  {company.company_documents?.mc_authority?.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {company.company_documents.mc_authority.map((doc, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{doc.filename}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {formatDate(doc.uploaded_at)} | Size: {formatFileSize(doc.file_size)}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => window.open(doc.url, '_blank')}>
                            <i className="fas fa-download"></i>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isAdmin && (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocumentUpload('mc_authority', e)}
                        className="hidden"
                        id="mc-authority-upload"
                      />
                      <Button variant="outline" onClick={() => document.getElementById('mc-authority-upload').click()}>
                        <i className="fas fa-upload mr-2"></i>
                        Upload New Version
                      </Button>
                    </div>
                  )}
                </div>

                {/* Certificate of Insurance */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">Certificate of Insurance</h3>
                    {company.company_documents?.insurance_certificate?.length > 0 && (
                      <Badge className="bg-muted text-foreground">
                        <i className="fas fa-check-circle mr-1"></i>
                        {company.company_documents.insurance_certificate.length} Version(s)
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Current insurance certificate documentation</p>
                  
                  {/* Document History */}
                  {company.company_documents?.insurance_certificate?.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {company.company_documents.insurance_certificate.map((doc, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{doc.filename}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {formatDate(doc.uploaded_at)} | Size: {formatFileSize(doc.file_size)}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => window.open(doc.url, '_blank')}>
                            <i className="fas fa-download"></i>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isAdmin && (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocumentUpload('insurance_certificate', e)}
                        className="hidden"
                        id="insurance-upload"
                      />
                      <Button variant="outline" onClick={() => document.getElementById('insurance-upload').click()}>
                        <i className="fas fa-upload mr-2"></i>
                        Upload New Version
                      </Button>
                    </div>
                  )}
                </div>

                {/* W-9 */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg">W-9 Form</h3>
                    {company.company_documents?.w9?.length > 0 && (
                      <Badge className="bg-muted text-foreground">
                        <i className="fas fa-check-circle mr-1"></i>
                        {company.company_documents.w9.length} Version(s)
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-3">Request for Taxpayer Identification Number and Certification</p>
                  
                  {/* Document History */}
                  {company.company_documents?.w9?.length > 0 && (
                    <div className="mb-3 space-y-2">
                      {company.company_documents.w9.map((doc, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{doc.filename}</p>
                            <p className="text-xs text-gray-500">
                              Uploaded: {formatDate(doc.uploaded_at)} | Size: {formatFileSize(doc.file_size)}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => window.open(doc.url, '_blank')}>
                            <i className="fas fa-download"></i>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {isAdmin && (
                    <div>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleDocumentUpload('w9', e)}
                        className="hidden"
                        id="w9-upload"
                      />
                      <Button variant="outline" onClick={() => document.getElementById('w9-upload').click()}>
                        <i className="fas fa-upload mr-2"></i>
                        Upload New Version
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// moved to the bottom with ErrorBoundary wrapper

// Wrapper to catch any unexpected runtime errors in CompanyProfileInner
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('CompanyProfile error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-foreground">
          <p className="font-semibold">Something went wrong in Company Profile.</p>
          <p className="text-sm mt-2">{String(this.state.error)}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const CompanyProfile = (props) => (
  <ErrorBoundary>
    <CompanyProfileInner {...props} />
  </ErrorBoundary>
);

export default CompanyProfile;

