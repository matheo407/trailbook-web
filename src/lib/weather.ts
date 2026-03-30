export interface WeatherDay {
  date: string; // ISO date string
  label: string; // "Aujourd'hui", "Demain", etc.
  tempMin: number;
  tempMax: number;
  precipitation: number; // mm
  windSpeed: number; // km/h
  weatherCode: number;
  description: string;
  emoji: string;
}

// WMO Weather interpretation codes
function interpretWeatherCode(code: number): { description: string; emoji: string } {
  if (code === 0) return { description: 'Ciel dégagé', emoji: '☀️' };
  if (code <= 2) return { description: 'Peu nuageux', emoji: '🌤️' };
  if (code === 3) return { description: 'Couvert', emoji: '☁️' };
  if (code <= 49) return { description: 'Brouillard', emoji: '🌫️' };
  if (code <= 59) return { description: 'Bruine', emoji: '🌦️' };
  if (code <= 69) return { description: 'Pluie', emoji: '🌧️' };
  if (code <= 79) return { description: 'Neige', emoji: '❄️' };
  if (code <= 84) return { description: 'Averses', emoji: '🌦️' };
  if (code <= 94) return { description: 'Neige', emoji: '🌨️' };
  return { description: 'Orage', emoji: '⛈️' };
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherDay[]> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lng}` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code` +
    `&timezone=auto&forecast_days=4`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Météo indisponible');
  const data = await res.json();

  const days: string[] = data.daily.time;
  const today = new Date().toISOString().split('T')[0];

  return days.slice(0, 4).map((date: string, i: number) => {
    const code = data.daily.weather_code[i];
    const { description, emoji } = interpretWeatherCode(code);

    let label = '';
    if (date === today) label = "Aujourd'hui";
    else if (i === 1) label = 'Demain';
    else {
      label = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long' });
      label = label.charAt(0).toUpperCase() + label.slice(1);
    }

    return {
      date,
      label,
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      precipitation: Math.round(data.daily.precipitation_sum[i] * 10) / 10,
      windSpeed: Math.round(data.daily.wind_speed_10m_max[i]),
      weatherCode: code,
      description,
      emoji,
    };
  });
}
