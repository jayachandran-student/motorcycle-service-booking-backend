import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("x-auth-token");

    // Check if no token
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Add user from payload to request
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};

export default auth;
