const { getDB } = require('../config/database');
const { generateId } = require('../utils/snowflake');


const memberSchema = {
  id: {
    type: 'string',
    required: true,
    primaryKey: true
  },
  community: {
    type: 'string',
    required: true,
    ref: 'community'
  },
  user: {
    type: 'string',
    required: true,
    ref: 'user'
  },
  role: {
    type: 'string',
    required: true,
    ref: 'role'
  },
  created_at: {
    type: 'date',
    default: new Date()
  }
};


const validateMember = (memberData) => {
  const errors = [];
  
  
  if (!memberData.community) {
    errors.push('Community is required');
  }
  
  if (!memberData.user) {
    errors.push('User is required');
  }
  
  if (!memberData.role) {
    errors.push('Role is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};


const setupMemberCollection = async () => {
  const db = getDB();
  await db.collection('members').createIndex({ community: 1, user: 1 }, { unique: true });
};

module.exports = {
  memberSchema,
  validateMember,
  setupMemberCollection
};
