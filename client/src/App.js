// src/App.js
import React, { useState, useEffect } from 'react';
import Weather from './Weather';
import SatelliteView from './SatelliteView';
import './App.css';

function App() {
  const [location, setLocation] = useState({ lat: null, lon: null });
  const [bgColor, setBgColor] = useState('');

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lon: longitude });
      },
      (error) => console.error('Error fetching location:', error),
      { enableHighAccuracy: true }
    );

    // Change background color based on time of day
    const hours = new Date().getHours();
    if (hours >= 6 && hours < 18) {
      setBgColor('#a7d0f4'); // Light blue for day
    } else if (hours >= 18 && hours < 20) {
      setBgColor('#ffd59e'); // Orange for evening
    } else {
      setBgColor('#2c3e50'); // Dark blue for night
    }
  }, []);

  if (!location.lat || !location.lon) {
    return <p>Fetching location...</p>;
  }

  return (
    <div className="App" style={{ backgroundColor: bgColor }}>
      <h1>Storm Reporting App</h1>
      <Weather lat={location.lat} lon={location.lon} />
      <SatelliteView lat={location.lat} lon={location.lon} />
    </div>
  );
}

export default App;
