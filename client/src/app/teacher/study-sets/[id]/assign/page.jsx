"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Save, UserPlus, Users, AlertCircle } from "lucide-react";
import { studySetsService } from "@/services/study-sets.service";
import { Button } from "@/components/ui/button";
import ClassSelectorModal from "../../create/class-selector-modal";

export default function AssignStudySetPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  const [studySet, setStudySet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClassIds, setSelectedClassIds] = useState([]);
  const [selectedClassNames, setSelectedClassNames] = useState([]);
  const [showClassSelector, setShowClassSelector] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    async function fetchDetails() {
      setLoading(true);
      try {
        const res = await studySetsService.getOne(id);
        const data = res.data || null;
        setStudySet(data);
        if (data) {
          const assignments = data.study_set_assignments || [];
          const classIds = assignments.map((a) => a.class_id);
          const classNames = assignments.map((a) => a.classes?.class_name).filter(Boolean);
          setSelectedClassIds(classIds);
          setSelectedClassNames(classNames);
        }
      } catch (err) {
        console.error("Failed to load study set details:", err);
        const displayMsg = err.response?.data?.error || "Failed to load study set details. Please try again.";
        setError(displayMsg);
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [id]);

  const handleClassesConfirmed = (ids, names) => {
    setSelectedClassIds(ids);
    setSelectedClassNames(names);
    setShowClassSelector(false);
  };

  const handleClassSelectionCancelled = () => {
    setShowClassSelector(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await studySetsService.update(id, {
        classId: selectedClassIds,
      });

      router.push(`/teacher/study-sets/${id}`);
    } catch (err) {
      console.error("Failed to assign study set:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground font-semibold">Loading study set...</p>
        </div>
      </main>
    );
  }

  if (error || !studySet) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 rounded-2xl border border-border bg-card p-6 shadow-lg">
          <AlertCircle className="size-12 text-error mx-auto" />
          <h2 className="text-xl font-bold text-foreground">Error Occurred</h2>
          <p className="text-sm text-muted-foreground">{error || "Study set not found."}</p>
          <Button onClick={() => router.push("/teacher/study-sets")} className="w-full">
            Go Back
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <Button onClick={() => router.back()} variant="ghost" size="icon" type="button">
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Assign to Class</h1>
          </div>
        </div>

        {/* Study Set Metadata Card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-start border-b border-border pb-4">
            <div>
              <h2 className="text-xl font-bold text-foreground">{studySet.title}</h2>
              {studySet.description && (
                <p className="text-sm text-muted-foreground mt-1">{studySet.description}</p>
              )}
            </div>
            <span className="text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full capitalize">
              {studySet.visibility?.replace("_", " ")}
            </span>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="size-4 text-primary" />
                Assigned Classes ({selectedClassIds.length})
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowClassSelector(true)}
                className="gap-1.5"
              >
                <UserPlus size={14} />
                Select Classes
              </Button>
            </div>

            {selectedClassIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-xl p-8 bg-muted/10">
                <BookOpen className="size-8 text-muted-foreground/60 mb-2" />
                <p className="text-xs text-muted-foreground font-medium">No classes assigned to this study set yet.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 bg-muted/20 rounded-xl border border-border">
                {selectedClassNames.map((name, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground shadow-sm"
                  >
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save/Cancel Actions */}
        <div className="flex justify-end gap-3 border-t border-border pt-6">
          <Button
            onClick={() => router.back()}
            type="button"
            variant="outline"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save size={16} />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Class Selector Modal Popup */}
      {showClassSelector && (
        <ClassSelectorModal
          initialSelectedIds={selectedClassIds}
          onConfirm={handleClassesConfirmed}
          onCancel={handleClassSelectionCancelled}
        />
      )}

    </main>
  );
}
