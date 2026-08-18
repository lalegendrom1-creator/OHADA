import { supabase } from './supabase';
import type {
  DocumentTemplate,
  GeneratedDocument,
  DocumentVersion,
  AuditLog,
  TemplateFavorite,
  ComplianceWarning,
} from './types';
import type { Values } from './documentEngine';
import { DEFAULT_TEMPLATES } from './defaultTemplates';

const LOCAL_STORAGE_TEMPLATES_KEY = 'ohada_custom_templates';

function getLocalTemplates(): DocumentTemplate[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DocumentTemplate[];
  } catch {
    return [];
  }
}

function saveLocalTemplates(templates: DocumentTemplate[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(templates));
  } catch {
    // Ignore storage quota
  }
}

// ---------- Templates ----------

export async function fetchTemplates(): Promise<DocumentTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .order('category', { ascending: true })
      .order('title', { ascending: true });

    if (error) throw error;

    if (data && data.length > 0) {
      // Merge with any default templates that might be missing by code
      const remoteCodes = new Set(data.map((t) => t.code));
      const missingDefaults = DEFAULT_TEMPLATES.filter((dt) => !remoteCodes.has(dt.code));
      const combined = [...(data as DocumentTemplate[]), ...missingDefaults];
      return combined.sort((a, b) => a.category.localeCompare(b.category) || a.title.localeCompare(b.title));
    } else {
      // Supabase is empty: auto-seed defaults in background
      seedDefaultTemplatesToSupabase().catch(() => {});
      const local = getLocalTemplates();
      if (local.length > 0) {
        const localCodes = new Set(local.map((t) => t.code));
        const missing = DEFAULT_TEMPLATES.filter((dt) => !localCodes.has(dt.code));
        return [...local, ...missing];
      }
      return DEFAULT_TEMPLATES;
    }
  } catch {
    // Supabase unreachable or RLS error -> fallback to local & defaults
    const local = getLocalTemplates();
    if (local.length > 0) {
      const localCodes = new Set(local.map((t) => t.code));
      const missing = DEFAULT_TEMPLATES.filter((dt) => !localCodes.has(dt.code));
      return [...local, ...missing];
    }
    return DEFAULT_TEMPLATES;
  }
}

export async function seedDefaultTemplatesToSupabase(): Promise<void> {
  try {
    const toInsert = DEFAULT_TEMPLATES.map(({ id: _id, ...rest }) => rest);
    await supabase.from('document_templates').upsert(toInsert, { onConflict: 'code' });
  } catch {
    // Ignore seed errors if offline
  }
}

export async function fetchTemplatesByCategory(category: string): Promise<DocumentTemplate[]> {
  const all = await fetchTemplates();
  return all.filter((t) => t.category === category);
}

export async function fetchTemplateByCode(code: string): Promise<DocumentTemplate | null> {
  const all = await fetchTemplates();
  return all.find((t) => t.code === code) || null;
}

export async function upsertTemplate(template: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
  const isNew = !template.id || template.id.startsWith('tpl-');
  const now = new Date().toISOString();

  let saved: DocumentTemplate;

  try {
    const payload = {
      ...template,
      updated_at: now,
    };
    if (isNew && template.id?.startsWith('tpl-')) {
      delete payload.id; // Let Supabase generate a real UUID if inserting
    }

    const { data, error } = await supabase
      .from('document_templates')
      .upsert(payload)
      .select('*')
      .single();

    if (error) throw error;
    saved = data as DocumentTemplate;
  } catch {
    // If Supabase fails, persist locally
    saved = {
      id: template.id || `tpl-${Date.now()}`,
      code: template.code || `code-${Date.now()}`,
      title: template.title || 'Nouveau modèle',
      category: template.category || 'Lettres',
      description: template.description || null,
      ohada_reference: template.ohada_reference || null,
      body: template.body || '',
      variables: template.variables || [],
      compliance_rules: template.compliance_rules || [],
      is_active: template.is_active ?? true,
      version: (template.version ?? 0) + 1,
      country: template.country || null,
      created_at: template.created_at || now,
      updated_at: now,
    };
  }

  // Update local storage
  const current = getLocalTemplates();
  const index = current.findIndex((t) => t.id === saved.id || t.code === saved.code);
  if (index >= 0) {
    current[index] = saved;
  } else {
    current.push(saved);
  }
  saveLocalTemplates(current);

  return saved;
}

