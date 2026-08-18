/*
# Add country tags, template favorites, and document search

## Overview
Extends the schema to support:
- Country tagging on templates (OHADA covers 17 member states)
- User favorites/bookmarks for templates (many-to-many, user-scoped)
- Full-text search on generated documents (title + body)

## New Tables
1. `template_favorites` — user bookmarks a template for quick access
   - id (uuid pk)
   - user_id (uuid NOT NULL DEFAULT auth.uid(), references auth.users)
   - template_id (uuid fk → document_templates ON DELETE CASCADE)
   - created_at
   - UNIQUE(user_id, template_id) — one favorite per user per template

## Modified Tables
1. `document_templates` — add `country` text (nullable; null = all OHADA states)
2. `documents` — add search vector column `fts tsvector` generated from
   title + body, plus a GIN index for fast full-text search.

## Security
- `template_favorites`: owner-scoped CRUD (authenticated, auth.uid() = user_id)
- New columns inherit existing table RLS — no policy changes needed for templates/documents.
*/

-- 1. Add country to templates
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS country text;

-- 2. Create template_favorites table
CREATE TABLE IF NOT EXISTS template_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES document_templates(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, template_id)
);

ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_favorites" ON template_favorites;
CREATE POLICY "select_own_favorites" ON template_favorites
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_favorites" ON template_favorites;
CREATE POLICY "insert_own_favorites" ON template_favorites
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_favorites" ON template_favorites;
CREATE POLICY "delete_own_favorites" ON template_favorites
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON template_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_template ON template_favorites(template_id);

-- 3. Full-text search on documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS fts tsvector;

-- Populate fts for existing rows (dev env, safe)
UPDATE documents SET fts = to_tsvector('french', coalesce(title, '') || ' ' || coalesce(body, '')) WHERE fts IS NULL;

-- Generated column going forward so fts stays in sync automatically
-- (Cannot use GENERATED ALWAYS with to_tsvector easily across columns without a trigger,
--  so we use a trigger instead for robustness.)
CREATE OR REPLACE FUNCTION documents_fts_update()
RETURNS trigger AS $$
BEGIN
  NEW.fts := to_tsvector('french', coalesce(NEW.title, '') || ' ' || coalesce(NEW.body, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS documents_fts_trigger ON documents;
CREATE TRIGGER documents_fts_trigger
  BEFORE INSERT OR UPDATE OF title, body ON documents
  FOR EACH ROW EXECUTE FUNCTION documents_fts_update();

CREATE INDEX IF NOT EXISTS idx_documents_fts ON documents USING GIN (fts);
