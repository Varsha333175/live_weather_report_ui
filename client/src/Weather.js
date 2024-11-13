// src/Weather.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  WiDaySunny,
  WiNightClear,
  WiDayCloudy,
  WiNightAltCloudy,
  WiCloud,
  WiNightCloudy,
  WiRain,
  WiSnow,
  WiThunderstorm,
  WiDayRainMix,
  WiNightAltRainMix,
  WiDaySunnyOvercast,
  WiNightAltPartlyCloudy,
} from 'react-icons/wi';
import './Weather.css';

const Weather = ({ lat, lon }) => {
  const [forecastType, setForecastType] = useState('hourly');
  const [forecastData, setForecastData] = useState(null);
  const [stormAlerts, setStormAlerts] = useState(null);

  useEffect(() => {
    if (lat && lon) {
      fetchForecastData();
      fetchAlerts();
    }
  }, [lat, lon, forecastType]);

  const fetchForecastData = async () => {
    let endpoint;
    switch (forecastType) {
      case 'daily':
        endpoint = '/api/weather/daily';
        break;
      case '10days':
        endpoint = '/api/weather/10days';
        break;
      default:
        endpoint = '/api/weather';
    }

    try {
      const response = await axios.get(`${endpoint}?lat=${lat}&lon=${lon}`);
      setForecastData(
        forecastType === 'hourly'
          ? response.data.hourlyForecast
          : forecastType === 'daily'
          ? response.data.dailyForecast
          : response.data.next10DaysForecast
      );
    } catch (error) {
      console.error(`Error fetching ${forecastType} weather data:`, error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`/api/alerts?lat=${lat}&lon=${lon}`);
      setStormAlerts(response.data.stormAlerts);
    } catch (error) {
      console.error('Error fetching storm alerts:', error);
    }
  };

  const isDaytime = (time) => {
    const hours = new Date(time).getHours();
    return hours >= 6 && hours < 18;
  };

  const getWeatherIcon = (condition, time) => {
    const daytime = isDaytime(time);
    if (condition === 'Clear') {
      return daytime ? <WiDaySunny /> : <WiNightClear />;
    }
    if (condition.includes('Sunny') || condition.includes('Cloudy')) {
      return daytime ? <WiDaySunnyOvercast /> : <WiNightAltCloudy />;
    }
    if (condition.includes('Rain')) return <WiRain />;
    if (condition.includes('Snow')) return <WiSnow />;
    if (condition.includes('Thunderstorm')) return <WiThunderstorm />;
    return daytime ? <WiDaySunny /> : <WiNightClear />;
  };

  return (
    <div className="weather-container">
      <h1>Weather Forecast</h1>
      <div className="forecast-buttons">
        <button onClick={() => setForecastType('hourly')}>Hourly</button>
        <button onClick={() => setForecastType('daily')}>Daily</button>
        <button onClick={() => setForecastType('10days')}>Next 10 Days</button>
      </div>

      {forecastData ? (
        <div className="forecast-list">
          {forecastData.map((data, index) => (
            <div key={index} className="forecast-item">
              <div className="icon-container">
                {getWeatherIcon(data.condition, data.startTime || data.date)}
              </div>
              <p className="time">{data.startTime ? new Date(data.startTime).toLocaleString() : data.date}</p>
              <p className="temperature">{data.temperature || data.temperatureHigh}°C</p>
              <p className="condition">{data.condition}</p>
              <p className="wind">Wind: {data.windSpeed} from {data.windDirection}</p>
              <p className="precipitation">Precipitation: {data.precipitationProbability || 'N/A'}%</p>
              <p className="humidity">Humidity: {data.humidity || 'N/A'}%</p>
              <p className="details">{data.detailedForecast}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>Loading {forecastType} weather data...</p>
      )}

      <div className="alerts-section">
        <h2>Active Storm Alerts</h2>
        {stormAlerts ? (
          stormAlerts.length > 0 ? (
            stormAlerts.map((alert, index) => (
              <div key={index} className="alert-item">
                <p><strong>Event:</strong> {alert.event}</p>
                <p><strong>Severity:</strong> {alert.severity}</p>
                <p><strong>Description:</strong> {alert.description}</p>
              </div>
            ))
          ) : (
            <p>No active storm alerts in your area.</p>
          )
        ) : (
          <p>Loading storm alerts...</p>
        )}
      </div>
    </div>
  );
};

export default Weather;
