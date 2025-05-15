const { getDB } = require('../config/database');
const { createResponse } = require('../utils/response');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/snowflake');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { validateUser } = require('../models/userModel');

const authController = {
  
  signup: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      
      const validation = validateUser({ name, email, password });
      if (!validation.isValid) {
        return createResponse(res, 400, {
          status: false,
          errors: validation.errors.map(error => ({
            param: error.split(' ')[0].toLowerCase(),
            message: error,
            code: "INVALID_INPUT"
          }))
        });
      }
      
      const db = getDB();
      
      
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return createResponse(res, 400, {
          status: false,
          errors: [{
            param: "email",
            message: "User with this email address already exists.",
            code: "RESOURCE_EXISTS"
          }]
        });
      }
      
     
      const salt = crypto.randomBytes(16).toString('hex');
      const hashedPassword = crypto.pbkdf2Sync(
        password,
        salt,
        1000,
        64,
        'sha512'
      ).toString('hex');
      
      
      const userId = generateId();
      const newUser = {
        id: userId,
        name,
        email,
        password: `${salt}:${hashedPassword}`,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await db.collection('users').insertOne(newUser);
      
   
      const token = jwt.sign(
        { id: userId },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      
      createResponse(res, 201, {
        status: true,
        content: {
          data: {
            id: userId,
            name,
            email,
            created_at: newUser.created_at
          },
          meta: {
            access_token: token
          }
        }
      });
    } catch (error) {
      logger.error('Error signing up user:', error);
      createResponse(res, 500, {
        status: false,
        errors: [{
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR"
        }]
      });
    }
  },
  
  
  signin: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return createResponse(res, 400, {
          status: false,
          errors: [{
            param: !email ? "email" : "password",
            message: `${!email ? "Email" : "Password"} is required.`,
            code: "INVALID_INPUT"
          }]
        });
      }
      
      const db = getDB();
      
      
      const user = await db.collection('users').findOne({ email });
      if (!user) {
        return createResponse(res, 401, {
          status: false,
          errors: [{
            param: "email",
            message: "The credentials you provided are invalid.",
            code: "INVALID_CREDENTIALS"
          }]
        });
      }
      
   
      const [salt, storedHash] = user.password.split(':');
      const hash = crypto.pbkdf2Sync(
        password,
        salt,
        1000,
        64,
        'sha512'
      ).toString('hex');
      
      if (hash !== storedHash) {
        return createResponse(res, 401, {
          status: false,
          errors: [{
            param: "password",
            message: "The credentials you provided are invalid.",
            code: "INVALID_CREDENTIALS"
          }]
        });
      }
      
      
      const token = jwt.sign(
        { id: user.id },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );
      
      createResponse(res, 200, {
        status: true,
        content: {
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            created_at: user.created_at
          },
          meta: {
            access_token: token
          }
        }
      });
    } catch (error) {
      logger.error('Error signing in user:', error);
      createResponse(res, 500, {
        status: false,
        errors: [{
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR"
        }]
      });
    }
  },
  
  getMe: async (req, res) => {
    try {
      
      if (!req.user) {
        return createResponse(res, 401, {
          status: false,
          errors: [{
            message: "You need to sign in to proceed.",
            code: "NOT_AUTHENTICATED"
          }]
        });
      }
      
      createResponse(res, 200, {
        status: true,
        content: {
          data: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            created_at: req.user.created_at
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching current user:', error);
      createResponse(res, 500, {
        status: false,
        errors: [{
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR"
        }]
      });
    }
  }
};

module.exports = authController;
