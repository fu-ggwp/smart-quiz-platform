// Keeps every endpoint's response shape consistent: { ok, data | error }
export function ok(res, data, status = 200) {
  return res.status(status).json({ ok: true, data });
}

export function httpError(message, status = 400, fields) {
  return Object.assign(new Error(message), {
    status,
    statusCode: status,
    fields,
  });
}

export function fail(res, error, status = 400) {
  const message = typeof error === "string" ? error : error?.message || "Request failed";
  console.error("API Error:", error);

  return res.status(status).json({
    ok: false,
    error: message,
    ...(error?.fields ? { fields: error.fields } : {}),
  });
}
