import { useColors } from '@/hooks/useColors';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type WeatherDay = {
  date: string;
  tempMax: number;
  tempMin: number;
  code: number;
};

type Props = {
  destination: string;
};

// WMO weather codes to emoji
const weatherEmoji = (code: number): string => {
  if (code === 0) return '☀️';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️';
  return '🌡️';
};

const weatherLabel = (code: number): string => {
  if (code === 0) return 'Clear';
  if (code <= 3) return 'Cloudy';
  if (code <= 48) return 'Fog';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rain';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow';
  if (code <= 99) return 'Thunder';
  return 'Unknown';
};

export default function WeatherCard({ destination }: Props) {
  const c = useColors();
  const [forecast, setForecast] = useState<WeatherDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('');

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Geocode the destination
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (!geoData.results || geoData.results.length === 0) {
          throw new Error(`Could not find "${destination}" on the map`);
        }

        const { latitude, longitude, name: city, country } = geoData.results[0];
        setLocationName(`${city}, ${country}`);

        // Step 2: Get 5-day forecast
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=5`;
        const forecastRes = await fetch(forecastUrl);
        const forecastData = await forecastRes.json();

        if (!forecastData.daily) {
          throw new Error('Could not fetch forecast data');
        }

        const days: WeatherDay[] = forecastData.daily.time.map((date: string, i: number) => ({
          date,
          tempMax: Math.round(forecastData.daily.temperature_2m_max[i]),
          tempMin: Math.round(forecastData.daily.temperature_2m_min[i]),
          code: forecastData.daily.weather_code[i],
        }));

        setForecast(days);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [destination]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.title, { color: c.text }]}>Weather</Text>
      {locationName ? (
        <Text style={[styles.location, { color: c.textSoft }]}>{locationName}</Text>
      ) : null}

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={c.accent} size="small" />
          <Text style={[styles.loadingText, { color: c.textFaint }]}>Checking the forecast...</Text>
        </View>
      ) : null}

      {error ? (
        <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
      ) : null}

      {!loading && !error && forecast.length > 0 ? (
        <View style={styles.forecastRow}>
          {forecast.map((day) => (
            <View key={day.date} style={[styles.dayCard, { backgroundColor: c.accentSoft }]}>
              <Text style={[styles.dayLabel, { color: c.textSoft }]}>{formatDate(day.date)}</Text>
              <Text style={styles.dayIcon}>{weatherEmoji(day.code)}</Text>
              <Text style={[styles.dayTemp, { color: c.text }]}>{day.tempMax}°</Text>
              <Text style={[styles.dayTempLow, { color: c.textFaint }]}>{day.tempMin}°</Text>
              <Text style={[styles.dayDesc, { color: c.textFaint }]}>{weatherLabel(day.code)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, marginBottom: 12, padding: 14 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  location: { fontSize: 13, marginBottom: 10 },
  loadingRow: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingVertical: 12 },
  loadingText: { fontSize: 13 },
  errorText: { fontSize: 13, paddingVertical: 8 },
  forecastRow: { flexDirection: 'row', gap: 6 },
  dayCard: { alignItems: 'center', borderRadius: 10, flex: 1, paddingVertical: 10, paddingHorizontal: 4 },
  dayLabel: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
  dayIcon: { fontSize: 22, marginBottom: 4 },
  dayTemp: { fontSize: 15, fontWeight: '700' },
  dayTempLow: { fontSize: 12 },
  dayDesc: { fontSize: 9, marginTop: 2, textAlign: 'center' },
});
