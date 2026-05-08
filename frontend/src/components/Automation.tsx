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
  <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 transition-colors ${dc ? 'bg-surface-base' : 'bg-surface-base'}`}>
   <div className="max-w-7xl mx-auto space-y-8">
    
    {/* Header Section */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
     <div className="flex items-center gap-4">
       <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${dc ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'}`}>
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
        <div className={`p-3 rounded-xl border font-mono text-xs break-all ${dc ? 'bg-surface-raised border-edge text-content-muted' : 'bg-surface-inset border-edge text-content-muted '}`}>
         sk_live_chatprex_9876543210abcdef
        </div>
        <button className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${dc ? 'bg-surface-raised text-content hover:bg-slate-700' : 'bg-surface-raised text-content hover:bg-slate-700'}`}>
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
        color={isN8nConnected ? "bg-emerald-500/10 text-emerald-500" : "bg-surface-inset0/10 text-content-muted"} 
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
         <Search className="text-content-muted ml-2" size={14} />
         <input type="text" placeholder="Buscar flujo..." className="w-full bg-transparent border-none text-xs font-medium focus:ring-0 placeholder-slate-500" />
       </div>

       <div className="space-y-3 overflow-y-auto max-h-[600px] custom-scrollbar pr-1">
         {automations.map(a => (
          <button key={a.id} onClick={() => setSelectedId(a.id)}
           className={`w-full p-5 rounded-2xl border text-left transition-all active:scale-[0.98] group relative ${selectedId === a.id ? 'bg-accent border-accent shadow-sm shadow-accent/10' : (dc ? 'bg-surface border-edge hover:border-edge' : 'bg-surface border-edge hover:shadow-md')}`}>
            <div className="flex justify-between items-start mb-4">
             <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${selectedId === a.id ? 'bg-surface/20 text-content' : 'bg-accent/10 text-accent'}`}>
               {a.type === 'Envío masivo' ? <MessageCircle size={18} /> : <Zap size={18} />}
             </div>
             <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${a.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-inset0/10 text-content-muted'}`}>{a.status}</span>
            </div>
            <h3 className={`text-sm font-bold truncate mb-1 ${selectedId === a.id ? 'text-content' : (dc ? 'text-content' : 'text-content')}`}>{a.name}</h3>
            <p className={`text-xs font-medium ${selectedId === a.id ? 'text-content/70' : 'text-content-muted'}`}>{a.type} • {a.delay}s espera</p>
          </button>
         ))}
       </div>
      </div>

      {/* Flow Editor */}
      <div className="lg:col-span-8 card-premium flex flex-col min-h-[600px] overflow-hidden">
       {/* Editor Header */}
       <div className={`px-8 py-6 border-b flex justify-between items-center transition-colors ${dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge-light'}`}>
         <div className="flex-1">
          <input type="text" value={activeAuto?.name} onChange={e => {
            const val = e.target.value;
            setAutomations(prev => prev.map(a => a.id === selectedId ? {...a, name: val} : a));
          }} className={`text-lg font-bold bg-transparent border-none focus:ring-0 w-full ${dc ? 'text-content' : 'text-content'}`} />
         </div>
         <div className="flex gap-3">
          <button onClick={() => setAutomations(automations.filter(a => a.id !== selectedId))} className={`p-2.5 rounded-xl border transition-all ${dc ? 'border-edge text-content-muted hover:text-rose-500' : 'border-edge text-content-muted hover:text-rose-500 hover:bg-rose-50'}`}><Trash2 size={16} /></button>
          <button className="btn-primary">Guardar cambios</button>
         </div>
       </div>

       {/* Editor Body */}
       <div className="flex-1 p-8 md:p-10 space-y-10 overflow-y-auto custom-scrollbar">
         {/* Step 1 */}
         <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-raised text-content flex items-center justify-center text-xs font-bold">1</div>
            <h4 className="text-xs font-bold uppercase tracking-normal text-content-muted">Configuración del disparador</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
             <label className="small-text font-bold text-content-muted ml-1">Tipo de automatización</label>
             <select value={activeAuto?.type} onChange={e => setAutomations(automations.map(a => a.id === selectedId ? {...a, type: e.target.value} : a))} className={`w-full p-3 rounded-xl border text-xs font-bold outline-none transition-all ${dc ? 'bg-surface-raised border-edge text-content focus:border-accent' : 'bg-surface-inset border-edge text-content focus:border-accent '}`}>
               <option>Envío masivo</option>
               <option>Respuesta automática</option>
               <option>Seguimiento inteligente</option>
             </select>
            </div>
            <div className="space-y-2">
             <label className="small-text font-bold text-content-muted ml-1">Tiempo de espera (segundos)</label>
             <div className="flex items-center gap-4">
               <input type="range" min="5" max="300" value={activeAuto?.delay} onChange={e => setAutomations(automations.map(a => a.id === selectedId ? {...a, delay: parseInt(e.target.value)} : a))} className="flex-1 accent-primary" />
               <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${dc ? 'bg-surface-raised text-content' : 'bg-surface border text-content shadow-sm'}`}>{activeAuto?.delay}s</span>
             </div>
            </div>
          </div>
         </div>

         {/* Step 2 */}
         <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-raised text-content flex items-center justify-center text-xs font-bold">2</div>
            <h4 className="text-xs font-bold uppercase tracking-normal text-content-muted">Contenido del mensaje</h4>
          </div>
          <div className="relative">
            <textarea 
             value={activeAuto?.content}
             onChange={e => setAutomations(automations.map(a => a.id === selectedId ? {...a, content: e.target.value} : a))}
             rows={5}
             className={`w-full p-6 rounded-2xl border text-sm font-medium outline-none transition-all resize-none ${dc ? 'bg-surface-raised/50 border-edge text-content-secondary focus:border-accent' : 'bg-surface-inset border-edge text-content focus:border-accent '}`}
             placeholder="Escriba el mensaje que se enviará automáticamente..."
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
             <button className={`p-2 rounded-lg border shadow-sm ${dc ? 'bg-surface-raised border-edge text-content-muted hover:text-content' : 'bg-surface border-edge text-content-muted hover:text-content'}`}><Plus size={16} /></button>
            </div>
          </div>
          <p className="text-xs text-content-muted px-1 font-medium">Sugerencia: Use {"{{nombre}}"} para personalizar el mensaje con el nombre del contacto.</p>
         </div>

         {/* Step 3 */}
         <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-raised text-content flex items-center justify-center text-xs font-bold">3</div>
            <h4 className="text-xs font-bold uppercase tracking-normal text-content-muted">Audiencia objetivo</h4>
          </div>
          <div className={`p-8 rounded-xl border-2 border-dashed flex flex-col items-center text-center gap-4 ${dc ? 'bg-accent/5 border-accent/20 text-accent/70' : 'bg-accent/5 border-accent/20 text-accent'}`}>
            <Users size={28} className="opacity-40" />
            <div>
             <p className="text-xs font-bold mb-1">Público: {activeAuto?.target}</p>
             <p className="small-text opacity-70">Este flujo se activará para el segmento seleccionado.</p>
            </div>
            <button className="px-6 py-2 bg-accent text-content text-xs font-bold rounded-xl hover:bg-accent-dark transition-all shadow-lg shadow-accent/20">Cambiar audiencia</button>
          </div>
         </div>
       </div>

       {/* Editor Footer */}
       <div className={`px-8 py-6 border-t flex justify-between items-center transition-colors ${dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge-light'}`}>
         <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${activeAuto?.status === 'Activo' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
          <span className={`text-xs font-bold ${dc ? 'text-content-muted' : 'text-content-secondary'}`}>{activeAuto?.status === 'Activo' ? 'Flujo en ejecución' : 'Flujo en borrador'}</span>
         </div>
         <button onClick={() => setAutomations(automations.map(a => a.id === selectedId ? {...a, status: a.status === 'Activo' ? 'Borrador' : 'Activo'} : a))} className={`px-8 py-3 rounded-xl font-bold text-xs transition-all active:scale-95 ${activeAuto?.status === 'Activo' ? 'bg-rose-500 text-content shadow-sm shadow-rose-500/20' : 'bg-emerald-500 text-content shadow-sm shadow-emerald-500/20'}`}>
          {activeAuto?.status === 'Activo' ? 'Detener flujo' : 'Activar ahora'}
         </button>
       </div>
      </div>
    </div>
   </div>

   {/* Modals */}
   {showN8nModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300">
     <div className={`w-full max-w-md p-8 rounded-xl border shadow-sm ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge'}`}>
      <h3 className="h2 mb-2 text-center">Configurar n8n</h3>
      <p className="body-text text-center mb-8">Conecte su servidor de automatización vía Webhook.</p>
      <div className="space-y-6">
       <div className="space-y-2">
        <label className="small-text font-bold text-content-muted ml-1">URL del Webhook</label>
        <input type="url" value={n8nUrl} onChange={e => setN8nUrl(e.target.value)} className={`w-full p-3 rounded-xl border text-xs font-bold outline-none transition-all ${dc ? 'bg-surface-raised border-edge text-content focus:border-accent' : 'bg-surface-inset border-edge text-content focus:border-accent '}`} placeholder="https://n8n.tu-servidor.com/webhook/..." />
       </div>
       <div className="flex gap-3">
        <button onClick={() => setShowN8nModal(false)} className="flex-1 py-3 text-xs font-bold border border-edge rounded-xl hover:bg-surface-inset transition-all">Cancelar</button>
        <button onClick={handleN8nSave} className="flex-1 py-3 text-xs font-bold bg-accent text-content rounded-xl shadow-lg shadow-accent/20">Guardar conexión</button>
       </div>
      </div>
     </div>
    </div>
   )}

   {showHubspotModal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300">
     <div className={`w-full max-w-md p-8 rounded-xl border shadow-sm ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge'}`}>
      <h3 className="h2 mb-2 text-center">Configurar HubSpot</h3>
      <p className="body-text text-center mb-8">Sincronice sus contactos automáticamente.</p>
      <div className="space-y-6">
       <div className="space-y-2">
        <label className="small-text font-bold text-content-muted ml-1">Private Access Token</label>
        <input type="password" value={hubspotKey} onChange={e => setHubspotKey(e.target.value)} className={`w-full p-3 rounded-xl border text-xs font-bold outline-none transition-all ${dc ? 'bg-surface-raised border-edge text-content focus:border-accent' : 'bg-surface-inset border-edge text-content focus:border-accent '}`} placeholder="pat-na1-..." />
       </div>
       <div className="flex gap-3">
        <button onClick={() => setShowHubspotModal(false)} className="flex-1 py-3 text-xs font-bold border border-edge rounded-xl hover:bg-surface-inset transition-all">Cancelar</button>
        <button onClick={handleHubspotSave} className="flex-1 py-3 text-xs font-bold bg-accent text-content rounded-xl shadow-lg shadow-accent/20">Guardar API Key</button>
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
  <div className={`p-5 rounded-2xl border transition-all hover:shadow-sm group ${dc ? 'bg-surface border-edge hover:border-accent/40' : 'bg-surface border-edge hover:border-accent/20'}`}>
   <div className="flex justify-between items-start mb-5">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
    <div className={`text-xs font-bold px-2 py-1 rounded-lg ${status === 'Conectado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-inset0/10 text-content-muted'}`}>
     {status}
    </div>
   </div>
   <h3 className={`text-sm font-bold mb-1 ${dc ? 'text-content' : 'text-content'}`}>{name}</h3>
   <p className="small-text mb-6 line-clamp-2">{description}</p>
   <button 
    onClick={onClick}
    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${status === 'Conectado' ? (dc ? 'bg-surface-raised text-content-secondary hover:bg-slate-700' : 'bg-slate-100 text-content-secondary hover:bg-slate-200') : 'bg-accent text-content hover:bg-accent-dark shadow-lg shadow-accent/20'}`}
   >
    {status === 'Conectado' ? 'Configurar' : 'Conectar'}
   </button>
  </div>
 );
};

export default Automation;
