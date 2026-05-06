import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4">
      <div className="w-full max-w-md rounded-xl border-2 border-primary/20 bg-white shadow-2xl">
        <div className="border-b border-primary/10 bg-gradient-to-br from-primary/5 to-white px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-primary">{title}</h2>
        </div>
        <div className="space-y-3 px-6 py-5">
          <p className="text-sm leading-relaxed text-slate-700">{message}</p>
          <p className="flex items-center gap-2 text-xs italic leading-relaxed text-slate-500">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
            <span>This action cannot be undone.</span>
          </p>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-primary"
          >
            Cancel
          </Button>
          <Button type="button" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
