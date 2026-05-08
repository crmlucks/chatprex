import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, UserPlus, Bot, ShieldCheck, Loader2 } from 'lucide-react';

const Login = () => {
 const { login, setup, needsSetup, demoLogin } = useAuth();
 const [isSetup, setIsSetup] = useState(false);
 const [showPassword, setShowPassword] = useState(false);
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 // Form fields
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [name, setName] = useState('');
 const [phone, setPhone] = useState('');

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
   if (needsSetup || isSetup) {
    await setup({ name, email, password, phone });
   } else {
    await login(email, password);
   }
  } catch (err: any) {
   setError(err.message || 'Error desconocido');
  } finally {
   setLoading(false);
  }
 };

 const showSetupForm = needsSetup || isSetup;
 const inputCls = "w-full px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-content placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-medium";
 const labelCls = "text-xs font-medium text-zinc-400 mb-1.5 block";

 return (
  <div className="min-h-screen flex items-center justify-center bg-zinc-950 font-sans">
   <div className="w-full max-w-md px-6">
    {/* Logo Section */}
    <div className="text-center mb-10">
     <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-blue-600 mb-6">
      <Bot size={32} className="text-content" />
     </div>
     <h1 className="text-3xl font-bold text-content tracking-tight">ChatPrex</h1>
     <div className="flex items-center justify-center gap-2 mt-2">
      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
      <p className="text-zinc-500 text-xs font-medium">Premium CRM ERP</p>
     </div>
    </div>

    {/* Auth Card */}
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
     <div className="mb-8">
      <h2 className="text-xl font-semibold text-content">
       {showSetupForm ? 'Configuración inicial' : 'Bienvenido de nuevo'}
      </h2>
      <p className="text-sm text-zinc-400 mt-1">
       {showSetupForm
        ? 'Crea la cuenta raíz para administrar el sistema'
        : 'Ingresa tus credenciales para acceder al panel'}
      </p>
     </div>

     {error && (
      <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
       {error}
      </div>
     )}

     <form onSubmit={handleSubmit} className="space-y-5">
      {showSetupForm && (
       <div className="space-y-5">
        <div>
         <label className={labelCls}>Nombre completo</label>
         <input
          type="text"
          required
          value={name}
          onChange={e => setName(e.target.value)}
          className={inputCls}
          placeholder="Ej. Juan Pérez"
         />
        </div>
        <div>
         <label className={labelCls}>Teléfono corporativo</label>
         <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className={inputCls}
          placeholder="+51 900 000 000"
         />
        </div>
       </div>
      )}

      <div>
       <label className={labelCls}>Correo electrónico</label>
       <input
        type="email"
        required
        value={email}
        onChange={e => setEmail(e.target.value)}
        className={inputCls}
        placeholder="hola@chatprex.com"
       />
      </div>

      <div>
       <label className={labelCls}>Contraseña de acceso</label>
       <div className="relative">
        <input
         type={showPassword ? 'text' : 'password'}
         required
         minLength={6}
         value={password}
         onChange={e => setPassword(e.target.value)}
         className={inputCls + " pr-12"}
         placeholder="••••••••"
        />
        <button
         type="button"
         onClick={() => setShowPassword(!showPassword)}
         className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
         {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
       </div>
      </div>

      <div className="pt-2 space-y-3">
       <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-blue-600 text-content font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
       >
        {loading ? (
         <Loader2 size={18} className="animate-spin" />
        ) : showSetupForm ? (
         <><UserPlus size={18} /> Inicializar sistema</>
        ) : (
         <><LogIn size={18} /> Entrar al sistema</>
        )}
       </button>
       
       <button
        type="button"
        onClick={demoLogin}
        className="w-full py-3 rounded-lg bg-zinc-800 text-zinc-300 font-semibold text-sm hover:bg-zinc-700 transition-colors flex items-center justify-center gap-2"
       >
        <Eye size={18} /> Acceso Demo (Modo Diseño)
       </button>
      </div>
     </form>
    </div>

    {/* Footer Info */}
    <div className="mt-8 flex flex-col items-center gap-4">
     <div className="flex items-center gap-2 py-2 px-4 rounded-lg bg-zinc-900 border border-zinc-800">
       <ShieldCheck size={14} className="text-emerald-500" />
       <span className="text-xs font-medium text-zinc-500">Conexión segura SSL 256-bit</span>
     </div>
     <p className="text-zinc-600 text-xs font-medium">
      © {new Date().getFullYear()} ChatPrex Cloud · v2.0
     </p>
    </div>
   </div>
  </div>
 );
};

export default Login;
