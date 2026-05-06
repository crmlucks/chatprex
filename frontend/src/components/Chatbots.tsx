import React, { useEffect, useState, useRef } from 'react';
import { Bot, MessageCircle, Mic, QrCode, Plus, RefreshCw, CheckCircle2, Phone, Shield, AlertTriangle } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

const Chatbots = ({ isDarkMode }: { isDarkMode?: boolean }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<string>('disconnected');
  const [connectionMode, setConnectionMode] = useState<'qr' | 'meta'>('qr');
  const [qrCountdown, setQrCountdown] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const socket = io(SOCKET_URL);
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
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado Clásico */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Conexión WhatsApp</h1>
            <p className={`text-[12px] md:text-[13px] mt-1 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Vincula tu línea comercial al CRM ChatPrex</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tarjeta Principal: Conexión */}
          <div className={`lg:col-span-2 rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            
            {/* Pestañas de Selección */}
            <div className={`flex border-b transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
              <button 
                onClick={() => setConnectionMode('qr')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-[12px] md:text-[13px] transition-all border-b-2 active:scale-95 ${connectionMode === 'qr' ? 'border-primary text-primary bg-white/5' : (isDarkMode ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-500 hover:text-slate-700')}`}
              >
                <QrCode size={18} /> WhatsApp Libre (QR)
              </button>
              <button 
                onClick={() => setConnectionMode('meta')}
                className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold text-[12px] md:text-[13px] transition-all border-b-2 active:scale-95 ${connectionMode === 'meta' ? 'border-primary text-primary bg-white/5' : (isDarkMode ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-500 hover:text-slate-700')}`}
              >
                <Shield size={18} /> WhatsApp Oficial (API)
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1">
              {/* Información Izquierda */}
              <div className={`md:w-1/2 p-6 md:p-8 border-b md:border-b-0 md:border-r flex flex-col justify-between transition-colors ${isDarkMode ? 'border-slate-800 bg-[#1E1E1E]' : 'border-slate-100 bg-white'}`}>
                <div>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border transition-all ${connectionMode === 'qr' ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100') : (isDarkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-600 border-blue-100')}`}>
                    {connectionMode === 'qr' ? <QrCode size={24} /> : <MessageCircle size={24} />}
                  </div>
                  <h2 className={`text-[16px] md:text-[18px] font-bold mb-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    {connectionMode === 'qr' ? 'WhatsApp Libre (Baileys)' : 'Meta Cloud API (Oficial)'}
                  </h2>
                  <p className={`text-[12px] md:text-[13px] leading-relaxed mb-6 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    {connectionMode === 'qr' 
                      ? 'Conecta cualquier número escaneando el código QR. Ideal para arrancar operaciones rápido sin pasar por aprobaciones de Meta. 100% gratuito en envío de mensajes.'
                      : 'Integración oficial de Facebook. Ideal para negocios verificados. Mayor estabilidad, requiere aprobación de plantillas para mensajes masivos y tiene costo por conversación iniciada por la empresa.'}
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm font-bold">
                      <Shield size={16} className={connectionMode === 'qr' ? "text-emerald-400" : "text-blue-400"} />
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>{connectionMode === 'qr' ? 'Cifrado Extremo a Extremo' : 'Verificación de Empresa (Check Verde)'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm font-bold">
                      <Bot size={16} className="text-primary" />
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Inteligencia Artificial integrada</span>
                    </div>
                  </div>
                </div>

                <div className={`mt-8 pt-6 border-t flex items-center justify-between transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  <span className="text-[10px] font-bold text-slate-500">Estado de Conexión</span>
                  {waStatus === 'connected' ? (
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${isDarkMode ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 shadow-lg shadow-emerald-500/10' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Vinculado
                    </span>
                  ) : waStatus === 'connecting' && connectionMode === 'qr' ? (
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${isDarkMode ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-amber-600 bg-amber-50 border-amber-100'}`}>
                      <RefreshCw size={12} className="animate-spin" /> Esperando QR
                    </span>
                  ) : (
                    <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${isDarkMode ? 'text-slate-500 bg-slate-800' : 'text-slate-500 bg-slate-100'}`}>
                      Desconectado
                    </span>
                  )}
                </div>
              </div>

              {/* Lado Derecho: Render dinámico */}
              <div className={`md:w-1/2 p-6 md:p-8 flex items-center justify-center transition-colors ${isDarkMode ? 'bg-[#151515]' : 'bg-slate-50/50'}`}>
                {connectionMode === 'qr' ? (
                  waStatus === 'connected' ? (
                    <div className="text-center animate-in fade-in zoom-in duration-500">
                      <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 shadow-xl transition-all ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-slate-800 shadow-emerald-500/10' : 'bg-emerald-100 text-emerald-500 border-white shadow-sm'}`}>
                        <CheckCircle2 size={40} />
                      </div>
                      <h3 className={`text-base md:text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>¡Conexión Exitosa!</h3>
                      <p className="text-sm font-medium text-slate-500 mb-6">Tu línea está lista para automatizar ventas.</p>
                      <button className={`text-xs md:text-sm font-bold px-4 py-2 md:px-6 md:py-2.5 rounded-xl transition-all active:scale-95 border ${isDarkMode ? 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20' : 'text-red-500 bg-red-50 border-red-100 hover:bg-red-100'}`}>
                        Cerrar Sesión
                      </button>
                    </div>
                  ) : qrCode ? (
                    <div className="text-center animate-in fade-in duration-500 w-full max-w-[280px]">
                      <p className="text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest">Escanea este código</p>
                      <div className={`p-4 rounded-3xl border shadow-xl mb-4 transition-colors relative ${isDarkMode ? 'bg-white border-slate-700' : 'bg-white border-slate-200'}`}>
                        <img src={qrCode} alt="WhatsApp QR Code" className="w-full h-auto object-contain rounded-xl" />
                        {qrCountdown > 0 && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-900/70 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-white">{qrCountdown}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-medium mb-3">
                        Abre WhatsApp → <strong>Dispositivos Vinculados</strong> → Escanea el código
                      </p>
                      <button
                        onClick={requestQR}
                        className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 border ${isDarkMode ? 'border-slate-700 text-slate-400 hover:text-white hover:border-primary' : 'border-slate-200 text-slate-500 hover:text-primary hover:border-primary'}`}
                      >
                        <RefreshCw size={14} /> Generar nuevo QR
                      </button>
                    </div>
                  ) : (
                    <div className="text-center w-full max-w-sm">
                      {waStatus.includes('Error') || waStatus.includes('Falla') || waStatus.includes('error') ? (
                        <div className="flex flex-col items-center gap-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-rose-500/10' : 'bg-red-50'}`}>
                            <AlertTriangle size={32} className="text-rose-400" />
                          </div>
                          <div className={`p-4 rounded-2xl border text-sm break-words font-medium transition-colors w-full ${isDarkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-red-50 border-red-100 text-red-500'}`}>
                            <strong>Error de conexión:</strong><br />
                            <span className="text-xs">{waStatus}</span>
                          </div>
                          <button
                            onClick={requestQR}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95 ${isDarkMode ? 'bg-primary text-white hover:bg-primary/90' : 'bg-primary text-white hover:bg-primary/90'} shadow-lg shadow-primary/20`}
                          >
                            <RefreshCw size={16} /> Reintentar Conexión
                          </button>
                          <a
                            href={`${API_URL}/api/webhook/evolution/test`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-blue-400 hover:underline mt-1"
                          >
                            🔧 Abrir diagnóstico de Evolution API
                          </a>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <RefreshCw size={32} className={`animate-spin ${isDarkMode ? 'text-primary/40' : 'text-slate-300'}`} />
                          <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Generando QR...</p>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Conectando con Evolution API</p>
                          <button
                            onClick={requestQR}
                            className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 border ${isDarkMode ? 'border-slate-700 text-slate-400 hover:text-white hover:border-slate-500' : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:border-slate-400'}`}
                          >
                            <RefreshCw size={14} /> Reintentar
                          </button>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  /* Formulario de Meta API */
                  <div className="w-full animate-in fade-in duration-500 flex flex-col">
                    <h3 className={`text-lg font-black tracking-tight mb-6 text-center ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Credenciales de Facebook</h3>
                    <div className="space-y-4 flex-1">
                      <div>
                        <label className={`block text-[10px] font-black mb-1 uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>Número de Teléfono ID</label>
                        <input type="text" className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-mono ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'}`} placeholder="Ej: 10582938475" />
                      </div>
                      <div>
                        <label className={`block text-[10px] font-black mb-1 uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-700'}`}>Token de Acceso Permanente</label>
                        <textarea className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-mono h-24 resize-none custom-scrollbar ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-500'}`} placeholder="EAAD..."></textarea>
                      </div>
                      <button className="w-full bg-blue-600 text-white font-bold text-xs md:text-sm py-3 rounded-xl hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20">
                        Conectar Cuenta Oficial
                      </button>
                    </div>
                    <div className="mt-6 text-center">
                       <a href="#" className="text-xs font-bold text-blue-500 hover:underline">¿Cómo obtengo estas credenciales?</a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tarjetas Secundarias (Columna Derecha) */}
          <div className="flex flex-col gap-6">

            {/* Voice Bot (IA) */}
            <div className={`rounded-2xl border shadow-sm p-6 flex flex-col justify-between transition-all hover:shadow-xl cursor-pointer group ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800 hover:border-primary/50' : 'bg-white border-slate-200 hover:border-primary/30'}`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white'}`}>
                    <Mic size={24} />
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-1 rounded-md ${isDarkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>Próximamente</span>
                </div>
                <h3 className={`font-bold text-sm md:text-base mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Voice Bot (IA)</h3>
                <p className={`text-sm leading-relaxed mb-4 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  Llamadas autónomas para calificar leads y agendar citas utilizando voz humana.
                </p>
              </div>
              <button className={`w-full text-xs font-bold py-3 rounded-xl transition-all border active:scale-95 ${isDarkMode ? 'text-primary bg-primary/10 border-primary/20 hover:bg-primary/20' : 'text-primary bg-primary/5 border-primary/20 hover:bg-primary/10'}`}>
                Ver Funciones
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbots;
