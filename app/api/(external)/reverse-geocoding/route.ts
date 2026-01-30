import { NextRequest, NextResponse } from 'next/server';

// OpenWeatherMap Reverse Geocoding API route - converts coordinates to location names
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');
  const limit = searchParams.get('limit') || '5';
  
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

  // Validate limit parameter
  const limitNum = parseInt(limit);
  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return NextResponse.json(
      { error: 'Limit must be a number between 1 and 100' },
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

    // Make API call to OpenWeatherMap Reverse Geocoding
    const reverseGeoUrl = new URL('http://api.openweathermap.org/geo/1.0/reverse');
    reverseGeoUrl.searchParams.set('lat', lat);
    reverseGeoUrl.searchParams.set('lon', lon);
    reverseGeoUrl.searchParams.set('limit', limit);
    reverseGeoUrl.searchParams.set('appid', apiKey);

    const response = await fetch(reverseGeoUrl.toString());
    
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
      throw new Error(`OpenWeatherMap Reverse Geocoding API error: ${response.status}`);
    }

    const locationData = await response.json();
    
    // Return the location data with additional metadata
    return NextResponse.json({
      results: locationData,
      query: { lat: latitude, lon: longitude, limit: limitNum },
      timestamp: new Date().toISOString(),
      source: 'OpenWeatherMap Reverse Geocoding'
    });
    
  } catch (error) {
    console.error('Reverse Geocoding API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location data' },
      { status: 500 }
    );
  }
}
