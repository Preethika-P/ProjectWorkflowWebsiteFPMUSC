import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, FileText } from 'lucide-react';
import type { ReferenceDocument } from '@/types';

interface ReferenceDocumentsPanelProps {
  documents: ReferenceDocument[];
  sticky?: boolean;
}

export function ReferenceDocumentsPanel({ documents, sticky = true }: ReferenceDocumentsPanelProps) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <Card className={sticky ? 'sticky top-24 border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-white shadow-lg' : 'border-2 border-accent/30 bg-gradient-to-br from-accent/5 to-white shadow-lg'}>
      <CardHeader>
        <CardTitle className="font-serif text-xl font-bold text-slate-900">
          Reference Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.map((document) => (
          <a
            key={document.id}
            href={document.url}
            target="_blank"
            rel="noreferrer"
            className="group block rounded-2xl border border-accent/30 bg-white px-4 py-4 transition-all hover:border-accent/50 hover:shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-accent/15 text-primary">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold leading-snug text-slate-900 group-hover:text-primary">
                    {document.name}
                  </p>
                  <ExternalLink className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                </div>
                {document.description ? (
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    {document.description}
                  </p>
                ) : null}
                <div className="mt-3 inline-flex items-center gap-2 rounded-md border-2 border-primary px-3 py-1.5 text-sm font-medium text-primary transition-colors group-hover:bg-primary/10">
                  <span>Open Doc</span>
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            </div>
          </a>
        ))}
      </CardContent>
    </Card>
  );
}
