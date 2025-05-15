const { getDB } = require('../config/database');
const { createResponse } = require('../utils/response');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/snowflake');
const { validateRole } = require('../models/roleModel');

const roleController = {
  
  createRole: async (req, res) => {
    try {
      const { name } = req.body;
      
      
      const validation = validateRole({ name });
      if (!validation.isValid) {
        return createResponse(res, 400, {
          status: false,
          errors: validation.errors.map(error => ({
            param: "name",
            message: error,
            code: "INVALID_INPUT"
          }))
        });
      }
      
      const db = getDB();
      
      
      const existingRole = await db.collection('roles').findOne({ name });
      if (existingRole) {
        return createResponse(res, 400, {
          status: false,
          errors: [{
            param: "name",
            message: "Role with this name already exists.",
            code: "RESOURCE_EXISTS"
          }]
        });
      }
      
    
      const roleId = generateId();
      const newRole = {
        id: roleId,
        name,
        scopes: [],
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await db.collection('roles').insertOne(newRole);
      
      createResponse(res, 201, {
        status: true,
        content: {
          data: {
            id: roleId,
            name: newRole.name,
            scopes: newRole.scopes,
            created_at: newRole.created_at,
            updated_at: newRole.updated_at
          }
        }
      });
    } catch (error) {
      logger.error('Error creating role:', error);
      createResponse(res, 500, {
        status: false,
        errors: [{
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR"
        }]
      });
    }
  },
  
  
  getAllRoles: async (req, res) => {
    try {
      const db = getDB();
      const roles = await db.collection('roles').find({}).toArray();
      
      createResponse(res, 200, {
        status: true,
        content: {
          data: roles.map(role => ({
            id: role.id,
            name: role.name,
            scopes: role.scopes,
            created_at: role.created_at,
            updated_at: role.updated_at
          })),
          meta: {
            total: roles.length,
            pages: 1,
            page: 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching roles:', error);
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

module.exports = roleController;
