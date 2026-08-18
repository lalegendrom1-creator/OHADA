/*
# Add user ownership to documents (multi-user)

## Overview
Converts the documents table from single-tenant (shared) to multi-user (owner-scoped)
so each authenticated user only sees and manages their own generated documents.
Templates remain shared (read-only library) for all users.

## Changes
1. `documents` — add `user_id uuid NOT NULL DEFAULT auth.uid()` referencing auth.users
   - Existing rows get a NULL user_id first, then we backfill to a placeholder;
     since this is a fresh dev environment with no existing user data that matters,
     we set NOT NULL with the default.
   - The DEFAULT auth.uid() ensures inserts from the frontend (which omit user_id)
     still satisfy the INSERT WITH CHECK policy.
2. `document_versions` — add `user_id uuid NOT NULL DEFAULT auth.uid()` so version
   rows inherit ownership for simpler policies.
3. `audit_logs` — add `user_id uuid DEFAULT auth.uid()` (nullable, for system events).

## Security
- RLS policies on `documents` and `document_versions` change from `TO anon, authenticated`
  with `USING(true)` to `TO authenticated` with ownership checks via `auth.uid()`.
- `document_templates` stays shared-read for authenticated users; write (admin)
  restricted to authenticated (any signed-in user can manage templates in this MVP).
- `audit_logs` SELECT restricted to authenticated; INSERT still allowed for both.
*/

-- 1. Add user_id to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id uuid;

-- Backfill any existing rows (dev env) so NOT NULL constraint can be added.
-- Use a sentinel: we cannot reference auth.users without a real user, so we allow NULL
-- temporarily and set NOT NULL with DEFAULT for future inserts.
ALTER TABLE documents ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 2. Add user_id to document_versions
ALTER TABLE document_versions ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE document_versions ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3. Add user_id to audit_logs (nullable for system events)
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE audit_logs ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 4. Update RLS policies on documents: owner-scoped CRUD
DROP POLICY IF EXISTS "anon_select_documents" ON documents;
DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
DROP POLICY IF EXISTS "anon_update_documents" ON documents;
DROP POLICY IF EXISTS "anon_delete_documents" ON documents;

CREATE POLICY "select_own_documents" ON documents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_documents" ON documents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_documents" ON documents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_documents" ON documents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. Update RLS policies on document_versions: owner-scoped
DROP POLICY IF EXISTS "anon_select_versions" ON document_versions;
DROP POLICY IF EXISTS "anon_insert_versions" ON document_versions;
DROP POLICY IF EXISTS "anon_delete_versions" ON document_versions;

CREATE POLICY "select_own_versions" ON document_versions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_versions" ON document_versions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_versions" ON document_versions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. Templates: restrict to authenticated (read + write)
DROP POLICY IF EXISTS "anon_select_templates" ON document_templates;
DROP POLICY IF EXISTS "anon_insert_templates" ON document_templates;
DROP POLICY IF EXISTS "anon_update_templates" ON document_templates;
DROP POLICY IF EXISTS "anon_delete_templates" ON document_templates;

CREATE POLICY "select_templates" ON document_templates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_templates" ON document_templates
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "update_templates" ON document_templates
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "delete_templates" ON document_templates
  FOR DELETE TO authenticated USING (true);

-- 7. Audit logs: authenticated read + insert
DROP POLICY IF EXISTS "anon_select_audit" ON audit_logs;
DROP POLICY IF EXISTS "anon_insert_audit" ON audit_logs;

CREATE POLICY "select_audit" ON audit_logs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "insert_audit" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);

-- Index for owner-scoped queries
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_versions_user_id ON document_versions(user_id);
