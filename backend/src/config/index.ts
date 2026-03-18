import dotenv from 'dotenv'

dotenv.config()

export const config = {
  // Serveur
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Base de données MySQL (WampServer)
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bdd_scolaire',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'sgs_secret_key_2024_rdc_very_secure',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'sgs_refresh_secret_key_2024_rdc',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // Uploads
  upload: {
    dir: process.env.UPLOAD_DIR || 'uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
  },

  // CORS
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
}



