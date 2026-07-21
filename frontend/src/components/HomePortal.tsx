import React, { useState, useEffect } from 'react';
import {
  Search, MapPin, Home, Building, Layers, Briefcase, Car, HelpCircle,
  Phone, Mail, Globe, Moon, Sun, ArrowRight, Eye, Send,
  Facebook, Instagram, Linkedin, Youtube, ShieldCheck, Award, Heart, Users, ChevronDown, Check, LogIn, Menu, X, Lock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const resolveUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('/uploads')) {
    return `${API_URL}${url}`;
  }
  return url;
};

interface Property {
  id: string | number;
  name: string;
  project?: string;
  developer?: string;
  type: string;
  price: string | number;
  currency: string;
  location: string;
  area?: string | number;
  rooms?: string | number;
  bathrooms?: string | number;
  parking?: string | number;
  floor?: string;
  details?: string;
  notes?: string;
  status: string;
  image?: string;
  avatar?: string;
  images?: string[] | string;
}

const TYPE_OPTIONS = [
  { value: 'todos', label: 'Todos' },
  { value: 'casa', label: 'Casa' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'lotes', label: 'Lotes / Terreno' },
  { value: 'oficinas', label: 'Oficina' },
  { value: 'cocheras', label: 'Cochera' },
  { value: 'local', label: 'Local' },
  { value: 'deposito', label: 'Depósito' }
];

interface HomePortalProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  onLoginClick: () => void;
  isLoggedIn: boolean;
  onGoToDashboard: () => void;
}

const DEMO_PROPERTIES: Property[] = [];

const HERO_IMAGES: string[] = [];

export default function HomePortal({
  isDarkMode,
  setIsDarkMode,
  onLoginClick,
  isLoggedIn,
  onGoToDashboard
}: HomePortalProps) {

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [portalSettings, setPortalSettings] = useState<any>(null);

  // Filtros de búsqueda
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('todos');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState<boolean>(false);
  const [filterCurrency, setFilterCurrency] = useState<string>('todos');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [currentHeroIndex, setCurrentHeroIndex] = useState<number>(0);

  // Propiedad seleccionada para el Modal
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'portal' | 'catalog'>('portal');

  // Estado del formulario de contacto
  const [contactInterest, setContactInterest] = useState<'Comprar' | 'Vender'>('Comprar');
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactComments, setContactComments] = useState<string>('');
  const [contactError, setContactError] = useState<string>('');
  const [contactSubmitted, setContactSubmitted] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const handleContactSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setContactError('');

    if (!contactInterest) {
      setContactError('Por favor selecciona tu interés (Comprar o Vender).');
      return;
    }
    if (!contactName.trim()) {
      setContactError('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!contactPhone.trim()) {
      setContactError('Por favor ingresa tu celular de contacto.');
      return;
    }

    // Auto-registrar lead en backend de forma silenciosa
    try {
      fetch(`${API_URL}/api/leads/public`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName.trim(),
          phone: contactPhone.trim(),
          email: contactEmail.trim(),
          interest: contactInterest,
          comments: contactComments.trim()
        })
      }).catch(err => console.error("Error guardando lead:", err));
    } catch (err) { }

    // Generar mensaje estructurado para WhatsApp
    const targetPhone = portalSettings?.phone ? portalSettings.phone.replace(/\D/g, '') : "51900000000";
    const summaryMessage = 
