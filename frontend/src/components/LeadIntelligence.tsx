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
  <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-full pb-24 md:pb-0 overflow-hidden">
   {/* Header */}
   <div className={`py-4 md:py-0 md:h-20 px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0 border-b ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge shadow-sm'}`}>
    <div className="flex items-center gap-3">
     <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shrink-0">
      <BrainCircuit size={22} />
     </div>
     <div>
      <h1 className="h1">Lead Intelligence</h1>
      <p className="text-xs text-content-muted font-medium">Análisis predictivo y seguimiento inteligente</p>
     </div>
    </div>
    <div className="flex items-center gap-2">
     <button onClick={recalcAll} disabled={recalculating} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${recalculating ? 'opacity-50' : 'hover:bg-surface-inset'} border-edge text-content-secondary`}>
      <RefreshCw size={14} className={recalculating ? 'animate-spin' : ''} /> {recalculating ? 'Recalculando...' : 'Recalcular scores'}
     </button>
    </div>
   </div>

   {/* KPI Strip */}
   {k && (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 px-6 md:px-10 py-4 shrink-0">
     <KPI icon={<Users size={16}/>} label="Total Leads" value={k.totalLeads} color="blue" dc={dc} />
     <KPI icon={<CheckCircle2 size={16}/>} label="Cerrados" value={k.closedLeads} color="emerald" dc={dc} />
     <KPI icon={<Target size={16}/>} label="Conversión" value={`${k.conversionRate}%`} color="violet" dc={dc} />
     <KPI icon={<Zap size={16}/>} label="Nuevos (7d)" value={k.newThisWeek} color="amber" dc={dc} />
     <KPI icon={<Activity size={16}/>} label="Score Prom." value={k.avgScore} color="fuchsia" dc={dc} />
    </div>
   )}

   {/* Tabs */}
   <div className={`flex gap-1 mx-6 md:mx-10 p-1 rounded-xl shrink-0 ${dc ? 'bg-surface-raised' : 'bg-surface-inset border border-edge'}`}>
    {([['seguimiento','Centro de Seguimiento'],['analytics','Analytics'],['scoring','Lead Scoring']] as const).map(([k,l]) => (
     <button key={k} onClick={() => setTab(k)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${tab === k ? 'bg-accent text-white shadow-md' : 'text-content-muted hover:text-content'}`}>{l}</button>
    ))}
   </div>

   {/* Content */}
   <div className="flex-1 overflow-y-auto px-6 md:px-10 py-6 space-y-6">
    {tab === 'seguimiento' && <FollowUpTab data={followUp} dc={dc} />}
    {tab === 'analytics' && <AnalyticsTab data={insights} dc={dc} />}
    {tab === 'scoring' && <ScoringTab data={insights} dc={dc} />}
   </div>
  </div>
 );
}

const KPI = ({ icon, label, value, color, dc }: any) => (
 <div className={`p-4 rounded-xl border transition-all ${dc ? 'bg-surface-raised border-edge' : 'bg-surface border-edge shadow-sm'}`}>
  <div className={`flex items-center gap-2 mb-2 text-${color}-500`}>{icon}<span className="text-[10px] font-bold uppercase tracking-wider text-content-muted">{label}</span></div>
  <p className="text-2xl font-black text-content">{value}</p>
 </div>
);

/* ═══════════════ TAB: SEGUIMIENTO ═══════════════ */
const FollowUpTab = ({ data, dc }: any) => {
 if (!data) return <EmptyState text="Sin datos de seguimiento" />;
 return (
  <div className="space-y-6">
   {data.urgent?.length > 0 && (
    <FollowUpSection title="Urgente" icon={<AlertTriangle size={16}/>} color="rose" items={data.urgent} dc={dc} />
   )}
   {data.today?.length > 0 && (
    <FollowUpSection title="Hoy" icon={<Clock size={16}/>} color="amber" items={data.today} dc={dc} />
   )}
   {data.thisWeek?.length > 0 && (
    <FollowUpSection title="Esta semana" icon={<Calendar size={16}/>} color="blue" items={data.thisWeek} dc={dc} />
   )}
   {(!data.urgent?.length && !data.today?.length && !data.thisWeek?.length) && (
    <div className="card-premium p-12 text-center">
     <CheckCircle2 size={40} className="mx-auto mb-3 text-emerald-500 opacity-50" />
     <h3 className="h3">Todo al día</h3>
     <p className="body-text mt-1">No hay leads que requieran atención inmediata</p>
    </div>
   )}
  </div>
 );
};

