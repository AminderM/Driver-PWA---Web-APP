import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const MobileDriverInterface = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [vehicleStatus, setVehicleStatus] = useState('idle');
  const [batteryLevel, setBatteryLevel] = useState(100);
  const watchIdRef = useRef(null);

  // Get WebSocket URL
  const getWebSocketUrl = () => {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
    const wsProtocol = backendUrl.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = backendUrl.replace(/^https?:\/\//, '');
    return `${wsProtocol}://${wsUrl}/ws/vehicle/${vehicleId}`;
  };

  const { sendMessage, lastMessage, readyState } = useWebSocket(
    vehicleId ? getWebSocketUrl() : null,
    {
      onOpen: () => {
        console.log('Vehicle WebSocket connected');
        toast.success(`Vehicle ${vehicleId?.substring(0, 8)} connected`);
      },
      onClose: () => {
        console.log('Vehicle WebSocket disconnected');
        toast.info('Disconnected from tracking server');
      },
      onError: (event) => {
        console.error('WebSocket error:', event);
        toast.error('Connection error');
      },
      shouldReconnect: (closeEvent) => true,
      reconnectAttempts: 10,
      reconnectInterval: 3000,
    }
  );

  // Handle incoming WebSocket messages
  useEffect(() => {
    if (lastMessage !== null) {
      try {
        const data = JSON.parse(lastMessage.data);
        console.log('Received message:', data);

        if (data.type === 'location_received') {
          console.log('Location update confirmed at:', data.timestamp);
        } else if (data.type === 'error') {
          toast.error(data.message || 'Error processing location');
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    }
  }, [lastMessage]);

  // Geolocation tracking
  useEffect(() => {
    if (isTracking && readyState === ReadyState.OPEN) {
      if ('geolocation' in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude, speed, heading, accuracy } = position.coords;
            
            const locationData = {
              latitude,
              longitude,
              speed: speed !== null ? speed * 3.6 : null, // Convert m/s to km/h
              heading: heading !== null ? heading : null,
              accuracy: accuracy !== null ? accuracy : null,
              timestamp: new Date().toISOString(),
            };

            setCurrentLocation(locationData);
            setLocationHistory(prev => [locationData, ...prev.slice(0, 19)]); // Keep last 20

            // Send location update via WebSocket
            sendMessage(JSON.stringify({
              type: 'location_update',
              payload: locationData,
            }));

            console.log('Location sent:', locationData);
          },
          (error) => {
            console.error('Geolocation error:', error);
            let message = 'Unable to get location';
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                message = 'Location permission denied';
                break;
              case error.POSITION_UNAVAILABLE:
                message = 'Location unavailable';
                break;
              case error.TIMEOUT:
                message = 'Location request timeout';
                break;
              default:
                message = 'Unknown geolocation error';
            }
            
            toast.error(message);
            setIsTracking(false);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        toast.error('Geolocation not supported by this browser');
        setIsTracking(false);
      }
    }

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isTracking, readyState, sendMessage]);

  const toggleTracking = () => {
    if (!vehicleId) {
      toast.error('No vehicle ID provided');
      return;
    }

    if (readyState !== ReadyState.OPEN) {
      toast.error('Not connected to tracking server');
      return;
    }

    setIsTracking(!isTracking);
    
    if (!isTracking) {
      toast.success('Location tracking started');
      setVehicleStatus('active');
    } else {
      toast.info('Location tracking stopped');
      setVehicleStatus('idle');
    }
  };

  const sendStatusUpdate = () => {
    if (readyState === ReadyState.OPEN) {
      sendMessage(JSON.stringify({
        type: 'status_update',
        payload: {
          status: vehicleStatus,
          battery: batteryLevel,
          signal_strength: 'good',
        },
      }));
      toast.success('Status update sent');
    } else {
      toast.error('Not connected');
    }
  };

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting...',
    [ReadyState.OPEN]: 'Connected',
    [ReadyState.CLOSING]: 'Closing...',
    [ReadyState.CLOSED]: 'Disconnected',
    [ReadyState.UNINSTANTIATED]: 'Not initialized',
  }[readyState];

  const formatLocation = (lat, lng) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (!vehicleId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-foreground">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">No vehicle ID provided</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Driver Interface</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Vehicle: {vehicleId.substring(0, 16)}...</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
                <i className="fas fa-home mr-2"></i>
                Dashboard
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Connection Status */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full ${readyState === ReadyState.OPEN ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="font-medium">{connectionStatus}</span>
              </div>
              <Badge variant={isTracking ? 'default' : 'secondary'}>
                {isTracking ? 'Tracking Active' : 'Tracking Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-sliders-h mr-2 text-foreground"></i>
              Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={toggleTracking}
                className={`h-20 text-lg ${isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                disabled={readyState !== ReadyState.OPEN}
              >
                <i className={`fas ${isTracking ? 'fa-stop' : 'fa-play'} mr-2`}></i>
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </Button>
              
              <Button
                onClick={sendStatusUpdate}
                className="h-20 text-lg"
                variant="outline"
                disabled={readyState !== ReadyState.OPEN}
              >
                <i className="fas fa-paper-plane mr-2"></i>
                Send Status Update
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Vehicle Status</label>
              <select
                value={vehicleStatus}
                onChange={(e) => setVehicleStatus(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="idle">Idle</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Battery Level: {batteryLevel}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={batteryLevel}
                onChange={(e) => setBatteryLevel(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Current Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-map-marker-alt mr-2 text-foreground"></i>
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentLocation ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Coordinates</p>
                    <p className="font-mono">{formatLocation(currentLocation.latitude, currentLocation.longitude)}</p>
                  </div>
                  {currentLocation.speed !== null && (
                    <div>
                      <p className="text-gray-600">Speed</p>
                      <p className="font-semibold">{currentLocation.speed.toFixed(1)} km/h</p>
                    </div>
                  )}
                  {currentLocation.heading !== null && (
                    <div>
                      <p className="text-gray-600">Heading</p>
                      <p className="font-semibold">{currentLocation.heading.toFixed(0)}°</p>
                    </div>
                  )}
                  {currentLocation.accuracy !== null && (
                    <div>
                      <p className="text-gray-600">Accuracy</p>
                      <p className="font-semibold">{currentLocation.accuracy.toFixed(0)}m</p>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://www.google.com/maps?q=${currentLocation.latitude},${currentLocation.longitude}`, '_blank')}
                >
                  <i className="fas fa-external-link-alt mr-2"></i>
                  View on Google Maps
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-location-arrow text-4xl mb-4"></i>
                <p>No location data yet</p>
                <p className="text-sm mt-2">Start tracking to see your location</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <i className="fas fa-history mr-2 text-foreground"></i>
              Recent Updates ({locationHistory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locationHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <i className="fas fa-clock text-4xl mb-4"></i>
                <p>No location history yet</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {locationHistory.map((loc, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center text-sm">
                    <div>
                      <p className="font-mono text-xs">{formatLocation(loc.latitude, loc.longitude)}</p>
                      <p className="text-gray-600 text-xs">{formatTimestamp(loc.timestamp)}</p>
                    </div>
                    {loc.speed !== null && (
                      <Badge variant="outline">{loc.speed.toFixed(1)} km/h</Badge>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileDriverInterface;
