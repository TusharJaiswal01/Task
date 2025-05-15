const { createResponse } = require('../utils/response');
const userController = require('../controllers/userController');
const communityController = require('../controllers/communityController');
const memberController = require('../controllers/memberController');
const roleController = require('../controllers/roleController');
const authController = require('../controllers/authController');


const routes = {
  
  'v1/auth/signup': {
    'post': authController.signup
  },
  'v1/auth/signin': {
    'post': authController.signin
  },
  'v1/auth/me': {
    'get': authController.getMe
  },
  
  
  'v1/community': {
    'post': communityController.createCommunity,
    'get': communityController.getAllCommunities
  },
  'v1/community/me/owner': {
    'get': communityController.getMyOwnedCommunities
  },
  'v1/community/me/member': {
    'get': communityController.getMyJoinedCommunities
  },
  'v1/community/([^/]+)/members': {
    'get': (req, res) => {
      req.params = { id: req.pathParams[0] };
      return communityController.getAllMembers(req, res);
    }
  },
  
  
  'v1/member': {
    'post': memberController.addMember
  },
  'v1/member/([^/]+)': {
    'delete': (req, res) => {
      req.params = { id: req.pathParams[0] };
      return memberController.removeMember(req, res);
    }
  },
  
  
  'v1/role': {
    'post': roleController.createRole,
    'get': roleController.getAllRoles
  },
  
  
  'users': {
    'get': userController.getUsers,
    'post': userController.createUser
  },
  'users/([^/]+)': {
    'get': (req, res) => {
      req.params = { id: req.pathParams[0] };
      return userController.getUserById(req, res);
    }
  }
};


const router = (req, res) => {
  const { path, method } = req;
  
  
  let handler = null;
  let pathParams = [];
  
  for (const route in routes) {
    const regexPattern = `^${route}$`;
    const regex = new RegExp(regexPattern);
    const match = path.match(regex);
    
    if (match) {
      handler = routes[route][method.toLowerCase()];
      pathParams = match.slice(1);
      break;
    }
  }
  
 
  if (handler) {
    req.pathParams = pathParams;
    return handler(req, res);
  }
  

  createResponse(res, 404, { 
    status: false, 
    errors: [{
      message: "Route not found.",
      code: "NOT_FOUND"
    }]
  });
};

module.exports = router;
