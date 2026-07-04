import { JoinRequestStatus } from "../../models/join-request.model.js";
import { createNotification } from "../notifications/notifications.service.js";
import { logger } from "../../utils/logger.js";

export async function notifyTeacherOfJoinRequest(cls) {
  try {
    if (!cls?.teacher_id) return;

    await createNotification({
      userId: cls.teacher_id,
      title: "New class join request",
      message: `A learner requested to join ${cls.class_name}.`,
      targetUrl: `/teacher/classes/${cls.class_id}`,
    });
  } catch (err) {
    logger.error("Failed to create join request notification for teacher:", err.message);
  }
}

export async function notifyLearnerOfJoinRequestResolution({
  classId,
  className,
  learnerId,
  status,
}) {
  try {
    const approved = status === JoinRequestStatus.APPROVED;
    const displayClassName = className || "your class";

    await createNotification({
      userId: learnerId,
      title: approved ? "Class request approved" : "Class request rejected",
      message: approved
        ? `Your request to join ${displayClassName} has been approved.`
        : `Your request to join ${displayClassName} was rejected.`,
      targetUrl: approved ? `/learner/classes/${classId}` : "/learner/classes",
    });
  } catch (err) {
    logger.error("Failed to create join request resolution notification:", err.message);
  }
}
