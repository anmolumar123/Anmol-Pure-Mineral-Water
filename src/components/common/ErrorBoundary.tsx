import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Unhandled UI error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('water_staff_token');
      localStorage.removeItem('water_customer_token');
      localStorage.removeItem('water_customer_session');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700/80 rounded-2xl p-6 sm:p-8 text-center shadow-2xl">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-6">
              An unexpected error occurred while rendering the application. You can reload the page or reset cached session data to restore normal operation.
            </p>
            {this.state.error?.message && (
              <div className="p-3 bg-slate-900/80 rounded-xl text-xs text-rose-400 font-mono text-left mb-6 break-words border border-slate-700/50">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Reset & Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
