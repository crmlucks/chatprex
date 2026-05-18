$file = 'c:\Chatprex\frontend\src\components\ChatInterface.tsx'
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)

# Fix 1: Replace the mangled input area (lines 651-664) with clean version
$broken = @'
         <div className="         <div className="flex items-center gap-1 pl-1">
           <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
           <button onClick={() => fileInputRef.current?.click()} className={`p-2 md:p-3 rounded-xl transition-all active:scale-95 ${dc ? 'text-content-muted hover:text-accent hover:bg-accent/10' : 'text-content-muted hover:text-accent hover:bg-accent/10'}`}>
            <Paperclip size={20} />
           </button>
          </div>">
          <button onClick={() =>           <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} /> className={`p-2 md:p-3 rounded-xl transition-all active:scale-95 ${showQuickReplies ? 'text-content bg-amber-500 shadow-lg' : (dc ? 'text-content-muted hover:text-amber-500 hover:bg-amber-500/10' : 'text-content-muted hover:text-amber-500 hover:bg-amber-500/10')}`}>
           
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
          <button onClick={() => fileInputRef.current?.click()} className={`p-2 md:p-3 rounded-xl transition-all active:scale-95 ${dc ? 'text-content-muted hover:text-accent hover:bg-accent/10' : 'text-content-muted hover:text-accent hover:bg-accent/10'}`}>
           <Paperclip size={20} />
          </button>
         </div>
'@

$clean = @'
         <div className="flex items-center gap-1 pl-1">
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
          <button onClick={() => fileInputRef.current?.click()} className={`p-2 md:p-3 rounded-xl transition-all active:scale-95 ${dc ? 'text-content-muted hover:text-accent hover:bg-accent/10' : 'text-content-muted hover:text-accent hover:bg-accent/10'}`}>
           <Paperclip size={20} />
          </button>
         </div>
'@

$content = $content.Replace($broken, $clean)

# Fix 2: Replace the right sidebar with inline quick replies manager (when no chat active)
$oldNoChat = @'
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
       <div className={`w-32 h-32 rounded-xl flex items-center justify-center shadow-sm mb-10 transition-all rotate-3 ${dc ? 'bg-surface-raised/50 border border-edge' : 'bg-surface border border-edge'}`}>
        <MessageSquare size={64} className="text-accent opacity-20" />
       </div>
       <h2 className="h1 mb-4">ChatPrex mensajes</h2>
       <p className="body-text max-w-sm mx-auto">
        Gestiona todos tus leads de WhatsApp en un solo lugar. Selecciona un chat para comenzar la comunicación.
       </p>
       <div className="mt-12 flex gap-8">
         <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Zap size={24} /></div>
          <p className="text-xs font-bold uppercase tracking-normal text-content-muted">IA Activa</p>
         </div>
         <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><CheckCircle2 size={24} /></div>
          <p className="text-xs font-bold uppercase tracking-normal text-content-muted">Multicanal</p>
         </div>
       </div>
      </div>
     )}
    </div>

    {/* 3. Right Sidebar: Quick Replies */}
'@

