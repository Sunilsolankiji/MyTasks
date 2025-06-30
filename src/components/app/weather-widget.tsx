
"use client";

import { Loader2, MapPin, Droplets, Wind } from "lucide-react";
import type { Location, WeatherData } from "@/lib/types";
import Image from "next/image";

interface WeatherWidgetProps {
    location: Location | null;
    weather: WeatherData | null;
    isLoading: boolean;
}

export function WeatherWidget({ location, weather, isLoading }: WeatherWidgetProps) {
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
