import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellOff, X, Clock, CalendarDays, Phone, ListTodo, AlertTriangle } from 'lucide-react';

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

export const AlarmSystem = ({ items, enabled = true, onDismiss }: { items: AlarmItem[], enabled?: boolean, onDismiss?: (id: string) => void }) => {
  const [activeAlarms, setActiveAlarms] = useState<ActiveAlarm[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  if (activeAlarms.length === 0) return null;

  return (
    <>
      <AlarmBanner alarm={activeAlarms[activeAlarms.length - 1]} onDismiss={() => dismissAlarm(activeAlarms[activeAlarms.length - 1].item.id)} />
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
