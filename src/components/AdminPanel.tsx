import { useState } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2, Save, X, Scale, Globe, Search, Filter } from 'lucide-react';
import type { DocumentTemplate, TemplateCategory, TemplateVariable, ComplianceRule } from '@/lib/types';
import { upsertTemplate, deleteTemplate, logAudit } from '@/lib/data';
import { useToast } from '@/components/Toast';

interface Props {
  templates: DocumentTemplate[];
  onRefresh: () => void;
}

const CATEGORIES: TemplateCategory[] = [
  'Constitution', 'Fonctionnement', 'Contrats', 'Lettres', 'Résolutions',
];

const OHADA_COUNTRIES = [
  '', 'Cameroun', "Côte d'Ivoire", 'Sénégal', 'Gabon', 'Mali', 'Burkina Faso',
  'Bénin', 'Togo', 'Niger', 'Tchad', 'Centrafrique', 'Congo', 'RD Congo',
  'Guinée', 'Comores', 'Guinée-Bissau', 'Guinée équatoriale',
];

const CATEGORY_COLORS: Record<string, string> = {
  Constitution: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  Fonctionnement: 'bg-sky-100 text-sky-700 border-sky-200',
  Contrats: 'bg-amber-100 text-amber-700 border-amber-200',
  Lettres: 'bg-rose-100 text-rose-700 border-rose-200',
  Résolutions: 'bg-violet-100 text-violet-700 border-violet-200',
};

const EMPTY_TEMPLATE: Partial<DocumentTemplate> = {
  code: '',
  title: '',
  category: 'Lettres',
  description: '',
  ohada_reference: '',
  body: '',
  variables: [],
  compliance_rules: [],
  is_active: true,
  version: 1,
  country: null,
};

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all';
const inputSmClass =
  'w-full px-2.5 py-1.5 rounded-md border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all';