`📌 *NUEVA CONSULTA DE CONTACTO*
----------------------------------
🎯 *Interés:* ${contactInterest}
👤 *Nombre:* ${contactName.trim()}
📱 *Celular:* ${contactPhone.trim()}
✉️ *Email:* ${contactEmail.trim() || 'No especificado'}
💬 *Comentarios:* ${contactComments.trim() || 'Sin comentarios'}
----------------------------------
Hola, les comparto mis datos registrados desde el portal web. Quedo a la espera de su comunicación.`;

    const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(summaryMessage)}`;
    window.open(waUrl, '_blank');

    setContactSubmitted(true);
  };

  const getHeroImages = () => {
    if (portalSettings) {
      const customBanners = [
        portalSettings.banner_image_1,
        portalSettings.banner_image_2,
        portalSettings.banner_image_3
      ].filter(Boolean).map(img => resolveUrl(img));
      if (customBanners.length > 0) return customBanners;
    }
    return [];
  };

  // Rotador automático de banner cada 10 segundos
  useEffect(() => {
    const imagesList = getHeroImages();
    if (imagesList.length > 0) {
      const timer = setInterval(() => {
        setCurrentHeroIndex((prev) => (prev + 1) % imagesList.length);
      }, 10000);
      return () => clearInterval(timer);
    }
  }, [portalSettings]);

  useEffect(() => {
    const fetchPublicProperties = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/properties/public`);
        if (res.ok) {
          const data = await res.json();
          const formattedDbData: Property[] = data.map((p: any) => ({
            ...p,
            images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images || []
          }));
          setProperties(formattedDbData);
        } else {
          setProperties([]);
        }
      } catch (err) {
        console.error("Error al cargar propiedades públicas:", err);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };

    const fetchPortalSettings = async () => {
      try {
        const res = await fetch(`${API_URL}/api/portal-settings/public`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.id) {
            setPortalSettings(data);
          }
        }
      } catch (err) {
        console.error("Error al cargar ajustes del portal:", err);
      }
    };

    fetchPublicProperties();
    fetchPortalSettings();
  }, []);

  // Función para filtrar las propiedades en el cliente
  const getFilteredProperties = () => {
    return properties
      .filter((p) => {
        // Filtro de ubicación (Departamento, Región, Ciudad o Distrito)
        const matchesLocation = !searchLocation ||
          p.location.toLowerCase().includes(searchLocation.toLowerCase()) ||
          (p.project && p.project.toLowerCase().includes(searchLocation.toLowerCase())) ||
          p.name.toLowerCase().includes(searchLocation.toLowerCase());

        // Filtro de tipo
        const matchesType = filterType === 'todos' || p.type.toLowerCase() === filterType.toLowerCase() ||
          (filterType === 'lotes' && p.type.toLowerCase() === 'terreno') ||
          (filterType === 'cocheras' && p.type.toLowerCase() === 'cochera') ||
          (filterType === 'oficinas' && p.type.toLowerCase() === 'oficina') ||
          (filterType === 'casa' && p.type.toLowerCase() === 'casas') ||
          (filterType === 'departamento' && p.type.toLowerCase() === 'departamentos');

        // Filtro de moneda
        const matchesCurrency = filterCurrency === 'todos' ||
          p.currency.toLowerCase() === filterCurrency.toLowerCase();

        // Limpiar formato de precio (remueve comas y caracteres no numéricos)
        const cleanPrice = (priceVal: any) => {
          if (typeof priceVal === 'number') return priceVal;
          const cleaned = String(priceVal || '').replace(/[^0-9.]/g, '');
          return Number(cleaned) || 0;
        };
        const pPrice = cleanPrice(p.price);

        // Filtro precio mínimo
        const matchesMinPrice = !minPrice || pPrice >= Number(minPrice);

        // Filtro precio máximo
        const matchesMaxPrice = !maxPrice || pPrice <= Number(maxPrice);

        return matchesLocation && matchesType && matchesCurrency && matchesMinPrice && matchesMaxPrice;
      });
  };

  const filteredList = getFilteredProperties();

  const getFeaturedList = () => {
    const hasRealFeatured = properties.some(p => p.featured === true && !String(p.id).startsWith('demo'));
    if (hasRealFeatured) {
      return filteredList.filter(p => p.featured === true);
    }
    return filteredList;
  };
  const featuredListToRender = getFeaturedList();

  // Función para obtener íconos correspondientes al tipo de propiedad
  const getPropertyIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'casa':
      case 'casas':
        return <Home size={18} />;
      case 'departamento':
      case 'departamentos':
        return <Building size={18} />;
      case 'oficina':
      case 'oficinas':
        return <Briefcase size={18} />;
      case 'cochera':
      case 'cocheras':
        return <Car size={18} />;
      case 'terreno':
      case 'lotes':
        return <Layers size={18} />;
      default:
        return <Home size={18} />;
    }
  };

  // Función para obtener estilos de color según el tipo de propiedad
  const getPropertyTypeStyles = (type: string) => {
    switch (type.toLowerCase()) {
      case 'casa':
      case 'casas':
        return {
          bg: 'bg-blue-500/10 dark:bg-blue-500/20',
          text: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-500/20',
          solidBg: 'bg-blue-600'
        };
      case 'departamento':
      case 'departamentos':
        return {
          bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
          text: 'text-indigo-600 dark:text-indigo-400',
          border: 'border-indigo-500/20',
          solidBg: 'bg-indigo-600'
        };
      case 'oficina':
      case 'oficinas':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-500/20',
          text: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-500/20',
          solidBg: 'bg-amber-600'
        };
      case 'cochera':
      case 'cocheras':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
          text: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-500/20',
          solidBg: 'bg-emerald-600'
        };
      case 'terreno':
      case 'lotes':
        return {
          bg: 'bg-purple-500/10 dark:bg-purple-500/20',
          text: 'text-purple-600 dark:text-purple-400',
          border: 'border-purple-500/20',
          solidBg: 'bg-purple-600'
        };
      case 'local':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-500/20',
          text: 'text-rose-600 dark:text-rose-400',
          border: 'border-rose-500/20',
          solidBg: 'bg-rose-600'
        };
      default:
        return {
          bg: 'bg-zinc-500/10 dark:bg-zinc-500/20',
          text: 'text-zinc-600 dark:text-zinc-400',
          border: 'border-zinc-500/20',
          solidBg: 'bg-zinc-600'
        };
    }
  };

  // Función para generar el enlace de WhatsApp
  const handleWhatsAppContact = (property: Property) => {
    const defaultPhone = "51900000000"; // Reemplazar con el número oficial de ventas
    const message = `👋 Hola. Te interesa ${property.name}. ¿En qué puedo ayudarte?`;
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${defaultPhone}?text=${encodedMessage}`;
    window.open(url, '_blank');
  };

  // Formatear precio
  const formatPrice = (price: string | number, currency: string) => {
    const num = Number(price);
    if (isNaN(num)) return `${currency} ${price}`;
    return `${currency} ${num.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`;
  };

  const getImagesArray = (property: Property): string[] => {
    let list: string[] = [];
    if (Array.isArray(property.images)) {
      list = property.images.length > 0 ? property.images : [property.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa'];
    } else if (typeof property.images === 'string') {
      try {
        const parsed = JSON.parse(property.images);
        if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
      } catch (e) { }
    }
    if (list.length === 0) {
      list = [property.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa'];
    }
    return list.map(img => resolveUrl(img));
  };

  const renderFilterBar = () => {
    return (
      <div className="pt-8 max-w-4xl mx-auto w-full">

        {/* Vista Desktop: Barra tipo Cápsula / Airbnb */}
        <div className="hidden md:flex bg-white dark:bg-zinc-900 border border-accent rounded-full shadow-2xl items-center p-2.5 w-full select-none">

          {/* 1. Ubicación (Ciudad, Distrito, Región, Proyecto) */}
          <div className="flex-[1.8] hover:bg-surface-inset dark:hover:bg-zinc-800/40 rounded-full px-6 py-2.5 transition-colors cursor-pointer group text-left">
            <label className="text-[9px] font-black text-accent uppercase tracking-widest block mb-0.5">Ubicación</label>
            <input
              type="text"
              placeholder="Ciudad, distrito o región..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full bg-transparent border-none outline-none focus:ring-0 text-sm font-semibold text-content placeholder-content-muted p-0 focus:outline-none"
            />
          </div>

          <div className="h-8 w-px bg-accent shrink-0" />

          {/* 2. Tipo */}
          <div
            onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
            className="flex-1 hover:bg-surface-inset dark:hover:bg-zinc-800/40 rounded-full px-6 py-2.5 transition-colors cursor-pointer relative group text-left"
          >
            <label className="text-[9px] font-black text-accent uppercase tracking-widest block mb-0.5">Tipo</label>
            <div className="relative flex items-center justify-between">
              <span className="text-sm font-semibold text-content truncate pr-4">
                {TYPE_OPTIONS.find(opt => opt.value === filterType)?.label || 'Cualquier tipo'}
              </span>
              <ChevronDown size={14} className="text-content-muted pointer-events-none shrink-0" />
            </div>

            {isTypeDropdownOpen && (
              <>
                {/* Backdrop transparente para cerrar al hacer click fuera */}
                <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.stopPropagation(); setIsTypeDropdownOpen(false); }} />

                {/* Lista del Dropdown con bordes suavizados */}
                <div className="absolute top-[105%] left-0 right-0 min-w-[200px] bg-surface dark:bg-zinc-900 border border-edge rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilterType(opt.value);
                        setIsTypeDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-surface-inset dark:hover:bg-zinc-800/50 transition-colors flex items-center justify-between border-none bg-transparent cursor-pointer ${filterType === opt.value ? 'text-accent bg-accent/5' : 'text-content'}`}
                    >
                      <span>{opt.label}</span>
                      {filterType === opt.value && <Check size={14} className="text-accent" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="h-8 w-px bg-accent shrink-0" />

          {/* 3. Precio (USD/PEN) & Rango */}
          <div className="flex-[1.5] hover:bg-surface-inset dark:hover:bg-zinc-800/40 rounded-full px-6 py-2.5 transition-colors text-left">
            <label className="text-[9px] font-black text-accent uppercase tracking-widest block mb-0.5">Precio (USD/PEN)</label>
            <div className="flex items-center gap-1.5 mt-0.5">
              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="bg-transparent border-none outline-none focus:ring-0 text-xs font-bold text-content cursor-pointer p-0 w-20 focus:outline-none dark:bg-transparent"
              >
                <option value="todos" className="dark:bg-zinc-900">Moneda</option>
                <option value="USD" className="dark:bg-zinc-900">USD</option>
                <option value="PEN" className="dark:bg-zinc-900">PEN</option>
                <option value="MXN" className="dark:bg-zinc-900">MXN</option>
                <option value="COP" className="dark:bg-zinc-900">COP</option>
              </select>
              <span className="text-edge text-xs">|</span>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-14 bg-transparent border-none outline-none focus:ring-0 text-sm font-semibold text-content placeholder-content-muted p-0 focus:outline-none"
              />
              <span className="text-content-muted text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-14 bg-transparent border-none outline-none focus:ring-0 text-sm font-semibold text-content placeholder-content-muted p-0 focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Botón Buscar (Círculo Azul de Marca) */}
          <button
            onClick={() => {
              const el = document.getElementById('propiedades');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-accent hover:bg-accent-hover text-white rounded-full w-12 h-12 flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-accent/25 shrink-0 ml-2 cursor-pointer border-none focus:outline-none"
            title="Buscar Propiedades"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Vista Mobile: Stacked Card optimizado y compacto */}
        <div className="flex md:hidden flex-col gap-2 bg-surface dark:bg-zinc-900 border border-accent rounded-xl p-3 shadow-2xl text-left max-w-sm mx-auto w-full">
          
          {/* Fila 1: Ubicación y Tipo */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <label className="text-[8px] font-extrabold text-accent uppercase tracking-wider block">Ubicación</label>
              <input
                type="text"
                placeholder="Ciudad, distrito..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full bg-surface-inset border border-edge rounded-lg px-2 py-1.5 text-[11px] font-semibold text-content focus:outline-none"
              />
            </div>
            <div className="space-y-0.5">
              <label className="text-[8px] font-extrabold text-accent uppercase tracking-wider block">Tipo</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-surface-inset border border-edge rounded-lg px-1 py-1.5 text-[11px] font-semibold text-content focus:outline-none"
              >
                <option value="todos">Todos</option>
                <option value="casa">Casa</option>
                <option value="departamento">Dpto</option>
                <option value="lotes">Lote/Terreno</option>
                <option value="oficinas">Oficina</option>
                <option value="cocheras">Cochera</option>
                <option value="local">Local</option>
                <option value="deposito">Depósito</option>
              </select>
            </div>
          </div>

          {/* Fila 2: Moneda y Rango de Precios */}
          <div className="flex gap-2">
            <div className="space-y-0.5 w-1/3">
              <label className="text-[8px] font-extrabold text-accent uppercase tracking-wider block">Moneda</label>
              <select
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="w-full bg-surface-inset border border-edge rounded-lg px-1 py-1.5 text-[11px] font-semibold text-content focus:outline-none"
              >
                <option value="todos">Todas</option>
                <option value="USD">USD</option>
                <option value="PEN">PEN</option>
                <option value="MXN">MXN</option>
                <option value="COP">COP</option>
              </select>
            </div>
            <div className="space-y-0.5 w-2/3">
              <label className="text-[8px] font-extrabold text-accent uppercase tracking-wider block">Precios (Min-Max)</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-surface-inset border border-edge rounded-lg px-2 py-1.5 text-[11px] font-semibold text-content focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-surface-inset border border-edge rounded-lg px-2 py-1.5 text-[11px] font-semibold text-content focus:outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('propiedades');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-primary w-full py-1.5 mt-1 flex items-center justify-center gap-1.5 text-xs font-bold shadow-md shadow-accent/20 rounded-lg cursor-pointer border-none"
          >
            <Search size={14} />
            <span>Buscar Propiedades</span>
          </button>
        </div>

      </div>
    );
  };

  if (portalSettings?.status === 'Mantenimiento' && !isLoggedIn) {
    return (
      <div className={`min-h-screen font-sans flex flex-col items-center justify-center p-6 transition-all ${isDarkMode ? 'dark bg-zinc-950 text-white' : 'bg-slate-50 text-zinc-900'}`}>
        <div className={`card max-w-md p-8 text-center space-y-6 shadow-2xl border border-edge/60 backdrop-blur-md rounded-2xl animate-in zoom-in-95 duration-300 ${isDarkMode ? 'bg-[#252525] border-edge' : 'bg-white border-slate-200'}`}>
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto animate-bounce">
            <Lock size={32} />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-accent">Portal en Mantenimiento</h2>
            <p className="text-xs text-content-secondary leading-relaxed font-semibold">
              Estamos actualizando nuestro catálogo para ofrecerte la mejor experiencia. Volveremos muy pronto con nuevos proyectos y desarrollos exclusivos.
            </p>
          </div>

          {portalSettings.phone && (
            <div className="pt-4 border-t border-edge/60">
              <p className="text-[10px] text-content-muted font-bold uppercase tracking-wider mb-2">Contacto Inmediato</p>
              <button
                onClick={() => {
                  const phone = portalSettings.phone.replace(/[^0-9]/g, '');
                  window.open(`https://wa.me/${phone}?text=Hola,%20quisiera%20información%20sobre%20sus%20propiedades`, '_blank');
                }}
                className="w-full btn-primary h-10 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 border-none cursor-pointer"
              >
                <Send size={14} className="rotate-45" /> Escríbenos por WhatsApp
              </button>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={onLoginClick}
              className="text-xs font-semibold text-content-muted hover:text-accent transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1.5 mx-auto"
            >
              <LogIn size={12} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-all bg-surface-base text-content ${isDarkMode ? 'dark' : ''}`}>

      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 w-full bg-surface/85 backdrop-blur-md border-b border-edge transition-all py-4 px-6 md:px-12 flex items-center justify-between">
        <div onClick={() => { setViewMode('portal'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 cursor-pointer">
          {isDarkMode ? (
            portalSettings?.logo_night ? (
              <img src={resolveUrl(portalSettings.logo_night)} className="h-9 max-w-[180px] object-contain" alt="Casaya" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
                  <Home size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight">Casaya</span>
              </>
            )
          ) : (
            portalSettings?.logo_day ? (
              <img src={resolveUrl(portalSettings.logo_day)} className="h-9 max-w-[180px] object-contain" alt="Casaya" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
                  <Home size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight">Casaya</span>
              </>
            )
          )}
        </div>

        {/* Enlaces de Navegación (Desktop only) */}
        <nav className="hidden md:flex items-center gap-8">
          <button
            onClick={() => { setViewMode('portal'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`text-sm font-semibold transition-colors bg-transparent border-none cursor-pointer ${viewMode === 'portal' ? 'text-accent hover:text-emerald-600 dark:hover:text-emerald-400' : 'text-content hover:text-emerald-600 dark:hover:text-emerald-400'}`}
          >
            Inicio
          </button>
          <button
            onClick={() => { setViewMode('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`text-sm font-semibold transition-colors bg-transparent border-none cursor-pointer ${viewMode === 'catalog' ? 'text-accent hover:text-emerald-600 dark:hover:text-emerald-400' : 'text-content hover:text-emerald-600 dark:hover:text-emerald-400'}`}
          >
            Propiedades
          </button>
          <a
            href="#quienes-somos"
            onClick={() => setViewMode('portal')}
            className="text-sm font-semibold text-content hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Quiénes Somos
          </a>
          <a
            href="#contacto"
            onClick={() => setViewMode('portal')}
            className="text-sm font-semibold text-content hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            Contacto
          </a>
        </nav>

        {/* Botones de Cabecera (Desktop only) */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl border border-edge hover:bg-surface-inset text-content-secondary transition-colors cursor-pointer"
            title="Cambiar Tema"
          >
            {isDarkMode ? <Sun size={16} className="text-amber-500 animate-pulse" /> : <Moon size={16} />}
          </button>

          {isLoggedIn ? (
            <button
              onClick={onGoToDashboard}
              className="btn-primary p-2.5 rounded-xl flex items-center justify-center shadow-md shadow-accent/15 cursor-pointer border-none"
              title="Ir al Panel CRM"
            >
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="btn-secondary p-2.5 rounded-xl border border-edge flex items-center justify-center cursor-pointer"
              title="Acceso Interno"
            >
              <Lock size={16} />
            </button>
          )}
        </div>

        {/* Botones de Cabecera y Hamburger (Mobile only) */}
        <div className="flex md:hidden items-center gap-2">
          {isLoggedIn ? (
            <button
              onClick={onGoToDashboard}
              className="btn-primary p-2 rounded-lg flex items-center justify-center shadow-md shadow-accent/15 cursor-pointer border-none animate-in fade-in"
              title="Ir al Panel CRM"
            >
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="btn-secondary p-2 rounded-lg border border-edge flex items-center justify-center cursor-pointer animate-in fade-in"
              title="Acceso Interno"
            >
              <Lock size={14} />
            </button>
          )}

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg border border-edge hover:bg-surface-inset text-content-secondary transition-colors cursor-pointer flex items-center justify-center"
            title="Menú"
          >
            {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        {/* Menú Móvil desplegable */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-surface border-b border-edge shadow-2xl py-3 px-4 flex flex-col gap-1 animate-in slide-in-from-top-5 duration-200 z-50 text-left">
            <button
              onClick={() => { setIsMobileMenuOpen(false); setViewMode('portal'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`text-left text-sm font-semibold transition-colors px-3.5 py-2.5 rounded-xl block border-none bg-transparent cursor-pointer w-full ${viewMode === 'portal' ? 'text-accent bg-accent/5 hover:text-emerald-600' : 'text-content hover:text-emerald-600 hover:bg-surface-inset'}`}
            >
              Inicio
            </button>
            <button
              onClick={() => { setIsMobileMenuOpen(false); setViewMode('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`text-left text-sm font-semibold transition-colors px-3.5 py-2.5 rounded-xl block border-none bg-transparent cursor-pointer w-full ${viewMode === 'catalog' ? 'text-accent bg-accent/5 hover:text-emerald-600' : 'text-content hover:text-emerald-600 hover:bg-surface-inset'}`}
            >
              Propiedades
            </button>
            <a
              href="#quienes-somos"
              onClick={() => { setIsMobileMenuOpen(false); setViewMode('portal'); }}
              className="text-sm font-semibold text-content hover:text-emerald-600 hover:bg-surface-inset transition-colors px-3.5 py-2.5 rounded-xl block"
            >
              Quiénes Somos
            </a>
            <a
              href="#contacto"
              onClick={() => { setIsMobileMenuOpen(false); setViewMode('portal'); }}
              className="text-sm font-semibold text-content hover:text-emerald-600 hover:bg-surface-inset transition-colors px-3.5 py-2.5 rounded-xl block"
            >
              Contacto
            </a>

            <div className="h-px bg-edge/40 my-1 mx-2" />

            {/* Opción de Modo Día y Noche dentro del Menú */}
            <div className="flex items-center justify-between px-3.5 py-2 rounded-xl hover:bg-surface-inset">
              <span className="text-sm font-semibold text-content-secondary">Tema: {isDarkMode ? 'Modo Noche' : 'Modo Día'}</span>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-xl border border-edge hover:bg-surface-inset text-content-secondary transition-colors cursor-pointer"
                title="Cambiar Tema"
              >
                {isDarkMode ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} />}
              </button>
            </div>
          </div>
        )}
      </header>

      {viewMode === 'portal' ? (
        <>
          {/* 2. HERO SECTION */}
          <section id="inicio" className="relative py-12 md:py-20 px-6 md:px-12 flex flex-col items-center text-center overflow-visible bg-surface-base">

            {/* Contenedor de Fondo con Recorte (evita scrollbars por blur circles) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              {/* Background Images Slider (Rotating 3 property images every 10s) */}
              <div className="absolute inset-0">
                {getHeroImages().map((img, idx) => (
                  <div
                    key={idx}
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                    style={{
                      backgroundImage: `url(${img})`,
                      opacity: currentHeroIndex === idx ? 0.85 : 0
                    }}
                  />
                ))}
                {getHeroImages().length === 0 && (
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-zinc-950 to-slate-950" />
                )}
                {/* Scrim Overlay (Adjusted to be lighter to show the background image clearer and brighter) */}
                <div className="absolute inset-0 bg-black/20 dark:bg-black/45 transition-all duration-300" />
                {/* Bottom edge fade-out (Only at the very bottom to blend cleanly with the next section) */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface-base to-transparent pointer-events-none" />
              </div>

              {/* Decoración */}
              <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-accent-hover/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider mb-1 backdrop-blur-sm shadow-sm">
                <Award size={12} /> Inversión segura
              </div>
              <h1
                className="text-3xl md:text-[44px] font-black text-accent tracking-tight leading-tight max-w-3xl mx-auto"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.9), 0 4px 16px rgba(0, 0, 0, 0.7)'
                }}
              >
                {portalSettings?.hero_title || 'Encuentra la propiedad perfecta para tu estilo de vida'}
              </h1>
              <p
                className="text-sm md:text-base text-white font-bold max-w-2xl mx-auto leading-relaxed"
                style={{
                  textShadow: '0 1px 3px rgba(0, 0, 0, 0.9), 0 2px 8px rgba(0, 0, 0, 0.5)'
                }}
              >
                {portalSettings?.hero_subtitle || 'Explora las mejores casas, departamentos, terrenos, oficinas y cocheras en las ubicaciones más exclusivas con la asesoría de IA líder de Casaya.'}
              </p>

              {/* BARRA DE FILTROS ESTILO AIRBNB */}
              {renderFilterBar()}
            </div>
          </section>

          {/* 3. PROPIEDADES DESTACADAS */}
          <section id="propiedades" className="py-12 px-6 md:px-12 bg-surface-base">
            <div className="max-w-7xl mx-auto space-y-8">

              {/* Cabecera Sección */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1.5">
                  <h2 className="text-2xl font-extrabold text-content tracking-tight">Propiedades Destacadas</h2>
                  <p className="text-xs md:text-sm text-content-secondary max-w-lg">
                    Una selección de proyectos confiables con excelente ubicación y alto potencial de valorización.
                  </p>
                </div>

                {/* Indicador de Filtro Activo */}
                {(searchLocation || filterType !== 'todos' || filterCurrency !== 'todos' || minPrice || maxPrice) && (
                  <div className="flex items-center gap-1.5 text-xs text-accent font-bold px-3 py-1.5 bg-accent/5 rounded-xl border border-accent/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                    <span>Filtros activos</span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-content-muted">Cargando catálogo...</p>
                </div>
              ) : featuredListToRender.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {featuredListToRender.slice(0, 8).map((p) => {
                      const imgUrl = resolveUrl((Array.isArray(p.images) && p.images[0]) || p.avatar || p.image || '') || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80';

                      return (
                        <div
                          key={p.id}
                          className="card group overflow-hidden flex flex-col h-full hover:shadow-xl hover:border-accent/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-surface"
                          onClick={() => { setSelectedProperty(p); setActiveImageIndex(0); }}
                        >
                          {/* Imagen de Portada */}
                          <div className="h-56 relative overflow-hidden shrink-0">
                            <img
                              src={imgUrl}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute top-3.5 left-3.5">
                              <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1.5 rounded-lg shadow-md border-none text-white ${p.status?.toLowerCase() === 'disponible' ? 'bg-emerald-600' :
                                p.status?.toLowerCase() === 'reservado' ? 'bg-amber-600' :
                                  'bg-rose-600'
                                }`}>
                                {p.status}
                              </span>
                            </div>

                            {/* Tipo Icono flotante con color diferenciado */}
                            <div className={`absolute top-3.5 right-3.5 w-8 h-8 rounded-lg text-white backdrop-blur-sm flex items-center justify-center shadow-md ${getPropertyTypeStyles(p.type).solidBg}`}>
                              {getPropertyIcon(p.type)}
                            </div>

                            {/* Precio flotante */}
                            <div className="absolute bottom-3.5 left-3.5 bg-black/75 text-white backdrop-blur-sm py-1.5 px-3 rounded-lg text-sm font-black tracking-tight">
                              {formatPrice(p.price, p.currency)}
                            </div>
                          </div>

                          {/* Contenido Tarjeta */}
                          <div className="p-5 flex flex-col flex-1 space-y-4">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-accent tracking-wider uppercase block">{p.project || 'Proyecto Independiente'}</span>
                              <h3 className="font-extrabold text-base text-content group-hover:text-accent transition-colors line-clamp-1">{p.name}</h3>
                              <div className="flex items-center gap-1 text-content-muted mt-1.5">
                                <MapPin size={12} className="shrink-0 text-accent/60" />
                                <span className="text-xs truncate">{p.location}</span>
                              </div>
                            </div>

                            {p.type?.toLowerCase() === 'terreno' && p.proj_price_from && p.proj_price_to && (
                              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-2 rounded-lg text-[10px] font-bold flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-1 leading-tight">
                                  <span className="text-[9px] uppercase tracking-wider opacity-75 shrink-0">Precio:</span>
                                  <span className="text-[10px] font-extrabold truncate">
                                    desde {formatPrice(p.proj_price_from, p.currency)} hasta {formatPrice(p.proj_price_to, p.currency)}
                                  </span>
                                </div>
                                {p.proj_area_from && p.proj_area_to && (
                                  <div className="flex items-center justify-between gap-1 leading-tight pt-1 border-t border-emerald-500/20">
                                    <span className="text-[9px] uppercase tracking-wider opacity-75 shrink-0">Área:</span>
                                    <span className="text-[10px] font-extrabold truncate">
                                      desde {p.proj_area_from} m² hasta {p.proj_area_to} m²
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Características con colores diferenciados */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-edge mt-auto font-bold">
                              {p.type?.toLowerCase() !== 'terreno' && p.area && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/10 uppercase tracking-wider">{p.area} m²</span>}
                              {p.rooms && Number(p.rooms) > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/10 uppercase tracking-wider">{p.rooms} hab</span>}
                              {p.bathrooms && Number(p.bathrooms) > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-500/10 uppercase tracking-wider">{p.bathrooms} bañ</span>}
                              {p.parking && Number(p.parking) > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 border border-violet-500/10 uppercase tracking-wider">{p.parking} est</span>}
                            </div>

                            {/* Botón Ver Detalle */}
                            <div className="pt-2 flex justify-between items-center text-xs font-bold text-accent group-hover:translate-x-1.5 transition-transform duration-300">
                              <span>Ver más detalles</span>
                              <ArrowRight size={14} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {filteredList.length > 8 && (
                    <div className="text-center pt-8">
                      <button
                        onClick={() => {
                          setViewMode('catalog');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="btn-primary px-6 py-3 font-extrabold text-sm rounded-xl hover:scale-105 transition-all shadow-md shadow-accent/15 border-none cursor-pointer"
                      >
                        Ver Todas las Propiedades ({filteredList.length})
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="card p-16 text-center border-dashed border-2 max-w-xl mx-auto">
                  <Home size={36} className="mx-auto text-content-muted mb-4 opacity-40 animate-bounce" />
                  <h3 className="h3 mb-2">No encontramos propiedades</h3>
                  <p className="text-sm text-content-secondary max-w-sm mx-auto">
                    No hay propiedades disponibles que coincidan con tu búsqueda en este momento. Intenta cambiar los filtros de ubicación o tipo.
                  </p>
                </div>
              )}

            </div>
          </section>

          {/* SECCIÓN DE LLAMADO A LA ACCIÓN (PERSUASIÓN AL CATÁLOGO COMPLETO) - Premium Banner */}
          <section className="py-12 px-6 md:px-12 bg-surface-inset border-t border-b border-edge">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative">

              <div className="space-y-3 max-w-2xl text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-extrabold uppercase tracking-wider">
                  <Layers size={10} /> Más Opciones para Invertir
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-content tracking-tight">
                  Explora nuestro catálogo completo.
                </h2>
                <p className="text-xs md:text-sm text-content-secondary leading-relaxed">
                  Accede a nuestro catálogo completo y encuentra la opción ideal según tu presupuesto, ubicación y objetivos.
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                <button
                  onClick={() => {
                    setViewMode('catalog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full md:w-auto px-6 py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-extrabold text-xs shadow-md shadow-accent/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none font-sans"
                >
                  <Eye size={14} />
                  <span>Ver Todas las Propiedades</span>
                </button>
              </div>
            </div>
          </section>

          {/* 4. QUIÉNES SOMOS */}
          <section id="quienes-somos" className="py-12 px-6 md:px-12 border-t border-edge bg-surface">
            <div className={`max-w-7xl mx-auto ${portalSettings?.about_image ? 'grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center' : 'max-w-3xl text-center'}`}>

              {/* Columna Izquierda: Imagen */}
              {portalSettings?.about_image && (
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-72 h-72 bg-accent/5 rounded-3xl blur-2xl pointer-events-none"></div>
                  <div className="rounded-2xl overflow-hidden shadow-2xl relative z-10 border border-edge">
                    <img
                      src={resolveUrl(portalSettings.about_image)}
                      alt="Quiénes Somos"
                      className="w-full h-[400px] object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-6 left-6 right-6 text-white space-y-1 text-left">
                      <p className="text-xs font-bold tracking-widest uppercase text-accent">Usamos Inteligencia Artificiaal</p>
                      <h3 className="text-xl font-bold"></h3>
                    </div>
                  </div>

                  {/* Tarjeta flotante de experiencia */}
                  <div className="absolute -bottom-6 -right-6 bg-accent text-white p-6 rounded-2xl shadow-xl z-20 flex flex-col items-center justify-center text-center w-36 h-36 border-4 border-surface">
                    <span className="text-3xl font-black">5+</span>
                    <span className="text-[10px] font-bold tracking-wider uppercase mt-1">Años de Trayectoria</span>
                  </div>
                </div>
              )}

              {/* Columna Derecha: Texto */}
              <div className={`space-y-8 ${portalSettings?.about_image ? 'text-left' : 'max-w-2xl mx-auto text-center'}`}>
                <div className="space-y-3">
                  <span className="text-xs font-bold text-accent tracking-widest uppercase block">Nosotros</span>
                  <h2 className="text-3xl md:text-4xl font-black text-content tracking-tight">
                    {portalSettings?.about_title || 'Casaya Gestión Inmobiliaria'}
                  </h2>
                </div>

                <p className="body-text text-content-secondary leading-relaxed whitespace-pre-line">
                  {portalSettings?.about_description || (
                    <>
                      En <strong>Casaya</strong>, conectamos a personas con oportunidades inmobiliarias confiables. Seleccionamos cuidadosamente cada proyecto y trabajamos junto a desarrolladores comprometidos con la calidad y la transparencia, respaldando cada operación con asesoría especializada y tecnología propia para ofrecer una experiencia de compra más segura, eficiente y confiable.
                    </>
                  )}
                </p>

                {/* Valores/Pilares */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 ${portalSettings?.about_image ? 'text-left' : 'text-left'}`}>

                  <div className="flex gap-4 items-start text-left">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/25 shrink-0 flex items-center justify-center">
                      <Award size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-content">Desarrolladores Verificados</h4>
                      <p className="text-xs text-content-secondary mt-1">Trabajamos únicamente con empresas que cumplen nuestros estándares de calidad, transparencia y cumplimiento.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start text-left">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-500/25 shrink-0 flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-content">Tecnología Propia</h4>
                      <p className="text-xs text-content-secondary mt-1">Desarrollamos herramientas inteligentes que optimizan la gestión comercial y mejoran la experiencia de nuestros clientes.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start text-left">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 dark:bg-rose-500/25 shrink-0 flex items-center justify-center">
                      <Heart size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-content">Asesoría Especializada</h4>
                      <p className="text-xs text-content-secondary mt-1">Acompañamos cada decisión con profesionales que brindan orientación personalizada durante todo el proceso.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start text-left">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/25 shrink-0 flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-content">Proyectos Verificados</h4>
                      <p className="text-xs text-content-secondary mt-1">Solo incorporamos desarrollos que cumplen nuestros estándares de calidad, transparencia y confianza.</p>
                    </div>
                  </div>

                </div>

                {/* Metricas */}
                <div className={`flex gap-8 border-t border-edge pt-8 ${portalSettings?.about_image ? 'justify-start' : 'justify-center'}`}>
                  <div>
                    <span className="text-2xl font-black text-accent block">120+</span>
                    <span className="text-xs font-bold text-content-secondary">Propiedades Vendidas</span>
                  </div>
                  <div className="w-px bg-edge h-10"></div>
                  <div>
                    <span className="text-2xl font-black text-accent block">99%</span>
                    <span className="text-xs font-bold text-content-secondary">Clientes Satisfechos</span>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* 3.5. SECCIÓN DE CONTACTO Y FORMULARIO */}
          <section id="contacto" className="py-14 px-6 md:px-12 bg-surface border-t border-b border-edge">
            <div className="max-w-3xl mx-auto space-y-8 relative">

              <div className="space-y-3 text-center flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider">
                  <Send size={12} className="rotate-45" /> Contacto Inmediato
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-content tracking-tight">
                  Hagamos realidad tu próximo proyecto inmobiliario
                </h2>
                <p className="text-xs md:text-sm text-content-secondary leading-relaxed max-w-xl">
                  Completa el siguiente formulario con tu interés y datos de contacto para recibir atención personalizada de uno de nuestros agentes.
                </p>
              </div>

              {contactSubmitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 md:p-8 text-center space-y-4 max-w-xl mx-auto">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Check size={28} />
                  </div>
                  <h3 className="text-lg font-black text-content">¡Solicitud Registrada!</h3>
                  <p className="text-xs md:text-sm text-content-secondary leading-relaxed font-semibold">
                    Gracias <span className="text-accent font-bold">{contactName}</span>. En breve uno de nuestros agentes se pondrá en contacto contigo.
                  </p>
                  <button
                    onClick={() => {
                      setContactSubmitted(false);
                      setContactName('');
                      setContactPhone('');
                      setContactEmail('');
                      setContactComments('');
                    }}
                    className="px-5 py-2.5 rounded-xl bg-surface-base hover:bg-edge border border-edge text-content text-xs font-bold transition-all cursor-pointer mt-2"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="bg-surface-base border border-edge p-6 md:p-8 rounded-2xl shadow-xl space-y-5">
                  {contactError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold text-center">
                      {contactError}
                    </div>
                  )}

                  {/* Selector de Interés (Obligatorio) */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-content block uppercase tracking-wider">
                      ¿Cuál es tu interés? <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setContactInterest('Comprar')}
                        className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                          contactInterest === 'Comprar'
                            ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                            : 'bg-surface border-edge text-content-secondary hover:text-content hover:bg-edge'
                        }`}
                      >
                        <Home size={14} />
                        <span>Quiero Comprar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactInterest('Vender')}
                        className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 border cursor-pointer ${
                          contactInterest === 'Vender'
                            ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                            : 'bg-surface border-edge text-content-secondary hover:text-content hover:bg-edge'
                        }`}
                      >
                        <Building size={14} />
                        <span>Quiero Vender</span>
                      </button>
                    </div>
                  </div>

                  {/* Nombres y Celular (Obligatorios) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-content block uppercase tracking-wider">
                        Nombre completo <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Users size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
                        <input
                          type="text"
                          required
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="Ingresa tu nombre completo..."
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-edge bg-surface text-content text-xs font-semibold focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-extrabold text-content block uppercase tracking-wider">
                        Celular de contacto <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
                        <input
                          type="tel"
                          required
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="Ej: 912345678"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-edge bg-surface text-content text-xs font-semibold focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email (Opcional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-content block uppercase tracking-wider">
                      Correo electrónico <span className="text-content-muted font-medium text-[10px] uppercase">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-edge bg-surface text-content text-xs font-semibold focus:outline-none focus:border-accent transition-colors"
                      />
                    </div>
                  </div>

                  {/* Comentarios (Opcional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-content block uppercase tracking-wider">
                      Comentarios o detalles <span className="text-content-muted font-medium text-[10px] uppercase">(Opcional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={contactComments}
                      onChange={(e) => setContactComments(e.target.value)}
                      placeholder="¿Tienes alguna consulta o requerimiento específico?..."
                      className="w-full p-3 rounded-xl border border-edge bg-surface text-content text-xs font-semibold focus:outline-none focus:border-accent transition-colors resize-none"
                    />
                  </div>

                  {/* Botón WhatsApp */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                    >
                      <Send size={16} className="rotate-45" />
                      <span>Contactar por WhatsApp</span>
                    </button>
                    <p className="text-[10px] text-content-muted text-center mt-2 font-medium">
                      Tus datos se enviarán estructurados al número de WhatsApp de ventas para brindarte atención inmediata.
                    </p>
                  </div>
                </form>
              )}

            </div>
          </section>
        </>
      ) : (
        <>
          {/* BANNER DEL CATÁLOGO */}
          <section className="relative py-14 px-6 md:px-12 bg-surface border-b border-edge text-center overflow-visible">
            {/* Decoración */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
              <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-accent-hover/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-4xl mx-auto space-y-3">

              {renderFilterBar()}
            </div>
          </section>

          {/* GRILLA DEL CATÁLOGO COMPLETO */}
          <section id="propiedades" className="py-12 px-6 md:px-12 bg-surface-base">
            <div className="max-w-7xl mx-auto space-y-8">

              {/* Indicador de Búsqueda Filtrada */}
              {(searchLocation || filterType !== 'todos' || filterCurrency !== 'todos' || minPrice || maxPrice) && (
                <div className="flex justify-end border-b border-edge pb-4">
                  <div className="flex items-center gap-1.5 text-xs text-accent font-bold px-3 py-1.5 bg-accent/5 rounded-xl border border-accent/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                    <span>Búsqueda filtrada</span>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-content-muted">Cargando catálogo...</p>
                </div>
              ) : filteredList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredList.map((p) => {
                    const imgUrl = resolveUrl((Array.isArray(p.images) && p.images[0]) || p.avatar || p.image || '') || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80';

                    return (
                      <div
                        key={p.id}
                        className="card group overflow-hidden flex flex-col h-full hover:shadow-xl hover:border-accent/30 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-surface"
                        onClick={() => { setSelectedProperty(p); setActiveImageIndex(0); }}
                      >
                        {/* Imagen de Portada */}
                        <div className="h-56 relative overflow-hidden shrink-0">
                          <img
                            src={imgUrl}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                          <div className="absolute top-3.5 left-3.5">
                            <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1.5 rounded-lg shadow-md border-none text-white ${p.status?.toLowerCase() === 'disponible' ? 'bg-emerald-600' :
                              p.status?.toLowerCase() === 'reservado' ? 'bg-amber-600' :
                                'bg-rose-600'
                              }`}>
                              {p.status}
                            </span>
                          </div>

                          {/* Tipo Icono flotante */}
                          <div className={`absolute top-3.5 right-3.5 w-8 h-8 rounded-lg text-white backdrop-blur-sm flex items-center justify-center shadow-md ${getPropertyTypeStyles(p.type).solidBg}`}>
                            {getPropertyIcon(p.type)}
                          </div>

                          {/* Precio flotante */}
                          <div className="absolute bottom-3.5 left-3.5 bg-black/75 text-white backdrop-blur-sm py-1.5 px-3 rounded-lg text-sm font-black tracking-tight">
                            {formatPrice(p.price, p.currency)}
                          </div>
                        </div>

                        {/* Contenido Tarjeta */}
                        <div className="p-5 flex flex-col flex-1 space-y-4">
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-accent tracking-wider uppercase block">{p.project || 'Proyecto Independiente'}</span>
                            <h3 className="font-extrabold text-base text-content group-hover:text-accent transition-colors line-clamp-1">{p.name}</h3>
                            <div className="flex items-center gap-1 text-content-muted mt-1.5">
                              <MapPin size={12} className="shrink-0 text-accent/60" />
                              <span className="text-xs truncate">{p.location}</span>
                            </div>
                          </div>

                          {p.type?.toLowerCase() === 'terreno' && p.proj_price_from && p.proj_price_to && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 p-2 rounded-lg text-[10px] font-bold flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-1 leading-tight">
                                <span className="text-[9px] uppercase tracking-wider opacity-75 shrink-0">Precio:</span>
                                <span className="text-[10px] font-extrabold truncate">
                                  desde {formatPrice(p.proj_price_from, p.currency)} hasta {formatPrice(p.proj_price_to, p.currency)}
                                </span>
                              </div>
                              {p.proj_area_from && p.proj_area_to && (
                                <div className="flex items-center justify-between gap-1 leading-tight pt-1 border-t border-emerald-500/20">
                                  <span className="text-[9px] uppercase tracking-wider opacity-75 shrink-0">Área:</span>
                                  <span className="text-[10px] font-extrabold truncate">
                                    desde {p.proj_area_from} m² hasta {p.proj_area_to} m²
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Características */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-edge mt-auto font-bold">
                            {p.type?.toLowerCase() !== 'terreno' && p.area && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/10 uppercase tracking-wider">{p.area} m²</span>}
                            {p.rooms && Number(p.rooms) > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border border-blue-500/10 uppercase tracking-wider">{p.rooms} hab</span>}
                            {p.bathrooms && Number(p.bathrooms) > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400 border border-cyan-500/10 uppercase tracking-wider">{p.bathrooms} bañ</span>}
                            {p.parking && Number(p.parking) > 0 && <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400 border border-violet-500/10 uppercase tracking-wider">{p.parking} est</span>}
                          </div>

                          {/* Botón Ver Detalle */}
                          <div className="pt-2 flex justify-between items-center text-xs font-bold text-accent group-hover:translate-x-1.5 transition-transform duration-300">
                            <span>Ver más detalles</span>
                            <ArrowRight size={14} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="card p-16 text-center border-dashed border-2 max-w-xl mx-auto">
                  <Home size={36} className="mx-auto text-content-muted mb-4 opacity-40 animate-bounce" />
                  <h3 className="h3 mb-2">No encontramos propiedades</h3>
                  <p className="text-sm text-content-secondary max-w-sm mx-auto">
                    No hay propiedades disponibles que coincidan con tu búsqueda en este momento. Intenta cambiar los filtros de ubicación o tipo.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* 5. FOOTER */}
      <footer className="mt-auto border-t border-edge bg-surface/50 transition-all pt-16 pb-8 px-6 md:px-12 text-sm text-content-secondary">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-10 mb-12">

          {/* Col 1: Marca */}
          <div className="space-y-4 col-span-1">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                portalSettings?.logo_night ? (
                  <img src={resolveUrl(portalSettings.logo_night)} className="h-8 max-w-[160px] object-contain" alt="Casaya" />
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white">
                      <Home size={16} />
                    </div>
                    <span className="text-lg font-extrabold tracking-tight text-content">Casaya</span>
                  </>
                )
              ) : (
                portalSettings?.logo_day ? (
                  <img src={resolveUrl(portalSettings.logo_day)} className="h-8 max-w-[160px] object-contain" alt="Casaya" />
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white">
                      <Home size={16} />
                    </div>
                    <span className="text-lg font-extrabold tracking-tight text-content">Casaya</span>
                  </>
                )
              )}
            </div>
            <p className="text-xs leading-relaxed text-content-muted">
              Plataforma inmobiliaria premium conectada con IA para CRM y automatización de leads en tiempo real. Encuentra y gestiona propiedades con facilidad.
            </p>
          </div>

          {/* Sub-grid para Enlaces Rápidos y Contacto (2 columnas en móvil/tablet) */}
          <div className="grid grid-cols-2 gap-10 col-span-1 lg:col-span-2">
            {/* Col 2: Secciones */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-content text-xs uppercase tracking-wider">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-xs list-none p-0 text-left">
                <li>
                  <button
                    onClick={() => { setViewMode('portal'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="hover:text-accent transition-colors bg-transparent border-none p-0 cursor-pointer text-content-secondary text-xs font-semibold"
                  >
                    Inicio
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => { setViewMode('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="hover:text-accent transition-colors bg-transparent border-none p-0 cursor-pointer text-content-secondary text-xs font-semibold"
                  >
                    Catálogo Completo
                  </button>
                </li>
                <li>
                  <a
                    href="#quienes-somos"
                    onClick={() => setViewMode('portal')}
                    className="hover:text-accent transition-colors text-content-secondary font-semibold"
                  >
                    Quiénes Somos
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 3: Contacto */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-content text-xs uppercase tracking-wider">Contacto</h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2"><Phone size={12} className="text-accent" /> {portalSettings?.phone || '+51 900 000 000'}</li>
                <li className="flex items-center gap-2"><Mail size={12} className="text-accent" /> {portalSettings?.email || 'ventas@casaya.com'}</li>
                {portalSettings?.address && (
                  <li className="flex items-center gap-2"><MapPin size={12} className="text-accent" /> {portalSettings.address}</li>
                )}
              </ul>
            </div>
          </div>

          {/* Col 4: Redes Sociales */}
          <div className="space-y-4 col-span-1">
            <h4 className="font-extrabold text-content text-xs uppercase tracking-wider">Síguenos en Redes</h4>
            <p className="text-xs text-content-muted">Mantente al tanto de nuestros nuevos lanzamientos y proyectos inmobiliarios.</p>

            {/* Botones Redes Sociales */}
            <div className="flex gap-2.5">
              <a
                href={portalSettings?.facebook_url || "https://facebook.com"}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl border border-accent/40 text-accent hover:bg-accent hover:text-white hover:border-accent hover:scale-105 flex items-center justify-center transition-all"
                title="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a
                href={portalSettings?.instagram_url || "https://instagram.com"}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl border border-accent/40 text-accent hover:bg-accent hover:text-white hover:border-accent hover:scale-105 flex items-center justify-center transition-all"
                title="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a
                href={portalSettings?.linkedin_url || "https://linkedin.com"}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl border border-accent/40 text-accent hover:bg-accent hover:text-white hover:border-accent hover:scale-105 flex items-center justify-center transition-all"
                title="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
              <a
                href={portalSettings?.youtube_url || "https://youtube.com"}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl border border-accent/40 text-accent hover:bg-accent hover:text-white hover:border-accent hover:scale-105 flex items-center justify-center transition-all"
                title="YouTube"
              >
                <Youtube size={16} />
              </a>
              <a
                href={portalSettings?.phone ? `https://wa.me/${portalSettings.phone.replace(/[^0-9]/g, '')}` : "https://wa.me/51900000000"}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl border border-accent/40 text-accent hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:scale-105 flex items-center justify-center transition-all"
                title="WhatsApp Ventas"
              >
                <Send size={16} />
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-edge pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span className="text-[11px] font-medium text-content-muted">Garantía Inmobiliaria Certificada y Protegida</span>
          </div>
          <p className="text-[11px] text-content-muted">
            © {new Date().getFullYear()} Casaya app· Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* 6. MODAL DE DETALLE DE PROPIEDAD */}
      {selectedProperty && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-3xl rounded-2xl border border-edge bg-surface overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera Modal */}
            <div className="px-5 py-3 border-b border-edge flex justify-between items-center bg-surface-inset">
              <div>
                <span className="text-[9px] font-bold text-accent tracking-widest uppercase">{selectedProperty.project || 'Proyecto Destacado'}</span>
                <h2 className="text-base md:text-lg font-bold text-content leading-snug">{selectedProperty.name}</h2>
              </div>
              <button
                onClick={() => setSelectedProperty(null)}
                className="w-7 h-7 rounded-md border border-edge text-content-secondary hover:text-content hover:bg-surface flex items-center justify-center transition-colors font-bold text-base cursor-pointer focus:outline-none"
              >
                &times;
              </button>
            </div>

            {/* Cuerpo Modal */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* Sección Imágenes */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
                {/* Gran Imagen Principal */}
                <div className="w-full max-w-[380px] md:max-w-none md:w-[380px] aspect-square rounded-xl overflow-hidden border border-edge relative bg-surface-inset flex items-center justify-center shrink-0">
                  <img
                    src={getImagesArray(selectedProperty)[activeImageIndex]}
                    alt={selectedProperty.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2.5 right-2.5 bg-black/75 px-2 py-0.5 text-white text-[10px] rounded-md font-bold z-20">
                    Foto {activeImageIndex + 1} de {getImagesArray(selectedProperty).length}
                  </div>
                </div>

                {/* Miniaturas de Galería (Al lado derecho en desktop, abajo en mobile) */}
                {getImagesArray(selectedProperty).length > 1 && (
                  <div className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto max-w-full md:max-h-[380px] py-1 md:py-0 px-0.5 custom-scrollbar shrink-0">
                    {getImagesArray(selectedProperty).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${activeImageIndex === idx ? 'border-accent ring-2 ring-accent/20' : 'border-edge opacity-70 hover:opacity-100'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Barra de Acción Rápida (Precio + WhatsApp CTA) */}
              <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-extrabold text-content-muted uppercase tracking-wider">Precio de Lista:</span>
                  <span className="text-xl font-black text-accent tracking-tight">
                    {selectedProperty.type?.toLowerCase() === 'terreno' && selectedProperty.proj_price_from && selectedProperty.proj_price_to ? (
                      <span className="text-sm font-bold flex flex-col sm:flex-row sm:gap-2">
                        <span>Min: {formatPrice(selectedProperty.proj_price_from, selectedProperty.currency)}</span>
                        <span className="hidden sm:inline">-</span>
                        <span>Max: {formatPrice(selectedProperty.proj_price_to, selectedProperty.currency)}</span>
                      </span>
                    ) : (
                      formatPrice(selectedProperty.price, selectedProperty.currency)
                    )}
                  </span>
                </div>
                <button
                  onClick={() => handleWhatsAppContact(selectedProperty)}
                  className="w-full sm:w-auto px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                >
                  <Send size={12} className="rotate-45" />
                  <span>Contactar por WhatsApp</span>
                </button>
              </div>

              {/* Información Adicional y Ficha Técnica */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* Descripción / Ficha */}
                <div className="md:col-span-2 space-y-1.5">
                  <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider block">Ficha de la Propiedad</span>
                  <p className="text-xs text-content-secondary leading-relaxed bg-surface-inset p-3 rounded-lg border border-edge whitespace-pre-line max-h-36 overflow-y-auto custom-scrollbar">
                    {selectedProperty.details || selectedProperty.notes || 'No hay descripción adicional disponible para esta propiedad.'}
                  </p>
                </div>

                {/* Especificaciones / Metadatos */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider block">Especificaciones</span>
                  <div className="p-3 rounded-lg border border-edge bg-surface-inset space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-content-muted">Ubicación:</span>
                      <span className="font-semibold text-content truncate max-w-[130px]">{selectedProperty.location}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-content-muted">Tipo:</span>
                      <span className="font-semibold text-content capitalize">{selectedProperty.type}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-content-muted">Nivel/Piso:</span>
                      <span className="font-semibold text-content">{selectedProperty.floor || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Características Clave */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2 rounded-lg border border-slate-500/20 bg-slate-500/5 text-center space-y-0.5">
                  <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Área Total</span>
                  <span className="text-xs font-extrabold text-content">
                    {selectedProperty.type?.toLowerCase() === 'terreno' && selectedProperty.proj_area_from && selectedProperty.proj_area_to ? (
                      <div className="flex flex-col text-[10px] leading-tight mt-1">
                        <span>Min: {selectedProperty.proj_area_from} m²</span>
                        <span>Max: {selectedProperty.proj_area_to} m²</span>
                      </div>
                    ) : (
                      `${selectedProperty.area || '—'} m²`
                    )}
                  </span>
                </div>
                <div className="p-2 rounded-lg border border-blue-500/20 bg-blue-500/5 text-center space-y-0.5">
                  <span className="text-[8px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider block">Habitaciones</span>
                  <span className="text-xs font-extrabold text-content">{selectedProperty.rooms && Number(selectedProperty.rooms) > 0 ? selectedProperty.rooms : '—'}</span>
                </div>
                <div className="p-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 text-center space-y-0.5">
                  <span className="text-[8px] font-bold text-cyan-500 dark:text-cyan-400 uppercase tracking-wider block">Baños</span>
                  <span className="text-xs font-extrabold text-content">{selectedProperty.bathrooms && Number(selectedProperty.bathrooms) > 0 ? selectedProperty.bathrooms : '—'}</span>
                </div>
                <div className="p-2 rounded-lg border border-violet-500/20 bg-violet-500/5 text-center space-y-0.5">
                  <span className="text-[8px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-wider block">Cocheras</span>
                  <span className="text-xs font-extrabold text-content">{selectedProperty.parking && Number(selectedProperty.parking) > 0 ? selectedProperty.parking : '—'}</span>
                </div>
              </div>

            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 border-t border-edge flex items-center justify-end bg-surface-inset">
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-[11px] font-bold text-content-secondary hover:text-content px-3.5 py-1.5 border border-edge rounded-md bg-surface hover:bg-surface-inset cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
