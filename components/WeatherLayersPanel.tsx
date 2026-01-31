"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Thermometer, Gauge, Wind, Droplet, Cloud } from "lucide-react";
import { getWeatherLayerConfig } from "@/lib/api";
import type { WeatherLayerType } from "@/lib/types";

interface LayerOption {
  id: WeatherLayerType;
  label: string;
  icon: React.ReactNode;
}

interface WeatherLayersPanelProps {
  onLayerChange?: (layerConfig: any) => void;
  selectedLayer?: WeatherLayerType;
  isDisabled?: boolean;
  disabledMessage?: string;
}

export function WeatherLayersPanel({
  onLayerChange,
  selectedLayer: externalSelectedLayer,
  isDisabled = false,
  disabledMessage,
}: WeatherLayersPanelProps) {
  const [selectedLayer, setSelectedLayer] =
    useState<WeatherLayerType>("temperature");
  const [loading, setLoading] = useState(false);

  const layers: LayerOption[] = [
    {
      id: "temperature",
      label: "Temperature",
      icon: <Thermometer className="h-5 w-5" />,
    },
    { id: "pressure", label: "Pressure", icon: <Gauge className="h-5 w-5" /> },
    { id: "wind_arrows", label: "Wind", icon: <Wind className="h-5 w-5" /> },
    {
      id: "precipitation",
      label: "Precipitation",
      icon: <Droplet className="h-5 w-5" />,
    },
    { id: "clouds", label: "Clouds", icon: <Cloud className="h-5 w-5" /> },
  ];

  // Use external selected layer if provided
  const currentSelectedLayer = externalSelectedLayer || selectedLayer;

  // REMOVED: No automatic loading - Map component is the only controller
  // The Map's Supreme Slider Controller handles all weather layer loading

  useEffect(() => {
    if (externalSelectedLayer && externalSelectedLayer !== selectedLayer) {
      setSelectedLayer(externalSelectedLayer);
    }
  }, [externalSelectedLayer]);

  // Timestamp-based reloading removed - Weather Maps 1.0 only shows current weather

  const loadLayerConfiguration = async (layerType: WeatherLayerType) => {
    // Don't load weather layers when panel is disabled (not on current weather)
    if (isDisabled) {
      console.log('Weather layers disabled - not on current weather');
      return;
    }
    
    try {
      setLoading(true);
      const layerConfig = await getWeatherLayerConfig(layerType);
      if (onLayerChange) {
        onLayerChange(layerConfig);
      }
    } catch (error) {
      console.error("Failed to load weather layer:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLayerSelect = async (layerType: WeatherLayerType) => {
    if (layerType === currentSelectedLayer || loading || isDisabled) return;

    setSelectedLayer(layerType);
    await loadLayerConfiguration(layerType);
  };

  return (
    <Card
      className={`w-55 bg-white/40 backdrop-blur-md border-white/20 shadow-lg p-3 ${isDisabled ? "opacity-60" : ""}`}
    >
      {isDisabled && disabledMessage && (
        <div className="mb-2 px-2 py-1 text-xs text-orange-600 bg-orange-50 rounded border border-orange-200">
          {disabledMessage}
        </div>
      )}
      <div className="flex flex-col gap-1">
        {layers.map((layer) => {
          const isSelected = currentSelectedLayer === layer.id;
          const buttonDisabled = loading || isDisabled;
          return (
            <button
              key={layer.id}
              onClick={() => handleLayerSelect(layer.id)}
              disabled={buttonDisabled}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected && !isDisabled
                  ? "bg-orange-500 text-white"
                  : isSelected && isDisabled
                    ? "bg-gray-400 text-white"
                    : "text-foreground/70 hover:bg-black/5"
              }`}
            >
              <span
                className={isSelected ? "text-white" : "text-foreground/50"}
              >
                {layer.icon}
              </span>
              <span className="font-medium">{layer.label}</span>
              {loading && isSelected && !isDisabled && (
                <div className="ml-auto">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
