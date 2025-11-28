// utils/logger.js
export const logInfo = (message, data = null) => {
  console.log(`ℹ️  [INFO]: ${message}`);
  if (data) console.log(data);
};

export const logError = (message, error = null) => {
  console.error(`❌ [ERROR]: ${message}`);
  if (error) console.error(error);
};
