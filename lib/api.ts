// Utility functions for making API calls to your Next.js API routes

import type { 
  MapSearchResult, 
  CurrentWeatherData, 
  WeatherUnits,
  ReverseGeocodingResponse,
  ReverseGeocodingResult
} from './types';

// OpenWeatherMap Reverse Geocoding API call
export async function reverseGeocode(
  lat: number,
  lon: number,
  limit: number = 5
): Promise<ReverseGeocodingResult[]> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      limit: limit.toString()
    });
    
    const response = await fetch(`/api/reverse-geocoding?${params}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Reverse geocoding failed: ${response.status}`);
    }
    
    const data: ReverseGeocodingResponse = await response.json();
    return data.results;
    
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw error;
  }
}

// Get location name by coordinates (helper function)
export async function getLocationNameByCoordinates(
  coordinates: [number, number],
  limit?: number
): Promise<ReverseGeocodingResult[]> {
  const [lon, lat] = coordinates;
  return reverseGeocode(lat, lon, limit);
}

// Current weather API call
export async function getCurrentWeather(
  lat: number, 
  lon: number, 
  units: WeatherUnits = 'metric',
  lang: string = 'en'
): Promise<CurrentWeatherData> {
  try {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      units,
      lang
    });
    
    const response = await fetch(`/api/current-weather?${params}`);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Weather API failed: ${response.status}`);
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Weather API error:', error);
    throw error;
  }
}

// Get weather by city coordinates (helper function)
export async function getWeatherByCoordinates(
  coordinates: [number, number],
  units?: WeatherUnits,
  lang?: string
): Promise<CurrentWeatherData> {
  const [lon, lat] = coordinates;
  return getCurrentWeather(lat, lon, units, lang);
}

// Generic API helper
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}