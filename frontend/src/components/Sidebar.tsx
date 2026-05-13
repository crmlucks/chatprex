import React from 'react';
import { LayoutDashboard, Users, MessageSquare, Calendar, Settings, PieChart, Home, DollarSign, Shield, Zap, Bot, Smartphone, Workflow, Moon, Sun, ChevronRight, ChevronLeft, LogOut, UserCog, PanelLeftClose, PanelLeftOpen, LayoutGrid, Menu, X } from 'lucide-react';

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
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [openGroup, setOpenGroup] = React.useState<string | null>(null);

  const canSee = (...roles: string[]) => roles.includes(userRole);

  const toggleGroup = (group: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenGroup(openGroup === group ? null : group);
  };

  return (
    <>
      {/* Top Navigation Mobile */}
      <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-edge bg-surface shrink-0 z-[90]">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileOpen(true)} className="p-1.5 -ml-1.5 rounded-lg text-content-muted hover:text-content hover:bg-surface-inset transition-colors">
            <Menu size={20} />
          </button>
          <span className="text-sm font-bold text-content">{activeTab}</span>
        </div>
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
          <Bot className="text-white" size={16} />
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[100] md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside className={`fixed md:relative inset-y-0 left-0 z-[110] transform transition-transform duration-300 md:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} ${isCollapsed ? 'w-[72px]' : 'w-64'} flex flex-col h-screen bg-surface border-r border-edge`}>
        
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
          {isMobileOpen && (
            <button onClick={() => setIsMobileOpen(false)} className="md:hidden p-1.5 rounded-lg text-content-muted hover:text-content hover:bg-surface-inset ml-2">
              <X size={20} />
            </button>
          )}
        </div>

        <nav className={`flex-1 py-3 flex flex-col gap-0.5 overflow-x-hidden overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3'}`}>
          <NavItem onClick={() => { setActiveTab('Dashboard'); setIsMobileOpen(false); }} icon={<LayoutDashboard size={18} />} label="Dashboard" active={activeTab === 'Dashboard'} collapsed={isCollapsed} />
          <NavItem onClick={() => { setActiveTab('Inteligencia'); setIsMobileOpen(false); }} icon={<Zap size={18} />} label="Lead Intelligence" active={activeTab === 'Inteligencia'} collapsed={isCollapsed} />
          <NavItem onClick={() => { setActiveTab('Leads Pipeline'); setIsMobileOpen(false); }} icon={<Users size={18} />} label="Pipeline de leads" active={activeTab === 'Leads Pipeline'} collapsed={isCollapsed} />
          <NavItem onClick={() => { setActiveTab('Conversaciones'); setIsMobileOpen(false); }} icon={<MessageSquare size={18} />} label="Conversaciones" active={activeTab === 'Conversaciones'} collapsed={isCollapsed} />
          <NavItem onClick={() => { setActiveTab('Inventario'); setIsMobileOpen(false); }} icon={<Home size={18} />} label="Propiedades" active={activeTab === 'Inventario'} collapsed={isCollapsed} />
          <NavItem onClick={() => { setActiveTab('Calendario'); setIsMobileOpen(false); }} icon={<Calendar size={18} />} label="Agenda y tareas" active={activeTab === 'Calendario'} collapsed={isCollapsed} />
          <NavItem onClick={() => { setActiveTab('Finanzas'); setIsMobileOpen(false); }} icon={<DollarSign size={18} />} label="Finanzas" active={activeTab === 'Finanzas'} collapsed={isCollapsed} />
          {canSee('propietario', 'administrador') && (
            <NavItem onClick={() => { setActiveTab('Campañas'); setIsMobileOpen(false); }} icon={<PieChart size={18} />} label="Campañas" active={activeTab === 'Campañas'} collapsed={isCollapsed} />
          )}
        </nav>

        <div className={`p-3 border-t border-edge shrink-0 flex flex-col gap-0.5`}>
          
          {canSee('propietario', 'administrador') && !isCollapsed && (
            <NavGroup 
              icon={<Workflow size={18} />} 
              label="Integraciones" 
              isOpen={openGroup === 'integraciones'} 
              onToggle={() => toggleGroup('integraciones')}
              active={['Conexión WP', 'Constructor Bots', 'Automatización'].includes(activeTab)}
            >
              <SubNavItem onClick={() => { setActiveTab('Conexión WP'); setIsMobileOpen(false); }} label="Conexión Whatsapp" active={activeTab === 'Conexión WP'} />
              <SubNavItem onClick={() => { setActiveTab('Constructor Bots'); setIsMobileOpen(false); }} label="Entrenamiento IA" active={activeTab === 'Constructor Bots'} />
              <SubNavItem onClick={() => { setActiveTab('Automatización'); setIsMobileOpen(false); }} label="Automatización" active={activeTab === 'Automatización'} />
            </NavGroup>
          )}

          {canSee('propietario', 'administrador') && !isCollapsed && (
            <NavGroup 
              icon={<Settings size={18} />} 
              label="Ajustes" 
              isOpen={openGroup === 'ajustes'} 
              onToggle={() => toggleGroup('ajustes')}
              active={['Configuración', 'Administración', 'Usuarios'].includes(activeTab)}
            >
              <SubNavItem onClick={() => { setActiveTab('Usuarios'); setIsMobileOpen(false); }} label="Gestión de usuarios" active={activeTab === 'Usuarios'} />
              <SubNavItem onClick={() => { setActiveTab('Administración'); setIsMobileOpen(false); }} label="Administración" active={activeTab === 'Administración'} />
              <SubNavItem onClick={() => { setActiveTab('Configuración'); setIsMobileOpen(false); }} label="Configuración" active={activeTab === 'Configuración'} />
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
