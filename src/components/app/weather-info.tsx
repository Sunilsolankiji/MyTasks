'use client';

import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getWeather, type GetWeatherOutput, type WeatherCondition } from '@/ai/flows/get-weather-flow';

interface WeatherInfoProps {
  location: string;
}

const weatherIcons: Record<WeatherCondition, React.ReactNode> = {
  sunny: <Sun className="h-5 w-5 text-yellow-400" />,
  cloudy: <Cloud className="h-5 w-5 text-gray-400" />,
  rainy: <CloudRain className="h-5 w-5 text-blue-400" />,
  snowy: <CloudSnow className="h-5 w-5 text-white" />,
  stormy: <Zap className="h-5 w-5 text-yellow-500" />,
  unknown: <div className="h-5 w-5" />,
};

export function WeatherInfo({ location }: WeatherInfoProps) {
  const [weather, setWeather] = useState<GetWeatherOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) {
        setIsLoading(false);
        setWeather(null);
        setError(null);
        return;
    };

    setIsLoading(true);
    setError(null);
    
    const timer = setTimeout(async () => {
        try {
            const weatherData = await getWeather({ location });
            setWeather(weatherData);
        } catch (e) {
            console.error("Failed to get weather:", e);
            const errorMessage = e instanceof Error ? e.message : "Could not get weather data.";
            if (errorMessage.includes("key")) {
                setError("Weather API key not configured.");
            } else if (errorMessage.includes("Location not found")) {
                setError("Location not found.");
            } else {
                setError("Could not get weather.");
            }
            setWeather(null);
        } finally {
            setIsLoading(false);
        }
    }, 500); // Debounce API calls

    return () => clearTimeout(timer);
  }, [location]);
  
  if (!location) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }

  if (error) {
    return (
      <div className="flex items-center text-sm text-destructive-foreground bg-destructive/90 p-2 rounded-md">
        {error}
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-md border bg-background/50 backdrop-blur-sm">
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
