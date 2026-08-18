import type {
  TemplateVariable,
  ComplianceRule,
  ComplianceWarning,
} from './types';

export type Values = Record<string, string | number>;

const DATE_FORMATTER = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

function formatValue(
  variable: TemplateVariable | undefined,
  raw: string | number | undefined,
): string {
  if (raw === undefined || raw === null || raw === '') return '';
  if (variable?.type === 'date' && typeof raw === 'string') {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return DATE_FORMATTER.format(d);
  }
  if (variable?.type === 'number' && typeof raw === 'number') {
    return new Intl.NumberFormat('fr-FR').format(raw);
  }
  return String(raw);
}

export function extractVariables(body: string): string[] {
  const matches = body.matchAll(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of matches) {
    if (!seen.has(m[1])) {
      seen.add(m[1]);
      out.push(m[1]);
    }
  }
  return out;
}

export function renderTemplate(
  body: string,
  variables: TemplateVariable[],
  values: Values,
): string {
  const byKey = new Map(variables.map((v) => [v.key, v]));
  return body.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, key: string) => {
    const variable = byKey.get(key);
    return formatValue(variable, values[key]);
  });
}

function evalExpression(
  expression: string,
  values: Values,
): boolean | null {
  try {
    const keys = Object.keys(values);
    const vals = keys.map((k) => values[k]);
    const fn = new Function(...keys, `"use strict"; return (${expression});`);
    return Boolean(fn(...vals));
  } catch {
    return null;
  }
}

export function runComplianceChecks(
  rules: ComplianceRule[],
  variables: TemplateVariable[],
  values: Values,
): ComplianceWarning[] {
  const warnings: ComplianceWarning[] = [];
  const byKey = new Map(variables.map((v) => [v.key, v]));
  for (const rule of rules) {
    const passed = evalExpression(rule.expression, values);
    if (passed === false) {
      warnings.push({
        rule_id: rule.id,
        description: rule.description,
        severity: rule.severity,
      });
    } else if (passed === null) {
      warnings.push({
        rule_id: rule.id,
        description: `Règle non évaluable : ${rule.description}`,
        severity: 'info',
      });
    }
  }
  for (const v of variables) {
    if (v.required && (values[v.key] === undefined || values[v.key] === '')) {
      warnings.push({
        rule_id: `required_${v.key}`,
        description: `Le champ « ${v.label} » est obligatoire.`,
        severity: 'error',
        field: v.key,
      });
    }
  }
  return warnings;
}

export function missingRequiredFields(
  variables: TemplateVariable[],
  values: Values,
): string[] {
  return variables
    .filter((v) => v.required && !values[v.key])
    .map((v) => v.key);
}

export function defaultValueFor(variable: TemplateVariable): string {
  if (variable.default) return variable.default;
  if (variable.type === 'select' && variable.options?.length) return variable.options[0];
  return '';
}
