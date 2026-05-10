import React, { useState, useEffect } from 'react';
import { BrainCircuit, TrendingUp, TrendingDown, Minus, AlertTriangle, Clock, Users, BarChart3, RefreshCw, Phone, MessageSquare, Target, Zap, ArrowRight, CheckCircle2, Calendar, Activity, Flame, Snowflake, ThermometerSun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LeadIntelligence({ isDarkMode }: { isDarkMode?: boolean }) {
 const { token } = useAuth();
 const [tab, setTab] = useState<'seguimiento'|'analytics'|'scoring'>('seguimiento');
 const [insights, setInsights] = useState<any>(null);
 const [followUp, setFollowUp] = useState<any>(null);
 const [loading, setLoading] = useState(true);
 const [recalculating, setRecalculating] = useState(false);
 const hdr = { headers: { Authorization: `Bearer ${token}` } };

 const load = async () => {
  setLoading(true);
  try {
   const [insRes, fuRes] = await Promise.allSettled([
    fetch(`${API}/api/analytics/insights`, hdr),
    fetch(`${API}/api/analytics/follow-up`, hdr)
   ]);
   if (insRes.status === 'fulfilled' && insRes.value.ok) setInsights(await insRes.value.json());
   if (fuRes.status === 'fulfilled' && fuRes.value.ok) setFollowUp(await fuRes.value.json());
  } catch {} finally { setLoading(false); }
 };

 useEffect(() => { if (token) load(); }, [token]);

 const recalcAll = async () => {
  setRecalculating(true);
  try {
   await fetch(`${API}/api/analytics/recalculate-all`, { method: 'POST', ...hdr });
   await load();
  } catch {} finally { setRecalculating(false); }
 };

 const dc = isDarkMode;
 const k = insights?.kpis;

 if (loading) return (
  <div className="flex-1 flex items-center justify-center h-full">
   <div className="flex flex-col items-center gap-3">
    <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    <p className="text-sm font-bold text-content-muted">Analizando datos de leads...</p>
   </div>
  </div>
 );

 return (
  <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-full pb-24 md:pb-0 overflow-hidden bg-surface-base">
   {/* Header */}
   <div className={`py-3 md:py-0 md:h-16 px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0 border-b ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge shadow-sm'}`}>
    <div className="flex items-center gap-3">
     <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shrink-0 shadow-lg shadow-violet-500/20">
      <BrainCircuit size={18} />
     </div>
     <div>
      <h1 className="text-lg font-bold tracking-tight text-content">Lead Intelligence</h1>
      <p className="text-[10px] text-content-muted font-bold uppercase tracking-wider">Análisis predictivo</p>
     </div>
    </div>
    <div className="flex items-center gap-2">
     <button onClick={recalcAll} disabled={recalculating} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${recalculating ? 'opacity-50' : 'hover:bg-surface-inset hover:border-accent hover:text-accent'} border-edge text-content-secondary`}>
      <RefreshCw size={12} className={recalculating ? 'animate-spin' : ''} /> {recalculating ? 'Recalculando...' : 'Recalcular scores'}
     </button>
    </div>
   </div>

   {/* KPI Strip */}
   {k && (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-6 md:px-10 py-3 shrink-0">
     <KPI icon={<Users size={16}/>} label="Total Leads" value={k.totalLeads} color="blue" dc={dc} />
     <KPI icon={<CheckCircle2 size={16}/>} label="Cerrados" value={k.closedLeads} color="emerald" dc={dc} />
     <KPI icon={<Target size={16}/>} label="Conversión" value={`${k.conversionRate}%`} color="violet" dc={dc} />
     <KPI icon={<Zap size={16}/>} label="Nuevos (7d)" value={k.newThisWeek} color="amber" dc={dc} />
     <KPI icon={<Activity size={16}/>} label="Score Prom." value={k.avgScore} color="fuchsia" dc={dc} />
    </div>
   )}

   {/* Tabs */}
   <div className={`flex gap-1 mx-6 md:mx-10 p-1 rounded-xl shrink-0 ${dc ? 'bg-surface-raised border border-edge' : 'bg-surface-inset border border-edge'}`}>
    {([['seguimiento','Centro de Seguimiento'],['analytics','Analytics'],['scoring','Lead Scoring']] as const).map(([k,l]) => (
     <button key={k} onClick={() => setTab(k)} className={`flex-1 py-1.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${tab === k ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-content-muted hover:text-content'}`}>{l}</button>
    ))}
   </div>

   {/* Content */}
   <div className="flex-1 overflow-y-auto px-6 md:px-10 py-4 space-y-5">
    {tab === 'seguimiento' && <FollowUpTab data={followUp} dc={dc} />}
    {tab === 'analytics' && <AnalyticsTab data={insights} dc={dc} />}
    {tab === 'scoring' && <ScoringTab data={insights} dc={dc} />}
   </div>
  </div>
 );
}

