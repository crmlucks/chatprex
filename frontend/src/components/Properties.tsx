import React, { useState, useEffect, useRef } from 'react';
import { Home, Building2, Map, LayoutGrid, LayoutList, Search, Plus, Filter, MapPin, X, Edit2, Trash2, Upload, XCircle, Image as ImageIcon, DollarSign, Tag, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';

export default function Properties({ isDarkMode }: { isDarkMode?: boolean }) {
 const [viewMode, setViewMode] = useState<'grid'|'list'>('list');
 const [filterType, setFilterType] = useState('todos');
 const [filterProject, setFilterProject] = useState('todos');
 const [filterStatus, setFilterStatus] = useState('todos');
 const [showFilters, setShowFilters] = useState(false);
 const [search, setSearch] = useState('');
 const [properties, setProperties] = useState<any[]>([]);
 const [dbProjects, setDbProjects] = useState<any[]>([]);
 const { token, user } = useAuth();

 const fileInputRef = useRef<HTMLInputElement>(null);
 const multipleFileInputRef = useRef<HTMLInputElement>(null);
 const [uploadingImage, setUploadingImage] = useState(false);

 const fetchProperties = async () => {
  try {
   const res = await fetch(`${API_URL}/api/properties`, {
    headers: { Authorization: `Bearer ${token}` }
   });
   if (res.ok) setProperties(await res.json());
  } catch (err) { console.error(err); }
 };

 const fetchProjects = async () => {
  try {
   const res = await fetch(`${API_URL}/api/data/projects`, {
    headers: { Authorization: `Bearer ${token}` }
   });
   if (res.ok) setDbProjects(await res.json());
  } catch (err) { console.error(err); }
 };

 useEffect(() => { 
  if (token) {
   fetchProperties(); 
   fetchProjects();
  }
 }, [token]);

 const uniqueDevelopers = Array.from(new Set(properties.map(p => p.developer).filter(Boolean)));

 const [showModal, setShowModal] = useState(false);
 const [formData, setFormData] = useState({
  id: null as number | null, name: '', project: '', type: 'departamento', 
  price: '', currency: 'USD', location: '', area: '', 
  rooms: '', bathrooms: '', parking: '', floor: '',
  notes: '', status: 'disponible', avatar: '', images: [] as string[],
  featured: false, visible: true
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

 const resetForm = () => setFormData({ id: null, name: '', project: '', type: 'departamento', price: '', currency: 'USD', location: '', area: '', rooms: '', bathrooms: '', parking: '', floor: '', notes: '', status: 'disponible', avatar: '', images: [], featured: false, visible: true });

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isAvatar: boolean = false) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  setUploadingImage(true);
  try {
   if (isAvatar) {
    const file = files[0];
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);
    
    const res = await fetch(`${API_URL}/api/upload`, {
     method: 'POST',
     headers: { Authorization: `Bearer ${token}` },
     body: formDataUpload
    });
    if (res.ok) {
     const data = await res.json();
     setFormData(prev => ({ ...prev, avatar: data.url }));
    }
   } else {
    const uploadedUrls: string[] = [];
    for (const file of Array.from(files)) {
     const formDataUpload = new FormData();
     formDataUpload.append('image', file);
     
     const res = await fetch(`${API_URL}/api/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formDataUpload
     });
     if (res.ok) {
      const data = await res.json();
      uploadedUrls.push(data.url);
     }
    }
    setFormData(prev => ({ 
     ...prev, 
     images: [...(prev.images || []), ...uploadedUrls].slice(0, 3) 
    }));
   }
  } catch (err) {
   console.error("Error al subir archivo:", err);
  } finally {
   setUploadingImage(false);
  }
 };

 const filteredProperties = properties.filter(p => {
  const matchType = filterType === 'todos' || p.type?.toLowerCase() === filterType.toLowerCase() || (filterType === 'casa' && p.type?.toLowerCase() === 'casas');
  const matchProject = filterProject === 'todos' || p.project === filterProject;
  const matchStatus = filterStatus === 'todos' || p.status === filterStatus;
  const searchLower = search.toLowerCase();
  const matchSearch = !search || p.name?.toLowerCase().includes(searchLower) || p.location?.toLowerCase().includes(searchLower) || p.developer?.toLowerCase().includes(searchLower);
  
  return matchType && matchProject && matchStatus && matchSearch;
 });
 const inputCls = "input-field";

 return (
  <div className={`flex-1 flex flex-col h-[calc(100vh-4rem)] md:h-full pb-24 md:pb-0 ${isDarkMode ? 'bg-surface-base' : 'bg-surface-base'}`}>
    
    <div className={`py-4 md:py-0 md:h-24 px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 transition-all ${isDarkMode ? 'bg-surface border-b border-edge' : 'bg-surface border-b border-edge shadow-sm'}`}>
     
     {/* Left side: Title + View Toggle */}
     <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-start">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/10 text-accent shrink-0">
         <Home size={22} />
        </div>
        <div className="flex flex-col">
         <h1 className="h1">Propiedades</h1>
         <p className="body-text mt-0.5 hidden md:block">Gestión de inventario inmobiliario</p>
        </div>
      </div>
      </div>

     {/* Right side: Search, Filters, Add Button */}
     <div className="flex items-center justify-between gap-1.5 md:gap-3 w-full md:w-auto">
      <div className="relative flex-1 min-w-0 md:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" size={14} />
        <input type="text" placeholder="Buscar propiedad..." value={search} onChange={e => setSearch(e.target.value)} className={`pl-9 pr-4 py-2 md:py-2.5 rounded-xl border text-xs font-medium outline-none transition-all w-full ${isDarkMode ? 'bg-surface-raised border-edge text-content focus:border-accent' : 'bg-surface border-edge focus:border-accent shadow-sm'}`} />
      </div>
      
      <div className="flex items-center gap-1 md:gap-2 shrink-0">
       <div className={`flex p-1 rounded-xl shrink-0 ${isDarkMode ? 'bg-surface-raised' : 'bg-surface-inset border border-edge '}`}>
        <button onClick={() => setViewMode('grid')} className={`p-1.5 md:p-2 rounded-lg transition-all ${viewMode === 'grid' ? (isDarkMode ? 'bg-accent text-content shadow-lg' : 'bg-accent text-content shadow-md') : 'text-content-muted hover:text-content-secondary'}`}><LayoutGrid size={14} className="md:w-4 md:h-4" /></button>
        <button onClick={() => setViewMode('list')} className={`p-1.5 md:p-2 rounded-lg transition-all ${viewMode === 'list' ? (isDarkMode ? 'bg-accent text-content shadow-lg' : 'bg-accent text-content shadow-md') : 'text-content-muted hover:text-content-secondary'}`}><LayoutList size={14} className="md:w-4 md:h-4" /></button>
       </div>
       <button onClick={() => setShowFilters(!showFilters)} className={`p-2 md:p-2.5 rounded-xl border transition-colors shrink-0 ${showFilters ? 'bg-accent text-content border-accent shadow-sm' : 'bg-surface border-edge text-content-muted hover:text-content'}`}>
        <Filter size={16} />
       </button>
       <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center justify-center shrink-0 w-9 h-9 md:w-auto md:h-auto md:px-4 md:py-2.5 gap-2">
        <Plus size={16} />
        <span className="hidden md:inline">Agregar propiedad</span>
       </button>
      </div>
     </div>
    </div>

    {/* Main Content Area */}
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
      {/* Filters Row */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl border border-edge bg-surface mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
         <div className="flex items-center gap-2 text-content-muted text-sm font-semibold mr-2 uppercase tracking-wider">
           <Filter size={14} /> Filtros:
         </div>
         <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input-field w-auto text-sm py-2 min-w-[160px] bg-surface-inset">
           <option value="todos">Todos los tipos</option>
           <option value="departamento">Departamentos</option>
           <option value="casa">Casas</option>
           <option value="terreno">Terrenos</option>
           <option value="oficina">Oficinas</option>
           <option value="deposito">Depósitos</option>
           <option value="otros">Otros</option>
         </select>
         <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="input-field w-auto text-sm py-2 min-w-[160px] bg-surface-inset">
           <option value="todos">Todos los proyectos</option>
           {dbProjects.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
         </select>
         <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto text-sm py-2 min-w-[160px] bg-surface-inset">
           <option value="todos">Todos los estados</option>
           <option value="disponible">Disponible</option>
           <option value="reservado">Reservado</option>
           <option value="vendido">Vendido</option>
         </select>
         
         {(filterType !== 'todos' || filterProject !== 'todos' || filterStatus !== 'todos' || search !== '') && (
           <button onClick={() => { setFilterType('todos'); setFilterProject('todos'); setFilterStatus('todos'); setSearch(''); }} className="text-xs font-medium text-rose-500 hover:text-rose-600 transition-colors ml-auto flex items-center gap-1 bg-rose-500/10 px-3 py-2 rounded-lg">
             <X size={14} /> Limpiar filtros
           </button>
         )}
        </div>
      )}

    {/* Grid View — excludes terrenos (no tienen imagen relevante) */}
    {viewMode === 'grid' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
       {filteredProperties.filter(p => p.type?.toLowerCase() !== 'terreno').map(p => (
        <div key={p.id} className="card group overflow-hidden flex flex-col h-full">
          <div className="h-48 relative overflow-hidden shrink-0">
           <img src={p.images?.[0] || p.avatar || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
           <div className="absolute top-3 left-3">
             <span className={`text-xs font-bold px-2 py-1 rounded-lg border backdrop-blur-sm ${p.status === 'disponible' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' : p.status === 'reservado' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' : 'bg-rose-500/20 text-rose-500 border-rose-500/30'}`}>{p.status}</span>
           </div>
            <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
              {p.avatar && (
                <div className="w-10 h-10 rounded-xl border-2 border-white/50 bg-white overflow-hidden shadow-lg backdrop-blur-sm">
                  <img src={p.avatar} className="w-full h-full object-contain p-1" alt="Logo" />
                </div>
              )}
              {p.images?.length > 0 && (
                <div className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-xl">
                  <ImageIcon size={10} /> {p.images.length} Fotos
                </div>
              )}
            </div>
           <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={() => { setFormData({...p, bathrooms: p.bathrooms || '', parking: p.parking || '', floor: p.floor || '', notes: p.details || p.notes || '', avatar: p.avatar || '', images: p.images || [], featured: p.featured ?? false, visible: p.visible ?? true}); setShowModal(true); }} className="w-8 h-8 rounded-lg bg-surface/90 backdrop-blur text-content flex items-center justify-center hover:bg-accent hover:text-white transition-colors shadow-sm"><Edit2 size={14} /></button>
             { (user?.role === 'propietario' || user?.role === 'administrador') && (
               <button onClick={() => deleteProperty(p.id)} className="w-8 h-8 rounded-lg bg-rose-500/90 backdrop-blur text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"><Trash2 size={14} /></button>
             )}
           </div>
          </div>
          <div className="p-4 flex flex-col flex-1 space-y-3">
           <div>
             <h3 className="font-bold text-sm text-content truncate">{p.name}</h3>
             {p.project && <span className="text-[11px] font-medium text-accent">{p.project}</span>}
             <div className="flex items-center gap-1.5 text-content-muted mt-1">
              <MapPin size={12} className="shrink-0 text-accent/60" />
              <span className="text-xs truncate">{p.location || 'Sin ubicación'}</span>
             </div>
           </div>
           {(p.rooms || p.bathrooms || p.parking) && (
            <div className="flex gap-2 flex-wrap">
             {p.rooms && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-inset text-content-muted">{p.rooms} hab</span>}
             {p.bathrooms && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-inset text-content-muted">{p.bathrooms} baños</span>}
             {p.parking && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-inset text-content-muted">{p.parking} est.</span>}
            </div>
           )}
           <div className="flex justify-between items-center pt-3 border-t border-edge mt-auto">
             <span className="text-base font-black text-accent">{p.currency} {Number(p.price).toLocaleString()}</span>
             <span className="text-xs font-bold text-content-muted">{p.area} m²</span>
           </div>
          </div>
        </div>
       ))}
       {filteredProperties.filter(p => p.type?.toLowerCase() !== 'terreno').length === 0 && (
        <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 card-premium p-12 text-center">
         <Home size={32} className="mx-auto mb-3 opacity-20" />
         <p className="text-sm font-bold text-content-muted">Sin propiedades con imágenes</p>
         <p className="text-xs text-content-muted mt-1">Los terrenos solo aparecen en la vista de lista</p>
        </div>
       )}
      </div>
    )}

    {/* List View — muestra TODAS las propiedades */}
    {viewMode === 'list' && (
      <div className="card-premium overflow-hidden overflow-x-auto">
       <table className="w-full text-left">
          <thead>
           <tr className={`text-[9px] md:text-[11px] font-bold text-content-muted uppercase tracking-wider border-b ${isDarkMode ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge'}`}>
             <th className="px-3 py-2 md:px-5 md:py-4">Propiedad</th>
             <th className="px-3 py-2 md:px-5 md:py-4">Proyecto</th>
             <th className="px-3 py-2 md:px-5 md:py-4">Estado</th>
             <th className="px-3 py-2 md:px-5 md:py-4 text-right">Precio</th>
             <th className="px-3 py-2 md:px-5 md:py-4 text-right">Área</th>
             <th className="px-3 py-2 md:px-5 md:py-4 hidden lg:table-cell">Ubicación</th>
             <th className="px-3 py-2 md:px-5 md:py-4 hidden xl:table-cell">Detalles</th>
             <th className="px-3 py-2 md:px-5 md:py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-edge' : 'divide-slate-100'}`}>
           {filteredProperties.map(p => {
            const isBuilding = !['terreno','deposito'].includes(p.type?.toLowerCase() || '');
            return (
             <tr key={p.id} className="hover:bg-surface-inset transition-colors group">
               <td className="px-3 py-2 md:px-5 md:py-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg overflow-hidden border border-edge shrink-0 bg-surface-inset">
                   {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-content-muted"><Home size={16} /></div>}
                  </div>
                  <div className="min-w-0">
                   <div className="font-bold text-xs md:text-sm text-content truncate max-w-[120px] md:max-w-[180px]">{p.name}</div>
                   <div className="text-[9px] md:text-[11px] font-medium text-content-muted mt-0.5 capitalize">{p.type}</div>
                  </div>
                </div>
               </td>
               <td className="px-3 py-2 md:px-5 md:py-3">
                <span className="text-[10px] md:text-xs font-bold text-accent">{p.project || '—'}</span>
               </td>
               <td className="px-3 py-2 md:px-5 md:py-3">
                <span className={`text-[9px] md:text-[11px] font-bold px-1.5 py-0.5 md:px-2.5 md:py-1 rounded-lg capitalize ${p.status === 'disponible' ? 'bg-emerald-500/10 text-emerald-500' : p.status === 'reservado' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>{p.status}</span>
               </td>
               <td className="px-3 py-2 md:px-5 md:py-3 text-right">
                <div className="text-[10px] md:text-xs font-black text-content">{p.currency} {Number(p.price).toLocaleString()}</div>
               </td>
               <td className="px-3 py-2 md:px-5 md:py-3 text-right">
                <span className="text-[10px] md:text-xs font-bold text-content-muted">{p.area ? `${p.area} m²` : '—'}</span>
               </td>
               <td className="px-3 py-2 md:px-5 md:py-3 hidden lg:table-cell">
                <div className="flex items-center gap-1.5 max-w-[200px]">
                 <MapPin size={12} className="shrink-0 text-accent/60" />
                 <span className="text-[10px] md:text-xs text-content-muted truncate">{p.location || '—'}</span>
                </div>
               </td>
               <td className="px-3 py-2 md:px-5 md:py-3 hidden xl:table-cell">
                <div className="flex flex-col gap-1.5">
                 {isBuilding && (
                  <div className="flex gap-1.5 flex-wrap">
                   {p.rooms && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">{p.rooms} hab</span>}
                   {p.bathrooms && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-500">{p.bathrooms} baños</span>}
                   {p.parking && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-500">{p.parking} est.</span>}
                   {p.floor && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500">P{p.floor}</span>}
                  </div>
                 )}
                 {(p.details || p.notes) && (
                   <p className="text-[10px] text-content-muted italic line-clamp-2 max-w-[200px]" title={p.details || p.notes}>"{p.details || p.notes}"</p>
                 )}
                </div>
               </td>
               <td className="px-3 py-2 md:px-5 md:py-3 text-right">
                <div className="flex justify-end gap-1">
                  <button onClick={() => { setFormData({...p, bathrooms: p.bathrooms || '', parking: p.parking || '', floor: p.floor || '', notes: p.details || p.notes || '', avatar: p.avatar || '', images: p.images || [], featured: p.featured ?? false, visible: p.visible ?? true}); setShowModal(true); }} className={`p-1.5 md:p-2 rounded-lg transition-all ${isDarkMode ? 'text-content-muted hover:text-accent hover:bg-surface-raised' : 'text-content-muted hover:text-accent hover:bg-slate-100'}`}><Edit2 size={14} /></button>
                  {(user?.role === 'propietario' || user?.role === 'administrador') && (
                    <button onClick={() => deleteProperty(p.id)} className="p-1.5 md:p-2 rounded-lg text-rose-400 hover:text-rose-50 hover:bg-rose-50 transition-all"><Trash2 size={14} /></button>
                  )}
                </div>
               </td>
             </tr>
            );
           })}
           {filteredProperties.length === 0 && (
            <tr><td colSpan={8} className="px-5 py-12 text-center text-content-muted text-sm font-bold">Sin propiedades registradas</td></tr>
           )}

         </tbody>
       </table>
      </div>
    )}

    {/* MODAL FORM */}
    {showModal && (
     <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
       <div className="w-full max-w-2xl rounded-xl border border-edge bg-surface overflow-hidden flex flex-col shadow-lg">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-edge flex justify-between items-center bg-surface-inset">
          <div>
           <h2 className="h2">{formData.id ? 'Editar propiedad' : 'Nueva propiedad'}</h2>
           <p className="label-text mt-0.5">Complete los detalles de la unidad</p>
          </div>
          <button onClick={() => setShowModal(false)} className="p-2 rounded-lg border border-edge text-content-muted hover:text-content transition-colors"><X size={18} /></button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 max-h-[70vh]">
           {/* Form Grid */}
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label-text mb-1.5 block">Nombre comercial</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej. Departamento Luxury 402" className={inputCls} />
            </div>
            <div>
              <label className="label-text mb-1.5 block">Proyecto</label>
              <select value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})} className={inputCls}>
                <option value="">Seleccione un proyecto...</option>
                {dbProjects.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label-text mb-1.5 block">Tipo de propiedad</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={inputCls}>
               <option value="departamento">Departamento</option>
               <option value="casa">Casa</option>
               <option value="terreno">Terreno</option>
               <option value="oficina">Oficina</option>
               <option value="local">Local comercial</option>
               <option value="deposito">Depósito</option>
               <option value="otros">Otros</option>
              </select>
            </div>
            <div>
              <label className="label-text mb-1.5 block">Precio de venta</label>
              <div className="flex gap-2">
               <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="input-field w-24">
                 <option value="USD">USD</option>
                 <option value="PEN">PEN</option>
                 <option value="MXN">MXN</option>
                 <option value="COP">COP</option>
               </select>
               <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={inputCls} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className="label-text mb-1.5 block">Estado de venta</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className={inputCls}>
               <option value="disponible">Disponible</option>
               <option value="reservado">Reservado</option>
               <option value="vendido">Vendido</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label-text mb-1.5 block">Ubicación / Dirección</label>
              <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className={inputCls} placeholder="Ej. Av. Larco 123, Miraflores" />
            </div>
            <div>
              <label className="label-text mb-1.5 block">Área total (m²)</label>
              <input type="number" value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className={inputCls} placeholder="0.00" />
            </div>
            {formData.type !== 'terreno' && formData.type !== 'deposito' && (
             <>
              <div>
                <label className="label-text mb-1.5 block">Habitaciones</label>
                <input type="number" value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Baños</label>
                <input type="number" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Estacionamientos</label>
                <input type="number" value={formData.parking} onChange={e => setFormData({...formData, parking: e.target.value})} className={inputCls} placeholder="0" />
              </div>
              <div>
                <label className="label-text mb-1.5 block">Piso / Nivel</label>
                <input type="text" value={formData.floor} onChange={e => setFormData({...formData, floor: e.target.value})} className={inputCls} placeholder="Ej. 4to piso" />
              </div>
             </>
            )}
            <div className="sm:col-span-2">
              <label className="label-text mb-1.5 block">Notas internas</label>
              <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Detalles adicionales..." className={inputCls + " resize-none h-24"} />
            </div>

            {/* OPCIONES DE PORTAL PÚBLICO */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-edge bg-surface-inset dark:bg-surface-raised cursor-pointer select-none">
                <input type="checkbox" checked={formData.featured || false} onChange={e => setFormData({...formData, featured: e.target.checked})} className="w-4 h-4 rounded border-edge text-accent focus:ring-0 cursor-pointer" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-content">Propiedad Destacada</span>
                  <span className="text-[9px] text-content-muted">Mostrar en el inicio del portal</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl border border-edge bg-surface-inset dark:bg-surface-raised cursor-pointer select-none">
                <input type="checkbox" checked={formData.visible !== false} onChange={e => setFormData({...formData, visible: e.target.checked})} className="w-4 h-4 rounded border-edge text-accent focus:ring-0 cursor-pointer" />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-content">Visible en la Web</span>
                  <span className="text-[9px] text-content-muted">Mostrar en el portal público</span>
                </div>
              </label>
            </div>

            {/* ADVERTENCIA DE LÍMITE DE DESTACADAS */}
            {formData.featured && properties.filter(p => p.featured && p.id !== formData.id).length >= 8 && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-2">
                <Info size={14} className="shrink-0" />
                <span>Atención: Ya tienes {properties.filter(p => p.featured && p.id !== formData.id).length} propiedades destacadas en el portal. Se recomienda un máximo de 8 para una óptima visualización en la página principal.</span>
              </div>
            )}
           </div>

          {/* Images Section */}
          <div className="flex flex-col sm:flex-row gap-6 items-start pt-6 border-t border-edge">
           <div className="space-y-2 shrink-0">
             <label className="label-text">Logo / Principal</label>
             <div onClick={() => !uploadingImage && fileInputRef.current?.click()} className="w-24 h-24 rounded-xl border-2 border-dashed border-edge flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors overflow-hidden">
               {uploadingImage ? <span className="text-[10px] text-content-muted">Subiendo...</span> : formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> : <Upload size={20} className="text-content-muted" />}
             </div>
             <input type="file" ref={fileInputRef} className="hidden" onChange={e => handleImageUpload(e, true)} />
           </div>
           <div className="space-y-2 flex-1">
             <label className="label-text">Galería (máx 3 fotos)</label>
             <div className="flex flex-wrap gap-3">
              {formData.images.map((img, i) => (
               <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative border border-edge group">
                 <img src={img} className="w-full h-full object-cover" />
                 <button onClick={() => setFormData(prev => ({...prev, images: prev.images.filter((_, idx) => idx !== i)}))} className="absolute top-1 right-1 p-1 bg-red-500 text-content rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
               </div>
              ))}
              {formData.images.length < 3 && (
                <div onClick={() => !uploadingImage && multipleFileInputRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-edge flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors">
                  {uploadingImage ? <span className="text-[9px] text-content-muted">Subiendo...</span> : <ImageIcon size={20} className="text-content-muted" />}
                </div>
              )}
             </div>
             <input type="file" ref={multipleFileInputRef} multiple className="hidden" onChange={e => handleImageUpload(e, false)} />
           </div>
          </div>

          {/* GUÍA DE OPTIMIZACIÓN DE IMÁGENES Y CONFIGURACIÓN DEL PORTAL */}
          <div className="mt-6 p-4 rounded-xl border border-edge bg-surface-inset dark:bg-surface-raised space-y-3">
            <div className="flex items-center gap-2 text-accent">
              <Info size={16} className="shrink-0" />
              <h4 className="text-xs font-black uppercase tracking-wider">Guía de Configuración e Imágenes para el Portal</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px] leading-relaxed">
              <div className="space-y-1.5 text-left">
                <p className="font-bold text-content">1. Configuración de Visualización:</p>
                <ul className="list-disc pl-4 space-y-1 text-content-secondary font-medium">
                  <li><strong>Visible en la Web:</strong> Activa esta opción para que el inmueble se liste en el catálogo público del portal.</li>
                  <li><strong>Propiedad Destacada:</strong> Activa esta opción si deseas que se muestre en la página de inicio principal (carrusel inicial).</li>
                </ul>
              </div>

              <div className="space-y-1.5 text-left">
                <p className="font-bold text-content">2. Optimización de Archivos desde la PC:</p>
                <ul className="list-disc pl-4 space-y-1 text-content-secondary font-medium">
                  <li><strong>Formatos Soportados:</strong> Solo se permiten formatos <strong>JPG, JPEG, PNG y WebP</strong>.</li>
                  <li><strong>Foto Principal:</strong> Recomendado tamaño de <strong>800 x 600 px (relación 4:3)</strong> o similar.</li>
                  <li><strong>Galería:</strong> Recomendado tamaño de <strong>1200 x 800 px (relación 3:2)</strong>. Máximo 3 fotos.</li>
                  <li><strong>Peso Máximo:</strong> Recomendado menos de <strong>1.5 MB por imagen</strong> para garantizar cargas veloces en la web.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-edge flex items-center justify-end gap-3 bg-surface-inset">
          <button onClick={() => setShowModal(false)} className="text-sm font-medium text-content-muted hover:text-content px-3">Cancelar</button>
          <button onClick={handleSave} className="btn-primary">
           {formData.id ? 'Actualizar registro' : 'Guardar propiedad'}
          </button>
        </div>
       </div>
     </div>
    )}
   </div>
  </div>
 );
}
