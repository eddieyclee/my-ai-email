// Open-Meteo：免 token 的公開天氣 API
const TAIPEI = { name: "台北", latitude: 25.033, longitude: 121.5654 };

// WMO 天氣代碼 → 中文描述
const WEATHER_CODES: Record<number, string> = {
  0: "晴朗",
  1: "大致晴朗",
  2: "局部多雲",
  3: "陰天",
  45: "有霧",
  48: "霧凇",
  51: "毛毛雨（小）",
  53: "毛毛雨（中）",
  55: "毛毛雨（大）",
  61: "小雨",
  63: "中雨",
  65: "大雨",
  80: "陣雨（小）",
  81: "陣雨（中）",
  82: "陣雨（大）",
  95: "雷雨",
  96: "雷雨伴隨冰雹",
  99: "強雷雨伴隨冰雹",
};

export type Weather = {
  location: string;
  date: string;
  description: string;
  currentTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  precipitationProbability: number;
};

export async function fetchWeather(): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(TAIPEI.latitude),
    longitude: String(TAIPEI.longitude),
    current: "temperature_2m,weather_code",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
    timezone: "Asia/Taipei",
    forecast_days: "1",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Open-Meteo 回應 ${res.status}`);

  const data = await res.json();
  const code: number = data.daily.weather_code[0];
  return {
    location: TAIPEI.name,
    date: data.daily.time[0],
    description: WEATHER_CODES[code] ?? `天氣代碼 ${code}`,
    currentTemperature: data.current.temperature_2m,
    maxTemperature: data.daily.temperature_2m_max[0],
    minTemperature: data.daily.temperature_2m_min[0],
    precipitationProbability: data.daily.precipitation_probability_max[0],
  };
}
