"use client"

import React, { useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import type { ForecastWeatherData } from '../lib/types'

interface TimeSliderPanelProps {
  forecastData?: ForecastWeatherData;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  showCurrentWeather?: boolean;
}

export function TimeSliderPanel({ 
  forecastData, 
  currentIndex, 
  onIndexChange,
  showCurrentWeather = true 
}: TimeSliderPanelProps) {
  // Create time slots from forecast data or generate default slots
  const timeSlots = useMemo(() => {
    if (forecastData?.list) {
      // Use actual forecast timestamps
      return forecastData.list.map(item => new Date(item.dt * 1000));
    }
    
    // Fallback: generate default time slots
    const slots: Date[] = []
    const now = new Date()
    
    if (showCurrentWeather) {
      // Add "now" as first slot
      slots.push(now)
    }
    
    // Round to next 3-hour block for forecast start
    const startHour = Math.ceil(now.getHours() / 3) * 3
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 0, 0)
    
    // Add forecast slots (up to 40 for 5 days)
    for (let i = 0; i < 39; i++) { // 39 + 1 "now" = 40 total
      const slotTime = new Date(startDate.getTime() + i * 3 * 60 * 60 * 1000)
      slots.push(slotTime)
    }
    return slots
  }, [forecastData, showCurrentWeather])

  const maxIndex = timeSlots.length - 1

  const formatDateTime = (date: Date, index: number) => {
    if (index === 0 && showCurrentWeather && !forecastData) {
      return "Now"
    }
    
    const isToday = date.toDateString() === new Date().toDateString()
    const isTomorrow = date.toDateString() === new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
    
    const time = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
    
    if (isToday) {
      return `Today ${time}`
    } else if (isTomorrow) {
      return `Tomorrow ${time}`
    } else {
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      return `${month}-${day} ${time}`
    }
  }

  const handlePrevious = () => {
    onIndexChange(Math.max(0, currentIndex - 1))
  }

  const handleNext = () => {
    onIndexChange(Math.min(maxIndex, currentIndex + 1))
  }

  const handleSliderChange = (value: number[]) => {
    onIndexChange(value[0])
  }

  // Don't render if no time slots
  if (timeSlots.length === 0) {
    return null
  }

  return (
    <div className="w-[500px] bg-white/40 backdrop-blur-md border border-white/20 shadow-lg rounded-lg p-3 flex items-center gap-3">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentIndex === 0}
        className="flex-shrink-0 w-8 h-8 rounded-md bg-black/10 hover:bg-black/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        aria-label="Previous time"
      >
        <ChevronLeft className="h-4 w-4 text-foreground" />
      </button>

      {/* Slider */}
      <div className="flex-1">
        <Slider
          value={[currentIndex]}
          onValueChange={handleSliderChange}
          min={0}
          max={maxIndex}
          step={1}
          className="[&_[data-slot=slider-track]]:bg-black/20 [&_[data-slot=slider-range]]:bg-black/30 [&_[data-slot=slider-thumb]]:bg-orange-500 [&_[data-slot=slider-thumb]]:border-orange-500 [&_[data-slot=slider-thumb]]:w-4 [&_[data-slot=slider-thumb]]:h-4"
        />
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentIndex === maxIndex}
        className="flex-shrink-0 w-8 h-8 rounded-md bg-black/10 hover:bg-black/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        aria-label="Next time"
      >
        <ChevronRight className="h-4 w-4 text-foreground" />
      </button>

      {/* Date Time Display */}
      <div className="flex-shrink-0 text-xs font-medium text-foreground whitespace-nowrap min-w-[100px] text-right">
        {formatDateTime(timeSlots[currentIndex], currentIndex)}
      </div>
    </div>
  )
}