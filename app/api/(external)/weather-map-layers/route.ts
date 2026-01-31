import { NextRequest, NextResponse } from 'next/server';

// OpenWeatherMap Weather Map Layers API route
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const layer = searchParams.get('layer');
  const opacity = searchParams.get('opacity'); // Will use layer-specific default if not provided
  
  // Validate required parameters
  if (!layer) {
    return NextResponse.json(
      { error: 'layer parameter is required' }, 
      { status: 400 }
    );
  }

  // Validate layer type
  const validLayers = ['precipitation', 'clouds', 'temperature', 'wind_arrows', 'pressure'];
  if (!validLayers.includes(layer)) {
    return NextResponse.json(
      { 
        error: `Invalid layer type. Must be one of: ${validLayers.join(', ')}` 
      },
      { status: 400 }
    );
  }

  // Validate opacity if provided
  if (opacity !== null) {
    const opacityNum = parseFloat(opacity);
    if (isNaN(opacityNum) || opacityNum < 0 || opacityNum > 1) {
      return NextResponse.json(
        { error: 'opacity must be a number between 0 and 1' },
        { status: 400 }
      );
    }
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_MAP_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenWeatherMap API key not configured' }, 
        { status: 500 }
      );
    }

    // Weather Maps 1.0 layer configurations (simpler, works with free API keys)
    const layerConfigs: Record<string, {
      code: string;
      defaultOpacity: string;
    }> = {
      precipitation: {
        code: 'precipitation_new',
        defaultOpacity: '0.8'
      },
      clouds: {
        code: 'clouds_new', 
        defaultOpacity: '0.5'
      },
      temperature: {
        code: 'temp_new',
        defaultOpacity: '0.6'
      },
      wind_arrows: {
        code: 'wind_new',
        defaultOpacity: '0.6'
      },
      pressure: {
        code: 'pressure_new',
        defaultOpacity: '0.4'
      }
    };

    const config = layerConfigs[layer];
    const layerCode = config.code;
    
    // Use layer-specific defaults or provided values
    const finalOpacity = opacity || config.defaultOpacity;
    
    // Simple Weather Maps 1.0 URL format
    const tileUrl = `https://tile.openweathermap.org/map/${layerCode}/{z}/{x}/{y}.png?appid=${apiKey}`;

    // Return complete layer configuration for MapLibre GL JS
    const response = {
      layerType: layer,
      layerCode: layerCode,
      tileUrl,
      sourceConfig: {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution: '© OpenWeatherMap'
      },
      layerConfig: {
        id: `weather-${layer}`,
        type: 'raster',
        source: `weather-${layer}-source`,
        paint: {
          'raster-opacity': parseFloat(finalOpacity),
          'raster-fade-duration': 300
        }
      },
      settings: {
        opacity: finalOpacity
      },
      displayName: getDisplayName(layer),
      timestamp: new Date().toISOString(),
      source: 'OpenWeatherMap Weather Maps 1.0'
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Weather map layers API error:', error);
    return NextResponse.json(
      { error: 'Failed to get weather map layer configuration' },
      { status: 500 }
    );
  }
}

// Get all available weather layers
export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_MAP_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenWeatherMap API key not configured' }, 
        { status: 500 }
      );
    }

    // Use the same layer configurations as in GET endpoint (Weather Maps 1.0)
    const layerConfigs: Record<string, {
      code: string;
      defaultOpacity: string;
    }> = {
      precipitation: {
        code: 'precipitation_new',
        defaultOpacity: '0.8'
      },
      clouds: {
        code: 'clouds_new',
        defaultOpacity: '0.5'
      },
      temperature: {
        code: 'temp_new',
        defaultOpacity: '0.6'
      },
      wind_arrows: {
        code: 'wind_new',
        defaultOpacity: '0.6'
      },
      pressure: {
        code: 'pressure_new',
        defaultOpacity: '0.4'
      }
    };

    const availableLayers = Object.entries(layerConfigs).map(([type, config]) => ({
      type,
      code: config.code,
      displayName: getDisplayName(type),
      description: getLayerDescription(type),
      units: getLayerUnits(type),
      defaultSettings: {
        opacity: config.defaultOpacity
      }
    }));

    return NextResponse.json({
      layers: availableLayers,
      timestamp: new Date().toISOString(),
      source: 'OpenWeatherMap'
    });

  } catch (error) {
    console.error('Weather layers list API error:', error);
    return NextResponse.json(
      { error: 'Failed to get available weather layers' },
      { status: 500 }
    );
  }
}

// Helper functions
function getDisplayName(layer: string): string {
  const displayNames: Record<string, string> = {
    precipitation: 'Precipitation Intensity',
    clouds: 'Cloudiness',
    temperature: 'Air Temperature',
    wind_arrows: 'Wind (Speed + Direction)',
    pressure: 'Atmospheric Pressure'
  };
  return displayNames[layer] || layer;
}

function getLayerDescription(layer: string): string {
  const descriptions: Record<string, string> = {
    precipitation: 'Precipitation intensity in mm/s',
    clouds: 'Cloud coverage percentage',
    temperature: 'Air temperature at 2 meters height',
    wind_arrows: 'Joint display of wind speed (color) and wind direction (arrows)',
    pressure: 'Atmospheric pressure on mean sea level'
  };
  return descriptions[layer] || '';
}

function getLayerUnits(layer: string): string {
  const units: Record<string, string> = {
    precipitation: 'mm/s',
    clouds: '%',
    temperature: '°C',
    wind_arrows: 'm/s',
    pressure: 'hPa'
  };
  return units[layer] || '';
}
