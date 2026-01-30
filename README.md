# Map Weather App

A Next.js application that displays an interactive map with real-time weather data. Click anywhere on the map to get current weather information for that location.

## Features

- **Weather Data**: Real-time weather information from [OpenWeatherMap API](https://openweathermap.org/api)
- **Location Search**: Reverse geocoding to display location names
- **Responsive UI**: Weather panel with collapsible details

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Runtime**: [Bun](https://bun.sh/) for fast package management and development
- **Map Engine**: [MapLibre GL JS](https://maplibre.org/maplibre-gl-js/docs/)
- **Map Tiles**: [OpenFreeMap](https://openfreemap.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

## Getting Started

### 1. Environment Setup

First, set up your environment variables:

1. Copy the example environment file:

   ```bash
   cp .env.example .env.local
   ```

2. Get your free OpenWeatherMap API key from [https://openweathermap.org/api](https://openweathermap.org/api)

3. Open `.env.local` and replace `your_openweathermap_api_key_here` with your actual API key:
   ```
   NEXT_PUBLIC_MAP_API_KEY=your_actual_api_key_here
   ```

### 2. Install Dependencies

This project uses Bun as the package manager:

```bash
bun install
```

### 3. Run the Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. The map loads centered on Barcelona by default
2. Weather information for the center location is displayed automatically
3. Click anywhere on the map to get weather data for that location
4. The weather panel shows:
   - Location name and coordinates
   - Current temperature and weather icon
   - Detailed information (expandable): feels like temperature, wind speed/direction, humidity, cloud coverage, and atmospheric pressure
