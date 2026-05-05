// src/components/TaskPanel.tsx
import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, Filter, CheckCircle, Clock, XCircle } from 'lucide-react';

// Mock task data – in a real app this would come from an API
const MOCK_TASKS = [
  { id: 1, title: 'Llamada a cliente Carlos', type: 'Call', status: 'Pending', date: '2026-05-08' },
  { id: 2, title: 'Cita de visita a Villa Norte', type: 'Meeting', status: 'Completed', date: '2026-05-06' },
  { id: 3, title: 'Enviar propuesta a Ana', type: 'Task', status: 'Pending', date: '2026-05-10' },
  { id: 4, title: 'Revisar documentación de contrato', type: 'Task', status: 'Completed', date: '2026-05-04' },
  { id: 5, title: 'Llamada de seguimiento', type: 'Call', status: 'Pending', date: '2026-05-09' },
];

type Task = typeof MOCK_TASKS[0];

type FilterState = {
  search: string;
  type: string; // '' means all
  status: string; // '' means all
  startDate: string; // ISO date
  endDate: string; // ISO date
};

export const TaskPanel: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    type: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  // Filtering logic – memoized for performance
  const filteredTasks = useMemo(() => {
    return MOCK_TASKS.filter((t) => {
      const matchesSearch = t.title.toLowerCase().includes(filters.search.toLowerCase());
      const matchesType = filters.type ? t.type === filters.type : true;
      const matchesStatus = filters.status ? t.status === filters.status : true;
      const matchesStart = filters.startDate ? new Date(t.date) >= new Date(filters.startDate) : true;
      const matchesEnd = filters.endDate ? new Date(t.date) <= new Date(filters.endDate) : true;
      return matchesSearch && matchesType && matchesStatus && matchesStart && matchesEnd;
    });
  }, [filters]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', type: '', status: '', startDate: '', endDate: '' });
  };

  const rowBg = isDarkMode ? 'bg-[#1E1E1E] hover:bg-[#2A2A2A]' : 'bg-white hover:bg-gray-50';
  const textColor = isDarkMode ? 'text-slate-300' : 'text-slate-800';

  return (
    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
      <h3 className={`font-bold mb-4 ${textColor}`}>Panel de Control – Tareas y Citas</h3>
      {/* Filtros avanzados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <input
          type="text"
          name="search"
          placeholder="Buscar…"
          value={filters.search}
          onChange={handleChange}
          className={`p-2 rounded-xl border ${isDarkMode ? 'bg-[#2A2A2A] border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-800'}`}
        />
        <select name="type" value={filters.type} onChange={handleChange}
          className={`p-2 rounded-xl border ${isDarkMode ? 'bg-[#2A2A2A] border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-800'}`}
        >
          <option value="">Todos los tipos</option>
          <option value="Call">Llamada</option>
          <option value="Meeting">Reunión</option>
          <option value="Task">Tarea</option>
        </select>
        <select name="status" value={filters.status} onChange={handleChange}
          className={`p-2 rounded-xl border ${isDarkMode ? 'bg-[#2A2A2A] border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-800'}`}
        >
          <option value="">Todos los estados</option>
          <option value="Pending">Pendiente</option>
          <option value="Completed">Completado</option>
        </select>
        <div className="flex gap-2 items-center">
          <input type="date" name="startDate" value={filters.startDate} onChange={handleChange}
            className={`p-2 rounded-xl border ${isDarkMode ? 'bg-[#2A2A2A] border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-800'}`}
          />
          <input type="date" name="endDate" value={filters.endDate} onChange={handleChange}
            className={`p-2 rounded-xl border ${isDarkMode ? 'bg-[#2A2A2A] border-slate-700 text-slate-300' : 'bg-white border-slate-300 text-slate-800'}`}
          />
          <button onClick={clearFilters}
            className="p-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition" title="Limpiar filtros">
            <Filter size={16} />
          </button>
        </div>
      </div>
      {/* Tabla de resultados */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] table-auto">
          <thead>
            <tr className="text-xs uppercase bg-slate-100 ${isDarkMode ? 'bg-slate-800' : ''}" >
              <th className="p-2 text-left text-lg font-bold">Título</th>
              <th className="p-2 text-left text-lg font-bold">Tipo</th>
              <th className="p-2 text-left text-lg font-bold">Estado</th>
              <th className="p-2 text-left text-lg font-bold">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {filteredTasks.map((task) => (
              <tr key={task.id} className={`${rowBg} ${textColor}`} >
                <td className="p-2">{task.title}</td>
                <td className="p-2">{task.type}</td>
                <td className="p-2">
                  {task.status === 'Completed' ? (
                    <span className="flex items-center gap-1 text-emerald-500"><CheckCircle size={14} />{task.status}</span>
                  ) : (
                    <span className="flex items-center gap-1 text-amber-500"><Clock size={14} />{task.status}</span>
                  )}
                </td>
                <td className="p-2 flex items-center gap-1"><CalendarIcon size={14} />{task.date}</td>
              </tr>
            ))}
            {filteredTasks.length === 0 && (
              <tr className={rowBg}>
                <td colSpan={4} className={`p-4 text-center ${textColor}`}>No hay tareas que coincidan con los filtros.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskPanel;
