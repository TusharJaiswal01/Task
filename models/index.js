const { userSchema, validateUser, setupUserCollection, generateSnowflakeId } = require('./userModel');
const { communitySchema, validateCommunity, setupCommunityCollection } = require('./communityModel');
const { roleSchema, validateRole, setupRoleCollection } = require('./roleModel');
const { memberSchema, validateMember, setupMemberCollection } = require('./memberModel');


const setupCollections = async () => {
  await setupUserCollection();
  await setupCommunityCollection();
  await setupRoleCollection();
  await setupMemberCollection();
  console.log('All collections and indexes set up successfully');
};

module.exports = {
  
  userSchema,
  validateUser,
  
 
  communitySchema,
  validateCommunity,
  
  
  roleSchema,
  validateRole,
  
  
  memberSchema,
  validateMember,
  
  
  generateSnowflakeId,
  setupCollections
};
