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

/**
 * Componente interno que renderiza la aplicación autenticada.
 * Se separa para poder usar useAuth() dentro de AuthProvider.
 */
function AuthenticatedApp() {
  const { user, loading, logout, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('Conversaciones');
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

  // Pantalla de carga
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Cargando ChatPrex...</p>
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
        <div className="flex-1 flex flex-col items-center justify-center">
          <p className={`font-bold text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>🔒 Acceso Restringido</p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No tienes permisos para acceder a este módulo.</p>
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
        <div className="flex-1 flex items-center justify-center bg-surface-dim">
          <p className="text-slate-500">Módulo en construcción...</p>
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
