import express from 'express';
import bcrypt from 'bcryptjs';
import pool from './db';
import { generateToken, authMiddleware, JwtPayload } from './authMiddleware';

const authRouter = express.Router();

/**
 * POST /api/auth/login
 * Inicia sesión y devuelve un JWT.
 */
authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (user.status === 'suspendido') {
      return res.status(403).json({ error: 'Tu cuenta ha sido suspendida. Contacta al administrador.' });
    }

    if (user.status === 'inactivo') {
      return res.status(403).json({ error: 'Tu cuenta está inactiva.' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
    const token = generateToken(payload);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('[Auth] Error en login:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/auth/setup
 * Crea al usuario Propietario inicial (solo si no existe ningún usuario).
 * Se usa una sola vez cuando se despliega por primera vez.
 */
authRouter.post('/setup', async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
  }

  try {
    // Verificar si ya hay usuarios
    const count = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(count.rows[0].count, 10) > 0) {
      return res.status(400).json({ error: 'El sistema ya fue configurado. Usa /login para iniciar sesión.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role, status)
       VALUES ($1, $2, $3, $4, 'propietario', 'activo') RETURNING *`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword, phone || '']
    );

    const user = result.rows[0];
    const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
    const token = generateToken(payload);

    res.status(201).json({
      message: '¡Propietario creado exitosamente!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
      },
    });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ese email ya está registrado' });
    }
    console.error('[Auth] Error en setup:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/auth/me
 * Devuelve los datos del usuario autenticado.
 */
authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, status, avatar, created_at FROM users WHERE id = $1',
      [req.user!.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[Auth] Error en /me:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * GET /api/auth/check-setup
 * Verifica si el sistema ya tiene un propietario configurado.
 */
authRouter.get('/check-setup', async (_req, res) => {
  try {
    const count = await pool.query('SELECT COUNT(*) FROM users');
    res.json({ needsSetup: parseInt(count.rows[0].count, 10) === 0 });
  } catch {
    res.json({ needsSetup: true });
  }
});

export { authRouter };
