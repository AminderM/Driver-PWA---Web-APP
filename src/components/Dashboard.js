import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import EquipmentManagement from './EquipmentManagement';
import DriverManagement from './DriverManagement';
import DriverPortalView from './DriverPortalView';
import OrderManagement from './OrderManagement';
import LocationTracking from './LocationTracking';
import FleetManagement from './FleetManagement';
import CompanyProfile from './CompanyProfile';
import TMSChatAssistant from './TMSChatAssistant';
import DepartmentPanel from './DepartmentPanel';
import SalesDepartment from './SalesDepartment';
import AccountingDepartment from './AccountingDepartment';
import DispatchAnalytics from './DispatchAnalytics';
import ThemeToggle from './ThemeToggle';

const Dashboard = () => {
  const { user, logout, fetchWithAuth } = useAuth();
  const navigate = useNavigate();
  const isPlatformAdmin = user?.role === 'platform_admin';
  const isFleetOwner = user?.role === 'fleet_owner';
  const showAdminTabs = isPlatformAdmin || isFleetOwner;
  
  // Set initial tab based on user role
  const [activeTab, setActiveTab] = useState(() => {
    return showAdminTabs ? 'fleet' : 'equipment';
  });
  
  const [activeDepartment, setActiveDepartment] = useState('dispatch');
  const [stats, setStats] = useState({
    totalEquipment: 0,
    activeBookings: 0,
    totalDrivers: 0,
    availableEquipment: 0
  });
  const [selectedEquipmentForTracking, setSelectedEquipmentForTracking] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Update active tab when user changes
  useEffect(() => {
    if (user && showAdminTabs && activeTab === 'equipment') {
      setActiveTab('fleet');
    }
  }, [user, showAdminTabs]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-500', text: 'Pending' },
      verified: { color: 'bg-green-500', text: 'Verified' },
      suspended: { color: 'bg-red-500', text: 'Suspended' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={`${config.color} text-white`}>{config.text}</Badge>;
  };

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        // Try current company endpoint first (for platform_admin)
        let res = await fetchWithAuth(`${BACKEND_URL}/api/companies/current`);
        if (!res.ok) {
          // Fallback to my company endpoint (for fleet_owner)
          res = await fetchWithAuth(`${BACKEND_URL}/api/companies/my`);
        }
        
        if (res.ok) {
          const data = await res.json();
          setCompany(data);
        }
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadCompanyData();
    } else {
      setLoading(false);
    }
  }, [user, BACKEND_URL, fetchWithAuth]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-card border-b border-border flex-shrink-0 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-6">
              <img src="/company-logo.jpg" alt="Integrated Supply Chain Solutions" className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-foreground" data-testid="dashboard-title">
                  Welcome, {user?.full_name}
                </h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {(user?.role || '').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Dashboard
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              <div className="text-sm">
                <div className="font-semibold text-foreground">{company?.name || 'No Company'}</div>
                {company && getStatusBadge(company.verification_status)}
              </div>
              
              {/* Company/Profile/Admin Dropdown */}
              <div className="relative group">
                <Button 
                  variant="outline"
                  className="border-border hover:bg-muted">
                  <i className="fas fa-building mr-2"></i>
                  Company
                  <i className="fas fa-chevron-down ml-2"></i>
                </Button>
                <div className="absolute right-0 mt-2 w-56 bg-card text-foreground rounded-xl shadow-lg border border-border py-1 z-50 hidden group-hover:block">
                  <button
                    onClick={() => navigate('/apps')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                  >
                    <i className="fas fa-th mr-2"></i>
                    Apps
                  </button>
                  <div className="border-t border-border"></div>
                  <button
                    onClick={() => setActiveTab('driver-portal')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-muted bg-primary/10 text-primary font-medium"
                  >
                    <i className="fas fa-mobile-alt mr-2"></i>
                    🚀 Driver Portal Demo
                  </button>
                  <div className="border-t border-border"></div>
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                  >
                    <i className="fas fa-id-card mr-2"></i>
                    Company Profile
                  </button>
                  {isPlatformAdmin && (
                    <>
                      <div className="border-t border-border"></div>
                      <button
                        onClick={() => navigate('/admin')}
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-muted"
                      >
                        <i className="fas fa-tools mr-2"></i>
                        Admin Console
                      </button>
                    </>
                  )}
                  <div className="border-t border-border"></div>
                  <button
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-destructive hover:bg-muted"
                  >
                    <i className="fas fa-sign-out-alt mr-2"></i>
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Column Layout: Department Panel + Main Content + Chat Panel */}
      <div className="flex-1 flex overflow-hidden h-full">
        {/* Left Panel (14%) - Department Navigation */}
        <div className="w-[14%] h-full overflow-hidden">
          <DepartmentPanel 
            activeDepartment={activeDepartment} 
            onDepartmentChange={setActiveDepartment}
          />
        </div>

        {/* Middle Panel (66%) - Main Content */}
        <div className="w-[66%] h-full overflow-y-auto bg-background p-6">
          {/* Department-Specific Views */}
          {activeDepartment === 'sales' ? (
            <SalesDepartment BACKEND_URL={BACKEND_URL} fetchWithAuth={fetchWithAuth} />
          ) : activeDepartment === 'accounting' ? (
            <AccountingDepartment BACKEND_URL={BACKEND_URL} fetchWithAuth={fetchWithAuth} />
          ) : (
            <div>
              {/* Main Content Tabs */}
              <Card className="bg-card rounded-2xl shadow-sm border border-border">
                <CardContent className="p-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className={`grid w-full ${showAdminTabs ? 'grid-cols-6' : 'grid-cols-4'} bg-muted p-1 rounded-xl`}>
                    {showAdminTabs && (
                      <TabsTrigger value="analytics" data-testid="analytics-tab">
                        <i className="fas fa-chart-bar mr-2"></i>
                        Analytics
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="equipment" data-testid="equipment-tab">
                      <i className="fas fa-truck mr-2"></i>
                      Equipment
                    </TabsTrigger>
                    {showAdminTabs && (
                      <TabsTrigger value="drivers" data-testid="drivers-tab">
                        <i className="fas fa-users mr-2"></i>
                        Drivers
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="bookings" data-testid="bookings-tab">
                      <i className="fas fa-shopping-cart mr-2"></i>
                      Loads
                    </TabsTrigger>
                    <TabsTrigger value="tracking" data-testid="tracking-tab">
                      <i className="fas fa-map-marker-alt mr-2"></i>
                      Tracking
                    </TabsTrigger>
                    <TabsTrigger value="driver-portal" data-testid="driver-portal-tab">
                      <i className="fas fa-mobile-alt mr-2"></i>
                      Driver Portal Demo
                    </TabsTrigger>
                  </TabsList>

                  {showAdminTabs && (
                    <TabsContent value="analytics" className="mt-6">
                      <DispatchAnalytics />
                    </TabsContent>
                  )}

                  <TabsContent value="equipment" className="mt-6">
                    <EquipmentManagement 
                      onStatsUpdate={setStats} 
                      onTrackEquipment={(equipmentId) => {
                        setSelectedEquipmentForTracking(equipmentId);
                        setActiveTab('tracking');
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="bookings" className="mt-6">
                    <OrderManagement />
                  </TabsContent>

                  {showAdminTabs && (
                    <TabsContent value="drivers" className="mt-6">
                      <DriverManagement onStatsUpdate={setStats} />
                    </TabsContent>
                  )}

                  <TabsContent value="tracking" className="mt-6">
                    <LocationTracking selectedEquipmentId={selectedEquipmentForTracking} />
                  </TabsContent>

                  <TabsContent value="driver-portal" className="mt-6">
                    <DriverPortalView />
                  </TabsContent>

                  <TabsContent value="profile" className="mt-6">
                    <CompanyProfile />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          )}
        </div>

        {/* Right Panel (20%) - AI Chat Assistant */}
        <div className="w-1/5 h-full overflow-hidden">
          <TMSChatAssistant 
            fetchWithAuth={fetchWithAuth} 
            BACKEND_URL={BACKEND_URL} 
            user={user}
            activeDepartment={activeDepartment}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
