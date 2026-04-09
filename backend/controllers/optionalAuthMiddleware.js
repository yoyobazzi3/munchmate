import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const optionalAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      // Invalid token — treat as unauthenticated, don't block
    }
  }
  next();
};

export default optionalAuthMiddleware;
