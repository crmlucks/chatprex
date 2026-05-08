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
  
  // Respuestas Rápidas
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

  // Auto-scroll al fondo cuando hay mensajes nuevos
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChat]);

  // Conexión WebSockets para recibir mensajes en tiempo real
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
            // Si no estamos en el chat actual, aumentamos los no leídos
            unread: activeChat === chatId ? 0 : existingChat.unread + 1,
            messages: [...existingChat.messages, newMsg]
          }
        };
      });
    });

    return () => {
      newSocket.disconnect();
    };
  }, []); // <-- Removido activeChat de aquí para evitar reconexiones constantes

  // Cargar la lista inicial de todos los chats al abrir la página
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
            ...prev // Preservar si llegaron mensajes por socket antes de que cargara
          }));
        }
      } catch (err) {
        console.error('[Chat] Error cargando lista de chats:', err);
      }
    };
    
    fetchChats();
  }, []);

  // Cargar historial de mensajes al seleccionar un chat
  useEffect(() => {
    if (!activeChat) return;
    
    // Solo cargar si no hay mensajes (para evitar sobrescribir mensajes nuevos si ya están en memoria)
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
    
    // Enviar al Backend
    socket.emit('send-message', {
      to: activeChat,
      text: inputText,
      media: mediaBase64,
      fileName: selectedFile?.name
    });

    // Agregar a la UI inmediatamente
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
        lastMessage: inputText || '[Archivo Multimedia]',
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
    // Limpiar unreads
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
      // Construct a fake File object so the UI shows an attachment name
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

  return (
    <div className={`flex flex-1 h-[calc(100vh-4rem)] md:h-full overflow-hidden transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      
      {/* 1. Panel Izquierdo: Lista de Chats (WhatsApp Style) */}
      <div className={`${activeChat ? 'hidden lg:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r flex-col shadow-sm z-20 h-full transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`h-16 flex-shrink-0 flex items-center justify-between px-4 border-b transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-2">
            <h2 className={`font-bold text-[18px] md:text-[20px] ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Mensajes</h2>
            <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Live</span>
          </div>
          <div className={`flex gap-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <button className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Filter size={18} /></button>
            <button className={`p-2 rounded-xl transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Plus size={18} /></button>
          </div>
        </div>

        <div className="p-4 flex-shrink-0">
          <div className="relative group">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-slate-500 group-focus-within:text-primary' : 'text-slate-400 group-focus-within:text-primary'}`} size={16} />
            <input 
              type="text" 
              placeholder="Buscar conversación..." 
              className={`w-full pl-10 pr-4 py-2.5 border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-transparent">
          {chatList.length === 0 ? (
            <div className={`p-8 text-center mt-10 animate-pulse ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-4 flex items-center justify-center opacity-20">
                 <MessageSquare size={32} />
              </div>
              <p className="text-sm font-bold">Esperando mensajes...</p>
              <p className="text-[10px] mt-2 uppercase tracking-widest opacity-60">Escanea el QR en Conexiones para activar</p>
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
                isDarkMode={isDarkMode}
                onClick={() => handleSelectChat(chat.id)} 
              />
            ))
          )}
        </div>
      </div>

      {/* 2. Panel Central: Conversación (Modern Layout) */}
      <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative h-full transition-colors ${isDarkMode ? 'bg-[#151316]' : 'bg-[#f0f2f5]'}`}>
        {activeChatData ? (
          <>
            {/* Header Conversación */}
            <div className={`h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 backdrop-blur-md border-b z-30 transition-colors ${isDarkMode ? 'bg-[#1E1E1E]/90 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
              <div className="flex items-center gap-3 overflow-hidden">
                <button onClick={() => setActiveChat(null)} className={`lg:hidden p-2 -ml-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <ArrowLeft size={20} />
                </button>
                <div className="relative">
                  <img src={`https://ui-avatars.com/api/?name=${activeChatData.name}&background=random`} alt="Profile" className={`w-10 h-10 rounded-full object-cover shadow-sm border ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`} />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#1E1E1E] rounded-full"></div>
                </div>
                <div className="truncate">
                  <h3 className={`font-bold text-[14px] md:text-[15px] truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    {activeChatData.name}
                  </h3>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">En línea</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1 md:gap-2">
                <div className={`hidden sm:flex items-center p-1 rounded-xl transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                   <button onClick={() => toggleN8nMode(false)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${!useN8n ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}>Bot Local</button>
                   <button onClick={() => toggleN8nMode(true)} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${useN8n ? 'bg-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}>Bot n8n</button>
                </div>
                <div className="w-px h-6 mx-2 bg-slate-200 dark:bg-slate-800 hidden sm:block"></div>
                <button className={`p-2.5 rounded-xl text-primary transition-all active:scale-90 hover:bg-primary/10`}><Phone size={18} /></button>
                <button 
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className={`p-2.5 rounded-xl transition-all active:scale-90 lg:hidden ${showQuickReplies ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-amber-500 bg-amber-500/10'}`}
                >
                  <Zap size={18} />
                </button>
                <button className={`p-2.5 rounded-xl transition-all active:scale-90 ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><MoreVertical size={18} /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div className={`flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3 custom-scrollbar transition-all ${isDarkMode ? 'bg-[#0b0a0b]' : 'bg-[#e5ddd5]'}`}
                 style={!isDarkMode ? { backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundAlpha: 0.1, backgroundSize: '400px' } : {}}>
              <div className="flex justify-center mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${isDarkMode ? 'bg-slate-800/80 text-slate-400' : 'bg-white/80 text-slate-500'}`}>Hoy</span>
              </div>
              {activeChatData.messages.map(msg => (
                <Message key={msg.id} type={msg.fromMe ? 'out' : 'in'} text={msg.text} time={msg.time} media={msg.media} mimeType={msg.mimeType} isDarkMode={isDarkMode} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* File Preview */}
            {(selectedFile || mediaBase64) && (
              <div className={`px-4 py-3 flex items-center justify-between border-t border-primary/20 animate-in slide-in-from-bottom duration-300 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Paperclip size={18} /></div>
                   <div className="max-w-[200px]">
                      <p className={`text-xs font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{selectedFile?.name || 'Archivo adjunto'}</p>
                      <p className="text-[10px] text-slate-500">Listo para enviar</p>
                   </div>
                </div>
                <button onClick={() => { setSelectedFile(null); setMediaBase64(null); }} className="w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className={`p-4 border-t z-30 transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-center gap-2 p-1.5 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 focus-within:border-primary/50' : 'bg-slate-50 border-slate-200 focus-within:border-primary/50'}`}>
                <div className="flex items-center gap-1">
                  <button onClick={() => setShowQuickReplies(!showQuickReplies)} className={`p-2.5 rounded-xl transition-all active:scale-95 ${showQuickReplies ? 'text-white bg-amber-500 shadow-md' : (isDarkMode ? 'text-slate-500 hover:text-amber-500 hover:bg-amber-500/10' : 'text-slate-400 hover:text-amber-500 hover:bg-amber-500/10')}`}>
                    <Zap size={20} />
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                  <button onClick={() => fileInputRef.current?.click()} className={`p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'text-slate-500 hover:text-primary hover:bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}`}>
                    <Paperclip size={20} />
                  </button>
                </div>
                <textarea 
                  rows={1}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder="Escribe un mensaje..."
                  className={`flex-1 bg-transparent py-2 px-1 text-sm focus:outline-none resize-none max-h-32 custom-scrollbar ${isDarkMode ? 'text-white placeholder-slate-600' : 'text-slate-800 placeholder-slate-400'}`}
                />
                <div className="flex items-center gap-1 px-1">
                   <button className={`p-2.5 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10'}`}><Smile size={20} /></button>
                   <button onClick={handleSendMessage} className="bg-primary text-white p-3 rounded-xl transition-all active:scale-95 hover:bg-primary-dark shadow-lg shadow-primary/20 flex items-center justify-center">
                     <Send size={18} />
                   </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-1000">
            <div className={`w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl mb-8 transition-all rotate-3 ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-100'}`}>
              <MessageSquare size={64} className="text-primary opacity-20" />
            </div>
            <h2 className={`text-2xl font-black mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>ChatPrex Conversaciones</h2>
            <p className={`max-w-xs text-sm font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              Gestiona todos tus leads de WhatsApp en un solo lugar. Selecciona un chat para comenzar.
            </p>
            <div className="mt-10 flex gap-4">
               <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><Zap size={20} /></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">IA Activa</p>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center"><CheckCircle2 size={20} /></div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Multicanal</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Panel Derecho: Respuestas Rápidas & Contexto (Desktop Sidebar) */}
      <div className={`${showQuickReplies ? 'flex' : 'hidden'} lg:flex w-full md:w-80 lg:w-96 border-l flex-col h-full z-40 transition-all animate-in slide-in-from-right duration-300 ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`h-16 flex-shrink-0 flex items-center justify-between px-6 border-b transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center gap-2 text-amber-500">
             <Zap size={20} />
             <h2 className={`font-bold text-[16px] ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Respuestas</h2>
          </div>
          <button 
            onClick={() => { setReplyForm({}); setShowReplyForm(true); }}
            className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-all active:scale-95 shadow-sm"
          >
            <Plus size={18} />
          </button>
        </div>

        {showReplyForm ? (
          <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar space-y-5 animate-in fade-in duration-300">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Título de la respuesta</label>
              <input 
                type="text" 
                placeholder="Ej: Bienvenida General" 
                className={`w-full p-3 text-sm rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                value={replyForm.title || ''} 
                onChange={e => setReplyForm({...replyForm, title: e.target.value})} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Contenido del mensaje</label>
              <textarea 
                rows={8} 
                placeholder="Escribe el mensaje..." 
                className={`w-full p-3 text-sm rounded-xl border focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'}`} 
                value={replyForm.text || ''} 
                onChange={e => setReplyForm({...replyForm, text: e.target.value})} 
              />
              <p className="text-[10px] text-slate-500 font-medium italic">Puedes usar {"{{nombre}}"} para personalizar.</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Archivo Adjunto</label>
              <label className={`flex items-center gap-3 p-3 rounded-xl border border-dashed cursor-pointer transition-all hover:bg-primary/5 ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}>
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><Paperclip size={18} /></div>
                <div className="flex-1 overflow-hidden">
                   <p className="text-xs font-bold truncate">{replyForm.fileName || 'Seleccionar archivo'}</p>
                   <p className="text-[10px] text-slate-500">Imagen, PDF o Video</p>
                </div>
                <input type="file" className="hidden" onChange={handleReplyFileChange} />
              </label>
            </div>

            <div className="pt-4 flex gap-3 mt-auto">
              <button onClick={() => setShowReplyForm(false)} className={`flex-1 py-3 text-xs rounded-xl font-bold transition-all ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>Cancelar</button>
              <button onClick={handleSaveReplyForm} className="flex-1 py-3 text-xs rounded-xl font-bold bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">Guardar</button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b transition-colors bg-slate-50/50 dark:bg-slate-900/30">
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input type="text" placeholder="Buscar respuesta..." className={`w-full pl-9 pr-4 py-2 text-xs border rounded-xl outline-none ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`} />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
              {quickReplies.length === 0 ? (
                <div className="text-center py-10 opacity-30">
                   <Zap size={48} className="mx-auto mb-4" />
                   <p className="text-xs font-bold uppercase tracking-widest">Sin respuestas rápidas</p>
                </div>
              ) : (
                quickReplies.map(reply => (
                  <div key={reply.id} className={`p-4 rounded-2xl border transition-all cursor-pointer group animate-in slide-in-from-right duration-300 ${isDarkMode ? 'bg-[#252525] border-slate-800 hover:border-primary/50' : 'bg-white border-slate-100 hover:border-primary/30 shadow-sm'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div onClick={() => handleSelectQuickReply(reply)} className="flex-1">
                        <h4 className={`font-bold text-[13px] mb-1 group-hover:text-primary transition-colors ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{reply.title}</h4>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={(e) => { e.stopPropagation(); setReplyForm(reply); setShowReplyForm(true); }} className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-500' : 'hover:bg-slate-100 text-slate-400'}`}><Edit2 size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteReply(reply.id); }} className={`p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500`}><Trash2 size={12} /></button>
                      </div>
                    </div>
                    <p onClick={() => handleSelectQuickReply(reply)} className={`text-[11px] line-clamp-3 font-medium leading-relaxed ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{reply.text}</p>
                    {reply.fileName && (
                      <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 text-[10px] font-bold text-primary">
                        <Paperclip size={10} /> {reply.fileName}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
            <div className={`p-6 border-t text-center ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Truco Pro</p>
                <p className="text-[11px] text-slate-500 font-medium italic">Presiona la tecla <span className="font-bold text-primary">/</span> en el chat para buscar rápido.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChatItem = ({ name, message, time, unread, active, status, onClick, isDarkMode }: any) => {
  const getStatusStyle = (s: string) => {
    const st = s.toLowerCase();
    if (st.includes('nuevo')) return isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-700';
    if (st.includes('contactado')) return isDarkMode ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-700';
    if (st.includes('cita')) return isDarkMode ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-100 text-amber-700';
    if (st.includes('negociaci')) return isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-100 text-purple-700';
    if (st.includes('ganado') || st.includes('cierre')) return isDarkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700';
    if (st.includes('perdido')) return isDarkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-100 text-rose-700';
    return isDarkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-700';
  };

  return (
    <div onClick={onClick} className={`flex items-center gap-3 p-4 cursor-pointer border-b transition-all active:scale-[0.98] ${isDarkMode ? 'border-slate-800/50' : 'border-slate-50'} ${active ? (isDarkMode ? 'bg-primary/10 border-l-4 border-l-primary shadow-inner' : 'bg-primary/5 border-l-4 border-l-primary') : (isDarkMode ? 'hover:bg-white/5 border-l-4 border-l-transparent' : 'hover:bg-slate-50 border-l-4 border-l-transparent')}`}>
      <div className="relative shrink-0">
        <img src={`https://ui-avatars.com/api/?name=${name}&background=random`} alt={name} className={`w-12 h-12 rounded-full object-cover shadow-sm border ${isDarkMode ? 'border-slate-700' : 'border-white'}`} />
        {unread > 0 && <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 text-white text-[10px] font-bold flex items-center justify-center shadow-lg transition-colors border-white">{unread}</div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <h4 className={`font-semibold text-[13px] truncate ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{name}</h4>
          <span className={`text-[11px] whitespace-nowrap font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{time}</span>
        </div>
        <p className={`text-[12px] truncate mb-1.5 font-normal ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>{message}</p>
        <div className="flex items-center">
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md lowercase tracking-wider ${getStatusStyle(status || '')}`}>
            {status || 'sin estado'}
          </span>
        </div>
      </div>
    </div>
  );
};

const Message = ({ type, text, time, media, mimeType, isDarkMode }: any) => {
  const isOut = type === 'out';
  return (
    <div className={`flex flex-col ${isOut ? 'items-end' : 'items-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
      <div className={`message-bubble ${isOut ? (isDarkMode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'message-bubble-out') : (isDarkMode ? 'bg-[#1E1E1E] text-slate-200 border border-slate-800 shadow-sm' : 'message-bubble-in')} relative max-w-[85%] rounded-2xl p-3`}>
        {media && mimeType?.startsWith('image/') && (
          <img src={media} className="max-w-[200px] sm:max-w-xs rounded-xl mb-2 cursor-pointer hover:opacity-90 transition-opacity border border-white/10 shadow-lg" alt="Media" />
        )}
        {media && mimeType?.startsWith('video/') && (
          <video src={media} controls className="max-w-[200px] sm:max-w-xs rounded-xl mb-2 shadow-lg" />
        )}
        {media && mimeType?.startsWith('audio/') && (
          <audio src={media} controls className="max-w-[200px] sm:max-w-xs mb-2 opacity-90" />
        )}
        {media && !mimeType?.startsWith('image/') && !mimeType?.startsWith('video/') && !mimeType?.startsWith('audio/') && (
           <a href={media} download className={`flex items-center gap-2 p-3 rounded-xl mb-2 text-sm underline truncate transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}>
             📁 Archivo adjunto
           </a>
        )}
        {text && <p className="leading-relaxed text-[12px] md:text-[13px] font-normal">{text}</p>}
        <div className={`flex items-center gap-1 mt-1 justify-end transition-colors ${isOut ? (isDarkMode ? 'text-white/60' : 'text-slate-600') : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`}>
          <span className="text-[11px] font-medium tracking-tight">{time}</span>
          {isOut && <CheckCircle2 size={12} className={isOut ? (isDarkMode ? 'text-white' : 'text-blue-500') : ''} />}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
