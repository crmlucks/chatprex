import React, { useState, useEffect } from 'react';
import { Star, Send, ShieldCheck, User } from 'lucide-react';
import { useToast } from './Toast';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

interface PropertyReviewsProps {
  propertyId: string | number;
  isDarkMode?: boolean;
}

export default function PropertyReviews({ propertyId, isDarkMode }: PropertyReviewsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Formulario
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const { showToast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews?property_id=${propertyId}`);
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return showToast('El nombre es requerido', 'error');
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: propertyId,
          author_name: name,
          rating,
          comment
        })
      });
      if (res.ok) {
        showToast('Reseña enviada para revisión', 'success');
        setShowForm(false);
        setName('');
        setComment('');
        setRating(5);
      } else {
        showToast('Error al enviar reseña', 'error');
      }
    } catch (error) {
      showToast('Error de conexión', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = `w-full h-10 px-3 rounded-lg border text-sm transition-colors focus:ring-2 focus:outline-none ${isDarkMode ? 'bg-surface border-edge text-content focus:ring-accent/50 focus:border-accent' : 'bg-white border-slate-300 text-slate-900 focus:ring-accent/20 focus:border-accent'}`;

  return (
    <div className="mt-6 border-t border-edge pt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <Star className="text-amber-400" size={16} fill="currentColor" /> 
          Reseñas de la Propiedad ({reviews.length})
        </h3>
        {!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="text-[11px] font-bold px-3 py-1.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors"
          >
            Escribir Reseña
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className={`p-4 rounded-xl border border-edge mb-6 ${isDarkMode ? 'bg-surface-inset' : 'bg-slate-50'}`}>
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-content-muted">Tu Experiencia</h4>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star size={20} fill={star <= rating ? 'currentColor' : 'none'} className={star <= rating ? 'text-amber-400' : 'text-content-muted/30'} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid gap-3">
            <div>
              <input 
                type="text" 
                placeholder="Tu Nombre" 
                value={name} 
                onChange={e => setName(e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <textarea 
                placeholder="Comparte detalles de tu visita o experiencia (Opcional)" 
                value={comment}
                onChange={e => setComment(e.target.value)}
                className={`${inputClass} min-h-[80px] py-2 resize-none`}
              />
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <button 
              type="submit" 
              disabled={submitting}
              className="flex-1 bg-accent hover:bg-accent/90 text-white h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Send size={14} /> {submitting ? 'Enviando...' : 'Publicar Reseña'}
            </button>
            <button 
              type="button" 
              onClick={() => setShowForm(false)}
              className="px-4 border border-edge rounded-lg text-xs font-bold hover:bg-surface-raised transition-colors"
            >
              Cancelar
            </button>
          </div>
          <p className="text-[10px] text-content-muted mt-3 flex items-center gap-1.5 justify-center">
            <ShieldCheck size={12} />
            Tu reseña será revisada por nuestro equipo antes de publicarse.
          </p>
        </form>
      )}

      {loading ? (
        <div className="py-8 flex justify-center">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-6 text-content-muted bg-surface-inset border border-edge border-dashed rounded-xl">
          <p className="text-xs">No hay reseñas publicadas aún.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
          {reviews.map(r => (
            <div key={r.id} className="p-3 rounded-xl border border-edge bg-surface-inset flex gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0">
                <User size={14} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-content">{r.author_name}</span>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={10} fill={i < r.rating ? 'currentColor' : 'none'} className={i < r.rating ? 'text-amber-400' : 'text-content-muted/30'} />
                    ))}
                  </div>
                </div>
                {r.comment && <p className="text-[11px] text-content-secondary mt-1 italic">"{r.comment}"</p>}
                <p className="text-[9px] text-content-muted mt-1">{new Date(r.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
