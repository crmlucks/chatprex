import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Phone, Video, Paperclip, Send, Smile, Filter, CheckCircle2, ArrowLeft, Zap, Plus, Edit2, Trash2, X, MessageSquare, Bot } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { usePipeline } from '../hooks/usePipeline';

interface ChatMessage {
 id: string;
 fromMe: boolean;
 text: string;
 time: string;
 media?: string;
 mimeType?: string;
}

interface QuickReply {
 id: string;
 title: string;
 text: string;
 media?: string;
 mimeType?: string;
 fileName?: string;
}

interface Chat {
 id: string; // WhatsApp JID (ej. 521XXXXXXXXXX@s.whatsapp.net)
 name: string;
 botActive?: boolean;
 leadId?: number;
 lastMessage: string;
 time: string;
 unread: number;
 status: string;
 messages: ChatMessage[];
}

const ChatInterface = ({ isDarkMode }: { isDarkMode?: boolean }) => {
 const [socket, setSocket] = useState<Socket | null>(null);
 const [activeChat, setActiveChat] = useState<string | null>(null);
 const [inputText, setInputText] = useState('');
 const [chats, setChats] = useState<{ [id: string]: Chat }>({});
 const activeChatRef = useRef<string | null>(null);
 const [useN8n, setUseN8n] = useState(false);
 const pipelineHelpers = usePipeline();
 
 const [chatSearch, setChatSearch] = useState('');
 const [showChatFilters, setShowChatFilters] = useState(false);
 const [chatFilterStatus, setChatFilterStatus] = useState('todos');
 
 // Quick Replies
 const [showQuickReplies, setShowQuickReplies] = useState(false);
 const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
 const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
 const [showReplyForm, setShowReplyForm] = useState(false);
 const [replyForm, setReplyForm] = useState<Partial<QuickReply>>({});
 const [previewReply, setPreviewReply] = useState<QuickReply | null>(null);
 
 const messagesEndRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
  const saved = localStorage.getItem('chatprex_quick_replies');
  if (saved) {
   setQuickReplies(JSON.parse(saved));
  }
 }, []);

 const saveQuickReplies = (replies: QuickReply[]) => {
  setQuickReplies(replies);
  localStorage.setItem('chatprex_quick_replies', JSON.stringify(replies));
 };

 useEffect(() => {
  // Fetch initial n8n state
  fetch((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/ai-mode')
   .then(res => res.json())
   .then(data => setUseN8n(data.useN8n))
   .catch(console.error);
 }, []);

 const toggleN8nMode = async (enabled: boolean) => {
  setUseN8n(enabled);
  try {
   await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/ai-mode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ useN8n: enabled })
   });
  } catch (err) {
   console.error(err);
  }
 };

 const toggleBot = async (leadId: number | undefined) => {
  if (!leadId) return;
  const chatArr = Object.values(chats);
  const chat = chatArr.find((c: any) => c.leadId === leadId);
  if (!chat) return;

  try {
   const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/leads/${leadId}/bot`, {
    method: 'PATCH',
    headers: {
     'Content-Type': 'application/json',
     Authorization: `Bearer ${localStorage.getItem('chatprex_token')}`
    },
    body: JSON.stringify({ botActive: !chat.botActive })
   });
   if (res.ok) {
    setChats(prev => ({
     ...prev,
     [chat.id]: { ...prev[chat.id], botActive: !chat.botActive }
    }));
   }
  } catch (err) {
   console.error('Error toggling bot', err);
  }
 };

 const handleChangeStatus = async (leadId: number, newStatus: string) => {
  if (!leadId) return;
  const chatArr = Object.values(chats);
  const chat = chatArr.find((c: any) => c.leadId === leadId);
  if (!chat) return;

  try {
   const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000';
   const res = await fetch(`${API_URL}/api/leads/${leadId}/status`, {
    method: 'PATCH',
    headers: {
     'Content-Type': 'application/json',
     Authorization: `Bearer ${localStorage.getItem('chatprex_token')}`
    },
    body: JSON.stringify({ status: newStatus })
   });
   if (res.ok) {
    setChats(prev => ({
     ...prev,
     [chat.id]: { ...prev[chat.id], status: newStatus }
    }));
   }
  } catch (err) {
   console.error('Error changing status', err);
  }
 };

 // Auto-scroll to bottom
 useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
 }, [chats, activeChat]);

 // WebSocket connection
 useEffect(() => {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
  console.log(`[Socket] Conectando a ${socketUrl}...`);
  const newSocket = io(socketUrl, { transports: ['websocket'] });
  setSocket(newSocket);

  newSocket.on('connect', () => {
   console.log(`[Socket] ✅ Conectado con ID: ${newSocket.id}`);
  });

  newSocket.on('connect_error', (err) => {
   console.error(`[Socket] ❌ Error de conexión:`, err.message);
  });

  newSocket.on('whatsapp-message', (data: any) => {
   console.log(`[Socket] 📥 Mensaje recibido:`, data);
   setChats((prev) => {
    const chatId = data.from;
    const newMsg: ChatMessage = {
     id: data.id,
     fromMe: data.fromMe === true,
     text: data.text,
     media: data.media,
     mimeType: data.mimeType,
     time: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    const existingChat = prev[chatId] || {
     id: chatId,
     name: data.name,
     unread: 0,
     status: 'Nuevo',
     messages: []
    };

    return {
     ...prev,
     [chatId]: {
      ...existingChat,
      lastMessage: data.text,
      time: newMsg.time,
      unread: activeChatRef.current === chatId ? 0 : existingChat.unread + 1,
      messages: [...existingChat.messages, newMsg]
     }
    };
   });
  });

  return () => {
   newSocket.disconnect();
  };
 }, []);

 // Load initial chats
 useEffect(() => {
  const fetchChats = async () => {
   try {
    const token = localStorage.getItem('chatprex_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API_URL}/api/webhook/evolution/chats`, {
     headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
     const chatsList = await res.json();
     const chatsObj: Record<string, Chat> = {};
     chatsList.forEach((c: any) => {
      chatsObj[c.id] = c;
     });
     
     setChats(prev => ({
      ...chatsObj,
      ...prev
     }));
    }
   } catch (err) {
    console.error('[Chat] Error cargando lista de chats:', err);
   }
  };
  
  fetchChats();
 }, []);

 // Load history
 useEffect(() => {
  if (!activeChat) return;
  
  if (chats[activeChat]?.messages?.length > 0) return;

  const fetchHistory = async () => {
   try {
    const token = localStorage.getItem('chatprex_token');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API_URL}/api/webhook/evolution/messages/${activeChat}`, {
     headers: { Authorization: `Bearer ${token}` }
    });
    
    if (res.ok) {
     const messages = await res.json();
     setChats(prev => {
      const existingChat = prev[activeChat] || {
       id: activeChat,
       name: activeChat.split('@')[0],
       unread: 0,
       status: 'Leído',
       messages: []
      };

      return {
       ...prev,
       [activeChat]: {
        ...existingChat,
        messages: messages,
        lastMessage: messages.length > 0 ? messages[messages.length - 1].text : existingChat.lastMessage
       }
      };
     });
    }
   } catch (err) {
    console.error('[Chat] Error cargando historial:', err);
   }
  };

  fetchHistory();
 }, [activeChat]);

 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [mediaBase64, setMediaBase64] = useState<string | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
   const file = e.target.files[0];
   setSelectedFile(file);

   const reader = new FileReader();
   reader.onload = (event) => {
    setMediaBase64(event.target?.result as string);
   };
   reader.readAsDataURL(file);
  }
 };

 const handleSendMessage = () => {
  if ((!inputText.trim() && !mediaBase64) || !activeChat || !socket) return;
  
  socket.emit('send-message', {
   to: activeChat,
   text: inputText,
   media: mediaBase64,
   fileName: selectedFile?.name,
   mimeType: selectedFile?.type
  });

  const newMsg: ChatMessage = {
   id: Date.now().toString(),
   fromMe: true,
   text: inputText,
   media: mediaBase64 || undefined,
   mimeType: selectedFile?.type,
   time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  setChats((prev) => ({
   ...prev,
   [activeChat]: {
    ...prev[activeChat],
    lastMessage: inputText || '[Archivo multimedia]',
    time: newMsg.time,
    messages: [...prev[activeChat].messages, newMsg]
   }
  }));

  setInputText('');
  setSelectedFile(null);
  setMediaBase64(null);
  setShowQuickReplies(false);
 };

 const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
   handleSendMessage();
  }
 };

 const handleSelectChat = (id: string) => {
  setActiveChat(id);
  activeChatRef.current = id;
  setChats(prev => ({
   ...prev,
   [id]: { ...prev[id], unread: 0 }
  }));
 };

 const handleSelectQuickReply = (reply: QuickReply) => {
  if (!activeChat || !socket) return;
  let parsedText = reply.text;
  if (activeChatData) {
   parsedText = parsedText.replace(/{{nombre}}/g, activeChatData.name);
   parsedText = parsedText.replace(/{{proyecto}}/g, 'Proyecto');
  }
  
  // Enviar inmediatamente con multimedia si tiene
  socket.emit('send-message', {
   to: activeChat,
   text: parsedText,
   media: reply.media || undefined,
   fileName: reply.fileName || undefined,
   mimeType: reply.mimeType || undefined
  });

  const newMsg: ChatMessage = {
   id: Date.now().toString(),
   fromMe: true,
   text: parsedText,
   media: reply.media || undefined,
   mimeType: reply.mimeType,
   time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  setChats((prev) => ({
   ...prev,
   [activeChat]: {
    ...prev[activeChat],
    lastMessage: parsedText || '[Archivo multimedia]',
    time: newMsg.time,
    messages: [...prev[activeChat].messages, newMsg]
   }
  }));

  setInputText('');
 };

 const handleSaveReplyForm = () => {
  if (!replyForm.title || !replyForm.text) return;
  const newReply: QuickReply = {
   id: replyForm.id || Date.now().toString(),
   title: replyForm.title,
   text: replyForm.text,
   media: replyForm.media,
   mimeType: replyForm.mimeType,
   fileName: replyForm.fileName
  };
  
  let updated;
  if (replyForm.id) {
   updated = quickReplies.map(r => r.id === replyForm.id ? newReply : r);
  } else {
   updated = [...quickReplies, newReply];
  }
  saveQuickReplies(updated);
  setShowReplyForm(false);
  setReplyForm({});
 };

 const handleDeleteReply = (id: string) => {
  saveQuickReplies(quickReplies.filter(r => r.id !== id));
 };

 const handleReplyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files.length > 0) {
   const file = e.target.files[0];
   const reader = new FileReader();
   reader.onload = (event) => {
    setReplyForm({
     ...replyForm,
     media: event.target?.result as string,
     mimeType: file.type,
     fileName: file.name
    });
   };
   reader.readAsDataURL(file);
  }
 };

 const activeChatData = activeChat ? chats[activeChat] : null;
 const chatList = Object.values(chats)
  .filter(c => {
   const matchSearch = c.name.toLowerCase().includes(chatSearch.toLowerCase()) || (c.lastMessage && c.lastMessage.toLowerCase().includes(chatSearch.toLowerCase()));
   const matchStatus = chatFilterStatus === 'todos' || c.status === chatFilterStatus;
   return matchSearch && matchStatus;
  })
  .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
 const dc = isDarkMode;

 return (
  <div className={`flex flex-1 w-full min-w-0 h-[calc(100vh-4rem)] md:h-full overflow-hidden transition-colors ${dc ? 'bg-surface-base' : 'bg-surface-base'}`}>
   
   {/* 1. Sidebar: Chat List */}
   <div className={`${activeChat ? 'hidden lg:flex' : 'flex'} w-full md:w-[340px] lg:w-[400px] shrink-0 border-r flex-col z-20 h-full transition-colors ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge'}`}>
    <div className={`h-16 flex-shrink-0 flex items-center justify-between px-6 border-b transition-colors ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge-light'}`}>
     <div className="flex items-center gap-3">
      <h2 className="h3">Mensajes</h2>
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="text-xs font-bold uppercase tracking-wider">Live</span>
      </div>
     </div>
     <div className={`flex gap-1 ${dc ? 'text-content-muted' : 'text-content-muted'}`}>
      <button onClick={() => { setShowQuickReplies(!showQuickReplies); setActiveChat(null); }} title="Respuestas rápidas" className={`p-2 rounded-xl transition-all active:scale-90 ${showQuickReplies ? 'bg-amber-500 text-white' : (dc ? 'hover:bg-surface-raised' : 'hover:bg-slate-100')}`}><Zap size={18} /></button>
      <button onClick={() => setShowChatFilters(!showChatFilters)} className={`p-2 rounded-xl transition-all active:scale-90 ${showChatFilters ? 'bg-accent text-content' : (dc ? 'hover:bg-surface-raised' : 'hover:bg-slate-100')}`}><Filter size={18} /></button>
      <button className={`p-2 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-surface-raised' : 'hover:bg-slate-100'}`}><Plus size={18} /></button>
     </div>
    </div>

    <div className="p-4 flex-shrink-0">
     <div className="relative group">
      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${dc ? 'text-content-muted group-focus-within:text-accent' : 'text-content-muted group-focus-within:text-accent'}`} size={16} />
      <input 
       type="text" 
       value={chatSearch}
       onChange={(e) => setChatSearch(e.target.value)}
       placeholder="Buscar conversación..." 
       className={`w-full pl-11 pr-4 py-3 border rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all ${dc ? 'bg-surface-raised border-edge text-content placeholder-slate-600 focus:border-accent' : 'bg-surface-inset border-edge text-content placeholder-slate-400 focus:border-accent focus:bg-surface'}`}
      />
     </div>
     {showChatFilters && (
      <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
       <select 
        value={chatFilterStatus}
        onChange={(e) => setChatFilterStatus(e.target.value)}
        className={`w-full px-3 py-2 border rounded-xl text-xs font-bold outline-none transition-all ${dc ? 'bg-surface-raised border-edge text-content' : 'bg-white border-edge text-content shadow-sm'}`}
       >
        <option value="todos">Todas las etapas</option>
        {pipelineHelpers.stages.map(stage => (
         <option key={stage.id} value={stage.name}>{stage.name}</option>
        ))}
       </select>
      </div>
     )}
    </div>

    <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-transparent p-2 space-y-1">
     {chatList.length === 0 ? (
      <div className={`p-12 text-center mt-10 space-y-4 ${dc ? 'text-content-secondary' : 'text-content-muted'}`}>
       <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center opacity-20 ${dc ? 'bg-surface-raised' : 'bg-slate-100'}`}>
         <MessageSquare size={32} />
       </div>
       <div>
        <p className="text-sm font-bold">Esperando mensajes...</p>
        <p className="body-text text-xs mt-2 uppercase tracking-normal opacity-60">Sincroniza WhatsApp para comenzar</p>
       </div>
      </div>
     ) : (
      chatList.map(chat => (
       <ChatItem 
        key={chat.id}
        name={chat.name} 
        message={chat.lastMessage} 
        time={chat.time} 
        unread={chat.unread} 
        active={activeChat === chat.id} 
        status={chat.status} 
        isDarkMode={dc}
        pipelineHelpers={pipelineHelpers}
        onClick={() => handleSelectChat(chat.id)} 
       />
      ))
     )}
    </div>
   </div>

   {/* 2. Main Area: Conversation */}
   <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 w-full min-w-0 flex-col relative h-full transition-colors ${dc ? 'bg-[#0f0f0f]' : 'bg-[#f0f2f5]'}`}>
    {activeChatData ? (
     <>
      {/* Header */}
      <div className={`h-16 flex-shrink-0 flex items-center justify-between px-4 sm:px-6 border-b z-30 transition-colors ${dc ? 'bg-surface/90 border-edge' : 'bg-surface border-edge'}`}>
       <div className="flex items-center gap-3 sm:gap-4 overflow-hidden min-w-0">
        <button onClick={() => setActiveChat(null)} className={`lg:hidden p-2 -ml-2 rounded-full transition-colors shrink-0 ${dc ? 'text-content-muted hover:bg-surface-raised' : 'text-content-secondary hover:bg-slate-100'}`}>
         <ArrowLeft size={20} />
        </button>
        <div className="relative group cursor-pointer shrink-0">
         <img src={`https://ui-avatars.com/api/?name=${activeChatData.name}&background=random`} alt="Profile" className={`w-10 h-10 rounded-2xl object-cover shadow-sm border transition-transform group-hover:scale-105 ${dc ? 'border-edge' : 'border-edge'}`} />
         <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#1E1E1E] rounded-full"></div>
        </div>
        <div className="flex items-center gap-2 overflow-hidden min-w-0">
         <div className="truncate min-w-0">
          <h3 className={`text-sm font-bold truncate tracking-tight ${dc ? 'text-content' : 'text-content'}`}>
           {activeChatData.name}
          </h3>
          <div className="flex items-center gap-2">
           <span className="text-content-muted text-xs truncate">+{activeChatData.id.split('@')[0]}</span>
          </div>
         </div>
         {activeChatData.leadId && (
          <div className="flex items-center gap-2">
           <select
            value={activeChatData.status || 'Nuevo'}
            onChange={(e) => handleChangeStatus(activeChatData.leadId!, e.target.value)}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-sm border-none outline-none cursor-pointer appearance-none text-center"
            style={pipelineHelpers.getStatusBadgeStyle(activeChatData.status || 'Nuevo')}
           >
            {pipelineHelpers.stages.map(stage => (
             <option key={stage.id} value={stage.name} className={`${dc ? 'bg-[#1E1E1E] text-white' : 'bg-white text-black'}`}>
              {stage.name}
             </option>
            ))}
           </select>
           <button 
            title={activeChatData.botActive ? "Desactivar Bot" : "Activar Bot IA"} 
            onClick={() => toggleBot(activeChatData.leadId)} 
            className={`p-1.5 rounded-xl transition-all active:scale-90 flex items-center justify-center ${activeChatData.botActive ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' : 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'}`}
           >
            <Bot size={16} className={activeChatData.botActive ? 'animate-pulse' : ''} />
           </button>
          </div>
         )}
        </div>
       </div>
       
       <div className="flex items-center gap-2">
        <div className={`hidden sm:flex items-center p-1 rounded-xl transition-colors ${dc ? 'bg-surface-raised/50' : 'bg-slate-100'}`}>
          <button onClick={() => toggleN8nMode(false)} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${!useN8n ? 'bg-accent text-content shadow-lg' : 'text-content-muted hover:text-content-muted'}`}>Bot local</button>
          <button onClick={() => toggleN8nMode(true)} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${useN8n ? 'bg-accent text-content shadow-lg' : 'text-content-muted hover:text-content-muted'}`}>Bot n8n</button>
        </div>
        <div className="w-px h-6 mx-2 bg-slate-200 dark:bg-surface-raised hidden sm:block"></div>
        <a href={`https://wa.me/${activeChatData.id.split('@')[0]}`} target="_blank" rel="noopener noreferrer" title="Llamar / Abrir en WhatsApp" className="p-2.5 rounded-xl text-accent transition-all active:scale-90 hover:bg-accent/10 flex items-center justify-center">
         <Phone size={18} />
        </a>
        <button className={`p-2.5 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-surface-raised text-content-muted' : 'hover:bg-slate-100 text-content-muted'}`}><MoreVertical size={18} /></button>
       </div>
      </div>

      <div className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar transition-all ${dc ? 'bg-[#0f0f0f]' : 'bg-[#efeae2]'}`}
         style={!dc ? { backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px', opacity: 0.8 } : {}}>
       <div className="p-4 md:p-6 flex flex-col gap-4 min-h-full">
        <div className="flex justify-center mb-2">
         <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-normal shadow-sm ${dc ? 'bg-surface-raised/80 text-content-muted' : 'bg-surface/80 text-content-muted'}`}>Hoy</span>
        </div>
        {activeChatData.messages.map(msg => (
         <Message key={msg.id} type={msg.fromMe ? 'out' : 'in'} text={msg.text} time={msg.time} media={msg.media} mimeType={msg.mimeType} isDarkMode={dc} />
        ))}
        <div ref={messagesEndRef} />
       </div>
      </div>

      {/* File Preview */}
      {(selectedFile || mediaBase64) && (
       <div className={`px-6 py-4 flex items-center justify-between border-t animate-in slide-in-from-bottom duration-300 ${dc ? 'bg-surface-raised border-edge' : 'bg-surface-inset border-edge'}`}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center"><Paperclip size={20} /></div>
          <div className="max-w-md">
           <p className={`text-sm font-bold truncate ${dc ? 'text-content' : 'text-content'}`}>{selectedFile?.name || 'Archivo adjunto'}</p>
           <p className="body-text text-xs uppercase tracking-normal mt-0.5">Listo para enviar</p>
          </div>
        </div>
        <button onClick={() => { setSelectedFile(null); setMediaBase64(null); }} className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-content transition-all active:scale-90">
         <X size={20} />
        </button>
       </div>
      )}

      {/* Input Area */}
      {/* Quick Replies Popup (triggered by /) */}
      {inputText.startsWith('/') && (
        <div className={`absolute bottom-[100px] left-6 z-40 w-[calc(100%-3rem)] md:w-[410px] max-h-64 overflow-y-auto custom-scrollbar rounded-2xl shadow-2xl border animate-in slide-in-from-bottom-2 duration-200 ${dc ? 'bg-surface-raised border-edge' : 'bg-surface border-edge'}`}>
          <div className={`sticky top-0 p-3 border-b text-xs font-bold uppercase tracking-wider backdrop-blur-md z-10 ${dc ? 'border-edge bg-surface-raised/90 text-content-muted' : 'border-edge-light bg-surface/90 text-content-muted'}`}>Respuestas Rápidas</div>
          <div className="p-1">
            {quickReplies.filter(r => r.title.toLowerCase().includes(inputText.slice(1).toLowerCase())).map(reply => (
              <div 
                key={reply.id} 
                className={`p-3 rounded-xl mb-1 cursor-pointer transition-all hover:bg-accent/10 ${dc ? 'border-edge' : 'border-edge-light'}`}
                onClick={() => handleSelectQuickReply(reply)}
              >
                <div className="flex justify-between items-center mb-1">
                  <p className={`text-sm font-bold truncate ${dc ? 'text-content' : 'text-content'}`}>{reply.title}</p>
                  {reply.media && <Paperclip size={12} className="text-accent shrink-0" />}
                </div>
                <p className="text-xs text-content-muted truncate">{reply.text}</p>
              </div>
            ))}
            {quickReplies.filter(r => r.title.toLowerCase().includes(inputText.slice(1).toLowerCase())).length === 0 && (
              <div className="p-6 text-center text-xs text-content-muted">
                No hay respuestas guardadas que coincidan.
              </div>
            )}
          </div>
        </div>
      )}
      <div className={`p-6 border-t z-30 relative transition-colors ${dc ? 'bg-surface border-edge' : 'bg-surface border-edge shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'}`}>
       {selectedFile && mediaBase64 && (
         <div className="mb-3 relative inline-block animate-in fade-in slide-in-from-bottom-2 duration-200">
           {selectedFile.type.startsWith('image/') ? (
             <img src={mediaBase64} alt="Preview" className="h-20 w-auto rounded-xl border border-edge shadow-sm object-cover" />
           ) : (
             <div className="h-20 w-24 bg-surface-inset rounded-xl border border-edge flex flex-col items-center justify-center gap-1">
               <Paperclip size={24} className="text-content-muted" />
               <span className="text-[9px] truncate max-w-full px-2 text-content-muted">{selectedFile.name}</span>
             </div>
           )}
           <button 
            onClick={() => { setSelectedFile(null); setMediaBase64(null); }}
            className="absolute -top-2 -right-2 p-1 bg-surface border border-edge rounded-full text-rose-500 hover:text-white hover:bg-rose-500 shadow-md transition-colors"
           >
             <X size={12} />
           </button>
         </div>
       )}
       <div className={`flex items-center gap-1.5 md:gap-3 p-1.5 md:p-2 rounded-2xl border transition-all ${dc ? 'bg-surface-raised border-edge focus-within:border-accent/50' : 'bg-surface-inset border-edge focus-within:border-accent/50 focus-within:bg-surface focus-within:shadow-none'}`}>
        <div className="flex items-center gap-1 pl-1">
         <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
         <button onClick={() => fileInputRef.current?.click()} className={`p-2 md:p-3 rounded-xl transition-all active:scale-95 ${dc ? 'text-content-muted hover:text-accent hover:bg-accent/10' : 'text-content-muted hover:text-accent hover:bg-accent/10'}`}>
          <Paperclip size={20} />
         </button>
        </div>
        <textarea 
         rows={1}
         value={inputText}
         onChange={(e) => setInputText(e.target.value)}
         onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
         placeholder="Escribe un mensaje..."
         className={`flex-1 w-full min-w-0 bg-transparent py-2 md:py-3 px-1 md:px-2 text-sm font-medium focus:outline-none resize-none max-h-32 custom-scrollbar ${dc ? 'text-content placeholder-slate-600' : 'text-content placeholder-slate-400'}`}
        />
        <div className="flex items-center gap-1 md:gap-2 pr-1">
          <button className={`p-2 md:p-3 rounded-xl transition-all active:scale-95 ${dc ? 'text-content-muted hover:text-emerald-500 hover:bg-emerald-500/10' : 'text-content-muted hover:text-emerald-500 hover:bg-emerald-500/10'}`}><Smile size={20} /></button>
          <button onClick={handleSendMessage} className="bg-accent text-content p-3 md:p-4 rounded-2xl transition-all active:scale-90 hover:bg-accent-dark shadow-sm shadow-accent/30 flex items-center justify-center">
           <Send size={18} />
          </button>
        </div>
       </div>
      </div>
     </>
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

   {/* 3. Right Sidebar: Quick Replies */}
  </div>
 );
};

