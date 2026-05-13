import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, CheckCircle2, MapPin, Phone as PhoneIcon, Users, FileSignature, Bookmark, RotateCcw, Trash2, Filter, Calendar as CalIcon, ListTodo, CalendarDays } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

type EventType = 'visita' | 'llamada' | 'reunión' | 'seguimiento' | 'firma' | 'cita' | 'tarea';
type EventStatus = 'pendiente' | 'completada' | 'cancelada';
type Priority = 'alta' | 'media' | 'baja';

interface CalEvent {
 id: number; title: string; type: EventType; date: string; time: string;
 client: string; status: EventStatus; priority: Priority; lead_id?: number; notes?: string;
 advisor_name?: string;
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
 const { token, user } = useAuth();
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
     notes: t.description || '',
     advisor_name: t.advisor_name || ''
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

  // Validate date is not in the past
  const selectedDateTime = new Date(`${form.date}T${form.time}`);
  if (selectedDateTime < new Date()) {
    showToast('No puedes programar eventos en el pasado', 'error');
    return;
  }

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
  if (!window.confirm('¿Estás seguro de que deseas eliminar este evento permanentemente?')) return;
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
 const input = `input-field py-1.5 h-9 text-[11px]`;
 const label = "text-[10px] font-bold text-content-muted mb-1 block ml-1 uppercase tracking-tight";

