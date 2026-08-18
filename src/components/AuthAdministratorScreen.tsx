import { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Lock, ArrowRight, AlertCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { loginAdmin, navigateToUser } from '@/lib/adminAuth';

interface Props {
  onSuccess: () => void;
  onBackToUser?: () => void;
}

export default function AuthAdministratorScreen({ onSuccess, onBackToUser }: Props) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Veuillez saisir le mot de passe administrateur.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const ok = loginAdmin(password);
      setLoading(false);
      if (ok) {
        onSuccess();
      } else {
        setError('Mot de passe administrateur incorrect.');
        setPassword('');
        inputRef.current?.focus();
      }
    }, 200);
  };

  const handleReturn = () => {
    if (onBackToUser) {
      onBackToUser();
    } else {
      navigateToUser();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-8 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-amber-500/5 blur-2xl" />
      </div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md animate-scale-in my-auto">
        {/* Logo / Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-500 text-slate-900 mb-3 sm:mb-4 shadow-lg shadow-amber-500/30">
            <ShieldCheck size={32} strokeWidth={2.2} />
          </div>
          <div className="inline-block px-3 py-0.5 mb-2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
            Accès Réservé
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Espace Administrateur</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Gestion et configuration des modèles d'actes juridiques OHADA
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                Mot de passe Administrateur
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={inputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe d'administration"
                  className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                  title={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl animate-fade-in-fast">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Déverrouiller l'administration</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center">
            <button
              type="button"
              onClick={handleReturn}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors p-1"
            >
              <ArrowLeft size={14} />
              <span>Retour au portail utilisateur</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500 text-center mt-5 leading-relaxed px-4">
          Cette zone est strictement réservée aux administrateurs autorisés.
        </p>
      </div>
    </div>
  );
}
