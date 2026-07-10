import React, { useState, useEffect } from 'react';
import { 
  Search, MapPin, Home, Building, Layers, Briefcase, Car, HelpCircle, 
  Phone, Mail, Globe, Moon, Sun, ArrowRight, Eye, Send, 
  Facebook, Instagram, Linkedin, Youtube, ShieldCheck, Award, Heart, Users, ChevronDown, Check, LogIn, Menu, X, Lock
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  { value: 'todos', label: 'Cualquier tipo' },
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

// 8 Propiedades Demo de Alta Calidad para garantizar una estética premium
const DEMO_PROPERTIES: Property[] = [
  {
    id: 'demo-1',
    name: 'Residencia Campestre La Molina',
    project: 'Condominio El Haras',
    developer: 'Inmobiliaria Prex',
    type: 'casa',
    price: 450000,
    currency: 'USD',
    location: 'La Molina, Lima',
    area: 280,
    rooms: 4,
    bathrooms: 4.5,
    parking: 2,
    floor: '2 niveles',
    details: 'Hermosa residencia campestre con amplias áreas verdes, piscina privada, acabados en mármol y madera de la más alta calidad, zona de parrilla y seguridad 24/7 en condominio cerrado.',
    status: 'Disponible',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'demo-2',
    name: 'Loft de Lujo Miraflores',
    project: 'Edificio Larco 900',
    developer: 'Constructora Horizon',
    type: 'departamento',
    price: 195000,
    currency: 'USD',
    location: 'Miraflores, Lima',
    area: 85,
    rooms: 1,
    bathrooms: 1.5,
    parking: 1,
    floor: 'Piso 12',
    details: 'Espectacular departamento estilo loft industrial con techos de doble altura, ventanas de piso a techo con vista panorámica a la ciudad, cocina equipada con encimera de cuarzo y acceso a áreas comunes premium (piscina infinita, gimnasio y bar).',
    status: 'Disponible',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'demo-3',
    name: 'Terreno Residencial Exclusivo Asia',
    project: 'Club Nautico Asia',
    developer: 'Desarrollos del Sur',
    type: 'terreno',
    price: 135000,
    currency: 'USD',
    location: 'Asia, Cañete',
    area: 320,
    rooms: 0,
    bathrooms: 0,
    parking: 0,
    floor: 'Terreno plano',
    details: 'Lote residencial ideal para construir la casa de playa de tus sueños. Ubicado en primera fila del condominio con acceso directo a la playa, club house, canchas de tenis y piscina del club.',
    status: 'Disponible',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
    images: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'demo-4',
    name: 'Oficina Corporativa Prime San Isidro',
    project: 'Torre Empresarial Siglo XXI',
    developer: 'Prex Real Estate',
    type: 'oficina',
    price: 320000,
    currency: 'USD',
    location: 'San Isidro, Lima',
    area: 160,
    rooms: 0,
    bathrooms: 2,
    parking: 3,
    floor: 'Piso 8',
    details: 'Moderna oficina implementada con divisiones de vidrio templado, aire acondicionado central, luminarias LED y alfombra de alto tránsito. La torre cuenta con certificación LEED y áreas comunes como directorios y comedor.',
    status: 'Disponible',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
    images: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'demo-5',
    name: 'Estacionamiento Doble Lineal',
    project: 'Sótano Larcomar',
    developer: 'Inmobiliaria Prex',
    type: 'cochera',
    price: 24000,
    currency: 'USD',
    location: 'Miraflores, Lima',
    area: 26,
    rooms: 0,
    bathrooms: 0,
    parking: 2,
    floor: 'Sótano 2',
    details: 'Espacio de cochera lineal techada con portón eléctrico automático y seguridad 24 horas. Muy fácil maniobra y ubicación céntrica en el corazón comercial del distrito.',
    status: 'Disponible',
    image: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
    images: [
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'demo-6',
    name: 'Penthouse Triplex Golf San Isidro',
    project: 'Residencial Los Eucaliptos',
    developer: 'Constructora Horizon',
    type: 'departamento',
    price: 750000,
    currency: 'USD',
    location: 'San Isidro, Lima',
    area: 340,
    rooms: 3,
    bathrooms: 4,
    parking: 3,
    floor: 'Pisos 15-17',
    details: 'Exclusivo penthouse triplex frente al Golf de San Isidro. Cuenta con terraza privada de 80m² con jacuzzi, sala comedor amplia con chimenea, cocina con isla central, acabados de importación europea y ascensor directo al departamento.',
    status: 'Disponible',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'demo-7',
    name: 'Casa de Playa de Lujo Asia',
    project: 'Condominio Coral Reef',
    developer: 'Desarrollos del Sur',
    type: 'casa',
    price: 385000,
    currency: 'USD',
    location: 'Asia, Cañete',
    area: 250,
    rooms: 5,
    bathrooms: 5,
    parking: 3,
    floor: '3 niveles',
    details: 'Moderna casa de playa completamente amoblada y equipada. Terraza con piscina propia y vista espectacular al mar. Cuenta con 5 dormitorios en suite, cuarto y baño de servicio, cochera y áreas comunes en el condominio de lujo.',
    status: 'Disponible',
    image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
    images: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80'
    ]
  },
  {
    id: 'demo-8',
    name: 'Local Comercial en Esquina Larco',
    project: 'Edificio Larco Centro',
    developer: 'Inmobiliaria Prex',
    type: 'local',
    price: 520000,
    currency: 'USD',
    location: 'Miraflores, Lima',
    area: 180,
    rooms: 0,
    bathrooms: 2,
    parking: 1,
    floor: 'Piso 1',
    details: 'Excelente local comercial a pie de calle con alto flujo peatonal y vehicular en plena Av. Larco. Fachada de vidrio templado de 12 metros, doble altura en techos, ideal para bancos, franquicias gastronómicas, boutiques o showroom.',
    status: 'Disponible',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
    avatar: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=200&q=80',
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80'
    ]
  }
];

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1920&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1920&q=80'
];

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'portal' | 'catalog'>('portal');

  const getHeroImages = () => {
    if (portalSettings) {
      const customBanners = [
        portalSettings.banner_image_1,
        portalSettings.banner_image_2,
        portalSettings.banner_image_3
      ].filter(Boolean);
      if (customBanners.length > 0) return customBanners;
    }
    return HERO_IMAGES;
  };

  // Rotador automático de banner cada 10 segundos
  useEffect(() => {
    const imagesList = getHeroImages();
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % imagesList.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [portalSettings]);

  useEffect(() => {
    const fetchPublicProperties = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/properties/public`);
        if (res.ok) {
          const data = await res.json();
          // Combinar las propiedades de la DB con las de Demo para rellenar
          // Las de la DB tienen prioridad
          const formattedDbData: Property[] = data.map((p: any) => ({
            ...p,
            images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images || []
          }));
          
          let combined = [...formattedDbData];
          if (combined.length < 8) {
            // Completar hasta 8 usando los de demo
            const needed = 8 - combined.length;
            const extra = DEMO_PROPERTIES.slice(0, needed);
            combined = [...combined, ...extra];
          }
          setProperties(combined);
        } else {
          setProperties(DEMO_PROPERTIES);
        }
      } catch (err) {
        console.error("Error al cargar propiedades públicas:", err);
        setProperties(DEMO_PROPERTIES);
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
    if (Array.isArray(property.images)) {
      return property.images.length > 0 ? property.images : [property.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa'];
    }
    if (typeof property.images === 'string') {
      try {
        const parsed = JSON.parse(property.images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [property.image || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa'];
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
        <div className="flex md:hidden flex-col gap-2.5 bg-surface dark:bg-zinc-900 border border-accent rounded-2xl p-3.5 shadow-2xl text-left max-w-sm mx-auto w-full">
          <div className="space-y-0.5">
            <label className="text-[8px] font-extrabold text-accent uppercase tracking-wider block">Ubicación</label>
            <input 
              type="text" 
              placeholder="Ciudad, distrito o región..." 
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="w-full bg-surface-inset border border-edge rounded-lg px-2.5 py-1.5 text-xs font-semibold text-content focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-0.5">
              <label className="text-[8px] font-extrabold text-accent uppercase tracking-wider block">Tipo</label>
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full bg-surface-inset border border-edge rounded-lg px-2.5 py-1.5 text-xs font-semibold text-content focus:outline-none"
              >
                <option value="todos">Cualquier tipo</option>
                <option value="casa">Casa</option>
                <option value="departamento">Departamento</option>
                <option value="lotes">Lotes / Terreno</option>
                <option value="oficinas">Oficina</option>
                <option value="cocheras">Cochera</option>
                <option value="local">Local</option>
                <option value="deposito">Depósito</option>
              </select>
            </div>

            <div className="space-y-0.5">
              <label className="text-[8px] font-extrabold text-accent uppercase tracking-wider block">Moneda</label>
              <select 
                value={filterCurrency}
                onChange={(e) => setFilterCurrency(e.target.value)}
                className="w-full bg-surface-inset border border-edge rounded-lg px-2.5 py-1.5 text-xs font-semibold text-content focus:outline-none"
              >
                <option value="todos">Cualquier moneda</option>
                <option value="USD">Dólares (USD)</option>
                <option value="PEN">Soles (PEN)</option>
                <option value="MXN">Pesos MX (MXN)</option>
                <option value="COP">Pesos CO (COP)</option>
              </select>
            </div>
          </div>

          <div className="space-y-0.5">
            <label className="text-[8px] font-extrabold text-accent uppercase tracking-wider block">Precio (Min - Max)</label>
            <div className="grid grid-cols-2 gap-2.5">
              <input 
                type="number" 
                placeholder="Min" 
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-full bg-surface-inset border border-edge rounded-lg px-2.5 py-1.5 text-xs font-semibold text-content focus:outline-none"
              />
              <input 
                type="number" 
                placeholder="Max" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full bg-surface-inset border border-edge rounded-lg px-2.5 py-1.5 text-xs font-semibold text-content focus:outline-none"
              />
            </div>
          </div>

          <button 
            onClick={() => {
              const el = document.getElementById('propiedades');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-primary w-full py-2 flex items-center justify-center gap-1.5 text-xs font-bold shadow-md shadow-accent/20 rounded-lg cursor-pointer border-none"
          >
            <Search size={14} />
            <span>Buscar Propiedades</span>
          </button>
        </div>

      </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col transition-all bg-surface-base text-content ${isDarkMode ? 'dark' : ''}`}>
      
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 w-full bg-surface/85 backdrop-blur-md border-b border-edge transition-all py-4 px-6 md:px-12 flex items-center justify-between">
        <div onClick={() => { setViewMode('portal'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 cursor-pointer">
          {isDarkMode ? (
            portalSettings?.logo_night ? (
              <img src={portalSettings.logo_night} className="h-9 max-w-[180px] object-contain" alt="ChatPrex" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
                  <Building size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight">ChatPrex <span className="text-accent font-medium text-xs py-0.5 px-2 bg-accent-subtle rounded-full ml-1">Portal</span></span>
              </>
            )
          ) : (
            portalSettings?.logo_day ? (
              <img src={portalSettings.logo_day} className="h-9 max-w-[180px] object-contain" alt="ChatPrex" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
                  <Building size={20} />
                </div>
                <span className="text-xl font-bold tracking-tight">ChatPrex <span className="text-accent font-medium text-xs py-0.5 px-2 bg-accent-subtle rounded-full ml-1">Portal</span></span>
              </>
            )
          )}
        </div>
        
        {/* Enlaces de Navegación (Desktop only) */}
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => { setViewMode('portal'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`text-sm font-semibold transition-colors bg-transparent border-none cursor-pointer ${viewMode === 'portal' ? 'text-accent' : 'text-content-secondary hover:text-accent'}`}
          >
            Inicio
          </button>
          <button 
            onClick={() => { setViewMode('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`text-sm font-semibold transition-colors bg-transparent border-none cursor-pointer ${viewMode === 'catalog' ? 'text-accent' : 'text-content-secondary hover:text-accent'}`}
          >
            Propiedades
          </button>
          <a 
            href="#quienes-somos" 
            onClick={() => setViewMode('portal')}
            className="text-sm font-semibold text-content-secondary hover:text-accent transition-colors"
          >
            Quiénes Somos
          </a>
          <a 
            href="#contacto" 
            onClick={() => setViewMode('portal')}
            className="text-sm font-semibold text-content-secondary hover:text-accent transition-colors"
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
              className={`text-left text-sm font-semibold transition-colors px-3.5 py-2.5 rounded-xl block border-none bg-transparent cursor-pointer ${viewMode === 'portal' ? 'text-accent bg-accent/5' : 'text-content hover:text-accent hover:bg-surface-inset'}`}
            >
              Inicio
            </button>
            <button 
              onClick={() => { setIsMobileMenuOpen(false); setViewMode('catalog'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className={`text-left text-sm font-semibold transition-colors px-3.5 py-2.5 rounded-xl block border-none bg-transparent cursor-pointer ${viewMode === 'catalog' ? 'text-accent bg-accent/5' : 'text-content hover:text-accent hover:bg-surface-inset'}`}
            >
              Propiedades
            </button>
            <a 
              href="#quienes-somos" 
              onClick={() => { setIsMobileMenuOpen(false); setViewMode('portal'); }}
              className="text-sm font-semibold text-content-secondary hover:text-accent hover:bg-surface-inset transition-colors px-3.5 py-2.5 rounded-xl block"
            >
              Quiénes Somos
            </a>
            <a 
              href="#contacto" 
              onClick={() => { setIsMobileMenuOpen(false); setViewMode('portal'); }}
              className="text-sm font-semibold text-content-secondary hover:text-accent hover:bg-surface-inset transition-colors px-3.5 py-2.5 rounded-xl block"
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
                      opacity: currentHeroIndex === idx ? 1 : 0
                    }}
                  />
                ))}
                {/* Scrim Overlay (Adjusted: 35% black in light mode, 60% black in dark mode to ensure maximum text contrast) */}
                <div className="absolute inset-0 bg-black/35 dark:bg-black/60 transition-all duration-300" />
                {/* Bottom edge fade-out (Only at the very bottom to blend cleanly with the next section) */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-surface-base to-transparent pointer-events-none" />
              </div>

              {/* Decoración */}
              <div className="absolute top-1/4 left-1/10 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/10 w-96 h-96 bg-accent-hover/5 rounded-full blur-3xl"></div>
            </div>
            
            <div className="relative z-10 max-w-4xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider mb-1 backdrop-blur-sm shadow-sm">
                <Award size={12} /> Tu Hogar Ideal a un Clic
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
                {portalSettings?.hero_subtitle || 'Explora las mejores casas, departamentos, terrenos, oficinas y cocheras en las ubicaciones más exclusivas con la asesoría de IA líder de ChatPrex.'}
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
                  <h2 className="text-2xl font-extrabold text-content tracking-tight">Propiedades y Proyectos Destacados</h2>
                  <p className="text-xs md:text-sm text-content-secondary max-w-lg">
                    Nuestras mejores opciones seleccionadas a detalle para brindarte el máximo confort y retorno de inversión.
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
                      const imgUrl = p.image || (Array.isArray(p.images) && p.images[0]) || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80';
                      
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
                              <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1.5 rounded-lg shadow-md border-none text-white ${
                                p.status?.toLowerCase() === 'disponible' ? 'bg-emerald-600' :
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

                            {/* Características con colores diferenciados */}
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-edge mt-auto font-bold">
                              {p.area && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/10 uppercase tracking-wider">{p.area} m²</span>}
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
                  <Layers size={10} /> Catálogo Ampliado
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-content tracking-tight">
                  Explora toda nuestra cartera de propiedades exclusivas
                </h2>
                <p className="text-xs md:text-sm text-content-secondary leading-relaxed">
                  ¿No encuentras lo que buscas en la selección destacada? Contamos con un inventario completo de casas, departamentos, oficinas y terrenos listos para ti. Utiliza nuestros filtros avanzados para encontrar la opción perfecta según tu presupuesto y ubicación.
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
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
              
              {/* Columna Izquierda: Imagen */}
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-72 h-72 bg-accent/5 rounded-3xl blur-2xl pointer-events-none"></div>
                <div className="rounded-2xl overflow-hidden shadow-2xl relative z-10 border border-edge">
                  <img 
                    src={portalSettings?.about_image || "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=800&q=80"} 
                    alt="Quiénes Somos" 
                    className="w-full h-[400px] object-cover" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                    <p className="text-xs font-bold tracking-widest uppercase text-accent">Liderazgo Inmobiliario</p>
                    <h3 className="text-xl font-bold">Líderes en conectar personas con sus hogares ideales</h3>
                  </div>
                </div>
                
                {/* Tarjeta flotante de experiencia */}
                <div className="absolute -bottom-6 -right-6 bg-accent text-white p-6 rounded-2xl shadow-xl z-20 flex flex-col items-center justify-center text-center w-36 h-36 border-4 border-surface">
                  <span className="text-3xl font-black">15+</span>
                  <span className="text-[10px] font-bold tracking-wider uppercase mt-1">Años de Trayectoria</span>
                </div>
              </div>

              {/* Columna Derecha: Texto */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-accent tracking-widest uppercase block">Nosotros</span>
                  <h2 className="text-3xl md:text-4xl font-black text-content tracking-tight">
                    {portalSettings?.about_title || 'Redefiniendo el sector inmobiliario con innovación y pasión'}
                  </h2>
                </div>
                
                <p className="body-text text-content-secondary leading-relaxed whitespace-pre-line">
                  {portalSettings?.about_description || (
                    <>
                      En <strong>ChatPrex</strong>, combinamos la tecnología de inteligencia artificial más avanzada con la experiencia humana en bienes raíces. Nuestra misión es guiarte en el proceso de compra, venta o alquiler de propiedades de forma transparente, rápida y eficiente, asegurándote decisiones rentables y seguras.
                    </>
                  )}
                </p>

                {/* Valores/Pilares */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                  
                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 dark:bg-amber-500/25 shrink-0 flex items-center justify-center">
                      <Award size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-content">Garantía y Confianza</h4>
                      <p className="text-xs text-content-secondary mt-1">Respaldo legal y profesional en cada fase de negociación.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 dark:bg-blue-500/25 shrink-0 flex items-center justify-center">
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-content">Equipo Especializado</h4>
                      <p className="text-xs text-content-secondary mt-1">Asesores inmobiliarios capacitados con herramientas de IA en tiempo real.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 dark:bg-rose-500/25 shrink-0 flex items-center justify-center">
                      <Heart size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-content">Compromiso Social</h4>
                      <p className="text-xs text-content-secondary mt-1">Buscamos el bienestar de las familias y el desarrollo urbano sostenible.</p>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/25 shrink-0 flex items-center justify-center">
                      <ShieldCheck size={18} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-content">Seguridad Certificada</h4>
                      <p className="text-xs text-content-secondary mt-1">Procesos de documentación auditados de extremo a extremo.</p>
                    </div>
                  </div>

                </div>

                {/* Metricas */}
                <div className="flex gap-8 border-t border-edge pt-8">
                  <div>
                    <span className="text-2xl font-black text-accent block">1,200+</span>
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

          {/* 3.5. SECCIÓN DE LLAMADO A LA ACCIÓN (CONTACTAR POR WHATSAPP) - Compacto y Blended */}
          <section id="contacto" className="py-12 px-6 md:px-12 bg-surface border-t border-b border-edge">
            <div className="max-w-3xl mx-auto flex flex-col items-center text-center gap-6 relative">
              
              <div className="space-y-3 flex flex-col items-center">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase tracking-wider">
                  <Send size={10} className="rotate-45" /> Contacto Inmediato
                </div>
                <h2 className="text-xl md:text-2xl font-extrabold text-content tracking-tight">
                  ¿Encontraste la propiedad ideal o tienes alguna pregunta?
                </h2>
                <p className="text-xs md:text-sm text-content-secondary leading-relaxed max-w-2xl">
                  Nuestros asesores expertos, impulsados por la tecnología de inteligencia artificial de <strong>ChatPrex</strong>, están listos para asistirte. Escríbenos ahora mismo y recibe asesoramiento personalizado para concretar tu próxima inversión con las mejores condiciones del mercado.
                </p>
              </div>

              <div className="shrink-0 w-full sm:w-auto flex justify-center">
                <button
                  onClick={() => {
                    const defaultPhone = "51900000000";
                    const message = "Hola! Vengo del portal de ChatPrex y me gustaría recibir asesoría personalizada para adquirir un inmueble.";
                    const url = `https://wa.me/${defaultPhone}?text=${encodeURIComponent(message)}`;
                    window.open(url, '_blank');
                  }}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
                >
                  <Send size={14} className="rotate-45" />
                  <span>Contactar por WhatsApp</span>
                </button>
              </div>
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
            
            <div className="relative z-10 max-w-4xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-accent/10 border border-accent text-accent text-[10px] font-extrabold uppercase tracking-wider mb-1">
                <Award size={12} /> Catálogo Completo
              </div>
              <h1 className="text-3xl md:text-[36px] font-black text-accent tracking-tight leading-tight">
                Todas las Propiedades y Proyectos
              </h1>
              <p className="text-sm md:text-base text-content-secondary font-semibold max-w-2xl mx-auto leading-relaxed font-sans">
                Explora el inventario inmobiliario registrado en nuestra plataforma sin límites de visualización. Refina los resultados utilizando la barra de filtros.
              </p>
              
              {renderFilterBar()}
            </div>
          </section>

          {/* GRILLA DEL CATÁLOGO COMPLETO */}
          <section id="propiedades" className="py-12 px-6 md:px-12 bg-surface-base">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Cabecera del Catálogo */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-edge pb-4">
                <div className="space-y-1.5 text-left">
                  <h2 className="text-xl font-extrabold text-content tracking-tight">Catálogo de Inmuebles Registrados</h2>
                  <p className="text-xs text-content-secondary">
                    Mostrando <strong className="text-accent">{filteredList.length}</strong> propiedades encontradas
                  </p>
                </div>

                {/* Filtros Activos Indicator */}
                {(searchLocation || filterType !== 'todos' || filterCurrency !== 'todos' || minPrice || maxPrice) && (
                  <div className="flex items-center gap-1.5 text-xs text-accent font-bold px-3 py-1.5 bg-accent/5 rounded-xl border border-accent/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></span>
                    <span>Búsqueda filtrada</span>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm font-bold text-content-muted">Cargando catálogo...</p>
                </div>
              ) : filteredList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredList.map((p) => {
                    const imgUrl = p.image || (Array.isArray(p.images) && p.images[0]) || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80';
                    
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
                            <span className={`text-[10px] font-black tracking-widest uppercase px-2.5 py-1.5 rounded-lg shadow-md border-none text-white ${
                              p.status?.toLowerCase() === 'disponible' ? 'bg-emerald-600' :
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

                          {/* Características */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-edge mt-auto font-bold">
                            {p.area && <span className="text-[10px] px-2 py-0.5 rounded bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400 border border-slate-500/10 uppercase tracking-wider">{p.area} m²</span>}
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
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Col 1: Marca */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {isDarkMode ? (
                portalSettings?.logo_night ? (
                  <img src={portalSettings.logo_night} className="h-8 max-w-[160px] object-contain" alt="ChatPrex" />
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white">
                      <Building size={16} />
                    </div>
                    <span className="text-lg font-extrabold tracking-tight text-content">ChatPrex Portal</span>
                  </>
                )
              ) : (
                portalSettings?.logo_day ? (
                  <img src={portalSettings.logo_day} className="h-8 max-w-[160px] object-contain" alt="ChatPrex" />
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white">
                      <Building size={16} />
                    </div>
                    <span className="text-lg font-extrabold tracking-tight text-content">ChatPrex Portal</span>
                  </>
                )
              )}
            </div>
            <p className="text-xs leading-relaxed text-content-muted">
              Plataforma inmobiliaria premium conectada con IA para CRM y automatización de leads en tiempo real. Encuentra y gestiona propiedades con facilidad.
            </p>
          </div>

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
              <li className="flex items-center gap-2"><Phone size={12} className="text-accent" /> +51 900 000 000</li>
              <li className="flex items-center gap-2"><Mail size={12} className="text-accent" /> ventas@chatprex.com</li>
              <li className="flex items-center gap-2"><Globe size={12} className="text-accent" /> www.chatprex.com</li>
            </ul>
          </div>

          {/* Col 4: Redes Sociales */}
          <div className="space-y-4">
            <h4 className="font-extrabold text-content text-xs uppercase tracking-wider">Síguenos en Redes</h4>
            <p className="text-xs text-content-muted">Mantente al tanto de nuestros nuevos lanzamientos y proyectos inmobiliarios.</p>
            
            {/* Botones Redes Sociales */}
            <div className="flex gap-2.5">
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl border border-edge hover:bg-accent hover:text-white hover:border-accent hover:scale-105 flex items-center justify-center transition-all text-content-secondary"
                title="Facebook"
              >
                <Facebook size={16} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl border border-edge hover:bg-accent hover:text-white hover:border-accent hover:scale-105 flex items-center justify-center transition-all text-content-secondary"
                title="Instagram"
              >
                <Instagram size={16} />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl border border-edge hover:bg-accent hover:text-white hover:border-accent hover:scale-105 flex items-center justify-center transition-all text-content-secondary"
                title="LinkedIn"
              >
                <Linkedin size={16} />
              </a>
              <a 
                href="https://youtube.com" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl border border-edge hover:bg-accent hover:text-white hover:border-accent hover:scale-105 flex items-center justify-center transition-all text-content-secondary"
                title="YouTube"
              >
                <Youtube size={16} />
              </a>
              <a 
                href="https://wa.me/51900000000" 
                target="_blank" 
                rel="noreferrer" 
                className="w-9 h-9 rounded-xl border border-edge hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:scale-105 flex items-center justify-center transition-all text-content-secondary"
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
            © {new Date().getFullYear()} ChatPrex Cloud · Todos los derechos reservados.
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Gran Imagen Principal */}
                <div className="md:col-span-2 h-48 md:h-64 rounded-xl overflow-hidden border border-edge relative">
                  <img 
                    src={getImagesArray(selectedProperty)[activeImageIndex]} 
                    alt={selectedProperty.name} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute bottom-2.5 right-2.5 bg-black/75 px-2 py-0.5 text-white text-[10px] rounded-md font-bold">
                    Foto {activeImageIndex + 1} de {getImagesArray(selectedProperty).length}
                  </div>
                </div>

                {/* Miniaturas de Galería */}
                <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto md:max-h-64">
                  {getImagesArray(selectedProperty).map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-14 h-14 md:w-full md:h-[68px] rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${activeImageIndex === idx ? 'border-accent ring-2 ring-accent/20' : 'border-edge opacity-70 hover:opacity-100'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Ficha Técnica y Descripción */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-3 border-t border-edge">
                
                {/* Detalles / Ficha */}
                <div className="lg:col-span-2 space-y-2.5">
                  <h3 className="font-bold text-sm text-content">Ficha de la Propiedad</h3>
                  <p className="text-xs text-content-secondary leading-relaxed bg-surface-inset p-3 rounded-lg border border-edge">
                    {selectedProperty.details || selectedProperty.notes || 'No hay descripción adicional disponible para esta propiedad.'}
                  </p>

                  {/* Iconos de Características con colores diferenciados */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-2 rounded-lg border border-slate-500/20 bg-slate-500/5 text-center space-y-0.5">
                      <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Área Total</span>
                      <span className="text-xs font-extrabold text-content">{selectedProperty.area || '—'} m²</span>
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

                {/* Resumen de Compra y Botón de Acción */}
                <div className="p-4 rounded-xl border border-edge bg-surface-inset flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-content-muted uppercase tracking-wider block">Precio de Lista</span>
                    <span className="text-xl md:text-2xl font-black text-accent tracking-tight block">
                      {formatPrice(selectedProperty.price, selectedProperty.currency)}
                    </span>
                    <div className="space-y-1 pt-1.5 border-t border-edge/60">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-content-muted">Ubicación:</span>
                        <span className="font-semibold text-content truncate max-w-[120px]">{selectedProperty.location}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-content-muted">Tipo:</span>
                        <span className="font-semibold text-content capitalize">{selectedProperty.type}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-content-muted">Nivel:</span>
                        <span className="font-semibold text-content">{selectedProperty.floor || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleWhatsAppContact(selectedProperty)}
                    className="w-full btn-primary h-10 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] shadow-md shadow-emerald-500/10 text-white font-bold text-xs rounded-lg transition-all border-none cursor-pointer"
                  >
                    <Send size={14} />
                    <span>Contactar por WhatsApp</span>
                  </button>
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
