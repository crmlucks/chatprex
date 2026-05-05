import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Pool de conexión a PostgreSQL.
 * Variables de entorno requeridas:
 *   DATABASE_URL  – cadena de conexión completa
 *   o bien las individuales: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'chatprex',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      }
);

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el pool de PostgreSQL', err);
});

/**
 * Crea las tablas necesarias si no existen.
 * Se ejecuta al arrancar el servidor.
 */
export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(150) UNIQUE NOT NULL,
        password      VARCHAR(255) NOT NULL,
        phone         VARCHAR(30) DEFAULT '',
        role          VARCHAR(20) NOT NULL DEFAULT 'usuario'
                      CHECK (role IN ('propietario','administrador','usuario')),
        status        VARCHAR(20) NOT NULL DEFAULT 'activo'
                      CHECK (status IN ('activo','suspendido','inactivo')),
        avatar        TEXT DEFAULT '',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear índice para búsquedas rápidas por email
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    `);

    // Crear índice para filtrar por rol
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
    `);

    console.log('✅ Base de datos inicializada correctamente.');
  } catch (err) {
    console.error('❌ Error inicializando la base de datos:', err);
  } finally {
    client.release();
  }
}

export default pool;
