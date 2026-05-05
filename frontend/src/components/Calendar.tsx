import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, CheckCircle2, XCircle, MapPin, Phone as PhoneIcon, Users, FileSignature, Bookmark, RotateCcw, Bot, Trash2 } from 'lucide-react';

type EventType = 'Visita' | 'Llamada' | 'Reunión' | 'Seguimiento' | 'Firma' | 'Separación';
type EventStatus = 'pendiente' | 'completada' | 'cancelada';
type Priority = 'Alta' | 'Media' | 'Baja';

interface CalEvent {
  id: number; title: string; type: EventType; date: string; time: string;
  client: string; status: EventStatus; priority: Priority; lead?: string; notes?: string;
}

const typeConfig: Record<EventType, { icon: any; color: string; bg: string }> = {
  Visita: { icon: MapPin, color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
  Llamada: { icon: PhoneIcon, color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
  Reunión: { icon: Users, color: 'text-purple-700', bg: 'bg-purple-100 border-purple-300' },
  Seguimiento: { icon: RotateCcw, color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
  Firma: { icon: FileSignature, color: 'text-rose-700', bg: 'bg-rose-100 border-rose-300' },
  Separación: { icon: Bookmark, color: 'text-indigo-700', bg: 'bg-indigo-100 border-indigo-300' },
};

const statusStyles: Record<EventStatus, string> = {
  pendiente: 'border-l-amber-500', completada: 'border-l-emerald-500 opacity-70', cancelada: 'border-l-rose-400 opacity-50 line-through',
};

export default function Calendar({ isDarkMode }: { isDarkMode?: boolean }) {
  const [view, setView] = useState<'month'|'week'|'day'>('month');
  const [events, setEvents] = useState<CalEvent[]>([
    { id:1, title:'Visita Torre Esmeralda', type:'Visita', date:'2026-05-15', time:'10:00', client:'Carlos Mendoza', status:'pendiente', priority:'Alta', lead:'Carlos Mendoza' },
    { id:2, title:'Firma Contrato', type:'Firma', date:'2026-05-12', time:'14:00', client:'Ana Gómez', status:'completada', priority:'Alta' },
    { id:3, title:'Llamada seguimiento', type:'Llamada', date:'2026-05-20', time:'11:00', client:'Lucía Santos', status:'pendiente', priority:'Media' },
    { id:4, title:'Reunión Presencial', type:'Reunión', date:'2026-05-18', time:'09:00', client:'Juan Pérez', status:'cancelada', priority:'Baja' },
    { id:5, title:'Separación Depto 4B', type:'Separación', date:'2026-05-15', time:'16:00', client:'María García', status:'pendiente', priority:'Alta' },
    { id:6, title:'Seguimiento WhatsApp', type:'Seguimiento', date:'2026-05-19', time:'12:00', client:'Empresa Zeta', status:'pendiente', priority:'Media' },
  ]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<CalEvent|null>(null);
  const [form, setForm] = useState({ title:'', type:'Visita' as EventType, date:'2026-05-15', time:'12:00', client:'', status:'pendiente' as EventStatus, priority:'Media' as Priority, notes:'' });
  const [dragId, setDragId] = useState<number|null>(null);

  const openNew = (date?: string, time?: string) => { setForm({ title:'', type:'Visita', date: date||'2026-05-15', time: time||'12:00', client:'', status:'pendiente', priority:'Media', notes:'' }); setEditing(null); setModal(true); };
  const openEdit = (ev: CalEvent, e: React.MouseEvent) => { e.stopPropagation(); setForm({ title:ev.title, type:ev.type, date:ev.date, time:ev.time, client:ev.client, status:ev.status, priority:ev.priority, notes:ev.notes||'' }); setEditing(ev); setModal(true); };
  const save = (e: React.FormEvent) => { e.preventDefault(); if(!form.title) return; if(editing) { setEvents(events.map(ev => ev.id===editing.id ? {...form, id:ev.id, lead:ev.lead} : ev)); } else { setEvents([...events, {...form, id:Date.now()}]); } setModal(false); };
  const del = () => { if(editing) { setEvents(events.filter(ev => ev.id !== editing.id)); setModal(false); } };
  const toggle = (id: number, s: EventStatus, e: React.MouseEvent) => { e.stopPropagation(); setEvents(events.map(ev => ev.id===id ? {...ev, status:s} : ev)); };

  const daysInMonth = 31; const startDay = 5;
  const cells = Array.from({length:35}, (_,i) => { const d = i-startDay+1; return d>0&&d<=daysInMonth ? d : null; });
  const hours = Array.from({length:12}, (_,i) => i+7);
  const weekDays = [12,13,14,15,16,17,18];
  const mo = '2026-05';
  const fmt = (d:number) => `${mo}-${d.toString().padStart(2,'0')}`;
  const dayName = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

  const handleDrop = (date: string, time?: string) => {
    if(dragId === null) return;
    setEvents(events.map(ev => ev.id===dragId ? {...ev, date, ...(time ? {time} : {})} : ev));
    setDragId(null);
  };

  const EventPill = ({ev, compact}: {ev:CalEvent; compact?:boolean}) => {
    const tc = typeConfig[ev.type]; const Icon = tc.icon;
    return (
      <div draggable onDragStart={() => setDragId(ev.id)} onDragEnd={() => setDragId(null)}
        onClick={(e) => openEdit(ev,e)}
        className={`border-l-[3px] ${statusStyles[ev.status]} ${tc.bg} border rounded-md px-2 py-1 cursor-pointer hover:shadow-md transition-all text-[11px] md:text-[12px] flex items-center gap-1.5 truncate group`}>
        <Icon size={compact?10:12} className={`shrink-0 ${tc.color}`} />
        <span className={`truncate font-medium ${tc.color}`}>{compact ? ev.title : `${ev.time} ${ev.title}`}</span>
        {!compact && ev.client && <span className="text-slate-500 hidden md:inline font-normal">• {ev.client}</span>}
      </div>
    );
  };

  const EventBlock = ({ev}: {ev:CalEvent}) => {
    const tc = typeConfig[ev.type]; const Icon = tc.icon;
    return (
      <div draggable onDragStart={() => setDragId(ev.id)} onDragEnd={() => setDragId(null)}
        onClick={(e) => openEdit(ev,e)}
        className={`border-l-4 ${statusStyles[ev.status]} ${tc.bg} border rounded-lg p-3 cursor-pointer hover:shadow-lg transition-all group`}>
        <div className="flex justify-between items-start">
          <div className={`flex items-center gap-2 font-semibold text-[13px] md:text-[14px] ${tc.color}`}><Icon size={14}/>{ev.title}</div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {ev.status!=='completada' && <button onClick={(e) => toggle(ev.id,'completada',e)} className="p-1 text-emerald-600 hover:bg-emerald-200 rounded"><CheckCircle2 size={14}/></button>}
            {ev.status!=='cancelada' && <button onClick={(e) => toggle(ev.id,'cancelada',e)} className="p-1 text-rose-600 hover:bg-rose-200 rounded"><XCircle size={14}/></button>}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600">
          {ev.client && <span className="flex items-center gap-1"><User size={10}/>{ev.client}</span>}
          <span className={`px-1.5 py-0.5 rounded font-medium border ${ev.priority==='Alta'?'bg-red-50 text-red-600 border-red-200':ev.priority==='Media'?'bg-amber-50 text-amber-600 border-amber-200':'bg-slate-100 text-slate-500 border-slate-200'}`}>{ev.priority}</span>
        </div>
      </div>
    );
  };

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

      {/* TYPE LEGEND */}
      <div className={`px-4 md:px-8 py-2 border-b transition-colors flex items-center gap-3 overflow-x-auto text-[10px] ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100'}`}>
        {(Object.keys(typeConfig) as EventType[]).map(t => { const c = typeConfig[t]; const I = c.icon; return (
          <span key={t} className={`flex items-center gap-1 px-2 py-1 rounded-md border font-black uppercase tracking-wider transition-all ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : c.bg} ${c.color}`}><I size={10}/>{t}</span>
        );})}
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
                const de = events.filter(e => e.date===ds);
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
              <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
                <div className="p-2 border-r border-slate-200"></div>
                {weekDays.map((d,i) => (
                  <div key={d} className={`p-2 text-center border-r border-slate-200 ${d===15?'bg-primary/5':''}`}>
                    <div className="text-[10px] font-semibold text-slate-500 uppercase">{dayName[i]}</div>
                    <div className={`text-sm font-bold mt-0.5 w-7 h-7 mx-auto flex items-center justify-center rounded-full ${d===15?'bg-primary text-white':'text-slate-700'}`}>{d}</div>
                  </div>
                ))}
              </div>
              <div className="min-w-[700px]">
                {hours.map(h => (
                  <div key={h} className="grid grid-cols-8 border-b border-slate-50 min-h-[70px]">
                    <div className="p-2 text-right text-[10px] text-slate-400 font-medium border-r border-slate-100 bg-slate-50/50">
                      {h.toString().padStart(2,'0')}:00
                    </div>
                    {weekDays.map(d => {
                      const ds = fmt(d); const ts = h.toString().padStart(2,'0');
                      const he = events.filter(e => e.date===ds && e.time.startsWith(ts));
                      return (
                        <div key={d}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => handleDrop(ds, `${ts}:00`)}
                          onClick={() => openNew(ds, `${ts}:00`)}
                          className={`border-r border-slate-100 p-1 cursor-pointer hover:bg-slate-50 transition-colors ${d===15?'bg-primary/[0.02]':''}`}>
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
              <div className="sticky top-0 bg-white border-b border-slate-200 p-3 z-10 flex items-center justify-center">
                <h2 className="text-sm font-bold text-slate-700">Lunes, 5 de Mayo 2026</h2>
              </div>
              {hours.map(h => {
                const ts = h.toString().padStart(2,'0')+':00';
                const he = events.filter(e => e.date==='2026-05-05' && e.time.startsWith(h.toString().padStart(2,'0')));
                // Show events from day 15 for demo
                const he2 = events.filter(e => e.date==='2026-05-15' && e.time.startsWith(h.toString().padStart(2,'0')));
                const all = [...he, ...he2];
                return (
                  <div key={h} className="flex min-h-[80px] group border-b border-slate-50"
                    onDragOver={e => e.preventDefault()} onDrop={() => handleDrop('2026-05-15', ts)}>
                    <div className="w-20 pr-4 text-right pt-2 border-r border-slate-100 text-xs text-slate-400 font-medium bg-slate-50/50">{ts}</div>
                    <div className="flex-1 p-2 flex flex-col gap-2 cursor-pointer hover:bg-slate-50/50" onClick={() => openNew('2026-05-15', ts)}>
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
                <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Tipo de Evento</label>
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
                <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Título</label>
                <input required type="text" value={form.title} onChange={e => setForm({...form, title:e.target.value})} placeholder="Ej. Visita Penthouse Lux..." className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`}/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Fecha</label>
                  <input required type="date" value={form.date} onChange={e => setForm({...form, date:e.target.value})} className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}/>
                </div>
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Hora</label>
                  <input required type="time" value={form.time} onChange={e => setForm({...form, time:e.target.value})} className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Lead / Cliente</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 mt-0.5"/>
                    <input type="text" value={form.client} onChange={e => setForm({...form, client:e.target.value})} placeholder="Buscar lead..." className={`w-full mt-1 pl-8 pr-3 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`}/>
                  </div>
                </div>
                <div>
                  <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Prioridad</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority:e.target.value as Priority})} className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                    <option>Alta</option><option>Media</option><option>Baja</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Estado</label>
                <select value={form.status} onChange={e => setForm({...form, status:e.target.value as EventStatus})} className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                  <option value="pendiente">⏳ Pendiente</option><option value="completada">✅ Completada</option><option value="cancelada">❌ Cancelada</option>
                </select>
              </div>
              <div>
                <label className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Notas (Opcional)</label>
                <textarea value={form.notes} onChange={e => setForm({...form, notes:e.target.value})} rows={2} placeholder="Detalles adicionales..." className={`w-full mt-1 p-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none resize-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`}/>
              </div>
              <div className="flex gap-3 pt-2">
                {editing && <button type="button" onClick={del} className={`px-4 py-2.5 border rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isDarkMode ? 'border-rose-900/50 text-rose-500 hover:bg-rose-500/10' : 'border-rose-200 text-rose-600 hover:bg-rose-50'}`}><Trash2 size={14}/>Eliminar</button>}
                <button type="submit" className="flex-1 bg-primary text-white p-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 active:scale-95 transition-all">
                  {editing ? 'Actualizar Evento' : 'Guardar en Calendario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
