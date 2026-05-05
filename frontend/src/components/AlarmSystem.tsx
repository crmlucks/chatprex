import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, BellOff, X, Clock, CalendarDays, Phone, ListTodo, AlertTriangle } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────
export interface AlarmItem {
  id: string;
  title: string;
  type: 'tarea' | 'cita';
  subtype?: string; // 'Llamada', 'Visita', etc.
  dueDate: string;  // ISO date string or 'YYYY-MM-DD'
  dueTime: string;  // 'HH:MM'
  leadName?: string;
  priority?: string;
}

interface ActiveAlarm {
  item: AlarmItem;
  triggeredAt: Date;
}

// ─── Web Audio Alarm Tone Generator ──────────────────────────────────
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
      this.gainNode.gain.value = 0.15; // Volume (gentle but noticeable)

      // Create a pleasant two-tone alarm pattern
      this.playPattern();

      // Auto-stop after duration
      this.stopTimeout = setTimeout(() => this.stop(), durationMs);
    } catch (e) {
      console.warn('Audio API not available:', e);
    }
  }

  private playPattern() {
    if (!this.audioCtx || !this.gainNode || !this.isPlaying) return;

    const now = this.audioCtx.currentTime;
    const pattern = [
      // Frequencies for a gentle but attention-grabbing alarm
      { freq: 880, start: 0, end: 0.15 },
      { freq: 1100, start: 0.2, end: 0.35 },
      { freq: 880, start: 0.5, end: 0.65 },
      { freq: 1100, start: 0.7, end: 0.85 },
      // Pause, then repeat at 1.5s intervals
    ];

    const cycleDuration = 1.8; // seconds per cycle
    const totalCycles = Math.ceil(30 / cycleDuration); // enough for 30s

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const offset = cycle * cycleDuration;
      pattern.forEach(note => {
        if (!this.audioCtx || !this.gainNode) return;
        const osc = this.audioCtx.createOscillator();
        const noteGain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = note.freq;
        osc.connect(noteGain);
        noteGain.connect(this.gainNode);

        // Envelope for smooth sound
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
    if (this.stopTimeout) {
      clearTimeout(this.stopTimeout);
      this.stopTimeout = null;
    }
    this.oscillatorNodes.forEach(osc => {
      try { osc.stop(); } catch {}
    });
    this.oscillatorNodes = [];
    if (this.audioCtx) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }
    this.gainNode = null;
  }

  get playing() { return this.isPlaying; }
}

// ─── Singleton tone generator ────────────────────────────────────────
const toneGenerator = new AlarmToneGenerator();

