import { redirect } from "next/navigation";

// System Status has been removed from the Admin area (no longer in SRS scope
// for the admin app). This route is retired and redirects to the Admin
// dashboard. Safe to delete this file/folder when convenient.
export default function RetiredSystemStatusPage() {
  redirect("/admin/dashboard");
}
