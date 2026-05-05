import express from 'express';
import bcrypt from 'bcryptjs';
import pool from './db';
import { authMiddleware, requireRole } from './authMiddleware';

const userRouter = express.Router();

// Todas las rutas de usuarios requieren autenticación
userRouter.use(authMiddleware);

/**
 * GET /api/users
 * Lista todos los usuarios. Solo propietario y administrador.
 */
userRouter.get('/', requireRole('propietario', 'administrador'), async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = 'SELECT id, name, email, phone, role, status, avatar, created_at, updated_at FROM users WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }
    if (role) {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }
    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json({ users: result.rows });
  } catch (err) {
    console.error('[Users] Error listando usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

/**
 * GET /api/users/:id
 * Obtiene un usuario por ID.
 */
userRouter.get('/:id', requireRole('propietario', 'administrador'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, phone, role, status, avatar, created_at, updated_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[Users] Error:', err);
    res.status(500).json({ error: 'Error interno' });
  }
});

/**
 * POST /api/users
 * Crea un nuevo usuario. Solo propietario y administrador.
 */
userRouter.post('/', requireRole('propietario', 'administrador'), async (req, res) => {
  const { name, email, password, phone, role, avatar } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' });
  }

  // Validar permisos de creación de roles
  const currentRole = req.user!.role;
  if (role === 'propietario') {
    return res.status(403).json({ error: 'No se puede crear otro propietario' });
  }
  if (role === 'administrador' && currentRole === 'usuario') {
    return res.status(403).json({ error: 'No tienes permiso para crear administradores' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, phone, role, avatar, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'activo') RETURNING id, name, email, phone, role, status, avatar, created_at`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword, phone || '', role || 'usuario', avatar || '']
    );
    res.status(201).json({ user: result.rows[0], message: 'Usuario creado exitosamente' });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ese email ya está registrado' });
    }
    console.error('[Users] Error creando usuario:', err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

/**
 * PUT /api/users/:id
 * Edita un usuario existente. Propietario y administrador.
 */
userRouter.put('/:id', requireRole('propietario', 'administrador'), async (req, res) => {
  const targetId = parseInt(req.params.id, 10);
  const { name, email, phone, role, status, avatar } = req.body;

  try {
    // Obtener el usuario objetivo
    const target = await pool.query('SELECT * FROM users WHERE id = $1', [targetId]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const targetUser = target.rows[0];

    // Protección: un administrador NO puede modificar al propietario
    if (targetUser.role === 'propietario' && req.user!.role !== 'propietario') {
      return res.status(403).json({ error: 'No puedes modificar al propietario' });
    }

    // Protección: nadie puede cambiar el rol del propietario
    if (targetUser.role === 'propietario' && role && role !== 'propietario') {
      return res.status(403).json({ error: 'No se puede cambiar el rol del propietario' });
    }

    // Protección: no se puede crear otro propietario
    if (role === 'propietario' && targetUser.role !== 'propietario') {
      return res.status(403).json({ error: 'No se puede asignar el rol de propietario' });
    }

    const result = await pool.query(
      `UPDATE users SET
         name = COALESCE($1, name),
         email = COALESCE($2, email),
         phone = COALESCE($3, phone),
         role = COALESCE($4, role),
         status = COALESCE($5, status),
         avatar = COALESCE($6, avatar),
         updated_at = NOW()
       WHERE id = $7
       RETURNING id, name, email, phone, role, status, avatar, created_at, updated_at`,
      [name, email?.toLowerCase()?.trim(), phone, role, status, avatar, targetId]
    );

    res.json({ user: result.rows[0], message: 'Usuario actualizado' });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Ese email ya está en uso' });
    }
    console.error('[Users] Error actualizando:', err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

/**
 * PUT /api/users/:id/password
 * Restablece la contraseña de un usuario. Solo propietario y administrador.
 */
userRouter.put('/:id/password', requireRole('propietario', 'administrador'), async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  try {
    const target = await pool.query('SELECT role FROM users WHERE id = $1', [req.params.id]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Un admin no puede cambiar la contraseña del propietario
    if (target.rows[0].role === 'propietario' && req.user!.role !== 'propietario') {
      return res.status(403).json({ error: 'No puedes modificar al propietario' });
    }

    const hashed = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashed, req.params.id]);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('[Users] Error:', err);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
});

/**
 * DELETE /api/users/:id
 * Elimina un usuario. Solo propietario.
 */
userRouter.delete('/:id', requireRole('propietario'), async (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  // No se puede auto-eliminar
  if (targetId === req.user!.id) {
    return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
  }

  try {
    const target = await pool.query('SELECT role FROM users WHERE id = $1', [targetId]);
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (target.rows[0].role === 'propietario') {
      return res.status(403).json({ error: 'No se puede eliminar al propietario' });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [targetId]);
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    console.error('[Users] Error eliminando:', err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export { userRouter };
