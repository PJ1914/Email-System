/**
 * TRAE Orchestration End-to-End Test
 * Run: node test-trae.mjs
 */
import http from 'http';

const sesNotification = {
  notificationType: 'Received',
  mail: {
    source: 'recruiter@gmail.com',
    destination: ['hr@codetapasya.com'],
    timestamp: new Date().toISOString(),
    commonHeaders: {
      subject: 'Urgent: 3 interview slots needed by Friday EOD',
    },
  },
  content: [
    'From: recruiter@gmail.com',
    'To: hr@codetapasya.com',
    'Subject: Urgent: 3 interview slots needed by Friday EOD',
    'MIME-Version: 1.0',
    'Content-Type: text/plain',
    '',
    'Hi Team,',
    '',
    'We have shortlisted 3 candidates for the Senior Software Engineer role.',
    'Please share available interview slots before Friday 5 PM IST.',
    'Also confirm if we need a technical round before the HR round.',
    '',
    'This is time-sensitive — please respond ASAP.',
    '',
    'Thanks,',
    'Raj Kumar',
  ].join('\r\n'),
};

const snsEnvelope = {
  Type: 'Notification',
  Message: JSON.stringify(sesNotification),
};

const body = JSON.stringify(snsEnvelope);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/webhooks/ses-inbound',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  },
};

console.log('=== TRAE Orchestration Test ===');
console.log('Sending test inbound email to webhook...\n');

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    console.log(`Webhook HTTP status: ${res.statusCode}`);
    console.log(`Webhook response: ${data}\n`);
    if (res.statusCode === 200) {
      console.log('✅ Webhook accepted. AI pipeline triggered asynchronously.');
      console.log('\nNow tailing logs for 40 seconds to watch all 6 agents execute...');
      console.log('(Check backend logs for: WorkflowEngine, SummarizerAgent, TaskExtractorAgent,');
      console.log(' PriorityAgent, DeadlineAgent, IntentAgent, ReplyAgent)\n');
    } else {
      console.log('❌ Webhook returned error. Check logs.');
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Request failed: ${e.message}`);
  console.error('Is the backend running on port 5000?');
});

req.write(body);
req.end();
