import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellOff, X, Clock, CalendarDays, Phone, ListTodo, AlertTriangle, UserCheck, Sparkles, ExternalLink, Globe } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

export interface AlarmItem {
  id: string;
  title: string;
  type: 'tarea' | 'cita';
  subtype?: string; 
  dueDate: string;  
  dueTime: string;  
  leadName?: string;
  priority?: string;
}

interface ActiveAlarm {
  item: AlarmItem;
  triggeredAt: Date;
}

interface LeadAlarmData {
  name: string;
  phone: string;
  source?: string;
  interest?: string;
  triggeredAt: Date;
}

class AlarmToneGenerator {
  private audioCtx: AudioContext | null = null;
  private oscillatorNodes: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private isPlaying = false;
  private stopTimeout: ReturnType<typeof setTimeout> | null = null;

  start(durationMs: number = 30000) {
    if (this.isPlaying) return;
    this.isPlaying = true;
    try {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.connect(this.audioCtx.destination);
      this.gainNode.gain.value = 0.15; 
      this.playPattern();
      this.stopTimeout = setTimeout(() => this.stop(), durationMs);
    } catch (e) {}
  }

  private playPattern() {
    if (!this.audioCtx || !this.gainNode || !this.isPlaying) return;
    const now = this.audioCtx.currentTime;
    const pattern = [
      { freq: 880, start: 0, end: 0.15 },
      { freq: 1100, start: 0.2, end: 0.35 },
      { freq: 880, start: 0.5, end: 0.65 },
      { freq: 1100, start: 0.7, end: 0.85 },
    ];
    const cycleDuration = 1.8;
    const totalCycles = Math.ceil(30 / cycleDuration);
    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const offset = cycle * cycleDuration;
      pattern.forEach(note => {
        if (!this.audioCtx || !this.gainNode) return;
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        osc.connect(noteGain);
        noteGain.connect(this.gainNode!);
        noteGain.gain.setValueAtTime(0, now + offset + note.start);
        noteGain.gain.linearRampToValueAtTime(0.3, now + offset + note.start + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.01, now + offset + note.end);
        osc.start(now + offset + note.start);
        osc.stop(now + offset + note.end + 0.05);
        this.oscillatorNodes.push(osc);
      });
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.stopTimeout) { clearTimeout(this.stopTimeout); this.stopTimeout = null; }
    this.oscillatorNodes.forEach(osc => { try { osc.stop(); } catch {} });
    this.oscillatorNodes = [];
    if (this.audioCtx) { this.audioCtx.close().catch(() => {}); this.audioCtx = null; }
    this.gainNode = null;
  }
}

const toneGenerator = new AlarmToneGenerator();

