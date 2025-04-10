const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Commenting out proxy middleware during troubleshooting
  // We're using direct URLs instead
  /*
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
      logLevel: 'debug',
    })
  );
  */
}; 