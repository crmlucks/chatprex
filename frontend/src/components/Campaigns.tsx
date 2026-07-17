import React, { useState, useRef } from 'react';
import { Play, Pause, AlertCircle, Settings, Users, MessageSquare, Megaphone, Plus, Trash2, Send, Paperclip, X, Bot, Shield, CheckCircle2, Clock, Search, BarChart3, Upload, FileText, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePipeline } from '../hooks/usePipeline';
import { useToast } from './Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

 export default function Campaigns({ isDarkMode }: { isDarkMode?: boolean }) {
  const { token } = useAuth();
  const { showConfirm, showToast } = useToast();
  const pipelineHelpers = usePipeline();
 const [campaigns, setCampaigns] = useState<any[]>([]);
 const [showModal, setShowModal] = useState(false);
 const [activeTab, setActiveTab] = useState('mensaje');
 const [listTab, setListTab] = useState('Todas');
 const [editingCampaign, setEditingCampaign] = useState<any>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

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
  mediaName: '',
  mediaUrl: '' // For preview
 });

 const fetchCampaigns = async () => {
  try {
   const res = await fetch(`${API_URL}/api/campaigns`, {
    headers: { Authorization: `Bearer ${token}` }
   });
   if (res.ok) {
    const data = await res.json();
    setCampaigns(data);
   }
  } catch (err) {}
 };

 React.useEffect(() => {
  if (token) fetchCampaigns();
  const interval = setInterval(() => {
    if (campaigns.some(c => c.status === 'Activo')) fetchCampaigns();
  }, 10000);
  return () => clearInterval(interval);
 }, [token, campaigns.length]);

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onloadend = () => {
    setFormData(prev => ({ 
      ...prev, 
      mediaName: file.name,
      mediaUrl: reader.result as string 
    }));
  };
  reader.readAsDataURL(file);
 };

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
    mediaName: campaign.media_name || '',
    mediaUrl: campaign.media_url || ''
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
    mediaName: '',
    mediaUrl: ''
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
    status: editingCampaign ? editingCampaign.status : 'Borrador',
    media_url: formData.mediaUrl,
    media_name: formData.mediaName
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
  } catch (err) {}
 };

 const startCampaignLive = async (id: number) => {
  try {
   setCampaigns(campaigns.map(c => c.id === id ? { ...c, status: 'Activo', progress: 0 } : c));
   await fetch(`${API_URL}/api/campaigns/${id}/start`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
   });
  } catch (err) {}
 };

 const deleteCampaign = async (id: number) => {
  showConfirm("¿Estás seguro de eliminar esta campaña? Se borrará todo el registro asociado.", async () => {
   try {
    const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
     method: 'DELETE',
     headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
     fetchCampaigns();
     showToast('Campaña eliminada', 'success');
    }
   } catch (err) {}
  }, { confirmText: 'Eliminar', cancelText: 'Cancelar' });
 };

 const dc = isDarkMode;
 const inputClass = `input-field h-9 py-1 text-[11px]`;
 const labelClass = "text-[10px] font-bold text-content-muted mb-1 block ml-1 uppercase tracking-tight";

 return (
  <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-surface-base">
   <div className="max-w-7xl mx-auto space-y-6">
    
    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
     <div className="flex items-center gap-4">
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dc ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent border border-edge shadow-sm'}`}>
        <Megaphone size={20} />
       </div>
       <div>
        <h1 className="text-xl font-bold tracking-tight text-content">Campañas y Automatización</h1>
        <p className="text-[10px] font-bold text-content-muted uppercase tracking-wider">Envíos masivos y seguimientos</p>
       </div>
     </div>
     <button onClick={() => openModal()} className="btn-primary flex items-center gap-2 px-4 py-2 text-xs">
       <Plus size={16} />
       <span>Crear campaña</span>
     </button>
    </div>

    {/* Toolbar */}
    <div className="flex gap-3 items-center">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted" size={14} />
        <input type="text" placeholder="Buscar campañas..." className={`${inputClass} pl-10`} />
      </div>
       <div className={`flex p-1 rounded-xl ${dc ? 'bg-surface-raised border border-edge' : 'bg-white border border-edge shadow-sm'}`}>
         {['Todas', 'Activas', 'Seguimiento', 'Post Venta', 'Borradores'].map(t => (
           <button 
             key={t}
             onClick={() => setListTab(t)}
             className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${listTab === t ? 'bg-accent text-content shadow-sm' : 'text-content-muted hover:text-content'}`}
           >
             {t}
           </button>
         ))}
       </div>
    </div>

    {/* Campaigns Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {campaigns.filter(c => {
         if (listTab === 'Todas') return true;
         if (listTab === 'Activas') return c.status === 'Activo';
         if (listTab === 'Borradores') return c.status === 'Borrador';
         if (listTab === 'Seguimiento') return c.type === 'Seguimiento';
         if (listTab === 'Post Venta') return c.type === 'Post venta';
         return true;
       }).map(c => (
       <div key={c.id} className="card overflow-hidden flex flex-col h-full hover:shadow-lg transition-all group border-edge">
         <div className={`p-4 border-b flex justify-between items-start ${dc ? 'bg-surface-raised/30 border-edge' : 'bg-surface-inset/30 border-slate-100'}`}>
          <div>
           <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider mb-2 ${c.type === 'Envío masivo' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'}`}>
             {c.type === 'Envío masivo' ? <Megaphone size={10} /> : <Clock size={10} />} {c.type}
           </div>
           <h3 className="text-sm font-bold text-content leading-tight group-hover:text-accent transition-colors">{c.name}</h3>
          </div>
          <div className={`w-2 h-2 rounded-full mt-1 shadow-sm ${c.status === 'Activo' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} title={c.status}></div>
         </div>
         
         <div className="p-4 flex-1 space-y-3">
          <div className="flex items-start gap-2">
            <MessageSquare size={14} className="text-content-muted shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-content-secondary line-clamp-2">{c.message || 'Sin mensaje configurado'}</p>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} className="text-content-muted shrink-0" />
            <p className="text-[10px] font-bold text-content-secondary uppercase tracking-tight">{c.recipient_source === 'manual' ? 'Ingreso Manual' : `CRM: ${c.db_filter}`}</p>
          </div>
         </div>

         {c.status === 'Activo' && (
          <div className="px-4 pb-1">
           <div className="flex justify-between items-center mb-1">
             <span className="text-[9px] font-black text-content-muted uppercase">Progreso</span>
             <span className="text-[9px] font-black text-emerald-500">{c.progress}%</span>
           </div>
           <div className="w-full h-1 bg-surface-inset rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500" style={{ width: `${c.progress}%` }}></div>
           </div>
          </div>
         )}

         <div className={`px-4 py-3 border-t flex justify-between items-center ${dc ? 'bg-surface-raised/30 border-edge' : 'bg-surface-inset/30 border-slate-100'}`}>
          <button onClick={() => deleteCampaign(c.id)} className="p-2 text-content-muted hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
          <div className="flex gap-2">
           <button onClick={() => openModal(c)} className="px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border border-edge text-content hover:bg-surface-inset transition-colors">Editar</button>
           {c.status !== 'Activo' ? (
            <button onClick={() => startCampaignLive(c.id)} className="px-3 py-1.5 text-[10px] font-black uppercase rounded-lg bg-emerald-500 text-white shadow-sm flex items-center gap-1"><Play size={12} /> Iniciar</button>
           ) : (
            <button className="px-3 py-1.5 text-[10px] font-black uppercase rounded-lg bg-amber-500 text-white flex items-center gap-1"><Pause size={12} /> Pausar</button>
           )}
          </div>
         </div>
       </div>
      ))}
    </div>

    {/* Modal Windows */}
    {showModal && (
     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge'}`}>
       
       {/* Modal Header */}
       <div className={`px-6 py-4 border-b flex justify-between items-center ${dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset/50 border-slate-100'}`}>
        <div className="flex items-center gap-3 flex-1">
         <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${dc ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'}`}>
          <Settings size={18} />
         </div>
         <input 
          type="text" 
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          className="text-md font-bold bg-transparent border-none outline-none focus:ring-0 w-1/2 text-content"
         />
        </div>
        <button onClick={() => setShowModal(false)} className="p-2 text-content-muted hover:bg-surface-inset rounded-lg transition-all"><X size={18} /></button>
       </div>

       <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Modal Sidebar Tabs */}
        <div className={`w-full md:w-44 shrink-0 border-b md:border-b-0 md:border-r p-3 gap-1.5 flex flex-row md:flex-col ${dc ? 'bg-surface-raised/20 border-edge' : 'bg-surface-inset/20 border-slate-100'}`}>
         {[
          { id: 'mensaje', label: '1. MENSAJE', icon: <MessageSquare size={14} /> },
          { id: 'audiencia', label: '2. AUDIENCIA', icon: <Users size={14} /> },
          { id: 'ajustes', label: '3. AJUSTES', icon: <Shield size={14} /> }
         ].map(tab => (
          <button 
           key={tab.id}
           onClick={() => setActiveTab(tab.id)}
           className={`flex-1 md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeTab === tab.id ? 'bg-accent text-content shadow-lg shadow-accent/20' : 'text-content-muted hover:bg-surface-raised hover:text-content'}`}
          >
           {tab.icon} <span>{tab.label}</span>
          </button>
         ))}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-surface">
         
         {activeTab === 'mensaje' && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 animate-in slide-in-from-right duration-300">
           {/* Formulario */}
           <div className="space-y-5">
            <div>
             <label className={labelClass}>Tipo de Campaña</label>
             <div className="grid grid-cols-3 gap-2">
              {['Envío masivo', 'Seguimiento', 'Post venta'].map(t => (
               <button key={t} onClick={() => setFormData({...formData, type: t})} className={`py-2 rounded-lg border text-[10px] font-black uppercase transition-all ${formData.type === t ? 'border-accent bg-accent/10 text-accent' : 'border-edge text-content-muted hover:border-content-muted'}`}>{t}</button>
              ))}
             </div>
            </div>

            <div>
             <div className="flex justify-between items-center mb-1">
              <label className={labelClass}>Contenido del Mensaje</label>
              <div className="flex items-center gap-2">
               <Bot size={12} className={formData.useAI ? 'text-accent' : 'text-content-muted'} />
               <button onClick={() => setFormData({...formData, useAI: !formData.useAI})} className={`w-7 h-3.5 rounded-full relative transition-all ${formData.useAI ? 'bg-accent' : 'bg-slate-300'}`}>
                <div className={`w-2.5 h-2.5 rounded-full bg-white absolute top-0.5 transition-all ${formData.useAI ? 'left-4' : 'left-0.5'}`}></div>
               </button>
               <span className="text-[9px] font-black text-content-muted uppercase">Modo IA</span>
              </div>
             </div>
             <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              placeholder={formData.useAI ? "Describe tu objetivo y la IA redactará..." : "Hola {{nombre}}, te escribo para..."}
              className="w-full h-32 p-4 rounded-xl border input-field resize-none text-xs"
             />
             <div className="flex items-center gap-2 mt-2">
              <span className="text-[9px] font-black text-content-muted uppercase mr-1">Variables:</span>
              {['{{nombre}}', '{{proyecto}}'].map(v => (
               <button key={v} onClick={() => setFormData(p => ({...p, message: p.message + ' ' + v}))} className="px-2 py-1 rounded-md text-[10px] font-bold border border-edge text-content hover:bg-surface-inset transition-colors uppercase">{v}</button>
              ))}
             </div>
            </div>

            <div>
             <label className={labelClass}>Multimedia Adjunta</label>
             <div 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer border-edge text-content-muted hover:border-accent hover:text-accent bg-surface-inset"
             >
              {formData.mediaName ? (
                <div className="flex items-center gap-2 text-accent">
                  <CheckCircle2 size={16} />
                  <span>{formData.mediaName}</span>
                  <X size={14} className="ml-2 hover:text-rose-500" onClick={(e) => { e.stopPropagation(); setFormData({...formData, mediaName: '', mediaUrl: ''}) }} />
                </div>
              ) : (
                <>
                  <Paperclip size={16} /> 
                  <span>Adjuntar imagen o archivo</span>
                </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
             </div>
            </div>
           </div>

           {/* Vista Previa */}
           <div className={`flex flex-col items-center justify-center p-4 rounded-2xl border ${dc ? 'bg-surface-raised/30 border-edge' : 'bg-surface-inset/30 border-slate-100'}`}>
            <p className="text-[9px] font-black text-content-muted uppercase tracking-widest mb-3">Vista Previa WhatsApp</p>
            <div className="w-full max-w-[240px] bg-[#e5ddd5] dark:bg-[#0b141a] rounded-3xl overflow-hidden shadow-xl border border-edge flex flex-col h-[360px] relative">
             <div className="bg-[#008069] dark:bg-[#202c33] px-3 py-2 flex items-center gap-2 shrink-0">
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[8px] font-bold text-white uppercase">LP</div>
              <div className="flex flex-col">
               <span className="text-[10px] font-bold text-white leading-none">Lead de prueba</span>
               <span className="text-[8px] text-white/80">en línea</span>
              </div>
             </div>
             
             <div className="flex-1 p-3 overflow-y-auto" style={{ backgroundImage: 'url("https://web.whatsapp.com/img/bg-chat-tile-dark_a4be512e7195b6b733d9110b408f075d.png")', backgroundSize: '200px' }}>
                <div className="bg-[#dcf8c6] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-lg rounded-tr-none p-2 mb-2 max-w-[95%] ml-auto text-[11px] shadow-sm relative overflow-hidden">
                 {/* Preview Multimedia */}
                 {formData.mediaUrl && (
                    <div className="mb-2 -mx-2 -mt-2 rounded-t-lg overflow-hidden border-b border-black/5">
                      {(formData.mediaUrl.startsWith('data:image') || formData.mediaUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) ? (
                        <img src={formData.mediaUrl} className="w-full h-32 object-cover" alt="Preview" />
                      ) : (
                        <div className="bg-black/5 p-3 flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center text-accent">
                            <FileText size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="truncate text-[10px] font-bold text-content">{formData.mediaName || 'Archivo adjunto'}</p>
                            <p className="text-[8px] text-content-muted uppercase">Documento PDF / Archivo</p>
                          </div>
                        </div>
                      )}
                    </div>
                 )}
                 <p className="whitespace-pre-wrap break-words leading-tight">
                  {formData.message ? formData.message.replace(/{{nombre}}/g, 'Juan').replace(/{{proyecto}}/g, 'Residencial Altos') : 'Su mensaje...'}
                 </p>
                 <span className="text-[8px] text-black/40 dark:text-white/40 float-right mt-0.5 ml-2">12:00</span>
                </div>
             </div>
            </div>
           </div>
          </div>
         )}

         {activeTab === 'audiencia' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
           <div>
            <label className={labelClass}>Fuente de Destinatarios</label>
            <div className="flex p-1 rounded-xl border border-edge bg-surface-inset inline-flex">
             <button onClick={() => setFormData({...formData, recipientSource: 'database'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${formData.recipientSource === 'database' ? 'bg-accent text-content shadow-sm' : 'text-content-muted'}`}>CRM Base</button>
             <button onClick={() => setFormData({...formData, recipientSource: 'manual'})} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${formData.recipientSource === 'manual' ? 'bg-accent text-content shadow-sm' : 'text-content-muted'}`}>Manual</button>
            </div>
           </div>

           {formData.recipientSource === 'manual' ? (
            <div>
             <label className={labelClass}>Números (uno por línea)</label>
             <textarea
              value={formData.manualRecipients}
              onChange={(e) => setFormData({...formData, manualRecipients: e.target.value})}
              placeholder="5215512345678"
              className="w-full h-40 p-4 rounded-xl border input-field font-mono text-[11px]"
             />
            </div>
           ) : (
            <div className="space-y-4">
             <div>
              <label className={labelClass}>Filtro Inteligente</label>
              <select 
               value={formData.dbFilter} 
               onChange={(e) => setFormData({...formData, dbFilter: e.target.value})}
               className={`${inputClass} w-full font-bold`}
              >
               <option value="todos">Todos los leads registrados</option>
               {pipelineHelpers.stages.map(stage => (
                <option key={stage.id} value={stage.name}>Etapa: {stage.name}</option>
               ))}
              </select>
             </div>
             
             <div className="p-6 rounded-2xl border border-dashed border-accent/20 bg-accent/5 flex flex-col items-center text-center">
              <Users size={24} className="text-accent mb-2" />
              <h4 className="text-xs font-black text-content uppercase tracking-widest">Audiencia Estimada</h4>
              <p className="text-[10px] font-bold text-content-muted mt-1 uppercase tracking-tight">Aproximadamente <span className="text-accent">142</span> contactos</p>
             </div>
            </div>
           )}
          </div>
         )}

         {activeTab === 'ajustes' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-300">
           <div className={`p-4 rounded-2xl flex items-start gap-3 border ${dc ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
            <Shield size={20} className="shrink-0 mt-0.5" />
            <div>
             <h4 className="text-[11px] font-black uppercase tracking-tight">Protección Anti-Ban</h4>
             <p className="text-[10px] leading-relaxed font-bold opacity-80 uppercase tracking-tighter">Retrasos aleatorios activados para proteger tu número.</p>
            </div>
           </div>

           <div className="grid grid-cols-2 gap-4">
             <div>
              <label className={labelClass}>Espera Mínima (seg)</label>
              <input type="number" value={formData.minDelay} onChange={e => setFormData({...formData, minDelay: Number(e.target.value)})} className={`${inputClass} w-full text-center font-black text-sm`} />
             </div>
             <div>
              <label className={labelClass}>Espera Máxima (seg)</label>
              <input type="number" value={formData.maxDelay} onChange={e => setFormData({...formData, maxDelay: Number(e.target.value)})} className={`${inputClass} w-full text-center font-black text-sm`} />
             </div>
           </div>
          </div>
         )}
        </div>
       </div>

       {/* Modal Footer */}
       <div className={`px-6 py-4 border-t flex justify-end gap-2 ${dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset/50 border-slate-100'}`}>
        <button onClick={() => setShowModal(false)} className="px-4 py-2 text-[10px] font-black uppercase rounded-lg border border-edge text-content hover:bg-surface-inset transition-colors">Cancelar</button>
        <button onClick={saveCampaign} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg bg-accent text-content shadow-lg shadow-accent/20">Guardar Campaña</button>
       </div>

      </div>
     </div>
    )}

   </div>
  </div>
 );
}
