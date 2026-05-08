import React, { useState } from 'react';
import { Play, Pause, AlertCircle, Settings, Users, MessageSquare, Clock, Bot, Plus, Trash2, Send, Paperclip, X, Workflow, Shield, Smartphone, CheckCheck, Database, FileText, Zap, Target, Megaphone } from 'lucide-react';
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
  const card = `rounded-[32px] border transition-all ${dc ? 'bg-[#1E1E1E] border-slate-800 shadow-none' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'}`;

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 transition-colors ${dc ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header con tabs integradas */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dc ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                <Megaphone size={28} />
             </div>
             <div>
                <h1 className={`text-2xl font-black tracking-tight lowercase ${dc ? 'text-white' : 'text-slate-800'}`}>Campañas de WhatsApp</h1>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-500">difusión inteligente</p>
             </div>
          </div>
          
          <div className={`flex p-1 rounded-2xl ${dc ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-md'}`}>
            {[
              { id: 'masivo', label: 'Envío Masivo' },
              { id: 'seguimiento', label: 'Seguimiento' },
              { id: 'postventa', label: 'Post Venta' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setCampaignType(tab.id)}
                className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${campaignType === tab.id ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="col-span-1 lg:col-span-2 space-y-10">
            
            {/* Estrategia */}
            <div className={card + ' overflow-hidden'}>
              <div className={`px-8 py-6 border-b transition-all ${dc ? 'border-slate-800 bg-slate-900/30' : 'border-slate-50 bg-slate-50/30'}`}>
                <h2 className={`text-sm font-black lowercase ${dc ? 'text-slate-100' : 'text-slate-800'}`}>Configurador de Envío</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">personaliza tu alcance</p>
              </div>
              <div className="p-8">
                <label className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-4 block">selecciona tu estrategia</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StrategyCard 
                    icon={<Zap size={20} />} 
                    title="Envío Rápido" 
                    desc="Noticias y avisos masivos"
                    active={strategy === 'fast'}
                    onClick={() => setStrategy('fast')}
                    isDarkMode={dc}
                  />
                  <StrategyCard 
                    icon={<Target size={20} />} 
                    title="IA Pro-Active" 
                    desc="Calificación inteligente"
                    active={strategy === 'ai'}
                    onClick={() => setStrategy('ai')}
                    isDarkMode={dc}
                  />
                </div>
              </div>
            </div>

            {/* Mensaje */}
            <div className={card + ' overflow-hidden'}>
              <div className={`px-8 py-6 border-b flex items-center justify-between transition-all ${dc ? 'border-slate-800 bg-slate-900/30' : 'border-slate-50 bg-slate-50/30'}`}>
                <h2 className={`text-sm font-black lowercase flex items-center gap-2 ${dc ? 'text-slate-200' : 'text-slate-800'}`}>
                  <MessageSquare size={18} className="text-primary" /> mensaje base
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Bot size={16} className={useAI ? 'text-primary' : 'text-slate-400'} />
                    <button 
                      onClick={() => setUseAI(!useAI)}
                      className={`w-10 h-5 rounded-full relative transition-all ${useAI ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                    >
                      <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-all ${useAI ? 'left-6' : 'left-1'}`}></div>
                    </button>
                  </div>
                  <button onClick={saveTemplate} className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-all">Guardar</button>
                </div>
              </div>
              <div className="p-8">
                <textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder={useAI ? "Describe tu objetivo y la IA redactará mensajes persuasivos..." : "Escribe tu mensaje... usa {{nombre}}"}
                  className={`w-full h-40 p-5 rounded-3xl text-[13px] font-bold outline-none transition-all resize-none ${dc ? 'bg-slate-900/50 border border-slate-800 text-white focus:border-primary' : 'bg-slate-50 border border-slate-100 text-slate-800 focus:border-primary focus:bg-white shadow-inner'}`}
                />
                
                <div className="flex flex-wrap items-center gap-2 mt-6">
                  {['{{nombre}}', '{{proyecto}}'].map(v => (
                    <button key={v} onClick={() => setMessageTemplate(p => p + ' ' + v)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${dc ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>+ {v}</button>
                  ))}
                  <div className="w-px h-4 bg-slate-200 mx-2"></div>
                  {['😊','👍','🔥','🏠','📅'].map(emoji => (
                    <button key={emoji} onClick={() => setMessageTemplate(p => p + emoji)} className="text-xl hover:scale-125 transition-transform">{emoji}</button>
                  ))}
                </div>

                {mediaName && (
                  <div className="mt-6 flex items-center gap-3 p-4 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
                    <Paperclip size={18} />
                    <span className="flex-1 text-[11px] font-black truncate lowercase">{mediaName}</span>
                    <button onClick={removeMedia} className="p-2 hover:bg-emerald-500/10 rounded-xl transition-all"><X size={18} /></button>
                  </div>
                )}
                
                {!mediaName && (
                  <div className="mt-6">
                    <input type="file" id="campaign-media" className="hidden" onChange={handleFileChange} />
                    <label htmlFor="campaign-media" className={`flex items-center justify-center gap-3 w-full py-4 border-2 border-dashed rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all cursor-pointer ${dc ? 'border-slate-800 text-slate-600 hover:border-primary hover:text-primary' : 'border-slate-100 text-slate-400 hover:border-primary hover:text-primary hover:bg-slate-50'}`}>
                      <Paperclip size={18} /> adjuntar multimedia
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Destinatarios */}
            <div className={card + ' overflow-hidden'}>
               <div className={`px-8 py-6 border-b flex items-center justify-between transition-all ${dc ? 'border-slate-800 bg-slate-900/30' : 'border-slate-50 bg-slate-50/30'}`}>
                 <h2 className={`text-sm font-black lowercase flex items-center gap-2 ${dc ? 'text-slate-200' : 'text-slate-800'}`}>
                   <Users size={18} className="text-primary" /> destinatarios
                 </h2>
                 <div className={`flex p-1 rounded-xl ${dc ? 'bg-slate-800' : 'bg-slate-100 shadow-inner'}`}>
                    <button onClick={() => setRecipientSource('database')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${recipientSource === 'database' ? 'bg-primary text-white shadow-md' : 'text-slate-500'}`}>CRM</button>
                    <button onClick={() => setRecipientSource('manual')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${recipientSource === 'manual' ? 'bg-primary text-white shadow-md' : 'text-slate-500'}`}>Manual</button>
                 </div>
               </div>
               <div className="p-8">
                  {recipientSource === 'manual' ? (
                    <textarea
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                      placeholder="5215512345678&#10;5215598765432"
                      className={`w-full h-32 p-5 rounded-2xl text-[11px] font-mono outline-none transition-all ${dc ? 'bg-slate-900 text-white border border-slate-800' : 'bg-slate-50 border border-slate-100 text-slate-800 shadow-inner'}`}
                    />
                  ) : (
                    <div className="space-y-6">
                       <select 
                         value={dbFilter} 
                         onChange={(e) => setDbFilter(e.target.value)}
                         className={`w-full p-4 rounded-2xl text-[12px] font-black lowercase outline-none border transition-all ${dc ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-700 shadow-sm'}`}
                       >
                         <option value="todos">Todos los Leads</option>
                         <option value="nuevo">Clientes Nuevos</option>
                         <option value="calificados">Solo Calificados</option>
                         <option value="cerrado">Cierre Ganado</option>
                       </select>
                       
                       <div className={`p-6 rounded-[24px] flex items-center justify-between transition-all ${dc ? 'bg-primary/5 border border-primary/10' : 'bg-primary/5 border border-primary/10'}`}>
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Users size={24} /></div>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contactos Seleccionados</p>
                                <p className="text-[11px] font-bold text-slate-400">según filtro actual</p>
                             </div>
                          </div>
                          <span className="text-3xl font-black text-primary">45</span>
                       </div>
                    </div>
                  )}
               </div>
            </div>

            <button 
              onClick={startCampaign}
              disabled={status === 'running' || !messageTemplate}
              className="w-full bg-primary text-white py-6 rounded-[28px] text-sm font-black uppercase tracking-[3px] shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {status === 'running' ? (
                <><RefreshCw size={20} className="animate-spin" /> procesando envío...</>
              ) : (
                <><Send size={20} /> iniciar campaña masiva</>
              )}
            </button>

          </div>

          <div className="col-span-1 space-y-10">
            {/* Preview WhatsApp */}
            <div className={card + ' overflow-hidden flex flex-col h-[500px]'}>
              <div className={`px-8 py-5 border-b transition-all ${dc ? 'bg-[#252525] border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                <h2 className="text-[11px] font-black uppercase tracking-[2px] text-slate-500 flex items-center gap-2">
                  <Smartphone size={16} /> vista previa
                </h2>
              </div>
              <div className="flex-1 bg-[#e5ddd5] p-6 relative overflow-y-auto" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain' }}>
                <div className="bg-[#d9fdd3] rounded-2xl p-3 shadow-xl max-w-[95%] ml-auto animate-in zoom-in-95 duration-300">
                  {media && mediaType === 'image' && <img src={`data:image/jpeg;base64,${media}`} className="rounded-xl mb-2 w-full object-cover max-h-40 shadow-sm" />}
                  <p className="text-[13px] leading-relaxed text-[#111b21] font-medium whitespace-pre-wrap">
                    {useAI ? <span className="italic text-emerald-600/80">✨ La IA generará un mensaje personalizado para Juan...</span> : (messageTemplate || 'Escribe algo...')}
                  </p>
                  <div className="text-[10px] text-right text-slate-400 mt-2 flex justify-end items-center gap-1">12:00 <CheckCheck size={14} className="text-[#53bdeb]" /></div>
                </div>
              </div>
            </div>

            {/* Seguridad */}
            <div className={card + ' p-8'}>
               <h2 className="text-sm font-black lowercase mb-6 flex items-center gap-2 ${dc ? 'text-slate-200' : 'text-slate-800'}">
                 <Shield size={20} className="text-emerald-500" /> Seguridad Anti-Ban
               </h2>
               <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">intervalo (segundos)</label>
                    <div className="flex items-center gap-4">
                       <input type="number" value={minDelay} onChange={e => setMinDelay(Number(e.target.value))} className={`w-full p-4 rounded-2xl text-center font-black ${dc ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`} />
                       <span className="text-slate-300 font-black">—</span>
                       <input type="number" value={maxDelay} onChange={e => setMaxDelay(Number(e.target.value))} className={`w-full p-4 rounded-2xl text-center font-black ${dc ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`} />
                    </div>
                  </div>
                  <div className={`p-4 rounded-2xl flex items-start gap-3 ${dc ? 'bg-emerald-500/5 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>
                     <AlertCircle size={18} className="shrink-0 mt-0.5" />
                     <p className="text-[10px] font-bold leading-tight">Recomendamos 15-45 segundos para envíos mayores a 50 contactos.</p>
                  </div>
               </div>
            </div>

            {/* Progreso */}
            {status !== 'idle' && (
              <div className={card + ' p-8 border-primary/20 animate-in slide-in-from-bottom duration-500'}>
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-[11px] font-black uppercase tracking-widest text-primary">Progreso en Vivo</h3>
                   <span className="text-lg font-black text-primary">{Math.round((progress.sent + progress.failed) / (progress.total || 1) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden mb-6">
                   <div className="bg-primary h-full transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.6)]" style={{ width: `${Math.round((progress.sent + progress.failed) / (progress.total || 1) * 100)}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="text-center p-4 rounded-2xl bg-emerald-500/5">
                      <p className="text-2xl font-black text-emerald-500">{progress.sent}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">enviados</p>
                   </div>
                   <div className="text-center p-4 rounded-2xl bg-rose-500/5">
                      <p className="text-2xl font-black text-rose-500">{progress.failed}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">error</p>
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
    className={`p-6 rounded-[28px] border text-left transition-all ${
      active 
        ? 'border-primary bg-primary/5 shadow-xl shadow-primary/10' 
        : (isDarkMode ? 'border-slate-800 bg-slate-900/30 hover:border-slate-700' : 'border-slate-100 bg-white hover:border-slate-200')
    }`}
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : (isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500')}`}>
      {icon}
    </div>
    <h3 className={`text-[13px] font-black lowercase mb-1 ${active ? (isDarkMode ? 'text-white' : 'text-slate-900') : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{title}</h3>
    <p className={`text-[10px] font-bold leading-tight ${active ? 'text-primary' : 'text-slate-500'}`}>{desc}</p>
  </button>
);
