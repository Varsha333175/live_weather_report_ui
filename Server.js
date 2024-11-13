const express = require('express');
const axios = require('axios');
const cors = require('cors');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
app.use(cors());

const NASA_API_KEY = process.env.NASA_API_KEY;

// Swagger setup
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Storm Reporting API',
      version: '1.0.0',
      description: 'API for fetching weather data, storm alerts, and satellite imagery based on location',
    },
    servers: [{ url: 'http://localhost:5000' }],
  },
  apis: ['./server.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /api/weather:
 *   get:
 *     summary: Get hourly weather data for a specific location
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude of the location
 *       - in: query
 *         name: lon
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude of the location
 *     responses:
 *       200:
 *         description: Hourly weather data retrieved successfully
 */
app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const pointsResponse = await axios.get(`https://api.weather.gov/points/${lat},${lon}`);
    const { forecastHourly, forecastGridData } = pointsResponse.data.properties;

    const forecastResponse = await axios.get(forecastHourly);
    const hourlyForecast = forecastResponse.data.properties.periods.map(period => ({
      startTime: period.startTime,
      temperature: period.temperature,
      condition: period.shortForecast,
      windSpeed: period.windSpeed || 'N/A',
      windDirection: period.windDirection || 'N/A',
      detailedForecast: period.detailedForecast || '',
    }));

    const gridResponse = await axios.get(forecastGridData);
    const gridProperties = gridResponse.data.properties;

    const detailedHourlyForecast = hourlyForecast.map((period, index) => ({
      ...period,
      humidity: gridProperties.relativeHumidity.values[index]?.value || 'N/A',
      precipitationProbability: gridProperties.probabilityOfPrecipitation.values[index]?.value || 'N/A',
    }));

    res.json({ hourlyForecast: detailedHourlyForecast });
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

/**
 * @swagger
 * /api/alerts:
 *   get:
 *     summary: Get active storm alerts for a specific location
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude of the location
 *       - in: query
 *         name: lon
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude of the location
 *     responses:
 *       200:
 *         description: Active storm alerts retrieved successfully
 */
app.get('/api/alerts', async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const pointsResponse = await axios.get(`https://api.weather.gov/points/${lat},${lon}`);
    const forecastZoneUrl = pointsResponse.data.properties.forecastZone;
    const zoneId = forecastZoneUrl.split('/').pop();

    const alertsResponse = await axios.get(`https://api.weather.gov/alerts/active?zone=${zoneId}`);
    const stormAlerts = alertsResponse.data.features.map(alert => ({
      event: alert.properties.event,
      severity: alert.properties.severity,
      description: alert.properties.description,
      instruction: alert.properties.instruction,
      effective: alert.properties.effective,
      expires: alert.properties.expires,
    }));

    res.json({ stormAlerts });
  } catch (error) {
    console.error('Error fetching storm alerts:', error.message);
    res.status(500).json({ error: 'Failed to fetch storm alerts' });
  }
});

/**
 * @swagger
 * /api/satellite:
 *   get:
 *     summary: Get live regional satellite view for a specific location
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude of the location
 *       - in: query
 *         name: lon
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude of the location
 *     responses:
 *       200:
 *         description: Satellite image URL retrieved successfully
 */
// In server.js

app.get('/api/satellite', async (req, res) => {
  const { lat, lon } = req.query;

  try {
    // Construct the full image URL with the correct parameters
    const imageUrl = `https://api.nasa.gov/planetary/earth/imagery?lat=${lat}&lon=${lon}&dim=0.05&api_key=${NASA_API_KEY}`;
    
    // Respond with the constructed imageUrl
    res.json({ imageUrl });
  } catch (error) {
    console.error('Error fetching satellite imagery:', error.message);
    res.status(500).json({ error: 'Failed to fetch satellite imagery' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
