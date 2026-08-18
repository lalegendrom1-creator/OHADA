import { useState, useEffect, useCallback } from 'react';
import { FileText, Trash2, Search, Filter, Copy, Loader2, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import type { GeneratedDocument, DocumentTemplate, DocumentStatus } from '@/lib/types';
import { deleteDocument, searchDocuments } from '@/lib/data';
import { useToast } from '@/components/Toast';

interface Props {
  documents: GeneratedDocument[];
  templates: DocumentTemplate[];
  onOpen: (d: GeneratedDocument) => void;
  onRefresh: () => void;
  onDuplicate: (d: GeneratedDocument) => void;
}

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Brouillon',
  validated: 'Validé',
  archived: 'Archivé',
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  draft: 'bg-amber-100 text-amber-700',
  validated: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-500',
};

type SortField = 'updated_at' | 'title' | 'status';
type SortDir = 'asc' | 'desc';

export default function DocumentList({ documents, templates, onOpen, onRefresh, onDuplicate }: Props) {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [searchResults, setSearchResults] = useState<GeneratedDocument[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const results = await searchDocuments(q);
      setSearchResults(results);
    } catch {
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => performSearch(query), 350);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const isSearching = searchResults !== null;
  const source = searchResults ?? documents;
  const filtered = source.filter((d) => {
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesStatus;
  });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'title') cmp = a.title.localeCompare(b.title);
    else if (sortField === 'status') cmp = a.status.localeCompare(b.status);
    else cmp = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'title' ? 'asc' : 'desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Supprimer définitivement « ${title} » et son historique ?`)) return;
    try {
      await deleteDocument(id);
      toast('Document supprimé', 'success');
      onRefresh();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="space-y-6 page-transition">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes documents</h1>
        <p className="text-slate-500 mt-1">
          {isSearching
            ? `${sorted.length} résultat${sorted.length > 1 ? 's' : ''} pour « ${query} »`
            : `${documents.length} document${documents.length > 1 ? 's' : ''} au total`}
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par titre ou contenu..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all shadow-sm"
          />
          {searching && (
            <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
          )}
          {!searching && query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mr-1 shrink-0 hidden sm:flex">
            <Filter size={14} />
            <span>Filtre :</span>
          </div>
          {(['all', 'draft', 'validated', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 shadow-sm ${
                statusFilter === s
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s === 'all' ? 'Tous les documents' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <FileText size={28} />
          </div>
          <h3 className="font-semibold text-slate-800 text-base mb-1">
            {isSearching ? 'Aucun document trouvé' : 'Aucun document généré'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {isSearching
              ? 'Aucun document ne correspond à votre recherche.'
              : 'Commencez par choisir un modèle pour créer votre premier document.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View (< 640px) */}
          <div className="block sm:hidden space-y-3">
            {sorted.map((d) => {
              const tpl = templates.find((t) => t.id === d.template_id);
              return (
                <div
                  key={d.id}
                  onClick={() => onOpen(d)}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm active:scale-[0.99] transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                      {tpl?.category && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {tpl.category}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">
                      {new Date(d.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug mb-3">
                    {d.title}
                  </h3>

                  {/* Actions for mobile - Always clearly visible and easy to tap */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpen(d);
                      }}
                      className="text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-2 rounded-xl flex-1 text-center"
                    >
                      Consulter / Modifier
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(d);
                        }}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-600 flex items-center justify-center transition-colors"
                        title="Dupliquer"
                        aria-label="Dupliquer"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(d.id, d.title);
                        }}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 flex items-center justify-center transition-colors"
                        title="Supprimer"
                        aria-label="Supprimer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (>= 640px) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">
                    <button
                      onClick={() => toggleSort('title')}
                      className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                    >
                      Titre <SortIcon field="title" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 font-semibold">Catégorie</th>
                  <th className="px-5 py-3.5 font-semibold">
                    <button
                      onClick={() => toggleSort('status')}
                      className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                    >
                      Statut <SortIcon field="status" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 font-semibold">
                    <button
                      onClick={() => toggleSort('updated_at')}
                      className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                    >
                      Modifié <SortIcon field="updated_at" />
                    </button>
                  </th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sorted.map((d, i) => {
                  const tpl = templates.find((t) => t.id === d.template_id);
                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                      onClick={() => onOpen(d)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800 text-sm">{d.title}</div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-600 font-medium">
                        {tpl?.category || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[d.status]}`}>
                          {STATUS_LABELS[d.status]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        {new Date(d.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicate(d);
                            }}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-sky-50 text-slate-500 hover:text-sky-600 transition-colors"
                            title="Dupliquer"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(d.id, d.title);
                            }}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
