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

    // Crear tabla leads
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(150) NOT NULL,
        phone         VARCHAR(30) NOT NULL,
        score         VARCHAR(10) DEFAULT '50%',
        budget        VARCHAR(50) DEFAULT '',
        project       VARCHAR(150) DEFAULT '',
        status        VARCHAR(50) DEFAULT 'Nuevo',
        tags          JSONB DEFAULT '[]'::jsonb,
        bot_active    BOOLEAN DEFAULT false,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear tabla properties
    await client.query(`
      CREATE TABLE IF NOT EXISTS properties (
        id            SERIAL PRIMARY KEY,
        type          VARCHAR(50) NOT NULL,
        name          VARCHAR(150) NOT NULL,
        project       VARCHAR(150) DEFAULT '',
        developer     VARCHAR(150) DEFAULT '',
        price         VARCHAR(50) NOT NULL,
        currency      VARCHAR(10) DEFAULT 'USD',
        location      VARCHAR(255) NOT NULL,
        area          VARCHAR(50) DEFAULT '',
        rooms         VARCHAR(20) DEFAULT '',
        details       TEXT DEFAULT '',
        status        VARCHAR(50) DEFAULT 'Disponible',
        image         TEXT DEFAULT '',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    // Crear tabla evolution_messages
    await client.query(`
      CREATE TABLE IF NOT EXISTS evolution_messages (
        id            VARCHAR(100) PRIMARY KEY,
        chat_id       VARCHAR(50) NOT NULL,
        text          TEXT,
        from_me       BOOLEAN DEFAULT false,
        timestamp     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        media_url     TEXT,
        media_type    VARCHAR(50)
      );
    `);
    
    // Índice para buscar mensajes por chat más rápido
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_evolution_messages_chat_id ON evolution_messages (chat_id);
    `);

    // Crear tabla ai_config para guardar las configuraciones del cerebro de IA
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_config (
        id            SERIAL PRIMARY KEY,
        provider      VARCHAR(50) DEFAULT 'OpenAI',
        model         VARCHAR(50) DEFAULT 'gpt-4o-mini',
        api_key       VARCHAR(255) DEFAULT '',
        prompt        TEXT DEFAULT 'Eres un asesor inmobiliario experto y persuasivo de ChatPrex.\nTu objetivo es perfilar leads (clientes potenciales), responder sus dudas sobre propiedades y agendar citas.\nReglas:\n1. Sé amable, conciso y utiliza emojis moderadamente.\n2. Si preguntan por precios, diles que los departamentos empiezan desde $85,000 USD.\n3. Si muestran interés, invítalos a agendar una visita.\n4. Responde SIEMPRE en español.',
        knowledge     TEXT DEFAULT '',
        voice_to_text BOOLEAN DEFAULT true,
        message_grouping BOOLEAN DEFAULT true,
        humanized_split BOOLEAN DEFAULT true,
        human_handoff BOOLEAN DEFAULT true,
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Add new columns if they don't exist (for existing installs)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS knowledge TEXT DEFAULT '';
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS voice_to_text BOOLEAN DEFAULT true;
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS message_grouping BOOLEAN DEFAULT true;
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS humanized_split BOOLEAN DEFAULT true;
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS human_handoff BOOLEAN DEFAULT true;
      END $$;
    `);
    
    // Insertar un registro por defecto si no existe
    const aiConfigCount = await client.query('SELECT COUNT(*) FROM ai_config');
    if (parseInt(aiConfigCount.rows[0].count) === 0) {
      await client.query('INSERT INTO ai_config (provider, model) VALUES ($1, $2)', ['OpenAI', 'gpt-4o-mini']);
    }

    console.log('✅ Base de datos inicializada correctamente.');
  } catch (err) {
    console.error('❌ Error inicializando la base de datos:', err);
  } finally {
    client.release();
  }
}

export default pool;
