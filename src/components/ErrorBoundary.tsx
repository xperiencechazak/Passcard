import * as React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 text-white font-sans">
          <div className="max-w-md w-full bg-[#1A1A1A] p-10 rounded-[40px] border border-white/10 shadow-2xl text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 text-red-500 border border-red-500/20">
              <AlertCircle size={40} />
            </div>
            
            <h1 className="text-3xl font-bold mb-4 tracking-tight">Something went wrong</h1>
            <p className="text-white/50 mb-8 leading-relaxed">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-8 p-4 bg-black/40 rounded-2xl text-left overflow-auto max-h-40 border border-white/5">
                <code className="text-xs text-red-400 font-mono">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={this.handleReload}
                className="w-full bg-white text-black py-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-3"
              >
                <RefreshCw size={24} />
                <span>Reload Page</span>
              </button>
              
              <button
                onClick={this.handleReset}
                className="w-full bg-white/5 border border-white/10 text-white/50 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-white/10 hover:text-[#FFD700] transition-all flex items-center justify-center space-x-3 group"
              >
                <Home size={18} className="group-hover:scale-110 transition-transform" />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
