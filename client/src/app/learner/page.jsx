"use client";

import { useEffect, useState } from "react";
import { AlertCircle, DoorOpen } from "lucide-react";
import Link from "next/link";
import { dashboardsService } from "@/services/dashboards.service";
import {
  DashboardState,
  LoadingDashboard,
} from "./_components/dashboard/dashboard-state";
import { LearnerDashboard } from "./_components/dashboard/learner-dashboard";
import { Button } from "@/components/ui/button";

const EMPTY_DASHBOARD = {
  continueLearning: null,
  upcomingExams: [],
  assignedStudySets: [],
  classes: [],
};

/**
 * Pick a readable message from dashboard API failures.
 */
function getErrorMessage(error) {
  return (
    error?.response?.data?.error ||
    error?.message ||
    "Unable to load dashboard. Please try again."
  );
}

/**
 * Learner dashboard page: loads dashboard payload once and renders state panels.
 */
export default function LearnerDashboardPage() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    // Guard with `ignore` so late responses do not update an unmounted page.
    dashboardsService
      .getLearnerDashboard()
      .then((data) => {
        if (ignore) return;
        setDashboard({ ...EMPTY_DASHBOARD, ...data });
        setError("");
      })
      .catch((loadError) => {
        if (ignore) return;
        setDashboard(EMPTY_DASHBOARD);
        setError(getErrorMessage(loadError));
      })
      .finally(() => {
        if (ignore) return;
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-normal text-foreground">
              Learner Home
            </h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild>
              <Link href="/learner/classes/join">
                <DoorOpen className="size-4" />
                Join Class
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/learner/progress">View Progress</Link>
            </Button>
          </div>
        </header>

        {/* Dashboard States */}
        {error ? (
          <DashboardState icon={AlertCircle} message={error} tone="error" />
        ) : null}
        {loading ? <LoadingDashboard /> : null}
        {!loading && !error ? <LearnerDashboard dashboard={dashboard} /> : null}
      </section>
    </main>
  );
}
