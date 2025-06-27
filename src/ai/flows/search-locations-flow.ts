'use server';
/**
 * @fileOverview A function for fetching location suggestions from WeatherAPI.com.
 *
 * - searchLocations - A function that fetches location suggestions for a given query.
 * - SearchLocationsInput - The input type for the searchLocations function.
 * - SearchLocationsOutput - The return type for the searchLocations function.
 */

import { z } from 'zod';

const SearchLocationsInputSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters long.'),
});
export type SearchLocationsInput = z.infer<typeof SearchLocationsInputSchema>;

const LocationSchema = z.object({
    id: z.number(),
    name: z.string(),
    region: z.string(),
    country: z.string(),
});

const SearchLocationsOutputSchema = z.array(LocationSchema);
export type SearchLocationsOutput = z.infer<typeof SearchLocationsOutputSchema>;


export async function searchLocations(input: SearchLocationsInput): Promise<SearchLocationsOutput> {
    const validatedInput = SearchLocationsInputSchema.parse(input);

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      console.warn('WEATHER_API_KEY environment variable is not set. Cannot search for locations.');
      return [];
    }

    const url = `https://api.weatherapi.com/v1/search.json?key=${apiKey}&q=${encodeURIComponent(validatedInput.query)}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      return SearchLocationsOutputSchema.parse(data);

    } catch (error) {
        console.error("Failed to fetch location data:", error);
        return [];
    }
}
