"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { WeatherInfoPanel } from "./WeatherInfoPanel";
import { TimeSliderPanel } from "./TimeSliderPanel";
import { WeatherLayersPanel } from "./WeatherLayersPanel";
import {
  getCurrentWeather,
  getForecastWeather,
  reverseGeocode,
  getWeatherLayerConfig,
} from "../lib/api";
import type { WeatherLayerType } from "../lib/types";

interface MapProps {
  center: [number, number];
  zoom?: number;
  style?: string;
  className?: string;
  height?: string;
}

interface WeatherData {
  location?: string;
  coordinates?: { lat: number; lng: number };
  temperature?: number;
  feelsLike?: number;
  windSpeed?: number;
  windDirection?: number;
  windDirectionText?: string;
  humidity?: number;
  clouds?: number;
  pressure?: number;
  weatherIcon?: string;
}

// Helper function to convert wind degrees to compass direction
function getWindDirection(degrees: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

export default function Map({
  center,
  zoom = 9.5,
  style = "https://tiles.openfreemap.org/styles/dark",
  className = "",
  height = "100vh",
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWeatherPanel, setShowWeatherPanel] = useState(false);
  const [timeSliderIndex, setTimeSliderIndex] = useState(0);
  const [currentWeatherLayer, setCurrentWeatherLayer] = useState<WeatherLayerType>("temperature");
  const [weatherLayerSource, setWeatherLayerSource] = useState<string | null>(null);
  const [weatherLayerId, setWeatherLayerId] = useState<string | null>(null);
  
  // REF to track slider index - this is ALWAYS current, no stale closure issues
  const sliderIndexRef = useRef(timeSliderIndex);
  sliderIndexRef.current = timeSliderIndex; // Always sync with state

  // Function to fetch weather data for given coordinates
  const fetchWeatherData = async (coordinates: {
    lat: number;
    lng: number;
  }) => {
    console.log('🌍 Fetching weather data for coordinates:', coordinates);
    setIsLoading(true);

    try {
      // Call current weather, forecast, and reverse geocoding in parallel
      const [weatherResponse, forecastResponse, locationResponse] =
        await Promise.all([
          getCurrentWeather(coordinates.lat, coordinates.lng),
          getForecastWeather(coordinates.lat, coordinates.lng),
          reverseGeocode(coordinates.lat, coordinates.lng, 1),
        ]);

      // Get location name from reverse geocoding
      const locationName =
        locationResponse.length > 0
          ? `${locationResponse[0].name}${locationResponse[0].state ? `, ${locationResponse[0].state}` : ""}`
          : "Unknown Location";

      // Transform API response to WeatherData format
      const transformedWeatherData: WeatherData = {
        location: locationName,
        coordinates: coordinates,
        temperature: weatherResponse.main.temp,
        feelsLike: weatherResponse.main.feels_like,
        windSpeed: weatherResponse.wind?.speed,
        windDirection: weatherResponse.wind?.deg,
        windDirectionText: weatherResponse.wind?.deg
          ? getWindDirection(weatherResponse.wind.deg)
          : undefined,
        humidity: weatherResponse.main.humidity,
        clouds: weatherResponse.clouds.all,
        pressure: weatherResponse.main.pressure,
        weatherIcon: weatherResponse.weather[0]?.icon,
      };

      setWeatherData(transformedWeatherData);
      setForecastData(forecastResponse);
      setShowWeatherPanel(true);
      
      // DO NOT UPDATE WEATHER LAYERS HERE - Let slider handle it!
      console.log('📊 Weather data updated. Slider will control weather layers.');
      
    } catch (error) {
      console.error("Error fetching weather data:", error);
      setWeatherData({
        location: "Unable to load weather data",
        coordinates: coordinates,
      });
      setForecastData(null);
      setShowWeatherPanel(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Timestamp function removed - Weather Maps 1.0 only shows current weather

  // Helper function to clear all weather layers
  const clearAllWeatherLayers = () => {
    console.log('🗑️ Clearing all weather layers...');
    
    if (!map.current) {
      console.log('⚠️ No map reference, cannot clear layers');
      return;
    }
    
    // Don't check isStyleLoaded - we need to clear immediately
    
    // Clear state-tracked layers
    if (weatherLayerId && map.current.getLayer && map.current.getLayer(weatherLayerId)) {
      try {
        map.current.removeLayer(weatherLayerId);
        console.log('✅ Removed weather layer:', weatherLayerId);
      } catch (e) { console.warn('Error removing layer:', e); }
    }
    if (weatherLayerSource && map.current.getSource && map.current.getSource(weatherLayerSource)) {
      try {
        map.current.removeSource(weatherLayerSource);
        console.log('✅ Removed weather source:', weatherLayerSource);
      } catch (e) { console.warn('Error removing source:', e); }
    }
    
    // Clear any potential orphaned layers/sources
    const layerTypes = ['precipitation', 'clouds', 'temperature', 'wind_arrows', 'pressure'];
    layerTypes.forEach(type => {
      const layerId = `weather-${type}`;
      const sourceId = `weather-${type}-source`;
      
      try {
        if (map.current!.getLayer && map.current!.getLayer(layerId)) {
          map.current!.removeLayer(layerId);
          console.log('🧹 Cleaned orphaned layer:', layerId);
        }
      } catch (e) { /* ignore */ }
      
      try {
        if (map.current!.getSource && map.current!.getSource(sourceId)) {
          map.current!.removeSource(sourceId);
          console.log('🧹 Cleaned orphaned source:', sourceId);
        }
      } catch (e) { /* ignore */ }
    });
    
    // Reset state immediately
    setWeatherLayerSource(null);
    setWeatherLayerId(null);
    console.log('✅ Weather layer state cleared');
  };

  // Handle weather layer changes
  const handleWeatherLayerChange = (layerConfig: any) => {
    if (!map.current || !layerConfig) return;

    // CRITICAL: Use REF to check current slider index (not stale closure)
    const currentSliderIndex = sliderIndexRef.current;
    console.log('🎯 handleWeatherLayerChange called - Slider index from REF:', currentSliderIndex);
    
    if (currentSliderIndex !== 0) {
      console.log('🚫 BLOCKED: Slider not at 0 (current:', currentSliderIndex, ')');
      return;
    }

    // Check if map style is loaded before adding layers
    if (!map.current.isStyleLoaded()) {
      console.log('Map style still loading, waiting...');
      map.current.once('styledata', () => {
        // Re-check slider index when style loads
        if (sliderIndexRef.current === 0) {
          handleWeatherLayerChange(layerConfig);
        }
      });
      return;
    }

    console.log('✅ Adding weather layer for current time');
    // Clear all existing weather layers first
    clearAllWeatherLayers();

    const sourceId = layerConfig.sourceConfig.id || `weather-${layerConfig.layerType}-source`;
    const layerId = layerConfig.layerConfig.id || `weather-${layerConfig.layerType}`;

    // Add new weather layer
    try {
      // Add source
      map.current.addSource(sourceId, layerConfig.sourceConfig);

      // Add layer
      map.current.addLayer({
        ...layerConfig.layerConfig,
        id: layerId,
        source: sourceId
      });

      // Update state only after successful addition
      setWeatherLayerSource(sourceId);
      setWeatherLayerId(layerId);
      setCurrentWeatherLayer(layerConfig.layerType);
      
    } catch (error) {
      console.error('Failed to add weather layer:', error);
      // Clear everything on error
      clearAllWeatherLayers();
    }
  };

  // OLD FUNCTION REMOVED - Now handled by SUPREME SLIDER CONTROLLER

  // Handle map click events
  const handleMapClick = async (coordinates: { lat: number; lng: number }) => {
    console.log("Map clicked at coordinates:", coordinates);
    await fetchWeatherData(coordinates);
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: style,
      center: center,
      zoom: zoom,
    });

    // Add click event listener
    map.current.on("click", (e) => {
      const coordinate = map.current!.unproject(e.point);
      handleMapClick({
        lat: coordinate.lat,
        lng: coordinate.lng,
      });
    });

    // Clean up on unmount
    return () => {
      if (map.current) {
        // Clean up weather layers before removing map
        try {
          if (weatherLayerId && map.current.getLayer(weatherLayerId)) {
            map.current.removeLayer(weatherLayerId);
          }
          if (weatherLayerSource && map.current.getSource(weatherLayerSource)) {
            map.current.removeSource(weatherLayerSource);
          }
        } catch (error) {
          console.warn('Error cleaning up weather layers:', error);
        }
        
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Load initial weather data for the center coordinates (ONE TIME ONLY)
  useEffect(() => {
    console.log('🚀 INITIAL LOAD - Loading weather data for center coordinates');
    const initialCoordinates = { lat: center[1], lng: center[0] };
    fetchWeatherData(initialCoordinates);
  }, []); // Empty deps = run once only

  // Separate effect to update map center and zoom when props change
  useEffect(() => {
    if (map.current) {
      map.current.setCenter(center);
      map.current.setZoom(zoom);
    }
  }, [center, zoom]);

  // Separate effect to update map style when it changes
  useEffect(() => {
    if (map.current) {
      map.current.setStyle(style);
    }
  }, [style]);

  // 👑 SUPREME SLIDER CONTROLLER - The only source of truth for weather layers
  useEffect(() => {
    const isAtZero = timeSliderIndex === 0;
    console.log('👑 SLIDER SUPREME CONTROLLER - Index:', timeSliderIndex, 'isAtZero:', isAtZero);
    
    if (isAtZero) {
      // SLIDER AT 0: Show weather layers (after map is ready)
      console.log('✅ SLIDER AT 0: Should show weather layers');
      
      // Wait for map to be ready before loading
      if (map.current?.isStyleLoaded()) {
        if (currentWeatherLayer && !weatherLayerId) {
          console.log('📥 Loading initial weather layer:', currentWeatherLayer);
          loadWeatherLayerForSlider();
        }
      } else {
        console.log('⏳ Map not ready yet, will load when ready');
        // Set up listener to load when map is ready
        map.current?.once('load', () => {
          if (sliderIndexRef.current === 0 && !weatherLayerId) {
            console.log('🗺️ Map loaded, now loading weather layer');
            loadWeatherLayerForSlider();
          }
        });
      }
    } else {
      // SLIDER NOT AT 0: Clear all weather layers immediately
      console.log('❌ SLIDER NOT AT 0 (index:', timeSliderIndex, '): Clearing weather layers');
      clearAllWeatherLayers();
    }
  }, [timeSliderIndex]);

  // Helper function to load weather layers when slider is at index 0
  const loadWeatherLayerForSlider = async () => {
    try {
      const layerConfig = await getWeatherLayerConfig(currentWeatherLayer);
      // This will only succeed if slider is still at 0 (double-check in handleWeatherLayerChange)
      handleWeatherLayerChange(layerConfig);
    } catch (error) {
      console.error('Failed to load weather layer:', error);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        className={`w-full ${className}`}
        style={{ height }}
      />

      {/* Weather Layers Panel positioned in top left corner */}
      <div className="absolute top-16 left-6 z-10">
        <WeatherLayersPanel
          onLayerChange={handleWeatherLayerChange}
          selectedLayer={currentWeatherLayer}
          isDisabled={timeSliderIndex !== 0}
          disabledMessage="Weather layers only available for current weather"
        />
      </div>

      {/* Weather Panel positioned in bottom right corner */}
      <div className="absolute bottom-16 right-6 z-10">
        <WeatherInfoPanel
          weatherData={weatherData || undefined}
          forecastData={forecastData || undefined}
          timeSliderIndex={timeSliderIndex}
          isVisible={showWeatherPanel && !isLoading}
        />
      </div>

      {/* Time Slider positioned at bottom center, aligned with weather panel */}
      {(weatherData || forecastData) && showWeatherPanel && !isLoading && (
        <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 z-10">
          <TimeSliderPanel
            forecastData={forecastData || undefined}
            currentIndex={timeSliderIndex}
            onIndexChange={setTimeSliderIndex}
            showCurrentWeather={!!weatherData}
          />
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute bottom-8 right-6 z-10">
          <div className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
              Loading weather data...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
