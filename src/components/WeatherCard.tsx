'use client';

import { useState, useEffect } from 'react';
import { Cloud, Wind, Droplets, Loader2, AlertCircle } from 'lucide-react';
import { fetchWeather, WeatherDay } from '@/lib/weather';
import { NamedLocation } from '@/types';

interface Props {
  location: NamedLocation;
}

export default function WeatherCard({ location }: Props) {
  const [days, setDays] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchWeather(location.lat, location.lng)
      .then(setDays)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [location.lat, location.lng]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <Loader2 size={18} className="text-[#2D6A4F] animate-spin flex-shrink-0" />
        <p className="text-sm text-gray-500">Chargement météo...</p>
      </div>
    );
  }

  if (error || days.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
        <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />
        <p className="text-sm text-gray-500">Météo indisponible</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-2">
        <Cloud size={16} className="text-[#2D6A4F]" />
        <p className="text-sm font-bold text-gray-900">Météo — {location.name}</p>
      </div>

      {/* Days */}
      <div className="grid grid-cols-4 divide-x divide-gray-50">
        {days.map((day) => (
          <div key={day.date} className="px-2 py-3 text-center">
            <p className="text-[10px] font-semibold text-gray-500 truncate">{day.label}</p>
            <p className="text-2xl my-1.5">{day.emoji}</p>
            <p className="text-xs font-bold text-gray-900">
              {day.tempMax}° <span className="font-normal text-gray-400">{day.tempMin}°</span>
            </p>
            {day.precipitation > 0 && (
              <div className="flex items-center justify-center gap-0.5 mt-1">
                <Droplets size={9} className="text-blue-400" />
                <span className="text-[9px] text-blue-400">{day.precipitation}mm</span>
              </div>
            )}
            <div className="flex items-center justify-center gap-0.5 mt-0.5">
              <Wind size={9} className="text-gray-400" />
              <span className="text-[9px] text-gray-400">{day.windSpeed}km/h</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
