"use client";

import React, { useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChevronUp, ChevronDown, Sun } from "lucide-react";
import type { ForecastWeatherData } from '../lib/types';

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

interface WeatherInfoPanelProps {
  weatherData?: WeatherData;
  forecastData?: ForecastWeatherData;
  isVisible?: boolean;
  timeSliderIndex?: number;
}

export function WeatherInfoPanel({
  weatherData,
  forecastData,
  isVisible = false,
  timeSliderIndex = 0,
}: WeatherInfoPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isVisible || (!weatherData && !forecastData)) {
    return null;
  }

  // Determine which data to display based on slider position
  const isShowingCurrentWeather = timeSliderIndex === 0 && weatherData;
  const currentDisplayData = isShowingCurrentWeather 
    ? weatherData 
    : forecastData?.list?.[timeSliderIndex - (weatherData ? 1 : 0)];

  // Helper function to convert forecast data to WeatherData format
  const getForecastWeatherData = (forecastItem: any): WeatherData => {
    return {
      location: forecastData?.city?.name || 'Forecast Location',
      coordinates: forecastData?.city?.coord ? {
        lat: forecastData.city.coord.lat,
        lng: forecastData.city.coord.lon
      } : undefined,
      temperature: forecastItem?.main?.temp,
      feelsLike: forecastItem?.main?.feels_like,
      windSpeed: forecastItem?.wind?.speed,
      windDirection: forecastItem?.wind?.deg,
      windDirectionText: forecastItem?.wind?.deg ? getWindDirection(forecastItem.wind.deg) : undefined,
      humidity: forecastItem?.main?.humidity,
      clouds: forecastItem?.clouds?.all,
      pressure: forecastItem?.main?.pressure,
      weatherIcon: forecastItem?.weather?.[0]?.icon
    };
  };

  const displayData: WeatherData = isShowingCurrentWeather 
    ? weatherData! 
    : getForecastWeatherData(currentDisplayData);

  // Helper function to convert wind degrees to compass direction
  function getWindDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  return (
    <Card className="w-75 bg-white/40 backdrop-blur-md border-white/20 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              {displayData.location || "Selected Location"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {displayData.coordinates
                ? `${displayData.coordinates.lat.toFixed(2)}, ${displayData.coordinates.lng.toFixed(2)}`
                : "-28.54, 142.39"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Divider */}
        <div className="border-t border-black/10" />

        {/* Temperature Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-5xl font-light text-foreground">
              {displayData.temperature
                ? `${displayData.temperature.toFixed(1)} °C`
                : "-- °C"}
            </span>
            <Sun className="h-10 w-10 text-orange-500" strokeWidth={1.5} />
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-black/5 rounded-full transition-colors"
            aria-label={isExpanded ? "Hide details" : "Show details"}
          >
            {isExpanded ? (
              <ChevronUp className="h-6 w-6 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-6 w-6 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Weather Details */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="space-y-3 text-sm">
            <WeatherRow
              label="Feels like"
              value={
                displayData.feelsLike
                  ? `${displayData.feelsLike.toFixed(1)} °C`
                  : "-- °C"
              }
            />
            <WeatherRow
              label="Wind speed"
              value={
                displayData.windSpeed
                  ? `${displayData.windSpeed.toFixed(1)} m/s`
                  : "-- m/s"
              }
            />
            <WeatherRow
              label="Wind Direction"
              value={
                displayData.windDirection && displayData.windDirectionText
                  ? `${displayData.windDirection}° ${displayData.windDirectionText}`
                  : "--"
              }
            />
            <WeatherRow
              label="Humidity"
              value={
                displayData.humidity ? `${displayData.humidity} %` : "-- %"
              }
            />
            <WeatherRow
              label="Clouds"
              value={displayData.clouds ? `${displayData.clouds} %` : "-- %"}
            />
            <WeatherRow
              label="Pressure"
              value={
                displayData.pressure ? `${displayData.pressure} hPa` : "-- hPa"
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeatherRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
