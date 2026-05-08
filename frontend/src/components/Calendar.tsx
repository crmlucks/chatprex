import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, CheckCircle2, XCircle, MapPin, Phone as PhoneIcon, Users, FileSignature, Bookmark, RotateCcw, Bot, Trash2, Filter, Calendar as CalIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type EventType = 'Visita' | 'Llamada' | 'Reunión' | 'Seguimiento' | 'Firma' | 'Separación';
type EventStatus = 'pendiente' | 'completada' | 'cancelada';
type Priority = 'Alta' | 'Media' | 'Baja';

interface CalEvent {
  id: number; title: string; type: EventType; date: string; time: string;
  client: string; status: EventStatus; priority: Priority; lead?: string; notes?: string;
}

const typeConfig: Record<EventType, { icon: any; color: string; bg: string; border: string }> = {
  Visita: { icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  Llamada: { icon: PhoneIcon, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  Reunión: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  Seguimiento: { icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  Firma: { icon: FileSignature, color: 'text-rose-600', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  Separación: { icon: Bookmark, color: 'text-indigo-600', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
};

export default function Calendar({ isDarkMode }: { isDarkMode?: boolean }) {
  const { token } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [view, setView] = useState<'month'|'week'|'day'>('month');
  const [filterType, setFilterType] = useState<EventType | 'Todos'>('Todos');
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`${API_URL}/api/data/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setEvents(data.map((t: any) => ({
          id: t.id, title: t.title, type: (t.description || t.type || 'Visita') as EventType,
          date: t.due_date ? t.due_date.split('T')[0] : new Date().toISOString().split('T')[0],
          time: t.due_date ? new Date(t.due_date).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false}) : '12:00',
          client: t.lead_name || '', status: (t.status || 'pendiente') as EventStatus, priority: (t.priority || 'Media') as Priority
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, API_URL]);

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CalEvent|null>(null);
  const todayStr = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({ title:'', type:'Visita' as EventType, date: todayStr, time:'12:00', client:'', status:'pendiente' as EventStatus, priority:'Media' as Priority, notes:'' });

  const openNew = (date?: string, time?: string) => { setForm({ title:'', type:'Visita', date: date||todayStr, time: time||'12:00', client:'', status:'pendiente', priority:'Media', notes:'' }); setEditing(null); setModal(true); };
  const openEdit = (ev: CalEvent, e: React.MouseEvent) => { e.stopPropagation(); setForm({ ...ev, notes: ev.notes||'' }); setEditing(ev); setModal(true); };
  
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if(!form.title) return;
    if(editing) {
      setEvents(events.map(ev => ev.id===editing.id ? {...form, id:ev.id} : ev));
    } else {
      setEvents([{...form, id:Date.now()}, ...events]);
    }
    setModal(false);
  };

  const del = () => { if(editing) { setEvents(events.filter(ev => ev.id !== editing.id)); setModal(false); } };

  const daysInMonth = 31; 
  const startDay = new Date(2026, 4, 1).getDay(); // Mayo 2026 empieza Viernes (5)
  const cells = Array.from({length:35}, (_,i) => { const d = i-startDay+1; return d>0&&d<=daysInMonth ? d : null; });
  const filteredEvents = events.filter(e => filterType === 'Todos' || e.type === filterType);

  const inputCls = `w-full p-2.5 rounded-xl border text-xs font-bold outline-none transition-all focus:ring-4 focus:ring-primary/10 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary shadow-inner'}`;
  const labelCls = `text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1`;

  return (
    <div className={`flex-1 flex flex-col overflow-hidden transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      
      {/* Dynamic Header */}
      <div className={`p-4 md:p-6 border-b flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
         <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-primary/20 text-primary shadow-inner' : 'bg-primary/10 text-primary'}`}>
               <CalIcon size={24} />
            </div>
            <div>
               <h1 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Agenda y Tareas</h1>
               <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Seguimiento de Mayo 2026</p>
            </div>
         </div>
         
         <div className="flex items-center gap-2 w-full md:w-auto">
            <div className={`flex p-1 rounded-xl w-full md:w-auto ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-100/50'}`}>
               {(['month','week','day'] as const).map(v => (
                 <button key={v} onClick={() => setView(v)} className={`flex-1 md:px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${view===v ? (isDarkMode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white shadow-md text-primary') : 'text-slate-500 hover:text-slate-400'}`}>
                   {v==='month'?'Mes':v==='week'?'Semana':'Día'}
                 </button>
               ))}
            </div>
            <button onClick={() => openNew()} className="p-3 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 active:scale-95 transition-all">
               <Plus size={20} />
            </button>
         </div>
      </div>

      {/* Filter & Nav Bar */}
      <div className={`px-4 md:px-6 py-3 border-b flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors ${isDarkMode ? 'bg-[#1E1E1E]/50 border-slate-800' : 'bg-white border-slate-100'}`}>
         <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
               <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
               <select value={filterType} onChange={e => setFilterType(e.target.value as any)} 
                 className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest outline-none appearance-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                  <option value="Todos">Todos los Eventos</option>
                  {(Object.keys(typeConfig) as EventType[]).map(t => <option key={t} value={t}>{t}</option>)}
               </select>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <button className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}><ChevronLeft size={20}/></button>
            <span className={`text-xs font-black uppercase tracking-[3px] ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Mayo 2026</span>
            <button className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-500 hover:text-slate-800'}`}><ChevronRight size={20}/></button>
         </div>
      </div>

      {/* Calendar Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
         <div className={`h-full min-h-[600px] rounded-[32px] border shadow-2xl overflow-hidden flex flex-col transition-all ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            
            {/* Week Headers */}
            <div className={`grid grid-cols-7 border-b transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
               {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
                 <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-[2px] text-slate-500">{d}</div>
               ))}
            </div>

            {/* View Render */}
            <div className="flex-1 grid grid-cols-7">
               {view === 'month' && cells.map((day, i) => {
                 const ds = day ? `2026-05-${day.toString().padStart(2,'0')}` : '';
                 const dayEvents = filteredEvents.filter(e => e.date === ds);
                 const isToday = day === 5;

                 return (
                   <div key={i} onClick={() => day && openNew(ds)}
                     className={`border-b border-r p-2 flex flex-col gap-1 cursor-pointer transition-all min-h-[100px] overflow-hidden ${!day ? (isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50/50') : (isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50/50')} ${isToday ? (isDarkMode ? 'bg-primary/10' : 'bg-primary/5') : ''} ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      {day && (
                        <>
                           <div className="flex justify-between items-center mb-1">
                              <span className={`text-xs font-black ${isToday ? 'text-primary' : 'text-slate-500'}`}>{day}</span>
                              {dayEvents.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary/50" />}
                           </div>
                           <div className="space-y-1 overflow-hidden">
                              {dayEvents.slice(0, 3).map(ev => (
                                <div key={ev.id} onClick={(e) => openEdit(ev, e)} className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter truncate border ${typeConfig[ev.type].bg} ${typeConfig[ev.type].color} ${typeConfig[ev.type].border}`}>
                                   {ev.time} {ev.title}
                                </div>
                              ))}
                              {dayEvents.length > 3 && <div className="text-[8px] font-black text-slate-400 pl-1">+{dayEvents.length - 3} MÁS</div>}
                           </div>
                        </>
                      )}
                   </div>
                 );
               })}
            </div>
         </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`rounded-[40px] shadow-2xl border w-full max-w-lg overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`px-8 py-6 border-b flex justify-between items-center transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-50'}`}>
               <div>
                  <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{editing ? 'Editar Evento' : 'Nueva Cita'}</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Detalles de la Agenda</p>
               </div>
               <button onClick={() => setModal(false)} className={`p-2.5 rounded-2xl transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white border shadow-sm text-slate-400 hover:text-slate-800'}`}><X size={20}/></button>
            </div>
            
            <form onSubmit={save} className="p-8 space-y-6 overflow-y-auto custom-scrollbar max-h-[70vh]">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className={labelCls}>tipo de actividad</label>
                     <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className={inputCls}>
                        {(Object.keys(typeConfig) as EventType[]).map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className={labelCls}>prioridad</label>
                     <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className={inputCls}>
                        <option>Alta</option><option>Media</option><option>Baja</option>
                     </select>
                  </div>
               </div>

               <div className="space-y-2">
                  <label className={labelCls}>título descriptivo</label>
                  <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej: Visita al Proyecto Mirador..." className={inputCls} />
               </div>

               <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className={labelCls}>fecha</label>
                     <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={inputCls} />
                  </div>
                  <div className="space-y-2">
                     <label className={labelCls}>hora</label>
                     <input required type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className={inputCls} />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className={labelCls}>cliente / lead vinculado</label>
                  <div className="relative">
                     <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                     <input type="text" value={form.client} onChange={e => setForm({...form, client: e.target.value})} placeholder="Nombre del cliente..." className={inputCls + " pl-9"} />
                  </div>
               </div>

               <div className="space-y-2">
                  <label className={labelCls}>notas adicionales</label>
                  <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Instrucciones para el asesor..." className={inputCls + " resize-none"} />
               </div>
            </form>

            <div className={`p-8 border-t flex flex-col sm:flex-row gap-4 transition-colors ${isDarkMode ? 'bg-[#181619]' : 'bg-slate-50/50'}`}>
               {editing && <button type="button" onClick={del} className="flex-1 py-4 text-[11px] font-black uppercase tracking-widest text-rose-500 border border-rose-500/20 rounded-2xl hover:bg-rose-500/5 transition-all">Eliminar</button>}
               <button onClick={save} className="flex-[2] py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[2px] rounded-2xl shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95">
                  {editing ? 'Actualizar Evento' : 'Programar en Agenda'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
