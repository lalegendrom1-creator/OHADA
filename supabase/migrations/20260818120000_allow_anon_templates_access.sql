/*
# Allow anon and authenticated access to document_templates and audit_logs

## Overview
Ensures that the dedicated admin portal (which authenticates using the dedicated admin password)
can fetch, create, update, and delete document templates and write audit logs.

## Changes
1. `document_templates`: allow SELECT, INSERT, UPDATE, DELETE for `anon, authenticated`.
2. `audit_logs`: allow SELECT, INSERT for `anon, authenticated`.
*/

DROP POLICY IF EXISTS "select_templates" ON document_templates;
CREATE POLICY "select_templates" ON document_templates
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_templates" ON document_templates;
CREATE POLICY "insert_templates" ON document_templates
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_templates" ON document_templates;
CREATE POLICY "update_templates" ON document_templates
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_templates" ON document_templates;
CREATE POLICY "delete_templates" ON document_templates
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "select_audit" ON audit_logs;
CREATE POLICY "select_audit" ON audit_logs
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_audit" ON audit_logs;
CREATE POLICY "insert_audit" ON audit_logs
  FOR INSERT TO anon, authenticated WITH CHECK (true);
