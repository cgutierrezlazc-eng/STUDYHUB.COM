import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="popup-body error-body">
          <div className="error-icon" aria-hidden="true">⚠</div>
          <h3 className="error-title">Error inesperado</h3>
          <p className="error-message">{this.state.error || 'Ocurrio un error al cargar la extension.'}</p>
          <button
            className="btn-primary"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
