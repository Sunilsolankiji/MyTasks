'use client';

import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Zap } from 'lucide-react';
import { type GetWeatherOutput, getWeather } from '@/ai/flows/weather-flow';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WeatherEffectProps {
  location: string;
}

const weatherIcons = {
  sunny: <Sun className="h-5 w-5 text-yellow-400" />,
  cloudy: <Cloud className="h-5 w-5 text-gray-400" />,
  rainy: <CloudRain className="h-5 w-5 text-blue-400" />,
  snowy: <CloudSnow className="h-5 w-5 text-white" />,
  windy: <Wind className="h-5 w-5 text-gray-500" />,
  stormy: <Zap className="h-5 w-5 text-yellow-500" />,
  unknown: <div className="h-5 w-5" />,
};

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

export function WeatherEffect({ location }: WeatherEffectProps) {
  const [weather, setWeather] = useState<GetWeatherOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!location) {
        setIsLoading(false);
        setWeather(null);
        return;
    };

    setIsLoading(true);
    const timer = setTimeout(() => {
        getWeather({ location })
        .then(setWeather)
        .catch(console.error)
        .finally(() => setIsLoading(false));
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


  if (!location) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }

  if (!weather) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        Could not fetch weather.
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-md border bg-background">
        {renderEffect()}
        <TooltipProvider>
        <Tooltip>
            <TooltipTrigger asChild>
            <div className="relative flex items-center gap-2 px-3 py-2 text-sm z-10">
                {weatherIcons[weather.condition]}
                <span className="font-medium">{weather.temperature}°C</span>
                <span className="hidden md:inline text-muted-foreground">{weather.location}</span>
            </div>
            </TooltipTrigger>
            <TooltipContent>
            <p>{weather.description}</p>
            </TooltipContent>
        </Tooltip>
        </TooltipProvider>
    </div>
  );
}
