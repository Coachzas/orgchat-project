
export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: "ไม่ได้รับอนุญาต" });
};

export const isAdmin = (req, res, next) => {
  if (req.session.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "ห้าม: เฉพาะผู้ดูแลระบบเท่านั้น" });
};
