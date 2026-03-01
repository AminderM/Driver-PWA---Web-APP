import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';

const PlacesAutocomplete = ({ 
  value, 
  onChange, 
  placeholder, 
  apiKey,
  className = "",
  onKeyDown,
  onBlur
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Add CSS to control pac-container z-index
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .pac-container {
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    };
  }, []);

  useEffect(() => {
    if (!apiKey || !window.google || !window.google.maps) {
      console.log('PlacesAutocomplete: Google Maps not ready yet, apiKey:', !!apiKey);
      return;
    }

    // Wait for Places library to load with retry mechanism
    const initPlaces = () => {
      if (!window.google.maps.places) {
        console.log('PlacesAutocomplete: Waiting for Places library...');
        setTimeout(initPlaces, 100);
        return;
      }
      
      console.log('PlacesAutocomplete: Places library loaded successfully');
      setIsLoaded(true);

      // Clear any existing autocomplete
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }

      // Initialize autocomplete after library is loaded
      try {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['geocode', 'establishment'],
          fields: ['formatted_address', 'geometry', 'name', 'address_components']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log('PlacesAutocomplete: Place selected:', place);
          
          let selectedValue = '';
          if (place.formatted_address) {
            selectedValue = place.formatted_address;
          } else if (place.name) {
            selectedValue = place.name;
          } else if (inputRef.current) {
            // Fallback to input value if place data is incomplete
            selectedValue = inputRef.current.value;
          }
          
          if (selectedValue && onChangeRef.current) {
            console.log('PlacesAutocomplete: Updating value to:', selectedValue);
            onChangeRef.current(selectedValue);
          }
        });

        autocompleteRef.current = autocomplete;
        console.log('PlacesAutocomplete: Initialized successfully');
      } catch (error) {
        console.error('PlacesAutocomplete: Error initializing:', error);
      }
    };
    
    initPlaces();

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [apiKey]); // Only depend on apiKey, not onChange

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const handleBlur = (e) => {
    // Hide autocomplete dropdown on blur after a delay
    // Delay allows clicking on autocomplete suggestions to work
    setTimeout(() => {
      const pacContainers = document.querySelectorAll('.pac-container');
      pacContainers.forEach(container => {
        container.style.display = 'none';
      });
    }, 300);
    
    if (onBlur) {
      onBlur(e);
    }
  };

  return (
    <Input
      ref={inputRef}
      type="text"
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

export default PlacesAutocomplete;
