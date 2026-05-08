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
    if (sub.includes('visita')) return <CalendarDays size={24} />;
    if (sub.includes('llamada')) return <Phone size={24} />;
    if (sub.includes('reunión')) return <ListTodo size={24} />;
    return <Clock size={24} />;
  };

  const isCita = alarm.item.type === 'cita';

  return (
    <div
      className={`fixed top-10 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-xl mx-auto px-6 transition-all duration-500 ${pulse ? 'scale-100' : 'scale-[1.02]'}`}
      style={{ animation: 'alarmSlideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
    >
      <div className={`relative overflow-hidden rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border ${isCita ? 'border-amber-500/30 bg-slate-900/90' : 'border-rose-500/30 bg-slate-900/90'} backdrop-blur-3xl p-8`}>
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isCita ? 'bg-amber-500' : 'bg-rose-500'} animate-pulse`} />
        
        <div className="flex items-start gap-6">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 ${isCita ? 'bg-amber-500/20 text-amber-500 shadow-2xl shadow-amber-500/20' : 'bg-rose-500/20 text-rose-500 shadow-2xl shadow-rose-500/20'}`} style={{ animation: 'alarmIconPulse 1s ease-in-out infinite' }}>
            {typeIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
               <div className={`w-2 h-2 rounded-full ${isCita ? 'bg-amber-500' : 'bg-rose-500'} animate-ping`} />
               <span className={`text-[10px] font-black uppercase tracking-[2px] ${isCita ? 'text-amber-500' : 'text-rose-500'}`}>
                 recordatorio activo
               </span>
            </div>
            <h3 className="text-white text-xl font-black lowercase truncate mb-2 tracking-tight">{alarm.item.title}</h3>
            
            <div className="flex items-center gap-4 flex-wrap opacity-60">
              {alarm.item.leadName && <span className="text-[11px] font-bold text-white flex items-center gap-2">👤 {alarm.item.leadName}</span>}
              <span className="text-[11px] font-bold text-white flex items-center gap-2">🕐 {alarm.item.dueTime}</span>
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-white/5 rounded-lg text-white">{alarm.item.subtype || alarm.item.type}</span>
            </div>
          </div>

          <button
            onClick={onDismiss}
            className={`shrink-0 flex items-center gap-2 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[2px] transition-all active:scale-95 shadow-2xl ${isCita ? 'bg-amber-500 text-amber-950 hover:bg-amber-400' : 'bg-rose-500 text-rose-950 hover:bg-rose-400'}`}
          >
            <BellOff size={16} /> silenciar
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center">
           <div className="flex items-center gap-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
              <AlertTriangle size={12} /> sonando hace {formatElapsed(elapsed)}
           </div>
           <p className="text-[9px] font-black text-white/20 uppercase tracking-[3px]">chatprex pro system</p>
        </div>
      </div>
    </div>
  );
};

export const AlarmSystem = ({ items, enabled = true }: { items: AlarmItem[], enabled?: boolean }) => {
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
          <div className="bg-slate-900/90 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-2xl backdrop-blur-xl">
            {activeAlarms.length} notificaciones pendientes
          </div>
        </div>
      )}
      <style>{`
        @keyframes alarmSlideDown { from { opacity: 0; transform: translateX(-50%) translateY(-60px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes alarmIconPulse { 0%, 100% { transform: scale(1); rotate: 0deg; } 50% { transform: scale(1.1); rotate: 5deg; } }
      `}</style>
    </>
  );
};

export default AlarmSystem;