const KPI = ({ icon, label, value, color, dc }: any) => {
 const colorMap: any = {
  blue: 'from-blue-500/10 to-transparent text-blue-500 border-blue-500/20',
  emerald: 'from-emerald-500/10 to-transparent text-emerald-500 border-emerald-500/20',
  violet: 'from-violet-500/10 to-transparent text-violet-500 border-violet-500/20',
  amber: 'from-amber-500/10 to-transparent text-amber-500 border-amber-500/20',
  fuchsia: 'from-fuchsia-500/10 to-transparent text-fuchsia-500 border-fuchsia-500/20'
 };

 return (
  <div className={`relative p-3.5 rounded-2xl border bg-gradient-to-br overflow-hidden transition-all hover:scale-[1.02] active:scale-95 cursor-default ${colorMap[color]} ${dc ? 'bg-surface-raised' : 'bg-white'}`}>
   {/* Background Image/Icon */}
   <div className={`absolute -right-4 -bottom-4 opacity-10 transform -rotate-12 scale-150 text-${color}-500`}>
    {icon}
   </div>
   
   <div className="relative z-10">
    <div className="flex items-center gap-2 mb-1.5 opacity-80">
     {icon}
     <span className="text-[9px] font-black uppercase tracking-widest text-content-muted">{label}</span>
    </div>
    <p className="text-xl font-black text-content tracking-tight">{value}</p>
   </div>
  </div>
 );
};

/* ═══════════════ TAB: SEGUIMIENTO ═══════════════ */
const FollowUpTab = ({ data, dc }: any) => {
 if (!data) return <EmptyState text="Sin datos de seguimiento" />;
 return (
  <div className="space-y-5">
   {data.urgent?.length > 0 && (
    <FollowUpSection title="Urgente" icon={<AlertTriangle size={14}/>} color="rose" items={data.urgent} dc={dc} />
   )}
   {data.today?.length > 0 && (
    <FollowUpSection title="Hoy" icon={<Clock size={14}/>} color="amber" items={data.today} dc={dc} />
   )}
   {data.thisWeek?.length > 0 && (
    <FollowUpSection title="Esta semana" icon={<Calendar size={14}/>} color="blue" items={data.thisWeek} dc={dc} />
   )}
   {(!data.urgent?.length && !data.today?.length && !data.thisWeek?.length) && (
    <div className="card-premium p-10 text-center">
     <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500 opacity-50" />
     <h3 className="text-sm font-bold text-content">Todo al día</h3>
     <p className="text-xs text-content-muted mt-1">No hay leads que requieran atención inmediata</p>
    </div>
   )}
  </div>
 );
};

