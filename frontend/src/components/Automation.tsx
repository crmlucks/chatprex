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
    { id: 1, name: 'Bienvenida Inmobiliaria', type: 'Envío Masivo', status: 'Active', delay: 60, content: 'Hola {{nombre}}, bienvenido a ChatPrex...', target: 'Todos los contactos' },
    { id: 2, name: 'Seguimiento Visita', type: 'Word Trigger', status: 'Draft', delay: 120, content: '¿Qué te pareció la propiedad?', target: 'Interesados' }
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
    setTimeout(() => {
      if (hubspotKey.length > 20) {
        setHubspotTestStatus('success');
      } else {
        setHubspotTestStatus('error');
      }
      setTimeout(() => setHubspotTestStatus('idle'), 3000);
    }, 1500);
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
               <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Zap size={24} /></div>
               <h1 className={`text-2xl font-black tracking-tight lowercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Automatizaciones</h1>
            </div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Crea embudos de venta y flujos de marketing inteligentes.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
             <button onClick={() => {
               const newId = Date.now();
               setSelectedId(newId);
               setAutomations([{ id: newId, name: 'Nuevo Flujo', type: 'Envío Masivo', status: 'Draft', delay: 30, content: 'Escribe tu mensaje aquí...', target: 'Todos los contactos' }, ...automations]);
             }} className="flex-1 md:flex-none px-6 py-3 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/20">
                + crear nuevo flujo
             </button>
          </div>
        </div>

        {/* API Keys and Integrations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`col-span-1 p-6 rounded-3xl border shadow-sm transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3 mb-4">
              <Key className="text-amber-500" size={20} />
              <h3 className={`text-[14px] font-black lowercase ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>API de ChatPrex</h3>
            </div>
            <p className="text-[11px] text-slate-500 mb-4 font-medium lowercase">Usa esta API Key para conectar tus formularios web.</p>
            <div className="flex flex-col gap-2">
              <input type="text" readOnly value="sk_live_chatprex_9876543210abcdef" className={`w-full border rounded-xl px-4 py-2 text-[11px] font-mono transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`} />
              <button className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>Copiar</button>
            </div>
          </div>

          <div className={`col-span-1 md:col-span-2 p-6 rounded-3xl border shadow-sm transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-[14px] font-black mb-6 lowercase ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Integraciones Activas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <IntegrationCard 
                name="n8n" 
                description="Automatización de flujos y Webhooks" 
                status={isN8nConnected ? "Conectado" : "Conectar"} 
                color={isN8nConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"} 
                icon={<Network size={20} />} 
                isDarkMode={isDarkMode} 
                onClick={() => setShowN8nModal(true)}
              />
              <IntegrationCard 
                name="HubSpot CRM" 
                description="Sincronización bidireccional de leads" 
                status={isHubspotConnected ? "Conectado" : "Conectar"} 
                color={isHubspotConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-orange-500/10 text-orange-500"} 
                icon={<Database size={20} />} 
                isDarkMode={isDarkMode} 
                onClick={() => setShowHubspotModal(true)}
              />
            </div>
          </div>
        </div>

        {/* Builder View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-4 space-y-4">
              <div className={`p-4 rounded-3xl border flex items-center gap-4 ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
                 <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input type="text" placeholder="buscar flujo..." className="w-full bg-transparent border-none text-[11px] font-bold pl-9 focus:ring-0 placeholder-slate-500 lowercase" />
                 </div>
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
                    </button>
                 ))}
              </div>
           </div>

           <div className={`lg:col-span-8 rounded-[40px] border shadow-2xl overflow-hidden flex flex-col transition-all min-h-[600px] ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-50 bg-slate-50'}`}>
                 <div className="flex-1">
                    <input type="text" value={activeAuto?.name} onChange={e => {
                       const val = e.target.value;
                       setAutomations(prev => prev.map(a => a.id === selectedId ? {...a, name: val} : a));
                    }} className={`text-xl font-black bg-transparent border-none focus:ring-0 w-full tracking-tight lowercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`} />
                 </div>
                 <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setAutomations(automations.filter(a => a.id !== selectedId))} className={`flex-1 sm:flex-none p-3 rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'border-slate-800 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-100 bg-white text-slate-600 hover:bg-slate-50'}`}><Trash2 size={14} /> eliminar</button>
                    <button className="flex-1 sm:flex-none p-3 px-6 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">guardar flujo</button>
                 </div>
              </div>

              <div className="flex-1 p-8 md:p-12 space-y-10 overflow-y-auto custom-scrollbar">
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">1</div>
                       <h4 className={`text-[10px] font-black uppercase tracking-[3px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>configuración de disparo</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">tipo de automatización</label>
                          <select value={activeAuto?.type} onChange={e => setAutomations(automations.map(a => a.id === selectedId ? {...a, type: e.target.value} : a))} className={`w-full p-4 rounded-2xl border text-[11px] font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary'}`}>
                             <option>Envío Masivo</option>
                             <option>Respuesta Automática</option>
                             <option>Seguimiento</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">tiempo de espera (segundos)</label>
                          <div className="flex items-center gap-4">
                             <input type="range" min="5" max="300" value={activeAuto?.delay} onChange={e => setAutomations(automations.map(a => a.id === selectedId ? {...a, delay: parseInt(e.target.value)} : a))} className="flex-1 accent-primary" />
                             <span className={`px-4 py-2 rounded-xl text-[11px] font-black ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-800'}`}>{activeAuto?.delay}s</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">2</div>
                       <h4 className={`text-[10px] font-black uppercase tracking-[3px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>contenido del mensaje</h4>
                    </div>
                    <div className="relative">
                       <textarea 
                          value={activeAuto?.content}
                          onChange={e => setAutomations(automations.map(a => a.id === selectedId ? {...a, content: e.target.value} : a))}
                          rows={6}
                          className={`w-full p-8 rounded-[40px] border text-[13px] font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none ${isDarkMode ? 'bg-slate-900/50 border-slate-700 text-slate-300 focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary'}`}
                          placeholder="Hola {{nombre}}, tenemos una oferta..."
                       />
                       <div className="absolute bottom-6 right-6 flex gap-2">
                          <button className={`p-2.5 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'}`}><Plus size={16} /></button>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">3</div>
                       <h4 className={`text-[10px] font-black uppercase tracking-[3px] ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>segmentación de audiencia</h4>
                    </div>
                    <div className={`p-10 rounded-[32px] border-2 border-dashed transition-colors flex flex-col items-center text-center gap-4 ${isDarkMode ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                       <Users size={32} className="opacity-50" />
                       <div>
                          <p className="text-[11px] font-black uppercase tracking-widest mb-1">público seleccionado: {activeAuto?.target}</p>
                          <p className="text-[10px] font-bold opacity-70 lowercase">Haz clic para cambiar el segmento.</p>
                       </div>
                       <button className="px-6 py-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">cambiar audiencia</button>
                    </div>
                 </div>
              </div>

              <div className={`p-6 border-t flex justify-between items-center transition-colors ${isDarkMode ? 'border-slate-800 bg-[#252525]' : 'border-slate-50 bg-slate-50'}`}>
                 <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${activeAuto?.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{activeAuto?.status === 'Active' ? 'campaña en ejecución' : 'campaña detenida'}</span>
                 </div>
                 <button onClick={() => setAutomations(automations.map(a => a.id === selectedId ? {...a, status: a.status === 'Active' ? 'Draft' : 'Active'} : a))} className={`px-8 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 ${activeAuto?.status === 'Active' ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/20' : 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/20'}`}>
                    {activeAuto?.status === 'Active' ? 'detener flujo' : 'activar ahora'}
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* Modals */}
      {showN8nModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-md p-10 rounded-[32px] border shadow-2xl ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-xl font-black lowercase mb-8 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>configurar n8n</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">url del webhook</label>
                <input type="url" value={n8nUrl} onChange={e => setN8nUrl(e.target.value)} className={`w-full p-4 rounded-2xl border text-[12px] font-bold outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary'}`} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowN8nModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">cancelar</button>
                <button onClick={handleN8nSave} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showHubspotModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`w-full max-w-md p-10 rounded-[32px] border shadow-2xl ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-xl font-black lowercase mb-8 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>configurar hubspot</h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">access token</label>
                <input type="password" value={hubspotKey} onChange={e => setHubspotKey(e.target.value)} className={`w-full p-4 rounded-2xl border text-[12px] font-bold outline-none ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary'}`} />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowHubspotModal(false)} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all">cancelar</button>
                <button onClick={handleHubspotSave} className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest bg-primary text-white rounded-2xl shadow-xl shadow-primary/20">guardar</button>
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
      <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${status === 'Conectado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
        {status}
      </div>
    </div>
    <h3 className={`text-[13px] font-black lowercase mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{name}</h3>
    <p className="text-[11px] text-slate-500 leading-relaxed mb-6 font-medium lowercase">{description}</p>
    <button 
      onClick={onClick}
      className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${status === 'Conectado' ? (isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200') : 'bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20'}`}
    >
      {status === 'Conectado' ? 'Configurar' : 'Conectar'}
    </button>
  </div>
);

export default Automation;
