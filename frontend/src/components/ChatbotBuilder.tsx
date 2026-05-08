import React, { useState, useEffect, useRef } from 'react';
import { Bot, Save, UploadCloud, MessageSquare, Play, Settings, RefreshCw, FileText, Key, Send, CheckCircle2, AlertTriangle, Loader2, Trash2, X } from 'lucide-react';
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
  const [botName, setBotName] = useState('Bot Principal');
  
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
      setBotName(selected.name || 'Nuevo Bot');
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
        loadConfig(); // Recargar para actualizar ID si era nuevo
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

  // Simulator: send message to AI
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

  const inputCls = `w-full border rounded-lg px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`;
  const labelCls = `block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`;
  const cardCls = `flex items-center justify-between p-4 border rounded-xl ${isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`;

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 flex flex-col md:flex-row gap-6 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      
      {/* Columna de Bots */}
      <div className={`w-full md:w-64 shrink-0 rounded-2xl border shadow-sm flex flex-col overflow-hidden transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex justify-between items-center transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
          <h2 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Tus Campañas IA</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {bots.map(b => (
            <button key={b.id} onClick={() => setSelectedBotId(b.id)}
              className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 transition-all ${selectedBotId === b.id ? 'bg-primary/10 text-primary' : (isDarkMode ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}>
              <Bot size={18} className={selectedBotId === b.id ? 'text-primary' : (isDarkMode ? 'text-slate-500' : 'text-slate-400')} />
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold truncate">{b.name}</p>
                <p className="text-[10px] truncate opacity-70">Keywords: {b.activationKeywords}</p>
              </div>
            </button>
          ))}
        </div>
        <div className={`p-3 border-t transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <button onClick={() => {
            setSelectedBotId(-1);
            setBots([...bots, { id: -1, name: 'Nueva Campaña', provider: 'OpenAI', model: 'gpt-4o-mini', prompt: DEFAULT_PROMPT, activationKeywords: '' }]);
          }} className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition-all">
            + Nuevo Bot
          </button>
        </div>
      </div>

      {/* Left Column: Configuration */}
      <div className={`flex-1 rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`border-b p-4 md:p-6 flex justify-between items-center transition-colors ${isDarkMode ? 'border-slate-800/50 bg-[#252525]' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex-1 mr-4">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="text-primary shrink-0" size={24} />
              <input type="text" value={botName} onChange={e => setBotName(e.target.value)}
                className={`text-[18px] md:text-[20px] font-bold bg-transparent border-b border-transparent focus:border-primary focus:outline-none w-full ${isDarkMode ? 'text-white' : 'text-slate-800'}`} />
            </div>
            <p className={`text-[12px] md:text-[13px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Configura el comportamiento y la base de conocimiento</p>
          </div>
          <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            {hasApiKey ? 'En línea' : 'Sin API Key'}
          </span>
        </div>

        {/* Tabs */}
        <div className={`flex px-6 border-b overflow-x-auto transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          {[
            { id: 'prompt', label: 'Personalidad (Prompt)' },
            { id: 'brain', label: 'Motor IA (Cerebro)' },
            { id: 'knowledge', label: 'Base de Conocimiento' },
            { id: 'settings', label: 'Comportamiento' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`py-4 px-4 font-bold text-[12px] md:text-[13px] border-b-2 transition-all whitespace-nowrap ${activeTab === t.id ? 'border-primary text-primary' : (isDarkMode ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-500 hover:text-slate-800')}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={`flex-1 p-6 overflow-y-auto transition-colors ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-2">
                <label className={`block text-[13px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Instrucciones Principales del Bot</label>
                <button onClick={() => setPrompt(DEFAULT_PROMPT)} className="text-[11px] text-primary font-bold flex items-center gap-1 hover:underline"><RefreshCw size={12} /> Cargar Plantilla Inmobiliaria</button>
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                className={`w-full h-48 md:h-64 border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed transition-all resize-none ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300 focus:border-primary' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-primary'}`}
              />
              <p className="text-[10px] font-medium text-slate-500">Esta es la orden directa (System Prompt) que se le enviará a la inteligencia artificial para darle un rol.</p>
            </div>
          )}

          {activeTab === 'brain' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className={`p-4 border rounded-xl ${isDarkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                <h4 className={`text-[14px] font-bold mb-1 flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  <Bot size={18} /> Cerebro de Inteligencia Artificial
                </h4>
                <p className={`text-[12px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Elige qué proveedor y modelo de IA impulsará a tu asistente virtual.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Proveedor de IA</label>
                  <select value={provider} onChange={e => { setProvider(e.target.value); setModel(PROVIDER_MODELS[e.target.value][0]); }} className={inputCls}>
                    {Object.keys(PROVIDER_MODELS).map(p => <option key={p} value={p}>{p}{p === 'OpenAI' ? ' (Recomendado)' : p === 'Groq' ? ' (Ultra-rápido)' : p === 'DeepSeek' ? ' (Económico)' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Modelo Específico</label>
                  <select value={model} onChange={e => setModel(e.target.value)} className={inputCls}>
                    {(PROVIDER_MODELS[provider] || []).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>API Key del Proveedor</label>
                <div className="relative">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder={hasApiKey ? `Clave actual: ${safeApiKey} (dejar vacío para mantener)` : 'sk-...'}
                    className={`w-full border rounded-lg pl-10 pr-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                  <Key size={18} className={`absolute left-3 top-3.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                {hasApiKey && <p className="text-[11px] mt-2 font-medium text-emerald-500">✓ API Key configurada ({safeApiKey})</p>}
                {!hasApiKey && <p className="text-[11px] mt-2 font-medium text-amber-500">⚠ Sin API Key — el bot usará respuestas simuladas</p>}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <button onClick={testConnection} className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 active:scale-95 shadow-sm">
                  <RefreshCw size={16} /> Probar Conexión con IA
                </button>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              <div className={`p-4 border rounded-xl ${isDarkMode ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-100'}`}>
                <h4 className={`text-[14px] font-bold mb-1 flex items-center gap-2 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                  <FileText size={18} /> Base de Conocimiento
                </h4>
                <p className={`text-[12px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Escribe aquí toda la información que el bot debe conocer: precios, amenidades, ubicación, disponibilidad, políticas, etc. Esta información se inyecta automáticamente en cada conversación.
                </p>
              </div>

              <div>
                <label className={labelCls}>Información del Proyecto / Producto</label>
                <textarea
                  value={knowledge}
                  onChange={e => setKnowledge(e.target.value)}
                  placeholder={`Ejemplo:\n\nProyecto: Torre Esmeralda\nUbicación: Av. Principal 123, Zona Exclusiva\nPrecios: Desde $120,000 USD (1 hab) hasta $350,000 USD (3 hab)\nAmenidades: Piscina infinity, gym, coworking, rooftop bar\nEntrega: Diciembre 2027\nFormas de pago: 30% enganche, 70% crédito bancario\nContacto: agendar cita en oficina de ventas`}
                  className={`w-full h-64 border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed transition-all resize-none ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                />
                <p className="text-[10px] font-medium text-slate-500 mt-2">El bot combinará estas instrucciones con el prompt para dar respuestas precisas sobre tu proyecto.</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-4">
              {[
                { label: 'Escucha Activa de Audios (Voz a Texto)', desc: 'Si el cliente envía nota de voz, la IA la descarga, la transcribe a texto y la responde.', val: voiceToText, set: setVoiceToText },
                { label: 'Agrupación de Mensajes (Ventana de 12s)', desc: 'El bot espera 12 segundos para juntar todos los mensajes del cliente y responde al contexto completo.', val: messageGrouping, set: setMessageGrouping },
                { label: 'Respuestas Humanizadas (División)', desc: 'Si la IA genera un texto largo, se dividirá en hasta 3 burbujas de WhatsApp separadas con retraso.', val: humanizedSplit, set: setHumanizedSplit },
                { label: 'Intervención Humana (Handoff)', desc: 'Pausar el bot si el cliente escribe "humano", "asesor" o palabras similares.', val: humanHandoff, set: setHumanHandoff },
              ].map((item, i) => (
                <div key={i} className={cardCls}>
                  <div className="pr-4">
                    <h4 className={`font-bold text-[13px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.label}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input type="checkbox" className="sr-only peer" checked={item.val} onChange={() => item.set(!item.val)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-slate-700 dark:after:border-slate-600 dark:after:bg-slate-300"></div>
                  </label>
                </div>
              ))}
              <div className={cardCls + " flex-col items-start gap-2"}>
                <div className="w-full">
                  <h4 className={`font-bold text-[13px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Palabras Clave de Activación</h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium mb-3">Si el bot está apagado, solo se despertará si el cliente envía alguna de estas palabras. Sepáralas por comas.</p>
                  <input 
                    type="text" 
                    value={activationKeywords} 
                    onChange={e => setActivationKeywords(e.target.value)} 
                    placeholder="ej. alquimia, precio, info"
                    className={`w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer: Save Button */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 transition-colors ${isDarkMode ? 'border-slate-800 bg-[#252525]' : 'border-slate-100 bg-slate-50'}`}>
          {saveMsg && <span className={`text-xs font-bold ${saveMsg.includes('✅') ? 'text-emerald-500' : saveMsg.includes('❌') ? 'text-rose-500' : 'text-amber-500'}`}>{saveMsg}</span>}
          <div className="flex-1" />
          <button onClick={saveConfig} disabled={saving}
            className="px-4 py-2 md:px-6 md:py-2.5 bg-primary text-white text-xs md:text-sm font-bold rounded-xl hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Guardar Configuración
          </button>
        </div>
      </div>

      {/* Right Column: AI Simulator */}
      <div className={`w-full md:w-80 lg:w-96 rounded-2xl border shadow-sm flex flex-col overflow-hidden shrink-0 transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex justify-between items-center transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-800 text-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-primary' : 'bg-slate-600 text-white'}`}><Bot size={16} /></div>
            <div>
              <p className="font-bold text-xs md:text-sm text-white">Simulador IA</p>
              <p className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-300'}`}>Prueba tu bot aquí</p>
            </div>
          </div>
          <button onClick={() => setSimMessages([])} className={`transition-colors ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-300 hover:text-white'}`}><RefreshCw size={16} /></button>
        </div>

        <div className={`flex-1 p-4 flex flex-col gap-3 overflow-y-auto min-h-[300px] transition-colors ${isDarkMode ? 'bg-[#0f0f0f]' : 'bg-[#efeae2]'}`}
          style={!isDarkMode ? { backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain' } : {}}>
          {simMessages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <p className={`text-xs font-medium text-center ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Envía un mensaje para probar tu bot con la configuración actual</p>
            </div>
          )}
          {simMessages.map((msg, i) => (
            <div key={i} className={`${msg.role === 'user' ? 'self-end' : 'self-start'} p-2 rounded-lg text-sm max-w-[85%] shadow-sm ${msg.role === 'user' ? (isDarkMode ? 'bg-primary/20 text-slate-200 rounded-tr-none' : 'bg-[#d9fdd3] text-slate-800 rounded-tr-none') : (isDarkMode ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-white text-slate-800 rounded-tl-none')}`}>
              <p className="font-medium whitespace-pre-wrap">{msg.text}</p>
              <span className={`text-[9px] block text-right mt-1 font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{msg.time}</span>
            </div>
          ))}
          {simLoading && (
            <div className={`self-start p-3 rounded-lg rounded-tl-none shadow-sm ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={simEndRef} />
        </div>

        <div className={`p-3 border-t flex gap-2 transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <input
            type="text"
            value={simInput}
            onChange={e => setSimInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendSimMessage()}
            placeholder="Escribe un mensaje..."
            className={`flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-primary' : 'bg-white border-slate-200 text-slate-800 focus:border-primary'}`}
          />
          <button onClick={sendSimMessage} disabled={simLoading}
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50">
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotBuilder;
