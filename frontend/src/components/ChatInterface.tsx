import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Phone, Video, Paperclip, Send, Smile, Filter, CheckCircle2, ArrowLeft, Zap, Plus, Edit2, Trash2, X, MessageSquare } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

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
  const [useN8n, setUseN8n] = useState(false);
  
  // Quick Replies
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyForm, setReplyForm] = useState<Partial<QuickReply>>({});
  
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

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChat]);

  // WebSocket connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    console.log(`[Socket] Conectando a ${socketUrl}...`);
    const newSocket = io(socketUrl);
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
            unread: activeChat === chatId ? 0 : existingChat.unread + 1,
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
        const token = localStorage.getItem('token');
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
        const token = localStorage.getItem('token');
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
      fileName: selectedFile?.name
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
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const handleSelectChat = (id: string) => {
    setActiveChat(id);
    setChats(prev => ({
      ...prev,
      [id]: { ...prev[id], unread: 0 }
    }));
  };

  const handleSelectQuickReply = (reply: QuickReply) => {
    let parsedText = reply.text;
    if (activeChatData) {
      parsedText = parsedText.replace(/{{nombre}}/g, activeChatData.name);
      parsedText = parsedText.replace(/{{proyecto}}/g, 'Proyecto');
    }
    
    setInputText(parsedText);
    if (reply.media) {
      setMediaBase64(reply.media);
      if (reply.mimeType) {
        const fakeFile = new File([new Blob()], reply.fileName || 'archivo_adjunto', { type: reply.mimeType });
        setSelectedFile(fakeFile);
      }
    }
    setShowQuickReplies(false);
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
  const chatList = Object.values(chats).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const dc = isDarkMode;

  return (
    <div className={`flex flex-1 h-[calc(100vh-4rem)] md:h-full overflow-hidden transition-colors ${dc ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      
      {/* 1. Sidebar: Chat List */}
      <div className={`${activeChat ? 'hidden lg:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r flex-col z-20 h-full transition-colors ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`h-16 flex-shrink-0 flex items-center justify-between px-6 border-b transition-colors ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-50'}`}>
          <div className="flex items-center gap-3">
            <h2 className="h3">Mensajes</h2>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
               <span className="text-[10px] font-bold uppercase tracking-wider">Live</span>
            </div>
          </div>
          <div className={`flex gap-1 ${dc ? 'text-slate-400' : 'text-slate-500'}`}>
            <button className={`p-2 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Filter size={18} /></button>
            <button className={`p-2 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Plus size={18} /></button>
          </div>
        </div>

        <div className="p-4 flex-shrink-0">
          <div className="relative group">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${dc ? 'text-slate-500 group-focus-within:text-primary' : 'text-slate-400 group-focus-within:text-primary'}`} size={16} />
            <input 
              type="text" 
              placeholder="Buscar conversación..." 
              className={`w-full pl-11 pr-4 py-3 border rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all ${dc ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-primary' : 'bg-slate-50 border-slate-100 text-slate-800 placeholder-slate-400 focus:border-primary focus:bg-white'}`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-transparent p-2 space-y-1">
          {chatList.length === 0 ? (
            <div className={`p-12 text-center mt-10 space-y-4 ${dc ? 'text-slate-600' : 'text-slate-400'}`}>
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center opacity-20 ${dc ? 'bg-slate-800' : 'bg-slate-100'}`}>
                 <MessageSquare size={32} />
              </div>
              <div>
                <p className="text-sm font-bold">Esperando mensajes...</p>
                <p className="body-text text-xs mt-2 uppercase tracking-widest opacity-60">Sincroniza WhatsApp para comenzar</p>
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
                onClick={() => handleSelectChat(chat.id)} 
              />
            ))
          )}
        </div>
      </div>

      {/* 2. Main Area: Conversation */}
      <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative h-full transition-colors ${dc ? 'bg-[#0f0f0f]' : 'bg-[#f0f2f5]'}`}>
        {activeChatData ? (
          <>
            {/* Header */}
            <div className={`h-16 flex-shrink-0 flex items-center justify-between px-6 backdrop-blur-md border-b z-30 transition-colors ${dc ? 'bg-[#1E1E1E]/90 border-slate-800' : 'bg-white/90 border-slate-100'}`}>
              <div className="flex items-center gap-4 overflow-hidden">
                <button onClick={() => setActiveChat(null)} className={`lg:hidden p-2 -ml-2 rounded-full transition-colors ${dc ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <ArrowLeft size={20} />
                </button>
                <div className="relative group cursor-pointer">
                  <img src={`https://ui-avatars.com/api/?name=${activeChatData.name}&background=random`} alt="Profile" className={`w-10 h-10 rounded-2xl object-cover shadow-sm border transition-transform group-hover:scale-105 ${dc ? 'border-slate-700' : 'border-slate-100'}`} />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-[#1E1E1E] rounded-full"></div>
                </div>
                <div className="truncate">
                  <h3 className={`text-sm font-bold truncate tracking-tight ${dc ? 'text-slate-100' : 'text-slate-800'}`}>
                    {activeChatData.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">En línea</span>
                    <span className="text-slate-400 text-[10px]">•</span>
                    <span className="text-slate-400 text-[10px] truncate">{activeChatData.id.split('@')[0]}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className={`hidden sm:flex items-center p-1 rounded-xl transition-colors ${dc ? 'bg-slate-800/50' : 'bg-slate-100'}`}>
                   <button onClick={() => toggleN8nMode(false)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${!useN8n ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}>Bot local</button>
                   <button onClick={() => toggleN8nMode(true)} className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${useN8n ? 'bg-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-400'}`}>Bot n8n</button>
                </div>
                <div className="w-px h-6 mx-2 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                <button className="p-2.5 rounded-xl text-primary transition-all active:scale-90 hover:bg-primary/10"><Phone size={18} /></button>
                <button 
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className={`p-2.5 rounded-xl transition-all active:scale-90 lg:hidden ${showQuickReplies ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-amber-500 bg-amber-500/10'}`}
                >
                  <Zap size={18} />
                </button>
                <button className={`p-2.5 rounded-xl transition-all active:scale-90 ${dc ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar transition-all ${dc ? 'bg-[#0f0f0f]' : 'bg-[#efeae2]'}`}
                 style={!dc ? { backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px', opacity: 0.8 } : {}}>
              <div className="flex justify-center mb-6">
                <span className={`px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${dc ? 'bg-slate-800/80 text-slate-400' : 'bg-white/80 text-slate-500'}`}>Hoy</span>
              </div>
              {activeChatData.messages.map(msg => (
                <Message key={msg.id} type={msg.fromMe ? 'out' : 'in'} text={msg.text} time={msg.time} media={msg.media} mimeType={msg.mimeType} isDarkMode={dc} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* File Preview */}
            {(selectedFile || mediaBase64) && (
              <div className={`px-6 py-4 flex items-center justify-between border-t animate-in slide-in-from-bottom duration-300 ${dc ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner"><Paperclip size={20} /></div>
                   <div className="max-w-md">
                      <p className={`text-sm font-bold truncate ${dc ? 'text-white' : 'text-slate-800'}`}>{selectedFile?.name || 'Archivo adjunto'}</p>
                      <p className="body-text text-[10px] uppercase tracking-widest mt-0.5">Listo para enviar</p>
                   </div>
                </div>
                <button onClick={() => { setSelectedFile(null); setMediaBase64(null); }} className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90">
                  <X size={20} />
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className={`p-6 border-t z-30 transition-colors ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'}`}>
              <div className={`flex items-center gap-3 p-2 rounded-2xl border transition-all ${dc ? 'bg-slate-900 border-slate-700 focus-within:border-primary/50' : 'bg-slate-50 border-slate-100 focus-within:border-primary/50 focus-within:bg-white shadow-inner focus-within:shadow-none'}`}>
                <div className="flex items-center gap-1 pl-1">
                  <button onClick={() => setShowQuickReplies(!showQuickReplies)} className={`p-3 rounded-xl transition-all active:scale-95 ${showQuickReplies ? 'text-white bg-amber-500 shadow-lg' : (dc ? 'text-slate-500 hover:text-amber-500 hover:bg-amber-500/10' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10')}`}>
                    <Zap size={22} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  <button onClick={() => fileInputRef.current?.click()} className={`p-3 rounded-xl transition-all active:scale-95 ${dc ? 'text-slate-500 hover:text-primary hover:bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}`}>
                    <Paperclip size={22} />
                  </button>
                </div>
                <textarea 
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Escribe un mensaje..."
                  className={`flex-1 bg-transparent py-3 px-1 text-sm font-medium focus:outline-none resize-none max-h-32 custom-scrollbar ${dc ? 'text-white placeholder-slate-600' : 'text-slate-800 placeholder-slate-400'}`}
                />
                <div className="flex items-center gap-2 pr-1">
                   <button className={`p-3 rounded-xl transition-all active:scale-95 ${dc ? 'text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10'}`}><Smile size={22} /></button>
                   <button onClick={handleSendMessage} className="bg-primary text-white p-4 rounded-2xl transition-all active:scale-90 hover:bg-primary-dark shadow-xl shadow-primary/30 flex items-center justify-center">
                     <Send size={20} />
                   </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
            <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center shadow-2xl mb-10 transition-all rotate-3 ${dc ? 'bg-slate-800/50 border border-slate-700' : 'bg-white border border-slate-100'}`}>
              <MessageSquare size={64} className="text-primary opacity-20" />
            </div>
            <h2 className="h1 mb-4">ChatPrex mensajes</h2>
            <p className="body-text max-w-sm mx-auto">
              Gestiona todos tus leads de WhatsApp en un solo lugar. Selecciona un chat para comenzar la comunicación.
            </p>
            <div className="mt-12 flex gap-8">
               <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner"><Zap size={24} /></div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">IA Activa</p>
               </div>
               <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center shadow-inner"><CheckCircle2 size={24} /></div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Multicanal</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Sidebar: Quick Replies */}
      <div className={`${showQuickReplies ? 'flex' : 'hidden'} lg:flex w-full md:w-80 lg:w-96 border-l flex-col h-full z-40 transition-all animate-in slide-in-from-right duration-300 ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`h-16 flex-shrink-0 flex items-center justify-between px-6 border-b transition-colors ${dc ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-50'}`}>
          <div className="flex items-center gap-3 text-amber-500">
             <Zap size={20} fill="currentColor" />
             <h2 className="h3">Respuestas</h2>
          </div>
          <button 
            onClick={() => { setReplyForm({}); setShowReplyForm(true); }}
            className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-all active:scale-90 shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
          </button>
        </div>

        {showReplyForm ? (
          <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar space-y-8 animate-in fade-in duration-300">
            <div className="space-y-3">
              <label className="label-text ml-1">Título de la respuesta</label>
              <input 
                type="text" 
                placeholder="Ej: Bienvenida general" 
                className={`w-full p-4 text-sm font-bold rounded-2xl border focus:ring-4 focus:ring-primary/10 outline-none transition-all ${dc ? 'bg-slate-900 border-slate-700 text-white' : 'bg-slate-50 border-slate-100 text-slate-800 shadow-inner'}`} 
                value={replyForm.title || ''} 
                onChange={e => setReplyForm({...replyForm, title: e.target.value})} 
              />
            </div>
            <div className="space-y-3">
              <label className="label-text ml-1">Contenido del mensaje</label>
              <textarea 
                rows={8} 
                placeholder="Escribe el mensaje aquí..." 
                className={`w-full p-6 text-sm font-medium rounded-3xl border focus:ring-4 focus:ring-primary/10 outline-none transition-all resize-none leading-relaxed ${dc ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700 shadow-inner'}`} 
                value={replyForm.text || ''} 
                onChange={e => setReplyForm({...replyForm, text: e.target.value})} 
              />
              <p className="body-text text-[10px] italic">Usa {"{{nombre}}"} para personalizar automáticamente.</p>
            </div>
            
            <div className="space-y-3">
              <label className="label-text ml-1">Archivo adjunto</label>
              <label className={`flex items-center gap-4 p-5 rounded-3xl border-2 border-dashed cursor-pointer transition-all hover:bg-primary/5 ${dc ? 'border-slate-800 bg-slate-800/50 hover:border-primary/50' : 'border-slate-100 bg-slate-50 hover:border-primary/30'}`}>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner"><Paperclip size={20} /></div>
                <div className="flex-1 overflow-hidden">
                   <p className={`text-xs font-bold truncate ${dc ? 'text-slate-100' : 'text-slate-800'}`}>{replyForm.fileName || 'Seleccionar archivo'}</p>
                   <p className="text-[10px] text-slate-500 font-medium">Imagen, PDF o video</p>
                </div>
                <input type="file" className="hidden" onChange={handleReplyFileChange} />
              </label>
            </div>

            <div className="pt-6 flex gap-4 mt-auto">
              <button onClick={() => setShowReplyForm(false)} className={`flex-1 py-4 text-xs rounded-2xl font-bold transition-all active:scale-95 ${dc ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 shadow-sm'}`}>Cancelar</button>
              <button onClick={handleSaveReplyForm} className="flex-1 py-4 text-xs rounded-2xl font-bold bg-primary text-white hover:bg-primary-dark transition-all active:scale-95 shadow-xl shadow-primary/20">Guardar</button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-5 border-b transition-colors bg-slate-50/50 dark:bg-slate-900/30">
               <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={14} />
                  <input type="text" placeholder="Buscar respuesta..." className={`w-full pl-10 pr-4 py-3 text-xs font-bold border rounded-2xl outline-none transition-all ${dc ? 'bg-slate-900 border-slate-700 text-white focus:border-primary' : 'bg-white border-slate-100 focus:border-primary focus:bg-white shadow-sm'}`} />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
              {quickReplies.length === 0 ? (
                <div className="text-center py-20 opacity-20 space-y-4">
                   <Zap size={64} className="mx-auto" />
                   <p className="text-xs font-bold uppercase tracking-[2px]">Sin respuestas</p>
                </div>
              ) : (
                quickReplies.map(reply => (
                  <div key={reply.id} className={`p-6 rounded-3xl border transition-all cursor-pointer group animate-in slide-in-from-right duration-300 ${dc ? 'bg-[#252525] border-slate-800 hover:border-primary/50' : 'bg-white border-slate-50 hover:border-primary/30 shadow-sm hover:shadow-lg'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div onClick={() => handleSelectQuickReply(reply)} className="flex-1">
                        <h4 className={`text-sm font-bold mb-1 group-hover:text-primary transition-colors tracking-tight ${dc ? 'text-slate-100' : 'text-slate-800'}`}>{reply.title}</h4>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setReplyForm(reply); setShowReplyForm(true); }} className={`p-2 rounded-xl transition-all ${dc ? 'hover:bg-slate-700 text-slate-500 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-primary'}`}><Edit2 size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteReply(reply.id); }} className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-all"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <p onClick={() => handleSelectQuickReply(reply)} className={`body-text text-xs line-clamp-3 leading-relaxed ${dc ? 'text-slate-400' : 'text-slate-500'}`}>{reply.text}</p>
                    {reply.fileName && (
                      <div className="mt-4 flex items-center gap-3 p-3 rounded-2xl bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary shadow-sm">
                        <Paperclip size={12} /> <span className="truncate">{reply.fileName}</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className={`p-8 border-t text-center transition-colors ${dc ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50'}`}>
                <p className="text-[10px] font-bold uppercase tracking-[2px] text-primary mb-2">Tip ChatPrex</p>
                <p className="body-text text-[11px] italic">Usa el botón de rayo <span className="font-bold">/</span> para acceder rápido a tus plantillas guardadas.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatItem = ({ name, message, time, unread, active, status, onClick, isDarkMode }: any) => {
  const dc = isDarkMode;
  const getStatusStyle = (s: string) => {
    const st = s.toLowerCase();
    if (st.includes('nuevo')) return dc ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-700';
    if (st.includes('contactado')) return dc ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-50 text-sky-700';
    if (st.includes('cita')) return dc ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-700';
    if (st.includes('negociaci')) return dc ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-700';
    if (st.includes('ganado') || st.includes('cierre')) return dc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700';
    if (st.includes('perdido')) return dc ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-700';
    return dc ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600';
  };

  return (
    <div onClick={onClick} className={`flex items-center gap-4 p-4 cursor-pointer rounded-2xl transition-all active:scale-[0.98] relative group ${active ? (dc ? 'bg-primary/10 shadow-inner' : 'bg-primary/5') : (dc ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50')}`}>
      {active && <div className="absolute left-0 top-4 bottom-4 w-1 bg-primary rounded-r-full"></div>}
      <div className="relative shrink-0">
        <img src={`https://ui-avatars.com/api/?name=${name}&background=random`} alt={name} className={`w-14 h-14 rounded-2xl object-cover shadow-sm border transition-transform group-hover:scale-105 ${dc ? 'border-slate-700' : 'border-white'}`} />
        {unread > 0 && <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] px-1 bg-rose-500 rounded-full border-2 text-white text-[10px] font-black flex items-center justify-center shadow-lg animate-bounce border-white dark:border-slate-900">{unread}</div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h4 className={`text-sm font-bold truncate tracking-tight ${dc ? 'text-slate-100' : 'text-slate-800'}`}>{name}</h4>
          <span className={`text-[10px] whitespace-nowrap font-bold uppercase tracking-tight ${dc ? 'text-slate-500' : 'text-slate-400'}`}>{time}</span>
        </div>
        <p className={`text-xs truncate mb-2 font-medium ${dc ? 'text-slate-500' : 'text-slate-500'}`}>{message}</p>
        <div className="flex items-center">
          <span className={`text-[9px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm ${getStatusStyle(status || '')}`}>
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
    <div className={`flex flex-col ${isOut ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
      <div className={`relative max-w-[85%] rounded-[24px] p-4 shadow-xl transition-all hover:shadow-2xl ${isOut ? (dc ? 'bg-primary text-white rounded-tr-none' : 'bg-primary text-white rounded-tr-none') : (dc ? 'bg-[#1E1E1E] text-slate-100 border border-slate-800 rounded-tl-none' : 'bg-white text-slate-800 rounded-tl-none')}`}>
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
           <a href={media} download className={`flex items-center gap-3 p-4 rounded-2xl mb-3 text-sm font-bold truncate transition-all ${dc ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}>
             <Paperclip size={18} /> Archivo adjunto
           </a>
        )}
        {text && <p className="text-[13px] font-medium leading-relaxed">{text}</p>}
        <div className={`flex items-center gap-2 mt-2 justify-end transition-opacity opacity-70 group-hover:opacity-100 ${isOut ? 'text-white' : (dc ? 'text-slate-500' : 'text-slate-400')}`}>
          <span className="text-[10px] font-bold tracking-widest">{time}</span>
          {isOut && <CheckCircle2 size={14} className={dc ? 'text-white' : 'text-white'} />}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
