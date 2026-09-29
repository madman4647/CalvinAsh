const express = require('express');
const { defineRoute } = require('../lib/routeRegistry');
const { query } = require('../db');

const router = express.Router();

defineRoute(router, { method: 'get', path: '/api/health', dataChanging: false }, async (req, res, next) => {
  try {
    const result = await query('SELECT id, label FROM _health_check ORDER BY id');
    res.json({ status: 'ok', checks: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
