import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar as CalendarIcon, DollarSign, ArrowUpRight, MessageSquare, RefreshCw, ArrowDownRight, CheckCircle2, Circle, Clock, Filter, Phone, MapPin, FileSignature, RotateCcw, Bookmark, ChevronDown, Building2, ListTodo, BrainCircuit, AlertCircle, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type TaskFilter = 'todas' | 'pendiente' | 'completada' | 'cancelada';
type TaskTypeFilter = 'todos' | 'Llamada' | 'Visita' | 'Email' | 'WhatsApp';
type DateFilter = 'hoy' | 'semana' | 'mes' | 'todas';

const Dashboard = ({ isDarkMode }: { isDarkMode?: boolean }) => {
 const { user, token } = useAuth();
 const [stats, setStats] = useState({ leads: 0, conversations: 0, properties: 0, users: 0, tasks: 0, tasksDone: 0, leadsNew: 0, leadsClosed: 0 });
 const [loading, setLoading] = useState(true);
 const [tasks, setTasks] = useState<any[]>([]);
 const [leads, setLeads] = useState<any[]>([]);
 const [recentLeads, setRecentLeads] = useState<any[]>([]);

 // Task filters
 const [statusFilter, setStatusFilter] = useState<TaskFilter>('todas');
 const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>('todos');
 const [dateFilter, setDateFilter] = useState<DateFilter>('semana');
 const [showFilters, setShowFilters] = useState(false);

 const hdr = { headers: { Authorization: `Bearer ${token}` } };

 const fetchAll = async () => {
  setLoading(true);
  try {
   const [usersRes, leadsRes, propsRes, tasksRes] = await Promise.allSettled([
    fetch(`${API_URL}/api/users`, hdr),
    fetch(`${API_URL}/api/leads`, hdr),
    fetch(`${API_URL}/api/properties`, hdr),
    fetch(`${API_URL}/api/data/tasks`, hdr),
   ]);

   let uCount = 0, lData: any[] = [], pCount = 0, tData: any[] = [];
   if (usersRes.status === 'fulfilled' && usersRes.value.ok) { const d = await usersRes.value.json(); uCount = d.users?.length || 0; }
   if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) { lData = await leadsRes.value.json(); }
   if (propsRes.status === 'fulfilled' && propsRes.value.ok) { const d = await propsRes.value.json(); pCount = Array.isArray(d) ? d.length : 0; }
   if (tasksRes.status === 'fulfilled' && tasksRes.value.ok) { tData = await tasksRes.value.json(); }

   const tasksDone = tData.filter((t: any) => t.status === 'completada').length;
   const leadsNew = lData.filter((l: any) => l.status === 'Nuevo').length;
   const leadsClosed = lData.filter((l: any) => l.status === 'Cerrado').length;

   setStats({ leads: lData.length, conversations: 0, properties: pCount, users: uCount, tasks: tData.length, tasksDone, leadsNew, leadsClosed });
   setTasks(tData);
   setLeads(lData);
   setRecentLeads(lData.slice(-5).reverse());
  } catch {}
  setLoading(false);
 };

 useEffect(() => { if (token) fetchAll(); }, [token]);

 const toggleTask = async (id: number) => {
  const t = tasks.find(x => x.id === id);
  if (!t) return;
  const ns = t.status === 'completada' ? 'pendiente' : 'completada';
  setTasks(tasks.map(x => x.id === id ? { ...x, status: ns } : x));
  try {
   await fetch(`${API_URL}/api/data/tasks/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title: t.title, description: t.description, status: ns, due_date: t.due_date })
   });
  } catch {}
 };

 const now = new Date();
 const filteredTasks = tasks.filter(t => {
  if (statusFilter !== 'todas' && t.status !== statusFilter) return false;
  if (typeFilter !== 'todos' && (t.type || 'Llamada') !== typeFilter) return false;
  if (dateFilter !== 'todas' && t.due_date) {
   const d = new Date(t.due_date);
   if (dateFilter === 'hoy' && d.toDateString() !== now.toDateString()) return false;
   if (dateFilter === 'semana') { const w = new Date(); w.setDate(w.getDate() + 7); if (d > w || d < new Date(now.toDateString())) return false; }
   if (dateFilter === 'mes') { const m = new Date(); m.setMonth(m.getMonth() + 1); if (d > m || d < new Date(now.toDateString())) return false; }
  }
  return true;
 });

 const pipelineCounts = leads.reduce((acc: any, l: any) => {
  const s = l.status || 'Nuevo';
  acc[s] = (acc[s] || 0) + 1;
  return acc;
 }, { 'Nuevo': 0, 'En Proceso': 0, 'Cerrado': 0, 'Perdido': 0 });

 const selectCls = `input-field text-xs py-2`;

 return (
  <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-surface-base">
   <div className="max-w-7xl mx-auto space-y-8">

    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
     <div className="flex items-center gap-3">
       <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/10 text-accent">
        <LayoutDashboard size={22} />
       </div>
       <div>
        <h1 className="h1">Hola, {user?.name || 'Usuario'}</h1>
        <p className="body-text text-sm">Resumen operativo ChatPrex</p>
       </div>
     </div>
     <div className="flex items-center gap-3 w-full md:w-auto">
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-edge bg-surface text-content-secondary">
       <CalendarIcon size={14} className="text-accent" />
       <span className="text-xs font-medium">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
      <button onClick={fetchAll} className="btn-primary px-3 py-2">
       <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      </button>
     </div>
    </div>

    {/* KPIs */}
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
     <StatCard label="Leads totales" value={stats.leads} trend={stats.leadsNew > 0 ? `+${stats.leadsNew}` : ''} icon={<Users size={20} strokeWidth={2.5} />} iconColor="text-blue-500" bgSoft="bg-blue-500/5" glowColor="bg-blue-500" />
     <StatCard label="Propiedades" value={stats.properties} trend="" icon={<Building2 size={20} strokeWidth={2.5} />} iconColor="text-indigo-500" bgSoft="bg-indigo-500/5" glowColor="bg-indigo-500" />
     <StatCard label="Efectividad" value={stats.tasks > 0 ? `${Math.round((stats.tasksDone / stats.tasks) * 100)}%` : '0%'} trend={stats.tasksDone > 0 ? `${stats.tasksDone}/${stats.tasks}` : ''} icon={<ListTodo size={20} strokeWidth={2.5} />} iconColor="text-amber-500" bgSoft="bg-amber-500/5" glowColor="bg-amber-500" />
     <StatCard label="Cierres exitosos" value={stats.leadsClosed} trend={stats.leads > 0 ? `${Math.round((stats.leadsClosed / stats.leads) * 100)}%` : ''} icon={<DollarSign size={20} strokeWidth={2.5} />} iconColor="text-emerald-500" bgSoft="bg-emerald-500/5" glowColor="bg-emerald-500" />
    </div>

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

     {/* Task Monitoring Panel */}
     <div className="lg:col-span-2 card flex flex-col overflow-hidden">
      <div className="px-5 py-4 border-b border-edge flex items-center justify-between flex-wrap gap-4 bg-surface-inset">
       <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
          <ListTodo size={18} className="text-accent" />
        </div>
        <div>
          <h3 className="h3 !text-base">Panel de seguimiento</h3>
          <span className="label-text">{filteredTasks.length} actividades programadas</span>
        </div>
       </div>
       <div className="flex items-center gap-2">
        <select value={dateFilter} onChange={e => setDateFilter(e.target.value as DateFilter)} className={selectCls}>
         <option value="hoy">Hoy</option>
         <option value="semana">Semana</option>
         <option value="mes">Mes</option>
         <option value="todas">Todo</option>
        </select>
        <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-accent text-content border-accent' : 'border-edge text-content-muted hover:text-content'}`}>
         <Filter size={16} />
        </button>
       </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
       <div className="px-5 py-3 border-b border-edge flex flex-wrap gap-3 items-center bg-surface-inset">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as TaskFilter)} className={selectCls}>
         <option value="todas">Todos los estados</option>
         <option value="pendiente">Pendiente</option>
         <option value="completada">Completada</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TaskTypeFilter)} className={selectCls}>
         <option value="todos">Todos los tipos</option>
         <option value="Llamada">Llamada</option>
         <option value="Visita">Visita</option>
         <option value="Email">Email</option>
         <option value="WhatsApp">WhatsApp</option>
        </select>
        <button onClick={() => { setStatusFilter('todas'); setTypeFilter('todos'); setDateFilter('semana'); }} className="text-xs font-medium text-accent hover:underline ml-auto">Resetear filtros</button>
       </div>
      )}

      {/* List — compact 2-row card layout */}
      <div className="flex-1 lg:overflow-y-auto lg:max-h-[600px] p-3 space-y-1.5">
       {filteredTasks.length === 0 ? (
        <div className="text-center py-14 flex flex-col items-center">
         <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-surface-inset">
           <ListTodo size={24} className="text-content-muted" />
         </div>
         <p className="text-xs font-medium text-content-muted">Sin tareas programadas</p>
        </div>
       ) : filteredTasks.map(t => {
        const isDone = t.status === 'completada';
        const dueDate = t.due_date ? new Date(t.due_date) : null;
        const isOverdue = dueDate && dueDate < now && !isDone;
        const TIcon = { Llamada: Phone, Visita: MapPin, Email: MessageSquare, WhatsApp: MessageSquare }[t.type || 'Llamada'] || Phone;
        const advisorInitial = t.advisor_name ? t.advisor_name.charAt(0).toUpperCase() : '';
        const descText = t.description || '';

        return (
         <div key={t.id} className={`group p-3 rounded-lg border border-edge transition-colors hover:bg-surface-inset ${isDone ? 'opacity-50' : ''}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
           
           {/* Col 1: Checkbox & Titulo/Detalle */}
           <div className="flex items-start gap-3 flex-1 min-w-0">
            <button onClick={() => toggleTask(t.id)} className={`mt-0.5 shrink-0 transition-colors ${isDone ? 'text-emerald-500' : 'text-content-muted hover:text-accent'}`}>
             {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <p className={`text-[13px] font-semibold truncate ${isDone ? 'line-through text-content-muted' : 'text-content'}`}>{t.title}</p>
                {t.lead_name && (
                 <span className="shrink-0 text-[10px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded truncate max-w-[100px]">{t.lead_name}</span>
                )}
              </div>
              {descText && (
               <p className="text-[11px] text-content-secondary truncate w-full" title={descText}>{descText}</p>
              )}
            </div>
           </div>

           {/* Contenedor de metadata (Tipo, Fecha, Asesor) */}
           <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 ml-7 sm:ml-0 shrink-0">
             {/* Col 2: Tipo */}
             <div className="flex items-center gap-1.5 sm:w-20 shrink-0">
              <TIcon size={14} className="text-accent" />
              <span className="text-[12px] font-medium text-content-muted capitalize">{t.type || 'Tarea'}</span>
             </div>

             {/* Col 3: Fecha */}
             <div className={`flex items-center gap-1.5 sm:w-32 shrink-0 ${isOverdue ? 'text-red-500' : 'text-content-muted'}`}>
              <Clock size={14} />
              {dueDate ? (
                <div className="text-[11px] font-medium leading-tight">
                  <div>{dueDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</div>
                  <div className="opacity-80">{dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ) : (
                <span className="text-[11px] font-medium">Sin fecha</span>
              )}
             </div>

             {/* Col 4: Asesor */}
             <div className="flex items-center gap-2 sm:w-32 shrink-0 sm:border-l sm:border-edge sm:pl-4">
              {advisorInitial ? (
               <>
                <div className="shrink-0 w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-[10px] font-bold border border-accent/20" title={t.advisor_name}>
                 {advisorInitial}
                </div>
                <span className="text-[11px] font-medium text-content-muted truncate">{t.advisor_name}</span>
               </>
              ) : (
               <>
                <div className="shrink-0 w-6 h-6 rounded-full bg-surface-inset text-content-muted flex items-center justify-center text-[10px] border border-edge">
                 —
                </div>
                <span className="text-[11px] font-medium text-content-muted">Sin asignar</span>
               </>
              )}
             </div>
           </div>

          </div>
         </div>
        );
       })}
      </div>
     </div>

     {/* Right Sidebar */}
     <div className="space-y-6">
      {/* Pipeline Visual */}
      <div className="card p-5">
        <div className="flex justify-between items-center mb-5">
         <div>
           <h3 className="h3 !text-base">Pipeline activo</h3>
           <p className="label-text mt-0.5">Flujo comercial actual</p>
         </div>
         <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
           <TrendingUp size={16} className="text-emerald-500" />
         </div>
        </div>
        <div className="space-y-4">
         {Object.entries(pipelineCounts).map(([status, count]) => {
          const pct = stats.leads > 0 ? Math.round((count / stats.leads) * 100) : 0;
          return (
           <div key={status}>
            <div className="flex justify-between text-xs mb-1.5">
             <span className="font-medium text-content-secondary">{status}</span>
             <span className="font-semibold text-accent">{count}</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-inset">
             <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${pct}%` }} />
            </div>
           </div>
          );
         })}
        </div>
      </div>

      {/* Recent Leads Activity */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-edge flex justify-between items-center bg-surface-inset">
         <h3 className="h3 !text-sm">Leads recientes</h3>
         <Users size={16} className="text-accent" />
        </div>
        <div className="divide-y divide-edge">
         {recentLeads.length === 0 ? (
          <p className="p-8 text-center label-text">No hay leads registrados recientemente</p>
         ) : recentLeads.map(l => (
          <div key={l.id} className="px-5 py-3 flex items-center gap-3 transition-colors hover:bg-surface-inset">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 bg-accent/10 text-accent border border-edge">
             {l.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
             <p className="text-sm font-medium truncate text-content">{l.name}</p>
             <p className="text-xs text-content-muted truncate mt-0.5">{l.phone}</p>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-surface-inset text-content-muted">{l.status}</span>
          </div>
         ))}
        </div>
        <div className="p-4 border-t border-edge text-center bg-surface-inset">
         <button className="text-xs font-medium text-accent hover:underline">Ver todos los leads</button>
        </div>
      </div>
     </div>
    </div>
   </div>
  </div>
 );
};

