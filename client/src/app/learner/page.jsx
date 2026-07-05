"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import { dashboardsService } from "@/services/dashboards.service";
import { DashboardHeader } from "./_components/dashboard/dashboard-header";
import { DashboardState, LoadingDashboard } from "./_components/dashboard/dashboard-state";
import { LearnerDashboard } from "./_components/dashboard/learner-dashboard";

const EMPTY_DASHBOARD = {
  continueLearning: null,
  upcomingExams: [],
  assignedStudySets: [],
  classes: [],
};

function getErrorMessage(error) {
  return error?.response?.data?.error || error?.message || "Unable to load dashboard. Please try again.";
}

export default function LearnerDashboardPage() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

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
        <DashboardHeader />

        {error ? <DashboardState icon={AlertCircle} message={error} tone="error" /> : null}
        {loading ? <LoadingDashboard /> : null}
        {!loading && !error ? <LearnerDashboard dashboard={dashboard} /> : null}
      </section>
    </main>
  );
}
