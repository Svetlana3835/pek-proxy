const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/pek') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { authorization, payload } = JSON.parse(body);
        const postData = JSON.stringify(payload);
        const options = {
          hostname: 'kabinet.pecom.ru',
          path: '/api/v1/branches/calculateprice/',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authorization,
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        const proxyReq = https.request(options, proxyRes => {
          let data = '';
          proxyRes.on('data', chunk => data += chunk);
          proxyRes.on('end', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
          });
        });
        proxyReq.on('error', e => {
          res.writeHead(500);
          res.end(JSON.stringify({ error: e.message }));
        });
        proxyReq.write(postData);
        proxyReq.end();
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
  }
});

server.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
