export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  date?: Date;
  completed: boolean;
  notes?: string;
  attachment?: string;
  attachmentName?: string;
  creationDate: Date;
  completionDate?: Date;
  priority: Priority;
  referenceLinks?: string[];
}

export interface Location {
  id: number;
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  url: string;
}

export interface WeatherData {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
    tz_id: string;
    localtime_epoch: number;
    localtime: string;
  };
  current: {
    last_updated_epoch: number;
    last_updated: string;
    temp_c: number;
    temp_f: number;
    is_day: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    wind_mph: number;
    wind_kph: number;
    wind_degree: number;
    wind_dir: string;
    pressure_mb: number;
    pressure_in: number;
    precip_mm: number;
    precip_in: number;
    humidity: number;
    cloud: number;
    feelslike_c: number;
    feelslike_f: number;
    uv: number;
    gust_mph: number;
    gust_kph: number;
  };
}

export type WeatherEffectMode = 'dynamic' | 'all' | 'sunny' | 'windy' | 'cloudy' | 'rain' | 'snow' | 'mist' | 'none';
