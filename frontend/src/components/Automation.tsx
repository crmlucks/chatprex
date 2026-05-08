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
            <div className="flex items-center gap-3 mb-1">
               <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Zap size={20} /></div>
               <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Automatizaciones</h1>
            </div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Crea embudos de venta y flujos de marketing inteligentes.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <button onClick={() => {
               const newId = -Math.random();
               setSelectedId(newId);
               setAutomations([{ id: newId, name: 'Nuevo Flujo', type: 'Envío Masivo', status: 'Draft', delay: 30, content: 'Escribe tu mensaje aquí...', target: 'Todos los contactos' }, ...automations]);
             }} className="flex-1 md:flex-none px-6 py-3 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/20">
                + Crear Nuevo Flujo
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* Sidebar: Lista de Automatizaciones (4 cols) */}
           <div className="lg:col-span-4 space-y-4">
              <div className={`p-4 rounded-3xl border flex items-center gap-4 ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
                 <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input type="text" placeholder="Buscar flujo..." className="w-full bg-transparent border-none text-xs font-bold pl-9 focus:ring-0 placeholder-slate-500" />
                 </div>
                 <button className={`p-2 rounded-xl border ${isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-100 hover:bg-slate-50'}`}><Plus size={16} /></button>
              </div>

              <div className="space-y-3">
                 {automations.map(a => (
                    <button key={a.id} onClick={() => setSelectedId(a.id)}
                      className={`w-full p-5 rounded-[28px] border text-left transition-all active:scale-[0.98] group relative overflow-hidden ${selectedId === a.id ? 'bg-primary border-primary shadow-2xl shadow-primary/20' : (isDarkMode ? 'bg-[#1E1E1E] border-slate-800 hover:border-slate-600' : 'bg-white border-slate-200 hover:shadow-md')}`}>
                       <div className="flex justify-between items-start mb-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${selectedId === a.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                             {a.type === 'Envío Masivo' ? <MessageCircle size={20} /> : <Zap size={20} />}
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${a.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{a.status}</span>
                       </div>
                       <h3 className={`text-sm font-black truncate mb-1 lowercase tracking-tight ${selectedId === a.id ? 'text-white' : (isDarkMode ? 'text-slate-100' : 'text-slate-800')}`}>{a.name}</h3>
                       <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedId === a.id ? 'text-white/70' : 'text-slate-500'}`}>{a.type} • {a.delay}s delay</p>
                       
                       {selectedId === a.id && (
                          <div className="absolute top-0 right-0 p-4">
                             <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                          </div>
                       )}
                    </button>
                 ))}
              </div>
           </div>

           {/* Main: Editor de Flujo (8 cols) */}
           <div className={`lg:col-span-8 rounded-[40px] border shadow-2xl overflow-hidden flex flex-col transition-all min-h-[600px] ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
              
              {/* Toolbar Editor */}
              <div className={`p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-50 bg-slate-50'}`}>
                 <div className="flex-1">
                    <input type="text" value={activeAuto?.name} onChange={e => {
                       const val = e.target.value;
                       setAutomations(prev => prev.map(a => a.id === selectedId ? {...a, name: val} : a));
                    }} className={`text-xl font-black bg-transparent border-none focus:ring-0 w-full tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">ID: {selectedId?.toString().slice(0,8)}</p>
                 </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <button className={`flex-1 sm:flex-none p-3 rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'border-slate-800 bg-slate-800 text-slate-300' : 'border-slate-100 bg-white text-slate-600'}`}><Trash2 size={14} /> Eliminar</button>
                    <button className="flex-1 sm:flex-none p-3 px-6 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">Guardar Flujo</button>
                 </div>
              </div>

              {/* Área de Trabajo */}
              <div className="flex-1 p-8 md:p-12 space-y-10 overflow-y-auto custom-scrollbar">
                 
                 {/* Paso 1: Configuración */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">1</div>
                       <h4 className={`text-[11px] font-black uppercase tracking-[3px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Configuración de Disparo</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">tipo de automatización</label>
                          <select className={`w-full p-4 rounded-2xl border text-xs font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary'}`}>
                             <option>Envío Masivo (Broadcast)</option>
                             <option>Respuesta por Palabra Clave</option>
                             <option>Seguimiento Post-Venta</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">tiempo de espera (segundos)</label>
                          <div className="flex items-center gap-4">
                             <input type="range" min="5" max="300" className="flex-1 accent-primary" />
                             <span className={`px-4 py-2 rounded-xl text-xs font-black ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'}`}>60s</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Paso 2: Contenido */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">2</div>
                       <h4 className={`text-[11px] font-black uppercase tracking-[3px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Contenido del Mensaje</h4>
                    </div>

                    <div className="relative group">
                       <textarea 
                          value={activeAuto?.content}
                          onChange={e => {
                             const val = e.target.value;
                             setAutomations(prev => prev.map(a => a.id === selectedId ? {...a, content: val} : a));
                          }}
                          rows={6}
                          className={`w-full p-8 rounded-[40px] border text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-300 focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary'}`}
                          placeholder="Hola {{nombre}}, tenemos una oferta especial para ti..."
                       />
                       <div className="absolute bottom-6 right-6 flex gap-2">
                          <button className={`p-2 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'}`}><Plus size={16} /></button>
                          <button className={`p-2 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'}`}><Zap size={16} /></button>
                       </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                       {['{{nombre}}', '{{primer_apellido}}', '{{email}}', '{{telefono}}'].map(tag => (
                          <button key={tag} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isDarkMode ? 'border-slate-800 text-slate-500 hover:bg-slate-800 hover:text-primary' : 'border-slate-100 text-slate-500 hover:bg-slate-50 hover:text-primary'}`}>{tag}</button>
                       ))}
                    </div>
                 </div>

                 {/* Paso 3: Segmentación */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">3</div>
                       <h4 className={`text-[11px] font-black uppercase tracking-[3px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Segmentación de Audiencia</h4>
                    </div>
                    
                    <div className={`p-8 rounded-3xl border-2 border-dashed transition-colors flex flex-col items-center text-center gap-4 ${isDarkMode ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                       <Users size={32} className="opacity-50" />
                       <div>
                          <p className="text-xs font-black uppercase tracking-widest mb-1">Público Seleccionado: {activeAuto?.target}</p>
                          <p className="text-[10px] font-bold opacity-70">Haz clic para cambiar el segmento o subir una lista de contactos.</p>
                       </div>
                       <button className="px-6 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl">Cambiar Audiencia</button>
                    </div>
                 </div>

              </div>

              {/* Footer Acciones de Estado */}
              <div className={`p-6 border-t flex justify-between items-center transition-colors ${isDarkMode ? 'border-slate-800 bg-[#252525]' : 'border-slate-50 bg-slate-50'}`}>
                 <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${activeAuto?.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{activeAuto?.status === 'Active' ? 'Campaña en Ejecución' : 'Campaña Detenida'}</span>
                 </div>
                 <button className={`px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 ${activeAuto?.status === 'Active' ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'}`}>
                    {activeAuto?.status === 'Active' ? 'Detener Flujo' : 'Activar Ahora'}
                 </button>
              </div>

           </div>
        </div>

      </div>
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
