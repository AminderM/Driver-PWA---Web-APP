import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const EquipmentManagement = ({ onStatsUpdate, onTrackEquipment }) => {
  const { user, fetchWithAuth } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'tile' - default set to list
  const [formData, setFormData] = useState({
    name: '',
    equipment_type: '',
    description: '',
    specifications: {},
    hourly_rate: '',
    daily_rate: '',
    location_address: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  const equipmentTypes = [
    { value: 'big_rig', label: 'Big Rig', icon: 'fa-truck-moving' },
    { value: 'box_truck', label: 'Box Truck', icon: 'fa-truck' },
    { value: 'crane', label: 'Crane', icon: 'fa-crane' },
    { value: 'dry_van', label: 'Dry Van', icon: 'fa-truck-container' },
    { value: 'excavator', label: 'Excavator', icon: 'fa-hard-hat' },
    { value: 'flatbed_truck', label: 'Flatbed Truck', icon: 'fa-truck-flatbed' },
    { value: 'forklift', label: 'Forklift', icon: 'fa-forklift' },
    { value: 'hvac_truck', label: 'HVAC Truck', icon: 'fa-tools' },
    { value: 'reefer', label: 'Reefer', icon: 'fa-snowflake' },
    { value: 'sprinter_van', label: 'Sprinter Van', icon: 'fa-shuttle-van' },
    { value: 'tractor', label: 'Tractor', icon: 'fa-tractor' }
  ];

  useEffect(() => {
    if (user?.role === 'fleet_owner' || user?.role === 'platform_admin') {
      loadMyEquipment();
    } else {
      loadAllEquipment();
    }
  }, [user]);

  const loadMyEquipment = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/equipment/my`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
        // Update stats
        if (onStatsUpdate) {
          const availableCount = data.filter(eq => eq.is_available).length;
          onStatsUpdate(prev => ({
            ...prev,
            totalEquipment: data.length,
            availableEquipment: availableCount
          }));
        }
      }
    } catch (error) {
      toast.error('Error loading equipment');
    } finally {
      setLoading(false);
    }
  };

  const loadAllEquipment = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/equipment`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      toast.error('Error loading equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'hourly_rate' || field === 'daily_rate') {
      setFormData(prev => ({ ...prev, [field]: parseFloat(value) || '' }));
    } else if (field.startsWith('specs.')) {
      const specField = field.replace('specs.', '');
      setFormData(prev => ({
        ...prev,
        specifications: { ...prev.specifications, [specField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/equipment`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Equipment added successfully!');
        setShowAddForm(false);
        setFormData({
          name: '',
          equipment_type: '',
          description: '',
          specifications: {},
          hourly_rate: '',
          daily_rate: '',
          location_address: ''
        });
        loadMyEquipment();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to add equipment');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentIcon = (type) => {
    const equipmentType = equipmentTypes.find(et => et.value === type);
    return equipmentType?.icon || 'fa-truck';
  };

  const getEquipmentLabel = (type) => {
    const equipmentType = equipmentTypes.find(et => et.value === type);
    return equipmentType?.label || type.replace('_', ' ');
  };

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eq.location_address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !filterType || filterType === 'all' || eq.equipment_type === filterType;
    return matchesSearch && matchesType;
  });

  const renderSpecifications = (specs) => {
    if (!specs || Object.keys(specs).length === 0) {
      return <span className="text-muted-foreground">No specifications</span>;
    }
    
    return (
      <div className="space-y-1">
        {Object.entries(specs).map(([key, value]) => (
          <div key={key} className="text-sm">
            <span className="font-medium">{key.replace('_', ' ').toUpperCase()}:</span> {value}
          </div>
        ))}
      </div>
    );
  };

  if (loading && equipment.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Equipment Management</h2>
          <p className="text-muted-foreground">
            {user?.role === 'fleet_owner' ? 'Manage your equipment fleet' : 'Browse available equipment'}
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
          
          {/* Add Equipment Button */}
          {(user?.role === 'fleet_owner' || user?.role === 'platform_admin') && (
            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button className="btn-primary" data-testid="add-equipment-btn">
                  <i className="fas fa-plus mr-2"></i>
                  Add Equipment
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Equipment</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Equipment Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter equipment name"
                      required
                      data-testid="equipment-name-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="equipment_type">Equipment Type</Label>
                    <Select value={formData.equipment_type} onValueChange={(value) => handleInputChange('equipment_type', value)}>
                      <SelectTrigger data-testid="equipment-type-select">
                        <SelectValue placeholder="Select equipment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the equipment"
                    rows={3}
                    required
                    data-testid="equipment-description-input"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                    <Input
                      id="hourly_rate"
                      type="number"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={(e) => handleInputChange('hourly_rate', e.target.value)}
                      placeholder="0.00"
                      required
                      data-testid="equipment-hourly-rate-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="daily_rate">Daily Rate ($)</Label>
                    <Input
                      id="daily_rate"
                      type="number"
                      step="0.01"
                      value={formData.daily_rate}
                      onChange={(e) => handleInputChange('daily_rate', e.target.value)}
                      placeholder="0.00"
                      required
                      data-testid="equipment-daily-rate-input"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location_address">Current Location</Label>
                  <Input
                    id="location_address"
                    value={formData.location_address}
                    onChange={(e) => handleInputChange('location_address', e.target.value)}
                    placeholder="Enter current location"
                    required
                    data-testid="equipment-location-input"
                  />
                </div>
                
                {/* Specifications */}
                <div className="space-y-4">
                  <Label>Specifications (Optional)</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacity">Capacity</Label>
                      <Input
                        id="capacity"
                        value={formData.specifications.capacity || ''}
                        onChange={(e) => handleInputChange('specs.capacity', e.target.value)}
                        placeholder="e.g., 5000 lbs"
                        data-testid="equipment-capacity-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        value={formData.specifications.year || ''}
                        onChange={(e) => handleInputChange('specs.year', e.target.value)}
                        placeholder="e.g., 2022"
                        data-testid="equipment-year-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="make">Make</Label>
                      <Input
                        id="make"
                        value={formData.specifications.make || ''}
                        onChange={(e) => handleInputChange('specs.make', e.target.value)}
                        placeholder="e.g., Ford"
                        data-testid="equipment-make-input"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={formData.specifications.model || ''}
                        onChange={(e) => handleInputChange('specs.model', e.target.value)}
                        placeholder="e.g., Transit"
                        data-testid="equipment-model-input"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddForm(false)}
                    data-testid="cancel-add-equipment-btn"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !formData.equipment_type}
                    data-testid="save-equipment-btn"
                  >
                    {loading ? 'Adding...' : 'Add Equipment'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search equipment by name, description, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
            data-testid="equipment-search-input"
          />
        </div>
        <div className="sm:w-48">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger data-testid="equipment-filter-select">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {equipmentTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  <i className={`fas ${type.icon} mr-2`}></i>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Equipment Grid */}
      {filteredEquipment.length === 0 ? (
        <Card className="dashboard-card">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground text-5xl mb-4">
              <i className="fas fa-truck"></i>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {user?.role === 'fleet_owner' ? 'No Equipment Added Yet' : 'No Equipment Available'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {user?.role === 'fleet_owner' 
                ? 'Start by adding your first piece of equipment to the marketplace.'
                : 'Check back later for available equipment.'}
            </p>
            {(user?.role === 'fleet_owner' || user?.role === 'platform_admin') && (
              <Button 
                onClick={() => setShowAddForm(true)}
                className="btn-primary"
                data-testid="add-first-equipment-btn"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Your First Equipment
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        // List View - Table
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted border-b-2 border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Location</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Hourly Rate</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Daily Rate</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredEquipment.map((item) => (
                    <tr key={item.id} className="hover:bg-muted" data-testid={`equipment-row-${item.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <i className={`fas ${getEquipmentIcon(item.equipment_type)} text-foreground mr-3 text-lg`}></i>
                          <div>
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-secondary text-secondary-foreground border border-border">
                          {getEquipmentLabel(item.equipment_type)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-secondary text-secondary-foreground border border-border">
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <i className="fas fa-map-marker-alt mr-2"></i>
                          {item.location_address}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        ${item.hourly_rate}/hr
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        ${item.daily_rate}/day
                      </td>
                      <td className="px-4 py-3">
                        {user?.role !== 'fleet_owner' || item.owner_id !== user?.id ? (
                          <Button 
                            size="sm"
                            className="btn-primary" 
                            disabled={!item.is_available}
                            data-testid={`book-equipment-btn-${item.id}`}
                          >
                            <i className="fas fa-calendar-plus mr-1"></i>
                            {item.is_available ? 'Book' : 'Unavailable'}
                          </Button>
                        ) : (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              variant="outline"
                              data-testid={`edit-equipment-btn-${item.id}`}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => onTrackEquipment && onTrackEquipment(item.id)}
                              data-testid={`track-equipment-btn-${item.id}`}
                            >
                              <i className="fas fa-map-marker-alt"></i>
                            </Button>
                          </div>
                        )}
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
          {filteredEquipment.map((item) => (
            <Card key={item.id} className="equipment-card" data-testid={`equipment-card-${item.id}`}>
              <div className="equipment-image">
                <i className={`fas ${getEquipmentIcon(item.equipment_type)}`}></i>
              </div>
              
              <div className="equipment-details">
                <div className="flex justify-between items-start mb-3">
                  <Badge className="bg-secondary text-secondary-foreground border border-border">
                    {getEquipmentLabel(item.equipment_type)}
                  </Badge>
                  <Badge className="bg-secondary text-secondary-foreground border border-border">
                    {item.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>
                
                <h3 className="equipment-name" data-testid={`equipment-name-${item.id}`}>
                  {item.name}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="equipment-location">
                  <i className="fas fa-map-marker-alt"></i>
                  {item.location_address}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Hourly:</span>
                    <span className="font-semibold text-foreground">${item.hourly_rate}/hr</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Daily:</span>
                    <span className="font-semibold text-foreground">${item.daily_rate}/day</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground mb-2">Specifications:</h4>
                  {renderSpecifications(item.specifications)}
                </div>
                
                {user?.role !== 'fleet_owner' || item.owner_id !== user?.id ? (
                  <Button 
                    className="w-full btn-primary" 
                    disabled={!item.is_available}
                    data-testid={`book-equipment-btn-${item.id}`}
                  >
                    <i className="fas fa-calendar-plus mr-2"></i>
                    {item.is_available ? 'Book Now' : 'Unavailable'}
                  </Button>
                ) : (
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      data-testid={`edit-equipment-btn-${item.id}`}
                    >
                      <i className="fas fa-edit mr-2"></i>
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => onTrackEquipment && onTrackEquipment(item.id)}
                      data-testid={`track-equipment-btn-${item.id}`}
                    >
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      Track
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EquipmentManagement;