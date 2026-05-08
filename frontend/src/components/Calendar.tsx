import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, CheckCircle2, XCircle, MapPin, Phone as PhoneIcon, Users, FileSignature, Bookmark, RotateCcw, Bot, Trash2, Filter, Calendar as CalIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type EventType = 'visita' | 'llamada' | 'reunión' | 'seguimiento' | 'firma' | 'separación';
type EventStatus = 'pendiente' | 'completada' | 'cancelada';
type Priority = 'alta' | 'media' | 'baja';

interface CalEvent {
 id: number; title: string; type: EventType; date: string; time: string;
 client: string; status: EventStatus; priority: Priority; lead?: string; notes?: string;
}

const typeConfig: Record<EventType, { icon: any; color: string; bg: string; border: string }> = {
 visita: { icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
 llamada: { icon: PhoneIcon, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
 reunión: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
 seguimiento: { icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
 firma: { icon: FileSignature, color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20' },
 separación: { icon: Bookmark, color: 'text-indigo-600', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
};

export default function Calendar({ isDarkMode }: { isDarkMode?: boolean }) {
 const { token } = useAuth();
 const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
 const [view, setView] = useState<'month'|'week'|'day'>('month');
 const [filterType, setFilterType] = useState<EventType | 'todos'>('todos');
 const [events, setEvents] = useState<CalEvent[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (!token) return;
  setLoading(true);
  fetch(`${API_URL}/api/data/tasks`, { headers: { Authorization: `Bearer ${token}` } })
   .then(r => r.json())
   .then(data => {
    setEvents(data.map((t: any) => ({
     id: t.id, title: t.title, type: (t.description?.toLowerCase() || t.type?.toLowerCase() || 'visita') as EventType,
     date: t.due_date ? t.due_date.split('T')[0] : new Date().toISOString().split('T')[0],
     time: t.due_date ? new Date(t.due_date).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false}) : '12:00',
     client: t.lead_name || '', status: (t.status || 'pendiente') as EventStatus, priority: (t.priority || 'media') as Priority
    })));
    setLoading(false);
   })
   .catch(() => setLoading(false));
 }, [token, API_URL]);

 const [modal, setModal] = useState(false);
 const [editing, setEditing] = useState<CalEvent|null>(null);
 const todayStr = new Date().toISOString().split('T')[0];
 const [form, setForm] = useState({ title:'', type:'visita' as EventType, date: todayStr, time:'12:00', client:'', status:'pendiente' as EventStatus, priority:'media' as Priority, notes:'' });

 const openNew = (date?: string) => { setForm({ title:'', type:'visita', date: date||todayStr, time:'12:00', client:'', status:'pendiente', priority:'media', notes:'' }); setEditing(null); setModal(true); };
 const openEdit = (ev: CalEvent, e: React.MouseEvent) => { e.stopPropagation(); setForm({ ...ev, notes: ev.notes||'' }); setEditing(ev); setModal(true); };
 
 const save = (e: React.FormEvent) => {
  e.preventDefault();
  if(!form.title) return;
  if(editing) { setEvents(events.map(ev => ev.id===editing.id ? {...form, id:ev.id} : ev)); }
  else { setEvents([{...form, id:Date.now()}, ...events]); }
  setModal(false);
 };

 const del = () => { if(editing) { setEvents(events.filter(ev => ev.id !== editing.id)); setModal(false); } };

 const daysInMonth = 31; 
 const startDay = new Date(2026, 4, 1).getDay();
 const cells = Array.from({length:35}, (_,i) => { const d = i-startDay+1; return d>0&&d<=daysInMonth ? d : null; });
 const filteredEvents = events.filter(e => filterType === 'todos' || e.type === filterType);

 return (
  <div className="flex-1 flex flex-col overflow-hidden bg-surface-base">
   
   {/* Header */}
   <div className="p-4 md:p-6 border-b border-edge flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface">
     <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/10 text-accent">
        <CalIcon size={22} />
      </div>
      <div>
        <h1 className="h1">Agenda y tareas</h1>
        <p className="body-text text-sm">Seguimiento de mayo 2026</p>
      </div>
     </div>
     <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="flex p-0.5 rounded-lg border border-edge bg-surface w-full md:w-auto">
        {(['month','week','day'] as const).map(v => (
         <button key={v} onClick={() => setView(v)} className={`flex-1 md:px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${view===v ? 'bg-accent text-content' : 'text-content-muted hover:text-content'}`}>
          {v==='month'?'Mes':v==='week'?'Semana':'Día'}
         </button>
        ))}
      </div>
      <button onClick={() => openNew()} className="btn-primary px-3 py-2">
        <Plus size={18} />
      </button>
     </div>
   </div>

   {/* Filter & Nav */}
   <div className="px-4 md:px-6 py-3 border-b border-edge flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface">
     <div className="flex items-center gap-3 w-full sm:w-auto">
      <div className="relative flex-1 sm:w-60">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" size={14} />
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="input-field pl-9 text-xs py-2">
         <option value="todos">Todos los eventos</option>
         {(Object.keys(typeConfig) as EventType[]).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
     </div>
     <div className="flex items-center gap-4">
      <button className="p-2 rounded-lg border border-edge text-content-muted hover:text-content transition-colors"><ChevronLeft size={16}/></button>
      <span className="text-xs font-semibold text-content">Mayo 2026</span>
      <button className="p-2 rounded-lg border border-edge text-content-muted hover:text-content transition-colors"><ChevronRight size={16}/></button>
     </div>
   </div>

   {/* Calendar Grid */}
   <div className="flex-1 overflow-y-auto p-4 md:p-6">
     <div className="h-full min-h-[600px] rounded-xl border border-edge bg-surface overflow-hidden flex flex-col">
      <div className="grid grid-cols-7 border-b border-edge bg-surface-inset">
        {['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'].map(d => (
         <div key={d} className="py-3 text-center text-xs font-medium text-content-muted">{d}</div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7">
        {view === 'month' && cells.map((day, i) => {
         const ds = day ? `2026-05-${day.toString().padStart(2,'0')}` : '';
         const dayEvents = filteredEvents.filter(e => e.date === ds);
         const isToday = day === 5;
         return (
          <div key={i} onClick={() => day && openNew(ds)}
           className={`border-b border-r border-edge p-2 flex flex-col gap-1 cursor-pointer transition-colors min-h-[100px] overflow-hidden ${!day ? 'bg-surface-inset/50' : 'hover:bg-surface-inset'} ${isToday ? 'bg-accent/5' : ''}`}>
           {day && (
            <>
              <div className="flex justify-between items-center mb-0.5">
               <span className={`text-xs font-medium ${isToday ? 'text-accent' : 'text-content-muted'}`}>{day}</span>
               {dayEvents.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
              </div>
              <div className="space-y-1 overflow-hidden">
               {dayEvents.slice(0, 3).map(ev => (
                <div key={ev.id} onClick={(e) => openEdit(ev, e)} className={`px-1.5 py-0.5 rounded text-xs font-medium truncate border transition-colors hover:opacity-80 ${typeConfig[ev.type].bg} ${typeConfig[ev.type].color} ${typeConfig[ev.type].border}`}>
                  {ev.time} {ev.title}
                </div>
               ))}
               {dayEvents.length > 3 && <div className="text-xs text-content-muted pl-1">+{dayEvents.length - 3} más</div>}
              </div>
            </>
           )}
          </div>
         );
        })}
      </div>
     </div>
   </div>

   {/* Modal */}
   {modal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
     <div className="rounded-xl border border-edge bg-surface shadow-lg w-full max-w-lg overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-edge flex justify-between items-center bg-surface-inset">
        <div>
         <h2 className="h2">{editing ? 'Editar evento' : 'Nueva cita'}</h2>
         <p className="label-text mt-0.5">Detalles de la agenda comercial</p>
        </div>
        <button onClick={() => setModal(false)} className="p-2 rounded-lg border border-edge text-content-muted hover:text-content transition-colors"><X size={18}/></button>
      </div>
      
      <form onSubmit={save} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-1.5">
           <label className="label-text">Tipo de actividad</label>
           <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="input-field">
            {(Object.keys(typeConfig) as EventType[]).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
           </select>
         </div>
         <div className="space-y-1.5">
           <label className="label-text">Prioridad</label>
           <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as any})} className="input-field">
            <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
           </select>
         </div>
        </div>
        <div className="space-y-1.5">
         <label className="label-text">Título descriptivo</label>
         <input required type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ej: Visita al proyecto Mirador..." className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
         <div className="space-y-1.5">
           <label className="label-text">Fecha</label>
           <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="input-field" />
         </div>
         <div className="space-y-1.5">
           <label className="label-text">Hora</label>
           <input required type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="input-field" />
         </div>
        </div>
        <div className="space-y-1.5">
         <label className="label-text">Cliente / Lead vinculado</label>
         <div className="relative">
           <User className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" size={16} />
           <input type="text" value={form.client} onChange={e => setForm({...form, client: e.target.value})} placeholder="Nombre del cliente..." className="input-field pl-9" />
         </div>
        </div>
        <div className="space-y-1.5">
         <label className="label-text">Notas adicionales</label>
         <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Instrucciones para el asesor..." className="input-field resize-none h-24" />
        </div>
      </form>

      <div className="p-6 border-t border-edge flex flex-col sm:flex-row gap-3 bg-surface-inset">
        {editing && <button type="button" onClick={del} className="flex-1 py-2 text-sm font-medium text-red-500 border border-red-500/20 rounded-lg hover:bg-red-500/5 transition-colors">Eliminar</button>}
        <button onClick={save} className="flex-[2] btn-primary py-2">
         {editing ? 'Actualizar evento' : 'Programar en agenda'}
        </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}
