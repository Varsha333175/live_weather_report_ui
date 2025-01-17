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

    // Get hourly forecast
    const forecastResponse = await axios.get(forecastHourly);
    const hourlyForecast = forecastResponse.data.properties.periods.map(period => ({
      startTime: period.startTime,
      temperature: period.temperature,
      condition: period.shortForecast,
      windSpeed: period.windSpeed || 'N/A',
      windDirection: period.windDirection || 'N/A',
      detailedForecast: period.detailedForecast || '',
    }));

    // Get additional grid data like humidity and precipitation
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
 * /api/weather/daily:
 *   get:
 *     summary: Get daily weather data for a specific location
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
 *         description: Daily weather data retrieved successfully
 */
app.get('/api/weather/daily', async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const pointsResponse = await axios.get(`https://api.weather.gov/points/${lat},${lon}`);
    const forecastResponse = await axios.get(pointsResponse.data.properties.forecast);

    const dailyForecast = forecastResponse.data.properties.periods.map(period => ({
      date: period.startTime.split('T')[0],
      temperatureHigh: period.temperature,
      condition: period.shortForecast,
      windSpeed: period.windSpeed,
      windDirection: period.windDirection,
      detailedForecast: period.detailedForecast,
      precipitationProbability: period.probabilityOfPrecipitation?.value || 'N/A',
      humidity: period.relativeHumidity?.value || 'N/A',
    }));

    res.json({ dailyForecast });
  } catch (error) {
    console.error('Error fetching daily weather data:', error.message);
    res.status(500).json({ error: 'Failed to fetch daily weather data' });
  }
});


/**
 * @swagger
 * /api/weather/10days:
 *   get:
 *     summary: Get 10-day weather forecast data for a specific location
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
 *         description: 10-day weather data retrieved successfully
 */
app.get('/api/weather/10days', async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const pointsResponse = await axios.get(`https://api.weather.gov/points/${lat},${lon}`);
    const forecastResponse = await axios.get(pointsResponse.data.properties.forecast);

    const next10DaysForecast = forecastResponse.data.properties.periods.slice(0, 10).map(period => ({
      date: period.startTime.split('T')[0],
      temperatureHigh: period.temperature,
      condition: period.shortForecast,
      windSpeed: period.windSpeed,
      windDirection: period.windDirection,
      detailedForecast: period.detailedForecast,
      precipitationProbability: period.probabilityOfPrecipitation?.value || 'N/A',
      humidity: period.relativeHumidity?.value || 'N/A',
    }));

    res.json({ next10DaysForecast });
  } catch (error) {
    console.error('Error fetching 10-day weather data:', error.message);
    res.status(500).json({ error: 'Failed to fetch 10-day weather data' });
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
/**
 * @swagger
 * /api/airquality:
 *   get:
 *     summary: Get air quality data for a specific location
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
 *         description: Air quality data retrieved successfully
 */
app.get('/api/airquality', async (req, res) => {
  const { lat, lon } = req.query;

  try {
    const airQualityUrl = `http://www.airnowapi.org/aq/observation/latLong/current?format=application/json&latitude=${lat}&longitude=${lon}&distance=25&API_KEY=${process.env.AIRNOW_API_KEY}`;
    
    const airQualityResponse = await axios.get(airQualityUrl);
    
    if (airQualityResponse.data.length > 0) {
      const airQualityData = airQualityResponse.data[0];
      res.json({
        DateObserved: airQualityData.DateObserved,
        AQI: airQualityData.AQI,
        Category: airQualityData.Category.Name,
        Pollutant: airQualityData.ParameterName,
      });
    } else {
      res.status(404).json({ error: 'No air quality data found for the given location.' });
    }
  } catch (error) {
    console.error('Error fetching air quality data:', error.message);
    res.status(500).json({ error: 'Failed to fetch air quality data' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


const path = require('path');

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static(path.join(__dirname, 'build')));

  // Catch-all handler to send index.html for any unmatched routes
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
  });
}
