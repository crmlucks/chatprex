import React, { useState } from 'react';
import { Shield, Users, Layers, Layout, Facebook, Instagram, Hash, Globe, Smartphone, Edit2, Trash2, Plus, X } from 'lucide-react';

const Admin = ({ isDarkMode }: { isDarkMode?: boolean }) => {
  const [tab, setTab] = useState('usuarios');
  const [modalType, setModalType] = useState<string | null>(null);

  const openModal = (type: string) => setModalType(type);
  const closeModal = () => setModalType(null);

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 flex flex-col md:flex-row gap-6 relative transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      {/* Menu Lateral Admin */}
      <div className="w-full md:w-64 shrink-0">
        <h1 className={`text-[18px] md:text-[20px] font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Administración</h1>
        <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          <MenuBtn active={tab === 'usuarios'} onClick={() => setTab('usuarios')} icon={<Users size={18} />} label="Usuarios y Roles" isDarkMode={isDarkMode} />
          <MenuBtn active={tab === 'proyectos'} onClick={() => setTab('proyectos')} icon={<Layers size={18} />} label="Proyectos/Desarrollos" isDarkMode={isDarkMode} />
          <MenuBtn active={tab === 'pipeline'} onClick={() => setTab('pipeline')} icon={<Layout size={18} />} label="Etapas del Pipeline" isDarkMode={isDarkMode} />
          <MenuBtn active={tab === 'fuentes'} onClick={() => setTab('fuentes')} icon={<Globe size={18} />} label="Fuentes de Origen" isDarkMode={isDarkMode} />
        </div>
      </div>

      {/* Contenido Configuración */}
      <div className={`flex-1 rounded-2xl border shadow-sm p-6 overflow-x-auto transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        {tab === 'usuarios' && (
          <div>
            <Header tabTitle="Usuarios del Sistema" onAdd={() => openModal('usuario')} isDarkMode={isDarkMode} />
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className={`border-b text-[11px] font-bold transition-colors ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                  <th className="pb-3 font-semibold">Nombre</th>
                  <th className="pb-3 font-semibold">Correo</th>
                  <th className="pb-3 font-semibold">Rol</th>
                  <th className="pb-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                <UserRow name="Carlos Admin" email="admin@chatprex.com" role="Administrador" roleColor={isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'} isDarkMode={isDarkMode} />
                <UserRow name="María Ventas" email="maria@chatprex.com" role="Agente" roleColor={isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'} isDarkMode={isDarkMode} />
                <UserRow name="Luis Agente" email="luis@chatprex.com" role="Agente" roleColor={isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'} isDarkMode={isDarkMode} />
              </tbody>
            </table>
          </div>
        )}

        {tab === 'proyectos' && (
          <div>
            <Header tabTitle="Proyectos / Desarrollos" onAdd={() => openModal('proyecto')} isDarkMode={isDarkMode} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProjectCard name="Torre Esmeralda" code="PRJ-001" status="Activo" isDarkMode={isDarkMode} />
              <ProjectCard name="Residencial Los Pinos" code="PRJ-002" status="Activo" isDarkMode={isDarkMode} />
              <ProjectCard name="Plaza Central" code="PRJ-003" status="Pausado" isDarkMode={isDarkMode} />
            </div>
          </div>
        )}

        {tab === 'pipeline' && (
          <div>
            <Header tabTitle="Etapas del Pipeline" onAdd={() => openModal('etapa')} isDarkMode={isDarkMode} />
            <div className={`divide-y border rounded-xl px-4 transition-colors ${isDarkMode ? 'divide-slate-800 border-slate-800' : 'divide-slate-100 border-slate-100'}`}>
              <PipelineRow name="Nuevo" color="#3b82f6" visible={true} isDarkMode={isDarkMode} />
              <PipelineRow name="Contactado" color="#0ea5e9" visible={true} isDarkMode={isDarkMode} />
              <PipelineRow name="Cita Programada" color="#f59e0b" visible={true} isDarkMode={isDarkMode} />
              <PipelineRow name="Negociación" color="#a855f7" visible={true} isDarkMode={isDarkMode} />
              <PipelineRow name="Ganado / Cierre" color="#10b981" visible={true} isDarkMode={isDarkMode} />
              <PipelineRow name="Perdido" color="#ef4444" visible={true} isDarkMode={isDarkMode} />
            </div>
          </div>
        )}

        {tab === 'fuentes' && (
          <div>
            <Header tabTitle="Fuentes de Origen (Leads)" onAdd={() => openModal('fuente')} isDarkMode={isDarkMode} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SourceCard icon={<Facebook className="text-blue-600" />} name="Facebook Ads" isDarkMode={isDarkMode} />
              <SourceCard icon={<Instagram className="text-pink-600" />} name="Instagram" isDarkMode={isDarkMode} />
              <SourceCard icon={<Smartphone className={isDarkMode ? 'text-slate-400' : 'text-slate-800'} />} name="TikTok" isDarkMode={isDarkMode} />
              <SourceCard icon={<Globe className="text-emerald-600" />} name="Sitio Web" isDarkMode={isDarkMode} />
              <SourceCard icon={<Hash className="text-slate-600" />} name="Referido" isDarkMode={isDarkMode} />
            </div>
          </div>
        )}
      </div>

      {/* Modal Genérico */}
      {modalType && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-800 capitalize">Añadir {modalType}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {modalType !== 'proyecto' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                  <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="Ej. Nuevo Nombre..." />
                </div>
              )}

              {modalType === 'proyecto' && (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Proyecto</label>
                    <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Ej. Torre Esmeralda" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Desarrollador (Cliente)</label>
                    <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Ej. Constructora X" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de Contacto</label>
                      <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Juan Pérez" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                      <input type="tel" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" placeholder="+1 234 567 890" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                      <input type="email" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" placeholder="contacto@empresa.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Moneda</label>
                      <select className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary bg-white">
                        <option>USD ($)</option>
                        <option>MXN ($)</option>
                        <option>EUR (€)</option>
                        <option>COP ($)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                    <input type="text" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary" placeholder="Av. Principal 123" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                    <textarea className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary min-h-[80px]" placeholder="Observaciones adicionales..."></textarea>
                  </div>
                </div>
              )}

              {modalType === 'usuario' && (
                <>
                  <div className="flex items-center gap-4 pb-2">
                    <div className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <Users size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <button className="text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:border-primary hover:text-primary px-3 py-1.5 rounded-lg transition-colors">
                        Subir Imagen
                      </button>
                      <p className="text-[10px] text-slate-400 mt-1">JPG, PNG o GIF (Max. 2MB)</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                    <input type="email" className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" placeholder="ejemplo@correo.com" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                      <select className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white">
                        <option>Administrador</option>
                        <option>Agente</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                      <select className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white">
                        <option>Activo</option>
                        <option>Desactivado</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              {modalType === 'etapa' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Color HEX</label>
                    <div className="flex gap-2">
                      <input type="color" className="h-10 w-10 border border-slate-200 rounded p-0 cursor-pointer" defaultValue="#3b82f6" />
                      <input type="text" className="flex-1 border border-slate-200 rounded-lg px-4 py-2 text-sm font-mono focus:outline-none focus:border-primary" defaultValue="#3b82f6" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      <span className="ml-3 text-sm font-medium text-slate-700">Visible en el Pipeline Kanban</span>
                    </label>
                  </div>
                </>
              )}
              <div className="pt-4 flex gap-3">
                <button onClick={closeModal} className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-medium text-sm transition-colors">Cancelar</button>
                <button onClick={closeModal} className="flex-1 px-4 py-2 text-white bg-primary hover:bg-primary-dark rounded-xl font-medium text-sm transition-colors shadow-sm">Guardar</button>
              </div>
            </div>
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

const ActionButtons = ({ isDarkMode }: any) => (
  <div className="flex items-center gap-1.5">
    <button className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-500 hover:text-primary hover:bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}`}><Edit2 size={14} /></button>
    <button className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'text-slate-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}><Trash2 size={14} /></button>
  </div>
);

const UserRow = ({ name, email, role, roleColor, isDarkMode }: any) => (
  <tr className={`h-[42px] border-b last:border-0 transition-colors ${isDarkMode ? 'border-slate-800/50 hover:bg-white/5' : 'border-slate-50 hover:bg-slate-50'}`}>
    <td className="py-2.5">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full overflow-hidden border ${isDarkMode ? 'border-slate-700' : 'border-white'}`}><img src={`https://ui-avatars.com/api/?name=${name}&background=random`} alt={name} /></div>
        <span className={`font-semibold text-[13px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{name}</span>
      </div>
    </td>
    <td className={`py-2.5 text-[12px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{email}</td>
    <td className="py-2.5"><span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${roleColor}`}>{role}</span></td>
    <td className="py-2.5 text-right"><ActionButtons isDarkMode={isDarkMode} /></td>
  </tr>
);

const ProjectCard = ({ name, code, status, isDarkMode }: any) => (
  <div className={`border p-4 rounded-xl transition-all hover:shadow-lg ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:border-primary/50' : 'bg-slate-50/50 border-slate-200 hover:border-primary/50'}`}>
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className={`font-bold text-sm md:text-base ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{name}</h4>
        <span className="text-[10px] text-slate-500 font-bold">{code}</span>
      </div>
      <ActionButtons isDarkMode={isDarkMode} />
    </div>
    <div className={`mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded transition-colors ${isDarkMode ? 'bg-slate-900 border border-slate-700 text-slate-400' : 'bg-white border border-slate-200 text-slate-600'}`}>
      <span className={`w-2 h-2 rounded-full ${status === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span> {status}
    </div>
  </div>
);

const PipelineRow = ({ name, color, visible, isDarkMode }: any) => (
  <div className="flex items-center justify-between py-3 group">
    <div className="flex items-center gap-4">
      <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
      <span className={`font-bold text-xs md:text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>{name}</span>
    </div>
    <div className="flex items-center gap-6">
      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${visible ? (isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700') : (isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500')}`}>
        {visible ? 'Visible' : 'Oculto'}
      </span>
      <ActionButtons isDarkMode={isDarkMode} />
    </div>
  </div>
);

const SourceCard = ({ icon, name, isDarkMode }: any) => (
  <div className={`flex items-center justify-between p-3 border rounded-xl transition-all hover:shadow-lg ${isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:border-primary/50' : 'bg-white border-slate-200 hover:border-primary/50'}`}>
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg border transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>{icon}</div>
      <span className={`font-bold text-xs md:text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{name}</span>
    </div>
    <ActionButtons isDarkMode={isDarkMode} />
  </div>
);

export default Admin;
