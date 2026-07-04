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

export async function notifyLearnersOfExamPublished({
  learners,
  examId,
  examTitle,
  className,
}) {
  const recipients = uniqueLearners(learners);
  if (recipients.length === 0) return;

  const where = className ? ` for ${className}` : "";
  const results = await Promise.allSettled(
    recipients.map((learner) =>
      createNotification({
        userId: learner.user_id,
        title: "New exam assigned",
        message: `${examTitle} has been published${where}.`,
        targetUrl: `/learner/exams/${examId}`,
      }),
    ),
  );

  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length > 0) {
    logger.error(`Failed to create ${failed.length} exam notification(s).`);
  }
}
