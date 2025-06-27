'use server';

import type { Location, WeatherData } from "@/lib/types";

const WEATHER_API_URL = 'https://api.weatherapi.com/v1';

async function fetchWeatherAPI(endpoint: string, params: Record<string, string> = {}) {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
        throw new Error("WEATHER_API_KEY is not set in the environment variables.");
    }

    const url = new URL(`${WEATHER_API_URL}/${endpoint}`);
    url.searchParams.append('key', apiKey);
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value);
    }
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
    }
    
    return response.json();
}

export async function getWeatherData(location: string): Promise<WeatherData> {
    return fetchWeatherAPI('current.json', { q: location });
}

export async function searchLocations(query: string): Promise<Location[]> {
    if (!query) return [];
    return fetchWeatherAPI('search.json', { q: query });
}
