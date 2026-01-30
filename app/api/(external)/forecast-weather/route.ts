import { NextRequest, NextResponse } from 'next/server';

// OpenWeatherMap 5-Day Forecast API route
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const units = searchParams.get('units') || 'metric'; // default to Celsius
  const lang = searchParams.get('lang') || 'en';
  const cnt = searchParams.get('cnt'); // optional - number of timestamps
  
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

  // Validate cnt parameter if provided
  if (cnt) {
    const countNum = parseInt(cnt);
    if (isNaN(countNum) || countNum < 1 || countNum > 40) {
      return NextResponse.json(
        { error: 'cnt parameter must be a number between 1 and 40' },
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

    // Make API call to OpenWeatherMap 5-day forecast
    const forecastUrl = new URL('https://api.openweathermap.org/data/2.5/forecast');
    forecastUrl.searchParams.set('lat', lat);
    forecastUrl.searchParams.set('lon', lon);
    forecastUrl.searchParams.set('appid', apiKey);
    forecastUrl.searchParams.set('units', units);
    forecastUrl.searchParams.set('lang', lang);
    
    if (cnt) {
      forecastUrl.searchParams.set('cnt', cnt);
    }

    const response = await fetch(forecastUrl.toString());
    
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

    const forecastData = await response.json();
    
    // Return the forecast data with additional metadata
    return NextResponse.json({
      ...forecastData,
      units,
      timestamp: new Date().toISOString(),
      source: 'OpenWeatherMap'
    });
    
  } catch (error) {
    console.error('Forecast API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forecast data' },
      { status: 500 }
    );
  }
}