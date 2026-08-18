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

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send Telegram alert:', errorData);
    }
  } catch (error) {
    console.error('Error in sendTelegramAlert:', error);
  }
}
