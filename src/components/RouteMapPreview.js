import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, Marker, useMap } from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Component to handle route rendering
const RouteRenderer = ({ pickup, destination, stops, onRouteCalculated, calculateTrigger }) => {
  const map = useMap();
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [lastCalculatedRoute, setLastCalculatedRoute] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastTrigger, setLastTrigger] = useState(0);

  // Reset last calculated route when calculateTrigger changes to force recalculation
  useEffect(() => {
    if (calculateTrigger && calculateTrigger !== lastTrigger) {
      console.log('Calculate trigger changed, forcing recalculation');
      setLastCalculatedRoute(null);
      setLastTrigger(calculateTrigger);
    }
  }, [calculateTrigger, lastTrigger]);

  useEffect(() => {
    if (!map) return;

    const service = new window.google.maps.DirectionsService();
    const renderer = new window.google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: false,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: '#F7B501',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });

    setDirectionsService(service);
    setDirectionsRenderer(renderer);

    return () => {
      if (renderer) {
        renderer.setMap(null);
      }
    };
  }, [map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !pickup || !destination) {
      console.log('RouteRenderer: Missing required deps', { 
        hasService: !!directionsService, 
        hasRenderer: !!directionsRenderer, 
        pickup, 
        destination 
      });
      return;
    }
    
    // Create a unique key for this route
    const routeKey = `${pickup}|${destination}|${(stops || []).join('|')}`;
    
    // Don't recalculate if it's the same route or already calculating
    if (routeKey === lastCalculatedRoute || isCalculating) {
      console.log('RouteRenderer: Skipping calculation', { routeKey, lastCalculatedRoute, isCalculating });
      return;
    }
    
    console.log('RouteRenderer: Calculating route', { pickup, destination, stops });
    setIsCalculating(true);

    const waypoints = (stops || []).map(stop => ({
      location: stop,
      stopover: true
    }));

    const request = {
      origin: pickup,
      destination: destination,
      waypoints: waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.IMPERIAL
    };

    directionsService.route(request, (result, status) => {
      console.log('RouteRenderer: Direction result', { status });
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        console.log('RouteRenderer: Route rendered successfully');
        
        // Calculate total distance and duration
        const route = result.routes[0];
        let totalDistance = 0;
        let totalDuration = 0;

        route.legs.forEach(leg => {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        });

        // Convert to miles and hours
        const distanceMiles = (totalDistance / 1609.34).toFixed(2);
        const durationHours = (totalDuration / 3600).toFixed(2);

        // Mark this route as calculated
        setLastCalculatedRoute(routeKey);

        if (onRouteCalculated) {
          onRouteCalculated({
            distance: `${distanceMiles} miles`,
            duration: `${durationHours} hours`,
            distanceValue: parseFloat(distanceMiles),
            durationValue: parseFloat(durationHours)
          });
        }
      } else {
        console.error('Directions request failed:', status);
        toast.error('Failed to calculate route');
      }
      setIsCalculating(false);
    });
  }, [directionsService, directionsRenderer, pickup, destination, stops, onRouteCalculated, lastCalculatedRoute, isCalculating, calculateTrigger]);

  return null;
};

const RouteMapPreview = ({ pickup, destination, stops, onRouteCalculated, apiKey, calculateTrigger }) => {
  const [mapCenter, setMapCenter] = useState({ lat: 39.8283, lng: -98.5795 }); // Center of US
  const [mapZoom, setMapZoom] = useState(4);
  const [lastGeocodedPickup, setLastGeocodedPickup] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  useEffect(() => {
    // Only geocode if pickup changed and we're not already geocoding
    if (pickup && pickup !== lastGeocodedPickup && !isGeocoding && window.google?.maps) {
      setIsGeocoding(true);
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: pickup }, (results, status) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          setMapCenter({ lat: location.lat(), lng: location.lng() });
          setMapZoom(8);
          setLastGeocodedPickup(pickup);
        }
        setIsGeocoding(false);
      });
    }
  }, [pickup, lastGeocodedPickup, isGeocoding]);

  if (!apiKey) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[480px] flex items-center justify-center">
        <div className="text-center text-gray-400">
          <i className="fas fa-map text-6xl mb-3 opacity-50"></i>
          <p className="text-sm font-medium text-gray-600 mb-1">Google Maps not configured</p>
          <p className="text-xs text-gray-500">Please add Google Maps API key in Admin Console</p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider 
      apiKey={apiKey}
      libraries={['places']}
      onLoad={() => console.log('Google Maps API loaded successfully')}
      onError={(error) => console.error('Google Maps API error:', error)}
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-[480px] flex flex-col">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <h4 className="text-sm font-semibold text-gray-800">Route Preview</h4>
          {pickup && destination && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-gray-600 hover:text-gray-900"
              onClick={() => {
                const url = `https://www.google.com/maps/dir/${encodeURIComponent(pickup)}/${encodeURIComponent(destination)}`;
                window.open(url, '_blank');
              }}
            >
              <i className="fas fa-external-link-alt mr-1.5"></i>
              Open in Maps
            </Button>
          )}
        </div>
        <div className="flex-1 relative">
          <Map
            mapId="route-preview-map"
            defaultCenter={mapCenter}
            defaultZoom={mapZoom}
            disableDefaultUI={false}
            gestureHandling="greedy"
            style={{ width: '100%', height: '100%' }}
          >
            {pickup && destination && (
              <RouteRenderer
                pickup={pickup}
                destination={destination}
                stops={stops}
                onRouteCalculated={onRouteCalculated}
                calculateTrigger={calculateTrigger}
              />
            )}
          </Map>
          
          {(!pickup || !destination) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 pointer-events-none">
              <div className="text-center text-gray-400">
                <i className="fas fa-map text-6xl mb-3 opacity-50"></i>
                <p className="text-sm font-medium text-gray-600 mb-1">No route calculated</p>
                <p className="text-xs text-gray-500">Enter locations below to view route</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </APIProvider>
  );
};

export default RouteMapPreview;
