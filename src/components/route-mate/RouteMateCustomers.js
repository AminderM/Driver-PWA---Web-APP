import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Users, Plus, Edit, Trash2, Upload, Download, MapPin, Search } from 'lucide-react';

const RouteMateCustomers = ({ fetchWithAuth, BACKEND_URL }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: 'US',
      geocode: { lat: 0, lng: 0 }
    },
    contact: {
      name: '',
      phone: '',
      email: ''
    },
    service_requirements: {
      average_service_time: 20,
      time_windows: [],
      special_equipment: [],
      access_notes: ''
    },
    business_data: {
      annual_revenue: 0,
      visit_frequency: 'weekly',
      priority: 'medium'
    }
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/route-mate/customers`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (e) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/route-mate/customers`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Customer created!');
        setShowCreateModal(false);
        resetForm();
        loadCustomers();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to create customer');
      }
    } catch (e) {
      toast.error('Failed to create customer');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'US',
        geocode: { lat: 0, lng: 0 }
      },
      contact: {
        name: '',
        phone: '',
        email: ''
      },
      service_requirements: {
        average_service_time: 20,
        time_windows: [],
        special_equipment: [],
        access_notes: ''
      },
      business_data: {
        annual_revenue: 0,
        visit_frequency: 'weekly',
        priority: 'medium'
      }
    });
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-green-100 text-green-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-600 mt-1">Manage customer locations and requirements</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {customers.filter(c => c.business_data?.priority === 'high').length}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Weekly Visits</p>
                <p className="text-2xl font-bold text-green-600">
                  {customers.filter(c => c.business_data?.visit_frequency === 'weekly').length}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-purple-600">
                  {customers.filter(c => c.territory_id).length}
                </p>
              </div>
              <MapPin className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search customers by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Address</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Visit Frequency</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Territory</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-900">{customer.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {customer.address?.street}
                        </div>
                        <div className="text-sm text-gray-600">
                          {customer.address?.city}, {customer.address?.state} {customer.address?.zip}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {customer.contact?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">
                          {customer.contact?.phone || 'No phone'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-900 capitalize">
                          {customer.business_data?.visit_frequency || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(customer.business_data?.priority || 'medium')}`}>
                          {customer.business_data?.priority || 'medium'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-600">
                          {customer.territory_id ? customer.territory_id.substring(0, 8) : 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'No customers found matching your search' : 'No customers added yet'}
              </p>
              {!searchTerm && (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    resetForm();
                    setShowCreateModal(true);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Customer
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Add New Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Customer Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Acme Corporation"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Address</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Street Address *</Label>
                      <Input
                        value={formData.address.street}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, street: e.target.value }
                        })}
                        placeholder="123 Main St"
                        required
                      />
                    </div>
                    <div>
                      <Label>City *</Label>
                      <Input
                        value={formData.address.city}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, city: e.target.value }
                        })}
                        placeholder="New York"
                        required
                      />
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Input
                        value={formData.address.state}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, state: e.target.value }
                        })}
                        placeholder="NY"
                        required
                      />
                    </div>
                    <div>
                      <Label>ZIP Code *</Label>
                      <Input
                        value={formData.address.zip}
                        onChange={(e) => setFormData({
                          ...formData,
                          address: { ...formData.address, zip: e.target.value }
                        })}
                        placeholder="10001"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Contact Name</Label>
                      <Input
                        value={formData.contact.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          contact: { ...formData.contact, name: e.target.value }
                        })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={formData.contact.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          contact: { ...formData.contact, phone: e.target.value }
                        })}
                        placeholder="+1-555-0100"
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.contact.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          contact: { ...formData.contact, email: e.target.value }
                        })}
                        placeholder="john@acme.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Business Data */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Business Information</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Visit Frequency</Label>
                      <Select
                        value={formData.business_data.visit_frequency}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          business_data: { ...formData.business_data, visit_frequency: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Priority</Label>
                      <Select
                        value={formData.business_data.priority}
                        onValueChange={(value) => setFormData({
                          ...formData,
                          business_data: { ...formData.business_data, priority: value }
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Service Time (min)</Label>
                      <Input
                        type="number"
                        value={formData.service_requirements.average_service_time}
                        onChange={(e) => setFormData({
                          ...formData,
                          service_requirements: {
                            ...formData.service_requirements,
                            average_service_time: parseInt(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Add Customer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RouteMateCustomers;
