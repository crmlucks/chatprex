import React, { useState, useEffect, useRef } from 'react';
import { Home, Building2, Map, LayoutGrid, LayoutList, Search, Plus, Filter, MapPin, X, Edit2, Trash2, Upload, XCircle, Image as ImageIcon, DollarSign, Tag, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Properties({ isDarkMode }: { isDarkMode?: boolean }) {
 const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
 const [filterType, setFilterType] = useState('todos');
 const [filterProject, setFilterProject] = useState('todos');
 const [filterStatus, setFilterStatus] = useState('todos');
 const [showFilters, setShowFilters] = useState(false);
 const [search, setSearch] = useState('');
 const [properties, setProperties] = useState<any[]>([]);
 const [dbProjects, setDbProjects] = useState<any[]>([]);
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
      
      {/* View Toggle - moved to header like in Leads */}
      <div className={`hidden md:flex p-1 rounded-xl ${isDarkMode ? 'bg-surface-raised' : 'bg-surface-inset border border-edge '}`}>
       <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? (isDarkMode ? 'bg-accent text-content shadow-lg' : 'bg-accent text-content shadow-md') : 'text-content-muted hover:text-content-secondary'}`}><LayoutGrid size={16} /></button>
       <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? (isDarkMode ? 'bg-accent text-content shadow-lg' : 'bg-accent text-content shadow-md') : 'text-content-muted hover:text-content-secondary'}`}><LayoutList size={16} /></button>
      </div>
     </div>

     {/* Right side: Search, Filters, Add Button */}
     <div className="flex items-center justify-between gap-3 w-full md:w-auto">
      <div className="relative w-1/2 md:w-64 shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" size={14} />
        <input type="text" placeholder="Buscar propiedad..." value={search} onChange={e => setSearch(e.target.value)} className={`pl-9 pr-4 py-2.5 rounded-xl border text-xs font-medium outline-none transition-all w-full ${isDarkMode ? 'bg-surface-raised border-edge text-content focus:border-accent' : 'bg-surface border-edge focus:border-accent shadow-sm'}`} />
      </div>
      
      <div className="flex items-center gap-2 ml-auto shrink-0">
       <button onClick={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-xl border transition-colors ${showFilters ? 'bg-accent text-content border-accent shadow-sm' : 'bg-surface border-edge text-content-muted hover:text-content'}`}>
        <Filter size={16} />
       </button>
       <button onClick={() => { resetForm(); setShowModal(true); }} className="btn-primary flex items-center justify-center shrink-0 w-11 h-11 md:w-auto md:h-auto md:px-4 md:py-2.5 gap-2">
        <Plus size={16} />
        <span className="hidden md:inline">Agregar propiedad</span>
       </button>
      </div>
     </div>
    </div>

    {/* Main Content Area */}
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
     
     {/* Mobile View Toggle */}
     <div className="md:hidden flex justify-end mb-4">
      <div className={`flex p-1 rounded-xl ${isDarkMode ? 'bg-surface-raised' : 'bg-surface-inset border border-edge '}`}>
       <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? (isDarkMode ? 'bg-accent text-content shadow-sm' : 'bg-surface text-content shadow-sm') : 'text-content-muted'}`}><LayoutGrid size={16} /></button>
       <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? (isDarkMode ? 'bg-accent text-content shadow-sm' : 'bg-surface text-content shadow-sm') : 'text-content-muted'}`}><LayoutList size={16} /></button>
      </div>
     </div>
      
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

    {/* Grid View */}
    {viewMode === 'grid' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
       {filteredProperties.map(p => (
        <div key={p.id} className="card group overflow-hidden flex flex-col h-full">
          <div className="h-48 relative overflow-hidden shrink-0">
           <img src={p.images?.[0] || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800'} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
           <div className="absolute top-3 left-3">
             <span className={`text-xs font-medium px-2 py-1 rounded-md border ${p.status === 'disponible' ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30' : 'bg-red-500/20 text-red-600 border-red-500/30'}`}>{p.status}</span>
           </div>
           <div className="absolute bottom-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={() => { setFormData(p); setShowModal(true); }} className="w-8 h-8 rounded-lg bg-surface/80 text-content flex items-center justify-center hover:bg-accent hover:text-content transition-colors"><Edit2 size={14} /></button>
             <button onClick={() => deleteProperty(p.id)} className="w-8 h-8 rounded-lg bg-red-500 text-content flex items-center justify-center hover:bg-red-600 transition-colors"><Trash2 size={14} /></button>
           </div>
          </div>
          <div className="p-4 flex flex-col flex-1 space-y-3">
           <div>
             <h3 className="font-medium text-sm text-content truncate">{p.name}</h3>
             <div className="flex items-center gap-1.5 text-content-muted mt-1">
              <MapPin size={12} className="shrink-0 text-accent/60" />
              <span className="text-xs truncate">{p.location || 'Sin ubicación'}</span>
             </div>
           </div>
           <div className="flex justify-between items-center pt-3 border-t border-edge mt-auto">
             <span className="text-base font-semibold text-accent">{p.currency} {p.price}</span>
             <span className="text-xs text-content-muted">{p.area} m²</span>
           </div>
          </div>
        </div>
       ))}
      </div>
    )}

    {/* List View */}
    {viewMode === 'list' && (
      <div className="card overflow-hidden overflow-x-auto">
       <table className="w-full text-left">
         <thead>
          <tr className="text-xs font-medium text-content-muted border-b border-edge bg-surface-inset">
            <th className="px-5 py-3">Propiedad</th>
            <th className="px-5 py-3">Proyecto / Desarrollador</th>
            <th className="px-5 py-3 text-right">Precio</th>
            <th className="px-5 py-3">Estado</th>
            <th className="px-5 py-3 text-right">Acciones</th>
          </tr>
         </thead>
         <tbody className="divide-y divide-edge">
          {filteredProperties.map(p => (
           <tr key={p.id} className="hover:bg-surface-inset transition-colors group">
             <td className="px-5 py-3">
              <div className="flex items-center gap-3">
                <img src={p.avatar || 'https://via.placeholder.com/80'} className="w-10 h-10 rounded-lg object-cover border border-edge" alt="" />
                <div>
                 <div className="font-medium text-sm text-content">{p.name}</div>
                 <div className="text-xs text-content-muted mt-0.5">{p.type} • {p.area} m²</div>
                </div>
              </div>
             </td>
             <td className="px-5 py-3">
              <div className="text-xs font-medium text-accent">{p.project}</div>
              <div className="text-xs text-content-muted mt-0.5">{p.developer}</div>
             </td>
             <td className="px-5 py-3 text-right">
              <div className="text-sm font-semibold text-emerald-500">{p.currency} {p.price}</div>
             </td>
             <td className="px-5 py-3">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${p.status === 'disponible' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{p.status}</span>
             </td>
             <td className="px-5 py-3 text-right">
              <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setFormData(p); setShowModal(true); }} className="p-1.5 rounded-lg border border-edge text-content-muted hover:text-accent transition-colors"><Edit2 size={14} /></button>
                <button onClick={() => deleteProperty(p.id)} className="p-1.5 rounded-lg border border-edge text-red-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
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
             <label className="label-text mb-1.5 block">Desarrollador</label>
             <select value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} className={inputCls}>
               <option value="">Seleccione un desarrollador...</option>
               {uniqueDevelopers.map(d => <option key={d as string} value={d as string}>{d}</option>)}
             </select>
           </div>
           <div>
             <label className="label-text mb-1.5 block">RUC / ID fiscal</label>
             <input type="text" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} className={inputCls} placeholder="20601234567" />
           </div>
           <div>
             <label className="label-text mb-1.5 block">Tipo de propiedad</label>
             <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className={inputCls}>
              <option value="departamento">Departamento</option>
              <option value="casa">Casa</option>
              <option value="terreno">Terreno</option>
              <option value="oficina">Oficina</option>
              <option value="deposito">Depósito</option>
              <option value="otros">Otros</option>
             </select>
           </div>
           <div>
             <label className="label-text mb-1.5 block">Teléfono de contacto</label>
             <input type="tel" value={formData.contactNumber} onChange={e => setFormData({...formData, contactNumber: e.target.value})} className={inputCls} placeholder="+51 900 000 000" />
           </div>
           <div>
             <label className="label-text mb-1.5 block">Email de contacto</label>
             <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputCls} placeholder="ventas@inmobiliaria.com" />
           </div>
           <div>
             <label className="label-text mb-1.5 block">Precio de venta</label>
             <div className="flex gap-2">
              <select value={formData.currency} onChange={e => setFormData({...formData, currency: e.target.value})} className="input-field w-24">
                <option value="USD">USD</option>
                <option value="PEN">PEN</option>
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
           <div>
             <label className="label-text mb-1.5 block">Habitaciones</label>
             <input type="number" value={formData.rooms} onChange={e => setFormData({...formData, rooms: e.target.value})} className={inputCls} placeholder="0" />
           </div>
           <div className="sm:col-span-2">
             <label className="label-text mb-1.5 block">Notas internas</label>
             <textarea rows={3} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Detalles adicionales..." className={inputCls + " resize-none h-24"} />
           </div>
          </div>

          {/* Images Section */}
          <div className="flex flex-col sm:flex-row gap-6 items-start pt-6 border-t border-edge">
           <div className="space-y-2 shrink-0">
             <label className="label-text">Logo / Principal</label>
             <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-xl border-2 border-dashed border-edge flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors overflow-hidden">
              {formData.avatar ? <img src={formData.avatar} className="w-full h-full object-cover" /> : <Upload size={20} className="text-content-muted" />}
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
                <div onClick={() => multipleFileInputRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-edge flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors">
                 <ImageIcon size={20} className="text-content-muted" />
                </div>
              )}
             </div>
             <input type="file" ref={multipleFileInputRef} multiple className="hidden" onChange={e => handleImageUpload(e, false)} />
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
