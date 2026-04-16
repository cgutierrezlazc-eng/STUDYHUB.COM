interface Props {
  error?: string;
  onRetry: () => void;
}

export function ErrorView({ error, onRetry }: Props) {
  return (
    <div className="popup-body error-body">
      <div className="error-icon">⚠</div>
      <h3 className="error-title">Error de sincronizacion</h3>
      <p className="error-message">{error || 'Ocurrio un error inesperado'}</p>

      <button className="btn-primary" onClick={onRetry}>
        Reintentar
      </button>
      <button
        className="btn-secondary"
        onClick={() => chrome.tabs.create({ url: 'https://conniku.com/soporte' })}
      >
        Contactar soporte
      </button>
    </div>
  );
}
