import { useState, useEffect, useCallback } from 'react';
import { Scale, LayoutDashboard, FileText, ShieldCheck, History, Plus, LogOut, ArrowUpRight } from 'lucide-react';
import type { DocumentTemplate, GeneratedDocument, AuditLog, TemplateFavorite } from '@/lib/types';
import { fetchTemplates, fetchDocuments, fetchAuditLogs, fetchFavorites, duplicateDocument } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import { isAdminAuthenticated, isAdminRoute, logoutAdmin, navigateToUser, navigateToAdmin } from '@/lib/adminAuth';
import { useToast } from '@/components/Toast';
import AuthScreen from '@/components/AuthScreen';
import AuthAdministratorScreen from '@/components/AuthAdministratorScreen';
import Dashboard from '@/components/Dashboard';
import TemplateCatalog from '@/components/TemplateCatalog';
import Generator from '@/components/Generator';
import DocumentList from '@/components/DocumentList';
import DocumentViewer from '@/components/DocumentViewer';
import AdminPanel from '@/components/AdminPanel';
import HistoryPanel from '@/components/HistoryPanel';

type View =
  | { name: 'dashboard' }
  | { name: 'catalog' }
  | { name: 'generate'; template: DocumentTemplate }
  | { name: 'documents' }
  | { name: 'view'; document: GeneratedDocument }
  | { name: 'admin' }
  | { name: 'history' };

const USER_NAV_ITEMS: { id: string; label: string; icon: typeof Scale; view: View }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, view: { name: 'dashboard' } },
  { id: 'catalog', label: 'Modèles', icon: FileText, view: { name: 'catalog' } },
  { id: 'documents', label: 'Mes documents', icon: FileText, view: { name: 'documents' } },
];

