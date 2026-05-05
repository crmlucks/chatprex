import React from 'react';
import { Users, TrendingUp, Calendar as CalendarIcon, DollarSign, ArrowUpRight, MessageSquare, RefreshCw, Calendar, ArrowDownRight } from 'lucide-react';

const Dashboard = ({ isDarkMode }: { isDarkMode?: boolean }) => {
  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Encabezado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Bienvenido, Administrador</h1>
            <p className={`text-[12px] md:text-[13px] text-slate-500 mt-1 font-medium`}>Aquí tienes el resumen de hoy en ChatPrex</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`flex-1 md:flex-none flex items-center gap-2 px-4 py-2 border rounded-xl transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
              <CalendarIcon size={16} />
              <span className="text-[12px] font-bold">Mayo 2026</span>
            </div>
            <button className="bg-primary text-white p-2 md:p-2.5 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
          <StatCard label="Nuevos Leads" value="124" trend="+12%" icon={<Users size={18} className="text-white" />} color="bg-primary" isDarkMode={isDarkMode} />
          <StatCard label="Conversaciones" value="48" trend="+5%" icon={<MessageSquare size={18} className="text-white" />} color="bg-blue-500" isDarkMode={isDarkMode} />
          <StatCard label="Citas Hoy" value="8" trend="-2%" icon={<CalendarIcon size={18} className="text-white" />} color="bg-amber-500" isDarkMode={isDarkMode} />
          <StatCard label="Cierres Est." value="$2.4M" trend="+18%" icon={<DollarSign size={18} className="text-white" />} color="bg-emerald-500" isDarkMode={isDarkMode} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Mockup */}
          <div className={`p-6 rounded-2xl lg:col-span-2 border transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Evolución de Leads vs Cierres</h3>
            <div className={`h-64 flex items-end justify-between gap-2 border-b border-l p-2 pb-0 transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              {/* Barras simuladas */}
              {[40, 60, 45, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="w-full flex justify-center group relative">
                  <div className={`w-full max-w-[32px] rounded-t-sm transition-colors h-full flex flex-col justify-end ${isDarkMode ? 'bg-primary/10 group-hover:bg-primary/20' : 'bg-primary/20 group-hover:bg-primary/30'}`} style={{ height: `${h}%` }}>
                    <div className="w-full bg-primary rounded-t-sm" style={{ height: `${h * 0.4}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
            <div className={`flex justify-between mt-2 text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>Lun</span><span>Mar</span><span>Mie</span><span>Jue</span><span>Vie</span><span>Sab</span><span>Dom</span>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div className={`p-6 rounded-2xl border transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <h3 className={`font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Actividad Reciente</h3>
            <div className="flex flex-col gap-4">
              <ActivityItem text="Nuevo lead asignado: Carlos M." time="Hace 5 min" type="lead" isDarkMode={isDarkMode} />
              <ActivityItem text="Cita agendada con Ana Gómez" time="Hace 1 hora" type="calendar" isDarkMode={isDarkMode} />
              <ActivityItem text="Mensaje automático enviado" time="Hace 2 horas" type="bot" isDarkMode={isDarkMode} />
              <ActivityItem text="Propiedad vendida: Villa Norte" time="Ayer" type="success" isDarkMode={isDarkMode} />
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
      <div className={`flex items-center gap-1 text-[11px] font-bold ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend.startsWith('+') ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {trend}
      </div>
    </div>
    <p className={`text-[11px] md:text-[12px] font-bold text-slate-500 uppercase tracking-widest mb-1`}>{label}</p>
    <h3 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{value}</h3>
  </div>
);

const ActivityItem = ({ text, time, type, isDarkMode }: any) => {
  const getDotColor = () => {
    switch(type) {
      case 'lead': return 'bg-primary';
      case 'calendar': return 'bg-amber-500';
      case 'bot': return 'bg-purple-500';
      case 'success': return 'bg-emerald-500';
      default: return 'bg-slate-300';
    }
  };

  return (
    <div className="flex items-start gap-3 group">
      <div className="mt-1.5 relative flex items-center justify-center">
        <div className={`w-2.5 h-2.5 rounded-full ${getDotColor()} shadow-sm shadow-black/20`}></div>
      </div>
      <div>
        <p className={`text-[12px] md:text-[13px] font-medium group-hover:translate-x-1 transition-transform ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{text}</p>
        <p className={`text-[11px] mt-0.5 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{time}</p>
      </div>
    </div>
  );
};

export default Dashboard;
