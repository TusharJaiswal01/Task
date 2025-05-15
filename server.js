const http = require('http');
const { URL } = require('url');
const router = require('./routes/router');
const { connectDB } = require('./config/database');
const { logger } = require('./utils/logger');
const config = require('./config/config');
const { applyAuth } = require('./middleware/auth');
const { setupDefaultRoles } = require('./models/roleModel');

const initializeApp = async () => {
  await connectDB();
  await setupDefaultRoles();
  logger.info('Database connected and default roles created');
};


initializeApp().catch(err => {
  logger.error('Failed to initialize application:', err);
  process.exit(1);
});

const server = http.createServer(async (req, res) => {
  
  logger.info(`${req.method} ${req.url}`);
  
  
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');
  
  
  const queryParams = {};
  for (const [key, value] of parsedUrl.searchParams.entries()) {
    queryParams[key] = value;
  }
  
  
  let body = [];
  req.on('data', (chunk) => {
    body.push(chunk);
  }).on('end', async () => {
    body = Buffer.concat(body).toString();
    
    
    let parsedBody = {};
    if (req.headers['content-type'] === 'application/json') {
      try {
        parsedBody = JSON.parse(body);
      } catch (error) {
        logger.error('Failed to parse JSON body:', error);
      }
    }
    
    
    let requestContext = {
      path: trimmedPath,
      query: queryParams,
      method: req.method,
      headers: req.headers,
      body: parsedBody
    };
    
    
    requestContext = await applyAuth(requestContext);
    
    
    router(requestContext, res);
  });
});

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});


process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
});

module.exports = server;
