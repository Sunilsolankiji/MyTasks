'use client';

import { useState, useEffect } from 'react';
import { WeatherEffect } from './weather-effect';

export function AppBackground() {
  const [location, setLocation] = useState<string | null>(null);

  useEffect(() => {
    const updateLocation = () => {
      const storedLocation = localStorage.getItem('location');
      if (storedLocation) {
        try {
          const parsedLocation = JSON.parse(storedLocation);
          if (typeof parsedLocation === 'string' && parsedLocation.trim() !== '') {
            setLocation(parsedLocation);
          } else {
            setLocation(null);
          }
        } catch (e) {
          setLocation(null);
        }
      } else {
        setLocation(null); 
      }
    };

    updateLocation();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'location') {
        updateLocation();
      }
    };

    const handleLocationUpdate = () => {
        updateLocation();
    }

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('location-updated', handleLocationUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('location-updated', handleLocationUpdate);
    };
  }, []);

  if (!location) {
    return null;
  }

  return <WeatherEffect location={location} />;
}
