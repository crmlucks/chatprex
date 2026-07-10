import express from 'express';
import pool from './db';
import { authMiddleware } from './authMiddleware';

const portalSettingsRouter = express.Router();

// GET public settings (no auth required)
portalSettingsRouter.get('/public', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM portal_settings ORDER BY id ASC LIMIT 1');
    if (result.rows.length === 0) {
      // Devolver vacío si por alguna razón no se ha inicializado
      return res.json({});
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[PortalSettings] Error fetching public settings:', error);
    res.status(500).json({ error: 'Failed to fetch portal settings' });
  }
});

// GET settings (protected)
portalSettingsRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM portal_settings ORDER BY id ASC LIMIT 1');
    if (result.rows.length === 0) {
      return res.json({});
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('[PortalSettings] Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch portal settings' });
  }
});

// PUT update settings (protected)
portalSettingsRouter.put('/', authMiddleware, async (req, res) => {
  const {
    logo_day,
    logo_night,
    hero_title,
    hero_subtitle,
    banner_image_1,
    banner_image_2,
    banner_image_3,
    about_title,
    about_description,
    about_image
  } = req.body;

  try {
    // Verificar si existe el registro con ID 1
    const checkResult = await pool.query('SELECT id FROM portal_settings WHERE id = 1');
    
    let result;
    if (checkResult.rows.length === 0) {
      // Si no existe, insertar uno nuevo con ID 1
      result = await pool.query(
        `INSERT INTO portal_settings (
          id, logo_day, logo_night, hero_title, hero_subtitle, 
          banner_image_1, banner_image_2, banner_image_3, 
          about_title, about_description, about_image
        ) VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          logo_day || '', logo_night || '', 
          hero_title || 'Encuentra la propiedad perfecta para tu estilo de vida',
          hero_subtitle || 'Explora las mejores casas, departamentos, terrenos, oficinas y cocheras en las ubicaciones más exclusivas con la asesoría de IA líder de ChatPrex.',
          banner_image_1 || '', banner_image_2 || '', banner_image_3 || '',
          about_title || 'Redefiniendo el sector inmobiliario con innovación y pasión',
          about_description || 'En ChatPrex, combinamos la tecnología de inteligencia artificial más avanzada con la experiencia humana en bienes raíces.',
          about_image || ''
        ]
      );
    } else {
      // Si existe, actualizar el registro 1
      result = await pool.query(
        `UPDATE portal_settings 
         SET logo_day = $1, logo_night = $2, hero_title = $3, hero_subtitle = $4,
             banner_image_1 = $5, banner_image_2 = $6, banner_image_3 = $7,
             about_title = $8, about_description = $9, about_image = $10,
             updated_at = NOW()
         WHERE id = 1 RETURNING *`,
        [
          logo_day, logo_night, hero_title, hero_subtitle,
          banner_image_1, banner_image_2, banner_image_3,
          about_title, about_description, about_image
        ]
      );
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('[PortalSettings] Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update portal settings' });
  }
});

export { portalSettingsRouter };
