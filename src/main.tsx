import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught application error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 text-white p-6 font-sans">
          <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-2xl font-black">
              ⚠️
            </div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              GMAO STHIC SERVICES
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Une petite anomalie d'affichage est survenue. Cliquez sur le bouton ci-dessous pour relancer l'application en toute sécurité.
            </p>
            <div className="pt-2 space-y-3">
              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl transition-all shadow-lg text-sm cursor-pointer"
              >
                🔄 Recharger l'Application
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold rounded-xl transition-all text-xs cursor-pointer"
              >
                🧹 Réinitialiser le Cache Local
              </button>
            </div>
            {this.state.error && (
              <p className="text-[10px] text-slate-500 font-mono overflow-auto max-h-20 text-left bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                {this.state.error.message}
              </p>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

