// Learner email notification dispatch.
//
// The SRS names "Email Service" as the secondary actor for the three learner
// notification triggers (UC-31 approve/reject join request, UC-45 assign study
// set, UC-46 publish exam session). In-app notifications live under
// `features/*/*.notifications.js`; this file only delivers email via Brevo.
//
// Every function here is NON-THROWING: a notification failure (e.g. Brevo not
// configured, a bad address, a network drop) must never roll back or break the
// core action that triggered it. Failures are logged and swallowed — this is
// the SRS "graceful degradation" behaviour for external services.

import { sendEmail } from "./email.service.js";
import { logger } from "./logger.js";

/**
 * Send one email, catching and logging any failure. Returns true on success.
 */
async function safeSend({ to, subject, htmlContent }) {
  if (!to) return false;
  try {
    await sendEmail({ to, subject, htmlContent });
    return true;
  } catch (err) {
    logger.error(`Notification email to ${to} failed:`, err.message);
    return false;
  }
}

/**
 * De-duplicate and drop empty addresses from a recipient list.
 * Recipients are { email, full_name } objects.
 */
function normalizeRecipients(recipients = []) {
  const seen = new Set();
  const out = [];
  for (const r of recipients) {
    const email = r?.email?.trim();
    if (!email || seen.has(email.toLowerCase())) continue;
    seen.add(email.toLowerCase());
    out.push({ email, full_name: r.full_name || "" });
  }
  return out;
}

/**
 * Send the same message to many learners without letting one bad send abort
 * the rest. Returns the count of successfully sent emails.
 */
async function dispatch(recipients, buildEmail) {
  const list = normalizeRecipients(recipients);
  const results = await Promise.all(
    list.map((recipient) =>
      safeSend({ to: recipient.email, ...buildEmail(recipient) })
    )
  );
  return results.filter(Boolean).length;
}

function greeting(name) {
  return name ? `Hi ${name},` : "Hi,";
}

/**
 * UC-31 — notify a learner that their class join request was resolved.
 * Sent on both approval and rejection (the SRS allows notifying on either).
 *
 * @param {object} args
 * @param {{email:string, full_name?:string}} args.learner
 * @param {string} args.className
 * @param {"approved"|"rejected"} args.status
 */
export async function notifyJoinRequestResolved({ learner, className, status }) {
  if (!learner?.email) return;

  const approved = status === "approved";
  const subject = approved
    ? `You've been added to ${className}`
    : `Update on your request to join ${className}`;
  const body = approved
    ? `<p>${greeting(learner.full_name)}</p>
       <p>Your request to join <strong>${className}</strong> has been approved. You can now access the class materials, assigned study sets, and available exams.</p>`
    : `<p>${greeting(learner.full_name)}</p>
       <p>Your request to join <strong>${className}</strong> was not approved. If you think this is a mistake, please contact your teacher.</p>`;

  try {
    await safeSend({ to: learner.email, subject, htmlContent: body });
  } catch {
    // safeSend never throws, but stay defensive so callers are never affected.
  }
}

/**
 * UC-45 — notify class learners that a study set was assigned to them.
 *
 * @param {object} args
 * @param {Array<{email:string, full_name?:string}>} args.learners
 * @param {string} args.studySetTitle
 * @param {string} [args.className]
 */
export async function notifyStudySetAssigned({
  learners,
  studySetTitle,
  className,
}) {
  const where = className ? ` in <strong>${className}</strong>` : "";

  const sent = await dispatch(learners, (recipient) => ({
    subject: `New study set assigned: ${studySetTitle}`,
    htmlContent: `<p>${greeting(recipient.full_name)}</p>
       <p>A new study set, <strong>${studySetTitle}</strong>, has been assigned to you${where}.</p>`,
  }));

  if (sent) logger.info(`Study set "${studySetTitle}" assignment notified to ${sent} learner(s).`);
}

/**
 * UC-46 — notify all learners in a class that an exam session was published.
 *
 * @param {object} args
 * @param {Array<{email:string, full_name?:string}>} args.learners
 * @param {string} args.examTitle
 * @param {string} [args.className]
 * @param {string} [args.startAt]  ISO date string
 */
export async function notifyExamPublished({ learners, examTitle, className, startAt }) {
  const where = className ? ` for <strong>${className}</strong>` : "";
  const when = startAt ? `<p>Starts: ${new Date(startAt).toLocaleString()}</p>` : "";

  const sent = await dispatch(learners, (recipient) => ({
    subject: `New exam scheduled: ${examTitle}`,
    htmlContent: `<p>${greeting(recipient.full_name)}</p>
       <p>A new exam, <strong>${examTitle}</strong>, has been published${where}. Please check your home page for the schedule and details.</p>
       ${when}`,
  }));

  if (sent) logger.info(`Exam "${examTitle}" publish notified to ${sent} learner(s).`);
}
