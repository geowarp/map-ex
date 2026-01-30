"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { WeatherInfoPanel } from "./WeatherInfoPanel";
import { TimeSliderPanel } from "./TimeSliderPanel";
import {
  getCurrentWeather,
  getForecastWeather,
  reverseGeocode,
} from "../lib/api";

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
  style = "https://tiles.openfreemap.org/styles/positron",
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

  // Function to fetch weather data for given coordinates
  const fetchWeatherData = async (coordinates: {
    lat: number;
    lng: number;
  }) => {
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
      setTimeSliderIndex(0); // Reset to "Now" when new location is clicked
      setShowWeatherPanel(true);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      // Show panel with coordinates only if API calls fail
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
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Load initial weather data for the center coordinates
  useEffect(() => {
    const initialCoordinates = { lat: center[1], lng: center[0] };
    fetchWeatherData(initialCoordinates);
  }, [center[0], center[1]]);

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

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainer}
        className={`w-full ${className}`}
        style={{ height }}
      />

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
