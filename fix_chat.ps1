$path = 'c:\Chatprex\frontend\src\components\ChatInterface.tsx'
$raw = [System.IO.File]::ReadAllBytes($path)

# Detect encoding
if ($raw[0] -eq 0xFF -and $raw[1] -eq 0xFE) {
    $text = [System.Text.Encoding]::Unicode.GetString($raw, 2, $raw.Length - 2)
    Write-Host "Detected UTF-16 LE"
} elseif ($raw[0] -eq 0xEF -and $raw[1] -eq 0xBB -and $raw[2] -eq 0xBF) {
    $text = [System.Text.Encoding]::UTF8.GetString($raw, 3, $raw.Length - 3)
    Write-Host "Detected UTF-8 BOM"
} else {
    $text = [System.Text.Encoding]::UTF8.GetString($raw)
    Write-Host "Detected UTF-8"
}

# 1. Add previewReply state after replyForm state
$text = $text.Replace(
    'const [replyForm, setReplyForm] = useState<Partial<QuickReply>>({});',
    "const [replyForm, setReplyForm] = useState<Partial<QuickReply>>({});`n const [previewReply, setPreviewReply] = useState<QuickReply | null>(null);"
)
Write-Host "1. Added previewReply state"

# 2. Remove lg:hidden from header Zap button so it shows on ALL screens
$text = $text.Replace(
    'className={`p-2.5 rounded-xl transition-all active:scale-90 lg:hidden ${showQuickReplies',
    'className={`p-2.5 rounded-xl transition-all active:scale-90 ${showQuickReplies'
)
Write-Host "2. Removed lg:hidden from Zap button"

# 3. Change sidebar from always-visible lg:flex to hidden-by-default absolute overlay
$text = $text.Replace(
    "lg:flex w-full md:w-80 lg:w-96 border-l flex-col h-full z-40 transition-all animate-in slide-in-from-right duration-300",
    "absolute right-0 top-0 bottom-0 w-72 border-l flex-col h-full z-40 transition-all animate-in slide-in-from-right duration-300 shadow-2xl"
)
Write-Host "3. Changed sidebar to hidden overlay"

# 4. Replace sidebar header (compact + close button)
$oldHeader = @"
     <div className={``h-16 flex-shrink-0 flex items-center justify-between px-6 border-b transition-colors `${dc ? 'bg-surface border-edge' : 'bg-surface border-edge-light'}``}>
      <div className="flex items-center gap-3 text-amber-500">
        <Zap size={20} fill="currentColor" />
        <h2 className="h3">Respuestas</h2>
      </div>
      <button 
       onClick={() => { setReplyForm({}); setShowReplyForm(true); }}
       className="w-10 h-10 rounded-2xl bg-accent text-content flex items-center justify-center hover:bg-accent-dark transition-all active:scale-90 shadow-lg shadow-accent/20"
      >
       <Plus size={20} />
      </button>
     </div>
"@

$newHeader = @"
     <div className={``h-14 flex-shrink-0 flex items-center justify-between px-4 border-b transition-colors `${dc ? 'bg-surface border-edge' : 'bg-surface border-edge-light'}``}>
      <div className="flex items-center gap-2 text-amber-500">
        <Zap size={16} fill="currentColor" />
        <h2 className="text-sm font-bold text-content">Respuestas</h2>
      </div>
      <div className="flex items-center gap-1">
       <button onClick={() => { setReplyForm({}); setShowReplyForm(true); }} className="w-8 h-8 rounded-lg bg-accent text-content flex items-center justify-center hover:bg-accent-dark transition-all active:scale-90 shadow-sm"><Plus size={16} /></button>
       <button onClick={() => setShowQuickReplies(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-content-muted hover:bg-surface-inset transition-colors"><X size={16} /></button>
      </div>
     </div>
"@

$text = $text.Replace($oldHeader, $newHeader)
Write-Host "4. Replaced sidebar header"

# 5. Replace the reply list section - make compact + add hover preview
$text = $text.Replace(
    '<div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">',
    '<div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">'
)

$text = $text.Replace(
    'className="text-center py-20 opacity-20 space-y-4">',
    'className="text-center py-12 opacity-20 space-y-3">'
)

$text = $text.Replace(
    '<Zap size={64} className="mx-auto" />',
    '<Zap size={40} className="mx-auto" />'
)

# 6. Replace each reply card with compact version + hover handlers
$text = $text.Replace(
    'className={`p-6 rounded-xl border transition-all cursor-pointer group animate-in slide-in-from-right duration-300 ${dc',
    'className={`relative p-3 rounded-lg border transition-all cursor-pointer group ${dc'
)

# Add hover handlers to reply cards
$text = $text.Replace(
    "hover:border-accent/30 shadow-sm hover:shadow-lg'}`}>",
    "hover:border-accent/30 hover:shadow-md'}`} onMouseEnter={() => setPreviewReply(reply)} onMouseLeave={() => setPreviewReply(null)}>"
)
$text = $text.Replace(
    "hover:border-accent/50'}`}>",
    "hover:border-accent/50'}`} onMouseEnter={() => setPreviewReply(reply)} onMouseLeave={() => setPreviewReply(null)}>"
)
Write-Host "5-6. Made cards compact + added hover"

# 7. Replace the Tip footer with preview bubble
$oldTip = @"
       <div className={``p-8 border-t text-center transition-colors `${dc ? 'bg-surface-raised/50 border-edge' : 'bg-surface-inset'}``}>
         <p className="text-xs font-bold uppercase tracking-normal text-accent mb-2">Tip ChatPrex</p>
         <p className="body-text text-xs italic">Usa el bot`u00f3n de rayo <span className="font-bold">/</span> para acceder r`u00e1pido a tus plantillas guardadas.</p>
       </div>
"@

$newPreview = @"
       {previewReply && (
        <div className={``mx-3 mb-3 p-3 rounded-xl border animate-in fade-in slide-in-from-bottom-2 duration-200 `${dc ? 'bg-emerald-900/30 border-emerald-800/30' : 'bg-emerald-50 border-emerald-200'}``}>
         <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1.5">Vista previa</p>
         <div className={``p-2.5 rounded-lg text-xs leading-relaxed `${dc ? 'bg-surface-raised text-content-secondary' : 'bg-white text-content-secondary shadow-sm'}``}>
          <p className="whitespace-pre-wrap line-clamp-4">{previewReply.text.replace(/\{\{nombre\}\}/g, activeChatData?.name || 'Cliente')}</p>
         </div>
        </div>
       )}
"@

$text = $text.Replace($oldTip, $newPreview)
Write-Host "7. Replaced tip with preview bubble"

# Write as UTF-8 without BOM
[System.IO.File]::WriteAllText($path, $text, [System.Text.UTF8Encoding]::new($false))
Write-Host "`nAll changes applied successfully!"
