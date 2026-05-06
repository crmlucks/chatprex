import React, { useState, useEffect } from 'react';
import { Home, Building2, Map, LayoutGrid, LayoutList, Search, Plus, Filter, MapPin, X, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Properties({ isDarkMode }: { isDarkMode?: boolean }) {
  const [viewMode, setViewMode] = useState<'grid'|'list'>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'list' : 'grid';
  });
  
  const [properties, setProperties] = useState<any[]>([]);
  const { token } = useAuth();

  const fetchProperties = async () => {
    try {
      const res = await fetch(`${API_URL}/api/properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (err) {
      console.error('Error fetching properties', err);
    }
  };

  useEffect(() => {
    if (token) fetchProperties();
  }, [token]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', project: '', developer: '', type: 'Departamento', 
    price: '', currency: 'USD', location: '', area: '', 
    rooms: '', details: '', status: 'Disponible'
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/properties`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchProperties();
        setShowModal(false);
        setFormData({ name: '', project: '', developer: '', type: 'Departamento', price: '', currency: 'USD', location: '', area: '', rooms: '', details: '', status: 'Disponible' });
      }
    } catch (err) {
      console.error('Error saving property', err);
    }
  };

  const deleteProperty = async (id: number) => {
    if (!window.confirm('¿Eliminar esta propiedad?')) return;
    try {
      const res = await fetch(`${API_URL}/api/properties/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchProperties();
    } catch (err) {
      console.error('Error deleting property', err);
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Inventario de Propiedades</h1>
            <p className={`text-[12px] md:text-[13px] mt-1 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Gestiona tus unidades, disponibilidad y precios</p>
          </div>
          <button onClick={() => setShowModal(true)} className="w-full sm:w-auto bg-primary text-white px-4 py-2 md:px-5 md:py-2 rounded-xl text-[12px] md:text-[13px] font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center justify-center gap-2">
            <Plus size={18} /> Nueva Unidad
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {["Todos", "Casas", "Departamentos", "Terrenos", "Oficinas"].map(t => (
              <button key={t} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white text-slate-600 border border-slate-200 hover:border-primary'}`}>
                {t}
              </button>
            ))}
          </div>
          <div className={`flex p-1 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? (isDarkMode ? 'bg-slate-700 text-primary' : 'bg-slate-100 text-primary') : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? (isDarkMode ? 'bg-slate-700 text-primary' : 'bg-slate-100 text-primary') : 'text-slate-400'}`}><LayoutList size={18} /></button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {properties.map(p => (
              <div key={p.id} className={`rounded-2xl border shadow-sm overflow-hidden group transition-all hover:shadow-xl ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="h-40 md:h-48 overflow-hidden relative">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-3 left-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md border ${p.status === 'Disponible' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' : 'bg-rose-500/20 text-rose-100 border-rose-500/30'}`}>
                      {p.status}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className={`font-semibold text-[13px] md:text-[14px] mb-1 truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{p.name}</h3>
                  <p className="text-[12px] text-slate-500 mb-3 font-normal">{p.type}</p>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`font-bold text-[13px] md:text-[14px] ${isDarkMode ? 'text-primary' : 'text-primary'}`}>{p.currency} {p.price}</span>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Search size={14} />
                      <span className="text-[11px] font-bold">{p.area} m²</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button className={`py-2 rounded-lg text-[12px] font-semibold transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Detalles</button>
                    <button className="py-2 bg-primary text-white rounded-lg text-[12px] font-semibold transition-all active:scale-95 hover:bg-primary-dark shadow-lg shadow-primary/20">Cotizar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-xl border shadow-sm overflow-hidden overflow-x-auto ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className={`border-b text-[12px] font-bold ${isDarkMode ? 'bg-slate-800/50 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <th className="px-4 py-3 pl-6">Nombre</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Área</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {properties.map(p => {
                  let statusColors = '';
                  switch (p.status) {
                    case 'Disponible': statusColors = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'; break;
                    case 'Reservado': statusColors = 'bg-amber-500/10 text-amber-600 dark:text-amber-400'; break;
                    case 'Vendido': statusColors = 'bg-blue-500/10 text-blue-600 dark:text-blue-400'; break;
                    case 'Bloqueado': statusColors = 'bg-rose-500/10 text-rose-600 dark:text-rose-400'; break;
                    default: statusColors = 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
                  }

                  return (
                    <tr key={p.id} className={`h-[42px] transition-colors ${isDarkMode ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>
                      <td className="px-4 py-2 pl-6 font-semibold text-[13px]">{p.name}</td>
                      <td className="px-4 py-2 text-[13px] font-semibold">{p.price} {p.currency}</td>
                      <td className="px-4 py-2 text-[12px]">{p.area} m²</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColors}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <button className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-primary hover:bg-primary/10' : 'text-slate-500 hover:text-primary hover:bg-primary/10'}`} title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => deleteProperty(p.id)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-500/10' : 'text-slate-500 hover:text-rose-500 hover:bg-rose-500/10'}`} title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className={`rounded-2xl shadow-2xl border w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`px-5 py-4 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <h2 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Registro de Nueva Propiedad</h2>
              <button onClick={() => setShowModal(false)} className={`p-1 rounded-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <form id="property-form" onSubmit={handleSave} className="space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] md:text-xs text-slate-500 font-medium">Detalle de la Propiedad (Nombre/Título)</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Lujoso Dpto en Miraflores" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs text-slate-500 font-medium">Tipo de Inmueble</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="Casa">Casa</option>
                      <option value="Departamento">Departamento</option>
                      <option value="Oficina">Oficina</option>
                      <option value="Deposito">Depósito</option>
                      <option value="Terreno">Terreno</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs text-slate-500 font-medium">Nombre del Proyecto (Opcional)</label>
                    <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} placeholder="Ej. Torre Esmeralda" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] md:text-xs text-slate-500 font-medium">Desarrollador / Inmobiliaria</label>
                    <input type="text" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} placeholder="Ej. Inmobiliaria XYZ" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs text-slate-500 font-medium">Estado</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20">
                      <option value="Disponible">🟢 Disponible</option>
                      <option value="Reservado">🟠 Reservado</option>
                      <option value="Vendido">⚫ Vendido</option>
                      <option value="Bloqueado">🔴 Bloqueado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs text-slate-500 font-medium">Precio de Venta</label>
                    <div className="flex gap-2 mt-1">
                      <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-24 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20">
                        <option value="USD">USD</option>
                        <option value="PEN">PEN</option>
                      </select>
                      <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs text-slate-500 font-medium">Ubicación</label>
                    <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ej. Av. Principal 123" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>

                  <div>
                    <label className="text-[10px] md:text-xs text-slate-500 font-medium">Área (m²)</label>
                    <input type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} placeholder="Ej. 120" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>

                  {formData.type !== 'Terreno' && formData.type !== 'Deposito' && (
                    <div>
                      <label className="text-[10px] md:text-xs text-slate-500 font-medium">Habitaciones / Privados</label>
                      <input type="number" value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} placeholder="Ej. 3" className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] md:text-xs text-slate-500 font-medium">Otras características y detalles</label>
                    <textarea rows={3} value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} placeholder="Describe amenities, cochera, vista, año de construcción..." className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"></textarea>
                  </div>

                </div>
              </form>
            </div>
            
            <div className={`p-4 border-t shrink-0 transition-colors ${isDarkMode ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <button form="property-form" type="submit" className="w-full bg-primary text-white p-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95">
                Guardar Propiedad
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
