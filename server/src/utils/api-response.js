// Keeps every endpoint's response shape consistent: { ok, data | error }
export function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function fail(res, error, status = 400) {
  const message = typeof error === "string" ? error : error?.message || "Request failed";
  console.error("API Error:", error);
  return res.status(status).json({ ok: false, error: message });
}
