import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, MessageSquare, Phone, LayoutList, KanbanSquare, Bot, Edit, Trash2, BrainCircuit, X, CheckCircle2, Circle, Calendar, Clock, FileText, ListTodo, Send, Tag, History, CalendarDays } from 'lucide-react';
import { useToast } from './Toast';
import AlarmSystem, { AlarmItem } from './AlarmSystem';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getScoreColor = (score: string) => {
  const n = parseInt(score);
  if (n >= 80) return { bg: 'bg-emerald-500/15', text: 'text-emerald-500', bar: 'bg-emerald-500' };
  if (n >= 60) return { bg: 'bg-blue-500/15', text: 'text-blue-500', bar: 'bg-blue-500' };
  if (n >= 40) return { bg: 'bg-amber-500/15', text: 'text-amber-500', bar: 'bg-amber-500' };
  return { bg: 'bg-rose-500/15', text: 'text-rose-500', bar: 'bg-rose-500' };
};

const getTagColor = (tag: string) => {
  if (tag.toLowerCase().includes('caliente')) return 'bg-rose-100 text-rose-700 border-rose-200';
  if (tag.toLowerCase().includes('prioridad')) return 'bg-orange-100 text-orange-700 border-orange-200';
  if (tag.toLowerCase().includes('inversionista')) return 'bg-indigo-100 text-indigo-700 border-indigo-200';
  if (tag.toLowerCase().includes('cierre')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  return 'bg-blue-100 text-blue-700 border-blue-200';
};

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'Nuevo': return 'bg-primary/10 text-primary border border-primary/20';
    case 'Contactado': return 'bg-blue-50 text-blue-600 border border-blue-200';
    case 'Cita': return 'bg-amber-50 text-amber-600 border border-amber-200';
    case 'Negociación': return 'bg-purple-50 text-purple-600 border border-purple-200';
    case 'Cerrado': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    default: return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
};

// Helper to generate a date/time X minutes from now (for demo alarms)
const getTimeFromNow = (minutesFromNow: number) => {
  const d = new Date(Date.now() + minutesFromNow * 60 * 1000);
  const date = d.toISOString().split('T')[0];
  const time = d.toTimeString().slice(0, 5);
  return { date, time };
};

