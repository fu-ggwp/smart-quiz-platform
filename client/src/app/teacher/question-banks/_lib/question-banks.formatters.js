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
  return formatLabel(value);
}

export function getStatusTone(value) {
  if (value === "Assigned") return "green";
  if (value === "Deleted") return "red";
  return "neutral";
}