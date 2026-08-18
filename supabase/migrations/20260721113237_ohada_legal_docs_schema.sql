/*
# OHADA Legal Document Generator — Core Schema

## Overview
Single-tenant (no auth) schema for an OHADA-compliant legal document generator.
Stores reusable document templates (with dynamic variables + OHADA compliance rules),
generated documents, their versioned content, and an audit log of every change.

## New Tables
1. `document_templates` — master library of OHADA document models
   - id (uuid pk)
   - code (text, unique) — stable slug e.g. "statuts-sarl"
   - title (text)
   - category (text) — "Constitution", "Fonctionnement", "Contrats", "Lettres", "Résolutions"
   - description (text)
   - ohada_reference (text) — legal citation e.g. "AUSCGIE art. 386"
   - body (text) — template body with {{variables}}
   - variables (jsonb) — array of {key,label,type,required,help,sensitive,options}
   - compliance_rules (jsonb) — array of {id,description,severity,expression}
   - is_active (boolean default true)
   - version (int default 1)
   - created_at / updated_at

2. `documents` — generated documents (one per generation session)
   - id (uuid pk)
   - template_id (uuid fk → document_templates)
   - title (text)
   - values (jsonb) — user-supplied variable values
   - body (text) — rendered final document body
   - status (text) — "draft" | "validated" | "archived"
   - warnings (jsonb) — compliance warnings computed at generation
   - created_at / updated_at

3. `document_versions` — immutable history of each document's body
   - id (uuid pk)
   - document_id (uuid fk → documents)
   - body (text)
   - values (jsonb)
   - version_number (int)
   - note (text)
   - created_at

4. `audit_logs` — append-only journal of modifications
   - id (uuid pk)
   - action (text) — "create" | "update" | "validate" | "archive" | "template_update"
   - entity (text) — "document" | "template"
   - entity_id (uuid)
   - details (jsonb)
   - created_at

## Security
- RLS enabled on every table.
- Single-tenant (no auth): policies use `TO anon, authenticated` with `USING (true)`
  because data is intentionally shared/public within this app instance.
*/

CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  ohada_reference text,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  compliance_rules jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES document_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  body text NOT NULL,
  values jsonb NOT NULL DEFAULT '{}'::jsonb,
  version_number integer NOT NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  entity text NOT NULL,
  entity_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- document_templates: shared library, read+write by anon
DROP POLICY IF EXISTS "anon_select_templates" ON document_templates;
CREATE POLICY "anon_select_templates" ON document_templates
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_templates" ON document_templates;
CREATE POLICY "anon_insert_templates" ON document_templates
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_templates" ON document_templates;
CREATE POLICY "anon_update_templates" ON document_templates
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_templates" ON document_templates;
CREATE POLICY "anon_delete_templates" ON document_templates
  FOR DELETE TO anon, authenticated USING (true);

-- documents: generated docs, full CRUD by anon
DROP POLICY IF EXISTS "anon_select_documents" ON documents;
CREATE POLICY "anon_select_documents" ON documents
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
CREATE POLICY "anon_insert_documents" ON documents
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_documents" ON documents;
CREATE POLICY "anon_update_documents" ON documents
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_documents" ON documents;
CREATE POLICY "anon_delete_documents" ON documents
  FOR DELETE TO anon, authenticated USING (true);

-- document_versions: full CRUD by anon
DROP POLICY IF EXISTS "anon_select_versions" ON document_versions;
CREATE POLICY "anon_select_versions" ON document_versions
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_versions" ON document_versions;
CREATE POLICY "anon_insert_versions" ON document_versions
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_versions" ON document_versions;
CREATE POLICY "anon_delete_versions" ON document_versions
  FOR DELETE TO anon, authenticated USING (true);

-- audit_logs: read+insert only (append-only by convention)
DROP POLICY IF EXISTS "anon_select_audit" ON audit_logs;
CREATE POLICY "anon_select_audit" ON audit_logs
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_audit" ON audit_logs;
CREATE POLICY "anon_insert_audit" ON audit_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_documents_template_id ON documents(template_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_templates_category ON document_templates(category);
