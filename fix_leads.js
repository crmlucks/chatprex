const fs = require('fs');
const path = 'frontend/src/components/Leads.tsx';
let c = fs.readFileSync(path, 'utf8');

// 1. Add delete button to notes
c = c.replace(
  /{note\.time}<\/span>/,
  `{note.time}</span>\n              <button onClick={() => deleteNote(note.id)} className="p-1 text-content-muted hover:text-rose-500 rounded-lg transition-all"><Trash2 size={12} /></button>`
);

// 2. Add empty state for notes after ))}\n        </div>
c = c.replace(
  /(\)\)\}\n\s+<\/div>\n\s+<\/div>\n\s+\)\}\n\n\s+\{activeTab === 'historial')/,
  `))}\n         {notes.length === 0 && <div className="p-10 text-center text-content-muted text-xs italic">Sin notas registradas.</div>}\n        </div>\n       </div>\n      )}\n\n      {activeTab === 'historial'`
);

// 3. Replace old historial with new API-powered one
const oldHistorial = c.match(/\{activeTab === 'historial' && \(\n[\s\S]*?\n\s+\)\}/);
if (oldHistorial) {
  const newHistorial = `{activeTab === 'historial' && (
       <div className="space-y-0 relative pl-8">
        <div className={\`absolute left-[15px] top-0 bottom-0 w-0.5 \${dc ? 'bg-surface-raised' : 'bg-slate-200'}\`}></div>
        {historyLoading ? (
         <div className="p-12 text-center"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p className="text-sm font-bold text-content-muted">Cargando...</p></div>
        ) : history.length === 0 ? (
         <div className="card-premium p-12 text-center flex flex-col items-center">
          <History size={32} className="opacity-20 mb-3" />
          <p className="text-sm font-bold text-content-muted">Sin historial registrado</p>
         </div>
        ) : history.map((item: any, i: number) => {
         const gc = () => { if (item.category==='task') return item.status==='completada'?(dc?'bg-emerald-500/15 text-emerald-400':'bg-emerald-50 text-emerald-600'):(dc?'bg-blue-500/15 text-blue-400':'bg-blue-50 text-blue-600'); if (item.category==='note') return dc?'bg-purple-500/15 text-purple-400':'bg-purple-50 text-purple-600'; return item.icon==='sent'?(dc?'bg-accent/15 text-accent':'bg-accent/10 text-accent'):(dc?'bg-slate-500/15 text-slate-400':'bg-slate-100 text-slate-600'); };
         const gi = () => { if (item.category==='task') return item.icon==='calendar'?<CalendarDays size={14}/>:<CheckCircle2 size={14}/>; if (item.category==='note') return <FileText size={14}/>; return item.icon==='sent'?<Send size={14}/>:<MessageSquare size={14}/>; };
         const ts = new Date(item.timestamp); const tStr = ts.toLocaleDateString('es',{day:'2-digit',month:'short'})+' '+ts.toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});
         return (
          <div key={item.id||i} className="flex gap-6 relative py-3 group">
           <div className={\`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 border-2 \${dc?'border-[#1E1E1E]':'border-white shadow-sm'} \${gc()}\`}>{gi()}</div>
           <div className={\`flex-1 p-4 rounded-xl border transition-all group-hover:shadow-sm \${dc?'bg-surface-raised/40 border-edge':'bg-surface border-edge'}\`}>
            <div className="flex justify-between items-start mb-1 gap-2"><span className="text-xs font-bold text-content">{item.title}</span><span className="text-[10px] font-bold text-content-muted whitespace-nowrap">{tStr}</span></div>
            {item.description && <p className="text-xs text-content-muted leading-relaxed line-clamp-2">{item.description}</p>}
            {item.status && <span className={\`inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-lg \${item.status==='completada'?'bg-emerald-500/10 text-emerald-500':'bg-amber-500/10 text-amber-500'}\`}>{item.status}</span>}
           </div>
          </div>);
        })}
       </div>
      )}`;
  c = c.replace(oldHistorial[0], newHistorial);
}

fs.writeFileSync(path, c, 'utf8');
console.log('Done! File updated successfully.');
