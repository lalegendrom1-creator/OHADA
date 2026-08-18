import { useState, useMemo } from 'react';
import { ArrowLeft, AlertTriangle, AlertCircle, Info, CheckCircle2, Eye, Save, FileText } from 'lucide-react';
import type { DocumentTemplate, ComplianceWarning } from '@/lib/types';
import { renderTemplate, runComplianceChecks, type Values } from '@/lib/documentEngine';
import { createDocument } from '@/lib/data';

interface Props {
  template: DocumentTemplate;
  onSaved: (d: import('@/lib/types').GeneratedDocument) => void;
  onCancel: () => void;
}

export default function Generator({ template, onSaved, onCancel }: Props) {
  const [values, setValues] = useState<Values>(() => {
    const init: Values = {};
    for (const v of template.variables) {
      if (v.default) init[v.key] = v.default;
      else if (v.type === 'select' && v.options?.length) init[v.key] = v.options[0];
    }
    return init;
  });
  const [title, setTitle] = useState(template.title);
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const warnings: ComplianceWarning[] = useMemo(
    () => runComplianceChecks(template.compliance_rules, template.variables, values),
    [template, values],
  );

  const renderedBody = useMemo(
    () => renderTemplate(template.body, template.variables, values),
    [template, values],
  );

  const errorCount = warnings.filter((w) => w.severity === 'error').length;
  const warningCount = warnings.filter((w) => w.severity === 'warning').length;

  const handleChange = (key: string, val: string | number) => {
    setValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const doc = await createDocument({
        template_id: template.id,
        title,
        values,
        body: renderedBody,
        warnings,
      });
      onSaved(doc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 page-transition">
      {/* Top Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={onCancel}
          className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 shrink-0 shadow-sm transition-colors active:scale-95"
          aria-label="Retour"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">{template.title}</h1>
          {template.ohada_reference && (
            <p className="text-xs sm:text-sm text-slate-500 font-mono mt-0.5">Référence : {template.ohada_reference}</p>
          )}
        </div>
      </div>

      {/* Compliance banner */}
      {errorCount === 0 && warningCount === 0 ? (
        <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium shadow-sm">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Tous les champs sont conformes aux exigences OHADA.</span>
        </div>
      ) : (
        <div className="space-y-2">
          {errorCount > 0 && (
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium shadow-sm">
              <AlertCircle size={18} className="text-red-600 shrink-0" />
              <span>{errorCount} erreur{errorCount > 1 ? 's' : ''} de conformité OHADA à corriger.</span>
            </div>
          )}
          {warningCount > 0 && (
            <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium shadow-sm">
              <AlertTriangle size={18} className="text-amber-600 shrink-0" />
              <span>{warningCount} avertissement{warningCount > 1 ? 's' : ''} à examiner.</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
          <div className="mb-5">
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
              Titre du document
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 shadow-sm"
            />
          </div>

          {/* Form fields: smooth scrolling without trapped containers on mobile */}
          <div className="space-y-4 md:max-h-[60vh] md:overflow-y-auto pr-0.5">
            {template.variables.map((v) => {
              const fieldWarnings = warnings.filter((w) => w.field === v.key);
              const hasError = fieldWarnings.some((w) => w.severity === 'error');
              return (
                <div key={v.key} className="space-y-1.5">
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700">
                    {v.label}
                    {v.required && <span className="text-red-500 ml-1 font-bold">*</span>}
                    {v.sensitive && (
                      <span className="ml-2 text-[10px] text-amber-700 bg-amber-100 font-semibold px-2 py-0.5 rounded-full">
                        sensible
                      </span>
                    )}
                  </label>
                  {v.help && <p className="text-xs text-slate-400 leading-relaxed">{v.help}</p>}
                  {v.type === 'textarea' ? (
                    <textarea
                      value={String(values[v.key] ?? '')}
                      onChange={(e) => handleChange(v.key, e.target.value)}
                      rows={3}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all ${
                        hasError ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-amber-500'
                      }`}
                    />
                  ) : v.type === 'select' ? (
                    <select
                      value={String(values[v.key] ?? '')}
                      onChange={(e) => handleChange(v.key, e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all ${
                        hasError ? 'border-red-300' : 'border-slate-200'
                      }`}
                    >
                      {v.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={v.type === 'date' ? 'date' : v.type === 'number' ? 'number' : 'text'}
                      value={String(values[v.key] ?? '')}
                      onChange={(e) =>
                        handleChange(
                          v.key,
                          v.type === 'number' ? Number(e.target.value) : e.target.value,
                        )
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all ${
                        hasError ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-amber-500'
                      }`}
                    />
                  )}
                  {fieldWarnings.map((w) => (
                    <p
                      key={w.rule_id}
                      className={`text-xs flex items-center gap-1 font-medium ${
                        w.severity === 'error' ? 'text-red-600' : 'text-amber-700'
                      }`}
                    >
                      {w.severity === 'error' ? <AlertCircle size={13} className="shrink-0" /> : <AlertTriangle size={13} className="shrink-0" />}
                      <span>{w.description}</span>
                    </p>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={() => setShowPreview((s) => !s)}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold transition-colors shadow-sm active:scale-95"
            >
              <Eye size={16} />
              <span>{showPreview ? "Masquer l'aperçu" : 'Aperçu'}</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving || errorCount > 0}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-bold text-xs sm:text-sm transition-all shadow-md active:scale-95"
            >
              <Save size={16} />
              <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
          {errorCount > 0 && (
            <p className="text-xs text-red-500 mt-2 text-center font-medium">
              Veuillez corriger les erreurs de conformité pour pouvoir enregistrer.
            </p>
          )}
          {error && <p className="text-sm text-red-600 mt-2 text-center">{error}</p>}
        </div>

        {/* Preview Card */}
        {showPreview && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 lg:sticky lg:top-6 lg:self-start lg:max-h-[80vh] lg:overflow-y-auto shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 mb-4 pb-2 border-b border-slate-100">
              <FileText size={18} className="text-amber-500" />
              <span>Aperçu en direct du document</span>
            </div>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-sm sm:text-base selection:bg-amber-100">
              {renderedBody}
            </div>
          </div>
        )}
      </div>

      {/* Compliance rules reference */}
      {template.compliance_rules.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Règles de conformité OHADA vérifiées</h3>
          <div className="space-y-2">
            {template.compliance_rules.map((r) => {
              const w = warnings.find((x) => x.rule_id === r.id);
              const passed = !w;
              const Icon = passed ? CheckCircle2 : r.severity === 'error' ? AlertCircle : r.severity === 'warning' ? AlertTriangle : Info;
              const color = passed ? 'text-emerald-600' : r.severity === 'error' ? 'text-red-600' : 'text-amber-600';
              return (
                <div key={r.id} className="flex items-start gap-2 text-sm">
                  <Icon size={16} className={`mt-0.5 shrink-0 ${color}`} />
                  <span className={passed ? 'text-slate-500' : 'text-slate-700'}>
                    {r.description}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