// ─── Alarm Banner Component ──────────────────────────────────────────
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

  const formatElapsed = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const typeIcon = () => {
    const sub = alarm.item.subtype?.toLowerCase() || '';
    if (sub.includes('visita')) return <CalendarDays size={20} />;
    if (sub.includes('llamada')) return <Phone size={20} />;
    if (sub.includes('reunión')) return <ListTodo size={20} />;
    if (alarm.item.type === 'cita') return <CalendarDays size={20} />;
    return <Clock size={20} />;
  };

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[10000] w-full max-w-lg mx-auto transition-all duration-500 ${pulse ? 'scale-100' : 'scale-[1.01]'}`}
      style={{ animation: 'alarmSlideDown 0.4s ease-out' }}
    >
      <div className={`relative overflow-hidden rounded-2xl shadow-2xl border ${alarm.item.type === 'cita' ? 'border-amber-500/50 bg-gradient-to-r from-amber-950/95 via-amber-900/95 to-amber-950/95' : 'border-rose-500/50 bg-gradient-to-r from-rose-950/95 via-rose-900/95 to-rose-950/95'} backdrop-blur-xl`}>
        {/* Animated top bar */}
        <div className={`h-1 ${alarm.item.type === 'cita' ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400' : 'bg-gradient-to-r from-rose-400 via-pink-300 to-rose-400'}`}
          style={{ animation: 'alarmPulseBar 1.5s ease-in-out infinite' }}
        />

        <div className="p-4 flex items-start gap-4">
          {/* Pulsing icon */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${alarm.item.type === 'cita' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'}`}
            style={{ animation: 'alarmIconPulse 1s ease-in-out infinite' }}
          >
            {typeIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Bell size={14} className={`${alarm.item.type === 'cita' ? 'text-amber-400' : 'text-rose-400'}`}
                style={{ animation: 'alarmBellShake 0.5s ease-in-out infinite' }}
              />
              <span className={`text-[11px] font-bold uppercase tracking-widest ${alarm.item.type === 'cita' ? 'text-amber-400' : 'text-rose-400'}`}>
                ⏰ {alarm.item.type === 'cita' ? 'Cita próxima' : 'Tarea por vencer'} — en 5 minutos
              </span>
            </div>

            <h3 className="text-white text-[13px] md:text-[14px] font-semibold truncate mb-1">{alarm.item.title}</h3>

            <div className="flex items-center gap-3 flex-wrap">
              {alarm.item.leadName && (
                <span className="text-[11px] font-medium text-white/60 flex items-center gap-1">
                  👤 {alarm.item.leadName}
                </span>
              )}
              <span className="text-[11px] font-medium text-white/60 flex items-center gap-1">
                🕐 {alarm.item.dueTime} • {alarm.item.dueDate}
              </span>
              {alarm.item.subtype && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${alarm.item.type === 'cita' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'}`}>
                  {alarm.item.subtype}
                </span>
              )}
            </div>

            <div className="mt-2 flex items-center gap-1 text-[9px] font-mono text-white/40">
              <AlertTriangle size={10} /> Sonando hace {formatElapsed(elapsed)}
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg ${alarm.item.type === 'cita' ? 'bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-amber-500/30' : 'bg-rose-500 text-rose-950 hover:bg-rose-400 shadow-rose-500/30'}`}
          >
            <BellOff size={14} /> Desactivar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Alarm System Component ─────────────────────────────────────
interface AlarmSystemProps {
  items: AlarmItem[];
  enabled?: boolean;
}

export const AlarmSystem = ({ items, enabled = true }: AlarmSystemProps) => {
  const [activeAlarms, setActiveAlarms] = useState<ActiveAlarm[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const checkAlarms = useCallback(() => {
    if (!enabled) return;

    const now = new Date();
    const fiveMinFromNow = new Date(now.getTime() + 5 * 60 * 1000);

    const newAlarms: ActiveAlarm[] = [];

    items.forEach(item => {
      if (dismissedIds.has(item.id)) return;
      if (activeAlarms.find(a => a.item.id === item.id)) return;

      try {
        const dueDateStr = `${item.dueDate}T${item.dueTime}:00`;
        const dueDate = new Date(dueDateStr);

        if (isNaN(dueDate.getTime())) return;

        // Check if the due time is within the next 5 minutes and not yet passed
        const timeDiff = dueDate.getTime() - now.getTime();
        if (timeDiff > 0 && timeDiff <= 5 * 60 * 1000) {
          newAlarms.push({ item, triggeredAt: new Date() });
        }
      } catch {}
    });

    if (newAlarms.length > 0) {
      setActiveAlarms(prev => [...prev, ...newAlarms]);
      toneGenerator.start(30000); // Play for 30 seconds
    }
  }, [items, enabled, dismissedIds, activeAlarms]);

  // Check every 15 seconds
  useEffect(() => {
    checkIntervalRef.current = setInterval(checkAlarms, 15000);
    // Initial check
    const t = setTimeout(checkAlarms, 1000);
    return () => {
      if (checkIntervalRef.current) clearInterval(checkIntervalRef.current);
      clearTimeout(t);
    };
  }, [checkAlarms]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { toneGenerator.stop(); };
  }, []);

  const dismissAlarm = (alarmId: string) => {
    toneGenerator.stop();
    setActiveAlarms(prev => prev.filter(a => a.item.id !== alarmId));
    setDismissedIds(prev => new Set(prev).add(alarmId));
  };

  const dismissAll = () => {
    toneGenerator.stop();
    activeAlarms.forEach(a => {
      setDismissedIds(prev => new Set(prev).add(a.item.id));
    });
    setActiveAlarms([]);
  };

  if (activeAlarms.length === 0) return null;

  return (
    <>
      {/* Show only the most recent alarm as a banner */}
      <AlarmBanner
        alarm={activeAlarms[activeAlarms.length - 1]}
        onDismiss={() => {
          if (activeAlarms.length === 1) {
            dismissAll();
          } else {
            dismissAlarm(activeAlarms[activeAlarms.length - 1].item.id);
          }
        }}
      />

      {/* If multiple alarms, show a count badge */}
      {activeAlarms.length > 1 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10001]">
          <button
            onClick={dismissAll}
            className="bg-slate-900/90 text-white px-4 py-2 rounded-xl text-[11px] md:text-[12px] font-semibold border border-slate-700 shadow-2xl backdrop-blur-sm flex items-center gap-2 hover:bg-slate-800 transition-all"
          >
            <Bell size={12} className="text-amber-400" />
            {activeAlarms.length} alarmas activas — Silenciar todas
          </button>
        </div>
      )}

      <style>{`
        @keyframes alarmSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-30px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes alarmPulseBar {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes alarmIconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes alarmBellShake {
          0% { transform: rotate(0deg); }
          25% { transform: rotate(10deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(-10deg); }
          100% { transform: rotate(0deg); }
        }
      `}</style>
    </>
  );
};

export default AlarmSystem;
