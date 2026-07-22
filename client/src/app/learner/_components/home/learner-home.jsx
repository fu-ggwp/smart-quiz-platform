import { AssignedStudySetsPanel } from "./assigned-study-sets-panel";
import { ClassesPanel } from "./classes-panel";
import { ContinueLearningCard } from "./continue-learning-card";
import { UpcomingExamsPanel } from "./upcoming-exams-panel";

/**
 * Layout component for the normalized learner home page payload.
 */
export function LearnerHome({ home }) {
  return (
    <>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.75fr)]">
        <div className="space-y-5">
          <ContinueLearningCard item={home.continueLearning} />
          <AssignedStudySetsPanel items={home.assignedStudySets} />
          <ClassesPanel items={home.classes} />
        </div>
        <UpcomingExamsPanel items={home.upcomingExams} />
      </div>
    </>
  );
}
