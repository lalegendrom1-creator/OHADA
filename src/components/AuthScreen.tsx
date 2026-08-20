import { useState, useRef, useEffect } from 'react';
import {
  Scale, Mail, Lock, ArrowRight, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck,
  FileText, Globe, CheckCircle, Zap, BookOpen, Users, Star, Gavel,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

/* ─── App data highlights ─────────────────────────────────────── */
const CATEGORIES = [
  { label: 'Constitution', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', desc: 'Actes de création de sociétés' },
  { label: 'Fonctionnement', color: 'bg-sky-100 text-sky-700 border-sky-200', desc: 'Gestion et gouvernance' },
  { label: 'Contrats', color: 'bg-amber-100 text-amber-700 border-amber-200', desc: 'Contrats commerciaux' },
  { label: 'Lettres', color: 'bg-rose-100 text-rose-700 border-rose-200', desc: 'Correspondance juridique' },
  { label: 'Résolutions', color: 'bg-violet-100 text-violet-700 border-violet-200', desc: "Décisions d'assemblées" },
];

const FEATURES = [
  { icon: Zap, text: 'Génération automatique de documents' },
  { icon: ShieldCheck, text: 'Conformité OHADA vérifiée' },
  { icon: BookOpen, text: 'Références légales intégrées' },
  { icon: Star, text: 'Modèles favoris & historique' },
  { icon: FileText, text: 'Export PDF & Word' },
  { icon: Globe, text: '17 pays de la zone OHADA' },
];

const STATS = [
  { value: '5', label: 'Catégories', icon: Gavel },
  { value: '17', label: 'Pays couverts', icon: Globe },
  { value: '100%', label: 'Conforme OHADA', icon: CheckCircle },
  { value: '∞', label: 'Documents', icon: FileText },
];

const COUNTRIES_PREVIEW = [
  "Cameroun", "Côte d'Ivoire", 'Sénégal', 'Gabon', 'Mali',
  'Burkina Faso', 'Bénin', 'Togo', 'Niger', 'Tchad',
  'Congo', 'RD Congo', 'Guinée', 'Comores', '+3 pays',
];

/* ─────────────────────────────────────────────────────────────── */

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validate = (): string | null => {
    if (!email || !password) return 'Veuillez renseigner tous les champs.';
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) return 'Adresse email invalide.';
    if (password.length < 6) return 'Le mot de passe doit contenir au moins 6 caractères.';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    const result = mode === 'signin' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (mode === 'signup') {
      setSuccess('Compte créé. Vous êtes connecté.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-stretch relative overflow-hidden">
      {/* Global decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 right-1/3 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-amber-500/6 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-sky-500/5 blur-2xl -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* ── LEFT PANEL: App info (hidden on mobile) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] xl:w-[58%] relative px-12 xl:px-16 py-12 border-r border-slate-800/80">

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-900 shadow-lg shadow-amber-500/20">
            <Scale size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">OHADA Doc</h1>
            <p className="text-slate-400 text-xs">Générateur juridique professionnel</p>
          </div>
        </div>

        {/* Hero text */}
        <div className="mt-10 mb-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <Gavel size={13} />
            Plateforme juridique OHADA
          </div>
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight max-w-md">
            Créez des documents juridiques{' '}
            <span className="text-amber-400">conformes OHADA</span>{' '}
            en quelques minutes
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mt-4 max-w-md">
            Accédez à une bibliothèque de modèles d'actes juridiques validés,
            adaptés aux législations des 17 pays de l'espace OHADA. Remplissez
            les variables, générez et exportez instantanément.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-center backdrop-blur-sm">
              <Icon size={16} className="text-amber-400 mx-auto mb-1.5" />
              <div className="text-white font-bold text-lg leading-none">{value}</div>
              <div className="text-slate-400 text-[10px] mt-1 leading-tight">{label}</div>
            </div>
          ))}
        </div>

        {/* Document categories */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} className="text-amber-400" />
            <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Catégories de documents</span>
          </div>
          <div className="space-y-2">
            {CATEGORIES.map(({ label, color, desc }) => (
              <div
                key={label}
                className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/40 rounded-xl px-4 py-2.5 hover:border-slate-600 transition-colors"
              >
                <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${color}`}>
                  {label}
                </span>
                <span className="text-slate-400 text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={14} className="text-amber-400" />
            <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Fonctionnalités</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-slate-400 text-xs">
                <Icon size={13} className="text-amber-400 shrink-0" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Countries */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Globe size={14} className="text-amber-400" />
            <span className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Pays de l'espace OHADA</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COUNTRIES_PREVIEW.map((c) => (
              <span
                key={c}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300"
              >
                {c}
              </span>
            ))}
          </div>
        </div>

        {/* Trust footer */}
        <div className="flex items-center gap-3 mt-auto pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck size={13} className="text-emerald-500" />
            Documents privés & sécurisés
          </div>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Users size={13} className="text-sky-500" />
            Accès multi-utilisateurs
          </div>
          <span className="text-slate-700">·</span>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Scale size={13} className="text-amber-500" />
            Conformité juridique OHADA
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Login form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-8 py-10 relative">

        {/* Mobile brand header */}
        <div className="lg:hidden text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500 text-slate-900 mb-3 shadow-lg shadow-amber-500/20">
            <Scale size={28} strokeWidth={2.2} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">OHADA Doc</h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">Générateur de documents juridiques conformes</p>

          {/* Mobile mini stats */}
          <div className="flex items-center justify-center gap-4 mt-4">
            {STATS.slice(0, 3).map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-amber-400 font-bold text-base leading-none">{value}</div>
                <div className="text-slate-500 text-[10px] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-sm animate-scale-in">
          {/* Desktop welcome text */}
          <div className="hidden lg:block text-center mb-6">
            <p className="text-slate-300 text-base font-semibold">Bienvenue</p>
            <p className="text-slate-500 text-sm mt-0.5">Connectez-vous pour accéder à vos documents</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/10">
            {/* Tabs */}
            <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => { setMode('signin'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'signin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Connexion
              </button>
              <button
                onClick={() => { setMode('signup'); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  mode === 'signup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Inscription
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Adresse email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={emailRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-sm"
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

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl animate-fade-in-fast">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="text-xs sm:text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2.5 rounded-xl animate-fade-in-fast">
                  {success}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-bold text-sm transition-all shadow-lg hover:shadow-amber-500/20"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Trust badge */}
            <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
              <ShieldCheck size={15} className="text-emerald-500" />
              <span>Vos documents sont privés et sécurisés</span>
            </div>
          </div>

          {/* Mobile: quick category pills */}
          <div className="lg:hidden mt-5">
            <p className="text-slate-500 text-xs text-center mb-2.5">Documents disponibles</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {CATEGORIES.map(({ label, color }) => (
                <span key={label} className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${color}`}>
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <p className="text-xs text-slate-500 text-center mt-5 leading-relaxed max-w-sm mx-auto px-4">
            L'application ne remplace pas le contrôle d'un juriste.
            Les documents générés sont des modèles à vérifier au cas par cas.
          </p>
        </div>
      </div>
    </div>
  );
}
