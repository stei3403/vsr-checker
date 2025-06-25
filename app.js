const express = require('express');
const path = require('path');
const vsrRoute = require('./backend/routes/vsr');
const masterRoutes = require('./backend/routes/master');

require('dotenv').config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// Backend route
app.use('/api', vsrRoute);
app.use('/api', masterRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
