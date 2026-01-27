
const http = require('http');

http.get('http://localhost:3000/api/e2e/ready', (res) => {
  console.log('Status:', res.statusCode);
  res.resume();
}).on('error', (e) => {
  console.error('Error:', e.message);
  process.exit(1);
});
