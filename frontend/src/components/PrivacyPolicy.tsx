import React, { useEffect } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-surface-base text-content font-sans">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2 text-content-secondary hover:text-accent transition-colors mb-8 text-sm font-bold"
        >
          <ArrowLeft size={16} /> Volver al inicio
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <Shield size={24} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-content">Políticas de Privacidad</h1>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-content-secondary">
          <p>
            En <strong className="text-content font-bold">Casaya / ChatPrex</strong>, valoramos su privacidad y nos comprometemos a proteger sus datos personales. 
            Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y compartimos su información cuando utiliza nuestra plataforma de gestión inmobiliaria y CRM.
          </p>

          <h2 className="text-xl font-bold text-content mt-10 mb-4 border-b border-edge pb-2">1. Información que recopilamos</h2>
          <p>Podemos recopilar los siguientes tipos de información:</p>
          <ul className="list-disc pl-6 space-y-2 marker:text-accent">
            <li><strong className="text-content font-bold">Información de contacto:</strong> Nombre, dirección de correo electrónico, número de teléfono (incluyendo WhatsApp).</li>
            <li><strong className="text-content font-bold">Datos de uso:</strong> Información sobre cómo interactúa con nuestra plataforma, direcciones IP, tipo de navegador y páginas visitadas.</li>
            <li><strong className="text-content font-bold">Datos inmobiliarios:</strong> Información sobre propiedades, preferencias de búsqueda e historial de interacciones con clientes y agentes.</li>
          </ul>

          <h2 className="text-xl font-bold text-content mt-10 mb-4 border-b border-edge pb-2">2. Uso de la información</h2>
          <p>Utilizamos la información recopilada para:</p>
          <ul className="list-disc pl-6 space-y-2 marker:text-accent">
            <li>Proporcionar y mantener nuestro servicio de CRM y portal inmobiliario.</li>
            <li>Procesar interacciones automatizadas a través de WhatsApp y Meta API.</li>
            <li>Mejorar la experiencia del usuario y desarrollar nuevas funcionalidades.</li>
            <li>Enviar notificaciones importantes, actualizaciones y comunicaciones relevantes (con su consentimiento previo).</li>
          </ul>

          <h2 className="text-xl font-bold text-content mt-10 mb-4 border-b border-edge pb-2">3. Protección de datos y Meta API</h2>
          <p>
            Al utilizar nuestra integración con WhatsApp, nos adherimos estrictamente a las políticas de datos de Meta. 
            No compartimos ni vendemos los datos de sus clientes (leads) a terceros. Toda la comunicación está cifrada de extremo a extremo según los estándares de WhatsApp Business API y nuestros servidores cuentan con las más altas medidas de seguridad en la nube.
          </p>

          <h2 className="text-xl font-bold text-content mt-10 mb-4 border-b border-edge pb-2">4. Sus derechos</h2>
          <p>Usted tiene derecho a:</p>
          <ul className="list-disc pl-6 space-y-2 marker:text-accent">
            <li>Acceder, actualizar o eliminar su información personal de nuestras bases de datos.</li>
            <li>Retirar su consentimiento para comunicaciones en cualquier momento.</li>
            <li>Solicitar una copia electrónica de los datos que tenemos sobre usted.</li>
          </ul>

          <h2 className="text-xl font-bold text-content mt-10 mb-4 border-b border-edge pb-2">5. Contacto</h2>
          <p>
            Si tiene alguna pregunta sobre esta Política de Privacidad o sobre cómo manejamos sus datos, por favor contáctenos a través de nuestro soporte técnico en la plataforma o a través de nuestros canales oficiales de atención por WhatsApp.
          </p>
          
          <div className="pt-8 mt-12 border-t border-edge">
            <p className="text-xs text-content-muted font-medium">
              Última actualización: {new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
