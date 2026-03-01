import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Fix for default marker icons in Leaflet with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create colored marker icons using SVG
const createMarkerIcon = (color, label) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="24" height="36">
      <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="6" fill="white"/>
      <text x="12" y="16" text-anchor="middle" font-size="10" font-weight="bold" fill="${color}">${label}</text>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-svg-marker',
    iconSize: [24, 36],
    iconAnchor: [12, 36],
    popupAnchor: [0, -36]
  });
};

// Component to fit map bounds to route
const FitBounds = ({ bounds }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length >= 2) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, bounds]);
  
  return null;
};

// Geocode address using Nominatim
const geocodeAddress = async (address) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

// Get route from OSRM
const getRoute = async (waypoints) => {
  try {
    const coords = waypoints.map(w => `${w[1]},${w[0]}`).join(';');
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        coordinates: route.geometry.coordinates.map(c => [c[1], c[0]]), // Convert to [lat, lng]
        distance: route.distance,
        duration: route.duration
      };
    }
    return null;
  } catch (error) {
    console.error('Routing error:', error);
    return null;
  }
};

const OSMMapPreview = ({ pickup, destination, stops, onRouteCalculated, calculateTrigger }) => {
  const [mapType, setMapType] = useState('street');
  const [markers, setMarkers] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [bounds, setBounds] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const lastCalculationRef = useRef(null);
  
  const defaultCenter = [39.8283, -98.5795]; // Center of US
  const defaultZoom = 4;

  const tileLayers = {
    street: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
    }
  };

  // Calculate route when inputs change or calculate is triggered
  useEffect(() => {
    const calculateRoute = async () => {
      if (!pickup || !destination) {
        setMarkers([]);
        setRoutePath([]);
        setBounds(null);
        return;
      }

      const calcKey = `${pickup}|${destination}|${(stops || []).join('|')}|${calculateTrigger}`;
      if (calcKey === lastCalculationRef.current || isCalculating) {
        return;
      }

      lastCalculationRef.current = calcKey;
      setIsCalculating(true);
      console.log('OSMMapPreview: Calculating route', { pickup, destination, stops });

      try {
        // Geocode all addresses
        const pickupCoords = await geocodeAddress(pickup);
        const destCoords = await geocodeAddress(destination);

        if (!pickupCoords || !destCoords) {
          toast.error('Could not find one or more locations');
          setIsCalculating(false);
          return;
        }

        // Geocode intermediate stops
        const stopCoords = [];
        for (const stop of (stops || [])) {
          const coords = await geocodeAddress(stop);
          if (coords) {
            stopCoords.push(coords);
          }
        }

        // Build waypoints array
        const allWaypoints = [pickupCoords, ...stopCoords, destCoords];

        // Create markers
        const newMarkers = allWaypoints.map((coords, index) => {
          const isStart = index === 0;
          const isEnd = index === allWaypoints.length - 1;
          const label = isStart ? 'A' : isEnd ? 'B' : String(index);
          const color = isStart ? '#22c55e' : isEnd ? '#ef4444' : '#3b82f6';
          return { position: coords, label, color };
        });
        setMarkers(newMarkers);

        // Set bounds to fit all markers
        setBounds(allWaypoints);

        // Get route from OSRM
        const route = await getRoute(allWaypoints);
        
        if (route) {
          setRoutePath(route.coordinates);
          
          const distanceMiles = (route.distance / 1609.34).toFixed(2);
          const durationHours = (route.duration / 3600).toFixed(2);
          
          console.log('OSMMapPreview: Route found', { distanceMiles, durationHours });
          
          if (onRouteCalculated) {
            onRouteCalculated({
              distance: `${distanceMiles} miles`,
              duration: `${durationHours} hours`,
              distanceValue: parseFloat(distanceMiles),
              durationValue: parseFloat(durationHours)
            });
          }
          toast.success(`Route: ${distanceMiles} miles, ~${durationHours} hours`);
        } else {
          toast.error('Could not calculate route');
        }
      } catch (error) {
        console.error('Route calculation error:', error);
        toast.error('Error calculating route');
      } finally {
        setIsCalculating(false);
      }
    };

    calculateRoute();
  }, [pickup, destination, stops, calculateTrigger, onRouteCalculated, isCalculating]);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-sm border border-border h-[480px]">
      {/* Map Type Toggle */}
      <div className="absolute top-3 right-3 z-[1000] flex gap-1 bg-background/90 backdrop-blur-sm rounded-lg p-1 shadow-md">
        <Button
          size="sm"
          variant={mapType === 'street' ? 'default' : 'ghost'}
          className="h-7 px-2 text-xs"
          onClick={() => setMapType('street')}
        >
          Map
        </Button>
        <Button
          size="sm"
          variant={mapType === 'satellite' ? 'default' : 'ghost'}
          className="h-7 px-2 text-xs"
          onClick={() => setMapType('satellite')}
        >
          Satellite
        </Button>
      </div>

      {/* Loading Indicator */}
      {isCalculating && (
        <div className="absolute top-3 left-3 z-[1000] bg-background/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-md flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-foreground">Calculating route...</span>
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ width: '100%', height: '100%' }}
        className="z-0"
      >
        <TileLayer
          key={mapType}
          url={tileLayers[mapType].url}
          attribution={tileLayers[mapType].attribution}
        />
        
        {/* Fit bounds to route */}
        {bounds && <FitBounds bounds={bounds} />}
        
        {/* Route polyline */}
        {routePath.length > 0 && (
          <Polyline
            positions={routePath}
            pathOptions={{
              color: '#F7B501',
              weight: 5,
              opacity: 0.8
            }}
          />
        )}
        
        {/* Markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={marker.position}
            icon={createMarkerIcon(marker.color, marker.label)}
          />
        ))}
      </MapContainer>

      {/* No route message overlay */}
      {(!pickup || !destination) && !isCalculating && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 pointer-events-none z-[500]">
          <div className="text-center text-muted-foreground">
            <i className="fas fa-map text-6xl mb-3 opacity-50"></i>
            <p className="text-sm font-medium mb-1">No route calculated</p>
            <p className="text-xs">Enter locations below to view route</p>
          </div>
        </div>
      )}

      {/* Add CSS for custom markers */}
      <style>{`
        .custom-svg-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default OSMMapPreview;
