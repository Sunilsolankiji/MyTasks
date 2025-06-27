'use server';
/**
 * @fileOverview A function for fetching weather data from WeatherAPI.com.
 *
 * - getWeather - A function that fetches weather for a given location.
 * - GetWeatherInput - The input type for the getWeather function.
 * - GetWeatherOutput - The return type for the getWeather function.
 */

import { z } from 'zod';

const weatherConditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'unknown'] as const;
export type WeatherCondition = (typeof weatherConditions)[number];

const GetWeatherInputSchema = z.object({
  location: z.string().describe('The location to get the weather for.'),
});
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;

const GetWeatherOutputSchema = z.object({
  condition: z.enum(weatherConditions).describe('The weather condition.'),
  temperature: z.number().describe('The temperature in Celsius.'),
  location: z.string().describe('The name of the location.'),
  description: z.string().describe('A text description of the weather.'),
});
export type GetWeatherOutput = z.infer<typeof GetWeatherOutputSchema>;

function mapCodeToCondition(code: number): WeatherCondition {
    if (code === 1000) return 'sunny';
    if ([1003, 1006, 1009, 1030, 1135, 1147].includes(code)) return 'cloudy';
    if (
        (code >= 1150 && code <= 1201) ||
        [1063, 1240, 1243, 1246].includes(code)
    ) return 'rainy';
    if (
        (code >= 1204 && code <= 1237) ||
        [1066, 1069, 1072, 1114, 1117, 1255, 1258, 1261, 1264].includes(code)
    ) return 'snowy';
    if ([1087, 1273, 1276, 1279, 1282].includes(code)) return 'stormy';
    
    return 'unknown';
}

export async function getWeather(input: GetWeatherInput): Promise<GetWeatherOutput> {
    const validatedInput = GetWeatherInputSchema.parse(input);

    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('WEATHER_API_KEY environment variable is not set.');
    }

    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(validatedInput.location)}`;

    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      const result = {
        condition: mapCodeToCondition(data.current.condition.code),
        temperature: data.current.temp_c,
        location: data.location.name,
        description: data.current.condition.text,
      };
      
      return GetWeatherOutputSchema.parse(result);

    } catch (error) {
        console.error("Failed to fetch weather data:", error);
        if (error instanceof Error) {
             throw new Error(`Failed to fetch weather data: ${error.message}`);
        }
        throw new Error('An unknown error occurred while fetching weather data.');
    }
}
