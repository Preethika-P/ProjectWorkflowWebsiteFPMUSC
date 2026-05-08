import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { PdfApprovalDetails } from '@/lib/exportWorkflow';

interface PdfExportDialogProps {
  onCancel: () => void;
  onSubmit: (details: PdfApprovalDetails) => void;
}

export function PdfExportDialog({ onCancel, onSubmit }: PdfExportDialogProps) {
  const [projectName, setProjectName] = useState('');
  const [fullName, setFullName] = useState('');
  const [directorApprovalName, setDirectorApprovalName] = useState('');
  const canSubmit =
    projectName.trim().length > 0 &&
    fullName.trim().length > 0 &&
    directorApprovalName.trim().length > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 px-4">
      <form
        className="w-full max-w-md rounded-xl border-2 border-primary/20 bg-white shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;

          onSubmit({
            projectName: projectName.trim(),
            fullName: fullName.trim(),
            directorApprovalName: directorApprovalName.trim(),
          });
        }}
      >
        <div className="border-b border-primary/10 bg-gradient-to-br from-primary/5 to-white px-6 py-4">
          <h2 className="font-serif text-xl font-bold text-primary">PDF Export Details</h2>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="space-y-1.5">
            <label htmlFor="pdf-export-project-name" className="text-sm font-semibold text-slate-700">
              Project Name:
            </label>
            <input
              id="pdf-export-project-name"
              type="text"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              className="h-11 w-full rounded-md border-2 border-primary/20 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary"
              placeholder="Enter project name"
              autoFocus
              required
            />
          </div>
          <p className="text-sm font-semibold text-slate-700">Enter the full names:</p>
          <div className="space-y-1.5">
            <label htmlFor="pdf-export-full-name" className="text-sm font-semibold text-slate-700">
              Prepared By:
            </label>
            <input
              id="pdf-export-full-name"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="h-11 w-full rounded-md border-2 border-primary/20 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary"
              placeholder="Enter prepared by full name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pdf-export-director-name" className="text-sm font-semibold text-slate-700">
              Director to Approve:
            </label>
            <input
              id="pdf-export-director-name"
              type="text"
              value={directorApprovalName}
              onChange={(event) => setDirectorApprovalName(event.target.value)}
              className="h-11 w-full rounded-md border-2 border-primary/20 bg-white px-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-primary"
              placeholder="Enter director to approve full name"
              required
            />
          </div>
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
          <Button type="submit" disabled={!canSubmit}>
            Continue to PDF
          </Button>
        </div>
      </form>
    </div>
  );
}
