import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, Calendar as CalendarIcon, DollarSign, ArrowUpRight, MessageSquare, RefreshCw, Calendar, ArrowDownRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Dashboard = ({ isDarkMode }: { isDarkMode?: boolean }) => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({ leads: 0, conversations: 0, appointments: 0, users: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Get user count from API
      const res = await fetch(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(prev => ({ ...prev, users: data.users?.length || 0 }));
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Bienvenido, {user?.name || 'Usuario'}</h1>
            <p className={`text-[12px] md:text-[13px] text-slate-500 mt-1 font-medium`}>Aquí tienes el resumen de hoy en ChatPrex</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`flex-1 md:flex-none flex items-center gap-2 px-4 py-2 border rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
              <CalendarIcon size={16} />
              <span className="text-[12px] font-bold">{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}</span>
            </div>
            <button onClick={fetchStats} className="bg-primary text-white p-2 md:p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <StatCard label="Leads" value={stats.leads.toString()} trend="—" icon={<Users size={18} className="text-white" />} color="bg-primary" isDarkMode={isDarkMode} />
          <StatCard label="Conversaciones" value={stats.conversations.toString()} trend="—" icon={<MessageSquare size={18} className="text-white" />} color="bg-blue-500" isDarkMode={isDarkMode} />
          <StatCard label="Citas Hoy" value={stats.appointments.toString()} trend="—" icon={<CalendarIcon size={18} className="text-white" />} color="bg-amber-500" isDarkMode={isDarkMode} />
          <StatCard label="Usuarios" value={stats.users.toString()} trend="" icon={<DollarSign size={18} className="text-white" />} color="bg-emerald-500" isDarkMode={isDarkMode} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Placeholder */}
          <div className={`p-6 rounded-2xl lg:col-span-2 border transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Evolución de Leads vs Cierres</h3>
            <div className={`h-64 flex items-center justify-center ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
              <div className="text-center">
                <TrendingUp size={48} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Las estadísticas se actualizarán con datos reales</p>
                <p className="text-xs mt-1">Conecta leads y conversaciones para ver métricas</p>
              </div>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className={`p-6 rounded-2xl border transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Actividad Reciente</h3>
            <div className={`flex flex-col items-center justify-center h-48 ${isDarkMode ? 'text-slate-600' : 'text-slate-300'}`}>
              <Calendar size={36} className="mb-3 opacity-40" />
              <p className="text-sm font-medium text-center">Sin actividad reciente</p>
              <p className="text-xs mt-1 text-center">La actividad aparecerá aquí cuando uses el CRM</p>
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
      {trend && trend !== '—' && trend !== '' && (
        <div className={`flex items-center gap-1 text-[11px] font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
          {trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {trend}
        </div>
      )}
    </div>
    <p className={`text-[11px] md:text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1`}>{label}</p>
    <h3 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{value}</h3>
  </div>
);

export default Dashboard;
