import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const COOKIE_NAME = "token";


export const auth = (roles = []) => {
  if (typeof roles === "string") roles = [roles];

  return (req, res, next) => {
    try {
      // 1) Authorization header
      const authHeader = (req.headers?.authorization || "").toString();
      let token = null;
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.slice(7).trim();
      }

      // 2) fallback to cookie (httpOnly)
      if (!token && req.cookies && req.cookies[COOKIE_NAME]) {
        token = req.cookies[COOKIE_NAME];
      }

      if (!token) {
        return res.status(401).json({ message: "No token" });
      }

      // verify
      const payload = jwt.verify(token, process.env.JWT_SECRET);

      // attach a clean user object
      req.user = {
        id: payload.id,
        role: payload.role,
        name: payload.name,
        email: payload.email,
      };

      // role check (if provided)
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (err) {
      console.error("Auth middleware error:", err?.message || err);
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};
