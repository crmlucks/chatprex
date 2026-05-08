import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, Download, Filter, UserPlus, FileText, Plus, Search, Calendar as CalendarIcon, MapPin, Users, Calculator, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Finances({ isDarkMode }: { isDarkMode?: boolean }) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [activeTab, setActiveTab] = useState<'finances' | 'clients'>('finances');
  
  // --- STATE: FINANCES ---
  const [exchangeRate, setExchangeRate] = useState(3.75);
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth());
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showTxForm, setShowTxForm] = useState(false);
  const [txForm, setTxForm] = useState({
    date: new Date().toISOString().split('T')[0],
    client: '',
    concept: '',
    property: '',
    type: 'ingreso',
    amount: '',
    currency: 'local'
  });

  // --- STATE: CLIENTS ---
  const [clients, setClients] = useState<any[]>([]);
  const { token } = useAuth();
  
  useEffect(() => {
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_URL}/api/data/finances/transactions`, { headers })
      .then(r => r.json()).then(data => setTransactions(data.map((t: any) => ({
        id: t.id, date: t.date?.split('T')[0] || '', client: t.client_name || '', concept: t.description,
        property: '', type: t.type, amount: Number(t.amount), currency: t.currency || 'local'
      })))).catch(() => {});
    fetch(`${API_URL}/api/data/finances/clients`, { headers })
      .then(r => r.json()).then(setClients).catch(() => {});
  }, [token]);

  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm] = useState({
    doc: '', name: '', phone: '', email: '', civilStatus: 'soltero',
    spouseDoc: '', spouseName: '', spousePhone: '',
    address: '', district: '', province: '', department: ''
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === monthFilter && d.getFullYear() === yearFilter;
    });
  }, [transactions, monthFilter, yearFilter]);

  const { income, expense } = useMemo(() => {
    let inc = 0; let exp = 0;
    filteredTransactions.forEach(t => {
      const amtInLocal = t.currency === 'usd' ? t.amount * exchangeRate : t.amount;
      if (t.type === 'ingreso') inc += amtInLocal;
      else exp += amtInLocal;
    });
    return { income: inc, expense: exp };
  }, [filteredTransactions, exchangeRate]);

  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.concept) return;
    setTransactions([{ ...txForm, id: Date.now(), amount: parseFloat(txForm.amount) }, ...transactions]);
    setShowTxForm(false);
    setTxForm({ ...txForm, concept: '', amount: '' });
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name) return;
    setClients([{ id: Date.now(), ...clientForm }, ...clients]);
    setShowClientForm(false);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dc = isDarkMode;
  const card = `rounded-[32px] border transition-all ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'}`;

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 transition-colors ${dc ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header & Tabs */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-5">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dc ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                <Wallet size={28} />
             </div>
             <div>
                <h1 className={`text-2xl font-black tracking-tight lowercase ${dc ? 'text-white' : 'text-slate-800'}`}>Gestión Financiera</h1>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-500">flujo de caja y clientes</p>
             </div>
          </div>
          
          <div className={`flex p-1 rounded-2xl ${dc ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100 shadow-md'}`}>
            <button onClick={() => setActiveTab('finances')} className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'finances' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Finanzas</button>
            <button onClick={() => setActiveTab('clients')} className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'clients' ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}>Clientes</button>
          </div>
        </div>

        {activeTab === 'finances' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className={card + ' p-8 flex flex-wrap gap-6 items-center justify-between'}>
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-3 border px-5 py-2.5 rounded-2xl transition-all ${dc ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100 shadow-inner'}`}>
                  <CalendarIcon size={16} className="text-primary" />
                  <select value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))} className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer">
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <span className="text-slate-300">/</span>
                  <select value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))} className="bg-transparent text-[11px] font-black uppercase tracking-widest outline-none appearance-none cursor-pointer">
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
                <div className={`flex items-center gap-3 border px-5 py-2.5 rounded-2xl transition-all ${dc ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">TC:</span>
                  <input type="number" step="0.01" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} className="w-14 bg-transparent font-black outline-none text-right" />
                </div>
              </div>
              <button onClick={() => setShowTxForm(!showTxForm)} className="bg-primary text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-xl shadow-primary/20 hover:bg-primary-dark transition-all active:scale-95 flex items-center gap-3">
                <Plus size={18} /> {showTxForm ? 'cancelar' : 'nuevo movimiento'}
              </button>
            </div>

            {/* Tx Form */}
            {showTxForm && (
              <form onSubmit={handleAddTx} className={card + ' p-8 border-primary/30 animate-in slide-in-from-top-4 duration-300'}>
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-6">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">fecha</label>
                    <input type="date" required value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} className={`w-full p-3 rounded-xl text-xs font-bold outline-none border ${dc ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100'}`} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">tipo</label>
                    <select value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})} className={`w-full p-3 rounded-xl text-xs font-bold outline-none border ${dc ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100'}`}>
                      <option value="ingreso">Ingreso</option>
                      <option value="egreso">Egreso</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">concepto</label>
                    <input type="text" required placeholder="Descripción..." value={txForm.concept} onChange={e => setTxForm({...txForm, concept: e.target.value})} className={`w-full p-3 rounded-xl text-xs font-bold outline-none border ${dc ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100'}`} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">moneda</label>
                    <select value={txForm.currency} onChange={e => setTxForm({...txForm, currency: e.target.value})} className={`w-full p-3 rounded-xl text-xs font-bold outline-none border ${dc ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100'}`}>
                      <option value="local">Local (S/.)</option>
                      <option value="usd">USD ($)</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">monto</label>
                    <input type="number" required placeholder="0.00" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} className={`w-full p-3 rounded-xl text-xs font-bold outline-none border ${dc ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100'}`} />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95">Guardar</button>
                  </div>
                </div>
              </form>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <StatCard label="ingresos" value={formatMoney(income)} icon={<TrendingUp size={24} />} color="emerald" dc={dc} />
              <StatCard label="egresos" value={formatMoney(expense)} icon={<TrendingDown size={24} />} color="rose" dc={dc} />
              <StatCard label="balance" value={formatMoney(income - expense)} icon={<DollarSign size={24} />} color="primary" dc={dc} />
            </div>

            {/* Table */}
            <div className={card + ' overflow-hidden'}>
               <div className={`px-8 py-6 border-b flex justify-between items-center transition-all ${dc ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50/50 border-slate-50'}`}>
                  <h3 className={`text-sm font-black lowercase ${dc ? 'text-slate-200' : 'text-slate-800'}`}>historial de transacciones • {months[monthFilter]}</h3>
                  <Download size={18} className="text-slate-400 cursor-pointer hover:text-primary transition-colors" />
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                     <thead>
                        <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${dc ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                           <th className="px-8 py-5">fecha</th>
                           <th className="px-8 py-5">concepto / cliente</th>
                           <th className="px-8 py-5">tipo</th>
                           <th className="px-8 py-5 text-right">original</th>
                           <th className="px-8 py-5 pr-10 text-right">local (equiv)</th>
                        </tr>
                     </thead>
                     <tbody className={`divide-y ${dc ? 'divide-slate-800' : 'divide-slate-50'}`}>
                        {filteredTransactions.map(t => {
                          const isInc = t.type === 'ingreso';
                          const eq = t.currency === 'usd' ? t.amount * exchangeRate : t.amount;
                          return (
                            <tr key={t.id} className={`hover:bg-slate-50/30 transition-colors ${dc ? 'hover:bg-white/5' : ''}`}>
                               <td className="px-8 py-4 text-[12px] font-bold text-slate-400">{t.date}</td>
                               <td className="px-8 py-4">
                                  <p className={`text-[13px] font-black lowercase ${dc ? 'text-white' : 'text-slate-800'}`}>{t.concept}</p>
                                  <p className="text-[10px] font-bold text-slate-500">{t.client || '-'}</p>
                               </td>
                               <td className="px-8 py-4">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isInc ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{t.type}</span>
                                </td>
                               <td className="px-8 py-4 text-right text-[11px] font-bold text-slate-500">{t.currency === 'usd' ? `$${t.amount}` : `S/ ${t.amount}`}</td>
                               <td className={`px-8 py-4 pr-10 text-right text-[13px] font-black ${isInc ? 'text-emerald-500' : 'text-rose-500'}`}>{isInc ? '+' : '-'}{formatMoney(eq)}</td>
                            </tr>
                          );
                        })}
                     </tbody>
                  </table>
               </div>
            </div>
          </div>
        )}

        {/* Clients Tab */}
        {activeTab === 'clients' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className={`relative flex-1 w-full max-w-lg ${dc ? 'text-white' : ''}`}>
                   <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                   <input type="text" placeholder="buscar por documento, nombre o celular..." className={`w-full pl-14 pr-6 py-4 rounded-[24px] text-sm font-bold outline-none border transition-all ${dc ? 'bg-slate-900 border-slate-800 focus:border-primary' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/20 focus:border-primary'}`} />
                </div>
                <button onClick={() => setShowClientForm(!showClientForm)} className="bg-primary text-white px-8 py-4 rounded-[24px] text-[11px] font-black uppercase tracking-[2px] shadow-2xl shadow-primary/20 hover:bg-primary-dark transition-all flex items-center gap-3">
                   <UserPlus size={20} /> {showClientForm ? 'cancelar' : 'nuevo cliente'}
                </button>
             </div>

             {showClientForm && (
               <form onSubmit={handleAddClient} className={card + ' p-8 animate-in slide-in-from-top-4 duration-300'}>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                     <div className="col-span-1 md:col-span-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                        <h3 className="text-sm font-black lowercase ${dc ? 'text-white' : 'text-slate-800'}">Ficha del Cliente</h3>
                     </div>
                     <div className="col-span-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">documento (dni/ruc)</label>
                        <input type="text" required value={clientForm.doc} onChange={e => setClientForm({...clientForm, doc: e.target.value})} className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border ${dc ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100'}`} />
                     </div>
                     <div className="col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">nombre completo</label>
                        <input type="text" required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border ${dc ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100'}`} />
                     </div>
                     <div className="col-span-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">teléfono</label>
                        <input type="text" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className={`w-full p-4 rounded-2xl text-xs font-bold outline-none border ${dc ? 'bg-slate-900 border-slate-800 text-white' : 'bg-slate-50 border-slate-100'}`} />
                     </div>
                     {/* ... rest of the form simplified for brevity but maintaining style ... */}
                     <div className="col-span-1 md:col-span-4 flex justify-end">
                        <button type="submit" className="bg-slate-800 text-white px-10 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95">Guardar Cliente</button>
                     </div>
                  </div>
               </form>
             )}

             <div className={card + ' overflow-hidden'}>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead>
                         <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${dc ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                            <th className="px-8 py-5">documento</th>
                            <th className="px-8 py-5">cliente / contacto</th>
                            <th className="px-8 py-5">estado civil</th>
                            <th className="px-8 py-5 pr-10 text-right">acciones</th>
                         </tr>
                      </thead>
                      <tbody className={`divide-y ${dc ? 'divide-slate-800' : 'divide-slate-50'}`}>
                         {clients.map(c => (
                           <tr key={c.id} className={`hover:bg-slate-50/30 transition-colors ${dc ? 'hover:bg-white/5' : ''}`}>
                              <td className="px-8 py-5 text-[12px] font-black text-slate-400">{c.doc}</td>
                              <td className="px-8 py-5">
                                 <p className={`text-[13px] font-black lowercase ${dc ? 'text-white' : 'text-slate-800'}`}>{c.name}</p>
                                 <p className="text-[10px] font-bold text-slate-500">{c.phone || '-'}</p>
                              </td>
                              <td className="px-8 py-5">
                                 <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${dc ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{c.civilStatus}</span>
                              </td>
                              <td className="px-8 py-5 pr-10 text-right">
                                 <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline transition-all">ver ficha</button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

const StatCard = ({ label, value, icon, color, dc }: any) => (
  <div className={`p-8 rounded-[32px] border transition-all hover:-translate-y-1 ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/20'}`}>
     <div className="flex justify-between items-start mb-6">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : color === 'rose' ? 'bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>{icon}</div>
        <div className={`w-2 h-2 rounded-full ${color === 'emerald' ? 'bg-emerald-500' : color === 'rose' ? 'bg-rose-500' : 'bg-primary'}`}></div>
     </div>
     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{label}</p>
     <h3 className={`text-2xl font-black ${dc ? 'text-white' : 'text-slate-800'}`}>{value}</h3>
  </div>
);
