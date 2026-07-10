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
  let client;
  try {
    client = await pool.connect();
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
        email         VARCHAR(150) DEFAULT '',
        source        VARCHAR(150) DEFAULT '',
        advisor_id    INTEGER,
        currency      VARCHAR(10) DEFAULT 'USD',
        budget_amount DECIMAL(15,2) DEFAULT 0,
        notes         TEXT DEFAULT '',
        interest      TEXT DEFAULT '',
        birth_date    VARCHAR(20) DEFAULT '',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Añadir columnas si no existen por actualizaciones pasadas
    try {
      await client.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS birth_date VARCHAR(20) DEFAULT \'\';');
      await client.query('ALTER TABLE leads ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT \'evolution\';');
    } catch(e) {}


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
        bathrooms     VARCHAR(20) DEFAULT '',
        parking       VARCHAR(20) DEFAULT '',
        floor         VARCHAR(20) DEFAULT '',
        details       TEXT DEFAULT '',
        status        VARCHAR(50) DEFAULT 'Disponible',
        image         TEXT DEFAULT '',
        avatar        TEXT DEFAULT '',
        images        JSONB DEFAULT '[]'::jsonb,
        featured      BOOLEAN DEFAULT false,
        visible       BOOLEAN DEFAULT true,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    try {
      await client.query('ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms VARCHAR(20) DEFAULT \'\';');
      await client.query('ALTER TABLE properties ADD COLUMN IF NOT EXISTS parking VARCHAR(20) DEFAULT \'\';');
      await client.query('ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor VARCHAR(20) DEFAULT \'\';');
      await client.query('ALTER TABLE properties ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;');
      await client.query('ALTER TABLE properties ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true;');
    } catch(e) {}
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

    // Crear tabla lead_score_history (Lead Intelligence)
    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_score_history (
        id            SERIAL PRIMARY KEY,
        lead_id       INTEGER NOT NULL,
        score         INTEGER NOT NULL DEFAULT 0,
        breakdown     JSONB DEFAULT '{}'::jsonb,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear tabla follow_up_rules
    await client.query(`
      CREATE TABLE IF NOT EXISTS follow_up_rules (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(150) NOT NULL,
        trigger_type  VARCHAR(50) NOT NULL DEFAULT 'inactivity',
        trigger_value INTEGER NOT NULL DEFAULT 48,
        action_type   VARCHAR(50) NOT NULL DEFAULT 'task',
        action_template TEXT DEFAULT '',
        enabled       BOOLEAN DEFAULT true,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear tabla follow_up_queue  
    await client.query(`
      CREATE TABLE IF NOT EXISTS follow_up_queue (
        id            SERIAL PRIMARY KEY,
        lead_id       INTEGER NOT NULL,
        rule_id       INTEGER,
        action_type   VARCHAR(50) NOT NULL,
        message       TEXT DEFAULT '',
        fire_at       TIMESTAMPTZ NOT NULL,
        status        VARCHAR(20) DEFAULT 'pending',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query('CREATE INDEX IF NOT EXISTS idx_score_history_lead ON lead_score_history (lead_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_follow_up_queue_status ON follow_up_queue (status, fire_at);');

    // Crear tabla campaigns
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id                SERIAL PRIMARY KEY,
        name              VARCHAR(255) NOT NULL,
        type              VARCHAR(50) DEFAULT 'Envío masivo',
        message           TEXT,
        use_ai            BOOLEAN DEFAULT false,
        recipient_source  VARCHAR(50) DEFAULT 'database',
        db_filter         VARCHAR(100) DEFAULT 'todos',
        manual_recipients TEXT DEFAULT '',
        status            VARCHAR(50) DEFAULT 'Borrador',
        progress          INTEGER DEFAULT 0,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Crear tabla finances_clients (para Finanzas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS finances_clients (
        id            SERIAL PRIMARY KEY,
        doc           TEXT,
        name          VARCHAR(150) NOT NULL,
        phone         VARCHAR(50),
        email         VARCHAR(150),
        civil_status  VARCHAR(50) DEFAULT 'Soltero',
        spouse_doc    TEXT,
        spouse_name   TEXT,
        spouse_phone  TEXT,
        address       TEXT,
        district      TEXT,
        province      TEXT,
        department    TEXT,
        notes         TEXT,
        property_id   INTEGER,
        agent_id      INTEGER,
        status        VARCHAR(50) DEFAULT 'activo',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Añadir columnas faltantes si la tabla ya existía
    const clientCols = [
      'doc', 'civil_status', 'spouse_doc', 'spouse_name', 'spouse_phone', 
      'address', 'district', 'province', 'department', 'notes', 
      'property_id', 'agent_id'
    ];
    for (const col of clientCols) {
      try {
        await client.query(`ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS ${col} TEXT;`);
      } catch(e) {}
    }

    // Crear tabla transactions (para Finanzas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id            SERIAL PRIMARY KEY,
        client_id     INTEGER REFERENCES finances_clients(id),
        description   TEXT,
        type          VARCHAR(50) NOT NULL,
        amount        DECIMAL(15,2) NOT NULL,
        currency      VARCHAR(10) DEFAULT 'local',
        status        VARCHAR(50) DEFAULT 'completado',
        date          TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Añadir columnas faltantes en transactions
    try {
      await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT;');
      await client.query('ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT \'local\';');
    } catch(e) {}

    // Crear tabla projects
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(150) NOT NULL,
        code          VARCHAR(50),
        status        VARCHAR(50) DEFAULT 'Activo',
        images        JSONB DEFAULT '[]'::jsonb,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    try {
      await client.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;");
    } catch(e) {}

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

    // Crear tabla portal_settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS portal_settings (
        id                  SERIAL PRIMARY KEY,
        logo_day            TEXT DEFAULT '',
        logo_night          TEXT DEFAULT '',
        hero_title          VARCHAR(255) DEFAULT 'Encuentra la propiedad perfecta para tu estilo de vida',
        hero_subtitle       TEXT DEFAULT 'Explora las mejores casas, departamentos, terrenos, oficinas y cocheras en las ubicaciones más exclusivas con la asesoría de IA líder de ChatPrex.',
        banner_image_1      TEXT DEFAULT '',
        banner_image_2      TEXT DEFAULT '',
        banner_image_3      TEXT DEFAULT '',
        about_title         VARCHAR(255) DEFAULT 'Redefiniendo el sector inmobiliario con innovación y pasión',
        about_description   TEXT DEFAULT 'En ChatPrex, combinamos la tecnología de inteligencia artificial más avanzada con la experiencia humana en bienes raíces. Nuestra misión es guiarte en el proceso de compra, venta o alquiler de propiedades de forma transparente, rápida y eficiente, asegurándote decisiones rentables y seguras.',
        about_image         TEXT DEFAULT '',
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

    const portalConfigCount = await client.query('SELECT COUNT(*) FROM portal_settings');
    if (parseInt(portalConfigCount.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO portal_settings (
          hero_title, hero_subtitle, about_title, about_description
        ) VALUES (
          'Encuentra la propiedad perfecta para tu estilo de vida',
          'Explora las mejores casas, departamentos, terrenos, oficinas y cocheras en las ubicaciones más exclusivas con la asesoría de IA líder de ChatPrex.',
          'Redefiniendo el sector inmobiliario con innovación y pasión',
          'En ChatPrex, combinamos la tecnología de inteligencia artificial más avanzada con la experiencia humana en bienes raíces. Nuestra misión es guiarte en el proceso de compra, venta o alquiler de propiedades de forma transparente, rápida y eficiente, asegurándote decisiones rentables y seguras.'
        )
      `);
    }

    console.log('[DB] Base de datos sincronizada correctamente (incluye proyectos, pipeline, fuentes y portal_settings)');

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
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS email VARCHAR(150) DEFAULT '';
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(100) DEFAULT '';
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS advisor_id INTEGER;
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD';
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget_amount DECIMAL(15,2) DEFAULT 0;
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
        ALTER TABLE leads ADD COLUMN IF NOT EXISTS interest TEXT DEFAULT '';

        ALTER TABLE properties ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '';
        ALTER TABLE properties ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

        -- Nuevos campos para Proyectos
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS developer VARCHAR(150) DEFAULT '';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact VARCHAR(150) DEFAULT '';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS phone VARCHAR(50) DEFAULT '';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS email VARCHAR(150) DEFAULT '';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS address VARCHAR(255) DEFAULT '';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'PEN';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

        -- Nuevos campos para Finanzas / Clientes
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS doc VARCHAR(50) DEFAULT '';
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS civil_status VARCHAR(50) DEFAULT 'Soltero';
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS spouse_doc VARCHAR(50) DEFAULT '';
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS spouse_name VARCHAR(150) DEFAULT '';
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS spouse_phone VARCHAR(50) DEFAULT '';
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS address VARCHAR(255) DEFAULT '';
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS district VARCHAR(100) DEFAULT '';
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS province VARCHAR(100) DEFAULT '';
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT '';
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS property_id INTEGER;
        ALTER TABLE finances_clients ADD COLUMN IF NOT EXISTS agent_id INTEGER;

        -- Nuevos campos para Auto-asignación de Leads
        ALTER TABLE users ADD COLUMN IF NOT EXISTS auto_assign BOOLEAN DEFAULT false;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS last_assigned_at TIMESTAMPTZ DEFAULT '1970-01-01 00:00:00Z';

        -- Nuevos campos para Transacciones
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS concept TEXT DEFAULT '';
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'local';
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS property_id INTEGER;
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
    if (client) client.release();
  }
}

export default pool;
