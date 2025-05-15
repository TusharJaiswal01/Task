const { getDB } = require('../config/database');
const { generateId } = require('../utils/snowflake');


const userSchema = {
  id: {
    type: 'string',
    required: true,
    primaryKey: true
  },
  name: {
    type: 'string',
    maxLength: 64,
    default: null
  },
  email: {
    type: 'string',
    required: true,
    unique: true,
    maxLength: 128
  },
  password: {
    type: 'string',
    required: true,
    maxLength: 64
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


const validateUser = (userData) => {
  const errors = [];
  
 
  for (const [field, rules] of Object.entries(userSchema)) {
    if (rules.required && !userData[field] && field !== 'id') {
      errors.push(`${field} is required`);
    }
  }
  

  if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push('Invalid email format');
  }
  
  
  if (userData.name && userData.name.length > 64) {
    errors.push('Name cannot exceed 64 characters');
  }
  
 
  if (userData.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(userData.password)) {
    errors.push('Password must be at least 8 characters long, include at least one uppercase letter, one lowercase letter, one number, and one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};


const setupUserCollection = async () => {
  const db = getDB();
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
};

module.exports = {
  userSchema,
  validateUser,
  setupUserCollection
};
