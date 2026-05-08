import React, { useState, useEffect } from 'react';
import { useAuth, User } from '../context/AuthContext';
import { Search, Plus, Edit2, Trash2, KeyRound, X, Shield, ShieldCheck, UserIcon, MoreHorizontal, UserPlus, Users } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const ROLE_LABELS: Record<string, string> = { propietario: 'Propietario', administrador: 'Administrador', usuario: 'Usuario' };
const STATUS_LABELS: Record<string, string> = { activo: 'Activo', suspendido: 'Suspendido', inactivo: 'Inactivo' };

const UserManagement = ({ isDarkMode }: { isDarkMode?: boolean }) => {
  const { token, user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'usuario' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterRole) params.set('role', filterRole);
      if (filterStatus) params.set('status', filterStatus);
      const res = await fetch(`${API_URL}/api/users?${params}`, { headers });
      const data = await res.json();
      if (res.ok) setUsers(data.users);
    } catch {}
  };

  useEffect(() => { fetchUsers(); }, [search, filterRole, filterStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/users`, { method: 'POST', headers, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Usuario creado exitosamente');
      setShowModal(false);
      setFormData({ name: '', email: '', password: '', phone: '', role: 'usuario' });
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setError('');
    try {
      const body: any = { name: formData.name, email: formData.email, phone: formData.phone, role: formData.role };
      const res = await fetch(`${API_URL}/api/users/${editingUser.id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Usuario actualizado');
      setShowModal(false);
      setEditingUser(null);
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${id}`, { method: 'DELETE', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Usuario eliminado');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); setTimeout(() => setError(''), 3000); }
  };

  const handleToggleStatus = async (u: User) => {
    const newStatus = u.status === 'activo' ? 'suspendido' : 'activo';
    try {
      const res = await fetch(`${API_URL}/api/users/${u.id}`, { method: 'PUT', headers, body: JSON.stringify({ status: newStatus }) });
      if (res.ok) { fetchUsers(); setSuccess(`Usuario ${newStatus === 'activo' ? 'activado' : 'suspendido'}`); setTimeout(() => setSuccess(''), 3000); }
    } catch {}
  };

  const handleResetPassword = async () => {
    if (!showPasswordModal || !newPassword) return;
    try {
      const res = await fetch(`${API_URL}/api/users/${showPasswordModal}/password`, { method: 'PUT', headers, body: JSON.stringify({ password: newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Contraseña actualizada');
      setShowPasswordModal(null);
      setNewPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) { setError(err.message); }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', phone: '', role: 'usuario' });
    setError('');
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setFormData({ name: u.name, email: u.email, password: '', phone: u.phone, role: u.role });
    setError('');
    setShowModal(true);
  };

  const dc = isDarkMode;
  const card = `rounded-[32px] border transition-all ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100 shadow-xl shadow-slate-200/40'}`;
  const input = `w-full px-5 py-3 rounded-2xl text-[13px] font-bold outline-none border transition-all ${dc ? 'bg-slate-900 border-slate-800 text-white focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 focus:border-primary focus:bg-white shadow-inner'}`;
  const label = "text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block";

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-10 pb-24 md:pb-10 transition-colors ${dc ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dc ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                <Users size={28} />
             </div>
             <div>
                <h1 className={`text-2xl font-black tracking-tight lowercase ${dc ? 'text-white' : 'text-slate-800'}`}>Gestión de Usuarios</h1>
                <p className="text-[10px] font-black uppercase tracking-[2px] text-slate-500">control de accesos y roles</p>
             </div>
          </div>
          {hasRole('propietario', 'administrador') && (
            <button onClick={openCreateModal} className="bg-primary text-white px-8 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-95 flex items-center gap-3">
              <UserPlus size={18} /> nuevo usuario
            </button>
          )}
        </div>

        {/* Alerts */}
        {(success || error) && (
          <div className={`p-5 rounded-2xl font-bold text-[12px] animate-in slide-in-from-top-4 duration-300 ${success ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
            {success || error}
          </div>
        )}

        {/* Toolbar / Filters */}
        <div className={card + ' p-8'}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)}
                className={input + ' pl-14'} />
            </div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={input}>
              <option value="">todos los roles</option>
              <option value="propietario">propietario</option>
              <option value="administrador">administrador</option>
              <option value="usuario">usuario</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={input}>
              <option value="">todos los estados</option>
              <option value="activo">activo</option>
              <option value="suspendido">suspendido</option>
              <option value="inactivo">inactivo</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className={card + ' overflow-hidden'}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`text-[10px] font-black uppercase tracking-widest border-b ${dc ? 'border-slate-800 text-slate-500' : 'border-slate-100 text-slate-400'}`}>
                  <th className="px-8 py-6">usuario</th>
                  <th className="px-8 py-6">rol</th>
                  <th className="px-8 py-6">estado</th>
                  <th className="px-8 py-6">contacto</th>
                  <th className="px-8 py-6 pr-10 text-right">acciones</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${dc ? 'divide-slate-800' : 'divide-slate-50'}`}>
                {users.map((u) => (
                  <tr key={u.id} className={`hover:bg-slate-50/30 transition-colors ${dc ? 'hover:bg-white/5' : ''}`}>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=1649FF&color=fff&size=80`} alt="" className="w-11 h-11 rounded-2xl object-cover shadow-lg" />
                        <div>
                          <p className={`text-[13px] font-black lowercase ${dc ? 'text-white' : 'text-slate-800'}`}>{u.name}</p>
                          <p className="text-[10px] font-bold text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${dc ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                          {ROLE_LABELS[u.role] || u.role}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${u.status === 'activo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                          <span className={`text-[11px] font-black lowercase ${dc ? 'text-slate-300' : 'text-slate-700'}`}>{u.status}</span>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-[11px] font-bold text-slate-500">{u.phone || '—'}</td>
                    <td className="px-8 py-5 pr-10 text-right">
                      {(u.role !== 'propietario' || currentUser?.role === 'propietario') && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEditModal(u)} className={`p-2.5 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-slate-100 text-blue-500'}`} title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => { setShowPasswordModal(u.id); setNewPassword(''); }} className={`p-2.5 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-amber-500'}`} title="Contraseña">
                            <KeyRound size={16} />
                          </button>
                          {u.role !== 'propietario' && (
                            <button onClick={() => handleDelete(u.id)} className={`p-2.5 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800 text-rose-400' : 'hover:bg-slate-100 text-rose-500'}`} title="Eliminar">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals with standard aesthetic */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className={card + ' w-full max-w-xl p-10 relative'}>
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"><X size={20} className="text-slate-400" /></button>
            <h3 className={`text-xl font-black lowercase mb-10 ${dc ? 'text-white' : 'text-slate-800'}`}>{editingUser ? 'editar usuario' : 'nuevo usuario'}</h3>
            
            <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={label}>nombre completo</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={input} />
                </div>
                <div>
                  <label className={label}>email</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={input} />
                </div>
                {!editingUser && (
                  <div>
                    <label className={label}>contraseña</label>
                    <input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={input} />
                  </div>
                )}
                <div>
                  <label className={label}>teléfono</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={input} />
                </div>
                <div className="md:col-span-2">
                  <label className={label}>rol de sistema</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className={input}>
                    <option value="usuario">usuario</option>
                    <option value="administrador">administrador</option>
                    <option value="propietario">propietario</option>
                  </select>
                </div>
              </div>
              <div className="pt-6">
                 <button type="submit" className="w-full bg-primary text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-[2px] shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98]">
                   {editingUser ? 'guardar cambios' : 'crear nuevo usuario'}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className={card + ' w-full max-w-md p-10 relative'}>
            <h3 className={`text-xl font-black lowercase mb-8 ${dc ? 'text-white' : 'text-slate-800'}`}>restablecer contraseña</h3>
            <div className="space-y-6">
              <div>
                <label className={label}>nueva contraseña</label>
                <input type="password" minLength={6} placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={input} />
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowPasswordModal(null)} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${dc ? 'border-slate-800 text-slate-500 hover:bg-slate-800' : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}>cancelar</button>
                <button onClick={handleResetPassword} className="flex-1 bg-primary text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all">guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
