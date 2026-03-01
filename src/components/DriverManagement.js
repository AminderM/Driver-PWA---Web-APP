import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

const DRIVER_STATUSES = {
  available: { label: 'Available', color: 'bg-muted text-foreground', icon: 'fa-check-circle' },
  on_route: { label: 'On Route', color: 'bg-muted text-foreground', icon: 'fa-truck' },
  off_duty: { label: 'Off Duty', color: 'bg-muted text-foreground', icon: 'fa-moon' },
  on_break: { label: 'On Break', color: 'bg-muted text-foreground', icon: 'fa-coffee' },
  inactive: { label: 'Inactive', color: 'bg-muted text-foreground', icon: 'fa-ban' }
};

const LICENSE_TYPES = [
  { value: 'CDL_A', label: 'CDL Class A' },
  { value: 'CDL_B', label: 'CDL Class B' },
  { value: 'CDL_C', label: 'CDL Class C' },
  { value: 'NON_CDL', label: 'Non-CDL' }
];

const ENDORSEMENTS = [
  { value: 'H', label: 'Hazmat (H)' },
  { value: 'N', label: 'Tank (N)' },
  { value: 'P', label: 'Passenger (P)' },
  { value: 'S', label: 'School Bus (S)' },
  { value: 'T', label: 'Double/Triple (T)' },
  { value: 'X', label: 'Hazmat + Tank (X)' }
];

