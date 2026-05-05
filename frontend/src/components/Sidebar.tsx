import React from 'react';
import { LayoutDashboard, Users, MessageSquare, Calendar, Settings, PieChart, Home, DollarSign, Shield, Zap, Bot, Smartphone, Workflow, Moon, Sun, ChevronRight, ChevronLeft, LogOut, UserCog } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  userRole?: string;
  userName?: string;
  onLogout?: () => void;
}

const Sidebar = ({ activeTab, setActiveTab, isDarkMode, setIsDarkMode, userRole = 'usuario', userName = '', onLogout }: SidebarProps) => {
  const [isCollapsed, setIsCollapsed] = React.useState(true);
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);

  const canSee = (...roles: string[]) => roles.includes(userRole);

  const toggleGroup = (group: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenGroup(openGroup === group ? null : group);
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex relative flex-col w-64 h-screen z-50 transition-colors duration-500 ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'} border-r`}>
        {/* Brand Header */}
        <div className="hidden md:flex h-20 items-center px-8 border-b border-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Bot className="text-white" size={20} />
            </div>
            <div>
              <span className={`text-[18px] md:text-[20px] font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`} style={{ fontFamily: 'var(--font-heading)' }}>ChatPrex</span>
              <div className="flex items-center gap-1.5 -mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-[11px] font-bold text-slate-500">Cloud ERP</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-x-hidden">
          <NavItem onClick={() => setActiveTab('Dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} isDarkMode={isDarkMode} />
          <NavItem onClick={() => setActiveTab('Leads Pipeline')} icon={<Users size={20} />} label="Leads Pipeline" active={activeTab === 'Leads Pipeline'} isDarkMode={isDarkMode} />
          <NavItem onClick={() => setActiveTab('Conversaciones')} icon={<MessageSquare size={20} />} label="Conversaciones" active={activeTab === 'Conversaciones'} isDarkMode={isDarkMode} />
          <NavItem onClick={() => setActiveTab('Inventario')} icon={<Home size={20} />} label="Propiedades" active={activeTab === 'Inventario'} isDarkMode={isDarkMode} />
          <NavItem onClick={() => setActiveTab('Calendario')} icon={<Calendar size={20} />} label="Calendario" active={activeTab === 'Calendario'} isDarkMode={isDarkMode} />
          <NavItem onClick={() => setActiveTab('Finanzas')} icon={<DollarSign size={20} />} label="Finanzas" active={activeTab === 'Finanzas'} isDarkMode={isDarkMode} />
          <NavItem onClick={() => setActiveTab('Campañas')} icon={<PieChart size={20} />} label="Campañas" active={activeTab === 'Campañas'} isDarkMode={isDarkMode} />
          {canSee('propietario', 'administrador') && (
            <NavItem onClick={() => setActiveTab('Usuarios')} icon={<UserCog size={20} />} label="Usuarios" active={activeTab === 'Usuarios'} isDarkMode={isDarkMode} />
          )}
        </nav>

        <div className={`p-4 border-t shrink-0 overflow-x-hidden flex flex-col gap-2 transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          {canSee('propietario', 'administrador') && (
            <NavGroup 
              icon={<Workflow size={20} />} 
              label="Integraciones" 
              isOpen={openGroup === 'integraciones'} 
              onToggle={() => toggleGroup('integraciones')}
              isDarkMode={isDarkMode}
              active={['Conexión WP', 'Constructor Bots', 'Automatización'].includes(activeTab)}
            >
              <SubNavItem onClick={() => setActiveTab('Conexión WP')} label="Conexión WP" active={activeTab === 'Conexión WP'} isDarkMode={isDarkMode} />
              <SubNavItem onClick={() => setActiveTab('Constructor Bots')} label="Entrenamiento IA" active={activeTab === 'Constructor Bots'} isDarkMode={isDarkMode} />
              <SubNavItem onClick={() => setActiveTab('Automatización')} label="Automatización" active={activeTab === 'Automatización'} isDarkMode={isDarkMode} />
            </NavGroup>
          )}

          {canSee('propietario') && (
            <NavGroup 
              icon={<Settings size={20} />} 
              label="Ajustes" 
              isOpen={openGroup === 'ajustes'} 
              onToggle={() => toggleGroup('ajustes')}
              isDarkMode={isDarkMode}
              active={['Configuración', 'Administración'].includes(activeTab)}
            >
              <SubNavItem onClick={() => setActiveTab('Administración')} label="Administración" active={activeTab === 'Administración'} isDarkMode={isDarkMode} />
              <SubNavItem onClick={() => setActiveTab('Configuración')} label="Configuración General" active={activeTab === 'Configuración'} isDarkMode={isDarkMode} />
            </NavGroup>
          )}

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`w-full flex items-center justify-between p-3 mt-2 rounded-xl transition-all duration-200 ${isDarkMode ? 'bg-slate-800 text-amber-500 hover:bg-slate-700' : 'bg-slate-100 text-indigo-500 hover:bg-slate-200'}`}
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              <span className={`text-[13px] font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                {isDarkMode ? 'Modo Día' : 'Modo Noche'}
              </span>
            </div>
          </button>

          {/* User info + Logout */}
          {userName && (
            <div className={`flex items-center justify-between p-3 rounded-xl mt-1 ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div className="flex items-center gap-2 min-w-0">
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=random&size=32`} alt="" className="w-7 h-7 rounded-full shrink-0" />
                <div className="min-w-0">
                  <p className={`text-[12px] font-bold truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{userName}</p>
                  <p className="text-[10px] font-medium text-slate-500 capitalize">{userRole}</p>
                </div>
              </div>
              {onLogout && (
                <button onClick={onLogout} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-500'}`} title="Cerrar sesión">
                  <LogOut size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Bottom Navigation Mobile */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center h-16 px-1 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe overflow-x-auto scrollbar-hide transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <MobileNavItem onClick={() => setActiveTab('Dashboard')} icon={<LayoutDashboard size={18} />} label="Dash" active={activeTab === 'Dashboard'} isDarkMode={isDarkMode} />
        <MobileNavItem onClick={() => setActiveTab('Leads Pipeline')} icon={<Users size={18} />} label="Leads" active={activeTab === 'Leads Pipeline'} isDarkMode={isDarkMode} />
        <MobileNavItem onClick={() => setActiveTab('Conversaciones')} icon={<MessageSquare size={18} />} label="Chats" active={activeTab === 'Conversaciones'} isDarkMode={isDarkMode} />
        <MobileNavItem onClick={() => setActiveTab('Inventario')} icon={<Home size={18} />} label="Prop" active={activeTab === 'Inventario'} isDarkMode={isDarkMode} />
        <MobileNavItem onClick={() => setActiveTab('Calendario')} icon={<Calendar size={18} />} label="Cal" active={activeTab === 'Calendario'} isDarkMode={isDarkMode} />
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          className={`flex flex-col items-center justify-center min-w-[50px] h-full gap-1 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
        >
          <div className={isDarkMode ? 'text-amber-500' : 'text-indigo-500'}>
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </div>
          <span className="text-[10px] font-bold">{isDarkMode ? 'Día' : 'Noche'}</span>
        </button>
      </nav>
    </>
  );
};

const NavItem = ({ icon, label, active, onClick, isDarkMode, badge }: any) => (
  <button 
    onClick={onClick}
    className={`group relative flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 font-semibold text-[13px] active:scale-95 whitespace-nowrap ${
      active 
        ? 'bg-primary text-white shadow-lg shadow-primary/20' 
        : (isDarkMode ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'text-slate-600 hover:bg-slate-50 hover:text-primary')
    }`}
  >
    <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
    <span className="md:block">{label}</span>
    {badge && (
      <span className={`absolute -top-1 -right-1 md:relative md:top-auto md:right-auto ml-auto px-1.5 py-0.5 rounded-md text-[11px] font-bold ${active ? 'bg-white text-primary' : 'bg-primary text-white'}`}>
        {badge}
      </span>
    )}
  </button>
);

const NavGroup = ({ icon, label, isOpen, onToggle, isDarkMode, children, active = false }: any) => {
  return (
    <div className="flex flex-col gap-1 w-full">
      <button 
        onClick={onToggle} 
        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-white/5 text-slate-400' : 'hover:bg-slate-50 text-slate-600'}`}
      >
        <div className="flex items-center gap-3">
          <div className={`shrink-0 ${active ? 'text-primary' : 'text-slate-500'}`}>{icon}</div>
          <span className={`text-[13px] whitespace-nowrap ${active ? (isDarkMode ? 'font-bold text-white' : 'font-bold text-slate-800') : ''}`}>{label}</span>
        </div>
        <div className={`shrink-0 transition-transform text-slate-400 ${isOpen ? 'rotate-90' : ''}`}>
          <ChevronRight size={16} />
        </div>
      </button>
      {isOpen && (
        <div className={`pl-11 flex flex-col gap-1 mt-1 border-l-2 ml-5 transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          {children}
        </div>
      )}
    </div>
  );
};

const SubNavItem = ({ label, active = false, isDarkMode = false, onClick }: { label: string, active?: boolean, isDarkMode?: boolean, onClick?: () => void }) => {
  return (
    <button 
      onClick={onClick} 
      className={`w-full flex items-center justify-start py-1.5 px-3 rounded-lg transition-all duration-200 text-[12px] md:text-[13px] whitespace-nowrap ${active ? 'bg-primary/10 text-primary font-bold' : (isDarkMode ? 'hover:bg-white/5 text-slate-500 hover:text-slate-300' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-700')}`}
    >
      {label}
    </button>
  );
};

const MobileNavItem = ({ icon, label, active = false, color = "text-slate-500", isDarkMode = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, color?: string, isDarkMode?: boolean, onClick?: () => void }) => {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-colors ${active ? 'text-primary font-bold' : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}>
      <div className={`${active ? 'text-primary' : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold">{label}</span>
    </button>
  );
};

export default Sidebar;
