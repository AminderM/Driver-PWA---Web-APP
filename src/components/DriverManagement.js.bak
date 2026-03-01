import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const DriverManagement = ({ onStatsUpdate }) => {
  const { user, fetchWithAuth } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'tile' - default set to list
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeManagementTab, setActiveManagementTab] = useState('fleet');
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loads, setLoads] = useState([]);
  const [showAssignLoadDialog, setShowAssignLoadDialog] = useState(false);
  const [selectedDriverForLoad, setSelectedDriverForLoad] = useState(null);
  const [selectedLoad, setSelectedLoad] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadDrivers();
    loadPendingDrivers();
    loadAvailableLoads();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/drivers/my`);
      if (response.ok) {
        const data = await response.json();
        setDrivers(data);
        // Update stats
        if (onStatsUpdate) {
          onStatsUpdate(prev => ({ ...prev, totalDrivers: data.length }));
        }
      }
    } catch (error) {
      toast.error('Error loading drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/drivers`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Driver account created successfully!');
        setShowAddForm(false);
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          password: ''
        });
        loadDrivers();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create driver account');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
    toast.success('Password generated!');
  };

  const handleEditDriver = (driver) => {
    toast.info(`Edit driver: ${driver.full_name} (feature coming soon)`);
    // TODO: Implement edit driver functionality
  };

  const handleTrackDriver = (driver) => {
    toast.info(`Track driver: ${driver.full_name} (feature coming soon)`);
    // TODO: Implement driver tracking functionality
  };

  const handleDeleteDriver = async (driver) => {
    if (!confirm(`Are you sure you want to delete driver ${driver.full_name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/drivers/${driver.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Driver deleted successfully');
        loadDrivers();
      } else {
        toast.error('Failed to delete driver');
      }
    } catch (error) {
      toast.error('Error deleting driver');
    }
  };

  const loadPendingDrivers = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/users?role=driver&status=pending`);
      if (response.ok) {
        const data = await response.json();
        setPendingDrivers(data.filter(d => d.registration_status === 'pending' && !d.fleet_owner_id));
      }
    } catch (error) {
      console.error('Error loading pending drivers:', error);
    }
  };

  const loadAvailableLoads = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings`);
      if (response.ok) {
        const data = await response.json();
        setLoads(data);
      }
    } catch (error) {
      console.error('Error loading loads:', error);
    }
  };

  const handleApproveDriver = async (driverId) => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/admin/users/${driverId}/verify`, {
        method: 'PUT'
      });
      if (response.ok) {
        toast.success('Driver approved successfully!');
        loadPendingDrivers();
        loadDrivers();
      } else {
        toast.error('Failed to approve driver');
      }
    } catch (error) {
      toast.error('Error approving driver');
    }
  };

  const handleRejectDriver = async (driverId) => {
    if (!confirm('Are you sure you want to reject this driver application?')) {
      return;
    }
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/users/${driverId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('Driver application rejected');
        loadPendingDrivers();
      } else {
        toast.error('Failed to reject driver');
      }
    } catch (error) {
      toast.error('Error rejecting driver');
    }
  };

  const handleAssignLoad = async () => {
    if (!selectedLoad || !selectedDriverForLoad) {
      toast.error('Please select a load to assign');
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings/${selectedLoad}`, {
        method: 'PUT',
        body: JSON.stringify({
          driver_id: selectedDriverForLoad.id,
          driver_name: selectedDriverForLoad.full_name,
          status: 'pending'
        })
      });

      if (response.ok) {
        toast.success('Load assigned successfully!');
        setShowAssignLoadDialog(false);
        setSelectedLoad('');
        loadAvailableLoads();
      } else {
        toast.error('Failed to assign load');
      }
    } catch (error) {
      toast.error('Error assigning load');
    }
  };

  const filteredDrivers = drivers.filter(driver => 
    driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone.includes(searchTerm)
  );

  if (loading && drivers.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Driver Management</h2>
        <p className="text-gray-600">
          Manage fleet drivers, approve signups, and assign loads
        </p>
      </div>

      {/* Management Tabs */}
      <Tabs value={activeManagementTab} onValueChange={setActiveManagementTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="fleet">
            <i className="fas fa-users mr-2"></i>
            Fleet Drivers ({drivers.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            <i className="fas fa-clock mr-2"></i>
            Pending Approvals ({pendingDrivers.length})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <i className="fas fa-truck-loading mr-2"></i>
            Load Assignments
          </TabsTrigger>
        </TabsList>

        {/* Fleet Drivers Tab */}
        <TabsContent value="fleet" className="space-y-6 mt-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Your Fleet Drivers</h3>
          <p className="text-sm text-gray-600">
            Drivers you've added to your fleet
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-r-none"
            >
              <i className="fas fa-list mr-2"></i>
              List
            </Button>
            <Button
              variant={viewMode === 'tile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tile')}
              className="rounded-l-none"
            >
              <i className="fas fa-th-large mr-2"></i>
              Tile
            </Button>
          </div>
          
          {/* Add Driver Button */}
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="add-driver-btn">
                <i className="fas fa-user-plus mr-2"></i>
                Add Driver
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Driver</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  placeholder="Enter driver's full name"
                  required
                  data-testid="driver-name-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter driver's email"
                  required
                  data-testid="driver-email-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Enter driver's phone"
                  required
                  data-testid="driver-phone-input"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="flex space-x-2">
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password"
                    required
                    data-testid="driver-password-input"
                  />
                  <Button 
                    type="button" 
                    onClick={generatePassword}
                    variant="outline"
                    size="sm"
                    data-testid="generate-password-btn"
                  >
                    Generate
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  The driver will use this password to login to their mobile app
                </p>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  data-testid="cancel-add-driver-btn"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  data-testid="save-driver-btn"
                >
                  {loading ? 'Creating...' : 'Create Driver Account'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search drivers by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            data-testid="driver-search-input"
          />
        </div>
      </div>

      {/* Drivers Grid */}
      {filteredDrivers.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 text-5xl mb-4">
              <i className="fas fa-users"></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Drivers Added Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create driver accounts to allow your drivers to use the mobile app for real-time tracking and updates.
            </p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="btn-primary"
              data-testid="add-first-driver-btn"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Add Your First Driver
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        // List View - Table
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Driver</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Joined</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50" data-testid={`driver-row-${driver.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold mr-3">
                            {driver.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold">{driver.full_name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="fas fa-envelope mr-2"></i>
                          {driver.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <i className="fas fa-phone mr-2"></i>
                          {driver.phone}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="status-verified">
                          Active Driver
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(driver.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditDriver(driver)}
                            title="Edit Driver"
                            data-testid={`edit-driver-btn-${driver.id}`}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleTrackDriver(driver)}
                            title="Track Driver"
                            data-testid={`track-driver-btn-${driver.id}`}
                          >
                            <i className="fas fa-map-marker-alt"></i>
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteDriver(driver)}
                            title="Delete Driver"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`delete-driver-btn-${driver.id}`}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Tile View - Cards
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <Card key={driver.id} className="dashboard-card" data-testid={`driver-card-${driver.id}`}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {driver.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900" data-testid={`driver-name-${driver.id}`}>
                      {driver.full_name}
                    </h3>
                    <Badge className="status-verified text-xs">
                      Active Driver
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-envelope w-4 mr-2"></i>
                    {driver.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-phone w-4 mr-2"></i>
                    {driver.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <i className="fas fa-calendar w-4 mr-2"></i>
                    Joined {new Date(driver.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    size="sm"
                    onClick={() => handleEditDriver(driver)}
                    data-testid={`edit-driver-btn-${driver.id}`}
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    size="sm"
                    onClick={() => handleTrackDriver(driver)}
                    data-testid={`track-driver-btn-${driver.id}`}
                  >
                    <i className="fas fa-map-marker-alt mr-1"></i>
                    Track
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDeleteDriver(driver)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    data-testid={`delete-driver-btn-${driver.id}`}
                  >
                    <i className="fas fa-trash"></i>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Driver Stats */}
      {drivers.length > 0 && (
        <Card className="dashboard-card">
          <CardHeader>
            <CardTitle>Driver Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{drivers.length}</div>
                <div className="text-sm text-gray-600">Total Drivers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {drivers.filter(d => d.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Active Drivers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-sm text-gray-600">Drivers On Duty</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriverManagement;