import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import EquipmentManagement from './EquipmentManagement';
import DriverManagement from './DriverManagement';
import LocationTracking from './LocationTracking';

const FleetManagement = () => {
  const { user, fetchWithAuth } = useAuth();
  const [fleetStats, setFleetStats] = useState({
    totalEquipment: 0,
    availableEquipment: 0,
    onDutyEquipment: 0,
    totalDrivers: 0,
    activeDrivers: 0,
    totalRevenue: 0,
    activeBookings: 0,
    utilizationRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    loadFleetData();
  }, []);

  const loadFleetData = async () => {
    try {
      // Load equipment data
      const equipmentResponse = await fetchWithAuth(`${BACKEND_URL}/api/equipment/my`);
      if (equipmentResponse.ok) {
        const equipmentData = await equipmentResponse.json();
        setEquipment(equipmentData);
        
        const available = equipmentData.filter(eq => eq.is_available).length;
        const onDuty = equipmentData.filter(eq => !eq.is_available && eq.current_driver_id).length;
        
        setFleetStats(prev => ({
          ...prev,
          totalEquipment: equipmentData.length,
          availableEquipment: available,
          onDutyEquipment: onDuty,
          utilizationRate: equipmentData.length > 0 ? Math.round((onDuty / equipmentData.length) * 100) : 0
        }));
      }

      // Load booking data for revenue and active bookings
      const bookingsResponse = await fetchWithAuth(`${BACKEND_URL}/api/bookings/requests`);
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        
        const activeBookings = bookingsData.filter(booking => 
          ['pending', 'approved'].includes(booking.status)
        ).length;
        
        const totalRevenue = bookingsData
          .filter(booking => booking.status === 'completed')
          .reduce((sum, booking) => sum + (booking.total_cost || 0), 0);
        
        setFleetStats(prev => ({
          ...prev,
          activeBookings,
          totalRevenue
        }));
      }

    } catch (error) {
      toast.error('Error loading fleet data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-12 h-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="fleet-management-title">
            Transport Hub - TMS Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive Transportation Management System for your fleet operations
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline" 
            onClick={loadFleetData}
            data-testid="refresh-fleet-data-btn"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Fleet Statistics Cards - Removed per user request */}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" data-testid="overview-tab">
            <i className="fas fa-tachometer-alt mr-2"></i>
            Overview
          </TabsTrigger>
          <TabsTrigger value="equipment" data-testid="equipment-tab">
            <i className="fas fa-truck mr-2"></i>
            Equipment
          </TabsTrigger>
          <TabsTrigger value="drivers" data-testid="drivers-tab">
            <i className="fas fa-users mr-2"></i>
            Drivers
          </TabsTrigger>
          <TabsTrigger value="tracking" data-testid="tracking-tab">
            <i className="fas fa-map-marker-alt mr-2"></i>
            Live Tracking
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="fas fa-bolt mr-2 text-foreground"></i>
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => setActiveTab('equipment')} 
                    className="flex flex-col items-center p-6 h-auto space-y-2 bg-card hover:from-blue-100 hover:to-blue-200 text-foreground border-border"
                    variant="outline"
                    data-testid="quick-add-equipment-btn"
                  >
                    <i className="fas fa-plus-circle text-2xl"></i>
                    <span>Add Equipment</span>
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('drivers')} 
                    className="flex flex-col items-center p-6 h-auto space-y-2 bg-card hover:from-purple-100 hover:to-purple-200 text-foreground border-border"
                    variant="outline"
                    data-testid="quick-add-driver-btn"
                  >
                    <i className="fas fa-user-plus text-2xl"></i>
                    <span>Add Driver</span>
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab('tracking')} 
                    className="flex flex-col items-center p-6 h-auto space-y-2 bg-card hover:from-green-100 hover:to-green-200 text-foreground border-border"
                    variant="outline"
                    data-testid="quick-track-fleet-btn"
                  >
                    <i className="fas fa-map-marked-alt text-2xl"></i>
                    <span>Track Fleet</span>
                  </Button>
                  
                  <Button 
                    className="flex flex-col items-center p-6 h-auto space-y-2 bg-card hover:from-orange-100 hover:to-orange-200 text-foreground border-border"
                    variant="outline"
                    data-testid="view-analytics-btn"
                  >
                    <i className="fas fa-chart-line text-2xl"></i>
                    <span>View Analytics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Fleet Performance Summary - Removed per user request */}
          </div>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="mt-6">
          <EquipmentManagement onStatsUpdate={setFleetStats} />
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="mt-6">
          <DriverManagement onStatsUpdate={setFleetStats} />
        </TabsContent>

        {/* Live Tracking Tab */}
        <TabsContent value="tracking" className="mt-6">
          <LocationTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FleetManagement;
