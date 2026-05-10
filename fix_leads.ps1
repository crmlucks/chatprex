$path = 'c:\Chatprex\frontend\src\components\Leads.tsx'
$raw = [System.IO.File]::ReadAllBytes($path)

# Detect encoding
if ($raw[0] -eq 0xFF -and $raw[1] -eq 0xFE) {
    $text = [System.Text.Encoding]::Unicode.GetString($raw, 2, $raw.Length - 2)
    Write-Host "UTF-16 LE detected"
} elseif ($raw[0] -eq 0xEF -and $raw[1] -eq 0xBB -and $raw[2] -eq 0xBF) {
    $text = [System.Text.Encoding]::UTF8.GetString($raw, 3, $raw.Length - 3)
    Write-Host "UTF-8 BOM detected"
} else {
    $text = [System.Text.Encoding]::UTF8.GetString($raw)
    Write-Host "UTF-8 detected"
}

# Replace the NewLeadModal component (from line 866 to 931)
$oldModal = @"
const NewLeadModal = ({ editLead, isDarkMode, onClose, onSave, pipelineStages }: any) => {
 const dc = isDarkMode;
 const [formData, setFormData] = useState(editLead || { name: '', phone: '', email: '', project: '', status: 'Nuevo', score: '50', source: 'Directo' });
 
 const inputCls = ``w-full p-3 rounded-xl border text-xs font-bold outline-none transition-all focus:ring-2 focus:ring-accent/10 `${dc ? 'bg-surface-raised border-edge text-content focus:border-accent' : 'bg-surface border-edge text-content focus:border-accent '}``;
 const labelCls = ``text-xs font-bold text-content-muted mb-1.5 block ml-1``;

 return (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300">
   <div className={``w-full max-w-lg rounded-xl border shadow-sm overflow-hidden flex flex-col `${dc ? 'bg-surface border-edge' : 'bg-surface border-edge'}``}>
    <div className={``px-8 py-6 border-b flex justify-between items-center `${dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge-light'}``}>
     <div>
      <h2 className="h2">{editLead ? 'Editar lead' : 'Nuevo lead'}</h2>
      <p className="small-text mt-0.5">Informaci`u00f3n b`u00e1sica de contacto</p>
     </div>
     <button onClick={onClose} className={``p-2 rounded-xl transition-all `${dc ? 'bg-surface-raised text-content-muted hover:text-content' : 'bg-surface border text-content-muted hover:text-content shadow-sm'}``}><X size={20} /></button>
    </div>
    <div className="p-8 space-y-6">
     <div className="grid grid-cols-1 gap-5">
      <div>
       <label className={labelCls}>Nombre completo</label>
       <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Ej: Juan P`u00e9rez" className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
       <div>
        <label className={labelCls}>WhatsApp / Tel`u00e9fono</label>
        <input type="text" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} placeholder="+51 900..." className={inputCls} />
       </div>
       <div>
        <label className={labelCls}>Email</label>
        <input type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} placeholder="juan@email.com" className={inputCls} />
       </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
        <label className={labelCls}>Estado inicial</label>
        <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className={inputCls}>
         {pipelineStages.map((s:string) => <option key={s} value={s}>{s}</option>)}
        </select>
       </div>
       <div>
        <label className={labelCls}>Proyecto de inter`u00e9s</label>
        <ProjectSelect value={formData.project} onChange={(v: string) => setFormData({...formData, project: v})} className={inputCls} />
       </div>
      </div>
      <div>
       <label className={labelCls}>Origen del lead</label>
       <select value={formData.source} onChange={e=>setFormData({...formData, source: e.target.value})} className={inputCls}>
        <option value="Directo">Directo</option>
        <option value="Facebook">Facebook</option>
        <option value="Instagram">Instagram</option>
        <option value="Landing Page">Landing page</option>
        <option value="Recomendado">Recomendado</option>
       </select>
      </div>
     </div>
    </div>
    <div className={``px-8 py-6 border-t flex items-center justify-end gap-4 `${dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge'}``}>
     <button onClick={onClose} className="text-xs font-bold text-content-muted hover:text-content px-4">Cancelar</button>
     <button onClick={() => onSave(formData)} className="btn-primary">
      {editLead ? 'Actualizar registro' : 'Crear lead'}
     </button>
    </div>
   </div>
  </div>
 );
};
"@

