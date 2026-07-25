import React, { useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
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
            <FileText size={24} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-content">Términos de Servicio</h1>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-content-secondary">
          <p>
            Bienvenido a <strong className="text-content font-bold">Casaya / ChatPrex</strong>. Al acceder y utilizar nuestro portal inmobiliario y nuestras herramientas CRM, usted acepta estar sujeto a los siguientes términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.
          </p>

          <h2 className="text-xl font-bold text-content mt-10 mb-4 border-b border-edge pb-2">1. Uso del Servicio</h2>
          <p>Nuestra plataforma proporciona herramientas de gestión de clientes potenciales (leads), automatización de marketing inmobiliario y listados de propiedades. Usted acepta usar estos servicios solo para fines legales y de acuerdo con todas las normativas locales e internacionales aplicables.</p>
          <ul className="list-disc pl-6 space-y-2 marker:text-accent">
            <li>No utilizará el servicio para enviar spam o mensajes no solicitados.</li>
            <li>No interferirá con la seguridad ni el correcto funcionamiento de la plataforma.</li>
            <li>Es responsable de mantener la confidencialidad de sus credenciales de acceso.</li>
          </ul>

          <h2 className="text-xl font-bold text-content mt-10 mb-4 border-b border-edge pb-2">2. Contenido del Usuario e Inmuebles</h2>
          <p>Como agente o agencia inmobiliaria, usted puede publicar contenido, incluyendo fotos y detalles de propiedades. Al hacerlo:</p>
          <ul className="list-disc pl-6 space-y-2 marker:text-accent">
            <li>Usted declara que tiene los derechos legales para publicar dicha información.</li>
            <li>Concede a Casaya / ChatPrex una licencia para mostrar, distribuir y promover dichas publicaciones dentro de la plataforma.</li>
            <li>Acepta que nos reservamos el derecho de eliminar contenido que se considere fraudulento, engañoso o que viole nuestras políticas.</li>
          </ul>

          <h2 className="text-xl font-bold text-content mt-10 mb-4 border-b border-edge pb-2">3. Uso de la API de Meta y WhatsApp</h2>
          <p>
            Nuestros servicios de mensajería automatizada dependen de las integraciones con Meta (WhatsApp). Usted se compromete a cumplir plenamente con las Políticas de Comercio y de Mensajería de WhatsApp. 
            Cualquier suspensión de su línea de WhatsApp por parte de Meta debido al incumplimiento de sus políticas (ej. exceso de quejas, mensajes prohibidos) es su responsabilidad y no compromete a Casaya / ChatPrex.
          </p>

          <h2 className="text-xl font-bold text-content mt-10 mb-4 border-b border-edge pb-2">4. Planes, Pagos y Suscripciones</h2>
          <p>
            El uso de ciertas funcionalidades premium del CRM y las integraciones requieren de una suscripción activa. Los pagos no son reembolsables, excepto en los casos en que la ley lo exija. Nos reservamos el derecho de modificar nuestras tarifas, notificándole con anticipación.
          </p>

          <h2 className="text-xl font-bold text-content mt-10 mb-4 border-b border-edge pb-2">5. Limitación de Responsabilidad</h2>
          <p>
            En la máxima medida permitida por la ley aplicable, Casaya / ChatPrex no será responsable por daños indirectos, incidentales o consecuentes que resulten del uso o la incapacidad de usar nuestros servicios, ni por problemas derivados de plataformas de terceros como Meta.
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
