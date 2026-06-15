"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  BookOpen, 
  Search, 
  GraduationCap, 
  User, 
  Calendar, 
  Clock, 
  AlertCircle, 
  ChevronRight 
} from "lucide-react";
import { studySetsService } from "@/services/study-sets.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export default function LearnerStudySetsPage() {
  const router = useRouter();
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all"); 
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await studySetsService.listLearnerStudySets();
        setStudySets(res.data || []);
        setError(null);
      } catch (err) {
        console.error("Failed to load learner study sets:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);
  const filteredStudySets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    
    return studySets.filter((set) => {
      const textToSearch = [
        set.title,
        set.subject,
        set.topic,
        set.description,
        set.teacher?.full_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query || textToSearch.includes(query);
      let matchesTab = true;
      if (activeTab === "assigned") {
        matchesTab = set.is_assigned;
      } else if (activeTab === "started") {
        matchesTab = set.source_type === "public-started";
      }
      return matchesQuery && matchesTab;
    });
  }, [studySets, searchQuery, activeTab]);
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-6">
        
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold text-foreground">My Study Sets</h1>
          <p className="text-sm text-muted-foreground">
            Access assigned study sets from your classes and keep track of your self-study materials.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card p-4 rounded-xl border border-border">
          <div className="flex bg-muted/50 p-1 rounded-lg self-start border border-border">
            {[
              { id: "all", label: "All sets" },
              { id: "assigned", label: "Assigned" },
              { id: "started", label: "Self-study" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search study sets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 w-full rounded-lg"
            />
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-card border border-border rounded-xl p-5 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-muted rounded-full"></div>
                  <div className="h-4 w-12 bg-muted rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-6 w-3/4 bg-muted rounded"></div>
                  <div className="h-4 w-full bg-muted rounded"></div>
                </div>
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <div className="h-4 w-20 bg-muted rounded"></div>
                  <div className="h-4 w-16 bg-muted rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <StatePanel
            icon={<AlertCircle className="size-6 text-destructive" />}
            title="Failed to load study sets"
            description="We encountered an error connecting to the server. Please check your internet connection and try again."
            action={<Button onClick={() => window.location.reload()}>Try Again</Button>}
          />
        ) : filteredStudySets.length === 0 ? (
          <StatePanel
            icon={<BookOpen className="size-6 text-muted-foreground" />}
            title={searchQuery ? "No search results" : "No study sets found"}
            description={
              searchQuery
                ? "Try searching for different terms or reset the search query."
                : activeTab === "assigned"
                ? "You don't have any study sets assigned. Join a class using a code to receive study sets."
                : activeTab === "started"
                ? "You haven't started any self-study sets yet. Browse public study sets to start."
                : "You don't have any study sets available at the moment."
            }
            action={
              searchQuery ? (
                <Button variant="secondary" onClick={() => setSearchQuery("")}>Reset Search</Button>
              ) : activeTab === "started" ? (
                <Button onClick={() => router.push("/search")}>Browse Public Sets</Button>
              ) : activeTab === "assigned" ? (
                <Button onClick={() => router.push("/learner/classes/join")}>Join Class</Button>
              ) : null
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudySets.map((set) => {
              const id = set.study_set_id;
              
              return (
                <div
                  key={id}
                  onClick={() => router.push(`/learner/study-sets/${id}`)}
                  className="group relative flex flex-col justify-between bg-card rounded-xl border border-border p-5 hover:border-ring/50 hover:shadow-md cursor-pointer transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-center gap-2">
                      {set.is_assigned ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-500 ring-1 ring-amber-500/20">
                          <GraduationCap className="size-3" />
                          {set.assigned_class?.class_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-500 ring-1 ring-blue-500/20">
                          Self-Study
                        </span>
                      )}
                      <span className="text-xs font-semibold text-muted-foreground">
                        {set.question_count} questions
                      </span>
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-150 line-clamp-1">
                        {set.title}
                      </h3>
                      <p className="text-xs font-semibold text-muted-foreground">
                        {set.subject || "General"} {set.topic ? `• ${set.topic}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground line-clamp-2 pt-1 min-h-[40px]">
                        {set.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-border mt-4 pt-4 flex justify-between items-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="size-3.5" />
                      Created by <strong className="font-semibold text-foreground">{set.teacher?.full_name || "Teacher"}</strong>
                    </span>
                    {set.is_started && set.last_studied_at ? (
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <Clock className="size-3.5" />
                        In progress
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 hover:text-primary font-medium">
                        Study now
                        <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
function StatePanel({ action, description, icon, title }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center flex flex-col items-center justify-center space-y-4">
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          {icon}
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}