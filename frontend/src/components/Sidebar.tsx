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
      <aside className={`hidden md:flex relative flex-col h-screen z-50 transition-all duration-300 ${isCollapsed ? 'w-[80px]' : 'w-72'} ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200 shadow-2xl'} border-r`}>
        
        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-4 top-8 z-50 w-8 h-8 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${dc ? 'bg-slate-800 text-slate-400 border border-slate-700' : 'bg-white text-slate-400 border border-slate-100'}`}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Brand Header */}
        <div className={`h-24 flex items-center ${isCollapsed ? 'px-4 justify-center' : 'px-8'}`}>
          <div className="flex items-center gap-4 w-full">
            <div className="w-11 h-11 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/40 shrink-0 transform rotate-3">
              <Bot className="text-white" size={24} />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <span className={`text-xl font-black tracking-tight lowercase ${dc ? 'text-white' : 'text-slate-800'}`}>ChatPrex</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                  <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-500">premium erp</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className={`flex-1 py-4 flex flex-col gap-1.5 overflow-x-hidden overflow-y-auto custom-scrollbar ${isCollapsed ? 'px-3' : 'px-4'}`}>
          <NavItem onClick={() => setActiveTab('Dashboard')} icon={<LayoutDashboard size={20} />} label="dashboard" active={activeTab === 'Dashboard'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Conversaciones')} icon={<MessageSquare size={20} />} label="conversaciones" active={activeTab === 'Conversaciones'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Leads Pipeline')} icon={<Users size={20} />} label="leads pipeline" active={activeTab === 'Leads Pipeline'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Calendario')} icon={<Calendar size={20} />} label="calendario" active={activeTab === 'Calendario'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Inventario')} icon={<Home size={20} />} label="propiedades" active={activeTab === 'Inventario'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Finanzas')} icon={<DollarSign size={20} />} label="finanzas" active={activeTab === 'Finanzas'} isDarkMode={dc} collapsed={isCollapsed} />
          <NavItem onClick={() => setActiveTab('Campañas')} icon={<PieChart size={20} />} label="campañas" active={activeTab === 'Campañas'} isDarkMode={dc} collapsed={isCollapsed} />
        </nav>

        <div className={`p-6 border-t shrink-0 flex flex-col gap-2 transition-colors ${dc ? 'border-slate-800' : 'border-slate-50'} ${isCollapsed ? 'px-3' : ''}`}>
          
          {canSee('propietario', 'administrador') && (
            <NavItem 
              onClick={() => setActiveTab('Usuarios')} 
              icon={<UserCog size={20} />} 
              label={isCollapsed ? "usuarios" : "gestión usuarios"} 
              active={activeTab === 'Usuarios'} 
              isDarkMode={dc} 
              collapsed={isCollapsed} 
            />
          )}

          {canSee('propietario', 'administrador') && !isCollapsed && (
            <NavGroup 
              icon={<Workflow size={20} />} 
              label="integraciones" 
              isOpen={openGroup === 'integraciones'} 
              onToggle={() => toggleGroup('integraciones')}
              isDarkMode={dc}
              active={['Conexión WP', 'Constructor Bots', 'Automatización'].includes(activeTab)}
            >
              <SubNavItem onClick={() => setActiveTab('Conexión WP')} label="conexión wp" active={activeTab === 'Conexión WP'} isDarkMode={dc} />
              <SubNavItem onClick={() => setActiveTab('Constructor Bots')} label="entrenamiento ia" active={activeTab === 'Constructor Bots'} isDarkMode={dc} />
              <SubNavItem onClick={() => setActiveTab('Automatización')} label="automatización" active={activeTab === 'Automatización'} isDarkMode={dc} />
            </NavGroup>
          )}

          {canSee('propietario') && !isCollapsed && (
            <NavGroup 
              icon={<Settings size={20} />} 
              label="ajustes" 
              isOpen={openGroup === 'ajustes'} 
              onToggle={() => toggleGroup('ajustes')}
              isDarkMode={dc}
              active={['Configuración', 'Administración'].includes(activeTab)}
            >
              <SubNavItem onClick={() => setActiveTab('Administración')} label="administración" active={activeTab === 'Administración'} isDarkMode={dc} />
              <SubNavItem onClick={() => setActiveTab('Configuración')} label="configuración" active={activeTab === 'Configuración'} isDarkMode={dc} />
            </NavGroup>
          )}

          <button 
            onClick={() => setIsDarkMode(!dc)} 
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 mt-2 rounded-[20px] transition-all duration-300 active:scale-95 ${dc ? 'bg-slate-900 text-amber-500' : 'bg-slate-50 text-indigo-500'}`}
          >
            <div className="flex items-center gap-3">
              {dc ? <Sun size={18} /> : <Moon size={18} />}
              {!isCollapsed && <span className="text-[11px] font-black uppercase tracking-widest">{dc ? 'día' : 'noche'}</span>}
            </div>
          </button>

          {userName && (
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 rounded-[24px] mt-2 ${dc ? 'bg-slate-900/40' : 'bg-slate-50/50 border border-slate-100'}`}>
              {isCollapsed ? (
                <button onClick={onLogout} className="transition-transform hover:scale-110 active:scale-90">
                  <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1649FF&color=fff&size=40`} alt="" className="w-8 h-8 rounded-xl" />
                </button>
              ) : (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1649FF&color=fff&size=40`} alt="" className="w-9 h-9 rounded-xl shrink-0 shadow-lg" />
                    <div className="min-w-0">
                      <p className={`text-[12px] font-black lowercase truncate ${dc ? 'text-white' : 'text-slate-800'}`}>{userName}</p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{userRole}</p>
                    </div>
                  </div>
                  <button onClick={onLogout} className={`p-2 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-200 text-slate-500'}`}>
                    <LogOut size={16} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Bottom Navigation Mobile */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around items-center h-20 px-2 z-50 shadow-2xl backdrop-blur-xl transition-all ${dc ? 'bg-[#1E1E1E]/90 border-slate-800' : 'bg-white/90 border-slate-100'}`}>
        <MobileNavItem onClick={() => setActiveTab('Dashboard')} icon={<LayoutDashboard size={20} />} label="dash" active={activeTab === 'Dashboard'} isDarkMode={dc} />
        <MobileNavItem onClick={() => setActiveTab('Leads Pipeline')} icon={<Users size={20} />} label="leads" active={activeTab === 'Leads Pipeline'} isDarkMode={dc} />
        <MobileNavItem onClick={() => setActiveTab('Conversaciones')} icon={<MessageSquare size={20} />} label="chats" active={activeTab === 'Conversaciones'} isDarkMode={dc} />
        <MobileNavItem onClick={() => setActiveTab('Inventario')} icon={<Home size={20} />} label="prop" active={activeTab === 'Inventario'} isDarkMode={dc} />
        <MobileNavItem onClick={() => setActiveTab('Calendario')} icon={<Calendar size={20} />} label="cal" active={activeTab === 'Calendario'} isDarkMode={dc} />
      </nav>
    </>
  );
};

const NavItem = ({ icon, label, active, onClick, isDarkMode, collapsed }: any) => (
  <button 
    onClick={onClick}
    className={`group relative flex items-center ${collapsed ? 'justify-center' : ''} gap-4 ${collapsed ? 'py-3' : 'px-5 py-3'} rounded-[20px] transition-all duration-300 active:scale-95 whitespace-nowrap ${
      active 
        ? 'bg-primary text-white shadow-2xl shadow-primary/30' 
        : (isDarkMode ? 'text-slate-500 hover:text-white hover:bg-slate-800/50' : 'text-slate-400 hover:text-primary hover:bg-slate-50')
    }`}
  >
    <span className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
    {!collapsed && <span className="text-[13px] font-black lowercase tracking-tight">{label}</span>}
    {collapsed && (
      <div className="absolute left-full ml-4 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-50 bg-slate-900 text-white shadow-2xl translate-x-2 group-hover:translate-x-0">
        {label}
      </div>
    )}
  </button>
);

const NavGroup = ({ icon, label, isOpen, onToggle, isDarkMode, children, active = false }: any) => (
  <div className="flex flex-col gap-1 w-full">
    <button 
      onClick={onToggle} 
      className={`w-full flex items-center justify-between p-4 rounded-[20px] transition-all duration-300 ${isDarkMode ? 'hover:bg-white/5 text-slate-500' : 'hover:bg-slate-50 text-slate-500'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`shrink-0 ${active ? 'text-primary scale-110' : ''}`}>{icon}</div>
        <span className={`text-[13px] font-black lowercase ${active ? (isDarkMode ? 'text-white' : 'text-slate-800') : ''}`}>{label}</span>
      </div>
      <ChevronRight size={16} className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
    </button>
    {isOpen && (
      <div className={`pl-10 flex flex-col gap-1 mt-1 border-l-2 ml-6 transition-colors animate-in slide-in-from-top-2 duration-300 ${isDarkMode ? 'border-slate-800' : 'border-slate-50'}`}>
        {children}
      </div>
    )}
  </div>
);

const SubNavItem = ({ label, active, onClick, isDarkMode }: any) => (
  <button 
    onClick={onClick} 
    className={`w-full text-left py-2 px-4 rounded-xl text-[12px] font-black lowercase transition-all ${active ? 'text-primary bg-primary/5' : (isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-500 hover:text-slate-800')}`}
  >
    {label}
  </button>
);

const MobileNavItem = ({ icon, label, active, isDarkMode, onClick }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 h-full gap-1.5 transition-all active:scale-75 ${active ? 'text-primary' : (isDarkMode ? 'text-slate-600' : 'text-slate-300')}`}>
    <div className={`transition-transform duration-300 ${active ? 'scale-110 -translate-y-1' : ''}`}>{icon}</div>
    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
    {active && <div className="w-1 h-1 rounded-full bg-primary absolute bottom-3"></div>}
  </button>
);

export default Sidebar;