const FollowUpSection = ({ title, icon, color, items, dc }: any) => (
 <div>
  <div className={`flex items-center gap-2 mb-2 text-${color}-500 px-1`}>
   {icon} <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
   <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-${color}-500/15 text-${color}-500`}>{items.length}</span>
  </div>
  <div className="space-y-1.5">
   {items.map((item: any) => {
    // Limpieza de score para evitar %%
    const scoreVal = typeof item.score === 'string' ? item.score.replace('%', '') : item.score;
    return (
     <div key={item.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-all hover:bg-surface-inset group ${dc ? 'bg-surface-raised border-edge' : 'bg-white border-edge shadow-sm hover:shadow-md'}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border bg-${color}-500/5 border-${color}-500/20 text-${color}-500`}>
       <span className="text-[11px] font-black">{scoreVal}%</span>
      </div>
      <div className="flex-1 min-w-0">
       <p className="text-xs font-bold text-content truncate">{item.name}</p>
       <p className="text-[10px] text-content-muted font-bold mt-0.5 uppercase tracking-tight truncate">{item.reason}</p>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-content-muted shrink-0">
       <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter ${dc ? 'bg-surface border border-edge' : 'bg-surface-inset border border-edge'}`}>{item.status}</span>
       {item.advisor_name && <span className="hidden lg:inline font-bold uppercase text-[9px] tracking-tight">{item.advisor_name}</span>}
       <div className="flex gap-1 items-center ml-2">
        <a href={`tel:${item.phone}`} className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-all active:scale-90"><Phone size={14}/></a>
        <button className="p-2 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-all active:scale-90"><MessageSquare size={14}/></button>
       </div>
      </div>
     </div>
    );
   })}
  </div>
 </div>
);

/* ═══════════════ TAB: ANALYTICS ═══════════════ */
const AnalyticsTab = ({ data, dc }: any) => {
 if (!data) return <EmptyState text="Sin datos analíticos" />;
 return (
  <div className="space-y-5">
   {/* Embudo */}
   <div className={`p-5 rounded-2xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-white border-edge shadow-sm'}`}>
    <h3 className="text-[10px] font-black text-content-muted mb-4 flex items-center gap-2 uppercase tracking-widest"><BarChart3 size={14} className="text-accent" /> Embudo de Conversión</h3>
    <div className="space-y-2">
     {data.funnel?.map((stage: any, i: number) => {
      const maxCount = Math.max(...(data.funnel?.map((s: any) => parseInt(s.count)) || [1]));
      const pct = (parseInt(stage.count) / maxCount) * 100;
      const colors = ['bg-blue-500','bg-sky-500','bg-amber-500','bg-purple-500','bg-emerald-500','bg-rose-500','bg-slate-400'];
      return (
       <div key={stage.status} className="flex items-center gap-3">
        <span className="text-[10px] font-bold text-content-muted w-24 truncate text-right uppercase">{stage.status}</span>
        <div className={`flex-1 h-7 rounded-lg overflow-hidden ${dc ? 'bg-surface' : 'bg-surface-inset border border-edge'}`}>
         <div className={`h-full rounded-lg ${colors[i % colors.length]} transition-all duration-700 flex items-center px-3 shadow-inner`} style={{ width: `${Math.max(pct, 10)}%` }}>
          <span className="text-[10px] font-black text-white">{stage.count}</span>
         </div>
        </div>
        {i < (data.funnel?.length || 0) - 1 && data.funnel[i + 1] && (
         <span className="text-[9px] font-black text-content-muted w-10">
          {parseInt(stage.count) > 0 ? `${Math.round((parseInt(data.funnel[i+1].count) / parseInt(stage.count)) * 100)}%` : '0%'}
         </span>
        )}
       </div>
      );
     })}
    </div>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    {/* Fuentes */}
    <div className={`p-5 rounded-2xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-white border-edge shadow-sm'}`}>
     <h3 className="text-[10px] font-black text-content-muted mb-4 uppercase tracking-widest">Conversión por Fuente</h3>
     <div className="space-y-3">
      {(data.sourceConversion || []).map((s: any) => {
       const rate = parseInt(s.total) > 0 ? ((parseInt(s.closed) / parseInt(s.total)) * 100).toFixed(0) : '0';
       return (
        <div key={s.source} className="flex items-center justify-between group">
         <span className="text-[11px] font-bold text-content group-hover:text-accent transition-colors">{s.source}</span>
         <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-content-muted">{s.total} LEADS</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${parseInt(rate) > 20 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{rate}%</span>
         </div>
        </div>
       );
      })}
      {(!data.sourceConversion || data.sourceConversion.length === 0) && <p className="text-xs text-content-muted italic">Sin datos de fuentes</p>}
     </div>
    </div>

    {/* Rendimiento por asesor */}
    <div className={`p-5 rounded-2xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-white border-edge shadow-sm'}`}>
     <h3 className="text-[10px] font-black text-content-muted mb-4 uppercase tracking-widest">Ranking Asesores</h3>
     <div className="space-y-2.5">
      {(data.advisorPerformance || []).map((a: any, i: number) => (
       <div key={a.advisor_name} className="flex items-center gap-3 hover:translate-x-1 transition-transform">
        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black ${i === 0 ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-surface-inset border border-edge text-content-muted'}`}>{i+1}</span>
        <span className="text-[11px] font-bold text-content flex-1 truncate uppercase">{a.advisor_name}</span>
        <div className="flex items-center gap-2">
         <span className="text-[9px] font-bold text-content-muted uppercase tracking-tighter">{a.total_leads} LEADS</span>
         <span className="text-[10px] font-black text-emerald-500 px-2 py-0.5 rounded bg-emerald-500/5">{a.closed} C</span>
        </div>
       </div>
      ))}
      {(!data.advisorPerformance || data.advisorPerformance.length === 0) && <p className="text-xs text-content-muted italic">Sin asignaciones</p>}
     </div>
    </div>
   </div>

   {/* Hora óptima de contacto */}
   <div className={`p-5 rounded-2xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-white border-edge shadow-sm'}`}>
    <h3 className="text-[10px] font-black text-content-muted mb-4 flex items-center gap-2 uppercase tracking-widest"><Clock size={14} className="text-accent" /> Actividad por Hora</h3>
    <div className="flex items-end gap-1 h-20">
     {Array.from({ length: 24 }, (_, h) => {
      const hourData = (data.hourlyActivity || []).find((d: any) => parseInt(d.hour) === h);
      const count = hourData ? parseInt(hourData.count) : 0;
      const maxH = Math.max(...(data.hourlyActivity || []).map((d: any) => parseInt(d.count)), 1);
      const pct = (count / maxH) * 100;
      return (
       <div key={h} className="flex-1 flex flex-col items-center gap-1 group relative" title={`${h}:00 - ${count} mensajes`}>
        <div className={`w-full rounded-t-sm transition-all group-hover:opacity-100 ${pct > 60 ? 'bg-accent opacity-90' : pct > 30 ? 'bg-accent/50 opacity-70' : 'bg-accent/20 opacity-50'}`} style={{ height: `${Math.max(pct, 4)}%` }} />
        {h % 4 === 0 && <span className="text-[7px] text-content-muted font-bold">{h}h</span>}
       </div>
      );
     })}
    </div>
   </div>
  </div>
 );
};

