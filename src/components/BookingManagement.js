import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BookingManagement = () => {
  const { user, fetchWithAuth } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [formData, setFormData] = useState({
    equipment_id: '',
    start_date: null,
    end_date: null,
    pickup_location: '',
    delivery_location: '',
    notes: ''
  });
  const [activeTab, setActiveTab] = useState('my-bookings');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadBookings();
    if (user?.role === 'fleet_owner') {
      loadBookingRequests();
    }
    loadEquipment();
  }, [user]);

  const loadBookings = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings/my`);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (error) {
      toast.error('Error loading bookings');
    } finally {
      setLoading(false);
    }
  };

  const loadBookingRequests = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings/requests`);
      if (response.ok) {
        const data = await response.json();
        setBookingRequests(data);
      }
    } catch (error) {
      toast.error('Error loading booking requests');
    }
  };

  const loadEquipment = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/equipment`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
      }
    } catch (error) {
      toast.error('Error loading equipment');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEquipmentSelect = (equipmentId) => {
    const selected = equipment.find(eq => eq.id === equipmentId);
    setSelectedEquipment(selected);
    setFormData(prev => ({ ...prev, equipment_id: equipmentId }));
  };

  const calculateTotalCost = () => {
    if (!selectedEquipment || !formData.start_date || !formData.end_date) {
      return 0;
    }
    
    const diffTime = Math.abs(formData.end_date - formData.start_date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays * selectedEquipment.daily_rate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const bookingData = {
        ...formData,
        start_date: formData.start_date.toISOString(),
        end_date: formData.end_date.toISOString()
      };
      
      const response = await fetchWithAuth(`${BACKEND_URL}/api/bookings`, {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Booking request created successfully! Total cost: $${result.total_cost}`);
        setShowBookingForm(false);
        setFormData({
          equipment_id: '',
          start_date: null,
          end_date: null,
          pickup_location: '',
          delivery_location: '',
          notes: ''
        });
        setSelectedEquipment(null);
        loadBookings();
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to create booking');
      }
    } catch (error) {
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', className: 'status-pending' },
      approved: { label: 'Approved', className: 'status-verified' },
      rejected: { label: 'Rejected', className: 'status-rejected' },
      completed: { label: 'Completed', className: 'status-verified' },
      cancelled: { label: 'Cancelled', className: 'status-rejected' }
    };
    
    const statusInfo = statusMap[status] || statusMap.pending;
    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getEquipmentName = (equipmentId) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? eq.name : 'Unknown Equipment';
  };

  const renderBookingCard = (booking, isRequest = false) => (
    <Card key={booking.id} className="dashboard-card" data-testid={`booking-card-${booking.id}`}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1" data-testid={`booking-equipment-${booking.id}`}>
              {getEquipmentName(booking.equipment_id)}
            </h3>
            <p className="text-sm text-gray-600">ID: {booking.id.substring(0, 8)}...</p>
          </div>
          {getStatusBadge(booking.status)}
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm">
            <i className="fas fa-calendar w-4 mr-2 text-gray-500"></i>
            <span className="text-gray-600">Start:</span>
            <span className="ml-2 font-medium">
              {format(new Date(booking.start_date), 'MMM dd, yyyy')}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <i className="fas fa-calendar w-4 mr-2 text-gray-500"></i>
            <span className="text-gray-600">End:</span>
            <span className="ml-2 font-medium">
              {format(new Date(booking.end_date), 'MMM dd, yyyy')}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <i className="fas fa-map-marker-alt w-4 mr-2 text-gray-500"></i>
            <span className="text-gray-600">Pickup:</span>
            <span className="ml-2 font-medium text-xs">{booking.pickup_location}</span>
          </div>
          <div className="flex items-center text-sm">
            <i className="fas fa-flag w-4 mr-2 text-gray-500"></i>
            <span className="text-gray-600">Delivery:</span>
            <span className="ml-2 font-medium text-xs">{booking.delivery_location}</span>
          </div>
        </div>
        
        {booking.notes && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 font-medium mb-1">Notes:</p>
            <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">{booking.notes}</p>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold text-foreground">
            ${booking.total_cost || 0}
          </div>
          <div className="flex space-x-2">
            {isRequest && booking.status === 'pending' && (
              <>
                <Button size="sm" variant="outline" className="text-foreground hover:bg-green-50">
                  Approve
                </Button>
                <Button size="sm" variant="outline" className="text-foreground hover:bg-red-50">
                  Reject
                </Button>
              </>
            )}
            {!isRequest && (
              <Button size="sm" variant="outline" data-testid={`view-booking-btn-${booking.id}`}>
                View Details
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading && bookings.length === 0) {
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
          <h2 className="text-2xl font-bold text-gray-900">Booking Management</h2>
          <p className="text-gray-600">
            {user?.role === 'fleet_owner' 
              ? 'Manage booking requests and your own bookings'
              : 'Create and manage your equipment bookings'}
          </p>
        </div>
        
        {user?.role !== 'fleet_owner' && (
          <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
            <DialogTrigger asChild>
              <Button className="btn-primary" data-testid="create-booking-btn">
                <i className="fas fa-plus mr-2"></i>
                Create Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="equipment_id">Select Equipment</Label>
                  <select
                    id="equipment_id"
                    value={formData.equipment_id}
                    onChange={(e) => handleEquipmentSelect(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                    data-testid="booking-equipment-select"
                  >
                    <option value="">Choose equipment...</option>
                    {equipment.filter(eq => eq.is_available).map(eq => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} - ${eq.daily_rate}/day
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedEquipment && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Selected Equipment</h4>
                    <p className="text-sm text-blue-800">
                      {selectedEquipment.name} - {selectedEquipment.description}
                    </p>
                    <p className="text-sm text-foreground mt-1">
                      Daily Rate: ${selectedEquipment.daily_rate} | Location: {selectedEquipment.location_address}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal"
                          data-testid="booking-start-date-btn"
                        >
                          <i className="fas fa-calendar mr-2"></i>
                          {formData.start_date ? format(formData.start_date, 'PPP') : 'Pick start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.start_date}
                          onSelect={(date) => handleInputChange('start_date', date)}
                          disabled={(date) => date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start text-left font-normal"
                          data-testid="booking-end-date-btn"
                        >
                          <i className="fas fa-calendar mr-2"></i>
                          {formData.end_date ? format(formData.end_date, 'PPP') : 'Pick end date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.end_date}
                          onSelect={(date) => handleInputChange('end_date', date)}
                          disabled={(date) => date < formData.start_date}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pickup_location">Pickup Location</Label>
                  <Input
                    id="pickup_location"
                    value={formData.pickup_location}
                    onChange={(e) => handleInputChange('pickup_location', e.target.value)}
                    placeholder="Enter pickup address"
                    required
                    data-testid="booking-pickup-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="delivery_location">Delivery Location</Label>
                  <Input
                    id="delivery_location"
                    value={formData.delivery_location}
                    onChange={(e) => handleInputChange('delivery_location', e.target.value)}
                    placeholder="Enter delivery address"
                    required
                    data-testid="booking-delivery-input"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any special requirements or notes"
                    rows={3}
                    data-testid="booking-notes-input"
                  />
                </div>
                
                {selectedEquipment && formData.start_date && formData.end_date && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-900 mb-2">Booking Summary</h4>
                    <div className="text-sm text-green-800">
                      <p>Duration: {Math.ceil((formData.end_date - formData.start_date) / (1000 * 60 * 60 * 24))} days</p>
                      <p>Daily Rate: ${selectedEquipment.daily_rate}</p>
                      <p className="font-bold text-lg mt-2">Total Cost: ${calculateTotalCost()}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowBookingForm(false)}
                    data-testid="cancel-booking-btn"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !selectedEquipment || !formData.start_date || !formData.end_date}
                    data-testid="submit-booking-btn"
                  >
                    {loading ? 'Creating...' : 'Create Booking Request'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tab Navigation for Fleet Owners */}
      {user?.role === 'fleet_owner' && (
        <div className="flex space-x-2 border-b">
          <button
            onClick={() => setActiveTab('my-bookings')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'my-bookings' 
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700' 
                : 'text-gray-600 hover:text-blue-700'
            }`}
            data-testid="my-bookings-tab"
          >
            My Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'requests' 
                ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-700' 
                : 'text-gray-600 hover:text-blue-700'
            }`}
            data-testid="booking-requests-tab"
          >
            Booking Requests ({bookingRequests.length})
          </button>
        </div>
      )}

      {/* Content */}
      {user?.role === 'fleet_owner' && activeTab === 'requests' ? (
        // Booking Requests
        <div>
          {bookingRequests.length === 0 ? (
            <Card className="dashboard-card">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 text-5xl mb-4">
                  <i className="fas fa-inbox"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Booking Requests
                </h3>
                <p className="text-gray-600">
                  You haven't received any booking requests for your equipment yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookingRequests.map(request => renderBookingCard(request, true))}
            </div>
          )}
        </div>
      ) : (
        // My Bookings
        <div>
          {bookings.length === 0 ? (
            <Card className="dashboard-card">
              <CardContent className="p-8 text-center">
                <div className="text-gray-400 text-5xl mb-4">
                  <i className="fas fa-calendar-times"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Bookings Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  {user?.role === 'fleet_owner' 
                    ? "You haven't made any equipment bookings yet."
                    : "Start by creating your first equipment booking request."}
                </p>
                {user?.role !== 'fleet_owner' && (
                  <Button 
                    onClick={() => setShowBookingForm(true)}
                    className="btn-primary"
                    data-testid="create-first-booking-btn"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create Your First Booking
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookings.map(booking => renderBookingCard(booking))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingManagement;