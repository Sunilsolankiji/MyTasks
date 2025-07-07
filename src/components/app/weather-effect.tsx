
"use client"

import { useMemo } from 'react';
import { Leaf } from 'lucide-react';
import type { WeatherData, WeatherEffectMode } from '@/lib/types';

const createParticles = (effectType: 'rain' | 'snow' | 'cloudy' | 'windy' | 'sunny' | 'mist' | null, weather: WeatherData | null) => {
    if (!effectType) return [];

    let count = 0;
    let particleClass = '';
    
    switch (effectType) {
      case 'rain':
        // Adjust particle count based on precipitation in mm
        count = weather ? 50 + weather.current.precip_mm * 50 : 100;
        count = Math.min(count, 300); // Cap at 300 particles for performance
        particleClass = 'rain-particle';
        break;
      case 'snow':
        // Adjust particle count based on precipitation in mm
        count = weather ? 75 + weather.current.precip_mm * 75 : 150;
        count = Math.min(count, 400); // Cap at 400 particles
        particleClass = 'snow-particle';
        break;
      case 'cloudy':
        // Adjust particle count based on cloud cover percentage
        count = weather ? Math.round(20 * (weather.current.cloud / 100)) : 15;
        particleClass = 'cloud-particle';
        break;
      case 'windy':
        // Adjust particle count based on wind speed in kph
        count = weather ? Math.round(weather.current.wind_kph * 1.5) : 50;
        count = Math.min(count, 100); // Cap at 100 particles
        particleClass = 'leaf-particle';
        break;
      case 'mist':
        // Adjust particle count based on humidity
        count = weather ? Math.round(25 * (weather.current.humidity / 100)) : 20;
        particleClass = 'mist-particle';
        break;
      case 'sunny':
        const sunStyle: React.CSSProperties = {};
        if (weather) {
            // Make pulse faster and more intense if UV index is high
            const pulseDuration = Math.max(4 - weather.current.uv * 0.2, 1.5);
            sunStyle.animationDuration = `${pulseDuration}s`;
        }
        return [<div key="sun" className="sun-particle" style={sunStyle}></div>];
    }

    return Array.from({ length: Math.floor(count) }).map((_, i) => {
      const style: React.CSSProperties = {
        animationDelay: `${Math.random() * 5}s`,
      };

      if (effectType === 'rain') {
        const precip = weather?.current.precip_mm ?? 1;
        // Faster raindrops for heavier rain
        const duration = Math.max(0.8 - precip * 0.1, 0.2);
        style.left = `${Math.random() * 100}vw`;
        style.transform = 'translateY(-20vh)';
        (style as any)['--start-y'] = '-20vh';
        style.animationDuration = `${duration + Math.random() * 0.3}s`;
      }
      
      if (effectType === 'snow') {
        style.left = `${Math.random() * 100}vw`;
        style.transform = 'translateY(-10vh)';
        (style as any)['--start-y'] = '-10vh';
        style.animationDuration = `${5 + Math.random() * 10}s`;
      }
      
      if (effectType === 'cloudy') {
        style.left = '-250px';
        style.top = `${Math.random() * 15}%`;
        (style as any)['--cloud-scale'] = 0.5 + Math.random();
        style.animationDuration = `${20 + Math.random() * 20}s`;
        style.animationDelay = `${Math.random() * 10}s`;
      }

      if (effectType === 'mist') {
        style.bottom = `${-50 + Math.random() * 40}px`;
        style.animationDuration = `${30 + Math.random() * 30}s`;
        style.animationDelay = `${Math.random() * 20}s`;
        style.opacity = Math.random() * 0.5 + 0.2;
      }

      if (effectType === 'windy') {
        const windSpeed = weather?.current.wind_kph ?? 20;
        // Faster leaves for stronger wind
        const duration = Math.max(8 - windSpeed * 0.1, 2);
        style.left = '-30px';
        style.top = `${Math.random() * 100}vh`;
        style.animationDuration = `${duration + Math.random() * (duration / 2)}s`;
        style.transform = `scale(${0.8 + Math.random() * 0.4})`;
        style.opacity = 0;
        return <Leaf key={i} className={particleClass} style={style} />;
      }

      return (
        <div key={i} className={particleClass} style={style}></div>
      );
    });
};

interface WeatherEffectProps {
    weather: WeatherData | null;
    mode: WeatherEffectMode;
}

export function WeatherEffect({ weather, mode }: WeatherEffectProps) {
  const dynamicEffectType = useMemo((): 'rain' | 'snow' | 'cloudy' | 'windy' | 'sunny' | 'mist' | null => {
    if (!weather) return null;

    const code = weather.current.condition.code;
    const isDay = weather.current.is_day;
    const windKph = weather.current.wind_kph;
    const conditionText = weather.current.condition.text.toLowerCase();
    
    if (code === 1030 || code === 1135 || code === 1147 || conditionText.includes('fog')) {
      return 'mist';
    }
    if (windKph > 29 || conditionText.includes('blizzard') || conditionText.includes('gale')) {
        return 'windy';
    }
    if ( (code >= 1150 && code <= 1201) || (code >= 1240 && code <= 1252) || code === 1063 ) {
      return 'rain';
    }
    if ( (code >= 1204 && code <= 1237) || (code >= 1255 && code <= 1264) || code === 1066 ) {
      return 'snow';
    }
    if (code >= 1273 && code <= 1282) {
      return 'rain';
    }
    if (code === 1003 || code === 1006 || code === 1009) {
      return 'cloudy';
    }
    if (code === 1000 && isDay) {
      return 'sunny';
    }

    return null;
  }, [weather]);
  
  if (mode === 'all') {
    const allEffects: ('rain' | 'snow' | 'cloudy' | 'windy' | 'sunny' | 'mist')[] = ['rain', 'snow', 'cloudy', 'windy', 'sunny', 'mist'];
    return (
        <>
            {allEffects.map(effect => (
                <div key={effect} className={`weather-effect ${effect}`}>
                    {createParticles(effect, weather)}
                </div>
            ))}
        </>
    );
  }

  const effectToRender = mode === 'dynamic' ? dynamicEffectType : mode;

  if (!effectToRender || effectToRender === 'none') {
    return null;
  }

  return (
    <div className={`weather-effect ${effectToRender}`}>
      {createParticles(effectToRender as any, weather)}
    </div>
  );
}
