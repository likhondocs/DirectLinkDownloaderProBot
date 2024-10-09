
# Direct Link Downloader Pro Bot

This advanced Telegram bot allows users to download files from direct links. It's built using Node.js and the Telegraf library, and it's designed to be deployed on Vercel with enhanced features and best practices.

## Features

- Download files from direct links
- Automatic file deletion after 1 hour to avoid rate limits
- Support for various file types
- Easy-to-use interface
- Logging for better debugging and monitoring
- Environment-based configuration

## Setup

1. Clone this repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env` file:
   - BOT_TOKEN: Your Telegram bot token
   - BLOB_READ_WRITE_TOKEN: Your Vercel Blob storage token
   - MAX_FILE_SIZE: Maximum file size in bytes (default: 52428800, 50 MB)
4. Deploy to Vercel: `npm run deploy`

## Development

- Run locally: `npm start`
- Run tests: `npm test`
- Lint code: `npm run lint`

## Support

For support, join our Telegram channel: [RexxCheat](https://t.me/RexxCheat)

## License

This project is licensed under the MIT License.
