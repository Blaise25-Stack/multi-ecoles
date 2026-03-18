import mysql from 'mysql2/promise'
import { config } from '../config'

// Pool de connexions MySQL
export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

// Tester la connexion
export const testConnection = async (): Promise<boolean> => {
  try {
    const connection = await pool.getConnection()
    console.log('✅ Connexion à MySQL réussie !')
    console.log(`   📦 Base de données: ${config.db.database}`)
    console.log(`   🏠 Hôte: ${config.db.host}:${config.db.port}`)
    connection.release()
    return true
  } catch (error) {
    console.error('❌ Erreur de connexion à MySQL:', error)
    return false
  }
}

// Exécuter une requête
export const query = async <T>(sql: string, params?: any[]): Promise<T> => {
  const [results] = await pool.execute(sql, params)
  return results as T
}

// Transaction helper
export const transaction = async <T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> => {
  const connection = await pool.getConnection()
  await connection.beginTransaction()

  try {
    const result = await callback(connection)
    await connection.commit()
    return result
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}



