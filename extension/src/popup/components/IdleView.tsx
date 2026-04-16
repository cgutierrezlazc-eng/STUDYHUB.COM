import { HelpTrigger } from './HelpOverlay';

interface Props {
  onLogout: () => void;
}

export function IdleView({ onLogout }: Props) {
  return (
    <div className="idle-body">
      <div className="idle-icon">🎓</div>
      <h3 className="idle-title">Navega a tu campus virtual</h3>
      <p className="idle-desc">
        Abre la pagina de tu universidad y Conniku detectara tu plataforma automaticamente.
      </p>

      <div className="supported-list">
        <span className="supported-tag">Moodle</span>
        <span className="supported-tag">Canvas</span>
        <span className="supported-tag">Blackboard</span>
        <span className="supported-tag">Brightspace</span>
        <span className="supported-tag">Sakai</span>
      </div>

      <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 16 }}>
        <HelpTrigger helpKey="detection" />
        <HelpTrigger helpKey="platforms" label="Plataformas" />
        <HelpTrigger helpKey="privacy" label="Privacidad" />
      </div>

      <button className="btn-link-danger" onClick={onLogout} style={{ marginTop: 16 }}>
        Cerrar sesion
      </button>
    </div>
  );
}
