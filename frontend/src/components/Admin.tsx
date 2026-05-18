import React, { useState, useEffect, useRef } from 'react';
import { Layers, Layout, Facebook, Instagram, Hash, Globe, Smartphone, Edit2, Trash2, Plus, X, Link, Settings, Database, Filter, Target, Users, Image as ImageIcon, Upload, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Admin = ({ isDarkMode }: { isDarkMode?: boolean }) => {
 const { token } = useAuth();
 const [tab, setTab] = useState('proyectos');
 const [modalType, setModalType] = useState<string | null>(null);
 const [projects, setProjects] = useState<any[]>([]);
 const [pipeline, setPipeline] = useState<any[]>([]);
 const [sources, setSources] = useState<any[]>([]);
 const [formData, setFormData] = useState<any>({});
 const [saving, setSaving] = useState(false);
 const projectImgRef = useRef<HTMLInputElement>(null);

 const handleProjectImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setFormData((prev: any) => ({
        ...prev, 
        images: [...(prev.images || []), reader.result as string].slice(0, 4)
      }));
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

 useEffect(() => {
  loadData();
 }, [tab]);

 const loadData = async () => {
  try {
   const headers = { Authorization: `Bearer ${token}` };
   if (tab === 'proyectos') {
    const res = await fetch(`${API_URL}/api/data/projects`, { headers });
    if(res.ok) setProjects(await res.json());
   } else if (tab === 'pipeline') {
    const res = await fetch(`${API_URL}/api/data/pipeline`, { headers });
    if(res.ok) setPipeline(await res.json());
   } else if (tab === 'fuentes') {
    const res = await fetch(`${API_URL}/api/data/sources`, { headers });
    if(res.ok) setSources(await res.json());
   }
  } catch (err) {}
 };

 const openModal = (type: string, item: any = null) => {
   if (item) {
    setFormData(item);
   } else {
    if (type === 'proyecto') setFormData({ name: '', developer: '', contact: '', phone: '', email: '', address: '', currency: 'PEN', status: 'Activo', notes: '', images: [] });
    else if (type === 'etapa') setFormData({ name: '', color: '#1649FF', visible: true });
    else if (type === 'fuente') setFormData({ name: '', icon: 'Globe', visible: true });
   }
  setModalType(type);
 };
 
 const closeModal = () => setModalType(null);

 const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  let endpoint = '';
  if (modalType === 'proyecto') endpoint = '/api/data/projects';
  if (modalType === 'etapa') endpoint = '/api/data/pipeline';
  if (modalType === 'fuente') endpoint = '/api/data/sources';

  const url = formData.id ? `${API_URL}${endpoint}/${formData.id}` : `${API_URL}${endpoint}`;
  const method = formData.id ? 'PUT' : 'POST';

  try {
   const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(formData)
   });
   if (res.ok) {
    closeModal();
    loadData();
   }
  } catch (err) {} finally {
   setSaving(false);
  }
 };

 const handleDelete = async (type: string, id: number) => {
  if (!window.confirm('¿Estás seguro de eliminar este elemento?')) return;
  let endpoint = '';
  if (type === 'proyecto') endpoint = '/api/data/projects';
  if (type === 'etapa') endpoint = '/api/data/pipeline';
  if (type === 'fuente') endpoint = '/api/data/sources';

  try {
   const res = await fetch(`${API_URL}${endpoint}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
   });
   if (res.ok) loadData();
  } catch (err) {}
 };

 const dc = isDarkMode;
 const card = `card p-4 md:p-6`;
 const input = `input-field py-1.5 h-9 text-[11px]`;
 const label = "text-[10px] font-bold text-content-muted mb-1 block ml-1 uppercase tracking-tight";

 return (
  <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-surface-base">
   <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
    
    {/* Menu Lateral Admin */}
    <div className="w-full lg:w-72 shrink-0 space-y-8">
     <div className="flex items-center gap-4">
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dc ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'}`}>
        <Settings size={24} />
       </div>
       <div>
        <h1 className={`text-xl font-semibold tracking-tight capitalize ${dc ? 'text-content' : 'text-content'}`}>Administración</h1>
        <p className="text-xs font-semibold uppercase tracking-normal text-content-muted">Configuración central</p>
       </div>
     </div>
     
     <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
      <MenuBtn active={tab === 'proyectos'} onClick={() => setTab('proyectos')} icon={<Layers size={18} />} label="Proyectos y desarrollos" dc={dc} />
      <MenuBtn active={tab === 'pipeline'} onClick={() => setTab('pipeline')} icon={<Target size={18} />} label="Etapas del pipeline" dc={dc} />
      <MenuBtn active={tab === 'fuentes'} onClick={() => setTab('fuentes')} icon={<Globe size={18} />} label="Fuentes de origen" dc={dc} />
     </div>
    </div>

    {/* Contenido Configuración */}
    <div className="flex-1 min-h-[600px]">

     {tab === 'proyectos' && (
      <div className="space-y-6">
       <Header tabTitle="Proyectos y desarrollos" desc="Gestiona los proyectos inmobiliarios disponibles para venta." onAdd={() => openModal('proyecto')} dc={dc} />
       <div className="card overflow-hidden">
        <table className="w-full text-left">
         <thead>
          <tr className={`text-[10px] font-bold text-content-muted border-b uppercase tracking-wider ${dc ? 'bg-surface-raised border-edge' : 'bg-surface-inset border-edge'}`}>
           <th className="px-6 py-4">Proyecto</th>
           <th className="px-6 py-4">Desarrollador / Contacto</th>
           <th className="px-6 py-4 text-center">Estado</th>
           <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
         </thead>
         <tbody className={`divide-y ${dc ? 'divide-edge' : 'divide-slate-100'}`}>
          {projects.length === 0 ? (
           <tr><td colSpan={4} className="px-6 py-10 text-center text-xs font-bold text-content-muted uppercase">No hay proyectos registrados</td></tr>
          ) : projects.map((p: any) => (
           <tr key={p.id} className="group hover:bg-surface-inset transition-colors">
            <td className="px-6 py-4">
             <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${dc ? 'bg-surface-raised text-content-muted' : 'bg-slate-100 text-content-muted'}`}>
               {p.images && p.images.length > 0 ? <img src={p.images[0]} className="w-full h-full object-cover" alt="" /> : <Database size={16} />}
              </div>
              <div className="flex flex-col">
               <span className="text-sm font-bold text-content">{p.name}</span>
               {p.images && p.images.length > 0 && (
                 <span className="text-[9px] font-bold text-accent flex items-center gap-1"><ImageIcon size={9} /> {p.images.length} foto{p.images.length > 1 ? 's' : ''}</span>
               )}
              </div>
             </div>
            </td>
            <td className="px-6 py-4">
             <div className="flex flex-col">
              <span className="text-xs font-semibold text-content">{p.developer || '—'}</span>
              <span className="text-[10px] text-content-muted">{p.contact || 'Sin contacto'}</span>
             </div>
            </td>
            <td className="px-6 py-4 text-center">
             <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tight ${p.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              {p.status || 'Activo'}
             </span>
            </td>
            <td className="px-6 py-4 text-right">
             <div className="flex justify-end gap-1">
              <button onClick={() => openModal('proyecto', {...p, images: p.images || []})} className="p-2 rounded-lg hover:bg-surface-raised text-accent transition-all active:scale-90"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete('proyecto', p.id)} className="p-2 rounded-lg hover:bg-surface-raised text-red-500 transition-all active:scale-90"><Trash2 size={14} /></button>
             </div>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </div>
     )}

     {tab === 'pipeline' && (
      <div className="space-y-6">
       <Header tabTitle="Etapas del pipeline" desc="Define los estados por los que pasan tus prospectos." onAdd={() => openModal('etapa')} dc={dc} />
       <div className="card overflow-hidden">
        <table className="w-full text-left">
         <thead>
          <tr className={`text-[10px] font-bold text-content-muted border-b uppercase tracking-wider ${dc ? 'bg-surface-raised border-edge' : 'bg-surface-inset border-edge'}`}>
           <th className="px-6 py-4">Etapa</th>
           <th className="px-6 py-4 text-center">Visibilidad</th>
           <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
         </thead>
         <tbody className={`divide-y ${dc ? 'divide-edge' : 'divide-slate-100'}`}>
          {pipeline.length === 0 ? (
           <tr><td colSpan={3} className="px-6 py-10 text-center text-xs font-bold text-content-muted uppercase">No hay etapas definidas</td></tr>
          ) : pipeline.map((p: any, index: number) => (
           <tr 
              key={p.id} 
              draggable 
              onDragStart={(e) => e.dataTransfer.setData('index', index.toString())}
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const fromIdx = parseInt(e.dataTransfer.getData('index'));
                const toIdx = index;
                if (fromIdx === toIdx) return;
                const newOrder = [...pipeline];
                const [moved] = newOrder.splice(fromIdx, 1);
                newOrder.splice(toIdx, 0, moved);
                setPipeline(newOrder);
                // Save new order to backend
                try {
                  const stagesToSave = newOrder.map((s, i) => ({ id: s.id, order: i + 1 }));
                  await fetch(`${API_URL}/api/data/pipeline/reorder`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ stages: stagesToSave })
                  });
                } catch (err) { console.error('Error saving order', err); }
              }}
              className="group hover:bg-surface-inset transition-colors cursor-move"
            >
            <td className="px-6 py-4">
             <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full border border-edge shrink-0" style={{ backgroundColor: p.color }}></div>
              <span className="text-sm font-bold text-content">{p.name}</span>
             </div>
            </td>
            <td className="px-6 py-4 text-center">
             <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tight ${p.visible !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-raised text-content-muted'}`}>
              {p.visible !== false ? 'visible' : 'oculto'}
             </span>
            </td>
            <td className="px-6 py-4 text-right">
             <div className="flex justify-end gap-1">
              <button onClick={() => openModal('etapa', p)} className="p-2 rounded-lg hover:bg-surface-raised text-accent transition-all active:scale-90"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete('etapa', p.id)} className="p-2 rounded-lg hover:bg-surface-raised text-red-500 transition-all active:scale-90"><Trash2 size={14} /></button>
             </div>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </div>
     )}

     {tab === 'fuentes' && (
      <div className="space-y-6">
       <Header tabTitle="Fuentes de origen" desc="Canales desde donde llegan tus clientes potenciales." onAdd={() => openModal('fuente')} dc={dc} />
       <div className="card overflow-hidden">
        <table className="w-full text-left">
         <thead>
          <tr className={`text-[10px] font-bold text-content-muted border-b uppercase tracking-wider ${dc ? 'bg-surface-raised border-edge' : 'bg-surface-inset border-edge'}`}>
           <th className="px-6 py-4">Fuente</th>
           <th className="px-6 py-4 text-center">Estado</th>
           <th className="px-6 py-4 text-right">Acciones</th>
          </tr>
         </thead>
         <tbody className={`divide-y ${dc ? 'divide-edge' : 'divide-slate-100'}`}>
          {sources.length === 0 ? (
           <tr><td colSpan={3} className="px-6 py-10 text-center text-xs font-bold text-content-muted uppercase">No hay fuentes configuradas</td></tr>
          ) : sources.map((s: any) => (
           <tr key={s.id} className="group hover:bg-surface-inset transition-colors">
            <td className="px-6 py-4">
             <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg border border-edge flex items-center justify-center shrink-0 ${dc ? 'bg-surface-raised' : 'bg-white shadow-sm'}`}>
               {renderIcon(s.icon, dc)}
              </div>
              <span className="text-sm font-bold text-content">{s.name}</span>
             </div>
            </td>
            <td className="px-6 py-4 text-center">
             <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tight ${s.visible !== false ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-raised text-content-muted'}`}>
              {s.visible !== false ? 'activa' : 'inactiva'}
             </span>
            </td>
            <td className="px-6 py-4 text-right">
             <div className="flex justify-end gap-1">
              <button onClick={() => openModal('fuente', s)} className="p-2 rounded-lg hover:bg-surface-raised text-accent transition-all active:scale-90"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete('fuente', s.id)} className="p-2 rounded-lg hover:bg-surface-raised text-red-500 transition-all active:scale-90"><Trash2 size={14} /></button>
             </div>
            </td>
           </tr>
          ))}
         </tbody>
        </table>
       </div>
      </div>
     )}
    </div>
   </div>

   {/* Modal Genérico Standardized */}
   {modalType && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
     <div className="card w-full max-w-xl p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar">
      <button onClick={closeModal} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-inset transition-colors"><X size={18} className="text-content-muted" /></button>
      
      <h3 className="text-md font-bold text-content mb-4">Añadir {modalType}</h3>
      
      <form onSubmit={handleSave} className="space-y-5">
       {modalType === 'proyecto' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="md:col-span-2">
          <label className={label}>Nombre del proyecto</label>
          <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={input} placeholder="Torre Esmeralda..." />
         </div>
         <div>
          <label className={label}>Desarrollador</label>
          <input type="text" value={formData.developer || ''} onChange={e => setFormData({...formData, developer: e.target.value})} className={input} placeholder="Constructora ABC..." />
         </div>
         <div>
          <label className={label}>Contacto principal</label>
          <input type="text" value={formData.contact || ''} onChange={e => setFormData({...formData, contact: e.target.value})} className={input} placeholder="Nombre del contacto..." />
         </div>
         <div>
          <label className={label}>Teléfono</label>
          <input type="text" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className={input} placeholder="+51 999..." />
         </div>
         <div>
          <label className={label}>Email</label>
          <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className={input} placeholder="correo@ejemplo.com" />
         </div>
         <div className="md:col-span-2">
          <label className={label}>Dirección</label>
          <input type="text" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} className={input} placeholder="Av. Principal 123..." />
         </div>
         <div>
          <label className={label}>Tipo de moneda de venta</label>
          <select value={formData.currency || 'PEN'} onChange={e => setFormData({...formData, currency: e.target.value})} className={input}>
           <option value="PEN">Soles (S/)</option>
           <option value="USD">Dólares ($)</option>
          </select>
         </div>
         <div>
          <label className={label}>Estado</label>
          <select value={formData.status || 'Activo'} onChange={e => setFormData({...formData, status: e.target.value})} className={input}>
           <option value="Activo">Activo</option>
           <option value="Inactivo">Inactivo</option>
          </select>
         </div>
         <div className="md:col-span-2">
          <label className={label}>Notas</label>
          <textarea value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className={`${input} h-14 resize-none`} placeholder="Información adicional..."></textarea>
         </div>

         {/* Galería de Imágenes del Proyecto (hasta 4) */}
         <div className="md:col-span-2 pt-4 border-t border-edge">
          <label className={label}>Fotos del proyecto (máx. 4) — El chatbot las enviará automáticamente</label>
          <div className="flex flex-wrap gap-3 mt-2">
           {(formData.images || []).map((img: string, i: number) => (
             <div key={i} className="w-20 h-20 rounded-xl overflow-hidden relative border border-edge group">
               <img src={img} className="w-full h-full object-cover" alt={`Foto ${i+1}`} />
               <button type="button" onClick={() => setFormData((prev: any) => ({...prev, images: prev.images.filter((_: string, idx: number) => idx !== i)}))} className="absolute top-1 right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
               <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[8px] text-center font-bold py-0.5">{i+1}/4</div>
             </div>
           ))}
           {(formData.images || []).length < 4 && (
             <div onClick={() => projectImgRef.current?.click()} className="w-20 h-20 rounded-xl border-2 border-dashed border-edge flex flex-col items-center justify-center cursor-pointer hover:border-accent/50 transition-colors gap-1">
               <ImageIcon size={18} className="text-content-muted" />
               <span className="text-[8px] font-bold text-content-muted">Agregar</span>
             </div>
           )}
          </div>
          <input type="file" ref={projectImgRef} multiple accept="image/*" className="hidden" onChange={handleProjectImageUpload} />
          <p className="text-[9px] text-content-muted mt-2">Estas fotos se enviarán por WhatsApp cuando un lead pida imágenes del proyecto (ideal para terrenos).</p>
         </div>
        </div>
       )}

       {modalType === 'etapa' && (
        <div className="space-y-5">
         <div>
          <label className={label}>Nombre de la etapa</label>
          <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={input} placeholder="Ej. Contactado" />
         </div>
         <div className="grid grid-cols-2 gap-4 items-end">
          <div>
           <label className={label}>Color distintivo</label>
           <div className="flex gap-2 items-center">
            <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-edge shrink-0">
             <input type="color" value={formData.color || '#1649FF'} onChange={e => setFormData({...formData, color: e.target.value})} className="absolute -top-4 -left-4 w-16 h-16 cursor-pointer border-none p-0" />
            </div>
            <input type="text" value={formData.color || '#1649FF'} onChange={e => setFormData({...formData, color: e.target.value})} className={input + ' font-mono uppercase'} />
           </div>
          </div>
          <div className="flex items-center gap-3 h-9 bg-surface-inset dark:bg-surface-raised px-4 rounded-xl border border-edge">
           <input type="checkbox" className="w-4 h-4 rounded-md border-2 border-accent text-accent focus:ring-0" checked={formData.visible !== false} onChange={e => setFormData({...formData, visible: e.target.checked})} />
           <span className="text-[10px] font-bold text-content-secondary uppercase tracking-tight">Visible en kanban</span>
          </div>
         </div>
        </div>
       )}

       {modalType === 'fuente' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
         <div className="md:col-span-2">
          <label className={label}>Nombre de la fuente</label>
          <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={input} placeholder="Facebook Ads..." />
         </div>
         <div>
          <label className={label}>Icono representativo</label>
          <select value={formData.icon || 'Globe'} onChange={e => setFormData({...formData, icon: e.target.value})} className={input}>
           <option value="Globe">Web / Globo</option>
           <option value="Facebook">Facebook</option>
           <option value="Instagram">Instagram</option>
           <option value="Smartphone">WhatsApp / Móvil</option>
           <option value="Target">Publicidad / Ads</option>
          </select>
         </div>
         <div className="flex items-center gap-3 h-9 bg-surface-inset dark:bg-surface-raised px-4 rounded-xl border border-edge mt-5">
           <input type="checkbox" className="w-4 h-4 rounded-md border-2 border-accent text-accent focus:ring-0" checked={formData.visible !== false} onChange={e => setFormData({...formData, visible: e.target.checked})} />
           <span className="text-[10px] font-bold text-content-secondary uppercase tracking-tight">Fuente activa</span>
         </div>
        </div>
       )}

       <div className="pt-4 flex gap-3">
        <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-edge text-content-muted hover:bg-surface-inset transition-colors">Cancelar</button>
        <button type="submit" disabled={saving} className="flex-1 btn-primary py-2.5 disabled:opacity-50">
         {saving ? 'guardando...' : 'guardar cambios'}
        </button>
       </div>
      </form>
     </div>
    </div>
   )}
  </div>
 );
};

