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

  const dc = isDarkMode;
  const selectCls = `px-4 py-2.5 rounded-[18px] border text-[11px] font-black uppercase tracking-widest outline-none transition-all ${dc ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-800 shadow-sm'}`;

  return (
    <div className={`flex-1 overflow-y-auto p-6 md:p-10 pb-24 md:pb-10 transition-colors ${dc ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-4">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${dc ? 'bg-primary/20 text-primary shadow-inner' : 'bg-white text-primary border border-slate-100'}`}>
                <LayoutDashboard size={28} />
             </div>
             <div>
                <h1 className="h1">Hola, {user?.name || 'Usuario'}</h1>
                <p className="body-text text-xs uppercase tracking-[2px] font-bold opacity-60">Resumen operativo ChatPrex</p>
             </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl border transition-all ${dc ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-white border-slate-100 text-slate-600 shadow-md'}`}>
              <CalendarIcon size={16} className="text-primary" />
              <span className="text-[11px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <button onClick={fetchAll} className="btn-primary p-3.5 rounded-2xl shadow-2xl shadow-primary/30 hover:brightness-110 transition-all active:scale-95">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <StatCard label="Leads totales" value={stats.leads} trend={stats.leadsNew > 0 ? `+${stats.leadsNew}` : ''} icon={<Users size={20} className="text-white" />} color="bg-primary" isDarkMode={dc} />
          <StatCard label="Propiedades" value={stats.properties} trend="" icon={<Building2 size={20} className="text-white" />} color="bg-blue-500" isDarkMode={dc} />
          <StatCard label="Efectividad" value={stats.tasks > 0 ? `${Math.round((stats.tasksDone / stats.tasks) * 100)}%` : '0%'} trend={stats.tasksDone > 0 ? `${stats.tasksDone}/${stats.tasks}` : ''} icon={<ListTodo size={20} className="text-white" />} color="bg-amber-500" isDarkMode={dc} />
          <StatCard label="Cierres exitosos" value={stats.leadsClosed} trend={stats.leads > 0 ? `${Math.round((stats.leadsClosed / stats.leads) * 100)}%` : ''} icon={<DollarSign size={20} className="text-white" />} color="bg-emerald-500" isDarkMode={dc} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Task Monitoring Panel */}
          <div className="lg:col-span-2 card-premium flex flex-col overflow-hidden animate-in fade-in duration-500">
            <div className={`px-8 py-6 border-b flex items-center justify-between flex-wrap gap-6 ${dc ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-50'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[20px] bg-primary/10 flex items-center justify-center shadow-inner">
                   <ListTodo size={22} className="text-primary" />
                </div>
                <div>
                   <h3 className="h3">Panel de seguimiento</h3>
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-80">{filteredTasks.length} actividades programadas</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select value={dateFilter} onChange={e => setDateFilter(e.target.value as DateFilter)} className={selectCls}>
                  <option value="hoy">Hoy</option>
                  <option value="semana">Semana</option>
                  <option value="mes">Mes</option>
                  <option value="todas">Todo</option>
                </select>
                <button onClick={() => setShowFilters(!showFilters)} className={`p-3 rounded-2xl border transition-all active:scale-95 shadow-sm ${showFilters ? 'bg-primary text-white border-primary shadow-lg' : (dc ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-800')}`}>
                  <Filter size={18} />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className={`px-8 py-5 border-b flex flex-wrap gap-4 items-center animate-in slide-in-from-top duration-300 ${dc ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50 border-slate-50'}`}>
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
                <button onClick={() => { setStatusFilter('todas'); setTypeFilter('todos'); setDateFilter('semana'); }} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline ml-auto">Resetear filtros</button>
              </div>
            )}

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar p-6 space-y-4">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-24 flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${dc ? 'bg-slate-800' : 'bg-slate-50'}`}>
                     <ListTodo size={40} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sin tareas programadas</p>
                </div>
              ) : filteredTasks.map(t => {
                const isDone = t.status === 'completada';
                const dueDate = t.due_date ? new Date(t.due_date) : null;
                const isOverdue = dueDate && dueDate < now && !isDone;
                const TIcon = { Llamada: Phone, Visita: MapPin, Email: MessageSquare, WhatsApp: MessageSquare }[t.type || 'Llamada'] || Phone;
                
                return (
                  <div key={t.id} className={`group p-5 rounded-[24px] border flex items-center gap-5 transition-all hover:shadow-xl ${isDone ? 'opacity-50' : (dc ? 'hover:bg-white/5' : 'hover:bg-slate-50 shadow-sm')} ${dc ? 'border-slate-800/50' : 'border-slate-100'}`}>
                    <button onClick={() => toggleTask(t.id)} className={`shrink-0 transition-all active:scale-90 ${isDone ? 'text-emerald-500' : 'text-slate-300 hover:text-primary'}`}>
                      {isDone ? <CheckCircle2 size={24} className="fill-emerald-500/10" /> : <Circle size={24} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-bold tracking-tight truncate ${isDone ? 'line-through text-slate-500' : (dc ? 'text-white' : 'text-slate-800')}`}>{t.title}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-70">
                           <TIcon size={14} className="text-primary" />
                           <span>{t.type || 'Tarea'}</span>
                        </div>
                        {dueDate && (
                          <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isOverdue ? 'text-rose-500' : 'text-slate-400'}`}>
                             <Clock size={14} />
                             <span>{dueDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} • {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                       <span className={`text-[9px] font-black uppercase tracking-[2px] px-3 py-1.5 rounded-xl ${t.description === 'Alta' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>{t.description || 'Normal'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-10">
            {/* Pipeline Visual */}
            <div className="card-premium p-8 animate-in slide-in-from-right duration-500">
               <div className="flex justify-between items-center mb-8">
                  <div>
                     <h3 className="h3">Pipeline activo</h3>
                     <p className="body-text text-[10px] uppercase tracking-widest font-bold opacity-60 mt-1">Flujo comercial actual</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                     <TrendingUp size={20} className="text-emerald-500" />
                  </div>
               </div>
               <div className="space-y-6">
                  {Object.entries(pipelineCounts).map(([status, count]) => {
                    const pct = stats.leads > 0 ? Math.round((count / stats.leads) * 100) : 0;
                    return (
                      <div key={status}>
                        <div className="flex justify-between text-[11px] mb-2.5 font-black uppercase tracking-widest">
                          <span className={dc ? 'text-slate-400' : 'text-slate-500'}>{status}</span>
                          <span className="text-primary">{count}</span>
                        </div>
                        <div className={`w-full h-2 rounded-full ${dc ? 'bg-slate-800' : 'bg-slate-100 shadow-inner'}`}>
                          <div className="h-full bg-primary rounded-full transition-all duration-1000 shadow-lg shadow-primary/30" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
               </div>
            </div>

            {/* Recent Leads Activity */}
            <div className="card-premium overflow-hidden animate-in slide-in-from-right duration-700 delay-100">
               <div className={`px-8 py-6 border-b flex justify-between items-center ${dc ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-50 border-slate-50'}`}>
                  <h3 className="h3 !text-sm">Leads recientes</h3>
                  <Users size={18} className="text-primary" />
               </div>
               <div className={`divide-y ${dc ? 'divide-slate-800' : 'divide-slate-50'}`}>
                  {recentLeads.length === 0 ? (
                    <p className="p-10 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-60">No hay leads registrados recientemente</p>
                  ) : recentLeads.map(l => (
                    <div key={l.id} className={`px-8 py-5 flex items-center gap-4 transition-colors hover:bg-slate-50 ${dc ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                       <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black shrink-0 shadow-lg ${dc ? 'bg-slate-800 text-primary border border-slate-700' : 'bg-white text-primary border border-slate-100 shadow-md'}`}>
                          {l.name?.charAt(0).toUpperCase()}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className={`text-[13px] font-bold truncate tracking-tight ${dc ? 'text-white' : 'text-slate-800'}`}>{l.name}</p>
                          <p className="text-[11px] font-bold text-slate-500 truncate opacity-70 mt-0.5">{l.phone}</p>
                       </div>
                       <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${dc ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{l.status}</span>
                    </div>
                  ))}
               </div>
               <div className={`p-6 border-t text-center ${dc ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-50 border-slate-50'}`}>
                  <button className="text-[10px] font-black uppercase tracking-[2px] text-primary hover:brightness-110 transition-all">Ver todos los leads</button>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, icon, color, isDarkMode }: any) => (
  <div className="card-premium p-8 group transition-all hover:scale-[1.02] hover:shadow-3xl">
    <div className="flex justify-between items-start mb-6">
      <div className={`w-12 h-12 rounded-[20px] flex items-center justify-center ${color} shadow-2xl shadow-inherit transition-transform group-hover:rotate-6`}>{icon}</div>
      {trend && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[11px] font-black">
           <ArrowUpRight size={14} /> {trend}
        </div>
      )}
    </div>
    <p className="body-text text-[10px] uppercase tracking-widest font-black opacity-60 mb-2">{label}</p>
    <h2 className="text-3xl font-black tracking-tight">{value}</h2>
  </div>
);

export default Dashboard;
