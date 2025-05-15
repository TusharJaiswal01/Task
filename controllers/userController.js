const { getDB } = require('../config/database');
const { createResponse } = require('../utils/response');
const { logger } = require('../utils/logger');
const crypto = require('crypto');
const { generateId } = require('../utils/snowflake');
const { setupDefaultRoles } = require('../models/roleModel');

const userController = {
  
  getUsers: async (req, res) => {
    try {
      const db = getDB();
      const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
      
      createResponse(res, 200, {
        status: true,
        content: {
          data: users,
          meta: {
            total: users.length,
            pages: 1,
            page: 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching users:', error);
      createResponse(res, 500, { 
        status: false, 
        errors: [{
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR"
        }]
      });
    }
  },
  
  
  getUserById: async (req, res) => {
    try {
      const userId = req.params.id;
      const db = getDB();
      
      const user = await db.collection('users').findOne(
        { id: userId },
        { projection: { password: 0 } }
      );
      
      if (!user) {
        return createResponse(res, 404, { 
          status: false, 
          errors: [{
            message: "User not found.",
            code: "RESOURCE_NOT_FOUND"
          }]
        });
      }
      
      createResponse(res, 200, { 
        status: true, 
        content: {
          data: user
        }
      });
    } catch (error) {
      logger.error('Error fetching user:', error);
      createResponse(res, 500, { 
        status: false, 
        errors: [{
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR"
        }]
      });
    }
  },
  
  
  createUser: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      
      if (!name || !email || !password) {
        return createResponse(res, 400, { 
          status: false, 
          errors: [{
            param: !name ? "name" : !email ? "email" : "password",
            message: `${!name ? "Name" : !email ? "Email" : "Password"} is required.`,
            code: "INVALID_INPUT"
          }]
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
      
      
      const { password: _, ...userWithoutPassword } = newUser;
      
      createResponse(res, 201, { 
        status: true,
        content: {
          data: userWithoutPassword
        }
      });
    } catch (error) {
      logger.error('Error creating user:', error);
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


setupDefaultRoles().catch(err => {
  logger.error('Failed to set up default roles on startup:', err);
});

module.exports = userController;
