'use server';

/**
 * @fileOverview A flow to get weather information.
 * - getWeather - A function that gets weather for a location.
 * - GetWeatherInput - The input type for the getWeather function.
 * - GetWeatherOutput - The return type for the getWeather function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const weatherConditions = ['sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy', 'unknown'] as const;
type WeatherCondition = (typeof weatherConditions)[number];

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


const GetWeatherInputSchema = z.object({
  location: z.string().describe('The location to get the weather for, e.g. "San Francisco, CA".'),
});
export type GetWeatherInput = z.infer<typeof GetWeatherInputSchema>;

const GetWeatherOutputSchema = z.object({
  condition: z.enum(weatherConditions),
  temperature: z.number().describe('The temperature in Celsius.'),
  location: z.string(),
  description: z.string().describe('A descriptive sentence about the weather.'),
});
export type GetWeatherOutput = z.infer<typeof GetWeatherOutputSchema>;

export async function getWeather(input: GetWeatherInput): Promise<GetWeatherOutput> {
    return weatherFlow(input);
}

const weatherFlow = ai.defineFlow(
  {
    name: 'weatherFlow',
    inputSchema: GetWeatherInputSchema,
    outputSchema: GetWeatherOutputSchema,
  },
  async ({ location }) => {
    // In a real app, this would call a weather API.
    // We'll use our mock function.
    const weatherData = await fetchWeatherFromAPI(location);
    
    const llmResponse = await ai.generate({
        prompt: `The weather in ${location} is ${weatherData.condition} with a temperature of ${weatherData.temperature}°C. Write a short, friendly sentence describing this weather.`,
    });

    return {
        ...weatherData,
        location,
        description: llmResponse.text,
    };
  }
);
