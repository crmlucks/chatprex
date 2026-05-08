import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

type Task = { id: number; title: string; type: string; status: string; date: string };
type FilterState = { search: string; type: string; status: string; startDate: string; endDate: string };

export const TaskPanel: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
 const [tasks, setTasks] = useState<Task[]>([]);

 useEffect(() => {
  fetch(`${API_URL}/api/data/tasks`)
   .then(r => r.json())
   .then(data => setTasks(data.map((t: any) => ({
    id: t.id, title: t.title, type: t.type || 'Task',
    status: t.status === 'completada' ? 'Completed' : 'Pending',
    date: t.due_date ? t.due_date.split('T')[0] : ''
   }))))
   .catch(() => {});
 }, []);

 const [filters, setFilters] = useState<FilterState>({ search: '', type: '', status: '', startDate: '', endDate: '' });

 const filteredTasks = useMemo(() => tasks.filter(t => {
  const matchesSearch = t.title.toLowerCase().includes(filters.search.toLowerCase());
  const matchesType = filters.type ? t.type === filters.type : true;
  const matchesStatus = filters.status ? t.status === filters.status : true;
  const matchesStart = filters.startDate ? new Date(t.date) >= new Date(filters.startDate) : true;
  const matchesEnd = filters.endDate ? new Date(t.date) <= new Date(filters.endDate) : true;
  return matchesSearch && matchesType && matchesStatus && matchesStart && matchesEnd;
 }), [filters, tasks]);

 const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
  setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
 };

 return (
  <div className="card p-5">
   <h3 className="text-sm font-semibold text-content mb-4">Panel de Control – Tareas y Citas</h3>
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
    <input type="text" name="search" placeholder="Buscar…" value={filters.search} onChange={handleChange} className="input-field" />
    <select name="type" value={filters.type} onChange={handleChange} className="input-field">
     <option value="">Todos los tipos</option>
     <option value="Call">Llamada</option>
     <option value="Meeting">Reunión</option>
     <option value="Task">Tarea</option>
    </select>
    <select name="status" value={filters.status} onChange={handleChange} className="input-field">
     <option value="">Todos los estados</option>
     <option value="Pending">Pendiente</option>
     <option value="Completed">Completado</option>
    </select>
    <div className="flex gap-2 items-center">
     <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} className="input-field" />
     <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} className="input-field" />
     <button onClick={() => setFilters({ search: '', type: '', status: '', startDate: '', endDate: '' })} className="p-2 rounded-lg bg-accent text-content hover:bg-accent-hover transition-colors" title="Limpiar filtros">
      <Filter size={16} />
     </button>
    </div>
   </div>
   <div className="overflow-x-auto">
    <table className="w-full min-w-[600px] table-auto">
     <thead>
      <tr className="text-xs font-medium text-content-muted border-b border-edge">
       <th className="p-3 text-left">Título</th>
       <th className="p-3 text-left">Tipo</th>
       <th className="p-3 text-left">Estado</th>
       <th className="p-3 text-left">Fecha</th>
      </tr>
     </thead>
     <tbody className="divide-y divide-edge">
      {filteredTasks.map(task => (
       <tr key={task.id} className="hover:bg-surface-inset transition-colors text-sm text-content">
        <td className="p-3 font-medium">{task.title}</td>
        <td className="p-3 text-content-secondary">{task.type}</td>
        <td className="p-3">
         {task.status === 'Completed' ? (
          <span className="flex items-center gap-1 text-emerald-500 text-xs font-medium"><CheckCircle size={14} />{task.status}</span>
         ) : (
          <span className="flex items-center gap-1 text-amber-500 text-xs font-medium"><Clock size={14} />{task.status}</span>
         )}
        </td>
        <td className="p-3 flex items-center gap-1 text-content-muted text-xs"><CalendarIcon size={14} />{task.date}</td>
       </tr>
      ))}
      {filteredTasks.length === 0 && (
       <tr><td colSpan={4} className="p-8 text-center text-content-muted text-sm">No hay tareas que coincidan con los filtros.</td></tr>
      )}
     </tbody>
    </table>
   </div>
  </div>
 );
};

export default TaskPanel;
