import fetch from 'node-fetch';
import pool from './db';

/**
 * Función para sincronizar un Lead a HubSpot.
 * Crea o actualiza un Contacto en HubSpot.
 */
export async function syncLeadToHubspot(leadData: any, chatHistory?: string) {
  try {
    // 1. Obtener el token de integración de la base de datos
    const configRes = await pool.query("SELECT api_key, enabled FROM integrations WHERE provider = 'hubspot' LIMIT 1");
    if (configRes.rowCount === 0) return;
    
    const { api_key, enabled } = configRes.rows[0];
    if (!enabled || !api_key) return; // Si la integración está apagada o no hay token, no hacemos nada

    const clean_api_key = api_key.trim();

    // 2. Mapear datos de Chatprex a HubSpot
    // HubSpot asume que el email es el identificador principal
    // Si no tenemos email, no podemos sincronizar a menos que permitamos contactos sin email
    // Usualmente HubSpot rechaza si no hay email o firstname, pero depende de la configuración
    const properties: any = {};
    if (leadData.phone) properties.phone = leadData.phone;

    if (leadData.name) properties.firstname = leadData.name;
    if (leadData.email) properties.email = leadData.email;
    // Si tienen una propiedad personalizada de "interest" o "interes" configurada en su HubSpot, intentará enviarlo.
    // Si no, igualmente se exporta en la nota si enviamos el historial.
    if (leadData.interest) properties.interes = leadData.interest;

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
          'Authorization': `Bearer ${clean_api_key}`
        },
        body: JSON.stringify({ filterGroups })
      });
      if (searchRes.ok) {
        const searchData: any = await searchRes.json();
        if (searchData.total > 0) {
          contactId = searchData.results[0].id;
        }
      } else {
        const err = await searchRes.json().catch(()=>({}));
        console.error('[HubSpot] Error en búsqueda:', err);
      }
    }

    if (contactId) {
      // Actualizar existente
      await fetch(`https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clean_api_key}`
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
          'Authorization': `Bearer ${clean_api_key}`
        },
        body: JSON.stringify({ properties })
      });
      
      if (!createRes.ok) {
        const err = await createRes.json();
        console.error('[HubSpot] Error creando contacto:', err);
      } else {
        const createdData: any = await createRes.json();
        contactId = createdData.id;
        console.log(`[HubSpot] Nuevo contacto creado: ${leadData.name || leadData.phone}`);
      }
    }

    // 4. Si hay historial de chat, crear una Nota y asociarla al Contacto
    if (contactId && chatHistory) {
      let noteContent = `Historial de Conversación con el Bot de Casaya:\n\n${chatHistory}`;
      if (leadData.interest) {
        noteContent = `Interés detectado: ${leadData.interest}\n\n${noteContent}`;
      }
      
      const noteRes = await fetch('https://api.hubapi.com/crm/v3/objects/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${clean_api_key}`
        },
        body: JSON.stringify({
          properties: {
            hs_timestamp: Date.now().toString(),
            hs_note_body: noteContent.replace(/\n/g, '<br>')
          }
        })
      });
      
      if (noteRes.ok) {
        const noteData: any = await noteRes.json();
        const noteId = noteData.id;
        // Asociar la nota al contacto
        await fetch(`https://api.hubapi.com/crm/v3/objects/notes/${noteId}/associations/contacts/${contactId}/202`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clean_api_key}`
          }
        });
        console.log(`[HubSpot] Nota de historial exportada para contacto ${contactId}`);
      } else {
        console.error('[HubSpot] Error creando Nota:', await noteRes.json().catch(()=>({})));
      }
    }
  } catch (error: any) {
    console.error('[HubSpot Sync Error]', error);
  }
}
