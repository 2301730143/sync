require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const env = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

app.use(apiLimiter);

app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', service: 'auth-service', env: env.NODE_ENV } });
});

// Mounted at root here — the frontend/gateway is responsible for the
// /api/auth prefix (see vite.config.js proxy rules).
app.use('/', authRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
