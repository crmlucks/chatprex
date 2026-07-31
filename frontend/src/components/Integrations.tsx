import React, { useState, useEffect } from 'react';
import { Workflow, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from './Toast';
import { useAuth } from '../context/AuthContext';

interface IntegrationsProps {
  isDarkMode: boolean;
}

export default function Integrations({ isDarkMode }: IntegrationsProps) {
  const [hubspotKey, setHubspotKey] = useState('');
  const [hubspotEnabled, setHubspotEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();
  const { token } = useAuth();

  useEffect(() => {
    if (token) fetchIntegrations();
  }, [token]);

  const fetchIntegrations = async () => {
    setIsLoading(true);
    try {
      if (!token) return;
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_URL}/api/integrations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const hubspot = data.find((d: any) => d.provider === 'hubspot');
        if (hubspot) {
          setHubspotKey(hubspot.hasApiKey ? 'UNCHANGED' : '');
          setHubspotEnabled(hubspot.enabled);
        }
      }
    } catch (err) {
      showToast('Error al cargar integraciones', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveHubspot = async () => {
    setIsSaving(true);
    try {
      if (!token) return;
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_URL}/api/integrations`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: 'hubspot',
          api_key: hubspotKey,
          enabled: hubspotEnabled,
          config: {}
        })
      });
      
      if (res.ok) {
        showToast('Integración con HubSpot guardada', 'success');
      } else {
        showToast('Error al guardar integración', 'error');
      }
    } catch (err) {
      showToast('Error de red al guardar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="shrink-0 h-20 px-8 flex items-center justify-between border-b border-edge bg-surface z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/10 text-orange-500 rounded-xl flex items-center justify-center">
            <Workflow size={24} />
          </div>
          <div>
            <h1 className="h1">HubSpot CRM</h1>
            <p className="body-text text-sm mt-1">Sincroniza tus Leads y Notas con HubSpot</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className={`p-6 md:p-8 rounded-xl border shadow-sm transition-colors ${isDarkMode ? 'bg-surface border-edge' : 'bg-surface border-edge'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                <Workflow size={20} />
              </div>
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-content">Configuración de Private App Token</h2>
                <p className="text-sm font-medium text-content-muted">Ingresa el token de tu aplicación privada de HubSpot para habilitar la sincronización en tiempo real.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-xl border border-edge bg-surface-inset">
                  <div>
                    <h3 className="font-semibold text-content">Estado de Sincronización</h3>
                    <p className="text-sm text-content-muted">Activa o desactiva el envío automático de leads a HubSpot.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={hubspotEnabled}
                      onChange={(e) => setHubspotEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-surface-raised peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 border border-edge"></div>
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-normal text-content-muted ml-1">Private App Access Token (Bearer)</label>
                  <input 
                    type="password" 
                    value={hubspotKey}
                    onChange={(e) => setHubspotKey(e.target.value)}
                    placeholder={hubspotKey === 'UNCHANGED' ? '••••••••••••••••' : 'pat-na1-...'} 
                    className="w-full p-4 rounded-xl border text-sm font-mono focus:ring-2 focus:ring-orange-500/20 outline-none transition-all bg-surface-inset border-edge text-content"
                  />
                  <p className="text-xs text-content-muted ml-1 mt-2">Asegúrate de que tu Private App tenga los permisos <b>crm.objects.contacts.read</b> y <b>crm.objects.contacts.write</b>.</p>
                </div>

                <div className="flex justify-end pt-4 border-t border-edge">
                  <button 
                    onClick={saveHubspot}
                    disabled={isSaving}
                    className="px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Guardar Configuración
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className={`p-6 rounded-xl border border-blue-500/20 bg-blue-500/5 flex items-start gap-4`}>
            <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-content">¿Cómo funciona la integración?</h3>
              <ul className="mt-2 space-y-2 text-sm text-content-muted list-disc list-inside">
                <li>Cuando un lead escribe al bot o entra por Facebook/Web, se busca en HubSpot por su <b>correo electrónico</b>.</li>
                <li>Si no existe, se crea un nuevo Contacto.</li>
                <li>Si existe, se actualizan sus datos (nombre, interés, teléfono y presupuesto extraídos por la IA).</li>
                <li>Las notas y el resumen de perfil extraídos por Cerebro IA se adjuntan en el campo <code>Mensaje (hs_notes_last_updated)</code>.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