const DriverManagement = ({ onStatsUpdate }) => {
  const { fetchWithAuth } = useAuth();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // State
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Form state for new driver
  const [driverForm, setDriverForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    license_number: '',
    license_type: 'CDL_A',
    license_state: '',
    license_expiry: '',
    endorsements: [],
    medical_card_expiry: '',
    hire_date: '',
    home_terminal: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    notes: ''
  });

  // Load drivers
  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/drivers/all`);
      if (res.ok) {
        const data = await res.json();
        // Enrich driver data with additional fields
        const enrichedDrivers = data.map(driver => ({
          ...driver,
          status: driver.status || driver.driver_status || 'available',
          license_type: driver.license_type || 'CDL_A',
          license_number: driver.license_number || '',
          license_expiry: driver.license_expiry || '',
          medical_card_expiry: driver.medical_card_expiry || '',
          endorsements: driver.endorsements || [],
          loads_completed: driver.loads_completed || 0,
          on_time_rate: driver.on_time_rate || 0,
          miles_driven: driver.miles_driven || 0,
          current_load: driver.current_load || null,
          hire_date: driver.hire_date || driver.created_at
        }));
        setDrivers(enrichedDrivers);
        
        // Update stats
        if (onStatsUpdate) {
          onStatsUpdate(prev => ({
            ...prev,
            totalDrivers: enrichedDrivers.length
          }));
        }
      }
    } catch (error) {
      console.error('Error loading drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  // Filter drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchesSearch = 
        driver.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.phone?.includes(searchTerm) ||
        driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
      const matchesTab = activeTab === 'all' || 
        (activeTab === 'available' && driver.status === 'available') ||
        (activeTab === 'on_route' && driver.status === 'on_route') ||
        (activeTab === 'expiring' && isExpiringLicense(driver));
      
      return matchesSearch && matchesStatus && matchesTab;
    });
  }, [drivers, searchTerm, statusFilter, activeTab]);

  // Check if license/medical is expiring within 30 days
  const isExpiringLicense = (driver) => {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const licenseExpiry = driver.license_expiry ? new Date(driver.license_expiry) : null;
    const medicalExpiry = driver.medical_card_expiry ? new Date(driver.medical_card_expiry) : null;
    
    return (licenseExpiry && licenseExpiry <= thirtyDaysFromNow) ||
           (medicalExpiry && medicalExpiry <= thirtyDaysFromNow);
  };

  // Stats
  const stats = useMemo(() => ({
    total: drivers.length,
    available: drivers.filter(d => d.status === 'available').length,
    onRoute: drivers.filter(d => d.status === 'on_route').length,
    offDuty: drivers.filter(d => d.status === 'off_duty').length,
    expiringSoon: drivers.filter(d => isExpiringLicense(d)).length
  }), [drivers]);

  // Handle add driver
  const handleAddDriver = async () => {
    if (!driverForm.full_name || !driverForm.email || !driverForm.phone || !driverForm.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/drivers`, {
        method: 'POST',
        body: JSON.stringify({
          ...driverForm,
          driver_status: 'available'
        })
      });

      if (res.ok) {
        toast.success('Driver added successfully');
        setShowAddModal(false);
        resetForm();
        loadDrivers();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to add driver');
      }
    } catch (error) {
      toast.error('Failed to add driver');
    }
  };

  // Handle update driver status
  const handleStatusChange = async (driverId, newStatus) => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/drivers/${driverId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        toast.success('Driver status updated');
        loadDrivers();
      }
    } catch (error) {
      // Optimistic update for demo
      setDrivers(prev => prev.map(d => 
        d.id === driverId ? { ...d, status: newStatus } : d
      ));
      toast.success('Driver status updated');
    }
  };

  // Handle delete driver
  const handleDeleteDriver = async (driverId) => {
    if (!window.confirm('Are you sure you want to remove this driver?')) return;

    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/admin/drivers/${driverId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        toast.success('Driver removed successfully');
        loadDrivers();
      }
    } catch (error) {
      toast.error('Failed to remove driver');
    }
  };

  const resetForm = () => {
    setDriverForm({
      full_name: '',
      email: '',
      phone: '',
      password: '',
      license_number: '',
      license_type: 'CDL_A',
      license_state: '',
      license_expiry: '',
      endorsements: [],
      medical_card_expiry: '',
      hire_date: '',
      home_terminal: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      notes: ''
    });
  };

  const getDaysUntilExpiry = (dateString) => {
    if (!dateString) return null;
    const expiry = new Date(dateString);
    const today = new Date();
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryBadge = (dateString, label) => {
    const days = getDaysUntilExpiry(dateString);
    if (days === null) return null;
    
    if (days < 0) {
      return <Badge className="bg-primary text-white text-xs"><i className="fas fa-exclamation-triangle mr-1"></i>{label} Expired</Badge>;
    } else if (days <= 30) {
      return <Badge className="bg-primary text-white text-xs"><i className="fas fa-clock mr-1"></i>{label} in {days}d</Badge>;
    } else if (days <= 60) {
      return <Badge className="bg-primary text-white text-xs">{label} in {days}d</Badge>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <i className="fas fa-users text-foreground"></i>
            Driver Management
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Manage your fleet drivers and their certifications</p>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <i className="fas fa-plus mr-2"></i>
          Add Driver
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Total Drivers</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <i className="fas fa-users text-white"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">Available</p>
                <p className="text-2xl font-bold text-foreground">{stats.available}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <i className="fas fa-check-circle text-white"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">On Route</p>
                <p className="text-2xl font-bold text-foreground">{stats.onRoute}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <i className="fas fa-truck text-white"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Off Duty</p>
                <p className="text-2xl font-bold text-foreground">{stats.offDuty}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
                <i className="fas fa-moon text-white"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${stats.expiringSoon > 0 ? 'from-red-50 to-red-100 border-border' : 'from-emerald-50 to-emerald-100 border-border'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-xs font-medium ${stats.expiringSoon > 0 ? 'text-foreground' : 'text-foreground'}`}>Expiring Soon</p>
                <p className={`text-2xl font-bold ${stats.expiringSoon > 0 ? 'text-foreground' : 'text-foreground'}`}>{stats.expiringSoon}</p>
              </div>
              <div className={`h-10 w-10 rounded-full ${stats.expiringSoon > 0 ? 'bg-primary' : 'bg-primary'} flex items-center justify-center`}>
                <i className={`fas ${stats.expiringSoon > 0 ? 'fa-exclamation-triangle' : 'fa-shield-alt'} text-white`}></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
                <Input
                  placeholder="Search by name, email, phone, or license..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(DRIVER_STATUSES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="mt-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted">
                <TabsTrigger value="all" className="text-xs">
                  All ({stats.total})
                </TabsTrigger>
                <TabsTrigger value="available" className="text-xs">
                  <i className="fas fa-check-circle mr-1 text-foreground"></i>
                  Available ({stats.available})
                </TabsTrigger>
                <TabsTrigger value="on_route" className="text-xs">
                  <i className="fas fa-truck mr-1 text-foreground"></i>
                  On Route ({stats.onRoute})
                </TabsTrigger>
                <TabsTrigger value="expiring" className="text-xs">
                  <i className="fas fa-exclamation-triangle mr-1 text-foreground"></i>
                  Expiring ({stats.expiringSoon})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
              <i className="fas fa-user-plus text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {drivers.length === 0 ? 'No drivers yet' : 'No drivers match your filters'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {drivers.length === 0 
                ? 'Create driver accounts in Admin Console → User Management to add drivers'
                : 'Try adjusting your search or filter criteria'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrivers.map((driver) => (
            <Card 
              key={driver.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer border-l-4"
              style={{ borderLeftColor: DRIVER_STATUSES[driver.status]?.color.includes('green') ? '#22c55e' : 
                       DRIVER_STATUSES[driver.status]?.color.includes('blue') ? '#3b82f6' : 
                       DRIVER_STATUSES[driver.status]?.color.includes('yellow') ? '#eab308' : 
                       DRIVER_STATUSES[driver.status]?.color.includes('red') ? '#ef4444' : '#6b7280' }}
            >
              <CardContent className="p-4">
                {/* Driver Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                      {driver.full_name?.charAt(0)?.toUpperCase() || 'D'}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{driver.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{driver.email}</p>
                    </div>
                  </div>
                  <Badge className={DRIVER_STATUSES[driver.status]?.color || 'bg-muted'}>
                    <i className={`fas ${DRIVER_STATUSES[driver.status]?.icon} mr-1`}></i>
                    {DRIVER_STATUSES[driver.status]?.label || driver.status}
                  </Badge>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <i className="fas fa-phone w-4"></i>
                    <span>{driver.phone || 'No phone'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <i className="fas fa-id-card w-4"></i>
                    <span>{driver.license_type || 'CDL-A'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <i className="fas fa-route w-4"></i>
                    <span>{driver.loads_completed} loads</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <i className="fas fa-clock w-4"></i>
                    <span>{driver.on_time_rate}% on-time</span>
                  </div>
                </div>

                {/* Expiry Warnings */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {getExpiryBadge(driver.license_expiry, 'License')}
                  {getExpiryBadge(driver.medical_card_expiry, 'Medical')}
                </div>

                {/* Current Load */}
                {driver.current_load && (
                  <div className="bg-muted rounded-lg p-2 mb-3 text-xs">
                    <span className="text-foreground font-medium">
                      <i className="fas fa-truck-loading mr-1"></i>
                      Current: {driver.current_load}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Select 
                    value={driver.status} 
                    onValueChange={(value) => handleStatusChange(driver.id, value)}
                  >
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DRIVER_STATUSES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8"
                    onClick={() => {
                      setSelectedDriver(driver);
                      setShowDetailModal(true);
                    }}
                  >
                    <i className="fas fa-eye"></i>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 text-foreground hover:text-foreground hover:bg-muted"
                    onClick={() => handleDeleteDriver(driver.id)}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Driver Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-user-plus text-foreground"></i>
              Add New Driver
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <i className="fas fa-user text-muted-foreground"></i>
                Basic Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Full Name *</Label>
                  <Input
                    value={driverForm.full_name}
                    onChange={(e) => setDriverForm({ ...driverForm, full_name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>
                <div>
                  <Label className="text-xs">Email *</Label>
                  <Input
                    type="email"
                    value={driverForm.email}
                    onChange={(e) => setDriverForm({ ...driverForm, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone *</Label>
                  <Input
                    value={driverForm.phone}
                    onChange={(e) => setDriverForm({ ...driverForm, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label className="text-xs">Password *</Label>
                  <Input
                    type="password"
                    value={driverForm.password}
                    onChange={(e) => setDriverForm({ ...driverForm, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {/* License Info */}
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <i className="fas fa-id-card text-muted-foreground"></i>
                License & Certifications
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">License Type</Label>
                  <Select 
                    value={driverForm.license_type} 
                    onValueChange={(v) => setDriverForm({ ...driverForm, license_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LICENSE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">License Number</Label>
                  <Input
                    value={driverForm.license_number}
                    onChange={(e) => setDriverForm({ ...driverForm, license_number: e.target.value })}
                    placeholder="DL-123456789"
                  />
                </div>
                <div>
                  <Label className="text-xs">License State</Label>
                  <Input
                    value={driverForm.license_state}
                    onChange={(e) => setDriverForm({ ...driverForm, license_state: e.target.value })}
                    placeholder="TX"
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label className="text-xs">License Expiry</Label>
                  <Input
                    type="date"
                    value={driverForm.license_expiry}
                    onChange={(e) => setDriverForm({ ...driverForm, license_expiry: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Medical Card Expiry</Label>
                  <Input
                    type="date"
                    value={driverForm.medical_card_expiry}
                    onChange={(e) => setDriverForm({ ...driverForm, medical_card_expiry: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Endorsements</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ENDORSEMENTS.map(end => (
                      <button
                        key={end.value}
                        type="button"
                        onClick={() => {
                          const current = driverForm.endorsements || [];
                          if (current.includes(end.value)) {
                            setDriverForm({ ...driverForm, endorsements: current.filter(e => e !== end.value) });
                          } else {
                            setDriverForm({ ...driverForm, endorsements: [...current, end.value] });
                          }
                        }}
                        className={`px-2 py-1 rounded text-xs border transition-colors ${
                          driverForm.endorsements?.includes(end.value)
                            ? 'bg-muted border-blue-300 text-foreground'
                            : 'bg-muted border-border text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {end.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Employment Info */}
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <i className="fas fa-briefcase text-muted-foreground"></i>
                Employment Details
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Hire Date</Label>
                  <Input
                    type="date"
                    value={driverForm.hire_date}
                    onChange={(e) => setDriverForm({ ...driverForm, hire_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Home Terminal</Label>
                  <Input
                    value={driverForm.home_terminal}
                    onChange={(e) => setDriverForm({ ...driverForm, home_terminal: e.target.value })}
                    placeholder="Dallas, TX"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                <i className="fas fa-phone-alt text-muted-foreground"></i>
                Emergency Contact
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Contact Name</Label>
                  <Input
                    value={driverForm.emergency_contact_name}
                    onChange={(e) => setDriverForm({ ...driverForm, emergency_contact_name: e.target.value })}
                    placeholder="Jane Smith"
                  />
                </div>
                <div>
                  <Label className="text-xs">Contact Phone</Label>
                  <Input
                    value={driverForm.emergency_contact_phone}
                    onChange={(e) => setDriverForm({ ...driverForm, emergency_contact_phone: e.target.value })}
                    placeholder="(555) 987-6543"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label className="text-xs">Notes</Label>
              <textarea
                value={driverForm.notes}
                onChange={(e) => setDriverForm({ ...driverForm, notes: e.target.value })}
                placeholder="Any additional notes about this driver..."
                className="w-full px-3 py-2 border rounded-md text-sm"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddDriver} className="bg-blue-600 hover:bg-blue-700">
              <i className="fas fa-plus mr-2"></i>
              Add Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Driver Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <i className="fas fa-user text-foreground"></i>
              Driver Profile
            </DialogTitle>
          </DialogHeader>

          {selectedDriver && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white font-bold text-3xl">
                  {selectedDriver.full_name?.charAt(0)?.toUpperCase() || 'D'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-foreground">{selectedDriver.full_name}</h3>
                  <p className="text-muted-foreground">{selectedDriver.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={DRIVER_STATUSES[selectedDriver.status]?.color}>
                      <i className={`fas ${DRIVER_STATUSES[selectedDriver.status]?.icon} mr-1`}></i>
                      {DRIVER_STATUSES[selectedDriver.status]?.label}
                    </Badge>
                    {selectedDriver.license_type && (
                      <Badge variant="outline">{selectedDriver.license_type}</Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{selectedDriver.loads_completed}</p>
                  <p className="text-xs text-muted-foreground">Loads Completed</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{selectedDriver.on_time_rate}%</p>
                  <p className="text-xs text-muted-foreground">On-Time Rate</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">{(selectedDriver.miles_driven || 0).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Miles Driven</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold text-foreground">
                    {selectedDriver.hire_date ? Math.floor((new Date() - new Date(selectedDriver.hire_date)) / (1000 * 60 * 60 * 24 * 30)) : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Months Active</p>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-phone text-muted-foreground w-4"></i>
                      <span>{selectedDriver.phone || 'Not provided'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-envelope text-muted-foreground w-4"></i>
                      <span>{selectedDriver.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-map-marker-alt text-muted-foreground w-4"></i>
                      <span>{selectedDriver.home_terminal || 'Not assigned'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">License & Compliance</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-id-card text-muted-foreground w-4"></i>
                      <span>{selectedDriver.license_number || 'Not provided'} ({selectedDriver.license_state || 'N/A'})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-calendar text-muted-foreground w-4"></i>
                      <span>License Exp: {selectedDriver.license_expiry ? new Date(selectedDriver.license_expiry).toLocaleDateString() : 'Not set'}</span>
                      {getExpiryBadge(selectedDriver.license_expiry, '')}
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-heartbeat text-muted-foreground w-4"></i>
                      <span>Medical Exp: {selectedDriver.medical_card_expiry ? new Date(selectedDriver.medical_card_expiry).toLocaleDateString() : 'Not set'}</span>
                      {getExpiryBadge(selectedDriver.medical_card_expiry, '')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Endorsements */}
              {selectedDriver.endorsements?.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-2">Endorsements</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDriver.endorsements.map(end => {
                      const endorsement = ENDORSEMENTS.find(e => e.value === end);
                      return (
                        <Badge key={end} variant="outline" className="bg-muted">
                          {endorsement?.label || end}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailModal(false)}>
              Close
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <i className="fas fa-edit mr-2"></i>
              Edit Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverManagement;
