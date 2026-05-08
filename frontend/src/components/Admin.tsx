import React, { useState, useEffect } from 'react';
import { Layers, Layout, Facebook, Instagram, Hash, Globe, Smartphone, Edit2, Trash2, Plus, X, Link } from 'lucide-react';
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
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (type: string, item: any = null) => {
    if (item) {
      setFormData(item);
    } else {
      if (type === 'proyecto') setFormData({ name: '', code: '', status: 'Activo' });
      else if (type === 'etapa') setFormData({ name: '', color: '#3b82f6', visible: true });
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
      } else {
        alert('Error al guardar');
      }
    } catch (err) {
      alert('Error de conexión');
    } finally {
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
    } catch (err) {
      alert('Error de conexión');
    }
  };

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 flex flex-col md:flex-row gap-6 relative transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      {/* Menu Lateral Admin */}
      <div className="w-full md:w-64 shrink-0">
        <h1 className={`text-[18px] md:text-[20px] font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Administración</h1>
        <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          <MenuBtn active={tab === 'proyectos'} onClick={() => setTab('proyectos')} icon={<Layers size={18} />} label="Proyectos/Desarrollos" isDarkMode={isDarkMode} />
          <MenuBtn active={tab === 'pipeline'} onClick={() => setTab('pipeline')} icon={<Layout size={18} />} label="Etapas del Pipeline" isDarkMode={isDarkMode} />
          <MenuBtn active={tab === 'fuentes'} onClick={() => setTab('fuentes')} icon={<Globe size={18} />} label="Fuentes de Origen" isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* Contenido Configuración */}
      <div className={`flex-1 rounded-2xl border shadow-sm p-6 overflow-x-auto transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>

        {tab === 'proyectos' && (
          <div>
            <Header tabTitle="Proyectos / Desarrollos" onAdd={() => openModal('proyecto')} isDarkMode={isDarkMode} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.length === 0 ? (
                <div className={`col-span-2 text-center py-8 text-sm ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Sin proyectos registrados. Agrega uno nuevo.</div>
              ) : projects.map((p: any) => (
                <ProjectCard key={p.id} project={p} onEdit={() => openModal('proyecto', p)} onDelete={() => handleDelete('proyecto', p.id)} isDarkMode={isDarkMode} />
              ))}
            </div>
          </div>
        )}

        {tab === 'pipeline' && (
          <div>
            <Header tabTitle="Etapas del Pipeline" onAdd={() => openModal('etapa')} isDarkMode={isDarkMode} />
            <div className={`divide-y border rounded-xl px-4 transition-colors ${isDarkMode ? 'divide-slate-800 border-slate-800' : 'divide-slate-100 border-slate-100'}`}>
              {pipeline.map((p: any) => (
                <PipelineRow key={p.id} pipeline={p} onEdit={() => openModal('etapa', p)} onDelete={() => handleDelete('etapa', p.id)} isDarkMode={isDarkMode} />
              ))}
            </div>
          </div>
        )}

        {tab === 'fuentes' && (
          <div>
            <Header tabTitle="Fuentes de Origen (Leads)" onAdd={() => openModal('fuente')} isDarkMode={isDarkMode} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sources.map((s: any) => (
                <SourceCard key={s.id} source={s} onEdit={() => openModal('fuente', s)} onDelete={() => handleDelete('fuente', s.id)} isDarkMode={isDarkMode} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Genérico */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className={`px-6 py-3 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <h3 className={`font-bold text-sm lowercase ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>añadir {modalType}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:bg-slate-100 p-1 rounded-lg transition-colors"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className={`p-5 space-y-3 max-h-[80vh] overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
              {modalType === 'proyecto' && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <label className={`block text-[10px] font-bold mb-1 tracking-wider lowercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>nombre del proyecto</label>
                    <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} placeholder="Ej. Torre Esmeralda" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-[10px] font-bold mb-1 tracking-wider lowercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>código (opcional)</label>
                      <input type="text" value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value})} className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} placeholder="PRJ-001" />
                    </div>
                    <div>
                      <label className={`block text-[10px] font-bold mb-1 tracking-wider lowercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>estado</label>
                      <select value={formData.status || 'Activo'} onChange={e => setFormData({...formData, status: e.target.value})} className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                        <option value="Activo">Activo</option>
                        <option value="Inactivo">Inactivo</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {modalType === 'etapa' && (
                <>
                  <div>
                    <label className={`block text-[10px] font-bold mb-1 tracking-wider lowercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>nombre de la etapa</label>
                    <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} placeholder="Ej. Contactado" />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold mb-1 tracking-wider lowercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>color hex</label>
                    <div className="flex gap-2">
                      <input type="color" value={formData.color || '#3b82f6'} onChange={e => setFormData({...formData, color: e.target.value})} className="h-10 w-10 border border-slate-200 rounded p-0 cursor-pointer" />
                      <input type="text" value={formData.color || '#3b82f6'} onChange={e => setFormData({...formData, color: e.target.value})} className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.visible !== false} onChange={e => setFormData({...formData, visible: e.target.checked})} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className={`ml-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Visible en el Pipeline Kanban</span>
                    </label>
                  </div>
                </>
              )}

              {modalType === 'fuente' && (
                <>
                  <div>
                    <label className={`block text-[10px] font-bold mb-1 tracking-wider lowercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>nombre de la fuente</label>
                    <input required type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`} placeholder="Ej. Facebook Ads" />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold mb-1 tracking-wider lowercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>icono (opcional)</label>
                    <select value={formData.icon || 'Globe'} onChange={e => setFormData({...formData, icon: e.target.value})} className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-primary ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                      <option value="Facebook">Facebook</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Smartphone">Smartphone (TikTok/App)</option>
                      <option value="Globe">Globo (Sitio Web)</option>
                      <option value="Users">Usuarios (Referido)</option>
                      <option value="Hash">Hashtag</option>
                      <option value="Link">Enlace</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={formData.visible !== false} onChange={e => setFormData({...formData, visible: e.target.checked})} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className={`ml-3 text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Fuente Activa</span>
                    </label>
                  </div>
                </>
              )}

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={closeModal} className={`flex-1 px-4 py-2 rounded-xl font-bold text-xs transition-colors ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-white bg-primary hover:bg-primary-dark rounded-xl font-bold text-xs transition-colors shadow-sm disabled:opacity-50">
                  {saving ? 'guardando...' : 'guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Header = ({ tabTitle, onAdd, isDarkMode }: any) => (
  <div className="flex justify-between items-center mb-6">
    <h2 className={`text-[16px] md:text-[18px] font-bold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{tabTitle}</h2>
    <button onClick={onAdd} className="bg-primary text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[12px] md:text-[13px] font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center gap-2">
      <Plus size={16} /> Añadir
    </button>
  </div>
);

const MenuBtn = ({ active, onClick, icon, label, isDarkMode }: any) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-3 py-2 md:px-4 md:py-2.5 rounded-xl transition-all text-[12px] md:text-[13px] font-semibold whitespace-nowrap md:w-full active:scale-95 ${active ? 'bg-primary text-white shadow-lg shadow-primary/20' : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-white border border-transparent hover:border-slate-200')}`}>
    {icon} {label}
  </button>
);

const ActionButtons = ({ onEdit, onDelete, isDarkMode }: any) => (
  <div className="flex items-center gap-1.5">
    <button onClick={onEdit} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-500 hover:text-primary hover:bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}`}><Edit2 size={14} /></button>
    <button onClick={onDelete} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}><Trash2 size={14} /></button>
  </div>
);

const ProjectCard = ({ project, onEdit, onDelete, isDarkMode }: any) => (
  <div className={`border p-4 rounded-xl transition-all hover:shadow-lg ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:border-primary/50' : 'bg-slate-50/50 border-slate-200 hover:border-primary/50'}`}>
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className={`font-bold text-sm md:text-base ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{project.name}</h4>
        <span className="text-[10px] text-slate-500 font-bold">{project.code}</span>
      </div>
      <ActionButtons onEdit={onEdit} onDelete={onDelete} isDarkMode={isDarkMode} />
    </div>
    <div className={`mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors ${isDarkMode ? 'bg-slate-900 border border-slate-700 text-slate-400' : 'bg-white border border-slate-200 text-slate-600'}`}>
      <span className={`w-2 h-2 rounded-full ${project.status === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span> {project.status || 'Activo'}
    </div>
  </div>
);

const PipelineRow = ({ pipeline, onEdit, onDelete, isDarkMode }: any) => (
  <div className="flex items-center justify-between py-3 group">
    <div className="flex items-center gap-4">
      <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: pipeline.color }}></div>
      <span className={`font-bold text-xs md:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>{pipeline.name}</span>
    </div>
    <div className="flex items-center gap-6">
      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${pipeline.visible !== false ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500')}`}>
        {pipeline.visible !== false ? 'Visible' : 'Oculto'}
      </span>
      <ActionButtons onEdit={onEdit} onDelete={onDelete} isDarkMode={isDarkMode} />
    </div>
  </div>
);

const renderIcon = (iconStr: string, isDarkMode: boolean) => {
  const cls = "text-slate-500";
  switch (iconStr) {
    case 'Facebook': return <Facebook className="text-blue-600" />;
    case 'Instagram': return <Instagram className="text-pink-600" />;
    case 'Smartphone': return <Smartphone className={isDarkMode ? 'text-slate-400' : 'text-slate-800'} />;
    case 'Globe': return <Globe className="text-emerald-600" />;
    case 'Users': return <Users className="text-indigo-500" />;
    case 'Hash': return <Hash className="text-slate-600" />;
    case 'Link': return <Link className="text-sky-500" />;
    default: return <Globe className={cls} />;
  }
};

const SourceCard = ({ source, onEdit, onDelete, isDarkMode }: any) => (
  <div className={`flex items-center justify-between p-3 border rounded-xl transition-all hover:shadow-lg ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:border-primary/50' : 'bg-white border-slate-200 hover:border-primary/50'}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
        {renderIcon(source.icon, isDarkMode)}
      </div>
      <span className={`font-bold text-xs md:text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{source.name}</span>
    </div>
    <ActionButtons onEdit={onEdit} onDelete={onDelete} isDarkMode={isDarkMode} />
  </div>
);

export default Admin;
