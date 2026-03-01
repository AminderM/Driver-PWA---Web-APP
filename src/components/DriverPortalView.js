import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DriverPortalView = () => {
  const [isDriverLoggedIn, setIsDriverLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [driverUser, setDriverUser] = useState(null);
  const [driverToken, setDriverToken] = useState(null);
  const [loads, setLoads] = useState([]);
  const [selectedLoad, setSelectedLoad] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');

  // Login form
  const [loginEmail, setLoginEmail] = useState('testdriver@example.com');
  const [loginPassword, setLoginPassword] = useState('Driver@123!');

  // Signup form
  const [signupData, setSignupData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: ''
  });

  useEffect(() => {
    if (isDriverLoggedIn && driverToken) {
      fetchLoads();
    }
  }, [isDriverLoggedIn, driverToken]);

  const fetchLoads = async () => {
    try {
      const response = await fetch(`${API_URL}/api/driver/loads`, {
        headers: {
          'Authorization': `Bearer ${driverToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLoads(data);
      }
    } catch (error) {
      console.error('Error fetching loads:', error);
    }
  };

  const handleDriverLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/driver/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setDriverToken(data.access_token);
        setDriverUser(data.user);
        setIsDriverLoggedIn(true);
        toast.success('Login successful!');
      } else {
        toast.error(data.detail || 'Login failed');
      }
    } catch (error) {
      toast.error('Login error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverSignup = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/driver/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Account created! Please login with your credentials.');
        setIsSignup(false);
        setLoginEmail(signupData.email);
        setSignupData({ email: '', password: '', full_name: '', phone: '' });
      } else {
        toast.error(data.detail || 'Signup failed');
      }
    } catch (error) {
      toast.error('Signup error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDriverLogout = () => {
    setIsDriverLoggedIn(false);
    setDriverUser(null);
    setDriverToken(null);
    setLoads([]);
    setSelectedLoad(null);
    setActiveView('dashboard');
    toast.success('Logged out successfully');
  };

  const handleAcceptLoad = async (loadId) => {
    try {
      const response = await fetch(`${API_URL}/api/driver/loads/${loadId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${driverToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Load accepted!');
        fetchLoads();
        if (selectedLoad?.id === loadId) {
          const updatedLoad = loads.find(l => l.id === loadId);
          if (updatedLoad) {
            setSelectedLoad({ ...updatedLoad, status: 'planned' });
          }
        }
      } else {
        toast.error('Failed to accept load');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const handleUpdateStatus = async (loadId, newStatus) => {
    try {
      const response = await fetch(`${API_URL}/api/driver/loads/${loadId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${driverToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast.success('Status updated!');
        fetchLoads();
        if (selectedLoad?.id === loadId) {
          setSelectedLoad({ ...selectedLoad, status: newStatus });
        }
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      toast.error('Error: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-muted0',
      planned: 'bg-muted0',
      in_transit_pickup: 'bg-muted0',
      at_pickup: 'bg-cyan-500',
      in_transit_delivery: 'bg-muted0',
      at_delivery: 'bg-cyan-500',
      delivered: 'bg-muted0'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusLabel = (status) => {
    return status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || 'Unknown';
  };

  const getNextStatus = (currentStatus) => {
    const flow = {
      pending: 'planned',
      planned: 'in_transit_pickup',
      in_transit_pickup: 'at_pickup',
      at_pickup: 'in_transit_delivery',
      in_transit_delivery: 'at_delivery',
      at_delivery: 'delivered'
    };
    return flow[currentStatus];
  };

  const openGoogleMaps = (load) => {
    const origin = `${load.pickup_location}, ${load.pickup_city}, ${load.pickup_state}`;
    const dest = `${load.delivery_location}, ${load.delivery_city}, ${load.delivery_state}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // LOGIN VIEW
  if (!isDriverLoggedIn) {
    return (
      <div className="min-h-[600px] bg-card flex items-center justify-center p-8 rounded-lg">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <i className="fas fa-truck text-foreground text-2xl"></i>
                <span className="text-2xl">Driver Portal</span>
              </div>
              <p className="text-sm text-gray-600 font-normal">
                {isSignup ? 'Create your account' : 'Sign in to continue'}
              </p>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSignup ? (
              <>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    type="text"
                    value={signupData.full_name}
                    onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    value={signupData.phone}
                    onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                    placeholder="555-1234"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    placeholder="driver@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    placeholder="Enter password"
                  />
                </div>
                <Button onClick={handleDriverSignup} className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </Button>
                <Button variant="outline" onClick={() => setIsSignup(false)} className="w-full">
                  Already have an account? Sign In
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="driver@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
                <Button onClick={handleDriverLogin} className="w-full" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>
                <Button variant="outline" onClick={() => setIsSignup(true)} className="w-full">
                  Don't have an account? Sign Up
                </Button>

                <div className="mt-4 p-3 bg-muted rounded-lg border border-border">
                  <p className="text-xs text-foreground">
                    <i className="fas fa-info-circle mr-1"></i>
                    <strong>Test Account:</strong> testdriver@example.com / Driver@123!
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // LOAD DETAILS VIEW
  if (activeView === 'details' && selectedLoad) {
    const nextStatus = getNextStatus(selectedLoad.status);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setActiveView('dashboard')}>
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Dashboard
          </Button>
          <Button variant="outline" onClick={handleDriverLogout}>
            <i className="fas fa-sign-out-alt mr-2"></i>
            Logout
          </Button>
        </div>

        <Card>
          <CardHeader className="bg-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">{selectedLoad.order_number}</CardTitle>
                <Badge className={`${getStatusColor(selectedLoad.status)} text-white mt-2`}>
                  {getStatusLabel(selectedLoad.status)}
                </Badge>
              </div>
              <i className="fas fa-box text-4xl opacity-50"></i>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <i className="fas fa-map-marker-alt text-foreground"></i>
                Route Information
              </h3>
              <div className="grid gap-4">
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-map-marker-alt text-foreground mt-1"></i>
                    <div>
                      <p className="text-sm font-medium text-green-900 uppercase">Pickup</p>
                      <p className="font-semibold">{selectedLoad.pickup_location}</p>
                      <p className="text-sm text-gray-600">{selectedLoad.pickup_city}, {selectedLoad.pickup_state}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg border border-border">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-map-marker-alt text-foreground mt-1"></i>
                    <div>
                      <p className="text-sm font-medium text-red-900 uppercase">Delivery</p>
                      <p className="font-semibold">{selectedLoad.delivery_location}</p>
                      <p className="text-sm text-gray-600">{selectedLoad.delivery_city}, {selectedLoad.delivery_state}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {(selectedLoad.commodity || selectedLoad.weight) && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <i className="fas fa-box text-foreground"></i>
                  Cargo Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {selectedLoad.commodity && (
                    <div>
                      <p className="text-sm text-gray-600">Commodity</p>
                      <p className="font-semibold">{selectedLoad.commodity}</p>
                    </div>
                  )}
                  {selectedLoad.weight && (
                    <div>
                      <p className="text-sm text-gray-600">Weight</p>
                      <p className="font-semibold">{selectedLoad.weight} lbs</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedLoad.confirmed_rate && (
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Rate Information</h3>
                <p className="text-3xl font-bold text-foreground">${selectedLoad.confirmed_rate}</p>
              </div>
            )}

            <div className="space-y-3 pt-4 border-t">
              {selectedLoad.status === 'pending' && (
                <Button 
                  onClick={() => handleAcceptLoad(selectedLoad.id)} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <i className="fas fa-check-circle mr-2"></i>
                  Accept Load
                </Button>
              )}

              {nextStatus && selectedLoad.status !== 'delivered' && (
                <Button 
                  onClick={() => handleUpdateStatus(selectedLoad.id, nextStatus)} 
                  className="w-full"
                  size="lg"
                >
                  <i className="fas fa-arrow-up mr-2"></i>
                  Update to: {getStatusLabel(nextStatus)}
                </Button>
              )}

              {selectedLoad.status !== 'pending' && (
                <Button 
                  onClick={() => openGoogleMaps(selectedLoad)} 
                  variant="outline"
                  className="w-full"
                  size="lg"
                >
                  <i className="fas fa-map-marked-alt mr-2"></i>
                  Open Google Maps Navigation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // DASHBOARD VIEW
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Loads</h2>
          <p className="text-gray-600">Welcome, {driverUser?.full_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchLoads}>
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh
          </Button>
          <Button variant="outline" onClick={handleDriverLogout}>
            <i className="fas fa-sign-out-alt mr-2"></i>
            Logout
          </Button>
        </div>
      </div>

      {loads.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <i className="fas fa-truck text-gray-400 text-6xl mb-4"></i>
            <h3 className="text-xl font-semibold mb-2">No Loads Assigned</h3>
            <p className="text-gray-600">You don't have any loads assigned at the moment.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {loads.map((load) => (
            <Card 
              key={load.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedLoad(load);
                setActiveView('details');
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <i className="fas fa-box text-foreground text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{load.order_number}</h3>
                      <Badge className={`${getStatusColor(load.status)} text-white mt-1`}>
                        {getStatusLabel(load.status)}
                      </Badge>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400"></i>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <i className="fas fa-map-marker-alt text-foreground mt-1"></i>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Pickup</p>
                      <p className="text-sm font-semibold">{load.pickup_city}, {load.pickup_state}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <i className="fas fa-map-marker-alt text-foreground mt-1"></i>
                    <div>
                      <p className="text-xs text-gray-500 uppercase font-medium">Delivery</p>
                      <p className="text-sm font-semibold">{load.delivery_city}, {load.delivery_state}</p>
                    </div>
                  </div>
                </div>

                {load.commodity && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Commodity:</span> {load.commodity}
                      {load.weight && ` • ${load.weight} lbs`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DriverPortalView;
