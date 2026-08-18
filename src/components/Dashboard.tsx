import { FileText, Clock, AlertTriangle, CheckCircle2, TrendingUp, Scale, Star, ArrowRight, Sparkles } from 'lucide-react';
import type { DocumentTemplate, GeneratedDocument, AuditLog, TemplateFavorite, TemplateCategory } from '@/lib/types';

interface Props {
  templates: DocumentTemplate[];
  documents: GeneratedDocument[];
  auditLogs: AuditLog[];
  favorites: TemplateFavorite[];
  onNewDocument: () => void;
  onOpenDoc: (d: GeneratedDocument) => void;
  onSelectTemplate: (t: DocumentTemplate) => void;
  onFilterCategory?: (cat: TemplateCategory) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  Constitution: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Fonctionnement: 'bg-sky-100 text-sky-700 border-sky-200',
  Contrats: 'bg-amber-100 text-amber-700 border-amber-200',
  Lettres: 'bg-rose-100 text-rose-700 border-rose-200',
  Résolutions: 'bg-violet-100 text-violet-700 border-violet-200',
};

const CATEGORY_DOT: Record<string, string> = {
  Constitution: 'bg-emerald-500',
  Fonctionnement: 'bg-sky-500',
  Contrats: 'bg-amber-500',
  Lettres: 'bg-rose-500',
  Résolutions: 'bg-violet-500',
};

export default function Dashboard({
  templates,
  documents,
  auditLogs,
  favorites,
  onNewDocument,
  onOpenDoc,
  onSelectTemplate,
  onFilterCategory,
}: Props) {
  const drafts = documents.filter((d) => d.status === 'draft').length;
  const validated = documents.filter((d) => d.status === 'validated').length;
  const archived = documents.filter((d) => d.status === 'archived').length;
  const recentDocs = [...documents]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);
  const favTemplates = templates.filter((t) =>
    favorites.some((f) => f.template_id === t.id),
  );

  const stats = [
    { label: 'Modèles disponibles', value: templates.length, icon: FileText, color: 'text-sky-600 bg-sky-50', ring: 'ring-sky-100' },
    { label: 'Documents générés', value: documents.length, icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50', ring: 'ring-emerald-100' },
    { label: 'Brouillons', value: drafts, icon: Clock, color: 'text-amber-600 bg-amber-50', ring: 'ring-amber-100' },
    { label: 'Validés', value: validated, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50', ring: 'ring-emerald-100' },
  ];

  const categoryCounts = templates.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 sm:space-y-8 page-transition">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-5 py-8 sm:px-10 sm:py-12 shadow-xl border border-slate-800">
        <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-amber-500/10 blur-2xl" />
        <div className="absolute right-32 top-16 w-32 h-32 rounded-full bg-amber-500/5 blur-xl" />
        <div className="absolute -left-16 bottom-0 w-48 h-48 rounded-full bg-sky-500/5 blur-2xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 text-amber-400 text-xs sm:text-sm font-semibold mb-3 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full shadow-sm">
            <Scale size={14} className="shrink-0" />
            <span>Conforme au droit OHADA</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 max-w-3xl leading-tight sm:leading-snug">
            Générateur de Documents Juridiques OHADA
          </h1>
          <p className="text-slate-300 max-w-2xl text-xs sm:text-base leading-relaxed mb-6">
            Statuts de société (SARL, SAS), procès-verbaux d'AG, contrats commerciaux, mises en demeure :
            des modèles certifiés, personnalisables et immédiatement conformes aux Actes uniformes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNewDocument}
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-900 font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-amber-500/25"
            >
              <Sparkles size={18} />
              <span>Choisir un modèle d'acte</span>
            </button>
            {favTemplates.length > 0 && (
              <button
                onClick={() => onFilterCategory?.(favTemplates[0].category)}
                className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 active:scale-95 text-white font-medium px-5 py-3 rounded-xl transition-colors border border-white/15"
              >
                <Star size={16} className="text-amber-400 fill-amber-400" />
                <span>{favTemplates.length} modèle{favTemplates.length > 1 ? 's' : ''} favori{favTemplates.length > 1 ? 's' : ''}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 hover:shadow-md transition-shadow shadow-sm animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2.5 ring-4 ${s.color} ${s.ring}`}>
                <Icon size={18} />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs sm:text-sm text-slate-500 leading-tight">{s.label}</div>
            </div>
          );
        })}
      </div>

      {/* Favorites quick access */}
      {favTemplates.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <Star size={18} className="text-amber-500 fill-amber-500" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Modèles favoris</h2>
            <span className="text-xs text-slate-400 font-medium">({favTemplates.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {favTemplates.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelectTemplate(t)}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/80 hover:border-amber-400 hover:bg-amber-50/40 transition-all text-left group hover:shadow-sm active:scale-[0.99]"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0 font-semibold">
                  <FileText size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate group-hover:text-amber-700 transition-colors">{t.title}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.category}</div>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent documents */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Documents récents</h2>
            {archived > 0 && (
              <span className="text-xs text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                {archived} archivé{archived > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {recentDocs.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-2 text-slate-400">
                <FileText size={24} />
              </div>
              <p className="text-sm font-medium text-slate-600">Aucun document généré pour l'instant.</p>
              <button
                onClick={onNewDocument}
                className="mt-3 text-xs sm:text-sm text-amber-700 hover:text-amber-800 font-semibold bg-amber-50 px-3.5 py-2 rounded-xl transition-colors inline-block"
              >
                Créer votre premier document →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentDocs.map((d) => {
                const tpl = templates.find((t) => t.id === d.template_id);
                const errorCount = d.warnings.filter((w) => w.severity === 'error').length;
                return (
                  <button
                    key={d.id}
                    onClick={() => onOpenDoc(d)}
                    className="w-full flex items-center gap-3 py-3 text-left hover:bg-slate-50 -mx-2 px-2 rounded-xl transition-colors group active:scale-[0.99]"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 shrink-0 group-hover:bg-amber-100 group-hover:text-amber-700 transition-colors">
                      <FileText size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800 truncate group-hover:text-amber-700 transition-colors">{d.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {tpl?.category} · {new Date(d.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    {errorCount > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full shrink-0">
                        <AlertTriangle size={12} />
                        {errorCount}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 size={12} />
                        Conforme
                      </span>
                    )}
                    <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">Catégories d'actes</h2>
          <div className="space-y-1">
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <button
                key={cat}
                onClick={() => onFilterCategory?.(cat as TemplateCategory)}
                className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${CATEGORY_DOT[cat] || 'bg-slate-400'}`} />
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${CATEGORY_COLORS[cat] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {cat}
                  </span>
                </div>
                <span className="text-xs sm:text-sm text-slate-500 font-medium group-hover:text-slate-800 transition-colors">
                  {count} modèle{count > 1 ? 's' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
