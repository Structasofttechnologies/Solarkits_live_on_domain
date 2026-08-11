const express = require('express');
const cors = require('cors');
require('dotenv').config();

const geolocationRoutes = require('./routes/geolocationRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Geolocation routes mounted at /api/geolocation
app.use('/api/geolocation', geolocationRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Location Module Backend API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Location Module Backend API listening on port ${PORT}`);
});
