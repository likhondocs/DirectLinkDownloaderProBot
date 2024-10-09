import { Telegraf } from 'telegraf';
import axios from 'axios';
import { put } from '@vercel/blob';
import { schedule } from '@vercel/cron';

const bot = new Telegraf(process.env.BOT_TOKEN);

// Main handler for all requests
export default async function handler(req, res) {
  // Check if the request is for the root URL to serve the HTML page
  if (req.url === "/") {
    serveHtmlPage(res);
    return;
  }

  try {
    await bot.handleUpdate(req.body);
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error handling update:', err);
    res.status(500).send('Error');
  }
}

// Function to serve HTML content
function serveHtmlPage(res) {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Direct Link Downloader Pro Bot</title>
        <meta name="description" content="Automatically download files with Direct Link Downloader Pro Bot on Telegram!">
        <meta property="og:title" content="Direct Link Downloader Pro Bot">
        <meta property="og:description" content="Automatically download files directly through Telegram!">
        <meta property="og:url" content="https://t.me/DirectLinkDownloaderProBot">
        <meta property="og:type" content="website">
        <meta property="og:image" content="url_to_image_for_social_media_preview">
    </head>
    <body>
        <h1>Welcome to Direct Link Downloader Pro Bot!</h1>
        <p>Use this bot to download files directly through Telegram without hassle. Join the bot <a href="https://t.me/DirectLinkDownloaderProBot">here</a>.</p>
        <p>Need help? Visit our support channel: <a href="https://t.me/RexxCheat">Support Channel</a></p>
    </body>
    </html>
  `;
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(htmlContent);
}

// Telegraf handlers
bot.start((ctx) => {
  ctx.reply(
    '🚀 Welcome to Direct Link Downloader Pro Bot! Send me any direct download link, and I will fetch the file for you!',
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
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    
    const blob = await put(filename, response.data, {
      access: 'public',
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    await ctx.replyWithDocument({ url: blob.url, filename }, { caption: `✅ Successfully downloaded: ${filename}` });
    
    // Schedule file removal after 7 days
    const removeDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    schedule(`remove-file-${blob.url}`, removeDate, async () => {
      try {
        await axios.delete(blob.url, {
          headers: { Authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
        });
        console.log(`File removed: ${filename}`);
      } catch (error) {
        console.error(`Error removing file ${filename}:`, error);
      }
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
