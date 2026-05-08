import React, { useState } from 'react';
import { Zap, Key, Server, Webhook, Network, Database, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

const Automation = ({ isDarkMode }: { isDarkMode?: boolean }) => {
  // n8n State
  const [showN8nModal, setShowN8nModal] = useState(false);
  const [n8nUrl, setN8nUrl] = useState(localStorage.getItem('n8n_webhook') || '');
  const [isN8nConnected, setIsN8nConnected] = useState(!!localStorage.getItem('n8n_webhook'));
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // HubSpot State
  const [showHubspotModal, setShowHubspotModal] = useState(false);
  const [hubspotKey, setHubspotKey] = useState(localStorage.getItem('hubspot_key') || '');
  const [isHubspotConnected, setIsHubspotConnected] = useState(!!localStorage.getItem('hubspot_key'));
  const [hubspotTestStatus, setHubspotTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const handleN8nSave = () => {
    if (n8nUrl.trim()) {
      localStorage.setItem('n8n_webhook', n8nUrl);
      setIsN8nConnected(true);
      setShowN8nModal(false);
    } else {
      localStorage.removeItem('n8n_webhook');
      setIsN8nConnected(false);
      setShowN8nModal(false);
    }
  };

  const handleHubspotSave = () => {
    if (hubspotKey.trim()) {
      localStorage.setItem('hubspot_key', hubspotKey);
      setIsHubspotConnected(true);
      setShowHubspotModal(false);
    } else {
      localStorage.removeItem('hubspot_key');
      setIsHubspotConnected(false);
      setShowHubspotModal(false);
    }
  };

  const testN8nConnection = async () => {
    if (!n8nUrl) return;
    setTestStatus('testing');
    try {
      await fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({
          event: 'ping',
          message: 'Hello from ChatPrex CRM!',
          timestamp: new Date().toISOString()
        })
      });
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (err) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const testHubspotConnection = () => {
    if (!hubspotKey) return;
    setHubspotTestStatus('testing');
    // Simulated connection test for HubSpot API
    setTimeout(() => {
      if (hubspotKey.length > 20) {
        setHubspotTestStatus('success');
      } else {
        setHubspotTestStatus('error'); // simulate error if key is too short
      }
      setTimeout(() => setHubspotTestStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Automatización e Integraciones</h1>
            <p className="text-[12px] md:text-[13px] text-slate-500 mt-1 font-medium">Conecta ChatPrex con tus herramientas favoritas</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* API Keys Propias */}
          <div className={`p-6 rounded-2xl border shadow-sm transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <Key className="text-amber-500" />
              <h3 className={`text-[14px] md:text-[16px] font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>API de ChatPrex</h3>
            </div>
            <p className="text-[12px] md:text-[13px] text-slate-500 mb-4 font-medium">Usa esta API Key para conectar tus propios formularios web al CRM.</p>
            <div className="flex gap-2">
              <input type="text" readOnly value="sk_live_chatprex_9876543210abcdef" className={`flex-1 border rounded-lg px-4 text-sm font-mono transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`} />
              <button className={`px-4 py-2 rounded-lg text-sm font-bold transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>Copiar</button>
            </div>
          </div>

          {/* Integraciones Activas */}
          <div className={`p-6 rounded-2xl border shadow-sm transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-[14px] md:text-[16px] font-bold mb-4 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Integraciones Activas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <IntegrationCard name="Stripe" description="Pagos de propiedades" status="Conectado" color="bg-indigo-500/10 text-indigo-500" icon={<Server size={24} />} isDarkMode={isDarkMode} />
              <IntegrationCard name="Google Calendar" description="Sincronización de citas" status="Conectado" color="bg-blue-500/10 text-blue-500" icon={<Server size={24} />} isDarkMode={isDarkMode} />
              <IntegrationCard 
                name="n8n" 
                description="Automatización de flujos y Webhooks" 
                status={isN8nConnected ? "Conectado" : "Conectar"} 
                color={isN8nConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"} 
                icon={<Network size={24} />} 
                isDarkMode={isDarkMode} 
                onClick={() => setShowN8nModal(true)}
              />
              <IntegrationCard 
                name="HubSpot CRM" 
                description="Sincronización bidireccional de leads" 
                status={isHubspotConnected ? "Conectado" : "Conectar"} 
                color={isHubspotConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"} 
                icon={<Database size={24} />} 
                isDarkMode={isDarkMode} 
                onClick={() => setShowHubspotModal(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* n8n Configuration Modal */}
      {showN8nModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl border ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isN8nConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>
                  <Network size={20} />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Configurar n8n</h3>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Conecta mediante Webhooks</p>
                </div>
              </div>
              <button onClick={() => setShowN8nModal(false)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase mb-2 block">
                  url del webhook (catch hook)
                </label>
                <input 
                  type="url" 
                  value={n8nUrl}
                  onChange={(e) => setN8nUrl(e.target.value)}
                  placeholder="https://n8n.tu-dominio.com/webhook/..." 
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                />
                <p className={`text-[11px] mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  ChatPrex enviará los eventos de nuevos leads y actualizaciones a esta URL.
                </p>
              </div>

              {n8nUrl && (
                <div className="pt-2">
                  <button 
                    onClick={testN8nConnection}
                    disabled={testStatus === 'testing'}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-2 ${isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                  >
                    {testStatus === 'testing' ? <Loader2 size={16} className="animate-spin" /> : <Webhook size={16} />}
                    {testStatus === 'idle' && 'Enviar Webhook de Prueba'}
                    {testStatus === 'testing' && 'Enviando...'}
                    {testStatus === 'success' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={16} /> Enviado con éxito</span>}
                    {testStatus === 'error' && <span className="text-rose-500 flex items-center gap-1"><AlertTriangle size={16} /> Error al enviar</span>}
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button 
                  onClick={() => setShowN8nModal(false)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleN8nSave}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                  Guardar Integración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HubSpot Configuration Modal */}
      {showHubspotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-xl border ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isHubspotConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'}`}>
                  <Database size={20} />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Configurar HubSpot</h3>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sincronización Bidireccional</p>
                </div>
              </div>
              <button onClick={() => setShowHubspotModal(false)} className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}>
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase mb-2 block">
                  private app access token
                </label>
                <input 
                  type="password" 
                  value={hubspotKey}
                  onChange={(e) => setHubspotKey(e.target.value)}
                  placeholder="pat-na1-xxxx-xxxx-xxxx" 
                  className={`w-full border rounded-lg px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                />
                <p className={`text-[11px] mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Ingresa el token de acceso privado de tu cuenta de HubSpot.
                </p>
              </div>

              {hubspotKey && (
                <div className="pt-2">
                  <button 
                    onClick={testHubspotConnection}
                    disabled={hubspotTestStatus === 'testing'}
                    className={`w-full py-2.5 rounded-lg text-sm font-bold border transition-all flex items-center justify-center gap-2 ${isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                  >
                    {hubspotTestStatus === 'testing' ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                    {hubspotTestStatus === 'idle' && 'Probar Conexión'}
                    {hubspotTestStatus === 'testing' && 'Verificando Token...'}
                    {hubspotTestStatus === 'success' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 size={16} /> Token Válido</span>}
                    {hubspotTestStatus === 'error' && <span className="text-rose-500 flex items-center gap-1"><AlertTriangle size={16} /> Token Inválido</span>}
                  </button>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button 
                  onClick={() => setShowHubspotModal(false)}
                  className={`px-5 py-2 rounded-xl text-sm font-bold transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleHubspotSave}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
                >
                  Guardar Integración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const IntegrationCard = ({ name, description, icon, color, status, isDarkMode, onClick }: any) => (
  <div className={`p-5 rounded-2xl border transition-all hover:shadow-xl ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800 hover:border-primary/50' : 'bg-white border-slate-200 hover:border-primary/30'}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>{icon}</div>
      <div className={`text-[10px] font-bold px-2 py-1 rounded-md ${status === 'Conectado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
        {status}
      </div>
    </div>
    <h3 className={`font-bold text-[13px] md:text-[14px] mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{name}</h3>
    <p className="text-[11px] md:text-[12px] text-slate-500 leading-relaxed mb-6 font-medium">{description}</p>
    <button 
      onClick={onClick}
      className={`w-full py-2.5 rounded-xl text-[12px] md:text-[13px] font-bold transition-all active:scale-95 ${status === 'Conectado' ? (isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20'}`}
    >
      {status === 'Conectado' ? 'Configurar' : 'Conectar'}
    </button>
  </div>
);

export default Automation;
