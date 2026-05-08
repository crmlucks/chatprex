import React, { useEffect, useState, useRef } from 'react';
import { Bot, MessageCircle, Mic, QrCode, Plus, RefreshCw, CheckCircle2, Phone, Shield, AlertTriangle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const Chatbots = ({ isDarkMode }: { isDarkMode?: boolean }) => {
 const { token } = useAuth();
 const [qrCode, setQrCode] = useState<string | null>(null);
 const [waStatus, setWaStatus] = useState<string>('disconnected');
 const [connectionMode, setConnectionMode] = useState<'qr' | 'meta'>('qr');
 const [qrCountdown, setQrCountdown] = useState(0);
 
 // Estados para Cerebro IA
 const [aiProvider, setAiProvider] = useState('OpenAI');
 const [aiModel, setAiModel] = useState('gpt-3.5-turbo');
 const [aiApiKey, setAiApiKey] = useState('');
 const [aiPrompt, setAiPrompt] = useState('');
 const [isSavingAi, setIsSavingAi] = useState(false);
 const [aiSaveSuccess, setAiSaveSuccess] = useState(false);

 const socketRef = useRef<Socket | null>(null);
 const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
 const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

 /** Cargar configuración IA al inicio */
 useEffect(() => {
  const fetchAiConfig = async () => {
   try {
    if (!token) return;
    const res = await fetch(`${API_URL}/api/ai-config`, {
     headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
     const data = await res.json();
     setAiProvider(data.provider || 'OpenAI');
     setAiModel(data.model || 'gpt-3.5-turbo');
     setAiPrompt(data.prompt || '');
     if (data.hasApiKey) {
      setAiApiKey('UNCHANGED'); // Valor mágico para no sobrescribir si el usuario no la cambia
     }
    }
   } catch (e) {
    console.error('Error cargando config IA:', e);
   }
  };
  fetchAiConfig();
 }, []);

 const saveAiConfig = async () => {
  setIsSavingAi(true);
  setAiSaveSuccess(false);
  try {
   if (!token) return;
   const res = await fetch(`${API_URL}/api/ai-config`, {
    method: 'POST',
    headers: { 
     'Content-Type': 'application/json',
     Authorization: `Bearer ${token}` 
    },
    body: JSON.stringify({
     provider: aiProvider,
     model: aiModel,
     api_key: aiApiKey,
     prompt: aiPrompt
    })
   });
   if (res.ok) {
    setAiSaveSuccess(true);
    setTimeout(() => setAiSaveSuccess(false), 3000);
   }
  } catch (e) {
   console.error('Error guardando config IA:', e);
  }
  setIsSavingAi(false);
 };

 /** Normaliza el base64: agrega prefijo data:image si falta */
 const normalizeQR = (qr: string): string => {
  if (qr.startsWith('data:image')) return qr;
  // Si es base64 puro, agregar prefijo PNG
  return `data:image/png;base64,${qr.replace(/^base64,/, '')}`;
 };

 const requestQR = () => {
  setWaStatus('loading');
  setQrCode(null);
  if (socketRef.current?.connected) {
   socketRef.current.emit('request-evolution-qr');
  }
 };

 const startQRRefresh = () => {
  stopQRRefresh();
  setQrCountdown(30);
  // Countdown cada segundo
  countdownTimer.current = setInterval(() => {
   setQrCountdown(prev => {
    if (prev <= 1) return 30;
    return prev - 1;
   });
  }, 1000);
  // Refrescar QR cada 30 segundos
  refreshTimer.current = setInterval(() => {
   if (socketRef.current?.connected) {
    console.log('Auto-refrescando QR...');
    socketRef.current.emit('request-evolution-qr');
   }
  }, 30000);
 };

 const stopQRRefresh = () => {
  if (refreshTimer.current) clearInterval(refreshTimer.current);
  if (countdownTimer.current) clearInterval(countdownTimer.current);
  refreshTimer.current = null;
  countdownTimer.current = null;
  setQrCountdown(0);
 };

 useEffect(() => {
  const socket = io(SOCKET_URL, {
   auth: { token }
  });
  socketRef.current = socket;

  socket.on('connect', () => {
   console.log('Conectado al servidor WebSocket');
  });

  socket.on('whatsapp-qr', (qrBase64: string) => {
   console.log('QR Recibido en frontend');
   setQrCode(normalizeQR(qrBase64));
   setWaStatus('connecting');
   startQRRefresh();
  });

  socket.on('whatsapp-status', (status: string) => {
   console.log('Estado WhatsApp:', status);
   if (status === 'connected') {
    setWaStatus('connected');
    setQrCode(null);
    stopQRRefresh();
   } else {
    setWaStatus(status);
    setQrCode(null);
    stopQRRefresh();
   }
  });

  return () => {
   socket.disconnect();
   socketRef.current = null;
   stopQRRefresh();
  };
 }, []);

 return (
  <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 transition-colors ${isDarkMode ? 'bg-surface-base' : 'bg-surface-base'}`}>
   <div className="max-w-7xl mx-auto space-y-8">
    
    {/* Header con Estado de Red */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
     <div>
      <h1 className={`text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-content' : 'text-content'}`}>Conexiones y Canales</h1>
      <p className={`text-sm font-medium mt-1 ${isDarkMode ? 'text-content-muted' : 'text-content-muted'}`}>Vincula tus líneas de WhatsApp y configura el cerebro de tu IA.</p>
     </div>
     <div className={`flex items-center gap-4 p-2 rounded-2xl border ${isDarkMode ? 'bg-surface-raised/50 border-edge' : 'bg-surface border-edge shadow-sm'}`}>
       <div className="flex -space-x-2">
        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-edge bg-emerald-500 flex items-center justify-center text-content"><MessageCircle size={14} /></div>
        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-edge bg-blue-500 flex items-center justify-center text-content"><Shield size={14} /></div>
        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-edge bg-purple-500 flex items-center justify-center text-content"><Bot size={14} /></div>
       </div>
       <div className="pr-2">
        <p className="text-xs font-semibold uppercase tracking-normal text-content-muted">Estado de Servidores</p>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className={`text-xs font-bold ${isDarkMode ? 'text-content' : 'text-content-secondary'}`}>Evolution API v2.0 Online</span>
        </div>
       </div>
     </div>
    </div>

    {/* Path Selection (3 Paths) */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[
       { id: 'qr', icon: <QrCode size={20} />, label: 'WhatsApp Libre', desc: 'Conexión rápida vía QR', color: 'emerald' },
       { id: 'meta', icon: <Shield size={20} />, label: 'Meta Cloud API', desc: 'Canal oficial verificado', color: 'blue' },
       { id: 'brain', icon: <Bot size={20} />, label: 'Cerebro IA', desc: 'Configura la mente del bot', color: 'purple' },
      ].map(path => (
       <button 
        key={path.id}
        onClick={() => setConnectionMode(path.id as any)}
        className={`p-4 rounded-2xl border text-left transition-all active:scale-95 group ${connectionMode === path.id 
         ? `bg-accent/10 border-accent/30 ring-2 ring-accent/20` 
         : (isDarkMode ? 'bg-surface border-edge hover:border-slate-600' : 'bg-surface border-edge hover:shadow-md')}`}
       >
        <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center transition-all ${connectionMode === path.id ? `bg-accent text-content` : (isDarkMode ? 'bg-surface-raised text-content-muted group-hover:text-content-secondary' : 'bg-surface-inset text-content-muted group-hover:text-content-secondary')}`}>
          {path.icon}
        </div>
        <h3 className={`font-bold text-sm ${connectionMode === path.id ? (isDarkMode ? 'text-content' : 'text-content') : (isDarkMode ? 'text-content-muted' : 'text-content-secondary')}`}>{path.label}</h3>
        <p className="text-xs text-content-muted font-medium">{path.desc}</p>
       </button>
      ))}
    </div>

    {/* Main Interface */}
    <div className={`rounded-xl border shadow-sm overflow-hidden transition-colors ${isDarkMode ? 'bg-surface border-edge' : 'bg-surface border-edge'}`}>
      <div className="flex flex-col lg:flex-row min-h-[500px]">
       
       {/* Left Column: Context & Help */}
       <div className={`lg:w-1/3 p-8 md:p-10 border-b lg:border-b-0 lg:border-r flex flex-col justify-between transition-colors ${isDarkMode ? 'bg-surface-raised/30 border-edge' : 'bg-surface-inset/50 border-edge'}`}>
         <div>
          <div className="mb-8">
            <h2 className={`text-xl font-semibold tracking-tight mb-3 ${isDarkMode ? 'text-content' : 'text-content'}`}>
             {connectionMode === 'qr' && "Vinculación por QR"}
             {connectionMode === 'meta' && "API Oficial de Meta"}
             {connectionMode === 'brain' && "Personalidad del Bot"}
            </h2>
            <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-content-muted' : 'text-content-muted'}`}>
             {connectionMode === 'qr' && "Escanea el código con tu celular para que ChatPrex pueda leer y responder mensajes automáticamente. Sin costos por mensaje."}
             {connectionMode === 'meta' && "Ideal para empresas que manejan alto volumen y requieren el Check Verde. Mayor estabilidad y cumplimiento de políticas de WhatsApp."}
             {connectionMode === 'brain' && "Aquí defines cómo debe actuar tu IA: su tono, sus límites y qué información utilizará para convencer a tus clientes."}
            </p>
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-normal text-accent">Ventajas del canal</p>
            {[
             { label: "Cifrado 256 bits", active: true },
             { label: "Soporte Multimedia", active: true },
             { label: "Múltiples Agentes", active: true },
            ].map((v, i) => (
             <div key={i} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={12} /></div>
              <span className={`text-xs font-bold ${isDarkMode ? 'text-content-muted' : 'text-content-secondary'}`}>{v.label}</span>
             </div>
            ))}
          </div>
         </div>

         <div className="mt-10 p-4 rounded-2xl bg-accent/5 border border-accent/10">
          <p className="text-xs font-bold text-accent mb-1">¿Necesitas ayuda?</p>
          <p className="text-xs text-content-muted leading-tight">Consulta nuestra base de conocimientos o contacta a soporte técnico.</p>
         </div>
       </div>

       {/* Right Column: Interaction Area */}
       <div className={`flex-1 p-8 md:p-12 flex flex-col justify-center items-center transition-colors ${isDarkMode ? 'bg-[#151316]' : 'bg-surface'}`}>
         
         {connectionMode === 'qr' && (
          <div className="w-full max-w-sm text-center animate-in zoom-in duration-500">
            {waStatus === 'connected' ? (
             <div className="space-y-6">
               <div className="w-24 h-24 rounded-full bg-emerald-500/10 text-emerald-500 border-4 border-emerald-500/20 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={48} />
               </div>
               <div>
                <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-content' : 'text-content'}`}>WhatsApp Conectado</h3>
                <p className="text-sm font-medium text-content-muted">Tu línea está operativa y sincronizada.</p>
               </div>
               <div className={`p-4 rounded-2xl border flex items-center gap-4 text-left ${isDarkMode ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge'}`}>
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-content font-bold text-sm">L1</div>
                <div>
                  <p className={`text-xs font-bold ${isDarkMode ? 'text-content' : 'text-content'}`}>Línea Principal</p>
                  <p className="text-xs text-emerald-500 font-bold uppercase tracking-normal">Activa y recibiendo</p>
                </div>
               </div>
               <button className="text-xs font-bold text-rose-500 px-6 py-3 rounded-xl hover:bg-rose-500/10 transition-all">Desvincular Dispositivo</button>
             </div>
            ) : qrCode ? (
             <div className="space-y-6">
               <div className={`p-6 rounded-xl bg-surface border-8 shadow-sm relative inline-block transition-colors ${isDarkMode ? 'border-edge' : 'border-edge'}`}>
                <img src={qrCode} alt="QR" className="w-64 h-64 object-contain rounded-2xl" />
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-accent text-content flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-900 font-semibold text-sm">
                  {qrCountdown}
                </div>
               </div>
               <div className="space-y-2">
                <h4 className={`text-base font-bold ${isDarkMode ? 'text-content' : 'text-content'}`}>Escanea para conectar</h4>
                <p className="text-xs text-content-muted max-w-[240px] mx-auto font-medium">Usa WhatsApp en tu teléfono para escanear este código y habilitar el CRM.</p>
               </div>
               <button onClick={requestQR} className="flex items-center gap-2 mx-auto text-xs font-bold text-accent hover:underline"><RefreshCw size={14} /> Refrescar Código</button>
             </div>
            ) : (
             <div className="flex flex-col items-center gap-4 opacity-50">
               <RefreshCw size={48} className="animate-spin text-accent" />
               <p className="text-xs font-semibold uppercase tracking-normal text-content-muted">Conectando con Servidor...</p>
             </div>
            )}
          </div>
         )}

         {connectionMode === 'meta' && (
          <div className="w-full max-w-md space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="space-y-1">
             <label className="text-xs font-semibold uppercase tracking-normal text-content-muted ml-1">whatsapp phone id</label>
             <input type="text" placeholder="Ej: 10592837482" className={`w-full p-4 rounded-2xl border text-sm font-mono focus:ring-2 focus:ring-accent/20 outline-none transition-all ${isDarkMode ? 'bg-surface-raised border-edge text-content' : 'bg-surface-inset border-edge text-content'}`} />
            </div>
            <div className="space-y-1">
             <label className="text-xs font-semibold uppercase tracking-normal text-content-muted ml-1">system user access token</label>
             <textarea rows={4} placeholder="EAAD..." className={`w-full p-4 rounded-2xl border text-sm font-mono focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none ${isDarkMode ? 'bg-surface-raised border-edge text-content' : 'bg-surface-inset border-edge text-content'}`} />
            </div>
            <button className="w-full py-4 bg-accent text-content rounded-2xl font-semibold text-sm uppercase tracking-normal shadow-sm shadow-accent/20 hover:bg-accent-dark transition-all active:scale-95">Validar y Conectar</button>
            <p className="text-xs text-center text-content-muted font-bold">Requiere una cuenta de <a href="#" className="text-accent hover:underline">Facebook Developers</a> activa.</p>
          </div>
         )}

         {connectionMode === 'brain' && (
          <div className="w-full max-w-md space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
               <label className="text-xs font-semibold uppercase tracking-normal text-content-muted ml-1">ia provider</label>
               <select value={aiProvider} onChange={e => setAiProvider(e.target.value)} className={`w-full p-4 rounded-2xl border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all ${isDarkMode ? 'bg-surface-raised border-edge text-content' : 'bg-surface-inset border-edge text-content'}`}>
                <option>OpenAI</option>
                <option>Gemini</option>
                <option>DeepSeek</option>
               </select>
             </div>
             <div className="space-y-1">
               <label className="text-xs font-semibold uppercase tracking-normal text-content-muted ml-1">model</label>
               <input type="text" value={aiModel} onChange={e => setAiModel(e.target.value)} className={`w-full p-4 rounded-2xl border text-sm font-bold focus:ring-2 focus:ring-accent/20 outline-none transition-all ${isDarkMode ? 'bg-surface-raised border-edge text-content' : 'bg-surface-inset border-edge text-content'}`} />
             </div>
            </div>
            <div className="space-y-1">
             <label className="text-xs font-semibold uppercase tracking-normal text-content-muted ml-1">personalidad (prompt base)</label>
             <textarea rows={6} value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} placeholder="Ej: Eres un vendedor amable..." className={`w-full p-4 rounded-2xl border text-sm focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none ${isDarkMode ? 'bg-surface-raised border-edge text-content' : 'bg-surface-inset border-edge text-content'}`} />
            </div>
            <div className="pt-2">
             <button onClick={saveAiConfig} disabled={isSavingAi} className="w-full py-4 bg-accent text-content rounded-2xl font-semibold text-sm uppercase tracking-normal shadow-sm shadow-accent/20 hover:bg-accent-dark transition-all active:scale-95 disabled:opacity-50">
               {isSavingAi ? "Guardando..." : aiSaveSuccess ? "¡Configuración Guardada!" : "Actualizar Cerebro IA"}
             </button>
            </div>
          </div>
         )}

       </div>
      </div>
    </div>

    {/* Footer Info Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
       { label: "Mensajes Enviados", val: "12,402", sub: "+12% hoy", icon: <MessageCircle size={18} />, color: "emerald" },
       { label: "Bots Activos", val: "04", sub: "Todos OK", icon: <Bot size={18} />, color: "blue" },
       { label: "Tiempo Respuesta", val: "0.8s", sub: "Promedio IA", icon: <Plus size={18} />, color: "amber" },
       { label: "Seguridad", val: "Certificada", sub: "SSL & JWT", icon: <Shield size={18} />, color: "indigo" },
      ].map((stat, i) => (
       <div key={i} className={`p-6 rounded-xl border transition-all ${isDarkMode ? 'bg-surface border-edge' : 'bg-surface border-edge shadow-sm'}`}>
        <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center bg-accent/10 text-accent`}>
          {stat.icon}
        </div>
        <p className="text-xs font-semibold uppercase tracking-normal text-content-muted">{stat.label}</p>
        <h4 className={`text-xl font-semibold mt-1 ${isDarkMode ? 'text-content' : 'text-content'}`}>{stat.val}</h4>
        <p className="text-xs font-bold text-emerald-500 mt-1">{stat.sub}</p>
       </div>
      ))}
    </div>

   </div>
  </div>
 );
}

export default Chatbots;
