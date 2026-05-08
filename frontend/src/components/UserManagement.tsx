import React, { useState, useEffect } from 'react';
import { useAuth, User } from '../context/AuthContext';
import { Search, Plus, Edit2, Trash2, KeyRound, X, Shield, ShieldCheck, UserIcon, MoreHorizontal } from 'lucide-react';

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
  const [actionMenu, setActionMenu] = useState<number | null>(null);

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'propietario': return <ShieldCheck size={14} className="text-amber-400" />;
      case 'administrador': return <Shield size={14} className="text-blue-400" />;
      default: return <UserIcon size={14} className="text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      activo: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      suspendido: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      inactivo: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${styles[status] || styles.inactivo}`}>
        {STATUS_LABELS[status] || status}
      </span>
    );
  };

  const bg = isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim';
  const cardBg = isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-800';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const inputBg = isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800';

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 transition-colors ${bg}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-[18px] md:text-[20px] font-bold ${textPrimary}`}>Gestión de Usuarios</h1>
            <p className={`text-[12px] md:text-[13px] mt-1 font-medium ${textSecondary}`}>Administra los miembros de tu equipo y sus permisos</p>
          </div>
          {hasRole('propietario', 'administrador') && (
            <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20">
              <Plus size={16} /> Nuevo Usuario
            </button>
          )}
        </div>

        {/* Alerts */}
        {success && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">{success}</div>}
        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">{error}</div>}

        {/* Filters */}
        <div className={`p-4 rounded-2xl border ${cardBg}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${inputBg}`} />
            </div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={`py-2 px-3 border rounded-xl text-sm ${inputBg}`}>
              <option value="">Todos los roles</option>
              <option value="propietario">Propietario</option>
              <option value="administrador">Administrador</option>
              <option value="usuario">Usuario</option>
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={`py-2 px-3 border rounded-xl text-sm ${inputBg}`}>
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="suspendido">Suspendido</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className={isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'}>
                  <th className={`p-3 text-left text-[10px] font-bold tracking-wider ${textSecondary}`}>usuario</th>
                  <th className={`p-3 text-left text-[10px] font-bold tracking-wider ${textSecondary}`}>rol</th>
                  <th className={`p-3 text-left text-[10px] font-bold tracking-wider ${textSecondary}`}>estado</th>
                  <th className={`p-3 text-left text-[10px] font-bold tracking-wider ${textSecondary}`}>teléfono</th>
                  <th className={`p-3 text-right text-[10px] font-bold tracking-wider ${textSecondary}`}>acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className={`border-t transition-colors ${isDarkMode ? 'border-slate-800 hover:bg-slate-800/30' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img src={u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=random&size=40`} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                        <div>
                          <p className={`text-sm font-semibold ${textPrimary}`}>{u.name}</p>
                          <p className={`text-xs ${textSecondary}`}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        {getRoleIcon(u.role)}
                        <span className={`text-xs font-medium ${textPrimary}`}>{ROLE_LABELS[u.role] || u.role}</span>
                      </div>
                    </td>
                    <td className="p-3">{getStatusBadge(u.status)}</td>
                    <td className={`p-3 text-xs ${textSecondary}`}>{u.phone || '—'}</td>
                    <td className="p-3 text-right relative">
                      {u.role !== 'propietario' || currentUser?.role === 'propietario' ? (
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => openEditModal(u)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`} title="Editar">
                            <Edit2 size={14} className="text-blue-400" />
                          </button>
                          <button onClick={() => { setShowPasswordModal(u.id); setNewPassword(''); }} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`} title="Cambiar contraseña">
                            <KeyRound size={14} className="text-amber-400" />
                          </button>
                          {u.role !== 'propietario' && (
                            <>
                              <button onClick={() => handleToggleStatus(u)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`} title={u.status === 'activo' ? 'Suspender' : 'Activar'}>
                                <Shield size={14} className={u.status === 'activo' ? 'text-amber-400' : 'text-emerald-400'} />
                              </button>
                              {hasRole('propietario') && (
                                <button onClick={() => handleDelete(u.id)} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`} title="Eliminar">
                                  <Trash2 size={14} className="text-red-400" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className={`text-xs ${textSecondary}`}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className={`p-8 text-center ${textSecondary}`}>
                      <p className="text-sm">No se encontraron usuarios</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${isDarkMode ? 'bg-[#1E1E1E] border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className={`text-lg font-bold ${textPrimary}`}>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={() => { setShowModal(false); setEditingUser(null); setError(''); }} className="p-1 rounded-lg hover:bg-slate-700/50"><X size={18} className="text-slate-400" /></button>
            </div>
            {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
              <div>
                <label className={`block text-[9px] font-bold mb-1 tracking-wider ${textSecondary}`}>nombre</label>
                <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`w-full px-3 py-2 border rounded-xl text-sm ${inputBg}`} />
              </div>
              <div>
                <label className={`block text-[9px] font-bold mb-1 tracking-wider ${textSecondary}`}>email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={`w-full px-3 py-2 border rounded-xl text-sm ${inputBg}`} />
              </div>
              {!editingUser && (
                <div>
                  <label className={`block text-[9px] font-bold mb-1 tracking-wider ${textSecondary}`}>contraseña</label>
                  <input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={`w-full px-3 py-2 border rounded-xl text-sm ${inputBg}`} />
                </div>
              )}
              <div>
                <label className={`block text-[9px] font-bold mb-1 tracking-wider ${textSecondary}`}>teléfono</label>
                <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={`w-full px-3 py-2 border rounded-xl text-sm ${inputBg}`} />
              </div>
              <div>
                <label className={`block text-[9px] font-bold mb-1 tracking-wider ${textSecondary}`}>rol</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className={`w-full px-3 py-2 border rounded-xl text-sm ${inputBg}`}>
                  <option value="usuario">Usuario</option>
                  <option value="administrador">Administrador</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20">
                {editingUser ? 'guardar cambios' : 'crear usuario'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-2xl ${isDarkMode ? 'bg-[#1E1E1E] border-slate-700' : 'bg-white border-slate-200'}`}>
            <h3 className={`text-lg font-bold mb-4 ${textPrimary}`}>restablecer contraseña</h3>
            {error && <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            <input type="password" minLength={6} placeholder="Nueva contraseña (mín. 6 caracteres)" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className={`w-full px-3 py-2 border rounded-xl text-sm mb-4 ${inputBg}`} />
            <div className="flex gap-3">
              <button onClick={() => { setShowPasswordModal(null); setError(''); }} className={`flex-1 py-2 rounded-xl text-sm font-bold border ${isDarkMode ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}>Cancelar</button>
              <button onClick={handleResetPassword} className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 shadow-lg shadow-primary/20">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
