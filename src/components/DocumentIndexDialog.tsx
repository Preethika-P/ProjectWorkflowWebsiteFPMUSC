import { ExternalLink, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface DocumentIndexItem {
  id: string;
  name: string;
  url: string;
  description?: string;
  fileType: string;
  locations: string[];
}

interface DocumentIndexDialogProps {
  documents: DocumentIndexItem[];
  onClose: () => void;
}

export function DocumentIndexDialog({ documents, onClose }: DocumentIndexDialogProps) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/35 px-4 py-6">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-xl border-2 border-primary/20 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-primary/10 bg-gradient-to-br from-primary/5 to-white px-6 py-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-primary">Reference Documents List</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-primary/5"
            aria-label="Close document index"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((document) => (
                <div
                  key={document.id}
                  className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 to-white p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/20 text-primary">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold leading-snug text-slate-900">
                            {document.name}
                          </h3>
                          <span className="rounded-md border border-accent/40 bg-accent/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                            {document.fileType}
                          </span>
                        </div>
                        {document.description ? (
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            {document.description}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 rounded-md border-2 border-primary bg-white px-2.5 py-1 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                      onClick={() => window.open(document.url, '_blank', 'noreferrer')}
                    >
                      <span>{document.fileType === 'PDF' ? 'Open PDF' : 'Open Doc'}</span>
                      <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                      Appears In
                    </div>
                    <div className="space-y-1.5">
                      {document.locations.map((location) => (
                        <div
                          key={location}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-700"
                        >
                          {location}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-slate-500">
              No reference documents are available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