const ChatItem = ({ name, message, time, unread, active, status, onClick, isDarkMode, pipelineHelpers }: any) => {
 const dc = isDarkMode;

 return (
  <div onClick={onClick} className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 cursor-pointer rounded-2xl transition-all active:scale-[0.98] relative group ${active ? (dc ? 'bg-accent/10 ' : 'bg-accent/5') : (dc ? 'hover:bg-surface-raised/50' : 'hover:bg-surface-inset')}`}>
   {active && <div className="absolute left-0 top-3 bottom-3 md:top-4 md:bottom-4 w-1 bg-accent rounded-r-full"></div>}
   <div className="relative shrink-0">
    <img src={`https://ui-avatars.com/api/?name=${name}&background=random`} alt={name} className={`w-10 h-10 md:w-14 md:h-14 rounded-2xl object-cover shadow-sm border transition-transform group-hover:scale-105 ${dc ? 'border-edge' : 'border-white'}`} />
    {unread > 0 && <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-rose-500 rounded-full border-2 text-content text-[10px] md:text-xs font-semibold flex items-center justify-center shadow-lg animate-bounce border-white dark:border-slate-900">{unread}</div>}
   </div>
   <div className="flex-1 min-w-0">
    <div className="flex justify-between items-center mb-1">
     <h4 className={`text-xs md:text-sm font-bold truncate tracking-tight ${dc ? 'text-content' : 'text-content'}`}>{name}</h4>
     <span className={`text-[10px] md:text-xs whitespace-nowrap font-bold uppercase tracking-tight ${dc ? 'text-content-muted' : 'text-content-muted'}`}>{time}</span>
    </div>
    <p className={`text-[10px] md:text-xs truncate mb-1.5 md:mb-2 font-medium ${dc ? 'text-content-muted' : 'text-content-muted'}`}>{message}</p>
    <div className="flex items-center">
     <span className={`text-[9px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg uppercase tracking-wider shadow-sm`} style={pipelineHelpers.getStatusBadgeStyle(status || 'Nuevo')}>
      {status || 'Sin estado'}
     </span>
    </div>
   </div>
  </div>
 );
};

const Message = ({ type, text, time, media, mimeType, isDarkMode }: any) => {
 const dc = isDarkMode;
 const isOut = type === 'out';
 return (
  <div className={`flex flex-col ${isOut ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-2 duration-300 w-full`}>
   <div className={`relative max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl p-4 shadow-sm transition-all hover:shadow-md ${isOut ? 'bg-accent text-white rounded-tr-sm' : (dc ? 'bg-surface text-content border border-edge rounded-tl-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-tl-sm')}`}>
    {media && mimeType?.startsWith('image/') && (
     <img src={media} className="max-w-full sm:max-w-xs rounded-2xl mb-3 cursor-pointer hover:opacity-95 transition-opacity border border-white/10 shadow-lg" alt="Media" />
    )}
    {media && mimeType?.startsWith('video/') && (
     <video src={media} controls className="max-w-full sm:max-w-xs rounded-2xl mb-3 shadow-lg" />
    )}
    {media && mimeType?.startsWith('audio/') && (
     <audio src={media} controls className="max-w-full sm:max-w-xs mb-3 opacity-95 h-10" />
    )}
    {media && !mimeType?.startsWith('image/') && !mimeType?.startsWith('video/') && !mimeType?.startsWith('audio/') && (
      <a href={media} download className={`flex items-center gap-3 p-4 rounded-2xl mb-3 text-sm font-bold truncate transition-all ${dc ? 'bg-surface/5 hover:bg-surface/10' : 'bg-black/5 hover:bg-black/10'}`}>
       <Paperclip size={18} /> Archivo adjunto
      </a>
    )}
    {text && <p className={`text-sm font-medium leading-relaxed whitespace-pre-wrap break-words ${isOut ? 'text-white' : (dc ? 'text-content' : 'text-slate-800')}`}>{text}</p>}
    <div className={`flex items-center gap-1.5 mt-2 justify-end transition-opacity opacity-70 group-hover:opacity-100 ${isOut ? 'text-white/90' : (dc ? 'text-content-muted' : 'text-slate-500')}`}>
     <span className="text-xs font-bold tracking-normal">{time}</span>
     {isOut && <CheckCircle2 size={12} className="text-white/90" />}
    </div>
   </div>
  </div>
 );
};

export default ChatInterface;
