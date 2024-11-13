// src/SatelliteView.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Weather.css'; // Assuming satellite-view styles are in Weather.css

const SatelliteView = ({ lat, lon }) => {
  const [imageUrl, setImageUrl] = useState('');

  const fetchSatelliteImage = async () => {
    try {
      const response = await axios.get(`/api/satellite?lat=${lat}&lon=${lon}`);
      setImageUrl(response.data.imageUrl);
    } catch (error) {
      console.error('Error fetching satellite image:', error);
    }
  };

  useEffect(() => {
    if (lat && lon) {
      fetchSatelliteImage();

      // Refresh every hour
      const intervalId = setInterval(fetchSatelliteImage, 3600000); // 1 hour in milliseconds
      return () => clearInterval(intervalId);
    }
  }, [lat, lon]);

  return (
    <div className="satellite-view">
      <h2>Live Regional Satellite View</h2>
      {imageUrl ? (
        <img src={imageUrl} alt="Regional Satellite View" className="satellite-image" />
      ) : (
        <p>Loading satellite view...</p>
      )}
    </div>
  );
};

export default SatelliteView;
