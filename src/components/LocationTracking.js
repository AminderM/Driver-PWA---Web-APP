import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import LiveTrackingMap from './LiveTrackingMap';

import FeatureGate from './FeatureGate';

const LocationTracking = ({ selectedEquipmentId }) => {
  const { user, fetchWithAuth } = useAuth();
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  // Manual location update state
  const [manualEquipmentId, setManualEquipmentId] = useState('');
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [searchingCities, setSearchingCities] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    if (user?.role === 'fleet_owner') {
      loadMyEquipment();
    } else {
      loadAllEquipment();
    }
  }, [user]);

  // Set selected equipment when passed from Equipment Management
  useEffect(() => {
    if (selectedEquipmentId && equipment.length > 0) {
      setSelectedEquipment(selectedEquipmentId);
      toast.success('Equipment selected for tracking');
    }
  }, [selectedEquipmentId, equipment]);

  useEffect(() => {
    if (selectedEquipment) {
      loadLocationHistory();
    }
  }, [selectedEquipment]);

  useEffect(() => {
    let watchId = null;
    
    if (trackingEnabled && selectedEquipment) {
      // Start watching position
      watchId = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // 1 minute
        }
      );
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [trackingEnabled, selectedEquipment]);

  const loadMyEquipment = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/equipment/my`);
      if (response.ok) {
        const data = await response.json();
        setEquipment(data);
        if (data.length === 1) {
          setSelectedEquipment(data[0].id);
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

  const loadLocationHistory = async () => {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/locations/${selectedEquipment}`);
      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Error loading location history:', error);
    }
  };

  const handleLocationUpdate = async (position) => {
    const { latitude, longitude } = position.coords;
    setCurrentLocation({ latitude, longitude, timestamp: new Date() });
    
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/locations`, {
        method: 'POST',
        body: JSON.stringify({
          equipment_id: selectedEquipment,
          latitude,
          longitude
        })
      });

      if (response.ok) {
        // Refresh location history
        loadLocationHistory();
      } else {
        console.error('Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleLocationError = (error) => {
    console.error('Geolocation error:', error);
    let message = 'Unable to get your location.';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied. Please enable location permissions.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information unavailable.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out.';
        break;
    }
    
    toast.error(message);
    setTrackingEnabled(false);
  };

  const toggleTracking = () => {
    if (!selectedEquipment) {
      toast.error('Please select equipment first');
      return;
    }
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser.');
      return;
    }
    
    setTrackingEnabled(!trackingEnabled);
    
    if (!trackingEnabled) {
      toast.success('Location tracking started');
    } else {
      toast.info('Location tracking stopped');
      setCurrentLocation(null);
    }
  };

  const getEquipmentName = (equipmentId) => {
    const eq = equipment.find(e => e.id === equipmentId);
    return eq ? eq.name : 'Unknown Equipment';
  };

  const formatLocation = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const openInMaps = (lat, lng) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // Search cities using OpenStreetMap Nominatim API
  const searchCities = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 3) {
      setCityResults([]);
      setShowCityDropdown(false);
      return;
    }

    setSearchingCities(true);
    try {
      // Search for cities/towns in USA and Canada
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(searchTerm)}&` +
        `countrycodes=us,ca&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=10&` +
        `featuretype=city`,
        {
          headers: {
            'User-Agent': 'TransportCentral-TMS/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Filter to only include cities, towns, and villages
        const filtered = data.filter(place => 
          place.type === 'city' || 
          place.type === 'town' || 
          place.type === 'village' ||
          place.type === 'administrative' ||
          place.class === 'place'
        );
        setCityResults(filtered);
        setShowCityDropdown(filtered.length > 0);
      }
    } catch (error) {
      console.error('Error searching cities:', error);
      toast.error('Error searching cities');
    } finally {
      setSearchingCities(false);
    }
  };

  // Debounce city search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (citySearchTerm) {
        searchCities(citySearchTerm);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [citySearchTerm]);

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setCitySearchTerm(formatCityName(city));
    setShowCityDropdown(false);
  };

  const formatCityName = (city) => {
    const address = city.address || {};
    const parts = [];
    
    if (address.city) parts.push(address.city);
    else if (address.town) parts.push(address.town);
    else if (address.village) parts.push(address.village);
    else if (city.name) parts.push(city.name);
    
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    
    return parts.join(', ');
  };

  const handleManualLocationUpdate = async () => {
    if (!manualEquipmentId) {
      toast.error('Please select equipment');
      return;
    }

    if (!selectedCity) {
      toast.error('Please select a city/location');
      return;
    }

    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/api/locations`, {
        method: 'POST',
        body: JSON.stringify({
          equipment_id: manualEquipmentId,
          latitude: parseFloat(selectedCity.lat),
          longitude: parseFloat(selectedCity.lon)
        })
      });

      if (response.ok) {
        toast.success(`Location updated to ${formatCityName(selectedCity)}`);
        // Reset form
        setManualEquipmentId('');
        setCitySearchTerm('');
        setSelectedCity(null);
        setCityResults([]);
        // Refresh location history if viewing the same equipment
        if (selectedEquipment === manualEquipmentId) {
          loadLocationHistory();
        }
      } else {
        toast.error('Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      toast.error('Error updating location');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner w-8 h-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fleet Location Tracking</h2>
          <p className="text-gray-600">
            {user?.role === 'fleet_owner' 
              ? 'Monitor your fleet with live GPS tracking and route history'
              : 'Update your current location for fleet tracking'}
          </p>
        </div>
      </div>

      {/* Tabs for different tracking views */}
      <Tabs defaultValue="live-map" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="live-map" data-testid="live-map-tab">
            <i className="fas fa-map mr-2"></i>
            Live Map View
          </TabsTrigger>
          <TabsTrigger value="manual-tracking" data-testid="manual-tracking-tab">
            <i className="fas fa-mobile-alt mr-2"></i>
            Manual Tracking
          </TabsTrigger>
        </TabsList>

        {/* Live Map Tab */}
        <TabsContent value="live-map" className="mt-6">
          <FeatureGate flag="live_tracking" fallback={<div className="p-6 border rounded text-center text-gray-600"><div className="text-lg font-semibold mb-2">Live Tracking is not enabled for your plan</div><div className="text-sm">Upgrade to TMS PRO or TMS Enterprise to enable live sockets and real-time map updates.</div></div>}>
            <LiveTrackingMap />
          </FeatureGate>
        </TabsContent>

        {/* Manual Tracking Tab */}
        <TabsContent value="manual-tracking" className="mt-6">
          <div className="space-y-6">
            {/* Manual Location Update Card - Fleet Owner Only */}
            {user?.role === 'fleet_owner' && (
              <Card className="dashboard-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="fas fa-map-pin mr-2 text-foreground"></i>
                    Manual Location Update
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Update the location of any asset in your fleet by selecting a city or town
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Equipment Selector */}
                    <div className="space-y-2">
                      <Label htmlFor="manual-equipment">Select Equipment *</Label>
                      <Select value={manualEquipmentId} onValueChange={setManualEquipmentId}>
                        <SelectTrigger id="manual-equipment">
                          <SelectValue placeholder="Choose an asset" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipment.map(eq => (
                            <SelectItem key={eq.id} value={eq.id}>
                              {eq.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* City Search with Autocomplete */}
                    <div className="space-y-2">
                      <Label htmlFor="city-search">Search City/Town (USA/Canada) *</Label>
                      <div className="relative">
                        <div className="relative">
                          <Input
                            id="city-search"
                            type="text"
                            value={citySearchTerm}
                            onChange={(e) => {
                              setCitySearchTerm(e.target.value);
                              setSelectedCity(null);
                            }}
                            onFocus={() => {
                              if (cityResults.length > 0) {
                                setShowCityDropdown(true);
                              }
                            }}
                            placeholder="Type city name (e.g., Chicago, Toronto)"
                            className="pr-10"
                          />
                          {searchingCities && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <i className="fas fa-spinner fa-spin text-gray-400"></i>
                            </div>
                          )}
                        </div>
                        
                        {/* Dropdown Results */}
                        {showCityDropdown && cityResults.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                            {cityResults.map((city, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => handleCitySelect(city)}
                                className="w-full text-left px-4 py-2 hover:bg-muted flex items-start justify-between border-b last:border-b-0"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm text-gray-900">
                                    {formatCityName(city)}
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {city.display_name}
                                  </div>
                                </div>
                                <i className="fas fa-map-marker-alt text-foreground ml-2 mt-1"></i>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {citySearchTerm && !searchingCities && cityResults.length === 0 && citySearchTerm.length >= 3 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                            <p className="text-sm text-gray-600 text-center">
                              <i className="fas fa-info-circle mr-2"></i>
                              No cities found. Try a different search term.
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {selectedCity && (
                        <div className="flex items-center space-x-2 mt-2 p-2 bg-muted border border-border rounded">
                          <i className="fas fa-check-circle text-foreground"></i>
                          <span className="text-sm text-foreground">
                            Selected: {formatCityName(selectedCity)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Update Button */}
                  <div className="mt-4 flex justify-end">
                    <Button 
                      onClick={handleManualLocationUpdate}
                      disabled={!manualEquipmentId || !selectedCity}
                      className="btn-primary"
                    >
                      <i className="fas fa-map-marked-alt mr-2"></i>
                      Update Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location History */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    <i className="fas fa-history mr-2 text-foreground"></i>
                    Location History
                  </span>
                  {selectedEquipment && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={loadLocationHistory}
                      data-testid="refresh-history-btn"
                    >
                      <i className="fas fa-sync-alt mr-2"></i>
                      Refresh
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedEquipment ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-3xl mb-4">
                      <i className="fas fa-map-marker-alt"></i>
                    </div>
                    <p className="text-gray-600">Select equipment to view location history</p>
                  </div>
                ) : locations.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-3xl mb-4">
                      <i className="fas fa-route"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Location Data</h3>
                    <p className="text-gray-600 mb-4">
                      No location history available for this equipment.
                    </p>
                    {!trackingEnabled && (
                      <Button 
                        onClick={toggleTracking}
                        className="btn-primary"
                        data-testid="start-tracking-from-history-btn"
                      >
                        <i className="fas fa-play mr-2"></i>
                        Start Tracking
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {locations.map((location, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`location-entry-${index}`}>
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <i className="fas fa-map-marker-alt text-foreground"></i>
                          </div>
                          <div>
                            <p className="font-mono text-sm text-foreground">
                              {formatLocation(location.latitude, location.longitude)}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(location.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openInMaps(location.latitude, location.longitude)}
                            data-testid={`view-location-btn-${index}`}
                          >
                            <i className="fas fa-external-link-alt mr-1"></i>
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LocationTracking;
