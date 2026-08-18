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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un modèle..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
            />
          </div>
          <button
            onClick={() => setFavoritesOnly((f) => !f)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              favoritesOnly
                ? 'bg-amber-500 text-slate-900'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Star size={16} className={favoritesOnly ? 'fill-slate-900' : ''} />
            Favoris
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  category === c
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40 appearance-none cursor-pointer"
            >
              {OHADA_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <FileText size={32} className="mx-auto mb-3 opacity-40" />
          <p>
            {favoritesOnly
              ? 'Aucun modèle favori. Cliquez sur l\'étoile d\'un modèle pour l\'ajouter.'
              : 'Aucun modèle ne correspond à votre recherche.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const isFav = favoriteIds.has(t.id);
            return (
              <div
                key={t.id}
                className="group relative bg-white rounded-xl border border-slate-200 p-5 hover:border-amber-300 hover:shadow-md transition-all"
              >
                <button
                  onClick={() => handleToggleFavorite(t.id)}
                  disabled={favLoading[t.id]}
                  className="absolute top-3 right-3 text-slate-300 hover:text-amber-500 transition-colors p-1"
                  title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                >
                  <Star
                    size={18}
                    className={isFav ? 'fill-amber-500 text-amber-500' : ''}
                  />
                </button>
                <button
                  onClick={() => onSelect(t)}
                  className="text-left w-full pr-8"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                        CATEGORY_COLORS[t.category] || 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {t.category}
                    </span>
                    {t.country && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-500">
                        {t.country}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1.5 leading-snug">{t.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                    {t.description || 'Modèle de document juridique.'}
                  </p>
                  {t.ohada_reference && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Scale size={12} />
                      {t.ohada_reference}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-1 text-sm text-amber-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Générer
                    <ArrowRight size={14} />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