const ADMIN_NAV_ITEMS: { id: string; label: string; icon: typeof Scale; view: View }[] = [
  { id: 'admin', label: 'Gestion des modèles', icon: ShieldCheck, view: { name: 'admin' } },
  { id: 'catalog', label: 'Catalogue public', icon: FileText, view: { name: 'catalog' } },
  { id: 'history', label: "Journal d'audit", icon: History, view: { name: 'history' } },
];

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();

  const [inAdminMode, setInAdminMode] = useState<boolean>(() => isAdminRoute());
  const [adminLoggedIn, setAdminLoggedIn] = useState<boolean>(() => isAdminAuthenticated());

  const [view, setView] = useState<View>(() => (isAdminRoute() ? { name: 'admin' } : { name: 'dashboard' }));
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [favorites, setFavorites] = useState<TemplateFavorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize hash with admin mode
  useEffect(() => {
    const handleHashChange = () => {
      const isAdm = isAdminRoute();
      setInAdminMode(isAdm);
      if (isAdm) {
        setView({ name: 'admin' });
        setAdminLoggedIn(isAdminAuthenticated());
      } else {
        setView({ name: 'dashboard' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (inAdminMode) {
        const [t, a] = await Promise.all([
          fetchTemplates(),
          fetchAuditLogs(50),
        ]);
        setTemplates(t);
        setAuditLogs(a);
      } else {
        const [t, d, a, f] = await Promise.all([
          fetchTemplates(),
          fetchDocuments(),
          fetchAuditLogs(50),
          fetchFavorites(),
        ]);
        setTemplates(t);
        setDocuments(d);
        setAuditLogs(a);
        setFavorites(f);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [inAdminMode]);

  useEffect(() => {
    if (inAdminMode) {
      if (adminLoggedIn) {
        refreshAll();
      }
    } else {
      if (user) {
        refreshAll();
      }
    }
  }, [inAdminMode, adminLoggedIn, user, refreshAll]);

  // Loading state while checking auth
  if (authLoading && !inAdminMode) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Admin Flow: if on #admin route
  if (inAdminMode) {
    if (!adminLoggedIn) {
      return (
        <AuthAdministratorScreen
          onSuccess={() => {
            setAdminLoggedIn(true);
            setView({ name: 'admin' });
            refreshAll();
          }}
          onBackToUser={() => {
            navigateToUser();
            setInAdminMode(false);
            setView({ name: 'dashboard' });
          }}
        />
      );
    }
  } else {
    // Normal User Flow: require standard login
    if (!user) {
      return <AuthScreen />;
    }
  }

  const go = (v: View) => {
    setView(v);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicate = async (doc: GeneratedDocument) => {
    try {
      await duplicateDocument(doc);
      toast('Document dupliqué avec succès', 'success');
      await refreshAll();
    } catch {
      toast('Erreur lors de la duplication', 'error');
    }
  };

  const handleAdminLogout = () => {
    logoutAdmin();
    setAdminLoggedIn(false);
    toast('Session administrateur fermée', 'info');
  };

  const navItems = inAdminMode ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS;

  const activeNav =
    view.name === 'generate' || view.name === 'view'
      ? view.name === 'view' ? 'documents' : 'catalog'
      : view.name;

  const userInitial = inAdminMode ? 'A' : (user?.email?.[0]?.toUpperCase() ?? '?');
  const userDisplayLabel = inAdminMode ? 'Administrateur' : (user?.email ?? 'Utilisateur');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-slate-200 fixed inset-y-0 left-0 border-r border-slate-800">
        <div className="px-6 py-6 flex items-center gap-3 border-b border-slate-700/60">
          <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-slate-900 shrink-0">
            {inAdminMode ? <ShieldCheck size={22} strokeWidth={2.2} /> : <Scale size={22} strokeWidth={2.2} />}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-white flex items-center gap-1.5">
              OHADA Doc
              {inAdminMode && (
                <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono uppercase">
                  Admin
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400">
              {inAdminMode ? 'Console Administration' : 'Générateur juridique'}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => go(item.view)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-amber-500 text-slate-900 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User / Admin Card */}
        <div className="px-3 py-3 border-t border-slate-700/60">
          {inAdminMode ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300">
                <ShieldCheck size={18} className="text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate">Session Admin Active</div>
                </div>
                <button
                  onClick={handleAdminLogout}
                  className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors"
                  title="Fermer la session administrateur"
                >
                  <LogOut size={16} />
                </button>
              </div>

              <button
                onClick={() => {
                  navigateToUser();
                  setInAdminMode(false);
                  setView({ name: 'dashboard' });
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <span>Accès Espace Client</span>
                <ArrowUpRight size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-semibold shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-slate-300 truncate">{userDisplayLabel}</div>
              </div>
              <button
                onClick={signOut}
                className="text-slate-400 hover:text-red-400 p-1 rounded transition-colors"
                title="Déconnexion"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          <div className="mt-3 rounded-lg bg-slate-800/40 p-3 text-[11px] leading-relaxed text-slate-400">
            {inAdminMode
              ? 'Toute modification des modèles affecte les générations futures.'
              : "Les documents générés ne remplacent pas le contrôle d'un juriste."}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-slate-900 border-t border-slate-700/60 px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => go(item.view)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                active ? 'text-amber-400' : 'text-slate-400'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium leading-none">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-20 bg-slate-900 text-white px-4 py-3 flex items-center gap-2">
        <div className="w-8 h-8 rounded bg-amber-500 flex items-center justify-center text-slate-900 shrink-0">
          {inAdminMode ? <ShieldCheck size={16} /> : <Scale size={16} />}
        </div>
        <span className="font-bold text-sm whitespace-nowrap">
          OHADA Doc {inAdminMode && <span className="text-amber-400 text-xs font-normal">(Admin)</span>}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {inAdminMode ? (
            <button
              onClick={handleAdminLogout}
              className="text-slate-300 hover:text-red-400 p-1"
              title="Fermer la session"
            >
              <LogOut size={16} />
            </button>
          ) : (
            <button onClick={signOut} className="text-slate-300 hover:text-red-400 p-1" title="Déconnexion">
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 pb-16 md:pb-0 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading && (
            <div className="flex items-center justify-center py-24 text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          )}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-6">
              {error}
            </div>
          )}
          {!loading && !error && (
            <>
              {view.name === 'dashboard' && !inAdminMode && (
                <Dashboard
                  templates={templates}
                  documents={documents}
                  auditLogs={auditLogs}
                  favorites={favorites}
                  onNewDocument={() => go({ name: 'catalog' })}
                  onOpenDoc={(d) => go({ name: 'view', document: d })}
                  onSelectTemplate={(t) => go({ name: 'generate', template: t })}
                  onFilterCategory={() => go({ name: 'catalog' })}
                />
              )}
              {view.name === 'catalog' && (
                <TemplateCatalog
                  templates={templates}
                  onSelect={(t) => go({ name: 'generate', template: t })}
                />
              )}
              {view.name === 'generate' && (
                <Generator
                  template={view.template}
                  onSaved={(d) => {
                    refreshAll();
                    go({ name: 'view', document: d });
                  }}
                  onCancel={() => go({ name: inAdminMode ? 'admin' : 'catalog' })}
                />
              )}
              {view.name === 'documents' && !inAdminMode && (
                <DocumentList
                  documents={documents}
                  templates={templates}
                  onOpen={(d) => go({ name: 'view', document: d })}
                  onRefresh={refreshAll}
                  onDuplicate={handleDuplicate}
                />
              )}
              {view.name === 'view' && (
                <DocumentViewer
                  document={view.document}
                  templates={templates}
                  onBack={() => go({ name: inAdminMode ? 'catalog' : 'documents' })}
                  onRefresh={refreshAll}
                  onDuplicate={handleDuplicate}
                />
              )}
              {view.name === 'admin' && inAdminMode && (
                <AdminPanel templates={templates} onRefresh={refreshAll} />
              )}
              {view.name === 'history' && inAdminMode && <HistoryPanel logs={auditLogs} />}
            </>
          )}
        </div>
      </main>

      {/* Floating CTA for user dashboard */}
      {view.name === 'dashboard' && !inAdminMode && !loading && (
        <button
          onClick={() => go({ name: 'catalog' })}
          className="fixed bottom-6 right-6 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-full px-5 py-3 shadow-lg flex items-center gap-2 transition-colors z-10"
        >
          <Plus size={18} />
          Nouveau document
        </button>
      )}
    </div>
  );
}