 return (
  <div className="flex-1 flex flex-col overflow-hidden bg-surface-base">

   {/* Header */}
   <div className="p-4 md:p-6 border-b border-edge flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface shadow-sm">
     <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dc ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'}`}>
        <CalIcon size={20} />
      </div>
      <div>
        <h1 className="text-xl font-bold tracking-tight text-content">Agenda y Tareas</h1>
        <p className="text-[10px] font-bold text-content-muted uppercase tracking-wider">{monthNames[month]} {year} • {events.length} eventos</p>
      </div>
     </div>
     <div className="flex items-center gap-2 w-full md:w-auto">
      <div className={`flex p-1 rounded-xl border border-edge ${dc ? 'bg-surface-raised' : 'bg-white shadow-sm'} w-full md:w-auto`}>
        {(['month', 'week', 'day'] as const).map(v => (
         <button key={v} onClick={() => setView(v)} className={`flex-1 md:px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${view === v ? 'bg-accent text-content shadow-sm' : 'text-content-muted hover:text-content'}`}>
          {v === 'month' ? 'Mes' : v === 'week' ? 'Semana' : 'Día'}
         </button>
        ))}
      </div>
      <button onClick={() => openNew()} className="btn-primary p-2 rounded-xl shadow-lg shadow-accent/20 transition-all hover:scale-105 active:scale-95">
        <Plus size={18} />
      </button>
     </div>
   </div>

   {/* Filter & Nav */}
   <div className="px-4 md:px-6 py-2.5 border-b border-edge flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface/50">
     <div className="flex items-center gap-3 w-full sm:w-auto">
      <div className="relative flex-1 sm:w-56">
        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" size={12} />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className={`${input} pl-9`}>
         <option value="todos">Todos los eventos</option>
         {Object.keys(typeConfig).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>
     </div>
     <div className="flex items-center gap-4">
      <button onClick={prevMonth} className="p-1.5 rounded-lg border border-edge text-content-muted hover:text-content transition-colors"><ChevronLeft size={14} /></button>
      <span className="text-[11px] font-black uppercase tracking-widest text-content min-w-[120px] text-center">{monthNames[month]} {year}</span>
      <button onClick={nextMonth} className="p-1.5 rounded-lg border border-edge text-content-muted hover:text-content transition-colors"><ChevronRight size={14} /></button>
     </div>
   </div>

   {/* Calendar Grid */}
   <div className="flex-1 overflow-y-auto p-4 md:p-6">
    {loading ? (
     <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
     </div>
    ) : (
      <div className="h-full min-h-[600px] rounded-2xl border border-edge bg-surface overflow-hidden flex flex-col shadow-sm">
       {view === 'month' ? (
        <>
         <div className={`grid grid-cols-7 border-b border-edge ${dc ? 'bg-surface-raised' : 'bg-surface-inset'}`}>
           {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
            <div key={d} className="py-2.5 text-center text-[10px] font-black uppercase tracking-widest text-content-muted">{d}</div>
           ))}
         </div>
         <div className="flex-1 grid grid-cols-7">
           {cells.map((day, i) => {
            const ds = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
            const dayEvents = filteredEvents.filter(e => e.date === ds);
            const isToday = day === todayDate.getDate() && month === todayDate.getMonth() && year === todayDate.getFullYear();
            return (
             <div key={i} onClick={() => day && openNew(ds)}
              className={`border-b border-r border-edge p-2 flex flex-col gap-1 cursor-pointer transition-colors min-h-[100px] overflow-hidden ${!day ? 'bg-surface-inset/30' : 'hover:bg-surface-inset'} ${isToday ? 'bg-accent/5' : ''}`}>
              {day && (
               <>
                 <div className="flex justify-between items-center mb-0.5">
                  <span className={`text-[10px] font-black ${isToday ? 'bg-accent text-white w-5 h-5 rounded-lg flex items-center justify-center shadow-md shadow-accent/20' : 'text-content-muted opacity-50'}`}>{day}</span>
                  {dayEvents.length > 0 && <div className="w-1 h-1 rounded-full bg-accent" />}
                 </div>
                 <div className="space-y-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map(ev => {
                   const style = getTypeStyle(ev.type);
                   return (
                    <div key={ev.id} onClick={(e) => openEdit(ev, e)}
                     className={`px-1.5 py-0.5 rounded-lg text-[9px] font-bold truncate border transition-all hover:translate-x-0.5 ${style.bg} ${style.color} ${style.border} ${ev.status === 'completada' ? 'opacity-30 line-through' : ''}`}>
                     {ev.time} {ev.title}
                    </div>
                   );
                  })}
                  {dayEvents.length > 3 && <div className="text-[8px] font-bold text-content-muted pl-1 uppercase">+{dayEvents.length - 3} más</div>}
                 </div>
               </>
              )}
             </div>
            );
           })}
         </div>
        </>
       ) : (
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-surface-inset/10">
          {(() => {
            const displayEvents = filteredEvents.filter(e => {
              if (view === 'day') {
                return e.date === todayStr;
              } else {
                // simple week view: current month events for now, or actual week
                const d = new Date(e.date + 'T12:00:00');
                const now = new Date();
                const start = new Date(now.setDate(now.getDate() - now.getDay()));
                const end = new Date(now.setDate(now.getDate() + 7));
                return d >= start && d <= end;
              }
            }).sort((a,b) => (a.date + a.time).localeCompare(b.date + b.time));

            if (displayEvents.length === 0) return (
              <div className="flex flex-col items-center justify-center py-20 text-content-muted">
                <CalendarDays size={48} className="opacity-10 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">No hay eventos para esta vista</p>
              </div>
            );

            return displayEvents.map(ev => {
              const style = getTypeStyle(ev.type);
              return (
                <div key={ev.id} onClick={(e) => openEdit(ev, e)} className={`p-4 rounded-2xl border flex items-center justify-between group transition-all cursor-pointer ${dc ? 'bg-surface border-edge hover:border-accent/40' : 'bg-white border-edge hover:shadow-md'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${style.bg} ${style.color}`}>
                      <style.icon size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${style.bg} ${style.color}`}>{ev.type}</span>
                        <span className="text-xs font-black text-content">{ev.time}</span>
                      </div>
                      <h4 className="text-sm font-bold text-content">{ev.title}</h4>
                      <p className="text-[11px] font-bold text-content-muted uppercase tracking-tight flex items-center gap-1 mt-1">
                        <User size={12} className="text-accent" /> {ev.client || 'Sin cliente'} 
                        {ev.advisor_name && <span className="text-emerald-500">• Asesor: {ev.advisor_name}</span>}
                        • {ev.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => toggleStatus(ev, e)} className={`p-2 rounded-xl transition-all ${ev.status === 'completada' ? 'text-emerald-500 bg-emerald-500/10' : 'text-content-muted hover:text-accent hover:bg-surface-raised'}`}>
                      <CheckCircle2 size={20} />
                    </button>
                  </div>
                </div>
              );
            });
          })()}
        </div>
       )}
      </div>
    )}
   </div>

   {/* Modal */}
   {modal && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
     <div className={`rounded-2xl border border-edge bg-surface shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 ${dc ? 'bg-surface' : 'bg-white'}`}>
      <div className={`px-6 py-4 border-b border-edge flex justify-between items-center ${dc ? 'bg-surface-raised/50' : 'bg-surface-inset/50'}`}>
        <div>
         <h2 className="text-md font-bold text-content leading-tight">{editing ? 'Editar evento' : 'Nueva cita'}</h2>
         <p className="text-[10px] font-bold text-content-muted uppercase tracking-wider mt-0.5">Detalles de la agenda comercial</p>
        </div>
        <button onClick={() => setModal(false)} className="p-2 rounded-lg hover:bg-surface-inset text-content-muted hover:text-content transition-all"><X size={18} /></button>
      </div>

      <form onSubmit={save} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div>
           <label className={label}>Tipo de actividad</label>
           <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className={input}>
            {Object.keys(typeConfig).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
           </select>
         </div>
         <div>
           <label className={label}>Prioridad</label>
           <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })} className={input}>
            <option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option>
           </select>
         </div>
        </div>
        <div>
         <label className={label}>Título descriptivo</label>
         <input required type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ej: Visita al proyecto Mirador..." className={input} />
        </div>
        <div className="grid grid-cols-2 gap-4">
         <div className="relative">
           <label className={label}>Fecha</label>
           <div className="relative">
            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 pointer-events-none" size={14} />
            <input required type="date" min={todayStr} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={`${input} pl-9`} />
           </div>
         </div>
         <div className="relative">
           <label className={label}>Hora</label>
           <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none" size={14} />
            <input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className={`${input} pl-9`} />
           </div>
         </div>
        </div>
        <div>
         <label className={label}>Cliente / Lead vinculado</label>
         <div className="relative">
           <User className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" size={14} />
           <input type="text" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} placeholder="Nombre del cliente..." className={`${input} pl-9`} />
         </div>
        </div>
        {editing && (
         <div>
          <label className={label}>Estado</label>
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className={input}>
           <option value="pendiente">Pendiente</option>
           <option value="completada">Completada</option>
           <option value="cancelada">Cancelada</option>
          </select>
         </div>
        )}
        <div>
         <label className={label}>Notas adicionales</label>
         <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Instrucciones para el asesor..." className={`${input} resize-none h-16`} />
        </div>
      </form>

      <div className={`p-5 border-t border-edge flex flex-col sm:flex-row gap-2 ${dc ? 'bg-surface-raised/50' : 'bg-surface-inset/50'}`}>
        {editing && (user?.role === 'propietario' || user?.role === 'administrador') && <button type="button" onClick={del} className="flex-1 py-2 text-[11px] font-black uppercase tracking-widest text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/5 transition-colors">Eliminar</button>}
        <button onClick={save} className="flex-[2] btn-primary py-2 text-[11px] font-black uppercase tracking-widest shadow-lg shadow-accent/20">
         {editing ? 'Actualizar evento' : 'Programar en agenda'}
        </button>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}