export default function AdminPanel({ templates, onRefresh }: Props) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Partial<DocumentTemplate> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'Tous'>('Tous');
  const [searchQuery, setSearchQuery] = useState('');

  const handleNew = () => {
    setEditing({ ...EMPTY_TEMPLATE, category: selectedCategory === 'Tous' ? 'Lettres' : selectedCategory });
    setError(null);
  };

  const handleEdit = (t: DocumentTemplate) => {
    setEditing({ ...t });
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (t: DocumentTemplate) => {
    if (!confirm(`Supprimer définitivement le modèle « ${t.title} » ?`)) return;
    try {
      await deleteTemplate(t.id);
      await logAudit('template_update', 'template', t.id, { action: 'delete', title: t.title });
      toast('Modèle supprimé', 'success');
      onRefresh();
    } catch {
      toast('Erreur lors de la suppression', 'error');
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.code || !editing.title || !editing.body) {
      setError('Code, titre et corps du modèle sont obligatoires.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await upsertTemplate({
        ...editing,
        variables: editing.variables || [],
        compliance_rules: editing.compliance_rules || [],
      } as Partial<DocumentTemplate>);
      await logAudit('template_update', 'template', saved.id, { action: 'save', title: saved.title });
      setEditing(null);
      toast('Modèle enregistré avec succès', 'success');
      onRefresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    const matchesCat = selectedCategory === 'Tous' || t.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      t.title.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.ohada_reference?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const getCategoryCount = (cat: TemplateCategory | 'Tous') => {
    if (cat === 'Tous') return templates.length;
    return templates.filter((t) => t.category === cat).length;
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck size={26} className="text-amber-500" />
            Gestion des Modèles Juridiques
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configurez et personnalisez la bibliothèque de modèles de lettres et d'actes OHADA ({templates.length} modèles disponibles).
          </p>
        </div>
        <button
          onClick={handleNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold text-sm transition-all hover:shadow-lg hover:shadow-amber-500/20"
        >
          <Plus size={18} />
          Nouveau modèle
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm animate-fade-in-fast">
          {error}
        </div>
      )}

      {/* Editor Modal / Panel */}
      {editing && (
        <TemplateEditor
          template={editing}
          onChange={setEditing}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={saving}
        />
      )}

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-sm font-medium">
          {(['Tous', ...CATEGORIES] as (TemplateCategory | 'Tous')[]).map((cat) => {
            const active = selectedCategory === cat;
            const count = getCategoryCount(cat);
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                    active ? 'bg-amber-500 text-slate-900 font-bold' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un modèle par titre, code ou référence OHADA..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
          />
        </div>
      </div>

      {/* Templates Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {filteredTemplates.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Filter size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-700">Aucun modèle trouvé</p>
            <p className="text-xs text-slate-400 mt-1">
              Essayez de modifier votre recherche ou ajoutez un nouveau modèle.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5 font-semibold">Titre du modèle</th>
                  <th className="px-5 py-3.5 font-semibold">Catégorie</th>
                  <th className="px-5 py-3.5 font-semibold hidden md:table-cell">Pays</th>
                  <th className="px-5 py-3.5 font-semibold hidden sm:table-cell">Référence légale</th>
                  <th className="px-5 py-3.5 font-semibold">Statut</th>
                  <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTemplates.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800 text-sm">{t.title}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{t.code}</div>
                    </td>
                    <td className="px-5 py-3.5 text-sm">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                          CATEGORY_COLORS[t.category] || 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {t.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 hidden md:table-cell">
                      {t.country ? (
                        <span className="inline-flex items-center gap-1">
                          <Globe size={12} className="text-slate-400" />
                          {t.country}
                        </span>
                      ) : (
                        <span className="text-slate-400">Tous (OHADA)</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 hidden sm:table-cell font-mono">
                      {t.ohada_reference || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {t.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleEdit(t)}
                        className="text-slate-500 hover:text-amber-600 p-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                        title="Modifier le modèle"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateEditor({
  template,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  template: Partial<DocumentTemplate>;
  onChange: (t: Partial<DocumentTemplate>) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const update = (patch: Partial<DocumentTemplate>) => onChange({ ...template, ...patch });

  const updateVariable = (idx: number, patch: Partial<TemplateVariable>) => {
    const vars = [...(template.variables || [])];
    vars[idx] = { ...vars[idx], ...patch };
    update({ variables: vars });
  };
  const addVariable = () => {
    update({
      variables: [...(template.variables || []), { key: '', label: '', type: 'text' }],
    });
  };
  const removeVariable = (idx: number) => {
    update({ variables: (template.variables || []).filter((_, i) => i !== idx) });
  };

  const updateRule = (idx: number, patch: Partial<ComplianceRule>) => {
    const rules = [...(template.compliance_rules || [])];
    rules[idx] = { ...rules[idx], ...patch };
    update({ compliance_rules: rules });
  };
  const addRule = () => {
    update({
      compliance_rules: [
        ...(template.compliance_rules || []),
        { id: '', description: '', severity: 'warning', expression: '' },
      ],
    });
  };
  const removeRule = (idx: number) => {
    update({ compliance_rules: (template.compliance_rules || []).filter((_, i) => i !== idx) });
  };

  return (
    <div className="bg-white rounded-xl border-2 border-amber-400/80 p-6 space-y-5 shadow-lg animate-scale-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
          <Scale size={20} className="text-amber-500 shrink-0" />
          <span>{template.id ? `Modifier : ${template.title}` : 'Créer un nouveau modèle'}</span>
        </h3>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={onCancel}
            className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium transition-colors border border-slate-200 text-center"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs sm:text-sm disabled:bg-slate-200 transition-all shadow-sm text-center"
          >
            <Save size={16} />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Code unique (slug)">
          <input
            type="text"
            value={template.code || ''}
            onChange={(e) => update({ code: e.target.value })}
            placeholder="ex: lettre-mise-en-demeure"
            className={inputClass}
          />
        </Field>
        <Field label="Titre du modèle">
          <input
            type="text"
            value={template.title || ''}
            onChange={(e) => update({ title: e.target.value })}
            placeholder="ex: Lettre de mise en demeure"
            className={inputClass}
          />
        </Field>
        <Field label="Catégorie">
          <select
            value={template.category || 'Lettres'}
            onChange={(e) => update({ category: e.target.value as TemplateCategory })}
            className={inputClass}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Référence légale OHADA">
          <input
            type="text"
            value={template.ohada_reference || ''}
            onChange={(e) => update({ ohada_reference: e.target.value })}
            placeholder="ex: AUDCG art. 225"
            className={inputClass}
          />
        </Field>
        <Field label="Pays spécifique (laisser vide pour tous)">
          <div className="relative">
            <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={template.country || ''}
              onChange={(e) => update({ country: e.target.value || null })}
              className={`${inputClass} pl-9`}
            >
              {OHADA_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c || 'Tous les pays OHADA'}</option>
              ))}
            </select>
          </div>
        </Field>
        <Field label="Statut">
          <div className="pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={template.is_active ?? true}
                onChange={(e) => update({ is_active: e.target.checked })}
                className="rounded border-slate-300 text-amber-500 focus:ring-amber-400 w-4 h-4"
              />
              Modèle actif (visible pour les utilisateurs)
            </label>
          </div>
        </Field>
      </div>

      <Field label="Description / Objet du document">
        <textarea
          value={template.description || ''}
          onChange={(e) => update({ description: e.target.value })}
          rows={2}
          placeholder="Brève description de l'utilité de ce document..."
          className={inputClass}
        />
      </Field>

      <Field label="Corps du modèle (Variables dynamiques entre {{doubles_accolades}})">
        <textarea
          value={template.body || ''}
          onChange={(e) => update({ body: e.target.value })}
          rows={10}
          placeholder="Rédigez ici le texte du modèle en insérant {{variable1}}, {{variable2}}..."
          className={`${inputClass} font-mono text-xs leading-relaxed`}
        />
      </Field>

      {/* Variables */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Variables dynamiques du formulaire</h4>
            <p className="text-xs text-slate-400">Ces variables apparaîtront sous forme de champs lors de la génération.</p>
          </div>
          <button
            type="button"
            onClick={addVariable}
            className="text-xs bg-amber-50 text-amber-800 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors border border-amber-200 shadow-sm"
          >
            <Plus size={14} /> Ajouter une variable
          </button>
        </div>
        <div className="space-y-2.5">
          {(template.variables || []).map((v, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={v.key}
                onChange={(e) => updateVariable(idx, { key: e.target.value })}
                placeholder="clé (ex: nom_client)"
                className={`sm:w-36 font-mono ${inputSmClass}`}
              />
              <input
                type="text"
                value={v.label}
                onChange={(e) => updateVariable(idx, { label: e.target.value })}
                placeholder="Libellé du champ"
                className={`flex-1 ${inputSmClass}`}
              />
              <select
                value={v.type}
                onChange={(e) => updateVariable(idx, { type: e.target.value as TemplateVariable['type'] })}
                className={`sm:w-32 bg-white ${inputSmClass}`}
              >
                <option value="text">Texte court</option>
                <option value="textarea">Texte long</option>
                <option value="number">Nombre</option>
                <option value="date">Date</option>
                <option value="select">Menu déroulant</option>
              </select>
              <div className="flex items-center justify-between sm:justify-start gap-3 pt-1 sm:pt-0">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={v.required || false}
                    onChange={(e) => updateVariable(idx, { required: e.target.checked })}
                    className="rounded text-amber-500"
                  />
                  Requis
                </label>
                <button
                  type="button"
                  onClick={() => removeVariable(idx)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  title="Supprimer la variable"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance rules */}
      <div className="border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Règles de conformité juridique (Optionnel)</h4>
            <p className="text-xs text-slate-400">Expressions JavaScript pour vérifier la conformité OHADA (ex: montant &gt; 0).</p>
          </div>
          <button
            type="button"
            onClick={addRule}
            className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus size={14} /> Ajouter une règle
          </button>
        </div>
        <div className="space-y-2.5">
          {(template.compliance_rules || []).map((r, idx) => (
            <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={r.id}
                onChange={(e) => updateRule(idx, { id: e.target.value })}
                placeholder="ID règle"
                className={`sm:w-28 font-mono ${inputSmClass}`}
              />
              <input
                type="text"
                value={r.description}
                onChange={(e) => updateRule(idx, { description: e.target.value })}
                placeholder="Message d'avertissement"
                className={`flex-1 ${inputSmClass}`}
              />
              <select
                value={r.severity}
                onChange={(e) => updateRule(idx, { severity: e.target.value as ComplianceRule['severity'] })}
                className={`sm:w-32 bg-white ${inputSmClass}`}
              >
                <option value="error">Erreur</option>
                <option value="warning">Avertissement</option>
                <option value="info">Info</option>
              </select>
              <input
                type="text"
                value={r.expression}
                onChange={(e) => updateRule(idx, { expression: e.target.value })}
                placeholder="ex: montant > 0"
                className={`sm:w-36 ${inputSmClass} font-mono`}
              />
              <button
                type="button"
                onClick={() => removeRule(idx)}
                className="p-1 text-slate-400 hover:text-red-500 self-end sm:self-center transition-colors"
                title="Supprimer la règle"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
