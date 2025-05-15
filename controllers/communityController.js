const { getDB } = require('../config/database');
const { createResponse } = require('../utils/response');
const { logger } = require('../utils/logger');
const { generateId } = require('../utils/snowflake');
const { validateCommunity, generateSlug } = require('../models/communityModel');
const { ROLE_NAMES } = require('../models/roleModel');

const communityController = {
 
  createCommunity: async (req, res) => {
    try {
      const { name } = req.body;
      
      
      if (!req.user) {
        return createResponse(res, 401, {
          status: false,
          errors: [{
            message: "You need to sign in to proceed.",
            code: "NOT_AUTHENTICATED"
          }]
        });
      }
      
      
      const validation = validateCommunity({ name });
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
      
      
      const slug = generateSlug(name);
      
      
      const existingCommunity = await db.collection('communities').findOne({ slug });
      if (existingCommunity) {
        return createResponse(res, 400, {
          status: false,
          errors: [{
            param: "name",
            message: "Community with this name already exists.",
            code: "RESOURCE_EXISTS"
          }]
        });
      }
      
      
      const communityId = generateId();
      const newCommunity = {
        id: communityId,
        name,
        slug,
        owner: req.user.id,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      await db.collection('communities').insertOne(newCommunity);
      
      
      const adminRole = await db.collection('roles').findOne({ name: ROLE_NAMES.COMMUNITY_ADMIN });
      
      if (!adminRole) {
        return createResponse(res, 500, {
          status: false,
          errors: [{
            message: "Could not find admin role.",
            code: "INTERNAL_SERVER_ERROR"
          }]
        });
      }
      
      
      const memberId = generateId();
      const ownerMember = {
        id: memberId,
        community: communityId,
        user: req.user.id,
        role: adminRole.id,
        created_at: new Date()
      };
      
      await db.collection('members').insertOne(ownerMember);
      
      createResponse(res, 201, {
        status: true,
        content: {
          data: {
            id: communityId,
            name: newCommunity.name,
            slug: newCommunity.slug,
            owner: newCommunity.owner,
            created_at: newCommunity.created_at,
            updated_at: newCommunity.updated_at
          }
        }
      });
    } catch (error) {
      logger.error('Error creating community:', error);
      createResponse(res, 500, {
        status: false,
        errors: [{
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR"
        }]
      });
    }
  },
  
  
  getAllCommunities: async (req, res) => {
    try {
      const db = getDB();
      const communities = await db.collection('communities').find({}).toArray();
      
      createResponse(res, 200, {
        status: true,
        content: {
          data: communities.map(community => ({
            id: community.id,
            name: community.name,
            slug: community.slug,
            owner: community.owner,
            created_at: community.created_at,
            updated_at: community.updated_at
          })),
          meta: {
            total: communities.length,
            pages: 1,
            page: 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching communities:', error);
      createResponse(res, 500, {
        status: false,
        errors: [{
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR"
        }]
      });
    }
  },
  
 
  getAllMembers: async (req, res) => {
    try {
      const { id } = req.params;
      const db = getDB();
      
      
      const community = await db.collection('communities').findOne({ id });
      if (!community) {
        return createResponse(res, 404, {
          status: false,
          errors: [{
            message: "Community not found.",
            code: "RESOURCE_NOT_FOUND"
          }]
        });
      }
      
      const members = await db.collection('members')
        .find({ community: id })
        .toArray();
      
     
      const memberDetails = [];
      for (const member of members) {
        const user = await db.collection('users').findOne({ id: member.user });
        const role = await db.collection('roles').findOne({ id: member.role });
        
        if (user && role) {
          memberDetails.push({
            id: member.id,
            community: member.community,
            user: {
              id: user.id,
              name: user.name
            },
            role: {
              id: role.id,
              name: role.name
            },
            created_at: member.created_at
          });
        }
      }
      
      createResponse(res, 200, {
        status: true,
        content: {
          data: memberDetails,
          meta: {
            total: memberDetails.length,
            pages: 1,
            page: 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching community members:', error);
      createResponse(res, 500, {
        status: false,
        errors: [{
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR"
        }]
      });
    }
  },
  
  
  getMyOwnedCommunities: async (req, res) => {
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
      
      const db = getDB();
      const communities = await db.collection('communities')
        .find({ owner: req.user.id })
        .toArray();
      
      createResponse(res, 200, {
        status: true,
        content: {
          data: communities.map(community => ({
            id: community.id,
            name: community.name,
            slug: community.slug,
            owner: community.owner,
            created_at: community.created_at,
            updated_at: community.updated_at
          })),
          meta: {
            total: communities.length,
            pages: 1,
            page: 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching owned communities:', error);
      createResponse(res, 500, {
        status: false,
        errors: [{
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR"
        }]
      });
    }
  },
  
  
  getMyJoinedCommunities: async (req, res) => {
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
      
      const db = getDB();
      const memberships = await db.collection('members')
        .find({ user: req.user.id })
        .toArray();
      
      const communityIds = memberships.map(member => member.community);
      
      const communities = await db.collection('communities')
        .find({ id: { $in: communityIds } })
        .toArray();
      
      createResponse(res, 200, {
        status: true,
        content: {
          data: communities.map(community => ({
            id: community.id,
            name: community.name,
            slug: community.slug,
            owner: community.owner,
            created_at: community.created_at,
            updated_at: community.updated_at
          })),
          meta: {
            total: communities.length,
            pages: 1,
            page: 1
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching joined communities:', error);
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

module.exports = communityController;
