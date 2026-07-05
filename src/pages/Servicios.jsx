import '../styles/pages/Servicios.css';

function Servicios() {
  return (
    <div className="servicios-ayuda-container">
      <h1>Servicios y Preguntas Frecuentes (FAQ)</h1>
      <p className="descripcion">
        Encuentra aquí toda la información sobre nuestro proceso de reparación, 
        garantías y tiempos de entrega. Nuestro objetivo es la transparencia total.
      </p>

      {/* SECCIÓN DE PROCESO Y TIEMPOS */}
      <section className="proceso-y-tiempos">
        <h2>Guía Rápida del Servicio Técnico</h2>
        
        <h3>1. ¿Cómo solicito una reparación?</h3>
        <p>
          Puedes traer tu equipo directamente a nuestro local o <a href="/contacto">solicitar una recogida</a>. Simplemente cuéntanos el problema y te asignaremos un número de ticket.
        </p>

        <h3>2. ¿Cuánto tarda el diagnóstico y la reparación?</h3>
        <p>
          El <strong>diagnóstico inicial</strong> se completa en un plazo de <strong>24 a 48 horas</strong> hábiles. Una vez que apruebas el presupuesto, la reparación generalmente toma entre <strong>1 a 5 días</strong>, dependiendo de la complejidad y la disponibilidad de repuestos.
        </p>
      </section>

      {/* SECCIÓN DE COSTOS Y GARANTÍA */}
      <section className="costos-y-garantia">
        <h2>Costos y Confianza</h2>
        
        <h3>¿Cuál es el costo del diagnóstico?</h3>
        <p>
          El diagnóstico y el presupuesto detallado son <strong>GRATIS</strong> si decides realizar la reparación con nosotros. En caso de no aceptar el presupuesto, se cobra una tarifa mínima de X por el tiempo invertido en la revisión.
        </p>

        <h3>¿Qué garantía tienen las reparaciones?</h3>
        <p>
          Ofrecemos <strong>90 días de garantía total</strong> sobre las piezas reemplazadas y la mano de obra relacionada con el servicio. Si el mismo problema regresa dentro de ese período, la revisamos sin costo.
        </p>
        
        <h3>¿Venden repuestos originales?</h3>
        <p>
          Priorizamos el uso de <strong>repuestos originales</strong>. Si no están disponibles, utilizamos repuestos de calidad premium que cumplen o superan las especificaciones del fabricante, siempre informándote antes.
        </p>
      </section>
      
      {/* INFORMACIÓN DE CONTACTO Y HORARIOS */}
      <div className="contacto-info-corta">
        
        
        <div className="horarios-container">
          <h3>📅 Horario de atención al cliente</h3>
          <ul>
            <li>🕘 Lunes a Viernes: <span>9:00 – 18:00 hrs</span></li>
            <li>🕘 Sábados: <span>9:00 – 13:00 hrs</span></li>
            <li>❌ Domingos y feriados: <span>Cerrado</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Servicios;
