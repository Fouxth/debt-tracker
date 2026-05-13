require('dotenv').config();

const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const adminUserId = process.env.LINE_ADMIN_USER_ID;

async function testLine() {
  console.log('--- LINE Messaging API Test ---');
  console.log('Channel Access Token:', channelAccessToken ? '✅ Provided' : '❌ Missing');
  console.log('Admin User ID:', adminUserId ? '✅ Provided' : '⚠️ Missing (Needs U...)');

  if (!channelAccessToken) {
    console.error('Error: LINE_CHANNEL_ACCESS_TOKEN is missing in .env');
    return;
  }

  if (!adminUserId) {
    console.log('\n--- How to find your User ID ---');
    console.log('1. Go to LINE Developers Console');
    console.log('2. Select your provider and channel (Messaging API)');
    console.log('3. Go to "Messaging API" tab');
    console.log('4. Scroll down to "Your user ID" section');
    console.log('5. It should start with "U..." (e.g., U1234567890abcdef...)');
    console.log('\nOnce you have it, add it to your .env file as:');
    console.log('LINE_ADMIN_USER_ID=your_user_id_here');
    return;
  }

  console.log('\nSending test message to:', adminUserId);

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${channelAccessToken}`
      },
      body: JSON.stringify({
        to: adminUserId,
        messages: [{ type: 'text', text: '🚀 ทดสอบระบบแจ้งเตือน LINE Messaging API จากระบบ BKJ Tracker' }]
      })
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log('✅ Test message sent successfully!');
    } else {
      console.error('❌ Failed to send message:', response.status, data);
    }
  } catch (error) {
    console.error('❌ Request error:', error);
  }
}

testLine();