const Leads = ({ isDarkMode, setActiveTab }: { isDarkMode?: boolean; setActiveTab?: (tab: string) => void }) => {
  const [viewMode, setViewMode] = useState<'kanban'|'list'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'kanban';
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const { showToast, showConfirm } = useToast();
  const [alarmItems, setAlarmItems] = useState<AlarmItem[]>([]);
  const { token } = useAuth();

  const fetchLeads = async () => {
    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data);
      }
    } catch (err) {
      console.error('Error fetching leads', err);
    }
  };

  useEffect(() => {
    if (token) fetchLeads();
  }, [token]);

  const registerAlarmItem = useCallback((item: AlarmItem) => {
    setAlarmItems(prev => {
      if (prev.find(a => a.id === item.id)) return prev.map(a => a.id === item.id ? item : a);
      return [...prev, item];
    });
  }, []);

  const unregisterAlarmItem = useCallback((id: string) => {
    setAlarmItems(prev => prev.filter(a => a.id !== id));
  }, []);

  const addLead = async (data: any) => {
    try {
      const res = await fetch(`${API_URL}/api/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...data, botActive: false, tags: [] })
      });
      if (res.ok) {
        fetchLeads();
        setShowNewLead(false);
        showToast(`Lead "${data.name}" creado`, 'success');
      }
    } catch (err) {
      console.error('Error creating lead', err);
      showToast('Error al crear lead', 'error');
    }
  };

  const deleteLead = (id: string) => {
    const lead = leads.find(l => String(l.id) === String(id));
    showConfirm(`¿Eliminar a "${lead?.name}"?`, async () => {
      try {
        const res = await fetch(`${API_URL}/api/leads/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          fetchLeads();
          showToast('Lead eliminado', 'error');
        }
      } catch (err) {
        console.error('Error deleting lead', err);
      }
    }, { confirmText: 'Eliminar', cancelText: 'Cancelar' });
  };

  const handleDropLead = (leadId: string, newStatus: string) => {
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (!lead || lead.status === newStatus) return;
    const oldStatus = lead.status;
    showConfirm(
      `¿Mover a "${lead.name}" de "${oldStatus}" a "${newStatus}"?`,
      async () => {
        try {
          const res = await fetch(`${API_URL}/api/leads/${leadId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ status: newStatus })
          });
          if (res.ok) {
            fetchLeads();
            showToast(`${lead.name} movido a "${newStatus}"`, 'info');
          }
        } catch (err) {
          console.error('Error updating status', err);
        }
      },
      { confirmText: 'Mover', cancelText: 'Cancelar' }
    );
  };

  const toggleBot = async (leadId: string) => {
    const lead = leads.find(l => String(l.id) === String(leadId));
    if (!lead) return;
    try {
      const res = await fetch(`${API_URL}/api/leads/${leadId}/bot`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ botActive: !lead.botActive })
      });
      if (res.ok) fetchLeads();
    } catch (err) {
      console.error('Error toggling bot', err);
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-full pb-20 md:pb-0 ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <AlarmSystem items={alarmItems} onDismiss={unregisterAlarmItem} />
      
      <div className={`h-16 border-b px-4 md:px-8 flex items-center justify-between shrink-0 transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <h1 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Leads e Interesados</h1>
          <div className={`flex p-1 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button onClick={() => setViewMode('kanban')} className={`p-1.5 rounded-md transition-all ${viewMode === 'kanban' ? (isDarkMode ? 'bg-slate-700 shadow-sm text-primary' : 'bg-white shadow-sm text-primary') : 'text-slate-500 hover:text-slate-400'}`}><KanbanSquare size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? (isDarkMode ? 'bg-slate-700 shadow-sm text-primary' : 'bg-white shadow-sm text-primary') : 'text-slate-500 hover:text-slate-400'}`}><LayoutList size={18} /></button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className={`p-2 rounded-xl border transition-colors ${isDarkMode ? 'border-slate-700 text-slate-400 bg-slate-800 hover:bg-slate-700' : 'border-slate-200 text-slate-600 bg-white hover:bg-slate-50'}`}><Filter size={18} /></button>
          <button onClick={() => setShowNewLead(true)} className="bg-primary text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[12px] md:text-[13px] font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center gap-2">
            <Plus size={18} /> <span className="hidden sm:inline">Nuevo Lead</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto p-4 md:p-6 h-full">
        {viewMode === 'kanban' ? (
          <div className="flex gap-6 h-full min-w-max">
            {['Nuevo', 'Contactado', 'Cita', 'Negociación', 'Cerrado'].map(status => (
              <PipelineColumn 
                key={status} 
                status={status} 
                leads={leads.filter(l => l.status === status)} 
                onDrop={handleDropLead} 
                onToggleBot={toggleBot} 
                onSelect={setSelectedLead}
                onDelete={deleteLead}
                onGoChat={setActiveTab}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        ) : (
          <ListView leads={leads} onSelect={setSelectedLead} isDarkMode={isDarkMode} onToggleBot={toggleBot} onDelete={deleteLead} onGoChat={setActiveTab} />
        )}
      </div>

      {selectedLead && <LeadModal lead={selectedLead} isDarkMode={isDarkMode} onClose={() => setSelectedLead(null)} registerAlarm={registerAlarmItem} unregisterAlarm={unregisterAlarmItem} />}
      {showNewLead && <NewLeadModal isDarkMode={isDarkMode} onClose={() => setShowNewLead(false)} onSave={addLead} />}
    </div>
  );
};

const ListView = ({ leads, onSelect, isDarkMode, onToggleBot, onDelete, onGoChat }: any) => {
  if (!leads || leads.length === 0) return (
    <div className={`rounded-2xl border p-12 text-center ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'}`}>
      <Search size={40} className="mx-auto mb-3 opacity-30" />
      <p className="text-sm font-bold">Sin leads todavía</p>
      <p className="text-xs mt-1">Haz clic en "+ Nuevo Lead" para comenzar</p>
    </div>
  );
  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden overflow-x-auto h-full ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead>
          <tr className={`border-b text-[11px] font-bold transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
            <th className="px-4 py-3 pl-6 font-semibold">Lead</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
            <th className="px-4 py-3 font-semibold">Puntaje</th>
            <th className="px-4 py-3 font-semibold">Proyecto</th>
            <th className="px-4 py-3 font-semibold">Bot IA</th>
            <th className="px-4 py-3 pr-6 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody className={`divide-y transition-colors ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
          {leads.map((lead: any) => {
            const sc = getScoreColor(lead.score);
            return (
            <tr key={lead.id} className={`h-[42px] transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
              <td className="px-4 py-2 pl-6 cursor-pointer" onClick={() => onSelect(lead)}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <div className={`text-[13px] font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{lead.name}</div>
                    <div className="text-[11px] text-slate-500">{lead.phone}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${getStatusBadgeColor(lead.status)}`}>{lead.status}</span>
              </td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className={`w-12 h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <div className={`${sc.bar} h-full rounded-full`} style={{ width: lead.score }}></div>
                  </div>
                  <span className={`text-[11px] font-bold ${sc.text}`}>{lead.score}</span>
                </div>
              </td>
              <td className="px-4 py-2 text-[12px] text-slate-500 font-medium">{lead.project || '—'}</td>
              <td className="px-4 py-2">
                <button 
                  onClick={() => onToggleBot(lead.id)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all ${lead.botActive ? (isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600') : (isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400')}`}
                >
                  <Bot size={14} className={lead.botActive ? 'animate-pulse' : ''} />
                  <span className="text-[10px] font-bold">{lead.botActive ? 'Activo' : 'Off'}</span>
                </button>
              </td>
              <td className="px-4 py-2 text-right pr-6">
                <div className="inline-flex items-center gap-0.5">
                  <button title="Llamar" className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-500 hover:bg-emerald-50'}`}>
                    <Phone size={14} />
                  </button>
                  <button title="Conversación" onClick={() => onGoChat?.('Conversaciones')} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-500 hover:bg-blue-50'}`}>
                    <MessageSquare size={14} />
                  </button>
                  <button title="Activar Bot" onClick={() => onToggleBot(lead.id)} className={`p-1.5 rounded-lg transition-colors ${lead.botActive ? 'text-purple-400' : (isDarkMode ? 'text-slate-500 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100')}`}>
                    <Bot size={14} />
                  </button>
                  <button title="Editar" onClick={() => onSelect(lead)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}>
                    <Edit size={14} />
                  </button>
                  <button title="Eliminar" onClick={() => onDelete(lead.id)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-400 hover:bg-rose-50'}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          );})}
        </tbody>
      </table>
    </div>
  );
};

const PipelineColumn = ({ status, leads, onDrop, onToggleBot, onSelect, onDelete, onGoChat, isDarkMode }: any) => {
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); onDrop(e.dataTransfer.getData('leadId'), status); };
  return (
    <div onDragOver={handleDragOver} onDrop={handleDrop} className="flex flex-col w-72 md:w-80 shrink-0">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <h3 className={`text-[13px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{status}</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-200 text-slate-500'}`}>{leads.length}</span>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
        {leads.length === 0 && (
          <div className={`p-6 rounded-2xl border-2 border-dashed text-center ${isDarkMode ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400'}`}>
            <p className="text-xs font-medium">Arrastra leads aquí</p>
          </div>
        )}
        {leads.map((lead: any) => (
          <LeadCard key={lead.id} lead={lead} onToggleBot={onToggleBot} onSelect={onSelect} onDelete={onDelete} onGoChat={onGoChat} isDarkMode={isDarkMode} />
        ))}
      </div>
    </div>
  );
};

const LeadCard = ({ lead, onToggleBot, onSelect, onDelete, onGoChat, isDarkMode }: any) => {
  const handleDragStart = (e: React.DragEvent) => { e.dataTransfer.setData('leadId', lead.id); };
  const sc = getScoreColor(lead.score || '0');
  return (
    <div draggable onDragStart={handleDragStart} onClick={() => onSelect(lead)}
      className={`p-4 rounded-2xl border shadow-sm cursor-grab active:cursor-grabbing transition-all hover:shadow-md hover:border-primary/30 group ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2 flex-wrap">
          {(lead.tags || []).map((tag: string, i: number) => (
            <span key={i} className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getTagColor(tag)}`}>{tag}</span>
          ))}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onToggleBot(lead.id); }}
          className={`p-1.5 rounded-lg transition-all ${lead.botActive ? 'bg-primary/10 text-primary shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
          <Bot size={14} />
        </button>
      </div>
      <h4 className={`text-[14px] font-bold mb-1 group-hover:text-primary transition-colors ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{lead.name}</h4>
      <div className="space-y-2 mt-3">
        <div className="flex items-center gap-2 text-slate-500">
          <Phone size={12} /><span className="text-[11px] font-medium">{lead.phone}</span>
        </div>
        <div className={`flex items-center justify-between mt-4 pt-3 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100/50'}`}>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold ${sc.bg} ${sc.text}`}>{lead.score || '—'}</div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tight">Score</p>
          </div>
          <div className="text-right">
            <p className={`text-[12px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{lead.budget || '—'}</p>
            <p className="text-[9px] text-slate-500 font-medium">{lead.time}</p>
          </div>
        </div>
        <div className={`flex items-center justify-between pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100/50'}`} onClick={e => e.stopPropagation()}>
          <div className="flex gap-1">
            <button title="Llamar" className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-500 hover:bg-emerald-50'}`}><Phone size={13} /></button>
            <button title="Chat" onClick={() => onGoChat?.('Conversaciones')} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-500 hover:bg-blue-50'}`}><MessageSquare size={13} /></button>
          </div>
          <div className="flex gap-1">
            <button title="Editar" onClick={() => onSelect(lead)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-100'}`}><Edit size={13} /></button>
            <button title="Eliminar" onClick={() => onDelete(lead.id)} className="p-1.5 rounded-lg transition-colors text-rose-400 hover:bg-rose-50"><Trash2 size={13} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LeadModal = ({ lead, onClose, isDarkMode, registerAlarm, unregisterAlarm }: any) => {
  const [activeTab, setActiveTab] = useState<'tareas'|'notas'|'citas'|'historial'>('tareas');
  const [newTask, setNewTask] = useState('');
  const [taskPriority, setTaskPriority] = useState('Media');
  const [taskType, setTaskType] = useState('Llamada');
  const [taskDate, setTaskDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [taskTime, setTaskTime] = useState('12:00');
  const { showToast } = useToast();

  const [tasks, setTasks] = useState([
    { id: 1, text: 'Llamar para confirmar visita', type: 'Llamada', priority: 'Alta', status: 'pendiente', date: 'Mañana, 10:00 AM', dueDate: '', dueTime: '' },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'completada' ? 'pendiente' : 'completada' } : t));
  };

  const addTask = () => {
    if(!newTask.trim()) return;
    const id = Date.now();
    setTasks([{ id, text: newTask, type: taskType, priority: taskPriority, status: 'pendiente', date: `${taskDate} ${taskTime}`, dueDate: taskDate, dueTime: taskTime }, ...tasks]);
    setNewTask('');
  };

  const [notes, setNotes] = useState([
    { id: 1, author: 'Bot', text: 'El lead fue calificado con interés Alto. Preferencia de contacto por WhatsApp confirmada.', time: 'Hace 2 horas' },
    { id: 2, author: 'AG', text: 'Presupuesto validado de $150k USD. Busca de 2 a 3 habitaciones.', time: 'Ayer' }
  ]);
  const [newNote, setNewNote] = useState('');

  const addNote = () => {
    if(!newNote.trim()) return;
    setNotes([{ id: Date.now(), author: 'AG', text: newNote, time: 'Ahora' }, ...notes]);
    setNewNote('');
    showToast('Nota guardada correctamente', 'success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className={`w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in duration-300 rounded-3xl overflow-hidden border ${isDarkMode ? 'bg-[#181619] border-slate-800' : 'bg-white border-slate-200'}`}>
        
        <div className={`p-4 border-b shrink-0 ${isDarkMode ? 'border-slate-800/50 bg-[#1E1E1E]' : 'border-slate-100 bg-slate-50'}`}>
          <div className="flex gap-3 items-center">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold shadow-sm border border-primary/20">
              {lead.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-[16px] md:text-[18px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{lead.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${getStatusBadgeColor(lead.status)}`}>{lead.status}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className={`absolute top-4 right-4 p-1.5 rounded-full transition-colors ${isDarkMode ? 'text-slate-500 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'}`}>
            <X size={18} />
          </button>
        </div>

        <div className={`flex border-b ${isDarkMode ? 'border-slate-800/50' : 'border-slate-100'}`}>
          {['tareas', 'notas', 'citas', 'historial'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2.5 text-[12px] md:text-[13px] font-bold capitalize border-b-2 transition-all ${activeTab === tab ? 'border-primary text-primary bg-primary/5' : isDarkMode ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${isDarkMode ? 'bg-[#181619]' : 'bg-white'}`}>
          {activeTab === 'tareas' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
                <input 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="Escribe una nueva tarea..."
                  className={`w-full text-[13px] bg-transparent border-none focus:outline-none mb-4 ${isDarkMode ? 'text-slate-200 placeholder-slate-600' : 'text-slate-700 placeholder-slate-400'}`}
                />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  <select value={taskType} onChange={e=>setTaskType(e.target.value)} className={`text-[11px] font-bold p-2 border rounded-lg bg-transparent outline-none ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <option>Llamada</option><option>Visita</option><option>Email</option><option>WhatsApp</option>
                  </select>
                  <select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)} className={`text-[11px] font-bold p-2 border rounded-lg bg-transparent outline-none ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                    <option>Alta</option><option>Media</option><option>Baja</option>
                  </select>
                  <input type="date" value={taskDate} onChange={e=>setTaskDate(e.target.value)} className={`text-[11px] font-bold p-2 border rounded-lg bg-transparent outline-none ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`} />
                  <input type="time" value={taskTime} onChange={e=>setTaskTime(e.target.value)} className={`text-[11px] font-bold p-2 border rounded-lg bg-transparent outline-none ${isDarkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-600'}`} />
                </div>
                <div className="flex justify-end pt-3 border-t border-slate-100/10">
                  <button onClick={addTask} className="bg-primary text-white py-2 px-5 rounded-xl text-[12px] font-bold flex items-center gap-2 hover:bg-primary-dark transition-all shadow-sm active:scale-95">
                    <Plus size={16} /> Añadir Tarea
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {tasks.map(task => (
                  <div key={task.id} className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => toggleTask(task.id)} className={`transition-all ${task.status === 'completada' ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600 hover:text-primary'}`}>
                        {task.status === 'completada' ? <CheckCircle2 size={20} className="fill-emerald-500/5" /> : <Circle size={20} />}
                      </button>
                      <div>
                        <p className={`text-[13px] font-semibold ${task.status === 'completada' ? 'text-slate-500 line-through' : (isDarkMode ? 'text-slate-200' : 'text-slate-800')}`}>{task.text}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1"><Clock size={12}/> {task.date}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${task.priority === 'Alta' ? 'bg-rose-500/10 text-rose-500' : 'bg-blue-500/10 text-blue-500'}`}>{task.priority}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notas' && (
            <div className="space-y-6">
              <div className={`p-4 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
                <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Registrar observaciones, objeciones detectadas, nivel de interés..."
                  className="w-full text-sm bg-transparent border-none focus:outline-none resize-none min-h-[80px] text-slate-700 placeholder-slate-400"
                />
                <div className="flex justify-between items-center mt-3 border-t border-slate-100 pt-3">
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium border border-slate-200"><FileText size={14}/> Objeción</button>
                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium border border-slate-200"><MessageSquare size={14}/> Preferencia</button>
                  </div>
                  <button onClick={addNote} className="bg-primary text-white py-2 px-5 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-primary-dark transition-all shadow-sm active:scale-95">
                    <Send size={16} /> Guardar Nota
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {notes.map(note => (
                  <div key={note.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm border-2 border-white ${note.author === 'Bot' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {note.author === 'Bot' ? <Bot size={14} /> : 'AG'}
                      </div>
                      <div className="w-0.5 h-full bg-slate-200 mt-1 opacity-50"></div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 mb-1 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[12px] font-bold text-slate-800 dark:text-slate-300">
                          {note.author}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md">{note.time}</span>
                      </div>
                      <p className="text-[12px] md:text-[13px] text-slate-700 dark:text-slate-400 leading-relaxed">{note.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <div className="space-y-0 relative">
              <div className={`absolute left-[15px] top-4 bottom-4 w-0.5 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}></div>
              {[
                { icon: 'bot', color: isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600', title: 'Bot IA calificó al lead', desc: `Scoring actualizado a ${lead.score}. Proyecto: ${lead.project}.`, time: 'Hace 30 min' },
                { icon: 'msg', color: isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600', title: 'Conversación WhatsApp', desc: 'El cliente preguntó por disponibilidad y precios del proyecto.', time: 'Hace 2 horas' },
                { icon: 'task', color: isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600', title: 'Tarea completada', desc: 'Enviar brochure del proyecto — marcada por el agente.', time: 'Ayer' },
                { icon: 'stage', color: isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700', title: `Etapa cambiada a "${lead.status}"`, desc: 'Lead movido en el pipeline por el asesor.', time: 'Hace 2 días' },
                { icon: 'note', color: isDarkMode ? 'bg-slate-500/10 text-slate-400' : 'bg-slate-50 text-slate-600', title: 'Nota del agente', desc: 'Presupuesto confirmado, busca pago de contado.', time: 'Hace 3 días' },
                { icon: 'call', color: isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600', title: 'Llamada realizada', desc: 'Llamada de 4 min. Cliente solicita visita presencial.', time: 'Hace 5 días' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 relative pl-0 py-2 group">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 z-10 border-2 ${isDarkMode ? 'border-[#181619] shadow-none' : 'border-white shadow-sm'} ${item.color}`}>
                    {item.icon === 'bot' && <Bot size={14}/>}
                    {item.icon === 'msg' && <MessageSquare size={14}/>}
                    {item.icon === 'task' && <CheckCircle2 size={14}/>}
                    {item.icon === 'stage' && <ListTodo size={14}/>}
                    {item.icon === 'note' && <FileText size={14}/>}
                    {item.icon === 'call' && <Phone size={14}/>}
                  </div>
                  <div className={`p-3 rounded-xl border flex-1 transition-all group-hover:shadow-sm ${isDarkMode ? 'bg-slate-800/40 border-slate-800 hover:border-slate-700' : 'bg-slate-50/50 border-slate-100 hover:border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-0.5">
                      <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{item.title}</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${isDarkMode ? 'text-slate-400 bg-slate-800' : 'text-slate-500 bg-white shadow-sm border border-slate-100'}`}>{item.time}</span>
                    </div>
                    <p className={`text-[11px] leading-tight ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'citas' && (
            <ModalCitas leadName={lead.name} isDarkMode={isDarkMode} registerAlarm={registerAlarm} unregisterAlarm={unregisterAlarm} />
          )}
        </div>
      </div>
    </div>
  );
};

const ModalCitas = ({ leadName, isDarkMode, registerAlarm, unregisterAlarm }: { leadName: string, isDarkMode?: boolean, registerAlarm?: any, unregisterAlarm?: any }) => {
  const { showToast, showConfirm } = useToast();
  const [citas, setCitas] = useState([
    { id: 1, title: 'Visita Torre Esmeralda', type: 'Visita', date: '2026-05-16', time: '15:00', status: 'pendiente' as const },
    { id: 2, title: 'Llamada de cierre', type: 'Llamada', date: '2026-05-18', time: '10:00', status: 'completada' as const },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [nTitle, setNTitle] = useState(''); const [nType, setNType] = useState('Visita'); const [nDate, setNDate] = useState('2026-05-20'); const [nTime, setNTime] = useState('12:00');

  const addCita = () => {
    if(!nTitle.trim()) return;
    const id = Date.now();
    setCitas([{ id, title: nTitle, type: nType, date: nDate, time: nTime, status: 'pendiente' }, ...citas]);
    showToast(`Cita "${nTitle}" programada`, 'success');
    // Register alarm
    if (registerAlarm) {
      registerAlarm({
        id: `cita-${id}`,
        title: nTitle,
        type: 'cita',
        subtype: nType,
        dueDate: nDate,
        dueTime: nTime,
        leadName,
      });
    }
    setNTitle(''); setShowForm(false);
  };
  const toggleCita = (id: number) => {
    setCitas(citas.map(c => {
      if (c.id === id) {
        const next = c.status === 'completada' ? 'pendiente' : 'completada';
        showToast(`Cita marcada como ${next}`, next === 'completada' ? 'success' : 'info');
        return { ...c, status: next as any };
      }
      return c;
    }));
  };
  const delCita = (id: number) => {
    const cita = citas.find(c => c.id === id);
    showConfirm(
      `¿Eliminar la cita "${cita?.title || ''}"? Esta acción no se puede deshacer.`,
      () => {
        setCitas(citas.filter(c => c.id !== id));
        showToast('Cita eliminada', 'error');
      },
      { confirmText: 'Eliminar', cancelText: 'Cancelar' }
    );
  };

  const typeIcon = (t: string) => {
    if(t==='Visita') return <CalendarDays size={14} className="text-blue-500"/>;
    if(t==='Llamada') return <Phone size={14} className="text-emerald-500"/>;
    if(t==='Reunión') return <ListTodo size={14} className="text-purple-500"/>;
    return <CalendarDays size={14} className="text-slate-400"/>;
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Gestión de Citas</h3>
          <p className="text-[9px] text-slate-500 font-medium tracking-tight">Citas activas para <strong className={isDarkMode ? 'text-primary' : 'text-primary'}>{leadName}</strong></p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-primary text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-primary-dark flex items-center gap-1.5 shadow-sm active:scale-95 transition-all">
          <Plus size={14}/> Nueva Cita
        </button>
      </div>

      {showForm && (
        <div className={`p-4 rounded-xl border shadow-lg space-y-3 animate-in slide-in-from-top duration-300 ${isDarkMode ? 'bg-slate-800 border-indigo-500/30' : 'bg-slate-50 border-emerald-500/20'}`}>
          <div className="space-y-1">
            <label className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Asunto</label>
            <input type="text" value={nTitle} onChange={e=>setNTitle(e.target.value)} placeholder="Ej: Visita al Penthouse 502..." className={`w-full p-2 rounded-lg text-xs outline-none transition-all border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-primary' : 'bg-white border-slate-200 text-slate-800 focus:border-primary'}`}/>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="space-y-1">
              <label className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Tipo</label>
              <select value={nType} onChange={e=>setNType(e.target.value)} className={`w-full p-2 rounded-lg text-[10px] outline-none border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>
                <option>Visita</option><option>Llamada</option><option>Reunión</option><option>Seguimiento</option><option>Firma</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Fecha</label>
              <input type="date" value={nDate} onChange={e=>setNDate(e.target.value)} className={`w-full p-2 rounded-lg text-[10px] outline-none border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}/>
            </div>
            <div className="space-y-1">
              <label className={`text-[9px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Hora</label>
              <input type="time" value={nTime} onChange={e=>setNTime(e.target.value)} className={`w-full p-2 rounded-lg text-[10px] outline-none border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}/>
            </div>
            <div className="flex items-end">
              <button onClick={addCita} className="w-full bg-slate-800 dark:bg-primary text-white p-2 rounded-lg text-[10px] font-bold hover:opacity-90 shadow-sm transition-all active:scale-95">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-xl border overflow-hidden shadow-sm divide-y transition-all ${isDarkMode ? 'bg-slate-900/40 border-slate-800 divide-slate-800/50' : 'bg-white border-slate-100 divide-slate-50'}`}>
        {citas.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-[11px] italic bg-slate-50/50 dark:bg-transparent">Sin citas programadas.</div>
        ) : citas.map(c => (
          <div key={c.id} className={`p-3 flex items-center gap-3 transition-all ${c.status==='completada'?'opacity-50':'hover:bg-slate-50 dark:hover:bg-white/5'}`}>
            <button onClick={() => toggleCita(c.id)} className={`transition-all ${c.status==='completada'?'text-emerald-500':'text-slate-300 dark:text-slate-600 hover:text-primary'}`}>
              {c.status==='completada' ? <CheckCircle2 size={18} className="fill-emerald-500/10"/> : <Circle size={18}/>}
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`flex items-center gap-1 text-[8px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-full ${c.type==='Visita'?'bg-blue-500/10 text-blue-500':c.type==='Llamada'?'bg-emerald-500/10 text-emerald-500':'bg-purple-500/10 text-purple-500'}`}>
                  {typeIcon(c.type)} {c.type}
                </span>
              </div>
              <p className={`text-xs font-bold leading-tight ${c.status==='completada'?'text-slate-500 line-through':isDarkMode?'text-white':'text-slate-800'}`}>{c.title}</p>
            </div>
            <div className={`flex flex-col items-end gap-1`}>
              <div className={`flex items-center gap-1.5 text-[9px] font-bold px-2 py-1 rounded-lg border shadow-sm ${isDarkMode?'bg-slate-800 border-slate-700 text-slate-300':'bg-slate-50 border-slate-100 text-slate-600'}`}>
                <Clock size={10} className="text-primary"/> {c.date} • {c.time}
              </div>
              <button onClick={() => delCita(c.id)} className="text-[8px] font-bold text-rose-500 hover:bg-rose-500/10 px-1.5 py-0.5 rounded transition-colors flex items-center gap-1">
                <Trash2 size={10}/> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const NewLeadModal = ({ isDarkMode, onClose, onSave }: any) => {
  const [form, setForm] = useState({ name: '', phone: '', score: '50%', budget: '', project: '', status: 'Nuevo' });
  const inputCls = `w-full px-3 py-2 border rounded-xl text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'}`;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDarkMode ? 'bg-[#1E1E1E] border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-center mb-5">
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Nuevo Lead</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-700/50"><X size={18} className="text-slate-400" /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); if (form.name && form.phone) onSave(form); }} className="space-y-3">
          <div>
            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nombre *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Teléfono *</label>
            <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Presupuesto</label>
              <input value={form.budget} onChange={e => setForm({...form, budget: e.target.value})} placeholder="$100k" className={inputCls} />
            </div>
            <div>
              <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Score</label>
              <select value={form.score} onChange={e => setForm({...form, score: e.target.value})} className={inputCls}>
                <option>90%</option><option>80%</option><option>70%</option><option>60%</option><option>50%</option><option>40%</option><option>30%</option><option>20%</option>
              </select>
            </div>
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Proyecto / Interés</label>
            <input value={form.project} onChange={e => setForm({...form, project: e.target.value})} className={inputCls} />
          </div>
          <div>
            <label className={`block text-xs font-bold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Etapa</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} className={inputCls}>
              <option>Nuevo</option><option>Contactado</option><option>Cita</option><option>Negociación</option><option>Cerrado</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 mt-2">
            Crear Lead
          </button>
        </form>
      </div>
    </div>
  );
};

export default Leads;
