// Restricts a route to specific roles. Must run AFTER requireAuth, since it
// relies on req.user being populated. Expects req.user.role to be set
// from users.active_role by requireAuth.
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role ?? req.user?.user_metadata?.role;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ ok: false, error: "Forbidden — insufficient role" });
    }

    next();
  };
}
