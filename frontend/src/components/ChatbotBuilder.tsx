import React, { useState } from 'react';
import { Bot, Save, UploadCloud, MessageSquare, Play, Settings, RefreshCw, FileText, Key } from 'lucide-react';

const ChatbotBuilder = ({ isDarkMode }: { isDarkMode?: boolean }) => {
  const [activeTab, setActiveTab] = useState('prompt');

  return (
    <div className={`flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 flex flex-col md:flex-row gap-6 transition-colors ${isDarkMode ? 'bg-[#121212]' : 'bg-surface-dim'}`}>
      {/* Columna Izquierda: Configuración */}
      <div className={`flex-1 rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`border-b p-4 md:p-6 flex justify-between items-center transition-colors ${isDarkMode ? 'border-slate-800/50 bg-[#252525]' : 'border-slate-100 bg-slate-50'}`}>
          <div>
            <h1 className={`text-[18px] md:text-[20px] font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
              <Bot className="text-primary" size={24} /> Asistente de Ventas IA
            </h1>
            <p className={`text-[12px] md:text-[13px] mt-1 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>Configura el comportamiento y la base de conocimiento</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              En línea
            </span>
          </div>
        </div>

        {/* Tabs Locales */}
        <div className={`flex px-6 border-b transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <button onClick={() => setActiveTab('prompt')} className={`py-4 px-4 font-bold text-[12px] md:text-[13px] border-b-2 transition-all ${activeTab === 'prompt' ? 'border-primary text-primary' : (isDarkMode ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-500 hover:text-slate-800')}`}>
            Personalidad (Prompt)
          </button>
          <button onClick={() => setActiveTab('brain')} className={`py-4 px-4 font-bold text-[12px] md:text-[13px] border-b-2 transition-all ${activeTab === 'brain' ? 'border-primary text-primary' : (isDarkMode ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-500 hover:text-slate-800')}`}>
            Motor IA (Cerebro)
          </button>
          <button onClick={() => setActiveTab('knowledge')} className={`py-4 px-4 font-bold text-[12px] md:text-[13px] border-b-2 transition-all ${activeTab === 'knowledge' ? 'border-primary text-primary' : (isDarkMode ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-500 hover:text-slate-800')}`}>
            Base de Conocimiento
          </button>
          <button onClick={() => setActiveTab('settings')} className={`py-4 px-4 font-bold text-[12px] md:text-[13px] border-b-2 transition-all ${activeTab === 'settings' ? 'border-primary text-primary' : (isDarkMode ? 'border-transparent text-slate-500 hover:text-slate-300' : 'border-transparent text-slate-500 hover:text-slate-800')}`}>
            Comportamiento
          </button>
        </div>

        {/* Contenido de Configuración */}
        <div className={`flex-1 p-6 overflow-y-auto transition-colors ${isDarkMode ? 'bg-[#1E1E1E]' : 'bg-white'}`}>
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              <div className="flex justify-between items-end mb-2">
                <label className={`block text-[13px] font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>Instrucciones Principales del Bot</label>
                <button className="text-[11px] text-primary font-bold flex items-center gap-1 hover:underline"><RefreshCw size={12} /> Cargar Plantilla Inmobiliaria</button>
              </div>
              <textarea 
                className={`w-full h-48 md:h-64 border rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed transition-all resize-none ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300 focus:border-primary' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-primary'}`} 
                defaultValue="Eres Laura, la asesora virtual del proyecto 'Torre Esmeralda'. Tu objetivo principal es perfilar al cliente, responder sus dudas sobre los apartamentos y lograr agendar una cita.&#13;&#10;&#13;&#10;Reglas:&#13;&#10;1. Sé muy amable y persuasiva.&#13;&#10;2. Responde corto (máximo 2 párrafos).&#13;&#10;3. Si te preguntan por precios, diles que empiezan desde $120,000 USD y pregúntales su presupuesto.&#13;&#10;4. Si alguien pide hablar con un humano, despídete y avisa que un agente se conectará enseguida."
              />
              <p className="text-[10px] font-medium text-slate-500">Esta es la orden directa (System Prompt) que se le enviará a la inteligencia artificial para darle un rol.</p>
            </div>
          )}

          {activeTab === 'brain' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className={`p-4 border rounded-xl ${isDarkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
                <h4 className={`text-[14px] font-bold mb-1 flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                  <Bot size={18} /> Cerebro de Inteligencia Artificial
                </h4>
                <p className={`text-[12px] font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Elige qué proveedor y modelo de IA impulsará a tu asistente virtual. Cada proveedor requiere su propia API Key para funcionar.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Proveedor de IA</label>
                  <select className={`w-full border rounded-lg px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                    <option value="openai">OpenAI (Recomendado)</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="groq">Groq (Ultra-rápido)</option>
                    <option value="deepseek">DeepSeek (Económico)</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Modelo Específico</label>
                  <select className={`w-full border rounded-lg px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'}`}>
                    {/* These options would dynamically change based on provider in a full app */}
                    <option value="gpt-4o-mini">GPT-4o Mini (Recomendado)</option>
                    <option value="gpt-4o">GPT-4o (Avanzado)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="llama-3-70b">Llama 3 70B (Groq)</option>
                    <option value="deepseek-chat">DeepSeek Chat</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>API Key del Proveedor</label>
                <div className="relative">
                  <input 
                    type="password" 
                    placeholder="sk-..." 
                    className={`w-full border rounded-lg pl-10 pr-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300 focus:border-primary' : 'bg-white border-slate-200 text-slate-800 focus:border-primary'}`}
                  />
                  <Key size={18} className={`absolute left-3 top-3.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                </div>
                <p className={`text-[11px] mt-2 font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  Tus claves se cifran y almacenan de forma segura en tu propio entorno. No compartas tu API Key con nadie.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <button className="px-5 py-2.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2 active:scale-95 shadow-sm">
                  <RefreshCw size={16} /> Probar Conexión con IA
                </button>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="text-primary" size={24} />
                </div>
                <h4 className={`font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Sube Brochures o PDFs</h4>
                <p className="text-[11px] text-slate-500 mt-1 max-w-xs font-medium">Arrastra aquí los folletos de tu proyecto. El bot los leerá para responder detalles exactos.</p>
              </div>

              <div>
                <h4 className={`text-sm font-bold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Documentos Entrenados</h4>
                <div className="space-y-2">
                  <div className={`flex items-center justify-between p-3 border rounded-xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-lg"><FileText size={16} /></div>
                      <div>
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Brochure_TorreEsmeralda_2026.pdf</p>
                        <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>Procesado exitosamente • 14 páginas</p>
                      </div>
                    </div>
                    <button className="text-red-500 text-xs font-bold px-2 py-1 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors">Eliminar</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className={`flex items-center justify-between p-4 border rounded-xl ${isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
                <div className="pr-4">
                  <h4 className={`font-bold text-[13px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Escucha Activa de Audios (Voz a Texto)</h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Si el cliente envía nota de voz, la IA la descarga, la transcribe a texto y la responde como si la hubiera escuchado.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-slate-700 dark:after:border-slate-600 dark:after:bg-slate-300"></div>
                </label>
              </div>

              <div className={`flex items-center justify-between p-4 border rounded-xl ${isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
                <div className="pr-4">
                  <h4 className={`font-bold text-[13px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Agrupación de Mensajes (Ventana de 15s)</h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">El bot no responde de inmediato al primer "Hola". Espera 15 segundos para juntar todos los mensajitos que mande el cliente y responde al contexto completo.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-slate-700 dark:after:border-slate-600 dark:after:bg-slate-300"></div>
                </label>
              </div>

              <div className={`flex items-center justify-between p-4 border rounded-xl ${isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
                <div className="pr-4">
                  <h4 className={`font-bold text-[13px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Respuestas Humanizadas (División)</h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Si la IA genera un texto largo, se dividirá automáticamente en hasta 3 burbujas de WhatsApp separadas con un retraso de escritura entre ellas para verse 100% humano.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-slate-700 dark:after:border-slate-600 dark:after:bg-slate-300"></div>
                </label>
              </div>

              <div className={`flex items-center justify-between p-4 border rounded-xl ${isDarkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50/50 border-slate-200'}`}>
                <div>
                  <h4 className={`font-bold text-[13px] ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Intervención Humana (Handoff)</h4>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Pausar el bot si el cliente escribe "humano", "asesor" o si el bot se confunde.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary dark:bg-slate-700 dark:after:border-slate-600 dark:after:bg-slate-300"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className={`p-4 border-t flex justify-end gap-3 transition-colors ${isDarkMode ? 'border-slate-800 bg-[#252525]' : 'border-slate-100 bg-slate-50'}`}>
          <button className="px-4 py-2 md:px-6 md:py-2.5 bg-primary text-white text-xs md:text-sm font-bold rounded-xl hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2">
            <Save size={16} /> Guardar Configuración
          </button>
        </div>
      </div>

      {/* Columna Derecha: Simulador de Chat */}
      <div className={`w-full md:w-80 lg:w-96 rounded-2xl border shadow-sm flex flex-col overflow-hidden shrink-0 transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`p-4 border-b flex justify-between items-center transition-colors ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-800 text-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-slate-800 text-primary' : 'bg-slate-600 text-white'}`}><Bot size={16} /></div>
            <div>
              <p className={`font-bold text-xs md:text-sm ${isDarkMode ? 'text-white' : 'text-white'}`}>Simulador IA</p>
              <p className={`text-[10px] font-medium ${isDarkMode ? 'text-slate-500' : 'text-slate-300'}`}>Prueba tu bot aquí</p>
            </div>
          </div>
          <button className={`transition-colors ${isDarkMode ? 'text-slate-500 hover:text-white' : 'text-slate-300 hover:text-white'}`}><RefreshCw size={16} /></button>
        </div>
        
        <div className={`flex-1 p-4 flex flex-col gap-3 overflow-y-auto transition-colors ${isDarkMode ? 'bg-[#0f0f0f]' : 'bg-[#efeae2]'}`} style={!isDarkMode ? { backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain' } : {}}>
          <div className={`self-end p-2 rounded-lg rounded-tr-none text-sm max-w-[85%] shadow-sm ${isDarkMode ? 'bg-primary/20 text-slate-200' : 'bg-[#d9fdd3] text-slate-800'}`}>
            <p className="font-medium">¡Hola! Quería información de los depas porfa.</p>
            <span className={`text-[9px] block text-right mt-1 font-bold ${isDarkMode ? 'text-primary/50' : 'text-slate-400'}`}>10:42 AM</span>
          </div>
          
          <div className={`self-start p-2 rounded-lg rounded-tl-none text-sm max-w-[85%] shadow-sm ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800'}`}>
            <p className="font-medium">¡Hola! Soy Laura, tu asesora virtual de Torre Esmeralda ✨. Estás en el lugar correcto. Tenemos hermosos departamentos disponibles.<br/><br/>¿Buscabas algo de 1 o 2 habitaciones para poder darte los precios exactos?</p>
            <span className={`text-[9px] block text-right mt-1 font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>10:42 AM</span>
          </div>
        </div>

        <div className={`p-3 border-t flex gap-2 transition-colors ${isDarkMode ? 'bg-[#1E1E1E] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <input type="text" placeholder="Escribe un mensaje..." className={`flex-1 border rounded-full px-4 py-2 text-sm focus:outline-none transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200 focus:border-primary' : 'bg-white border-slate-200 text-slate-800 focus:border-primary'}`} />
          <button className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shrink-0 hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20">
            <Play size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotBuilder;
