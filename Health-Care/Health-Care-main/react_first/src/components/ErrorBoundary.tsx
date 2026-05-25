import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "./ui/button";

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.fallback) {
        return this.fallback;
      }

      return (
        <div className="min-h-[400px] w-full flex flex-col items-center justify-center p-8 text-center bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
          <div className="h-20 w-20 bg-red-50 rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-slate-500 font-bold text-sm max-w-md mb-8">
            We encountered an error while rendering this component. Our team has been notified.
          </p>
          <div className="flex gap-4">
            <Button 
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-slate-900 text-white font-black px-6 gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Page
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="rounded-2xl border-slate-200 text-slate-600 font-black px-6 gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-8 p-4 bg-slate-50 rounded-2xl text-[10px] text-red-400 font-mono text-left overflow-auto max-w-full">
              {this.state.error?.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