const FollowUpSection = ({ title, icon, color, items, dc }: any) => (
 <div>
  <div className={`flex items-center gap-2 mb-3 text-${color}-500`}>
   {icon} <span className="text-sm font-black uppercase tracking-wider">{title}</span>
   <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-${color}-500/10 text-${color}-500`}>{items.length}</span>
  </div>
  <div className="space-y-2">
   {items.map((item: any) => (
    <div key={item.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-sm ${dc ? 'bg-surface-raised border-edge' : 'bg-surface border-edge'}`}>
     <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-${color}-500/10 text-${color}-500`}>
      <span className="text-xs font-black">{item.score || '?'}</span>
     </div>
     <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-content truncate">{item.name}</p>
      <p className="text-xs text-content-muted font-medium mt-0.5">{item.reason}</p>
     </div>
     <div className="flex items-center gap-3 text-xs text-content-muted shrink-0">
      <span className={`px-2 py-1 rounded-lg font-bold ${dc ? 'bg-surface-raised' : 'bg-surface-inset'}`}>{item.status}</span>
      {item.advisor_name && <span className="hidden md:inline font-medium">{item.advisor_name}</span>}
      <div className="flex gap-1">
       <a href={`tel:${item.phone}`} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-500 transition-colors"><Phone size={14}/></a>
       <button className="p-1.5 rounded-lg hover:bg-blue-500/10 text-blue-500 transition-colors"><MessageSquare size={14}/></button>
      </div>
     </div>
    </div>
   ))}
  </div>
 </div>
);

/* ═══════════════ TAB: ANALYTICS ═══════════════ */
const AnalyticsTab = ({ data, dc }: any) => {
 if (!data) return <EmptyState text="Sin datos analíticos" />;
 return (
  <div className="space-y-6">
   {/* Embudo */}
   <div className={`p-6 rounded-xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-surface border-edge shadow-sm'}`}>
    <h3 className="text-sm font-black text-content mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-accent" /> Embudo de Conversión</h3>
    <div className="space-y-2">
     {data.funnel?.map((stage: any, i: number) => {
      const maxCount = Math.max(...(data.funnel?.map((s: any) => parseInt(s.count)) || [1]));
      const pct = (parseInt(stage.count) / maxCount) * 100;
      const colors = ['bg-blue-500','bg-sky-500','bg-amber-500','bg-purple-500','bg-emerald-500','bg-rose-500','bg-slate-400'];
      return (
       <div key={stage.status} className="flex items-center gap-3">
        <span className="text-xs font-bold text-content-muted w-28 truncate text-right">{stage.status}</span>
        <div className={`flex-1 h-8 rounded-lg overflow-hidden ${dc ? 'bg-surface' : 'bg-surface-inset'}`}>
         <div className={`h-full rounded-lg ${colors[i % colors.length]} transition-all duration-700 flex items-center px-3`} style={{ width: `${Math.max(pct, 8)}%` }}>
          <span className="text-[11px] font-black text-white">{stage.count}</span>
         </div>
        </div>
        {i < (data.funnel?.length || 0) - 1 && data.funnel[i + 1] && (
         <span className="text-[10px] font-bold text-content-muted w-12">
          {parseInt(stage.count) > 0 ? `${Math.round((parseInt(data.funnel[i+1].count) / parseInt(stage.count)) * 100)}%` : '—'}
         </span>
        )}
       </div>
      );
     })}
    </div>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {/* Fuentes */}
    <div className={`p-6 rounded-xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-surface border-edge shadow-sm'}`}>
     <h3 className="text-sm font-black text-content mb-4">Conversión por Fuente</h3>
     <div className="space-y-3">
      {(data.sourceConversion || []).map((s: any) => {
       const rate = parseInt(s.total) > 0 ? ((parseInt(s.closed) / parseInt(s.total)) * 100).toFixed(0) : '0';
       return (
        <div key={s.source} className="flex items-center justify-between">
         <span className="text-xs font-bold text-content">{s.source}</span>
         <div className="flex items-center gap-3">
          <span className="text-xs text-content-muted">{s.total} leads</span>
          <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${parseInt(rate) > 20 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{rate}%</span>
         </div>
        </div>
       );
      })}
      {(!data.sourceConversion || data.sourceConversion.length === 0) && <p className="text-xs text-content-muted italic">Sin datos de fuentes</p>}
     </div>
    </div>

    {/* Rendimiento por asesor */}
    <div className={`p-6 rounded-xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-surface border-edge shadow-sm'}`}>
     <h3 className="text-sm font-black text-content mb-4">Rendimiento por Asesor</h3>
     <div className="space-y-3">
      {(data.advisorPerformance || []).map((a: any, i: number) => (
       <div key={a.advisor_name} className="flex items-center gap-3">
        <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-500/15 text-amber-500' : 'bg-surface-inset text-content-muted'}`}>{i+1}</span>
        <span className="text-xs font-bold text-content flex-1">{a.advisor_name}</span>
        <span className="text-xs text-content-muted">{a.total_leads} leads</span>
        <span className="text-xs font-black text-emerald-500">{a.closed} cierres</span>
       </div>
      ))}
      {(!data.advisorPerformance || data.advisorPerformance.length === 0) && <p className="text-xs text-content-muted italic">Asigna asesores a los leads para ver estadísticas</p>}
     </div>
    </div>
   </div>

   {/* Hora óptima de contacto */}
   <div className={`p-6 rounded-xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-surface border-edge shadow-sm'}`}>
    <h3 className="text-sm font-black text-content mb-4 flex items-center gap-2"><Clock size={16} className="text-accent" /> Hora Óptima de Contacto</h3>
    <div className="flex items-end gap-1 h-24">
     {Array.from({ length: 24 }, (_, h) => {
      const hourData = (data.hourlyActivity || []).find((d: any) => parseInt(d.hour) === h);
      const count = hourData ? parseInt(hourData.count) : 0;
      const maxH = Math.max(...(data.hourlyActivity || []).map((d: any) => parseInt(d.count)), 1);
      const pct = (count / maxH) * 100;
      return (
       <div key={h} className="flex-1 flex flex-col items-center gap-1" title={`${h}:00 - ${count} mensajes`}>
        <div className={`w-full rounded-t transition-all ${pct > 60 ? 'bg-accent' : pct > 30 ? 'bg-accent/50' : 'bg-accent/20'}`} style={{ height: `${Math.max(pct, 4)}%` }} />
        {h % 3 === 0 && <span className="text-[8px] text-content-muted font-bold">{h}h</span>}
       </div>
      );
     })}
    </div>
    <p className="text-xs text-content-muted mt-3 text-center">Las barras más altas indican cuándo tus leads están más activos en WhatsApp</p>
   </div>

   {/* Tareas */}
   <div className={`p-6 rounded-xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-surface border-edge shadow-sm'}`}>
    <h3 className="text-sm font-black text-content mb-4">Resumen de Tareas</h3>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
     {(data.taskStats || []).map((t: any) => (
      <div key={t.type} className={`p-3 rounded-lg ${dc ? 'bg-surface' : 'bg-surface-inset'}`}>
       <p className="text-[10px] font-bold text-content-muted uppercase">{t.type || 'General'}</p>
       <p className="text-lg font-black text-content mt-1">{t.total}</p>
       <div className="flex gap-2 mt-1">
        <span className="text-[10px] font-bold text-emerald-500">{t.done} hechas</span>
        <span className="text-[10px] font-bold text-amber-500">{t.pending} pend.</span>
       </div>
      </div>
     ))}
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
  <div className="space-y-6">
   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <ScoreCard icon={<Flame size={20}/>} label="Hot" sub="80-100 pts" count={hotCount} color="rose" dc={dc} />
    <ScoreCard icon={<ThermometerSun size={20}/>} label="Warm" sub="50-79 pts" count={warmCount} color="amber" dc={dc} />
    <ScoreCard icon={<Snowflake size={20}/>} label="Cold" sub="20-49 pts" count={coldCount} color="blue" dc={dc} />
    <ScoreCard icon={<Minus size={20}/>} label="Inactivo" sub="0-19 pts" count={deadCount} color="slate" dc={dc} />
   </div>

   {/* Leads fríos que necesitan nurturing */}
   <div className={`p-6 rounded-xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-surface border-edge shadow-sm'}`}>
    <h3 className="text-sm font-black text-content mb-4 flex items-center gap-2"><AlertTriangle size={16} className="text-amber-500" /> Leads que Necesitan Atención</h3>
    <div className="space-y-2">
     {(data.coldLeads || []).map((lead: any) => {
      const score = parseInt(lead.score) || 0;
      const lastMsg = lead.last_message ? new Date(lead.last_message) : null;
      const daysAgo = lastMsg ? Math.round((Date.now() - lastMsg.getTime()) / 86400000) : '?';
      return (
       <div key={lead.id} className={`flex items-center gap-4 p-3 rounded-lg ${dc ? 'bg-surface hover:bg-surface-raised' : 'bg-surface-inset hover:bg-surface'} transition-colors`}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black ${score >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>{score}%</div>
        <div className="flex-1 min-w-0">
         <p className="text-sm font-bold text-content truncate">{lead.name}</p>
         <p className="text-[10px] text-content-muted">{lead.status} · Último contacto: {daysAgo === '?' ? 'Sin mensajes' : `hace ${daysAgo} días`}</p>
        </div>
        <a href={`tel:${lead.phone}`} className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-500"><Phone size={14}/></a>
       </div>
      );
     })}
     {(!data.coldLeads || data.coldLeads.length === 0) && <p className="text-xs text-content-muted italic text-center py-4">Todos los leads están activos</p>}
    </div>
   </div>

   {/* Cómo funciona */}
   <div className={`p-6 rounded-xl border ${dc ? 'bg-surface-raised border-edge' : 'bg-surface border-edge shadow-sm'}`}>
    <h3 className="text-sm font-black text-content mb-4 flex items-center gap-2"><BrainCircuit size={16} className="text-violet-500" /> Cómo se Calcula el Score</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
     {[
      { label: 'Velocidad de respuesta', pts: '15 pts', desc: 'Qué tan rápido responde el lead' },
      { label: 'Volumen de mensajes', pts: '15 pts', desc: 'Cantidad de interacciones' },
      { label: 'Actividad de citas', pts: '25 pts', desc: 'Citas completadas vs canceladas' },
      { label: 'Progreso en pipeline', pts: '20 pts', desc: 'Etapa actual del lead' },
      { label: 'Match de presupuesto', pts: '10 pts', desc: 'Presupuesto vs inventario' },
      { label: 'Engagement general', pts: '10 pts', desc: 'Email, notas, tags, interés' },
      { label: 'Actividad reciente', pts: '5 pts', desc: 'Última interacción' },
     ].map(f => (
      <div key={f.label} className={`p-3 rounded-lg flex items-center gap-3 ${dc ? 'bg-surface' : 'bg-surface-inset'}`}>
       <span className="text-xs font-black text-accent shrink-0">{f.pts}</span>
       <div>
        <p className="text-xs font-bold text-content">{f.label}</p>
        <p className="text-[10px] text-content-muted">{f.desc}</p>
       </div>
      </div>
     ))}
    </div>
   </div>
  </div>
 );
};

const ScoreCard = ({ icon, label, sub, count, color, dc }: any) => (
 <div className={`p-5 rounded-xl border text-center ${dc ? 'bg-surface-raised border-edge' : 'bg-surface border-edge shadow-sm'}`}>
  <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-${color}-500/10 text-${color}-500`}>{icon}</div>
  <p className="text-2xl font-black text-content">{count}</p>
  <p className="text-xs font-bold text-content-secondary mt-1">{label}</p>
  <p className="text-[10px] text-content-muted">{sub}</p>
 </div>
);

const EmptyState = ({ text }: { text: string }) => (
 <div className="card-premium p-12 text-center">
  <BrainCircuit size={40} className="mx-auto mb-3 text-content-muted opacity-30" />
  <p className="text-sm font-bold text-content-muted">{text}</p>
 </div>
);
