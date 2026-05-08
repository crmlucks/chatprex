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
        avatar        TEXT DEFAULT '',
        images        JSONB DEFAULT '[]'::jsonb,
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

    // Crear tabla tasks (para Tareas, Citas, y Calendario)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id            SERIAL PRIMARY KEY,
        title         VARCHAR(255) NOT NULL,
        description   TEXT DEFAULT '',
        type          VARCHAR(50) DEFAULT 'tarea',
        status        VARCHAR(50) DEFAULT 'pendiente',
        due_date      TIMESTAMPTZ,
        lead_id       INTEGER,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear tabla notes
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id            SERIAL PRIMARY KEY,
        lead_id       INTEGER NOT NULL,
        content       TEXT NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear tabla finances_clients (para Finanzas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS finances_clients (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(150) NOT NULL,
        email         VARCHAR(150),
        phone         VARCHAR(50),
        status        VARCHAR(50) DEFAULT 'activo',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear tabla transactions (para Finanzas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id            SERIAL PRIMARY KEY,
        client_id     INTEGER REFERENCES finances_clients(id),
        type          VARCHAR(50) NOT NULL,
        amount        DECIMAL(15,2) NOT NULL,
        status        VARCHAR(50) DEFAULT 'completado',
        date          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear tabla projects
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(150) NOT NULL,
        code          VARCHAR(50),
        status        VARCHAR(50) DEFAULT 'Activo',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear tabla pipeline_stages
    await client.query(`
      CREATE TABLE IF NOT EXISTS pipeline_stages (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        color         VARCHAR(20) DEFAULT '#3b82f6',
        visible       BOOLEAN DEFAULT true,
        "order"       INTEGER DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear tabla lead_sources
    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_sources (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        icon          VARCHAR(50) DEFAULT 'Globe',
        visible       BOOLEAN DEFAULT true,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Inicializar datos por defecto si están vacías
    const pipelineCount = await client.query('SELECT COUNT(*) FROM pipeline_stages');
    if (parseInt(pipelineCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO pipeline_stages (name, color, "order") VALUES 
        ('Nuevo', '#3b82f6', 1),
        ('Contactado', '#0ea5e9', 2),
        ('Cita Programada', '#f59e0b', 3),
        ('Negociación', '#a855f7', 4),
        ('Ganado / Cierre', '#10b981', 5),
        ('Perdido', '#ef4444', 6)
      `);
    }

    const sourcesCount = await client.query('SELECT COUNT(*) FROM lead_sources');
    if (parseInt(sourcesCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO lead_sources (name, icon) VALUES 
        ('Facebook Ads', 'Facebook'),
        ('Instagram', 'Instagram'),
        ('TikTok Ads', 'Smartphone'),
        ('Sitio Web', 'Globe'),
        ('Referido', 'Users')
      `);
    }

    console.log('[DB] Base de datos sincronizada correctamente (incluye proyectos, pipeline y fuentes)');

    // Add new columns if they don't exist (for existing installs)
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS knowledge TEXT DEFAULT '';
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS voice_to_text BOOLEAN DEFAULT true;
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS message_grouping BOOLEAN DEFAULT true;
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS humanized_split BOOLEAN DEFAULT true;
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS human_handoff BOOLEAN DEFAULT true;
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS activation_keywords TEXT DEFAULT 'info,precio,quiero,asesor,comprar';
        ALTER TABLE ai_config ADD COLUMN IF NOT EXISTS name VARCHAR(150) DEFAULT 'Bot Principal';
        
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS bot_id INTEGER DEFAULT 1;

        ALTER TABLE properties ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';
        ALTER TABLE properties ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
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
