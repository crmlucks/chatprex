import fetch from 'node-fetch';
import pool from './db';

/**
 * Función para sincronizar un Lead a HubSpot.
 * Crea o actualiza un Contacto en HubSpot.
 */
export async function syncLeadToHubspot(leadData: any) {
  try {
    // 1. Obtener el token de integración de la base de datos
    const configRes = await pool.query("SELECT api_key, enabled FROM integrations WHERE provider = 'hubspot' LIMIT 1");
    if (configRes.rowCount === 0) return;
    
    const { api_key, enabled } = configRes.rows[0];
    if (!enabled || !api_key) return; // Si la integración está apagada o no hay token, no hacemos nada

    // 2. Mapear datos de Chatprex a HubSpot
    // HubSpot asume que el email es el identificador principal
    // Si no tenemos email, no podemos sincronizar a menos que permitamos contactos sin email
    // Usualmente HubSpot rechaza si no hay email o firstname, pero depende de la configuración
    const properties: any = {
      phone: leadData.phone,
      hs_lead_status: 'NEW'
    };

    if (leadData.name) properties.firstname = leadData.name;
    if (leadData.email) properties.email = leadData.email;

    // 3. Crear/Actualizar en HubSpot usando la API v3
    // Primero, buscar si existe el contacto por email (si hay email)
    let contactId = null;
    
    // Preparar filtros de búsqueda (OR: busca por email o por teléfono)
    const filterGroups = [];
    if (leadData.email) {
      filterGroups.push({
        filters: [{ propertyName: 'email', operator: 'EQ', value: leadData.email }]
      });
    }
    if (leadData.phone) {
      filterGroups.push({
        filters: [{ propertyName: 'phone', operator: 'EQ', value: leadData.phone }]
      });
    }

    if (filterGroups.length > 0) {
      const searchRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api_key}`
        },
        body: JSON.stringify({ filterGroups })
      });
      if (searchRes.ok) {
        const searchData: any = await searchRes.json();
        if (searchData.total > 0) {
          contactId = searchData.results[0].id;
        }
      }
    }

    if (contactId) {
      // Actualizar existente
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api_key}`
        },
        body: JSON.stringify({ properties })
      });
      console.log(`[HubSpot] Contacto actualizado: ${leadData.name || leadData.phone}`);
    } else {
      // Crear nuevo
      const createRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${api_key}`
        },
        body: JSON.stringify({ properties })
      });
      
      if (!createRes.ok) {
        const err = await createRes.json();
        console.error('[HubSpot] Error creando contacto:', err);
      } else {
        console.log(`[HubSpot] Nuevo contacto creado: ${leadData.name || leadData.phone}`);
      }
    }
  } catch (error: any) {
    console.error('[HubSpot Sync Error]', error);
  }
}