$newModal = @"
const NewLeadModal = ({ editLead, isDarkMode, onClose, onSave, pipelineStages }: any) => {
 const dc = isDarkMode;
 const [formData, setFormData] = useState(editLead || { name: '', phone: '', email: '', project: '', status: 'Nuevo', score: '50', source: '', advisor_id: '', currency: 'USD', budget_amount: '', interest: '', notes: '' });
 const [leadSources, setLeadSources] = useState<any[]>([]);
 const [advisors, setAdvisors] = useState<any[]>([]);
 const { token } = useAuth();
 
 useEffect(() => {
  fetch(``${'$'}{API_URL}/api/data/sources``, { headers: { Authorization: ``Bearer ${'$'}{token}`` } })
   .then(r => r.json()).then(d => { if(Array.isArray(d)) setLeadSources(d); }).catch(() => {});
  fetch(``${'$'}{API_URL}/api/users``, { headers: { Authorization: ``Bearer ${'$'}{token}`` } })
   .then(r => r.json()).then(d => { if(Array.isArray(d)) setAdvisors(d); }).catch(() => {});
 }, []);

 const inputCls = ``w-full p-3 rounded-xl border text-xs font-bold outline-none transition-all focus:ring-2 focus:ring-accent/10 ${'$'}{dc ? 'bg-surface-raised border-edge text-content focus:border-accent' : 'bg-surface border-edge text-content focus:border-accent '}``;
 const labelCls = ``text-xs font-bold text-content-muted mb-1.5 block ml-1``;

 return (
  <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300">
   <div className={``w-full max-w-2xl rounded-xl border shadow-sm overflow-hidden flex flex-col max-h-[90vh] ${'$'}{dc ? 'bg-surface border-edge' : 'bg-surface border-edge'}``}>
    <div className={``px-8 py-5 border-b flex justify-between items-center shrink-0 ${'$'}{dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge-light'}``}>
     <div>
      <h2 className="h2">{editLead ? 'Editar lead' : 'Nuevo lead'}</h2>
      <p className="small-text mt-0.5">Registro completo del prospecto</p>
     </div>
     <button onClick={onClose} className={``p-2 rounded-xl transition-all ${'$'}{dc ? 'bg-surface-raised text-content-muted hover:text-content' : 'bg-surface border text-content-muted hover:text-content shadow-sm'}``}><X size={20} /></button>
    </div>
    <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
     {/* Datos personales */}
     <div className="space-y-1.5">
      <p className={``text-[10px] font-bold uppercase tracking-wider ml-1 ${'$'}{dc ? 'text-accent' : 'text-accent'}``}>Datos de contacto</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div>
        <label className={labelCls}>Nombres</label>
        <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} placeholder="Ej: Juan P${[char]0x00e9}rez" className={inputCls} />
       </div>
       <div>
        <label className={labelCls}>Tel${[char]0x00e9}fono (formato Evolution)</label>
        <input type="text" value={formData.phone} onChange={e=>setFormData({...formData, phone: e.target.value})} placeholder="521XXXXXXXXXX" className={inputCls} />
        <p className={``text-[10px] mt-1 ml-1 ${'$'}{dc ? 'text-content-muted' : 'text-content-muted'}``}>C${[char]0x00f3}digo pa${[char]0x00ed}s + n${[char]0x00fa}mero sin espacios ni +</p>
       </div>
      </div>
      <div>
       <label className={labelCls}>Email</label>
       <input type="email" value={formData.email || ''} onChange={e=>setFormData({...formData, email: e.target.value})} placeholder="juan@email.com" className={inputCls} />
      </div>
     </div>

     {/* Estado y origen */}
     <div className="space-y-1.5">
      <p className={``text-[10px] font-bold uppercase tracking-wider ml-1 ${'$'}{dc ? 'text-accent' : 'text-accent'}``}>Clasificaci${[char]0x00f3}n</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div>
        <label className={labelCls}>Estado (etapa del pipeline)</label>
        <select value={formData.status} onChange={e=>setFormData({...formData, status: e.target.value})} className={inputCls}>
         {pipelineStages.map((s:string) => <option key={s} value={s}>{s}</option>)}
        </select>
       </div>
       <div>
        <label className={labelCls}>Fuente de origen</label>
        <select value={formData.source || ''} onChange={e=>setFormData({...formData, source: e.target.value})} className={inputCls}>
         <option value="">Seleccionar fuente...</option>
         {leadSources.map((s:any) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
       </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       <div>
        <label className={labelCls}>Asesor asignado</label>
        <select value={formData.advisor_id || ''} onChange={e=>setFormData({...formData, advisor_id: e.target.value ? Number(e.target.value) : null})} className={inputCls}>
         <option value="">Sin asignar</option>
         {advisors.map((a:any) => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
        </select>
       </div>
       <div>
        <label className={labelCls}>Proyecto de inter${[char]0x00e9}s</label>
        <ProjectSelect value={formData.project || ''} onChange={(v: string) => setFormData({...formData, project: v})} className={inputCls} />
       </div>
      </div>
     </div>

     {/* Presupuesto */}
     <div className="space-y-1.5">
      <p className={``text-[10px] font-bold uppercase tracking-wider ml-1 ${'$'}{dc ? 'text-accent' : 'text-accent'}``}>Presupuesto</p>
      <div className="grid grid-cols-3 gap-4">
       <div>
        <label className={labelCls}>Moneda</label>
        <select value={formData.currency || 'USD'} onChange={e=>setFormData({...formData, currency: e.target.value})} className={inputCls}>
         <option value="USD">USD ($)</option>
         <option value="PEN">PEN (S/)</option>
         <option value="EUR">EUR (${[char]0x20ac})</option>
         <option value="MXN">MXN ($)</option>
         <option value="COP">COP ($)</option>
        </select>
       </div>
       <div className="col-span-2">
        <label className={labelCls}>Monto</label>
        <input type="number" value={formData.budget_amount || ''} onChange={e=>setFormData({...formData, budget_amount: e.target.value})} placeholder="0.00" className={inputCls} />
       </div>
      </div>
     </div>

     {/* Notas */}
     <div className="space-y-1.5">
      <p className={``text-[10px] font-bold uppercase tracking-wider ml-1 ${'$'}{dc ? 'text-accent' : 'text-accent'}``}>Notas</p>
      <div>
       <label className={labelCls}>Inter${[char]0x00e9}s principal</label>
       <input type="text" value={formData.interest || ''} onChange={e=>setFormData({...formData, interest: e.target.value})} placeholder="Ej: Departamento 2 dormitorios zona norte" className={inputCls} />
      </div>
      <div>
       <label className={labelCls}>Notas importantes</label>
       <textarea rows={3} value={formData.notes || ''} onChange={e=>setFormData({...formData, notes: e.target.value})} placeholder="Observaciones adicionales del prospecto..." className={``${'$'}{inputCls} resize-none``} />
      </div>
     </div>
    </div>
    <div className={``px-8 py-5 border-t flex items-center justify-end gap-4 shrink-0 ${'$'}{dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset border-edge'}``}>
     <button onClick={onClose} className="text-xs font-bold text-content-muted hover:text-content px-4">Cancelar</button>
     <button onClick={() => onSave(formData)} className="btn-primary">
      {editLead ? 'Actualizar registro' : 'Crear lead'}
     </button>
    </div>
   </div>
  </div>
 );
};
"@

if ($text.Contains($oldModal)) {
    $text = $text.Replace($oldModal, $newModal)
    Write-Host "Modal replaced successfully!"
} else {
    Write-Host "Could not find exact modal text. Trying partial match..."
    # Try simpler replacement target
    $simpleOld = "const [formData, setFormData] = useState(editLead || { name: '', phone: '', email: '', project: '', status: 'Nuevo', score: '50', source: 'Directo' });"
    $simpleNew = "const [formData, setFormData] = useState(editLead || { name: '', phone: '', email: '', project: '', status: 'Nuevo', score: '50', source: '', advisor_id: '', currency: 'USD', budget_amount: '', interest: '', notes: '' });`n const [leadSources, setLeadSources] = useState<any[]>([]);`n const [advisors, setAdvisors] = useState<any[]>([]);`n const { token } = useAuth();`n `n useEffect(() => {`n  fetch(`""`${API_URL}/api/data/sources`"`", { headers: { Authorization: `""`Bearer `${token}`"`" } })`n   .then(r => r.json()).then(d => { if(Array.isArray(d)) setLeadSources(d); }).catch(() => {});`n  fetch(`""`${API_URL}/api/users`"`", { headers: { Authorization: `""`Bearer `${token}`"`" } })`n   .then(r => r.json()).then(d => { if(Array.isArray(d)) setAdvisors(d); }).catch(() => {});`n }, []);"
    
    if ($text.Contains($simpleOld)) {
        $text = $text.Replace($simpleOld, $simpleNew)
        Write-Host "State line replaced!"
    } else {
        Write-Host "ERROR: Could not find target text in file"
    }
}

# Write as UTF-8
[System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))
Write-Host "File saved as UTF-8"
