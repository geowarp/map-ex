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

interface WeatherPanelProps {
  weatherData?: WeatherData;
  isVisible?: boolean;
}

export function WeatherPanel({
  weatherData,
  isVisible = false,
}: WeatherPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isVisible || !weatherData) {
    return null;
  }

  return (
    <Card className="w-75 bg-white/40 backdrop-blur-md border-white/20 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-foreground">
              {weatherData.location || "Selected Location"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {weatherData.coordinates
                ? `${weatherData.coordinates.lat.toFixed(2)}, ${weatherData.coordinates.lng.toFixed(2)}`
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
              {weatherData.temperature
                ? `${weatherData.temperature.toFixed(1)} °C`
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
                weatherData.feelsLike
                  ? `${weatherData.feelsLike.toFixed(1)} °C`
                  : "-- °C"
              }
            />
            <WeatherRow
              label="Wind speed"
              value={
                weatherData.windSpeed
                  ? `${weatherData.windSpeed.toFixed(1)} m/s`
                  : "-- m/s"
              }
            />
            <WeatherRow
              label="Wind Direction"
              value={
                weatherData.windDirection && weatherData.windDirectionText
                  ? `${weatherData.windDirection}° ${weatherData.windDirectionText}`
                  : "--"
              }
            />
            <WeatherRow
              label="Humidity"
              value={
                weatherData.humidity ? `${weatherData.humidity} %` : "-- %"
              }
            />
            <WeatherRow
              label="Clouds"
              value={weatherData.clouds ? `${weatherData.clouds} %` : "-- %"}
            />
            <WeatherRow
              label="Pressure"
              value={
                weatherData.pressure ? `${weatherData.pressure} hPa` : "-- hPa"
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
