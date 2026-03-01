import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { MapPin, Plus, Edit, Trash2, Users, TrendingUp, DollarSign, Map as MapIcon } from 'lucide-react';

const RouteMateTerritories = ({ fetchWithAuth, BACKEND_URL }) => {
  const [territories, setTerritories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTerritory, setEditingTerritory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'delivery',
    assigned_to: '',
    target_metrics: {
      stops_per_day: 100,
      max_distance_miles: 200,
      revenue_target: 500000
    }
  });

  useEffect(() => {
    loadTerritories();
  }, []);

  const loadTerritories = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/route-mate/territories`);
      if (res.ok) {
        const data = await res.json();
        setTerritories(data);
      }
    } catch (e) {
      toast.error('Failed to load territories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const url = editingTerritory 
        ? `${BACKEND_URL}/api/route-mate/territories/${editingTerritory.id}`
        : `${BACKEND_URL}/api/route-mate/territories`;
      
      const method = editingTerritory ? 'PUT' : 'POST';
      
      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success(editingTerritory ? 'Territory updated!' : 'Territory created!');
        setShowCreateModal(false);
        setEditingTerritory(null);
        resetForm();
        loadTerritories();
      } else {
        const error = await res.json();
        toast.error(error.detail || 'Failed to save territory');
      }
    } catch (e) {
      toast.error('Failed to save territory');
    }
  };

  const handleDelete = async (territoryId) => {
    if (!window.confirm('Are you sure you want to delete this territory?')) return;

    try {
      const res = await fetchWithAuth(
        `${BACKEND_URL}/api/route-mate/territories/${territoryId}`,
        { method: 'DELETE' }
      );

      if (res.ok) {
        toast.success('Territory deleted!');
        loadTerritories();
      } else {
        toast.error('Failed to delete territory');
      }
    } catch (e) {
      toast.error('Failed to delete territory');
    }
  };

  const handleEdit = (territory) => {
    setEditingTerritory(territory);
    setFormData({
      name: territory.name,
      type: territory.type,
      assigned_to: territory.assigned_to || '',
      target_metrics: territory.target_metrics
    });
    setShowCreateModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'delivery',
      assigned_to: '',
      target_metrics: {
        stops_per_day: 100,
        max_distance_miles: 200,
        revenue_target: 500000
      }
    });
  };

  const getTerritoryTypeColor = (type) => {
    const colors = {
      sales: 'bg-blue-100 text-blue-700',
      service: 'bg-green-100 text-green-700',
      delivery: 'bg-purple-100 text-purple-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getTerritoryStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-700',
      inactive: 'bg-gray-100 text-gray-700',
      draft: 'bg-yellow-100 text-yellow-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
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
          <h2 className="text-3xl font-bold text-gray-900">Territories</h2>
          <p className="text-gray-600 mt-1">Design and manage service territories</p>
        </div>
        <Button 
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => {
            resetForm();
            setEditingTerritory(null);
            setShowCreateModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Territory
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Territories</p>
                <p className="text-2xl font-bold text-gray-900">{territories.length}</p>
              </div>
              <MapPin className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {territories.filter(t => t.status === 'active').length}
                </p>
              </div>
              <MapIcon className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Draft</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {territories.filter(t => t.status === 'draft').length}
                </p>
              </div>
              <Edit className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Assigned</p>
                <p className="text-2xl font-bold text-purple-600">
                  {territories.filter(t => t.assigned_to).length}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Territories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {territories.map((territory) => (
          <Card key={territory.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{territory.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTerritoryTypeColor(territory.type)}`}>
                      {territory.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTerritoryStatusColor(territory.status)}`}>
                      {territory.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(territory)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDelete(territory.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Target Metrics */}
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Stops/Day Target</span>
                  <span className="font-medium text-gray-900">
                    {territory.target_metrics?.stops_per_day || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Max Distance</span>
                  <span className="font-medium text-gray-900">
                    {territory.target_metrics?.max_distance_miles || 0} mi
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Revenue Target</span>
                  <span className="font-medium text-gray-900">
                    ${((territory.target_metrics?.revenue_target || 0) / 1000).toFixed(0)}K
                  </span>
                </div>
              </div>

              {/* Assigned To */}
              <div className="flex items-center space-x-2 text-sm">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-gray-600">
                  {territory.assigned_to ? `Assigned to: ${territory.assigned_to.substring(0, 8)}` : 'Unassigned'}
                </span>
              </div>

              {/* Customers */}
              <div className="flex items-center space-x-2 text-sm">
                <MapIcon className="w-4 h-4 text-gray-600" />
                <span className="text-gray-600">
                  {territory.customer_ids?.length || 0} customers
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {territories.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <MapPin className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No territories created yet</p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                resetForm();
                setShowCreateModal(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Territory
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>
                {editingTerritory ? 'Edit Territory' : 'Create New Territory'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Territory Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., North District"
                    required
                  />
                </div>

                <div>
                  <Label>Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Target Metrics</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label className="text-xs">Stops/Day</Label>
                      <Input
                        type="number"
                        value={formData.target_metrics.stops_per_day}
                        onChange={(e) => setFormData({
                          ...formData,
                          target_metrics: {
                            ...formData.target_metrics,
                            stops_per_day: parseInt(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Max Distance (mi)</Label>
                      <Input
                        type="number"
                        value={formData.target_metrics.max_distance_miles}
                        onChange={(e) => setFormData({
                          ...formData,
                          target_metrics: {
                            ...formData.target_metrics,
                            max_distance_miles: parseInt(e.target.value) || 0
                          }
                        })}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Revenue Target ($)</Label>
                      <Input
                        type="number"
                        value={formData.target_metrics.revenue_target}
                        onChange={(e) => setFormData({
                          ...formData,
                          target_metrics: {
                            ...formData.target_metrics,
                            revenue_target: parseInt(e.target.value) || 0
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
                      setEditingTerritory(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingTerritory ? 'Update Territory' : 'Create Territory'}
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

export default RouteMateTerritories;
