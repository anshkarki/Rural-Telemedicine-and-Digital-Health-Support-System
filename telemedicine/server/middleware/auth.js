const jwt = require('jsonwebtoken');

const auth = (requiredRoles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      
      if (requiredRoles.length > 0 && !requiredRoles.includes(decoded.role)) {
        return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
      }
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid or expired token.' });
    }
  };
};

module.exports = auth;