$newNoChat = @'
      <div className="flex-1 flex flex-col relative h-full">
       {showQuickReplies ? (
        <div className="flex-1 flex flex-col animate-in fade-in duration-200">
         <div className={`h-16 flex-shrink-0 flex items-center justify-between px-6 border-b ${dc ? 'border-edge' : 'border-edge-light'}`}>
          <div className="flex items-center gap-2 text-amber-500"><Zap size={20} fill="currentColor" /><h2 className="h3">Respuestas Rápidas</h2></div>
          <div className="flex gap-2">
           <button onClick={() => { setReplyForm({}); setShowReplyForm(true); }} className="w-10 h-10 rounded-2xl bg-accent text-content flex items-center justify-center hover:bg-accent-dark transition-all active:scale-90 shadow-lg shadow-accent/20"><Plus size={20} /></button>
           <button onClick={() => setShowQuickReplies(false)} className="p-2 rounded-xl text-content-muted hover:bg-surface-raised transition-colors"><X size={20} /></button>
          </div>
         </div>
         {showReplyForm ? (
          <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar space-y-6 animate-in fade-in duration-300 max-w-2xl mx-auto w-full">
           <div className="space-y-2">
            <label className="label-text ml-1">Título de la respuesta</label>
            <input type="text" placeholder="Ej: Bienvenida general" className={`w-full p-4 text-sm font-bold rounded-2xl border focus:ring-4 focus:ring-accent/10 outline-none transition-all ${dc ? 'bg-surface-raised border-edge text-content' : 'bg-surface-inset border-edge text-content'}`} value={replyForm.title || ''} onChange={e => setReplyForm({...replyForm, title: e.target.value})} />
           </div>
           <div className="space-y-2">
            <label className="label-text ml-1">Contenido del mensaje</label>
            <textarea rows={6} placeholder="Escribe el mensaje aquí..." className={`w-full p-4 text-sm font-medium rounded-xl border focus:ring-4 focus:ring-accent/10 outline-none transition-all resize-none leading-relaxed ${dc ? 'bg-surface-raised border-edge text-content-secondary' : 'bg-surface-inset border-edge text-content-secondary'}`} value={replyForm.text || ''} onChange={e => setReplyForm({...replyForm, text: e.target.value})} />
            <p className="body-text text-xs italic">Usa {"{{nombre}}"} para personalizar.</p>
           </div>
           <div className="space-y-2">
            <label className="label-text ml-1">Archivo adjunto</label>
            <label className={`flex items-center gap-4 p-5 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:bg-accent/5 ${dc ? 'border-edge bg-surface-raised/50' : 'border-edge bg-surface-inset'}`}>
             <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center"><Paperclip size={20} /></div>
             <div className="flex-1 overflow-hidden">
              <p className={`text-xs font-bold truncate text-content`}>{replyForm.fileName || 'Seleccionar archivo'}</p>
              <p className="text-xs text-content-muted font-medium">Imagen, PDF o video</p>
             </div>
             <input type="file" className="hidden" onChange={handleReplyFileChange} />
            </label>
           </div>
           <div className="pt-4 flex gap-4 mt-auto">
            <button onClick={() => setShowReplyForm(false)} className={`flex-1 py-4 text-xs rounded-2xl font-bold transition-all active:scale-95 ${dc ? 'bg-surface-raised text-content-muted' : 'bg-slate-100 text-content-secondary shadow-sm'}`}>Cancelar</button>
            <button onClick={handleSaveReplyForm} className="flex-1 py-4 text-xs rounded-2xl font-bold bg-accent text-content hover:bg-accent-dark transition-all active:scale-95 shadow-sm shadow-accent/20">Guardar</button>
           </div>
          </div>
         ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
           <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <div className="max-w-2xl mx-auto space-y-3">
             {quickReplies.length === 0 ? (
              <div className="text-center py-16 opacity-20 space-y-3">
               <Zap size={48} className="mx-auto" />
               <p className="text-sm font-bold">Sin respuestas rápidas</p>
               <p className="text-xs">Crea tu primera plantilla con el botón +</p>
              </div>
             ) : (
              quickReplies.map(reply => (
               <div key={reply.id} className={`relative p-4 rounded-xl border transition-all group ${dc ? 'bg-[#252525] border-edge hover:border-accent/50' : 'bg-surface border-edge-light hover:border-accent/30 shadow-sm hover:shadow-lg'}`}>
                <div className="flex justify-between items-start mb-2">
                 <h4 className={`text-sm font-bold group-hover:text-accent transition-colors text-content`}>{reply.title}</h4>
                 <div className="flex gap-1 shrink-0">
                  <button onClick={() => { setReplyForm(reply); setShowReplyForm(true); }} className={`p-2 rounded-xl transition-all ${dc ? 'hover:bg-slate-700 text-content-muted' : 'hover:bg-slate-100 text-content-muted hover:text-accent'}`}><Edit2 size={14} /></button>
                  <button onClick={() => handleDeleteReply(reply.id)} className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-all"><Trash2 size={14} /></button>
                 </div>
                </div>
                <p className="body-text text-xs line-clamp-3 leading-relaxed text-content-muted">{reply.text}</p>
                {reply.fileName && (
                 <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-accent/5 border border-accent/10 text-xs font-bold text-accent"><Paperclip size={12} /> <span className="truncate">{reply.fileName}</span></div>
                )}
               </div>
              ))
             )}
            </div>
           </div>
          </div>
         )}
        </div>
       ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
         <div className={`w-32 h-32 rounded-xl flex items-center justify-center shadow-sm mb-10 transition-all rotate-3 ${dc ? 'bg-surface-raised/50 border border-edge' : 'bg-surface border border-edge'}`}>
          <MessageSquare size={64} className="text-accent opacity-20" />
         </div>
         <h2 className="h1 mb-4">ChatPrex mensajes</h2>
         <p className="body-text max-w-sm mx-auto">
          Gestiona todos tus leads de WhatsApp en un solo lugar. Selecciona un chat para comenzar la comunicación.
         </p>
         <div className="mt-12 flex gap-8">
           <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Zap size={24} /></div>
            <p className="text-xs font-bold uppercase tracking-normal text-content-muted">IA Activa</p>
           </div>
           <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center"><CheckCircle2 size={24} /></div>
            <p className="text-xs font-bold uppercase tracking-normal text-content-muted">Multicanal</p>
           </div>
         </div>
        </div>
       )}
      </div>
     )}
    </div>
   </div>
  );
};

const ChatItem = ({
'@

$content = $content.Replace($oldNoChat, $newNoChat)

# Fix 3: Remove the old right sidebar completely (from its opening div to its closing)
# Find and remove everything between "Right Sidebar" comment and its closing </div> before ChatItem
$sidebarPattern = '(?s)\s*<div className=\{`\$\{showQuickReplies.*?Tip ChatPrex.*?</div>\s*\)\}\s*</div>'
$content = [regex]::Replace($content, $sidebarPattern, '')

[System.IO.File]::WriteAllText($file, $content, (New-Object System.Text.UTF8Encoding $false))
Write-Output "ChatInterface.tsx fixed successfully!"