export async function deleteTemplate(id: string): Promise<void> {
  try {
    await supabase.from('document_templates').delete().eq('id', id);
  } catch {
    // ignore
  }

  const current = getLocalTemplates().filter((t) => t.id !== id);
  saveLocalTemplates(current);
}

// ---------- Documents ----------

export async function fetchDocuments(): Promise<GeneratedDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GeneratedDocument[];
}

export async function fetchDocument(id: string): Promise<GeneratedDocument | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data as GeneratedDocument | null;
}

export async function createDocument(input: {
  template_id: string;
  title: string;
  values: Values;
  body: string;
  warnings: ComplianceWarning[];
}): Promise<GeneratedDocument> {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      template_id: input.template_id,
      title: input.title,
      values: input.values,
      body: input.body,
      warnings: input.warnings,
      status: 'draft',
    })
    .select('*')
    .single();
  if (error) throw error;
  const doc = data as GeneratedDocument;
  await addVersion(doc.id, doc.body, doc.values, 1, 'Version initiale');
  await logAudit('create', 'document', doc.id, { title: doc.title });
  return doc;
}

export async function updateDocument(
  id: string,
  patch: Partial<Pick<GeneratedDocument, 'title' | 'values' | 'body' | 'warnings' | 'status'>>,
  createVersion = false,
  versionNote?: string,
): Promise<GeneratedDocument> {
  const { data, error } = await supabase
    .from('documents')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  const doc = data as GeneratedDocument;
  if (createVersion) {
    const lastVersion = await fetchLatestVersionNumber(id);
    await addVersion(id, doc.body, doc.values, lastVersion + 1, versionNote || 'Modification');
  }
  await logAudit('update', 'document', id, { patch });
  return doc;
}

export async function setDocumentStatus(
  id: string,
  status: GeneratedDocument['status'],
): Promise<void> {
  await updateDocument(id, { status });
  await logAudit(status === 'validated' ? 'validate' : 'archive', 'document', id, { status });
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Versions ----------

export async function fetchVersions(documentId: string): Promise<DocumentVersion[]> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentVersion[];
}

export async function addVersion(
  documentId: string,
  body: string,
  values: Values,
  versionNumber: number,
  note: string,
): Promise<void> {
  const { error } = await supabase.from('document_versions').insert({
    document_id: documentId,
    body,
    values,
    version_number: versionNumber,
    note,
  });
  if (error) throw error;
}

export async function fetchLatestVersionNumber(documentId: string): Promise<number> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('version_number')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as { version_number: number } | null)?.version_number ?? 0;
}

// ---------- Audit ----------

export async function fetchAuditLogs(limit = 100): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as AuditLog[];
}

export async function logAudit(
  action: string,
  entity: string,
  entityId: string | null,
  details: Record<string, unknown>,
): Promise<void> {
  await supabase.from('audit_logs').insert({
    action,
    entity,
    entity_id: entityId,
    details,
  });
}

// ---------- Favorites ----------

export async function fetchFavorites(): Promise<TemplateFavorite[]> {
  const { data, error } = await supabase
    .from('template_favorites')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as TemplateFavorite[];
}

export async function addFavorite(templateId: string): Promise<void> {
  const { error } = await supabase.from('template_favorites').insert({ template_id: templateId });
  if (error && error.code !== '23505') throw error;
}

export async function removeFavorite(templateId: string): Promise<void> {
  const { error } = await supabase
    .from('template_favorites')
    .delete()
    .eq('template_id', templateId);
  if (error) throw error;
}

export async function toggleFavorite(templateId: string, isFavorite: boolean): Promise<void> {
  if (isFavorite) await removeFavorite(templateId);
  else await addFavorite(templateId);
}

// ---------- Full-text search ----------

export async function searchDocuments(query: string): Promise<GeneratedDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .textSearch('fts', query, { type: 'websearch', config: 'french' })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as GeneratedDocument[];
}

// ---------- Duplication ----------

export async function duplicateDocument(doc: GeneratedDocument): Promise<GeneratedDocument> {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      template_id: doc.template_id,
      title: `${doc.title} (copie)`,
      values: doc.values,
      body: doc.body,
      warnings: doc.warnings,
      status: 'draft',
    })
    .select('*')
    .single();
  if (error) throw error;
  const copy = data as GeneratedDocument;
  await addVersion(copy.id, copy.body, copy.values, 1, 'Copie depuis un document existant');
  await logAudit('create', 'document', copy.id, { title: copy.title, duplicated_from: doc.id });
  return copy;
}
