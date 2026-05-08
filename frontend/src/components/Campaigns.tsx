import React, { useState } from 'react';
import { Play, Pause, AlertCircle, Settings, Users, MessageSquare, Clock, Bot, Plus, Trash2, Send, Paperclip, X, Workflow, Shield, Smartphone, CheckCheck, Database, FileText, Zap, Target } from 'lucide-react';
import { io } from 'socket.io-client';

export default function Campaigns({ isDarkMode }: { isDarkMode?: boolean }) {
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
      // Simulando números desde la base de datos según el filtro
      recipientList = ['5215512345678', '5215598765432']; 
    }
    
    setStatus('running');
    setProgress({ total: recipientList.length, sent: 0, failed: 0 });

    // Connect to backend and start the process
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000'); // Conecta al backend mediante env
    
    socket.emit('start-campaign', {
      type: campaignType,
      template: messageTemplate,
      useAI,
      minDelay,
      maxDelay,
      recipients: recipientList,
      media,
      mediaType
    });

    socket.on('campaign-progress', (data) => {
      setProgress(data);
    });

    socket.on('campaign-completed', () => {
      setStatus('completed');
    });
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Campañas de WhatsApp</h1>
            <p className={`text-[12px] md:text-[13px] mt-1 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Crea y gestiona tus envíos masivos e inteligentes</p>
          </div>
          <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
            <button 
              onClick={() => { setCampaignType('masivo'); setDbFilter('todos'); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${campaignType === 'masivo' ? 'bg-primary text-white shadow-md' : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')}`}
            >
              Envío Masivo
            </button>
            <button 
              onClick={() => { setCampaignType('seguimiento'); setDbFilter('frios'); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${campaignType === 'seguimiento' ? 'bg-primary text-white shadow-md' : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')}`}
            >
              Seguimiento
            </button>
            <button 
              onClick={() => { setCampaignType('postventa'); setDbFilter('cumpleanos'); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${campaignType === 'postventa' ? 'bg-primary text-white shadow-md' : (isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800')}`}
            >
              Post Venta
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            
            <div className={`flex-1 rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`border-b p-4 md:p-6 transition-colors ${isDarkMode ? 'border-slate-800 bg-[#252525]' : 'border-slate-100 bg-slate-50'}`}>
                <h2 className={`text-[14px] md:text-[16px] font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>Configurador de Envío</h2>
                <p className="text-[11px] md:text-[12px] text-slate-500 mt-1 font-medium">Personaliza tu estrategia de comunicación</p>
              </div>
              <div className="p-6 space-y-4">
                <label className={`block text-[10px] font-bold tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>selecciona tu estrategia</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StrategyCard 
                    icon={<Zap size={18} />} 
                    title="Envío Rápido" 
                    desc="Para avisos urgentes o noticias"
                    active={strategy === 'fast'}
                    onClick={() => setStrategy('fast')}
                    isDarkMode={isDarkMode}
                  />
                  <StrategyCard 
                    icon={<Target size={18} />} 
                    title="Perfilado IA" 
                    desc="La IA califica antes de vender"
                    active={strategy === 'ai'}
                    onClick={() => setStrategy('ai')}
                    isDarkMode={isDarkMode}
                  />
                </div>
              </div>
            </div>

            <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3 transition-colors ${isDarkMode ? 'border-slate-800/50' : 'border-slate-100'}`}>
                <h2 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                  <MessageSquare size={18} className="text-primary" />
                  mensaje base
                </h2>
                <div className="flex items-center gap-3">
                  <select 
                    onChange={(e) => { if(e.target.value) setMessageTemplate(e.target.value); e.target.value = ''; }}
                    className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none cursor-pointer max-w-[120px] truncate"
                  >
                    <option value="">Plantillas...</option>
                    {savedTemplates.map((t, i) => <option key={i} value={t.text}>{t.name}</option>)}
                  </select>
                  <button onClick={saveTemplate} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded font-medium hover:bg-primary/20 transition-colors">
                    Guardar
                  </button>
                  <div className="w-px h-4 bg-slate-200"></div>
                  <label className="flex items-center gap-2 text-[13px] font-semibold text-slate-700 cursor-pointer">
                    <Bot size={16} className={useAI ? 'text-primary' : 'text-slate-400'} />
                    IA
                    <input 
                      type="checkbox" 
                      checked={useAI} 
                      onChange={(e) => setUseAI(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${useAI ? 'bg-primary' : 'bg-slate-300'}`}>
                      <div className={`w-2.5 h-2.5 rounded-full bg-white absolute top-[3px] transition-all ${useAI ? 'left-5' : 'left-[3px]'}`}></div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="p-6">
                <textarea
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  placeholder={useAI ? "Describe brevemente la oferta o la intención, y la IA redactará un mensaje persuasivo para cada contacto..." : "Escribe tu mensaje aquí. Puedes usar variables como {{nombre}}"}
                  className={`w-full h-32 p-3 border rounded-xl text-[12px] md:text-[13px] focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none font-medium ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-200 placeholder-slate-600 focus:border-primary' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-primary'}`}
                />
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <span className="text-xs text-slate-500 font-medium mr-1">Variables:</span>
                  <button onClick={() => setMessageTemplate(p => p + ' {{nombre}}')} className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-medium transition-colors">
                    + {'{{nombre}}'}
                  </button>
                  <button onClick={() => setMessageTemplate(p => p + ' {{proyecto}}')} className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-md font-medium transition-colors">
                    + {'{{proyecto}}'}
                  </button>
                  <div className="w-px h-4 bg-slate-200 mx-1"></div>
                  <span className="text-xs text-slate-500 font-medium mr-1">Emojis:</span>
                  {['😊','👍','🎉','🔥','❤️','🏠','📅','🎁','👋'].map(emoji => (
                    <button key={emoji} onClick={() => setMessageTemplate(p => p + emoji)} className="text-base hover:scale-125 transition-transform">
                      {emoji}
                    </button>
                  ))}
                </div>
                {mediaName && (
                  <div className="mt-3 flex items-center gap-2 p-2 bg-emerald-50 text-emerald-700 text-sm rounded border border-emerald-100">
                    <Paperclip size={16} />
                    <span className="flex-1 truncate">{mediaName}</span>
                    <button onClick={removeMedia} className="p-1 hover:bg-emerald-100 rounded text-emerald-800 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                )}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <input type="file" id="campaign-media" className="hidden" onChange={handleFileChange} />
                  <label htmlFor="campaign-media" className="flex items-center justify-center gap-2 w-full py-2 bg-slate-50 border border-slate-200 border-dashed rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-primary transition-colors cursor-pointer">
                    <Paperclip size={18} />
                    {mediaName ? 'Cambiar archivo multimedia' : 'Adjuntar archivo multimedia (Imagen, Video, Documento)'}
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Users size={18} className="text-primary" />
                  destinatarios
                </h2>
                <div className="flex bg-slate-100 rounded-lg p-1">
                  <button 
                    onClick={() => setRecipientSource('database')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${recipientSource === 'database' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Database size={14} /> base de datos
                  </button>
                  <button 
                    onClick={() => setRecipientSource('manual')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${recipientSource === 'manual' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <FileText size={14} /> manual
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recipientSource === 'manual' ? (
                  <>
                    <p className="text-xs text-slate-500 mb-3">Pega la lista de números (uno por línea), incluyendo código de país (ej. 5215512345678)</p>
                    <textarea
                      value={recipients}
                      onChange={(e) => setRecipients(e.target.value)}
                      placeholder="5215512345678\n5215598765432"
                      className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none font-mono"
                    />
                    <div className="mt-3 text-sm text-slate-600 font-medium">
                      Total detectados: <span className="text-primary">{recipients.split('\n').filter(r => r.trim() !== '').length}</span>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600 mb-2">Selecciona a quién deseas enviar esta campaña desde tu CRM.</p>
                    
                    {campaignType === 'postventa' ? (
                      <div className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3">
                          <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-amber-800">Estrategia Largo Plazo (Exclusivo Clientes)</p>
                            <p className="text-xs text-amber-700 mt-1 font-medium">Recomendación: Enviar 1 mensaje mensual o quincenal máximo para evitar saturar al cliente y mantener una relación saludable.</p>
                          </div>
                        </div>
                        <label className={`text-xs font-bold mb-1 block tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>motivo de postventa</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: 'cumpleanos', label: 'Cumpleaños' },
                            { id: 'aniversario', label: 'Aniversario de Compra' },
                            { id: 'referidos', label: 'Campaña de Referidos' },
                            { id: 'nuevas_etapas', label: 'Nuevas Etapas/Proyectos' }
                          ].map(f => (
                            <button
                              key={f.id}
                              onClick={() => setDbFilter(f.id)}
                              className={`p-3 text-left border rounded-lg text-sm transition-colors ${dbFilter === f.id ? 'border-primary bg-primary/5 text-primary font-medium' : (isDarkMode ? 'border-slate-700 hover:border-slate-600 text-slate-300' : 'border-slate-200 hover:border-slate-300 text-slate-600')}`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : campaignType === 'seguimiento' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <label className="text-xs font-bold text-slate-500 col-span-2 mb-1 tracking-wider">estrategia de seguimiento (calentar leads)</label>
                        {[
                          { id: 'frios', label: 'Leads Fríos (>30 días)' },
                          { id: 'sin_respuesta', label: 'Sin respuesta a cotización' },
                          { id: 'cita_cancelada', label: 'Cita Cancelada/Reprogramar' },
                          { id: 'indecisos', label: 'Indecisos (Interés Medio)' }
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setDbFilter(f.id)}
                            className={`p-3 text-left border rounded-lg text-sm transition-colors ${dbFilter === f.id ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-2 tracking-wider">filtrar por etapa del pipeline (masivo)</label>
                        <select 
                          value={dbFilter} 
                          onChange={(e) => setDbFilter(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="todos">Todos los Leads (Calificados y Nuevos)</option>
                          <option value="nuevo">Clientes Nuevos</option>
                          <option value="contactado">Leads Contactados</option>
                          <option value="cita">Cita Programada</option>
                          <option value="negociacion">En Negociación</option>
                          <option value="calificados">Solo Leads Calificados (Cita + Negociación)</option>
                          <option value="cerrado">Cierre Ganado</option>
                        </select>
                      </div>
                    )}

                    <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                          <Users size={20} />
                        </div>
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Contactos encontrados</p>
                          <p className="text-xs text-slate-500">Según tu base de datos actual</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-primary">
                        {dbFilter === 'cumpleanos' ? 12 : dbFilter === 'nuevo' ? 24 : dbFilter === 'calificados' ? 8 : 45}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* BUTTON START CAMPAIGN */}
            <div className="flex justify-end">
              <button 
                onClick={startCampaign}
                disabled={status === 'running' || !messageTemplate}
                className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-3.5 rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {status === 'running' ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Enviando...</>
                ) : (
                  <><Send size={18} /> Iniciar Campaña</>
                )}
              </button>
            </div>

          </div>

          <div className="col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Smartphone size={18} className="text-primary" />
                  Vista Previa
                </h2>
              </div>
              <div className="bg-[#e5ddd5] p-4 flex-1 relative" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain' }}>
                <div className="bg-[#d9fdd3] rounded-lg p-2 shadow-sm max-w-[90%] ml-auto relative">
                  {media && mediaType === 'image' && (
                    <div className="mb-2 rounded-md overflow-hidden bg-black/5">
                      <img src={`data:image/jpeg;base64,${media}`} alt="Media" className="w-full h-auto object-cover max-h-48" />
                    </div>
                  )}
                  {media && mediaType === 'video' && (
                    <div className="mb-2 rounded-md overflow-hidden bg-black/5 flex items-center justify-center h-32 relative border border-black/10">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 bg-white/80 rounded-full flex items-center justify-center text-slate-800 shadow">
                          <Play size={20} className="ml-1" />
                        </div>
                      </div>
                      <span className="text-xs font-medium text-slate-500 absolute bottom-2 left-2 bg-white/90 px-1.5 py-0.5 rounded shadow-sm">{mediaName}</span>
                    </div>
                  )}
                  {media && mediaType === 'audio' && (
                    <div className="mb-2 rounded-full bg-black/5 px-3 py-2 flex items-center gap-3">
                       <Play size={20} className="text-slate-600 shrink-0" />
                       <div className="h-1 bg-slate-300 flex-1 rounded-full"><div className="w-1/3 h-full bg-slate-500 rounded-full"></div></div>
                    </div>
                  )}
                  {media && mediaType === 'document' && (
                    <div className="mb-2 rounded-md bg-black/5 p-3 flex items-center gap-3 border border-black/10">
                      <div className="w-10 h-10 bg-rose-500 rounded flex items-center justify-center text-white shrink-0">
                        <Paperclip size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{mediaName}</p>
                        <p className="text-xs text-slate-500 uppercase">Documento</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-[14.5px] leading-relaxed text-[#111b21] whitespace-pre-wrap break-words font-sans">
                    {useAI ? (
                      <span className="italic text-slate-600/80">✨ La IA redactará un copy persuasivo individual basado en: "{messageTemplate || '...'}"</span>
                    ) : (
                      (messageTemplate || 'Escribe un mensaje para ver la vista previa...').replace(/{{nombre}}/g, 'Juan').replace(/{{proyecto}}/g, 'Proyecto Esmeralda')
                    )}
                  </div>
                  
                  <div className="text-[11px] text-right text-slate-500 mt-1 flex justify-end items-center gap-1">
                    12:00 <CheckCheck size={14} className="text-[#53bdeb]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-emerald-50/50">
                <h2 className="font-semibold text-emerald-800 flex items-center gap-2">
                  <Shield size={18} className="text-emerald-600" />
                  Seguridad Anti-Bloqueo
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">Intervalo aleatorio entre mensajes (Segundos)</p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Mínimo</label>
                    <input type="number" value={minDelay} onChange={(e) => setMinDelay(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center" />
                  </div>
                  <div className="text-slate-400 mt-5">-</div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-1 block">Máximo</label>
                    <input type="number" value={maxDelay} onChange={(e) => setMaxDelay(Number(e.target.value))} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <Clock size={18} className="text-primary" />
                  Estado de Envío
                </h2>
              </div>
              <div className="p-6">
                {(status === 'running' || status === 'completed') && (
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Progreso</span>
                      <span className="font-medium text-slate-800">{Math.round((progress.sent + progress.failed) / (progress.total || 1) * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all duration-500" style={{ width: `${Math.round((progress.sent + progress.failed) / (progress.total || 1) * 100)}%` }}></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-slate-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-emerald-600">{progress.sent}</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Enviados</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-rose-500">{progress.failed}</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Fallidos</div>
                      </div>
                    </div>
                    {status === 'running' && (
                      <button onClick={() => setStatus('paused')} className="w-full py-2 bg-amber-100 text-amber-700 rounded-lg font-medium text-sm flex items-center justify-center gap-2 hover:bg-amber-200 transition-colors">
                        <Pause size={16} /> Pausar Envío
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const StrategyCard = ({ icon, title, desc, active, onClick, isDarkMode }: any) => (
  <button 
    onClick={onClick}
    className={`flex-1 p-4 rounded-xl border text-left transition-all ${
      active 
        ? 'border-primary bg-primary/5 ring-1 ring-primary' 
        : (isDarkMode ? 'border-slate-800 bg-slate-800/30 hover:border-slate-700' : 'border-slate-200 bg-white hover:border-slate-300')
    }`}
  >
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-colors ${active ? 'bg-primary text-white' : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
      {icon}
    </div>
    <h3 className={`text-sm font-bold mb-1 ${active ? (isDarkMode ? 'text-white' : 'text-slate-900') : (isDarkMode ? 'text-slate-300' : 'text-slate-700')}`}>{title}</h3>
    <p className={`text-[11px] leading-tight font-medium ${active ? (isDarkMode ? 'text-primary/70' : 'text-primary/70') : 'text-slate-500'}`}>{desc}</p>
  </button>
);


