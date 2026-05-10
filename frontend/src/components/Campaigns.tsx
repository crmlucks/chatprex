import React, { useState } from 'react';
import { Play, Pause, AlertCircle, Settings, Users, MessageSquare, Megaphone, Plus, Trash2, Send, Paperclip, X, Bot, Shield, CheckCircle2, Clock, Search, BarChart3 } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export default function Campaigns({ isDarkMode }: { isDarkMode?: boolean }) {
 const { token } = useAuth();
 
 const [campaigns, setCampaigns] = useState<any[]>([]);
 const [showModal, setShowModal] = useState(false);
 const [activeTab, setActiveTab] = useState('mensaje');
 const [editingCampaign, setEditingCampaign] = useState<any>(null);

 // Form state
 const [formData, setFormData] = useState({
  name: '',
  type: 'Envío masivo',
  message: '',
  useAI: false,
  recipientSource: 'database',
  dbFilter: 'todos',
  manualRecipients: '',
  minDelay: 10,
  maxDelay: 30,
  mediaName: ''
 });

 const [status, setStatus] = useState('idle');
 const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

 const fetchCampaigns = async () => {
  try {
   const res = await fetch(`${API_URL}/api/campaigns`, {
    headers: { Authorization: `Bearer ${token}` }
   });
   if (res.ok) {
    const data = await res.json();
    setCampaigns(data);
   }
  } catch (err) {
   console.error('Error fetching campaigns', err);
  }
 };

 React.useEffect(() => {
  if (token) fetchCampaigns();
  const interval = setInterval(() => {
     setCampaigns(prev => {
        if (prev.some(c => c.status === 'Activo')) fetchCampaigns();
        return prev;
     });
  }, 10000);
  return () => clearInterval(interval);
 }, [token]);

 const openModal = (campaign?: any) => {
  if (campaign) {
   setEditingCampaign(campaign);
   setFormData({
    name: campaign.name,
    type: campaign.type || 'Envío masivo',
    message: campaign.message || '',
    useAI: campaign.use_ai || false,
    recipientSource: campaign.recipient_source || 'database',
    dbFilter: campaign.db_filter || 'todos',
    manualRecipients: campaign.manual_recipients || '',
    minDelay: 10,
    maxDelay: 30,
    mediaName: ''
   });
  } else {
   setEditingCampaign(null);
   setFormData({
    name: 'Nueva campaña ' + new Date().toLocaleDateString(),
    type: 'Envío masivo',
    message: '',
    useAI: false,
    recipientSource: 'database',
    dbFilter: 'todos',
    manualRecipients: '',
    minDelay: 10,
    maxDelay: 30,
    mediaName: ''
   });
  }
  setActiveTab('mensaje');
  setShowModal(true);
 };

 const saveCampaign = async () => {
  try {
   const payload = {
    name: formData.name,
    type: formData.type,
    message: formData.message,
    use_ai: formData.useAI,
    recipient_source: formData.recipientSource,
    db_filter: formData.dbFilter,
    manual_recipients: formData.manualRecipients,
    status: editingCampaign ? editingCampaign.status : 'Borrador'
   };
   
   const method = editingCampaign ? 'PUT' : 'POST';
   const url = editingCampaign ? `${API_URL}/api/campaigns/${editingCampaign.id}` : `${API_URL}/api/campaigns`;
   const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
   });
   if (res.ok) {
    fetchCampaigns();
    setShowModal(false);
   }
  } catch (err) {
   console.error('Error saving campaign', err);
  }
 };

 const startCampaignLive = async (id: number) => {
  try {
   setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: 'Activo', progress: 0 } : c));
   await fetch(`${API_URL}/api/campaigns/${id}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
   });
  } catch (err) {
   console.error('Error starting campaign', err);
  }
 };

 const deleteCampaign = async (id: number) => {
  if(confirm("¿Eliminar esta campaña?")) {
   try {
    const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
     method: 'DELETE',
     headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) fetchCampaigns();
   } catch (err) {
    console.error('Error deleting campaign', err);
   }
  }
 };

 const dc = isDarkMode;

 return (
  <div className={`flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 transition-colors ${dc ? 'bg-surface-base' : 'bg-surface-base'}`}>
   <div className="max-w-7xl mx-auto space-y-8">
    
    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
     <div className="flex items-center gap-4">
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${dc ? 'bg-accent/20 text-accent' : 'bg-surface text-accent border border-edge'}`}>
        <Megaphone size={28} />
       </div>
       <div>
        <h1 className="h1">Campañas y Automatización</h1>
        <p className="body-text text-sm">Envíos masivos y seguimientos inteligentes</p>
       </div>
     </div>
     <button onClick={() => openModal()} className="btn-primary flex items-center gap-2">
       <Plus size={18} />
       <span>Crear campaña</span>
     </button>
    </div>

    {/* Toolbar */}
    <div className="flex gap-4 items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted" size={16} />
        <input type="text" placeholder="Buscar campañas..." className="input-field pl-11 py-3" />
      </div>
      <div className={`flex p-1 rounded-xl ${dc ? 'bg-surface-raised border border-edge' : 'bg-surface border border-edge shadow-sm'}`}>
        <button className="px-5 py-2 text-xs font-bold rounded-lg bg-accent text-content">Todas</button>
        <button className="px-5 py-2 text-xs font-bold rounded-lg text-content-muted hover:text-content">Activas</button>
        <button className="px-5 py-2 text-xs font-bold rounded-lg text-content-muted hover:text-content">Borradores</button>
      </div>
    </div>

    {/* Campaigns Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {campaigns.map(c => (
       <div key={c.id} className="card-premium flex flex-col h-full hover:shadow-lg hover:border-accent/30 transition-all group">
         <div className={`p-6 border-b flex justify-between items-start transition-all ${dc ? 'border-edge bg-surface-raised/30' : 'border-edge-light bg-surface-inset/30'}`}>
          <div>
           <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-3 ${c.type === 'Envío masivo' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
             {c.type === 'Envío masivo' ? <Megaphone size={12} /> : <Clock size={12} />} {c.type}
           </div>
           <h3 className="text-lg font-bold text-content leading-tight group-hover:text-accent transition-colors">{c.name}</h3>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full mt-1 ${c.status === 'Activo' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} title={c.status}></div>
         </div>
         
         <div className="p-6 flex-1 space-y-4">
          <div className="flex items-start gap-3">
            <MessageSquare size={16} className="text-content-muted shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-content-secondary line-clamp-2">{c.message || 'Sin mensaje configurado'}</p>
          </div>
          <div className="flex items-center gap-3">
            <Users size={16} className="text-content-muted shrink-0" />
            <p className="text-sm font-medium text-content-secondary">{c.recipient_source === 'manual' ? 'Ingreso Manual' : \`CRM: \${c.db_filter}\`}</p>
          </div>
         </div>

         {c.status === 'Activo' && (
          <div className="px-6 pb-2">
           <div className="flex justify-between items-center mb-1">
             <span className="text-xs font-bold text-content-muted">Progreso</span>
             <span className="text-xs font-bold text-emerald-500">{c.progress}%</span>
           </div>
           <div className="w-full h-1.5 bg-slate-100 dark:bg-surface-raised rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500" style={{ width: `${c.progress}%` }}></div>
           </div>
          </div>
         )}

         <div className={`px-6 py-4 border-t flex justify-between items-center transition-all ${dc ? 'border-edge bg-surface-raised/30' : 'border-edge-light bg-surface-inset/30'}`}>
          <button onClick={() => deleteCampaign(c.id)} className="p-2 text-content-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
          <div className="flex gap-2">
           <button onClick={() => openModal(c)} className="px-4 py-2 text-xs font-bold rounded-lg border border-edge text-content hover:bg-surface-inset transition-colors">Editar</button>
           {c.status !== 'Activo' ? (
            <button onClick={() => startCampaignLive(c.id)} className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors flex items-center gap-1.5"><Play size={14} /> Iniciar</button>
           ) : (
            <button className="px-4 py-2 text-xs font-bold rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5"><Pause size={14} /> Pausar</button>
           )}
          </div>
         </div>
       </div>
      ))}
    </div>

    {/* Modal Windows para configuración individual */}
    {showModal && (
     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge'}`}>
       
       {/* Modal Header */}
       <div className={`px-8 py-5 border-b flex justify-between items-center transition-all ${dc ? 'border-edge bg-surface-raised/50' : 'border-edge-light bg-surface-inset/50'}`}>
        <div className="flex items-center gap-4 flex-1">
         <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dc ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'}`}>
          <Settings size={20} />
         </div>
         <input 
          type="text" 
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="text-xl font-bold bg-transparent border-none outline-none focus:ring-0 w-1/2 text-content"
         />
        </div>
        <button onClick={() => setShowModal(false)} className="p-2 text-content-muted hover:bg-surface-raised rounded-xl transition-all"><X size={20} /></button>
       </div>

       <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Modal Sidebar Tabs */}
        <div className={`w-full md:w-48 shrink-0 border-b md:border-b-0 md:border-r flex flex-row md:flex-col p-4 gap-2 overflow-x-auto custom-scrollbar transition-all ${dc ? 'border-edge bg-surface-raised/20' : 'border-edge-light bg-surface-inset/20'}`}>
         {[
          { id: 'mensaje', label: '1. Mensaje', icon: <MessageSquare size={16} /> },
          { id: 'audiencia', label: '2. Destinatarios', icon: <Users size={16} /> },
          { id: 'ajustes', label: '3. Seguridad', icon: <Shield size={16} /> }
         ].map(tab => (
          <button 
           key={tab.id}
           onClick={() => setActiveTab(tab.id)}
           className={`whitespace-nowrap flex-1 md:w-full flex items-center justify-center md:justify-start gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-accent text-content shadow-md shadow-accent/20' : 'text-content-muted hover:bg-surface-raised hover:text-content'}`}
          >
           {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
          </button>
         ))}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
         
         {activeTab === 'mensaje' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 animate-in slide-in-from-right duration-300">
           {/* Formulario */}
           <div className="space-y-8">
            <div>
             <label className="label-text mb-2 block">Tipo de Campaña</label>
             <div className="grid grid-cols-3 gap-3">
              {['Envío masivo', 'Seguimiento', 'Post venta'].map(t => (
               <button key={t} onClick={() => setFormData({...formData, type: t})} className={`p-3 rounded-xl border text-xs font-bold transition-all ${formData.type === t ? 'border-accent bg-accent/10 text-accent' : 'border-edge text-content-muted hover:border-content-muted'}`}>{t}</button>
              ))}
             </div>
            </div>

            <div>
             <div className="flex justify-between items-center mb-2">
              <label className="label-text">Contenido del Mensaje</label>
              <div className="flex items-center gap-2">
               <Bot size={14} className={formData.useAI ? 'text-accent' : 'text-content-muted'} />
               <button onClick={() => setFormData({...formData, useAI: !formData.useAI})} className={`w-8 h-4 rounded-full relative transition-all ${formData.useAI ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`w-2.5 h-2.5 rounded-full bg-surface absolute top-0.5 transition-all ${formData.useAI ? 'left-5' : 'left-0.5'}`}></div>
               </button>
               <span className="text-xs font-semibold text-content-muted">Modo IA</span>
              </div>
             </div>
             <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder={formData.useAI ? "Describe tu objetivo y la IA redactará..." : "Hola {{nombre}}, te escribo para..."}
              className="w-full h-40 p-5 rounded-xl border input-field resize-none"
             />
             <div className="flex items-center gap-2 mt-3">
              <span className="text-xs font-semibold text-content-muted mr-2">Variables:</span>
              {['{{nombre}}', '{{proyecto}}'].map(v => (
               <button key={v} onClick={() => setFormData(p => ({...p, message: p.message + ' ' + v}))} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-edge text-content hover:bg-surface-inset transition-colors">{v}</button>
              ))}
             </div>
            </div>

            <div>
             <label className="flex items-center justify-center gap-3 w-full py-6 border-2 border-dashed rounded-xl text-xs font-semibold uppercase tracking-normal transition-all cursor-pointer border-edge text-content-muted hover:border-accent hover:text-accent">
              <Paperclip size={18} /> Adjuntar imagen o archivo
              <input type="file" className="hidden" />
             </label>
            </div>
           </div>

           {/* Vista Previa */}
           <div className={`flex flex-col items-center justify-center p-6 rounded-2xl border ${dc ? 'bg-surface-raised/30 border-edge' : 'bg-surface-inset/30 border-edge-light'}`}>
            <p className="text-xs font-bold text-content-muted uppercase tracking-wider mb-4">Vista Previa</p>
            <div className="w-full max-w-[280px] bg-[#e5ddd5] dark:bg-[#0b141a] rounded-3xl overflow-hidden shadow-2xl border border-edge flex flex-col h-[400px] relative">
             {/* WA Header */}
             <div className="bg-[#008069] dark:bg-[#202c33] px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
               <Users size={16} />
              </div>
              <div className="flex flex-col">
               <span className="text-sm font-bold text-white">Lead de prueba</span>
               <span className="text-[10px] text-white/80">en línea</span>
              </div>
             </div>
             
             {/* WA Chat Body */}
             <div className="flex-1 p-4 overflow-y-auto" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundSize: '400px', opacity: dc ? 0.8 : 0.6 }}>
               <div className="bg-[#dcf8c6] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-lg rounded-tr-none p-3 mb-2 max-w-[90%] ml-auto text-[13px] shadow-sm relative isolate z-10">
                <p className="whitespace-pre-wrap break-words leading-relaxed">
                 {formData.message ? formData.message.replace(/{{nombre}}/g, 'Juan').replace(/{{proyecto}}/g, 'Residencial Altos') : 'El mensaje aparecerá aquí...'}
                </p>
                <span className="text-[10px] text-black/40 dark:text-white/40 float-right mt-1 ml-2">12:00</span>
               </div>
             </div>
            </div>
           </div>
          </div>
         )}

         {activeTab === 'audiencia' && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
           <div>
            <label className="label-text mb-4 block">Fuente de Destinatarios</label>
            <div className={`flex p-1.5 rounded-xl border border-edge bg-surface-inset inline-block`}>
             <button onClick={() => setFormData({...formData, recipientSource: 'database'})} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${formData.recipientSource === 'database' ? 'bg-accent text-content shadow-sm' : 'text-content-muted'}`}>Base de datos (CRM)</button>
             <button onClick={() => setFormData({...formData, recipientSource: 'manual'})} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${formData.recipientSource === 'manual' ? 'bg-accent text-content shadow-sm' : 'text-content-muted'}`}>Ingreso Manual</button>
            </div>
           </div>

           {formData.recipientSource === 'manual' ? (
            <div>
             <label className="label-text mb-2 block">Números de teléfono (uno por línea)</label>
             <textarea
              value={formData.manualRecipients}
              onChange={(e) => setFormData({...formData, manualRecipients: e.target.value})}
              placeholder="5215512345678&#10;5215598765432"
              className="w-full h-48 p-5 rounded-xl border input-field font-mono text-sm"
             />
            </div>
           ) : (
            <div className="space-y-6">
             <div>
              <label className="label-text mb-2 block">Filtro Inteligente</label>
              <select 
               value={formData.dbFilter} 
               onChange={(e) => setFormData({...formData, dbFilter: e.target.value})}
               className="w-full p-4 rounded-xl input-field text-sm font-bold"
              >
               <option value="todos">Todos los leads registrados</option>
               <option value="nuevo">Leads Nuevos (sin contactar)</option>
               <option value="interesado">Contactos Interesados</option>
               <option value="cerrado">Cierres Ganados</option>
              </select>
             </div>
             
             <div className="p-8 rounded-2xl border-2 border-dashed border-accent/20 bg-accent/5 flex flex-col items-center justify-center text-center">
              <Users size={32} className="text-accent mb-4" />
              <h4 className="text-lg font-bold text-content mb-1">Audiencia Calculada</h4>
              <p className="text-sm font-medium text-content-muted">Tu campaña será enviada a <span className="font-bold text-accent">142</span> contactos que coinciden con el filtro.</p>
             </div>
            </div>
           )}
          </div>
         )}

         {activeTab === 'ajustes' && (
          <div className="space-y-8 animate-in slide-in-from-right duration-300">
           <div className={`p-5 rounded-2xl flex items-start gap-4 ${dc ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
            <Shield size={24} className="shrink-0 mt-0.5" />
            <div>
             <h4 className="text-sm font-bold mb-1">Protección Anti-Ban Activada</h4>
             <p className="text-xs leading-relaxed font-medium">ChatPrex utilizará retrasos aleatorios entre mensajes para simular comportamiento humano y proteger tu número de bloqueos.</p>
            </div>
           </div>

           <div>
            <label className="label-text mb-4 block">Intervalo de Envío Dinámico (segundos)</label>
            <div className="flex items-center gap-4">
             <div className="flex-1">
              <label className="text-xs font-semibold text-content-muted block mb-2 text-center">Espera mínima</label>
              <input type="number" value={formData.minDelay} onChange={e => setFormData({...formData, minDelay: Number(e.target.value)})} className="w-full p-4 rounded-xl text-center font-bold input-field text-lg" />
             </div>
             <span className="text-content-muted mt-6">—</span>
             <div className="flex-1">
              <label className="text-xs font-semibold text-content-muted block mb-2 text-center">Espera máxima</label>
              <input type="number" value={formData.maxDelay} onChange={e => setFormData({...formData, maxDelay: Number(e.target.value)})} className="w-full p-4 rounded-xl text-center font-bold input-field text-lg" />
             </div>
            </div>
           </div>
          </div>
         )}
        </div>
       </div>

       {/* Modal Footer */}
       <div className={`px-8 py-5 border-t flex justify-end gap-3 transition-all ${dc ? 'border-edge bg-surface-raised/50' : 'border-edge-light bg-surface-inset/50'}`}>
        <button onClick={() => setShowModal(false)} className="px-6 py-2.5 text-sm font-bold rounded-xl border border-edge text-content hover:bg-surface-inset transition-colors">Cancelar</button>
        <button onClick={saveCampaign} className="px-8 py-2.5 text-sm font-bold rounded-xl bg-accent text-content shadow-lg shadow-accent/20 hover:bg-accent-dark transition-all">Guardar Campaña</button>
       </div>

      </div>
     </div>
    )}

   </div>
  </div>
 );
}
