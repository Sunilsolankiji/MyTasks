"use client"

import { useEffect, useState, useMemo } from 'react';
import type { Location } from '@/lib/types';
import { getWeatherData } from '@/services/weather';

const WEATHER_CODES_RAIN = [1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246, 1249, 1252, 1273, 1276];
const WEATHER_CODES_SNOW = [1114, 1117, 1204, 1207, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258, 1261, 1264, 1279, 1282];
const WEATHER_CODES_CLOUDY = [1003, 1006, 1009, 1030, 1135, 1147];


const Particle = ({ style }: { style: React.CSSProperties }) => (
  <div className="particle" style={style}></div>
);

export function WeatherEffect({ location }: { location: Location | null }) {
  const [weatherCode, setWeatherCode] = useState<number | null>(null);

  useEffect(() => {
    if (!location) {
      setWeatherCode(null);
      return;
    }

    const fetchWeather = async () => {
      try {
        const data = await getWeatherData(`${location.lat},${location.lon}`);
        setWeatherCode(data.current.condition.code);
      } catch (error) {
        console.error("Failed to fetch weather for effect:", error);
        setWeatherCode(null);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 15 * 60 * 1000); // every 15 mins

    return () => clearInterval(interval);
  }, [location]);

  const effectType = useMemo(() => {
    if (!weatherCode) return null;
    if (WEATHER_CODES_RAIN.includes(weatherCode)) return 'rain';
    if (WEATHER_CODES_SNOW.includes(weatherCode)) return 'snow';
    if (WEATHER_CODES_CLOUDY.includes(weatherCode)) return 'cloudy';
    return null;
  }, [weatherCode]);

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
    }

    return Array.from({ length: count }).map((_, i) => {
      const style: React.CSSProperties = {
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDuration: `${effectType === 'cloudy' ? 20 + Math.random() * 20 : 0.5 + Math.random() * 0.5}s`,
        animationDelay: `${Math.random() * 5}s`,
        transform: `scale(${effectType === 'cloudy' ? 0.5 + Math.random() : 1})`,
        opacity: effectType === 'cloudy' ? Math.random() * 0.3 : 0.6
      };

      if (effectType === 'snow') {
        style.opacity = Math.random();
        style.animationDuration = `${5 + Math.random() * 10}s`;
      }

      return (
        <div key={i} className={particleClass} style={style}></div>
      );
    });
  }, [effectType]);
  
  if (!effectType) return null;

  return <div className={`weather-effect ${effectType} pointer-events-none`}>{particles}</div>
}
