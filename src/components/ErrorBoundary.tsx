import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  err: Error | null;
}

/**
 * Top-level error boundary. Without this, any uncaught render error blanks
 * the whole tree (silent black screen). With this, we at least show a
 * cyber-styled error card with a reload button.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error, info: { componentStack: string }) {
    // Log to console for dev/debug (will surface in production browser console too)
    // eslint-disable-next-line no-console
    console.error('[CyberVPR ErrorBoundary]', err, info.componentStack);
  }

  reset = () => {
    this.setState({ err: null });
    window.location.reload();
  };

  hardReset = () => {
    try {
      localStorage.removeItem('cybervpr-2077');
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
    window.location.reload();
  };

  render() {
    if (this.state.err) {
      return (
        <div className="min-h-screen bg-nc-black text-nc-text font-mono p-6 flex items-center justify-center">
          <div className="max-w-xl w-full border-2 border-nc-magenta p-6" style={{ boxShadow: '0 0 24px rgba(255,0,60,0.4)' }}>
            <div className="font-display text-2xl text-nc-magenta tracking-widest mb-3">
              ⚠ NEURAL UPLINK LOST
            </div>
            <div className="text-sm text-nc-text/90 mb-4">
              UI compromised. Reroute via reload, choom.
            </div>
            <pre className="text-xs text-nc-cyan/70 overflow-x-auto bg-nc-black/60 p-3 border border-nc-cyan/20 mb-4 max-h-40">
              {this.state.err.message}
            </pre>
            <div className="flex gap-3 flex-wrap">
              <button onClick={this.reset} className="cyber-btn cyber-btn-yellow text-sm">
                ▶ RELOAD
              </button>
              <button onClick={this.hardReset} className="cyber-btn cyber-btn-magenta text-sm">
                ⟲ HARD RESET (wipes save)
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
