export type VariableType = 'text' | 'textarea' | 'number' | 'date' | 'select';

export interface TemplateVariable {
  key: string;
  label: string;
  type: VariableType;
  required?: boolean;
  help?: string;
  sensitive?: boolean;
  options?: string[];
  default?: string;
}

export type ComplianceSeverity = 'error' | 'warning' | 'info';

export interface ComplianceRule {
  id: string;
  description: string;
  severity: ComplianceSeverity;
  expression: string;
}

export type TemplateCategory =
  | 'Constitution'
  | 'Fonctionnement'
  | 'Contrats'
  | 'Lettres'
  | 'Résolutions';

export interface DocumentTemplate {
  id: string;
  code: string;
  title: string;
  category: TemplateCategory;
  description: string | null;
  ohada_reference: string | null;
  body: string;
  variables: TemplateVariable[];
  compliance_rules: ComplianceRule[];
  is_active: boolean;
  version: number;
  country: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateFavorite {
  id: string;
  user_id: string;
  template_id: string;
  created_at: string;
}

export type DocumentStatus = 'draft' | 'validated' | 'archived';

export interface GeneratedDocument {
  id: string;
  template_id: string;
  title: string;
  values: Record<string, string | number>;
  body: string;
  status: DocumentStatus;
  warnings: ComplianceWarning[];
  created_at: string;
  updated_at: string;
}

export interface ComplianceWarning {
  rule_id: string;
  description: string;
  severity: ComplianceSeverity;
  field?: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  body: string;
  values: Record<string, string | number>;
  version_number: number;
  note: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}
