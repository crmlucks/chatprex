import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, MessageSquare, Phone, LayoutList, KanbanSquare, Bot, Edit, Trash2, BrainCircuit, X, CheckCircle2, Circle, Calendar, Clock, FileText, ListTodo, Send, Tag, History, CalendarDays, Users } from 'lucide-react';
import { useToast } from './Toast';
import AlarmSystem, { AlarmItem } from './AlarmSystem';
import { useAuth } from '../context/AuthContext';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

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
  case 'Nuevo': return 'bg-accent/10 text-accent border border-accent/20';
  case 'Contactado': return 'bg-blue-50 text-blue-600 border border-blue-200';
  case 'Cita': return 'bg-amber-50 text-amber-600 border border-amber-200';
  case 'Negociación': return 'bg-purple-50 text-purple-600 border border-purple-200';
  case 'Cerrado': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
  default: return 'bg-slate-100 text-content-secondary border border-edge';
 }
};

const Leads = ({ isDarkMode, setActiveTab }: { isDarkMode?: boolean; setActiveTab?: (tab: string) => void }) => {
 const [viewMode, setViewMode] = useState<'kanban'|'list'>(() => {
  return typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'kanban';
 });
 const [leads, setLeads] = useState<any[]>([]);
 const [selectedLead, setSelectedLead] = useState<any>(null);
 const [leadToEdit, setLeadToEdit] = useState<any>(null);
 const [showNewLead, setShowNewLead] = useState(false);
 const [search, setSearch] = useState('');
 const [showFilters, setShowFilters] = useState(false);
 const [filterStatus, setFilterStatus] = useState('todos');
 const [filterTag, setFilterTag] = useState('todos');
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

 const [pipelineStages, setPipelineStages] = useState<string[]>(['Nuevo', 'Contactado', 'Cita', 'Negociación', 'Cerrado']);

 useEffect(() => {
  if (token) {
   fetchLeads();
   fetch(`${API_URL}/api/data/pipeline`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(data => {
     if(Array.isArray(data) && data.length > 0) {
      setPipelineStages(data.filter((d: any) => d.visible !== false).map((d: any) => d.name));
     }
    })
    .catch(console.error);
  }
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

 const updateLead = async (data: any) => {
  try {
   const res = await fetch(`${API_URL}/api/leads/${data.id}`, {
    method: 'PUT',
    headers: {
     'Content-Type': 'application/json',
     Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
   });
   if (res.ok) {
    fetchLeads();
    setLeadToEdit(null);
    showToast(`Lead "${data.name}" actualizado`, 'success');
   }
  } catch (err) {
   console.error('Error updating lead', err);
   showToast('Error al actualizar lead', 'error');
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

 const dc = isDarkMode;

 const filteredLeads = leads.filter(l => {
  const matchStatus = filterStatus === 'todos' || l.status === filterStatus;
  const matchTag = filterTag === 'todos' || (l.tags && l.tags.some((t: string) => t.toLowerCase() === filterTag.toLowerCase()));
  const searchLower = search.toLowerCase();
  const matchSearch = !search || l.name?.toLowerCase().includes(searchLower) || l.phone?.toLowerCase().includes(searchLower) || l.email?.toLowerCase().includes(searchLower);
  return matchStatus && matchTag && matchSearch;
 });

 return (
  <div className={`flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-full pb-24 md:pb-0 ${dc ? 'bg-surface-base' : 'bg-surface-base'}`}>
   <AlarmSystem items={alarmItems} onDismiss={unregisterAlarmItem} />
   
   <div className={`py-4 md:py-0 md:h-24 px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 transition-all ${dc ? 'bg-surface border-b border-edge' : 'bg-surface border-b border-edge shadow-sm'}`}>
    <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
     <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/10 text-accent shrink-0">
       <Users size={22} />
      </div>
      <div className="flex flex-col">
       <h1 className="h1">Leads</h1>
      </div>
     </div>
     <div className={`hidden md:flex p-1 rounded-xl ${dc ? 'bg-surface-raised' : 'bg-surface-inset border border-edge '}`}>
      <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? (dc ? 'bg-accent text-content shadow-lg' : 'bg-accent text-content shadow-md') : 'text-content-muted hover:text-content-secondary'}`}><KanbanSquare size={16} /></button>
      <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? (dc ? 'bg-accent text-content shadow-lg' : 'bg-accent text-content shadow-md') : 'text-content-muted hover:text-content-secondary'}`}><LayoutList size={16} /></button>
     </div>
    </div>
    
    <div className="flex items-center justify-between gap-3 w-full md:w-auto">
     <div className="relative w-1/2 md:w-64 shrink-0">
       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" size={14} />
       <input type="text" placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} className={`pl-9 pr-4 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all w-full ${dc ? 'bg-surface-raised border-edge text-content focus:border-accent' : 'bg-surface border-edge focus:border-accent shadow-sm'}`} />
     </div>
     <div className="flex items-center gap-2 ml-auto shrink-0">
      <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl border transition-colors ${showFilters ? 'bg-accent text-content border-accent shadow-sm' : 'bg-surface border-edge text-content-muted hover:text-content'}`}>
       <Filter size={16} />
      </button>
      <button onClick={() => setShowNewLead(true)} className="btn-primary flex items-center justify-center shrink-0 w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2.5 gap-2">
       <Plus size={16} /> <span className="hidden md:inline">Nuevo lead</span>
      </button>
     </div>
    </div>
   </div>

   <div className="flex-1 overflow-x-auto p-4 md:p-8 h-full custom-scrollbar">
    
    <div className="md:hidden flex justify-end mb-4">
     <div className={`flex p-1 rounded-xl ${dc ? 'bg-surface-raised' : 'bg-surface-inset border border-edge '}`}>
      <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? (dc ? 'bg-accent text-content shadow-sm' : 'bg-surface text-content shadow-sm') : 'text-content-muted'}`}><KanbanSquare size={16} /></button>
      <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? (dc ? 'bg-accent text-content shadow-sm' : 'bg-surface text-content shadow-sm') : 'text-content-muted'}`}><LayoutList size={16} /></button>
     </div>
    </div>

    {showFilters && (
     <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-edge bg-surface mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-2 text-content-muted text-sm font-semibold mr-2 uppercase tracking-wider">
        <Filter size={14} /> Filtros:
      </div>
      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto text-sm py-2 min-w-[160px] bg-surface-inset">
        <option value="todos">Todos los estados</option>
        {pipelineStages.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <select value={filterTag} onChange={e => setFilterTag(e.target.value)} className="input-field w-auto text-sm py-2 min-w-[160px] bg-surface-inset">
        <option value="todos">Todos los tags</option>
        <option value="caliente">Caliente</option>
        <option value="prioridad">Prioridad</option>
        <option value="inversionista">Inversionista</option>
        <option value="cierre">Cierre</option>
      </select>
      {(filterStatus !== 'todos' || filterTag !== 'todos') && (
        <button onClick={() => { setFilterStatus('todos'); setFilterTag('todos'); }} className="text-sm text-accent hover:underline ml-2">
         Limpiar filtros
        </button>
      )}
     </div>
    )}

    {viewMode === 'kanban' ? (
     <div className="flex gap-8 h-full min-w-max pb-8">
      {pipelineStages.map(status => (
       <PipelineColumn 
        key={status} 
        status={status} 
        leads={filteredLeads.filter(l => l.status === status)} 
        onDrop={handleDropLead} 
        onToggleBot={toggleBot} 
        onSelect={setSelectedLead}
        onEdit={setLeadToEdit}
        onDelete={deleteLead}
        onGoChat={setActiveTab}
        isDarkMode={dc}
       />
      ))}
     </div>
    ) : (
     <ListView leads={filteredLeads} onSelect={setSelectedLead} onEdit={setLeadToEdit} isDarkMode={dc} onToggleBot={toggleBot} onDelete={deleteLead} onGoChat={setActiveTab} />
    )}
   </div>

   {selectedLead && <LeadModal lead={selectedLead} isDarkMode={dc} onClose={() => setSelectedLead(null)} registerAlarm={registerAlarmItem} unregisterAlarm={unregisterAlarmItem} />}
   {showNewLead && <NewLeadModal isDarkMode={dc} onClose={() => setShowNewLead(false)} onSave={addLead} pipelineStages={pipelineStages} />}
   {leadToEdit && <NewLeadModal editLead={leadToEdit} isDarkMode={dc} onClose={() => setLeadToEdit(null)} onSave={updateLead} pipelineStages={pipelineStages} />}
  </div>
 );
};

const ListView = ({ leads, onSelect, onEdit, isDarkMode, onToggleBot, onDelete, onGoChat }: any) => {
 const dc = isDarkMode;
 if (!leads || leads.length === 0) return (
  <div className={`card-premium p-16 text-center flex flex-col items-center justify-center ${dc ? 'text-content-muted' : 'text-content-muted'}`}>
   <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${dc ? 'bg-surface-raised/50' : 'bg-surface-inset'}`}>
    <Search size={32} className="opacity-30" />
   </div>
   <h3 className="h3">Sin leads todavía</h3>
   <p className="body-text mt-1">Haz clic en "Nuevo lead" para comenzar a gestionar tu embudo</p>
  </div>
 );
 return (
  <div className="card-premium overflow-hidden overflow-x-auto">
    <table className="w-full text-left">
     <thead>
      <tr className={`text-[11px] font-bold text-content-muted border-b uppercase tracking-wider ${dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge'}`}>
       <th className="px-6 py-4">Lead / Contacto</th>
       <th className="px-6 py-4">Estado</th>
       <th className="px-6 py-4">Scoring IA</th>
       <th className="px-6 py-4">Proyecto</th>
       <th className="px-6 py-4">Asesor</th>
       <th className="px-6 py-4">Tags</th>
       <th className="px-6 py-4 text-right">Acciones</th>
      </tr>
     </thead>
     <tbody className={`divide-y ${dc ? 'divide-edge' : 'divide-slate-100'}`}>
      {leads.map((lead: any) => {
       const sc = getScoreColor(lead.score);
       return (
       <tr key={lead.id} className={`group hover:bg-surface-inset transition-colors`}>
        <td className="px-6 py-4 cursor-pointer" onClick={() => onSelect(lead)}>
         <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${dc ? 'bg-surface-raised text-accent' : 'bg-accent/10 text-accent shadow-sm'}`}>
           {lead.name?.charAt(0).toUpperCase() || 'L'}
          </div>
          <div className="min-w-0">
           <div className={`text-sm font-bold ${dc ? 'text-content' : 'text-content'} truncate max-w-[150px]`}>{lead.name}</div>
           <div className="text-xs font-semibold text-content-muted">{lead.phone}</div>
          </div>
         </div>
        </td>
        <td className="px-6 py-4">
         <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-tight ${getStatusBadgeColor(lead.status)}`}>{lead.status}</span>
        </td>
        <td className="px-6 py-4">
         <div className="flex items-center gap-2">
          <div className={`w-12 h-1.5 rounded-full overflow-hidden ${dc ? 'bg-surface-raised' : 'bg-slate-100 '}`}>
           <div className={`${sc.bar} h-full rounded-full transition-all duration-700`} style={{ width: `${lead.score}%` }}></div>
          </div>
          <span className={`text-[11px] font-black flex items-center gap-1 ${sc.text}`}>{lead.score}%</span>
         </div>
        </td>
        <td className="px-6 py-4">
         <span className="text-xs font-bold text-accent truncate max-w-[120px] block">{lead.project || '—'}</span>
        </td>
        <td className="px-6 py-4">
         <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500 uppercase shrink-0">
           {lead.advisor_name?.charAt(0) || 'U'}
          </div>
          <span className="text-xs font-semibold text-content-muted truncate max-w-[100px]">{lead.advisor_name || 'Sin asignar'}</span>
         </div>
        </td>
        <td className="px-6 py-4">
         <div className="flex gap-1 flex-wrap max-w-[120px]">
          {lead.tags && lead.tags.length > 0 ? (
           lead.tags.slice(0, 2).map((t: string, i: number) => (
            <span key={i} className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getTagColor(t)}`}>{t}</span>
           ))
          ) : <span className="text-[10px] text-content-muted italic">Sin tags</span>}
         </div>
        </td>
        <td className="px-6 py-4 text-right">
         <div className="inline-flex items-center gap-0.5">
          <a title="Llamar" href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className={`p-2 rounded-lg transition-all active:scale-90 ${dc ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-500 hover:bg-emerald-50'}`}>
           <Phone size={14} />
          </a>
          <button title="Conversación" onClick={(e) => { e.stopPropagation(); onGoChat?.('Conversaciones'); }} className={`p-2 rounded-lg transition-all active:scale-90 ${dc ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-500 hover:bg-blue-50'}`}>
           <MessageSquare size={14} />
          </button>
          <button title="Editar" onClick={(e) => { e.stopPropagation(); onEdit(lead); }} className={`p-2 rounded-lg transition-all active:scale-90 ${dc ? 'text-content-muted hover:text-accent hover:bg-surface-raised' : 'text-content-muted hover:text-accent hover:bg-slate-100'}`}>
           <Edit size={14} />
          </button>
          <button title="Eliminar" onClick={() => onDelete(lead.id)} className={`p-2 rounded-lg transition-all active:scale-90 ${dc ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-400 hover:bg-rose-50'}`}>
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

const PipelineColumn = ({ status, leads, onDrop, onToggleBot, onSelect, onEdit, onDelete, onGoChat, isDarkMode }: any) => {
 const dc = isDarkMode;
 const handleDragOver = (e: React.DragEvent) => e.preventDefault();
 const handleDrop = (e: React.DragEvent) => { e.preventDefault(); onDrop(e.dataTransfer.getData('leadId'), status); };
 
 const getStatusColor = (st: string) => {
  switch (st) {
   case 'Nuevo': return dc ? 'text-blue-400' : 'text-blue-600';
   case 'Contactado': return dc ? 'text-amber-400' : 'text-amber-600';
   case 'Cita': return dc ? 'text-purple-400' : 'text-purple-600';
   case 'Negociación': return dc ? 'text-emerald-400' : 'text-emerald-600';
   case 'Cerrado': return dc ? 'text-content-muted' : 'text-content-secondary';
   default: return 'text-accent';
  }
 };

 return (
  <div onDragOver={handleDragOver} onDrop={handleDrop} className="flex flex-col w-80 shrink-0">
   <div className="flex items-center justify-between mb-6 px-2">
    <div className="flex items-center gap-3">
     <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(status).replace('text', 'bg')}`} />
     <h3 className={`text-xs font-bold ${getStatusColor(status)}`}>{status}</h3>
     <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${dc ? 'bg-surface-raised text-content-muted' : 'bg-slate-100 text-content-muted'}`}>{leads.length}</span>
    </div>
   </div>
   <div className="flex-1 space-y-5 overflow-y-auto custom-scrollbar pr-2 pb-10">
    {leads.length === 0 && (
     <div className={`p-12 rounded-xl border-2 border-dashed text-center flex flex-col items-center justify-center gap-3 ${dc ? 'border-edge/50 text-content-secondary' : 'border-edge text-content-secondary'}`}>
      <Plus size={24} className="opacity-20" />
      <p className="text-xs font-bold">Columna vacía</p>
     </div>
    )}
    {leads.map((lead: any) => (
     <LeadCard key={lead.id} lead={lead} onToggleBot={onToggleBot} onSelect={onSelect} onEdit={onEdit} onDelete={onDelete} onGoChat={onGoChat} isDarkMode={dc} />
    ))}
   </div>
  </div>
 );
};

const LeadCard = ({ lead, onToggleBot, onSelect, onEdit, onDelete, onGoChat, isDarkMode }: any) => {
 const dc = isDarkMode;
 const handleDragStart = (e: React.DragEvent) => { e.dataTransfer.setData('leadId', lead.id); };
 const sc = getScoreColor(lead.score || '0');
 return (
  <div draggable onDragStart={handleDragStart} onDoubleClick={() => onSelect(lead)}
   className="card-premium group p-5 cursor-grab active:cursor-grabbing hover:border-accent/40 transition-all">
   <div className="flex justify-between items-start mb-4 gap-3">
    <div className="flex flex-col min-w-0">
     <h4 className={`text-sm font-bold truncate group-hover:text-accent transition-colors ${dc ? 'text-content' : 'text-content'}`}>{lead.name}</h4>
     <div className="flex items-center gap-1.5 text-content-muted mt-1">
      <Phone size={12} className="text-emerald-500 shrink-0" />
      <span className="text-xs font-semibold truncate">{lead.phone}</span>
     </div>
    </div>
    <button onClick={(e) => { e.stopPropagation(); onToggleBot(lead.id); }}
     className={`p-2 rounded-xl shrink-0 transition-all active:scale-90 ${lead.botActive ? 'bg-accent text-content shadow-lg shadow-accent/25' : 'bg-slate-100 text-content-muted dark:bg-surface-raised'}`}>
     <Bot size={14} className={lead.botActive ? 'animate-pulse' : ''} />
    </button>
   </div>
   
   {lead.tags && lead.tags.length > 0 && (
    <div className="flex gap-2 flex-wrap mb-4">
     {lead.tags.map((tag: string, i: number) => (
      <span key={i} className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${getTagColor(tag)}`}>{tag}</span>
     ))}
    </div>
   )}
   
   <div className="space-y-4">
    <div className={`flex items-center justify-between pt-4 border-t ${dc ? 'border-edge' : 'border-edge'}`}>
     <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold relative ${sc.bg} ${sc.text}`} title="Scoring generado por IA">
       {lead.score || '0'}%
       <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-surface dark:bg-surface-raised rounded-full flex items-center justify-center shadow-sm">
         <BrainCircuit size={10} className="text-accent" />
       </div>
      </div>
      <div className="flex flex-col min-w-0 flex-1">
       <span className={`text-xs font-bold truncate ${dc ? 'text-content-secondary' : 'text-content-secondary'}`}>{lead.project || 'Sin proyecto'}</span>
       <span className="text-xs font-medium text-content-muted truncate">{lead.source || 'Orgánico'}</span>
      </div>
     </div>
    </div>
    <div className={`flex items-center justify-between pt-3 border-t ${dc ? 'border-edge' : 'border-edge'}`} onClick={e => e.stopPropagation()}>
     <div className="flex gap-1">
      <a title="Llamar" href={`tel:${lead.phone}`} onClick={e => e.stopPropagation()} className={`p-2 rounded-lg transition-all active:scale-90 ${dc ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-emerald-500 hover:bg-emerald-50'}`}><Phone size={14} /></a>
      <button title="Chat" onClick={(e) => { e.stopPropagation(); onGoChat?.('Conversaciones'); }} className={`p-2 rounded-lg transition-all active:scale-90 ${dc ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-500 hover:bg-blue-50'}`}><MessageSquare size={14} /></button>
     </div>
     <div className="flex gap-1">
      <button title="Editar" onClick={(e) => { e.stopPropagation(); onEdit(lead); }} className={`p-2 rounded-lg transition-all active:scale-90 ${dc ? 'text-content-muted hover:text-content hover:bg-surface-raised' : 'text-content-muted hover:text-content-secondary hover:bg-slate-100'}`}><Edit size={14} /></button>
      <button title="Eliminar" onClick={() => onDelete(lead.id)} className="p-2 rounded-lg transition-all active:scale-90 text-rose-400 hover:bg-rose-50"><Trash2 size={14} /></button>
     </div>
    </div>
   </div>
  </div>
 );
};

const LeadModal = ({ lead, onClose, isDarkMode, registerAlarm, unregisterAlarm }: any) => {
 const dc = isDarkMode;
 const [activeTab, setActiveTab] = useState<'tareas'|'notas'|'citas'|'historial'>('tareas');
 const [newTask, setNewTask] = useState('');
 const [taskPriority, setTaskPriority] = useState('Media');
 const [taskType, setTaskType] = useState('Llamada');
 const [taskDate, setTaskDate] = useState(() => new Date().toISOString().split('T')[0]);
 const [taskTime, setTaskTime] = useState('12:00');
 const { showToast } = useToast();
 const { token } = useAuth();

 const [tasks, setTasks] = useState<any[]>([]);

 useEffect(() => {
  if (lead?.id) {
   fetch(`${API_URL}/api/data/tasks?lead_id=${lead.id}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json()).then(data => setTasks(data.map((t: any) => ({
     id: t.id, text: t.title, type: t.type || 'Tarea', priority: t.description || 'Media',
     status: t.status, date: t.due_date ? new Date(t.due_date).toLocaleDateString() : '', dueDate: t.due_date?.split('T')[0] || '', dueTime: ''
    })))).catch(() => {});
  }
 }, [lead?.id]);

 const toggleTask = async (id: number) => {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  const newStatus = task.status === 'completada' ? 'pendiente' : 'completada';
  setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  try {
   await fetch(`${API_URL}/api/data/tasks/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: task.text, description: task.priority, status: newStatus, due_date: task.dueDate || null })
   });
  } catch {}
 };

 const addTask = async () => {
  if(!newTask.trim()) return;
  try {
   const res = await fetch(`${API_URL}/api/data/tasks`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: newTask, description: taskPriority, type: taskType, status: 'pendiente', due_date: `${taskDate}T${taskTime}`, lead_id: lead.id })
   });
   const saved = await res.json();
   setTasks([{ id: saved.id, text: newTask, type: taskType, priority: taskPriority, status: 'pendiente', date: `${taskDate} ${taskTime}`, dueDate: taskDate, dueTime: taskTime }, ...tasks]);
   setNewTask('');
  } catch { showToast('Error al crear tarea', 'error'); }
 };

 const deleteTask = async (id: number) => {
  setTasks(tasks.filter(t => t.id !== id));
  try {
   await fetch(`${API_URL}/api/data/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
   showToast('Tarea eliminada', 'info');
  } catch {}
 };

 const [notes, setNotes] = useState<any[]>([]);
 const [newNote, setNewNote] = useState('');

 useEffect(() => {
  if (lead?.id) {
   fetch(`${API_URL}/api/data/notes?lead_id=${lead.id}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json()).then(data => setNotes(data.map((n: any) => ({
     id: n.id, author: 'AG', text: n.content, time: new Date(n.created_at).toLocaleDateString()
    })))).catch(() => {});
  }
 }, [lead?.id]);

 const addNote = async () => {
  if(!newNote.trim()) return;
  try {
   const res = await fetch(`${API_URL}/api/data/notes`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ lead_id: lead.id, content: newNote })
   });
   const saved = await res.json();
   setNotes([{ id: saved.id, author: 'AG', text: newNote, time: 'Ahora' }, ...notes]);
   setNewNote('');
   showToast('Nota guardada correctamente', 'success');
  } catch { showToast('Error al guardar nota', 'error'); }
 };

 const deleteNote = async (id: number) => {
  setNotes(notes.filter(n => n.id !== id));
  try {
   await fetch(`${API_URL}/api/data/notes/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
   showToast('Nota eliminada', 'info');
  } catch {}
 };

 const [history, setHistory] = useState<any[]>([]);
 const [historyLoading, setHistoryLoading] = useState(false);

 useEffect(() => {
  if (lead?.id && activeTab === 'historial') {
   setHistoryLoading(true);
   fetch(`${API_URL}/api/data/history/${lead.id}`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json())
    .then(data => { if(Array.isArray(data)) setHistory(data); })
    .catch(() => {})
    .finally(() => setHistoryLoading(false));
  }
 }, [lead?.id, activeTab]);

 return (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300">
   <div className={`w-full max-w-4xl h-[85vh] rounded-xl border shadow-sm overflow-hidden flex flex-col ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge'}`}>
    
    {/* Modal Header */}
    <div className={`px-8 py-6 border-b flex justify-between items-center transition-colors ${dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge-light'}`}>
     <div className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${dc ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'}`}>
       {lead.name.charAt(0)}
      </div>
      <div>
       <div className="flex items-center gap-3">
        <h2 className="h2">{lead.name}</h2>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${getStatusBadgeColor(lead.status)}`}>{lead.status}</span>
       </div>
       <p className="small-text mt-0.5">{lead.phone} • {lead.email || 'Sin email'}</p>
      </div>
     </div>
     <button onClick={onClose} className={`p-2 rounded-xl transition-all ${dc ? 'bg-surface-raised text-content-muted hover:text-content' : 'bg-surface border text-content-muted hover:text-content shadow-sm'}`}>
      <X size={20} />
     </button>
    </div>

    {/* Tabs */}
    <div className={`flex px-6 border-b ${dc ? 'border-edge/50 bg-surface' : 'border-edge bg-surface'}`}>
     {['tareas', 'notas', 'citas', 'historial'].map((tab) => (
      <button 
       key={tab}
       onClick={() => setActiveTab(tab as any)}
       className={`px-6 py-4 text-xs font-bold capitalize transition-all relative ${activeTab === tab ? 'text-accent' : 'text-content-muted hover:text-content-secondary'}`}
      >
       {tab}
       {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent rounded-t-full"></div>}
      </button>
     ))}
    </div>

    {/* Modal Body */}
    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
     {activeTab === 'tareas' && (
      <div className="space-y-8">
       <div className={`p-6 rounded-2xl border shadow-sm ${dc ? 'bg-surface-raised/40 border-edge' : 'bg-surface-inset border-edge'}`}>
        <input 
         value={newTask}
         onChange={(e) => setNewTask(e.target.value)}
         placeholder="¿Qué necesitas hacer con este lead?"
         className={`w-full text-sm font-medium bg-transparent border-none focus:outline-none mb-6 ${dc ? 'text-content placeholder-slate-600' : 'text-content-secondary placeholder-slate-400'}`}
        />
        <div className="flex flex-wrap gap-3 mb-6">
         <select value={taskType} onChange={e=>setTaskType(e.target.value)} className={`text-xs font-bold px-3 py-2 border rounded-xl bg-transparent outline-none ${dc ? 'border-edge text-content-muted' : 'border-edge text-content-secondary shadow-sm'}`}>
          <option>Llamada</option><option>Visita</option><option>Email</option><option>WhatsApp</option>
         </select>
         <select value={taskPriority} onChange={e=>setTaskPriority(e.target.value)} className={`text-xs font-bold px-3 py-2 border rounded-xl bg-transparent outline-none ${dc ? 'border-edge text-content-muted' : 'border-edge text-content-secondary shadow-sm'}`}>
          <option>Alta</option><option>Media</option><option>Baja</option>
         </select>
         <div className="relative group">
           <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent pointer-events-none" />
           <input type="date" value={taskDate} onChange={e=>setTaskDate(e.target.value)} className={`text-xs font-bold pl-9 pr-3 py-2 border rounded-xl bg-transparent outline-none ${dc ? 'border-edge text-content-muted' : 'border-edge text-content-secondary shadow-sm'}`} />
         </div>
         <div className="relative group">
           <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none" />
           <input type="time" value={taskTime} onChange={e=>setTaskTime(e.target.value)} className={`text-xs font-bold pl-9 pr-3 py-2 border rounded-xl bg-transparent outline-none ${dc ? 'border-edge text-content-muted' : 'border-edge text-content-secondary shadow-sm'}`} />
         </div>
        </div>
        <div className="flex justify-end pt-2">
         <button onClick={addTask} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Agregar tarea
         </button>
        </div>
       </div>

       <div className="space-y-3">
        {tasks.length === 0 && (
         <div className="card-premium p-12 text-center flex flex-col items-center">
          <ListTodo size={32} className="opacity-20 mb-3" />
          <p className="text-sm font-bold text-content-muted">Sin tareas registradas</p>
          <p className="text-xs text-content-muted mt-1">Agrega tu primera tarea arriba</p>
         </div>
        )}
        {tasks.map(task => (
         <div key={task.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all group ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge hover:shadow-md'}`}>
          <div className="flex items-center gap-4 flex-1 min-w-0">
           <button onClick={() => toggleTask(task.id)} className={`shrink-0 transition-all ${task.status === 'completada' ? 'text-emerald-500' : 'text-content-secondary hover:text-accent'}`}>
            {task.status === 'completada' ? <CheckCircle2 size={22} /> : <Circle size={22} />}
           </button>
           <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold truncate ${task.status === 'completada' ? 'text-content-muted line-through' : 'text-content'}`}>{task.text}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
             <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${task.type === 'Llamada' ? 'bg-emerald-500/10 text-emerald-500' : task.type === 'Visita' ? 'bg-blue-500/10 text-blue-500' : task.type === 'Email' ? 'bg-purple-500/10 text-purple-500' : 'bg-amber-500/10 text-amber-500'}`}>{task.type}</span>
             <span className="text-xs font-bold text-content-muted flex items-center gap-1"><Clock size={11} /> {task.date}</span>
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${task.priority === 'Alta' ? 'bg-rose-500/10 text-rose-500' : task.priority === 'Baja' ? 'bg-slate-500/10 text-slate-500' : 'bg-blue-500/10 text-blue-500'}`}>{task.priority}</span>
            </div>
           </div>
          </div>
          <button onClick={() => deleteTask(task.id)} className="p-2 text-content-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 shrink-0 ml-2"><Trash2 size={14} /></button>
         </div>
        ))}
       </div>
      </div>
     )}

     {activeTab === 'notas' && (
      <div className="space-y-8">
       <div className={`p-6 rounded-2xl border shadow-sm ${dc ? 'bg-surface-raised/40 border-edge' : 'bg-surface-inset border-edge'}`}>
        <textarea 
         value={newNote}
         onChange={(e) => setNewNote(e.target.value)}
         placeholder="Escribe tus observaciones aquí..."
         className={`w-full text-sm font-medium bg-transparent border-none focus:outline-none resize-none min-h-[100px] ${dc ? 'text-content placeholder-slate-600' : 'text-content-secondary placeholder-slate-400'}`}
        />
        <div className="flex justify-end items-center mt-2 pt-2">
         <button onClick={addNote} className="btn-primary flex items-center gap-2">
          <Send size={16} /> Guardar nota
         </button>
        </div>
       </div>

       <div className="space-y-6">
        {notes.map(note => (
         <div key={note.id} className="flex gap-4">
          <div className="flex flex-col items-center shrink-0">
           <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold border-2 ${dc ? 'bg-surface-raised border-slate-900 text-content-muted' : 'bg-surface border-edge-light shadow-sm text-blue-600'}`}>
            {note.author === 'Bot' ? <Bot size={18} /> : 'AG'}
           </div>
           <div className={`w-0.5 h-full mt-2 opacity-20 ${dc ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
          </div>
          <div className={`flex-1 p-5 rounded-2xl border shadow-sm ${dc ? 'bg-surface-raised/40 border-edge' : 'bg-surface border-edge'}`}>
           <div className="flex justify-between items-center mb-2">
            <span className={`text-[12px] font-bold ${dc ? 'text-content-secondary' : 'text-content'}`}>{note.author}</span>
             <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-content-muted">{note.time}</span>
              <button onClick={() => deleteNote(note.id)} className="p-1 text-content-muted hover:text-rose-500 rounded-lg transition-all">
               <Trash2 size={12} />
              </button>
             </div>
            </div>
            <p className="body-text">{note.text}</p>
           </div>
          </div>
         ))}
         {notes.length === 0 && (
          <div className="p-8 text-center text-content-muted text-xs italic">
           Sin notas registradas todavía.
          </div>
         )}
        </div>
       </div>
      )}

     {activeTab === 'historial' && (
      <div className="space-y-0 relative pl-8">
       <div className={`absolute left-[15px] top-0 bottom-0 w-0.5 ${dc ? 'bg-surface-raised' : 'bg-slate-200'}`}></div>
       {historyLoading ? (
        <div className="p-12 text-center">
         <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
         <p className="text-sm font-bold text-content-muted">Cargando historial...</p>
        </div>
       ) : history.length === 0 ? (
        <div className="card-premium p-12 text-center flex flex-col items-center">
         <History size={32} className="opacity-20 mb-3" />
         <p className="text-sm font-bold text-content-muted">Sin historial registrado</p>
         <p className="text-xs text-content-muted mt-1">Las tareas, notas y mensajes de WhatsApp aparecerán aquí</p>
        </div>
       ) : history.map((item: any, i: number) => {
        const gc = () => { 
         if (item.category === 'task') return item.status === 'completada' ? (dc ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (dc ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-50 text-blue-600');
         if (item.category === 'note') return dc ? 'bg-purple-500/15 text-purple-400' : 'bg-purple-50 text-purple-600';
         if (item.icon === 'sent') return dc ? 'bg-accent/15 text-accent' : 'bg-accent/10 text-accent';
         return dc ? 'bg-slate-500/15 text-slate-400' : 'bg-slate-100 text-slate-600';
        };
        const gi = () => { 
         if (item.category === 'task') return item.icon === 'calendar' ? <CalendarDays size={14}/> : <CheckCircle2 size={14}/>;
         if (item.category === 'note') return <FileText size={14}/>;
         return item.icon === 'sent' ? <Send size={14}/> : <MessageSquare size={14}/>;
        };
        const ts = new Date(item.timestamp);
        const timeStr = ts.toLocaleDateString('es', { day: '2-digit', month: 'short' }) + ' ' + ts.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
        return (
         <div key={item.id || i} className="flex gap-6 relative py-3 group">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 ${dc ? 'border-[#1E1E1E]' : 'border-white shadow-sm'} ${gc()}`}>
           {gi()}
          </div>
          <div className={`flex-1 p-4 rounded-xl border transition-all group-hover:shadow-sm ${dc ? 'bg-surface-raised/40 border-edge' : 'bg-surface border-edge'}`}>
           <div className="flex justify-between items-start mb-1 gap-2">
            <span className="text-xs font-bold text-content">{item.title}</span>
            <span className="text-[10px] font-bold text-content-muted whitespace-nowrap">{timeStr}</span>
           </div>
           {item.description && <p className="text-xs text-content-muted leading-relaxed line-clamp-2">{item.description}</p>}
           {item.status && <span className={`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg ${item.status === 'completada' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{item.status}</span>}
          </div>
         </div>
        );
       })}
      </div>
     )}

     {activeTab === 'citas' && (
      <ModalCitas leadName={lead.name} leadId={lead.id} isDarkMode={dc} registerAlarm={registerAlarm} unregisterAlarm={unregisterAlarm} />
     )}
    </div>
   </div>
  </div>
 );
};

const ModalCitas = ({ leadName, leadId, isDarkMode, registerAlarm, unregisterAlarm }: any) => {
 const dc = isDarkMode;
 const { showToast, showConfirm } = useToast();
 const { token } = useAuth();
 const [citas, setCitas] = useState<any[]>([]);
 const [showForm, setShowForm] = useState(false);
 const today = new Date().toISOString().split('T')[0];
 const [nTitle, setNTitle] = useState(''); const [nType, setNType] = useState('Visita'); const [nDate, setNDate] = useState(today); const [nTime, setNTime] = useState('12:00');

 useEffect(() => {
  if (leadId) {
   fetch(`${API_URL}/api/data/tasks?lead_id=${leadId}&type=cita`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json()).then(data => setCitas(data.map((t: any) => ({
     id: t.id, title: t.title, type: t.description || 'Visita',
     date: t.due_date ? t.due_date.split('T')[0] : '', time: t.due_date ? new Date(t.due_date).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',hour12:false}) : '12:00',
     status: t.status as 'pendiente' | 'completada'
    })))).catch(() => {});
  }
 }, [leadId]);

 const addCita = async () => {
  if(!nTitle.trim()) return;
  try {
   const res = await fetch(`${API_URL}/api/data/tasks`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: nTitle, description: nType, type: 'cita', status: 'pendiente', due_date: `${nDate}T${nTime}`, lead_id: leadId })
   });
   const saved = await res.json();
   setCitas([{ id: saved.id, title: nTitle, type: nType, date: nDate, time: nTime, status: 'pendiente' }, ...citas]);
   showToast(`Cita "${nTitle}" programada`, 'success');
   if (registerAlarm) {
    registerAlarm({ id: `cita-${saved.id}`, title: nTitle, type: 'cita', subtype: nType, dueDate: nDate, dueTime: nTime, leadName });
   }
   setNTitle(''); setShowForm(false);
  } catch { showToast('Error al crear cita', 'error'); }
 };
 const toggleCita = async (id: number) => {
  const cita = citas.find(c => c.id === id);
  if (!cita) return;
  const next = cita.status === 'completada' ? 'pendiente' : 'completada';
  setCitas(citas.map(c => c.id === id ? { ...c, status: next } : c));
  showToast(`Cita marcada como ${next}`, next === 'completada' ? 'success' : 'info');
  try {
   await fetch(`${API_URL}/api/data/tasks/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: cita.title, description: cita.type, status: next, due_date: cita.date ? `${cita.date}T${cita.time || '12:00'}` : null })
   });
  } catch {}
 };
 const delCita = (id: number) => {
  const cita = citas.find(c => c.id === id);
  showConfirm(
   `¿Eliminar la cita "${cita?.title || ''}"? Esta acción no se puede deshacer.`,
   async () => {
    setCitas(citas.filter(c => c.id !== id));
    showToast('Cita eliminada', 'error');
    try { await fetch(`${API_URL}/api/data/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }); } catch {}
   },
   { confirmText: 'Eliminar', cancelText: 'Cancelar' }
  );
 };

 return (
  <div className="space-y-6">
   <div className="flex justify-between items-center">
    <div>
     <h3 className="h3">Gestión de citas</h3>
     <p className="body-text">Citas activas para <strong className="text-accent">{leadName}</strong></p>
    </div>
    <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
     <Plus size={16}/> Programar cita
    </button>
   </div>

   {showForm && (
    <div className={`p-6 rounded-2xl border shadow-lg space-y-5 ${dc ? 'bg-surface-raised border-accent/20' : 'bg-surface-inset border-accent/10 shadow-accent/5'}`}>
      <div className="space-y-2">
       <label className="small-text font-bold text-content-muted ml-1">Asunto de la cita</label>
       <input type="text" value={nTitle} onChange={e=>setNTitle(e.target.value)} placeholder="Ej: Visita al Penthouse 502" className={`w-full p-3 rounded-xl text-xs font-bold outline-none transition-all border ${dc ? 'bg-surface-raised border-edge text-content focus:border-accent' : 'bg-surface border-edge text-content focus:border-accent '}`}/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
       <div className="space-y-2">
        <label className="small-text font-bold text-content-muted ml-1">Tipo</label>
        <select value={nType} onChange={e=>setNType(e.target.value)} className={`w-full p-3 rounded-xl text-xs font-bold outline-none border ${dc ? 'bg-surface-raised border-edge text-content-secondary' : 'bg-surface border-edge text-content-secondary '}`}>
         <option>Visita</option><option>Llamada</option><option>Reunión</option><option>Firma</option>
        </select>
       </div>
       <div className="space-y-2">
        <label className="small-text font-bold text-content-muted ml-1">Fecha</label>
        <div className="relative">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-accent pointer-events-none" />
          <input type="date" value={nDate} onChange={e=>setNDate(e.target.value)} className={`w-full pl-9 pr-3 py-3 rounded-xl text-xs font-bold outline-none border ${dc ? 'bg-surface-raised border-edge text-content-secondary' : 'bg-surface border-edge text-content-secondary '}`}/>
        </div>
       </div>
       <div className="space-y-2">
        <label className="small-text font-bold text-content-muted ml-1">Hora</label>
        <div className="relative">
          <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none" />
          <input type="time" value={nTime} onChange={e=>setNTime(e.target.value)} className={`w-full pl-9 pr-3 py-3 rounded-xl text-xs font-bold outline-none border ${dc ? 'bg-surface-raised border-edge text-content-secondary' : 'bg-surface border-edge text-content-secondary '}`}/>
        </div>
       </div>
       <div className="flex items-end">
        <button onClick={addCita} className="w-full bg-accent text-content p-3 rounded-xl text-xs font-bold hover:bg-accent-dark shadow-lg shadow-accent/20 transition-all active:scale-95">Confirmar cita</button>
       </div>
      </div>
    </div>
   )}

   <div className={`rounded-2xl border overflow-hidden shadow-sm divide-y ${dc ? 'bg-surface-raised/40 border-edge divide-slate-800' : 'bg-surface border-edge divide-slate-50'}`}>
    {citas.length === 0 ? (
     <div className="p-10 text-center text-content-muted text-xs italic">Sin citas programadas todavía.</div>
    ) : citas.map(c => (
     <div key={c.id} className={`p-4 flex items-center gap-4 transition-all ${c.status==='completada'?'opacity-50':'hover:bg-surface-inset '}`}>
      <button onClick={() => toggleCita(c.id)} className={`transition-all ${c.status==='completada'?'text-emerald-500':'text-content-secondary hover:text-accent'}`}>
       {c.status==='completada' ? <CheckCircle2 size={20}/> : <Circle size={20}/>}
      </button>
      <div className="flex-1">
       <div className="flex items-center gap-3 mb-1">
        <span className={`text-xs font-semibold uppercase tracking-normal px-2 py-0.5 rounded-lg ${c.type==='Visita'?'bg-blue-500/10 text-blue-500':c.type==='Llamada'?'bg-emerald-500/10 text-emerald-500':'bg-purple-500/10 text-purple-500'}`}>
         {c.type}
        </span>
        <span className={`text-sm font-bold ${dc ? 'text-content' : 'text-content'}`}>{c.title}</span>
       </div>
       <div className="flex items-center gap-4 text-xs font-bold text-content-muted">
        <span className="flex items-center gap-1.5"><Calendar size={12}/> {c.date}</span>
        <span className="flex items-center gap-1.5"><Clock size={12}/> {c.time}</span>
       </div>
      </div>
      <button onClick={() => delCita(c.id)} className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16}/></button>
     </div>
    ))}
   </div>
  </div>
 );
};

const NewLeadModal = ({ editLead, isDarkMode, onClose, onSave, pipelineStages }: any) => {
 const dc = isDarkMode;
 const [formData, setFormData] = useState(editLead || { 
  name: '', phone: '', email: '', project: '', status: 'Nuevo', 
  score: '50', source: '', advisor_id: '', currency: 'USD', 
  budget_amount: '', interest: '', notes: '' 
 });
 const [leadSources, setLeadSources] = useState<any[]>([]);
 const [advisors, setAdvisors] = useState<any[]>([]);
 const { token } = useAuth();
 
 useEffect(() => {
  if (token) {
   fetch(`${API_URL}/api/data/sources`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json()).then(d => { if(Array.isArray(d)) setLeadSources(d); }).catch(() => {});
   fetch(`${API_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
    .then(r => r.json()).then(d => { 
      if(Array.isArray(d)) setAdvisors(d); 
      else if(d && Array.isArray(d.users)) setAdvisors(d.users);
    }).catch(() => {});
  }
 }, [token]);
 
 const inputCls = `w-full px-3 py-2 rounded-lg border text-[11px] font-bold outline-none transition-all focus:ring-2 focus:ring-accent/10 ${dc ? 'bg-surface-raised border-edge text-content focus:border-accent' : 'bg-surface border-edge text-content focus:border-accent '}`;
 const labelCls = `text-[10px] font-bold text-content-muted mb-1 block ml-1 uppercase tracking-tight`;

 return (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300">
   <div className={`w-full max-w-2xl rounded-xl border shadow-sm overflow-hidden flex flex-col max-h-[90vh] ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge'}`}>
    <div className={`px-8 py-5 border-b flex justify-between items-center shrink-0 ${dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge-light'}`}>
     <div>
      <h2 className="h2">{editLead ? 'Editar lead' : 'Nuevo lead'}</h2>
      <p className="small-text mt-0.5">Registro completo del prospecto</p>
     </div>
     <button onClick={onClose} className={`p-2 rounded-xl transition-all ${dc ? 'bg-surface-raised text-content-muted hover:text-content' : 'bg-surface border text-content-muted hover:text-content shadow-sm'}`}><X size={20} /></button>
    </div>
    
    <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
     {/* Datos Personales */}
     <div className="space-y-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-accent">Datos de contacto</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
       <div>
        <label className={labelCls}>Nombre completo</label>
        <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Ej: Juan Pérez" className={inputCls} />
       </div>
       <div>
        <label className={labelCls}>WhatsApp / Teléfono (Formato Evolution)</label>
        <input type="text" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} placeholder="521XXXXXXXXXX" className={inputCls} />
        <p className="text-[10px] text-content-muted mt-1 ml-1 italic">Código país + número sin espacios ni +</p>
       </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
       <div>
        <label className={labelCls}>Email</label>
        <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} placeholder="juan@email.com" className={inputCls} />
       </div>
      </div>
     </div>

     {/* Clasificación y Asignación */}
     <div className="space-y-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-accent">Clasificación y Asignación</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
       <div>
        <label className={labelCls}>Estado (Etapa del Pipeline)</label>
        <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className={inputCls}>
         {pipelineStages.map((s:string) => <option key={s} value={s}>{s}</option>)}
        </select>
       </div>
       <div>
        <label className={labelCls}>Fuente de origen</label>
        <select value={formData.source} onChange={e=>setFormData({...formData, source: e.target.value})} className={inputCls}>
         <option value="">Seleccionar fuente...</option>
         {leadSources.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
       </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div>
        <label className={labelCls}>Asesor asignado</label>
        <select value={formData.advisor_id} onChange={e=>setFormData({...formData, advisor_id: e.target.value})} className={inputCls}>
         <option value="">Sin asignar</option>
         {advisors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
       </div>
       <div>
        <label className={labelCls}>Proyecto de interés</label>
        <ProjectSelect value={formData.project} onChange={(v: string) => setFormData({...formData, project: v})} className={inputCls} />
       </div>
      </div>
     </div>

     {/* Presupuesto */}
     <div className="space-y-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-accent">Presupuesto</p>
      <div className="grid grid-cols-3 gap-3">
       <div>
        <label className={labelCls}>Moneda</label>
        <select value={formData.currency} onChange={e=>setFormData({...formData, currency: e.target.value})} className={inputCls}>
         <option value="USD">USD ($)</option>
         <option value="PEN">PEN (S/)</option>
         <option value="EUR">EUR (€)</option>
        </select>
       </div>
       <div className="col-span-2">
        <label className={labelCls}>Monto</label>
        <input type="number" value={formData.budget_amount} onChange={e=>setFormData({...formData, budget_amount: e.target.value})} placeholder="0.00" className={inputCls} />
       </div>
      </div>
     </div>

     {/* Notas e Interés */}
     <div className="space-y-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-accent">Detalles Adicionales</p>
      <div>
       <label className={labelCls}>Interés específico</label>
       <input type="text" value={formData.interest} onChange={e=>setFormData({...formData, interest: e.target.value})} placeholder="Ej: Departamento 3 dorms con vista" className={inputCls} />
      </div>
      <div>
       <label className={labelCls}>Notas importantes</label>
       <textarea value={formData.notes} onChange={e=>setFormData({...formData, notes: e.target.value})} placeholder="Observaciones relevantes..." rows={3} className={`${inputCls} resize-none`} />
      </div>
     </div>
    </div>

    <div className={`px-8 py-4 border-t flex items-center justify-end gap-3 shrink-0 ${dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge'}`}>
     <button onClick={onClose} className="text-[11px] font-bold text-content-muted hover:text-content px-4">Cancelar</button>
     <button onClick={() => onSave(formData)} className="btn-primary py-2 px-6 text-[11px]">
      {editLead ? 'Actualizar registro' : 'Crear lead'}
     </button>
    </div>
   </div>
  </div>
 );
};

const ProjectSelect = ({ value, onChange, className }: { value: string; onChange: (v: string) => void; className: string }) => {
 const [projects, setProjects] = useState<string[]>([]);
 const { token } = useAuth();
 useEffect(() => {
  fetch(`${API_URL}/api/properties`, { headers: { Authorization: `Bearer ${token}` } })
   .then(r => r.json())
   .then(data => {
    if (Array.isArray(data)) {
     const unique = [...new Set(data.map((p: any) => p.project).filter(Boolean))] as string[];
     setProjects(unique);
    }
   }).catch(() => {});
 }, []);
 return (
  <select value={value} onChange={e => onChange(e.target.value)} className={className}>
   <option value="">Seleccionar proyecto...</option>
   {projects.map(p => <option key={p} value={p}>{p}</option>)}
  </select>
 );
};

export default Leads;
