import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Truck, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

const RouteMateVehicles = ({ fetchWithAuth, BACKEND_URL }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_number: '',
    type: 'delivery_van',
    capacity: {
      weight_lbs: 10000,
      volume_cuft: 500,
      pallet_count: 20
    },
    specifications: {
      fuel_type: 'diesel',
      mpg: 12,
      cost_per_mile: 1.50,
      features: []
    }
  });

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/route-mate/vehicles`);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (e) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/route-mate/vehicles`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Vehicle added!');
        setShowCreateModal(false);
        resetForm();
        loadVehicles();
      } else {
        toast.error('Failed to add vehicle');
      }
    } catch (e) {
      toast.error('Failed to add vehicle');
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_number: '',
      type: 'delivery_van',
      capacity: {
        weight_lbs: 10000,
        volume_cuft: 500,
        pallet_count: 20
      },
      specifications: {
        fuel_type: 'diesel',
        mpg: 12,
        cost_per_mile: 1.50,
        features: []
      }
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Vehicles</h2>
          <p className="text-gray-600 mt-1">Manage your fleet vehicles</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Vehicles</p><p className="text-2xl font-bold text-gray-900">{vehicles.length}</p></div><Truck className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Active</p><p className="text-2xl font-bold text-green-600">{vehicles.filter(v => v.status === 'active').length}</p></div><CheckCircle className="w-8 h-8 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Maintenance</p><p className="text-2xl font-bold text-yellow-600">{vehicles.filter(v => v.status === 'maintenance').length}</p></div><XCircle className="w-8 h-8 text-yellow-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Avg MPG</p><p className="text-2xl font-bold text-purple-600">{vehicles.length > 0 ? (vehicles.reduce((sum, v) => sum + (v.specifications?.mpg || 0), 0) / vehicles.length).toFixed(1) : 0}</p></div><Truck className="w-8 h-8 text-purple-600" /></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{vehicle.vehicle_number}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1 capitalize">{vehicle.type.replace('_', ' ')}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${vehicle.status === 'active' ? 'bg-green-100 text-green-700' : vehicle.status === 'maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{vehicle.status}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Capacity</span>
                  <span className="font-medium text-gray-900">{vehicle.capacity?.weight_lbs.toLocaleString()} lbs</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Volume</span>
                  <span className="font-medium text-gray-900">{vehicle.capacity?.volume_cuft} cu ft</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Fuel Economy</span>
                  <span className="font-medium text-gray-900">{vehicle.specifications?.mpg} MPG</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Cost/Mile</span>
                  <span className="font-medium text-gray-900">${vehicle.specifications?.cost_per_mile}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {vehicles.length === 0 && (
        <Card><CardContent className="py-16 text-center"><Truck className="w-16 h-16 mx-auto text-gray-400 mb-4" /><p className="text-gray-600 mb-4">No vehicles added yet</p><Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />Add Your First Vehicle</Button></CardContent></Card>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader><CardTitle>Add New Vehicle</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Vehicle Number *</Label><Input value={formData.vehicle_number} onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })} placeholder="TRK-001" required /></div>
                <div><Label>Type *</Label><Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="delivery_van">Delivery Van</SelectItem><SelectItem value="box_truck">Box Truck</SelectItem><SelectItem value="semi">Semi Truck</SelectItem></SelectContent></Select></div>
                <div><Label>Capacity</Label><div className="grid grid-cols-3 gap-3 mt-2"><div><Label className="text-xs">Weight (lbs)</Label><Input type="number" value={formData.capacity.weight_lbs} onChange={(e) => setFormData({ ...formData, capacity: { ...formData.capacity, weight_lbs: parseInt(e.target.value) || 0 }})} /></div><div><Label className="text-xs">Volume (cu ft)</Label><Input type="number" value={formData.capacity.volume_cuft} onChange={(e) => setFormData({ ...formData, capacity: { ...formData.capacity, volume_cuft: parseInt(e.target.value) || 0 }})} /></div><div><Label className="text-xs">Pallets</Label><Input type="number" value={formData.capacity.pallet_count} onChange={(e) => setFormData({ ...formData, capacity: { ...formData.capacity, pallet_count: parseInt(e.target.value) || 0 }})} /></div></div></div>
                <div className="grid grid-cols-2 gap-3"><div><Label>MPG</Label><Input type="number" step="0.1" value={formData.specifications.mpg} onChange={(e) => setFormData({ ...formData, specifications: { ...formData.specifications, mpg: parseFloat(e.target.value) || 0 }})} /></div><div><Label>Cost per Mile ($)</Label><Input type="number" step="0.01" value={formData.specifications.cost_per_mile} onChange={(e) => setFormData({ ...formData, specifications: { ...formData.specifications, cost_per_mile: parseFloat(e.target.value) || 0 }})} /></div></div>
                <div className="flex items-center justify-end space-x-3 pt-4"><Button type="button" variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-700">Add Vehicle</Button></div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RouteMateVehicles;
