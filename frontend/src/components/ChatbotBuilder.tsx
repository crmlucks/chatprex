import React, { useState, useEffect, useRef } from 'react';
import { Bot, Save, Play, Settings, RefreshCw, FileText, Key, Send, CheckCircle2, AlertTriangle, Loader2, Trash2, X, Mic, Network, MessageSquare, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const PROVIDER_MODELS: Record<string, string[]> = {
  'OpenAI': ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
  'Gemini': ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  'Groq': ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  'DeepSeek': ['deepseek-chat', 'deepseek-reasoner'],
};

const DEFAULT_PROMPT = `Eres Laura, la asesora virtual del proyecto 'Torre Esmeralda'. Tu objetivo principal es perfilar al cliente, responder sus dudas sobre los apartamentos y lograr agendar una cita.

Reglas:
1. Sé muy amable y persuasiva.
2. Responde corto (máximo 2 párrafos).
3. Si te preguntan por precios, diles que empiezan desde $120,000 USD y pregúntales su presupuesto.
4. Si alguien pide hablar con un humano, despídete y avisa que un agente se conectará enseguida.`;

const ChatbotBuilder = ({ isDarkMode }: { isDarkMode?: boolean }) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('prompt');
  const [bots, setBots] = useState<any[]>([]);
  const [selectedBotId, setSelectedBotId] = useState<number>(1);
  const [botName, setBotName] = useState('Bot principal');
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');

  // Config state
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [provider, setProvider] = useState('OpenAI');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [safeApiKey, setSafeApiKey] = useState('');
  const [knowledge, setKnowledge] = useState('');

  // Behavior toggles
  const [voiceToText, setVoiceToText] = useState(true);
  const [messageGrouping, setMessageGrouping] = useState(true);
  const [humanizedSplit, setHumanizedSplit] = useState(true);
  const [humanHandoff, setHumanHandoff] = useState(true);
  const [activationKeywords, setActivationKeywords] = useState('info,precio,quiero,asesor,comprar');

  // Simulator
  const [simMessages, setSimMessages] = useState<{role: string; text: string; time: string}[]>([]);
  const [simInput, setSimInput] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const simEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    simEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [simMessages]);

  useEffect(() => {
    if (bots.length > 0) {
      const selected = bots.find(b => b.id === selectedBotId) || bots[0];
      setSelectedBotId(selected.id);
      setBotName(selected.name || 'Nuevo bot');
      setPrompt(selected.prompt || DEFAULT_PROMPT);
      setProvider(selected.provider || 'OpenAI');
      setModel(selected.model || 'gpt-4o-mini');
      setHasApiKey(selected.hasApiKey || false);
      setSafeApiKey(selected.safeApiKey || '');
      setKnowledge(selected.knowledge || '');
      setVoiceToText(selected.voiceToText !== false);
      setMessageGrouping(selected.messageGrouping !== false);
      setHumanizedSplit(selected.humanizedSplit !== false);
      setHumanHandoff(selected.humanHandoff !== false);
      setActivationKeywords(selected.activationKeywords || 'info,precio,quiero,asesor,comprar');
      setApiKey('');
    }
  }, [selectedBotId, bots]);

  const loadConfig = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ai-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBots(data);
          if (data.length > 0 && !bots.length) setSelectedBotId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Error loading AI config:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setSaveMsg('');
    try {
      const body: any = {
        id: selectedBotId === -1 ? null : selectedBotId,
        name: botName,
        provider,
        model,
        prompt,
        api_key: apiKey || 'UNCHANGED',
        knowledge,
        voiceToText,
        messageGrouping,
        humanizedSplit,
        humanHandoff,
        activationKeywords,
      };
      const res = await fetch(`${API_URL}/api/ai-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setSaveMsg('✅ Configuración guardada correctamente');
        loadConfig(); 
      } else {
        setSaveMsg('❌ Error al guardar');
      }
    } catch {
      setSaveMsg('❌ Error de conexión');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const testConnection = async () => {
    setSaveMsg('⏳ Probando conexión...');
    try {
      const res = await fetch(`${API_URL}/api/ai-config/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ provider, model, api_key: apiKey || 'UNCHANGED' }),
      });
      const data = await res.json();
      setSaveMsg(data.success ? '✅ Conexión exitosa con IA' : `❌ ${data.error || 'Error de conexión'}`);
    } catch {
      setSaveMsg('❌ No se pudo conectar');
    }
    setTimeout(() => setSaveMsg(''), 4000);
  };

  const sendSimMessage = async () => {
    if (!simInput.trim() || simLoading) return;
    const userMsg = simInput.trim();
    setSimInput('');
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSimMessages(prev => [...prev, { role: 'user', text: userMsg, time: now }]);
    setSimLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai-config/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: userMsg, prompt, provider, model, api_key: apiKey || 'UNCHANGED', knowledge }),
      });
      const data = await res.json();
      const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setSimMessages(prev => [...prev, { role: 'assistant', text: data.reply || 'Sin respuesta', time: aiTime }]);
    } catch {
      setSimMessages(prev => [...prev, { role: 'assistant', text: '❌ Error al conectar con la IA', time: now }]);
    } finally {
      setSimLoading(false);
    }
  };

  const dc = isDarkMode;
  const inputCls = `w-full border rounded-xl px-4 py-3 text-sm font-bold transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 ${dc ? 'bg-slate-900 border-slate-700 text-white focus:border-primary' : 'bg-white border-slate-200 text-slate-800 focus:border-primary shadow-sm'}`;
  const labelCls = `block text-[11px] font-bold text-slate-500 mb-2 ml-1`;
  const cardCls = `flex items-center justify-between p-5 border rounded-2xl transition-all ${dc ? 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/60' : 'bg-white border-slate-100 hover:shadow-md'}`;

  if (loading) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center ${dc ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
        <div className="relative">
           <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
           <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" size={24} />
        </div>
        <p className="mt-4 text-xs font-bold uppercase tracking-widest text-slate-500 animate-pulse">Iniciando asistente...</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 flex flex-col lg:flex-row gap-8 transition-colors ${dc ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      
      {/* 1. Sidebar: Lista de bots */}
      <div className={`w-full lg:w-80 shrink-0 card-premium flex flex-col overflow-hidden`}>
        <div className={`p-6 border-b flex justify-between items-center transition-colors ${dc ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-50'}`}>
          <div className="flex items-center gap-2">
             <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(25,118,210,0.5)] animate-pulse"></div>
             <h2 className="h3">Asistentes IA</h2>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${dc ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{bots.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {bots.map(b => (
            <button key={b.id} onClick={() => setSelectedBotId(b.id)}
              className={`w-full text-left px-4 py-4 rounded-2xl flex items-center gap-4 transition-all active:scale-[0.98] group ${selectedBotId === b.id ? 'bg-primary text-white shadow-xl shadow-primary/20' : (dc ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700 shadow-sm border border-slate-50 hover:border-slate-100')}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selectedBotId === b.id ? 'bg-white/20 text-white' : (dc ? 'bg-slate-800 text-primary' : 'bg-slate-100 text-primary')}`}>
                 <Bot size={20} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className={`text-sm font-bold truncate ${selectedBotId === b.id ? 'text-white' : (dc ? 'text-slate-100' : 'text-slate-800')}`}>{b.name}</p>
                <p className={`text-[10px] font-medium truncate opacity-70`}>{b.provider} • {b.model}</p>
              </div>
            </button>
          ))}
        </div>
        <div className={`p-4 border-t transition-colors ${dc ? 'border-slate-800' : 'border-slate-100'}`}>
          <button onClick={() => {
            const newId = Date.now();
            setSelectedBotId(newId);
            setBots([...bots, { id: newId, name: 'Nueva campaña', provider: 'OpenAI', model: 'gpt-4o-mini', prompt: DEFAULT_PROMPT, activationKeywords: 'info,precio' }]);
          }} className="w-full py-3 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-lg active:scale-95">
            + Nuevo asistente
          </button>
        </div>
      </div>

      {/* 2. Main Area: Editor */}
      <div className="flex-1 card-premium flex flex-col transition-all overflow-hidden animate-in fade-in duration-500">
        
        {/* Editor Header */}
        <div className={`p-8 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-colors ${dc ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-50'}`}>
          <div className="flex-1 w-full">
            <div className="flex items-center gap-4 mb-2">
              <Bot className="text-primary shrink-0" size={32} />
              <input type="text" value={botName} onChange={e => setBotName(e.target.value)}
                className={`text-2xl font-bold bg-transparent border-none focus:ring-0 w-full transition-all tracking-tight ${dc ? 'text-white' : 'text-slate-800'}`} />
            </div>
            <p className="body-text mt-1">Configuración y personalidad del asistente virtual</p>
          </div>
          <div className="flex gap-3 shrink-0">
             <span className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold shadow-sm ${hasApiKey ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
                {hasApiKey ? 'Motor activo' : 'Modo simulado'}
             </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={`flex px-8 border-b overflow-x-auto custom-scrollbar transition-colors ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100'}`}>
          {[
            { id: 'prompt', label: 'Personalidad', icon: <MessageSquare size={14} /> },
            { id: 'brain', label: 'Motor IA', icon: <Settings size={14} /> },
            { id: 'knowledge', label: 'Conocimiento', icon: <FileText size={14} /> },
            { id: 'settings', label: 'Ajustes pro', icon: <Zap size={14} /> },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`py-5 px-6 text-xs font-bold transition-all relative whitespace-nowrap flex items-center gap-2 ${activeTab === t.id ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}>
              {t.icon} {t.label}
              {activeTab === t.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-8 md:p-10 overflow-y-auto custom-scrollbar">
          {activeTab === 'prompt' && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                   <h3 className="h3">Instrucciones de comportamiento</h3>
                   <p className="body-text">Define la voz, tono y reglas de interacción del bot.</p>
                </div>
                <button onClick={() => setPrompt(DEFAULT_PROMPT)} className="text-[11px] font-bold text-primary flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 hover:bg-primary/10 transition-all">
                   <RefreshCw size={14} /> Restaurar plantilla
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className={`w-full h-80 p-8 rounded-3xl border text-sm font-medium focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none leading-relaxed ${dc ? 'bg-slate-900/50 border-slate-800 text-slate-300 focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-700 focus:border-primary shadow-inner'}`}
                placeholder="Ej: Eres Laura, una vendedora experta en bienes raíces..."
              />
              <div className={`p-6 rounded-2xl border flex gap-4 ${dc ? 'bg-blue-500/5 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                 <AlertTriangle size={20} className="shrink-0" />
                 <p className="text-xs font-medium leading-relaxed">Tip: Incluya reglas de respuesta corta y un llamado a la acción claro para maximizar las conversiones de sus leads.</p>
              </div>
            </div>
          )}

          {activeTab === 'brain' && (
            <div className="space-y-10 animate-in slide-in-from-right duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className={labelCls}>Proveedor tecnológico</label>
                  <select value={provider} onChange={e => { setProvider(e.target.value); setModel(PROVIDER_MODELS[e.target.value][0]); }} className={inputCls}>
                    {Object.keys(PROVIDER_MODELS).map(p => <option key={p} value={p}>{p}{p === 'OpenAI' ? ' (Recomendado)' : ''}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelCls}>Modelo de razonamiento</label>
                  <select value={model} onChange={e => setModel(e.target.value)} className={inputCls}>
                    {(PROVIDER_MODELS[provider] || []).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelCls}>Clave de acceso (API Key)</label>
                <div className="relative group">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder={hasApiKey ? `Clave actual: ${safeApiKey}` : 'sk-pro-xxxxxxxx'}
                    className={`w-full pl-12 pr-4 py-4 rounded-2xl border text-sm font-mono outline-none transition-all focus:ring-4 focus:ring-primary/10 ${dc ? 'bg-slate-900 border-slate-800 text-white focus:border-primary' : 'bg-white border-slate-200 text-slate-800 focus:border-primary shadow-sm'}`}
                  />
                  <Key size={20} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${dc ? 'text-slate-600 group-focus-within:text-primary' : 'text-slate-400 group-focus-within:text-primary'}`} />
                </div>
                <div className="flex justify-between items-center px-1">
                   <p className={`text-[11px] font-bold ${hasApiKey ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {hasApiKey ? '✓ Conexión establecida y segura' : '⚠ Se requiere una clave para habilitar el bot real'}
                   </p>
                   <button onClick={testConnection} className="text-[11px] font-bold text-primary hover:underline underline-offset-4 transition-all">Probar conexión ahora</button>
                </div>
              </div>

              <div className={`p-8 rounded-[40px] border flex flex-col items-center text-center gap-4 transition-all ${dc ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                 <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-inner ${dc ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}><RefreshCw size={32} /></div>
                 <div>
                    <h4 className="h3">Sincronización en la nube</h4>
                    <p className="body-text max-w-sm mx-auto">ChatPrex sincroniza sus cambios instantáneamente en todos sus servidores de comunicación vinculados.</p>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
               <div className={`p-8 rounded-3xl border-2 border-dashed flex flex-col items-center text-center gap-4 ${dc ? 'bg-primary/5 border-primary/20 text-primary/70' : 'bg-primary/5 border-primary/20 text-primary'}`}>
                 <div className="flex items-center gap-3">
                    <FileText size={24} />
                    <h3 className="h3">Base de conocimiento</h3>
                 </div>
                 <p className="body-text max-w-md">La IA consultará esta información antes de responder. Inserte catálogos, listas de precios, manuales o preguntas frecuentes del proyecto.</p>
               </div>

               <div className="space-y-2">
                  <label className={labelCls}>Contexto detallado del proyecto</label>
                  <textarea
                    value={knowledge}
                    onChange={e => setKnowledge(e.target.value)}
                    placeholder={`Proyecto: Edificio Mirador\nPrecios: Desde $80,000 USD\nEntrega: Inmediata\nCuota Inicial: 20%\n...`}
                    className={`w-full h-80 p-8 rounded-3xl border text-sm font-medium outline-none transition-all resize-none leading-relaxed ${dc ? 'bg-slate-900/50 border-slate-800 text-slate-300 focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-700 focus:border-primary shadow-inner'}`}
                  />
               </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4 animate-in slide-in-from-right duration-300">
              {[
                { label: 'Transcripción de audios', desc: 'Convierte notas de voz a texto y las procesa con IA.', val: voiceToText, set: setVoiceToText, icon: <Mic size={18} /> },
                { label: 'Agrupación inteligente', desc: 'Agrupa mensajes consecutivos en una sola respuesta.', val: messageGrouping, set: setMessageGrouping, icon: <Network size={18} /> },
                { label: 'Escritura humanizada', desc: 'Simula el tiempo de escritura y envía mensajes fragmentados.', val: humanizedSplit, set: setHumanizedSplit, icon: <RefreshCw size={18} /> },
                { label: 'Intervención de agente', desc: 'Pausa el bot si el cliente solicita hablar con un humano.', val: humanHandoff, set: setHumanHandoff, icon: <Bot size={18} /> },
              ].map((item, i) => (
                <div key={i} className={cardCls}>
                  <div className="flex items-center gap-5 pr-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${dc ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                       {item.icon}
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold ${dc ? 'text-slate-100' : 'text-slate-800'}`}>{item.label}</h4>
                      <p className="body-text text-xs mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={item.val} onChange={() => item.set(!item.val)} />
                    <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-slate-800 dark:after:border-slate-600"></div>
                  </label>
                </div>
              ))}
              <div className={`${cardCls} flex-col items-start gap-4`}>
                 <div className="w-full">
                    <h4 className={`text-sm font-bold ${dc ? 'text-slate-100' : 'text-slate-800'}`}>Palabras clave de activación</h4>
                    <p className="body-text text-xs mb-4">El bot se activará al detectar estos términos en el chat.</p>
                    <input 
                      type="text" 
                      value={activationKeywords} 
                      onChange={e => setActivationKeywords(e.target.value)} 
                      placeholder="info, precio, agenda, cita..."
                      className={`w-full p-4 rounded-2xl border text-sm font-medium outline-none transition-all ${dc ? 'bg-slate-900 border-slate-800 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary shadow-inner'}`}
                    />
                 </div>
              </div>
            </div>
          )}
        </div>

        {/* Editor Footer */}
        <div className={`p-8 border-t flex flex-col sm:flex-row items-center justify-between gap-6 transition-colors ${dc ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-50'}`}>
          <div className="flex items-center gap-3">
             {saveMsg && (
               <div className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-[11px] font-bold animate-in fade-in slide-in-from-left duration-300 ${saveMsg.includes('✅') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                  {saveMsg.includes('✅') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />} {saveMsg}
               </div>
             )}
          </div>
          <button onClick={saveConfig} disabled={saving}
            className="w-full sm:w-auto btn-primary flex items-center justify-center gap-3 disabled:opacity-50">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
            <span>Publicar asistente</span>
          </button>
        </div>
      </div>

      {/* 3. Simulator Panel */}
      <div className={`w-full lg:w-96 rounded-[40px] border shadow-2xl flex flex-col overflow-hidden shrink-0 transition-all ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`p-6 border-b flex justify-between items-center transition-colors ${dc ? 'bg-slate-900' : 'bg-slate-900'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-primary"><Play size={20} /></div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-widest">Simulador en vivo</p>
              <p className="text-[10px] font-medium text-slate-400">Entorno seguro de pruebas</p>
            </div>
          </div>
          <button onClick={() => setSimMessages([])} className="text-slate-400 hover:text-white transition-all active:rotate-180 duration-500"><RefreshCw size={18} /></button>
        </div>

        <div className={`flex-1 p-6 flex flex-col gap-5 overflow-y-auto custom-scrollbar min-h-[400px] transition-colors ${dc ? 'bg-[#0f0f0f]' : 'bg-[#efeae2]'}`}
          style={!dc ? { backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px', opacity: 0.8 } : {}}>
          {simMessages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-6 animate-in fade-in duration-1000">
              <div className="w-20 h-20 rounded-full bg-slate-800/10 border-2 border-dashed border-slate-500/20 flex items-center justify-center"><Bot size={32} className="text-slate-400 opacity-20" /></div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inicie una prueba</p>
              <p className="body-text text-xs italic">Salude al bot para ver cómo interactúa con las reglas definidas.</p>
            </div>
          )}
          {simMessages.map((msg, i) => (
            <div key={i} className={`${msg.role === 'user' ? 'self-end' : 'self-start'} p-4 rounded-[22px] text-xs max-w-[85%] shadow-xl animate-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : (dc ? 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700' : 'bg-white text-slate-800 rounded-tl-none')}`}>
              <p className="font-medium leading-relaxed">{msg.text}</p>
              <span className={`text-[9px] block text-right mt-2 font-bold opacity-60`}>{msg.time}</span>
            </div>
          ))}
          {simLoading && (
            <div className={`self-start p-4 rounded-[22px] rounded-tl-none shadow-xl flex gap-1.5 ${dc ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          <div ref={simEndRef} />
        </div>

        <div className={`p-5 border-t flex gap-4 transition-colors ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'}`}>
          <div className={`flex-1 flex items-center px-5 py-3.5 rounded-2xl border transition-all ${dc ? 'bg-slate-900 border-slate-700 focus-within:border-primary' : 'bg-slate-50 border-slate-100 focus-within:border-primary focus-within:bg-white'}`}>
            <input
              type="text"
              value={simInput}
              onChange={e => setSimInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendSimMessage()}
              placeholder="Escriba un mensaje..."
              className="w-full bg-transparent text-xs font-bold outline-none placeholder-slate-500"
            />
          </div>
          <button onClick={sendSimMessage} disabled={simLoading}
            className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0 hover:bg-primary-dark transition-all active:scale-90 shadow-lg shadow-primary/30 disabled:opacity-50">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotBuilder;
