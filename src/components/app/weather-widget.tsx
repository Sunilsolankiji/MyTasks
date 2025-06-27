"use client";

import { useEffect, useState } from "react";
import { Loader2, MapPin, Droplets, Wind } from "lucide-react";
import type { Location, WeatherData } from "@/lib/types";
import { getWeatherData } from "@/services/weather";
import Image from "next/image";

interface WeatherWidgetProps {
    location: Location | null;
}

export function WeatherWidget({ location }: WeatherWidgetProps) {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!location) {
            setWeather(null);
            setError(null);
            return;
        }

        const fetchWeather = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getWeatherData(`${location.lat},${location.lon}`);
                setWeather(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch weather.");
                setWeather(null);
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeather();
        const interval = setInterval(fetchWeather, 15 * 60 * 1000); // every 15 mins

        return () => clearInterval(interval);

    }, [location]);

    if (!location) {
        return null;
    }

    if (isLoading && !weather) {
        return (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-muted/50">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading weather...</span>
            </div>
        );
    }
    
    if (error) {
        return (
             <div className="flex items-center gap-2 text-sm text-destructive p-2 rounded-lg bg-destructive/10">
                <span>{error}</span>
            </div>
        )
    }

    if (!weather) {
        return null;
    }

    return (
        <div className="flex items-center gap-4 text-sm p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground"/>
                <span className="font-medium">{weather.location.name}</span>
            </div>
            <div className="flex items-center" title={weather.current.condition.text}>
                {weather.current.condition.icon && (
                    <Image src={`https:${weather.current.condition.icon}`} alt={weather.current.condition.text} width={24} height={24} />
                )}
                <span className="font-medium ml-1">{weather.current.temp_c}°C</span>
            </div>
             <div className="flex items-center gap-1.5" title="Humidity">
                <Droplets className="h-4 w-4 text-muted-foreground" />
                <span>{weather.current.humidity}%</span>
            </div>
             <div className="flex items-center gap-1.5" title="Wind speed">
                <Wind className="h-4 w-4 text-muted-foreground" />
                <span>{weather.current.wind_kph} km/h</span>
            </div>
        </div>
    );
}
