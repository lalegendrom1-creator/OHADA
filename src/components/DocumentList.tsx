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

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher dans le contenu..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
          />
          {searching && (
            <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
          )}
          {!searching && query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
            >
              ✕
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={16} className="text-slate-400 shrink-0" />
          {(['all', 'draft', 'validated', 'archived'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                statusFilter === s
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s === 'all' ? 'Tous' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
            <FileText size={24} className="opacity-40" />
          </div>
          <p className="text-sm font-medium text-slate-500">
            {isSearching ? 'Aucun résultat pour cette recherche.' : 'Aucun document généré pour l\'instant.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">
                  <button
                    onClick={() => toggleSort('title')}
                    className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                  >
                    Titre <SortIcon field="title" />
                  </button>
                </th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">Catégorie</th>
                <th className="px-5 py-3 font-medium">
                  <button
                    onClick={() => toggleSort('status')}
                    className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                  >
                    Statut <SortIcon field="status" />
                  </button>
                </th>
                <th className="px-5 py-3 font-medium hidden sm:table-cell">
                  <button
                    onClick={() => toggleSort('updated_at')}
                    className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors"
                  >
                    Modifié <SortIcon field="updated_at" />
                  </button>
                </th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((d, i) => {
                const tpl = templates.find((t) => t.id === d.template_id);
                return (
                  <tr
                    key={d.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors animate-fade-in-fast"
                    style={{ animationDelay: `${i * 30}ms` }}
                    onClick={() => onOpen(d)}
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-800">{d.title}</div>
                      <div className="text-xs text-slate-400 sm:hidden">{tpl?.category}</div>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500 hidden sm:table-cell">
                      {tpl?.category || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[d.status]}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500 hidden sm:table-cell">
                      {new Date(d.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicate(d);
                        }}
                        className="text-slate-300 hover:text-sky-500 p-1.5 rounded transition-colors"
                        title="Dupliquer"
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(d.id, d.title);
                        }}
                        className="text-slate-300 hover:text-red-500 p-1.5 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
