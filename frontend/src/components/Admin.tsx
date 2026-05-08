import React, { useState, useEffect } from 'react';
import { Layers, Layout, Facebook, Instagram, Hash, Globe, Smartphone, Edit2, Trash2, Plus, X, Link, Settings, Database, Filter, Target } from 'lucide-react';
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
      if (type === 'proyecto') setFormData({ name: '', code: '', status: 'Activo' });
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
  const card = `rounded-[32px] border transition-all ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'}`;
  const input = `w-full px-5 py-3 rounded-2xl text-[13px] font-bold outline-none border transition-all ${dc ? 'bg-slate-900 border-slate-800 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary focus:bg-white shadow-inner'}`;
  const label = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block";

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 transition-colors ${dc ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
        
        {/* Menu Lateral Admin */}
        <div className="w-full lg:w-72 shrink-0 space-y-8">
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dc ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                <Settings size={24} />
             </div>
             <div>
                <h1 className={`text-xl font-black tracking-tight lowercase ${dc ? 'text-white' : 'text-slate-800'}`}>Administración</h1>
                <p className="text-[9px] font-black uppercase tracking-[2px] text-slate-500">configuración central</p>
             </div>
          </div>
          
          <div className="flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
            <MenuBtn active={tab === 'proyectos'} onClick={() => setTab('proyectos')} icon={<Layers size={18} />} label="proyectos y desarrollos" dc={dc} />
            <MenuBtn active={tab === 'pipeline'} onClick={() => setTab('pipeline')} icon={<Target size={18} />} label="etapas del pipeline" dc={dc} />
            <MenuBtn active={tab === 'fuentes'} onClick={() => setTab('fuentes')} icon={<Globe size={18} />} label="fuentes de origen" dc={dc} />
          </div>
        </div>

        {/* Contenido Configuración */}
        <div className={`flex-1 min-h-[600px] animate-in fade-in slide-in-from-right-4 duration-500`}>

          {tab === 'proyectos' && (
            <div className="space-y-8">
              <Header tabTitle="proyectos y desarrollos" desc="Gestiona los proyectos inmobiliarios disponibles para venta." onAdd={() => openModal('proyecto')} dc={dc} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.length === 0 ? (
                  <div className={`col-span-2 text-center py-20 ${dc ? 'text-slate-600' : 'text-slate-400'} font-bold lowercase`}>no hay proyectos registrados</div>
                ) : projects.map((p: any) => (
                  <ProjectCard key={p.id} project={p} onEdit={() => openModal('proyecto', p)} onDelete={() => handleDelete('proyecto', p.id)} dc={dc} />
                ))}
              </div>
            </div>
          )}

          {tab === 'pipeline' && (
            <div className="space-y-8">
              <Header tabTitle="etapas del pipeline" desc="Define los estados por los que pasan tus prospectos." onAdd={() => openModal('etapa')} dc={dc} />
              <div className={card + ' p-8'}>
                <div className={`divide-y ${dc ? 'divide-slate-800' : 'divide-slate-50'}`}>
                  {pipeline.map((p: any) => (
                    <PipelineRow key={p.id} pipeline={p} onEdit={() => openModal('etapa', p)} onDelete={() => handleDelete('etapa', p.id)} dc={dc} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'fuentes' && (
            <div className="space-y-8">
              <Header tabTitle="fuentes de origen" desc="Canales desde donde llegan tus clientes potenciales." onAdd={() => openModal('fuente')} dc={dc} />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {sources.map((s: any) => (
                  <SourceCard key={s.id} source={s} onEdit={() => openModal('fuente', s)} onDelete={() => handleDelete('fuente', s.id)} dc={dc} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Genérico Standardized */}
      {modalType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className={card + ' w-full max-w-xl p-10 relative'}>
            <button onClick={closeModal} className="absolute top-8 right-8 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><X size={20} className="text-slate-400" /></button>
            
            <h3 className={`text-xl font-black lowercase mb-10 ${dc ? 'text-white' : 'text-slate-800'}`}>añadir {modalType}</h3>
            
            <form onSubmit={handleSave} className="space-y-8">
              {modalType === 'proyecto' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className={label}>nombre del proyecto</label>
                    <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={input} placeholder="Torre Esmeralda..." />
                  </div>
                  <div>
                    <label className={label}>código interno</label>
                    <input type="text" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} className={input} placeholder="PRJ-001" />
                  </div>
                  <div>
                    <label className={label}>estado inicial</label>
                    <select value={formData.status || 'Activo'} onChange={e => setFormData({...formData, status: e.target.value})} className={input}>
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>
              )}

              {modalType === 'etapa' && (
                <div className="space-y-8">
                  <div>
                    <label className={label}>nombre de la etapa</label>
                    <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={input} placeholder="Ej. Contactado" />
                  </div>
                  <div className="grid grid-cols-2 gap-8 items-end">
                    <div>
                      <label className={label}>color distintivo</label>
                      <div className="flex gap-4">
                        <input type="color" value={formData.color || '#1649FF'} onChange={e => setFormData({...formData, color: e.target.value})} className="h-14 w-14 rounded-2xl p-0 cursor-pointer border-none" />
                        <input type="text" value={formData.color || '#1649FF'} onChange={e => setFormData({...formData, color: e.target.value})} className={input + ' font-mono'} />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 h-14 bg-slate-50 dark:bg-slate-900 px-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-primary text-primary focus:ring-0" checked={formData.visible !== false} onChange={e => setFormData({...formData, visible: e.target.checked})} />
                      <span className={`text-[11px] font-black lowercase ${dc ? 'text-slate-300' : 'text-slate-700'}`}>visible en kanban</span>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'fuente' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className={label}>nombre de la fuente</label>
                    <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={input} placeholder="Facebook Ads..." />
                  </div>
                  <div>
                    <label className={label}>icono representativo</label>
                    <select value={formData.icon || 'Globe'} onChange={e => setFormData({...formData, icon: e.target.value})} className={input}>
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Smartphone">Smartphone</option>
                      <option value="Globe">Web / Globo</option>
                      <option value="Users">Referido</option>
                      <option value="Hash">Hashtag</option>
                      <option value="Link">Enlace Directo</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-4 h-14 bg-slate-50 dark:bg-slate-900 px-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <input type="checkbox" className="w-5 h-5 rounded-lg border-2 border-primary text-primary focus:ring-0" checked={formData.visible !== false} onChange={e => setFormData({...formData, visible: e.target.checked})} />
                    <span className={`text-[11px] font-black lowercase ${dc ? 'text-slate-300' : 'text-slate-700'}`}>fuente activa</span>
                  </div>
                </div>
              )}

              <div className="pt-6 flex gap-4">
                <button type="button" onClick={closeModal} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${dc ? 'border-slate-800 text-slate-500 hover:bg-slate-800' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 bg-primary text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all disabled:opacity-50">
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
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
    <div>
      <h2 className={`text-xl font-black tracking-tight lowercase ${dc ? 'text-slate-100' : 'text-slate-800'}`}>{tabTitle}</h2>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{desc}</p>
    </div>
    <button onClick={onAdd} className="bg-primary text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 flex items-center gap-3">
      <Plus size={18} /> añadir nuevo
    </button>
  </div>
);

const MenuBtn = ({ active, onClick, icon, label, dc }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all text-[12px] font-black lowercase whitespace-nowrap active:scale-95 ${active ? 'bg-primary text-white shadow-2xl shadow-primary/30' : (dc ? 'text-slate-500 hover:bg-slate-800 hover:text-white' : 'text-slate-400 hover:bg-white border border-transparent hover:border-slate-200 shadow-sm')}`}>
    <span className={active ? 'scale-110' : ''}>{icon}</span> {label}
  </button>
);

const ProjectCard = ({ project, onEdit, onDelete, dc }: any) => (
  <div className={`p-8 rounded-[32px] border transition-all hover:shadow-2xl hover:-translate-y-1 ${dc ? 'bg-[#1E1E1E] border-slate-800 hover:border-primary/40' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/20 hover:border-primary/20'}`}>
    <div className="flex justify-between items-start mb-6">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dc ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
        <Database size={24} />
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className={`p-2.5 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-slate-100 text-blue-500'}`}><Edit2 size={16} /></button>
        <button onClick={onDelete} className={`p-2.5 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800 text-rose-400' : 'hover:bg-slate-100 text-rose-500'}`}><Trash2 size={16} /></button>
      </div>
    </div>
    <h4 className={`text-[15px] font-black lowercase mb-2 ${dc ? 'text-slate-200' : 'text-slate-800'}`}>{project.name}</h4>
    <div className="flex items-center justify-between mt-6">
       <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{project.code}</span>
       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${project.status === 'Activo' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
          {project.status || 'Activo'}
       </span>
    </div>
  </div>
);

const PipelineRow = ({ pipeline, onEdit, onDelete, dc }: any) => (
  <div className="flex items-center justify-between py-6 group transition-all">
    <div className="flex items-center gap-6">
      <div className="w-5 h-5 rounded-full shadow-lg border-2 border-white dark:border-slate-800" style={{ backgroundColor: pipeline.color }}></div>
      <span className={`text-[13px] font-black lowercase ${dc ? 'text-slate-300' : 'text-slate-800'}`}>{pipeline.name}</span>
    </div>
    <div className="flex items-center gap-8">
      <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${pipeline.visible !== false ? (dc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-600') : (dc ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500')}`}>
        {pipeline.visible !== false ? 'visible' : 'oculto'}
      </span>
      <div className="flex gap-2">
        <button onClick={onEdit} className={`p-2 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-slate-100 text-blue-500'}`}><Edit2 size={16} /></button>
        <button onClick={onDelete} className={`p-2 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800 text-rose-400' : 'hover:bg-slate-100 text-rose-500'}`}><Trash2 size={16} /></button>
      </div>
    </div>
  </div>
);

const SourceCard = ({ source, onEdit, onDelete, dc }: any) => (
  <div className={`p-6 rounded-[28px] border transition-all hover:shadow-2xl ${dc ? 'bg-[#1E1E1E] border-slate-800 hover:border-primary/40' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/20 hover:border-primary/20'}`}>
    <div className="flex items-center justify-between mb-6">
      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors ${dc ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
        {renderIcon(source.icon, dc)}
      </div>
      <div className="flex gap-1">
        <button onClick={onEdit} className={`p-2 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-slate-100 text-blue-500'}`}><Edit2 size={14} /></button>
        <button onClick={onDelete} className={`p-2 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800 text-rose-400' : 'hover:bg-slate-100 text-rose-500'}`}><Trash2 size={14} /></button>
      </div>
    </div>
    <h4 className={`text-[13px] font-black lowercase ${dc ? 'text-slate-200' : 'text-slate-800'}`}>{source.name}</h4>
    <div className="mt-4">
       <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${source.visible !== false ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-400/10'}`}>
          {source.visible !== false ? 'activa' : 'inactiva'}
       </span>
    </div>
  </div>
);

const renderIcon = (iconStr: string, dc: boolean) => {
  switch (iconStr) {
    case 'Facebook': return <Facebook className="text-blue-600" size={20} />;
    case 'Instagram': return <Instagram className="text-pink-600" size={20} />;
    case 'Smartphone': return <Smartphone className={dc ? 'text-slate-400' : 'text-slate-800'} size={20} />;
    case 'Globe': return <Globe className="text-emerald-600" size={20} />;
    case 'Users': return <Users className="text-indigo-500" size={20} />;
    case 'Hash': return <Hash className="text-slate-600" size={20} />;
    case 'Link': return <Link className="text-sky-500" size={20} />;
    default: return <Globe className="text-slate-400" size={20} />;
  }
};

export default Admin;
