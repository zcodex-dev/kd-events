export async function sendTelegramAlert(message: string) {
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

    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send Telegram alert:', errorData);
    }
  } catch (error) {
    console.error('Error in sendTelegramAlert:', error);
  }
}
