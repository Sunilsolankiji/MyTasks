'use client';

import { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, Wind, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Types for weather data
const weatherConditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy', 'unknown'] as const;
type WeatherCondition = (typeof weatherConditions)[number];

interface GetWeatherOutput {
  condition: WeatherCondition;
  temperature: number;
  location: string;
  description: string;
}

// Mock weather API call
async function fetchWeatherFromAPI(location: string): Promise<{ condition: WeatherCondition; temperature: number }> {
    console.log(`Fetching weather for ${location} (mocked)`);
    const conditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy'] as const;
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomTemp = Math.floor(Math.random() * 35); // Temp between 0 and 34 C
    return {
      condition: randomCondition,
      temperature: randomTemp,
    };
}

// Augment the global Window interface for window.ai, which is experimental
declare global {
  interface Window {
    ai?: {
      canCreateTextSession: () => Promise<'readily' | 'after-permission' | 'no'>;
      createTextSession: () => Promise<{
        prompt: (prompt: string) => Promise<string>;
        destroy: () => void;
      }>;
    };
  }
}

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
            const weatherData = await fetchWeatherFromAPI(location);
            let description: string;
            const prompt = `The weather in ${location} is ${weatherData.condition} with a temperature of ${weatherData.temperature}°C. Write a short, friendly sentence describing this weather.`;

            if (window.ai && (await window.ai.canCreateTextSession()) === 'readily') {
                const session = await window.ai.createTextSession();
                description = await session.prompt(prompt);
                session.destroy();
            } else {
                description = `The weather is ${weatherData.condition} with a temperature of ${weatherData.temperature}°C.`;
                console.log("On-device AI not available or not permitted. Using a default description.");
            }
            
            setWeather({
                ...weatherData,
                location,
                description,
            });
        } catch (e) {
            console.error("Failed to get weather or generate description:", e);
            setError("Could not get weather data.");
            setWeather(null);
        } finally {
            setIsLoading(false);
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

  if (!location) {
    return null;
  }

  if (isLoading) {
    return <Skeleton className="h-10 w-48" />;
  }

  if (error) {
    return (
      <div className="flex items-center text-sm text-muted-foreground p-2">
        {error}
      </div>
    );
  }

  if (!weather) {
    return null;
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
