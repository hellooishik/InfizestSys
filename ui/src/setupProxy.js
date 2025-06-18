const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Proxy for local development backend
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
    })
  );

  // Proxy for render backend (optional use case or fallback)
  app.use(
    '/live-api',
    createProxyMiddleware({
      target: 'https://infizestsys.onrender.com',
      changeOrigin: true,
      pathRewrite: {
        '^/live-api': '', // remove /live-api prefix when forwarding
      },
    })
  );
};
