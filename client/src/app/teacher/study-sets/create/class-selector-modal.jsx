"use client";

import { useState, useEffect } from "react";
import { AlertCircle, BookOpen, Check, Search } from "lucide-react";
import classesService from "@/services/classes.service";
import { Button } from "@/components/ui/button";

export default function ClassSelectorModal({
  initialSelectedIds = [],
  onConfirm,
  onCancel,
}) {
  const [classes, setClasses] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set(initialSelectedIds));
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    async function fetchClasses() {
      setLoading(true);
      try {
        const data = await classesService.listMine();
        setClasses(data || []);
      } catch (err) {
        console.error("Failed to load classes:", err);
        setError("Failed to load classes. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchClasses();
  }, []);

  const handleToggleClass = (classId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(classId)) {
        next.delete(classId);
      } else {
        next.add(classId);
      }
      setValidationError(""); // clear validation error once checked
      return next;
    });
  };

  const handleSelectAll = () => {
    const filtered = classes.filter((c) =>
      (c.class_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.add(c.class_id));
      setValidationError("");
      return next;
    });
  };

  const handleDeselectAll = () => {
    const filtered = classes.filter((c) =>
      (c.class_name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSelectedIds((prev) => {
      const next = new Set(prev);
      filtered.forEach((c) => next.delete(c.class_id));
      return next;
    });
  };

  const handleConfirm = () => {
    const selectedList = classes.filter((c) => selectedIds.has(c.class_id));
    const ids = selectedList.map((c) => c.class_id);
    const names = selectedList.map((c) => c.class_name);

    onConfirm(ids, names);
  };

  const filteredClasses = classes.filter((c) =>
    (c.class_name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-xl font-bold text-foreground">Select Classes</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Select one or more classes to assign this study set.
            </p>
          </div>
        </div>

        {/* Search */}
        {!loading && !error && classes.length > 0 && (
          <div className="relative flex items-center">
            <Search className="absolute left-3 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search classes..."
              className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-xs outline-none focus:border-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        {/* Validation or Load Error */}
        {error && (
          <p className="text-sm font-semibold text-error bg-error/10 p-3 rounded-xl border border-error/20">
            {error}
          </p>
        )}
        {validationError && (
          <div className="flex items-center gap-2 text-sm font-semibold text-error bg-error/10 p-3 rounded-xl border border-error/20">
            <AlertCircle className="size-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* Selection Options */}
        {!loading && !error && filteredClasses.length > 0 && (
          <div className="flex justify-end gap-2 text-xs font-semibold">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-primary hover:underline"
            >
              Select All
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-primary hover:underline"
            >
              Deselect All
            </button>
          </div>
        )}

        {/* Classes List */}
        <div className="border border-border rounded-xl bg-muted/20 max-h-[220px] overflow-y-auto p-2">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-6">Loading classes...</p>
          ) : classes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">You don&apos;t own any classes yet.</p>
          ) : filteredClasses.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No classes match your search.</p>
          ) : (
            <div className="space-y-1">
              {filteredClasses.map((c) => {
                const isChecked = selectedIds.has(c.class_id);
                return (
                  <label
                    key={c.class_id}
                    className="flex items-center gap-3 p-2.5 hover:bg-muted/50 rounded-lg cursor-pointer transition text-xs font-medium"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-input text-primary focus:ring-primary size-4 cursor-pointer"
                      checked={isChecked}
                      onChange={() => handleToggleClass(c.class_id)}
                    />
                    <BookOpen className="size-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground truncate font-semibold">{c.class_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Code: {c.class_code || "N/A"}
                      </p>
                    </div>
                    {isChecked && <Check className="size-4 text-success shrink-0" />}
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button onClick={onCancel} variant="outline" size="sm" type="button">
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            size="sm"
            type="button"
            disabled={loading || !!error}
          >
            Confirm {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
