import React, { useState, useEffect, useRef } from 'react';
import { Home, Building2, Map, LayoutGrid, LayoutList, Search, Plus, Filter, MapPin, X, Edit2, Trash2, Upload, XCircle, Image as ImageIcon, DollarSign, Tag, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Properties({ isDarkMode }: { isDarkMode?: boolean }) {
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [filterType, setFilterType] = useState('Todos');
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
    id: null as number | null, name: '', project: '', developer: '', type: 'Departamento', 
    price: '', currency: 'USD', location: '', area: '', 
    rooms: '', notes: '', status: 'Disponible', avatar: '', images: [] as string[],
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

  const resetForm = () => setFormData({ id: null, name: '', project: '', developer: '', type: 'Departamento', price: '', currency: 'USD', location: '', area: '', rooms: '', notes: '', status: 'Disponible', avatar: '', images: [], contactNumber: '', email: '', ruc: '' });

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

  const filteredProperties = properties.filter(p => filterType === 'Todos' || p.type === filterType);

  const inputCls = `w-full p-2.5 rounded-xl border text-xs font-bold outline-none transition-all focus:ring-4 focus:ring-primary/10 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary shadow-inner'}`;
  const labelCls = `text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1`;

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isDarkMode ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                <Home size={24} />
             </div>
             <div>
                <h1 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Inventario</h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Gestión de Unidades e Inmuebles</p>
             </div>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="w-full md:w-auto px-8 py-3.5 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/20">
             + Agregar Nueva Propiedad
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap justify-between items-center gap-4">
           <div className="flex items-center gap-3">
              <div className="relative w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                 <input type="text" placeholder="Buscar propiedad..." className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs font-bold outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`} />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className={`px-4 py-2.5 rounded-xl border text-xs font-bold outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                 <option value="Todos">Todos</option>
                 <option value="Casas">Casas</option>
                 <option value="Departamentos">Dptos</option>
                 <option value="Terrenos">Terrenos</option>
              </select>
           </div>
           <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-100'}`}>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? (isDarkMode ? 'bg-primary text-white shadow-lg' : 'bg-primary text-white shadow-md') : 'text-slate-500'}`}><LayoutGrid size={18} /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? (isDarkMode ? 'bg-primary text-white shadow-lg' : 'bg-primary text-white shadow-md') : 'text-slate-500'}`}><LayoutList size={18} /></button>
           </div>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProperties.map(p => (
                <div key={p.id} className={`group rounded-[32px] border overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
                   <div className="h-56 relative overflow-hidden">
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 left-4">
                         <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md border ${p.status === 'Disponible' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>{p.status}</span>
                      </div>
                      <div className="absolute bottom-4 right-4 flex gap-2 translate-y-12 group-hover:translate-y-0 transition-transform duration-300">
                         <button onClick={() => { setFormData(p); setShowModal(true); }} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-all"><Edit2 size={16} /></button>
                         <button className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg"><Trash2 size={16} /></button>
                      </div>
                   </div>
                   <div className="p-6 space-y-4">
                      <div>
                         <h3 className={`font-black text-sm mb-1 truncate lowercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{p.name}</h3>
                         <div className="flex items-center gap-2 text-slate-500">
                            <MapPin size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{p.location || 'Ubicación no def.'}</span>
                         </div>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100/50">
                         <span className="text-lg font-black text-primary">{p.currency} {p.price}</span>
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.area} m²</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
           <div className={`rounded-[32px] border overflow-hidden overflow-x-auto ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800 shadow-inner' : 'bg-white border-slate-200'}`}>
              <table className="w-full text-left">
                 <thead>
                    <tr className={`text-[10px] font-black uppercase tracking-widest text-slate-500 ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                       <th className="px-8 py-5">Propiedad</th>
                       <th className="px-8 py-5">Proyecto / Desarrollador</th>
                       <th className="px-8 py-5 text-right">Precio</th>
                       <th className="px-8 py-5">Estado</th>
                       <th className="px-8 py-5 text-right">Acciones</th>
                    </tr>
                 </thead>
                 <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {filteredProperties.map(p => (
                      <tr key={p.id} className="hover:bg-primary/[0.02] transition-colors group">
                         <td className="px-8 py-4">
                            <div className="flex items-center gap-4">
                               <img src={p.avatar || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-xl object-cover border border-slate-200" alt="" />
                               <div>
                                  <div className={`font-black text-xs lowercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{p.name}</div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{p.type} • {p.area} m²</div>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-4">
                            <div className="text-[11px] font-black text-primary lowercase">{p.project}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.developer}</div>
                         </td>
                         <td className="px-8 py-4 text-right">
                            <div className="text-xs font-black text-emerald-500">{p.currency} {p.price}</div>
                         </td>
                         <td className="px-8 py-4">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${p.status === 'Disponible' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{p.status}</span>
                         </td>
                         <td className="px-8 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { setFormData(p); setShowModal(true); }} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-primary transition-all"><Edit2 size={14} /></button>
                               <button className="p-2 rounded-xl border border-rose-100 text-rose-300 hover:text-rose-500 transition-all"><Trash2 size={14} /></button>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
             <div className={`w-full max-w-2xl rounded-[40px] border shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-slate-200'}`}>
                
                {/* Modal Header */}
                <div className={`px-8 py-6 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                   <div>
                      <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{formData.id ? 'Editar Propiedad' : 'Nueva Unidad'}</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Información Técnica e Inventario</p>
                   </div>
                   <button onClick={() => setShowModal(false)} className={`p-2.5 rounded-2xl transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white border text-slate-400 hover:text-slate-800 shadow-sm'}`}><X size={20} /></button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar max-h-[70vh]">
                   
                   {/* Imagenes Section */}
                   <div className="flex gap-6 items-start">
                      <div className="space-y-2 shrink-0">
                         <label className={labelCls}>logo</label>
                         <div onClick={() => fileInputRef.current?.click()} className={`w-20 h-20 rounded-[24px] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${isDarkMode ? 'border-slate-800 bg-slate-900/50 hover:border-primary/50' : 'border-slate-200 bg-slate-50 hover:border-primary/50'} overflow-hidden relative`}>
                            {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> : <Upload size={20} className="text-slate-400" />}
                         </div>
                         <input type="file" ref={fileInputRef} className="hidden" onChange={e => handleImageUpload(e, true)} />
                      </div>
                      <div className="space-y-2 flex-1">
                         <label className={labelCls}>galería (máx 3)</label>
                         <div className="flex gap-3">
                            {formData.images.map((img, i) => (
                              <div key={i} className="w-20 h-20 rounded-[24px] overflow-hidden relative border border-slate-200">
                                 <img src={img} className="w-full h-full object-cover" />
                                 <button onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full"><X size={10} /></button>
                              </div>
                            ))}
                            {formData.images.length < 3 && (
                               <div onClick={() => multipleFileInputRef.current?.click()} className={`w-20 h-20 rounded-[24px] border-2 border-dashed flex items-center justify-center cursor-pointer ${isDarkMode ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                                  <ImageIcon size={20} className="text-slate-400" />
                               </div>
                            )}
                         </div>
                         <input type="file" ref={multipleFileInputRef} multiple className="hidden" onChange={e => handleImageUpload(e, false)} />
                      </div>
                   </div>

                   {/* Form Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 md:col-span-2">
                         <label className={labelCls}>nombre comercial de la propiedad</label>
                         <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Departamento Luxury 402 - Torre A" className={inputCls} />
                      </div>

                      <div className="space-y-2">
                         <label className={labelCls}>nombre del proyecto</label>
                         <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className={inputCls} />
                      </div>
                      <div className="space-y-2">
                         <label className={labelCls}>desarrollador / inmobiliaria</label>
                         <input type="text" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} className={inputCls} />
                      </div>

                      <div className="space-y-2">
                         <label className={labelCls}>RUC / identificación fiscal</label>
                         <input type="text" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} className={inputCls} />
                      </div>
                      <div className="space-y-2">
                         <label className={labelCls}>tipo de unidad</label>
                         <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={inputCls}>
                            <option>Departamento</option><option>Casa</option><option>Oficina</option><option>Terreno</option>
                         </select>
                      </div>

                      <div className="space-y-2">
                         <label className={labelCls}>teléfono de contacto</label>
                         <input type="tel" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} className={inputCls} />
                      </div>
                      <div className="space-y-2">
                         <label className={labelCls}>email de contacto</label>
                         <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputCls} />
                      </div>

                      <div className="space-y-2">
                         <label className={labelCls}>precio</label>
                         <div className="flex gap-2">
                            <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-24 p-2.5 rounded-xl border text-xs font-black bg-slate-900 text-white outline-none">
                               <option>USD</option><option>PEN</option>
                            </select>
                            <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={inputCls} />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className={labelCls}>estado de venta</label>
                         <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={inputCls}>
                            <option>Disponible</option><option>Reservado</option><option>Vendido</option>
                         </select>
                      </div>

                      <div className="space-y-2 md:col-span-2">
                         <label className={labelCls}>dirección completa</label>
                         <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className={inputCls} />
                      </div>

                      <div className="space-y-2">
                         <label className={labelCls}>área total (m²)</label>
                         <input type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className={inputCls} />
                      </div>
                      <div className="space-y-2">
                         <label className={labelCls}>habitaciones</label>
                         <input type="number" value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} className={inputCls} />
                      </div>

                      <div className="space-y-2 md:col-span-2">
                         <label className={labelCls}>notas y detalles internos</label>
                         <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Detalles de cochera, acabados, vista..." className={inputCls + " resize-none"} />
                      </div>
                   </div>
                </div>

                {/* Modal Footer */}
                <div className={`p-8 border-t transition-colors flex items-center justify-between ${isDarkMode ? 'bg-[#0B1120]' : 'bg-slate-50'}`}>
                   <button onClick={() => setShowModal(false)} className={`px-8 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all`}>Cancelar</button>
                   <button onClick={handleSave} className="px-12 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[2px] rounded-2xl shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98]">
                      {formData.id ? 'Actualizar Registro' : 'Guardar Propiedad'}
                   </button>
                </div>

             </div>
          </div>
        )}
      </div>
    </div>
  );
}


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
          <div className="flex gap-2 items-center">
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value)}
              className={`px-3 py-2 rounded-xl text-sm font-semibold outline-none transition-all ${isDarkMode ? 'bg-[#1E1E1E] text-white border border-slate-800' : 'bg-white text-slate-700 border border-slate-200 focus:border-primary'}`}
            >
              <option value="Todos">Todos los Inmuebles</option>
              <option value="Casas">Casas</option>
              <option value="Departamentos">Departamentos</option>
              <option value="Terrenos">Terrenos</option>
              <option value="Oficinas">Oficinas</option>
            </select>
            <button className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-[#1E1E1E] text-slate-400 border border-slate-800 hover:text-primary' : 'bg-white text-slate-500 border border-slate-200 hover:text-primary'}`}>
              <Filter size={18} />
            </button>
          </div>
          <div className={`flex p-1 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? (isDarkMode ? 'bg-slate-700 text-primary' : 'bg-slate-100 text-primary') : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? (isDarkMode ? 'bg-slate-700 text-primary' : 'bg-slate-100 text-primary') : 'text-slate-400'}`}><LayoutList size={18} /></button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProperties.map(p => (
              <div key={p.id} className={`rounded-2xl border shadow-sm overflow-hidden group transition-all hover:shadow-xl ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="h-40 md:h-48 overflow-hidden relative">
                  <img src={p.images?.[0] || p.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=500&q=60'} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
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
                    <button onClick={() => { setFormData(p); setShowModal(true); }} className={`py-2 rounded-lg text-[12px] font-semibold transition-all active:scale-95 ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Editar</button>
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
                {filteredProperties.map(p => {
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
                      <td className="px-4 py-2 pl-6 font-semibold text-[13px] flex items-center gap-2">
                        {p.avatar && <img src={p.avatar} alt="Logo" className="w-5 h-5 rounded object-cover" />}
                        {p.name}
                      </td>
                      <td className="px-4 py-2 text-[13px] font-semibold">{p.price} {p.currency}</td>
                      <td className="px-4 py-2 text-[12px]">{p.area} m²</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusColors}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => { setFormData(p); setShowModal(true); }} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-400 hover:text-primary hover:bg-primary/10' : 'text-slate-500 hover:text-primary hover:bg-primary/10'}`} title="Editar">
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-[#0B1120]/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0F172A] border border-slate-800/60 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800/60 flex justify-between items-center bg-[#0F172A]">
              <h2 className="font-bold text-sm text-white">{formData.id ? 'Editar Propiedad' : 'Nueva Propiedad'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0F172A]">
              <form id="property-form" onSubmit={handleSave} className="space-y-3">
                
                {/* Image Upload Section */}
                {/* Image Upload Section Compact */}
                <div className="flex gap-4 mb-2 items-start">
                  {/* Avatar Upload */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">logo</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 bg-[#1E293B] border border-slate-700/50 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group relative"
                    >
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-500 group-hover:text-primary transition-colors">
                          <Upload size={16} />
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                  </div>

                  {/* Property Photos Upload */}
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase flex justify-between">
                      <span>fotos ({formData.images?.length || 0}/3)</span>
                    </label>
                    <div className="flex gap-2">
                      {formData.images?.map((img, i) => (
                        <div key={i} className="w-16 h-16 rounded-xl bg-[#1E293B] border border-slate-700/50 overflow-hidden relative group">
                          <img src={img} alt={`Foto ${i}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage(i)} className="absolute top-0 right-0 p-0.5 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                      {(formData.images?.length || 0) < 3 && (
                        <div 
                          onClick={() => multipleFileInputRef.current?.click()}
                          className="w-16 h-16 bg-[#1E293B] border border-slate-700/50 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group"
                        >
                          <ImageIcon size={16} className="text-slate-500 group-hover:text-primary transition-colors" />
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" multiple ref={multipleFileInputRef} onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  <div className="col-span-1 md:col-span-4">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">título de la propiedad</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Lujoso Dpto en Miraflores" className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary transition-all" />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">tipo</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white outline-none focus:border-primary transition-all">
                      <option value="Casa">Casa</option>
                      <option value="Departamento">Departamento</option>
                      <option value="Oficina">Oficina</option>
                      <option value="Terreno">Terreno</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-3">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">proyecto</label>
                    <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} placeholder="Nombre del proyecto" className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary transition-all" />
                  </div>

                  <div className="col-span-1 md:col-span-3">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">desarrollador</label>
                    <input type="text" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} placeholder="Nombre de la inmobiliaria" className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary transition-all" />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">ruc</label>
                    <input type="text" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} placeholder="RUC del desarrollador" className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary transition-all" />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">contacto</label>
                    <input type="tel" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} placeholder="Teléfono" className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary transition-all" />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">email contacto</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@inmobiliaria.com" className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary transition-all" />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">estado</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white outline-none focus:border-primary transition-all">
                      <option value="Disponible">🟢 Disponible</option>
                      <option value="Reservado">🟠 Reservado</option>
                      <option value="Vendido">⚫ Vendido</option>
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-4">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">precio y moneda</label>
                    <div className="flex gap-2 mt-1">
                      <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-20 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white outline-none focus:border-primary transition-all">
                        <option value="USD">USD</option>
                        <option value="PEN">PEN</option>
                      </select>
                      <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="flex-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary transition-all" />
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-4">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">dirección</label>
                    <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Dirección física o zona" className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary transition-all" />
                  </div>

                  <div className="col-span-1 md:col-span-1">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">área m²</label>
                    <input type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} placeholder="120" className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary transition-all" />
                  </div>

                  <div className="col-span-1 md:col-span-1">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">hab.</label>
                    <input type="number" value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} placeholder="3" className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary transition-all" />
                  </div>

                  <div className="col-span-1 md:col-span-6">
                    <label className="text-[10px] text-slate-400 font-bold tracking-wider lowercase">notas</label>
                    <textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Amenities, cochera, vista..." className="w-full mt-1 p-2 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-primary transition-all resize-none"></textarea>
                  </div>
                </div>


              </form>
            </div>
            
            <div className="p-3 border-t border-slate-800/60 bg-[#0B1120] shrink-0">
              <button form="property-form" type="submit" disabled={formData.images?.length > 3} className="w-full bg-primary text-white p-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] active:scale-[0.98] disabled:opacity-50">
                Guardar Propiedad
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
