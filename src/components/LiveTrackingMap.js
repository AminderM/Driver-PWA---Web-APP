import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom vehicle icon
const vehicleIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Component to update map center when vehicles change
function MapUpdater({ vehicles }) {
  const map = useMap();
  
  useEffect(() => {
    if (vehicles.length > 0) {
      const bounds = L.latLngBounds(
        vehicles
          .filter(v => v.latitude && v.longitude)
          .map(v => [v.latitude, v.longitude])
      );
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [vehicles, map]);
  
  return null;
}

import { useFeatures } from '@/contexts/FeaturesContext';

const LiveTrackingMap = () => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const flags = useFeatures ? useFeatures() : {};

  const mapRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  // Fetch equipment locations via API (fallback/initial load)
  const fetchEquipmentLocations = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/api/equipment/my/locations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Only update if we have data and filter out vehicles without coordinates
        const validVehicles = data.filter(v => v.latitude && v.longitude);
        if (validVehicles.length > 0) {
          setVehicles(validVehicles);
        }
      }
    } catch (error) {
      console.error('Error fetching equipment locations:', error);
    }
  };

  // Fetch locations on component mount
  useEffect(() => {
    fetchEquipmentLocations();
  }, []);

  // Get WebSocket URL from environment
  const getWebSocketUrl = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = backendUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${wsUrl}/ws/fleet-tracking`;
  };

  const wsDisabled = flags && flags.live_tracking === false;
  const { sendMessage, lastMessage, readyState } = useWebSocket(wsDisabled ? null : getWebSocketUrl(), {
    onOpen: () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      toast.success('Live tracking connected');
    },
    onClose: () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
      toast.info('Live tracking disconnected');
    },
    onError: (event) => {
      console.error('WebSocket error:', event);
      toast.error('Connection error - check if backend is running');
    },
    shouldReconnect: (closeEvent) => true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const data = JSON.parse(lastMessage.data);
        console.log('Received message:', data);

        if (data.type === 'location_update') {
          const payload = data.payload;
          setVehicles(prev => {
            const existingIndex = prev.findIndex(v => v.vehicle_id === payload.vehicle_id);
            
            if (existingIndex >= 0) {
              // Update existing vehicle
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                latitude: payload.latitude,
                longitude: payload.longitude,
                speed: payload.speed,
                heading: payload.heading,
                timestamp: payload.timestamp,
              };
              return updated;
            } else {
              // Add new vehicle
              return [...prev, {
                vehicle_id: payload.vehicle_id,
                latitude: payload.latitude,
                longitude: payload.longitude,
                speed: payload.speed,
                heading: payload.heading,
                timestamp: payload.timestamp,
                name: `Vehicle ${payload.vehicle_id.substring(0, 8)}`,
              }];
            }
          });
        } else if (data.type === 'fleet_status') {
          // Handle fleet status updates
          const statusVehicles = data.payload.map(v => ({
            vehicle_id: v.vehicle_id,
            name: v.name,
            latitude: v.latitude,
            longitude: v.longitude,
            status: v.status,
            last_update: v.last_update,
          })).filter(v => v.latitude && v.longitude);
          
          setVehicles(statusVehicles);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  // Request fleet status on connection
  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      sendMessage(JSON.stringify({ type: 'request_status' }));
    }
  }, [readyState, sendMessage]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting...',
    [ReadyState.OPEN]: 'Connected',
    [ReadyState.CLOSING]: 'Closing...',
    [ReadyState.CLOSED]: 'Disconnected',
    [ReadyState.UNINSTANTIATED]: 'Not initialized',
  }[readyState];

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const formatSpeed = (speed) => {
    if (!speed && speed !== 0) return 'N/A';
    return `${speed.toFixed(1)} km/h`;
  };

  const refreshStatus = () => {
    if (readyState === ReadyState.OPEN) {
      sendMessage(JSON.stringify({ type: 'request_status' }));
      toast.success('Refreshing fleet status...');
    } else {
      // If WebSocket is not connected, fetch via API
      fetchEquipmentLocations();
      toast.success('Refreshing from API...');
    }
  };

  // Default map center (San Francisco)
  const defaultCenter = [37.7749, -122.4194];
  const mapCenter = vehicles.length > 0 && vehicles[0].latitude && vehicles[0].longitude
    ? [vehicles[0].latitude, vehicles[0].longitude]
    : defaultCenter;

  return (
    <div className="space-y-4">
      {/* Connection Status Bar */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="font-medium">{connectionStatus}</span>
              </div>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                <i className="fas fa-satellite-dish mr-2"></i>
                {vehicles.length} Vehicles
              </Badge>
            </div>
            <Button onClick={refreshStatus} size="sm" variant="outline" disabled={!isConnected}>
              <i className="fas fa-sync-alt mr-2"></i>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-map-marked-alt mr-2 text-foreground"></i>
            Live Fleet Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ height: '500px', width: '100%' }} className="rounded-lg overflow-hidden">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              ref={mapRef}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapUpdater vehicles={vehicles} />
              
              {vehicles.map((vehicle) => (
                vehicle.latitude && vehicle.longitude && (
                  <Marker
                    key={vehicle.vehicle_id}
                    position={[vehicle.latitude, vehicle.longitude]}
                    icon={vehicleIcon}
                    eventHandlers={{
                      click: () => setSelectedVehicle(vehicle),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[250px]">
                        <h3 className="font-bold text-lg mb-3 text-blue-700 border-b pb-2">
                          {vehicle.name || `Vehicle ${vehicle.vehicle_id.substring(0, 8)}`}
                        </h3>
                        <div className="space-y-2 text-sm">
                          {/* Asset Number */}
                          <div className="flex justify-between">
                            <span className="font-semibold text-gray-700">Asset #:</span>
                            <span className="text-gray-900">{vehicle.asset_number ? vehicle.asset_number.substring(0, 8) : 'N/A'}</span>
                          </div>
                          
                          {/* Load Number */}
                          {vehicle.load_number && (
                            <div className="flex justify-between bg-yellow-50 px-2 py-1 rounded">
                              <span className="font-semibold text-gray-700">Load #:</span>
                              <span className="text-gray-900 font-bold">{vehicle.load_number}</span>
                            </div>
                          )}
                          
                          {/* Driver Information */}
                          {vehicle.driver_name ? (
                            <div className="border-t pt-2 mt-2">
                              <p className="font-semibold text-gray-700 mb-1">Driver Information:</p>
                              <div className="pl-2 space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Driver #:</span>
                                  <span className="text-gray-900">{vehicle.driver_id ? vehicle.driver_id.substring(0, 8) : 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Name:</span>
                                  <span className="text-gray-900">{vehicle.driver_name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Phone:</span>
                                  <span className="text-gray-900">{vehicle.driver_phone || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between text-gray-500 italic">
                              <span>No driver assigned</span>
                            </div>
                          )}
                          
                          {/* Position */}
                          <div className="border-t pt-2 mt-2">
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-700">Position:</span>
                              <span className="text-gray-900 text-xs font-mono">{vehicle.latitude.toFixed(4)}, {vehicle.longitude.toFixed(4)}</span>
                            </div>
                          </div>
                          
                          {/* Speed */}
                          {vehicle.speed !== undefined && (
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-700">Speed:</span>
                              <span className="text-gray-900">{formatSpeed(vehicle.speed)}</span>
                            </div>
                          )}
                          
                          {/* Last Update */}
                          {vehicle.timestamp && (
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-700">Last Update:</span>
                              <span className="text-gray-900">{formatTimestamp(vehicle.timestamp)}</span>
                            </div>
                          )}
                          
                          {/* Status */}
                          <div className="flex justify-between items-center pt-2 border-t">
                            <span className="font-semibold text-gray-700">Status:</span>
                            <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                              {vehicle.status || 'Active'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <i className="fas fa-list mr-2 text-foreground"></i>
            Active Vehicles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-truck text-4xl mb-4"></i>
              <p>No vehicles currently being tracked</p>
              <p className="text-sm mt-2">Vehicles will appear here when they connect</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.vehicle_id}
                  className={`p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow ${
                    selectedVehicle?.vehicle_id === vehicle.vehicle_id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{vehicle.name || `Vehicle ${vehicle.vehicle_id.substring(0, 8)}`}</h4>
                      <p className="text-xs text-gray-500 mt-1">Asset #: {vehicle.asset_number ? vehicle.asset_number.substring(0, 8) : 'N/A'}</p>
                    </div>
                    <Badge variant={vehicle.status === 'active' ? 'default' : 'secondary'}>
                      {vehicle.status || 'Active'}
                    </Badge>
                  </div>
                  
                  {vehicle.load_number && (
                    <div className="bg-yellow-50 px-2 py-1 rounded mb-2 text-sm">
                      <strong className="text-gray-700">Load #:</strong> {vehicle.load_number}
                    </div>
                  )}
                  
                  {vehicle.driver_name && (
                    <div className="text-sm text-gray-700 mb-2 pb-2 border-b">
                      <p className="font-semibold mb-1">Driver:</p>
                      <p className="text-xs">{vehicle.driver_name}</p>
                      {vehicle.driver_phone && (
                        <p className="text-xs text-gray-600">{vehicle.driver_phone}</p>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                    {vehicle.speed !== undefined && (
                      <p><i className="fas fa-tachometer-alt mr-2 text-foreground"></i>{formatSpeed(vehicle.speed)}</p>
                    )}
                    {vehicle.timestamp && (
                      <p><i className="fas fa-clock mr-2 text-foreground"></i>{formatTimestamp(vehicle.timestamp)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveTrackingMap;
