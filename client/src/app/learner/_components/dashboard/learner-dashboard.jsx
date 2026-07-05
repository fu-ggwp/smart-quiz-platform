import { AssignedStudySetsPanel } from "./assigned-study-sets-panel";
import { ClassesPanel } from "./classes-panel";
import { ContinueLearningCard } from "./continue-learning-card";
import { EmptyDashboard } from "./dashboard-state";
import { UpcomingExamsPanel } from "./upcoming-exams-panel";

export function LearnerDashboard({ dashboard }) {
  const hasAnyWork = Boolean(
    dashboard.continueLearning ||
      dashboard.upcomingExams.length ||
      dashboard.assignedStudySets.length ||
      dashboard.classes.length,
  );

  return (
    <>
      {!hasAnyWork ? <EmptyDashboard /> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
        <div className="space-y-5">
          <ContinueLearningCard item={dashboard.continueLearning} />
          <AssignedStudySetsPanel items={dashboard.assignedStudySets} />
          <ClassesPanel items={dashboard.classes} />
        </div>
        <UpcomingExamsPanel items={dashboard.upcomingExams} />
      </div>
    </>
  );
}
