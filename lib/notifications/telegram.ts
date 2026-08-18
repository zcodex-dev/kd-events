export async function sendTelegramAlert(message: string, imageUrl?: string) {
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
    let body: any = {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML',
    };

    if (imageUrl) {
      // If it's a relative URL from our own uploads, we must make it absolute for Telegram
      if (imageUrl.startsWith('/')) {
        // Fallback to localhost if APP_URL is not set, though localhost won't work in prod Telegram
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000';
        imageUrl = `${baseUrl}${imageUrl}`;
      }

      url = `https://api.telegram.org/bot${token}/sendPhoto`;
      body = {
        chat_id: chatId,
        photo: imageUrl,
        caption: message,
        parse_mode: 'HTML',
      };
    }

    let response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorData = await response.json();
      
      // 1. Handle Telegram group to supergroup migration automatically
      if (errorData.parameters?.migrate_to_chat_id) {
        console.warn(`Chat migrated to supergroup. Retrying with new ID: ${errorData.parameters.migrate_to_chat_id}`);
        body.chat_id = errorData.parameters.migrate_to_chat_id;
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          errorData = await response.json();
        }
      }

      // 2. If it still failed and we tried to send a photo, fallback to text (likely localhost URL)
      if (!response.ok && imageUrl) {
        console.warn('Failed to send photo to Telegram (likely localhost URL). Falling back to text message.');
        url = `https://api.telegram.org/bot${token}/sendMessage`;
        body = {
          chat_id: body.chat_id, // Use the updated chat_id if migrated
          text: message + `\n\n<b>Image URL:</b> <a href="${imageUrl}">Click to view</a>`,
          parse_mode: 'HTML',
        };
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          errorData = await response.json();
        }
      }

      // 3. If all fails, log the final error
      if (!response.ok) {
        console.error('Failed to send Telegram alert:', errorData);
      }
    }
  } catch (error) {
    console.error('Error in sendTelegramAlert:', error);
  }
}
