export function formatDate(value) {
  if (!value) return "Not updated";
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatLabel(value) {
  if (!value) return "None";
  return value.charAt(0).toUpperCase() + value.slice(1).replaceAll("_", " ");
}

export function formatBankStatus(value) {
  if (value === "draft") return "Private";
  if (value === "reviewed") return "Assigned";
  return formatLabel(value);
}

export function getStatusTone(value) {
  if (value === "reviewed") return "green";
  if (value === "archived") return "red";
  return "neutral";
}