const StatCard = ({ label, value, trend, icon, iconColor, bgSoft, glowColor }: any) => {
 const iconBg = bgSoft.replace('/5', '/10');
 const bgIcon = React.cloneElement(icon, { size: 110, strokeWidth: 1.5 });
 return (
  <div className={`card p-4 sm:p-5 group transition-all duration-300 hover:-translate-y-1 ${bgSoft} border-transparent relative overflow-hidden`}>
   {/* Large background icon */}
   <div className={`absolute -bottom-6 -right-6 opacity-[0.04] dark:opacity-[0.06] ${iconColor} pointer-events-none transform -rotate-12 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6`}>
     {bgIcon}
   </div>

   {/* Soft glow in corner */}
   <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 dark:opacity-30 ${glowColor} pointer-events-none`}></div>
   
    <div className="relative z-10">
     <div className="flex justify-between items-start mb-3 sm:mb-4">
      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${iconBg} ${iconColor} shadow-inner border border-white/5`}>
       {React.cloneElement(icon, { size: 18 })}
      </div>
      {trend && (
       <div className="flex items-center gap-1 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-xs font-bold border border-emerald-500/20">
         <ArrowUpRight size={12} strokeWidth={2.5} /> {trend}
       </div>
      )}
     </div>
     <p className="text-[9px] sm:text-[11px] font-bold text-content-muted uppercase tracking-wider mb-0.5 truncate">{label}</p>
     <h2 className="text-2xl sm:text-3xl font-black text-content tracking-tight">{value}</h2>
    </div>
  </div>
 );
};

export default Dashboard;
