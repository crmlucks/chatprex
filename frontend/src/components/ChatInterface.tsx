import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Phone, Video, Paperclip, Send, Smile, Filter, CheckCircle2, ArrowLeft } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  media?: string;
  mimeType?: string;
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
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const activeChatData = activeChat ? chats[activeChat] : null;
  const chatList = Object.values(chats).sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return (
    <div className={`flex flex-1 h-[calc(100vh-4rem)] md:h-full overflow-hidden transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      {/* Panel Izquierdo: Lista de Chats */}
      <div className={`${activeChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r flex-col shadow-sm z-10 h-full transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`h-16 flex-shrink-0 flex items-center justify-between px-4 border-b transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-100'}`}>
          <h2 className={`font-bold text-[18px] md:text-[20px] ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Conversaciones</h2>
          <div className={`flex gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Filter size={18} /></button>
            <button className={`p-2 rounded-full transition-colors ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><MoreVertical size={18} /></button>
          </div>
        </div>

        <div className="p-3 flex-shrink-0">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={16} />
            <input 
              type="text" 
              placeholder="Buscar lead o mensaje..." 
              className={`w-full pl-9 pr-4 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {chatList.length === 0 ? (
            <div className={`p-6 text-center text-sm mt-10 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <p>No hay mensajes recientes.</p>
              <p className="text-xs mt-2">Envía un mensaje a este número de WhatsApp para iniciar un chat.</p>
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

      {/* Panel Derecho: Conversación Activa */}
      <div className={`${activeChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col relative h-full transition-colors ${isDarkMode ? 'bg-[#181619]' : 'bg-chat-pattern'}`}>
        {activeChatData ? (
          <>
            <div className={`h-16 flex-shrink-0 flex items-center justify-between px-4 md:px-6 backdrop-blur-sm border-b shadow-sm z-10 transition-colors ${isDarkMode ? 'bg-[#1E1E1E]/95 border-slate-800' : 'bg-white/95 border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className={`md:hidden p-2 -ml-2 rounded-full transition-colors ${isDarkMode ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <ArrowLeft size={20} />
                </button>
                <img src={`https://ui-avatars.com/api/?name=${activeChatData.name}&background=random`} alt="Profile" className={`w-10 h-10 rounded-full object-cover shadow-sm border ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`} />
                <div>
                  <h3 className={`font-bold text-[14px] md:text-[16px] flex items-center gap-2 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                    {activeChatData.name}
                    <select
                      className={`text-xs px-2 py-0.5 rounded ml-2 font-normal ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                      value={useN8n ? 'n8n' : 'local'}
                      onChange={(e) => toggleN8nMode(e.target.value === 'n8n')}
                    >
                      <option value="local">Modo IA: Local</option>
                      <option value="n8n">Modo IA: n8n</option>
                    </select>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      {activeChatData.id.includes('@lid') 
                        ? 'Usuario Privado (LID)' 
                        : activeChatData.id.includes('@g.us') 
                          ? 'Grupo' 
                          : `+${activeChatData.id.split('@')[0].split(':')[0]}`}
                    </span>
                  </div>
                </div>
              </div>
              <div className={`flex items-center gap-1 md:gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                <button className={`p-2 md:p-2.5 rounded-full text-primary transition-all active:scale-90 ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Phone size={18} /></button>
                <button className={`hidden sm:block p-2.5 rounded-full text-primary transition-all active:scale-90 ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><Video size={18} /></button>
                <div className={`w-px h-6 mx-1 transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}></div>
                <button className={`p-2 md:p-2.5 rounded-full transition-all active:scale-90 ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><MoreVertical size={18} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4 custom-scrollbar">
              {activeChatData.messages.map(msg => (
                <Message key={msg.id} type={msg.fromMe ? 'out' : 'in'} text={msg.text} time={msg.time} media={msg.media} mimeType={msg.mimeType} isDarkMode={isDarkMode} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {selectedFile && (
              <div className={`px-4 py-2 flex items-center justify-between border-t transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                <span className={`text-xs truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{selectedFile.name}</span>
                <button onClick={() => { setSelectedFile(null); setMediaBase64(null); }} className="text-rose-500 text-xs font-bold px-2 hover:text-rose-400">X</button>
              </div>
            )}
            <div className={`p-3 md:p-4 border-t transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className={`flex items-center gap-3 p-1 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 focus-within:border-primary/50' : 'bg-slate-50 border-slate-200 focus-within:border-primary/50'}`}>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                <button onClick={() => fileInputRef.current?.click()} className={`p-2 rounded-xl transition-all active:scale-95 ${isDarkMode ? 'text-slate-500 hover:text-primary hover:bg-primary/10' : 'text-slate-400 hover:text-primary hover:bg-primary/10'}`}>
                  <Paperclip size={18} />
                </button>
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Escribe un mensaje..."
                  className={`flex-1 bg-transparent py-2 text-xs md:text-sm focus:outline-none ${isDarkMode ? 'text-white placeholder-slate-600' : 'text-slate-800 placeholder-slate-400'}`}
                />
                <button onClick={handleSendMessage} className="bg-primary text-white p-2 md:p-2.5 rounded-xl transition-all active:scale-95 hover:bg-primary-dark shadow-lg shadow-primary/20">
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-sm mb-4 transition-colors ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
            <p className={`font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>WhatsApp Vinculado Exitosamente</p>
            <p className="text-xs mt-1">Selecciona o espera un mensaje para iniciar el chat</p>
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
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getStatusStyle(status || '')}`}>
            {status || 'Sin Estado'}
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
