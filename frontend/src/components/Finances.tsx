import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, Download, Filter, UserPlus, FileText, Plus, Search, Calendar as CalendarIcon, MapPin, Users, Calculator } from 'lucide-react';

export default function Finances({ isDarkMode }: { isDarkMode?: boolean }) {
  const [activeTab, setActiveTab] = useState<'finances' | 'clients'>('finances');
  
  // --- STATE: FINANCES ---
  const [exchangeRate, setExchangeRate] = useState(3.75); // Example exchange rate
  const [monthFilter, setMonthFilter] = useState(new Date().getMonth());
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  
  const [transactions, setTransactions] = useState([
    { id: 1, date: '2026-05-14', client: 'Ana Gómez', concept: 'Anticipo Reserva', property: 'Villa las Palmas', type: 'ingreso', amount: 25000, currency: 'local' },
    { id: 2, date: '2026-05-12', client: 'Agencia Marketing Z', concept: 'Campaña FB Ads', property: 'N/A', type: 'egreso', amount: 1200, currency: 'usd' },
    { id: 3, date: '2026-05-10', client: 'Carlos Mendoza', concept: 'Pago Total Depa', property: 'Torre Central 4B', type: 'ingreso', amount: 120000, currency: 'local' },
  ]);

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
  const [clients, setClients] = useState([
    { id: 1, doc: '71234567', name: 'Ana Gómez', phone: '987654321', email: 'ana@email.com', civilStatus: 'soltero' }
  ]);
  const [showClientForm, setShowClientForm] = useState(false);
  const [clientForm, setClientForm] = useState({
    doc: '', name: '', phone: '', email: '', civilStatus: 'soltero',
    spouseDoc: '', spouseName: '', spousePhone: '',
    address: '', district: '', province: '', department: ''
  });

  // --- CALCULATIONS ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === monthFilter && d.getFullYear() === yearFilter;
    });
  }, [transactions, monthFilter, yearFilter]);

  const { income, expense } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    filteredTransactions.forEach(t => {
      const amtInLocal = t.currency === 'usd' ? t.amount * exchangeRate : t.amount;
      if (t.type === 'ingreso') inc += amtInLocal;
      else exp += amtInLocal;
    });
    return { income: inc, expense: exp };
  }, [filteredTransactions, exchangeRate]);

  // --- HANDLERS ---
  const handleAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.amount || !txForm.concept) return;
    setTransactions([{ ...txForm, id: Date.now(), amount: parseFloat(txForm.amount) }, ...transactions]);
    setShowTxForm(false);
    setTxForm({ ...txForm, concept: '', amount: '' });
  };

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.name || !clientForm.doc) return;
    setClients([{ id: Date.now(), ...clientForm }, ...clients]);
    setShowClientForm(false);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
  };

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header & Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
          <div>
            <h1 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Gestión Financiera</h1>
            <p className={`text-[12px] md:text-[13px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Control de ingresos, egresos y tu base de clientes</p>
          </div>
          <div className={`flex w-full md:w-auto p-1 rounded-xl shadow-inner transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <button 
              onClick={() => setActiveTab('finances')}
              className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === 'finances' ? (isDarkMode ? 'bg-slate-700 text-primary shadow-sm' : 'bg-white text-primary shadow-sm') : 'text-slate-500 hover:text-slate-400'}`}
            >
              <Calculator size={16} /> Finanzas
            </button>
            <button 
              onClick={() => setActiveTab('clients')}
              className={`flex-1 md:flex-none flex justify-center items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold transition-all ${activeTab === 'clients' ? (isDarkMode ? 'bg-slate-700 text-primary shadow-sm' : 'bg-white text-primary shadow-sm') : 'text-slate-500 hover:text-slate-400'}`}
            >
              <Users size={16} /> Clientes
            </button>
          </div>
        </div>

        {activeTab === 'finances' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Toolbar: Filters & Exchange Rate */}
            <div className={`p-4 rounded-2xl border shadow-sm flex flex-wrap gap-4 items-center justify-between transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <CalendarIcon size={16} className="text-slate-400" />
                  <select 
                    value={monthFilter} 
                    onChange={e => setMonthFilter(Number(e.target.value))}
                    className={`bg-transparent text-sm font-semibold outline-none ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                  </select>
                  <select 
                    value={yearFilter} 
                    onChange={e => setYearFilter(Number(e.target.value))}
                    className={`bg-transparent text-sm font-semibold outline-none ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
                <div className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
                  <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-emerald-500' : 'text-emerald-800'}`}>TC:</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={exchangeRate}
                    onChange={e => setExchangeRate(Number(e.target.value))}
                    className={`w-16 bg-transparent text-sm font-bold outline-none text-right ${isDarkMode ? 'text-emerald-500' : 'text-emerald-700'}`}
                  />
                </div>
              </div>
              <button 
                onClick={() => setShowTxForm(!showTxForm)}
                className="bg-primary text-white px-4 py-2 rounded-xl text-[12px] md:text-[13px] font-semibold shadow-lg shadow-primary/20 hover:bg-primary-dark flex items-center gap-2 transition-all active:scale-95"
              >
                <Plus size={16} /> {showTxForm ? 'Cancelar' : 'Nuevo'}
              </button>
            </div>

            {/* Formulario Compacto de Movimientos */}
            {showTxForm && (
              <form onSubmit={handleAddTx} className="bg-white p-3 md:p-5 rounded-2xl border border-primary/20 shadow-sm animate-fade-in">
                <h3 className="font-semibold text-slate-800 mb-3 md:mb-4 flex items-center gap-2 text-sm"><DollarSign size={18} className="text-primary"/> Registrar Movimiento</h3>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 md:gap-3">
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] text-slate-500 font-medium">Fecha</label>
                    <input type="date" required value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="text-[10px] text-slate-500 font-medium">Tipo</label>
                    <select value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                      <option value="ingreso">Ingreso</option>
                      <option value="egreso">Egreso</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-500 font-medium">Concepto</label>
                    <input type="text" required placeholder="Concepto" value={txForm.concept} onChange={e => setTxForm({...txForm, concept: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] text-slate-500 font-medium">Moneda</label>
                    <select value={txForm.currency} onChange={e => setTxForm({...txForm, currency: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                      <option value="local">Local</option>
                      <option value="usd">USD</option>
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] text-slate-500 font-medium">Monto</label>
                    <input type="number" required placeholder="0.00" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-500 font-medium">Cliente</label>
                    <input type="text" placeholder="Buscar..." value={txForm.client} onChange={e => setTxForm({...txForm, client: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-500 font-medium">Propiedad</label>
                    <input type="text" placeholder="Buscar..." value={txForm.property} onChange={e => setTxForm({...txForm, property: e.target.value})} className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="col-span-2 flex items-end">
                    <button type="submit" className="w-full bg-slate-800 text-white p-2 rounded-lg text-sm font-semibold hover:bg-slate-700 transition-colors">
                      Guardar
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Resumen Financiero */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1">Ingresos Totales</p>
                  <h4 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{formatMoney(income)}</h4>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-emerald-500/10 text-emerald-500' : 'bg-emerald-50 text-emerald-500'}`}><ArrowUpRight size={20} /></div>
              </div>
              <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1">Egresos Totales</p>
                  <h4 className={`text-[18px] md:text-[20px] font-bold ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>{formatMoney(expense)}</h4>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-rose-500/10 text-rose-500' : 'bg-rose-50 text-rose-500'}`}><ArrowDownRight size={20} /></div>
              </div>
              <div className={`p-5 rounded-2xl border shadow-sm flex items-center justify-between relative overflow-hidden transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`absolute -right-4 -bottom-4 opacity-5 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}><DollarSign size={80} /></div>
                <div className="relative z-10">
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-1">Balance Neto</p>
                  <h4 className={`text-[18px] md:text-[20px] font-bold tracking-tight ${income - expense >= 0 ? (isDarkMode ? 'text-primary' : 'text-primary') : 'text-rose-500'}`}>
                    {formatMoney(income - expense)}
                  </h4>
                </div>
              </div>
            </div>

            {/* Tabla de Movimientos */}
            <div className={`rounded-2xl border shadow-sm overflow-hidden transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`p-4 border-b flex justify-between items-center transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50/50 border-slate-100'}`}>
                <h3 className={`font-bold text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Libro de Ingresos y Egresos ({months[monthFilter]})</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Local (TC: {exchangeRate})</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b text-[12px] font-bold transition-colors ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                      <th className="px-3 py-2.5 pl-6">Fecha</th>
                      <th className="px-3 py-2.5">Concepto</th>
                      <th className="px-3 py-2.5">Cliente / Propiedad</th>
                      <th className="px-3 py-2.5">Tipo</th>
                      <th className="px-3 py-2.5 text-right">Monto Original</th>
                      <th className="px-3 py-2.5 pr-6 text-right">Equiv. Local</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors ${isDarkMode ? 'divide-slate-800' : 'divide-slate-50'}`}>
                    {filteredTransactions.length === 0 ? (
                      <tr><td colSpan={6} className="p-6 text-center text-slate-500 text-sm">No hay movimientos en este periodo.</td></tr>
                    ) : filteredTransactions.map(t => {
                      const isIncome = t.type === 'ingreso';
                      const eqLocal = t.currency === 'usd' ? t.amount * exchangeRate : t.amount;
                      return (
                        <tr key={t.id} className="h-[42px] hover:bg-slate-50/50">
                          <td className="px-3 py-1 pl-4 text-[12px] text-slate-500">{t.date}</td>
                          <td className="px-3 py-1 text-[13px] font-semibold text-slate-800">{t.concept}</td>
                          <td className="px-3 py-1">
                            <div className="text-[13px] text-slate-700">{t.client || '-'}</div>
                            <div className="text-[11px] text-slate-400">{t.property || ''}</div>
                          </td>
                          <td className="px-3 py-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="px-3 py-1 text-right text-[12px] text-slate-500">
                            {t.currency === 'usd' ? `$${t.amount}` : `S/ ${t.amount}`}
                          </td>
                          <td className={`px-3 py-1 pr-4 text-right text-[13px] font-bold ${isIncome ? 'text-emerald-600' : 'text-red-600'}`}>
                            {isIncome ? '+' : '-'}{formatMoney(eqLocal)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================= CLIENTES TAB ============================= */}
        {activeTab === 'clients' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Buscar por documento, nombre..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none shadow-sm" />
              </div>
              <button 
                onClick={() => setShowClientForm(!showClientForm)}
                className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium shadow-sm hover:bg-primary/90 flex items-center gap-2"
              >
                <UserPlus size={16} /> {showClientForm ? 'Cancelar' : 'Nuevo Cliente'}
              </button>
            </div>

            {showClientForm && (
              <form onSubmit={handleAddClient} className="bg-white p-3 md:p-6 rounded-2xl border border-primary/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5"><UserPlus size={100} /></div>
                <h3 className="font-bold text-slate-800 mb-4 md:mb-6 flex items-center gap-2 text-sm md:text-lg border-b border-slate-100 pb-2 md:pb-3">Registro de Nuevo Cliente</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3 md:gap-y-5 relative z-10">
                  {/* Datos Personales */}
                  <div className="col-span-1 md:col-span-4"><h4 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Datos Personales</h4></div>
                  
                  <div className="col-span-1 md:col-span-1">
                    <label className="text-[10px] md:text-xs text-slate-600 font-medium">Documento (DNI/ID)</label>
                    <input type="text" required value={clientForm.doc} onChange={e => setClientForm({...clientForm, doc: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] md:text-xs text-slate-600 font-medium">Nombre y Apellidos</label>
                    <input type="text" required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm" />
                  </div>
                  <div className="col-span-1 md:col-span-1">
                    <label className="text-[10px] md:text-xs text-slate-600 font-medium">Teléfono</label>
                    <input type="text" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm" />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] md:text-xs text-slate-600 font-medium">Email</label>
                    <input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm" />
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] md:text-xs text-slate-600 font-medium">Estado Civil</label>
                    <select value={clientForm.civilStatus} onChange={e => setClientForm({...clientForm, civilStatus: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm">
                      <option value="soltero">Soltero/a</option>
                      <option value="casado">Casado/a</option>
                      <option value="divorciado">Divorciado/a</option>
                      <option value="viudo">Viudo/a</option>
                      <option value="conviviente">Conviviente</option>
                    </select>
                  </div>

                  {/* Datos Cónyuge */}
                  {(clientForm.civilStatus === 'casado' || clientForm.civilStatus === 'conviviente') && (
                    <>
                      <div className="col-span-1 md:col-span-4 mt-2"><h4 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Datos del Cónyugue</h4></div>
                      <div className="col-span-1 md:col-span-1">
                        <label className="text-[10px] md:text-xs text-slate-600 font-medium">DNI Cónyugue</label>
                        <input type="text" value={clientForm.spouseDoc} onChange={e => setClientForm({...clientForm, spouseDoc: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm" />
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <label className="text-[10px] md:text-xs text-slate-600 font-medium">Nombre Cónyugue</label>
                        <input type="text" value={clientForm.spouseName} onChange={e => setClientForm({...clientForm, spouseName: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm" />
                      </div>
                      <div className="col-span-1 md:col-span-1">
                        <label className="text-[10px] md:text-xs text-slate-600 font-medium">Teléfono Cónyugue</label>
                        <input type="text" value={clientForm.spousePhone} onChange={e => setClientForm({...clientForm, spousePhone: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm" />
                      </div>
                    </>
                  )}

                  {/* Dirección */}
                  <div className="col-span-1 md:col-span-4 mt-2"><h4 className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Ubicación</h4></div>
                  
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-[10px] md:text-xs text-slate-600 font-medium">Dirección Completa</label>
                    <input type="text" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm" />
                  </div>
                  <div className="col-span-1 md:col-span-2 grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] md:text-xs text-slate-600 font-medium">Distrito</label>
                      <input type="text" value={clientForm.district} onChange={e => setClientForm({...clientForm, district: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs text-slate-600 font-medium">Provincia</label>
                      <input type="text" value={clientForm.province} onChange={e => setClientForm({...clientForm, province: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm" />
                    </div>
                    <div>
                      <label className="text-[10px] md:text-xs text-slate-600 font-medium">Departam.</label>
                      <input type="text" value={clientForm.department} onChange={e => setClientForm({...clientForm, department: e.target.value})} className="w-full mt-1 md:mt-1.5 p-1.5 md:p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs md:text-sm" />
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-4 flex justify-end mt-2 md:mt-4">
                    <button type="submit" className="w-full md:w-auto bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs md:text-sm font-medium hover:bg-slate-700 transition-colors">
                      Guardar Cliente
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-xs text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="p-4 pl-6">Documento</th>
                    <th className="p-4">Cliente</th>
                    <th className="p-4">Contacto</th>
                    <th className="p-4">Estado Civil</th>
                    <th className="p-4 pr-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {clients.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="p-4 pl-6 text-sm font-medium text-slate-600">{c.doc}</td>
                      <td className="p-4">
                        <div className="text-sm font-bold text-slate-800">{c.name}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-600">{c.phone || '-'}</div>
                        <div className="text-xs text-slate-400">{c.email || ''}</div>
                      </td>
                      <td className="p-4 text-sm capitalize text-slate-500">{c.civilStatus}</td>
                      <td className="p-4 pr-6 flex justify-end gap-2">
                        <button className="text-xs text-primary hover:underline font-medium">Ver Ficha</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
