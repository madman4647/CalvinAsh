const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const healthRoutes = require('./routes/health.routes');
const { router: authRoutes } = require('./routes/auth.routes');
const senateRoutes = require('./routes/senate.routes');
const ccaRoutes = require('./routes/cca.routes');

function createApp() {
  const app = express();

  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Every route registers its own full path via defineRoute (see
  // routeRegistry.js), so registry.path is always the real URL - gate checks
  // 3/4/5 rely on that to hit routes directly. Mount at root, not a prefix.
  app.use(healthRoutes);
  app.use(authRoutes);
  app.use(senateRoutes);
  app.use(ccaRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
