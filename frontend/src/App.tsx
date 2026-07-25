import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import ChatprexLanding from './components/ChatprexLanding';
import HomePortal from './components/HomePortal';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
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
import LeadIntelligence from './components/LeadIntelligence';
import UserManagement from './components/UserManagement';
import { ToastProvider } from './components/Toast';
import AlarmSystem, { AlarmItem } from './components/AlarmSystem';
import { Bot, Loader2, Home } from 'lucide-react';

/**
 * Componente interno que renderiza la aplicación autenticada.
 * Se separa para poder usar useAuth() dentro de AuthProvider.
 */
function AuthenticatedApp() {
 const { user, loading, logout, hasRole } = useAuth();
 const [activeTab, setActiveTab] = useState('Dashboard');
 const [showLogin, setShowLogin] = useState(false);
 const [isDarkMode, setIsDarkMode] = useState(() => {
  const saved = localStorage.getItem('prexup_theme');
  if (saved) return saved === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
 });

 React.useEffect(() => {
  if (isDarkMode) {
   document.documentElement.classList.add('dark');
   localStorage.setItem('prexup_theme', 'dark');
  } else {
   document.documentElement.classList.remove('dark');
   localStorage.setItem('prexup_theme', 'light');
   localStorage.setItem('casaya_theme', 'light');
  }
 }, [isDarkMode]);

 // Fetch pending tasks for alarms globally
 const [alarms, setAlarms] = useState<AlarmItem[]>([]);
 React.useEffect(() => {
  const fetchAlarms = async () => {
   const token = localStorage.getItem('casaya_token');
   if (!token) return;
   try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API_URL}/api/data/tasks`, {
     headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return;
    const data = await res.json();
    if (Array.isArray(data)) {
     const pendingAlarms = data
      .filter((t: any) => t.status !== 'completada' && t.status !== 'cancelada')
      .map((t: any) => {
       const dateObj = t.due_date ? new Date(t.due_date) : new Date();
       return {
        id: t.id.toString(),
        title: t.title || 'Recordatorio pendiente',
        type: (t.type?.toLowerCase() === 'cita' ? 'cita' : 'tarea') as 'cita' | 'tarea',
        subtype: t.type,
        dueDate: dateObj.toISOString().split('T')[0],
        dueTime: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
        leadName: t.lead_name || '',
        priority: t.description || 'media'
       };
      });
     setAlarms(pendingAlarms);
    }
   } catch (err) {
    console.error('Error fetching alarms', err);
   }
  };
  
  fetchAlarms();
  const intervalId = setInterval(fetchAlarms, 60000); // Check every minute
  return () => clearInterval(intervalId);
 }, []);

 // Pantalla de carga
 if (loading) {
  return (
   <div className="flex h-screen w-full items-center justify-center bg-surface-base">
    <div className="flex flex-col items-center gap-4">
     <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
      <Home className="text-white" size={24} />
     </div>
     <div className="flex flex-col items-center gap-1">
      <h2 className="h2">Casaya</h2>
      <p className="label-text">Iniciando sistema...</p>
     </div>
     <Loader2 size={20} className="text-accent animate-spin mt-2" />
    </div>
   </div>
  );
 }

  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const isAppSubdomain = hostname.startsWith('app.');
  // FORZADO TEMPORAL PARA VER LA LANDING B2B EN LOCALHOST:
  const isChatprexLanding = isLocalhost || hostname === 'chatprex.com' || hostname === 'www.chatprex.com';

  // Mostrar página estática de Políticas de Privacidad
  if (pathname === '/politicas-privacidad') {
    return <PrivacyPolicy />;
  }

  // Mostrar página estática de Términos de Servicio
  if (pathname === '/terminos-de-servicio') {
    return <TermsOfService />;
  }

  // Si no hay usuario, mostrar el Portal, la Landing B2B, o la pantalla de Login según el dominio
  if (!user) {
    if (isAppSubdomain) {
      return (
        <Login 
          onBack={() => {
            window.location.href = isLocalhost ? '/' : 'https://casaya.app';
          }}
        />
      );
    }

    if (showLogin) {
      if (isLocalhost) {
        return <Login onBack={() => setShowLogin(false)} />;
      }
      window.location.href = isLocalhost ? '/' : 'https://app.chatprex.com';
      return null;
    }

    // Mostrar B2B Landing Page si el dominio es chatprex.com o si forzamos la vista en modo local
    if (isChatprexLanding) {
      return <ChatprexLanding />;
    }

    return (
      <HomePortal
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onLoginClick={() => {
          if (isLocalhost) {
            setShowLogin(true);
          } else {
            window.location.href = 'https://app.chatprex.com';
          }
        }}
        isLoggedIn={false}
        onGoToDashboard={() => {}}
      />
    );
  }

  // Si está autenticado pero entra desde el dominio principal (casaya.com)
  if (!isAppSubdomain && !isLocalhost && activeTab !== 'Ver Portal') {
    return (
      <HomePortal
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onLoginClick={() => {}}
        isLoggedIn={true}
        onGoToDashboard={() => {
          window.location.href = 'https://app.chatprex.com';
        }}
      />
    );
  }

  // Si está autenticado pero quiere ver el portal público en pantalla completa desde el CRM
  if (activeTab === 'Ver Portal') {
    return (
      <HomePortal
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onLoginClick={() => {}}
        isLoggedIn={true}
        onGoToDashboard={() => setActiveTab('Dashboard')}
      />
    );
  }

 /**
  * Control de acceso por rol:
  * - propietario: ve TODO
  * - administrador: ve todo excepto Configuración avanzada
  * - usuario: solo ve Dashboard, Conversaciones, Leads, Calendario, Tareas
  */
 const renderContent = () => {
  const restrictedTabs = ['Administración', 'Configuración', 'Automatización', 'Conexión WP', 'Constructor Bots', 'Usuarios', 'Campañas'];

  if (user.role === 'usuario' && restrictedTabs.includes(activeTab)) {
   return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
     <div className="w-14 h-14 rounded-xl bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
       <Bot className="text-red-500" size={28} />
     </div>
     <h2 className="h2">Acceso restringido</h2>
     <p className="body-text mt-2 max-w-sm">No tienes permisos para acceder a este módulo.</p>
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
   case 'Inteligencia': return <LeadIntelligence isDarkMode={isDarkMode} />;
   case 'Administración': return <Admin isDarkMode={isDarkMode} defaultTab="proyectos" />;
   case 'Conexión WP': return <Chatbots isDarkMode={isDarkMode} />;
   case 'Constructor Bots': return <ChatbotBuilder isDarkMode={isDarkMode} />;
   case 'Configuración': return <Admin isDarkMode={isDarkMode} defaultTab="portal" />;
   case 'Automatización': return <Automation isDarkMode={isDarkMode} />;
   case 'Usuarios': return <UserManagement isDarkMode={isDarkMode} />;
   default: return (
    <div className="flex-1 flex flex-col items-center justify-center p-10">
     <p className="label-text">Módulo en construcción...</p>
    </div>
   );
  }
 };

 return (
  <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden font-sans bg-surface-base">
   <Sidebar
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    isDarkMode={isDarkMode}
    setIsDarkMode={setIsDarkMode}
    userRole={user.role}
    userName={user.name}
    onLogout={logout}
   />
   <main className="flex-1 min-w-0 flex flex-col relative h-full overflow-hidden">
    {renderContent()}
   </main>
   <AlarmSystem items={alarms} onNavigateToLeads={() => setActiveTab('Leads Pipeline')} />
  </div>
 );
}

function App() {
 React.useEffect(() => {
  const hostname = window.location.hostname;
  
  let title = 'CasaYa';
  let favicon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
  
  if (hostname.includes('chatprex.com')) {
   title = 'ChatPrex';
   favicon = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%232563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>';
  }

  document.title = title;
  
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
   link = document.createElement('link');
   link.rel = 'icon';
   document.getElementsByTagName('head')[0].appendChild(link);
  }
  link.href = favicon;
 }, []);

 return (
  <AuthProvider>
   <ToastProvider>
    <AuthenticatedApp />
   </ToastProvider>
  </AuthProvider>
 );
}

export default App;
