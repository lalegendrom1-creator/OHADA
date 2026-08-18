import { History, FileText, ShieldCheck, CheckCircle2, Archive } from 'lucide-react';
import type { AuditLog } from '@/lib/types';

interface Props {
  logs: AuditLog[];
}

const ACTION_ICONS: Record<string, typeof History> = {
  create: FileText,
  update: History,
  validate: CheckCircle2,
  archive: Archive,
  template_update: ShieldCheck,
};

const ACTION_LABELS: Record<string, string> = {
  create: 'Création',
  update: 'Modification',
  validate: 'Validation',
  archive: 'Archivage',
  template_update: 'Modèle modifié',
};

const ENTITY_LABELS: Record<string, string> = {
  document: 'Document',
  template: 'Modèle',
};

export default function HistoryPanel({ logs }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <History size={24} className="text-amber-500" />
          Journal d'audit
        </h1>
        <p className="text-slate-500 mt-1">
          Traçabilité de toutes les modifications (documents et modèles).
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <History size={32} className="mx-auto mb-3 opacity-40" />
          <p>Aucune action enregistrée.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const Icon = ACTION_ICONS[log.action] || History;
              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800 text-sm">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                      <span className="text-xs text-slate-400">
                        {ENTITY_LABELS[log.entity] || log.entity}
                      </span>
                    </div>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {log.details.title as string || JSON.stringify(log.details).slice(0, 80)}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
