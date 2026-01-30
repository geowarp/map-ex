// API Response Types

// OpenWeatherMap Reverse Geocoding API Types
export interface ReverseGeocodingResult {
  name: string;
  local_names?: {
    [languageCode: string]: string;
  } & {
    ascii?: string;
    feature_name?: string;
  };
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

export interface ReverseGeocodingResponse {
  results: ReverseGeocodingResult[];
  query: {
    lat: number;
    lon: number;
    limit: number;
  };
  timestamp: string;
  source: string;
}

export interface MapSearchResult {
  id: number;
  name: string;
  coordinates: [number, number];
}

// OpenWeatherMap Current Weather API Types based on official documentation
export interface CurrentWeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind?: {
    speed: number;
    deg: number;
    gust?: number;
  };
  rain?: {
    '1h'?: number;
  };
  snow?: {
    '1h'?: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type?: number;
    id?: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
  // Additional fields added by our API
  units: string;
  timestamp: string;
  source: string;
}

// OpenWeatherMap 5-Day Forecast API Types
export interface ForecastWeatherData {
  cod: string;
  message: number;
  cnt: number;
  list: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      temp_min: number;
      temp_max: number;
      pressure: number;
      sea_level?: number;
      grnd_level?: number;
      humidity: number;
      temp_kf: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: {
      all: number;
    };
    wind: {
      speed: number;
      deg: number;
      gust?: number;
    };
    visibility: number;
    pop: number; // Probability of precipitation
    rain?: {
      '3h': number;
    };
    snow?: {
      '3h': number;
    };
    sys: {
      pod: string; // Part of day (n-night, d-day)
    };
    dt_txt: string;
  }>;
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
  // Additional fields added by our API
  units: string;
  timestamp: string;
  source: string;
}

// Weather API parameter types
export type WeatherUnits = 'standard' | 'metric' | 'imperial';

export interface WeatherParams {
  lat: number;
  lon: number;
  units?: WeatherUnits;
  lang?: string;
}

export interface ForecastParams extends WeatherParams {
  cnt?: number; // Number of timestamps to return
}

// Generic API response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  timestamp: string;
}

// Error response type
export interface ApiError {
  error: string;
  status?: number;
  details?: unknown;
}