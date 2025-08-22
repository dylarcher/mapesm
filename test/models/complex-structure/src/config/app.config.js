module.exports = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || 'complex_demo',
    username: process.env.DB_USER || 'admin',
    password: process.env.DB_PASS || 'password'
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    tokenExpiry: '24h',
    refreshTokenExpiry: '7d'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'app.log'
  },
  cache: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    }
  },
  external: {
    paymentGateway: {
      apiKey: process.env.PAYMENT_API_KEY,
      baseUrl: process.env.PAYMENT_BASE_URL
    },
    emailService: {
      apiKey: process.env.EMAIL_API_KEY,
      from: process.env.EMAIL_FROM || 'noreply@example.com'
    }
  }
};
