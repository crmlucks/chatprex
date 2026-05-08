import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, LogIn, UserPlus, Bot, ShieldCheck } from 'lucide-react';

const Login = () => {
  const { login, setup, needsSetup } = useAuth();
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
  const input = "w-full px-6 py-4 rounded-2xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-sm font-medium";
  const label = "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 block ml-1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] relative overflow-hidden font-sans">
      {/* Premium Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[150px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] rounded-full bg-blue-600/10 blur-[150px] animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(22,73,255,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-in fade-in zoom-in duration-1000">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-primary border border-primary/20 mb-8 shadow-3xl shadow-primary/40 transform rotate-3 transition-transform hover:rotate-0 duration-700">
            <Bot size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter">ChatPrex</h1>
          <div className="flex items-center justify-center gap-3 mt-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)] animate-pulse"></div>
            <p className="text-slate-500 text-[11px] font-black uppercase tracking-[4px] opacity-80">Premium crm erp</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-[#1A1A1A]/80 backdrop-blur-3xl border border-white/5 rounded-[48px] p-12 shadow-3xl">
          <div className="mb-10">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {showSetupForm ? 'Configuración inicial' : 'Bienvenido de nuevo'}
            </h2>
            <p className="body-text text-xs mt-2 opacity-60 font-medium">
              {showSetupForm
                ? 'Crea la cuenta raíz para administrar el sistema'
                : 'Ingresa tus credenciales para acceder al panel'}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold animate-in shake duration-500">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {showSetupForm && (
              <div className="grid grid-cols-1 gap-8 animate-in slide-in-from-top-4 duration-700">
                <div>
                  <label className={label}>Nombre completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={input}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className={label}>Teléfono corporativo</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className={input}
                    placeholder="+51 900 000 000"
                  />
                </div>
              </div>
            )}

            <div>
              <label className={label}>Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={input}
                placeholder="hola@chatprex.com"
              />
            </div>

            <div>
              <label className={label}>Contraseña de acceso</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={input + " pr-16"}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-primary transition-all duration-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[3px] shadow-2xl shadow-primary/40 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-4 group"
              >
                {loading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : showSetupForm ? (
                  <><UserPlus size={20} className="group-hover:scale-110 transition-transform" /> Inicializar sistema</>
                ) : (
                  <><LogIn size={20} className="group-hover:scale-110 transition-transform" /> Entrar al sistema</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <div className="flex items-center gap-4 py-3 px-6 rounded-full bg-white/5 border border-white/5 backdrop-blur-md">
             <ShieldCheck size={16} className="text-emerald-500" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 opacity-80">Conexión segura ssl 256-bit</span>
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest opacity-60">
            © {new Date().getFullYear()} ChatPrex Cloud · v2.0 Production
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
