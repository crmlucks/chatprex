import React, { useEffect } from 'react';
import {
  MessageCircle, Target, TrendingUp, Search, Calendar, LayoutDashboard,
  ArrowRight, CheckCircle2, ShieldCheck, Zap, Bot, Globe, Smartphone, BarChart3, Database
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function ChatprexLanding() {
  // Configuración de Dark Mode forzado para este Landing
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const handleDemoClick = () => {
    const message = "Hola! Quiero agendar una demo del ecosistema Chatprex para mi desarrollo inmobiliario.";
    window.open(`https://wa.me/51900000000?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white font-sans overflow-x-hidden selection:bg-accent/30 selection:text-white">
      {/* ════════════════════════════════════════
          NAVBAR B2B
          ════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#060608]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]">
              <Bot size={22} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight block leading-none">Chatprex</span>
              <span className="text-[10px] font-bold text-accent tracking-widest uppercase">Ecosistema Inmobiliario</span>
            </div>
          </div>
          <button
            onClick={handleDemoClick}
            className="hidden md:flex px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all items-center gap-2 border border-white/5"
          >
            Hablar con ventas
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          HERO SECTION
          ════════════════════════════════════════ */}
      <section className="relative pt-40 pb-20 px-6 md:px-12 flex flex-col items-center text-center">
        {/* Glow Effects */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-accent/20 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] font-extrabold uppercase tracking-widest mb-2 shadow-[0_0_15px_rgba(37,99,235,0.15)]">
            <ShieldCheck size={14} /> Partner Oficial de Meta & WhatsApp API
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1]">
            La plataforma tecnológica con IA que <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-blue-400 to-cyan-300">acelera las ventas</span> de tus desarrollos.
          </h1>

          <p className="text-base md:text-xl text-content-secondary font-medium max-w-2xl mx-auto leading-relaxed">
            Control total de ventas, inventario y automatización, respaldado por más de 10 años de experiencia en el sector proptech.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleDemoClick}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-sm transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_40px_rgba(16,185,129,0.5)] hover:scale-105"
            >
              <MessageCircle size={18} />
              Agendar Demo por WhatsApp
            </button>
            <a
              href="#modulos"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              Ver Módulos del Software
            </a>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          AUTORIDAD / METRICAS
          ════════════════════════════════════════ */}
      <section className="py-12 border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/5">
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-black text-white">10+</h3>
            <p className="text-xs font-bold text-content-secondary uppercase tracking-widest">Años de Experiencia</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-black text-accent">+100%</h3>
            <p className="text-xs font-bold text-content-secondary uppercase tracking-widest">Seguimiento de Leads</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-black text-emerald-400">24/7</h3>
            <p className="text-xs font-bold text-content-secondary uppercase tracking-widest">Atención con IA</p>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl md:text-4xl font-black text-cyan-400">API</h3>
            <p className="text-xs font-bold text-content-secondary uppercase tracking-widest">Meta Partner Oficial</p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          MÓDULOS DEL SOFTWARE (GRILLA)
          ════════════════════════════════════════ */}
      <section id="modulos" className="py-24 px-6 relative">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight">Todo tu ecosistema de ventas en <span className="text-accent">un solo lugar</span></h2>
            <p className="text-content-secondary text-sm md:text-base font-medium">Desde la captación del lead hasta la firma del contrato. Herramientas diseñadas específicamente para el ritmo y escala de desarrollos inmobiliarios.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Módulo 1 */}
            <div className="bg-[#111113] border border-white/5 p-8 rounded-3xl hover:border-accent/30 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Bot size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Chatbot de Ventas con IA</h3>
              <p className="text-sm text-content-secondary leading-relaxed">Atención 24/7, calificación de leads automática, envío de fichas técnicas y agendamiento de citas directo en WhatsApp sin intervención humana.</p>
            </div>

            {/* Módulo 2 */}
            <div className="bg-[#111113] border border-white/5 p-8 rounded-3xl hover:border-accent/30 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Target size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">CRM Especializado</h3>
              <p className="text-sm text-content-secondary leading-relaxed">Gestión centralizada de prospectos, embudos de venta visuales drag-and-drop y trazabilidad absoluta del historial de cada cliente.</p>
            </div>

            {/* Módulo 3 */}
            <div className="bg-[#111113] border border-white/5 p-8 rounded-3xl hover:border-accent/30 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageCircle size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Campañas Meta & WP API</h3>
              <p className="text-sm text-content-secondary leading-relaxed">Envíos masivos por WhatsApp API Oficial sin riesgo de bloqueo. Integración nativa y directa con Meta Ads para capturar leads instantáneamente.</p>
            </div>

            {/* Módulo 4 */}
            <div className="bg-[#111113] border border-white/5 p-8 rounded-3xl hover:border-accent/30 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Inventarios en Tiempo Real</h3>
              <p className="text-sm text-content-secondary leading-relaxed">Control exacto de lotes, departamentos y casas. Conoce al instante el estado (disponible, reservado, vendido) sincronizado en toda la red.</p>
            </div>

            {/* Módulo 5 */}
            <div className="bg-[#111113] border border-white/5 p-8 rounded-3xl hover:border-accent/30 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calendar size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Seguimiento Automatizado</h3>
              <p className="text-sm text-content-secondary leading-relaxed">Recordatorios automáticos de citas por WhatsApp tanto para agentes como para clientes, reduciendo el ausentismo y evitando leads fríos.</p>
            </div>

            {/* Módulo 6 */}
            <div className="bg-[#111113] border border-white/5 p-8 rounded-3xl hover:border-accent/30 transition-colors group">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Dashboard Gerencial</h3>
              <p className="text-sm text-content-secondary leading-relaxed">Métricas de absorción, ingresos, análisis de comisiones y toma de decisiones financieras en tiempo real para directores de proyecto.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          SECCIÓN DESTACADA: SUPERPODERES
          ════════════════════════════════════════ */}
      <section className="py-24 px-6 border-y border-white/5 bg-[#0a0a0c] relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-6 z-10 relative">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-extrabold uppercase tracking-widest">
              <Zap size={14} /> Ultra Rápido
            </div>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Superpoderes de Ventas por WhatsApp</h2>
            <p className="text-content-secondary text-base md:text-lg leading-relaxed">No pierdas un solo lead por demoras. Nuestra IA detecta el origen, responde en menos de 30 segundos, pre-califica al prospecto y lo asigna al asesor ideal, todo a través del canal favorito de tus clientes.</p>
            
            <ul className="space-y-4 pt-4">
              <li className="flex items-center gap-3 text-sm font-bold">
                <CheckCircle2 className="text-accent" size={20} /> Respuesta inmediata 24/7 sin caídas.
              </li>
              <li className="flex items-center gap-3 text-sm font-bold">
                <CheckCircle2 className="text-accent" size={20} /> Envío automatizado de brochures y planos en PDF.
              </li>
              <li className="flex items-center gap-3 text-sm font-bold">
                <CheckCircle2 className="text-accent" size={20} /> Etiquetado y sincronización directa con el CRM.
              </li>
            </ul>
          </div>
          
          <div className="flex-1 relative w-full max-w-sm lg:max-w-md">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-accent/20 rounded-full blur-[100px]"></div>
            <div className="relative border-[8px] border-[#1e1e24] rounded-[2.5rem] bg-[#0b0f19] shadow-2xl overflow-hidden aspect-[9/19]">
              {/* Fake Phone UI */}
              <div className="absolute top-0 inset-x-0 h-6 bg-[#1e1e24] flex justify-center z-20">
                <div className="w-1/3 h-4 bg-black rounded-b-xl"></div>
              </div>
              <div className="p-4 pt-10 h-full flex flex-col gap-3 font-sans relative z-10">
                <div className="self-end bg-emerald-600 text-white p-3 rounded-2xl rounded-tr-sm text-xs max-w-[85%] shadow-md">
                  Hola, vi su proyecto en Facebook y quisiera más información de los depas de 2 habitaciones.
                </div>
                <div className="self-start bg-[#1e293b] text-white p-3 rounded-2xl rounded-tl-sm text-xs max-w-[85%] border border-white/5">
                  ¡Hola! 🤖 Soy el asistente virtual de Casaya. Claro que sí, tenemos excelentes opciones de 2 habitaciones disponibles.
                </div>
                <div className="self-start bg-[#1e293b] text-white p-3 rounded-2xl rounded-tl-sm text-xs max-w-[85%] border border-white/5">
                  📁 *Enviando brochure_proyecto.pdf*<br/><br/>¿En qué rango de presupuesto estás buscando invertir?
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════
          CTA FINAL
          ════════════════════════════════════════ */}
      <section className="py-32 px-6 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-accent/5 pointer-events-none"></div>
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">¿Listo para transformar la comercialización de tus proyectos inmobiliarios?</h2>
          <p className="text-content-secondary text-base md:text-lg">Digitaliza, automatiza y domina el mercado con la tecnología líder para desarrolladores.</p>
          
          <button
            onClick={handleDemoClick}
            className="mt-8 px-10 py-5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white font-black text-base transition-all flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.6)] hover:scale-105 mx-auto"
          >
            <Smartphone size={22} />
            Hablar con un Especialista en Tech Inmobiliaria
          </button>
        </div>
      </section>

      {/* FOOTER B2B */}
      <footer className="py-8 border-t border-white/5 text-center text-xs text-content-secondary font-bold">
        <p>&copy; {new Date().getFullYear()} Chatprex & Casaya Ecosystem. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
