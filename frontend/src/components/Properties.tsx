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
                <h1 className={`text-xl font-black tracking-tight lowercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Inventario</h1>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Gestión de Unidades e Inmuebles</p>
             </div>
          </div>
          <button onClick={() => { resetForm(); setShowModal(true); }} className="bg-primary text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95">
             + agregar propiedad
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap justify-between items-center gap-4">
           <div className="flex items-center gap-3">
              <div className="relative w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                 <input type="text" placeholder="Buscar propiedad..." className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-xs font-bold outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`} />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className={`px-4 py-2.5 rounded-xl border text-[11px] font-black uppercase tracking-widest outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                 <option value="Todos">Todos</option>
                 <option value="Casas">Casas</option>
                 <option value="Departamento">Departamentos</option>
                 <option value="Terreno">Terrenos</option>
                 <option value="Oficina">Oficinas</option>
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
                <div key={p.id} className={`group rounded-[32px] border overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/20'}`}>
                   <div className="h-56 relative overflow-hidden">
                      <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-4 left-4">
                         <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full backdrop-blur-md border ${p.status === 'Disponible' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>{p.status}</span>
                      </div>
                      <div className="absolute bottom-4 right-4 flex gap-2 translate-y-12 group-hover:translate-y-0 transition-transform duration-300">
                         <button onClick={() => { setFormData(p); setShowModal(true); }} className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-primary transition-all shadow-xl"><Edit2 size={16} /></button>
                         <button onClick={() => deleteProperty(p.id)} className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xl"><Trash2 size={16} /></button>
                      </div>
                   </div>
                   <div className="p-6 space-y-4">
                      <div>
                         <h3 className={`font-black text-[15px] mb-1 truncate lowercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{p.name}</h3>
                         <div className="flex items-center gap-2 text-slate-500">
                            <MapPin size={12} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{p.location || 'Ubicación no def.'}</span>
                         </div>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-slate-100/50 dark:border-slate-800">
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
           <div className={`rounded-[32px] border overflow-hidden overflow-x-auto ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800 shadow-inner' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/20'}`}>
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
                               <img src={p.avatar || 'https://via.placeholder.com/80'} className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-slate-800" alt="" />
                               <div>
                                  <div className={`font-black text-[13px] lowercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{p.name}</div>
                                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{p.type} • {p.area} m²</div>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-4">
                            <div className="text-[12px] font-black text-primary lowercase">{p.project}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{p.developer}</div>
                         </td>
                         <td className="px-8 py-4 text-right">
                            <div className="text-sm font-black text-emerald-500">{p.currency} {p.price}</div>
                         </td>
                         <td className="px-8 py-4">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${p.status === 'Disponible' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{p.status}</span>
                         </td>
                         <td className="px-8 py-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { setFormData(p); setShowModal(true); }} className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'border-slate-800 text-slate-400 hover:text-primary hover:bg-primary/10' : 'border-slate-100 text-slate-400 hover:text-primary hover:bg-primary/5'}`}><Edit2 size={16} /></button>
                               <button onClick={() => deleteProperty(p.id)} className={`p-2.5 rounded-xl border transition-all ${isDarkMode ? 'border-rose-900/30 text-rose-400 hover:text-rose-500 hover:bg-rose-500/10' : 'border-rose-100 text-rose-300 hover:text-rose-500 hover:bg-rose-50'}`}><Trash2 size={16} /></button>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
             <div className={`w-full max-w-3xl rounded-[40px] border shadow-2xl overflow-hidden flex flex-col ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100'}`}>
                
                {/* Modal Header */}
                <div className={`px-10 py-8 border-b flex justify-between items-center transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-50'}`}>
                   <div>
                      <h2 className={`text-xl font-black tracking-tight lowercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{formData.id ? 'editar propiedad' : 'añadir unidad'}</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">información técnica e inventario</p>
                   </div>
                   <button onClick={() => setShowModal(false)} className={`p-3 rounded-2xl transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-white border text-slate-400 hover:text-slate-800 shadow-sm'}`}><X size={20} /></button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar max-h-[70vh]">
                   
                   {/* Imagenes Section */}
                   <div className="flex gap-10 items-start">
                      <div className="space-y-3 shrink-0">
                         <label className={labelCls}>logo</label>
                         <div onClick={() => fileInputRef.current?.click()} className={`w-24 h-24 rounded-[32px] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${isDarkMode ? 'border-slate-800 bg-slate-900 hover:border-primary/50' : 'border-slate-200 bg-slate-50 hover:border-primary/50'} overflow-hidden relative shadow-inner`}>
                            {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> : <Upload size={24} className="text-slate-400" />}
                         </div>
                         <input type="file" ref={fileInputRef} className="hidden" onChange={e => handleImageUpload(e, true)} />
                      </div>
                      <div className="space-y-3 flex-1">
                         <label className={labelCls}>galería (máx 3 fotos)</label>
                         <div className="flex gap-4">
                            {formData.images.map((img, i) => (
                              <div key={i} className="w-24 h-24 rounded-[32px] overflow-hidden relative border border-slate-200 shadow-lg">
                                 <img src={img} className="w-full h-full object-cover" />
                                 <button onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute top-2 right-2 p-1 bg-rose-500 text-white rounded-full shadow-lg"><X size={12} /></button>
                              </div>
                            ))}
                            {formData.images.length < 3 && (
                               <div onClick={() => multipleFileInputRef.current?.click()} className={`w-24 h-24 rounded-[32px] border-2 border-dashed flex items-center justify-center cursor-pointer transition-all ${isDarkMode ? 'border-slate-800 bg-slate-900 hover:border-primary/50' : 'border-slate-200 bg-slate-50 hover:border-primary/50'} shadow-inner`}>
                                  <ImageIcon size={24} className="text-slate-400" />
                               </div>
                            )}
                         </div>
                         <input type="file" ref={multipleFileInputRef} multiple className="hidden" onChange={e => handleImageUpload(e, false)} />
                      </div>
                   </div>

                   {/* Form Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="md:col-span-2">
                         <label className={labelCls}>nombre comercial de la propiedad</label>
                         <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="ej. departamento luxury 402 - torre a" className={inputCls} />
                      </div>

                      <div>
                         <label className={labelCls}>nombre del proyecto</label>
                         <input type="text" value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className={inputCls} placeholder="ej. residencial las dunas" />
                      </div>
                      <div>
                         <label className={labelCls}>desarrollador / inmobiliaria</label>
                         <input type="text" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} className={inputCls} placeholder="ej. inmobiliaria prexup s.a." />
                      </div>

                      <div>
                         <label className={labelCls}>ruc / identificación fiscal</label>
                         <input type="text" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} className={inputCls} placeholder="ej. 20601234567" />
                      </div>
                      <div>
                         <label className={labelCls}>tipo de unidad</label>
                         <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={inputCls}>
                            <option value="Departamento">Departamento</option>
                            <option value="Casa">Casa</option>
                            <option value="Oficina">Oficina</option>
                            <option value="Terreno">Terreno</option>
                         </select>
                      </div>

                      <div>
                         <label className={labelCls}>teléfono de contacto</label>
                         <input type="tel" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} className={inputCls} placeholder="+51 900 000 000" />
                      </div>
                      <div>
                         <label className={labelCls}>email de contacto</label>
                         <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputCls} placeholder="ventas@inmobiliaria.com" />
                      </div>

                      <div>
                         <label className={labelCls}>precio de venta</label>
                         <div className="flex gap-4">
                            <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-28 px-4 py-3.5 rounded-2xl border text-[11px] font-black bg-slate-900 text-white outline-none">
                               <option value="USD">USD</option>
                               <option value="PEN">PEN</option>
                            </select>
                            <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={inputCls} placeholder="0.00" />
                         </div>
                      </div>
                      <div>
                         <label className={labelCls}>estado de venta</label>
                         <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={inputCls}>
                            <option value="Disponible">Disponible</option>
                            <option value="Reservado">Reservado</option>
                            <option value="Vendido">Vendido</option>
                         </select>
                      </div>

                      <div className="md:col-span-2">
                         <label className={labelCls}>dirección completa</label>
                         <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className={inputCls} placeholder="ej. av. larco 123, miraflores, lima" />
                      </div>

                      <div>
                         <label className={labelCls}>área total (m²)</label>
                         <input type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className={inputCls} placeholder="0.00" />
                      </div>
                      <div>
                         <label className={labelCls}>habitaciones</label>
                         <input type="number" value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} className={inputCls} placeholder="0" />
                      </div>

                      <div className="md:col-span-2">
                         <label className={labelCls}>notas y detalles internos</label>
                         <textarea rows={4} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="ej. acabados de mármol, vista al mar, incluye cochera..." className={inputCls + " resize-none"} />
                      </div>
                   </div>
                </div>

                {/* Modal Footer */}
                <div className={`p-10 border-t transition-colors flex items-center justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                   <button onClick={() => setShowModal(false)} className={`px-10 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all`}>cancelar</button>
                   <button onClick={handleSave} className="bg-primary text-white px-14 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98]">
                      {formData.id ? 'actualizar registro' : 'guardar propiedad'}
                   </button>
                </div>

             </div>
          </div>
        )}
      </div>
    </div>
  );
}