const AlarmBanner = ({ alarm, onDismiss }: { alarm: ActiveAlarm; onDismiss: () => void }) => {
  const [pulse, setPulse] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const i = setInterval(() => {
      setPulse(p => !p);
      setElapsed(Math.floor((Date.now() - alarm.triggeredAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(i);
  }, [alarm.triggeredAt]);

  const formatElapsed = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  const typeIcon = () => {
    const sub = alarm.item.subtype?.toLowerCase() || '';
    if (sub.includes('visita')) return <CalendarDays size={22} />;
    if (sub.includes('llamada')) return <Phone size={22} />;
    if (sub.includes('reunión')) return <ListTodo size={22} />;
    return <Clock size={22} />;
  };

  const isCita = alarm.item.type === 'cita';

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-lg mx-auto px-4 transition-all duration-300 ${pulse ? 'scale-100' : 'scale-[1.01]'}`}
      style={{ animation: 'alarmSlideDown 0.4s ease-out' }}
    >
      <div className={`relative overflow-hidden rounded-xl border bg-surface p-5 shadow-lg ${isCita ? 'border-amber-500/30' : 'border-red-500/30'}`}>
        <div className={`absolute top-0 left-0 right-0 h-1 ${isCita ? 'bg-amber-500' : 'bg-red-500'} animate-pulse`} />
        
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${isCita ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
            {typeIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
               <div className={`w-1.5 h-1.5 rounded-full ${isCita ? 'bg-amber-500' : 'bg-red-500'} animate-ping`} />
               <span className={`text-xs font-medium ${isCita ? 'text-amber-500' : 'text-red-500'}`}>
                 Recordatorio activo
               </span>
            </div>
            <h3 className="text-content text-base font-semibold truncate mb-1">{alarm.item.title}</h3>
            
            <div className="flex items-center gap-3 flex-wrap text-xs text-content-secondary">
              {alarm.item.leadName && <span className="flex items-center gap-1">👤 {alarm.item.leadName}</span>}
              <span className="flex items-center gap-1">🕐 {alarm.item.dueTime}</span>
              <span className="px-1.5 py-0.5 bg-surface-inset rounded text-content-muted">{alarm.item.subtype || alarm.item.type}</span>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isCita ? 'bg-amber-500 text-amber-950 hover:bg-amber-400' : 'bg-red-500 text-white hover:bg-red-400'}`}
          >
            <BellOff size={14} /> Silenciar
          </button>
        </div>
        
        <div className="mt-3 pt-3 border-t border-edge flex justify-between items-center">
           <div className="flex items-center gap-1.5 text-xs text-content-muted">
              <AlertTriangle size={12} /> Sonando hace {formatElapsed(elapsed)}
           </div>
        </div>
      </div>
    </div>
  );
};

// Componente Banner de Alarma para Nuevos Leads
const LeadAlarmBanner = ({ lead, onDismiss, onView }: { lead: LeadAlarmData; onDismiss: () => void; onView?: () => void }) => {
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const i = setInterval(() => setPulse(p => !p), 800);
    return () => clearInterval(i);
  }, []);

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[10005] w-full max-w-md mx-auto px-4 transition-all duration-300 ${pulse ? 'scale-100' : 'scale-[1.02]'}`}
      style={{ animation: 'alarmSlideDown 0.4s ease-out' }}
    >
      <div className="relative overflow-hidden rounded-2xl border-2 border-emerald-500/50 bg-surface p-5 shadow-2xl shadow-emerald-500/20">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500 animate-pulse" />

        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30 animate-bounce">
            <Bell size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles size={10} /> ¡NUEVO LEAD REGISTRADO!
              </span>
            </div>

            <h3 className="text-content text-base font-black truncate">{lead.name || 'Cliente Interesado'}</h3>

            <div className="mt-2 space-y-1 text-xs text-content-secondary font-semibold">
              <div className="flex items-center gap-2">
                <Phone size={13} className="text-emerald-500 shrink-0" />
                <span>{lead.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe size={13} className="text-accent shrink-0" />
                <span>Origen: <strong className="text-accent font-extrabold">{lead.source || 'Sitio Web'}</strong></span>
              </div>
              {lead.interest && (
                <div className="flex items-center gap-2">
                  <UserCheck size={13} className="text-purple-500 shrink-0" />
                  <span>Interés: <strong className="text-content font-extrabold">{lead.interest}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-edge flex items-center justify-end gap-2">
          <button
            onClick={onDismiss}
            className="px-3.5 py-2 rounded-xl bg-surface-base hover:bg-edge border border-edge text-content text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <BellOff size={14} /> Silenciar
          </button>
          {onView && (
            <button
              onClick={() => {
                onDismiss();
                onView();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
            >
              <span>Ver en Leads</span>
              <ExternalLink size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export const AlarmSystem = ({
  items,
  enabled = true,
  onDismiss,
  onNavigateToLeads
}: {
  items: AlarmItem[];
  enabled?: boolean;
  onDismiss?: (id: string) => void;
  onNavigateToLeads?: () => void;
}) => {
  const [activeAlarms, setActiveAlarms] = useState<ActiveAlarm[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [activeLeadAlarm, setActiveLeadAlarm] = useState<LeadAlarmData | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Solicitar permiso de notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Listener de WebSockets para nuevos leads
  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const socket: Socket = io(SOCKET_URL, { transports: ['websocket'] });

    socket.on('new-lead', (data: any) => {
      console.log('🚨 [AlarmSystem] Nuevo lead detectado:', data);
      
      // Iniciar sonido de alarma
      toneGenerator.start(30000);

      // Mostrar banner de alarma
      setActiveLeadAlarm({
        name: data.name || 'Nuevo Prospecto',
        phone: data.phone || '',
        source: data.source || 'Sitio Web',
        interest: data.interest || 'Comprar',
        triggeredAt: new Date()
      });

      // Disparar notificación de escritorio si está permitida
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('🚨 ¡NUEVO LEAD REGISTRADO!', {
            body: `${data.name || 'Lead Web'} (${data.phone || ''})\nOrigen: ${data.source || 'Sitio Web'}`
          });
        } catch (e) {}
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const checkAlarms = useCallback(() => {
    if (!enabled) return;
    const now = new Date();
    const newAlarms: ActiveAlarm[] = [];
    items.forEach(item => {
      if (dismissedIds.has(item.id)) return;
      if (activeAlarms.find(a => a.item.id === item.id)) return;
      try {
        const dueDate = new Date(`${item.dueDate}T${item.dueTime}:00`);
        if (isNaN(dueDate.getTime())) return;
        const timeDiff = dueDate.getTime() - now.getTime();
        if (timeDiff > 0 && timeDiff <= 5 * 60 * 1000) newAlarms.push({ item, triggeredAt: new Date() });
      } catch {}
    });
    if (newAlarms.length > 0) { setActiveAlarms(prev => [...prev, ...newAlarms]); toneGenerator.start(30000); }
  }, [items, enabled, dismissedIds, activeAlarms]);

  useEffect(() => {
    checkIntervalRef.current = setInterval(checkAlarms, 15000);
    const t = setTimeout(checkAlarms, 1000);
    return () => { if (checkIntervalRef.current) clearInterval(checkIntervalRef.current); clearTimeout(t); };
  }, [checkAlarms]);

  useEffect(() => { return () => { toneGenerator.stop(); }; }, []);

  const dismissAlarm = (id: string) => { toneGenerator.stop(); setActiveAlarms(prev => prev.filter(a => a.item.id !== id)); setDismissedIds(prev => new Set(prev).add(id)); };

  const dismissLeadAlarm = () => {
    toneGenerator.stop();
    setActiveLeadAlarm(null);
  };

  return (
    <>
      {activeLeadAlarm && (
        <LeadAlarmBanner
          lead={activeLeadAlarm}
          onDismiss={dismissLeadAlarm}
          onView={() => {
            if (onNavigateToLeads) onNavigateToLeads();
          }}
        />
      )}

      {activeAlarms.length > 0 && (
        <AlarmBanner alarm={activeAlarms[activeAlarms.length - 1]} onDismiss={() => dismissAlarm(activeAlarms[activeAlarms.length - 1].item.id)} />
      )}

      {activeAlarms.length > 1 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[10001] animate-bounce">
          <div className="bg-surface text-content px-4 py-2 rounded-lg text-xs font-medium border border-edge shadow-sm">
            {activeAlarms.length} notificaciones pendientes
          </div>
        </div>
      )}

      <style>{`
        @keyframes alarmSlideDown { from { opacity: 0; transform: translateX(-50%) translateY(-40px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes alarmIconPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `}</style>
    </>
  );
};

export default AlarmSystem;

