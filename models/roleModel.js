const { getDB } = require('../config/database');
const { generateId } = require('../utils/snowflake');


const roleSchema = {
  id: {
    type: 'string',
    required: true,
    primaryKey: true
  },
  name: {
    type: 'string',
    required: true,
    maxLength: 64,
    unique: true
  },
  scopes: {
    type: 'array',
    default: []
  },
  created_at: {
    type: 'date',
    default: new Date()
  },
  updated_at: {
    type: 'date',
    default: new Date()
  }
};


const validateRole = (roleData) => {
  const errors = [];
  
  
  if (!roleData.name) {
    errors.push('Name is required');
  } else if (roleData.name.length > 64) {
    errors.push('Name cannot exceed 64 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};


const setupRoleCollection = async () => {
  const db = getDB();
  await db.collection('roles').createIndex({ name: 1 }, { unique: true });
};


const COMMUNITY_ADMIN = "Community Admin";
const COMMUNITY_MEMBER = "Community Member";


const setupDefaultRoles = async () => {
  const db = getDB();
  
 
  const adminRole = await db.collection('roles').findOne({ name: COMMUNITY_ADMIN });
  const memberRole = await db.collection('roles').findOne({ name: COMMUNITY_MEMBER });
  
  
  if (!adminRole) {
    const adminRoleId = generateId();
    await db.collection('roles').insertOne({
      id: adminRoleId,
      name: COMMUNITY_ADMIN,
      scopes: ["community:update", "member:add", "member:remove"],
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  
  if (!memberRole) {
    const memberRoleId = generateId();
    await db.collection('roles').insertOne({
      id: memberRoleId,
      name: COMMUNITY_MEMBER,
      scopes: ["community:view"],
      created_at: new Date(),
      updated_at: new Date()
    });
  }
};

module.exports = {
  roleSchema,
  validateRole,
  setupRoleCollection,
  setupDefaultRoles,
  ROLE_NAMES: {
    COMMUNITY_ADMIN,
    COMMUNITY_MEMBER
  }
};
