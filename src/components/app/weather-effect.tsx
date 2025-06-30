
"use client"

import { useMemo } from 'react';
import { Leaf } from 'lucide-react';
import type { WeatherData, WeatherEffectMode } from '@/lib/types';

const createParticles = (effectType: 'rain' | 'snow' | 'cloudy' | 'windy' | 'sunny' | null) => {
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
        style.transform = 'translateY(-20vh)';
        (style as any)['--start-y'] = '-20vh';
        style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
      }
      
      if (effectType === 'snow') {
        style.left = `${Math.random() * 100}vw`;
        style.transform = 'translateY(-10vh)';
        (style as any)['--start-y'] = '-10vh';
        style.animationDuration = `${5 + Math.random() * 10}s`;
      }
      
      if (effectType === 'cloudy') {
        style.left = '-250px';
        style.top = `${-10 + Math.random() * 20}%`;
        (style as any)['--cloud-scale'] = 0.5 + Math.random();
        style.animationDuration = `${20 + Math.random() * 20}s`;
        style.animationDelay = `${Math.random() * 10}s`;
      }

      if (effectType === 'windy') {
        style.left = '-30px';
        style.top = `${Math.random() * 100}vh`;
        style.animationDuration = `${4 + Math.random() * 4}s`;
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
  const dynamicEffectType = useMemo((): 'rain' | 'snow' | 'cloudy' | 'windy' | 'sunny' | null => {
    if (!weather) return null;

    const code = weather.current.condition.code;
    const isDay = weather.current.is_day;
    const windKph = weather.current.wind_kph;
    const conditionText = weather.current.condition.text.toLowerCase();
    
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
    const allEffects: ('rain' | 'snow' | 'cloudy' | 'windy' | 'sunny')[] = ['rain', 'snow', 'cloudy', 'windy', 'sunny'];
    return (
        <>
            {allEffects.map(effect => (
                <div key={effect} className={`weather-effect ${effect}`}>
                    {createParticles(effect)}
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
      {createParticles(effectToRender as any)}
    </div>
  );
}
