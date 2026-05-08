import React, { useState, useEffect, useRef } from 'react';
import { Home, Building2, Map, LayoutGrid, LayoutList, Search, Plus, Filter, MapPin, X, Edit2, Trash2, Upload, XCircle, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Properties({ isDarkMode }: { isDarkMode?: boolean }) {
  const [viewMode, setViewMode] = useState<'grid'|'list'>('list');
  const [filterType, setFilterType] = useState('Todos');
  const [properties, setProperties] = useState<any[]>([]);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const { token } = useAuth();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const multipleFileInputRef = useRef<HTMLInputElement>(null);

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
    if (token) {
      fetchProperties();
      fetchProjects();
    }
  }, [token]);

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${API_URL}/api/data/projects`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setProjectsList(await res.json());
    } catch (err) {}
  };

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    id: null as number | null, name: '', project: '', developer: '', type: 'Departamento', 
    price: '', currency: 'USD', location: '', area: '', 
    rooms: '', details: '', status: 'Disponible', avatar: '', images: [] as string[]
  });

  const uniqueDevelopers = Array.from(new Set(properties.map(p => p.developer).filter(Boolean)));

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
        setFormData({ id: null, name: '', project: '', developer: '', type: 'Departamento', price: '', currency: 'USD', location: '', area: '', rooms: '', details: '', status: 'Disponible', avatar: '', images: [] });
      }
    } catch (err) {
      console.error('Error saving property', err);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isAvatar: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (isAvatar) {
      const file = files[0];
      if (file.size > 2 * 1024 * 1024) return alert('El logo no debe superar los 2MB');
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      reader.readAsDataURL(file);
    } else {
      const currentCount = formData.images.length;
      if (currentCount + files.length > 3) return alert('Máximo 3 fotos de la propiedad permitidas.');
      
      Array.from(files).forEach(file => {
        if (file.size > 2 * 1024 * 1024) return;
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, reader.result as string].slice(0, 3)
          }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const filteredProperties = properties.filter(p => filterType === 'Todos' || p.type === filterType);

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
            <div className="px-5 py-4 border-b border-slate-800/60 flex justify-between items-center bg-[#0F172A]">
              <h2 className="font-bold text-sm text-white">Registro de Nueva Propiedad</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[#0F172A]">
              <form id="property-form" onSubmit={handleSave} className="space-y-4">
                
                {/* Image Upload Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
                  {/* Avatar Upload */}
                  <div className="col-span-1 flex flex-col gap-2">
                    <label className="text-[10px] text-slate-400 font-medium">Logo / Avatar</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-square bg-[#1E293B] border border-slate-700/50 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden group relative"
                    >
                      {formData.avatar ? (
                        <img src={formData.avatar} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-slate-500 group-hover:text-primary transition-colors">
                          <Upload size={20} className="mb-1" />
                          <span className="text-[10px] font-semibold">Subir</span>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => handleImageUpload(e, true)} className="hidden" />
                  </div>

                  {/* Property Photos Upload */}
                  <div className="col-span-1 md:col-span-3 flex flex-col gap-2">
                    <label className="text-[10px] text-slate-400 font-medium flex justify-between">
                      <span>Fotos (Máx 3)</span>
                      <span>{formData.images?.length || 0}/3</span>
                    </label>
                    <div className="flex gap-2">
                      {formData.images?.map((img, i) => (
                        <div key={i} className="w-20 sm:w-24 aspect-square rounded-xl bg-[#1E293B] border border-slate-700/50 overflow-hidden relative group">
                          <img src={img} alt={`Foto ${i}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {(formData.images?.length || 0) < 3 && (
                        <div 
                          onClick={() => multipleFileInputRef.current?.click()}
                          className="w-20 sm:w-24 aspect-square bg-[#1E293B] border border-slate-700/50 border-dashed rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors group"
                        >
                          <div className="flex flex-col items-center text-slate-500 group-hover:text-primary transition-colors">
                            <ImageIcon size={20} className="mb-1" />
                            <span className="text-[10px] font-semibold text-center leading-tight">Añadir<br/>Foto</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" multiple ref={multipleFileInputRef} onChange={(e) => handleImageUpload(e, false)} className="hidden" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-medium">Detalle de la Propiedad (Nombre/Título)</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Lujoso Dpto en Miraflores" className="w-full mt-1.5 p-2.5 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs md:text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium">Tipo de Inmueble</label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full mt-1.5 p-2.5 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs md:text-sm text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all">
                      <option value="Casa">Casa</option>
                      <option value="Departamento">Departamento</option>
                      <option value="Oficina">Oficina</option>
                      <option value="Deposito">Depósito</option>
                      <option value="Terreno">Terreno</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium">Nombre del Proyecto (Opcional)</label>
                    <div className="relative mt-1.5">
                      <input 
                        type="text" 
                        list="projects-list"
                        value={formData.project} 
                        onChange={e => setFormData({...formData, project: e.target.value})} 
                        placeholder="Ej. Torre Esmeralda" 
                        className="w-full p-2.5 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs md:text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" 
                      />
                      <datalist id="projects-list">
                        {projectsList.map((prj: any) => (
                          <option key={prj.id} value={prj.name} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-medium">Desarrollador / Inmobiliaria</label>
                    <div className="relative mt-1.5">
                      <input 
                        type="text" 
                        list="developers-list"
                        value={formData.developer} 
                        onChange={e => setFormData({...formData, developer: e.target.value})} 
                        placeholder="Ej. Inmobiliaria XYZ" 
                        className="w-full p-2.5 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs md:text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" 
                      />
                      <datalist id="developers-list">
                        {uniqueDevelopers.map(dev => (
                          <option key={dev} value={dev} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium">Estado</label>
                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full mt-1.5 p-2.5 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs md:text-sm text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all">
                      <option value="Disponible">🟢 Disponible</option>
                      <option value="Reservado">🟠 Reservado</option>
                      <option value="Vendido">⚫ Vendido</option>
                      <option value="Bloqueado">🔴 Bloqueado</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium">Precio de Venta</label>
                    <div className="flex gap-2 mt-1.5">
                      <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="w-24 p-2.5 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs md:text-sm text-white outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all">
                        <option value="USD">USD</option>
                        <option value="PEN">PEN</option>
                      </select>
                      <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} placeholder="0.00" className="flex-1 p-2.5 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs md:text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium">Ubicación</label>
                    <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Ej. Av. Principal 123" className="w-full mt-1.5 p-2.5 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs md:text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 font-medium">Área (m²)</label>
                    <input type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} placeholder="Ej. 120" className="w-full mt-1.5 p-2.5 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs md:text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
                  </div>

                  {formData.type !== 'Terreno' && formData.type !== 'Deposito' && (
                    <div>
                      <label className="text-[10px] text-slate-400 font-medium">Habitaciones / Privados</label>
                      <input type="number" value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} placeholder="Ej. 3" className="w-full mt-1.5 p-2.5 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs md:text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
                    </div>
                  )}

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] text-slate-400 font-medium">Otras características y detalles</label>
                    <textarea rows={3} value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})} placeholder="Describe amenities, cochera, vista, año de construcción..." className="w-full mt-1.5 p-2.5 bg-[#1E293B] border border-slate-700/50 rounded-lg text-xs md:text-sm text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"></textarea>
                  </div>

                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-slate-800/60 bg-[#0B1120] shrink-0">
              <button form="property-form" type="submit" disabled={formData.images?.length > 3} className="w-full bg-primary text-white p-3 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-[0_0_15px_rgba(37,99,235,0.2)] active:scale-[0.98] disabled:opacity-50">
                Guardar Propiedad
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
