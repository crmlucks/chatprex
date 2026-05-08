// Design System Migration Script
// Run: node migrate-styles.cjs
const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');

const replacements = [
  // Backgrounds
  ["bg-[#121212]", "bg-surface-base"],
  ["bg-[#1E1E1E]", "bg-surface"],
  ["bg-[#0F0F0F]", "bg-surface-base"],
  ["bg-[#181619]", "bg-surface-base"],
  ["bg-[#1A1A1A]", "bg-surface"],
  ["bg-surface-dim", "bg-surface-base"],
  // Primary -> Accent
  ["bg-primary", "bg-accent"],
  ["text-primary", "text-accent"],
  ["border-primary", "border-accent"],
  ["hover:bg-primary-dark", "hover:bg-accent-hover"],
  ["hover:bg-primary", "hover:bg-accent-hover"],
  ["focus:border-primary", "focus:border-accent"],
  ["focus:ring-primary", "focus:ring-accent"],
  ["shadow-primary", "shadow-accent"],
  ["ring-primary", "ring-accent"],
  // Font weights
  ["font-black", "font-semibold"],
  // Border radius (reduce to max 12px)
  ["rounded-[48px]", "rounded-xl"],
  ["rounded-[40px]", "rounded-xl"],
  ["rounded-[32px]", "rounded-xl"],
  ["rounded-[28px]", "rounded-xl"],
  ["rounded-[24px]", "rounded-xl"],
  ["rounded-[20px]", "rounded-lg"],
  ["rounded-[18px]", "rounded-lg"],
  ["rounded-3xl", "rounded-xl"],
  // Shadows (reduce)
  ["shadow-3xl", "shadow-sm"],
  ["shadow-2xl", "shadow-sm"],
  ["shadow-xl", "shadow-sm"],
  ["shadow-inner", ""],
  // Backdrop blur (remove)
  ["backdrop-blur-3xl", ""],
  ["backdrop-blur-2xl", ""],
  ["backdrop-blur-xl", ""],
  ["backdrop-blur-md", ""],
  ["backdrop-blur-sm", ""],
  // Text sizes (normalize)
  ["text-[9px]", "text-xs"],
  ["text-[10px]", "text-xs"],
  ["text-[11px]", "text-xs"],
  ["text-[13px]", "text-sm"],
  // Tracking (normalize)
  ["tracking-widest", "tracking-normal"],
  ["tracking-[2px]", "tracking-normal"],
  ["tracking-[3px]", "tracking-normal"],
  ["tracking-[4px]", "tracking-normal"],
  ["tracking-tighter", "tracking-tight"],
  // Colors to semantic
  ["border-slate-800", "border-edge"],
  ["border-slate-700", "border-edge"],
  ["border-slate-100", "border-edge"],
  ["border-slate-200", "border-edge"],
  ["border-slate-50", "border-edge-light"],
  ["bg-slate-900", "bg-surface-raised"],
  ["bg-slate-800", "bg-surface-raised"],
  ["bg-slate-50", "bg-surface-inset"],
  ["text-slate-900", "text-content"],
  ["text-slate-800", "text-content"],
  ["text-white", "text-content"],
  ["text-slate-200", "text-content"],
  ["text-slate-300", "text-content-secondary"],
  ["text-slate-500", "text-content-muted"],
  ["text-slate-400", "text-content-muted"],
  ["text-slate-600", "text-content-secondary"],
  ["text-slate-700", "text-content-secondary"],
  ["text-slate-100", "text-content"],
  // Hover colors
  ["hover:bg-slate-50", "hover:bg-surface-inset"],
  ["hover:bg-slate-800", "hover:bg-surface-raised"],
  ["hover:text-slate-800", "hover:text-content"],
  ["hover:text-slate-900", "hover:text-content"],
  ["hover:text-white", "hover:text-content"],
  ["hover:text-slate-600", "hover:text-content-secondary"],
  // Dark mode specific (many already handled by CSS vars)
  ["dark:text-white", ""],
  ["dark:text-slate-100", ""],
  ["dark:text-slate-400", ""],
  ["dark:bg-slate-800", ""],
  ["dark:bg-slate-900", ""],
  ["dark:border-slate-800", ""],
  ["dark:border-white/5", ""],
  ["dark:bg-[#1E1E1E]/90", "bg-surface"],
  ["dark:bg-[#1E1E1E]", ""],
  ["dark:bg-[#0F0F0F]", ""],
  ["dark:shadow-black/50", ""],
  ["dark:hover:bg-slate-700", ""],
  ["dark:hover:bg-slate-800", ""],
  ["dark:hover:bg-white/5", ""],
  ["dark:focus:bg-[#0F0F0F]", ""],
  // Misc cleanup
  ["bg-white/90", "bg-surface"],
  ["bg-white", "bg-surface"],
  ["hover:brightness-110", ""],
  ["animate-in fade-in zoom-in duration-700", ""],
  ["animate-in fade-in duration-500", ""],
  ["animate-in fade-in slide-in-from-left duration-500", ""],
  ["animate-in slide-in-from-right duration-500", ""],
  ["animate-in slide-in-from-right duration-700 delay-100", ""],
  ["animate-in zoom-in-95 duration-500", ""],
  ["animate-in zoom-in-95 duration-300", ""],
  ["animate-in fade-in slide-in-from-bottom-4 duration-500", ""],
  ["animate-in slide-in-from-top-2 duration-300", ""],
  ["animate-in slide-in-from-top duration-300", ""],
  ["animate-in slide-in-from-top-4 duration-700", ""],
  ["animate-in slide-in-from-top-4 duration-300", ""],
  // Double spaces cleanup
  ["  ", " "],
];

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

// Skip already-migrated files
const skip = ['Sidebar.tsx', 'Toast.tsx', 'AlarmSystem.tsx'];

files.forEach(file => {
  if (skip.includes(file)) return;
  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  replacements.forEach(([from, to]) => {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  });

  // Clean up multiple consecutive spaces in className
  content = content.replace(/className="([^"]*)"/g, (match, cls) => {
    const cleaned = cls.replace(/\s+/g, ' ').trim();
    return `className="${cleaned}"`;
  });
  // Same for template literals
  content = content.replace(/className=\{`([^`]*)`\}/g, (match, cls) => {
    const cleaned = cls.replace(/  +/g, ' ');
    return 'className={`' + cleaned + '`}';
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Migrated: ${file}`);
  } else {
    console.log(`⏭️  Skipped (no changes): ${file}`);
  }
});

// Also update App.tsx to fix any remaining references  
const appPath = path.join(__dirname, 'src', 'App.tsx');
if (fs.existsSync(appPath)) {
  let content = fs.readFileSync(appPath, 'utf8');
  replacements.forEach(([from, to]) => {
    content = content.split(from).join(to);
  });
  content = content.replace(/className="([^"]*)"/g, (match, cls) => {
    return `className="${cls.replace(/\s+/g, ' ').trim()}"`;
  });
  fs.writeFileSync(appPath, content, 'utf8');
  console.log('✅ Migrated: App.tsx');
}

console.log('\n🎨 Design system migration complete!');
