import { NextRequest, NextResponse } from 'next/server';

// OpenWeatherMap Current Weather API route
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const units = searchParams.get('units') || 'metric'; // default to Celsius
  const lang = searchParams.get('lang') || 'en';
  
  // Validate required parameters
  if (!lat || !lon) {
    return NextResponse.json(
      { error: 'Both lat and lon parameters are required' }, 
      { status: 400 }
    );
  }

  // Validate coordinates
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: 'Invalid coordinates. lat and lon must be valid numbers' },
      { status: 400 }
    );
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json(
      { error: 'Invalid coordinates. lat must be between -90 and 90, lon between -180 and 180' },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.NEXT_PUBLIC_MAP_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenWeatherMap API key not configured' }, 
        { status: 500 }
      );
    }

    // Make API call to OpenWeatherMap
    const weatherUrl = new URL('https://api.openweathermap.org/data/2.5/weather');
    weatherUrl.searchParams.set('lat', lat);
    weatherUrl.searchParams.set('lon', lon);
    weatherUrl.searchParams.set('appid', apiKey);
    weatherUrl.searchParams.set('units', units);
    weatherUrl.searchParams.set('lang', lang);

    const response = await fetch(weatherUrl.toString());
    
    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 }
        );
      }
      throw new Error(`OpenWeatherMap API error: ${response.status}`);
    }

    const weatherData = await response.json();
    
    // Return the weather data with additional metadata
    return NextResponse.json({
      ...weatherData,
      units,
      timestamp: new Date().toISOString(),
      source: 'OpenWeatherMap'
    });
    
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
