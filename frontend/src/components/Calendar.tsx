import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, CheckCircle2, MapPin, Phone as PhoneIcon, Users, FileSignature, Bookmark, RotateCcw, Trash2, Filter, Calendar as CalIcon, ListTodo } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

type EventType = 'visita' | 'llamada' | 'reunión' | 'seguimiento' | 'firma' | 'cita' | 'tarea';
type EventStatus = 'pendiente' | 'completada' | 'cancelada';
type Priority = 'alta' | 'media' | 'baja';

interface CalEvent {
 id: number; title: string; type: EventType; date: string; time: string;
 client: string; status: EventStatus; priority: Priority; lead_id?: number; notes?: string;
}

const typeConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
 visita: { icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
 llamada: { icon: PhoneIcon, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
 reunión: { icon: Users, color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
 seguimiento: { icon: RotateCcw, color: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
 firma: { icon: FileSignature, color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20' },
 cita: { icon: Bookmark, color: 'text-indigo-600', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
 tarea: { icon: ListTodo, color: 'text-slate-600', bg: 'bg-slate-500/10', border: 'border-slate-500/20' },
};

const defaultTypeStyle = { icon: ListTodo, color: 'text-slate-600', bg: 'bg-slate-500/10', border: 'border-slate-500/20' };

const getTypeStyle = (type: string) => typeConfig[type?.toLowerCase()] || defaultTypeStyle;

export default function Calendar({ isDarkMode }: { isDarkMode?: boolean }) {
 const { token } = useAuth();
 const { showToast } = useToast();
 const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
 const dc = isDarkMode;
 const [view, setView] = useState<'month'|'week'|'day'>('month');
 const [filterType, setFilterType] = useState<string>('todos');
 const [events, setEvents] = useState<CalEvent[]>([]);
 const [loading, setLoading] = useState(true);

 // Dynamic month navigation
 const [currentDate, setCurrentDate] = useState(new Date());
 const year = currentDate.getFullYear();
 const month = currentDate.getMonth();
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const startDay = new Date(year, month, 1).getDay();
 const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
 const cells = Array.from({ length: totalCells }, (_, i) => {
  const d = i - startDay + 1;
  return d > 0 && d <= daysInMonth ? d : null;
 });
 const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
 const todayDate = new Date();

 const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
 const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

 // Fetch events from API
 const fetchEvents = () => {
  if (!token) return;
  setLoading(true);
  fetch(`${API_URL}/api/data/tasks`, { headers: { Authorization: `Bearer ${token}` } })
   .then(r => r.json())
   .then(data => {
    if (!Array.isArray(data)) { setLoading(false); return; }
    setEvents(data.map((t: any) => ({
     id: t.id,
     title: t.title || 'Sin título',
     type: (t.type?.toLowerCase() || 'tarea') as EventType,
     date: t.due_date ? t.due_date.split('T')[0] : new Date().toISOString().split('T')[0],
     time: t.due_date ? new Date(t.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '12:00',
     client: t.lead_name || '',
     status: (t.status || 'pendiente') as EventStatus,
     priority: (t.description?.toLowerCase() === 'alta' ? 'alta' : t.description?.toLowerCase() === 'baja' ? 'baja' : 'media') as Priority,
     lead_id: t.lead_id,
     notes: t.description || ''
    })));
    setLoading(false);
   })
   .catch(() => setLoading(false));
 };

 useEffect(() => { fetchEvents(); }, [token]);

 const [modal, setModal] = useState(false);
 const [editing, setEditing] = useState<CalEvent | null>(null);
 const todayStr = new Date().toISOString().split('T')[0];
 const [form, setForm] = useState({ title: '', type: 'cita' as EventType, date: todayStr, time: '12:00', client: '', status: 'pendiente' as EventStatus, priority: 'media' as Priority, notes: '' });

 const openNew = (date?: string) => {
  setForm({ title: '', type: 'cita', date: date || todayStr, time: '12:00', client: '', status: 'pendiente', priority: 'media', notes: '' });
  setEditing(null);
  setModal(true);
 };

 const openEdit = (ev: CalEvent, e: React.MouseEvent) => {
  e.stopPropagation();
  setForm({ title: ev.title, type: ev.type, date: ev.date, time: ev.time, client: ev.client, status: ev.status, priority: ev.priority, notes: ev.notes || '' });
  setEditing(ev);
  setModal(true);
 };

 const save = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!form.title) return;
  try {
   if (editing) {
    await fetch(`${API_URL}/api/data/tasks/${editing.id}`, {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
     body: JSON.stringify({
      title: form.title,
      description: form.priority,
      status: form.status,
      due_date: `${form.date}T${form.time}`
     })
    });
    showToast('Evento actualizado', 'success');
   } else {
    await fetch(`${API_URL}/api/data/tasks`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
     body: JSON.stringify({
      title: form.title,
      description: form.priority,
      type: form.type,
      status: 'pendiente',
      due_date: `${form.date}T${form.time}`,
      lead_id: null
     })
    });
    showToast('Evento creado', 'success');
   }
   fetchEvents();
   setModal(false);
  } catch {
   showToast('Error al guardar', 'error');
  }
 };

 const del = async () => {
  if (!editing) return;
  try {
   await fetch(`${API_URL}/api/data/tasks/${editing.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
   });
   showToast('Evento eliminado', 'info');
   fetchEvents();
   setModal(false);
  } catch {
   showToast('Error al eliminar', 'error');
  }
 };

 const toggleStatus = async (ev: CalEvent, e: React.MouseEvent) => {
  e.stopPropagation();
  const newStatus = ev.status === 'completada' ? 'pendiente' : 'completada';
  try {
   await fetch(`${API_URL}/api/data/tasks/${ev.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: ev.title, description: ev.notes, status: newStatus, due_date: `${ev.date}T${ev.time}` })
   });
   setEvents(events.map(x => x.id === ev.id ? { ...x, status: newStatus } : x));
  } catch {}
 };

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
        <h1 className="h1">Agenda y Tareas</h1>
        <p className="body-text text-sm">{monthNames[month]} {year} • {events.length} eventos</p>
      </div>
     </div>
     <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="flex p-0.5 rounded-lg border border-edge bg-surface w-full md:w-auto">
        {(['month', 'week', 'day'] as const).map(v => (
         <button key={v} onClick={() => setView(v)} className={`flex-1 md:px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${view === v ? 'bg-accent text-content' : 'text-content-muted hover:text-content'}`}>
          {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
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
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field pl-9 text-xs py-2">
         <option value="todos">Todos los eventos</option>
         {Object.keys(typeConfig).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>
     </div>
     <div className="flex items-center gap-4">
      <button onClick={prevMonth} className="p-2 rounded-lg border border-edge text-content-muted hover:text-content transition-colors"><ChevronLeft size={16} /></button>
      <span className="text-xs font-semibold text-content min-w-[120px] text-center">{monthNames[month]} {year}</span>
      <button onClick={nextMonth} className="p-2 rounded-lg border border-edge text-content-muted hover:text-content transition-colors"><ChevronRight size={16} /></button>
     </div>
   </div>

   {/* Calendar Grid */}
   <div className="flex-1 overflow-y-auto p-4 md:p-6">
    {loading ? (
     <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
     </div>
    ) : (
     <div className="h-full min-h-[600px] rounded-xl border border-edge bg-surface overflow-hidden flex flex-col">
      <div className="grid grid-cols-7 border-b border-edge bg-surface-inset">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
         <div key={d} className="py-3 text-center text-xs font-medium text-content-muted">{d}</div>
        ))}
      </div>
      <div className="flex-1 grid grid-cols-7">
        {cells.map((day, i) => {
         const ds = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
         const dayEvents = filteredEvents.filter(e => e.date === ds);
         const isToday = day === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();
         return (
          <div key={i} onClick={() => day && openNew(ds)}
           className={`border-b border-r border-edge p-2 flex flex-col gap-1 cursor-pointer transition-colors min-h-[100px] overflow-hidden ${!day ? 'bg-surface-inset/50' : 'hover:bg-surface-inset'} ${isToday ? 'bg-accent/5' : ''}`}>
           {day && (
            <>
              <div className="flex justify-between items-center mb-0.5">
               <span className={`text-xs font-medium ${isToday ? 'bg-accent text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-content-muted'}`}>{day}</span>
               {dayEvents.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
              </div>
              <div className="space-y-1 overflow-hidden">
               {dayEvents.slice(0, 3).map(ev => {
                const style = getTypeStyle(ev.type);
                return (
                 <div key={ev.id} onClick={(e) => openEdit(ev, e)}
                  className={`px-1.5 py-0.5 rounded text-xs font-medium truncate border transition-colors hover:opacity-80 ${style.bg} ${style.color} ${style.border} ${ev.status === 'completada' ? 'opacity-50 line-through' : ''}`}>
                  {ev.time} {ev.title}
                 </div>
                );
               })}
               {dayEvents.length > 3 && <div className="text-xs text-content-muted pl-1">+{dayEvents.length - 3} más</div>}
              </div>
            </>
           )}
          </div>
         );
        })}
      </div>
     </div>
    )}
   </div>

   {/* Sidebar: Today's tasks */}
   {view === 'day' && (
    <div className="border-t border-edge p-6 bg-surface max-h-[40vh] overflow-y-auto">
     <h3 className="text-sm font-bold text-content mb-4">Tareas del día ({todayStr})</h3>
     <div className="space-y-2">
      {filteredEvents.filter(e => e.date === todayStr).length === 0 && (
       <p className="text-xs text-content-muted italic">Sin eventos programados para hoy.</p>
      )}
      {filteredEvents.filter(e => e.date === todayStr).map(ev => {
       const style = getTypeStyle(ev.type);
       const Icon = style.icon;
       return (
        <div key={ev.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${dc ? 'bg-surface-raised/40 border-edge' : 'bg-surface border-edge hover:shadow-sm'}`}>
         <button onClick={(e) => toggleStatus(ev, e)} className={`shrink-0 ${ev.status === 'completada' ? 'text-emerald-500' : 'text-content-muted hover:text-accent'}`}>
          <CheckCircle2 size={18} />
         </button>
         <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${style.bg} ${style.color}`}><Icon size={14} /></div>
         <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold truncate ${ev.status === 'completada' ? 'line-through text-content-muted' : 'text-content'}`}>{ev.title}</p>
          <p className="text-[10px] text-content-muted">{ev.time} • {ev.client || 'Sin cliente'}</p>
         </div>
         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${ev.priority === 'alta' ? 'bg-rose-500/10 text-rose-500' : ev.priority === 'baja' ? 'bg-slate-500/10 text-slate-500' : 'bg-blue-500/10 text-blue-500'}`}>{ev.priority}</span>
        </div>
       );
      })}
     </div>
    </div>
   )}

   {/* Modal */}
   {modal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 animate-in fade-in duration-200">
     <div className="rounded-xl border border-edge bg-surface shadow-lg w-full max-w-lg overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-edge flex justify-between items-center bg-surface-inset">
        <div>
         <h2 className="h2">{editing ? 'Editar evento' : 'Nueva cita'}</h2>
         <p className="label-text mt-0.5">Detalles de la agenda comercial</p>
        </div>
        <button onClick={() => setModal(false)} className="p-2 rounded-lg border border-edge text-content-muted hover:text-content transition-colors"><X size={18} /></button>
      </div>

      <form onSubmit={save} className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="space-y-1.5">
           <label className="label-text">Tipo de actividad</label>
           <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="input-field">
            {Object.keys(typeConfig).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
           </select>
         </div>
         <div className="space-y-1.5">
           <label className="label-text">Prioridad</label>
           <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })} className="input-field">
            <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
           </select>
         </div>
        </div>
        <div className="space-y-1.5">
         <label className="label-text">Título descriptivo</label>
         <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Visita al proyecto Mirador..." className="input-field" />
        </div>
        <div className="grid grid-cols-2 gap-4">
         <div className="space-y-1.5">
           <label className="label-text">Fecha</label>
           <input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input-field" />
         </div>
         <div className="space-y-1.5">
           <label className="label-text">Hora</label>
           <input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="input-field" />
         </div>
        </div>
        <div className="space-y-1.5">
         <label className="label-text">Cliente / Lead vinculado</label>
         <div className="relative">
           <User className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" size={16} />
           <input type="text" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} placeholder="Nombre del cliente..." className="input-field pl-9" />
         </div>
        </div>
        {editing && (
         <div className="space-y-1.5">
          <label className="label-text">Estado</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className="input-field">
           <option value="pendiente">Pendiente</option>
           <option value="completada">Completada</option>
           <option value="cancelada">Cancelada</option>
          </select>
         </div>
        )}
        <div className="space-y-1.5">
         <label className="label-text">Notas adicionales</label>
         <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Instrucciones para el asesor..." className="input-field resize-none h-24" />
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
