import { StrictMode, Component, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './lib/auth.tsx';
import { ToastProvider } from './components/Toast.tsx';
import { isSupabaseConfigured } from './lib/supabase.ts';
import './index.css';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0f172a', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: 24,
        }}>
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
              Une erreur est survenue
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
              {this.state.error.message}
            </p>
            <p style={{ color: '#64748b', fontSize: 12 }}>
              Consultez la console du navigateur (F12) pour plus de détails.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ConfigMissing() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0f172a', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: 24,
    }}>
      <div style={{ maxWidth: 520, textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
          Configuration manquante
        </h1>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16, lineHeight: 1.6 }}>
          Les variables <code>VITE_SUPABASE_URL</code> et <code>VITE_SUPABASE_ANON_KEY</code> ne sont pas définies.
          Ajoutez-les dans un fichier <code>.env</code> en local, ou dans les paramètres
          « Environment variables » de votre site sur Netlify, puis redéployez.
        </p>
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {isSupabaseConfigured ? (
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      ) : (
        <ConfigMissing />
      )}
    </ErrorBoundary>
  </StrictMode>
);
