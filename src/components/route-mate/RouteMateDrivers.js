import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Users, Plus, Edit, Star } from 'lucide-react';

const RouteMateDrivers = ({ fetchWithAuth, BACKEND_URL }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_number: '',
    name: '',
    licenses: [],
    skills: []
  });

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/route-mate/drivers`);
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
      }
    } catch (e) {
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/api/route-mate/drivers`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Driver added!');
        setShowCreateModal(false);
        resetForm();
        loadDrivers();
      } else {
        toast.error('Failed to add driver');
      }
    } catch (e) {
      toast.error('Failed to add driver');
    }
  };

  const resetForm = () => {
    setFormData({
      employee_number: '',
      name: '',
      licenses: [],
      skills: []
    });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-3xl font-bold text-gray-900">Drivers</h2><p className="text-gray-600 mt-1">Manage your driver team</p></div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />Add Driver</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Total Drivers</p><p className="text-2xl font-bold text-gray-900">{drivers.length}</p></div><Users className="w-8 h-8 text-blue-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Active</p><p className="text-2xl font-bold text-green-600">{drivers.filter(d => d.status === 'active').length}</p></div><Users className="w-8 h-8 text-green-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Avg Rating</p><p className="text-2xl font-bold text-yellow-600">{drivers.length > 0 ? (drivers.reduce((sum, d) => sum + (d.performance?.customer_rating || 0), 0) / drivers.length).toFixed(1) : 0}</p></div><Star className="w-8 h-8 text-yellow-600" /></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center justify-between"><div><p className="text-sm text-gray-600">Avg On-Time</p><p className="text-2xl font-bold text-purple-600">{drivers.length > 0 ? (drivers.reduce((sum, d) => sum + (d.performance?.on_time_percentage || 0), 0) / drivers.length).toFixed(0) : 0}%</p></div><Users className="w-8 h-8 text-purple-600" /></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <Card key={driver.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{driver.name}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">ID: {driver.employee_number}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${driver.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{driver.status}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Licenses</span>
                  <span className="font-medium text-gray-900">{driver.licenses?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Skills</span>
                  <span className="font-medium text-gray-900">{driver.skills?.length || 0}</span>
                </div>
                {driver.performance && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Rating</span>
                      <span className="font-medium text-gray-900">{driver.performance.customer_rating?.toFixed(1) || 0} ⭐</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">On-Time</span>
                      <span className="font-medium text-gray-900">{driver.performance.on_time_percentage?.toFixed(0) || 0}%</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {drivers.length === 0 && (
        <Card><CardContent className="py-16 text-center"><Users className="w-16 h-16 mx-auto text-gray-400 mb-4" /><p className="text-gray-600 mb-4">No drivers added yet</p><Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />Add Your First Driver</Button></CardContent></Card>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader><CardTitle>Add New Driver</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div><Label>Employee Number *</Label><Input value={formData.employee_number} onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })} placeholder="DRV-001" required /></div>
                <div><Label>Full Name *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" required /></div>
                <div className="flex items-center justify-end space-x-3 pt-4"><Button type="button" variant="outline" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button><Button type="submit" className="bg-blue-600 hover:bg-blue-700">Add Driver</Button></div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default RouteMateDrivers;
