import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ChatInterface from './components/ChatInterface';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Leads from './components/Leads';
import Calendar from './components/Calendar';
import Properties from './components/Properties';
import Finances from './components/Finances';
import Admin from './components/Admin';
import Automation from './components/Automation';
import Chatbots from './components/Chatbots';
import ChatbotBuilder from './components/ChatbotBuilder';
import Campaigns from './components/Campaigns';
import UserManagement from './components/UserManagement';
import { ToastProvider } from './components/Toast';
import AlarmSystem, { AlarmItem } from './components/AlarmSystem';
import { Bot } from 'lucide-react';

/**
 * Componente interno que renderiza la aplicación autenticada.
 * Se separa para poder usar useAuth() dentro de AuthProvider.
 */
function AuthenticatedApp() {
  const { user, loading, logout, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('prexup_theme');
    return saved !== 'light';
  });

  React.useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('prexup_theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('prexup_theme', 'light');
    }
  }, [isDarkMode]);

  // Pantalla de carga premium
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#121212]">
        <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-700">
          <div className="w-16 h-16 bg-primary rounded-[24px] flex items-center justify-center shadow-2xl shadow-primary/40 animate-pulse">
            <Bot className="text-white" size={32} />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-xl font-black tracking-tight text-white">ChatPrex</h2>
            <p className="text-[10px] font-black uppercase tracking-[3px] text-primary opacity-60">Iniciando sistema premium</p>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay usuario, mostrar Login
  if (!user) {
    return <Login />;
  }

  /**
   * Control de acceso por rol:
   * - propietario: ve TODO
   * - administrador: ve todo excepto Configuración avanzada
   * - usuario: solo ve Dashboard, Conversaciones, Leads, Calendario, Tareas
   */
  const renderContent = () => {
    // Módulos que el 'usuario' NO puede ver
    const restrictedTabs = ['Administración', 'Configuración', 'Automatización', 'Conexión WP', 'Constructor Bots', 'Usuarios'];
    const adminOnly = ['Usuarios'];

    if (user.role === 'usuario' && restrictedTabs.includes(activeTab)) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
          <div className="w-20 h-20 rounded-[32px] bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-500/20">
             <Bot className="text-rose-500" size={40} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Acceso restringido</h2>
          <p className="body-text text-sm mt-3 max-w-sm opacity-60 font-bold uppercase tracking-widest text-[10px]">No tienes permisos para acceder a este módulo premium.</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'Dashboard': return <Dashboard isDarkMode={isDarkMode} />;
      case 'Leads Pipeline': return <Leads isDarkMode={isDarkMode} setActiveTab={setActiveTab} />;
      case 'Conversaciones': return <ChatInterface isDarkMode={isDarkMode} />;
      case 'Calendario': return <Calendar isDarkMode={isDarkMode} />;
      case 'Inventario': return <Properties isDarkMode={isDarkMode} />;
      case 'Finanzas': return <Finances isDarkMode={isDarkMode} />;
      case 'Campañas': return <Campaigns isDarkMode={isDarkMode} />;
      case 'Administración': return <Admin isDarkMode={isDarkMode} />;
      case 'Conexión WP': return <Chatbots isDarkMode={isDarkMode} />;
      case 'Constructor Bots': return <ChatbotBuilder isDarkMode={isDarkMode} />;
      case 'Configuración': return <Admin isDarkMode={isDarkMode} />;
      case 'Automatización': return <Automation isDarkMode={isDarkMode} />;
      case 'Usuarios': return <UserManagement isDarkMode={isDarkMode} />;
      default: return (
        <div className="flex-1 flex flex-col items-center justify-center p-10 animate-in fade-in duration-500">
          <p className="text-slate-500 font-black uppercase tracking-widest text-[11px] opacity-40">Módulo en construcción...</p>
        </div>
      );
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-500 ${isDarkMode ? 'bg-[#181619]' : 'bg-surface-dim'}`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        userRole={user.role}
        userName={user.name}
        onLogout={logout}
      />
      <main className="flex-1 flex flex-col relative h-full overflow-hidden">
        {renderContent()}
      </main>
      <AlarmSystem items={[]} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AuthenticatedApp />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
