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
import LeadIntelligence from './components/LeadIntelligence';
import UserManagement from './components/UserManagement';
import { ToastProvider } from './components/Toast';
import AlarmSystem, { AlarmItem } from './components/AlarmSystem';
import { Bot, Loader2 } from 'lucide-react';

/**
 * Componente interno que renderiza la aplicación autenticada.
 * Se separa para poder usar useAuth() dentro de AuthProvider.
 */
function AuthenticatedApp() {
 const { user, loading, logout, hasRole } = useAuth();
 const [activeTab, setActiveTab] = useState('Dashboard');
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
  }
 }, [isDarkMode]);

 // Fetch pending tasks for alarms globally
 const [alarms, setAlarms] = useState<AlarmItem[]>([]);
 React.useEffect(() => {
  const fetchAlarms = async () => {
   const token = localStorage.getItem('chatprex_token');
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
      <Bot className="text-content" size={24} />
     </div>
     <div className="flex flex-col items-center gap-1">
      <h2 className="h2">ChatPrex</h2>
      <p className="label-text">Iniciando sistema...</p>
     </div>
     <Loader2 size={20} className="text-accent animate-spin mt-2" />
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
   case 'Administración': return <Admin isDarkMode={isDarkMode} />;
   case 'Conexión WP': return <Chatbots isDarkMode={isDarkMode} />;
   case 'Constructor Bots': return <ChatbotBuilder isDarkMode={isDarkMode} />;
   case 'Configuración': return <Admin isDarkMode={isDarkMode} />;
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
   <main className="flex-1 flex flex-col relative h-full overflow-hidden">
    {renderContent()}
   </main>
   <AlarmSystem items={alarms} />
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
