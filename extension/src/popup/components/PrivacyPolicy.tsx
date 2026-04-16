// ═══════════════════════════════════════════════════════════════
// POLITICA DE PRIVACIDAD — Accesible dentro de la extension
// Cumple: GDPR Art. 13/14, Ley 19.628 Chile, Chrome Web Store
// ═══════════════════════════════════════════════════════════════

import { useEffect } from 'react';

interface Props {
  onClose: () => void;
}

export function PrivacyPolicy({ onClose }: Props) {
  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="help-overlay" onClick={onClose} role="presentation">
      <div
        className="help-modal"
        style={{ maxHeight: '90vh', maxWidth: '360px' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
      >
        <div className="help-modal-header">
          <span className="help-modal-icon">🔒</span>
          <h3 className="help-modal-title" id="privacy-title">Politica de Privacidad</h3>
          <button className="help-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="help-modal-body" style={{ fontSize: '11px', lineHeight: 1.7 }}>
          <p className="help-paragraph"><strong>Ultima actualizacion:</strong> 15 de abril de 2026</p>

          <p className="help-paragraph"><strong>1. Responsable del tratamiento</strong></p>
          <p className="help-paragraph">
            Conniku SpA, RUT 78.395.702-7, domiciliada en Chile.
            Contacto: contacto@conniku.com
          </p>

          <p className="help-paragraph"><strong>2. Datos que recopilamos</strong></p>
          <p className="help-paragraph">
            Al usar la extension Conniku, recopilamos exclusivamente datos academicos
            de tu plataforma universitaria:
          </p>
          <p className="help-paragraph">
            - Nombres y fechas de tus asignaturas inscritas<br/>
            - Metadatos de documentos de curso (nombres, tamanos, fechas)<br/>
            - Eventos del calendario academico (examenes, entregas, clases)<br/>
            - Calificaciones publicadas por la universidad<br/>
            - URL e identificador de tu plataforma universitaria
          </p>

          <p className="help-paragraph"><strong>3. Datos que NO recopilamos</strong></p>
          <p className="help-paragraph">
            - Tu contrasena universitaria (nunca la vemos ni almacenamos)<br/>
            - Cookies o tokens de sesion de tu navegador<br/>
            - Datos de otros sitios web que visitas<br/>
            - Tu historial de navegacion<br/>
            - Informacion personal mas alla de tu ID academico
          </p>

          <p className="help-paragraph"><strong>4. Como recopilamos los datos</strong></p>
          <p className="help-paragraph">
            La extension utiliza la sesion activa de tu navegador para consultar la
            interfaz interna de tu plataforma universitaria. Funciona igual que cuando
            tu navegas tu campus virtual — solo que automatiza la lectura de datos
            que ya son visibles para ti.
          </p>

          <p className="help-paragraph"><strong>5. Finalidad del tratamiento</strong></p>
          <p className="help-paragraph">
            Sincronizar tus datos academicos con tu cuenta en conniku.com para
            organizar tu estudio, gestionar documentos, seguir tu calendario y
            monitorear tus calificaciones.
          </p>

          <p className="help-paragraph"><strong>6. Base legal</strong></p>
          <p className="help-paragraph">
            Consentimiento explicito del usuario (GDPR Art. 6(1)(a); Ley 19.628 Art. 4 Chile).
            Puedes retirar tu consentimiento en cualquier momento.
          </p>

          <p className="help-paragraph"><strong>7. Transmision de datos</strong></p>
          <p className="help-paragraph">
            Todos los datos se transmiten cifrados mediante HTTPS a servidores
            alojados en Render (infraestructura en Estados Unidos). Para
            transferencias internacionales aplicamos las garantias adecuadas
            segun la normativa vigente.
          </p>

          <p className="help-paragraph"><strong>8. Retencion de datos</strong></p>
          <p className="help-paragraph">
            Tus datos se mantienen mientras tu cuenta este activa. Al eliminar tu
            cuenta o desconectar tu campus virtual, tus datos se eliminan en un
            plazo maximo de 30 dias.
          </p>

          <p className="help-paragraph"><strong>9. Tus derechos</strong></p>
          <p className="help-paragraph">
            Tienes derecho a acceder, rectificar, eliminar y portar tus datos
            personales. Para ejercer estos derechos, escribe a contacto@conniku.com.
            Responderemos en un plazo maximo de 2 dias habiles (Ley 19.628 Art. 12).
          </p>

          <p className="help-paragraph"><strong>10. Cookies</strong></p>
          <p className="help-paragraph">
            La extension utiliza las cookies de sesion de tu navegador unicamente
            para comunicarse con tu plataforma universitaria (igual que cuando
            navegas tu campus manualmente). Conniku nunca copia, almacena ni
            transmite tus cookies a servidores de Conniku.
          </p>

          <p className="help-paragraph"><strong>11. Menores de edad</strong></p>
          <p className="help-paragraph">
            Conniku esta dirigido a estudiantes universitarios. Si eres menor de 18
            anos, necesitas autorizacion de tu representante legal.
          </p>

          <p className="help-paragraph"><strong>12. Cambios a esta politica</strong></p>
          <p className="help-paragraph">
            Te notificaremos de cambios significativos mediante la extension y por
            email. Si los cambios afectan el tratamiento de tus datos, te
            solicitaremos nuevo consentimiento.
          </p>

          <p className="help-paragraph"><strong>13. Contacto</strong></p>
          <p className="help-paragraph">
            Conniku SpA — contacto@conniku.com — conniku.com/privacidad
          </p>
        </div>
      </div>
    </div>
  );
}
