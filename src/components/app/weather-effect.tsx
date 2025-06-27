'use client';

import { useState, useEffect } from 'react';
import { getWeather, type GetWeatherOutput } from '@/ai/flows/get-weather-flow';

const Rain = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(50)].map((_, i) => (
      <div
        key={i}
        className="absolute bg-blue-300 rounded-full"
        style={{
          width: '2px',
          height: '10px',
          left: `${Math.random() * 100}%`,
          top: `-${Math.random() * 20}%`,
          animation: `fall ${Math.random() * 1 + 1}s linear ${Math.random() * 2}s infinite`,
          opacity: Math.random() * 0.5 + 0.3,
        }}
      />
    ))}
  </div>
);

const Snow = () => (
  <div className="absolute inset-0 pointer-events-none">
    {[...Array(50)].map((_, i) => (
      <div
        key={i}
        className="absolute bg-white rounded-full"
        style={{
          width: '4px',
          height: '4px',
          left: `${Math.random() * 100}%`,
          top: `-${Math.random() * 20}%`,
          animation: `fall ${Math.random() * 5 + 5}s linear ${Math.random() * 5}s infinite`,
          opacity: Math.random() * 0.8 + 0.2,
        }}
      />
    ))}
  </div>
);

export function WeatherEffect({ location }: { location: string }) {
  const [weather, setWeather] = useState<GetWeatherOutput | null>(null);

  useEffect(() => {
    if (!location) {
        setWeather(null);
        return;
    };

    const timer = setTimeout(async () => {
        try {
            const weatherData = await getWeather({ location });
            setWeather(weatherData);
        } catch (e) {
            console.error("Failed to get weather:", e);
            setWeather(null);
        }
    }, 500); // Debounce API calls

    return () => clearTimeout(timer);
  }, [location]);
  
  const renderEffect = () => {
    if (!weather || weather.condition === 'unknown') return null;
    switch (weather.condition) {
      case 'rainy':
        return <Rain />;
      case 'snowy':
        return <Snow />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 -z-50 pointer-events-none">
      {renderEffect()}
    </div>
  );
}
