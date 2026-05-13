import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, DollarSign, Download, Filter, UserPlus, FileText, Plus, Search, Calendar as CalendarIcon, MapPin, Users, Calculator, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Finances({ isDarkMode }: { isDarkMode?: boolean }) {
 const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
 const [activeTab, setActiveTab] = useState<'finances' | 'clients'>('finances');
 const [exchangeRate, setExchangeRate] = useState(3.75);
 const [monthFilter, setMonthFilter] = useState(new Date().getMonth());
 const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
 const [transactions, setTransactions] = useState<any[]>([]);
 const [showTxForm, setShowTxForm] = useState(false);
 const [txForm, setTxForm] = useState({ date: new Date().toISOString().split('T')[0], client: '', concept: '', property: '', type: 'ingreso', amount: '', currency: 'local' });
 const [clients, setClients] = useState<any[]>([]);
 const [properties, setProperties] = useState<any[]>([]);
 const [agents, setAgents] = useState<any[]>([]);
 const [editingClient, setEditingClient] = useState<any>(null);
 const { token } = useAuth();
 
 useEffect(() => {
  if (!token) return;
  const headers = { Authorization: `Bearer ${token}` };
  fetch(`${API_URL}/api/data/finances/transactions`, { headers })
   .then(r => r.json()).then(data => { if (Array.isArray(data)) setTransactions(data.map((t: any) => ({
    id: t.id, date: t.date?.split('T')[0] || '', client: t.client_name || '', concept: t.description,
    property: '', type: t.type, amount: Number(t.amount), currency: t.currency || 'local'
   }))); }).catch(() => {});
  fetch(`${API_URL}/api/data/finances/clients`, { headers })
   .then(r => r.json()).then(data => { if (Array.isArray(data)) setClients(data); }).catch(() => {});
  fetch(`${API_URL}/api/properties`, { headers })
   .then(r => r.json()).then(data => { if (Array.isArray(data)) setProperties(data); }).catch(() => {});
  fetch(`${API_URL}/api/users`, { headers })
   .then(r => r.json()).then(data => { if (Array.isArray(data)) setAgents(data); }).catch(() => {});
 }, [token]);

 const [showClientForm, setShowClientForm] = useState(false);
 const [clientForm, setClientForm] = useState({ doc: '', name: '', phone: '', email: '', civilStatus: 'Soltero', spouseDoc: '', spouseName: '', spousePhone: '', address: '', city: '', notes: '', property: '', agent: '' });

 const filteredTransactions = useMemo(() => transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === monthFilter && d.getFullYear() === yearFilter; }), [transactions, monthFilter, yearFilter]);

 const { income, expense } = useMemo(() => {
  let inc = 0; let exp = 0;
  filteredTransactions.forEach(t => { const amtInLocal = t.currency === 'usd' ? t.amount * exchangeRate : t.amount; if (t.type === 'ingreso') inc += amtInLocal; else exp += amtInLocal; });
  return { income: inc, expense: exp };
 }, [filteredTransactions, exchangeRate]);

  const handleAddTx = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!txForm.amount || !txForm.concept) return; 
    try {
      const res = await fetch(`${API_URL}/api/data/finances/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...txForm, amount: parseFloat(txForm.amount) })
      });
      if (res.ok) {
        const newTx = await res.json();
        setTransactions([newTx, ...transactions]);
        setShowTxForm(false);
        setTxForm({ ...txForm, concept: '', amount: '' });
      }
    } catch (err) { console.error(err); }
  };

   const handleAddClient = async (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!clientForm.name) return; 
    try {
      const isEdit = !!editingClient;
      const url = isEdit ? `${API_URL}/api/data/finances/clients/${editingClient.id}` : `${API_URL}/api/data/finances/clients`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(clientForm)
      });
      if (res.ok) {
        const saved = await res.json();
        if (isEdit) {
          setClients(clients.map(c => c.id === saved.id ? saved : c));
        } else {
          setClients([saved, ...clients]);
        }
        setShowClientForm(false);
        setEditingClient(null);
        setClientForm({ doc: '', name: '', phone: '', email: '', civilStatus: 'Soltero', spouseDoc: '', spouseName: '', spousePhone: '', address: '', city: '', notes: '', property: '', agent: '' });
      }
    } catch (err) { console.error(err); }
  };

  const openEditClient = (client: any) => {
    setEditingClient(client);
    setClientForm({
      doc: client.doc || '',
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      civilStatus: client.civil_status || client.civilStatus || 'Soltero',
      spouseDoc: client.spouse_doc || client.spouseDoc || '',
      spouseName: client.spouse_name || client.spouseName || '',
      spousePhone: client.spouse_phone || client.spousePhone || '',
      address: client.address || '',
      city: client.city || client.district || '',
      notes: client.notes || '',
      property: client.property_id || client.property || '',
      agent: client.agent_id || client.agent || ''
    });
    setShowClientForm(true);
    setActiveTab('clients');
  };
 const formatMoney = (amount: number) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(amount);
 const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

 return (
  <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-surface-base">
   <div className="max-w-7xl mx-auto space-y-6">
    
    {/* Header & Tabs */}
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
     <div className="flex items-center gap-3">
       <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent/10 text-accent"><Wallet size={22} /></div>
       <div>
        <h1 className="h1">Gestión Financiera</h1>
        <p className="body-text text-sm">Flujo de caja y clientes</p>
       </div>
     </div>
     <div className="flex p-0.5 rounded-lg border border-edge bg-surface">
      <button onClick={() => setActiveTab('finances')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'finances' ? 'bg-accent text-content' : 'text-content-muted hover:text-content'}`}>Finanzas</button>
      <button onClick={() => setActiveTab('clients')} className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${activeTab === 'clients' ? 'bg-accent text-content' : 'text-content-muted hover:text-content'}`}>Clientes</button>
     </div>
    </div>

    {activeTab === 'finances' && (
     <div className="space-y-6">
      {/* Toolbar */}
      <div className="card p-4 flex flex-wrap gap-4 items-center justify-between">
       <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 border border-edge px-3 py-2 rounded-lg bg-surface-inset">
         <CalendarIcon size={14} className="text-accent" />
         <select value={monthFilter} onChange={e => setMonthFilter(Number(e.target.value))} className="bg-transparent text-xs font-medium outline-none cursor-pointer text-content">
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
         </select>
         <span className="text-content-muted">/</span>
         <select value={yearFilter} onChange={e => setYearFilter(Number(e.target.value))} className="bg-transparent text-xs font-medium outline-none cursor-pointer text-content">
          <option value={2026}>2026</option><option value={2025}>2025</option>
         </select>
        </div>
        <div className="flex items-center gap-2 border border-emerald-500/20 px-3 py-2 rounded-lg bg-emerald-500/5 text-emerald-600">
         <span className="text-xs font-medium">TC:</span>
         <input type="number" step="0.01" value={exchangeRate} onChange={e => setExchangeRate(Number(e.target.value))} className="w-12 bg-transparent font-medium outline-none text-right text-xs" />
        </div>
       </div>
       <button onClick={() => setShowTxForm(!showTxForm)} className="btn-primary">
        <Plus size={16} /> {showTxForm ? 'Cancelar' : 'Nuevo movimiento'}
       </button>
      </div>

      {/* Tx Form */}
      {showTxForm && (
       <form onSubmit={handleAddTx} className="card p-4 border-accent/20">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
         <div><label className="label-text mb-1 block">Fecha</label><input type="date" required value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} className="input-field text-xs" /></div>
         <div><label className="label-text mb-1 block">Tipo</label><select value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value})} className="input-field text-xs"><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></select></div>
         <div className="col-span-2"><label className="label-text mb-1 block">Concepto</label><input type="text" required placeholder="Descripción..." value={txForm.concept} onChange={e => setTxForm({...txForm, concept: e.target.value})} className="input-field text-xs" /></div>
         <div><label className="label-text mb-1 block">Moneda</label><select value={txForm.currency} onChange={e => setTxForm({...txForm, currency: e.target.value})} className="input-field text-xs"><option value="local">Local (S/.)</option><option value="usd">USD ($)</option></select></div>
         <div><label className="label-text mb-1 block">Monto</label><input type="number" required placeholder="0.00" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} className="input-field text-xs" /></div>
         <div className="flex items-end"><button type="submit" className="btn-secondary w-full py-2.5 text-xs">Guardar</button></div>
        </div>
       </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
       <StatCard label="Ingresos" value={formatMoney(income)} icon={<TrendingUp size={20} />} color="emerald" />
       <StatCard label="Egresos" value={formatMoney(expense)} icon={<TrendingDown size={20} />} color="red" />
       <StatCard label="Balance" value={formatMoney(income - expense)} icon={<DollarSign size={20} />} color="accent" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-edge flex justify-between items-center bg-surface-inset">
         <h3 className="text-sm font-semibold text-content">Historial de transacciones • {months[monthFilter]}</h3>
         <Download size={16} className="text-content-muted cursor-pointer hover:text-accent transition-colors" />
        </div>
        <div className="overflow-x-auto">
         <table className="w-full text-left">
           <thead>
            <tr className="text-xs font-medium text-content-muted border-b border-edge">
              <th className="px-5 py-3">Fecha</th><th className="px-5 py-3">Concepto / Cliente</th><th className="px-5 py-3">Tipo</th><th className="px-5 py-3 text-right">Original</th><th className="px-5 py-3 text-right">Local (equiv)</th>
            </tr>
           </thead>
           <tbody className="divide-y divide-edge">
            {filteredTransactions.map(t => {
             const isInc = t.type === 'ingreso';
             const eq = t.currency === 'usd' ? t.amount * exchangeRate : t.amount;
             return (
              <tr key={t.id} className="hover:bg-surface-inset transition-colors">
                <td className="px-5 py-3 text-xs text-content-muted">{t.date}</td>
                <td className="px-5 py-3"><p className="text-sm font-medium text-content">{t.concept}</p><p className="text-xs text-content-muted">{t.client || '-'}</p></td>
                <td className="px-5 py-3"><span className={`text-xs font-medium px-2 py-0.5 rounded-md ${isInc ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{t.type}</span></td>
                <td className="px-5 py-3 text-right text-xs text-content-muted">{t.currency === 'usd' ? `$${t.amount}` : `S/ ${t.amount}`}</td>
                <td className={`px-5 py-3 text-right text-sm font-semibold ${isInc ? 'text-emerald-500' : 'text-red-500'}`}>{isInc ? '+' : '-'}{formatMoney(eq)}</td>
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
     <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative flex-1 w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" size={16} />
          <input type="text" placeholder="Buscar por documento, nombre o celular..." className="input-field pl-10" />
        </div>
        <button 
          onClick={() => { 
            if(showClientForm && !editingClient) {
              setShowClientForm(false); 
            } else {
              setEditingClient(null);
              setClientForm({ doc: '', name: '', phone: '', email: '', civilStatus: 'Soltero', spouseDoc: '', spouseName: '', spousePhone: '', address: '', district: '', province: '', department: '', notes: '', property: '', agent: '' });
              setShowClientForm(true);
            }
          }} 
          className="btn-primary"
        >
          <UserPlus size={16} /> {showClientForm && !editingClient ? 'Cancelar' : 'Nuevo cliente'}
        </button>
       </div>

       {showClientForm && (
        <form onSubmit={handleAddClient} className="card p-5 border-accent/20">
         <div className="flex items-center justify-between border-b border-edge pb-3 mb-4">
          <h3 className="text-sm font-semibold text-content">{editingClient ? 'Editar Ficha del Cliente' : 'Nueva Ficha del Cliente / Venta'}</h3>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-3">
          {/* Fila 1: Datos Principales */}
          <div><label className="label-text mb-1 block">Documento</label><input type="text" required value={clientForm.doc} onChange={e => setClientForm({...clientForm, doc: e.target.value})} className="input-field text-xs py-2" placeholder="DNI / RUC"/></div>
          <div className="md:col-span-2"><label className="label-text mb-1 block">Nombre completo</label><input type="text" required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} className="input-field text-xs py-2" placeholder="Nombres y Apellidos"/></div>
          <div><label className="label-text mb-1 block">Estado Civil</label><select value={clientForm.civilStatus} onChange={e => setClientForm({...clientForm, civilStatus: e.target.value})} className="input-field text-xs py-2"><option value="Soltero">Soltero/a</option><option value="Casado">Casado/a</option><option value="Divorciado">Divorciado/a</option></select></div>

          {/* Fila 2: Contacto y Ciudad */}
          <div><label className="label-text mb-1 block">Teléfono</label><input type="text" value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} className="input-field text-xs py-2" placeholder="+51..."/></div>
          <div className="md:col-span-2"><label className="label-text mb-1 block">Email</label><input type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} className="input-field text-xs py-2" placeholder="correo@ejemplo.com"/></div>
          <div><label className="label-text mb-1 block">Ciudad</label><input type="text" value={clientForm.city} onChange={e => setClientForm({...clientForm, city: e.target.value})} className="input-field text-xs py-2" /></div>

          {/* Fila 3: Cónyuge (Condicional) */}
          {clientForm.civilStatus === 'Casado' && (
           <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-surface-inset rounded-xl border border-edge mt-1 mb-1">
            <div className="md:col-span-4"><p className="text-xs font-bold text-content-muted">Datos del Cónyuge</p></div>
            <div><label className="label-text mb-1 block">Documento Cónyuge</label><input type="text" value={clientForm.spouseDoc} onChange={e => setClientForm({...clientForm, spouseDoc: e.target.value})} className="input-field text-xs py-2 bg-surface" /></div>
            <div className="md:col-span-2"><label className="label-text mb-1 block">Nombre Cónyuge</label><input type="text" value={clientForm.spouseName} onChange={e => setClientForm({...clientForm, spouseName: e.target.value})} className="input-field text-xs py-2 bg-surface" /></div>
            <div><label className="label-text mb-1 block">Teléfono Cónyuge</label><input type="text" value={clientForm.spousePhone} onChange={e => setClientForm({...clientForm, spousePhone: e.target.value})} className="input-field text-xs py-2 bg-surface" /></div>
           </div>
          )}

          {/* Fila 4: Gestión, Venta y Domicilio */}
          <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-4 mt-1">
           <div className="md:col-span-2"><label className="label-text mb-1 block">Domicilio</label><input type="text" value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} className="input-field text-xs py-2" placeholder="Av. / Calle..." /></div>
           <div>
            <label className="label-text mb-1 block">Propiedad de Interés</label>
            <select value={clientForm.property} onChange={e => setClientForm({...clientForm, property: e.target.value})} className="input-field text-xs py-2">
             <option value="">Seleccionar propiedad...</option>
             {(properties || []).map(p => p ? <option key={p.id} value={p.id}>{p.name} - {p.project}</option> : null)}
            </select>
           </div>
           <div>
            <label className="label-text mb-1 block">Agente a cargo</label>
            <select value={clientForm.agent} onChange={e => setClientForm({...clientForm, agent: e.target.value})} className="input-field text-xs py-2">
             <option value="">Seleccionar agente...</option>
             {(agents || []).map(a => a ? <option key={a.id} value={a.id}>{a.name}</option> : null)}
            </select>
           </div>
          </div>

          {/* Fila 6: Notas */}
          <div className="md:col-span-4 mt-1">
           <label className="label-text mb-1 block">Notas</label>
           <textarea value={clientForm.notes} onChange={e => setClientForm({...clientForm, notes: e.target.value})} className="input-field text-xs py-2 h-16 resize-none" placeholder="Observaciones adicionales..."></textarea>
          </div>

          <div className="col-span-1 md:col-span-4 flex justify-end mt-2">
           <button type="submit" className="btn-primary text-xs py-2">{editingClient ? 'Actualizar Ficha' : 'Guardar Ficha'}</button>
          </div>
         </div>
        </form>
       )}

       <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
           <thead><tr className="text-xs font-medium text-content-muted border-b border-edge"><th className="px-5 py-3">Documento</th><th className="px-5 py-3">Cliente / Contacto</th><th className="px-5 py-3">Estado civil</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
           <tbody className="divide-y divide-edge">
             {clients.map(c => (
              <tr key={c.id} className="hover:bg-surface-inset transition-colors">
               <td className="px-5 py-3 text-xs font-medium text-content-muted">{c.doc}</td>
               <td className="px-5 py-3"><p className="text-sm font-medium text-content">{c.name}</p><p className="text-xs text-content-muted">{c.phone || '-'}</p></td>
               <td className="px-5 py-3"><span className="text-xs font-medium px-2 py-0.5 rounded-md bg-surface-inset text-content-muted">{c.civilStatus}</span></td>
               <td className="px-5 py-3 text-right"><button onClick={() => openEditClient(c)} className="text-xs font-medium text-accent hover:underline">Ver / Editar</button></td>
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

const StatCard = ({ label, value, icon, color }: any) => (
 <div className="card p-5">
   <div className="flex justify-between items-start mb-3">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : color === 'red' ? 'bg-red-500/10 text-red-500' : 'bg-accent/10 text-accent'}`}>{icon}</div>
   </div>
   <p className="label-text mb-1">{label}</p>
   <h3 className="text-xl font-bold text-content">{value}</h3>
 </div>
);
