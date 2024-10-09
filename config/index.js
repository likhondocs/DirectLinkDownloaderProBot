
require('dotenv').config();

module.exports = {
  botToken: process.env.BOT_TOKEN,
  blobToken: process.env.BLOB_READ_WRITE_TOKEN,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 52428800, // 50 MB
};
