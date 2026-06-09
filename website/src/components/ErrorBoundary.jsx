import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-earth-dark flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card p-8 rounded-3xl max-w-md w-full">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Something went wrong</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm">
              We encountered an unexpected error while loading this page. Please check your internet connection and try again.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-mustard-500 hover:bg-mustard-600 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCcw className="w-5 h-5" /> Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
