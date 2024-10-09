
const axios = require('axios');
const { put, del } = require('@vercel/blob');
const { schedule } = require('@vercel/cron');
const config = require('../config');
const logger = require('./logger');

const startHandler = (ctx) => {
  ctx.reply(
    '🚀 Welcome to Direct Link Downloader Pro Bot! Send me any direct download link, and I will fetch the file for you!',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📁 Browse Files', callback_data: 'browse' }],
          [{ text: '🛠 Get Help', callback_data: 'help' }],
          [{ text: 'Support Channel', url: 'https://t.me/RexxCheat' }]
        ]
      }
    }
  );
};

const helpHandler = (ctx) => {
  ctx.reply(
    '🛠 *Help Menu*\n\nSend me any direct download link, and I will fetch the file for you.\n\n*Commands:*\n/start - Restart the bot\n/help - Show this help message',
    { parse_mode: 'Markdown' }
  );
};

const downloadHandler = async (ctx) => {
  const url = ctx.message.text.trim();

  if (!isValidUrl(url)) {
    return ctx.reply('❌ Invalid URL! Please send a valid direct download link.');
  }

  const message = await ctx.reply('🔄 Fetching your file, please wait...');

  try {
    const headResponse = await axios.head(url);
    const contentLength = headResponse.headers['content-length'];

    if (parseInt(contentLength) > config.maxFileSize) {
      return ctx.reply('❌ The file is too large to be sent over Telegram.');
    }

    const filename = getFilenameFromUrl(url, headResponse.headers);
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    const blob = await put(filename, response.data, {
      access: 'public',
      addRandomSuffix: true,
      token: config.blobToken
    });

    await ctx.replyWithDocument({ url: blob.url, filename }, { caption: `✅ Successfully downloaded: ${filename}` });
    
    const removeDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
    schedule(\`remove-file-\${blob.url}\`, removeDate, async () => {
      try {
        await del(blob.url, { token: config.blobToken });
        logger.info(\`File removed: \${filename}\`);
      } catch (error) {
        logger.error(\`Error removing file \${filename}: \`, error);
      }
    });

  } catch (error) {
    logger.error('Error downloading file:', error);
    ctx.reply('❌ There was an error downloading the file. Please check the URL and try again.');
  }
};

function isValidUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

function getFilenameFromUrl(url, headers) {
  const disposition = headers['content-disposition'];
  if (disposition && disposition.includes('filename=')) {
    const matches = disposition.match(/filename="?(.+)"?/);
    return matches ? matches[1] : 'file';
  } else {
    return decodeURIComponent(new URL(url).pathname.split('/').pop());
  }
}

module.exports = {
  startHandler,
  helpHandler,
  downloadHandler
};
