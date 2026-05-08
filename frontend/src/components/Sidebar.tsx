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

  const dc = isDarkMode;

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex relative flex-col h-screen z-[100] transition-all duration-500 ease-in-out ${isCollapsed ? 'w-[84px]' : 'w-72'} ${dc ? 'bg-[#181619] border-slate-800' : 'bg-white border-slate-100 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.05)]'} border-r`}>
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-4 top-10 z-50 w-8 h-8 rounded-2xl shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${dc ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-white text-slate-400 border border-slate-100'}`}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand Header */}
        <div className={`h-24 flex items-center ${isCollapsed ? 'px-4 justify-center' : 'px-8'}`}>
          <div className="flex items-center gap-4 w-full">
            <div className="w-12 h-12 bg-primary rounded-[20px] flex items-center justify-center shadow-2xl shadow-primary/40 shrink-0 transition-transform hover:rotate-6">
              <Bot className="text-white" size={24} />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left duration-500">
                <span className={`text-xl font-black tracking-tight ${dc ? 'text-white' : 'text-slate-900'}`}>ChatPrex</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-80">Premium crm</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 py-6 flex flex-col gap-1.5 overflow-x-hidden overflow-y-auto custom-scrollbar ${isCollapsed ? 'px-3' : 'px-4'}`}>
          <NavItem onClick={() => setActiveTab('Dashboard')} icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'Dashboard'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Conversaciones')} icon={<MessageSquare size={20} />} label="Conversaciones" active={activeTab === 'Conversaciones'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Leads Pipeline')} icon={<Users size={20} />} label="Pipeline de leads" active={activeTab === 'Leads Pipeline'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Calendario')} icon={<Calendar size={20} />} label="Agenda y tareas" active={activeTab === 'Calendario'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Inventario')} icon={<Home size={20} />} label="Propiedades" active={activeTab === 'Inventario'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Finanzas')} icon={<DollarSign size={20} />} label="Finanzas" active={activeTab === 'Finanzas'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Campañas')} icon={<PieChart size={20} />} label="Campañas" active={activeTab === 'Campañas'} isDarkMode={dc} collapsed={isCollapsed} />
        </nav>

        <div className={`p-6 border-t shrink-0 flex flex-col gap-2 transition-colors ${dc ? 'border-slate-800' : 'border-slate-100'} ${isCollapsed ? 'px-3' : ''}`}>
          
          {canSee('propietario', 'administrador') && (
            <NavItem 
              onClick={() => setActiveTab('Usuarios')} 
              icon={<UserCog size={20} />} 
              label={isCollapsed ? "Usuarios" : "Gestión de usuarios"} 
              active={activeTab === 'Usuarios'} 
              isDarkMode={dc} 
              collapsed={isCollapsed} 
            />
          )}

          {canSee('propietario', 'administrador') && !isCollapsed && (
            <NavGroup 
              icon={<Workflow size={20} />} 
              label="Integraciones" 
              isOpen={openGroup === 'integraciones'} 
              onToggle={() => toggleGroup('integraciones')}
              isDarkMode={dc}
              active={['Conexión WP', 'Constructor Bots', 'Automatización'].includes(activeTab)}
            >
              <SubNavItem onClick={() => setActiveTab('Conexión WP')} label="Conexión Whatsapp" active={activeTab === 'Conexión WP'} isDarkMode={dc} />
              <SubNavItem onClick={() => setActiveTab('Constructor Bots')} label="Entrenamiento IA" active={activeTab === 'Constructor Bots'} isDarkMode={dc} />
              <SubNavItem onClick={() => setActiveTab('Automatización')} label="Automatización" active={activeTab === 'Automatización'} isDarkMode={dc} />
            </NavGroup>
          )}

          {canSee('propietario') && !isCollapsed && (
            <NavGroup 
              icon={<Settings size={20} />} 
              label="Ajustes" 
              isOpen={openGroup === 'ajustes'} 
              onToggle={() => toggleGroup('ajustes')}
              isDarkMode={dc}
              active={['Configuración', 'Administración'].includes(activeTab)}
            >
              <SubNavItem onClick={() => setActiveTab('Administración')} label="Administración" active={activeTab === 'Administración'} isDarkMode={dc} />
              <SubNavItem onClick={() => setActiveTab('Configuración')} label="Configuración" active={activeTab === 'Configuración'} isDarkMode={dc} />
            </NavGroup>
          )}

          <button 
            onClick={() => setIsDarkMode(!dc)} 
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3.5 mt-2 rounded-[20px] transition-all duration-300 active:scale-95 shadow-sm ${dc ? 'bg-slate-800/50 text-amber-500' : 'bg-slate-50 text-primary shadow-inner'}`}
          >
            <div className="flex items-center gap-3">
              {dc ? <Sun size={18} /> : <Moon size={18} />}
              {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">{dc ? 'Modo día' : 'Modo noche'}</span>}
            </div>
          </button>

          {userName && (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 rounded-[24px] mt-2 group transition-all duration-500 ${dc ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-white border border-slate-100 shadow-xl hover:shadow-2xl shadow-slate-200/50'}`}>
              {isCollapsed ? (
                <button onClick={onLogout} className="transition-all hover:scale-110 active:scale-90">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1649FF&color=fff&size=80`} alt="" className="w-10 h-10 rounded-2xl shadow-lg" />
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1649FF&color=fff&size=80`} alt="" className="w-10 h-10 rounded-2xl shrink-0 shadow-lg group-hover:rotate-3 transition-transform" />
                    <div className="min-w-0">
                      <p className={`text-xs font-black truncate tracking-tight ${dc ? 'text-white' : 'text-slate-900'}`}>{userName}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary opacity-80 mt-0.5">{userRole}</p>
                    </div>
                  </div>
                  <button onClick={onLogout} className={`p-2 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500'}`}>
                    <LogOut size={16} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Bottom Navigation Mobile */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center h-20 px-4 z-[100] shadow-2xl backdrop-blur-2xl transition-all ${dc ? 'bg-[#181619]/90 border-slate-800' : 'bg-white/95 border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]'}`}>
        <MobileNavItem onClick={() => setActiveTab('Dashboard')} icon={<LayoutDashboard size={20} />} label="Inicio" active={activeTab === 'Dashboard'} isDarkMode={dc} />
        <MobileNavItem onClick={() => setActiveTab('Leads Pipeline')} icon={<Users size={20} />} label="Leads" active={activeTab === 'Leads Pipeline'} isDarkMode={dc} />
        <MobileNavItem onClick={() => setActiveTab('Conversaciones')} icon={<MessageSquare size={20} />} label="Chats" active={activeTab === 'Conversaciones'} isDarkMode={dc} />
        <MobileNavItem onClick={() => setActiveTab('Inventario')} icon={<Home size={20} />} label="Prop" active={activeTab === 'Inventario'} isDarkMode={dc} />
        <MobileNavItem onClick={() => setActiveTab('Calendario')} icon={<Calendar size={20} />} label="Citas" active={activeTab === 'Calendario'} isDarkMode={dc} />
      </nav>
    </>
  );
};

const NavItem = ({ icon, label, active, onClick, isDarkMode, collapsed }: any) => (
  <button 
    onClick={onClick}
    className={`group relative flex items-center ${collapsed ? 'justify-center' : ''} gap-4 ${collapsed ? 'py-3.5' : 'px-5 py-3.5'} rounded-[20px] transition-all duration-300 active:scale-95 whitespace-nowrap overflow-hidden ${
      active 
        ? 'bg-primary text-white shadow-2xl shadow-primary/40' 
        : (isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800/80' : 'text-slate-500 hover:text-primary hover:bg-slate-50')
    }`}
  >
    <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
    {!collapsed && <span className="text-[13px] font-bold tracking-tight">{label}</span>}
    {collapsed && (
      <div className="absolute left-full ml-4 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-[101] bg-slate-900 text-white shadow-2xl translate-x-4 group-hover:translate-x-0">
        {label}
      </div>
    )}
    {active && !collapsed && (
       <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/20 rounded-l-full" />
    )}
  </button>
);

const NavGroup = ({ icon, label, isOpen, onToggle, isDarkMode, children, active = false }: any) => (
  <div className="flex flex-col gap-1 w-full">
    <button 
      onClick={onToggle} 
      className={`w-full flex items-center justify-between p-4 rounded-[20px] transition-all duration-300 ${isDarkMode ? 'hover:bg-slate-800/60 text-slate-400' : 'hover:bg-slate-50 text-slate-500'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`shrink-0 transition-transform ${active ? 'text-primary' : 'group-hover:scale-110'}`}>{icon}</div>
        <span className={`text-[13px] font-bold tracking-tight ${active ? (isDarkMode ? 'text-white' : 'text-slate-900') : ''}`}>{label}</span>
      </div>
      <ChevronRight size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-90 text-primary' : 'opacity-40'}`} />
    </button>
    {isOpen && (
      <div className={`pl-8 flex flex-col gap-1 mt-1 border-l-2 ml-6 transition-all animate-in slide-in-from-top-2 duration-300 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        {children}
      </div>
    )}
  </div>
);

const SubNavItem = ({ label, active, onClick, isDarkMode }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full text-left py-2.5 px-4 rounded-xl text-[11px] font-bold tracking-tight transition-all ${active ? 'text-primary bg-primary/5 shadow-inner' : (isDarkMode ? 'text-slate-500 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50')}`}
  >
    {label}
  </button>
);

const MobileNavItem = ({ icon, label, active, isDarkMode, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all active:scale-90 ${active ? 'text-primary' : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}>
    <div className={`transition-all duration-300 ${active ? 'scale-125 -translate-y-1' : ''}`}>{icon}</div>
    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-40'}`}>{label}</span>
  </button>
);

export default Sidebar;
