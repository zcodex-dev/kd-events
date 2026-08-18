require('dotenv').config();
const fetch = require('node-fetch');

async function sendTelegramAlert(message, imageUrl) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('TELEGRAM_BOT_TOKEN is missing. Skipping alert.');
      return;
    }

    let chatId = process.env.TELEGRAM_CHAT_ID;
    
    // If no specific chat ID is provided, fetch the last person who messaged the bot
    if (!chatId || chatId.trim() === '') {
      const updatesRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
      const updates = await updatesRes.json();
      
      if (updates.ok && updates.result && updates.result.length > 0) {
        // Get the chat ID from the most recent message
        chatId = updates.result[updates.result.length - 1].message.chat.id.toString();
      } else {
        console.warn('TELEGRAM_CHAT_ID is missing and no recent messages found via getUpdates.');
        return;
      }
    }

    let url = `https://api.telegram.org/bot${token}/sendMessage`;
    let body = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    };

    if (imageUrl) {
      url = `https://api.telegram.org/bot${token}/sendPhoto`;
      body = {
        chat_id: chatId,
        photo: imageUrl,
        caption: message,
        parse_mode: 'Markdown',
      };
    }

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok && imageUrl) {
      console.warn('Failed to send photo to Telegram (likely localhost URL). Falling back to text message.');
      url = `https://api.telegram.org/bot${token}/sendMessage`;
      body = {
        chat_id: chatId,
        text: message + `\n\n*Image URL:* [Click to view](${imageUrl})`,
        parse_mode: 'Markdown',
      };
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send Telegram alert:', errorData);
    } else {
      console.log('Success!');
    }
  } catch (error) {
    console.error('Error in sendTelegramAlert:', error);
  }
}

sendTelegramAlert('🔔 *New Registration Test*\n\nName: Fallback Test', 'http://localhost:3000/api/raw?key=test.jpg');