/* ═══════════════ TAB: SCORING ═══════════════ */
const ScoringTab = ({ data, dc }: any) => {
 if (!data) return <EmptyState text="Sin datos de scoring" />;
 const dist = data.scoreDistribution || [];
 const hotCount = dist.find((d: any) => d.category === 'hot')?.count || 0;
 const warmCount = dist.find((d: any) => d.category === 'warm')?.count || 0;
 const coldCount = dist.find((d: any) => d.category === 'cold')?.count || 0;
 const deadCount = dist.find((d: any) => d.category === 'dead')?.count || 0;

 return (
  <div className="space-y-5">
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <ScoreCard icon={<Flame size={18}/>} label="Hot" sub="80-100 pts" count={hotCount} color="rose" dc={dc} />
    <ScoreCard icon={<ThermometerSun size={18}/>} label="Warm" sub="50-79 pts" count={warmCount} color="amber" dc={dc} />
    <ScoreCard icon={<Snowflake size={18}/>} label="Cold" sub="20-49 pts" count={coldCount} color="blue" dc={dc} />
    <ScoreCard icon={<Minus size={18}/>} label="Inactivo" sub="0-19 pts" count={deadCount} color="slate" dc={dc} />
   </div>

   <div className={`p-5 rounded-2xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-white border-edge shadow-sm'}`}>
    <h3 className="text-[10px] font-black text-content-muted mb-4 flex items-center gap-2 uppercase tracking-widest"><AlertTriangle size={14} className="text-amber-500" /> Atención Prioritaria</h3>
    <div className="space-y-1.5">
     {(data.coldLeads || []).map((lead: any) => {
      const scoreVal = typeof lead.score === 'string' ? lead.score.replace('%', '') : lead.score;
      const lastMsg = lead.last_message ? new Date(lead.last_message) : null;
      const daysAgo = lastMsg ? Math.round((Date.now() - lastMsg.getTime()) / 86400000) : '?';
      return (
       <div key={lead.id} className={`flex items-center gap-4 p-2.5 rounded-xl transition-all border border-transparent hover:border-edge ${dc ? 'bg-surface hover:bg-surface-raised' : 'bg-surface-inset hover:bg-white hover:shadow-sm'} transition-all`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border ${parseInt(scoreVal) >= 50 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>{scoreVal}%</div>
        <div className="flex-1 min-w-0">
         <p className="text-xs font-bold text-content truncate uppercase tracking-tight">{lead.name}</p>
         <p className="text-[9px] text-content-muted font-bold uppercase tracking-tighter">{lead.status} · Contacto: {daysAgo === '?' ? '—' : `${daysAgo}d`} </p>
        </div>
        <a href={`tel:${lead.phone}`} className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-all active:scale-90"><Phone size={14}/></a>
       </div>
      );
     })}
     {(!data.coldLeads || data.coldLeads.length === 0) && <p className="text-xs text-content-muted italic text-center py-4">Sin leads críticos</p>}
    </div>
   </div>
  </div>
 );
};

const ScoreCard = ({ icon, label, sub, count, color, dc }: any) => (
 <div className={`relative p-4 rounded-2xl border text-center overflow-hidden transition-all hover:translate-y-[-2px] ${dc ? 'bg-surface-raised border-edge' : 'bg-white border-edge shadow-sm'}`}>
  <div className={`absolute -right-2 -bottom-2 opacity-5 transform scale-150 text-${color}-500`}>{icon}</div>
  <div className={`w-9 h-9 rounded-xl mx-auto mb-2 flex items-center justify-center border bg-${color}-500/5 border-${color}-500/10 text-${color}-500 relative z-10`}>{icon}</div>
  <p className="text-xl font-black text-content relative z-10">{count}</p>
  <p className="text-[10px] font-black text-content-secondary uppercase tracking-widest relative z-10 mt-0.5">{label}</p>
  <p className="text-[8px] font-bold text-content-muted uppercase tracking-tighter relative z-10">{sub}</p>
 </div>
);

const EmptyState = ({ text }: { text: string }) => (
 <div className="p-16 text-center">
  <BrainCircuit size={40} className="mx-auto mb-3 text-content-muted opacity-20" />
  <p className="text-[10px] font-black text-content-muted uppercase tracking-widest">{text}</p>
 </div>
);