const Header = ({ tabTitle, desc, onAdd, dc }: any) => (
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
  <div>
   <h2 className="h2">{tabTitle}</h2>
   <p className="body-text text-sm mt-0.5">{desc}</p>
  </div>
  <button onClick={onAdd} className="btn-primary flex items-center gap-2">
   <Plus size={18} /> añadir nuevo
  </button>
 </div>
);

const MenuBtn = ({ active, onClick, icon, label, dc }: any) => (
 <button onClick={onClick} className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium whitespace-nowrap ${active ? 'bg-accent text-content' : 'text-content-muted hover:text-content hover:bg-surface-inset'}`}>
  <span>{icon}</span> {label}
 </button>
);

const renderIcon = (iconStr: string, dc: boolean) => {
 switch (iconStr) {
  case 'Facebook': return <Facebook className="text-blue-600" size={20} />;
  case 'Instagram': return <Instagram className="text-pink-600" size={20} />;
  case 'Smartphone': return <Smartphone className={dc ? 'text-content-muted' : 'text-content'} size={20} />;
  case 'Globe': return <Globe className="text-emerald-600" size={20} />;
  case 'Users': return <Users className="text-indigo-500" size={20} />;
  case 'Hash': return <Hash className="text-content-secondary" size={20} />;
  case 'Link': return <Link className="text-sky-500" size={20} />;
  case 'Target': return <Target className="text-red-500" size={20} />;
  default: return <Globe className="text-content-muted" size={20} />;
 }
};

export default Admin;
