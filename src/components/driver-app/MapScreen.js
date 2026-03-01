import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useDriverApp } from './DriverAppProvider';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const pickupIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background: #22c55e; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const deliveryIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background: #ef4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const driverIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background: #3b82f6; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 10px rgba(0,0,0,0.3);">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

// City coordinates database (simplified)
const CITY_COORDS = {
  'chicago,il': [41.8781, -87.6298],
  'detroit,mi': [42.3314, -83.0458],
  'indianapolis,in': [39.7684, -86.1581],
  'columbus,oh': [39.9612, -82.9988],
  'cleveland,oh': [41.4993, -81.6944],
  'pittsburgh,pa': [40.4406, -79.9959],
  'milwaukee,wi': [43.0389, -87.9065],
  'st louis,mo': [38.6270, -90.1994],
  'minneapolis,mn': [44.9778, -93.2650],
  'cincinnati,oh': [39.1031, -84.5120],
  'louisville,ky': [38.2527, -85.7585],
  'nashville,tn': [36.1627, -86.7816],
  'memphis,tn': [35.1495, -90.0490],
  'atlanta,ga': [33.7490, -84.3880],
  'dallas,tx': [32.7767, -96.7970],
  'houston,tx': [29.7604, -95.3698],
  'denver,co': [39.7392, -104.9903],
  'phoenix,az': [33.4484, -112.0740],
  'los angeles,ca': [34.0522, -118.2437],
  'san francisco,ca': [37.7749, -122.4194],
  'seattle,wa': [47.6062, -122.3321],
  'portland,or': [45.5152, -122.6784],
  'kansas city,mo': [39.0997, -94.5786],
  'omaha,ne': [41.2565, -95.9345],
  'des moines,ia': [41.5868, -93.6250],
};

const getCityCoords = (city, state) => {
  const key = `${city?.toLowerCase()},${state?.toLowerCase()}`;
  return CITY_COORDS[key] || [41.8781, -87.6298]; // Default to Chicago
};

// Map bounds fitter component
const FitBounds = ({ bounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  return null;
};

const MapScreen = ({ load, onBack, onStartNavigation }) => {
  const { currentLocation } = useDriverApp();
  const [routeInfo, setRouteInfo] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Get coordinates
  const pickupCoords = getCityCoords(
    load.pickup_city || load.origin_city,
    load.pickup_state || load.origin_state
  );
  const deliveryCoords = getCityCoords(
    load.delivery_city || load.destination_city,
    load.delivery_state || load.destination_state
  );
  const driverCoords = currentLocation 
    ? [currentLocation.lat, currentLocation.lng]
    : pickupCoords; // Default to pickup if no location

  // Calculate route info
  useEffect(() => {
    const distance = Math.sqrt(
      Math.pow(deliveryCoords[0] - pickupCoords[0], 2) +
      Math.pow(deliveryCoords[1] - pickupCoords[1], 2)
    ) * 69; // Rough miles conversion
    
    const estimatedMiles = Math.round(distance * 1.3); // Add 30% for road distance
    const estimatedTime = Math.ceil(estimatedMiles / 55); // ~55 mph average
    
    setRouteInfo({
      miles: estimatedMiles,
      hours: estimatedTime,
      minutes: (estimatedMiles / 55 * 60) % 60
    });
  }, [pickupCoords, deliveryCoords]);

  // Route line
  const routeLine = [pickupCoords, deliveryCoords];
  const driverToPickup = [driverCoords, pickupCoords];

  const handleOpenMaps = () => {
    const destination = `${load.delivery_city || load.destination_city}, ${load.delivery_state || load.destination_state}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Map Container */}
      <div className="relative flex-1">
        <MapContainer
          center={pickupCoords}
          zoom={8}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Fit map to show all points */}
          <FitBounds bounds={[driverCoords, pickupCoords, deliveryCoords]} />
          
          {/* Route line - Pickup to Delivery */}
          <Polyline
            positions={routeLine}
            color="#3b82f6"
            weight={4}
            opacity={0.8}
            dashArray="10, 10"
          />
          
          {/* Driver to Pickup line */}
          {currentLocation && (
            <Polyline
              positions={driverToPickup}
              color="#22c55e"
              weight={3}
              opacity={0.6}
            />
          )}
          
          {/* Driver marker */}
          <Marker position={driverCoords} icon={driverIcon}>
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
          
          {/* Pickup marker */}
          <Marker position={pickupCoords} icon={pickupIcon}>
            <Popup>
              <div>
                <strong className="text-green-600">Pickup</strong><br />
                {load.pickup_city}, {load.pickup_state}<br />
                {load.pickup_location}
              </div>
            </Popup>
          </Marker>
          
          {/* Delivery marker */}
          <Marker position={deliveryCoords} icon={deliveryIcon}>
            <Popup>
              <div>
                <strong className="text-red-600">Delivery</strong><br />
                {load.delivery_city}, {load.delivery_state}<br />
                {load.delivery_location}
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        {/* Back button overlay */}
        <button
          onClick={onBack}
          className="absolute top-4 left-4 z-[1000] w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center shadow-lg"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Load info overlay */}
        <div className="absolute top-4 right-4 z-[1000] bg-gray-900/90 backdrop-blur rounded-xl px-4 py-2">
          <p className="text-white font-bold">{load.order_number || `#${load.id?.slice(0, 6)}`}</p>
        </div>
      </div>

      {/* Bottom Panel */}
      <div className="bg-gray-900 border-t border-gray-800 p-4 safe-area-bottom">
        {/* Route Summary */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-400 text-xs">TOTAL DISTANCE</p>
            <p className="text-white text-2xl font-bold">{routeInfo?.miles || '--'} mi</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">EST. TIME</p>
            <p className="text-white text-2xl font-bold">{routeInfo?.hours || '--'}h {Math.round(routeInfo?.minutes || 0)}m</p>
          </div>
        </div>

        {/* Route stops */}
        <div className="flex items-center gap-3 mb-4 bg-gray-800 rounded-xl p-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <div className="w-0.5 h-8 bg-gray-600"></div>
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
          </div>
          <div className="flex-1">
            <p className="text-white text-sm font-medium">{load.pickup_city}, {load.pickup_state}</p>
            <p className="text-gray-600 text-xs my-1">↓</p>
            <p className="text-white text-sm font-medium">{load.delivery_city}, {load.delivery_state}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleOpenMaps}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Open in Google Maps
          </button>
        </div>
      </div>
    </div>
  );
};

export default MapScreen;
