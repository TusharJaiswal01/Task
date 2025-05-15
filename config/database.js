const { MongoClient } = require('mongodb');
const config = require('./config');
const { logger } = require('../utils/logger');


let db = null;
let client = null;

const connectDB = async () => {
  if (db) return db;
  
  try {
    client = new MongoClient(config.mongoUri);
    await client.connect();
    
    db = client.db();
    logger.info('MongoDB connected successfully');
    return db;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
};

const closeDB = async () => {
  if (client) {
    await client.close();
    logger.info('MongoDB connection closed');
    db = null;
    client = null;
  }
};

module.exports = { connectDB, getDB, closeDB };
