import { Telegraf } from 'telegraf';
import axios from 'axios';
import { put } from '@vercel/blob';

const bot = new Telegraf(process.env.BOT_TOKEN);

// Handler function for Vercel
export default async function handler(req, res) {
  const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_SECRET_TOKEN;
  const secretToken = req.headers['x-telegram-bot-api-secret-token'];

  if (secretToken !== TELEGRAM_SECRET_TOKEN) {
    return res.status(401).send('Unauthorized');
  }

  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error handling update:', err);
    res.status(500).send('Error');
  }
}

// Telegraf handlers
bot.start((ctx) => {
  ctx.reply(
    '🚀 Welcome to DirectLinkDownloaderProBot! Send me any direct download link, and I will fetch the file for you!',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📁 Browse Files', callback_data: 'browse' }],
          [{ text: '🛠 Get Help', callback_data: 'help' }],
          [{ text: 'Support Channel', url: 'https://t.me/RexxCheat' }],
        ],
      },
    }
  );
});

bot.command('help', (ctx) => {
  ctx.reply(
    '🛠 *Help Menu*\n\nSend me any direct download link, and I will fetch the file for you.\n\n*Commands:*\n/start - Restart the bot\n/help - Show this help message',
    { parse_mode: 'Markdown' }
  );
});

bot.on('text', async (ctx) => {
  const url = ctx.message.text.trim();

  if (!isValidUrl(url)) {
    return ctx.reply('❌ Invalid URL! Please send a valid direct download link.');
  }

  const message = await ctx.reply('🔄 Fetching your file, please wait...');

  try {
    const headResponse = await axios.head(url);
    const contentLength = headResponse.headers['content-length'];
    const maxFileSize = 50 * 1024 * 1024; // 50 MB limit

    if (parseInt(contentLength) > maxFileSize) {
      return ctx.reply('❌ The file is too large to be sent over Telegram.');
    }

    const filename = getFilenameFromUrl(url, headResponse.headers);

    const response = await axios.get(url, { responseType: 'stream' });

    const blob = await put(filename, response.data, {
      access: 'temporary',
    });

    await ctx.replyWithDocument({ url: blob.url, filename }, {
      caption: `✅ Successfully downloaded: ${filename}`,
    });
  } catch (error) {
    console.error(error);
    ctx.reply('❌ There was an error downloading the file. Please check the URL and try again.');
  }
});

// Helper functions
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
