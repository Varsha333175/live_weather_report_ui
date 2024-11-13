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
  const [hourlyForecast, setHourlyForecast] = useState(null);
  const [stormAlerts, setStormAlerts] = useState(null);

  useEffect(() => {
    if (lat && lon) {
      fetchWeather();
      fetchAlerts();
    }
  }, [lat, lon]);

  const fetchWeather = async () => {
    try {
      const response = await axios.get(`/api/weather?lat=${lat}&lon=${lon}`);
      setHourlyForecast(response.data.hourlyForecast);
    } catch (error) {
      console.error('Error fetching weather data:', error);
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
      return daytime ? <WiDaySunny className="weather-icon sunny" /> : <WiNightClear className="weather-icon clear-night" />;
    }
    if (condition === 'Mostly Sunny') {
      return <WiDaySunnyOvercast className="weather-icon mostly-sunny" />;
    }
    if (condition === 'Partly Sunny' || condition === 'Partly Cloudy') {
      return daytime ? <WiDayCloudy className="weather-icon partly-sunny" /> : <WiNightAltPartlyCloudy className="weather-icon partly-cloudy-night" />;
    }
    if (condition === 'Mostly Cloudy') {
      return daytime ? <WiDayCloudy className="weather-icon mostly-cloudy" /> : <WiNightAltCloudy className="weather-icon mostly-cloudy-night" />;
    }
    if (condition === 'Cloudy') {
      return <WiCloud className="weather-icon cloudy" />;
    }
    if (condition === 'Rain' || condition === 'Showers') {
      return daytime ? <WiDayRainMix className="weather-icon rain-day" /> : <WiNightAltRainMix className="weather-icon rain-night" />;
    }
    if (condition === 'Snow') {
      return <WiSnow className="weather-icon snow" />;
    }
    if (condition === 'Thunderstorm') {
      return <WiThunderstorm className="weather-icon thunderstorm" />;
    }
    return daytime ? <WiDaySunny className="weather-icon default-day" /> : <WiNightClear className="weather-icon default-night" />;
  };

  return (
    <div className="weather-container">
      <h1>Hourly Weather Forecast</h1>
      {hourlyForecast ? (
        <div className="forecast-list">
          {hourlyForecast.slice(0, 12).map((hour, index) => (
            <div key={index} className={`forecast-item ${hour.condition.toLowerCase().replace(" ", "-")}`}>
              <div className="icon-container">
                {getWeatherIcon(hour.condition, hour.startTime)}
              </div>
              <p className="time">{new Date(hour.startTime).toLocaleString()}</p>
              <p className="temperature">{hour.temperature}°C</p>
              <p className="condition">{hour.condition}</p>
              <p className="wind">Wind: {hour.windSpeed} from {hour.windDirection}</p>
              <p className="precipitation">Precipitation: {hour.precipitationProbability}%</p>
              <p className="humidity">Humidity: {hour.humidity}%</p>
            </div>
          ))}
        </div>
      ) : (
        <p>Loading hourly weather data...</p>
      )}

      <div className="alerts-section">
        <h2 className="alert-title">Active Storm Alerts</h2>
        {stormAlerts ? (
          stormAlerts.length > 0 ? (
            stormAlerts.map((alert, index) => (
              <div key={index} className="alert-item">
                <p><strong>Event:</strong> {alert.event}</p>
                <p><strong>Severity:</strong> {alert.severity}</p>
                <p><strong>Description:</strong> {alert.description}</p>
                <p><strong>Instructions:</strong> {alert.instruction}</p>
                <p><strong>Effective:</strong> {new Date(alert.effective).toLocaleString()}</p>
                <p><strong>Expires:</strong> {new Date(alert.expires).toLocaleString()}</p>
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
