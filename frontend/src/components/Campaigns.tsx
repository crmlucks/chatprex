import React, { useState } from 'react';
import { Play, Pause, AlertCircle, Settings, Users, MessageSquare, Clock, Bot, Plus, Trash2, Send, Paperclip, X, Workflow, Shield, Smartphone, CheckCheck, Database, FileText, Zap, Target, Megaphone, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

export default function Campaigns({ isDarkMode }: { isDarkMode?: boolean }) {
 const { token } = useAuth();
 const [campaignType, setCampaignType] = useState('masivo'); // masivo, seguimiento, postventa
 const [messageTemplate, setMessageTemplate] = useState('');
 const [useAI, setUseAI] = useState(false);
 const [minDelay, setMinDelay] = useState(5);
 const [maxDelay, setMaxDelay] = useState(20);
 const [recipients, setRecipients] = useState('');
 const [status, setStatus] = useState('idle'); // idle, running, paused, completed
 const [progress, setProgress] = useState({ total: 0, sent: 0, failed: 0 });
 const [recipientSource, setRecipientSource] = useState<'manual' | 'database'>('database');
 const [dbFilter, setDbFilter] = useState<string>('todos');
 const [media, setMedia] = useState<string | null>(null);
 const [mediaType, setMediaType] = useState<string>('image');
 const [mediaName, setMediaName] = useState<string>('');
 const [strategy, setStrategy] = useState('fast'); // fast, ai
 const [savedTemplates, setSavedTemplates] = useState<{name: string, text: string}[]>(() => {
  try { return JSON.parse(localStorage.getItem('whatsapp_templates') || '[]'); } catch { return []; }
 });

 const saveTemplate = () => {
  if (!messageTemplate) return;
  const name = prompt("Nombre de la plantilla:");
  if (!name) return;
  const newTemplates = [...savedTemplates, { name, text: messageTemplate }];
  setSavedTemplates(newTemplates);
  localStorage.setItem('whatsapp_templates', JSON.stringify(newTemplates));
 };

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setMediaName(file.name);
  let type = 'document';
  if (file.type.startsWith('image/')) type = 'image';
  else if (file.type.startsWith('video/')) type = 'video';
  else if (file.type.startsWith('audio/')) type = 'audio';
  setMediaType(type);
  const reader = new FileReader();
  reader.onloadend = () => {
   const base64 = reader.result?.toString().split(',')[1] || '';
   setMedia(base64);
  };
  reader.readAsDataURL(file);
 };

 const removeMedia = () => {
  setMedia(null);
  setMediaName('');
  setMediaType('image');
 };

 const startCampaign = () => {
  let recipientList: string[] = [];
  if (recipientSource === 'manual') {
   if (!messageTemplate || !recipients) return;
   recipientList = recipients.split('\n').filter(r => r.trim() !== '');
  } else {
   if (!messageTemplate) return;
   recipientList = ['5215512345678', '5215598765432']; 
  }
  setStatus('running');
  setProgress({ total: recipientList.length, sent: 0, failed: 0 });
  const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', { auth: { token } });
  socket.emit('start-campaign', { type: campaignType, template: messageTemplate, useAI, minDelay, maxDelay, recipients: recipientList, media, mediaType });
  socket.on('campaign-progress', (data) => setProgress(data));
  socket.on('campaign-completed', () => setStatus('completed'));
 };

 const dc = isDarkMode;

 return (
  <div className={`flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 transition-colors ${dc ? 'bg-surface-base' : 'bg-surface-base'}`}>
   <div className="max-w-6xl mx-auto space-y-10">
    
    {/* Header con tabs integradas */}
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
     <div className="flex items-center gap-4">
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${dc ? 'bg-accent/20 text-accent' : 'bg-surface text-accent border border-edge'}`}>
        <Megaphone size={28} />
       </div>
       <div>
        <h1 className="h1">Campañas de WhatsApp</h1>
        <p className="body-text text-xs uppercase tracking-normal font-bold opacity-60">Difusión inteligente y masiva</p>
       </div>
     </div>
     
     <div className={`flex p-1 rounded-2xl ${dc ? 'bg-surface-raised border border-edge' : 'bg-surface border border-edge shadow-md'}`}>
      {[
       { id: 'masivo', label: 'Envío masivo' },
       { id: 'seguimiento', label: 'Seguimiento' },
       { id: 'postventa', label: 'Post venta' }
      ].map(tab => (
       <button 
        key={tab.id}
        onClick={() => setCampaignType(tab.id)}
        className={`px-6 py-2.5 text-xs font-semibold uppercase tracking-normal rounded-xl transition-all ${campaignType === tab.id ? 'bg-accent text-content shadow-lg' : 'text-content-muted hover:text-content-secondary'}`}
       >
        {tab.label}
       </button>
      ))}
     </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
     <div className="col-span-1 lg:col-span-2 space-y-10">
      
      {/* Estrategia */}
      <div className="card-premium overflow-hidden">
       <div className={`px-8 py-6 border-b transition-all ${dc ? 'border-edge bg-surface-raised/30' : 'border-edge-light bg-surface-inset/30'}`}>
        <h2 className="h3">Configurador de envío</h2>
        <p className="body-text text-xs uppercase tracking-normal font-bold opacity-60">Personaliza tu alcance y estrategia</p>
       </div>
       <div className="p-8">
        <label className="label-text mb-4 block">Selecciona tu estrategia</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <StrategyCard 
          icon={<Zap size={20} />} 
          title="Envío rápido" 
          desc="Noticias y avisos masivos directos"
          active={strategy === 'fast'}
          onClick={() => setStrategy('fast')}
          isDarkMode={dc}
         />
         <StrategyCard 
          icon={<Target size={20} />} 
          title="IA pro-active" 
          desc="Calificación inteligente por lead"
          active={strategy === 'ai'}
          onClick={() => setStrategy('ai')}
          isDarkMode={dc}
         />
        </div>
       </div>
      </div>

      {/* Mensaje */}
      <div className="card-premium overflow-hidden">
       <div className={`px-8 py-6 border-b flex items-center justify-between transition-all ${dc ? 'border-edge bg-surface-raised/30' : 'border-edge-light bg-surface-inset/30'}`}>
        <h2 className="h3 flex items-center gap-2">
         <MessageSquare size={18} className="text-accent" /> Mensaje base
        </h2>
        <div className="flex items-center gap-4">
         <div className="flex items-center gap-2">
          <Bot size={16} className={useAI ? 'text-accent' : 'text-content-muted'} />
          <button 
           onClick={() => setUseAI(!useAI)}
           className={`w-10 h-5 rounded-full relative transition-all ${useAI ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-700'}`}
          >
           <div className={`w-3 h-3 rounded-full bg-surface absolute top-1 transition-all ${useAI ? 'left-6' : 'left-1'}`}></div>
          </button>
         </div>
         <button onClick={saveTemplate} className="text-xs font-semibold uppercase tracking-normal text-accent hover:bg-accent/10 px-3 py-1.5 rounded-lg transition-all">Guardar plantilla</button>
        </div>
       </div>
       <div className="p-8">
        <textarea
         value={messageTemplate}
         onChange={(e) => setMessageTemplate(e.target.value)}
         placeholder={useAI ? "Describe tu objetivo y la IA redactará mensajes persuasivos..." : "Escribe tu mensaje... usa {{nombre}}"}
         className={`w-full h-40 p-6 rounded-xl text-sm font-medium outline-none transition-all resize-none ${dc ? 'bg-surface-raised/50 border border-edge text-content focus:border-accent' : 'bg-surface-inset border border-edge text-content focus:border-accent focus:bg-surface '}`}
        />
        
        <div className="flex flex-wrap items-center gap-2 mt-6">
         {['{{nombre}}', '{{proyecto}}'].map(v => (
          <button key={v} onClick={() => setMessageTemplate(p => p + ' ' + v)} className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-normal transition-all ${dc ? 'bg-surface-raised text-content-muted hover:text-content' : 'bg-surface border border-edge text-content-muted hover:bg-surface-inset shadow-sm'}`}>+ {v}</button>
         ))}
         <div className="w-px h-4 bg-slate-200 mx-2"></div>
         {['😊','👍','🔥','🏠','📅'].map(emoji => (
          <button key={emoji} onClick={() => setMessageTemplate(p => p + emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
         ))}
        </div>

        {mediaName && (
         <div className="mt-6 flex items-center gap-3 p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
          <Paperclip size={18} />
          <span className="flex-1 text-xs font-bold truncate">{mediaName}</span>
          <button onClick={removeMedia} className="p-2 hover:bg-emerald-500/10 rounded-xl transition-all"><X size={18} /></button>
         </div>
        )}
        
        {!mediaName && (
         <div className="mt-6">
          <input type="file" id="campaign-media" className="hidden" onChange={handleFileChange} />
          <label htmlFor="campaign-media" className={`flex items-center justify-center gap-3 w-full py-5 border-2 border-dashed rounded-xl text-xs font-semibold uppercase tracking-normal transition-all cursor-pointer ${dc ? 'border-edge text-content-secondary hover:border-accent hover:text-accent' : 'border-edge text-content-muted hover:border-accent hover:text-accent hover:bg-surface-inset'}`}>
           <Paperclip size={18} /> Adjuntar archivo multimedia
          </label>
         </div>
        )}
       </div>
      </div>

      {/* Destinatarios */}
      <div className="card-premium overflow-hidden">
        <div className={`px-8 py-6 border-b flex items-center justify-between transition-all ${dc ? 'border-edge bg-surface-raised/30' : 'border-edge-light bg-surface-inset/30'}`}>
         <h2 className="h3 flex items-center gap-2">
          <Users size={18} className="text-accent" /> Destinatarios
         </h2>
         <div className={`flex p-1 rounded-xl ${dc ? 'bg-surface-raised' : 'bg-slate-100 '}`}>
          <button onClick={() => setRecipientSource('database')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-normal transition-all ${recipientSource === 'database' ? 'bg-accent text-content shadow-md' : 'text-content-muted'}`}>CRM</button>
          <button onClick={() => setRecipientSource('manual')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-normal transition-all ${recipientSource === 'manual' ? 'bg-accent text-content shadow-md' : 'text-content-muted'}`}>Manual</button>
         </div>
        </div>
        <div className="p-8">
         {recipientSource === 'manual' ? (
          <textarea
           value={recipients}
           onChange={(e) => setRecipients(e.target.value)}
           placeholder="5215512345678&#10;5215598765432"
           className={`w-full h-32 p-5 rounded-2xl text-xs font-mono outline-none transition-all ${dc ? 'bg-surface-raised text-content border border-edge' : 'bg-surface-inset border border-edge text-content '}`}
          />
         ) : (
          <div className="space-y-6">
            <select 
             value={dbFilter} 
             onChange={(e) => setDbFilter(e.target.value)}
             className={`w-full p-4 rounded-2xl text-sm font-bold outline-none border transition-all ${dc ? 'bg-surface-raised border-edge text-content' : 'bg-surface-inset border-edge text-content-secondary shadow-sm'}`}
            >
             <option value="todos">Todos los leads</option>
             <option value="nuevo">Clientes nuevos</option>
             <option value="calificados">Solo calificados</option>
             <option value="cerrado">Cierre ganado</option>
            </select>
            
            <div className={`p-6 rounded-xl flex items-center justify-between transition-all ${dc ? 'bg-accent/5 border border-accent/10' : 'bg-accent/5 border border-accent/10 shadow-sm'}`}>
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Users size={24} /></div>
               <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-content-muted">Contactos seleccionados</p>
                <p className="text-xs font-bold text-content-muted">Según el filtro actual del CRM</p>
               </div>
             </div>
             <span className="text-3xl font-semibold text-accent">45</span>
            </div>
          </div>
         )}
        </div>
      </div>

      <button 
       onClick={startCampaign}
       disabled={status === 'running' || !messageTemplate}
       className="w-full bg-accent text-content py-6 rounded-xl text-sm font-semibold uppercase tracking-normal shadow-sm shadow-accent/30 hover:bg-accent-dark transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
      >
       {status === 'running' ? (
        <><RefreshCw size={20} className="animate-spin" /> Procesando envío...</>
       ) : (
        <><Send size={20} /> Iniciar campaña masiva</>
       )}
      </button>

     </div>

     <div className="col-span-1 space-y-10">
      {/* Preview WhatsApp */}
      <div className="card-premium overflow-hidden flex flex-col h-[500px]">
       <div className={`px-8 py-5 border-b transition-all ${dc ? 'bg-[#252525] border-edge' : 'bg-surface-inset/50 border-edge'}`}>
        <h2 className="text-xs font-semibold uppercase tracking-normal text-content-muted flex items-center gap-2">
         <Smartphone size={16} /> Vista previa
        </h2>
       </div>
       <div className="flex-1 bg-[#e5ddd5] p-6 relative overflow-y-auto" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain' }}>
        <div className="bg-[#d9fdd3] rounded-2xl p-4 shadow-sm max-w-[95%] ml-auto border border-black/5">
         {media && mediaType === 'image' && <img src={`data:image/jpeg;base64,${media}`} className="rounded-xl mb-3 w-full object-cover max-h-40 shadow-sm border border-black/5" />}
         <p className="text-sm leading-relaxed text-[#111b21] font-medium whitespace-pre-wrap">
          {useAI ? <span className="italic text-emerald-600/80">✨ La IA generará un mensaje personalizado para Juan...</span> : (messageTemplate || 'Escribe algo...')}
         </p>
         <div className="text-xs text-right text-content-muted mt-2 flex justify-end items-center gap-1">12:00 <CheckCheck size={14} className="text-[#53bdeb]" /></div>
        </div>
       </div>
      </div>

      {/* Seguridad */}
      <div className="card-premium p-8">
        <h2 className="h3 mb-6 flex items-center gap-2">
         <Shield size={20} className="text-emerald-500" /> Seguridad anti-ban
        </h2>
        <div className="space-y-6">
         <div>
          <label className="label-text mb-3 block">Intervalo de envío (segundos)</label>
          <div className="flex items-center gap-4">
            <input type="number" value={minDelay} onChange={e => setMinDelay(Number(e.target.value))} className={`w-full p-4 rounded-2xl text-center font-semibold outline-none border transition-all focus:border-accent ${dc ? 'bg-surface-raised text-content border-edge' : 'bg-surface-inset text-content border-edge'}`} />
            <span className="text-content-secondary font-semibold">—</span>
            <input type="number" value={maxDelay} onChange={e => setMaxDelay(Number(e.target.value))} className={`w-full p-4 rounded-2xl text-center font-semibold outline-none border transition-all focus:border-accent ${dc ? 'bg-surface-raised text-content border-edge' : 'bg-surface-inset text-content border-edge'}`} />
          </div>
         </div>
         <div className={`p-4 rounded-2xl flex items-start gap-3 ${dc ? 'bg-emerald-500/5 text-emerald-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
           <AlertCircle size={18} className="shrink-0 mt-0.5" />
           <p className="text-xs font-bold leading-tight uppercase tracking-wider opacity-80">Recomendamos 15-45 seg para envíos mayores a 50 contactos.</p>
         </div>
        </div>
      </div>

      {/* Progreso */}
      {status !== 'idle' && (
       <div className="card-premium p-8 border-accent/20 animate-in slide-in-from-bottom duration-500">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xs font-semibold uppercase tracking-normal text-accent">Progreso en vivo</h3>
          <span className="text-lg font-semibold text-accent">{Math.round((progress.sent + progress.failed) / (progress.total || 1) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-surface-raised h-3 rounded-full overflow-hidden mb-6">
          <div className="bg-accent h-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.6)]" style={{ width: `${Math.round((progress.sent + progress.failed) / (progress.total || 1) * 100)}%` }} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-2xl bg-emerald-500/5">
           <p className="text-2xl font-semibold text-emerald-500">{progress.sent}</p>
           <p className="text-xs font-semibold uppercase tracking-normal text-content-muted">Enviados</p>
          </div>
          <div className="text-center p-4 rounded-2xl bg-rose-500/5">
           <p className="text-2xl font-semibold text-rose-500">{progress.failed}</p>
           <p className="text-xs font-semibold uppercase tracking-normal text-content-muted">Error</p>
          </div>
        </div>
       </div>
      )}

     </div>
    </div>
   </div>
  </div>
 );
}

const StrategyCard = ({ icon, title, desc, active, onClick, isDarkMode }: any) => (
 <button 
  onClick={onClick}
  className={`p-6 rounded-xl border text-left transition-all active:scale-[0.98] ${
 active 
 ? 'border-accent bg-accent/5 shadow-sm shadow-accent/10' 
 : (isDarkMode ? 'border-edge bg-surface-raised/30 hover:border-edge' : 'border-edge bg-surface hover:border-edge shadow-sm')
 }`}
 >
  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all shadow-md ${active ? 'bg-accent text-content shadow-lg shadow-accent/20' : (isDarkMode ? 'bg-surface-raised text-content-muted' : 'bg-surface-inset text-content-muted')}`}>
   {icon}
  </div>
  <h3 className={`text-sm font-bold mb-1 tracking-tight ${active ? (isDarkMode ? 'text-content' : 'text-content') : (isDarkMode ? 'text-content-secondary' : 'text-content-secondary')}`}>{title}</h3>
  <p className={`text-xs font-medium leading-tight ${active ? 'text-accent' : 'text-content-muted'}`}>{desc}</p>
 </button>
);
