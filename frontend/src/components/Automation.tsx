import React, { useState } from 'react';
import { Zap, Key, Server, Webhook, Network, Database, X, CheckCircle2, AlertTriangle, Loader2, MessageCircle, Users, Search, Trash2, Plus } from 'lucide-react';

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

  // Automations State
  const [automations, setAutomations] = useState<any[]>([
    { id: 1, name: 'Bienvenida inmobiliaria', type: 'Envío masivo', status: 'Activo', delay: 60, content: 'Hola {{nombre}}, bienvenido a ChatPrex...', target: 'Todos los contactos' },
    { id: 2, name: 'Seguimiento visita', type: 'Word trigger', status: 'Borrador', delay: 120, content: '¿Qué te pareció la propiedad?', target: 'Interesados' }
  ]);
  const [selectedId, setSelectedId] = useState<number | null>(1);

  const activeAuto = automations.find(a => a.id === selectedId);

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

  const dc = isDarkMode;

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 transition-colors ${dc ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${dc ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                <Zap size={24} />
             </div>
             <div>
                <h1 className="h1">Automatizaciones</h1>
                <p className="body-text mt-0.5">Gestione flujos de trabajo y marketing inteligente</p>
             </div>
          </div>
          <button onClick={() => {
            const newId = Date.now();
            setSelectedId(newId);
            setAutomations([{ id: newId, name: 'Nuevo flujo', type: 'Envío masivo', status: 'Borrador', delay: 30, content: 'Escribe tu mensaje aquí...', target: 'Todos los contactos' }, ...automations]);
          }} className="btn-primary flex items-center gap-2">
             <Plus size={16} />
             <span>Crear nuevo flujo</span>
          </button>
        </div>

        {/* Integration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-premium p-6 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
               <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${dc ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                  <Key size={20} />
               </div>
               <h3 className="h3">API de ChatPrex</h3>
            </div>
            <p className="small-text mb-6">Utilice esta clave para conectar sus formularios externos o integraciones personalizadas.</p>
            <div className="space-y-3 mt-auto">
               <div className={`p-3 rounded-xl border font-mono text-[11px] break-all ${dc ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500 shadow-inner'}`}>
                  sk_live_chatprex_9876543210abcdef
               </div>
               <button className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${dc ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
                  Copiar clave
               </button>
            </div>
          </div>

          <div className="md:col-span-2 card-premium p-6">
            <h3 className="h3 mb-6">Integraciones activas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <IntegrationCard 
                name="n8n" 
                description="Automatización de flujos y Webhooks personalizados" 
                status={isN8nConnected ? "Conectado" : "Pendiente"} 
                color={isN8nConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"} 
                icon={<Network size={20} />} 
                isDarkMode={dc} 
                onClick={() => setShowN8nModal(true)}
              />
              <IntegrationCard 
                name="HubSpot" 
                description="Sincronización bidireccional de prospectos y contactos" 
                status={isHubspotConnected ? "Conectado" : "Pendiente"} 
                color={isHubspotConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"} 
                icon={<Database size={20} />} 
                isDarkMode={dc} 
                onClick={() => setShowHubspotModal(true)}
              />
            </div>
          </div>
        </div>

        {/* Builder View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
           {/* Sidebar Flow List */}
           <div className="lg:col-span-4 space-y-4">
              <div className="card-premium p-3 flex items-center gap-3">
                 <Search className="text-slate-400 ml-2" size={14} />
                 <input type="text" placeholder="Buscar flujo..." className="w-full bg-transparent border-none text-xs font-medium focus:ring-0 placeholder-slate-500" />
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar pr-1">
                 {automations.map(a => (
                    <button key={a.id} onClick={() => setSelectedId(a.id)}
                      className={`w-full p-5 rounded-2xl border text-left transition-all active:scale-[0.98] group relative ${selectedId === a.id ? 'bg-primary border-primary shadow-xl shadow-primary/10' : (dc ? 'bg-[#1E1E1E] border-slate-800 hover:border-slate-700' : 'bg-white border-slate-100 hover:shadow-md')}`}>
                       <div className="flex justify-between items-start mb-4">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${selectedId === a.id ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}`}>
                             {a.type === 'Envío masivo' ? <MessageCircle size={18} /> : <Zap size={18} />}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${a.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>{a.status}</span>
                       </div>
                       <h3 className={`text-sm font-bold truncate mb-1 ${selectedId === a.id ? 'text-white' : (dc ? 'text-slate-100' : 'text-slate-800')}`}>{a.name}</h3>
                       <p className={`text-[11px] font-medium ${selectedId === a.id ? 'text-white/70' : 'text-slate-500'}`}>{a.type} • {a.delay}s espera</p>
                    </button>
                 ))}
              </div>
           </div>

           {/* Flow Editor */}
           <div className="lg:col-span-8 card-premium flex flex-col min-h-[600px] overflow-hidden">
              {/* Editor Header */}
              <div className={`px-8 py-6 border-b flex justify-between items-center transition-colors ${dc ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-50'}`}>
                 <div className="flex-1">
                    <input type="text" value={activeAuto?.name} onChange={e => {
                       const val = e.target.value;
                       setAutomations(prev => prev.map(a => a.id === selectedId ? {...a, name: val} : a));
                    }} className={`text-lg font-bold bg-transparent border-none focus:ring-0 w-full ${dc ? 'text-white' : 'text-slate-800'}`} />
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setAutomations(automations.filter(a => a.id !== selectedId))} className={`p-2.5 rounded-xl border transition-all ${dc ? 'border-slate-800 text-slate-400 hover:text-rose-500' : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}><Trash2 size={16} /></button>
                    <button className="btn-primary">Guardar cambios</button>
                 </div>
              </div>

              {/* Editor Body */}
              <div className="flex-1 p-8 md:p-10 space-y-10 overflow-y-auto custom-scrollbar">
                 {/* Step 1 */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">1</div>
                       <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Configuración del disparador</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="small-text font-bold text-slate-500 ml-1">Tipo de automatización</label>
                          <select value={activeAuto?.type} onChange={e => setAutomations(automations.map(a => a.id === selectedId ? {...a, type: e.target.value} : a))} className={`w-full p-3 rounded-xl border text-xs font-bold outline-none transition-all ${dc ? 'bg-slate-900 border-slate-800 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary shadow-inner'}`}>
                             <option>Envío masivo</option>
                             <option>Respuesta automática</option>
                             <option>Seguimiento inteligente</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="small-text font-bold text-slate-500 ml-1">Tiempo de espera (segundos)</label>
                          <div className="flex items-center gap-4">
                             <input type="range" min="5" max="300" value={activeAuto?.delay} onChange={e => setAutomations(automations.map(a => a.id === selectedId ? {...a, delay: parseInt(e.target.value)} : a))} className="flex-1 accent-primary" />
                             <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${dc ? 'bg-slate-800 text-white' : 'bg-white border text-slate-800 shadow-sm'}`}>{activeAuto?.delay}s</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Step 2 */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">2</div>
                       <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Contenido del mensaje</h4>
                    </div>
                    <div className="relative">
                       <textarea 
                          value={activeAuto?.content}
                          onChange={e => setAutomations(automations.map(a => a.id === selectedId ? {...a, content: e.target.value} : a))}
                          rows={5}
                          className={`w-full p-6 rounded-2xl border text-sm font-medium outline-none transition-all resize-none ${dc ? 'bg-slate-900/50 border-slate-800 text-slate-300 focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary shadow-inner'}`}
                          placeholder="Escriba el mensaje que se enviará automáticamente..."
                       />
                       <div className="absolute bottom-4 right-4 flex gap-2">
                          <button className={`p-2 rounded-lg border shadow-sm ${dc ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-400 hover:text-slate-800'}`}><Plus size={16} /></button>
                       </div>
                    </div>
                    <p className="text-[10px] text-slate-400 px-1 font-medium">Sugerencia: Use {"{{nombre}}"} para personalizar el mensaje con el nombre del contacto.</p>
                 </div>

                 {/* Step 3 */}
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[11px] font-bold">3</div>
                       <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Audiencia objetivo</h4>
                    </div>
                    <div className={`p-8 rounded-3xl border-2 border-dashed flex flex-col items-center text-center gap-4 ${dc ? 'bg-primary/5 border-primary/20 text-primary/70' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                       <Users size={28} className="opacity-40" />
                       <div>
                          <p className="text-xs font-bold mb-1">Público: {activeAuto?.target}</p>
                          <p className="small-text opacity-70">Este flujo se activará para el segmento seleccionado.</p>
                       </div>
                       <button className="px-6 py-2 bg-primary text-white text-[11px] font-bold rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">Cambiar audiencia</button>
                    </div>
                 </div>
              </div>

              {/* Editor Footer */}
              <div className={`px-8 py-6 border-t flex justify-between items-center transition-colors ${dc ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-50'}`}>
                 <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${activeAuto?.status === 'Activo' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    <span className={`text-[11px] font-bold ${dc ? 'text-slate-400' : 'text-slate-600'}`}>{activeAuto?.status === 'Activo' ? 'Flujo en ejecución' : 'Flujo en borrador'}</span>
                 </div>
                 <button onClick={() => setAutomations(automations.map(a => a.id === selectedId ? {...a, status: a.status === 'Activo' ? 'Borrador' : 'Activo'} : a))} className={`px-8 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${activeAuto?.status === 'Activo' ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'}`}>
                    {activeAuto?.status === 'Activo' ? 'Detener flujo' : 'Activar ahora'}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Modals */}
      {showN8nModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-md p-8 rounded-[32px] border shadow-2xl ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className="h2 mb-2 text-center">Configurar n8n</h3>
            <p className="body-text text-center mb-8">Conecte su servidor de automatización vía Webhook.</p>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="small-text font-bold text-slate-500 ml-1">URL del Webhook</label>
                <input type="url" value={n8nUrl} onChange={e => setN8nUrl(e.target.value)} className={`w-full p-3 rounded-xl border text-xs font-bold outline-none transition-all ${dc ? 'bg-slate-900 border-slate-800 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary shadow-inner'}`} placeholder="https://n8n.tu-servidor.com/webhook/..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowN8nModal(false)} className="flex-1 py-3 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancelar</button>
                <button onClick={handleN8nSave} className="flex-1 py-3 text-xs font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/20">Guardar conexión</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHubspotModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className={`w-full max-w-md p-8 rounded-[32px] border shadow-2xl ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100'}`}>
            <h3 className="h2 mb-2 text-center">Configurar HubSpot</h3>
            <p className="body-text text-center mb-8">Sincronice sus contactos automáticamente.</p>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="small-text font-bold text-slate-500 ml-1">Private Access Token</label>
                <input type="password" value={hubspotKey} onChange={e => setHubspotKey(e.target.value)} className={`w-full p-3 rounded-xl border text-xs font-bold outline-none transition-all ${dc ? 'bg-slate-900 border-slate-800 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary shadow-inner'}`} placeholder="pat-na1-..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowHubspotModal(false)} className="flex-1 py-3 text-xs font-bold border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">Cancelar</button>
                <button onClick={handleHubspotSave} className="flex-1 py-3 text-xs font-bold bg-primary text-white rounded-xl shadow-lg shadow-primary/20">Guardar API Key</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const IntegrationCard = ({ name, description, icon, color, status, isDarkMode, onClick }: any) => {
  const dc = isDarkMode;
  return (
    <div className={`p-5 rounded-2xl border transition-all hover:shadow-xl group ${dc ? 'bg-[#1E1E1E] border-slate-800 hover:border-primary/40' : 'bg-white border-slate-100 hover:border-primary/20'}`}>
      <div className="flex justify-between items-start mb-5">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
        <div className={`text-[10px] font-bold px-2 py-1 rounded-lg ${status === 'Conectado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
          {status}
        </div>
      </div>
      <h3 className={`text-sm font-bold mb-1 ${dc ? 'text-white' : 'text-slate-800'}`}>{name}</h3>
      <p className="small-text mb-6 line-clamp-2">{description}</p>
      <button 
        onClick={onClick}
        className={`w-full py-2.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${status === 'Conectado' ? (dc ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20'}`}
      >
        {status === 'Conectado' ? 'Configurar' : 'Conectar'}
      </button>
    </div>
  );
};

export default Automation;
