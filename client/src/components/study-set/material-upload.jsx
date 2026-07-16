import { useState } from "react";
import { Paperclip, Trash2, Loader2, Plus, Link2 } from "lucide-react";
import supabase from "@/lib/supabase-client";
import { Button } from "@/components/ui/button";

export default function MaterialUpload({ materials = [], onChange, onPreview }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkError, setLinkError] = useState("");

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);
    setError(null);

    const uploadedList = [...materials];

    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `materials/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from("study-set-materials")
          .upload(filePath, file, {
            onUploadProgress: (event) => {
              const percent = Math.round((event.loaded / event.total) * 100);
              setProgress(percent);
            },
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("study-set-materials")
          .getPublicUrl(filePath);

        uploadedList.push({
          material_url: publicUrl,
          material_name: file.name,
        });
      }

      onChange(uploadedList);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleLinkSubmit = () => {
    if (!linkUrl.trim()) {
      setLinkError("URL is required");
      return;
    }

    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    try {
      new URL(url);
    } catch (_) {
      setLinkError("Please enter a valid URL");
      return;
    }

    const title = linkTitle.trim() || url;
    onChange([...materials, {
      material_url: url,
      material_name: title,
    }]);

    setShowLinkInput(false);
    setLinkUrl("");
    setLinkTitle("");
    setLinkError("");
  };

  const handleRemove = (indexToRemove) => {
    const updated = materials.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  return (
    <div className="space-y-4 border border-border rounded-2xl p-5 bg-card/50 backdrop-blur-sm shadow-sm">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Paperclip className="size-4 text-primary" />
          <span>Study Materials</span>
        </label>
        
        <div className="flex items-center gap-2">
          <input
            type="file"
            id="material-file-input"
            multiple
            accept=".pdf, .docx, .doc, .pptx, .ppt, .xlsx, .xls, image/*, .txt"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById("material-file-input")?.click()}
            className="rounded-xl flex items-center gap-1 text-xs"
          >
            {uploading ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Plus className="size-3" />
            )}
            <span>Add File</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => setShowLinkInput(true)}
            className="rounded-xl flex items-center gap-1 text-xs"
          >
            <Link2 className="size-3" />
            <span>Add Link</span>
          </Button>
        </div>
      </div>

      {showLinkInput && (
        <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="text-xs font-semibold text-foreground">Attach a Link</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              type="text"
              placeholder="Link URL (e.g. https://...)"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="Link Title (optional)"
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowLinkInput(false);
                setLinkUrl("");
                setLinkTitle("");
                setLinkError("");
              }}
              className="h-7 text-xs rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleLinkSubmit}
              className="h-7 text-xs rounded-lg"
            >
              Add
            </Button>
          </div>
          {linkError && (
            <p className="text-[10px] text-destructive font-medium">{linkError}</p>
          )}
        </div>
      )}

      {uploading && (
        <div className="space-y-1.5 p-3 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>Uploading...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive font-medium">{error}</p>
      )}

      {materials.length > 0 ? (
        <div className="space-y-2">
          {materials.map((m, idx) => {
            const isLink = m.material_url.startsWith("http") && !m.material_url.includes("supabase.co/storage/v1/object/public/study-set-materials");
            const ext = isLink ? "LINK" : m.material_name.split(".").pop().toUpperCase();
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-background hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                    {ext}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (isLink) {
                        window.open(m.material_url, "_blank");
                      } else if (onPreview) {
                        onPreview(m);
                      }
                    }}
                    className="text-xs text-foreground font-medium truncate max-w-[200px] sm:max-w-md hover:text-primary hover:underline transition text-left"
                  >
                    {m.material_name}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(idx)}
                  className="size-8 rounded-lg text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        !uploading && (
          <p className="text-xs text-muted-foreground italic text-center py-2">
            No materials attached yet.
          </p>
        )
      )}
    </div>
  );
}
