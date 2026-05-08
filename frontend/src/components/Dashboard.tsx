import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar as CalendarIcon, DollarSign, ArrowUpRight, MessageSquare, RefreshCw, ArrowDownRight, CheckCircle2, Circle, Clock, Filter, Phone, MapPin, FileSignature, RotateCcw, Bookmark, ChevronDown, Building2, ListTodo, BrainCircuit, AlertCircle } from 'lucide-react';
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

  // Filtered tasks
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

  const pending = filteredTasks.filter(t => t.status === 'pendiente').length;
  const done = filteredTasks.filter(t => t.status === 'completada').length;

  const pipelineCounts: Record<string, number> = {};
  leads.forEach(l => { pipelineCounts[l.status] = (pipelineCounts[l.status] || 0) + 1; });

  const dc = isDarkMode;
  const card = `rounded-2xl border shadow-sm transition-all ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`;
  const selectCls = `px-3 py-2 rounded-xl text-xs font-bold outline-none transition-all ${dc ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-slate-700 border border-slate-200'}`;

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 transition-colors ${dc ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-[18px] md:text-[20px] font-bold ${dc ? 'text-white' : 'text-slate-800'}`}>Bienvenido, {user?.name || 'Usuario'}</h1>
            <p className="text-[12px] md:text-[13px] text-slate-500 mt-1 font-medium">Aquí tienes el resumen de hoy en ChatPrex</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`flex-1 md:flex-none flex items-center gap-2 px-4 py-2 border rounded-xl transition-all ${dc ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
              <CalendarIcon size={16} />
              <span className="text-[12px] font-bold">{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</span>
            </div>
            <button onClick={fetchAll} className="bg-primary text-white p-2 md:p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard label="Total Leads" value={stats.leads} trend={stats.leadsNew > 0 ? `+${stats.leadsNew} nuevos` : ''} icon={<Users size={18} className="text-white" />} color="bg-primary" isDarkMode={dc} />
          <StatCard label="Propiedades" value={stats.properties} trend="" icon={<Building2 size={18} className="text-white" />} color="bg-blue-500" isDarkMode={dc} />
          <StatCard label="Tareas Completadas" value={`${stats.tasksDone}/${stats.tasks}`} trend={stats.tasks > 0 ? `${Math.round((stats.tasksDone / stats.tasks) * 100)}%` : ''} icon={<ListTodo size={18} className="text-white" />} color="bg-amber-500" isDarkMode={dc} />
          <StatCard label="Cierres" value={stats.leadsClosed} trend={stats.leads > 0 ? `${Math.round((stats.leadsClosed / stats.leads) * 100)}% tasa` : ''} icon={<DollarSign size={18} className="text-white" />} color="bg-emerald-500" isDarkMode={dc} />
        </div>

        {/* Pipeline Mini */}
        <div className={card + ' p-5'}>
          <h3 className={`text-sm font-bold mb-4 ${dc ? 'text-slate-200' : 'text-slate-800'}`}>Pipeline de Leads</h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {Object.entries(pipelineCounts).length > 0 ? Object.entries(pipelineCounts).map(([status, count]) => {
              const colors: Record<string, string> = { Nuevo: 'bg-blue-500', Contactado: 'bg-amber-500', Cita: 'bg-purple-500', 'Negociación': 'bg-emerald-500', Cerrado: 'bg-slate-500' };
              const bg = colors[status] || 'bg-primary';
              const pct = stats.leads > 0 ? Math.round((count / stats.leads) * 100) : 0;
              return (
                <div key={status} className={`flex-1 min-w-[100px] p-3 rounded-xl border ${dc ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[9px] font-bold tracking-wider lowercase ${dc ? 'text-slate-400' : 'text-slate-500'}`}>{status}</span>
                    <span className={`text-xs font-bold ${dc ? 'text-white' : 'text-slate-800'}`}>{count}</span>
                  </div>
                  <div className={`h-1.5 rounded-full ${dc ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div className={`h-full rounded-full ${bg} transition-all`} style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            }) : (
              <div className={`w-full text-center py-6 text-sm font-medium ${dc ? 'text-slate-600' : 'text-slate-400'}`}>Sin leads registrados aún</div>
            )}
          </div>
        </div>

        {/* Main Grid: Tasks + Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Task Control Panel */}
          <div className={card + ' lg:col-span-2 flex flex-col overflow-hidden'}>
            <div className={`px-5 py-4 border-b flex items-center justify-between flex-wrap gap-3 ${dc ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <ListTodo size={18} className="text-primary" />
                <h3 className={`text-sm font-bold ${dc ? 'text-slate-200' : 'text-slate-800'}`}>Panel de Seguimiento</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${dc ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>{filteredTasks.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <select value={dateFilter} onChange={e => setDateFilter(e.target.value as DateFilter)} className={selectCls}>
                  <option value="hoy">Hoy</option>
                  <option value="semana">Esta Semana</option>
                  <option value="mes">Este Mes</option>
                  <option value="todas">Todas</option>
                </select>
                <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-primary/10 border-primary text-primary' : (dc ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-white border-slate-200 text-slate-500')}`}>
                  <Filter size={16} />
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className={`px-5 py-3 border-b flex flex-wrap gap-3 items-center ${dc ? 'border-slate-800 bg-slate-800/20' : 'border-slate-100 bg-slate-50/50'}`}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as TaskFilter)} className={selectCls}>
                  <option value="todas">Todos los estados</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="completada">Completada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TaskTypeFilter)} className={selectCls}>
                  <option value="todos">Todos los tipos</option>
                  <option value="Llamada">Llamada</option>
                  <option value="Visita">Visita</option>
                  <option value="Email">Email</option>
                  <option value="WhatsApp">WhatsApp</option>
                </select>
                <button onClick={() => { setStatusFilter('todas'); setTypeFilter('todos'); setDateFilter('semana'); }} className="text-xs font-bold text-primary hover:underline ml-auto">Limpiar filtros</button>
              </div>
            )}

            {/* Summary chips */}
            <div className={`px-5 py-3 flex gap-3 border-b ${dc ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${dc ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                <AlertCircle size={13} /> {pending} pendientes
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${dc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
                <CheckCircle2 size={13} /> {done} completadas
              </div>
            </div>

            {/* Task list */}
            <div className="flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">
              {filteredTasks.length === 0 ? (
                <div className={`p-10 text-center ${dc ? 'text-slate-600' : 'text-slate-400'}`}>
                  <ListTodo size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-bold">Sin tareas en este rango</p>
                  <p className="text-xs mt-1">Ajusta los filtros o crea nuevas tareas desde Leads</p>
                </div>
              ) : filteredTasks.map(t => {
                const isDone = t.status === 'completada';
                const isCancelled = t.status === 'cancelada';
                const dueDate = t.due_date ? new Date(t.due_date) : null;
                const isOverdue = dueDate && dueDate < now && !isDone && !isCancelled;
                const typeIcons: Record<string, any> = { Llamada: Phone, Visita: MapPin, Email: MessageSquare, WhatsApp: MessageSquare };
                const TIcon = typeIcons[t.type || 'Llamada'] || Phone;
                const pri = t.description || 'Media';
                return (
                  <div key={t.id} className={`px-5 py-3 flex items-center gap-3 border-b transition-all group ${dc ? 'border-slate-800/50 hover:bg-white/5' : 'border-slate-50 hover:bg-slate-50/80'} ${isCancelled ? 'opacity-40' : ''}`}>
                    <button onClick={() => toggleTask(t.id)} className={`shrink-0 transition-all ${isDone ? 'text-emerald-500' : (isOverdue ? 'text-rose-400' : 'text-slate-300 hover:text-primary')}`}>
                      {isDone ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${dc ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <TIcon size={13} className={isOverdue ? 'text-rose-500' : 'text-blue-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-semibold truncate ${isDone ? 'line-through text-slate-500' : (dc ? 'text-slate-200' : 'text-slate-800')}`}>{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {dueDate && <span className={`text-[10px] font-bold flex items-center gap-1 ${isOverdue ? 'text-rose-500' : 'text-slate-500'}`}><Clock size={10} className="text-blue-500" /> {dueDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${pri === 'Alta' ? 'bg-rose-500/10 text-rose-500' : pri === 'Baja' ? 'bg-slate-100 text-slate-400' : 'bg-blue-500/10 text-blue-500'}`}>{pri}</span>
                        {isOverdue && <span className="text-[9px] font-bold text-rose-500 lowercase tracking-wider">vencida</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar: Recent Leads */}
          <div className="space-y-6">
            <div className={card + ' overflow-hidden'}>
              <div className={`px-5 py-4 border-b ${dc ? 'border-slate-800' : 'border-slate-100'}`}>
                <h3 className={`text-sm font-bold flex items-center gap-2 ${dc ? 'text-slate-200' : 'text-slate-800'}`}>
                  <Users size={16} className="text-primary" /> Leads Recientes
                </h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentLeads.length === 0 ? (
                  <div className={`p-8 text-center ${dc ? 'text-slate-600' : 'text-slate-400'}`}>
                    <Users size={28} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">Sin leads recientes</p>
                  </div>
                ) : recentLeads.map(l => (
                  <div key={l.id} className={`px-5 py-3 flex items-center gap-3 transition-colors ${dc ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${dc ? 'bg-slate-800 text-slate-400' : 'bg-primary/10 text-primary'}`}>
                      {l.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12px] font-bold truncate ${dc ? 'text-slate-200' : 'text-slate-800'}`}>{l.name}</p>
                      <p className="text-[10px] text-slate-500 truncate">{l.phone}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 ${l.status === 'Nuevo' ? 'bg-blue-500/10 text-blue-500' : l.status === 'Cerrado' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{l.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className={card + ' p-5'}>
              <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${dc ? 'text-slate-200' : 'text-slate-800'}`}>
                <BrainCircuit size={16} className="text-purple-500" /> Rendimiento IA
              </h3>
              <div className="space-y-3">
                <MiniStat label="Tasa de cierre" value={stats.leads > 0 ? `${Math.round((stats.leadsClosed / stats.leads) * 100)}%` : '0%'} color="emerald" dc={dc} />
                <MiniStat label="Tareas cumplidas" value={stats.tasks > 0 ? `${Math.round((stats.tasksDone / stats.tasks) * 100)}%` : '0%'} color="blue" dc={dc} />
                <MiniStat label="Leads activos" value={`${stats.leads - stats.leadsClosed}`} color="amber" dc={dc} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, trend, icon, color, isDarkMode }: any) => (
  <div className={`p-5 rounded-2xl border shadow-sm transition-all hover:shadow-lg ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2.5 rounded-xl ${color} shadow-sm`}>{icon}</div>
      {trend && <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500"><ArrowUpRight size={12} /> {trend}</div>}
    </div>
    <p className="text-[10px] font-bold text-slate-500 lowercase tracking-wider mb-1">{label}</p>
    <h3 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{value}</h3>
  </div>
);

const MiniStat = ({ label, value, color, dc }: { label: string; value: string; color: string; dc?: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={`text-[11px] font-medium ${dc ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
    <span className={`text-[12px] font-bold text-${color}-500`}>{value}</span>
  </div>
);

export default Dashboard;
