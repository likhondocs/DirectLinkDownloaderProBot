
const { Telegraf } = require('telegraf');
const config = require('../config');
const logger = require('../src/logger');
const { startHandler, helpHandler, downloadHandler } = require('../src/botHandlers');

const bot = new Telegraf(config.botToken);

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    serveHtmlPage(res);
    return;
  }

  if (req.method === 'POST') {
    try {
      await bot.handleUpdate(req.body);
      res.status(200).send('OK');
    } catch (err) {
      logger.error('Error handling update:', err);
      res.status(500).send('Error');
    }
  }
};

function serveHtmlPage(res) {
  const htmlContent = \`
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
        <meta property="og:image" content="https://example.com/bot-preview-image.jpg">
        <link rel="stylesheet" href="/public/styles.css">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #0088cc; }
            a { color: #0088cc; text-decoration: none; }
            a:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <h1>Welcome to Direct Link Downloader Pro Bot!</h1>
        <p>Use this bot to download files directly through Telegram without hassle. Join the bot <a href="https://t.me/DirectLinkDownloaderProBot">here</a>.</p>
        <p>Features:</p>
        <ul>
            <li>Download files from direct links</li>
            <li>Automatic file deletion after 1 hour</li>
            <li>Support for various file types</li>
            <li>Easy-to-use interface</li>
        </ul>
        <p>Need help? Visit our support channel: <a href="https://t.me/RexxCheat">Support Channel</a></p>
    </body>
    </html>
  \`;
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(htmlContent);
}

bot.start(startHandler);
bot.command('help', helpHandler);
bot.on('text', downloadHandler);

bot.catch((err) => {
  logger.error('Telegraf error:', err);
});
