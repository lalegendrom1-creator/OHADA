import { useState, useEffect, useCallback } from 'react';
import { FileText, Search, Scale, ArrowRight, Star, Globe } from 'lucide-react';
import type { DocumentTemplate, TemplateCategory, TemplateFavorite } from '@/lib/types';
import { fetchFavorites, toggleFavorite } from '@/lib/data';

interface Props {
  templates: DocumentTemplate[];
  onSelect: (t: DocumentTemplate) => void;
}

const CATEGORIES: (TemplateCategory | 'Tous')[] = [
  'Tous',
  'Constitution',
  'Fonctionnement',
  'Contrats',
  'Lettres',
  'Résolutions',
];

const OHADA_COUNTRIES = [
  'Tous les pays',
  'Cameroun',
  'Côte d\'Ivoire',
  'Sénégal',
  'Gabon',
  'Mali',
  'Burkina Faso',
  'Bénin',
  'Togo',
  'Niger',
  'Tchad',
  'Centrafrique',
  'Congo',
  'RD Congo',
  'Guinée',
  'Comores',
  'Guinée-Bissau',
  'Guinée équatoriale',
];

const CATEGORY_COLORS: Record<string, string> = {
  Constitution: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Fonctionnement: 'bg-sky-100 text-sky-700 border-sky-200',
  Contrats: 'bg-amber-100 text-amber-700 border-amber-200',
  Lettres: 'bg-rose-100 text-rose-700 border-rose-200',
  Résolutions: 'bg-violet-100 text-violet-700 border-violet-200',
};

export default function TemplateCatalog({ templates, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'Tous'>('Tous');
  const [country, setCountry] = useState<string>('Tous les pays');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<TemplateFavorite[]>([]);
  const [favLoading, setFavLoading] = useState<Record<string, boolean>>({});

  const refreshFavorites = useCallback(async () => {
    try {
      const favs = await fetchFavorites();
      setFavorites(favs);
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    refreshFavorites();
  }, [refreshFavorites]);

  const favoriteIds = new Set(favorites.map((f) => f.template_id));

  const filtered = templates.filter((t) => {
    const matchesCat = category === 'Tous' || t.category === category;
    const matchesCountry = country === 'Tous les pays' || t.country === null || t.country === country;
    const matchesFav = !favoritesOnly || favoriteIds.has(t.id);
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q);
    return matchesCat && matchesCountry && matchesFav && matchesQuery;
  });

  const handleToggleFavorite = async (templateId: string) => {
    const isFav = favoriteIds.has(templateId);
    setFavLoading((p) => ({ ...p, [templateId]: true }));
    try {
      await toggleFavorite(templateId, isFav);
      await refreshFavorites();
    } catch {
      // ignore
    } finally {
      setFavLoading((p) => ({ ...p, [templateId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Modèles de documents</h1>
        <p className="text-slate-500 mt-1">
          Sélectionnez un modèle pour générer un document juridique conforme à l'OHADA.
        </p>
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un modèle d'acte ou de lettre..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFavoritesOnly((f) => !f)}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm flex-1 sm:flex-initial whitespace-nowrap ${
                favoritesOnly
                  ? 'bg-amber-500 text-slate-900 font-semibold'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Star size={16} className={favoritesOnly ? 'fill-slate-900' : 'text-amber-500'} />
              <span>Favoris ({favorites.length})</span>
            </button>

            <div className="relative flex-1 sm:flex-initial min-w-[140px]">
              <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full pl-9 pr-7 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500/40 appearance-none cursor-pointer shadow-sm truncate"
              >
                {OHADA_COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 shadow-sm ${
                category === c
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
            <FileText size={28} />
          </div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">Aucun modèle trouvé</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {favoritesOnly
              ? "Vous n'avez pas encore ajouté de modèle aux favoris. Cliquez sur l'étoile d'un modèle pour l'ajouter."
              : 'Aucun modèle ne correspond à vos critères de recherche.'}
          </p>
          {(query || category !== 'Tous' || country !== 'Tous les pays' || favoritesOnly) && (
            <button
              onClick={() => {
                setQuery('');
                setCategory('Tous');
                setCountry('Tous les pays');
                setFavoritesOnly(false);
              }}
              className="mt-4 text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg transition-colors inline-block"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const isFav = favoriteIds.has(t.id);
            return (
              <div
                key={t.id}
                className="group relative bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Favorite Star Button - always accessible */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(t.id);
                  }}
                  disabled={favLoading[t.id]}
                  className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 flex items-center justify-center text-slate-400 hover:text-amber-500 transition-all z-10"
                  title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Star
                    size={16}
                    className={isFav ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}
                  />
                </button>

                <div
                  onClick={() => onSelect(t)}
                  className="cursor-pointer"
                >
                  <div className="flex items-start gap-1.5 mb-2.5 pr-8 flex-wrap">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        CATEGORY_COLORS[t.category] || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {t.category}
                    </span>
                    {t.country && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {t.country}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 mb-1.5 text-base leading-snug group-hover:text-amber-600 transition-colors">
                    {t.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                    {t.description || 'Modèle de document juridique conforme OHADA.'}
                  </p>
                  {t.ohada_reference && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mb-4">
                      <Scale size={13} className="text-amber-500 shrink-0" />
                      <span className="truncate">{t.ohada_reference}</span>
                    </div>
                  )}
                </div>

                {/* Primary Action Button - ALWAYS clearly visible on mobile & desktop */}
                <button
                  onClick={() => onSelect(t)}
                  className="w-full mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs sm:text-sm font-semibold text-amber-700 bg-amber-50/70 hover:bg-amber-500 hover:text-slate-900 px-3.5 py-2.5 rounded-xl transition-all group-hover:bg-amber-500 group-hover:text-slate-900 shadow-sm"
                >
                  <span>Générer ce document</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
