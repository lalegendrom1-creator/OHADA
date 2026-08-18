import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, FileText, Download, FileType, Copy, CheckCircle2,
  AlertCircle, AlertTriangle, History, Save, Pencil, X, PencilLine,
} from 'lucide-react';
import type { GeneratedDocument, DocumentTemplate, DocumentVersion, ComplianceWarning } from '@/lib/types';
import {
  fetchDocument, fetchVersions, updateDocument, setDocumentStatus, addVersion,
} from '@/lib/data';
import { renderTemplate, runComplianceChecks, type Values } from '@/lib/documentEngine';
import { exportPdf, exportWord, copyToClipboard } from '@/lib/export';

interface Props {
  document: GeneratedDocument;
  templates: DocumentTemplate[];
  onBack: () => void;
  onRefresh: () => void;
  onDuplicate: (d: GeneratedDocument) => void;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-700',
  validated: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-500',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Brouillon',
  validated: 'Validé',
  archived: 'Archivé',
};

export default function DocumentViewer({ document, templates, onBack, onRefresh, onDuplicate }: Props) {
  const [doc, setDoc] = useState(document);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [editing, setEditing] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Values>(document.values);
  const [editTitle, setEditTitle] = useState(document.title);
  const [versionNote, setVersionNote] = useState('');

  const template = templates.find((t) => t.id === doc.template_id);

  useEffect(() => {
    fetchVersions(doc.id).then(setVersions).catch(() => {});
  }, [doc.id]);

  const warnings: ComplianceWarning[] = useMemo(
    () => (template ? runComplianceChecks(template.compliance_rules, template.variables, editValues) : []),
    [template, editValues],
  );

  const renderedBody = useMemo(
    () => (template ? renderTemplate(template.body, template.variables, editValues) : doc.body),
    [template, editValues, doc.body],
  );

  const errorCount = warnings.filter((w) => w.severity === 'error').length;

  const refreshDoc = async () => {
    const fresh = await fetchDocument(doc.id);
    if (fresh) setDoc(fresh);
    const v = await fetchVersions(doc.id);
    setVersions(v);
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    setError(null);
    try {
      await updateDocument(doc.id, {
        title: editTitle,
        values: editValues,
        body: renderedBody,
        warnings,
      }, true, versionNote || 'Modification');
      await refreshDoc();
      setEditing(false);
      setVersionNote('');
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (status: GeneratedDocument['status']) => {
    await setDocumentStatus(doc.id, status);
    await refreshDoc();
    onRefresh();
  };

  const handleCopy = async () => {
    await copyToClipboard(renderedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRestoreVersion = async (v: DocumentVersion) => {
    if (!confirm(`Restaurer la version ${v.version_number} ? Une nouvelle version sera créée.`)) return;
    setEditValues(v.values);
    setEditTitle(doc.title);
    await updateDocument(doc.id, {
      values: v.values,
      body: v.body,
    }, true, `Restauration de la version ${v.version_number}`);
    await refreshDoc();
    onRefresh();
  };

  return (
    <div className="space-y-5 page-transition">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0 shadow-sm transition-colors active:scale-95"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug break-words">{doc.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_BADGE[doc.status]}`}>
              {STATUS_LABEL[doc.status]}
            </span>
            {template?.ohada_reference && <span className="font-mono text-slate-400">{template.ohada_reference}</span>}
            <span>· Modifié le {new Date(doc.updated_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>

      {/* Responsive Toolbar */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-2">
        <button
          onClick={() => setEditing((e) => !e)}
          className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
            editing
              ? 'bg-slate-900 text-white'
              : 'bg-amber-500 hover:bg-amber-600 text-slate-900'
          }`}
        >
          {editing ? <X size={15} /> : <Pencil size={15} />}
          <span>{editing ? 'Annuler la modif' : 'Modifier'}</span>
        </button>

        <button
          onClick={() => exportPdf(renderedBody, doc.title)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 transition-colors"
        >
          <Download size={15} />
          <span>PDF</span>
        </button>
        <button
          onClick={() => exportWord(renderedBody, doc.title)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 transition-colors"
        >
          <FileType size={15} />
          <span>Word</span>
        </button>
        <button
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 transition-colors"
        >
          {copied ? <CheckCircle2 size={15} className="text-emerald-600" /> : <Copy size={15} />}
          <span>{copied ? 'Copié !' : 'Copier'}</span>
        </button>
        <button
          onClick={() => onDuplicate(doc)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 transition-colors"
        >
          <Copy size={15} />
          <span>Dupliquer</span>
        </button>
        <button
          onClick={() => setShowVersions((s) => !s)}
          className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
            showVersions
              ? 'bg-slate-800 text-white border-slate-800'
              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
          }`}
        >
          <History size={15} />
          <span>Versions ({versions.length})</span>
        </button>

        {doc.status === 'draft' && (
          <button
            onClick={() => handleStatus('validated')}
            disabled={errorCount > 0}
            className="ml-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs sm:text-sm font-semibold transition-all shadow-sm"
          >
            <CheckCircle2 size={15} />
            <span>Valider le document</span>
          </button>
        )}
        {doc.status === 'validated' && (
          <button
            onClick={() => handleStatus('archived')}
            className="ml-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
          >
            <span>Archiver</span>
          </button>
        )}
      </div>

      {/* Warnings */}
      {doc.warnings.length > 0 && !editing && (
        <div className="space-y-2">
          {doc.warnings.filter((w) => w.severity === 'error').map((w) => (
            <div key={w.rule_id} className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium">
              <AlertCircle size={16} className="shrink-0" />
              <span>{w.description}</span>
            </div>
          ))}
          {doc.warnings.filter((w) => w.severity === 'warning').map((w) => (
            <div key={w.rule_id} className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-xl text-xs sm:text-sm">
              <AlertTriangle size={16} className="shrink-0 text-amber-600" />
              <span>{w.description}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-xs sm:text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Document body - placed after editor on mobile if editing is active */}
        <div className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-sm ${editing ? 'order-2 lg:order-1 lg:col-span-2' : 'lg:col-span-2'}`}>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-sm sm:text-base selection:bg-amber-100">
            {renderedBody}
          </div>
        </div>

        {/* Side panel - placed first on mobile if editing so user sees fields immediately */}
        <div className={`space-y-4 ${editing ? 'order-1 lg:order-2 lg:col-span-1' : 'lg:col-span-1'}`}>
          {editing && template && (
            <div className="bg-white rounded-2xl border-2 border-amber-400 p-5 shadow-md">
              <h3 className="font-bold text-slate-900 mb-3 text-base flex items-center gap-2">
                <PencilLine size={18} className="text-amber-500" />
                Modifier les champs
              </h3>
              <div className="space-y-3.5 md:max-h-[55vh] md:overflow-y-auto pr-0.5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1">Titre du document</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                {template.variables.map((v) => (
                  <div key={v.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      {v.label}{v.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {v.type === 'textarea' ? (
                      <textarea
                        value={String(editValues[v.key] ?? '')}
                        onChange={(e) => setEditValues((p) => ({ ...p, [v.key]: e.target.value }))}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    ) : v.type === 'select' ? (
                      <select
                        value={String(editValues[v.key] ?? '')}
                        onChange={(e) => setEditValues((p) => ({ ...p, [v.key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white"
                      >
                        {v.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input
                        type={v.type === 'date' ? 'date' : v.type === 'number' ? 'number' : 'text'}
                        value={String(editValues[v.key] ?? '')}
                        onChange={(e) =>
                          setEditValues((p) => ({
                            ...p,
                            [v.key]: v.type === 'number' ? Number(e.target.value) : e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    )}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Note de version</label>
                  <input
                    type="text"
                    value={versionNote}
                    onChange={(e) => setVersionNote(e.target.value)}
                    placeholder="Ex: Correction du capital"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveEdit}
                disabled={loading || errorCount > 0}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 text-slate-900 font-semibold text-sm"
              >
                <Save size={16} />
                {loading ? '...' : 'Enregistrer la version'}
              </button>
            </div>
          )}

          {showVersions && (
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <History size={16} />
                Historique des versions
              </h3>
              {versions.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune version enregistrée.</p>
              ) : (
                <div className="space-y-2">
                  {versions.map((v) => (
                    <div key={v.id} className="border border-slate-100 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-slate-700">v{v.version_number}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(v.created_at).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {v.note && <p className="text-xs text-slate-500 mt-1">{v.note}</p>}
                      <button
                        onClick={() => handleRestoreVersion(v)}
                        className="text-xs text-amber-600 hover:text-amber-700 mt-2 font-medium"
                      >
                        Restaurer cette version
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Legal notice */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
            <strong className="text-slate-700">Avertissement :</strong> ce document est généré à partir d'un modèle
            conforme au droit OHADA mais ne remplace pas le contrôle d'un juriste. Vérifiez l'adéquation
            aux spécificités locales avant tout usage.
          </div>
        </div>
      </div>
    </div>
  );
}
