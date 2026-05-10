import React from 'react';
import { LayoutDashboard, Users, MessageSquare, Calendar, Settings, PieChart, Home, DollarSign, Shield, Zap, Bot, Smartphone, Workflow, Moon, Sun, ChevronRight, ChevronLeft, LogOut, UserCog, PanelLeftClose, PanelLeftOpen, LayoutGrid } from 'lucide-react';

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
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);

  const canSee = (...roles: string[]) => roles.includes(userRole);

  const toggleGroup = (group: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenGroup(openGroup === group ? null : group);
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex relative flex-col h-screen z-[100] transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-64'} bg-surface border-r border-edge`}>
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 z-50 w-6 h-6 rounded-md border border-edge bg-surface flex items-center justify-center text-content-muted hover:text-content hover:bg-surface-raised transition-colors"
        >
          {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Brand Header */}
        <div className={`h-16 flex items-center border-b border-edge ${isCollapsed ? 'px-3 justify-center' : 'px-5'}`}>
          <div className="flex items-center gap-3 w-full">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center shrink-0">
              <Bot className="text-white" size={18} />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-content">ChatPrex</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <span className="text-[11px] font-medium text-content-muted">Premium CRM</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 py-3 flex flex-col gap-0.5 overflow-x-hidden overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <NavItem onClick={() => setActiveTab('Dashboard')} icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === 'Dashboard'} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Conversaciones')} icon={<MessageSquare size={18} />} label="Conversaciones" active={activeTab === 'Conversaciones'} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Leads Pipeline')} icon={<Users size={18} />} label="Pipeline de leads" active={activeTab === 'Leads Pipeline'} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Calendario')} icon={<Calendar size={18} />} label="Agenda y tareas" active={activeTab === 'Calendario'} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Inventario')} icon={<Home size={18} />} label="Propiedades" active={activeTab === 'Inventario'} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Finanzas')} icon={<DollarSign size={18} />} label="Finanzas" active={activeTab === 'Finanzas'} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Campañas')} icon={<PieChart size={18} />} label="Campañas" active={activeTab === 'Campañas'} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Inteligencia')} icon={<Zap size={18} />} label="Lead Intelligence" active={activeTab === 'Inteligencia'} collapsed={isCollapsed} />
        </nav>

        <div className={`p-3 border-t border-edge shrink-0 flex flex-col gap-0.5`}>
          
          {canSee('propietario', 'administrador') && (
            <NavItem 
              onClick={() => setActiveTab('Usuarios')} 
              icon={<UserCog size={18} />} 
              label={isCollapsed ? "Usuarios" : "Gestión de usuarios"} 
              active={activeTab === 'Usuarios'} 
              collapsed={isCollapsed} 
            />
          )}

          {canSee('propietario', 'administrador') && !isCollapsed && (
            <NavGroup 
              icon={<Workflow size={18} />} 
              label="Integraciones" 
              isOpen={openGroup === 'integraciones'} 
              onToggle={() => toggleGroup('integraciones')}
              active={['Conexión WP', 'Constructor Bots', 'Automatización'].includes(activeTab)}
            >
              <SubNavItem onClick={() => setActiveTab('Conexión WP')} label="Conexión Whatsapp" active={activeTab === 'Conexión WP'} />
              <SubNavItem onClick={() => setActiveTab('Constructor Bots')} label="Entrenamiento IA" active={activeTab === 'Constructor Bots'} />
              <SubNavItem onClick={() => setActiveTab('Automatización')} label="Automatización" active={activeTab === 'Automatización'} />
            </NavGroup>
          )}

          {canSee('propietario') && !isCollapsed && (
            <NavGroup 
              icon={<Settings size={18} />} 
              label="Ajustes" 
              isOpen={openGroup === 'ajustes'} 
              onToggle={() => toggleGroup('ajustes')}
              active={['Configuración', 'Administración'].includes(activeTab)}
            >
              <SubNavItem onClick={() => setActiveTab('Administración')} label="Administración" active={activeTab === 'Administración'} />
              <SubNavItem onClick={() => setActiveTab('Configuración')} label="Configuración" active={activeTab === 'Configuración'} />
            </NavGroup>
          )}

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 mt-1 rounded-lg text-content-secondary hover:text-content hover:bg-surface-inset transition-colors`}
          >
            <div className="flex items-center gap-2.5">
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              {!isCollapsed && <span className="text-xs font-medium">{isDarkMode ? 'Modo día' : 'Modo noche'}</span>}
            </div>
          </button>

          {userName && (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg mt-1 bg-surface-inset`}>
              {isCollapsed ? (
                <button onClick={onLogout} className="transition-all hover:opacity-70">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563eb&color=fff&size=80`} alt="" className="w-8 h-8 rounded-lg" />
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=2563eb&color=fff&size=80`} alt="" className="w-8 h-8 rounded-lg shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate text-content">{userName}</p>
                      <p className="text-[11px] font-medium text-accent capitalize mt-0.5">{userRole}</p>
                    </div>
                  </div>
                  <button onClick={onLogout} className="p-1.5 rounded-md text-content-muted hover:text-red-500 hover:bg-red-500/10 transition-colors">
                    <LogOut size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Bottom Navigation Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-edge flex justify-around items-center h-16 px-2 z-[100] bg-surface">
        <MobileNavItem onClick={() => setActiveTab('Dashboard')} icon={<LayoutDashboard size={18} />} label="Inicio" active={activeTab === 'Dashboard'} />
        <MobileNavItem onClick={() => setActiveTab('Leads Pipeline')} icon={<Users size={18} />} label="Leads" active={activeTab === 'Leads Pipeline'} />
        <MobileNavItem onClick={() => setActiveTab('Conversaciones')} icon={<MessageSquare size={18} />} label="Chats" active={activeTab === 'Conversaciones'} />
        <MobileNavItem onClick={() => setActiveTab('Inventario')} icon={<Home size={18} />} label="Prop" active={activeTab === 'Inventario'} />
        <MobileNavItem onClick={() => setActiveTab('Calendario')} icon={<Calendar size={18} />} label="Citas" active={activeTab === 'Calendario'} />
      </nav>
    </>
  );
};

const NavItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button 
    onClick={onClick}
    className={`group relative flex items-center ${collapsed ? 'justify-center' : ''} gap-2.5 ${collapsed ? 'py-2.5' : 'px-3 py-2'} rounded-lg transition-colors whitespace-nowrap overflow-hidden ${
      active 
        ? 'bg-accent text-white' 
        : 'text-content-secondary hover:text-content hover:bg-surface-inset'
    }`}
  >
    <span className="shrink-0">{icon}</span>
    {!collapsed && <span className="text-[13px] font-medium">{label}</span>}
    {collapsed && (
      <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[101] bg-content text-surface">
        {label}
      </div>
    )}
  </button>
);

const NavGroup = ({ icon, label, isOpen, onToggle, children, active = false }: any) => (
  <div className="flex flex-col gap-0.5 w-full">
    <button 
      onClick={onToggle} 
      className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-content-secondary hover:text-content hover:bg-surface-inset"
    >
      <div className="flex items-center gap-2.5">
        <div className={`shrink-0 ${active ? 'text-accent' : ''}`}>{icon}</div>
        <span className={`text-[13px] font-medium ${active ? 'text-content' : ''}`}>{label}</span>
      </div>
      <ChevronRight size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-90 text-accent' : 'opacity-40'}`} />
    </button>
    {isOpen && (
      <div className="pl-8 flex flex-col gap-0.5 mt-0.5 border-l border-edge ml-5">
        {children}
      </div>
    )}
  </div>
);

const SubNavItem = ({ label, active, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full text-left py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${active ? 'text-accent bg-accent-subtle' : 'text-content-muted hover:text-content hover:bg-surface-inset'}`}
  >
    {label}
  </button>
);

const MobileNavItem = ({ icon, label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${active ? 'text-accent' : 'text-content-muted'}`}>
    {icon}
    <span className={`text-[10px] font-medium ${active ? 'opacity-100' : 'opacity-60'}`}>{label}</span>
  </button>
);

export default Sidebar;
