const { Snowflake } = require('@theinternetfolks/snowflake');

const generateId = () => {
  return Snowflake.generate();
};

module.exports = { generateId };
