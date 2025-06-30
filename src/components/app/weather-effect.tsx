"use client"

import { useEffect, useState, useMemo } from 'react';
import { Leaf } from 'lucide-react';
import type { Location, WeatherData } from '@/lib/types';
import { getWeatherData } from '@/services/weather';

const WEATHER_CODES_RAIN = [1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246, 1249, 1252, 1273, 1276];
const WEATHER_CODES_SNOW = [1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258, 1261, 1264, 1279, 1282];
const WEATHER_CODES_CLOUDY = [1003, 1006, 1009, 1030, 1135, 1147];
const WEATHER_CODES_SUNNY = [1000];
const WINDY_THRESHOLD_KPH = 20;

export function WeatherEffect({ location }: { location: Location | null }) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (!location) {
      setWeatherData(null);
      return;
    }

    const fetchWeather = async () => {
      try {
        const data = await getWeatherData(`${location.lat},${location.lon}`);
        setWeatherData(data);
      } catch (error) {
        console.error("Failed to fetch weather for effect:", error);
        setWeatherData(null);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000); // every 15 mins

    return () => clearInterval(interval);
  }, [location]);

  const effectType = useMemo(() => {
    if (!weatherData) return null;
    
    const code = weatherData.current.condition.code;
    const windSpeed = weatherData.current.wind_kph;

    if (WEATHER_CODES_RAIN.includes(code)) return 'rain';
    if (WEATHER_CODES_SNOW.includes(code)) return 'snow';
    if (windSpeed > WINDY_THRESHOLD_KPH) return 'windy';
    if (WEATHER_CODES_SUNNY.includes(code)) return 'sunny';
    if (WEATHER_CODES_CLOUDY.includes(code)) return 'cloudy';
    
    return null;
  }, [weatherData]);

  const particles = useMemo(() => {
    if (!effectType) return [];

    let count = 0;
    let particleClass = '';
    
    switch (effectType) {
      case 'rain':
        count = 100;
        particleClass = 'rain-particle';
        break;
      case 'snow':
        count = 150;
        particleClass = 'snow-particle';
        break;
      case 'cloudy':
        count = 15;
        particleClass = 'cloud-particle';
        break;
      case 'windy':
        count = 50;
        particleClass = 'leaf-particle';
        break;
      case 'sunny':
        return [<div key="sun" className="sun-particle"></div>];
    }

    return Array.from({ length: count }).map((_, i) => {
      const style: React.CSSProperties = {
        animationDelay: `${Math.random() * 5}s`,
      };

      if (effectType === 'rain') {
        style.left = `${Math.random() * 100}vw`;
        (style as any)['--start-y'] = '-20vh'; // Start off-screen
        style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
      }
      
      if (effectType === 'snow') {
        style.left = `${Math.random() * 100}vw`;
        (style as any)['--start-y'] = '-10vh'; // Start off-screen
        style.animationDuration = `${5 + Math.random() * 10}s`;
      }
      
      if (effectType === 'cloudy') {
        style.left = '-250px'; // Start off-screen
        style.top = `${-10 + Math.random() * 20}%`;
        (style as any)['--cloud-scale'] = 0.5 + Math.random();
        style.animationDuration = `${20 + Math.random() * 20}s`;
        style.animationDelay = `${Math.random() * 10}s`;
      }

      if (effectType === 'windy') {
        style.left = '-30px'; // Start off-screen
        style.top = `${Math.random() * 100}vh`;
        style.animationDuration = `${4 + Math.random() * 4}s`;
        style.transform = `scale(${0.8 + Math.random() * 0.4})`;
        return <Leaf key={i} className={particleClass} style={style} />;
      }

      return (
        <div key={i} className={particleClass} style={style}></div>
      );
    });
  }, [effectType]);
  
  if (!effectType) return null;

  return <div className={`weather-effect ${effectType}`}>{particles}</div>
}
