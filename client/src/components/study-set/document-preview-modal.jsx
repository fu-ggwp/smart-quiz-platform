import React from "react";
import { X, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import DocumentViewer from "./document-viewer";

export default function DocumentPreviewModal({ isOpen, onClose, materialUrl, materialName }) {
  if (!isOpen || !materialUrl) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background/95 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md shrink-0">
            {materialName.split(".").pop().toUpperCase()}
          </span>
          <h2 className="text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-md" title={materialName}>
            {materialName}
          </h2>
        </div>
        
        <div className="flex items-center gap-3">
          <a
            href={`${materialUrl}?download=${encodeURIComponent(materialName)}`}
            download={materialName}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <Download className="size-4" />
            <span className="hidden sm:inline">Download</span>
          </a>

          <a
            href={materialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <ExternalLink className="size-4" />
            <span className="hidden sm:inline">Open in New Tab</span>
          </a>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground size-9"
          >
            <X className="size-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 w-full p-4 md:p-6 bg-muted/20 overflow-hidden flex items-center justify-center">
        <div className="w-full h-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl border border-border bg-white flex flex-col">
          <DocumentViewer materialUrl={materialUrl} materialName={materialName} />
        </div>
      </div>
    </div>
  );
}
