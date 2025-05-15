const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const config = require('../config/config');
const { logger } = require('../utils/logger');

const extractToken = (req) => {
  if (!req.headers.authorization) return null;
  
  const parts = req.headers.authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
};


const authenticate = async (req) => {
  try {
    const token = extractToken(req);
    if (!token) return null;
    
    const decoded = jwt.verify(token, config.jwtSecret);
    const db = getDB();
    
    const user = await db.collection('users').findOne(
      { id: decoded.id },
      { projection: { password: 0 } }
    );
    
    if (!user) return null;
    
    return user;
  } catch (error) {
    logger.error('Authentication error:', error);
    return null;
  }
};


const applyAuth = async (req) => {
  req.user = await authenticate(req);
  return req;
};

module.exports = { applyAuth };
