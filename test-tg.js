// Native fetch in Node

const token = '8275329397:AAFJxI9JWX7Zan9TJmmwlUxAl2I8SFMHC7U';
const chatId = '-5403275664';

async function testHTMLText() {
  const message = '🔔 <b>New Registration</b>\n\n<b>Event:</b> General Registration\n<b>Name:</b> Test HTML\n<b>Status:</b> New Non-Member\n<b>Contact Info:</b> test@test.com';
  let url = `https://api.telegram.org/bot${token}/sendMessage`;
  let body = {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML',
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  console.log('HTML Text Response:', data);
}

async function testSendPhoto() {
  const message = '🔔 <b>New Registration</b>\n\n<b>Event:</b> General Registration\n<b>Name:</b> Test Photo\n<b>Status:</b> New Non-Member\n<b>Contact Info:</b> test@test.com';
  // Use a generic valid public image url
  const imageUrl = 'https://picsum.photos/200';
  let url = `https://api.telegram.org/bot${token}/sendPhoto`;
  let body = {
    chat_id: chatId,
    photo: imageUrl,
    caption: message,
    parse_mode: 'HTML',
  };

  let response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  console.log('Send Photo Response:', data);
}

async function testFallback() {
  const message = '🔔 <b>New Registration</b>\n\n<b>Event:</b> General Registration\n<b>Name:</b> Test Fallback\n<b>Status:</b> New Non-Member\n<b>Contact Info:</b> test@test.com';
  const imageUrl = 'http://localhost:3000/api/raw?key=test.jpg'; // This will fail sendPhoto
  
  // Try sendPhoto first
  let url = `https://api.telegram.org/bot${token}/sendPhoto`;
  let body = {
    chat_id: chatId,
    photo: imageUrl,
    caption: message,
    parse_mode: 'HTML',
  };

  let response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!response.ok) {
     console.log('Send Photo Failed. Running Fallback...');
     url = `https://api.telegram.org/bot${token}/sendMessage`;
     body = {
       chat_id: chatId,
       text: message + `\n\n<b>Image URL:</b> <a href="${imageUrl}">Click to view</a>`,
       parse_mode: 'HTML',
     };
     response = await fetch(url, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(body)
     });
     const data = await response.json();
     console.log('Fallback Response:', data);
  }
}

async function run() {
  await testHTMLText();
  await testSendPhoto();
  await testFallback();
}
run();
