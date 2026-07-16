import React, { useState, useEffect } from 'react';
import { useAuth, User } from '../context/AuthContext';
import { Search, Plus, Edit2, Trash2, KeyRound, X, Shield, ShieldCheck, UserIcon, MoreHorizontal, UserPlus, Users, Upload } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const resolveUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/uploads')) {
    return `${API_URL}${url}`;
  }
  return url;
};

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
 const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', role: 'usuario', status: 'activo', avatar: '', canAccessIntegrations: false, auto_assign: false });
 const [uploadingImage, setUploadingImage] = useState(false);
 const fileInputRef = React.useRef<HTMLInputElement>(null);

 const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;
  
  setUploadingImage(true);
  try {
   const file = files[0];
   const formDataUpload = new FormData();
   formDataUpload.append('image', file);
   
   const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formDataUpload
   });
   if (res.ok) {
    const data = await res.json();
    setFormData(prev => ({ ...prev, avatar: data.url }));
   }
  } catch (err) {
   console.error("Error al subir avatar de usuario:", err);
  } finally {
   setUploadingImage(false);
  }
 };
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
   setFormData({ name: '', email: '', password: '', phone: '', role: 'usuario', status: 'activo', avatar: '', canAccessIntegrations: false, auto_assign: false });
   fetchUsers();
   setTimeout(() => setSuccess(''), 3000);
  } catch (err: any) { setError(err.message); }
 };

 const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!editingUser) return;
  setError('');
  try {
   const body: any = { name: formData.name, email: formData.email, phone: formData.phone, role: formData.role, status: formData.status, avatar: formData.avatar, canAccessIntegrations: formData.canAccessIntegrations, auto_assign: formData.auto_assign };
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

 const openCreateModal = () => {
  setEditingUser(null);
  setFormData({ name: '', email: '', password: '', phone: '', role: 'usuario', status: 'activo', avatar: '', canAccessIntegrations: false, auto_assign: false });
  setError('');
  setShowModal(true);
 };

 const openEditModal = (u: User) => {
  setEditingUser(u);
  setFormData({ name: u.name, email: u.email, password: '', phone: u.phone, role: u.role, status: u.status || 'activo', avatar: u.avatar || '', canAccessIntegrations: (u as any).canAccessIntegrations || false, auto_assign: (u as any).auto_assign || false });
  setError('');
  setShowModal(true);
 };

 const dc = isDarkMode;
 const card = `card`;
 const input = `input-field py-1.5 h-9 text-[11px]`;
 const label = "text-[10px] font-bold text-content-muted mb-1 block ml-1 uppercase tracking-tight";

 return (
  <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 bg-surface-base">
   <div className="max-w-6xl mx-auto space-y-6">
    
    {/* Header */}
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
     <div className="flex items-center gap-4">
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dc ? 'bg-accent/20 text-accent' : 'bg-accent/10 text-accent'}`}>
         <Users size={20} />
       </div>
       <div>
         <h1 className="text-xl font-bold tracking-tight text-content">Gestión de Usuarios</h1>
         <p className="text-[10px] font-bold text-content-muted uppercase tracking-wider">Control de accesos y roles</p>
       </div>
     </div>
     {hasRole('propietario', 'administrador') && (
      <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 px-4 py-2 text-xs">
       <UserPlus size={16} /> nuevo usuario
      </button>
     )}
    </div>

    {/* Alerts */}
    {(success || error) && (
     <div className={`p-3 rounded-xl font-bold text-[11px] uppercase tracking-tight ${success ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
      {success || error}
     </div>
    )}

    {/* Toolbar / Filters */}
    <div className={card + ' p-4'}>
     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="relative">
       <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-content-muted" size={16} />
       <input type="text" placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)}
        className={input + ' pl-12'} />
      </div>
      <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={input}>
       <option value="">Todos los roles</option>
       <option value="propietario">Propietario</option>
       <option value="administrador">Administrador</option>
       <option value="usuario">Usuario</option>
      </select>
      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={input}>
       <option value="">Todos los estados</option>
       <option value="activo">Activo</option>
       <option value="suspendido">Suspendido</option>
       <option value="inactivo">Inactivo</option>
      </select>
     </div>
    </div>

    {/* Users Table */}
    <div className={card + ' overflow-hidden'}>
     <div className="overflow-x-auto">
      <table className="w-full text-left">
       <thead>
        <tr className={`text-[10px] font-bold text-content-muted border-b uppercase tracking-wider ${dc ? 'bg-surface-raised border-edge' : 'bg-surface-inset border-edge'}`}>
         <th className="px-6 py-4">Usuario</th>
         <th className="px-6 py-4">Rol</th>
         <th className="px-6 py-4 text-center">Estado</th>
         <th className="px-6 py-4">Contacto</th>
         <th className="px-6 py-4 text-right">Acciones</th>
        </tr>
       </thead>
       <tbody className={`divide-y ${dc ? 'divide-edge' : 'divide-slate-100'}`}>
        {users.length === 0 ? (
          <tr><td colSpan={5} className="px-6 py-10 text-center text-xs font-bold text-content-muted uppercase">No hay usuarios registrados</td></tr>
        ) : users.map((u) => (
         <tr key={u.id} className="hover:bg-surface-inset transition-colors group">
          <td className="px-6 py-3">
           <div className="flex items-center gap-3">
            <img src={resolveUrl(u.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2563eb&color=fff&size=80`} alt="" className="w-8 h-8 rounded-lg object-cover shadow-sm" />
            <div>
             <p className="text-xs font-bold text-content group-hover:text-accent transition-colors">{u.name}</p>
             <p className="text-[10px] text-content-muted">{u.email}</p>
            </div>
           </div>
          </td>
          <td className="px-6 py-3">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-surface-inset border border-edge text-content-muted uppercase tracking-tighter">
             {ROLE_LABELS[u.role] || u.role}
            </span>
          </td>
          <td className="px-6 py-3">
            <div className="flex items-center justify-center gap-2">
             <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${u.status === 'activo' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
             <span className="text-[10px] font-black uppercase tracking-tighter text-content-secondary">{u.status}</span>
            </div>
          </td>
          <td className="px-6 py-3 text-[10px] font-bold text-content-muted">{u.phone || '—'}</td>
          <td className="px-6 py-3 text-right">
           {(u.role !== 'propietario' || currentUser?.role === 'propietario') && (
            <div className="flex justify-end gap-1">
             <button onClick={() => openEditModal(u)} className="p-2 rounded-lg hover:bg-surface-raised text-accent transition-all active:scale-90" title="Editar">
              <Edit2 size={14} />
             </button>
             <button onClick={() => { setShowPasswordModal(u.id); setNewPassword(''); }} className="p-2 rounded-lg hover:bg-surface-raised text-amber-500 transition-all active:scale-90" title="Contraseña">
              <KeyRound size={14} />
             </button>
             {u.role !== 'propietario' && (
              <button onClick={() => handleDelete(u.id)} className="p-2 rounded-lg hover:bg-surface-raised text-red-500 transition-all active:scale-90" title="Eliminar">
               <Trash2 size={14} />
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

   {/* Modal Genérico Standardized */}
   {showModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
     <div className="card w-full max-w-xl p-6 relative">
      <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-surface-inset transition-colors"><X size={18} className="text-content-muted" /></button>
      <h3 className="text-md font-bold text-content mb-4">{editingUser ? 'Editar usuario' : 'Nuevo usuario'}</h3>
      
      <form onSubmit={editingUser ? handleUpdate : handleCreate} className="space-y-4">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
         <label className={label}>Nombre completo</label>
         <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={input} />
        </div>
        <div>
         <label className={label}>Email</label>
         <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className={input} />
        </div>
        {!editingUser && (
         <div>
          <label className={label}>Contraseña</label>
          <input type="password" required minLength={6} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className={input} />
         </div>
        )}
        <div>
         <label className={label}>Teléfono</label>
         <input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className={input} />
        </div>
        <div className="md:col-span-2 flex items-center gap-4 py-2">
         <div className="shrink-0 text-center">
          <label className={label}>Avatar</label>
          <div onClick={() => !uploadingImage && fileInputRef.current?.click()} className="w-12 h-12 rounded-xl border border-dashed border-edge flex items-center justify-center cursor-pointer hover:border-accent/50 transition-colors overflow-hidden bg-surface-inset">
           {uploadingImage ? <span className="text-[9px] text-content-muted">...</span> : formData.avatar ? <img src={resolveUrl(formData.avatar)} className="w-full h-full object-cover" /> : <Upload size={16} className="text-content-muted" />}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
         </div>
         
         <div className="flex-1 space-y-2">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-edge bg-surface cursor-pointer hover:bg-surface-inset transition-all">
           <input type="checkbox" checked={formData.canAccessIntegrations} onChange={e => setFormData({...formData, canAccessIntegrations: e.target.checked})} className="w-4 h-4 rounded text-accent focus:ring-0 bg-surface-inset border-edge" />
           <div>
            <span className="text-[11px] font-bold text-content block uppercase tracking-tight">Acceso a Integraciones</span>
            <span className="text-[9px] text-content-muted font-bold uppercase opacity-70">WhatsApp, IA y Webhooks</span>
           </div>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-edge bg-surface cursor-pointer hover:bg-surface-inset transition-all">
           <input type="checkbox" checked={formData.auto_assign} onChange={e => setFormData({...formData, auto_assign: e.target.checked})} className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-surface-inset border-edge" />
           <div>
            <span className="text-[11px] font-bold text-content block uppercase tracking-tight">Asignación Automática</span>
            <span className="text-[9px] text-content-muted font-bold uppercase opacity-70">Recibe leads aleatoriamente</span>
           </div>
          </label>
         </div>
        </div>

        <div>
         <label className={label}>Rol de sistema</label>
         <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })} className={input}>
          <option value="usuario">Usuario</option>
          <option value="administrador">Administrador</option>
          <option value="propietario">Propietario</option>
         </select>
        </div>
        <div>
         <label className={label}>Estado de la cuenta</label>
         <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className={input}>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
         </select>
        </div>
       </div>
       <div className="pt-4">
         <button type="submit" className="btn-primary w-full py-2.5 text-xs font-black uppercase tracking-widest">
          {editingUser ? 'guardar cambios' : 'crear nuevo usuario'}
         </button>
       </div>
      </form>
     </div>
    </div>
   )}

   {/* Password Modal */}
   {showPasswordModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
     <div className="card w-full max-w-md p-6 relative">
      <h3 className="text-md font-bold text-content mb-4">Restablecer contraseña</h3>
      <div className="space-y-4">
       <div>
        <label className={label}>Nueva contraseña</label>
        <input type="password" minLength={6} placeholder="••••••••" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={input} />
       </div>
       <div className="flex gap-3 pt-2">
        <button onClick={() => setShowPasswordModal(null)} className="flex-1 py-2 rounded-lg text-[10px] font-black uppercase border border-edge text-content-muted hover:bg-surface-inset transition-colors">Cancelar</button>
        <button onClick={handleResetPassword} className="flex-1 btn-primary py-2 text-[10px] font-black uppercase tracking-widest">Guardar</button>
       </div>
      </div>
     </div>
    </div>
   )}
  </div>
 );
};

export default UserManagement;
