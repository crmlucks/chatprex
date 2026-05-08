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
  }, [token]);

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
  const hours = Array.from({length:14}, (_,i) => i+7); // 7:00 to 20:00
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
                  {Object.keys(typeConfig).map(t => <option key={t} value={t}>{t}</option>)}
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
                                <div key={ev.id} className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter truncate border ${typeConfig[ev.type].bg} ${typeConfig[ev.type].color} ${typeConfig[ev.type].border}`}>
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
                        {Object.keys(typeConfig).map(t => <option key={t} value={t}>{t}</option>)}
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


  return (
    <div className={`flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-full pb-20 md:pb-0 relative transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      {/* HEADER */}
      <div className={`h-16 border-b px-4 md:px-8 flex items-center justify-between shrink-0 transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center gap-2 md:gap-4">
          <h1 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Agenda</h1>
          <div className="hidden sm:flex items-center gap-2">
            <button className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}><ChevronLeft size={18}/></button>
            <span className={`font-semibold text-[13px] md:text-[14px] min-w-[100px] text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Mayo 2026</span>
            <button className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}><ChevronRight size={18}/></button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex p-0.5 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            {(['month','week','day'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-[12px] font-semibold rounded-md transition-all ${view===v ? (isDarkMode ? 'bg-slate-700 shadow-sm text-primary' : 'bg-white shadow-sm text-slate-800') : 'text-slate-500 hover:text-slate-400'}`}>
                {v==='month'?'Mes':v==='week'?'Semana':'Día'}
              </button>
            ))}
          </div>
          <button onClick={() => openNew()} className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg text-[12px] md:text-[13px] font-semibold hover:bg-primary-dark shadow-lg shadow-primary/20 active:scale-95 transition-all">
            <Plus size={18}/> <span className="hidden sm:inline">Nuevo Evento</span>
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className={`px-4 md:px-8 py-3 border-b transition-colors flex items-center justify-between ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex gap-2 items-center">
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value as EventType | 'Todos')}
            className={`px-3 py-2 rounded-xl text-sm font-semibold outline-none transition-all ${isDarkMode ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-slate-700 border border-slate-200 focus:border-primary'}`}
          >
            <option value="Todos">Todos los Eventos</option>
            {(Object.keys(typeConfig) as EventType[]).map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <button className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-primary' : 'bg-white text-slate-500 border border-slate-200 hover:text-primary'}`}>
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar">
        <div className={`border rounded-2xl shadow-sm overflow-hidden h-full flex flex-col transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>

          {/* MONTH VIEW */}
          {view === 'month' && (<>
            <div className={`grid grid-cols-7 border-b text-center text-[11px] md:text-[12px] font-semibold py-3 transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              <div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div>
            </div>
            <div className="flex-1 grid grid-cols-7 grid-rows-5 min-h-[500px]">
              {cells.map((day,i) => {
                const ds = day ? fmt(day) : '';
                const de = filteredEvents.filter(e => e.date===ds);
                const today = day===5;
                return (
                  <div key={i}
                    onDragOver={e => { if(day) e.preventDefault(); }}
                    onDrop={() => { if(day) handleDrop(fmt(day)); }}
                    onClick={() => { if(day) openNew(fmt(day)); }}
                    className={`border-b border-r p-1.5 overflow-y-auto cursor-pointer transition-colors ${isDarkMode ? 'border-slate-800 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50/50'} ${!day ? (isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50/80') : today ? (isDarkMode ? 'bg-primary/20' : 'bg-primary/5') : ''}`}>
                    {day && (<>
                      <div className="flex justify-end mb-1">
                        <span className={`text-[10px] md:text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${today?'bg-primary text-white shadow-sm':'text-slate-600'}`}>{day}</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {de.map(ev => <EventPill key={ev.id} ev={ev} compact/>)}
                      </div>
                    </>)}
                  </div>
                );
              })}
            </div>
          </>)}

          {/* WEEK VIEW */}
          {view === 'week' && (
            <div className="flex-1 overflow-auto">
              <div className={`grid grid-cols-8 border-b sticky top-0 z-10 ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`p-2 border-r ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}></div>
                {weekDays.map((d,i) => (
                  <div key={d} className={`p-2 text-center border-r ${isDarkMode ? 'border-slate-800' : 'border-slate-200'} ${d===15 ? (isDarkMode ? 'bg-primary/20' : 'bg-primary/5') : ''}`}>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">{dayName[i]}</div>
                    <div className={`text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${d===15 ? 'bg-primary text-white shadow-sm' : (isDarkMode ? 'text-slate-400' : 'text-slate-700')}`}>{d}</div>
                  </div>
                ))}
              </div>
              <div className="min-w-[700px]">
                {hours.map(h => (
                  <div key={h} className={`grid grid-cols-8 border-b min-h-[70px] ${isDarkMode ? 'border-slate-800/50' : 'border-slate-50'}`}>
                    <div className={`p-2 text-right text-[10px] font-medium border-r ${isDarkMode ? 'text-slate-500 border-slate-800 bg-slate-900/30' : 'text-slate-400 border-slate-100 bg-slate-50/50'}`}>
                      {h.toString().padStart(2,'0')}:00
                    </div>
                    {weekDays.map(d => {
                      const ds = fmt(d); const ts = h.toString().padStart(2,'0');
                      const he = filteredEvents.filter(e => e.date===ds && e.time.startsWith(ts));
                      return (
                        <div key={d}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => handleDrop(ds, `${ts}:00`)}
                          onClick={() => openNew(ds, `${ts}:00`)}
                          className={`border-r p-1 cursor-pointer transition-colors ${isDarkMode ? 'border-slate-800 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50/50'} ${d===15 ? (isDarkMode ? 'bg-primary/5' : 'bg-primary/[0.02]') : ''}`}>
                          {he.map(ev => <EventPill key={ev.id} ev={ev}/>)}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DAY VIEW */}
          {view === 'day' && (
            <div className="flex-1 overflow-y-auto">
              <div className={`sticky top-0 border-b p-3 z-10 flex items-center justify-center ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Lunes, 5 de Mayo 2026</h2>
              </div>
              {hours.map(h => {
                const ts = h.toString().padStart(2,'0')+':00';
                const he = filteredEvents.filter(e => e.date==='2026-05-05' && e.time.startsWith(h.toString().padStart(2,'0')));
                // Show events from day 15 for demo
                const he2 = filteredEvents.filter(e => e.date==='2026-05-15' && e.time.startsWith(h.toString().padStart(2,'0')));
                const all = [...he, ...he2];
                return (
                  <div key={h} className={`flex min-h-[80px] group border-b ${isDarkMode ? 'border-slate-800/50' : 'border-slate-50'}`}
                    onDragOver={e => e.preventDefault()} onDrop={() => handleDrop('2026-05-15', ts)}>
                    <div className={`w-20 pr-4 text-right pt-2 border-r text-xs font-medium ${isDarkMode ? 'border-slate-800 text-slate-500 bg-slate-900/30' : 'border-slate-100 text-slate-400 bg-slate-50/50'}`}>{ts}</div>
                    <div className={`flex-1 p-2 flex flex-col gap-2 cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50/50'}`} onClick={() => openNew('2026-05-15', ts)}>
                      {all.map(ev => <EventBlock key={ev.id} ev={ev}/>)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className={`rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <h2 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{editing ? 'Editar Evento' : 'Nuevo Evento'}</h2>
              <button onClick={() => setModal(false)} className={`p-1.5 rounded-full shadow-sm transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white text-slate-400 hover:text-slate-600'}`}><X size={18}/></button>
            </div>
            <form onSubmit={save} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Type selector */}
              <div>
                <label className={`text-[9px] font-bold tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>tipo de evento</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(Object.keys(typeConfig) as EventType[]).map(t => { const c = typeConfig[t]; const I = c.icon; return (
                    <button key={t} type="button" onClick={() => setForm({...form, type:t})}
                      className={`p-2 rounded-lg border text-[10px] font-black uppercase tracking-tighter flex items-center justify-center gap-1.5 transition-all ${form.type===t ? `${isDarkMode ? 'bg-primary/20 border-primary text-primary shadow-lg shadow-primary/20' : `${c.bg} ${c.color} border-current shadow-sm`} scale-[1.05]` : (isDarkMode ? 'border-slate-800 text-slate-500 hover:bg-slate-800/50' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}`}>
                      <I size={14}/>{t}
                    </button>
                  );})}
                </div>
              </div>
              <div>
                <label className={`text-[9px] font-bold tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>título</label>
                <input required type="text" value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="Ej. Visita Penthouse Lux..." className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[9px] font-bold tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>fecha</label>
                  <input required type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})} className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}/>
                </div>
                <div>
                  <label className={`text-[9px] font-bold tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>hora</label>
                  <input required type="time" value={form.time} onChange={e => setForm({...form, time:e.target.value})} className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[9px] font-bold tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>lead / cliente</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 mt-0.5"/>
                    <input type="text" value={form.client} onChange={e => setForm({...form, client:e.target.value})} placeholder="Buscar lead..." className={`w-full mt-1 pl-8 pr-3 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`}/>
                  </div>
                </div>
                <div>
                  <label className={`text-[9px] font-bold tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>prioridad</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority:e.target.value as Priority})} className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                    <option>Alta</option><option>Media</option><option>Baja</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`text-[9px] font-bold tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>estado</label>
                <select value={form.status} onChange={e => setForm({...form, status:e.target.value as EventStatus})} className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                  <option value="pendiente">⏳ Pendiente</option><option value="completada">✅ Completada</option><option value="cancelada">❌ Cancelada</option>
                </select>
              </div>
              <div>
                <label className={`text-[9px] font-bold tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>notas (opcional)</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} rows={2} placeholder="Detalles adicionales..." className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`}/>
              </div>
              <div className="flex gap-3 pt-2">
                {editing && <button type="button" onClick={del} className={`px-4 py-2.5 border rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isDarkMode ? 'border-rose-900/50 text-rose-500 hover:bg-rose-500/10' : 'border-rose-200 text-rose-600 hover:bg-rose-50'}`}><Trash2 size={14}/>Eliminar</button>}
                <button type="submit" className="flex-1 bg-primary text-white p-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  {editing ? 'actualizar evento' : 'guardar en calendario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
