import React, { useState, useEffect, useRef } from 'react';
import { Home, Building2, Map, LayoutGrid, LayoutList, Search, Plus, Filter, MapPin, X, Edit2, Trash2, Upload, XCircle, Image as ImageIcon, DollarSign, Tag, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Properties({ isDarkMode }: { isDarkMode?: boolean }) {
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [filterType, setFilterType] = useState('todos');
  const [properties, setProperties] = useState<any[]>([]);
  const { token } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

  const fetchProperties = async () => {
    try {
      const res = await fetch(`${API_URL}/api/properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setProperties(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (token) fetchProperties(); }, [token]);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null as number | null, name: '', project: '', developer: '', type: 'departamento', 
    price: '', currency: 'USD', location: '', area: '', 
    rooms: '', notes: '', status: 'disponible', avatar: '', images: [] as string[],
    contactNumber: '', email: '', ruc: ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEdit = formData.id != null;
      const url = isEdit ? `${API_URL}/api/properties/${formData.id}` : `${API_URL}/api/properties`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        fetchProperties();
        setShowModal(false);
        resetForm();
      }
    } catch (err) { console.error(err); }
  };

  const deleteProperty = async (id: number) => {
    if(!window.confirm('¿Eliminar esta propiedad?')) return;
    try {
      const res = await fetch(`${API_URL}/api/properties/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchProperties();
    } catch (err) { console.error(err); }
  };

  const resetForm = () => setFormData({ id: null, name: '', project: '', developer: '', type: 'departamento', price: '', currency: 'USD', location: '', area: '', rooms: '', notes: '', status: 'disponible', avatar: '', images: [], contactNumber: '', email: '', ruc: '' });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isAvatar: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isAvatar) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(files[0]);
    } else {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string].slice(0, 3) }));
        reader.readAsDataURL(file);
      });
    }
  };

  const filteredProperties = properties.filter(p => filterType === 'todos' || p.type?.toLowerCase() === filterType.toLowerCase());

  const dc = isDarkMode;
  const inputCls = `w-full p-3 rounded-2xl border text-sm font-medium outline-none transition-all focus:ring-2 focus:ring-primary/10 ${dc ? 'bg-slate-900 border-slate-700 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary shadow-inner'}`;

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 transition-colors ${dc ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${dc ? 'bg-primary/20 text-primary' : 'bg-white text-primary border border-slate-100'}`}>
                <Home size={28} />
             </div>
             <div>
                <h1 className="h1">Propiedades</h1>
                <p className="body-text text-xs uppercase tracking-[2px] font-bold opacity-60">Gestión de inventario inmobiliario</p>
             </div>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center gap-3 py-3.5 px-6">
             <Plus size={20} />
             <span className="text-[11px] font-black uppercase tracking-widest">Agregar propiedad</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap justify-between items-center gap-6">
           <div className="flex items-center gap-4 flex-1 min-w-[300px]">
              <div className="relative flex-1 max-w-md">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                 <input type="text" placeholder="Buscar propiedad..." className={`w-full pl-11 pr-5 py-3.5 rounded-[20px] border text-sm font-medium outline-none transition-all ${dc ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-100 shadow-sm'}`} />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className={`px-5 py-3.5 rounded-[20px] border text-[11px] font-black uppercase tracking-widest outline-none transition-all ${dc ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-white border-slate-100 shadow-sm text-slate-600'}`}>
                 <option value="todos">Todos los tipos</option>
                 <option value="casas">Casas</option>
                 <option value="departamento">Departamentos</option>
                 <option value="terreno">Terrenos</option>
                 <option value="oficina">Oficinas</option>
              </select>
           </div>
           <div className={`flex p-1.5 rounded-2xl ${dc ? 'bg-slate-800' : 'bg-white border border-slate-100 shadow-md'}`}>
              <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><LayoutGrid size={20} /></button>
              <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><LayoutList size={20} /></button>
           </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProperties.map(p => (
                <div key={p.id} className="card-premium group overflow-hidden flex flex-col h-full animate-in zoom-in-95 duration-500">
                   <div className="h-56 relative overflow-hidden shrink-0">
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 left-4">
                         <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl backdrop-blur-md border ${p.status === 'disponible' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>{p.status}</span>
                      </div>
                      <div className="absolute bottom-4 right-4 flex gap-2 translate-y-16 group-hover:translate-y-0 transition-all duration-300">
                         <button onClick={() => { setFormData(p); setShowModal(true); }} className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-all shadow-2xl border border-white/10"><Edit2 size={16} /></button>
                         <button onClick={() => deleteProperty(p.id)} className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-2xl hover:bg-rose-600 transition-all"><Trash2 size={16} /></button>
                      </div>
                   </div>
                   <div className="p-6 flex flex-col flex-1 space-y-4">
                      <div>
                         <h3 className={`font-bold text-sm tracking-tight truncate ${dc ? 'text-white' : 'text-slate-800'}`}>{p.name}</h3>
                         <div className="flex items-center gap-2 text-slate-500 mt-2">
                            <MapPin size={14} className="shrink-0 text-primary/60" />
                            <span className="text-[11px] font-bold truncate opacity-80 uppercase tracking-wider">{p.location || 'Sin ubicación'}</span>
                         </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                         <span className="text-lg font-black text-primary">{p.currency} {p.price}</span>
                         <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{p.area} m²</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
           <div className="card-premium overflow-hidden overflow-x-auto shadow-2xl">
              <table className="w-full text-left">
                 <thead>
                    <tr className={`text-[10px] font-black uppercase tracking-[2px] text-slate-500 border-b ${dc ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                       <th className="px-8 py-5">Propiedad</th>
                       <th className="px-8 py-5">Proyecto / Desarrollador</th>
                       <th className="px-8 py-5 text-right">Precio</th>
                       <th className="px-8 py-5">Estado</th>
                       <th className="px-8 py-5 text-right">Acciones</th>
                    </tr>
                 </thead>
                 <tbody className={`divide-y ${dc ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {filteredProperties.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                         <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                               <img src={p.avatar || 'https://via.placeholder.com/80'} className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-slate-800 shadow-md" alt="" />
                               <div>
                                  <div className={`font-bold text-sm tracking-tight ${dc ? 'text-white' : 'text-slate-800'}`}>{p.name}</div>
                                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{p.type} • {p.area} m²</div>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-5">
                            <div className="text-[11px] font-black uppercase tracking-widest text-primary">{p.project}</div>
                            <div className="text-[11px] font-bold text-slate-500 mt-1">{p.developer}</div>
                         </td>
                         <td className="px-8 py-5 text-right">
                            <div className="text-base font-black text-emerald-500">{p.currency} {p.price}</div>
                         </td>
                         <td className="px-8 py-5">
                            <span className={`text-[9px] font-black uppercase tracking-[2px] px-3 py-1.5 rounded-xl ${p.status === 'disponible' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{p.status}</span>
                         </td>
                         <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                               <button onClick={() => { setFormData(p); setShowModal(true); }} className={`p-2.5 rounded-xl border transition-all ${dc ? 'border-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10' : 'border-slate-100 text-slate-400 hover:text-primary hover:bg-primary/5'}`}><Edit2 size={16} /></button>
                               <button onClick={() => deleteProperty(p.id)} className={`p-2.5 rounded-xl border transition-all ${dc ? 'border-rose-900/30 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10' : 'border-rose-100 text-rose-300 hover:text-rose-500 hover:bg-rose-50'}`}><Trash2 size={16} /></button>
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        )}

        {/* MODAL FORM */}
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
             <div className={`w-full max-w-2xl rounded-[32px] border shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100'}`}>
                
                {/* Modal Header */}
                <div className={`px-10 py-8 border-b flex justify-between items-center transition-colors ${dc ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-50'}`}>
                   <div>
                      <h2 className="h2">{formData.id ? 'Editar propiedad' : 'Nueva propiedad'}</h2>
                      <p className="body-text text-[10px] uppercase tracking-widest font-bold opacity-60 mt-1">Complete los detalles técnicos de la unidad</p>
                   </div>
                   <button onClick={() => setShowModal(false)} className={`p-3 rounded-2xl transition-all ${dc ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white border text-slate-400 hover:text-slate-800 shadow-md'}`}><X size={20} /></button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar max-h-[70vh]">
                   
                   {/* Images Section */}
                   <div className="flex flex-col sm:flex-row gap-10 items-start">
                      <div className="space-y-3 shrink-0">
                         <label className="label-text">Logo / Principal</label>
                         <div onClick={() => fileInputRef.current?.click()} className={`w-28 h-28 rounded-[24px] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${dc ? 'border-slate-800 bg-slate-900 hover:border-primary/50' : 'border-slate-200 bg-slate-50 hover:border-primary/50'} overflow-hidden relative shadow-inner`}>
                            {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> : <Upload size={24} className="text-slate-400" />}
                         </div>
                         <input type="file" ref={fileInputRef} className="hidden" onChange={e => handleImageUpload(e, true)} />
                      </div>
                      <div className="space-y-3 flex-1">
                         <label className="label-text">Galería (máx 3 fotos)</label>
                         <div className="flex flex-wrap gap-4">
                            {formData.images.map((img, i) => (
                              <div key={i} className="w-24 h-24 rounded-[24px] overflow-hidden relative border border-slate-200 shadow-xl group">
                                 <img src={img} className="w-full h-full object-cover" />
                                 <button onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"><X size={12} /></button>
                              </div>
                            ))}
                            {formData.images.length < 3 && (
                               <div onClick={() => multipleFileInputRef.current?.click()} className={`w-24 h-24 rounded-[24px] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${dc ? 'border-slate-800 bg-slate-900 hover:border-primary/50' : 'border-slate-200 bg-slate-50 hover:border-primary/50'} shadow-inner`}>
                                  <ImageIcon size={24} className="text-slate-400" />
                               </div>
                            )}
                         </div>
                         <input type="file" ref={multipleFileInputRef} multiple className="hidden" onChange={e => handleImageUpload(e, false)} />
                      </div>
                   </div>

                   {/* Form Grid */}
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="sm:col-span-2">
                         <label className="label-text mb-2 block">Nombre comercial</label>
                         <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Departamento Luxury 402" className={inputCls} />
                      </div>

                      <div>
                         <label className="label-text mb-2 block">Proyecto</label>
                         <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className={inputCls} placeholder="Ej. Residencial Las Dunas" />
                      </div>
                      <div>
                         <label className="label-text mb-2 block">Desarrollador</label>
                         <input type="text" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} className={inputCls} placeholder="Ej. Inmobiliaria Prexup" />
                      </div>

                      <div>
                         <label className="label-text mb-2 block">RUC / ID fiscal</label>
                         <input type="text" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} className={inputCls} placeholder="20601234567" />
                      </div>
                      <div>
                         <label className="label-text mb-2 block">Tipo de unidad</label>
                         <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={inputCls}>
                            <option value="departamento">Departamento</option>
                            <option value="casa">Casa</option>
                            <option value="oficina">Oficina</option>
                            <option value="terreno">Terreno</option>
                         </select>
                      </div>

                      <div>
                         <label className="label-text mb-2 block">Teléfono de contacto</label>
                         <input type="tel" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} className={inputCls} placeholder="+51 900 000 000" />
                      </div>
                      <div>
                         <label className="label-text mb-2 block">Email de contacto</label>
                         <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputCls} placeholder="ventas@inmobiliaria.com" />
                      </div>

                      <div>
                         <label className="label-text mb-2 block">Precio de venta</label>
                         <div className="flex gap-3">
                            <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className={`w-28 px-4 py-3 rounded-2xl border text-xs font-black outline-none ${dc ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-200 border-slate-300 text-slate-800 shadow-inner'}`}>
                               <option value="USD">USD</option>
                               <option value="PEN">PEN</option>
                            </select>
                            <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={inputCls} placeholder="0.00" />
                         </div>
                      </div>
                      <div>
                         <label className="label-text mb-2 block">Estado de venta</label>
                         <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={inputCls}>
                            <option value="disponible">Disponible</option>
                            <option value="reservado">Reservado</option>
                            <option value="vendido">Vendido</option>
                         </select>
                      </div>

                      <div className="sm:col-span-2">
                         <label className="label-text mb-2 block">Ubicación / Dirección</label>
                         <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className={inputCls} placeholder="Ej. Av. Larco 123, Miraflores" />
                      </div>

                      <div>
                         <label className="label-text mb-2 block">Área total (m²)</label>
                         <input type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className={inputCls} placeholder="0.00" />
                      </div>
                      <div>
                         <label className="label-text mb-2 block">Habitaciones</label>
                         <input type="number" value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} className={inputCls} placeholder="0" />
                      </div>

                      <div className="sm:col-span-2">
                         <label className="label-text mb-2 block">Notas internas</label>
                         <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Detalles adicionales..." className={inputCls + " resize-none h-32"} />
                      </div>
                   </div>
                </div>

                {/* Modal Footer */}
                <div className={`px-10 py-8 border-t transition-colors flex items-center justify-end gap-6 ${dc ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                   <button onClick={() => setShowModal(false)} className="text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all px-4">Cancelar</button>
                   <button onClick={handleSave} className="btn-primary py-4 px-10">
                      <span className="text-[11px] font-black uppercase tracking-widest">{formData.id ? 'Actualizar registro' : 'Guardar propiedad'}</span>
                   </button>
                </div>

             </div>
          </div>
        )}
      </div>
    </div>
  );
}

