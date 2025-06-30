"use client"

import { useMemo } from 'react';
import { Leaf } from 'lucide-react';
import type { Location } from '@/lib/types';

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
        style.transform = `translateY(-20vh)`;
        (style as any)['--start-y'] = '-20vh';
        style.animationDuration = `${0.5 + Math.random() * 0.5}s`;
      }
      
      if (effectType === 'snow') {
        style.left = `${Math.random() * 100}vw`;
        style.transform = `translateY(-10vh)`;
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

export function WeatherEffect({ location }: { location: Location | null }) {
  const allEffectTypes: ('rain' | 'snow' | 'cloudy' | 'windy' | 'sunny')[] = ['rain', 'snow', 'cloudy', 'windy', 'sunny'];

  const allEffects = useMemo(() => {
    return allEffectTypes.map(type => ({
      type,
      particles: createParticles(type)
    }));
  }, []);

  return (
    <>
      {allEffects.map(effect => (
        <div key={effect.type} className={`weather-effect ${effect.type}`}>
          {effect.particles}
        </div>
      ))}
    </>
  );
}
