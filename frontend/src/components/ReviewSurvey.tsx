import React, { useState, useEffect } from 'react';
import { Star, Send, ShieldCheck, Home } from 'lucide-react';
import { useToast } from './Toast';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

export default function ReviewSurvey({ isDarkMode }: { isDarkMode?: boolean }) {
  const { showToast } = useToast();

  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [leadId, setLeadId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Parse /encuesta/:campaignId/:leadId
    const parts = window.location.pathname.split('/');
    if (parts.length >= 4 && parts[1] === 'encuesta') {
      setCampaignId(parts[2]);
      setLeadId(parts[3]);
    }
  }, []);

  useEffect(() => {
    // Attempt to fetch lead info to pre-fill the name
    if (leadId) {
      fetch(`${API_URL}/api/leads/${leadId}`, {
        headers: {
          // Si tuviéramos un endpoint público o un token de lectura.
          // Por simplicidad, asumiremos que el usuario completa su nombre si no viene en el link.
        }
      }).catch(e => console.log(e));
    }
  }, [leadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return showToast('El nombre es requerido', 'error');

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author_name: name,
          rating,
          comment,
          campaign_id: campaignId,
          lead_id: leadId,
          property_id: null // Opcional, podría pasarse por la URL
        })
      });
      if (res.ok) {
        setSubmitted(true);
        showToast('Reseña enviada correctamente', 'success');
      } else {
        showToast('Error al enviar reseña', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`max-w-md w-full p-8 rounded-2xl text-center shadow-xl border ${isDarkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star size={32} fill="currentColor" />
          </div>
          <h2 className="text-2xl font-bold mb-2">¡Gracias por tu opinión!</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Tu comentario nos ayuda enormemente a mejorar nuestro servicio y a ayudar a otras personas a encontrar su hogar ideal.
          </p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            <Home size={18} /> Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const inputClass = `w-full h-12 px-4 rounded-xl border text-sm transition-colors focus:ring-2 focus:outline-none ${isDarkMode ? 'bg-[#252525] border-white/10 text-white focus:ring-emerald-500/50 focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-900 focus:ring-emerald-500/20 focus:border-emerald-500'}`;

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-[#121212] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className={`max-w-md w-full p-8 rounded-3xl shadow-2xl border ${isDarkMode ? 'bg-[#1e1e1e] border-white/10' : 'bg-white border-slate-200'}`}>
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
            <Star size={24} />
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">Cuéntanos tu experiencia</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Nos encantaría saber cómo fue tu experiencia de compra. Tu opinión es muy valiosa para nosotros.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="focus:outline-none transition-transform hover:scale-125"
              >
                <Star size={36} fill={star <= rating ? 'currentColor' : 'none'} className={star <= rating ? 'text-amber-400 drop-shadow-md' : 'text-slate-300 dark:text-slate-600'} />
              </button>
            ))}
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 ml-1">Tu Nombre</label>
            <input 
              type="text" 
              placeholder="Ej. Juan Pérez" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className={inputClass}
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 ml-1">Tu Comentario (Opcional)</label>
            <textarea 
              placeholder="¿Qué es lo que más te gustó? ¿Cómo fue la atención?" 
              value={comment}
              onChange={e => setComment(e.target.value)}
              className={`${inputClass} min-h-[120px] py-3 resize-none`}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            <Send size={18} /> {submitting ? 'Enviando...' : 'Enviar Reseña'}
          </button>

          <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 mt-4">
            <ShieldCheck size={12} />
            Tus datos son procesados de forma segura.
          </p>
        </form>
      </div>
    </div>
  );
}
