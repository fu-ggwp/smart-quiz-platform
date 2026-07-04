import { createNotification } from "../notifications/notifications.service.js";
import { logger } from "../../utils/logger.js";

function uniqueLearners(learners = []) {
  const seen = new Set();
  const unique = [];

  for (const learner of learners) {
    if (!learner?.user_id || seen.has(learner.user_id)) continue;
    seen.add(learner.user_id);
    unique.push(learner);
  }

  return unique;
}

export async function notifyLearnersOfStudySetAssignment({
  learners,
  studySetId,
  studySetTitle,
}) {
  const recipients = uniqueLearners(learners);
  if (recipients.length === 0) return;

  const results = await Promise.allSettled(
    recipients.map((learner) =>
      createNotification({
        userId: learner.user_id,
        title: "New study set assigned",
        message: `${studySetTitle} has been assigned to you.`,
        targetUrl: `/learner/study-sets/${studySetId}`,
      }),
    ),
  );

  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length > 0) {
    logger.error(`Failed to create ${failed.length} study set assignment notification(s).`);
  }
}
