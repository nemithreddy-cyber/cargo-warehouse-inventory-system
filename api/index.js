let app;
try {
  app = require('../backend/app');
} catch (err) {
  const express = require('express');
  app = express();
  app.all('*', (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Vercel Serverless Function Initialization Error',
      error: err.message,
      stack: err.stack
    });
  });
}

module.exports = app;
