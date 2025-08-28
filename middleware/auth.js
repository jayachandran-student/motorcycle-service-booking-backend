import jwt from "jsonwebtoken";

export const auth = (roles = []) => {
  if (typeof roles === "string") roles = [roles];
  return (req, res, next) => {
    try {
      const token = (req.headers.authorization || "").replace("Bearer ", "");
      if (!token) return res.status(401).json({ message: "No token" });
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      if (roles.length && !roles.includes(decoded.role)) return res.status(403).json({ message: "Forbidden" });
      next();
    } catch {
      res.status(401).json({ message: "Invalid token" });
    }
  };
};
