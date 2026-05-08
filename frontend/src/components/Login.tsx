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
  const input = "w-full px-5 py-3.5 rounded-2xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all text-[13px] font-bold";
  const label = "text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#121212] relative overflow-hidden">
      {/* Premium Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(22,73,255,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[28px] bg-primary border border-primary/20 mb-6 shadow-2xl shadow-primary/40 transform rotate-3 transition-transform hover:rotate-0 duration-500">
            <Bot size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter lowercase">ChatPrex</h1>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[3px]">premium crm erp</p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-[#1E1E1E]/80 backdrop-blur-3xl border border-slate-800/50 rounded-[40px] p-10 shadow-2xl">
          <div className="mb-8">
            <h2 className="text-xl font-black text-white lowercase">
              {showSetupForm ? 'configuración inicial' : 'bienvenido de nuevo'}
            </h2>
            <p className="text-slate-500 text-[11px] font-bold mt-1">
              {showSetupForm
                ? 'crea la cuenta raíz para administrar el sistema'
                : 'ingresa tus credenciales para acceder al panel'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[12px] font-bold animate-in shake duration-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {showSetupForm && (
              <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-top-4 duration-500">
                <div>
                  <label className={label}>nombre completo</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className={input}
                    placeholder="ej. juan pérez"
                  />
                </div>
                <div>
                  <label className={label}>teléfono corporativo</label>
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
              <label className={label}>correo electrónico</label>
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
              <label className={label}>contraseña de acceso</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={input + " pr-14"}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-primary text-white font-black text-[12px] uppercase tracking-[3px] shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : showSetupForm ? (
                  <><UserPlus size={18} /> inicializar sistema</>
                ) : (
                  <><LogIn size={18} /> entrar al sistema</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 py-2 px-4 rounded-full bg-white/5 border border-white/5">
             <ShieldCheck size={14} className="text-emerald-500" />
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">conexión segura ssl 256-bit</span>
          </div>
          <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
            © {new Date().getFullYear()} ChatPrex Cloud · v2.0 Production
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
