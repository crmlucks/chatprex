import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, XCircle, Trash2, ShieldCheck, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

export default function ReviewsAdmin({ isDarkMode }: { isDarkMode?: boolean }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas');
  const { token } = useAuth();
  const { showToast, showConfirm } = useToast();

  const dc = isDarkMode;
  const input = `input-field h-9 text-xs`;

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews?all=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReviews(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast(`Reseña ${status}`, 'success');
        fetchReviews();
      } else {
        showToast('Error al actualizar', 'error');
      }
    } catch (e) {
      showToast('Error de red', 'error');
    }
  };

  const deleteReview = (id: number) => {
    showConfirm('¿Eliminar esta reseña permanentemente?', async () => {
      try {
        const res = await fetch(`${API_URL}/api/reviews/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          showToast('Reseña eliminada', 'info');
          fetchReviews();
        }
      } catch (e) {
        showToast('Error de red', 'error');
      }
    }, { confirmText: 'Eliminar', cancelText: 'Cancelar' });
  };

  const filtered = filter === 'todas' ? reviews : reviews.filter(r => r.status === filter);

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-base">
      <div className="p-6 border-b border-edge bg-surface flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="text-accent" />
            Moderación de Reseñas
          </h1>
          <p className="text-xs text-content-muted mt-1">
            Aprueba o rechaza los testimonios antes de que se publiquen en el portal y generen SEO.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
            <select value={filter} onChange={e => setFilter(e.target.value)} className={`${input} pl-9 font-bold`}>
              <option value="todas">Todas</option>
              <option value="pendiente">Pendientes</option>
              <option value="aprobada">Aprobadas</option>
              <option value="rechazada">Rechazadas</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center p-12 text-content-muted border border-edge border-dashed rounded-2xl bg-surface/50">
            No hay reseñas que coincidan con tu filtro.
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map(r => (
              <div key={r.id} className={`p-5 rounded-2xl border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between transition-colors ${dc ? 'bg-surface border-edge' : 'bg-white shadow-sm border-edge'}`}>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-sm text-content">{r.author_name}</span>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < r.rating ? 'currentColor' : 'none'} className={i < r.rating ? 'text-amber-400' : 'text-content-muted'} />
                      ))}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      r.status === 'aprobada' ? 'bg-emerald-500/10 text-emerald-500' :
                      r.status === 'rechazada' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-amber-500/10 text-amber-500'
                    }`}>
                      {r.status}
                    </span>
                    {r.property_id && (
                       <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full">
                         Propiedad ID: {r.property_id}
                       </span>
                    )}
                  </div>
                  <p className="text-sm text-content-secondary italic">"{r.comment}"</p>
                  <p className="text-[10px] text-content-muted mt-2">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-0 border-edge">
                  {r.status !== 'aprobada' && (
                    <button onClick={() => updateStatus(r.id, 'aprobada')} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-xs font-bold transition-colors">
                      <CheckCircle size={14} /> Aprobar
                    </button>
                  )}
                  {r.status !== 'rechazada' && (
                    <button onClick={() => updateStatus(r.id, 'rechazada')} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-lg text-xs font-bold transition-colors">
                      <XCircle size={14} /> Rechazar
                    </button>
                  )}
                  <button onClick={() => deleteReview(r.id)} className="p-1.5 text-content-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors ml-auto md:ml-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
