
export const isAuthenticated = (req, res, next) => {
  // Debug: log session info to help diagnose "wrong user/session" issues
  try {
    // eslint-disable-next-line no-console
    console.log("[AuthMiddleware] session user:", req.session ? req.session.user : null);
  } catch (e) {}

  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: "ไม่ได้รับอนุญาต" });
};

export const isAdmin = (req, res, next) => {
  // Debug: log role for admin checks
  try {
    // eslint-disable-next-line no-console
    console.log("[AuthMiddleware] isAdmin check, session user:", req.session ? req.session.user : null);
  } catch (e) {}

  if (req.session?.user?.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "ห้าม: เฉพาะผู้ดูแลระบบเท่านั้น" });
};
