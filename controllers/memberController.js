const { getDB } = require('../config/database');
const { createResponse } = require('../utils/response');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/snowflake');
const { validateMember } = require('../models/memberModel');
const { ROLE_NAMES } = require('../models/roleModel');

const memberController = {
 
  addMember: async (req, res) => {
    try {
      const { community, user, role } = req.body;
      
      
      if (!req.user) {
        return createResponse(res, 401, {
          status: false,
          errors: [{
            message: "You need to sign in to proceed.",
            code: "NOT_AUTHENTICATED"
          }]
        });
      }
      
     
      const validation = validateMember({ community, user, role });
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
      
   
      const communityExists = await db.collection('communities').findOne({ id: community });
      if (!communityExists) {
        return createResponse(res, 404, {
          status: false,
          errors: [{
            param: "community",
            message: "Community not found.",
            code: "RESOURCE_NOT_FOUND"
          }]
        });
      }
      
      
      const adminRole = await db.collection('roles').findOne({ name: ROLE_NAMES.COMMUNITY_ADMIN });
      if (!adminRole) {
        return createResponse(res, 500, {
          status: false,
          errors: [{
            message: "Internal Server Error",
            code: "INTERNAL_SERVER_ERROR"
          }]
        });
      }
      
      const isAdmin = await db.collection('members').findOne({
        community,
        user: req.user.id,
        role: adminRole.id
      });
      
      if (!isAdmin) {
        return createResponse(res, 403, {
          status: false,
          errors: [{
            message: "You are not authorized to perform this action.",
            code: "NOT_AUTHORIZED"
          }]
        });
      }
      
     
      const userExists = await db.collection('users').findOne({ id: user });
      if (!userExists) {
        return createResponse(res, 404, {
          status: false,
          errors: [{
            param: "user",
            message: "User not found.",
            code: "RESOURCE_NOT_FOUND"
          }]
        });
      }
      
      
      const roleExists = await db.collection('roles').findOne({ id: role });
      if (!roleExists) {
        return createResponse(res, 404, {
          status: false,
          errors: [{
            param: "role",
            message: "Role not found.",
            code: "RESOURCE_NOT_FOUND"
          }]
        });
      }
      
      
      const existingMember = await db.collection('members').findOne({
        community,
        user
      });
      
      if (existingMember) {
        return createResponse(res, 400, {
          status: false,
          errors: [{
            message: "User is already added in the community.",
            code: "RESOURCE_EXISTS"
          }]
        });
      }
      
     
      const memberId = generateId();
      const newMember = {
        id: memberId,
        community,
        user,
        role,
        created_at: new Date()
      };
      
      await db.collection('members').insertOne(newMember);
      
      createResponse(res, 201, {
        status: true,
        content: {
          data: {
            id: memberId,
            community,
            user,
            role,
            created_at: newMember.created_at
          }
        }
      });
    } catch (error) {
      logger.error('Error adding member:', error);
      createResponse(res, 500, {
        status: false,
        errors: [{
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR"
        }]
      });
    }
  },
  

  removeMember: async (req, res) => {
    try {
      const { id } = req.params;
      
      
      if (!req.user) {
        return createResponse(res, 401, {
          status: false,
          errors: [{
            message: "You need to sign in to proceed.",
            code: "NOT_AUTHENTICATED"
          }]
        });
      }
      
      const db = getDB();
      
      
      const member = await db.collection('members').findOne({ id });
      if (!member) {
        return createResponse(res, 404, {
          status: false,
          errors: [{
            message: "Member not found.",
            code: "RESOURCE_NOT_FOUND"
          }]
        });
      }
      
      
      const community = await db.collection('communities').findOne({ id: member.community });
      
      
      const adminRole = await db.collection('roles').findOne({ name: ROLE_NAMES.COMMUNITY_ADMIN });
      
      
      const isAdmin = await db.collection('members').findOne({
        community: member.community,
        user: req.user.id,
        role: adminRole.id
      });
      
     
      if (community.owner !== req.user.id && !isAdmin) {
        return createResponse(res, 403, {
          status: false,
          errors: [{
            message: "You are not authorized to perform this action.",
            code: "NOT_AUTHORIZED"
          }]
        });
      }
      
      
      await db.collection('members').deleteOne({ id });
      
      createResponse(res, 200, {
        status: true
      });
    } catch (error) {
      logger.error('Error removing member:', error);
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

module.exports = memberController;
