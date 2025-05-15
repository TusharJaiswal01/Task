const { getDB } = require('../config/database');
const { generateId } = require('../utils/snowflake');


const communitySchema = {
  id: {
    type: 'string',
    required: true,
    primaryKey: true
  },
  name: {
    type: 'string',
    required: true,
    maxLength: 128
  },
  slug: {
    type: 'string',
    required: true,
    maxLength: 255,
    unique: true
  },
  owner: {
    type: 'string',
    required: true,
    ref: 'user'
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


const validateCommunity = (communityData) => {
  const errors = [];
  
  
  if (!communityData.name) {
    errors.push('Name is required');
  } else if (communityData.name.length > 128) {
    errors.push('Name cannot exceed 128 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};


const setupCommunityCollection = async () => {
  const db = getDB();
  await db.collection('communities').createIndex({ slug: 1 }, { unique: true });
};


const generateSlug = (name) => {
  return name.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 255);
};

module.exports = {
  communitySchema,
  validateCommunity,
  setupCommunityCollection,
  generateSlug
};
